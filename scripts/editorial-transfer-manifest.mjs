// No dependencies: runs in ARTICLE's existing Node runtime without npm.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, posix } from 'node:path';
import { boundedFile, digest } from './editorial-transfer.mjs';
try {
  const [root, mode, output] = process.argv.slice(2);
  if (!root || !output || !['prepared-v3','source'].includes(mode)) throw new Error('MANIFEST_USAGE');
  const lot = JSON.parse((await boundedFile(root,'LOT.json',100000)).toString());
  if (!Array.isArray(lot.days) || lot.days.length !== 7) throw new Error('SEVEN_DAYS_REQUIRED');
  const paths = ['LOT.json', ...lot.days.flatMap(day => [day.production, mode === 'prepared-v3' ? posix.dirname(day.production) + '/cover.webp' : day.cover])].sort();
  const files = [];
  for (const path of paths) { const bytes = await boundedFile(root,path,25000000); files.push({path,bytes:bytes.length,sha256:digest(bytes)}); }
  await writeFile(output, JSON.stringify({schemaVersion:1,batchId:lot.batchId,mode,lot:'LOT.json',files},null,2)+'\n',{flag:'wx'});
  console.log('TRANSFER_MANIFEST_CREATED');
} catch(error) { console.error(/^[A-Z_]+$/.test(error.message)?error.message:'MANIFEST_FAILED_CHECK_PATHS');process.exitCode=1; }
