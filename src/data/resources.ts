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
    question: 'Dans quel ordre prendre les décisions avant de publier ?',
    benefice: 'Aligner documents, préparation, prise de vues et hypothèse de prix — dans le bon ordre.',
    duree: '7 min de lecture',
    cta: 'Lire',
  },
  {
    id: 'premiere-impression-annonce',
    slug: 'premiere-impression-annonce',
    titre: 'Vérifier la première impression de son annonce',
    question: 'Que voit réellement un acheteur dans les premières secondes ?',
    benefice: 'Un mini-test pour évaluer votre première photo, votre titre et ce qui est compris immédiatement.',
    duree: '5 min + test',
    cta: 'Vérifier',
  },
  {
    id: 'annonce-vue-peu-de-contacts',
    slug: 'annonce-vue-peu-de-contacts',
    titre: 'Annonce vue, mais peu de contacts',
    question: 'Pourquoi une annonce consultée ne génère-t-elle pas de demandes ?',
    benefice: 'Distinguer vue, ouverture, contact et visite — et savoir quel levier vérifier en premier.',
    duree: '6 min de lecture',
    cta: 'Comprendre',
  },
  {
    id: 'retours-de-visite',
    slug: 'retours-de-visite',
    titre: 'Analyser les retours de visite',
    question: 'Comment lire ce que les visites vous disent vraiment ?',
    benefice: 'Organiser les retours, distinguer politesse et objection, repérer un motif qui se répète.',
    duree: '6 min + grille',
    cta: 'Comprendre',
  },
  {
    id: 'verifier-avant-baisse-prix',
    slug: 'verifier-avant-baisse-prix',
    titre: 'Vérifier avant de modifier son prix',
    question: 'Faut-il vraiment baisser le prix — et comment le savoir ?',
    benefice: 'Les vérifications à faire avant toute baisse, et les risques des baisses successives.',
    duree: '7 min de lecture',
    cta: 'Vérifier',
  },
  {
    id: 'reprendre-commercialisation',
    slug: 'reprendre-commercialisation',
    titre: 'Reprendre une commercialisation ancienne',
    question: 'Comment repartir sur de bonnes bases après des mois de vente ?',
    benefice: 'Comprendre l’usure d’une annonce et choisir entre pause, repositionnement ou continuité.',
    duree: '8 min de lecture',
    cta: 'Commencer',
  },
];

export function getResource(id: string): ResourceMeta {
  const r = resources.find((r) => r.id === id);
  if (!r) throw new Error(`Ressource inconnue : ${id}`);
  return r;
}
