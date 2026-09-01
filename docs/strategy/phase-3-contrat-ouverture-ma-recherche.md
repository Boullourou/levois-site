# LEVOIS — Contrat d’ouverture de la Phase 3 — `/ma-recherche`

**Statut du contrat :** **VALIDÉ** le 31 août 2026.

**Statut de la Phase 3 :** **OUVERTE LE 1er SEPTEMBRE 2026 — SPÉCIFICATION FONCTIONNELLE EN COURS**.

**Portes franchies :** P0 déployé en Production au SHA `01a561fb955df75d4c9cf1bd5d2239f27344745a` avec smoke tests réussis ; socle Git Phase 3 créé depuis ce SHA et limité aux documents stratégiques validés.

Ce contrat définit le premier périmètre fonctionnel pressenti de la Phase 3. Il n’autorise ni code, ni maquette visuelle, ni direction artistique, ni modification distante, ni travail BUY OS ou CRM.

## 1. Périmètre exact

### Inclus dans la V1

- spécification fonctionnelle complète de `/ma-recherche` ;
- achat d’une résidence principale ;
- acquéreur au stade de l’idée, de la veille, des visites, du bien identifié ou de l’offre ;
- clarification de la situation, des usages, des contraintes et des arbitrages ;
- dépendance éventuelle de l’achat à une vente, sans construire un parcours vendeur ;
- première lecture avant coordonnées, correction des réponses et choix explicite de la suite ;
- sortie facultative « Recevoir ma synthèse », spécifiée séparément de « Demander un échange » ;
- états avec et sans JavaScript, erreurs, indisponibilité d’un service et réponses incomplètes.

### Exclus de la V1

- investissement, même léger : entrée et futur parcours distincts ;
- lecture chiffrée personnalisée du marché ou conclusion automatisée fondée sur les DVF ;
- estimation, conseil fiscal, rendement locatif ou calcul de rentabilité ;
- recherche d’annonces, recommandation automatique de biens ou matching ;
- validation bancaire ou certification d’une capacité d’achat ;
- estimation ou organisation de la vente du logement actuel ;
- nouveau parcours vendeur ;
- compte, CRM, espace client ou suivi permanent ;
- développement simultané des deux ressources pilotes ;
- code, interface finale, maquette visuelle et direction artistique.

Les pages locales et `/votre-rue` peuvent être proposées comme ressources complémentaires. Leurs données ne servent pas à conclure automatiquement sur la faisabilité du projet acquéreur. Une future contextualisation locale exige une instruction séparée et une valeur démontrée.

## 2. Décisions acquises qui ne sont pas rouvertes

- URL conservée : `/ma-recherche` ;
- résidence principale comme périmètre du parcours ;
- sept étapes métier obligatoires ;
- usages avant typologie et surface ;
- chaque réponse modifie une branche, une reformulation ou la restitution ;
- une absence de sélection ne signifie jamais qu’un critère est flexible ;
- valeur complète avant coordonnées ;
- réponses corrigibles avant transmission ;
- synthèse et demande d’échange distinctes ;
- aucun appel automatique ;
- aucun diagnostic certain ou verdict de faisabilité ;
- aucune PII ni réponse personnelle dans l’analytics ;
- investissement traité par une entrée séparée ;
- aucun compte ni stockage distant avant une action explicite de transmission.

## 3. Les sept étapes validées

| Étape | Objectif fonctionnel |
|---|---|
| **1. Niveau d’avancement** | Distinguer idée, veille, visites, bien identifié et offre. Ne pas confondre avancement réel et horizon temporel. |
| **2. Situation et logement actuel** | Comprendre l’occupation actuelle et la situation propriétaire, locataire, hébergée ou temporaire, sans adresse ni valeur du logement. Identifier une éventuelle dépendance à une vente seulement pour un propriétaire. |
| **3. Amélioration attendue** | Identifier ce que l’achat doit réellement changer dans le quotidien, avec possibilité d’incertitude ou d’explication libre encadrée. |
| **4. Usages avant typologie** | Faire émerger activités, pièces, moments de friction, trajets, rangement, extérieur ou évolutions de vie avant de traduire ces usages en type et surface. |
| **5. Cadre de réalité** | Organiser zone, nature des contraintes, trajets, budget, financement, horizon, type et surface. Distinguer contrainte vérifiée, préférence et hypothèse, sans produire de lecture chiffrée personnalisée du marché. |
| **6. Arbitrage utile** | Confronter deux scénarios concrets et comparables, proposer « aucun des deux » et demander la raison du choix. |
| **7. Lecture avant coordonnées** | Produire la restitution en quatre blocs, permettre sa correction, puis présenter séparément consultation, envoi éventuel et demande d’échange. |

## 4. Embranchements nécessaires

- **Investissement détecté :** sortie explicite vers une destination distincte, sans poursuivre le parcours résidence principale.
- **Propriétaire :** demander si l’achat dépend d’une vente — oui, non ou incertain — sans demander adresse ni valeur.
- **Non-propriétaire :** ne jamais afficher la branche de vente préalable.
- **Bien identifié ou offre :** orienter la lecture vers les informations concrètes restant à vérifier.
- **Exploration ou veille :** privilégier clarification des usages et scénarios.
- **Contrainte géographique :** distinguer commune, trajet, personne ou service à rejoindre.
- **Financement incertain :** conserver l’incertitude ; ne produire aucune validation de budget.
- **Typologie incertaine :** autoriser « je ne sais pas encore » et conserver plusieurs hypothèses.
- **Tension réelle détectée :** choisir un arbitrage adapté aux réponses, pas systématiquement localisation contre surface.
- **Autre, aucun ou cela dépend :** prévoir une voie cohérente sans forcer un choix faux.

## 5. Rôle du traducteur en direct

Après chaque réponse, LEVOIS doit :

1. reformuler uniquement ce que la personne a déclaré ;
2. expliquer ce que cette réponse change dans la suite ;
3. indiquer son niveau de certitude ;
4. signaler ce qui ne peut pas encore être déduit ;
5. poser une précision seulement si elle modifie une branche ou la restitution ;
6. mettre à jour la lecture provisoire sans produire de conclusion prématurée.

Le traducteur ne félicite pas artificiellement, ne note pas le projet et ne répète pas simplement la réponse.

## 6. Restitution adaptative en quatre blocs

| Bloc | Contenu autorisé |
|---|---|
| **Ce que votre achat doit changer** | Améliorations et usages explicitement déclarés. |
| **Ce que vous voulez préserver** | Éléments identifiés comme essentiels ou importants. |
| **Ce que vous pourriez assouplir** | Uniquement les compromis explicitement acceptés ou envisagés ; jamais les critères non sélectionnés. |
| **Ce qu’il reste à décider ou vérifier** | Incertitudes, informations manquantes, scénarios non testés et prochaine vérification concrète. |

Chaque bloc varie réellement selon les réponses. Un bloc sans preuve reste vide ou indique que l’information manque ; il ne reçoit pas de contenu générique.

## 7. Niveaux de certitude et limites

| Niveau | Formulation de référence |
|---|---|
| **Fait déclaré** | « Vous avez indiqué que… » |
| **Conséquence directement établie** | « Cela change… » |
| **Interprétation probable** | « Cela semble indiquer… » |
| **Hypothèse fragile** | « Cela pourrait signifier… » |
| **Absence de conclusion** | « Impossible à conclure pour l’instant. » |

La V1 ne transforme ni budget, surface, zone ni typologie en verdict de faisabilité. Les données locales éventuellement proposées en ressource restent extérieures au raisonnement personnalisé de la restitution.

## 8. Correction avant transmission

- une revue complète précède toute transmission ;
- chaque réponse peut être modifiée ;
- une modification invalide ou recalcule les réponses dépendantes ;
- aucune ancienne conclusion incompatible ne reste affichée ;
- la restitution actualisée est visible avant confirmation ;
- retour, progression et correction fonctionnent au clavier et sans JavaScript ;
- rien n’est transmis tant que la personne n’a pas choisi explicitement une action.

## 9. Séparation entre synthèse et demande d’échange

Trois sorties restent distinctes :

1. **Consulter ma synthèse** : aucune coordonnée, aucun envoi.
2. **Recevoir ma synthèse** : transmet la synthèse à l’adresse email choisie par la personne et ne crée pas automatiquement une demande adressée à Mouaad.
3. **Demander un échange** : affiche avant confirmation la liste exacte des informations qui seront envoyées à Mouaad.

Aucune information n’est transmise silencieusement d’une finalité à l’autre.

Les canaux publics confirmés sont l’appel et le SMS au `07 81 38 01 21`, ainsi que l’email à `mouaad@levois.fr`. Plusieurs modalités de premier échange sont possibles et sont convenues avec Mouaad selon la situation et ce qui convient aux personnes concernées. Aucune durée fixe, aucun délai de réponse, aucune adresse d’accueil, aucun horaire et aucune disponibilité permanente ne sont annoncés.

La sortie « Recevoir ma synthèse » fait partie de la spécification fonctionnelle. Son activation dans la première version publiée reste conditionnée à :

- un envoi réellement fonctionnel ;
- une confirmation de livraison non trompeuse ;
- une information claire sur les données utilisées ;
- l’absence de création automatique d’une demande commerciale ;
- l’alignement de la politique de confidentialité.

Si ces conditions ne sont pas satisfaites, consultation et correction restent accessibles sans coordonnées, mais le bouton d’envoi n’est pas affiché.

## 10. Confidentialité, accessibilité et fonctionnement sans JavaScript

- aucun compte ;
- aucun stockage distant avant transmission explicite ;
- collecte limitée aux informations nécessaires à l’action choisie ;
- aucune réponse, coordonnée ou texte libre dans PostHog ;
- couche publique d’entrée et d’explication de `/ma-recherche` potentiellement indexable ;
- réponses, états et restitutions personnelles jamais indexables ni exposés dans une URL ;
- aucune réponse personnelle dans le sitemap, les données structurées ou un HTML public ;
- politique de cache privée ou `no-store` pour la restitution personnelle, selon l’architecture finale ;
- version sans JavaScript permettant de répondre, revenir, corriger, consulter le résultat et choisir une sortie ;
- formulaires transmis en POST, jamais en GET ;
- libellés explicites, ordre de tabulation, focus visible, résumé d’erreurs et progression accessible ;
- JavaScript utilisé comme amélioration, jamais comme condition d’accès à la réponse essentielle ou à la valeur.

## 11. Cas de test et critères d’acceptation

| Cas | Critère d’acceptation |
|---|---|
| Locataire au stade de l’idée | Aucune question sur une vente préalable ; usages avant typologie. |
| Propriétaire dont l’achat dépend d’une vente | Dépendance identifiée sans adresse, valeur ni parcours vendeur. |
| Propriétaire incertain | L’incertitude reste visible dans le quatrième bloc. |
| Bien déjà identifié | Les vérifications portent sur ce bien sans produire de verdict d’achat. |
| Typologie inconnue | Le parcours accepte l’incertitude et ne force pas maison ou appartement. |
| Budget approximatif | Aucun message de faisabilité ou de budget « validé ». |
| Arbitrage A/B/aucun | Chaque choix produit une conséquence et une restitution différentes. |
| Modification d’une réponse initiale | Branches dépendantes et synthèse sont actualisées sans contenu obsolète. |
| Entrée investissement | Sortie distincte ; aucune absorption dans la résidence principale. |
| Sans JavaScript | Parcours complet, correction et résultat fonctionnels ; aucune donnée dans l’URL. |
| Consultation seule | Aucune coordonnée, transmission ou création de lead. |
| Réception de synthèse | Envoi à l’adresse choisie, confirmation réelle, aucun appel et aucune demande à Mouaad. |
| Demande d’échange | Liste exacte des informations affichée avant confirmation ; aucune transmission silencieuse depuis la finalité de synthèse. |
| Échec serveur | Aucun faux succès ; reprise expliquée et réponses préservées localement lorsque possible. |
| Analytics | Événements de progression sans réponses, texte libre ni PII. |
| Accessibilité | Parcours réalisable au clavier et compréhensible avec lecteur d’écran. |
| Couche publique | Contenu d’entrée indexable sans exposition des états ou résultats personnels. |
| Restitution privée | Absence dans URL et cache partagé ; politique privée ou `no-store` vérifiée. |

## 12. Arbitrages restant ouverts pendant la spécification

1. destination exacte de l’entrée investissement ;
2. champs exacts transmis lors d’une demande d’échange ;
3. durée de conservation et procédure de suppression des données volontairement transmises ;
4. architecture exacte entre couche publique indexable et résultat privé.

Ces sujets doivent être tranchés avant implémentation ou publication. Ils ne bloquent pas la validation du présent contrat.

## 13. Ordre futur obligatoire

1. valider le présent contrat ;
2. valider la Preview P0 ;
3. valider le socle Git exact ;
4. ouvrir la Phase 3 par la spécification fonctionnelle complète de `/ma-recherche` seule ;
5. stabiliser parcours, questions, embranchements, restitutions, états, accessibilité et confidentialité ;
6. conserver les apprentissages éditoriaux des deux ressources pilotes comme références de conception, sans les développer simultanément ;
7. produire trois territoires de direction artistique radicalement différents ;
8. faire choisir un territoire par Mouaad ;
9. discipliner le territoire choisi sans perdre son idée forte ;
10. engager seulement ensuite l’implémentation complète.

Les correctifs P0 restent indépendants. La priorité future des deux ressources pilotes n’est pas remise en cause.

## État de la porte

- **CONTRAT D’OUVERTURE DE PHASE 3 : VALIDÉ**
- **PHASE 3 : OUVERTE — SPÉCIFICATION FONCTIONNELLE DE `/MA-RECHERCHE`**
- **P0 PRODUCTION : DÉPLOYÉ ET VALIDÉ — `01a561fb955df75d4c9cf1bd5d2239f27344745a`**
- **SOCLE GIT PHASE 3 : VALIDÉ — BRANCHE DOCUMENTAIRE DÉDIÉE**
- **DIRECTION ARTISTIQUE : NON COMMENCÉE**
