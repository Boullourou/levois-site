import { describe, expect, it } from 'vitest';
import {
  cleanAnalyticsUrl,
  cleanPath,
  isAuditEvent,
  journeyForPath,
  safeAuditProperties,
} from './analytics';

describe('analytics privacy contract', () => {
  it('removes query strings and fragments from tracked URLs', () => {
    expect(cleanAnalyticsUrl('https://levois.fr/audit-annonce/?email=test@example.com#outil'))
      .toBe('https://levois.fr/audit-annonce');
    expect(cleanPath('/ma-recherche/?utm_source=instagram')).toBe('/ma-recherche');
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
    })).toEqual({ source: 'SeLoger' });

    expect(safeAuditProperties('audit_resource_clicked', {
      href: 'https://levois.fr/ressources/premiere-impression?lead=secret',
    })).toEqual({ destination_path: '/ressources/premiere-impression' });
  });
});
