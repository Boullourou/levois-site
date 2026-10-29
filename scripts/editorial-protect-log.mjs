import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { seal, writeEnvelope } from './editorial-transfer.mjs';
import { repoRoot } from './editorial-io.mjs';
try {
  const [file,out] = process.argv.slice(2);
  const bytes = await readFile(file), key = await readFile(resolve(repoRoot,'config/editorial-intake/public.pem'),'utf8');
  await writeEnvelope(out,seal(bytes,key));
} catch { console.error('LOG_ENCRYPTION_FAILED'); process.exitCode=1; }
