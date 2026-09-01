# LEVOIS — Phase 3 — Spécification fonctionnelle de `/ma-recherche`

**Statut : PHASE 3 : VALIDÉE ET CLÔTURÉE.**

**Date de révision :** 1er septembre 2026.

**Nature :** document fonctionnel et éditorial, sans code, sans maquette et sans direction artistique.

**Socle :** contrat d’ouverture validé, plateforme éditoriale de Phase 2, audit conversationnel de Phase 1 et arbitrages ARB-01 à ARB-03.

## 0. Décision de produit

`/ma-recherche` aide une personne à clarifier l’achat de sa **résidence principale**. Le parcours essentiel traverse sept fonctions métier et produit une première lecture réellement utile avant toute coordonnée.

Il ne produit ni estimation, ni faisabilité financière, ni lecture DVF personnalisée, ni recommandation de bien. Il ne note pas le projet, ne valide pas un budget ou un financement et ne transforme jamais une absence de réponse en compromis.

La personne peut :

1. consulter sa première lecture sans coordonnées ;
2. quitter après cette lecture sans être considérée comme ayant abandonné ;
3. choisir explicitement un module **Affiner cette lecture** ;
4. recevoir facultativement la synthèse par email, si cette fonction est disponible ;
5. demander séparément un échange avec Mouaad.

### 0.1. Volumes normatifs

| Chemin | Questions soumises | Sortie |
|---|---:|---|
| Parcours standard | **11** | Première lecture |
| Propriétaire ou bien identifié | **12** | Première lecture |
| Propriétaire avec bien identifié | **13** | Première lecture |
| Investissement | **1** | Réponse utile de sortie |

« Voir ma première lecture » est une action et une restitution, jamais comptée comme une question.

Les durées suivantes sont des **objectifs de conception à vérifier sur prototype avec de vraies personnes**, pas des durées démontrées :

- parcours court : 3 à 5 minutes ;
- parcours typique : 6 à 8 minutes maximum ;
- parcours obligatoire le plus long : 10 à 12 minutes maximum.

Le parcours essentiel respecte 10 à 14 questions dans les cas usuels et reste sous le plafond absolu de 18. La présente V1 plafonne en réalité son maximum à 13 questions.

### 0.2. Règles irrévocables dans cette V1

- résidence principale uniquement ;
- investissement séparé ;
- situation d’occupation avant dépendance à une vente ;
- question de vente réservée aux propriétaires ;
- usages avant typologie ;
- valeur avant coordonnées ;
- aucune donnée locale utilisée pour conclure sur le projet ;
- aucun montant financier demandé, même facultativement ;
- aucun compte, CRM ou fiche acquéreur implicite ;
- aucune écriture dans `RECHERCHE_DB` ou une autre base LEVOIS ;
- aucune réponse personnelle dans l’analytics ;
- synthèse et demande d’échange strictement séparées ;
- aucun diagnostic certain ni appel automatique.

## 1. Contrat d’une question et du traducteur

### 1.1. Une question soumise

Une question soumise correspond à un groupe de réponse cohérent validé en une fois. Elle :

- traite une seule opération mentale ;
- n’utilise aucune matrice ;
- indique clairement si une ou plusieurs réponses sont permises ;
- propose « je ne sais pas encore » lorsque légitime ;
- borne les choix et tout texte libre ;
- modifie une branche, le traducteur ou la restitution ;
- possède des dépendances et invalidations explicites.

Une précision rare ne rejoint pas le parcours obligatoire. Elle devient une question conditionnelle indispensable ou un module facultatif après la première lecture.

### 1.2. Niveaux de certitude

| Niveau | Condition | Formulation de référence |
|---|---|---|
| **D — Déclaré** | Reprise fidèle d’une réponse. | « Vous avez indiqué que… » |
| **C — Conséquence directe** | Effet logique certain dans le parcours. | « Cela change… » |
| **I — Interprétation probable** | Plusieurs réponses convergent. | « Cela semble indiquer… » |
| **H — Hypothèse fragile** | Une information incomplète soutient l’idée. | « Cela pourrait signifier… » |
| **N — Non concluable** | Une donnée manque ou deux réponses doivent être clarifiées. | « Impossible à conclure pour l’instant. » |

Une déclaration peut être certaine comme déclaration sans rendre certaine son interprétation immobilière.

### 1.3. Traducteur en direct

Après validation d’une réponse utile, le traducteur affiche au maximum :

1. ce qui est retenu ;
2. ce que cela change dans la suite ou la lecture ;
3. ce qui reste ouvert, seulement si la limite est immédiatement utile.

Il ne félicite pas artificiellement, ne donne aucun score, ne dramatise pas et ne répète pas le libellé sans valeur nouvelle.

## 2. Vue d’ensemble des sept étapes

| Étape | Fonction | Questions |
|---|---|---|
| **Avant le parcours** | Vérifier le périmètre résidence principale. | S0 |
| **1. Niveau d’avancement** | Distinguer idée, veille, visites, bien identifié et offre. | E1 ; E1B si bien identifié/offre |
| **2. Situation actuelle** | Identifier l’occupation et une éventuelle dépendance à une vente. | E2 ; E2B si propriétaire |
| **3. Amélioration attendue** | Nommer le changement principal et ce qui ne doit pas être perdu. | E3, E4 |
| **4. Usage avant typologie** | Identifier l’usage qui doit principalement mieux fonctionner. | E5 |
| **5. Cadre de réalité** | Organiser géographie, préparation financière, horizon et hypothèse de logement. | E6 à E9 |
| **6. Arbitrage utile** | Choisir une vérification ou un scénario sans fabriquer de dilemme. | E10 |
| **7. Lecture avant coordonnées** | Afficher quatre blocs, permettre la correction et proposer les sorties séparées. | Action « Voir ma première lecture » |

## 3. Question de périmètre

### S0 — Finalité du projet

**Question exacte :** « Ce parcours correspond-il à l’achat de votre résidence principale ? »

**Obligatoire :** oui. Une seule réponse.

**Réponses :**

- « Oui » ;
- « J’hésite entre résidence principale et investissement » ;
- « Non, mon projet concerne surtout un investissement » ;
- « Je ne sais pas encore ».

**Effets :**

- « Oui » ouvre E1 ;
- hésitation ou incertitude permet soit de poursuivre uniquement l’hypothèse résidence principale, soit de sortir ;
- investissement seul ferme le parcours sans créer d’état personnel.

**Réponse de sortie investissement exacte :**

> Ce parcours est conçu pour l’achat de votre résidence principale. Un investissement repose sur d’autres questions : objectif, durée, effort financier, gestion et niveau de risque. Vous pouvez exposer votre situation à Mouaad sans poursuivre un parcours inadapté.

**Destination :** `/contact?objet=investissement`.

Le paramètre présélectionne uniquement le sujet « investissement ». Il ne contient aucune donnée personnelle, ne crée aucune demande et ne déclenche aucun envoi. Avant toute promotion active future de cette entrée, une porte éditoriale `/investir` devra précéder le contact.

## 4. Étape 1 — Niveau d’avancement

### E1 — Avancement observable

**Question exacte :** « Où en êtes-vous aujourd’hui dans votre projet d’achat ? »

**Obligatoire :** oui. Une seule réponse.

**Réponses :**

- « Je commence à y penser » ;
- « J’observe des annonces et des secteurs » ;
- « Je prépare mes premières visites » ;
- « Je visite déjà des biens » ;
- « J’ai un bien précis en tête » ;
- « Je prépare une offre ou j’en ai déjà fait une ».

**Effets :**

- règle le niveau de précision du traducteur ;
- affiche E1B seulement pour un bien précis ou une offre ;
- module les prochaines vérifications du bloc 4 ;
- ne déduit jamais l’urgence ou l’horizon.

**Traducteur :**

- idée/veille : « Votre recherche reste ouverte. Nous allons d’abord clarifier ce que l’achat doit changer avant de parler de solution. » — C ;
- visites : « Vous confrontez déjà vos critères à des biens réels. La lecture distinguera ce que ces visites ont confirmé de ce qui reste à vérifier. » — I ;
- bien/offre : « Un bien précis existe déjà. La lecture fera ressortir l’information qui vous manque, sans vous dire d’acheter ou de renoncer. » — C.

### E1B — Information manquante sur le bien

**Condition :** E1 vaut « bien précis » ou « offre ».

**Question exacte :** « Sur ce bien précis, quelle information vous manque le plus pour décider de la prochaine vérification ? »

**Obligatoire dans cette branche :** oui. Une seule réponse.

**Réponses :**

- « Les trajets et le quotidien autour » ;
- « L’organisation des espaces par rapport à mes usages » ;
- « L’état, les diagnostics ou les travaux » ;
- « Les charges et dépenses récurrentes » ;
- « Les documents de copropriété, si elle existe » ;
- « Le coût global que j’anticipe » ;
- « Je ne sais pas quoi vérifier ensuite » ;
- « Autre » — 120 caractères maximum, sans adresse ni URL.

**Effet :** crée une prochaine vérification dans le bloc 4. Rien de non sélectionné n’est déclaré absent ou vérifié.

## 5. Étape 2 — Situation actuelle

### E2 — Situation d’occupation

**Question exacte :** « Aujourd’hui, vous vivez principalement… »

**Obligatoire :** oui. Une seule réponse.

**Réponses :**

- « Dans un logement dont je suis propriétaire » ;
- « Dans un logement que je loue » ;
- « Chez quelqu’un qui m’héberge » ;
- « Dans une situation temporaire ou de transition » ;
- « Je préfère ne pas répondre ».

**Effets :**

- propriétaire affiche E2B ;
- les autres réponses interdisent toute question de vente préalable ;
- situation temporaire peut faire apparaître le calendrier comme point à vérifier, jamais comme urgence certaine ;
- aucune adresse, valeur, bail ou identité de tiers n’est demandé.

### E2B — Dépendance à une vente

**Condition :** E2 vaut « propriétaire ».

**Question exacte :** « Votre achat dépend-il de la vente de ce logement ? »

**Obligatoire dans cette branche :** oui. Une seule réponse.

**Réponses :** « Oui » ; « Non » ; « Je ne sais pas encore ».

**Effets :**

- oui : dépendance déclarée dans le bloc 4 et prise en compte par E10 ;
- non : aucune dépendance vente dans la lecture ;
- incertain : ordre achat–vente non concluable et prochaine vérification explicite.

**Traducteur :** « Cette réponse change l’ordre des décisions à préparer. Elle ne dit rien de la valeur de votre logement actuel. » — C.

## 6. Étape 3 — Amélioration attendue

### E3 — Changement principal

**Question exacte :** « Qu’est-ce que cet achat doit principalement améliorer dans votre quotidien ? »

**Obligatoire :** oui. Une seule réponse.

**Réponses :**

- « L’espace et son organisation » ;
- « Les trajets ou la proximité » ;
- « L’accès à un extérieur » ;
- « Le calme, le confort ou l’intimité » ;
- « Les conditions pour travailler ou étudier » ;
- « Le rangement, le stationnement ou l’entretien » ;
- « La stabilité de ma situation » ;
- « Je n’arrive pas encore à le formuler » ;
- « Autre » — 120 caractères maximum.

**Effets :**

- alimente en premier le bloc 1 ;
- devient une source prioritaire de E10 ;
- « je n’arrive pas » crée une observation concrète à mener dans le bloc 4 ;
- aucun type, nombre de pièces ou surface n’est déduit.

### E4 — Élément à préserver

**Question exacte :** « Qu’est-ce qui ne doit surtout pas être perdu en changeant de logement ? »

**Obligatoire :** oui. Une seule réponse, y compris « rien » ou « je ne sais pas ».

**Réponses :**

- « Des trajets déjà pratiques » ;
- « La proximité de personnes ou de services » ;
- « Un cadre familier » ;
- « Le calme, la lumière ou l’ouverture » ;
- « Un extérieur » ;
- « Une organisation intérieure qui fonctionne » ;
- « Une charge de logement que je maîtrise » ;
- « Rien de précis pour l’instant » ;
- « Je ne sais pas encore » ;
- « Autre » — 120 caractères maximum.

**Effets :**

- alimente le bloc 2 ;
- devient une source possible de E10 ;
- « rien » ou « je ne sais pas » ne rend aucun autre critère flexible.

## 7. Étape 4 — Usage avant typologie

### E5 — Usage principal

**Question exacte :** « Quel usage doit principalement mieux fonctionner dans votre prochain logement ? »

**Obligatoire :** oui. Une seule réponse.

**Réponses :**

- « Dormir et préserver l’intimité » ;
- « Travailler ou étudier » ;
- « Accueillir ou partager le quotidien » ;
- « Cuisiner et prendre les repas » ;
- « Jouer, pratiquer un loisir ou laisser une activité installée » ;
- « Ranger, stationner ou organiser les départs et retours » ;
- « Profiter réellement d’un extérieur » ;
- « Circuler facilement ou anticiper une mobilité différente » ;
- « Je ne sais pas encore » ;
- « Autre » — 120 caractères maximum.

**Effets :**

- alimente le bloc 1 comme traduction concrète de E3 ;
- peut alimenter le bloc 2 comme usage à préserver ;
- intervient dans E10 ;
- ne produit ni pièce, ni surface, ni typologie automatique.

**Traducteur :** « Vous avez relié le projet à un usage concret : [usage]. Nous pouvons maintenant examiner la forme de logement comme une hypothèse de solution, pas comme une conclusion. » — C.

Les autres usages éventuels ne sont demandés que dans le module facultatif A1.

## 8. Étape 5 — Cadre de réalité

### E6 — Limite géographique principale

**Question exacte :** « Qu’est-ce qui délimite principalement votre zone de recherche ? »

**Obligatoire :** oui. Une seule réponse.

**Réponses :**

- « Une commune ou un secteur » ;
- « Un temps de trajet » ;
- « Une personne à rejoindre » ;
- « Un service ou un lieu » ;
- « Aucune limite claire pour l’instant ».

**Effets :**

- indique la nature du repère au bloc 4 ;
- fournit une source possible de E10 ;
- ne demande ni commune, adresse, destination, durée ou niveau d’importance dans le parcours essentiel ;
- ne déclenche aucune donnée locale ou DVF.

### E7 — Préparation budgétaire et financement

**Question exacte :** « Où en est aujourd’hui votre cadre de budget et de financement ? »

**Obligatoire :** oui. Une seule réponse.

**Réponses :**

- « J’ai un repère global et j’en ai parlé avec une banque ou un courtier » ;
- « J’ai un repère global, mais le financement reste à confirmer » ;
- « Je raisonne surtout en mensualité » ;
- « Je ne l’ai pas encore cadré » ;
- « Je préfère ne pas répondre ».

**Effets :**

- décrit uniquement le niveau de préparation ;
- alimente le bloc 4 ;
- peut nourrir E10 avec l’horizon ;
- ne demande aucun montant et ne valide rien.

**Traducteur :** « Cette réponse décrit votre niveau de préparation. LEVOIS ne vérifie ni un montant, ni la validité, ni les conditions d’un financement. » — D/N.

### E8 — Horizon souhaité

**Question exacte :** « À quel moment aimeriez-vous pouvoir emménager ? »

**Obligatoire :** oui. Une seule réponse.

**Réponses :**

- « Dans moins de 3 mois » ;
- « Dans 3 à 6 mois » ;
- « Dans 6 à 12 mois » ;
- « Dans plus d’un an » ;
- « Je n’ai pas de date précise ».

**Effets :**

- alimente le bloc 4 ;
- est rapproché du stade, de E7 et, si nécessaire, de E2B ;
- une tension de calendrier devient une vérification, jamais une impossibilité.

### E9 — Hypothèse de logement

**Question exacte :** « Après avoir décrit ce qui doit changer et l’usage principal, quelle forme de logement envisagez-vous aujourd’hui ? »

**Obligatoire :** oui. Une seule réponse.

**Réponses :**

- « Une maison » ;
- « Un appartement » ;
- « Les deux restent possibles » ;
- « Une autre forme de logement » ;
- « Je ne sais pas encore ».

**Effets :**

- décrit une hypothèse dans le bloc 4 ;
- n’ajoute aucune recommandation ;
- « les deux » et « je ne sais pas » conservent explicitement l’ouverture.

## 9. Étape 6 — Arbitrage utile

### E10 — Scénario ou prochaine vérification

**Question exacte si une paire légitime existe :** « Lequel de ces deux scénarios mérite d’être vérifié en premier ? »

**Question exacte sinon :** « Quelle vérification vous aiderait le plus à avancer maintenant ? »

**Obligatoire :** oui. Une seule réponse.

### 9.1. Génération déterministe

Une paire existe seulement dans l’ordre suivant :

1. E3 contre E4, si leurs enjeux sont distincts ;
2. E5 contre E6, si le repère géographique peut modifier la manière de satisfaire l’usage ;
3. horizon E8 contre préparation E7 ou vente E2B ;
4. information du bien E1B contre l’enjeu principal E3/E5.

La première paire applicable est utilisée. Le système ne prétend jamais que les deux éléments sont incompatibles.

**Réponses en présence de deux scénarios :**

- scénario A, formulé comme une vérification concrète ;
- scénario B, formulé comme une vérification concrète ;
- « Aucun des deux » ;
- « Impossible de choisir sans une information supplémentaire ».

**Effets :**

- A ou B crée un compromis **à tester** dans le bloc 3 ; le scénario contient déjà critère, condition et bénéfice, sans seconde question ;
- « Aucun » ne rend aucun critère flexible et place les deux enjeux au bloc 4 ;
- « Impossible » place l’information manquante explicitement nommée par le scénario au bloc 4.

**Réponses sans paire :** liste fermée générée parmi : tester un trajet, comparer deux organisations d’espace, préciser ce que le repère financier inclut, clarifier l’ordre achat–vente, faire un point de financement, observer une prochaine visite, ou « je ne sais pas encore ».

### 9.2. Scénarios autorisés

| Paire | Scénario A | Scénario B |
|---|---|---|
| Changement / préservation | Préserver d’abord l’élément actuel et tester une amélioration ciblée. | Prioriser le changement et tester comment préserver l’existant. |
| Usage / géographie | Garder le repère géographique et comparer plusieurs réponses à l’usage. | Garder l’usage prioritaire et tester un repère géographique différent. |
| Horizon / préparation | Préserver l’horizon et prioriser les vérifications manquantes. | Préserver la prudence et accepter de revoir l’horizon. |
| Bien précis / enjeu | Vérifier d’abord l’information propre au bien. | Vérifier d’abord si le bien répond réellement à l’enjeu prioritaire. |

Chaque formulation reprend uniquement les réponses déclarées. Aucun scénario ne contient de montant, de disponibilité supposée ou de jugement de faisabilité.

## 10. Étape 7 — Première lecture

### 10.1. Action

**Libellé :** « Voir ma première lecture ».

Cette action n’est pas une question. Elle devient l’événement fonctionnel de complétion lorsque la restitution est effectivement affichée.

Avant affichage, le système contrôle :

- les 11 réponses standard ;
- E1B et E2B seulement si leur branche existe ;
- l’absence d’état invalidé ;
- l’absence de contradiction logique ;
- la possibilité de produire au moins un élément utile dans le bloc 1 ou le bloc 4.

La personne peut quitter après la consultation sans être comptée comme abandon. Les événements d’approfondissement sont séparés.

### 10.2. Structure d’un item

Chaque item contient :

- un titre compréhensible ;
- la réponse qui le fonde ;
- ce que cette réponse change ou semble indiquer ;
- son niveau de certitude exprimé en mots ;
- le cas échéant, une autre explication ;
- une prochaine vérification ;
- « Modifier cette réponse ».

Un item sans source n’existe pas.

### 10.3. Bloc 1 — Ce que votre achat doit changer

**Sources :** E3 et E5.

> Vous avez indiqué que l’achat doit principalement **[E3]**. Dans le quotidien, cela se traduit d’abord par **[E5]**.

Si l’une des réponses reste incertaine, le bloc la présente comme telle et propose une observation concrète ; il ne complète pas la phrase par déduction.

### 10.4. Bloc 2 — Ce que vous voulez préserver

**Sources :** E4 et, si cohérent, l’usage principal E5.

> Vous souhaitez surtout ne pas perdre **[E4]**. L’usage **[E5]** doit également rester praticable dans les solutions comparées.

Si E4 vaut « rien » ou « je ne sais pas », le bloc indique qu’aucune flexibilité n’en est déduite.

### 10.5. Bloc 3 — Ce que vous pourriez assouplir

**Source exclusive :** scénario A ou B choisi en E10.

> Vous pourriez tester **[assouplissement]**, seulement pour vérifier si cela permet **[bénéfice déclaré]** tout en respectant **[condition]**. Ce compromis n’est pas une décision définitive.

« Aucun », « impossible » ou une simple absence de réponse ne produit aucun assouplissement.

### 10.6. Bloc 4 — Ce qu’il reste à décider ou vérifier

**Sources :** E1, E1B, E2/E2B, E6 à E10 et toute réponse incertaine.

Ordre :

1. dépendance qui conditionne plusieurs décisions ;
2. information propre à un bien ;
3. cadre financier ou calendrier ;
4. géographie et hypothèse de logement ;
5. prochaine vérification choisie.

Chaque ligne suit :

> **À vérifier : [question].** Vous avez indiqué **[fait]**. Cela ne permet pas encore de conclure **[limite]**. Prochaine vérification : **[action]**.

### 10.7. Limites visibles

La lecture commence par :

> Cette lecture organise ce que vous avez déclaré. Elle ne valide ni un budget, ni un financement, ni un bien et ne remplace pas les vérifications propres à votre situation.

Elle se termine par :

> Vous pouvez modifier chaque réponse. Une modification peut retirer ou changer les éléments qui en dépendent.

## 11. Approfondissement facultatif

### 11.1. Contrat commun

Après la première lecture, la personne peut choisir :

> **Affiner cette lecture**

Chaque module :

- est choisi explicitement depuis la première lecture ;
- comporte une ou deux questions-écrans maximum ;
- ne contient aucune matrice ;
- ne demande aucune coordonnée ;
- ne répète aucune information déjà qualifiée ;
- actualise immédiatement les seuls items concernés ;
- ramène ensuite à la première lecture ;
- ne déclenche jamais automatiquement un autre module.
- ne peut être complété qu’une fois ; une correction ultérieure modifie les réponses existantes au lieu de créer une nouvelle instance.

Il n’existe aucun « approfondissement complet ». La personne choisit éventuellement un autre module depuis la lecture actualisée.

### 11.2. Catalogue plafonné

| Module | Condition d’affichage | Question 1 | Question 2 maximale | Effet |
|---|---|---|---|---|
| **A1 — Autres usages** | Toujours, sauf si déjà complété. | « Quel autre usage mérite d’être ajouté ? » — un seul choix. | « Est-il important ou encore à tester ? » | Ajoute un item secondaire aux blocs 1, 2 ou 4. |
| **A2 — Repère géographique** | E6 différent de « aucune limite ». | Préciser une commune, un trajet, une personne ou un service sans adresse ni identité. | « Que faut-il vérifier concrètement sur ce repère ? » | Précise le bloc 4 ; aucune donnée locale automatique. |
| **A3 — Cadre financier** | Toujours. | « Que comprend déjà votre repère : achat, frais, travaux, réserve ou encore inconnu ? » | « Quelle vérification manque le plus ? » | Précise le bloc 4 sans aucun montant. |
| **A4 — Espace et travaux** | Toujours. | Choisir « surface repère », « espaces nécessaires », « état/travaux » ou « encore ouvert ». | Précision liée au seul choix, sans recommandation. | Précise blocs 1 ou 4. |
| **A5 — Évolution des usages** | Toujours. | « Une évolution déjà envisagée pourrait-elle changer l’usage principal ? » | Si oui : choisir l’usage concerné. | Ajoute une hypothèse H au bloc 4. |
| **A6 — Bien identifié** | E1B affichée. | Choisir une seconde vérification sur le bien. | Préciser la prochaine action documentaire ou de visite. | Ajoute au bloc 4, sans verdict. |
| **A7 — Critère encore indécis** | Un critère non qualifié existe. | Choisir un seul critère parmi quatre maximum. | « Important, assouplissable sous condition, ou à tester ? » | Actualise bloc 2, 3 ou 4. |

Règles supplémentaires :

- A1 ajoute un seul usage supplémentaire ;
- A2 sépare strictement personne et service ;
- A3 ne contient jamais de champ monétaire ;
- A6 n’affiche « documents de copropriété » que si la copropriété est déclarée pertinente ;
- A7 conserve une provenance par réponse et ne supprime jamais un critère encore fondé par une autre source.

Le catalogue contient sept modules de deux questions maximum : l’approfondissement volontaire est donc plafonné à quatorze questions au total. Ce maximum n’est jamais présenté comme un parcours à accomplir et n’entre pas dans la complétion essentielle.

## 12. Effet et statut de chaque question essentielle

| ID | Obligatoire | Branche | Traducteur | Restitution | Invalidation principale |
|---|---|---|---|---|---|
| S0 | Oui | Ouvre ou ferme le parcours. | Explique le périmètre. | Aucune lecture résidentielle si sortie. | Toute la suite. |
| E1 | Oui | Affiche/masque E1B. | Calibre le stade. | Bloc 4. | E1B et arbitrage fondé sur le bien. |
| E1B | Si bien/offre | Aucune autre branche. | N’ajoute aucune certitude. | Bloc 4. | Item propre au bien. |
| E2 | Oui | Affiche/masque E2B. | Distingue occupation et urgence. | Bloc 4 si temporaire/incertain. | E2B et effets vente. |
| E2B | Si propriétaire | Influence E10. | Explique l’ordre, pas la valeur. | Bloc 4. | Vente, horizon et arbitrage. |
| E3 | Oui | Influence E10. | Reformule le changement. | Bloc 1. | Priorité et scénario. |
| E4 | Oui | Influence E10. | Interdit la flexibilité implicite. | Bloc 2. | Préservation et scénario. |
| E5 | Oui | Influence E10. | Traduit en usage. | Blocs 1 et 2. | Usage et scénario. |
| E6 | Oui | Influence E10. | N’invente aucun lieu. | Bloc 4. | Repère et scénario. |
| E7 | Oui | Influence E10 avec E8. | Abaisse toute conclusion financière. | Bloc 4. | Cadre financier et scénario. |
| E8 | Oui | Influence E10. | Distingue souhait et prévision. | Bloc 4. | Horizon et scénario. |
| E9 | Oui | Aucune. | Présente une hypothèse. | Bloc 4. | Hypothèse de logement. |
| E10 | Oui | Choisit scénario ou vérification. | Explique le compromis. | Blocs 3 et 4. | Compromis et prochaine action. |

Les 11 questions standard sont S0, E1, E2, E3, E4, E5, E6, E7, E8, E9 et E10. E1B et E2B sont les deux seules questions conditionnelles obligatoires.

## 13. Correction et graphe d’invalidation

### 13.1. Règle commune

Avant une modification ayant des dépendances :

> Modifier cette réponse changera aussi : **[liste]**. Les réponses indépendantes seront conservées.

Actions : **Appliquer la modification** · **Garder ma réponse actuelle**.

Après application :

1. retirer seulement les réponses devenues hors branche ;
2. conserver les réponses indépendantes ;
3. retirer seulement la provenance supprimée d’un critère multisource ;
4. recalculer E10 et les quatre blocs ;
5. replacer le focus sur le titre de la lecture actualisée ;
6. ne laisser aucun texte obsolète.

### 13.2. Règles exhaustives du parcours essentiel

| Modification | Suppression | Recalcul |
|---|---|---|
| S0 quitte la résidence principale | E1 à E10, E1B/E2B et modules. | La lecture disparaît ; réponse de sortie seulement. |
| E1 quitte bien/offre | E1B et ses items. | E10, blocs 3 et 4. |
| E1 devient bien/offre | Aucune suppression. | E1B devient obligatoire avant nouvelle lecture. |
| E1 change entre deux autres stades | Aucune suppression. | Traducteur et bloc 4. |
| E1B change | Ancienne provenance E1B. | E10 et bloc 4. |
| E2 quitte propriétaire | E2B et toute provenance vente. | E8/E10, blocs 3 et 4. |
| E2 devient propriétaire | Aucune suppression. | E2B devient obligatoire. |
| E2 change entre deux situations non propriétaires | Aucune suppression. | Traducteur et bloc 4. |
| E2B change | Aucun autre champ. | E8/E10 et bloc 4 ; toute ancienne formulation vente est retirée. |
| E3 change | Ancienne provenance E3. | E10, blocs 1, 3 et 4. |
| E4 change | Ancienne provenance E4. | E10, blocs 2, 3 et 4. |
| E5 change | Ancienne provenance E5 et précisions A1 qui ne restent plus cohérentes. | E10, blocs 1 à 4. |
| E6 change | Précisions A2 devenues hors nature. | E10, blocs 3 et 4. |
| E7 change | Précisions A3 incompatibles. | E8/E10, blocs 3 et 4. |
| E8 change | Aucune suppression. | E10, blocs 3 et 4. |
| E9 change | Précisions A4 propres à une forme devenue hors sujet. | Bloc 4 ; E10 seulement s’il utilisait cette hypothèse. |
| E10 change | Ancien compromis ou ancienne vérification. | Blocs 3 et 4. |
| Un module change | Seulement ses réponses et provenances. | Items concernés, puis retour à la lecture. |

### 13.3. États

- **Incomplet :** nommer uniquement la question obligatoire manquante.
- **Incertain :** conserver « je ne sais pas » et produire une vérification.
- **Contradictoire :** seulement deux valeurs logiquement incompatibles dans le modèle, jamais une ambition supposée difficile.
- **Indisponible :** aucun faux succès ; consultation publique et contact direct restent accessibles.
- **Périmé :** état technique ou modèle expiré ; demander une nouvelle validation des réponses, sans réafficher de PII dans l’erreur.

## 14. Trois sorties strictement séparées

### 14.1. Consulter ma synthèse

- aucune coordonnée ;
- aucune transmission à Resend ou Mouaad ;
- aucune écriture distante métier ;
- aucun lead ;
- impression ou sauvegarde locale déclenchée uniquement par la personne.

### 14.2. Recevoir ma synthèse

**Action :** « Recevoir ma synthèse par email ».

**Texte avant saisie :**

> Indiquez l’adresse à laquelle envoyer cette synthèse. Cet envoi ne crée pas une demande d’échange et ne transmet rien à Mouaad. Aucun appel automatique.

**Champ :** email de destination uniquement.

**Données transmises au service d’envoi :**

1. email choisi ;
2. quatre blocs tels qu’affichés ;
3. limites de la lecture ;
4. version du modèle ;
5. horodatage ;
6. identifiant d’idempotence éphémère sans lien analytics.

**Exclusions :** réponses brutes, nom, téléphone, attribution, historique, cookie et demande à Mouaad.

**Confirmation :** seulement après acceptation réelle par le service :

> Votre synthèse a été confiée au service d’envoi à l’adresse indiquée. Cela ne crée pas de demande d’échange avec Mouaad.

Cette phrase ne prétend pas que l’email a été lu. Si la fonction n’est pas opérationnelle ou la politique non alignée, le bouton n’est pas affiché.

### 14.3. Demander un échange

**Action :** « Demander un échange avec Mouaad ».

**Introduction :**

> Mouaad répond personnellement. Vous choisissez comment il peut vous répondre. Aucun appel automatique et aucun délai fixe n’est promis.

**Champs :**

- nom d’usage — facultatif, 80 caractères maximum ;
- canal — requis : « Email », « Appel », « SMS », « À convenir » ;
- email — requis pour « Email » ou « À convenir », absent sinon sauf ajout explicite ;
- téléphone — requis pour « Appel » ou « SMS », absent sinon sauf ajout explicite ;
- commentaire — facultatif, 600 caractères maximum, identifié comme commentaire libre ;
- consentement — requis et propre à cette finalité.

**Prévisualisation obligatoire :** avant confirmation, afficher les valeurs exactes qui seront envoyées :

1. les quatre blocs complets et actualisés ;
2. le nom d’usage s’il est fourni ;
3. le canal choisi ;
4. toutes les coordonnées effectivement fournies ;
5. le commentaire éventuel ;
6. la finalité : « demande d’échange avec Mouaad » ;
7. la preuve de consentement : texte et version de la notice, action affirmative et horodatage.

**Données envoyées à Mouaad :** exactement cette prévisualisation, sans les 11 à 13 réponses brutes.

**Ne jamais envoyer :** source, campagne, porte d’arrivée, identifiant PostHog, IP, cookies, historique ou réponse absente de la synthèse.

**Confirmation :** seulement après acceptation réelle :

> Votre demande a bien été transmise à Mouaad. Il vous répondra personnellement selon les coordonnées et le canal indiqués.

### 14.4. Étanchéité

- l’email « Recevoir ma synthèse » n’est ni copié à Mouaad ni réutilisé pour l’échange par défaut ;
- chaque sortie possède son action et son consentement ;
- changer de finalité exige une nouvelle prévisualisation ;
- une erreur ne transforme jamais une sortie en une autre ;
- demander un échange ne déclenche pas automatiquement l’envoi séparé d’une synthèse à la personne.

## 15. Données, conservation et traitements

### 15.1. Consultation avec JavaScript

| Emplacement | Données | Persistance |
|---|---|---|
| Mémoire de l’onglet | Réponses, branches, traducteur, restitution et état de correction. | Jusqu’à fermeture ou recommencement. |
| Stockage de session local | Seulement si nécessaire à la robustesse du parcours et annoncé ; jamais stockage durable par défaut. | Session de l’onglet, effaçable par « Recommencer ». |
| Cloudflare | Réponses nécessaires aux `POST`, IP et en-têtes techniques traités par l’infrastructure. | Traitement éphémère ; aucun stockage métier, aucune D1, corps absent des logs applicatifs. |
| PostHog | Rien avant consentement ; événements autorisés après consentement. | Selon durée validée ultérieurement. |
| Resend/Mouaad | Rien. | Sans objet. |

### 15.2. Consultation sans JavaScript

L’état borné, versionné et chiffré/authentifié est transporté dans le corps des formulaires `POST`. Cloudflare le traite pour rendre l’étape et la lecture privées, puis le réémet sans stockage métier.

Le démarrage explique :

> Vos réponses sont traitées temporairement pour construire la lecture. Elles ne sont ni enregistrées dans une base LEVOIS, ni envoyées à Mouaad tant que vous ne choisissez pas une transmission.

Chaque `POST` est une action explicite de progression. « Transmission distante après action explicite » autorise ce traitement technique éphémère ; elle n’autorise ni conservation métier, ni Resend, ni communication à Mouaad.

### 15.3. Après une transmission volontaire

| Sortie | Cloudflare | Resend et messagerie | Mouaad | D1 |
|---|---|---|---|---|
| Recevoir la synthèse | Valide et recalcule. | Email, quatre blocs, limites et métadonnées d’acheminement. | Rien. | Jamais. |
| Demander un échange | Valide et recalcule. | Transporte la prévisualisation autorisée vers la boîte de Mouaad. | Correspondance prévisualisée. | Jamais. |

Les durées Cloudflare/WAF, idempotence/anti-abus, Resend, boîtes email, correspondances, sauvegardes et PostHog doivent être fixées lors de la revue de confidentialité avant publication. L’absence de base métier ne signifie pas absence de métadonnées d’infrastructure.

### 15.4. Interdictions techniques fonctionnelles

- ne jamais appeler l’ancien endpoint d’enregistrement de recherche ;
- ne jamais écrire dans `RECHERCHE_DB`, même après une sortie ;
- ne jamais utiliser Formspree pour cette V1 ;
- ne jamais journaliser corps, réponses, synthèse, email ou téléphone ;
- ne jamais utiliser un identifiant commun entre analytics, envoi et demande d’échange ;
- ne jamais accepter une synthèse fournie par le client comme vérité : recalculer côté serveur depuis un état valide et versionné.

## 16. Couche publique et états privés

| État | Méthode | Indexation | Cache | URL personnelle |
|---|---|---|---|---|
| Explication publique | `GET /ma-recherche` | Indexable si substantielle | Politique publique | Aucune |
| Étape | `POST` | `noindex` | `no-store, private` | Aucune |
| Lecture et correction | `POST` privé | `noindex`, `nofollow` | `no-store, private` | Aucune |
| Envoi/échange | `POST` dédié | Non indexable | `no-store` | Aucune |

La couche publique contient en HTML : question, réponse directe, sept étapes, résultat attendu, limites, exemple non personnel, confidentialité, auteur, date et liens vers méthode, contenus acheteurs et contact.

Une URL copiée ou partagée ouvre uniquement la couche publique. Aucun résultat personnel n’entre dans le sitemap, les données structurées, un cache partagé ou une query string.

## 17. Fonctionnement sans JavaScript

Le mode sans JavaScript permet : démarrer, répondre, revenir, corriger, invalider, consulter les quatre blocs, choisir un module facultatif, revenir à la lecture et utiliser les deux sorties si elles sont actives.

Exigences :

- `POST` natif, jamais `GET`, pour toute réponse ;
- même normalisation, mêmes bornes et mêmes consentements qu’avec JavaScript ;
- état chiffré/authentifié, versionné, expirant et revalidé ;
- protection CSRF compatible sans JavaScript : vérification d’origine, jeton et cookies éventuels `Secure`, `HttpOnly`, `SameSite` approprié ;
- page de retour strictement autorisée, jamais fournie librement ;
- HTML accessible après succès ou échec, jamais JSON brut ;
- aucune PII dans l’URL ou la confirmation ;
- aucune réussite avant acceptation réelle du service ;
- reprise expliquée en cas d’expiration, sans exposer l’ancien contenu.

## 18. Accessibilité normative

- un `main` et un H1 par état ;
- lien d’évitement vers le contenu principal ;
- progression textuelle « Étape X sur 7 » ;
- contrôles HTML natifs ;
- `fieldset` et `legend` pour chaque groupe ;
- statut obligatoire/facultatif visible et programmatique ;
- aide/erreur reliée par `aria-describedby` ;
- résumé d’erreurs focusable contenant un lien vers chaque champ invalide ;
- focus sur le résumé après échec, puis sur le champ activé ;
- après navigation ou recalcul, focus sur le titre avec `tabindex="-1"` ;
- ajout ou retrait de branche annoncé après validation, jamais à chaque clic ;
- traducteur en `role="status"` ou `aria-live="polite"` après validation du groupe ;
- erreurs bloquantes en `role="alert"` avec parcimonie ;
- confirmation d’invalidation en page dédiée ou dialogue correctement nommé, focus piégé, annulation disponible et retour au déclencheur ;
- `autocomplete="name"`, `email`, `tel` et `inputmode` adaptés aux coordonnées ;
- compteur de caractères annonçant la limite sans lire chaque frappe ;
- cible minimale 24 × 24 CSS px ou espacement équivalent ; objectif produit 44 × 44 ;
- zoom texte 200 % et reflow à 320 CSS px sans perte ni défilement bidimensionnel hors exception ;
- aucune information par couleur seule ;
- aucun glisser-déposer, survol, animation ou limite de temps obligatoire.

## 19. Sécurité fonctionnelle et abus

- méthodes et types de contenu en liste fermée ;
- corps borné ; champs inconnus refusés ; doublons ambigus refusés ;
- texte normalisé, borné en caractères et octets, jamais interprété comme HTML ;
- encodage de sortie pour HTML et email ; suppression CR/LF des en-têtes email ;
- validation `Origin`/`Referer` selon une allowlist et jeton CSRF ;
- HTTPS uniquement ;
- limitation d’abus pseudonymisée, sans réponse ni coordonnée dans la clé ;
- honeypot accessiblement neutre et délai minimal seulement s’ils ne bloquent pas les technologies d’assistance ;
- clé d’idempotence distincte par sortie, éphémère, sans PII ni identifiant analytics ;
- aucune double livraison ;
- état signé/chiffré recalculé côté serveur, expiration et anti-rejeu ;
- erreurs publiques fermées ; aucun message fournisseur brut ;
- politique de redaction des logs et corrélation technique non partageable avec PostHog.

Les durées d’anti-abus et d’idempotence sont courtes, documentées et intégrées à la revue de confidentialité. Ce stockage technique n’est pas un état métier.

## 20. Mesure sans réponse personnelle

### 20.1. Règle de consentement

Aucune requête PostHog n’est émise avant consentement. Sans consentement, seul l’état fonctionnel éphémère de la session et les journaux de sécurité strictement nécessaires existent. Toute attribution intersession exige un consentement valable et une durée minimale utile fixée avant publication.

### 20.2. Événements autorisés après consentement

| Événement | Déclencheur | Propriétés autorisées |
|---|---|---|
| `ma_recherche_public_view` | Couche publique vue. | porte/source/campagne normalisées, sans URL complète |
| `ma_recherche_start` | S0 accepté. | mode `js`/`no_js` |
| `ma_recherche_step_view` | Étape affichée. | numéro d’étape |
| `ma_recherche_question_complete` | Question validée. | ID de question, durée agrégée, compte d’erreurs |
| `ma_recherche_edit_apply` | Correction appliquée. | ID de question, nombre de dépendances invalidées |
| `ma_recherche_first_reading_view` | Première lecture affichée. | version de restitution, nombre de questions 11/12/13 |
| `ma_recherche_refine_open` | Module choisi. | ID technique A1–A7 |
| `ma_recherche_refine_complete` | Retour à la lecture. | ID technique A1–A7 |
| `ma_recherche_output_select` | Sortie choisie. | `consult`, `email_summary`, `exchange` |
| `ma_recherche_send_success/failure` | Résultat technique. | type de sortie, code fermé |
| `ma_recherche_scope_exit` | Sortie investissement. | destination technique uniquement |

### 20.3. Interdictions

Ne jamais envoyer à l’analytics : valeur de réponse, commune, type de bien, budget, financement, horizon, occupation, vente, critère, scénario, synthèse, texte libre, nom, email, téléphone, IP volontairement journalisée, identifiant d’envoi ou contenu d’erreur fournisseur.

La consultation de la première lecture vaut complétion. L’absence d’ouverture d’un module ou de contact n’est pas un abandon.

## 21. Simulations de validation

### 21.1. Comptage

| Simulation | Questions | Première lecture | Objectif de temps à tester |
|---|---:|---|---|
| Locataire au stade de l’idée | **11** | Oui | 3–5 min pour un chemin court ; jusqu’à 6 min selon lecture |
| Propriétaire dépendant d’une vente | **12** | Oui | 6–8 min |
| Propriétaire incertain | **12** | Oui | 4–6 min |
| Personne ayant trouvé un bien, non propriétaire | **12** | Oui | 6–8 min |
| Typologie indécise, non propriétaire | **11** | Oui | 5–7 min |
| Investissement | **1** | Réponse de sortie, pas quatre blocs | 1–2 min |

Le chemin propriétaire avec bien identifié compte **13 questions + première lecture**. Aucun chemin obligatoire ne dépasse 13 questions. Les durées sont des objectifs non démontrés jusqu’aux tests du prototype.

Dans les six simulations, les réponses, la lecture et les corrections restent locales ou sont traitées éphémèrement par Cloudflare. Aucune simulation ne transmet de donnée tant que la personne ne choisit pas « Recevoir ma synthèse » ou « Demander un échange ». La sortie investissement ne transmet rien.

### 21.2. Simulation A — Locataire au stade de l’idée

**Réponses essentielles :** résidence principale ; idée ; locataire ; améliorer travail/études ; préserver les trajets ; usage travail/études ; limite par trajet ; budget non cadré ; horizon sans date ; appartement envisagé ; vérifier d’abord un trajet réel.

**Lecture :**

1. **Changer :** améliorer les conditions de travail ou d’étude.
2. **Préserver :** des trajets praticables et l’usage de travail.
3. **Assouplir :** aucun compromis confirmé si E10 choisit seulement une vérification.
4. **Vérifier :** trajet réel, cadrage financier et adéquation de l’appartement à l’usage.

**Modification testée :** appartement → « les deux ». Seule l’hypothèse du bloc 4 change ; travail et trajet restent intacts.

### 21.3. Simulation B — Propriétaire dépendant d’une vente

**Réponses essentielles :** résidence principale ; veille ; propriétaire ; vente nécessaire ; améliorer l’espace ; préserver les trajets ; usage intimité ; limite par secteur ; repère financier non confirmé ; horizon 3–6 mois ; plusieurs typologies ; arbitrage horizon/préparation.

**Lecture :**

1. **Changer :** obtenir un espace mieux organisé pour l’intimité.
2. **Préserver :** les trajets.
3. **Assouplir :** seulement le scénario choisi, par exemple revoir l’horizon pour préserver la prudence.
4. **Vérifier :** ordre achat–vente, financement, horizon et secteur.

**Modification testée :** propriétaire → locataire. E2B est supprimée, les mentions de vente disparaissent, E10 et le bloc 4 sont recalculés ; toutes les autres réponses restent.

### 21.4. Simulation C — Propriétaire incertain

**Réponses essentielles :** résidence principale ; idée ; propriétaire ; vente incertaine ; changement non formulé ; rien à préserver identifié ; usage inconnu ; aucune limite géographique claire ; cadre financier non cadré ; plus d’un an ; typologie inconnue ; prochaine vérification achat–vente.

**Lecture :**

1. **Changer :** aucun changement formulé ; observer un moment du quotidien.
2. **Préserver :** rien n’est encore nommé ; aucune flexibilité déduite.
3. **Assouplir :** aucun.
4. **Vérifier :** dépendance à une vente, usages, cadre financier et type de logement.

**Contrôle :** aucune matrice vide n’apparaît ; E10 propose directement la prochaine vérification.

### 21.5. Simulation D — Bien déjà trouvé

**Réponses essentielles :** résidence principale ; bien précis ; information manquante sur charges ; locataire ; gagner en calme ; préserver les trajets ; usage travail ; commune/secteur ; repère financier discuté ; horizon 3–6 mois ; appartement ; vérifier d’abord les charges du bien.

**Lecture :**

1. **Changer :** gagner en calme et mieux travailler.
2. **Préserver :** les trajets et l’usage de travail.
3. **Assouplir :** aucun si l’action choisie est une vérification documentaire.
4. **Vérifier :** charges, coût global, horizon et adéquation du bien aux usages.

**Modification testée :** bien précis → veille. E1B et ses items sont supprimés ; E10 et le bloc 4 sont recalculés ; aucune ancienne mention des charges de ce bien ne subsiste.

### 21.6. Simulation E — Typologie indécise

**Réponses essentielles :** résidence principale ; veille ; locataire ; extérieur principal ; préserver un cadre familier ; usage extérieur ; limite par secteur ; raisonnement en mensualité ; horizon 6–12 mois ; typologie inconnue ; vérifier deux formes de logement sur le même usage.

**Lecture :**

1. **Changer :** disposer d’un extérieur réellement utilisable.
2. **Préserver :** le cadre familier et cet usage extérieur.
3. **Assouplir :** uniquement si un scénario de comparaison est choisi ; jamais la typologie par défaut.
4. **Vérifier :** maison et appartement selon le même usage, cadre financier global et secteur.

**Contrôle :** aucune maison ou appartement n’est recommandé.

### 21.7. Simulation F — Investissement

**Réponse :** investissement seul à S0.

**Sortie :** message utile exact du §3 puis `/contact?objet=investissement`.

**Contrôles :** une question seulement ; aucun état résidentiel ; aucun quatre-blocs ; aucune donnée dans l’URL ; aucune demande automatique.

## 22. Tests d’acceptation

### 22.1. Parcours et plafonds

| ID | Cas | Attendu |
|---|---|---|
| T01 | Standard | 11 questions, puis première lecture. |
| T02 | Propriétaire | 12 questions, puis première lecture. |
| T03 | Bien identifié | 12 questions, puis première lecture. |
| T04 | Propriétaire + bien | 13 questions, puis première lecture. |
| T05 | Investissement | 1 question, message utile, sortie. |
| T06 | Module facultatif | 1 ou 2 questions, retour à la lecture, aucun enchaînement automatique. |
| T07 | Tous les modules choisis successivement | Chacun reste indépendant ; aucun chemin obligatoire ni module global n’est créé. |

### 22.2. Logique et invalidation

| ID | Cas | Attendu |
|---|---|---|
| T08 | Propriétaire → non-propriétaire | E2B et tous ses effets disparaissent. |
| T09 | Bien → veille | E1B et tous ses effets disparaissent. |
| T10 | Oui → incertain/non pour la vente | E10 et bloc 4 recalculés, sans ancienne conclusion. |
| T11 | Changement E3 | Blocs 1/3/4 recalculés ; autres réponses conservées. |
| T12 | Usage E5 | Provenance E5 remplacée sans supprimer une provenance indépendante. |
| T13 | Aucune paire E10 | Prochaine vérification, aucun dilemme artificiel. |
| T14 | Aucun des deux | Aucun assouplissement au bloc 3. |
| T15 | État expiré ou altéré | Rejet fermé et reprise expliquée. |

### 22.3. Restitution et sorties

| ID | Cas | Attendu |
|---|---|---|
| T16 | Consultation seule | Aucun envoi, lead, D1 ou coordonnée. |
| T17 | Envoi synthèse | Quatre blocs vers l’adresse choisie, rien à Mouaad. |
| T18 | Échec envoi | Aucun faux succès ; lecture conservée. |
| T19 | Prévisualisation échange | Valeurs exactes des quatre blocs, coordonnées, finalité et consentement. |
| T20 | Échange réussi | Exactement la prévisualisation ; aucune réponse brute ni attribution. |
| T21 | Changement de finalité | Nouvelle prévisualisation et nouveau consentement. |
| T22 | Double soumission | Une seule livraison. |

### 22.4. Confidentialité, réseau et indexation

| ID | Cas | Attendu |
|---|---|---|
| T23 | Inspection D1 | Aucune requête ni écriture `RECHERCHE_DB`. |
| T24 | Inspection analytics | Aucune réponse, PII, bloc ou identifiant d’envoi. |
| T25 | Sans consentement | Aucune requête PostHog. |
| T26 | Étape/résultat | `POST`, `no-store`, aucune donnée dans URL. |
| T27 | URL partagée | Couche publique seulement. |
| T28 | Logs applicatifs | Aucun corps, email, téléphone ou synthèse. |
| T29 | Recevoir synthèse | Rien dans la boîte ou les données de Mouaad. |
| T30 | Investissement | Paramètre catégoriel seulement, aucune demande créée. |

### 22.5. Sans JavaScript et accessibilité

| ID | Cas | Attendu |
|---|---|---|
| T31 | Parcours sans JS | Réponse, retour, correction, lecture et modules par `POST`. |
| T32 | Sorties sans JS | Confirmation HTML accessible après succès réel. |
| T33 | Clavier | Toutes les fonctions, focus et annulation disponibles. |
| T34 | Lecteur d’écran | Étape, question, aide, traducteur, invalidation et résultat annoncés correctement. |
| T35 | Erreurs | Résumé focusable avec liens et erreurs associées. |
| T36 | Reflow | Fonctionnel à 320 CSS px et zoom texte 200 %. |
| T37 | Branches | Ajout/retrait annoncé après validation, sans rafale. |
| T38 | Coordonnées | Libellés, requis, autocomplete et inputmode corrects. |

### 22.6. Sécurité fonctionnelle

| ID | Cas | Attendu |
|---|---|---|
| T39 | CSRF/origine | Requête étrangère refusée. |
| T40 | État altéré/rejoué | Rejet contrôlé. |
| T41 | Corps trop volumineux/doublons | Rejet avant traitement métier. |
| T42 | Abus | Limitation sans journaliser réponses ni coordonnées. |
| T43 | Injection HTML/email | Contenu encodé, en-têtes nettoyés. |
| T44 | Service externe indisponible | Échec fermé, aucun faux succès. |

## 23. Clôture de la Phase 3 et transmission

La spécification fonctionnelle est validée et la Phase 3 est clôturée.

- Les objectifs de 3–5, 6–8 et 10–12 minutes restent des **objectifs de conception à vérifier sur prototype avec de vraies personnes** ; ils ne constituent pas encore des durées démontrées.
- Aucun code fonctionnel de `/ma-recherche` n'est encore validé.
- Aucune direction artistique n'est encore choisie.
- Les durées et procédures de suppression devront être fixées lors de la revue de confidentialité avant publication.
- Les cas T01 à T44 et la séparation technique entre couche publique indexable et états privés devront être démontrés sur le futur prototype fonctionnel.

Ordre inchangé : spécification fonctionnelle validée → trois territoires de direction artistique → choix d'un territoire → implémentation.
