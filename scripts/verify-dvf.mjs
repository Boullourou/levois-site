/**
 * Vérification du dataset DVF de /votre-rue.
 *
 * Contrôle factuel, hors ligne, du JSON généré par build-dvf.mjs :
 *   — intégrité : nombre de transactions, période, répartition par commune,
 *     absence de doublons (id_mutation), taux de complétude des champs ;
 *   — simulation de proximité IDENTIQUE à la page /votre-rue : pour chaque
 *     commune cible, on prend un point de référence réel (la vente la plus
 *     récente de la commune) et on rejoue la recherche par paliers, puis on
 *     affiche la vente principale (la plus récente à proximité) + les autres,
 *     avec date, prix, adresse, type, surface et distance.
 *
 * Aucune donnée inventée : lit uniquement public/data/dvf-secteur.json.
 * Usage : npm run data:verify
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'public', 'data', 'dvf-secteur.json');
const META = join(__dirname, '..', 'public', 'data', 'dvf-meta.json');

const eur = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const moisAn = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

// ——— mêmes primitives que la page ———
function distance(aLat, aLon, bLat, bLon) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function rechercher(dataset, lat, lon) {
  const paliers = [700, 1500, 3000];
  let proches = [];
  let rayonUtilise = 0;
  for (const rayon of paliers) {
    proches = dataset
      .map((t) => ({ ...t, _dist: distance(lat, lon, t.lat, t.lon) }))
      .filter((t) => t._dist <= rayon);
    if (proches.length > 0) { rayonUtilise = rayon; break; }
  }
  if (proches.length === 0) return null;
  const parDate = [...proches].sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : a._dist - b._dist));
  return { principal: parDate[0], autres: parDate.slice(1, 4), total: proches.length, rayon: rayonUtilise };
}

const distLisible = (m) => (m < 1000 ? `${Math.round(m / 50) * 50} m` : `${(m / 1000).toFixed(1)} km`);
const dateLisible = (d) => { const dt = new Date(d + 'T00:00:00'); return isNaN(dt) ? d : moisAn.format(dt); };
function ligneBien(t) {
  const b = [t.t];
  if (t.sb) b.push(`${t.sb} m²`);
  if (t.p) b.push(`${t.p} p.`);
  if (t.st) b.push(`terrain ${eur.format(t.st)} m²`);
  if (t.lots) b.push(`${t.lots} lots`);
  return b.join(' · ');
}
const adresse = (t) => [[t.no, t.vo].filter(Boolean).join(' '), [t.cp, t.co].filter(Boolean).join(' ')].filter(Boolean).join(', ');

function afficherVente(t, prefixe = '') {
  console.log(`${prefixe}${eur.format(t.v)} €${t.sb ? ` (${eur.format(Math.round(t.v / t.sb))} €/m²)` : ''} · ${ligneBien(t)}`);
  console.log(`${prefixe}${adresse(t) || 'adresse approx.'} · vendu en ${dateLisible(t.d)}${t._dist != null ? ` · à ~${distLisible(t._dist)}` : ''}`);
}

function main() {
  const meta = JSON.parse(readFileSync(META, 'utf-8'));
  const data = JSON.parse(readFileSync(DATA, 'utf-8'));

  console.log('══════════════════════════════════════════════════════');
  console.log(' VÉRIFICATION DU DATASET DVF — /votre-rue');
  console.log('══════════════════════════════════════════════════════\n');

  console.log(`Statut meta        : ${meta.status}`);
  console.log(`Généré le          : ${meta.generatedAt || '—'}`);
  console.log(`Communes cibles    : ${(meta.communes || []).join(', ')}\n`);

  if (meta.status !== 'ready' || data.length === 0) {
    console.log('⏳ Dataset non encore généré (placeholder). Lancer `npm run data:dvf`');
    console.log('   dans un environnement avec accès Internet, committer public/data/,');
    console.log('   puis relancer `npm run data:verify`.');
    return;
  }

  // ——— 1. Intégrité ———
  console.log('── 1. Intégrité ─────────────────────────────────────');
  console.log(`Transactions       : ${data.length}`);
  const dates = data.map((t) => t.d).filter(Boolean).sort();
  console.log(`Période            : ${dates[0]} → ${dates[dates.length - 1]}`);

  const ids = new Map();
  for (const t of data) ids.set(t.id, (ids.get(t.id) || 0) + 1);
  const doublons = [...ids.entries()].filter(([, n]) => n > 1);
  console.log(`Doublons id_mutation: ${doublons.length === 0 ? '✓ aucun' : '✗ ' + doublons.length + ' → ' + doublons.slice(0, 5).map(([id]) => id).join(', ')}`);

  const parCommune = {};
  for (const t of data) parCommune[t.co] = (parCommune[t.co] || 0) + 1;
  console.log('Par commune        :');
  for (const [c, n] of Object.entries(parCommune).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${String(n).padStart(5)}  ${c}`);
  }

  const pct = (k) => `${Math.round((data.filter((t) => t[k] != null).length / data.length) * 100)}%`;
  console.log(`Complétude champs  : surface bâtie ${pct('sb')} · pièces ${pct('p')} · terrain ${pct('st')}`);

  const sansCoord = data.filter((t) => !Number.isFinite(t.lat) || !Number.isFinite(t.lon)).length;
  const prixInvalide = data.filter((t) => !(t.v > 0)).length;
  console.log(`Sans coordonnées   : ${sansCoord === 0 ? '✓ 0' : '✗ ' + sansCoord}`);
  console.log(`Prix ≤ 0           : ${prixInvalide === 0 ? '✓ 0' : '✗ ' + prixInvalide}\n`);

  // ——— 2. Simulation de proximité par commune ———
  console.log('── 2. Simulation /votre-rue (point réel = vente la plus récente de la commune) ──\n');
  for (const commune of meta.communes) {
    const ventesCommune = data.filter((t) => t.co === commune);
    if (ventesCommune.length === 0) { console.log(`• ${commune} : aucune vente dans le dataset\n`); continue; }
    const ancre = [...ventesCommune].sort((a, b) => (a.d < b.d ? 1 : -1))[0];
    const r = rechercher(data, ancre.lat, ancre.lon);
    console.log(`• ${commune}  (référence : ${adresse(ancre)})`);
    if (!r) { console.log('   aucune vente à proximité\n'); continue; }
    console.log(`   rayon retenu ${r.rayon} m · ${r.total} vente(s) à proximité`);
    process.stdout.write('   PRINCIPALE  ');
    afficherVente(r.principal, '   ');
    // contrôle : la principale est-elle bien la plus récente des proches ?
    const plusRecente = r.principal.d >= (r.autres[0]?.d || '0000');
    console.log(`   → la plus récente à proximité : ${plusRecente ? '✓' : '✗ INCOHÉRENT'}`);
    if (r.autres.length) {
      console.log('   Autres :');
      for (const a of r.autres) afficherVente(a, '     - ');
    }
    console.log('');
  }

  console.log('── Résumé ───────────────────────────────────────────');
  console.log(`${data.length} ventes · ${doublons.length === 0 ? 'sans doublon' : doublons.length + ' DOUBLONS'} · ${Object.keys(parCommune).length} communes couvertes`);
}

main();
