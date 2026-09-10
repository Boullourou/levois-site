import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseLegacySeller, LEGACY_SELLER_BASE, LEGACY_SELLER_NOTICE, sellerQuestionId } from './legacy-seller';
import { situations, getSituation } from '../legacy/seller-v1/situations';
import { computeResult } from '../legacy/seller-v1/engine';

describe('Immutable seller v1 compatibility', () => {
  it('pins all snapshot bytes after LF normalization (only engine import path was normalized)', () => {
    const hashes: Record<string, string> = {
      'situations.ts': 'a438b4a099c997c21bc25fc4c9379dd24685779331db0f971284720f49f97a40',
      'engine.ts': 'ef9ebac95f83807a664bfebb4daeb803291befbf7ac54d972b15b39059b0ee44',
      'types.ts': 'c40e8e2b36fefb7009dcbc05ad14f2a073170169a8b376ddf6672159a870b6d1',
    };
    for (const [file, expected] of Object.entries(hashes)) {
      const content = readFileSync(new URL(`../legacy/seller-v1/${file}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
      expect(createHash('sha256').update(content).digest('hex'), file).toBe(expected);
    }
  });
  it('preserves the three historical golden results and reconstruction wording in a fresh URL parse', () => {
    const cases = [
      { code: 'preparer.2.0.2.1.1', title: 'Alignement avant publication', phrase: 'prix n’est pas encore défini', level: 'convergents' },
      { code: 'peu-contacts.1.0.0.0.1', title: 'Transformation vue → contact', phrase: 'première photographie', level: 'repete' },
      { code: 'visites.1.1.0.3.0', title: 'Perception de la valeur après visite', phrase: 'travaux', level: 'convergents' },
    ];
    for (const fixture of cases) {
      const parsed = parseLegacySeller(new URLSearchParams({ r: fixture.code, s: 'longtemps' }));
      expect(parsed.kind).toBe('result');
      if (parsed.kind !== 'result') throw new Error('Invalid fixture');
      expect(parsed.result.regle.titre).toBe(fixture.title);
      expect(parsed.result.niveau).toBe(fixture.level);
      expect(parsed.result.reformulation).toContain(fixture.phrase);
      expect(parsed.reading.sections[0].items[0].text).toBe(parsed.result.reformulation);
      expect(parsed.reading.methodVersion).toContain(LEGACY_SELLER_BASE);
      expect(parsed.reading.limits).toContain(LEGACY_SELLER_NOTICE);
      expect(parsed.initialAnswers.seller_situation).toBe(parsed.situationId);
      expect(parsed.reading.nextDecision.text).toContain('Confirmer ou corriger');
    }
  });
  it('preserves all valid option combinations, answer values and exact engine reformulation', () => {
    for (const situation of situations) {
      const visit = (indices: number[]) => {
        if (indices.length < situation.questions.length) {
          situation.questions[indices.length].options.forEach((_, index) => visit([...indices, index]));
          return;
        }
        const answers = Object.fromEntries(situation.questions.map((q, i) => [q.id, q.options[indices[i]].value]));
        const parsed = parseLegacySeller(new URLSearchParams({ r: [situation.id, ...indices].join('.') }));
        if (parsed.kind !== 'result') throw new Error(`Rejected valid historical code for ${situation.id}`);
        expect(parsed.answers).toEqual(answers);
        expect(parsed.result).toEqual(computeResult(situation, answers));
        for (const q of situation.questions) expect(parsed.initialAnswers[sellerQuestionId(situation.id, q.id)]).toBe(answers[q.id]);
      };
      visit([]);
    }
  }, 20000);
  it.each(['', 'preparer.0', 'preparer.0.0.0.0.0.0', 'preparer.x.0.0.0.0', 'preparer.-1.0.0.0.0', 'preparer.1e0.0.0.0.0', 'preparer.99.0.0.0.0', 'missing.0.0.0.0.0'])('rejects malformed r=%s without falling back to another situation', r => {
    expect(parseLegacySeller(new URLSearchParams({ r, s: 'visites' })).kind).toBe('invalid');
  });
  it('keeps old leading-zero option syntax and result slug syntax that the audited engine accepted', () => {
    expect(parseLegacySeller(new URLSearchParams({ r: 'je-prepare-ma-vente.02.00.02.01.01' })).kind).toBe('result');
  });
  it('keeps all five s IDs and all five slugs; q remains a local-address parameter', () => {
    for (const s of situations) for (const key of [s.id, s.slug]) expect(parseLegacySeller(new URLSearchParams({ s: key }))).toMatchObject({ kind: 'situation', situationId: s.id });
    expect(parseLegacySeller(new URLSearchParams({ q: 'Rue de Chartres' }))).toEqual({ kind: 'none' });
    expect(parseLegacySeller(new URLSearchParams({ s: 'inconnu', q: 'visites' })).kind).toBe('invalid');
  });
  it('never generates commercial consent or a human-reread action from a historical code', () => {
    const parsed = parseLegacySeller(new URLSearchParams({ r: 'preparer.2.0.2.1.1' }));
    expect(parsed.kind).toBe('result');
    if (parsed.kind !== 'result') throw new Error('Fixture');
    expect(parsed.result.regle.ctaLabel).toBe('Faire relire mon lancement');
    expect(parsed.result.regle.resourceId).toBe('lancement-coherent');
    expect(Object.keys(parsed.initialAnswers).every(id => id.startsWith('seller_'))).toBe(true);
    expect(Object.keys(parsed)).not.toContain('consent');
    expect(getSituation(parsed.situationId)?.questions).toHaveLength(5);
  });
});
