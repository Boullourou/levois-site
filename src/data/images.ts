/**
 * Manifeste des images LEVOIS — pack refonte visuelle V2 (19 images).
 *
 * Chaque asset pointe vers des dérivés WebP+AVIF déjà générés dans
 * /public/images ({slug}-{w}.{ext}), avec dimensions intrinsèques et
 * object-position desktop/mobile.
 *
 * Règles impératives déjà appliquées en amont (pipeline) :
 * — methode-positionner / methode-piloter / methode-apprendre sont des
 *   DÉRIVÉS RECADRÉS des originaux à chiffres fictifs : aucun chiffre n'y est
 *   lisible et les originaux ne sont jamais publiés. Les alt ne mentionnent
 *   aucun chiffre.
 * — territoire-rue : le personnage n'est PAS Mouaad — alt strictement neutre.
 * — Aucune désaturation ni voile permanent (appliqué au rendu).
 *
 * slug=null : emplacement traité graphiquement par le composant (pas de photo).
 */

export interface ImageAsset {
  slug: string | null;
  widths: number[];
  /** dimensions intrinsèques du plus grand dérivé (anti-CLS) */
  w: number;
  h: number;
  alt: string;
  posDesktop?: string;
  posMobile?: string;
}

export const images: Record<string, ImageAsset> = {
  // ——— Hero, narration en trois temps ———
  'hero-proprietaires': {
    slug: 'hero-proprietaires', widths: [1536, 1152, 768, 480], w: 1536, h: 864,
    alt: 'Un couple présente la maison dans laquelle il vit, ouverte sur le jardin et la piscine',
    posDesktop: 'center 42%', posMobile: 'center 40%',
  },
  'hero-marche': {
    slug: 'hero-marche', widths: [1536, 1152, 768, 480], w: 1536, h: 864,
    alt: 'Une acheteuse compare plusieurs annonces immobilières sur son téléphone',
    posDesktop: 'center', posMobile: '35% center',
  },
  'hero-dialogue': {
    slug: 'hero-dialogue', widths: [1536, 1152, 768, 480], w: 1536, h: 864,
    alt: 'Des propriétaires échangent avec deux professionnels autour de leur projet',
    posDesktop: 'center 35%', posMobile: 'center 30%',
  },

  // ——— Situations (photos de diagnostic) ———
  'situation-preparer': {
    slug: 'situation-preparer', widths: [1000, 640, 420], w: 1000, h: 1000,
    alt: 'Un intérieur lumineux préparé avec soin avant une mise en vente',
    posDesktop: 'center', posMobile: 'center',
  },
  'situation-publiee': {
    slug: 'situation-publiee', widths: [1000, 640, 420], w: 1000, h: 1000,
    alt: 'Un propriétaire consulte son téléphone à son bureau',
    posDesktop: 'center 35%', posMobile: 'center 35%',
  },
  'situation-peu-contacts': {
    slug: 'situation-peu-contacts', widths: [1000, 640, 420], w: 1000, h: 1000,
    alt: 'Un propriétaire analyse sa situation devant son ordinateur',
    posDesktop: 'center', posMobile: 'center',
  },
  // Pas de photo définitive → traitement graphique (composant)
  'situation-visites': { slug: null, widths: [], w: 4, h: 3, alt: '' },
  'situation-longtemps': { slug: null, widths: [], w: 4, h: 3, alt: '' },

  // ——— Quatre profils illustratifs (jamais présentés comme clients réels) ———
  'profil-couple': {
    slug: 'profil-couple', widths: [1022, 680, 440], w: 1022, h: 1536,
    alt: 'Un couple devant une maison en pierre dans la lumière du soir',
    posDesktop: 'center 30%', posMobile: 'center 25%',
  },
  'profil-femme': {
    slug: 'profil-femme', widths: [1022, 680, 440], w: 1022, h: 1536,
    alt: 'Une propriétaire devant une maison en pierre',
    posDesktop: 'center 25%', posMobile: 'center 20%',
  },
  'profil-jeune': {
    slug: 'profil-jeune', widths: [1022, 680, 440], w: 1022, h: 1536,
    alt: 'Un jeune propriétaire tient les clés de son logement',
    posDesktop: 'center 25%', posMobile: 'center 20%',
  },
  'profil-famille': {
    slug: 'profil-famille', widths: [1022, 680, 440], w: 1022, h: 1536,
    alt: 'Une famille marche dans le jardin de sa maison',
    posDesktop: 'center 30%', posMobile: 'center 25%',
  },

  // ——— Mouaad (visages réels) ———
  'mouaad-terrain': {
    slug: 'mouaad-terrain', widths: [1022, 680, 440], w: 1022, h: 1536,
    alt: 'Mouaad Boullourou prend des notes devant une maison du bassin chartrain',
    posDesktop: 'center 20%', posMobile: 'center 15%',
  },
  'mouaad-rdv': {
    slug: 'mouaad-rdv', widths: [1022, 680, 440], w: 1022, h: 1536,
    alt: 'Mouaad Boullourou échange avec un propriétaire autour de son projet',
    posDesktop: 'center 25%', posMobile: 'center 20%',
  },

  // ——— Léa : pas de photo dans le pack → traitement éditorial graphique ———
  'lea-portrait': { slug: null, widths: [], w: 1, h: 1, alt: '' },

  // ——— Méthode : cinq étapes ———
  'methode-comprendre': {
    slug: 'methode-comprendre', widths: [1200, 760, 480], w: 1200, h: 686,
    alt: 'Documents, plans et notes réunis pour comprendre un projet immobilier',
    posDesktop: 'center', posMobile: 'center',
  },
  'methode-aligner': {
    slug: 'methode-aligner', widths: [1200, 760, 480], w: 1200, h: 686,
    alt: 'Une maison reliée aux différentes dimensions d’une stratégie de vente',
    posDesktop: 'center', posMobile: 'center',
  },
  // Dérivé recadré — aucun chiffre lisible
  'methode-positionner': {
    slug: 'methode-positionner', widths: [1200, 760, 480], w: 1200, h: 338,
    alt: 'Des mains annotent au stylo une carte locale posée sur un bureau',
    posDesktop: 'center', posMobile: 'center',
  },
  // Dérivé recadré — aucun chiffre lisible
  'methode-piloter': {
    slug: 'methode-piloter', widths: [556, 400], w: 556, h: 458,
    alt: 'Un carnet de stratégie et une lampe dans une lumière chaude',
    posDesktop: 'center', posMobile: 'center',
  },
  // Dérivé recadré (côté « avant ») — aucun chiffre de marché lisible
  'methode-apprendre': {
    slug: 'methode-apprendre', widths: [600, 400], w: 600, h: 878,
    alt: 'Un propriétaire face à un mur de questions dispersées, avant la mise en méthode',
    posDesktop: 'center', posMobile: 'center 20%',
  },

  // ——— Territoire ———
  'territoire-carte': {
    slug: 'territoire-carte', widths: [1536, 1000, 560], w: 1536, h: 878,
    alt: 'Vue aérienne de Chartres et des communes voisines au coucher du soleil',
    posDesktop: 'center', posMobile: 'center',
  },
  'territoire-rue': {
    // Le personnage n'est PAS Mouaad — alt strictement neutre, jamais nommé.
    slug: 'territoire-rue', widths: [1536, 1000, 560], w: 1536, h: 878,
    alt: 'Une rue pavée de Lèves avec la cathédrale de Chartres au loin',
    posDesktop: 'center 40%', posMobile: 'center 45%',
  },
};
