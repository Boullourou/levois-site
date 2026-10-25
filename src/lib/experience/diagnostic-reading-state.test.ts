import { describe, expect, it } from 'vitest';
import { createContext, setAnswer, contextForReading } from './context';
import { buyerJourney } from './buyer';
import { DIAGNOSTIC_METHOD_VERSION, getDiagnosticJourney, type DiagnosticProject } from './diagnostics';
import { diagnosticProgress, resolveDiagnosticReading } from './diagnostic-reading-state';
import type { Context } from './types';

const projects: DiagnosticProject[] = ['buyer', 'seller', 'transition'];
function completed(project: DiagnosticProject): Context {
  let context = createContext(project);
  for (const question of getDiagnosticJourney(project).getQuestions(context)) {
    context = setAnswer(context, question.id, question.choices![0].value);
  }
  return context;
}

describe('Diagnostic result routing and interrupted corrections', () => {
  it.each(projects)('%s keeps a partial diagnostic as a draft and identifies the next question', project => {
    const context = createContext(project);
    const questions = getDiagnosticJourney(project).getQuestions(context);
    const partial = setAnswer(context, questions[0].id, questions[0].choices![0].value);
    const before = structuredClone(partial);
    const state = resolveDiagnosticReading(partial);
    expect(state.kind).toBe('draft');
    if (state.kind !== 'draft') throw new Error('Expected draft');
    expect(state.answeredCount).toBe(1);
    expect(state.missingQuestionIds).toEqual(questions.slice(1).map(question => question.id));
    expect(state.context.reading).toBeUndefined();
    expect(partial).toEqual(before);
  });

  it.each(projects)('%s regenerates only a complete diagnostic after interruption', project => {
    const context = completed(project);
    const before = structuredClone(context);
    const state = resolveDiagnosticReading(context);
    expect(state.kind).toBe('ready');
    if (state.kind !== 'ready') throw new Error('Expected ready');
    expect(state.regenerated).toBe(true);
    expect(state.context.reading?.methodVersion).toBe(DIAGNOSTIC_METHOD_VERSION);
    expect(state.context.reading?.sections).toHaveLength(3);
    expect(state.context.reading?.answersSnapshot).toEqual(context.answers);
    expect(context).toEqual(before);
  });

  it('keeps the former snapshot intact when a completed correction has not yet regenerated its result', () => {
    const initial = completed('buyer');
    initial.reading = getDiagnosticJourney('buyer').buildReading(initial);
    const oldReading = structuredClone(initial.reading);
    const changed = setAnswer(initial, 'diag_buyer_blocker', 'tradeoff');
    expect(changed.reading).toBeUndefined();
    const state = resolveDiagnosticReading(changed);
    if (state.kind !== 'ready') throw new Error('Expected regenerated diagnostic');
    expect(state.context.reading?.methodVersion).toBe(DIAGNOSTIC_METHOD_VERSION);
    expect(state.context.reading?.revision).toBe(changed.revision);
    expect(state.context.reading?.sections).not.toEqual(oldReading.sections);
    expect(state.context.history).toEqual(changed.history);
    expect(contextForReading(state.context, changed.history![0]).answers.diag_buyer_blocker.value)
      .toBe(oldReading.answersSnapshot!.diag_buyer_blocker.value);
    expect(initial.reading).toEqual(oldReading);
  });

  it('accepts an explicit unknown choice, but not missing, invalid or cross-project values', () => {
    let context = completed('seller');
    for (const question of getDiagnosticJourney('seller').getQuestions(context)) context = setAnswer(context, question.id, 'unknown');
    expect(diagnosticProgress(context)?.missingQuestionIds).toEqual([]);
    expect(resolveDiagnosticReading(context).kind).toBe('ready');
    for (const value of [null, '', 1, ['unknown'], 'obsolete-value']) {
      const invalid = setAnswer(context, 'diag_seller_reason', value);
      expect(diagnosticProgress(invalid)?.missingQuestionIds).toEqual(['diag_seller_reason']);
      expect(resolveDiagnosticReading(invalid).kind).toBe('draft');
    }
    const otherProject = { ...context, project: 'buyer' as const };
    expect(diagnosticProgress(otherProject)?.answeredCount).toBe(0);
    expect(resolveDiagnosticReading(otherProject).kind).toBe('draft');
  });

  it('does not replace a saved result or migrate a legacy result just because new answers coexist', () => {
    const context = completed('buyer');
    context.reading = getDiagnosticJourney('buyer').buildReading(context);
    const state = resolveDiagnosticReading(context);
    expect(state.kind).toBe('ready');
    if (state.kind !== 'ready') throw new Error('Expected saved reading');
    expect(state.regenerated).toBe(false);
    expect(state.context.reading).toBe(context.reading);
    context.reading = buyerJourney.buildReading(context);
    const historical = structuredClone(context);
    expect(resolveDiagnosticReading(context).kind).toBe('legacy');
    expect(context).toEqual(historical);
  });

  it('leaves legacy-only contexts and other tools to their renderer, while an empty diagnostic remains a draft', () => {
    const legacy = setAnswer(createContext('buyer'), 'buyer_goal', 'quiet');
    expect(resolveDiagnosticReading(legacy).kind).toBe('legacy');
    expect(resolveDiagnosticReading(createContext('local')).kind).toBe('legacy');
    expect(resolveDiagnosticReading(createContext('audit')).kind).toBe('legacy');
    expect(resolveDiagnosticReading(createContext('buyer')).kind).toBe('draft');
  });
});
