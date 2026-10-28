import { describe, expect, it } from 'vitest';
import { editorialManifestRequest, validateEditorialHost } from '../../../scripts/editorial-http.mjs';

const service = { CF_ACCESS_CLIENT_ID: 'test-only-id.access', CF_ACCESS_CLIENT_SECRET: 'test-only-secret' };

describe('lectures éditoriales protégées par Cloudflare Access', () => {
  it('adds both service headers only to a validated LEVOIS preview host', () => {
    const request = editorialManifestRequest('https://editorial-preview.levois-site.pages.dev/', {}, service);
    expect(request.url.href).toBe('https://editorial-preview.levois-site.pages.dev/editorial-manifest.json');
    expect(request.options.headers.get('CF-Access-Client-Id')).toBe(service.CF_ACCESS_CLIENT_ID);
    expect(request.options.headers.get('CF-Access-Client-Secret')).toBe(service.CF_ACCESS_CLIENT_SECRET);
    expect(request.options.method).toBe('GET');
    expect(request.options.redirect).toBe('error');
  });

  it.each(['https://levois.fr/', 'https://www.levois.fr/', 'https://levois-site.pages.dev/'])('does not send preview credentials to %s', (host) => {
    const request = editorialManifestRequest(host, {}, service);
    expect(request.options.headers.has('CF-Access-Client-Id')).toBe(false);
    expect(request.options.headers.has('CF-Access-Client-Secret')).toBe(false);
  });

  it('supports a preview without service credentials and still refuses redirects', () => {
    const request = editorialManifestRequest('https://abc123.levois-site.pages.dev/', {}, {});
    expect(request.options.headers.has('CF-Access-Client-Id')).toBe(false);
    expect(request.options.redirect).toBe('error');
  });

  it.each([
    'http://editorial-preview.levois-site.pages.dev/',
    'https://levois-site.pages.dev.attacker.example/',
    'https://preview.levois-site.pages.dev.attacker.example/',
    'https://other-project.pages.dev/',
    'https://foo.bar.levois-site.pages.dev/',
    'https://secret@preview.levois-site.pages.dev/',
    'https://preview.levois-site.pages.dev:444/',
    'https://preview.levois-site.pages.dev/private/',
    'https://preview.levois-site.pages.dev/?token=secret',
    'https://preview.levois-site.pages.dev/#secret',
  ])('rejects an untrusted or ambiguous host before building any request: %s', (host) => {
    expect(() => editorialManifestRequest(host, {}, service)).toThrow();
  });

  it.each([
    { CF_ACCESS_CLIENT_ID: service.CF_ACCESS_CLIENT_ID },
    { CF_ACCESS_CLIENT_SECRET: service.CF_ACCESS_CLIENT_SECRET },
    { ...service, CF_ACCESS_CLIENT_SECRET: '' },
    { ...service, CF_ACCESS_CLIENT_ID: '' },
  ])('refuses partial service credentials without echoing their values', (credentials) => {
    let message = '';
    try { editorialManifestRequest('https://abc123.levois-site.pages.dev/', {}, credentials); } catch (error) { message = (error as Error).message; }
    expect(message).toContain('fournis ensemble');
    expect(message).not.toContain(service.CF_ACCESS_CLIENT_ID);
    expect(message).not.toContain(service.CF_ACCESS_CLIENT_SECRET);
  });

  it('refuses malformed credentials and keeps credentials out of URLs', () => {
    expect(() => editorialManifestRequest('https://abc123.levois-site.pages.dev/', {}, { ...service, CF_ACCESS_CLIENT_SECRET: 'bad\r\nHeader: value' })).toThrow(/invalides/);
    const request = editorialManifestRequest('https://abc123.levois-site.pages.dev/', { release: 'a'.repeat(64), noStore: true }, service);
    expect(request.url.search).toBe(`?release=${'a'.repeat(64)}`);
    expect(request.url.href).not.toContain(service.CF_ACCESS_CLIENT_SECRET);
    expect(request.options.cache).toBe('no-store');
    expect(request.options.redirect).toBe('error');
    expect(() => editorialManifestRequest('https://abc123.levois-site.pages.dev/', { release: 'secret-or-url' }, service)).toThrow(/Empreinte/);
    expect(validateEditorialHost(new URL('https://abc123.levois-site.pages.dev/')).hostname).toBe('abc123.levois-site.pages.dev');
  });
});
