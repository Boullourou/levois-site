import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, copyFile, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('../../../', import.meta.url));
const temporaryRoots: string[] = [];
const example = {
  schemaVersion: 1, topicId: 'test-import-001', revision: 1, slug: 'test-import-seulement', title: 'Article de test', summary: 'Résumé technique.', answer: 'Réponse technique.',
  sections: [{ heading: 'Test', paragraphs: ['Texte de test.'] }], author: { name: 'Test', role: 'Test' },
  dates: { createdAt: '2026-10-27T10:00:00+01:00', publishAt: '2026-10-28T07:00:00+01:00' }, sources: [], scope: 'Test.', limits: ['Test.'], image: null, category: 'vendre', primaryDestination: '/situer-ma-vente/', status: 'draft',
};
async function sandbox() {
  await mkdir(resolve(root, '.cache'), { recursive: true });
  // The isolated repository shares only installed parser dependencies via
  // Node's ancestor resolution; its content and import lock remain isolated.
  const directory = await mkdtemp(resolve(root, '.cache/levois-editorial-test-'));
  temporaryRoots.push(directory);
  for (const file of ['scripts/editorial-import.mjs', 'scripts/editorial-io.mjs', 'src/lib/editorial/schema.ts', 'src/lib/editorial/markdown.ts', 'src/data/resources.ts']) {
    await mkdir(dirname(resolve(directory, file)), { recursive: true });
    await copyFile(resolve(root, file), resolve(directory, file));
  }
  await writeFile(resolve(directory, 'package.json'), '{"type":"module"}');
  await mkdir(resolve(directory, 'src/content/editorial'), { recursive: true });
  await writeFile(resolve(directory, 'input.json'), JSON.stringify(example));
  const run = (...args: string[]) => exec(process.execPath, ['scripts/editorial-import.mjs', '--file', 'input.json', ...args], { cwd: directory });
  return { directory, run };
}
afterEach(async () => {
  for (const directory of temporaryRoots.splice(0)) {
    if (!directory.startsWith(resolve(root, '.cache/levois-editorial-test-'))) throw new Error('Unexpected temporary path');
    await rm(directory, { recursive: true, force: true });
  }
});

describe('CLI import in an isolated temporary repository', () => {
  it('is read-only by default and a repeated write produces exactly one file', async () => {
    const { directory, run } = await sandbox();
    expect(JSON.parse((await run()).stdout).written).toBe(false);
    expect(await readdir(resolve(directory, 'src/content/editorial'))).toEqual([]);
    expect(JSON.parse((await run('--write')).stdout).action).toBe('created');
    expect(JSON.parse((await run('--write')).stdout).action).toBe('unchanged');
    expect(await readdir(resolve(directory, 'src/content/editorial'))).toEqual(['test-import-001.json']);
  });
  it('serializes concurrent writes and safely accepts a retry after a lock conflict', async () => {
    const { directory, run } = await sandbox();
    const results = await Promise.allSettled([run('--write'), run('--write')]);
    expect(results.some((result) => result.status === 'fulfilled')).toBe(true);
    expect(JSON.parse((await run('--write')).stdout).action).toBe('unchanged');
    expect(await readdir(resolve(directory, 'src/content/editorial'))).toEqual(['test-import-001.json']);
    const saved = JSON.parse(await readFile(resolve(directory, 'src/content/editorial/test-import-001.json'), 'utf8'));
    expect(saved).toEqual(example);
  });
  it('does not overwrite an accepted revision when a retry has different text', async () => {
    const { directory, run } = await sandbox();
    await run('--write');
    await writeFile(resolve(directory, 'input.json'), JSON.stringify({ ...example, title: 'Altération' }));
    await expect(run('--write')).rejects.toThrow();
    const saved = JSON.parse(await readFile(resolve(directory, 'src/content/editorial/test-import-001.json'), 'utf8'));
    expect(saved.title).toBe(example.title);
  });
});
