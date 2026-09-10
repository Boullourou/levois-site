import { situations, getSituation } from '../legacy/seller-v1/situations';
import { sellerQuestionId } from './legacy-seller';
import { str, list, type Context, type Journey, type Question, type Impact, type Reading, type ReadingItem, type ComparisonOption, type Choice } from './types';

export const SELLER_METHOD_VERSION = 'seller-2.0.0';
export const SELLER_UNKNOWN = 'unknown';
export const sellerSequences = ['Votre situation', 'Le bon diagnostic', 'Ce que l’on sait réellement', 'Les suites possibles', 'Votre lecture'];
const unknown: Choice = { value: SELLER_UNKNOWN, label: 'Je ne sais pas encore' };
const choice = (value: string, label: string, detail?: string): Choice => ({ value, label, ...(detail ? { detail } : {}) });
const question = (id: string, title: string, choices: Choice[], sequence = 2, help?: string): Question => ({ id, title, choices, sequence, sequenceTitle: sellerSequences[sequence - 1], type: 'choice', ...(help ? { help } : {}) });
export const sellerSituationQuestion: Question = question('seller_situation', 'Où en est votre vente aujourd’hui ?', [
  choice('reflexion', 'Je réfléchis encore à vendre'),
  ...situations.map(s => choice(s.id, s.titre, s.reconnaissance)),
  choice('offre', 'J’ai reçu une offre'),
  choice('incident', 'Un événement a changé la suite après engagement'),
  unknown,
], 1, 'Réfléchir à vendre, préparer une publication et régler une vente engagée ne demandent pas les mêmes décisions.');

// The question/choice contract is retained. Help is explanatory copy, not a
// historical answer: replace claims of reliability, ranking or urgency here.
const historicalHelp: Record<string, string> = {
  'preparer/prix': 'Le montant envisagé et les éléments qui le justifient sont deux informations distinctes.',
  'preparer/pret': 'Vous pouvez examiner la présentation avant publication et la reprendre ensuite si un point précis le justifie.',
  'preparer/documents': 'Lister les pièces disponibles et celles à retrouver aide à préparer les prochaines vérifications.',
  'publiee/modifications': 'Dater les modifications aide à les rapprocher des réactions, sans leur attribuer automatiquement un effet.',
  'peu-contacts/vues': 'Les vues donnent un repère de visibilité déclaré. Elles ne prouvent pas, seules, pourquoi une personne contacte ou non.',
  'peu-contacts/reactions': 'Le contenu et le nombre de contacts apportent des informations différentes à examiner ensemble.',
  'peu-contacts/origine-prix': 'L’origine du prix ne prouve pas la manière dont les acquéreurs le perçoivent.',
  'visites/nb-visites': 'Le nombre de visites situe les observations disponibles. Il ne mesure pas à lui seul leur fiabilité.',
  'visites/seconde-visite': 'Une seconde visite est une réaction à préciser ; elle ne garantit ni une offre ni un engagement.',
  'visites/remarques': 'Un retour précis, répété ou isolé, peut aider à poser une question. Sa portée reste à examiner.',
  'longtemps/duree': 'La durée situe l’historique de la vente. Elle ne prouve pas ce que les acquéreurs en pensent.',
  'longtemps/evolution': 'L’évolution et le niveau actuel des réactions apportent des repères complémentaires.',
};

/** All 24 historical questions, labels and existing choices are preserved. New unknowns are appended ONLY here. */
export const sellerHistoricalQuestions: Record<string, Question[]> = Object.fromEntries(situations.map(s => [s.id, s.questions.map(q => {
  const choices = q.options.map(o => choice(o.value, o.label));
  if (!choices.some(o => o.label === unknown.label)) choices.push(unknown);
  return question(sellerQuestionId(s.id, q.id), q.label, choices, 2, historicalHelp[`${s.id}/${q.id}`] ?? q.aide);
})]));

const reflectionQuestions = [
  question('seller_reflexion_changement', 'Qu’est-ce que vendre devrait rendre possible ?', [choice('achat', 'Changer de logement'), choice('organisation', 'Adapter ma vie ou mon organisation'), choice('ressources', 'Disposer de ressources pour un autre projet'), choice('allegement', 'Alléger les contraintes liées à ce bien'), unknown]),
  question('seller_reflexion_date', 'Y a-t-il une date qui compte déjà ?', [choice('souhaitee', 'Une date souhaitée, encore ajustable'), choice('contrainte', 'Une date liée à une contrainte à préciser'), choice('aucune', 'Pas de date particulière'), unknown]),
  question('seller_reflexion_attente', 'Qu’est-ce qu’attendre changerait pour vous ?', [choice('clarifier', 'Du temps pour clarifier mon projet'), choice('contraintes', 'Des contraintes à supporter plus longtemps'), choice('option', 'La possibilité de comparer d’autres solutions'), choice('renoncer', 'Je pourrais finalement renoncer à vendre'), unknown]),
  question('seller_reflexion_manque', 'Quel point manque pour décider sereinement ?', [choice('projet', 'Ce que je ferais après la vente'), choice('valeur', 'Un repère de valeur à vérifier'), choice('cout', 'Le coût complet des options'), choice('accord', 'L’accord des personnes concernées'), unknown]),
];
const offerQuestions: Question[] = [
  { id: 'seller_offre_montant', sequence: 2, sequenceTitle: sellerSequences[1], title: 'Quel montant est proposé, si vous le connaissez ?', type: 'number', optional: true, min: 0, max: 100000000, suffix: '€', help: 'Vous pouvez laisser ce montant inconnu. Il ne permet pas, seul, de recommander une réponse à l’offre.' },
  question('seller_offre_conditions', 'À quel point les conditions de l’offre sont-elles précisées ?', [choice('ecrites', 'J’ai un écrit avec les conditions'), choice('partielles', 'Certains points restent à préciser'), choice('orales', 'J’ai surtout un échange oral'), unknown]),
  question('seller_offre_calendrier', 'Comment son calendrier s’articule-t-il avec votre projet ?', [choice('semble-compatible', 'Il semble compatible, à confirmer'), choice('incompatible', 'Une date pose une difficulté'), choice('non-defini', 'Les dates ne sont pas définies'), unknown]),
  question('seller_offre_comparer', 'Qu’avez-vous besoin de comparer maintenant ?', [choice('plusieurs', 'Plusieurs offres et leurs conditions'), choice('projet', 'Cette offre avec mon projet et mes contraintes'), choice('manque', 'Il manque encore des informations pour comparer'), choice('attendre', 'Les conséquences d’une attente avant de répondre'), unknown]),
];
const incidentQuestions: Question[] = [
  question('seller_incident_changement', 'Qu’est-ce qui a changé depuis l’engagement ?', [choice('financement', 'Un élément de financement'), choice('calendrier', 'Une date ou une condition de calendrier'), choice('bien', 'Une information sur le bien'), choice('annulation', 'Une annulation ou une demande de retrait'), choice('autre', 'Un autre événement'), unknown]),
  question('seller_incident_statut', 'Sur quoi repose l’information que vous avez reçue ?', [choice('ecrit', 'Un écrit que je peux faire examiner'), choice('oral', 'Un échange oral à confirmer'), choice('contradictoire', 'Des informations contradictoires'), unknown]),
  { ...question('seller_incident_interlocuteurs', 'Qui a déjà été saisi de ce changement ?', [choice('notaire', 'Le notaire'), choice('professionnel', 'Le professionnel qui accompagne la vente'), choice('banque', 'L’établissement concerné par le financement'), choice('personne', 'Personne pour le moment'), unknown]), type: 'multiple', maxChoices: 3 },
  { id: 'seller_incident_question', sequence: 2, sequenceTitle: sellerSequences[1], title: 'Quelle question voulez-vous faire vérifier en priorité ?', type: 'text', optional: true, maxLength: 500, placeholder: 'Une question précise, sans donnée confidentielle.', help: 'LEVOIS organise les points ouverts ; il ne détermine pas les effets juridiques d’un engagement.' },
];
const factsQuestion = question('seller_appui', 'Sur quoi pouvez-vous appuyer cette lecture ?', [choice('documents', 'Des documents ou des relevés que je peux retrouver'), choice('notes', 'Des notes ou des retours précis à rassembler'), choice('impressions', 'Surtout mes impressions pour le moment'), unknown], 3, 'Un document déclaré disponible n’est pas encore une pièce vérifiée par LEVOIS.');
const afterQuestion = question('seller_apres_vente', 'La vente doit-elle permettre un prochain achat ?', [choice('dependant', 'Oui, l’achat dépend du produit de la vente'), choice('a-coordonner', 'Oui, les deux projets sont à coordonner'), choice('non', 'Non, ce n’est pas le sujet de cette vente'), unknown], 3, 'Cette réponse relie les décisions ; elle ne prouve pas les ressources réellement mobilisables.');
const rhythmQuestion = question('seller_rythme', 'Quel prochain pas voulez-vous préparer ?', [choice('verifier', 'Vérifier un point avant d’agir'), choice('agir', 'Examiner une adaptation ciblée'), choice('attendre', 'Attendre avec un point de réexamen'), choice('reformuler', 'Reformuler le projet, ou envisager de renoncer'), unknown], 4, 'Aucune réponse ne déclenche de relance ou de transmission.');

export function sellerNeedsTransition(context: Context): boolean {
  return ['dependant', 'a-coordonner'].includes(str(context, 'seller_apres_vente'))
    || (branch(context) === 'reflexion' && str(context, 'seller_reflexion_changement') === 'achat')
    || (branch(context) === 'preparer' && str(context, 'seller_preparer_prix') === 'financement')
    || (branch(context) === 'peu-contacts' && str(context, 'seller_peu_contacts_origine_prix') === 'besoin');
}

function branch(context: Context): string { return str(context, 'seller_situation'); }
function hasIncident(context: Context): boolean { return branch(context) === 'incident' || (branch(context) === 'longtemps' && str(context, 'seller_longtemps_preoccupation') === 'compromis-annule'); }
export function getSellerQuestions(context: Context): Question[] {
  const id = branch(context);
  const addedBranches: Record<string, Question[]> = { reflexion: reflectionQuestions, offre: offerQuestions, incident: incidentQuestions };
  const core = sellerHistoricalQuestions[id] ?? addedBranches[id];
  if (!core) return [sellerSituationQuestion];
  const extra = id === 'longtemps' && hasIncident(context) ? incidentQuestions : [];
  return [sellerSituationQuestion, ...core, ...extra, factsQuestion, afterQuestion, rhythmQuestion];
}

/** The UI may discard these hidden answer IDs after changing the selector; the reader also ignores them defensively. */
export function sellerInactiveAnswerIds(context: Context): string[] {
  const active = new Set(getSellerQuestions(context).map(q => q.id));
  return Object.keys(context.answers).filter(id => id.startsWith('seller_') && !active.has(id));
}

interface Focus { title: string; text: string; next: string; check: string; changes: string; sources: string[]; resource: string }
const focus = (title: string, text: string, next: string, check: string, changes: string, sources: string[], resource = 'lancement-coherent'): Focus => ({ title, text, next, check, changes, sources, resource });
const qid = sellerQuestionId;

function analyze(context: Context): Focus {
  const b = branch(context);
  const answer = (id: string) => str(context, qid(b, id));
  const sources = (...ids: string[]) => ids.map(id => qid(b, id)).filter(id => !!context.answers[id]);
  if (hasIncident(context)) return focus('Clarifier les effets du changement', 'Un événement après engagement demande de distinguer ce qui a été annoncé, ce qui est confirmé par écrit et ce qui reste à faire vérifier. Il ne suffit pas à conclure que la vente peut être relancée.', 'Rassembler l’écrit disponible et faire préciser les points ouverts par les interlocuteurs concernés.', 'La portée de l’événement, les engagements en cours et les réponses du notaire ou du professionnel compétent restent à vérifier.', 'Un écrit confirmé, une réponse de l’interlocuteur compétent ou un changement de calendrier.', ['seller_incident_changement', 'seller_incident_statut', 'seller_incident_interlocuteurs', 'seller_longtemps_preoccupation'].filter(id => !!context.answers[id]), 'reprendre-commercialisation');
  if (b === 'offre') return focus('Comparer davantage que le montant', 'Le montant d’une offre, ses conditions et ses dates doivent être lus ensemble. Les éléments que vous déclarez ne permettent pas de recommander automatiquement une acceptation ou un refus.', 'Mettre les conditions, les dates et les points non confirmés sur une même grille avant de choisir une réponse.', 'L’écrit de l’offre, les conditions non précisées et leur compatibilité avec votre projet demandent une vérification humaine avant engagement.', 'Une condition précisée, une autre offre, une date différente ou un besoin de votre projet réévalué.', ['seller_offre_montant', 'seller_offre_conditions', 'seller_offre_calendrier', 'seller_offre_comparer'].filter(id => !!context.answers[id]), 'verifier-avant-baisse-prix');
  if (b === 'reflexion') return focus('Décider ce que la vente doit changer', 'Vous pouvez comparer vendre, attendre et reformuler le projet avant de décider une publication. Une estimation n’est pas nécessaire pour commencer à préciser ce changement.', str(context, 'seller_reflexion_manque') === 'accord' ? 'Clarifier avec les personnes concernées le changement recherché et les décisions qui demandent leur accord.' : 'Écrire ce que vendre permettrait, ce qu’attendre changerait, puis choisir le point manquant à vérifier.', 'La valeur du bien, le coût des options et les contraintes de date ne sont pas établis par cette réflexion.', 'Un changement souhaité plus précis, un accord clarifié ou une contrainte nouvelle.', ['seller_reflexion_changement', 'seller_reflexion_attente', 'seller_reflexion_manque', 'seller_reflexion_date'].filter(id => !!context.answers[id]));
  if (b === 'preparer') {
    if (answer('calendrier') === 'indecis') return focus('Séparer la décision de vendre de la préparation', 'La décision de vendre reste ouverte d’après vous. Préparer des informations peut être utile sans vous engager à publier.', 'Préciser ce que la vente doit permettre et ce qui ferait préférer attendre.', 'Le bon moment ne se déduit pas d’un délai annoncé ; il dépend de votre projet et des contraintes réelles.', 'La décision de vendre se précise ou une contrainte de date apparaît.', sources('calendrier', 'decision-difficile'));
    if (answer('prix') === 'financement') return focus('Distinguer besoin de financement et valeur du bien', 'Le montant utile au prochain projet et la valeur défendable du logement répondent à deux questions différentes. L’un ne valide pas l’autre.', 'Séparer le besoin du prochain projet des éléments qui pourraient justifier un prix, puis relier vente et achat.', 'Les ressources nettes, leur disponibilité et la valeur du bien ne sont pas confirmées.', 'Des ressources confirmées, un projet revu ou une comparaison du bien étayée.', sources('prix'), 'verifier-avant-baisse-prix');
    if (['travaux', 'preparation', 'presque'].includes(answer('pret'))) return focus('Préparer ce qui rend le logement lisible', 'Vous signalez des éléments encore à traiter. Leur présence ne prouve pas qu’un travail coûteux est nécessaire ni qu’il serait rentabilisé.', 'Distinguer les informations manquantes, les réparations utiles et la présentation avant de choisir ce qui sera fait.', 'L’état réel, les éventuels travaux et leur utilité restent à examiner sur place.', 'L’état du logement, les documents disponibles ou les contraintes de temps changent.', sources('pret', 'documents'));
    if (['en-ligne', 'avis-differents'].includes(answer('prix'))) return focus('Comprendre l’origine du prix envisagé', 'Une estimation isolée ou plusieurs avis différents donnent des points de départ à examiner. Ils ne suffisent pas à fixer un prix défendable.', 'Comparer les hypothèses des avis et les caractéristiques des références avant de choisir le prix de présentation.', 'Aucune valeur précise ni disponibilité actuelle ne se déduit de ces réponses.', 'Des références mieux comparables, un état du bien précisé ou un avis documenté.', sources('prix'), 'verifier-avant-baisse-prix');
    return focus('Mettre la préparation dans un ordre utile', 'Calendrier, présentation et documents se préparent ensemble. Avoir déclaré le bien prêt ne permet pas encore de vérifier la cohérence du lancement.', 'Rassembler les documents disponibles, noter ce qui manque, puis rapprocher présentation, calendrier et prix envisagé.', 'Les pièces, l’état du logement et la comparaison locale n’ont pas été vérifiés ici.', 'Un document manquant, une contrainte réelle ou une différence entre les références retenues.', sources('calendrier', 'pret', 'documents'));
  }
  if (b === 'publiee') {
    if (answer('signaux') === 'pas-acces' || answer('duree') === 'ne-sait-plus') return recordFocus(sources('signaux', 'duree'));
    if (answer('modifications') === 'plusieurs') return changesFocus(sources('modifications'), 'annonce-vue-peu-de-contacts');
    if (['moins-7j', '1-2sem'].includes(answer('duree'))) return focus('Observer une publication récente', 'Une publication récente n’est pas, à elle seule, le signe d’un problème. Il faut dater les observations et les distinguer avant d’attribuer une cause au peu de réactions.', 'Choisir ce que vous allez relever et un moment de réexamen adapté à vos contraintes.', 'Aucun délai universel ne garantit des contacts ; quelques jours ne suffisent pas à isoler l’effet du prix.', 'Une difficulté manifeste de diffusion, des retours précis ou une contrainte nouvelle.', sources('duree', 'signaux'), 'annonce-vue-peu-de-contacts');
    if (answer('signaux') === 'peu-de-tout') return diffusionFocus(sources('signaux'));
    if (answer('signaux') === 'vues-sans-contacts') return contactFocus(sources('signaux'));
    return focus('Distinguer les premiers signaux', 'Une vue, une demande et une visite correspondent à des étapes différentes. Les rassembler dans un seul indicateur empêcherait de savoir ce qu’il faut vérifier.', 'Relever séparément diffusion, consultations, demandes et visites sur la même période.', 'Ces observations ne suffisent pas à conclure sur le prix ou sur la qualité du logement.', 'Une étape précise ressort des observations ou un retour explicite éclaire la suite.', sources('signaux', 'attente'), 'annonce-vue-peu-de-contacts');
  }
  if (b === 'peu-contacts') {
    if (['pas-acces', SELLER_UNKNOWN].includes(answer('vues'))) return recordFocus(sources('vues'));
    if (['peu', 'variable'].includes(answer('vues'))) return diffusionFocus(sources('vues'));
    if (['questions', 'sans-lien', 'silence'].includes(answer('reactions'))) return focus('Clarifier ce qui retient les contacts', 'Les demandes décrites ne deviennent pas toutes des visites. Cela invite à vérifier ce que les personnes ont compris du bien et ce qu’elles cherchaient.', 'Noter la question posée, le besoin exprimé et le point qui a empêché de poursuivre, sans qualifier une personne à sa place.', 'Un contact sans suite ne démontre ni un mauvais projet ni un défaut du logement.', 'Des raisons précises remplacent les suppositions ou la présentation du bien change.', sources('reactions'), 'annonce-vue-peu-de-contacts');
    if (answer('vues') === 'nombreuses' && answer('reactions') === 'aucune') return contactFocus(sources('vues', 'reactions'));
    if (answer('origine-prix') === 'besoin') return focus('Séparer besoin du projet et comparaison du bien', 'Le montant nécessaire à votre projet explique un objectif personnel. Il ne suffit pas à établir ce qu’un acquéreur pourrait comparer au même budget.', 'Examiner séparément les ressources nécessaires et les références utilisées pour présenter le bien.', 'Aucune baisse, valeur certaine ou capacité de financement ne découle de ces réponses.', 'Un besoin financier confirmé ou des références comparables documentées.', sources('origine-prix'), 'verifier-avant-baisse-prix');
    return focus('Vérifier la première impression', 'La fragilité que vous percevez dans l’annonce est une piste à examiner, pas une cause établie du faible nombre de contacts.', 'Comparer la première photographie, le titre et les informations avec la réalité du logement, puis choisir un seul point à tester.', 'L’annonce et ses statistiques n’ont pas été examinées ici ; leur relation avec les demandes reste à vérifier.', 'Un défaut concret est trouvé ou les statistiques montrent une autre étape à examiner.', sources('fragile', 'vues', 'reactions'), 'premiere-impression-annonce');
  }
  if (b === 'visites') {
    if (['vagues', SELLER_UNKNOWN, ''].includes(answer('remarques')) || answer('moment') === 'ne-sait-pas') return visitFeedbackFocus(sources('remarques', 'moment'));
    if (answer('remarques') === 'travaux' || answer('moment') === 'apres-travaux') return focus('Préciser ce que les travaux changent', 'Les travaux reviennent dans les retours que vous décrivez. Leur coût, la gêne envisagée et la capacité à se projeter sont des questions différentes.', 'Demander quel travail précis retient la décision, puis rassembler les informations disponibles avant de comparer les adaptations possibles.', 'Aucun coût de travaux, effet sur la valeur ou baisse de prix n’est calculé à partir de ces retours.', 'Un devis, une information précise ou une raison différente apparaît dans les retours.', sources('remarques', 'moment'), 'retours-de-visite');
    if (answer('remarques') === 'environnement') return focus('Distinguer le bien et le projet du visiteur', 'Un retour sur l’environnement peut révéler une incompatibilité avec le quotidien d’un visiteur. Il ne signifie pas que le même point retiendra toutes les personnes.', 'Préciser le besoin concerné et vérifier que l’annonce donne assez tôt les informations utiles.', 'La fréquence d’une remarque ne mesure pas, à elle seule, son effet sur une décision.', 'Le besoin exprimé ou les informations données avant la visite changent.', sources('remarques'), 'retours-de-visite');
    if (answer('remarques') === 'prix-comparaison' || answer('moment') === 'apres-comparaison') return focus('Comprendre la comparaison après visite', 'Vous rapportez une comparaison avec d’autres solutions. Le montant seul ne dit pas quels usages, travaux ou contraintes ont fait la différence.', 'Demander ce que l’autre solution permettait et comparer les caractéristiques utiles avant de choisir un ajustement.', 'Les biens cités et leur disponibilité n’ont pas été vérifiés ; aucune baisse n’est recommandée automatiquement.', 'Les alternatives réelles ou les raisons de préférence sont précisées.', sources('remarques', 'moment'), 'verifier-avant-baisse-prix');
    return focus('Rapprocher promesse et découverte', 'Les retours de visite permettent de comparer ce que la présentation laissait attendre avec ce que les personnes ont compris sur place.', 'Retenir un retour concret et distinguer information à préciser, limite du bien et attente propre au visiteur.', 'Sans compte rendu précis, l’absence d’offre n’isole aucune cause.', 'Un retour plus précis confirme ou contredit la piste retenue.', sources('remarques', 'moment', 'modifier'), 'retours-de-visite');
  }
  if (b === 'longtemps') {
    if (['retirer', 'change', 'calendrier-change'].includes(answer('projet')) || answer('preoccupation') === 'fatigue') return focus('Réexaminer le projet avant de relancer', 'Le projet ou ce que le processus vous demande mérite d’être repris. Une durée longue n’impose ni une baisse ni une nouvelle publication.', 'Comparer poursuivre, suspendre sous conditions et reformuler la vente à partir du projet actuel.', 'Les conséquences d’une suspension et les engagements en cours doivent être vérifiés avant toute décision.', 'Votre projet, votre disponibilité ou une contrainte engagée change.', sources('projet', 'preoccupation'), 'reprendre-commercialisation');
    if (answer('evolution') === 'pas-donnees') return recordFocus(sources('evolution'), 'reprendre-commercialisation');
    if (answer('modifications') === 'plusieurs') return changesFocus(sources('modifications'), 'reprendre-commercialisation');
    if (answer('evolution') === 'visites-sans-suite') return visitFeedbackFocus(sources('evolution'));
    return focus('Relire l’historique avant un nouvel ajustement', 'Une vente longue a connu des périodes, des modifications et des réactions différentes. La durée seule n’explique pas ce qui bloque aujourd’hui.', 'Rapprocher les dates, les changements et les retours pour choisir ce qui mérite une vérification ciblée.', 'Une coïncidence entre changement et réactions n’établit pas un effet causal ni un prix juste.', 'Un historique complété, une nouvelle comparaison ou une évolution du projet.', sources('duree', 'modifications', 'evolution'), 'reprendre-commercialisation');
  }
  return focus('Distinguer votre situation avant de conclure', 'Réfléchir à vendre, publier, observer des réactions et répondre à une offre sont des décisions différentes.', 'Choisir la situation qui ressemble le plus à ce que vous vivez, ou conserver cette première distinction.', 'Sans situation précisée, aucune hypothèse personnalisée sur une vente n’est proposée.', 'Votre situation se précise.', []);
}

const recordFocus = (sources: string[], resource = 'annonce-vue-peu-de-contacts') => focus('Construire un relevé utile', 'L’absence de statistiques n’est pas la preuve d’une absence d’intérêt. Elle désigne l’information à obtenir avant d’attribuer une cause.', 'Retrouver la période de diffusion et demander un relevé séparant vues, demandes et visites.', 'Sans période comparable ni retours précis, aucun diagnostic sur le prix ou la présentation n’est établi.', 'Des chiffres datés ou des retours précis deviennent disponibles.', sources, resource);
const diffusionFocus = (sources: string[]) => focus('Vérifier où l’annonce est visible', 'Des consultations peu nombreuses ou différentes selon les supports invitent d’abord à vérifier les recherches dans lesquelles l’annonce apparaît.', 'Reproduire une recherche correspondant au bien sur ses supports de diffusion et noter les différences.', 'Le nombre de vues déclaré ne permet pas de séparer automatiquement diffusion, présentation et positionnement.', 'La visibilité réelle ou la période observée est précisée.', sources, 'annonce-vue-peu-de-contacts');
const contactFocus = (sources: string[]) => focus('Examiner le passage de la vue à la demande', 'Vous décrivez des vues qui deviennent peu de demandes. La présentation, les informations et le positionnement sont des pistes à examiner séparément.', 'Vérifier ce qu’une personne comprend de l’annonce avant de la contacter, puis choisir une seule hypothèse à tester.', 'Des consultations ne sont pas une demande d’achat ; elles ne prouvent pas quel élément retient le contact.', 'Une information manquante est trouvée ou les réactions changent après une adaptation isolée.', sources, 'premiere-impression-annonce');
const changesFocus = (sources: string[], resource: string) => focus('Séparer les changements pour les comprendre', 'Plusieurs éléments modifiés ensemble rendent difficile l’attribution d’une réaction à un levier précis.', 'Reconstituer ce qui a changé et quand, puis choisir un prochain point à observer séparément.', 'L’historique déclaratif ne suffit pas à prouver l’effet d’une modification.', 'Les dates sont retrouvées ou un changement isolé devient observable.', sources, resource);
const visitFeedbackFocus = (sources: string[]) => focus('Obtenir un retour concret', 'Sans retour précis, l’absence d’offre ne permet pas d’isoler une cause. Un nombre de visites ne remplace pas ce qui a retenu la décision.', 'Demander ce qui a été apprécié et ce qui a empêché de poursuivre, puis classer les réponses par raison.', 'Une même remarque peut avoir des conséquences différentes selon le projet de la personne.', 'Plusieurs retours précis décrivent la même difficulté ou une raison nouvelle apparaît.', sources, 'retours-de-visite');

function optionsFor(context: Context, f: Focus): ComparisonOption[] {
  if (hasIncident(context)) return [
    { id: 'clarifier', title: 'Faire clarifier les points ouverts', consequence: 'Rassembler les écrits et demander ce qui est confirmé ou doit encore être décidé.', condition: 'Avec les interlocuteurs déjà concernés par l’engagement.', limit: 'LEVOIS ne détermine pas les effets juridiques de l’événement.' },
    { id: 'attendre', title: 'Différer une nouvelle décision commerciale', consequence: 'Conserver les informations disponibles pendant la clarification.', condition: 'Après vérification des échéances et obligations en cours auprès de l’interlocuteur compétent.', limit: 'Attendre n’efface aucun engagement et n’autorise pas automatiquement une nouvelle publication.' },
  ];
  if (branch(context) === 'offre') return [
    { id: 'clarifier', title: 'Faire préciser l’offre', consequence: 'Obtenir les conditions ou dates qui manquent à la comparaison.', condition: 'Si la proposition laisse des points ouverts.', limit: 'Aucune acceptation ni aucun refus automatique.' },
    { id: 'comparer', title: 'Comparer les propositions sur la même grille', consequence: 'Mettre en regard montant, conditions, calendrier et contraintes du projet.', condition: 'Si les informations nécessaires sont disponibles et comparables.', limit: 'Le financement et la portée des engagements restent à faire vérifier.' },
    { id: 'attendre', title: 'Examiner ce qu’une attente changerait', consequence: 'Identifier les informations qu’un délai pourrait apporter.', condition: 'Faire vérifier les échéances de l’offre et les engagements avant de différer la réponse.', limit: 'La disponibilité de l’offre ne peut pas être supposée maintenue.' },
  ];
  return [
    { id: 'verifier', title: 'Vérifier avant d’ajuster', consequence: f.next, condition: 'Si le point manquant peut éclairer la décision.', limit: f.check },
    { id: 'adapter', title: branch(context) === 'reflexion' ? 'Préparer ou reformuler le projet' : 'Examiner une adaptation ciblée', consequence: branch(context) === 'reflexion' ? 'Comparer ce que vendre, garder le bien ou changer de projet rendrait possible.' : 'Choisir un seul levier à examiner et le résultat que vous chercherez à observer.', condition: 'Si une raison précise justifie ce changement et que vous le choisissez.', limit: 'Aucune dépense, baisse de prix ou efficacité n’est supposée nécessaire ou garantie.' },
    { id: 'attendre', title: 'Attendre avec un point de réexamen', consequence: 'Conserver la lecture et choisir quelle information ou quel événement justifiera de la reprendre.', condition: 'Si cette attente est compatible avec votre projet et les engagements à vérifier.', limit: 'Attendre ne garantit pas de nouvelles réactions. Renoncer ou reformuler reste possible selon vos contraintes.' },
  ];
}

function selectedLabel(context: Context, q: Question): string | undefined {
  const answer = context.answers[q.id]?.value;
  if (Array.isArray(answer)) { const labels = answer.map(v => q.choices?.find(o => o.value === v)?.label).filter(Boolean); return labels.length ? labels.join(' ; ') : undefined; }
  if (answer === null || answer === undefined || answer === '') return undefined;
  if (q.type === 'number') { const n = Number(answer); return Number.isFinite(n) && n >= (q.min ?? -Infinity) && n <= (q.max ?? Infinity) ? `${n.toLocaleString('fr-FR')} ${q.suffix ?? ''}`.trim() : undefined; }
  if (q.type === 'text') return typeof answer === 'string' ? answer.slice(0, q.maxLength ?? 500) : undefined;
  return q.choices?.find(o => o.value === answer)?.label;
}
function isUnknown(context: Context, q: Question): boolean {
  const v = str(context, q.id);
  if (!selectedLabel(context, q)) return true;
  if (v === SELLER_UNKNOWN || list(context, q.id).includes(SELLER_UNKNOWN)) return true;
  const b = branch(context);
  const source = getSituation(b)?.questions.find(item => qid(b, item.id) === q.id);
  return !!source?.options.find(o => o.value === v)?.inconnue || ['ne-sait-pas', 'ne-sait-plus', 'pas-info', 'pas-donnees', 'pas-acces'].includes(v);
}

const questionLessons: Record<string, string> = {
  calendrier: 'Un souhait de date et une contrainte engagée ne se traitent pas de la même façon. Préciser la contrainte aide à choisir l’ordre des préparations.',
  prix: 'L’origine d’un prix est distincte de sa justification. Une estimation ou un besoin personnel doit être rapproché d’éléments comparables.',
  decision_difficile: 'Nommer la décision difficile permet de choisir la vérification utile ; cela ne prouve pas encore quel levier modifier.',
  pret: 'Être prêt pour les photos et prêt pour les visites sont des éléments à vérifier concrètement ; aucun travail coûteux n’est déduit de cette réponse.',
  documents: 'Les pièces disponibles et les pièces manquantes peuvent être listées avant de publier. Leur présence déclarée ne vaut pas contrôle de leur contenu.',
  duree: 'Une durée donne un cadre aux réactions, pas la cause d’un blocage. Notez les interruptions et la période réellement observée.',
  signaux: 'Les vues, demandes et visites correspondent à des étapes différentes ; savoir où elles se séparent indique quoi examiner.',
  modifications: 'Un changement daté est plus facile à relire. Si plusieurs éléments ont changé, aucun effet ne peut être attribué automatiquement à un seul.',
  attente: 'Préciser ce que cette période doit vous apprendre aide à choisir les observations utiles, sans promettre un résultat dans un délai donné.',
  vues: 'Une consultation ne signifie pas une demande d’achat. La visibilité et la transformation en contact se vérifient séparément.',
  reactions: 'La raison exprimée par une personne est plus utile que de supposer son sérieux ou sa motivation.',
  fragile: 'La fragilité perçue reste une hypothèse. Il faut un élément observable avant de décider de modifier l’annonce.',
  origine_prix: 'Le montant nécessaire à un projet, une estimation et des annonces de comparaison n’ont pas la même portée.',
  nb_visites: 'Le nombre de visites décrit une activité. Les raisons de poursuivre ou de renoncer restent à recueillir.',
  seconde_visite: 'Une seconde visite n’assure pas une offre ; son absence ne désigne pas la cause d’un refus.',
  remarques: 'Une remarque précise aide à distinguer une information à apporter, une limite du bien ou un besoin propre au visiteur.',
  moment: 'Le moment où l’intérêt semble changer est une piste d’observation, à confronter à ce que la personne a réellement exprimé.',
  modifier: 'Ce que vous pensez devoir changer n’est pas encore un diagnostic. Comparez cette idée aux retours concrets avant de choisir.',
  evolution: 'Lire l’évolution exige des périodes comparables ; des réactions irrégulières n’expliquent pas leur cause.',
  preoccupation: 'Votre préoccupation aide à choisir le prochain pas. Elle ne vous oblige ni à poursuivre ni à relancer la vente.',
  projet: 'Si le projet change, les décisions de commercialisation doivent être réexaminées. Poursuivre la même stratégie n’est pas une obligation automatique.',
};

function getSellerImpact(id: string, context: Context): Impact {
  const f = analyze(context);
  const q = getSellerQuestions(context).find(q => q.id === id);
  if (id === 'seller_situation') return { title: f.title, text: f.text, limit: f.check };
  if (id === 'seller_apres_vente') return sellerNeedsTransition(context)
    ? { title: 'Relier la vente au prochain achat', text: 'La vente et l’achat appartiennent au même projet. Le montant disponible, les dates et une solution d’intervalle doivent être distingués avant de comparer leur ordre.', limit: 'Aucune ressource ni faisabilité de financement n’est confirmée par cette réponse.' }
    : { title: 'Le projet après la vente reste distinct', text: str(context, id) === 'non' ? 'Vous n’avez pas indiqué de prochain achat à coordonner. La lecture peut rester centrée sur la vente.' : 'Le lien avec un prochain achat reste inconnu. Aucun achat dépendant n’est supposé.', limit: 'Cette information pourra être corrigée si le projet évolue.' };
  if (id === 'seller_appui') return { title: 'Distinguer information disponible et vérification', text: str(context, id) === 'documents' ? 'Vous déclarez pouvoir retrouver des documents ou relevés. Ils pourront servir à examiner les pistes, mais LEVOIS n’en a pas contrôlé le contenu.' : 'Les notes ou impressions peuvent aider à poser une question. Il reste à retrouver une période, un retour précis ou une pièce pour l’examiner.', limit: 'Confirmer une réponse ne transforme pas sa déclaration en preuve externe.' };
  if (id === 'seller_rythme') return { title: str(context, id) === 'attendre' ? 'Une attente peut avoir une raison précise' : str(context, id) === 'reformuler' ? 'Revenir au projet est un prochain pas possible' : 'Choisir une suite proportionnée', text: str(context, id) === 'attendre' ? 'Conservez ce qui est compris et choisissez l’information ou l’événement qui vous fera réexaminer la situation.' : f.next, limit: 'Les engagements en cours restent à vérifier. Aucune relance ou transmission n’est déclenchée.', comparison: optionsFor(context, f) };
  if (q && isUnknown(context, q)) return { title: 'L’inconnu indique quoi vérifier', text: `Ce point reste ouvert : ${q.title} Vous pouvez poursuivre ; il apparaîtra parmi les vérifications de votre lecture.`, limit: 'Une absence de réponse ne devient ni un fait, ni une préférence, ni une cause du résultat.' };
  if (id === 'seller_offre_conditions') return { title: 'Faire apparaître les conditions ouvertes', text: str(context, id) === 'ecrites' ? 'Vous avez déclaré un écrit. Ses conditions peuvent être relevées pour les comparer, mais leur portée n’a pas été examinée ici.' : 'Des points partiels ou oraux demandent d’être précisés avant de comparer l’offre. Le montant ne remplit pas ces inconnues.', limit: 'Une déclaration d’écrit n’établit ni la sécurité de l’offre ni sa portée juridique.' };
  if (id === 'seller_offre_calendrier') return { title: 'Comparer les dates avec le projet', text: str(context, id) === 'incompatible' ? 'Vous signalez une difficulté de date. Il faut nommer la date concernée et ce qui en dépend avant de savoir si une adaptation est possible.' : str(context, id) === 'semble-compatible' ? 'Une compatibilité perçue est un point à confirmer avec les personnes et engagements concernés.' : 'Les dates de l’offre restent à poser avant de les rapprocher des contraintes du projet.', limit: 'Aucune souplesse de calendrier ni possibilité de reporter un engagement n’est supposée.' };
  if (id === 'seller_reflexion_attente') return { title: 'Comparer ce que l’attente apporte et demande', text: str(context, id) === 'renoncer' ? 'Vous envisagez de ne pas vendre. Cette possibilité peut être examinée en comparant ce qu’elle préserverait et les contraintes qui resteraient.' : str(context, id) === 'contraintes' ? 'Attendre prolongerait certaines contraintes d’après vous. Les nommer permet de comparer le coût de l’attente avec les informations qu’elle pourrait apporter.' : 'L’attente peut servir à clarifier le projet ou à comparer d’autres solutions. Choisissez ce que ce temps doit vous permettre de comprendre.', limit: 'Attendre ne suppose ni absence de coût ni absence d’engagement.' };
  if (id === 'seller_incident_statut') return { title: 'Préciser la portée de l’information', text: str(context, id) === 'ecrit' ? 'L’écrit déclaré peut être présenté à l’interlocuteur compétent. Sa présence ne signifie pas que son effet a déjà été confirmé.' : 'L’information orale ou contradictoire doit être confirmée avant d’en déduire la suite de la vente.', limit: 'Aucun droit, délai ou effet d’annulation n’est déterminé automatiquement.' };
  const historical = getSituation(branch(context))?.questions.find(item => qid(branch(context), item.id) === id);
  const lesson = historical ? questionLessons[historical.id.replaceAll('-', '_')] : undefined;
  return { title: historical ? 'Ce que cette réponse permet de distinguer' : f.title, text: lesson ? `Vous indiquez « ${q ? selectedLabel(context, q) : ''} ». ${lesson}` : q && selectedLabel(context, q) ? `Vous indiquez « ${selectedLabel(context, q)} ». ${f.text}` : f.text, limit: f.check };
}

function buildSellerReading(context: Context): Reading {
  const questions = getSellerQuestions(context);
  const f = analyze(context);
  const active = new Set(questions.map(q => q.id));
  const sources = f.sources.filter(id => active.has(id) && context.answers[id]);
  const declarations: ReadingItem[] = questions.filter(q => q.id !== 'seller_rythme' && !isUnknown(context, q)).map(q => ({ text: `${q.title} — ${selectedLabel(context, q)}`, kind: 'declared', sourceAnswerIds: [q.id] }));
  const unknowns: ReadingItem[] = questions.filter(q => isUnknown(context, q)).map(q => ({ text: `À préciser si cela devient utile : ${q.title}`, kind: 'unknown', sourceAnswerIds: context.answers[q.id] ? [q.id] : [] }));
  const rhythm = str(context, 'seller_rythme');
  const next = rhythm === 'attendre' ? 'Choisir le point de réexamen de votre attente et conserver cette lecture.' : rhythm === 'reformuler' ? 'Repréciser ce que la vente doit permettre, puis comparer poursuivre, attendre ou renoncer selon vos contraintes.' : f.next;
  const options = optionsFor(context, f);
  const commonSources = [...sources, ...(context.answers.seller_rythme ? ['seller_rythme'] : [])];
  const transition: ReadingItem[] = sellerNeedsTransition(context) ? [{ text: 'Le projet indique un lien avec un prochain achat. Ressources disponibles, ordre des opérations et intervalle éventuel doivent être examinés ensemble.', kind: 'conditional', sourceAnswerIds: ['seller_apres_vente', 'seller_reflexion_changement', 'seller_preparer_prix', 'seller_peu_contacts_origine_prix'].filter(id => active.has(id) && context.answers[id]), condition: 'Aucun produit net de vente ni financement n’est confirmé ici.' }] : [];
  return {
    id: `${context.id}-seller-${context.revision}`, revision: context.revision, title: 'Votre vente, un prochain pas plus clair.',
    methodVersion: SELLER_METHOD_VERSION, generatedAt: context.updatedAt,
    sections: [
      { id: 'situation', title: 'Ce que votre vente doit permettre', items: declarations.length ? declarations : [{ text: 'Votre situation reste à préciser. Vous pouvez commencer par distinguer réflexion, publication, réactions et engagement.', kind: 'unknown' }] },
      { id: 'solide', title: 'Ce qui paraît solide', items: [{ text: f.text, kind: sources.length ? 'hypothesis' : 'solid', sourceAnswerIds: sources }, { text: 'Les réponses ci-dessus décrivent votre point de vue. Aucune pièce, statistique ou valeur du logement n’a été vérifiée automatiquement.', kind: 'unknown' }] },
      { id: 'conditions', title: 'Ce qui peut évoluer sous condition', items: [...options.map(o => ({ text: `${o.title} — ${o.consequence}`, kind: 'conditional' as const, sourceAnswerIds: sources, condition: `${o.condition} ${o.limit}` })), ...transition] },
      { id: 'verifier', title: 'Ce qui reste à décider ou vérifier', items: [{ text: f.check, kind: 'unknown', sourceAnswerIds: sources }, ...unknowns] },
      { id: 'decision', title: 'Votre prochaine décision utile', items: [{ text: next, kind: 'conditional', sourceAnswerIds: commonSources, condition: rhythm === 'attendre' ? `À reprendre lorsque : ${f.changes}` : f.changes }] },
    ],
    nextDecision: { text: next, why: f.text, changesWith: f.changes },
    limits: [f.check, 'Cette lecture s’appuie sur vos déclarations, pas sur une visite du bien ou un examen de pièces.', 'Aucun prix, délai de vente, financement ou effet juridique n’est déterminé automatiquement.'], options,
  };
}

/** This action is always an OPEN RESOURCE, even when its historical wording mentions rereading. */
export function getSellerResource(context: Context): { kind: 'resource'; href: string; label: string; detail: string } {
  const resource = analyze(context).resource;
  return { kind: 'resource', href: `/ressources/${resource}`, label: resource === 'lancement-coherent' ? 'Faire relire mon lancement' : resource === 'retours-de-visite' ? 'Organiser mes retours de visite' : 'Ouvrir la grille utile', detail: 'Ressource gratuite à parcourir vous-même. Aucune demande de relecture humaine n’est envoyée.' };
}

export const sellerJourney: Journey = {
  project: 'seller', title: 'Votre vente. Le prochain pas qui a du sens.',
  intro: 'Comprendre ce que votre situation permet de décider maintenant, et ce qu’il faut vérifier avant d’agir.',
  sequences: sellerSequences, getQuestions: getSellerQuestions, getImpact: getSellerImpact, buildReading: buildSellerReading,
};
