import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Read-only keyboard QA of the shared public navigation. No remote request or
// form submission is allowed; test output stays in the public-page evidence set.
const base = process.env.LEVOIS_TEST_URL || 'http://127.0.0.1:4331';
const origin = new URL(base).origin;
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const out = path.resolve('docs/design/cible-20260910/preuves/global');
await mkdir(out, { recursive: true });
const report = { startedAt: new Date().toISOString(), base, browser: 'Chromium keyboard and desktop viewport emulation', status: 'running', states: [], blockedExternalRequests: [], blockedSubmissions: [], notes: ['The shared menu is reached using Tab, never by assigning focus in script.', 'Enter opens; every menu link is reached in DOM order with Tab; Escape closes and restores the trigger.', 'No navigation or form submission is performed. No physical device or human test is claimed.'] };
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [320, 390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 1000 : 844 }, reducedMotion: 'reduce' });
    const state = { width, route: '/', jsErrors: [], failures: [], tabOrderToTrigger: [], menuLinks: [], axeViolations: [] };
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (['http:', 'https:'].includes(url.protocol) && url.origin !== origin) { report.blockedExternalRequests.push({ width, host: url.hostname, path: url.pathname }); return route.abort('blockedbyclient'); }
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) { report.blockedSubmissions.push({ width, method: request.method(), path: url.pathname }); return route.abort('blockedbyclient'); }
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', error => state.jsErrors.push(error.message));
    try {
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}' });
      await page.evaluate(() => document.fonts.ready);
      const toggle = page.locator('.lv-menu-button'), menu = page.locator('#lv-menu');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      assert.equal(await menu.isVisible(), false);
      for (let step = 0; step < 20; step++) {
        await page.keyboard.press('Tab');
        state.tabOrderToTrigger.push(await page.evaluate(() => ({ tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 100), href: document.activeElement?.getAttribute('href') })));
        if (await toggle.evaluate(el => document.activeElement === el)) break;
      }
      assert.ok(await toggle.evaluate(el => document.activeElement === el), 'Tab must reach the menu trigger.');
      await page.keyboard.press('Enter');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
      assert.equal(await menu.isVisible(), true);
      const expected = await menu.locator('a').evaluateAll(links => links.map(link => ({ href: link.getAttribute('href'), text: link.textContent.trim().replace(/\s+/g, ' ') })));
      assert.ok(expected.length > 0);
      for (const link of expected) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => { const el = document.activeElement, rect = el.getBoundingClientRect(), style = getComputedStyle(el); return { href: el.getAttribute('href'), text: el.textContent.trim().replace(/\s+/g, ' '), insideMenu: !!el.closest('#lv-menu'), visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden', outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth }; });
        assert.equal(focused.insideMenu, true, 'Each menu link must be keyboard reachable.');
        assert.equal(focused.href, link.href);
        assert.equal(focused.text, link.text);
        assert.equal(focused.visible, true);
        state.menuLinks.push(focused);
      }
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      state.axeViolations = result.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => ({ target: n.target, failureSummary: n.failureSummary })) }));
      state.documentWidthOpen = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(state.documentWidthOpen <= width + 1, 'Open menu must not overflow horizontally.');
      if ([390, 1440].includes(width)) { state.screenshot = `menu-clavier-${width}.png`; await page.screenshot({ path: path.join(out, state.screenshot), fullPage: false, animations: 'disabled' }); }
      await page.keyboard.press('Escape');
      assert.equal(await menu.isVisible(), false);
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      assert.ok(await toggle.evaluate(el => document.activeElement === el), 'Escape must restore focus to the trigger.');
      state.escapeRestoresTrigger = true;
    } catch (error) { state.failures.push(error.message); }
    finally { await context.close(); report.states.push(state); }
  }
  report.summary = { states: report.states.length, statesWithIssues: report.states.filter(s => s.failures.length || s.jsErrors.length || s.axeViolations.length).length, keyboardLinksReached: report.states.reduce((n, s) => n + s.menuLinks.length, 0), jsErrors: report.states.reduce((n, s) => n + s.jsErrors.length, 0), axeViolations: report.states.reduce((n, s) => n + s.axeViolations.length, 0), blockedSubmissions: report.blockedSubmissions.length };
  report.status = report.summary.statesWithIssues || report.summary.blockedSubmissions ? 'issues-found' : 'passed';
} finally {
  await browser.close();
  report.finishedAt = new Date().toISOString();
  await writeFile(path.join(out, 'rapport-public-menu.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary || { status: report.status }, null, 2));
}
