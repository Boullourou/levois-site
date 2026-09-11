import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

// Same date/flags as Pages Production, verified on 2026-09-11.
// Execute the real sendMail in workerd. Only the external provider is simulated;
// native Request, Response and the real 12-second AbortSignal remain in use.
let runtime: Miniflare;
beforeAll(async () => {
  const bundle = await build({
    stdin: { resolveDir: process.cwd(), sourcefile: 'mail-runtime-probe.ts', contents: `
      import { sendMail } from './functions/_lib/experience/common';
      export default { async fetch(incoming) {
        const { provider, scenario } = await incoming.json();
        let calls = 0, mode, timeoutObserved = false, rejectsLegacyMode = false;
        try { new Request('https://example.test', {redirect:'error'}); }
        catch { rejectsLegacyMode = true; }
        const originalFetch = globalThis.fetch;
        globalThis.fetch = async (input, init) => {
          calls++;
          const request = new Request(input, init);
          mode = request.redirect;
          if (scenario === 'network') throw new TypeError('Simulated network failure');
          if (scenario === 'timeout') return new Promise((resolve, reject) => {
            request.signal.addEventListener('abort', () => {
              timeoutObserved = true; reject(request.signal.reason);
            }, {once:true});
          });
          const status = Number(scenario);
          return new Response(status === 204 || status === 304 ? null : '{}', {
            status, headers: status >= 300 && status < 400
              ? {location:'https://must-never-be-followed.invalid/'} : {}
          });
        };
        try {
          const env = provider === 'resend'
            ? {RESEND_API_KEY:'fixture-only-not-a-key'}
            : {FORMSPREE_ENDPOINT:'https://formspree.io/f/fixture'};
          const result = await sendMail(env, {
            to:'fixture@example.test',subject:'Fixture',text:'Fictional runtime test'
          }, 'fixture-idempotency', true);
          return Response.json({result,calls,mode,timeoutObserved,rejectsLegacyMode});
        } finally { globalThis.fetch = originalFetch; }
      }};
    ` },
    bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022',
  });
  runtime = new Miniflare(convertV4MiniflareOptions({
    modules: true, script: bundle.outputFiles[0].text,
    compatibilityDate: '2026-06-05', compatibilityFlags: [],
    // Defense in depth: no external network, credentials, or remote bindings.
    outboundService: () => { throw new Error('Unexpected external request'); },
  }));
  await runtime.ready;
}, 30_000);
afterAll(async () => { await runtime?.dispose(); });

it('interdit le retour du mode incompatible dans le transport e-mail', () => {
  const source = readFileSync('functions/_lib/experience/common.ts', 'utf8');
  expect(source).not.toMatch(/redirect\s*:\s*['"]error['"]/);
});

for (const provider of ['resend', 'formspree']) describe(provider + ' dans workerd', () => {
  it.each([
    ['200','sent'], ['204','sent'], ['301','failed'], ['302','failed'],
    ['303','failed'], ['304','failed'], ['307','failed'], ['308','failed'],
    ['400','failed'], ['429','failed'], ['500','unknown'], ['503','unknown'],
    ['network','unknown'], ['timeout','unknown'],
  ])('%s : %s, un seul appel sans redirection ni retry', async (scenario, state) => {
    const response = await runtime.dispatchFetch('http://localhost/', {
      method: 'POST', body: JSON.stringify({provider, scenario}),
    });
    expect(response.status).toBe(200);
    const result = await response.json() as any;
    expect(result).toMatchObject({
      result: {state, provider}, calls: 1, mode: 'manual', rejectsLegacyMode: true,
      timeoutObserved: scenario === 'timeout',
    });
  }, 20_000);
});