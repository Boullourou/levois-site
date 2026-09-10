import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import type { D1Database } from '@cloudflare/workers-types';
import { onRequest as actions } from '../functions/api/experience/actions';
import { onRequest as resume } from '../functions/api/experience/reprise';
import { onRequest as operator } from '../functions/api/experience/operator';
import { createCsrfToken } from '../functions/_lib/cockpit/security';
import type { ExperienceEnv } from '../functions/_lib/experience/common';

let sequence=0; const databases:DatabaseSync[]=[]; const now='2026-09-10T12:00:00.000Z';
const project={schemaVersion:1,id:'test-project',revision:1,project:'buyer',entry:{door:'direct',source:null,promise:null},createdAt:now,updatedAt:now,
  answers:{usage:{value:'Travailler au calme',provenance:'declared',updatedAt:now,revision:1}},
  reading:{id:'lecture-v1',revision:1,title:'Mon achat',sections:[],nextDecision:{text:'Vérifier les ressources',why:'Budget déclaré'},limits:['Aucun financement confirmé.'],methodVersion:'2026-09-10',generatedAt:now}};
function payload(action='review',patch:Record<string,unknown>={}){return {requestId:crypto.randomUUID(),action,channel:'email',email:'visiteur@example.test',approved:true,context:project,synthesis:'Version exacte approuvée.\nBudget estimé ; financement non vérifié.',consent:{purpose:action==='email-copy'?'copy':action,textVersion:'2026-09-10',acceptedAt:now},...patch};}
function context(body:unknown,env:ExperienceEnv={},path='actions',headers:Record<string,string>={}){return {request:new Request('https://levois.test/api/experience/'+path,{method:'POST',headers:{origin:'https://levois.test','content-type':'application/json','cf-connecting-ip':'test-'+(++sequence),...headers},body:JSON.stringify(body)}),env};}
function database(){
  const db=new DatabaseSync(':memory:');db.exec(readFileSync('db/schema.sql','utf8'));db.exec(readFileSync('db/experience.sql','utf8'));databases.push(db);
  const binding={prepare(sql:string){let values:any[]=[];return {bind(...args:any[]){values=args;return this;},async first(){return db.prepare(sql).get(...values)??null;},async run(){const r=db.prepare(sql).run(...values);return {success:true,results:[],meta:{changes:r.changes}};},async all(){return {success:true,results:db.prepare(sql).all(...values),meta:{}};}};}} as D1Database;
  return {db,env:{RECHERCHE_DB:binding,RESEND_API_KEY:'fixture-no-live-key',LEAD_FROM:'LEVOIS <source@example.test>',LEAD_TO:'mouaad@example.test',EXPERIENCE_ACCESS_SECRET:'fixture-access-secret-long-enough-for-tests',EXPERIENCE_PUBLIC_ORIGIN:'https://levois.test',COCKPIT_LOCAL_BYPASS:'1',COCKPIT_CSRF_SECRET:'fixture-csrf-secret-long-enough-for-tests'} satisfies ExperienceEnv};
}
async function operate(env:ExperienceEnv,body:Record<string,unknown>){
  const request=new Request('http://127.0.0.1:8788/api/experience/operator',{method:'POST'});
  const csrf=await createCsrfToken(request,{id:'local:operator',email:'local@cockpit.invalid',local:true},env);
  return operator({env,request:new Request(request.url,{method:'POST',headers:{origin:'http://127.0.0.1:8788','content-type':'application/json','X-LEVOIS-CSRF':csrf},body:JSON.stringify(body)})});
}
async function grant(){
  const {db,env}=database();const data=payload();await actions(context(data,env));const noteId=crypto.randomUUID();
  expect((await operate(env,{operation:'annotate',requestId:data.requestId,noteId,text:'Vérification à reprendre.',reason:'Le montant est encore estimé.',evidence:'Déclaration lors de notre échange.'})).status).toBe(200);
  const access=await operate(env,{operation:'create-access',requestId:data.requestId,noteId,authorized:true,expiresAt:'2026-09-12T12:00:00.000Z'});expect(access.status).toBe(201);
  const result:any=await access.json();return {db,env,data,noteId,accessId:result.accessId,token:result.url.split('=')[1] as string};
}
function captureCode(){const call=vi.mocked(fetch).mock.calls.findLast(([,init])=>String(init?.body).includes('Votre code de reprise'));expect(call).toBeTruthy();return JSON.parse(String(call![1]?.body)).text.match(/: (\d{8})/)[1];}
beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(now);vi.stubGlobal('fetch',vi.fn().mockImplementation(async()=>new Response('{}',{status:200})));});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks();databases.splice(0).forEach(db=>db.close());});

describe('Actions distinctes et version approuvée',()=>{
  it('envoie une copie au visiteur seul sans dossier et sans base',async()=>{
    const input=payload('email-copy',{context:undefined});const response=await actions(context(input,{RESEND_API_KEY:'fixture-only',LEAD_TO:'mouaad@example.test'}));
    expect(await response.json()).toMatchObject({ok:true,saved:false,notificationSent:true});
    const mail=JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));expect(mail.to).toEqual(['visiteur@example.test']);expect(mail).not.toHaveProperty('bcc');expect(mail).not.toHaveProperty('cc');expect(mail.text).toContain(input.synthesis);expect(mail).not.toHaveProperty('reply_to');expect(mail.text).not.toContain('answers');expect(mail.text).not.toContain(project.answers.usage.value);
  });
  it('ne crée aucune trace D1 pour la copie et ne la détourne pas vers Formspree',async()=>{
    const {db,env}=database();await actions(context(payload('email-copy'),env));
    for(const table of ['experience_requests','lectures_recherche'])expect(db.prepare('SELECT count(*) AS n FROM '+table).get()).toMatchObject({n:0});
    vi.mocked(fetch).mockClear();const response=await actions(context(payload('email-copy')));expect(response.status).toBe(503);expect(await response.json()).toMatchObject({saved:false,notificationSent:false});expect(fetch).not.toHaveBeenCalled();
  });
  it.each([{approved:false},{consent:{purpose:'exchange',acceptedAt:now,textVersion:'2026-09-10'}},{channel:'phone',phone:'0781380121'},{email:'a@example.test\r\nBcc: x@example.test'},{context:{schemaVersion:99}},{synthesis:''}])('refuse une intention ou version malformée : %j',async patch=>{
    const {db,env}=database();expect((await actions(context(payload('review',patch),env))).status).toBe(400);expect(fetch).not.toHaveBeenCalled();expect(db.prepare('SELECT count(*) AS n FROM experience_requests').get()).toMatchObject({n:0});
  });
  it('requiert seulement le téléphone pour un échange téléphonique choisi',async()=>{
    const {db,env}=database();const r=await actions(context(payload('exchange',{email:undefined,channel:'phone',phone:'0781380121'}),env));expect(r.status).toBe(200);expect(db.prepare('SELECT channel,contact_email,contact_phone FROM experience_requests').get()).toMatchObject({channel:'phone',contact_email:null,contact_phone:'0781380121'});
  });
  it('enregistre avant notification et garde contexte, synthèse et intention exacts',async()=>{
    const {db,env}=database();const input=payload();vi.mocked(fetch).mockImplementation(async()=>{expect(db.prepare('SELECT count(*) AS n FROM experience_requests').get()).toMatchObject({n:1});return new Response('{}');});
    expect(await (await actions(context(input,env))).json()).toMatchObject({saved:true,notificationSent:true});const row:any=db.prepare('SELECT * FROM experience_requests').get();expect(row.synthesis).toBe(input.synthesis);expect(JSON.parse(row.context_json)).toEqual(project);expect(JSON.parse(row.consent_json)).toMatchObject({purpose:'review',textVersion:'2026-09-10',recordedAt:now});
  });
  it('préserve une demande sur panne sans doublon ni retry automatique incertain',async()=>{
    const {db,env}=database();const input=payload();vi.mocked(fetch).mockRejectedValue(new Error('timeout secret@example.test'));
    expect(await(await actions(context(input,env))).json()).toMatchObject({ok:true,saved:true,notificationSent:false,notificationState:'unknown'});await actions(context(input,env));expect(fetch).toHaveBeenCalledTimes(1);expect(db.prepare('SELECT count(*) AS n FROM experience_requests').get()).toMatchObject({n:1});
  });
  it('déduplique les validations simultanées et refuse le changement sous la même référence',async()=>{
    const {db,env}=database();const input=payload();await Promise.all([actions(context(input,env)),actions(context(input,env))]);expect(fetch).toHaveBeenCalledTimes(1);expect((await actions(context({...input,synthesis:'Autre contenu'},env))).status).toBe(409);expect(db.prepare('SELECT count(*) AS n FROM experience_requests').get()).toMatchObject({n:1});
  });
  it('réessaie un refus certain sans nouveau dossier et avec la même clé prestataire',async()=>{
    const {db,env}=database();const input=payload();vi.mocked(fetch).mockResolvedValueOnce(new Response('{}',{status:429})).mockResolvedValueOnce(new Response('{}'));await actions(context(input,env));await actions(context(input,env));
    const keys=vi.mocked(fetch).mock.calls.map(([,init])=>new Headers(init?.headers).get('idempotency-key'));expect(keys[0]).toBe(keys[1]);expect(db.prepare('SELECT count(*) AS n FROM experience_requests').get()).toMatchObject({n:1});
  });
  it('ne confirme rien sans stockage ou après insertion échouée',async()=>{
    expect((await actions(context(payload()))).status).toBe(503);const {db,env}=database();db.exec('DROP TABLE experience_requests');expect((await actions(context(payload(),env))).status).toBe(503);expect(fetch).not.toHaveBeenCalled();
  });
  it('refuse origine étrangère, corps trop grand et JSON non objet',async()=>{
    expect((await actions(context(payload(),{},'actions',{origin:'https://elsewhere.test'}))).status).toBe(403);expect((await actions(context(payload('review',{synthesis:'x'.repeat(110000)})))).status).toBe(413);expect((await actions(context([]))).status).toBe(400);expect(fetch).not.toHaveBeenCalled();
  });
});
describe('Reprise protégée et continuité humaine',()=>{
  it('refuse opérateur anonyme et mutation sans CSRF',async()=>{
    const {env}=database();expect((await operator(context({},{...env,COCKPIT_ALLOWED_HOSTS:'levois.test'},'operator'))).status).toBe(401);
    expect((await operator({env,request:new Request('http://127.0.0.1:8788/api/experience/operator',{method:'POST',headers:{origin:'http://127.0.0.1:8788','content-type':'application/json'},body:'{}'})})).status).toBe(403);
  });
  it('crée le contexte après échange avec trace d’accord et aucun envoi',async()=>{
    const {db,env}=database();const response=await operate(env,{operation:'create-context',requestId:crypto.randomUUID(),context:project,email:'known@example.test',synthesis:'Contexte convenu ensemble.',authorized:true,permissionEvidence:'Accord donné pour la reprise par e-mail.',agreedAt:now});
    expect(response.status).toBe(201);expect(fetch).not.toHaveBeenCalled();const row:any=db.prepare('SELECT * FROM experience_requests').get();expect(row.contact_email).toBe('known@example.test');expect(row.notification_state).toBe('not-requested');expect(JSON.parse(row.consent_json).origin).toBe('operator-after-exchange');
  });
  it('stocke seulement les empreintes et ne révèle aucun contexte avant OTP',async()=>{
    const {db,env,token}=await grant();vi.mocked(fetch).mockClear();const row:any=db.prepare('SELECT * FROM experience_access').get();expect(row.token_hash).not.toBe(token);expect(JSON.stringify(row)).not.toContain(token);
    const valid=await resume(context({step:'challenge',token},env,'reprise'));const code=captureCode();expect(JSON.stringify(db.prepare('SELECT * FROM experience_access').get())).not.toContain(code);
    const invalid=await resume(context({step:'challenge',token:'a'.repeat(64)},env,'reprise'));expect(await valid.text()).toBe(await invalid.text());const mail=JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));expect(mail.to).toEqual(['visiteur@example.test']);expect(mail.text).not.toContain('Travailler au calme');
  });
  it('ouvre version et note attribuée après OTP, interdit le rejeu simultané',async()=>{
    const {env,token}=await grant();vi.mocked(fetch).mockClear();await resume(context({step:'challenge',token},env,'reprise'));const code=captureCode();
    const responses=await Promise.all([resume(context({step:'verify',token,code},env,'reprise')),resume(context({step:'verify',token,code},env,'reprise'))]);expect(responses.map(r=>r.status).sort()).toEqual([200,403]);
    const result:any=await responses.find(r=>r.status===200)!.json();expect(result.context).toEqual(project);expect(result.humanNote).toMatchObject({author:'Mouaad Boullourou',reason:'Le montant est encore estimé.',createdAt:now});expect(result).not.toHaveProperty('contact_email');
  });
  it('limite les codes erronés sans remettre le compteur à zéro',async()=>{
    const {db,env,token}=await grant();vi.mocked(fetch).mockClear();await resume(context({step:'challenge',token},env,'reprise'));const code=captureCode();
    for(let i=0;i<5;i++)expect((await resume(context({step:'verify',token,code:code==='11111111'?'22222222':'11111111'},env,'reprise'))).status).toBe(403);
    vi.setSystemTime(Date.now()+61000);await resume(context({step:'challenge',token},env,'reprise'));expect(fetch).toHaveBeenCalledTimes(1);expect((await resume(context({step:'verify',token,code},env,'reprise'))).status).toBe(403);expect(db.prepare('SELECT attempts FROM experience_access').get()).toMatchObject({attempts:5});
  });
  it.each(['expired','revoked','code-expired'])('refuse un accès %s sans projet',async state=>{
    const {db,env,token,data,accessId}=await grant();vi.mocked(fetch).mockClear();await resume(context({step:'challenge',token},env,'reprise'));const code=captureCode();
    if(state==='expired')vi.setSystemTime('2026-09-13T12:00:00Z');if(state==='code-expired')vi.setSystemTime(Date.now()+11*60000);if(state==='revoked')await operate(env,{operation:'revoke-access',requestId:data.requestId,accessId});
    const response=await resume(context({step:'verify',token,code},env,'reprise'));expect(response.status).toBe(403);expect(await response.text()).not.toContain('Travailler au calme');expect(db.prepare('SELECT count(*) AS n FROM experience_access').get()).toMatchObject({n:1});
  });
  it('supprime notes et accès avec le dossier',async()=>{
    const {db,env,data}=await grant();expect((await operate(env,{operation:'delete',requestId:data.requestId,confirm:'delete-operational-request'})).status).toBe(200);
    for(const table of ['experience_requests','experience_notes','experience_access'])expect(db.prepare('SELECT count(*) AS n FROM '+table).get()).toMatchObject({n:0});
  });
});

describe('Échecs explicites et accès opérateur',()=>{
  it('invalide le code si le prestataire refuse son envoi sans révéler le dossier',async()=>{
    const {db,env,token}=await grant();vi.mocked(fetch).mockClear();vi.mocked(fetch).mockResolvedValueOnce(new Response('{}',{status:503}));
    const response=await resume(context({step:'challenge',token},env,'reprise'));const result:any=await response.json();
    expect(result.ok).toBe(true);expect(JSON.stringify(result)).not.toContain('visiteur@example.test');
    expect(db.prepare('SELECT code_hash,code_expires_at FROM experience_access').get()).toMatchObject({code_hash:null,code_expires_at:null});
  });
  it('échoue fermé sans secret ou envoi de code configuré',async()=>{
    const {env}=database();
    expect((await resume(context({step:'challenge',token:'a'.repeat(64)},{...env,EXPERIENCE_ACCESS_SECRET:undefined},'reprise'))).status).toBe(503);
    expect((await resume(context({step:'challenge',token:'a'.repeat(64)},{...env,RESEND_API_KEY:undefined},'reprise'))).status).toBe(503);expect(fetch).not.toHaveBeenCalled();
  });
  it('refuse le contexte chaud sans accord ou un lien révisé sans synthèse correspondante',async()=>{
    const {db,env}=database();
    expect((await operate(env,{operation:'create-context',requestId:crypto.randomUUID(),context:project,email:'known@example.test',synthesis:'Contexte',agreedAt:now,permissionEvidence:'Accord'})).status).toBe(400);
    expect(db.prepare('SELECT count(*) AS n FROM experience_requests').get()).toMatchObject({n:0});
    const input=payload();await actions(context(input,env));const noteId=crypto.randomUUID();
    await operate(env,{operation:'annotate',requestId:input.requestId,noteId,text:'Nouvelle déclaration.',reason:'Budget corrigé.',evidence:'Échange de ce jour.',context:{...project,revision:2}});
    expect((await operate(env,{operation:'create-access',requestId:input.requestId,noteId,authorized:true,expiresAt:'2026-09-12T12:00:00Z'})).status).toBe(400);
  });
  it('expose à l’opérateur notes et états mais jamais jetons ou empreintes de code',async()=>{
    const {env,token,data}=await grant();await resume(context({step:'challenge',token},env,'reprise'));
    const response=await operator({env,request:new Request('http://127.0.0.1:8788/api/experience/operator?id='+data.requestId)});
    expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toContain('no-store');
    const body=await response.text();expect(body).not.toContain(token);expect(body).not.toContain('token_hash');expect(body).not.toContain('code_hash');expect(JSON.parse(body)).toHaveProperty('csrfToken');
  });
  it('conserve les tables historiques après application répétée du schéma additif',()=>{
    const {db}=database();db.exec(readFileSync('db/experience.sql','utf8'));
    expect(db.prepare("SELECT name FROM sqlite_master WHERE name='lectures_recherche'").get()).toMatchObject({name:'lectures_recherche'});
  });
});

describe('Première lecture autonome',()=>{
 it('accepte une lecture partielle de révision zéro sans inventer de réponse',async()=>{
  const {env}=database();const input=payload('review',{context:{...project,revision:0,answers:{},reading:{...project.reading,revision:0}}});
  expect(await(await actions(context(input,env))).json()).toMatchObject({ok:true,saved:true});
 });
});
describe('Minimisation de la copie',()=>{
 it('ignore le contexte ancien ou malformé sans le transmettre au prestataire',async()=>{
  const {db,env}=database();const input=payload('email-copy',{context:{schemaVersion:999,answers:{privateValue:'À ne jamais transmettre'}}});
  expect(await(await actions(context(input,env))).json()).toMatchObject({ok:true,saved:false,notificationSent:true});
  expect(db.prepare('SELECT count(*) AS n FROM experience_requests').get()).toMatchObject({n:0});
  const mail=JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));expect(mail.to).toEqual(['visiteur@example.test']);expect(mail.text).not.toContain('privateValue');expect(mail.text).not.toContain('jamais transmettre');
 });
 it('exige encore le contexte pour toute demande humaine',async()=>{
  for(const action of ['review','exchange'])expect((await actions(context(payload(action,{context:undefined})))).status).toBe(400);
  expect(fetch).not.toHaveBeenCalled();
 });
});