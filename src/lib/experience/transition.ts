import { list, number, str, type ComparisonOption, type Context, type Impact, type Journey, type Question, type Reading, type ReadingItem } from './types';
import { buyerDependencies, buyerLabel, buyerLabels, currentDomainContext, domainEvidence, domainItem, domainOption, formatEuros, type DomainEvidence } from './buyer';

export const TRANSITION_METHOD_VERSION = 'transition-2026-09-10.1';
export const TRANSITION_SEQUENCES = ['Le changement', 'Ce qui dépend de la vente', 'Les dates', 'L’intervalle entre logements', 'Les coûts et le cumul', 'Les scénarios', 'Le repli', 'Votre lecture'];
const unknown = { value: 'unknown', label: 'Je ne sais pas encore' };
const labels: Record<string, Record<string, string>> = {
  buyer_goal: buyerLabels.buyer_goal,
  buyer_stage: buyerLabels.buyer_stage,
  buyer_prior_sale: buyerLabels.buyer_prior_sale,
  buyer_horizon: buyerLabels.buyer_horizon,
  seller_situation: { reflexion: 'Je réfléchis avant de vendre', preparer: 'Je prépare la vente', publiee: 'Le bien est publié', 'peu-contacts': 'J’ai peu de contacts', visites: 'J’ai des visites', longtemps: 'La vente dure', offre: 'J’ai reçu une offre', incident: 'Un engagement a été interrompu' },
  transition_resources_status: { estimated: 'Les ressources sont estimées', confirmed: 'Je déclare un montant et une disponibilité confirmés', unknown: 'Le montant ou sa disponibilité reste inconnu' },
  transition_sale_date_status: { wished: 'Une date souhaitée', constraint: 'Une contrainte réelle à respecter', engaged: 'Une date dans un engagement', none: 'Pas de date cible pour le moment' },
  transition_interval: { confirmed: 'J’ai une solution temporaire confirmée selon moi', possible: 'Une solution est envisageable, à confirmer', none: 'Je n’ai pas de solution temporaire acceptable' },
  transition_overlap: { checked: 'J’ai fait vérifier les ressources pour un cumul', estimated: 'J’ai une estimation, à vérifier', no: 'Je déclare ne pas pouvoir supporter un cumul' },
  transition_costs_status: { known: 'J’ai chiffré les postes qui me concernent', partial: 'J’en ai chiffré une partie', unknown: 'Ils restent à chiffrer' },
  transition_cost_items: { moving: 'Déménagement', storage: 'Stockage', works: 'Travaux du prochain logement', interval: 'Logement temporaire', overlap: 'Charges simultanées de deux logements' },
  transition_scenario: { sell_first: 'Examiner la vente avant l’achat', buy_first: 'Examiner l’achat avant la vente', coordinate: 'Examiner une coordination des deux', wait: 'Attendre une vérification avant de choisir', undecided: 'Je ne choisis pas encore' },
  transition_change_trigger: { sale_delay: 'La vente prend du retard', purchase_delay: 'L’achat prend du retard', lower_resources: 'Les ressources disponibles sont différentes', interval_unavailable: 'La solution temporaire devient impossible', date_changed: 'Une date ou une condition d’engagement change', disagreement: 'Les personnes concernées ne partagent plus le choix' },
  transition_fallback: { temporary: 'Confirmer une autre solution temporaire', postpone: 'Reporter le prochain engagement si cela reste possible', reformulate: 'Revoir le logement recherché ou l’ordre des opérations', none: 'Je n’ai pas de solution de repli identifiée' },
};
const label = (id: string, code: string) => labels[id]?.[code] ?? (code === 'unknown' ? 'Non renseigné' : code);
const known = (context: Context, id: string) => !!str(context, id) && str(context, id) !== 'unknown';
const q = (id: string, sequence: number, title: string, extra: Partial<Question> = {}): Question => ({ id, sequence, sequenceTitle: TRANSITION_SEQUENCES[sequence - 1], title, type: 'choice', choices: [...Object.entries(labels[id] ?? {}).map(([value, label]) => ({ value, label })), ...(labels[id]?.unknown ? [] : [unknown])], ...extra });

export const transitionDependencies: Record<string, string[]> = {
  ...buyerDependencies,
  buyer_prior_sale: ['transition_resources_status', 'transition_resources', 'transition_funds_date', 'transition_scenario'],
  transition_resources_status: ['transition_resources', 'transition_funds_date', 'transition_scenario'],
  transition_resources: ['transition_scenario'],
  transition_funds_date: ['transition_scenario'],
  transition_sale_date_status: ['transition_sale_date', 'transition_scenario'],
  transition_sale_date: ['transition_scenario'],
  buyer_horizon: [...buyerDependencies.buyer_horizon, 'transition_scenario'],
  buyer_date: ['transition_scenario'],
  transition_interval: ['transition_interval_solution', 'transition_interval_months', 'transition_interval_condition', 'transition_cost_interval', 'transition_scenario', 'transition_fallback'],
  transition_interval_months: ['transition_scenario'],
  transition_overlap: ['transition_overlap_months', 'transition_cost_overlap', 'transition_scenario'],
  transition_overlap_months: ['transition_scenario'],
  transition_costs_status: ['transition_cost_items', 'transition_cost_moving', 'transition_cost_storage', 'transition_cost_works', 'transition_cost_interval', 'transition_cost_overlap', 'transition_scenario'],
  transition_cost_items: ['transition_cost_moving', 'transition_cost_storage', 'transition_cost_works', 'transition_cost_interval', 'transition_cost_overlap', 'transition_scenario'],
  transition_scenario: ['transition_change_trigger', 'transition_fallback', 'transition_reexamine'],
  transition_fallback: ['transition_fallback_detail'],
};
const current = (context: Context) => currentDomainContext(context, transitionDependencies);

export interface TransitionDate extends DomainEvidence {
  project: 'sale' | 'purchase' | 'funds';
  label: string;
  date: string | null;
  status: 'wished' | 'constraint' | 'engaged' | 'declared' | 'unknown';
  statusLabel: string;
}
export function transitionTimeline(raw: Context): TransitionDate[] {
  const context = current(raw);
  const sale = str(context, 'transition_sale_date_status');
  const horizon = str(context, 'buyer_horizon');
  const saleStatus = ['wished', 'constraint', 'engaged'].includes(sale) ? sale as 'wished' | 'constraint' | 'engaged' : 'unknown';
  const buyStatus = horizon === 'engaged' ? 'engaged' : horizon === 'constraint' ? 'constraint' : ['year', 'months'].includes(horizon) ? 'wished' : 'unknown';
  const statusLabel = { wished: 'Souhait déclaré', constraint: 'Contrainte déclarée', engaged: 'Engagement déclaré, portée à vérifier', declared: 'Disponibilité déclarée', unknown: 'Non renseigné' };
  const resourcesKnown = ['estimated', 'confirmed'].includes(str(context, 'transition_resources_status'));
  return [
    { project: 'sale', label: 'Vente', date: saleStatus !== 'unknown' ? str(context, 'transition_sale_date') || null : null, status: saleStatus, statusLabel: statusLabel[saleStatus], ...domainEvidence(context, ['transition_sale_date_status', 'transition_sale_date']) },
    { project: 'funds', label: 'Fonds mobilisables', date: resourcesKnown ? str(context, 'transition_funds_date') || null : null, status: resourcesKnown && known(context, 'transition_funds_date') ? 'declared' : 'unknown', statusLabel: resourcesKnown && known(context, 'transition_funds_date') ? 'Date de disponibilité déclarée, à vérifier' : 'Disponibilité non renseignée', ...domainEvidence(context, ['buyer_prior_sale', 'transition_resources_status', 'transition_funds_date']) },
    { project: 'purchase', label: 'Achat / prochain logement', date: buyStatus !== 'unknown' ? str(context, 'buyer_date') || null : null, status: buyStatus, statusLabel: statusLabel[buyStatus], ...domainEvidence(context, ['buyer_horizon', 'buyer_date']) },
  ];
}

export interface TransitionCost extends DomainEvidence { id: string; label: string; amount: number | null; unit: 'total' | 'month'; condition: string }
export function transitionCosts(raw: Context): { items: TransitionCost[]; knownOneOffSubtotal: number | null; complete: false; label: string } {
  const context = current(raw);
  const costStatusKnown = ['known', 'partial'].includes(str(context, 'transition_costs_status'));
  const selected = list(context, 'transition_cost_items');
  const definitions = [
    ['moving', 'Déménagement', 'total'], ['storage', 'Stockage', 'total'], ['works', 'Travaux', 'total'], ['interval', 'Logement temporaire', 'month'], ['overlap', 'Charges simultanées', 'month'],
  ] as const;
  const items: TransitionCost[] = definitions.map(([key, text, unit]) => {
    const id = `transition_cost_${key}`;
    const eligible = costStatusKnown && selected.includes(key) && (key !== 'interval' || ['confirmed', 'possible'].includes(str(context, 'transition_interval'))) && (key !== 'overlap' || ['checked', 'estimated'].includes(str(context, 'transition_overlap')));
    const amount = eligible ? number(context, id) : undefined;
    return { id, label: text, amount: amount !== undefined && amount >= 0 ? amount : null, unit, condition: unit === 'month' ? 'Montant mensuel déclaré ; durée et périmètre à vérifier. Non ajouté au sous-total des dépenses ponctuelles.' : 'Montant total du poste déclaré ; périmètre et justificatif à vérifier.', ...domainEvidence(context, ['transition_costs_status', 'transition_cost_items', id, ...(key === 'interval' ? ['transition_interval'] : key === 'overlap' ? ['transition_overlap'] : [])]) };
  });
  const oneOff = items.filter(item => item.unit === 'total' && item.amount !== null);
  return { items, knownOneOffSubtotal: oneOff.length ? oneOff.reduce((total, item) => total + item.amount!, 0) : null, complete: false, label: 'Sous-total des seuls postes ponctuels renseignés, hors montants mensuels et autres dépenses non renseignées' };
}

export function transitionOptions(raw: Context): (ComparisonOption & DomainEvidence)[] {
  const context = current(raw);
  if (!['buyer_prior_sale', 'seller_situation', 'buyer_stage', 'transition_scenario'].some(id => known(context, id))) return [];
  const dependent = str(context, 'buyer_prior_sale') === 'yes';
  const noInterval = str(context, 'transition_interval') === 'none';
  const noOverlap = str(context, 'transition_overlap') === 'no';
  return [
    domainOption(context, { id: 'sell_first', title: 'Vendre puis acheter', consequence: 'Établir davantage le résultat de vente avant le prochain achat. Un intervalle entre logements peut être nécessaire.', condition: `${noInterval ? 'Vous n’avez pas de solution temporaire acceptable : ce point doit être résolu avant de retenir cette piste. ' : 'Confirmer la solution temporaire, sa durée et ses coûts. '}Vérifier le produit net et sa date réelle de disponibilité.`, limit: 'Une vente engagée ne garantit ni le montant mobilisable ni le prochain logement.' }, ['buyer_prior_sale', 'transition_resources_status', 'transition_resources', 'transition_interval', 'transition_interval_months']),
    domainOption(context, { id: 'buy_first', title: 'Acheter puis vendre', consequence: 'Chercher à sécuriser le prochain logement avant la vente, avec un cumul possible de charges et d’engagements.', condition: `${noOverlap ? 'Vous déclarez ne pas pouvoir supporter un cumul : cette limite doit être prise en compte avant tout engagement. ' : ''}${dependent ? 'L’achat dépend de la vente selon vous : des ressources mobilisables avant la vente doivent être examinées avec un professionnel compétent. ' : ''}Faire vérifier ressources, coût et résistance à un retard de vente.`, limit: 'Cette piste n’est jamais déclarée financée ou faisable par le site.' }, ['buyer_prior_sale', 'transition_resources_status', 'transition_overlap', 'transition_overlap_months']),
    domainOption(context, { id: 'coordinate', title: 'Coordonner les deux engagements', consequence: 'Chercher à rapprocher les passages entre logements ; les deux calendriers deviennent interdépendants.', condition: 'Faire vérifier les dates, les conditions et les possibilités des parties, puis prévoir un repli si une opération est décalée.', limit: 'Deux dates souhaitées proches ne prouvent pas la compatibilité des engagements.' }, ['transition_sale_date_status', 'transition_sale_date', 'buyer_horizon', 'buyer_date', 'transition_fallback']),
  ];
}

export function getTransitionQuestions(raw: Context): Question[] {
  const context = current(raw);
  const deep = context.depth === 'deep';
  const questions = [
    q('buyer_goal', 1, 'Qu’est-ce que le prochain logement doit changer en premier ?'),
    q('seller_situation', 1, 'Où en est votre vente ?'),
    q('buyer_stage', 1, 'Et où en est votre achat ?'),
    q('buyer_prior_sale', 2, 'L’achat nécessite-t-il le produit de la vente ?', { help: 'Oui, non ou à vérifier : le lien est nommé, sans présumer son financement.' }),
    q('transition_resources_status', 2, 'Que savez-vous des ressources mobilisables pour l’achat ?', { help: 'Un prix de vente espéré et un montant réellement disponible sont deux informations différentes.' }),
  ];
  if (deep && ['estimated', 'confirmed'].includes(str(context, 'transition_resources_status'))) questions.push(q('transition_resources', 2, str(context, 'buyer_prior_sale') === 'yes' ? 'Quel montant net de la vente serait mobilisable ?' : 'Quel montant de ressources serait mobilisable ?', { type: 'number', min: 0, max: 100000000, suffix: '€', optional: true, help: 'Le montant net est celui que vous fournissez, après les dépenses qui vous concernent. Aucun prix ou remboursement n’est calculé par le site.' }), q('transition_funds_date', 2, 'À quelle date ces fonds seraient-ils disponibles ?', { type: 'date', optional: true, help: 'La date reste votre déclaration. Une date de vente n’est pas automatiquement une date de fonds disponibles.' }));
  questions.push(q('transition_sale_date_status', 3, 'Quel est le statut du calendrier de vente ?'));
  if (['wished', 'constraint', 'engaged'].includes(str(context, 'transition_sale_date_status'))) questions.push(q('transition_sale_date', 3, 'Quelle date concerne la vente ?', { type: 'date', optional: true, help: 'La frise conservera son statut : souhait, contrainte ou engagement déclaré.' }));
  questions.push(q('buyer_horizon', 3, 'Quel est le calendrier de votre achat ?'));
  if (['constraint', 'engaged'].includes(str(context, 'buyer_horizon')) || deep && ['year', 'months'].includes(str(context, 'buyer_horizon'))) questions.push(q('buyer_date', 3, 'Quelle date concerne le prochain logement ?', { type: 'date', optional: true, help: 'Une date souhaitée ne devient jamais un engagement. La portée d’un engagement relève des documents réels.' }));
  questions.push(q('transition_interval', 4, 'Pourriez-vous vivre temporairement ailleurs entre les deux logements ?'));
  if (deep && ['confirmed', 'possible'].includes(str(context, 'transition_interval'))) questions.push(q('transition_interval_solution', 4, 'Quelle solution temporaire envisagez-vous ?', { type: 'text', optional: true, maxLength: 400, placeholder: 'Location, hébergement, autre possibilité…', help: 'Aucun nom ou coordonnée d’un proche n’est nécessaire.' }), q('transition_interval_months', 4, 'Quelle durée serait acceptable pour cette solution ?', { type: 'number', min: 0.5, max: 60, suffix: 'mois', optional: true }), q('transition_interval_condition', 4, 'Quelles conditions de vie faut-il préserver pendant cet intervalle ?', { type: 'text', optional: true, maxLength: 500, placeholder: 'Accès, trajets, durée, accord à confirmer…' }));
  questions.push(q('transition_overlap', 5, 'Où en êtes-vous de la possibilité de supporter deux logements en même temps ?', { help: 'Le site ne simule ni crédit relais ni capacité bancaire. Même une vérification déclarée doit porter sur le scénario réel.' }), q('transition_costs_status', 5, 'Avez-vous chiffré les dépenses de transition ?'));
  if (deep && ['checked', 'estimated'].includes(str(context, 'transition_overlap'))) questions.push(q('transition_overlap_months', 5, 'Sur quelle durée le cumul a-t-il été envisagé ?', { type: 'number', min: 0.5, max: 60, suffix: 'mois', optional: true, help: 'Cette durée ne prédit pas la durée de vente.' }));
  if (deep && ['known', 'partial'].includes(str(context, 'transition_costs_status'))) {
    const availableCosts = Object.entries(labels.transition_cost_items).filter(([id]) => (id !== 'interval' || ['confirmed', 'possible'].includes(str(context, 'transition_interval'))) && (id !== 'overlap' || ['checked', 'estimated'].includes(str(context, 'transition_overlap'))));
    questions.push(q('transition_cost_items', 5, 'Quels postes avez-vous déjà chiffrés ?', { type: 'multiple', maxChoices: 5, choices: [...availableCosts.map(([value, label]) => ({ value, label })), unknown], help: 'Un poste absent reste non renseigné. Un zéro n’est retenu que si vous le saisissez.' }));
    for (const [id, title] of availableCosts) if (list(context, 'transition_cost_items').includes(id)) questions.push(q(`transition_cost_${id}`, 5, `Quel montant avez-vous pour ${title.toLowerCase()} ?`, { type: 'number', min: 0, max: 10000000, suffix: ['interval', 'overlap'].includes(id) ? '€ par mois' : '€ pour ce poste au total', optional: true, help: ['interval', 'overlap'].includes(id) ? 'Un montant mensuel reste séparé des dépenses ponctuelles. Vérifiez que les postes ne se recouvrent pas.' : 'Saisissez le total de ce poste uniquement. Ne comptez pas deux fois une dépense dans plusieurs postes.' }));
  }
  questions.push(q('transition_scenario', 6, 'Quelle piste souhaitez-vous examiner ?', { help: 'Toutes restent conditionnelles. Vous pouvez attendre ou ne pas choisir.' }));
  if (known(context, 'transition_scenario')) questions.push(q('transition_change_trigger', 7, 'Qu’est-ce qui ferait changer votre choix ?', { type: 'multiple', maxChoices: 3, help: 'Ce sont des conditions de réexamen, pas des événements que nous annonçons.' }), q('transition_fallback', 7, 'Quel repli serait à examiner en cas de décalage ?', { help: 'Un repli envisagé reste à confirmer. Vous pouvez dire qu’il n’est pas encore identifié.' }));
  if (deep && known(context, 'transition_fallback') && str(context, 'transition_fallback') !== 'none') questions.push(q('transition_fallback_detail', 7, 'Que faudrait-il confirmer pour ce repli ?', { type: 'text', maxLength: 500, optional: true }));
  if (str(context, 'transition_scenario') === 'wait' || deep) questions.push(q('transition_reexamine', 7, 'Quel fait vous permettra de reprendre la décision ?', { type: 'text', optional: true, maxLength: 500, placeholder: 'Un montant confirmé, une date, un accord…', help: 'Attendre ne déclenche aucune relance automatique.' }));
  return context.depth === 'micro' ? [questions[0], questions[3]] : questions;
}

export function buildTransitionReading(raw: Context): Reading & { timeline: TransitionDate[]; costs: ReturnType<typeof transitionCosts> } {
  const context = current(raw);
  const item = (text: string, kind: ReadingItem['kind'], ids: string[] = [], condition?: string) => domainItem(context, text, kind, ids, condition);
  const change: ReadingItem[] = [], solid: ReadingItem[] = [], conditions: ReadingItem[] = [], open: ReadingItem[] = [];
  if (known(context, 'buyer_goal')) change.push(item(`Le changement recherché : ${buyerLabel('buyer_goal', str(context, 'buyer_goal'))}.`, 'declared', ['buyer_goal']));
  if (known(context, 'buyer_goal_detail')) change.push(item(`Dans vos mots : « ${str(context, 'buyer_goal_detail')} »`, 'declared', ['buyer_goal', 'buyer_goal_detail']));
  if (known(context, 'seller_situation')) change.push(item(`Vente : ${label('seller_situation', str(context, 'seller_situation'))}.`, 'declared', ['seller_situation']));
  if (known(context, 'buyer_stage')) change.push(item(`Achat : ${buyerLabel('buyer_stage', str(context, 'buyer_stage'))}.`, 'declared', ['buyer_stage']));
  if (!change.length) change.push(item('Vente et achat se lisent ensemble : commencez par le changement recherché et par le lien éventuel entre leurs ressources. Vous n’avez pas besoin de remplir deux questionnaires.', 'unknown'));
  const dependency = str(context, 'buyer_prior_sale');
  if (dependency === 'yes') solid.push(item('Selon vous, l’achat dépend du produit de la vente. Le point à établir est le montant réellement mobilisable et sa date de disponibilité.', 'declared', ['buyer_prior_sale']));
  else if (dependency === 'no') solid.push(item('Vous déclarez que l’achat ne dépend pas du produit de la vente. Cela ne prouve pas à lui seul que les ressources sont disponibles ni qu’un cumul est supportable.', 'declared', ['buyer_prior_sale']));
  else open.push(item('Le lien financier entre la vente et l’achat reste inconnu. Vérifiez si l’achat peut être engagé sans attendre le produit net de la vente.', 'unknown', ['buyer_prior_sale']));
  const resourcesStatus = str(context, 'transition_resources_status');
  const amount = ['estimated', 'confirmed'].includes(resourcesStatus) ? number(context, 'transition_resources') : undefined;
  if (['estimated', 'confirmed'].includes(resourcesStatus)) solid.push(item(`Ressources : ${label('transition_resources_status', resourcesStatus)}${amount !== undefined ? ` — ${formatEuros(amount)}` : ', montant non renseigné'}. ${resourcesStatus === 'confirmed' ? 'Il s’agit de votre déclaration ; le site n’a pas vérifié de justificatif.' : 'Une estimation ne valide pas le montant qui pourra être engagé.'}`, 'declared', ['buyer_prior_sale', 'transition_resources_status', 'transition_resources']));
  else open.push(item('Les ressources mobilisables ne sont pas établies. Distinguez prix de vente espéré, produit net et fonds disponibles avec les professionnels concernés.', 'unknown', ['transition_resources_status']));
  const timeline = transitionTimeline(context);
  for (const date of timeline) solid.push(item(`${date.label} : ${date.date ?? 'date non renseignée'} — ${date.statusLabel}.`, date.date ? 'declared' : 'unknown', date.sourceAnswerIds));
  const saleDate = timeline.find(date => date.project === 'sale')!, buyDate = timeline.find(date => date.project === 'purchase')!;
  if (saleDate.date && buyDate.date) {
    const relation = buyDate.date < saleDate.date ? 'La date d’achat renseignée précède la date de vente : un cumul ou une ressource intermédiaire serait à examiner.' : buyDate.date > saleDate.date ? 'La date de vente renseignée précède la date d’achat : une période entre les logements serait à organiser.' : 'Les deux dates renseignées coïncident. Leur égalité ne prouve pas que les opérations peuvent être coordonnées.';
    conditions.push(item(relation, 'conditional', ['transition_sale_date_status', 'transition_sale_date', 'buyer_horizon', 'buyer_date'], 'Les statuts et la compatibilité réelle des engagements doivent être vérifiés.'));
  } else open.push(item('Le calendrier reste incomplet. Une date manquante n’est remplacée par aucune durée habituelle ; précisez d’abord les contraintes et engagements réels.', 'unknown', ['transition_sale_date_status', 'transition_sale_date', 'buyer_horizon', 'buyer_date']));
  const interval = str(context, 'transition_interval');
  if (['confirmed', 'possible'].includes(interval)) {
    conditions.push(item(`Intervalle : ${label('transition_interval', interval)}${known(context, 'transition_interval_solution') ? ` — ${str(context, 'transition_interval_solution')}` : ''}${number(context, 'transition_interval_months') !== undefined ? `, pour ${number(context, 'transition_interval_months')} mois selon votre repère` : ', durée non renseignée'}.`, 'conditional', ['transition_interval', 'transition_interval_solution', 'transition_interval_months'], 'Confirmer accord, durée, conditions de vie et coût de cette solution.'));
    if (known(context, 'transition_interval_condition')) conditions.push(item(`Conditions à préserver pendant l’intervalle : ${str(context, 'transition_interval_condition')}.`, 'declared', ['transition_interval', 'transition_interval_condition']));
  } else if (interval === 'none') conditions.push(item('Vous n’avez pas de solution temporaire acceptable. Vendre avant d’acheter exige donc de résoudre ce point ou de réexaminer le scénario.', 'declared', ['transition_interval']));
  else open.push(item('La possibilité d’un logement temporaire est inconnue. Vérifiez une solution, sa durée acceptable, ses contraintes et son coût.', 'unknown', ['transition_interval']));
  const overlap = str(context, 'transition_overlap');
  if (known(context, 'transition_overlap')) conditions.push(item(`Cumul : ${label('transition_overlap', overlap)}${['checked', 'estimated'].includes(overlap) && number(context, 'transition_overlap_months') !== undefined ? `, sur ${number(context, 'transition_overlap_months')} mois envisagés` : ''}. ${overlap === 'no' ? 'Cette limite déclarée doit être protégée dans la comparaison.' : 'Le site ne confirme pas cette capacité ; la vérification doit inclure un retard de vente.'}`, 'declared', ['transition_overlap', 'transition_overlap_months']));
  else open.push(item('La capacité à supporter deux logements simultanément n’est pas renseignée. Elle doit être vérifiée avec les ressources et la durée réellement envisagées.', 'unknown', ['transition_overlap']));
  const costs = transitionCosts(context);
  if (known(context, 'transition_costs_status')) solid.push(item(`Dépenses de transition : ${label('transition_costs_status', str(context, 'transition_costs_status'))}.`, 'declared', ['transition_costs_status']));
  for (const cost of costs.items) open.push(item(`${cost.label} : ${cost.amount === null ? 'non renseigné, à déterminer si ce poste vous concerne' : `${formatEuros(cost.amount)} ${cost.unit === 'month' ? 'par mois' : 'pour ce poste au total'}`}. ${cost.amount !== null ? cost.condition : 'Aucun zéro n’est supposé.'}`, cost.amount === null ? 'unknown' : 'declared', cost.sourceAnswerIds));
  if (costs.knownOneOffSubtotal !== null) solid.push(item(`${costs.label} : ${formatEuros(costs.knownOneOffSubtotal)}. Ce sous-total ne représente pas le coût complet de la transition.`, 'declared', ['transition_costs_status', 'transition_cost_items', ...costs.items.filter(cost => cost.amount !== null && cost.unit === 'total').map(cost => cost.id)]));
  const scenario = str(context, 'transition_scenario');
  if (known(context, 'transition_scenario')) conditions.push(item(`Votre position actuelle : ${label('transition_scenario', scenario)}. ${scenario === 'wait' || scenario === 'undecided' ? 'Le non-choix est conservé et ne déclenche aucune relance.' : 'C’est un choix provisoire, conditionné aux vérifications ; aucune faisabilité n’est conclue.'}`, scenario === 'wait' || scenario === 'undecided' ? 'declared' : 'conditional', ['transition_scenario']));
  else conditions.push(item('Aucun scénario n’est choisi. Vous pouvez comparer les conditions nécessaires sans vous engager.', 'unknown', ['transition_scenario']));
  const triggers = list(context, 'transition_change_trigger').filter(value => value !== 'unknown');
  if (triggers.length) conditions.push(item(`Ce qui ferait changer le choix : ${triggers.map(code => label('transition_change_trigger', code)).join(' ; ')}.`, 'declared', ['transition_scenario', 'transition_change_trigger']));
  else open.push(item('Le fait qui ferait changer le choix reste à nommer : ressource, date, accord ou logement temporaire.', 'unknown', ['transition_change_trigger']));
  const fallback = str(context, 'transition_fallback');
  if (known(context, 'transition_fallback') && fallback !== 'none') conditions.push(item(`Repli à examiner : ${label('transition_fallback', fallback)}${known(context, 'transition_fallback_detail') ? ` — ${str(context, 'transition_fallback_detail')}` : ''}. Sa disponibilité et ses conditions ne sont pas supposées acquises.`, 'conditional', ['transition_fallback', 'transition_fallback_detail'], 'Confirmer le repli avec les personnes et professionnels concernés avant de le compter comme disponible.'));
  else open.push(item('Aucune solution de repli n’est identifiée. Demandez ce qui se passerait concrètement si une des deux opérations prenait du retard.', 'unknown', ['transition_fallback']));
  if (known(context, 'transition_reexamine')) conditions.push(item(`Votre condition de réexamen : ${str(context, 'transition_reexamine')}.`, 'declared', ['transition_scenario', 'transition_reexamine']));
  let next = { text: 'Vérifier si l’achat dépend du produit net de la vente.', why: 'Cette dépendance change l’ordre possible des vérifications, sans imposer encore un scénario.', ids: ['buyer_prior_sale'] };
  if (dependency === 'yes' || dependency === 'no') next = resourcesStatus !== 'confirmed' || amount === undefined || !known(context, 'transition_funds_date')
    ? { text: 'Faire préciser les ressources mobilisables et leur date de disponibilité.', why: 'Une estimation ou un accord annoncé ne suffit pas à décrire le montant utilisable et ses conditions. Mouaad peut organiser les vérifications avec la banque ou le courtier et le notaire.', ids: ['buyer_prior_sale', 'transition_resources_status', 'transition_resources', 'transition_funds_date'] }
    : { text: 'Confronter les dates et les conditions réelles des deux projets.', why: 'Les ressources que vous déclarez établies ne valident pas la compatibilité des engagements. La portée des actes doit être relue avec le notaire.', ids: ['transition_resources_status', 'transition_sale_date_status', 'transition_sale_date', 'buyer_horizon', 'buyer_date'] };
  if (scenario === 'sell_first' && !['confirmed', 'possible'].includes(interval)) next = { text: 'Examiner une solution temporaire acceptable avant de retenir la vente en premier.', why: 'Cette piste crée potentiellement un intervalle pour lequel aucune solution acceptable n’est actuellement décrite.', ids: ['transition_scenario', 'transition_interval'] };
  if (scenario === 'buy_first' && overlap !== 'checked') next = { text: 'Faire vérifier les ressources et la limite de cumul avant de retenir l’achat en premier.', why: overlap === 'no' ? 'Vous déclarez ne pas pouvoir supporter un cumul ; cette limite empêche de considérer cette piste comme prête à être engagée.' : 'La résistance à un retard de vente n’est pas établie.', ids: ['transition_scenario', 'buyer_prior_sale', 'transition_overlap', 'transition_resources_status'] };
  if (scenario === 'wait') next = { text: known(context, 'transition_reexamine') ? `Conserver cette lecture jusqu’à la vérification de : ${str(context, 'transition_reexamine')}.` : 'Attendre en nommant le point qui permettra de reprendre la décision.', why: 'Vous avez choisi d’attendre une vérification. Ce choix reste valable sans engagement ni relance automatique.', ids: ['transition_scenario', 'transition_reexamine'] };
  return {
    id: `${context.id}:transition:${context.revision}`, revision: context.revision, title: 'Votre vente et votre achat, reliés', methodVersion: TRANSITION_METHOD_VERSION, generatedAt: context.updatedAt,
    ...domainEvidence(context, Object.keys(context.answers).filter(id => /^(buyer_|seller_situation$|transition_)/.test(id))),
    sections: [{ id: 'change', title: 'Ce que la transition doit permettre', items: change }, { id: 'solid', title: 'Ce qui paraît solide', items: solid }, { id: 'conditional', title: 'Ce qui dépend de conditions', items: conditions }, { id: 'open', title: 'Ce qui reste à décider ou vérifier', items: open }],
    options: transitionOptions(context), timeline, costs,
    nextDecision: { text: next.text, why: next.why, changesWith: known(context, 'transition_reexamine') ? str(context, 'transition_reexamine') : 'Un changement de ressource, de date, de solution temporaire, de condition d’engagement ou d’accord entre les personnes.', ...domainEvidence(context, next.ids) },
    limits: ['Cette lecture conserve vos déclarations et leurs conditions. Aucun financement, crédit relais, prix net ou engagement n’est validé par le site.', 'Les dates souhaitées, contraintes et engagements restent distincts. Aucune durée standard ni compatibilité automatique n’est supposée.', 'Les montants mensuels restent séparés des dépenses ponctuelles. Le sous-total renseigné n’est ni un coût complet ni une mesure de capacité.', 'Mouaad peut organiser les vérifications utiles ; la banque ou le courtier et le notaire restent compétents dans leurs domaines.'],
  };
}

export function transitionImpact(questionId: string, raw: Context): Impact {
  const context = current(raw);
  const reading = buildTransitionReading(context);
  const related = reading.sections.flatMap(section => section.items).find(item => item.sourceAnswerIds?.includes(questionId));
  const sequence = getTransitionQuestions({ ...context, depth: 'deep' }).find(question => question.id === questionId)?.sequence ?? 1;
  const titles = ['Deux projets sur une même ligne de vie', 'Le lien financier devient visible', 'Une date conserve son statut', 'L’intervalle devient concret', 'Le coût garde son périmètre', 'Chaque scénario garde ses conditions', 'Le choix peut être réexaminé'];
  return { title: titles[sequence - 1], text: related?.text ?? 'Un point encore inconnu indique la vérification à organiser. Il ne rend pas un scénario faisable par défaut.', limit: 'La lecture organise vos déclarations. Elle ne valide ni ressources ni engagements.', ...(sequence === 6 ? { comparison: transitionOptions(context) } : {}), ...domainEvidence(context, related?.sourceAnswerIds ?? [questionId]) };
}

export const transitionJourney: Journey = { project: 'transition', title: 'Relier votre vente et votre achat', intro: 'Voir ce qui dépend de quoi avant de choisir l’ordre entre votre vente et votre achat. Une même lecture, des conditions visibles, et le droit d’attendre.', sequences: TRANSITION_SEQUENCES, getQuestions: getTransitionQuestions, getImpact: transitionImpact, buildReading: buildTransitionReading };
