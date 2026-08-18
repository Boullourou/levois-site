# Modèle de données central LEVOIS

Statut : modèle conceptuel Phase 1. Les noms sont proposés pour fixer les responsabilités ; ce document ne crée aucune table et ne constitue pas une migration SQL.

## Principes de modélisation

1. **Une personne n’est pas un projet.** La même personne peut acheter, vendre, investir, recommander ou rejoindre le réseau à des moments différents.
2. **Un bien n’est pas une annonce.** Le bien réel reste le même lorsque le portail, l’URL, le prix ou le texte changent.
3. **Une information n’est pas forcément confirmée.** Sa source, sa date, sa certitude et son éventuelle validation restent visibles.
4. **Une évolution ajoute un événement.** La valeur courante est une projection, jamais un écrasement silencieux de l’historique.
5. **Une recherche est un ensemble de scénarios cohérents.** Les exceptions conditionnelles ne sont pas aplaties dans une seule liste de critères.
6. **Un email est une notification.** Il ne remplace ni la fiche client, ni le journal, ni la tâche.
7. **Un matching est une hypothèse explicable.** Une personne le valide avant tout envoi.
8. **L’IA ne possède aucune donnée métier.** Elle dépose des propositions séparées.
9. **Les données brutes sont minimisées.** Résumé utile et référence contrôlée plutôt que copie systématique d’emails, audios ou transcriptions.
10. **L’effacement reste possible.** « Append-only » décrit le fonctionnement normal, pas une immutabilité opposable à une demande de suppression.

## Conventions communes

- identifiants opaques et non signifiants ;
- horodatages UTC ISO 8601, affichés dans le fuseau de l’utilisateur ;
- `created_at` sur toute entité, `updated_at` et `version` sur les agrégats mutables ;
- valeurs métier codées et stables, libellés français séparés ;
- `source_kind`, `source_ref` et `recorded_at` sur les faits importants ;
- `effective_at` distinct de `recorded_at` lorsqu’une information concerne une date passée ;
- aucun secret, token, audio, transcription ou donnée client réelle dans les migrations, fixtures ou Git ;
- objets JSON réservés aux formes composées réellement variables, toujours avec `schema_version` ;
- clés étrangères D1 pour les relations métier réelles ; les références polymorphes ne sont tolérées que dans le plan de contrôle transversal (audit, export, propositions), avec type fermé, identifiant obligatoire et validation d’existence/autorisation côté service.

## Vue d’ensemble des agrégats

| Agrégat | Entités principales | Responsabilité |
|---|---|---|
| Entrées | `inbound_submission`, `consent_capture`, `import_batch`, `ingestion_result`, `ingestion_mapping`, `notification_delivery` | conserver le contrat reçu, son origine, son traitement, les imports et les retries |
| Identité | `person`, `contact_method`, `consent_event`, `person_merge_event` | personne réelle, coordonnées minimales, finalités et fusions humaines |
| Projets | `project`, `project_party`, `project_relationship` | objectifs successifs, stades, calendrier, responsabilités et liens achat/vente |
| Recherche | `buyer_search`, `search_scenario`, `search_revision`, `criterion_definition`, `criterion_event`, `criterion_current` | critères versionnés, conditions, certitude et photographie opérationnelle |
| Immobilier | `property`, `listing`, `listing_snapshot`, `project_property` | bien réel, publications observées et rattachement aux projets |
| Vendeur | `seller_case`, `commercialization_episode`, `mandate_event`, `diagnostic_record`, `seller_signal`, `offer` | situation vendeur, commercialisation, diagnostics, signaux et offres |
| Qualification | `property_evaluation`, `evaluation_factor` | lecture d’un bien pour une recherche et verdict explicable |
| Terrain | `visit`, `visit_participant`, `visit_observation` | préparation, retour, blocages et enseignements d’une visite |
| Relation | `interaction`, `interaction_participant`, `attachment_reference` | appels, emails, SMS, WhatsApp, rencontres, formulaires et résumés |
| Pilotage | `task`, `decision`, projections de chronologie | prochaine action, échéances, décisions et évolution du dossier |
| Matching | `property_match`, `property_match_factor`, `seller_project_match`, `seller_match_factor` | rapprochements versionnés, facteurs et validation humaine |
| Gouvernance | `audit_event`, `export_manifest`, `erasure_request`, `retention_policy` | audit sensible, exports, suppression et conservation |
| Produit | `lab_observation` | enseignements LEVOIS sans mélanger produit et dossier client |
| IA future | `ai_run`, `information_proposal`, `proposal_evidence`, `proposal_review` | propositions, preuves, confiance et décision humaine |

Le diagramme relationnel est dans `schema-v1.mmd`.

## 1. Entrées et ingestion

### `inbound_submission`

Représente une soumission reçue avant sa qualification en personne/projet.

Champs conceptuels :

- `id`, `schema_version`, `source` (`ma_recherche`, `seller_journey`, `listing_audit`, `votre_rue`, `contact`, `legacy_import`) ;
- `source_submission_id` fourni par le navigateur lorsque disponible ;
- `correlation_id` serveur ;
- `received_at`, `processed_at` ;
- `status` : `received`, `normalized`, `needs_review`, `invalid`, `duplicate` ;
- données normalisées minimales ; payload source brut désactivé par défaut ; une version expurgée n’est conservée temporairement que si le shadow l’exige, avec TTL exécuté et supervisé ;
- mappings explicites vers les personnes, projets, recherches et interactions créés après triage ; une soumission peut contribuer à plusieurs objets ;
- erreur catégorisée sans recopier de données personnelles dans les logs.

Invariants :

- unicité `(source, source_submission_id)` lorsqu’un identifiant source existe ;
- avec une clé valide, un retry de même empreinte renvoie le même résultat logique ; la même clé avec un payload différent est refusée sans révéler la soumission existante ; sans clé côté ancien client, les doublons sont signalés mais pas impossibles ;
- une soumission ne fusionne jamais seule deux personnes ;
- un payload legacy invalide passe à `needs_review` ou `invalid`, jamais à la trappe ;
- la durée de conservation du payload temporaire expurgé est plus courte que celle des données métier normalisées et fait l’objet d’un job/rapport de purge, pas d’une simple configuration déclarative.

### `consent_capture`

Preuve immuable reçue avant tout triage : soumission, finalité déclarée, action, code de formulaire, version et empreinte du texte résolues par le serveur, heure de réception serveur et qualité `complete|evidence_incomplete|unknown`. Le navigateur ne fait autorité ni sur l’empreinte ni sur l’horodatage. Un historique incomplet reste incomplet ; il ne devient jamais rétroactivement un accord prouvé.

### `import_batch` et `ingestion_result`

`import_batch` identifie une exécution versionnée du backfill : source, version du mapper, état `running|completed|failed|inactive`, compteurs et dates. `ingestion_result` suit toute normalisation de soumission ; lors d’un backfill, il garde aussi le lot et la référence legacy, avec statut `migrated|needs_review|invalid_payload|duplicate_candidate`, code d’erreur non sensible et dates, même lorsqu’aucune cible n’a pu être créée.

### `ingestion_mapping`

Relie un `ingestion_result` réussi à ses cibles explicites : soumission, personne, projet et recherche lorsque chacune existe. L’unicité `(source, source_id, mapper_version)` et le lot associé rendent le backfill rejouable et permettent d’inactiver une version sans effacer la source.

### `notification_delivery`

Sépare la conservation de la demande de la livraison email : canal, fournisseur, statut `pending|sent|failed|abandoned`, nombre d’essais, dernière erreur catégorisée et dates. Le corps complet de l’email n’est pas nécessairement stocké.

## 2. Personne, contacts et consentements

### `person`

Une personne réelle avec le minimum utile :

- noms/prénoms si connus ;
- nom d’usage facultatif ;
- origine initiale et source de création ;
- `created_at`, `last_contact_at` comme projection ;
- état `active|archived|erasure_pending|erased` ;
- note de synthèse minimale, distincte des interactions.

Une personne n’a aucun rôle global « acheteur » ou « vendeur ». Les rôles vivent dans `project_party`.

### `contact_method`

- type `email|phone|whatsapp|other` ;
- valeur affichée, valeur normalisée, principal/non principal ;
- statut de vérification ;
- dates de première et dernière observation ;
- source.

Une coordonnée ne doit pas être globalement unique : un email ou téléphone peut être partagé par un foyer. La recherche de doublons produit une suggestion humaine.

### `consent_event`

Événement append-only par finalité :

- personne et éventuellement projet ; capture d’origine facultative mais obligatoire pour matérialiser un accord reçu depuis un formulaire public ;
- finalité codée (`deliver_reading`, `matching_alert`, `human_contact`, autre finalité validée) ;
- action `granted|withdrawn|expired` et `supersedes_event_id` pour une correction ;
- canal ;
- version et empreinte du texte présenté ;
- source, date serveur, preuve technique minimale ;
- auteur si correction manuelle.

Le consentement courant est la dernière action valide par finalité. Au triage, rattacher une `consent_capture` complète conserve sa date et sa preuve originelles ; cela ne recrée pas la preuve. Une capture `evidence_incomplete|unknown` ne produit pas `granted`. Le booléen historique `lectures_recherche.consent` ne doit jamais être transformé en trois accords granulaires.

Avant tout envoi, la commande vérifie l’état courant pour la finalité concernée. Un retrait annule les notifications en attente de cette finalité. Toute autre base autorisant exceptionnellement une communication doit être explicite, validée et auditée ; elle n’est jamais déduite du consentement.

### `person_merge_event`

Toute fusion est humaine, auditée et réversible tant que possible. Elle conserve les identifiants sources, la raison, l’auteur et les conflits détectés. Aucun rapprochement automatique sur prénom, email ou téléphone ne déclenche la fusion.

## 3. Projet

### `project`

Champs :

- `type` extensible : `primary_home_purchase`, `sale`, `linked_purchase_sale`, `investment`, `recommendation`, `recruitment`, `other` ;
- `status` transversal : `new`, `qualifying`, `active`, `paused`, `completed`, `abandoned`, `archived` ;
- `stage_key` configurable par type de projet ;
- objectif, calendrier, responsable ;
- dates importantes ;
- `next_task_id` et `last_interaction_at` comme projections reconstruisibles ;
- raison de clôture ou pause ;
- version de concurrence.

`status` répond à « le dossier est-il vivant ? » ; `stage_key` répond à « où en est-il dans ce type de projet ? ». Ils ne doivent pas être confondus.

### `project_party`

Relation plusieurs-à-plusieurs entre personnes et projets : rôle `primary`, `co_buyer`, `co_seller`, `referrer`, `advisor`, autre rôle configuré, dates de validité et source.

### `project_relationship`

Relie des projets : `depends_on_sale`, `same_life_event`, `referred_by`, autre relation validée. Exemple : l’achat dépend de la vente préalable sans fusionner les deux projets.

### Invariant de pilotage

Un projet `active` possède soit une tâche ouverte référencée comme prochaine action, soit apparaît obligatoirement dans « dossiers sans prochaine action ». Il ne doit jamais disparaître silencieusement d’une file de travail.

## 4. Recherche acquéreur et critères évolutifs

### `buyer_search`

Une recherche appartient à un projet d’achat. Elle conserve son état, son responsable, sa date d’ouverture, sa zone temporelle de référence et la révision courante.

### `search_scenario`

Les critères ne sont pas tous compatibles entre eux. Les scénarios expriment des ensembles cohérents :

- `preferred` : cible idéale ;
- `acceptable` : alternative assumée ;
- `conditional` : exception seulement si une condition est vraie.

Champs : clé de lignée, numéro de version, libellé, priorité, condition lisible, parent éventuel, statut, source et scénario remplacé. Une définition de scénario est immuable : modifier sa condition ou sa priorité ajoute une version. Exemple : « 70 m² possibles si l’agencement est excellent » est un scénario conditionnel, pas une baisse globale de la surface minimale.

### `criterion_definition`

Catalogue versionné des clés autorisées :

- `definition_id` immuable, clé stable (`property_type`, `area`, `travel_time_max`, `budget`, `surface`, `bedrooms`, `outdoor`, `works`, `dpe`, `heating`, `financing`, `prior_sale`, `horizon`, etc.) et version de schéma ;
- type `number|range|boolean|enum|geo|text|money` ;
- unité, opérateurs autorisés et règles de validation ;
- caractère sensible ;
- capacité à être utilisée en découverte ou uniquement en qualification humaine.

Le catalogue n’impose pas une colonne par critère. Il évite cependant un JSON sans contrat. L’unicité porte sur `(key, schema_version)` ; chaque événement référence la version exacte afin qu’un changement de définition ne réinterprète jamais l’historique.

### `criterion_event`

Chaque création ou évolution ajoute un événement :

- recherche et scénario ;
- version exacte de `criterion_definition` et opération `set|revise|confirm|invalidate|remove` ;
- valeur typée : bornes numériques, booléen, enum, texte ou valeur composée versionnée ;
- `importance` proposée : `essential|important|preference|contextual` ;
- `flexibility` proposée : `none|low|medium|high|unknown` ;
- `certainty` obligatoire : `confirmed|observed|inferred|to_confirm` ;
- rôle matching explicite `hard|soft|context|unknown` ;
- source, preuve/référence, auteur ;
- `effective_at`, `recorded_at` ;
- événement remplacé et décision associée.

Les quatre certitudes ne forment pas une note numérique :

- `confirmed` : explicitement validé par une personne autorisée ;
- `observed` : fait ou comportement directement constaté ;
- `inferred` : interprétation à partir d’éléments ;
- `to_confirm` : question ouverte.

Un critère `to_confirm` produit une inconnue, jamais un rejet automatique. Un critère dur exige un rôle matching explicite et une certitude compatible ; un score ne peut pas transformer une préférence en contrainte.

### `criterion_current`

Projection indexée vers le dernier événement actif pour `(search, scenario, criterion_key)`. Elle contient les valeurs typées utiles au filtrage et référence l’événement source. Elle est maintenue dans la même opération logique que l’événement et peut être reconstruite.

### `search_revision`

Photographie cohérente de tous les scénarios/critères à une date : numéro, empreinte, raison, auteur et date. Des `search_revision_item` listent explicitement chaque version immuable de scénario et chaque `criterion_event` actif ; l’empreinte seule n’est pas la photographie. Une évaluation, un export Yanport ou un matching référence toujours une révision précise. Toute modification ultérieure peut rendre ces résultats `stale` sans les supprimer.

### Exemple d’évolution sans écrasement

```text
17/08  criterion_event A
       surface = 80..100 m², scénario preferred, confirmed

05/09  criterion_event B est ajouté dans un autre scénario ; il ne remplace pas A
       surface = >=72 m² SI séjour >35 m², scénario conditional, confirmed

Historique : A et B restent visibles.
Révision R2 : A est courant dans preferred et B dans conditional.

12/09  criterion_event C supersedes B dans le même scénario conditional
       surface = >=70 m² SI séjour >35 m², confirmed

Historique : B reste visible ; C devient courant seulement dans conditional.
```

## 5. Bien et annonce

### `property`

Bien réel ou candidat de bien : type, commune, adresse partielle selon nécessité, géolocalisation arrondie si suffisante, caractéristiques stables connues et niveau de précision. Une adresse recherchée dans `/votre-rue` ne prouve ni propriété ni projet vendeur.

### `listing`

Publication : bien éventuel, portail/source, URL canonique, identifiant externe, première/dernière observation et statut `active|paused|removed|sold_claimed|unknown`. Une annonce retirée n’est pas automatiquement un bien vendu.

### `listing_snapshot`

Observation append-only datée : prix, surface, type, DPE, descriptif utile, photos comptées, commune/adresse, statut observé, source et méthode d’extraction. Un nouveau prix crée un snapshot ; il n’écrase pas le précédent.

### `project_property`

Relie un bien à un projet avec rôle `subject_of_sale|candidate_purchase|current_home|prior_sale` et dates de validité.

Déduplication : un rapprochement de biens/annonces garde sa confiance et ses raisons, mais la fusion reste humaine.

## 6. Volet vendeur

### `seller_case`

Extension d’un projet vendeur : situation, stratégie, configuration de workflow et statut métier extensible. Aucun statut spécifique n’est inventé pour TIM.

> **TIM: définition métier à confirmer**

La configuration peut réserver la clé `TIM`, désactivée et sans transition ni effet tant que Mouaad n’a pas validé sa définition.

### Entités vendeurs

- `commercialization_episode` : début/fin, canal, prix de présentation, état et raison de clôture ;
- `mandate_event` : statut observé ou confirmé, type seulement si connu, dates et source ;
- `diagnostic_record` : type de diagnostic, état, date, résultat utile et document lié ;
- `seller_signal` : vues, contacts, visites, retours, durée, source et niveau de certitude ;
- `offer` : montant, conditions, date, état et décision, avec accès restreint ;
- `visit`, `interaction`, `task` et `decision` : entités communes, pas copies vendeurs.

## 7. Évaluation d’un bien pour une recherche

### `property_evaluation`

Référence : recherche, révision, bien, snapshot d’annonce éventuel, auteur, date, intérêt estimé, raison, retour client et verdict codé :

- `to_send` — à envoyer ;
- `to_verify` — à vérifier ;
- `discard` — à écarter.

Une nouvelle lecture crée une nouvelle évaluation, référence éventuellement `supersedes_evaluation_id` et marque la précédente `replaced|stale`. Elle ne la réécrit pas.

### `evaluation_factor`

Une ligne par facteur : critère/règle, résultat `met|not_met|unknown|conditional`, dur/souple, compromis demandé, point à vérifier, élément bloquant, preuve et source.

Le verdict n’est jamais un simple « aimé/refusé ». Il doit rester explicable et relié à la révision de recherche utilisée.

## 8. Visite

### `visit`

Bien, projet/recherche, date prévue/réelle, état `planned|completed|cancelled|no_show`, participants et responsable.

### `visit_observation`

Type `expectation|liked|blocker|learning|follow_up`, contenu minimal, source, auteur et date. Les attentes avant visite sont séparées du retour après visite.

Une observation peut générer une `information_proposal` ou une `decision`; elle ne change jamais directement un critère.

## 9. Interaction

### `interaction`

- type `call|email|sms|whatsapp|meeting|form|visit` ;
- projet principal et personnes concernées ;
- date effective et date d’enregistrement ;
- résumé minimal, source et sens entrant/sortant ;
- résultat et prochaine action promise ;
- liens/pièces via références contrôlées ;
- propositions d’informations extraites.

### `interaction_participant`

Personne, rôle et canal utilisé. Permet plusieurs participants sans dupliquer l’interaction.

### `attachment_reference`

URL ou identifiant d’un document autorisé, type, description, classification et politique de conservation. La V1 ne copie pas les pièces dans D1 et ne versionne jamais un chemin local privé comme lien public.

## 10. Tâche, décision et chronologie

### `task`

- projet, titre/action, échéance, priorité `low|normal|high|urgent` ;
- état `todo|in_progress|waiting|done|cancelled` ;
- responsable, rappel facultatif ;
- raison d’attente et interaction promise éventuelle ;
- dates de création/fin.

Le projet référence au maximum une tâche ouverte comme prochaine action. Le cockpit contrôle l’absence et les incohérences.

### `decision`

Décision humaine : projet, type, résumé, raison, contexte, source, auteur et date effective. Elle peut regrouper plusieurs événements de critères, tâches ou changements de statut.

### Chronologie

La chronologie est une projection ordonnée des interactions, décisions, événements de critères, visites, offres, tâches significatives et changements de projet. Elle n’exige pas de dupliquer tous les textes dans une table universelle.

## 11. Matching

Deux relations préservent l’intégrité :

### `property_match`

Recherche + révision ↔ bien/snapshot. État `draft|to_review|approved|rejected|sent|stale`, version de logique, auteur/relecteur et dates.

### `seller_project_match`

Recherche + révision ↔ projet vendeur + version/empreinte de son état, et, lorsque disponible, bien + snapshot/faits datés. Même cycle humain. Toute évolution de cet état vendeur ou du bien rend le rapprochement `stale`.

### Facteurs

`property_match_factor` et `seller_match_factor` gardent :

- raison du rapprochement ;
- critère dur, souple ou contexte ;
- résultat `met|not_met|unknown|conditional` ;
- inconnue, compromis, blocage ;
- preuve et source ;
- niveau de donnée, pas un score de vérité.

Règles :

- un dur `confirmed` non respecté reste visible et ne peut être compensé par une moyenne ;
- une inconnue n’est jamais comptée comme un succès ;
- une révision de recherche ou un snapshot plus récent rend le candidat `stale` jusqu’à recalcul/revue ;
- `sent` exige une validation humaine auditée ;
- la V1 peut trier des candidats, pas décider automatiquement à la place de Mouaad.

## 12. Gouvernance, exports et LEVOIS Lab

### `audit_event`

Acteur, action sensible, type/id de cible, date, résultat et corrélation. Aucun payload, secret, transcription ou coordonnée en clair dans le message d’audit.

### `export_manifest`

Type (`yanport`, `obsidian`, `client_export`), périmètre, révisions, date, auteur, mode avec/sans coordonnées, empreinte et emplacement temporaire. Une URL de téléchargement est courte, privée et révocable.

### `retention_policy`

Configuration versionnée par catégorie/finalité : durée, déclencheur, délai de grâce, traitement (`delete|anonymize|review`) et base de décision. Aucune durée définitive nouvelle n’est codée sans validation.

Un inventaire associe chaque catégorie à toutes ses copies : D1 actif, Time Travel/sauvegardes, exports privés, fichiers temporaires, Resend/Formspree, boîte email et futur fournisseur IA. Il fixe responsable, TTL, capacité d’effacement et limites connues. Les sauvegardes sont chiffrées, expirent selon leur propre TTL et, après restauration, reçoivent un registre minimal non identifiant des effacements à rejouer afin de ne pas ressusciter un dossier supprimé.

### `erasure_request`

Demande, périmètre, export préalable, gel, exécution, erreurs, vérification et date de clôture. Après purge, le journal restant ne doit plus permettre de reconstituer la donnée supprimée.

### `lab_observation`

Observation produit, problème actuel, enseignement, proposition, état et références anonymisées. Par défaut, le texte ne contient ni nom, ni coordonnées, ni adresse exacte.

## 13. Architecture IA future

Le modèle réserve `ai_run`, `information_proposal`, `proposal_evidence` et `proposal_review`. La confiance IA est distincte de la certitude métier. Une proposition acceptée crée un événement humain traçable ; une proposition rejetée reste explicable selon sa politique de conservation. Voir `AI_BOUNDARIES.md`.

## 14. Pilote acquéreur fictif et anonymisé

Identifiant de démonstration : `demo-buyer-retirement-001`. Aucun nom, contact, adresse exacte ou donnée réelle.

Projet : retraite, achat de résidence principale. Recherche : bassin chartrain.

| Scénario / critère | Valeur fictive | Importance | Flexibilité | Certitude | Source fictive / remarque |
|---|---|---|---|---|---|
| préféré · type | maison privilégiée | important | low | `confirmed` | déclaration du profil de test |
| acceptable · type | bel appartement possible | important | medium | `confirmed` | alternative assumée |
| préféré · zone | Chartres et environ 15 minutes | essential | low | `confirmed` | point central fictif non adressé |
| préféré · communes exactes | à préciser | important | unknown | `to_confirm` | liste opérationnelle manquante |
| préféré · surface | 80–100 m² | important | medium | `confirmed` | cible idéale |
| conditionnel · surface | 70 m² possibles si excellent agencement | important | medium | `confirmed` pour la condition générale | la condition vit dans le scénario ; définition d’« excellent agencement » `to_confirm` |
| préféré · budget | 200–230 k€ | essential | low | `confirmed` | enveloppe indicative du pilote |
| tous · coût global | plafond frais + travaux inclus | essential | unknown | `to_confirm` | ne pas confondre prix et coût total |
| tous · DPE | F/G refusés | essential | none | `confirmed` | exclusion dure du pilote |
| tous · DPE E | acceptation inconnue | important | unknown | `to_confirm` | ne doit pas être automatiquement exclu |
| tous · travaux | travaux ciblés acceptables si coût global cohérent | important | medium | `confirmed` | seuil et types précis `to_confirm` |
| projet · vente préalable | prévue | essential | low | `confirmed` | liée à un projet vente séparé |
| projet · achat cash | volonté déclarée d’envisager du cash | contextual | medium | `confirmed` | disponibilité, montant et configurations restent `to_confirm` |
| projet · relais | envisageable en cas de coup de cœur | contextual | unknown | `to_confirm` | aucune capacité financière déduite |
| préféré · extérieur | préférence non fixée | preference | unknown | `to_confirm` | volontairement laissé ouvert |
| préféré · chambres | nombre non fixé | important | unknown | `to_confirm` | à confirmer avant export strict |
| projet · horizon | lié au projet de retraite | important | medium | `confirmed` | date exacte `to_confirm` |

### Exemple de révision

- `R1` : critères ci-dessus ; export de découverte large ;
- après une visite fictive, observation « 72 m² bien agencés semble acceptable » en `observed` ;
- validation humaine : création d’un événement conditionnel, puis `R2` ;
- les évaluations produites sur `R1` restent consultables mais passent `stale`.

## 15. Pilote vendeur fictif

Identifiant : `demo-seller-generic-001`. Bien volontairement imprécis dans le bassin chartrain, aucune identité ni adresse.

| Dimension | Valeur de démonstration | Modélisation |
|---|---|---|
| projet | vente générique en préparation | `project(type=sale)` + `seller_case` |
| bien | maison, commune et caractéristiques à confirmer | `property` partiel + `project_property` |
| situation | préparation avant mise en marché | stade configurable, source fictive |
| commercialisation | non commencée | aucun épisode actif ; pas d’annonce inventée |
| mandat/statut | non renseigné | `to_confirm`, aucun mandat déduit |
| diagnostics | DPE à organiser, autres diagnostics inconnus | `diagnostic_record` planifié + inconnues |
| signaux | aucun signal de marché disponible | absence explicite, pas zéro interprété comme échec |
| visites | aucune visite planifiée | liste vide reconnue comme état normal |
| offres | aucune offre | liste vide, aucun montant fictif |
| tâches | réunir les documents ; confirmer les diagnostics ; définir la prochaine action | tâches fictives avec une seule prochaine action |
| journal | formulaire fictif puis entretien de qualification fictif | interactions minimales sans contenu réel |
| TIM | **TIM: définition métier à confirmer** | clé de configuration réservée, sans effet |

Ce pilote vérifie que le modèle vendeur ne dépend pas d’une annonce existante et réutilise les interactions, visites, tâches et décisions communes.

## 16. Index et projections à prévoir lors d’une phase ultérieure

Sans créer de schéma maintenant, les accès attendus imposent au minimum :

- personne par coordonnées normalisées ;
- projet par `(status, stage_key)` et prochaine action ;
- soumission par source/idempotence/statut ;
- critère courant unique par recherche/scénario/clé ;
- événements de critère par recherche/clé/date décroissante ;
- interaction par projet/date décroissante ;
- tâche par état/échéance et projet ;
- listing par source/identifiant externe ou URL canonique ;
- snapshot par listing/date ;
- évaluation par recherche/verdict/date ;
- visite par projet/date ;
- matching par recherche/état/date ;
- audit par date et acteur.

Les projections de `last_contact_at`, `next_task_id`, `criterion_current` et compteurs cockpit doivent être reconstructibles. Une projection divergente doit être détectable par un job de cohérence, pas devenir une seconde vérité.

## 17. Arbitrages de modèle

1. échelles exactes d’importance et de flexibilité ;
2. règle humaine qui autorise `confirmed` et `hard` ;
3. gestion explicite d’un foyer ou couple ;
4. granularité de l’adresse et de la géolocalisation ;
5. taxonomie des stades de chaque projet ;
6. définition métier de TIM ;
7. profondeur de stockage des offres et informations financières ;
8. règles de fusion personnes/biens/annonces ;
9. durée des payloads d’entrée et propositions IA ;
10. événements de lecture à auditer ou non ;
11. format des documents/liens et futur stockage de fichiers ;
12. politique de suppression des historiques et snapshots liés.
