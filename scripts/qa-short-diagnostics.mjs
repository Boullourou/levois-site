import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.LEVOIS_TEST_URL || process.env.LEVOIS_QA_BASE || 'http://127.0.0.1:4345';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname) && !new URL(base).hostname.endsWith('.levois-site.pages.dev')) throw new Error('Cette recette exige un serveur local ou une preview du projet levois-site.pages.dev ; la production est exclue.');
const output = path.resolve(process.env.LEVOIS_QA_OUTPUT || 'artifacts/final/diagnostics');
const scenarioFilter = process.env.LEVOIS_QA_FILTER ? new RegExp(process.env.LEVOIS_QA_FILTER) : null;
await mkdir(output, { recursive: true });
const key = 'levois:experience:v1';
const method = 'diagnostic-2026-10-25';
const widths = [1440, 360, 390, 430];
const deliveryKey = 'levois:diagnostic-delivery:v1';
const contact = { firstName: 'Camille', email: 'camille.qa@example.invalid', phone: '' };
const projects = {
  buyer: { route: '/ma-recherche/', values: ['searching', 'no_matches', 'space', 'not_started', 'months'], edit: 'diag_buyer_blocker', correction: 'tradeoff' },
  seller: { route: '/situer-ma-vente/', values: ['move', 'visits', 'no_offer', 'months', 'visits'], edit: 'diag_seller_blocker', correction: 'no_contacts' },
  transition: { route: '/vendre-et-acheter/', values: ['move', 'found', 'gap', 'no_temporary', 'talking'], edit: 'diag_transition_fear', correction: 'bridge' },
};
const report = { startedAt: new Date().toISOString(), base, method, filter: scenarioFilter?.source || null, scenarios: [], accessibility: [], blockedRequests: [], completedAt: null };
const stored = new Map();
const browser = await chromium.launch({ headless: true, ...(process.env.LEVOIS_BROWSER_CHANNEL ? { channel: process.env.LEVOIS_BROWSER_CHANNEL } : process.platform === 'win32' ? { channel: 'chrome' } : {}) });
let currentPage;

async function createContext(width = 375, extra = {}, onAction) {
  const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 900 : 844 }, locale: 'fr-FR', reducedMotion: 'reduce', acceptDownloads: true, ...extra });
  await context.route('**/*', async route => {
    const request = route.request();
    if (['GET', 'HEAD'].includes(request.method())) return route.continue();
    if (new URL(request.url()).origin === new URL(base).origin && ['/api/experience/actions','/api/lead'].includes(new URL(request.url()).pathname) && request.method() === 'POST' && onAction) {
      const payload = request.postDataJSON();
      assert.match(payload.email, /@example\.invalid$/, 'Only fixture contacts may reach a mocked action');
      return onAction(route, payload);
    }
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
  if (scenarioFilter && !scenarioFilter.test(name)) return;
  const item = { name, status: 'running', startedAt: new Date().toISOString() };
  report.scenarios.push(item);
  try { await fn(); item.status = 'passed'; console.log(`PASS ${name}`); }
  catch (error) {
    item.status = 'failed'; item.error = error.stack || String(error); console.error(`FAIL ${name}: ${error.message}`);
    if (currentPage && !currentPage.isClosed()) await currentPage.screenshot({ path: path.join(output, `failure-${report.scenarios.length}.png`), fullPage: true }).catch(() => {});
  }
  item.completedAt = new Date().toISOString();
}
async function captureScreenshot(page, filename) {
  await page.evaluate(() => window.scrollTo({top:0,left:0,behavior:'instant'}));
  await page.screenshot({path:path.join(output,filename),fullPage:true,animations:'disabled'});
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
async function belowHeader(locator, label) {
  const position = await locator.evaluate(element => {
    const target = element.getBoundingClientRect(), header = document.querySelector('#hd')?.getBoundingClientRect();
    return { top: target.top, bottom: target.bottom, headerBottom: header?.bottom || 0 };
  });
  assert.ok(position.top >= position.headerBottom - 1, label + ': titre masqué sous le header ' + JSON.stringify(position));
}
async function assertOptionalCapture(page) {
  await expect(page.locator('.lv-capture-gate')).toHaveCount(0);
  await expect(page.locator('.lv-synthesis-card')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'Recevoir cette synthèse par e-mail pour garder une trace', exact: true })).toBeVisible();
  await expect(page.locator('[data-keep]')).toBeVisible();
  await expect(page.locator('#synthesis-first-name')).toHaveAttribute('required', '');
  await expect(page.locator('#synthesis-email')).toHaveAttribute('required', '');
  await expect(page.locator('#synthesis-phone')).not.toHaveAttribute('required', '');
  await expect(page.locator('#synthesis-phone-help')).toContainText('vous demandez à Mouaad de vous contacter');
  await expect(page.locator('#synthesis-privacy')).toContainText('transmises à Mouaad et conservées');
  await fits(page, 'Étape de réception');
}
async function fillContact(page, values = contact) {
  await page.locator('#synthesis-first-name').fill(values.firstName);
  await page.locator('#synthesis-email').fill(values.email);
  await page.locator('#synthesis-phone').fill(values.phone || '');
}
function assertPayload(payload, project = 'buyer') {
  assert.equal(payload.action, 'synthesis-email');
  assert.equal(payload.approved, true);
  assert.equal(payload.channel, 'email');
  assert.equal(payload.consent.purpose, 'synthesis');
  assert.equal(payload.consent.textVersion, '2026-10-25-arbitrage');
  assert.equal(payload.context.project, project);
  assert.equal(payload.context.reading.methodVersion, method);
  assert.equal(payload.context.reading.deliveryMode, 'email-arbitrage-v1');
  for (const title of ['Le constat', 'L’angle mort à surveiller', 'La prochaine étape utile']) assert.ok(payload.synthesis.includes(title));
  for (const value of [payload.email, payload.firstName, payload.phone].filter(Boolean)) {
    assert.ok(!JSON.stringify(payload.context).includes(value), 'Les coordonnées ont fui dans le contexte de réponses');
  }
}
async function assertReading(page, project, memory = false) {
  await expect(page.locator('.lv-capture-gate')).toHaveCount(0);
  await expect(page.locator('.lv-synthesis-card')).toHaveCount(3);
  assert.deepEqual(await page.locator('.lv-synthesis-card h2').allTextContents(), ['Le constat', 'L’angle mort à surveiller', 'La prochaine étape utile']);
  await expect(page.locator('.lv-synthesis-resources .lv-resource-card')).toHaveCount(2);
  const hrefs = await page.locator('.lv-resource-card').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
  assert.equal(new Set(hrefs).size, 2);
  for (const href of hrefs) assert.equal((await page.request.get(new URL(href, base).href)).status(), 200, 'Ressource inaccessible : ' + href);
  await expect(page.locator('[data-contact-call]')).toHaveAttribute('href', /^tel:\+/);
  await expect(page.locator('[data-contact-call]')).toHaveText('Échanger 15 min avec Mouaad (sans engagement)');
  await expect(page.locator('[data-synthesis-form] input[type=email]')).toHaveCount(1);
  await expect(page.locator('[data-keep]')).toBeVisible();
  if (!memory) {
    assert.equal(new URL(page.url()).pathname.replace(/\/$/, ''), '/lecture');
    const saved = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)), key);
    assert.equal(saved.project, project);
    assert.equal(saved.reading.methodVersion, method);
    assert.equal(Object.keys(saved.answers).filter(id => id.startsWith('diag_' + project + '_')).length, 5);
    assert.ok(!JSON.stringify(saved).includes('@example.invalid'), 'E-mail stocké dans la session de diagnostic');
    stored.set(project, saved);
  }
  await fits(page, project + ' synthèse');
  assert.deepEqual(page.errors, [], 'Erreur JavaScript dans le parcours');
}
async function capture(page, project, { memory = false, values = contact } = {}) {
  await assertOptionalCapture(page);
  await fillContact(page, values);
  await page.locator('[data-synthesis-form] [type=submit]').click();
  await expect(page.locator('#synthesis-status')).not.toContainText('Préparation et envoi');
  await assertReading(page, project, memory);
}
async function complete(page, project, { navigation = true, memory = false, screenshot = false, audit = false, deliver = true } = {}) {
  const config = projects[project];
  await page.goto(new URL(config.route, base).href, { waitUntil: 'networkidle' });
  await expect(page.locator('.lv-question-form')).toBeVisible();
  if(memory)await expect(page.locator('[data-storage-warning]')).toBeVisible();
  else await expect(page.locator('[data-storage-warning]')).toBeHidden();
  await expect(page.locator('.lv-diagnostic-intro h1')).toHaveCount(1);
  await expect(page.locator('.lv-diagnostic-intro')).toContainText('synthèse à l’écran');
  if (screenshot) await captureScreenshot(page,project + '-question-' + page.viewportSize().width + '.png');
  if (audit) await axe(page, project + ' question');
  for (let index = 0; index < 5; index++) {
    const form = page.locator('.lv-question-form');
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(index + 1));
    assert.equal(await page.locator('[data-question-title]').evaluate(element => element.tagName), 'H2');
    await expect(page.locator('[data-journey] input[type=email], [data-journey] input[type=tel]')).toHaveCount(0);
    await fits(page, project + ' question ' + (index + 1));
    if (navigation && index === 2) {
      await page.reload({ waitUntil: 'networkidle' });
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3');
    }
    await form.locator('input[value="' + config.values[index] + '"]').check();
    if (navigation && index === 1) {
      await form.locator('[data-back]').click();
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
      await expect(page.locator('.lv-question-form input[value="' + config.values[0] + '"]')).toBeChecked();
      await page.locator('.lv-question-form [type=submit]').click();
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
      await expect(page.locator('.lv-question-form input[value="' + config.values[1] + '"]')).toBeChecked();
    }
    await page.locator('.lv-question-form [type=submit]').click();
    if (index < 4) {
      await expect(page.locator('[data-question-title]')).toBeFocused();
      await belowHeader(page.locator('[data-question-title]'), 'Question ' + (index + 2));
    }
  }
  await assertOptionalCapture(page);
  if (screenshot) await captureScreenshot(page,project + '-capture-' + page.viewportSize().width + '.png');
  if (audit) await axe(page, project + ' capture');
  if (!deliver) return;
  await capture(page, project, { memory });
  if (screenshot) await captureScreenshot(page,project + '-reading-' + page.viewportSize().width + '.png');
  if (audit) await axe(page, project + ' synthèse');
}
async function seed(context, saved) {
  await context.addInitScript(({ key, saved }) => {
    if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, JSON.stringify(saved));
  }, { key, saved });
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
const success = (route, payload) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, saved: true, requestId: payload.requestId, copySent: true, copyState: 'sent', advisorNotificationSent: true, advisorNotificationState: 'sent', phoneExchangeRequested: !!payload.phone }) });

try {
  for (const width of widths) for (const project of Object.keys(projects)) await scenario(`${project} / ${width}px / parcours, retour, rechargement, synthèse`, async () => {
    const context = await createContext(width, {}, (route, payload) => { assertPayload(payload, project); return success(route, payload); });
    try {
      const page = await newPage(context);
      await complete(page, project, { screenshot: true, audit: width === 390 });
      if (width === 1440) {
        const before = await page.locator('.lv-synthesis-card').allTextContents();
        await page.locator('#corrections summary').click();
        await page.locator(`a[href*="edit=${projects[project].edit}"]`).click();
        await page.locator(`.lv-question-form input[value="${projects[project].correction}"]`).check();
        await page.getByRole('button', { name: 'Actualiser mon analyse', exact: true }).click();
        await capture(page, project);
        assert.notDeepEqual(await page.locator('.lv-synthesis-card').allTextContents(), before, 'La correction ne change pas la lecture');
        assert.ok((await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)).history.length, key)) >= 1, 'Version précédente perdue');
      }
    } finally { await context.close(); }
  });

  await scenario('Envoi facultatif : champs, synthèse conservée sur échec, copie échouée et reprises sans doublon', async () => {
    const requests = [];
    let releaseFirst;
    const context = await createContext(375, {}, async (route, payload) => {
      assertPayload(payload); requests.push(payload);
      if (requests.length === 1) {
        await new Promise(resolve => { releaseFirst = resolve; });
        return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false }) });
      }
      if (requests.length === 2) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        ok: true, saved: true, requestId: payload.requestId, copySent: false, copyState: 'failed',
      }) });
      return success(route, payload);
    });
    try {
      assert.ok(stored.get('buyer'));
      await seed(context, stored.get('buyer'));
      const page = await newPage(context);
      await page.goto(base + '/lecture/', { waitUntil: 'networkidle' });
      await assertOptionalCapture(page);
      const form = page.locator('[data-synthesis-form]'), button = form.locator('[type=submit]');
      await button.click();
      assert.equal(requests.length, 0, 'Les champs vides ont déclenché une requête');
      await fillContact(page, { firstName: 'Camille', email: 'adresse-incomplete', phone: '' });
      await button.click(); assert.equal(requests.length, 0, 'E-mail incorrect transmis');
      await fillContact(page, { ...contact, firstName: '12345' });
      await button.click();
      assert.equal(await page.locator('#synthesis-first-name').evaluate(input => input.validity.valid), false);
      assert.equal(requests.length, 0, 'Prénom incorrect transmis');
      await fillContact(page, { ...contact, phone: 'pas-un-numero' });
      await button.click();
      assert.equal(await page.locator('#synthesis-phone').evaluate(input => input.validity.valid), false);
      assert.equal(requests.length, 0, 'Téléphone incorrect transmis');
      await fillContact(page);
      await button.click();
      await expect.poll(() => requests.length).toBe(1);
      await expect(button).toBeDisabled();
      for (const id of ['first-name', 'email', 'phone']) await expect(page.locator('#synthesis-' + id)).toHaveAttribute('readonly', '');
      await form.evaluate(element => { element.requestSubmit(); element.requestSubmit(); });
      assert.equal(requests.length, 1, 'Soumission concurrente passée');
      releaseFirst();
      await expect(button).toBeEnabled();
      await expect(page.locator('#synthesis-status')).toContainText('pas été confirmée');
      await assertOptionalCapture(page);
      await button.click();
      await assertReading(page, 'buyer');
      await expect(page.locator('#synthesis-status')).toContainText('l’envoi n’est pas confirmé');
      await expect(button).toHaveText('Réessayer l’envoi de mon analyse');
      await expect(button).toBeEnabled();
      assert.deepEqual(requests[1], requests[0], 'La reprise backend a changé la demande figée');
      await button.click();
      await expect(page.locator('#synthesis-status')).toContainText('service d’envoi');
      await expect(button).toBeDisabled();
      assert.equal(requests.length, 3);
      assert.deepEqual(requests[2], requests[0], 'La reprise e-mail a changé la demande figée');
      assert.equal(requests[2].firstName, contact.firstName);
      assert.equal(requests[2].phone, '', 'Le téléphone facultatif a été imposé');
      await page.locator('#synthesis-email').fill('autre-qa@example.invalid');
      await expect(button).toBeEnabled();
      await button.click();
      await expect.poll(() => requests.length).toBe(4);
      await expect(button).toBeDisabled();
      assert.notEqual(requests[3].requestId, requests[2].requestId, 'Une autre adresse a réutilisé la même référence');
    } finally { releaseFirst?.(); await context.close(); }
  });

  await scenario('Envoi facultatif : une confirmation incomplète ou d’une autre demande ne confirme aucun envoi', async () => {
    const requests = [];
    const context = await createContext(375, {}, (route, payload) => {
      requests.push(payload);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        ok: true, saved: requests.length !== 1, requestId: requests.length === 2 ? crypto.randomUUID() : payload.requestId,
        copySent: requests.length === 3 ? 'true' : true, copyState: 'sent',
      }) });
    });
    try {
      await seed(context, stored.get('seller'));
      const page = await newPage(context);
      await page.goto(base + '/lecture/', { waitUntil: 'networkidle' });
      await fillContact(page);
      for (let attempt = 1; attempt <= 3; attempt++) {
        await page.locator('[data-synthesis-form] [type=submit]').click();
        await expect.poll(() => requests.length).toBe(attempt);
        await expect(page.locator('#synthesis-status')).toContainText('pas été confirmée');
        await assertOptionalCapture(page);
      }
      assert.deepEqual(requests[0], requests[1]);
      assert.equal(await page.evaluate(key => sessionStorage.getItem(key), deliveryKey), null);
    } finally { await context.close(); }
  });

  for (const state of ['unknown', 'sending']) await scenario('Envoi incertain ' + state + ' : résultat conservé, aucun renvoi automatique', async () => {
    const requests = [];
    const context = await createContext(375, {}, (route, payload) => {
      requests.push(payload);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        ok: true, saved: true, requestId: payload.requestId, copySent: false, copyState: state,
      }) });
    });
    try {
      await seed(context, stored.get('transition'));
      const page = await newPage(context);
      await page.goto(base + '/lecture/', { waitUntil: 'networkidle' });
      await capture(page, 'transition');
      const button = page.locator('[data-synthesis-form] [type=submit]');
      await expect(button).toBeDisabled();
      await expect(button).toHaveText('Demande enregistrée · envoi à vérifier');
      await page.locator('#synthesis-email').focus(); await page.keyboard.press('Enter');
      assert.equal(requests.length, 1, 'Une confirmation incertaine a déclenché un nouveau POST');
      await page.reload({ waitUntil: 'networkidle' });
      await assertReading(page, 'transition');
      assert.equal(requests.length, 1, 'Le rechargement a renvoyé la demande');
      const receipts = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key) || '[]'), deliveryKey);
      assert.ok(receipts.includes(stored.get('transition').reading.id), 'La session oublie le résultat enregistré');
    } finally { await context.close(); }
  });

  await scenario('Téléphone facultatif : intention explicite et coordonnées hors diagnostic/export', async () => {
    const requests = [];
    const context = await createContext(375, {}, (route, payload) => { assertPayload(payload, 'seller'); requests.push(payload); return success(route, payload); });
    try {
      await seed(context, stored.get('seller'));
      const page = await newPage(context);
      await page.goto(base + '/lecture/', { waitUntil: 'networkidle' });
      await capture(page, 'seller', { values: { ...contact, phone: '+33 6 00 00 00 00' } });
      await expect(page.locator('#synthesis-status')).toContainText('demande d’échange téléphonique');
      assert.equal(requests.length, 1);
      assert.equal(requests[0].phone, '+33 6 00 00 00 00');
      const file = await download(page, 'phone-contact-free-export.html');
      const snapshot = JSON.stringify(file.context);
      for (const value of [contact.firstName, contact.email, requests[0].phone]) assert.ok(!snapshot.includes(value));
      await page.reload({ waitUntil: 'networkidle' });
      await assertReading(page, 'seller');
      assert.equal(requests.length, 1);
      await expect(page.locator('#synthesis-email')).toHaveValue('');
      await expect(page.locator('#synthesis-phone')).toHaveValue('');
    } finally { await context.close(); }
  });

  await scenario('Reprise : session préservée, export HTML, confirmation avant remplacement et fichier invalide', async () => {
    const context = await createContext(375, {}, success);
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
    const imported = await createContext(375);
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

  await scenario('Stockage bloqué : réception sur place, correction, seconde réception et export', async () => {
    const requests = [];
    const context = await createContext(320, {}, (route, payload) => { assertPayload(payload, 'seller'); requests.push(payload); return success(route, payload); });
    try {
      await context.addInitScript(() => {
        for (const storage of ['localStorage', 'sessionStorage']) Object.defineProperty(window, storage, { configurable: true, get() { throw new DOMException('Storage disabled for QA', 'SecurityError'); } });
      });
      const page = await newPage(context);
      await complete(page, 'seller', { navigation: false, memory: true, deliver: false });
      assert.equal(new URL(page.url()).pathname, '/situer-ma-vente/');
      await capture(page, 'seller', { memory: true });
      assert.equal(requests.length, 1);
      await page.locator('#corrections summary').click();
      await page.locator('[data-correct="diag_seller_blocker"]').click();
      await page.locator('.lv-question-form input[value=price]').check();
      await page.getByRole('button', { name: 'Actualiser mon analyse', exact: true }).click();
      await capture(page, 'seller', { memory: true });
      const file = await download(page, 'storage-blocked-export.html');
      assert.equal(file.context.project, 'seller');
      assert.equal(requests.length, 2);
      assert.equal(requests[1].context.answers.diag_seller_blocker.value, 'price');
      assert.notEqual(requests[1].requestId, requests[0].requestId);
      await captureScreenshot(page,'storage-blocked-320.png');
    } finally { await context.close(); }
  });

  await scenario('Reflow 200 % équivalent : 720 px, parcours et réception entièrement au clavier', async () => {
    const requests = [];
    const context = await createContext(720, { viewport: { width: 720, height: 450 } }, (route, payload) => {
      requests.push(payload); return success(route, payload);
    });
    try {
      const page = await newPage(context);
      await page.goto(base + '/ma-recherche/', { waitUntil: 'networkidle' });
      // 1440/2 by 900/2 CSS pixels models browser 200% reflow; it does not claim native browser zoom.
      report.zoom = { type: '200% reflow equivalent', baseViewport: [1440, 900], cssViewport: [720, 450] };
      for (let index = 0; index < 5; index++) {
        const radio = page.locator('.lv-question-form input[type=radio]').first();
        if (index === 0) {
          for (let step = 0; step < 35 && !await radio.evaluate(element => element === document.activeElement); step++) await page.keyboard.press('Tab');
        } else await page.keyboard.press('Tab');
        await expect(radio).toBeFocused();
        await page.keyboard.press('Space');
        await page.keyboard.press('Tab');
        await expect(page.locator('.lv-question-form [type=submit]')).toBeFocused();
        await page.keyboard.press('Enter');
        if (index < 4) {
          await expect(page.locator('[data-question-title]')).toBeFocused();
          await belowHeader(page.locator('[data-question-title]'), 'Clavier question ' + (index + 2));
          await fits(page, 'Reflow question ' + (index + 2));
        }
      }
      await assertOptionalCapture(page);
      const first = page.locator('#synthesis-first-name');
      for (let step = 0; step < 35 && !await first.evaluate(element => element === document.activeElement); step++) await page.keyboard.press('Tab');
      await expect(first).toBeFocused();
      await belowHeader(first, 'Champ prénom au clavier');
      await page.keyboard.type(contact.firstName);
      await page.keyboard.press('Tab'); await expect(page.locator('#synthesis-email')).toBeFocused(); await page.keyboard.type(contact.email);
      await page.keyboard.press('Tab'); await expect(page.locator('#synthesis-phone')).toBeFocused();
      await page.keyboard.press('Tab'); await expect(page.locator('#synthesis-privacy a')).toBeFocused();
      await page.keyboard.press('Tab'); await expect(page.locator('[data-synthesis-form] [type=submit]')).toBeFocused();
      await page.keyboard.press('Enter');
      await assertReading(page, 'buyer');
      assert.equal(requests.length, 1);
      await fits(page, 'Reflow résultat');
      await captureScreenshot(page,'keyboard-reflow-200.png');
    } finally { await context.close(); }
  });

  for (const width of [360, 390, 430]) await scenario(`Contact / ${width}px : clavier, antispam, erreur réseau, double soumission et confirmation`, async () => {
    const requests=[];
    let releaseFirst;
    const context=await createContext(width,{},async(route,payload)=>{
      requests.push(payload);
      if(requests.length===1){await new Promise(resolve=>{releaseFirst=resolve;});return route.abort('failed');}
      if(requests.length===2)return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,notificationSent:true,notificationState:'sent',requestId:'wrong-request'})});
      if(requests.length===3)return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,notificationSent:true,requestId:payload.requestId})});
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,notificationSent:true,notificationState:'sent',requestId:payload.requestId})});
    });
    try{
      await context.addInitScript(()=>{for(const storage of ['localStorage','sessionStorage'])Object.defineProperty(window,storage,{configurable:true,get(){throw new DOMException('QA storage denied','SecurityError');}});});
      const page=await newPage(context);await page.goto(base+'/contact/',{waitUntil:'networkidle'});
      await expect(page.locator('#c-site')).toBeHidden();await expect(page.locator('#c-site')).toHaveAttribute('tabindex','-1');
      const button=page.locator('[data-direct-contact] [type=submit]');
      await button.click();await expect(page.locator('#c-prenom-error')).toBeVisible();await expect(page.locator('#c-prenom')).toHaveAttribute('aria-invalid','true');
      assert.equal(requests.length,0);
      for(const [id,value]of Object.entries({'c-prenom':'Camille','c-nom':'Test','c-email':'qa.contact@example.invalid','c-objet':'Question de recette','c-message':'Message fictif, sans destinataire réel.'}))await page.locator('#'+id).fill(value);
      await page.locator('#c-consent').focus();await page.keyboard.press('Space');await button.focus();await page.keyboard.press('Enter');
      await expect.poll(()=>requests.length).toBe(1);await expect(button).toBeDisabled();
      await page.locator('[data-direct-contact]').evaluate(form=>{form.requestSubmit();form.requestSubmit();});assert.equal(requests.length,1);
      releaseFirst();await expect(button).toBeEnabled();await expect(page.locator('[data-contact-status]')).toContainText('connexion');
      await expect(page.locator('#c-message')).toHaveValue('Message fictif, sans destinataire réel.');
      await button.click();await expect(page.locator('[data-contact-status]')).toContainText('pas confirmée');await expect(button).toBeEnabled();
      await button.click();await expect(page.locator('[data-contact-status]')).toContainText('pas confirmée');await expect(button).toBeEnabled();
      await button.click();await expect(button).toBeDisabled();await expect(page.locator('[data-contact-status]')).toContainText('accepté par le service');
      assert.equal(requests.length,4);assert.deepEqual(requests[0],requests[1]);assert.deepEqual(requests[1],requests[2]);assert.deepEqual(requests[2],requests[3]);
      await fits(page,'Contact '+width);if(width===390)await axe(page,'Contact après confirmation');
      await captureScreenshot(page,'contact-confirmation-'+width+'.png');assert.deepEqual(page.errors,[]);
    }finally{releaseFirst?.();await context.close();}
  });

  await scenario('Article → contact : contexte public et synthèse jointe au choix sans réponses dans URL', async()=>{
    const requests=[];
    const context=await createContext(390,{},(route,payload)=>{
      requests.push(payload);return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,notificationSent:true,notificationState:'sent',requestId:payload.requestId})});
    });
    try{
      await seed(context,stored.get('buyer'));const page=await newPage(context);
      await page.goto(base+'/contact/?article=marge-negociation-erreur-25000',{waitUntil:'networkidle'});
      await expect(page.locator('[data-article-context]')).toContainText('marge de négociation');
      await expect(page.locator('#c-objet')).toHaveValue(/marge de négociation/);
      await expect(page.locator('[data-synthesis-attachment]')).toBeVisible();
      await page.locator('[data-synthesis-attachment] summary').click();
      await expect(page.locator('[data-synthesis-preview]')).toContainText('La prochaine étape utile');
      for(const [id,value]of Object.entries({'c-prenom':'Camille','c-nom':'Test','c-email':'qa.context@example.invalid','c-message':'Ma question de test.'}))await page.locator('#'+id).fill(value);
      await page.locator('#c-consent').check();await page.locator('[data-direct-contact] [type=submit]').click();
      await expect.poll(()=>requests.length).toBe(1);await expect(page.locator('[data-direct-contact] [type=submit]')).toBeDisabled();
      assert.equal(requests[0].articleContext.id,'marge-negociation-erreur-25000');assert.equal(requests[0].attachSynthesis,true);assert.match(requests[0].synthesis,/Réponses déclarées/);
      assert.equal(new URL(page.url()).search,'?article=marge-negociation-erreur-25000');
      await page.locator('#c-attach').uncheck();await page.locator('[data-direct-contact] [type=submit]').click();await expect.poll(()=>requests.length).toBe(2);
      assert.equal(requests[1].attachSynthesis,false);assert.equal(requests[1].synthesis,'');assert.notEqual(requests[0].requestId,requests[1].requestId);
    }finally{await context.close();}
  });

  await scenario('Contact sans JavaScript : aucun GET avec coordonnées, e-mail et appel disponibles', async()=>{
    const context=await createContext(390,{javaScriptEnabled:false});
    try{
      const page=await newPage(context),requests=[];
      page.on('request',request=>requests.push({method:request.method(),url:request.url()}));
      await page.goto(base+'/contact/',{waitUntil:'networkidle'});
      const form=page.locator('[data-direct-contact]');
      await expect(form).toHaveAttribute('method','post');await expect(form).toHaveAttribute('action','/api/lead');
      await expect(form.locator('[type=submit]')).toBeDisabled();
      await expect(page.locator('noscript a[href^="mailto:"]')).toBeVisible();await expect(page.locator('noscript a[href^="tel:"]')).toBeVisible();
      for(const [id,value]of Object.entries({'c-prenom':'CamilleConfidentiel','c-nom':'TestConfidentiel','c-email':'qa.nojs@example.invalid','c-objet':'SujetConfidentiel','c-message':'MessageConfidentiel'}))await page.locator('#'+id).fill(value);
      await page.locator('#c-consent').check();await page.locator('#c-objet').press('Enter');
      await expect(page).toHaveURL(new RegExp('/contact/?$'));
      for(const request of requests.filter(item=>item.method==='GET'))assert.doesNotMatch(decodeURIComponent(request.url),/CamilleConfidentiel|TestConfidentiel|qa.nojs|SujetConfidentiel|MessageConfidentiel/,'Donnée personnelle dans un GET');
      assert.equal(new URL(page.url()).search,'');
    }finally{await context.close();}
  });

  await scenario('Article → questionnaire → contact : identifiant public conservé avec stockage refusé', async()=>{
    const context=await createContext(390);
    try{
      await context.addInitScript(()=>{for(const storage of ['localStorage','sessionStorage'])Object.defineProperty(window,storage,{configurable:true,get(){throw new DOMException('QA storage denied','SecurityError');}});});
      const page=await newPage(context),article='retours-de-visite';
      await page.goto(base+'/ressources/'+article+'/',{waitUntil:'networkidle'});
      await page.locator('.res-primary-action').click();
      await expect.poll(()=>new URL(page.url()).pathname).toBe('/situer-ma-vente/');
      assert.equal(new URL(page.url()).search,'?article='+article);
      await expect(page.locator('[data-storage-warning]')).toBeVisible();
      for(const value of projects.seller.values){await page.locator('.lv-question-form input[value="'+value+'"]').check();await page.locator('.lv-question-form [type=submit]').click();}
      await expect(page.locator('.lv-synthesis-card')).toHaveCount(3);
      await page.locator('.lv-synthesis-contact a.lv-text-link').click();
      assert.equal(new URL(page.url()).pathname,'/contact/');assert.equal(new URL(page.url()).search,'?article='+article);
      await expect(page.locator('[data-article-context]')).toContainText('retours de visite');
      await expect(page.locator('#c-objet')).toHaveValue(/retours de visite/);
      await expect(page.locator('[data-direct-contact] [type=submit]')).toBeEnabled();
      assert.deepEqual(page.errors,[]);
    }finally{await context.close();}
  });

  await scenario('Diagnostic incomplet : /lecture propose de continuer sans inventer une synthèse historique', async () => {
    const context = await createContext(375);
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
    const context = await createContext(375);
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
    const noJs = await createContext(375, { javaScriptEnabled: false });
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

  for (const width of [360, 390, 430]) for (const route of ['/', '/reprendre/', '/contact/', '/votre-rue/', '/prix-immobilier/leves/']) await scenario(`Finition publique ${route} / ${width}px`, async () => {
    const context = await createContext(width);
    try {
      const page = await newPage(context);
      assert.equal((await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' })).status(), 200);
      await fits(page, route);
      if (width === 390) await axe(page, route);
      assert.deepEqual(page.errors, []);
      await captureScreenshot(page,`public-${route.replaceAll('/', '-').replace(/^-|-$/g, '') || 'home'}-${width}.png`);
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
