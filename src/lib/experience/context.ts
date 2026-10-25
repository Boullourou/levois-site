import {readingDetailsText} from './reading-details';
import type { AnswerValue, Context, Entry, Project, Reading } from './types';

export const CONTEXT_KEY = 'levois:experience:v1';
export const METHOD_VERSION = 'plan-vivant-2026-09-10';
const projects = new Set(['buyer','seller','transition','local','audit']);
const doors = new Set(['direct','video','google','qr','recommendation','known','unknown']);
const sources:Record<string,Entry['door']>={video:'video',youtube:'video',instagram:'video',tiktok:'video',facebook:'video',google:'google',qr:'qr',recommandation:'recommendation',recommendation:'recommendation',connu:'known'};
export function entryFromUrl(url:URL):Entry {
 const source=(url.searchParams.get('src')||url.searchParams.get('utm_source')||'').toLowerCase();
 const known=source!=='connu'&&Object.hasOwn(sources,source);
 const promise=url.pathname.startsWith('/experiences/')?url.pathname.split('/')[2]?.replace(/[^a-z0-9-]/g,'').slice(0,80)||null:null;
 return {door:known?sources[source]:url.pathname==='/bienvenue'?'recommendation':'unknown',source:known?source:null,promise};
}
export function createContext(project:Project,entry:Entry={door:'unknown',source:null,promise:null}):Context {
 const now=new Date().toISOString();
 return {schemaVersion:1,id:crypto.randomUUID(),revision:0,project,entry,initialEntry:{...entry},answers:{},createdAt:now,updatedAt:now,depth:'intermediate',history:[]};
}
export function parseReading(x:any):Reading|null {
 if(x?.deliveryMode!==undefined&&x.deliveryMode!=='email-arbitrage-v1')return null;
 if(!x||typeof x!=='object'||typeof x.id!=='string'||typeof x.title!=='string'||!Number.isInteger(x.revision)||!Array.isArray(x.sections)||x.sections.length>15||!Array.isArray(x.limits)||!x.limits.every((s:unknown)=>typeof s==='string')||typeof x.nextDecision?.text!=='string'||typeof x.nextDecision?.why!=='string'||typeof x.methodVersion!=='string'||typeof x.generatedAt!=='string'||!Number.isFinite(Date.parse(x.generatedAt)))return null;
 if(JSON.stringify(x).length>80000||!x.sections.every((s:any)=>s&&typeof s.id==='string'&&typeof s.title==='string'&&Array.isArray(s.items)&&s.items.length<=40&&s.items.every((i:any)=>i&&typeof i.text==='string'&&['declared','solid','conditional','unknown','data','hypothesis','verified'].includes(i.kind)&&(!i.sourceAnswerIds||Array.isArray(i.sourceAnswerIds)&&i.sourceAnswerIds.every((id:unknown)=>typeof id==='string'))&&(!i.condition||typeof i.condition==='string'))))return null;
 if(x.options&&(!Array.isArray(x.options)||x.options.length>6||!x.options.every((o:any)=>o&&['id','title','consequence','condition','limit'].every(k=>typeof o[k]==='string'))))return null;
 if(x.answersSnapshot){const checked=parseContext({schemaVersion:1,id:'snapshot-validated',revision:0,project:projects.has(x.projectSnapshot)?x.projectSnapshot:'buyer',answers:x.answersSnapshot,humanNotes:x.humanNotesSnapshot||[]});if(!checked)return null;x={...x,answersSnapshot:checked.answers,humanNotesSnapshot:checked.humanNotes};}
 if(x.projectSnapshot&&!projects.has(x.projectSnapshot))return null;
 if(x.timeline&&(!Array.isArray(x.timeline)||x.timeline.length>10||!x.timeline.every((t:any)=>t&&typeof t.label==='string'&&typeof t.statusLabel==='string'&&(t.date===null||typeof t.date==='string'))))return null;
 if(x.costs&&(!Array.isArray(x.costs.items)||x.costs.items.length>20||typeof x.costs.label!=='string'||!(x.costs.knownOneOffSubtotal===null||typeof x.costs.knownOneOffSubtotal==='number'&&Number.isFinite(x.costs.knownOneOffSubtotal))||!x.costs.items.every((i:any)=>i&&typeof i.label==='string'&&typeof i.condition==='string'&&['total','month'].includes(i.unit)&&(i.amount===null||typeof i.amount==='number'&&Number.isFinite(i.amount)))))return null;
 return x as Reading;
}
/** Local files and remote contexts are untrusted input; never spread arbitrary keys. */
export function parseContext(input:unknown):Context|null {
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const x=input as Record<string,any>;
 try{if(JSON.stringify(x).length>1000000)return null;}catch{return null;}
 if(x.schemaVersion!==1||!projects.has(x.project)||typeof x.id!=='string'||!/^[a-zA-Z0-9-]{8,80}$/.test(x.id)||!Number.isInteger(x.revision)||x.revision<0||!x.answers||typeof x.answers!=='object'||Array.isArray(x.answers)||Object.keys(x.answers).length>250)return null;
 const answers:Context['answers']={};
 for(const [id,raw]of Object.entries(x.answers)){
  if(!/^[a-zA-Z][a-zA-Z0-9_-]{0,100}$/.test(id)||['constructor','prototype','__proto__'].includes(id)||!raw||typeof raw!=='object')return null;
  const a=raw as Record<string,any>,v=a.value;
  if(!(v===null||typeof v==='string'&&v.length<=4000||typeof v==='number'&&Number.isFinite(v)||Array.isArray(v)&&v.length<=30&&v.every(i=>typeof i==='string'&&i.length<=500)))return null;
  if(!['declared','imported','confirmed'].includes(a.provenance)||typeof a.updatedAt!=='string'||!Number.isFinite(Date.parse(a.updatedAt))||!Number.isInteger(a.revision)||a.revision<0)return null;
  answers[id]={value:v,provenance:a.provenance,updatedAt:a.updatedAt,revision:a.revision,author:typeof a.author==='string'?a.author.slice(0,80):'Vous',semanticVersion:typeof a.semanticVersion==='string'?a.semanticVersion.slice(0,80):'public-answers-2026-09-10.1'};
 }
 const now=new Date().toISOString();
 const ctx:Context={schemaVersion:1,id:x.id,revision:x.revision,project:x.project,entry:{door:doors.has(x.entry?.door)?x.entry.door:'unknown',source:Object.hasOwn(sources,x.entry?.source)?x.entry.source:null,promise:typeof x.entry?.promise==='string'&&/^[a-z0-9-]{1,80}$/.test(x.entry.promise)?x.entry.promise:null},answers,createdAt:Number.isFinite(Date.parse(x.createdAt))?x.createdAt:now,updatedAt:Number.isFinite(Date.parse(x.updatedAt))?x.updatedAt:now,depth:['micro','intermediate','deep'].includes(x.depth)?x.depth:'intermediate'};
 ctx.initialEntry=x.initialEntry&&doors.has(x.initialEntry.door)?{door:x.initialEntry.door,source:Object.hasOwn(sources,x.initialEntry.source)?x.initialEntry.source:null,promise:typeof x.initialEntry.promise==='string'&&/^[a-z0-9-]{1,80}$/.test(x.initialEntry.promise)?x.initialEntry.promise:null}:{...ctx.entry};
 const reading=parseReading(x.reading);if(reading)ctx.reading=reading;
 ctx.history=Array.isArray(x.history)?x.history.slice(-20).map(parseReading).filter((r:Reading|null):r is Reading=>!!r):[];
 ctx.humanNotes=Array.isArray(x.humanNotes)?x.humanNotes.slice(-20).filter((n:any)=>n&&typeof n.text==='string'&&n.text.length<=10000&&typeof n.author==='string'&&typeof n.createdAt==='string'&&Number.isFinite(Date.parse(n.createdAt))&&(!n.source||typeof n.source==='string'&&n.source.length<=12003)).map((n:any)=>({id:String(n.id).slice(0,80),text:n.text,author:n.author.slice(0,100),createdAt:n.createdAt,source:typeof n.source==='string'?n.source:undefined})):[];
 return ctx;
}
export function readContext(project:Project,storage?:Pick<Storage,'getItem'>):Context {
 try{const raw=(storage||sessionStorage).getItem(CONTEXT_KEY);if(raw){const c=parseContext(JSON.parse(raw));if(c){if(c.project!==project){if(c.reading)c.history=[...(c.history||[]),{...c.reading,answersSnapshot:{...c.answers},projectSnapshot:c.project,humanNotesSnapshot:[...(c.humanNotes||[])]} as Reading].slice(-20);delete c.reading;c.project=project;}return c;}}}catch{}
 return createContext(project,typeof location!=='undefined'?entryFromUrl(new URL(location.href)):undefined);
}
export function saveContext(c:Context,storage?:Pick<Storage,'setItem'>):boolean{try{(storage||sessionStorage).setItem(CONTEXT_KEY,JSON.stringify(c));return true;}catch{return false;}}
export function setAnswer(c:Context,id:string,answer:AnswerValue,dependencies:Record<string,string[]>={}):Context {
 if(JSON.stringify(c.answers[id]?.value)===JSON.stringify(answer)&&c.answers[id]?.provenance!=='imported')return c;
 const now=new Date().toISOString();
 const next:Context={...c,revision:c.revision+1,updatedAt:now,answers:{...c.answers},history:[...(c.history||[])]};
 if(c.reading&&!next.history?.some(r=>r.id===c.reading?.id))next.history?.push({...c.reading,answersSnapshot:{...c.answers},projectSnapshot:c.project,humanNotesSnapshot:[...(c.humanNotes||[])]} as Reading);
 next.history=next.history?.slice(-20);delete next.reading;
 next.answers[id]={value:answer,provenance:'declared',updatedAt:now,revision:next.revision,author:'Vous',semanticVersion:'public-answers-2026-09-10.1'};
 const queue=[...(dependencies[id]||[])],removed=new Set<string>();
 while(queue.length){const key=queue.shift()!;if(removed.has(key)||key===id)continue;removed.add(key);delete next.answers[key];queue.push(...(dependencies[key]||[]));}
 return next;
}
export function confirmImported(c:Context,ids:string[]):Context {
 const next={...c,answers:{...c.answers},revision:c.revision+1,updatedAt:new Date().toISOString()};
 for(const id of ids)if(next.answers[id])next.answers[id]={...next.answers[id],provenance:'confirmed',revision:next.revision,updatedAt:next.updatedAt};
 delete next.reading;return next;
}
export function contextForReading(context:Context,reading:Reading):Context{return {...context,revision:reading.revision,updatedAt:reading.generatedAt,project:reading.projectSnapshot||context.project,answers:reading.answersSnapshot||context.answers,humanNotes:reading.humanNotesSnapshot||context.humanNotes,reading};}
export function textReading(r:Reading,context?:Context):string {
 return [r.title,'Version '+r.revision+' · '+r.generatedAt+' · Méthode '+r.methodVersion,...r.sections.flatMap(s=>['',s.title,...s.items.flatMap(i=>[(i.kind==='unknown'?'À vérifier':i.kind==='data'?'Donnée':i.kind==='hypothesis'?'Hypothèse':i.kind==='conditional'?'Sous condition':i.kind==='verified'?'Vérifié':'À partir de vos réponses')+' — '+i.text,i.condition?'Condition : '+i.condition:''].filter(Boolean))]),...(r.options||[]).flatMap(o=>['',o.title,'Conséquence : '+o.consequence,'Condition : '+o.condition,'Limite : '+o.limit]),'',readingDetailsText(r),...(r.methodVersion==='diagnostic-2026-10-25'?[]:['','Votre prochaine décision utile',r.nextDecision.text,r.nextDecision.why,r.nextDecision.changesWith||'']),'','Limites',...r.limits,...(context?.humanNotes||[]).flatMap(n=>['','Apport de '+n.author+' · '+n.createdAt,n.text,n.source?'Source ou fondement : '+n.source:''])].join('\n');
}
export function escapeHtml(v:unknown):string{return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
