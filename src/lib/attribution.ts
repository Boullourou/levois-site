import { safePublicPath } from './safe-path';

export interface SafeAttribution {
  source?: string;
  medium?: string;
  referrerHost?: string;
  entryPath: string;
}

export const ATTRIBUTION_STORAGE_KEY = 'levois_attribution_v1';

function token(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9._/-]{0,79}$/.test(normalized) && !/\d{7,}/.test(normalized)
    ? normalized
    : undefined;
}

function host(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase().replace(/\.$/, '');
  if (!normalized || !/^[a-z0-9.-]+$/.test(normalized)) return undefined;
  try {
    return new URL(`https://${normalized}`).hostname === normalized ? normalized : undefined;
  } catch {
    return undefined;
  }
}

function path(value: unknown): string {
  return safePublicPath(value);
}

export function attributionFromVisit(current: string, referrer = ''): SafeAttribution {
  const url = new URL(current, 'https://levois.fr');
  let referrerHost: string | undefined;
  if (referrer) {
    try {
      const referrerUrl = new URL(referrer);
      if (referrerUrl.origin !== url.origin) referrerHost = host(referrerUrl.hostname);
    } catch {
      // Un référent invalide est ignoré ; sa valeur brute n'est jamais conservée.
    }
  }

  return {
    source: token(url.searchParams.get('src') || url.searchParams.get('utm_source')),
    medium: token(url.searchParams.get('utm_medium')),
    referrerHost,
    entryPath: path(url.pathname),
  };
}

export function parseStoredAttribution(value: string | null): SafeAttribution | undefined {
  if (!value) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
    const item = parsed as Record<string, unknown>;
    return {
      source: token(item.source),
      medium: token(item.medium),
      referrerHost: host(item.referrerHost),
      entryPath: path(item.entryPath),
    };
  } catch {
    return undefined;
  }
}

export function mergeAttribution(
  first: SafeAttribution | undefined,
  current: SafeAttribution,
): SafeAttribution {
  return {
    source: first?.source || current.source,
    medium: first?.medium || current.medium,
    referrerHost: first?.referrerHost || current.referrerHost,
    entryPath: first?.entryPath || current.entryPath,
  };
}
