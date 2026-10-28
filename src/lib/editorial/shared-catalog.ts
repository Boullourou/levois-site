import { resources } from '../../data/resources';
import { getResourceContent, type ResourceContent } from '../../data/resourceContent';
import type { EditorialArticle, EditorialArticleV1, EditorialArticleV2 } from './schema';

export const RESOURCE_CATEGORY_LABELS = {
  vendre: 'Préparer ou vendre',
  acheter: 'Acheter un logement',
  'vente-achat': 'Vendre puis acheter',
  'ventes-locales': 'Prix et ventes locales',
} as const;
export const RESOURCE_PAGE_SIZE = 12;
export const RESOURCE_SEARCH_THRESHOLD = 12;
export type ResourceCategory = EditorialArticle['category'];
export interface ResourceArticle {
  id: string;
  topicId?: string;
  revision?: number;
  slug: string;
  title: string;
  summary: string;
  answer: string;
  sections: EditorialArticleV1['sections'];
  content?: EditorialArticleV2['content'];
  author: EditorialArticle['author'];
  createdAt?: string;
  updatedAt?: string;
  sources: { id?: string; label: string; url: string | null; accessedAt?: string; scope?: string }[];
  scope: string;
  limits: string[];
  image: EditorialArticle['image'];
  category: ResourceCategory;
  primaryDestination: EditorialArticle['primaryDestination'];
  legacyContent?: ResourceContent;
}
export interface ResourceIdentity { id: string; slug: string; title: string }

/** The seven legacy publication dates are unknown. Git timestamps are not publication dates. */
export function createResourceCatalog(editorialArticles: EditorialArticle[]): ResourceArticle[] {
  const legacy = resources.map((resource): ResourceArticle => {
    const content = getResourceContent(resource.id);
    const isPrice = ['marge-negociation-erreur-25000', 'verifier-avant-baisse-prix'].includes(resource.id);
    return {
      id: resource.id, slug: resource.slug, title: resource.titre, summary: resource.benefice,
      answer: content.reponseCourte, sections: [],
      author: { name: 'Mouaad Boullourou', role: 'Conseiller immobilier indépendant SAFTI' },
      sources: isPrice ? [{ label: 'DGFiP — Demandes de valeurs foncières : nature et limites des données de transactions', url: 'https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres' }] : [],
      scope: 'Conseils de méthode pour un projet à Lèves et Chartres Métropole. Les exemples sont pédagogiques ; ils ne constituent ni un relevé de ventes locales ni des témoignages clients.',
      limits: [content.limite], image: null,
      category: isPrice ? 'ventes-locales' : 'vendre',
      primaryDestination: isPrice ? '/votre-rue/' : '/situer-ma-vente/',
      legacyContent: content,
    };
  });
  const current = [...editorialArticles].sort((a, b) => Date.parse(b.dates.publishAt) - Date.parse(a.dates.publishAt) || a.topicId.localeCompare(b.topicId)).map((article): ResourceArticle => ({
    id: article.topicId, topicId: article.topicId, revision: article.revision, slug: article.slug, title: article.title, summary: article.summary,
    answer: article.answer, sections: article.schemaVersion === 1 ? article.sections : [], content: article.schemaVersion === 2 ? article.content : undefined, author: article.author,
    createdAt: article.dates.createdAt, updatedAt: article.dates.updatedAt,
    sources: article.sources, scope: article.scope, limits: article.limits,
    image: article.image, category: article.category, primaryDestination: article.primaryDestination,
  }));
  const entries = [...current, ...legacy];
  if (new Set(entries.map((entry) => entry.id)).size !== entries.length || new Set(entries.map((entry) => entry.slug)).size !== entries.length) throw new Error('Identifiant ou URL de ressource en double');
  return entries;
}

/** Safe public context only; no body, answer, personal data, or unpublished article. */
export function getResourceRegistry(entries: ResourceArticle[]): ResourceIdentity[] {
  return entries.map(({ id, slug, title }) => ({ id, slug, title }));
}

export function paginateResources<T>(entries: T[], pageSize = RESOURCE_PAGE_SIZE): T[][] {
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error('Taille de page invalide');
  return Array.from({ length: Math.max(1, Math.ceil(entries.length / pageSize)) }, (_, index) => entries.slice(index * pageSize, (index + 1) * pageSize));
}

export function resourcePageUrl(base: string, page: number): string {
  return page === 1 ? base : `${base}${base === '/ressources/' ? 'page/' : ''}${page}/`;
}

export function resourceDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

export const RESOURCE_CTA_LABELS: Record<EditorialArticle['primaryDestination'], string> = {
  '/votre-rue/': 'Consulter les ventes près de chez moi',
  '/situer-ma-vente/': 'Faire le point sur ma vente',
  '/ma-recherche/': 'Faire le point sur mon achat',
  '/vendre-et-acheter/': 'Préparer ma vente et mon achat',
  '/contact/': 'Écrire à Mouaad',
};

export function resourceActionUrl(destination: EditorialArticle['primaryDestination'], id: string): string {
  return `${destination}?article=${encodeURIComponent(id)}`;
}
