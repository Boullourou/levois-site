import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { digest, boundedFile, unseal, seal, writeEnvelope, validateTransfer } from './editorial-transfer.mjs';
import { prepareBatch } from './editorial-batch-core.mjs';
import { loadEditorialCatalog, repoRoot } from './editorial-io.mjs';

const json = value => JSON.stringify(value, null, 2) + '\n';
const fail = code => { throw new Error(code); };

export async function receive(inbox, out, privateKey, options = {}) {
  await mkdir(out, { recursive: true });
  const receipt = { schemaVersion: 1, state: 'rejected', stage: 'transport', publication: 'not-requested', schedule: 'unchanged',
    checkedAt: new Date().toISOString(), runId: process.env.GITHUB_RUN_ID ?? null, attempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
    codeCommit: process.env.INTAKE_CODE_COMMIT ?? null, inputCommit: process.env.INPUT_COMMIT ?? null };
  let root;
  const publicKey = await readFile(resolve(repoRoot, 'config/editorial-intake/public.pem'), 'utf8');
  try {
    if (!privateKey) fail('INTAKE_KEY_MISSING');
    const header = JSON.parse((await boundedFile(inbox, 'ENVELOPE.json', 200_000)).toString());
    if (!Array.isArray(header.chunks) || header.chunks.length > 730) fail('ENVELOPE_INVALID');
    if (!/^[a-f0-9]{64}$/.test(header.transferId)) fail('ENVELOPE_INVALID');
    receipt.transferId = header.transferId;
    if (process.env.GITHUB_REF_NAME && process.env.GITHUB_REF_NAME !== `codex/article-intake-${header.transferId}`) fail('BRANCH_ID_MISMATCH');
    const chunks = [];
    for (const entry of header.chunks) chunks.push((await boundedFile(inbox, entry.path, 256_000)).toString());
    const payload = validateTransfer(JSON.parse(unseal(header, chunks, privateKey).toString()));
    root = await mkdtemp(resolve(tmpdir(), 'levois-intake-'));
    for (const file of payload.files) {
      const path = resolve(root, file.path); await mkdir(dirname(path), { recursive: true });
      await writeFile(path, Buffer.from(file.base64, 'base64'), { flag: 'wx' });
    }
    receipt.stage = 'batch';
    const manifest = JSON.parse(await readFile(resolve(root, 'LOT.json'), 'utf8'));
    if (manifest.batchId !== payload.manifest.batchId) fail('BATCH_ID_MISMATCH');
    if (!Array.isArray(manifest.days) || manifest.days.length !== 7) fail('SEVEN_DAYS_REQUIRED');
    const expected = new Set(['LOT.json']);
    let processor;
    if (payload.manifest.mode === 'prepared-v3') {
      const approved = JSON.parse(await readFile(resolve(repoRoot, 'config/editorial-intake/approved-v3.json'), 'utf8'));
      if (manifest.batchId !== approved.batchId) fail('V3_BATCH_NOT_APPROVED');
      for (const day of manifest.days ?? []) {
        const saved = approved.days.find(row => row.production === day.production);
        if (!saved || digest(await boundedFile(root, day.production, 100_000)) !== saved.productionSha256) fail('V3_SOURCE_CHANGED');
        // Only the working manifest points to existing WebP bytes. Original LOT and dates stay intact.
        day.cover = saved.webp; expected.add(saved.webp);
      }
      processor = async path => {
        const rel = path.slice(root.length + 1).replaceAll('\\','/');
        const saved = approved.days.find(row => row.webp === rel), buffer = await readFile(path);
        if (!saved || digest(buffer) !== saved.report.sha256 || buffer.length !== saved.report.bytes) fail('V3_COVER_CHANGED');
        const meta = await sharp(buffer).metadata();
        if (meta.format !== 'webp' || meta.width !== 1600 || meta.height !== 900 || (meta.pages ?? 1) !== 1 || buffer.length > 500_000) fail('V3_DIMENSIONS_INVALID');
        return { buffer, report: saved.report };
      };
      options.expectedFingerprint = approved.fingerprint;
    } else {
      for (const day of manifest.days ?? []) {
        if (!day.cover || day.coverWidth !== 1600 || day.coverHeight !== 900) fail('COVER_REQUIRED_1600_900');
        expected.add(day.cover);
      }
    }
    for (const day of manifest.days ?? []) {
      if (day.metadata !== undefined) fail('SITE_IS_OUTPUT_ONLY');
      expected.add(day.production);
    }
    if (expected.size !== payload.files.length || payload.files.some(file => !expected.has(file.path))) fail('UNEXPECTED_OR_MISSING_FILE');
    const batch = await prepareBatch(manifest, root, await loadEditorialCatalog(), processor);
    if (options.expectedFingerprint && batch.fingerprint !== options.expectedFingerprint) fail('V3_FINGERPRINT_CHANGED');
    if (batch.articles.some(article => article.status !== 'draft')) fail('DRAFT_REQUIRED');
    const files = [ { path: 'PREPARATION.json', base64: Buffer.from(json({ ...batch, coverFiles: undefined, scheduled: undefined })).toString('base64') },
      ...batch.articles.map(article => ({ path: `articles/${article.topicId}.json`, base64: Buffer.from(json(article)).toString('base64') })),
      ...batch.coverFiles.map(cover => ({ path: `public${cover.src}`, base64: cover.buffer.toString('base64') })) ];
    await writeEnvelope(resolve(out, 'prepared.encrypted'), seal(Buffer.from(JSON.stringify({ files })), publicKey));
    // This opt-in directory is an ephemeral CI checkout only. Nothing is committed, activated or deployed.
    if (options.buildRoot) {
      if (resolve(options.buildRoot) !== resolve(repoRoot) || process.env.GITHUB_ACTIONS !== 'true') fail('CI_BUILD_ROOT_REQUIRED');
      for (const article of batch.articles) await writeFile(resolve(repoRoot, 'src/content/editorial', `${article.topicId}.json`), json(article));
      for (const cover of batch.coverFiles) {
        const file = resolve(repoRoot, `public${cover.src}`); await mkdir(dirname(file), { recursive: true }); await writeFile(file, cover.buffer);
      }
    }
    Object.assign(receipt, { state: 'validated-awaiting-build', stage: 'build', batchId: batch.batchId, fingerprint: batch.fingerprint,
      mode: payload.manifest.mode, count: batch.articles.length, compression: payload.manifest.mode === 'prepared-v3' ? 'reused-byte-for-byte' : 'runner-sharp',
      articles: batch.articles.map(a => ({ topicId: a.topicId, revision: a.revision, intendedUrl: `https://levois.fr/ressources/${a.slug}/`, publishAt: a.dates.publishAt, state: a.status })),
      covers: batch.covers.map(c => ({ sha256: c.sha256, bytes: c.bytes, width: c.width, height: c.height })),
      expiredDates: batch.articles.filter(a => Date.parse(a.dates.publishAt) <= Date.now()).map(a => a.topicId), facts: 'not-reviewed-by-technical-validation' });
    return receipt;
  } catch (error) {
    receipt.code = /^[A-Z_]+$/.test(error.message) ? error.message : 'CONTENT_VALIDATION_FAILED';
    const field = /^(production(?:\.article)?\.[a-zA-Z_]+|article\.[a-zA-Z_]+|lot\.[a-zA-Z_]+):/.exec(error.message)?.[1];
    if (field) receipt.field = field;
    // Full diagnostic remains private; public logs/receipts contain only allowlisted codes.
    await writeEnvelope(resolve(out, 'diagnostic.encrypted'), seal(Buffer.from(json({ stage: receipt.stage, message: error.message })), publicKey));
    return receipt;
  } finally {
    await writeFile(resolve(out, 'RECEIPT.json'), json(receipt));
    if (root) await rm(root, { recursive: true, force: true });
  }
}

export async function finalize(out, buildOk) {
  const file = resolve(out, 'RECEIPT.json'), receipt = JSON.parse(await readFile(file, 'utf8'));
  if (receipt.state === 'validated-awaiting-build') {
    receipt.state = buildOk ? 'prepared' : 'rejected'; receipt.stage = 'complete'; receipt.build = buildOk ? 'passed' : 'failed';
    if (!buildOk) receipt.code = 'BUILD_FAILED';
  }
  receipt.checkedAt = new Date().toISOString(); await writeFile(file, json(receipt));
  return receipt;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [mode, inbox, out] = process.argv.slice(2);
    const receipt = mode === 'finalize' ? await finalize(inbox, out === 'success') : await receive(inbox, out, process.env.LEVOIS_INTAKE_PRIVATE_KEY, { buildRoot: process.env.GITHUB_ACTIONS === 'true' ? repoRoot : undefined });
    console.log(JSON.stringify({ state: receipt.state, stage: receipt.stage, code: receipt.code ?? null, transferId: receipt.transferId }));
    if (receipt.state === 'rejected') process.exitCode = 1;
  } catch { console.error('RECEIVER_FAILED_BEFORE_RECEIPT'); process.exitCode = 1; }
}
