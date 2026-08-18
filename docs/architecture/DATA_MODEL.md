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
11. **Une collaboration TIM n’est pas un projet client.** Elle suit des conseillers, une opération et une rémunération sans créer automatiquement un client, un mandat ou une transaction acquise.

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
| Accords TIM | `advisor_profile`, `tim_agreement`, `tim_agreement_party`, `tim_agreement_terms`, `tim_agreement_allocation`, `transaction_record`, `tim_compensation`, `tim_payment`, `tim_status_event` | collaboration inter-conseillers, termes versionnés, opération, rémunération et pilotage hors pipeline client |
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

Une personne n’a aucun rôle global « acheteur » ou « vendeur ». Les rôles vivent dans `project_party`. De même, une personne enregistrée uniquement parce qu’elle est concernée par une information TIM n’est pas, de ce seul fait, un client ou un prospect géré par Mouaad.

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

Les rôles `referrer|advisor` décrivent seulement la participation à un projet ; ils ne remplacent jamais un Accord TIM, qui porte ses propres parties, termes, états et rémunérations.

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

Extension d’un projet vendeur : situation, stratégie, configuration de workflow et statut métier extensible. Un Accord TIM n’est jamais un statut de `seller_case` et ne prouve pas que Mouaad détient le mandat.

### Entités vendeurs

- `commercialization_episode` : début/fin, canal, prix de présentation, état et raison de clôture ;
- `mandate_event` : statut observé ou confirmé, type seulement si connu, dates et source ;
- `diagnostic_record` : type de diagnostic, état, date, résultat utile et document lié ;
- `seller_signal` : vues, contacts, visites, retours, durée, source et niveau de certitude ;
- `offer` : montant, conditions, date, état et décision, avec accès restreint ;
- `visit`, `interaction`, `task` et `decision` : entités communes, pas copies vendeurs.

## 7. Accords TIM — collaboration inter-conseillers

TIM signifie « Taux Inter Mandataire ». Un Accord TIM formalise une collaboration et une répartition d’honoraires entre plusieurs conseillers SAFTI qui travaillent sur une même opportunité ou transaction. `tim_agreement` est donc un agrégat autonome : ce n’est ni un statut client, ni une étape vendeur, ni un mandat détenu par Mouaad, ni une transaction acquise.

Deux configurations métier usuelles servent de vocabulaire, pas de règles automatiques :

- `mandate_50_50` : un conseiller entre le mandat et gère le vendeur, un autre trouve et gère l’acquéreur ; partage recommandé 50 % / 50 % ;
- `information_referral_20_80` : un conseiller transmet une information qualifiée, l’autre entre le mandat, gère les clients et l’opération ; partage recommandé 20 % / 80 %.

Le cas d’usage actuellement prioritaire est l’envoi d’information 20/80. Cette orientation ne doit faire entrer dans Git ni le nombre, ni l’identité, ni les détails des accords réels. L’accord peut exister dès la transmission d’une information, avant mandat, sans bien précisément identifié et avant qu’une transaction existe.

### `advisor_profile`

Extension professionnelle facultative d’une `person` : réseau, référence conseiller facultative, statut et identité minimale utile. La présence d’un conseiller dans un accord ne lui donne aucun accès au cockpit. En V1, exactement un profil actif porte la projection privée `is_current_operator=true`, protégée par une contrainte d’unicité ; il identifie le conseiller courant sans nom codé en dur. Si plusieurs utilisateurs sont introduits, cette projection est remplacée par une association explicite acteur ↔ conseiller.

### `tim_agreement`

Champs conceptuels :

- `id` opaque ;
- `agreement_type` : `information_referral_20_80|mandate_50_50|custom` ;
- `transaction_type` : `sale|rental|other` ;
- `information_nature` : `seller|buyer|landlord|tenant|other` ;
- `source_interaction_id` et liens facultatifs explicites `subject_person_id`, `property_id`, `project_id` et `transaction_record_id` ;
- `current_agreement_status` et `current_operation_status`, toujours séparés ;
- `information_transmitted_at`, `formalized_at`, `form_signed_at` et `omega_uploaded_at` ;
- `mandate_status` projeté (`unknown|not_yet_obtained|obtained`), `mandate_obtained_at` et `mandate_reference` facultative et minimisée lorsqu’elle apporte une valeur opérationnelle ; cette projection reste cohérente avec l’historique de l’axe opération ;
- `current_terms_id`, `next_task_id`, synthèse/notes minimales utiles, dates techniques et version de concurrence.

Une personne liée uniquement comme sujet d’information reste neutre : aucun projet, `project_party`, `seller_case`, lead actif ou pipeline Clients n’est créé automatiquement. Les liens sont facultatifs et n’impliquent ni propriété du bien, ni mandat détenu, ni résultat futur.

### `tim_agreement_party`, `tim_agreement_terms` et `tim_agreement_allocation`

- `tim_agreement_party` relie un `advisor_profile` avec rôle `referrer|handling_advisor|seller_mandate_advisor|buyer_advisor|other` et une responsabilité libre obligatoire pour `other` ; `seller_mandate_advisor` représente le conseiller qui entre le mandat/gère le vendeur et `buyer_advisor` celui qui trouve/gère l’acquéreur dans un 50/50 ; plusieurs conseillers restent possibles ;
- `tim_agreement_terms` versionne assiette, devise, mode de calcul, fait générateur du paiement, conditions, date d’effet, référence facultative vers une preuve privée et raison de modification ;
- `tim_agreement_allocation` porte pour chaque version de termes et partie un pourcentage entier en points de base (`0..10000`).

`agreement_type` décrit le cadre de l’accord ; il ne calcule jamais les parts. Même un futur préréglage pour une vente reste une proposition éditable et explicitement confirmée. Les pourcentages convenus sont toujours enregistrés dans chaque version de termes. Une différence entre le nom du type et la répartition signée reste visible et doit être validée humainement.

Lorsque les allocations décrivent la totalité d’une même assiette, leur somme attendue est `10000`. Toute différence reste visible, n’est jamais corrigée silencieusement et exige un accord `custom`, une assiette/condition explicite et une validation auditée. Le choix entre contrainte bloquante et alerte reste à arbitrer avant implémentation.

Contraintes inter-entités à faire respecter par la future couche métier et, lorsque possible, par D1 :

- un accord comporte au moins deux conseillers distincts avant formalisation ;
- `information_referral_20_80` exige au moins un `referrer` et un `handling_advisor` distincts ; `mandate_50_50` exige un `seller_mandate_advisor` et un `buyer_advisor` distincts ; `custom` exige des responsabilités explicitement confirmées ; ces contrôles de rôle n’imposent jamais les pourcentages ;
- une seule allocation existe par couple `(tim_agreement_terms_id, tim_agreement_party_id)` ; la version de termes et la partie appartiennent au même accord ;
- `current_terms_id` et `next_task_id`, lorsqu’ils existent, appartiennent au même accord ;
- le bénéficiaire et la version de termes d’une compensation appartiennent au même accord que cette compensation ;
- la compensation d’un événement d’état, lorsqu’elle existe, appartient à l’accord de l’événement ;
- le type d’un `transaction_record` lié reste cohérent avec `transaction_type` ;
- la preuve d’une version de termes, lorsqu’elle existe, est autorisée et rattachée au même accord.

Pour `transaction_type=rental`, aucun pourcentage, fait générateur ou condition n’est prérempli depuis le modèle 20/80. La répartition et les conditions sont saisies manuellement pour chaque accord avant toute activation financière. Le type `information_referral_20_80` ne suffit donc jamais à établir les termes d’une location.

### `transaction_record`

Référence facultative vers une opération identifiable : type, référence externe éventuelle et date de finalisation connue. Elle n’est matérialisée que lorsqu’une opération réelle existe ; l’accord reste valide sans elle.

### `tim_compensation` et `tim_payment`

Une compensation par bénéficiaire suivi — notamment la partie correspondant au conseiller courant du cockpit — conserve :

- `current_compensation_status` ;
- `tim_agreement_terms_id`, afin de figer les termes ayant produit le calcul ou la constatation ;
- `supersedes_compensation_id` et `is_current` pour conserver les versions successives sans repointer une ligne historique ;
- `estimated_total_fees_minor` et `estimated_share_minor` ;
- `amount_due_minor`, `amount_paid_minor` et `expected_payment_at` ;
- devise, version de termes, mode de calcul, fait générateur et conditions appliqués ;
- dates techniques et version de concurrence.

Au plus une compensation est courante par couple `(tim_agreement_id, beneficiary_party_id)`. Avant constatation d’un montant dû, une révision de termes crée une nouvelle compensation liée aux nouveaux termes, supersède la précédente et déplace atomiquement cette projection ; elle ne modifie jamais le lien historique. Dès qu’un montant est dû ou qu’un paiement existe, la compensation et sa version de termes ne peuvent plus être supersédées automatiquement : une correction exige un ajustement explicite et audité, dont la mécanique exacte reste à arbitrer. Le cockpit affiche la compensation courante et conserve l’accès aux versions antérieures ; aucun ancien dû ou payé ne disparaît de ses totaux financiers.

Les montants utilisent des entiers 64 bits en unités monétaires mineures, jamais des flottants. Sans fonction de change explicitement validée, termes, compensation et paiements d’une même rémunération utilisent la même devise. `tim_payment` conserve chaque versement avec montant, date de paiement, date d’enregistrement, statut, clé d’idempotence et référence privée éventuelle ; `(tim_compensation_id, idempotency_key)` est unique. `amount_paid_minor` est la somme reconstruisible des paiements validés. Recalculer une estimation ne modifie jamais un montant réellement dû ni un paiement enregistré.

### `tim_status_event`

Événement append-only avec accord, compensation éventuelle, axe `agreement|operation|compensation`, ancien/nouvel état, date effective, date d’enregistrement, source/référence, acteur et raison. Un contrôle fermé vérifie que le code appartient à l’axe choisi. `tim_compensation_id` est obligatoire si et seulement si l’axe vaut `compensation`; il reste nul pour `agreement|operation`. Les trois projections courantes sont mises à jour atomiquement avec l’événement, restent reconstruisibles et ne se déclenchent jamais entre elles :

```text
accord       = signed
opération    = marketing_or_search_in_progress
rémunération = not_yet_due
```

États autorisés :

- accord : `to_formalize|signed|uploaded_to_omega|active|cancelled|closed` ;
- opération : `information_transmitted|contact_made|mandate_obtained|marketing_or_search_in_progress|offer_or_application_received|precontract_or_lease_signed|deed_or_rental_finalized|operation_abandoned` ;
- rémunération : `not_yet_due|estimated|due|paid|to_verify|disputed|cancelled`.

Pour éviter tout chevauchement, `not_yet_due` signifie que le fait générateur n’est pas atteint et qu’aucune estimation validée n’est portée par la compensation courante. `estimated` signifie qu’une estimation est enregistrée mais que le montant n’est toujours pas dû. `due` exige une constatation humaine du droit et du montant ; `paid` exige les paiements validés correspondants. `to_verify` signale une incertitude sur l’exigibilité ou le calcul. Ces états ne sont pas déduits d’un autre axe.

Une opération finalisée ne rend pas automatiquement une rémunération `due`, particulièrement pour une location. `paid` exige des paiements validés couvrant le montant dû ; tant que la gestion d’un paiement partiel n’est pas arbitrée, l’état reste `due` avec un solde visible.

`mandate_status` est une projection factuelle de l’historique de l’axe opération, pas un quatrième axe d’état. `mandate_status=obtained` exige un événement `mandate_obtained` ; `mandate_obtained_at` et la référence restent facultatifs si leur précision n’est pas connue.

### Documents, interactions et pilotage TIM

Le formulaire signé et son état OMEGA sont représentés par une `attachment_reference` privée : type, système externe, référence, dates et classification. `signed_at` et `omega_uploaded_at` sont des projections de preuves ou d’événements, pas deux booléens indépendants susceptibles de diverger. Ni le formulaire, ni la notice interne SAFTI ne sont placés dans Git.

`interaction`, `task` et `attachment_reference` acceptent un `tim_agreement_id` explicite sans exiger de projet. Ils ne passent pas par un couple polymorphe `target_kind/target_id`. Les notes détaillées utiles prennent la forme d’interactions datées plutôt que d’un texte libre illimité. Tout accord non terminal, ainsi que toute rémunération `due|to_verify|disputed`, possède une prochaine tâche ouverte ou apparaît dans « Accords TIM sans prochaine action ». Une interaction ou une tâche liée à un Accord TIM n’est pas présentée comme une interaction client si aucun projet client ne lui est relié.

## 8. Évaluation d’un bien pour une recherche

### `property_evaluation`

Référence : recherche, révision, bien, snapshot d’annonce éventuel, auteur, date, intérêt estimé, raison, retour client et verdict codé :

- `to_send` — à envoyer ;
- `to_verify` — à vérifier ;
- `discard` — à écarter.

Une nouvelle lecture crée une nouvelle évaluation, référence éventuellement `supersedes_evaluation_id` et marque la précédente `replaced|stale`. Elle ne la réécrit pas.

### `evaluation_factor`

Une ligne par facteur : critère/règle, résultat `met|not_met|unknown|conditional`, dur/souple, compromis demandé, point à vérifier, élément bloquant, preuve et source.

Le verdict n’est jamais un simple « aimé/refusé ». Il doit rester explicable et relié à la révision de recherche utilisée.

## 9. Visite

### `visit`

Bien, projet/recherche, date prévue/réelle, état `planned|completed|cancelled|no_show`, participants et responsable.

### `visit_observation`

Type `expectation|liked|blocker|learning|follow_up`, contenu minimal, source, auteur et date. Les attentes avant visite sont séparées du retour après visite.

Une observation peut générer une `information_proposal` ou une `decision`; elle ne change jamais directement un critère.

## 10. Interaction

### `interaction`

- type `call|email|sms|whatsapp|meeting|form|visit` ;
- contexte principal explicite : `project_id` ou `tim_agreement_id`, sans créer artificiellement l’un pour satisfaire l’autre ; une interaction de triage sans contexte métier ne peut rester orpheline que pendant une durée contrôlée ;
- personnes concernées via `interaction_participant` ;
- date effective et date d’enregistrement ;
- résumé minimal, source et sens entrant/sortant ;
- résultat et prochaine action promise ;
- liens/pièces via références contrôlées ;
- propositions d’informations extraites.

### `interaction_participant`

Personne, rôle et canal utilisé. Permet plusieurs participants sans dupliquer l’interaction.

### `attachment_reference`

URL ou identifiant privé d’un document autorisé, type, description, classification et politique de conservation. Des clés étrangères explicites permettent de le rattacher à une interaction ou à un Accord TIM ; au moins un contexte est obligatoire. D’autres contextes documentaires exigeraient une extension explicite du schéma après la V1. Pour un Accord TIM, la référence peut distinguer formulaire signé et preuve de téléchargement OMEGA sans stocker la notice interne. La V1 ne copie pas les pièces dans D1 et ne versionne jamais un chemin local privé comme lien public.

## 11. Tâche, décision et chronologie

### `task`

- contexte principal explicite `project_id` ou `tim_agreement_id`, titre/action, échéance, priorité `low|normal|high|urgent` ;
- état `todo|in_progress|waiting|done|cancelled` ;
- responsable, rappel facultatif ;
- raison d’attente et interaction promise éventuelle ;
- dates de création/fin.

Un projet ou un Accord TIM référence au maximum une tâche ouverte comme prochaine action. Le cockpit contrôle l’absence, l’échéance et les incohérences. Une tâche TIM autonome ne nécessite ni personne déclarée client, ni projet vendeur artificiel.

### `decision`

Décision humaine : projet, type, résumé, raison, contexte, source, auteur et date effective. Elle peut regrouper plusieurs événements de critères, tâches ou changements de statut.

### Chronologie

La chronologie est une projection ordonnée des interactions, décisions, événements de critères, visites, offres, tâches significatives et changements de projet. Elle n’exige pas de dupliquer tous les textes dans une table universelle.

## 12. Matching

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

## 13. Gouvernance, exports et LEVOIS Lab

### `audit_event`

Acteur, action sensible, type/id de cible, date, résultat et corrélation. Aucun payload, secret, transcription ou coordonnée en clair dans le message d’audit.

Pour les Accords TIM, l’audit couvre au minimum les modifications de termes/allocation, les transitions des trois axes, les références de formulaire ou OMEGA, les montants dus, les paiements, les annulations et les exports. Il garde les identifiants techniques et le résultat, jamais le contenu de la notice ou une copie du formulaire.

### `export_manifest`

Type (`yanport`, `obsidian`, `client_export`), périmètre, révisions, date, auteur, mode avec/sans coordonnées, empreinte et emplacement temporaire. Une URL de téléchargement est courte, privée et révocable.

### `retention_policy`

Configuration versionnée par catégorie/finalité : durée, déclencheur, délai de grâce, traitement (`delete|anonymize|review`) et base de décision. Aucune durée définitive nouvelle n’est codée sans validation.

Un inventaire associe chaque catégorie à toutes ses copies : D1 actif, Time Travel/sauvegardes, exports privés, fichiers temporaires, Resend/Formspree, boîte email et futur fournisseur IA. Il fixe responsable, TTL, capacité d’effacement et limites connues. Les sauvegardes sont chiffrées, expirent selon leur propre TTL et, après restauration, reçoivent un registre minimal non identifiant des effacements à rejouer afin de ne pas ressusciter un dossier supprimé.

Les coordonnées d’une personne uniquement transmise dans un Accord TIM suivent une catégorie de conservation distincte des dossiers clients. Leur présence doit rester justifiée par le suivi de l’accord ; elles ne sont pas réutilisées pour la prospection ni prolongées par la seule conservation comptable des montants.

### `erasure_request`

Demande, périmètre, export préalable, gel, exécution, erreurs, vérification et date de clôture. Après purge, le journal restant ne doit plus permettre de reconstituer la donnée supprimée.

### `lab_observation`

Observation produit, problème actuel, enseignement, proposition, état et références anonymisées. Par défaut, le texte ne contient ni nom, ni coordonnées, ni adresse exacte.

## 14. Architecture IA future

Le modèle réserve `ai_run`, `information_proposal`, `proposal_evidence` et `proposal_review`. La confiance IA est distincte de la certitude métier. Une proposition acceptée crée un événement humain traçable ; une proposition rejetée reste explicable selon sa politique de conservation. Voir `AI_BOUNDARIES.md`.

## 15. Pilote acquéreur fictif et anonymisé

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

## 16. Pilote vendeur fictif

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
| Accord TIM | aucun | une vente suivie directement n’implique aucun Accord TIM ; les deux agrégats restent indépendants |

Ce pilote vérifie que le modèle vendeur ne dépend pas d’une annonce existante et réutilise les interactions, visites, tâches et décisions communes.

## 17. Pilote Accord TIM fictif et anonymisé

Identifiant de démonstration : `demo-tim-sale-referral-001`. Cet exemple ne correspond à aucun accord réel et ne contient aucun nom, contact, adresse, référence de mandat ou document.

| Dimension | Valeur fictive | Modélisation |
|---|---|---|
| cadre | transmission d’une information vendeur pour une vente | `agreement_type=information_referral_20_80`, `transaction_type=sale`, `information_nature=seller` |
| conseillers | conseiller A apporteur ; conseiller B traitant | deux `advisor_profile` fictifs et deux `tim_agreement_party` ; aucun accès accordé par ce rôle |
| partage | 20 % / 80 % explicitement convenu dans cet exemple | allocations `2000` et `8000` points de base rattachées à une version de termes ; aucune déduction depuis le type |
| personne concernée | non matérialisée dans la démonstration | `subject_person_id=NULL` ; aucun client, lead ou projet créé |
| bien/projet/transaction | non identifiés | liens facultatifs nuls ; aucun mandat ou résultat déduit |
| accord | signé, téléchargement OMEGA restant à confirmer | `current_agreement_status=signed`, référence de démonstration sans document ni fichier dans Git |
| opération | information transmise | `current_operation_status=information_transmitted` |
| rémunération | estimation disponible, mais montant non encore dû | `current_compensation_status=estimated` ; cet état ne vaut jamais constatation du dû |
| estimation | honoraires fictifs 10 000 €, part apporteur fictive 2 000 € | montants mineurs et devise EUR ; estimation distincte du dû et du payé |
| prochaine action | confirmer le téléchargement OMEGA | une `task` TIM fictive, sans projet client |

Ce pilote valide qu’un accord peut être signé tandis que l’opération n’a pas encore produit de mandat et qu’aucune rémunération n’est due. Un test de contrat séparé doit vérifier qu’un accord `transaction_type=rental` ne reçoit aucune allocation, aucun fait générateur et aucune condition par défaut ; il ne constitue pas une fixture d’accord réel.

## 18. Index et projections à prévoir lors d’une phase ultérieure

Sans créer de schéma maintenant, les accès attendus imposent au minimum :

- personne par coordonnées normalisées ;
- projet par `(status, stage_key)` et prochaine action ;
- soumission par source/idempotence/statut ;
- critère courant unique par recherche/scénario/clé ;
- événements de critère par recherche/clé/date décroissante ;
- interaction par projet/date décroissante et par Accord TIM/date décroissante ;
- tâche par état/échéance et contexte projet ou Accord TIM ;
- listing par source/identifiant externe ou URL canonique ;
- snapshot par listing/date ;
- évaluation par recherche/verdict/date ;
- visite par projet/date ;
- matching par recherche/état/date ;
- Accord TIM par états accord/opération, type d’opération et prochaine tâche ;
- partie TIM par accord/rôle et conseiller ;
- version de termes et allocation par accord/date d’effet ;
- compensation TIM par bénéficiaire/état/date attendue ;
- événement TIM par accord/axe/date décroissante ;
- paiement TIM unique par compensation/clé d’idempotence et consultable par date ;
- audit par date et acteur.

Les projections de `last_contact_at`, `next_task_id`, `criterion_current`, états TIM courants, `amount_paid_minor` et compteurs cockpit doivent être reconstructibles. Une projection divergente doit être détectable par un job de cohérence, pas devenir une seconde vérité.

## 19. Arbitrages de modèle

1. échelles exactes d’importance et de flexibilité ;
2. règle humaine qui autorise `confirmed` et `hard` ;
3. gestion explicite d’un foyer ou couple ;
4. granularité de l’adresse et de la géolocalisation ;
5. taxonomie des stades de chaque projet ;
6. assiette exacte des honoraires TIM : HT, TTC, avant ou après retenues réseau ;
7. fait générateur précis d’une rémunération TIM de vente et règle de saisie pour chaque location ;
8. traitement des paiements partiels : conserver `due` avec solde ou ajouter ultérieurement un état dédié ;
9. corrections, trop-perçus, reprises de paiement et montants négatifs éventuels ;
10. condition métier exacte du passage `uploaded_to_omega` à `active` et règle de clôture ;
11. accords TIM à plus de deux conseillers et exceptions de somme pour les termes personnalisés ;
12. données minimales d’identification d’un conseiller et durée de conservation d’un contact transmis qui ne devient jamais client ;
13. stockage futur du formulaire signé : référence OMEGA seule ou coffre documentaire privé ;
14. profondeur de stockage des offres et autres informations financières ;
15. règles de fusion personnes/biens/annonces ;
16. durée des payloads d’entrée et propositions IA ;
17. événements de lecture à auditer ou non ;
18. format général des documents/liens et futur stockage de fichiers ;
19. politique de suppression des historiques et snapshots liés.
