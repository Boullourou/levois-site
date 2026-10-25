import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

// Real Pages action + native D1 SQLite in workerd. Only the provider boundary
// is simulated. No production credentials, bindings or network are available.
let runtime: Miniflare;
let database: Awaited<ReturnType<Miniflare['getD1Database']>>;
let scenario: 'success' | 'copy-refused-once' | 'concurrent' | 'uncertain' = 'success';
let sequence = 0;
let messages: { to: string; key: string | null; savedBeforeSend: number }[] = [];

function payload() {
  const now = new Date().toISOString();
  return {
    requestId: crypto.randomUUID(), action: 'synthesis-email', channel: 'email',
    email: 'visitor@example.test', approved: true,
    synthesis: 'Synthèse fictive : vérifier le budget cette semaine.',
    consent: { purpose: 'synthesis', textVersion: '2026-10-25', acceptedAt: now },
    context: {
      schemaVersion: 1, id: crypto.randomUUID(), revision: 1, project: 'buyer',
      createdAt: now, updatedAt: now, entry: { door: 'direct', source: null, promise: null },
      answers: { buyer_budget: { value: 'unclear', provenance: 'declared', revision: 1, updatedAt: now } },
    },
  };
}

async function request(input: ReturnType<typeof payload>) {
  const response = await runtime.dispatchFetch('https://levois.test/api/experience/actions', {
    method: 'POST', headers: {
      origin: 'https://levois.test', 'content-type': 'application/json',
      'cf-connecting-ip': `local-synthesis-fixture-${++sequence}`,
    }, body: JSON.stringify(input),
  });
  expect(response.status).toBe(200);
  return response.json() as Promise<Record<string, unknown>>;
}

beforeAll(async () => {
  const bundle = await build({
    stdin: { resolveDir: process.cwd(), sourcefile: 'synthesis-runtime-probe.ts', contents: `
      import { onRequest } from './functions/api/experience/actions';
      export default { fetch(request, env) { return onRequest({request, env}); } };
    ` },
    bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022',
  });
  runtime = new Miniflare(convertV4MiniflareOptions({
    modules: true, script: bundle.outputFiles[0].text,
    compatibilityDate: '2026-06-05', compatibilityFlags: [],
    d1Databases: { RECHERCHE_DB: 'isolated-synthesis-fixtures' },
    bindings: {
      RESEND_API_KEY: 'fixture-not-a-live-credential',
      LEAD_FROM_EMAIL: 'LEVOIS fixture <sender@example.test>', LEAD_TO_EMAIL: 'advisor@example.test',
    },
    outboundService: async request => {
      if (request.url !== 'https://api.resend.com/emails' || request.method !== 'POST') {
        throw new Error('External network forbidden in this integration test.');
      }
      const body = await request.json() as { to: string[] };
      if (body.to.length !== 1 || !['visitor@example.test', 'advisor@example.test'].includes(body.to[0])) {
        throw new Error('A fictional recipient is required.');
      }
      const saved = await database.prepare('SELECT count(*) AS n FROM experience_email_leads').first<{ n: number }>();
      messages.push({ to: body.to[0], key: request.headers.get('idempotency-key'), savedBeforeSend: saved?.n || 0 });
      const copyAttempts = messages.filter(message => message.to === 'visitor@example.test').length;
      // Keep the claimed sends in flight while the duplicate requests arrive.
      if (scenario === 'concurrent') await new Promise(resolve => setTimeout(resolve, 200));
      const status = scenario === 'uncertain' ? 503
        : scenario === 'copy-refused-once' && body.to[0] === 'visitor@example.test' && copyAttempts === 1 ? 429 : 200;
      return new Response('{}', { status, headers: { 'content-type': 'application/json' } });
    },
  }));
  await runtime.ready;
  database = await runtime.getD1Database('RECHERCHE_DB');
  const statements = readFileSync('db/experience-email-leads.sql', 'utf8')
    .replace(/^--.*$/gm, '').split(';').map(statement => statement.trim()).filter(Boolean);
  // Execute the shipped additive DDL using native D1, including STRICT, JSON
  // checks, indexes and the actual conditional UPDATE ... RETURNING statements.
  for (const statement of statements) await database.prepare(statement).run();
  for (const statement of statements) await database.prepare(statement).run();
}, 30_000);

beforeEach(async () => {
  await database.prepare('DELETE FROM experience_email_leads').run();
  messages = []; scenario = 'success';
});
afterAll(async () => { await runtime?.dispose(); });

describe('Capture synthèse dans workerd et D1 réels', () => {
  it('enregistre avant les deux notifications simulées et conserve le consentement', async () => {
    const input = payload();
    expect(await request(input)).toMatchObject({ saved: true, copySent: true, advisorNotificationSent: true, requestId: input.requestId });
    expect(messages.map(message => message.to).sort()).toEqual(['advisor@example.test', 'visitor@example.test']);
    expect(messages.every(message => message.savedBeforeSend === 1)).toBe(true);
    const row = await database.prepare('SELECT * FROM experience_email_leads').first<Record<string, unknown>>();
    expect(row).toMatchObject({ id: input.requestId, copy_state: 'sent', advisor_state: 'sent', copy_attempts: 1, advisor_attempts: 1 });
    expect(JSON.parse(String(row?.consent_json))).toMatchObject({ purpose: 'synthesis', textVersion: '2026-10-25' });
    expect(JSON.parse(String(row?.context_json))).toEqual(input.context);
  }, 20_000);
  it('réessaie un refus sans nouveau dossier ni seconde notification à Mouaad', async () => {
    scenario = 'copy-refused-once'; const input = payload();
    expect(await request(input)).toMatchObject({ saved: true, copyState: 'failed', advisorNotificationState: 'sent' });
    expect(await request(input)).toMatchObject({ saved: true, copyState: 'sent', advisorNotificationState: 'sent' });
    expect(await database.prepare('SELECT count(*) AS n FROM experience_email_leads').first()).toMatchObject({ n: 1 });
    const copies = messages.filter(message => message.to === 'visitor@example.test');
    expect(copies).toHaveLength(2); expect(copies[0].key).toBe(copies[1].key);
    expect(messages.filter(message => message.to === 'advisor@example.test')).toHaveLength(1);
    expect(await database.prepare('SELECT copy_attempts,advisor_attempts FROM experience_email_leads').first()).toMatchObject({ copy_attempts: 2, advisor_attempts: 1 });
  }, 20_000);
  it('verrouille les demandes concurrentes sans double dossier ni double envoi', async () => {
    scenario = 'concurrent'; const input = payload();
    const results = await Promise.all([request(input), request(input), request(input)]);
    expect(results.every(result => result.saved === true && result.requestId === input.requestId)).toBe(true);
    expect(messages).toHaveLength(2);
    expect(await database.prepare('SELECT count(*) AS n FROM experience_email_leads').first()).toMatchObject({ n: 1 });
    expect(await request(input)).toMatchObject({ saved: true, copySent: true, advisorNotificationSent: true });
    expect(messages).toHaveLength(2);
  }, 20_000);
  it('conserve les envois incertains sans réémission automatique', async () => {
    scenario = 'uncertain'; const input = payload();
    expect(await request(input)).toMatchObject({ saved: true, copyState: 'unknown', advisorNotificationState: 'unknown' });
    expect(await request(input)).toMatchObject({ saved: true, copyState: 'unknown', advisorNotificationState: 'unknown' });
    expect(messages).toHaveLength(2);
    expect(await database.prepare('SELECT count(*) AS n FROM experience_email_leads').first()).toMatchObject({ n: 1 });
  }, 20_000);
});
