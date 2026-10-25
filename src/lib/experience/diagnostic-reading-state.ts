import { DIAGNOSTIC_METHOD_VERSION, getDiagnosticJourney, type DiagnosticProject } from './diagnostics';
import type { Context } from './types';

export function isDiagnosticProject(project: Context['project']): project is DiagnosticProject {
  return project === 'buyer' || project === 'seller' || project === 'transition';
}

/** A saved key alone does not make an imported answer valid. Unknown is a real choice. */
export function diagnosticProgress(context: Context) {
  if (!isDiagnosticProject(context.project)) return null;
  const questions = getDiagnosticJourney(context.project).getQuestions(context);
  const missingQuestionIds = questions.filter(question => {
    const value = context.answers[question.id]?.value;
    return typeof value !== 'string' || !question.choices?.some(choice => choice.value === value);
  }).map(question => question.id);
  return { questionCount: questions.length, answeredCount: questions.length - missingQuestionIds.length, missingQuestionIds };
}

type DiagnosticReadingState =
  | { kind: 'legacy' }
  | { kind: 'draft'; context: Context; project: DiagnosticProject; questionCount: number; answeredCount: number; missingQuestionIds: string[] }
  | { kind: 'ready'; context: Context; regenerated: boolean };

/** Resolve before the legacy renderer can mistake diagnostic answers for an old journey. */
export function resolveDiagnosticReading(context: Context): DiagnosticReadingState {
  if (!isDiagnosticProject(context.project)) return { kind: 'legacy' };
  if (context.reading) {
    // An imported or historical reading keeps the method that actually produced it.
    return context.reading.methodVersion === DIAGNOSTIC_METHOD_VERSION
      ? { kind: 'ready', context, regenerated: false }
      : { kind: 'legacy' };
  }
  const keys = Object.keys(context.answers);
  const diagnosticContext = keys.length === 0 || keys.some(key => key.startsWith('diag_'))
    || context.history?.some(reading => reading.methodVersion === DIAGNOSTIC_METHOD_VERSION);
  if (!diagnosticContext) return { kind: 'legacy' };
  const progress = diagnosticProgress(context)!;
  if (progress.missingQuestionIds.length) return { kind: 'draft', context, project: context.project, ...progress };
  return {
    kind: 'ready', regenerated: true,
    context: { ...context, reading: getDiagnosticJourney(context.project).buildReading(context) },
  };
}
