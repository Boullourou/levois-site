import { situations, getSituation } from '../legacy/seller-v1/situations';
import { computeResult } from '../legacy/seller-v1/engine';
import type { ComputedResult } from '../legacy/seller-v1/types';
import type { Reading } from './types';

export const LEGACY_SELLER_BASE = '52c92ca64ca22606272ae9dd933b5706f4301842';
export const LEGACY_SELLER_NOTICE = 'Cette lecture est reconstruite avec les questions et le moteur du 9 septembre 2026. Le lien ne contient pas de version historique : il ne permet pas de certifier le texte affiché avant cette date.';
export const sellerQuestionId = (situationId: string, questionId: string): string => `seller_${situationId.replaceAll('-', '_')}_${questionId.replaceAll('-', '_')}`;

export interface LegacySellerResult {
  kind: 'result';
  code: string;
  situationId: string;
  /** Original values, decoded exclusively against the immutable v1 option order. */
  answers: Record<string, string>;
  /** Values to import into a NEW/current context, with provenance 'imported'. Never merge with another session silently. */
  initialAnswers: Record<string, string>;
  result: ComputedResult;
  reading: Reading;
}
export type LegacySellerParse = LegacySellerResult
  | { kind: 'situation'; situationId: string; initialAnswers: Record<string, string> }
  | { kind: 'invalid'; reason: string }
  | { kind: 'none' };

/**
 * Pure URL adapter. r is authoritative when present: invalid r never falls back
 * to s or to storage. s accepts the five historical IDs and their five slugs.
 * q is the old Votre rue address parameter, NOT a seller answer, and is ignored.
 * No browser storage or network is read; a fresh session decodes the same result.
 */
export function parseLegacySeller(search: URLSearchParams): LegacySellerParse {
  if (search.has('r')) {
    const code = search.get('r') ?? '';
    const [sid, ...indices] = code.split('.');
    const situation = getSituation(sid);
    if (!situation || indices.length !== situation.questions.length) return { kind: 'invalid', reason: 'Le code de cette ancienne lecture est incomplet ou inconnu. Vous pouvez repartir de votre situation.' };
    const answers: Record<string, string> = {};
    for (let i = 0; i < situation.questions.length; i++) {
      const index = /^\d+$/.test(indices[i]) ? Number(indices[i]) : NaN;
      const option = situation.questions[i].options[index];
      if (!option) return { kind: 'invalid', reason: 'Une réponse du lien ne correspond pas au questionnaire conservé. Aucune autre session n’a été utilisée.' };
      answers[situation.questions[i].id] = option.value;
    }
    const initialAnswers: Record<string, string> = { seller_situation: situation.id };
    for (const [id, answer] of Object.entries(answers)) initialAnswers[sellerQuestionId(situation.id, id)] = answer;
    const result = computeResult(situation, answers);
    const decoded = { code, situationId: situation.id, result };
    return { kind: 'result', ...decoded, answers, initialAnswers, reading: legacyReading(decoded) };
  }
  const s = search.get('s');
  if (!s) return { kind: 'none' };
  const situation = situations.find(item => item.id === s || item.slug === s);
  return situation
    ? { kind: 'situation', situationId: situation.id, initialAnswers: { seller_situation: situation.id } }
    : { kind: 'invalid', reason: 'Cette situation n’est pas reconnue. Choisissez celle qui vous correspond aujourd’hui.' };
}

/** Archive reconstruction stays separate from sellerJourney.buildReading(). */
export function legacyReading(decoded: Pick<LegacySellerResult, 'code' | 'situationId' | 'result'>, generatedAt = new Date().toISOString()): Reading {
  const { result } = decoded;
  const situation = getSituation(decoded.situationId)!;
  const sourceAnswerIds = situation.questions.map(q => sellerQuestionId(situation.id, q.id));
  return {
    id: `legacy-seller-${decoded.code}`, revision: 0,
    title: 'Lecture reconstruite de votre ancien lien',
    methodVersion: `seller-v1@${LEGACY_SELLER_BASE}`, generatedAt,
    sections: [
      { id: 'situation', title: 'Ce que vous aviez indiqué', items: [{ text: result.reformulation || 'Aucune reformulation disponible.', kind: 'declared', sourceAnswerIds }] },
      { id: 'solide', title: 'Ce que ce lien permet de retrouver', items: [{ text: LEGACY_SELLER_NOTICE, kind: 'unknown' }, { text: `${result.regle.titre} — ${result.regle.interpretation}`, kind: 'hypothesis', sourceAnswerIds }] },
      { id: 'conditions', title: 'Une piste à réexaminer aujourd’hui', items: [{ text: result.regle.definition, kind: 'conditional', sourceAnswerIds, condition: 'À confronter à votre situation actuelle ; la convergence des anciennes réponses ne constitue pas une probabilité ni une vérification.' }, ...(result.secondePiste ? [{ text: `${result.secondePiste.titre} — ${result.secondePiste.definition}`, kind: 'hypothesis' as const, sourceAnswerIds }] : [])] },
      { id: 'verifier', title: 'Ce qui reste à vérifier', items: [{ text: result.regle.limite, kind: 'unknown', sourceAnswerIds }] },
      { id: 'decision', title: 'La suite proposée par cette version', items: [{ text: result.regle.action, kind: 'conditional', sourceAnswerIds, condition: 'Proposition de l’ancienne méthode, à réexaminer avant d’agir.' }] },
    ],
    nextDecision: { text: 'Confirmer ou corriger les réponses de ce lien pour construire une lecture actuelle.', why: 'Le contexte peut avoir changé ; une nouvelle lecture ne doit pas écraser cette reconstruction.', changesWith: 'Une réponse corrigée, une pièce nouvelle ou une évolution de votre projet.' },
    limits: [LEGACY_SELLER_NOTICE, result.regle.limite, 'Les réponses sont déclaratives. Aucune pièce, valeur du bien ou faisabilité n’a été vérifiée automatiquement.'],
  };
}

export const buildLegacySellerReading = legacyReading;
