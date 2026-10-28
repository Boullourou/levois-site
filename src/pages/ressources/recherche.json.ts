import { getPublishedEditorialArticles } from '../../lib/editorial/catalog';
import { RESOURCE_CATEGORY_LABELS, createResourceCatalog, resourceDate } from '../../lib/editorial/shared-catalog';
export const prerender = true;
export function GET() {
  const entries = createResourceCatalog(getPublishedEditorialArticles()).map(({ id, slug, title, summary, category, createdAt }) => ({
    id, slug, title, summary, categoryLabel: RESOURCE_CATEGORY_LABELS[category],
    ...(createdAt ? { createdAt, dateLabel: resourceDate(createdAt) } : {}),
  }));
  return new Response(JSON.stringify(entries), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
