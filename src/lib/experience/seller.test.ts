import { describe, expect, it } from 'vitest';
import { sellerJourney, sellerHistoricalQuestions, sellerInactiveAnswerIds, sellerNeedsTransition, getSellerResource } from './seller';
import { situations } from '../legacy/seller-v1/situations';
import { sellerQuestionId } from './legacy-seller';
import type { AnswerValue, Context } from './types';

const date = '2026-09-10T12:00:00.000Z';
function ctx(values: Record<string, AnswerValue>, revision = 1): Context {
  return { schemaVersion: 1, id: 'test-seller', revision, project: 'seller', entry: { door: 'direct', source: null, promise: null }, createdAt: date, updatedAt: date, answers: Object.fromEntries(Object.entries(values).map(([id, value]) => [id, { value, provenance: 'declared', updatedAt: date, revision }])) };
}
const text = (context: Context) => JSON.stringify(sellerJourney.buildReading(context));

describe('Seller — preserved core and useful unknowns', () => {
  it('preserves exactly the five historical branches and all 24 original questions and choice positions', () => {
    expect(Object.keys(sellerHistoricalQuestions)).toEqual(situations.map(s => s.id));
    expect(Object.values(sellerHistoricalQuestions).flat()).toHaveLength(24);
    for (const s of situations) {
      const questions = sellerJourney.getQuestions(ctx({ seller_situation: s.id }));
      for (const old of s.questions) {
        const q = questions.find(q => q.id === sellerQuestionId(s.id, old.id))!;
        expect(q.title).toBe(old.label);
        expect(q.choices?.slice(0, old.options.length)).toEqual(old.options.map(o => ({ value: o.value, label: o.label })));
        expect(q.choices?.some(o => o.label === 'Je ne sais pas encore')).toBe(true);
        expect(new Set(q.choices?.map(o => o.label)).size).toBe(q.choices?.length);
        expect(q.sequence).toBeGreaterThanOrEqual(1);
        expect(q.sequenceTitle).toBe(sellerJourney.sequences[q.sequence - 1]);
      }
    }
  });
  it.each(['preparer', 'publiee', 'peu-contacts', 'visites', 'longtemps', 'reflexion', 'offre', 'incident'])('keeps an entirely unknown %s journey useful without collecting identity', id => {
    const context = ctx({ seller_situation: id });
    for (const q of sellerJourney.getQuestions(context)) if (q.id !== 'seller_situation') context.answers[q.id] = { value: q.type === 'multiple' ? ['unknown'] : q.type === 'number' || q.type === 'text' ? null : 'unknown', provenance: 'declared', revision: 1, updatedAt: date };
    const reading = sellerJourney.buildReading(context);
    expect(reading.sections).toHaveLength(5);
    expect(reading.nextDecision.text.length).toBeGreaterThan(30);
    expect(reading.limits.length).toBeGreaterThanOrEqual(2);
    expect(reading.options?.some(o => o.id === 'attendre')).toBe(true);
    expect(reading.sections.flatMap(s => s.items).some(i => i.kind === 'verified')).toBe(false);
    expect(reading.sections[3].items.length).toBeGreaterThan(1);
    expect(sellerJourney.getQuestions(context).some(q => /email|telephone|nom$|commune/.test(q.id))).toBe(false);
    expect(JSON.stringify(reading)).not.toMatch(/probabilité|Signaux convergents|sous 24 h|quatorze jours/);
  });
  it('does not make a recent publication fail or impose fourteen days of silence', () => {
    const reading = text(ctx({ seller_situation: 'publiee', seller_publiee_duree: 'moins-7j', seller_publiee_signaux: 'peu-de-tout' }));
    expect(reading).toContain('pas, à elle seule, le signe d’un problème');
    expect(reading).toContain('moment de réexamen adapté');
    expect(reading).not.toMatch(/quatorze|aucune donnée.*suffisante|silence statistique/);
  });
  it('offers a concrete record to a seller without statistics', () => {
    const reading = sellerJourney.buildReading(ctx({ seller_situation: 'peu-contacts', seller_peu_contacts_vues: 'pas-acces' }));
    expect(reading.nextDecision.text).toContain('relevé séparant vues, demandes et visites');
    expect(reading.sections[1].items[0].sourceAnswerIds).toEqual(['seller_peu_contacts_vues']);
  });
  it('keeps a perceived price problem a hypothesis and never recommends an automatic reduction', () => {
    const context = ctx({ seller_situation: 'visites', seller_visites_remarques: 'travaux', seller_visites_modifier: 'prix', seller_visites_moment: 'apres-travaux' });
    const reading = sellerJourney.buildReading(context);
    expect(reading.nextDecision.text).toContain('travail précis');
    expect(reading.sections[1].items[0].kind).toBe('hypothesis');
    expect(reading.sections[1].items[0].sourceAnswerIds).not.toContain('seller_visites_modifier');
    expect(reading.nextDecision.text).not.toMatch(/baisser|réduire.*prix/);
  });
  it('does not inherit unsupported help claims or turn a price modification into a reduction', () => {
    const helps = Object.values(sellerHistoricalQuestions).flat().map(q => q.help).join(' ');
    expect(helps).not.toMatch(/dix avis|plus fiable|Modifier trop tôt|en dit plus|compte plus/);
    const visits = text(ctx({ seller_situation: 'visites', seller_visites_modifier: 'prix' }));
    expect(visits).not.toContain('vous hésitez aujourd’hui à baisser');
    const history = text(ctx({ seller_situation: 'longtemps', seller_longtemps_modifications: 'prix' }));
    expect(history).not.toContain('Chaque baisse');
  });
});

describe('Seller — correction, provenance and dependent state', () => {
  it('changes the dependent conclusion after correction without rewriting the former object', () => {
    const context = ctx({ seller_situation: 'preparer', seller_preparer_prix: 'financement' });
    const before = sellerJourney.buildReading(context);
    const corrected = ctx({ seller_situation: 'preparer', seller_preparer_prix: 'en-ligne' }, 2);
    const after = sellerJourney.buildReading(corrected);
    expect(sellerNeedsTransition(context)).toBe(true);
    expect(sellerNeedsTransition(corrected)).toBe(false);
    expect(before.nextDecision.text).toContain('relier vente et achat');
    expect(after.nextDecision.text).toContain('hypothèses des avis');
    expect(after.id).not.toBe(before.id);
    expect(after.revision).toBe(2);
    expect(before.revision).toBe(1);
  });
  it('ignores incompatible answers from a previously selected branch', () => {
    const context = ctx({ seller_situation: 'visites', seller_preparer_prix: 'financement', seller_offre_montant: 280000, seller_visites_remarques: 'vagues' });
    expect(sellerInactiveAnswerIds(context)).toEqual(['seller_preparer_prix', 'seller_offre_montant']);
    expect(sellerNeedsTransition(context)).toBe(false);
    expect(text(context)).not.toContain('280');
    for (const item of sellerJourney.buildReading(context).sections.flatMap(s => s.items)) {
      expect(item.sourceAnswerIds ?? []).not.toContain('seller_preparer_prix');
      expect(item.sourceAnswerIds ?? []).not.toContain('seller_offre_montant');
    }
  });
  it('does not upgrade a user-confirmed document declaration to a verified fact', () => {
    const context = ctx({ seller_situation: 'preparer', seller_preparer_documents: 'oui', seller_appui: 'documents' });
    Object.values(context.answers).forEach(a => { a.provenance = 'confirmed'; });
    const items = sellerJourney.buildReading(context).sections.flatMap(s => s.items);
    expect(items.some(i => i.kind === 'verified')).toBe(false);
    expect(items.find(i => i.sourceAnswerIds?.includes('seller_preparer_documents'))?.kind).toBe('declared');
    expect(sellerJourney.getImpact('seller_appui', context).text).toContain('pas contrôlé');
  });
  it('makes waiting explicit, with a condition of review and no forced relaunch', () => {
    const reading = sellerJourney.buildReading(ctx({ seller_situation: 'longtemps', seller_longtemps_projet: 'retirer', seller_rythme: 'attendre' }));
    expect(reading.nextDecision.text).toContain('point de réexamen');
    expect(reading.sections[4].items[0].condition).toBeTruthy();
    expect(reading.options?.find(o => o.id === 'attendre')?.condition).toContain('engagements');
  });
  it('keeps historical resource wording separate from a human reread request', () => {
    const resource = getSellerResource(ctx({ seller_situation: 'preparer' }));
    expect(resource).toMatchObject({ kind: 'resource', href: '/ressources/lancement-coherent', label: 'Faire relire mon lancement' });
    expect(resource.detail).toContain('Aucune demande de relecture humaine');
  });
  it('renders a new relevant micro-value immediately for an updated answer', () => {
    const a = sellerJourney.getImpact('seller_offre_calendrier', ctx({ seller_situation: 'offre', seller_offre_calendrier: 'incompatible' }));
    const b = sellerJourney.getImpact('seller_offre_calendrier', ctx({ seller_situation: 'offre', seller_offre_calendrier: 'semble-compatible' }));
    expect(a.text).toContain('difficulté de date');
    expect(b.text).toContain('point à confirmer');
    expect(a.text).not.toBe(b.text);
  });
});

describe('Seller — bounded new branches', () => {
  it('does not use an offer amount alone to choose acceptance or refusal', () => {
    const reading = sellerJourney.buildReading(ctx({ seller_situation: 'offre', seller_offre_montant: 250000 }));
    expect(reading.nextDecision.text).toContain('conditions');
    expect(reading.sections[3].items.map(i => i.text).join(' ')).toContain('calendrier');
    expect(reading.nextDecision.text).not.toMatch(/accepter|refuser/);
    expect(reading.options?.map(o => o.id)).toEqual(['clarifier', 'comparer', 'attendre']);
  });
  it('does not treat malformed or out-of-range monetary input as a known amount', () => {
    for (const amount of ['NaN', -1, 100000001, Infinity]) {
      const reading = sellerJourney.buildReading(ctx({ seller_situation: 'offre', seller_offre_montant: amount }));
      expect(reading.sections[0].items.some(i => i.sourceAnswerIds?.includes('seller_offre_montant'))).toBe(false);
    }
  });
  it('opens incident verification from the old long-sale answer and removes it after correction', () => {
    const context = ctx({ seller_situation: 'longtemps', seller_longtemps_preoccupation: 'compromis-annule' });
    expect(sellerJourney.getQuestions(context).filter(q => q.id.startsWith('seller_longtemps_'))).toHaveLength(5);
    expect(sellerJourney.getQuestions(context).some(q => q.id === 'seller_incident_statut')).toBe(true);
    expect(text(context)).toContain('ne suffit pas à conclure que la vente peut être relancée');
    context.answers.seller_longtemps_preoccupation.value = 'meilleures-bases';
    expect(sellerJourney.getQuestions(context).some(q => q.id.startsWith('seller_incident_'))).toBe(false);
  });
  it('keeps an unknown current situation useful without diagnosing a selected sale', () => {
    const reading = sellerJourney.buildReading(ctx({ seller_situation: 'unknown' }));
    expect(sellerJourney.getQuestions(ctx({}))).toHaveLength(1);
    expect(reading.nextDecision.text).toContain('Choisir la situation');
    expect(reading.sections[0].items[0].kind).toBe('unknown');
  });
});
