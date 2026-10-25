import {describe,it,expect} from 'vitest';
import {createContext,setAnswer,parseContext,parseReading,readContext,saveContext,contextForReading,textReading,entryFromUrl} from './context';
import {buyerJourney} from './buyer';
import {transitionJourney} from './transition';
import {exportReadingHTML} from './export';
describe('Contexte, versions et export public',()=>{
 it('conserve la déclaration et ses dépendances exactes dans la version antérieure',()=>{
  let c=createContext('buyer');c=setAnswer(c,'buyer_budget',240000);c=setAnswer(c,'buyer_surface',80);c.reading=buyerJourney.buildReading(c);
  const old=c.reading;c=setAnswer(c,'buyer_budget',200000,{buyer_budget:['buyer_surface']});
  expect(c.answers.buyer_surface).toBeUndefined();expect(c.reading).toBeUndefined();
  expect(c.history?.[0].id).toBe(old.id);expect(contextForReading(c,c.history![0]).answers.buyer_budget.value).toBe(240000);
 });
 it('changer de projet conserve les réponses utiles et la lecture historique attribuée',()=>{
  let raw='';const storage: Pick<Storage,'getItem'|'setItem'>={getItem:()=>raw,setItem:(_:string,v:string)=>{raw=v;}};
  let c=setAnswer(createContext('buyer'),'buyer_goal','quiet');c.reading=buyerJourney.buildReading(c);saveContext(c,storage);
  const next=readContext('transition',storage);expect(next.reading).toBeUndefined();expect(next.answers.buyer_goal.value).toBe('quiet');expect(next.history?.[0].projectSnapshot).toBe('buyer');
 });
 it('un refus de session est explicite et ne modifie pas la mémoire',()=>{const c=createContext('buyer');expect(saveContext(c,{setItem(){throw Error('denied');}} as unknown as Storage)).toBe(false);expect(c.answers).toEqual({});});
 it('refuse les clés de prototype, valeurs non finies et révisions négatives',()=>{
  const c=createContext('buyer');for(const answers of [JSON.parse('{"__proto__":{"value":"x"}}'),{buyer_budget:{value:Infinity,provenance:'declared',revision:1,updatedAt:c.updatedAt}},{buyer_budget:{value:1,provenance:'declared',revision:-1,updatedAt:c.updatedAt}}])expect(parseContext({...c,answers})).toBeNull();
 });
 it('ne laisse pas un snapshot de réponses invalide traverser le parseur',()=>{const r=buyerJourney.buildReading(createContext('buyer'));expect(parseReading({...r,answersSnapshot:{constructor:{value:1}}})).toBeNull();});
 it('préserve sans troncature une note humaine maximale et son fondement',()=>{
  const c=createContext('buyer');c.humanNotes=[{id:'note-test',text:'x'.repeat(10000),source:'y'.repeat(12003),author:'Mouaad Boullourou',createdAt:c.createdAt}];expect(parseContext(c)?.humanNotes).toEqual(c.humanNotes);
 });
 it('exporte dates et coûts de la version affichée, détails et inconnues compris',()=>{
  let c=createContext('transition');for(const[id,v]of Object.entries({transition_sale_date_status:'constraint',transition_sale_date:'2026-12-12',transition_costs_status:'partial',transition_cost_items:['moving'],transition_cost_moving:1234}))c=setAnswer(c,id,v);
  const r=transitionJourney.buildReading(c),html=exportReadingHTML(c,r),text=textReading(r);
  expect(text).toContain('2026-12-12');expect(html).toContain('2026-12-12');expect(text).toContain('1 234 €');
  expect(html).toContain('levois-context');expect(html).toContain('Non ajouté au sous-total');expect(html).toContain('Le périmètre de cette lecture');
 });
 it('la copie de synthèse comprend les apports humains affichés',()=>{const c=createContext('buyer');c.humanNotes=[{id:'note-test',text:'Le point a été repris avec vous.',source:'Votre échange, à confirmer.',author:'Mouaad Boullourou',createdAt:c.updatedAt}];const text=textReading(buyerJourney.buildReading(c),c);expect(text).toContain(c.humanNotes[0].text);expect(text).toContain(c.humanNotes[0].source);});
 it('échappe la lecture et les données sans script exécutable injecté',()=>{
  let c=setAnswer(createContext('buyer'),'buyer_sector','</script><img src=x onerror=alert(1)>');const r=buyerJourney.buildReading(c);const html=exportReadingHTML(c,r);
  expect(html).not.toContain('<img src=x');expect(html).toContain('\\u003c/script>');const data=html.match(/<script id="levois-context" type="application\/json">([\s\S]*?)<\/script>/)![1];expect(parseContext(JSON.parse(data))?.answers.buyer_sector.value).toBe(c.answers.buyer_sector.value);
 });
 it.each(['buyer','seller','transition'])('les portes froides du projet %s ne créent aucune coordonnée',project=>{
  for(const src of ['google','qr','video','recommandation']){const entry=entryFromUrl(new URL('https://levois.fr/experiences/surface-ou-usage?src='+src));const c=createContext(project as 'buyer',entry);expect(Object.keys(c.answers)).toHaveLength(0);expect(c.entry.door).toBe(src==='recommandation'?'recommendation':src);}
 });
 it('un paramètre seul ne donne pas un statut de contexte vérifié',()=>expect(entryFromUrl(new URL('https://levois.fr/ma-recherche?src=connu')).door).toBe('unknown'));
 it('ne déduit aucune source de la seule présence sur une micro-expérience',()=>{expect(entryFromUrl(new URL('https://levois.fr/experiences/visites-sans-offre')).door).toBe('unknown');expect(entryFromUrl(new URL('https://levois.fr/votre-rue')).door).toBe('unknown');expect(entryFromUrl(new URL('https://levois.fr/?src=mail-prive@example.com')).source).toBeNull();});
});
