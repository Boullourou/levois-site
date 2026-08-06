import type { ListingAnalysis, ListingTip } from './audit-url';

export type ListingDuration = 'moins-7' | '7-30' | 'plus-30';
export type ListingSignal = 'peu-vues' | 'vues-sans-contact' | 'contacts-sans-visite' | 'visites-sans-offre' | 'offre-recue';

export type BlockedAuditResult = {
  analysis: ListingAnalysis;
  resource: { href: string; label: string; description: string };
};

const durationLabels: Record<ListingDuration, string> = {
  'moins-7': 'Annonce publiée depuis moins de 7 jours',
  '7-30': 'Annonce publiée depuis 7 à 30 jours',
  'plus-30': 'Annonce publiée depuis plus d’un mois',
};

const resultBySignal: Record<ListingSignal, {
  title: string;
  summary: string;
  tips: [ListingTip, ListingTip];
  resource: BlockedAuditResult['resource'];
}> = {
  'peu-vues': {
    title: 'Le premier problème est la visibilité.',
    summary: 'Avant d’interpréter l’absence de contacts, il faut vérifier si suffisamment d’acheteurs pertinents voient réellement l’annonce.',
    tips: [
      { code: 'diffusion', title: 'Vérifiez où l’annonce apparaît réellement.', observation: 'Peu de vues signifie que les étapes suivantes disposent de trop peu de réactions pour conclure.', action: 'Recherchez le bien comme le ferait un acheteur et contrôlez la commune, la catégorie, les critères, la position dans les résultats et l’affichage mobile.' },
      { code: 'first-screen', title: 'Relisez le trio photo, titre et prix.', observation: 'Ces trois éléments décident du clic avant que la description ne soit lue.', action: 'Comparez-les aux annonces visibles dans la même recherche et changez un seul élément à la fois pour mesurer son effet.' },
    ],
    resource: { href: '/ressources/premiere-impression-annonce', label: 'Travailler la première impression', description: 'La méthode pour vérifier ce qui est compris avant le clic.' },
  },
  'vues-sans-contact': {
    title: 'L’annonce est vue, mais ne déclenche pas de contact.',
    summary: 'La diffusion fonctionne. Le décrochage se situe probablement entre la première impression et l’envie d’en savoir plus.',
    tips: [
      { code: 'promise', title: 'Rendez l’avantage principal évident.', observation: 'Des vues sans message indiquent que les personnes exposées ne trouvent pas encore une raison suffisante d’avancer.', action: 'Faites apparaître dès la photo principale, le titre et les premières lignes ce qui distingue réellement le bien.' },
      { code: 'questions', title: 'Répondez aux freins avant le contact.', observation: 'Une information absente peut suffire à faire passer un acheteur à l’annonce suivante.', action: 'Vérifiez que le texte explique l’agencement, l’état, les travaux, le DPE, l’extérieur et les repères utiles du secteur.' },
    ],
    resource: { href: '/ressources/annonce-vue-peu-de-contacts', label: 'Comprendre les vues sans contact', description: 'La ressource dédiée exactement à ce point de blocage.' },
  },
  'contacts-sans-visite': {
    title: 'L’intérêt existe, mais ne devient pas une visite.',
    summary: 'L’annonce provoque une réaction. Il faut maintenant comprendre ce qui est découvert ou mal compris pendant les premiers échanges.',
    tips: [
      { code: 'objections', title: 'Notez les questions qui reviennent.', observation: 'Les conversations contiennent déjà les raisons pour lesquelles les personnes avancent ou s’arrêtent.', action: 'Regroupez les trois questions ou objections les plus fréquentes et vérifiez si l’annonce pouvait y répondre plus tôt.' },
      { code: 'qualification', title: 'Séparez curiosité et projet cohérent.', observation: 'Tous les contacts ne sont pas des acheteurs capables ou prêts à visiter.', action: 'Vérifiez budget, secteur, calendrier et financement avant d’interpréter le nombre de messages comme une demande réelle.' },
    ],
    resource: { href: '/ressources/annonce-vue-peu-de-contacts', label: 'Transformer l’intérêt en échange utile', description: 'Les vérifications à faire entre la vue, le message et la visite.' },
  },
  'visites-sans-offre': {
    title: 'Le décrochage arrive après la visite.',
    summary: 'L’annonce obtient des rendez-vous. La priorité est désormais l’écart entre ce qu’elle laisse imaginer et ce que les visiteurs découvrent sur place.',
    tips: [
      { code: 'feedback', title: 'Reconstituez les retours de chaque visite.', observation: 'Plusieurs visites sans offre forment un signal, mais pas encore une explication.', action: 'Notez les remarques, hésitations et silences par thème : état, agencement, environnement, travaux, prix et calendrier.' },
      { code: 'gap', title: 'Cherchez l’écart entre promesse et réalité.', observation: 'Une annonce peut attirer pour une raison qui ne résiste pas à la visite.', action: 'Comparez la première impression aux points découverts sur place avant de modifier le texte, les photos ou le positionnement.' },
    ],
    resource: { href: '/ressources/retours-de-visite', label: 'Interpréter les retours de visite', description: 'La méthode pour transformer les réactions en décisions utiles.' },
  },
  'offre-recue': {
    title: 'L’annonce a déclenché une décision.',
    summary: 'Le sujet principal n’est plus d’obtenir davantage de réactions, mais de comprendre la solidité de l’offre et ses conséquences pour votre projet.',
    tips: [
      { code: 'conditions', title: 'Lisez toutes les conditions de l’offre.', observation: 'Le montant seul ne dit pas si la proposition est solide ni compatible avec votre calendrier.', action: 'Vérifiez financement, conditions suspensives, apport, calendrier, mobilier éventuel et date souhaitée de signature.' },
      { code: 'project', title: 'Comparez l’offre à votre projet complet.', observation: 'La meilleure réponse dépend aussi de votre prochain logement, de vos délais et de votre marge de sécurité.', action: 'Mesurez ce que chaque réponse change concrètement avant d’accepter, refuser ou négocier.' },
    ],
    resource: { href: '/situer-ma-vente', label: 'Situer la suite de ma vente', description: 'Reprendre votre situation complète avant de décider.' },
  },
};

export function analyseBlockedListing(duration: ListingDuration, signal: ListingSignal): BlockedAuditResult {
  if (duration === 'moins-7' && signal !== 'offre-recue') {
    return {
      analysis: {
        title: 'Il est encore tôt pour tirer une conclusion.',
        summary: 'Moins d’une semaine donne peu de recul. Le bon réflexe est de sécuriser les mesures avant de modifier plusieurs éléments.',
        tips: [
          { code: 'measure', title: 'Créez votre point de départ aujourd’hui.', observation: 'Sans relevé initial, les prochains changements seront impossibles à comparer.', action: 'Notez les vues, favoris, contacts et portails aujourd’hui, puis relevez les mêmes chiffres dans quelques jours.' },
          { code: 'mobile', title: 'Contrôlez l’annonce comme un acheteur.', observation: 'Une erreur de catégorie, une photo mal cadrée ou une information coupée peut fausser le lancement.', action: 'Ouvrez l’annonce sur téléphone, lancez la recherche correspondante et vérifiez chaque information avant de changer le prix.' },
        ],
        facts: [durationLabels[duration], 'Moins de recul qu’un cycle normal de diffusion'],
        limit: 'Ce résultat repose sur les réponses fournies, car le portail refuse la lecture automatique. Il ne conclut ni sur la valeur du bien ni sur son prix.',
      },
      resource: { href: '/ressources/lancement-coherent', label: 'Sécuriser le lancement', description: 'Les repères à relever avant toute modification.' },
    };
  }

  const result = resultBySignal[signal];
  return {
    analysis: {
      title: result.title,
      summary: result.summary,
      tips: result.tips,
      facts: [durationLabels[duration], `Signal déclaré : ${result.title}`],
      limit: 'Ce résultat repose sur vos réponses, car le portail refuse la lecture automatique. Il localise une étape probable, mais ne juge ni la valeur du bien ni son prix.',
    },
    resource: result.resource,
  };
}
