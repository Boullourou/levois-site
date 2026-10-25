import { describe, expect, it } from 'vitest';
import { createContext } from './context';
import { exportReadingHTML } from './export';
import { MAX_RESUME_FILE_BYTES, parseResumeFile, resumeDestination, sharedContext } from './resume';
import type { Reading } from './types';

const reading: Reading = {
  id: 'reading-kept', revision: 2, title: 'Votre projet conservé', sections: [],
  limits: ['Financement à vérifier.'], nextDecision: { text: 'Vérifier votre budget.', why: 'Montant déclaré.' },
  generatedAt: '2026-09-10T12:00:00Z', methodVersion: 'historical-method',
};

describe('Reprise sans changement de projet', () => {
  it.each(['buyer', 'seller', 'transition', 'local', 'audit'] as const)('importe le projet %s sans le convertir en vendeur', project => {
    const context = createContext(project);
    context.reading = reading; context.history = [{ ...reading, id: 'previous-reading', revision: 1 }];
    const imported = parseResumeFile(exportReadingHTML(context, reading));
    expect(imported?.project).toBe(project);
    expect(imported?.reading?.methodVersion).toBe('historical-method');
    expect(resumeDestination(imported!)).toBe('/lecture');
    const json = parseResumeFile(JSON.stringify(context));
    expect(json?.history?.[0].id).toBe('previous-reading');
    expect(context.project).toBe(project);
  });
  it('dirige un brouillon vers son propre questionnaire', () => {
    expect(resumeDestination(createContext('buyer'))).toBe('/ma-recherche');
    expect(resumeDestination(createContext('transition'))).toBe('/vendre-et-acheter');
  });
  it('extrait uniquement les données sans interpréter le HTML importé', () => {
    const context = createContext('buyer');
    const html = '<img src="https://external.invalid/track"><iframe src="https://external.invalid/frame"></iframe><script>throw new Error("Never execute")</script>'
      + '<script type="application/json" id="levois-context">' + JSON.stringify(context) + '</script>';
    expect(parseResumeFile(html)?.id).toBe(context.id);
  });
  it('refuse les fichiers ambigus, malformés ou trop volumineux', () => {
    const script = `<script id="levois-context" type="application/json">${JSON.stringify(createContext('buyer'))}</script>`;
    for (const input of ['', '<html>hello</html>', '{}', '{"schemaVersion":999}', script + script, 'x'.repeat(MAX_RESUME_FILE_BYTES + 1)]) {
      expect(parseResumeFile(input)).toBeNull();
    }
  });
  it('rejette les clés de pollution et les versions non reconnues', () => {
    const context = createContext('buyer');
    const malicious = JSON.stringify(context).replace('"answers":{}', '"answers":{"__proto__":{"value":"x"}}');
    expect(parseResumeFile(malicious)).toBeNull();
  });
  it('conserve une note humaine attribuée sans transformer les déclarations en vérifications', () => {
    const context = createContext('buyer'); context.reading = { ...reading, humanNotesSnapshot: [] };
    const note = { id: 'note-fixture', text: '<img src=x onerror=alert(1)> À vérifier.', reason: 'Une déclaration', evidence: 'Aucune pièce reçue', createdAt: reading.generatedAt };
    const result = sharedContext(context, note);
    expect(result?.project).toBe('buyer');
    expect(result?.humanNotes?.[0]).toMatchObject({ text: note.text, author: 'Mouaad Boullourou', source: 'Une déclaration · Aucune pièce reçue' });
    expect(result?.reading?.humanNotesSnapshot).toEqual(result?.humanNotes);
    expect(sharedContext(context, { ...note, text: 'x'.repeat(10_001) })).toBeNull();
  });
});
