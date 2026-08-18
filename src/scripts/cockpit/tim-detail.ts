import { requestJson } from './api';
import {
  PRIORITIES,
  TIM_AGREEMENT_STATUSES,
  TIM_AGREEMENT_TYPES,
  TIM_COMPENSATION_STATUSES,
  TIM_OPERATION_STATUSES,
  TIM_TRANSACTION_TYPES,
  labelFor,
} from './options';
import {
  badge,
  bindDialogControls,
  displayText,
  formatDate,
  formatMoney,
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

type TimParty = { id?: string; role?: string; advisorProfileId?: string; advisorId?: string; displayName?: string; advisorName?: string; isCurrentOperator?: boolean; advisor?: { displayName?: string } };
type TimAllocation = { role?: string; advisorProfileId?: string; basisPoints?: number; shareBasisPoints?: number; termsId?: string; partyId?: string; displayName?: string };
type TimTerms = { id?: string; version?: number; versionNumber?: number; feeBasis?: string; currency?: string; currencyCode?: string; triggerEvent?: string; paymentTriggerText?: string; paymentTriggerCode?: string; allocations?: TimAllocation[]; effectiveAt?: string; createdAt?: string; isCurrent?: boolean | number };
type TimCompensation = {
  id?: string;
  termsId?: string;
  termsVersion?: number;
  estimatedFeesMinor?: number;
  estimatedTotalFeesMinor?: number;
  estimatedShareMinor?: number;
  dueMinor?: number;
  amountDueMinor?: number;
  paidMinor?: number;
  amountPaidMinor?: number;
  status?: string;
  compensationStatus?: string;
  currency?: string;
  currencyCode?: string;
  dueAt?: string;
  expectedPaymentAt?: string;
  createdAt?: string;
  isCurrent?: boolean | number;
  version?: number;
};
type TimPayment = { id: string; kind?: string; amountMinor?: number; currency?: string; currencyCode?: string; paidAt?: string; reference?: string; externalReference?: string; status?: string };
type TimTask = { id: string; title?: string; dueAt?: string; priority?: string; state?: string; status?: string; waitingReason?: string; isNextAction?: boolean; version?: number };
type TimStatusEvent = { id?: string; axis?: string; stateAxis?: string; status?: string; toState?: string; effectiveAt?: string; reason?: string };
type TimDetail = {
  id?: string;
  version?: number;
  agreement?: {
    id?: string;
    reference?: string;
    internalReference?: string;
    label?: string;
    agreementType?: string;
    operationType?: string;
    transactionType?: string;
    informationNature?: string;
    subjectLabel?: string;
    assetLabel?: string;
    transmittedAt?: string;
    informationTransmittedAt?: string;
    formalizedAt?: string;
    formSigned?: boolean;
    formSignedAt?: string;
    omegaUploaded?: boolean;
    omegaUploadedAt?: string;
    mandateObtained?: boolean;
    mandateObtainedAt?: string;
    mandateReference?: string;
    notes?: string;
    version?: number;
    agreementStatus?: string;
    operationStatus?: string;
  };
  reference?: string;
  label?: string;
  agreementType?: string;
  operationType?: string;
  parties?: TimParty[];
  currentTerms?: TimTerms | null;
  terms?: TimTerms[];
  allocations?: TimAllocation[];
  statuses?: { agreement?: string; operation?: string; compensation?: string };
  currentStatuses?: { agreement?: string; operation?: string; compensation?: string };
  statusEvents?: TimStatusEvent[];
  compensations?: TimCompensation[];
  currentCompensation?: TimCompensation | null;
  payments?: TimPayment[];
  tasks?: TimTask[];
};

const root = requiredElement<HTMLElement>('[data-tim-detail]');
const agreementId = new URLSearchParams(window.location.search).get('id')?.trim() ?? '';
let detail: TimDetail | undefined;

function normalizeTimDetail(raw: TimDetail): TimDetail {
  const base = raw.agreement ?? {};
  const agreement = {
    ...base,
    reference: base.reference ?? base.internalReference,
    operationType: base.operationType ?? base.transactionType,
    transmittedAt: base.transmittedAt ?? base.informationTransmittedAt,
    formSigned: base.formSigned ?? Boolean(base.formSignedAt),
    omegaUploaded: base.omegaUploaded ?? Boolean(base.omegaUploadedAt),
    mandateObtained: base.mandateObtained ?? Boolean(base.mandateObtainedAt),
  };
  const parties = (raw.parties ?? []).map((party) => ({ ...party, advisorProfileId: party.advisorProfileId ?? party.advisorId }));
  const allocations = raw.allocations ?? [];
  const terms = (raw.terms ?? []).map((item) => ({
    ...item,
    version: item.version ?? item.versionNumber,
    currency: item.currency ?? item.currencyCode,
    triggerEvent: item.triggerEvent ?? item.paymentTriggerText ?? item.paymentTriggerCode,
    allocations: item.allocations ?? allocations
      .filter((allocation) => allocation.termsId === item.id)
      .map((allocation) => {
        const party = parties.find((candidate) => candidate.id === allocation.partyId);
        return {
          ...allocation,
          basisPoints: allocation.basisPoints ?? allocation.shareBasisPoints,
          role: allocation.role ?? party?.role,
          advisorProfileId: allocation.advisorProfileId ?? party?.advisorProfileId,
        };
      }),
  }));
  const compensations = (raw.compensations ?? []).map((item) => ({
    ...item,
    estimatedFeesMinor: item.estimatedFeesMinor ?? item.estimatedTotalFeesMinor,
    dueMinor: item.dueMinor ?? item.amountDueMinor,
    paidMinor: item.paidMinor ?? item.amountPaidMinor,
    status: item.status ?? item.compensationStatus,
    currency: item.currency ?? item.currencyCode,
    termsVersion: item.termsVersion ?? terms.find((term) => term.id === item.termsId)?.version,
  }));
  const payments = (raw.payments ?? []).map((item) => ({ ...item, currency: item.currency ?? item.currencyCode, reference: item.reference ?? item.externalReference }));
  const statusEvents = (raw.statusEvents ?? []).map((item) => ({ ...item, axis: item.axis ?? item.stateAxis, status: item.status ?? item.toState }));
  const currentCompensation = compensations.find((item) => Boolean(item.isCurrent)) ?? compensations[0];
  return {
    ...raw,
    agreement,
    parties,
    terms,
    currentTerms: raw.currentTerms ?? terms.find((item) => Boolean(item.isCurrent)) ?? terms[0],
    compensations,
    currentCompensation: raw.currentCompensation ?? currentCompensation,
    payments,
    statusEvents,
    currentStatuses: raw.currentStatuses ?? {
      agreement: base.agreementStatus,
      operation: base.operationStatus,
      compensation: currentCompensation?.status,
    },
  };
}

function agreementOf(data: TimDetail): NonNullable<TimDetail['agreement']> {
  return data.agreement ?? {
    id: data.id,
    reference: data.reference,
    label: data.label,
    agreementType: data.agreementType,
    operationType: data.operationType,
    version: data.version,
  };
}

function statusesOf(data: TimDetail): { agreement?: string; operation?: string; compensation?: string } {
  if (data.currentStatuses) return data.currentStatuses;
  if (data.statuses) return data.statuses;
  const latest: Record<string, string> = {};
  for (const event of data.statusEvents ?? []) if (event.axis && event.status) latest[event.axis] = event.status;
  return latest;
}

function currentTermsOf(data: TimDetail): TimTerms | undefined {
  return data.currentTerms ?? data.terms?.slice().sort((a, b) => (b.version ?? 0) - (a.version ?? 0))[0];
}

function currentCompensationOf(data: TimDetail): TimCompensation | undefined {
  return data.currentCompensation ?? data.compensations?.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
}

function section(title: string, kicker: string, actions: HTMLElement[] = []): { shell: HTMLElement; body: HTMLElement } {
  const shell = node('section', { className: 'cockpit-detail-section' });
  const header = node('header', { className: 'cockpit-detail-section-header' });
  const copy = node('div'); copy.append(node('p', { className: 'cockpit-kicker', text: kicker }), node('h2', { text: title })); header.append(copy);
  if (actions.length) { const group = node('div', { className: 'cockpit-actions' }); group.append(...actions); header.append(group); }
  const body = node('div', { className: 'cockpit-detail-section-body' }); shell.append(header, body); return { shell, body };
}

function dialogButton(label: string, dialogId: string, kind: 'primary' | 'secondary' | 'quiet' = 'secondary'): HTMLButtonElement {
  const button = node('button', { className: `cockpit-button cockpit-button-${kind}`, text: label, attrs: { type: 'button' } });
  button.addEventListener('click', () => openDialog(requiredElement<HTMLDialogElement>(`#${dialogId}`)));
  return button;
}

function renderSummary(data: TimDetail): HTMLElement {
  const agreement = agreementOf(data);
  const statuses = statusesOf(data);
  const { shell, body } = section('Synthèse', 'Accord TIM');
  const intro = node('div', { className: 'cockpit-summary-intro' });
  const copy = node('div'); copy.append(node('p', { className: 'cockpit-record-kicker', text: agreement.reference || 'Sans référence' }), node('h3', { text: agreement.label || 'Accord sans libellé' }), node('p', { text: agreement.notes || 'Aucune note.' }));
  intro.append(copy, badge(labelFor(TIM_AGREEMENT_TYPES, agreement.agreementType), 'info'));
  const axes = node('div', { className: 'cockpit-tim-axes cockpit-tim-axes-large' });
  for (const [axis, value, options] of [
    ['Accord', statuses.agreement, TIM_AGREEMENT_STATUSES],
    ['Opération', statuses.operation, TIM_OPERATION_STATUSES],
    ['Rémunération', statuses.compensation, TIM_COMPENSATION_STATUSES],
  ] as const) {
    const card = node('div'); card.append(node('span', { text: axis }), node('strong', { text: labelFor(options, value) })); axes.append(card);
  }
  const facts = node('dl', { className: 'cockpit-data-grid' });
  const otherAdvisor = (data.parties ?? []).find((party) => party.role === 'handling_advisor') ?? data.parties?.[1];
  const values: Array<[string, string]> = [
    ['Opération', labelFor(TIM_TRANSACTION_TYPES, agreement.operationType)],
    ['Conseiller traitant', otherAdvisor?.displayName || otherAdvisor?.advisorName || otherAdvisor?.advisor?.displayName || 'À préciser'],
    ['Information transmise', formatDate(agreement.transmittedAt)],
    ['Formalisé', formatDate(agreement.formalizedAt)],
    ['Formulaire', agreement.formSigned ? 'Signé' : 'Non signé'],
    ['OMEGA', agreement.omegaUploaded ? 'Déposé' : 'Non déposé'],
    ['Mandat', agreement.mandateObtained ? `Obtenu${agreement.mandateReference ? ` · ${agreement.mandateReference}` : ''}` : 'Non obtenu'],
    ['Personne concernée', displayText(agreement.subjectLabel, 'Libellé non conservé')],
    ['Bien ou projet', displayText(agreement.assetLabel)],
  ];
  for (const [label, value] of values) { const group = node('div', { className: 'cockpit-data-item' }); group.append(node('dt', { text: label }), node('dd', { text: value })); facts.append(group); }
  body.append(intro, axes, facts); return shell;
}

function renderTerms(data: TimDetail): HTMLElement {
  const edit = dialogButton('Réviser les termes', 'tim-terms-dialog');
  edit.addEventListener('click', prepareTermsForm);
  const { shell, body } = section('Termes', 'Versions', [edit]);
  const versions = data.terms?.slice().sort((a, b) => (b.version ?? 0) - (a.version ?? 0)) ?? (data.currentTerms ? [data.currentTerms] : []);
  if (!versions.length) { body.append(node('p', { className: 'cockpit-inline-empty is-warning', text: 'Aucun terme confirmé.' })); return shell; }
  const list = node('div', { className: 'cockpit-version-list' });
  for (const terms of versions) {
    const card = node('article', { className: 'cockpit-version-card' });
    const heading = node('div', { className: 'cockpit-record-header' }); heading.append(node('h3', { text: `Version ${terms.version ?? '?'}` }), badge(terms.feeBasis === 'unknown' ? 'Assiette à confirmer' : String(terms.feeBasis).toUpperCase(), terms.feeBasis === 'unknown' ? 'warning' : 'neutral'));
    const allocations = node('div', { className: 'cockpit-allocation-row' });
    for (const allocation of terms.allocations ?? []) allocations.append(node('span', { text: `${allocation.role === 'referrer' ? 'Apporteur' : 'Traitant'} · ${typeof allocation.basisPoints === 'number' ? `${(allocation.basisPoints / 100).toLocaleString('fr-FR')} %` : 'à confirmer'}` }));
    card.append(heading, allocations, node('p', { text: `Fait générateur : ${displayText(terms.triggerEvent)}` }), node('small', { text: `Créée le ${formatDate(terms.effectiveAt ?? terms.createdAt, true)} · ${terms.currency ?? 'EUR'}` }));
    list.append(card);
  }
  body.append(list); return shell;
}

function renderCompensation(data: TimDetail): HTMLElement {
  const { shell, body } = section('Rémunération', 'Montants en unités mineures', [dialogButton('Nouvelle estimation', 'tim-compensation-dialog'), dialogButton('Enregistrer un paiement', 'tim-payment-dialog', 'primary')]);
  const current = currentCompensationOf(data);
  const currency = current?.currency ?? currentTermsOf(data)?.currency ?? 'EUR';
  const paid = current?.paidMinor ?? 0;
  const due = current?.dueMinor ?? 0;
  const facts = node('dl', { className: 'cockpit-money-grid' });
  for (const [label, value, tone] of [
    ['Honoraires estimés', formatMoney(current?.estimatedFeesMinor, currency), 'neutral'],
    ['Part Mouaad estimée', formatMoney(current?.estimatedShareMinor, currency), 'info'],
    ['Montant dû', formatMoney(current?.dueMinor, currency), current?.status === 'due' ? 'warning' : 'neutral'],
    ['Déjà payé', formatMoney(paid, currency), paid > 0 ? 'success' : 'neutral'],
    ['Solde indicatif', formatMoney(Math.max(0, due - paid), currency), due > paid ? 'warning' : 'success'],
  ] as const) {
    const item = node('div', { className: `cockpit-money-item is-${tone}` }); item.append(node('dt', { text: label }), node('dd', { text: value })); facts.append(item);
  }
  body.append(facts);
  if (current) body.append(node('p', { className: 'cockpit-record-note', text: `État : ${labelFor(TIM_COMPENSATION_STATUSES, current.status)} · termes v${current.termsVersion ?? '?'} · exigibilité ${formatDate(current.dueAt)} · paiement attendu ${formatDate(current.expectedPaymentAt)}` }));
  const payments = data.payments ?? [];
  if (payments.length) {
    const list = node('ul', { className: 'cockpit-payment-list' });
    for (const payment of payments) {
      const row = node('li'); row.append(node('div', { text: `${payment.kind === 'adjustment' ? 'Ajustement' : payment.kind === 'refund' ? 'Remboursement' : 'Paiement'} · ${formatDate(payment.paidAt)}` }), node('strong', { text: formatMoney(payment.amountMinor, payment.currency ?? currency) }), payment.reference ? node('small', { text: payment.reference }) : node('small', { text: 'Sans référence' })); list.append(row);
    }
    body.append(node('h3', { className: 'cockpit-subheading', text: 'Paiements et ajustements' }), list);
  }
  return shell;
}

async function completeTask(task: TimTask, button: HTMLButtonElement): Promise<void> {
  setSubmitState(button, true, 'Traitement…');
  try { await requestJson(`/api/cockpit/tasks/${encodeURIComponent(task.id)}/complete`, { method: 'POST', body: { expectedVersion: task.version } }); showToast('Tâche terminée.'); await loadDetail(); }
  catch (error) { showToast(error instanceof Error ? error.message : 'La tâche n’a pas pu être terminée.', 'error'); setSubmitState(button, false); }
}

function renderTasks(data: TimDetail): HTMLElement {
  const { shell, body } = section('Tâches et échéances', 'Suivi', [dialogButton('Nouvelle tâche', 'tim-task-dialog')]);
  const tasks = data.tasks ?? [];
  if (!tasks.length) { body.append(node('p', { className: 'cockpit-inline-empty is-warning', text: 'Aucune prochaine action : cet accord actif apparaîtra dans Aujourd’hui.' })); return shell; }
  const list = node('ul', { className: 'cockpit-task-list' });
  for (const task of tasks) {
    const state = task.state ?? task.status ?? 'open';
    const row = node('li', { className: `cockpit-task-row${task.isNextAction ? ' is-next' : ''}` });
    const copy = node('div'); copy.append(node('h4', { text: task.title || 'Tâche sans libellé' }), node('p', { text: `${formatDate(task.dueAt, true)} · ${labelFor(PRIORITIES, task.priority)}${task.waitingReason ? ` · en attente : ${task.waitingReason}` : ''}` }));
    const actions = node('div', { className: 'cockpit-badge-row' }); if (task.isNextAction) actions.append(badge('Prochaine action', 'info'));
    if (!['completed', 'cancelled'].includes(state)) { const done = node('button', { className: 'cockpit-button cockpit-button-quiet', text: 'Terminer', attrs: { type: 'button' } }); done.addEventListener('click', () => void completeTask(task, done)); actions.append(done); } else actions.append(badge('Terminée', 'success'));
    row.append(copy, actions); list.append(row);
  }
  body.append(list); return shell;
}

function renderHistory(data: TimDetail): HTMLElement {
  const { shell, body } = section('Journal des états', 'Traçabilité');
  const items = data.statusEvents?.slice().sort((a, b) => String(b.effectiveAt).localeCompare(String(a.effectiveAt))) ?? [];
  if (!items.length) { body.append(node('p', { className: 'cockpit-inline-empty', text: 'Aucun changement d’état dans le journal.' })); return shell; }
  const list = node('ol', { className: 'cockpit-timeline-list' });
  for (const item of items) { const row = node('li'); row.append(node('span', { className: 'cockpit-timeline-dot', attrs: { 'aria-hidden': 'true' } })); const copy = node('div'); copy.append(node('p', { className: 'cockpit-record-kicker', text: `${displayText(item.axis)} · ${formatDate(item.effectiveAt, true)}` }), node('h3', { text: displayText(item.status).replaceAll('_', ' ') })); if (item.reason) copy.append(node('p', { text: item.reason })); row.append(copy); list.append(row); }
  body.append(list); return shell;
}

function renderDetail(data: TimDetail): void {
  const agreement = agreementOf(data);
  const heading = document.querySelector<HTMLElement>('.cockpit-heading h1'); if (heading) heading.textContent = agreement.label || 'Accord TIM';
  document.title = `${agreement.reference || 'Accord TIM'} · Cockpit LEVOIS`;
  const layout = node('div', { className: 'cockpit-detail-layout' }); layout.append(renderSummary(data), renderTerms(data), renderCompensation(data), renderTasks(data), renderHistory(data)); root.replaceChildren(layout); root.setAttribute('aria-busy', 'false');
  updateStatusOptions();
  document.querySelectorAll<HTMLButtonElement>('[data-requires-tim]').forEach((button) => { button.disabled = false; });
}

async function loadDetail(): Promise<void> {
  if (!agreementId) { renderError(root, new Error('Identifiant d’Accord TIM manquant.')); return; }
  renderLoading(root, 'Chargement de l’accord…');
  try { detail = normalizeTimDetail(await requestJson<TimDetail>(`/api/cockpit/tim/${encodeURIComponent(agreementId)}`)); renderDetail(detail); }
  catch (error) { renderError(root, error, () => void loadDetail()); }
}

function dialogError(form: HTMLFormElement, message?: string): void { const box = requiredElement<HTMLElement>('[data-dialog-error]', form); box.textContent = message ?? ''; box.hidden = !message; }
async function submitDialog(form: HTMLFormElement, path: string, body: unknown, idempotencyKey?: string): Promise<void> {
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]'); if (!button) return; dialogError(form); setSubmitState(button, true);
  try { await requestJson(path, { method: 'POST', body, idempotencyKey }); form.closest('dialog')?.close(); form.reset(); if (idempotencyKey) delete form.dataset.idempotencyKey; showToast('Modification enregistrée.'); await loadDetail(); }
  catch (error) { dialogError(form, error instanceof Error ? error.message : 'La modification a échoué.'); setSubmitState(button, false); }
}

function localDateTime(): string { const date = new Date(); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
const axisOptions = { agreement: TIM_AGREEMENT_STATUSES, operation: TIM_OPERATION_STATUSES, compensation: TIM_COMPENSATION_STATUSES };
const statusForm = requiredElement<HTMLFormElement>('[data-tim-status-form]');
const axisSelect = requiredElement<HTMLSelectElement>('[data-status-axis]', statusForm);
const statusSelect = requiredElement<HTMLSelectElement>('[data-status-options]', statusForm);
function updateStatusOptions(): void { const options = axisOptions[axisSelect.value as keyof typeof axisOptions]; statusSelect.replaceChildren(...options.map((option) => node('option', { text: option.label, attrs: { value: option.value } }))); const current = statusesOf(detail ?? {})[axisSelect.value as keyof ReturnType<typeof statusesOf>]; if (current) statusSelect.value = current; }
axisSelect.addEventListener('change', updateStatusOptions); updateStatusOptions();
statusForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!statusForm.reportValidity()) return;
  const values = formDataObject(statusForm);
  const statuses = statusesOf(detail ?? {});
  const compensation = currentCompensationOf(detail ?? {});
  if (values.axis === 'compensation' && !compensation?.id) { dialogError(statusForm, 'Enregistrez d’abord une rémunération.'); return; }
  void submitDialog(statusForm, `/api/cockpit/tim/${encodeURIComponent(agreementId)}/status/change`, {
    axis: values.axis,
    fromStatus: statuses[values.axis as keyof typeof statuses],
    toStatus: values.status,
    effectiveAt: new Date(values.effectiveAt).toISOString(),
    reason: values.reason || undefined,
    compensationId: values.axis === 'compensation' ? compensation?.id : undefined,
    expectedVersion: values.axis === 'compensation' ? compensation?.version : agreementOf(detail ?? {}).version,
  });
});

function prepareTermsForm(): void {
  const form = requiredElement<HTMLFormElement>('[data-tim-terms-form]'); const terms = currentTermsOf(detail ?? {}); if (!terms) return;
  const set = (name: string, value: string) => { const field = form.elements.namedItem(name); if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) field.value = value; };
  set('feeBasis', terms.feeBasis ?? 'unknown'); set('currency', terms.currency ?? 'EUR'); set('triggerEvent', terms.triggerEvent ?? 'unknown');
  const referrer = terms.allocations?.find((item) => ['referrer', 'seller_mandate_advisor'].includes(item.role ?? '')); const handler = terms.allocations?.find((item) => ['handling_advisor', 'buyer_advisor'].includes(item.role ?? ''));
  set('referrerPercent', typeof referrer?.basisPoints === 'number' ? String(referrer.basisPoints / 100) : ''); set('handlerPercent', typeof handler?.basisPoints === 'number' ? String(handler.basisPoints / 100) : '');
}
const termsForm = requiredElement<HTMLFormElement>('[data-tim-terms-form]');
termsForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!termsForm.reportValidity()) return;
  const values = formDataObject(termsForm);
  const hasFirstShare = values.referrerPercent !== '';
  const hasSecondShare = values.handlerPercent !== '';
  if (hasFirstShare !== hasSecondShare) { dialogError(termsForm, 'Renseignez les deux allocations ou laissez-les toutes les deux à confirmer.'); return; }
  const firstShare = hasFirstShare ? Math.round(Number(values.referrerPercent) * 100) : undefined;
  const secondShare = hasSecondShare ? Math.round(Number(values.handlerPercent) * 100) : undefined;
  if (hasFirstShare && (!Number.isInteger(firstShare) || !Number.isInteger(secondShare) || firstShare! + secondShare! !== 10_000)) { dialogError(termsForm, 'Les deux allocations doivent totaliser exactement 100 %.'); return; }
  const parties = detail?.parties ?? [];
  const first = parties.find((party) => ['referrer', 'seller_mandate_advisor'].includes(party.role ?? '')) ?? parties[0];
  const second = parties.find((party) => ['handling_advisor', 'buyer_advisor'].includes(party.role ?? '')) ?? parties[1];
  if (!first?.advisorProfileId || !second?.advisorProfileId) { dialogError(termsForm, 'Les deux parties TIM sont introuvables.'); return; }
  const trigger = values.triggerEvent || 'unknown';
  void submitDialog(termsForm, `/api/cockpit/tim/${encodeURIComponent(agreementId)}/terms/revise`, {
    feeBasis: values.feeBasis,
    currencyCode: values.currency.toUpperCase(),
    paymentTriggerCode: trigger === 'unknown' ? 'unknown' : 'custom',
    paymentTriggerText: trigger,
    termsConfirmed: true,
    allocationsConfirmed: hasFirstShare,
    changeReason: values.reason,
    allocations: hasFirstShare ? [
      { advisorId: first.advisorProfileId, basisPoints: firstShare },
      { advisorId: second.advisorProfileId, basisPoints: secondShare },
    ] : [],
    expectedVersion: agreementOf(detail ?? {}).version,
  });
});

function eurosToMinor(value: string): number | undefined { if (!value) return undefined; const amount = Number(value.replace(',', '.')); return Number.isFinite(amount) ? Math.round(amount * 100) : undefined; }
const compensationForm = requiredElement<HTMLFormElement>('[data-tim-compensation-form]');
compensationForm.addEventListener('submit', (event) => {
  event.preventDefault(); if (!compensationForm.reportValidity()) return;
  const values = formDataObject(compensationForm); const terms = currentTermsOf(detail ?? {});
  if (!terms?.id) { dialogError(compensationForm, 'Confirmez d’abord une version des termes.'); return; }
  const parties = detail?.parties ?? [];
  const beneficiary = parties.find((party) => party.isCurrentOperator) ?? parties[0];
  if (!beneficiary?.id) { dialogError(compensationForm, 'La partie bénéficiaire est introuvable.'); return; }
  const current = currentCompensationOf(detail ?? {});
  void submitDialog(compensationForm, `/api/cockpit/tim/${encodeURIComponent(agreementId)}/compensations/record`, {
    beneficiaryPartyId: beneficiary.id,
    termsId: terms.id,
    supersedesCompensationId: current?.id,
    estimatedTotalFeesMinor: eurosToMinor(values.estimatedFees) ?? 0,
    estimatedShareMinor: eurosToMinor(values.estimatedShare) ?? 0,
    amountDueMinor: eurosToMinor(values.dueAmount) ?? 0,
    currencyCode: values.currency.toUpperCase(),
    status: values.status,
    dueAt: values.dueAt ? new Date(`${values.dueAt}T12:00:00`).toISOString() : undefined,
    expectedPaymentAt: values.expectedPaymentAt ? new Date(`${values.expectedPaymentAt}T12:00:00`).toISOString() : undefined,
    note: values.note || undefined,
    expectedVersion: agreementOf(detail ?? {}).version,
  });
});

const paymentForm = requiredElement<HTMLFormElement>('[data-tim-payment-form]');
paymentForm.addEventListener('submit', (event) => { event.preventDefault(); if (!paymentForm.reportValidity()) return; const values = formDataObject(paymentForm); const compensation = currentCompensationOf(detail ?? {}); if (!compensation?.id) { dialogError(paymentForm, 'Enregistrez d’abord une rémunération.'); return; } const idempotencyKey = paymentForm.dataset.idempotencyKey || crypto.randomUUID(); paymentForm.dataset.idempotencyKey = idempotencyKey; void submitDialog(paymentForm, `/api/cockpit/tim/${encodeURIComponent(agreementId)}/payments/record`, { compensationId: compensation.id, kind: values.kind, amountMinor: eurosToMinor(values.amount), currencyCode: values.currency.toUpperCase(), paidAt: new Date(`${values.paidAt}T12:00:00`).toISOString(), externalReference: values.reference || undefined, note: values.note || undefined, expectedVersion: compensation.version }, idempotencyKey); });

const taskForm = requiredElement<HTMLFormElement>('[data-tim-task-form]');
taskForm.addEventListener('submit', (event) => { event.preventDefault(); if (!taskForm.reportValidity()) return; const values = formDataObject(taskForm); const checkbox = taskForm.elements.namedItem('isNextAction'); void submitDialog(taskForm, `/api/cockpit/tim/${encodeURIComponent(agreementId)}/tasks/create`, { title: values.title, dueAt: new Date(values.dueAt).toISOString(), priority: values.priority, waitingReason: values.waitingReason || undefined, isNextAction: checkbox instanceof HTMLInputElement && checkbox.checked, expectedVersion: agreementOf(detail ?? {}).version }); });

bindDialogControls();
document.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) => dialog.addEventListener('click', handleDialogBackdrop));
document.addEventListener('click', () => {
  const now = localDateTime(); const statusAt = statusForm.elements.namedItem('effectiveAt'); if (statusAt instanceof HTMLInputElement && !statusAt.value) statusAt.value = now;
  const paidAt = paymentForm.elements.namedItem('paidAt'); if (paidAt instanceof HTMLInputElement && !paidAt.value) paidAt.value = now.slice(0, 10);
});
void loadDetail();
