export type AuditAnswers = {
  commune: string;
  typeBien: 'maison' | 'appartement' | 'autre';
  duree: 'moins-7' | '7-30' | '31-60' | 'plus-60';
  vues: 'faibles' | 'moyennes' | 'fortes' | 'inconnu';
  contacts: 'aucun' | 'un-trois' | 'quatre-plus' | 'inconnu';
  visites: 'aucune' | 'une-deux' | 'trois-plus' | 'inconnu';
  offres: 'aucune' | 'orale' | 'ecrite' | 'inconnu';
  photos: 'cinq-moins' | 'six-dix' | 'onze-plus';
  description: 'complete' | 'partielle' | 'courte';
  retours: 'prix' | 'presentation' | 'travaux' | 'autre' | 'aucun';
  prixModifie: 'non' | 'oui';
};

export type AuditSignal = {
  statut: 'observe' | 'possible' | 'inconnu';
  titre: string;
  texte: string;
};

export type AuditResult = {
  code: 'trop-tot' | 'diffusion' | 'premiere-impression' | 'projection' | 'apres-visite' | 'traction' | 'insuffisant' | 'incoherent';
  titre: string;
  resume: string;
  faits: string[];
  signaux: AuditSignal[];
  actions: string[];
  etape: 0 | 1 | 2 | 3 | 4;
  limite: string;
};

const dureeTexte: Record<AuditAnswers['duree'], string> = {
  'moins-7': 'depuis moins de 7 jours',
  '7-30': 'depuis 7 à 30 jours',
  '31-60': 'depuis 1 à 2 mois',
  'plus-60': 'depuis plus de 2 mois',
};

const vuesTexte: Record<AuditAnswers['vues'], string> = {
  faibles: 'peu de vues',
  moyennes: 'un volume de vues intermédiaire',
  fortes: 'beaucoup de vues',
  inconnu: 'un nombre de vues non renseigné',
};

function faitsDe(a: AuditAnswers): string[] {
  const type = a.typeBien === 'maison' ? 'maison' : a.typeBien === 'appartement' ? 'appartement' : 'bien';
  const faits = [
    `L’annonce concerne un ${type} à ${a.commune.trim() || 'commune non renseignée'}, publié ${dureeTexte[a.duree]}.`,
    `La diffusion indique ${vuesTexte[a.vues]}.`,
  ];
  if (a.contacts !== 'inconnu') {
    faits.push(a.contacts === 'aucun' ? 'Aucun contact reçu.' : a.contacts === 'un-trois' ? 'Entre 1 et 3 contacts reçus.' : 'Au moins 4 contacts reçus.');
  }
  if (a.visites !== 'inconnu') {
    faits.push(a.visites === 'aucune' ? 'Aucune visite réalisée.' : a.visites === 'une-deux' ? 'Entre 1 et 2 visites réalisées.' : 'Au moins 3 visites réalisées.');
  }
  if (a.offres !== 'inconnu') {
    faits.push(a.offres === 'aucune' ? 'Aucune offre reçue.' : a.offres === 'orale' ? 'Une proposition ou un intérêt oral a été reçu.' : 'Une offre écrite a été reçue.');
  }
  if (a.prixModifie === 'oui') faits.push('Le prix affiché a déjà été modifié.');
  return faits;
}

function presentationSignals(a: AuditAnswers): AuditSignal[] {
  const signaux: AuditSignal[] = [];
  if (a.photos === 'cinq-moins') {
    signaux.push({ statut: 'possible', titre: 'Projection visuelle à vérifier', texte: 'Cinq photos ou moins peuvent laisser des questions sans réponse. Leur ordre et leur contenu comptent davantage que leur seul nombre.' });
  }
  if (a.description === 'courte') {
    signaux.push({ statut: 'possible', titre: 'Informations peut-être insuffisantes', texte: 'Une description très courte peut empêcher un acheteur de vérifier rapidement si le bien correspond à ses priorités.' });
  }
  if (a.retours !== 'aucun') {
    const libelles = { prix: 'le prix', presentation: 'la présentation', travaux: 'les travaux', autre: 'un autre point' } as const;
    signaux.push({ statut: 'observe', titre: 'Un retour concret existe', texte: `Les personnes intéressées ont déjà évoqué ${libelles[a.retours]}. Ce retour doit être comparé aux autres signaux, pas pris seul comme un verdict.` });
  }
  return signaux;
}

export function computeAudit(a: AuditAnswers): AuditResult {
  const faits = faitsDe(a);
  const commun = {
    faits,
    limite: 'Ces réponses décrivent le parcours de l’annonce, pas la valeur réelle du bien. L’offre concurrente, la demande active, l’état du logement, son emplacement précis et les retours détaillés exigent une analyse humaine.',
  };

  const reponsesIncompatibles =
    (a.contacts === 'aucun' && (a.visites === 'une-deux' || a.visites === 'trois-plus')) ||
    (a.visites === 'aucune' && (a.offres === 'orale' || a.offres === 'ecrite'));

  if (reponsesIncompatibles) {
    return {
      ...commun,
      code: 'incoherent', etape: 0,
      titre: 'Certaines réponses sont à vérifier.',
      resume: 'Le trajet indiqué saute une étape : par exemple une visite ou une offre apparaît alors que l’étape précédente est notée comme inexistante. L’outil préfère vous demander de vérifier plutôt que d’inventer une explication.',
      signaux: [{ statut: 'inconnu', titre: 'Parcours contradictoire', texte: 'Les volumes de contacts, de visites et d’offres ne suivent pas le même ordre. Une réponse peut simplement avoir été mal comprise ou comptée différemment.' }],
      actions: ['Reprendre les messages, appels, rendez-vous et offres depuis la publication.', 'Compter séparément les demandes, les visites réalisées et les propositions reçues.', 'Relancer l’audit avec les chiffres vérifiés.'],
    };
  }

  if (a.vues === 'inconnu' || a.contacts === 'inconnu' || a.visites === 'inconnu' || a.offres === 'inconnu') {
    return {
      ...commun,
      code: 'insuffisant', etape: 0,
      titre: 'Il manque des faits pour localiser le blocage.',
      resume: 'Sans connaître les vues, les contacts, les visites et les offres, toute conclusion serait fragile. L’audit commence donc par rendre ces données comparables.',
      signaux: [{ statut: 'inconnu', titre: 'Parcours incomplet', texte: 'Une étape non mesurée empêche de savoir où l’intérêt disparaît.' }, ...presentationSignals(a)],
      actions: ['Relever les vues, contacts, visites et offres depuis la mise en ligne.', 'Séparer les chiffres par portail et par période.', 'Revenir avec ces éléments pour obtenir une lecture plus précise.'],
    };
  }

  if (a.offres === 'ecrite' || a.offres === 'orale') {
    return {
      ...commun,
      code: 'traction', etape: 4,
      titre: 'L’annonce déclenche une décision.',
      resume: 'Le sujet principal n’est plus d’obtenir une réaction, mais de comprendre la solidité de l’intérêt reçu et les conséquences de chaque réponse.',
      signaux: [
        { statut: 'observe', titre: 'Une intention existe', texte: 'Une proposition ou une offre montre qu’au moins une personne se projette suffisamment pour avancer.' },
        ...presentationSignals(a),
      ],
      actions: ['Vérifier le financement, les conditions et le calendrier de l’acheteur.', 'Comparer la proposition au projet du vendeur, pas seulement au prix affiché.', 'Préparer la réponse et la négociation avant de s’engager.'],
    };
  }

  if (a.duree === 'moins-7' && (a.vues === 'faibles' || a.vues === 'inconnu') && a.contacts === 'aucun') {
    return {
      ...commun,
      code: 'trop-tot', etape: 0,
      titre: 'Il est encore tôt pour conclure.',
      resume: 'Moins d’une semaine de diffusion donne peu de recul. Le bon réflexe est de sécuriser la mesure avant de modifier l’annonce.',
      signaux: [{ statut: 'inconnu', titre: 'Réaction du marché encore incomplète', texte: 'Le volume de vues et de contacts doit être observé sur une période comparable avant d’interpréter le silence.' }, ...presentationSignals(a)],
      actions: ['Relever aujourd’hui les vues, contacts et favoris sur chaque portail.', 'Vérifier l’affichage mobile, la photo principale et les informations essentielles.', 'Comparer les mêmes indicateurs dans quelques jours avant de changer plusieurs éléments.'],
    };
  }

  if (a.vues === 'faibles' && a.duree !== 'moins-7') {
    return {
      ...commun,
      code: 'diffusion', etape: 0,
      titre: 'L’annonce semble manquer de visibilité.',
      resume: 'Le premier décrochage apparaît avant même le contact. Il faut d’abord vérifier si l’annonce atteint suffisamment d’acheteurs pertinents.',
      signaux: [{ statut: 'observe', titre: 'Diffusion faible déclarée', texte: 'Peu de vues après plusieurs jours signifie que les étapes suivantes ne disposent pas encore d’un échantillon suffisant.' }, ...presentationSignals(a)],
      actions: ['Comparer la diffusion réelle sur chaque portail et repérer une éventuelle absence.', 'Contrôler les critères de recherche, la localisation et la catégorie du bien.', 'Ne pas modifier le prix sur ce seul signal : vérifier d’abord l’exposition et la concurrence visible.'],
    };
  }

  if ((a.vues === 'moyennes' || a.vues === 'fortes') && a.contacts === 'aucun') {
    return {
      ...commun,
      code: 'premiere-impression', etape: 1,
      titre: 'L’annonce est vue, mais elle ne déclenche pas de contact.',
      resume: 'Le décrochage probable se situe entre l’affichage de l’annonce et l’envie d’en savoir plus. La première impression doit être relue dans son ensemble.',
      signaux: [{ statut: 'observe', titre: 'Des vues sans prise de contact', texte: 'L’annonce circule, mais les personnes exposées ne passent pas à l’étape suivante.' }, ...presentationSignals(a)],
      actions: ['Comparer la photo principale et le titre aux annonces concurrentes réellement visibles.', 'Vérifier si le texte répond immédiatement aux questions essentielles.', 'Replacer le prix dans son environnement concurrentiel avant toute décision.'],
    };
  }

  if ((a.contacts === 'un-trois' || a.contacts === 'quatre-plus') && a.visites === 'aucune') {
    return {
      ...commun,
      code: 'projection', etape: 2,
      titre: 'L’annonce intéresse, mais le contact ne devient pas une visite.',
      resume: 'Des personnes se manifestent puis s’arrêtent. Il faut comprendre ce qu’elles découvrent, ce qui les freine et si les contacts sont réellement qualifiés.',
      signaux: [{ statut: 'observe', titre: 'Intérêt sans déplacement', texte: 'Le passage au contact fonctionne, mais aucun rendez-vous n’a encore confirmé la projection.' }, ...presentationSignals(a)],
      actions: ['Noter les questions et objections qui reviennent pendant les échanges.', 'Vérifier la cohérence entre la promesse de l’annonce et les informations données ensuite.', 'Distinguer les curieux des acheteurs dont le budget, le secteur et le calendrier sont cohérents.'],
    };
  }

  if (a.visites === 'trois-plus' && a.offres === 'aucune') {
    return {
      ...commun,
      code: 'apres-visite', etape: 3,
      titre: 'Le décrochage arrive après la visite.',
      resume: 'Plusieurs acheteurs se déplacent sans faire d’offre. La perception sur place, les compromis du bien et son positionnement doivent être confrontés aux retours réels.',
      signaux: [{ statut: 'observe', titre: 'Visites sans décision', texte: 'L’annonce obtient des rendez-vous, mais la visite ne transforme pas encore l’intérêt en proposition.' }, ...presentationSignals(a)],
      actions: ['Rassembler les retours précis de chaque visite, y compris les silences.', 'Identifier l’écart entre ce que l’annonce laisse imaginer et ce que la visite révèle.', 'Comparer plusieurs scénarios de présentation et de positionnement avant de décider.'],
    };
  }

  return {
    ...commun,
    code: 'insuffisant', etape: 2,
    titre: 'L’annonce produit des signaux, mais pas encore assez pour conclure.',
    resume: 'Le parcours n’est pas clairement bloqué à une seule étape. Il faut compléter les retours et observer l’évolution avant de modifier plusieurs variables.',
    signaux: [{ statut: 'possible', titre: 'Lecture encore ouverte', texte: 'Quelques réactions existent, sans volume suffisant pour isoler un point de rupture fiable.' }, ...presentationSignals(a)],
    actions: ['Conserver un relevé daté des vues, contacts, visites et retours.', 'Éviter de changer simultanément le prix, les photos et le texte.', 'Faire relire l’annonce et sa concurrence pour choisir la prochaine vérification utile.'],
  };
}
