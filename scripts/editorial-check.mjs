import { loadEditorialCatalog, validateEditorialImages } from './editorial-io.mjs';
const articles = await loadEditorialCatalog();
await validateEditorialImages(articles);
console.log(`Contrat éditorial valide : ${articles.length} article(s), identifiants/URL uniques, images vérifiées.`);
