/** Read-only audit of the compiled site; optional HTTP GET checks, no forms sent. */
import { readFile, readdir, access, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { base: { type: 'string' }, out: { type: 'string' } }, strict: true });
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
const production = 'https://levois.fr';
const errors = [];
const warnings = [];
const pages = [];
const http = [];
const decode = (value) => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
const plain = (value) => decode(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([^\s=<>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map((m) => [m[1].toLowerCase(), decode(m[2] ?? m[3] ?? m[4])]));
}
async function exists(file) { try { await access(file); return true; } catch { return false; } }
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) output.push(...await walk(resolve(directory, entry.name)));
    else if (entry.isFile()) output.push(resolve(directory, entry.name));
  }
  return output;
}
const files = await walk(dist);
const redirects = (await readFile(resolve(dist, '_redirects'), 'utf8').catch(() => '')).split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith('#')).map((line) => line.trim().split(/\s+/)[0]);
function redirected(pathname) { return redirects.some((source) => source.endsWith('*') ? pathname.startsWith(source.slice(0, -1)) : pathname.replace(/\/$/, '') === source.replace(/\/$/, '')); }
async function localTarget(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return false; }
  const file = resolve(dist, `.${decoded}`);
  if (relative(dist, file).startsWith('..')) return false;
  if (extname(decoded)) return exists(file);
  return await exists(resolve(file, 'index.html')) || await exists(`${file}.html`) || redirected(pathname);
}
const links = new Map();
const sitemapFiles = files.filter((file) => /sitemap[^/\\]*\.xml$/.test(file));
const sitemapUrls = new Set();
for (const file of sitemapFiles) for (const match of (await readFile(file, 'utf8')).matchAll(/<loc>([\s\S]*?)<\/loc>/g)) {
  const location = decode(match[1]);
  if (!location.endsWith('.xml')) sitemapUrls.add(location);
}
if (!sitemapFiles.length) errors.push({ path: '/sitemap-index.xml', check: 'sitemap', detail: 'Aucun sitemap compilé trouvé' });
const robots = await readFile(resolve(dist, 'robots.txt'), 'utf8').catch(() => '');
if (!robots) errors.push({ path: '/robots.txt', check: 'robots', detail: 'Fichier absent ou vide dans dist' });
if (/^Disallow:\s*\/\s*$/mi.test(robots)) errors.push({ path: '/robots.txt', check: 'robots', detail: 'Interdiction globale de production' });
if (!/^Sitemap:\s*https:\/\/levois\.fr\//mi.test(robots)) warnings.push({ path: '/robots.txt', check: 'sitemap-reference', detail: 'Référence au sitemap de production absente' });

for (const file of files.filter((file) => file.endsWith('.html'))) {
  const filePath = relative(dist, file).replace(/\\/g, '/');
  const path = `/${filePath.replace(/index\.html$/, '')}`;
  const html = await readFile(file, 'utf8');
  if (/http-equiv=["']?refresh/i.test(html)) continue;
  const tags = [...html.matchAll(/<(?:meta|link|a|img)\b[^>]*>/gi)].map((m) => ({ tag: m[0].match(/^<(\w+)/)[1].toLowerCase(), ...attributes(m[0]) }));
  const meta = (name) => tags.find((tag) => tag.tag === 'meta' && (tag.name === name || tag.property === name))?.content ?? '';
  const title = plain(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const canonical = tags.find((tag) => tag.tag === 'link' && tag.rel === 'canonical')?.href ?? '';
  const noindex = /noindex/i.test(meta('robots'));
  const privateApp = path.startsWith('/cockpit/');
  const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => plain(match[1]));
  const issue = (check, detail) => errors.push({ path, check, detail });
  if (!title) issue('title', 'Titre absent');
  if (privateApp && !noindex) issue('private-indexability', 'Le cockpit privé doit rester noindex');
  if (!privateApp && !meta('description')) issue('description', 'Description absente');
  if (!privateApp && (!canonical.startsWith(`${production}/`) || /[?#]/.test(canonical))) issue('canonical', `Canonical absent, hors domaine ou paramétré : ${canonical}`);
  if (!noindex && !sitemapUrls.has(canonical)) warnings.push({ path, check: 'sitemap', detail: `Canonical indexable absent du sitemap : ${canonical}` });
  if (noindex && sitemapUrls.has(canonical)) issue('sitemap', 'Page noindex présente dans le sitemap');
  for (const field of ['og:title', 'og:description', 'og:url', 'og:image', 'twitter:card']) if (!privateApp && !meta(field)) issue('social', `${field} absent`);
  if (meta('og:url') && meta('og:url') !== canonical) issue('social', 'og:url différent du canonical');
  if (h1.length !== 1 && !noindex) warnings.push({ path, check: 'heading', detail: `${h1.length} titres h1` });
  const graphs = [];
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const parsed = JSON.parse(match[1]); graphs.push(...(parsed['@graph'] ?? [parsed])); }
    catch { issue('structured-data', 'JSON-LD invalide'); }
  }
  if (!graphs.length && !noindex) warnings.push({ path, check: 'structured-data', detail: 'Aucun JSON-LD trouvé' });
  for (const article of graphs.filter((graph) => graph['@type'] === 'Article')) {
    if (!h1.includes(article.headline)) issue('structured-data', 'Titre Article différent du h1 visible');
    if ((article.url && article.url !== canonical) || article.mainEntityOfPage !== canonical) issue('structured-data', 'URL Article différente du canonical');
    if (!article.author?.name || !html.includes(article.author.name)) issue('structured-data', 'Auteur Article absent du contenu visible');
  }
  for (const tag of tags) {
    const raw = tag.tag === 'img' ? tag.src : tag.href;
    if (!raw || /^(?:mailto:|tel:|data:|javascript:|#)/i.test(raw)) continue;
    let url;
    try { url = new URL(raw, `${production}${path}`); } catch { issue('link', `URL invalide : ${raw}`); continue; }
    if (url.origin !== production || url.pathname.startsWith('/api/')) continue;
    if (!links.has(url.pathname)) links.set(url.pathname, []);
    links.get(url.pathname).push(path);
    if (tag.tag === 'img' && !('alt' in tag)) issue('image-alt', `Texte alternatif absent : ${raw}`);
  }
  const imageUrl = meta('og:image');
  if (imageUrl) { const url = new URL(imageUrl, production); if (url.origin === production && !await localTarget(url.pathname)) issue('social-image', `Image sociale introuvable : ${url.pathname}`); }
  pages.push({ path, title, description: meta('description'), canonical, noindex, privateApp, h1Count: h1.length, articleSchema: graphs.some((graph) => graph['@type'] === 'Article') });
}
for (const [target, sources] of links) if (!await localTarget(target)) errors.push({ path: target, check: 'broken-internal-link', detail: `Cible absente, référencée depuis ${[...new Set(sources)].slice(0, 5).join(', ')}` });
for (const url of sitemapUrls) {
  const parsed = new URL(url);
  if (parsed.origin !== production || parsed.search || parsed.hash || !await localTarget(parsed.pathname)) errors.push({ path: parsed.pathname, check: 'sitemap-target', detail: `Cible sitemap invalide : ${url}` });
}

if (values.base) {
  const base = new URL(values.base);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new Error('URL de lecture HTTP attendue sans identifiants');
  const paths = ['/robots.txt', '/sitemap-index.xml', '/sitemap-0.xml', '/', '/ressources/', '/ressources/marge-negociation-erreur-25000/', '/situer-ma-vente/', '/ma-recherche/', '/vendre-et-acheter/', '/contact/', '/editorial-manifest.json'];
  for (const path of paths) {
    try {
      const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(15000), redirect: 'manual' });
      const result = { path, status: response.status, contentType: response.headers.get('content-type'), cacheControl: response.headers.get('cache-control'), xRobotsTag: response.headers.get('x-robots-tag') };
      if (response.status >= 300 && response.status < 400 && (response.headers.get('location') || '').includes('.cloudflareaccess.com/')) {
        errors.push({ path, check: 'authentication-required', detail: 'Cloudflare Access protège la preview. Aucun contenu applicatif vérifié.' });
        http.push(result);
        continue;
      }
      if (!response.ok) errors.push({ path, check: 'http', detail: `HTTP ${response.status}` });
      const expectedType = path.endsWith('.xml') ? 'xml' : path.endsWith('.json') ? 'application/json' : path.endsWith('.txt') ? 'text/plain' : 'text/html';
      if (!result.contentType?.includes(expectedType)) errors.push({path,check:'http-content-type',detail:`Type ${result.contentType} inattendu pour ${path}`});
      if (path === '/ressources/marge-negociation-erreur-25000/') {
        const campaign = await fetch(new URL(`${path}?utm_source=qa&utm_campaign=editorial`, base), { signal: AbortSignal.timeout(15000) });
        const html = await campaign.text();
        const canonical = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => attributes(m[0])).find((tag) => tag.rel === 'canonical')?.href;
        result.campaignCanonical = canonical ?? null;
        if (canonical !== `${production}${path}`) errors.push({ path, check: 'campaign-canonical', detail: `Canonical de campagne incorrect : ${canonical}` });
      }
      http.push(result);
    } catch (error) { errors.push({ path, check: 'http', detail: String(error.message) }); }
  }
}
const report = { generatedAt: new Date().toISOString(), scope: 'HTML compilé, liens locaux, images, SEO et GET HTTP facultatifs ; aucun formulaire soumis. Les affirmations factuelles et le cache API personnel exigent les tests complémentaires.', summary: { pages: pages.length, internalTargets: links.size, sitemapUrls: sitemapUrls.size, errors: errors.length, warnings: warnings.length }, errors, warnings, pages, http, robots };
if (values.out) { const out = resolve(values.out); await mkdir(dirname(out), { recursive: true }); await writeFile(out, `${JSON.stringify(report, null, 2)}\n`); }
console.log(JSON.stringify({ ...report.summary, errors, warnings }, null, 2));
process.exitCode = errors.length ? 1 : 0;
