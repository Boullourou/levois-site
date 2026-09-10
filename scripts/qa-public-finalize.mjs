import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

// Preserve both the original findings and their targeted verification. This
// index uses the latest result for each (route, width); it does not rerun tests.
const out = path.resolve('docs/design/cible-20260910/preuves/global');
const sources = ['rapport-public-pages.json', 'rapport-public-pages-recheck.json', 'rapport-public-menu.json'];
const [initial, recheck, menu] = await Promise.all(sources.map(async name => JSON.parse(await readFile(path.join(out, name), 'utf8'))));
assert.equal(initial.base, recheck.base);
assert.equal(initial.base, menu.base);
const states = new Map(initial.pages.map(page => [`${page.route}:${page.width}`, { ...page, sourceReport: sources[0] }]));
for (const page of recheck.pages) {
  const key = `${page.route}:${page.width}`;
  assert.ok(states.has(key), `Recheck must cover an original state: ${key}`);
  if (Date.parse(page.finishedAt) >= Date.parse(states.get(key).finishedAt)) states.set(key, { ...page, sourceReport: sources[1] });
}
const links = new Map(initial.links.map(link => [link.path, { ...link, sourceReport: sources[0] }]));
const recheckIsNewer = Date.parse(recheck.finishedAt) >= Date.parse(initial.finishedAt);
for (const link of recheck.links) if (recheckIsNewer || !links.has(link.path)) links.set(link.path, { ...link, sourceReport: sources[1] });
const screenshots = new Map(initial.screenshots.map(shot => [shot.file, { ...shot, sourceReport: sources[0] }]));
for (const shot of recheck.screenshots) if (recheckIsNewer || !screenshots.has(shot.file)) screenshots.set(shot.file, { ...shot, sourceReport: sources[1] });
const pages = [...states.values()], allLinks = [...links.values()];
const report = {
  consolidatedAt: new Date().toISOString(), base: initial.base,
  sourceReports: sources.map((file, index) => { const source = [initial, recheck, menu][index]; return { file, startedAt: source.startedAt, finishedAt: source.finishedAt, status: source.status, summary: source.summary }; }),
  scope: { routes: initial.routes, widths: initial.widths, browser: initial.browser },
  notes: [...initial.notes, 'This consolidated report retains the latest tested state per route and width. Original findings are preserved in the source report.', 'The legal-link corrections and actual buyer restitution were rechecked at all four widths.', 'The shared menu also passed Enter, Tab through all 11 links, and Escape restoring the trigger at all four widths.', 'Modal, annotation, short viewport, zoom and performance checks are covered separately by the parent agent.'],
  pages, links: allLinks, screenshots: [...screenshots.values()], keyboard: menu.states,
  summary: {
    routes: initial.routes.length, latestPageStates: pages.length,
    pageStatesExecuted: initial.pages.length + recheck.pages.length,
    keyboardStates: menu.states.length, structuralScreenshots: screenshots.size,
    menuScreenshots: menu.states.filter(state => state.screenshot).length,
    pagesWithIssues: pages.filter(page => page.failures.length || page.jsErrors.length || page.axe?.violations.length).length,
    keyboardStatesWithIssues: menu.summary.statesWithIssues,
    jsErrors: pages.reduce((n, page) => n + page.jsErrors.length, 0) + menu.summary.jsErrors,
    axeViolations: pages.reduce((n, page) => n + (page.axe?.violations.length || 0), 0) + menu.summary.axeViolations,
    overflowStates: pages.filter(page => page.layout?.documentWidth > page.width + 1).length,
    uniqueInternalLinks: allLinks.length,
    brokenInternalLinks: allLinks.filter(link => !link.resolved && link.path !== '/404').length,
    blockedSubmissions: initial.blockedSubmissions.length + recheck.blockedSubmissions.length + menu.blockedSubmissions.length,
  },
};
report.status = report.summary.pagesWithIssues || report.summary.keyboardStatesWithIssues || report.summary.brokenInternalLinks || report.summary.blockedSubmissions ? 'issues-found' : 'passed';
await writeFile(path.join(out, 'rapport-public-pages-final.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ status: report.status, ...report.summary }, null, 2));
