import { spawn } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createEditorialManifest } from '../scripts/editorial-io.mjs';
import { validateEditorialArticle } from '../src/lib/editorial/schema';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const artifacts = resolve(repoRoot, 'artifacts');
let fixtureRoot: string;
const article = validateEditorialArticle({
  schemaVersion: 1, topicId: 'cli-test-j001', revision: 1, slug: 'sujet-test-cli',
  title: 'Question de test', summary: 'Résumé fictif pour le test du processus.', answer: 'Réponse fictive.',
  sections: [{ heading: 'Vérifier', paragraphs: ['Contenu de test uniquement.'] }],
  author: { name: 'Auteur fictif', role: 'Exemple technique' },
  dates: { createdAt: '2026-10-27T10:00:00+01:00', publishAt: '2026-10-28T07:00:00+01:00' },
  sources: [], scope: 'Test technique local uniquement.', limits: ['Ne pas publier.'], image: null,
  category: 'vendre', primaryDestination: '/situer-ma-vente/', status: 'scheduled',
});
const manifest = createEditorialManifest([article], new Date('2026-10-28T06:01:00Z'));

beforeAll(async () => {
  await mkdir(artifacts, { recursive: true });
  fixtureRoot = await mkdtemp(resolve(artifacts, 'editorial-confirm-cli-'));
  // The real CLI and validators run against an isolated synthetic catalog. The
  // project's own catalog, production services and publication switches are untouched.
  for (const path of [
    'scripts/editorial-confirm.mjs', 'scripts/editorial-http.mjs',
    'scripts/editorial-io.mjs', 'scripts/editorial-receipts.mjs',
    'src/data/resources.ts', 'src/lib/editorial/schema.ts', 'src/lib/editorial/markdown.ts',
  ]) {
    await mkdir(dirname(resolve(fixtureRoot, path)), { recursive: true });
    await copyFile(resolve(repoRoot, path), resolve(fixtureRoot, path));
  }
  await writeFile(resolve(fixtureRoot, 'package.json'), JSON.stringify({ type: 'module' }));
  await mkdir(resolve(fixtureRoot, 'src/content/editorial'), { recursive: true });
  await writeFile(resolve(fixtureRoot, `src/content/editorial/${article.topicId}.json`), JSON.stringify(article));
  await writeFile(resolve(fixtureRoot, 'local-http.mjs'), `
    const realFetch = globalThis.fetch;
    globalThis.fetch = (input, options) => {
      const target = new URL(input);
      if (target.origin !== 'https://levois.fr') throw new Error('Unexpected test destination');
      return realFetch(new URL(target.pathname + target.search, process.env.CLI_TEST_ORIGIN), options);
    };
    // Abrupt process.exit() skips this lifecycle event. Observe normal shutdown
    // after a real HTTP fetch and drain the final stdout write through the pipe.
    process.once('beforeExit', () => process.stdout.write('CLI_EVENT_LOOP_DRAINED\\n'));
  `);
});

afterAll(async () => {
  if (fixtureRoot) {
    if (!fixtureRoot.startsWith(artifacts + sep + 'editorial-confirm-cli-')) throw new Error('Unsafe fixture cleanup');
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});

async function runCli(mode: 'success' | 'failure' | 'retry') {
  let manifestRequests = 0;
  let articleRequests = 0;
  const server = createServer((request, response) => {
    if (request.method !== 'GET') { response.writeHead(405).end(); return; }
    const url = new URL(request.url!, 'http://localhost');
    if (url.pathname === '/editorial-manifest.json') {
      manifestRequests += 1;
      const fail = mode === 'failure' || (mode === 'retry' && manifestRequests === 1);
      response.writeHead(fail ? 503 : 200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(fail ? { unavailable: true } : manifest));
    } else if (url.pathname === `/ressources/${article.slug}/`) {
      articleRequests += 1;
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(`<html><head><link rel="canonical" href="https://levois.fr/ressources/${article.slug}/"><meta name="levois:topic-id" content="${article.topicId}"><meta name="levois:revision" content="1"></head><body><h1>${article.title}</h1></body></html>`);
    } else response.writeHead(404).end();
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Local HTTP server unavailable');
  const output = resolve(fixtureRoot, `${mode}-receipts.json`);
  try {
    const result = await new Promise<{ code: number | null; signal: string | null; stdout: string; stderr: string }>((done, reject) => {
      const child = spawn(process.execPath, [
        '--import', './local-http.mjs', 'scripts/editorial-confirm.mjs',
        '--host', 'https://levois.fr/', '--from-catalog', '--attempts', mode === 'retry' ? '2' : '1', '--output', output,
      ], {
        cwd: fixtureRoot,
        env: { ...process.env, CF_ACCESS_CLIENT_ID: '', CF_ACCESS_CLIENT_SECRET: '', LEVOIS_EDITORIAL_BUILD_AT: '2026-10-28T06:01:00Z', CLI_TEST_ORIGIN: `http://127.0.0.1:${address.port}` },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '', stderr = '';
      const timeout = setTimeout(() => { child.kill(); reject(new Error('CLI did not terminate within 12 seconds')); }, 12_000);
      child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
      child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
      child.once('error', (error) => { clearTimeout(timeout); reject(error); });
      // close, rather than exit, also waits for stdout/stderr pipes to drain.
      child.once('close', (code, signal) => { clearTimeout(timeout); done({ code, signal, stdout, stderr }); });
    });
    const report = JSON.parse(await readFile(output, 'utf8'));
    expect((await readdir(fixtureRoot)).filter((name) => name.endsWith('.tmp'))).toEqual([]);
    return { ...result, report, manifestRequests, articleRequests };
  } finally {
    server.closeAllConnections();
    await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
  }
}

describe('editorial-confirm : contrat de sortie du processus réel', () => {
  it('termine naturellement avec code 0, reçu complet et stdout drainé après des requêtes HTTP', async () => {
    const result = await runCli('success');
    expect(result).toMatchObject({ code: 0, signal: null, stderr: '', manifestRequests: 1, articleRequests: 1 });
    expect(result.stdout.trim().split('\n')).toHaveLength(2);
    expect(JSON.parse(result.stdout.split('\n')[0])).toMatchObject({ deploymentState: 'verified', articleCount: 1, verifiedCount: 1 });
    expect(result.stdout).toMatch(/CLI_EVENT_LOOP_DRAINED\n$/);
    expect(result.report.receipts[0]).toMatchObject({ deploymentState: 'verified', socialReady: true });
  }, 15_000);

  it('conserve un reçu failed et renvoie code 1 quand la publication ne peut pas être confirmée', async () => {
    const result = await runCli('failure');
    expect(result).toMatchObject({ code: 1, signal: null, manifestRequests: 1, articleRequests: 0 });
    expect(result.stderr).toContain('Publication non confirmée');
    expect(result.stdout).not.toContain('"deploymentState":"verified"');
    expect(result.report.receipts[0]).toMatchObject({ deploymentState: 'failed', socialReady: false, failureCode: 'manifest_http_503' });
  }, 15_000);

  it('réessaie après un échec transitoire puis ferme normalement sans laisser le reçu failed', async () => {
    const result = await runCli('retry');
    expect(result).toMatchObject({ code: 0, signal: null, stderr: '', manifestRequests: 2, articleRequests: 1 });
    const lines = result.stdout.trim().split('\n');
    expect(lines).toHaveLength(3);
    expect(lines.slice(0, 2).map((line) => JSON.parse(line).deploymentState)).toEqual(['failed', 'verified']);
    expect(lines[2]).toBe('CLI_EVENT_LOOP_DRAINED');
    expect(result.report).toMatchObject({ deploymentState: 'verified' });
    expect(result.report.receipts[0]).toMatchObject({ socialReady: true, failureCode: null });
  }, 15_000);
});
