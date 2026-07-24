import type { Context } from '@netlify/functions';

/**
 * Route serveur de transmission des leads LEVOIS.
 *
 * — Validation serveur des champs obligatoires
 * — Honeypot + limitation de fréquence (best effort par instance)
 * — Envoi de la synthèse complète à Mouaad via Resend
 * — Aucune réussite affichée sans envoi réellement confirmé
 *
 * Variables d'environnement (Netlify → Site settings → Environment) :
 *   RESEND_API_KEY   clé API Resend (obligatoire pour activer l'envoi)
 *   LEAD_TO_EMAIL    destinataire (défaut : mouaad@levois.fr)
 *   LEAD_FROM_EMAIL  expéditeur vérifié Resend (défaut : onboarding@resend.dev)
 */

const rate = new Map<string, { count: number; ts: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return json({ ok: false, message: 'Méthode non autorisée.' }, 405);
  }

  // Limitation de fréquence par IP (best effort).
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

  // Honeypot : un champ rempli = robot. Réponse neutre, aucun envoi.
  if (typeof body.site_web === 'string' && body.site_web.trim() !== '') {
    return json({ ok: true }, 200);
  }

  // Validation serveur.
  const erreurs: string[] = [];
  const prenom = texte(body.prenom, 80);
  const nom = texte(body.nom, 80);
  const email = texte(body.email, 200);
  const commune = texte(body.commune, 120);
  if (!prenom) erreurs.push('prénom');
  if (!nom) erreurs.push('nom');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) erreurs.push('email');
  if (body.type === 'parcours' && !commune) erreurs.push('commune');
  if (erreurs.length) {
    return json({ ok: false, message: `Champs à vérifier : ${erreurs.join(', ')}.` }, 400);
  }

  const telephone = texte(body.telephone, 40);
  const annonce = texte(body.annonce, 500);
  const detail = texte(body.detail, 4000);
  const objet = texte(body.objet, 200);
  const message = texte(body.message, 8000);
  const contexte = body.contexte && typeof body.contexte === 'object' ? body.contexte : null;

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO_EMAIL || 'mouaad@levois.fr';
  const from = process.env.LEAD_FROM_EMAIL || 'LEVOIS <onboarding@resend.dev>';

  if (!apiKey) {
    // Honnêteté avant tout : sans envoi possible, on ne confirme jamais.
    console.error('[lead] RESEND_API_KEY absente — transmission impossible. Lead non transmis :', JSON.stringify({ prenom, nom, email, commune }));
    return json(
      { ok: false, message: 'La transmission est momentanément indisponible. Vos réponses restent affichées — vous pouvez contacter Mouaad directement : mouaad@levois.fr · 07 81 38 01 21.' },
      503
    );
  }

  const sujet =
    body.type === 'parcours'
      ? `LEVOIS · ${prenom} ${nom} — ${contexte?.situation ?? 'Parcours'} (${commune})`
      : `LEVOIS · Message de ${prenom} ${nom}${objet ? ` — ${objet}` : ''}`;

  const lignes: string[] = [
    `Nouveau contact LEVOIS`,
    ``,
    `Nom : ${prenom} ${nom}`,
    `Email : ${email}`,
    telephone ? `Téléphone : ${telephone}` : '',
    commune ? `Commune du bien : ${commune}` : '',
    annonce ? `Annonce : ${annonce}` : '',
    detail ? `Détail ajouté : ${detail}` : '',
    message ? `Message : ${message}` : '',
  ];

  if (contexte) {
    lignes.push(
      ``,
      `————— Synthèse du parcours —————`,
      `Situation : ${contexte.situation ?? '—'}`,
      `Date : ${contexte.date ?? '—'}`,
      ``,
      `Reformulation : ${contexte.reformulation ?? '—'}`,
      ``,
      `Écart probable : ${contexte.ecart ?? '—'}`,
      `Niveau : ${contexte.niveau ?? '—'}`,
      contexte.secondePiste ? `Seconde piste : ${contexte.secondePiste}` : '',
      ``,
      `Limite affichée : ${contexte.limite ?? '—'}`,
      `Prochaine action recommandée : ${contexte.action ?? '—'}`,
      `Ressource recommandée : ${contexte.ressource ?? '—'}`,
      ``,
      `Réponses détaillées :`
    );
    if (Array.isArray(contexte.reponses)) {
      for (const r of contexte.reponses) {
        lignes.push(`  · ${r.question} → ${r.reponse}`);
      }
    }
  }

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
        reply_to: email,
        subject: sujet,
        text: lignes.filter((l) => l !== '').join('\n'),
      }),
    });

    if (!rep.ok) {
      const err = await rep.text();
      console.error('[lead] Échec Resend :', rep.status, err);
      return json(
        { ok: false, message: 'La transmission n’a pas abouti. Vos réponses restent affichées — vous pouvez réessayer ou contacter Mouaad directement.' },
        502
      );
    }

    return json({ ok: true }, 200);
  } catch (e) {
    console.error('[lead] Erreur d’envoi :', e);
    return json(
      { ok: false, message: 'La transmission n’a pas abouti. Vos réponses restent affichées — vous pouvez réessayer ou contacter Mouaad directement.' },
      502
    );
  }
};

function texte(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
