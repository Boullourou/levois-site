import { describe, expect, it } from 'vitest';
import { adaptProduction, missingProductionMetadata, plannedParisPublication, productionIdentity } from './production';
import { productionFixture, productionMetadataFixture } from '../../../tests/fixtures/editorial-production';

const cover = { src: '/editorial/campagne-test-j001/cover.webp', width: 1600, height: 900 };

describe('Adaptateur PRODUCTION vers V2 sans faits inventés', () => {
  it('conserve exactement Markdown, liens, sources, portée, limites, auteur et précision des dates', () => {
    const production = productionFixture();
    const metadata = productionMetadataFixture();
    const before = JSON.stringify({ production, metadata });
    const article = adaptProduction(production, metadata, cover);
    expect(article).toEqual({
      schemaVersion: 2, topicId: 'campagne-test-j001', revision: 1, slug: production.article.slug_propose,
      title: production.article.title, summary: production.article.meta_description, answer: metadata.answer,
      content: { format: 'commonmark', markdown: production.article.markdown }, author: metadata.author,
      dates: { createdAt: '2026-01-01', publishAt: '2026-10-29T07:00:00+01:00' },
      sources: production.sources.map((source) => ({ id: source.id, label: source.editeur, url: source.url, accessedAt: source.lecture, scope: source.portee })),
      scope: metadata.scope, limits: [production.limites],
      image: { ...cover, alt: production.article.image_alt, caption: production.article.image_caption },
      category: metadata.category, primaryDestination: '/votre-rue/', status: 'draft',
    });
    expect(article.sources[1].url).toBeNull();
    expect(article.dates).not.toHaveProperty('updatedAt');
    expect(article.dates).not.toHaveProperty('datePublished');
    expect(article).not.toHaveProperty('readingTime');
    expect(article).not.toHaveProperty('carousel');
    expect(article).not.toHaveProperty('video');
    expect(JSON.stringify({ production, metadata })).toBe(before);
  });
  it('conserve une vraie date de modification fournie, sans utiliser date ou source_read_date comme création', () => {
    const metadata = productionMetadataFixture();
    metadata.dates.updatedAt = '2026-01-03';
    const article = adaptProduction(productionFixture(), metadata, cover);
    expect(article.dates).toEqual({ createdAt: '2026-01-01', updatedAt: '2026-01-03', publishAt: '2026-10-29T07:00:00+01:00' });
  });
  it('garde un identifiant stable quand version, titre ou date source changent', () => {
    const first = productionFixture();
    const changed = productionFixture();
    changed.version = 'FIXTURE-V99';
    changed.date = '2026-11-05';
    changed.article.title = 'Un autre titre explicite';
    changed.article.slug_propose = 'autre-titre-explicite';
    changed.article.markdown = '# Un autre titre explicite\n\nUn texte explicite.';
    expect(adaptProduction(first, productionMetadataFixture(), cover).topicId).toBe(adaptProduction(changed, productionMetadataFixture(), cover).topicId);
    expect(productionIdentity('campagne-test', 'J010')).toBe('campagne-test-j010');
  });
  it('n’invente aucune image et exige la cohérence entre référence déclarée et couverture livrée', () => {
    expect(() => adaptProduction(productionFixture(), productionMetadataFixture(), null)).toThrow(/couverture/);
    const p = productionFixture(); p.article.image = null;
    expect(adaptProduction(p, productionMetadataFixture(), null).image).toBeNull();
    expect(() => adaptProduction(p, productionMetadataFixture(), cover)).toThrow(/couverture/);
    expect(() => adaptProduction({ ...p, article: { ...p.article, image: '' } }, productionMetadataFixture(), null)).toThrow(/référence vide/);
  });
  it('énumère tous les champs complémentaires indispensables sans repli implicite', () => {
    expect(missingProductionMetadata(undefined)).toEqual([
      'metadata.schemaVersion', 'metadata.campaignId', 'metadata.dayId', 'metadata.revision',
      'metadata.author.name', 'metadata.author.role', 'metadata.dates', 'metadata.answer', 'metadata.scope', 'metadata.category',
    ]);
    for (const key of ['schemaVersion', 'campaignId', 'dayId', 'revision', 'author', 'dates', 'answer', 'scope', 'category']) {
      const metadata: Record<string, unknown> = { ...productionMetadataFixture() }; delete metadata[key];
      expect(() => adaptProduction(productionFixture(), metadata, cover)).toThrow(/absentes/);
    }
  });
  it.each(['sources', 'limites', 'destination', 'article'])('refuse le champ source indispensable manquant : %s', (key) => {
    const production: Record<string, unknown> = { ...productionFixture() }; delete production[key];
    expect(() => adaptProduction(production, productionMetadataFixture(), cover)).toThrow();
  });
  it.each(['title', 'slug_propose', 'meta_description', 'markdown', 'image', 'image_alt', 'image_caption', 'time'])('refuse le champ article indispensable manquant : %s', (key) => {
    const production = productionFixture(); const article: Record<string, unknown> = { ...production.article }; delete article[key];
    expect(() => adaptProduction({ ...production, article }, productionMetadataFixture(), cover)).toThrow();
  });
  it.each([
    { ready_for_production: false }, { research_by_limova: true }, { editorial_rewrite_by_limova: true },
    { destination: 'https://other.invalid/contact/' }, { destination: 'https://levois.fr/contact/?email=private' },
    { destination: 'https://levois.fr/contact/#private' }, { destination: 'https://levois.fr/recrutement/' },
  ])('refuse les instructions de production incompatibles : %j', (patch) => {
    expect(() => adaptProduction({ ...productionFixture(), ...patch }, productionMetadataFixture(), cover)).toThrow();
  });
  it('refuse une source amputée, une source dupliquée ou un changement implicite de métadonnées', () => {
    const p = productionFixture();
    expect(() => adaptProduction({ ...p, sources: [{ ...p.sources[0], url: undefined }] }, productionMetadataFixture(), cover)).toThrow(/URL ou null/);
    expect(() => adaptProduction({ ...p, sources: [p.sources[0], p.sources[0]] }, productionMetadataFixture(), cover)).toThrow(/dupliqué/);
    expect(() => adaptProduction(p, { ...productionMetadataFixture(), dayId: 'J002' }, cover)).toThrow(/dayId/);
    expect(() => adaptProduction(p, { ...productionMetadataFixture(), readingTime: 5 }, cover)).toThrow(/champ inconnu/);
    expect(() => adaptProduction(p, { ...productionMetadataFixture(), dates: { createdAt: '2026-01-01', publishedAt: '2026-01-02' } }, cover)).toThrow(/champ inconnu/);
  });
});

describe('Créneaux civils Europe/Paris et changements d’heure 2026/2027', () => {
  it.each([
    ['2026-03-28', '+01:00', '2026-03-28T06:00:00Z'], ['2026-03-29', '+02:00', '2026-03-29T05:00:00Z'],
    ['2026-10-24', '+02:00', '2026-10-24T05:00:00Z'], ['2026-10-25', '+01:00', '2026-10-25T06:00:00Z'],
    ['2027-03-27', '+01:00', '2027-03-27T06:00:00Z'], ['2027-03-28', '+02:00', '2027-03-28T05:00:00Z'],
    ['2027-10-30', '+02:00', '2027-10-30T05:00:00Z'], ['2027-10-31', '+01:00', '2027-10-31T06:00:00Z'],
  ])('garde 07:00 local pour %s', (date, offset, utc) => {
    const planned = plannedParisPublication(date, '07:00', 'Europe/Paris');
    expect(planned).toBe(`${date}T07:00:00${offset}`);
    expect(Date.parse(planned)).toBe(Date.parse(utc));
  });
  it.each([
    ['2026-02-30', '07:00', 'Europe/Paris'], ['2027-02-29', '07:00', 'Europe/Paris'],
    ['2026-10-29', '06:00', 'Europe/Paris'], ['2026-10-29', '07:00', 'UTC'],
    ['2026-10-29T07:00:00+01:00', '07:00', 'Europe/Paris'],
  ])('refuse un créneau invalide : %s %s %s', (date, time, timezone) => {
    expect(() => plannedParisPublication(date, time, timezone)).toThrow();
  });
});
