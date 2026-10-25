import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildMarketSummary } from '../../scripts/build-market-summary.mjs';
import { localMarkets, marketSummary, marketSummaryText, marketDatasetSchema, formatMarketNumber, sampleCaution } from './local-market';

describe('DVF editorial data continuity', () => {
  it('publishes the same reproducible series in the observatory, public export and commune pages', () => {
    const bytes = readFileSync(new URL('../../public/data/dvf-secteur.json', import.meta.url));
    const meta = JSON.parse(readFileSync(new URL('../../public/data/dvf-meta.json', import.meta.url), 'utf8'));
    const published = JSON.parse(readFileSync(new URL('../../public/data/dvf-market-summary.json', import.meta.url), 'utf8'));
    const rebuilt = buildMarketSummary({ transactions: JSON.parse(bytes.toString('utf8')), meta, datasetBytes: bytes, referenceYear: marketSummary.period.toYear + 1 });
    expect(rebuilt).toEqual(marketSummary);
    expect(published).toEqual(marketSummary);
    expect(localMarkets).toHaveLength(7);
    expect(localMarkets.flatMap(market => market.series).map(series => `${series.commune}/${series.propertyType}`).sort())
      .toEqual(marketSummary.series.map(series => `${series.commune}/${series.propertyType}`).sort());
    for (const market of localMarkets) {
      for (const series of market.series) {
        const source = rebuilt.series.find(item => item.commune === market.name && item.propertyType === series.propertyType);
        if (!source) throw new Error(`Série absente : ${market.name}/${series.propertyType}`);
        expect(series.annual).toEqual(source.annual);
        expect(series.fullPeriod.count).toBe(series.annual.reduce((total, row) => total + row.count, 0));
      }
    }
  });

  it('uses current counts in visible summaries and structured data, without retaining the old apartment figures', () => {
    const chartres = localMarkets.find(market => market.slug === 'chartres')!;
    const leves = localMarkets.find(market => market.slug === 'leves')!;
    expect(marketSummaryText(chartres)).toContain('430 ventes');
    expect(marketSummaryText(leves)).toContain('29 ventes');
    expect(marketDatasetSchema(chartres).description).toBe(marketSummaryText(chartres));
    expect(marketDatasetSchema(chartres).distribution.contentUrl).toBe('https://levois.fr/data/dvf-market-summary.json');
  });

  it('does not turn missing apartment data into a zero price and explains low sample sizes', () => {
    const champhol = localMarkets.find(market => market.slug === 'champhol')!;
    expect(marketSummaryText(champhol)).toContain('aucune vente retenue');
    expect(marketSummaryText(champhol)).not.toContain('0 €/m²');
    expect(formatMarketNumber(null)).toBe('Non calculable');
    expect(sampleCaution(0)).toContain('Aucune vente');
    expect(sampleCaution(9)).toContain('insuffisant');
    expect(sampleCaution(10)).toContain('limité');
    expect(sampleCaution(19)).toContain('limité');
    expect(sampleCaution(20)).toContain('prudence');
    expect(sampleCaution(29)).toContain('prudence');
    expect(sampleCaution(30)).toContain('diversité');
  });
});
