import { requestJson, withQuery } from './api';
import { CONTACT_ORIGINS, PROJECT_STAGES, PROJECT_STATUSES, PROJECT_TYPES, labelFor } from './options';
import { badge, formatDate, linkButton, node, renderEmpty, renderError, renderLoading, requiredElement } from './ui';

type ClientListItem = {
  id?: string;
  personId?: string;
  displayName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  preferredName?: string;
  origin?: string;
  lastInteractionAt?: string;
  hasToConfirm?: boolean;
  missingNextAction?: boolean;
  withoutNextAction?: boolean | number;
  overdue?: boolean;
  activeProject?: {
    id?: string;
    type?: string;
    status?: string;
    stage?: string;
  };
  projectType?: string;
  projectStatus?: string;
  projectStage?: string;
  status?: string;
  stage?: string;
  nextAction?: { title?: string; dueAt?: string } | string | null;
  nextActionTitle?: string;
  nextActionDueAt?: string;
};

type ClientListPayload = { items?: ClientListItem[]; clients?: ClientListItem[]; total?: number } | ClientListItem[];

const root = requiredElement<HTMLElement>('[data-client-list]');
const filters = requiredElement<HTMLFormElement>('[data-client-filters]');
let controller: AbortController | undefined;

function renderClient(item: ClientListItem): HTMLLIElement {
  const personId = item.personId ?? item.id ?? '';
  const project = item.activeProject;
  const type = project?.type ?? item.projectType;
  const status = project?.status ?? item.projectStatus ?? item.status;
  const stage = project?.stage ?? item.projectStage ?? item.stage;
  const nextTitle = typeof item.nextAction === 'string' ? item.nextAction : item.nextAction?.title ?? item.nextActionTitle;
  const nextDue = typeof item.nextAction === 'object' && item.nextAction ? item.nextAction.dueAt : item.nextActionDueAt;
  const name = item.displayName || item.name || item.preferredName || [item.firstName, item.lastName].filter(Boolean).join(' ') || 'Personne sans libellé';

  const card = node('li', { className: 'cockpit-record-card' });
  const header = node('div', { className: 'cockpit-record-header' });
  const identity = node('div');
  identity.append(
    node('p', { className: 'cockpit-record-kicker', text: type ? labelFor(PROJECT_TYPES, type) : 'Projet à préciser' }),
    node('h2', { text: name }),
  );
  const flags = node('div', { className: 'cockpit-badge-row' });
  if (status) flags.append(badge(labelFor(PROJECT_STATUSES, status), status === 'active' ? 'success' : 'neutral'));
  if (item.overdue) flags.append(badge('En retard', 'danger'));
  if (item.hasToConfirm) flags.append(badge('À confirmer', 'warning'));
  header.append(identity, flags);

  const details = node('dl', { className: 'cockpit-record-details' });
  const detailValues = [
    ['Stade', labelFor(PROJECT_STAGES, stage)],
    ['Dernier contact', formatDate(item.lastInteractionAt)],
    ['Prochaine action', nextTitle || 'Aucune'],
    ['Échéance', nextTitle ? formatDate(nextDue, true) : 'Non planifiée'],
  ];
  for (const [label, value] of detailValues) {
    const group = node('div');
    group.append(node('dt', { text: label }), node('dd', { text: value }));
    details.append(group);
  }

  const footer = node('div', { className: 'cockpit-record-footer' });
  footer.append(node('span', { text: `Origine : ${labelFor(CONTACT_ORIGINS, item.origin)}` }));
  if (item.missingNextAction || item.withoutNextAction || !nextTitle) footer.append(badge('Sans prochaine action', 'warning'));
  footer.append(linkButton('Ouvrir la fiche', `/cockpit/clients/dossier?id=${encodeURIComponent(personId)}`, 'secondary'));
  card.append(header, details, footer);
  return card;
}

async function loadClients(): Promise<void> {
  controller?.abort();
  controller = new AbortController();
  renderLoading(root, 'Chargement des clients…');
  const values = new FormData(filters);
  const path = withQuery('/api/cockpit/clients', {
    scope: 'direct',
    q: String(values.get('q') ?? '').trim(),
    type: String(values.get('projectType') ?? ''),
    status: String(values.get('status') ?? ''),
    stage: String(values.get('stage') ?? ''),
    origin: String(values.get('origin') ?? ''),
    overdue: values.has('overdue') || undefined,
    withoutNextAction: values.has('missingNextAction') || undefined,
  });

  try {
    const payload = await requestJson<ClientListPayload>(path, { signal: controller.signal });
    const items = Array.isArray(payload) ? payload : payload.items ?? payload.clients ?? [];
    if (!items.length) {
      renderEmpty(root, 'Aucun client dans cette vue', 'Ajustez les filtres ou créez le premier dossier accompagné.', linkButton('Nouveau dossier', '/cockpit/clients/nouveau', 'primary'));
      return;
    }
    const list = node('ul', { className: 'cockpit-record-list' });
    for (const item of items) list.append(renderClient(item));
    const heading = node('div', { className: 'cockpit-list-summary' });
    heading.append(node('p', { text: `${items.length} dossier${items.length > 1 ? 's' : ''} affiché${items.length > 1 ? 's' : ''}` }));
    root.replaceChildren(heading, list);
    root.setAttribute('aria-busy', 'false');
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    renderError(root, error, () => void loadClients());
  }
}

filters.addEventListener('submit', (event) => {
  event.preventDefault();
  void loadClients();
});

const search = filters.elements.namedItem('q');
if (search instanceof HTMLInputElement) {
  let timer = 0;
  search.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void loadClients(), 350);
  });
}

void loadClients();
