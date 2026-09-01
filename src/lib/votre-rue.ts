export type PropertyType = 'Maison' | 'Appartement';

export type MarketTransaction = {
  id: string;
  d: string;
  v: number;
  t: string;
  lat: number;
  lon: number;
  no?: string;
  vo?: string;
  cp?: string;
  co?: string;
  sb?: number;
  p?: number;
  st?: number;
  lots?: number;
};

export type GeocodingCandidate = {
  lon: number;
  lat: number;
  label: string;
  city: string;
  postcode: string;
  citycode: string;
  kind: 'housenumber';
  kindLabel: 'adresse avec numéro';
  score: number;
};

export type ScopedTransaction = MarketTransaction & { _dist: number };

export type MarketScope = {
  radius: number;
  sample: ScopedTransaction[];
  context: ScopedTransaction[];
  all: ScopedTransaction[];
  periodFrom: string;
  periodTo: string;
};

export const MIN_GEOCODING_SCORE = 0.7;
export const MAX_GEOCODING_QUERY_LENGTH = 240;
export const MIN_MARKET_SAMPLE_SIZE = 20;
export const MARKET_RADII = [250, 500, 700, 1000, 1500, 2000, 3000] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function boundedGeocodingQuery(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, MAX_GEOCODING_QUERY_LENGTH) : '';
}

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function geocodingCandidate(
  feature: unknown,
  department = '28',
): GeocodingCandidate | null {
  if (!feature || typeof feature !== 'object') return null;

  const raw = feature as {
    geometry?: { type?: unknown; coordinates?: unknown };
    properties?: Record<string, unknown>;
  };
  const coordinates = raw.geometry?.coordinates;
  const properties = raw.properties;
  if (
    raw.geometry?.type !== 'Point'
    || !Array.isArray(coordinates)
    || !finiteNumber(coordinates[0])
    || !finiteNumber(coordinates[1])
    || coordinates[0] < -180
    || coordinates[0] > 180
    || coordinates[1] < -90
    || coordinates[1] > 90
    || !properties
  ) return null;

  const label = typeof properties.label === 'string' ? properties.label.trim() : '';
  const city = typeof properties.city === 'string' ? properties.city.trim() : '';
  const postcode = typeof properties.postcode === 'string' ? properties.postcode.trim() : '';
  const citycode = typeof properties.citycode === 'string' ? properties.citycode.trim() : '';
  const kind = typeof properties.type === 'string' ? properties.type : '';
  const score = properties.score;

  if (
    !label
    || !city
    || !postcode
    || !citycode.startsWith(department)
    || kind !== 'housenumber'
    || !finiteNumber(score)
    || score < MIN_GEOCODING_SCORE
  ) return null;

  return {
    lon: coordinates[0],
    lat: coordinates[1],
    label,
    city,
    postcode,
    citycode,
    kind: 'housenumber',
    kindLabel: 'adresse avec numéro',
    score,
  };
}

export function geocodingCandidates(features: unknown, department = '28'): GeocodingCandidate[] {
  if (!Array.isArray(features)) return [];

  const seen = new Set<string>();
  const candidates: GeocodingCandidate[] = [];
  for (const feature of features) {
    const candidate = geocodingCandidate(feature, department);
    if (!candidate) continue;
    const key = `${candidate.citycode}|${candidate.kind}|${candidate.label.toLocaleLowerCase('fr-FR')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push(candidate);
  }
  return candidates;
}

export function distanceMeters(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const earthRadius = 6_371_000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function usableHousingTransaction(transaction: MarketTransaction): boolean {
  return (
    (transaction.t === 'Maison' || transaction.t === 'Appartement')
    && !(transaction.lots && transaction.lots > 1)
    && finiteNumber(transaction.lat)
    && finiteNumber(transaction.lon)
    && finiteNumber(transaction.v)
    && transaction.v > 0
    && ISO_DATE.test(transaction.d)
  );
}

/**
 * Returns one auditable sample for one explicitly selected property type.
 * The smallest supported radius is used; if 3 km still contains fewer than
 * 20 complete observations, no market result is returned.
 */
export function selectMarketScope(
  transactions: MarketTransaction[],
  lat: number,
  lon: number,
  propertyType: PropertyType,
): MarketScope | null {
  if (!finiteNumber(lat) || !finiteNumber(lon)) return null;

  const all = transactions
    .filter(usableHousingTransaction)
    .map((transaction) => ({
      ...transaction,
      _dist: distanceMeters(lat, lon, transaction.lat, transaction.lon),
    }))
    .sort((a, b) => a._dist - b._dist);

  for (const radius of MARKET_RADII) {
    const context = all.filter((transaction) => transaction._dist <= radius);
    const sample = context.filter((transaction) => (
      transaction.t === propertyType
      && finiteNumber(transaction.sb)
      && transaction.sb > 0
    ));
    if (sample.length < MIN_MARKET_SAMPLE_SIZE) continue;

    const dates = sample.map((transaction) => transaction.d).sort();
    return {
      radius,
      sample,
      context,
      all,
      periodFrom: dates[0],
      periodTo: dates[dates.length - 1],
    };
  }

  return null;
}
