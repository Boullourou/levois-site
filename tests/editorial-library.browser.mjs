/** Isolated fixture site: never writes a test article to src/content/editorial. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

const project = process.cwd();
const fixtureRoot = path.join(project, 'artifacts', 'editorial-library-fixture');
const pagesDirectory = path.join(fixtureRoot, 'src', 'pages', 'ressources');
await mkdir(pagesDirectory, { recursive: true });
await mkdir(path.join(fixtureRoot, 'public', 'ressources'), { recursive: true });
const articles = Array.from({ length: 365 }, (_, index) => ({
  schemaVersion: 1, topicId: `fixture-${index}`, revision: 1, slug: `fixture-${index}`,
  title: index === 364 ? 'Vérifier les travaux à Lèves' : `Sujet de test ${index + 1}`,
  summary: 'Fixture de recette isolée. Aucun article de test publié.', answer: 'Réponse de test.',
  sections: [{ heading: 'Explication', paragraphs: ['Texte de test.'] }],
  author: { name: 'Mouaad Boullourou', role: 'Conseiller immobilier' },
  dates: { createdAt: '2026-10-26T12:00:00+01:00', publishAt: '2026-10-27T07:00:00+01:00' },
  sources: [], scope: 'Test', limits: ['Test'], image: null,
  category: index % 2 ? 'acheter' : 'vendre', primaryDestination: '/situer-ma-vente/', status: 'published',
}));
await writeFile(path.join(fixtureRoot, 'fixtures.json'), JSON.stringify(articles));
await writeFile(path.join(fixtureRoot, 'package.json'), JSON.stringify({ name: 'isolated-editorial-fixture', type: 'module', private: true }));
await writeFile(path.join(fixtureRoot, 'astro.config.mjs'), `import {defineConfig} from 'astro/config';export default defineConfig({site:'https://fixture.invalid',output:'static'});`);
await writeFile(path.join(pagesDirectory, '[...page].astro'), `---
import ResourceLibrary from '../../../../../src/components/ResourceLibrary.astro';
import {createResourceCatalog,paginateResources} from '../../../../../src/lib/editorial/shared-catalog';
import type {EditorialArticle} from '../../../../../src/lib/editorial/schema';
import fixtures from '../../../fixtures.json';
export function getStaticPaths(){const catalog=createResourceCatalog(fixtures as EditorialArticle[]);const pages=paginateResources(catalog);return pages.map((entries,index)=>({params:{page:index===0?undefined:'page/'+(index+1)},props:{entries,catalog,page:index+1,totalPages:pages.length}}));}
const props=Astro.props;
---
<!doctype html><html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Fixture bibliothèque</title></head><body><main><ResourceLibrary {...props}/></main></body></html>
<style is:global>:root{--v7-paper:#f7f6f2;--v7-ink:#141413;--v7-muted:#3c3d3a}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif}.w{max-width:1320px;margin:auto;padding:0 20px}a,button,input{font:inherit}button{cursor:pointer}</style>`);
const search = articles.map((article) => ({ id: article.topicId, slug: article.slug, title: article.title, summary: article.summary, categoryLabel: article.category === 'acheter' ? 'Acheter un logement' : 'Préparer ou vendre', createdAt: article.dates.createdAt, dateLabel: '26 octobre 2026' }));
await writeFile(path.join(fixtureRoot, 'public', 'ressources', 'recherche.json'), JSON.stringify(search));
execFileSync(process.execPath, [path.join(project, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build', '--root', fixtureRoot], { cwd: project, stdio: 'pipe', windowsHide: true });

const dist = path.join(fixtureRoot, 'dist');
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const filename = path.resolve(dist, `.${pathname}`, ...(pathname.endsWith('/') ? ['index.html'] : []));
    if (!filename.startsWith(`${dist}${path.sep}`)) { response.writeHead(403).end(); return; }
    const content = await readFile(filename);
    const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' }[path.extname(filename)] ?? 'application/octet-stream';
    response.writeHead(200, { 'content-type': mime }).end(content);
  } catch { response.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const report = [];
try {
  for (const width of [360, 390, 430]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    await page.goto(`${base}/ressources/`);
    await expect(page.locator('[data-resource-default] article')).toHaveCount(12);
    await expect(page.getByText('Page 1 sur 31')).toBeVisible();
    await page.getByRole('link', { name: 'Suivante →' }).click();
    await expect(page).toHaveURL(`${base}/ressources/page/2/`);
    await expect(page.getByText('Page 2 sur 31')).toBeVisible();
    await page.getByLabel('Rechercher dans les ressources').fill('LEVES travaux');
    await expect(page.locator('#resource-search-results article')).toHaveCount(1);
    await expect(page.locator('#resource-search-results')).toContainText('Vérifier les travaux à Lèves');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(fixtureRoot, `search-${width}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Effacer' }).click();
    await expect(page.getByText('Page 2 sur 31')).toBeVisible();
    await page.getByLabel('Rechercher dans les ressources').fill('inexistant');
    await expect(page.getByRole('status')).toContainText('Aucune ressource');
    report.push({ width, pagination: 'passed', searchAcrossPages: 'passed', overflow: false });
    await page.close();
  }
  const noScript = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await noScript.goto(`${base}/ressources/`);
  await noScript.getByRole('link', { name: 'Suivante →' }).click();
  await expect(noScript).toHaveURL(`${base}/ressources/page/2/`);
  await expect(noScript.locator('[data-resource-default] article')).toHaveCount(12);
  report.push({ javaScript: false, pagination: 'passed' });
  await noScript.close();
  const network = await browser.newPage();
  await network.route('**/ressources/recherche.json', (route) => route.abort());
  await network.goto(`${base}/ressources/`);
  await network.getByLabel('Rechercher dans les ressources').fill('travaux');
  await expect(network.getByRole('status')).toContainText('momentanément indisponible');
  await expect(network.locator('[data-resource-default]')).toBeVisible();
  await network.unroute('**/ressources/recherche.json');
  await network.getByLabel('Rechercher dans les ressources').fill('travaux Lèves');
  await expect(network.locator('#resource-search-results article')).toHaveCount(1);
  report.push({ searchNetworkFailure: 'recoverable', retry: 'passed' });
  await network.close();
  await writeFile(path.join(fixtureRoot, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); server.close(); }
