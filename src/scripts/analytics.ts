import {ANALYTICS_CONSENT_KEY,readAnalyticsChoice,writeAnalyticsChoice,type AnalyticsChoice} from '../lib/analytics-consent';
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
const dialog=document.getElementById('analytics-preferences') as HTMLDialogElement|null;
const privacySignal=()=>navigator.doNotTrack==='1'||(navigator as Navigator&{globalPrivacyControl?:boolean}).globalPrivacyControl===true;
let memoryChoice:AnalyticsChoice|null=null;
const getChoice=()=>{try{const raw=localStorage.getItem(ANALYTICS_CONSENT_KEY);return raw===null?memoryChoice:readAnalyticsChoice(raw)}catch{return memoryChoice}};
let started=false, posthogInstance:typeof import('posthog-js/dist/module.slim').default|null=null;
function allowed(){return Boolean(token)&&getChoice()==='accepted'&&!privacySignal()}
function setPreferenceStatus(){
 const active=allowed();
 document.querySelectorAll<HTMLElement>('[data-analytics-status]').forEach(el=>{el.textContent=privacySignal()?'Votre navigateur demande de ne pas être suivi. La mesure reste désactivée.':!token?'La mesure d’audience n’est pas configurée sur cette version.':active?'La mesure d’audience est activée. Vous pouvez retirer votre accord à tout moment.':'La mesure d’audience est désactivée.'});
 document.querySelectorAll<HTMLButtonElement>('[data-analytics-choice]').forEach(el=>{el.setAttribute('aria-pressed',String(el.dataset.analyticsChoice===getChoice()));el.disabled=el.dataset.analyticsChoice==='accepted'&&(!token||privacySignal())});
}
async function choose(choice:AnalyticsChoice){
 memoryChoice=choice;try{localStorage.setItem(ANALYTICS_CONSENT_KEY,writeAnalyticsChoice(choice));localStorage.removeItem('levois_analytics_opt_out')}catch{}
 // Cookieless always ignores SDK opt-in/out: the application consent gate owns capture.
 setPreferenceStatus();if(allowed())await startAnalytics();
}
document.addEventListener('click',event=>{const el=event.target as Element|null;
 if(el?.closest('[data-analytics-settings]')){setPreferenceStatus();dialog?.showModal();}
 const button=el?.closest<HTMLElement>('[data-analytics-choice]');if(button){void choose(button.dataset.analyticsChoice as AnalyticsChoice);}
});
window.addEventListener('storage',event=>{if(event.key===ANALYTICS_CONSENT_KEY){memoryChoice=null;setPreferenceStatus();if(allowed())void startAnalytics();}});
setPreferenceStatus();if(allowed())void startAnalytics();
async function startAnalytics(){
 if(!allowed())return;
 if(started)return;
 started=true;
 let posthog:typeof import('posthog-js/dist/module.slim').default;
 try{posthog=(await import('posthog-js/dist/module.slim')).default;}catch{started=false;return}
 if(!allowed()){started=false;return}
 posthogInstance=posthog;
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
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    respect_dnt: true,
    mask_all_text: true,
    mask_all_element_attributes: true,
    before_send(event) {
      if (!allowed()) return null;
      if (!event?.properties) return event;
      const currentUrl = cleanAnalyticsUrl(event.properties.$current_url);
      const referrer = cleanAnalyticsUrl(event.properties.$referrer);
      if (currentUrl) event.properties.$current_url = currentUrl;
      else delete event.properties.$current_url;
      if (referrer) event.properties.$referrer = referrer;
      else delete event.properties.$referrer;
      delete event.properties.$referring_domain;
      // Explicit allowlist: SDK acquisition metadata can otherwise include query strings.
      const permitted=new Set(['token','distinct_id','$session_id','$window_id','$insert_id','$lib','$lib_version','$browser','$browser_version','$os','$os_version','$device_type','$screen_height','$screen_width','$viewport_height','$viewport_width','$current_url','$referrer','$timestamp','page_path','journey','source','signal','result','step','step_name','selected_journey','consent_type','placement','destination_path','link_type','form_name','active_seconds','scroll_percent','max_scroll_percent','duration_seconds','exit_reason']);
      for(const key of Object.keys(event.properties))if(!permitted.has(key))delete event.properties[key];
      event.properties.$cookieless_mode = true;
      event.properties.$process_person_profile = false;
      event.properties.page_path = cleanPath(window.location.pathname);
      event.properties.journey = journeyForPath(window.location.pathname);
      return event;
    },
  });

  const capture = (event: string, properties: Record<string, unknown> = {}) => {
    if(!allowed())return;
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

  window.addEventListener('levois:journey', (rawEvent) => {
    const detail = (rawEvent as CustomEvent<Record<string, unknown>>).detail ?? {};
    const event = typeof detail.event === 'string' ? detail.event : '';
    const allowed = new Set([
      'journey_started',
      'journey_step_completed',
      'journey_completed',
      'result_viewed',
      'contact_consent_submitted',
      'matching_consent_submitted',
      'reading_consent_submitted',
    ]);
    if (!allowed.has(event)) return;
    const safe: Record<string, string | number | boolean> = {};
    if (typeof detail.step === 'number') safe.step = detail.step;
    if (typeof detail.step_name === 'string') safe.step_name = detail.step_name.slice(0, 80);
    if (typeof detail.selected_journey === 'string') safe.selected_journey = detail.selected_journey.slice(0, 40);
    if (typeof detail.consent_type === 'string') safe.consent_type = detail.consent_type.slice(0, 40);
    capture(event, safe);
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
    const selectedJourney = link.dataset.journey;
    if (selectedJourney) {
      const routeProperties = {
        selected_journey: selectedJourney,
        placement: linkPlacement(link),
        destination_path: isInternal ? cleanPath(destination.pathname) : destination.hostname,
      };
      capture('route_selected', routeProperties);
      capture('levois_journey_selected', routeProperties);
    }
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
