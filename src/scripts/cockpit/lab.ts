import { requestJson, withQuery } from './api';
import { LAB_STATUSES, labelFor } from './options';
import { badge, bindDialogControls, formatDate, formDataObject, handleDialogBackdrop, node, renderEmpty, renderError, renderLoading, requiredElement, setSubmitState, showToast } from './ui';

type LabItem = { id: string; observation?: string; problem?: string; learning?: string; proposal?: string; improvementProposal?: string; status?: string; observedAt?: string; internalReference?: string; version?: number };
type LabPayload = { items?: LabItem[]; observations?: LabItem[] } | LabItem[];

const root = requiredElement<HTMLElement>('[data-lab-list]');
const form = requiredElement<HTMLFormElement>('[data-lab-form]');

function renderItem(item: LabItem): HTMLLIElement {
  const card = node('li', { className: 'cockpit-record-card cockpit-lab-card' });
  const header = node('div', { className: 'cockpit-record-header' });
  const copy = node('div'); copy.append(node('p', { className: 'cockpit-record-kicker', text: `${item.internalReference || 'Sans référence'} · ${formatDate(item.observedAt)}` }), node('h2', { text: item.observation || 'Observation sans libellé' }));
  header.append(copy, badge(labelFor(LAB_STATUSES, item.status), item.status === 'accepted' ? 'success' : item.status === 'rejected' ? 'danger' : 'neutral'));
  const details = node('dl', { className: 'cockpit-lab-details' });
  for (const [label, value] of [['Problème', item.problem], ['Enseignement', item.learning], ['Proposition', item.proposal ?? item.improvementProposal]]) { const group = node('div'); group.append(node('dt', { text: label }), node('dd', { text: value || 'À compléter' })); details.append(group); }
  const status = node('form', { className: 'cockpit-inline-status-form' });
  const select = node('select', { attrs: { 'aria-label': 'Changer le statut' } });
  for (const option of LAB_STATUSES) select.append(node('option', { text: option.label, attrs: { value: option.value } })); select.value = item.status ?? 'captured';
  const button = node('button', { className: 'cockpit-button cockpit-button-quiet', text: 'Mettre à jour', attrs: { type: 'submit' } }); status.append(select, button);
  status.addEventListener('submit', async (event) => { event.preventDefault(); setSubmitState(button, true); try { await requestJson(`/api/cockpit/lab/${encodeURIComponent(item.id)}/status/change`, { method: 'POST', body: { status: select.value, expectedVersion: item.version } }); showToast('État Lab mis à jour.'); await loadLab(); } catch (error) { showToast(error instanceof Error ? error.message : 'La mise à jour a échoué.', 'error'); setSubmitState(button, false); } });
  card.append(header, details, status); return card;
}

async function loadLab(): Promise<void> {
  renderLoading(root, 'Chargement des observations…');
  try {
    const payload = await requestJson<LabPayload>(withQuery('/api/cockpit/lab', {}));
    const items = Array.isArray(payload) ? payload : payload.items ?? payload.observations ?? [];
    if (!items.length) { renderEmpty(root, 'Aucun enseignement enregistré', 'Capturez la première observation produit, après anonymisation.'); return; }
    const list = node('ul', { className: 'cockpit-record-list' }); for (const item of items) list.append(renderItem(item)); root.replaceChildren(list); root.setAttribute('aria-busy', 'false');
  } catch (error) { renderError(root, error, () => void loadLab()); }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault(); if (!form.reportValidity()) return;
  const values = formDataObject(form); const button = form.querySelector<HTMLButtonElement>('button[type="submit"]'); if (!button) return; const errorBox = requiredElement<HTMLElement>('[data-dialog-error]', form); errorBox.hidden = true; setSubmitState(button, true);
  const body = { observation: values.observation, problem: values.problem, learning: values.learning, improvementProposal: values.proposal, status: values.status, observedAt: new Date(`${values.observedAt}T12:00:00`).toISOString(), internalReference: values.internalReference || undefined, privacyConfirmed: true };
  const idempotencyKey = form.dataset.idempotencyKey || crypto.randomUUID();
  form.dataset.idempotencyKey = idempotencyKey;
  try {
    await requestJson('/api/cockpit/lab/create', { method: 'POST', body, idempotencyKey });
    delete form.dataset.idempotencyKey; form.closest('dialog')?.close(); form.reset(); showToast('Observation enregistrée.'); await loadLab();
  } catch (error) { errorBox.textContent = error instanceof Error ? error.message : 'L’observation n’a pas pu être enregistrée.'; errorBox.hidden = false; setSubmitState(button, false); }
});

bindDialogControls();
document.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) => dialog.addEventListener('click', handleDialogBackdrop));
document.addEventListener('click', () => { const date = form.elements.namedItem('observedAt'); if (date instanceof HTMLInputElement && !date.value) date.value = new Date().toISOString().slice(0, 10); });
void loadLab();
