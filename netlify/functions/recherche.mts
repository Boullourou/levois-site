import type { Context } from '@netlify/functions';

/**
 * POST /api/recherche — Lecture de votre recherche (parcours acquéreur).
 *
 * Reçoit la lecture produite par /ma-recherche et l'envoie à Mouaad par
 * e-mail. Le corps contient une section lisible par un humain suivie d'un
 * bloc JSON structuré pour extraction ultérieure (persistance V1).
 *
 * Sécurité :
 * — honeypot `site_web` : toute valeur non vide → 200 factice sans envoi
 * — rate limit léger par IP (5 envois / 10 min)
 * — aucun secret exposé au navigateur
 * — aucune confirmation sans réponse positive du serveur
 *
 * Variables d'environnement Netlify :
 *   RESEND_API_KEY   clé API Resend (obligatoire)
 *   LEAD_TO_EMAIL    destinataire (défaut : mouaad@levois.fr)
 *   LEAD_FROM_EMAIL  expéditeur vérifié (défaut : onboarding@resend.dev)
 */

const rate = new Map<string, { count: number; ts: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return json({ ok: false, message: 'Méthode non autorisée.' }, 405);
  }

  const ip = context.ip ?? 'inconnue';
  const now = Date.now();
  const entry = rate.get(ip);
  if (entry && now - entry.ts < RATE_WINDOW_MS) {
    if (entry.count >= RATE_LIMIT) {
      return json({ ok: false, message: 'Trop de tentatives. Merci de réessayer dans quelques minutes.' }, 429);
    }
    entry.count++;
  } else {
    rate.set(ip, { count: 1, ts: now });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, message: 'Requête invalide.' }, 400);
  }

  if (typeof body.site_web === 'string' && body.site_web.trim() !== '') {
    return json({ ok: true }, 200);
  }

  const prenom = texte(body.prenom, 80);
  const contact = texte(body.contact, 200);
  const consent = body.consent === true;
  if (!prenom) return json({ ok: false, message: 'Le prénom est requis.' }, 400);
  if (!contact) return json({ ok: false, message: 'Un moyen de contact est requis.' }, 400);
  if (!consent) return json({ ok: false, message: 'Le consentement est requis.' }, 400);

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO_EMAIL || 'mouaad@levois.fr';
  const from = process.env.LEAD_FROM_EMAIL || 'LEVOIS <onboarding@resend.dev>';

  if (!apiKey) {
    console.error('[recherche] RESEND_API_KEY absente — lecture non transmise :', JSON.stringify({ prenom, contact }));
    return json(
      { ok: false, message: 'La transmission est momentanément indisponible. Vous pouvez contacter Mouaad directement : mouaad@levois.fr · 07 81 38 01 21.' },
      503
    );
  }

  const sujet = `LEVOIS · Lecture de recherche — ${prenom}`;
  const corps = formaterCorps(body, prenom, contact);

  try {
    const rep = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: estEmail(contact) ? contact : undefined,
        subject: sujet,
        text: corps,
      }),
    });

    if (!rep.ok) {
      const err = await rep.text();
      console.error('[recherche] Échec Resend :', rep.status, err);
      return json(
        { ok: false, message: 'La transmission n’a pas abouti. Vous pouvez réessayer ou contacter Mouaad directement.' },
        502
      );
    }

    return json({ ok: true }, 200);
  } catch (e) {
    console.error('[recherche] Erreur d’envoi :', e);
    return json(
      { ok: false, message: 'La transmission n’a pas abouti. Vous pouvez réessayer ou contacter Mouaad directement.' },
      502
    );
  }
};

function formaterCorps(body: any, prenom: string, contact: string): string {
  const l: string[] = [];

  l.push('LEVOIS · Lecture de recherche');
  l.push('Source : /ma-recherche');
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
  const secteur = body.secteur ?? '—';
  const contraint = body.secteurContraint === true ? ' (contraint)' : body.secteurContraint === false ? ' (ouvert)' : '';
  l.push(`Secteur          : ${secteur}${contraint}`);
  if (body.budget != null) l.push(`Budget           : ${Number(body.budget).toLocaleString('fr-FR')} €`);
  if (body.surface != null) l.push(`Surface cible    : ${body.surface} m²`);

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
      localisation: 'Maintien de la localisation (surface réduite)',
      surface: 'Maintien de la surface (zone élargie)',
      les_deux: 'Acceptation de la tension — flexibilité sur les deux',
    };
    l.push(`Tension / arbitrage : ${tensions[body.decisionTension] ?? body.decisionTension}`);
  }

  l.push('');
  l.push('————— Consentement —————');
  l.push("L'utilisateur a accepté d'être recontacté par Mouaad Boullourou au sujet de sa recherche immobilière.");

  l.push('');
  l.push('='.repeat(60));
  l.push('DONNÉES STRUCTURÉES (JSON — pour extraction automatique)');
  l.push('='.repeat(60));
  const machine = {
    version: 1,
    source: 'ma-recherche',
    ts: new Date().toISOString(),
    prenom,
    contact,
    commentaire: texte(body.commentaire, 4000) || null,
    situation: body.situation ?? null,
    type: body.type ?? null,
    secteur: body.secteur ?? null,
    secteurContraint: body.secteurContraint ?? null,
    budget: body.budget ?? null,
    surface: body.surface ?? null,
    preserves: Array.isArray(body.preserves) ? body.preserves : [],
    preservesLabels: pL,
    flexibles: Array.isArray(body.flexibles) ? body.flexibles : [],
    flexiblesLabels: fL,
    decisionTension: body.decisionTension ?? null,
    lecture: lm ?? null,
  };
  l.push(JSON.stringify(machine, null, 2));

  return l.join('\n');
}

function texte(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

function estEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
