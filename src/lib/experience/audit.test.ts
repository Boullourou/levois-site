import { describe, expect, it } from 'vitest';
import { analyseHybridListing, getContextQuestion } from '../audit-blocked';
import { auditComplete, buildAuditResult, buildAuditReading, classifyAuditResponse, contextWithAudit, manualAuditPage, sellerAnswersFromAudit, type AuditAnswers } from './audit';
import { createContext, parseContext, setAnswer, textReading } from './context';

const url = 'https://www.example.test/annonce/maison';
const observations: AuditAnswers = { duration: '7-30', signal: 'vues-sans-contact', context: 'rien-modifie' };
describe('Audit — actual API states, no invented cause', () => {
  it('distinguishes blocked, unavailable content, inaccessible page and transport', () => {
    const blocked = classifyAuditResponse(422, { fallback: true, reason: 'blocked' }, url);
    const content = classifyAuditResponse(422, { fallback: true, reason: 'unavailable', message: 'La page est accessible, mais elle ne fournit pas assez d’informations lisibles automatiquement.' }, url);
    const unavailable = classifyAuditResponse(422, { fallback: true, reason: 'unavailable', message: 'La page n’est pas accessible pour le moment.' }, url);
    expect(blocked).toMatchObject({ kind: 'ready', page: { access: 'blocked' } });
    expect(content).toMatchObject({ kind: 'ready', page: { access: 'insufficient' } });
    expect(unavailable).toMatchObject({ kind: 'ready', page: { access: 'unavailable' } });
    expect(manualAuditPage(url, 'transport').message).toContain('ne prouve pas un blocage');
  });
  it('does not describe an invalid URL or API rate limit as portal blocking', () => {
    expect(classifyAuditResponse(400, { fallback: true }, url).kind).toBe('invalid');
    expect(classifyAuditResponse(429, {}, url)).toMatchObject({ kind: 'ready', page: { access: 'rate-limited' } });
    expect(classifyAuditResponse(503, {}, url)).toMatchObject({ kind: 'ready', page: { access: 'unavailable' } });
  });
  it('does not claim an incomplete success payload is a readable page', () => {
    expect(classifyAuditResponse(200, { ok: true, snapshot: { title: '', description: '' } }, url)).toMatchObject({ kind: 'ready', page: { access: 'unavailable' } });
  });
  it('bounds the extracted content and retains the link explicitly provided by the visitor', () => {
    const parsed = classifyAuditResponse(200, { ok: true, snapshot: { url: 'https://elsewhere.test', title: 'Maison', description: 'a'.repeat(10000), source: 'example.test', photoCount: 4 } }, url);
    expect(parsed.kind).toBe('ready');
    if (parsed.kind !== 'ready') return;
    expect(parsed.page.snapshot.description).toHaveLength(4000);
    expect(parsed.page.snapshot.url).toBe(url);
  });
});

describe('Audit — preserved hybrid engine and autonomous result', () => {
  it('preserves the exact two real engine actions across every existing duration/signal/context combination', () => {
    const page = manualAuditPage(url);
    for (const duration of ['moins-7', '7-30', 'plus-30'] as const) for (const signal of ['peu-vues', 'vues-sans-contact', 'contacts-sans-visite', 'visites-sans-offre', 'offre-recue'] as const) for (const option of getContextQuestion(signal).options) {
      const answers = { duration, signal, context: option.value };
      const result = buildAuditResult(page, answers, createContext('audit'));
      const original = analyseHybridListing(page.snapshot, duration, signal, option.value).analysis.tips;
      expect(result.analysis.tips.map(({ title, ...rest }) => rest)).toEqual(original.map(({ title, ...rest }) => rest));
      for (const tip of result.analysis.tips) if (!['price-changed', 'oral-offer'].includes(tip.code)) expect(tip.title).toBe(original.find(t => t.code === tip.code)!.title);
      expect(JSON.stringify(result.analysis.tips)).not.toMatch(/Ne baissez pas une seconde fois|intention orale comme un engagement/);
      expect(result.analysis.tips).toHaveLength(2);
      expect(result.reading.sections).toHaveLength(5);
      expect(result.analysis.limit).not.toContain('portail refuse');
    }
  });
  it('uses extracted evidence for the second tip when the actual engine does', () => {
    const response = classifyAuditResponse(200, { ok: true, snapshot: { title: 'Maison', description: 'Séjour.', source: 'example.test', photoCount: 4 } }, url);
    if (response.kind !== 'ready') throw new Error('Fixture');
    const result = buildAuditResult(response.page, observations, createContext('audit'));
    expect(['title', 'photos', 'description-depth']).toContain(result.analysis.tips[1].code);
    expect(result.reading.sections[1].items.some(i => i.kind === 'data' && i.text.includes('Titre extrait'))).toBe(true);
    const context = contextWithAudit(createContext('audit'), response.page, observations);
    expect(context.answers.audit_photo_count).toMatchObject({ value: 4, provenance: 'imported' });
    expect(context.answers.audit_description_length).toMatchObject({ value: 'Séjour.'.length, provenance: 'imported' });
    expect(context.reading!.sections[2].items[1].sourceAnswerIds).toContain('audit_photo_count');
  });
  it('accepts explicit unknowns without inventing a duration or stage', () => {
    const answers: AuditAnswers = { duration: 'unknown', signal: 'unknown', context: 'unknown' };
    expect(auditComplete(answers)).toBe(true);
    const result = buildAuditResult(manualAuditPage(), answers, createContext('audit'));
    expect(result.analysis.tips.map(t => t.code)).toEqual(['clarify-record', 'check-presentation']);
    expect(result.analysis.title).toContain('éclaircir');
    expect(JSON.stringify(result)).not.toContain('moins d’une semaine');
    expect(result.analysis.limit).toContain('Aucun contenu');
    expect(result.reading.sections[0].items.every(i => i.kind === 'unknown')).toBe(true);
  });
  it('rejects an incompatible third answer after a stage correction', () => {
    expect(auditComplete({ duration: '7-30', signal: 'visites-sans-offre', context: 'prix-modifie' })).toBe(false);
    expect(() => buildAuditResult(manualAuditPage(), { duration: '7-30', signal: 'visites-sans-offre', context: 'prix-modifie' }, createContext('audit'))).toThrow();
  });
  it('keeps the offer decision relevant even when publication duration is unknown', () => {
    const result = buildAuditResult(manualAuditPage(), { duration: 'unknown', signal: 'offre-recue', context: 'offre-ecrite-conditions' }, createContext('audit'));
    expect(result.analysis.title).toContain('offre');
    expect(result.analysis.tips[0].code).toBe('conditions');
    expect(result.analysis.facts[0]).toContain('Je ne sais pas');
    expect(JSON.stringify(result.reading)).not.toContain('moins de 7');
  });
  it('creates a valid common context and keeps the full source, actions and limits in a free export', () => {
    const context = contextWithAudit(createContext('audit'), manualAuditPage(url), observations);
    expect(parseContext(JSON.parse(JSON.stringify(context)))).not.toBeNull();
    expect(context.project).toBe('audit');
    expect(context.answers.audit_url.value).toBe(url);
    expect(context.reading?.sections).toHaveLength(5);
    expect(buildAuditReading(context)).toBe(context.reading);
    expect(buildAuditReading({ ...context, reading: undefined })).toBeNull();
    const exported = textReading(context.reading!);
    expect(exported).toContain(url);
    expect(exported).toContain('audit-hybrid-2.0.0');
    expect(exported).toContain('Deux actions à examiner');
    expect(exported).toContain('ni un prix');
    expect(Object.keys(context.answers).some(k => /email|phone|consent/.test(k))).toBe(false);
  });
  it('archives the former reading and recalculates dependencies after a correction', () => {
    const before = contextWithAudit(createContext('audit'), manualAuditPage(url), observations);
    const editing = setAnswer(before, 'audit_signal', 'visites-sans-offre', { audit_signal: ['audit_context'] });
    expect(editing.reading).toBeUndefined();
    expect(editing.answers.audit_context).toBeUndefined();
    expect(editing.history?.[0].id).toBe(before.reading?.id);
    const after = contextWithAudit(editing, manualAuditPage(url), { duration: '7-30', signal: 'visites-sans-offre', context: 'retour-inconnu' });
    expect(after.reading?.id).not.toBe(before.reading?.id);
    expect(after.reading?.title).toContain('après la visite');
  });
  it('only carries equivalent observations into the seller journey', () => {
    const visits = sellerAnswersFromAudit({ duration: '7-30', signal: 'visites-sans-offre', context: 'retour-prix' });
    expect(visits).toEqual({ seller_situation: 'visites' });
    const short = sellerAnswersFromAudit({ duration: 'moins-7', signal: 'vues-sans-contact', context: 'rien-modifie' });
    expect(short.seller_peu_contacts_duree).toBe('moins-2sem');
    expect(sellerAnswersFromAudit(observations)).not.toHaveProperty('seller_peu_contacts_duree');
    expect(sellerAnswersFromAudit({ duration: 'unknown', signal: 'unknown', context: 'unknown' })).toEqual({});
  });
});
