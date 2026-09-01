const PUBLIC_PATHS = new Set([
  '/',
  '/404',
  '/accompagnement',
  '/audit-annonce',
  '/carte',
  '/composants',
  '/confidentialite',
  '/contact',
  '/ma-recherche',
  '/mentions-legales',
  '/methode',
  '/mouaad',
  '/recommander',
  '/rejoindre',
  '/ressources',
  '/ressources/lancement-coherent',
  '/ressources/premiere-impression-annonce',
  '/ressources/annonce-vue-peu-de-contacts',
  '/ressources/retours-de-visite',
  '/ressources/verifier-avant-baisse-prix',
  '/ressources/reprendre-commercialisation',
  '/situer-ma-vente',
  '/situer-ma-vente/resultat',
  '/votre-rue',
]);

/**
 * Buckets navigation into known public routes. Unknown or user-shaped paths
 * never leave the browser as-is.
 */
export function safePublicPath(value: unknown): string {
  if (typeof value !== 'string' || !value) return '/other';
  try {
    const parsed = new URL(value, 'https://levois.fr');
    const collapsed = parsed.pathname.replace(/\/{2,}/g, '/');
    const normalized = collapsed === '/' ? '/' : collapsed.replace(/\/$/, '');
    return PUBLIC_PATHS.has(normalized) ? normalized : '/other';
  } catch {
    return '/other';
  }
}
