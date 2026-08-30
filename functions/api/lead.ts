import { PayloadTooLargeError, readBoundedJson } from '../lib/bounded-json';

/**
 * POST /api/lead — Cloudflare Pages Function.
 *
 * Validation serveur, honeypot, limitation pseudonymisée et envoi Resend.
 * Un succès n'est renvoyé que lorsque Resend a confirmé l'envoi.
 *
 * Bindings Cloudflare Pages (Dashboard → Settings → Functions) :
 *   RESEND_API_KEY  : secret Resend (voie principale)
 *   LEAD_TO_EMAIL   : destinataire (défaut : mouaad@levois.fr)
 *   LEAD_FROM_EMAIL : expéditeur vérifié (défaut : onboarding@resend.dev)
 *   LEAD_TO / LEAD_FROM : alias partagés avec /api/recherche, si déjà définis
 *   RATE_LIMIT      : KV optionnel ; à défaut, limitation best effort en mémoire
 */

interface Env {
  RESEND_API_KEY?: string;
  LEAD_TO_EMAIL?: string;
  LEAD_FROM_EMAIL?: string;
  LEAD_TO?: string;
  LEAD_FROM?: string;
  RATE_LIMIT?: KVNamespace;
}

interface PagesContext<E> {
  request: Request;
  env: E;
}

interface RateEntry {
  count: number;
  ts: number;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

const rate = new Map<string, RateEntry>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_TTL_SECONDS = Math.ceil(RATE_WINDOW_MS / 1000);
const CHEMINS_ATTRIBUTION = new Set([
  '/', '/other', '/404', '/accompagnement', '/audit-annonce', '/carte', '/composants',
  '/confidentialite', '/contact', '/ma-recherche', '/mentions-legales', '/methode', '/mouaad',
  '/recommander', '/rejoindre', '/ressources', '/ressources/lancement-coherent',
  '/ressources/premiere-impression-annonce', '/ressources/annonce-vue-peu-de-contacts',
  '/ressources/retours-de-visite', '/ressources/verifier-avant-baisse-prix',
  '/ressources/reprendre-commercialisation', '/situer-ma-vente',
  '/situer-ma-vente/resultat', '/votre-rue',
]);

function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...headers,
    },
  });
}

function texte(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

function texteLigne(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function sujetTexte(v: string): string {
  return v.replace(/[\r\n]+/g, ' ').trim();
}

function nombreFini(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function nombreFr(v: number, decimales = 0): string {
  return v.toLocaleString('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

function formaterQualification(v: unknown): string[] {
  if (!estObjet(v)) return [];
  const lignes: string[] = [];
  for (const [clefBrute, valeurBrute] of Object.entries(v).slice(0, 20)) {
    const clef = texteLigne(clefBrute, 80);
    const valeur = texteLigne(valeurBrute, 240);
    if (clef && valeur) lignes.push(`  · ${clef} : ${valeur}`);
  }
  return lignes;
}

function formaterPrixM2(libelle: string, v: unknown): string {
  if (!estObjet(v)) return '';
  const median = nombreFini(v.median);
  const q1 = nombreFini(v.q1);
  const q3 = nombreFini(v.q3);
  const details: string[] = [];
  if (median !== null) details.push(`médiane ${nombreFr(Math.round(median))} €/m²`);
  if (q1 !== null) details.push(`Q1 ${nombreFr(Math.round(q1))} €/m²`);
  if (q3 !== null) details.push(`Q3 ${nombreFr(Math.round(q3))} €/m²`);
  return details.length ? `${libelle} : ${details.join(' · ')}` : '';
}

function formaterInfographie(v: unknown): string[] {
  if (!estObjet(v)) return [];
  const lignes: string[] = [];
  const nbVentes = nombreFini(v.nbVentes);
  const rayon = nombreFini(v.rayon);
  if (nbVentes !== null) lignes.push(`Ventes analysées : ${nombreFr(Math.round(nbVentes))}`);
  if (rayon !== null) {
    const rayonFormate = rayon >= 1000
      ? `${nombreFr(rayon / 1000, Number.isInteger(rayon / 1000) ? 0 : 1)} km`
      : `${nombreFr(Math.round(rayon))} m`;
    lignes.push(`Rayon observé : ${rayonFormate}`);
  }

  if (estObjet(v.composition)) {
    const maisons = nombreFini(v.composition.maisons);
    const appartements = nombreFini(v.composition.appartements);
    const composition: string[] = [];
    if (maisons !== null) composition.push(`${nombreFr(Math.round(maisons))} maisons`);
    if (appartements !== null) composition.push(`${nombreFr(Math.round(appartements))} appartements`);
    if (composition.length) lignes.push(`Composition : ${composition.join(' · ')}`);
  }

  const maisons = formaterPrixM2('Maisons', v.ppmMaisons);
  const appartements = formaterPrixM2('Appartements', v.ppmAppartements);
  if (maisons) lignes.push(maisons);
  if (appartements) lignes.push(appartements);

  if (estObjet(v.tendance)) {
    const direction = texteLigne(v.tendance.direction, 40);
    const pct = nombreFini(v.tendance.pct);
    const details: string[] = [];
    if (direction) details.push(direction);
    if (pct !== null) details.push(`${pct > 0 ? '+' : ''}${nombreFr(pct, 1)} %`);
    if (details.length) lignes.push(`Tendance observée : ${details.join(' · ')}`);
  }
  return lignes;
}

function formaterListe(v: unknown, max = 8): string[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, max).map((item) => texteLigne(item, 500)).filter(Boolean);
}

function formaterAudit(v: unknown): string[] {
  if (!estObjet(v)) return [];
  const lignes: string[] = [];
  const code = texteLigne(v.code, 80);
  const titre = texteLigne(v.titre, 300);
  const resume = texteLigne(v.resume, 1000);
  if (code) lignes.push(`Code de lecture : ${code}`);
  if (titre) lignes.push(`Résultat : ${titre}`);
  if (resume) lignes.push(`Résumé : ${resume}`);
  const faits = formaterListe(v.faits);
  if (faits.length) lignes.push('', 'Faits déclarés :', ...faits.map((item) => `  · ${item}`));
  const actions = formaterListe(v.actions);
  if (actions.length) lignes.push('', 'Vérifications proposées :', ...actions.map((item) => `  · ${item}`));
  if (estObjet(v.reponses)) {
    const reponses = formaterQualification(v.reponses);
    if (reponses.length) lignes.push('', 'Réponses brutes :', ...reponses);
  }
  return lignes;
}

async function cleRateLimit(request: Request): Promise<string> {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const adresse = (request.headers.get('cf-connecting-ip') || forwarded || 'inconnue').slice(0, 128);
  const empreinte = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(adresse));
  return Array.from(new Uint8Array(empreinte), (octet) => octet.toString(16).padStart(2, '0')).join('');
}

function estOrigineAutorisee(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Autorise les appels directs serveur à serveur.
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function lireRateEntry(brut: string | null): RateEntry | null {
  if (!brut) return null;
  try {
    const valeur: unknown = JSON.parse(brut);
    if (
      valeur &&
      typeof valeur === 'object' &&
      typeof (valeur as RateEntry).count === 'number' &&
      typeof (valeur as RateEntry).ts === 'number'
    ) {
      return valeur as RateEntry;
    }
  } catch {
    // Une valeur KV invalide est simplement remplacée au prochain passage.
  }
  return null;
}

function prochainRateEntry(entry: RateEntry | null, now: number): { limite: boolean; valeur: RateEntry } {
  if (entry && now - entry.ts < RATE_WINDOW_MS) {
    if (entry.count >= RATE_LIMIT) return { limite: true, valeur: entry };
    return { limite: false, valeur: { count: entry.count + 1, ts: entry.ts } };
  }
  return { limite: false, valeur: { count: 1, ts: now } };
}

async function estRateLimited(ip: string, env: Env): Promise<boolean> {
  const clef = `lead:rl:${ip}`;
  const now = Date.now();

  if (env.RATE_LIMIT) {
    try {
      const suivant = prochainRateEntry(lireRateEntry(await env.RATE_LIMIT.get(clef)), now);
      if (!suivant.limite) {
        await env.RATE_LIMIT.put(clef, JSON.stringify(suivant.valeur), {
          expirationTtl: RATE_TTL_SECONDS,
        });
      }
      return suivant.limite;
    } catch (error) {
      // Le KV renforce la cohérence entre instances, mais ne doit pas rendre le
      // formulaire indisponible : on conserve le fallback best effort historique.
      console.error('[lead] RATE_LIMIT KV indisponible, fallback mémoire :', error);
    }
  }

  const suivant = prochainRateEntry(rate.get(clef) ?? null, now);
  if (!suivant.limite) rate.set(clef, suivant.valeur);
  return suivant.limite;
}

function estObjet(v: unknown): v is Record<string, any> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

function jetonAttribution(v: unknown): string {
  const valeur = texteLigne(v, 80).toLowerCase();
  return /^[a-z0-9][a-z0-9._/-]{0,79}$/.test(valeur) && !/\d{7,}/.test(valeur) ? valeur : '';
}

function hoteAttribution(v: unknown): string {
  const valeur = texteLigne(v, 253).toLowerCase().replace(/\.$/, '');
  if (!valeur || !/^[a-z0-9.-]+$/.test(valeur)) return '';
  try {
    const hote = new URL(`https://${valeur}`).hostname;
    return hote === valeur ? hote : '';
  } catch {
    return '';
  }
}

function cheminAttribution(v: unknown): string {
  if (typeof v !== 'string' || !v.startsWith('/')) return '';
  try {
    const brut = new URL(v, 'https://levois.fr').pathname.replace(/\/{2,}/g, '/');
    const chemin = brut === '/' ? '/' : brut.replace(/\/$/, '');
    return CHEMINS_ATTRIBUTION.has(chemin) ? chemin : '/other';
  } catch {
    return '';
  }
}

function formaterAttribution(v: unknown): string[] {
  if (!estObjet(v)) return [];
  const source = jetonAttribution(v.source);
  const medium = jetonAttribution(v.medium);
  const referrerHost = hoteAttribution(v.referrerHost);
  const entryPath = cheminAttribution(v.entryPath);
  return [
    source ? `Source : ${source}` : '',
    medium ? `Support : ${medium}` : '',
    referrerHost ? `Référent : ${referrerHost}` : '',
    entryPath ? `Page d’entrée : ${entryPath}` : '',
  ].filter(Boolean);
}

export const onRequestPost = async (ctx: PagesContext<Env>): Promise<Response> => {
  // Les formulaires sont servis sur le même domaine. Ne pas publier de CORS
  // évite les soumissions cross-site ; la vérification bloque aussi les POST
  // no-cors dont la réponse serait autrement opaque pour le site appelant.
  if (!estOrigineAutorisee(ctx.request)) {
    return json({ ok: false, message: 'Origine non autorisée.' }, 403);
  }

  // Limitation avant analyse du corps, comme sur l'endpoint Netlify historique.
  const empreinteIp = await cleRateLimit(ctx.request);
  if (await estRateLimited(empreinteIp, ctx.env)) {
    return json({ ok: false, message: 'Trop de tentatives. Merci de réessayer dans quelques minutes.' }, 429);
  }

  let inconnu: unknown;
  try {
    inconnu = await readBoundedJson(ctx.request);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return json({ ok: false, message: 'Requête trop volumineuse.' }, 413);
    }
    return json({ ok: false, message: 'Requête invalide.' }, 400);
  }
  if (!estObjet(inconnu)) {
    return json({ ok: false, message: 'Requête invalide.' }, 400);
  }
  const body = inconnu;

  // Honeypot : réponse volontairement neutre, sans appel à Resend.
  if (typeof body.site_web === 'string' && body.site_web.trim() !== '') {
    return json({ ok: true, delivered: false });
  }

  const erreurs: string[] = [];
  const type = texteLigne(body.type, 40);
  const estContact = type === 'contact';
  const estParcours = type === 'parcours';
  const estVotreRue = type === 'votre-rue';
  const estAuditAnnonce = type === 'audit-annonce';
  const typeAutorise = estContact || estParcours || estVotreRue || estAuditAnnonce;
  const prenom = texteLigne(body.prenom, 80);
  const nom = texteLigne(body.nom, 80);
  const email = texteLigne(body.email, 200);
  const commune = texteLigne(body.commune, 120);
  const objet = texteLigne(body.objet, 200);
  const message = texte(body.message, 8000);
  const adresseRecherchee = texteLigne(body.adresseRecherchee, 500);
  const typeBien = texteLigne(body.typeBien, 20);
  const periodeDu = texteLigne(body.periodeDu, 10);
  const periodeAu = texteLigne(body.periodeAu, 10);
  if (!typeAutorise) erreurs.push('type');
  if (!prenom) erreurs.push('prénom');
  if (!estVotreRue && !nom) erreurs.push('nom');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) erreurs.push('email');
  if (estParcours && !commune) erreurs.push('commune');
  if (estVotreRue && !adresseRecherchee) erreurs.push('adresse confirmée');
  if (estVotreRue && typeBien !== 'Maison' && typeBien !== 'Appartement') erreurs.push('type de bien');
  if (estVotreRue && (!/^\d{4}-\d{2}-\d{2}$/.test(periodeDu) || !/^\d{4}-\d{2}-\d{2}$/.test(periodeAu))) erreurs.push('période');
  if (typeAutorise && body.consentement !== true) erreurs.push('consentement');
  if (estContact && !objet) erreurs.push('objet');
  if (estContact && !message) erreurs.push('message');
  if (erreurs.length) {
    return json({ ok: false, message: `Champs à vérifier : ${erreurs.join(', ')}.` }, 400);
  }

  const telephone = texteLigne(body.telephone, 40);
  const annonce = texteLigne(body.annonce, 500);
  const detail = texte(body.detail, 4000);
  const contexte = estObjet(body.contexte) ? body.contexte : null;
  const attribution = formaterAttribution(body.attribution);
  const nomComplet = [prenom, nom].filter(Boolean).join(' ');

  const apiKey = ctx.env.RESEND_API_KEY;
  const to = ctx.env.LEAD_TO_EMAIL || ctx.env.LEAD_TO || 'mouaad@levois.fr';
  const from = ctx.env.LEAD_FROM_EMAIL || ctx.env.LEAD_FROM || 'LEVOIS <onboarding@resend.dev>';

  const sujet = sujetTexte(
    estParcours
      ? `LEVOIS · ${nomComplet} — ${texteLigne(contexte?.situation, 160) || 'Parcours'} (${commune})`
      : estAuditAnnonce
        ? `LEVOIS · Audit d’annonce — ${nomComplet}${commune ? ` (${commune})` : ''}`
      : estVotreRue
        ? `LEVOIS · Votre rue — ${nomComplet}${commune ? ` (${commune})` : ''}`
        : `LEVOIS · Message de ${nomComplet}${objet ? ` — ${objet}` : ''}`,
  );

  const lignes: string[] = [
    'Nouveau contact LEVOIS',
    '',
    `${nom ? 'Nom' : 'Prénom'} : ${nomComplet}`,
    `Email : ${email}`,
    telephone ? `Téléphone : ${telephone}` : '',
    `Consentement de transmission : confirmé le ${new Date().toISOString()}`,
    (estParcours || estAuditAnnonce || estVotreRue) && commune ? `Commune du bien : ${commune}` : '',
    (estParcours || estAuditAnnonce) && annonce ? `Annonce : ${annonce}` : '',
    (estParcours || estAuditAnnonce) && detail ? `Détail ajouté : ${detail}` : '',
    estContact && message ? `Message : ${message}` : '',
  ];

  if (attribution.length) lignes.push('', '————— Attribution bornée —————', ...attribution);

  if (estVotreRue) {
    const source = texteLigne(body.source, 120);
    const intention = texteLigne(body.intention, 240);
    const intentionKey = texteLigne(body.intentionKey, 80);
    const profil = texteLigne(body.profil, 160);
    const qualification = formaterQualification(body.qualification);
    const infographie = formaterInfographie(body.contexteInfographie);

    lignes.push(
      '',
      '————— Demande « Votre rue » —————',
      source ? `Source : ${source}` : '',
      `Adresse confirmée : ${adresseRecherchee}`,
      `Type de bien : ${typeBien}`,
      `Période de l’échantillon : ${periodeDu} → ${periodeAu}`,
      intention ? `Intention : ${intention}` : '',
      intentionKey ? `Clé d’intention : ${intentionKey}` : '',
      profil ? `Profil : ${profil}` : '',
    );
    if (qualification.length) lignes.push('Qualification :', ...qualification);
    if (infographie.length) lignes.push('', '————— Contexte de l’infographie —————', ...infographie);
  }

  if (estAuditAnnonce) {
    const audit = formaterAudit(body.audit);
    lignes.push('', '————— Audit d’annonce —————', ...audit);
  }

  if (estParcours && contexte) {
    lignes.push(
      '',
      '————— Synthèse du parcours —————',
      `Situation : ${texteLigne(contexte.situation, 160) || '—'}`,
      `Date : ${texteLigne(contexte.date, 80) || '—'}`,
      '',
      `Reformulation : ${texteLigne(contexte.reformulation, 1200) || '—'}`,
      '',
      `Écart probable : ${texteLigne(contexte.ecart, 500) || '—'}`,
      `Niveau : ${texteLigne(contexte.niveau, 120) || '—'}`,
      contexte.secondePiste ? `Seconde piste : ${texteLigne(contexte.secondePiste, 500)}` : '',
      '',
      `Limite affichée : ${texteLigne(contexte.limite, 1200) || '—'}`,
      `Prochaine action recommandée : ${texteLigne(contexte.action, 1200) || '—'}`,
      `Ressource recommandée : ${texteLigne(contexte.ressource, 300) || '—'}`,
      '',
      'Réponses détaillées :',
    );
    if (Array.isArray(contexte.reponses)) {
      for (const reponse of contexte.reponses.slice(0, 20)) {
        if (estObjet(reponse)) {
          const question = texteLigne(reponse.question, 240) || '—';
          const reponseBornee = texteLigne(reponse.reponse, 500) || '—';
          lignes.push(`  · ${question} → ${reponseBornee}`);
        }
      }
    }
  }

  if (!apiKey) {
    console.error('[lead] RESEND_API_KEY absente — transmission suspendue.');
    return json(
      {
        ok: false,
        message:
          'La transmission est momentanément indisponible. Vos réponses restent affichées — vous pouvez contacter Mouaad directement : mouaad@levois.fr · 07 81 38 01 21.',
      },
      503,
    );
  }

  try {
    const rep = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: sujet,
        text: lignes.filter((ligne) => ligne !== '').join('\n'),
      }),
    });

    if (!rep.ok) {
      const erreur = await rep.text().catch(() => '');
      console.error('[lead] Échec Resend :', rep.status, erreur.slice(0, 200));
      return json(
        {
          ok: false,
          message:
            'La transmission n’a pas abouti. Vos réponses restent affichées — vous pouvez réessayer ou contacter Mouaad directement.',
        },
        502,
      );
    }

    return json({ ok: true, delivered: true });
  } catch (error) {
    console.error('[lead] Erreur d’envoi :', error);
    return json(
      {
        ok: false,
        message:
          'La transmission n’a pas abouti. Vos réponses restent affichées — vous pouvez réessayer ou contacter Mouaad directement.',
      },
      502,
    );
  }
};

export const onRequest = async (ctx: PagesContext<Env>): Promise<Response> => {
  if (ctx.request.method === 'POST') return onRequestPost(ctx);
  return json({ ok: false, message: 'Méthode non autorisée.' }, 405, { allow: 'POST' });
};
