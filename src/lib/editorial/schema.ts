import { parseEditorialMarkdown } from './markdown.ts';

/** Both contracts require explicit, reviewed facts; v2 preserves Markdown. */
export const EDITORIAL_CATEGORIES = ['vendre', 'acheter', 'vente-achat', 'ventes-locales'] as const;
export const EDITORIAL_DESTINATIONS = ['/votre-rue/', '/situer-ma-vente/', '/ma-recherche/', '/vendre-et-acheter/', '/contact/'] as const;
export const EDITORIAL_STATUSES = ['draft', 'scheduled', 'published', 'archived'] as const;

interface EditorialMetadata {
  topicId: string;
  revision: number;
  slug: string;
  title: string;
  summary: string;
  answer: string;
  author: { name: string; role: string };
  dates: { createdAt?: string; publishAt: string; updatedAt?: string };
  scope: string;
  limits: string[];
  category: typeof EDITORIAL_CATEGORIES[number];
  primaryDestination: typeof EDITORIAL_DESTINATIONS[number];
  status: typeof EDITORIAL_STATUSES[number];
}

export interface EditorialArticleV1 extends EditorialMetadata {
  schemaVersion: 1;
  dates: EditorialMetadata['dates'] & { createdAt: string };
  sections: { heading: string; paragraphs: string[] }[];
  sources: { label: string; url: string; accessedAt: string }[];
  image: { src: string; alt: string; width: number; height: number } | null;
}
export interface EditorialArticleV2 extends EditorialMetadata {
  schemaVersion: 2;
  content: { format: 'commonmark'; markdown: string };
  sources: { id: string; label: string; url: string | null; accessedAt: string; scope: string }[];
  image: { src: string; alt: string; width: number; height: number; caption: string } | null;
}
export type EditorialArticle = EditorialArticleV1 | EditorialArticleV2;

export interface ReservedEditorialIdentity { id: string; slug: string }
export class EditorialValidationError extends Error {}
type ObjectValue = Record<string, unknown>;
const fail = (path: string, reason: string): never => { throw new EditorialValidationError(`${path}: ${reason}`); };
function object(value: unknown, path: string, fields: string[]): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail(path, 'objet attendu');
  const result = value as ObjectValue;
  for (const key of Object.keys(result)) if (!fields.includes(key)) fail(`${path}.${key}`, 'champ inconnu');
  return result;
}
function text(value: unknown, path: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value !== value.trim() || value.length > max) return fail(path, `texte non vide, sans espaces de bord, maximum ${max} caractères`);
  if (/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) return fail(path, 'HTML et caractères de contrôle interdits');
  return value;
}
function identifier(value: unknown, path: string): string {
  const result = text(value, path, 100);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result)) fail(path, 'minuscules ASCII, chiffres et tirets uniquement');
  return result;
}
function list<T>(value: unknown, path: string, min: number, max: number, parse: (entry: unknown, path: string) => T): T[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) return fail(path, `tableau de ${min} à ${max} éléments attendu`);
  return value.map((entry, i) => parse(entry, `${path}[${i}]`));
}
function choice<T extends string>(value: unknown, path: string, choices: readonly T[]): T {
  if (typeof value !== 'string' || !choices.includes(value as T)) return fail(path, `valeur attendue : ${choices.join(', ')}`);
  return value as T;
}
function positiveInteger(value: unknown, path: string, max = 100000): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > max) return fail(path, `entier entre 1 et ${max} attendu`);
  return value;
}
export function parseTimestamp(value: unknown, path = 'date'): string {
  const result = text(value, path, 35);
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|[+-](\d{2}):(\d{2}))$/.exec(result);
  if (!match || !Number.isFinite(Date.parse(result))) return fail(path, 'ISO 8601 avec secondes et fuseau explicite attendu');
  const [, year, month, day, hour, minute, second, zone, offsetHour, offsetMinute] = match;
  const days = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  if (+month < 1 || +month > 12 || +day < 1 || +day > days || +hour > 23 || +minute > 59 || +second > 59 || (zone !== 'Z' && (+offsetHour > 14 || +offsetMinute > 59))) fail(path, 'date ou heure invalide');
  return result;
}

/** Date-only evidence stays date-only; no midnight or timezone is fabricated. */
export function parseEditorialDate(value: unknown, path = 'date'): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T12:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return fail(path, 'date civile invalide');
    return value;
  }
  return parseTimestamp(value, path);
}

export function parisDateParts(instant: Date) {
  if (!Number.isFinite(instant.getTime())) fail('horloge', 'instant invalide');
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(instant);
  const get = (name: string) => parts.find((part) => part.type === name)!.value;
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: +get('hour'), minute: +get('minute'), second: +get('second') };
}

export function validateEditorialArticle(value: unknown): EditorialArticle {
  const a = object(value, 'article', ['schemaVersion', 'topicId', 'revision', 'slug', 'title', 'summary', 'answer', 'sections', 'content', 'author', 'dates', 'sources', 'scope', 'limits', 'image', 'category', 'primaryDestination', 'status']);
  if (a.schemaVersion !== 1 && a.schemaVersion !== 2) fail('schemaVersion', 'version 1 ou 2 attendue');
  if (a.schemaVersion === 1 && 'content' in a) fail('content', 'réservé à la version 2');
  if (a.schemaVersion === 2 && 'sections' in a) fail('sections', 'la version 2 conserve uniquement content.markdown');
  const author = object(a.author, 'author', ['name', 'role']);
  const dates = object(a.dates, 'dates', ['createdAt', 'publishAt', 'updatedAt']);
  const parseDate = a.schemaVersion === 2 ? parseEditorialDate : parseTimestamp;
  const createdAt = a.schemaVersion === 2 && dates.createdAt === undefined ? undefined : parseDate(dates.createdAt, 'dates.createdAt');
  const publishAt = parseTimestamp(dates.publishAt, 'dates.publishAt');
  const updatedAt = dates.updatedAt === undefined ? undefined : parseDate(dates.updatedAt, 'dates.updatedAt');
  if (createdAt && Date.parse(publishAt) < Date.parse(createdAt)) fail('dates.publishAt', 'antérieure à la création');
  if (createdAt && updatedAt && Date.parse(updatedAt) < Date.parse(createdAt)) fail('dates.updatedAt', 'antérieure à la création');
  const paris = parisDateParts(new Date(publishAt));
  if (paris.hour !== 7 || paris.minute !== 0 || paris.second !== 0 || !publishAt.startsWith(`${paris.date}T07:00:00+0`)) fail('dates.publishAt', '07:00:00 Europe/Paris avec le bon décalage +01:00 ou +02:00 attendu');
  const image = a.image === null ? null : object(a.image, 'image', ['src', 'alt', 'width', 'height', ...(a.schemaVersion === 2 ? ['caption'] : [])]);
  let imageValue: EditorialArticle['image'] = null;
  if (image) {
    const src = text(image.src, 'image.src', 240);
    if (!/^\/editorial\/[a-z0-9-]+\/[a-z0-9-]+\.(?:webp|avif|jpg|jpeg|png)$/.test(src)) fail('image.src', 'image locale sous /editorial/{topicId}/ attendue');
    if (!src.startsWith(`/editorial/${a.topicId}/`)) fail('image.src', 'le dossier doit correspondre au topicId');
    imageValue = { src, alt: text(image.alt, 'image.alt', 300), width: positiveInteger(image.width, 'image.width', 4000), height: positiveInteger(image.height, 'image.height', 4000), ...(a.schemaVersion === 2 ? { caption: text(image.caption, 'image.caption', 500) } : {}) };
  }
  const common = {
    topicId: identifier(a.topicId, 'topicId'), revision: positiveInteger(a.revision, 'revision'), slug: identifier(a.slug, 'slug'),
    title: text(a.title, 'title', 140), summary: text(a.summary, 'summary', 320), answer: text(a.answer, 'answer', 1200),
    author: { name: text(author.name, 'author.name', 120), role: text(author.role, 'author.role', 200) },
    dates: { ...(createdAt ? { createdAt } : {}), publishAt, ...(updatedAt ? { updatedAt } : {}) },
    scope: text(a.scope, 'scope', 600), limits: list(a.limits, 'limits', 1, 8, (entry, path) => text(entry, path, 700)),
    category: choice(a.category, 'category', EDITORIAL_CATEGORIES), primaryDestination: choice(a.primaryDestination, 'primaryDestination', EDITORIAL_DESTINATIONS), status: choice(a.status, 'status', EDITORIAL_STATUSES),
  };
  function sourceUrl(value: unknown, path: string): string {
      const url = text(value, path, 2000);
      let parsed: URL;
      try { parsed = new URL(url); } catch { return fail(path, 'URL HTTPS attendue'); }
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password) fail(path, 'URL HTTPS sans identifiants attendue');
      return url;
  }
  if (a.schemaVersion === 1) return {
    schemaVersion: 1, ...common, image: imageValue,
    dates: { ...common.dates, createdAt: createdAt ?? fail('dates.createdAt', 'date de création requise en version 1') },
    sections: list(a.sections, 'sections', 1, 16, (entry, path) => {
      const section = object(entry, path, ['heading', 'paragraphs']);
      return { heading: text(section.heading, `${path}.heading`, 160), paragraphs: list(section.paragraphs, `${path}.paragraphs`, 1, 12, (p, path) => text(p, path, 3000)) };
    }),
    sources: list(a.sources, 'sources', 0, 30, (entry, path) => {
      const source = object(entry, path, ['label', 'url', 'accessedAt']);
      return { label: text(source.label, `${path}.label`, 200), url: sourceUrl(source.url, `${path}.url`), accessedAt: parseTimestamp(source.accessedAt, `${path}.accessedAt`) };
    }),
  };
  const content = object(a.content, 'content', ['format', 'markdown']);
  choice(content.format, 'content.format', ['commonmark']);
  if (typeof content.markdown !== 'string') fail('content.markdown', 'chaîne Markdown attendue');
  parseEditorialMarkdown(content.markdown as string, { title: common.title });
  const sources = list(a.sources, 'sources', 0, 30, (entry, path) => {
    const source = object(entry, path, ['id', 'label', 'url', 'accessedAt', 'scope']);
    const id = text(source.id, `${path}.id`, 100);
    if (!/^[A-Za-z0-9_-]+$/.test(id)) fail(`${path}.id`, 'identifiant de source ASCII attendu');
    return { id, label: text(source.label, `${path}.label`, 200), url: source.url === null ? null : sourceUrl(source.url, `${path}.url`), accessedAt: parseEditorialDate(source.accessedAt, `${path}.accessedAt`), scope: text(source.scope, `${path}.scope`, 1000) };
  });
  if (new Set(sources.map((source) => source.id)).size !== sources.length) fail('sources', 'identifiant de source dupliqué');
  return { schemaVersion: 2, ...common, sources, image: imageValue as EditorialArticleV2['image'], content: { format: 'commonmark', markdown: content.markdown as string } };
}

export function validateEditorialCatalog(values: unknown[], reserved: ReservedEditorialIdentity[] = []): EditorialArticle[] {
  const articles = values.map(validateEditorialArticle);
  const ids = new Set(reserved.map((entry) => entry.id));
  const slugs = new Set(reserved.map((entry) => entry.slug));
  const publicationDays = new Set<string>();
  for (const article of articles) {
    if (ids.has(article.topicId)) fail('topicId', `identifiant déjà utilisé : ${article.topicId}`);
    if (slugs.has(article.slug)) fail('slug', `URL déjà utilisée : ${article.slug}`);
    if (['scheduled', 'published'].includes(article.status)) {
      const day = parisDateParts(new Date(article.dates.publishAt)).date;
      if (publicationDays.has(day)) fail('dates.publishAt', `un sujet par jour : créneau déjà utilisé le ${day}`);
      publicationDays.add(day);
    }
    ids.add(article.topicId); slugs.add(article.slug);
  }
  return articles;
}

/** A frozen build clock prevents the manifest from getting ahead of the HTML. */
export function editorialBuildTime(value?: string, now = new Date()): Date {
  if (!value) return now;
  const at = new Date(parseTimestamp(value, 'LEVOIS_EDITORIAL_BUILD_AT'));
  if (at.getTime() > now.getTime()) fail('LEVOIS_EDITORIAL_BUILD_AT', 'une compilation ne peut pas anticiper une publication future');
  return at;
}

/** Time gates are evaluated at build time, never by the visitor's browser. */
export function isEditorialPublished(article: EditorialArticle, at: Date): boolean {
  return ['scheduled', 'published'].includes(article.status) && Date.parse(article.dates.publishAt) <= at.getTime();
}

/** Replays cannot create a new file, move an existing URL, or overwrite a newer edit. */
export function classifyEditorialImport(incoming: EditorialArticle, existing?: EditorialArticle): 'created' | 'updated' | 'unchanged' {
  if (!existing) return 'created';
  if (incoming.topicId !== existing.topicId || incoming.slug !== existing.slug || incoming.dates.createdAt !== existing.dates.createdAt || incoming.dates.publishAt !== existing.dates.publishAt) fail('identité', 'topicId, slug, createdAt et publishAt sont immuables ; changement exceptionnel à traiter en revue Git');
  if (incoming.revision < existing.revision) fail('revision', 'révision périmée, aucune modification effectuée');
  if (incoming.revision === existing.revision) {
    if (JSON.stringify(incoming) !== JSON.stringify(existing)) fail('revision', 'contenu différent avec une révision déjà utilisée');
    return 'unchanged';
  }
  if (incoming.revision !== existing.revision + 1) fail('revision', 'la prochaine révision doit être exactement la précédente + 1');
  const previousKnownDate = existing.dates.updatedAt ?? existing.dates.createdAt;
  // An unknown creation date cannot become a publication or processing timestamp.
  if (!incoming.dates.updatedAt || (previousKnownDate && Date.parse(incoming.dates.updatedAt) <= Date.parse(previousKnownDate))) fail('dates.updatedAt', 'une révision doit dater une modification réelle plus récente');
  return 'updated';
}
