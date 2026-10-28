import { validateEditorialArticle, parisDateParts, type EditorialArticleV2 } from './schema.ts';

export interface PreparedCover { src: string; width: number; height: number }
export interface ProductionMetadata {
  schemaVersion: 1;
  campaignId: string;
  dayId: string;
  revision: number;
  author: { name: string; role: string };
  dates: { createdAt?: string; updatedAt?: string };
  answer: string;
  scope: string;
  category: EditorialArticleV2['category'];
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}: objet indispensable absent ou invalide`);
  return value as Record<string, unknown>;
}
function required(value: unknown, path: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${path}: texte indispensable absent`);
  return value; // No trimming, rewriting, inferred facts or editorial defaults.
}
function calendarDate(value: unknown): string {
  const date = required(value, 'production.date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error('production.date: date civile réelle YYYY-MM-DD requise');
  return date;
}

/** Convert a declared calendar appointment, never a claimed publication time. */
export function plannedParisPublication(dateValue: unknown, time: unknown, timezone: unknown): string {
  const date = calendarDate(dateValue);
  if (time !== '07:00' || timezone !== 'Europe/Paris') throw new Error('production: article.time=07:00 et timezone=Europe/Paris requis');
  const candidates = ['+01:00', '+02:00'].map(offset => `${date}T07:00:00${offset}`).filter(candidate => {
    const parts = parisDateParts(new Date(candidate));
    return parts.date === date && parts.hour === 7 && parts.minute === 0;
  });
  if (candidates.length !== 1) throw new Error('production.date: décalage Paris non déterminé');
  return candidates[0];
}

/** Identity survives changes to date, title, slug and the PRODUCTION version label. */
export function productionIdentity(campaignId: unknown, dayId: unknown): string {
  if (typeof campaignId !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(campaignId) || campaignId.length > 70) throw new Error('metadata.campaignId: identifiant de campagne stable requis (ASCII minuscules/tirets, maximum 70)');
  if (typeof dayId !== 'string' || !/^J\d{3}$/.test(dayId) || dayId === 'J000') throw new Error('production.id: journée J001 à J999 requise');
  return `${campaignId}-${dayId.toLowerCase()}`;
}

/** Validates resolved metadata; unknown writing dates are never fabricated. */
export function missingProductionMetadata(value: unknown): string[] {
  const m = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const a = m.author && typeof m.author === 'object' ? m.author as Record<string, unknown> : {};
  return Object.entries({ schemaVersion: m.schemaVersion, campaignId: m.campaignId, dayId: m.dayId, revision: m.revision, 'author.name': a.name, 'author.role': a.role, dates: m.dates, answer: m.answer, scope: m.scope, category: m.category }).filter(([,v]) => v == null || v === '').map(([key]) => `metadata.${key}`);
}

/** Only ARTICLE is mapped. Carousel/video/social payloads remain in the source package. */
export function adaptProduction(production: unknown, metadata: unknown, cover: PreparedCover | null): EditorialArticleV2 {
  const p = record(production, 'production');
  const a = record(p.article, 'production.article');
  const missing = missingProductionMetadata(metadata);
  if (missing.length) throw new Error(`Données indispensables absentes : ${missing.join(', ')}`);
  const m = record(metadata, 'metadata');
  const allowed = ['schemaVersion','campaignId','dayId','revision','author','dates','answer','scope','category'];
  for (const key of Object.keys(m)) if (!allowed.includes(key)) throw new Error(`metadata.${key}: champ inconnu, aucune réécriture implicite acceptée`);
  if (m.schemaVersion !== 1) throw new Error('metadata.schemaVersion: version 1 requise');
  if (m.dayId !== p.id) throw new Error('metadata.dayId: ne correspond pas à production.id');
  if (p.ready_for_production !== true || p.research_by_limova !== false || p.editorial_rewrite_by_limova !== false) throw new Error('production: texte figé ready_for_production=true, research_by_limova=false et editorial_rewrite_by_limova=false requis ; cela ne remplace pas la revue du lot');
  const topicId = productionIdentity(m.campaignId, p.id);
  const d = record(m.dates, 'metadata.dates');
  for (const key of Object.keys(d)) if (!['createdAt','updatedAt'].includes(key)) throw new Error(`metadata.dates.${key}: champ inconnu`);
  const destination = required(p.destination, 'production.destination');
  const url = new URL(destination, 'https://levois.fr');
  if (url.origin !== 'https://levois.fr' || url.search || url.hash || url.username || url.password) throw new Error('production.destination: parcours LEVOIS sans paramètres requis');
  if (!Array.isArray(p.sources)) throw new Error('production.sources: tableau explicite requis, même vide');
  const sources = p.sources.map((value, index) => {
    const source = record(value, `production.sources[${index}]`);
    if (source.url === undefined) throw new Error(`production.sources[${index}].url: URL ou null explicitement requis`);
    return { id: required(source.id, `sources[${index}].id`), label: required(source.editeur, `sources[${index}].editeur`), url: source.url, accessedAt: required(source.lecture, `sources[${index}].lecture`), scope: required(source.portee, `sources[${index}].portee`) };
  });
  if (new Set(sources.map(s => s.id)).size !== sources.length) throw new Error('production.sources: identifiant de source dupliqué');
  if (a.image !== null && typeof a.image !== 'string') throw new Error('production.article.image: nom de référence ou null explicite requis');
  if (a.image === '') throw new Error('production.article.image: référence vide interdite ; null doit être explicite');
  if ((a.image === null) !== (cover === null)) throw new Error('couverture: livrer la couverture finale si une référence est déclarée, ou déclarer image:null ; aucune image de remplacement inventée');
  const article = validateEditorialArticle({
    schemaVersion: 2, topicId, revision: m.revision,
    slug: required(a.slug_propose, 'production.article.slug_propose'),
    title: required(a.title, 'production.article.title'),
    summary: required(a.meta_description, 'production.article.meta_description'),
    answer: m.answer,
    content: { format: 'commonmark', markdown: required(a.markdown, 'production.article.markdown') },
    author: m.author,
    dates: { ...(d.createdAt === undefined ? {} : { createdAt: d.createdAt }), publishAt: plannedParisPublication(p.date, a.time, p.timezone), ...(d.updatedAt === undefined ? {} : { updatedAt: d.updatedAt }) },
    sources, scope: m.scope, limits: [required(p.limites, 'production.limites')],
    image: cover ? { ...cover, alt: required(a.image_alt, 'production.article.image_alt'), caption: required(a.image_caption, 'production.article.image_caption') } : null,
    category: m.category, primaryDestination: url.pathname, status: 'draft',
  });
  if (article.schemaVersion !== 2) throw new Error('Schéma de sortie inattendu');
  return article;
}
