import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Local-only public-page QA. No page, runtime or CSS is modified. All remote
// requests and all non-read HTTP requests are denied before transmission.
const base = process.env.LEVOIS_TEST_URL || 'http://127.0.0.1:4331';
const origin = new URL(base).origin;
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Use a local preview URL.');
const out = path.resolve('docs/design/cible-20260910/preuves/global');
await mkdir(out, { recursive: true });
const onlyRoutes = (process.env.LEVOIS_QA_ROUTES || '').split(',').map(route => route.trim()).filter(Boolean);
const report = { startedAt: new Date().toISOString(), base, browser: 'Chromium desktop viewport emulation', widths: [320, 390, 768, 1440], status: 'running', routes: [], pages: [], links: [], screenshots: [], blockedExternalRequests: [], blockedSubmissions: [], notes: ['No external link is followed.', 'No form is sent. Buyer answers only prepare an anonymous local reading.', 'Axe WCAG 2 A/AA, 2.1 A/AA and 2.2 AA. No human or physical-device test claimed.', 'Screenshots use real pages and local resources; no page style is rewritten except hiding the Astro developer toolbar.'] };
const reportFile = path.join(out, onlyRoutes.length ? 'rapport-public-pages-recheck.json' : 'rapport-public-pages.json');
async function files(dir) { const entries = await readdir(dir, { withFileTypes: true }); return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : path.join(dir, entry.name)))).flat(); }
const allPages = (await files('src/pages')).filter(file => file.endsWith('.astro')).map(file => path.relative('src/pages', file).replaceAll('\\', '/')).filter(file => !file.startsWith('cockpit/') && file !== 'composants.astro');
const routes = allPages.filter(file => !file.includes('[')).map(file => '/' + file.replace(/(?:^|\/)index\.astro$/, '').replace(/\.astro$/, '')).map(route => route.replace(/\/$/, '') || '/');
const resourceSource = await readFile('src/data/resources.ts', 'utf8');
const microSource = await readFile('src/data/micro-experiences.ts', 'utf8');
for (const match of resourceSource.matchAll(/slug:\s*'([^']+)'/g)) routes.push('/ressources/' + match[1]);
for (const match of microSource.matchAll(/slug:\s*'([^']+)'/g)) routes.push('/experiences/' + match[1]);
report.routes = [...new Set(routes)].sort();
if (onlyRoutes.length) { report.routes = report.routes.filter(route => onlyRoutes.includes(route)); report.notes.push('Targeted recheck after reported issues or concurrent preview updates.'); }
const capturePages = { '/': 'accueil', '/ma-recherche': 'acquereur', '/situer-ma-vente': 'vendeur', '/vendre-et-acheter': 'transition', '/experiences/surface-ou-usage': 'micro-experience', '/votre-rue': 'votre-rue', '/audit-annonce': 'audit-annonce', '/lecture': 'restitution', '/mouaad': 'mouaad', '/contact': 'contact' };
const pendingLinks = new Map();
let completed = 0;
let checkpointQueue = Promise.resolve();
function checkpoint() { const snapshot = JSON.stringify(report, null, 2); checkpointQueue = checkpointQueue.then(() => writeFile(reportFile, snapshot)); return checkpointQueue; }
function internalLink(href, from) {
  let url; try { url = new URL(href, new URL(from, base)); } catch { return null; }
  if (!['http:', 'https:'].includes(url.protocol)) return null;
  if (url.origin !== origin && !['levois.fr', 'www.levois.fr'].includes(url.hostname)) return null;
  if (url.pathname.startsWith('/cockpit') || url.pathname === '/composants') return null;
  return { pathname: url.pathname, search: url.search, hash: url.hash, localUrl: origin + url.pathname + url.search };
}
function rememberLinks(links, from) { for (const href of links) { const link = internalLink(href, from); if (!link) continue; const existing = pendingLinks.get(link.localUrl) || { ...link, from: new Set(), hashes: new Set() }; existing.from.add(from); if (link.hash) existing.hashes.add(link.hash); pendingLinks.set(link.localUrl, existing); } }
const browser = await chromium.launch({ headless: true });
async function prepareReading(page) {
  await page.goto(base + '/ma-recherche', { waitUntil: 'networkidle' });
  await page.locator('input[name=answer][value=idea]').check();
  await page.locator('.lv-question-form button[type=submit]').click();
  await page.locator('input[name=answer][value=primary]').check();
  await page.locator('[data-read]').click();
  await page.waitForURL('**/lecture');
  await page.locator('[data-reading-sections]').waitFor({ state: 'visible' });
  await page.waitForLoadState('networkidle');
  await page.locator('[data-reading-sections]').waitFor({ state: 'visible' });
}
async function ready(page) {
  await page.evaluate(async () => { await document.fonts.ready; for (const image of document.images) { image.loading = 'eager'; try { await image.decode(); } catch {} } });
}
async function scan(width) {
  for (const route of report.routes) {
    const height = width === 1440 ? 1000 : width === 768 ? 1024 : 844;
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    const result = { route, width, height, startedAt: new Date().toISOString(), jsErrors: [], consoleErrors: [], failures: [], status: null, layout: null, axe: null };
    await context.route('**/*', async requestRoute => {
      const req = requestRoute.request(); const url = new URL(req.url());
      if (['http:', 'https:'].includes(url.protocol) && url.origin !== origin) { report.blockedExternalRequests.push({ route, width, method: req.method(), host: url.hostname, path: url.pathname }); return requestRoute.abort('blockedbyclient'); }
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method())) { report.blockedSubmissions.push({ route, width, method: req.method(), path: url.pathname }); return requestRoute.abort('blockedbyclient'); }
      return requestRoute.continue();
    });
    await context.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const style = document.createElement('style'); style.textContent = 'astro-dev-toolbar{display:none!important}'; document.head.append(style); }));
    const page = await context.newPage(); page.setDefaultTimeout(12000);
    page.on('pageerror', error => result.jsErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') result.consoleErrors.push(message.text()); });
    try {
      if (route === '/lecture') { await prepareReading(page); result.status = 200; result.fixture = 'Actual buyer journey: idea, primary, then Lire déjà.'; }
      else { const response = await page.goto(base + route, { waitUntil: 'networkidle', timeout: 30000 }); result.status = response?.status() || null; }
      if (result.status !== 200 && !(route === '/404' && result.status === 404)) result.failures.push(`HTTP ${result.status}`);
      await ready(page);
      // Show the first real consequence on the ten requested structural screens.
      if (route === '/ma-recherche') await page.locator('input[name=answer][value=idea]').check();
      if (route === '/situer-ma-vente') await page.locator('input[name=answer][value=visites]').check();
      if (route === '/vendre-et-acheter') await page.locator('input[name=answer][value=quiet]').check();
      if (route === '/experiences/surface-ou-usage') await page.locator('input[name=micro-answer][value=quiet]').check();
      result.layout = await page.evaluate(() => ({ viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, overflowing: [...document.querySelectorAll('body *')].flatMap(el => { const rect = el.getBoundingClientRect(), style = getComputedStyle(el); if (style.display === 'none' || style.visibility === 'hidden' || style.position === 'fixed' || !rect.width || rect.right <= innerWidth + 1 && rect.left >= -1) return []; return [{ tag: el.tagName, id: el.id, class: typeof el.className === 'string' ? el.className : el.className.baseVal, left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) }]; }).slice(0, 15), failedImages: [...document.images].filter(image => image.getBoundingClientRect().width > 0 && (!image.complete || !image.naturalWidth)).map(image => image.currentSrc || image.src) }));
      if (result.layout.documentWidth > width + 1) result.failures.push(`Horizontal overflow: ${result.layout.documentWidth}px for ${width}px viewport`);
      if (result.layout.failedImages.length) result.failures.push('Visible image failed to load');
      rememberLinks(await page.locator('a[href]').evaluateAll(links => links.map(link => link.getAttribute('href'))), route);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      result.axe = { violations: axe.violations.map(violation => ({ id: violation.id, impact: violation.impact, help: violation.help, nodes: violation.nodes.map(node => ({ target: node.target, html: node.html, failureSummary: node.failureSummary })) })), incomplete: axe.incomplete.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })) };
      if (route === '/lecture') { await page.locator('[data-reading-sections]').waitFor({ state: 'visible' }); result.readingTitle = await page.locator('[data-reading-root] h1').textContent(); }
      if (capturePages[route] && [390, 1440].includes(width)) {
        await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await page.mouse.move(0, 0);
        const filename = `${capturePages[route]}-${width}.png`; await page.screenshot({ path: path.join(out, filename), fullPage: true, animations: 'disabled' }); report.screenshots.push({ route, width, file: filename });
      }
    } catch (error) { result.failures.push(error.message); }
    finally { result.finishedAt = new Date().toISOString(); await context.close(); report.pages.push(result); completed++; if (completed % 8 === 0) { console.log(`${completed}/${report.routes.length * 4} states checked`); await checkpoint(); } }
  }
}
async function resolveLink(link) {
  let current = link.localUrl; const redirects = [];
  try {
    for (let attempt = 0; attempt < 8; attempt++) {
      const response = await requestContext.get(current, { maxRedirects: 0, timeout: 15000, failOnStatusCode: false });
      const status = response.status();
      if (status >= 300 && status < 400 && response.headers().location) {
        const target = new URL(response.headers().location, current); redirects.push({ status, from: current, to: target.href });
        if (target.origin !== origin) return { status, redirects, externalRedirectNotFollowed: true, resolved: false };
        current = target.href; continue;
      }
      const contentType = response.headers()['content-type'] || '';
      // Hash validation for IDs can be dynamic; only report absent hashes on
      // static HTML as a manual check, never as a fabricated broken route.
      return { status, finalUrl: current, contentType, redirects, resolved: status >= 200 && status < 300 };
    }
    return { resolved: false, error: 'Too many redirects', redirects };
  } catch (error) { return { resolved: false, error: error.message, redirects }; }
}
const browserRequest = await browser.newContext();
// APIRequestContext performs only local GETs; every redirect is inspected above.
const requestContext = browserRequest.request;
try {
  // Two workers limit browser load while the main agent checks visual quality.
  await Promise.all([scan(320), scan(390)]); await Promise.all([scan(768), scan(1440)]);
  for (const link of pendingLinks.values()) { const resolved = await resolveLink(link); report.links.push({ path: link.pathname + link.search, from: [...link.from], hashes: [...link.hashes], ...resolved }); }
  const issues = report.pages.filter(page => page.failures.length || page.jsErrors.length || page.axe?.violations.length);
  const brokenLinks = report.links.filter(link => !link.resolved && link.path !== '/404');
  report.summary = { routes: report.routes.length, states: report.pages.length, screenshots: report.screenshots.length, pagesWithIssues: issues.length, jsErrors: report.pages.reduce((n, page) => n + page.jsErrors.length, 0), axeViolations: report.pages.reduce((n, page) => n + (page.axe?.violations.length || 0), 0), overflowStates: report.pages.filter(page => page.layout?.documentWidth > page.width + 1).length, uniqueInternalLinks: report.links.length, brokenInternalLinks: brokenLinks.length, blockedSubmissions: report.blockedSubmissions.length };
  report.status = issues.length || brokenLinks.length || report.blockedSubmissions.length ? 'issues-found' : 'passed';
} catch (error) { report.status = 'failed'; report.error = error.stack; }
finally { report.finishedAt = new Date().toISOString(); await checkpoint(); await browser.close(); console.log(JSON.stringify(report.summary || { status: report.status, error: report.error }, null, 2)); }
