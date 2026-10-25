import { textReading } from '../lib/experience/context';
import { requestJson } from '../lib/request-json';
import type { Context, Reading } from '../lib/experience/types';

export interface CaptureResponse {
  ok: boolean; saved?: boolean; requestId?: string; copySent?: boolean; copyState?: string;
  phoneExchangeRequested?: boolean; firstName?: string; message?: string;
}
const buttonLabel = 'Recevoir mon analyse d’arbitrage par email →';
export const captureFormHTML = () => '<form data-synthesis-form>' +
  '<div class="lv-capture-fields"><div class="lv-field"><label for="synthesis-first-name">Prénom</label><input id="synthesis-first-name" name="firstName" autocomplete="given-name" maxlength="80" required /></div>' +
  '<div class="lv-field"><label for="synthesis-email">Adresse e-mail</label><input id="synthesis-email" name="email" type="email" autocomplete="email" maxlength="254" required /></div></div>' +
  '<div class="lv-field"><label for="synthesis-phone">Téléphone <span class="lv-note">(facultatif, pour un échange direct)</span></label><input id="synthesis-phone" name="phone" type="tel" autocomplete="tel" maxlength="30" aria-describedby="synthesis-phone-help" />' +
  '<p id="synthesis-phone-help" class="lv-note">En indiquant votre numéro, vous demandez à Mouaad de vous contacter au sujet de ce projet.</p></div>' +
  '<div class="lv-honeypot" aria-hidden="true"><label>Site web<input name="site_web" tabindex="-1" autocomplete="off" /></label></div>' +
  '<p class="lv-note" id="synthesis-privacy">Vos coordonnées, vos réponses et votre synthèse sont transmises à Mouaad et conservées pour traiter votre demande. <a href="/confidentialite/">Utilisation de vos données</a>.</p>' +
  '<button class="lv-button" type="submit">' + buttonLabel + '</button>' +
  '<p class="lv-note lv-capture-reassurance">Une analyse construite à partir de vos réponses. Vous gardez la main, sans relance agressive.</p>' +
  '<p id="synthesis-status" role="status" aria-live="polite" hidden></p></form>';

/** A controller survives the gate-to-reading transition, including a failed mail retry. */
export function createDiagnosticCapture(context: Context, reading: Reading, onSaved: (data: CaptureResponse) => void) {
  let frozen: Record<string, unknown> | null = null;
  let fingerprint = '';
  let values = { firstName: '', email: '', phone: '' };
  let result: CaptureResponse | null = null;
  let pending = false;
  let acknowledged = false;
  return function mount(root: HTMLElement) {
    const form = root.querySelector<HTMLFormElement>('[data-synthesis-form]')!;
    const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
    const button = form.querySelector<HTMLButtonElement>('[type=submit]')!;
    const status = form.querySelector<HTMLElement>('[role=status]')!;
    for (const key of ['firstName','email','phone'] as const) field(key).value = values[key];
    function updateStatus() {
      if (!result) return;
      status.hidden = false; status.className = 'lv-note';
      status.textContent = result.copySent
        ? 'Votre analyse a été confiée au service d’envoi. Retrouvez-la aussi ci-dessous. Vérifiez vos courriers indésirables si nécessaire.'
        : 'Votre demande est enregistrée, mais l’envoi n’est pas confirmé. Votre analyse reste disponible ci-dessous et peut être téléchargée.';
      if (result.phoneExchangeRequested) status.textContent += ' Votre demande d’échange téléphonique est enregistrée pour ce projet.';
      const retryable = !result.copySent && ['pending','failed','unavailable'].includes(result.copyState || '');
      button.disabled = !retryable;
      button.textContent = retryable ? 'Réessayer l’envoi de mon analyse' : result.copySent ? 'Analyse transmise au service d’envoi' : 'Demande enregistrée · envoi à vérifier';
    }
    updateStatus();
    form.addEventListener('input', () => {
      if (pending) return;
      const next = JSON.stringify(['firstName','email','phone'].map(k => field(k).value.trim()));
      if (next !== fingerprint) { button.disabled = false; button.textContent = buttonLabel; status.hidden = true; }
      field('firstName').setCustomValidity(''); field('phone').setCustomValidity('');
    });
    form.addEventListener('submit', async event => {
      event.preventDefault(); if (pending) return;
      values = { firstName: field('firstName').value.trim().normalize('NFC'), email: field('email').value.trim(), phone: field('phone').value.trim() };
      field('firstName').setCustomValidity(/^[\p{L}][\p{L}\p{M} '\u2019\u02BC-]{0,79}$/u.test(values.firstName) ? '' : 'Indiquez votre prénom avec des lettres, espaces, apostrophes ou tirets.');
      const digits = values.phone.replace(/\D/g, '').length;
      field('phone').setCustomValidity(!values.phone || /^\+?[\d ().-]+$/.test(values.phone) && digits >= 8 && digits <= 15 ? '' : 'Vérifiez le numéro, ou laissez ce champ vide pour recevoir uniquement l’e-mail.');
      if (!form.reportValidity()) return;
      const next = JSON.stringify([values.firstName, values.email, values.phone]);
      if (!frozen || fingerprint !== next) {
        fingerprint = next; result = null;
        frozen = { action: 'synthesis-email', channel: 'email', ...values, requestId: crypto.randomUUID(), approved: true,
          context, synthesis: textReading(reading, context), site_web: field('site_web').value,
          consent: { purpose: 'synthesis', textVersion: '2026-10-25-arbitrage', acceptedAt: new Date().toISOString() } };
      }
      pending = true; button.disabled = true;
      ['firstName','email','phone'].forEach(key => field(key).readOnly = true);
      status.hidden = false; status.className = 'lv-note'; status.textContent = 'Préparation et envoi de votre analyse…';
      let unlock = false;
      try {
        const {response, data} = await requestJson<CaptureResponse>('/api/experience/actions', {
          method:'POST', redirect:'error', cache:'no-store', headers:{'content-type':'application/json'}, body:JSON.stringify(frozen),
        });
        if (response.ok && data.ok && data.saved === true && data.requestId === frozen.requestId) {
          result = data; updateStatus(); unlock = !acknowledged; acknowledged = true;
        } else {
          status.className = 'lv-error'; status.textContent = data.message || 'Votre demande n’a pas été confirmée. Vérifiez vos coordonnées et réessayez.'; button.disabled = false;
        }
      } catch {
        status.className = 'lv-error'; status.textContent = 'La connexion a interrompu la confirmation. Réessayez : la même demande est conservée pour éviter un doublon.'; button.disabled = false;
      } finally {
        pending = false; ['firstName','email','phone'].forEach(key => field(key).readOnly = false);
      }
      if (unlock && result) onSaved(result);
    });
  };
}
