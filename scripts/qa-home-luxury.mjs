import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.LEVOIS_TEST_URL || 'http://127.0.0.1:4335';
const output = process.env.LEVOIS_QA_OUTPUT || 'artifacts/home-luxury';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const results = [];
const expectedDoors = ['/ma-recherche/', '/situer-ma-vente/', '/vendre-et-acheter/'];

async function scenario(name, options, test) {
  const context = await browser.newContext({ locale: 'fr-FR', ...options });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    const response = await page.goto(base, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    await page.evaluate(() => document.fonts.ready);
    await test(page);
    assert.deepEqual(errors, []);
    results.push({ name, status: 'passed' });
  } catch (error) {
    results.push({ name, status: 'failed', message: error.message });
    await page.screenshot({ path: `${output}/${name}-failure.png`, fullPage: true });
  } finally {
    await context.close();
  }
}

try {
  for (const width of [1440, 1024, 768, 390, 320]) {
    await scenario(`viewport-${width}`, { viewport: { width, height: width > 768 ? 900 : 844 } }, async page => {
      const metrics = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }));
      assert.ok(metrics.content <= metrics.width, JSON.stringify(metrics));
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('main').count(), 1);
      assert.deepEqual(await page.locator('.porte-card').evaluateAll(links => links.map(a => new URL(a.href).pathname)), expectedDoors);
      const issues = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      assert.deepEqual(issues.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), []);
      await page.locator('.bio-photo').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => { const img = document.querySelector('.bio-photo'); return img.complete && img.naturalWidth === 800; });
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      if ([1440, 390, 320].includes(width)) {
        await page.screenshot({ path: `${output}/home-${width}.png` });
        await page.screenshot({ path: `${output}/home-${width}-full.png`, fullPage: true });
      }
    });
  }

  await scenario('keyboard-mobile', { viewport: { width: 390, height: 844 } }, async page => {
    await page.keyboard.press('Tab');
    assert.match(await page.locator(':focus').innerText(), /Aller au contenu/);
    await page.keyboard.press('Enter');
    assert.equal(await page.locator(':focus').getAttribute('id'), 'contenu');
    await page.goto(base);
    for (let step = 0; step < 12; step++) {
      await page.keyboard.press('Tab');
      if (await page.locator(':focus').evaluate(el => el.tagName === 'SUMMARY')) break;
    }
    assert.equal(await page.locator(':focus').evaluate(el => el.tagName), 'SUMMARY');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('details[open]').count(), 1);
    const menuIssues = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(menuIssues.violations.map(v => v.id), []);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').evaluate(el => new URL(el.href).pathname), '/ma-recherche/');
    await page.keyboard.press('Enter');
    await page.waitForURL(url => url.pathname.replace(/\/$/, '') === '/ma-recherche');
  });

  await scenario('privacy-and-entry-context', { viewport: { width: 390, height: 844 } }, async page => {
    await page.goto(`${base}/?src=video`);
    await page.waitForFunction(() => document.querySelector('.porte-card').search.includes('src=video'));
    assert.ok(await page.locator('.porte-card').evaluateAll(links => links.every(a => new URL(a.href).searchParams.get('src') === 'video')));
    const thirdParty = await page.evaluate(() => performance.getEntriesByType('resource').map(r => r.name).filter(url => !url.startsWith(location.origin)));
    assert.deepEqual(thirdParty, [], 'No third-party requests before consent');
    await page.locator('[data-analytics-settings]').click();
    assert.ok(await page.locator('#analytics-preferences').isVisible());
    const issues = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(issues.violations.map(v => v.id), []);
    await page.locator('[data-analytics-choice="refused"]').click();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('levois.analytics.v1')).choice), 'refused');
    await page.keyboard.press('Escape');
    assert.ok(!(await page.locator('#analytics-preferences').isVisible()));
  });

  await scenario('reduced-motion', { viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }, async page => {
    const duration = await page.locator('.porte-card').first().evaluate(el => getComputedStyle(el).transitionDuration);
    assert.equal(duration, '0s');
  });

  await scenario('no-javascript', { viewport: { width: 320, height: 844 }, javaScriptEnabled: false }, async page => {
    const menu = page.locator('summary');
    await menu.click();
    assert.ok(await page.locator('details[open] a').first().isVisible());
    for (const path of [...expectedDoors, '/votre-rue/', '/reprendre/', '/lecture/']) {
      const response = await page.request.get(new URL(path, base).href);
      assert.equal(response.status(), 200, path);
    }
    await page.locator('.porte-card').first().click();
    await page.waitForURL(url => url.pathname.replace(/\/$/, '') === '/ma-recherche');
  });
} finally {
  await browser.close();
  await writeFile(`${output}/checks.json`, JSON.stringify({ base, at: new Date().toISOString(), results }, null, 2));
}
console.log(JSON.stringify(results, null, 2));
if (results.some(result => result.status === 'failed')) process.exitCode = 1;
