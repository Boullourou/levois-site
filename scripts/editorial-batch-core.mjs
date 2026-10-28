import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { adaptProduction, productionIdentity } from '../src/lib/editorial/production.ts';
import { convertProduction } from '../src/lib/editorial/production-conversion.ts';
import { validateEditorialArticle, validateEditorialCatalog, classifyEditorialImport, parseTimestamp } from '../src/lib/editorial/schema.ts';
import { resources } from '../src/data/resources.ts';
import { prepareCover } from './editorial-cover.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const fields = (value, names, name) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(name + ': objet attendu');
  for (const key of Object.keys(value)) if (!names.includes(key)) throw new Error(name + '.' + key + ': champ inconnu');
};
const identifier = (value, name) => {
  if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || value.length > 70) throw new Error(name + ': identifiant stable ASCII requis');
};
export async function inputFile(root, name, maxBytes = 100_000) {
  if (typeof name !== 'string' || !name || isAbsolute(name) || name.includes(':') || name.includes('\\')) throw new Error('Chemin relatif requis dans LOT.json');
  const base = await realpath(root);
  const full = await realpath(resolve(base, name));
  const rel = relative(base, full);
  if (rel === '..' || rel.startsWith('../') || rel.startsWith('..\\') || isAbsolute(rel)) throw new Error('Fichier hors du lot interdit');
  const info = await stat(full);
  if (!info.isFile() || info.size > maxBytes) throw new Error('Fichier absent, non ordinaire ou trop volumineux : ' + name);
  return full;
}
export async function readJson(file, maxBytes = 100_000) {
  if ((await stat(file)).size > maxBytes) throw new Error('JSON trop volumineux');
  return JSON.parse(await readFile(file, 'utf8'));
}

/** Validate everything in memory before writing a bundle or staging any article. */
export async function prepareBatch(manifest, inputRoot, existing = [], coverProcessor = prepareCover) {
  fields(manifest, ['schemaVersion','batchId','campaignId','days'], 'lot');
  if (manifest.schemaVersion !== 1) throw new Error('lot.schemaVersion: version 1 requise');
  identifier(manifest.batchId, 'batchId'); identifier(manifest.campaignId, 'campaignId');
  if (!Array.isArray(manifest.days) || manifest.days.length !== 7) throw new Error('Un lot contient exactement sept journées');
  const articles = [], covers = [], sourceEvidence = [];
  for (const day of manifest.days) {
    fields(day, ['production','metadata','cover','coverWidth','coverHeight','revision'], 'lot.days');
    const production = await readJson(await inputFile(inputRoot, day.production));
    // Optional legacy metadata input remains readable, but SITE.json is now
    // generated directly from PRODUCTION and is never an input requirement.
    const metadata = day.metadata === undefined ? null : await readJson(await inputFile(inputRoot, day.metadata));
    if (metadata && metadata.campaignId !== manifest.campaignId) throw new Error('Campagne différente dans les métadonnées');
    const topicId = productionIdentity(manifest.campaignId, production.id);
    let cover = null;
    if (day.cover !== null) {
      const prepared = await coverProcessor(await inputFile(inputRoot, day.cover, 25_000_000), { width: day.coverWidth, height: day.coverHeight });
      // Content-addressed filename prevents replacement of an already reviewed cover.
      const src = '/editorial/' + topicId + '/cover-' + prepared.report.sha256.slice(0, 16) + '.webp';
      cover = { src, width: prepared.report.width, height: prepared.report.height };
      covers.push({ src, buffer: prepared.buffer, report: prepared.report });
    } else if (day.coverWidth !== undefined || day.coverHeight !== undefined) throw new Error('Dimensions sans couverture');
    const conversion = metadata ? null : convertProduction(production, { campaignId: manifest.campaignId, cover, previous: existing.find(a => a.topicId === topicId), revision: day.revision });
    articles.push(conversion ? conversion.article : adaptProduction(production, metadata, cover));
    // Review evidence must remain identical after activation/retry. Runtime
    // actions (created/unchanged) belong to the result, never the fingerprint.
    sourceEvidence.push({ topicId, productionSha256: hash(JSON.stringify(production)), ...(metadata ? { metadataSha256: hash(JSON.stringify(metadata)) } : { conversionVersion: 'production-direct-v1' }) });
  }
  articles.sort((a,b) => a.dates.publishAt.localeCompare(b.dates.publishAt));
  const dates = articles.map(a => a.dates.publishAt.slice(0,10));
  for (let i = 1; i < dates.length; i++) {
    // Civil-day arithmetic in UTC avoids treating a Paris DST day as 24 hours.
    const next = new Date(dates[i-1] + 'T12:00:00Z'); next.setUTCDate(next.getUTCDate() + 1);
    if (next.toISOString().slice(0,10) !== dates[i]) throw new Error('Les sept dates doivent être distinctes et consécutives');
  }
  const scheduled = articles.map(article => validateEditorialArticle({ ...article, status: 'scheduled' }));
  // The loader reads the exact pretty-printed file written by the CLI. Check
  // UTF-8 bytes for both outputs: "scheduled" is longer than "draft" and two
  // individually valid input files can exceed the limit after being combined.
  for (const article of [...articles, ...scheduled]) {
    const bytes = Buffer.byteLength(JSON.stringify(article, null, 2) + '\n', 'utf8');
    if (bytes > 100_000) throw new Error(`Article ${article.topicId} (${article.status}) : ${bytes} octets, maximum 100000 après sérialisation ; aucun fichier préparé`);
  }
  const ids = new Set(scheduled.map(a => a.topicId));
  validateEditorialCatalog([...existing.filter(a => !ids.has(a.topicId)), ...scheduled], resources);
  const actions = scheduled.map(article => {
    const previous = existing.find(a => a.topicId === article.topicId);
    if (!previous && article.revision !== 1) throw new Error('Un nouveau sujet commence à revision: 1');
    return { topicId: article.topicId, revision: article.revision, action: classifyEditorialImport(article, previous) };
  });
  covers.sort((a,b) => a.src.localeCompare(b.src));
  sourceEvidence.sort((a,b) => a.topicId.localeCompare(b.topicId));
  const review = { schemaVersion: 1, batchId: manifest.batchId, campaignId: manifest.campaignId,
    articles, covers: covers.map(({src,report}) => ({src,...report})), sourceEvidence };
  return { ...review, fingerprint: hash(JSON.stringify(review)), scheduled, coverFiles: covers, actions };
}

/** A declaration bound to exact reviewed bytes; GitHub review remains mandatory. */
export function validateBatchReview(review, batch) {
  fields(review, ['schemaVersion','batchId','campaignId','fingerprint','reviewer','reviewedAt'], 'revue');
  if (review.schemaVersion !== 1 || review.batchId !== batch.batchId || review.campaignId !== batch.campaignId || review.fingerprint !== batch.fingerprint) throw new Error('Revue absente ou empreinte différente : nouvelle revue obligatoire');
  if (typeof review.reviewer !== 'string' || !review.reviewer.trim() || review.reviewer.length > 200) throw new Error('Identité du relecteur requise');
  parseTimestamp(review.reviewedAt, 'revue.reviewedAt');
  if (Date.parse(review.reviewedAt) > Date.now()) throw new Error('La date de revue ne peut pas être future');
  return review;
}
