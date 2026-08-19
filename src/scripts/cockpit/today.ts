import { CockpitApiError, requestJson } from './api';
import {
  presentBriefing,
  presentBriefingFailure,
  type BriefingItemPresentation,
  type BriefingPresentation,
} from './agentic-briefing-presenter';
import { PRIORITIES, labelFor } from './options';
import { badge, formatDate, linkButton, node, renderError, renderLoading, requiredElement } from './ui';

type WorkItem = {
  id: string;
  title?: string;
  label?: string;
  subjectLabel?: string;
  contextLabel?: string;
  dueAt?: string;
  priority?: string;
  waitingReason?: string;
  promisedAt?: string;
  daysOverdue?: number;
  projectId?: string;
  personId?: string;
  timAgreementId?: string;
  version?: number;
};

type MissingAction = {
  id: string;
  label?: string;
  kind?: 'project' | 'tim' | 'tim_agreement';
  projectId?: string;
  personId?: string;
  timAgreementId?: string;
  status?: string;
};

type TodayPayload = {
  actionsToday?: WorkItem[];
  actions_today?: WorkItem[];
  overdue?: WorkItem[];
  overdueTasks?: WorkItem[];
  overdue_tasks?: WorkItem[];
  missingNextActions?: MissingAction[];
  missing_next_actions?: MissingAction[];
  withoutNextAction?: MissingAction[];
  promisedFollowUps?: WorkItem[];
  promised_follow_ups?: WorkItem[];
  promisedReturns?: WorkItem[];
  newDossiers?: WorkItem[];
  new_dossiers?: WorkItem[];
};

const root = requiredElement<HTMLElement>('[data-today-root]');
const agenticRoot = requiredElement<HTMLElement>('[data-agentic-briefing]');
const agenticContent = requiredElement<HTMLElement>('[data-agentic-content]', agenticRoot);
const agenticStatus = requiredElement<HTMLElement>('[data-agentic-status]', agenticRoot);
const agenticMeta = requiredElement<HTMLElement>('[data-agentic-meta]', agenticRoot);
const agenticRefresh = requiredElement<HTMLButtonElement>('[data-agentic-refresh]', agenticRoot);
let pendingBriefingRun = false;
let pendingBriefingRunKey: string | undefined;
let lastBriefing: BriefingPresentation | undefined;

function newIdempotencyKey(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `agentic-briefing-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setAgenticBusy(label: string): void {
  agenticRoot.setAttribute('aria-busy', 'true');
  agenticStatus.className = 'cockpit-agentic-status is-loading';
  agenticStatus.textContent = label;
  agenticMeta.textContent = 'Exécution manuelle et déterministe sur fixtures fictives.';
  agenticRefresh.disabled = true;
  agenticRefresh.textContent = pendingBriefingRun ? 'Actualisation…' : 'Actualiser le briefing';
  const state = node('div', { className: 'cockpit-agentic-state is-loading' });
  state.append(
    node('span', { className: 'cockpit-spinner', attrs: { 'aria-hidden': 'true' } }),
    node('p', { text: pendingBriefingRun ? 'Calcul du briefing Shadow…' : 'Chargement du briefing Shadow…' }),
  );
  agenticContent.replaceChildren(state);
}

function priorityTone(priority: BriefingItemPresentation['priority']): 'neutral' | 'info' | 'warning' | 'danger' {
  if (priority === 'urgent') return 'danger';
  if (priority === 'high') return 'warning';
  if (priority === 'normal') return 'info';
  return 'neutral';
}

function renderBriefingItem(item: BriefingItemPresentation): HTMLLIElement {
  const row = node('li', { className: 'cockpit-agentic-item' });
  const rank = node('span', { className: 'cockpit-agentic-rank', text: String(item.rank), attrs: { 'aria-hidden': 'true' } });
  const body = node('div', { className: 'cockpit-agentic-item-body' });
  const heading = node('div', { className: 'cockpit-agentic-item-heading' });
  heading.append(node('h3', { text: item.referenceLabel }), badge(item.priorityLabel, priorityTone(item.priority)));
  body.append(
    heading,
    node('p', { className: 'cockpit-agentic-explanation', text: item.explanation }),
  );

  const action = node('p', { className: 'cockpit-agentic-action' });
  action.append(
    node('strong', { text: 'Action humaine proposée' }),
    node('span', { text: item.suggestedHumanAction }),
  );
  body.append(action);

  const source = node('p', { className: 'cockpit-agentic-source' });
  source.append(node('span', { text: item.sourceLabel }));
  if (item.signalCount > 1) source.append(node('span', { text: `${item.signalCount} signaux regroupés` }));
  body.append(source);

  row.append(rank, body);
  if (item.href) row.append(linkButton('Ouvrir', item.href));
  return row;
}

function renderBriefing(presentation: BriefingPresentation): void {
  lastBriefing = presentation;
  agenticRoot.dataset.state = presentation.state;
  agenticRoot.setAttribute('aria-busy', 'false');
  agenticStatus.className = `cockpit-agentic-status is-${presentation.state}`;
  agenticStatus.textContent = presentation.statusLabel;
  agenticMeta.textContent = presentation.generatedAt
    ? `Photographie au ${formatDate(presentation.generatedAt, true)}`
    : 'Exécution manuelle uniquement.';
  agenticRefresh.textContent = 'Actualiser le briefing';
  agenticRefresh.disabled = pendingBriefingRun || presentation.state === 'stopped';

  if (presentation.state !== 'available') {
    const state = node('div', { className: `cockpit-agentic-state is-${presentation.state}` });
    state.append(node('p', { text: presentation.summary }));
    agenticContent.replaceChildren(state);
    return;
  }

  const fragment = document.createDocumentFragment();
  fragment.append(node('p', { className: 'cockpit-agentic-summary', text: presentation.summary }));
  const list = node('ol', { className: 'cockpit-agentic-list' });
  for (const item of presentation.items) list.append(renderBriefingItem(item));
  fragment.append(list);
  if (presentation.omittedCount > 0) {
    fragment.append(node('p', {
      className: 'cockpit-agentic-omitted',
      text: `${presentation.omittedCount} autre${presentation.omittedCount > 1 ? 's' : ''} anomalie${presentation.omittedCount > 1 ? 's' : ''} reste${presentation.omittedCount > 1 ? 'nt' : ''} dans la file détaillée.`,
    }));
  }
  agenticContent.replaceChildren(fragment);
}

async function loadBriefing(showLoading = true): Promise<void> {
  if (showLoading) setAgenticBusy('Chargement');
  try {
    const payload = await requestJson<unknown>('/api/cockpit/agentic/briefing/current');
    renderBriefing(presentBriefing(payload));
  } catch (error) {
    const code = error instanceof CockpitApiError ? error.code : undefined;
    renderBriefing(presentBriefingFailure(code));
  }
}

async function runBriefing(): Promise<void> {
  if (pendingBriefingRun) return;
  pendingBriefingRun = true;
  pendingBriefingRunKey ??= newIdempotencyKey();
  setAgenticBusy('Actualisation');
  try {
    await requestJson('/api/cockpit/agentic/briefing/run', {
      method: 'POST',
      idempotencyKey: pendingBriefingRunKey,
      body: { fixtureOnly: true, fixtureId: 'agentic-a1-v1' },
    });
    pendingBriefingRunKey = undefined;
    await loadBriefing(false);
  } catch (error) {
    const code = error instanceof CockpitApiError ? error.code : undefined;
    renderBriefing(presentBriefingFailure(code));
  } finally {
    pendingBriefingRun = false;
    agenticRefresh.textContent = 'Actualiser le briefing';
    agenticRefresh.disabled = lastBriefing?.state === 'stopped';
  }
}

agenticRefresh.addEventListener('click', () => void runBriefing());

function itemHref(item: WorkItem | MissingAction): string {
  if (item.timAgreementId) return `/cockpit/tim/dossier?id=${encodeURIComponent(item.timAgreementId)}`;
  if (item.personId) return `/cockpit/clients/dossier?id=${encodeURIComponent(item.personId)}`;
  if (item.projectId) return `/cockpit/clients?project=${encodeURIComponent(item.projectId)}`;
  if ('kind' in item && item.kind === 'tim' && item.id) return `/cockpit/tim/dossier?id=${encodeURIComponent(item.id)}`;
  if ('kind' in item && item.kind === 'project' && item.id) return `/cockpit/clients?project=${encodeURIComponent(item.id)}`;
  return '#';
}

function renderWorkItem(item: WorkItem, context: 'today' | 'overdue' | 'promised'): HTMLLIElement {
  const row = node('li', { className: 'cockpit-work-item' });
  const main = node('div', { className: 'cockpit-work-item-main' });
  const title = node('a', {
    className: 'cockpit-work-item-title',
    text: item.title || item.label || 'Action à préciser',
    attrs: { href: itemHref(item) },
  });
  const meta = node('p', { className: 'cockpit-work-item-meta' });
  const due = context === 'promised' ? item.promisedAt || item.dueAt : item.dueAt;
  meta.append(node('span', { text: formatDate(due, true) }));
  if (item.subjectLabel || item.contextLabel) meta.append(node('span', { text: item.subjectLabel || item.contextLabel }));
  if (item.waitingReason) meta.append(node('span', { text: `En attente : ${item.waitingReason}` }));
  main.append(title, meta);

  const aside = node('div', { className: 'cockpit-work-item-aside' });
  if (context === 'overdue') {
    const days = typeof item.daysOverdue === 'number' ? item.daysOverdue : undefined;
    aside.append(badge(days === undefined ? 'En retard' : `${days} j de retard`, 'danger'));
  } else if (item.priority) {
    aside.append(badge(labelFor(PRIORITIES, item.priority), item.priority === 'urgent' ? 'danger' : item.priority === 'high' ? 'warning' : 'neutral'));
  }
  aside.append(linkButton('Ouvrir', itemHref(item)));
  row.append(main, aside);
  return row;
}

function renderMissingItem(item: MissingAction): HTMLLIElement {
  const row = node('li', { className: 'cockpit-work-item is-warning' });
  const main = node('div', { className: 'cockpit-work-item-main' });
  main.append(
    node('a', { className: 'cockpit-work-item-title', text: item.label || 'Dossier actif', attrs: { href: itemHref(item) } }),
    node('p', { className: 'cockpit-work-item-meta', text: item.kind === 'tim' || item.kind === 'tim_agreement' ? 'Accord TIM actif' : 'Projet actif' }),
  );
  row.append(main, badge('Sans prochaine action', 'warning'), linkButton('Planifier', itemHref(item)));
  return row;
}

function workPanel(
  id: string,
  kicker: string,
  title: string,
  items: Array<WorkItem | MissingAction>,
  emptyText: string,
  renderer: (item: never) => HTMLLIElement,
  primary = false,
): HTMLElement {
  const section = node('section', {
    className: `cockpit-work-panel${primary ? ' cockpit-work-panel-primary' : ''}`,
    attrs: { 'aria-labelledby': id },
  });
  const heading = node('div', { className: 'cockpit-panel-heading' });
  const copy = node('div');
  copy.append(node('p', { text: kicker }), node('h2', { text: title, attrs: { id } }));
  heading.append(copy, node('span', { className: 'cockpit-count', text: String(items.length), attrs: { 'aria-label': `${items.length} élément${items.length > 1 ? 's' : ''}` } }));
  section.append(heading);
  if (!items.length) {
    section.append(node('p', { className: 'cockpit-panel-empty', text: emptyText }));
    return section;
  }
  const list = node('ul', { className: 'cockpit-work-list' });
  for (const item of items) list.append(renderer(item as never));
  section.append(list);
  return section;
}

async function loadToday(): Promise<void> {
  renderLoading(root, 'Chargement de la file de travail…');
  try {
    const payload = await requestJson<TodayPayload>('/api/cockpit/today');
    const actions = payload.actionsToday ?? payload.actions_today ?? [];
    const overdue = payload.overdue ?? payload.overdueTasks ?? payload.overdue_tasks ?? [];
    const missing = payload.missingNextActions ?? payload.missing_next_actions ?? payload.withoutNextAction ?? [];
    const promised = payload.promisedFollowUps ?? payload.promised_follow_ups ?? payload.promisedReturns ?? [];
    const newDossiers = payload.newDossiers ?? payload.new_dossiers ?? [];

    const grid = node('div', { className: 'cockpit-work-grid' });
    grid.append(
      workPanel('actions-title', 'Priorité', 'Actions du jour', actions, 'Aucune action prévue aujourd’hui.', (item) => renderWorkItem(item, 'today'), true),
      workPanel('late-title', 'À reprendre', 'Échéances dépassées', overdue, 'Aucune échéance dépassée.', (item) => renderWorkItem(item, 'overdue')),
      workPanel('missing-title', 'Vigilance', 'Sans prochaine action', missing, 'Tous les dossiers actifs ont une prochaine action.', renderMissingItem),
      workPanel('promises-title', 'Engagements', 'Retours promis', promised, 'Aucun retour promis en attente.', (item) => renderWorkItem(item, 'promised')),
      workPanel('new-title', 'À traiter', 'Nouveaux dossiers', newDossiers, 'Aucun nouveau dossier manuel à traiter.', (item) => renderWorkItem(item, 'today')),
    );
    root.replaceChildren(grid);
    root.setAttribute('aria-busy', 'false');
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    renderError(root, error, () => void loadToday());
  }
}

void loadBriefing();
void loadToday();
