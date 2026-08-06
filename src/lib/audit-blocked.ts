import { analyseListing, type ListingAnalysis, type ListingSnapshot, type ListingTip } from './audit-url';

export type ListingDuration = 'moins-7' | '7-30' | 'plus-30';
export type ListingSignal = 'peu-vues' | 'vues-sans-contact' | 'contacts-sans-visite' | 'visites-sans-offre' | 'offre-recue';

export type BlockedAuditResult = {
  analysis: ListingAnalysis;
  resource: { href: string; label: string; description: string };
};

export type ContextOption = { value: string; label: string };
export type ContextQuestion = { question: string; options: ContextOption[] };

const contextQuestions: Record<ListingSignal, ContextQuestion> = {
  'peu-vues': {
    question: 'Où l’annonce est-elle diffusée actuellement ?',
    options: [
      { value: 'un-portail', label: 'Sur un seul site d’annonces' },
      { value: 'plusieurs-portails', label: 'Sur plusieurs sites d’annonces' },
      { value: 'diffusion-inconnue', label: 'Je ne sais pas exactement' },
    ],
  },
  'vues-sans-contact': {
    question: 'Qu’avez-vous déjà modifié depuis la publication ?',
    options: [
      { value: 'rien-modifie', label: 'Rien pour le moment' },
      { value: 'presentation-modifiee', label: 'Les photos, le titre ou le texte' },
      { value: 'prix-modifie', label: 'Le prix affiché' },
      { value: 'plusieurs-modifications', label: 'Plusieurs éléments à la fois' },
    ],
  },
  'contacts-sans-visite': {
    question: 'Quel frein revient le plus pendant les échanges ?',
    options: [
      { value: 'frein-prix', label: 'Le prix' },
      { value: 'frein-travaux', label: 'L’état ou les travaux' },
      { value: 'frein-localisation', label: 'La localisation ou l’environnement' },
      { value: 'frein-inconnu', label: 'Aucun frein précis ne ressort' },
    ],
  },
  'visites-sans-offre': {
    question: 'Quel retour revient le plus après les visites ?',
    options: [
      { value: 'retour-prix', label: 'Le prix' },
      { value: 'retour-travaux', label: 'L’état ou les travaux' },
      { value: 'retour-agencement', label: 'L’agencement ou les volumes' },
      { value: 'retour-inconnu', label: 'Aucun retour précis ne ressort' },
    ],
  },
  'offre-recue': {
    question: 'Quelle forme prend la proposition reçue ?',
    options: [
      { value: 'offre-orale', label: 'Un intérêt ou une proposition orale' },
      { value: 'offre-ecrite-conditions', label: 'Une offre écrite avec des conditions' },
      { value: 'offre-ecrite-simple', label: 'Une offre écrite qui paraît simple' },
    ],
  },
};

const contextTips: Record<string, ListingTip> = {
  'un-portail': { code: 'one-portal', title: 'Mesurez la diffusion avant de juger l’annonce.', observation: 'Vous indiquez que le bien apparaît sur un seul site. Le volume de vues dépend donc fortement de son audience et de son classement.', action: 'Vérifiez d’abord que l’annonce ressort dans la bonne recherche et relevez ses vues sur plusieurs jours avant de conclure sur le prix ou la présentation.' },
  'plusieurs-portails': { code: 'multi-portal', title: 'Comparez les portails séparément.', observation: 'La diffusion est large, mais un total global masque souvent l’endroit précis où l’annonce fonctionne ou disparaît.', action: 'Relevez vues, favoris et contacts pour chaque portail. Corrigez en priorité celui qui reçoit des vues sans produire la moindre réaction.' },
  'diffusion-inconnue': { code: 'unknown-distribution', title: 'Commencez par rendre la diffusion mesurable.', observation: 'Sans savoir où le bien apparaît, il est impossible de distinguer un problème d’exposition d’un problème de présentation.', action: 'Listez chaque site, la date de publication et les vues disponibles. Ce relevé devient votre point de comparaison avant toute modification.' },
  'rien-modifie': { code: 'unchanged', title: 'Testez d’abord la première impression.', observation: 'Aucun élément n’a encore été modifié malgré des vues sans contact. Vous disposez donc d’un point de départ propre.', action: 'Commencez par un seul changement visible — photo principale ou titre — puis comparez les contacts obtenus avant de toucher au prix.' },
  'presentation-modifiee': { code: 'presentation-changed', title: 'Vérifiez l’effet réel de la nouvelle présentation.', observation: 'Les photos, le titre ou le texte ont déjà changé. Sans relevé avant et après, une nouvelle modification ajouterait surtout de la confusion.', action: 'Comparez vues et contacts sur deux périodes équivalentes. Conservez ce qui progresse et évitez de modifier le prix pendant ce test.' },
  'prix-modifie': { code: 'price-changed', title: 'Ne baissez pas une seconde fois sans nouvelle preuve.', observation: 'Le prix a déjà été modifié mais les vues ne deviennent toujours pas des contacts.', action: 'Vérifiez maintenant la photo principale, la promesse, les informations manquantes et les annonces concurrentes avant d’envisager une autre décision sur le prix.' },
  'plusieurs-modifications': { code: 'many-changes', title: 'Arrêtez de modifier plusieurs variables ensemble.', observation: 'Plusieurs changements simultanés empêchent de savoir ce qui aide réellement ou ce qui détériore la perception.', action: 'Stabilisez l’annonce, relevez les indicateurs actuels, puis ne testez qu’un élément à la fois sur une période comparable.' },
  'frein-prix': { code: 'contact-price', title: 'Transformez “c’est trop cher” en information exploitable.', observation: 'Le prix revient pendant les échanges, mais cette phrase peut cacher une comparaison, un financement insuffisant ou un autre compromis.', action: 'Demandez avec quel bien ou quel budget la personne compare. Regroupez les réponses avant de décider si le problème vient du prix, de la promesse ou de la qualification des contacts.' },
  'frein-travaux': { code: 'contact-work', title: 'Chiffrez la perception des travaux avant la visite.', observation: 'L’état du bien freine les contacts avant même le déplacement.', action: 'Distinguez clairement ce qui est fait, ce qui reste à prévoir et ce qui relève seulement d’une préférence esthétique. Ajoutez les diagnostics ou devis réellement disponibles.' },
  'frein-localisation': { code: 'contact-location', title: 'Rendez l’environnement concret et honnête.', observation: 'La localisation ou son interprétation interrompt les échanges.', action: 'Précisez les temps réels vers les repères utiles et assumez les contraintes visibles. Une information claire qualifie mieux qu’une formule vague.' },
  'frein-inconnu': { code: 'contact-unknown', title: 'Faites parler les conversations qui s’arrêtent.', observation: 'Aucun frein précis ne ressort alors que les contacts ne deviennent pas des visites.', action: 'Posez une question simple aux prochains contacts : “Qu’est-ce qui vous empêche aujourd’hui de prévoir une visite ?” Notez les réponses sans les interpréter immédiatement.' },
  'retour-prix': { code: 'visit-price', title: 'Comparez le prix au ressenti après visite.', observation: 'Le prix revient après que les acheteurs ont découvert le bien sur place. Le signal est plus précis qu’une réaction à l’annonce seule.', action: 'Identifiez ce que les visiteurs pensaient trouver à ce prix et ce qui a créé l’écart. Comparez ensuite aux biens réellement concurrents avant toute décision.' },
  'retour-travaux': { code: 'visit-work', title: 'Rendez l’effort à prévoir mesurable.', observation: 'Les travaux deviennent le frein principal une fois le bien visité.', action: 'Séparez urgence, confort et décoration. Quand c’est possible, réunissez diagnostics, devis ou ordres de grandeur sourcés pour réduire l’incertitude.' },
  'retour-agencement': { code: 'visit-layout', title: 'Corrigez la projection avant la prochaine visite.', observation: 'Les volumes ou l’agencement sont compris différemment sur place que dans l’annonce.', action: 'Réordonnez les photos, ajoutez un plan si vous en disposez et présentez les usages possibles sans masquer les contraintes.' },
  'retour-inconnu': { code: 'visit-unknown', title: 'Ne laissez plus une visite se terminer sans signal.', observation: 'Plusieurs visites sans offre et sans retour précis ne permettent pas de choisir la bonne action.', action: 'Après chaque visite, demandez ce qui correspondait au projet, ce qui ne correspondait pas et ce qui empêcherait une offre. Notez les réponses mot pour mot.' },
  'offre-orale': { code: 'oral-offer', title: 'Ne traitez pas une intention orale comme un engagement.', observation: 'Une proposition orale montre un intérêt, mais ses conditions et sa solidité restent inconnues.', action: 'Demandez une offre écrite précisant montant, financement, conditions et calendrier avant de prendre une décision.' },
  'offre-ecrite-conditions': { code: 'conditional-offer', title: 'Lisez les conditions avant le montant.', observation: 'L’offre écrite comporte des conditions qui peuvent modifier sa solidité ou son calendrier.', action: 'Vérifiez financement, conditions suspensives, apport, délais et éventuelle vente préalable avec le professionnel compétent avant de répondre.' },
  'offre-ecrite-simple': { code: 'written-offer', title: 'Vérifiez ce qui paraît simple avant de vous engager.', observation: 'Une offre écrite est reçue, mais son apparente simplicité ne remplace pas la vérification du dossier.', action: 'Contrôlez identité, financement, conditions, calendrier et conséquences pour votre propre projet avant acceptation ou négociation.' },
};

export function getContextQuestion(signal: ListingSignal): ContextQuestion {
  return contextQuestions[signal];
}

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

export function analyseHybridListing(
  snapshot: ListingSnapshot,
  duration: ListingDuration,
  signal: ListingSignal,
  context: string,
): BlockedAuditResult {
  const base = analyseBlockedListing(duration, signal);
  const question = getContextQuestion(signal);
  const answerLabel = question.options.find((option) => option.value === context)?.label ?? 'Réponse non reconnue';
  const contextualTip = contextTips[context] ?? base.analysis.tips[1];
  const readable = Boolean(snapshot.title || snapshot.description || snapshot.photoCount || snapshot.price);

  let secondTip = contextualTip;
  if (readable && signal === 'vues-sans-contact' && context === 'rien-modifie') {
    const pageTip = analyseListing(snapshot).tips.find((tip) => ['title', 'photos', 'description-depth', 'condition', 'location'].includes(tip.code));
    if (pageTip) secondTip = pageTip;
  }

  const facts = [
    durationLabels[duration],
    `Étape déclarée : ${resultBySignal[signal].title}`,
    `${question.question} ${answerLabel}`,
  ];
  if (readable) {
    facts.push(`Page accessible : ${snapshot.source || 'source non précisée'}`);
    if (snapshot.title) facts.push(`Titre lu : ${snapshot.title.slice(0, 140)}`);
    if (typeof snapshot.photoCount === 'number') facts.push(`${snapshot.photoCount} photo${snapshot.photoCount > 1 ? 's' : ''} détectée${snapshot.photoCount > 1 ? 's' : ''}`);
    if (snapshot.description) facts.push(`${snapshot.description.replace(/\s+/g, ' ').trim().length} caractères de description accessibles`);
  } else {
    facts.push('Le portail n’a pas fourni de contenu lisible automatiquement');
  }

  return {
    analysis: {
      ...base.analysis,
      tips: [base.analysis.tips[0], secondTip],
      facts,
      limit: readable
        ? 'Le lien et vos réponses permettent de choisir une priorité, pas de juger la valeur du bien. La concurrence active, l’état sur place, la qualité des contacts et votre situation exigent encore une analyse humaine.'
        : 'Ce résultat repose sur vos trois réponses, car le portail refuse la lecture automatique. Il localise une étape probable, mais ne juge ni la valeur du bien ni son prix.',
    },
    resource: base.resource,
  };
}
