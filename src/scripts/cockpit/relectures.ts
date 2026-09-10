import type { Context, Journey, Project, Question, AnswerValue } from '../../lib/experience/types';
import { createContext, parseContext, setAnswer, textReading } from '../../lib/experience/context';
import { buyerJourney, buyerDependencies } from '../../lib/experience/buyer';
import { transitionJourney, transitionDependencies } from '../../lib/experience/transition';
import { sellerJourney, sellerInactiveAnswerIds } from '../../lib/experience/seller';
import { node, formatDate, setSubmitState } from './ui';
import type { RequestRow } from '../../../functions/api/experience/actions';

interface Note { id:string; text:string; reason:string; evidence:string; created_at:string; context_json:string|null }
interface Access { id:string; created_at:string; expires_at:string; revoked_at:string|null; attempts:number; challenge_count:number }
interface Detail { request:RequestRow; notes:Note[]; accesses:Access[]; csrfToken:string }
interface Envelope { ok:boolean; message?:string; csrfToken?:string; items?:RequestRow[]; request?:RequestRow; notes?:Note[]; accesses?:Access[]; url?:string }
const $=<T extends Element>(selector:string):T=>document.querySelector<T>(selector)!;
const listRoot=$<HTMLElement>('[data-request-list]'), detailRoot=$<HTMLElement>('[data-detail]'), editorRoot=$<HTMLElement>('[data-editor]');
const feedback=$<HTMLElement>('[data-feedback]');
const journeys:Partial<Record<Project,Journey>>={buyer:buyerJourney,seller:sellerJourney,transition:transitionJourney};
let csrf='',selected:Detail|null=null,editorContext:Context|null=null,mode:'new'|'revise'='new',draftId=crypto.randomUUID(),noteId=crypto.randomUUID();
let editorFingerprint='',lastBodyFingerprint='';
function message(text:string,error=false){feedback.hidden=false;feedback.textContent=text;feedback.dataset.error=String(error);feedback.setAttribute('role',error?'alert':'status');}
async function api(body?:Record<string,unknown>,id?:string):Promise<Envelope>{
  if(body&&(!csrf||Number(csrf.split('.')[0])<Date.now()/1000+30)){const session=await api();csrf=session.csrfToken||'';}
  let response:Response;
  try{response=await fetch('/api/experience/operator'+(id?'?id='+encodeURIComponent(id):''),{
    method:body?'POST':'GET',headers:{accept:'application/json',...(body?{'content-type':'application/json','X-LEVOIS-CSRF':csrf}:{})},
    body:body?JSON.stringify(body):undefined,credentials:'same-origin',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000),
  });}catch{throw new Error('La demande n’est pas confirmée. Le contenu saisi reste sur cet écran ; vérifiez la connexion puis réessayez.');}
  if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('La session privée n’est pas disponible. Vérifiez votre accès puis actualisez.');
  const result=await response.json() as Envelope;if(!response.ok||!result.ok)throw new Error(result.message||'L’action n’est pas confirmée.');
  if(result.csrfToken)csrf=result.csrfToken;return result;
}
function intent(action:string){return action==='review'?'Relecture écrite ciblée':'Échange choisi';}
function delivery(state:string){return ({pending:'Notification en attente',sending:'Envoi en cours ou à vérifier',sent:'Notification acceptée par le prestataire',failed:'Notification refusée',unknown:'Envoi non confirmé',unavailable:'Notification indisponible','not-requested':'Aucune notification demandée'} as Record<string,string>)[state]||state;}
function statusLabel(status:string){return ({open:'À traiter',answered:'Réponse effectuée',closed:'Traitement terminé'} as Record<string,string>)[status]||status;}
function fact(parent:HTMLElement,title:string,value:string){const div=node('div');div.append(node('dt',{text:title}),node('dd',{text:value}));parent.append(div);}
async function loadList(){
  listRoot.setAttribute('aria-busy','true');
  try{
    const result=await api();listRoot.replaceChildren();
    if(!result.items?.length)listRoot.append(node('p',{text:'Aucune demande enregistrée. Vous pouvez créer un contexte après un échange déjà établi.'}));
    for(const item of result.items||[]){
      const button=node('button',{className:'cr-request',attrs:{type:'button','aria-current':String(selected?.request.id===item.id)}});
      button.append(node('span',{text:intent(item.action)}),node('strong',{text:item.first_name||'Prénom non indiqué'}),node('span',{text:formatDate(item.created_at,true)+' · '+statusLabel(item.status)}),node('span',{text:item.question||'Relire les points ouverts'}),node('span',{text:delivery(item.notification_state)}));
      button.addEventListener('click',()=>void loadDetail(item.id));listRoot.append(button);
    }
  }catch(error){listRoot.replaceChildren(node('p',{text:error instanceof Error?error.message:'La file est indisponible.',attrs:{role:'alert'}}));}
  finally{listRoot.setAttribute('aria-busy','false');}
}
async function loadDetail(id:string){
  try{
    const result=await api(undefined,id);if(!result.request)throw new Error('Le dossier n’est pas disponible.');
    selected={request:result.request,notes:result.notes||[],accesses:result.accesses||[],csrfToken:result.csrfToken||csrf};
    editorRoot.hidden=true;detailRoot.hidden=false;$<HTMLElement>('[data-created-access]').hidden=true;
    const row=selected.request,context=parseContext(JSON.parse(row.context_json));
    $('[data-request-intent]').textContent=intent(row.action);$('[data-request-meta]').textContent='Reçue le '+formatDate(row.created_at,true)+' · Référence '+row.id;
    $('[data-request-question]').textContent=row.question||'Les points ouverts de la synthèse.';
    $('[data-synthesis]').textContent=row.synthesis;$('#cr-detail-title').textContent=row.first_name||'Demande sans prénom';
    const facts=$<HTMLElement>('[data-request-facts]');facts.replaceChildren();fact(facts,'Canal autorisé',row.channel==='phone'?'Téléphone demandé':'Réponse par e-mail');fact(facts,'Coordonnée utile',row.contact_email||row.contact_phone||'Non indiquée');fact(facts,'Notification',delivery(row.notification_state));fact(facts,'Traitement',statusLabel(row.status));
    if(context)fact(facts,'Version de contexte',String(context.revision)+' · '+formatDate(context.updatedAt,true));
    const answers=$<HTMLElement>('[data-answer-facts]');answers.replaceChildren();
    if(context){const labels=new Map((journeys[context.project]?.getQuestions(context)||[]).map(q=>[q.id,q]));for(const [id,a]of Object.entries(context.answers)){
      const question=labels.get(id),label=(v:unknown)=>question?.choices?.find(c=>c.value===String(v))?.label||String(v??'Non renseigné');
      const value=Array.isArray(a.value)?a.value.map(label).join(' ; '):label(a.value);
      fact(answers,question?.title||id,value+' — '+(a.provenance==='imported'?'Repris, à confirmer':a.provenance==='confirmed'?'Confirmé par la personne':'Déclaré par la personne')+' · '+formatDate(a.updatedAt,true));
    }}else answers.append(node('p',{text:'La lecture exacte reste lisible. Ce contexte ne peut pas être édité dans le format courant.'}));
    const consent=JSON.parse(row.consent_json);$('[data-consent]').textContent=(consent.purpose==='review'?'Relecture écrite ciblée demandée.':'Échange sur le canal choisi.')+' Accord du '+formatDate(consent.acceptedAt,true)+' · texte '+String(consent.textVersion)+'. Aucun appel supplémentaire, alerte opportunité, newsletter ni relance commerciale.'+(consent.evidence?' Trace après échange : '+String(consent.evidence):'');
    const notes=$<HTMLElement>('[data-notes]'),choices=$<HTMLSelectElement>('[data-note-choice]');notes.replaceChildren();choices.replaceChildren();
    if(!selected.notes.length)notes.append(node('p',{text:'Aucune note humaine enregistrée. Ajoutez une relecture avant de créer un lien de reprise.'}));
    for(const note of selected.notes){const article=node('article',{className:'cr-note'});article.append(node('time',{text:'Mouaad Boullourou · '+formatDate(note.created_at,true)}),node('p',{text:note.text}),node('p',{text:'Raison : '+note.reason}),node('p',{text:'Éléments et limites : '+note.evidence}));notes.append(article);choices.append(node('option',{text:formatDate(note.created_at,true)+' — '+note.text.slice(0,90),attrs:{value:note.id}}));}
    const accessForm=$<HTMLFormElement>('[data-access-form]');accessForm.reset();accessForm.querySelectorAll<HTMLInputElement|HTMLButtonElement|HTMLSelectElement>('input,button,select').forEach(el=>el.disabled=!row.contact_email||!selected!.notes.length);
    $('[data-access-recipient]').textContent=row.contact_email?'Le code de vérification ira uniquement à '+row.contact_email+'. Créer le lien ne l’envoie pas.':'Aucune adresse e-mail n’a été autorisée pour ce dossier. Convenez d’une reprise avec la personne avant de créer un contexte après échange.';
    if(choices.options.length)choices.selectedIndex=choices.options.length-1;
    sharePreview();
    const accessList=$<HTMLElement>('[data-access-list]');accessList.replaceChildren();
    if(!selected.accesses.length)accessList.append(node('p',{text:'Aucun accès créé.'}));
    for(const access of selected.accesses){
      const line=node('div',{className:'cr-access-row'}),revoked=!!access.revoked_at,expired=Date.parse(access.expires_at)<=Date.now();
      line.append(node('p',{text:'Créé le '+formatDate(access.created_at,true)+' · '+(revoked?'Révoqué':expired?'Expiré':'Valable jusqu’au '+formatDate(access.expires_at,true))}));
      if(!revoked&&!expired){const button=node('button',{text:'Révoquer cet accès',className:'cockpit-button cockpit-button-secondary',attrs:{type:'button'}});button.addEventListener('click',()=>void runButton(button,async()=>{const result=await api({operation:'revoke-access',requestId:id,accessId:access.id});message(result.message||'Accès révoqué.');await loadDetail(id);}));line.append(button);}accessList.append(line);
    }
    $<HTMLSelectElement>('[data-status-form] select').value=row.status;
    $<HTMLFormElement>('[data-note-form]').reset();$<HTMLFormElement>('[data-delete-form]').reset();noteId=crypto.randomUUID();
    $<HTMLButtonElement>('[data-edit-context]').disabled=!context||!journeys[context.project];
    $<HTMLElement>('[data-retry-notification]').hidden=!['failed','unavailable'].includes(row.notification_state);
    await loadList();$<HTMLElement>('#cr-detail-title').focus();
  }catch(error){message(error instanceof Error?error.message:'Lecture du dossier impossible.',true);}
}
async function runButton(button:HTMLButtonElement,work:()=>Promise<void>){setSubmitState(button,true);try{await work();}catch(error){message(error instanceof Error?error.message:'L’action n’est pas confirmée.',true);}finally{setSubmitState(button,false);}}
function bindForm(selector:string,work:(form:HTMLFormElement)=>Promise<void>){const form=$<HTMLFormElement>(selector);form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;void runButton(form.querySelector<HTMLButtonElement>('button[type="submit"]')!,()=>work(form));});}
function fields(form:HTMLFormElement){return Object.fromEntries(new FormData(form).entries()) as Record<string,string>;}
function sharePreview(){
  if(!selected)return;const note=selected.notes.find(item=>item.id===$<HTMLSelectElement>('[data-note-choice]').value);
  let synthesis=selected.request.synthesis;
  if(note?.context_json){const context=parseContext(JSON.parse(note.context_json));if(context?.reading)synthesis=textReading(context.reading);}
  $('[data-share-preview]').textContent=synthesis+(note?'\n\nNote de Mouaad Boullourou · '+formatDate(note.created_at,true)+'\n'+note.text+'\nRaison : '+note.reason+'\nÉléments et limites : '+note.evidence:'');
}
$('[data-note-choice]').addEventListener('change',()=>{$<HTMLInputElement>('[data-access-form] [name="authorized"]').checked=false;sharePreview();});
function currentJourney(){return editorContext?journeys[editorContext.project]:undefined;}
function preview(){const journey=currentJourney();if(!editorContext||!journey)return;editorContext.reading=journey.buildReading(editorContext);$('[data-context-preview]').textContent=textReading(editorContext.reading);}
function renderQuestions(){
  const journey=currentJourney();if(!journey||!editorContext)return;
  const target=$<HTMLElement>('[data-context-questions]'),open=new Set(Array.from(target.querySelectorAll<HTMLDetailsElement>('details[open]')).map(el=>el.dataset.sequence)),groups=new Map<number,HTMLElement>();
  const first=target.childElementCount===0;target.replaceChildren();
  for(const question of journey.getQuestions(editorContext)){
    let group=groups.get(question.sequence);if(!group){const details=node('details',{className:'cr-group',attrs:{'data-sequence':String(question.sequence)}});details.open=open.has(String(question.sequence))||(first&&groups.size===0);details.append(node('summary',{text:question.sequenceTitle}));group=node('div',{className:'cockpit-fields'});details.append(group);target.append(details);groups.set(question.sequence,group);}
    const answer=editorContext.answers[question.id]?.value;
    if(question.type==='multiple'){
      const field=node('fieldset',{className:'cr-multiple'});field.append(node('legend',{text:question.title}));
      for(const option of question.choices||[]){const label=node('label'),input=node('input',{attrs:{type:'checkbox',name:'answer-'+question.id,value:option.value,'data-answer':question.id}});input.checked=Array.isArray(answer)&&answer.includes(option.value);label.append(input,node('span',{text:option.label}));field.append(label);}
      if(question.help)field.append(node('small',{text:question.help}));group.append(field);
    }else{
      const label=node('label');label.append(node('span',{text:question.title}));let input:HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement;
      if(question.type==='choice'){input=node('select');input.append(node('option',{text:'Non renseigné — ne pas supposer',attrs:{value:''}}));for(const option of question.choices||[])input.append(node('option',{text:option.label,attrs:{value:option.value}}));}
      else if(question.type==='text'){input=node('textarea',{attrs:{rows:'2',maxlength:String(question.maxLength||4000)}});}
      else{input=node('input',{attrs:{type:question.type==='date'?'date':'number'}});if(question.min!==undefined)input.min=String(question.min);if(question.max!==undefined)input.max=String(question.max);}
      input.name='answer-'+question.id;input.dataset.answer=question.id;input.value=Array.isArray(answer)?'':String(answer??'');if(question.placeholder&&!(input instanceof HTMLSelectElement))input.placeholder=question.placeholder;
      label.append(input);if(question.help)label.append(node('small',{text:question.help}));group.append(label);
    }
  }
  preview();
}
$('[data-context-questions]').addEventListener('change',event=>{
  const input=event.target as HTMLInputElement, id=input.dataset.answer;if(!id||!editorContext)return;
  const question=currentJourney()?.getQuestions(editorContext).find(q=>q.id===id);if(!question)return;
  let value:AnswerValue;
  if(question.type==='multiple'){value=Array.from(document.querySelectorAll<HTMLInputElement>('[data-answer="'+id+'"]:checked')).map(el=>el.value);if(question.maxChoices&&value.length>question.maxChoices){input.checked=false;message('Choisir au maximum '+question.maxChoices+' éléments pour ce point.',true);return;}}
  else value=input.value===''?null:question.type==='number'?Number(input.value):input.value;
  const previous=editorContext.answers[id];editorContext=setAnswer(editorContext,id,value,editorContext.project==='buyer'?buyerDependencies:editorContext.project==='transition'?transitionDependencies:{});
  if(previous!==editorContext.answers[id])editorContext.answers[id]={...editorContext.answers[id],provenance:'imported'};
  if(editorContext.project==='seller')for(const inactive of sellerInactiveAnswerIds(editorContext))delete editorContext.answers[inactive];
  editorContext.history=editorContext.history?.slice(-1);
  $<HTMLInputElement>('[data-context-form] [name="approved"]').checked=false;renderQuestions();
  document.querySelector<HTMLElement>('[data-answer="'+id+'"]')?.focus();
});
function openEditor(revise=false){
  mode=revise?'revise':'new';const form=$<HTMLFormElement>('[data-context-form]');form.reset();draftId=crypto.randomUUID();noteId=crypto.randomUUID();editorFingerprint='';lastBodyFingerprint='';
  const latest=revise&&selected?selected.notes.findLast(note=>note.context_json)?.context_json:null;
  editorContext=revise&&selected?parseContext(JSON.parse(latest||selected.request.context_json)):createContext('buyer',{door:'known',source:null,promise:null});
  if(!editorContext)return;editorContext.depth='deep';editorContext.history=editorContext.reading?[editorContext.reading]:[];
  $<HTMLElement>('[data-new-fields]').hidden=revise;$<HTMLElement>('[data-revision-fields]').hidden=!revise;
  for(const name of ['email','agreedAt','permissionEvidence','authorized'])form.querySelector<HTMLInputElement>('[name="'+name+'"]')!.required=!revise;
  for(const name of ['revisionText','revisionReason','revisionEvidence'])form.querySelector<HTMLTextAreaElement>('[name="'+name+'"]')!.required=revise;
  $('#cr-editor-title').textContent=revise?'Corriger sans effacer la version reçue':'Reprendre le contexte convenu';
  $('[data-context-submit]').textContent=revise?'Conserver cette révision et sa note':'Enregistrer le contexte, sans envoyer';
  editorRoot.hidden=false;detailRoot.hidden=true;$('[data-context-questions]').replaceChildren();renderQuestions();$<HTMLElement>('#cr-editor-title').focus();
}
$<HTMLSelectElement>('[data-context-form] [name="project"]').addEventListener('change',event=>{editorContext=createContext((event.target as HTMLSelectElement).value as Project,{door:'known',source:null,promise:null});editorContext.depth='deep';$('[data-context-questions]').replaceChildren();renderQuestions();});
$('[data-context-form]').addEventListener('input',event=>{
  const name=(event.target as HTMLInputElement).name;
  if(!['approved','authorized'].includes(name))$<HTMLInputElement>('[data-context-form] [name="approved"]').checked=false;
  if(name==='email')$<HTMLInputElement>('[data-context-form] [name="authorized"]').checked=false;
});
$('[data-new-context]').addEventListener('click',()=>openEditor());
$('[data-edit-context]').addEventListener('click',()=>openEditor(true));
$('[data-cancel-editor]').addEventListener('click',()=>{editorRoot.hidden=true;detailRoot.hidden=!selected;editorContext=null;});
$('[data-refresh]').addEventListener('click',()=>void loadList());
bindForm('[data-context-form]',async form=>{
  if(!editorContext||!editorContext.reading)return;const data=fields(form);
  const snapshot={...editorContext,history:editorContext.history?.slice(-1)},synthesis=textReading(editorContext.reading);
  const fingerprint=JSON.stringify({snapshot,synthesis,data});if(editorFingerprint&&fingerprint!==editorFingerprint){draftId=crypto.randomUUID();noteId=crypto.randomUUID();}editorFingerprint=fingerprint;
  if(mode==='new'){
    const result=await api({operation:'create-context',requestId:draftId,context:snapshot,synthesis,email:data.email,firstName:data.firstName,permissionEvidence:data.permissionEvidence,agreedAt:new Date(data.agreedAt).toISOString(),authorized:data.authorized==='on'});
    message(result.message||'Le contexte est enregistré. Ajoutez la note humaine à partager.');await loadDetail(draftId);
  }else if(selected){
    const requestId=selected.request.id;
    const result=await api({operation:'annotate',requestId,noteId,context:snapshot,text:data.revisionText,reason:data.revisionReason,evidence:data.revisionEvidence});
    message(result.message||'La révision est conservée séparément.');await loadDetail(requestId);
  }
});
bindForm('[data-note-form]',async form=>{
  if(!selected)return;const data=fields(form),requestId=selected.request.id,fingerprint=JSON.stringify(data);
  if(lastBodyFingerprint&&fingerprint!==lastBodyFingerprint)noteId=crypto.randomUUID();lastBodyFingerprint=fingerprint;
  const result=await api({operation:'annotate',requestId,noteId,text:data.text,reason:data.reason,evidence:data.evidence});message(result.message||'Note enregistrée.');await loadDetail(requestId);
});
bindForm('[data-access-form]',async form=>{
  if(!selected)return;const data=fields(form),note=selected.notes.find(n=>n.id===data.noteId);let synthesis=selected.request.synthesis;
  if(note?.context_json){const context=parseContext(JSON.parse(note.context_json));if(!context?.reading)throw new Error('La note révisée ne contient pas de lecture complète à partager.');synthesis=textReading(context.reading);}
  const result=await api({operation:'create-access',requestId:selected.request.id,noteId:data.noteId,authorized:data.authorized==='on',expiresAt:new Date(data.expiresAt).toISOString(),synthesis});
  await loadDetail(selected.request.id);$<HTMLInputElement>('[data-access-url]').value=result.url||'';$<HTMLElement>('[data-created-access]').hidden=false;message(result.message||'Lien créé. Aucun message envoyé.');
});
$('[data-copy-access]').addEventListener('click',async()=>{const input=$<HTMLInputElement>('[data-access-url]');try{await navigator.clipboard.writeText(input.value);message('Lien copié. Transmettez-le uniquement selon l’accord établi.');}catch{input.select();message('Sélection du lien effectuée. Utilisez la commande Copier de votre navigateur.');}});
bindForm('[data-status-form]',async form=>{if(!selected)return;const id=selected.request.id,result=await api({operation:'set-status',requestId:id,status:fields(form).status});message(result.message||'Statut enregistré.');await loadDetail(id);});
bindForm('[data-delete-form]',async()=>{if(!selected)return;const result=await api({operation:'delete',requestId:selected.request.id,confirm:'delete-operational-request'});selected=null;detailRoot.hidden=true;message(result.message||'Dossier supprimé.');await loadList();});
$('[data-retry-notification]').addEventListener('click',()=>void runButton($<HTMLButtonElement>('[data-retry-notification]'),async()=>{if(!selected)return;const id=selected.request.id;await api({operation:'retry-notification',requestId:id});message('L’état de notification a été actualisé.');await loadDetail(id);}));
void loadList();
