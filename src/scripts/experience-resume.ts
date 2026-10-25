import { CONTEXT_KEY, parseContext, saveContext } from '../lib/experience/context';
import { keepReading } from '../lib/experience/export';
import { MAX_RESUME_FILE_BYTES, PROJECT_NAMES, parseResumeFile, resumeDestination, sharedContext } from '../lib/experience/resume';
import { requestJson } from '../lib/request-json';
import type { Context } from '../lib/experience/types';
import { deliveryIds, rememberDelivery } from '../lib/experience/diagnostic-delivery';

const root = document.querySelector<HTMLElement>('[data-resume-root]');
if (root) {
  const select = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const error = select<HTMLElement>('[data-resume-error]');
  const preview = select<HTMLElement>('[data-resume-compare]');
  const confirm = select<HTMLButtonElement>('[data-resume-confirm]');
  let current: Context | null = null;
  let candidate: Context | null = null;
  try { current = parseContext(JSON.parse(sessionStorage.getItem(CONTEXT_KEY) || 'null')); } catch { /* Storage may be disabled. */ }
  const describe = (context: Context) => `${PROJECT_NAMES[context.project]} · ${Object.keys(context.answers).length} réponse(s) conservée(s) · ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(context.updatedAt))}`;
  function showError(message: string) { error.textContent = message; error.hidden = false; }
  function propose(context: Context, source: string) {
    candidate = context;
    error.hidden = true;
    select<HTMLElement>('[data-candidate-description]').textContent = `${source}. ${describe(context)}. Vos versions et notes conservées restent disponibles.`;
    const replacesCurrent = current !== null && (current.id !== context.id || current.revision !== context.revision || JSON.stringify(current) !== JSON.stringify(context));
    select<HTMLElement>('[data-replace-warning]').hidden = !replacesCurrent;
    confirm.textContent = replacesCurrent ? 'Remplacer le projet ouvert par celui-ci' : 'Ouvrir ce projet';
    preview.hidden = false;
  }
  if (current) {
    const existing = current;
    select<HTMLElement>('[data-current-project]').hidden = false;
    select<HTMLElement>('[data-current-description]').textContent = describe(existing);
    select<HTMLAnchorElement>('[data-current-link]').href = resumeDestination(existing);
    const download = select<HTMLButtonElement>('[data-current-download]');
    download.hidden = !existing.reading || existing.reading.deliveryMode === 'email-arbitrage-v1' && !deliveryIds().includes(existing.reading.id);
    download.addEventListener('click', () => { if (existing.reading) keepReading(existing, existing.reading); });
  }
  select<HTMLInputElement>('#resume-file').addEventListener('change', async event => {
    candidate = null; preview.hidden = true; error.hidden = true;
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > MAX_RESUME_FILE_BYTES) return showError('Ce fichier dépasse 1 Mo. Choisissez un fichier de lecture LEVOIS téléchargé depuis le site.');
    try {
      const imported = parseResumeFile(await file.text());
      if (!imported) return showError('Ce fichier ne contient pas de projet LEVOIS reconnu. Rien n’a été remplacé.');
      propose(imported, 'Fichier conservé sur votre appareil');
    } catch { showError('Ce fichier ne peut pas être lu. Votre projet actuel reste inchangé.'); }
  });
  confirm.addEventListener('click', () => {
    if (!candidate) return;
    if (!saveContext(candidate)) return showError('Le navigateur empêche de conserver ce projet. Rien n’a été remplacé. Autorisez le stockage de session pour reprendre ; votre fichier reste consultable directement sur votre appareil.');
    // The person already holds this complete exported/shared reading. Do not ask for contact again to reopen it.
    if(candidate.reading)rememberDelivery(candidate.reading.id);
    location.assign(resumeDestination(candidate));
  });

  const accessToken = new URLSearchParams(location.hash.slice(1)).get('acces');
  if (accessToken !== null) {
    // The token stays in memory; no query string, analytics event or storage receives it.
    history.replaceState(null, '', `${location.pathname}${location.search}`);
    if (!/^[a-f0-9]{64}$/.test(accessToken)) showError('Ce lien de reprise est incomplet. Vous pouvez importer votre fichier ou demander un nouveau lien à Mouaad.');
    else {
      select<HTMLElement>('[data-protected-access]').hidden = false;
      const challenge = select<HTMLButtonElement>('[data-challenge]');
      const form = select<HTMLFormElement>('[data-code-form]');
      const status = select<HTMLElement>('[data-access-status]');
      const send = (body: Record<string, string>) => requestJson<{ ok: boolean; message?: string; context?: unknown; humanNote?: unknown }>('/api/experience/reprise', {
        method: 'POST', redirect: 'error', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...body, token: accessToken }),
      });
      challenge.addEventListener('click', async () => {
        challenge.disabled = true; status.hidden = false; status.textContent = 'Demande du code en cours…';
        try {
          const { response, data } = await send({ step: 'challenge' });
          status.textContent = data.message || 'L’envoi du code n’est pas confirmé. Réessayez ou contactez Mouaad.';
          if (response.ok && data.ok) { form.hidden = false; select<HTMLInputElement>('#resume-code').focus(); }
        } catch { status.textContent = 'La demande du code n’est pas confirmée. Réessayez dans un instant.'; }
        finally { challenge.disabled = false; }
      });
      form.addEventListener('submit', async event => {
        event.preventDefault(); if (!form.reportValidity()) return;
        const button = form.querySelector<HTMLButtonElement>('button')!;
        button.disabled = true; status.hidden = false; status.textContent = 'Vérification du code…';
        try {
          const { response, data } = await send({ step: 'verify', code: select<HTMLInputElement>('#resume-code').value });
          const verified = response.ok && data.ok ? sharedContext(data.context, data.humanNote) : null;
          if (verified) {
            propose(verified, 'Partagé après échange avec Mouaad');
            status.textContent = 'Le contexte partagé est disponible. Choisissez de l’ouvrir ci-dessous ; le projet actuel reste inchangé jusque-là.';
            form.hidden = true; challenge.hidden = true; confirm.focus();
          } else status.textContent = data.message || 'Cet accès ou ce code n’est pas valide. Demandez un nouveau lien à Mouaad.';
        } catch { status.textContent = 'La vérification n’est pas confirmée. Votre projet actuel reste inchangé.'; }
        finally { button.disabled = false; }
      });
    }
  }
}
