/**
 * POST /api/lead — Cloudflare Pages Function.
 *
 * Reçoit la lecture personnalisée produite par le tunnel de /votre-rue et
 * l'envoie à Mouaad par e-mail, avec optionnellement un accusé pour la
 * personne.
 *
 * Sécurité :
 * — aucun secret n'est jamais exposé au navigateur (les variables sont
 *   lues côté serveur) ;
 * — un honeypot `site_web` est rempli automatiquement par les bots :
 *   toute valeur non vide fait renvoyer un 200 factice sans envoi ;
 * — un rate limit léger par IP protège d'un envoi en boucle.
 *
 * Prestataire e-mail : Resend (API HTTP, compatible workers). Aucune
 * dépendance npm nécessaire — appel `fetch` direct. Toute autre API
 * transactionnelle peut se substituer en modifiant `envoyerEmail`.
 *
 * Variables d'environnement attendues côté Cloudflare Pages :
 * — RESEND_API_KEY : clé Resend
 * — LEAD_TO        : destinataire (par défaut mouaad@levois.fr)
 * — LEAD_FROM      : expéditeur vérifié (par défaut contact@levois.fr)
 *
 * En absence de RESEND_API_KEY, la fonction accepte la requête, valide les
 * champs, journalise le payload dans la réponse d'erreur (mode dry-run) et
 * renvoie { ok: false, message: '...' } — cela permet de développer le
 * tunnel avant configuration finale.
 */

interface Env {
  RESEND_API_KEY?: string;
  LEAD_TO?: string;
  LEAD_FROM?: string;
  // KV facultatif pour le rate-limit persistant (optionnel)
  RATE_LIMIT?: KVNamespace;
}

interface PagesContext<E> {
  request: Request;
  env: E;
  waitUntil(promise: Promise<unknown>): void;
}

// Mémoire de secours pour le rate-limit si aucun KV n'est branché.
// Elle est locale à l'instance Worker et suffisante pour un usage modéré.
const memoire: Map<string, number[]> = new Map();
const FENETRE_MS = 60_000;
const MAX_PAR_FENETRE = 5;

async function estRateLimited(ip: string, env: Env): Promise<boolean> {
  const clef = `rl:${ip}`;
  const maintenant = Date.now();
  if (env.RATE_LIMIT) {
    const brut = await env.RATE_LIMIT.get(clef);
    const stamps: number[] = brut ? JSON.parse(brut) : [];
    const recents = stamps.filter((t) => maintenant - t < FENETRE_MS);
    if (recents.length >= MAX_PAR_FENETRE) return true;
    recents.push(maintenant);
    await env.RATE_LIMIT.put(clef, JSON.stringify(recents), { expirationTtl: 120 });
    return false;
  }
  const stamps = memoire.get(clef) ?? [];
  const recents = stamps.filter((t) => maintenant - t < FENETRE_MS);
  if (recents.length >= MAX_PAR_FENETRE) return true;
  recents.push(maintenant);
  memoire.set(clef, recents);
  return false;
}

function estEmailValide(x: unknown): boolean {
  if (typeof x !== 'string') return false;
  // Validation minimale — l'échec réel remonte via le prestataire.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x);
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

async function envoyerEmail(env: Env, sujet: string, texte: string, replyTo?: string): Promise<{ ok: boolean; erreur?: string }> {
  if (!env.RESEND_API_KEY) {
    return { ok: false, erreur: 'RESEND_API_KEY manquante — mode dry-run' };
  }
  const from = env.LEAD_FROM || 'LEVOIS <contact@levois.fr>';
  const to = env.LEAD_TO || 'mouaad@levois.fr';
  const body: Record<string, unknown> = { from, to, subject: sujet, text: texte };
  if (replyTo) body.reply_to = replyTo;
  const rep = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!rep.ok) {
    const txt = await rep.text().catch(() => '');
    return { ok: false, erreur: `Resend ${rep.status} : ${txt.slice(0, 200)}` };
  }
  return { ok: true };
}

function formaterCorps(payload: any): string {
  const l: string[] = [];
  l.push('Nouvelle demande depuis /votre-rue');
  l.push('');
  l.push(`Prénom  : ${payload.prenom ?? ''}`);
  l.push(`E-mail  : ${payload.email ?? ''}`);
  if (payload.telephone) l.push(`Tél.    : ${payload.telephone}`);
  l.push('');
  l.push('— Adresse recherchée —');
  l.push(payload.adresseRecherchee ?? '(non renseignée)');
  l.push('');
  if (payload.cible) {
    l.push('— Bien décrit —');
    l.push(`Type          : ${payload.cible.type}`);
    l.push(`Surface       : ${payload.cible.sb} m²`);
    l.push(`Pièces        : ${payload.cible.p}`);
    if (payload.cible.st) l.push(`Terrain       : ${payload.cible.st} m²`);
    if (payload.cible.exterieur) l.push(`Extérieur     : ${payload.cible.exterieur}`);
    if (payload.cible.etat) l.push(`État déclaré  : ${payload.cible.etat}`);
    l.push('');
  }
  if (payload.lecture) {
    l.push('— Lecture calculée —');
    l.push(`Références retenues : ${payload.lecture.n}`);
    l.push(`Niveau              : ${payload.lecture.niveau}`);
    if (payload.lecture.fourchette) l.push(`Fourchette €/m²     : ${payload.lecture.fourchette[0]} – ${payload.lecture.fourchette[1]}`);
    if (payload.lecture.repereCentral) l.push(`Repère central      : ${payload.lecture.repereCentral} €/m²`);
    l.push('');
  }
  if (payload.progression && Array.isArray(payload.progression)) {
    l.push('— Progression de la sélection —');
    for (const e of payload.progression) {
      l.push(`  ${e.n.toString().padStart(5)}  ${e.libelle}${e.elargi ? '  (élargi)' : ''}`);
    }
    l.push('');
  }
  l.push('— Consentement —');
  l.push('L\'utilisateur a explicitement accepté d\'être recontacté au sujet de sa demande.');
  return l.join('\n');
}

export const onRequestPost = async (ctx: PagesContext<Env>) => {
  let payload: any;
  try {
    payload = await ctx.request.json();
  } catch {
    return json({ ok: false, message: 'Requête invalide (JSON attendu).' }, 400);
  }

  // Honeypot — succès factice pour ne pas donner d'indication au bot
  if (typeof payload?.site_web === 'string' && payload.site_web.trim().length > 0) {
    return json({ ok: true });
  }

  // Champs requis
  const prenom = typeof payload?.prenom === 'string' ? payload.prenom.trim() : '';
  const email = typeof payload?.email === 'string' ? payload.email.trim() : '';
  const consent = payload?.consent === true;
  if (!prenom) return json({ ok: false, message: 'Le prénom est requis.' }, 400);
  if (!estEmailValide(email)) return json({ ok: false, message: 'L\'adresse e-mail semble invalide.' }, 400);
  if (!consent) return json({ ok: false, message: 'Un consentement est requis pour être recontacté.' }, 400);

  // Rate limit
  const ip = ctx.request.headers.get('cf-connecting-ip') || ctx.request.headers.get('x-forwarded-for') || 'unknown';
  if (await estRateLimited(ip, ctx.env)) {
    return json({ ok: false, message: 'Trop de demandes récentes. Merci de patienter une minute.' }, 429);
  }

  const sujet = `LEVOIS · demande /votre-rue — ${prenom}`;
  const corps = formaterCorps(payload);
  const envoi = await envoyerEmail(ctx.env, sujet, corps, email);

  if (!envoi.ok) {
    // Message générique côté utilisateur, journalisation détaillée dans la réponse
    // uniquement en mode dry-run (pas de clé). En production, on renvoie un
    // message court et on laisse le prestataire journaliser.
    const enDev = envoi.erreur?.includes('dry-run');
    return json(
      {
        ok: false,
        message: enDev
          ? 'Configuration e-mail incomplète — la lecture a bien été calculée mais l\'envoi n\'a pas été effectué. Vous pouvez écrire directement à mouaad@levois.fr.'
          : 'L\'envoi n\'a pas abouti. Vous pouvez réessayer ou écrire à mouaad@levois.fr.',
      },
      enDev ? 503 : 502,
    );
  }

  return json({ ok: true });
};

// Toute méthode autre que POST → 405
export const onRequest = async (ctx: PagesContext<Env>) => {
  if (ctx.request.method === 'POST') return onRequestPost(ctx);
  return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
};

// Placeholder de type minimal pour ne pas dépendre de @cloudflare/workers-types.
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}
