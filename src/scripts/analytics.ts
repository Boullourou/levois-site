import posthog from 'posthog-js/dist/module.slim';
import {
  cleanAnalyticsUrl,
  cleanPath,
  isAuditEvent,
  journeyForPath,
  linkPlacement,
  safeAuditProperties,
} from '../lib/analytics';

const config = document.querySelector<HTMLElement>('[data-levois-analytics]');
const token = config?.dataset.token?.trim();
const apiHost = config?.dataset.host?.trim() || 'https://eu.i.posthog.com';
const optOutKey = 'levois_analytics_opt_out';

function setPreferenceStatus() {
  const refused = localStorage.getItem(optOutKey) === '1';
  document.querySelectorAll<HTMLElement>('[data-analytics-status]').forEach((node) => {
    node.textContent = !token
      ? 'La mesure d’audience n’est pas encore active.'
      : refused
      ? 'La mesure d’audience est désactivée sur cet appareil.'
      : 'La mesure d’audience anonyme est active sur cet appareil.';
  });
  document.querySelectorAll<HTMLButtonElement>('[data-analytics-optout]').forEach((button) => {
    button.disabled = !token;
    button.textContent = refused ? 'Réactiver la mesure d’audience' : 'Refuser la mesure d’audience';
  });
}

document.addEventListener('click', (event) => {
  const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-analytics-optout]');
  if (!button) return;
  const refused = localStorage.getItem(optOutKey) === '1';
  if (refused) {
    localStorage.removeItem(optOutKey);
    window.location.reload();
  } else {
    localStorage.setItem(optOutKey, '1');
    if (token) posthog.opt_out_capturing();
    setPreferenceStatus();
  }
});

setPreferenceStatus();

const privacyOptOut = localStorage.getItem(optOutKey) === '1';
const globalPrivacyControl = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;

if (token && !privacyOptOut && !globalPrivacyControl) {
  posthog.init(token, {
    api_host: apiHost,
    ui_host: 'https://eu.posthog.com',
    defaults: '2026-05-30',
    cookieless_mode: 'always',
    person_profiles: 'never',
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_heatmaps: false,
    capture_performance: true,
    disable_session_recording: true,
    disable_surveys: true,
    respect_dnt: true,
    mask_all_text: true,
    mask_all_element_attributes: true,
    before_send(event) {
      if (!event?.properties) return event;
      const currentUrl = cleanAnalyticsUrl(event.properties.$current_url);
      const referrer = cleanAnalyticsUrl(event.properties.$referrer);
      if (currentUrl) event.properties.$current_url = currentUrl;
      else delete event.properties.$current_url;
      if (referrer) event.properties.$referrer = referrer;
      else delete event.properties.$referrer;
      delete event.properties.$referring_domain;
      event.properties.page_path = cleanPath(window.location.pathname);
      event.properties.journey = journeyForPath(window.location.pathname);
      return event;
    },
  });

  const capture = (event: string, properties: Record<string, unknown> = {}) => {
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
    capture('levois_form_submitted', { form_name: form.dataset.analyticsForm || cleanPath(window.location.pathname) });
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
