import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import type { CockpitEnv } from '../cockpit/security';

export interface ExperienceEnv extends CockpitEnv {
  RECHERCHE_DB?: D1Database;
  RESEND_API_KEY?: string;
  LEAD_TO_EMAIL?: string;
  LEAD_FROM_EMAIL?: string;
  LEAD_TO?: string;
  LEAD_FROM?: string;
  FORMSPREE_ENDPOINT?: string;
  RATE_LIMIT?: KVNamespace;
  EXPERIENCE_ACCESS_SECRET?: string;
  EXPERIENCE_PUBLIC_ORIGIN?: string;
}

export interface ExperienceContext { request: Request; env: ExperienceEnv }
export class ExperienceError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: {
    'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store, max-age=0',
    'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex, nofollow, noarchive',
    'referrer-policy': 'no-referrer',
  } });
}

export function failure(error: unknown): Response {
  if (error instanceof ExperienceError) return json({ ok: false, code: error.code, message: error.message }, error.status);
  return json({ ok: false, code: 'SERVICE_UNAVAILABLE', message: 'Le service est momentanément indisponible. Votre lecture reste disponible : vous pouvez la garder ou réessayer.' }, 503);
}

export function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function invalid(message = 'Vérifiez les informations avant de transmettre.'): never {
  throw new ExperienceError(400, 'INVALID_INPUT', message);
}
export function string(value: unknown, maximum: number, required = false): string {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || value.length > maximum || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) invalid();
  if (required && !value.trim()) invalid();
  return value;
}
export function line(value: unknown, maximum: number, required = false): string {
  const text = string(value, maximum, required).trim();
  if (/[\r\n]/.test(text)) invalid();
  return text;
}
export function email(value: unknown): string {
  const address = line(value, 254, true).toLowerCase();
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/.test(address)) invalid('Indiquez une adresse e-mail complète.');
  return address;
}
export function uuid(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value)) invalid();
  return value.toLowerCase();
}
export function isoDate(value: unknown): string {
  if (typeof value !== 'string' || value.length > 32 || !/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) invalid();
  return value;
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (request.method !== 'POST') throw new ExperienceError(405, 'METHOD_NOT_ALLOWED', 'Cette action utilise une demande POST.');
  const origin = request.headers.get('origin');
  if (origin !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new ExperienceError(403, 'ORIGIN_INVALID', 'Cette demande doit partir du site LEVOIS.');
  }
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? '')) {
    throw new ExperienceError(415, 'CONTENT_TYPE_INVALID', 'Une demande JSON est attendue.');
  }
  const maxBytes = 100_000;
  if (Number(request.headers.get('content-length')) > maxBytes) throw new ExperienceError(413, 'PAYLOAD_TOO_LARGE', 'La lecture transmise est trop volumineuse.');
  const reader = request.body?.getReader();
  if (!reader) invalid();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new ExperienceError(413, 'PAYLOAD_TOO_LARGE', 'La lecture transmise est trop volumineuse.');
      }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { invalid('La demande est illisible. Vous pouvez réessayer depuis votre lecture.'); }
  if (!object(parsed)) invalid();
  return parsed;
}

export function validateContext(value: unknown): Record<string, unknown> {
  if (!object(value) || value.schemaVersion !== 1 || !['buyer', 'seller', 'transition', 'local', 'audit'].includes(String(value.project))) invalid('La version de cette lecture n’est pas reconnue.');
  line(value.id, 128, true);
  if (!Number.isSafeInteger(value.revision) || Number(value.revision) < 0) invalid();
  isoDate(value.createdAt); isoDate(value.updatedAt);
  if (!object(value.entry) || !object(value.answers)) invalid();
  for (const answer of Object.values(value.answers)) {
    if (!object(answer) || !['declared', 'imported', 'confirmed'].includes(String(answer.provenance))) invalid();
    const answerValue = answer.value;
    if (!(answerValue === null || typeof answerValue === 'string' || (typeof answerValue === 'number' && Number.isFinite(answerValue)) || (Array.isArray(answerValue) && answerValue.every(item => typeof item === 'string')))) invalid();
    isoDate(answer.updatedAt);
    if (!Number.isSafeInteger(answer.revision) || Number(answer.revision) < 1) invalid();
  }
  // The domain object remains a visitor-approved snapshot, never a verified professional record.
  let count = 0;
  function bounded(item: unknown, depth: number): void {
    if (++count > 2500 || depth > 14) invalid('La lecture transmise est trop complexe.');
    if (typeof item === 'string') string(item, 24_000);
    else if (Array.isArray(item)) item.forEach(child => bounded(child, depth + 1));
    else if (object(item)) {
      for (const [key, child] of Object.entries(item)) {
        if (['__proto__', 'prototype', 'constructor'].includes(key) || key.length > 128) invalid();
        bounded(child, depth + 1);
      }
    } else if (!(item === null || typeof item === 'boolean' || typeof item === 'number')) invalid();
  }
  bounded(value, 0);
  if (new TextEncoder().encode(JSON.stringify(value)).byteLength > 65_000) invalid('La lecture transmise est trop volumineuse.');
  return value;
}

export function database(env: ExperienceEnv): D1Database {
  if (!env.RECHERCHE_DB) throw new ExperienceError(503, 'STORAGE_UNAVAILABLE', 'L’enregistrement est indisponible. Gardez votre lecture ; vous pouvez contacter Mouaad directement.');
  return env.RECHERCHE_DB;
}
export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
export function randomToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
}
export function secret(env: ExperienceEnv): string {
  const key = env.EXPERIENCE_ACCESS_SECRET;
  if (!key || key.length < 32) throw new ExperienceError(503, 'ACCESS_UNAVAILABLE', 'La reprise protégée est momentanément indisponible. Votre parcours autonome reste accessible.');
  return key;
}
export async function codeHash(tokenHash: string, code: string, env: ExperienceEnv): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret(env)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${tokenHash}:${code}`));
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
}

// These bounded counters hold no content or address. KV, when bound, shares the
// technical limit across isolates; the fallback is deliberately best effort.
const recent = new Map<string, { count: number; expires: number }>();
export async function rateLimit(request: Request, env: ExperienceEnv, scope: string): Promise<void> {
  const now = Date.now();
  const window = Math.floor(now / 600_000);
  const key = `experience:rate:${scope}:${await sha256(`${request.headers.get('cf-connecting-ip') ?? 'unknown'}:${window}`)}`;
  if (env.RATE_LIMIT) {
    const current = Number(await env.RATE_LIMIT.get(key) ?? '0');
    if (current >= 5) throw new ExperienceError(429, 'RATE_LIMITED', 'Plusieurs demandes viennent d’être faites. Patientez quelques minutes ; votre lecture reste disponible.');
    await env.RATE_LIMIT.put(key, String(current + 1), { expirationTtl: 660 });
  } else {
    for (const [stored, entry] of recent) if (entry.expires <= now) recent.delete(stored);
    const entry = recent.get(key) ?? { count: 0, expires: now + 600_000 };
    if (entry.count >= 5) throw new ExperienceError(429, 'RATE_LIMITED', 'Plusieurs demandes viennent d’être faites. Patientez quelques minutes ; votre lecture reste disponible.');
    if (recent.size >= 10_000) recent.delete(recent.keys().next().value!);
    entry.count += 1; recent.set(key, entry);
  }
}

export function sameHash(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}
export interface Mail { to: string; subject: string; text: string; replyTo?: string }
export type MailResult = { state: 'sent' | 'failed' | 'unknown' | 'unavailable'; provider?: 'resend' | 'formspree' };
export async function sendMail(env: ExperienceEnv, mail: Mail, idempotencyKey: string, humanFallback = false): Promise<MailResult> {
  const from = env.LEAD_FROM_EMAIL || env.LEAD_FROM || 'LEVOIS <contact@levois.fr>';
  if (env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(12_000), redirect: 'manual',
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json', 'idempotency-key': idempotencyKey },
        body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, text: mail.text, ...(mail.replyTo ? { reply_to: mail.replyTo } : {}) }),
      });
      await response.body?.cancel();
      if (response.status >= 300 && response.status < 400) return { state: 'failed', provider: 'resend' };
      return { state: response.ok ? 'sent' : response.status >= 500 ? 'unknown' : 'failed', provider: 'resend' };
    } catch { return { state: 'unknown', provider: 'resend' }; }
  }
  if (!humanFallback) return { state: 'unavailable' };
  const endpoint = env.FORMSPREE_ENDPOINT || 'https://formspree.io/f/xnjynroj';
  let destination: URL;
  try { destination = new URL(endpoint); } catch { return { state: 'unavailable' }; }
  if (destination.protocol !== 'https:' || destination.hostname !== 'formspree.io') return { state: 'unavailable' };
  try {
    const response = await fetch(destination.href, {
      method: 'POST', signal: AbortSignal.timeout(12_000), redirect: 'manual',
      headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({ _subject: mail.subject, message: mail.text, ...(mail.replyTo ? { email: mail.replyTo } : {}) }).toString(),
    });
    await response.body?.cancel();
    if (response.status >= 300 && response.status < 400) return { state: 'failed', provider: 'formspree' };
    return { state: response.ok ? 'sent' : response.status >= 500 ? 'unknown' : 'failed', provider: 'formspree' };
  } catch { return { state: 'unknown', provider: 'formspree' }; }
}
