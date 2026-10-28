/** Service credentials are scoped to LEVOIS preview hosts and never logged. */
const previewHostname = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.levois-site\.pages\.dev$/;
const publicHostnames = new Set(['levois.fr', 'www.levois.fr', 'levois-site.pages.dev']);

export function validateEditorialHost(value) {
  let host;
  try { host = new URL(value); } catch { throw new Error('Hôte LEVOIS HTTPS invalide'); }
  if (host.protocol !== 'https:' || host.username || host.password || host.port || host.pathname !== '/' || host.search || host.hash || (!publicHostnames.has(host.hostname) && !previewHostname.test(host.hostname))) {
    throw new Error('Hôte LEVOIS HTTPS attendu, sans chemin, identifiants ni paramètres');
  }
  return host;
}

/**
 * Only a fixed public manifest may be requested; redirects cannot carry a token away.
 * @param {string | URL} hostValue
 * @param {{ release?: string, timeoutMs?: number, noStore?: boolean }} [options]
 * @param {{ CF_ACCESS_CLIENT_ID?: string, CF_ACCESS_CLIENT_SECRET?: string }} [credentials]
 */
export function editorialManifestRequest(hostValue, { release, timeoutMs = 15000, noStore = false } = {}, credentials = process.env) {
  const host = validateEditorialHost(hostValue);
  const id = credentials.CF_ACCESS_CLIENT_ID ?? '';
  const secret = credentials.CF_ACCESS_CLIENT_SECRET ?? '';
  if (typeof id !== 'string' || typeof secret !== 'string' || Boolean(id) !== Boolean(secret)) {
    throw new Error('Cloudflare Access : CF_ACCESS_CLIENT_ID et CF_ACCESS_CLIENT_SECRET doivent être fournis ensemble');
  }
  if ((id && (!id.trim() || id.trim() !== id || /[\r\n]/.test(id) || id.length > 4096)) || (secret && (!secret.trim() || secret.trim() !== secret || /[\r\n]/.test(secret) || secret.length > 4096))) {
    throw new Error('Cloudflare Access : identifiants de service invalides');
  }
  const headers = new Headers({ 'Cache-Control': 'no-cache' });
  if (previewHostname.test(host.hostname) && id && secret) {
    headers.set('CF-Access-Client-Id', id);
    headers.set('CF-Access-Client-Secret', secret);
  }
  const url = new URL('/editorial-manifest.json', host);
  if (release !== undefined) {
    if (typeof release !== 'string' || !/^[a-f0-9]{64}$/.test(release)) throw new Error('Empreinte de publication invalide');
    url.searchParams.set('release', release);
  }
  return {
    url,
    options: { method: 'GET', headers, signal: AbortSignal.timeout(timeoutMs), redirect: 'error', ...(noStore ? { cache: 'no-store' } : {}) },
  };
}
