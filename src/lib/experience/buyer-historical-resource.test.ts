import { describe, expect, it } from 'vitest';
import type { AnswerValue, Context } from './types';
import { buildBuyerReading, getBuyerResource } from './buyer';

function context(values: Record<string, AnswerValue> = {}): Context {
  const now = '2026-09-10T16:00:00.000Z';
  return { schemaVersion: 1, id: 'historical-test', revision: 1, project: 'buyer', createdAt: now, updatedAt: now, entry: { door: 'direct', source: null, promise: null }, answers: Object.fromEntries(Object.entries(values).map(([id, value]) => [id, { value, provenance: 'declared', revision: 1, updatedAt: now }])) };
}

describe('accès facultatif acquéreur aux faits DVF historiques', () => {
  it('reste disponible sans budget et conserve source, période, périmètre, N et limites à consulter', () => {
    const resource = getBuyerResource(context());
    expect(resource.href).toBe('/votre-rue');
    expect(resource.detail).toMatch(/DGFiP.*Etalab/);
    for (const word of ['période', 'périmètre', 'nombre', 'offre disponible', 'prix actuel', 'capacité']) expect(resource.detail).toContain(word);
    expect(resource.sourceAnswerIds).toEqual([]);
    expect(buildBuyerReading(context()).sections[3].items.some(item => item.text.includes('Repère historique facultatif'))).toBe(true);
  });

  it('préremplit seulement la recherche d’adresse, sans confirmer un secteur libre ni changer la provenance d’entrée', () => {
    const ctx = context({ buyer_sector: 'Lèves & src=QR / <script>' });
    const resource = getBuyerResource(ctx);
    const url = new URL(resource.href, 'https://levois.test');
    expect(url.pathname).toBe('/votre-rue');
    expect([...url.searchParams.keys()]).toEqual(['q']);
    expect(url.searchParams.get('q')).toBe('Lèves & src=QR / <script>');
    expect(resource.sourceAnswerIds).toEqual(['buyer_sector']);
    expect(resource.provenance[0].mode).toBe('declared');
    expect(ctx.project).toBe('buyer');
    expect(ctx.entry.door).toBe('direct');
  });

  it('ne relie jamais le repère historique au budget ou à une concession de surface', () => {
    const initial = context({ buyer_sector: 'Lèves', buyer_budget: 250000, buyer_surface: 90 });
    const changed = context({ buyer_sector: 'Lèves', buyer_budget: 180000, buyer_surface: 60 });
    expect(getBuyerResource(initial)).toEqual(getBuyerResource(changed));
    const correctedSector = context({ buyer_sector: 'Mainvilliers' });
    expect(getBuyerResource(correctedSector).href).toBe('/votre-rue?q=Mainvilliers');
    const item = buildBuyerReading(initial).sections[3].items.find(item => item.text.startsWith('Repère historique facultatif'))!;
    expect(item.sourceAnswerIds).toEqual(['buyer_sector']);
    expect(item.kind).toBe('conditional');
    expect(item.text).not.toMatch(/250|90|offre typiquement|cohérent avec les prix/);
    expect(item.text).toContain('ne fixe ni surface accessible');
  });
});
