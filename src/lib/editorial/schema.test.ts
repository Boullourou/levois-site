import { describe, expect, it } from 'vitest';
import { classifyEditorialImport, editorialBuildTime, isEditorialPublished, parisDateParts, validateEditorialArticle, validateEditorialCatalog, type EditorialArticle } from './schema';

export function exampleArticle(): EditorialArticle {
  return {
    schemaVersion: 1, topicId: 'test-sujet-001', revision: 1, slug: 'exemple-test-non-publie',
    title: 'Exemple exclusivement utilisé dans les tests', summary: 'Une synthèse fictive de test.', answer: 'Une réponse de test, sans conseil financier.',
    sections: [{ heading: 'Vérifier', paragraphs: ['Un paragraphe de test.'] }],
    author: { name: 'Auteur de test', role: 'Exemple technique' },
    dates: { createdAt: '2026-10-27T10:00:00+01:00', publishAt: '2026-10-28T07:00:00+01:00' },
    sources: [], scope: 'Jeu de test sans publication.', limits: ['Exemple technique.'], image: null,
    category: 'vendre', primaryDestination: '/situer-ma-vente/', status: 'scheduled',
  };
}

describe('contrat éditorial', () => {
  it('validates a complete text article without fabricating update or read time', () => {
    const parsed = validateEditorialArticle(exampleArticle());
    expect(parsed.dates.updatedAt).toBeUndefined();
    expect(parsed).not.toHaveProperty('readingTime');
  });
  it.each([
    ['topicId', '../escape'], ['slug', 'a/b'], ['title', '<script>alert(1)</script>'],
    ['primaryDestination', 'https://example.com/'], ['status', 'approved'], ['revision', 0], ['unknown', true],
  ])('rejects invalid %s', (key, value) => {
    expect(() => validateEditorialArticle({ ...exampleArticle(), [key]: value })).toThrow();
  });
  it('rejects images outside a topic directory and HTML in body text', () => {
    expect(() => validateEditorialArticle({ ...exampleArticle(), image: { src: '/v7/image.webp', alt: 'Test', width: 100, height: 100 } })).toThrow();
    expect(() => validateEditorialArticle({ ...exampleArticle(), sections: [{ heading: 'Titre', paragraphs: ['<img src=x onerror=alert(1)>'] }] })).toThrow();
  });
  it('rejects impossible dates, missing timezone and wrong Paris offset', () => {
    for (const date of ['2026-02-30T07:00:00+01:00', '2026-10-28T07:00:00', '2026-10-28T07:00:00+02:00']) {
      expect(() => validateEditorialArticle({ ...exampleArticle(), dates: { createdAt: '2025-01-01T00:00:00Z', publishAt: date } })).toThrow();
    }
  });
  it('requires limits even for advice without a quantitative source', () => {
    expect(() => validateEditorialArticle({ ...exampleArticle(), limits: [] })).toThrow();
  });
  it('reserves historical URLs and detects duplicate ids / slugs / publication days', () => {
    const base = exampleArticle();
    expect(() => validateEditorialCatalog([base], [{ id: 'historique', slug: base.slug }])).toThrow(/URL/);
    expect(() => validateEditorialCatalog([base, base])).toThrow(/identifiant/);
    expect(() => validateEditorialCatalog([base, { ...base, topicId: 'autre', slug: 'autre' }])).toThrow(/créneau/);
    expect(() => validateEditorialCatalog([base, { ...base, topicId: 'autre', slug: 'autre', status: 'draft' }])).not.toThrow();
  });
});

describe('publication et heure Europe/Paris', () => {
  it.each([
    ['2027-03-27T07:00:00+01:00', '2027-03-27T06:00:00Z'],
    ['2027-03-28T07:00:00+02:00', '2027-03-28T05:00:00Z'],
    ['2027-10-30T07:00:00+02:00', '2027-10-30T05:00:00Z'],
    ['2027-10-31T07:00:00+01:00', '2027-10-31T06:00:00Z'],
  ])('handles the daylight-saving boundary at %s', (publishAt, utc) => {
    const article = validateEditorialArticle({ ...exampleArticle(), dates: { ...exampleArticle().dates, publishAt } });
    expect(Date.parse(article.dates.publishAt)).toBe(Date.parse(utc));
    expect(parisDateParts(new Date(utc)).hour).toBe(7);
    expect(isEditorialPublished(article, new Date(Date.parse(utc) - 1))).toBe(false);
    expect(isEditorialPublished(article, new Date(utc))).toBe(true);
  });
  it('never exposes a draft, archive or future published article', () => {
    const article = exampleArticle();
    expect(isEditorialPublished({ ...article, status: 'published' }, new Date('2026-10-27T12:00:00Z'))).toBe(false);
    for (const status of ['draft', 'archived'] as const) expect(isEditorialPublished({ ...article, status }, new Date('2028-01-01T00:00:00Z'))).toBe(false);
  });
  it('freezes one build clock and forbids a future build clock', () => {
    const now = new Date('2026-10-28T06:05:00Z');
    expect(editorialBuildTime('2026-10-28T06:00:00Z', now).toISOString()).toBe('2026-10-28T06:00:00.000Z');
    expect(() => editorialBuildTime('2026-10-28T06:06:00Z', now)).toThrow(/anticiper/);
  });
});

describe('idempotence et révisions', () => {
  it('replays the same semantic payload without creating another article', () => {
    const existing = validateEditorialArticle(exampleArticle());
    const reordered = validateEditorialArticle(Object.fromEntries(Object.entries(exampleArticle()).reverse()));
    expect(classifyEditorialImport(reordered, existing)).toBe('unchanged');
  });
  it('rejects an altered retry, stale revision or changed historical URL', () => {
    const existing = exampleArticle();
    expect(() => classifyEditorialImport({ ...existing, title: 'Une modification cachée' }, existing)).toThrow(/révision/);
    expect(() => classifyEditorialImport({ ...existing, revision: 1 }, { ...existing, revision: 2 })).toThrow(/périmée/);
    expect(() => classifyEditorialImport({ ...existing, revision: 2, slug: 'nouvelle-url' }, existing)).toThrow(/immuables/);
  });
  it('requires an explicit newer modification date for the next revision', () => {
    const existing = exampleArticle();
    const updated = { ...existing, revision: 2, title: 'Une modification relue' };
    expect(() => classifyEditorialImport(updated, existing)).toThrow(/updatedAt/);
    expect(classifyEditorialImport({ ...updated, dates: { ...updated.dates, updatedAt: '2026-10-28T09:00:00+01:00' } }, existing)).toBe('updated');
  });
});
