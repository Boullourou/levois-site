import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { prepareBatch, validateBatchReview, inputFile, readJson } from '../../../scripts/editorial-batch-core.mjs';
import { productionFixture, productionMetadataFixture } from '../../../tests/fixtures/editorial-production';
import { resources } from '../../data/resources';
import { adaptProduction } from './production';

const repo = fileURLToPath(new URL('../../../', import.meta.url));
const cache = resolve(repo, '.cache');
const temporary: string[] = [];
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const coverProcessor = vi.fn(async (file: string, size: { width: number; height: number }) => {
  const source = await readFile(file);
  const buffer = Buffer.from(`FAKE_WEBP:${source.toString()}`);
  return { buffer, report: { inputSha256: hash(source), sha256: hash(buffer), width: size.width, height: size.height, bytes: buffer.length, quality: 80 } };
});

async function batchFixture(firstDate = '2026-10-29', withCovers = true) {
  await mkdir(cache, { recursive: true });
  const root = await mkdtemp(resolve(cache, 'editorial-batch-test-'));
  temporary.push(root);
  const input = resolve(root, 'input'); await mkdir(input);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(`${firstDate}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + i);
    const production = productionFixture(i + 1, date.toISOString().slice(0, 10));
    if (!withCovers) production.article.image = null;
    const folder = `J${String(i + 1).padStart(3, '0')}`; await mkdir(resolve(input, folder));
    await writeFile(resolve(input, folder, 'PRODUCTION.json'), JSON.stringify(production));
    await writeFile(resolve(input, folder, 'METADATA.json'), JSON.stringify(productionMetadataFixture(i + 1)));
    await writeFile(resolve(input, folder, 'cover.png'), `SOURCE_FAKE_${i + 1}`);
    days.push({ production: `${folder}/PRODUCTION.json`, metadata: `${folder}/METADATA.json`, cover: withCovers ? `${folder}/cover.png` : null, ...(withCovers ? { coverWidth: 1600, coverHeight: 900 } : {}) });
  }
  const manifest = { schemaVersion: 1, batchId: 'lot-test-001', campaignId: 'campagne-test', days };
  const change = async (index: number, kind: 'production' | 'metadata', mutate: (value: any) => void) => {
    const filename = resolve(input, manifest.days[index][kind]);
    const value = JSON.parse(await readFile(filename, 'utf8')); mutate(value); await writeFile(filename, JSON.stringify(value));
  };
  const prepare = (existing: any[] = []) => prepareBatch(manifest, input, existing, coverProcessor);
  return { root, input, manifest, change, prepare };
}

afterEach(async () => {
  vi.clearAllMocks();
  for (const root of temporary.splice(0)) {
    const actual = await realpath(root);
    const rel = relative(await realpath(cache), actual);
    if (isAbsolute(rel) || rel.startsWith('..') || !rel.startsWith('editorial-batch-test-')) throw new Error('Refus de supprimer hors des fixtures');
    await rm(actual, { recursive: true, force: true });
  }
});

describe('Préparation transactionnelle en mémoire de sept journées', () => {
  it('prépare un lot complet sans écrire au catalogue ni altérer les fichiers source', async () => {
    const fixture = await batchFixture();
    const before = await Promise.all(fixture.manifest.days.flatMap(day => [day.production, day.metadata, day.cover!]).map(file => readFile(resolve(fixture.input, file), 'utf8')));
    const batch = await fixture.prepare();
    expect(batch.articles).toHaveLength(7);
    expect(batch.articles.every(article => article.status === 'draft')).toBe(true);
    expect(batch.scheduled.every(article => article.status === 'scheduled')).toBe(true);
    expect(new Set(batch.scheduled.map(article => article.topicId)).size).toBe(7);
    expect(batch.actions.map(action => action.action)).toEqual(Array(7).fill('created'));
    expect(batch.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(coverProcessor).toHaveBeenCalledTimes(7);
    for (const cover of batch.coverFiles) {
      expect(cover.src).toContain(`cover-${hash(cover.buffer).slice(0, 16)}.webp`);
      expect(cover.report.width).toBe(1600);
      expect(cover.report.height).toBe(900);
    }
    expect(batch.sourceEvidence.every(entry => /^[a-f0-9]{64}$/.test(entry.productionSha256) && /^[a-f0-9]{64}$/.test(entry.metadataSha256))).toBe(true);
    const after = await Promise.all(fixture.manifest.days.flatMap(day => [day.production, day.metadata, day.cover!]).map(file => readFile(resolve(fixture.input, file), 'utf8')));
    expect(after).toEqual(before);
    expect(await fixture.prepare()).toEqual(batch);
    fixture.manifest.days.reverse();
    expect((await fixture.prepare()).fingerprint).toBe(batch.fingerprint);
  });
  it.each(['2026-03-26', '2026-10-22', '2027-03-25', '2027-10-28'])('accepte sept jours civils consécutifs autour de %s', async (start) => {
    const fixture = await batchFixture(start, false);
    const batch = await fixture.prepare();
    expect(batch.scheduled).toHaveLength(7);
    expect(batch.covers).toEqual([]);
    expect(coverProcessor).not.toHaveBeenCalled();
    expect(new Set(batch.scheduled.map(article => article.dates.publishAt.slice(-6))).size).toBe(2);
    const gaps = batch.scheduled.slice(1).map((article, index) => (Date.parse(article.dates.publishAt) - Date.parse(batch.scheduled[index].dates.publishAt)) / 3_600_000);
    expect(gaps.some(hours => hours === 23 || hours === 25)).toBe(true);
  });
  it('refuse un lot incomplet, un jour manquant ou deux dates identiques', async () => {
    const fixture = await batchFixture();
    await expect(prepareBatch({ ...fixture.manifest, days: fixture.manifest.days.slice(0, 6) }, fixture.input, [], coverProcessor)).rejects.toThrow(/sept journées/);
    await fixture.change(6, 'production', p => { p.date = '2026-11-06'; });
    await expect(fixture.prepare()).rejects.toThrow(/consécutives/);
    await fixture.change(6, 'production', p => { p.date = '2026-11-03'; });
    await expect(fixture.prepare()).rejects.toThrow(/consécutives/);
  });
  it('refuse les identifiants répétés, une autre campagne ou une journée incohérente', async () => {
    const duplicate = await batchFixture();
    await duplicate.change(6, 'production', p => { p.id = 'J001'; });
    await duplicate.change(6, 'metadata', m => { m.dayId = 'J001'; });
    await expect(duplicate.prepare()).rejects.toThrow(/identifiant déjà utilisé/);
    const wrong = await batchFixture();
    await wrong.change(0, 'metadata', m => { m.campaignId = 'autre-campagne'; });
    await expect(wrong.prepare()).rejects.toThrow(/Campagne différente/);
    await wrong.change(0, 'metadata', m => { m.campaignId = 'campagne-test'; m.dayId = 'J002'; });
    await expect(wrong.prepare()).rejects.toThrow(/dayId/);
  });
  it('protège les anciennes URL, les URL déjà réservées et les créneaux occupés', async () => {
    const legacy = await batchFixture();
    await legacy.change(0, 'production', p => { p.article.slug_propose = resources[0].slug; });
    await expect(legacy.prepare()).rejects.toThrow(/URL déjà utilisée/);
    const fixture = await batchFixture(); const batch = await fixture.prepare();
    const previous = { ...batch.scheduled[0], topicId: 'autre-identifiant', image: null };
    await expect(fixture.prepare([previous])).rejects.toThrow(/URL déjà utilisée/);
    await expect(fixture.prepare([{ ...previous, slug: 'autre-slug' }])).rejects.toThrow(/créneau/);
  });
  it('accepte une reprise identique, mais refuse URL modifiée et révision nouvelle sans historique', async () => {
    const fixture = await batchFixture(); const batch = await fixture.prepare();
    expect((await fixture.prepare(batch.scheduled)).actions.map(action => action.action)).toEqual(Array(7).fill('unchanged'));
    await fixture.change(0, 'production', p => { p.article.slug_propose = 'nouvelle-url'; });
    await expect(fixture.prepare(batch.scheduled)).rejects.toThrow(/immuables/);
    const fresh = await batchFixture();
    await fresh.change(0, 'metadata', m => { m.revision = 2; m.dates.updatedAt = '2026-01-03'; });
    await expect(fresh.prepare()).rejects.toThrow(/revision: 1/);
  });
  it('accepte une révision explicite plus récente et refuse un texte changé à révision identique', async () => {
    const fixture = await batchFixture(); const batch = await fixture.prepare();
    await fixture.change(0, 'metadata', m => { m.answer = 'Une réponse corrigée explicitement.'; });
    await expect(fixture.prepare(batch.scheduled)).rejects.toThrow(/révision déjà utilisée/);
    await fixture.change(0, 'metadata', m => { m.revision = 2; m.dates.updatedAt = '2026-01-03'; });
    const changed = await fixture.prepare(batch.scheduled);
    expect(changed.actions[0].action).toBe('updated');
    expect(changed.actions.slice(1).every(action => action.action === 'unchanged')).toBe(true);
  });
  it('rejette une couverture non explicitée et les dimensions sans couverture', async () => {
    const fixture = await batchFixture('2026-10-29', false);
    fixture.manifest.days[0].coverWidth = 1600;
    await expect(fixture.prepare()).rejects.toThrow(/Dimensions sans couverture/);
    delete fixture.manifest.days[0].coverWidth;
    await fixture.change(0, 'production', p => { p.article.image = 'REFERENCE.png'; });
    await expect(fixture.prepare()).rejects.toThrow(/couverture/);
  });
  it('respecte le seuil UTF-8 exact des sorties draft et scheduled, y compris avec des accents', async () => {
    const fixture = await batchFixture('2026-10-29', false);
    const productionPath = resolve(fixture.input, fixture.manifest.days[0].production);
    const metadataPath = resolve(fixture.input, fixture.manifest.days[0].metadata);
    const production = JSON.parse(await readFile(productionPath, 'utf8'));
    const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
    // Sidecar text contributes to the assembled article without enlarging
    // PRODUCTION.json itself; both inputs independently remain below 100 kB.
    metadata.answer = 'Réponse explicite. ' + 'a'.repeat(1100);
    await writeFile(metadataPath, JSON.stringify(metadata));
    production.article.markdown = `# ${production.article.title}\n\n`;
    const baseline = { ...adaptProduction(production, metadata, null), status: 'scheduled' };
    const paddingBytes = 100_000 - Buffer.byteLength(JSON.stringify(baseline, null, 2) + '\n');
    production.article.markdown += 'é'.repeat(Math.floor(paddingBytes / 2)) + 'x'.repeat(paddingBytes % 2);
    await writeFile(productionPath, JSON.stringify(production));
    expect(Buffer.byteLength(JSON.stringify(production))).toBeLessThanOrEqual(100_000);
    expect(Buffer.byteLength(JSON.stringify(metadata))).toBeLessThanOrEqual(100_000);
    const boundary = await fixture.prepare();
    expect(Buffer.byteLength(JSON.stringify(boundary.scheduled[0], null, 2) + '\n')).toBe(100_000);
    expect(Buffer.byteLength(JSON.stringify(boundary.articles[0], null, 2) + '\n')).toBe(99_996);
    production.article.markdown += 'x'; await writeFile(productionPath, JSON.stringify(production));
    await expect(fixture.prepare()).rejects.toThrow(/scheduled.*100001 octets/);
    production.article.markdown += 'xxxx'; await writeFile(productionPath, JSON.stringify(production));
    await expect(fixture.prepare()).rejects.toThrow(/draft.*100001 octets/);
  });
});

describe('Revue liée au lot exact', () => {
  it('invalide une revue après changement de source, métadonnées, couverture ou version du paquet', async () => {
    const fixture = await batchFixture(); const batch = await fixture.prepare();
    const review = { schemaVersion: 1, batchId: batch.batchId, campaignId: batch.campaignId, fingerprint: batch.fingerprint, reviewer: 'Relecteur de test', reviewedAt: '2026-01-03T12:00:00+01:00' };
    expect(validateBatchReview(review, batch)).toEqual(review);
    let previous = batch;
    for (const mutate of [
      () => fixture.change(0, 'production', p => { p.version = 'FIXTURE-V2'; }),
      () => fixture.change(0, 'production', p => { p.sources[0].portee = 'Portée documentaire modifiée.'; }),
      () => fixture.change(0, 'metadata', m => { m.answer = 'Une réponse modifiée.'; }),
      () => writeFile(resolve(fixture.input, fixture.manifest.days[0].cover!), 'AUTRE_COUVERTURE_FICTIVE'),
    ]) {
      await mutate(); const changed = await fixture.prepare();
      expect(changed.fingerprint).not.toBe(previous.fingerprint);
      expect(changed.articles[0].topicId).toBe(batch.articles[0].topicId);
      expect(() => validateBatchReview({ ...review, fingerprint: previous.fingerprint }, changed)).toThrow(/nouvelle revue/);
      previous = changed;
    }
  });
  it('refuse une revue incomplète, étrangère ou datée dans le futur', async () => {
    const fixture = await batchFixture(); const batch = await fixture.prepare();
    const review = { schemaVersion: 1, batchId: batch.batchId, campaignId: batch.campaignId, fingerprint: batch.fingerprint, reviewer: 'Relecteur de test', reviewedAt: '2026-01-03T12:00:00+01:00' };
    for (const patch of [{ reviewer: '' }, { fingerprint: '0'.repeat(64) }, { batchId: 'autre-lot' }, { campaignId: 'autre-campagne' }, { reviewedAt: '2099-01-01T07:00:00+01:00' }]) {
      expect(() => validateBatchReview({ ...review, ...patch }, batch)).toThrow();
    }
  });
});

describe('Entrées de lot confinées au dossier autorisé', () => {
  it('refuse traversée, chemin absolu, URL, antislash et fichier hors lot via jonction', async () => {
    const fixture = await batchFixture();
    await writeFile(resolve(fixture.root, 'outside.json'), '{}');
    for (const filename of ['../outside.json', resolve(fixture.root, 'outside.json'), 'C:/outside.json', 'https://example.org/x', 'J001\\PRODUCTION.json']) {
      await expect(inputFile(fixture.input, filename)).rejects.toThrow();
    }
    const outside = resolve(fixture.root, 'outside'); await mkdir(outside); await writeFile(resolve(outside, 'secret.json'), '{}');
    await symlink(outside, resolve(fixture.input, 'linked'), 'junction');
    await expect(inputFile(fixture.input, 'linked/secret.json')).rejects.toThrow(/hors du lot/);
    expect(await inputFile(fixture.input, 'J001/PRODUCTION.json')).toBe(await realpath(resolve(fixture.input, 'J001/PRODUCTION.json')));
  });
  it('refuse répertoire et JSON trop volumineux sans décodage partiel', async () => {
    const fixture = await batchFixture();
    await expect(inputFile(fixture.input, 'J001')).rejects.toThrow(/non ordinaire/);
    const file = resolve(fixture.input, 'large.json'); await writeFile(file, 'x'.repeat(100_001));
    await expect(inputFile(fixture.input, 'large.json')).rejects.toThrow(/volumineux/);
    await expect(readJson(file)).rejects.toThrow(/volumineux/);
  });
});
