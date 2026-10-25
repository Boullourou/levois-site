import { resources } from '../../data/resources';
import { str, type Context, type Impact, type Journey, type Question, type Reading } from './types';

export type DiagnosticProject = 'buyer' | 'seller' | 'transition';
export interface DiagnosticResource { href: string; label: string; detail: string }
export const DIAGNOSTIC_METHOD_VERSION = 'diagnostic-2026-10-25';

type QuestionDefinition = { id: string; title: string; help?: string; choices: Record<string, string> };
const definitions: Record<DiagnosticProject, QuestionDefinition[]> = {
  buyer: [
    { id: 'diag_buyer_stage', title: 'Où en êtes-vous de votre recherche ?', choices: {
      thinking: 'Je commence à y réfléchir', searching: 'Je regarde les annonces', visiting: 'Je visite des logements', found: 'J’ai repéré un logement qui me plaît',
    } },
    { id: 'diag_buyer_blocker', title: 'Qu’est-ce qui vous freine le plus ?', choices: {
      no_matches: 'Je ne trouve pas le bon logement', budget: 'Je ne sais pas combien je peux emprunter', tradeoff: 'J’hésite entre le secteur et la surface', choosing: 'J’ai peur de me tromper de logement', none: 'Rien pour l’instant, je prépare la suite',
    } },
    { id: 'diag_buyer_priority', title: 'Qu’aimeriez-vous améliorer en premier ?', choices: {
      location: 'Mes trajets et mon quartier', space: 'La place pour vivre au quotidien', costs: 'Mes dépenses de logement', calm: 'Le calme chez moi', outdoors: 'Avoir un extérieur',
    } },
    { id: 'diag_buyer_financing', title: 'Avez-vous fait le point sur votre financement ?', help: 'Votre réponse indique où vous en êtes. Elle ne vaut pas accord de prêt.', choices: {
      not_started: 'Pas encore', talking: 'J’en parle avec une banque ou un courtier', reviewed: 'Une banque ou un courtier a étudié mon projet', no_loan: 'Je prévois d’acheter sans emprunt',
    } },
    { id: 'diag_buyer_timing', title: 'Quand aimeriez-vous emménager ?', choices: {
      exploring: 'Je n’ai pas encore de date', year: 'Dans l’année à venir', months: 'Dans les prochains mois', fixed: 'J’ai une date à respecter',
    } },
  ],
  seller: [
    { id: 'diag_seller_reason', title: 'Pourquoi envisagez-vous de vendre ?', choices: {
      move: 'Pour déménager ou acheter ailleurs', family: 'Ma situation familiale change', inherited: 'À la suite d’une succession', explore: 'Je veux savoir si vendre a du sens',
    } },
    { id: 'diag_seller_stage', title: 'Où en est votre vente ?', choices: {
      thinking: 'Je réfléchis, rien n’est décidé', preparing: 'Je prépare la mise en vente', listed: 'Le bien est en annonce', visits: 'Il y a déjà des visites', offer: 'J’ai reçu une offre',
    } },
    { id: 'diag_seller_blocker', title: 'Qu’est-ce qui vous préoccupe le plus ?', choices: {
      price: 'Je ne sais pas à quel prix vendre', underpricing: 'J’ai peur de vendre trop bas', no_contacts: 'L’annonce attire peu de contacts', no_offer: 'Les visites ne donnent pas d’offre', next_home: 'Je dois aussi trouver mon prochain logement', none: 'Rien de précis, je veux bien préparer la suite',
    } },
    { id: 'diag_seller_timing', title: 'Quand aimeriez-vous avoir vendu ?', choices: {
      exploring: 'Je n’ai pas encore de date', year: 'Dans l’année à venir', months: 'Dans les prochains mois', fixed: 'J’ai une date à respecter',
    } },
    { id: 'diag_seller_need', title: 'Qu’aimeriez-vous éclaircir maintenant ?', choices: {
      price: 'Comprendre ce qui justifie un prix', plan: 'Savoir par quoi commencer', visits: 'Comprendre les retours des acheteurs', options: 'Comparer vendre, attendre ou garder le bien', talk: 'En parler simplement avec quelqu’un',
    } },
  ],
  transition: [
    { id: 'diag_transition_reason', title: 'Pourquoi souhaitez-vous changer de logement ?', choices: {
      space: 'J’ai besoin d’un logement plus adapté', move: 'Je dois changer de secteur', family: 'Ma situation familiale change', explore: 'J’explore cette possibilité',
    } },
    { id: 'diag_transition_stage', title: 'Où en sont vos deux projets ?', choices: {
      thinking: 'Je réfléchis aux deux', sale_started: 'La vente est lancée, je cherche encore', searching: 'Je cherche à acheter, la vente n’est pas lancée', found: 'J’ai repéré mon prochain logement', engaged: 'Une offre ou un compromis est en cours',
    } },
    { id: 'diag_transition_fear', title: 'Qu’est-ce qui vous inquiète le plus ?', choices: {
      gap: 'Vendre et me retrouver sans logement', bridge: 'Devoir prendre un prêt relais', price: 'Ne pas récupérer assez de ma vente', dates: 'Ne pas réussir à faire coïncider les dates',
    } },
    { id: 'diag_transition_flexibility', title: 'Quelle marge avez-vous pour déménager ?', choices: {
      flexible: 'Je peux adapter ma date', fixed: 'J’ai une date à respecter', temporary: 'Un logement temporaire est envisageable', no_temporary: 'Je ne souhaite pas de logement temporaire',
    } },
    { id: 'diag_transition_financing', title: 'La banque a-t-elle étudié l’ensemble du projet ?', help: 'Vente, achat et éventuelle période entre les deux.', choices: {
      not_started: 'Pas encore', talking: 'Un échange est en cours', reviewed: 'Le projet a été étudié, les conditions restent à vérifier', no_loan: 'Je prévois de faire sans emprunt',
    } },
  ],
};

export const diagnosticAnswerLabels: Record<string, string> = Object.fromEntries(
  Object.values(definitions).flat().map(question => [question.id, question.title]),
);

const projectTitles: Record<DiagnosticProject, string> = {
  buyer: 'Votre recherche, plus claire.', seller: 'Votre vente, plus claire.', transition: 'Vendre et acheter, dans le bon ordre pour vous.',
};

function questions(project: DiagnosticProject): Question[] {
  return definitions[project].map((question, index) => ({
    id: question.id, title: question.title, help: question.help, type: 'choice', sequence: index + 1,
    sequenceTitle: question.title,
    choices: [...Object.entries(question.choices).map(([value, label]) => ({ value, label })), { value: 'unknown', label: 'Je ne sais pas encore' }],
  }));
}

/** Treat imported free text and obsolete choice codes as unknown, never as evidence. */
function answer(context: Context, id: string): string {
  const code = str(context, id);
  const question = Object.values(definitions).flat().find(question => question.id === id);
  return question && Object.hasOwn(question.choices, code) ? code : 'unknown';
}

interface Advice { observation: string; blindSpot: string; next: string }
function buyerAdvice(context: Context): Advice {
  const blocker = answer(context, 'diag_buyer_blocker');
  const financing = answer(context, 'diag_buyer_financing');
  const plans: Record<string, Advice> = {
    no_matches: {
      observation: 'Vous ne trouvez pas de logement qui vous convienne. Le premier point à éclaircir est ce qui manque dans les annonces que vous écartez.',
      blindSpot: 'Multiplier les critères peut masquer le besoin essentiel. À l’inverse, renoncer au secteur ou à la surface trop vite peut créer un problème au quotidien.',
      next: 'Cette semaine, reprenez trois annonces écartées. Pour chacune, notez le besoin concret non satisfait et distinguez indispensable et préférence.',
    },
    budget: {
      observation: 'Votre capacité d’achat reste votre première question. Tant que l’enveloppe complète est floue, comparer les logements est plus difficile.',
      blindSpot: 'Un prix affiché ou une simulation de mensualité ne couvre pas forcément les frais d’acquisition, les travaux et les autres dépenses du projet.',
      next: 'Cette semaine, préparez vos revenus, charges et apport pour un échange avec votre banque ou votre courtier. Demandez une enveloppe détaillant les frais et les conditions.',
    },
    tradeoff: {
      observation: 'Vous hésitez entre le secteur et la surface. Le choix utile se joue dans les usages et les trajets que chaque logement permet réellement.',
      blindSpot: 'Plus de mètres carrés ne compense pas forcément un trajet pénible. Un quartier apprécié ne garantit pas non plus une organisation intérieure adaptée.',
      next: 'Cette semaine, comparez deux annonces avec la même grille : trajets aux horaires habituels, pièces réellement utiles et dépenses. Gardez vos critères tant que ces points ne sont pas vérifiés.',
    },
    choosing: {
      observation: 'Vous voulez éviter un choix regretté. Il faut rendre visibles les vérifications qui vous aideront à décider, au-delà de la première impression.',
      blindSpot: 'Une visite agréable ne répond pas à toutes les questions sur le bruit, les charges, les travaux ou les documents du bien.',
      next: 'Cette semaine, écrivez vos trois questions encore sans réponse sur le logement. Demandez les documents correspondants et prévoyez une nouvelle visite si nécessaire.',
    },
    none: {
      observation: 'Vous ne signalez pas de blocage particulier. C’est le moment de préparer une recherche qui garde votre quotidien comme repère.',
      blindSpot: 'Commencer par les annonces sans nommer vos besoins peut vous faire comparer des logements qui ne répondent pas au même projet.',
      next: 'Cette semaine, notez ce que votre prochain logement doit améliorer et ce que vous voulez conserver. Transformez ces deux points en questions de visite.',
    },
    unknown: {
      observation: 'Votre priorité de recherche reste à préciser. Vos réponses ne permettent pas encore d’identifier un blocage particulier.',
      blindSpot: 'Ne pas savoir encore ne signifie pas que le projet est impossible. Une préférence supposée ne doit pas décider à votre place.',
      next: 'Cette semaine, complétez cette phrase : « Dans mon prochain logement, je voudrais surtout… ». Comparez ensuite ce besoin avec une annonce concrète.',
    },
  };
  const advice = { ...plans[blocker] };
  const stage = answer(context, 'diag_buyer_stage');
  const stages: Record<string, string> = {
    thinking: 'Vous commencez à réfléchir à un achat.', searching: 'Vous consultez déjà les annonces.',
    visiting: 'Vous avez commencé les visites.', found: 'Vous avez déjà repéré un logement.',
  };
  if (stages[stage]) advice.observation = `${stages[stage]} ${advice.observation}`;
  if (financing === 'not_started' && blocker !== 'budget') {
    advice.blindSpot += ' Votre financement reste aussi à examiner avec une banque ou un courtier.';
  } else if (financing === 'reviewed') {
    advice.blindSpot += ' L’étude bancaire que vous déclarez reste à rapprocher du bien choisi et de ses conditions.';
  } else if (financing === 'no_loan') {
    advice.blindSpot += ' Même sans emprunt, le montant disponible et tous les frais restent à vérifier.';
  }
  const priority = answer(context, 'diag_buyer_priority');
  const priorities: Record<string, string> = {
    location: 'Votre priorité déclarée : vos trajets et votre quartier.', space: 'Votre priorité déclarée : la place pour vivre.',
    costs: 'Votre priorité déclarée : les dépenses de logement.', calm: 'Votre priorité déclarée : le calme.', outdoors: 'Votre priorité déclarée : un extérieur.',
  };
  if (priorities[priority]) advice.observation += ` ${priorities[priority]}`;
  if (answer(context, 'diag_buyer_stage') === 'found' && blocker !== 'choosing') {
    advice.next += ' Appuyez-vous sur le logement déjà repéré.';
  }
  if (answer(context, 'diag_buyer_timing') === 'fixed') advice.next += ' Notez aussi votre date impérative avant tout engagement.';
  return advice;
}

function sellerAdvice(context: Context): Advice {
  const blocker = answer(context, 'diag_seller_blocker');
  const need = answer(context, 'diag_seller_need');
  const plans: Record<string, Advice> = {
    price: {
      observation: 'Vous cherchez un prix qui s’appuie sur des faits. Le montant nécessaire à votre prochain projet et la valeur du bien sont deux questions différentes.',
      blindSpot: 'Une moyenne communale ou le prix affiché par un voisin ne tient pas compte, à lui seul, de l’état, de l’emplacement et des particularités de votre bien.',
      next: 'Cette semaine, rassemblez les caractéristiques, les diagnostics et les travaux connus du bien. Demandez des comparaisons expliquées, en séparant prix affichés et ventes réalisées.',
    },
    underpricing: {
      observation: 'Votre préoccupation est de ne pas vendre trop bas. Vous avez besoin de comprendre les comparaisons qui justifient un prix, plutôt que de choisir le chiffre le plus rassurant.',
      blindSpot: 'Le prix le plus haut proposé n’est pas une preuve de valeur. Une baisse automatique n’est pas non plus une réponse à une absence de résultat.',
      next: 'Cette semaine, demandez pour chaque avis de prix les biens comparés, leurs différences et la date des informations. Notez les écarts qui demandent une explication.',
    },
    no_contacts: {
      observation: 'Vous signalez peu de contacts. La première vérification consiste à savoir si l’annonce est vue, puis ce que les personnes comprennent avant de vous contacter.',
      blindSpot: 'Le silence ne prouve pas que le prix est la seule cause. Il faut distinguer diffusion, présentation et adéquation du bien aux recherches.',
      next: 'Cette semaine, relevez sur la même période les vues, les demandes et les visites, quand ces chiffres existent. Ouvrez ensuite votre annonce sur téléphone pour noter ce qui est flou ou manquant.',
    },
    no_offer: {
      observation: 'Vous signalez des visites sans offre. Le point utile est de comprendre les objections précises qui reviennent, sans déduire automatiquement un problème de prix.',
      blindSpot: 'Un compliment ou un « nous allons réfléchir » n’explique pas le refus. Des retours vagues peuvent conduire à modifier le mauvais élément.',
      next: 'Cette semaine, rassemblez les retours des dernières visites : ce qui a plu, le frein précis et la suite donnée. Repérez ce qui se répète avant de changer le prix ou la présentation.',
    },
    next_home: {
      observation: 'Votre vente et votre prochain logement sont liés. Il faut regarder les dates et l’argent disponible ensemble avant de décider dans quel ordre avancer.',
      blindSpot: 'Un prix de vente espéré ne correspond pas forcément au montant disponible pour acheter. Vendre en premier peut aussi créer une période entre deux logements.',
      next: 'Cette semaine, posez sur une même feuille votre date souhaitée, le montant restant à rembourser et votre solution si l’achat ou la vente prend du retard. Faites préciser les montants par les professionnels concernés.',
    },
    none: {
      observation: 'Vous ne signalez pas de difficulté précise. Votre prochain pas peut rester léger : clarifier ce que la vente doit vous permettre de changer.',
      blindSpot: 'Publier une annonce avant d’avoir préparé les documents et le projet peut vous obliger à répondre dans l’urgence à des questions importantes.',
      next: 'Cette semaine, notez votre raison de vendre et listez les documents déjà disponibles. Choisissez une seule information manquante à retrouver avant la mise en vente.',
    },
    unknown: {
      observation: 'Votre difficulté principale reste à préciser. Les réponses disponibles ne permettent pas de conclure à un problème de prix ou de commercialisation.',
      blindSpot: 'Un conseil général ne suffit pas pour décider de vendre, d’attendre ou de modifier un prix sans connaître votre situation.',
      next: 'Cette semaine, écrivez la question dont la réponse vous aiderait le plus : le prix, le calendrier ou l’intérêt de vendre. Mouaad peut vous aider à préparer cette première vérification.',
    },
  };
  const advice = { ...plans[blocker] };
  const reason = answer(context, 'diag_seller_reason');
  const reasons: Record<string, string> = {
    move: 'Votre vente accompagne un changement de logement.', family: 'Votre situation familiale change.',
    inherited: 'Votre projet concerne un bien reçu en succession.', explore: 'Vous cherchez d’abord à savoir si vendre a du sens pour vous.',
  };
  if (reasons[reason]) advice.observation = `${reasons[reason]} ${advice.observation}`;
  if (['none', 'unknown'].includes(blocker)) {
    if (need === 'price') advice.next = plans.price.next;
    if (need === 'visits') advice.next = plans.no_offer.next;
    if (need === 'options') advice.next = 'Cette semaine, comparez vendre, attendre et garder le bien : ce que chaque option changerait pour vous, ses dépenses connues et les informations manquantes.';
    if (need === 'talk') advice.next = 'Cette semaine, préparez votre question principale et les informations déjà connues sur le bien pour un premier échange avec Mouaad.';
  }
  if (answer(context, 'diag_seller_reason') === 'inherited') {
    advice.blindSpot += ' Pour la succession que vous mentionnez, faites préciser au notaire qui doit décider et quels documents sont nécessaires.';
  }
  if (answer(context, 'diag_seller_stage') === 'offer') {
    advice.next = 'Cette semaine, rassemblez l’offre reçue, ses conditions et ses dates. Faites-les relire avec les professionnels concernés avant de décider sur le seul montant.';
  }
  if (answer(context, 'diag_seller_timing') === 'fixed') advice.next += ' Signalez dès maintenant votre date impérative : elle ne garantit pas le délai de vente.';
  return advice;
}

function transitionAdvice(context: Context): Advice {
  const fear = answer(context, 'diag_transition_fear');
  const plans: Record<string, Advice> = {
    gap: {
      observation: 'Votre première inquiétude est la période entre la vente et le prochain logement. Cette période doit être préparée avant de choisir l’ordre des opérations.',
      blindSpot: 'Une vente et un achat ne se terminent pas automatiquement à la même date. Une solution temporaire doit être acceptable, disponible et chiffrée.',
      next: 'Cette semaine, notez où vous pourriez vivre si les dates se décalent, pendant combien de temps et à quel coût. Si aucune solution ne vous convient, dites-le avant de fixer les dates.',
    },
    bridge: {
      observation: 'Le prêt relais est votre principale inquiétude. Avant d’envisager cette solution, vous avez besoin de comparer les coûts et les conditions des différents ordres possibles.',
      blindSpot: 'Acheter avant de vendre peut cumuler des charges. Le site ne peut ni valider un prêt relais, ni garantir le prix ou la date de votre vente.',
      next: 'Cette semaine, demandez à votre banque ou courtier de comparer vendre d’abord et acheter d’abord, en précisant les coûts, les conditions et ce qui se passe si la vente prend du retard.',
    },
    price: {
      observation: 'Vous vous interrogez sur ce que la vente laissera pour acheter. La somme réellement disponible compte davantage que le seul prix affiché.',
      blindSpot: 'Le remboursement du prêt et les frais éventuels peuvent réduire la somme mobilisable. Un prix espéré ne constitue pas de l’argent déjà disponible.',
      next: 'Cette semaine, retrouvez le capital restant dû et les frais à prévoir. Faites établir, avec les professionnels concernés, ce qui resterait réellement disponible selon plusieurs hypothèses de vente.',
    },
    dates: {
      observation: 'Faire coïncider les dates est votre première difficulté. Il faut distinguer les dates souhaitées de celles déjà prévues dans un engagement.',
      blindSpot: 'Une date annoncée peut dépendre du financement, des documents ou de l’autre transaction. Sa modification ne doit jamais être supposée acquise.',
      next: 'Cette semaine, réunissez les dates de vente, d’achat et de déménagement sur une même feuille. Faites confirmer leurs conditions par les interlocuteurs concernés et identifiez un décalage possible.',
    },
    unknown: {
      observation: 'Le principal point de blocage entre vente et achat reste à préciser. Aucun ordre ne peut être déclaré préférable avec ces seules réponses.',
      blindSpot: 'Commencer une opération sans regarder l’autre peut créer une difficulté de logement ou de financement qui aurait pu être anticipée.',
      next: 'Cette semaine, notez votre prochain logement souhaité, votre date idéale et ce que la vente doit financer. Choisissez ensuite la première information à faire vérifier avec Mouaad.',
    },
  };
  const advice = { ...plans[fear] };
  const reason = answer(context, 'diag_transition_reason');
  const reasons: Record<string, string> = {
    space: 'Vous souhaitez un logement plus adapté.', move: 'Vous avez besoin de changer de secteur.',
    family: 'Votre situation familiale change.', explore: 'Vous explorez encore la possibilité de déménager.',
  };
  if (reasons[reason]) advice.observation = `${reasons[reason]} ${advice.observation}`;
  const flexibility = answer(context, 'diag_transition_flexibility');
  if (flexibility === 'no_temporary') {
    advice.observation += ' Vous ne souhaitez pas de logement temporaire : cette limite doit guider la coordination.';
    if (fear === 'gap') advice.next = 'Cette semaine, notez votre refus d’un logement temporaire et demandez à Mouaad et au notaire quelles possibilités de coordination peuvent être examinées. Ne retenez aucune date sans en vérifier les conditions.';
  } else if (flexibility === 'fixed') {
    advice.next += ' Commencez par la date que vous ne pouvez pas déplacer.';
  } else if (flexibility === 'temporary') {
    advice.blindSpot += ' Le logement temporaire envisagé reste à confirmer en disponibilité et en coût.';
  }
  const financing = answer(context, 'diag_transition_financing');
  if (financing === 'not_started' && fear !== 'bridge') advice.blindSpot += ' L’ensemble du financement reste à examiner avec une banque ou un courtier.';
  if (financing === 'reviewed') advice.blindSpot += ' L’étude bancaire que vous déclarez ne remplace pas la vérification des conditions écrites.';
  if (financing === 'no_loan') advice.blindSpot += ' Même sans emprunt, vérifiez à quelle date l’argent sera réellement disponible.';
  if (answer(context, 'diag_transition_stage') === 'engaged') {
    advice.next = 'Cette semaine, rassemblez les offres ou compromis déjà en cours et leurs dates. Faites vérifier par le notaire et, si nécessaire, la banque ce qui dépend encore de la vente ou de l’achat.';
  }
  return advice;
}

function buildReading(project: DiagnosticProject, context: Context): Reading {
  const advice = project === 'buyer' ? buyerAdvice(context) : project === 'seller' ? sellerAdvice(context) : transitionAdvice(context);
  const sourceAnswerIds = definitions[project].map(question => question.id).filter(id => answer(context, id) !== 'unknown');
  return {
    id: `${context.id}-${project}-diagnostic-${context.revision}`, revision: context.revision,
    title: projectTitles[project], methodVersion: DIAGNOSTIC_METHOD_VERSION, generatedAt: context.updatedAt, deliveryMode: 'email-arbitrage-v1',
    sections: [
      { id: 'constat', title: 'Le constat', items: [{ text: advice.observation, kind: sourceAnswerIds.length ? 'declared' : 'unknown', sourceAnswerIds }] },
      { id: 'angle-mort', title: 'L’angle mort à surveiller', items: [{ text: advice.blindSpot, kind: 'conditional', sourceAnswerIds }] },
      { id: 'prochaine-etape', title: 'La prochaine étape utile', items: [{ text: advice.next, kind: 'conditional', sourceAnswerIds }] },
    ],
    nextDecision: { text: advice.next, why: 'Une action adaptée à vos réponses pour avancer sans précipiter votre décision.' },
    limits: ['Cette synthèse reprend vos déclarations. Elle ne fixe ni prix, ni délai de vente et ne valide aucun financement.'],
    projectSnapshot: project,
    answersSnapshot: Object.fromEntries(Object.entries(context.answers).map(([id, answer]) => [id, {
      ...answer, value: Array.isArray(answer.value) ? [...answer.value] : answer.value,
    }])),
    humanNotesSnapshot: (context.humanNotes ?? []).map(note => ({ ...note })),
  };
}

export function getDiagnosticJourney(project: DiagnosticProject): Journey {
  return {
    project, title: projectTitles[project], intro: '5 questions simples pour faire le point. Votre synthèse est accessible sans coordonnées.',
    sequences: definitions[project].map(question => question.title),
    getQuestions: () => questions(project),
    getImpact: (_questionId: string, context: Context): Impact => ({
      title: 'Votre réponse est prise en compte', text: 'Vous pouvez continuer ou modifier votre réponse.',
      limit: buildReading(project, context).limits[0],
    }),
    buildReading: (context: Context) => buildReading(project, context),
  };
}

function guide(slug: string, detail: string): DiagnosticResource {
  const resource = resources.find(resource => resource.slug === slug);
  if (!resource) throw new Error(`Unknown diagnostic resource: ${slug}`);
  return { href: `/ressources/${resource.slug}/`, label: resource.titre, detail };
}
const method = (detail: string): DiagnosticResource => ({ href: '/methode/', label: 'Comprendre, puis décider', detail });
const support = (detail: string): DiagnosticResource => ({ href: '/accompagnement/', label: 'Ce que Mouaad peut vérifier avec vous', detail });
const localSales = (detail: string): DiagnosticResource => ({ href: '/votre-rue/', label: 'Comprendre les ventes près de chez vous', detail });

/** Two real, distinct destinations; recommendations never trigger contact or data transmission. */
export function getDiagnosticResources(context: Context): DiagnosticResource[] {
  if (context.project === 'seller') {
    const blocker = answer(context, 'diag_seller_blocker');
    const need = answer(context, 'diag_seller_need');
    if (blocker === 'no_offer' || ['none', 'unknown'].includes(blocker) && need === 'visits') return [
      guide('retours-de-visite', 'Transformer les retours de visite en questions précises, avant de modifier quoi que ce soit.'),
      guide('verifier-avant-baisse-prix', 'Examiner plusieurs explications avant de décider d’un changement de prix.'),
    ];
    if (blocker === 'no_contacts') return [
      guide('annonce-vue-peu-de-contacts', 'Distinguer visibilité, contacts et visites pour trouver la première vérification utile.'),
      guide('premiere-impression-annonce', 'Relire la découverte de votre annonce sur téléphone.'),
    ];
    if (['price', 'underpricing'].includes(blocker) || need === 'price') return [
      guide('verifier-avant-baisse-prix', 'Comprendre les éléments qui justifient une comparaison de prix.'),
      localSales('Consulter des ventes réalisées, avec leurs limites : elles ne sont pas une estimation de votre bien.'),
    ];
    if (blocker === 'next_home' || answer(context, 'diag_seller_reason') === 'move') return [
      support('Comprendre comment relier la vente, l’achat et leurs dates avec Mouaad.'),
      guide('lancement-coherent', 'Préparer la vente en tenant compte de votre prochain projet.'),
    ];
    return [guide('lancement-coherent', 'Mettre les premières vérifications dans un ordre utile.'), method('Distinguer les informations connues des points à vérifier avant de décider.')];
  }
  if (context.project === 'buyer') {
    const blocker = answer(context, 'diag_buyer_blocker');
    if (blocker === 'budget' || answer(context, 'diag_buyer_financing') === 'not_started') return [
      method('Comprendre pourquoi un montant déclaré et un financement vérifié restent différents.'),
      support('Identifier ce qui se prépare avec Mouaad et ce qui relève de votre banque ou courtier.'),
    ];
    if (blocker === 'choosing' || answer(context, 'diag_buyer_stage') === 'found') return [
      support('Préparer les vérifications du logement et les questions pour la prochaine visite.'),
      method('Séparer la première impression des informations à confirmer avant de choisir.'),
    ];
    return [
      method(blocker === 'tradeoff' ? 'Comparer les trajets et les usages avant de renoncer au secteur ou à la surface.' : 'Transformer vos besoins du quotidien en critères de recherche concrets.'),
      localSales('Ajouter un repère historique sur un secteur. Les ventes passées ne décrivent ni l’offre actuelle ni votre capacité d’achat.'),
    ];
  }
  if (context.project === 'transition') {
    const fear = answer(context, 'diag_transition_fear');
    if (fear === 'price') return [
      guide('verifier-avant-baisse-prix', 'Distinguer le prix espéré d’une comparaison étayée avant de bâtir le prochain achat.'),
      support('Faire relier le montant réellement disponible et les dates des deux projets.'),
    ];
    if (fear === 'bridge') return [
      support('Identifier les vérifications à mener avec Mouaad, la banque et le notaire.'),
      method('Comparer des options sans considérer leur financement comme déjà acquis.'),
    ];
    return [
      support(fear === 'gap' ? 'Préparer la période éventuelle entre deux logements et les solutions acceptables pour vous.' : 'Relier les dates de vente et d’achat et préparer les vérifications nécessaires.'),
      guide('lancement-coherent', 'Préparer la mise en vente sans oublier ce qui dépend du prochain logement.'),
    ];
  }
  return [method('Clarifier les faits et les questions encore ouvertes.'), support('Comprendre ce qui peut être vérifié avec Mouaad.')];
}
