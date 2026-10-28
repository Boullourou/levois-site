import { describe, expect, it } from 'vitest';
import { convertProduction } from './production-conversion';
import { productionFixture } from '../../../tests/fixtures/editorial-production';

const signature = 'Auteur de test — conseiller de test. RSAC Exemple 000. Périmètre explicitement fourni.';
function source() {
  const p = productionFixture();
  p.article.markdown += `\n\n${signature}`;
  return p;
}
const options = { campaignId: 'campagne-test', cover: null, testWithoutCover: true };

describe('Conversion directe PRODUCTION → SITE sans pièce éditoriale supplémentaire', () => {
  it('convertit le texte source sans l’altérer, extrait les champs et omet la création inconnue', () => {
    const p = source(), before = JSON.stringify(p);
    const { article, report } = convertProduction(p, options);
    expect(article.content.markdown).toBe(p.article.markdown);
    expect(article.answer).toBe('Un texte conservé, avec un document.');
    expect(article.author).toEqual({ name: 'Auteur de test', role: 'conseiller de test' });
    expect(article.scope).toBe('Périmètre explicitement fourni.');
    expect(article.category).toBe('ventes-locales');
    expect(article.dates).toEqual({ publishAt: '2026-10-29T07:00:00+01:00' });
    expect(article.image).toBeNull();
    expect(article.status).toBe('draft');
    expect(report.sourceImage).toEqual({ reference: p.article.image, alt: p.article.image_alt, caption: p.article.image_caption });
    expect(report.publicationReady).toBe(false);
    expect(report.blockers).toContain('final-cover-missing');
    expect(JSON.stringify(p)).toBe(before);
  });
  it('reste déterministe et un rejeu du même sujet ne devient pas un nouvel article', () => {
    const p = source();
    const first = convertProduction(p, options);
    expect(convertProduction(p, options)).toEqual(first);
    const retry = convertProduction(p, { ...options, previous: first.article });
    expect(retry.article).toEqual(first.article);
    expect(retry.report.action).toBe('unchanged');
    const changed = source(); changed.version = 'V99';
    expect(convertProduction(changed, options).article.topicId).toBe(first.article.topicId);
  });
  it('exige une révision explicite pour modifier un sujet existant', () => {
    const p = source(), previous = convertProduction(p, options).article;
    p.article.meta_description = 'Une nouvelle description explicitement fournie.';
    expect(() => convertProduction(p, { ...options, previous })).toThrow();
    const updated = { ...p, article: { ...p.article, dates: { updatedAt: '2026-10-28' } } };
    expect(convertProduction(updated, { ...options, previous, revision: 2 }).article.revision).toBe(2);
  });
  it('refuse de remplacer la couverture sans option de test explicite et garde le source intact', () => {
    expect(() => convertProduction(source(), { ...options, testWithoutCover: false })).toThrow(/Couverture finale absente/);
    const p = source(); p.article.image = null;
    expect(convertProduction(p, { ...options, testWithoutCover: false }).report.blockers).not.toContain('final-cover-missing');
    expect(() => convertProduction({ ...p, article: { ...p.article, image: undefined } }, options)).toThrow(/image/);
  });
  it('refuse les champs réellement absents ou ambigus avec leur règle, sans auteur par défaut', () => {
    expect(() => convertProduction(productionFixture(), options)).toThrow(/production.article.author/);
    const ambiguous = source(); ambiguous.article.markdown += `\n\nAutre nom — autre rôle. RSAC Test 111. Autre périmètre.`;
    expect(() => convertProduction(ambiguous, options)).toThrow(/production.article.author/);
    const p = source(); p.destination = 'https://levois.fr/contact/';
    expect(() => convertProduction(p, options)).toThrow(/production.article.category/);
  });
  it('préserve les métadonnées explicites et les vraies dates si elles sont fournies', () => {
    const p = source();
    const article = { ...p.article, answer: 'Réponse explicite.', scope: 'Portée explicite.', author: { name: 'Auteur explicite', role: 'Rôle explicite' }, dates: { createdAt: '2026-10-20', updatedAt: '2026-10-21' } };
    const result = convertProduction({ ...p, article }, options).article;
    expect(result.answer).toBe(article.answer); expect(result.scope).toBe(article.scope); expect(result.author).toEqual(article.author);
    expect(result.dates.createdAt).toBe('2026-10-20'); expect(result.dates.updatedAt).toBe('2026-10-21');
  });
  it('ne tronque pas un premier paragraphe trop long et refuse le Markdown non supporté', () => {
    const p = source(); p.article.markdown = `# ${p.article.title}\n\n${'a'.repeat(1201)}\n\n${signature}`;
    expect(() => convertProduction(p, options)).toThrow(/answer/);
    p.article.markdown = `# ${p.article.title}\n\n<img src=x>\n\n${signature}`;
    expect(() => convertProduction(p, options)).toThrow();
  });
  it('trace correctement les replis déterministes lorsque les champs explicites valent null', () => {
    const p = source();
    const result = convertProduction({ ...p, article: { ...p.article, answer: null, author: null, scope: null, category: null } }, options);
    expect(result.report.mappings.answer).toContain('premier paragraphe');
    expect(result.report.mappings.author).toContain('signature');
    expect(result.report.mappings.scope).toContain('signature');
    expect(result.report.mappings.category).toContain('destination');
  });
});
