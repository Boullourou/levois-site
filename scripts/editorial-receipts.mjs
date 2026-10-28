import { createHash } from 'node:crypto';
import { editorialManifestRequest, editorialArticleRequest, validateEditorialHost } from './editorial-http.mjs';

/** @typedef {import('../src/lib/editorial/schema.ts').EditorialArticle} EditorialArticle */
/** @typedef {{schemaVersion:number, fingerprint:string, articles:{topicId:string, slug:string, revision:number}[]}} EditorialManifest */
/** @param {string} text */
const normalizeText = (text) => text.replace(/\s+/gu, ' ').trim();
/** @param {string} text */
const decodeEntities = (text) => text.replace(/&(?:amp|quot|apos|lt|gt|nbsp);|&#(?:x[0-9a-f]+|\d+);/gi, (entity) => {
  /** @type {Record<string, string>} */
  const names = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' };
  if (entity.toLowerCase() in names) return names[entity.toLowerCase()];
  const numeric = entity.toLowerCase().startsWith('&#x') ? Number.parseInt(entity.slice(3, -1), 16) : Number.parseInt(entity.slice(2, -1), 10);
  return Number.isInteger(numeric) && numeric >= 0 && numeric <= 0x10ffff ? String.fromCodePoint(numeric) : entity;
});
/** @param {string} tag */
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([^\s=<>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map((m) => [m[1].toLowerCase(), decodeEntities(m[2] ?? m[3] ?? m[4])]));
}

/** Pure checks: an HTTP 200 or an Access login page alone is never a publication proof.
 * @param {string} html @param {EditorialArticle} article
 */
export function inspectEditorialHtml(html, article) {
  // Ignore inert examples or metadata-shaped strings embedded in scripts/comments.
  const rendered = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const head = rendered.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const metadata = [...head.matchAll(/<(?:link|meta)\b[^>]*>/gi)].map((match) => attributes(match[0]));
  const canonicals = metadata.filter((tag) => tag.rel?.toLowerCase().split(/\s+/).includes('canonical'));
  const identities = metadata.filter((tag) => tag.name === 'levois:topic-id');
  const revisions = metadata.filter((tag) => tag.name === 'levois:revision');
  const headings = [...rendered.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => normalizeText(decodeEntities(match[1].replace(/<[^>]*>/g, ' '))));
  const canonical = `https://levois.fr/ressources/${article.slug}/`;
  return {
    canonical: canonicals.length === 1 && canonicals[0].href === canonical,
    title: headings.length === 1 && headings[0] === normalizeText(article.title),
    id: identities.length === 1 && identities[0].content === article.topicId,
    revision: revisions.length === 1 && revisions[0].content === String(article.revision),
  };
}

/** @param {EditorialManifest} manifest @param {EditorialArticle[]} articles */
function expectedArticles(manifest, articles) {
  if (manifest.schemaVersion !== 1 || !/^[a-f0-9]{64}$/.test(manifest.fingerprint) || !Array.isArray(manifest.articles)) throw new Error('Manifeste attendu invalide');
  const selected = manifest.articles.map((entry) => {
    const article = articles.find((item) => item.topicId === entry.topicId && item.slug === entry.slug && item.revision === entry.revision);
    if (!article) throw new Error('Le contenu source ne correspond pas au manifeste attendu');
    return article;
  }).sort((a, b) => a.topicId.localeCompare(b.topicId));
  if (new Set(selected.map((article) => article.topicId)).size !== selected.length || createHash('sha256').update(JSON.stringify(selected)).digest('hex') !== manifest.fingerprint) throw new Error('Empreinte ou identités du manifeste attendu incohérentes');
  return selected;
}

/** One bounded read pass. Failed receipts carry a machine-readable code, never response bodies or credentials.
 * @param {{host:string|URL, manifest:EditorialManifest, articles:EditorialArticle[], credentials?:{CF_ACCESS_CLIENT_ID?:string, CF_ACCESS_CLIENT_SECRET?:string}, fetcher?:typeof fetch, now?:()=>Date, workflow?:{repository?:string, runId?:string, runAttempt?:string, commitSha?:string}}} args
 */
export async function verifyEditorialPublication({ host, manifest, articles, credentials = process.env, fetcher = fetch, now = () => new Date(), workflow = {} }) {
  const base = validateEditorialHost(host);
  const environment = base.hostname === 'levois.fr' ? 'production' : 'preview';
  const selected = expectedArticles(manifest, articles);
  const request = editorialManifestRequest(base, { release: manifest.fingerprint, noStore: true }, credentials);
  const receipts = selected.map((article) => ({
    id: article.topicId, revision: article.revision, url: `https://levois.fr/ressources/${article.slug}/`,
    checkedUrl: new URL(`/ressources/${article.slug}/`, base).href,
    deploymentState: 'failed', verifiedAt: /** @type {string|null} */ (null), socialReady: false,
    failureCode: /** @type {string|null} */ ('manifest_unconfirmed'),
    evidence: { manifest: false, http200: false, html: false, canonical: false, title: false, id: false, revision: false },
  }));
  let manifestVerified = false;
  let manifestFailure = 'manifest_network_error';
  try {
    const response = await fetcher(request.url, request.options);
    if (response.redirected) manifestFailure = 'manifest_redirected';
    else if (response.status !== 200) manifestFailure = `manifest_http_${response.status}`;
    else if (!/^application\/json\b/i.test(response.headers.get('content-type') ?? '')) manifestFailure = 'manifest_not_json';
    else {
      const actual = await response.json();
      const identity = (entries) => Array.isArray(entries) ? JSON.stringify(entries.map(({ topicId, slug, revision }) => ({ topicId, slug, revision })).sort((a, b) => String(a.topicId).localeCompare(String(b.topicId)))) : '';
      manifestVerified = actual.schemaVersion === 1 && actual.fingerprint === manifest.fingerprint && identity(actual.articles) === identity(manifest.articles);
      manifestFailure = manifestVerified ? '' : 'manifest_mismatch';
    }
  } catch { /* A redirect, timeout, invalid JSON or network failure is not a success. */ }
  if (manifestVerified) {
    // Six independent static GETs at a time keep a year's archive bounded.
    for (let start = 0; start < selected.length; start += 6) await Promise.all(selected.slice(start, start + 6).map(async (article, offset) => {
      const receipt = receipts[start + offset];
      receipt.evidence.manifest = true;
      const page = editorialArticleRequest(base, article.slug, { release: manifest.fingerprint, noStore: true }, credentials);
      try {
        const response = await fetcher(page.url, page.options);
        if (response.redirected) { receipt.failureCode = 'article_redirected'; return; }
        receipt.evidence.http200 = response.status === 200;
        receipt.evidence.html = /^text\/html\b/i.test(response.headers.get('content-type') ?? '');
        if (!receipt.evidence.http200) { receipt.failureCode = `article_http_${response.status}`; return; }
        if (!receipt.evidence.html) { receipt.failureCode = 'article_not_html'; return; }
        const html = await response.text();
        if (html.length > 2_000_000) { receipt.failureCode = 'article_too_large'; return; }
        Object.assign(receipt.evidence, inspectEditorialHtml(html, article));
        if (!Object.values(receipt.evidence).every(Boolean)) { receipt.failureCode = 'article_identity_mismatch'; return; }
        receipt.deploymentState = 'verified';
        receipt.verifiedAt = now().toISOString();
        receipt.failureCode = null;
      } catch { receipt.failureCode = 'article_network_error'; }
    }));
  } else for (const receipt of receipts) receipt.failureCode = manifestFailure;
  const complete = manifestVerified && receipts.every((receipt) => receipt.deploymentState === 'verified');
  // Limova releases social messages only for a completely verified publication pass.
  // A partial pass is retained for diagnosis and retried without republishing articles.
  for (const receipt of receipts) receipt.socialReady = complete && environment === 'production';
  return {
    schemaVersion: 1, environment, deploymentState: complete ? 'verified' : 'failed',
    checkedAt: now().toISOString(), verifiedAt: complete ? now().toISOString() : null,
    manifestFingerprint: manifest.fingerprint,
    workflow: { repository: workflow.repository ?? null, runId: workflow.runId ?? null, runAttempt: workflow.runAttempt ?? null, commitSha: workflow.commitSha ?? null },
    receipts,
  };
}
