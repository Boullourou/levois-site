import { realpath, lstat } from 'node:fs/promises';
import { resolve, relative, isAbsolute, dirname, basename } from 'node:path';

export function isWithin(base, target) {
  const rel = relative(base, target);
  return rel !== '..' && !rel.startsWith('../') && !rel.startsWith('..\\') && !isAbsolute(rel);
}

/** Resolve existing junctions, including parents of not-yet-created outputs. */
export async function canonicalFuturePath(path) {
  const absolute = resolve(path);
  try { return await realpath(absolute); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const entry = await lstat(absolute).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (entry?.isSymbolicLink()) throw new Error('Lien de sortie non résolu interdit');
    const parent = dirname(absolute);
    if (parent === absolute) throw error;
    return resolve(await canonicalFuturePath(parent), basename(absolute));
  }
}

export async function assertBundleOutput(output, repoRoot) {
  const out = await canonicalFuturePath(output);
  const repo = await realpath(repoRoot);
  const artifacts = await canonicalFuturePath(resolve(repo, 'artifacts'));
  for (const directory of ['public', 'src/content/editorial']) {
    const protectedPath = await canonicalFuturePath(resolve(repo, directory));
    if (isWithin(protectedPath, out)) throw new Error('Bundle de revue interdit dans les fichiers publics ou le catalogue');
  }
  // Inside the repository only the ignored artifact area can hold raw drafts.
  // repoRoot itself would otherwise make out/public a publishable directory.
  if (isWithin(repo, out) && !isWithin(artifacts, out)) throw new Error('Bundle de revue : utiliser artifacts/ ou un dossier extérieur au dépôt, jamais les fichiers publics');
  return out;
}

export async function assertBundleTarget(output, target, repoRoot) {
  const resolved = await canonicalFuturePath(target);
  if (!isWithin(output, resolved)) throw new Error('Sortie de bundle hors dossier par lien ou jonction interdite');
  if (repoRoot) await assertBundleOutput(resolved, repoRoot);
  return resolved;
}
