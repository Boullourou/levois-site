import { describe, expect, it } from 'vitest';
import { computeResult } from './engine';
import { getSituation, situations } from '../data/situations';

/**
 * Cas de recette du cahier des charges (§17).
 * La logique de ces trois exemples ne doit jamais être simplifiée :
 * toute modification des données de parcours doit maintenir ces résultats.
 */

describe('Exemple A — Préparation (§17.1)', () => {
  it('produit « Alignement avant publication » avec signaux convergents', () => {
    const situation = getSituation('preparer')!;
    const result = computeResult(situation, {
      calendrier: '3-6m',
      prix: 'aucune',
      'decision-difficile': 'presentation',
      pret: 'presque',
      documents: 'en-partie',
    });
    expect(result.regle.titre).toBe('Alignement avant publication');
    expect(result.niveau).toBe('convergents');
    expect(result.regle.resourceId).toBe('lancement-coherent');
    expect(result.regle.ctaLabel).toBe('Faire relire mon lancement');
    expect(result.reformulation).toContain('trois à six mois');
    expect(result.reformulation).toContain('prix n’est pas encore défini');
  });
});

describe('Exemple B — Peu de contacts (§17.2)', () => {
  it('produit « Transformation vue → contact » avec signal qui se répète', () => {
    const situation = getSituation('peu-contacts')!;
    const result = computeResult(situation, {
      duree: '2sem-1mois',
      vues: 'nombreuses',
      reactions: 'aucune',
      fragile: 'photo',
      'origine-prix': 'comparables',
    });
    expect(result.regle.titre).toBe('Transformation vue → contact');
    expect(result.niveau).toBe('repete');
    expect(result.regle.resourceId).toBe('premiere-impression-annonce');
    expect(result.regle.ctaLabel).toBe('Vérifier où l’intérêt disparaît');
    expect(result.reformulation).toContain('première photographie');
  });
});

describe('Exemple C — Visites sans offre (§17.3)', () => {
  it('produit « Perception de la valeur après visite » avec signaux convergents', () => {
    const situation = getSituation('visites')!;
    const result = computeResult(situation, {
      'nb-visites': '4-8',
      'seconde-visite': 'non',
      remarques: 'travaux',
      moment: 'apres-comparaison',
      modifier: 'prix',
    });
    expect(result.regle.titre).toBe('Perception de la valeur après visite');
    expect(result.niveau).toBe('convergents');
    expect(result.regle.resourceId).toBe('retours-de-visite');
    expect(result.reformulation).toContain('travaux');
    // Le système ne recommande jamais automatiquement une baisse de prix.
    expect(result.regle.action.toLowerCase()).not.toContain('baisser le prix');
  });
});

describe('Insuffisance de données', () => {
  it('affiche honnêtement le manque de données au lieu de conclure', () => {
    const situation = getSituation('peu-contacts')!;
    const result = computeResult(situation, {
      duree: '2sem-1mois',
      vues: 'pas-acces',
      reactions: 'aucune',
      fragile: 'ne-sait-pas',
      'origine-prix': 'prefere-pas',
    });
    expect(result.niveau).toBe('insuffisant');
    expect(result.regle.titre).toBe('Absence de données pour conclure');
  });
});

describe('Toutes les combinaisons produisent un résultat valide', () => {
  it('aucune combinaison de réponses ne casse le moteur', () => {
    for (const situation of situations) {
      // Échantillon : chaque option testée en position dominante.
      for (const q of situation.questions) {
        for (const opt of q.options) {
          const answers: Record<string, string> = {};
          for (const qq of situation.questions) {
            answers[qq.id] = qq.id === q.id ? opt.value : qq.options[0].value;
          }
          const r = computeResult(situation, answers);
          expect(r.regle.titre).toBeTruthy();
          expect(r.regle.action).toBeTruthy();
          expect(r.regle.resourceId).toBeTruthy();
        }
      }
    }
  });
});
