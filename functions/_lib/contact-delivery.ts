import { database, failure, json, sendMail, sha256, uuid, type ExperienceEnv, type Mail, type MailResult } from './experience/common';

type State = MailResult['state'] | 'pending' | 'sending';
interface Receipt { id: string; payload_hash: string; notification_state: State }
type DeliveryEnv = Pick<ExperienceEnv,'RECHERCHE_DB'|'RESEND_API_KEY'|'LEAD_FROM_EMAIL'|'LEAD_FROM'|'LEAD_TO_EMAIL'|'LEAD_TO'|'FORMSPREE_ENDPOINT'>;

/** A durable atomic claim prevents duplicate messages across workers and retries.
 * The message itself is never stored here. An uncertain delivery is not resent.
 */
export async function deliverContact(env: DeliveryEnv, requestId: unknown, mail: Mail): Promise<Response> {
  try {
    const id = uuid(requestId);
    const db = database(env);
    const hash = await sha256(JSON.stringify(mail));
    const now = new Date().toISOString();
    await db.prepare(`INSERT INTO contact_delivery_receipts (id,payload_hash,created_at,updated_at)
      VALUES (?,?,?,?) ON CONFLICT(id) DO NOTHING`).bind(id, hash, now, now).run();
    const receipt = await db.prepare('SELECT id,payload_hash,notification_state FROM contact_delivery_receipts WHERE id=?')
      .bind(id).first<Receipt>();
    if (!receipt || receipt.payload_hash !== hash) {
      return json({ok:false,requestId:id,code:'REQUEST_CHANGED',retryable:false,message:'Cette référence correspond à un autre message. Vérifiez votre texte avant de créer une nouvelle demande.'},409);
    }
    let state = receipt.notification_state;
    const claim = await db.prepare(`UPDATE contact_delivery_receipts SET notification_state='sending',updated_at=?,attempts=attempts+1
      WHERE id=? AND notification_state IN ('pending','failed','unavailable') RETURNING id`).bind(now,id).first<{id:string}>();
    if (claim) {
      const result = await sendMail(env,mail,`levois-contact-${id}`,true);
      state = result.state;
      // If this write fails, keep the sending claim: a retry must not send again.
      try {
        await db.prepare('UPDATE contact_delivery_receipts SET notification_state=?,notification_provider=?,updated_at=? WHERE id=?')
          .bind(state,result.provider||null,new Date().toISOString(),id).run();
      } catch { /* provider result remains truthful for this response */ }
    } else {
      const current = await db.prepare('SELECT notification_state FROM contact_delivery_receipts WHERE id=?')
        .bind(id).first<{notification_state:State}>();
      state = current?.notification_state || 'unknown';
    }
    const accepted = state === 'sent';
    const retryable = ['pending','failed','unavailable'].includes(state);
    return json({ok:accepted,requestId:id,notificationSent:accepted,notificationState:state,retryable,
      message:accepted
        ? 'Votre message a été accepté par le service de transmission. Cela ne confirme pas encore sa lecture par Mouaad.'
        : retryable
          ? 'La transmission n’est pas confirmée. Votre message reste affiché : vous pouvez réessayer la même demande.'
          : 'La confirmation du service d’envoi est incertaine. Pour éviter un doublon, ne renvoyez pas ce message. Vous pouvez contacter Mouaad directement avec cette référence.',
    },accepted?200:retryable?503:202);
  } catch (error) { return failure(error); }
}
