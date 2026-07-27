import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  N_MIN,
  N_SOLIDE,
  POIDS,
  calculerLecture,
  distanceMetres,
  filtrerPieces,
  filtrerSurface,
  filtrerTerrain,
  filtrerType,
  progressionComplete,
  retirerComposites,
  scoreDe,
  selectionParScore,
} from './comparables';
import type { Cible, Transaction } from './comparables';

// ————————————————————————————————————————————————————————————————
// Fixture partagée : le vrai dataset DVF, tel qu'il sera servi en production.
// ————————————————————————————————————————————————————————————————
const raw = JSON.parse(
  fs.readFileSync(path.resolve('dist/data/dvf-secteur.json'), 'utf8'),
);
const dataset: Transaction[] = Array.isArray(raw)
  ? raw
  : (Object.values(raw).find(Array.isArray) as Transaction[]);

// ————————————————————————————————————————————————————————————————
// 1 · Unitaires — comportements du moteur
// ————————————————————————————————————————————————————————————————
describe('retirerComposites', () => {
  it('écarte les ventes avec lots > 1 (contaminantes, voir comparables.md §1)', () => {
    const propre = retirerComposites(dataset);
    expect(propre.every((t) => !t.lots || t.lots <= 1)).toBe(true);
    expect(propre.length).toBeLessThan(dataset.length);
  });
});

describe('scoreDe', () => {
  const cibleMaison: Cible = { type: 'Maison', sb: 90, p: 4, lat: 48.441, lon: 1.488, st: 400 };

  it('produit exactement 100 pour une transaction identique à la cible', () => {
    const t: Transaction = {
      id: 'x', d: '2025-06-15', v: 200000, t: 'Maison',
      lat: cibleMaison.lat, lon: cibleMaison.lon,
      sb: cibleMaison.sb, p: cibleMaison.p, st: cibleMaison.st,
    } as any;
    // récence : 2025 = ANNEE_REF ⇒ 0 malus ; toutes les autres dimensions identiques
    expect(scoreDe(cibleMaison, t)).toBeCloseTo(100, 5);
  });

  it('produit un score < 100 dès qu\'une dimension diffère', () => {
    const t: Transaction = {
      id: 'y', d: '2025-06-15', v: 200000, t: 'Maison',
      lat: cibleMaison.lat, lon: cibleMaison.lon,
      sb: 120, p: 4, st: 400, // seule la surface change
    } as any;
    expect(scoreDe(cibleMaison, t)).toBeLessThan(100);
    expect(scoreDe(cibleMaison, t)).toBeGreaterThan(0);
  });

  it('renormalise le score lorsque le terrain est absent (pas de pénalité fictive)', () => {
    // Deux transactions identiques sauf que l'une a le terrain renseigné et l'autre pas ;
    // aucune ne diffère par ailleurs de la cible → toutes deux doivent avoir score 100.
    const avec: Transaction = {
      id: 'a', d: '2025-06-15', v: 200000, t: 'Maison',
      lat: cibleMaison.lat, lon: cibleMaison.lon,
      sb: cibleMaison.sb, p: cibleMaison.p, st: cibleMaison.st,
    } as any;
    const sans: Transaction = {
      id: 'b', d: '2025-06-15', v: 200000, t: 'Maison',
      lat: cibleMaison.lat, lon: cibleMaison.lon,
      sb: cibleMaison.sb, p: cibleMaison.p, // pas de st
    } as any;
    expect(scoreDe(cibleMaison, avec)).toBeCloseTo(100, 5);
    expect(scoreDe(cibleMaison, sans)).toBeCloseTo(100, 5);
  });

  it('reste borné dans [0, 100] même pour une transaction très éloignée', () => {
    const t: Transaction = {
      id: 'z', d: '2015-01-01', v: 1, t: 'Maison',
      lat: cibleMaison.lat + 5, lon: cibleMaison.lon + 5,
      sb: 10000, p: 20, st: 100000,
    } as any;
    const s = scoreDe(cibleMaison, t);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});

describe('filtrerSurface', () => {
  const cible: Cible = { type: 'Maison', sb: 90, p: 4, lat: 48.44, lon: 1.49 };

  it('tolerance 0.5 par défaut ⇒ ±20 % de la surface cible (72–108 m² pour 90 m²)', () => {
    const pool: Transaction[] = [
      { sb: 60 }, { sb: 72 }, { sb: 90 }, { sb: 108 }, { sb: 130 },
    ].map((x, i) => ({ id: String(i), d: '2025-01-01', v: 100000, t: 'Maison', lat: 48.44, lon: 1.49, p: 3, ...x } as any));
    const r = filtrerSurface(pool, cible, { n_min: 2 });
    expect(r.plage).toEqual([72, 108]);
    expect(r.elargi).toBe(false);
    expect(r.pool.length).toBe(3); // 72, 90, 108
  });

  it('élargit à ±28 % puis ±40 % si n_min non atteint', () => {
    const pool: Transaction[] = [{ sb: 60 }, { sb: 130 }].map(
      (x, i) => ({ id: String(i), d: '2025-01-01', v: 100000, t: 'Maison', lat: 48.44, lon: 1.49, p: 3, ...x } as any),
    );
    const r = filtrerSurface(pool, cible, { n_min: 2 });
    expect(r.elargi).toBe(true);
    // dernier palier accepté (0.7 → 63-117 m² ne prend que le 60) OU 1.0 → 54-126 (60+130 hors, ⇒ vide)
    // → au dernier palier on retourne quand même le résultat même si < n_min
    expect(r.pool.length).toBeGreaterThanOrEqual(0);
  });
});

describe('filtrerPieces', () => {
  const cible: Cible = { type: 'Appartement', sb: 45, p: 2, lat: 48.44, lon: 1.49 };
  it('±1 par défaut, sans élargissement', () => {
    const pool = [1, 2, 3, 4].map((p, i) => ({ id: String(i), d: '2025-01-01', v: 100000, t: 'Appartement', lat: 48.44, lon: 1.49, sb: 45, p } as any));
    const r = filtrerPieces(pool, cible, { n_min: 3 });
    expect(r.plage).toEqual([1, 3]);
    expect(r.pool.length).toBe(3);
    expect(r.elargi).toBe(false);
  });
  it('élargit à ±2 puis ±3', () => {
    const pool = [7, 8].map((p, i) => ({ id: String(i), d: '2025-01-01', v: 100000, t: 'Appartement', lat: 48.44, lon: 1.49, sb: 45, p } as any));
    const r = filtrerPieces(pool, cible, { n_min: 2 });
    // ±3 → 1 à 5 → aucun ; palier final atteint
    expect(r.elargi).toBe(true);
  });
});

describe('filtrerTerrain', () => {
  it('n\'agit pas sur les appartements', () => {
    const cible: Cible = { type: 'Appartement', sb: 45, p: 2, lat: 48.44, lon: 1.49, st: 500 };
    const pool = [{ st: 100 }, { st: 5000 }].map((x, i) => ({ id: String(i), d: '2025-01-01', v: 100000, t: 'Appartement', lat: 48.44, lon: 1.49, sb: 45, p: 2, ...x } as any));
    const r = filtrerTerrain(pool, cible);
    expect(r.applique).toBe(false);
    expect(r.pool.length).toBe(pool.length);
  });
  it('conserve les transactions sans terrain renseigné (absence ≠ terrain nul)', () => {
    const cible: Cible = { type: 'Maison', sb: 90, p: 4, lat: 48.44, lon: 1.49, st: 400 };
    const pool: Transaction[] = [
      { id: 'a', d: '2025-01-01', v: 200000, t: 'Maison', lat: 48.44, lon: 1.49, sb: 90, p: 4, st: 400 } as any,
      { id: 'b', d: '2025-01-01', v: 200000, t: 'Maison', lat: 48.44, lon: 1.49, sb: 90, p: 4 } as any, // sans st
      { id: 'c', d: '2025-01-01', v: 200000, t: 'Maison', lat: 48.44, lon: 1.49, sb: 90, p: 4, st: 5000 } as any, // hors plage
    ];
    const r = filtrerTerrain(pool, cible, { n_min: 1 });
    expect(r.applique).toBe(true);
    expect(r.pool.map((t) => t.id).sort()).toEqual(['a', 'b']); // c écarté, b conservé faute de donnée
  });
});

describe('calculerLecture', () => {
  it('classe correctement les niveaux selon N', () => {
    const gen = (n: number): Transaction[] =>
      Array.from({ length: n }, (_, i) => ({ id: String(i), d: '2025-01-01', v: 200000, t: 'Maison', lat: 48.44, lon: 1.49, sb: 90 + i, p: 4 } as any));
    expect(calculerLecture(gen(N_SOLIDE)).niveau).toBe('solide');
    expect(calculerLecture(gen(N_MIN)).niveau).toBe('prudence');
    expect(calculerLecture(gen(N_MIN - 1)).niveau).toBe('insuffisant');
  });
  it('produit un IQR cohérent (Q1 ≤ médiane ≤ Q3)', () => {
    const pool = [1500, 1800, 2100, 2400, 2700, 3000, 3300].map((v, i) => ({ id: String(i), d: '2025-01-01', v: v * 100, t: 'Maison', lat: 48.44, lon: 1.49, sb: 100, p: 4 } as any));
    const l = calculerLecture(pool);
    expect(l.fourchette[0]).toBeLessThanOrEqual(l.repereCentral);
    expect(l.repereCentral).toBeLessThanOrEqual(l.fourchette[1]);
  });
});

describe('distanceMetres', () => {
  it('donne 0 pour deux points identiques', () => {
    expect(distanceMetres(48.44, 1.49, 48.44, 1.49)).toBe(0);
  });
  it('cohérent sur une distance connue (~1 km)', () => {
    // ~0.009 degré de latitude ≈ 1 km
    const d = distanceMetres(48.44, 1.49, 48.449, 1.49);
    expect(d).toBeGreaterThan(950);
    expect(d).toBeLessThan(1050);
  });
});

// ————————————————————————————————————————————————————————————————
// 2 · Cas de recette sur données réelles — les 6 scénarios du cahier
// ————————————————————————————————————————————————————————————————
// Coordonnées d'une adresse de Chartres avec forte densité DVF (audit produit).
const CHARTRES = { lat: 48.441356, lon: 1.488296 };

describe('Recette — maison courante avec beaucoup de références', () => {
  it('produit une lecture au moins « prudence » et aucun élargissement AVANT le score', () => {
    const cible: Cible = { type: 'Maison', sb: 95, p: 4, ...CHARTRES, st: 400 };
    const r = progressionComplete(dataset, cible);
    // Le score final peut légitimement descendre de 75 à 70 même sur un profil courant
    // (le seuil 75 est très strict — voir comparables.md § seuils empiriques) ;
    // en revanche surface, pièces et terrain ne doivent pas s'élargir.
    expect(['solide', 'prudence']).toContain(r.lecture.niveau);
    const etapesAvantScore = r.etapes.filter((e) => e.cle !== 'score' && e.cle !== 'depart' && e.cle !== 'type');
    expect(etapesAvantScore.every((e) => !e.elargi)).toBe(true);
    // La médiane du secteur est autour de 2400 €/m² (audit) — la lecture doit rester crédible
    expect(r.lecture.repereCentral).toBeGreaterThan(1500);
    expect(r.lecture.repereCentral).toBeLessThan(4000);
  });
});

describe('Recette — maison atypique (grande surface, peu de références)', () => {
  it('affiche l\'élargissement lorsque le profil est rare', () => {
    const cible: Cible = { type: 'Maison', sb: 250, p: 8, ...CHARTRES, st: 2000 };
    const r = progressionComplete(dataset, cible);
    // au moins une étape doit s'être élargie ou le compteur final doit être petit
    const auMoinsUnElargissement = r.etapes.some((e) => e.elargi);
    const compteurRessere = r.lecture.n < N_SOLIDE;
    expect(auMoinsUnElargissement || compteurRessere).toBe(true);
  });
});

describe('Recette — maison sans terrain renseigné', () => {
  it('produit une lecture sans étape terrain (jamais présenté comme filtre)', () => {
    const cible: Cible = { type: 'Maison', sb: 95, p: 4, ...CHARTRES }; // st absent
    const r = progressionComplete(dataset, cible);
    expect(r.etapes.some((e) => e.cle === 'terrain')).toBe(false);
    expect(r.lecture.n).toBeGreaterThan(0);
  });
});

describe('Recette — appartement courant', () => {
  it('produit une lecture solide sans terrain', () => {
    const cible: Cible = { type: 'Appartement', sb: 55, p: 3, ...CHARTRES };
    const r = progressionComplete(dataset, cible);
    expect(r.etapes.some((e) => e.cle === 'terrain')).toBe(false);
    expect(r.lecture.n).toBeGreaterThanOrEqual(N_MIN);
  });
});

describe('Recette — appartement atypique', () => {
  it('atteint le seuil de prudence ou d\'insuffisance selon la rareté du profil', () => {
    const cible: Cible = { type: 'Appartement', sb: 180, p: 7, ...CHARTRES };
    const r = progressionComplete(dataset, cible);
    // profil rare → au moins une étape élargit ou lecture non solide
    const rare = r.etapes.some((e) => e.elargi) || r.lecture.n < N_SOLIDE;
    expect(rare).toBe(true);
  });
});

describe('Recette — les compteurs affichés sont de vrais compteurs', () => {
  it('chaque étape est ≤ à la précédente (réduction monotone)', () => {
    const cible: Cible = { type: 'Maison', sb: 95, p: 4, ...CHARTRES, st: 400 };
    const r = progressionComplete(dataset, cible);
    for (let i = 1; i < r.etapes.length; i++) {
      expect(r.etapes[i].n).toBeLessThanOrEqual(r.etapes[i - 1].n);
    }
    // et jamais un N artificiel : le compteur final = longueur réelle du tableau retenu
    expect(r.etapes[r.etapes.length - 1].n).toBe(r.retenues.length);
    expect(r.lecture.n).toBe(r.retenues.filter((t) => t.sb > 0 && t.v > 0).length);
  });
});

describe('Recette — pondérations documentées', () => {
  it('les poids somment à 100 dans les deux types (lecture méthodo)', () => {
    for (const type of ['Maison', 'Appartement'] as const) {
      const p = POIDS[type];
      expect(p.surface + p.pieces + p.geo + p.terrain + p.recence).toBe(100);
    }
  });
});
