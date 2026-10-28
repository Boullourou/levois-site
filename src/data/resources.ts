export interface ResourceMeta {
  id: string;
  slug: string;
  titre: string;
  question: string;
  benefice: string;
  duree: string;
  cta: string;
  imageSlot?: string;
}

export const resources: ResourceMeta[] = [
  {
    id: 'lancement-coherent',
    slug: 'lancement-coherent',
    titre: 'Construire un lancement cohérent',
    question: 'Dans quel ordre prendre les décisions avant de publier ?',
    benefice: 'Aligner documents, préparation, prise de vues et prix envisagé — dans le bon ordre.',
    duree: 'Guide pratique',
    cta: 'Lire',
    imageSlot: 'ressource-lancement-coherent',
  },
  {
    id: 'premiere-impression-annonce',
    slug: 'premiere-impression-annonce',
    titre: 'Vérifier la première impression de son annonce',
    question: 'Que voit réellement un acheteur dans les premières secondes ?',
    benefice: 'Un mini-test pour évaluer votre première photo, votre titre et ce qui est compris immédiatement.',
    duree: 'Guide et exercice',
    cta: 'Vérifier',
    imageSlot: 'ressource-premiere-impression',
  },
  {
    id: 'annonce-vue-peu-de-contacts',
    slug: 'annonce-vue-peu-de-contacts',
    titre: 'Annonce vue, mais peu de contacts',
    question: 'Pourquoi une annonce consultée ne génère-t-elle pas de demandes ?',
    benefice: 'Distinguer vue, ouverture, contact et visite — et savoir quel levier vérifier en premier.',
    duree: 'Guide pratique',
    cta: 'Comprendre',
    imageSlot: 'ressource-peu-contacts',
  },
  {
    id: 'retours-de-visite',
    slug: 'retours-de-visite',
    titre: 'Analyser les retours de visite',
    question: 'Comment lire ce que les visites vous disent vraiment ?',
    benefice: 'Organiser les retours, distinguer politesse et objection, repérer un motif qui se répète.',
    duree: 'Guide et grille',
    cta: 'Comprendre',
    imageSlot: 'ressource-retours-visite',
  },
  {
    id: 'verifier-avant-baisse-prix',
    slug: 'verifier-avant-baisse-prix',
    titre: 'Vérifier avant de modifier son prix',
    question: 'Faut-il vraiment baisser le prix — et comment le savoir ?',
    benefice: "Les vérifications à faire avant toute baisse, et les risques des baisses successives.",
    duree: 'Guide pratique',
    cta: 'Vérifier',
    imageSlot: 'ressource-verifier-prix',
  },
  {
    id: 'reprendre-commercialisation',
    slug: 'reprendre-commercialisation',
    titre: 'Reprendre une commercialisation ancienne',
    question: 'Comment repartir sur de bonnes bases après des mois de vente ?',
    benefice: "Relire l’historique d’une annonce et examiner une pause, une reprise ciblée ou la poursuite de la vente.",
    duree: 'Guide pratique',
    cta: 'Commencer',
    imageSlot: 'ressource-reprendre-commercialisation',
  },
  {
    id: 'marge-negociation-erreur-25000',
    slug: 'marge-negociation-erreur-25000',
    titre: 'Faut-il ajouter une marge de négociation au prix de vente ?',
    question: 'Que risque-t-on à afficher plus cher pour pouvoir négocier ensuite ?',
    benefice: 'Comprendre les filtres de recherche et comparer les ventes avant de choisir son prix, sans présumer du montant ni du délai de vente.',
    duree: 'Guide pratique',
    cta: 'Comprendre',
    imageSlot: 'resource-marge-negociation',
  },
];

export function getResource(id: string): ResourceMeta {
  const r = resources.find((r) => r.id === id);
  if (!r) throw new Error(`Ressource inconnue : ${id}`);
  return r;
}
