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
type AgenticSwitch = {
  scopeKind?: string;
  scopeKey?: string;
  effectiveState?: 'enabled' | 'stopped';
  present?: boolean;
};
type AgenticSwitchPayload = {
  system?: string;
  environment?: string;
  mode?: string;
  previewD1?: string;
  fixtureOnly?: boolean;
  shadowMode?: boolean;
  monetaryCostMinor?: number;
  externalActionsEnabled?: boolean;
  items?: AgenticSwitch[];
};
type AgenticBriefingPayload = {
  state?: string;
  missionId?: string | null;
  generatedAt?: string | null;
  reasonCode?: string | null;
  fixtureOnly?: boolean;
  shadowMode?: boolean;
};

const root = requiredElement<HTMLElement>('[data-advisor-list]');
const agenticHealthRoot = requiredElement<HTMLElement>('[data-agentic-health]');
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

function switchState(switches: AgenticSwitch[], kind: string, key: string): string {
  const current = switches.find((entry) => entry.scopeKind === kind && entry.scopeKey === key);
  if (!current?.present) return 'Arrêté';
  return current.effectiveState === 'enabled' ? 'Actif' : 'Arrêté';
}

async function loadAgenticHealth(): Promise<void> {
  renderLoading(agenticHealthRoot, 'Lecture de l’état Agentic OS…');
  try {
    const [switchPayload, briefing] = await Promise.all([
      requestJson<AgenticSwitchPayload>('/api/cockpit/agentic/switches'),
      requestJson<AgenticBriefingPayload>('/api/cockpit/agentic/briefing/current'),
    ]);
    const switches = switchPayload.items ?? [];
    const card = node('article', { className: 'cockpit-record-card cockpit-agentic-health-card' });
    const header = node('div', { className: 'cockpit-record-header' });
    const copy = node('div');
    copy.append(
      node('p', { className: 'cockpit-record-kicker', text: 'Agentic OS' }),
      node('h2', { text: 'Pilot readiness Shadow' }),
    );
    header.append(copy, badge(switchPayload.system === 'active' ? 'Actif' : 'Arrêté', switchPayload.system === 'active' ? 'success' : 'neutral'));

    const details = node('dl', { className: 'cockpit-record-details' });
    addLabeledValue(details, 'Environnement', switchPayload.environment || 'Non renseigné');
    addLabeledValue(details, 'Mode', switchPayload.mode === 'SHADOW' ? 'SHADOW' : 'Indisponible');
    addLabeledValue(details, 'D1 preview', switchPayload.previewD1 === 'allowlisted' ? 'Allowlistée' : 'Non configurée');
    addLabeledValue(details, 'Dernière mission', briefing.missionId || 'Aucune');
    addLabeledValue(details, 'Dernier état', briefing.state || 'Indisponible');
    addLabeledValue(details, 'Dernière erreur', briefing.reasonCode || 'Aucune');
    addLabeledValue(details, 'Global', switchState(switches, 'global', 'global'));
    addLabeledValue(details, 'OPS-01', switchState(switches, 'agent', 'OPS-01'));
    addLabeledValue(details, 'COS-01', switchState(switches, 'agent', 'COS-01'));
    addLabeledValue(details, 'Coût actuel', `${(switchPayload.monetaryCostMinor ?? 0) / 100} €`);
    addLabeledValue(details, 'Actions externes', switchPayload.externalActionsEnabled ? 'Actives' : 'Aucune');
    card.append(header, details);
    agenticHealthRoot.replaceChildren(card);
    agenticHealthRoot.setAttribute('aria-busy', 'false');
  } catch (error) {
    const card = node('article', { className: 'cockpit-record-card cockpit-agentic-health-card' });
    const header = node('div', { className: 'cockpit-record-header' });
    const copy = node('div');
    copy.append(
      node('p', { className: 'cockpit-record-kicker', text: 'Agentic OS' }),
      node('h2', { text: 'Pilot readiness Shadow' }),
    );
    header.append(copy, badge('Arrêté', 'neutral'));
    const details = node('dl', { className: 'cockpit-record-details' });
    addLabeledValue(details, 'État', error instanceof Error ? error.message : 'Indisponible');
    addLabeledValue(details, 'Coût actuel', '0 €');
    addLabeledValue(details, 'Actions externes', 'Aucune');
    card.append(header, details);
    agenticHealthRoot.replaceChildren(card);
    agenticHealthRoot.setAttribute('aria-busy', 'false');
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
void loadAgenticHealth();
