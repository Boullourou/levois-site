export interface ResourceSearchEntry { id: string; slug: string; title: string; summary: string; categoryLabel: string; dateLabel?: string; createdAt?: string }
export function normalizeResourceSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR').trim();
}
export function searchResources(entries: ResourceSearchEntry[], query: string): ResourceSearchEntry[] {
  const words = normalizeResourceSearch(query).split(/\s+/).filter(Boolean);
  return entries.filter((entry) => {
    const haystack = normalizeResourceSearch(`${entry.title} ${entry.summary} ${entry.categoryLabel}`);
    return words.every((word) => haystack.includes(word));
  });
}

export function initResourceSearch(): void {
  const root = document.querySelector<HTMLElement>('[data-resource-search]');
  const input = root?.querySelector<HTMLInputElement>('input');
  const results = document.getElementById('resource-search-results');
  const original = document.querySelector<HTMLElement>('[data-resource-default]');
  const status = root?.querySelector<HTMLElement>('[data-search-status]');
  if (!root || !input || !results || !original || !status) return;
  root.hidden = false;
  let entries: ResourceSearchEntry[] | undefined;
  let pending: Promise<ResourceSearchEntry[]> | undefined;
  let request = 0;
  const load = () => pending ??= fetch('/ressources/recherche.json', { credentials: 'omit' }).then(async (response) => {
    if (!response.ok) throw new Error('Index indisponible');
    return await response.json() as ResourceSearchEntry[];
  }).catch((error) => { pending = undefined; throw error; });
  const update = async () => {
    const current = ++request;
    const query = input.value.trim();
    if (!query) { original.hidden = false; results.hidden = true; results.replaceChildren(); status.textContent = ''; return; }
    status.textContent = 'Recherche en cours…';
    try {
      entries ??= await load();
      if (current !== request) return;
      const matches = searchResources(entries, query);
      results.replaceChildren();
      for (const entry of matches) {
        const article = document.createElement('article'); article.className = 'res-card';
        // Astro-scoped CSS is inherited from a real card, including on search results.
        const template = original.querySelector('article');
        for (const name of template?.getAttributeNames() ?? []) if (name.startsWith('data-astro-cid-')) article.setAttribute(name, '');
        const heading = document.createElement('h2'); heading.className = 'res-card-title'; const link = document.createElement('a');
        link.href = `/ressources/${encodeURIComponent(entry.slug)}/`; link.textContent = entry.title; heading.append(link);
        const subject = document.createElement('p'); subject.className = 'res-category'; subject.textContent = entry.categoryLabel;
        const summary = document.createElement('p'); summary.className = 'res-card-desc'; summary.textContent = entry.summary;
        article.append(subject, heading, summary);
        if (entry.createdAt && entry.dateLabel) { const date = document.createElement('time'); date.dateTime = entry.createdAt; date.textContent = `Rédigé le ${entry.dateLabel}`; article.append(date); }
        for (const child of article.querySelectorAll('*')) for (const name of article.getAttributeNames()) if (name.startsWith('data-astro-cid-')) child.setAttribute(name, '');
        results.append(article);
      }
      original.hidden = true; results.hidden = false;
      status.textContent = matches.length ? `${matches.length} ressource${matches.length > 1 ? 's' : ''} trouvée${matches.length > 1 ? 's' : ''}.` : 'Aucune ressource trouvée. Essayez un autre mot ou effacez la recherche.';
    } catch {
      if (current !== request) return;
      original.hidden = false; results.hidden = true;
      status.textContent = 'La recherche est momentanément indisponible. Les catégories et les pages restent accessibles. Réessayez en modifiant votre recherche.';
    }
  };
  input.addEventListener('input', update);
  root.querySelector('[data-search-clear]')?.addEventListener('click', () => { input.value = ''; void update(); input.focus(); });
}
