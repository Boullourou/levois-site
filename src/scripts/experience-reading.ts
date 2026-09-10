import {buyerJourney,getBuyerResource} from '../lib/experience/buyer';
import {sellerJourney,getSellerResource} from '../lib/experience/seller';
import {transitionJourney} from '../lib/experience/transition';
import {createContext,parseContext,saveContext,CONTEXT_KEY,contextForReading,escapeHtml as e,textReading} from '../lib/experience/context';
import {parseLegacySeller} from '../lib/experience/legacy-seller';
import {readingSectionsHTML,nextHTML,limitsHTML,comparisonHTML} from '../lib/experience/render';
import {keepReading} from '../lib/experience/export';
import {buildAuditReading} from '../lib/experience/audit';
import {localJourney,localContinuation} from '../lib/experience/local-experience';
import {answersText} from '../lib/experience/labels';
import {readingDetailsHTML} from '../lib/experience/reading-details';
import {requestJson} from '../lib/request-json';
import type {Context,Reading,Project} from '../lib/experience/types';
const root=document.querySelector<HTMLElement>('[data-reading-root]');
const routes:Record<Project,string>={buyer:'/ma-recherche',seller:'/situer-ma-vente',transition:'/vendre-et-acheter',local:'/votre-rue',audit:'/audit-annonce'};
const journeyFor=(p:Project)=>p==='buyer'?buyerJourney:p==='seller'?sellerJourney:p==='transition'?transitionJourney:p==='local'?localJourney:null;
if(root){
 let ctx:Context|null=null,reading:Reading|null=null,isLegacy=false;
 let legacyAnswers:Record<string,string>|null=null;
 try{ctx=parseContext(JSON.parse(sessionStorage.getItem(CONTEXT_KEY)||'null'));}catch{}
 const legacy=root.hasAttribute('data-legacy-result')?parseLegacySeller(new URLSearchParams(location.search)):{kind:'none' as const};
 if(legacy.kind==='result'){
  isLegacy=true;legacyAnswers=legacy.initialAnswers;reading=legacy.reading;ctx=createContext('seller');
  ctx.revision=1;for(const[id,value]of Object.entries(legacy.initialAnswers))ctx.answers[id]={value,provenance:'imported',updatedAt:ctx.updatedAt,revision:1};
  ctx.reading=reading;
 }else if(legacy.kind==='invalid'){root.innerHTML='<div class="lv-empty"><h1>Ce lien est incomplet.</h1><p class="lv-intro">'+e(legacy.reason)+'</p><div class="lv-actions"><a class="lv-button" href="/situer-ma-vente">Situer ma vente aujourd’hui</a></div></div>';}
 else if(ctx){const journey=journeyFor(ctx.project);reading=ctx.reading||journey?.buildReading(ctx)||(ctx.project==='audit'?buildAuditReading(ctx):null);if(reading){ctx.reading=reading;saveContext(ctx);}}
 if(legacy.kind!=='invalid'){
  if(!ctx||!reading){root.innerHTML='<div class="lv-empty"><h1>Votre lecture commence par votre situation.</h1><p class="lv-intro">'+(ctx?.project==='audit'?'Votre audit est encore en brouillon. <a class="lv-text-link" href="/audit-annonce">Reprendre mon audit d’annonce</a>':'Aucune lecture n’est ouverte dans cette session.')+' Choisissez un projet, ou reprenez un fichier que vous avez gardé.</p><nav class="lv-projects"><a href="/ma-recherche">Acheter <span aria-hidden="true">↗</span></a><a href="/situer-ma-vente">Vendre <span aria-hidden="true">↗</span></a><a href="/vendre-et-acheter">Vendre et acheter <span aria-hidden="true">↗</span></a></nav><a class="lv-text-link" href="/reprendre">Reprendre une lecture conservée</a></div>';}
  else{
   let displayed=reading;const context=ctx;
   function track(event:string){window.dispatchEvent(new CustomEvent('levois:journey',{detail:{event,selected_journey:context.project}}));}
   function render(){
    const resourceContext=contextForReading(context,displayed);
    const resource=resourceContext.project==='buyer'?getBuyerResource(resourceContext):resourceContext.project==='seller'&&!isLegacy?getSellerResource(resourceContext):null;
    const qs=journeyFor(context.project)?.getQuestions(context)||[];
    const sourceContext=contextForReading(context,displayed);
    const continuation=context.project==='local'?localContinuation(context):null;
    const corrections=qs.filter(q=>Object.hasOwn(context.answers,q.id)).map(q=>'<a class="lv-text-link" href="'+routes[context.project]+'?edit='+e(q.id)+'">'+e(q.title)+'</a>').join('');
    root!.innerHTML='<div class="lv-reading-grid"><div class="lv-reading-opening"><h1>'+e(displayed.title)+'</h1><p class="lv-note">'+(isLegacy?'Reconstruction d’un ancien lien':'À partir de vos réponses')+' · Version '+e(displayed.revision)+'<br/>'+e(new Intl.DateTimeFormat('fr-FR',{dateStyle:'long',timeStyle:'short'}).format(new Date(displayed.generatedAt)))+'</p><p class="lv-reading-summary">Ce que vous savez. Ce qui reste ouvert. Le prochain choix utile.</p><div class="lv-actions">'+(isLegacy?'<button class="lv-secondary" data-legacy-current>Confirmer ou corriger pour aujourd’hui</button>':'<a class="lv-text-link" href="#corrections">Corriger une réponse</a><a class="lv-text-link" href="'+routes[context.project]+(context.project==='buyer'||context.project==='transition'?'?depth=deep':'')+'">Approfondir mon projet</a>')+'</div><p class="lv-note">Cette lecture organise vos déclarations. Elle ne vaut ni estimation, ni avis juridique, ni validation de financement.</p></div><div><div data-reading-sections>'+readingSectionsHTML(displayed,sourceContext)+'</div>'+(displayed.options?.length?comparisonHTML(displayed.options):'')+readingDetailsHTML(displayed)+nextHTML(displayed)+limitsHTML(displayed)+
    (sourceContext.humanNotes?.length?'<section class="lv-history lv-human-notes"><h2>Les apports humains</h2>'+sourceContext.humanNotes.map(n=>'<article class="lv-reading-item" data-kind="verified"><span class="lv-evidence">'+e(n.author)+' · '+e(n.createdAt)+'</span><p>'+e(n.text)+'</p>'+(n.source?'<p class="lv-note">Source ou fondement : '+e(n.source)+'</p>':'')+'</article>').join('')+'</section>':'')+
    '<section class="lv-keep" aria-label="Garder votre lecture"><button class="lv-button" data-keep>Garder cette lecture <span aria-hidden="true">↓</span></button><button class="lv-secondary" data-action="email-copy">M’envoyer cette synthèse sans appel</button><button class="lv-text-link" data-print>Imprimer la lecture complète</button><p class="lv-note">« Garder » télécharge un fichier lisible et réimportable sur votre appareil. Aucun envoi à Mouaad.</p></section>'+
    '<section class="lv-human-reading"><header><img src="/images/levois-mouaad.webp" width="88" height="110" alt="Mouaad Boullourou" loading="lazy"/><div><h2>Ce que Mouaad peut apporter maintenant.</h2><p class="lv-note">Une responsabilité humaine, au bon endroit.</p></div></header><p>Les points encore ouverts de cette lecture donnent le sujet du prochain échange. Mouaad peut commencer par une relecture écrite ciblée, puis vous échangez si vous le souhaitez.</p><div class="lv-actions"><button class="lv-button" data-action="review">Demander à Mouaad de relire</button><button class="lv-secondary" data-action="exchange">Échanger avec Mouaad</button></div><p class="lv-note">La relecture est écrite. Aucun appel automatique, aucun délai de réponse promis.</p></section>'+
    (continuation?'<div class="lv-history"><a class="lv-button" href="'+e(continuation.href)+'">'+e(continuation.label)+'</a></div>':'')+(resource?'<section class="lv-history"><h2>Un appui pour votre prochaine décision</h2><a class="lv-text-link" href="'+e(resource.href)+'">'+e(resource.label)+'</a><p class="lv-note">'+e(resource.detail)+'</p></section>':'')+
    (!isLegacy?'<details id="corrections" class="lv-history"><summary>Relire et corriger mes réponses</summary>'+corrections+(qs.length?'':'<a class="lv-text-link" href="'+routes[context.project]+'">Revenir à mon outil</a>')+'</details>':'')+
    (context.history?.length?'<details class="lv-history"><summary>Lectures précédentes de cette session</summary><p class="lv-note">Chaque version conservée garde sa méthode et son contexte de date.</p>'+context.history.map((r,i)=>'<button class="lv-text-link" data-history="'+i+'">Version '+e(r.revision)+' · '+e(r.generatedAt)+'</button>').join('')+'<button class="lv-text-link" data-current>Revenir à la lecture actuelle</button></details>':'')+
    '<div class="lv-history"><a class="lv-text-link" href="/ressources">Les ressources pour continuer à votre rythme</a><p class="lv-note">Attendre reste possible. Gardez les conditions qui vous feraient réexaminer cette décision.</p></div></div></div><dialog class="lv-modal" data-action-dialog aria-labelledby="action-title"></dialog><p class="lv-toast" data-toast role="status" hidden></p>';
    root!.querySelector('[data-keep]')?.addEventListener('click',()=>{keepReading(contextForReading(context,displayed),displayed);track('reading_kept');const toast=root!.querySelector<HTMLElement>('[data-toast]')!;toast.textContent='Le téléchargement de votre lecture est lancé.';toast.hidden=false;setTimeout(()=>toast.hidden=true,4500);});
    root!.querySelector('[data-print]')?.addEventListener('click',()=>{const ds=[...root!.querySelectorAll<HTMLDetailsElement>('.lv-reading-item details')],prior=ds.map(d=>d.open);ds.forEach(d=>d.open=true);window.print();ds.forEach((d,i)=>d.open=prior[i]);});
    root!.querySelectorAll<HTMLElement>('[data-action]').forEach(b=>b.addEventListener('click',()=>openAction(b.dataset.action as 'email-copy'|'review'|'exchange',b)));
    root!.querySelector('[data-legacy-current]')?.addEventListener('click',()=>{if(!legacyAnswers)return;context.reading=undefined;context.history=[displayed];saveContext(context);location.assign('/situer-ma-vente');});
    root!.querySelectorAll<HTMLElement>('[data-history]').forEach(b=>b.addEventListener('click',()=>{displayed=context.history![Number(b.dataset.history)];render();root!.scrollIntoView();}));
    root!.querySelector('[data-current]')?.addEventListener('click',()=>{displayed=context.reading!;render();});
   }
   function openAction(action:'email-copy'|'review'|'exchange',opener:HTMLElement){
    const dialog=root!.querySelector<HTMLDialogElement>('[data-action-dialog]')!;
    const copy=action==='email-copy',review=action==='review';
    const title=copy?'Recevoir cette synthèse sans appel':review?'Une relecture écrite ciblée':'Choisir un échange avec Mouaad';
    const historicalAnswers=(displayed as Reading & {answersSnapshot?:Context['answers']}).answersSnapshot;
    const snapshot={...contextForReading(context,displayed),history:[]};
    const synthesis=textReading(displayed,snapshot);
    let frozenPayload:Record<string,unknown>|null=null,lastFingerprint='';
    dialog.innerHTML='<div class="lv-modal-close"><button type="button" data-close>Fermer</button></div><h2 id="action-title">'+title+'</h2><p>'+ (copy?'Seule votre adresse e-mail sert à cet envoi. Aucun prospect commercial ni droit de relance n’est créé.':review?'Mouaad relit par écrit les points ouverts de cette version. Vous pourrez choisir un échange ensuite. Aucun délai de réponse n’est promis.':'Votre demande concerne cette lecture et le canal que vous choisissez.')+'</p><form><p class="lv-note">Version '+e(displayed.revision)+' · '+e(displayed.methodVersion)+'</p><details><summary class="lv-text-link">Vérifier la synthèse à transmettre</summary><pre class="lv-preview">'+e(synthesis)+'</pre></details>'+(!copy?'<details><summary class="lv-text-link">Vérifier les réponses jointes</summary><pre class="lv-preview">'+e(answersText(snapshot))+'</pre></details>':'')+
    (!copy?'<div class="lv-field"><label for="action-question">'+(review?'Quel point souhaitez-vous faire relire ?':'Quel sujet souhaitez-vous aborder ?')+' <span class="lv-note">(facultatif)</span></label><textarea id="action-question" name="question" maxlength="2500" rows="3"></textarea></div>':'')+
    (action==='exchange'?'<fieldset class="lv-field"><legend>Comment préférez-vous échanger ?</legend><div class="lv-choices"><label class="lv-choice"><input name="channel" type="radio" value="email" checked/><span>Par e-mail</span></label><label class="lv-choice"><input name="channel" type="radio" value="phone"/><span>Par téléphone</span></label></div></fieldset>':'')+
    '<div class="lv-field" data-email-field><label for="action-email">Votre adresse e-mail</label><input id="action-email" name="email" type="email" autocomplete="email" maxlength="254" required/></div><div class="lv-field" data-phone-field hidden><label for="action-phone">Votre numéro de téléphone</label><input id="action-phone" name="phone" type="tel" autocomplete="tel" maxlength="30" disabled/></div>'+
    '<label class="lv-check"><input name="approved" type="checkbox" required/><span>'+ (copy?'Je demande uniquement l’envoi de cette synthèse à mon adresse, sans appel ni relecture.':review?'Je demande la relecture écrite de cette version et autorise le traitement des réponses et de mon e-mail pour cette demande.':'Je demande cet échange et autorise le traitement de cette version et de la coordonnée choisie pour y répondre.')+'</span></label>'+
    '<p class="lv-note" style="margin-top:16px">'+(copy?'Votre adresse est traitée par le service d’envoi pour cette copie.':'Un dossier opérationnel est créé uniquement pour traiter cette demande. Aucun accord de prospection générale n’est donné.')+' <a href="/confidentialite">Confidentialité</a></p><p class="lv-error" data-action-status role="status" hidden></p><div class="lv-actions"><button class="lv-button" type="submit">'+(copy?'M’envoyer cette version':review?'Demander cette relecture écrite':'Envoyer ma demande d’échange')+'</button><button class="lv-secondary" type="button" data-keep-dialog>Garder le fichier sur mon appareil</button></div></form>';
    const form=dialog.querySelector<HTMLFormElement>('form')!,status=dialog.querySelector<HTMLElement>('[data-action-status]')!;
    dialog.querySelector('[data-close]')?.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>opener.focus(),{once:true});
    dialog.querySelector('[data-keep-dialog]')?.addEventListener('click',()=>keepReading(contextForReading(context,displayed),displayed));
    form.addEventListener('change',()=>{
     const phone=(form.elements.namedItem('channel') as RadioNodeList)?.value==='phone';
     const ei=form.elements.namedItem('email') as HTMLInputElement,pi=form.elements.namedItem('phone') as HTMLInputElement;
     ei.disabled=phone;ei.required=!phone;pi.disabled=!phone;pi.required=phone;
     dialog.querySelector<HTMLElement>('[data-email-field]')!.hidden=phone;dialog.querySelector<HTMLElement>('[data-phone-field]')!.hidden=!phone;
    });
    form.addEventListener('submit',async ev=>{
     ev.preventDefault();if(!form.reportValidity())return;
     const fd=new FormData(form),channel=fd.get('channel')==='phone'?'phone':'email';
     const fields={action,channel,...(channel==='phone'?{phone:String(fd.get('phone')||'')}:{email:String(fd.get('email')||'')}),...(!copy?{question:String(fd.get('question')||'')}:{})};
     const fingerprint=JSON.stringify(fields);
     if(!frozenPayload||fingerprint!==lastFingerprint){lastFingerprint=fingerprint;frozenPayload={...fields,requestId:crypto.randomUUID(),approved:true,...(!copy?{context:snapshot}:{}),synthesis,consent:{purpose:copy?'copy':action,textVersion:'2026-09-10',acceptedAt:new Date().toISOString()}};}
     const button=form.querySelector<HTMLButtonElement>('[type=submit]')!;button.disabled=true;status.hidden=false;status.className='lv-note';status.textContent='Transmission en cours…';
     try{const {response,data}=await requestJson<{ok:boolean;saved?:boolean;requestId?:string;notificationSent?:boolean;notificationState?:string;message?:string}>('/api/experience/actions',{method:'POST',redirect:'error',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify(frozenPayload)});

      const acknowledged=response.ok&&data.ok&&(copy?data.notificationSent===true:data.saved===true&&typeof data.requestId==='string');
      status.textContent=acknowledged?(data.message||'La demande a été prise en compte.')+(data.saved&&data.requestId?' Référence : '+data.requestId:''):'La transmission n’est pas confirmée. Votre lecture reste disponible. Vous pouvez réessayer avec la même référence.';
      status.className=acknowledged?'lv-limit':'lv-error';
      if(acknowledged){button.disabled=!!data.notificationSent;track(copy?'reading_copy_requested':review?'review_requested':'exchange_requested');const retryable=data.saved&&!data.notificationSent&&['failed','unavailable','pending'].includes(data.notificationState||'');button.textContent=retryable?'Réessayer la notification de cette même demande':data.saved&&!data.notificationSent?'Demande enregistrée · notification à vérifier':'Demande transmise';button.disabled=!retryable;}
      else button.disabled=false;
     }catch(error){status.className='lv-error';status.textContent='La transmission n’est pas confirmée. Votre lecture reste disponible. Réessayer conservera la même référence de demande.';button.disabled=false;}
    });
    dialog.showModal();
   }
   render();track('result_viewed');
  }
 }
}
