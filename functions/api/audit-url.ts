import { analyseListing, type ListingSnapshot } from '../../src/lib/audit-url';
import { PayloadTooLargeError, readBoundedJson } from '../lib/bounded-json';

interface Env {
  AUDIT_ALLOWED_HOSTS?: string;
  AUDIT_STRICT_PUBLIC_CONFIRMED?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

const MAX_HTML_BYTES = 800_000;
const MAX_REDIRECTS = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 12;
// Décision P0 V1 : le produit public reste exclusivement un questionnaire.
// La réactivation exigera un changement de code explicite après validation
// Cloudflare, allowlist et tests de sécurité ; aucune variable d'environnement
// ne peut lever ce verrou dans ce checkpoint.
const AUTOMATIC_EXTRACTION_RELEASED = false;
const rate = new Map<string, { count: number; startedAt: number }>();

type ExtractionEvidence = {
  structuredListing: boolean;
};

type SnapshotExtraction = {
  snapshot: ListingSnapshot;
  evidence: ExtractionEvidence;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function rateLimited(request: Request): boolean {
  const ip = (request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown').trim().slice(0, 128);
  const now = Date.now();
  const entry = rate.get(ip);
  if (!entry || now - entry.startedAt >= RATE_WINDOW_MS) {
    rate.set(ip, { count: 1, startedAt: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count += 1;
  return false;
}

function publicHttpUrl(value: unknown): URL | null {
  if (typeof value !== 'string' || value.length > 2_000) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if (url.port && url.port !== '443') return null;
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (
      !host
      || host === 'localhost'
      || host.endsWith('.localhost')
      || host.endsWith('.local')
      || host.endsWith('.internal')
      || host === 'levois.fr'
      || host.endsWith('.levois.fr')
    ) return null;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':')) return null;
    return url;
  } catch {
    return null;
  }
}

function decodeEntities(value = ''): string {
  const named: Record<string, string> = { amp: '&', quot: '"', apos: "'", nbsp: ' ', lt: '<', gt: '>' };
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match)
    .replace(/\s+/g, ' ')
    .trim();
}

function meta(html: string, key: string): string {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const identity = tag.match(/(?:property|name)\s*=\s*(["'])(.*?)\1/i)?.[2];
    if (identity?.toLowerCase() !== key.toLowerCase()) continue;
    const value = tag.match(/content\s*=\s*(["'])(.*?)\1/i)?.[2];
    if (value) return decodeEntities(value);
  }
  return '';
}

function jsonLdObjects(html: string): Record<string, unknown>[] {
  const objects: Record<string, unknown>[] = [];
  const scripts = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  const visit = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== 'object') return;
    const object = value as Record<string, unknown>;
    objects.push(object);
    if (Array.isArray(object['@graph'])) object['@graph'].forEach(visit);
  };
  for (const match of scripts) {
    try { visit(JSON.parse(match[1])); } catch { /* Un JSON-LD cassé ne bloque pas le secours OpenGraph. */ }
  }
  return objects;
}

function text(value: unknown): string {
  return typeof value === 'string' ? decodeEntities(value) : '';
}

function allowedHosts(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim().toLowerCase().replace(/^\.+|\.$/g, ''))
    .filter((item) => Boolean(item) && /^[a-z0-9.-]+$/.test(item) && item.includes('.'));
}

function isAllowedHost(hostname: string, allowlist: string[]): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return allowlist.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

function normalized(value: string): string {
  return decodeEntities(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/²/g, '2')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function schemaTypes(object: Record<string, unknown>): string[] {
  const value = object['@type'];
  return (Array.isArray(value) ? value : [value]).map(text).map(normalized).filter(Boolean);
}

const STRUCTURED_LISTING_TYPES = new Set([
  'house',
  'apartment',
  'single family residence',
  'real estate listing',
]);

function looksLikeProperty(value: string): boolean {
  const candidate = normalized(value);
  return /\b(maison|appartement|studio|terrain|villa|duplex|triplex|loft|chalet|ferme|propriete|immeuble|parking|garage|local commercial|fonds de commerce|chambre|sejour|jardin|terrasse|balcon|dpe)\b/.test(candidate)
    || /\b\d{1,4}\s*(m2|metres? carres?|pieces?|chambres?)\b/.test(candidate);
}

function isStructuredListing(object: Record<string, unknown>): boolean {
  return schemaTypes(object).some((type) => STRUCTURED_LISTING_TYPES.has(type));
}

function sourceBrand(source: string): string {
  const labels = source.toLowerCase().replace(/^www\./, '').split('.').filter(Boolean);
  const candidate = labels.length > 1 ? labels[labels.length - 2] : labels[0];
  return normalized(candidate ?? '').replace(/\s+/g, '');
}

function isGenericTitle(candidate: string): boolean {
  return /^(a vendre|vente|location|bien immobilier|annonce immobiliere|(maison|appartement|studio|terrain|villa|duplex|triplex|loft|chalet|ferme|propriete|immeuble|parking|garage|local commercial)( a vendre| en vente| a louer| en location)?)$/.test(candidate)
    || (/^(accueil|immobilier|annonces? immobilieres?|agence immobiliere|reseau immobilier|site de petites annonces|biens immobiliers?)(\b|$)/.test(candidate)
      && !looksLikeProperty(candidate));
}

function removeCompactPhrase(candidate: string, compactPhrase: string): string {
  const tokens = candidate.split(' ').filter(Boolean);
  for (let start = 0; start < tokens.length; start += 1) {
    let compact = '';
    for (let end = start; end < tokens.length && compact.length <= compactPhrase.length; end += 1) {
      compact += tokens[end];
      if (compact === compactPhrase) return [...tokens.slice(0, start), ...tokens.slice(end + 1)].join(' ');
    }
  }
  return candidate;
}

function isPortalOrBrandTitle(title: string, source: string): boolean {
  const candidate = normalized(title);
  if (!candidate) return true;
  if (/\b(page introuvable|erreur 404|acces refuse|access denied|just a moment|verification de securite|connexion|captcha)\b/.test(candidate)) return true;
  if (isGenericTitle(candidate)) return true;

  const brand = sourceBrand(source);
  if (brand && candidate.replace(/\s+/g, '').includes(brand)) {
    const withoutBrand = removeCompactPhrase(candidate, brand);
    if (isGenericTitle(withoutBrand) || !looksLikeProperty(withoutBrand)) return true;
  }
  return false;
}

function descriptionEvidence(value: string): { score: number; listingDetail: boolean } {
  const candidate = normalized(value);
  const propertyType = /\b(maison|appartement|studio|terrain|villa|duplex|triplex|loft|chalet|ferme|propriete|immeuble|local commercial)\b/.test(candidate);
  const surface = /\b\d{1,4}\s*(m2|metres? carres?)\b/.test(candidate);
  const rooms = /\b(\d+|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)\s*(pieces?|chambres?)\b/.test(candidate);
  const features = /\b(sejour|jardin|terrasse|balcon|garage|parking|cave|grenier|piscine)\b/.test(candidate);
  const condition = /\b(dpe|diagnostic|renove|renovee|travaux|classe energie)\b/.test(candidate);
  return {
    score: [propertyType, surface, rooms, features, condition].filter(Boolean).length,
    listingDetail: surface || rooms,
  };
}

function hasReliableEvidence({ snapshot, evidence }: SnapshotExtraction): boolean {
  const title = decodeEntities(snapshot.title).replace(/\s+/g, ' ').trim();
  const description = decodeEntities(snapshot.description).replace(/\s+/g, ' ').trim();
  if (isPortalOrBrandTitle(title, snapshot.source)) return false;
  if (description.length < 60) return false;
  const descriptionSignals = descriptionEvidence(description);
  if (evidence.structuredListing) {
    return descriptionSignals.score >= 2
      && descriptionSignals.listingDetail
      && (Boolean(snapshot.price) || Boolean(snapshot.location));
  }
  return descriptionSignals.score >= 3
    && descriptionSignals.listingDetail
    && (Boolean(snapshot.price) || Boolean(snapshot.location));
}

function extractSnapshot(html: string, url: URL): SnapshotExtraction {
  const objects = jsonLdObjects(html);
  const listing = objects.find(isStructuredListing);
  const structuredListing = Boolean(listing);
  const structured = listing ?? {};

  const offers = structured.offers && typeof structured.offers === 'object' ? structured.offers as Record<string, unknown> : {};
  const rawPrice = text(offers.price) || meta(html, 'product:price:amount');
  const currency = text(offers.priceCurrency) || meta(html, 'product:price:currency') || 'EUR';
  const price = rawPrice ? `${rawPrice}${currency === 'EUR' ? ' €' : ` ${currency}`}` : '';
  const htmlTitle = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');

  return {
    evidence: { structuredListing },
    snapshot: {
      url: url.toString(),
      source: url.hostname.replace(/^www\./, ''),
      title: text(structured.headline) || text(structured.name) || meta(html, 'og:title') || htmlTitle,
      description: text(structured.description) || meta(html, 'og:description') || meta(html, 'description'),
      price,
      location: meta(html, 'og:locality'),
    },
  };
}

async function readLimited(response: Response): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_HTML_BYTES) {
      await reader.cancel();
      throw new Error('PAGE_TOO_LARGE');
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(merged);
}

async function fetchPage(initial: URL, allowlist: string[]): Promise<{ html: string; finalUrl: URL }> {
  let current = initial;
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const response = await fetch(current.toString(), {
      method: 'GET',
      redirect: 'manual',
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'LEVOIS-Listing-Audit/1.0 (+https://levois.fr/audit-annonce)',
      },
      signal: AbortSignal.timeout(9_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || redirects === MAX_REDIRECTS) throw new Error('REDIRECT');
      const next = publicHttpUrl(new URL(location, current).toString());
      if (!next) throw new Error('INVALID_REDIRECT');
      if (!isAllowedHost(next.hostname, allowlist)) throw new Error('UNSUPPORTED_HOST');
      current = next;
      continue;
    }
    if ([401, 403, 429].includes(response.status)) throw new Error('BLOCKED');
    if (!response.ok) throw new Error('UNAVAILABLE');
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('text/html')) throw new Error('NOT_HTML');
    return { html: await readLimited(response), finalUrl: current };
  }
  throw new Error('REDIRECT');
}

export const runAutomaticExtractionCandidate = async ({ request, env }: PagesContext): Promise<Response> => {
  if (!sameOrigin(request)) return json({ ok: false, message: 'Origine non autorisée.' }, 403);
  if (rateLimited(request)) return json({ ok: false, message: 'Trop de lectures successives. Réessayez dans quelques minutes.' }, 429);
  let body: unknown;
  try {
    body = await readBoundedJson(request);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return json({ ok: false, message: 'Requête trop volumineuse.' }, 413);
    }
    return json({ ok: false, message: 'Lien invalide.' }, 400);
  }
  const url = publicHttpUrl(body && typeof body === 'object' ? (body as Record<string, unknown>).url : null);
  if (!url) return json({ ok: false, message: 'Collez un lien public commençant par https://.', fallback: true }, 400);
  const allowlist = allowedHosts(env.AUDIT_ALLOWED_HOSTS);
  if (env.AUDIT_STRICT_PUBLIC_CONFIRMED !== 'true' || !isAllowedHost(url.hostname, allowlist)) {
    return json({
      ok: false,
      message: 'Ce portail n’est pas encore autorisé pour la lecture automatique. Le questionnaire prend le relais sans ouvrir le lien côté serveur.',
      fallback: true,
      reason: 'unsupported-host',
    }, 422);
  }

  try {
    const { html, finalUrl } = await fetchPage(url, allowlist);
    const extraction = extractSnapshot(html, finalUrl);
    if (!hasReliableEvidence(extraction)) {
      return json({
        ok: false,
        message: 'La page est accessible, mais les éléments lus ne permettent pas de confirmer qu’il s’agit bien de votre annonce. Le questionnaire prend le relais sans tirer de conclusion du contenu extrait.',
        fallback: true,
        reason: 'low-confidence',
        url: finalUrl.toString(),
      }, 422);
    }
    const { snapshot } = extraction;
    return json({ ok: true, snapshot, analysis: analyseListing(snapshot) });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNAVAILABLE';
    const unsupported = code === 'UNSUPPORTED_HOST';
    const blocked = ['BLOCKED', 'REDIRECT', 'INVALID_REDIRECT'].includes(code);
    return json({
      ok: false,
      message: unsupported
        ? 'La page redirige vers un portail qui n’est pas autorisé pour la lecture automatique. Le questionnaire prend le relais.'
        : blocked
        ? 'Ce site d’annonces refuse qu’un autre service lise automatiquement ses pages. Ce n’est ni une erreur de votre lien ni un problème avec votre annonce.'
        : 'La page n’est pas accessible pour le moment. Ce n’est pas nécessairement un problème avec votre annonce.',
      fallback: true,
      reason: unsupported ? 'unsupported-host' : blocked ? 'blocked' : 'unavailable',
      url: url.toString(),
    }, 422);
  }
};

export const onRequestPost = async (ctx: PagesContext): Promise<Response> => {
  if (!sameOrigin(ctx.request)) return json({ ok: false, message: 'Origine non autorisée.' }, 403);
  if (!AUTOMATIC_EXTRACTION_RELEASED) {
    return json({
      ok: false,
      message: 'La lecture automatique est désactivée. Le questionnaire constitue le seul parcours disponible.',
      fallback: true,
      reason: 'questionnaire-only',
    }, 422);
  }
  return runAutomaticExtractionCandidate(ctx);
};

export const onRequest = async (ctx: PagesContext): Promise<Response> => {
  if (ctx.request.method === 'POST') return onRequestPost(ctx);
  return json({ ok: false, message: 'Méthode non autorisée.' }, 405);
};
