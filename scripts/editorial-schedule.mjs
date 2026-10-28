import { appendFile, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { editorialBuildTime, parisDateParts } from '../src/lib/editorial/schema.ts';
import { repoRoot, loadEditorialCatalog, createEditorialManifest } from './editorial-io.mjs';

const { values } = parseArgs({ options: { host: { type: 'string' }, 'write-manifest': { type: 'boolean', default: false }, force: { type: 'boolean', default: false } }, strict: true });
const now = values['write-manifest']
  ? editorialBuildTime(JSON.parse(await readFile(resolve(repoRoot, 'src/lib/editorial/build-clock.generated.json'), 'utf8')).at)
  : editorialBuildTime(process.env.LEVOIS_EDITORIAL_BUILD_AT);
const manifest = createEditorialManifest(await loadEditorialCatalog(), now);
if (values['write-manifest']) {
  await writeFile(resolve(repoRoot, 'dist/editorial-manifest.json'), `${JSON.stringify(manifest)}\n`);
} else {
  if (!values.host) throw new Error('--host attendu : URL publique du déploiement à comparer');
  const host = new URL(values.host);
  if (host.protocol !== 'https:' || host.username || host.password || host.port || host.pathname !== '/' || host.search || host.hash || (!['levois.fr', 'www.levois.fr', 'levois-site.pages.dev'].includes(host.hostname) && !host.hostname.endsWith('.levois-site.pages.dev'))) throw new Error('Hôte LEVOIS HTTPS attendu, sans chemin, identifiants ni paramètres');
  const local = parisDateParts(now);
  const inWindow = local.hour >= 7 && local.hour < 10;
  let shouldBuild = false;
  if (inWindow || values.force) {
    const response = await fetch(new URL('/editorial-manifest.json', host), { headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(15000), redirect: 'error' });
    if (response.status === 404) shouldBuild = manifest.articles.length > 0;
    else {
      if (!response.ok) throw new Error(`Lecture du manifeste refusée (${response.status}) ; aucun déploiement déclenché`);
      const deployed = await response.json();
      if (deployed.schemaVersion !== 1 || typeof deployed.fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(deployed.fingerprint)) throw new Error('Manifeste distant invalide ; aucun déploiement déclenché');
      shouldBuild = deployed.fingerprint !== manifest.fingerprint;
    }
  }
  const result = { shouldBuild, parisDate: local.date, parisHour: local.hour, articleCount: manifest.articles.length, fingerprint: manifest.fingerprint };
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `should_build=${shouldBuild}\n`);
  console.log(JSON.stringify(result));
}
