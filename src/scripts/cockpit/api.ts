export class CockpitApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'CockpitApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type ApiEnvelope<T> = {
  data?: T;
  result?: T;
  error?: { code?: string; message?: string; details?: unknown } | string;
  message?: string;
};

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  idempotencyKey?: string;
  signal?: AbortSignal;
};

let csrfToken: string | undefined;
let csrfRequest: Promise<string> | undefined;

function tokenIsFresh(token: string): boolean {
  const expiresAt = Number(token.split('.', 1)[0]);
  return Number.isFinite(expiresAt) && expiresAt > Math.floor(Date.now() / 1000) + 60;
}

async function getCsrfToken(): Promise<string> {
  if (csrfToken && tokenIsFresh(csrfToken)) return csrfToken;
  if (!csrfRequest) {
    csrfRequest = requestJson<{ csrfToken?: string }>('/api/cockpit/session')
      .then((session) => {
        if (!session.csrfToken || !tokenIsFresh(session.csrfToken)) {
          throw new CockpitApiError('La session privée ne fournit pas de protection CSRF valide.', 503, 'CSRF_UNAVAILABLE');
        }
        csrfToken = session.csrfToken;
        return session.csrfToken;
      })
      .finally(() => { csrfRequest = undefined; });
  }
  return csrfRequest;
}

function makeIdempotencyKey(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `cockpit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const headers = new Headers({
    Accept: 'application/json',
    'X-Requested-With': 'LEVOIS-Cockpit',
  });

  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (method !== 'GET') {
    headers.set('Idempotency-Key', options.idempotencyKey ?? makeIdempotencyKey());
    headers.set('X-LEVOIS-CSRF', await getCsrfToken());
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new CockpitApiError('Impossible de joindre les données privées.', 0, 'NETWORK_ERROR');
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json() as ApiEnvelope<T>
    : undefined;

  if (!response.ok) {
    const apiError = payload?.error;
    const message = typeof apiError === 'object'
      ? apiError.message
      : typeof apiError === 'string'
        ? apiError
        : payload?.message;
    const code = typeof apiError === 'object' ? apiError.code : undefined;
    const details = typeof apiError === 'object' ? apiError.details : undefined;
    throw new CockpitApiError(message || `La requête a échoué (${response.status}).`, response.status, code, details);
  }

  if (payload === undefined) return undefined as T;
  if (payload.data !== undefined) return payload.data;
  if (payload.result !== undefined) return payload.result;
  return payload as T;
}

export async function requestText(path: string, options: RequestOptions = {}): Promise<{ text: string; filename?: string }> {
  const method = options.method ?? 'GET';
  const headers = new Headers({
    Accept: 'text/markdown, application/json;q=0.9, text/plain;q=0.8',
    'X-Requested-With': 'LEVOIS-Cockpit',
  });
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (method !== 'GET') {
    headers.set('Idempotency-Key', options.idempotencyKey ?? makeIdempotencyKey());
    headers.set('X-LEVOIS-CSRF', await getCsrfToken());
  }
  const response = await fetch(path, {
    method,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    headers,
    credentials: 'same-origin',
    cache: 'no-store',
    redirect: 'error',
    signal: options.signal,
  });
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok) {
    let message = `L’export a échoué (${response.status}).`;
    if (contentType.includes('application/json')) {
      const payload = await response.json() as ApiEnvelope<unknown>;
      const error = payload.error;
      message = typeof error === 'object' ? error.message || message : typeof error === 'string' ? error : payload.message || message;
    }
    throw new CockpitApiError(message, response.status, 'EXPORT_FAILED');
  }
  if (contentType.includes('application/json')) {
    const payload = await response.json() as ApiEnvelope<{ markdown?: string; text?: string; filename?: string }>;
    const data = payload.data ?? payload.result ?? payload as { markdown?: string; text?: string; filename?: string };
    return { text: data.markdown ?? data.text ?? '', filename: data.filename };
  }
  const disposition = response.headers.get('content-disposition');
  const filename = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)/i)?.[1];
  return { text: await response.text(), filename: filename ? decodeURIComponent(filename) : undefined };
}

export function withQuery(path: string, values: Record<string, string | boolean | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') query.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
  }
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}
