import { requestJson } from './api';
import { formDataObject, requiredElement, setSubmitState } from './ui';

type Advisor = { id: string; displayName?: string; name?: string; isCurrentUser?: boolean; isCurrentOperator?: boolean };
type AdvisorPayload = { items?: Advisor[]; advisors?: Advisor[] } | Advisor[];
type CreateTimResult = { id?: string; timAgreementId?: string; agreementId?: string };

const form = requiredElement<HTMLFormElement>('[data-new-tim-form]');
const agreementType = requiredElement<HTMLSelectElement>('[data-tim-agreement-type]', form);
const operationType = requiredElement<HTMLSelectElement>('[data-tim-operation-type]', form);
const recommendation = requiredElement<HTMLElement>('[data-allocation-recommendation]', form);
const recommendationTitle = requiredElement<HTMLElement>('[data-recommendation-title]', recommendation);
const recommendationCopy = requiredElement<HTMLElement>('[data-recommendation-copy]', recommendation);
const applyRecommendation = requiredElement<HTMLButtonElement>('[data-apply-recommendation]', recommendation);
const rentalWarning = requiredElement<HTMLElement>('[data-rental-warning]', form);
const missingConfirm = requiredElement<HTMLElement>('[data-tim-missing-confirm]', form);
const errorBox = requiredElement<HTMLElement>('[data-form-error]', form);
const submit = requiredElement<HTMLButtonElement>('[data-submit]', form);
let suggested: [number, number] | undefined;
let currentOperatorId: string | undefined;

function percentField(name: string): HTMLInputElement {
  const field = form.elements.namedItem(name);
  if (!(field instanceof HTMLInputElement)) throw new Error(`Champ ${name} introuvable`);
  return field;
}

function updateRecommendation(): void {
  suggested = undefined;
  rentalWarning.hidden = operationType.value !== 'rental';
  if (operationType.value === 'sale' && agreementType.value === 'information_referral_20_80') suggested = [20, 80];
  if (operationType.value === 'sale' && agreementType.value === 'mandate_50_50') suggested = [50, 50];
  recommendation.hidden = !suggested;
  if (suggested) {
    recommendationTitle.textContent = `Répartition recommandée ${suggested[0]}/${suggested[1]}`;
    recommendationCopy.textContent = 'Ces valeurs ne seront appliquées qu’après votre action, puis enregistrées seulement après confirmation explicite.';
  }
  const firstLabel = form.querySelector<HTMLElement>('[data-first-advisor-label]');
  const secondLabel = form.querySelector<HTMLElement>('[data-second-advisor-label]');
  const mandate = agreementType.value === 'mandate_50_50';
  if (firstLabel) firstLabel.textContent = mandate ? 'Conseiller mandat vendeur' : 'Conseiller apporteur';
  if (secondLabel) secondLabel.textContent = mandate ? 'Conseiller acquéreur' : 'Conseiller traitant';
  if (operationType.value === 'rental') {
    percentField('referrerPercent').value = '';
    percentField('handlerPercent').value = '';
    const confirmed = form.elements.namedItem('allocationsConfirmed');
    if (confirmed instanceof HTMLInputElement) confirmed.checked = false;
  }
}

applyRecommendation.addEventListener('click', () => {
  if (!suggested) return;
  percentField('referrerPercent').value = String(suggested[0]);
  percentField('handlerPercent').value = String(suggested[1]);
  percentField('referrerPercent').focus();
});
agreementType.addEventListener('change', updateRecommendation);
operationType.addEventListener('change', updateRecommendation);
updateRecommendation();

function updateMissingConfirm(): void {
  const status = form.elements.namedItem('agreementStatus');
  const task = form.elements.namedItem('taskTitle');
  const isActive = status instanceof HTMLSelectElement && status.value === 'active';
  const hasTask = task instanceof HTMLInputElement && Boolean(task.value.trim());
  missingConfirm.hidden = !isActive || hasTask;
}
const agreementStatusField = form.elements.namedItem('agreementStatus');
const taskTitleField = form.elements.namedItem('taskTitle');
if (agreementStatusField instanceof HTMLSelectElement) agreementStatusField.addEventListener('change', updateMissingConfirm);
if (taskTitleField instanceof HTMLInputElement) taskTitleField.addEventListener('input', updateMissingConfirm);
updateMissingConfirm();

async function loadAdvisors(): Promise<void> {
  const selects = Array.from(form.querySelectorAll<HTMLSelectElement>('[data-advisor-select]'));
  const error = requiredElement<HTMLElement>('[data-advisor-error]', form);
  try {
    const payload = await requestJson<AdvisorPayload>('/api/cockpit/advisors');
    const advisors = Array.isArray(payload) ? payload : payload.items ?? payload.advisors ?? [];
    currentOperatorId = advisors.find((advisor) => advisor.isCurrentUser || advisor.isCurrentOperator)?.id;
    for (const select of selects) {
      select.replaceChildren(new Option('Choisir un conseiller', ''));
      for (const advisor of advisors) select.add(new Option(`${advisor.displayName || advisor.name || 'Conseiller'}${advisor.isCurrentUser || advisor.isCurrentOperator ? ' · vous' : ''}`, advisor.id));
      select.disabled = false;
    }
    if (!advisors.length) {
      error.textContent = 'Aucun profil conseiller disponible. Ajoutez les profils fictifs dans la base locale avant de créer l’accord.';
      error.hidden = false;
    }
  } catch (cause) {
    error.textContent = cause instanceof Error ? cause.message : 'Les conseillers sont indisponibles.';
    error.hidden = false;
    for (const select of selects) select.disabled = true;
  }
}

function toBasisPoints(value: string): number | undefined {
  if (!value) return undefined;
  const percent = Number(value.replace(',', '.'));
  return Number.isFinite(percent) ? Math.round(percent * 100) : undefined;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault(); errorBox.hidden = true;
  if (!form.reportValidity()) return;
  const values = formDataObject(form);
  const checkbox = (name: string) => form.elements.namedItem(name) instanceof HTMLInputElement && (form.elements.namedItem(name) as HTMLInputElement).checked;
  const confirmed = form.elements.namedItem('allocationsConfirmed') instanceof HTMLInputElement && (form.elements.namedItem('allocationsConfirmed') as HTMLInputElement).checked;
  const referrerBps = toBasisPoints(values.referrerPercent);
  const handlerBps = toBasisPoints(values.handlerPercent);
  const hasAllocation = referrerBps !== undefined || handlerBps !== undefined;
  if (!confirmed) {
    errorBox.textContent = 'Confirmez explicitement les termes avant de créer l’accord.'; errorBox.hidden = false; return;
  }
  if (hasAllocation && (!confirmed || referrerBps === undefined || handlerBps === undefined)) {
    errorBox.textContent = 'Renseignez les deux parts et confirmez explicitement la répartition.'; errorBox.hidden = false; return;
  }
  if (hasAllocation && referrerBps! + handlerBps! !== 10_000) {
    errorBox.textContent = 'Les allocations doivent totaliser exactement 100 %.'; errorBox.hidden = false; return;
  }
  if (values.referrerAdvisorId === values.handlingAdvisorId) {
    errorBox.textContent = 'Les deux rôles doivent être attribués à des conseillers distincts.'; errorBox.hidden = false; return;
  }
  if (currentOperatorId && ![values.referrerAdvisorId, values.handlingAdvisorId].includes(currentOperatorId)) {
    errorBox.textContent = 'L’Accord TIM doit inclure votre profil conseiller.'; errorBox.hidden = false; return;
  }
  const allowMissing = form.elements.namedItem('allowMissingNextAction') instanceof HTMLInputElement && (form.elements.namedItem('allowMissingNextAction') as HTMLInputElement).checked;
  if (values.agreementStatus === 'active' && !values.taskTitle && !allowMissing) {
    missingConfirm.hidden = false; errorBox.textContent = 'Ajoutez une prochaine action ou confirmez explicitement l’anomalie.'; errorBox.hidden = false; return;
  }
  if (values.taskTitle && !values.taskDueAt) {
    errorBox.textContent = 'Ajoutez une date à la prochaine action.'; errorBox.hidden = false; return;
  }
  if (['signed', 'omega_uploaded', 'active'].includes(values.agreementStatus) && !checkbox('formSigned')) {
    errorBox.textContent = 'Un accord signé ou actif exige la confirmation du formulaire signé.'; errorBox.hidden = false; return;
  }
  if (values.agreementStatus === 'omega_uploaded' && !checkbox('omegaUploaded')) {
    errorBox.textContent = 'Confirmez le dépôt du formulaire dans OMEGA pour utiliser cet état.'; errorBox.hidden = false; return;
  }
  const body = {
    agreement: {
      internalReference: values.reference,
      label: values.label,
      agreementType: values.agreementType,
      transactionType: values.operationType,
      informationNature: values.informationNature,
      subjectLabel: values.subjectLabel || undefined,
      propertyOrProjectLabel: values.assetLabel || undefined,
      informationTransmittedAt: new Date(`${values.transmittedAt}T12:00:00`).toISOString(),
      formalizedAt: values.formalizedAt ? new Date(`${values.formalizedAt}T12:00:00`).toISOString() : undefined,
      formSigned: checkbox('formSigned'),
      omegaUploaded: checkbox('omegaUploaded'),
      mandateObtained: checkbox('mandateObtained'),
      mandateReference: values.mandateReference || undefined,
      notes: values.notes || undefined,
    },
    parties: agreementType.value === 'mandate_50_50' ? [
      { advisorId: values.referrerAdvisorId, role: 'seller_mandate_advisor' },
      { advisorId: values.handlingAdvisorId, role: 'buyer_advisor' },
    ] : [
      { advisorId: values.referrerAdvisorId, role: 'referrer' },
      { advisorId: values.handlingAdvisorId, role: 'handling_advisor' },
    ],
    terms: {
      feeBasis: values.feeBasis,
      currency: values.currency.toUpperCase(),
      currencyCode: values.currency.toUpperCase(),
      paymentTriggerCode: values.triggerEvent === 'unknown' ? 'unknown' : 'custom',
      paymentTriggerText: values.triggerEvent || 'unknown',
      termsConfirmed: confirmed,
      allocationsConfirmed: confirmed,
      allocations: hasAllocation ? [
        { advisorId: values.referrerAdvisorId, basisPoints: referrerBps },
        { advisorId: values.handlingAdvisorId, basisPoints: handlerBps },
      ] : [],
    },
    statuses: {
      agreement: values.agreementStatus,
      operation: values.operationStatus,
      compensation: values.compensationStatus,
    },
    firstTask: values.taskTitle ? {
      title: values.taskTitle,
      dueAt: values.taskDueAt ? new Date(values.taskDueAt).toISOString() : undefined,
      priority: values.taskPriority,
    } : undefined,
    allowWithoutNextAction: allowMissing,
  };
  const idempotencyKey = form.dataset.idempotencyKey || crypto.randomUUID();
  form.dataset.idempotencyKey = idempotencyKey;
  setSubmitState(submit, true, 'Création…');
  try {
    const result = await requestJson<CreateTimResult>('/api/cockpit/tim/create', { method: 'POST', body, idempotencyKey });
    const id = result.timAgreementId ?? result.agreementId ?? result.id;
    window.location.assign(id ? `/cockpit/tim/dossier?id=${encodeURIComponent(id)}` : '/cockpit/tim');
  } catch (error) {
    errorBox.textContent = error instanceof Error ? error.message : 'L’accord n’a pas pu être créé.'; errorBox.hidden = false; setSubmitState(submit, false);
  }
});

void loadAdvisors();
