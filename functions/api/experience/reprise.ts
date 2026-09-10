import {
  type ExperienceContext, codeHash, database, failure, invalid, json,
  rateLimit, readJson, sameHash, secret, sendMail, sha256,
} from '../../_lib/experience/common';

export interface AccessRow {
  id: string; request_id: string; note_id: string | null; token_hash: string; contact_email: string;
  context_json: string; synthesis: string; actor_id: string; created_at: string; expires_at: string;
  revoked_at: string | null; code_hash: string | null; code_expires_at: string | null;
  challenge_sent_at: string | null; challenge_count: number; attempts: number; last_verified_at: string | null;
}
const GENERIC_CHALLENGE = 'Si cet accès est valide, un code est envoyé à l’adresse autorisée. Consultez votre messagerie, puis saisissez le code. Sinon, vous pouvez demander un nouveau lien à Mouaad ou continuer librement.';
const INVALID_ACCESS = 'Cet accès ou ce code n’est pas valide. Demandez un nouveau lien à Mouaad ou continuez votre parcours librement.';

export const onRequest = async ({ request, env }: ExperienceContext): Promise<Response> => {
  try {
    const body = await readJson(request);
    if (!['challenge', 'verify'].includes(String(body.step))) invalid();
    // Configuration failures never reveal whether a specific grant exists.
    secret(env);
    if (!env.RESEND_API_KEY) return json({ ok: false, code: 'ACCESS_UNAVAILABLE', message: 'La vérification par e-mail est indisponible. Vous pouvez reprendre votre parcours librement ou écrire à Mouaad.' }, 503);
    const db = database(env);
    await rateLimit(request, env, `resume-${body.step}`);
    const tokenValid = typeof body.token === 'string' && /^[a-f0-9]{64}$/.test(body.token);
    const tokenHash = await sha256(tokenValid ? String(body.token) : 'invalid-token');
    const now = new Date().toISOString();
    if (body.step === 'challenge') {
      const bytes = crypto.getRandomValues(new Uint8Array(8));
      // Rejection sampling keeps each decimal digit uniform.
      const digits: number[] = [];
      for (const byte of bytes) if (byte < 250) digits.push(byte % 10);
      while (digits.length < 8) {
        const byte = crypto.getRandomValues(new Uint8Array(1))[0];
        if (byte < 250) digits.push(byte % 10);
      }
      const code = digits.slice(0, 8).join('');
      const expires = new Date(Date.now() + 10 * 60_000).toISOString();
      const earliest = new Date(Date.now() - 60_000).toISOString();
      // A rechallenge never resets verification attempts. The grant permits at
      // most five messages in total, protecting a recipient from link replay.
      const grant = await db.prepare(`UPDATE experience_access
        SET code_hash=?, code_expires_at=?, challenge_sent_at=?, challenge_count=challenge_count+1
        WHERE token_hash=? AND revoked_at IS NULL AND expires_at>? AND attempts<5 AND challenge_count<5
          AND (challenge_sent_at IS NULL OR challenge_sent_at<?)
        RETURNING *`).bind(await codeHash(tokenHash, code, env), expires, now, tokenHash, now, earliest).first<AccessRow>();
      if (grant) {
        const sent = await sendMail(env, {
          to: grant.contact_email, subject: 'Votre code de reprise LEVOIS',
          text: `Votre code de vérification LEVOIS : ${code}\n\nIl reste utilisable pendant 10 minutes, une seule fois. Il sert uniquement à ouvrir le contexte que Mouaad vous a partagé. Ne communiquez ce code à personne.\n\nSi vous n’avez pas demandé ce code, vous pouvez ignorer cet e-mail. Aucun projet ni coordonnée n’est révélé par cet e-mail.`,
        }, `experience-code-${grant.id}-${grant.challenge_count}`);
        if (sent.state !== 'sent') {
          await db.prepare('UPDATE experience_access SET code_hash=NULL, code_expires_at=NULL WHERE id=? AND code_hash=?')
            .bind(grant.id, grant.code_hash).run();
        }
      }
      return json({ ok: true, message: GENERIC_CHALLENGE });
    }
    const codeValid = typeof body.code === 'string' && /^\d{8}$/.test(body.code);
    const code = codeValid ? String(body.code) : 'invalid-code';
    // Every attempt increments atomically before comparison. Returning this
    // snapshot plus the second conditional write prevents simultaneous reuse.
    const grant = await db.prepare(`UPDATE experience_access SET attempts=attempts+1
      WHERE token_hash=? AND revoked_at IS NULL AND expires_at>? AND attempts<5
        AND code_hash IS NOT NULL AND code_expires_at>?
      RETURNING *`).bind(tokenHash, now, now).first<AccessRow>();
    const expected = await codeHash(tokenHash, code, env);
    if (!grant || !tokenValid || !codeValid || !sameHash(expected, grant.code_hash ?? '')) return json({ ok: false, code: 'ACCESS_INVALID', message: INVALID_ACCESS }, 403);
    const consumed = await db.prepare(`UPDATE experience_access SET code_hash=NULL, code_expires_at=NULL, last_verified_at=?
      WHERE id=? AND code_hash=? AND revoked_at IS NULL AND expires_at>? AND code_expires_at>?
      RETURNING *`).bind(now, grant.id, expected, now, now).first<AccessRow>();
    if (!consumed) return json({ ok: false, code: 'ACCESS_INVALID', message: INVALID_ACCESS }, 403);
    const note = consumed.note_id ? await db.prepare('SELECT id,text,reason,evidence,created_at FROM experience_notes WHERE id=? AND request_id=?')
      .bind(consumed.note_id, consumed.request_id).first<Record<string, unknown>>() : null;
    return json({ ok: true, context: JSON.parse(consumed.context_json), synthesis: consumed.synthesis,
      humanNote: note ? { id: note.id, text: note.text, reason: note.reason, evidence: note.evidence, createdAt: note.created_at, author: 'Mouaad Boullourou', kind: 'human-review' } : null,
      provenance: { mode: 'after-exchange', sharedAt: consumed.created_at, verifiedAt: now },
      message: 'Le contexte partagé est ouvert. Confirmez ou corrigez les éléments avant de poursuivre ; les notes de Mouaad restent identifiées séparément.',
    });
  } catch (error) { return failure(error); }
};
