/** Local, isolated Astro fixture: no article enters src/content/editorial. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

const project = process.cwd();
const fixtureRoot = path.join(project, 'artifacts/editorial-markdown-fixture');
const pages = path.join(fixtureRoot, 'src/pages');
await mkdir(pages, { recursive: true });
const fixture = {
  schemaVersion: 2, topicId: 'fixture-markdown', revision: 3, slug: 'fixture-markdown',
  title: 'Comprendre la portée d’une source', summary: 'Fixture technique isolée ; aucun article de test publié.',
  answer: 'Commencez par distinguer le fait documenté et ce qui reste à vérifier.',
  content: { format: 'commonmark', markdown: '# Comprendre la portée d’une source\n\nUne réponse **utile** avec [une source](https://example.org/source).\n\n## Les points à vérifier\n\n3. Examiner le document\n   - Garder sa date\n     - Garder sa portée\n4. Noter les limites\n\n### Une réserve utile\n\n> Un prix isolé ne suffit pas à conclure.\n\nUne limite explicite reste visible.' },
  author: { name: 'Auteur de test', role: 'Fixture non publiée' },
  dates: { createdAt: '2026-10-28', publishAt: '2026-10-29T07:00:00+01:00' },
  sources: [{ id: 'METHODE', label: 'Méthode explicite', url: null, accessedAt: '2026-10-28', scope: 'Cette méthode ne démontre aucun résultat financier.' }],
  scope: 'Fixture technique non publiée.', limits: ['Aucun résultat garanti.'],
  image: { src: '/editorial/fixture-markdown/test.png', alt: 'Repère de test.', width: 1, height: 1, caption: 'Illustration IA non localisée, sans lien avec un bien réel.' },
  category: 'vendre', primaryDestination: '/situer-ma-vente/', status: 'draft',
};
await writeFile(path.join(fixtureRoot, 'fixture.json'), JSON.stringify(fixture));
await writeFile(path.join(fixtureRoot, 'package.json'), JSON.stringify({ type: 'module', private: true }));
await writeFile(path.join(fixtureRoot, 'astro.config.mjs'), `import {defineConfig} from 'astro/config';import tailwind from '@tailwindcss/vite';export default defineConfig({site:'https://fixture.invalid',output:'static',vite:{plugins:[tailwind()]}});`);
await writeFile(path.join(pages, 'index.astro'), `---
import ArticlePage from '../../../../src/pages/ressources/[slug].astro';
import {validateEditorialArticle} from '../../../../src/lib/editorial/schema';
import {createResourceCatalog} from '../../../../src/lib/editorial/shared-catalog';
import fixture from '../../fixture.json';
const catalog=createResourceCatalog([validateEditorialArticle(fixture)]);
const resource=catalog[0];
---
<ArticlePage resource={resource} catalog={catalog}/>`);
execFileSync(process.execPath, [path.join(project, 'node_modules/astro/bin/astro.mjs'), 'build', '--root', fixtureRoot], { cwd: project, stdio: 'pipe', windowsHide: true });
const dist = path.join(fixtureRoot, 'dist');
const placeholder = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jw1cAAAAASUVORK5CYII=', 'base64');
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  if (pathname === fixture.image.src) { response.writeHead(200, { 'content-type': 'image/png' }).end(placeholder); return; }
  for (const directory of [dist, path.join(project, 'public')]) {
    const filename = path.resolve(directory, `.${pathname}`, ...(pathname.endsWith('/') ? ['index.html'] : []));
    if (!filename.startsWith(`${directory}${path.sep}`)) { response.writeHead(403).end(); return; }
    try {
      const content = await readFile(filename);
      const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.woff': 'font/woff', '.woff2': 'font/woff2', '.webp': 'image/webp', '.svg': 'image/svg+xml' }[path.extname(filename)] ?? 'application/octet-stream';
      response.writeHead(200, { 'content-type': mime }).end(content); return;
    } catch { /* Try the actual public asset directory. */ }
  }
  response.writeHead(404).end();
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const width of [360, 390, 430]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, javaScriptEnabled: false });
    await context.route('**/*', (route) => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    const page = await context.newPage();
    await page.goto(base);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(fixture.title);
    await expect(page.locator('.editorial-markdown ol')).toHaveAttribute('start', '3');
    await expect(page.locator('.editorial-markdown ol > li:first-child > ul > li > ul > li')).toHaveText('Garder sa portée');
    await expect(page.locator('.editorial-markdown blockquote')).toContainText('Un prix isolé');
    await expect(page.locator('.editorial-markdown a')).toHaveAttribute('href', 'https://example.org/source');
    await expect(page.locator('.res-sources')).toContainText('Cette méthode ne démontre aucun résultat financier.');
    await expect(page.locator('.res-sources a')).toHaveCount(0);
    await expect(page.locator('figcaption')).toHaveText(fixture.image.caption);
    await expect(page.locator('meta[name="levois:topic-id"]')).toHaveAttribute('content', fixture.topicId);
    await expect(page.locator('meta[name="levois:revision"]')).toHaveAttribute('content', '3');
    const structured = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    const article = structured['@graph'].find((entry) => entry['@type'] === 'Article');
    assert.equal(article.dateCreated, '2026-10-28');
    assert.equal(article.datePublished, undefined);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('.editorial-markdown').screenshot({ path: path.join(fixtureRoot, `markdown-${width}.png`) });
    results.push({ width, noJavaScript: true, h1: 1, nestedLists: true, sourceWithoutUrl: true, caption: true, metadata: true, overflow: false });
    await context.close();
  }
  await writeFile(path.join(fixtureRoot, 'report.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally { await browser.close(); server.close(); }
