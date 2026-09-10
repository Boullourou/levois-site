import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Local UI fixtures. The actual API handler is separately exercised by
// src/lib/experience/audit-api.test.ts. This script performs no external send.
const base = process.env.LEVOIS_TEST_URL || 'http://127.0.0.1:4331';
const out = 'docs/design/cible-20260910/preuves';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = { browser: 'Chromium desktop emulation', viewports: [390, 320, 1440], errors: [], scenarios: [], axe: [], screenshots: [], measurements: [], externalSends: 0 };
const listing = 'https://annonce.example/maison-leves';
const responses = {
  readable: { status: 200, json: { ok: true, snapshot: { url: listing, source: 'annonce.example', title: 'Maison à Lèves — 4 pièces, jardin et garage', description: 'Maison de 92 m² avec séjour, trois chambres, jardin et garage. Chauffage individuel. DPE et charges à consulter. Travaux de décoration à prévoir.', photoCount: 4, location: 'Lèves', price: '245000 €' } } },
  blocked: { status: 422, json: { fallback: true, reason: 'blocked', message: 'Le portail ne permet pas la lecture.' } },
  insufficient: { status: 422, json: { fallback: true, reason: 'unavailable', message: 'La page est accessible, mais elle ne fournit pas assez d’informations lisibles automatiquement.' } },
  unavailable: { status: 422, json: { fallback: true, reason: 'unavailable', message: 'La page n’est pas accessible pour le moment.' } },
  invalid: { status: 400, json: { message: 'Lien invalide.' } },
};
const label = { readable: 'Des éléments de la page ont été lus', blocked: 'Le portail n’a pas permis la lecture', insufficient: 'Le contenu accessible ne suffit pas', unavailable: 'La page est momentanément indisponible', transport: 'La lecture technique n’a pas abouti' };
let mode = 'readable';
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', acceptDownloads: true });
await context.route('**/api/audit-url/', route => mode === 'transport' ? route.abort('failed') : route.fulfill(responses[mode]));
await context.route('**/api/experience/actions', route => { report.externalSends++; return route.abort('blockedbyclient'); });
await context.addInitScript(() => {
  document.addEventListener('DOMContentLoaded', () => { const style = document.createElement('style'); style.textContent = 'astro-dev-toolbar{display:none!important}'; document.head.append(style); });
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__auditClipboard = text; } } });
});
const page = await context.newPage();
page.on('pageerror', error => report.errors.push(error.message));
const capture = async name => {
  const file = `${out}/audit-${name}.png`;
  const measurement = await page.evaluate(() => { const skip = document.querySelector('.lv-skip'), impact = document.querySelector('[data-audit-impact]'); return { scroll: scrollY, active: document.activeElement?.id || document.activeElement?.tagName, skipTransform: skip ? getComputedStyle(skip).transform : null, skipFocused: skip === document.activeElement, impactTop: impact && !impact.hidden ? impact.getBoundingClientRect().top : null }; });
  // Full-page capture starts at document origin so transformed fixed skip links
  // are not composited at the scrolled offset by Chromium's screenshot routine.
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: file, fullPage: true });
  await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), measurement.scroll);
  report.screenshots.push(file); report.measurements.push({ name, ...measurement });
};
const reflow = async () => { const { width, scroll } = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth })); assert.ok(scroll <= width, `Overflow ${scroll} > ${width}`); };
const axe = async name => { const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); const violations = result.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, failureSummary: n.failureSummary })) })); report.axe.push({ name, violations }); };
const submitQuestion = async value => { await page.locator(`input[name="audit-answer"][value="${value}"]`).check(); await expect(page.locator('[data-audit-impact]')).toBeVisible(); await page.locator('[data-audit-question] button[type="submit"]').click(); };
const saved = () => page.evaluate(() => JSON.parse(sessionStorage.getItem('levois:experience:v1')));
const entry = async () => { await page.goto(`${base}/audit-annonce`, { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready); };
const start = async () => { await page.locator('#listing-url').fill(listing); await page.locator('[data-url-form] button[type="submit"]').click(); await expect(page.locator('#audit-question')).toBeFocused(); };
try {
  for (const width of [390, 320, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await entry(); await reflow(); await capture(`${width}-entree`); await axe(`${width}-entree`);
    await start(); await expect(page.locator('.audit-status-side h2')).toHaveText(label.readable);
    await page.keyboard.press('Tab'); await expect(page.locator('input[name="audit-answer"]').first()).toBeFocused();
    await page.keyboard.press('Space'); await expect(page.locator('[data-audit-impact]')).toBeVisible();
    await capture(`${width}-question-impact`); await axe(`${width}-question`);
    await submitQuestion('plus-30'); await submitQuestion('visites-sans-offre'); await submitQuestion('retour-travaux');
    await expect(page.locator('#audit-result-title')).toBeFocused();
    await expect(page.locator('.audit-actions-list > li')).toHaveCount(2);
    await expect(page.locator('input[type=email],input[type=tel]')).toHaveCount(0);
    await reflow(); await capture(`${width}-resultat`); await axe(`${width}-resultat`);
    const before = await saved(); assert.equal(before.project, 'audit'); assert.equal(before.reading.sections.length, 5); assert.equal(before.answers.audit_url.value, listing); assert.equal(before.answers.audit_title.provenance, 'imported');
    report.scenarios.push({ width, scenario: 'Readable page + 3 explicit answers + 2 real actions + no coordinates', passed: true });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-audit-copy]').click();
  const copied = await page.evaluate(() => window.__auditClipboard); assert.ok(copied.includes(listing) && copied.includes('partiel') && copied.includes('audit-hybrid-2.0.0'));
  const downloadPending = page.waitForEvent('download'); await page.locator('[data-audit-download]').click(); const download = await downloadPending;
  const downloaded = await readFile(await download.path(), 'utf8'); assert.ok(download.suggestedFilename().endsWith('.html'));
  const prior = await saved();
  const preserved = await page.evaluate(html => { const doc = new DOMParser().parseFromString(html, 'text/html'); const node = doc.querySelector('#levois-context'); const data = JSON.parse(node.textContent); node.remove(); return { data, text: doc.body.textContent }; }, downloaded);
  assert.deepEqual(preserved.data.reading, prior.reading); assert.deepEqual(preserved.data.answers, prior.answers);
  const humanTexts = [prior.reading.title, ...prior.reading.sections.flatMap(s => [s.title, ...s.items.flatMap(i => [i.text, i.condition].filter(Boolean))]), prior.reading.nextDecision.text, prior.reading.nextDecision.why, prior.reading.nextDecision.changesWith, ...prior.reading.limits].filter(Boolean);
  for (const text of humanTexts) { assert.ok(preserved.text.includes(text), `Missing human HTML content: ${text}`); assert.ok(copied.includes(text), `Missing copied content: ${text}`); }
  const importPage = await context.newPage(); await importPage.goto(`${base}/reprendre`, { waitUntil: 'networkidle' });
  await importPage.locator('#resume-file').setInputFiles({ name: download.suggestedFilename(), mimeType: 'text/html', buffer: Buffer.from(downloaded) });
  await expect(importPage.locator('[data-resume-compare]')).toContainText('Voici le contexte à reprendre'); await expect(importPage.locator('[data-resume-compare]')).toContainText(listing); await importPage.close();
  report.scenarios.push({ scenario: 'Common HTML export is accepted by Reprendre; complete visible reading text matches the copy; source answers and frozen reading are unchanged', passed: true });
  await page.locator('[data-audit-correct]').click(); await expect(page.locator('input[value=plus-30]')).toBeChecked();
  await page.locator('[data-audit-question] button[type=submit]').click();
  await page.locator('input[value=vues-sans-contact]').check();
  const editing = await saved(); assert.equal(editing.reading, undefined); assert.equal(editing.answers.audit_context, undefined); assert.ok(editing.history.some(r => r.id === prior.reading.id));
  await page.locator('[data-audit-question] button[type=submit]').click(); await expect(page.locator('input:checked')).toHaveCount(0);
  await submitQuestion('prix-modifie'); await expect(page.locator('.audit-actions-list')).not.toContainText('baisse');
  const current = await saved(); assert.ok(current.revision > prior.revision);
  await page.locator('[data-audit-reading]').click(); await page.waitForURL('**/lecture');
  await expect(page.locator('[data-reading-root]')).toContainText(current.reading.title);
  for (const section of current.reading.sections) for (const item of section.items) await expect(page.locator('[data-reading-root]')).toContainText(item.text);
  await expect(page.locator('[data-keep]')).toBeVisible();
  for (const action of ['email-copy', 'review', 'exchange']) {
    const opener = page.locator(`[data-action="${action}"]`); await opener.click();
    await expect(page.locator('[data-action-dialog]')).toBeVisible();
    await page.locator('[data-action-dialog] summary').first().click();
    await expect(page.locator('[data-action-dialog] .lv-preview').first()).toContainText(listing);
    await expect(page.locator('[data-action-dialog] input[name=approved]')).not.toBeChecked();
    await page.keyboard.press('Escape'); await expect(opener).toBeFocused();
  }
  await capture('390-lecture-commune'); await axe('390-lecture-commune');
  report.scenarios.push({ scenario: 'Correction invalidates old reading + context, history preserved; download and copy complete; common reading retains all five blocks; three voluntary dialogs, no submit', passed: true });

  await entry(); await page.locator('[data-resume-audit]').click();
  await expect(page.locator('#audit-result-title')).toHaveText(current.reading.title);
  await page.locator('[data-audit-seller]').click(); await page.waitForURL('**/situer-ma-vente');
  const seller = await saved(); assert.equal(seller.project, 'seller'); assert.equal(seller.answers.seller_situation.value, 'peu-contacts'); assert.equal(seller.answers.seller_peu_contacts_vues.value, 'nombreuses'); assert.equal(seller.answers.seller_peu_contacts_vues.provenance, 'imported'); assert.equal(seller.answers.audit_url.value, listing); assert.equal(new URL(page.url()).search, '');
  report.scenarios.push({ scenario: 'Explicit seller continuation imports only semantic equivalents and keeps private URL out of navigation', passed: true });

  for (const failure of ['blocked', 'insufficient', 'unavailable', 'transport']) {
    mode = failure; await entry(); await start(); await expect(page.locator('.audit-status-side h2')).toHaveText(label[failure]);
    await capture(`390-${failure}`); await submitQuestion('unknown'); await submitQuestion('unknown'); await submitQuestion('unknown');
    await expect(page.locator('.audit-actions-list > li')).toHaveCount(2);
    const state = await saved(); assert.equal(state.answers.audit_access.value, failure); assert.equal(state.answers.audit_duration.value, 'unknown'); assert.ok(state.reading.sections.some(s => s.items.some(i => i.kind === 'unknown'))); assert.ok(JSON.stringify(state.reading).includes('Je ne sais pas encore'));
    report.scenarios.push({ scenario: `${failure}: correct access status, unknowns remain unknown, useful two-action result`, passed: true });
  }
  mode = 'invalid'; await entry(); await page.locator('#listing-url').fill(listing); await page.locator('[data-url-form] button[type=submit]').click(); await expect(page.locator('[data-url-status]')).toContainText('pas accepté'); await expect(page.locator('[data-audit-output]')).toBeHidden();
  await page.locator('[data-manual]').click(); await submitQuestion('unknown'); await submitQuestion('offre-recue'); await submitQuestion('offre-orale');
  await expect(page.locator('.audit-actions-list')).toContainText('proposition'); await expect(page.locator('.audit-actions-list')).not.toContainText('intention orale comme un engagement');
  report.scenarios.push({ scenario: 'Invalid URL is correctable; manual flow available; offer with unknown duration retains offer verification', passed: true });
  const keys = await page.evaluate(() => [sessionStorage.getItem('levois:experience:v1'), sessionStorage.getItem('levois:audit:draft:v2')]); assert.ok(keys.every(Boolean));
  await page.goto(`${base}/confidentialite`, { waitUntil: 'networkidle' }); await page.locator('[data-clear-experience]').click();
  await expect(page.locator('[data-clear-status]')).toContainText('brouillon d’audit');
  assert.deepEqual(await page.evaluate(() => [sessionStorage.getItem('levois:experience:v1'), sessionStorage.getItem('levois:audit:draft:v2')]), [null, null]);
  await entry(); await expect(page.locator('[data-resume]')).toBeHidden(); await expect(page.locator('#listing-url')).toHaveValue('');
  report.scenarios.push({ scenario: 'One confidentiality action removes both common context and audit draft; audit cannot restore the erased URL or responses', passed: true });
  assert.deepEqual(report.errors, []); assert.equal(report.externalSends, 0);
  report.status = report.axe.some(a => a.violations.length) ? 'accessibility-fixes-needed' : 'passed';
} catch (error) { report.status = 'failed'; report.failure = error.stack; await capture('failure'); throw error; }
finally { await writeFile(`${out}/audit-ui-verification.json`, JSON.stringify(report, null, 2)); await browser.close(); console.log(JSON.stringify(report, null, 2)); }
