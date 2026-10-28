import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { inspectEditorialHtml, verifyEditorialPublication } from '../../../scripts/editorial-receipts.mjs';
import type { EditorialArticle } from './schema';

const verifiedAt = '2026-10-28T06:04:30.000Z';
const now = () => new Date(verifiedAt);
const service = { CF_ACCESS_CLIENT_ID: 'test-only-id.access', CF_ACCESS_CLIENT_SECRET: 'test-only-secret' };
function article(suffix = '001'): EditorialArticle {
  return {
    schemaVersion: 1, topicId: `campagne-test-j${suffix}`, revision: 1, slug: `sujet-test-${suffix}`,
    title: 'Vendre & acheter : que vérifier ?', summary: 'Un résumé de test.', answer: 'Une réponse sans publication.',
    sections: [{ heading: 'Vérifier', paragraphs: ['Un exemple de test.'] }],
    author: { name: 'Auteur de test', role: 'Exemple technique' },
    dates: { createdAt: '2026-10-27T10:00:00+01:00', publishAt: '2026-10-28T07:00:00+01:00' },
    sources: [], scope: 'Tests uniquement.', limits: ['Exemple technique.'], image: null,
    category: 'vente-achat', primaryDestination: '/vendre-et-acheter/', status: 'scheduled',
  };
}
function manifestFor(articles: EditorialArticle[]) {
  const sorted = [...articles].sort((a, b) => a.topicId.localeCompare(b.topicId));
  return { schemaVersion: 1, fingerprint: createHash('sha256').update(JSON.stringify(sorted)).digest('hex'), articles: sorted.map(({ topicId, slug, revision }) => ({ topicId, slug, revision })) };
}
function htmlFor(item: EditorialArticle) {
  return `<html><head><link rel="canonical" href="https://levois.fr/ressources/${item.slug}/"><meta name="levois:topic-id" content="${item.topicId}"><meta name="levois:revision" content="${item.revision}"></head><body><h1>${item.title.replace('&', '&amp;')}</h1></body></html>`;
}
function mockSite(articles: EditorialArticle[], overrides: Record<string, () => Response | Promise<Response>> = {}) {
  return vi.fn(async (input: string | URL | Request, options?: RequestInit) => {
    expect(options?.method).toBe('GET');
    expect(options?.redirect).toBe('error');
    const url = new URL(input instanceof Request ? input.url : input);
    if (overrides[url.pathname]) return overrides[url.pathname]();
    if (url.pathname === '/editorial-manifest.json') return Response.json(manifestFor(articles));
    const item = articles.find((value) => url.pathname === `/ressources/${value.slug}/`);
    return new Response(item ? htmlFor(item) : 'Not found', { status: item ? 200 : 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  });
}

describe('reçus de publication utilisables par Limova', () => {
  it('confirms the manifest and exact production article before allowing social distribution', async () => {
    const item = article(); const fetcher = mockSite([item]);
    const report = await verifyEditorialPublication({ host: 'https://levois.fr/', manifest: manifestFor([item]), articles: [item], credentials: service, now, fetcher, workflow: { repository: 'test/repo', runId: '42', runAttempt: '2', commitSha: 'source-only' } });
    expect(report).toMatchObject({ deploymentState: 'verified', environment: 'production', verifiedAt, workflow: { runId: '42', runAttempt: '2' } });
    expect(report.receipts[0]).toEqual({ id: item.topicId, revision: 1, url: `https://levois.fr/ressources/${item.slug}/`, checkedUrl: `https://levois.fr/ressources/${item.slug}/`, deploymentState: 'verified', verifiedAt, socialReady: true, failureCode: null, evidence: { manifest: true, http200: true, html: true, canonical: true, title: true, id: true, revision: true } });
    expect(fetcher).toHaveBeenCalledTimes(2);
    for (const [, options] of fetcher.mock.calls) expect(new Headers(options?.headers).has('CF-Access-Client-Secret')).toBe(false);
    expect(JSON.stringify(report)).not.toContain(service.CF_ACCESS_CLIENT_SECRET);
  });

  it('verifies an Access-protected preview without ever authorizing social publication', async () => {
    const item = article(); const fetcher = mockSite([item]);
    const report = await verifyEditorialPublication({ host: 'https://preview.levois-site.pages.dev/', manifest: manifestFor([item]), articles: [item], credentials: service, now, fetcher });
    expect(report).toMatchObject({ environment: 'preview', deploymentState: 'verified' });
    expect(report.receipts[0]).toMatchObject({ verifiedAt, socialReady: false, url: `https://levois.fr/ressources/${item.slug}/`, checkedUrl: `https://preview.levois-site.pages.dev/ressources/${item.slug}/` });
    for (const [, options] of fetcher.mock.calls) expect(new Headers(options?.headers).get('CF-Access-Client-Secret')).toBe(service.CF_ACCESS_CLIENT_SECRET);
  });

  it('verifies a Markdown V2 revision against its complete content fingerprint', async () => {
    const base = article();
    const { sections: _sections, ...metadata } = base as Extract<EditorialArticle, { schemaVersion: 1 }>;
    const item: EditorialArticle = { ...metadata, schemaVersion: 2, sources: [], image: null, content: { format: 'commonmark', markdown: '# Vendre & acheter : que vérifier ?\n\nUn texte **conservé**.' }, dates: { ...base.dates, createdAt: '2026-10-27' } };
    const report = await verifyEditorialPublication({ host: 'https://levois.fr/', manifest: manifestFor([item]), articles: [item], now, credentials: {}, fetcher: mockSite([item]) });
    expect(report.receipts[0]).toMatchObject({ id: item.topicId, revision: 1, deploymentState: 'verified', socialReady: true });
  });

  it.each([
    ['Access login with 200', () => new Response('<html>Sign in to Cloudflare Access</html>', { headers: { 'Content-Type': 'text/html' } }), 'manifest_not_json'],
    ['404', () => new Response('Not found', { status: 404 }), 'manifest_http_404'],
    ['stale revision', () => Response.json({ ...manifestFor([article()]), articles: [{ topicId: article().topicId, slug: article().slug, revision: 2 }] }), 'manifest_mismatch'],
    ['incorrect fingerprint', () => Response.json({ ...manifestFor([article()]), fingerprint: 'a'.repeat(64) }), 'manifest_mismatch'],
    ['network failure', () => { throw new Error('private connection detail'); }, 'manifest_network_error'],
  ] as const)('does not confirm a manifest with %s', async (_label, response, failureCode) => {
    const item = article(); const fetcher = mockSite([item], { '/editorial-manifest.json': response });
    const report = await verifyEditorialPublication({ host: 'https://levois.fr/', manifest: manifestFor([item]), articles: [item], now, fetcher, credentials: {} });
    expect(report).toMatchObject({ deploymentState: 'failed', verifiedAt: null });
    expect(report.receipts[0]).toMatchObject({ deploymentState: 'failed', verifiedAt: null, socialReady: false, failureCode });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(report)).not.toContain('private connection detail');
  });

  it.each([
    ['Access login with 200', () => new Response('<html><head><title>Access</title></head><body><h1>Sign in</h1></body></html>', { headers: { 'Content-Type': 'text/html' } }), 'article_identity_mismatch'],
    ['wrong canonical', () => new Response(htmlFor(article()).replace('https://levois.fr/', 'https://other.example/'), { headers: { 'Content-Type': 'text/html' } }), 'article_identity_mismatch'],
    ['stale revision marker', () => new Response(htmlFor(article()).replace('content="1"', 'content="2"'), { headers: { 'Content-Type': 'text/html' } }), 'article_identity_mismatch'],
    ['404', () => new Response('Not found', { status: 404 }), 'article_http_404'],
    ['JSON in place of HTML', () => Response.json({ ok: true }), 'article_not_html'],
    ['network failure', () => { throw new Error('secret diagnostic'); }, 'article_network_error'],
    ['redirect response', () => new Response(null, { status: 302, headers: { location: 'https://attacker.example/' } }), 'article_http_302'],
  ] as const)('refuses an article with %s despite a correct manifest', async (_label, response, failureCode) => {
    const item = article(); const fetcher = mockSite([item], { [`/ressources/${item.slug}/`]: response });
    const report = await verifyEditorialPublication({ host: 'https://levois.fr/', manifest: manifestFor([item]), articles: [item], now, fetcher, credentials: {} });
    expect(report.receipts[0]).toMatchObject({ deploymentState: 'failed', verifiedAt: null, socialReady: false, failureCode, evidence: { manifest: true } });
    expect(JSON.stringify(report)).not.toContain('secret diagnostic');
  });

  it('keeps partial evidence but defers all social distribution until the verification pass succeeds', async () => {
    const articles = [article('001'), article('002')];
    const report = await verifyEditorialPublication({ host: 'https://levois.fr/', manifest: manifestFor(articles), articles, now, credentials: {}, fetcher: mockSite(articles, { [`/ressources/${articles[1].slug}/`]: () => new Response('Not found', { status: 404 }) }) });
    expect(report.deploymentState).toBe('failed');
    expect(report.receipts[0]).toMatchObject({ deploymentState: 'verified', verifiedAt, socialReady: false });
    expect(report.receipts[1]).toMatchObject({ deploymentState: 'failed', verifiedAt: null, socialReady: false });
  });

  it('retries the same identity and revision read-only without creating an article or a deployment', async () => {
    const item = article(); const snapshot = JSON.stringify(item); const fetcher = mockSite([item]);
    const args = { host: 'https://levois.fr/', manifest: manifestFor([item]), articles: [item], now, credentials: {}, fetcher };
    const first = await verifyEditorialPublication(args); const retry = await verifyEditorialPublication(args);
    expect(retry).toEqual(first);
    expect(JSON.stringify(item)).toBe(snapshot);
    expect(fetcher.mock.calls.every(([, options]) => options?.method === 'GET')).toBe(true);
  });

  it('rejects inconsistent expected sources before sending a single request', async () => {
    const item = article(); const fetcher = mockSite([item]);
    await expect(verifyEditorialPublication({ host: 'https://levois.fr/', manifest: manifestFor([item]), articles: [{ ...item, title: 'A changed payload' }], now, credentials: {}, fetcher })).rejects.toThrow(/Empreinte/);
    await expect(verifyEditorialPublication({ host: 'https://levois.fr/', manifest: manifestFor([item]), articles: [], now, credentials: {}, fetcher })).rejects.toThrow(/contenu source/);
    await expect(verifyEditorialPublication({ host: 'https://levois.fr/', manifest: manifestFor([item]), articles: [item], now, credentials: { CF_ACCESS_CLIENT_SECRET: 'test-only-secret' }, fetcher })).rejects.toThrow(/ensemble/);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('gives no social confirmation for an empty catalogue', async () => {
    const report = await verifyEditorialPublication({ host: 'https://levois.fr/', manifest: manifestFor([]), articles: [], now, credentials: {}, fetcher: mockSite([]) });
    expect(report.receipts).toEqual([]);
  });
});

describe('preuve HTML conforme au contenu visible', () => {
  it('compares the visible heading after whitespace and entity decoding', () => {
    const item = article();
    const html = htmlFor(item).replace('Vendre &amp; acheter', 'Vendre &#38; <span>acheter</span>');
    expect(Object.values(inspectEditorialHtml(html, item))).toEqual([true, true, true, true]);
  });

  it('does not treat markers or headings inside scripts, comments and templates as publication evidence', () => {
    const item = article();
    for (const wrap of [(text: string) => `<script>${text}</script>`, (text: string) => `<!--${text}-->`, (text: string) => `<template>${text}</template>`]) {
      const proof = inspectEditorialHtml(wrap(htmlFor(item)) + '<html><head></head><body>Access login</body></html>', item);
      expect(Object.values(proof).every((value) => value === false)).toBe(true);
    }
  });

  it('rejects duplicate identity metadata and multiple page titles', () => {
    const item = article();
    expect(inspectEditorialHtml(htmlFor(item).replace('</head>', `<meta name="levois:topic-id" content="${item.topicId}"></head>`), item).id).toBe(false);
    expect(inspectEditorialHtml(htmlFor(item).replace('</body>', '<h1>Another page</h1></body>'), item).title).toBe(false);
  });
});

describe('orchestration de vérification sans second déploiement', () => {
  it('keeps verification independent from deploy and preserves receipts even when a check fails', () => {
    const workflow = readFileSync(new URL('../../../.github/workflows/editorial-schedule.yml', import.meta.url), 'utf8');
    expect(workflow).toContain("needs.plan.outputs.should_build == 'false' || needs.deploy.result == 'success'");
    expect(workflow).toContain('--from-catalog --output artifacts/editorial-publication/receipts.json');
    expect(workflow).toContain('name: editorial-publication-receipts-${{ needs.plan.outputs.target }}-${{ github.run_id }}-${{ github.run_attempt }}');
    expect(workflow).toContain('if: always()\n        uses: actions/upload-artifact@v4');
    expect(workflow).toContain("vars.LEVOIS_EDITORIAL_SCHEDULE_ENABLED == 'true'");
    expect(workflow).toContain('[ "$PRODUCTION_ENABLED" = \'true\' ]');
    expect(workflow).toContain('[ "$SOURCE_BRANCH" = \'main\' ]');
  });
});
