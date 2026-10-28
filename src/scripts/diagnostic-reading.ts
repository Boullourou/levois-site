import { site } from '../config/site';
import { CONTEXT_KEY, parseContext, saveContext, contextForReading, escapeHtml as e } from '../lib/experience/context';
import { DIAGNOSTIC_METHOD_VERSION, getDiagnosticJourney, getDiagnosticResources, type DiagnosticProject } from '../lib/experience/diagnostics';
import { isDiagnosticProject as isProject, resolveDiagnosticReading } from '../lib/experience/diagnostic-reading-state';
import { diagnosticNotesHTML } from '../lib/experience/diagnostic-notes';
import { answersText } from '../lib/experience/labels';
import { keepReading } from '../lib/experience/export';
import { captureFormHTML, createDiagnosticCapture } from './diagnostic-capture';
import { rememberDelivery } from '../lib/experience/diagnostic-delivery';
import type { Context, Reading } from '../lib/experience/types';

const routes: Record<DiagnosticProject, string> = {
  buyer: '/ma-recherche/', seller: '/situer-ma-vente/', transition: '/vendre-et-acheter/',
};

/** Keeps historical readings intact; the new view only owns the new method. */
export function mountDiagnosticReading(
  root: HTMLElement,
  suppliedContext?: Context,
  memoryOnly = false,
  onCorrect?: (questionId: string) => void,
): boolean {
  let context = suppliedContext ?? null;
  if (!context) {
    try { context = parseContext(JSON.parse(sessionStorage.getItem(CONTEXT_KEY) || 'null')); } catch { /* use the existing empty-session view */ }
  }
  if (!context) return false;
  const state = resolveDiagnosticReading(context);
  if (state.kind === 'legacy') return false;
  if (state.kind === 'draft') {
    root.classList.add('lv-simple-reading');
    const remaining = state.questionCount - state.answeredCount;
    root.innerHTML = '<header class="lv-synthesis-header"><p class="lv-overline">Votre projet est conservé</p><h1 tabindex="-1">Terminons votre point de départ.</h1>' +
      '<p class="lv-intro">' + state.answeredCount + ' réponse' + (state.answeredCount !== 1 ? 's' : '') + ' sur ' + state.questionCount + (state.answeredCount === 1 ? ' est renseignée. Il reste ' : ' sont renseignées. Il reste ') + remaining +
      ' question' + (remaining > 1 ? 's' : '') + ' à compléter ou à vérifier avant votre synthèse.</p>' +
      '<div class="lv-actions"><a class="lv-button" href="' + routes[state.project] + '">Continuer mon projet</a><a class="lv-text-link" href="/reprendre/">Reprendre une autre sauvegarde</a></div></header>';
    return true;
  }
  const active = state.context;
  if (state.regenerated && !memoryOnly && !saveContext(active)) memoryOnly = true;
  let displayed: Reading = active.reading!;
  const captures = new Map<string, ReturnType<typeof createDiagnosticCapture>>();
  root.classList.add('lv-simple-reading');
  function track(event: string) {
    window.dispatchEvent(new CustomEvent('levois:journey', { detail: { event, selected_journey: active.project } }));
  }
  function render() {
    const snapshot = { ...contextForReading(active, displayed), history: [] };
    if (!isProject(snapshot.project)) return;
    const journey = getDiagnosticJourney(snapshot.project);
    const resources = getDiagnosticResources(snapshot);
    const questions = journey.getQuestions(snapshot);

    const history = (active.history || []).filter(r => r.methodVersion === DIAGNOSTIC_METHOD_VERSION);
    const historical = displayed.id !== active.reading!.id;
    if (!captures.has(displayed.id)) {
      const reading = displayed;
      captures.set(reading.id, createDiagnosticCapture(snapshot, reading, () => {
        rememberDelivery(reading.id); track('synthesis_saved');
      }));
    }
    const bindCapture = captures.get(displayed.id)!;
    const correcting = questions.filter(q => Object.hasOwn(snapshot.answers, q.id)).map(q =>
      memoryOnly ? '<button type="button" class="lv-text-link" data-correct="' + e(q.id) + '">' + e(q.title) + '</button>'
      : '<a class="lv-text-link" href="' + routes[snapshot.project as DiagnosticProject] + '?edit=' + encodeURIComponent(q.id) + '">' + e(q.title) + '</a>',
    ).join('');
    // A useful first reading is available before any contact detail is requested.
    // Historical deliveryMode markers remain importable but no longer gate it.
    root.classList.remove('lv-capture-gate');
    root.innerHTML = '<header class="lv-synthesis-header"><p class="lv-overline">Votre projet, en clair</p><h1 tabindex="-1">' + e(displayed.title) +
      '</h1><p class="lv-intro">Voici ce qui ressort de vos réponses, et par où commencer.</p>' +
      (historical ? '<p class="lv-limit">Vous consultez une version conservée du ' + e(new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(displayed.generatedAt))) + '. Vos réponses actuelles restent inchangées.</p>' : '') +
      (memoryOnly ? '<p class="lv-limit">La sauvegarde de session est bloquée. Gardez une copie avant de quitter cette page.</p>' : '') + '</header>' +
      '<div class="lv-synthesis-cards">' + displayed.sections.map(section =>
        '<section class="lv-synthesis-card"><div><h2>' + e(section.title) +
        '</h2>' + section.items.map(item => '<p>' + e(item.text) + (item.condition ? ' ' + e(item.condition) : '') + '</p>').join('') + '</div></section>',
      ).join('') + '</div>' +
      '<p class="lv-note lv-synthesis-limit">' + displayed.limits.map(e).join(' ') + '</p>' +
      diagnosticNotesHTML(snapshot.humanNotes) +
      '<section class="lv-synthesis-contact" aria-labelledby="synthesis-contact-title"><div><p class="lv-overline">Quand vous en avez besoin</p>' +
      '<h2 id="synthesis-contact-title">Un point ensemble pour avancer.</h2><p>Vous pouvez parler de votre situation à Mouaad, même si votre projet est encore en réflexion.</p></div>' +
      '<div class="lv-contact-actions"><a class="lv-button" data-contact-call href="tel:' + site.phone + '">Échanger 15 min avec Mouaad (sans engagement)</a>' +
      '<a class="lv-text-link" href="/contact/">Je préfère lui écrire</a><span class="lv-note">' + site.phoneDisplay + '</span></div></section>' +
      '<section class="lv-synthesis-email" aria-labelledby="synthesis-email-title"><h2 id="synthesis-email-title">Recevoir cette synthèse par e-mail pour garder une trace</h2><p>Facultatif : votre synthèse reste disponible ici, sans laisser vos coordonnées.</p>' + captureFormHTML() + '</section>' +
      '<section class="lv-synthesis-resources" aria-labelledby="synthesis-resources-title"><h2 id="synthesis-resources-title">Deux lectures pour votre situation</h2><div>' +
      resources.map(r => '<a class="lv-resource-card" href="' + e(r.href) + '"><strong>' + e(r.label) + '</strong><span>' + e(r.detail) + '</span><span aria-hidden="true">↗</span></a>').join('') + '</div></section>' +
      '<div class="lv-synthesis-tools"><button class="lv-text-link" data-keep type="button">Télécharger une copie</button><button class="lv-text-link" data-print type="button">Imprimer</button><a class="lv-text-link" href="/reprendre/">Reprendre un projet</a></div>' +
      '<details id="corrections" class="lv-history"><summary>' + (historical ? 'Relire les réponses de cette version' : 'Relire ou corriger mes réponses') + '</summary><pre class="lv-preview">' + e(answersText(snapshot)) + '</pre>' +
      (historical ? '<p class="lv-note">Cette version est conservée telle quelle. Pour modifier vos réponses actuelles, revenez à la synthèse actuelle.</p><button class="lv-text-link" data-current type="button">Revenir à ma synthèse actuelle pour corriger</button>'
        : '<div class="lv-correction-links">' + correcting + '</div>') + '</details>' +
      (history.length ? '<details class="lv-history"><summary>Mes synthèses précédentes</summary>' + history.map((r, i) => '<button class="lv-text-link" data-history="' + i + '" type="button">Version du ' + e(new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(r.generatedAt))) + '</button>').join('') +
        '<button class="lv-text-link" data-current type="button">Revenir à ma synthèse actuelle</button></details>' : '');
    root.querySelector('[data-keep]')?.addEventListener('click', () => { keepReading(snapshot, displayed); track('reading_kept'); });
    root.querySelector('[data-print]')?.addEventListener('click', () => window.print());
    root.querySelector('[data-contact-call]')?.addEventListener('click', () => track('exchange_requested'));
    root.querySelectorAll<HTMLButtonElement>('[data-correct]').forEach(button => button.addEventListener('click', () => onCorrect?.(button.dataset.correct!)));
    root.querySelectorAll<HTMLButtonElement>('[data-history]').forEach(button => button.addEventListener('click', () => {
      displayed = history[Number(button.dataset.history)]; render(); root.querySelector<HTMLElement>('h1')?.focus();
    }));
    root.querySelectorAll('[data-current]').forEach(button => button.addEventListener('click', () => { displayed = active.reading!; render(); root.querySelector<HTMLElement>('h1')?.focus(); }));
    bindCapture(root);
    track('result_viewed');
  }
  render();
  return true;
}
