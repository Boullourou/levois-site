export interface ArticleContext { id: string; slug: string; title: string }
const storageKey = 'levois:article-context:v1';
let current: ArticleContext | null = null;

/** Only public, published article metadata is retained; never questionnaire answers. */
export function getArticleContext(): ArticleContext | null {
  const element = document.getElementById('levois-article-context');
  let registry: ArticleContext[];
  try { registry = JSON.parse(element?.textContent || '[]'); } catch { return null; }
  if (!Array.isArray(registry)) return null;
  const url = new URL(window.location.href);
  const path = url.pathname.replace(/\/$/, '');
  const ownArticle = registry.find(item => path === `/ressources/${item.slug}`);
  const requested = url.searchParams.get('article') ?? ownArticle?.id ?? null;
  let saved: string | null = current?.id ?? null;
  try { saved ||= sessionStorage.getItem(storageKey); } catch { /* Memory fallback. */ }
  const id = requested ?? saved;
  current = registry.find(item => item.id === id) ?? null;
  if (requested !== null) {
    try { if (current) sessionStorage.setItem(storageKey, current.id); else sessionStorage.removeItem(storageKey); } catch { /* Storage may be unavailable. */ }
  }
  return current;
}
