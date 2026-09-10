import { expect, it } from 'vitest';
import { createContext, setAnswer, confirmImported } from './context';
import { buildBuyerReading } from './buyer';
import { buildBuyerProfileBridge } from './buyer-profile';
import { transitionTimeline } from './transition';

it('une confirmation sans changement de valeur ne périme pas les précisions importées',()=>{
  let context=setAnswer(createContext('buyer'),'buyer_budget_status','estimated');
  context=setAnswer(context,'buyer_budget',225000);
  context.answers.buyer_budget_status.provenance='imported';
  context.answers.buyer_budget.provenance='imported';
  context=confirmImported(context,['buyer_budget_status']);
  const reading=buildBuyerReading(context);
  expect(reading.sections.flatMap(section=>section.items).some(item=>item.text.includes('225'))).toBe(true);
});
it('une date invalide ne produit pas de chronologie entre vente et achat',()=>{
  let context=setAnswer(createContext('transition'),'transition_sale_date_status','engaged');
  context=setAnswer(context,'transition_sale_date','2027-02-31');
  context=setAnswer(context,'buyer_horizon','engaged');
  context=setAnswer(context,'buyer_date','incorrect');
  expect(transitionTimeline(context).every(date=>date.date===null)).toBe(true);
});
it('un financement inconnu reste non renseigné dans la taxonomie du profil',()=>{
  let context=setAnswer(createContext('buyer'),'buyer_budget_status','estimated');
  context=setAnswer(context,'buyer_budget',225000);
  context=setAnswer(context,'buyer_financing','unknown');
  const profile=buildBuyerProfileBridge(context);
  expect(profile.criteria.some(criterion=>criterion.key==='financing')).toBe(false);
  expect(profile.unknownCriterionKeys).toContain('financing');
});
