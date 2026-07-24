/**
 * Pipeline DVF LEVOIS — génère le jeu de données local de /votre-rue.
 *
 * Source : Demandes de Valeurs Foncières (DVF), DGFiP, exposées géolocalisées
 *          par Etalab (« geo-dvf »). Licence ouverte / Etalab.
 *          https://files.data.gouv.fr/geo-dvf/latest/csv/{annee}/departements/28.csv.gz
 *
 * Chaîne : téléchargement → filtrage communes cibles → regroupement par MUTATION
 *          (id_mutation, jamais la ligne brute) → nettoyage → JSON compact +
 *          fichier meta daté → destinés au build public.
 *
 * Règles :
 *  — Une vente = une mutation. Plusieurs parcelles / locaux d'une même mutation
 *    ne produisent qu'UNE entrée (dédoublonnage par id_mutation).
 *  — Aucune donnée absente n'est déduite ni inventée : les champs manquants
 *    restent absents.
 *  — Ne sont conservés que des biens présentables au grand public
 *    (Maison / Appartement, nature « Vente », prix > 0, coordonnées présentes).
 *  — En cas d'échec réseau total, les fichiers existants ne sont PAS écrasés
 *    (le script sort proprement sans casser un éventuel build).
 *
 * Reproductible : `npm run data:dvf`. Nécessite un accès Internet ouvert
 * (l'environnement d'agent LEVOIS bloque files.data.gouv.fr : lancer ce script
 * en local ou dans un environnement CI/Netlify disposant du réseau).
 */

import { gunzipSync } from 'node:zlib';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'data');
const OUT_DATA = join(OUT_DIR, 'dvf-secteur.json');
const OUT_META = join(OUT_DIR, 'dvf-meta.json');

const DEPARTEMENT = '28';
const SOURCE_BASE = 'https://files.data.gouv.fr/geo-dvf/latest/csv';
const SOURCE_URL = `${SOURCE_BASE}/{annee}/departements/${DEPARTEMENT}.csv.gz`;

// Communes cibles — le build public ne conserve QUE ces communes.
const COMMUNES_CIBLES = ['Lèves', 'Chartres', 'Mainvilliers', 'Lucé', 'Champhol', 'Le Coudray', 'Luisant'];

// Années tentées (les 404 sont ignorées : geo-dvf « latest » couvre ~5 ans).
const ANNEE_COURANTE = new Date().getFullYear();
const ANNEES = [0, 1, 2, 3, 4, 5].map((d) => ANNEE_COURANTE - d);

// Types de biens présentables au grand public.
const TYPES_HABITATION = new Set(['Maison', 'Appartement']);

const norm = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const COMMUNES_NORM = new Set(COMMUNES_CIBLES.map(norm));

/** Parse une ligne CSV (gestion des guillemets RFC4180). */
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { out.push(cur); cur = ''; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

async function fetchAnnee(annee) {
  const url = SOURCE_URL.replace('{annee}', String(annee));
  const rep = await fetch(url);
  if (rep.status === 404) return null; // année non publiée
  if (!rep.ok) throw new Error(`HTTP ${rep.status} sur ${url}`);
  const buf = Buffer.from(await rep.arrayBuffer());
  return gunzipSync(buf).toString('utf-8');
}

/**
 * Regroupe les lignes d'une même mutation en une transaction unique.
 * @param {Map<string, object[]>} lignesParMutation
 */
function agregerMutations(lignesParMutation) {
  const transactions = [];

  for (const [idMutation, lignes] of lignesParMutation) {
    // nature « Vente » uniquement
    if (norm(lignes[0].nature_mutation) !== 'vente') continue;

    // valeur foncière (identique par ligne d'une mutation) — on prend le max non nul
    let valeur = 0;
    for (const l of lignes) {
      const v = Number(l.valeur_fonciere);
      if (Number.isFinite(v) && v > valeur) valeur = v;
    }
    if (valeur < 5000) continue; // écarte artefacts / cessions non marchandes

    // locaux d'habitation de la mutation
    const habitations = lignes.filter((l) => TYPES_HABITATION.has(l.type_local));
    if (habitations.length === 0) continue; // on ne présente que Maison/Appartement

    // local principal = plus grande surface bâtie
    habitations.sort(
      (a, b) => (Number(b.surface_reelle_bati) || 0) - (Number(a.surface_reelle_bati) || 0)
    );
    const principal = habitations[0];

    // coordonnées : local principal, sinon première ligne géolocalisée
    let lon = Number(principal.longitude);
    let lat = Number(principal.latitude);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      const geo = lignes.find(
        (l) => Number.isFinite(Number(l.longitude)) && Number.isFinite(Number(l.latitude))
      );
      if (!geo) continue; // impossible à situer → on écarte
      lon = Number(geo.longitude);
      lat = Number(geo.latitude);
    }

    // surface terrain = somme des parcelles DISTINCTES (anti double-comptage)
    const parcellesVues = new Set();
    let surfaceTerrain = 0;
    for (const l of lignes) {
      const idp = l.id_parcelle || `${l.adresse_nom_voie}#${l.surface_terrain}`;
      if (parcellesVues.has(idp)) continue;
      parcellesVues.add(idp);
      const st = Number(l.surface_terrain);
      if (Number.isFinite(st) && st > 0) surfaceTerrain += st;
    }

    // adresse lisible
    const numero = [principal.adresse_numero, principal.adresse_suffixe]
      .filter(Boolean)
      .join('');
    const voie = (principal.adresse_nom_voie || '').trim();

    const surfaceBati = Number(principal.surface_reelle_bati);
    const pieces = Number(principal.nombre_pieces_principales);

    const t = {
      id: idMutation,
      d: principal.date_mutation, // AAAA-MM-JJ
      v: Math.round(valeur),
      t: principal.type_local,
      lat: Number(lat.toFixed(6)),
      lon: Number(lon.toFixed(6)),
    };
    if (numero) t.no = numero;
    if (voie) t.vo = voie;
    if (principal.code_postal) t.cp = principal.code_postal;
    if (principal.nom_commune) t.co = principal.nom_commune;
    if (Number.isFinite(surfaceBati) && surfaceBati > 0) t.sb = Math.round(surfaceBati);
    if (Number.isFinite(pieces) && pieces > 0) t.p = pieces;
    if (surfaceTerrain > 0) t.st = Math.round(surfaceTerrain);
    if (habitations.length > 1) t.lots = habitations.length; // honnêteté : bien multi-lots

    transactions.push(t);
  }

  // tri par date décroissante (la plus récente d'abord)
  transactions.sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : 0));
  return transactions;
}

async function main() {
  console.log('[dvf] Communes cibles :', COMMUNES_CIBLES.join(', '));
  console.log('[dvf] Années tentées :', ANNEES.join(', '));

  const lignesParMutation = new Map();
  const anneesReussies = [];
  let echecs = 0;

  for (const annee of ANNEES) {
    try {
      const csv = await fetchAnnee(annee);
      if (csv === null) {
        console.log(`[dvf] ${annee} : non publiée (404) — ignorée`);
        continue;
      }
      const lignes = csv.split('\n');
      const header = parseCsvLine(lignes[0]);
      const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
      const champs = [
        'id_mutation', 'date_mutation', 'nature_mutation', 'valeur_fonciere',
        'adresse_numero', 'adresse_suffixe', 'adresse_nom_voie', 'code_postal',
        'code_commune', 'nom_commune', 'id_parcelle', 'type_local',
        'surface_reelle_bati', 'nombre_pieces_principales', 'surface_terrain',
        'longitude', 'latitude',
      ];

      let retenues = 0;
      for (let i = 1; i < lignes.length; i++) {
        if (!lignes[i]) continue;
        const cols = parseCsvLine(lignes[i]);
        const commune = cols[idx['nom_commune']];
        if (!COMMUNES_NORM.has(norm(commune))) continue; // hors secteur → jeté tout de suite

        const row = {};
        for (const c of champs) row[c] = cols[idx[c]];
        const id = row.id_mutation;
        if (!id) continue;
        if (!lignesParMutation.has(id)) lignesParMutation.set(id, []);
        lignesParMutation.get(id).push(row);
        retenues++;
      }
      console.log(`[dvf] ${annee} : ${retenues} lignes retenues (secteur)`);
      anneesReussies.push(annee);
    } catch (err) {
      echecs++;
      console.warn(`[dvf] ${annee} : échec — ${err.message}`);
    }
  }

  if (anneesReussies.length === 0) {
    console.error(
      '\n[dvf] Aucune année téléchargée. Les fichiers existants ne sont PAS modifiés.\n' +
      '      Cause probable : accès réseau à files.data.gouv.fr indisponible dans cet\n' +
      '      environnement. Relancer `npm run data:dvf` avec un accès Internet ouvert.'
    );
    process.exit(0); // sortie propre : ne casse pas un build éventuel
  }

  const transactions = agregerMutations(lignesParMutation);

  if (transactions.length === 0) {
    console.error('[dvf] Aucune transaction exploitable après filtrage — fichiers inchangés.');
    process.exit(0);
  }

  const dates = transactions.map((t) => t.d).filter(Boolean).sort();
  const meta = {
    status: 'ready',
    generatedAt: new Date().toISOString(),
    source: 'Demandes de valeurs foncières (DVF) — DGFiP, géolocalisées par Etalab (geo-dvf)',
    sourceUrl: `${SOURCE_BASE}/`,
    licence: 'Licence ouverte / Etalab 2.0',
    departement: DEPARTEMENT,
    communes: COMMUNES_CIBLES,
    anneesIncluses: anneesReussies.sort(),
    count: transactions.length,
    dateVenteLaPlusRecente: dates[dates.length - 1] || null,
    dateVenteLaPlusAncienne: dates[0] || null,
    note:
      'Chaque entrée représente une mutation (vente) unique, regroupée depuis les ' +
      'lignes DVF. Les biens sans coordonnées, sans local d’habitation ou de prix ' +
      'nul sont écartés. La base DVF n’est pas exhaustive : certaines ventes ' +
      'peuvent en être absentes.',
  };

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_DATA, JSON.stringify(transactions), 'utf-8');
  writeFileSync(OUT_META, JSON.stringify(meta, null, 2), 'utf-8');

  console.log(
    `\n[dvf] ✓ ${transactions.length} transactions écrites.\n` +
    `      Période : ${meta.dateVenteLaPlusAncienne} → ${meta.dateVenteLaPlusRecente}\n` +
    `      ${OUT_DATA}\n      ${OUT_META}`
  );
  if (echecs > 0) console.log(`[dvf] (${echecs} année(s) en échec réseau, ignorée(s))`);
}

main().catch((err) => {
  console.error('[dvf] Erreur inattendue :', err);
  process.exit(1);
});
