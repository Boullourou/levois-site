import { describe, expect, it } from 'vitest';
import {
  cleanAnalyticsUrl,
  cleanReferrerUrl,
  cleanPath,
  isFormResultEvent,
  isAuditEvent,
  journeyForPath,
  safeAuditProperties,
  safeFormResultProperties,
  sanitizeAutomaticProperties,
} from './analytics';

describe('analytics privacy contract', () => {
  it('removes query strings and fragments from tracked URLs', () => {
    expect(cleanAnalyticsUrl('https://levois.fr/audit-annonce/?email=test@example.com#outil'))
      .toBe('https://levois.fr/audit-annonce');
    expect(cleanPath('/ma-recherche/?utm_source=instagram')).toBe('/ma-recherche');
    expect(cleanReferrerUrl('https://example.com/person/camille?email=test@example.com'))
      .toBe('https://example.com');
  });

  it('distinguishes a confirmed form success from a submit attempt without forwarding arbitrary data', () => {
    expect(isFormResultEvent('levois_form_succeeded')).toBe(true);
    expect(isFormResultEvent('levois_form_attempted')).toBe(false);
    expect(safeFormResultProperties({
      form_name: 'contact',
      email: 'test@example.com',
      message: 'secret',
    })).toEqual({ form_name: 'contact' });
    expect(safeFormResultProperties({ form_name: 'inconnu' })).toEqual({});
  });

  it('removes automatic campaign values and initial URLs that could contain personal data', () => {
    expect(sanitizeAutomaticProperties({
      $current_url: 'https://levois.fr/contact?email=test@example.com',
      $initial_current_url: 'https://levois.fr/?utm_campaign=test@example.com',
      $referrer: 'https://example.com/person/test@example.com',
      $initial_referrer: 'https://search.example/results?q=test@example.com',
      $referring_domain: 'example.com',
      $initial_referring_domain: 'search.example',
      utm_campaign: 'test@example.com',
      $initial_utm_source: 'private-name',
      gclid: 'secret-click-id',
      $pathname: '/camille@example.test',
      $initial_pathname: '/telephone/0781380121',
      $session_entry_url: 'https://levois.fr/camille@example.test?token=secret',
      $session_entry_referrer: 'https://example.com/person/camille@example.test',
      li_fat_id: 'secret-linkedin-id',
      $browser: 'Chrome',
    }, '/contact?email=test@example.com')).toEqual({
      $current_url: 'https://levois.fr/contact',
      $initial_current_url: 'https://levois.fr/',
      $referrer: 'https://example.com',
      $initial_referrer: 'https://search.example',
      $browser: 'Chrome',
      $pathname: '/other',
      $initial_pathname: '/other',
      $session_entry_url: 'https://levois.fr/other',
      $session_entry_referrer: 'https://example.com',
      page_path: '/contact',
      journey: 'brand',
    });
  });

  it('maps public pages to the three LEVOIS journeys', () => {
    expect(journeyForPath('/audit-annonce/')).toBe('listing_live');
    expect(journeyForPath('/situer-ma-vente/resultat')).toBe('seller_future');
    expect(journeyForPath('/votre-rue')).toBe('seller_future');
    expect(journeyForPath('/ma-recherche')).toBe('buyer');
    expect(journeyForPath('/recommander')).toBe('prescriber');
    expect(journeyForPath('/rejoindre')).toBe('team_candidate');
    expect(journeyForPath('/ressources')).toBe('brand');
  });

  it('only accepts the seven canonical audit events', () => {
    expect(isAuditEvent('audit_started')).toBe(true);
    expect(isAuditEvent('listing_url_submitted')).toBe(false);
  });

  it('never forwards the listing URL or arbitrary questionnaire data', () => {
    expect(safeAuditProperties('audit_url_readable', {
      source: 'SeLoger',
      url: 'https://example.com/annonce/secret',
      email: 'test@example.com',
    })).toEqual({ source: 'supported-portal' });
    expect(safeAuditProperties('audit_url_readable', {
      source: 'camille.example.test',
    })).toEqual({ source: 'supported-portal' });
    expect(safeAuditProperties('audit_stage_identified', { signal: 'camille@example.test' })).toEqual({});

    expect(safeAuditProperties('audit_resource_clicked', {
      href: 'https://levois.fr/ressources/premiere-impression-annonce?lead=secret',
    })).toEqual({ destination_path: '/ressources/premiere-impression-annonce' });
  });
});
