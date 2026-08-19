import { describe, expect, it } from 'vitest';
import { presentBriefing, presentBriefingFailure } from './agentic-briefing-presenter';

function briefingItem(overrides: Record<string, unknown> = {}) {
  return {
    itemId: 'ITEM-FX-001',
    priority: 'normal',
    scopeKind: 'project',
    scopeId: 'PRJ-FX-001',
    primaryRuleId: 'OPS-PROJECT-NEXT-ACTION-001',
    explanation: 'Ce projet est actif mais aucune prochaine action n’est définie.',
    suggestedHumanAction: 'Définir la prochaine étape.',
    signalCount: 1,
    source: {
      sourceOpsMissionId: 'MSN-OPS-FX-001',
      snapshotId: 'SNAP-FX-001',
      operationalWatermark: 'WM-FX-001',
    },
    ...overrides,
  };
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    state: 'current',
    shadowMode: true,
    fixtureOnly: true,
    missionId: 'MSN-COS-FX-001',
    generatedAt: '2026-08-19T08:00:00.000Z',
    omittedCount: 0,
    items: [briefingItem()],
    ...overrides,
  };
}

describe('agentic briefing presenter', () => {
  it('presents a current finding with a deterministic source and private target', () => {
    expect(presentBriefing(payload())).toMatchObject({
      state: 'available',
      statusLabel: 'À jour',
      items: [{
        referenceLabel: 'Projet PRJ-FX-001',
        explanation: 'Ce projet est actif mais aucune prochaine action n’est définie.',
        suggestedHumanAction: 'Définir la prochaine étape.',
        sourceLabel: 'Règle OPS-PROJECT-NEXT-ACTION-001 · photographie SNAP-FX-001',
        href: '/cockpit/clients?project=PRJ-FX-001',
      }],
    });
  });

  it('distinguishes a complete empty briefing from a missing briefing', () => {
    expect(presentBriefing(payload({ state: 'current', items: [] }))).toMatchObject({ state: 'empty', items: [] });
    expect(presentBriefing(payload({ state: 'not_run', items: [] }))).toMatchObject({ state: 'not_run', items: [] });
  });

  it('maps stale and incomplete results without retaining any item', () => {
    expect(presentBriefing(payload({ state: 'invalid', invalidReason: 'CP_SOURCE_STALE' }))).toMatchObject({
      state: 'stale',
      items: [],
    });
    expect(presentBriefing(payload({ state: 'invalid', invalidReason: 'CP_SOURCE_EMPTY' }))).toMatchObject({
      state: 'incomplete',
      items: [],
    });
  });

  it.each(['stopped', 'failed'] as const)('renders the %s state without an old briefing', (state) => {
    expect(presentBriefing(payload({ state }))).toMatchObject({ state, items: [] });
  });

  it('fails closed when the fixture or Shadow proof is absent', () => {
    expect(presentBriefing(payload({ fixtureOnly: false }))).toMatchObject({ state: 'failed', items: [] });
    expect(presentBriefing(payload({ shadowMode: undefined }))).toMatchObject({ state: 'failed', items: [] });
  });

  it('rejects more than seven items instead of silently truncating the response', () => {
    const items = Array.from({ length: 8 }, (_, index) => briefingItem({
      itemId: `ITEM-FX-${index}`,
      scopeId: `PRJ-FX-${index}`,
    }));
    expect(presentBriefing(payload({ items }))).toMatchObject({ state: 'failed', items: [] });
  });

  it.each([
    { explanation: '' },
    { suggestedHumanAction: '' },
    { source: undefined },
    { primaryRuleId: 'MANIPULATED_REASON' },
    { scopeId: '../../public' },
    { scopeKind: 'person' },
  ])('rejects an item missing an allowlisted explanation, action, source or identifier', (override) => {
    expect(presentBriefing(payload({ items: [briefingItem(override)] }))).toMatchObject({ state: 'failed', items: [] });
  });

  it('maps only closed operational errors to a safe recoverable state', () => {
    expect(presentBriefingFailure('CP_KILL_SWITCH_ACTIVE').state).toBe('stopped');
    expect(presentBriefingFailure('CP_SOURCE_STALE').state).toBe('stale');
    expect(presentBriefingFailure('CP_SOURCE_EMPTY').state).toBe('incomplete');
    expect(presentBriefingFailure('UNEXPECTED').state).toBe('failed');
  });

  it('keeps untrusted-looking copy as plain presentation text rather than generating markup', () => {
    const presentation = presentBriefing(payload({
      items: [briefingItem({ explanation: '<script>fixture-only</script>' })],
    }));
    expect(presentation.items[0]?.explanation).toBe('<script>fixture-only</script>');
    expect(presentation).not.toHaveProperty('html');
  });
});
