import { readdir, readFile, lstat } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { resources } from '../src/data/resources.ts';
import { validateEditorialCatalog, isEditorialPublished } from '../src/lib/editorial/schema.ts';

export const repoRoot = fileURLToPath(new URL('../', import.meta.url));
export const editorialDirectory = resolve(repoRoot, 'src/content/editorial');

export async function loadEditorialCatalog(directory = editorialDirectory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const values = [];
  for (const entry of entries.filter((entry) => entry.name.endsWith('.json')).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isFile() || entry.isSymbolicLink()) throw new Error(`Fichier éditorial ordinaire attendu : ${entry.name}`);
    const file = resolve(directory, entry.name);
    if ((await lstat(file)).size > 100_000) throw new Error(`Article trop volumineux : ${entry.name} (maximum 100 Ko)`);
    const value = JSON.parse(await readFile(file, 'utf8'));
    if (entry.name !== `${value.topicId}.json`) throw new Error(`Nom de fichier différent du topicId : ${entry.name}`);
    values.push(value);
  }
  return validateEditorialCatalog(values, resources);
}

export async function validateEditorialImages(articles) {
  for (const article of articles) {
    if (!article.image) continue;
    const base = resolve(repoRoot, 'public');
    const path = resolve(base, `.${article.image.src}`);
    const rel = relative(base, path);
    if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Image hors du dossier public');
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 500_000) throw new Error(`Image invalide ou supérieure à 500 Ko : ${article.image.src}`);
    const { default: sharp } = await import('sharp');
    const metadata = await sharp(path).metadata();
    if (metadata.width !== article.image.width || metadata.height !== article.image.height || (metadata.pages ?? 1) > 1) throw new Error(`Dimensions incorrectes ou image animée : ${article.image.src}`);
  }
}

export function createEditorialManifest(articles, at = new Date()) {
  const published = articles.filter((article) => isEditorialPublished(article, at)).sort((a, b) => a.topicId.localeCompare(b.topicId));
  return {
    schemaVersion: 1,
    fingerprint: createHash('sha256').update(JSON.stringify(published)).digest('hex'),
    articles: published.map(({ topicId, slug, revision }) => ({ topicId, slug, revision })),
  };
}
