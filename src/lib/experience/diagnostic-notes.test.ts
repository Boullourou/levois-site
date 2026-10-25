import { describe, expect, it } from 'vitest';
import { createContext, contextForReading } from './context';
import { getDiagnosticJourney } from './diagnostics';
import { diagnosticNotesHTML } from './diagnostic-notes';
import { sharedContext } from './resume';

const note = { id: 'note-test', author: 'Mouaad Boullourou', text: 'Point à revoir ensemble.', createdAt: '2026-10-25T12:00:00Z', source: 'Déclaration du propriétaire, pièce à confirmer.' };

describe('Notes attached to the displayed diagnostic', () => {
  it('omits an empty section and escapes untrusted author, note and source', () => {
    expect(diagnosticNotesHTML(undefined)).toBe('');
    expect(diagnosticNotesHTML([])).toBe('');
    const html = diagnosticNotesHTML([{ ...note, author: '<img src=x>', text: '</p><script>alert(1)</script>', source: '<b>preuve</b>' }]);
    expect(html).toContain('Précisions conservées');
    expect(html).toContain('Auteur indiqué : &lt;img');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Source indiquée : &lt;b&gt;');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('vérifié');
  });

  it('uses the historical snapshot and does not leak a later note into the former version', () => {
    const context = createContext('buyer');
    context.humanNotes = [note];
    const historical = getDiagnosticJourney('buyer').buildReading(context);
    context.humanNotes = [{ ...note, text: 'Nouvelle précision actuelle.' }];
    const oldHTML = diagnosticNotesHTML(contextForReading(context, historical).humanNotes);
    expect(oldHTML).toContain(note.text);
    expect(oldHTML).not.toContain('Nouvelle précision actuelle');
    historical.humanNotesSnapshot = [];
    expect(diagnosticNotesHTML(contextForReading(context, historical).humanNotes)).toBe('');
  });

  it('carries a protected-resume note into the current snapshot without altering history', () => {
    const context = createContext('seller');
    const historical = getDiagnosticJourney('seller').buildReading(context);
    context.reading = getDiagnosticJourney('seller').buildReading(context);
    context.history = [historical];
    const shared = sharedContext(context, { id: note.id, text: note.text, createdAt: note.createdAt, reason: 'Échange', evidence: 'Document à vérifier' })!;
    expect(diagnosticNotesHTML(contextForReading(shared, shared.reading!).humanNotes)).toContain(note.text);
    expect(diagnosticNotesHTML(contextForReading(shared, shared.history![0]).humanNotes)).toBe('');
  });

  it('preserves a protected-resume note when a draft has no reading yet', () => {
    const shared = sharedContext(createContext('buyer'), { id: note.id, text: note.text, createdAt: note.createdAt, reason: 'Échange', evidence: 'Document à vérifier' })!;
    expect(shared.reading).toBeUndefined();
    const reading = getDiagnosticJourney('buyer').buildReading(shared);
    expect(diagnosticNotesHTML(contextForReading(shared, reading).humanNotes)).toContain(note.text);
    expect(reading.humanNotesSnapshot?.[0].source).toBe('Échange · Document à vérifier');
  });
});
