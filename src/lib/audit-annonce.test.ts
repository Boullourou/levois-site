import { describe, expect, it } from 'vitest';
import { computeAudit, type AuditAnswers } from './audit-annonce';

const base: AuditAnswers = {
  commune: 'Lèves', typeBien: 'maison', duree: '31-60', vues: 'moyennes',
  contacts: 'aucun', visites: 'aucune', offres: 'aucune', photos: 'onze-plus',
  description: 'complete', retours: 'aucun', prixModifie: 'non',
};

describe('moteur d’audit d’annonce', () => {
  it('localise le décrochage entre les vues et les contacts', () => {
    const resultat = computeAudit(base);
    expect(resultat.code).toBe('premiere-impression');
    expect(resultat.titre).toContain('vue');
    expect(resultat.etape).toBe(1);
  });

  it('ne transforme jamais des visites sans offre en baisse automatique', () => {
    const resultat = computeAudit({ ...base, contacts: 'quatre-plus', visites: 'trois-plus', retours: 'prix' });
    expect(resultat.code).toBe('apres-visite');
    expect([...resultat.actions, resultat.resume].join(' ').toLowerCase()).not.toContain('baisser');
    expect(resultat.signaux.some((signal) => signal.statut === 'observe')).toBe(true);
  });

  it('préfère annoncer le manque de données plutôt que d’inventer un diagnostic', () => {
    const resultat = computeAudit({ ...base, vues: 'inconnu', contacts: 'inconnu', visites: 'inconnu' });
    expect(resultat.code).toBe('insuffisant');
    expect(resultat.titre).toContain('manque');
  });

  it('sépare une offre reçue du diagnostic de visibilité', () => {
    const resultat = computeAudit({ ...base, contacts: 'un-trois', offres: 'ecrite', visites: 'une-deux' });
    expect(resultat.code).toBe('traction');
    expect(resultat.etape).toBe(4);
  });

  it('refuse de diagnostiquer un parcours contradictoire', () => {
    const resultat = computeAudit({ ...base, contacts: 'aucun', visites: 'trois-plus' });
    expect(resultat.code).toBe('incoherent');
    expect(resultat.titre).toContain('vérifier');
  });

  it('traite aussi une offre inconnue comme une donnée manquante', () => {
    const resultat = computeAudit({ ...base, offres: 'inconnu' });
    expect(resultat.code).toBe('insuffisant');
  });
});
