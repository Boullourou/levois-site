import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtemp, rm, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { productionFixture } from './fixtures/editorial-production.ts';
import { seal, digest, writeEnvelope } from '../scripts/editorial-transfer.mjs';
import { receive, finalize } from '../scripts/editorial-receive.mjs';
const keys=generateKeyPairSync('rsa',{modulusLength:2048});
async function fixture(broken=false) {
  const png=await sharp({create:{width:1600,height:900,channels:3,background:'#f7f6f2'}}).png().toBuffer();
  const lot={schemaVersion:1,batchId:'test-seven-days',campaignId:'campagne-test',days:[]},files=[];
  for(let i=1;i<=7;i++) {
    const date=`2026-11-${String(i).padStart(2,'0')}`,p=productionFixture(i,date),dir=`${p.id}_${date}`;
    p.article.markdown+='\n\nAuteur de test — conseiller de test. RSAC Exemple 000. Périmètre explicitement fourni.';
    if(broken && i===1) delete p.article.meta_description;
    const production=dir+'/PRODUCTION.json',cover=dir+`/EXPORTS/article/cover_${p.id}.png`;
    lot.days.push({production,cover,coverWidth:1600,coverHeight:900});
    files.push({path:production,base64:Buffer.from(JSON.stringify(p)).toString('base64')},{path:cover,base64:png.toString('base64')});
  }
  files.push({path:'LOT.json',base64:Buffer.from(JSON.stringify(lot)).toString('base64')});
  return {manifest:{schemaVersion:1,batchId:lot.batchId,mode:'source',lot:'LOT.json',files:files.map(f=>({path:f.path,bytes:Buffer.from(f.base64,'base64').length,sha256:digest(Buffer.from(f.base64,'base64'))}))},files};
}
test('lot source reçu, adapté, images préparées, brouillons seulement, rejeu identique',async()=>{
  const root=await mkdtemp(resolve(tmpdir(),'receive-test-')),catalog=await readdir('src/content/editorial');
  try {
    await writeEnvelope(resolve(root,'in'),seal(Buffer.from(JSON.stringify(await fixture())),keys.publicKey));
    const a=await receive(resolve(root,'in'),resolve(root,'out1'),keys.privateKey);
    assert.equal(a.state,'validated-awaiting-build');assert.equal(a.count,7);assert.equal(a.compression,'runner-sharp');assert(a.articles.every(a=>a.state==='draft'));
    const b=await receive(resolve(root,'in'),resolve(root,'out2'),keys.privateKey);
    assert.equal(a.fingerprint,b.fingerprint);assert.equal(a.transferId,b.transferId);
    assert.deepEqual(await readdir('src/content/editorial'),catalog);
    assert.equal((await finalize(resolve(root,'out1'),true)).state,'prepared');
    assert.equal((await finalize(resolve(root,'out2'),false)).code,'BUILD_FAILED');
  }finally{await rm(root,{recursive:true,force:true});}
});
test('champ indispensable absent : rejet exploitable sans texte privé dans le reçu',async()=>{
  const root=await mkdtemp(resolve(tmpdir(),'receive-test-'));
  try {
    await writeEnvelope(resolve(root,'in'),seal(Buffer.from(JSON.stringify(await fixture(true))),keys.publicKey));
    const result=await receive(resolve(root,'in'),resolve(root,'out'),keys.privateKey);
    assert.equal(result.state,'rejected');assert.equal(result.code,'CONTENT_VALIDATION_FAILED');assert.equal(result.field,'production.article.meta_description');
    assert(!(await readFile(resolve(root,'out/RECEIPT.json'),'utf8')).includes('Un texte'));
  }finally{await rm(root,{recursive:true,force:true});}
});
test('clé manquante : refus explicite sans faux succès',async()=>{
  const root=await mkdtemp(resolve(tmpdir(),'receive-test-'));
  try {const r=await receive('absent',root,null);assert.equal(r.code,'INTAKE_KEY_MISSING');assert.equal(r.state,'rejected');}finally{await rm(root,{recursive:true,force:true});}
});
