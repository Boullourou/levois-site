import type {Reading} from './types';
import {escapeHtml as e} from './context';
type DetailReading=Reading & {timeline?:{label:string;date:string|null;statusLabel:string}[];costs?:{items:{label:string;amount:number|null;unit:string;condition:string}[];label:string;knownOneOffSubtotal:number|null}};
/** Use the frozen values of the displayed reading, never today's answers. */
export function readingDetailsText(reading:Reading):string{
 const r=reading as DetailReading,parts:string[]=[];
 if(r.timeline?.length)parts.push('Dates et dépendances',...r.timeline.map(t=>t.label+' : '+(t.date||'Date non renseignée')+' — '+t.statusLabel),'Ces repères ne présument ni un financement, ni la disponibilité des fonds, ni la réalisation d’une date.');
 if(r.costs)parts.push('Les coûts renseignés',...r.costs.items.flatMap(i=>[i.label+' : '+(i.amount===null?'non chiffré':new Intl.NumberFormat('fr-FR').format(i.amount)+' €'+(i.unit==='month'?' / mois':'')),i.condition]),r.costs.label+' : '+(r.costs.knownOneOffSubtotal===null?'non calculé':new Intl.NumberFormat('fr-FR').format(r.costs.knownOneOffSubtotal)+' €'),'Un sous-total incomplet, pas le coût final de la transition. Les montants mensuels ne sont pas ajoutés aux dépenses ponctuelles.');
 return parts.join('\n');
}
export function readingDetailsHTML(r:Reading):string{
 const d=r as DetailReading;if(!d.timeline&&!d.costs)return '';return '<section class="lv-reading-limits"><h2>Dates, dépendances et coûts renseignés</h2>'+(d.timeline?.length?'<div class="lv-timeline">'+d.timeline.map(t=>'<div><span>'+e(t.statusLabel)+'</span><h3>'+e(t.label)+'</h3><p>'+e(t.date||'Date non renseignée')+'</p></div>').join('')+'</div><p class="lv-note">Ces repères ne présument ni un financement, ni la disponibilité des fonds, ni la réalisation d’une date.</p>':'')+(d.costs?'<h3 style="margin-top:24px">Les coûts renseignés</h3>'+d.costs.items.map(i=>'<div class="lv-cost-line"><p><strong>'+e(i.label)+'</strong> : '+(i.amount===null?'non chiffré':e(new Intl.NumberFormat('fr-FR').format(i.amount))+' €'+(i.unit==='month'?' / mois':''))+'</p><p class="lv-note">'+e(i.condition)+'</p></div>').join('')+'<p style="margin-top:20px"><strong>'+e(d.costs.label)+'</strong> : '+(d.costs.knownOneOffSubtotal===null?'non calculé':e(new Intl.NumberFormat('fr-FR').format(d.costs.knownOneOffSubtotal))+' €')+'</p><p class="lv-note">Un sous-total incomplet, pas le coût final de la transition. Les montants mensuels ne sont pas ajoutés aux dépenses ponctuelles.</p>':'')+'</section>';
}
