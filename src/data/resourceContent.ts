/**
 * Contenu des six ressources principales — structure commune (§19.3 du CdC) :
 * question, réponse courte, explication, exemple, erreurs, checklist,
 * limite, prochaine action, parcours lié.
 */

export interface ResourceContent {
  id: string;
  reponseCourte: string;
  explication: string[];
  exemple: { titre: string; texte: string };
  erreurs: string[];
  checklist: { titre: string; items: string[] };
  limite: string;
  action: string;
  situationLiee: string;
}

export const resourceContents: ResourceContent[] = [
  {
    id: 'lancement-coherent',
    reponseCourte:
      'Un bon lancement suit un ordre précis : documents, préparation du bien, prise de vues, comparaison locale — et seulement ensuite, l’hypothèse de prix. Inverser cet ordre coûte des semaines.',
    explication: [
      'Les premières semaines d’une annonce concentrent l’essentiel de son attention : les acheteurs actifs du secteur la découvrent, la comparent et la classent. Cette fenêtre ne se rejoue pas. Un lancement précipité — photos faites avant la préparation, prix choisi avant la comparaison — expose le bien à un accueil tiède qu’aucune retouche ultérieure ne rattrape complètement.',
      'La logique du lancement cohérent est simple : chaque décision s’appuie sur la précédente. Les documents révèlent parfois des éléments qui changent la présentation (surface réelle, diagnostics). L’état du bien conditionne les photographies. Les photographies et la comparaison locale fondent l’hypothèse de positionnement. Décider dans cet ordre, c’est décider une seule fois.',
      'Le calendrier compte aussi : mieux vaut retarder une publication de deux semaines que publier un bien qui n’est pas prêt. Le marché ne récompense pas la vitesse — il récompense la cohérence entre la promesse, le prix et ce que la visite confirme.',
    ],
    exemple: {
      titre: 'L’ordre inversé, et ce qu’il coûte',
      texte:
        'Un propriétaire pressé publie avec des photos de téléphone et un prix « à ajuster plus tard ». Trois semaines après, il refait les photos et baisse le prix : l’annonce affiche déjà une baisse et des visuels changés — les acheteurs du secteur, eux, ont déjà classé le bien. Le même travail fait avant la publication n’aurait rien coûté.',
    },
    erreurs: [
      'Fixer le prix à partir du budget nécessaire pour le projet suivant.',
      'Publier « pour tester le marché » en pensant ajuster ensuite sans conséquence.',
      'Faire les photographies avant la préparation du bien.',
      'Réunir les documents après les premières demandes des acheteurs.',
      'Choisir la date de publication sans regarder ce qui est en concurrence à ce moment-là.',
    ],
    checklist: {
      titre: 'Avant de publier, dans cet ordre',
      items: [
        'Documents réunis : titre, diagnostics, charges, taxe foncière, travaux réalisés.',
        'Points à corriger traités — ou assumés et intégrés à la présentation.',
        'Prise de vues faite dans un bien préparé, à la bonne lumière.',
        'Les 5 à 8 annonces concurrentes de la même recherche listées et regardées.',
        'Hypothèse de positionnement posée face à ces alternatives — pas dans l’absolu.',
        'Calendrier écrit : publication, période d’observation, premier point de lecture à J+14.',
      ],
    },
    limite:
      'Cette ressource ne remplace pas l’analyse du bien lui-même : elle structure l’ordre des décisions, pas leur contenu. Le « bon » prix et les « bons » ajustements dépendent de la comparaison locale réelle.',
    action:
      'Écrire votre ordre de lancement personnalisé : ce qui est déjà fait, ce qui manque, et la date de publication qui en découle — plutôt que l’inverse.',
    situationLiee: 'preparer',
  },
  {
    id: 'premiere-impression-annonce',
    reponseCourte:
      'Un acheteur accorde quelques secondes à votre annonce, sur un écran de téléphone, au milieu d’une liste. La première photographie, le prix et le titre décident s’il ouvre — ou passe.',
    explication: [
      'Dans une liste de résultats, votre annonce n’existe pas seule : elle apparaît entre deux autres, en vignette, avec un prix. L’acheteur ne « lit » pas — il balaie. Ce que la vignette montre, ce que le prix évoque face aux voisines, ce que le titre précise : voilà la totalité de votre première impression.',
      'La première photographie doit répondre à une question simple : montre-t-elle la plus grande force du bien, cadrée pour un écran de téléphone ? Beaucoup d’annonces ouvrent sur une façade sombre ou une pièce anonyme alors que le jardin, la luminosité ou le volume principal feraient ouvrir l’annonce.',
      'Le test le plus fiable est celui des conditions réelles : votre annonce, sur un téléphone, dans la vraie liste de résultats, au milieu des concurrentes. Pas en plein écran sur votre ordinateur, où tout paraît plus flatteur.',
    ],
    exemple: {
      titre: 'Le test des trois secondes',
      texte:
        'Montrez à un proche la liste de résultats où figure votre annonce, trois secondes, puis demandez : quelles annonces avez-vous envie d’ouvrir, et pourquoi ? Si la vôtre n’en fait pas partie, vous savez où se situe le premier écart — avant toute question de prix.',
    },
    erreurs: [
      'Juger ses photos en plein écran plutôt qu’en vignette mobile.',
      'Ouvrir sur la façade par habitude, même quand elle n’est pas la force du bien.',
      'Un titre qui répète la catégorie (« Maison 5 pièces ») sans rien promettre de plus.',
      'Corriger la photo, le titre et le prix en même temps — impossible ensuite de savoir ce qui a joué.',
      'Oublier que la première impression inclut le prix affiché à côté des concurrentes.',
    ],
    checklist: {
      titre: 'Mini-test en cinq points',
      items: [
        'Vignette vue sur téléphone : le sujet principal est-il lisible en petit ?',
        'La première photo montre-t-elle la plus grande force du bien ?',
        'Le titre apporte-t-il une information que la photo ne montre pas ?',
        'Dans la liste réelle, votre prix côtoie quelles alternatives ?',
        'Les 3 premières photos racontent-elles l’essentiel — ou faut-il aller à la dixième ?',
      ],
    },
    limite:
      'Une première impression réussie fait ouvrir l’annonce — elle ne compense ni un positionnement décalé face aux alternatives, ni une visite qui contredit la promesse.',
    action:
      'Refaire le parcours d’un acheteur sur téléphone : la recherche type, la liste, les trois secondes. Noter ce qui accroche, ce qui manque — puis ne modifier qu’un seul élément.',
    situationLiee: 'peu-contacts',
  },
  {
    id: 'annonce-vue-peu-de-contacts',
    reponseCourte:
      'Vue, ouverture, contact, visite : chaque étape perd une partie des acheteurs — c’est normal. Ce qui informe, c’est de savoir à quelle étape la vôtre en perd trop, car chaque étape a ses propres leviers.',
    explication: [
      'Une « vue » signifie seulement que votre annonce est apparue dans une liste. Une ouverture signifie que la vignette et le prix ont convaincu de regarder. Un contact signifie que l’ensemble — photos, description, prix, localisation — a soutenu la comparaison avec les alternatives. Confondre ces étapes conduit à corriger le mauvais levier.',
      'Beaucoup de vues sans ouvertures pointe vers la vignette, le titre ou le prix affiché. Des ouvertures sans contact pointe vers l’intérieur de l’annonce : la promesse s’effondre en la parcourant, ou la comparaison avec les annonces voisines ne tient pas. Peu de vues tout court pointe vers la diffusion — le support, la position dans les recherches.',
      'La règle d’or : un seul levier à la fois. Modifier photo, texte et prix ensemble, c’est renoncer à comprendre. Modifier un élément, laisser dix à quatorze jours, lire — puis décider du suivant.',
    ],
    exemple: {
      titre: 'Le même silence, trois causes différentes',
      texte:
        'Trois annonces « sans contact » : la première n’apparaît pas dans la recherche des acheteurs (mauvaise fourchette de prix — diffusion). La deuxième est vue mais jamais ouverte (vignette sombre — première impression). La troisième est ouverte puis refermée (les photos suivantes déçoivent — promesse). Même symptôme, trois réponses différentes.',
    },
    erreurs: [
      'Conclure « le prix est trop élevé » à partir du seul silence.',
      'Modifier plusieurs éléments à la fois.',
      'Comparer ses chiffres de vues à des moyennes nationales sans valeur locale.',
      'Ignorer la différence entre vue et ouverture quand le support la fournit.',
      'Changer de support de diffusion avant d’avoir compris ce que disait le premier.',
    ],
    checklist: {
      titre: 'Localiser l’étape qui perd les acheteurs',
      items: [
        'Récupérer les chiffres disponibles : vues, et si possible ouvertures et contacts.',
        'Reproduire la recherche type d’un acheteur et vérifier où l’annonce apparaît.',
        'Comparer la vignette et le prix aux annonces voisines de la même liste.',
        'Relire l’annonce ouverte comme un acheteur : la promesse tient-elle jusqu’au bout ?',
        'Choisir l’unique levier de la prochaine période de quatorze jours.',
      ],
    },
    limite:
      'Sans accès aux chiffres de consultation, cette lecture reste hypothétique : la première étape est alors de récupérer ces données auprès du support de diffusion.',
    action:
      'Identifier l’étape exacte où l’intérêt se perd — diffusion, ouverture ou contact — avant de choisir quoi modifier. Un levier, quatorze jours, une lecture.',
    situationLiee: 'peu-contacts',
  },
  {
    id: 'retours-de-visite',
    reponseCourte:
      'Une visite sans offre n’est pas un échec : c’est une information — à condition de la collecter. Un motif qui revient sur trois visites vaut plus que dix avis d’entourage.',
    explication: [
      'La plupart des visiteurs ne disent pas ce qu’ils pensent : ils remercient, promettent de réfléchir, disparaissent. La politesse n’est pas une objection. Pour obtenir la vraie information, il faut la demander — vite, simplement, et de la même façon à chaque visite pour pouvoir comparer.',
      'Ce qui compte n’est pas l’avis isolé mais le motif : une remarque qui revient (les travaux, le vis-à-vis, la troisième chambre trop petite) dessine la perception réelle du marché. Une remarque unique peut être une sensibilité personnelle ; trois occurrences sont un signal.',
      'Attention au réflexe du prix : « c’est trop cher » en fin de visite signifie souvent « à ce prix, j’ai vu mieux » — c’est une information de comparaison, pas nécessairement de prix. La question utile est : mieux en quoi ? C’est là que se cache le levier.',
    ],
    exemple: {
      titre: 'Traduire une objection en information',
      texte:
        '« Il y a trop de travaux » dit rarement le montant : le visiteur additionne un coût imaginé, un délai et une incertitude. Six visiteurs qui le disent ne signifient pas six fois le même chiffre — mais un écart certain entre le coût réel des travaux et leur coût perçu. Ce sont deux problèmes différents, avec deux réponses différentes.',
    },
    erreurs: [
      'Ne rien noter et se fier à sa mémoire des visites.',
      'Prendre la politesse (« c’est très lumineux ! ») pour un signal positif.',
      'Conclure à partir d’une seule visite.',
      'Se vexer d’une objection au lieu de la creuser — elle est gratuite et précieuse.',
      'Baisser le prix en réponse à une objection qui parlait d’autre chose.',
    ],
    checklist: {
      titre: 'Le débrief systématique (3 questions, à chaud)',
      items: [
        'Qu’est-ce qui vous a plu — et déplu — par rapport à ce que l’annonce laissait attendre ?',
        'Comment situez-vous ce bien face aux autres que vous avez visités ?',
        'Qu’est-ce qui vous ferait revenir pour une seconde visite ?',
        'Tout noter dans un même document, avec la date et le profil du visiteur.',
        'Relire l’ensemble tous les 3 à 5 retours et surligner ce qui se répète.',
      ],
    },
    limite:
      'Les retours de visite décrivent la perception, pas la valeur : ils indiquent quoi vérifier, pas quoi conclure. Un motif répété appelle une vérification — pas automatiquement un changement.',
    action:
      'Mettre en place le débrief systématique dès la prochaine visite, et reconstituer de mémoire ce qui peut l’être des visites passées — dates, profils, remarques.',
    situationLiee: 'visites',
  },
  {
    id: 'verifier-avant-baisse-prix',
    reponseCourte:
      'Une baisse de prix est une information publique que le marché lit et mémorise. Avant d’en faire une, vérifiez trois choses : d’où vient le prix actuel, ce que voient les acheteurs au même budget, et ce que dit vraiment le signal qui vous inquiète.',
    explication: [
      'Le réflexe « ça ne bouge pas, baissons » saute une étape : comprendre pourquoi ça ne bouge pas. Si l’annonce n’est pas vue, la baisse ne changera rien. Si elle est vue mais pas ouverte, c’est peut-être la vignette. Si les visites déçoivent, la baisse attire des visiteurs qui seront déçus pareil. La baisse ne répare que ce qui relève réellement du positionnement.',
      'L’historique compte autant que le montant : les portails affichent les baisses successives, et les acheteurs les lisent comme un récit — « ils ont commencé trop haut », « ils sont pressés », « personne n’en veut ». Deux petites baisses racontent une histoire pire qu’un repositionnement unique et assumé.',
      'La seule référence valable est la comparaison actuelle : les biens visibles aujourd’hui dans la même recherche, au même budget. Pas l’estimation d’il y a six mois, pas le prix d’achat, pas le besoin de financement du projet suivant.',
    ],
    exemple: {
      titre: 'La baisse qui n’a rien changé',
      texte:
        'Un bien baisse de 10 000 € après deux mois sans contact. Trois semaines plus tard, toujours rien : l’annonce n’apparaissait simplement pas dans les recherches des acheteurs du secteur — le problème était la diffusion, pas le prix. La baisse est désormais visible dans l’historique, pour rien.',
    },
    erreurs: [
      'Baisser pour « faire quelque chose » face au silence.',
      'Enchaîner plusieurs petites baisses au lieu d’un repositionnement construit.',
      'Baisser en même temps que d’autres modifications — effet illisible.',
      'Prendre l’avis le plus alarmiste de l’entourage comme référence.',
      'Oublier que le prix baissé doit rester cohérent avec la comparaison — pas juste inférieur au prix d’avant.',
    ],
    checklist: {
      titre: 'Les vérifications avant toute décision de prix',
      items: [
        'D’où vient le prix actuel ? (estimation, comparaison, besoin de financement)',
        'L’annonce est-elle réellement vue ? (sinon, le sujet est la diffusion)',
        'Que voient les acheteurs au même budget aujourd’hui — concrètement ?',
        'Que disent les retours de visite, s’il y en a eu ?',
        'Quel récit l’historique de l’annonce raconte-t-il déjà ?',
        'Si baisse il y a : est-elle unique, significative et cohérente avec la comparaison ?',
      ],
    },
    limite:
      'Cette ressource ne calcule pas un prix : elle sécurise la décision. Le montant pertinent, s’il faut en changer, se construit sur la comparaison locale réelle — pas sur une règle générale.',
    action:
      'Refaire la comparaison à neuf — les annonces visibles aujourd’hui dans la même recherche — et confronter chaque signal inquiétant à sa cause probable avant de décider.',
    situationLiee: 'visites',
  },
  {
    id: 'reprendre-commercialisation',
    reponseCourte:
      'Une annonce ancienne ne se « retouche » plus : elle se reprend. Comprendre l’usure, solder l’historique, et reconstruire une première impression neuve — en gardant ce que ces mois ont appris.',
    explication: [
      'Après plusieurs mois, une annonce s’use mécaniquement : les acheteurs actifs du secteur l’ont vue, classée, oubliée. Les nouveaux arrivants sur le marché la découvrent avec son historique — durée, baisses — qui raconte une histoire avant même la première photo. Ce phénomène ne dit rien de la valeur du bien : il dit que l’outil « annonce » est fatigué.',
      'La tentation est la retouche de plus : encore une baisse, encore une photo. Sur une annonce usée, ces gestes sont lus comme des confirmations. Une reprise efficace est un événement, pas un ajustement : nouvelle première impression, présentation repensée, positionnement réévalué face au marché actuel — qui n’est plus celui du lancement.',
      'Le plus précieux dans une vente longue, c’est ce qu’elle a appris : les remarques répétées, les profils qui sont venus, les moments où l’intérêt décrochait. Une reprise qui ignore ces enseignements recommence les mêmes erreurs avec de nouvelles photos.',
    ],
    exemple: {
      titre: 'Pause puis reprise, plutôt qu’érosion continue',
      texte:
        'Après dix mois et trois baisses, un propriétaire retire son bien six semaines, traite les deux remarques les plus répétées des visites, refait les photos de saison et republie avec un positionnement construit sur la concurrence actuelle. L’annonce repart neuve — avec l’expérience des dix mois, sans leur poids.',
    },
    erreurs: [
      'Ajouter une énième retouche à une annonce que le marché ne regarde plus.',
      'Repartir sans avoir reconstitué l’historique et les enseignements.',
      'Republier à l’identique en espérant un résultat différent.',
      'Changer le prix et toute la présentation en même temps, sans période de lecture.',
      'Oublier que le marché de comparaison a changé depuis le lancement initial.',
    ],
    checklist: {
      titre: 'Construire la reprise',
      items: [
        'Reconstituer la chronologie : dates, prix successifs, changements, réactions.',
        'Lister les enseignements : remarques répétées, profils venus, moments de décrochage.',
        'Refaire la comparaison face au marché d’aujourd’hui, pas celui du lancement.',
        'Décider : pause puis relance, repositionnement construit, ou continuité outillée.',
        'Préparer une première impression réellement nouvelle avant de réexposer le bien.',
        'Planifier la lecture : un point à J+14, sur des chiffres notés.',
      ],
    },
    limite:
      'Cette ressource ne dit pas si votre reprise passe par un changement de prix, de présentation ou de diffusion : cela dépend de l’historique réel et de la comparaison actuelle — c’est précisément ce que la reconstitution révèle.',
    action:
      'Reconstituer la chronologie complète de votre commercialisation et en extraire trois enseignements — avant de choisir la forme de la reprise.',
    situationLiee: 'longtemps',
  },
];

export function getResourceContent(id: string): ResourceContent {
  const c = resourceContents.find((c) => c.id === id);
  if (!c) throw new Error(`Contenu de ressource introuvable : ${id}`);
  return c;
}
