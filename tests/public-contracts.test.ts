import {afterEach,describe,expect,it,vi} from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {onRequest as recherche} from '../functions/api/recherche';
import {onRequest as lead} from '../functions/api/lead';
import {readAnalyticsChoice,writeAnalyticsChoice} from '../src/lib/analytics-consent';
import {requestJson} from '../src/lib/request-json';
let ip=0;const databases:DatabaseSync[]=[];
function database(){const db=new DatabaseSync(':memory:');db.exec(readFileSync('db/schema.sql','utf8'));databases.push(db);return {db,binding:{prepare(sql:string){let values:any[]=[];return {bind(...v:any[]){values=v;return this},async run(){db.prepare(sql).run(...values);return {success:true,results:[],meta:{}}}}}}}}
const valid={prenom:'Camille',contact:'camille@example.test',consent:true,consents:{lecture:true,matching:false,contact:false},situation:'premier',type:'Maison',budget:250000,surface:90,preserves:['cadre'],lecture:{n:24,median:2300},project:{ventePrealable:'possible'}};
function context(body:any,env:any={},origin='https://levois.fr'){const pending:Promise<unknown>[]=[];return {request:new Request('https://levois.fr/api/recherche',{method:'POST',headers:{'content-type':'application/json','origin':origin,'cf-connecting-ip':`198.51.100.${++ip}`},body:JSON.stringify(body)}),env,waitUntil(p:Promise<unknown>){pending.push(p)},pending};}
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();for(const db of databases.splice(0))db.close()});
describe('Contrats publics : stockage réel SQLite, transports isolés',()=>{
 it.each([true,false])('distingue stockage et notification avec Resend configuré=%s',async configured=>{
  const {db,binding}=database();vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{}',{status:503})));
  const ctx=context(valid,{RECHERCHE_DB:binding,...(configured?{RESEND_API_KEY:'test-only'}:{})});const r=await recherche(ctx as any);
  expect(r.status).toBe(200);expect(await r.json()).toMatchObject({ok:true,saved:true,notificationSent:false});
  const row=db.prepare('SELECT * FROM lectures_recherche').get() as any;expect(row.email_envoye).toBe(0);expect(row.contact).toBe(valid.contact);expect(JSON.parse(row.lecture_json).consentements).toEqual(valid.consents);
 });
 it('enregistre la recherche avant toute notification et marque le succès',async()=>{
  const {db,binding}=database();const transport=vi.fn().mockImplementation(async(_url,init)=>{expect((db.prepare('SELECT count(*) AS n FROM lectures_recherche').get() as any).n).toBe(1);expect(String(init.body)).toContain('camille');return new Response('{}')});vi.stubGlobal('fetch',transport);
  const ctx=context(valid,{RECHERCHE_DB:binding});const r=await recherche(ctx as any);await Promise.all(ctx.pending);expect(await r.json()).toMatchObject({saved:true,notificationSent:true});expect((db.prepare('SELECT email_envoye FROM lectures_recherche').get() as any).email_envoye).toBe(1);
 });
 it('utilise le secours après le refus du prestataire principal',async()=>{
  const {binding}=database();const transport=vi.fn().mockResolvedValueOnce(new Response('{}',{status:502})).mockResolvedValueOnce(new Response('{}'));vi.stubGlobal('fetch',transport);
  const ctx=context(valid,{RECHERCHE_DB:binding,RESEND_API_KEY:'test-only'});const r=await recherche(ctx as any);await Promise.all(ctx.pending);expect((await r.json() as any).notificationSent).toBe(true);expect(transport).toHaveBeenCalledTimes(2);
 });
 it.each([{contact:'incorrect'},{consent:false},{consents:{lecture:false,matching:false,contact:false}},{prenom:''}])('rejette les données incomplètes avant insertion : %j',async patch=>{
  const {db,binding}=database();const transport=vi.fn();vi.stubGlobal('fetch',transport);const r=await recherche(context({...valid,...patch},{RECHERCHE_DB:binding}) as any);expect(r.status).toBe(400);expect((db.prepare('SELECT count(*) AS n FROM lectures_recherche').get() as any).n).toBe(0);expect(transport).not.toHaveBeenCalled();
 });
 it('refuse une origine étrangère avant tout stockage',async()=>{const {binding}=database();const r=await recherche(context(valid,{RECHERCHE_DB:binding},'https://autre.example') as any);expect(r.status).toBe(403)});
 it('ne confirme jamais une recherche sans base ou avec insertion échouée',async()=>{
  const transport=vi.fn();vi.stubGlobal('fetch',transport);expect((await recherche(context(valid) as any)).status).toBe(503);
  const {db,binding}=database();db.exec('DROP TABLE lectures_recherche');expect((await recherche(context(valid,{RECHERCHE_DB:binding}) as any)).status).toBe(500);expect(transport).not.toHaveBeenCalled();
 });
 it.each(['contact','parcours','votre-rue','audit-annonce'])('exige un accord explicite côté serveur pour %s',async type=>{
  const transport=vi.fn();vi.stubGlobal('fetch',transport);const ctx=context({type,prenom:'Camille',nom:'Martin',email:'camille@example.test',commune:'Lèves',objet:'Bonjour',message:'Mon projet'});const r=await lead(ctx as any);expect(r.status).toBe(400);expect(await r.json()).toMatchObject({message:'Champs à vérifier : consentement.'});expect(transport).not.toHaveBeenCalled();
 });
 it('refuse un message vide même avec un consentement',async()=>{const r=await lead(context({type:'contact',prenom:'Camille',nom:'Martin',email:'camille@example.test',consentement:true}) as any);expect(r.status).toBe(400);expect((await r.json() as any).message).toContain('message')});
});
describe('Consentement et erreurs réseau',()=>{
 it('n’accepte jamais une préférence absente, corrompue ou expirée',()=>{
  expect(readAnalyticsChoice(null)).toBeNull();expect(readAnalyticsChoice('{')).toBeNull();expect(readAnalyticsChoice(writeAnalyticsChoice('accepted'))).toBe('accepted');expect(readAnalyticsChoice(writeAnalyticsChoice('refused'))).toBe('refused');
  expect(readAnalyticsChoice(writeAnalyticsChoice('accepted',Date.now()-181*86400000))).toBeNull();
 });
 it('refuse le faux succès HTTP avec un contenu non JSON',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('<html>erreur</html>')));await expect(requestJson('/api/lead')).rejects.toThrow('inattendue')});
 it('interrompt les demandes sans réponse avec une erreur compréhensible',async()=>{vi.stubGlobal('fetch',(_u:any,init:any)=>new Promise((_r,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('Abort','AbortError')))));await expect(requestJson('/api/lead',{},5)).rejects.toThrow('trop de temps')});
});
