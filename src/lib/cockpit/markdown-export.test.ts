import { describe, expect, it } from 'vitest';
import {
  escapeMarkdownText,
  generateClientMarkdown,
  type ClientMarkdownExportInput,
} from './markdown-export';

const dossier: ClientMarkdownExportInput = {
  generatedAt: '2026-08-18T12:00:00.000Z',
  coordinateMode: 'with_coordinates',
  person: {
    id: 'person-demo-001',
    displayName: 'Camille Démonstration',
    firstName: 'Camille',
    lastName: 'Démonstration',
    email: 'camille@example.invalid',
    phone: '+33 0 00 00 00 00',
    origin: 'Démonstration locale',
    summary: 'Projet fictif de retraite.',
    createdAt: '2026-08-01',
    lastContactAt: '2026-08-17',
  },
  projects: [
    {
      id: 'project-demo-001',
      personId: 'person-demo-001',
      type: 'primary_residence_purchase',
      status: 'active',
      stage: 'search_active',
      objective: 'Résidence principale fictive',
      timeline: 'Horizon de démonstration',
    },
    {
      id: 'project-other-001',
      personId: 'person-other-001',
      type: 'sale',
      status: 'active',
      stage: 'marketing',
      objective: 'NE_DOIT_JAMAIS_APPARAITRE',
    },
  ],
  buyerSearches: [
    { id: 'search-demo-001', projectId: 'project-demo-001', summary: 'Secteur chartrain élargi.' },
    { id: 'search-other-001', projectId: 'project-other-001', summary: 'FUITE_RECHERCHE' },
  ],
  scenarios: [
    { id: 'scenario-demo-001', buyerSearchId: 'search-demo-001', type: 'preferred', label: 'Préféré' },
    { id: 'scenario-other-001', buyerSearchId: 'search-other-001', type: 'preferred', label: 'FUITE_SCENARIO' },
  ],
  criterionEvents: [
    {
      id: 'criterion-demo-001',
      buyerSearchId: 'search-demo-001',
      scenarioId: 'scenario-demo-001',
      eventType: 'set',
      key: 'surface',
      value: '80–100 m² idéal',
      importance: 'important',
      flexibility: 'medium',
      certainty: 'confirmed',
      matchingRole: 'soft',
      source: 'Entretien fictif',
      effectiveAt: '2026-08-10T09:00:00.000Z',
      recordedAt: '2026-08-10T09:05:00.000Z',
    },
    {
      id: 'criterion-demo-002',
      buyerSearchId: 'search-demo-001',
      scenarioId: 'scenario-demo-001',
      eventType: 'revise',
      key: 'surface',
      value: '72 m² possibles si agencement excellent',
      importance: 'important',
      flexibility: 'medium',
      certainty: 'observed',
      matchingRole: 'soft',
      source: 'Observation fictive validée pour suivi',
      effectiveAt: '2026-08-17T09:00:00.000Z',
      recordedAt: '2026-08-17T09:10:00.000Z',
      supersedesEventId: 'criterion-demo-001',
      reason: 'Évolution après échange fictif',
    },
    {
      id: 'criterion-other-001',
      buyerSearchId: 'search-other-001',
      scenarioId: 'scenario-other-001',
      eventType: 'set',
      key: 'zone',
      value: 'FUITE_CRITERE',
      importance: 'essential',
      flexibility: 'none',
      certainty: 'confirmed',
      matchingRole: 'hard',
      source: 'Autre dossier',
      effectiveAt: '2026-08-17',
      recordedAt: '2026-08-17',
    },
  ],
  interactions: [
    {
      id: 'interaction-demo-001',
      personId: 'person-demo-001',
      projectId: 'project-demo-001',
      occurredAt: '2026-08-17T08:00:00.000Z',
      type: 'call',
      direction: 'outgoing',
      summary: 'Échange de démonstration.',
      promisedAction: 'Envoyer une synthèse fictive',
      promisedDueAt: '2026-08-19',
    },
    {
      id: 'interaction-other-001',
      personId: 'person-other-001',
      projectId: 'project-other-001',
      occurredAt: '2026-08-17',
      type: 'email',
      direction: 'incoming',
      summary: 'FUITE_INTERACTION',
    },
  ],
  tasks: [
    {
      id: 'task-demo-001',
      projectId: 'project-demo-001',
      title: 'Rappeler pour confirmer le DPE acceptable',
      dueAt: '2026-08-19',
      priority: 'high',
      state: 'open',
      isNextAction: true,
    },
    {
      id: 'task-other-001',
      projectId: 'project-other-001',
      title: 'FUITE_TACHE',
      priority: 'urgent',
      state: 'open',
      isNextAction: true,
    },
  ],
  decisions: [
    {
      id: 'decision-demo-001',
      projectId: 'project-demo-001',
      effectiveAt: '2026-08-17',
      summary: 'Conserver l’idéal tout en ajoutant le scénario conditionnel.',
    },
  ],
  learnings: [
    {
      id: 'learning-demo-001',
      personId: 'person-demo-001',
      summary: 'Un critère binaire ne décrit pas toujours un compromis.',
      status: 'captured',
    },
  ],
};

describe('client Markdown export', () => {
  it('emits stable front matter and the complete scoped history', () => {
    const output = generateClientMarkdown(dossier);
    expect(output.mediaType).toBe('text/markdown;charset=utf-8');
    expect(output.filename).toBe('levois-camille-demonstration-2026-08-18.md');
    expect(output.content.startsWith('---\nlevois_export_version: 1')).toBe(true);
    expect(output.content).toContain('person_id: "person-demo-001"');
    expect(output.content).toContain('## Recherche actuelle');
    expect(output.content).toContain('72 m² possibles si agencement excellent');
    expect(output.content).toContain('80–100 m² idéal');
    expect(output.content).toContain('remplace `criterion-demo-001`');
    expect(output.content).toContain('## Prochaine action');
    expect(output.content).toContain('## Enseignements LEVOIS');
  });

  it('includes coordinates only in the explicit coordinate mode', () => {
    const withCoordinates = generateClientMarkdown(dossier).content;
    expect(withCoordinates).toContain('camille@example.invalid');
    expect(withCoordinates).toContain('+33 0 00 00 00 00');

    const withoutCoordinates = generateClientMarkdown({
      ...dossier,
      coordinateMode: 'without_coordinates',
    }).content;
    expect(withoutCoordinates).not.toContain('camille@example.invalid');
    expect(withoutCoordinates).not.toContain('+33 0 00 00 00 00');
    expect(withoutCoordinates).toContain('Coordonnées :** exclues de cet export');
  });

  it('filters every record belonging to another dossier', () => {
    const output = generateClientMarkdown(dossier).content;
    expect(output).not.toContain('NE_DOIT_JAMAIS_APPARAITRE');
    expect(output).not.toContain('FUITE_RECHERCHE');
    expect(output).not.toContain('FUITE_SCENARIO');
    expect(output).not.toContain('FUITE_CRITERE');
    expect(output).not.toContain('FUITE_INTERACTION');
    expect(output).not.toContain('FUITE_TACHE');
    expect(output).not.toContain('project-other-001');
  });

  it('escapes raw HTML and Markdown control characters from user text', () => {
    expect(escapeMarkdownText('<script>alert(`x`)</script> # [lien]')).toBe(
      '&lt;script&gt;alert(\\`x\\`)&lt;/script&gt; \\# \\[lien\\]',
    );
    const output = generateClientMarkdown({
      ...dossier,
      person: { ...dossier.person, summary: '<img src=x onerror=alert(1)>' },
    }).content;
    expect(output).not.toContain('<img');
    expect(output).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('rejects an invalid generation date or unstable dossier identifier', () => {
    expect(() => generateClientMarkdown({ ...dossier, generatedAt: 'invalid' })).toThrow('invalid date');
    expect(() => generateClientMarkdown({
      ...dossier,
      person: { ...dossier.person, id: '../other' },
    })).toThrow('invalid stable identifier');
  });
});
