import { requestJson, withQuery } from './api';
import {
  TIM_AGREEMENT_STATUSES,
  TIM_AGREEMENT_TYPES,
  TIM_COMPENSATION_STATUSES,
  TIM_OPERATION_STATUSES,
  TIM_TRANSACTION_TYPES,
  labelFor,
} from './options';
import { badge, formatDate, formatMoney, linkButton, node, renderEmpty, renderError, renderLoading, requiredElement } from './ui';

type TimListItem = {
  id: string;
  reference?: string;
  internalReference?: string;
  label?: string;
  agreementType?: string;
  operationType?: string;
  transactionType?: string;
  otherAdvisor?: string;
  handlingAdvisorName?: string;
  agreementStatus?: string;
  operationStatus?: string;
  compensationStatus?: string;
  estimatedShareMinor?: number;
  dueMinor?: number;
  paidMinor?: number;
  currency?: string;
  amountDueMinor?: number;
  amountPaidMinor?: number;
  currencyCode?: string;
  nextAction?: { title?: string; dueAt?: string } | string | null;
  nextActionTitle?: string;
  nextActionDueAt?: string;
  missingNextAction?: boolean;
  withoutNextAction?: boolean | number;
};
type TimPayload = { items?: TimListItem[]; agreements?: TimListItem[] } | TimListItem[];
type Advisor = { id: string; displayName?: string; isCurrentOperator?: boolean };
type AdvisorPayload = { items?: Advisor[]; advisors?: Advisor[] } | Advisor[];

const root = requiredElement<HTMLElement>('[data-tim-list]');
const filters = requiredElement<HTMLFormElement>('[data-tim-filters]');
let controller: AbortController | undefined;

function renderAgreement(item: TimListItem): HTMLLIElement {
  const reference = item.reference ?? item.internalReference;
  const operationType = item.operationType ?? item.transactionType;
  const currency = item.currency ?? item.currencyCode;
  const due = item.dueMinor ?? item.amountDueMinor;
  const paid = item.paidMinor ?? item.amountPaidMinor;
  const nextTitle = typeof item.nextAction === 'string' ? item.nextAction : item.nextAction?.title ?? item.nextActionTitle;
  const nextDue = typeof item.nextAction === 'object' && item.nextAction ? item.nextAction.dueAt : item.nextActionDueAt;
  const card = node('li', { className: 'cockpit-record-card is-tim' });
  const header = node('div', { className: 'cockpit-record-header' });
  const copy = node('div');
  copy.append(node('p', { className: 'cockpit-record-kicker', text: `${reference || 'Sans référence'} · ${labelFor(TIM_TRANSACTION_TYPES, operationType)}` }), node('h2', { text: item.label || 'Accord sans libellé' }));
  const type = badge(labelFor(TIM_AGREEMENT_TYPES, item.agreementType), 'info');
  header.append(copy, type);

  const axes = node('div', { className: 'cockpit-tim-axes' });
  const axisValues: Array<[string, string, readonly { value: string; label: string }[], 'neutral' | 'info' | 'warning' | 'success']> = [
    ['Accord', item.agreementStatus ?? '', TIM_AGREEMENT_STATUSES, item.agreementStatus === 'active' ? 'success' : 'neutral'],
    ['Opération', item.operationStatus ?? '', TIM_OPERATION_STATUSES, 'info'],
    ['Rémunération', item.compensationStatus ?? '', TIM_COMPENSATION_STATUSES, item.compensationStatus === 'due' ? 'warning' : item.compensationStatus === 'paid' ? 'success' : 'neutral'],
  ];
  for (const [label, value, options, tone] of axisValues) {
    const axis = node('div'); axis.append(node('span', { text: label }), badge(labelFor(options, value), tone)); axes.append(axis);
  }

  const details = node('dl', { className: 'cockpit-record-details cockpit-record-details-four' });
  const values: Array<[string, string]> = [
    ['Autre conseiller', item.otherAdvisor || item.handlingAdvisorName || 'À préciser'],
    ['Part estimée', formatMoney(item.estimatedShareMinor, currency)],
    ['Dû', formatMoney(due, currency)],
    ['Payé', formatMoney(paid, currency)],
    ['Prochaine action', nextTitle || 'Aucune'],
    ['Échéance', formatDate(nextDue, true)],
  ];
  for (const [label, value] of values) {
    const group = node('div'); group.append(node('dt', { text: label }), node('dd', { text: value })); details.append(group);
  }

  const footer = node('div', { className: 'cockpit-record-footer' });
  if (item.missingNextAction || item.withoutNextAction || !nextTitle) footer.append(badge('Sans prochaine action', 'warning'));
  footer.append(linkButton('Ouvrir l’accord', `/cockpit/tim/dossier?id=${encodeURIComponent(item.id)}`, 'secondary'));
  card.append(header, axes, details, footer);
  return card;
}

async function loadTim(): Promise<void> {
  controller?.abort(); controller = new AbortController();
  renderLoading(root, 'Chargement des accords…');
  const values = new FormData(filters);
  const path = withQuery('/api/cockpit/tim', {
    q: String(values.get('q') ?? '').trim(),
    transactionType: String(values.get('operationType') ?? ''),
    agreementStatus: String(values.get('agreementStatus') ?? ''),
    operationStatus: String(values.get('operationStatus') ?? ''),
    compensationStatus: String(values.get('compensationStatus') ?? ''),
    advisorId: String(values.get('advisorId') ?? ''),
    dueSoon: values.has('dueSoon') || undefined,
    withoutNextAction: values.has('missingNextAction') || undefined,
  });
  try {
    const payload = await requestJson<TimPayload>(path, { signal: controller.signal });
    const items = Array.isArray(payload) ? payload : payload.items ?? payload.agreements ?? [];
    if (!items.length) {
      renderEmpty(root, 'Aucun Accord TIM dans cette vue', 'Ajustez les filtres ou créez un accord fictif de démonstration.', linkButton('Nouvel accord', '/cockpit/tim/nouveau', 'primary'));
      return;
    }
    const list = node('ul', { className: 'cockpit-record-list' });
    for (const item of items) list.append(renderAgreement(item));
    root.replaceChildren(node('p', { className: 'cockpit-list-summary', text: `${items.length} accord${items.length > 1 ? 's' : ''} affiché${items.length > 1 ? 's' : ''}` }), list);
    root.setAttribute('aria-busy', 'false');
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    renderError(root, error, () => void loadTim());
  }
}

async function loadAdvisorFilter(): Promise<void> {
  const select = filters.querySelector<HTMLSelectElement>('[data-tim-advisor-filter]');
  if (!select) return;
  try {
    const payload = await requestJson<AdvisorPayload>('/api/cockpit/advisors');
    const advisors = Array.isArray(payload) ? payload : payload.items ?? payload.advisors ?? [];
    for (const advisor of advisors) select.add(new Option(`${advisor.displayName || 'Conseiller'}${advisor.isCurrentOperator ? ' · vous' : ''}`, advisor.id));
  } catch {
    select.disabled = true;
    select.title = 'Filtre conseiller indisponible';
  }
}

filters.addEventListener('submit', (event) => { event.preventDefault(); void loadTim(); });
const search = filters.elements.namedItem('q');
if (search instanceof HTMLInputElement) {
  let timer = 0;
  search.addEventListener('input', () => { window.clearTimeout(timer); timer = window.setTimeout(() => void loadTim(), 350); });
}
void loadTim();
void loadAdvisorFilter();
