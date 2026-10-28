import type { MdastNode } from 'satteri';
import { parseEditorialMarkdown } from './markdown.ts';
import { adaptProduction, productionIdentity, type PreparedCover } from './production.ts';
import { classifyEditorialImport, type EditorialArticle, type EditorialArticleV2 } from './schema.ts';

const categories = {
  '/votre-rue/': 'ventes-locales', '/situer-ma-vente/': 'vendre',
  '/ma-recherche/': 'acheter', '/vendre-et-acheter/': 'vente-achat',
} as const;
const object = (value: unknown, path: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}: objet requis`);
  return value as Record<string, unknown>;
};
function visibleText(node: MdastNode): string {
  if (node.type === 'text') return node.value;
  if (node.type === 'break') return '\n';
  return 'children' in node ? node.children.map(visibleText).join('') : '';
}

export interface ConversionOptions {
  campaignId: string;
  cover: PreparedCover | null;
  /** Only produces an isolated draft. Batch activation never enables this option. */
  testWithoutCover?: boolean;
  previous?: EditorialArticle;
  revision?: number;
}

/** PRODUCTION is the input; SITE is the generated output, never a required sidecar. */
export function convertProduction(production: unknown, options: ConversionOptions) {
  const p = object(production, 'production');
  const a = object(p.article, 'production.article');
  if (a.image !== null && (typeof a.image !== 'string' || !a.image)) throw new Error('production.article.image: référence non vide ou null explicite requis');
  if (typeof a.markdown !== 'string' || typeof a.title !== 'string') throw new Error('production.article.markdown/title: textes requis');
  const tree = parseEditorialMarkdown(a.markdown, { title: a.title });
  const paragraphs = tree.children.filter(node => node.type === 'paragraph');
  // Recognise only the explicit signature convention. No author is guessed
  // from a filename, from a social payload, or from the site's usual author.
  const signatures = paragraphs.map(visibleText).map(text => ({ text, match: /^([^\n—]+) — ([^\n]+?)\. RSAC ([^.\n]+)\. ([^\n]+)$/.exec(text) })).filter(entry => entry.match);
  const signature = signatures.length === 1 ? signatures[0] : undefined;
  const author = a.author ?? (signature ? { name: signature.match![1], role: signature.match![2] } : undefined);
  const scope = a.scope ?? signature?.match![4];
  const answer = a.answer ?? (paragraphs[0] ? visibleText(paragraphs[0]) : undefined);
  const destination = typeof p.destination === 'string' ? new URL(p.destination, 'https://levois.fr').pathname : '';
  const category = a.category ?? categories[destination as keyof typeof categories];
  const missing = [
    [author, 'production.article.author', 'objet name/role explicite, ou une seule signature « Nom — rôle. RSAC … . Périmètre. » dans article.markdown'],
    [scope, 'production.article.scope', 'périmètre explicite, ou fin de la même signature'],
    [answer, 'production.article.answer', 'réponse explicite, ou premier paragraphe Markdown de 1200 caractères maximum sans troncature'],
    [category, 'production.article.category', 'vendre, acheter, vente-achat ou ventes-locales ; déduit seulement des quatre destinations métier connues'],
  ].filter(([value]) => value === undefined || value === null || value === '').map(([, field, rule]) => ({ field, rule }));
  if (missing.length) throw new Error(`Données indispensables absentes : ${JSON.stringify(missing)}`);
  const topicId = productionIdentity(options.campaignId, p.id);
  if (options.previous && options.previous.topicId !== topicId) throw new Error('previous.topicId: sujet différent');
  const revision = options.revision ?? options.previous?.revision ?? 1;
  if (!options.previous && revision !== 1) throw new Error('Un nouveau sujet commence à revision: 1');
  const dates = a.dates === undefined ? {} : object(a.dates, 'production.article.dates');
  const coverPending = a.image !== null && options.cover === null;
  if (options.testWithoutCover && options.cover !== null) throw new Error('testWithoutCover exige cover:null');
  if (coverPending && !options.testWithoutCover) throw new Error('Couverture finale absente : fournir le rendu 1600 × 900 ; testWithoutCover est réservé à la recette locale');
  // Only an in-memory projection changes the image declaration for the
  // explicitly authorised no-cover test. Source bytes are never modified.
  const input = coverPending && options.testWithoutCover ? { ...p, article: { ...a, image: null } } : p;
  const article = adaptProduction(input, {
    schemaVersion: 1, campaignId: options.campaignId, dayId: p.id,
    revision, author, dates, answer, scope, category,
  }, options.cover);
  // Compare at the prior status, so repeated draft conversions of a scheduled
  // article don't turn into spurious updates. A changed revision is explicit.
  const action = classifyEditorialImport(options.previous ? { ...article, status: options.previous.status } : article, options.previous);
  const report = {
    schemaVersion: 1, topicId, revision, action, status: 'draft',
    publicationReady: false, // Technical validity never substitutes for review.
    blockers: [...(coverPending ? ['final-cover-missing'] : []), 'batch-review-and-separate-activation-required'],
    mappings: {
      topicId: 'configuration campaignId + production.id (indépendant de version/date/slug)',
      revision: 'premier import : 1 ; rejeu : révision conservée ; modification : révision suivante explicite',
      answer: a.answer == null ? 'texte visible du premier paragraphe AST ; liens et Markdown conservés intégralement dans content' : 'production.article.answer',
      author: a.author == null ? 'signature explicite dans production.article.markdown' : 'production.article.author',
      scope: a.scope == null ? 'périmètre exact à la fin de la signature' : 'production.article.scope',
      category: a.category == null ? 'correspondance fixe de production.destination' : 'production.article.category',
      createdAt: dates.createdAt === undefined ? 'absente ; omise sans remplacement' : 'production.article.dates.createdAt',
      publishAt: 'créneau déclaré production.date + article.time + timezone ; pas une preuve de publication',
    },
    sourceImage: { reference: a.image, alt: a.image_alt, caption: a.image_caption },
    cover: coverPending ? 'pending; image:null pour le test seulement' : article.image === null ? 'aucune image déclarée' : 'couverture préparée',
    unchangedSourceFields: ['article.title', 'article.slug_propose', 'article.meta_description', 'article.markdown', 'sources', 'limites'],
    omittedSocialPayloads: ['carousel', 'video', 'article.linkedin_article', 'article.linkedin_fallback_post'],
  };
  return { article: article as EditorialArticleV2, report };
}
