import { list, number, str, type Answer, type ComparisonOption, type Context, type Impact, type Journey, type Question, type Reading, type ReadingItem } from './types';

export const BUYER_METHOD_VERSION = 'buyer-2026-09-10.2';
export const BUYER_SEQUENCES = ['Votre avancement', 'Votre situation actuelle', 'Le changement recherché', 'Votre quotidien', 'Le cadre réel', 'Un arbitrage, si nécessaire', 'Votre lecture'];
const unknown = { value: 'unknown', label: 'Je ne sais pas encore' };
const choices = (values: Record<string, string>) => Object.entries(values).map(([value, label]) => ({ value, label }));

export const buyerLabels: Record<string, Record<string, string>> = {
  buyer_stage: { idea: 'Une idée que je commence à explorer', preparation: 'Je prépare mon projet', searching: 'Je recherche ou je visite', found: 'J’ai repéré un bien', committed: 'Une offre ou un engagement est en cours' },
  buyer_purpose: { primary: 'Ma résidence principale', secondary: 'Une résidence secondaire', investment: 'Un investissement' },
  buyer_change: { space: 'Le logement ne suit plus mes besoins', location: 'Les trajets ou le secteur ne me conviennent plus', life: 'Mon quotidien change', ownership: 'Je souhaite devenir propriétaire', opportunity: 'Un bien m’a donné envie de changer', explore: 'Je cherche encore la raison principale' },
  buyer_goal: { quiet: 'Pouvoir m’isoler et vivre plus au calme', space: 'Avoir de la place pour mes usages', journeys: 'Simplifier mes trajets', outdoors: 'Profiter d’un extérieur', access: 'Rendre le quotidien plus accessible', stability: 'M’installer durablement', other: 'Un autre changement à préciser' },
  buyer_uses: { work: 'M’isoler pour travailler', bedrooms: 'Disposer de chambres séparées', outdoors: 'Vivre aussi dehors', access: 'Circuler facilement au quotidien', host: 'Accueillir des proches', storage: 'Ranger sans encombrer les pièces', transport: 'Rejoindre mes lieux habituels', quiet: 'Trouver du calme chez moi' },
  buyer_keep: { relatives: 'La proximité de mes proches', transport: 'Mes trajets actuels', services: 'L’accès aux services', calm: 'Le calme', costs: 'Un niveau de dépenses supportable', none: 'Rien d’identifié pour le moment' },
  buyer_type: { apartment: 'Appartement', house: 'Maison', both: 'Les deux me plaisent' },
  buyer_prior_sale: { yes: 'Oui, l’achat dépend du produit d’une vente', no: 'Non, il n’en dépend pas', unknown: 'Ce lien reste à vérifier' },
  buyer_budget_status: { estimated: 'J’ai une enveloppe estimée', checked: 'J’ai fait vérifier une enveloppe pour mon projet', unknown: 'Je n’ai pas encore de montant' },
  buyer_financing: { not_started: 'Je ne l’ai pas encore fait vérifier', discussion: 'Un échange est en cours', checked: 'Je déclare une vérification faite pour ce montant', no_loan: 'Je prévois un achat sans crédit', unknown: 'Je ne sais pas encore' },
  buyer_costs_status: { separate: 'Les dépenses annexes sont chiffrées séparément', included: 'Elles sont comprises dans mon enveloppe', partial: 'J’en ai identifié une partie', unknown: 'Elles restent à chiffrer' },
  buyer_works: { none: 'Je ne souhaite pas de travaux', light: 'Des travaux légers sont envisageables', substantial: 'Des travaux importants sont envisageables', conditional: 'Seulement sous certaines conditions' },
  buyer_horizon: { explore: 'Je n’ai pas de date cible', year: 'Dans l’année à venir', months: 'Dans les prochains mois', constraint: 'J’ai une date liée à une contrainte', engaged: 'Une date figure dans un engagement' },
  buyer_agreement: { alone: 'Je décide seul pour ce projet', shared: 'Les personnes concernées partagent cet objectif', discuss: 'Des points restent à discuter ensemble' },
  buyer_tension: { none: 'Aucune tension identifiée pour le moment', budget_sector: 'Le secteur souhaité et le budget', layout_space: 'La surface et l’organisation des pièces', works_time: 'Les travaux et le calendrier', other: 'Une autre tension que je veux préciser' },
  buyer_opening: { no: 'Je n’ai pas exprimé d’ouverture pour le moment', conditional: 'Oui, mais sous une condition précise' },
  buyer_opening_target: { surface: 'La surface', property_type: 'Le type de logement', zone: 'Le secteur', works: 'Les travaux', horizon: 'Le calendrier', other: 'Un autre critère' },
  buyer_exclusions: { heavy_works: 'Des travaux lourds', no_outdoor: 'L’absence d’extérieur', stairs: 'Des escaliers nécessaires au quotidien', long_commute: 'Un trajet au-delà de ma limite', other: 'Une autre exclusion à préciser' },
};

/** Answer dependencies, not a reason to erase unrelated needs or preferences. */
export const buyerDependencies: Record<string, string[]> = {
  buyer_goal: ['buyer_goal_detail'],
  buyer_budget_status: ['buyer_budget', 'buyer_financing', 'buyer_costs_status', 'buyer_extra_costs'],
  buyer_budget: ['buyer_financing', 'buyer_option'],
  buyer_costs_status: ['buyer_extra_costs'],
  buyer_sector: ['buyer_option'],
  buyer_surface: ['buyer_option'],
  buyer_type: ['buyer_option'],
  buyer_works: ['buyer_works_condition', 'buyer_works_cost', 'buyer_option'],
  buyer_horizon: ['buyer_date', 'buyer_option'],
  buyer_tension: ['buyer_tension_detail', 'buyer_option'],
  buyer_opening: ['buyer_opening_target', 'buyer_opening_condition'],
  buyer_opening_target: ['buyer_opening_condition'],
  buyer_exclusions: ['buyer_exclusion_detail'],
};

/** Pure read guard: a saved child from before a root correction is not current. */
export function currentDomainContext(context: Context, dependencies: Record<string, string[]>): Context {
  const answers = { ...context.answers };
  const invalid = new Set<string>();
  for (const [root, children] of Object.entries(dependencies)) {
    const parent = context.answers[root];
    for (const child of children) {
      const answer = context.answers[child];
      if (parent && parent.provenance !== 'confirmed' && answer && parent.revision > answer.revision) invalid.add(child);
    }
  }
  let added = true;
  while (added) {
    added = false;
    for (const id of [...invalid]) for (const child of dependencies[id] ?? []) {
      if (!invalid.has(child)) { invalid.add(child); added = true; }
    }
  }
  invalid.forEach(id => delete answers[id]);
  for (const id of ['buyer_date', 'transition_sale_date', 'transition_funds_date']) {
    const date = answers[id]?.value;
    if (typeof date === 'string' && date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date + 'T12:00:00Z')) || new Date(date + 'T12:00:00Z').toISOString().slice(0, 10) !== date)) delete answers[id];
  }
  return { ...context, answers };
}

export interface DomainEvidence {
  author: string;
  sourceAnswerIds: string[];
  provenance: { answerId: string; mode: Answer['provenance']; revision: number; updatedAt: string }[];
}
export function domainEvidence(context: Context, ids: string[], author = 'LEVOIS · méthode de clarification'): DomainEvidence {
  const sourceAnswerIds = [...new Set(ids)].filter(id => context.answers[id] !== undefined);
  return { author, sourceAnswerIds, provenance: sourceAnswerIds.map(answerId => ({ answerId, mode: context.answers[answerId].provenance, revision: context.answers[answerId].revision, updatedAt: context.answers[answerId].updatedAt })) };
}
export function domainItem(context: Context, text: string, kind: ReadingItem['kind'], ids: string[] = [], condition?: string): ReadingItem & DomainEvidence {
  return { text, kind, ...domainEvidence(context, ids), ...(condition ? { condition } : {}) };
}
export function domainOption(context: Context, option: ComparisonOption, ids: string[]): ComparisonOption & DomainEvidence {
  return { ...option, ...domainEvidence(context, ids) };
}
export const formatEuros = (amount: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} €`;
export function buyerLabel(id: string, code: string): string { return buyerLabels[id]?.[code] ?? (code === 'unknown' ? 'Non renseigné' : code); }
const labelsFor = (context: Context, id: string) => list(context, id).filter(code => code !== 'unknown').map(code => buyerLabel(id, code));
const present = (context: Context, id: string) => !!str(context, id) && str(context, id) !== 'unknown';
const outsideScope = (context: Context) => ['secondary', 'investment'].includes(str(context, 'buyer_purpose'));
const q = (id: string, sequence: number, title: string, extra: Partial<Question> = {}): Question => ({ id, sequence, sequenceTitle: BUYER_SEQUENCES[sequence - 1], title, type: 'choice', choices: [...choices(buyerLabels[id] ?? {}), ...(buyerLabels[id]?.unknown ? [] : [unknown])], ...extra });

export function buyerOptions(raw: Context): (ComparisonOption & DomainEvidence)[] {
  const context = currentDomainContext(raw, buyerDependencies);
  const tension = str(context, 'buyer_tension');
  const ids = ['buyer_tension', 'buyer_sector', 'buyer_budget', 'buyer_surface', 'buyer_uses', 'buyer_works', 'buyer_horizon'];
  let options: ComparisonOption[] = [];
  if (tension === 'budget_sector') options = [
    { id: 'protect_sector', title: 'Garder le secteur comme point de départ', consequence: 'Examiner les usages et caractéristiques qui comptent vraiment dans ce secteur.', condition: 'Comparer des biens réellement disponibles et vérifier leur coût complet.', limit: 'Cela ne signifie pas accepter moins de surface ou augmenter votre budget.' },
    { id: 'test_sector', title: 'Tester un autre secteur', consequence: 'Comparer un autre lieu à partir des mêmes usages et trajets.', condition: 'Vous devez d’abord accepter explicitement ce secteur et vérifier ses trajets.', limit: 'Un secteur différent n’est pas automatiquement moins cher ni compatible avec votre vie.' },
    { id: 'verify_first', title: 'Vérifier avant de trancher', consequence: 'Garder vos critères actuels pendant la vérification de l’enveloppe et de l’offre réelle.', condition: 'Identifier le montant complet et les biens effectivement proposés au moment de la recherche.', limit: 'Les ventes passées ne décrivent pas les logements disponibles.' },
  ];
  if (tension === 'layout_space') options = [
    { id: 'test_layout', title: 'Comparer l’organisation des pièces', consequence: 'Regarder si un logement permet vos usages avec sa disposition réelle.', condition: 'Vérifier sur plan puis en visite l’isolement, les circulations et le rangement.', limit: 'Nous ne supposons pas que vous acceptez une surface plus petite.' },
    { id: 'keep_surface', title: 'Conserver la surface souhaitée', consequence: 'Garder votre repère de surface et vérifier ce qu’il permet concrètement.', condition: 'Comparer également la disposition, le coût et les trajets.', limit: 'Davantage de mètres carrés ne prouve pas qu’une pièce soit réellement isolable.' },
    { id: 'verify_first', title: 'Observer avant de choisir', consequence: 'Comparer les mêmes usages dans deux plans ou lors de visites.', condition: 'Disposer d’éléments concrets sur les espaces.', limit: 'Vous pouvez conserver vos préférences sans arbitrer aujourd’hui.' },
  ];
  if (tension === 'works_time') options = [
    { id: 'protect_date', title: 'Protéger le calendrier souhaité', consequence: 'Examiner les logements dont l’usage ne dépend pas de travaux préalables.', condition: 'Vérifier leur disponibilité réelle et leur état.', limit: 'Aucun délai de remise de clés n’est déduit de votre souhait.' },
    { id: 'study_works', title: 'Étudier les travaux avant la date', consequence: 'Comparer le résultat recherché avec un programme concret de travaux.', condition: 'Obtenir chiffrage, planning et solution de logement si nécessaire.', limit: 'Le site ne valide ni le coût ni la durée des travaux.' },
    { id: 'verify_first', title: 'Attendre les vérifications', consequence: 'Garder le choix ouvert jusqu’aux estimations utiles.', condition: 'Nommer le devis ou la date qui permettra de réexaminer.', limit: 'Attendre n’engage à aucune relance.' },
  ];
  if (tension === 'other') options = [
    { id: 'clarify_tension', title: 'Nommer ce que vous souhaitez protéger', consequence: 'Séparer votre priorité de ce qui reste à discuter.', condition: 'Décrire les deux éléments qui se contrarient, seul ou avec les personnes concernées.', limit: 'Aucun compromis précis n’est proposé sans connaître cette tension.' },
    { id: 'verify_first', title: 'Ne pas arbitrer maintenant', consequence: 'Conserver vos critères pendant que vous cherchez l’information manquante.', condition: 'Choisir le fait ou l’accord qui vous permettra de reprendre la décision.', limit: 'L’absence de choix ne devient pas une ouverture.' },
  ];
  return options.map(option => domainOption(context, option, ids));
}

export function getBuyerQuestions(raw: Context): Question[] {
  const context = currentDomainContext(raw, buyerDependencies);
  const deep = context.depth === 'deep';
  const questions = [q('buyer_stage', 1, 'Où en êtes-vous dans votre achat ?'), q('buyer_purpose', 1, 'Ce logement sera-t-il votre résidence principale ?', { help: 'La lecture est conçue pour votre futur quotidien. Un autre projet garde une orientation adaptée.' })];
  if (outsideScope(context)) return questions;
  questions.push(
    q('buyer_change', 2, 'Qu’est-ce qui vous conduit à envisager un changement ?'),
    q('buyer_goal', 3, 'Qu’est-ce que cet achat doit changer en premier ?', { help: 'Choisir une priorité ne signifie pas renoncer au reste.' }),
  );
  if (deep || str(context, 'buyer_goal') === 'other') questions.push(q('buyer_goal_detail', 3, 'Comment le diriez-vous avec vos mots ?', { type: 'text', optional: true, maxLength: 500, placeholder: 'Dans mon prochain logement, je voudrais…' }));
  if (deep) questions.push(q('buyer_keep', 3, 'Qu’aimeriez-vous conserver de votre quotidien actuel ?', { type: 'multiple', maxChoices: 3 }), q('buyer_agreement', 3, 'Cet objectif est-il partagé par les personnes qui décident ?'));
  questions.push(q('buyer_uses', 4, 'De quoi avez-vous besoin au quotidien ?', { type: 'multiple', maxChoices: 4, help: 'Vos usages d’abord. Nous ne déduisons pas une surface ou un type de bien de vos réponses.' }));
  if (deep) questions.push(q('buyer_type', 4, 'Avez-vous une préférence de type de logement ?', { help: 'Cette préférence reste distincte d’une exclusion.' }), q('buyer_surface', 4, 'Avez-vous un repère de surface souhaitée ?', { type: 'number', min: 1, max: 2000, suffix: 'm²', optional: true }), q('buyer_bedrooms', 4, 'Combien de chambres souhaiteriez-vous ?', { type: 'number', min: 0, max: 20, optional: true }));
  questions.push(q('buyer_sector', 5, 'Où aimeriez-vous pouvoir vivre ?', { type: 'text', optional: true, maxLength: 300, placeholder: 'Une ou plusieurs communes, un secteur…', help: 'Laissez ce point ouvert si vous ne savez pas encore. Une commune citée n’est pas une exclusivité.' }));
  if (deep && list(context, 'buyer_uses').includes('transport')) questions.push(q('buyer_travel_point', 5, 'Quel lieu devez-vous pouvoir rejoindre régulièrement ?', { type: 'text', optional: true, maxLength: 200, help: 'Un quartier ou une gare suffit ; aucune adresse personnelle n’est nécessaire.' }), q('buyer_travel_minutes', 5, 'Quel temps de trajet maximal avez-vous en tête ?', { type: 'number', min: 1, max: 240, suffix: 'minutes', optional: true, help: 'Le mode, les horaires et le trajet réel restent à vérifier.' }));
  questions.push(q('buyer_budget_status', 5, 'Où en êtes-vous de votre enveloppe ?'));
  if (['estimated', 'checked'].includes(str(context, 'buyer_budget_status'))) {
    questions.push(q('buyer_budget', 5, 'Quelle enveloppe avez-vous en tête ?', { type: 'number', min: 1, max: 100000000, suffix: '€', optional: true, help: 'Le montant est votre déclaration. Nous allons distinguer ce qu’il comprend.' }));
    if (number(context, 'buyer_budget') !== undefined) questions.push(q('buyer_costs_status', 5, 'Cette enveloppe comprend-elle les dépenses en plus du bien ?', { help: 'Acquisition, travaux, déménagement : leur périmètre change la lecture du montant.' }), q('buyer_financing', 5, 'Les ressources correspondant à ce montant ont-elles été vérifiées ?', { help: 'Cette réponse est indépendante du montant. Une visite ou un achat précédent ne valide pas un financement.' }));
    if (deep && str(context, 'buyer_costs_status') === 'separate') questions.push(q('buyer_extra_costs', 5, 'Quel montant de dépenses annexes avez-vous chiffré ?', { type: 'number', min: 0, max: 10000000, suffix: '€ au total', optional: true, help: 'Uniquement le total distinct de l’enveloppe précédente. Le site n’ajoute aucun forfait.' }));
  }
  questions.push(q('buyer_horizon', 5, 'Avez-vous un calendrier en tête ?'));
  if (['constraint', 'engaged'].includes(str(context, 'buyer_horizon'))) questions.push(q('buyer_date', 5, 'Quelle est cette date ?', { type: 'date', optional: true, help: str(context, 'buyer_horizon') === 'engaged' ? 'La portée de cet engagement reste à relire avec le professionnel concerné.' : 'Elle est conservée comme contrainte déclarée, sans présumer sa réalisation.' }));
  questions.push(q('buyer_prior_sale', 5, 'Cet achat dépend-il du produit d’une vente ?'));
  if (deep) questions.push(q('buyer_works', 5, 'Quelle est votre position sur les travaux ?'));
  if (str(context, 'buyer_works') === 'conditional') questions.push(q('buyer_works_condition', 5, 'À quelle condition les travaux seraient-ils acceptables ?', { type: 'text', optional: true, maxLength: 400 }));
  if (deep && ['light', 'substantial', 'conditional'].includes(str(context, 'buyer_works'))) questions.push(q('buyer_works_cost', 5, 'Avez-vous déjà un chiffrage des travaux ?', { type: 'number', min: 0, max: 10000000, suffix: '€', optional: true, help: 'Aucun montant n’est inventé. Il peut déjà être compris dans les dépenses annexes : nous ne l’ajoutons pas automatiquement.' }));
  questions.push(q('buyer_tension', 6, 'Voyez-vous déjà deux éléments difficiles à concilier ?', { help: 'S’il n’y a pas de tension, nous n’en créons pas. Vous pourrez simplement garder votre lecture.' }));
  if (str(context, 'buyer_tension') === 'other') questions.push(q('buyer_tension_detail', 6, 'Quels sont ces deux éléments ?', { type: 'text', optional: true, maxLength: 500 }));
  const options = buyerOptions(context);
  if (options.length) questions.push(q('buyer_option', 6, 'Quelle piste voulez-vous examiner en premier ?', { choices: [...options.map(option => ({ value: option.id, label: option.title, detail: option.consequence })), { value: 'undecided', label: 'Je ne choisis pas encore' }], help: 'C’est une piste de vérification ; elle ne modifie pas vos critères à votre place.' }));
  if (deep) questions.push(q('buyer_opening', 6, 'Avez-vous une ouverture que vous voulez préciser ?'));
  if (str(context, 'buyer_opening') === 'conditional') questions.push(q('buyer_opening_target', 6, 'Quel critère pourrait évoluer ?'), q('buyer_opening_condition', 6, 'À quelle condition accepteriez-vous cette évolution ?', { type: 'text', maxLength: 500, optional: true, help: 'Sans condition renseignée, aucune souplesse n’est tenue pour acquise.' }));
  if (deep) questions.push(q('buyer_exclusions', 6, 'Y a-t-il quelque chose que vous déclarez ne pas accepter ?', { type: 'multiple', maxChoices: 5, help: 'Ne rien sélectionner laisse ce point non renseigné ; cela ne signifie pas que tout est acceptable.' }));
  if (list(context, 'buyer_exclusions').includes('other')) questions.push(q('buyer_exclusion_detail', 6, 'Quelle est cette exclusion ?', { type: 'text', maxLength: 500, optional: true }));
  return context.depth === 'micro' ? [questions[0], questions.find(question => question.id === 'buyer_goal')!] : questions;
}

/** Optional historical evidence, independent of budget, financing and preferences. */
export function getBuyerResource(raw: Context) {
  const context = currentDomainContext(raw, buyerDependencies);
  const sector = str(context, 'buyer_sector').trim();
  return {
    kind: 'resource' as const,
    href: sector ? `/votre-rue?q=${encodeURIComponent(sector)}` : '/votre-rue',
    label: sector ? `Explorer les ventes passées autour de « ${sector} »` : 'Explorer les ventes passées autour d’une adresse',
    detail: 'Accès facultatif, sans coordonnées. Votre rue présente les ventes DVF (DGFiP / Etalab), leur période, leur périmètre et le nombre observé. Les médianes et la dispersion ne sont affichées que si les données le permettent. Choisissez explicitement une adresse ; ces ventes passées ne prouvent ni offre disponible, ni prix actuel, ni capacité d’achat.',
    ...domainEvidence(context, ['buyer_sector']),
  };
}

export function buildBuyerReading(raw: Context): Reading {
  const context = currentDomainContext(raw, buyerDependencies);
  const item = (text: string, kind: ReadingItem['kind'], ids: string[] = [], condition?: string) => domainItem(context, text, kind, ids, condition);
  const goal: ReadingItem[] = [], solid: ReadingItem[] = [], evolving: ReadingItem[] = [], open: ReadingItem[] = [];
  const base = { id: `${context.id}:buyer:${context.revision}`, revision: context.revision, methodVersion: BUYER_METHOD_VERSION, generatedAt: context.updatedAt, ...domainEvidence(context, Object.keys(context.answers).filter(id => id.startsWith('buyer_'))) };
  const sections = () => [{ id: 'change', title: 'Ce que l’achat doit changer', items: goal }, { id: 'solid', title: 'Ce qui paraît solide', items: solid }, { id: 'conditional', title: 'Ce qui peut évoluer sous condition', items: evolving }, { id: 'open', title: 'Ce qui reste à décider ou vérifier', items: open }];
  if (outsideScope(context)) {
    goal.push(item(`Votre projet déclaré : ${buyerLabel('buyer_purpose', str(context, 'buyer_purpose'))}.`, 'declared', ['buyer_purpose']));
    solid.push(item('Vous avez distingué la destination de l’achat. Cette lecture automatisée est conçue pour la résidence principale.', 'solid', ['buyer_purpose']));
    evolving.push(item('Vous pouvez revenir sur la destination du logement ou garder cette orientation.', 'conditional', ['buyer_purpose']));
    open.push(item('Pour ce projet, les usages, revenus éventuels, coûts, règles et risques nécessitent une étude adaptée. La méthode et les ressources restent accessibles sans coordonnées.', 'unknown', ['buyer_purpose']));
    return { ...base, title: 'Une orientation adaptée à votre achat', sections: sections(), nextDecision: { text: 'Préciser les vérifications propres à la destination de cet achat.', why: 'Les conclusions d’une résidence principale ne décriraient pas correctement votre projet.', changesWith: 'Une correction de la destination du logement.', ...domainEvidence(context, ['buyer_purpose']) }, limits: ['Aucune lecture financière ou fiscale spécialisée n’est produite pour ce projet.'] };
  }
  if (present(context, 'buyer_goal')) goal.push(item(`Votre priorité : ${buyerLabel('buyer_goal', str(context, 'buyer_goal'))}.`, 'declared', ['buyer_goal']));
  if (present(context, 'buyer_goal_detail')) goal.push(item(`Avec vos mots : « ${str(context, 'buyer_goal_detail')} »`, 'declared', ['buyer_goal', 'buyer_goal_detail']));
  if (present(context, 'buyer_change')) goal.push(item(`Le point de départ : ${buyerLabel('buyer_change', str(context, 'buyer_change'))}.`, 'declared', ['buyer_change']));
  if (!goal.length) goal.push(item('Commencez par nommer un changement concret dans votre quotidien. Il servira à comparer les logements avant leur surface ou leur type.', 'unknown'));
  const keep = labelsFor(context, 'buyer_keep');
  if (keep.length) goal.push(item(`À conserver selon vous : ${keep.join(' ; ')}.`, 'declared', ['buyer_keep']));
  const uses = labelsFor(context, 'buyer_uses');
  if (uses.length) solid.push(item(`Les usages que vous avez exprimés : ${uses.join(' ; ')}. Ils constituent des points à observer en visite, sans imposer un type de bien.`, 'declared', ['buyer_uses']));
  if (present(context, 'buyer_sector')) solid.push(item(`Vous envisagez : ${str(context, 'buyer_sector')}. L’adéquation des trajets et du quotidien reste à vérifier sur place.`, 'declared', ['buyer_sector']));
  if (present(context, 'buyer_stage')) solid.push(item(`Votre avancement déclaré : ${buyerLabel('buyer_stage', str(context, 'buyer_stage'))}.`, 'declared', ['buyer_stage']));
  if (!solid.length) solid.push(item('Aucun critère personnel n’est encore établi. Une première observation utile consiste à décrire l’usage qui fonctionne mal dans votre logement actuel.', 'unknown'));
  if (str(context, 'buyer_agreement') === 'discuss') open.push(item('Des points restent à discuter entre les personnes qui décident. Conservez les différences avant de retenir un objectif commun.', 'declared', ['buyer_agreement']));
  else if (present(context, 'buyer_agreement')) solid.push(item(buyerLabel('buyer_agreement', str(context, 'buyer_agreement')) + '.', 'declared', ['buyer_agreement']));
  const type = str(context, 'buyer_type'), surface = number(context, 'buyer_surface'), bedrooms = number(context, 'buyer_bedrooms');
  if (present(context, 'buyer_type')) evolving.push(item(`Préférence déclarée : ${buyerLabel('buyer_type', type)}. Elle ne vaut ni exclusion des autres types ni souplesse consentie.`, 'declared', ['buyer_type']));
  else evolving.push(item('Le type de logement reste non renseigné. Nous ne supposons ni préférence ni flexibilité.', 'unknown', ['buyer_type']));
  if (surface !== undefined && surface > 0) evolving.push(item(`Votre repère de surface souhaitée : ${surface} m². Il ne garantit pas la disposition nécessaire à vos usages.`, 'declared', ['buyer_surface', 'buyer_uses']));
  if (bedrooms !== undefined) evolving.push(item(`Votre préférence : ${bedrooms} chambre${bedrooms > 1 ? 's' : ''}. Elle vient de votre réponse, sans calcul à partir de votre situation.`, 'declared', ['buyer_bedrooms']));
  const opening = str(context, 'buyer_opening') === 'conditional' && present(context, 'buyer_opening_target');
  if (opening && present(context, 'buyer_opening_condition')) evolving.push(item(`Ouverture déclarée sur ${buyerLabel('buyer_opening_target', str(context, 'buyer_opening_target')).toLowerCase()} : « ${str(context, 'buyer_opening_condition')} ».`, 'conditional', ['buyer_opening', 'buyer_opening_target', 'buyer_opening_condition'], str(context, 'buyer_opening_condition')));
  else evolving.push(item(opening ? 'Vous envisagez une ouverture, mais sa condition reste à préciser. Aucune souplesse n’est retenue à ce stade.' : 'Aucune ouverture sous condition n’est actuellement renseignée. Vos réponses absentes ne sont pas traitées comme des concessions.', 'unknown', ['buyer_opening', 'buyer_opening_target']));
  const exclusions = labelsFor(context, 'buyer_exclusions');
  if (exclusions.length) solid.push(item(`Exclusions déclarées : ${exclusions.join(' ; ')}${present(context, 'buyer_exclusion_detail') && list(context, 'buyer_exclusions').includes('other') ? ` — ${str(context, 'buyer_exclusion_detail')}` : ''}. Ce sont vos limites exprimées, pas des exclusions validées dans un suivi professionnel.`, 'declared', ['buyer_exclusions', 'buyer_exclusion_detail']));
  else open.push(item('Les exclusions ne sont pas renseignées. Nous ne concluons pas que tout vous convient.', 'unknown', ['buyer_exclusions']));
  const budget = ['estimated', 'checked'].includes(str(context, 'buyer_budget_status')) ? number(context, 'buyer_budget') : undefined;
  const financing = str(context, 'buyer_financing');
  if (budget !== undefined && budget > 0) {
    solid.push(item(`Votre enveloppe déclarée : ${formatEuros(budget)}${str(context, 'buyer_budget_status') === 'estimated' ? ', estimée' : ', que vous indiquez avoir fait vérifier'}. Ce montant n’est pas une validation de capacité d’achat par LEVOIS.`, 'declared', ['buyer_budget_status', 'buyer_budget']));
    if (present(context, 'buyer_costs_status')) open.push(item(`Périmètre du montant : ${buyerLabel('buyer_costs_status', str(context, 'buyer_costs_status'))}. Vérifiez ce qui reste disponible pour le bien après les autres dépenses.`, 'declared', ['buyer_budget', 'buyer_costs_status']));
    else open.push(item('Le périmètre de l’enveloppe reste inconnu : prix du bien, acquisition, travaux et déménagement doivent être distingués.', 'unknown', ['buyer_budget']));
    if (str(context, 'buyer_costs_status') === 'separate' && number(context, 'buyer_extra_costs') !== undefined) open.push(item(`Dépenses annexes séparées, selon vous : ${formatEuros(number(context, 'buyer_extra_costs')!)}. Leur exhaustivité et leur financement restent à vérifier.`, 'declared', ['buyer_costs_status', 'buyer_extra_costs']));
    if (present(context, 'buyer_financing')) open.push(item(`Ressources : ${buyerLabel('buyer_financing', financing)}. ${financing === 'checked' ? 'La vérification déclarée ne remplace pas la confirmation des conditions pour un bien précis.' : financing === 'no_loan' ? 'La disponibilité et la date de mobilisation des fonds restent à établir.' : 'À confirmer avec la banque ou le courtier avant un engagement.'}`, 'declared', ['buyer_budget', 'buyer_financing']));
    else open.push(item('Le niveau de vérification des ressources n’est pas renseigné. Un montant ou des visites ne permettent pas de le déduire.', 'unknown', ['buyer_budget', 'buyer_financing']));
  } else open.push(item('L’enveloppe n’est pas renseignée. Vous pouvez déjà comparer les usages ; avant de sélectionner par prix, définissez un coût complet supportable puis faites vérifier les ressources.', 'unknown', ['buyer_budget_status', 'buyer_budget']));
  if (present(context, 'buyer_works')) {
    evolving.push(item(`Travaux : ${buyerLabel('buyer_works', str(context, 'buyer_works'))}${str(context, 'buyer_works') === 'conditional' && present(context, 'buyer_works_condition') ? ` — ${str(context, 'buyer_works_condition')}` : ''}.`, str(context, 'buyer_works') === 'conditional' ? 'conditional' : 'declared', ['buyer_works', 'buyer_works_condition']));
    if (str(context, 'buyer_works') !== 'none') open.push(item(number(context, 'buyer_works_cost') !== undefined ? `Chiffrage de travaux déclaré : ${formatEuros(number(context, 'buyer_works_cost')!)}. Devis, périmètre et délai restent à confronter au bien concerné ; aucune addition automatique avec les dépenses annexes.` : 'Les travaux envisagés restent à chiffrer et à organiser avant de les considérer compatibles avec le budget et le calendrier.', number(context, 'buyer_works_cost') !== undefined ? 'declared' : 'unknown', ['buyer_works', 'buyer_works_cost']));
  }
  if (present(context, 'buyer_horizon')) solid.push(item(`Calendrier déclaré : ${buyerLabel('buyer_horizon', str(context, 'buyer_horizon'))}${['constraint', 'engaged'].includes(str(context, 'buyer_horizon')) && present(context, 'buyer_date') ? ` (${str(context, 'buyer_date')})` : ''}. Une intention de date ne prouve pas la disponibilité d’un logement.`, 'declared', ['buyer_horizon', 'buyer_date']));
  if (str(context, 'buyer_prior_sale') === 'yes') open.push(item('Selon vous, l’achat dépend du produit d’une vente. La lecture « Vendre et acheter » permet de préciser ressources nettes, disponibilité des fonds, dates et intervalle entre logements.', 'conditional', ['buyer_prior_sale'], 'Produit net et disponibilité réelle de la vente à établir.'));
  else if (str(context, 'buyer_prior_sale') !== 'no') open.push(item('La dépendance à une vente reste à vérifier. Elle peut changer l’ordre des opérations, sans modifier vos usages recherchés.', 'unknown', ['buyer_prior_sale']));
  if (present(context, 'buyer_travel_point')) open.push(item(`Trajet à vérifier vers ${str(context, 'buyer_travel_point')}${number(context, 'buyer_travel_minutes') !== undefined ? `, avec votre repère de ${number(context, 'buyer_travel_minutes')} minutes` : ''} : testez le mode et les horaires réellement utilisés.`, 'declared', ['buyer_travel_point', 'buyer_travel_minutes']));
  const resource = getBuyerResource(context);
  open.push(item(`Repère historique facultatif${present(context, 'buyer_sector') ? ` pour votre secteur déclaré « ${str(context, 'buyer_sector')} »` : ''} : la ressource « Votre rue » permet d’observer les ventes passées autour d’une adresse choisie, avec source, période, périmètre et nombre de ventes. Elle aide à préparer une comparaison locale ; elle ne fixe ni surface accessible, ni budget adapté, ni biens disponibles.`, 'conditional', resource.sourceAnswerIds, 'Si vous souhaitez compléter cette lecture par des faits historiques, choisissez une adresse et vérifiez les limites de l’échantillon.'));
  const options = buyerOptions(context);
  if (!options.length) evolving.push(item(str(context, 'buyer_tension') === 'none' ? 'Vous n’avez pas identifié de tension. Aucun compromis n’est créé ; vous pouvez garder vos critères et les confronter aux visites.' : 'Aucune tension précise n’est renseignée. Il est trop tôt pour fabriquer une comparaison personnalisée.', str(context, 'buyer_tension') === 'none' ? 'declared' : 'unknown', ['buyer_tension']));
  else {
    evolving.push(item(`Tension exprimée : ${buyerLabel('buyer_tension', str(context, 'buyer_tension'))}${str(context, 'buyer_tension') === 'other' && present(context, 'buyer_tension_detail') ? ` — ${str(context, 'buyer_tension_detail')}` : ''}. Les pistes ci-dessous restent conditionnelles.`, 'declared', ['buyer_tension', 'buyer_tension_detail']));
    const selected = options.find(option => option.id === str(context, 'buyer_option'));
    if (selected) evolving.push(item(`Piste que vous voulez examiner : ${selected.title}. Elle ne change aucun critère à votre place.`, 'conditional', ['buyer_tension', 'buyer_option'], selected.condition));
  }
  let next = { text: 'Nommer le changement le plus important dans votre quotidien.', why: 'Cet objectif donne un point de comparaison concret avant de choisir une typologie.', ids: ['buyer_goal'] };
  if (present(context, 'buyer_goal') || uses.length) next = budget === undefined
    ? { text: 'Définir votre enveloppe complète et faire vérifier les ressources.', why: 'Vos usages peuvent déjà guider les observations ; l’enveloppe doit être clarifiée avant une sélection par prix.', ids: ['buyer_goal', 'buyer_uses', 'buyer_budget_status', 'buyer_budget'] }
    : { text: 'Comparer les logements à partir de vos usages déclarés.', why: 'Un plan et une visite permettent de vérifier l’organisation, les trajets et l’état, au-delà de la surface affichée.', ids: ['buyer_uses', 'buyer_goal', 'buyer_budget'] };
  if (budget !== undefined && (!['checked', 'no_loan'].includes(financing) || !['included', 'separate'].includes(str(context, 'buyer_costs_status')))) next = { text: 'Faire préciser le coût complet et les ressources correspondant à votre enveloppe.', why: 'Le montant seul ne dit ni ce qu’il comprend ni les conditions de mobilisation des fonds.', ids: ['buyer_budget', 'buyer_costs_status', 'buyer_financing'] };
  if (str(context, 'buyer_prior_sale') === 'yes') next = { text: 'Vérifier ce que la vente rendra réellement disponible, et quand.', why: 'Cette dépendance doit être comprise avant de choisir l’ordre entre vente et achat. Vous pouvez poursuivre avec la lecture de transition.', ids: ['buyer_prior_sale'] };
  if (str(context, 'buyer_agreement') === 'discuss') next = { text: 'Mettre en commun les priorités qui restent différentes.', why: 'Un objectif commun ne peut pas être supposé à partir d’une seule réponse.', ids: ['buyer_agreement', 'buyer_goal'] };
  if (['found', 'committed'].includes(str(context, 'buyer_stage'))) next = { text: str(context, 'buyer_stage') === 'committed' ? 'Faire relire les conditions et dates de votre engagement.' : 'Vérifier le bien repéré au regard de vos usages et du coût complet.', why: 'Un bien identifié rend les vérifications concrètes. Mouaad peut organiser les points à vérifier ; la banque et le notaire restent compétents pour leurs domaines.', ids: ['buyer_stage', 'buyer_uses', 'buyer_budget', 'buyer_financing', 'buyer_prior_sale'] };
  return { ...base, title: 'Votre recherche, mise au clair', sections: sections(), options, nextDecision: { text: next.text, why: next.why, changesWith: 'Une correction de vos usages, du budget, du secteur, des dates ou une nouvelle vérification. Vous pouvez aussi attendre en conservant cette lecture.', ...domainEvidence(context, next.ids) }, limits: ['Cette lecture assemble vos déclarations ; elle ne vérifie pas des pièces, un financement ou un engagement.', 'Les repères DVF décrivent des ventes passées. Ils ne prouvent ni offre disponible, ni demande actuelle, ni capacité d’achat.', 'Une absence de réponse reste non renseignée. Aucun score de maturité, d’expérience ou de faisabilité n’est calculé.'] };
}

export function buyerImpact(questionId: string, raw: Context): Impact {
  const context = currentDomainContext(raw, buyerDependencies);
  const reading = buildBuyerReading(context);
  const related = reading.sections.flatMap(section => section.items).find(item => item.sourceAnswerIds?.includes(questionId));
  const generic: Record<number, Impact> = {
    1: { title: 'Le prochain pas dépend de votre avancement', text: 'Explorer un besoin, préparer une visite et relire un engagement demandent des vérifications différentes.', limit: 'L’avancement ne dit rien de votre expérience ni de votre financement.' },
    2: { title: 'Une raison de changer, pas une obligation supposée', text: 'Votre situation permet de distinguer un souhait et ce qui pourrait contraindre le calendrier.', limit: 'Nous ne déduisons aucune urgence de votre réponse.' },
    3: { title: 'La priorité devient un point de comparaison', text: 'Ce que vous cherchez à protéger guidera les observations de logements.', limit: 'Une priorité n’exclut pas automatiquement les autres besoins.' },
    4: { title: 'Un usage peut prendre plusieurs formes', text: 'Travailler au calme se vérifie par l’isolement réel, pas seulement par des mètres carrés.', limit: 'Aucun type de logement ou nombre de pièces n’est déduit.' },
    5: { title: 'Une déclaration garde son niveau de vérification', text: 'Montants, dates et secteurs donnent un cadre. Leurs conditions restent visibles.', limit: 'Aucune faisabilité financière ou disponibilité n’est validée.' },
    6: { title: 'Vous gardez la main sur les compromis', text: 'Seule une tension exprimée ouvre une comparaison. Chaque piste dit ce qu’elle exige.', limit: 'Une piste choisie n’accorde pas une souplesse sur vos critères.', comparison: buyerOptions(context) },
  };
  const sequence = getBuyerQuestions({ ...context, depth: 'deep' }).find(question => question.id === questionId)?.sequence ?? 1;
  return { ...generic[sequence], ...(related ? { text: related.text } : {}), ...domainEvidence(context, related?.sourceAnswerIds ?? [questionId]) };
}

export const buyerJourney: Journey = { project: 'buyer', title: 'Mettre votre recherche au clair', intro: 'Partir de votre quotidien, distinguer vos priorités et voir la prochaine vérification utile. Votre lecture reste accessible sans coordonnées.', sequences: BUYER_SEQUENCES, getQuestions: getBuyerQuestions, getImpact: buyerImpact, buildReading: buildBuyerReading };
