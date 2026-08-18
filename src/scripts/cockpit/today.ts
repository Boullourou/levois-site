import { requestJson } from './api';
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

void loadToday();
