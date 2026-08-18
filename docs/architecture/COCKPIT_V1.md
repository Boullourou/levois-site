# Cockpit privé LEVOIS — architecture V1

Statut : définition fonctionnelle et technique. Aucune route, interface ou authentification n’est créée en Phase 1.

## Mission

Le cockpit doit répondre chaque jour à trois questions :

1. qui nécessite une action maintenant ;
2. quelle est la prochaine décision utile de chaque dossier actif ;
3. quelles informations sont certaines, observées, déduites ou encore à confirmer.

Il n’est ni une boîte email améliorée, ni un CRM générique, ni une interface d’automatisation autonome. Il est la vue opérationnelle privée du modèle décrit dans `DATA_MODEL.md`.

## Décision d’architecture

### Frontière réseau recommandée

Préférence : `cockpit.levois.fr`, protégé intégralement par Cloudflare Access, avec Mouaad comme seule identité autorisée en V1.

Le même dépôt et la même D1 peuvent être utilisés. Le sous-domaine crée une frontière réseau et d’authentification lisible, mais pas une isolation de privilèges D1 : avec un binding partagé, le BFF, la sélection de champs et le découpage du code restent les contrôles effectifs. Un Worker et un binding privés séparés deviennent une option si le risque, les utilisateurs ou les droits augmentent. Si un chemin `/cockpit/*` est choisi à la place, les mêmes exigences s’appliquent aux pages et aux APIs.

```text
Internet public
   |
   +--> levois.fr --------------------------> pages et formulaires publics
   |                                                |
   |                                                v
   |                                      endpoints d’ingestion
   |                                                |
   |                                                v
   |                                         D1 centrale LEVOIS
   |
   +--> cockpit.levois.fr
            |
            v
      Cloudflare Access
            |
            v
      shell privé + BFF
            |
            v
        D1 centrale
```

Le BFF (« backend for frontend ») est la couche serveur réservée au cockpit. Le navigateur n’accède jamais directement à D1 et ne reçoit que les champs nécessaires à la vue.

### Défense en profondeur

- politique Access deny-by-default, identité Mouaad explicitement autorisée ;
- MFA via le fournisseur d’identité retenu ;
- validation serveur de la signature JWT via les JWKS Access, de l’issuer/team domain, de l’audience, de `exp`, de `nbf`, du sujet et de l’identité explicitement autorisée ; un simple header email non vérifié n’est jamais une authentification ;
- refus fermé si la configuration d’authentification manque ;
- même protection sur les previews contenant le cockpit ; toute preview non couverte par Access échoue fermée faute d’assertion valide ;
- vérification du hostname : les routes privées retournent `404` ou `403` sur le domaine public ;
- `Cache-Control: private, no-store` sur HTML et JSON privés ;
- `X-Robots-Tag: noindex, nofollow, noarchive`, meta robots, exclusion sitemap et `Disallow` en défense secondaire ;
- validation `Origin` et protection CSRF des mutations ;
- politique de contenu restrictive et échappement systématique des contenus issus d’emails, annonces ou transcriptions ;
- aucune donnée client dans les fichiers statiques, payloads de build, logs navigateur ou PostHog ;
- secrets uniquement dans les variables et bindings Cloudflare.

## Séparation des responsabilités

| Couche | Responsabilité | Ne doit pas faire |
|---|---|---|
| Cockpit UI | présenter, filtrer, recueillir une décision humaine | contenir une règle métier secrète, parler directement à D1, confirmer automatiquement |
| BFF privé | authentifier, autoriser, valider, paginer, exécuter des commandes explicites | renvoyer des objets D1 complets sans besoin, accepter un `PATCH` générique |
| Services métier | appliquer invariants, créer événements et projections cohérentes | réécrire l’historique ou transformer une proposition IA en fait |
| D1 | vérité opérationnelle, relations, historique, audit minimal | servir de stockage de secrets, audio/transcriptions brutes ou HTML public |
| Email | notifier et fournir un lien vers le dossier | devenir la copie maîtresse d’un lead |
| Obsidian/Yanport | recevoir des exports datés | modifier silencieusement D1 |

## Modèle d’autorisation V1

Un seul rôle initial : `owner` pour Mouaad.

Même avec un seul utilisateur, toutes les écritures conservent `actor_id` et `acted_at`. Cela évite de devoir reconstruire l’audit si un second utilisateur arrive plus tard.

Les futurs rôles ou filleuls sont hors V1. Le schéma peut prévoir un acteur, mais aucun accès multi-tenant ou partage de portefeuille n’est implémenté avant définition des droits.

## Vues minimales

### 1. Aujourd’hui

La page d’arrivée est une file de travail, pas un tableau décoratif.

#### Actions du jour

Tâches ouvertes dont l’échéance est aujourd’hui, triées par priorité puis heure. Afficher personne/projet, action, contexte minimal et accès au dossier.

#### Échéances dépassées

Tâches `todo|in_progress|waiting` avec `due_at < maintenant`, raison d’attente et nombre de jours de retard. Une tâche en attente n’est pas masquée.

#### Dossiers sans prochaine action

Tout projet `active` dont `next_task_id` est vide, invalide ou désigne une tâche close. Cette file est un invariant de sécurité opérationnelle.

#### Nouveaux leads non traités

`inbound_submission.status = received|needs_review`. L’action de triage permet :

- créer une personne et un projet provisoires ;
- rattacher à une personne/projet existants après choix humain ;
- classer comme doublon, spam ou hors périmètre avec raison ;
- créer la première interaction et la prochaine tâche.

#### Visites à préparer

Visites `planned` à venir dans la fenêtre configurable, sans attentes consignées ou sans tâche de préparation terminée.

#### Retours promis

Interactions ou tâches portant un engagement de réponse arrivé à échéance. La promesse est explicite ; elle ne dépend pas d’une recherche dans les emails.

#### États vides

Chaque bloc distingue : « aucun élément » de « données indisponibles ». Une panne ne doit jamais ressembler à une journée sans tâche.

### 2. Clients

Liste paginée et filtrable :

- personne ;
- type(s) de projet actif ;
- stade ;
- dernière interaction ;
- prochaine action ;
- date/retard ;
- responsable ;
- indicateurs discrets : consentement à vérifier, donnée contradictoire, lead non trié.

Filtres V1 : projet, statut, stade, responsable, action en retard, sans prochaine action et origine. La recherche textuelle couvre uniquement noms/coordonnées normalisées et synthèse autorisée ; pas de scan de pièces ou transcriptions.

### 3. Fiche client

#### Synthèse

Identité minimale, coordonnées, origine, consentements actuels par finalité, dernier contact et prochaine action.

#### Projets

Tous les projets dans le temps, leurs relations et leur état. Un achat lié à une vente reste deux projets reliés.

#### Recherche ou vente

- acquéreur : scénarios, révision courante, critères, importance, flexibilité, certitude et questions ouvertes ;
- vendeur : bien, situation, commercialisation, mandat/statut connu, diagnostics, signaux, visites et offres ;
- marqueur visible sans interprétation : **TIM: définition métier à confirmer**.

#### Chronologie

Interactions, décisions, changements de critères, visites, offres et tâches significatives, triés par date effective. Un filtre permet d’isoler les changements de décision.

#### Critères

Valeur courante et historique côte à côte. Toute action « modifier » crée un nouvel événement avec raison et source. Une valeur `inferred` ou `to_confirm` ne peut pas être présentée comme confirmée.

#### Annonces et évaluations

Biens/annonces étudiés, snapshot utilisé, facteurs respectés/non respectés/inconnus, compromis, verdict et retour client.

#### Visites

Préparation, attentes, retour, points appréciés, blocages, enseignements et propositions de critères. Aucun enseignement ne devient critère sans validation.

#### Tâches

Prochaine action mise en évidence, tâches ouvertes/terminées, échéance, priorité et rappel.

#### Documents et liens

Références contrôlées, classification et date. Aucun chemin privé local ou URL publique permanente vers un document sensible.

#### Enseignements

Observations liées au dossier qui peuvent être proposées à LEVOIS Lab après anonymisation. La copie vers le Lab n’est jamais automatique.

### 4. Recherches / biens

#### Recherches actives

Personne/projet, révision, zone, enveloppe, critères durs, inconnues, prochaine action et date de dernière mise à jour.

#### Biens étudiés

Bien, annonces/snapshots, date observée, recherches concernées, dernier verdict et points à vérifier.

#### Rapprochements

Deux types visibles : recherche ↔ bien et recherche ↔ projet vendeur. Afficher :

- révision de recherche et snapshot utilisés ;
- raisons favorables ;
- critères durs non respectés ;
- critères souples/compromis ;
- inconnues ;
- éléments bloquants ;
- état humain `draft|to_review|approved|rejected|sent|stale`.

Aucun bouton « envoyer » n’est actif tant que la validation humaine, les inconnues critiques et la fraîcheur des sources ne sont pas traitées.

#### Exports

- Yanport : aperçu des filtres de découverte et de la checklist humaine, puis export versionné ;
- Obsidian : aperçu avec/sans coordonnées, puis export Markdown audité.

### 5. LEVOIS Lab

Structure :

- observation ;
- problème actuel ;
- enseignement ;
- proposition d’amélioration ;
- état `captured|to_review|accepted|rejected|implemented` ;
- références anonymisées facultatives.

Le Lab mesure les enseignements produit, pas la performance commerciale d’une personne. Une note ne contient pas de PII par défaut.

## Commandes métier minimales

Les mutations futures sont des commandes nommées et validées :

- `triageSubmission` ;
- `createProject` / `linkProjects` ;
- `recordInteraction` ;
- `setNextTask` / `completeTask` ;
- `proposeCriterionChange` / `confirmCriterionChange` ;
- `recordListingSnapshot` ;
- `evaluateProperty` ;
- `prepareVisit` / `recordVisitFeedback` ;
- `reviewMatch` / `markMatchSent` ;
- `recordConsentEvent` ;
- `exportCase` ;
- `requestErasure` / `executeErasure`.

Chaque commande reçoit la version courante de l’agrégat. Si une autre modification a eu lieu entre lecture et envoi, elle échoue avec un conflit lisible au lieu d’écraser le travail.

## Flux opérationnels

### Triage d’un lead

```text
Soumission reçue + captures de consentement horodatées par le serveur
      |
      v
Validation + recherche de candidats doublons
      |
      +--> aucun candidat --> créer personne/projet provisoires
      |
      +--> candidat(s) -----> choix humain : rattacher ou garder séparé
      |
      v
Créer interaction initiale + rattacher les captures complètes
Les captures incomplètes restent à vérifier, jamais transformées en accord
      |
      v
Définir prochaine action ou classer avec raison
```

### Évolution d’un critère

```text
Source (appel, visite, formulaire, IA)
      |
      v
Observation / proposition
      |
      v
Revue humaine avec valeur précédente visible
      |
      +--> rejet : proposition conservée selon rétention
      |
      +--> acceptation : decision + criterion_event
                              |
                              v
                       nouvelle search_revision
                              |
                              v
                    anciens matchings deviennent stale
```

### Matching

```text
Recherche Rn + bien/seller project versionné
      |
      v
Facteurs : durs / souples / inconnus / blocages
      |
      v
Candidat à revoir
      |
      +--> rejet motivé
      |
      +--> approbation humaine --> envoi tracé
```

## Contrats de lecture

Pour limiter les scans et les fuites :

- pagination par curseur sur clients, interactions, tâches et biens ;
- champs explicitement sélectionnés par vue ;
- agrégats préchargés en une requête ou en petits lots, pas une requête par ligne ;
- index alignés sur les filtres de `Aujourd’hui` et `Clients` ;
- dates et statuts normalisés ;
- les résultats incluent `version` et `updated_at` pour détecter les écrasements ;
- les réponses ne contiennent jamais les données brutes d’intake ou les preuves complètes de consentement sans action dédiée.

## Journal des actions sensibles

À auditer au minimum :

- export avec coordonnées ;
- fusion/défusion ;
- confirmation ou invalidation d’un critère ;
- validation/envoi d’un rapprochement ;
- retrait/correction d’un consentement ;
- suppression/pseudonymisation/restauration ;
- changement de configuration ou de rôle ;
- acceptation/rejet d’une proposition IA.

Arbitrage : journaliser chaque simple lecture de fiche peut augmenter bruit et volume. Pour la V1 mono-utilisateur, journaliser les lectures d’exports et dossiers sensibles, puis décider selon le besoin réel.

## Export et suppression

### Export dossier

- sélection explicite du périmètre ;
- aperçu des coordonnées et pièces incluses ;
- génération serveur ;
- URL privée, courte et révocable ;
- manifeste et empreinte ;
- audit de l’acteur et du résultat.

### Suppression

1. inventorier les objets dépendants ;
2. proposer l’export préalable ;
3. placer le dossier en `erasure_pending` ;
4. appliquer un délai de grâce configurable ;
5. purger données métier, projections, fichiers et propositions ;
6. pseudonymiser l’audit restant ;
7. vérifier l’absence de relations orphelines ;
8. produire une preuve technique non identifiante de fin.

Le périmètre inclut D1 actif, projections, exports privés, fichiers temporaires, Time Travel/sauvegardes, Resend/Formspree, boîte email et futurs sous-traitants. L’inventaire documente ce qui peut être supprimé immédiatement, son responsable et son TTL. Après toute restauration, un registre minimal non identifiant des effacements est rejoué avant remise en service ; aucune restauration ne doit ressusciter silencieusement un dossier.

## États d’erreur et modes d’échec

| Échec réaliste | Comportement attendu | Message utilisateur | Test futur |
|---|---|---|---|
| Access absent/mal configuré | refus fermé avant toute donnée | accès refusé, sans détail client | E2E non authentifié sur HTML et JSON |
| JWT expiré | aucune mutation, retour à l’authentification | session expirée, reconnexion | test expiration et retry sûr |
| D1 indisponible | ne pas afficher un faux état vide ni confirmer une écriture ; conserver le brouillon dans la page lorsque possible et réessayer avec la même clé | données momentanément indisponibles, brouillon conservé tant que cette page reste ouverte | injection de panne lecture/écriture et fermeture de page ; sans autre stockage durable, la fermeture peut perdre le brouillon |
| version de projet obsolète | refuser l’écrasement | dossier modifié ailleurs, recharger | test de concurrence optimiste |
| double clic/retry | même résultat via clé d’idempotence | action déjà prise en compte | test deux requêtes identiques |
| projection `next_task` incohérente | signaler et remettre le dossier dans la file | prochaine action à vérifier | test de cohérence/reconstruction |
| recherche modifiée après matching | passer le matching `stale` | revoir avec les nouveaux critères | test révision Rn → Rn+1 |
| export interrompu | aucun lien partiel ; statut échoué et rejouable | export non généré | test panne milieu de génération |
| suppression partielle | garder demande ouverte, bloquer la clôture | suppression incomplète, intervention requise | test relations/fichiers en erreur |
| contenu source malveillant | afficher comme texte, jamais exécuter | contenu neutralisé ou masqué | tests XSS/prompt injection |
| API renvoie zéro ligne par erreur | distinguer panne et zéro résultat | erreur de chargement | contrat avec état `ok/empty/error` |

Aucun de ces cas ne doit échouer silencieusement.

## Performance et coût de lecture

La V1 vise un opérateur principal et des volumes modestes. Les risques viennent davantage des scans inutiles que de la concurrence :

- indexer statuts/échéances/projet/date utilisés chaque jour ;
- ne pas indexer chaque champ « au cas où » ;
- projections courantes pour les critères et prochaines actions ;
- snapshots et événements chargés à la demande ;
- chronologie paginée ;
- recherche textuelle simple seulement après besoin mesuré ;
- observer lignes lues/écrites, latence p95 et erreurs D1 avant d’ajouter un cache.

Le cache est déconseillé pour les données client en V1 : faible bénéfice, risque de fuite et invalidation plus complexe.

## Plan de tests de la future implémentation

### Contrats et unités

- règles `projet actif → prochaine action ou alerte` ;
- création d’événement sans écrasement ;
- certitudes et critères durs ;
- staleness des évaluations/matchings ;
- idempotence des commandes ;
- courses entre clôture de tâche et `next_task_id`, puis entre nouvelle révision et `current_revision_id` ;
- autorisations et sélection minimale de champs ;
- export et suppression.

### Intégration D1

- migrations sur base vierge et copie fictive ;
- clés étrangères et rollback applicatif ;
- reconstruction des projections ;
- pagination, filtres et plans de requêtes ;
- panne D1 et reprise.

### E2E privés

- aucune réponse sensible sans Access ;
- JWT falsifié, mauvais issuer/audience, et preview sans Access refusée fermée ;
- triage lead → projet → prochaine action ;
- appel → évolution critère → nouvelle révision → matching stale ;
- visite → observation → décision humaine ;
- export privé ;
- URL d’export expirée/révoquée et absente des referrers ;
- retrait de consentement et suppression.

Toutes les fixtures restent fictives et anonymisées.

## Non-objectifs V1

- multi-agence ou multi-tenant ;
- accès client au cockpit ;
- synchronisation bidirectionnelle Obsidian ;
- API Yanport ;
- scoring IA autonome ;
- ingestion automatique de boîte email ;
- stockage d’audio/transcription ;
- automatisation d’envoi sans validation ;
- BI ou géospatial avancé.

## Arbitrages avant construction

1. sous-domaine privé recommandé ou chemin protégé ;
2. fournisseur d’identité, MFA et récupération d’accès ;
3. futurs rôles éventuels ;
4. taxonomie des stades et dossier actif ;
5. règle de triage : projet brouillon automatique ou validation préalable ;
6. journalisation des simples lectures ;
7. paramètres de la fenêtre « visites à préparer » et « retours promis » ;
8. délais et priorités par défaut ;
9. inclusion des coordonnées dans les exports Obsidian ;
10. durée des liens d’export et délai de grâce avant suppression.
