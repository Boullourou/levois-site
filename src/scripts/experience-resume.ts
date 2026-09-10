import {parseContext,confirmImported,saveContext,CONTEXT_KEY,escapeHtml as e} from '../lib/experience/context';
import {buyerJourney} from '../lib/experience/buyer';
import {sellerJourney} from '../lib/experience/seller';
import {transitionJourney} from '../lib/experience/transition';
import {requestJson} from '../lib/request-json';
import type {Context,AnswerValue} from '../lib/experience/types';
const root=document.querySelector<HTMLElement>('[data-resume-root]');
if(root){
 const params=new URLSearchParams(location.hash.slice(1)),token=params.get('acces');
 if(token)history.replaceState(null,'',location.pathname+location.search);
 const fileSection=root.querySelector<HTMLElement>('[data-resume-file]')!,linkSection=root.querySelector<HTMLElement>('[data-resume-link]')!,comparison=root.querySelector<HTMLElement>('[data-resume-compare]')!;
 let current:Context|null=null;try{current=parseContext(JSON.parse(sessionStorage.getItem(CONTEXT_KEY)||'null'));}catch{}
 const labels=(c:Context)=>Object.fromEntries((c.project==='buyer'?buyerJourney:c.project==='seller'?sellerJourney:c.project==='transition'?transitionJourney:null)?.getQuestions(c).map(q=>[q.id,q])||[]);
 function describe(c:Context,id:string,v:AnswerValue):string{const q=labels(c)[id];const one=(a:string)=>q?.choices?.find(o=>o.value===a)?.label||a;return Array.isArray(v)?v.map(one).join(', '):v===null?'Non renseigné':one(String(v));}
 function present(incoming:Context,mode:'file'|'known'){
  fileSection.hidden=true;linkSection.hidden=true;comparison.hidden=false;
  const differentContext=!!current&&current.id!==incoming.id;
  const conflicts=differentContext?[]:Object.keys(incoming.answers).filter(id=>current?.answers[id]&&JSON.stringify(current.answers[id].value)!==JSON.stringify(incoming.answers[id].value));
  const qLabels=labels(incoming);
  comparison.innerHTML='<h2>Voici le contexte à reprendre.</h2><p class="lv-note" style="margin-top:15px">'+(mode==='known'?'Partagé après échange avec Mouaad.':'Issu de votre fichier conservé.')+' Version '+e(incoming.revision)+' · '+e(incoming.updatedAt)+'</p><div class="lv-reading-item"><p>Ces éléments restent vos déclarations. Confirmer une réponse ne transforme pas son contenu en vérification professionnelle.</p></div>'+
   (incoming.humanNotes?.length?incoming.humanNotes.map(n=>'<article class="lv-reading-item"><span class="lv-evidence">'+e(n.author)+' · '+e(n.createdAt)+'</span><p>'+e(n.text)+'</p>'+(n.source?'<p class="lv-note">'+e(n.source)+'</p>':'')+'</article>').join(''):'')+
   (differentContext?'<p class="lv-limit">Ce fichier ou partage appartient à un autre contexte. Reprendre remplacera la session affichée, sans fusionner les réponses des deux projets. Gardez votre lecture actuelle si vous souhaitez la retrouver.</p>':'')+(conflicts.length?'<h3 style="margin-top:25px">Des réponses diffèrent de votre session.</h3><p style="margin-top:14px">Choisissez la version à garder pour chaque différence. Aucune priorité n’est décidée à votre place.</p><form data-conflicts>'+conflicts.map(id=>'<fieldset class="lv-field" style="margin-top:22px"><legend>'+e(qLabels[id]?.title||id.replaceAll('_',' '))+'</legend><label class="lv-choice"><input type="radio" name="'+e(id)+'" value="incoming" required/><span>Contexte repris : '+e(describe(incoming,id,incoming.answers[id].value))+'</span></label><label class="lv-choice"><input type="radio" name="'+e(id)+'" value="current" required/><span>Ma session actuelle : '+e(describe(current!,id,current!.answers[id].value))+'</span></label></fieldset>').join('')+'</form>':'')+
   '<details class="lv-history" open><summary>Relire les réponses présentes</summary><dl>'+Object.entries(incoming.answers).map(([id,a])=>'<div style="padding:12px 0;border-bottom:1px solid var(--lv-line)"><dt class="lv-note">'+e(qLabels[id]?.title||id.replaceAll('_',' '))+'</dt><dd style="margin:5px 0">'+e(describe(incoming,id,a.value))+'</dd></div>').join('')+'</dl></details><p class="lv-error" data-resume-error role="alert" hidden></p><div class="lv-actions"><button type="button" class="lv-button" data-resume-confirm>Confirmer ce point de départ et reprendre</button><a class="lv-secondary" href="/lecture">Garder ma session actuelle</a></div><p class="lv-note" style="margin-top:18px">Chaque réponse pourra encore être corrigée dans le parcours. Les apports de Mouaad restent attribués séparément.</p>';
  comparison.querySelector('[data-resume-confirm]')?.addEventListener('click',()=>{
   const form=comparison.querySelector<HTMLFormElement>('[data-conflicts]');if(form&&!form.reportValidity())return;
   let merged={...incoming,answers:{...incoming.answers}};
   if(form)for(const id of conflicts)if(new FormData(form).get(id)==='current')merged.answers[id]=current!.answers[id];
   const archived=incoming.reading?{...incoming.reading,answersSnapshot:{...incoming.answers},projectSnapshot:incoming.project,humanNotesSnapshot:[...(incoming.humanNotes||[])]}:null;
   merged=confirmImported(merged,Object.keys(merged.answers));merged.entry={door:mode==='known'?'known':incoming.entry.door,source:mode==='known'?'connu':incoming.entry.source,promise:incoming.entry.promise};
   if(archived&&['audit','local'].includes(merged.project))merged.reading=archived;
   if(archived)merged.history=[...(merged.history||[]),archived];
   if(!saveContext(merged)){const error=comparison.querySelector<HTMLElement>('[data-resume-error]')!;error.hidden=false;error.textContent='Le navigateur bloque le stockage de session. Le contexte reste affiché ici. Autorisez le stockage pour reprendre, ou conservez votre fichier pour le relire.';return;}
   location.assign(merged.reading&&['audit','local'].includes(merged.project)?'/lecture':merged.project==='buyer'?'/ma-recherche':merged.project==='seller'?'/situer-ma-vente':merged.project==='transition'?'/vendre-et-acheter':merged.project==='local'?'/votre-rue':'/audit-annonce');
  });
  comparison.querySelector<HTMLElement>('h2')?.setAttribute('tabindex','-1');comparison.querySelector<HTMLElement>('h2')?.focus();
 }
 root.querySelector<HTMLInputElement>('#resume-file')?.addEventListener('change',async ev=>{
  const file=(ev.target as HTMLInputElement).files?.[0],error=root.querySelector<HTMLElement>('[data-file-error]')!;if(!file)return;error.hidden=true;
  try{if(file.size>1000000)throw new Error('Ce fichier est trop volumineux pour une lecture LEVOIS.');
   const text=await file.text();let raw:unknown;
   if(file.name.toLowerCase().endsWith('.json'))raw=JSON.parse(text);else{const doc=new DOMParser().parseFromString(text,'text/html');const data=doc.querySelector('#levois-context')?.textContent;if(!data)throw new Error('Le fichier ne contient pas de contexte LEVOIS.');raw=JSON.parse(data);}
   const incoming=parseContext(raw);if(!incoming)throw new Error('Cette version de fichier n’est pas reconnue. Votre session actuelle est conservée.');present(incoming,'file');
  }catch(err){error.textContent=err instanceof Error?err.message:'Le fichier est illisible.';error.hidden=false;}
 });
 if(token){
  fileSection.hidden=true;linkSection.hidden=false;
  linkSection.innerHTML='<h2>Vérifier l’accès à votre contexte.</h2><p style="margin-top:20px">Un code sera envoyé à l’adresse déjà associée à ce partage. Le lien seul ne révèle aucune information sur votre projet.</p><button type="button" class="lv-button" data-challenge style="margin-top:24px">Recevoir mon code d’accès</button><form data-code-form hidden style="margin-top:25px"><div class="lv-field"><label for="resume-code">Code reçu par e-mail</label><input id="resume-code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{8}" maxlength="8" required/></div><button class="lv-button" type="submit">Vérifier et ouvrir</button></form><p class="lv-note" data-link-status role="status" style="margin-top:20px"></p><div class="lv-history"><p>Un lien expiré, révoqué ou transféré ne donne pas accès au contexte.</p><a class="lv-text-link" href="/contact">Demander un nouveau lien à Mouaad</a><a class="lv-text-link" href="/">Continuer sans reprendre ce contexte</a></div>';
  const status=linkSection.querySelector<HTMLElement>('[data-link-status]')!,button=linkSection.querySelector<HTMLButtonElement>('[data-challenge]')!,form=linkSection.querySelector<HTMLFormElement>('[data-code-form]')!;
  button.addEventListener('click',async()=>{button.disabled=true;status.textContent='Vérification de la demande…';try{const{response,data}=await requestJson<any>('/api/experience/reprise',{method:'POST',redirect:'error',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({step:'challenge',token})});status.textContent=data.message||'Si ce lien permet une reprise, un code est envoyé à l’adresse autorisée.';form.hidden=false;}catch{status.textContent='L’accès n’a pas pu être vérifié. Vous pouvez réessayer ou continuer sans ce contexte.';}finally{button.disabled=false;button.textContent='Demander à nouveau un code';}});
  form.addEventListener('submit',async ev=>{ev.preventDefault();if(!form.reportValidity())return;const submit=form.querySelector<HTMLButtonElement>('button')!;submit.disabled=true;try{const{response,data}=await requestJson<any>('/api/experience/reprise',{method:'POST',redirect:'error',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify({step:'verify',token,code:String(new FormData(form).get('code'))})});const incoming=response.ok&&data.ok?parseContext(data.context):null;if(!incoming){status.textContent=data.message||'Ce lien ou ce code ne permet pas la reprise. Vous pouvez demander un nouvel accès.';return;}if(data.humanNote&&typeof data.humanNote.text==='string')incoming.humanNotes=[...(incoming.humanNotes||[]),{id:String(data.humanNote.id),text:data.humanNote.text,author:'Mouaad Boullourou',createdAt:data.humanNote.createdAt,source:[data.humanNote.reason,data.humanNote.evidence].filter(Boolean).join(' · ')}];present(incoming,'known');}catch{status.textContent='La reprise n’est pas confirmée. Vos données locales restent disponibles.';}finally{submit.disabled=false;}});
 }
}
