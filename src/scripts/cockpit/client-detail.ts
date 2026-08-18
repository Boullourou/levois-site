import { requestJson, requestText, withQuery } from './api';
import {
  BUYER_STAGES,
  CERTAINTY_LEVELS,
  CONTACT_ORIGINS,
  CRITERION_TYPES,
  FLEXIBILITY_LEVELS,
  IMPORTANCE_LEVELS,
  INTERACTION_CHANNELS,
  MATCHING_ROLES,
  PRIORITIES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  SCENARIO_TYPES,
  SELLER_STAGES,
  labelFor,
} from './options';
import {
  badge,
  bindDialogControls,
  displayText,
  formatDate,
  formDataObject,
  handleDialogBackdrop,
  node,
  openDialog,
  renderError,
  renderLoading,
  requiredElement,
  setSubmitState,
  showToast,
} from './ui';

type ContactMethod = { type?: string; value?: string; displayValue?: string; normalizedValue?: string };
type Project = {
  id: string;
  type?: string;
  status?: string;
  stage?: string;
  objective?: string;
  timeline?: string;
  calendarSummary?: string;
  version?: number;
  isActive?: boolean;
};
type SearchScenario = { id?: string; buyerSearchId?: string; type?: string; kind?: string; label?: string };
type BuyerSearch = { id: string; projectId?: string; summary?: string; version?: number; scenarios?: SearchScenario[] };
type Criterion = {
  id: string;
  criterionType?: string;
  type?: string;
  criterionKey?: string;
  customLabel?: string;
  value?: unknown;
  valueText?: string;
  valueJson?: string;
  scenario?: string;
  scenarioType?: string;
  importance?: string;
  flexibility?: string;
  certainty?: string;
  matchingRole?: string;
  source?: string;
  sourceKind?: string;
  sourceRef?: string;
  effectiveAt?: string;
  recordedAt?: string;
  reason?: string;
  hardValidated?: boolean;
  isHardConstraint?: boolean;
  isCurrent?: boolean | number;
  scenarioId?: string;
};
type Interaction = {
  id: string;
  channel?: string;
  type?: string;
  direction?: string;
  occurredAt?: string;
  summary?: string;
  outcome?: string;
  promisedAction?: string;
  promisedDueAt?: string;
};
type Task = {
  id: string;
  projectId?: string;
  title?: string;
  dueAt?: string;
  priority?: string;
  status?: string;
  waitingReason?: string;
  isNextAction?: boolean;
  completedAt?: string;
  version?: number;
};
type TimelineItem = {
  id?: string;
  type?: string;
  occurredAt?: string;
  effectiveAt?: string;
  recordedAt?: string;
  title?: string;
  summary?: string;
  detail?: string;
  source?: string;
};
type ClientDetail = {
  person?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    preferredName?: string;
    displayName?: string;
    origin?: string;
    summary?: string;
    createdAt?: string;
    lastContactAt?: string;
    version?: number;
  };
  id?: string;
  displayName?: string;
  contactMethods?: ContactMethod[];
  contacts?: ContactMethod[];
  projects?: Project[];
  buyerSearch?: BuyerSearch | null;
  buyer_search?: BuyerSearch | null;
  searches?: BuyerSearch[];
  scenarios?: SearchScenario[];
  criteria?: Criterion[];
  currentCriteria?: Criterion[];
  criterionHistory?: Criterion[];
  interactions?: Interaction[];
  tasks?: Task[];
  decisions?: TimelineItem[];
  timeline?: TimelineItem[];
  relationships?: Array<{ sourceProjectId?: string; targetProjectId?: string; type?: string; detail?: string }>;
};

const root = requiredElement<HTMLElement>('[data-client-detail]');
const params = new URLSearchParams(window.location.search);
const personId = params.get('id')?.trim() ?? '';
let detail: ClientDetail | undefined;

function parseCriterionValue(valueJson: string | undefined): { value?: unknown; customLabel?: string } {
  if (!valueJson) return {};
  try {
    const parsed = JSON.parse(valueJson) as unknown;
    if (parsed && typeof parsed === 'object') {
      const object = parsed as { value?: unknown; text?: unknown; customLabel?: unknown };
      return {
        value: object.value ?? object.text ?? parsed,
        customLabel: typeof object.customLabel === 'string' ? object.customLabel : undefined,
      };
    }
    return { value: parsed };
  } catch {
    return { value: valueJson };
  }
}

function normalizeDetail(raw: ClientDetail): ClientDetail {
  const contacts = (raw.contactMethods ?? raw.contacts ?? []).map((contact) => ({ ...contact, value: contact.value ?? contact.displayValue }));
  const scenarios = raw.scenarios ?? [];
  const firstSearch = raw.buyerSearch ?? raw.buyer_search ?? raw.searches?.[0] ?? null;
  const buyerSearch = firstSearch ? {
    ...firstSearch,
    scenarios: firstSearch.scenarios ?? scenarios
      .filter((scenario) => !scenario.buyerSearchId || scenario.buyerSearchId === firstSearch.id)
      .map((scenario) => ({ ...scenario, type: scenario.type ?? scenario.kind })),
  } : null;
  const criteria = (raw.criteria ?? []).map((item) => {
    const scenario = scenarios.find((candidate) => candidate.id === item.scenarioId);
    const parsedValue = parseCriterionValue(item.valueJson);
    return {
      ...item,
      criterionType: item.criterionType ?? item.criterionKey ?? item.type,
      value: item.value ?? parsedValue.value,
      customLabel: item.customLabel ?? parsedValue.customLabel,
      scenarioType: item.scenarioType ?? item.scenario ?? scenario?.type ?? scenario?.kind,
      source: item.source ?? [item.sourceKind, item.sourceRef].filter(Boolean).join(' · '),
      isHardConstraint: item.isHardConstraint ?? Boolean(item.hardValidated && item.certainty === 'confirmed' && item.importance === 'essential' && item.flexibility === 'none' && item.matchingRole === 'hard'),
    };
  });
  return {
    ...raw,
    contactMethods: contacts,
    projects: (raw.projects ?? []).map((project) => ({ ...project, timeline: project.timeline ?? project.calendarSummary })),
    buyerSearch,
    buyer_search: buyerSearch,
    criteria,
    currentCriteria: raw.currentCriteria ?? criteria.filter((item) => item.isCurrent === undefined || Boolean(item.isCurrent)),
    criterionHistory: raw.criterionHistory ?? criteria,
    interactions: (raw.interactions ?? []).map((item) => ({ ...item, channel: item.channel ?? item.type })),
  };
}

function fullName(data: ClientDetail): string {
  const person = data.person;
  return person?.displayName
    || data.displayName
    || person?.preferredName
    || [person?.firstName, person?.lastName].filter(Boolean).join(' ')
    || 'Fiche client';
}

function criterionValue(item: Criterion): string {
  if (item.valueText) return item.valueText;
  if (typeof item.value === 'string') return item.value;
  if (typeof item.value === 'number' || typeof item.value === 'boolean') return String(item.value);
  if (item.value && typeof item.value === 'object') {
    try { return JSON.stringify(item.value); } catch { return 'Valeur structurée'; }
  }
  return 'À préciser';
}

function section(title: string, kicker: string, action?: HTMLElement): { shell: HTMLElement; body: HTMLElement } {
  const shell = node('section', { className: 'cockpit-detail-section' });
  const header = node('header', { className: 'cockpit-detail-section-header' });
  const copy = node('div');
  copy.append(node('p', { className: 'cockpit-kicker', text: kicker }), node('h2', { text: title }));
  header.append(copy);
  if (action) header.append(action);
  const body = node('div', { className: 'cockpit-detail-section-body' });
  shell.append(header, body);
  return { shell, body };
}

function updatePageTitle(data: ClientDetail): void {
  const name = fullName(data);
  const heading = document.querySelector<HTMLElement>('.cockpit-heading h1');
  if (heading) heading.textContent = name;
  document.title = `${name} · Cockpit LEVOIS`;
}

function renderSummary(data: ClientDetail): HTMLElement {
  const { shell, body } = section('Synthèse', 'Dossier');
  const person = data.person ?? {};
  const projects = data.projects ?? [];
  const openTasks = (data.tasks ?? []).filter((task) => !['completed', 'cancelled'].includes(task.status ?? 'open'));
  const nextTask = openTasks.find((task) => task.isNextAction) ?? openTasks[0];
  const contacts = data.contactMethods ?? [];

  const intro = node('div', { className: 'cockpit-summary-intro' });
  const identity = node('div');
  identity.append(node('h3', { text: fullName(data) }), node('p', { text: person.summary || 'Aucune synthèse enregistrée.' }));
  const flags = node('div', { className: 'cockpit-badge-row' });
  for (const project of projects.filter((item) => item.status === 'active')) flags.append(badge(labelFor(PROJECT_TYPES, project.type), 'success'));
  if (!nextTask && projects.some((project) => project.status === 'active')) flags.append(badge('Sans prochaine action', 'warning'));
  intro.append(identity, flags);

  const facts = node('dl', { className: 'cockpit-data-grid' });
  const values: Array<[string, string]> = [
    ['Origine', labelFor(CONTACT_ORIGINS, person.origin)],
    ['Email', contacts.find((contact) => contact.type === 'email')?.value ?? 'Non renseigné'],
    ['Téléphone', contacts.find((contact) => contact.type === 'phone')?.value ?? 'Non renseigné'],
    ['Dernier contact', formatDate(person.lastContactAt, true)],
    ['Prochaine action', nextTask?.title ?? 'Aucune'],
    ['Échéance', nextTask ? formatDate(nextTask.dueAt, true) : 'Non planifiée'],
  ];
  for (const [label, value] of values) {
    const group = node('div', { className: 'cockpit-data-item' });
    group.append(node('dt', { text: label }), node('dd', { text: value }));
    facts.append(group);
  }
  body.append(intro, facts);
  return shell;
}

function renderProjects(data: ClientDetail): HTMLElement {
  const { shell, body } = section('Projets', 'Suivi');
  const projects = data.projects ?? [];
  if (!projects.length) {
    body.append(node('p', { className: 'cockpit-inline-empty', text: 'Aucun projet enregistré.' }));
    return shell;
  }
  const list = node('div', { className: 'cockpit-project-list' });
  for (const project of projects) {
    const card = node('article', { className: 'cockpit-project-card' });
    const header = node('div', { className: 'cockpit-record-header' });
    const copy = node('div');
    copy.append(node('p', { className: 'cockpit-record-kicker', text: labelFor(PROJECT_TYPES, project.type) }), node('h3', { text: project.objective || 'Objectif à préciser' }));
    header.append(copy, badge(labelFor(PROJECT_STATUSES, project.status), project.status === 'active' ? 'success' : 'neutral'));
    const meta = node('dl', { className: 'cockpit-record-details' });
    for (const [label, value] of [['Stade', displayText(project.stage).replaceAll('_', ' ')], ['Calendrier', displayText(project.timeline)]]) {
      const group = node('div'); group.append(node('dt', { text: label }), node('dd', { text: value })); meta.append(group);
    }
    const relationship = data.relationships?.find((item) => item.sourceProjectId === project.id || item.targetProjectId === project.id);
    const change = node('button', { className: 'cockpit-button cockpit-button-quiet', text: 'Changer le stade', attrs: { type: 'button' } });
    change.addEventListener('click', () => prepareStageDialog(project));
    card.append(header, meta);
    if (relationship) card.append(badge(relationship.type === 'purchase_depends_on_sale' ? 'Achat et vente liés' : 'Projet relié', 'info'));
    card.append(change);
    list.append(card);
  }
  body.append(list);
  return shell;
}

function prepareCriterionRevision(item?: Criterion): void {
  const dialog = requiredElement<HTMLDialogElement>('#criterion-dialog');
  const form = requiredElement<HTMLFormElement>('[data-criterion-form]', dialog);
  form.reset();
  const set = (name: string, value?: string) => {
    const field = form.elements.namedItem(name);
    if ((field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) && value !== undefined) field.value = value;
  };
  set('supersedesCriterionEventId', item?.id ?? '');
  set('criterionType', item?.criterionType ?? item?.type);
  set('customLabel', item?.customLabel);
  set('value', item ? criterionValue(item) : undefined);
  set('scenario', item?.scenarioType ?? item?.scenario);
  set('importance', item?.importance);
  set('flexibility', item?.flexibility);
  set('certainty', item?.certainty);
  set('matchingRole', item?.matchingRole);
  set('source', item?.source);
  set('effectiveAt', new Date().toISOString().slice(0, 10));
  updateCustomCriterion();
  openDialog(dialog);
}

function renderSearch(data: ClientDetail): HTMLElement {
  const search = data.buyerSearch ?? data.buyer_search ?? null;
  const action = search ? node('button', { className: 'cockpit-button cockpit-button-secondary', text: 'Ajouter un critère', attrs: { type: 'button' } }) : undefined;
  action?.addEventListener('click', () => prepareCriterionRevision());
  const { shell, body } = section('Recherche acquéreur', 'Critères évolutifs', action);
  if (!search) {
    body.append(node('p', { className: 'cockpit-inline-empty', text: 'Aucune recherche n’est attachée à ce dossier. Elle peut être créée avec un nouveau projet acquéreur.' }));
    return shell;
  }
  body.append(node('p', { className: 'cockpit-search-summary', text: search.summary || 'Résumé à compléter.' }));
  const scenarioRow = node('div', { className: 'cockpit-badge-row' });
  for (const scenario of search.scenarios ?? []) scenarioRow.append(badge(labelFor(SCENARIO_TYPES, scenario.type), 'info'));
  body.append(scenarioRow);

  const criteria = data.currentCriteria ?? data.criteria ?? [];
  if (!criteria.length) {
    body.append(node('p', { className: 'cockpit-inline-empty', text: 'Aucun critère actuel. Ajoutez le premier événement.' }));
    return shell;
  }
  const list = node('div', { className: 'cockpit-criterion-list' });
  for (const item of criteria) {
    const card = node('article', { className: 'cockpit-criterion-card' });
    const heading = node('div', { className: 'cockpit-record-header' });
    const copy = node('div');
    copy.append(node('p', { className: 'cockpit-record-kicker', text: item.customLabel || labelFor(CRITERION_TYPES, item.criterionType ?? item.type) }), node('h3', { text: criterionValue(item) }));
    const certaintyTone = item.certainty === 'confirmed' ? 'success' : item.certainty === 'to_confirm' ? 'warning' : 'neutral';
    heading.append(copy, badge(labelFor(CERTAINTY_LEVELS, item.certainty), certaintyTone));
    const meta = node('div', { className: 'cockpit-badge-row' });
    meta.append(
      badge(labelFor(SCENARIO_TYPES, item.scenarioType ?? item.scenario), 'info'),
      badge(labelFor(IMPORTANCE_LEVELS, item.importance)),
      badge(`Flexibilité : ${labelFor(FLEXIBILITY_LEVELS, item.flexibility)}`),
      badge(`Rôle : ${labelFor(MATCHING_ROLES, item.matchingRole)}`),
    );
    if (item.isHardConstraint) meta.append(badge('Contrainte dure validée', 'danger'));
    const source = node('p', { className: 'cockpit-record-note', text: `Source : ${displayText(item.source)} · effective le ${formatDate(item.effectiveAt)} · enregistrée le ${formatDate(item.recordedAt)}` });
    const revise = node('button', { className: 'cockpit-button cockpit-button-quiet', text: 'Réviser sans effacer', attrs: { type: 'button' } });
    revise.addEventListener('click', () => prepareCriterionRevision(item));
    card.append(heading, meta, source, revise);
    list.append(card);
  }
  body.append(list);
  return shell;
}

function renderInteractions(data: ClientDetail): HTMLElement {
  const action = node('button', { className: 'cockpit-button cockpit-button-secondary', text: 'Ajouter une interaction', attrs: { type: 'button' } });
  action.addEventListener('click', () => openDialog(requiredElement<HTMLDialogElement>('#interaction-dialog')));
  const { shell, body } = section('Interactions', 'Journal', action);
  const items = data.interactions ?? [];
  if (!items.length) {
    body.append(node('p', { className: 'cockpit-inline-empty', text: 'Aucune interaction enregistrée.' }));
    return shell;
  }
  const list = node('ol', { className: 'cockpit-timeline-list' });
  for (const item of items.slice().sort((a, b) => String(b.occurredAt).localeCompare(String(a.occurredAt)))) {
    const row = node('li');
    row.append(node('span', { className: 'cockpit-timeline-dot', attrs: { 'aria-hidden': 'true' } }));
    const copy = node('div');
    copy.append(
      node('p', { className: 'cockpit-record-kicker', text: `${labelFor(INTERACTION_CHANNELS, item.channel)} · ${formatDate(item.occurredAt, true)}` }),
      node('h3', { text: item.summary || 'Interaction sans résumé' }),
    );
    if (item.outcome) copy.append(node('p', { text: item.outcome }));
    if (item.promisedAction) copy.append(badge(`Promis : ${item.promisedAction} · ${formatDate(item.promisedDueAt, true)}`, 'warning'));
    row.append(copy); list.append(row);
  }
  body.append(list);
  return shell;
}

async function completeTask(task: Task, button: HTMLButtonElement): Promise<void> {
  setSubmitState(button, true, 'Traitement…');
  try {
    await requestJson(`/api/cockpit/tasks/${encodeURIComponent(task.id)}/complete`, { method: 'POST', body: { expectedVersion: task.version } });
    showToast('Tâche terminée.');
    await loadDetail();
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'La tâche n’a pas pu être terminée.', 'error');
    setSubmitState(button, false);
  }
}

function renderTasks(data: ClientDetail): HTMLElement {
  const action = node('button', { className: 'cockpit-button cockpit-button-secondary', text: 'Nouvelle tâche', attrs: { type: 'button' } });
  action.addEventListener('click', () => openDialog(requiredElement<HTMLDialogElement>('#task-dialog')));
  const { shell, body } = section('Tâches', 'Prochaine action', action);
  const tasks = data.tasks ?? [];
  if (!tasks.length) {
    body.append(node('p', { className: 'cockpit-inline-empty is-warning', text: 'Aucune tâche : tout projet actif apparaîtra dans les anomalies.' }));
    return shell;
  }
  const open = tasks.filter((task) => !['completed', 'cancelled'].includes(task.status ?? 'open'));
  const completed = tasks.filter((task) => ['completed', 'cancelled'].includes(task.status ?? ''));
  const renderGroup = (title: string, items: Task[]) => {
    if (!items.length) return;
    body.append(node('h3', { className: 'cockpit-subheading', text: title }));
    const list = node('ul', { className: 'cockpit-task-list' });
    for (const task of items) {
      const row = node('li', { className: `cockpit-task-row${task.isNextAction ? ' is-next' : ''}` });
      const copy = node('div');
      copy.append(node('h4', { text: task.title || 'Tâche sans libellé' }), node('p', { text: `${formatDate(task.dueAt, true)} · ${labelFor(PRIORITIES, task.priority)}` }));
      if (task.waitingReason) copy.append(node('p', { text: `En attente : ${task.waitingReason}` }));
      const flags = node('div', { className: 'cockpit-badge-row' });
      if (task.isNextAction) flags.append(badge('Prochaine action', 'info'));
      if (!['completed', 'cancelled'].includes(task.status ?? 'open')) {
        const done = node('button', { className: 'cockpit-button cockpit-button-quiet', text: 'Terminer', attrs: { type: 'button' } });
        done.addEventListener('click', () => void completeTask(task, done));
        flags.append(done);
      } else flags.append(badge('Terminée', 'success'));
      row.append(copy, flags); list.append(row);
    }
    body.append(list);
  };
  renderGroup('Ouvertes', open);
  renderGroup('Terminées', completed);
  return shell;
}

function renderTimeline(data: ClientDetail): HTMLElement {
  const { shell, body } = section('Décisions et évolution', 'Chronologie');
  const explicit = data.timeline ?? [];
  const generated: TimelineItem[] = explicit.length ? explicit : [
    ...(data.criterionHistory ?? data.criteria ?? []).map((item) => ({ type: 'criterion', effectiveAt: item.effectiveAt, recordedAt: item.recordedAt, title: `Critère · ${labelFor(CRITERION_TYPES, item.criterionType ?? item.type)}`, summary: criterionValue(item), source: item.source })),
    ...(data.decisions ?? []),
    ...(data.interactions ?? []).map((item) => ({ type: 'interaction', occurredAt: item.occurredAt, title: labelFor(INTERACTION_CHANNELS, item.channel), summary: item.summary })),
    ...(data.tasks ?? []).filter((task) => task.isNextAction || task.completedAt).map((task) => ({ type: 'task', occurredAt: task.completedAt ?? task.dueAt, title: task.completedAt ? 'Tâche terminée' : 'Prochaine action', summary: task.title })),
  ];
  if (!generated.length) {
    body.append(node('p', { className: 'cockpit-inline-empty', text: 'La chronologie se construira à chaque interaction, décision et révision.' }));
    return shell;
  }
  generated.sort((a, b) => String(b.effectiveAt ?? b.occurredAt ?? b.recordedAt).localeCompare(String(a.effectiveAt ?? a.occurredAt ?? a.recordedAt)));
  const list = node('ol', { className: 'cockpit-timeline-list' });
  for (const item of generated) {
    const row = node('li'); row.append(node('span', { className: 'cockpit-timeline-dot', attrs: { 'aria-hidden': 'true' } }));
    const copy = node('div');
    copy.append(node('p', { className: 'cockpit-record-kicker', text: `${displayText(item.type, 'Événement').replaceAll('_', ' ')} · ${formatDate(item.effectiveAt ?? item.occurredAt ?? item.recordedAt, true)}` }), node('h3', { text: item.title || 'Évolution du dossier' }));
    if (item.summary ?? item.detail) copy.append(node('p', { text: item.summary ?? item.detail }));
    if (item.source) copy.append(node('small', { text: `Source : ${item.source}` }));
    row.append(copy); list.append(row);
  }
  body.append(list);
  return shell;
}

function renderDetail(data: ClientDetail): void {
  updatePageTitle(data);
  const layout = node('div', { className: 'cockpit-detail-layout' });
  layout.append(
    renderSummary(data),
    renderProjects(data),
    renderSearch(data),
    renderInteractions(data),
    renderTasks(data),
    renderTimeline(data),
  );
  root.replaceChildren(layout);
  root.setAttribute('aria-busy', 'false');
  document.querySelectorAll<HTMLButtonElement>('[data-requires-client]').forEach((button) => { button.disabled = false; });
}

function activeProject(): Project | undefined {
  return detail?.projects?.find((project) => project.status === 'active') ?? detail?.projects?.[0];
}

async function loadDetail(): Promise<void> {
  if (!personId) {
    renderError(root, new Error('Identifiant de dossier manquant.'));
    return;
  }
  renderLoading(root, 'Chargement de la fiche…');
  try {
    detail = normalizeDetail(await requestJson<ClientDetail>(`/api/cockpit/clients/${encodeURIComponent(personId)}`));
    renderDetail(detail);
  } catch (error) {
    renderError(root, error, () => void loadDetail());
  }
}

function localDateTime(date = new Date()): string {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function setDialogDefaults(): void {
  const interaction = document.querySelector<HTMLInputElement>('[data-interaction-form] [name="occurredAt"]');
  const criterion = document.querySelector<HTMLInputElement>('[data-criterion-form] [name="effectiveAt"]');
  if (interaction && !interaction.value) interaction.value = localDateTime();
  if (criterion && !criterion.value) criterion.value = new Date().toISOString().slice(0, 10);
}

function dialogError(form: HTMLFormElement, message?: string): void {
  const box = requiredElement<HTMLElement>('[data-dialog-error]', form);
  box.textContent = message ?? '';
  box.hidden = !message;
}

async function submitDialog(form: HTMLFormElement, path: string, body: unknown): Promise<void> {
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!button) return;
  dialogError(form);
  setSubmitState(button, true);
  try {
    await requestJson(path, { method: 'POST', body });
    form.closest('dialog')?.close();
    form.reset();
    showToast('Modification enregistrée.');
    await loadDetail();
  } catch (error) {
    dialogError(form, error instanceof Error ? error.message : 'La modification a échoué.');
    setSubmitState(button, false);
  }
}

const interactionForm = requiredElement<HTMLFormElement>('[data-interaction-form]');
interactionForm.addEventListener('submit', (event) => {
  event.preventDefault(); if (!interactionForm.reportValidity()) return;
  const values = formDataObject(interactionForm);
  const project = activeProject();
  if (!project) { dialogError(interactionForm, 'Aucun projet ne peut recevoir cette interaction.'); return; }
  void submitDialog(interactionForm, `/api/cockpit/projects/${encodeURIComponent(project.id)}/interactions/record`, {
    type: values.channel,
    direction: values.direction,
    occurredAt: new Date(values.occurredAt).toISOString(),
    summary: values.summary,
    outcome: values.outcome || undefined,
    promisedAction: values.promisedAction || undefined,
    promisedDueAt: values.promisedDueAt ? new Date(values.promisedDueAt).toISOString() : undefined,
    sourceRef: values.source || undefined,
    expectedVersion: project.version,
  });
});

const taskForm = requiredElement<HTMLFormElement>('[data-task-form]');
taskForm.addEventListener('submit', (event) => {
  event.preventDefault(); if (!taskForm.reportValidity()) return;
  const values = formDataObject(taskForm);
  const checkbox = taskForm.elements.namedItem('isNextAction');
  const project = activeProject();
  if (!project) { dialogError(taskForm, 'Aucun projet ne peut recevoir cette tâche.'); return; }
  void submitDialog(taskForm, `/api/cockpit/projects/${encodeURIComponent(project.id)}/tasks/create`, {
    title: values.title,
    dueAt: new Date(values.dueAt).toISOString(),
    priority: values.priority,
    waitingReason: values.waitingReason || undefined,
    isNextAction: checkbox instanceof HTMLInputElement && checkbox.checked,
    expectedVersion: project.version,
  });
});

const criterionForm = requiredElement<HTMLFormElement>('[data-criterion-form]');
const criterionTypeField = requiredElement<HTMLSelectElement>('[data-criterion-type]', criterionForm);
const customCriterionField = requiredElement<HTMLElement>('[data-custom-criterion]', criterionForm);
function updateCustomCriterion(): void {
  const input = criterionForm.elements.namedItem('customLabel');
  customCriterionField.hidden = criterionTypeField.value !== 'other';
  if (input instanceof HTMLInputElement) {
    input.required = criterionTypeField.value === 'other';
    if (!input.required) input.value = '';
  }
}
criterionTypeField.addEventListener('change', updateCustomCriterion);
updateCustomCriterion();
criterionForm.addEventListener('submit', (event) => {
  event.preventDefault(); if (!criterionForm.reportValidity()) return;
  const values = formDataObject(criterionForm);
  const hardValidated = criterionForm.elements.namedItem('hardValidated');
  const isHumanValidatedHard = hardValidated instanceof HTMLInputElement && hardValidated.checked;
  if (isHumanValidatedHard && !(values.certainty === 'confirmed' && values.importance === 'essential' && values.flexibility === 'none' && values.matchingRole === 'hard')) {
    dialogError(criterionForm, 'Une contrainte dure validée doit être confirmée, essentielle, sans flexibilité et marquée « dur ».');
    return;
  }
  const search = detail?.buyerSearch ?? detail?.buyer_search;
  if (!search) { dialogError(criterionForm, 'Aucune recherche ne peut recevoir ce critère.'); return; }
  const scenario = search.scenarios?.find((item) => (item.type ?? item.kind) === values.scenario) ?? search.scenarios?.[0];
  if (!scenario?.id) { dialogError(criterionForm, 'Le scénario sélectionné est indisponible.'); return; }
  void submitDialog(criterionForm, `/api/cockpit/searches/${encodeURIComponent(search.id)}/criteria/revise`, {
    scenarioId: scenario.id,
    criterionKey: values.criterionType,
    operation: values.supersedesCriterionEventId ? 'revise' : 'set',
    customLabel: values.customLabel || undefined,
    value: values.value,
    importance: values.importance,
    flexibility: values.flexibility,
    certainty: values.certainty,
    matchingRole: values.matchingRole,
    source: values.source,
    effectiveAt: new Date(`${values.effectiveAt}T12:00:00`).toISOString(),
    replacesCriterionEventId: values.supersedesCriterionEventId || undefined,
    reason: values.reason || undefined,
    hardValidated: isHumanValidatedHard,
    expectedVersion: search.version,
  });
});

function prepareStageDialog(project: Project): void {
  const dialog = requiredElement<HTMLDialogElement>('#stage-dialog');
  const form = requiredElement<HTMLFormElement>('[data-stage-form]', dialog);
  const fields: Record<string, string> = {
    projectId: project.id,
    version: String(project.version ?? ''),
    projectType: project.type ?? '',
  };
  for (const [name, value] of Object.entries(fields)) {
    const field = form.elements.namedItem(name);
    if (field instanceof HTMLInputElement) field.value = value;
  }
  const select = requiredElement<HTMLSelectElement>('[data-stage-options]', form);
  const options = project.type === 'sale' ? SELLER_STAGES : BUYER_STAGES;
  select.replaceChildren(...options.map((option) => node('option', { text: option.label, attrs: { value: option.value } })));
  if (project.stage) select.value = project.stage;
  openDialog(dialog);
}

const stageForm = requiredElement<HTMLFormElement>('[data-stage-form]');
stageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!stageForm.reportValidity()) return;
  const values = formDataObject(stageForm);
  void submitDialog(stageForm, `/api/cockpit/projects/${encodeURIComponent(values.projectId)}/stage/change`, {
    stage: values.stage,
    reason: values.reason || undefined,
    expectedVersion: Number(values.version) || undefined,
  });
});

async function exportMarkdown(action: 'copy' | 'download', button: HTMLButtonElement): Promise<void> {
  const form = requiredElement<HTMLFormElement>('[data-export-form]');
  const mode = String(new FormData(form).get('mode') ?? 'without_contacts');
  setSubmitState(button, true, action === 'copy' ? 'Copie…' : 'Préparation…');
  dialogError(form);
  try {
    const result = await requestText(`/api/cockpit/clients/${encodeURIComponent(personId)}/export`, { method: 'POST', body: { mode } });
    if (action === 'copy') {
      await navigator.clipboard.writeText(result.text);
      showToast('Markdown copié.');
    } else {
      const url = URL.createObjectURL(new Blob([result.text], { type: 'text/markdown;charset=utf-8' }));
      const link = node('a', { attrs: { href: url, download: result.filename || `levois-dossier-${personId}.md` } });
      document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      showToast('Export Markdown téléchargé.');
    }
    form.closest('dialog')?.close();
  } catch (error) {
    dialogError(form, error instanceof Error ? error.message : 'L’export a échoué.');
  } finally {
    setSubmitState(button, false);
  }
}

requiredElement<HTMLButtonElement>('[data-export-copy]').addEventListener('click', (event) => void exportMarkdown('copy', event.currentTarget as HTMLButtonElement));
requiredElement<HTMLButtonElement>('[data-export-download]').addEventListener('click', (event) => void exportMarkdown('download', event.currentTarget as HTMLButtonElement));

bindDialogControls();
document.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) => dialog.addEventListener('click', handleDialogBackdrop));
document.addEventListener('click', setDialogDefaults);
setDialogDefaults();
void loadDetail();
