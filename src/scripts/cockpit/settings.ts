import { requestJson } from './api';
import {
  addLabeledValue,
  badge,
  bindDialogControls,
  formDataObject,
  handleDialogBackdrop,
  node,
  renderEmpty,
  renderError,
  renderLoading,
  requiredElement,
  setSubmitState,
  showToast,
} from './ui';

type Advisor = {
  id: string;
  displayName?: string;
  network?: string;
  isCurrentOperator?: boolean | number;
  status?: string;
};

type AdvisorPayload = { items?: Advisor[] } | Advisor[];

const root = requiredElement<HTMLElement>('[data-advisor-list]');
const form = requiredElement<HTMLFormElement>('[data-advisor-form]');
let pendingIdempotencyKey: string | undefined;

function newIdempotencyKey(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `advisor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderAdvisor(advisor: Advisor): HTMLLIElement {
  const card = node('li', { className: 'cockpit-record-card' });
  const header = node('div', { className: 'cockpit-record-header' });
  const copy = node('div');
  copy.append(
    node('p', { className: 'cockpit-record-kicker', text: advisor.network || 'Réseau non renseigné' }),
    node('h2', { text: advisor.displayName || 'Conseiller sans nom affiché' }),
  );
  header.append(copy);
  if (Boolean(advisor.isCurrentOperator)) header.append(badge('Mon profil', 'success'));
  else header.append(badge('Conseiller TIM', 'neutral'));

  const details = node('dl', { className: 'cockpit-record-details' });
  addLabeledValue(details, 'Réseau', advisor.network || 'À préciser');
  addLabeledValue(details, 'État', advisor.status === 'active' ? 'Actif' : advisor.status);
  card.append(header, details);
  return card;
}

async function loadAdvisors(): Promise<void> {
  renderLoading(root, 'Chargement des profils conseillers…');
  try {
    const payload = await requestJson<AdvisorPayload>('/api/cockpit/advisors');
    const advisors = Array.isArray(payload) ? payload : payload.items ?? [];
    if (!advisors.length) {
      renderEmpty(
        root,
        'Aucun profil conseiller',
        'Ajoutez d’abord votre profil, puis les conseillers avec lesquels vous suivez des Accords TIM.',
      );
      return;
    }

    const list = node('ul', { className: 'cockpit-record-list' });
    for (const advisor of advisors) list.append(renderAdvisor(advisor));
    root.replaceChildren(list);
    root.setAttribute('aria-busy', 'false');
  } catch (error) {
    renderError(root, error, () => void loadAdvisors());
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const values = formDataObject(form);
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const errorBox = requiredElement<HTMLElement>('[data-dialog-error]', form);
  const currentOperator = form.elements.namedItem('isCurrentOperator');
  if (!submit || !(currentOperator instanceof HTMLInputElement)) return;

  errorBox.hidden = true;
  setSubmitState(submit, true);
  pendingIdempotencyKey ??= newIdempotencyKey();

  try {
    await requestJson('/api/cockpit/advisors/create', {
      method: 'POST',
      idempotencyKey: pendingIdempotencyKey,
      body: {
        displayName: values.displayName,
        network: values.network || undefined,
        isCurrentOperator: currentOperator.checked,
      },
    });
    pendingIdempotencyKey = undefined;
    form.closest('dialog')?.close();
    form.reset();
    showToast('Profil conseiller ajouté.');
    await loadAdvisors();
  } catch (error) {
    errorBox.textContent = error instanceof Error ? error.message : 'Le profil conseiller n’a pas pu être ajouté.';
    errorBox.hidden = false;
    setSubmitState(submit, false);
  }
});

bindDialogControls();
document.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) => {
  dialog.addEventListener('click', handleDialogBackdrop);
});
void loadAdvisors();
