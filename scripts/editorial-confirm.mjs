import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { setTimeout } from 'node:timers/promises';
import { validateEditorialHost, editorialManifestRequest } from './editorial-http.mjs';
import { editorialBuildTime } from '../src/lib/editorial/schema.ts';
import { repoRoot, loadEditorialCatalog, createEditorialManifest } from './editorial-io.mjs';
import { verifyEditorialPublication } from './editorial-receipts.mjs';

const { values } = parseArgs({ options: { host: { type: 'string' }, output: { type: 'string', default: 'artifacts/editorial-publication/receipts.json' }, 'from-catalog': { type: 'boolean', default: false }, attempts: { type: 'string', default: '3' } }, strict: true });
if (!values.host) throw new Error('--host attendu');
const host = validateEditorialHost(values.host);
const attempts = Number(values.attempts);
if (!Number.isInteger(attempts) || attempts < 1 || attempts > 12) throw new Error('--attempts doit être un entier entre 1 et 12');
const articles = await loadEditorialCatalog();
const expected = values['from-catalog']
  ? createEditorialManifest(articles, editorialBuildTime(process.env.LEVOIS_EDITORIAL_BUILD_AT))
  : JSON.parse(await readFile(resolve(repoRoot, 'dist/editorial-manifest.json'), 'utf8'));
// Fail immediately on a partial/malformed token rather than hide it as a transient failure.
editorialManifestRequest(host, { release: expected.fingerprint });
const output = resolve(values.output);
await mkdir(dirname(output), { recursive: true });
for (let attempt = 0; attempt < attempts; attempt += 1) {
  const report = await verifyEditorialPublication({
    host, manifest: expected, articles,
    workflow: { repository: process.env.GITHUB_REPOSITORY, runId: process.env.GITHUB_RUN_ID, runAttempt: process.env.GITHUB_RUN_ATTEMPT, commitSha: process.env.GITHUB_SHA },
  });
  const temporary = `${output}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(report, null, 2)}\n`);
  await rename(temporary, output);
  console.log(JSON.stringify({ deploymentState: report.deploymentState, environment: report.environment, articleCount: report.receipts.length, verifiedCount: report.receipts.filter((receipt) => receipt.deploymentState === 'verified').length, receiptFile: output }));
  // Let Node drain stdout and fetch handles; forced exit can crash libuv on Windows.
  if (report.deploymentState === 'verified') break;
  if (attempt === attempts - 1) throw new Error('Publication non confirmée : reçu conservé avec état failed, aucune diffusion sociale autorisée.');
  await setTimeout(5000);
}
