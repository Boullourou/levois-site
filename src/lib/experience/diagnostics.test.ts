import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resources } from '../../data/resources';
import { parseContext, parseReading, setAnswer } from './context';
import { DIAGNOSTIC_METHOD_VERSION, diagnosticAnswerLabels, getDiagnosticJourney, getDiagnosticResources, type DiagnosticProject } from './diagnostics';
import type { AnswerValue, Context } from './types';

const projects: DiagnosticProject[] = ['buyer', 'seller', 'transition'];
const date = '2026-10-25T16:00:00.000Z';
function context(project: Context['project'], values: Record<string, AnswerValue> = {}): Context {
  return {
    schemaVersion: 1, id: 'diagnostic-test', revision: 1, project, entry: { door: 'direct', source: null, promise: null }, createdAt: date, updatedAt: date,
    answers: Object.fromEntries(Object.entries(values).map(([id, value]) => [id, { value, provenance: 'declared', updatedAt: date, revision: 1 }])),
  };
}
function readingText(ctx: Context) { return JSON.stringify(getDiagnosticJourney(ctx.project as DiagnosticProject).buildReading(ctx)); }

describe('Five concrete questions, independent of depth and former answers', () => {
  it.each(projects)('%s remains five questions for every individual choice and depth', project => {
    const journey = getDiagnosticJourney(project);
    const baseline = journey.getQuestions(context(project));
    expect(baseline).toHaveLength(5);
    expect(new Set(baseline.map(question => question.id)).size).toBe(5);
    for (const question of baseline) {
      expect(question.id).toMatch(new RegExp(`^diag_${project}_`));
      expect(question.type).toBe('choice');
      expect(question.choices?.at(-1)).toEqual({ value: 'unknown', label: 'Je ne sais pas encore' });
      expect(diagnosticAnswerLabels[question.id]).toBe(question.title);
      for (const option of question.choices!) {
        for (const depth of ['micro', 'intermediate', 'deep'] as const) {
          const ctx = { ...context(project, { [question.id]: option.value, buyer_goal: 'space', seller_situation: 'visites', transition_scenario: 'buy_first' }), depth };
          expect(journey.getQuestions(ctx)).toEqual(baseline);
        }
      }
    }
    expect(baseline.map(question => question.title).join(' ')).not.toMatch(/appui|matrice|point.*ouvert|email|téléphone|adresse/i);
  });

  it.each(projects)('%s has three short sections, a weekly action, and two real resources for every blocker', project => {
    const journey = getDiagnosticJourney(project);
    const relevant = journey.getQuestions(context(project)).find(question => /_blocker$|_fear$/.test(question.id))!;
    for (const option of relevant.choices!) {
      const ctx = context(project, { [relevant.id]: option.value });
      const reading = journey.buildReading(ctx);
      expect(reading.sections.map(section => section.title)).toEqual(['Le constat', 'L’angle mort à surveiller', 'La prochaine étape utile']);
      expect(reading.sections.every(section => section.items.length === 1 && section.items[0].text.length < 650)).toBe(true);
      expect(reading.sections[2].items[0].text).toMatch(/^Cette semaine,/);
      expect(reading.methodVersion).toBe(DIAGNOSTIC_METHOD_VERSION);
      expect(parseReading(reading)).not.toBeNull();
      expect(reading.sections.flatMap(section => section.items).some(item => ['verified', 'data', 'solid'].includes(item.kind))).toBe(false);
      const links = getDiagnosticResources(ctx);
      expect(links).toHaveLength(2);
      expect(new Set(links.map(link => link.href)).size).toBe(2);
      for (const link of links) {
        expect(link.label.length).toBeGreaterThan(5);
        expect(link.detail.length).toBeGreaterThan(15);
        const slug = link.href.match(/^\/ressources\/([^/]+)\/$/)?.[1];
        if (slug) expect(resources.some(resource => resource.slug === slug)).toBe(true);
        else expect(existsSync(new URL(`../../pages${link.href.slice(0, -1)}.astro`, import.meta.url))).toBe(true);
      }
    }
  });

  it.each(projects)('%s is useful without answers and ignores malformed imported choice values', project => {
    const journey = getDiagnosticJourney(project);
    const empty = context(project);
    const invalid = context(project, Object.fromEntries(journey.getQuestions(empty).map(question => [question.id, '<script>untrusted</script>'])));
    expect(journey.buildReading(invalid).sections).toEqual(journey.buildReading(empty).sections);
    expect(getDiagnosticResources(invalid)).toEqual(getDiagnosticResources(empty));
    const unknown = context(project, Object.fromEntries(journey.getQuestions(empty).map(question => [question.id, 'unknown'])));
    expect(journey.buildReading(unknown).sections).toEqual(journey.buildReading(empty).sections);
    expect(journey.buildReading(unknown).sections[0].items[0].kind).toBe('unknown');
  });

  it.each(projects)('%s cannot expand beyond five questions for any complete combination', project => {
    const journey = getDiagnosticJourney(project);
    const baseline = journey.getQuestions(context(project));
    let combinations = 0;
    function visit(index: number, values: Record<string, AnswerValue>) {
      if (index === baseline.length) {
        const ctx = context(project, values);
        const actual = journey.getQuestions(ctx);
        // Validate the whole route, not only the first step, for every combination.
        if (actual.length !== 5 || actual.some((question, position) => question.id !== baseline[position].id)) {
          throw new Error(`Diagnostic expanded for ${JSON.stringify(values)}`);
        }
        const reading = journey.buildReading(ctx);
        const links = getDiagnosticResources(ctx);
        if (reading.sections.length !== 3 || reading.sections.some(section => section.items.length !== 1 || section.items[0].text.length > 650)
          || links.length !== 2 || links[0].href === links[1].href) {
          throw new Error(`Invalid result for ${JSON.stringify(values)}`);
        }
        combinations++;
        return;
      }
      for (const option of baseline[index].choices!) visit(index + 1, { ...values, [baseline[index].id]: option.value });
    }
    visit(0, {});
    expect(combinations).toBe(baseline.reduce((total, question) => total * question.choices!.length, 1));
    expect(combinations).toBeGreaterThan(1000);
  });
});

describe('Advice fits the expressed concern and never invents validation', () => {
  it('helps understand visits without recommending an automatic price reduction', () => {
    const ctx = context('seller', { diag_seller_blocker: 'no_offer' });
    expect(readingText(ctx)).toContain('objections précises');
    expect(getDiagnosticResources(ctx)[0].href).toBe('/ressources/retours-de-visite/');
    expect(getDiagnosticJourney('seller').buildReading(ctx).nextDecision.text).toContain('avant de changer le prix');
  });
  it('separates weak contact volume from an assumed price problem', () => {
    const ctx = context('seller', { diag_seller_blocker: 'no_contacts' });
    expect(readingText(ctx)).toContain('ne prouve pas que le prix est la seule cause');
    expect(getDiagnosticResources(ctx)[0].href).toBe('/ressources/annonce-vue-peu-de-contacts/');
  });
  it('uses the desired next help when a seller has no precise blocker', () => {
    const ctx = context('seller', { diag_seller_blocker: 'none', diag_seller_need: 'options' });
    expect(getDiagnosticJourney('seller').buildReading(ctx).nextDecision.text).toContain('comparez vendre, attendre et garder');
  });
  it('respects an existing offer and succession without giving a legal decision', () => {
    const ctx = context('seller', { diag_seller_reason: 'inherited', diag_seller_stage: 'offer', diag_seller_blocker: 'price', diag_seller_timing: 'fixed' });
    expect(readingText(ctx)).toContain('faites préciser au notaire');
    expect(getDiagnosticJourney('seller').buildReading(ctx).nextDecision.text).toContain('l’offre reçue');
    expect(readingText(ctx)).toContain('ne garantit pas le délai de vente');
  });
  it('turns a surface/sector tradeoff into a comparison rather than an imposed concession', () => {
    const ctx = context('buyer', { diag_buyer_blocker: 'tradeoff', diag_buyer_priority: 'location' });
    expect(readingText(ctx)).toContain('Gardez vos critères');
    expect(readingText(ctx)).toContain('vos trajets et votre quartier');
    expect(getDiagnosticResources(ctx)[0].detail).toContain('secteur ou à la surface');
  });
  it.each(['buyer', 'transition'] as const)('never treats %s financing studied as an unconditional approval', project => {
    const ctx = context(project, { [`diag_${project}_financing`]: 'reviewed' });
    const text = readingText(ctx);
    expect(text).toContain('que vous déclarez');
    expect(text).toContain('ne valide aucun financement');
    expect(text).not.toContain('financement validé');
  });
  it('does not assume a temporary home is acceptable to a buyer/seller', () => {
    const ctx = context('transition', { diag_transition_fear: 'gap', diag_transition_flexibility: 'no_temporary' });
    const reading = getDiagnosticJourney('transition').buildReading(ctx);
    expect(reading.sections[0].items[0].text).toContain('ne souhaitez pas de logement temporaire');
    expect(reading.nextDecision.text).toContain('votre refus');
    expect(reading.nextDecision.text).not.toContain('où vous pourriez vivre');
  });
  it('makes bridge-loan concerns a comparison to discuss with the bank', () => {
    const ctx = context('transition', { diag_transition_fear: 'bridge' });
    expect(readingText(ctx)).toContain('ni valider un prêt relais');
    expect(getDiagnosticJourney('transition').buildReading(ctx).nextDecision.text).toContain('si la vente prend du retard');
  });
  it('prioritizes existing commitments over starting a new plan', () => {
    const ctx = context('transition', { diag_transition_fear: 'gap', diag_transition_stage: 'engaged' });
    expect(getDiagnosticJourney('transition').buildReading(ctx).nextDecision.text).toContain('offres ou compromis déjà en cours');
  });
  it('keeps former answers and reading snapshots untouched when a diagnostic answer changes', () => {
    const initial = context('buyer', { buyer_goal: 'quiet', diag_buyer_blocker: 'budget' });
    initial.reading = getDiagnosticJourney('buyer').buildReading(initial);
    const oldReading = structuredClone(initial.reading);
    const changed = setAnswer(initial, 'diag_buyer_blocker', 'tradeoff');
    expect(changed.answers.buyer_goal.value).toBe('quiet');
    expect(changed.history?.[0].methodVersion).toBe(DIAGNOSTIC_METHOD_VERSION);
    expect(initial.reading).toEqual(oldReading);
    expect(getDiagnosticJourney('buyer').buildReading(changed).sections).not.toEqual(oldReading.sections);
    expect(parseContext(JSON.parse(JSON.stringify({ ...changed, reading: getDiagnosticJourney('buyer').buildReading(changed) })))).not.toBeNull();
  });

  it('captures project, answers, multiple-choice values and human notes independently', () => {
    const ctx = context('transition', { diag_transition_fear: 'gap', buyer_uses: ['quiet', 'work'] });
    ctx.humanNotes = [{ id: 'note-001', author: 'Mouaad', text: 'Point à revoir ensemble.', createdAt: date }];
    const reading = getDiagnosticJourney('transition').buildReading(ctx);
    expect(reading.projectSnapshot).toBe('transition');
    ctx.answers.diag_transition_fear.value = 'bridge';
    (ctx.answers.buyer_uses.value as string[]).push('outdoors');
    ctx.humanNotes[0].text = 'Autre note.';
    expect(reading.answersSnapshot?.diag_transition_fear.value).toBe('gap');
    expect(reading.answersSnapshot?.buyer_uses.value).toEqual(['quiet', 'work']);
    expect(reading.humanNotesSnapshot?.[0].text).toBe('Point à revoir ensemble.');
    expect(parseReading(reading)).not.toBeNull();
  });
});
