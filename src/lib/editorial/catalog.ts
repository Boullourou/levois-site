import { resources } from '../../data/resources';
import clock from './build-clock.generated.json';
import { editorialBuildTime, isEditorialPublished, validateEditorialCatalog, type EditorialArticle } from './schema';

const modules = import.meta.glob('../../content/editorial/*.json', { eager: true, import: 'default' });
const articles = validateEditorialCatalog(Object.values(modules), resources);
const buildTime = editorialBuildTime(clock.at);

/** Import server-side only. Drafts and future articles never enter generated pages. */
export function getPublishedEditorialArticles(at: Date = buildTime): EditorialArticle[] {
  return articles.filter((article) => isEditorialPublished(article, at)).sort((a, b) => b.dates.publishAt.localeCompare(a.dates.publishAt) || a.topicId.localeCompare(b.topicId));
}

export function getEditorialArticleBySlug(slug: string, at: Date = buildTime): EditorialArticle | undefined {
  return getPublishedEditorialArticles(at).find((article) => article.slug === slug);
}

export type { EditorialArticle } from './schema';
