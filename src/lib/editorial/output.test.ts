import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, mkdir, symlink, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { assertBundleOutput, assertBundleTarget, isWithin } from '../../../scripts/editorial-output.mjs';

const dirs: string[] = [];
afterEach(async () => { for (const path of dirs.splice(0)) await rm(path, {recursive:true,force:true}); });
async function fixture() {
  const base = await mkdtemp(resolve(tmpdir(),'levois-output-')); dirs.push(base);
  const repo = resolve(base,'repo');
  await mkdir(resolve(repo,'public'),{recursive:true});
  await mkdir(resolve(repo,'artifacts'),{recursive:true});
  return {base,repo};
}
describe('unpublished batch output boundaries', () => {
  it('rejects the repository root and every non-artifact repository output', async () => {
    const {repo} = await fixture();
    for (const path of [repo,resolve(repo,'public'),resolve(repo,'public','..review'),resolve(repo,'src/content/editorial'),resolve(repo,'artifacts-other')]) {
      await expect(assertBundleOutput(path,repo)).rejects.toThrow('Bundle');
    }
  });
  it('allows ignored artifacts and a distinct external directory', async () => {
    const {repo,base} = await fixture();
    await expect(assertBundleOutput(resolve(repo,'artifacts','new'),repo)).resolves.toBe(resolve(repo,'artifacts','new'));
    await expect(assertBundleOutput(resolve(base,'prepared'),repo)).resolves.toBe(resolve(base,'prepared'));
  });
  it('rejects a junction outside the repo that points into public', async () => {
    const {repo,base} = await fixture(), alias = resolve(base,'alias');
    await symlink(resolve(repo,'public'),alias,'junction');
    await expect(assertBundleOutput(resolve(alias,'new'),repo)).rejects.toThrow('Bundle');
  });
  it('rejects an internal bundle subdirectory junction escaping to public', async () => {
    const {repo} = await fixture(), out = resolve(repo,'artifacts','bundle');
    await mkdir(out);
    await symlink(resolve(repo,'public'),resolve(out,'articles'),'junction');
    await expect(assertBundleTarget(out,resolve(out,'articles','new.json'))).rejects.toThrow('jonction');
    await expect(assertBundleTarget(out,resolve(out,'review','new.json'))).resolves.toBe(resolve(out,'review','new.json'));
  });
  it('treats dot-prefixed names as descendants, not parent traversals', () => {
    expect(isWithin(resolve('/root/public'),resolve('/root/public/..review'))).toBe(true);
    expect(isWithin(resolve('/root/public'),resolve('/root/elsewhere'))).toBe(false);
  });
  it('does not trust an artifacts junction that resolves to public', async () => {
    const {repo} = await fixture();
    await rm(resolve(repo,'artifacts'),{recursive:true});
    await symlink(resolve(repo,'public'),resolve(repo,'artifacts'),'junction');
    await expect(assertBundleOutput(resolve(repo,'artifacts','new'),repo)).rejects.toThrow('Bundle');
  });
  it('rejects a target entering public even when output is a repository ancestor', async () => {
    const {repo,base} = await fixture();
    await expect(assertBundleTarget(base,resolve(repo,'public','draft.json'),repo)).rejects.toThrow('Bundle');
  });
  it('rejects unresolved junctions rather than following them later on write', async () => {
    const {repo,base} = await fixture();
    const alias = resolve(base,'dangling');
    await symlink(resolve(base,'missing'),alias,'junction');
    await expect(assertBundleOutput(resolve(alias,'new'),repo)).rejects.toThrow('non résolu');
  });
});
