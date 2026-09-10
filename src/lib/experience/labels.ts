import type {Context} from './types';
import {buyerJourney} from './buyer';
import {sellerJourney} from './seller';
import {transitionJourney} from './transition';
import {localJourney} from './local-experience';
const fixed:Record<string,string>={audit_url:'Lien de l’annonce',audit_duration:'Période observée',audit_signal:'Réactions observées',audit_context:'Précision complémentaire',audit_access:'Accès à la page',audit_read_at:'Date de lecture',audit_title:'Titre extrait',audit_source:'Site source',audit_photo_count:'Photos détectées',audit_description_length:'Longueur du texte extrait',local_observation:'Ventes DVF retenues : source, période et périmètre',local_intention:'Votre question sur les ventes locales',local_focus:'Le point à éclaircir',micro_visits_feedback:'La précision des retours de visite'};
export function answerLabels(context:Context):Record<string,string>{
 const labels={...fixed},deep={...context,depth:'deep' as const};
 for(const journey of [buyerJourney,sellerJourney,transitionJourney,localJourney])for(const q of journey.getQuestions(deep))labels[q.id]=q.title;
 return labels;
}

export function answersText(context:Context):string{
 const labels=answerLabels(context),questions=[buyerJourney,sellerJourney,transitionJourney,localJourney].flatMap(j=>j.getQuestions({...context,depth:'deep'}));
 return Object.entries(context.answers).map(([id,a])=>{
  const question=questions.find(q=>q.id===id),one=(v:string)=>question?.choices?.find(o=>o.value===v)?.label||v;
  const value=Array.isArray(a.value)?a.value.map(one).join(', '):a.value===null?'Non renseigné':one(String(a.value));
  return (labels[id]||id.replaceAll('_',' '))+'\n'+value+'\n'+(a.provenance==='imported'?'Importé':a.provenance==='confirmed'?'Confirmé par vous':'Déclaré')+' · '+a.updatedAt;
 }).join('\n\n');
}
