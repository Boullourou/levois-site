import {afterEach,describe,expect,it,vi} from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import type {D1Database} from '@cloudflare/workers-types';
import {onRequest} from '../functions/api/lead';

const databases:DatabaseSync[]=[];
let sequence=0;
function database(){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync('db/contact-delivery.sql','utf8'));databases.push(db);
 const binding={prepare(sql:string){let values:unknown[]=[];return {
  bind(...args:unknown[]){values=args;return this;},
  async first(){return db.prepare(sql).get(...values as any[])??null;},
  async run(){const result=db.prepare(sql).run(...values as any[]);return {success:true,results:[],meta:{changes:result.changes}};},
 };}} as unknown as D1Database;
 return {db,env:{RECHERCHE_DB:binding,RESEND_API_KEY:'fixture-no-live-key',LEAD_TO_EMAIL:'advisor@example.invalid',LEAD_FROM_EMAIL:'source@example.invalid'}};
}
function payload(patch:Record<string,unknown>={}){return {requestId:crypto.randomUUID(),type:'contact',prenom:'Camille',nom:'Test',email:'camille@example.invalid',objet:'Question de test',message:'Fixture uniquement.',consentement:true,site_web:'',...patch};}
function request(body:unknown,env:Parameters<typeof onRequest>[0]['env']){return onRequest({env,request:new Request('https://levois.test/api/lead',{
 method:'POST',headers:{origin:'https://levois.test','content-type':'application/json','cf-connecting-ip':'contact-qa-'+(++sequence)},body:JSON.stringify(body),
})});}
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();databases.splice(0).forEach(db=>db.close());});

describe('Contact : reçus durables et transmission confirmée',()=>{
 it('déduplique une réponse perdue et conserve une même clé prestataire',async()=>{
  const {env,db}=database(),input=payload();vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{}')));
  const first=await request(input,env),second=await request(input,env);
  expect(await first.json()).toMatchObject({ok:true,notificationSent:true,notificationState:'sent',requestId:input.requestId});
  expect(await second.json()).toMatchObject({ok:true,notificationSent:true,requestId:input.requestId});
  expect(fetch).toHaveBeenCalledOnce();expect(new Headers(vi.mocked(fetch).mock.calls[0][1]?.headers).get('idempotency-key')).toBe('levois-contact-'+input.requestId);
  const receipt=db.prepare('SELECT * FROM contact_delivery_receipts').get();expect(receipt).toMatchObject({id:input.requestId,attempts:1});
  expect(JSON.stringify(receipt)).not.toContain(input.email);expect(JSON.stringify(receipt)).not.toContain(input.message);
  expect(first.headers.get('cache-control')).toContain('private, no-store');
 });
 it('ne contacte le destinataire qu’une fois lors de deux requêtes concurrentes',async()=>{
  const {env}=database(),input=payload();vi.stubGlobal('fetch',vi.fn().mockImplementation(async()=>new Response('{}')));
  await Promise.all([request(input,env),request(input,env)]);expect(fetch).toHaveBeenCalledOnce();
 });
 it('refuse une autre demande sous un identifiant déjà utilisé',async()=>{
  const {env}=database(),input=payload();vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{}')));
  await request(input,env);const result=await request({...input,message:'Un autre message.'},env);
  expect(result.status).toBe(409);expect(await result.json()).toMatchObject({ok:false,retryable:false,code:'REQUEST_CHANGED'});expect(fetch).toHaveBeenCalledOnce();
 });
 it('réessaie un rejet certain avec le même reçu',async()=>{
  const {env,db}=database(),input=payload();vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(new Response('{}',{status:429})).mockResolvedValueOnce(new Response('{}')));
  expect(await(await request(input,env)).json()).toMatchObject({ok:false,retryable:true,notificationState:'failed'});
  expect(await(await request(input,env)).json()).toMatchObject({ok:true,notificationSent:true});
  expect(db.prepare('SELECT count(*) AS n FROM contact_delivery_receipts').get()).toMatchObject({n:1});
  expect(db.prepare('SELECT attempts FROM contact_delivery_receipts').get()).toMatchObject({attempts:2});
 });
 it.each(['timeout','http-500'])('ne renvoie pas automatiquement un résultat incertain : %s',async mode=>{
  const {env}=database(),input=payload();vi.stubGlobal('fetch',mode==='timeout'?vi.fn().mockRejectedValue(new Error('network')):vi.fn().mockResolvedValue(new Response('{}',{status:500})));
  for(let attempt=0;attempt<2;attempt++)expect(await(await request(input,env)).json()).toMatchObject({ok:false,retryable:false,notificationSent:false,notificationState:'unknown'});
  expect(fetch).toHaveBeenCalledOnce();
 });
 it('ne confirme rien et ne transmet rien sans le stockage des reçus',async()=>{
  vi.stubGlobal('fetch',vi.fn());const result=await request(payload(),{});
  expect(result.status).toBe(503);expect(await result.json()).toMatchObject({ok:false});expect(fetch).not.toHaveBeenCalled();
 });
 it('n’accepte ni identifiant malformé ni honeypot rempli',async()=>{
  const {env}=database();vi.stubGlobal('fetch',vi.fn());
  expect((await request(payload({requestId:'invalid'}),env)).status).toBe(400);
  expect((await request(payload({site_web:'robot'}),env)).status).toBe(400);expect(fetch).not.toHaveBeenCalled();
 });
 it('applique aussi le verrou lorsque Formspree sert de transport',async()=>{
  const {env}=database(),input=payload();vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{}')));
  await request(input,{...env,RESEND_API_KEY:undefined});await request(input,{...env,RESEND_API_KEY:undefined});
  expect(fetch).toHaveBeenCalledOnce();expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(/^https:\/\/formspree\.io\//);
 });
 it('résout le titre public côté serveur et joint uniquement la synthèse choisie',async()=>{
  const {env}=database();vi.stubGlobal('fetch',vi.fn().mockImplementation(async()=>new Response('{}')));
  const articleContext={id:'marge-negociation-erreur-25000',slug:'fake-slug',title:'Un titre falsifié'};
  const synthesis='Synthèse déclarée, à vérifier.';
  const input=payload({articleContext,synthesis,attachSynthesis:true});
  expect((await request(input,env)).status).toBe(200);
  const text=JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)).text;
  expect(text).toContain('Faut-il ajouter une marge de négociation');expect(text).not.toContain('Un titre falsifié');expect(text).not.toContain('fake-slug');expect(text).toContain(synthesis);
  await request(payload({synthesis:'NE PAS TRANSMETTRE',attachSynthesis:false}),env);
  expect(JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body)).text).not.toContain('NE PAS TRANSMETTRE');
 });
 it('refuse un article inconnu et une pièce de contexte trop longue',async()=>{
  const {env}=database();vi.stubGlobal('fetch',vi.fn());
  expect((await request(payload({articleContext:{id:'unknown-article'}}),env)).status).toBe(400);
  expect((await request(payload({attachSynthesis:true,synthesis:'x'.repeat(30_001)}),env)).status).toBe(400);expect(fetch).not.toHaveBeenCalled();
 });
});
