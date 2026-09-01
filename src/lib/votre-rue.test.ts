import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  MIN_MARKET_SAMPLE_SIZE,
  MARKET_RADII,
  MAX_GEOCODING_QUERY_LENGTH,
  boundedGeocodingQuery,
  geocodingCandidate,
  geocodingCandidates,
  selectMarketScope,
  type MarketTransaction,
} from './votre-rue';

function feature(overrides: Record<string, unknown> = {}) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [1.49055, 48.475225] },
    properties: {
      label: '8 Rue de la Ravaudière 28300 Lèves',
      city: 'Lèves',
      postcode: '28300',
      citycode: '28209',
      type: 'housenumber',
      score: 0.96,
      ...overrides,
    },
  };
}

function transaction(
  id: string,
  type: 'Maison' | 'Appartement',
  latitudeOffset: number,
  overrides: Partial<MarketTransaction> = {},
): MarketTransaction {
  return {
    id,
    d: '2025-01-15',
    v: 200_000,
    t: type,
    lat: 48 + latitudeOffset,
    lon: 1,
    sb: 100,
    ...overrides,
  };
}

describe('confirmation Géoplateforme', () => {
  it('borne la requête envoyée au prestataire', () => {
    expect(boundedGeocodingQuery(`  ${'a'.repeat(400)}  `)).toHaveLength(MAX_GEOCODING_QUERY_LENGTH);
    expect(boundedGeocodingQuery('  8 rue de la Ravaudière, Lèves  ')).toBe('8 rue de la Ravaudière, Lèves');
  });

  it('accepte seulement une adresse numérotée suffisamment précise en Eure-et-Loir', () => {
    expect(geocodingCandidate(feature())).toMatchObject({
      label: '8 Rue de la Ravaudière 28300 Lèves',
      kind: 'housenumber',
      kindLabel: 'adresse avec numéro',
    });
    expect(geocodingCandidate(feature({ type: 'street' }))).toBeNull();
    expect(geocodingCandidate(feature({ type: 'municipality' }))).toBeNull();
    expect(geocodingCandidate(feature({ citycode: '36093' }))).toBeNull();
    expect(geocodingCandidate(feature({ score: 0.58 }))).toBeNull();
  });

  it('rejette les coordonnées invalides et déduplique les réponses', () => {
    const duplicate = feature();
    expect(geocodingCandidates([feature(), duplicate, feature({ label: '' })])).toHaveLength(1);
    expect(geocodingCandidate({ ...feature(), geometry: { type: 'Point', coordinates: [NaN, 48] } })).toBeNull();
  });
});

describe('échantillon /votre-rue', () => {
  it('commence au rayon le plus précis et élargit progressivement jusqu’à 3 km', () => {
    expect(MARKET_RADII).toEqual([250, 500, 700, 1000, 1500, 2000, 3000]);
  });

  it('ne mélange pas les types et élargit au plus petit rayon atteignant le seuil', () => {
    const houses = Array.from({ length: MIN_MARKET_SAMPLE_SIZE }, (_, index) => transaction(
      `m-${index}`,
      'Maison',
      index === MIN_MARKET_SAMPLE_SIZE - 1 ? 0.009 : 0.003,
      { d: index === 0 ? '2021-02-01' : '2025-11-30' },
    ));
    const apartments = Array.from({ length: 80 }, (_, index) => transaction(`a-${index}`, 'Appartement', 0.002));

    const scope = selectMarketScope([...houses, ...apartments], 48, 1, 'Maison');

    expect(scope).not.toBeNull();
    expect(scope?.radius).toBe(1500);
    expect(scope?.sample).toHaveLength(MIN_MARKET_SAMPLE_SIZE);
    expect(scope?.sample.every((sale) => sale.t === 'Maison')).toBe(true);
    expect(scope?.periodFrom).toBe('2021-02-01');
    expect(scope?.periodTo).toBe('2025-11-30');
  });

  it('suspend le résultat si le type choisi reste sous le seuil à 3 km', () => {
    const houses = Array.from({ length: MIN_MARKET_SAMPLE_SIZE - 1 }, (_, index) => transaction(`m-${index}`, 'Maison', 0.002));
    const apartments = Array.from({ length: 100 }, (_, index) => transaction(`a-${index}`, 'Appartement', 0.002));
    const multiLot = transaction('multi', 'Maison', 0.002, { lots: 2 });
    const noSurface = transaction('sans-surface', 'Maison', 0.002, { sb: undefined });

    expect(selectMarketScope([...houses, ...apartments, multiLot, noSurface], 48, 1, 'Maison')).toBeNull();
  });

  it('ne calcule pas la tendance sur un rayon silencieusement élargi', () => {
    const page = readFileSync(new URL('../pages/votre-rue.astro', import.meta.url), 'utf8');
    expect(page).toContain('const D = computeTrend(near)');
    expect(page).not.toMatch(/computeTrend\(all|const radii =/);
  });
});
