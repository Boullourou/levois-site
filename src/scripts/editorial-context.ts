import { getArticleContext } from '../lib/editorial/acquisition';

// Functional context: the article is public. Questionnaire answers never enter links.
const article = getArticleContext();
if (article) {
  const destinations = new Set(['/votre-rue', '/situer-ma-vente', '/ma-recherche', '/vendre-et-acheter', '/contact', '/lecture']);
  const updateLink = (link: HTMLAnchorElement) => {
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || !destinations.has(url.pathname.replace(/\/$/, ''))) return;
    url.searchParams.set('article', article.id);
    link.href = `${url.pathname}${url.search}${url.hash}`;
  };
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(updateLink);
  // The reading creates links after five answers. Delegation also covers these
  // links when storage is unavailable, keyboard activation and opening a new tab.
  for (const name of ['click', 'pointerdown', 'focusin', 'contextmenu']) document.addEventListener(name, event => {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
    if (link) updateLink(link);
  });
}
