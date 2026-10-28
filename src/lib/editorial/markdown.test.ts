import { describe, expect, it } from 'vitest';
import { parseEditorialMarkdown, renderEditorialMarkdown } from './markdown';
import { validateEditorialArticle, type EditorialArticleV2 } from './schema';
import { createResourceCatalog } from './shared-catalog';

const markdown = '# Un titre explicite\r\n\r\nUne réponse **franche**, *sans garantie*, avec [sa source](https://example.org/source?version=1&edition=2 "Document source").\r\n\r\n## Vérifier avant de décider\r\n\r\n3. Un premier point\r\n   - Une précision\r\n     - Un autre niveau\r\n4. Un second point\r\n\r\n### La question utile\r\n\r\n> Une citation.\r\n>\r\n> Un second paragraphe.\r\n\r\nLa suite  \r\nsur une autre ligne.\r\n';
const v2 = (body = markdown): EditorialArticleV2 => ({
  schemaVersion: 2, topicId: 'test-markdown', revision: 1, slug: 'test-markdown', title: 'Un titre explicite',
  summary: 'Résumé fourni séparément.', answer: 'Réponse fournie séparément, sans estimation.',
  content: { format: 'commonmark', markdown: body },
  author: { name: 'Auteur de test', role: 'Exemple non publié' },
  dates: { createdAt: '2026-10-28', publishAt: '2026-10-29T07:00:00+01:00' },
  sources: [{ id: 'METHODE', label: 'Méthode de préparation', url: null, accessedAt: '2026-10-28', scope: 'Conseil de méthode, sans statistique locale.' }],
  scope: 'Fixture non publiée.', limits: ['Aucun résultat commercial ou financier garanti.'],
  image: { src: '/editorial/test-markdown/illustration.webp', alt: 'Illustration symbolique.', width: 1600, height: 900, caption: 'Illustration IA non localisée, sans lien avec un bien réel.' },
  category: 'vendre', primaryDestination: '/situer-ma-vente/', status: 'draft',
});

describe('Markdown éditorial conservé, sans réécriture', () => {
  it('conserve strictement la chaîne, sa structure et ses métadonnées explicites', () => {
    const original = v2();
    const parsed = validateEditorialArticle(original);
    expect(parsed).toEqual(original);
    expect(parsed.schemaVersion === 2 && parsed.content.markdown).toBe(markdown);
    expect(parsed.dates.createdAt).toBe('2026-10-28');
    expect(parsed.dates).not.toHaveProperty('updatedAt');
    expect(parsed.dates).not.toHaveProperty('publishedAt');
    expect(parsed).not.toHaveProperty('readingTime');
    const [entry] = createResourceCatalog([parsed]);
    expect(entry.content?.markdown).toBe(markdown);
    expect(entry.sources).toEqual(original.sources);
    expect(entry.image).toEqual(original.image);
    expect(entry.limits).toEqual(original.limits);
    expect(entry.topicId).toBe(original.topicId);
    expect(entry.revision).toBe(original.revision);
  });
  it('rend titres, liens, emphase, listes imbriquées, citation et retour forcé', () => {
    const rendered = renderEditorialMarkdown(markdown, { title: 'Un titre explicite' });
    expect(rendered).not.toContain('<h1>'); // Already displayed once by the page header.
    expect(rendered).toContain('<strong>franche</strong>');
    expect(rendered).toContain('<em>sans garantie</em>');
    expect(rendered).toContain('<a href="https://example.org/source?version=1&amp;edition=2" title="Document source">sa source</a>');
    expect(rendered).toContain('<h2>Vérifier avant de décider</h2>');
    expect(rendered).toContain('<h3>La question utile</h3>');
    expect(rendered).toContain('<ol start="3"><li>Un premier point<ul><li>Une précision<ul><li>Un autre niveau</li></ul></li></ul></li><li>Un second point</li></ol>');
    expect(rendered).toContain('<blockquote><p>Une citation.</p><p>Un second paragraphe.</p></blockquote>');
    expect(rendered).toContain('La suite<br>sur une autre ligne.');
  });
  it('conserve les références de liens, leurs titres et les URL nues de bibliographie', () => {
    const body = '[La source][preuve]\n\n[preuve]: https://example.org/doc "Pièce documentaire"\n\n- Source officielle : https://example.org/doc';
    const rendered = renderEditorialMarkdown(body);
    expect(rendered).toContain('<a href="https://example.org/doc" title="Pièce documentaire">La source</a>');
    expect(rendered).toContain('<li>Source officielle : <a href="https://example.org/doc">https://example.org/doc</a></li>');
    expect(() => parseEditorialMarkdown('[a]: https://example.org\n[a]: https://example.net')).toThrow(/dupliquée/);
  });
  it('refuse un H1 non identique ou un deuxième H1 au lieu de le supprimer', () => {
    expect(() => renderEditorialMarkdown('# Un autre titre', { title: 'Titre' })).toThrow(/H1/);
    expect(() => renderEditorialMarkdown('# Titre\n\n# Titre', { title: 'Titre' })).toThrow(/H1/);
    expect(() => renderEditorialMarkdown('#### Un sous-titre')).toThrow(/H2 et H3/);
  });
  it('ne fabrique pas auteur, réponse, dates, sources, limites ni légende', () => {
    for (const key of ['author', 'answer', 'dates', 'sources', 'scope', 'limits']) {
      const input = { ...v2() } as Record<string, unknown>;
      delete input[key];
      expect(() => validateEditorialArticle(input)).toThrow();
    }
    expect(() => validateEditorialArticle({ ...v2(), image: { src: '/editorial/test-markdown/photo.webp', alt: 'Photo', width: 1600, height: 900 } })).toThrow(/caption/);
    expect(() => validateEditorialArticle({ ...v2(), sources: [{ ...v2().sources[0], accessedAt: '2026-02-30' }] })).toThrow(/date civile/);
    expect(() => validateEditorialArticle({ ...v2(), sections: [] })).toThrow(/sections/);
  });
});

describe('Rendu AST strict et sûr', () => {
  it.each([
    '<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '<Widget onClick={alert(1)} />', '<Widget {...props} />', '<>texte</>', '<Widget prop={()=>1}/>',
    '![Une image](https://example.org/image.jpg)', '[image]: https://example.org/a.jpg\n\n![Une image][image]',
    '```js\nalert(1)\n```', 'Du `code` dans un paragraphe.',
    '| a | b |\n| - | - |\n| c | d |', '- [x] Une tâche', '~~Un texte barré~~',
    'Un fait[^1]\n\n[^1]: Une note.', '---\nauthor: Personne\n---\nTexte.',
  ])('refuse explicitement la structure non supportée : %s', (body) => {
    expect(() => parseEditorialMarkdown(body)).toThrow(/non pris en charge|non prise en charge/);
  });
  it.each([
    '[clic](javascript:alert%281%29)', '[clic](JaVaScRiPt:alert%281%29)', '[clic](data:text/html,secret)',
    '[clic](//example.org)', '[clic](https://user:password@example.org)', '[clic](file:///secret)',
    '[clic](jav&#x61;script:alert%281%29)', '[clic](https://example.org/%0asecret)',
  ])('refuse un lien dangereux sans le réécrire : %s', (body) => {
    expect(() => renderEditorialMarkdown(body)).toThrow(/lien/);
  });
  it('échappe les textes et attributs sans interpréter de code ni HTML échappé', () => {
    const html = renderEditorialMarkdown('&lt;script&gt;alert(1)&lt;/script&gt; & un texte\n\n[lien](https://example.org "&quot; onmouseover=&quot;alert(1)")');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; un texte');
    expect(html).toContain('title="&quot; onmouseover=&quot;alert(1)"');
    expect(html).not.toContain('<script>');
  });
});
