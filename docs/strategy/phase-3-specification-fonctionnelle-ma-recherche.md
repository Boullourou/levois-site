# LEVOIS — Phase 3 — Spécification fonctionnelle de `/ma-recherche`

**Statut :** proposition complète à validation de Direction générale.

**Date :** 1er septembre 2026.

**Nature :** spécification fonctionnelle et éditoriale, sans code, sans maquette et sans direction artistique.

**Socle :** contrat d’ouverture validé dans `docs/strategy/phase-3-contrat-ouverture-ma-recherche.md`, plateforme éditoriale validée dans `docs/strategy/phase-2-plateforme-editoriale-et-accueil.md` et relevé d’écarts de Phase 1 dans `docs/strategy/phase-1-dossier-arbitrage-editorial-acquisition-seo.md`.

## 0. Décision de produit

`/ma-recherche` est un parcours de clarification pour l’achat d’une **résidence principale**. Il transforme les déclarations de la personne en une lecture structurée de ce que l’achat doit changer, de ce qu’elle souhaite préserver, de ce qu’elle accepte réellement d’assouplir et de ce qu’elle doit encore décider ou vérifier.

Le parcours ne produit ni estimation, ni faisabilité financière, ni lecture DVF personnalisée, ni recommandation de bien. Il ne note pas le projet. Il ne transforme pas l’absence de réponse en compromis. La valeur complète est consultable et corrigible sans coordonnées.

### 0.1. Décisions acquises appliquées

- sept étapes métier, dans l’ordre validé ;
- situation d’occupation à l’étape 2 ;
- question sur une vente préalable réservée aux propriétaires ;
- usages avant typologie et surface ;
- investissement sorti du parcours résidence principale ;
- aucune donnée locale utilisée pour conclure sur le projet ;
- aucune validation de budget ou de financement ;
- aucun bien recommandé ;
- aucun compte, CRM ou stockage distant implicite ;
- aucune réponse personnelle ni PII dans l’analytics ;
- consultation, réception de synthèse et demande d’échange séparées ;
- aucun appel automatique ;
- aucune conclusion certaine à partir d’informations insuffisantes.

### 0.2. Hypothèses de spécification retenues

Ces hypothèses sont réversibles avant implémentation et ne changent pas le positionnement :

1. une question est obligatoire seulement si son absence empêcherait une branche ou rendrait la restitution trompeuse ;
2. les champs libres sont rares, facultatifs, bornés et ne demandent ni nom de personne ni adresse précise ;
3. les montants sont facultatifs : leur degré de préparation compte davantage que leur valeur et aucune conclusion de marché n’en est tirée ;
4. le parcours de base ne persiste pas dans le navigateur après fermeture de l’onglet ;
5. la couche publique et le parcours privé peuvent partager `/ma-recherche` : le `GET` public est indexable, les états issus de `POST` sont privés et `no-store` ;
6. l’entrée investissement est orientée provisoirement vers une prise de contact explicitement dédiée, sans prétendre fournir un outil d’investissement.

L’hypothèse 6 constitue le seul choix de destination encore soumis à Direction générale (§20).

## 1. Modèle fonctionnel commun

### 1.1. Nature des réponses

Chaque réponse porte :

- un identifiant stable ;
- la valeur déclarée ;
- le moment de dernière modification ;
- son rôle : branche, reformulation, restitution ou contact ;
- ses dépendances ;
- son niveau de certitude ;
- son statut : renseignée, non renseignée, incertaine, contradictoire ou invalidée.

Une réponse n’entre jamais dans l’analytics. Les identifiants de question et les numéros d’étape peuvent y entrer ; les valeurs choisies ne le peuvent pas.

### 1.2. Cinq niveaux d’énonciation

| Niveau | Condition | Formulation autorisée |
|---|---|---|
| **D — Déclaré** | Reprise fidèle d’une réponse. | « Vous avez indiqué que… » |
| **C — Conséquence directe** | Effet logique certain dans le parcours, sans jugement immobilier. | « Cela change… » |
| **I — Interprétation probable** | Plusieurs réponses convergent, mais une autre lecture reste possible. | « Cela semble indiquer… » |
| **H — Hypothèse fragile** | Une seule réponse ou une information incomplète soutient l’idée. | « Cela pourrait signifier… » |
| **N — Non concluable** | La donnée nécessaire manque ou les réponses se contredisent. | « Impossible à conclure pour l’instant. » |

Le niveau ne peut qu’être abaissé lorsque la preuve diminue. Une donnée déclarée peut être certaine comme déclaration sans rendre certaine son interprétation immobilière.

### 1.3. Règle du traducteur en direct

Après une réponse utile, le traducteur affiche au maximum trois éléments :

1. **ce qui est retenu**, sans extrapolation ;
2. **ce que cela change** dans les questions ou la lecture ;
3. **ce qui reste ouvert**, seulement lorsque cette limite est utile immédiatement.

Il ne félicite pas, ne donne aucun score, ne dramatise pas et ne répète pas le libellé sans valeur nouvelle. Une précision supplémentaire n’apparaît que si elle change une branche ou un bloc de restitution.

### 1.4. Contrat de progression

- Une seule question principale est annoncée à la fois, sans imposer une présentation visuelle particulière.
- Le repère textuel « Étape X sur 7 — [nom] » est toujours disponible.
- **Continuer** n’est employé que lorsqu’aucun libellé plus exact n’est possible ; les actions privilégiées sont « Préciser ma situation », « Décrire ce qui doit changer », « Passer aux usages », « Poser mon cadre », « Comparer les scénarios » et « Voir ma première lecture ».
- **Revenir** conserve les réponses valides.
- **Quitter** n’envoie et n’enregistre rien.
- Une étape incomplète explique précisément la réponse nécessaire ; les réponses facultatives restent réellement facultatives.

## 2. Entrée publique et contrôle de périmètre

La couche publique répond en HTML, avant toute interaction :

> **Mettre ma recherche au clair**
>
> Décrivez ce que votre achat doit changer, les usages à rendre possibles et les contraintes déjà connues. Vous consulterez une première lecture avant de laisser vos coordonnées et pourrez corriger vos réponses. Aucun appel automatique.
>
> Ce parcours concerne l’achat d’une résidence principale. Il ne valide ni votre budget, ni un financement, ni la faisabilité d’un achat.

### P0 — Finalité du projet

**Question exacte :** « Ce parcours correspond-il à l’achat de votre résidence principale ? »

**Réponses :**

- `primary_yes` — « Oui » ;
- `primary_and_investment` — « J’hésite entre résidence principale et investissement » ;
- `investment_only` — « Non, mon projet concerne surtout un investissement » ;
- `scope_unsure` — « Je ne sais pas encore ».

**Effets :**

- `primary_yes` ouvre l’étape 1 ;
- `primary_and_investment` et `scope_unsure` affichent une explication permettant de choisir soit « Continuer pour clarifier uniquement l’hypothèse résidence principale », soit « Sortir vers l’aide investissement » ;
- `investment_only` ne crée aucun état dans le parcours principal et affiche la destination distincte ;
- aucune réponse d’investissement n’est mélangée à la synthèse résidence principale.

**Traducteur :** « Ce parcours peut clarifier l’usage résidence principale. Il ne calcule pas un rendement et ne traite pas la fiscalité d’un investissement. » — niveau C.

## 3. Étape 1 — Niveau d’avancement

### Q1.1 — Avancement observable

**Question exacte :** « Où en êtes-vous aujourd’hui dans votre projet d’achat ? »

**Une seule réponse :**

- `idea` — « Je commence à y penser » ;
- `watching` — « J’observe des annonces et des secteurs » ;
- `preparing_visits` — « Je prépare mes premières visites » ;
- `visiting` — « Je visite déjà des biens » ;
- `identified` — « J’ai un bien précis en tête » ;
- `offer` — « Je prépare une offre ou j’en ai déjà fait une ».

**Conséquences :**

| Réponse | Questions ajoutées | Effet sur la restitution |
|---|---|---|
| `idea` | Aucune question sur un bien précis. | Les prochaines vérifications portent sur usages, critères et cadre encore à construire. |
| `watching` | Q1.2. | La lecture distingue critères observés et critères réellement décidés. |
| `preparing_visits` / `visiting` | Q1.2 et Q1.3. | La lecture prépare des points à vérifier pendant ou après les visites. |
| `identified` / `offer` | Q1.2 et Q1.3 ; Q5.10 apparaîtra. | Le bloc 4 cible les informations manquantes sur le bien, sans verdict d’achat. |

**Traducteur :**

- idée/veille : « Votre recherche est encore ouverte. Cela change la prochaine étape : nous allons d’abord clarifier ce que l’achat doit rendre possible, avant de parler de type de bien. » — C ;
- visites : « Vous confrontez déjà vos critères à des biens réels. La lecture devra distinguer ce que les visites ont confirmé de ce qui reste une hypothèse. » — I ;
- bien/offre : « Un bien précis existe déjà. Cela change la fin du parcours : elle fera ressortir les vérifications manquantes, sans conclure à votre place. » — C.

### Q1.2 — Ce que l’observation ou les visites ont déjà changé

**Condition :** Q1.1 différent de `idea`.

**Question exacte :** « Jusqu’ici, qu’est-ce qui a le plus fait évoluer votre recherche ? »

**Jusqu’à deux réponses :**

- « La zone » ;
- « Le temps de trajet » ;
- « Le type de bien » ;
- « L’espace ou le nombre de pièces » ;
- « L’état du bien ou les travaux » ;
- « Le budget à prévoir » ;
- « Rien de net pour l’instant » ;
- « Autre » — précision facultative, 120 caractères maximum.

**Effet :** les éléments choisis deviennent des **hypothèses à requalifier**, jamais automatiquement des priorités. « Rien de net » alimente le bloc 4.

**Traducteur :** « Vos observations ont déplacé votre attention vers [élément]. Cela ne dit pas encore si ce critère est indispensable, important ou simplement plus visible dans les annonces. » — H.

### Q1.3 — Information encore manquante sur les biens vus

**Condition :** Q1.1 vaut `preparing_visits`, `visiting`, `identified` ou `offer`.

**Question exacte :** « Quelle information vous manque le plus aujourd’hui pour avancer ? »

**Une seule réponse :**

- « Savoir quoi regarder pendant une visite » ;
- « Comparer deux biens sans me perdre dans les détails » ;
- « Comprendre les travaux ou l’état réel » ;
- « Vérifier les charges et coûts à prévoir » ;
- « Vérifier les trajets et le quotidien sur place » ;
- « Savoir si mes critères sont vraiment les bons » ;
- « Je ne sais pas encore » ;
- « Autre » — précision facultative, 120 caractères maximum.

**Effet :** ajoute une prochaine vérification dans le bloc 4 ; ne modifie ni budget ni faisabilité.

## 4. Étape 2 — Situation et logement actuel

### Q2.1 — Situation d’occupation

**Question exacte :** « Aujourd’hui, vous vivez principalement… »

**Une seule réponse :**

- `owner` — « Dans un logement dont je suis propriétaire » ;
- `tenant` — « Dans un logement que je loue » ;
- `hosted` — « Hébergé·e chez quelqu’un » ;
- `temporary` — « Dans une situation temporaire ou de transition » ;
- `other` — « Dans une autre situation » ;
- `prefer_not` — « Je préfère ne pas répondre ».

**Effets :**

- `owner` affiche Q2.2 ;
- toutes les autres réponses masquent Q2.2 et suppriment toute ancienne réponse à Q2.2 ;
- `temporary` peut renforcer l’enjeu de calendrier, mais ne prouve aucune urgence ;
- `prefer_not` n’empêche pas le parcours et place l’effet d’une éventuelle vente parmi les informations inconnues.

**Traducteur :**

- propriétaire : « Vous avez indiqué être propriétaire. Une seule précision devient nécessaire : savoir si l’achat dépend d’une vente. Aucune adresse ni valeur ne vous sera demandée. » — C ;
- locataire/hébergé/autre : « Votre parcours d’achat n’a pas à intégrer une vente préalable déclarée. » — C, sans conclure sur congé, bail ou calendrier ;
- temporaire : « Vous avez indiqué une situation de transition. Cela semble rendre le calendrier important, sans permettre de conclure qu’il faut acheter vite. » — I.

### Q2.2 — Dépendance à une vente

**Condition :** Q2.1 vaut `owner`.

**Question exacte :** « Votre achat dépend-il de la vente de ce logement ? »

**Une seule réponse :**

- `sale_yes` — « Oui » ;
- `sale_no` — « Non » ;
- `sale_unsure` — « Je ne sais pas encore ».

**Effet :**

- `sale_yes` inscrit une dépendance déclarée dans le bloc 4 et peut alimenter l’arbitrage calendrier/séquence ;
- `sale_no` exclut cette dépendance de la lecture ;
- `sale_unsure` inscrit une incertitude, sans parcours vendeur ni demande de valeur.

**Traducteur :**

- oui : « Vous avez indiqué que l’achat dépend d’une vente. Cela change l’ordre des décisions à préparer, pas la valeur de votre logement actuel. » — C ;
- non : « Vous avez indiqué que l’achat ne dépend pas de cette vente. Aucune étape vendeur n’est ajoutée. » — D/C ;
- incertain : « Impossible de fixer l’ordre achat–vente pour l’instant. La prochaine vérification utile est de clarifier cette dépendance, sans estimer le logement ici. » — N.

### Q2.3 — Personnes concernées par les usages

**Question exacte :** « Pour qui le futur logement doit-il fonctionner au quotidien ? »

**Plusieurs réponses possibles :**

- « Pour moi » ;
- « Pour un autre adulte avec qui je vivrai » ;
- « Pour un ou plusieurs enfants présents au quotidien » ;
- « Pour un ou plusieurs enfants présents une partie du temps » ;
- « Pour une autre personne qui vivra dans le logement » ;
- « La composition du foyer peut évoluer » ;
- « Je ne sais pas encore » ;
- « Je préfère ne pas préciser ».

**Règles :** aucun nom, âge, lien de parenté précis ou donnée de santé n’est demandé. « Je préfère ne pas préciser » est exclusif des autres réponses.

**Effet :** autorise des usages pluriels à l’étape 4 ; ne déduit jamais un nombre de chambres.

**Traducteur :** « Vous avez décrit les personnes pour lesquelles le logement doit fonctionner. Cela servira à parler d’usages et de moments du quotidien, pas à imposer automatiquement un nombre de pièces. » — C.

## 5. Étape 3 — Amélioration attendue

### Q3.1 — Changements recherchés

**Question exacte :** « Si cet achat réussit, qu’est-ce qui doit surtout devenir plus simple ou meilleur au quotidien ? »

**Jusqu’à trois réponses :**

- « Avoir assez de place pour les personnes qui y vivent » ;
- « Mieux séparer les activités ou préserver l’intimité » ;
- « Réduire ou simplifier les trajets réguliers » ;
- « Disposer d’un extérieur réellement utilisable » ;
- « Être plus proche de personnes, services ou activités importants » ;
- « Gagner en calme ou en confort » ;
- « Pouvoir travailler ou étudier dans de meilleures conditions » ;
- « Mieux ranger, stationner ou organiser le quotidien » ;
- « Vivre dans un logement plus simple à entretenir ou à adapter » ;
- « Sortir d’une situation temporaire » ;
- « Devenir propriétaire pour gagner en stabilité » ;
- « Je n’arrive pas encore à le formuler » ;
- « Autre » — précision facultative, 160 caractères maximum.

**Règle :** « Je n’arrive pas encore à le formuler » est exclusif. Les trois choix limitent la charge, pas les droits à l’expression : le champ « Autre » reste disponible comme l’un des trois.

**Effet :** chaque choix alimente le bloc 1. Aucun choix ne devient directement une typologie, une surface ou une zone.

**Traducteur :** « Votre achat doit d’abord changer [éléments]. Cela donne une direction à la recherche ; il reste à traduire cette direction en usages concrets. » — D/C.

### Q3.2 — Changement prioritaire

**Condition :** au moins deux réponses distinctes à Q3.1.

**Question exacte :** « Si un seul de ces changements devait être réellement réussi, lequel compterait le plus ? »

**Réponses :** les choix effectués à Q3.1, plus « Impossible de les départager pour l’instant ».

**Effet :** ordonne le bloc 1 et influence la sélection d’un arbitrage ; les autres changements ne sont ni supprimés ni déclarés flexibles.

**Traducteur :** « [Élément] passe en premier. Les autres attentes restent présentes ; elles ne deviennent pas négociables par défaut. » — C.

### Q3.3 — Élément à préserver

**Question exacte :** « Dans votre situation actuelle, qu’aimeriez-vous surtout ne pas perdre ? »

**Jusqu’à deux réponses :**

- « Des trajets déjà pratiques » ;
- « La proximité de personnes ou de services » ;
- « Un quartier ou un cadre familier » ;
- « Le calme » ;
- « La lumière ou l’ouverture » ;
- « Un extérieur » ;
- « Une organisation intérieure qui fonctionne » ;
- « Une charge de logement que je maîtrise » ;
- « Une certaine liberté de mouvement ou d’entretien » ;
- « Rien de précis » ;
- « Je ne sais pas encore » ;
- « Autre » — précision facultative, 120 caractères maximum.

**Règle :** « Rien de précis » et « Je ne sais pas encore » sont exclusifs.

**Effet :** les éléments choisis alimentent le bloc 2. L’absence d’élément ne crée aucune flexibilité.

**Traducteur :** « Vous souhaitez préserver [éléments]. La suite vérifiera comment les faire coexister avec le changement recherché, sans supposer qu’un conflit existe déjà. » — D/H.

## 6. Étape 4 — Usages avant typologie

### Q4.1 — Usages à rendre possibles

**Question exacte :** « Dans le futur logement, quelles activités ont besoin d’une place ou d’une organisation plus adaptée ? »

**Jusqu’à cinq réponses :**

- « Dormir et préserver l’intimité » ;
- « Travailler ou étudier » ;
- « Accueillir des proches » ;
- « Cuisiner et prendre les repas » ;
- « Jouer ou laisser des activités installées » ;
- « Pratiquer un loisir ou une activité physique » ;
- « Ranger des objets utilisés régulièrement » ;
- « Stationner ou charger un véhicule » ;
- « Profiter d’un extérieur » ;
- « Circuler facilement ou anticiper une mobilité réduite » ;
- « Faire coexister des rythmes différents » ;
- « Aucun usage précis pour l’instant » ;
- « Autre » — précision facultative, 120 caractères maximum.

**Effet :** les usages alimentent le bloc 1 et déterminent les précisions Q4.2. Ils ne créent aucun nombre de pièces automatique.

**Traducteur :** « Vous avez relié le projet à des usages concrets : [usages]. C’est seulement après cette étape que maison, appartement, pièces ou surface peuvent être examinés comme des solutions possibles. » — C.

### Q4.2 — Intensité des usages prioritaires

**Condition :** au moins un usage précis à Q4.1.

**Question exacte :** « Parmi ces usages, lesquels doivent fonctionner sans compromis au quotidien ? »

**Jusqu’à deux réponses :** choix de Q4.1, plus :

- « Aucun n’est encore indispensable » ;
- « Je ne sais pas encore ».

**Effet :** un usage choisi devient **important à préserver**, pas une solution immobilière. « Aucun » et « Je ne sais pas » alimentent le bloc 4.

**Traducteur :** « [Usages] doivent fonctionner au quotidien. Cela semble les rendre structurants ; la forme immobilière qui y répond reste à vérifier. » — I.

### Q4.3 — Évolution prévisible

**Question exacte :** « Dans les prochaines années, un changement déjà envisagé pourrait-il modifier ces usages ? »

**Plusieurs réponses possibles :**

- « Une évolution de la composition du foyer » ;
- « Davantage ou moins de travail à domicile » ;
- « Un changement de trajets réguliers » ;
- « Un besoin d’accessibilité ou d’entretien plus simple » ;
- « Une activité ou un équipement à accueillir » ;
- « Aucun changement identifié » ;
- « Je ne sais pas » ;
- « Je préfère ne pas préciser » ;
- « Autre » — précision facultative, 120 caractères maximum.

**Règle :** aucun calendrier intime, donnée de santé ou identité n’est demandé.

**Effet :** ajoute une hypothèse ou une information manquante au bloc 4 ; ne transforme jamais une évolution envisagée en fait futur certain.

**Traducteur :** « Vous envisagez [évolution]. Cela pourrait modifier [usages concernés], mais cette évolution reste une hypothèse tant qu’elle n’est pas décidée. » — H.

## 7. Étape 5 — Cadre de réalité

Cette étape organise les repères déjà disponibles. Elle ne compare pas le projet à une offre réelle, à des ventes DVF ou à une règle bancaire.

### Q5.1 — Forme de la contrainte géographique

**Question exacte :** « Qu’est-ce qui délimite aujourd’hui votre zone de recherche ? »

**Plusieurs réponses possibles :**

- `communes` — « Une ou plusieurs communes » ;
- `travel` — « Un temps de trajet à ne pas dépasser » ;
- `person` — « Une personne à rejoindre régulièrement » ;
- `service` — « Un service ou une activité à garder proche » ;
- `broad` — « Un secteur large, encore ouvert » ;
- `unknown` — « Rien n’est encore fixé » ;
- `other` — « Autre contrainte ».

**Règles :** `unknown` est exclusif. Les choix font apparaître Q5.2A à Q5.2D. Une préférence n’est pas appelée « contrainte » dans la restitution avant Q5.3.

**Traducteur :** « Votre zone semble dépendre de [forme]. Il reste à distinguer ce qui est imposé, ce qui est préféré et ce qui doit encore être testé. » — I.

### Q5.2A — Communes envisagées

**Condition :** Q5.1 contient `communes`.

**Question exacte :** « Quelles communes servent aujourd’hui de repères ? »

**Réponse :** jusqu’à cinq noms de communes, 60 caractères maximum chacun. Aucune adresse ni quartier précis n’est demandé.

**Effet :** les communes sont restituées comme zone déclarée. Elles ne déclenchent aucune conclusion locale ni interrogation DVF.

### Q5.2B — Trajet régulier

**Condition :** Q5.1 contient `travel`.

**Questions exactes :**

1. « Vers quelle commune ou quel type de destination ce trajet conduit-il ? » — commune ou libellé générique tel que « lieu de travail », sans adresse, 80 caractères maximum ;
2. « Quel mode de déplacement faut-il tester ? » — « voiture », « transports en commun », « vélo », « marche », « plusieurs modes », « pas encore décidé » ;
3. « Quel temps aller simple souhaitez-vous d’abord tester ? » — « 15 minutes ou moins », « 16 à 30 minutes », « 31 à 45 minutes », « plus de 45 minutes », « je ne sais pas encore ».

**Effet :** forme une vérification de trajet. Le temps n’est jamais annoncé comme garanti.

### Q5.2C — Personne, service ou activité à rejoindre

**Condition :** Q5.1 contient `person` ou `service`.

**Question exacte :** « Quel type de proximité faut-il préserver ? »

**Réponses :** « proche », « accessible régulièrement », « compatible avec un trajet maximal », « à tester », « je ne sais pas encore ». Un champ facultatif permet seulement de nommer une commune ou un type de service, 80 caractères maximum ; aucun nom de personne ni adresse.

### Q5.2D — Autre contrainte géographique

**Condition :** Q5.1 contient `other`.

**Question exacte :** « Quelle autre contrainte faut-il prendre en compte ? » — 160 caractères maximum, avec l’aide « N’indiquez ni adresse précise ni nom de personne. »

### Q5.3 — Statut de chaque repère géographique

**Condition :** au moins un repère en Q5.2.

**Question exacte :** « Pour chacun de ces repères, quelle place a-t-il réellement dans votre décision ? »

**Réponses pour chaque repère :**

- « Indispensable aujourd’hui » ;
- « Important, mais à comparer » ;
- « Préférence » ;
- « Hypothèse à tester » ;
- « Je ne sais pas encore ».

**Effet :** seuls les repères explicitement « indispensables » ou « importants » entrent dans le bloc 2. Une préférence ou hypothèse reste au bloc 4 tant qu’elle n’a pas été testée.

**Traducteur :** « [Repère] est déclaré [statut]. Cela change son rôle dans la lecture : [préservation / comparaison / vérification], sans prouver qu’une commune ou un trajet conviendra réellement. » — C.

### Q5.4 — État du repère budgétaire

**Question exacte :** « Où en est votre repère de budget aujourd’hui ? »

**Une seule réponse :**

- `amount` — « J’ai une enveloppe globale assez précise » ;
- `range` — « J’ai une fourchette approximative » ;
- `monthly` — « Je raisonne surtout en mensualité » ;
- `not_started` — « Je ne l’ai pas encore cadré » ;
- `prefer_not` — « Je préfère ne pas l’indiquer ici ».

**Effets :**

- `amount` affiche Q5.4A ;
- `range` affiche Q5.4B ;
- `monthly` affiche Q5.4C ;
- `not_started` et `prefer_not` n’affichent aucun montant et placent la vérification budgétaire dans le bloc 4.

**Traducteur :**

- montant/fourchette : « Vous disposez d’un repère [précis/approximatif]. Il organise vos comparaisons, mais LEVOIS ne le valide pas et ne conclut pas qu’il permet d’acheter un bien donné. » — C/N ;
- mensualité : « Vous raisonnez d’abord en mensualité. Elle ne suffit pas ici à établir une enveloppe totale ou un financement. » — N ;
- non cadré : « Le budget reste à cadrer. Le parcours peut clarifier les usages et priorités, mais pas conclure sur la faisabilité. » — N.

### Q5.4A — Enveloppe globale

**Condition :** Q5.4 vaut `amount`.

**Question exacte :** « Quel montant sert aujourd’hui de repère global ? »

**Réponse :** montant entier en euros, de 10 000 à 5 000 000, facultatif. L’interface précise : « Ce montant n’est ni vérifié ni transmis sans votre action. »

### Q5.4B — Fourchette

**Condition :** Q5.4 vaut `range`.

**Question exacte :** « Entre quels montants se situe votre fourchette actuelle ? »

**Réponse :** minimum et maximum entiers en euros, de 10 000 à 5 000 000 ; le maximum doit être supérieur ou égal au minimum. Les deux restent facultatifs, mais une fourchette partielle est marquée incomplète.

### Q5.4C — Mensualité repère

**Condition :** Q5.4 vaut `monthly`.

**Question exacte :** « Souhaitez-vous noter la mensualité qui vous sert de repère ? »

**Réponse :** montant entier en euros, de 100 à 30 000, facultatif. Aucune durée, aucun taux et aucun capital ne sont déduits.

### Q5.4D — Ce que le repère inclut

**Condition :** Q5.4 vaut `amount` ou `range`.

**Question exacte :** « Que comprend ce repère, à votre connaissance ? »

**Plusieurs réponses possibles :**

- « Le prix d’achat » ;
- « Les frais d’acquisition » ;
- « Des travaux déjà envisagés » ;
- « Une réserve après l’achat » ;
- « Je ne sais pas exactement ».

**Règle :** « Je ne sais pas exactement » peut coexister avec les autres choix afin de signaler une composition incomplète.

**Effet :** une composante non sélectionnée n’est pas déclarée absente ; elle est seulement non confirmée. Le bloc 4 demande de vérifier la composition de l’enveloppe.

### Q5.5 — État du financement

**Question exacte :** « Quel échange ou travail avez-vous déjà réalisé sur le financement ? »

**Une seule réponse :**

- « Aucun pour l’instant » ;
- « J’ai fait mes propres calculs » ;
- « J’en ai parlé avec une banque ou un courtier » ;
- « J’ai reçu un accord de principe » ;
- « Le financement serait entièrement ou en partie sans emprunt » ;
- « Je ne sais pas encore » ;
- « Je préfère ne pas répondre ».

**Effet :** décrit uniquement le niveau de préparation. Même un accord de principe ne devient pas une validation bancaire par LEVOIS.

**Traducteur :** « Vous avez indiqué [état]. Cela décrit votre niveau de préparation ; LEVOIS ne vérifie ni la validité, ni le montant, ni les conditions d’un financement. » — D/N.

### Q5.6 — Horizon souhaité

**Question exacte :** « À quel moment aimeriez-vous pouvoir emménager ? »

**Une seule réponse :**

- « Dans moins de 3 mois » ;
- « Dans 3 à 6 mois » ;
- « Dans 6 à 12 mois » ;
- « Dans plus d’un an » ;
- « Je n’ai pas de date précise ».

**Effet :** l’horizon est comparé au niveau d’avancement et, pour un propriétaire, à la dépendance à une vente. Une tension est signalée comme ordre de vérification, jamais comme impossibilité.

**Traducteur :** « Vous visez [horizon] alors que votre projet est au stade [avancement]. Cela change l’ordre des prochaines vérifications ; cela ne permet pas de prédire la date d’achat. » — C/N.

### Q5.7 — Typologie envisagée

**Question exacte :** « Après avoir décrit vos usages, quelle forme de logement envisagez-vous aujourd’hui ? »

**Plusieurs réponses possibles :**

- « Une maison » ;
- « Un appartement » ;
- « Les deux restent possibles » ;
- « Une autre forme de logement » ;
- « Je ne sais pas encore ».

**Règle :** « Les deux » et « Je ne sais pas » sont exclusifs des autres choix. Aucune typologie n’est recommandée par le système.

**Traducteur :**

- forme choisie : « Vous associez aujourd’hui vos usages à [forme]. Cela reste votre hypothèse de solution ; le parcours ne conclut pas qu’elle est la seule possible. » — D/H ;
- incertain : « La typologie reste ouverte. Vos usages peuvent néanmoins servir à comparer les solutions. » — N/C.

### Q5.8 — Repère d’espace

**Question exacte :** « Quel repère utilisez-vous aujourd’hui pour parler de l’espace nécessaire ? »

**Une seule réponse :**

- `surface` — « Une surface minimale » ;
- `rooms` — « Un nombre de pièces ou d’espaces » ;
- `uses_only` — « Les usages décrits me paraissent plus fiables qu’un chiffre » ;
- `unknown` — « Je ne sais pas encore ».

**Conditions :**

- `surface` affiche « Quelle surface minimale sert de repère ? » — entier de 10 à 1 000 m², facultatif ;
- `rooms` affiche « Quels espaces doivent exister ? » — choix générés à partir de Q4.1, plus champ facultatif de 120 caractères ; aucun nombre de chambres n’est déduit ;
- les autres réponses n’affichent aucun nombre.

**Effet :** un chiffre est restitué comme repère déclaré et son lien aux usages est explicité. Il n’est comparé à aucun prix local.

**Traducteur :** « [Repère] sert aujourd’hui à représenter vos usages. Il reste à vérifier sur des plans ou des visites : une même surface peut être organisée très différemment. » — I.

### Q5.9 — État et travaux

**Question exacte :** « Quelle place les travaux peuvent-ils prendre dans votre recherche ? »

**Une seule réponse :**

- « Je cherche surtout un logement habitable sans travaux importants » ;
- « Des travaux limités restent possibles » ;
- « Des travaux importants peuvent être envisagés » ;
- « Cela dépend du coût, du délai et de ce qu’ils changent » ;
- « Je ne sais pas encore ».

**Effet :** peut nourrir un arbitrage état/budget-temps. Le système ne chiffre ni durée ni coût.

### Q5.10 — Vérifications sur le bien précis

**Condition :** Q1.1 vaut `identified` ou `offer`.

**Question exacte :** « Sur ce bien précis, qu’avez-vous déjà pu vérifier ? »

**Plusieurs réponses possibles :**

- « Les trajets et le quotidien autour » ;
- « L’organisation des espaces par rapport à mes usages » ;
- « L’état, les diagnostics ou les travaux visibles » ;
- « Les charges et dépenses récurrentes connues » ;
- « Les documents disponibles sur la copropriété, si elle existe » ;
- « Le coût global que j’anticipe » ;
- « Rien de suffisamment clair » ;
- « Je ne sais pas quoi vérifier ensuite ».

**Règles :** aucune adresse, URL d’annonce ou donnée extraite automatiquement en V1. Les éléments non cochés sont « non confirmés », pas nécessairement absents.

**Effet :** les éléments non confirmés pertinents alimentent le bloc 4.

### Q5.11 — Qualification explicite des critères

**Question exacte :** « Quelle place donnez-vous aujourd’hui à chacun de ces critères ? »

**Critères présentés :** uniquement les critères déjà cités par la personne à Q3, Q4 et Q5, dédupliqués et rédigés en langage courant. Pour chaque critère :

- « Indispensable » ;
- « Important » ;
- « Je pourrais l’assouplir dans certaines conditions » ;
- « Je ne sais pas encore » ;
- « Ce critère ne correspond plus à ma recherche ».

**Règles :**

- aucune ligne nouvelle n’est ajoutée comme priorité supposée ;
- « assouplir » exige Q5.12 ;
- retirer un critère à ce stade le retire des blocs 1 ou 2 après confirmation ;
- ne pas répondre ne signifie jamais « assouplissable ».

### Q5.12 — Condition d’un assouplissement

**Condition :** au moins un critère Q5.11 vaut « Je pourrais l’assouplir dans certaines conditions ».

**Question exacte :** « Dans quelle condition pourriez-vous assouplir [critère] ? »

**Réponses proposées, adaptées au critère :**

- « Si cela améliore mon besoin prioritaire » ;
- « Si l’autre option réduit une contrainte importante » ;
- « Si le coût global reste mieux maîtrisé » ;
- « Si le quotidien reste réellement praticable » ;
- « Seulement après une comparaison concrète » ;
- « Je ne sais pas encore » ;
- « Autre » — précision facultative, 120 caractères maximum.

**Effet :** seul un critère accompagné d’une condition explicite peut apparaître dans le bloc 3 avant l’étape 6.

**Traducteur :** « Vous envisagez d’assouplir [critère] seulement si [condition]. C’est un compromis conditionnel, pas un renoncement déjà décidé. » — D/C.

## 8. Étape 6 — Arbitrage utile

### 8.1. Condition de création

Un arbitrage apparaît seulement lorsqu’au moins deux éléments déclarés peuvent raisonnablement être comparés et qu’aucune réponse n’a déjà tranché leur relation. Une paire n’est jamais qualifiée d’incompatible faute de données de marché.

Ordre de sélection des paires :

1. besoin prioritaire contre élément à préserver ;
2. deux critères marqués « indispensables » dont la coexistence doit être testée ;
3. horizon court contre étape concrète encore non réalisée ;
4. état/travaux contre coût global ou délai ;
5. zone/temps de trajet contre usage d’espace ou extérieur ;
6. critère explicitement assouplissable contre bénéfice conditionnel déclaré.

Si aucune paire n’est légitime, Q6.1 est remplacée par Q6.3. Le système ne fabrique pas un dilemme.

### Q6.1 — Comparaison de deux scénarios

**Question exacte :** « Pour clarifier votre priorité, lequel de ces deux scénarios mérite d’être vérifié en premier ? »

**Structure obligatoire :**

- **Scénario A :** conserve `[critère A]` et demande de tester `[conséquence concrète A]` ;
- **Scénario B :** conserve `[critère B]` et demande de tester `[conséquence concrète B]` ;
- **Aucun des deux** ;
- **Impossible de choisir sans une information supplémentaire**.

**Exemples de génération autorisés :**

| Paire déclarée | Scénario A | Scénario B | Ce que le système ne dit pas |
|---|---|---|---|
| Zone précise / espace | « Conserver la zone et tester plusieurs organisations d’espace. » | « Conserver l’usage d’espace et tester une zone plus large. » | Que l’un des scénarios est disponible ou abordable. |
| Trajet / extérieur | « Garder le trajet repère et comparer des extérieurs plus modestes. » | « Garder l’usage extérieur et tester un trajet plus long. » | Qu’un trajet ou un extérieur est objectivement meilleur. |
| Peu de travaux / coût global | « Préserver un logement rapidement habitable et vérifier le coût global. » | « Accepter davantage de travaux seulement si leur coût et leur délai sont clarifiés. » | Le montant ou la faisabilité des travaux. |
| Horizon court / préparation incomplète | « Préserver l’horizon et prioriser immédiatement les vérifications manquantes. » | « Préserver le niveau de prudence et accepter de revoir l’horizon. » | Qu’il faut accélérer ou reporter. |
| Besoin nouveau / élément actuel à préserver | « Prioriser le changement recherché et tester ce qui peut préserver l’existant. » | « Préserver l’existant et tester une amélioration plus ciblée. » | Que les deux sont incompatibles. |

### Q6.2 — Raison du choix

**Condition :** Q6.1 affichée.

**Question exacte :** « Qu’est-ce qui a le plus pesé dans ce choix ? »

**Réponses :** les deux bénéfices précis décrits dans les scénarios, plus :

- « Le risque de regretter la perte d’un critère » ;
- « La possibilité de tester ce scénario plus facilement » ;
- « Une information me manque encore » ;
- « Je ne suis pas réellement décidé·e » ;
- « Autre » — précision facultative, 120 caractères maximum.

**Effet :**

- A ou B + raison cohérente : le compromis choisi entre dans le bloc 3 comme **à tester** ;
- « Aucun » : aucun critère ne devient flexible, les deux restent dans le bloc 4 ;
- information manquante : la donnée nommée devient prochaine vérification ;
- indécision : aucune fausse préférence n’est créée.

**Traducteur :** « Vous choisissez de vérifier d’abord [scénario] parce que [raison]. Cela semble ouvrir un compromis possible sur [critère], mais seulement dans les conditions que vous avez indiquées. » — I.

### Q6.3 — Prochaine comparaison à organiser

**Condition :** aucune paire légitime pour Q6.1.

**Question exacte :** « Votre recherche ne fait pas encore apparaître deux scénarios comparables. Quelle vérification vous aiderait le plus maintenant ? »

**Réponses adaptées :**

- « Tester un trajet réel » ;
- « Comparer deux organisations d’espace » ;
- « Clarifier ce que mon budget inclut » ;
- « Vérifier l’ordre achat–vente » — propriétaire concerné seulement ;
- « Faire le point sur le financement » ;
- « Observer ce que les prochaines visites changent » ;
- « Je ne sais pas encore ».

**Effet :** ajoute la prochaine vérification au bloc 4 sans alimenter le bloc 3.

## 9. Étape 7 — Lecture avant coordonnées

### Q7.1 — Action d’entrée dans la restitution

**Libellé exact :** « Voir ma première lecture ».

Avant affichage, le système contrôle :

1. les questions obligatoires du chemin suivi ;
2. les dépendances invalidées ;
3. les contradictions logiques ;
4. l’absence de conclusion interdite ;
5. la présence d’au moins un élément utile dans le bloc 1 ou le bloc 4.

Si ce minimum n’est pas atteint, la personne voit les seules questions à compléter, jamais un résultat générique.

### 9.1. Structure commune d’un item de restitution

Chaque item généré contient :

- un titre en langage courant ;
- le fait déclaré qui le fonde ;
- ce que ce fait change ou semble indiquer ;
- le niveau D, C, I, H ou N traduit en mots, jamais en note ;
- le cas échéant, une autre explication ;
- une prochaine vérification précise ;
- le lien « Modifier la réponse à l’origine ».

Un item sans réponse source n’existe pas. Une phrase générique peut introduire un bloc, mais ne compte pas comme résultat personnel.

### 9.2. Bloc 1 — Ce que votre achat doit changer

**Sources :** Q3.1, Q3.2, Q4.1, Q4.2 et, seulement comme contexte, Q2.3/Q4.3.

**Ordre :**

1. changement prioritaire explicite ;
2. autres changements déclarés ;
3. usages quotidiens structurants ;
4. évolutions futures, marquées comme hypothèses.

**Gabarit :**

> Vous avez indiqué que l’achat doit d’abord **[changement prioritaire]**. Dans votre quotidien, cela se traduit notamment par **[usages]**. **[Évolution]** pourrait aussi modifier ce besoin, mais elle reste à confirmer.

**État incomplet :** si Q3.1 vaut « Je n’arrive pas encore à le formuler », le bloc ne fabrique aucun objectif :

> Vous n’avez pas encore identifié le changement principal. La prochaine étape utile est d’observer un moment concret du quotidien qui ne fonctionne plus comme vous le souhaitez.

### 9.3. Bloc 2 — Ce que vous voulez préserver

**Sources :** Q3.3, usages Q4.2, repères Q5.3 marqués indispensables/importants et critères Q5.11 marqués indispensables/importants.

**Règles :**

- dédupliquer les formulations proches ;
- distinguer « indispensable » de « important » ;
- ne pas ajouter les critères non classés ;
- ne pas traiter « rien de précis » comme absence de préférence future.

**Gabarit :**

> Vous souhaitez préserver **[éléments déclarés]**. **[Critère]** est indiqué comme indispensable ; **[critère]** comme important. Leur coexistence reste à tester dans des situations réelles.

**État vide :**

> Vous n’avez pas encore nommé ce qui doit absolument être préservé. Rien n’est donc considéré comme flexible par défaut.

### 9.4. Bloc 3 — Ce que vous pourriez assouplir

**Sources exclusives :** Q5.11 « assouplir » + condition Q5.12, ou scénario Q6.1 choisi et confirmé par Q6.2.

**Règles :**

- le mot « pourriez » reste conditionnel ;
- le critère, la condition et le bénéfice attendu apparaissent ensemble ;
- un choix « aucun », une indécision ou un critère non sélectionné ne produit rien ;
- un changement d’une réponse source retire immédiatement l’item.

**Gabarit :**

> Vous pourriez tester un assouplissement de **[critère]**, seulement si **[condition explicite]**, afin de préserver ou améliorer **[bénéfice]**. Ce compromis n’est pas encore une décision.

**État vide :**

> Vous n’avez encore accepté aucun assouplissement précis. La lecture ne transforme donc aucun autre critère en variable d’ajustement.

### 9.5. Bloc 4 — Ce qu’il reste à décider ou vérifier

**Sources :**

- réponses « je ne sais pas », « cela dépend », incomplètes ou contradictoires ;
- dépendance à une vente `sale_yes` ou `sale_unsure` ;
- Q1.3 et Q5.10 ;
- composition incertaine du budget ;
- financement non cadré ou non vérifiable ;
- horizon en tension avec le stade ou une vente ;
- hypothèses géographiques ou typologiques ;
- scénario Q6.3 ou information manquante Q6.2.

**Ordre de priorité :**

1. ce qui conditionne plusieurs autres décisions ;
2. ce qui peut être vérifié avant une visite ou un engagement ;
3. ce qui explique une contradiction ;
4. ce qui reste simplement ouvert.

**Gabarit de chaque ligne :**

> **À vérifier : [question].** Vous avez indiqué **[fait]**. Cela ne permet pas encore de conclure **[limite]**. Prochaine vérification : **[action rationnelle]**.

Les actions autorisées sont notamment : tester un trajet aux horaires concernés, comparer deux plans selon les usages, clarifier les composantes de l’enveloppe, demander un point de financement, vérifier l’ordre achat–vente, relire des documents disponibles ou observer un critère lors de deux prochaines visites.

### 9.6. En-tête et limites de la lecture

La restitution commence par :

> **Votre première lecture**
>
> Elle organise ce que vous avez déclaré. Elle ne valide ni un budget, ni un financement, ni un bien et ne remplace pas les vérifications propres à votre situation.

Elle se termine, avant les sorties, par :

> Vous pouvez modifier chaque réponse. Une modification peut retirer ou changer les éléments qui en dépendent.

### 9.7. Ressources complémentaires

Des liens peuvent suivre la restitution sans modifier ses conclusions :

- `/votre-rue` ou une page locale, pour comprendre des ventes historiques et leurs limites ;
- une future page-réponse acheteur correspondant à la prochaine vérification ;
- `/methode`, pour distinguer fait, interprétation et hypothèse ;
- `/contact`, pour poser une question sans envoyer automatiquement la synthèse.

Le texte précise que ces ressources sont complémentaires. Les données locales ne sont pas injectées dans la lecture personnalisée V1.

## 10. Graphe d’invalidation et correction

### 10.1. Règle générale

Lorsqu’une réponse modifiée rend des réponses dépendantes impossibles ou ambiguës, le système :

1. annonce les éléments concernés avant validation de la modification ;
2. conserve les réponses indépendantes ;
3. supprime les seules réponses devenues hors branche ;
4. marque à revoir celles qui restent possibles mais dont le contexte a changé ;
5. recalcule la lecture ;
6. n’affiche jamais une ancienne conclusion incompatible.

### 10.2. Dépendances exactes

| Réponse modifiée | Réponses supprimées | Réponses à revoir | Blocs recalculés |
|---|---|---|---|
| P0 quitte la résidence principale | Toutes les réponses des étapes 1 à 7. | Aucune. | Tous ; le résultat disparaît. |
| Q1.1 devient `idea` | Q1.2, Q1.3 et Q5.10. | Q6 si fondé sur le stade. | 3 et 4. |
| Q1.1 quitte `identified/offer` | Q5.10. | Q6 si fondé sur un bien précis. | 4. |
| Q2.1 quitte `owner` | Q2.2. | Horizon/arbitrage si fondé sur la vente. | 4 et éventuellement 3. |
| Q2.1 devient `owner` | Aucune automatiquement. | Q2.2 devient obligatoire. | Résultat suspendu jusqu’à Q2.2. |
| Q3.1 | Q3.2 si ses choix ne sont plus disponibles. | Q4.2, Q5.11, Q6. | 1 à 4. |
| Q3.2 | Aucune. | Q6. | 1, 3 et 4. |
| Q3.3 | Classements Q5.11 des critères retirés. | Q6. | 2 à 4. |
| Q4.1 | Q4.2 et espaces Q5.8 devenus sans source. | Q5.7, Q5.11, Q6. | 1 à 4. |
| Q4.2 | Aucune. | Q5.11, Q6. | 1 à 4. |
| Q5.1 | Q5.2/Q5.3 des repères retirés. | Q5.11, Q6. | 2 à 4. |
| Q5.4 | Sous-question de montant devenue hors branche. | Q5.4D, Q6. | 3 et 4. |
| Q5.6 | Aucune. | Q6 si fondé sur le calendrier. | 4. |
| Q5.7/Q5.8/Q5.9 | Sous-questions hors branche. | Q5.11, Q6. | 2 à 4. |
| Q5.11 | Q5.12 des critères qui ne sont plus assouplissables. | Q6. | 2 à 4. |
| Q5.12 | Aucune. | Q6. | 3 et 4. |
| Q6.1 | Q6.2. | Aucune. | 3 et 4. |

### 10.3. Message avant invalidation

> Modifier cette réponse changera aussi : **[liste lisible]**. Les réponses indépendantes seront conservées. Voulez-vous appliquer la modification ?

Actions : **Appliquer la modification** · **Garder ma réponse actuelle**.

### 10.4. Revue avant toute transmission

La revue groupe les réponses par étape, affiche « Modifier » sur chaque groupe, puis montre la restitution recalculée. Une action de transmission ne peut utiliser qu’une version dont la revue et le résultat sont synchronisés.

## 11. États incomplets, contradictoires, incertains et indisponibles

### 11.1. Incomplet

- Une question obligatoire manquante bloque seulement le passage nécessaire à sa branche.
- Le message nomme la question et explique son utilité.
- Un montant ou champ libre facultatif vide ne bloque jamais.
- Si aucun changement ni usage n’est formulé, le résultat peut exister seulement si le bloc 4 fournit une prochaine observation utile ; il ne prétend pas clarifier davantage.

### 11.2. Contradiction logique

Une contradiction existe seulement entre deux déclarations incompatibles dans le modèle, par exemple : minimum supérieur au maximum, « aucun repère géographique » avec des communes actives, ou un critère simultanément retiré et déclaré indispensable.

Le système n’appelle pas contradiction :

- un horizon court avec un financement non commencé ;
- plusieurs critères ambitieux sans donnée de marché ;
- une maison et un appartement encore possibles ;
- le souhait de préserver deux éléments difficiles à comparer.

Ces situations sont des **tensions ou incertitudes**, pas des impossibilités.

**Message :** « Ces deux réponses ne peuvent pas être utilisées ensemble : [réponses]. Choisissez celle qui correspond encore à votre situation. »

### 11.3. Incertain

« Je ne sais pas » est une réponse valable. Elle ouvre une prochaine vérification et ne déclenche pas une relance obligatoire. Plusieurs incertitudes peuvent coexister sans empêcher la lecture, tant que celle-ci reste utile.

### 11.4. Service indisponible

- **Parcours indisponible avant traitement :** page d’erreur sobre, aucune perte annoncée à tort, accès aux contenus publics et au contact direct.
- **Erreur pendant une étape :** les champs présents restent visibles lorsque possible ; aucun succès n’est annoncé ; possibilité de réessayer.
- **Envoi de synthèse indisponible :** consultation et correction restent actives ; CTA d’envoi masqué ou message d’indisponibilité avant saisie de l’email.
- **Demande d’échange indisponible :** aucun lead annoncé ; téléphone, SMS et email publics peuvent être proposés comme solutions séparées.
- **Analytics indisponible :** aucun impact sur le parcours.

## 12. Trois sorties strictement séparées

### 12.1. Consulter ma synthèse

**Action :** « Consulter ma synthèse » ou simple maintien sur la page de résultat.

**Coordonnées :** aucune.

**Transmission :** aucune.

**Stockage distant :** aucun.

**Effet commercial :** aucun lead.

La personne peut imprimer depuis le navigateur, mais le produit ne promet ni fichier ni reprise ultérieure en V1.

### 12.2. Recevoir ma synthèse

**Action exacte :** « Recevoir ma synthèse par email ».

**Texte avant saisie :**

> Indiquez l’adresse à laquelle envoyer cette synthèse. Cet envoi ne crée pas une demande d’échange et ne transmet pas votre demande à Mouaad. Aucun appel automatique.

**Donnée demandée :** adresse email de destination. Aucun nom ni téléphone.

**Données transmises au service d’envoi :**

1. adresse email choisie ;
2. objet technique et version du modèle ;
3. quatre blocs de synthèse tels qu’ils sont visibles ;
4. limites de la lecture ;
5. date et heure d’envoi ;
6. identifiant technique éphémère de tentative, sans identifiant analytics.

**Données non transmises :** réponses brutes hors synthèse, téléphone, nom, attribution publicitaire, cookie analytics, historique de navigation et demande à Mouaad.

**Confirmation :** seulement après acceptation réelle par le service d’envoi : « Votre synthèse a été confiée au service d’envoi à l’adresse indiquée. Cela ne crée pas de demande d’échange avec Mouaad. » Cette phrase n’affirme pas la lecture effective du message.

**Condition de publication :** fonction testée, politique de confidentialité alignée, échec géré sans faux succès et absence de copie automatique à Mouaad. Sinon le CTA est absent.

### 12.3. Demander un échange

**Action exacte :** « Demander un échange avec Mouaad ».

**Introduction :**

> Mouaad répond personnellement. Vous choisissez comment il peut vous répondre. Aucun appel automatique : un appel ou un SMS n’est utilisé que si vous choisissez ce canal. Aucune durée ni délai de réponse n’est garanti.

**Champs :**

- prénom ou nom d’usage — requis, 80 caractères maximum ;
- canal souhaité — « Email », « Appel », « SMS », « À convenir » ;
- email — requis pour « Email » ou « À convenir », facultatif sinon ;
- téléphone — requis pour « Appel » ou « SMS », facultatif sinon ;
- message complémentaire — facultatif, 600 caractères maximum ;
- case obligatoire : « J’ai vérifié les informations ci-dessous et je demande leur transmission à Mouaad pour qu’il puisse me répondre. »

**Liste exacte affichée avant confirmation :**

1. prénom ou nom d’usage ;
2. canal choisi ;
3. coordonnée nécessaire au canal ;
4. message complémentaire éventuel ;
5. les quatre blocs de la synthèse, y compris les incertitudes ;
6. date et heure de la demande ;
7. première source connue, dernière source connue, porte d’arrivée et campagne seulement si elles existent après consentement et sous formes normalisées non sensibles.

**Exclusions :** réponses brutes non présentes dans la synthèse, historique de navigation, prompt ou conversation antérieure, adresse précise, données DVF, cookies et identifiants PostHog.

**Confirmation :** seulement après acceptation réelle : « Votre demande a bien été transmise à Mouaad. Il vous répondra personnellement selon les coordonnées et le canal indiqués. » Aucun délai n’est ajouté.

**Effet commercial :** lead seulement après succès technique. Lead qualifié si un canal joignable, un consentement valide et une synthèse exploitable sont présents ; aucun score automatique n’est exposé à la personne.

### 12.4. Étanchéité des finalités

- L’email saisi pour recevoir la synthèse ne préremplit le contact qu’après une action explicite et une information visible ; par défaut il n’est pas réutilisé.
- Recevoir la synthèse ne copie pas Mouaad et ne crée pas de lead.
- Demander un échange ne déclenche pas automatiquement un envoi séparé de synthèse à la personne.
- Changer de sortie exige le consentement propre à cette sortie.
- Une erreur sur une sortie ne transforme pas silencieusement l’action en une autre.

## 13. Conservation, suppression et minimisation

### 13.1. Avant transmission

- état conservé uniquement le temps de la page ou de la chaîne de requêtes nécessaire au parcours ;
- aucun compte, profil, fiche acquéreur ou enregistrement D1 ;
- aucun `localStorage` ou `sessionStorage` implicite dans la V1 de base ;
- aucune réponse dans l’URL, les logs applicatifs ou l’analytics ;
- réponses affichées uniquement sur des réponses privées `no-store`.

### 13.2. Après transmission volontaire

- **Synthèse email :** données traitées seulement pour l’envoi et les journaux techniques minimaux du prestataire ; aucune copie métier chez Mouaad.
- **Demande d’échange :** contenu livré à Mouaad comme correspondance entrante ; aucune base de visiteurs ou CRM implicite.
- **Suppression :** la politique doit fournir un canal d’exercice et décrire les limites liées aux journaux techniques et à la correspondance déjà reçue.

La durée chiffrée de conservation des messages transmis reste à arbitrer avant implémentation (§20). Aucune durée n’est inventée dans cette spécification.

## 14. Couche publique indexable et résultat privé

### 14.1. Architecture fonctionnelle recommandée

| État | Requête | Indexation | Cache | Données personnelles dans l’URL |
|---|---|---|---|---|
| Couche publique d’explication | `GET /ma-recherche` | Indexable si contenu substantiel | Public selon politique du site | Aucune |
| Étape de parcours | `POST /ma-recherche` ou endpoint interne équivalent | `noindex` | `Cache-Control: no-store, private` | Aucune |
| Revue et restitution | `POST` privé | `noindex`, `X-Robots-Tag: noindex, nofollow` | `no-store, private` | Aucune |
| Envoi ou demande d’échange | `POST` dédié | Non indexable | `no-store` | Aucune |

Cette architecture permet à une seule URL de porter une réponse éditoriale publique et des états personnels privés. Une route technique interne peut être utilisée à l’implémentation, mais elle ne doit pas devenir une URL publique contenant les réponses.

### 14.2. Couche publique minimale

La version indexable contient en HTML :

- la question à laquelle répond le parcours ;
- la réponse directe et les sept étapes ;
- ce que la synthèse permet et ne permet pas ;
- un exemple non personnel de fait, interprétation, hypothèse et vérification ;
- les règles de confidentialité ;
- l’auteur/responsable, la date de vérification et les limites ;
- des liens vers `/methode`, les contenus acheteurs, les pages locales et le contact ;
- le bouton de départ du parcours.

Aucune réponse essentielle de cette couche n’est cachée derrière JavaScript.

### 14.3. État privé sans stockage distant

**Avec JavaScript :** état en mémoire de la page ; aucun stockage persistant implicite. Les requêtes utilisent `POST` et retournent des réponses privées.

**Sans JavaScript :** chaque formulaire `POST` transporte un état borné et protégé dans le corps de la requête ; le serveur renvoie l’étape suivante et les champs nécessaires au prochain `POST`. Aucun état personnel n’est placé dans une query string.

**Dans les deux cas :** le serveur valide de nouveau toutes les valeurs, ignore les champs inconnus, borne le corps, refuse les doublons ambigus et n’écrit rien avant l’action explicite d’envoi ou d’échange.

Le mécanisme cryptographique ou de signature relève de l’implémentation et devra être revu en sécurité ; la présente spécification fixe le résultat attendu, pas une bibliothèque.

## 15. Fonctionnement sans JavaScript

Le parcours sans JavaScript doit permettre :

1. d’ouvrir la couche publique ;
2. de démarrer par un `POST` ;
3. de répondre à chaque question ;
4. de voir le traducteur après soumission de la réponse ;
5. de revenir à une étape antérieure ;
6. de modifier et invalider les réponses dépendantes ;
7. de consulter les quatre blocs ;
8. de recevoir la synthèse si la fonction est activée ;
9. de relire les données avant une demande d’échange ;
10. de recevoir une confirmation HTML accessible seulement après succès réel.

Exigences :

- `POST` natif, jamais `GET`, pour toute donnée personnelle ;
- même normalisation, mêmes bornes et mêmes consentements qu’avec JavaScript ;
- boutons de retour explicites, sans dépendre de l’historique navigateur ;
- erreurs liées aux champs et résumé d’erreurs en tête ;
- aucune réponse JSON brute présentée à la personne ;
- page de retour strictement autorisée, jamais choisie par une URL libre ;
- aucune PII réaffichée dans une confirmation ;
- aucune réussite annoncée avant acceptation du service externe concerné.

## 16. Accessibilité fonctionnelle

- structure de titres cohérente et un titre principal par page/état ;
- `main` unique ;
- progression textuelle « Étape X sur 7 » ;
- questions groupées par `fieldset` et `legend` lorsqu’il existe plusieurs choix ;
- libellé visible pour chaque champ ;
- aide et erreur reliées programmatiquement au champ ;
- ordre de tabulation conforme à l’ordre de lecture ;
- focus placé sur le titre de l’étape après navigation et sur le résumé d’erreurs après échec ;
- choix et états jamais communiqués par la couleur seule ;
- traducteur en zone annoncée de manière non intrusive ; une sélection multiple n’entraîne pas une rafale d’annonces ;
- possibilité de relire le traducteur sans limite de temps ;
- cibles tactiles suffisamment grandes, zoom à 200 % et reflow sans perte de fonction ;
- textes libres avec compteur accessible lorsqu’une borne est utile ;
- aucun glisser-déposer obligatoire ;
- arbitrage A/B accessible par boutons ou radios nommés, pas par une métaphore visuelle ;
- animations futures désactivables et jamais nécessaires à la compréhension ;
- confirmation de transmission, erreur et état d’indisponibilité accessibles au lecteur d’écran.

## 17. Mesure sans PII ni réponses personnelles

### 17.1. Événements autorisés

| Événement | Déclencheur | Propriétés autorisées |
|---|---|---|
| `ma_recherche_public_view` | Couche publique vue. | porte d’arrivée, source/campagne normalisées après consentement, type d’appareil agrégé. |
| `ma_recherche_start` | Premier `POST` accepté. | mode `js`/`no_js`, première ou dernière source normalisée si autorisée. |
| `ma_recherche_step_view` | Étape affichée. | numéro d’étape, mode technique. |
| `ma_recherche_step_complete` | Étape validée. | numéro, durée agrégée par tranche, nombre technique d’erreurs. |
| `ma_recherche_edit_start` | Correction engagée. | numéro d’étape source. |
| `ma_recherche_edit_apply` | Modification appliquée. | nombre de dépendances invalidées, jamais leurs valeurs. |
| `ma_recherche_result_view` | Quatre blocs affichés. | mode technique, version de restitution. |
| `ma_recherche_output_select` | Sortie choisie. | `consult`, `email_summary` ou `exchange`. |
| `ma_recherche_summary_send_attempt` | Envoi demandé. | version de modèle. |
| `ma_recherche_summary_send_success` / `failure` | Résultat technique. | code de résultat dans une liste fermée ; aucun message fournisseur brut. |
| `ma_recherche_exchange_review` | Liste de transmission affichée. | aucun canal ni réponse. |
| `ma_recherche_exchange_submit` | Consentement et envoi demandé. | aucun champ personnel. |
| `ma_recherche_exchange_success` / `failure` | Résultat technique. | code de résultat fermé. |
| `ma_recherche_scope_exit` | Sortie du périmètre principal. | destination technique, sans motif personnel détaillé. |

### 17.2. Interdictions analytics

Ne jamais envoyer :

- valeur ou libellé d’une réponse ;
- statut d’occupation, dépendance à une vente ou composition du foyer ;
- commune, destination, temps de trajet ou type de logement ;
- budget, surface, mensualité ou financement ;
- critère, arbitrage, synthèse ou texte libre ;
- email, téléphone, nom, adresse IP stockée volontairement ou identifiant de demande ;
- URL contenant une query personnelle ;
- contenu des erreurs fournisseur ;
- identifiant permettant de relier l’analytics à un email ou à un lead.

La mesure sans consentement reste limitée à la session selon les décisions acquises. Toute persistance intersession exige un consentement valable et une durée minimale utile déterminée lors de la revue de confidentialité.

## 18. Règles de validation et de sécurité des entrées

| Type | Règle fonctionnelle |
|---|---|
| Choix unique | Une valeur exacte de la liste ; doublon ou valeur inconnue refusé. |
| Choix multiple | Tableau dédupliqué, maximum annoncé respecté, valeurs exactes seulement. |
| Texte libre | Espaces normalisés, contrôle Unicode, taille en caractères et en octets, aucun HTML interprété. |
| Montant/surface | Entier dans la borne, séparateurs d’affichage retirés de façon non ambiguë, aucune valeur flottante. |
| Commune/libellé | Pas d’adresse précise demandée ; taille et nombre bornés ; contenu traité comme texte. |
| État de parcours | Versionné, borné, protégé contre modification, revalidé côté serveur. |
| Consentement | Valeur explicite, liée à une finalité ; jamais présumée par présence d’un champ. |
| Requêtes | Méthodes et types de contenu autorisés en liste fermée ; taille du corps limitée. |
| Réponses privées | `no-store`, pas de détail sensible dans les erreurs, pas de reflet de PII. |
| Services externes | Échec fermé : pas de faux succès, délai borné, message public générique et journal technique sans PII. |

## 19. Matrice d’acceptation

### 19.1. Parcours et branches

| ID | Cas | Résultat attendu |
|---|---|---|
| A01 | Résidence principale, stade idée, locataire | Étapes 1 à 7 ; aucune question vente ; usages avant typologie ; restitution utile sans coordonnées. |
| A02 | Propriétaire, achat dépendant d’une vente | Q2.2 visible ; aucune adresse/valeur ; dépendance au bloc 4 ; aucun parcours vendeur. |
| A03 | Propriétaire, vente incertaine | Incertitude conservée ; aucun ordre achat–vente affirmé. |
| A04 | Hébergé ou situation temporaire | Pas de vente ; temporalité présentée comme enjeu possible, pas urgence certaine. |
| A05 | Bien identifié | Q5.10 visible ; vérifications du bien au bloc 4 ; aucun verdict. |
| A06 | Offre envisagée | Même prudence ; aucune recommandation d’offrir ou de renoncer. |
| A07 | Investissement uniquement | Sortie distincte ; aucune réponse mélangée au parcours principal. |
| A08 | Hésitation résidence/investissement | Choix explicite de poursuivre uniquement l’hypothèse résidence principale ou de sortir. |
| A09 | Typologie inconnue | Parcours complet ; usages conservés ; aucun choix maison/appartement forcé. |
| A10 | Aucun repère de budget | Pas de montant demandé ; bloc 4 indique la vérification ; aucune faisabilité. |
| A11 | Fourchette incomplète | État incomplet localisé ; possibilité de retirer les montants et de poursuivre avec le statut approximatif. |
| A12 | Accord de principe déclaré | Restitué comme déclaration ; aucune validation bancaire. |
| A13 | Plusieurs critères indispensables | Arbitrage seulement si une comparaison rationnelle existe ; aucune incompatibilité inventée. |
| A14 | Aucun scénario légitime | Q6.3 remplace Q6.1 ; aucune opposition artificielle. |
| A15 | Choix « Aucun des deux » | Aucun critère ne devient flexible ; éléments au bloc 4. |
| A16 | Critère assouplissable sans condition | Q5.12 requise ; pas d’entrée au bloc 3 avant précision. |
| A17 | Aucun élément à préserver | Bloc 2 explique l’absence d’information ; aucune flexibilité déduite. |
| A18 | Plusieurs « Je ne sais pas » | Lecture autorisée si utile ; inconnues classées au bloc 4. |

### 19.2. Correction et cohérence

| ID | Cas | Résultat attendu |
|---|---|---|
| A19 | Propriétaire devient locataire | Q2.2 supprimée après avertissement ; dépendance vente retirée du résultat. |
| A20 | Bien identifié devient simple veille | Q5.10 supprimée ; anciennes vérifications du bien retirées. |
| A21 | Usage retiré | Précisions et critères dérivés invalidés ; aucun texte résiduel. |
| A22 | Priorité principale modifiée | Ordre du bloc 1 et arbitrage recalculés. |
| A23 | Critère assouplissable devient indispensable | Condition d’assouplissement supprimée ; item retiré du bloc 3. |
| A24 | Modification entraînant plusieurs invalidations | Liste lisible avant application ; réponses indépendantes conservées. |
| A25 | Minimum budgétaire supérieur au maximum | Erreur locale ; aucune restitution basée sur la fourchette. |
| A26 | Réponses tendues mais non contradictoires | Signalées comme éléments à tester, jamais comme impossibilité. |

### 19.3. Sorties et données

| ID | Cas | Résultat attendu |
|---|---|---|
| A27 | Consultation seule | Aucune coordonnée, requête d’envoi, lead ou stockage distant. |
| A28 | Envoi de synthèse réussi | Email destinataire seul + synthèse ; aucune copie à Mouaad ; confirmation après acceptation réelle. |
| A29 | Envoi de synthèse échoué | Aucun faux succès ; résultat toujours consultable ; email non réutilisé ailleurs. |
| A30 | Demande d’échange par email | Liste exacte affichée ; email requis ; téléphone facultatif ; envoi à Mouaad seulement après consentement. |
| A31 | Demande par appel | Téléphone requis ; aucun appel déclenché automatiquement par le système. |
| A32 | Demande par SMS | Téléphone requis ; aucun SMS sortant automatique non annoncé. |
| A33 | Canal « À convenir » | Email requis pour permettre une réponse ; aucune modalité supplémentaire promise. |
| A34 | Passage synthèse → échange | Coordonnée non réutilisée par défaut ; nouveau consentement. |
| A35 | Erreur service d’échange | Aucun lead marqué réussi ; solutions de contact direct accessibles. |
| A36 | Double soumission | Idempotence technique attendue ; pas de double email ou double lead. |

### 19.4. Indexation, cache et réseau

| ID | Cas | Résultat attendu |
|---|---|---|
| A37 | `GET /ma-recherche` | Couche HTML substantielle, indexable, sans état personnel. |
| A38 | Étape privée | Aucune réponse dans URL ; `no-store, private`. |
| A39 | Restitution | `noindex`, `no-store`, absente du sitemap et du cache partagé. |
| A40 | Retour navigateur | Aucun résultat personnel servi à un autre utilisateur ou depuis un cache partagé. |
| A41 | URL copiée | Ouvre seulement la couche publique, jamais la synthèse personnelle. |
| A42 | Champs inconnus ou dupliqués | Rejet ou normalisation fermée selon le type ; aucun contournement. |
| A43 | Corps trop volumineux | Rejet contrôlé sans journaliser le contenu. |
| A44 | Méthode ou type de contenu refusé | Réponse adaptée, aucune mutation ni transmission. |

### 19.5. Sans JavaScript, accessibilité et mesure

| ID | Cas | Résultat attendu |
|---|---|---|
| A45 | Parcours complet sans JavaScript | Réponse, retour, correction, restitution et sorties fonctionnent par `POST`. |
| A46 | Erreur sans JavaScript | HTML accessible, aucune réponse JSON brute, aucune PII dans URL. |
| A47 | Clavier seulement | Toutes les actions et corrections réalisables, focus cohérent. |
| A48 | Lecteur d’écran | Étape, question, aide, erreur, traducteur et confirmation correctement annoncés. |
| A49 | Zoom/reflow mobile | Aucune perte de contenu ou de fonction ; aucune interaction dépendante du survol. |
| A50 | Analytics actif avec consentement | Seuls événements et propriétés autorisés ; aucune valeur de réponse. |
| A51 | Analytics sans consentement | Mesure limitée à la session selon politique ; parcours inchangé. |
| A52 | Analytics indisponible | Aucun blocage ni erreur visible du parcours. |
| A53 | Inspection réseau | Aucune PII vers PostHog ; aucun secret côté navigateur ; aucune requête DVF personnalisée. |

### 19.6. Critères de sortie de spécification

La spécification est prête pour la phase créative seulement si :

1. les trois arbitrages du §20 sont tranchés ;
2. chaque question possède un effet et une dépendance testables ;
3. deux parcours différents produisent des blocs réellement différents ;
4. aucune réponse personnelle ne traverse l’analytics ;
5. les sorties et leurs finalités sont compréhensibles avant coordonnées ;
6. l’architecture privée est jugée réalisable et revue en confidentialité/sécurité ;
7. les cas A01 à A53 deviennent la base des critères d’implémentation ;
8. aucun choix visuel final n’a été imposé par la spécification.

## 20. Arbitrages de Direction générale réellement nécessaires

### ARB-01 — Destination de l’entrée investissement

**Recommandation :** sortir vers `/contact?objet=investissement` si cette URL peut rester une simple porte explicitant qu’aucun outil investissement n’existe encore. Le paramètre ne contient aucune PII et ne doit pas déclencher d’envoi.

**Alternative crédible :** `/accompagnement#achat`, avec une section distincte indiquant que l’investissement n’est pas traité par `/ma-recherche`.

**Décision attendue :** choisir une destination. Cette décision ne réintègre pas l’investissement dans le parcours.

### ARB-02 — Durée de conservation après transmission volontaire

**Recommandation :** aucune base LEVOIS en V1 ; conservation limitée aux journaux techniques nécessaires du service d’envoi et, pour une demande d’échange, à la correspondance reçue par Mouaad. Faire fixer avant implémentation une durée documentée et une procédure de suppression pour les messages qui ne donnent lieu à aucune relation suivie.

**Décision attendue :** valider ce principe puis faire fixer la durée chiffrée lors de la revue de confidentialité, ou imposer dès maintenant une durée métier.

### ARB-03 — Contenu de la demande d’échange

**Recommandation :** transmettre à Mouaad les quatre blocs de synthèse, pas toutes les réponses brutes. La liste exacte du §12.3 est affichée avant consentement.

**Alternative crédible :** transmettre seulement le bloc 4 et le message libre, ce qui minimise davantage les données mais réduit fortement la continuité de l’échange.

**Décision attendue :** valider « quatre blocs » ou choisir « bloc 4 seulement ».

L’architecture `GET` public / états `POST` privés, les canaux email-appel-SMS et la séparation des finalités sont tranchés par la présente recommandation à partir des décisions acquises. Ils ne nécessitent pas un arbitrage de positionnement supplémentaire, mais devront être validés techniquement avant implémentation.

## 21. Ordre futur et limite de la Phase 3 actuelle

1. validation de la présente spécification et des trois arbitrages ;
2. stabilisation technique des contrats de données, confidentialité, sécurité et non-JavaScript, sans changer le fond validé ;
3. ouverture de la phase créative expansive ;
4. production de trois territoires de direction artistique réellement distincts ;
5. choix d’un territoire par Mouaad ;
6. discipline du territoire choisi sans perdre son idée forte ;
7. implémentation seulement ensuite.

**Arrêt obligatoire actuel :** aucun code, aucune maquette, aucune direction artistique, aucune modification distante et aucun développement avant validation de ce document.
