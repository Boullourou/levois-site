# BUY OS — Spécification fonctionnelle V0.1

---
statut: proposition fonctionnelle
version: V0.1
date: 2026-08-23
produit: BUY OS
utilisateur principal: Mouaad
source_normative:
  - Constitution métier LEVOIS — Doctrine de décision V0.1
  - Doctrine BUY V0.1
---

## Préambule et autorité du document

Cette spécification traduit la Doctrine BUY en comportement produit. Elle ne crée aucune règle métier nouvelle.

L’ordre d’autorité est le suivant :

1. Constitution métier LEVOIS — Doctrine de décision V0.1 ;
2. Doctrine BUY V0.1 ;
3. présente spécification fonctionnelle ;
4. futures décisions de conception et d’implémentation.

En cas de contradiction, le niveau supérieur prévaut. Une évolution de BUY OS qui changerait la manière de décider doit d’abord être validée dans la doctrine, puis répercutée ici.

Ce document définit le comportement attendu du produit. Il ne définit ni modèle de données technique, ni base de données, ni architecture, ni interface pixel par pixel.

# 1. Objectif de BUY OS

BUY OS aide Mouaad à instruire une opportunité immobilière relativement au projet d’un acquéreur, jusqu’à pouvoir prendre et expliquer la prochaine décision raisonnable.

BUY OS doit permettre de répondre, pour chaque opportunité active, aux neuf questions de discipline BUY :

1. Pourquoi ce bien a-t-il attiré mon attention pour cet acquéreur ?
2. Quelle partie du projet est réellement concernée ?
3. Qu’est-ce que je sais ?
4. Qu’est-ce qui m’a seulement été déclaré ?
5. Qu’est-ce que j’ai moi-même observé ?
6. Qu’est-ce que je suppose encore ?
7. Quelles inconnues pourraient changer ma décision ?
8. Quelle est la prochaine décision raisonnable ?
9. Puis-je expliquer cette décision en quelques phrases au client ?

Le résultat recherché n’est ni une note de compatibilité, ni un classement de biens, ni une certitude artificielle. C’est une décision humaine, proportionnée aux informations disponibles, dont le raisonnement et les incertitudes restent visibles.

## 1.1. Promesse fonctionnelle

À partir d’un projet acquéreur et d’une opportunité, Mouaad doit pouvoir obtenir rapidement :

- une hypothèse d’intérêt spécifique au bien et à l’acquéreur ;
- une lecture séparant faits établis, déclarations, observations, hypothèses et inconnues ;
- les inconnues susceptibles de changer la décision ;
- des questions de vérification reliées à ces inconnues ;
- une prochaine décision raisonnable validée par Mouaad ;
- une explication courte, fidèle et relue avant tout partage au client ;
- une trace du retour acquéreur, distincte de la définition officielle de son projet.

## 1.2. Périmètre

BUY OS couvre l’instruction d’opportunités pour un acquéreur connu et un projet identifié. Il commence au chargement du projet et se termine, pour une boucle donnée, par une décision expliquée et éventuellement par l’enregistrement d’un retour.

BUY OS ne couvre pas la gestion commerciale générale de la relation, la prospection, les mandats, les transactions, les honoraires, les relances globales, les campagnes, les accords TIM ou le pilotage d’équipe.

## 1.3. Critère de réussite

BUY OS réussit lorsque Mouaad peut décider plus vite sans perdre la nuance, expliquer son raisonnement sans reproduire l’annonce et revenir plus tard sur une opportunité sans confondre ce qui était su, déclaré, observé ou supposé au moment de la décision.

# 2. Utilisateur principal

## 2.1. Utilisateur décisionnaire

L’utilisateur principal et décisionnaire de la V0.1 est **Mouaad**.

BUY OS soutient son jugement ; il ne s’y substitue pas. Mouaad reste responsable de :

- la compréhension du projet acquéreur ;
- la force donnée à chaque élément du cadre de décision ;
- la qualification de la nature des informations ;
- l’appréciation des conséquences pour le projet ;
- la priorité des inconnues ;
- le choix de la prochaine décision ;
- la validation du texte présenté au client ;
- la décision de faire évoluer ou non le projet après un retour.

## 2.2. Acquéreur

L’acquéreur n’est pas un utilisateur direct du premier incrément. Il est le destinataire possible d’une explication préparée dans BUY OS puis relue et partagée manuellement par Mouaad.

Le client ne voit pas automatiquement :

- les notes internes ;
- les hypothèses de travail non validées ;
- les contradictions en cours d’examen ;
- les informations privées provenant d’un tiers ;
- les formulations que Mouaad n’a pas choisi de partager.

## 2.3. Autres acteurs

Un propriétaire, un agent ou un intermédiaire peut être la source d’une déclaration ou le destinataire d’une question. Il n’est pas géré comme un contact commercial par BUY OS. Tomas n’est ni l’utilisateur de référence ni le centre fonctionnel du produit.

# 3. Principes fonctionnels

## 3.1. Le projet précède le bien

Aucune opportunité ne peut recevoir une décision BUY finalisée sans être rattachée à un projet acquéreur identifiable et à une version compréhensible de son cadre de décision.

## 3.2. Le bien est évalué relativement au projet

BUY OS ne demande pas si le bien est bon ou mauvais. Il demande pourquoi ce bien pourrait compter, ou ne plus compter, pour cet acquéreur dans la situation actuelle.

## 3.3. Le sens d’un critère reste visible

Le cadre de décision distingue au minimum :

- les conditions essentielles ;
- les préférences fortes ;
- les arbitrages ouverts ;
- les repères ;
- les éléments encore à confirmer avec l’acquéreur.

Quand c’est utile, chaque élément précise ce qu’il protège ou permet : usage, confort, budget, financement, calendrier, trajet, indépendance, intimité ou autre enjeu réel du projet.

## 3.4. L’hypothèse initiale est obligatoire et provisoire

Une opportunité poursuivie après le premier regard doit compléter la phrase :

> Ce bien mérite peut-être l’attention de cet acquéreur parce que…

La formulation doit être spécifique au bien, spécifique au projet et assez précise pour orienter les vérifications. Une formule générique telle que « il correspond à plusieurs critères » est insuffisante.

## 3.5. La nature de l’information est explicite

BUY OS utilise le vocabulaire fonctionnel suivant :

| Nature | Sens dans BUY OS | Règle |
|---|---|---|
| Connu / fait établi | Information suffisamment vérifiée pour être utilisée comme certaine à cette étape. | La provenance doit rester identifiable. |
| Déclaré | Information publiée ou affirmée par une annonce, un propriétaire, un intermédiaire ou une autre source. | Une déclaration ne devient pas automatiquement un fait établi. |
| Observé | Élément directement constaté par Mouaad. | L’observation est séparée de son interprétation. |
| Supposé / hypothèse | Possibilité plausible utilisée pour orienter le raisonnement. | Elle reste présentée comme provisoire jusqu’à nouvel élément. |
| Inconnu / à confirmer | Information absente ou insuffisante. | L’absence d’information n’est jamais transformée en défaut. |
| Conclusion | Jugement de Mouaad produit à partir des éléments précédents. | Elle doit pouvoir être expliquée par ses appuis et révisée. |

Une observation peut contribuer à établir un fait, mais ce changement de statut exige une action consciente de Mouaad. BUY OS ne fusionne pas silencieusement ces catégories.

## 3.6. Toutes les inconnues ne se valent pas

BUY OS distingue les inconnues simplement présentes des **inconnues décisionnelles**, c’est-à-dire celles dont une réponse favorable ou défavorable pourrait changer la prochaine décision.

Une inconnue décisionnelle doit indiquer :

- pourquoi elle compte pour ce projet ;
- quelle hypothèse elle teste ;
- ce qu’une réponse favorable pourrait permettre ;
- ce qu’une réponse défavorable pourrait remettre en cause ;
- si elle doit être résolue avant la prochaine étape.

## 3.7. L’investigation est progressive

BUY OS ne cherche pas l’exhaustivité. Il aide à obtenir uniquement le niveau de connaissance nécessaire à la décision suivante. Il doit être possible d’écarter tôt une opportunité clairement incompatible comme d’approfondir une exception crédible.

## 3.8. Les suggestions restent des propositions

BUY OS peut proposer :

- des questions utiles ;
- des points de vigilance ;
- une prochaine décision possible ;
- un brouillon d’explication.

Chaque proposition doit être modifiable, rejetable et identifiable comme telle. Sans validation explicite de Mouaad, elle ne devient ni une information métier, ni une décision, ni un message prêt à envoyer.

## 3.9. La décision reste explicable et révisable

Toute décision finalisée porte une raison liée au projet, les principaux appuis disponibles, les incertitudes encore pertinentes et la date de la décision. Une nouvelle information peut conduire à une nouvelle décision sans effacer la logique de la précédente.

## 3.10. Le retour informe sans réécrire

Le retour acquéreur est enregistré comme une réaction située. Il peut faire apparaître un motif récurrent ou une hypothèse d’évolution du projet, mais ne modifie jamais automatiquement le cadre de décision.

## 3.11. La simplicité sert la décision

BUY OS ne demande pas de compléter un dossier exhaustif avant d’être utile. Il montre d’abord ce qui est nécessaire à la prochaine décision, permet une saisie courte sur le terrain et rend le détail disponible seulement lorsqu’il compte.

# 4. Parcours utilisateur

Le parcours nominal est une boucle d’instruction, et non un tunnel irréversible.

1. **Charger ou créer un projet acquéreur.** Mouaad identifie le projet auquel l’opportunité sera comparée.
2. **Relire ou définir le cadre de décision.** Il vérifie la finalité, les contraintes, les préférences, les arbitrages, les repères et les éléments à confirmer.
3. **Ajouter une opportunité.** Il conserve l’origine et les quelques éléments disponibles sans devoir retranscrire toute l’annonce.
4. **Formuler l’hypothèse initiale.** Il explique pourquoi ce bien pourrait mériter l’attention de cet acquéreur.
5. **Relier l’opportunité au projet.** Il indique quelles parties du projet sont concernées et quelles conséquences possibles sont en jeu.
6. **Qualifier les informations.** Il sépare ce qui est connu, déclaré, observé, supposé et inconnu.
7. **Identifier les inconnues décisionnelles.** Il fait ressortir ce qui peut rendre l’hypothèse vraie ou fausse et modifier la suite.
8. **Préparer les vérifications.** BUY OS propose des questions reliées aux inconnues ; Mouaad les choisit et les reformule.
9. **Prendre la prochaine décision.** Mouaad valide une décision parmi les six issues prévues et en donne la raison.
10. **Expliquer la décision.** BUY OS prépare un brouillon court ; Mouaad le relit et choisit ou non de le partager.
11. **Ajouter de nouveaux éléments.** Une réponse, un échange ou une visite enrichit l’instruction en conservant sa nature et sa provenance.
12. **Enregistrer le retour acquéreur.** Le retour est conservé à part ; une évolution éventuelle du projet reste une décision ultérieure et explicite de Mouaad.

## 4.1. Boucles de reprise

Le parcours doit permettre de revenir sans perte de contexte :

- d’une question reçue vers la qualification des informations ;
- d’une nouvelle observation vers les inconnues et la décision ;
- d’un retour acquéreur vers une nouvelle hypothèse sur le projet ;
- d’une décision passée vers une décision révisée, avec la nouvelle raison ;
- d’un projet révisé vers la réévaluation explicite des opportunités encore actives.

Une opportunité en cours peut rester en brouillon. Un brouillon n’est pas présenté comme une décision.

# 5. Écrans ou moments d’usage

Les noms ci-dessous décrivent des moments fonctionnels. Ils ne prescrivent ni pages distinctes, ni navigation, ni mise en page précise.

## 5.1. Espace BUY — reprendre une instruction

**Mouaad doit voir :**

- les projets acquéreurs utiles à l’instruction BUY ;
- pour chaque projet, les opportunités récemment instruites ;
- pour chaque opportunité, sa décision courante ou son état de brouillon ;
- la prochaine action concrète, lorsqu’elle existe ;
- les opportunités bloquées par une inconnue décisionnelle.

**Mouaad doit pouvoir saisir ou faire :**

- ouvrir un projet ;
- créer un projet minimal ;
- reprendre une opportunité ;
- démarrer l’instruction d’une nouvelle opportunité.

**L’outil produit :** un point de reprise orienté vers la décision, pas une file commerciale de prospects.

**Reste manuel :** choisir ce qui mérite son attention maintenant.

## 5.2. Projet acquéreur — comprendre ce que l’achat doit accomplir

**Mouaad doit voir :**

- la finalité de l’achat ;
- la zone réellement envisageable et le sens des contraintes géographiques ;
- le budget, ses limites et les conditions de financement connues ;
- le calendrier ;
- les usages attendus ;
- ce que l’acquéreur veut éviter ;
- les décisions ou confirmations récentes qui ont fait évoluer la compréhension du projet ;
- les points encore non tranchés par l’acquéreur.

**Mouaad doit pouvoir saisir :**

- une synthèse courte du projet ;
- les éléments du cadre de décision ;
- le sens protégé par chaque élément lorsque ce sens n’est pas évident ;
- ce qui est confirmé et ce qui reste à confirmer ;
- une révision explicite après confirmation avec l’acquéreur.

**L’outil produit :** un cadre de décision lisible et daté, utilisable comme référence de l’instruction.

**Reste manuel :** comprendre le projet, arbitrer la force des critères et confirmer toute évolution avec l’acquéreur.

## 5.3. Capture d’opportunité — garder le contexte sans recopier l’annonce

**Mouaad doit voir :**

- le projet auquel le bien est rattaché ;
- l’origine de l’opportunité ;
- les informations immédiatement disponibles ;
- ce qui n’a pas encore été qualifié.

**Mouaad doit pouvoir saisir :**

- un lien ou une référence ;
- un intitulé court permettant de retrouver le bien ;
- la source et la date d’observation de cette source ;
- quelques informations utiles disponibles : localisation, typologie, prix, surfaces, état annoncé, travaux annoncés, contraintes ou caractéristiques significatives ;
- une note terrain rapide, y compris lorsque l’information est incomplète.

**L’outil produit :** une opportunité rattachée à un projet, prête à être instruite.

**Reste manuel :** choisir la source, vérifier que le bon projet est ciblé et décider si le premier regard justifie une instruction.

## 5.4. Hypothèse initiale — dire pourquoi ce bien pourrait compter

**Mouaad doit voir :**

- la synthèse du projet ;
- les éléments du bien qui ont attiré son attention ;
- la formulation obligatoire « Ce bien mérite peut-être l’attention de cet acquéreur parce que… » ;
- un rappel qu’il s’agit d’une hypothèse provisoire.

**Mouaad doit pouvoir saisir :**

- une hypothèse en une ou quelques phrases ;
- les parties précises du projet concernées ;
- le compromis ou l’exception envisagé ;
- les conséquences possibles sur l’usage, le confort, le budget, le financement ou le calendrier.

**L’outil produit :** une hypothèse spécifique qui oriente la suite de l’instruction.

**Reste manuel :** décider si la raison est suffisamment sérieuse et spécifique pour continuer.

## 5.5. Tableau d’instruction — séparer les informations et le raisonnement

**Mouaad doit voir :**

- les faits établis ;
- les déclarations, avec leur auteur ou leur source ;
- ses observations directes ;
- les hypothèses encore actives ;
- les inconnues ;
- les contradictions éventuelles entre sources ;
- le lien de chaque élément important avec le projet ;
- l’hypothèse initiale toujours accessible.

**Mouaad doit pouvoir saisir :**

- un nouvel élément dans la bonne catégorie ;
- sa provenance et, si nécessaire, sa date ;
- la conséquence qu’il pourrait avoir pour le projet ;
- une correction sans faire disparaître silencieusement l’information antérieure ;
- le passage conscient d’une information vers un autre statut lorsque cela est justifié.

**L’outil produit :** une lecture structurée de l’état réel de connaissance, sans score global.

**Reste manuel :** qualifier la nature de l’information, distinguer observation et interprétation, résoudre les contradictions et établir les conclusions.

## 5.6. Inconnues et questions utiles — préparer la prochaine vérification

**Mouaad doit voir :**

- toutes les inconnues identifiées ;
- les inconnues marquées comme capables de changer la décision ;
- la raison pour laquelle chacune compte ;
- les questions proposées ;
- pour chaque question, l’hypothèse testée et l’effet possible de la réponse ;
- les questions déjà posées et les réponses reçues.

**Mouaad doit pouvoir saisir ou faire :**

- marquer ou retirer le caractère décisionnel d’une inconnue ;
- préciser si elle doit être résolue avant l’étape suivante ;
- accepter, modifier, supprimer ou créer une question ;
- choisir le destinataire et le mode de vérification ;
- enregistrer une réponse en qualifiant sa nature ;
- indiquer qu’une question n’est plus utile.

**L’outil produit :** une liste courte et priorisée de vérifications qui servent effectivement la décision.

**Reste manuel :** choisir les questions à poser, les poser, apprécier la fiabilité de la réponse et décider quand l’investigation est suffisante.

## 5.7. Décision — choisir jusqu’où aller

**Mouaad doit voir :**

- l’hypothèse initiale ;
- les parties du projet concernées ;
- les principaux éléments qui soutiennent ou fragilisent cette hypothèse ;
- les inconnues décisionnelles non résolues ;
- les six décisions autorisées ;
- une éventuelle suggestion de l’outil clairement présentée comme proposition ;
- la décision précédente si l’opportunité est réévaluée.

**Mouaad doit pouvoir saisir ou faire :**

- choisir une décision ;
- rédiger ou corriger sa raison ;
- préciser la prochaine action concrète ;
- conserver les réserves et inconnues encore pertinentes ;
- réviser plus tard la décision sans effacer la précédente.

**L’outil produit :** une décision datée, explicable et validée par Mouaad.

**Reste manuel :** le choix final. BUY OS ne valide jamais une décision à la place de Mouaad.

## 5.8. Explication acquéreur — transformer le raisonnement en message court

**Mouaad doit voir :**

- la décision validée ;
- la raison principale reliant le bien au projet ;
- deux ou trois éléments réellement pertinents ;
- le compromis ou point de vigilance ;
- une ou deux inconnues significatives, si elles subsistent ;
- un aperçu exact du texte destiné au client.

**Mouaad doit pouvoir saisir ou faire :**

- générer un brouillon à partir des seuls éléments autorisés ;
- modifier librement ce brouillon ;
- retirer une information privée ou prématurée ;
- valider la version qu’il souhaite partager ;
- copier la version validée.

**L’outil produit :** une explication courte qui explique la décision sans recopier l’annonce, survendre le bien ni recommander un achat.

**Reste manuel :** la relecture, la validation, le choix du canal et l’envoi effectif.

## 5.9. Retour acquéreur — apprendre sans dériver

**Mouaad doit voir :**

- l’explication ou la décision à laquelle le client réagit ;
- le cadre de décision qui était en vigueur ;
- les retours précédents pertinents ;
- les motifs qui semblent se répéter, présentés comme hypothèses à confirmer.

**Mouaad doit pouvoir saisir :**

- le retour brut ou une synthèse fidèle ;
- le motif compris par Mouaad, séparé des mots du client ;
- la nature de la réaction : intérêt, refus, hésitation, demande, retour de visite ou autre ;
- une hypothèse d’apprentissage ;
- une question à poser au client pour confirmer une évolution possible ;
- après confirmation, une action séparée de révision du projet.

**L’outil produit :** une trace contextualisée du retour et, au besoin, une proposition d’élément à confirmer.

**Reste manuel :** décider s’il faut interroger davantage le client et confirmer explicitement toute modification du projet.

# 6. Données visibles

## 6.1. Visibilité permanente pendant l’instruction

Sans imposer une présentation précise, BUY OS doit garder facilement accessibles :

- l’identité fonctionnelle du projet en cours ;
- sa finalité et sa synthèse ;
- le cadre de décision applicable ;
- l’opportunité examinée et sa source ;
- l’hypothèse initiale ;
- la nature de chaque information ;
- les inconnues capables de changer la décision ;
- la décision courante ou l’état de brouillon ;
- la prochaine action ;
- les réserves à ne pas masquer dans une explication client.

## 6.2. Provenance et temporalité

Pour toute information ayant un effet réel sur la décision, Mouaad doit pouvoir comprendre :

- d’où elle vient ;
- qui l’a déclarée ou observée ;
- à quel moment elle était disponible ;
- si elle est encore actuelle ;
- si elle a été corrigée, contredite ou remplacée ;
- dans quelle décision elle a été utilisée.

Cette exigence ne transforme pas l’outil en journal exhaustif de toutes les actions. Elle protège seulement l’explicabilité des décisions BUY.

## 6.3. Synthèse avant détail

La première lecture d’une opportunité doit permettre de comprendre rapidement :

1. pourquoi elle a été retenue ;
2. ce qui compte pour le projet ;
3. ce qui est connu et ce qui reste incertain ;
4. ce qui pourrait changer la décision ;
5. quelle est la prochaine décision ou action.

Le détail de l’annonce, les notes longues et les éléments secondaires ne doivent pas repousser ces réponses hors du moment de décision.

## 6.4. État de proposition

Toute question, conclusion, décision ou rédaction proposée par l’outil doit afficher un état sans ambiguïté : brouillon ou proposition tant que Mouaad ne l’a pas validée.

# 7. Données privées

BUY OS est un espace de travail privé. Le fait qu’une information soit visible par Mouaad ne la rend pas partageable avec l’acquéreur ou un tiers.

## 7.1. Informations privées par défaut

Restent privées par défaut :

- les coordonnées et détails personnels de l’acquéreur ;
- les conditions de financement détaillées ;
- les contraintes personnelles sensibles ;
- les notes internes de Mouaad ;
- les hypothèses non confirmées sur le client, le bien ou un tiers ;
- les contradictions non résolues ;
- les déclarations confidentielles d’un propriétaire ou d’un intermédiaire ;
- les sources et extraits qui ne sont pas nécessaires au client ;
- les brouillons non validés ;
- les retours acquéreur bruts et les motifs interprétés par Mouaad ;
- l’historique interne des décisions et corrections.

## 7.2. Règle de partage

Une explication client ne peut utiliser que les éléments que Mouaad a explicitement retenus pour ce partage. BUY OS ne partage et n’envoie rien automatiquement.

La version client doit :

- rester fidèle à la nature des informations ;
- signaler les inconnues significatives ;
- ne pas exposer une hypothèse interne comme un fait ;
- ne pas inclure de donnée d’un tiers sans raison et autorisation appropriées ;
- ne pas dévoiler plus du projet personnel que nécessaire pour expliquer la pertinence du bien.

## 7.3. Minimisation fonctionnelle

BUY OS ne demande que les informations nécessaires à l’instruction. Il n’exige pas de collecter l’ensemble d’une identité, d’une conversation, d’un email, d’une annonce ou d’un document lorsqu’une référence ou un extrait suffisent.

# 8. Actions possibles

## 8.1. Actions sur le projet

Mouaad peut :

- créer ou charger un projet ;
- définir et relire son cadre de décision ;
- préciser le sens d’un critère ;
- distinguer confirmé et à confirmer ;
- créer une révision explicite après confirmation avec le client ;
- conserver l’état antérieur utile à la compréhension des décisions passées.

## 8.2. Actions sur une opportunité

Mouaad peut :

- ajouter une opportunité ;
- la rattacher au bon projet ;
- écrire l’hypothèse initiale ;
- relier le bien aux parties pertinentes du projet ;
- ajouter et requalifier des informations ;
- marquer des contradictions ;
- identifier et prioriser les inconnues décisionnelles ;
- préparer et suivre des questions ;
- ajouter une réponse ou une observation ;
- prendre puis réviser une décision ;
- produire une explication client ;
- enregistrer un retour acquéreur.

## 8.3. Les six décisions BUY

Chaque instruction finalisée pour l’étape courante aboutit à une décision choisie par Mouaad parmi les suivantes :

Ces décisions ne sont ni des notes ni les étapes obligatoires d’un pipeline. Elles expriment la prochaine orientation raisonnable au niveau d’information actuel. Une opportunité peut passer de l’une à l’autre lorsqu’un nouvel élément apparaît, sans devoir suivre un ordre prédéfini. Présenter n’implique pas automatiquement de visiter ; visiter n’implique jamais d’acheter.

### Écarter

Le bien ne justifie plus d’attention dans le cadre de ce projet. La décision précise l’incompatibilité ou la raison pour laquelle le potentiel restant ne justifie plus l’effort. Elle ne qualifie pas le bien de « mauvais » dans l’absolu.

### Conserver comme repère

Le bien apporte une information utile sur le marché ou le projet sans justifier pour l’instant présentation ou visite. Mouaad indique explicitement ce qu’il permet de comparer ou d’apprendre. Sans utilité nommée, le bien ne doit pas être accumulé comme repère.

### Demander une information

Une inconnue identifiable empêche la prochaine décision raisonnable. La décision comporte au moins la question utile, sa raison et la personne ou source susceptible d’y répondre.

### Approfondir

Le potentiel paraît suffisant pour investir davantage de temps, mais la vérification ne se réduit pas à une seule demande. Mouaad précise ce qui doit être approfondi et jusqu’à quelle prochaine décision.

### Présenter

Le bien conserve une compatibilité crédible et une raison spécifique de mériter l’attention du client. La décision rend visibles le compromis éventuel et les inconnues restantes. Présenter ne signifie ni recommander l’achat ni masquer les limites.

### Proposer une visite

L’intérêt est suffisamment établi et la confrontation au réel peut faire progresser la décision. Mouaad précise ce que la visite doit permettre d’observer ou de trancher. « Visiter pour voir » sans question réelle n’est pas une justification suffisante.

## 8.4. Aide à la décision

BUY OS peut signaler qu’une décision semble insuffisamment instruite, par exemple lorsque :

- aucune hypothèse spécifique n’a été formulée ;
- une condition essentielle connue est ignorée sans explication ;
- une inconnue décisionnelle est masquée ;
- une présentation ne comporte aucune raison propre au client ;
- une visite ne comporte aucune question à trancher ;
- un écartement repose uniquement sur une information absente ;
- une explication transforme une déclaration ou une hypothèse en fait.

Le signal n’interdit pas à Mouaad de juger une exception. Il lui demande d’en rendre la raison explicite.

La prochaine action associée reste strictement liée à l’instruction de l’opportunité. Elle ne constitue pas un système général de tâches, de relances ou de suivi commercial.

# 9. Sorties produites

## 9.1. Fiche d’instruction de l’opportunité

Elle réunit, dans une forme lisible :

- le projet concerné ;
- la référence de l’opportunité ;
- l’hypothèse initiale ;
- les parties du projet concernées ;
- les faits établis, déclarations, observations, hypothèses et inconnues utiles ;
- les inconnues décisionnelles ;
- les questions et réponses pertinentes ;
- la décision courante, sa raison et sa prochaine action ;
- l’historique utile des décisions révisées.

## 9.2. Liste de vérifications utiles

Cette sortie est courte et actionnable. Chaque question indique :

- ce qu’elle cherche à savoir ;
- pourquoi cela compte pour le projet ;
- l’hypothèse ou la décision qu’elle peut faire évoluer ;
- à qui ou par quel moyen la vérification peut être adressée ;
- son état : à poser, posée, répondue ou devenue inutile.

## 9.3. Note de décision

La note de décision contient :

- l’une des six décisions BUY ;
- une raison spécifique au bien et au projet ;
- les principaux éléments qui la soutiennent ;
- les incertitudes encore visibles ;
- la prochaine action raisonnable ;
- la validation explicite de Mouaad.

Elle ne contient aucune note, pourcentage, rang ou verdict automatique de compatibilité.

## 9.4. Explication courte pour l’acquéreur

Le brouillon suit une structure simple :

1. pourquoi Mouaad montre le bien ou évoque la décision ;
2. ce qui paraît réellement intéressant ;
3. le compromis ou point de vigilance ;
4. ce qui reste à vérifier, si nécessaire.

Le texte doit être court, concret, spécifique et compréhensible sans jargon interne. Il ne reproduit pas l’annonce. Il reste un brouillon tant que Mouaad ne l’a pas validé.

## 9.5. Trace de retour acquéreur

Elle conserve :

- la réaction du client et son contexte ;
- le motif déclaré par le client, s’il existe ;
- l’interprétation éventuelle de Mouaad, clairement séparée ;
- une possible régularité avec d’autres retours ;
- une hypothèse d’évolution à confirmer ;
- la décision éventuelle de revoir le projet, dans une action distincte.

# 10. Règles d’interdiction

## 10.1. Interdictions absolues

BUY OS ne doit jamais :

- décider à la place de Mouaad ;
- décider à la place de l’acquéreur de ce qu’il doit acheter ;
- attribuer une note, un score, un pourcentage de compatibilité ou un classement automatique aux biens ;
- transformer tous les critères en filtres absolus ;
- transformer une préférence ou un repère en interdiction silencieuse ;
- présenter une information absente comme un défaut ;
- présenter une déclaration, une observation ou une hypothèse comme un fait établi sans validation ;
- cacher une inconnue importante pour rendre une recommandation plus convaincante ;
- inventer une information, une source, une question reçue ou une réponse ;
- générer une explication générique interchangeable entre plusieurs biens ou acquéreurs ;
- recommander un achat ;
- proposer une visite sans intérêt établi et sans question utile à trancher ;
- modifier automatiquement le projet à partir d’un retour ponctuel ou répété ;
- envoyer automatiquement un message, une présentation ou une demande d’information ;
- faire d’une suggestion un élément validé sans action explicite de Mouaad ;
- effacer silencieusement une information, une décision ou une source antérieure utile à l’explication ;
- utiliser les données d’un autre acquéreur pour instruire le projet courant ;
- exposer des données privées dans une sortie client sans sélection explicite de Mouaad.

## 10.2. BUY OS ne devient pas un CRM

Le produit ne gère pas :

- un pipeline de leads ;
- la prospection ;
- les campagnes et relances commerciales globales ;
- les mandats, transactions, rémunérations ou Accords TIM ;
- un carnet d’adresses général ;
- des objectifs de conversion ou de volume d’envoi ;
- une vue managériale d’équipe.

Les informations d’identité et de contact éventuellement nécessaires restent contextuelles au projet. Elles ne justifient pas l’extension du périmètre.

## 10.3. BUY OS ne devient pas un simple formulaire

L’outil ne doit pas imposer le même questionnaire à chaque bien. Les questions proposées dépendent du projet, de l’hypothèse initiale et des inconnues capables de changer la décision.

La complétude administrative n’est pas l’objectif. Une saisie n’est obligatoire que lorsqu’elle rend la décision compréhensible ou évite une confusion de nature, de source ou de destinataire.

## 10.4. BUY OS ne devient pas un moteur autonome

Une assistance automatisée éventuelle reste facultative. Si elle est indisponible ou refusée, Mouaad doit pouvoir poursuivre toute l’instruction manuellement. Aucune automatisation future ne reçoit le pouvoir de confirmer, modifier, envoyer, supprimer ou décider.

## 10.5. BUY OS n’est pas centré sur Tomas

Un retour d’usage ou un prototype conçu pour Tomas peut nourrir l’ergonomie terrain, mais il ne définit ni le vocabulaire, ni les décisions, ni le périmètre métier de BUY OS. La V0.1 sert d’abord la pratique BUY de Mouaad.

# 11. Premier incrément recommandé

## 11.1. Choix

Construire une **tranche verticale privée et mono-utilisateur** permettant à Mouaad d’instruire manuellement une opportunité de bout en bout pour un projet acquéreur, puis d’enregistrer un retour client.

L’incrément doit prouver la boucle de décision avant toute intégration large, automatisation, import massif ou extension CRM.

## 11.2. Périmètre inclus

Le premier incrément comprend :

1. création et chargement d’un projet acquéreur minimal ;
2. cadre de décision avec conditions essentielles, préférences fortes, arbitrages ouverts, repères et éléments à confirmer ;
3. saisie du sens protégé par un critère lorsque nécessaire ;
4. ajout manuel d’une opportunité avec source, date et informations essentielles ;
5. hypothèse initiale obligatoire pour poursuivre l’instruction ;
6. classement manuel des éléments en connu, déclaré, observé, supposé ou inconnu ;
7. identification des inconnues décisionnelles ;
8. proposition de questions utiles, toutes modifiables et soumises à validation ;
9. choix humain parmi les six décisions BUY ;
10. raison, inconnues restantes et prochaine action associées à la décision ;
11. génération d’un brouillon d’explication courte, puis validation et copie manuelles ;
12. saisie d’un retour acquéreur sans effet automatique sur le projet ;
13. révision explicite d’une décision après ajout d’une nouvelle information ;
14. reprise rapide d’une instruction en cours sur le terrain.

## 11.3. Contraintes de simplicité du premier incrément

- Mouaad peut commencer une opportunité avec une référence, une source et une hypothèse, sans recopier toute l’annonce.
- Une note terrain rapide peut être ajoutée sans parcourir un dossier exhaustif.
- Les informations secondaires ne bloquent pas une décision lorsqu’elles ne peuvent pas la changer.
- La synthèse projet, l’hypothèse, les inconnues décisionnelles et la prochaine action restent accessibles au moment de décider.
- Aucun écran ne présente la complétude comme une performance.
- Aucun indicateur ne récompense le nombre de biens conservés, présentés ou visités.

## 11.4. Hors premier incrément

Sont explicitement reportés :

- CRM, prospection et relances ;
- gestion vendeur, mandat, transaction, TIM ou rémunération ;
- import automatique ou massif d’annonces ;
- synchronisation Yanport ;
- envoi automatique de messages ;
- modification automatique du projet ;
- scoring, classement ou matching automatique ;
- portail acquéreur ;
- collaboration multi-utilisateur ;
- tableaux de bord de productivité ;
- analyse autonome de photos, documents, emails ou conversations ;
- choix de base de données, architecture technique et intégrations externes.

## 11.5. Critères d’acceptation fonctionnels

Le premier incrément est acceptable si les scénarios suivants sont démontrés avec des données fictives :

1. Mouaad rattache sans ambiguïté un bien à un projet et comprend immédiatement le cadre utilisé.
2. Il ne peut pas finaliser une décision sans avoir expliqué pourquoi le bien a attiré son attention, sauf pour un écartement immédiat fondé sur une incompatibilité connue qu’il explicite.
3. Une déclaration d’annonce reste distincte d’une observation de Mouaad et d’un fait établi.
4. Une information absente reste inconnue et n’est pas affichée comme non-conformité.
5. Une inconnue décisionnelle explique pourquoi elle compte et quelle décision elle pourrait faire évoluer.
6. Les questions proposées sont reliées au projet et à une inconnue ; Mouaad peut les modifier ou les rejeter.
7. Chacune des six décisions peut être prise et révisée, avec une raison et une prochaine action adaptées.
8. Une présentation client montre le compromis et les inconnues utiles au lieu de recopier l’annonce.
9. Une visite exige que Mouaad puisse nommer ce qu’elle doit permettre de trancher.
10. Une décision reste un brouillon jusqu’à validation explicite de Mouaad.
11. L’outil ne transmet rien lors de la validation ; le partage reste une action manuelle séparée.
12. Un retour acquéreur peut produire une hypothèse d’apprentissage, mais le cadre du projet reste inchangé tant que Mouaad n’effectue pas une révision distincte.
13. Après ajout d’une nouvelle information, Mouaad peut comprendre pourquoi une décision antérieure a été révisée.
14. Le parcours reste utilisable sans aucune suggestion automatisée.

## 11.6. Validation terrain recommandée avant extension

Tester l’incrément sur plusieurs cas fictifs ou anonymisés couvrant au minimum :

- une incompatibilité essentielle connue dès le départ ;
- une exception crédible à un repère de surface ;
- des travaux dont l’ampleur change la cohérence économique ;
- une information clé absente de l’annonce ;
- une déclaration contredite par une observation ;
- un bien utile uniquement comme repère ;
- une présentation pertinente mais trop tôt pour une visite ;
- un retour ponctuel qui ne doit pas modifier le projet ;
- plusieurs retours semblables qui justifient seulement une question de confirmation.

L’extension du produit doit être décidée à partir des frictions observées dans cette boucle, pas à partir d’une volonté de couvrir plus de fonctions.

# 12. Questions ouvertes

Ces questions ne bloquent pas la rédaction de la V0.1, mais doivent être arbitrées avant ou pendant la conception du premier incrément :

1. Quel est le contenu minimal d’un projet permettant de commencer une instruction sans créer une fausse impression de compréhension ?
2. Quelles informations nécessitent une provenance et une date obligatoires, et lesquelles peuvent rester de simples notes de travail ?
3. Quel geste explicite permet à Mouaad de considérer une information comme « connue / fait établi » ?
4. Faut-il conserver « demander une information » et « approfondir » comme deux décisions nettement séparées dans tous les usages, et quel exemple frontière sert de référence ?
5. Dans quelles situations Mouaad peut-il présenter un bien alors qu’une inconnue décisionnelle demeure ouverte ?
6. Quel niveau minimal de justification est requis pour un écartement immédiat avant formulation complète de l’hypothèse initiale ?
7. Quelle longueur cible et quels tons de sortie sont utiles pour l’explication client selon le canal, sans transformer BUY OS en outil de messagerie ?
8. La version effectivement partagée au client doit-elle être simplement validée dans BUY OS ou son envoi doit-il aussi être confirmé manuellement après coup ?
9. Comment signaler un motif récurrent dans les retours sans le transformer en score, fréquence trompeuse ou nouveau critère automatique ?
10. Quel niveau de confirmation avec l’acquéreur suffit pour réviser officiellement son cadre de décision ?
11. Comment traiter une opportunité liée à plusieurs scénarios d’un même projet sans dupliquer artificiellement l’instruction ?
12. Quelles pièces ou références externes sont réellement nécessaires au premier usage terrain : lien d’annonce, photos choisies, document, note vocale ou aucune pièce ?
13. Quelles informations provenant d’un propriétaire ou d’un intermédiaire doivent être exclues d’office d’une explication client ?
14. Quelle politique de conservation, d’export et de suppression s’applique aux opportunités écartées, aux notes privées et aux retours acquéreurs ?
15. Quels critères d’usage permettront de conclure que BUY OS accélère la décision sans appauvrir le jugement de Mouaad ?

---

## Principe de clôture

BUY OS ne cherche pas à automatiser le choix d’un bien. Il organise les conditions d’un jugement humain discipliné : comprendre le projet, formuler pourquoi une opportunité pourrait compter, séparer les natures d’information, vérifier ce qui peut changer la décision, décider jusqu’où aller et expliquer pourquoi.

Toute fonction future doit pouvoir répondre à cette question :

> **Aide-t-elle Mouaad à prendre et expliquer la prochaine décision raisonnable, sans masquer l’incertitude ni décider à sa place ?**

Si la réponse est non, cette fonction n’appartient pas à BUY OS.
