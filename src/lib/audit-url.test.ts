import { describe, expect, it } from 'vitest';
import { analyseListing, type ListingSnapshot } from './audit-url';

const base: ListingSnapshot = {
  url: 'https://example.test/annonce',
  source: 'example.test',
  title: 'Maison à vendre',
  description: 'Maison lumineuse avec séjour et trois chambres.',
  photoCount: 5,
  price: '249 000 €',
};

describe('analyse URL d’une annonce', () => {
  it('rend exactement deux conseils concrets', () => {
    const result = analyseListing(base);
    expect(result.tips).toHaveLength(2);
    expect(result.tips[0].action.length).toBeGreaterThan(50);
    expect(result.tips[1].observation).toContain('5 photo');
  });

  it('ne prétend jamais connaître la réaction du marché', () => {
    const result = analyseListing(base);
    expect(result.limit).toContain('réaction réelle du marché');
    expect(result.limit).toContain('prix');
  });

  it('utilise des conseils de relecture lorsque le contenu est déjà complet', () => {
    const result = analyseListing({
      ...base,
      title: 'Maison familiale avec jardin à dix minutes de la gare',
      photoCount: 14,
      description: `${'Maison rénovée, DPE C, commerces et école à pied. '.repeat(15)}Travaux terminés.`,
    });
    expect(result.tips).toHaveLength(2);
    expect(new Set(result.tips.map((tip) => tip.code)).size).toBe(2);
  });
});
