import {escapeHtml as e} from './context';
import {answerLabels} from './labels';
import type { Context, ComparisonOption, Impact, Reading } from './types';
const labels:Record<string,string>={declared:'Vous indiquez',solid:'Appui de la lecture',conditional:'Sous condition',unknown:'À vérifier',data:'Donnée documentée',hypothesis:'Hypothèse de lecture',verified:'Vérification attribuée'};
export function comparisonHTML(options:ComparisonOption[]):string{return '<div class="lv-comparison">'+options.map(o=>'<article class="lv-option"><h3>'+e(o.title)+'</h3><p><strong>Ce que cela change</strong>'+e(o.consequence)+'</p><p><strong>À quelle condition</strong>'+e(o.condition)+'</p><p><strong>Ce qui reste ouvert</strong>'+e(o.limit)+'</p></article>').join('')+'</div>';}
export function impactHTML(i:Impact):string{return '<h2 tabindex="-1">'+e(i.title)+'</h2><p>'+e(i.text)+'</p><p class="lv-limit">'+e(i.limit)+'</p>'+(i.comparison?.length?comparisonHTML(i.comparison):'');}
export function readingSectionsHTML(r:Reading,c?:Context):string {
 if(r.methodVersion==='diagnostic-2026-10-25')return '<div class="lv-reading-rail">'+r.sections.map(s=>'<section class="lv-reading-section"><h2>'+e(s.title)+'</h2>'+s.items.map(i=>'<p>'+e(i.text)+(i.condition?' '+e(i.condition):'')+'</p>').join('')+'</section>').join('')+'</div>';
 const sourceLabels=c?answerLabels(c):{};
 return '<div class="lv-reading-rail">'+r.sections.map(s=>'<section class="lv-reading-section"><h2>'+e(s.title)+'</h2>'+s.items.map(i=>{
  const ids=i.sourceAnswerIds||[],provenance=ids.map(id=>{const a=c?.answers[id];return a?'<li>'+e(sourceLabels[id]||'Information du contexte')+' · '+e(i.kind==='data'?'source de données documentée':a.provenance==='imported'?'repris, à confirmer':a.provenance==='confirmed'?'confirmé par vous':'déclaré par vous')+' · version '+e(a.revision)+'</li>':'';}).join('');
  return '<div class="lv-reading-item" data-kind="'+e(i.kind)+'"><span class="lv-evidence">'+e(labels[i.kind]||'Lecture')+'</span><p>'+e(i.text)+'</p>'+(i.condition?'<p class="lv-note"><strong>Condition :</strong> '+e(i.condition)+'</p>':'')+(provenance?'<details><summary>Pourquoi ce point apparaît</summary><p>Cette formulation découle des réponses suivantes, selon la méthode '+e(r.methodVersion)+'. Une déclaration n’est pas une preuve vérifiée.</p><ul>'+provenance+'</ul></details>':'')+'</div>';
 }).join('')+'</section>').join('')+'</div>';
}
export function nextHTML(r:Reading):string{return '<section class="lv-next"><h2>Votre prochaine décision utile</h2><p><strong>'+e(r.nextDecision.text)+'</strong></p><p>'+e(r.nextDecision.why)+'</p>'+(r.nextDecision.changesWith?'<p class="lv-note">Cette lecture peut changer avec : '+e(r.nextDecision.changesWith)+'</p>':'')+'</section>';}
export function limitsHTML(r:Reading):string{return '<section class="lv-reading-limits"><h2>Le périmètre de cette lecture</h2><ul>'+r.limits.map(s=>'<li>'+e(s)+'</li>').join('')+'</ul></section>';}
