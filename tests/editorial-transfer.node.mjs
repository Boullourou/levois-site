import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { seal, unseal, safePath, validateTransfer, digest, canonical, writeEnvelope, boundedFile } from '../scripts/editorial-transfer.mjs';
const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
test('chiffrement authentifié, lecture exacte, aucun texte clair dans le transport', () => {
  const data = Buffer.from('Un brouillon privé. ' .repeat(20000));
  const e = seal(data, keys.publicKey);
  assert.deepEqual(unseal(e.header, e.chunks, keys.privateKey), data);
  assert(!JSON.stringify(e).includes('brouillon'));
  const changed = structuredClone(e); changed.chunks[0] = 'X' + changed.chunks[0].slice(1);
  assert.throws(() => unseal(changed.header, changed.chunks, keys.privateKey), /CHUNK_INVALID/);
  const wrongTag = structuredClone(e); wrongTag.header.tag = Buffer.alloc(16).toString('base64');
  assert.throws(() => unseal(wrongTag.header, wrongTag.chunks, keys.privateKey), /DECRYPTION_FAILED/);
  const wrongId = structuredClone(e); wrongId.header.transferId = '0'.repeat(64);
  assert.throws(() => unseal(wrongId.header, wrongId.chunks, keys.privateKey), /DECRYPTION_FAILED/);
});
test('identité stable indépendante de la clé aléatoire et de l’ordre des propriétés', () => {
  assert.equal(canonical({b:2,a:{z:3,c:1}}), canonical({a:{c:1,z:3},b:2}));
  const a = seal(Buffer.from('same'), keys.publicKey), b = seal(Buffer.from('same'), keys.publicKey);
  assert.equal(a.header.transferId,b.header.transferId); assert.notEqual(a.chunks[0],b.chunks[0]);
});
test('traversée, chemins Windows, fichiers cachés et symlinks refusés', async () => {
  for (const p of ['../secret','C:/secret','/secret','a\\secret','.env','a/../b','a//b']) assert.throws(() => safePath(p));
  const root=await mkdtemp(resolve(tmpdir(),'intake-test-'));
  try {await writeFile(resolve(root,'ok.json'),'1234');assert.equal((await boundedFile(root,'ok.json',4)).toString(),'1234');await assert.rejects(boundedFile(root,'ok.json',3),/FILE_SIZE_INVALID/);} finally {await rm(root,{recursive:true,force:true});}
});
function fixture() {
  const files = [{path:'LOT.json',base64:Buffer.from('{}').toString('base64')}];
  for(let i=1;i<=7;i++) for(const name of ['PRODUCTION.json','cover.webp']) files.push({path:`J${String(i).padStart(3,'0')}_2026-11-01/${name}`,base64:Buffer.from('{}').toString('base64')});
  return {manifest:{schemaVersion:1,batchId:'test-batch',mode:'prepared-v3',lot:'LOT.json',files:files.map(f=>({path:f.path,bytes:2,sha256:digest('{}')}))},files};
}
test('empreintes, doublons, type, taille et absence de fichiers vérifiés avant extraction',()=>{
  assert.equal(validateTransfer(fixture()).files.length,15);
  let p=fixture();p.files[1].base64=Buffer.from('xx').toString('base64');assert.throws(()=>validateTransfer(p),/HASH/);
  p=fixture();p.files[1]=p.files[0];p.manifest.files[1]=p.manifest.files[0];assert.throws(()=>validateTransfer(p),/MANIFEST/);
  p=fixture();p.files.pop();assert.throws(()=>validateTransfer(p),/MANIFEST/);
  p=fixture();p.manifest.files[1].path=p.files[1].path='scripts/evil.mjs';assert.throws(()=>validateTransfer(p),/TYPE_FORBIDDEN/);
  p=fixture();p.manifest.files[1].bytes=25000001;assert.throws(()=>validateTransfer(p),/MANIFEST/);
});
test('rejeu local n’écrase jamais une enveloppe existante', async()=>{
  const root=await mkdtemp(resolve(tmpdir(),'intake-test-'));
  try {const e=seal(Buffer.from('test'),keys.publicKey);await writeEnvelope(root,e);await assert.rejects(writeEnvelope(root,e),/EEXIST/);}finally{await rm(root,{recursive:true,force:true});}
});
