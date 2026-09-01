import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  onRequest as lockedEndpoint,
  runAutomaticExtractionCandidate as onRequest,
} from '../functions/api/audit-url';

const DEFAULT_ALLOWED_HOSTS = [
  'annonces.example',
  'conseils.example',
  'estimation.example',
  'programme.example',
  'safti.example',
  'safti.fr',
  'sejours.example',
].join(',');
let auditIp = 10;

function context(
  url: unknown,
  origin = 'https://levois.fr',
  allowedHosts = DEFAULT_ALLOWED_HOSTS,
  rawBody?: string,
  contentLength?: string,
) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    origin,
    'cf-connecting-ip': `198.51.100.${auditIp++}`,
  };
  if (contentLength) headers['content-length'] = contentLength;
  return {
    request: new Request('https://levois.fr/api/audit-url', {
      method: 'POST',
      headers,
      body: rawBody ?? JSON.stringify({ url }),
    }),
    env: { AUDIT_ALLOWED_HOSTS: allowedHosts, AUDIT_STRICT_PUBLIC_CONFIRMED: 'true' },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Cloudflare /api/audit-url', () => {
  it('reste verrouillé en mode questionnaire, même si la configuration future est renseignée', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await lockedEndpoint(context('https://annonces.example/bien'));
    const payload = await response.json() as any;
    expect(response.status).toBe(422);
    expect(payload).toMatchObject({ ok: false, fallback: true, reason: 'questionnaire-only' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('suspend la lecture d’un domaine non autorisé sans aucun fetch sortant', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await onRequest(context('https://inconnu.example/annonce', 'https://levois.fr', 'annonces.example'));
    const payload = await response.json() as any;
    expect(response.status).toBe(422);
    expect(payload).toMatchObject({ ok: false, fallback: true, reason: 'unsupported-host' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reste suspendu tant que le mode fetch strictement public n’est pas confirmé', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const ctx = context('https://annonces.example/annonce');
    ctx.env.AUDIT_STRICT_PUBLIC_CONFIRMED = 'false';
    const response = await onRequest(ctx);
    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuse HTTP à l’entrée et après une redirection HTTPS', async () => {
    const initial = await onRequest(context('http://annonces.example/bien'));
    expect(initial.status).toBe(400);

    const fetchMock = vi.fn().mockResolvedValue(new Response('', {
      status: 302,
      headers: { location: 'http://annonces.example/bien-final' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    const redirect = await onRequest(context('https://annonces.example/bien'));
    const payload = await redirect.json() as any;
    expect(redirect.status).toBe(422);
    expect(payload).toMatchObject({ ok: false, fallback: true, reason: 'blocked' });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('refuse un corps JSON trop volumineux avec ou sans Content-Length fiable', async () => {
    const huge = JSON.stringify({ url: 'https://annonces.example/bien', padding: 'x'.repeat(70_000) });
    const streamed = await onRequest(context(null, 'https://levois.fr', DEFAULT_ALLOWED_HOSTS, huge));
    expect(streamed.status).toBe(413);

    const declared = await onRequest(context(
      'https://annonces.example/bien',
      'https://levois.fr',
      DEFAULT_ALLOWED_HOSTS,
      undefined,
      '70000',
    ));
    expect(declared.status).toBe(413);
  });

  it('extrait une annonce suffisamment étayée et renvoie exactement deux conseils', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(`<!doctype html><html><head>
      <meta property="og:title" content="Maison familiale avec jardin à Chartres">
      <meta property="og:description" content="Maison lumineuse de 118 m² avec trois chambres, un jardin clos et une gare accessible à pied.">
      <meta property="og:image" content="https://img.test/1.jpg">
      <meta property="product:price:amount" content="315000">
    </head></html>`, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })));

    const response = await onRequest(context('https://annonces.example/bien'));
    const payload = await response.json() as any;
    expect(response.status).toBe(200);
    expect(payload.snapshot.title).toBe('Maison familiale avec jardin à Chartres');
    expect(payload.snapshot.description).toContain('118 m²');
    expect(payload.snapshot.photoCount).toBeUndefined();
    expect(payload.analysis.facts.join(' ')).not.toContain('1 photo');
    expect(payload.analysis.tips).toHaveLength(2);
  });

  it('accepte un balisage immobilier structuré explicite', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(`<!doctype html><html><head>
      <script type="application/ld+json">{
        "@context": "https://schema.org",
        "@type": "SingleFamilyResidence",
        "name": "Maison familiale avec jardin à Lèves",
        "description": "Maison rénovée de 125 m² avec quatre chambres, un séjour traversant et un jardin clos.",
        "offers": { "@type": "Offer", "price": "315000", "priceCurrency": "EUR" }
      }</script>
    </head></html>`, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })));

    const response = await onRequest(context('https://annonces.example/bien-structure'));
    const payload = await response.json() as any;
    expect(response.status).toBe(200);
    expect(payload.snapshot).toMatchObject({
      title: 'Maison familiale avec jardin à Lèves',
      price: '315000 €',
    });
    expect(payload.analysis.tips).toHaveLength(2);
  });

  it('rejette une page éditoriale balisée House sans preuve d’annonce', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(`<!doctype html><html><head>
      <script type="application/ld+json">{
        "@context": "https://schema.org",
        "@type": "House",
        "name": "Comment rénover une maison ancienne",
        "description": "Cette maison de 120 m² avec quatre chambres et un jardin illustre les étapes générales d’un projet de rénovation."
      }</script>
    </head></html>`, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })));

    const response = await onRequest(context('https://conseils.example/renover-maison'));
    const payload = await response.json() as any;
    expect(response.status).toBe(422);
    expect(payload).toMatchObject({ ok: false, fallback: true, reason: 'low-confidence' });
  });

  it('rejette un hébergement Accommodation même avec un prix', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(`<!doctype html><html><head>
      <script type="application/ld+json">{
        "@context": "https://schema.org",
        "@type": "Accommodation",
        "name": "Séjour dans une maison avec jardin",
        "description": "Maison de 95 m² avec trois chambres, un jardin, une terrasse et un garage proposés pour votre prochain séjour.",
        "offers": { "@type": "Offer", "price": "180", "priceCurrency": "EUR" }
      }</script>
    </head></html>`, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })));

    const response = await onRequest(context('https://sejours.example/maison-jardin'));
    const payload = await response.json() as any;
    expect(response.status).toBe(422);
    expect(payload).toMatchObject({ ok: false, fallback: true, reason: 'low-confidence' });
  });

  it('rejette un programme ApartmentComplex malgré des détails et un prix', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(`<!doctype html><html><head>
      <script type="application/ld+json">{
        "@context": "https://schema.org",
        "@type": "ApartmentComplex",
        "name": "Résidence neuve Les Jardins de Chartres",
        "description": "Programme de 40 appartements de 62 m² avec trois pièces, balcon, parking et jardin partagé à Chartres.",
        "offers": { "@type": "Offer", "price": "250000", "priceCurrency": "EUR" }
      }</script>
    </head></html>`, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })));

    const response = await onRequest(context('https://programme.example/jardins-chartres'));
    const payload = await response.json() as any;
    expect(response.status).toBe(422);
    expect(payload).toMatchObject({ ok: false, fallback: true, reason: 'low-confidence' });
  });

  it('rejette le titre de marque d’un portail et bascule vers le questionnaire', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(`<!doctype html><html><head>
      <title>SAFTI — réseau national de conseillers immobiliers</title>
      <meta name="description" content="Retrouvez toutes les annonces immobilières du réseau et trouvez votre futur logement.">
      <meta property="og:image" content="https://safti.example/logo.jpg">
    </head></html>`, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })));

    const response = await onRequest(context('https://www.safti.fr/annonces'));
    const payload = await response.json() as any;
    expect(response.status).toBe(422);
    expect(payload).toMatchObject({ ok: false, fallback: true, reason: 'low-confidence' });
    expect(payload.snapshot).toBeUndefined();
    expect(payload.analysis).toBeUndefined();
  });

  it('rejette aussi un titre composé d’une marque et d’un intitulé générique', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(`<!doctype html><html><head>
      <title>SAFTI — Maison à vendre</title>
      <meta name="description" content="Maison de 110 m² avec quatre chambres, un séjour lumineux, un jardin et un garage.">
      <meta property="og:image" content="https://safti.example/logo.jpg">
      <meta property="product:price:amount" content="299000">
    </head></html>`, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })));

    const response = await onRequest(context('https://www.safti.fr/annonces'));
    const payload = await response.json() as any;
    expect(response.status).toBe(422);
    expect(payload).toMatchObject({ ok: false, fallback: true, reason: 'low-confidence' });
  });

  it('rejette une extraction ambiguë au lieu de produire des conseils', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(`<!doctype html><html><head>
      <meta property="og:title" content="Une nouveauté à Chartres">
      <meta property="og:description" content="Découvrez cette maison sur notre portail et contactez notre équipe pour recevoir plus d’informations.">
      <meta property="og:image" content="https://annonces.example/logo.jpg">
    </head></html>`, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })));

    const response = await onRequest(context('https://annonces.example/bien'));
    const payload = await response.json() as any;
    expect(response.status).toBe(422);
    expect(payload).toMatchObject({ ok: false, fallback: true, reason: 'low-confidence' });
    expect(payload.snapshot).toBeUndefined();
    expect(payload.analysis).toBeUndefined();
  });

  it('ignore un Product JSON-LD qui décrit un service immobilier', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(`<!doctype html><html><head>
      <meta property="og:title" content="Estimez votre maison en ligne">
      <meta property="og:description" content="Notre service immobilier estime votre maison et vous accompagne dans votre projet de vente.">
      <meta property="og:image" content="https://estimation.example/logo.jpg">
      <script type="application/ld+json">{
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Service d’estimation de maison",
        "description": "Une estimation immobilière en ligne pour préparer la vente de votre maison.",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" }
      }</script>
    </head></html>`, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })));

    const response = await onRequest(context('https://estimation.example/service'));
    const payload = await response.json() as any;
    expect(response.status).toBe(422);
    expect(payload).toMatchObject({ ok: false, fallback: true, reason: 'low-confidence' });
  });

  it('rejette un titre d’annonce générique même si la page expose des détails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(`<!doctype html><html><head>
      <meta property="og:title" content="Maison à vendre">
      <meta property="og:description" content="Maison de 110 m² avec quatre chambres, un séjour lumineux, un jardin et un garage.">
      <meta property="og:image" content="https://img.test/1.jpg">
    </head></html>`, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })));

    const response = await onRequest(context('https://annonces.example/bien'));
    const payload = await response.json() as any;
    expect(response.status).toBe(422);
    expect(payload).toMatchObject({ ok: false, fallback: true, reason: 'low-confidence' });
  });

  it('propose le secours lorsque le portail bloque la lecture', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('interdit', { status: 403 })));
    const response = await onRequest(context('https://annonces.example/bien'));
    const payload = await response.json() as any;
    expect(response.status).toBe(422);
    expect(payload.fallback).toBe(true);
    expect(payload.url).toBe('https://annonces.example/bien');
  });

  it('refuse les destinations locales et les soumissions cross-site', async () => {
    const local = await onRequest(context('http://localhost:3000/admin'));
    expect(local.status).toBe(400);
    const crossSite = await onRequest(context('https://annonces.example/bien', 'https://spam.example'));
    expect(crossSite.status).toBe(403);
  });
});
