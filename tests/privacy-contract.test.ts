import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').replace(/\r\n?/g, '\n');
}

function openingForm(page: string, marker: string): string {
  const form = page.match(new RegExp(`<form(?=[^>]*${marker})[^>]*>`, 's'))?.[0];
  expect(form, `formulaire introuvable : ${marker}`).toBeTruthy();
  return form ?? '';
}

describe('public privacy contract', () => {
  it('keeps PostHog disabled without explicit configuration and consent', () => {
    const component = source('src/components/Analytics.astro');
    const analytics = source('src/scripts/analytics.ts');
    expect(component).not.toMatch(/phc_[A-Za-z0-9]+/);
    expect(component).toContain("PUBLIC_POSTHOG_KEY ?? ''");
    expect(analytics).toContain("readConsent() === 'accepted'");
    expect(analytics).not.toContain('levois_form_submitted');
    expect(analytics).toContain('levois_form_attempted');
    expect(analytics).not.toContain('posthog.opt_out_capturing()');
    expect(analytics).toContain('capture_pageleave: false');
    expect(analytics).toContain("if (readConsent() !== 'accepted' || globalPrivacyControl) return");
  });

  it('shows form success only after confirmed provider delivery', () => {
    const successPages = [
      source('src/pages/contact.astro'),
      source('src/pages/situer-ma-vente/resultat.astro'),
      source('src/pages/votre-rue.astro'),
    ];
    for (const page of successPages) expect(page).toMatch(/delivered\s*===\s*true/);
    expect(source('src/pages/audit-annonce.astro')).toContain('payload.delivered !== true');
    expect(successPages[0]).toContain("signalerResultat('levois_form_succeeded')");
  });

  it('does not send /api/lead payloads to an implicit fallback provider', () => {
    const lead = source('functions/api/lead.ts');
    expect(lead).not.toMatch(/formspree/i);
    expect(lead).not.toContain('FORMSPREE_ENDPOINT');
    expect(lead).toContain('RESEND_API_KEY absente — transmission suspendue');
  });

  it('carries explicit consent in every /api/lead browser payload', () => {
    expect(source('src/pages/contact.astro')).toContain("consentement: d.get('consentement') === 'on'");
    expect(source('src/pages/situer-ma-vente/resultat.astro'))
      .toContain("consentement: donnees.get('consentement') === 'on'");
    expect(source('src/pages/audit-annonce.astro')).toContain("type: 'audit-annonce', consentement: true");
    expect(source('src/pages/votre-rue.astro')).toContain('consentement: true');
  });

  it('discloses the direct Géoplateforme address flow', () => {
    const privacy = source('src/pages/confidentialite.astro');
    const votreRue = source('src/pages/votre-rue.astro');
    expect(privacy).toContain('Géoplateforme');
    expect(privacy).toContain('après votre action explicite');
    expect(privacy).toContain('choisir et confirmer l’adresse proposée');
    expect(privacy).toContain('l’adresse confirmée, le type de bien, la période, le rayon et la taille de l’échantillon');
    expect(votreRue).toContain("mon adresse confirmée, ce résultat, mes réponses et mes coordonnées");
  });

  it('never falls back to a GET containing SSR form data when JavaScript is unavailable', () => {
    const forms = [
      [source('src/pages/contact.astro'), 'id="form-contact"', 'action="/api/lead"'],
      [source('src/pages/votre-rue.astro'), 'id="vr-form"', 'action="/votre-rue/"'],
      [source('src/pages/situer-ma-vente/resultat.astro'), 'id="form-lead"', 'action="/api/lead"'],
      [source('src/pages/audit-annonce.astro'), 'data-url-form', 'action="/audit-annonce/"'],
    ];

    for (const [page, marker, action] of forms) {
      const form = openingForm(page, marker);
      expect(form).toContain('method="post"');
      expect(form).toContain(action);
      expect(form).not.toContain('novalidate');
    }

    const resultat = source('src/pages/situer-ma-vente/resultat.astro');
    const audit = source('src/pages/audit-annonce.astro');
    const votreRue = source('src/pages/votre-rue.astro');
    expect(resultat).toContain('name="type" value="parcours"');
    expect(audit).toContain('name="type" value="audit-annonce"');
    expect(audit).toContain('name="consentement" required');
    expect(votreRue).toContain('name="type" value="votre-rue"');
    expect(votreRue).toContain('name="adresseRecherchee"');
    expect(votreRue).toContain('name="consentement" required');
  });

  it('keeps /audit-annonce in questionnaire-only mode', () => {
    const audit = source('src/pages/audit-annonce.astro');
    const privacy = source('src/pages/confidentialite.astro');
    const normalizedPrivacy = privacy.replace(/\s+/g, ' ');
    expect(audit).not.toContain("fetch('/api/audit-url/'");
    expect(audit).toContain('La lecture automatique est désactivée');
    expect(privacy).toContain('actuellement limité à un questionnaire');
    expect(normalizedPrivacy).toContain('ne l’ouvre pas et ne lit pas automatiquement la page côté serveur');
    expect(privacy).not.toContain('envoie ponctuellement le lien fourni à notre serveur');
  });

  it('preserves real /votre-rue attribution and removes unconfirmed contact promises', () => {
    const contact = source('src/pages/contact.astro');
    const votreRue = source('src/pages/votre-rue.astro');
    expect(votreRue).not.toContain("source: 'QR /votre-rue'");
    expect(votreRue).toContain('attribution: attributionBornee()');
    expect(votreRue).toContain(
      'parmi 250&nbsp;m, 500&nbsp;m,\n          700&nbsp;m, 1&nbsp;km, 1,5&nbsp;km, 2&nbsp;km et 3&nbsp;km',
    );
    expect(contact).toMatch(/achat,\s+d’une vente/);
    expect(contact).not.toMatch(/24\s+(?:à|a|–|-)\s+48\s*h/i);
    expect(votreRue).not.toMatch(/24\s+(?:à|a|–|-)\s+48\s*h/i);
    expect(votreRue).toContain('adresse ne peut pas être utilisée dans cet outil');
  });
});
