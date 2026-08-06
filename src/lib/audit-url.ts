export type ListingSnapshot = {
  url: string;
  source: string;
  title: string;
  description: string;
  price?: string;
  photoCount?: number;
  location?: string;
};

export type ListingTip = {
  code: string;
  title: string;
  observation: string;
  action: string;
};

export type ListingAnalysis = {
  title: string;
  summary: string;
  tips: [ListingTip, ListingTip];
  facts: string[];
  limit: string;
};

const clean = (value = '') => value.replace(/\s+/g, ' ').trim();
const has = (text: string, words: string[]) => words.some((word) => text.includes(word));

function titleTip(snapshot: ListingSnapshot): ListingTip | null {
  const title = clean(snapshot.title);
  const generic = /^(vente|maison|appartement|bien immobilier|à vendre)/i.test(title);
  if (title.length < 38 || generic) {
    return {
      code: 'title',
      title: 'Faites porter le titre par un avantage précis.',
      observation: title
        ? `Le titre lu est « ${title.slice(0, 110)} ». Il décrit surtout le type de bien.`
        : 'Aucun titre exploitable n’a pu être identifié dans la page.',
      action: 'Ajoutez le bénéfice qui distingue réellement le bien : emplacement, extérieur, lumière, agencement ou potentiel — sans superlatif vague.',
    };
  }
  return null;
}

function descriptionTip(snapshot: ListingSnapshot): ListingTip | null {
  const description = clean(snapshot.description);
  if (description.length < 420) {
    return {
      code: 'description-depth',
      title: 'Répondez aux questions avant qu’elles deviennent des freins.',
      observation: `Le texte accessible contient environ ${description.length} caractères. Il risque de laisser trop de questions ouvertes avant le premier contact.`,
      action: 'Structurez la description dans l’ordre d’une visite : situation, pièces et circulation, extérieur, état ou travaux, équipements, puis environnement.',
    };
  }
  return null;
}

function conditionTip(snapshot: ListingSnapshot): ListingTip | null {
  const text = clean(snapshot.description).toLowerCase();
  if (!has(text, ['dpe', 'diagnostic', 'classe énergie', 'classe energetique', 'travaux', 'rénov', 'renov', 'état', 'etat'])) {
    return {
      code: 'condition',
      title: 'Rendez l’état du bien immédiatement lisible.',
      observation: 'Le texte récupéré ne donne pas de repère clair sur l’état, les travaux ou la performance énergétique.',
      action: 'Ajoutez une phrase factuelle sur ce qui est déjà fait, ce qui reste à prévoir et le diagnostic énergétique. L’acheteur doit pouvoir mesurer l’effort à fournir.',
    };
  }
  return null;
}

function locationTip(snapshot: ListingSnapshot): ListingTip | null {
  const text = `${snapshot.title} ${snapshot.description}`.toLowerCase();
  if (!has(text, ['gare', 'école', 'ecole', 'commerce', 'bus', 'transport', 'quartier', 'centre', 'minutes', 'à pied', 'a pied'])) {
    return {
      code: 'location',
      title: 'Transformez l’adresse en usage quotidien.',
      observation: 'La proximité des services, transports ou lieux de vie n’apparaît pas clairement dans le contenu récupéré.',
      action: 'Citez deux repères concrets et vérifiables en temps réel : gare, école, commerce, centre ou accès routier. Évitez les formules vagues comme « idéalement situé ».',
    };
  }
  return null;
}

function photosTip(snapshot: ListingSnapshot): ListingTip | null {
  if (typeof snapshot.photoCount === 'number' && snapshot.photoCount < 8) {
    return {
      code: 'photos',
      title: 'Faites des photos une visite, pas un inventaire.',
      observation: `${snapshot.photoCount} photo${snapshot.photoCount > 1 ? 's ont' : ' a'} pu être identifiée${snapshot.photoCount > 1 ? 's' : ''}. Cela peut laisser des zones importantes hors champ.`,
      action: 'Commencez par l’image qui explique le mieux la promesse, puis montrez une circulation logique : entrée, pièce de vie, extérieur, chambres, pièces techniques et défauts utiles.',
    };
  }
  return null;
}

const fallbackTips: ListingTip[] = [
  {
    code: 'first-screen',
    title: 'Testez les trois secondes qui précèdent le clic.',
    observation: 'La photo principale, le titre et le prix sont lus ensemble avant le reste de l’annonce.',
    action: 'Affichez votre annonce à une personne qui ne connaît pas le bien pendant trois secondes, puis demandez-lui ce qu’elle a retenu. Corrigez le premier élément mal compris.',
  },
  {
    code: 'proofread',
    title: 'Faites relire la promesse par les faits.',
    observation: 'Une annonce convainc mieux quand chaque promesse est immédiatement soutenue par une information ou une image vérifiable.',
    action: 'Repérez les mots comme « beau », « rare », « idéal » ou « exceptionnel » et remplacez-les par une surface, une orientation, un temps de trajet ou un élément observable.',
  },
];

export function analyseListing(snapshot: ListingSnapshot): ListingAnalysis {
  const candidates = [
    titleTip(snapshot),
    photosTip(snapshot),
    descriptionTip(snapshot),
    conditionTip(snapshot),
    locationTip(snapshot),
    ...fallbackTips,
  ].filter((tip): tip is ListingTip => Boolean(tip));

  const unique = candidates.filter((tip, index, all) => all.findIndex((item) => item.code === tip.code) === index);
  const tips = unique.slice(0, 2) as [ListingTip, ListingTip];
  const facts = [
    snapshot.source ? `Source lue : ${snapshot.source}` : '',
    snapshot.title ? `Titre identifié : ${clean(snapshot.title).slice(0, 140)}` : 'Titre non identifié',
    snapshot.description ? `${clean(snapshot.description).length} caractères de description accessibles` : 'Description non accessible',
    typeof snapshot.photoCount === 'number' ? `${snapshot.photoCount} photo${snapshot.photoCount > 1 ? 's' : ''} identifiée${snapshot.photoCount > 1 ? 's' : ''}` : 'Nombre de photos non accessible',
    snapshot.price ? `Prix affiché identifié : ${clean(snapshot.price)}` : 'Prix non exploité automatiquement',
  ].filter(Boolean);

  return {
    title: 'Deux améliorations à tester en priorité.',
    summary: 'Elles portent sur ce que la page permet réellement d’observer. Modifiez un élément à la fois pour comprendre ce qui change.',
    tips,
    facts,
    limit: 'L’outil lit une annonce, pas la réaction réelle du marché. Il ne voit ni la qualité des contacts, ni la concurrence active complète, ni l’état du bien sur place. Mouaad peut confronter ces conseils à votre situation avant toute décision sur le prix.',
  };
}
