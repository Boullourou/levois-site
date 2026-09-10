import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost } from '../../../functions/api/audit-url';
import { classifyAuditResponse, buildAuditResult } from './audit';
import { createContext } from './context';

let requestIndex = 0;
const request = (url = 'https://example.test/annonce') => new Request('https://levois.fr/api/audit-url/', { method: 'POST', headers: { origin: 'https://levois.fr', 'content-type': 'application/json', 'cf-connecting-ip': `audit-test-${++requestIndex}` }, body: JSON.stringify({ url }) });
afterEach(() => vi.unstubAllGlobals());

describe('Actual audit URL API → public adapter contract', () => {
  it('extracts a real HTML fixture through the handler and produces exactly two actions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<!doctype html><title>Maison avec jardin</title><meta name="description" content="Un séjour lumineux et deux chambres.">', { headers: { 'content-type': 'text/html' } })));
    const response = await onRequestPost({ request: request() });
    const payload = await response.json();
    expect(response.status).toBe(200);
    const adapted = classifyAuditResponse(response.status, payload, 'https://example.test/annonce');
    expect(adapted.kind).toBe('ready');
    if (adapted.kind !== 'ready') return;
    expect(adapted.page.access).toBe('readable');
    expect(adapted.page.snapshot.title).toBe('Maison avec jardin');
    expect(buildAuditResult(adapted.page, { duration: '7-30', signal: 'vues-sans-contact', context: 'rien-modifie' }, createContext('audit')).analysis.tips).toHaveLength(2);
  });
  it('keeps the real portal refusal distinct from a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Forbidden', { status: 403 })));
    const response = await onRequestPost({ request: request() });
    const payload = await response.json();
    expect(payload.reason).toBe('blocked');
    expect(classifyAuditResponse(response.status, payload, 'https://example.test/annonce')).toMatchObject({ kind: 'ready', page: { access: 'blocked' } });
  });
  it('recognizes insufficient content using the exact current API response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html><body>Contenu sans métadonnées exploitables</body></html>', { headers: { 'content-type': 'text/html' } })));
    const response = await onRequestPost({ request: request() });
    const payload = await response.json();
    expect(payload.reason).toBe('unavailable');
    expect(classifyAuditResponse(response.status, payload, 'https://example.test/annonce')).toMatchObject({ kind: 'ready', page: { access: 'insufficient' } });
  });
  it('does not invent a portal refusal when the handler cannot fetch the page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network unavailable')));
    const response = await onRequestPost({ request: request() });
    expect(classifyAuditResponse(response.status, await response.json(), 'https://example.test/annonce')).toMatchObject({ kind: 'ready', page: { access: 'unavailable' } });
  });
  it('keeps invalid local/private links correctable instead of entering a false blocked state', async () => {
    const upstream = vi.fn(); vi.stubGlobal('fetch', upstream);
    const response = await onRequestPost({ request: request('http://localhost/private') });
    expect(response.status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
    expect(classifyAuditResponse(response.status, await response.json(), 'http://localhost/private').kind).toBe('invalid');
  });
});
