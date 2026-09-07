import { requestJson } from './api';
import { PRIORITIES, labelFor } from './options';
import { formatDate, node, renderError, renderLoading, requiredElement } from './ui';

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

function itemHref(item: WorkItem | MissingAction): string {
  if (item.timAgreementId) return `/cockpit/tim/dossier?id=${encodeURIComponent(item.timAgreementId)}`;
  if (item.personId) return `/cockpit/clients/dossier?id=${encodeURIComponent(item.personId)}`;
  if (item.projectId) return `/cockpit/clients?project=${encodeURIComponent(item.projectId)}`;
  if ('kind' in item && item.kind === 'tim' && item.id) return `/cockpit/tim/dossier?id=${encodeURIComponent(item.id)}`;
  if ('kind' in item && item.kind === 'project' && item.id) return `/cockpit/clients?project=${encodeURIComponent(item.id)}`;
  return '#';
}

function formatTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function renderWorkItem(item: WorkItem, context: 'today' | 'overdue' | 'promised'): HTMLLIElement {
  const row = node('li', { className: `cockpit-work-item is-${context}` });
  const link = node('a', { className: 'cockpit-score-link', attrs: { href: itemHref(item) } });
  const due = context === 'promised' ? item.promisedAt || item.dueAt : item.dueAt;
  const timing = node('div', { className: 'cockpit-score-time' });
  timing.append(
    node('strong', { text: formatTime(due) }),
    node('span', { text: context === 'overdue' ? 'En retard' : context === 'promised' ? 'Promis' : 'Aujourd’hui' }),
  );
  const main = node('div', { className: 'cockpit-work-item-main' });
  if (item.subjectLabel || item.contextLabel) {
    main.append(node('p', { className: 'cockpit-score-subject', text: item.subjectLabel || item.contextLabel }));
  }
  const title = node('h3', { className: 'cockpit-work-item-title', text: item.title || item.label || 'Action à préciser' });
  const meta = node('p', { className: 'cockpit-work-item-meta' });
  meta.append(node('span', { text: formatDate(due, true) }));
  if (item.waitingReason) meta.append(node('span', { text: `En attente : ${item.waitingReason}` }));
  main.append(title, meta);

  const aside = node('div', { className: 'cockpit-work-item-aside' });
  if (context === 'overdue') {
    const days = typeof item.daysOverdue === 'number' ? item.daysOverdue : undefined;
    aside.append(node('span', { className: 'cockpit-score-status is-danger', text: days === undefined ? 'En retard' : `${days} j de retard` }));
  } else if (item.priority) {
    aside.append(node('span', {
      className: `cockpit-score-status${item.priority === 'urgent' ? ' is-danger' : item.priority === 'high' ? ' is-attention' : ''}`,
      text: labelFor(PRIORITIES, item.priority),
    }));
  }
  aside.append(node('span', { className: 'cockpit-score-action', text: item.timAgreementId ? 'Voir l’accord' : 'Ouvrir le dossier' }));
  link.append(timing, main, aside);
  row.append(link);
  return row;
}

function renderMissingItem(item: MissingAction): HTMLLIElement {
  const row = node('li', { className: 'cockpit-work-item is-warning' });
  const link = node('a', { className: 'cockpit-score-link', attrs: { href: itemHref(item) } });
  const timing = node('div', { className: 'cockpit-score-time' });
  timing.append(node('strong', { text: '!' }), node('span', { text: 'À planifier' }));
  const main = node('div', { className: 'cockpit-work-item-main' });
  main.append(
    node('h3', { className: 'cockpit-work-item-title', text: item.label || 'Dossier actif' }),
    node('p', { className: 'cockpit-work-item-meta', text: item.kind === 'tim' || item.kind === 'tim_agreement' ? 'Accord TIM actif' : 'Projet actif' }),
  );
  const aside = node('div', { className: 'cockpit-work-item-aside' });
  aside.append(node('span', { className: 'cockpit-score-status is-attention', text: 'Sans prochaine action' }), node('span', { className: 'cockpit-score-action', text: 'Planifier' }));
  link.append(timing, main, aside);
  row.append(link);
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
    attrs: { 'aria-labelledby': id, 'data-work-panel': id },
  });
  const heading = node('div', { className: 'cockpit-panel-heading' });
  const copy = node('div');
  copy.append(node('h2', { text: title, attrs: { id } }), node('p', { className: 'cockpit-panel-context', text: kicker }));
  heading.append(copy, node('span', { className: 'cockpit-count', text: `${items.length} élément${items.length > 1 ? 's' : ''}` }));
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

    const attentionCount = new Set(
      [...actions, ...overdue, ...missing, ...promised, ...newDossiers]
        .map((item, index) => item.id || `${item.projectId ?? item.timAgreementId ?? 'item'}-${index}`),
    ).size;
    const intro = node('div', { className: 'cockpit-attention-intro' });
    intro.append(
      node('h2', { text: attentionCount === 0 ? 'Rien ne réclame votre attention immédiate.' : `${attentionCount} chose${attentionCount > 1 ? 's' : ''} mérite${attentionCount > 1 ? 'nt' : ''} votre attention.` }),
      node('p', { text: attentionCount === 0 ? 'Les dossiers actifs restent accessibles depuis la navigation.' : 'Commencez par la première ligne. Le reste peut attendre son tour.' }),
    );

    const grid = node('div', { className: 'cockpit-work-grid' });
    grid.append(
      workPanel('actions-title', 'Priorité', 'Actions du jour', actions, 'Aucune action prévue aujourd’hui.', (item) => renderWorkItem(item, 'today'), true),
      workPanel('late-title', 'À reprendre', 'Échéances dépassées', overdue, 'Aucune échéance dépassée.', (item) => renderWorkItem(item, 'overdue')),
      workPanel('missing-title', 'Vigilance', 'Sans prochaine action', missing, 'Tous les dossiers actifs ont une prochaine action.', renderMissingItem),
      workPanel('promises-title', 'Engagements', 'Retours promis', promised, 'Aucun retour promis en attente.', (item) => renderWorkItem(item, 'promised')),
      workPanel('new-title', 'À traiter', 'Nouveaux dossiers', newDossiers, 'Aucun nouveau dossier manuel à traiter.', (item) => renderWorkItem(item, 'today')),
    );
    root.replaceChildren(intro, grid);
    root.setAttribute('aria-busy', 'false');
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    renderError(root, error, () => void loadToday());
  }
}

void loadToday();
