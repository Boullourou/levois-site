/**
 * POST /api/lead — Cloudflare Pages Function.
 *
 * Port Cloudflare de netlify/functions/lead.mts. Le contrat navigateur reste
 * inchangé : validation serveur, honeypot, limitation par IP et envoi Resend.
 * Un succès n'est renvoyé que lorsque Resend a confirmé l'envoi.
 *
 * Bindings Cloudflare Pages (Dashboard → Settings → Functions) :
 *   RESEND_API_KEY  : secret Resend (voie principale)
 *   FORMSPREE_ENDPOINT : secours sans secret (défaut : formulaire historique)
 *   LEAD_TO_EMAIL   : destinataire (défaut : mouaad@levois.fr)
 *   LEAD_FROM_EMAIL : expéditeur vérifié (défaut : onboarding@resend.dev)
 *   LEAD_TO / LEAD_FROM : alias partagés avec /api/recherche, si déjà définis
 *   RATE_LIMIT      : KV optionnel ; à défaut, limitation best effort en mémoire
 */

interface Env {
  RESEND_API_KEY?: string;
  FORMSPREE_ENDPOINT?: string;
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

function adresseIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (request.headers.get('cf-connecting-ip') || forwarded || 'inconnue').slice(0, 128);
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

export const onRequestPost = async (ctx: PagesContext<Env>): Promise<Response> => {
  // Les formulaires sont servis sur le même domaine. Ne pas publier de CORS
  // évite les soumissions cross-site ; la vérification bloque aussi les POST
  // no-cors dont la réponse serait autrement opaque pour le site appelant.
  if (!estOrigineAutorisee(ctx.request)) {
    return json({ ok: false, message: 'Origine non autorisée.' }, 403);
  }

  // Limitation avant analyse du corps, comme sur l'endpoint Netlify historique.
  const ip = adresseIp(ctx.request);
  if (await estRateLimited(ip, ctx.env)) {
    return json({ ok: false, message: 'Trop de tentatives. Merci de réessayer dans quelques minutes.' }, 429);
  }

  let inconnu: unknown;
  try {
    inconnu = await ctx.request.json();
  } catch {
    return json({ ok: false, message: 'Requête invalide.' }, 400);
  }
  if (!estObjet(inconnu)) {
    return json({ ok: false, message: 'Requête invalide.' }, 400);
  }
  const body = inconnu;

  // Honeypot : réponse volontairement neutre, sans appel à Resend.
  if (typeof body.site_web === 'string' && body.site_web.trim() !== '') {
    return json({ ok: true });
  }

  const erreurs: string[] = [];
  const type = texteLigne(body.type, 40);
  const estVotreRue = type === 'votre-rue';
  const estAuditAnnonce = type === 'audit-annonce';
  const prenom = texteLigne(body.prenom, 80);
  const nom = texteLigne(body.nom, 80);
  const email = texteLigne(body.email, 200);
  const commune = texteLigne(body.commune, 120);
  if (!prenom) erreurs.push('prénom');
  if (!estVotreRue && !nom) erreurs.push('nom');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) erreurs.push('email');
  if (type === 'parcours' && !commune) erreurs.push('commune');
  if (estAuditAnnonce && body.consentement !== true) erreurs.push('consentement');
  if (erreurs.length) {
    return json({ ok: false, message: `Champs à vérifier : ${erreurs.join(', ')}.` }, 400);
  }

  const telephone = texteLigne(body.telephone, 40);
  const annonce = texteLigne(body.annonce, 500);
  const detail = texte(body.detail, 4000);
  const objet = texteLigne(body.objet, 200);
  const message = texte(body.message, 8000);
  const contexte = body.contexte && typeof body.contexte === 'object' ? body.contexte as Record<string, any> : null;
  const nomComplet = [prenom, nom].filter(Boolean).join(' ');

  const apiKey = ctx.env.RESEND_API_KEY;
  const to = ctx.env.LEAD_TO_EMAIL || ctx.env.LEAD_TO || 'mouaad@levois.fr';
  const from = ctx.env.LEAD_FROM_EMAIL || ctx.env.LEAD_FROM || 'LEVOIS <onboarding@resend.dev>';

  const sujet = sujetTexte(
    type === 'parcours'
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
    commune ? `Commune du bien : ${commune}` : '',
    annonce ? `Annonce : ${annonce}` : '',
    detail ? `Détail ajouté : ${detail}` : '',
    message ? `Message : ${message}` : '',
  ];

  if (estVotreRue) {
    const source = texteLigne(body.source, 120);
    const adresseRecherchee = texteLigne(body.adresseRecherchee, 500);
    const intention = texteLigne(body.intention, 240);
    const intentionKey = texteLigne(body.intentionKey, 80);
    const profil = texteLigne(body.profil, 160);
    const qualification = formaterQualification(body.qualification);
    const infographie = formaterInfographie(body.contexteInfographie);

    lignes.push(
      '',
      '————— Demande « Votre rue » —————',
      source ? `Source : ${source}` : '',
      adresseRecherchee ? `Adresse recherchée : ${adresseRecherchee}` : '',
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

  if (contexte) {
    lignes.push(
      '',
      '————— Synthèse du parcours —————',
      `Situation : ${contexte.situation ?? '—'}`,
      `Date : ${contexte.date ?? '—'}`,
      '',
      `Reformulation : ${contexte.reformulation ?? '—'}`,
      '',
      `Écart probable : ${contexte.ecart ?? '—'}`,
      `Niveau : ${contexte.niveau ?? '—'}`,
      contexte.secondePiste ? `Seconde piste : ${contexte.secondePiste}` : '',
      '',
      `Limite affichée : ${contexte.limite ?? '—'}`,
      `Prochaine action recommandée : ${contexte.action ?? '—'}`,
      `Ressource recommandée : ${contexte.ressource ?? '—'}`,
      '',
      'Réponses détaillées :',
    );
    if (Array.isArray(contexte.reponses)) {
      for (const reponse of contexte.reponses) {
        if (reponse && typeof reponse === 'object') {
          lignes.push(`  · ${reponse.question ?? '—'} → ${reponse.reponse ?? '—'}`);
        }
      }
    }
  }

  if (!apiKey) {
    const endpoint = ctx.env.FORMSPREE_ENDPOINT || 'https://formspree.io/f/xnjynroj';
    try {
      const formulaire = new URLSearchParams({
        _subject: sujet,
        nom: nomComplet,
        email,
        telephone,
        message: lignes.filter((ligne) => ligne !== '').join('\n'),
      });
      const rep = await fetch(endpoint, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: formulaire.toString(),
      });
      if (rep.ok) return json({ ok: true });
      console.error('[lead] Échec Formspree :', rep.status);
    } catch (error) {
      console.error('[lead] Erreur Formspree :', error);
    }
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

    return json({ ok: true });
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
