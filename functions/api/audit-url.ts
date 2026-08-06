import { analyseListing, type ListingSnapshot } from '../../src/lib/audit-url';

interface PagesContext {
  request: Request;
}

const MAX_HTML_BYTES = 800_000;
const MAX_REDIRECTS = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 12;
const rate = new Map<string, { count: number; startedAt: number }>();

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
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    if (url.port && !['80', '443'].includes(url.port)) return null;
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return null;
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

function extractSnapshot(html: string, url: URL): ListingSnapshot {
  const objects = jsonLdObjects(html);
  const listing = objects.find((object) => {
    const type = Array.isArray(object['@type']) ? object['@type'].join(' ') : text(object['@type']);
    return /house|apartment|residence|product|offer|realestate|accommodation/i.test(type);
  }) ?? objects.find((object) => object.description || object.headline || object.offers) ?? {};

  const images = new Set<string>();
  const addImages = (value: unknown) => {
    if (typeof value === 'string') images.add(value);
    if (Array.isArray(value)) value.forEach((item) => {
      if (typeof item === 'string') images.add(item);
      else if (item && typeof item === 'object') {
        const candidate = text((item as Record<string, unknown>).url) || text((item as Record<string, unknown>).contentUrl);
        if (candidate) images.add(candidate);
      }
    });
  };
  addImages(listing.image);
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const identity = tag.match(/property\s*=\s*(["'])(.*?)\1/i)?.[2]?.toLowerCase();
    const value = tag.match(/content\s*=\s*(["'])(.*?)\1/i)?.[2];
    if ((identity === 'og:image' || identity === 'og:image:url') && value) images.add(value);
  }

  const offers = listing.offers && typeof listing.offers === 'object' ? listing.offers as Record<string, unknown> : {};
  const rawPrice = text(offers.price) || meta(html, 'product:price:amount');
  const currency = text(offers.priceCurrency) || meta(html, 'product:price:currency') || 'EUR';
  const price = rawPrice ? `${rawPrice}${currency === 'EUR' ? ' €' : ` ${currency}`}` : '';
  const htmlTitle = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');

  return {
    url: url.toString(),
    source: url.hostname.replace(/^www\./, ''),
    title: text(listing.headline) || text(listing.name) || meta(html, 'og:title') || htmlTitle,
    description: text(listing.description) || meta(html, 'og:description') || meta(html, 'description'),
    price,
    photoCount: images.size || undefined,
    location: meta(html, 'og:locality'),
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

async function fetchPage(initial: URL): Promise<{ html: string; finalUrl: URL }> {
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

export const onRequestPost = async ({ request }: PagesContext): Promise<Response> => {
  if (!sameOrigin(request)) return json({ ok: false, message: 'Origine non autorisée.' }, 403);
  if (rateLimited(request)) return json({ ok: false, message: 'Trop de lectures successives. Réessayez dans quelques minutes.' }, 429);
  let body: unknown;
  try { body = await request.json(); } catch { return json({ ok: false, message: 'Lien invalide.' }, 400); }
  const url = publicHttpUrl(body && typeof body === 'object' ? (body as Record<string, unknown>).url : null);
  if (!url) return json({ ok: false, message: 'Collez un lien public commençant par https://.', fallback: true }, 400);

  try {
    const { html, finalUrl } = await fetchPage(url);
    const snapshot = extractSnapshot(html, finalUrl);
    if (!snapshot.title && !snapshot.description) {
      return json({ ok: false, message: 'La page est accessible, mais elle ne fournit pas assez d’informations lisibles automatiquement.', fallback: true, reason: 'unavailable', url: finalUrl.toString() }, 422);
    }
    return json({ ok: true, snapshot, analysis: analyseListing(snapshot) });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNAVAILABLE';
    const blocked = ['BLOCKED', 'REDIRECT', 'INVALID_REDIRECT'].includes(code);
    return json({
      ok: false,
      message: blocked
        ? 'Ce site d’annonces refuse qu’un autre service lise automatiquement ses pages. Ce n’est ni une erreur de votre lien ni un problème avec votre annonce.'
        : 'La page n’est pas accessible pour le moment. Ce n’est pas nécessairement un problème avec votre annonce.',
      fallback: true,
      reason: blocked ? 'blocked' : 'unavailable',
      url: url.toString(),
    }, 422);
  }
};

export const onRequest = async (ctx: PagesContext): Promise<Response> => {
  if (ctx.request.method === 'POST') return onRequestPost(ctx);
  return json({ ok: false, message: 'Méthode non autorisée.' }, 405);
};
