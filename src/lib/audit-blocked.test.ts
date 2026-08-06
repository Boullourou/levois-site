import { describe, expect, it } from 'vitest';
import { analyseBlockedListing } from './audit-blocked';

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
});
