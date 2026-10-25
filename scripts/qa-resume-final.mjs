import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const base = process.env.LEVOIS_QA_BASE || process.env.LEVOIS_TEST_URL || 'http://127.0.0.1:4345';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Local preview required.');
const out = 'artifacts/final-validation/reprise';
await fs.mkdir(out, { recursive: true });
const key = 'levois:experience:v1', date = '2026-10-25T12:00:00.000Z';
function fixture(project = 'buyer', withReading = true) {
  return { schemaVersion: 1, id: crypto.randomUUID(), revision: 1, project,
    entry: { door: 'direct', source: null, promise: null }, createdAt: date, updatedAt: date,
    answers: { original_answer: { value: 'Réponse historique conservée', provenance: 'declared', revision: 1, updatedAt: date } },
    history: [], ...(withReading ? { reading: { id: 'fixture-reading', revision: 1, title: 'Lecture historique conservée',
      sections: [{ id: 'constat', title: 'Le constat', items: [{ text: 'Situation déclarée, à vérifier.', kind: 'declared' }] }],
      nextDecision: { text: 'Vérifier votre budget.', why: 'Il reste déclaré.' }, limits: ['Pas une validation de financement.'],
      methodVersion: 'fixture-historical', generatedAt: date } } : {}),
  };
}
const report = { base, startedAt: new Date().toISOString(), completedAt: null, passed: [], failed: [], prohibitedWrites: [], screenshots: [] };
const browser = await chromium.launch({ headless: true,
  ...(process.env.LEVOIS_BROWSER_CHANNEL ? { channel: process.env.LEVOIS_BROWSER_CHANNEL }
    : process.platform === 'win32' ? { channel: 'chrome' } : {}),
});
async function test(name, fn, viewport = { width: 390, height: 844 }, javaScriptEnabled = true) {
  const context = await browser.newContext({ viewport, javaScriptEnabled, reducedMotion: 'reduce' });
  const page = await context.newPage(); const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== new URL(base).origin) return route.abort();
    if (!['GET', 'HEAD'].includes(request.method())) { report.prohibitedWrites.push({ path: url.pathname, method: request.method() }); return route.abort(); }
    return route.continue();
  });
  try { await fn(page, context); expect(errors).toEqual([]); report.passed.push(name); }
  catch (error) { report.failed.push({ name, error: String(error.message).slice(0, 2000) }); }
  finally { await context.close(); }
}
async function seed(context, value) {
  await context.addInitScript(({ key, value }) => { if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, JSON.stringify(value)); }, { key, value });
}
async function saved(page) { return page.evaluate(key => JSON.parse(sessionStorage.getItem(key) || 'null'), key); }
try {
  for (const width of [320, 390, 1440]) {
    await test(`Session buyer preserved at ${width}px and keyboard continuation`, async (page, context) => {
      const source = fixture(); await seed(context, source); await page.goto(base + '/reprendre');
      await expect(page.locator('[data-current-project]')).toBeVisible();
      expect((await saved(page)).project).toBe('buyer');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const shot = `${out}/reprendre-${width}.png`; await page.screenshot({ path: shot, fullPage: true }); report.screenshots.push(shot);
      const link = page.locator('[data-current-link]'); await link.focus(); await page.keyboard.press('Enter');
      await page.waitForURL(/\/lecture\/?$/); expect((await saved(page)).project).toBe('buyer');
    }, { width, height: width === 1440 ? 900 : 844 });
  }
  await test('Import is inert and requires explicit replacement; retains historical reading', async (page, context) => {
    const current = fixture('seller'), incoming = fixture('buyer'); await seed(context, current);
    await page.goto(base + '/reprendre');
    const html = '<img src="https://external.invalid/track"><script>window.injected=true</script><script id="levois-context" type="application/json">' + JSON.stringify(incoming) + '</script>';
    await page.locator('#resume-file').setInputFiles({ name: 'lecture.html', mimeType: 'text/html', buffer: Buffer.from(html) });
    await expect(page.locator('[data-resume-compare]')).toBeVisible();
    await expect(page.locator('[data-replace-warning]')).toBeVisible();
    expect((await saved(page)).id).toBe(current.id); expect(await page.evaluate(() => window.injected)).toBeUndefined();
    await page.locator('[data-resume-confirm]').click(); await page.waitForURL(/\/lecture\/?$/);
    expect((await saved(page)).id).toBe(incoming.id); expect((await saved(page)).project).toBe('buyer');
    expect((await saved(page)).reading.methodVersion).toBe('fixture-historical');
  });
  await test('Draft transition routes to transition, malformed import never replaces session', async (page, context) => {
    const current = fixture('transition', false); await seed(context, current); await page.goto(base + '/reprendre');
    await expect(page.locator('[data-current-link]')).toHaveAttribute('href', '/vendre-et-acheter');
    await page.locator('#resume-file').setInputFiles({ name: 'wrong.json', mimeType: 'application/json', buffer: Buffer.from('{"schemaVersion":999}') });
    await expect(page.locator('[data-resume-error]')).toBeVisible(); expect((await saved(page)).id).toBe(current.id);
    await expect(page.locator('[data-resume-compare]')).toBeHidden();
  });
  await test('Denied storage preserves imported preview and never claims a resume', async (page, context) => {
    await context.addInitScript(() => { Storage.prototype.setItem = function () { throw new DOMException('Fixture blocked', 'SecurityError'); }; });
    await page.goto(base + '/reprendre');
    await page.locator('#resume-file').setInputFiles({ name: 'lecture.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture())) });
    await page.locator('[data-resume-confirm]').click();
    await expect(page.locator('[data-resume-error]')).toContainText('empêche'); await expect(page).toHaveURL(/\/reprendre\/?$/);
  });
  await test('Protected link uses mocked OTP and never mutates before confirmation', async (page, context) => {
    const current = fixture('seller'), incoming = fixture('buyer'), token = 'a'.repeat(64); let challenge = 0, verify = 0;
    await seed(context, current);
    await page.route('**/api/experience/reprise', async route => {
      const data = route.request().postDataJSON(); expect(data.token).toBe(token);
      if (data.step === 'challenge') challenge++; else { verify++; expect(data.code).toBe('12345678'); }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data.step === 'challenge'
        ? { ok: true, message: 'Code simulé, aucun e-mail envoyé.' }
        : { ok: true, context: incoming, humanNote: { id: 'mock-note', text: 'Note humaine de test.', reason: 'Déclaration', evidence: 'Pièce à vérifier', createdAt: date } }) });
    });
    await page.goto(base + '/reprendre#acces=' + token); await expect(page.locator('[data-challenge]')).toBeVisible();
    expect(page.url()).not.toContain(token); await page.locator('[data-challenge]').click();
    await page.locator('#resume-code').fill('12345678'); await page.locator('[data-code-form] button').click();
    await expect(page.locator('[data-resume-compare]')).toContainText('Partagé après échange'); expect((await saved(page)).id).toBe(current.id);
    await page.locator('[data-resume-confirm]').click(); await page.waitForURL(/\/lecture\/?$/);
    expect((await saved(page)).humanNotes[0].author).toBe('Mouaad Boullourou'); expect(challenge).toBe(1); expect(verify).toBe(1);
  });
  await test('Without JavaScript, project routes and direct contact remain reachable', async page => {
    await page.goto(base + '/reprendre');
    for (const href of ['/ma-recherche', '/situer-ma-vente', '/vendre-et-acheter', '/contact']) await expect(page.locator('main a[href="' + href + '"]').last()).toBeVisible();
  }, { width: 320, height: 844 }, false);
} finally {
  await browser.close(); report.completedAt = new Date().toISOString();
  await fs.writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2)); if (report.failed.length || report.prohibitedWrites.length) process.exitCode = 1;
}
