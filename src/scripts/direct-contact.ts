import {requestJson} from '../lib/request-json';
import {getArticleContext} from '../lib/editorial/acquisition';
import {CONTEXT_KEY,parseContext,textReading} from '../lib/experience/context';
import {resolveDiagnosticReading} from '../lib/experience/diagnostic-reading-state';
import {answersText} from '../lib/experience/labels';

interface ContactResponse {
  ok?: boolean; requestId?: string; notificationSent?: boolean; notificationState?: string;
  retryable?: boolean; message?: string;
}
const form=document.querySelector<HTMLFormElement>('[data-direct-contact]');
if(form){
 const status=form.querySelector<HTMLElement>('[data-contact-status]')!;
 const button=form.querySelector<HTMLButtonElement>('[type=submit]')!;
 const motif=new URLSearchParams(location.search).get('motif');
 const subject=form.elements.namedItem('objet') as HTMLInputElement;
 if(motif==='equipe')subject.value='Découvrir le métier de conseiller immobilier';
 else if(motif==='recommandation')subject.value='Une question sur la recommandation';
 const articleContext=getArticleContext();
 if(articleContext){
  const notice=form.querySelector<HTMLElement>('[data-article-context]')!;notice.hidden=false;notice.textContent='À propos de l’article : '+articleContext.title;
  if(!subject.value)subject.value='À propos de : '+articleContext.title;
 }
 let synthesis='';
 try{
  const stored=parseContext(JSON.parse(sessionStorage.getItem(CONTEXT_KEY)||'null'));
  if(stored){
   const readingState=resolveDiagnosticReading(stored);
   if(readingState.kind==='ready'){
    synthesis=textReading(readingState.context.reading!,readingState.context)+'\n\nRéponses déclarées\n'+answersText(readingState.context);
    form.querySelector<HTMLElement>('[data-synthesis-attachment]')!.hidden=false;
    form.querySelector<HTMLElement>('[data-synthesis-preview]')!.textContent=synthesis;
   }
  }
 }catch{/* A blocked browser store never blocks direct contact. */}
 let pending=false,confirmed=false,blocked=false,fingerprint='';
 let frozen:Record<string,unknown>|null=null;
 const fields=[...form.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input,textarea')];
 form.addEventListener('input',()=>{
  if(pending)return;
  // A changed message is a new intentional submission. Retrying unchanged values
  // keeps the exact payload and UUID, including after an interrupted confirmation.
  if(confirmed||blocked){confirmed=false;blocked=false;button.disabled=false;button.textContent='Envoyer mon message';status.hidden=true;}
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(pending||confirmed||blocked||!form.reportValidity())return;
  const data=new FormData(form);
  const payload={type:'contact',prenom:String(data.get('prenom')||'').trim(),nom:String(data.get('nom')||'').trim(),
   email:String(data.get('email')||'').trim(),objet:String(data.get('objet')||'').trim(),message:String(data.get('message')||'').trim(),
   consentement:data.get('consentement')==='on',site_web:String(data.get('site_web')||''),articleContext,
   attachSynthesis:!!synthesis&&data.get('attachSynthesis')==='on',
   synthesis:synthesis&&data.get('attachSynthesis')==='on'?synthesis:''};
  const current=JSON.stringify(payload);
  if(!frozen||fingerprint!==current){fingerprint=current;frozen={...payload,requestId:crypto.randomUUID()};}
  pending=true;button.disabled=true;form.setAttribute('aria-busy','true');
  fields.forEach(field=>{if(field.type==='checkbox')field.disabled=true;else field.readOnly=true;});
  status.hidden=false;status.className='lv-note';status.textContent='Envoi en cours…';
  try{
   const {response,data:result}=await requestJson<ContactResponse>('/api/lead',{method:'POST',redirect:'error',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify(frozen)});
   if(response.ok&&result.ok===true&&result.notificationSent===true&&result.notificationState==='sent'&&result.requestId===frozen.requestId){
    confirmed=true;status.className='lv-limit';status.textContent='Votre message a été accepté par le service de transmission. Cela ne confirme pas encore sa lecture par Mouaad.';button.textContent='Message transmis';
    window.dispatchEvent(new CustomEvent('levois:journey',{detail:{event:'contact_message_accepted'}}));
   }else{
    blocked=result.retryable===false&&result.requestId===frozen.requestId;
    status.className='lv-error';status.textContent=result.message||'La transmission n’est pas confirmée. Votre message reste affiché : vous pouvez réessayer.';
    if(blocked){status.textContent+=' Référence : '+frozen.requestId;button.textContent='Transmission à vérifier';}
   }
  }catch{
   status.className='lv-error';status.textContent='La connexion a interrompu la confirmation. Votre message reste affiché. Réessayez : la même référence sera utilisée pour éviter un doublon.';
  }finally{
   pending=false;form.removeAttribute('aria-busy');fields.forEach(field=>{field.disabled=false;field.readOnly=false;});
   button.disabled=confirmed||blocked;
  }
 });
 // Enable only after the controller owns submission. Native fallback is POST,
 // never the browser's default GET that would expose contact details in a URL.
 button.disabled=false;
}
