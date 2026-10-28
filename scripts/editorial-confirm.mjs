import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { setTimeout } from 'node:timers/promises';
import { validateEditorialHost, editorialManifestRequest } from './editorial-http.mjs';

const { values } = parseArgs({ options: { host: { type: 'string' } }, strict: true });
if (!values.host) throw new Error('--host attendu');
const host = validateEditorialHost(values.host);
const root = fileURLToPath(new URL('../', import.meta.url));
const expected = JSON.parse(await readFile(resolve(root, 'dist/editorial-manifest.json'), 'utf8'));
// Fail immediately on a partial/malformed token rather than hide it as a transient failure.
editorialManifestRequest(host, { release: expected.fingerprint });
for (let attempt = 0; attempt < 12; attempt += 1) {
  const request = editorialManifestRequest(host, { release: expected.fingerprint, timeoutMs: 10000, noStore: true });
  try {
    const response = await fetch(request.url, request.options);
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
