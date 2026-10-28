import { describe, expect, it } from 'vitest';
import { resources } from '../src/data/resources';
import { createResourceCatalog, getResourceRegistry, paginateResources, resourceActionUrl, resourcePageUrl } from '../src/lib/editorial/shared-catalog';
import { searchResources } from '../src/lib/editorial/library-search';
import type { EditorialArticle } from '../src/lib/editorial/schema';

function fixture(index: number): EditorialArticle {
  return {
    schemaVersion: 1, topicId: `test-topic-${index}`, revision: 1, slug: `test-guide-${index}`,
    title: `Guide de test ${index}`, summary: 'Expliquer les étapes du projet.', answer: 'Une réponse utile sans promesse de résultat.',
    sections: [{ heading: 'Les vérifications', paragraphs: ['Une explication de méthode.'] }],
    author: { name: 'Mouaad Boullourou', role: 'Conseiller immobilier indépendant SAFTI' },
    dates: { createdAt: '2026-10-26T12:00:00+01:00', publishAt: '2026-10-27T07:00:00+01:00' },
    sources: [], scope: 'Fixture de test isolée, non publiée.', limits: ['Aucun résultat garanti.'], image: null,
    category: index % 2 ? 'acheter' : 'vente-achat', primaryDestination: index % 2 ? '/ma-recherche/' : '/vendre-et-acheter/', status: 'published',
  };
}

describe('Bibliothèque et historique éditorial', () => {
  it('préserve les sept URL sans fabriquer de date depuis Git', () => {
    const catalog = createResourceCatalog([]);
    expect(catalog.map((entry) => entry.slug)).toEqual(resources.map((entry) => entry.slug));
    for (const entry of catalog) {
      expect(entry.createdAt).toBeUndefined();
      expect(entry.updatedAt).toBeUndefined();
    }
  });
  it('répartit une année de nouveaux sujets et les anciens sans omission ni doublon', () => {
    const catalog = createResourceCatalog(Array.from({ length: 365 }, (_, index) => fixture(index)));
    const pages = paginateResources(catalog);
    expect(pages).toHaveLength(31);
    expect(pages.every((page) => page.length === 12)).toBe(true);
    expect(pages.flat().map((entry) => entry.id)).toEqual(catalog.map((entry) => entry.id));
    expect(new Set(pages.flat().map((entry) => entry.slug)).size).toBe(372);
  });
  it('utilise les mêmes pages pour une catégorie et protège les URL de première page', () => {
    const buyers = createResourceCatalog(Array.from({ length: 25 }, (_, index) => fixture(index))).filter((entry) => entry.category === 'acheter');
    expect(paginateResources(buyers, 5).map((page) => page.length)).toEqual([5, 5, 2]);
    expect(resourcePageUrl('/ressources/', 1)).toBe('/ressources/');
    expect(resourcePageUrl('/ressources/', 2)).toBe('/ressources/page/2/');
    expect(resourcePageUrl('/ressources/categorie/acheter/', 2)).toBe('/ressources/categorie/acheter/2/');
  });
  it('refuse un nouveau sujet qui détourne une URL historique', () => {
    expect(() => createResourceCatalog([{ ...fixture(0), slug: resources[0].slug }])).toThrow('double');
  });
  it('ne transforme pas une échéance en date de publication réelle', () => {
    const [entry] = createResourceCatalog([fixture(0)]);
    expect(entry.createdAt).toBe('2026-10-26T12:00:00+01:00');
    expect(entry).not.toHaveProperty('publishedAt');
    expect(entry).not.toHaveProperty('publishAt');
  });
  it('ne transmet que l’identité publique dans le registre et les liens', () => {
    const catalog = createResourceCatalog([fixture(0)]);
    for (const identity of getResourceRegistry(catalog)) expect(Object.keys(identity)).toEqual(['id', 'slug', 'title']);
    expect(resourceActionUrl('/contact/', 'test-topic-0')).toBe('/contact/?article=test-topic-0');
  });
});

describe('Recherche publique légère', () => {
  const entries = [
    { id: 'prix', slug: 'prix', title: 'Prix à Lèves', summary: 'Comparer une vente et les travaux.', categoryLabel: 'Prix et ventes locales' },
    { id: 'achat', slug: 'achat', title: 'Préparer son achat', summary: 'Vérifier le budget.', categoryLabel: 'Acheter un logement' },
  ];
  it('cherche sur tout le catalogue et ignore casse/accents', () => {
    expect(searchResources(entries, 'LEVES travaux').map((entry) => entry.id)).toEqual(['prix']);
    expect(searchResources(entries, 'budget').map((entry) => entry.id)).toEqual(['achat']);
    expect(searchResources(entries, 'inconnu')).toEqual([]);
  });
});
