import { open, readFile, writeFile, rename, unlink, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { validateEditorialArticle, validateEditorialCatalog, classifyEditorialImport } from '../src/lib/editorial/schema.ts';
import { resources } from '../src/data/resources.ts';
import { editorialDirectory, loadEditorialCatalog, validateEditorialImages } from './editorial-io.mjs';

const { values } = parseArgs({ options: { file: { type: 'string' }, write: { type: 'boolean', default: false } }, strict: true });
if (!values.file) throw new Error('Usage : node scripts/editorial-import.mjs --file chemin/article.json [--write]');
const inputFile = resolve(values.file);
if ((await stat(inputFile)).size > 100_000) throw new Error('Article trop volumineux (maximum 100 Ko)');
const incoming = validateEditorialArticle(JSON.parse(await readFile(inputFile, 'utf8')));
const lockPath = resolve(editorialDirectory, '.import.lock');
const lock = values.write ? await open(lockPath, 'wx') : null;
let temporary;
try {
  const existing = await loadEditorialCatalog();
  const previous = existing.find((article) => article.topicId === incoming.topicId);
  const action = classifyEditorialImport(incoming, previous);
  if (!previous && incoming.revision !== 1) throw new Error('Un nouveau sujet commence à revision: 1');
  const next = [...existing.filter((article) => article.topicId !== incoming.topicId), incoming];
  validateEditorialCatalog(next, resources);
  await validateEditorialImages(next);
  if (values.write && action !== 'unchanged') {
    const output = resolve(editorialDirectory, `${incoming.topicId}.json`);
    temporary = resolve(editorialDirectory, `.${incoming.topicId}.${process.pid}.tmp`);
    await writeFile(temporary, `${JSON.stringify(incoming, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, output);
    temporary = undefined;
  }
  console.log(JSON.stringify({ topicId: incoming.topicId, revision: incoming.revision, action, written: Boolean(values.write && action !== 'unchanged'), path: `src/content/editorial/${incoming.topicId}.json` }));
} finally {
  if (temporary) await unlink(temporary).catch(() => {});
  if (lock) { await lock.close(); await unlink(lockPath); }
}
