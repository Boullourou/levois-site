/**
 * Manifeste des images LEVOIS — emplacements définitifs.
 *
 * Chaque slot correspond à un emplacement du parcours. Quand `file` est null,
 * le composant ImageSlot affiche le traitement provisoire cohérent (surface
 * papier/argile avec grain) sans casser la composition : déposer le fichier
 * dans /public/images/ et renseigner `file` suffit à activer l'image.
 *
 * Règles impératives :
 * — Les visuels « Piloter » et « Apprendre » contiennent des chiffres fictifs :
 *   ils doivent être recadrés (objectPosition + zoom ci-dessous) pour que ces
 *   chiffres ne soient JAMAIS lisibles, y compris sur grand écran, et les
 *   textes alternatifs ne doivent jamais les mentionner.
 * — La photographie de rue représentant une autre personne ne doit jamais être
 *   présentée comme une photographie de Mouaad (alt neutre, aucun slot portrait).
 * — Aucun filtre gris ni voile sombre permanent sur les photographies.
 */

export interface ImageSlot {
  /** Fichier dans /public/images/ (ou /public/) — null = traitement provisoire */
  file: string | null;
  alt: string;
  /** object-position desktop / mobile */
  posDesktop?: string;
  posMobile?: string;
  /** Zoom de recadrage (scale CSS) pour protéger un détail — ex. chiffres fictifs */
  zoom?: number;
  /** Note d'intégration pour la matrice finale fichier → usage */
  note?: string;
}

export const images: Record<string, ImageSlot> = {
  // ——— Histoire d'ouverture (3) ———
  'hero-proprietaire': {
    file: null,
    alt: 'Un propriétaire chez lui, dans la lumière naturelle de son salon',
    note: 'Lecture du propriétaire — pleine largeur, chaleureuse, cadrage large.',
  },
  'hero-echange': {
    file: null,
    alt: 'Un échange posé autour d’une table, documents ouverts',
    note: 'La confrontation des deux lectures.',
  },
  'hero-acheteur': {
    file: null,
    alt: 'Une personne consulte des annonces immobilières sur son téléphone',
    note: 'Lecture du marché — sert aussi à la vignette froide de la Hero.',
  },

  // ——— Cinq situations (5) ———
  'situation-preparer': {
    file: null,
    alt: 'Un intérieur en cours de préparation avant mise en vente',
  },
  'situation-publiee': {
    file: null,
    alt: 'Une annonce immobilière récemment publiée, vue sur un écran',
  },
  'situation-peu-contacts': {
    file: null,
    alt: 'Une fenêtre lumineuse dans une pièce calme et silencieuse',
  },
  'situation-visites': {
    file: null,
    alt: 'Une porte d’entrée ouverte sur un couloir accueillant',
    note: 'Slot « Visites sans offre » — image manquante : traitement provisoire jusqu’à réception.',
  },
  'situation-longtemps': {
    file: null,
    alt: 'Une façade de maison sous une lumière de fin de journée',
    note: 'Slot « Vente ancienne » — image manquante : traitement provisoire jusqu’à réception.',
  },

  // ——— Cinq étapes de la méthode (5) ———
  'methode-comprendre': { file: null, alt: 'Des notes manuscrites organisées sur une table' },
  'methode-aligner': { file: null, alt: 'Un calendrier et des documents alignés avec soin' },
  'methode-positionner': { file: null, alt: 'Des annonces comparées côte à côte' },
  'methode-piloter': {
    file: null,
    alt: 'Un suivi attentif de la commercialisation, un levier à la fois',
    posDesktop: 'center 30%',
    posMobile: 'center 25%',
    zoom: 1.45,
    note: 'RECADRAGE OBLIGATOIRE : chiffres fictifs jamais lisibles, à toute taille d’écran. Ne jamais mentionner de chiffres dans l’alt.',
  },
  'methode-apprendre': {
    file: null,
    alt: 'Une lecture posée des signaux avant la décision suivante',
    posDesktop: 'center 35%',
    posMobile: 'center 30%',
    zoom: 1.45,
    note: 'RECADRAGE OBLIGATOIRE : chiffres fictifs jamais lisibles, à toute taille d’écran. Ne jamais mentionner de chiffres dans l’alt.',
  },

  // ——— Humains (3) ———
  'mouaad-portrait': {
    file: 'portrait-hero.webp',
    alt: 'Mouaad Boullourou, conseiller immobilier indépendant SAFTI sur le bassin chartrain',
    posDesktop: 'center 20%',
    posMobile: 'center 15%',
  },
  'mouaad-situation-1': {
    file: 'portrait-headshot.webp',
    alt: 'Mouaad Boullourou en échange avec un propriétaire',
    posDesktop: 'center 25%',
  },
  'mouaad-situation-2': {
    file: 'portrait-avatar.webp',
    alt: 'Mouaad Boullourou sur le terrain, dans le bassin chartrain',
  },
  'lea-portrait': {
    file: null,
    alt: 'Léa, la voix des contenus LEVOIS',
  },

  // ——— Territoire (2) ———
  'territoire-rue': {
    file: null,
    alt: 'Une rue du bassin chartrain en lumière naturelle',
    note: 'Photographie documentaire de rue. Si une personne y figure, alt strictement neutre — ne JAMAIS la présenter comme Mouaad.',
  },
  'territoire-paysage': {
    file: null,
    alt: 'Le paysage du bassin chartrain, la cathédrale au loin',
  },

  // ——— Conclusion (1) ———
  'conclusion': {
    file: null,
    alt: 'Une poignée de main simple à la fin d’un échange',
    note: 'CTA final — image la plus humaine, contraste du texte assuré par la composition, jamais par un voile.',
  },
};
