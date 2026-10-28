import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { resources } from '../src/data/resources.ts';
import { editorialBuildTime, isEditorialPublished } from '../src/lib/editorial/schema.ts';
import { repoRoot, loadEditorialCatalog, validateEditorialImages } from './editorial-io.mjs';

const at = editorialBuildTime(process.env.LEVOIS_EDITORIAL_BUILD_AT);
const articles = await loadEditorialCatalog();
await validateEditorialImages(articles);
const registry = [
  ...resources.map(({ id, slug, titre }) => ({ id, slug, title: titre })),
  ...articles.filter((article) => isEditorialPublished(article, at)).map(({ topicId, slug, title }) => ({ id: topicId, slug, title })),
].sort((a, b) => a.id.localeCompare(b.id));
await writeFile(resolve(repoRoot, 'src/lib/editorial/article-registry.generated.json'), `${JSON.stringify(registry, null, 2)}\n`);
await writeFile(resolve(repoRoot, 'src/lib/editorial/build-clock.generated.json'), `${JSON.stringify({ at: at.toISOString().replace(/\.\d{3}Z$/, 'Z') })}\n`);
console.log(`Préparation éditoriale : ${registry.length} identités publiques, horloge de compilation figée.`);
