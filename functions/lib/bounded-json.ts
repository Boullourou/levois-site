export const MAX_JSON_BODY_BYTES = 64 * 1024;

export class PayloadTooLargeError extends Error {
  constructor() {
    super('PAYLOAD_TOO_LARGE');
    this.name = 'PayloadTooLargeError';
  }
}

export async function readBoundedJson(
  request: Request,
  maxBytes = MAX_JSON_BODY_BYTES,
): Promise<unknown> {
  const declared = request.headers.get('content-length');
  if (declared && /^\d+$/.test(declared) && Number(declared) > maxBytes) {
    throw new PayloadTooLargeError();
  }

  if (!request.body) return JSON.parse(await request.text());

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let raw = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new PayloadTooLargeError();
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(raw);
}
