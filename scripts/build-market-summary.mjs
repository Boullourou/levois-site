/**
 * Construit une synthèse DVF légère pour les composants publics du site.
 *
 * Entrée : public/data/dvf-secteur.json (mutations déjà nettoyées par build-dvf)
 * Sorties identiques :
 *   - public/data/dvf-market-summary.json (transparence / API statique)
 *   - src/data/dvf-market-summary.json (import Astro au moment du build)
 *
 * Le résultat est déterministe pour un même dataset : aucun horodatage de build
 * n'est ajouté. L'empreinte SHA-256 relie la synthèse au fichier source exact.
 */

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, '..');
const DEFAULT_DATA_PATH = join(PROJECT_ROOT, 'public', 'data', 'dvf-secteur.json');
const DEFAULT_META_PATH = join(PROJECT_ROOT, 'public', 'data', 'dvf-meta.json');
const DEFAULT_PUBLIC_OUTPUT = join(PROJECT_ROOT, 'public', 'data', 'dvf-market-summary.json');
const DEFAULT_BUILD_OUTPUT = join(PROJECT_ROOT, 'src', 'data', 'dvf-market-summary.json');

export const PROPERTY_TYPES = Object.freeze(['Maison', 'Appartement']);
export const YEAR_WINDOW_SIZE = 5;
export const RECENT_WINDOW_SIZE = 2;

export const QUALITY_THRESHOLDS = Object.freeze({
  strong: Object.freeze({ min: 30, max: null, label: 'fort' }),
  usable: Object.freeze({ min: 20, max: 29, label: 'exploitable' }),
  limited: Object.freeze({ min: 10, max: 19, label: 'limité' }),
  insufficient: Object.freeze({ min: 0, max: 9, label: 'insuffisant' }),
});

/** Quantile continu R-7, méthode par défaut de R et NumPy. */
export function quantileR7(values, probability) {
  if (!Array.isArray(values) || values.length === 0) return null;
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new RangeError('La probabilité du quantile doit être comprise entre 0 et 1.');
  }

  const sorted = values
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0];

  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const fraction = index - lower;
  const upperValue = sorted[Math.min(lower + 1, sorted.length - 1)];
  return sorted[lower] + fraction * (upperValue - sorted[lower]);
}

export function qualityForCount(count) {
  if (count >= QUALITY_THRESHOLDS.strong.min) return 'strong';
  if (count >= QUALITY_THRESHOLDS.usable.min) return 'usable';
  if (count >= QUALITY_THRESHOLDS.limited.min) return 'limited';
  return 'insufficient';
}

export function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

export function selectCompleteYears(transactions, referenceYear = new Date().getUTCFullYear()) {
  const years = new Set();
  for (const transaction of transactions) {
    const year = Number(String(transaction?.d || '').slice(0, 4));
    if (Number.isInteger(year) && year >= 1900 && year < referenceYear) years.add(year);
  }
  return [...years].sort((a, b) => a - b).slice(-YEAR_WINDOW_SIZE);
}

/**
 * Déduplique globalement par id_mutation, puis applique les seuls filtres
 * analytiques validés. Aucun écrêtage arbitraire du prix au m² n'est effectué.
 */
export function prepareTransactions(transactions, selectedYears) {
  const years = new Set(selectedYears);
  const unique = new Map();

  for (const transaction of transactions) {
    if (!transaction || typeof transaction.id !== 'string' || transaction.id.length === 0) continue;
    if (!unique.has(transaction.id)) unique.set(transaction.id, transaction);
  }

  return [...unique.values()].filter((transaction) => {
    const year = Number(String(transaction.d || '').slice(0, 4));
    return (
      years.has(year) &&
      Number.isFinite(Number(transaction.sb)) &&
      Number(transaction.sb) > 0 &&
      Number.isFinite(Number(transaction.v)) &&
      Number(transaction.v) > 0 &&
      (transaction.lots == null || Number(transaction.lots) <= 1)
    );
  });
}

function roundedQuantiles(transactions) {
  const pricesPerSqm = transactions.map((transaction) => Number(transaction.v) / Number(transaction.sb));
  if (pricesPerSqm.length === 0) return { q1: null, median: null, q3: null };
  return {
    q1: Math.round(quantileR7(pricesPerSqm, 0.25)),
    median: Math.round(quantileR7(pricesPerSqm, 0.5)),
    q3: Math.round(quantileR7(pricesPerSqm, 0.75)),
  };
}

function medianPricePerSqm(transactions) {
  return quantileR7(
    transactions.map((transaction) => Number(transaction.v) / Number(transaction.sb)),
    0.5
  );
}

function summarizeTransactions(transactions) {
  return {
    count: transactions.length,
    quality: qualityForCount(transactions.length),
    pricePerSqm: roundedQuantiles(transactions),
  };
}

function annualSummary(transactions, year) {
  return {
    year,
    ...summarizeTransactions(transactions.filter((transaction) => Number(transaction.d.slice(0, 4)) === year)),
  };
}

function percentChange(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export function buildMarketSummary({ transactions, meta, datasetBytes, referenceYear }) {
  if (!Array.isArray(transactions)) throw new TypeError('Le dataset DVF doit être un tableau.');
  if (!meta || !Array.isArray(meta.communes)) throw new TypeError('Les métadonnées DVF sont invalides.');

  const years = selectCompleteYears(transactions, referenceYear);
  if (years.length === 0) throw new Error('Aucune année civile complète disponible dans le dataset DVF.');

  const prepared = prepareTransactions(transactions, years);
  const latestYear = years.at(-1);
  const previousYear = years.at(-2) ?? null;
  const recentYears = years.slice(-RECENT_WINDOW_SIZE);
  const series = [];

  for (const commune of meta.communes) {
    for (const propertyType of PROPERTY_TYPES) {
      // Comparaison stricte : aucune normalisation, extension de zone ou type voisin.
      const exact = prepared.filter(
        (transaction) => transaction.co === commune && transaction.t === propertyType
      );
      const annual = years.map((year) => annualSummary(exact, year));
      const latest = annual.find((item) => item.year === latestYear);
      const previous = annual.find((item) => item.year === previousYear);
      const latestTransactions = exact.filter(
        (transaction) => Number(transaction.d.slice(0, 4)) === latestYear
      );
      const previousTransactions = exact.filter(
        (transaction) => Number(transaction.d.slice(0, 4)) === previousYear
      );
      const recent = exact.filter((transaction) => recentYears.includes(Number(transaction.d.slice(0, 4))));

      series.push({
        commune,
        propertyType,
        annual,
        latest,
        previous,
        changeFromPreviousYearPct: percentChange(
          medianPricePerSqm(latestTransactions),
          medianPricePerSqm(previousTransactions)
        ),
        recentWindow: {
          years: recentYears,
          ...summarizeTransactions(recent),
        },
        fullPeriod: {
          years,
          ...summarizeTransactions(exact),
        },
      });
    }
  }

  const sourceBytes = Buffer.isBuffer(datasetBytes)
    ? datasetBytes
    : Buffer.from(datasetBytes ?? JSON.stringify(transactions));

  return {
    schemaVersion: 1,
    status: 'ready',
    source: {
      name: meta.source,
      url: meta.sourceUrl,
      licence: meta.licence,
      datasetPath: 'public/data/dvf-secteur.json',
      datasetSha256: sha256(sourceBytes),
      datasetMutationCount: transactions.length,
      sourceGeneratedAt: meta.generatedAt ?? null,
      firstMutationDate: meta.dateVenteLaPlusAncienne ?? null,
      latestMutationDate: meta.dateVenteLaPlusRecente ?? null,
    },
    period: {
      years,
      fromYear: years[0],
      toYear: latestYear,
      latestCompleteYear: latestYear,
      selection: 'Cinq dernières années civiles complètes disponibles dans le dataset.',
    },
    selectors: {
      communes: [...meta.communes],
      propertyTypes: [...PROPERTY_TYPES],
    },
    methodology: {
      metric: 'Médiane du prix observé au m²',
      unit: 'EUR/m²',
      quantileMethod: 'R-7',
      recentWindowYears: RECENT_WINDOW_SIZE,
      eligibleMutationCount: prepared.length,
      filters: [
        'Commune et type de bien comparés à l’identique.',
        'Une seule observation par identifiant de mutation.',
        'Surface bâtie strictement positive.',
        'Mutation d’un seul local d’habitation : lots absent ou inférieur ou égal à 1.',
        'Années civiles complètes retenues dans la période publiée.',
        'Aucun écrêtage arbitraire du prix au m².',
      ],
      qualityThresholds: QUALITY_THRESHOLDS,
    },
    limitations: [
      'Le prix de mutation peut inclure le terrain et des dépendances ; le prix au m² n’est pas une estimation du bien.',
      'La composition des biens vendus varie d’une année à l’autre et peut déplacer la médiane.',
      'DVF est publié avec délai et certaines mutations peuvent être absentes ou corrigées ultérieurement.',
      'Ces indicateurs décrivent des ventes observées ; ils ne constituent ni une prévision ni une valeur de marché individuelle.',
    ],
    series,
  };
}

export function writeMarketSummary({
  dataPath = DEFAULT_DATA_PATH,
  metaPath = DEFAULT_META_PATH,
  publicOutput = DEFAULT_PUBLIC_OUTPUT,
  buildOutput = DEFAULT_BUILD_OUTPUT,
  referenceYear,
} = {}) {
  const datasetBytes = readFileSync(dataPath);
  const transactions = JSON.parse(datasetBytes.toString('utf8'));
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  const summary = buildMarketSummary({ transactions, meta, datasetBytes, referenceYear });
  const serialized = `${JSON.stringify(summary, null, 2)}\n`;

  for (const output of [publicOutput, buildOutput]) {
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, serialized, 'utf8');
  }

  return { summary, outputs: [publicOutput, buildOutput], bytes: Buffer.byteLength(serialized) };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const { summary, outputs, bytes } = writeMarketSummary();
    console.log(
      `[dvf-market] ${summary.methodology.eligibleMutationCount} mutations éligibles · ` +
      `${summary.period.fromYear}–${summary.period.toYear} · ${summary.series.length} séries`
    );
    for (const output of outputs) console.log(`[dvf-market] ✓ ${output} (${bytes} octets)`);
  } catch (error) {
    console.error('[dvf-market] Erreur :', error);
    process.exitCode = 1;
  }
}
