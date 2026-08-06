export const AUDIT_EVENTS = [
  'audit_started',
  'audit_url_readable',
  'audit_url_blocked',
  'audit_stage_identified',
  'audit_result_viewed',
  'audit_resource_clicked',
  'audit_human_requested',
] as const;

export type AuditEventName = (typeof AUDIT_EVENTS)[number];
export type Journey = 'listing_live' | 'seller_future' | 'buyer' | 'prescriber' | 'team_candidate' | 'brand';

const auditEventSet = new Set<string>(AUDIT_EVENTS);

export function isAuditEvent(value: unknown): value is AuditEventName {
  return typeof value === 'string' && auditEventSet.has(value);
}

export function cleanPath(value: string): string {
  try {
    const url = new URL(value, 'https://levois.fr');
    const path = url.pathname.replace(/\/{2,}/g, '/');
    return path === '/' ? '/' : path.replace(/\/$/, '');
  } catch {
    return '/';
  }
}

export function cleanAnalyticsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  try {
    const url = new URL(value, 'https://levois.fr');
    return `${url.origin}${cleanPath(url.pathname)}`;
  } catch {
    return undefined;
  }
}

export function journeyForPath(value: string): Journey {
  const path = cleanPath(value);
  if (path === '/audit-annonce') return 'listing_live';
  if (path === '/situer-ma-vente' || path.startsWith('/situer-ma-vente/') || path === '/votre-rue') {
    return 'seller_future';
  }
  if (path === '/ma-recherche' || path.startsWith('/ma-recherche/')) return 'buyer';
  if (path === '/recommander' || path.startsWith('/recommander/')) return 'prescriber';
  if (path === '/rejoindre' || path.startsWith('/rejoindre/')) return 'team_candidate';
  return 'brand';
}

function shortLabel(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().replace(/\s+/g, ' ').slice(0, 120);
  return normalized || undefined;
}

export function safeAuditProperties(
  event: AuditEventName,
  detail: Record<string, unknown>,
): Record<string, string> {
  const safe: Record<string, string> = {};

  if (event === 'audit_url_readable' || event === 'audit_url_blocked') {
    const source = shortLabel(detail.source);
    if (source) safe.source = source;
  }

  if (event === 'audit_stage_identified') {
    const signal = shortLabel(detail.signal);
    if (signal) safe.signal = signal;
  }

  if (event === 'audit_result_viewed' || event === 'audit_human_requested') {
    const result = shortLabel(detail.result);
    if (result) safe.result = result;
  }

  if (event === 'audit_resource_clicked') {
    const href = typeof detail.href === 'string' ? cleanPath(detail.href) : undefined;
    if (href) safe.destination_path = href;
  }

  return safe;
}

export function linkPlacement(element: Element): string {
  if (element.closest('header')) return 'header';
  if (element.closest('footer')) return 'footer';
  if (element.closest('nav')) return 'navigation';
  return 'content';
}
