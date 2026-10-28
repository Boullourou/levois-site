/** Contract v1: plain text only. Publishing always requires editorial review. */
export const EDITORIAL_CATEGORIES = ['vendre', 'acheter', 'vente-achat', 'ventes-locales'] as const;
export const EDITORIAL_DESTINATIONS = ['/votre-rue/', '/situer-ma-vente/', '/ma-recherche/', '/vendre-et-acheter/', '/contact/'] as const;
export const EDITORIAL_STATUSES = ['draft', 'scheduled', 'published', 'archived'] as const;

export interface EditorialArticle {
  schemaVersion: 1;
  topicId: string;
  revision: number;
  slug: string;
  title: string;
  summary: string;
  answer: string;
  sections: { heading: string; paragraphs: string[] }[];
  author: { name: string; role: string };
  dates: { createdAt: string; publishAt: string; updatedAt?: string };
  sources: { label: string; url: string; accessedAt: string }[];
  scope: string;
  limits: string[];
  image: { src: string; alt: string; width: number; height: number } | null;
  category: typeof EDITORIAL_CATEGORIES[number];
  primaryDestination: typeof EDITORIAL_DESTINATIONS[number];
  status: typeof EDITORIAL_STATUSES[number];
}

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

export function parisDateParts(instant: Date) {
  if (!Number.isFinite(instant.getTime())) fail('horloge', 'instant invalide');
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(instant);
  const get = (name: string) => parts.find((part) => part.type === name)!.value;
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: +get('hour'), minute: +get('minute'), second: +get('second') };
}

export function validateEditorialArticle(value: unknown): EditorialArticle {
  const a = object(value, 'article', ['schemaVersion', 'topicId', 'revision', 'slug', 'title', 'summary', 'answer', 'sections', 'author', 'dates', 'sources', 'scope', 'limits', 'image', 'category', 'primaryDestination', 'status']);
  if (a.schemaVersion !== 1) fail('schemaVersion', 'seule la version 1 est acceptée');
  const author = object(a.author, 'author', ['name', 'role']);
  const dates = object(a.dates, 'dates', ['createdAt', 'publishAt', 'updatedAt']);
  const createdAt = parseTimestamp(dates.createdAt, 'dates.createdAt');
  const publishAt = parseTimestamp(dates.publishAt, 'dates.publishAt');
  const updatedAt = dates.updatedAt === undefined ? undefined : parseTimestamp(dates.updatedAt, 'dates.updatedAt');
  if (Date.parse(publishAt) < Date.parse(createdAt)) fail('dates.publishAt', 'antérieure à la création');
  if (updatedAt && Date.parse(updatedAt) < Date.parse(createdAt)) fail('dates.updatedAt', 'antérieure à la création');
  const paris = parisDateParts(new Date(publishAt));
  if (paris.hour !== 7 || paris.minute !== 0 || paris.second !== 0 || !publishAt.startsWith(`${paris.date}T07:00:00+0`)) fail('dates.publishAt', '07:00:00 Europe/Paris avec le bon décalage +01:00 ou +02:00 attendu');
  const image = a.image === null ? null : object(a.image, 'image', ['src', 'alt', 'width', 'height']);
  let imageValue: EditorialArticle['image'] = null;
  if (image) {
    const src = text(image.src, 'image.src', 240);
    if (!/^\/editorial\/[a-z0-9-]+\/[a-z0-9-]+\.(?:webp|avif|jpg|jpeg|png)$/.test(src)) fail('image.src', 'image locale sous /editorial/{topicId}/ attendue');
    if (!src.startsWith(`/editorial/${a.topicId}/`)) fail('image.src', 'le dossier doit correspondre au topicId');
    imageValue = { src, alt: text(image.alt, 'image.alt', 300), width: positiveInteger(image.width, 'image.width', 4000), height: positiveInteger(image.height, 'image.height', 4000) };
  }
  return {
    schemaVersion: 1,
    topicId: identifier(a.topicId, 'topicId'), revision: positiveInteger(a.revision, 'revision'), slug: identifier(a.slug, 'slug'),
    title: text(a.title, 'title', 140), summary: text(a.summary, 'summary', 320), answer: text(a.answer, 'answer', 1200),
    sections: list(a.sections, 'sections', 1, 16, (entry, path) => {
      const section = object(entry, path, ['heading', 'paragraphs']);
      return { heading: text(section.heading, `${path}.heading`, 160), paragraphs: list(section.paragraphs, `${path}.paragraphs`, 1, 12, (p, path) => text(p, path, 3000)) };
    }),
    author: { name: text(author.name, 'author.name', 120), role: text(author.role, 'author.role', 200) },
    dates: { createdAt, publishAt, ...(updatedAt ? { updatedAt } : {}) },
    sources: list(a.sources, 'sources', 0, 30, (entry, path) => {
      const source = object(entry, path, ['label', 'url', 'accessedAt']);
      const url = text(source.url, `${path}.url`, 2000);
      let parsed: URL;
      try { parsed = new URL(url); } catch { return fail(`${path}.url`, 'URL HTTPS attendue'); }
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password) fail(`${path}.url`, 'URL HTTPS sans identifiants attendue');
      return { label: text(source.label, `${path}.label`, 200), url, accessedAt: parseTimestamp(source.accessedAt, `${path}.accessedAt`) };
    }),
    scope: text(a.scope, 'scope', 600), limits: list(a.limits, 'limits', 1, 8, (entry, path) => text(entry, path, 700)), image: imageValue,
    category: choice(a.category, 'category', EDITORIAL_CATEGORIES), primaryDestination: choice(a.primaryDestination, 'primaryDestination', EDITORIAL_DESTINATIONS), status: choice(a.status, 'status', EDITORIAL_STATUSES),
  };
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
  if (!incoming.dates.updatedAt || Date.parse(incoming.dates.updatedAt) <= Date.parse(existing.dates.updatedAt ?? existing.dates.createdAt)) fail('dates.updatedAt', 'une révision doit dater une modification réelle plus récente');
  return 'updated';
}
