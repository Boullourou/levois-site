import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildMarketSummary,
  prepareTransactions,
  qualityForCount,
  quantileR7,
  selectCompleteYears,
} from '../scripts/build-market-summary.mjs';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(TEST_DIR, '..');
const DATA_PATH = join(ROOT, 'public', 'data', 'dvf-secteur.json');
const META_PATH = join(ROOT, 'public', 'data', 'dvf-meta.json');
const PUBLIC_SUMMARY_PATH = join(ROOT, 'public', 'data', 'dvf-market-summary.json');
const BUILD_SUMMARY_PATH = join(ROOT, 'src', 'data', 'dvf-market-summary.json');

test('quantileR7 interpole selon la méthode R-7', () => {
  const values = [0, 10, 20, 30];
  assert.equal(quantileR7(values, 0.25), 7.5);
  assert.equal(quantileR7(values, 0.5), 15);
  assert.equal(quantileR7(values, 0.75), 22.5);
  assert.equal(quantileR7([12], 0.5), 12);
  assert.equal(quantileR7([], 0.5), null);
});

test('les seuils de qualité sont stables aux quatre frontières', () => {
  assert.equal(qualityForCount(30), 'strong');
  assert.equal(qualityForCount(29), 'usable');
  assert.equal(qualityForCount(20), 'usable');
  assert.equal(qualityForCount(19), 'limited');
  assert.equal(qualityForCount(10), 'limited');
  assert.equal(qualityForCount(9), 'insufficient');
});

test('les filtres gardent une mutation unique, une surface positive et au plus un lot', () => {
  const fixture = [
    { id: 'ok', d: '2025-01-02', v: 200000, sb: 100, lots: 1, co: 'Lèves', t: 'Maison' },
    { id: 'ok', d: '2025-01-02', v: 999999, sb: 1, co: 'Lèves', t: 'Maison' },
    { id: 'multi', d: '2025-01-02', v: 200000, sb: 100, lots: 2, co: 'Lèves', t: 'Maison' },
    { id: 'surface', d: '2025-01-02', v: 200000, sb: 0, co: 'Lèves', t: 'Maison' },
    { id: 'old', d: '2020-01-02', v: 200000, sb: 100, co: 'Lèves', t: 'Maison' },
    { id: '', d: '2025-01-02', v: 200000, sb: 100, co: 'Lèves', t: 'Maison' },
  ];

  assert.deepEqual(prepareTransactions(fixture, [2021, 2022, 2023, 2024, 2025]), [fixture[0]]);
});

test('la commune et le type sont comparés exactement, sans élargissement implicite', () => {
  const transactions = [
    { id: '1', d: '2025-01-01', v: 100000, sb: 50, co: 'Lèves', t: 'Maison' },
    { id: '2', d: '2025-01-01', v: 200000, sb: 50, co: 'Leves', t: 'Maison' },
    { id: '3', d: '2025-01-01', v: 300000, sb: 50, co: 'Lèves', t: 'maison' },
  ];
  const meta = { communes: ['Lèves'], source: 'DVF', sourceUrl: 'https://example.test', licence: 'ouverte' };
  const summary = buildMarketSummary({
    transactions,
    meta,
    datasetBytes: Buffer.from(JSON.stringify(transactions)),
    referenceYear: 2026,
  });
  const houses = summary.series.find((item) => item.commune === 'Lèves' && item.propertyType === 'Maison');
  assert.equal(houses.fullPeriod.count, 1);
  assert.equal(houses.latest.pricePerSqm.median, 2000);
});

test('la période retient les cinq dernières années civiles disponibles', () => {
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map((year) => ({ d: `${year}-06-01` }));
  assert.deepEqual(selectCompleteYears(years, 2026), [2021, 2022, 2023, 2024, 2025]);
});

test('la synthèse publiée correspond au dataset DVF et aux repères validés', () => {
  const dataBytes = readFileSync(DATA_PATH);
  const transactions = JSON.parse(dataBytes.toString('utf8'));
  const meta = JSON.parse(readFileSync(META_PATH, 'utf8'));
  const publicBytes = readFileSync(PUBLIC_SUMMARY_PATH);
  const buildBytes = readFileSync(BUILD_SUMMARY_PATH);
  const published = JSON.parse(publicBytes.toString('utf8'));
  const rebuilt = buildMarketSummary({ transactions, meta, datasetBytes: dataBytes, referenceYear: 2026 });

  assert.deepEqual(published, rebuilt);
  assert.deepEqual(publicBytes, buildBytes);
  assert.deepEqual(published.period.years, [2021, 2022, 2023, 2024, 2025]);
  assert.equal(published.source.datasetMutationCount, 6318);
  assert.equal(
    published.source.datasetSha256,
    createHash('sha256').update(dataBytes).digest('hex')
  );

  const levesHouses = published.series.find(
    (item) => item.commune === 'Lèves' && item.propertyType === 'Maison'
  );
  assert.deepEqual(
    levesHouses.annual.map(({ year, count, pricePerSqm }) => [year, count, pricePerSqm.median]),
    [
      [2021, 49, 2225],
      [2022, 53, 2500],
      [2023, 34, 2453],
      [2024, 27, 2329],
      [2025, 38, 2353],
    ]
  );
  assert.equal(levesHouses.changeFromPreviousYearPct, 1);
  assert.deepEqual(levesHouses.recentWindow.pricePerSqm, { q1: 1947, median: 2337, q3: 2778 });
  assert.equal(levesHouses.recentWindow.count, 65);

  const levesApartments = published.series.find(
    (item) => item.commune === 'Lèves' && item.propertyType === 'Appartement'
  );
  assert.equal(levesApartments.changeFromPreviousYearPct, 3.4);
  assert.equal(levesApartments.latest.count, 29);
  assert.equal(levesApartments.latest.quality, 'usable');

  const chartresApartments = published.series.find(
    (item) => item.commune === 'Chartres' && item.propertyType === 'Appartement'
  );
  assert.deepEqual(
    chartresApartments.annual.map(({ year, count, pricePerSqm }) => [year, count, pricePerSqm.median]),
    [
      [2021, 573, 2383],
      [2022, 567, 2577],
      [2023, 439, 2465],
      [2024, 389, 2423],
      [2025, 430, 2448],
    ]
  );
  assert.equal(chartresApartments.changeFromPreviousYearPct, 1);
  assert.deepEqual(chartresApartments.recentWindow.pricePerSqm, { q1: 1955, median: 2436, q3: 2850 });
  assert.equal(chartresApartments.recentWindow.count, 819);
});
