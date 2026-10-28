import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
import { convertProduction } from '../src/lib/editorial/production-conversion.ts';
import { productionIdentity } from '../src/lib/editorial/production.ts';
import { prepareCover } from './editorial-cover.mjs';
import { readJson } from './editorial-batch-core.mjs';
import { repoRoot, loadEditorialCatalog } from './editorial-io.mjs';
import { assertBundleOutput, assertBundleTarget } from './editorial-output.mjs';

const { values } = parseArgs({ strict: true, options: {
  file: { type: 'string' }, out: { type: 'string' }, campaign: { type: 'string' },
  cover: { type: 'string' }, revision: { type: 'string' },
  'test-without-cover': { type: 'boolean', default: false },
} });
if (!values.file || !values.out || !values.campaign) throw new Error('Usage : npm run editorial:convert -- --file PRODUCTION.json --campaign identifiant-stable --out artifacts/conversion [--cover couverture-finale.png | --test-without-cover] [--revision N]');
if (values.cover && values['test-without-cover']) throw new Error('--cover et --test-without-cover sont exclusifs');
const out = await assertBundleOutput(values.out, repoRoot);
const input = resolve(values.file);
const production = await readJson(input);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceSha256 = hash(await readFile(input));
const topicId = productionIdentity(values.campaign, production.id);
const existing = await loadEditorialCatalog();
let prepared = null;
if (values.cover) prepared = await prepareCover(resolve(values.cover), { width: 1600, height: 900 });
const cover = prepared ? { src: `/editorial/${topicId}/cover-${prepared.report.sha256.slice(0, 16)}.webp`, width: prepared.report.width, height: prepared.report.height } : null;
const { article, report } = convertProduction(production, {
  campaignId: values.campaign, cover, testWithoutCover: values['test-without-cover'],
  previous: existing.find(item => item.topicId === topicId),
  ...(values.revision === undefined ? {} : { revision: Number(values.revision) }),
});
const bytes = Buffer.from(JSON.stringify(article, null, 2) + '\n');
if (bytes.length > 100_000) throw new Error('SITE.json dépasse 100000 octets après conversion ; aucune sortie écrite');
const { action, ...stableReport } = report;
const validation = { ...stableReport, sourceSha256, siteSha256: hash(bytes), imageProcessing: prepared?.report ?? null };
const outputs = [
  ['SITE.json', bytes],
  ['CONVERSION.json', Buffer.from(JSON.stringify(validation, null, 2) + '\n')],
  ...(prepared ? [['cover.webp', prepared.buffer]] : []),
];
// Validate every existing target before writing any result. Retry is identical
// and cannot overwrite a changed bundle or the source package.
const missing = [];
for (const [name, content] of outputs) {
  const target = await assertBundleTarget(out, resolve(out, name), repoRoot);
  const previous = await readFile(target).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
  if (previous && !previous.equals(content)) throw new Error(`Sortie différente : choisir un nouveau --out (${name})`);
  if (!previous) missing.push([target, content]);
}
await mkdir(out, { recursive: true });
for (const [target, content] of missing) await writeFile(target, content, { flag: 'wx' });
console.log(JSON.stringify({ topicId, revision: article.revision, action, state: 'draft-converted', writtenFiles: missing.length, sourceUnchanged: sourceSha256 === hash(await readFile(input)), image: article.image, publicationReady: false, blockers: report.blockers, output: out }, null, 2));
