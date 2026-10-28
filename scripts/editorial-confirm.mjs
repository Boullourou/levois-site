import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { setTimeout } from 'node:timers/promises';

const { values } = parseArgs({ options: { host: { type: 'string' } }, strict: true });
if (!values.host) throw new Error('--host attendu');
const host = new URL(values.host);
if (host.protocol !== 'https:' || host.username || host.password || host.port || host.pathname !== '/' || host.search || host.hash || (!['levois.fr', 'www.levois.fr', 'levois-site.pages.dev'].includes(host.hostname) && !host.hostname.endsWith('.levois-site.pages.dev'))) throw new Error('Hôte LEVOIS HTTPS attendu');
const root = fileURLToPath(new URL('../', import.meta.url));
const expected = JSON.parse(await readFile(resolve(root, 'dist/editorial-manifest.json'), 'utf8'));
for (let attempt = 0; attempt < 12; attempt += 1) {
  const url = new URL('/editorial-manifest.json', host);
  url.searchParams.set('release', expected.fingerprint);
  try {
    const response = await fetch(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000) });
    if (response.ok) {
      const actual = await response.json();
      if (actual.schemaVersion === 1 && actual.fingerprint === expected.fingerprint) {
        console.log(`Catalogue confirmé sur ${host.hostname} : ${expected.articles.length} article(s) éditoriaux.`);
        process.exit(0);
      }
    }
  } catch { /* A transient public GET failure can be retried; never report it as success. */ }
  if (attempt < 11) await setTimeout(5000);
}
throw new Error('Déploiement envoyé mais catalogue public non confirmé ; consulter Cloudflare et relancer la vérification.');
