import { describe, expect, it } from 'vitest';
import { createContext, setAnswer } from './context';
import { buildLocalReading, getLocalQuestions, localContinuation, localDependencies, localObservation, parseLocalObservation, withLocalObservation, type LocalObservation } from './local-experience';
const sample: LocalObservation = {
  schemaVersion:1,status:'ready',label:'Rue de la République, Lèves',source:'DVF · DGFiP / Etalab',sourceUrl:'https://files.data.gouv.fr/geo-dvf/latest/csv/',period:'2021–2025',generatedAt:'2026-07-24T19:57:24.717Z',latestSale:'2025-12-31',radius:700,count:155,
  houses:{n:84,median:2350,q1:1900,q3:2700},apartments:{n:31,median:2450,q1:2050,q3:2850},filters:'',
};
const body = (context: ReturnType<typeof createContext>) => {const reading=buildLocalReading(context);return [...reading.sections.flatMap(section=>section.items.map(item=>item.text)),reading.nextDecision.text,reading.nextDecision.why].join('\n');};
describe('repères locaux et qualification avant coordonnées (AC02, AC03, AC12, AC13, AC25)',()=>{
  it('conserve source, période, périmètre, effectifs et quartiles sans prix actuel supposé',()=>{
    const context=withLocalObservation(createContext('local'),sample);
    const reading=buildLocalReading(context);
    expect(reading.sections.map(section=>section.title)).toEqual(['Ce que les ventes observées montrent','Ce qu’elles permettent de comparer','Ce qu’elles ne disent pas de votre projet','La prochaine vérification utile']);
    expect(body(context)).toContain('155 ventes');expect(body(context)).toContain('700 m');expect(body(context)).toContain('84 ventes');expect(body(context)).toContain('2021–2025');expect(body(context)).toContain('extraction : 2026-07-24');
    expect(reading.sections[0].items.some(item=>item.kind==='data')).toBe(true);
    expect(body(context)).toContain('offre disponible');
  });
  it('ne remplace pas une statistique sans effectif suffisant par zéro',()=>{
    const context=withLocalObservation(createContext('local'),{...sample,count:9,houses:{n:9,median:2300,q1:1900,q3:2600},apartments:null});
    expect(localObservation(context)?.houses).toBeNull();
    expect(body(context)).toContain('effectif suffisant');expect(body(context)).toContain('petit échantillon');expect(body(context)).not.toContain('0 €/m²');
  });
  it('refuse des quartiles incohérents et une fausse source importée',()=>{
    const parsed=parseLocalObservation({...sample,source:'Source libre',sourceUrl:'https://example.test',houses:{n:84,median:2100,q1:2200,q3:2300}});
    expect(parsed?.houses).toBeNull();expect(parsed?.source).toBe('DVF · DGFiP / Etalab');
  });
  it.each(['empty','unavailable','address_unconfirmed'] as const)('garde une lecture autonome en état %s',status=>{
    let context=withLocalObservation(createContext('local'),{...sample,status,count:status==='empty'?0:null,houses:null,apartments:null});
    context=setAnswer(context,'local_intention','buyer',localDependencies);
    context=setAnswer(context,'local_focus','uses',localDependencies);
    const reading=buildLocalReading(context);
    expect(reading.sections.every(section=>section.items.length>0)).toBe(true);
    expect(reading.nextDecision.text).toContain('trajets');
    expect(reading.sections[0].items.every(item=>item.kind!=='data')).toBe(true);
    expect(body(context)).not.toContain('2 350');
  });
  it('adapte la conséquence à la question personnelle avant toute collecte',()=>{
    let context=withLocalObservation(createContext('local'),sample);
    context=setAnswer(context,'local_intention','buyer',localDependencies);
    context=setAnswer(context,'local_focus','budget',localDependencies);
    expect(buildLocalReading(context).nextDecision.text).toContain('coût complet');
    const changed=setAnswer(context,'local_intention','seller',localDependencies);
    expect(changed.answers.local_focus).toBeUndefined();
    expect(buildLocalReading(changed).nextDecision.text).toContain('caractéristiques du bien');
    expect(getLocalQuestions(changed)).toHaveLength(2);
    expect(getLocalQuestions(changed).every(question=>!/email|telephone|prenom|contact/.test(question.id))).toBe(true);
  });
  it('reprend l’usage acheteur et les réponses globales sans classification vendeur ni QR',()=>{
    let context=setAnswer(createContext('buyer'),'buyer_goal','quiet');
    context=setAnswer(context,'transition_interval','possible');
    context=withLocalObservation(context,sample);
    context=setAnswer(context,'local_intention','buyer',localDependencies);
    expect(context.answers.buyer_goal.value).toBe('quiet');expect(context.answers.transition_interval.value).toBe('possible');
    expect(context.answers.seller_situation).toBeUndefined();expect(context.entry.door).toBe('unknown');
    expect(body(context)).toContain('Votre priorité déjà exprimée');
    expect(localContinuation(context)).toEqual({project:'buyer',href:'/ma-recherche',label:'Mettre ma recherche au clair'});
  });
  it('une observation seule ne suppose aucune intention de vente',()=>{
    const context=withLocalObservation(createContext('local'),sample);
    expect(context.answers.local_intention).toBeUndefined();
    expect(localContinuation(context).project).toBeNull();
    expect(body(context)).not.toContain('Pour une vente,');
  });
  it('un changement d’adresse remplace les observations sans changer les réponses de projet',()=>{
    let context=withLocalObservation(createContext('local'),sample);
    context=setAnswer(context,'buyer_budget',250000);
    context=withLocalObservation(context,{...sample,label:'Chartres',radius:1500,count:400,houses:{n:150,median:2700,q1:2300,q3:3100}});
    expect(body(context)).toContain('Chartres');expect(body(context)).not.toContain('Rue de la République');
    expect(context.answers.buyer_budget.value).toBe(250000);
    expect(context.history?.length).toBe(0);
  });
});
