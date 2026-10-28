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
export type Journey = 'listing_live' | 'seller_future' | 'buyer' | 'prescriber' | 'team_candidate' | 'brand' | 'local' | 'transition';

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
  if (path === '/situer-ma-vente' || path.startsWith('/situer-ma-vente/')) {
    return 'seller_future';
  }
  if(path === '/votre-rue') return 'local';
  if(path === '/vendre-et-acheter') return 'transition';
  if(path === '/experiences/visites-sans-offre') return 'seller_future';
  if(path === '/experiences/surface-ou-usage') return 'buyer';
  if(path === '/experiences/vendre-avant-acheter') return 'transition';
  if (path === '/ma-recherche' || path.startsWith('/ma-recherche/')) return 'buyer';
  if (path === '/recommander' || path.startsWith('/recommander/')) return 'prescriber';
  if (path === '/rejoindre' || path.startsWith('/rejoindre/')) return 'team_candidate';
  return 'brand';
}

const auditSources = new Set(['SeLoger', 'Leboncoin', 'PAP', 'Bien’ici', 'Bienici', 'Autre']);

export function safeAuditProperties(
  event: AuditEventName,
  detail: Record<string, unknown>,
): Record<string, string> {
  const safe: Record<string, string> = {};

  if (event === 'audit_url_readable' || event === 'audit_url_blocked') {
    if (typeof detail.source === 'string' && auditSources.has(detail.source)) safe.source = detail.source;
  }

  if (event === 'audit_resource_clicked') {
    const href = typeof detail.href === 'string' ? cleanPath(detail.href) : undefined;
    if (href) safe.destination_path = href;
  }

  return safe;
}

export const JOURNEY_EVENTS = new Set([
  'journey_started', 'diagnostic_completed', 'capture_viewed', 'first_value_seen',
  'answer_corrected', 'reading_kept', 'reading_copy_requested', 'review_requested',
  'exchange_requested', 'journey_step_completed', 'journey_completed', 'result_viewed',
  'contact_consent_submitted', 'matching_consent_submitted', 'reading_consent_submitted',
  'synthesis_saved', 'synthesis_email_accepted', 'contact_message_accepted',
]);

/** Deliberately drops all labels, answers, IDs of requests and free text. */
export function safeJourneyProperties(detail: Record<string, unknown>): Record<string, string | number> {
  const safe: Record<string, string | number> = {};
  if (typeof detail.step === 'number' && Number.isInteger(detail.step) && detail.step >= 0 && detail.step <= 30) safe.step = detail.step;
  if (typeof detail.duration_seconds === 'number' && Number.isFinite(detail.duration_seconds)) safe.duration_seconds = Math.min(86400, Math.max(0, Math.round(detail.duration_seconds)));
  if (typeof detail.selected_journey === 'string' && ['buyer','seller','transition','local','audit','prescriber','team_candidate','brand'].includes(detail.selected_journey)) safe.selected_journey = detail.selected_journey;
  return safe;
}

export function linkPlacement(element: Element): string {
  if (element.closest('header')) return 'header';
  if (element.closest('footer')) return 'footer';
  if (element.closest('nav')) return 'navigation';
  return 'content';
}
