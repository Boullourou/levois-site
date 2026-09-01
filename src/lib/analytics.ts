import { safePublicPath } from './safe-path';

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

export const FORM_RESULT_EVENTS = [
  'levois_form_succeeded',
  'levois_form_failed',
] as const;

export type FormResultEventName = (typeof FORM_RESULT_EVENTS)[number];

const auditEventSet = new Set<string>(AUDIT_EVENTS);
const formResultEventSet = new Set<string>(FORM_RESULT_EVENTS);
const formNames = new Set(['contact', 'parcours', 'votre-rue', 'audit-annonce']);
const auditSignals = new Set([
  'peu-vues', 'vues-sans-contact', 'contacts-sans-visite', 'visites-sans-offre', 'offre-recue',
]);
const auditResults = new Map([
  ['Le premier problème est la visibilité.', 'visibility'],
  ['L’annonce est vue, mais ne déclenche pas de contact.', 'no-contact'],
  ['L’intérêt existe, mais ne devient pas une visite.', 'no-visit'],
  ['Le décrochage arrive après la visite.', 'post-visit'],
  ['L’annonce a déclenché une décision.', 'offer'],
  ['Il est encore tôt pour tirer une conclusion.', 'too-early'],
  ['Deux améliorations à tester en priorité.', 'two-priorities'],
]);

export function isAuditEvent(value: unknown): value is AuditEventName {
  return typeof value === 'string' && auditEventSet.has(value);
}

export function cleanPath(value: string): string {
  return safePublicPath(value);
}

export function cleanAnalyticsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  try {
    return `https://levois.fr${cleanPath(value)}`;
  } catch {
    return undefined;
  }
}

export function cleanReferrerUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  try {
    return new URL(value, 'https://levois.fr').origin;
  } catch {
    return undefined;
  }
}

export function isFormResultEvent(value: unknown): value is FormResultEventName {
  return typeof value === 'string' && formResultEventSet.has(value);
}

export function safeFormResultProperties(detail: Record<string, unknown>): Record<string, string> {
  const formName = typeof detail.form_name === 'string' ? detail.form_name.trim() : '';
  return formNames.has(formName) ? { form_name: formName } : {};
}

export function sanitizeAutomaticProperties(
  input: Record<string, unknown>,
  currentPath: string,
): Record<string, unknown> {
  const properties = { ...input };

  for (const key of ['$current_url', '$initial_current_url']) {
    const cleaned = cleanAnalyticsUrl(properties[key]);
    if (cleaned) properties[key] = cleaned;
    else delete properties[key];
  }
  for (const key of ['$referrer', '$initial_referrer']) {
    const cleaned = cleanReferrerUrl(properties[key]);
    if (cleaned) properties[key] = cleaned;
    else delete properties[key];
  }
  for (const key of Object.keys(properties)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('referring_domain')) {
      delete properties[key];
    } else if (lowerKey.includes('referrer')) {
      const cleaned = cleanReferrerUrl(properties[key]);
      if (cleaned) properties[key] = cleaned;
      else delete properties[key];
    } else if (lowerKey.includes('pathname')) {
      properties[key] = safePublicPath(properties[key]);
    } else if (lowerKey.includes('current_url') || lowerKey.endsWith('entry_url')) {
      const cleaned = cleanAnalyticsUrl(properties[key]);
      if (cleaned) properties[key] = cleaned;
      else delete properties[key];
    }

    if (/utm_|gclid|gclsrc|gbraid|wbraid|fbclid|msclkid|dclid|twclid|li_fat_id|igshid|ttclid|rdt_cid|epik|qclid|sccid|irclid|mc_(cid|eid)|gad_source|campaign|keyword|ph_keyword|_kx/i.test(key)) {
      delete properties[key];
    }
  }

  delete properties.$referring_domain;
  delete properties.$initial_referring_domain;
  properties.page_path = cleanPath(currentPath);
  properties.journey = journeyForPath(currentPath);
  return properties;
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
    safe.source = event === 'audit_url_readable' ? 'supported-portal' : 'unavailable-or-unconfirmed';
  }

  if (event === 'audit_stage_identified') {
    const signal = shortLabel(detail.signal);
    if (signal && auditSignals.has(signal)) safe.signal = signal;
  }

  if (event === 'audit_result_viewed' || event === 'audit_human_requested') {
    const result = shortLabel(detail.result);
    const bucket = result ? auditResults.get(result) : undefined;
    if (bucket) safe.result = bucket;
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
