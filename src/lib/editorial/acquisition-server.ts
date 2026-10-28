import registry from './article-registry.generated.json';
import type { ArticleContext } from './acquisition';

/** Ignore all client-supplied labels; only a known public ID may select context. */
export function resolveArticleContext(value: unknown): ArticleContext | null {
  if (!value || typeof value !== 'object' || !('id' in value) || typeof value.id !== 'string') return null;
  const item = registry.find(entry => entry.id === value.id);
  return item ? { id: item.id, slug: item.slug, title: item.title } : null;
}
