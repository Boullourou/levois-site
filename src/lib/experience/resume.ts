import { parseContext } from './context';
import type { Context, Project } from './types';

export const MAX_RESUME_FILE_BYTES = 1_000_000;
export const PROJECT_ROUTES: Record<Project, string> = {
  buyer: '/ma-recherche', seller: '/situer-ma-vente', transition: '/vendre-et-acheter',
  local: '/votre-rue', audit: '/audit-annonce',
};
export const PROJECT_NAMES: Record<Project, string> = {
  buyer: 'Votre achat', seller: 'Votre vente', transition: 'Votre vente et votre achat',
  local: 'Vos ventes locales', audit: 'Votre annonce',
};

/** Extract data only: imported HTML is never inserted into a DOM or executed. */
export function parseResumeFile(text: string): Context | null {
  if (new TextEncoder().encode(text).byteLength > MAX_RESUME_FILE_BYTES) return null;
  try {
    let raw = text.trim().replace(/^\uFEFF/, '');
    if (!raw.startsWith('{')) {
      const scripts = [...raw.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
      const contexts = scripts.filter(([, attributes]) =>
        /\bid\s*=\s*(["'])levois-context\1/i.test(attributes)
        && /\btype\s*=\s*(["'])application\/json\1/i.test(attributes));
      if (contexts.length !== 1) return null;
      raw = contexts[0][2];
    }
    return parseContext(JSON.parse(raw));
  } catch { return null; }
}

export function resumeDestination(context: Context): string {
  return context.reading ? '/lecture' : PROJECT_ROUTES[context.project];
}

/** Preserve attributed notes from the protected API, bounded by parseContext. */
export function sharedContext(value: unknown, humanNote: unknown): Context | null {
  const context = parseContext(value);
  if (!context) return null;
  if (humanNote && typeof humanNote === 'object') {
    const note = humanNote as Record<string, unknown>;
    if (typeof note.id !== 'string' || typeof note.text !== 'string' || typeof note.createdAt !== 'string'
      || typeof note.reason !== 'string' || typeof note.evidence !== 'string') return null;
    const candidate = {
      id: note.id, text: note.text, author: 'Mouaad Boullourou', createdAt: note.createdAt,
      source: `${note.reason} · ${note.evidence}`,
    };
    context.humanNotes = [...(context.humanNotes || []).filter(item => item.id !== candidate.id), candidate];
    // A snapshot must carry its associated human note into the displayed reading.
    if (context.reading?.humanNotesSnapshot) context.reading.humanNotesSnapshot = context.humanNotes;
  }
  const checked = parseContext(context);
  if (context.humanNotes?.length !== checked?.humanNotes?.length) return null;
  return checked;
}
