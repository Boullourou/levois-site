/**
 * Moteur de comparables LEVOIS — /votre-rue.
 *
 * Objectif : à partir des transactions DVF d'un secteur, ne retenir que les
 * ventes qui ressemblent réellement au bien décrit par l'utilisateur, en
 * réduisant progressivement l'échantillon. Chaque étape correspond à une
 * exigence supplémentaire de ressemblance ; les compteurs affichés dans
 * l'interface sont toujours de vrais compteurs de transactions retenues,
 * jamais des N artificiellement fixés.
 *
 * Méthodologie complète : voir src/lib/comparables.md
 *
 * Deux principes verrouillés :
 * — absence de donnée ⇒ poids retiré et score renormalisé, jamais pénalité
 *   fictive ;
 * — aucun prix estimé du bien n'est jamais produit — seulement une fourchette
 *   observée sur les références retenues, avec le nombre exact et un niveau
 *   de confiance issu du bootstrap.
 */

// ————————————————————————————————————————————————————————————————
// Types
// ————————————————————————————————————————————————————————————————
export type TypeBien = 'Maison' | 'Appartement';

export interface Transaction {
  id: string;
  d: string; // 'YYYY-MM-DD'
  v: number; // prix total €
  t: TypeBien | string;
  lat: number;
  lon: number;
  sb: number; // surface bâtie (habitable) m²
  p: number; // pièces
  st?: number; // terrain m² (maisons)
  lots?: number; // > 1 => vente composite
  co?: string;
  vo?: string;
  no?: string | number;
  cp?: string;
}

export interface Cible {
  type: TypeBien;
  sb: number;
  p: number;
  lat: number;
  lon: number;
  st?: number; // terrain — undefined si non renseigné (jamais 0 par défaut)
}

/** Étape de progression pour l'affichage. */
export interface EtapeProgression {
  cle: 'depart' | 'type' | 'surface' | 'pieces' | 'terrain' | 'score';
  libelle: string;
  n: number;
  elargi?: boolean;
  detail?: string;
}

// ————————————————————————————————————————————————————————————————
// Constantes — voir src/lib/comparables.md pour la calibration
// ————————————————————————————————————————————————————————————————
export const POIDS: Record<TypeBien, { surface: number; pieces: number; geo: number; terrain: number; recence: number }> = {
  Maison:      { surface: 35, pieces: 15, geo: 25, terrain: 15, recence: 10 },
  Appartement: { surface: 35, pieces: 20, geo: 35, terrain: 0,  recence: 10 },
};

/** Échelles de normalisation. Écart_norm = |Δ| / échelle ; clampé à 1. */
export const ECHELLES = {
  surface: 0.4, // proportion de la surface cible
  pieces: 3, // pièces
  geo: 1500, // mètres
  terrain: 1.0, // proportion du terrain cible
  recence: 4, // années
};

/** Année de référence pour la récence — la donnée va jusqu'à fin 2025. */
export const ANNEE_REF = 2025;

/** Seuils de score utilisés pour la sélection finale, du plus strict au plus permissif. */
export const SEUILS_SCORE = [75, 70, 65, 60] as const;

/** Seuil d'échantillon minimum pour produire une lecture chiffrée. */
export const N_MIN = 15;
/** Seuil d'échantillon jugé « solide » (bootstrap : incertitude ≤ 10 % sur la médiane). */
export const N_SOLIDE = 30;

// ————————————————————————————————————————————————————————————————
// Filtre initial
// ————————————————————————————————————————————————————————————————
/** Écarte les ventes composites (lots > 1) — audit dans comparables.md, section 1. */
export function retirerComposites(pool: Transaction[]): Transaction[] {
  return pool.filter((t) => !t.lots || t.lots <= 1);
}

/** Filtre strict par type (Maison ou Appartement). */
export function filtrerType(pool: Transaction[], type: TypeBien): Transaction[] {
  return pool.filter((t) => t.t === type);
}

// ————————————————————————————————————————————————————————————————
// Filtres de proximité — chaque filtre a une plage humainement lisible
// ————————————————————————————————————————————————————————————————
/**
 * Filtre par surface avec élargissement automatique jusqu'à obtenir n_min
 * références. Retourne la plage réelle acceptée (en m²) pour affichage.
 *
 * L'élargissement suit la séquence 0.5, 0.7, 1.0 en fraction d'échelle :
 * — 0.5 correspond à ±20 % de la surface cible (par défaut) ;
 * — 0.7 correspond à ±28 % ;
 * — 1.0 correspond à ±40 %.
 */
export function filtrerSurface(
  pool: Transaction[],
  cible: Cible,
  opts: { n_min?: number; toleranceInitiale?: number } = {},
): { pool: Transaction[]; plage: [number, number]; elargi: boolean; tolerance: number } {
  const n_min = opts.n_min ?? N_MIN;
  const t0 = opts.toleranceInitiale ?? 0.5;
  const paliers = [t0, 0.7, 1.0].filter((v, i, a) => a.indexOf(v) === i);
  for (let i = 0; i < paliers.length; i++) {
    const tol = paliers[i];
    const delta = cible.sb * ECHELLES.surface * tol;
    const min = Math.max(1, cible.sb - delta);
    const max = cible.sb + delta;
    const filtered = pool.filter((t) => t.sb >= min && t.sb <= max);
    const dernier = i === paliers.length - 1;
    if (filtered.length >= n_min || dernier) {
      return {
        pool: filtered,
        plage: [Math.round(min), Math.round(max)],
        elargi: i > 0,
        tolerance: tol,
      };
    }
  }
  // inatteignable
  return { pool: [], plage: [0, 0], elargi: false, tolerance: 1.0 };
}

/**
 * Filtre par pièces avec élargissement 1 → 2 → 3.
 */
export function filtrerPieces(
  pool: Transaction[],
  cible: Cible,
  opts: { n_min?: number } = {},
): { pool: Transaction[]; plage: [number, number]; elargi: boolean; tolerance: number } {
  const n_min = opts.n_min ?? N_MIN;
  const paliers = [1, 2, 3];
  for (let i = 0; i < paliers.length; i++) {
    const tol = paliers[i];
    const min = Math.max(1, cible.p - tol);
    const max = cible.p + tol;
    const filtered = pool.filter((t) => t.p >= min && t.p <= max);
    const dernier = i === paliers.length - 1;
    if (filtered.length >= n_min || dernier) {
      return { pool: filtered, plage: [min, max], elargi: i > 0, tolerance: tol };
    }
  }
  return { pool: [], plage: [0, 0], elargi: false, tolerance: 3 };
}

/**
 * Filtre par terrain (maisons uniquement, et seulement si la cible a renseigné
 * un terrain). Les transactions sans terrain renseigné sont CONSERVÉES —
 * absence de donnée ≠ terrain nul.
 * Élargissement 0.7 → 1.0 → 1.5.
 */
export function filtrerTerrain(
  pool: Transaction[],
  cible: Cible,
  opts: { n_min?: number } = {},
): { pool: Transaction[]; plage: [number, number] | null; elargi: boolean; tolerance: number; applique: boolean } {
  if (cible.type !== 'Maison' || !cible.st || cible.st <= 0) {
    return { pool, plage: null, elargi: false, tolerance: 0, applique: false };
  }
  const n_min = opts.n_min ?? N_MIN;
  const paliers = [0.7, 1.0, 1.5];
  for (let i = 0; i < paliers.length; i++) {
    const tol = paliers[i];
    const delta = cible.st * ECHELLES.terrain * tol;
    const min = Math.max(1, cible.st - delta);
    const max = cible.st + delta;
    const filtered = pool.filter((t) => {
      if (t.st == null || t.st <= 0) return true; // conservation par absence
      return t.st >= min && t.st <= max;
    });
    const dernier = i === paliers.length - 1;
    if (filtered.length >= n_min || dernier) {
      return {
        pool: filtered,
        plage: [Math.round(min), Math.round(max)],
        elargi: i > 0,
        tolerance: tol,
        applique: true,
      };
    }
  }
  return { pool, plage: null, elargi: false, tolerance: 1.5, applique: false };
}

// ————————————————————————————————————————————————————————————————
// Score global (0..100) — renormalisé si des poids sont désactivés
// ————————————————————————————————————————————————————————————————
export function distanceMetres(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371000;
  const toRad = Math.PI / 180;
  const dLat = (bLat - aLat) * toRad;
  const dLon = (bLon - aLon) * toRad;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const a = s1 * s1 + Math.cos(aLat * toRad) * Math.cos(bLat * toRad) * s2 * s2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function scoreDe(cible: Cible, t: Transaction): number {
  const poids = POIDS[cible.type];
  let malus = 0;
  let poidsUtilises = 0;

  // Surface — toujours actif (garanti par le tunnel : sb > 0 exigé sur la cible et sur la donnée)
  if (cible.sb > 0 && t.sb > 0) {
    const d = Math.abs(cible.sb - t.sb) / (cible.sb * ECHELLES.surface);
    malus += poids.surface * Math.min(1, d);
    poidsUtilises += poids.surface;
  }

  // Pièces
  if (cible.p > 0 && t.p > 0) {
    const d = Math.abs(cible.p - t.p) / ECHELLES.pieces;
    malus += poids.pieces * Math.min(1, d);
    poidsUtilises += poids.pieces;
  }

  // Géographique — Haversine
  if (t.lat && t.lon) {
    const d = distanceMetres(cible.lat, cible.lon, t.lat, t.lon) / ECHELLES.geo;
    malus += poids.geo * Math.min(1, d);
    poidsUtilises += poids.geo;
  }

  // Terrain — maisons, uniquement si les deux côtés ont la donnée
  if (poids.terrain > 0 && cible.st && cible.st > 0 && t.st && t.st > 0) {
    const d = Math.abs(cible.st - t.st) / (cible.st * ECHELLES.terrain);
    malus += poids.terrain * Math.min(1, d);
    poidsUtilises += poids.terrain;
  }

  // Récence — écart entre l'année de mutation et ANNEE_REF
  if (t.d) {
    const y = Number(t.d.slice(0, 4));
    if (Number.isFinite(y)) {
      const d = Math.abs(ANNEE_REF - y) / ECHELLES.recence;
      malus += poids.recence * Math.min(1, d);
      poidsUtilises += poids.recence;
    }
  }

  if (poidsUtilises <= 0) return 0;
  return 100 * (1 - malus / poidsUtilises);
}

/**
 * Sélection finale par seuil de score, avec élargissement automatique.
 * Retourne le tableau retenu, trié par score décroissant, plus le seuil
 * effectivement appliqué.
 */
export function selectionParScore(
  pool: Transaction[],
  cible: Cible,
  opts: { n_min?: number; seuils?: readonly number[] } = {},
): { retenues: Transaction[]; seuil: number; elargi: boolean } {
  const n_min = opts.n_min ?? N_MIN;
  const seuils = opts.seuils ?? SEUILS_SCORE;
  const scored = pool
    .map((t) => ({ t, s: scoreDe(cible, t) }))
    .sort((a, b) => b.s - a.s);
  for (let i = 0; i < seuils.length; i++) {
    const s = seuils[i];
    const filtered = scored.filter((x) => x.s >= s).map((x) => x.t);
    const dernier = i === seuils.length - 1;
    if (filtered.length >= n_min || dernier) {
      return { retenues: filtered, seuil: s, elargi: i > 0 };
    }
  }
  return { retenues: [], seuil: seuils[seuils.length - 1] ?? 60, elargi: false };
}

// ————————————————————————————————————————————————————————————————
// Lecture — fourchette centrale + repère central
// ————————————————————————————————————————————————————————————————
export type NiveauLecture = 'solide' | 'prudence' | 'insuffisant';

export interface Lecture {
  n: number;
  fourchette: [number, number]; // Q1, Q3 en €/m² (arrondis)
  repereCentral: number;
  niveau: NiveauLecture;
}

function quantile(arr: number[], p: number): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return lo === hi ? s[lo] : s[lo] * (hi - idx) + s[hi] * (idx - lo);
}

export function calculerLecture(retenues: Transaction[]): Lecture {
  const ppms = retenues
    .filter((t) => t.sb > 0 && t.v > 0)
    .map((t) => t.v / t.sb);
  const n = ppms.length;
  return {
    n,
    fourchette: [Math.round(quantile(ppms, 0.25)), Math.round(quantile(ppms, 0.75))],
    repereCentral: Math.round(quantile(ppms, 0.5)),
    niveau: n >= N_SOLIDE ? 'solide' : n >= N_MIN ? 'prudence' : 'insuffisant',
  };
}

// ————————————————————————————————————————————————————————————————
// Progression complète (utilisée par l'UI)
// ————————————————————————————————————————————————————————————————
/**
 * Chaîne les étapes 1..4 et retourne l'historique complet plus la lecture.
 * L'appelant peut aussi appeler chaque étape indépendamment pour animer.
 */
export function progressionComplete(
  dataset: Transaction[],
  cible: Cible,
): {
  etapes: EtapeProgression[];
  retenues: Transaction[];
  seuilFinal: number;
  lecture: Lecture;
} {
  const etapes: EtapeProgression[] = [];
  const propre = retirerComposites(dataset);
  etapes.push({ cle: 'depart', libelle: 'transactions autour de cette adresse', n: propre.length });

  const parType = filtrerType(propre, cible.type);
  etapes.push({
    cle: 'type',
    libelle: cible.type === 'Maison' ? 'maisons' : 'appartements',
    n: parType.length,
  });

  const parSurface = filtrerSurface(parType, cible);
  etapes.push({
    cle: 'surface',
    libelle: `entre ${parSurface.plage[0]} et ${parSurface.plage[1]} m²`,
    n: parSurface.pool.length,
    elargi: parSurface.elargi,
  });

  const parPieces = filtrerPieces(parSurface.pool, cible);
  const [pmin, pmax] = parPieces.plage;
  etapes.push({
    cle: 'pieces',
    libelle: pmin === pmax ? `${pmin} pièces` : `${pmin} à ${pmax} pièces`,
    n: parPieces.pool.length,
    elargi: parPieces.elargi,
  });

  let poolTerrain = parPieces.pool;
  if (cible.type === 'Maison' && cible.st && cible.st > 0) {
    const parTerrain = filtrerTerrain(parPieces.pool, cible);
    if (parTerrain.applique) {
      etapes.push({
        cle: 'terrain',
        libelle: parTerrain.plage
          ? `terrain de ${parTerrain.plage[0]} à ${parTerrain.plage[1]} m²`
          : 'terrain proche',
        n: parTerrain.pool.length,
        elargi: parTerrain.elargi,
      });
      poolTerrain = parTerrain.pool;
    }
  }

  const sel = selectionParScore(poolTerrain, cible);
  etapes.push({
    cle: 'score',
    libelle: 'suffisamment ressemblantes',
    n: sel.retenues.length,
    elargi: sel.elargi,
    detail: `score de ressemblance ≥ ${sel.seuil}`,
  });

  return { etapes, retenues: sel.retenues, seuilFinal: sel.seuil, lecture: calculerLecture(sel.retenues) };
}
