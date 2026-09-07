import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequest } from '../functions/api/audit-url';

function context(url: unknown, origin = 'https://levois.fr') {
  return {
    request: new Request('https://levois.fr/api/audit-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({ url }),
    }),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Cloudflare /api/audit-url', () => {
  it('extrait une annonce et renvoie exactement deux conseils', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(`<!doctype html><html><head>
      <meta property="og:title" content="Maison à vendre">
      <meta property="og:description" content="Maison lumineuse avec trois chambres et beaucoup d'espace.">
      <meta property="og:image" content="https://img.test/1.jpg">
    </head></html>`, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })));

    const response = await onRequest(context('https://annonces.example/bien'));
    const payload = await response.json() as any;
    expect(response.status).toBe(200);
    expect(payload.snapshot.title).toBe('Maison à vendre');
    expect(payload.snapshot.description).toContain("beaucoup d'espace");
    expect(payload.analysis.tips).toHaveLength(2);
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
