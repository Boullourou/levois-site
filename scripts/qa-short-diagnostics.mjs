import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.LEVOIS_TEST_URL || process.env.LEVOIS_QA_BASE || 'http://127.0.0.1:4345';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Cette recette exige un serveur local.');
const output = path.resolve(process.env.LEVOIS_QA_OUTPUT || 'artifacts/final/diagnostics');
await mkdir(output, { recursive: true });
const key = 'levois:experience:v1';
const method = 'diagnostic-2026-10-25';
const widths = [1440, 390, 320];
const projects = {
  buyer: { route: '/ma-recherche/', values: ['searching', 'no_matches', 'space', 'not_started', 'months'], edit: 'diag_buyer_blocker', correction: 'tradeoff' },
  seller: { route: '/situer-ma-vente/', values: ['move', 'visits', 'no_offer', 'months', 'visits'], edit: 'diag_seller_blocker', correction: 'no_contacts' },
  transition: { route: '/vendre-et-acheter/', values: ['move', 'found', 'gap', 'no_temporary', 'talking'], edit: 'diag_transition_fear', correction: 'bridge' },
};
const report = { startedAt: new Date().toISOString(), base, method, scenarios: [], accessibility: [], blockedRequests: [], completedAt: null };
const stored = new Map();
const browser = await chromium.launch({ headless: true, ...(process.env.LEVOIS_BROWSER_CHANNEL ? { channel: process.env.LEVOIS_BROWSER_CHANNEL } : process.platform === 'win32' ? { channel: 'chrome' } : {}) });
let currentPage;

async function createContext(width = 390, extra = {}, onAction) {
  const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 900 : 844 }, locale: 'fr-FR', reducedMotion: 'reduce', acceptDownloads: true, ...extra });
  await context.route('**/*', async route => {
    const request = route.request();
    if (['GET', 'HEAD'].includes(request.method())) return route.continue();
    if (new URL(request.url()).pathname === '/api/experience/actions' && request.method() === 'POST' && onAction) return onAction(route, request.postDataJSON());
    report.blockedRequests.push({ method: request.method(), path: new URL(request.url()).pathname });
    return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ ok: false, message: 'Écriture bloquée par la recette locale.' }) });
  });
  return context;
}
async function newPage(context) {
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(20000);
  page.errors = [];
  page.on('pageerror', error => page.errors.push(error.message));
  currentPage = page;
  return page;
}
async function scenario(name, fn) {
  const item = { name, status: 'running', startedAt: new Date().toISOString() };
  report.scenarios.push(item);
  try { await fn(); item.status = 'passed'; console.log(`PASS ${name}`); }
  catch (error) {
    item.status = 'failed'; item.error = error.stack || String(error); console.error(`FAIL ${name}: ${error.message}`);
    if (currentPage && !currentPage.isClosed()) await currentPage.screenshot({ path: path.join(output, `failure-${report.scenarios.length}.png`), fullPage: true }).catch(() => {});
  }
  item.completedAt = new Date().toISOString();
}
async function fits(page, label) {
  const state = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth,
    overflow: [...document.querySelectorAll('body *')].filter(element => {
      const box = element.getBoundingClientRect();
      return box.width && getComputedStyle(element).visibility !== 'hidden' && (box.right > innerWidth + 1 || box.left < -1);
    }).slice(0, 10).map(element => ({ tag: element.tagName, class: String(element.className), right: Math.round(element.getBoundingClientRect().right) })),
  }));
  assert.ok(state.documentWidth <= state.width + 1, `${label}: débordement ${JSON.stringify(state)}`);
}
async function axe(page, label) {
  let timeout;
  const result = await Promise.race([
    new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze(),
    new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error(`${label}: Axe ne répond pas après 45 secondes`)), 45000); }),
  ]).finally(() => clearTimeout(timeout));
  report.accessibility.push({ label, url: page.url(), width: page.viewportSize().width, violations: result.violations.map(({ id, impact, description, helpUrl, nodes }) => ({ id, impact, description, helpUrl, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) })) });
  assert.equal(result.violations.length, 0, `${label}: Axe ${result.violations.map(item => `${item.id} (${item.nodes.length})`).join(', ')}`);
}
async function assertReading(page, project, memory = false) {
  await expect(page.locator('.lv-synthesis-card')).toHaveCount(3);
  assert.deepEqual(await page.locator('.lv-synthesis-card h2').allTextContents(), ['Le constat', 'L’angle mort à surveiller', 'La prochaine étape utile']);
  await expect(page.locator('.lv-synthesis-resources .lv-resource-card')).toHaveCount(2);
  const hrefs = await page.locator('.lv-resource-card').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
  assert.equal(new Set(hrefs).size, 2);
  for (const href of hrefs) assert.equal((await page.request.get(new URL(href, base).href)).status(), 200, `Ressource inaccessible : ${href}`);
  await expect(page.locator('[data-contact-call]')).toHaveAttribute('href', /^tel:\+/);
  await expect(page.locator('[data-contact-call]')).toHaveText('Échanger 15 min avec Mouaad (sans engagement)');
  await expect(page.locator('[data-synthesis-form] input[type=email]')).toHaveCount(1);
  if (!memory) {
    assert.equal(new URL(page.url()).pathname.replace(/\/$/, ''), '/lecture');
    const saved = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), key);
    assert.equal(saved.project, project);
    assert.equal(saved.reading.methodVersion, method);
    assert.equal(Object.keys(saved.answers).filter(id => id.startsWith(`diag_${project}_`)).length, 5);
    stored.set(project, saved);
  }
  await fits(page, `${project} synthèse`);
  assert.deepEqual(page.errors, [], 'Erreur JavaScript dans le parcours');
}
async function complete(page, project, { navigation = true, memory = false, screenshot = false, audit = false } = {}) {
  const config = projects[project];
  await page.goto(new URL(config.route, base).href, { waitUntil: 'networkidle' });
  await expect(page.locator('.lv-question-form')).toBeVisible();
  if (screenshot) await page.screenshot({ path: path.join(output, `${project}-question-${page.viewportSize().width}.png`), fullPage: true });
  if (audit) await axe(page, `${project} question`);
  for (let index = 0; index < 5; index++) {
    const form = page.locator('.lv-question-form');
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(index + 1));
    await expect(page.locator('[data-journey] input[type=email], [data-journey] input[type=tel]')).toHaveCount(0);
    await fits(page, `${project} question ${index + 1}`);
    if (navigation && index === 2) {
      await page.reload({ waitUntil: 'networkidle' });
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3');
    }
    await form.locator(`input[value="${config.values[index]}"]`).check();
    if (navigation && index === 1) {
      await form.locator('[data-back]').click();
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
      await expect(page.locator(`.lv-question-form input[value="${config.values[0]}"]`)).toBeChecked();
      await page.locator('.lv-question-form [type=submit]').click();
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
      await expect(page.locator(`.lv-question-form input[value="${config.values[1]}"]`)).toBeChecked();
    }
    await page.locator('.lv-question-form [type=submit]').click();
  }
  await assertReading(page, project, memory);
  if (screenshot) await page.screenshot({ path: path.join(output, `${project}-reading-${page.viewportSize().width}.png`), fullPage: true });
  if (audit) await axe(page, `${project} synthèse`);
}
async function download(page, filename) {
  const pending = page.waitForEvent('download');
  await page.locator('[data-keep]').click();
  const saved = await pending;
  const destination = path.join(output, filename);
  await saved.saveAs(destination);
  const html = await readFile(destination, 'utf8');
  const raw = html.match(/<script id="levois-context" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(raw, 'Export HTML sans contexte importable');
  return { path: destination, context: JSON.parse(raw) };
}
const success = (route, payload) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, saved: true, requestId: payload.requestId, copySent: true, copyState: 'sent', advisorNotificationSent: true, advisorNotificationState: 'sent' }) });

try {
  for (const width of widths) for (const project of Object.keys(projects)) await scenario(`${project} / ${width}px / parcours, retour, rechargement, synthèse`, async () => {
    const context = await createContext(width);
    try {
      const page = await newPage(context);
      await complete(page, project, { screenshot: true, audit: width === 390 });
      if (width === 1440) {
        const before = await page.locator('.lv-synthesis-card').allTextContents();
        await page.locator('#corrections summary').click();
        await page.locator(`a[href*="edit=${projects[project].edit}"]`).click();
        await page.locator(`.lv-question-form input[value="${projects[project].correction}"]`).check();
        await page.getByRole('button', { name: 'Actualiser ma synthèse', exact: true }).click();
        await assertReading(page, project);
        assert.notDeepEqual(await page.locator('.lv-synthesis-card').allTextContents(), before, 'La correction ne change pas la lecture');
        assert.ok((await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)).history.length, key)) >= 1, 'Version précédente perdue');
      }
    } finally { await context.close(); }
  });

  await scenario('E-mail : validation, capture explicite, échec/reprise avec même référence, double clic neutralisé', async () => {
    const requests = [];
    let releaseFirst;
    const context = await createContext(390, {}, async (route, payload) => {
      requests.push(payload);
      if (requests.length === 1) {
        await new Promise(resolve => { releaseFirst = resolve; });
        return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false }) });
      }
      return success(route, payload);
    });
    try {
      assert.ok(stored.get('buyer'), 'La recette acheteur doit fournir une vraie synthèse');
      await context.addInitScript(({ key, saved }) => sessionStorage.setItem(key, JSON.stringify(saved)), { key, saved: stored.get('buyer') });
      const page = await newPage(context);
      await page.goto(`${base}/lecture/`, { waitUntil: 'networkidle' });
      const form = page.locator('[data-synthesis-form]');
      const button = form.locator('[type=submit]');
      await button.click();
      assert.equal(requests.length, 0, 'Une adresse vide a déclenché une requête');
      await page.locator('#synthesis-email').fill('qa-levois@example.invalid');
      await button.click();
      await expect.poll(() => requests.length).toBe(1);
      await expect(button).toBeDisabled();
      await expect(page.locator('#synthesis-email')).toHaveAttribute('readonly', '');
      await form.evaluate(element => { element.requestSubmit(); element.requestSubmit(); });
      assert.equal(requests.length, 1, 'Une soumission concurrente est passée');
      releaseFirst();
      await expect(button).toBeEnabled();
      await expect(page.locator('#synthesis-status')).toContainText('ne sont pas confirmés');
      await button.click();
      await expect(page.locator('#synthesis-status')).toContainText('Votre projet est enregistré');
      assert.equal(requests.length, 2);
      assert.equal(requests[0].requestId, requests[1].requestId, 'La reprise a créé une nouvelle référence');
      const payload = requests[1];
      assert.equal(payload.action, 'synthesis-email');
      assert.equal(payload.approved, true);
      assert.equal(payload.channel, 'email');
      assert.equal(payload.consent.purpose, 'synthesis');
      assert.equal(payload.consent.textVersion, '2026-10-25');
      assert.equal(payload.context.project, 'buyer');
      assert.equal(payload.context.reading.methodVersion, method);
      for (const title of ['Le constat', 'L’angle mort à surveiller', 'La prochaine étape utile']) assert.ok(payload.synthesis.includes(title));
      await expect(button).toBeDisabled();
      await page.locator('#synthesis-email').fill('autre-qa@example.invalid');
      await expect(button).toBeEnabled();
      await button.click();
      await expect.poll(() => requests.length).toBe(3);
      await expect(page.locator('#synthesis-status')).toContainText('Votre projet est enregistré');
      assert.notEqual(requests[2].requestId, requests[1].requestId, 'Une autre adresse a réutilisé une référence figée');
    } finally { releaseFirst?.(); await context.close(); }
  });

  await scenario('Reprise : session préservée, export HTML, confirmation avant remplacement et fichier invalide', async () => {
    const context = await createContext(390);
    let file;
    try {
      const page = await newPage(context);
      await complete(page, 'buyer', { navigation: false });
      file = await download(page, 'buyer-export.html');
      await page.goto(`${base}/reprendre/`, { waitUntil: 'networkidle' });
      await expect(page.locator('[data-current-project]')).toBeVisible();
      await expect(page.locator('[data-current-link]')).toHaveAttribute('href', /\/lecture\/?$/);
      assert.equal((await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), key)).project, 'buyer');
      await page.locator('#resume-file').setInputFiles({ name: 'invalide.html', mimeType: 'text/html', buffer: Buffer.from('<h1>Pas un export</h1>') });
      await expect(page.locator('[data-resume-error]')).toContainText('Rien n’a été remplacé');
      assert.equal((await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), key)).project, 'buyer');
    } finally { await context.close(); }
    const imported = await createContext(390);
    try {
      assert.ok(stored.get('seller'));
      await imported.addInitScript(({ key, saved }) => {
        if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, JSON.stringify(saved));
      }, { key, saved: stored.get('seller') });
      const page = await newPage(imported);
      await page.goto(`${base}/reprendre/`, { waitUntil: 'networkidle' });
      await page.locator('#resume-file').setInputFiles(file.path);
      await expect(page.locator('[data-resume-compare]')).toBeVisible();
      await expect(page.locator('[data-replace-warning]')).toBeVisible();
      assert.equal((await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), key)).project, 'seller', 'L’import a remplacé le projet sans confirmation');
      await page.locator('[data-resume-confirm]').click();
      await assertReading(page, 'buyer');
      const resumed = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), key);
      assert.equal(resumed.id, file.context.id);
      assert.deepEqual(resumed.answers, file.context.answers);
    } finally { await imported.close(); }
  });

  await scenario('Stockage bloqué : synthèse sur place, correction, copie HTML et demande e-mail disponibles', async () => {
    const requests = [];
    const context = await createContext(320, {}, (route, payload) => { requests.push(payload); return success(route, payload); });
    try {
      await context.addInitScript(() => {
        for (const storage of ['localStorage', 'sessionStorage']) Object.defineProperty(window, storage, { configurable: true, get() { throw new DOMException('Storage disabled for QA', 'SecurityError'); } });
      });
      const page = await newPage(context);
      await complete(page, 'seller', { navigation: false, memory: true });
      assert.equal(new URL(page.url()).pathname, '/situer-ma-vente/');
      await page.locator('#corrections summary').click();
      await page.locator('[data-correct="diag_seller_blocker"]').click();
      await page.locator('.lv-question-form input[value=price]').check();
      await page.getByRole('button', { name: 'Actualiser ma synthèse', exact: true }).click();
      await assertReading(page, 'seller', true);
      const file = await download(page, 'storage-blocked-export.html');
      assert.equal(file.context.project, 'seller');
      await page.locator('#synthesis-email').fill('storage-qa@example.invalid');
      await page.locator('[data-synthesis-form] [type=submit]').click();
      await expect(page.locator('#synthesis-status')).toContainText('Votre projet est enregistré');
      assert.equal(requests.length, 1);
      assert.equal(requests[0].context.answers.diag_seller_blocker.value, 'price');
      await page.screenshot({ path: path.join(output, 'storage-blocked-320.png'), fullPage: true });
    } finally { await context.close(); }
  });

  await scenario('Diagnostic incomplet : /lecture propose de continuer sans inventer une synthèse historique', async () => {
    const context = await createContext(390);
    try {
      const page = await newPage(context);
      await page.goto(`${base}/ma-recherche/`, { waitUntil: 'networkidle' });
      await page.locator('.lv-question-form input[value=searching]').check();
      await page.locator('.lv-question-form [type=submit]').click();
      await page.goto(`${base}/lecture/`, { waitUntil: 'networkidle' });
      await expect(page.locator('.lv-synthesis-card')).toHaveCount(0);
      const saved = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), key);
      assert.equal(saved.project, 'buyer');
      assert.equal(saved.reading, undefined, 'Une lecture a été fabriquée avant la fin des questions');
      assert.equal(saved.answers.diag_buyer_stage.value, 'searching');
      const continueLink = page.locator('a[href="/ma-recherche/"], a[href="/ma-recherche"]').filter({ visible: true }).last();
      await continueLink.click();
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
    } finally { await context.close(); }
  });

  await scenario('Menu mobile au clavier et navigation sans JavaScript', async () => {
    const context = await createContext(390);
    try {
      const page = await newPage(context);
      await page.goto(base, { waitUntil: 'networkidle' });
      const toggle = page.locator('.v7-menu-toggle');
      await toggle.focus(); await page.keyboard.press('Enter');
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Tab');
      await expect(page.locator('#v7-nav a').first()).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(toggle).toBeFocused();
      await fits(page, 'Accueil menu fermé');
    } finally { await context.close(); }
    const noJs = await createContext(390, { javaScriptEnabled: false });
    try {
      const page = await newPage(noJs);
      await page.goto(base, { waitUntil: 'networkidle' });
      for (const { route } of Object.values(projects)) {
        const links = page.locator(`a[href="${route}"], a[href="${route.slice(0, -1)}"]`);
        assert.ok(await links.count(), `Orientation absente sans JavaScript : ${route}`);
        let visible = false;
        for (const link of await links.all()) visible ||= await link.isVisible();
        assert.ok(visible, `Orientation masquée sans JavaScript : ${route}`);
      }
      await page.locator('a[href="/ma-recherche/"], a[href="/ma-recherche"]').filter({ visible: true }).first().click();
      await expect(page).toHaveURL(/\/ma-recherche\/?$/);
      await expect(page.getByRole('link', { name: 'ressources en libre accès', exact: true })).toBeVisible();
      await fits(page, 'Question sans JavaScript');
    } finally { await noJs.close(); }
  });

  for (const width of [390, 320]) for (const route of ['/', '/reprendre/', '/contact/', '/votre-rue/', '/prix-immobilier/leves/']) await scenario(`Finition publique ${route} / ${width}px`, async () => {
    const context = await createContext(width);
    try {
      const page = await newPage(context);
      assert.equal((await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' })).status(), 200);
      await fits(page, route);
      if (width === 390) await axe(page, route);
      assert.deepEqual(page.errors, []);
      await page.screenshot({ path: path.join(output, `public-${route.replaceAll('/', '-').replace(/^-|-$/g, '') || 'home'}-${width}.png`), fullPage: true });
    } finally { await context.close(); }
  });

  await scenario('Routes publiques de référence : réponses 200 et vraie page 404', async () => {
    const context = await createContext();
    try {
      for (const route of ['/', '/ma-recherche/', '/situer-ma-vente/', '/vendre-et-acheter/', '/lecture/', '/reprendre/', '/votre-rue/', '/carte/', '/contact/', '/mouaad/', '/methode/', '/accompagnement/', '/ressources/', '/ressources/retours-de-visite/', '/ressources/verifier-avant-baisse-prix/', '/prix-immobilier/leves/', '/estimation-immobiliere-chartres/', '/confidentialite/', '/mentions-legales/']) {
        assert.equal((await context.request.get(new URL(route, base).href)).status(), 200, `Route ${route}`);
      }
      assert.equal((await context.request.get(`${base}/qa-page-inexistante-20261025/`)).status(), 404);
    } finally { await context.close(); }
  });
} finally {
  await browser.close();
  report.completedAt = new Date().toISOString();
  report.passed = report.scenarios.filter(item => item.status === 'passed').length;
  report.failed = report.scenarios.filter(item => item.status === 'failed').length;
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  await writeFile(path.join(output, 'README.md'), `# Recette des diagnostics LEVOIS\n\nServeur local : ${base}\n\nDébut : ${report.startedAt}\n\n${report.passed} scénarios réussis, ${report.failed} échoués.\n\nToutes les requêtes d’écriture sont interceptées : aucun e-mail ni lead réel. Les réponses API sont simulées pour contrôler le navigateur.\n\n${report.scenarios.map(item => `- ${item.status === 'passed' ? 'OK' : 'ÉCHEC'} — ${item.name}${item.error ? `\n  ${item.error.split('\n')[0]}` : ''}`).join('\n')}\n`);
  console.log(`Rapport : ${path.join(output, 'report.json')} (${report.passed} OK, ${report.failed} échec(s))`);
  if (report.failed) process.exitCode = 1;
}
