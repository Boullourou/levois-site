import { describe, expect, it } from 'vitest';

import { attributionFromVisit, mergeAttribution, parseStoredAttribution } from './attribution';

describe('safe lead attribution', () => {
  it('keeps only bounded campaign tokens, the entry path and an external host', () => {
    expect(attributionFromVisit(
      'https://levois.fr/contact?utm_source=LinkedIn&utm_medium=social&utm_campaign=camille%40example.test',
      'https://www.google.fr/search?q=adresse+personnelle',
    )).toEqual({
      source: 'linkedin',
      medium: 'social',
      referrerHost: 'www.google.fr',
      entryPath: '/contact',
    });
  });

  it('rejects tokens that can carry an email and strips query strings from stored paths', () => {
    expect(parseStoredAttribution(JSON.stringify({
      source: 'camille@example.test',
      medium: 'social paid',
      referrerHost: 'www.linkedin.com/path',
      entryPath: '/contact?email=camille@example.test',
    }))).toEqual({
      source: undefined,
      medium: undefined,
      referrerHost: undefined,
      entryPath: '/contact',
    });
  });

  it('rejects a phone-like campaign token', () => {
    expect(attributionFromVisit('https://levois.fr/contact?utm_source=0781380121')).toMatchObject({
      source: undefined,
      entryPath: '/contact',
    });
  });

  it('buckets a user-shaped pathname instead of retaining personal data', () => {
    expect(attributionFromVisit('https://levois.fr/camille@example.test')).toMatchObject({
      entryPath: '/other',
    });
    expect(parseStoredAttribution(JSON.stringify({ entryPath: '/telephone/0781380121' }))).toMatchObject({
      entryPath: '/other',
    });
  });

  it('preserves the first safe source across internal navigation', () => {
    const first = attributionFromVisit('https://levois.fr/?src=qr-aout', 'https://instagram.com/profile');
    const contact = attributionFromVisit('https://levois.fr/contact', 'https://levois.fr/');
    expect(mergeAttribution(first, contact)).toEqual({
      source: 'qr-aout',
      medium: undefined,
      referrerHost: 'instagram.com',
      entryPath: '/',
    });
  });
});
