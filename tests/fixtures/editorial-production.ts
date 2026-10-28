import type { ProductionMetadata } from '../../src/lib/editorial/production';

/** Synthetic, never imported by the site's content catalog. */
export function productionFixture(index = 1, date = '2026-10-29') {
  const id = `J${String(index).padStart(3, '0')}`;
  const title = `Une question de test ${index}`;
  return {
    version: 'FIXTURE-V1', id, date, timezone: 'Europe/Paris',
    ready_for_production: true, research_by_limova: false, editorial_rewrite_by_limova: false,
    source_read_date: '2026-01-02', destination: 'https://levois.fr/votre-rue/',
    sources: [
      { id: 'DOCUMENT', editeur: 'Document de test', url: 'https://example.org/document' as string | null, lecture: '2026-01-02', portee: 'Document fictif : aucune preuve locale.' },
      { id: 'METHODE', editeur: 'Méthode de test', url: null as string | null, lecture: '2026-01-02', portee: 'Méthode fictive : aucun montant ou résultat commercial.' },
    ],
    limites: 'Aucune estimation ni résultat financier garanti.',
    article: {
      time: '07:00', title, slug_propose: `question-test-${index}`, meta_description: 'Résumé explicitement fourni dans la fixture.',
      markdown: `# ${title}\r\n\r\nUn texte **conservé**, avec [un document](https://example.org/document).\r\n\r\n## Les limites\r\n\r\n- Un premier point\r\n  - Une réserve\r\n\r\n> Aucune conclusion financière.\r\n`,
      image: 'REFERENCE.png' as string | null,
      image_alt: 'Illustration symbolique de test.', image_caption: 'Illustration IA non localisée, sans lien avec un bien réel.',
    },
    carousel: { time: '11:30', caption: 'Ce texte social ne devient pas le corps de l’article.' },
    video: { time: '17:00', voice_exact: 'Ce texte vidéo ne devient pas la réponse.' },
    status: { scheduled: true },
  };
}

export function productionMetadataFixture(index = 1): ProductionMetadata {
  return {
    schemaVersion: 1, campaignId: 'campagne-test', dayId: `J${String(index).padStart(3, '0')}`, revision: 1,
    author: { name: 'Auteur fictif', role: 'Exemple technique, sans publication' },
    dates: { createdAt: '2026-01-01' }, answer: 'Réponse explicite du fichier complémentaire.',
    scope: 'Fixture de test uniquement.', category: 'ventes-locales',
  };
}
