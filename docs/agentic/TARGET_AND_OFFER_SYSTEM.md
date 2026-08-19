# LEVOIS — système de cibles et d’offres

Statut : architecture cible documentaire. Ce document ne décrit aucun agent actif, aucune collecte nouvelle et aucune automatisation déployée.

## 1. Finalité

LEVOIS commence par comprendre une personne dans une situation donnée, puis lui fournit une première lecture utile avant de demander une coordonnée. Le système d’offres sert une seule métrique directrice : **une conversation humaine qualifiée, déclenchée avec assez de contexte pour que Mouaad et la personne puissent avancer réellement**.

Le site public, les parcours, le cockpit et les futurs agents forment un seul système, mais n’ont pas la même autorité :

| Couche | Rôle | Autorité |
|---|---|---|
| Déterministe | restituer une règle explicable, conserver un état, détecter une échéance | applique uniquement des règles validées |
| Agent | analyser, relier des signaux, préparer une proposition ou un brouillon | ne confirme ni n’envoie ; aucune action externe autonome |
| Mouaad | comprendre la nuance, arbitrer, négocier et engager sa responsabilité | décide et valide les actions sensibles |
| Personne concernée | exprimer, corriger, consentir et décider pour son projet | reste propriétaire de ses choix et de son consentement |

## 2. État actuel et architecture cible

| Dimension | État actuel documenté | Architecture cible |
|---|---|---|
| Publics | parcours publics acheteur et vendeur, audit d’annonce, prescripteurs et candidats identifiés comme publics secondaires | sept situations explicites, avec une promesse et une suite adaptées à chacune |
| Valeur | restitution avant transmission déjà posée comme principe produit | contrat obligatoire de chaque offre : première valeur visible sans coordonnées, puis activation volontaire |
| Qualification | formulaires et triage cockpit ; qualification humaine | agents BUY-01, SEL-01 ou OPS-01 préparent la lecture, sans transformer une hypothèse en vérité métier |
| Continuité | continuité site → cockpit partiellement disponible ; plusieurs fonctions restent à livrer | provenance conservée du signal à la conversation et à l’enseignement LEVOIS Lab |
| Personnalisation | critères, scénarios et chronologie prévus dans le cockpit | restitution de la compréhension validée, modifiable sans recommencer le parcours |
| Actions externes | action humaine | demeure humaine : un agent peut préparer, Mouaad relit et déclenche |

## 3. Doctrine de collecte

1. Demander seulement ce qui améliore la restitution en cours.
2. Séparer ce qui est déclaré, observé, inféré et à confirmer.
3. Ne jamais déduire un consentement marketing d’une demande de service.
4. Ne pas créer un projet client à partir d’une simple information TIM ou d’une recommandation.
5. Une adresse consultée, une annonce transmise ou un budget approximatif ne prouve ni propriété, ni mandat, ni capacité financière.
6. Les données sensibles ou engageantes arrivent au moment où elles deviennent nécessaires, avec finalité et durée expliquées.
7. Toute activation est volontaire. Refuser de transmettre ses coordonnées ne retire pas la restitution déjà fournie.

## 4. Analyse des cibles

### 4.1 Acquéreur en début de réflexion

| Champ | Analyse |
|---|---|
| Situation de départ | Consulte des annonces, possède une enveloppe approximative et accumule des critères encore peu hiérarchisés. |
| Ce qu’il dit vouloir | « Voir ce qui existe », obtenir davantage d’annonces ou connaître son budget maximal. |
| Ce qu’il veut réellement | Comprendre ce qui est possible, ce qui est important et quels compromis évitent de perdre du temps ou de se tromper. |
| Craintes | Acheter trop vite, payer trop cher, découvrir trop tard une contrainte, être poussé à visiter ou à s’engager. |
| Objections | « Je ne suis pas prêt », « je veux d’abord regarder seul », « mes critères vont encore changer ». |
| Ce qu’il compare | Portails, simulateurs, banques/courtiers, conseils de proches et premiers échanges avec des professionnels. |
| Ce qu’il ne comprend pas encore | La différence entre préférence, possibilité, exclusion, inconnue et dépendance entre critères ; l’effet réel des arbitrages. |
| Ce qui peut le faire avancer | Une restitution qui montre ses inconnues, deux ou trois scénarios cohérents et la prochaine question utile. |
| Ce qui peut casser sa confiance | Faux niveau de précision, estimation de capacité non fondée, urgence artificielle, coordonnées exigées avant toute valeur. |
| Rôle possible de LEVOIS | Structurer la réflexion, rendre les arbitrages visibles et préparer une conversation sans imposer une recherche active. |
| Moment où Mouaad devient indispensable | Quand plusieurs scénarios restent plausibles, qu’une contrainte financière ou de vie doit être comprise, ou qu’une décision de recherche doit être assumée. |
| Données strictement nécessaires | Zone large, type de projet, horizon approximatif, enveloppe déclarée comme ordre de grandeur, préférences principales et incertitudes. |
| Données à ne pas demander trop tôt | Pièces financières, adresse privée complète, identité détaillée, situation familiale exhaustive, justificatifs, accord de prospection. |

### 4.2 Acquéreur déjà avancé

| Champ | Analyse |
|---|---|
| Situation de départ | A consulté ou visité des biens et pense connaître ses critères ; les priorités, exceptions et flexibilités restent parfois implicites. |
| Ce qu’il dit vouloir | Recevoir uniquement « les bonnes annonces » et être alerté vite. |
| Ce qu’il veut réellement | Ne plus répéter son projet, éviter les faux positifs et comprendre pourquoi un bien mérite ou non son attention. |
| Craintes | Rater une opportunité, recevoir du bruit, voir ses critères déformés, être relancé sans raison. |
| Objections | « J’ai déjà mes alertes », « je connais le marché », « les agents ne lisent pas mes critères ». |
| Ce qu’il compare | Alertes de portails, chasse, réseau personnel, conseillers concurrents et sa propre veille. |
| Ce qu’il ne comprend pas encore | Les critères contradictoires, les concessions déjà faites en visite, les inconnues d’une annonce et la fraîcheur des données. |
| Ce qui peut le faire avancer | Une recherche versionnée, des scénarios, un exemple d’analyse explicable et un mécanisme de retour simple. |
| Ce qui peut casser sa confiance | Envoyer un bien qui viole un critère dur confirmé sans le signaler, présenter une donnée d’annonce comme certaine, modifier un critère silencieusement. |
| Rôle possible de LEVOIS | Maintenir une lecture fidèle et évolutive, préparer les analyses et transformer les retours en propositions à confirmer. |
| Moment où Mouaad devient indispensable | Validation des critères et scénarios, arbitrage d’un matching, préparation d’une visite, négociation ou offre éventuelle. |
| Données strictement nécessaires | Révision actuelle des critères, scénarios, biens déjà vus, motifs de refus, zones, horizon et canal de retour choisi après activation. |
| Données à ne pas demander trop tôt | Justificatifs financiers complets, données bancaires, détails personnels sans effet sur la recherche, consentements groupés. |

### 4.3 Propriétaire qui réfléchit à vendre

| Champ | Analyse |
|---|---|
| Situation de départ | Projet non déclenché ou lié à un changement futur ; aucune décision de mandat n’est encore souhaitée. |
| Ce qu’il dit vouloir | « Connaître le prix » ou savoir si « c’est le bon moment ». |
| Ce qu’il veut réellement | Réduire l’incertitude, préparer les décisions dans le bon ordre et ne pas subir l’urgence plus tard. |
| Craintes | Être démarché, obtenir une estimation flatteuse, divulguer trop tôt son projet, engager un mandat par simple prise de contact. |
| Objections | « Je ne vends pas maintenant », « je veux juste une idée », « je ne veux pas être rappelé sans arrêt ». |
| Ce qu’il compare | Estimations en ligne, avis de proches, prix affichés, DVF, agences et conseillers. |
| Ce qu’il ne comprend pas encore | Différence entre prix affiché, transaction observée, valeur défendable et stratégie de commercialisation ; limites d’une donnée locale. |
| Ce qui peut le faire avancer | Une lecture locale sourcée, ses limites, les informations à préparer et une prochaine décision non engageante. |
| Ce qui peut casser sa confiance | Présenter un prix automatique comme vérité, exploiter un événement de vie, inventer une tension ou demander immédiatement un rendez-vous. |
| Rôle possible de LEVOIS | Situer la situation, expliquer les signaux et organiser une préparation progressive. |
| Moment où Mouaad devient indispensable | Quand le contexte du bien, le calendrier, les travaux, la stratégie ou les conséquences d’un scénario exigent une visite et un jugement professionnel. |
| Données strictement nécessaires | Commune ou zone, type de bien, stade de réflexion, horizon approximatif, motif formulé librement si la personne souhaite le partager. |
| Données à ne pas demander trop tôt | Adresse exacte, identité des occupants, motif intime détaillé, titre de propriété, diagnostics, données financières, coordonnées avant restitution. |

### 4.4 Vendeur dont l’annonce est en ligne

| Champ | Analyse |
|---|---|
| Situation de départ | Annonce publiée ; vues, contacts, visites ou offres ne produisent pas le résultat attendu, et la personne envisage des changements sans diagnostic. |
| Ce qu’il dit vouloir | Plus de contacts, un avis sur le prix ou une correction rapide de l’annonce. |
| Ce qu’il veut réellement | Identifier le goulot réel et choisir une action défendable plutôt que modifier prix, texte ou photos au hasard. |
| Craintes | Perdre du temps, « griller » le bien, baisser inutilement, recevoir un discours destiné seulement à prendre le mandat. |
| Objections | « Le portail dit que l’annonce est bonne », « je veux continuer seul », « je ne veux pas donner mes chiffres ». |
| Ce qu’il compare | Statistiques du portail, annonces voisines, avis d’agences, réactions de visiteurs et changements testés seul. |
| Ce qu’il ne comprend pas encore | La lecture en entonnoir vues → contacts → visites → offres, la qualité des signaux et les limites d’un audit à distance. |
| Ce qui peut le faire avancer | Un audit limité, explicable et utile même si le portail bloque, avec actions déterministes et questions à vérifier. |
| Ce qui peut casser sa confiance | Prétendre avoir lu une page inaccessible, conclure sans données, recommander mécaniquement une baisse, transformer l’audit en prétexte commercial. |
| Rôle possible de LEVOIS | Lire les signaux, séparer observation et hypothèse, puis préparer un audit humain si la situation le justifie. |
| Moment où Mouaad devient indispensable | Pour confronter les signaux au bien, aux retours de visites et au contexte de vente, puis choisir une stratégie. |
| Données strictement nécessaires | Lien public facultatif, stade de diffusion, signal principal observé, quelques volumes ou tendances déclarés sans exiger de preuve initiale, actions déjà tentées. |
| Données à ne pas demander trop tôt | Mandat, adresse privée si non publique, identité des visiteurs, documents du bien, motif intime, coordonnées avant restitution. |

### 4.5 Propriétaire ou relation pouvant recommander

| Champ | Analyse |
|---|---|
| Situation de départ | Détient une information utile concernant un projet, mais ne veut ni prospecter ni devenir commercial. |
| Ce qu’il dit vouloir | Transmettre un contact ou comprendre comment recommander Mouaad. |
| Ce qu’il veut réellement | Aider sans mettre la relation en difficulté, connaître le cadre et rester libre de son niveau d’implication. |
| Craintes | Divulguer une information sans accord, déclencher une sollicitation gênante, être associé à une promesse commerciale. |
| Objections | « Je ne veux pas donner son numéro », « je préfère qu’il vous contacte », « je ne connais pas exactement son projet ». |
| Ce qu’il compare | Mise en relation directe, bouche-à-oreille informel, dispositifs de recommandation et abstention. |
| Ce qu’il ne comprend pas encore | Différence entre transmettre les coordonnées d’un tiers et lui donner un lien pour qu’il s’active volontairement ; conditions officielles à vérifier. |
| Ce qui peut le faire avancer | Un lien ou message neutre à transmettre, des limites claires et une option sans collecte de tiers. |
| Ce qui peut casser sa confiance | Collecter un tiers sans base appropriée, publier un chiffre de rémunération non sourcé, relancer le recommandant comme un commercial. |
| Rôle possible de LEVOIS | Donner un cadre simple, traçable et responsable à une recommandation volontaire. |
| Moment où Mouaad devient indispensable | Dès qu’un échange avec la personne recommandée commence, ou pour expliquer les conditions officielles sans extrapolation. |
| Données strictement nécessaires | Type de recommandation et mode choisi ; idéalement aucune donnée du tiers tant que celui-ci ne s’est pas activé lui-même. |
| Données à ne pas demander trop tôt | Coordonnées du tiers, détails de son projet, situation financière ou familiale, promesse de rémunération. |

### 4.6 Contact ou opération TIM

| Champ | Analyse |
|---|---|
| Situation de départ | Information reçue ou transmise entre conseillers ; accord à formaliser, opération suivie ailleurs ou rémunération potentielle à surveiller. |
| Ce qu’il dit vouloir | « Ne pas oublier l’accord », suivre le dossier ou savoir quand une rémunération est due. |
| Ce qu’il veut réellement | Une chronologie fiable, des responsabilités claires et aucune confusion entre accord, opération, mandat et paiement. |
| Craintes | Oubli de formalisation, statut supposé, montant erroné, document perdu, relation client créée artificiellement. |
| Objections | « C’est déjà dans OMEGA », « un email suffit », « le montant sera calculé plus tard ». |
| Ce qu’il compare | Email, agenda, notes, outils SAFTI/OMEGA et suivi manuel. |
| Ce qu’il ne comprend pas encore | Les trois axes indépendants — accord, opération, rémunération — et le fait qu’un signal ne prouve ni mandat, ni transaction, ni somme due. |
| Ce qui peut le faire avancer | Une prochaine action explicite, une échéance, une référence documentaire et un statut confirmé par l’humain. |
| Ce qui peut casser sa confiance | Calcul présenté comme dû sans fait générateur validé, données financières exposées, changement de statut automatique. |
| Rôle possible de LEVOIS | Maintenir le suivi opérationnel distinct du CRM client et signaler les éléments à confirmer. |
| Moment où Mouaad devient indispensable | Formalisation, confirmation d’un jalon, validation des termes, montant, paiement, litige ou clôture. |
| Données strictement nécessaires | Parties professionnelles minimales, type d’accord, prochaine action, échéance, références privées autorisées et états confirmés. |
| Données à ne pas demander trop tôt | Coordonnées complètes du client concerné, détails financiers non nécessaires, copie intégrale de documents, montant présenté comme certain avant validation. |

### 4.7 Candidat conseiller immobilier

| Champ | Analyse |
|---|---|
| Situation de départ | Envisage une reconversion ou découvre le statut de conseiller indépendant et cherche à comprendre le métier réel. |
| Ce qu’il dit vouloir | Savoir si le métier « peut marcher », comment démarrer et quel accompagnement existe. |
| Ce qu’il veut réellement | Évaluer l’adéquation du métier avec sa situation, ses efforts possibles et son besoin de cadre, sans discours de recrutement. |
| Craintes | Promesse de revenu trompeuse, coûts ou difficultés minimisés, isolement, pression à rejoindre rapidement. |
| Objections | « Je n’ai pas de réseau », « je ne sais pas vendre », « je veux une sécurité de revenu ». |
| Ce qu’il compare | Réseaux de mandataires, agences salariées, autres reconversions, formations et indépendance seule. |
| Ce qu’il ne comprend pas encore | Réalité du statut indépendant, variabilité des résultats, travail de prospection et de suivi, limites de l’accompagnement. |
| Ce qui peut le faire avancer | Une présentation honnête du quotidien, des exigences, du cadre SAFTI et des systèmes LEVOIS, puis une conversation exploratoire. |
| Ce qui peut casser sa confiance | Revenu promis, réussite présentée comme automatique, chiffres non sourcés, urgence ou dissimulation du statut. |
| Rôle possible de LEVOIS | Rendre le métier et la méthode lisibles, sans transformer la marque en vitrine de recrutement. |
| Moment où Mouaad devient indispensable | Pour confronter les attentes au quotidien réel, expliquer son accompagnement et décider s’il existe un intérêt mutuel. |
| Données strictement nécessaires | Stade de réflexion, questions principales, expérience déclarée de façon facultative et moyen de contact seulement après la première information utile. |
| Données à ne pas demander trop tôt | Revenus, dettes, documents d’identité, réseau de proches, liste de contacts, engagement ou inscription. |

## 5. Architecture des offres

### 5.1 Offre acquéreur — « Situer ma recherche »

| Champ | Contrat d’offre |
|---|---|
| Nom de travail | Situer ma recherche |
| Cible | Acquéreur en début de réflexion ou déjà avancé |
| Problème traité | Critères nombreux, contradictoires ou mal hiérarchisés ; alertes peu pertinentes |
| Promesse | Rendre visibles préférences, possibilités, exclusions, inconnues et arbitrages sans promettre un bien |
| Première action utile | Classer quelques dimensions et signaler ce qui reste incertain |
| Valeur avant coordonnées | Restitution immédiate des priorités, tensions et questions utiles ; aucun contact requis pour la lire |
| Résultat ou restitution | Lecture structurée et scénarios de recherche proposés, clairement non confirmés |
| Canal d’entrée | `/ma-recherche`, contenu associé, recommandation ou accès direct |
| Informations collectées | Zone, enveloppe déclarée, horizon, critères, flexibilité, inconnues ; coordonnées uniquement lors d’une activation volontaire |
| Prochaine action | Sauvegarder volontairement, demander une conversation ou repartir avec la restitution |
| Intervention humaine | Mouaad qualifie, corrige et confirme les scénarios avant toute veille ou envoi |
| Indicateur de réussite | Conversation qualifiée ou autonomie accrue de la personne, puis réduction des annonces inutiles |
| Risque de mauvaise interprétation | Confondre scénario avec faisabilité financière ou garantie de trouver |
| Limites à afficher | Données déclaratives, annonces imparfaites, financement à vérifier, aucun matching ou conseil définitif automatique |

### 5.2 Offre vendeur futur — « Situer ma vente »

| Champ | Contrat d’offre |
|---|---|
| Nom de travail | Situer ma vente |
| Cible | Propriétaire qui réfléchit à vendre |
| Problème traité | Chercher un prix avant d’avoir compris contexte, calendrier et décisions |
| Promesse | Situer les signaux locaux et la prochaine décision utile, sans estimation définitive |
| Première action utile | Décrire la situation et sélectionner le besoin actuel |
| Valeur avant coordonnées | Lecture des facteurs à préparer, sources locales disponibles et limites de ce qui peut être conclu à distance |
| Résultat ou restitution | Situation synthétique, questions ouvertes et prochain pas non engageant |
| Canal d’entrée | `/situer-ma-vente`, contenu vendeur, DVF public ou recommandation |
| Informations collectées | Zone/commune, type de bien, horizon, situation déclarée ; activation séparée |
| Prochaine action | Préparer des informations, observer, ou demander un échange avec Mouaad |
| Intervention humaine | Visite, contextualisation, estimation et stratégie restent humaines |
| Indicateur de réussite | Décision mieux préparée et conversation qualifiée au bon moment |
| Risque de mauvaise interprétation | Assimiler une lecture locale à un avis de valeur ou à une garantie de délai |
| Limites à afficher | DVF datée et imparfaite, prix affichés non égaux aux prix signés, visite nécessaire pour conclure |

### 5.3 Offre vendeur déjà publié — « Lire mon annonce en ligne »

| Champ | Contrat d’offre |
|---|---|
| Nom de travail | Lire mon annonce en ligne |
| Cible | Vendeur dont l’annonce est déjà publiée |
| Problème traité | Modifier prix, diffusion ou présentation sans avoir localisé la rupture |
| Promesse | Lire les signaux disponibles et choisir une prochaine vérification plutôt qu’une correction au hasard |
| Première action utile | Fournir le lien facultatif, le stade de commercialisation et le signal observé |
| Valeur avant coordonnées | Audit public hybride : lecture possible du lien si accessible, réponses contextuelles et actions déterministes même s’il est bloqué |
| Résultat ou restitution | Observations, hypothèses, inconnues et prochaine action à vérifier |
| Canal d’entrée | Parcours d’audit d’annonce, contenu ou accès direct |
| Informations collectées | URL publique facultative, tendances déclarées de vues/contacts/visites/offres, durée perçue et actions déjà tentées |
| Prochaine action | Observer un indicateur, corriger un élément vérifiable ou demander un audit humain |
| Intervention humaine | Mouaad confronte la lecture au bien et choisit toute évolution de commercialisation |
| Indicateur de réussite | Une décision étayée remplace une modification aléatoire ; conversation qualifiée si nécessaire |
| Risque de mauvaise interprétation | Croire que LEVOIS a inspecté une page inaccessible ou recommande automatiquement une baisse |
| Limites à afficher | Accès portail non garanti, chiffres déclaratifs, audit à distance incomplet, aucune promesse de vente |

### 5.4 Offre personnalisée — « Ma lecture LEVOIS »

| Champ | Contrat d’offre |
|---|---|
| Nom de travail | Ma lecture LEVOIS |
| Cible | Personne ayant volontairement activé un projet et échangé avec Mouaad |
| Problème traité | Devoir répéter le projet et perdre les nuances comprises au fil des échanges |
| Promesse | Retrouver ce que Mouaad a compris, distinguer confirmé et à confirmer, puis corriger sans repartir de zéro |
| Première action utile | Relire une synthèse datée et sa provenance |
| Valeur avant coordonnées | Non applicable comme point d’entrée : cette offre n’existe qu’après activation ; les offres publiques ont déjà livré leur restitution |
| Résultat ou restitution | Synthèse, critères/scénarios ou situation, décisions, inconnues et prochaine action |
| Canal d’entrée | Lien privé ou restitution préparée depuis le cockpit, sans supposer un canal technique non disponible |
| Informations collectées | Seulement les corrections et compléments fournis volontairement |
| Prochaine action | Confirmer, corriger, demander un échange ou ne rien changer |
| Intervention humaine | Mouaad valide toute donnée métier et toute modification de critère confirmé |
| Indicateur de réussite | Moins de répétition, moins de contradictions et meilleure préparation des échanges |
| Risque de mauvaise interprétation | Présenter une inférence agentique comme parole du client ou exposer le mauvais dossier |
| Limites à afficher | Synthèse datée, source et certitude visibles ; pas de vérité automatique ; accès privé requis |

### 5.5 Offre TIM — « Suivi Accord TIM »

| Champ | Contrat d’offre |
|---|---|
| Nom de travail | Suivi Accord TIM |
| Cible | Mouaad et parties professionnelles concernées selon leurs droits |
| Problème traité | Perdre le fil entre formalisation, opération et rémunération |
| Promesse | Une prochaine action et une chronologie distinctes pour chaque axe, sans déduire un résultat |
| Première action utile | Identifier l’accord à formaliser et la prochaine vérification |
| Valeur avant coordonnées | Pour une partie externe, explication du cadre avant collecte ; pour Mouaad, synthèse interne sans création de client artificielle |
| Résultat ou restitution | État confirmé, éléments à vérifier, échéances et références autorisées |
| Canal d’entrée | Interaction humaine, cockpit privé ou document professionnel explicitement référencé |
| Informations collectées | Parties minimales, termes validés, événements et références nécessaires ; PII client minimisée |
| Prochaine action | Formaliser, confirmer OMEGA, suivre l’opération, vérifier un fait générateur ou un paiement |
| Intervention humaine | Mouaad valide termes, statuts, montants, paiement, litige et clôture |
| Indicateur de réussite | Aucun accord non terminal ni montant à vérifier sans prochaine action |
| Risque de mauvaise interprétation | Confondre accord avec mandat, opération avec transaction acquise ou estimation avec somme due |
| Limites à afficher | États indépendants ; règles officielles et assiette à confirmer ; aucune action financière automatique |

### 5.6 Offre recommandation — « Transmettre LEVOIS »

| Champ | Contrat d’offre |
|---|---|
| Nom de travail | Transmettre LEVOIS |
| Cible | Propriétaire ou relation pouvant recommander |
| Problème traité | Aider un proche sans devenir apporteur informel ni divulguer ses données |
| Promesse | Un moyen neutre de transmettre la méthode et de laisser la personne s’activer elle-même |
| Première action utile | Choisir un lien adapté au besoin supposé, sans saisir le contact tiers |
| Valeur avant coordonnées | Explication des options, limites et conditions officielles ; message transmissible non personnalisé |
| Résultat ou restitution | Lien/parcours à partager et rappel de ne pas transmettre une donnée sans accord |
| Canal d’entrée | Page secondaire dédiée, bouche-à-oreille, échange humain |
| Informations collectées | Aucune donnée de tiers par défaut ; coordonnées du recommandant seulement si une finalité distincte est acceptée |
| Prochaine action | La personne concernée visite le parcours et choisit elle-même une activation |
| Intervention humaine | Mouaad répond aux questions de cadre et qualifie toute mise en relation directe |
| Indicateur de réussite | Activations volontaires attribuables sans plainte ni collecte indue |
| Risque de mauvaise interprétation | Promesse de rémunération ou sollicitation d’un tiers sans accord |
| Limites à afficher | Conditions SAFTI Connect à vérifier sur documentation officielle à jour ; aucune récompense présumée |

### 5.7 Offre recrutement — « Découvrir le métier avec Mouaad »

| Champ | Contrat d’offre |
|---|---|
| Nom de travail | Découvrir le métier avec Mouaad |
| Cible | Candidat conseiller immobilier |
| Problème traité | Décider à partir d’un discours incomplet sur l’indépendance, le revenu ou l’accompagnement |
| Promesse | Comprendre le cadre, les exigences, les systèmes d’appui et les limites avant toute candidature |
| Première action utile | Parcourir une présentation honnête du quotidien et formuler ses questions |
| Valeur avant coordonnées | Explication du statut indépendant, des activités réelles et de ce que l’accompagnement couvre ou non |
| Résultat ou restitution | Auto-positionnement et questions à approfondir, sans verdict automatique d’aptitude |
| Canal d’entrée | Destination secondaire dédiée, contenu responsable ou recommandation |
| Informations collectées | Stade de réflexion et questions ; coordonnées seulement pour demander un échange |
| Prochaine action | Continuer sa réflexion ou demander une conversation exploratoire avec Mouaad |
| Intervention humaine | Mouaad confronte attentes et réalité, sans pression ni promesse |
| Indicateur de réussite | Conversations informées et renoncement sain lorsque le métier ne convient pas |
| Risque de mauvaise interprétation | Confondre accompagnement avec garantie de revenu ou recrutement avec emploi salarié |
| Limites à afficher | Statut indépendant, résultats variables, aucune promesse de revenu, règles réseau à sourcer |

## 6. Routage vers l’organisation V1

| Situation | Responsable logique | Contributeurs | Passage obligatoire à Mouaad |
|---|---|---|---|
| Recherche acquéreur | BUY-01 | OPS-01, MKT-01, TRUST-01 | critères/scénarios confirmés, matching, envoi, visite, offre |
| Vente future ou annonce en ligne | SEL-01 | OPS-01, MKT-01, TRUST-01 | estimation, stratégie, mandat, ajustement, offre |
| Recommandation ou recrutement | GROW-01 | OPS-01, TRUST-01 | toute prise de contact ciblée ou affirmation sensible |
| Accord TIM | FIN-01 | OPS-01, TRUST-01 | termes, états, montant, paiement, litige, clôture |
| Arbitrage transversal | COS-01 | agents concernés | priorité, engagement, exception ou élargissement de droits |

Les neuf identifiants (`COS-01`, `OPS-01`, `BUY-01`, `SEL-01`, `MKT-01`, `GROW-01`, `PROD-01`, `FIN-01`, `TRUST-01`) désignent des **rôles logiques futurs**, pas neuf processus autonomes déjà actifs.

## 7. Critères de préparation d’une conversation — `conversation_ready`

Un dossier est prêt pour une conversation lorsque les cinq éléments suivants sont disponibles ou explicitement marqués inconnus :

1. la situation et la cible concernée ;
2. la question ou décision que la personne cherche réellement à prendre ;
3. les faits déclarés utiles et leur fraîcheur ;
4. les principales inconnues, objections ou contradictions ;
5. une prochaine action que Mouaad peut discuter sans recommencer depuis zéro.

Ce statut amont ne compte pas dans la North Star. Seul `KPI_SYSTEM.md` définit une conversation humaine qualifiée après un échange réel, revu et dédupliqué. Un formulaire complété, un email reçu ou une annonce analysée ne suffit donc jamais. La personne peut aussi obtenir de la valeur et décider qu’aucune conversation n’est nécessaire : ce résultat n’est pas un échec.

## 8. Garde-fous de mise en œuvre future

- Aucun agent ne modifie silencieusement un critère, un stade, un consentement, un état TIM ou une synthèse validée.
- Une proposition devenue ancienne après modification de sa source expire ; elle n’est pas recyclée comme actuelle.
- L’activation d’une offre ne vaut pas consentement à un autre usage.
- Toute action externe est préparée au maximum au niveau 3, puis relue et déclenchée par Mouaad.
- Les exemples et tests utilisent uniquement des personnes, biens, montants et conversations fictifs.
- Si un connecteur manque ou tombe en panne, la restitution et la saisie manuelle restent possibles.
