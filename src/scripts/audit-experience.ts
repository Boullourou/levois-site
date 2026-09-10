import { requestJson } from '../lib/request-json';
import { readContext, saveContext, setAnswer, escapeHtml as esc, textReading } from '../lib/experience/context';
import { keepReading } from '../lib/experience/export';
import { auditContextQuestion, auditDurations, auditSignals, accessLabels, auditComplete, buildAuditResult, classifyAuditResponse, contextWithAudit, manualAuditPage, sellerAnswersFromAudit, type AuditAnswers, type AuditPage, type AuditDuration, type AuditSignal, type AuditResult } from '../lib/experience/audit';
import type { Context } from '../lib/experience/types';

const form = document.querySelector<HTMLFormElement>('[data-url-form]')!;
const input = document.querySelector<HTMLInputElement>('#listing-url')!;
const urlStatus = document.querySelector<HTMLElement>('[data-url-status]')!;
const opening = document.querySelector<HTMLElement>('[data-audit-opening]')!;
const output = document.querySelector<HTMLElement>('[data-audit-output]')!;
const DRAFT_KEY = 'levois:audit:draft:v2';
const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
let context = readContext('audit');
let page: AuditPage | null = null;
let answers: AuditAnswers = { duration: null, signal: null, context: null };
let step: 1 | 2 | 3 | 4 = 1;
let result: AuditResult | null = null;
let requestNumber = 0;
let pending: AbortController | null = null;
let saved = true;

const behavior = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' as const : 'smooth' as const;
function focusOutput(selector: string) { output.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true }); output.scrollIntoView({ block: 'start', behavior: behavior() }); }
function notify(message: string) { const status = output.querySelector<HTMLElement>('[data-audit-status]'); if (status) status.textContent = message; }
function writeDraft() {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 2, page, answers, step })); } catch { saved = false; }
}
function loadDraft(): boolean {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw || raw.length > 20000) return false;
    const d = JSON.parse(raw);
    if (d?.version !== 2 || !d.page || !d.answers || ![1, 2, 3, 4].includes(d.step) || !Object.hasOwn(accessLabels, d.page.access) || typeof d.page.snapshot?.url !== 'string' || d.page.snapshot.url.length > 2000 || typeof d.page.readAt !== 'string' || !Number.isFinite(Date.parse(d.page.readAt))) return false;
    if (d.page.snapshot.url) { const u = new URL(d.page.snapshot.url); if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password) return false; }
    if (d.answers.duration !== null && !auditDurations.some(o => o.value === d.answers.duration) || d.answers.signal !== null && !auditSignals.some(o => o.value === d.answers.signal) || d.answers.context !== null && !auditContextQuestion(d.answers.signal).options.some(o => o.value === d.answers.context)) return false;
    const recovered = d.page.access === 'readable' ? classifyAuditResponse(200, { ok: true, snapshot: d.page.snapshot }, d.page.snapshot.url, d.page.readAt) : null;
    page = recovered?.kind === 'ready' ? recovered.page : { ...manualAuditPage(d.page.snapshot.url), access: d.page.access, readAt: d.page.readAt, message: typeof d.page.message === 'string' ? d.page.message.slice(0, 1000) : 'Lecture reprise dans cette session.' };
    answers = { duration: d.answers.duration, signal: d.answers.signal, context: d.answers.context };
    step = d.step === 4 && !auditComplete(answers) ? 1 : d.step;
    input.value = page.snapshot.url;
    return true;
  } catch { return false; }
}
function stopRequest() { requestNumber++; pending?.abort(); pending = null; setLoading(false); }
function setLoading(active: boolean) {
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  button.disabled = active; input.disabled = active;
  button.innerHTML = active ? 'Lecture de la page…' : `Lire le lien de l’annonce ${arrow}`;
  form.setAttribute('aria-busy', String(active));
}
function showEntry() {
  stopRequest(); opening.hidden = false; output.hidden = true; output.innerHTML = ''; input.focus();
  opening.scrollIntoView({ behavior: behavior(), block: 'start' });
}
function begin(nextPage: AuditPage) {
  page = nextPage; answers = { duration: null, signal: null, context: null }; step = 1; result = null;
  context = { ...context, project: 'audit' };
  context = setAnswer(context, 'audit_url', page.snapshot.url || null, { audit_url: ['audit_duration', 'audit_signal', 'audit_context'] });
  // A new extraction always invalidates the former audit, including when the URL is unchanged.
  context = setAnswer(context, 'audit_read_at', page.readAt);
  for (const id of ['audit_duration', 'audit_signal', 'audit_context']) context = setAnswer(context, id, null);
  saved = saveContext(context); writeDraft(); renderStep();
}
function accessMarkup() {
  return `<aside class="audit-status-side"><h2>${esc(accessLabels[page!.access])}</h2><p>${esc(page!.message)}</p>${page!.snapshot.url ? `<p class="lv-note audit-source-link">Lien utilisé : ${esc(page!.snapshot.url)}</p>` : ''}<button class="lv-text-link" type="button" data-audit-link>Modifier le lien ou réessayer</button></aside>`;
}
function impactText(): { title: string; text: string; limit: string } {
  if (step === 1) return answers.duration === 'unknown' ? { title: 'La période reste à retrouver', text: 'La date de publication et les interruptions aideront à lire les réactions. Vous pouvez poursuivre sans inventer une durée.', limit: 'La période inconnue ne devient pas une publication récente.' } : { title: answers.duration === 'moins-7' ? 'Un lancement récent ne se juge pas au silence' : 'Comparer des périodes, pas seulement des totaux', text: answers.duration === 'moins-7' ? 'Le peu de recul invite à noter les observations avant d’attribuer une cause à une absence de réaction.' : 'Les vues, demandes et visites doivent être rapportées à une même période et aux changements intervenus.', limit: 'Aucune durée ne permet, seule, de déterminer un prix ou la cause d’un blocage.' };
  if (step === 2) {
    const messages: Record<AuditSignal, [string, string]> = {
      'peu-vues': ['Vérifier ce qui est visible', 'Avant de relire les réactions, il faut savoir où l’annonce apparaît et sur quelle période les vues sont comptées.'],
      'vues-sans-contact': ['Regarder entre la vue et la demande', 'Les consultations et les contacts ne disent pas la même chose. Présentation, informations et positionnement sont des pistes distinctes.'],
      'contacts-sans-visite': ['Préciser ce que les échanges changent', 'La question utile est ce que les personnes apprennent ou ne comprennent pas avant de décider une visite.'],
      'visites-sans-offre': ['Recueillir ce qui a retenu la décision', 'Le nombre de visites ne remplace pas un retour concret sur ce qui a empêché de poursuivre.'],
      'offre-recue': ['Passer de la réaction aux conditions', 'Une offre se lit avec ses conditions et son calendrier, pas seulement avec son montant.'],
      unknown: ['L’inconnu devient un point de départ', 'Retrouver des observations est déjà une action utile ; aucune étape de blocage n’est présumée.'],
    };
    const [title, text] = messages[answers.signal ?? 'unknown'];
    return { title, text, limit: 'Il s’agit de votre observation déclarée. Elle ne prouve pas encore une cause.' };
  }
  if (page && auditComplete(answers)) {
    const next = buildAuditResult(page, answers, context);
    return { title: 'Ce que cette réponse fait regarder', text: next.analysis.tips[1].action, limit: next.analysis.limit };
  }
  return { title: 'Un point ouvert peut être utile', text: 'Vous pouvez indiquer que vous ne savez pas encore. La lecture gardera cette limite visible.', limit: 'Aucune réponse ne déclenche de demande de contact.' };
}
function renderImpact() {
  const box = output.querySelector<HTMLElement>('[data-audit-impact]');
  if (!box) return;
  const answer = step === 1 ? answers.duration : step === 2 ? answers.signal : answers.context;
  box.hidden = !answer;
  if (answer) { const i = impactText(); box.innerHTML = `<h2>${esc(i.title)}</h2><p>${esc(i.text)}</p><p class="lv-limit">${esc(i.limit)}</p>`; }
}
function renderStep() {
  if (!page) return;
  opening.hidden = true; output.hidden = false;
  const q = step === 1 ? { question: 'Depuis combien de temps l’annonce est-elle publiée ?', options: auditDurations } : step === 2 ? { question: 'Que se passe-t-il aujourd’hui ?', options: auditSignals } : auditContextQuestion(answers.signal);
  const selected = step === 1 ? answers.duration : step === 2 ? answers.signal : answers.context;
  output.innerHTML = `<div class="audit-work-grid">${accessMarkup()}<div><div class="audit-step-head"><span>Votre annonce</span><span>Question ${step} sur 3</span></div><div class="lv-progress" aria-hidden="true"><i style="width:${Number(step) / 3 * 100}%"></i></div><form class="audit-form" data-audit-question><fieldset aria-labelledby="audit-question"><h1 id="audit-question" tabindex="-1">${esc(q.question)}</h1><div class="lv-choices">${q.options.map(o => `<label class="lv-choice"><input type="radio" name="audit-answer" value="${esc(o.value)}" ${o.value === selected ? 'checked' : ''} required><span>${esc(o.label)}</span></label>`).join('')}</div></fieldset><div class="lv-impact audit-impact" data-audit-impact tabindex="-1" aria-live="polite" hidden></div><div class="lv-actions"><button class="lv-button" type="submit">${step === 3 ? 'Voir mes deux actions' : 'Continuer'}${arrow}</button>${step > 1 ? '<button class="lv-secondary" type="button" data-audit-back>Revenir et corriger</button>' : ''}</div><p class="audit-live-status" data-audit-status role="status">${saved ? '' : 'La conservation dans la session est indisponible. Vous pourrez copier ou télécharger le résultat.'}</p></form></div></div>`;
  const currentStep = step;
  output.querySelector<HTMLFormElement>('[data-audit-question]')!.addEventListener('change', event => {
    const radio = (event.target as HTMLElement).closest<HTMLInputElement>('input[type=radio]');
    if (!radio) return;
    if (currentStep === 1) { answers.duration = radio.value as AuditDuration; context = setAnswer(context, 'audit_duration', answers.duration); }
    else if (currentStep === 2) { if (answers.signal !== radio.value) answers.context = null; answers.signal = radio.value as AuditSignal; context = setAnswer(context, 'audit_signal', answers.signal, { audit_signal: ['audit_context'] }); }
    else { answers.context = radio.value; context = setAnswer(context, 'audit_context', answers.context); }
    result = null; saved = saveContext(context); writeDraft(); renderImpact();
  });
  output.querySelector<HTMLFormElement>('[data-audit-question]')!.addEventListener('submit', event => {
    event.preventDefault();
    if (!(event.currentTarget as HTMLFormElement).reportValidity()) return;
    if (currentStep === 3) showResult(); else { step = (currentStep + 1) as 2 | 3; writeDraft(); renderStep(); }
  });
  renderImpact(); focusOutput('#audit-question');
}
function showResult() {
  if (!page || !auditComplete(answers)) { step = 1; renderStep(); return; }
  context = contextWithAudit(context, page, answers); result = buildAuditResult(page, answers, context);
  saved = saveContext(context); step = 4; writeDraft(); opening.hidden = true; output.hidden = false;
  const { analysis, resource } = result;
  const resourceLink = resource.href.startsWith('/ressources/') ? `<a class="audit-resource" href="${esc(resource.href)}"><strong>${esc(resource.label)} ↗</strong><span>${esc(resource.description)}</span></a>` : '';
  output.innerHTML = `<header class="audit-result-head"><h1 tabindex="-1" id="audit-result-title">${esc(analysis.title)}</h1><p class="lv-intro">${esc(analysis.summary)}</p><p class="lv-note">Deux pistes · lecture ${context.revision} · ${esc(new Date(context.updatedAt).toLocaleDateString('fr-FR'))}</p><div class="audit-tools"><button class="lv-text-link" type="button" data-audit-correct>Modifier mes réponses</button><button class="lv-text-link" type="button" data-audit-restart>Auditer un autre lien</button></div></header><div class="audit-work-grid audit-result-grid"><div><ol class="audit-actions-list">${analysis.tips.map((tip, i) => `<li><span class="audit-action-index" aria-hidden="true">${i + 1}</span><div class="audit-action-body"><h2>${esc(tip.title)}</h2><p>${esc(tip.action)}</p><p class="lv-note"><strong>Piste à confronter aux faits.</strong> ${esc(tip.observation)}</p></div></li>`).join('')}</ol><p class="lv-limit">${esc(analysis.limit)}</p><div class="audit-evidence"><details><summary>Pourquoi ces deux pistes ?</summary><ul>${analysis.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul><p class="lv-note">Une information non détectée n’est pas nécessairement absente de l’annonce.</p></details></div></div><aside class="audit-result-side"><h2>Ce qui est plus clair<br/>vous appartient.</h2><p>Gardez les deux actions avec leurs limites, ou reprenez-les dans votre situation de vente.</p><div class="lv-actions"><button class="lv-button" type="button" data-audit-download>Garder cette lecture ${arrow}</button><a class="lv-secondary" data-audit-reading href="/lecture">Ouvrir ma lecture et choisir la suite ${arrow}</a></div><div class="audit-tools"><button class="lv-text-link" type="button" data-audit-copy>Copier la lecture</button><button class="lv-text-link" type="button" data-audit-print>Imprimer</button></div><p class="audit-live-status" data-audit-status role="status">${saved ? 'Lecture disponible dans cette session. Aucun envoi n’a été effectué.' : 'La session ne peut pas conserver la lecture. Copiez-la ou téléchargez-la pour la garder.'}</p>${resourceLink}<button class="lv-text-link" type="button" data-audit-seller>Reprendre ces éléments dans ma vente ${arrow}</button><p class="lv-note">La lecture commune permet ensuite de choisir séparément une copie sans appel, une relecture écrite ciblée ou un échange avec Mouaad.</p><div class="lv-field audit-copy-fallback" data-copy-fallback hidden><label for="audit-copy-text">Lecture à copier</label><textarea id="audit-copy-text" readonly></textarea></div></aside></div>`;
  focusOutput('#audit-result-title');
}

output.addEventListener('click', async event => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('button,a');
  if (!target) return;
  if (target.hasAttribute('data-audit-link')) { showEntry(); return; }
  if (target.hasAttribute('data-audit-back')) { step = Math.max(1, step - 1) as 1 | 2; writeDraft(); renderStep(); return; }
  if (target.hasAttribute('data-audit-correct')) { step = 1; writeDraft(); renderStep(); return; }
  if (target.hasAttribute('data-audit-restart')) { showEntry(); input.value = ''; return; }
  if (!result) return;
  if (target.hasAttribute('data-audit-reading')) { if (!saveContext(context)) { event.preventDefault(); notify('Le navigateur ne peut pas conserver cette lecture entre les pages. Gardez-la par copie ou téléchargement.'); } return; }
  if (target.hasAttribute('data-audit-print')) { output.querySelectorAll('details').forEach(d => d.open = true); window.print(); return; }
  if (target.hasAttribute('data-audit-download')) {
    keepReading(context, result.reading);
    notify('Le téléchargement du fichier HTML réimportable a été lancé, avec les réponses, leurs sources et les limites. Aucun envoi n’a été effectué.'); return;
  }
  if (target.hasAttribute('data-audit-copy')) {
    const text = textReading(result.reading);
    try { await navigator.clipboard.writeText(text); notify('Lecture copiée avec ses sources et limites. Aucun envoi n’a été effectué.'); }
    catch { const box = output.querySelector<HTMLElement>('[data-copy-fallback]')!; const area = box.querySelector<HTMLTextAreaElement>('textarea')!; box.hidden = false; area.value = text; area.focus(); area.select(); notify('La copie automatique est indisponible. Le texte est sélectionné pour une copie manuelle.'); }
    return;
  }
  if (target.hasAttribute('data-audit-seller')) {
    const initial = sellerAnswersFromAudit(answers);
    let next: Context = { ...context, project: 'seller' };
    const oldIds = Object.keys(next.answers).filter(id => id.startsWith('seller_') && id !== 'seller_apres_vente');
    next = setAnswer(next, 'seller_situation', initial.seller_situation || 'unknown', { seller_situation: oldIds });
    for (const [id, value] of Object.entries(initial)) { next = setAnswer(next, id, value); next.answers[id] = { ...next.answers[id], provenance: 'imported' }; }
    if (saveContext(next)) location.href = '/situer-ma-vente'; else notify('La reprise entre pages est indisponible dans ce navigateur. Gardez votre lecture pour reprendre les éléments.');
  }
});

form.addEventListener('submit', async event => {
  event.preventDefault(); if (!form.reportValidity()) return;
  let url: URL;
  try { url = new URL(input.value.trim()); if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error(); }
  catch { urlStatus.hidden = false; urlStatus.textContent = 'Indiquez un lien public http ou https, sans identifiant ni mot de passe.'; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
  input.removeAttribute('aria-invalid'); urlStatus.hidden = true;
  stopRequest(); const thisRequest = ++requestNumber; pending = new AbortController(); setLoading(true);
  try {
    const { response, data } = await requestJson('/api/audit-url/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: url.toString() }), signal: pending.signal }, 16000);
    if (thisRequest !== requestNumber) return;
    const classified = classifyAuditResponse(response.status, data, url.toString());
    if (classified.kind === 'ready') begin(classified.page);
    else { urlStatus.hidden = false; urlStatus.textContent = classified.message; input.setAttribute('aria-invalid', 'true'); }
  } catch {
    if (thisRequest === requestNumber) begin(manualAuditPage(url.toString(), 'transport'));
  } finally { if (thisRequest === requestNumber) { pending = null; setLoading(false); } }
});
document.querySelector('[data-manual]')?.addEventListener('click', () => {
  stopRequest(); let publicUrl = '';
  try { const u = new URL(input.value.trim()); if (['https:', 'http:'].includes(u.protocol) && !u.username && !u.password) publicUrl = u.toString(); } catch {}
  begin(manualAuditPage(publicUrl));
});
if (loadDraft()) {
  document.querySelector<HTMLElement>('[data-resume]')!.hidden = false;
  document.querySelector('[data-resume-audit]')?.addEventListener('click', () => { if (step === 4) showResult(); else renderStep(); });
}
