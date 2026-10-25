import {
  type ExperienceContext, type ExperienceEnv, type MailResult,
  database, email, failure, invalid, isoDate, json, line, object,
  rateLimit, readJson, sendMail, sha256, string, uuid, validateContext,
} from '../../_lib/experience/common';
import { captureSynthesis } from '../../_lib/experience/email-leads';

export interface ActionInput {
  requestId: string;
  action: 'email-copy' | 'synthesis-email' | 'review' | 'exchange';
  channel: 'email' | 'phone';
  email: string;
  phone: string;
  firstName: string;
  question: string;
  context?: Record<string, unknown>;
  synthesis: string;
  consent: { purpose: 'copy' | 'synthesis' | 'review' | 'exchange'; textVersion: string; acceptedAt: string };
}
export interface RequestRow {
  id: string; payload_hash: string; action: 'review' | 'exchange'; created_at: string;
  contact_email: string | null; contact_phone: string | null; channel: 'email' | 'phone';
  first_name: string; question: string; context_json: string; synthesis: string; consent_json: string;
  notification_state: string; notification_provider: string | null; notification_updated_at: string | null;
  notification_attempts: number; status: string;
}

function validate(body: Record<string, unknown>): ActionInput {
  if (!['email-copy', 'synthesis-email', 'review', 'exchange'].includes(String(body.action))) invalid('Choisissez la suite souhaitée.');
  const action = body.action as ActionInput['action'];
  const purpose = action === 'email-copy' ? 'copy' : action === 'synthesis-email' ? 'synthesis' : action;
  const textVersion = action === 'synthesis-email' ? '2026-10-25' : '2026-09-10';
  if (body.approved !== true || !object(body.consent) || body.consent.purpose !== purpose || body.consent.textVersion !== textVersion) {
    invalid('Confirmez cette version et la suite précise que vous avez choisie.');
  }
  const acceptedAt = isoDate(body.consent.acceptedAt);
  if (Date.parse(acceptedAt) > Date.now() + 300_000) invalid();
  const channel = body.channel ?? 'email';
  if (!['email', 'phone'].includes(String(channel)) || (action !== 'exchange' && channel !== 'email')) invalid('La relecture est écrite. Un appel se choisit séparément.');
  const emailAddress = channel === 'email' ? email(body.email) : '';
  const phone = channel === 'phone' ? line(body.phone, 30, true) : '';
  if (phone && (!/^\+?[\d () .-]{8,30}$/.test(phone) || phone.replace(/\D/g, '').length < 8 || phone.replace(/\D/g, '').length > 15)) invalid('Indiquez un numéro de téléphone complet.');
  if ((channel === 'email' && body.phone) || (channel === 'phone' && body.email)) invalid('Indiquez seulement la coordonnée utile au canal choisi.');
  if (['email-copy', 'synthesis-email'].includes(action) && (body.firstName || body.question)) invalid('Seule votre adresse e-mail est nécessaire pour recevoir une synthèse.');
  return {
    requestId: uuid(body.requestId), action, channel: channel as ActionInput['channel'],
    email: emailAddress, phone, firstName: line(body.firstName, 80), question: string(body.question, 2500),
    ...(action === 'email-copy' ? {} : { context: validateContext(body.context) }), synthesis: string(body.synthesis, 30_000, true),
    consent: { purpose, textVersion, acceptedAt },
  };
}

function humanMessage(row: RequestRow): string {
  return [
    row.action === 'review' ? 'DEMANDE DE RELECTURE ÉCRITE CIBLÉE' : 'DEMANDE D’ÉCHANGE VOLONTAIRE',
    `Référence : ${row.id}`, `Enregistrée le : ${row.created_at}`, `Prénom : ${row.first_name || 'Non indiqué'}`,
    `Canal choisi : ${row.channel === 'phone' ? 'Téléphone' : 'E-mail'}`,
    `Coordonnée : ${row.contact_email || row.contact_phone}`,
    row.action === 'review' ? 'Aucun appel ni rendez-vous demandé. Aucun délai de réponse garanti.' : 'Échange limité au projet et au canal choisis.',
    'Aucun accord de relance commerciale, de newsletter ou d’alerte opportunité.',
    '', 'QUESTION À REPRENDRE', row.question || 'Relire les points ouverts de la synthèse.',
    '', 'VERSION EXACTE APPROUVÉE', row.synthesis,
    '', 'CONTEXTE APPROUVÉ — DÉCLARATIONS DU VISITEUR, À VÉRIFIER', row.context_json,
    '', 'CHOIX ET CONSENTEMENT', row.consent_json,
  ].join('\n');
}

export async function notifyRequest(env: ExperienceEnv, row: RequestRow): Promise<MailResult> {
  const db = database(env);
  // The conditional write is the concurrency lock. A retry never creates a
  // second dossier, and never retries an uncertain transport automatically.
  const claimed = await db.prepare(`UPDATE experience_requests SET notification_state='sending', notification_updated_at=?, notification_attempts=notification_attempts+1
    WHERE id=? AND notification_state IN ('pending','failed','unavailable') RETURNING id`).bind(new Date().toISOString(), row.id).first<{ id: string }>();
  if (!claimed) return { state: row.notification_state === 'sent' ? 'sent' : 'unknown' };
  const sent = await sendMail(env, {
    to: env.LEAD_TO_EMAIL || env.LEAD_TO || 'mouaad@levois.fr',
    subject: row.action === 'review' ? 'LEVOIS · Relecture écrite ciblée' : 'LEVOIS · Échange choisi',
    text: humanMessage(row), ...(row.contact_email ? { replyTo: row.contact_email } : {}),
  }, `experience-${row.id}`, true);
  try {
    await db.prepare('UPDATE experience_requests SET notification_state=?, notification_provider=?, notification_updated_at=? WHERE id=?')
      .bind(sent.state, sent.provider ?? null, new Date().toISOString(), row.id).run();
  } catch {
    // If acceptance cannot be recorded, leave the claim in place. The visitor
    // receives the transport result; another automatic send must not follow.
  }
  return sent;
}

export const onRequest = async ({ request, env }: ExperienceContext): Promise<Response> => {
  try {
    const body = await readJson(request);
    if (body.site_web) return json({ ok: false, code: 'INVALID_INPUT', message: 'La demande n’a pas été transmise.' }, 400);
    const input = validate(body);
    await rateLimit(request, env, 'actions');
    if (input.action === 'synthesis-email') return await captureSynthesis(input, env);
    if (input.action === 'email-copy') {
      // No D1 writes, no human fallback, no copy to the advisor, no lead.
      const sent = await sendMail(env, {
        to: input.email, subject: 'Votre lecture LEVOIS — copie demandée',
        text: `${input.synthesis}\n\nCette copie a été demandée depuis LEVOIS. Aucun appel, relecture ou suivi commercial n’est demandé par cet envoi.`,
      }, `experience-copy-${input.requestId}-${await sha256(`${input.email}\n${input.synthesis}`)}`);
      return json({
        ok: sent.state === 'sent', action: input.action, saved: false, notificationSent: sent.state === 'sent', notificationState: sent.state,
        message: sent.state === 'sent' ? 'La copie a été acceptée par le service d’envoi pour votre adresse. Aucun appel ni relecture n’a été demandé.'
          : 'L’envoi de la copie n’est pas confirmé. Vous pouvez garder votre lecture immédiatement ou réessayer.',
      }, sent.state === 'sent' ? 200 : 503);
    }
    const db = database(env);
    const hash = await sha256(JSON.stringify(input));
    const createdAt = new Date().toISOString();
    await db.prepare(`INSERT INTO experience_requests
      (id,payload_hash,action,created_at,contact_email,contact_phone,channel,first_name,question,context_json,synthesis,consent_json)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING`)
      .bind(input.requestId, hash, input.action, createdAt, input.email || null, input.phone || null, input.channel,
        input.firstName, input.question, JSON.stringify(input.context), input.synthesis, JSON.stringify({ ...input.consent, recordedAt: createdAt })).run();
    const row = await db.prepare('SELECT * FROM experience_requests WHERE id=?').bind(input.requestId).first<RequestRow>();
    if (!row || row.payload_hash !== hash) return json({ ok: false, code: 'REQUEST_CHANGED', message: 'Cette demande a changé. Vérifiez l’aperçu puis validez la nouvelle version.' }, 409);
    const sent = await notifyRequest(env, row);
    const notificationSent = sent.state === 'sent';
    return json({ ok: true, action: input.action, requestId: row.id, saved: true, notificationSent, notificationState: sent.state,
      message: notificationSent ? 'Votre demande est enregistrée et sa notification a été acceptée par le service d’envoi. Cela ne confirme pas encore sa lecture par Mouaad.'
        : 'Votre demande est enregistrée. Sa notification à Mouaad n’est pas confirmée ; la même demande est conservée, sans doublon. Vous pouvez aussi le contacter directement avec cette référence.',
    });
  } catch (error) { return failure(error); }
};
