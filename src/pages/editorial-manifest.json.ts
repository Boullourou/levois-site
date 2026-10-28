import { createHash } from 'node:crypto';
import { getPublishedEditorialArticles } from '../lib/editorial/catalog';

export const prerender = true;

export function GET() {
  const articles = getPublishedEditorialArticles().sort((a, b) => a.topicId.localeCompare(b.topicId));
  const manifest = {
    schemaVersion: 1,
    fingerprint: createHash('sha256').update(JSON.stringify(articles)).digest('hex'),
    articles: articles.map(({ topicId, slug, revision }) => ({ topicId, slug, revision })),
  };
  return new Response(JSON.stringify(manifest), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
