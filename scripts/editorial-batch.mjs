import { mkdir, open, readFile, writeFile, rename, unlink, lstat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
import { prepareBatch, readJson, validateBatchReview } from './editorial-batch-core.mjs';
import { repoRoot, editorialDirectory, loadEditorialCatalog } from './editorial-io.mjs';
import { assertBundleOutput, assertBundleTarget } from './editorial-output.mjs';

const { values } = parseArgs({ options: { file: {type:'string'}, out: {type:'string'}, review: {type:'string'}, activate: {type:'boolean',default:false} }, strict:true });
if (!values.file || !values.out) throw new Error('Usage : npm run editorial:batch -- --file LOT.json --out prepared [--review REVUE.json] [--activate]');
if (values.activate && !values.review) throw new Error('--activate exige --review ; une préparation ne vaut pas autorisation');
if (values.activate) {
  const branch = execFileSync('git', ['branch','--show-current'], { cwd:repoRoot,encoding:'utf8' }).trim();
  if (!branch || ['main','master'].includes(branch)) throw new Error('Activation uniquement sur une branche de travail ; jamais main ou HEAD détachée');
}
const out = await assertBundleOutput(values.out, repoRoot);
const json = value => Buffer.from(JSON.stringify(value,null,2) + '\n');
const fileExists = async path => {
  try { const info = await lstat(path); if (!info.isFile() || info.isSymbolicLink()) throw new Error('Fichier ordinaire attendu : ' + path); return await readFile(path); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
};
const immutableWrite = async (path, bytes) => {
  await assertBundleTarget(out, path, repoRoot);
  const previous = await fileExists(path);
  if (previous) { if (!previous.equals(bytes)) throw new Error('Sortie existante différente, choisir un nouveau --out : ' + path); return; }
  await mkdir(dirname(path), {recursive:true});
  await writeFile(path,bytes,{flag:'wx'});
};
const lockPath = resolve(editorialDirectory,'.import.lock');
const lock = values.activate ? await open(lockPath,'wx') : null;
try {
  const input = resolve(values.file);
  const batch = await prepareBatch(await readJson(input),dirname(input),await loadEditorialCatalog());
  const review = values.review ? validateBatchReview(await readJson(resolve(values.review)), batch) : null;
  const receipt = { schemaVersion:1,batchId:batch.batchId,campaignId:batch.campaignId,fingerprint:batch.fingerprint,
    state:'prepared', articles:batch.articles, covers:batch.covers, sourceEvidence:batch.sourceEvidence,
    structure:'Markdown conservé exactement ; premier H1 identique au titre rendu une seule fois par le header. Tout bloc non pris en charge est refusé.' };
  // Immutable bundle can be retried byte-for-byte, including after interruption.
  await immutableWrite(resolve(out,'PREPARATION.json'),json(receipt));
  for (const article of batch.articles) await immutableWrite(resolve(out,'articles',article.topicId+'.json'),json(article));
  for (const cover of batch.coverFiles) await immutableWrite(resolve(out,'public','.'+cover.src),cover.buffer);
  if (review) await immutableWrite(resolve(out,'REVUE.json'),json(review));
  if (values.activate) {
    const writes = [];
    for (const cover of batch.coverFiles) {
      const path = resolve(repoRoot,'public','.'+cover.src);
      const before = await fileExists(path);
      if (before && !before.equals(cover.buffer)) throw new Error('Collision de couverture : ' + cover.src);
      if (!before) writes.push({path,before:null,after:cover.buffer});
    }
    for (const article of batch.scheduled) {
      const path = resolve(editorialDirectory,article.topicId+'.json'), before = await fileExists(path), after = json(article);
      if (!before?.equals(after)) writes.push({path,before,after});
    }
    const completed = [];
    try {
      for (const write of writes) {
        await mkdir(dirname(write.path),{recursive:true});
        const temp = write.path + '.' + process.pid + '.tmp';
        try { await writeFile(temp,write.after,{flag:'wx'}); await rename(temp,write.path); }
        finally { await unlink(temp).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
        completed.push(write);
      }
    } catch (error) {
      // Only restore paths still containing this process's bytes. Never discard a third-party edit.
      for (const write of completed.reverse()) {
        if (!(await fileExists(write.path))?.equals(write.after)) throw new Error('Erreur pendant activation et modification concurrente : vérifier git diff avant toute action', {cause:error});
        if (write.before) await writeFile(write.path,write.before); else await unlink(write.path);
      }
      throw error;
    }
  }
  console.log(JSON.stringify({ batchId:batch.batchId,campaignId:batch.campaignId,fingerprint:batch.fingerprint,
    state:values.activate?'staged-scheduled':review?'review-record-validated':'prepared',
    actions:batch.actions, bundle:out, published:false,
    next:values.activate?'Revue GitHub puis fusion explicitement autorisée ; aucun déploiement exécuté ici.':'Relire le bundle, fournir la revue liée à son empreinte, puis activer sur une branche séparée.' },null,2));
} finally { if (lock) {await lock.close();await unlink(lockPath);} }
