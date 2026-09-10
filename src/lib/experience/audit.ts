import { analyseHybridListing, getContextQuestion, type ContextOption, type ListingDuration, type ListingSignal, type BlockedAuditResult } from '../audit-blocked';
import type { ListingSnapshot, ListingTip } from '../audit-url';
import { setAnswer } from './context';
import type { Context, Reading, ReadingItem } from './types';

export type AuditDuration = ListingDuration | 'unknown';
export type AuditSignal = ListingSignal | 'unknown';
export interface AuditAnswers { duration: AuditDuration | null; signal: AuditSignal | null; context: string | null }
export type AuditAccess = 'readable' | 'blocked' | 'insufficient' | 'unavailable' | 'transport' | 'rate-limited' | 'manual';
export interface AuditPage { access: AuditAccess; snapshot: ListingSnapshot; message: string; readAt: string }
export type AuditResponse = { kind: 'ready'; page: AuditPage } | { kind: 'invalid'; message: string };
export const auditDurations: ContextOption[] = [{ value: 'moins-7', label: 'Moins de 7 jours' }, { value: '7-30', label: 'De 7 à 30 jours' }, { value: 'plus-30', label: 'Plus d’un mois' }, { value: 'unknown', label: 'Je ne sais pas encore' }];
export const auditSignals: ContextOption[] = [{ value: 'peu-vues', label: 'Très peu de vues' }, { value: 'vues-sans-contact', label: 'Des vues, mais aucun contact' }, { value: 'contacts-sans-visite', label: 'Des contacts, mais aucune visite' }, { value: 'visites-sans-offre', label: 'Des visites, mais aucune offre' }, { value: 'offre-recue', label: 'Une proposition ou une offre reçue' }, { value: 'unknown', label: 'Je ne dispose pas de retours précis' }];
export const accessLabels: Record<AuditAccess, string> = { readable: 'Des éléments de la page ont été lus', blocked: 'Le portail n’a pas permis la lecture', insufficient: 'Le contenu accessible ne suffit pas', unavailable: 'La page est momentanément indisponible', transport: 'La lecture technique n’a pas abouti', 'rate-limited': 'Le service limite les lectures successives', manual: 'Lecture à partir de vos observations' };
const blank = (url: string): ListingSnapshot => ({ url, source: '', title: '', description: '' });
const capped = (v: unknown, max: number) => typeof v === 'string' ? v.slice(0, max) : '';

export function auditContextQuestion(signal: AuditSignal | null): { question: string; options: ContextOption[] } {
  if (!signal || signal === 'unknown') return { question: 'Quel point pouvez-vous vérifier en premier ?', options: [{ value: 'diffusion', label: 'Où l’annonce apparaît et depuis quand' }, { value: 'retours', label: 'Les retours reçus ou les chiffres disponibles' }, { value: 'presentation', label: 'Ce que le titre, les photos et le texte permettent de comprendre' }, { value: 'unknown', label: 'Je ne sais pas encore' }] };
  const q = getContextQuestion(signal);
  return { question: q.question, options: [...q.options, { value: 'unknown', label: 'Je ne sais pas encore' }] };
}

/** Preserve the real API distinction. "unavailable" alone never proves portal blocking. */
export function classifyAuditResponse(status: number, payload: unknown, url: string, readAt = new Date().toISOString()): AuditResponse {
  const p = payload && typeof payload === 'object' ? payload as Record<string, any> : {};
  if (status === 400) return { kind: 'invalid', message: 'Ce lien n’est pas accepté. Vérifiez qu’il s’agit du lien public complet, ou poursuivez avec vos observations.' };
  if (status >= 200 && status < 300 && p.ok === true && p.snapshot && typeof p.snapshot === 'object') {
    const s = p.snapshot;
    if (typeof s.title === 'string' && typeof s.description === 'string' && (s.title || s.description)) return { kind: 'ready', page: { access: 'readable', readAt, message: 'Le titre ou la description ont fourni du contexte. Vos trois réponses précisent ce qui se passe réellement ; une extraction ne prouve pas que toute l’annonce a été lue.', snapshot: { url, source: capped(s.source, 200), title: capped(s.title, 600), description: capped(s.description, 4000), price: capped(s.price, 100), location: capped(s.location, 300), ...(Number.isInteger(s.photoCount) && s.photoCount >= 0 ? { photoCount: Math.min(s.photoCount, 10000) } : {}) } } };
  }
  const access: AuditAccess = status === 429 ? 'rate-limited' : p.reason === 'blocked' ? 'blocked' : status === 422 && p.reason === 'unavailable' && typeof p.message === 'string' && p.message.startsWith('La page est accessible, mais') ? 'insufficient' : 'unavailable';
  const messages: Record<Exclude<AuditAccess, 'readable' | 'transport' | 'manual'>, string> = {
    blocked: 'Le site ou ses redirections n’ont pas permis la lecture automatique. Les réponses suivantes restent utiles ; aucune donnée de l’annonce n’a été confirmée.',
    insufficient: 'La page est accessible, mais les éléments reçus ne suffisent pas à relire sa présentation. Cela ne prouve pas que votre annonce manque d’informations.',
    unavailable: 'La page n’a pas pu être lue. La cause n’est pas établie ici. Vous pouvez réessayer ou continuer à partir de vos observations.',
    'rate-limited': 'Le service demande d’espacer les lectures. Vous pouvez continuer avec vos observations, sans attendre une nouvelle extraction.',
  };
  return { kind: 'ready', page: { access, snapshot: blank(url), message: messages[access], readAt } };
}

export function manualAuditPage(url = '', access: 'manual' | 'transport' = 'manual'): AuditPage {
  return { access, snapshot: blank(url), readAt: new Date().toISOString(), message: access === 'transport' ? 'La demande technique n’a pas abouti. Cela ne prouve pas un blocage du portail. Vos réponses permettent de poursuivre sans extraction.' : 'Vous pouvez distinguer l’étape à vérifier à partir de vos observations, même sans lien lisible.' };
}

const boundedTitle: Record<ListingSignal, string> = { 'peu-vues': 'La visibilité est le premier point à vérifier.', 'vues-sans-contact': 'Examiner le passage de la vue au contact.', 'contacts-sans-visite': 'Clarifier le passage du contact à la visite.', 'visites-sans-offre': 'Comprendre ce qui retient après la visite.', 'offre-recue': 'Lire l’offre avec ses conditions.' };
const unknownTips: [ListingTip, ListingTip] = [
  { code: 'clarify-record', title: 'Retrouver un point de départ.', observation: 'La période ou les réactions ne sont pas encore précisées.', action: 'Noter les supports, la date de publication connue et les chiffres ou retours disponibles, en laissant visibles ceux qui manquent.' },
  { code: 'check-presentation', title: 'Relire ce qui est réellement visible.', observation: 'Un contrôle de présentation reste possible sans déduire la cause du manque de réactions.', action: 'Ouvrir l’annonce sur téléphone et vérifier si la première image, le titre et le texte expliquent le bien et ses contraintes.' },
];
export interface AuditResult extends BlockedAuditResult { reading: Reading }

// Preserve rule selection and actions. These two historical titles inferred a
// price reduction or the legal effect of an oral offer from weaker answers.
function boundedTip(tip: ListingTip): ListingTip {
  if (tip.code === 'price-changed') return { ...tip, title: 'Relire les changements avant une nouvelle décision sur le prix.' };
  if (tip.code === 'oral-offer') return { ...tip, title: 'Faire préciser la proposition et sa portée avant de répondre.' };
  return tip;
}

export function auditComplete(answers: AuditAnswers): boolean {
  return auditDurations.some(o => o.value === answers.duration) && auditSignals.some(o => o.value === answers.signal) && auditContextQuestion(answers.signal).options.some(o => o.value === answers.context);
}

/** Same hybrid rules for valid known inputs. Unknown inputs are never coerced to a factual duration/stage. */
export function buildAuditResult(page: AuditPage, answers: AuditAnswers, context: Context): AuditResult {
  if (!auditComplete(answers)) throw new Error('Les trois réponses doivent être précisées ou explicitement inconnues.');
  // In the existing engine, every duration produces the same offer branch. Its
  // actions remain usable with an unknown duration; the declared duration stays unknown.
  const offerWithoutDuration = answers.signal === 'offre-recue' && answers.duration === 'unknown';
  const known = answers.signal !== 'unknown' && (answers.duration !== 'unknown' || offerWithoutDuration);
  const base: BlockedAuditResult = known ? analyseHybridListing(page.snapshot, offerWithoutDuration ? 'moins-7' : answers.duration as ListingDuration, answers.signal as ListingSignal, answers.context!) : {
    analysis: { title: 'Deux points à éclaircir avant d’ajuster.', summary: 'Les informations manquantes orientent vers une vérification ; elles ne permettent pas de diagnostiquer un blocage.', tips: unknownTips, facts: [], limit: '' },
    resource: { href: '/ressources/annonce-vue-peu-de-contacts', label: 'Organiser les observations de l’annonce', description: 'Une grille ouverte pour distinguer ce que vous savez et ce qui reste à relever.' },
  };
  const title = known ? answers.duration === 'moins-7' && answers.signal !== 'offre-recue' ? 'Observer une publication récente.' : boundedTitle[answers.signal as ListingSignal] : base.analysis.title;
  const limit = `${page.access === 'readable' ? 'Seuls les éléments accessibles de la page ont été extraits.' : 'Aucun contenu de l’annonce n’a été confirmé par une extraction.'} Les réactions et leur période viennent de vos déclarations. Ces pistes ne déterminent ni la valeur du bien, ni un prix, ni la faisabilité d’une offre.`;
  const facts = [`Période déclarée : ${auditDurations.find(o => o.value === answers.duration)!.label}`, `Situation déclarée : ${auditSignals.find(o => o.value === answers.signal)!.label}`, `${auditContextQuestion(answers.signal).question} ${auditContextQuestion(answers.signal).options.find(o => o.value === answers.context)!.label}`, `Accès : ${accessLabels[page.access]}`];
  if (page.access === 'readable') {
    if (page.snapshot.title) facts.push(`Titre extrait : ${page.snapshot.title}`);
    if (typeof page.snapshot.photoCount === 'number') facts.push(`Photos détectées dans les données accessibles : ${page.snapshot.photoCount} (pas un inventaire garanti).`);
  }
  const analysis = { ...base.analysis, tips: base.analysis.tips.map(boundedTip) as [ListingTip, ListingTip], title, summary: known ? 'Deux pistes choisies à partir de votre situation déclarée, à confronter aux informations disponibles avant d’agir.' : base.analysis.summary, facts, limit };
  const supplied = [answers.duration, answers.signal, answers.context];
  const declared: ReadingItem[] = facts.slice(0, 3).map((text, i) => ({ text, kind: supplied[i] === 'unknown' ? 'unknown' : 'declared', sourceAnswerIds: [['audit_duration'], ['audit_signal'], ['audit_context']][i] }));
  const evidence: ReadingItem[] = [{ text: `${accessLabels[page.access]} — ${page.message}`, kind: page.access === 'readable' ? 'data' : 'unknown', sourceAnswerIds: ['audit_access'] }];
  if (page.snapshot.url) evidence.push({ text: `Lien utilisé pour cette lecture : ${page.snapshot.url}`, kind: 'declared', sourceAnswerIds: ['audit_url'] });
  if (page.access === 'readable' && page.snapshot.title) evidence.push({ text: `Titre extrait le ${page.readAt} : ${page.snapshot.title}`, kind: 'data', sourceAnswerIds: ['audit_title', 'audit_read_at'] });
  if (page.access === 'readable' && typeof page.snapshot.photoCount === 'number') evidence.push({ text: `Photos détectées dans les données accessibles : ${page.snapshot.photoCount}. Ce relevé n’est pas un inventaire garanti des photos de l’annonce.`, kind: 'data', sourceAnswerIds: ['audit_photo_count', 'audit_read_at'] });
  const actionSources = ['audit_duration', 'audit_signal', 'audit_context', ...(page.access === 'readable' ? ['audit_access', 'audit_title', 'audit_photo_count', 'audit_description_length'] : [])];
  const reading: Reading = {
    id: `${context.id}-audit-${context.revision}`, revision: context.revision, title, methodVersion: 'audit-hybrid-2.0.0', generatedAt: context.updatedAt,
    sections: [
      { id: 'situation', title: 'Ce que vous cherchez à comprendre', items: declared },
      { id: 'solide', title: 'Ce qui est disponible pour cette lecture', items: evidence },
      { id: 'conditions', title: 'Deux actions à examiner', items: analysis.tips.map(t => ({ text: `${t.title} ${t.action}`, kind: 'conditional', sourceAnswerIds: actionSources, condition: 'Piste automatique à confronter à l’annonce et aux faits ; ne retenir un changement que s’il répond à un point réellement observé.' })) },
      { id: 'verifier', title: 'Ce qui reste à vérifier', items: [{ text: limit, kind: 'unknown', sourceAnswerIds: ['audit_access', 'audit_duration', 'audit_signal', 'audit_context'] }, { text: 'La comparaison avec les autres biens, l’état sur place et les raisons concrètes des personnes demandent une vérification distincte.', kind: 'unknown' }] },
      { id: 'decision', title: 'Votre prochaine décision utile', items: [{ text: analysis.tips[0].action, kind: 'conditional', sourceAnswerIds: ['audit_signal', 'audit_duration'], condition: 'Si les faits confirment que cette étape mérite d’être examinée. Vous pouvez aussi attendre un relevé plus précis.' }] },
    ],
    nextDecision: { text: analysis.tips[0].action, why: analysis.summary, changesWith: 'Une correction de vos réponses, un relevé daté, un retour précis ou une nouvelle extraction de l’annonce.' },
    limits: [limit, 'Le contenu extrait peut être partiel. Une information non détectée n’est pas nécessairement absente de l’annonce.', 'Les effets juridiques et la faisabilité financière d’une offre ne sont pas déterminés par cet outil.'],
  };
  return { analysis, resource: base.resource, reading };
}

export function contextWithAudit(current: Context, page: AuditPage, answers: AuditAnswers): Context {
  let next: Context = { ...current, project: 'audit' };
  const values: Record<string, string | number | null> = { audit_url: page.snapshot.url || null, audit_duration: answers.duration, audit_signal: answers.signal, audit_context: answers.context, audit_access: page.access, audit_read_at: page.readAt, audit_title: page.snapshot.title || null, audit_source: page.snapshot.source || null, audit_photo_count: typeof page.snapshot.photoCount === 'number' ? page.snapshot.photoCount : null, audit_description_length: page.access === 'readable' ? page.snapshot.description.length : null };
  for (const [id, v] of Object.entries(values)) next = setAnswer(next, id, v);
  for (const id of ['audit_access', 'audit_read_at', 'audit_title', 'audit_source', 'audit_photo_count', 'audit_description_length']) if (next.answers[id]) next.answers[id] = { ...next.answers[id], provenance: 'imported' };
  next.reading = buildAuditResult(page, answers, next).reading;
  return next;
}

/**
 * Common-reader adapter. The Context deliberately does not retain a complete
 * extraction: without the stored reading, resume the audit draft in its tool.
 * Never rerun the listing engine against a made-up blank description here.
 */
export function buildAuditReading(context: Context): Reading | null {
  return context.project === 'audit' && context.reading?.methodVersion.startsWith('audit-') ? context.reading : null;
}

/** Only equivalent observations migrate. Ambiguous ranges and price-vs-comparables are deliberately not invented. */
export function sellerAnswersFromAudit(answers: AuditAnswers): Record<string, string> {
  const result: Record<string, string> = {};
  if (answers.signal === 'peu-vues' || answers.signal === 'vues-sans-contact') {
    result.seller_situation = 'peu-contacts';
    result.seller_peu_contacts_vues = answers.signal === 'peu-vues' ? 'peu' : 'nombreuses';
    if (answers.signal === 'vues-sans-contact') result.seller_peu_contacts_reactions = 'aucune';
    if (answers.duration === 'moins-7') result.seller_peu_contacts_duree = 'moins-2sem';
  } else if (answers.signal === 'contacts-sans-visite') {
    result.seller_situation = 'publiee'; result.seller_publiee_signaux = 'contacts-sans-visite';
    if (answers.duration === 'moins-7') result.seller_publiee_duree = 'moins-7j';
    if (answers.duration === 'plus-30') result.seller_publiee_duree = 'plus-1mois';
  } else if (answers.signal === 'visites-sans-offre') {
    result.seller_situation = 'visites';
    const map: Record<string, string> = { 'retour-travaux': 'travaux', 'retour-agencement': 'disposition', 'retour-inconnu': 'vagues' };
    if (answers.context && map[answers.context]) result.seller_visites_remarques = map[answers.context];
  } else if (answers.signal === 'offre-recue') {
    result.seller_situation = 'offre';
    if (answers.context === 'offre-orale') result.seller_offre_conditions = 'orales';
    if (['offre-ecrite-conditions', 'offre-ecrite-simple'].includes(answers.context || '')) result.seller_offre_conditions = 'ecrites';
  }
  return result;
}
