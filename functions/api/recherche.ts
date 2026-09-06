/**
 * POST /api/recherche — Cloudflare Pages Function.
 *
 * Reçoit la Lecture de votre recherche produite par /ma-recherche et
 * l'enregistre dans D1 avant d'envoyer une notification à Mouaad via Resend,
 * puis via le Formspree historique si Resend n'est pas configuré ou échoue.
 *
 * Ordre de traitement garanti :
 *   1. Validation de la requête (JSON, champs requis)
 *   2. Honeypot anti-bot
 *   3. Rate limit par IP
 *   4. Insertion dans D1 (binding natif RECHERCHE_DB)
 *   5. Tentative d'envoi Resend puis Formspree de secours
 *   6. Mise à jour du statut email_envoye dans D1
 *   7. Réponse explicite au navigateur
 *
 * Garanties :
 * — D1 absent ou insert échoué → erreur 503/500 explicite, aucun ok:true
 * — Resend échoué après insert D1 réussi → la lecture reste dans D1
 *   (email_envoye=0), réponse ok:true (donnée sûre, Mouaad consulte D1)
 * — Notification échouée après insertion → succès enregistré, notificationSent:false
 * — Aucun secret exposé au navigateur
 * — Aucun ok:true sans donnée persistée
 *
 * Bindings Cloudflare Pages (Dashboard → Settings → Functions) :
 *   RECHERCHE_DB : D1 database « levois-recherche » (binding obligatoire)
 *   RESEND_API_KEY : variable d'environnement secrète
 *   FORMSPREE_ENDPOINT : endpoint de secours (défaut : formulaire historique)
 *   LEAD_TO   : destinataire (défaut mouaad@levois.fr)
 *   LEAD_FROM : expéditeur vérifié Resend (défaut contact@levois.fr)
 *
 * Schéma D1 : voir db/schema.sql
 * wrangler.toml déclare le binding pour le développement local.
 */

interface Env {
  RECHERCHE_DB: D1Database;
  RESEND_API_KEY?: string;
  FORMSPREE_ENDPOINT?: string;
  LEAD_TO?: string;
  LEAD_FROM?: string;
  RATE_LIMIT?: KVNamespace;
}

interface PagesContext<E> {
  request: Request;
  env: E;
  waitUntil(promise: Promise<unknown>): void;
}

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

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function texte(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

function objetSimple(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function estEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

async function insererD1(db: D1Database, id: string, body: any, prenom: string, contact: string): Promise<void> {
  const lecture = objetSimple(body.lecture);
  const lectureJson = lecture
    ? JSON.stringify({
        ...lecture,
        projet: objetSimple(body.project),
        consentements: objetSimple(body.consents),
      })
    : null;

  await db
    .prepare(
      `INSERT INTO lectures_recherche (
        id, created_at, src, prenom, contact, commentaire,
        situation, type_bien, secteur, secteur_contraint, budget, surface,
        preserves, preserves_labels, flexibles, flexibles_labels,
        decision_tension, lecture_json, consent, email_envoye
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,0)`,
    )
    .bind(
      id,
      new Date().toISOString(),
      texte(body.src, 100) || null,
      prenom,
      contact,
      texte(body.commentaire, 4000) || null,
      body.situation ?? null,
      body.type ?? null,
      body.secteur ?? null,
      body.secteurContraint != null ? (body.secteurContraint ? 1 : 0) : null,
      typeof body.budget === 'number' ? body.budget : null,
      typeof body.surface === 'number' ? body.surface : null,
      JSON.stringify(Array.isArray(body.preserves) ? body.preserves : []),
      JSON.stringify(Array.isArray(body.preservesLabels) ? body.preservesLabels : []),
      JSON.stringify(Array.isArray(body.flexibles) ? body.flexibles : []),
      JSON.stringify(Array.isArray(body.flexiblesLabels) ? body.flexiblesLabels : []),
      body.decisionTension ?? null,
      lectureJson,
    )
    .run();
}

async function marquerEmailEnvoye(db: D1Database, id: string): Promise<void> {
  await db.prepare('UPDATE lectures_recherche SET email_envoye=1 WHERE id=?').bind(id).run();
}

function formaterCorps(body: any, prenom: string, contact: string): string {
  const l: string[] = [];

  l.push('LEVOIS · Lecture de recherche');
  l.push('Source : /ma-recherche' + (body.src ? ` (src=${body.src})` : ''));
  l.push('');
  l.push('————— Contact —————');
  l.push(`Prénom  : ${prenom}`);
  l.push(`Contact : ${contact}`);
  const commentaire = texte(body.commentaire, 4000);
  if (commentaire) l.push(`Note    : ${commentaire}`);

  l.push('');
  l.push('————— Projet —————');
  l.push(`Situation        : ${body.situation ?? '—'}`);
  l.push(`Type de bien     : ${body.type ?? '—'}`);
  const contraint = body.secteurContraint === true ? ' (contraint)' : body.secteurContraint === false ? ' (ouvert)' : '';
  l.push(`Secteur          : ${body.secteur ?? '—'}${contraint}`);
  if (body.budget != null) l.push(`Budget pour le bien (hors frais et travaux) : ${Number(body.budget).toLocaleString('fr-FR')} €`);
  if (body.surface != null) l.push(`Surface cible    : ${body.surface} m²`);

  const project = objetSimple(body.project);
  if (project) {
    const communes = texte(project.communesAcceptables, 500);
    const temps = texte(project.tempsMaxLabel, 100);
    const financement = texte(project.financementLabel, 120);
    const ventePrealable = texte(project.ventePrealableLabel, 120);
    const horizon = texte(project.horizonLabel, 120);
    if (communes) l.push(`Communes acceptées : ${communes}`);
    if (temps) l.push(`Temps maximal      : ${temps}`);
    if (financement) l.push(`Financement        : ${financement}`);
    if (ventePrealable) l.push(`Vente préalable    : ${ventePrealable}`);
    if (horizon) l.push(`Horizon            : ${horizon}`);
  }

  const lm = body.lecture;
  if (lm && typeof lm === 'object') {
    l.push('');
    l.push('————— Lecture de marché —————');
    l.push(`Références       : ${lm.n ?? '—'} ventes (env. ${lm.nParAn ?? '—'}/an)`);
    l.push(`Prix/m² acheteur : ${lm.budgetPPM2 ?? '—'} €/m²`);
    l.push(`Marché Q1        : ${lm.q1 ?? '—'} €/m²`);
    l.push(`Marché médiane   : ${lm.median ?? '—'} €/m²`);
    l.push(`Marché Q3        : ${lm.q3 ?? '—'} €/m²`);
    l.push(`Surface atteignable au prix médian : ${lm.surfaceAuMedian ?? '—'} m²`);
    const pos: Record<string, string> = {
      sous_q1: 'En dessous du premier quartile',
      q1_q3: 'Dans la fourchette de marché (Q1–Q3)',
      au_dessus_q3: 'Au-dessus du troisième quartile',
    };
    l.push(`Position         : ${pos[lm.position] ?? lm.position ?? '—'}`);
  }

  l.push('');
  l.push('————— Manière de décider —————');
  const pL: string[] = Array.isArray(body.preservesLabels) ? body.preservesLabels : [];
  const fL: string[] = Array.isArray(body.flexiblesLabels) ? body.flexiblesLabels : [];
  if (pL.length) l.push(`Préserver en priorité : ${pL.join(', ')}`);
  if (fL.length) l.push(`Flexible sur          : ${fL.join(', ')}`);
  if (body.decisionTension) {
    const tensions: Record<string, string> = {
      localisation: 'Maintien de la localisation (surface adaptée au marché)',
      surface: 'Maintien de la surface (zone élargie si nécessaire)',
      les_deux: 'Tenir les deux — recherche plus longue, réactivité forte',
    };
    l.push(`Tension / arbitrage : ${tensions[body.decisionTension] ?? body.decisionTension}`);
  }

  l.push('');
  l.push('————— Consentement —————');
  const consents = objetSimple(body.consents);
  if (consents) {
    l.push(`Recevoir la lecture      : ${consents.lecture === true ? 'oui' : 'non'}`);
    l.push(`Alerte rapprochement     : ${consents.matching === true ? 'oui' : 'non'}`);
    l.push(`Demander un échange      : ${consents.contact === true ? 'oui' : 'non'}`);
  } else {
    l.push("L'utilisateur a accepté d'être recontacté par Mouaad Boullourou au sujet de sa recherche immobilière.");
  }

  return l.join('\n');
}

async function notifierFormspree(env: Env, sujet: string, prenom: string, contact: string, corps: string): Promise<boolean> {
  const endpoint = env.FORMSPREE_ENDPOINT || 'https://formspree.io/f/xnjynroj';
  try {
    const formulaire = new URLSearchParams({
      _subject: sujet,
      prenom,
      contact,
      message: corps,
    });
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact)) formulaire.set('email', contact);
    const rep = await fetch(endpoint, {
      method: 'POST',
      signal: AbortSignal.timeout(12000),
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: formulaire.toString(),
    });
    if (!rep.ok) console.error('[recherche] Formspree error:', rep.status);
    return rep.ok;
  } catch (e) {
    console.error('[recherche] Formspree fetch error:', e);
    return false;
  }
}

export const onRequestPost = async (ctx: PagesContext<Env>) => {
  const origin = ctx.request.headers.get('origin');
  if (origin && origin !== new URL(ctx.request.url).origin) return json({ok:false,message:'Origine non autorisée.'},403);
  // ——— 1. Binding D1 obligatoire ———
  if (!ctx.env.RECHERCHE_DB) {
    return json(
      { ok: false, message: 'Stockage non configuré. Écrivez directement à mouaad@levois.fr · 07 81 38 01 21.' },
      503,
    );
  }

  // ——— 1. Validation JSON ———
  let payload: any;
  try {
    payload = await ctx.request.json();
  } catch {
    return json({ ok: false, message: 'Requête invalide (JSON attendu).' }, 400);
  }

  // ——— 2. Honeypot ———
  if (typeof payload?.site_web === 'string' && payload.site_web.trim().length > 0) {
    return json({ ok: true });
  }

  // ——— 2. Validation des champs ———
  const prenom = texte(payload?.prenom, 80).replace(/[\r\n]+/g, ' ');
  const contact = texte(payload?.contact, 200);
  const consent = payload?.consent === true;
  if (!prenom) return json({ ok: false, message: 'Le prénom est requis.' }, 400);
  if (!estEmail(contact) && !/^\+?[\d ().-]{8,24}$/.test(contact)) return json({ ok: false, message: 'Indiquez un email complet ou un numéro de téléphone valide.' }, 400);
  if (!consent || !objetSimple(payload.consents) || !['lecture','matching','contact'].some(k=>payload.consents[k]===true)) return json({ ok: false, message: 'Choisissez au moins une suite à donner à votre recherche.' }, 400);

  // ——— 3. Rate limit par IP ———
  const ip = ctx.request.headers.get('cf-connecting-ip') || ctx.request.headers.get('x-forwarded-for') || 'unknown';
  if (await estRateLimited(ip, ctx.env)) {
    return json({ ok: false, message: 'Trop de demandes récentes. Merci de patienter une minute.' }, 429);
  }

  // ——— 4. Insertion D1 (obligatoire avant tout envoi) ———
  const id = crypto.randomUUID();
  try {
    await insererD1(ctx.env.RECHERCHE_DB, id, payload, prenom, contact);
  } catch (e) {
    console.error('[recherche] D1 insert failed:', e);
    return json(
      { ok: false, message: "Votre demande n'a pas pu être enregistrée. Contactez Mouaad directement : mouaad@levois.fr · 07 81 38 01 21." },
      500,
    );
  }

  // ——— 5. Notification — Resend, puis Formspree de secours ———
  const sujet = `LEVOIS · Lecture de recherche — ${prenom}`;
  const corps = formaterCorps(payload, prenom, contact);
  if (!ctx.env.RESEND_API_KEY) {
    const formspreeOk = await notifierFormspree(ctx.env, sujet, prenom, contact, corps);
    if (formspreeOk) {
      ctx.waitUntil(marquerEmailEnvoye(ctx.env.RECHERCHE_DB, id).catch(()=>{ console.error('[recherche] Statut de notification non actualisé.'); }));
      return json({ ok: true, saved: true, notificationSent: true });
    }
    return json({ ok: true, saved: true, notificationSent: false });
  }

  const from = ctx.env.LEAD_FROM || 'LEVOIS <contact@levois.fr>';
  const to = ctx.env.LEAD_TO || 'mouaad@levois.fr';

  let resendOk = false;
  try {
    const rep = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(12000),
      headers: { Authorization: `Bearer ${ctx.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from,
        to,
        subject: sujet,
        text: corps,
        ...(estEmail(contact) ? { reply_to: contact } : {}),
      }),
    });
    if (rep.ok) {
      resendOk = true;
    } else {
      const err = await rep.text().catch(() => '');
      console.error('[recherche] Resend error:', rep.status, err.slice(0, 200));
    }
  } catch (e) {
    console.error('[recherche] Resend fetch error:', e);
  }

  if (!resendOk) {
    resendOk = await notifierFormspree(ctx.env, sujet, prenom, contact, corps);
  }

  // ——— 6. Mise à jour statut de notification dans D1 ———
  // Lecture déjà persistée. On ne supprime jamais un insert D1 réussi.
  if (resendOk) {
    ctx.waitUntil(marquerEmailEnvoye(ctx.env.RECHERCHE_DB, id).catch(()=>{ console.error('[recherche] Statut de notification non actualisé.'); }));
  }
  // Si Resend a échoué : email_envoye reste 0 dans D1. Mouaad consulte D1
  // pour identifier les lectures sans notification (email_envoye=0).

  // ——— 7. Réponse ———
  // ok:true même si Resend a échoué : la lecture est persistée dans D1.
  return json({ ok: true, saved: true, notificationSent: resendOk });
};

export const onRequest = async (ctx: PagesContext<Env>) => {
  if (ctx.request.method === 'POST') return onRequestPost(ctx);
  return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
};

// ——— Types locaux (évite la dépendance @cloudflare/workers-types) ———

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}
