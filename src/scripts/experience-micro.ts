import {microExperiences,buildMicroReading} from '../data/micro-experiences';
import {readContext,setAnswer,saveContext,entryFromUrl} from '../lib/experience/context';
import {keepReading} from '../lib/experience/export';
import {impactHTML} from '../lib/experience/render';
import {buyerDependencies} from '../lib/experience/buyer';
import {transitionDependencies} from '../lib/experience/transition';
const root=document.querySelector<HTMLElement>('[data-micro]');
if(root){
 const started=performance.now();
 function track(event:string,more:Record<string,unknown>={}){window.dispatchEvent(new CustomEvent('levois:journey',{detail:{event,selected_journey:def.project,...more}}));}
 const def=microExperiences.find(x=>x.slug===root.dataset.micro)!;
 let ctx=readContext(def.project);ctx.entry=entryFromUrl(new URL(location.href));
 const dependencies=def.project==='buyer'?buyerDependencies:def.project==='transition'?transitionDependencies:{micro_visits_feedback:['seller_visites_remarques']};
 const firstValue=root.querySelector('.lv-intro');if(firstValue){const observer=new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting)){track('first_value_seen',{duration_seconds:Math.round((performance.now()-started)/1000)});observer.disconnect();}},{threshold:.5});observer.observe(firstValue);}
 function persist(){ctx.reading=buildMicroReading(def,ctx);return saveContext(ctx);}
 function selected(){return def.choices.find(o=>o.value===ctx.answers[def.answerId]?.value);}
 function refresh(){const choice=selected(),impact=root!.querySelector<HTMLElement>('[data-micro-impact]')!;if(choice){impact.hidden=false;impact.innerHTML=impactHTML({title:choice.consequence,text:choice.explanation,limit:choice.limit});root!.querySelector<HTMLElement>('[data-micro-signature]')!.hidden=false;}}
 root.querySelectorAll<HTMLInputElement>('[name=micro-answer]').forEach(input=>{input.checked=input.value===ctx.answers[def.answerId]?.value;input.addEventListener('change',()=>{if(Object.hasOwn(ctx.answers,def.answerId)&&ctx.answers[def.answerId].value!==input.value)track('answer_corrected');ctx=setAnswer(ctx,def.answerId,input.value,dependencies);persist();refresh();});});
 refresh();
 root.querySelector('[data-micro-signature]')?.addEventListener('click',()=>{const impact=root.querySelector<HTMLElement>('[data-micro-impact]')!;impact.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});impact.classList.add('lv-impact-highlight');impact.querySelector<HTMLElement>('h2')?.focus({preventScroll:true});});
 root.querySelector('[data-micro-keep]')?.addEventListener('click',()=>{persist();keepReading(ctx,ctx.reading!);track('reading_kept');root.querySelector('[data-micro-status]')!.textContent='Le téléchargement de cette version est lancé.';});
 root.querySelector('[data-micro-reading]')?.addEventListener('click',ev=>{if(!persist()){ev.preventDefault();root.querySelector('[data-micro-status]')!.textContent='Le stockage de session est bloqué. Gardez cette lecture sur votre appareil avant de continuer.';}});
 root.querySelector('[data-micro-continue]')?.addEventListener('click',()=>{if(def.project==='seller'){ctx=setAnswer(ctx,'seller_situation','visites');if(selected()?.value==='vague')ctx=setAnswer(ctx,'seller_visites_remarques','vagues');}ctx.depth='intermediate';delete ctx.reading;if(saveContext(ctx)){track('journey_started');location.assign(def.route);}else root.querySelector('[data-micro-status]')!.textContent='Le stockage de session est bloqué. Gardez votre lecture ici ; elle reste lisible dans le fichier téléchargé.';});
}
