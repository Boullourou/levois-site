import { requestJson } from './api';
import { BUYER_STAGES, SELLER_STAGES } from './options';
import { formDataObject, node, requiredElement, setSubmitState } from './ui';

type CreateClientResult = { personId?: string; id?: string; clientId?: string };

const form = requiredElement<HTMLFormElement>('[data-new-client-form]');
const projectType = requiredElement<HTMLSelectElement>('[data-project-type]', form);
const projectStatus = requiredElement<HTMLSelectElement>('[data-project-status]', form);
const projectStage = requiredElement<HTMLSelectElement>('[data-project-stage]', form);
const searchSection = requiredElement<HTMLElement>('[data-buyer-search-section]', form);
const missingConfirm = requiredElement<HTMLElement>('[data-missing-action-confirm]', form);
const errorBox = requiredElement<HTMLElement>('[data-form-error]', form);
const submit = requiredElement<HTMLButtonElement>('[data-submit]', form);

function isBuyerType(type: string): boolean {
  return ['primary_residence_purchase', 'linked_purchase_sale', 'investment'].includes(type);
}

function updateStages(): void {
  const options = projectType.value === 'sale' ? SELLER_STAGES : BUYER_STAGES;
  const previous = projectStage.value;
  projectStage.replaceChildren(...options.map((option) => node('option', { text: option.label, attrs: { value: option.value } })));
  if (options.some((option) => option.value === previous)) projectStage.value = previous;
  searchSection.hidden = !isBuyerType(projectType.value);
}

function updateMissingActionConfirmation(): void {
  const taskTitle = form.elements.namedItem('taskTitle');
  const hasTask = taskTitle instanceof HTMLInputElement && taskTitle.value.trim().length > 0;
  missingConfirm.hidden = projectStatus.value !== 'active' || hasTask;
  if (missingConfirm.hidden) {
    const checkbox = form.elements.namedItem('allowMissingNextAction');
    if (checkbox instanceof HTMLInputElement) checkbox.checked = false;
  }
}

projectType.addEventListener('change', updateStages);
projectStatus.addEventListener('change', updateMissingActionConfirmation);
const taskTitleField = form.elements.namedItem('taskTitle');
if (taskTitleField instanceof HTMLInputElement) taskTitleField.addEventListener('input', updateMissingActionConfirmation);
updateStages();
updateMissingActionConfirmation();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.hidden = true;
  if (!form.reportValidity()) return;

  const values = formDataObject(form);
  const hasTask = Boolean(values.taskTitle);
  const allowMissing = form.elements.namedItem('allowMissingNextAction') instanceof HTMLInputElement
    && (form.elements.namedItem('allowMissingNextAction') as HTMLInputElement).checked;

  if (values.projectStatus === 'active' && !hasTask && !allowMissing) {
    missingConfirm.hidden = false;
    errorBox.textContent = 'Confirmez explicitement l’absence de prochaine action ou ajoutez une tâche.';
    errorBox.hidden = false;
    missingConfirm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (hasTask && !values.taskDueAt) {
    errorBox.textContent = 'Ajoutez une date à la prochaine action.';
    errorBox.hidden = false;
    return;
  }
  if (isBuyerType(values.projectType) && !values.searchSummary) {
    errorBox.textContent = 'Ajoutez une synthèse courte pour créer la recherche acquéreur.';
    errorBox.hidden = false;
    searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  const selectedType = values.projectType;
  const isLinked = selectedType === 'linked_purchase_sale';
  const scenarios = [
    ['scenarioPreferred', 'preferred'],
    ['scenarioAcceptable', 'acceptable'],
    ['scenarioConditional', 'conditional'],
  ]
    .filter(([name]) => (form.elements.namedItem(name) as HTMLInputElement | null)?.checked)
    .map(([, type]) => ({ type, label: type }));

  const taskDueAt = values.taskDueAt ? new Date(values.taskDueAt).toISOString() : undefined;
  const body = {
    person: {
      firstName: values.firstName,
      lastName: values.lastName,
      preferredName: values.preferredName || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      origin: values.origin,
      summary: values.summary || undefined,
    },
    project: {
      type: isLinked ? 'primary_residence_purchase' : selectedType,
      status: values.projectStatus,
      stage: values.projectStage,
      objective: values.objective || undefined,
      calendarSummary: values.timeline || undefined,
    },
    linkedProject: isLinked ? {
      type: 'sale',
      status: values.projectStatus,
      stage: 'new_contact',
      objective: values.objective ? `Volet vente lié · ${values.objective}` : 'Volet vente lié au projet d’achat',
      calendarSummary: values.timeline || undefined,
    } : undefined,
    search: isBuyerType(selectedType) ? {
      enabled: true,
      summary: values.searchSummary,
      scenarios,
    } : undefined,
    nextAction: hasTask ? {
      title: values.taskTitle,
      dueAt: taskDueAt,
      priority: values.taskPriority,
    } : undefined,
    allowWithoutNextAction: allowMissing,
  };

  const idempotencyKey = form.dataset.idempotencyKey || crypto.randomUUID();
  form.dataset.idempotencyKey = idempotencyKey;
  setSubmitState(submit, true, 'Création…');
  try {
    const result = await requestJson<CreateClientResult>('/api/cockpit/clients/create', { method: 'POST', body, idempotencyKey });
    const id = result.personId ?? result.clientId ?? result.id;
    window.location.assign(id ? `/cockpit/clients/dossier?id=${encodeURIComponent(id)}` : '/cockpit/clients');
  } catch (error) {
    errorBox.textContent = error instanceof Error ? error.message : 'Le dossier n’a pas pu être créé.';
    errorBox.hidden = false;
    errorBox.focus();
    setSubmitState(submit, false);
  }
});
