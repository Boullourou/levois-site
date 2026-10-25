import {buyerJourney,buyerDependencies} from '../lib/experience/buyer';
import {transitionJourney,transitionDependencies} from '../lib/experience/transition';
import {sellerJourney,sellerInactiveAnswerIds} from '../lib/experience/seller';
import {parseLegacySeller} from '../lib/experience/legacy-seller';
import {readContext,saveContext,setAnswer,createContext,confirmImported,escapeHtml as e} from '../lib/experience/context';
import {keepReading} from '../lib/experience/export';
import {readingDetailsHTML} from '../lib/experience/reading-details';
import {readingSectionsHTML,nextHTML,limitsHTML,comparisonHTML} from '../lib/experience/render';
import type {Context,Project,Question,AnswerValue} from '../lib/experience/types';

const root=document.querySelector<HTMLElement>('[data-journey]');
if(root){
 const project=root.dataset.journey as Project;
 const journey=project==='buyer'?buyerJourney:project==='transition'?transitionJourney:sellerJourney;
 const dependencies=project==='buyer'?buyerDependencies:project==='transition'?transitionDependencies:{};
 const panel=root.querySelector<HTMLElement>('[data-question-panel]')!,side=root.querySelector<HTMLElement>('[data-journey-side]')!;
 let ctx=readContext(project),index=0,editing=false;
 const params=new URLSearchParams(location.search),editId=params.get('edit');
 const legacy=project==='seller'?parseLegacySeller(params):{kind:'none' as const};

 function persist(){
  const ok=saveContext(ctx);
  const warning=root!.querySelector<HTMLElement>('[data-storage-warning]');
  if(warning)warning.hidden=ok;
  return ok;
 }

 function event(name:string,extra:Record<string,unknown>={}){
  window.dispatchEvent(new CustomEvent('levois:journey',{detail:{event:name,selected_journey:project,...extra}}));
 }

 function questions(){
  return journey.getQuestions(ctx);
 }

 function updateAnswer(q:Question,v:AnswerValue){
  const wasAnswered=Object.hasOwn(ctx.answers,q.id);
  const changed=JSON.stringify(ctx.answers[q.id]?.value)!==JSON.stringify(v);
  ctx=setAnswer(ctx,q.id,v,dependencies);
  if(project==='seller'&&q.id==='seller_situation')for(const id of sellerInactiveAnswerIds(ctx))delete ctx.answers[id];
  persist();
  if(wasAnswered&&changed)event('answer_corrected',{step:q.sequence});
 }

 function showReading(){
  ctx.reading=journey.buildReading(ctx);
  event('result_viewed');
  if(persist()){
   location.assign('/lecture');
   return;
  }
  const reading=ctx.reading;
  panel.innerHTML='<h1>'+e(reading.title)+'</h1><p class="lv-limit">Le stockage de session est bloqué. Votre lecture reste ici et peut être téléchargée avant de quitter cette page.</p>'+readingSectionsHTML(reading,ctx)+(reading.options?.length?comparisonHTML(reading.options):'')+readingDetailsHTML(reading)+nextHTML(reading)+limitsHTML(reading)+'<div class="lv-actions"><button class="lv-button" data-memory-keep>Garder cette lecture</button><button class="lv-secondary" data-memory-back>Corriger mes réponses</button><button class="lv-text-link" data-memory-print>Imprimer la lecture complète</button></div>';
  panel.querySelector('[data-memory-keep]')?.addEventListener('click',()=>keepReading(ctx,reading));
  panel.querySelector('[data-memory-back]')?.addEventListener('click',()=>render(true));
  panel.querySelector('[data-memory-print]')?.addEventListener('click',()=>{panel.querySelectorAll('details').forEach(d=>d.open=true);window.print();});
  panel.scrollIntoView();
 }

 function render(focus=false){
  const qs=questions();
  if(!qs.length){showReading();return;}
  index=Math.max(0,Math.min(index,qs.length-1));
  const q=qs[index];
  const answer=ctx.answers[q.id]?.value;

  side.innerHTML='<h2>Votre projet<br/>prend forme.</h2><ol class="lv-sequences">'+journey.sequences.map((s,i)=>'<li'+(q.sequence===i+1?' aria-current="step"':'')+'><span>'+String(i+1).padStart(2,'0')+'</span>'+e(s)+'</li>').join('')+'</ol><p class="lv-note">Une décision à la fois. Vos choix affinent votre diagnostic en temps réel.</p>';

  let controls='';
  if(q.type==='choice'||q.type==='multiple'){
   controls='<div class="lv-choices">'+(q.choices||[]).map((o)=>'<label class="lv-choice"><input type="'+(q.type==='multiple'?'checkbox':'radio')+'" name="answer" value="'+e(o.value)+'" '+((Array.isArray(answer)?answer.includes(o.value):answer===o.value)?'checked':'')+'/><span>'+e(o.label)+(o.detail?'<small>'+e(o.detail)+'</small>':'')+'</span></label>').join('')+'</div>'+(q.maxChoices?'<p class="lv-note" style="margin-top:10px">Jusqu’à '+q.maxChoices+' réponses. Ne rien choisir ne signifie pas que tout est acceptable.</p>':'');
  } else {
   controls='<div class="lv-field"><label class="lv-note" for="journey-answer">'+(q.type==='date'?'Date, si elle est connue':q.suffix?'Votre réponse en '+e(q.suffix):'Votre réponse, avec vos mots')+'</label>'+(q.type==='text'?'<textarea id="journey-answer" name="answer" rows="3" maxlength="'+(q.maxLength||500)+'" placeholder="'+e(q.placeholder||'')+'">'+e(answer||'')+'</textarea>':'<input id="journey-answer" name="answer" type="'+q.type+'" '+(q.type==='number'?'inputmode="decimal" step="any" ':'')+(q.min!==undefined?'min="'+q.min+'" ':'')+(q.max!==undefined?'max="'+q.max+'" ':'')+'value="'+e(answer??'')+'" />')+'</div>';
  }

  const isLast=index===qs.length-1;
  const buttonLabel=editing?'Actualiser ma lecture':isLast?'Lire mon projet':'Continuer';

  panel.innerHTML='<div class="lv-progress-label"><span>'+e(q.sequenceTitle||journey.sequences[q.sequence-1])+'</span><span>'+q.sequence+' sur '+journey.sequences.length+'</span></div>'+
   '<div class="lv-progress" role="progressbar" aria-label="Séquence du projet" aria-valuemin="0" aria-valuemax="'+journey.sequences.length+'" aria-valuenow="'+q.sequence+'"><i style="width:'+(q.sequence/journey.sequences.length*100)+'%"></i></div>'+
   '<h1 tabindex="-1">'+e(q.title)+'</h1>'+(q.help?'<p class="lv-intro">'+e(q.help)+'</p>':'')+
   '<form class="lv-question-form" novalidate>'+controls+
   '<p class="lv-error" data-error role="alert" hidden></p>'+
   '<div class="lv-question-actions">'+
   '<button class="lv-button" type="submit">'+buttonLabel+'</button>'+
   (index>0?'<button class="lv-text-link" data-back type="button">← Retour</button>':'')+
   '</div></form>';

  const form=panel.querySelector<HTMLFormElement>('form')!,error=panel.querySelector<HTMLElement>('[data-error]')!;

  function collect():AnswerValue|undefined{
   if(q.type==='choice')return form.querySelector<HTMLInputElement>('input:checked')?.value;
   if(q.type==='multiple')return [...form.querySelectorAll<HTMLInputElement>('input:checked')].map(i=>i.value);
   const input=form.elements.namedItem('answer') as HTMLInputElement|HTMLTextAreaElement;
   if(!input||!input.value.trim())return null;
   if(!input.checkValidity()){error.textContent='Vérifiez cette réponse'+(q.min!==undefined?' (minimum '+q.min+')':'')+(q.max!==undefined?' (maximum '+q.max+')':'')+'.';error.hidden=false;return undefined;}
   return q.type==='number'?Number(input.value):input.value.trim();
  }

  form.addEventListener('change',ev=>{
   if(q.type==='multiple'&&ev.target instanceof HTMLInputElement){
    if(ev.target.value==='unknown'&&ev.target.checked)form.querySelectorAll<HTMLInputElement>('input:not([value=unknown])').forEach(i=>i.checked=false);
    else if(ev.target.checked){const unknown=form.querySelector<HTMLInputElement>('input[value=unknown]');if(unknown)unknown.checked=false;}
   }
   if(q.type==='multiple'&&q.maxChoices&&form.querySelectorAll('input:checked').length>q.maxChoices){
    (ev.target as HTMLInputElement).checked=false;error.textContent='Choisissez au maximum '+q.maxChoices+' réponses.';error.hidden=false;return;
   }
   error.hidden=true;
   const v=collect();
   if(v!==undefined)updateAnswer(q,v);
  });

  form.addEventListener('submit',ev=>{
   ev.preventDefault();
   const v=collect();
   if(v===undefined){
    error.textContent='Veuillez sélectionner une option pour continuer.';
    error.hidden=false;
    return;
   }
   updateAnswer(q,v);
   if(editing){showReading();return;}
   event('journey_step_completed',{step:q.sequence});
   const next=questions(),pos=next.findIndex(x=>x.id===q.id);
   if(pos>=next.length-1){showReading();return;}
   index=pos+1;
   render(true);
  });

  panel.querySelector('[data-back]')?.addEventListener('click',()=>{
   index=Math.max(0,index-1);
   render(true);
  });

  if(focus){panel.querySelector<HTMLElement>('h1')?.focus({preventScroll:true});panel.scrollIntoView({block:'start',behavior:'instant'});}
 }

 if(legacy.kind==='result'){location.replace('/situer-ma-vente/resultat'+location.search);}
 else if(legacy.kind==='invalid'){panel.innerHTML='<h1>Ce lien ne suffit pas à retrouver une lecture.</h1><p class="lv-intro">'+e(legacy.reason)+'</p><a class="lv-button" href="/situer-ma-vente">Situer ma vente aujourd’hui</a>';}
 else{
  if(legacy.kind==='situation'){ctx=setAnswer(ctx,'seller_situation',legacy.situationId,dependencies);}
  if(params.get('depth')==='deep')ctx.depth='deep';
  if(editId){const found=questions().findIndex(q=>q.id===editId);if(found>=0){index=found;editing=true;}}
  else{
   const pending=questions().findIndex(q=>!Object.hasOwn(ctx.answers,q.id));
   index=pending<0?0:pending;
  }
  persist();
  render();
  event('journey_started');
 }
}
