import { str, type Context, type Impact, type Journey, type Question, type Reading, type ReadingItem } from './types';
import { setAnswer } from './context';
import { buyerLabel, domainEvidence, domainItem } from './buyer';

export const LOCAL_METHOD_VERSION = 'local-2026-09-10.1';
export interface LocalPriceObservation { n: number; median: number; q1: number; q3: number }
export interface LocalObservation {
  schemaVersion: 1;
  status: 'ready' | 'empty' | 'unavailable' | 'address_unconfirmed';
  label: string;
  source: string;
  sourceUrl: string;
  period: string;
  generatedAt: string | null;
  latestSale: string | null;
  radius: number | null;
  count: number | null;
  houses: LocalPriceObservation | null;
  apartments: LocalPriceObservation | null;
  filters: string;
}
export const localDependencies: Record<string, string[]> = { local_intention: ['local_focus'], local_observation: [] };
export const LOCAL_INTENTIONS = [
  { value: 'curious', label: 'Comprendre ce quartier' },
  { value: 'buyer', label: 'Préparer un achat' },
  { value: 'seller', label: 'Situer une vente' },
  { value: 'transition', label: 'Relier une vente et un achat' },
  { value: 'unknown', label: 'Je ne sais pas encore' },
];
const FOCUS: Record<string, { title: string; choices: { value: string; label: string }[] }> = {
  curious: { title: 'Qu’aimeriez-vous mieux comprendre ?', choices: [{ value: 'differences', label: 'Pourquoi les prix diffèrent entre logements' }, { value: 'history', label: 'Ce que les ventes passées montrent' }, { value: 'specific', label: 'Ce qu’il faudrait savoir pour un bien précis' }] },
  buyer: { title: 'Quel point voulez-vous éclairer pour votre achat ?', choices: [{ value: 'uses', label: 'Le quartier correspond-il à mon quotidien ?' }, { value: 'budget', label: 'Que permettent de comparer ces prix ?' }, { value: 'available', label: 'Comment relier ces repères aux biens à visiter ?' }] },
  seller: { title: 'Quel point voulez-vous éclairer pour votre vente ?', choices: [{ value: 'value', label: 'Ce qui distingue mon bien des ventes voisines' }, { value: 'prepare', label: 'Ce qu’il faut vérifier avant de présenter un prix' }, { value: 'feedback', label: 'Ce que les retours de visite peuvent m’apprendre' }] },
  transition: { title: 'Quel lien entre les deux projets reste à éclaircir ?', choices: [{ value: 'funds', label: 'Le montant réellement mobilisable après la vente' }, { value: 'dates', label: 'L’ordre des opérations et les dates' }, { value: 'interval', label: 'L’intervalle possible entre les logements' }] },
  unknown: { title: 'Quelle distinction vous serait utile ?', choices: [{ value: 'history', label: 'Une vente passée et un prix actuel' }, { value: 'specific', label: 'Un repère de quartier et un bien précis' }] },
};
const unknown = { value: 'unknown', label: 'Je ne sais pas encore' };

function validPrice(input: unknown): LocalPriceObservation | null {
  if (!input || typeof input !== 'object') return null;
  const value = input as LocalPriceObservation;
  if (!Number.isInteger(value.n) || value.n < 20 || ![value.median, value.q1, value.q3].every(amount => Number.isFinite(amount) && amount > 0) || value.q1 > value.median || value.median > value.q3) return null;
  return { n: value.n, median: value.median, q1: value.q1, q3: value.q3 };
}
export function parseLocalObservation(input: unknown): LocalObservation | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const value = input as LocalObservation;
  if (value.schemaVersion !== 1 || !['ready', 'empty', 'unavailable', 'address_unconfirmed'].includes(value.status) || typeof value.label !== 'string' || value.label.length > 300 || typeof value.period !== 'string' || value.period.length > 100) return null;
  return {
    schemaVersion: 1, status: value.status, label: value.label, period: value.period,
    source: 'DVF · DGFiP / Etalab', sourceUrl: 'https://files.data.gouv.fr/geo-dvf/latest/csv/',
    generatedAt: typeof value.generatedAt === 'string' && Number.isFinite(Date.parse(value.generatedAt)) ? value.generatedAt : null,
    latestSale: typeof value.latestSale === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.latestSale) ? value.latestSale : null,
    radius: Number.isFinite(value.radius) && value.radius! > 0 && value.radius! <= 3000 ? value.radius : null,
    count: Number.isInteger(value.count) && value.count! >= 0 ? value.count : null,
    houses: value.status === 'ready' ? validPrice(value.houses) : null,
    apartments: value.status === 'ready' ? validPrice(value.apartments) : null,
    filters: 'Maisons et appartements géolocalisés ; ventes avec lots exclus de ce repère de proximité ; prix au m² lorsque la surface bâtie est renseignée.',
  };
}
export function localObservation(context: Context): LocalObservation | null {
  try { return parseLocalObservation(JSON.parse(str(context, 'local_observation'))); } catch { return null; }
}
export function withLocalObservation(context: Context, observation: LocalObservation): Context {
  const safe = parseLocalObservation(observation);
  if (!safe) throw new Error('Repère local non interprétable.');
  const serialized = JSON.stringify(safe);
  if (context.answers.local_observation?.value === serialized) return { ...context, project: 'local' };
  const next = setAnswer({ ...context, project: 'local' }, 'local_observation', serialized, localDependencies);
  next.answers.local_observation = { ...next.answers.local_observation, provenance: 'imported', author: 'DVF · DGFiP / Etalab', semanticVersion: LOCAL_METHOD_VERSION };
  return next;
}
export function getLocalQuestions(context: Context): Question[] {
  const intention = str(context, 'local_intention');
  const focus = FOCUS[intention];
  return [{ id: 'local_intention', sequence: 1, sequenceTitle: 'Votre question', title: 'À quoi ces repères doivent-ils vous aider ?', type: 'choice', choices: LOCAL_INTENTIONS }, ...(focus ? [{ id: 'local_focus', sequence: 2, sequenceTitle: 'La distinction utile', title: focus.title, type: 'choice' as const, choices: [...focus.choices, unknown] }] : [])];
}
export function localContinuation(context: Context): { project: 'buyer' | 'seller' | 'transition' | null; href: string; label: string } {
  const intention = str(context, 'local_intention');
  if (intention === 'buyer') return { project: 'buyer', href: '/ma-recherche', label: 'Mettre ma recherche au clair' };
  if (intention === 'seller') return { project: 'seller', href: '/situer-ma-vente', label: 'Situer ma vente' };
  if (intention === 'transition') return { project: 'transition', href: '/vendre-et-acheter', label: 'Relier ma vente et mon achat' };
  return { project: null, href: '/methode', label: 'Comprendre la méthode' };
}
export function buildLocalReading(context: Context): Reading {
  const observation = localObservation(context);
  const intention = str(context, 'local_intention');
  const focus = str(context, 'local_focus');
  const item = (text: string, kind: ReadingItem['kind'], ids: string[] = []) => ({ ...domainItem(context, text, kind, ids), ...(kind === 'data' ? { author: 'DVF · DGFiP / Etalab', source: { url: observation?.sourceUrl, period: observation?.period, radius: observation?.radius, count: observation?.count, generatedAt: observation?.generatedAt } } : {}) });
  const observed: ReadingItem[] = [], compare: ReadingItem[] = [], boundaries: ReadingItem[] = [], checks: ReadingItem[] = [];
  const fmt = (number: number) => Math.round(number).toLocaleString('fr-FR');
  const sourceIds = observation ? ['local_observation'] : [];
  if (observation?.status === 'ready' && observation.count !== null) {
    observed.push(item(`${observation.count} ventes observées${observation.radius ? ` dans un rayon de ${fmt(observation.radius)} m` : ''}${observation.label ? ` autour de ${observation.label}` : ''} · ${observation.period || 'période à préciser'}.`, 'data', sourceIds));
    for (const [type, price] of [['Maisons', observation.houses], ['Appartements', observation.apartments]] as const) {
      if (price) observed.push(item(`${type} : médiane ${fmt(price.median)} €/m² ; la moitié des ${price.n} ventes avec surface renseignée se situe entre ${fmt(price.q1)} et ${fmt(price.q3)} €/m².`, 'data', sourceIds));
      else observed.push(item(`${type} : aucun repère de prix au m² retenu avec un effectif suffisant dans ce périmètre. Aucun prix nul n’est affiché.`, 'unknown', sourceIds));
    }
    observed.push(item(`${observation.source} · ${observation.period || 'période à préciser'}${observation.latestSale ? ` · dernière vente de la base : ${observation.latestSale}` : ''}${observation.generatedAt ? ` · extraction : ${observation.generatedAt.slice(0, 10)}` : ''}. ${observation.filters}`, 'data', sourceIds));
  } else if (observation?.status === 'empty') observed.push(item(`Aucune vente retenue dans le périmètre interrogé${observation.label ? ` autour de ${observation.label}` : ''}${observation.radius ? ` (${observation.radius} m)` : ''}. Cela ne prouve pas l’absence de ventes : couverture géographique, période et filtres limitent le résultat.`, 'unknown', sourceIds));
  else if (observation?.status === 'address_unconfirmed') observed.push(item('L’adresse n’a pas encore été confirmée dans la liste proposée. Aucun chiffre n’est attribué à une adresse ambiguë ou hors du périmètre de recherche.', 'unknown', sourceIds));
  else observed.push(item('Les ventes locales ne sont pas disponibles dans cette lecture. Vous pouvez quand même distinguer ce que vous cherchez à comprendre et la prochaine vérification utile.', 'unknown', sourceIds));
  compare.push(item('Comparer des ventes passées du même type, en gardant leur période, leur périmètre et leur effectif. La médiane n’est pas le prix attendu de chaque logement.', 'solid', sourceIds));
  if (intention && intention !== 'unknown') compare.push(item(`Votre intention déclarée : ${LOCAL_INTENTIONS.find(option => option.value === intention)?.label ?? 'point à préciser'}. Elle oriente la lecture, sans vous classer dans une démarche commerciale.`, 'declared', ['local_intention']));
  let next = { text: 'Choisir ce que vous voulez comparer, puis confirmer l’adresse ou le secteur.', why: 'Un repère local devient utile lorsqu’il répond à une question précise.', ids: ['local_intention', 'local_focus'] };
  if (intention === 'buyer') {
    compare.push(item('Pour votre recherche, ces ventes donnent un contexte de prix. Votre quotidien et l’offre réellement disponible restent à examiner séparément.', 'conditional', ['local_intention', ...sourceIds]));
    if (str(context, 'buyer_goal') && str(context, 'buyer_goal') !== 'unknown') compare.push(item(`Votre priorité déjà exprimée : ${buyerLabel('buyer_goal', str(context, 'buyer_goal'))}. Les statistiques ne permettent pas de vérifier cet usage.`, 'declared', ['buyer_goal', 'local_intention']));
    next = focus === 'budget' ? { text: 'Distinguer prix observés, coût complet d’un achat et ressources vérifiées.', why: 'Les prix au m² passés ne valident ni votre budget ni la faisabilité d’un financement.', ids: ['local_intention', 'local_focus'] } : focus === 'available' ? { text: 'Confronter des annonces réellement disponibles à vos usages, puis vérifier les biens en visite.', why: 'Une vente enregistrée ne correspond pas à une offre disponible aujourd’hui.', ids: ['local_intention', 'local_focus'] } : { text: 'Tester le quartier avec vos trajets et usages habituels.', why: 'Le secteur peut correspondre à un repère de prix sans convenir à votre quotidien.', ids: ['local_intention', 'local_focus', 'buyer_goal'] };
  } else if (intention === 'seller') {
    compare.push(item('Pour une vente, commencez par les différences entre votre logement et les références : état, disposition, exposition, surface et contexte de transaction.', 'conditional', ['local_intention', ...sourceIds]));
    next = focus === 'feedback' ? { text: 'Rassembler les retours précis de visite avant d’attribuer un blocage au prix.', why: 'Les ventes passées ne décrivent ni la perception de votre annonce ni les raisons des visiteurs.', ids: ['local_intention', 'local_focus'] } : { text: 'Documenter les caractéristiques du bien avant de rapprocher un prix des ventes voisines.', why: 'Mouaad peut sélectionner et confronter des références pertinentes au bien réel ; une moyenne de quartier ne suffit pas.', ids: ['local_intention', 'local_focus'] };
  } else if (intention === 'transition') {
    compare.push(item('Pour vendre et acheter, un prix observé ne représente ni le produit net de votre vente ni la date à laquelle vous pourriez l’utiliser.', 'conditional', ['local_intention', ...sourceIds]));
    next = focus === 'dates' ? { text: 'Séparer les dates souhaitées des contraintes et engagements des deux projets.', why: 'La période des ventes observées n’indique pas la durée de votre vente ou de votre achat.', ids: ['local_intention', 'local_focus'] } : focus === 'interval' ? { text: 'Examiner une solution temporaire, sa durée acceptable et ses coûts.', why: 'La disponibilité du prochain logement ne se déduit pas des ventes passées.', ids: ['local_intention', 'local_focus'] } : { text: 'Faire préciser le produit net mobilisable de la vente et sa date de disponibilité.', why: 'Le résultat net et les ressources dépendent du dossier réel, pas de la médiane locale.', ids: ['local_intention', 'local_focus'] };
  } else if (focus === 'specific' || focus === 'differences') next = { text: 'Comparer les caractéristiques de deux biens avant de comparer leur prix.', why: 'Un même quartier peut regrouper des logements très différents.', ids: ['local_intention', 'local_focus'] };
  else if (focus === 'history') next = { text: 'Garder la période des ventes près de chaque chiffre comparé.', why: 'Les données 2021–2025 ne constituent pas une mesure des prix actuels.', ids: ['local_focus', ...sourceIds] };
  boundaries.push(item('Ces données ne donnent ni valeur précise d’un bien, ni offre disponible, ni demande active, ni délai de vente. Elles ne valident pas un financement.', 'unknown', sourceIds));
  boundaries.push(item('Un type ou un critère non renseigné reste inconnu. Une consultation locale ne vous classe pas automatiquement comme vendeur, acquéreur ou visiteur arrivé par QR.', 'unknown', ['local_intention']));
  if (observation?.count !== null && observation?.count !== undefined && observation.count < 30) boundaries.push(item(`Effectif de ${observation.count} ventes : une lecture de petit échantillon exige de la prudence. L’absence de statistique peut être la conclusion la plus juste.`, 'unknown', sourceIds));
  checks.push(item(next.text, 'conditional', next.ids));
  checks.push(item('Vous pouvez conserver les repères, corriger votre question, poursuivre seul ou demander une relecture ciblée. Les coordonnées ne conditionnent pas cette lecture.', 'solid'));
  return { id: `${context.id}:local:${context.revision}`, revision: context.revision, title: 'Vos repères locaux, remis en contexte', methodVersion: LOCAL_METHOD_VERSION, generatedAt: context.updatedAt, ...domainEvidence(context, ['local_observation', 'local_intention', 'local_focus']), sections: [{ id: 'observed', title: 'Ce que les ventes observées montrent', items: observed }, { id: 'compare', title: 'Ce qu’elles permettent de comparer', items: compare }, { id: 'boundaries', title: 'Ce qu’elles ne disent pas de votre projet', items: boundaries }, { id: 'checks', title: 'La prochaine vérification utile', items: checks }], nextDecision: { text: next.text, why: next.why, changesWith: 'Une adresse corrigée, une question différente, des références mieux comparables ou une vérification du bien réel.', ...domainEvidence(context, next.ids) }, limits: ['Source : DVF · DGFiP / Etalab. Données de ventes passées, non exhaustives, avec leurs filtres et leur période.', 'Une statistique de quartier ne remplace pas l’examen d’un bien et n’est jamais une estimation automatique.', 'Aucune réponse personnelle ni adresse n’est ajoutée à la mesure d’audience.'] };
}
export function localImpact(id: string, context: Context): Impact {
  const reading = buildLocalReading(context);
  return { title: 'Le même chiffre éclaire une autre question', text: reading.nextDecision.text, limit: reading.nextDecision.why, ...domainEvidence(context, [id]) };
}
export const localJourney: Journey = { project: 'local', title: 'Comprendre vos repères locaux', intro: 'Deux questions pour relier les ventes observées à votre prochaine vérification, sans coordonnées.', sequences: ['Votre question', 'La distinction utile', 'Votre lecture'], getQuestions: getLocalQuestions, getImpact: localImpact, buildReading: buildLocalReading };
