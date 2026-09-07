import { CockpitApiError } from './api';

export function requiredElement<T extends Element>(selector: string, root: ParentNode = document): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Élément cockpit introuvable: ${selector}`);
  return element;
}

export function node<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: { className?: string; text?: string; attrs?: Record<string, string> } = {},
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (options.className) element.className = options.className;
  if (options.text !== undefined) element.textContent = options.text;
  for (const [name, value] of Object.entries(options.attrs ?? {})) element.setAttribute(name, value);
  return element;
}

export function addLabeledValue(parent: HTMLElement, label: string, value: unknown): void {
  const item = node('div', { className: 'cockpit-data-item' });
  item.append(node('dt', { text: label }), node('dd', { text: displayText(value) }));
  parent.append(item);
}

export function displayText(value: unknown, fallback = 'À préciser'): string {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

export function formatDate(value: unknown, withTime = false): string {
  if (typeof value !== 'string' || !value) return 'Non planifiée';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' as const } : {}),
  }).format(date);
}

export function formatMoney(minorUnits: unknown, currency: unknown = 'EUR'): string {
  if (typeof minorUnits !== 'number' || !Number.isFinite(minorUnits)) return 'À confirmer';
  const safeCurrency = typeof currency === 'string' && /^[A-Z]{3}$/.test(currency) ? currency : 'EUR';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: safeCurrency }).format(minorUnits / 100);
}

export function badge(text: string, tone: 'neutral' | 'info' | 'warning' | 'danger' | 'success' = 'neutral'): HTMLSpanElement {
  return node('span', { className: `cockpit-badge is-${tone}`, text });
}

export function linkButton(label: string, href: string, kind: 'primary' | 'secondary' | 'quiet' = 'quiet'): HTMLAnchorElement {
  return node('a', { className: `cockpit-button cockpit-button-${kind}`, text: label, attrs: { href } });
}

export function renderLoading(root: HTMLElement, label = 'Chargement des données privées…'): void {
  root.replaceChildren(
    node('div', { className: 'cockpit-screen-state is-loading', attrs: { role: 'status' } }),
  );
  const state = root.firstElementChild as HTMLElement;
  state.append(node('span', { className: 'cockpit-spinner', attrs: { 'aria-hidden': 'true' } }), node('p', { text: label }));
  root.setAttribute('aria-busy', 'true');
}

export function renderEmpty(root: HTMLElement, title: string, detail: string, action?: HTMLElement): void {
  const state = node('section', { className: 'cockpit-screen-state is-empty' });
  state.append(node('span', { className: 'cockpit-empty-mark', text: '✓', attrs: { 'aria-hidden': 'true' } }));
  const copy = node('div');
  copy.append(node('h2', { text: title }), node('p', { text: detail }));
  state.append(copy);
  if (action) state.append(action);
  root.replaceChildren(state);
  root.setAttribute('aria-busy', 'false');
}

export function renderError(root: HTMLElement, error: unknown, retry?: () => void): void {
  const message = error instanceof CockpitApiError ? error.message : 'Une erreur inattendue empêche le chargement.';
  const state = node('section', { className: 'cockpit-screen-state is-error', attrs: { role: 'alert' } });
  state.append(node('span', { className: 'cockpit-error-mark', text: '!', attrs: { 'aria-hidden': 'true' } }));
  const copy = node('div');
  copy.append(node('h2', { text: 'Données indisponibles' }), node('p', { text: message }));
  state.append(copy);
  if (retry) {
    const button = node('button', { className: 'cockpit-button cockpit-button-secondary', text: 'Réessayer', attrs: { type: 'button' } });
    button.addEventListener('click', retry);
    state.append(button);
  }
  root.replaceChildren(state);
  root.setAttribute('aria-busy', 'false');
}

export function showToast(message: string, tone: 'success' | 'error' = 'success'): void {
  const region = document.querySelector<HTMLElement>('[data-toast-region]');
  if (!region) return;
  const toast = node('div', { className: `cockpit-toast is-${tone}`, text: message, attrs: { role: tone === 'error' ? 'alert' : 'status' } });
  region.append(toast);
  window.setTimeout(() => toast.remove(), 5000);
}

export function setSubmitState(button: HTMLButtonElement, busy: boolean, busyText = 'Enregistrement…'): void {
  if (busy) {
    button.dataset.originalLabel = button.textContent ?? '';
    button.textContent = busyText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalLabel || 'Enregistrer';
    button.disabled = false;
  }
}

export function formDataObject(form: HTMLFormElement): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of new FormData(form).entries()) {
    if (typeof value === 'string') values[key] = value.trim();
  }
  return values;
}

export function openDialog(dialog: HTMLDialogElement): void {
  if (!dialog.open) dialog.showModal();
  const selector = document.body.dataset.cockpitExperience === 'partition-active'
    ? 'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([data-dialog-close]):not([disabled])'
    : 'input:not([type="hidden"]), select, textarea, button';
  const first = dialog.querySelector<HTMLElement>(selector);
  window.setTimeout(() => first?.focus(), 0);
}

export function bindDialogControls(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-dialog-open]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const id = trigger.dataset.dialogOpen;
      if (!id) return;
      const dialog = document.getElementById(id);
      if (dialog instanceof HTMLDialogElement) openDialog(dialog);
    });
  });
  root.querySelectorAll<HTMLElement>('[data-dialog-close]').forEach((trigger) => {
    trigger.addEventListener('click', () => trigger.closest('dialog')?.close());
  });
}

export function handleDialogBackdrop(event: MouseEvent): void {
  if (!(event.target instanceof HTMLDialogElement)) return;
  const rect = event.target.getBoundingClientRect();
  const within = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!within) event.target.close();
}
