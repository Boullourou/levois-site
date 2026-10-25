import summary from '../data/dvf-market-summary.json';

/** Shared calculated source; no manually maintained prices in editorial pages. */
export const marketSummary = summary;
export type MarketSeries = (typeof summary.series)[number];
export const dvfSourceUrl = 'https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres';
export const marketReviewDate = '2026-10-25';

const locations = [
  { slug: 'chartres', name: 'Chartres', postalCode: '28000', context: 'Centre-ville, proximité de la gare ou quartier résidentiel : comparez des logements dont les usages, l’état et les contraintes sont proches.' },
  { slug: 'leves', name: 'Lèves', postalCode: '28300', context: 'Pour un projet à Lèves, confrontez les repères de prix aux trajets quotidiens, à l’état du logement et aux travaux nécessaires.' },
  { slug: 'mainvilliers', name: 'Mainvilliers', postalCode: '28300', context: 'À Mainvilliers, comparez séparément maisons et appartements. Pour une copropriété, examinez aussi les charges et les travaux votés.' },
  { slug: 'luce', name: 'Lucé', postalCode: '28110', context: 'Pour comparer des logements à Lucé, vérifiez les surfaces, le stationnement, les charges et les services réellement accessibles depuis chaque adresse.' },
  { slug: 'champhol', name: 'Champhol', postalCode: '28300', context: 'À Champhol, le faible nombre d’appartements dans cette base ne permet pas de décrire leur marché à partir d’une médiane annuelle.' },
  { slug: 'le-coudray', name: 'Le Coudray', postalCode: '28630', context: 'Au Coudray, les effectifs de certaines années sont faibles. Une variation de médiane peut simplement refléter des biens différents vendus cette année-là.' },
  { slug: 'luisant', name: 'Luisant', postalCode: '28600', context: 'Pour un projet à Luisant, rapprochez les chiffres de biens comparables : maison ou appartement, surface, état, extérieur et contraintes de déplacement.' },
] as const;

export const localMarkets = locations.map(location => ({
  ...location,
  series: summary.series.filter(series => series.commune === location.name),
}));
export type LocalMarket = (typeof localMarkets)[number];

export function formatMarketNumber(value: number | null): string {
  return value === null ? 'Non calculable' : value.toLocaleString('fr-FR');
}

export function sampleCaution(count: number): string {
  if (count === 0) return 'Aucune vente retenue : aucun prix calculable.';
  if (count < 10) return 'Moins de 10 ventes : effectif insuffisant pour dégager une tendance.';
  if (count < 20) return '10 à 19 ventes : effectif limité, comparaison très prudente.';
  if (count < 30) return '20 à 29 ventes : repère à interpréter avec prudence.';
  return '30 ventes ou plus. La diversité des biens reste à prendre en compte.';
}

export function marketSummaryText(market: LocalMarket): string {
  const observations = market.series.map(series => {
    const { latest } = series;
    const label = series.propertyType === 'Maison' ? 'maisons' : 'appartements';
    if (latest.pricePerSqm.median === null) return `${label} : aucune vente retenue en ${latest.year}, aucun prix calculable`;
    return `${label} : ${formatMarketNumber(latest.pricePerSqm.median)} €/m² de médiane sur ${latest.count} ventes retenues en ${latest.year}`;
  });
  return `À ${market.name}, dans la sélection DVF de LEVOIS : ${observations.join(' ; ')}. Ces repères communaux ne sont pas une estimation de votre logement.`;
}

export function marketDatasetSchema(market: LocalMarket) {
  return {
    '@context': 'https://schema.org', '@type': 'Dataset',
    '@id': `https://levois.fr/prix-immobilier/${market.slug}/#donnees`,
    name: `Repères DVF ${summary.period.fromYear}–${summary.period.toYear} à ${market.name}`,
    description: marketSummaryText(market),
    url: `https://levois.fr/prix-immobilier/${market.slug}/`,
    license: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/',
    creator: { '@type': 'Organization', name: 'LEVOIS', url: 'https://levois.fr/' },
    isBasedOn: { '@type': 'Dataset', name: summary.source.name, url: dvfSourceUrl },
    temporalCoverage: `${summary.period.fromYear}-01-01/${summary.period.toYear}-12-31`,
    spatialCoverage: { '@type': 'Place', name: market.name },
    distribution: {
      '@type': 'DataDownload', contentUrl: 'https://levois.fr/data/dvf-market-summary.json', encodingFormat: 'application/json',
    },
  };
}
