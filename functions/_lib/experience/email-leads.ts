import { database, json, sendMail, sha256, type ExperienceEnv, type MailResult } from './common';
import type { ActionInput } from '../../api/experience/actions';

export const ARBITRAGE_CONSENT_VERSION = '2026-10-25-arbitrage';
type DeliveryState = MailResult['state'] | 'pending' | 'sending';
interface EmailLeadRow {
  id: string; payload_hash: string; created_at: string; contact_email: string;
  context_json: string; synthesis: string; consent_json: string;
  copy_state: DeliveryState; advisor_state: DeliveryState;
}

interface LeadContact { firstName: string; phone: string | null; phoneExchangeRequested: boolean }
function leadContact(row: EmailLeadRow): LeadContact | null {
  const consent = JSON.parse(row.consent_json) as { textVersion?: string; contact?: { firstName?: string; phone?: string | null }; phoneExchangeRequested?: boolean };
  if (consent.textVersion !== ARBITRAGE_CONSENT_VERSION || typeof consent.contact?.firstName !== 'string') return null;
  const phone = typeof consent.contact.phone === 'string' && consent.contact.phone ? consent.contact.phone : null;
  return { firstName: consent.contact.firstName, phone, phoneExchangeRequested: consent.phoneExchangeRequested === true && phone !== null };
}

async function deliver(env: ExperienceEnv, row: EmailLeadRow, recipient: 'copy' | 'advisor'): Promise<DeliveryState> {
  const db = database(env);
  // Only these constant column prefixes enter SQL. Each recipient has a separate
  // atomic claim: an unknown/sending state is never resent automatically.
  const claimed = await db.prepare(`UPDATE experience_email_leads SET ${recipient}_state='sending', ${recipient}_updated_at=?, ${recipient}_attempts=${recipient}_attempts+1
    WHERE id=? AND ${recipient}_state IN ('pending','failed','unavailable') RETURNING id`)
    .bind(new Date().toISOString(), row.id).first<{ id: string }>();
  if (!claimed) {
    const current = await db.prepare(`SELECT ${recipient}_state AS state FROM experience_email_leads WHERE id=?`).bind(row.id).first<{ state: DeliveryState }>();
    return current?.state || 'unknown';
  }
  const contact = leadContact(row);
  const phoneIntent = contact?.phoneExchangeRequested
    ? 'Vous avez demandé un échange direct par téléphone au sujet de ce projet. Aucun rendez-vous n’est confirmé.'
    : 'Aucun appel ni rendez-vous n’est demandé.';
  const mail = recipient === 'copy' ? {
    to: row.contact_email,
    subject: contact ? 'Votre synthèse d’arbitrage LEVOIS' : 'Votre synthèse LEVOIS — une trace pour avancer',
    text: contact
      ? `Bonjour ${contact.firstName},\n\n${row.synthesis}\n\nVous avez demandé cette synthèse d’arbitrage et l’enregistrement de votre projet auprès de Mouaad Boullourou. ${phoneIntent} Aucun abonnement à une newsletter ni accord de prospection générale.\n\nPour échanger : https://levois.fr/contact/\nVos données et vos droits : https://levois.fr/confidentialite/\nRéférence : ${row.id}`
      : `${row.synthesis}\n\nVous avez demandé cette synthèse et l’enregistrement de votre projet auprès de Mouaad Boullourou. Aucun appel, rendez-vous, newsletter ou suivi commercial général n’est demandé.\n\nPour choisir un échange : https://levois.fr/contact/\nVos données et vos droits : https://levois.fr/confidentialite/\nRéférence : ${row.id}`,
  } : {
    to: env.LEAD_TO_EMAIL || env.LEAD_TO || 'mouaad@levois.fr',
    replyTo: row.contact_email,
    subject: contact ? 'LEVOIS · Arbitrage demandé — ' + contact.firstName : 'LEVOIS · Synthèse demandée — projet en réflexion',
    text: [
      'SYNTHÈSE DEMANDÉE PAR E-MAIL — PROJET CONSERVÉ AVEC ACCORD',
      `Référence : ${row.id}`, `Enregistré le : ${row.created_at}`, `E-mail : ${row.contact_email}`,
      ...(contact ? [`Prénom : ${contact.firstName}`, `Téléphone : ${contact.phone || 'Non indiqué'}`,
        contact.phoneExchangeRequested ? 'Échange direct par téléphone demandé, limité à ce projet. Aucun créneau de rendez-vous confirmé.' : 'Aucun échange téléphonique demandé.'] : []),
      contact ? 'Synthèse d’arbitrage demandée. Aucune relecture humaine supplémentaire demandée.' : 'La personne garde une trace de son projet. Aucun appel, rendez-vous ou relecture humaine n’est demandé.',
      'Aucun accord de newsletter, prospection générale ou relance automatique.',
      '', 'SYNTHÈSE DEMANDÉE', row.synthesis,
      '', 'RÉPONSES DÉCLARÉES — À VÉRIFIER', row.context_json,
      '', 'ACCORD ENREGISTRÉ', row.consent_json,
    ].join('\n'),
  };
  const sent = await sendMail(env, mail, `experience-synthesis-${recipient}-${row.id}`, recipient === 'advisor');
  try {
    await db.prepare(`UPDATE experience_email_leads SET ${recipient}_state=?, ${recipient}_provider=?, ${recipient}_updated_at=? WHERE id=?`)
      .bind(sent.state, sent.provider || null, new Date().toISOString(), row.id).run();
  } catch {
    // Keep the sending claim if the transport result cannot be persisted.
    // A subsequent request can inspect the dossier without duplicating mail.
  }
  return sent.state;
}

export async function captureSynthesis(input: ActionInput, env: ExperienceEnv): Promise<Response> {
  const db = database(env);
  const fingerprint = await sha256(JSON.stringify(input));
  const createdAt = new Date().toISOString();
  const arbitrage = input.consent.textVersion === ARBITRAGE_CONSENT_VERSION;
  const phoneExchangeRequested = arbitrage && input.phone !== '';
  // Contact preferences are part of the recorded transmission agreement, never
  // the anonymous browser context or an exported reading. No schema change.
  const consent = {
    ...input.consent, recordedAt: createdAt,
    ...(input.articleContext ? {articleContext:input.articleContext} : {}),
    scope: arbitrage
      ? 'Synthèse d’arbitrage par e-mail et projet enregistré auprès de Mouaad. '
        + (phoneExchangeRequested ? 'Échange direct par téléphone demandé pour ce projet. ' : 'Aucun échange téléphonique demandé. ')
        + 'Aucune newsletter ni prospection générale.'
      : 'Synthèse par e-mail et projet enregistré auprès de Mouaad. Aucun appel, newsletter ni prospection générale.',
    ...(arbitrage ? { contact: { firstName: input.firstName, phone: input.phone || null }, phoneExchangeRequested } : {}),
  };
  await db.prepare(`INSERT INTO experience_email_leads
    (id,payload_hash,created_at,contact_email,context_json,synthesis,consent_json)
    VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING`)
    .bind(input.requestId, fingerprint, createdAt, input.email, JSON.stringify(input.context), input.synthesis,
      JSON.stringify(consent)).run();
  const row = await db.prepare('SELECT * FROM experience_email_leads WHERE id=?').bind(input.requestId).first<EmailLeadRow>();
  if (!row || row.payload_hash !== fingerprint) return json({ ok: false, code: 'REQUEST_CHANGED', message: 'Cette demande a changé. Vérifiez la synthèse puis validez une nouvelle demande.' }, 409);
  const [copyState, advisorState] = await Promise.all([deliver(env, row, 'copy'), deliver(env, row, 'advisor')]);
  const copySent = copyState === 'sent';
  const advisorNotificationSent = advisorState === 'sent';
  return json({
    ok: true, action: input.action, requestId: row.id, saved: true,
    copySent, copyState, advisorNotificationSent, advisorNotificationState: advisorState,
    notificationSent: copySent, notificationState: copyState,
    ...(arbitrage ? { firstName: input.firstName, phoneExchangeRequested } : {}),
    message: (copySent
      ? 'Votre projet est enregistré. Le service d’envoi a accepté votre synthèse ; vérifiez aussi vos courriers indésirables.'
      : 'Votre projet est enregistré, mais l’envoi de votre synthèse n’est pas confirmé. Vous pouvez la télécharger pour la garder immédiatement.')
      + (advisorNotificationSent ? ' La notification à Mouaad a été acceptée par le service d’envoi.' : ' La notification à Mouaad n’est pas confirmée ; votre projet reste enregistré.')
      + (phoneExchangeRequested ? ' Votre demande d’échange par téléphone est enregistrée pour ce projet. Aucun abonnement à une newsletter.' : ' Aucun appel ni newsletter n’a été demandé.'),
  });
}
