/** Public experience contract. No contact information belongs in this context. */
export type Project = 'buyer' | 'seller' | 'transition' | 'local' | 'audit';
export type AnswerValue = string | string[] | number | null;
export interface Answer { value: AnswerValue; provenance: 'declared' | 'imported' | 'confirmed'; updatedAt: string; revision: number; author?: string; semanticVersion?: string }
export interface Entry { door: 'direct' | 'video' | 'google' | 'qr' | 'recommendation' | 'known' | 'unknown'; source: string | null; promise: string | null }
export interface ReadingItem { text: string; kind: 'declared' | 'solid' | 'conditional' | 'unknown' | 'data' | 'hypothesis' | 'verified'; sourceAnswerIds?: string[]; condition?: string }
export interface ReadingSection { id: string; title: string; items: ReadingItem[] }
export interface ComparisonOption { id: string; title: string; consequence: string; condition: string; limit: string }
export interface Reading { id: string; revision: number; title: string; sections: ReadingSection[]; nextDecision: { text: string; why: string; changesWith?: string }; limits: string[]; methodVersion: string; generatedAt: string; deliveryMode?: 'email-arbitrage-v1'; options?: ComparisonOption[]; answersSnapshot?: Record<string,Answer>; projectSnapshot?: Project; humanNotesSnapshot?: HumanNote[] }
export interface HumanNote { id: string; text: string; author: string; createdAt: string; source?: string }
export interface Context { schemaVersion: 1; id: string; revision: number; project: Project; entry: Entry; answers: Record<string, Answer>; createdAt: string; updatedAt: string; reading?: Reading; history?: Reading[]; humanNotes?: HumanNote[]; depth?: 'micro' | 'intermediate' | 'deep'; initialEntry?: Entry }
export interface Choice { value: string; label: string; detail?: string }
export interface Question { id: string; sequence: number; sequenceTitle: string; title: string; help?: string; type: 'choice' | 'multiple' | 'text' | 'number' | 'date'; choices?: Choice[]; optional?: boolean; placeholder?: string; suffix?: string; min?: number; max?: number; maxLength?: number; maxChoices?: number }
export interface Impact { title: string; text: string; limit: string; comparison?: ComparisonOption[] }
export interface Journey { project: Project; title: string; intro: string; sequences: string[]; getQuestions(context: Context): Question[]; getImpact(questionId: string, context: Context): Impact; buildReading(context: Context): Reading }
export function value(context: Context, id: string): AnswerValue | undefined { return context.answers[id]?.value; }
export function str(context: Context, id: string): string { const answer = value(context, id); return typeof answer === 'string' ? answer : typeof answer === 'number' ? String(answer) : ''; }
export function list(context: Context, id: string): string[] { const answer = value(context, id); return Array.isArray(answer) ? answer : []; }
export function number(context: Context, id: string): number | undefined { const answer = value(context, id); if (answer === null || answer === '' || answer === undefined || Array.isArray(answer)) return undefined; const parsed = Number(answer); return Number.isFinite(parsed) ? parsed : undefined; }
