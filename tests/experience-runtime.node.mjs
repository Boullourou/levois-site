import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.LEVOIS_RUNTIME_BASE||'http://127.0.0.1:8796';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname),'Local only');
const report=[],endpoint=base+'/api/experience/operator';
let csrf='',created=false;const requestId=crypto.randomUUID();
async function get(url){assert.equal(new URL(url).origin,new URL(base).origin);return fetch(url,{redirect:'error'});}
async function command(body){return fetch(endpoint,{method:'POST',redirect:'error',headers:{origin:base,'content-type':'application/json','X-LEVOIS-CSRF':csrf},body:JSON.stringify(body)});}
try{
 const page=await get(base+'/cockpit/relectures/');assert.equal(page.status,200);assert.match(page.headers.get('cache-control'),/no-store/);assert.match(await page.text(),/Relectures et continuité/);report.push('Page privée servie par Pages avec no-store');
 const listing=await get(endpoint);assert.equal(listing.status,200);const envelope=await listing.json();csrf=envelope.csrfToken;assert.ok(csrf);report.push('API opérateur et CSRF fonctionnels dans Pages');
 const denied=await fetch(endpoint,{method:'POST',headers:{origin:'https://foreign.example','content-type':'application/json'},body:'{}'});assert.equal(denied.status,403);
 const invalid=await fetch(base+'/api/experience/actions',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:'{}'});assert.equal(invalid.status,400);report.push('Mutations étrangères et demande publique sans permission refusées');
 const now=new Date().toISOString();const context={schemaVersion:1,id:crypto.randomUUID(),revision:0,project:'buyer',entry:{door:'known',source:null,promise:null},answers:{},createdAt:now,updatedAt:now};
 const create=await command({operation:'create-context',requestId,context,synthesis:'Contexte fictif de recette locale. Aucun financement confirmé.',email:'fixture@example.test',authorized:true,permissionEvidence:'Fixture locale : accord de test seulement.',agreedAt:now});assert.equal(create.status,201);created=true;
 const noteId=crypto.randomUUID(),note=await command({operation:'annotate',requestId,noteId,text:'Note fictive locale.',reason:'Vérifier la conservation de versions distinctes.',evidence:'Aucune donnée personnelle réelle.'});assert.equal(note.status,200);
 const detail=await get(endpoint+'?id='+requestId),result=await detail.json();assert.equal(result.request.id,requestId);assert.equal(result.notes[0].id,noteId);assert.equal(JSON.parse(result.request.context_json).revision,0);report.push('Contexte version0 et note attribuée persistés dans D1 locale');
 const removed=await command({operation:'delete',requestId,confirm:'delete-operational-request'});assert.equal(removed.status,200);created=false;
 const gone=await get(endpoint+'?id='+requestId);assert.equal(gone.status,404);report.push('Suppression réelle du dossier et de ses notes dans D1 locale');
 await fs.mkdir('artifacts/continuite-operateur',{recursive:true});await fs.writeFile('artifacts/continuite-operateur/runtime.json',JSON.stringify({passed:true,scope:'localhost only; no mail endpoint exercised',checks:report},null,2));
 console.log(JSON.stringify({passed:true,checks:report},null,2));
}finally{if(created)await command({operation:'delete',requestId,confirm:'delete-operational-request'});}
