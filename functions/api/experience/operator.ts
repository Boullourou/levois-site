import { authenticateCockpit, assertMutationSecurity, createCsrfToken, SecurityError } from '../../_lib/cockpit/security';
import {
  type ExperienceContext, database, email, failure, invalid, isoDate, json, line, randomToken,
  readJson, secret, sha256, string, uuid, validateContext,
} from '../../_lib/experience/common';
import { type RequestRow, notifyRequest } from './actions';

export const onRequest = async ({ request, env }: ExperienceContext): Promise<Response> => {
  try {
    const actor = await authenticateCockpit(request, env);
    const db = database(env);
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      const csrfToken = await createCsrfToken(request, actor, env);
      if (!id) {
        const rows = await db.prepare(`SELECT id,action,created_at,first_name,channel,question,notification_state,status
          FROM experience_requests ORDER BY created_at DESC LIMIT 100`).all();
        return json({ ok: true, csrfToken, items: rows.results });
      }
      const row = await db.prepare('SELECT * FROM experience_requests WHERE id=?').bind(uuid(id)).first<RequestRow>();
      if (!row) return json({ ok: false, code: 'NOT_FOUND', message: 'Demande introuvable.' }, 404);
      const notes = await db.prepare('SELECT * FROM experience_notes WHERE request_id=? ORDER BY created_at').bind(id).all();
      const accesses = await db.prepare('SELECT id,created_at,expires_at,revoked_at,last_verified_at,challenge_count,attempts FROM experience_access WHERE request_id=? ORDER BY created_at DESC').bind(id).all();
      const { payload_hash: _hash, ...safeRow } = row;
      return json({ ok: true, csrfToken, request: safeRow, notes: notes.results, accesses: accesses.results });
    }
    await assertMutationSecurity(request, actor, env);
    const body = await readJson(request);
    const requestId = uuid(body.requestId);
    if (body.operation === 'create-context') {
      if (body.authorized !== true) invalid('L’accord pour reprendre ce contexte par e-mail doit avoir été établi.');
      const context = validateContext(body.context);
      const contactEmail = email(body.email);
      const synthesis = string(body.synthesis, 30_000, true);
      const firstName = line(body.firstName, 80);
      const permissionEvidence = string(body.permissionEvidence, 3000, true);
      const consentAt = isoDate(body.agreedAt);
      if (Date.parse(consentAt) > Date.now() + 300_000) invalid();
      const createdAt = new Date().toISOString();
      const consent = { purpose: 'exchange', textVersion: '2026-09-10', acceptedAt: consentAt, recordedAt: createdAt,
        origin: 'operator-after-exchange', actorId: actor.id, evidence: permissionEvidence, scope: 'Reprise protégée du contexte convenu, sans relance commerciale.' };
      const fingerprint = await sha256(JSON.stringify({ requestId, context, contactEmail, synthesis, firstName, permissionEvidence, consentAt }));
      await db.prepare(`INSERT INTO experience_requests
        (id,payload_hash,action,created_at,contact_email,channel,first_name,question,context_json,synthesis,consent_json,notification_state)
        VALUES (?,?,'exchange',?,?,'email',?,'Contexte établi après échange avec Mouaad.',?,?,?,'not-requested') ON CONFLICT(id) DO NOTHING`)
        .bind(requestId, fingerprint, createdAt, contactEmail, firstName, JSON.stringify(context), synthesis, JSON.stringify(consent)).run();
      const saved = await db.prepare('SELECT payload_hash FROM experience_requests WHERE id=?').bind(requestId).first<{ payload_hash: string }>();
      if (saved?.payload_hash !== fingerprint) return json({ ok: false, code: 'REQUEST_CHANGED', message: 'Cette référence porte déjà un autre contexte. Utilisez une nouvelle référence.' }, 409);
      return json({ ok: true, requestId, saved: true, message: 'Le contexte après échange est enregistré avec sa trace d’accord. Ajoutez une note humaine puis créez le lien de reprise. Aucun envoi effectué.' }, 201);
    }
    const row = await db.prepare('SELECT * FROM experience_requests WHERE id=?').bind(requestId).first<RequestRow>();
    if (!row) return json({ ok: false, code: 'NOT_FOUND', message: 'Demande introuvable.' }, 404);
    if (body.operation === 'annotate') {
      const text = string(body.text, 10_000, true);
      const reason = string(body.reason, 4000, true);
      const evidence = string(body.evidence, 8000, true);
      const updated = body.context ? validateContext(body.context) : null;
      const original = JSON.parse(row.context_json);
      if (updated && (updated.id !== original.id || Number(updated.revision) < Number(original.revision))) invalid('La révision doit appartenir au même contexte et préserver son historique.');
      const id = uuid(body.noteId);
      const createdAt = new Date().toISOString();
      // Notes append; neither the visitor snapshot nor an earlier human note is overwritten.
      const existing = await db.prepare('SELECT * FROM experience_notes WHERE id=?').bind(id).first<Record<string, unknown>>();
      if (existing) {
        if (existing.request_id !== requestId || existing.text !== text || existing.reason !== reason || existing.evidence !== evidence || existing.context_json !== (updated ? JSON.stringify(updated) : null)) {
          return json({ ok: false, code: 'NOTE_CHANGED', message: 'Cette note existe déjà dans une autre version. Créez une nouvelle note.' }, 409);
        }
      } else {
        await db.prepare('INSERT INTO experience_notes(id,request_id,actor_id,created_at,text,reason,evidence,context_json) VALUES(?,?,?,?,?,?,?,?)')
          .bind(id, requestId, actor.id, createdAt, text, reason, evidence, updated ? JSON.stringify(updated) : null).run();
      }
      return json({ ok: true, noteId: id, message: 'La note humaine est enregistrée séparément. Aucun message n’a été envoyé.' });
    }
    if (body.operation === 'create-access') {
      secret(env);
      if (!env.RESEND_API_KEY) return json({ ok: false, code: 'ACCESS_UNAVAILABLE', message: 'Configurer l’envoi des codes avant de créer un lien de reprise.' }, 503);
      if (!row.contact_email) invalid('Cette demande n’a pas d’adresse e-mail autorisée. La reprise protégée nécessite un échange direct préalable.');
      if (body.authorized !== true) invalid('Confirmer que le partage de ce contexte a été convenu avec la personne.');
      const expiresAt = isoDate(body.expiresAt);
      const now = new Date().toISOString();
      if (Date.parse(expiresAt) <= Date.now()) invalid('Choisir une échéance de sécurité future pour ce lien.');
      const noteId = uuid(body.noteId);
      const note = await db.prepare('SELECT id,context_json FROM experience_notes WHERE id=? AND request_id=?').bind(noteId, requestId).first<{ id: string; context_json: string | null }>();
      if (!note) invalid('Le lien doit reprendre une note humaine existante de ce dossier.');
      const contextJson = note.context_json || row.context_json;
      if (note.context_json && body.synthesis === undefined) invalid('Une synthèse correspondante est requise pour partager le contexte révisé.');
      const synthesis = body.synthesis === undefined ? row.synthesis : string(body.synthesis, 30_000, true);
      const token = randomToken();
      const accessId = crypto.randomUUID();
      const publicOrigin = env.EXPERIENCE_PUBLIC_ORIGIN || new URL(request.url).origin;
      const publicUrl = new URL(publicOrigin);
      if (publicUrl.origin !== publicOrigin || (publicUrl.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(publicUrl.hostname))) invalid('Configurer une origine publique sûre.');
      await db.prepare(`INSERT INTO experience_access(id,request_id,note_id,token_hash,contact_email,context_json,synthesis,actor_id,created_at,expires_at)
        VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(accessId, requestId, noteId, await sha256(token), row.contact_email, contextJson, synthesis, actor.id, now, new Date(expiresAt).toISOString()).run();
      return json({ ok: true, accessId, url: `${publicOrigin}/reprendre#acces=${token}`, expiresAt,
        message: 'Lien créé, aucun envoi effectué. Un code sera envoyé à l’adresse déjà autorisée lorsque la personne demandera à ouvrir le lien.' }, 201);
    }
    if (body.operation === 'revoke-access') {
      const accessId = uuid(body.accessId);
      await db.prepare('UPDATE experience_access SET revoked_at=?,code_hash=NULL,code_expires_at=NULL WHERE id=? AND request_id=?')
        .bind(new Date().toISOString(), accessId, requestId).run();
      return json({ ok: true, message: 'Cet accès est révoqué.' });
    }
    if (body.operation === 'set-status') {
      if (!['open', 'answered', 'closed'].includes(String(body.status))) invalid();
      // Marking a reply is an explicit operator statement, not provider acceptance.
      await db.prepare('UPDATE experience_requests SET status=? WHERE id=?').bind(body.status, requestId).run();
      return json({ ok: true, message: 'Le statut de traitement est mis à jour.' });
    }
    if (body.operation === 'retry-notification') {
      if (['sending', 'unknown'].includes(row.notification_state)) return json({ ok: false, code: 'DELIVERY_UNCERTAIN', message: 'L’envoi précédent est incertain. Vérifiez le prestataire avant toute nouvelle notification.' }, 409);
      return json({ ok: true, saved: true, notification: await notifyRequest(env, row) });
    }
    if (body.operation === 'delete') {
      if (body.confirm !== 'delete-operational-request') invalid('Confirmer la suppression du dossier opérationnel.');
      // Cascades remove notes and invalidate all access grants. Provider mailboxes
      // remain a separate operator responsibility, visibly stated in the response.
      await db.prepare('DELETE FROM experience_requests WHERE id=?').bind(requestId).run();
      return json({ ok: true, message: 'Dossier opérationnel, notes et accès supprimés de cette base. Traiter séparément les copies éventuellement présentes dans les messageries des prestataires et de Mouaad.' });
    }
    invalid('Opération inconnue.');
  } catch (error) {
    if (error instanceof SecurityError) return json({ ok: false, code: error.code, message: error.message }, error.status);
    return failure(error);
  }
};
