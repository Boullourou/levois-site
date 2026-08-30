import posthog from 'posthog-js/dist/module.slim';
import {
  cleanPath,
  isAuditEvent,
  isFormResultEvent,
  journeyForPath,
  linkPlacement,
  safeAuditProperties,
  safeFormResultProperties,
  sanitizeAutomaticProperties,
} from '../lib/analytics';
import {
  ATTRIBUTION_STORAGE_KEY,
  attributionFromVisit,
  mergeAttribution,
  parseStoredAttribution,
} from '../lib/attribution';

const config = document.querySelector<HTMLElement>('[data-levois-analytics]');
const token = config?.dataset.token?.trim();
const apiHost = config?.dataset.host?.trim() || 'https://eu.i.posthog.com';
const consentKey = 'levois_analytics_consent_v1';
const legacyOptOutKey = 'levois_analytics_opt_out';
const globalPrivacyControl = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;

type AnalyticsConsent = 'accepted' | 'refused' | 'unset';

function readConsent(): AnalyticsConsent {
  if (globalPrivacyControl) return 'refused';
  try {
    if (localStorage.getItem(legacyOptOutKey) === '1') return 'refused';
    const value = localStorage.getItem(consentKey);
    return value === 'accepted' || value === 'refused' ? value : 'unset';
  } catch {
    return 'refused';
  }
}

function writeConsent(value: Exclude<AnalyticsConsent, 'unset'>) {
  try {
    localStorage.setItem(consentKey, value);
    if (value === 'refused') localStorage.setItem(legacyOptOutKey, '1');
    else localStorage.removeItem(legacyOptOutKey);
  } catch {
    // Sans stockage de la préférence, la mesure reste désactivée.
  }
}

try {
  const current = attributionFromVisit(window.location.href, document.referrer);
  const first = parseStoredAttribution(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY));
  sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(mergeAttribution(first, current)));
} catch {
  // L'attribution bornée est facultative et n'empêche jamais la navigation.
}

function setPreferenceStatus() {
  const preference = readConsent();
  document.querySelectorAll<HTMLElement>('[data-analytics-status]').forEach((node) => {
    node.textContent = !token
      ? 'La mesure d’audience n’est pas active sur ce site.'
      : globalPrivacyControl
      ? 'La mesure d’audience est désactivée par votre signal de confidentialité.'
      : preference === 'accepted'
      ? 'La mesure d’audience est activée avec votre accord sur cet appareil.'
      : preference === 'refused'
      ? 'La mesure d’audience est refusée sur cet appareil.'
      : 'La mesure d’audience reste désactivée tant que vous ne l’acceptez pas.';
  });
  document.querySelectorAll<HTMLButtonElement>('[data-analytics-accept]').forEach((button) => {
    button.disabled = !token || globalPrivacyControl || preference === 'accepted';
  });
  document.querySelectorAll<HTMLButtonElement>('[data-analytics-refuse]').forEach((button) => {
    button.disabled = globalPrivacyControl || preference === 'refused';
  });
}

document.addEventListener('click', (event) => {
  const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-analytics-accept], [data-analytics-refuse]');
  if (!button) return;
  if (button.matches('[data-analytics-accept]')) {
    writeConsent('accepted');
    window.location.reload();
  } else {
    const wasActive = readConsent() === 'accepted';
    writeConsent('refused');
    // En mode cookieless "always", PostHog ignore opt_out_capturing(). Le
    // rechargement détruit donc l'instance après que le garde de capture a été
    // fermé ; aucun événement de sortie n'est émis pendant ce rechargement.
    if (token && wasActive) {
      window.location.reload();
      return;
    }
    setPreferenceStatus();
  }
});

setPreferenceStatus();

if (token && readConsent() === 'accepted' && !globalPrivacyControl) {
  posthog.init(token, {
    api_host: apiHost,
    ui_host: 'https://eu.posthog.com',
    defaults: '2026-05-30',
    cookieless_mode: 'always',
    person_profiles: 'never',
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: false,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_heatmaps: false,
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    respect_dnt: true,
    mask_all_text: true,
    mask_all_element_attributes: true,
    before_send(event) {
      if (!event?.properties) return event;
      event.properties = sanitizeAutomaticProperties(event.properties, window.location.pathname);
      return event;
    },
  });

  const capture = (event: string, properties: Record<string, unknown> = {}) => {
    if (readConsent() !== 'accepted' || globalPrivacyControl) return;
    posthog.capture(event, {
      ...properties,
      page_path: cleanPath(window.location.pathname),
      journey: journeyForPath(window.location.pathname),
    });
  };

  window.addEventListener('levois:audit', (rawEvent) => {
    const detail = (rawEvent as CustomEvent<Record<string, unknown>>).detail ?? {};
    if (!isAuditEvent(detail.event)) return;
    capture(detail.event, safeAuditProperties(detail.event, detail));
  });

  window.addEventListener('levois:form-result', (rawEvent) => {
    const detail = (rawEvent as CustomEvent<Record<string, unknown>>).detail ?? {};
    if (!isFormResultEvent(detail.event)) return;
    capture(detail.event, safeFormResultProperties(detail));
  });

  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    let destination: URL;
    try {
      destination = new URL(href, window.location.href);
    } catch {
      return;
    }
    const isInternal = destination.origin === window.location.origin;
    capture('levois_navigation_clicked', {
      placement: linkPlacement(link),
      link_type: isInternal ? 'internal' : destination.protocol.replace(':', ''),
      destination_path: isInternal ? cleanPath(destination.pathname) : destination.hostname,
    });
  });

  const startedForms = new WeakSet<HTMLFormElement>();
  document.addEventListener('input', (event) => {
    const form = (event.target as Element | null)?.closest<HTMLFormElement>('form');
    if (!form || startedForms.has(form)) return;
    startedForms.add(form);
    capture('levois_form_started', { form_name: form.dataset.analyticsForm || cleanPath(window.location.pathname) });
  });
  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement | null;
    if (!form?.matches('form')) return;
    capture('levois_form_attempted', { form_name: form.dataset.analyticsForm || cleanPath(window.location.pathname) });
  });

  let activeMilliseconds = 0;
  let activeSince = performance.now();
  let active = document.visibilityState === 'visible' && document.hasFocus();
  let maxScrollPercent = 0;
  const isActive = () => document.visibilityState === 'visible' && document.hasFocus();
  const accrueActiveTime = () => {
    const now = performance.now();
    if (active) activeMilliseconds += Math.max(0, now - activeSince);
    active = isActive();
    activeSince = now;
  };
  const updateScroll = () => {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    const percent = available <= 0 ? 100 : Math.round((window.scrollY / available) * 100);
    maxScrollPercent = Math.max(maxScrollPercent, Math.min(100, percent));
  };

  window.addEventListener('focus', accrueActiveTime);
  window.addEventListener('blur', accrueActiveTime);
  document.addEventListener('visibilitychange', accrueActiveTime);
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  let engagementSent = false;
  const sendEngagement = () => {
    if (engagementSent) return;
    engagementSent = true;
    accrueActiveTime();
    updateScroll();
    capture('levois_page_engagement', {
      active_seconds: Math.round(activeMilliseconds / 1000),
      max_scroll_percent: maxScrollPercent,
      exit_path: cleanPath(window.location.pathname),
    });
  };
  window.addEventListener('pagehide', sendEngagement, { once: true });
}
