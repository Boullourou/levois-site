import { describe, expect, it } from 'vitest';
import type { AnswerValue, Context, Reading } from './types';
import { buildBuyerReading, buyerJourney, buyerOptions, getBuyerQuestions } from './buyer';
import { buildTransitionReading, getTransitionQuestions, transitionCosts, transitionJourney, transitionOptions, transitionTimeline } from './transition';
import { buildBuyerProfileBridge, reviewBuyerProfileImport } from './buyer-profile';
import { CRITERION_KEYS } from '../cockpit/taxonomy';
import { isStrictHardCriterion } from '../cockpit/validation';

function context(values: Record<string, AnswerValue> = {}, changes: Partial<Context> = {}): Context {
  const updatedAt = '2026-09-10T12:00:00.000Z';
  return { schemaVersion: 1, id: 'test-context', revision: 1, project: 'buyer', depth: 'intermediate', entry: { door: 'direct', source: null, promise: null }, createdAt: updatedAt, updatedAt, answers: Object.fromEntries(Object.entries(values).map(([id, value]) => [id, { value, provenance: 'declared', revision: 1, updatedAt }])), ...changes };
}
const text = (reading: Reading) => [...reading.sections.flatMap(section => section.items.map(item => item.text)), reading.nextDecision.text, reading.nextDecision.why].join('\n');
const titles = ['Ce que l’achat doit changer', 'Ce qui paraît solide', 'Ce qui peut évoluer sous condition', 'Ce qui reste à décider ou vérifier'];
function correct(original: Context, id: string, value: AnswerValue): Context {
  return { ...original, revision: original.revision + 1, updatedAt: '2026-09-10T13:00:00.000Z', answers: { ...original.answers, [id]: { value, provenance: 'declared', revision: original.revision + 1, updatedAt: '2026-09-10T13:00:00.000Z' } } };
}

describe('acquéreur : valeur et sens avant coordonnées (AC02, AC04–07, AC20)', () => {
  it('garde les quatre titres exacts et une prochaine vérification dans une lecture vide', () => {
    const reading = buildBuyerReading(context());
    expect(reading.sections.map(section => section.title)).toEqual(titles);
    expect(reading.sections.every(section => section.items.length > 0)).toBe(true);
    expect(reading.nextDecision.text).toContain('quotidien');
    expect(reading.options).toEqual([]);
    expect(text(reading)).toContain('non renseigné');
  });
  it('conserve sept séquences, les usages avant les caractéristiques et une profondeur volontaire', () => {
    const short = getBuyerQuestions(context());
    const deep = getBuyerQuestions(context({}, { depth: 'deep' }));
    expect(buyerJourney.sequences).toHaveLength(7);
    expect(deep.findIndex(question => question.id === 'buyer_uses')).toBeLessThan(deep.findIndex(question => question.id === 'buyer_type'));
    expect(deep.findIndex(question => question.id === 'buyer_uses')).toBeLessThan(deep.findIndex(question => question.id === 'buyer_surface'));
    expect(short.some(question => question.id === 'buyer_surface')).toBe(false);
    expect(deep.some(question => question.id === 'buyer_surface')).toBe(true);
    expect(getBuyerQuestions(context({}, { depth: 'micro' }))).toHaveLength(2);
    expect(short.every(question => !/email|phone|nom|contact/i.test(question.id))).toBe(true);
  });
  it('ne déduit pas une flexibilité des critères manquants ou une typologie d’un usage', () => {
    const reading = buildBuyerReading(context({ buyer_goal: 'quiet', buyer_uses: ['work'], buyer_tension: 'none' }));
    expect(text(reading)).toContain('Le type de logement reste non renseigné');
    expect(text(reading)).toContain('Aucune ouverture sous condition');
    expect(text(reading)).not.toMatch(/une maison (est|serait) nécessaire|vous êtes flexible|vous acceptez moins/i);
    expect(reading.options).toEqual([]);
  });
  it('reste utile sans budget ni donnée DVF et n’invente aucune position de marché', () => {
    const reading = buildBuyerReading(context({ buyer_goal: 'journeys', buyer_uses: ['transport'], buyer_sector: 'Lèves', buyer_budget_status: 'unknown' }));
    expect(text(reading)).toContain('Lèves');
    expect(text(reading)).toContain('enveloppe n’est pas renseignée');
    expect(reading.nextDecision.text).toContain('ressources');
    expect(text(reading)).not.toMatch(/quartile|0 €|bien disponible à/i);
    expect(reading.limits.join(' ')).toContain('ventes passées');
  });
  it('ne fabrique une comparaison que pour une tension exprimée et ne la confond pas avec une concession', () => {
    expect(buyerOptions(context())).toHaveLength(0);
    expect(buyerOptions(context({ buyer_tension: 'unknown' }))).toHaveLength(0);
    expect(buyerOptions(context({ buyer_tension: 'none' }))).toHaveLength(0);
    const c = context({ buyer_tension: 'layout_space', buyer_option: 'test_layout', buyer_surface: 85 });
    expect(buyerOptions(c)).toHaveLength(3);
    expect(text(buildBuyerReading(c))).toContain('85 m²');
    expect(text(buildBuyerReading(c))).toContain('ne change aucun critère');
    expect(buyerOptions(c).every(option => option.condition && option.limit)).toBe(true);
  });
  it('garde priorités, préférences, ouvertures et exclusions dans des catégories distinctes', () => {
    const c = context({ buyer_goal: 'quiet', buyer_type: 'house', buyer_opening: 'conditional', buyer_opening_target: 'surface', buyer_opening_condition: 'Une pièce vraiment isolable', buyer_exclusions: ['heavy_works'] });
    const reading = buildBuyerReading(c);
    expect(text(reading)).toContain('Votre priorité');
    expect(text(reading)).toContain('Préférence déclarée');
    expect(text(reading)).toContain('Ouverture déclarée');
    expect(text(reading)).toContain('Exclusions déclarées');
    const profile = buildBuyerProfileBridge(c);
    expect(profile.criteria.map(criterion => criterion.meaning)).toEqual(expect.arrayContaining(['priority', 'preference', 'conditional_opening', 'declared_exclusion']));
    expect(profile.criteria.find(criterion => criterion.meaning === 'conditional_opening')?.condition).toBe('Une pièce vraiment isolable');
  });
  it('une condition non renseignée ne crée pas une ouverture', () => {
    const c = context({ buyer_opening: 'conditional', buyer_opening_target: 'surface' });
    expect(text(buildBuyerReading(c))).toContain('sa condition reste à préciser');
    expect(buildBuyerProfileBridge(c).criteria.some(criterion => criterion.meaning === 'conditional_opening')).toBe(false);
  });
  it('retire les enfants périmés après correction de budget ou de tension, même sans navigation dans les étapes', () => {
    const original = context({ buyer_goal: 'space', buyer_budget_status: 'checked', buyer_budget: 250000, buyer_financing: 'checked', buyer_costs_status: 'included', buyer_tension: 'budget_sector', buyer_option: 'protect_sector' });
    const changed = correct(original, 'buyer_budget', 180000);
    const reading = buildBuyerReading(changed);
    expect(text(reading)).toContain('180');
    expect(text(reading)).not.toContain('250');
    expect(text(reading)).toContain('niveau de vérification des ressources n’est pas renseigné');
    expect(text(reading)).not.toContain('Piste que vous voulez examiner');
    const unknownBudget = correct(original, 'buyer_budget_status', 'unknown');
    expect(text(buildBuyerReading(unknownBudget))).not.toContain('250');
    expect(getBuyerQuestions(unknownBudget).some(question => question.id === 'buyer_budget')).toBe(false);
    expect(buyerOptions(correct(original, 'buyer_tension', 'none'))).toEqual([]);
    expect(original.answers.buyer_budget.value).toBe(250000);
  });
  it('conserve les déclarations d’usage et recalcule une comparaison après correction du secteur ou de la surface', () => {
    const original = context({ buyer_uses: ['work'], buyer_sector: 'Lèves', buyer_surface: 80, buyer_tension: 'layout_space', buyer_option: 'keep_surface' });
    const changed = correct(correct(original, 'buyer_sector', 'Mainvilliers'), 'buyer_surface', 65);
    const reading = buildBuyerReading(changed);
    expect(text(reading)).toContain('Mainvilliers');
    expect(text(reading)).toContain('65 m²');
    expect(text(reading)).toContain('M’isoler pour travailler');
    expect(text(reading)).not.toContain('Lèves');
    expect(text(reading)).not.toContain('80 m²');
    expect(text(reading)).not.toContain('Piste que vous voulez examiner');
  });
  it('ne transforme pas un avancement en expérience ou financement confirmé', () => {
    const reading = buildBuyerReading(context({ buyer_stage: 'committed', buyer_budget_status: 'estimated', buyer_budget: 220000 }));
    expect(reading.nextDecision.text).toContain('conditions et dates');
    expect(text(reading)).toContain('niveau de vérification des ressources n’est pas renseigné');
    expect(text(reading)).not.toMatch(/vous êtes (expérimenté|financé)|financement (est validé|acquis)/i);
  });
  it('oriente hors résidence principale sans produire la lecture personnelle inadaptée', () => {
    const c = context({ buyer_purpose: 'investment', buyer_goal: 'quiet', buyer_uses: ['work'] });
    expect(getBuyerQuestions(c).map(question => question.id)).toEqual(['buyer_stage', 'buyer_purpose']);
    expect(text(buildBuyerReading(c))).toContain('étude adaptée');
    expect(text(buildBuyerReading(c))).not.toContain('Votre priorité');
    expect(buildBuyerProfileBridge(c).criteria).toEqual([]);
  });
  it('attribue chaque item et chaque option, et garde la même sémantique anonyme ou connue', () => {
    const c = context({ buyer_goal: 'quiet', buyer_tension: 'layout_space', buyer_uses: ['work'], buyer_budget_status: 'unknown' });
    const cold = buildBuyerReading(c);
    const warm = buildBuyerReading({ ...c, entry: { door: 'known', source: null, promise: null }, depth: 'deep' });
    expect(warm.sections).toEqual(cold.sections);
    expect(warm.nextDecision).toEqual(cold.nextDecision);
    for (const item of cold.sections.flatMap(section => section.items)) {
      expect(item.sourceAnswerIds).toBeDefined();
      expect(item).toHaveProperty('author');
      expect(item).toHaveProperty('provenance');
      for (const id of item.sourceAnswerIds!) expect(c.answers[id]).toBeDefined();
    }
    expect(cold.options?.every(option => 'sourceAnswerIds' in option && 'provenance' in option)).toBe(true);
  });
});

describe('transition : dépendances, dates et scénarios (AC14–16)', () => {
  it('garde huit séquences et reprend les IDs achat et vente sans deux questionnaires', () => {
    const questions = getTransitionQuestions(context({}, { project: 'transition' }));
    expect(transitionJourney.sequences).toHaveLength(8);
    expect(questions.map(question => question.id)).toEqual(expect.arrayContaining(['buyer_goal', 'buyer_stage', 'seller_situation', 'buyer_prior_sale', 'buyer_horizon']));
    expect(new Set(questions.map(question => question.id)).size).toBe(questions.length);
    expect(getTransitionQuestions(context({}, { depth: 'micro' }))).toHaveLength(2);
  });
  it('produit une vérification précise quand aucun scénario n’est vérifié', () => {
    const reading = buildTransitionReading(context());
    expect(reading.nextDecision.text).toContain('produit net');
    expect(text(reading)).toContain('Aucune solution de repli');
    expect(reading.options).toEqual([]);
    expect(reading.timeline.every(date => date.date === null)).toBe(true);
    expect(text(reading)).not.toMatch(/scénario est (possible|faisable)|financement acquis|0 €/i);
  });
  it('distingue souhait, contrainte, engagement et disponibilité des fonds', () => {
    const c = context({ buyer_prior_sale: 'yes', transition_sale_date_status: 'wished', transition_sale_date: '2027-01-10', buyer_horizon: 'engaged', buyer_date: '2026-12-20', transition_resources_status: 'estimated' });
    const dates = transitionTimeline(c);
    expect(dates[0]).toMatchObject({ date: '2027-01-10', status: 'wished' });
    expect(dates[1]).toMatchObject({ date: null, status: 'unknown' });
    expect(dates[2]).toMatchObject({ date: '2026-12-20', status: 'engaged' });
    expect(text(buildTransitionReading(c))).toContain('un cumul ou une ressource intermédiaire serait à examiner');
    expect(text(buildTransitionReading(c))).not.toContain('21 jours');
  });
  it('ne déduit pas la coordination de dates égales', () => {
    const c = context({ transition_sale_date_status: 'engaged', transition_sale_date: '2027-01-10', buyer_horizon: 'engaged', buyer_date: '2027-01-10' });
    expect(text(buildTransitionReading(c))).toContain('égalité ne prouve pas');
  });
  it('ne confond pas ressources déclarées confirmées et justificatifs vérifiés', () => {
    const c = context({ buyer_prior_sale: 'yes', transition_resources_status: 'confirmed', transition_resources: 175000, transition_funds_date: '2027-03-10' });
    expect(text(buildTransitionReading(c))).toContain('site n’a pas vérifié de justificatif');
    expect(buildTransitionReading(c).sections.flatMap(section => section.items).every(item => item.kind !== 'verified')).toBe(true);
  });
  it('compare trois pistes conditionnelles et protège une absence de cumul ou de logement temporaire', () => {
    const c = context({ buyer_prior_sale: 'yes', transition_interval: 'none', transition_overlap: 'no' });
    const options = transitionOptions(c);
    expect(options).toHaveLength(3);
    expect(options.find(option => option.id === 'sell_first')?.condition).toContain('pas de solution temporaire acceptable');
    expect(options.find(option => option.id === 'buy_first')?.condition).toContain('ne pas pouvoir supporter un cumul');
    expect(options.every(option => option.condition.length > 0 && option.limit.length > 0)).toBe(true);
  });
  it('additionne seulement les postes ponctuels déclarés, garde les mensuels séparés et le zéro explicite', () => {
    const c = context({ transition_costs_status: 'partial', transition_cost_items: ['moving', 'storage', 'interval', 'overlap'], transition_cost_moving: 1500, transition_cost_storage: 0, transition_interval: 'possible', transition_cost_interval: 700, transition_overlap: 'estimated', transition_cost_overlap: 1200 });
    const costs = transitionCosts(c);
    expect(costs.knownOneOffSubtotal).toBe(1500);
    expect(costs.items.find(item => item.id === 'transition_cost_storage')?.amount).toBe(0);
    expect(costs.items.find(item => item.id === 'transition_cost_works')?.amount).toBeNull();
    expect(costs.items.find(item => item.id === 'transition_cost_interval')).toMatchObject({ unit: 'month', amount: 700 });
    expect(costs.complete).toBe(false);
    expect(transitionCosts(context()).knownOneOffSubtotal).toBeNull();
  });
  it('retire les dates et coûts devenus inapplicables après correction', () => {
    const c = context({ transition_sale_date_status: 'wished', transition_sale_date: '2027-01-10', transition_interval: 'possible', transition_costs_status: 'partial', transition_cost_items: ['interval'], transition_cost_interval: 700, transition_interval_months: 3, transition_scenario: 'sell_first' });
    expect(transitionTimeline(correct(c, 'transition_sale_date_status', 'none'))[0].date).toBeNull();
    const changed = correct(c, 'transition_interval', 'none');
    expect(transitionCosts(changed).items.find(item => item.id === 'transition_cost_interval')?.amount).toBeNull();
    expect(text(buildTransitionReading(changed))).not.toContain('3 mois');
    expect(text(buildTransitionReading(changed))).not.toContain('700');
    expect(text(buildTransitionReading(changed))).toContain('Aucun scénario n’est choisi');
  });
  it('retient une attente motivée et sa condition de réexamen sans relance', () => {
    const c = context({ buyer_prior_sale: 'unknown', transition_scenario: 'wait', transition_reexamine: 'La confirmation du montant net', transition_fallback: 'none' });
    const reading = buildTransitionReading(c);
    expect(reading.nextDecision.text).toContain('La confirmation du montant net');
    expect(reading.nextDecision.why).toContain('sans engagement ni relance');
    expect(text(reading)).toContain('Aucune solution de repli');
  });
});

describe('pont sémantique vers les critères réels du cockpit (AC31)', () => {
  it('emploie la taxonomie réelle sans créer un critère bloquant, un financement ou une identité', () => {
    const c = context({ buyer_stage: 'found', buyer_uses: ['work'], buyer_goal: 'quiet', buyer_exclusions: ['heavy_works'] });
    c.answers.buyer_exclusions.provenance = 'confirmed';
    const profile = buildBuyerProfileBridge(c);
    expect(profile.criteria.every(criterion => CRITERION_KEYS.includes(criterion.key))).toBe(true);
    expect(profile.criteria.every(criterion => !isStrictHardCriterion(criterion))).toBe(true);
    expect(profile.criteria.find(criterion => criterion.meaning === 'declared_exclusion')).toMatchObject({ certainty: 'confirmed', flexibility: 'none', matchingRole: 'unknown', hardValidated: false });
    expect(profile.criteria.some(criterion => criterion.key === 'financing')).toBe(false);
    expect(profile.stage).toBeNull();
    expect(profile.projectType).toBeNull();
    expect(profile.permissions).toEqual({ writesCockpit: false, automaticMatching: false, identifiesPerson: false, grantsContact: false });
  });
  it('un profil vide laisse tous les critères non renseignés', () => {
    const profile = buildBuyerProfileBridge(context());
    expect(profile.criteria).toEqual([]);
    expect(profile.unknownCriterionKeys).toEqual(CRITERION_KEYS);
  });
  it('donne le même profil sémantique pour le même contexte anonyme ou connu', () => {
    const c = context({ buyer_purpose: 'primary', buyer_stage: 'searching', buyer_uses: ['work'], buyer_type: 'apartment' });
    expect(buildBuyerProfileBridge({ ...c, entry: { door: 'known', source: 'reprise', promise: null } })).toEqual(buildBuyerProfileBridge(c));
  });
  it('préserve la provenance et présente un conflit sans jamais fusionner ou écrire les réponses', () => {
    const source = context({ buyer_budget_status: 'estimated', buyer_budget: 250000 });
    source.answers.buyer_budget.provenance = 'confirmed';
    const profile = buildBuyerProfileBridge(source);
    const destination = context({ buyer_budget: 180000 });
    const before = structuredClone(destination);
    const review = reviewBuyerProfileImport(destination, profile);
    expect(review.find(item => item.answerId === 'buyer_budget')).toMatchObject({ status: 'conflict', current: { value: 180000 }, proposed: { value: 250000, provenance: 'confirmed' } });
    expect(destination).toEqual(before);
    expect(profile.criteria.find(criterion => criterion.key === 'budget')?.provenance).toEqual(expect.arrayContaining([expect.objectContaining({ answerId: 'buyer_budget', mode: 'confirmed' })]));
  });
});
