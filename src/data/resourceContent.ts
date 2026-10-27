/** Six ressources conservées ; formulations alignées sur les limites de la méthode. */
export interface ResourceContent {id:string;reponseCourte:string;explication:string[];exemple:{titre:string;texte:string};erreurs:string[];checklist:{titre:string;items:string[]};limite:string;action:string;situationLiee:string}
export const resourceContents:ResourceContent[]=[
  {
    "id": "lancement-coherent",
    "reponseCourte": "Préparer le lancement consiste à relier les documents, la présentation du bien, les comparaisons utiles et votre calendrier. L’ordre aide à éviter des décisions prises sur des informations encore incomplètes.",
    "explication": [
      "Commencez par ce qui peut changer la description du bien : surfaces, diagnostics, charges, travaux et documents disponibles. Une information manquante peut demander une vérification avant publication ; elle ne rend pas automatiquement tout le lancement impossible.",
      "Préparer les espaces et les photographies aide à rendre les usages lisibles. Comparez ensuite le bien à des alternatives pertinentes, en distinguant annonces actuelles et ventes passées. Votre besoin de financement pour la suite ne suffit pas à déterminer sa valeur.",
      "La date de publication découle aussi de vos contraintes. Poursuivre la préparation, publier avec des limites explicites ou attendre sont des options à examiner ; aucune durée universelle ne les départage."
    ],
    "exemple": {
      "titre": "Une information change la présentation",
      "texte": "Un propriétaire découvre qu’une pièce présentée comme chambre demande une vérification de surface et d’usage. Il rassemble l’information, adapte le texte et les photos, puis réexamine son calendrier. Cet exemple décrit une démarche possible, pas un résultat commercial garanti."
    },
    "erreurs": [
      "Confondre le montant nécessaire au prochain projet avec une valeur vérifiée.",
      "Publier une information dont on ignore le fondement.",
      "Préparer des images qui masquent une contrainte importante.",
      "Choisir une date sans regarder ce qui manque encore."
    ],
    "checklist": {
      "titre": "Les points à relier avant publication",
      "items": [
        "Lister les documents disponibles et ceux à retrouver.",
        "Décrire les usages et les contraintes du bien avec précision.",
        "Préparer des photos fidèles à ce qu’une visite pourra constater.",
        "Comparer des alternatives pertinentes en notant leur source et leur date.",
        "Clarifier le fondement du prix envisagé et les vérifications nécessaires.",
        "Choisir une date et les informations à observer après publication."
      ]
    },
    "limite": "Cette grille ne fixe ni le prix du bien ni un délai de vente. Ces sujets demandent le bien réel, des comparaisons pertinentes et votre situation.",
    "action": "Écrire trois colonnes : déjà prêt, à vérifier, conséquence sur le calendrier. Choisir la prochaine vérification qui change réellement le lancement.",
    "situationLiee": "preparer"
  },
  {
    "id": "premiere-impression-annonce",
    "reponseCourte": "La première image, le titre et les informations visibles dans une liste donnent une première lecture du bien. Leur rôle est de faire comprendre ce qui est proposé, sans exagérer sa promesse.",
    "explication": [
      "Regardez l’annonce dans les conditions où elle est découverte : sur un téléphone, dans une liste de résultats, puis une fois ouverte. Ce qui paraît clair en grand peut devenir difficile à lire en vignette.",
      "La première image doit transmettre une information pertinente sur le bien. Le choix dépend de ses usages et de la recherche concernée, pas d’une règle imposant toujours une façade ou un séjour.",
      "Un test de compréhension sert à repérer ce qui est perçu ou manque. Il ne prédit ni le nombre de contacts ni la vente. Une image plus séduisante ne corrige pas une information inexacte."
    ],
    "exemple": {
      "titre": "Ce qui est compris avant le clic",
      "texte": "Une annonce commence par un cadrage où l’extérieur est difficile à identifier. En la regardant dans la liste, le propriétaire constate que cette caractéristique n’apparaît pas clairement. Il peut tester une autre photo fidèle au bien et noter ce qui devient plus compréhensible."
    },
    "erreurs": [
      "Juger seulement la version grand écran.",
      "Choisir une image séduisante mais peu informative.",
      "Cacher une contrainte que la visite révélera.",
      "Modifier tous les éléments sans garder de trace."
    ],
    "checklist": {
      "titre": "Une vérification sur téléphone",
      "items": [
        "Ouvrir la recherche dans laquelle le bien doit apparaître.",
        "Noter ce que la vignette permet réellement de comprendre.",
        "Vérifier si le titre ajoute une information utile.",
        "Regarder ce que les premières photos confirment ou laissent ouvert.",
        "Noter un changement à examiner et conserver la version précédente."
      ]
    },
    "limite": "La présentation ne permet pas, seule, d’expliquer l’intérêt ou son absence. Les conditions du bien, les alternatives et la diffusion interviennent aussi.",
    "action": "Rejouer la découverte sur téléphone et écrire : compris, ambigu, manquant. Corriger d’abord une information importante et observable.",
    "situationLiee": "peu-contacts"
  },
  {
    "id": "annonce-vue-peu-de-contacts",
    "reponseCourte": "Une vue, une ouverture, un contact et une visite ne décrivent pas la même étape. Avant de modifier l’annonce, il faut savoir ce que les chiffres du support mesurent réellement.",
    "explication": [
      "Les définitions de « vue » ou « consultation » peuvent varier selon le portail. Vérifiez la définition, la période observée et les changements intervenus avant de comparer les chiffres.",
      "Un passage faible d’une étape à l’autre invite à examiner plusieurs pistes : diffusion, information visible, contenu de l’annonce, conditions du bien ou alternatives. Il n’identifie pas automatiquement la cause.",
      "Lorsque c’est possible, documentez une modification et observez ses conséquences sur une période adaptée. Un faible nombre d’observations ou d’autres changements simultanés limitent ce que l’on peut attribuer à cette modification."
    ],
    "exemple": {
      "titre": "Même silence, informations différentes",
      "texte": "Deux annonces ont peu de contacts. Pour l’une, les chiffres de consultation sont connus ; pour l’autre, ils ne le sont pas. La première permet d’examiner le passage à l’étape suivante. La seconde demande d’abord de retrouver la mesure disponible, sans conclure que sa présentation est en cause."
    },
    "erreurs": [
      "Conclure au prix à partir du seul silence.",
      "Comparer des chiffres dont les définitions diffèrent.",
      "Transformer une piste en cause certaine.",
      "Lire un petit échantillon comme une tendance établie."
    ],
    "checklist": {
      "titre": "Reconstituer le passage entre les étapes",
      "items": [
        "Noter le support, la période et la définition de chaque chiffre.",
        "Distinguer ce qui est mesuré de ce qui est seulement supposé.",
        "Vérifier la présence de l’annonce dans une recherche pertinente.",
        "Relire la liste puis l’annonce ouverte sur téléphone.",
        "Choisir une information manquante ou un changement documentable."
      ]
    },
    "limite": "Sans chiffres comparables ni observation suffisante, la lecture reste une hypothèse. L’absence de mesure n’est pas une mesure de zéro.",
    "action": "Rassembler les données disponibles, marquer les inconnues et choisir la première étape qu’il est réellement possible d’examiner.",
    "situationLiee": "peu-contacts"
  },
  {
    "id": "retours-de-visite",
    "reponseCourte": "Une visite sans offre ne désigne pas sa cause. Un retour précis et comparable peut rendre la prochaine vérification plus claire ; un commentaire isolé reste un commentaire isolé.",
    "explication": [
      "Demandez ce qui a correspondu aux attentes, ce qui a surpris et ce qui retient éventuellement une suite. Les visiteurs peuvent ne pas répondre ou ne pas avoir encore décidé. Leur silence ne doit pas être interprété comme une objection précise.",
      "Conservez la formulation du retour avant d’en proposer une interprétation. « Trop de travaux » peut désigner leur montant, leur durée, leur organisation ou une préférence personnelle. Ces sujets appellent des réponses différentes.",
      "Un motif répété mérite d’être examiné. Il ne devient pas une preuve de valeur ni un score de probabilité parce qu’il apparaît plusieurs fois. Regardez aussi si les visites concernent des projets comparables."
    ],
    "exemple": {
      "titre": "Préciser le sujet des travaux",
      "texte": "Deux visiteurs évoquent les travaux. L’un craint de ne pas pouvoir habiter le logement rapidement ; l’autre n’a pas de repère de coût. Faire préciser ces différences peut orienter deux vérifications distinctes, au lieu de déduire automatiquement un ajustement du prix."
    },
    "erreurs": [
      "Remplacer les notes par une impression générale.",
      "Prendre un compliment pour une intention d’achat.",
      "Interpréter « le prix » comme une demande certaine de baisse.",
      "Attribuer le même sens à des formulations proches."
    ],
    "checklist": {
      "titre": "Une grille courte après visite",
      "items": [
        "Qu’est-ce qui correspondait à ce que l’annonce laissait attendre ?",
        "Qu’est-ce qui a changé après la découverte du bien ?",
        "Quel point retient une prochaine étape, s’il y en a un ?",
        "Noter la date, le contexte utile et les mots employés, sans collecter d’informations inutiles.",
        "Séparer les faits cités, votre interprétation et la vérification proposée."
      ]
    },
    "limite": "Les retours décrivent des perceptions et des situations particulières. Ils ne valident pas le prix, les travaux ni la décision d’une autre personne.",
    "action": "Utiliser la même grille à la prochaine visite. Pour les visites passées, distinguer les notes retrouvées des souvenirs incertains.",
    "situationLiee": "visites"
  },
  {
    "id": "verifier-avant-baisse-prix",
    "reponseCourte": "Avant de modifier le prix, vérifiez son fondement, les alternatives pertinentes et les informations qui motivent cette réflexion. Une modification peut être utile ; le seul inconfort de l’attente ne suffit pas à la déterminer.",
    "explication": [
      "Le prix, la présentation, la diffusion et les caractéristiques du bien peuvent intervenir ensemble. Distinguer ces sujets évite d’attendre d’un changement de prix qu’il résolve une information manquante ou une difficulté mal comprise.",
      "Les annonces actuelles décrivent des offres proposées, pas des ventes réalisées. Les données DVF décrivent des ventes passées, avec leurs dates et leurs limites. Aucune de ces sources ne suffit seule à attribuer une valeur au bien.",
      "L’historique des changements doit être conservé pour comprendre ce qui a été essayé. Il ne permet pas de deviner ce que tous les acheteurs pensent. Comparer un ajustement, une vérification préalable et une attente reste possible."
    ],
    "exemple": {
      "titre": "Vérifier avant d’attribuer une cause",
      "texte": "Un propriétaire envisage une modification après une période sans contact. Il constate que les statistiques ne sont pas disponibles et que certaines informations importantes manquent dans l’annonce. Il peut d’abord récupérer ces éléments, puis reprendre la question du prix sur une base plus complète."
    },
    "erreurs": [
      "Fixer un nouveau montant sans comparaison pertinente.",
      "Présumer que chaque remarque parle de prix.",
      "Confondre annonces en ligne et transactions réalisées.",
      "Conclure à un effet certain après plusieurs changements simultanés."
    ],
    "checklist": {
      "titre": "Les vérifications avant la décision",
      "items": [
        "Retrouver le fondement du prix actuel et sa date.",
        "Vérifier les informations de diffusion et de consultation disponibles.",
        "Comparer les alternatives actuelles sans les confondre avec des ventes.",
        "Examiner des ventes passées réellement comparables et leurs limites.",
        "Lire les retours précis et les points non renseignés.",
        "Comparer les conséquences d’un ajustement, d’une vérification et d’une attente."
      ]
    },
    "limite": "Cette ressource organise la décision ; elle ne calcule pas un prix et ne garantit pas l’effet d’un ajustement.",
    "action": "Écrire ce qui justifierait un changement et ce qui reste à vérifier avant de choisir son ampleur ou son calendrier.",
    "situationLiee": "visites"
  },
  {
    "id": "reprendre-commercialisation",
    "reponseCourte": "Une commercialisation longue appelle une lecture de l’historique. Continuer, faire une pause ou reprendre certains éléments sont des options ; l’ancienneté seule n’impose pas une relance.",
    "explication": [
      "Reconstituez ce qui a changé depuis le lancement : présentation, conditions, prix, diffusion, visites et contraintes du projet. Des repères datés valent mieux qu’un sentiment général d’usure.",
      "Examinez ce que les observations permettent d’apprendre et ce qu’elles ne permettent pas d’expliquer. Un manque de traces reste une incertitude, pas la preuve qu’une stratégie a échoué.",
      "La comparaison actuelle peut différer de celle du lancement. Une pause peut donner le temps de traiter un sujet précis ; elle n’efface pas nécessairement l’historique d’une annonce et ne garantit pas un nouvel intérêt."
    ],
    "exemple": {
      "titre": "Une pause avec un objectif précis",
      "texte": "Un propriétaire souhaite suspendre la publication pour rassembler des informations sur des travaux souvent évoqués. Il définit ce qu’il doit obtenir avant de réexaminer la vente. La durée de la pause dépend de cette vérification ; aucun résultat de commercialisation n’est présumé."
    },
    "erreurs": [
      "Déduire de l’ancienneté que le bien ne sera plus regardé.",
      "Republier en supposant que tout l’historique disparaît.",
      "Reprendre sans savoir ce que l’on veut clarifier.",
      "Continuer par habitude sans réexaminer ses propres contraintes."
    ],
    "checklist": {
      "titre": "Construire une suite à partir de l’historique",
      "items": [
        "Noter les dates, versions, prix et changements connus.",
        "Rassembler les retours disponibles et marquer les souvenirs incertains.",
        "Identifier ce qui a changé dans le bien, le projet ou les alternatives.",
        "Comparer poursuite, pause utile et reprise ciblée.",
        "Définir la condition qui ferait choisir ou réexaminer chaque option.",
        "Conserver la décision et les informations à observer ensuite."
      ]
    },
    "limite": "Ni une pause ni une relance ne garantissent une vente. Leur intérêt dépend du sujet traité, du bien, des alternatives et de votre situation.",
    "action": "Reconstituer une chronologie courte puis choisir une information utile à obtenir avant de décider comment poursuivre.",
    "situationLiee": "longtemps"
  }
,
  {
    "id": "marge-negociation-erreur-25000",
    "reponseCourte": "Afficher un prix supérieur de 10 % pour anticiper une négociation est le réflexe le plus coûteux du marché immobilier actuel. En 2026, les acheteurs solvables filtrent par budget strict et alertes automatiques : un bien surévalué est ignoré dès son lancement, perd sa fraîcheur en 90 jours et finit vendu avec une décote subie supérieure à la marge initiale.",
    "explication": [
      "Le mythe de la marge de négociation repose sur une vision dépassée où l'acheteur découvrait les biens en vitrine. Aujourd'hui, les acquéreurs comparent instantanément l'historique DVF des ventes réelles de la rue et les barèmes au mètre carré sur leur smartphone. Lorsqu'une maison est positionnée 10 % au-dessus de sa valeur réelle, elle sort des critères des acheteurs qualifiés et n'apparaît que face à des profils dont les attentes ne correspondent pas au bien.",
      "L'effet d'usure de l'annonce : les trois premières semaines concentrent 80 % de la visibilité et des contacts qualifiés. Si aucun contact sérieux n'intervient durant cette fenêtre, l'annonce stagne. Au-delà de 90 jours de parution, les acheteurs présument un défaut caché ou une situation de blocage, ce qui ouvre la porte aux offres agressives.",
      "La création de tension concurrentielle : un bien positionné au juste prix de marché dès le premier jour suscite des visites groupées et des offres au prix, neutralisant toute tentative de négociation à la baisse."
    ],
    "exemple": {
      "titre": "Cas réel d'une maison à Lèves affichée à 275 000 €",
      "texte": "Pour une maison dont la valeur de marché établie par les ventes DVF récentes était de 250 000 €, les vendeurs ont choisi d'afficher 275 000 € pour 'se garder 25 000 € de marge'. Résultat après 4 mois sans visite qualifiée et deux baisses successives : une offre acceptée à 225 000 €, soit 25 000 € de perte nette par rapport à une mise en vente au prix dès le jour 1."
    },
    "erreurs": [
      "Croire que les acheteurs feront une offre basse s'ils aiment le bien (ils ne visitent tout simplement pas).",
      "Confondre les prix affichés sur les portails avec les prix réels enregistrés chez les notaires.",
      "Compenser une marge de négociation imaginaire au détriment de l'effet nouveauté.",
      "Procéder à des baisses de prix successives et timides qui décrédibilisent l'annonce."
    ],
    "checklist": {
      "titre": "Les 5 vérifications avant de fixer son prix de départ",
      "items": [
        "Consulter les transactions réelles DVF dans un rayon de 500 mètres sur les 12 derniers mois.",
        "Identifier la tranche de prix exacte dans laquelle les alertes des acheteurs se déclenchent.",
        "Neutraliser l'affectif et les dépenses de décoration non valorisables sur le bâti.",
        "Vérifier le stock de biens concurrents actuellement disponibles sur Lèves et Chartres.",
        "Fixer une stratégie de prix d'appel créant la concurrence entre acheteurs."
      ]
    },
    "limite": "Le juste prix de marché ne garantit pas une vente instantanée si les diagnostics ou l'état du bâti comportent des anomalies non levées préalablement.",
    "action": "Consulter les repères DVF récents de votre secteur ou réaliser une clarification de valeur sur levois.fr avant toute diffusion.",
    "situationLiee": "preparer"
  }
];
export function getResourceContent(id:string):ResourceContent{const content=resourceContents.find(r=>r.id===id);if(!content)throw new Error('Ressource inconnue : '+id);return content;}
