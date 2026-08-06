import { describe, expect, it } from 'vitest';
import { analyseBlockedListing, analyseHybridListing, getContextQuestion } from './audit-blocked';

describe('secours court de l’audit URL', () => {
  it('renvoie la ressource exacte pour des vues sans contact', () => {
    const result = analyseBlockedListing('7-30', 'vues-sans-contact');
    expect(result.resource.href).toBe('/ressources/annonce-vue-peu-de-contacts');
    expect(result.analysis.tips).toHaveLength(2);
  });

  it('évite toute conclusion prématurée pendant la première semaine', () => {
    const result = analyseBlockedListing('moins-7', 'peu-vues');
    expect(result.analysis.title).toContain('tôt');
    expect(result.resource.href).toBe('/ressources/lancement-coherent');
  });

  it('oriente une offre vers la décision, même pendant la première semaine', () => {
    const result = analyseBlockedListing('moins-7', 'offre-recue');
    expect(result.resource.href).toBe('/situer-ma-vente');
    expect(result.analysis.title).toContain('décision');
  });

  it('pose une troisième question différente selon l’étape', () => {
    expect(getContextQuestion('peu-vues').question).toContain('diffusée');
    expect(getContextQuestion('visites-sans-offre').question).toContain('visites');
  });

  it('utilise la réponse contextuelle pour différencier le second conseil', () => {
    const snapshot = { url: 'https://example.test', source: 'example.test', title: '', description: '' };
    const price = analyseHybridListing(snapshot, '7-30', 'vues-sans-contact', 'prix-modifie');
    const unchanged = analyseHybridListing(snapshot, '7-30', 'vues-sans-contact', 'rien-modifie');
    expect(price.analysis.tips[1].code).toBe('price-changed');
    expect(unchanged.analysis.tips[1].code).toBe('unchanged');
  });

  it('croise le contenu accessible avec les réponses lorsque cela apporte une preuve', () => {
    const result = analyseHybridListing({
      url: 'https://example.test', source: 'example.test', title: 'Maison à vendre',
      description: 'Maison avec séjour.', photoCount: 4,
    }, '7-30', 'vues-sans-contact', 'rien-modifie');
    expect(result.analysis.facts).toContain('Page accessible : example.test');
    expect(['title', 'photos', 'description-depth']).toContain(result.analysis.tips[1].code);
  });
});
