# Catalogue d’événements LEVOIS Agentic Company OS

Statut : architecture cible documentaire, non implémentée.

Périmètre : événements métier et de pilotage nécessaires à LEVOIS Agentic Company OS.
Autorité : D1 demeure l’autorité opérationnelle ; le cockpit est le canal d’approbation. Ce document ne crée ni table, ni queue, ni cron, ni connecteur.

## 1. État actuel et cible

### État actuel vérifié

- le cockpit V1 conserve déjà des historiques déterministes pour plusieurs changements métier, notamment les critères et les trois axes TIM ;
- les actions sensibles du cockpit sont auditées ;
- les événements PostHog décrivent l’usage du produit, pas la vérité client ;
- les formulaires publics ne produisent pas encore tous une soumission D1 centrale et idempotente ;
- aucun bus d’événements agentique, aucune file de missions et aucun agent de production ne sont actifs.

### Architecture cible

Un événement est un **fait daté déjà survenu**, émis après qu’une commande autorisée a réussi. Il n’est ni une instruction, ni une vérité inventée par un modèle. Un agent peut proposer une commande ou produire un artefact, mais une sortie IA ne publie jamais directement un événement qui modifie la vérité métier.

```text
source autorisée
      │
      ▼
commande déterministe ou action humaine validée
      │
      ├── échec : aucune émission métier
      │
      ▼
mutation atomique de l’autorité D1 + événement
      │
      ▼
projection / routage idempotent / mission éventuelle
      │
      ▼
proposition agent ──► approbation cockpit ──► nouvelle commande humaine
```

La cible vise une livraison au moins une fois. Chaque consommateur doit donc être idempotent. L’ordre global n’est jamais supposé ; seul l’ordre d’un agrégat, matérialisé par sa version, est exploitable.

## 2. Vocabulaire et catégories

| Catégorie | Préfixe logique | Contenu | Règle d’autorité |
|---|---|---|---|
| Entrée et consentement | intake/trust | activation volontaire, soumission, retrait, effacement | la preuve déterministe précède l’événement ; aucune déduction de consentement |
| Projet et relation | crm | projet, stade, interaction, tâche, promesse | changement humain ou règle déterministe autorisée |
| Recherche acquéreur | buyer | critères, annonces, propositions, retour, visite, offre | une proposition IA reste une proposition ; Mouaad confirme critères, matching et envoi |
| Vendeur et marché | seller/market | annonces, snapshots, évaluations et signaux | source et date obligatoires ; inconnue conservée comme inconnue |
| TIM et finance | tim/finance | accord, trois axes d’état, estimation, dû, paiement | axes indépendants ; dû et paiement exigent constat humain |
| Contenu et produit | growth/product | idée, validation, publication, performance, insight, erreur | analytics séparés des dossiers ; publication sensible approuvée |
| Orchestration | control | mission échouée et approbations | le control plane ne modifie jamais ses propres droits |

### Niveaux de sensibilité

L’unique enum d’autorisation est celui de `SECURITY_AND_COST_CONTROLS.md` : `PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`. `SECRET` désigne une donnée interdite dans tout événement ou contexte agentique. Les codes `S0` à `S3` ci-dessous sont seulement des abréviations de lecture de ce même enum, jamais une seconde classification sérialisée.

| Abréviation documentaire | Valeur canonique | Définition | Exemple de contenu autorisé dans l’événement |
|---|---|---|---|
| `S0_public` | `PUBLIC` | information déjà publique et non personnelle | identifiant de contenu publié, URL publique normalisée |
| `S1_internal` | `INTERNAL` | métadonnée interne sans donnée personnelle | identifiant de mission, code d’erreur, compteur agrégé |
| `S2_personal` | `CONFIDENTIAL` | donnée reliée à une personne ou un dossier | identifiants internes pseudonymes, finalité du consentement |
| `S3_restricted` | `RESTRICTED` | donnée commerciale, financière ou de confiance à accès restreint | identifiant d’offre, montant TIM en unité mineure, demande d’effacement |

Le payload ne contient jamais de nom, email, téléphone, adresse privée, corps d’email, transcription, secret, document, prompt complet ou texte d’offre. Ces éléments, lorsqu’ils sont légitimes, restent dans une source protégée référencée par identifiant.

## 3. Enveloppe canonique conceptuelle

Cette enveloppe est un contrat documentaire, pas un schéma SQL.

| Champ | Rôle | Contrainte |
|---|---|---|
| `event_id` | identifiant opaque de l’occurrence | unique, non porteur de sens métier |
| `event_name` | nom stable du catalogue | exactement l’un des noms documentés ci-dessous |
| `event_version` | version du contrat de payload | entière, incrémentée seulement pour rupture de compatibilité |
| `occurred_at` | date du fait dans la source | UTC ; distincte de la réception |
| `recorded_at` | date d’enregistrement par LEVOIS | UTC, déterministe |
| `producer` | humain, composant déterministe ou agent autorisé | identifiant stable ; jamais une chaîne libre ambiguë |
| `actor_type` / `actor_id` | auteur responsable de la commande | `human`, `system` ou `agent`; identifiant interne |
| `aggregate_type` / `aggregate_id` | périmètre métier principal | identifiants internes ; aucune coordonnée personnelle |
| `aggregate_version` | version résultante de l’agrégat | obligatoire pour les mutations ; permet la concurrence optimiste |
| `correlation_id` | relie un workflow de bout en bout | ne doit pas permettre de deviner l’identité d’une personne |
| `causation_id` | commande ou événement cause directe | empêche les boucles et explique la chaîne |
| `mission_id` | mission agentique éventuelle | absent pour une action exclusivement humaine |
| `source_type` / `source_ref` | provenance vérifiable | référence minimale ; jamais le contenu brut |
| `idempotency_key` | identité fonctionnelle de la commande | unique dans son périmètre et liée à un hash du payload utile |
| `sensitivity` | valeur canonique `PUBLIC`, `INTERNAL`, `CONFIDENTIAL` ou `RESTRICTED` | pilote filtrage, accès, journal et rétention ; les alias `S0` à `S3` ne sont jamais sérialisés |
| `payload` | faits minimaux propres à l’événement | liste fermée, versionnée, validée avant émission |
| `expires_for_action_at` | fin de validité pour déclencher une action | n’efface pas le fait historique |
| `trace_id` | corrélation technique | aucun contenu personnel |

### Invariants de l’enveloppe

1. L’événement et la mutation métier sont atomiques lorsqu’ils concernent D1.
2. Un événement ne peut pas être corrigé en place : une correction produit un événement compensatoire.
3. Une clé d’idempotence rejouée avec le même hash retourne le résultat existant ; avec un hash différent, elle échoue explicitement.
4. La source, sa date et sa version sont conservées. Une source plus récente peut rendre une proposition `stale`, jamais réécrire le passé.
5. `expires_for_action_at` limite les nouveaux déclenchements ; l’événement peut rester auditable selon sa politique de conservation.
6. Un consommateur reçoit seulement les champs autorisés pour son département et son dossier.
7. Les agents `COS-01`, `OPS-01`, `BUY-01`, `SEL-01`, `MKT-01`, `GROW-01`, `PROD-01`, `FIN-01` et `TRUST-01` accèdent à une vue filtrée par le control plane, pas à un flux global brut.

## 4. Contrats de routage

Abréviations : `DET` = composant déterministe ; `H` = Mouaad ou saisie humaine autorisée ; `CP` = control plane ; `CKP` = projection cockpit. Un « agent producteur » ci-dessous ne peut produire qu’un événement de pilotage ou un artefact non canonique. Une mutation métier reste appliquée par `DET` après l’autorisation requise.

### 4.1 Entrée, projet et opérations

| Événement | Producteur | Consommateurs | Payload minimal conceptuel | Sensibilité | Source | Clé d’idempotence | Validité d’action |
|---|---|---|---|---|---|---|---|
| `lead_received` | DET intake après persistance | OPS-01, COS-01, CKP | `lead_id`, `channel`, `purpose`, `received_at`, `triage_status` | S2 | formulaire activé, saisie cockpit ou recommandation autorisée | `source_system:source_submission_id` | jusqu’au triage ou expiration de `lead_triage_ttl` validé |
| `submission_received` | DET intake | OPS-01, BUY-01 ou SEL-01 selon parcours | `submission_id`, `journey_key`, `journey_version`, `activation_state`, `received_at` | S2 | contrat d’entrée versionné | `journey_key:client_submission_key` | jusqu’au traitement ou supersession |
| `project_created` | DET métier après commande H | OPS-01, BUY-01/SEL-01, COS-01, CKP | `project_id`, `project_type`, `status`, `stage_key`, `owner_id` | S2 | triage cockpit validé | `create_project:source_ref:project_type` | sans expiration ; projections selon version |
| `project_status_changed` | DET métier | OPS-01, BUY-01/SEL-01, COS-01 | `project_id`, `from`, `to`, `reason_code`, `effective_at` | S2 | commande cockpit approuvée | `project_id:target_version:status` | jusqu’à la transition suivante pour le routage |
| `project_stage_changed` | DET métier | OPS-01, BUY-01/SEL-01, COS-01 | `project_id`, `from_stage`, `to_stage`, `reason_code`, `effective_at` | S2 | commande cockpit approuvée | `project_id:target_version:stage` | jusqu’à la transition suivante |
| `interaction_recorded` | DET métier après saisie/import explicite | OPS-01, agent de département du dossier | `interaction_id`, `context_type`, `context_id`, `kind`, `occurred_at`, `summary_ref` | S2 | cockpit ou source explicitement importée | `source_type:source_interaction_id` | jusqu’à lecture ; faits sous-jacents gardent leur propre fraîcheur |
| `task_created` | DET métier après commande humaine autorisée | OPS-01, COS-01, agent assigné, CKP | `task_id`, `context_type`, `context_id`, `task_kind`, `due_at`, `assignee`, `origin=human` | S2 | commande cockpit de Mouaad | `context_id:human_command_id:due_at` | jusqu’à clôture/annulation/supersession |
| `task_due` | DET échéancier | OPS-01, COS-01, CKP | `task_id`, `context_id`, `due_at`, `priority` | S2 | tâche D1 ouverte | `task_id:due_at:due` | fenêtre du jour, puis `task_overdue` |
| `task_overdue` | DET échéancier | OPS-01, COS-01, CKP | `task_id`, `context_id`, `due_at`, `overdue_bucket` | S2 | tâche D1 toujours ouverte | `task_id:due_at:overdue_bucket` | jusqu’à clôture ou nouvelle échéance |
| `project_without_next_action` | DET contrôle de cohérence | OPS-01, COS-01, CKP | `project_id`, `detected_at`, `project_version`, `reason_code` | S2 | projection D1 reconstruisible | `project_id:project_version:no_next_action` | jusqu’à tâche valide ou changement d’état |
| `promise_due` | DET échéancier | OPS-01, COS-01, agent du dossier | `promise_id`, `context_id`, `promised_for`, `status` | S2 | interaction/décision validée | `promise_id:promised_for:due` | jusqu’à tenue, replanification ou annulation |

### 4.2 Acquéreur, vendeur et marché

| Événement | Producteur | Consommateurs | Payload minimal conceptuel | Sensibilité | Source | Clé d’idempotence | Validité d’action |
|---|---|---|---|---|---|---|---|
| `criterion_proposed` | DET file de propositions après BUY-01 ou H | BUY-01, OPS-01, CKP | `proposal_id`, `search_id`, `scenario_id`, `criterion_key`, `operation`, `source_ref`, `expires_at` | S2 | interaction/source figée et preuve minimale | `source_ref:criterion_key:proposal_version` | jusqu’à changement de source/recherche ou expiration |
| `criterion_changed` | DET métier après validation H | BUY-01, MKT-01, OPS-01 | `search_id`, `scenario_id`, `criterion_key`, `operation`, `certainty`, `revision_id` | S2 | décision cockpit et proposition éventuelle | `search_id:revision_id:criterion_key` | sans expiration ; résultats antérieurs deviennent stale |
| `criterion_confirmed` | DET métier après validation H | BUY-01, MKT-01, OPS-01 | `search_id`, `criterion_key`, `criterion_event_id`, `certainty=confirmed`, `revision_id` | S2 | déclaration client revue par Mouaad | `criterion_event_id:confirm` | jusqu’à nouvelle révision explicite |
| `listing_discovered` | DET import/observation manuelle | MKT-01 uniquement | `listing_id`, `snapshot_id`, `source_domain`, `observed_at` | S1 | page publique observée ou export manuel Yanport | `source_domain:source_listing_id:snapshot_fingerprint` | courte ; doit être contrôlée avant usage client |
| `listing_changed` | DET comparaison de snapshots | MKT-01, BUY-01, SEL-01 | `listing_id`, `from_snapshot_id`, `to_snapshot_id`, `changed_fields`, `observed_at` | S1/S2 | deux snapshots datés | `listing_id:to_snapshot_id:change` | jusqu’au snapshot suivant ; anciens matchings stale |
| `listing_evaluated` | DET après artefact MKT-01/BUY-01 et revue requise | BUY-01, SEL-01, MKT-01, CKP | `evaluation_id`, `listing_snapshot_id`, `project_revision_id`, `verdict`, `review_status` | S2 | sources figées et facteurs sourcés | `snapshot_id:project_revision_id:evaluation_version` | jusqu’à changement d’une entrée |
| `property_proposed` | DET après approbation H et action d’envoi séparée | BUY-01, OPS-01, CKP | `proposal_id`, `project_id`, `evaluation_id`, `channel`, `sent_interaction_id`, `proposed_at` | S2 | matching approuvé par Mouaad | `project_id:evaluation_id:approved_send_id` | jusqu’au retour, retrait ou obsolescence |
| `client_feedback_received` | DET après enregistrement H ou intake autorisé | BUY-01/SEL-01, OPS-01 | `feedback_id`, `context_id`, `subject_type`, `subject_id`, `received_at`, `structured_status` | S2 | interaction explicite | `source_type:source_feedback_id` | jusqu’à qualification ; aucun routage direct vers Croissance |
| `visit_planned` | DET après commande H | BUY-01/SEL-01, OPS-01, CKP | `visit_id`, `project_id`, `property_id`, `starts_at`, `calendar_sync_status` | S2 | cockpit ; calendrier facultatif | `project_id:property_id:starts_at` | jusqu’à visite, annulation ou replanification |
| `visit_completed` | DET après confirmation H | BUY-01/SEL-01, OPS-01 | `visit_id`, `project_id`, `completed_at`, `feedback_status`, `next_action_status` | S2 | saisie cockpit | `visit_id:completed` | jusqu’au retour structuré ; aucun routage direct vers Croissance |
| `offer_received` | DET après enregistrement H | BUY-01 ou SEL-01, OPS-01, COS-01 | `offer_id`, `project_id`, `property_id`, `received_at`, `status`, `document_ref` | S3 | interaction/document privé référencé | `source_type:source_offer_id` | selon échéance de l’offre ; aucune décision automatique |

### 4.3 TIM, finance, contenu et produit

| Événement | Producteur | Consommateurs | Payload minimal conceptuel | Sensibilité | Source | Clé d’idempotence | Validité d’action |
|---|---|---|---|---|---|---|---|
| `tim_agreement_created` | DET métier après saisie H | FIN-01, OPS-01, COS-01, CKP | `tim_agreement_id`, `agreement_type`, `transaction_type`, `agreement_status`, `next_action_status` | S3 | cockpit, information vérifiée | `create_tim:source_ref:counterparty_ref` | sans expiration ; termes versionnés séparément |
| `tim_status_changed` | DET métier après commande H | FIN-01, OPS-01, COS-01 | `tim_agreement_id`, `axis` dans `agreement` / `operation` / `compensation`, `from`, `to`, `reason_code`, `effective_at`; `tim_compensation_id` obligatoire seulement pour `compensation` | S3 | cockpit et preuve référencée | `tim_agreement_id:axis:tim_compensation_id_or_none:target_version` | jusqu’à transition suivante sur le même axe |
| `tim_payment_estimated` | DET calcul/saisie validé | FIN-01, COS-01 | `tim_compensation_id`, `terms_version`, `amount_minor`, `currency`, `estimated_at` | S3 | termes validés + hypothèse explicitée | `tim_compensation_id:terms_version:estimate_version` | jusqu’à nouvelle estimation ou constat du dû |
| `tim_payment_due` | DET après constat H, jamais simple échéancier | FIN-01, OPS-01, COS-01 | `tim_compensation_id`, `amount_due_minor`, `currency`, `due_at`, `evidence_ref` | S3 | décision cockpit et fait générateur vérifié | `tim_compensation_id:due_decision_id` | jusqu’au paiement, litige ou annulation |
| `tim_payment_received` | DET après saisie H et rapprochement | FIN-01, COS-01, CKP | `tim_payment_id`, `tim_compensation_id`, `amount_minor`, `currency`, `paid_at`, `status` | S3 | preuve/référence privée | `tim_compensation_id:payment_source_key` | sans expiration comptable selon politique validée |
| `content_idea_created` | DET après GROW-01 ou H | GROW-01, TRUST-01, COS-01 | `content_idea_id`, `target_key`, `problem_pattern_id`, `proposed_format`, `destination_ref` | S1 | insight Lab anonymisé ou décision humaine | `problem_pattern_id:angle_version` | jusqu’à revue, supersession ou expiration de `content_idea_ttl` validé |
| `content_approved` | DET après approbation H | GROW-01, TRUST-01 | `content_id`, `version`, `approved_by`, `approved_at`, `approved_channels`, `expires_at` | S1 | cockpit d’approbation | `content_id:version:approval` | jusqu’à expiration ou modification du contenu |
| `content_published` | DET après confirmation du canal ou saisie H | GROW-01, PROD-01, COS-01 | `content_id`, `version`, `channel`, `public_ref`, `published_at` | S0/S1 | canal externe vérifié ou confirmation manuelle | `channel:external_publication_id` | fait historique ; mesure selon fenêtre déclarée |
| `content_performance_updated` | DET import agrégé | GROW-01, COS-01, PROD-01 | `content_id`, `window_start`, `window_end`, `metric_set_version`, `aggregate_ref` | S1 | PostHog ou export manuel agrégé | `content_id:window_end:metric_set_version` | jusqu’au prochain calcul ; jamais donnée client |
| `product_insight_created` | DET agrégateur après revue H ou signal PROD-01/GROW-01 | PROD-01, COS-01, GROW-01 | `insight_id`, `problem_key`, `evidence_bucket`, `coarse_scope`, `confidence_kind`, `source_window_bucket` | S1 | LEVOIS Lab anonymisé, QA ou agrégats ayant passé la politique anti-réidentification | `problem_key:source_window_bucket:fingerprint` | jusqu’à décision/supersession ou expiration de `product_insight_ttl` validé |
| `website_error_detected` | DET monitoring ou saisie QA | PROD-01, COS-01, OPS-01 si impact intake | `incident_id`, `surface`, `error_class`, `first_seen_at`, `severity`, `sample_count` | S1 | monitoring sans PII ou test | `surface:error_fingerprint:time_bucket` | jusqu’à résolution/acknowledgement |

### 4.4 Confiance et orchestration

| Événement | Producteur | Consommateurs | Payload minimal conceptuel | Sensibilité | Source | Clé d’idempotence | Validité d’action |
|---|---|---|---|---|---|---|---|
| `consent_withdrawn` | DET consentement après preuve H/intake | CP/policy déterministe, TRUST-01 | `person_id`, `purpose`, `withdrawn_at`, `proof_ref`, `notice_version` | S3 | demande explicite et vérifiée | `person_id:purpose:withdrawal_source_id` | immédiate et sans expiration pour la finalité concernée |
| `erasure_requested` | DET confiance | CP/policy déterministe, TRUST-01 | `request_id`, `subject_ref`, `received_at`, `scope`, `verification_status`, `deadline_at` | S3 | demande explicite ; identité à vérifier | `request_channel:external_request_id` | jusqu’à clôture ; ne déclenche pas une suppression aveugle |
| `agent_mission_failed` | CP déterministe | COS-01, agent responsable, CKP | `mission_id`, `agent_id`, `error_code`, `failed_at`, `retry_count`, `impact_scope` | S1 ou niveau de mission | journal de mission | `mission_id:attempt_no:terminal_failure` | jusqu’à triage ou replanification |
| `approval_requested` | CP déterministe | Mouaad via CKP, COS-01, agent demandeur | `approval_id`, `mission_id`, `action_type`, `scope_hash`, `risk_level`, `expires_at` | niveau de l’action, min. S1 | artefact figé et mission | `mission_id:action_type:artifact_version` | jusqu’à expiration, changement ou décision |
| `approval_granted` | DET cockpit après action Mouaad | CP, agent demandeur, journal | `approval_id`, `scope_hash`, `granted_by`, `granted_at`, `expires_at`, `conditions` | niveau de l’action | session cockpit authentifiée | `approval_id:decision_version` | seulement pour portée, version, durée et budget approuvés |
| `approval_rejected` | DET cockpit après action Mouaad | CP, agent demandeur, COS-01 | `approval_id`, `rejected_by`, `rejected_at`, `reason_code` | niveau de l’action | session cockpit authentifiée | `approval_id:decision_version` | terminale pour cette version ; nouvelle demande = nouvel artefact |

### 4.5 Allowlist événement → type de mission

Le control plane n’interprète pas les descriptions libres des tableaux comme des permissions. Il accepte seulement les couples `event_name + event_version → mission_type + mission_version` listés ci-dessous. Un type absent signifie **aucune création de mission**. Chaque admission recontrôle dossier, finalité, fraîcheur, classification, consentement, budget, doublon et kill switch ; cette table n’accorde aucun outil ni droit de donnée. Les décisions d’approbation sont des transitions de contrôle sur une mission existante, jamais des admissions de mission supplémentaires.

| Événement(s) canoniques | Type(s) de mission autorisé(s) V1 | Agent admissible | Garde-fou supplémentaire |
|---|---|---|---|
| `lead_received` | `ops.triage.v1` | OPS-01 | un lead, une mission active, aucune création automatique de personne/projet |
| `submission_received` | `ops.triage.v1`; `buyer.intake_prepare.v1` ou `seller.intake_prepare.v1` | OPS-01 puis BUY-01/SEL-01 | type spécialisé seulement après activation et routage de parcours validés |
| `project_created`, `project_status_changed`, `project_stage_changed` | `ops.continuity_check.v1`; `buyer.case_prepare.v1` ou `seller.case_prepare.v1` | OPS-01 puis BUY-01/SEL-01 | agent métier imposé par `project_type`; mono-projet |
| `interaction_recorded`, `client_feedback_received`, `visit_completed` | `ops.followup_check.v1`; `buyer.case_prepare.v1` ou `seller.case_prepare.v1` | OPS-01 puis agent du dossier | aucun routage direct vers GROW-01; insight S1 séparé |
| `task_created`, `task_due`, `task_overdue`, `project_without_next_action`, `promise_due`, `visit_planned` | `ops.continuity_check.v1` | OPS-01 | work items agentiques exclus de `task_created` et de la projection prochaine action |
| `criterion_proposed`, `criterion_changed`, `criterion_confirmed` | `buyer.search_review.v1` | BUY-01 | une recherche/révision; aucun critère confirmé modifié automatiquement |
| `listing_discovered` | `market.freshness_check.v1` | MKT-01 | aucune référence projet dans l’événement; aucun fan-out client |
| `listing_changed` | `market.freshness_check.v1`; `buyer.listing_review.v1` ou `seller.listing_review.v1` | MKT-01 puis agent mono-dossier | mission client distincte avec snapshot/révision et permission propres |
| `listing_evaluated` | `buyer.listing_review.v1` ou `seller.listing_review.v1` | BUY-01/SEL-01 | résultat non stale et dossier unique; aucun envoi |
| `property_proposed` | `ops.followup_check.v1` | OPS-01 | proposition déjà approuvée/envoyée humainement; ne déduit aucun intérêt |
| `offer_received` | `ops.urgent_followup.v1`; `buyer.offer_brief.v1` ou `seller.offer_brief.v1` | OPS-01 puis BUY-01/SEL-01 | lecture restreinte; aucune acceptation, négociation ou réponse |
| `tim_agreement_created`, `tim_status_changed`, `tim_payment_estimated`, `tim_payment_due`, `tim_payment_received` | `tim.watch.v1` | FIN-01 | un Accord TIM; axes séparés; dû/paiement jamais inférés |
| `content_idea_created`, `content_approved`, `content_published`, `content_performance_updated` | `growth.content_prepare.v1` ou `growth.content_measure.v1` selon événement | GROW-01 | publication reste humaine; `content_approved` lié au hash courant |
| `product_insight_created` | `product.insight_triage.v1`; `growth.content_prepare.v1` | PROD-01 ou GROW-01 | uniquement insight S1 ayant passé la politique anti-réidentification |
| `website_error_detected` | `product.incident_triage.v1` | PROD-01 | logs redactés; aucun correctif/déploiement autonome |
| `consent_withdrawn` | `trust.withdrawal_review.v1` | TRUST-01 | blocage déterministe immédiat des finalités avant toute analyse |
| `erasure_requested` | `trust.erasure_case.v1` | TRUST-01 | vérification humaine, inventaire et aucune suppression automatique |
| `agent_mission_failed` | `control.failure_triage.v1` | COS-01 | une mission de reprise au plus; nouveau budget/droits interdits sans Mouaad |
| `approval_requested` | aucun type de mission | aucun | alimente seulement la file cockpit; jamais auto-approbation |
| `approval_granted` | aucune nouvelle mission ; transition atomique `waiting_approval → running` sur la mission corrélée existante | agent demandeur via CP | même hash, portée, version, budget et `restore_epoch`; transition idempotente, aucun second budget |
| `approval_rejected` | aucun type de mission | aucun | clôture; toute replanification crée une nouvelle mission corrélée |

Toute extension de cette allowlist exige version du catalogue, tests contractuels fictifs, revue TRUST-01 et validation de Mouaad. Elle ne peut être créée à la volée par COS-01 ou un agent spécialisé.

Pour `consent_withdrawn` et `erasure_requested`, aucun autre agent ne reçoit le payload S3. Le control plane applique le blocage de finalité ou de capacité ; les agents affectés n'observent qu'un refus déterministe sans identité ni preuve. Une vue agrégée de délai ou de risque destinée au briefing doit être un artefact S1 distinct, minimisé et non réidentifiant.

## 5. Garde-fous, doublons et échecs par événement

Chaque ligne explicite ce que l’événement peut lancer. « Audit » signifie au minimum `event_id`, agrégat, version, acteur, source minimale, corrélation, résultat du routage et coût technique éventuel, sans PII brute.

### 5.1 Entrée, projet et opérations

| Événement | Déclenchements autorisés | Déclenchements interdits | Audit et doublons | Comportement en cas d’échec |
|---|---|---|---|---|
| `lead_received` | mission OPS-01 de triage, alerte si non traité, briefing agrégé | création automatique de personne/projet, message sortant, enrichissement externe | audit S2 ; même clé = même lead, collision de hash bloquée | lead reste visible en intake ; triage manuel cockpit ; aucune perte au profit de l’email |
| `submission_received` | proposition de synthèse BUY-01/SEL-01 si activation valide | transformer toutes réponses en critères confirmés ou en mandat | audit S2 ; doublon rattaché à la soumission existante | formulaire conservé ; traitement manuel ; modèle indisponible n’empêche pas la lecture |
| `project_created` | tâche de prochaine action proposée, affichage Aujourd’hui | démarrer une campagne, définir un mandat ou un consentement | audit de la commande ; doublon renvoie le projet existant | transaction annulée si événement non enregistré ; reprise manuelle depuis intake |
| `project_status_changed` | recalcul déterministe des files, contrôle prochaine action | modifier implicitement stade, consentement ou TIM | version d’agrégat obligatoire ; ancien événement ignoré comme déclencheur courant | conflit = recharger ; état antérieur conservé ; Mouaad tranche |
| `project_stage_changed` | checklist/proposition d’action adaptée au stade | envoyer un message, conclure une offre, fermer automatiquement | même règle de version ; doublon sans effet | échec projection = reconstruire et signaler ; changement métier reste auditable |
| `interaction_recorded` | proposition de résumé, promesse ou critère à revoir | accepter automatiquement inférence, consentement ou engagement | référence source + hash ; import répété fusionné par clé, jamais par similarité seule | interaction brute/minimale reste accessible ; saisie manuelle et extraction différée |
| `task_created` | échéancier, file Aujourd’hui, projection de prochaine action si la commande le précise | communication externe, changement de stade implicite ou conversion d’un work item agentique | origine humaine visible ; doublon exact sans seconde tâche | création atomique ou aucun événement ; tâche manuelle de secours |
| `task_due` | rappel interne, briefing, priorité de file | email/SMS client automatique | occurrence par échéance ; plusieurs livraisons marquées traitées | tâche reste visible par requête D1 même si routage en panne |
| `task_overdue` | escalade interne graduée, briefing | replanification ou clôture automatique | bucket évite le bruit ; jamais dupliquer quotidiennement sans changement utile | cockpit calcule aussi le retard à la lecture ; suivi manuel |
| `project_without_next_action` | alerte et work item de proposition OPS-01 | inventer une prochaine action comme vérité ou considérer un artefact agentique comme correction | une occurrence par version ; clôture seulement après tâche métier humaine valide | anomalie visible par requête déterministe ; Mouaad crée/classe la tâche |
| `promise_due` | rappel prioritaire et proposition de préparation | message sortant automatique ou marquer « tenue » | dédoublage par promesse/échéance | promesse reste consultable ; fallback calendrier ou revue manuelle |

### 5.2 Acquéreur, vendeur et marché

| Événement | Déclenchements autorisés | Déclenchements interdits | Audit et doublons | Comportement en cas d’échec |
|---|---|---|---|---|
| `criterion_proposed` | file de revue ligne par ligne | modifier `criterion_current`, confirmer en masse les sensibles | preuve et version source ; proposition identique supersédée/dédoublée | proposition expirée ou `stale`; Mouaad saisit directement le critère |
| `criterion_changed` | nouvelle révision, invalidation des évaluations/matchings dépendants | envoi d’annonce ou changement d’autres critères implicite | événement append-only ; même révision non rejouée | si projection échoue, la reconstruire ; matching bloqué jusqu’à cohérence |
| `criterion_confirmed` | veille cadrée, suppression du statut à confirmer | transformer une interprétation en déclaration ou outrepasser contradiction | auteur humain et source obligatoires | rester `to_confirm` si preuve/validation absente ; poser la question en appel |
| `listing_discovered` | contrôle de fraîcheur MKT-01 ; une analyse client exige ensuite une mission mono-projet créée séparément par le control plane | diffuser des identifiants de projets, affirmer disponibilité, contacter propriétaire ou client | fingerprint de snapshot ; doublons rattachés à une annonce sans fusion risquée | conserver observation partielle ; saisie/import manuel ; pas d’analyse si source inaccessible |
| `listing_changed` | rendre évaluations dépendantes `stale`, proposer une revue | conclure que prix/état est exact ou envoyer la modification | liste de champs, deux snapshots ; même snapshot ignoré | comparaison indisponible = statut à vérifier ; consultation humaine de la source |
| `listing_evaluated` | file Mouaad, facteurs explicables | validation finale ou envoi automatique | entrées/version/logique auditées ; évaluation identique réutilisable si non stale | artefact rejeté/expiré ; analyse humaine avec révision et snapshot côte à côte |
| `property_proposed` | attendre retour, créer rappel interne borné | assimiler envoi à intérêt, visite ou offre | interaction d’envoi confirmée ; double canal non déduit | doute sur envoi = statut à vérifier ; Mouaad consulte le canal et corrige |
| `client_feedback_received` | proposition d’évolution de critère dans le dossier ; signal séparé vers l’agrégateur déterministe du Lab | routage direct vers GROW-01, changement silencieux de recherche, publication d’une citation | source et transformation anonymisée auditées séparément | retour reste interaction ; Mouaad qualifie manuellement |
| `visit_planned` | préparation de visite, rappel interne, brouillon calendrier | réserver/confirmer auprès d’un tiers sans Mouaad | occurrence par créneau ; replanification = nouvel événement | calendrier absent = cockpit seul et confirmation humaine |
| `visit_completed` | demander/structurer le retour ; signal séparé vers l’agrégateur déterministe du Lab | routage direct vers GROW-01, déduction de satisfaction, offre ou nouveau critère | confirmation humaine ; doublon exact ignoré | visite reste « retour à saisir » ; compte rendu manuel |
| `offer_received` | tâche urgente, préparation de lecture, approbation prioritaire | accepter/refuser/négocier, conseil juridique, réponse externe | audit renforcé S3, référence privée, version ; aucune fusion probabiliste | incident escaladé immédiatement à Mouaad ; traitement manuel hors agent |

### 5.3 TIM, finance, contenu et produit

| Événement | Déclenchements autorisés | Déclenchements interdits | Audit et doublons | Comportement en cas d’échec |
|---|---|---|---|---|
| `tim_agreement_created` | tâche de formalisation, contrôle des champs à confirmer | créer un client/mandat, appliquer automatiquement un ratio 20/80 ou 50/50 | audit S3 ; correspondance manuelle, pas de déduplication probabiliste | accord reste `to_formalize`; suivi manuel dans vue TIM |
| `tim_status_changed` | contrôle prochaine action sur l’axe concerné | modifier les deux autres axes, déduire mandat/dû/paiement | ancien/nouveau/raison et version audités | conflit de version bloqué ; Mouaad recharge et saisit la transition correcte |
| `tim_payment_estimated` | revue budget/prévision et échéance de vérification | devenir `due`, écraser un dû ou paiement validé | termes/version/calcul audités ; estimation suivante supersède sans effacer | état `to_verify`; calcul manuel et conservation de l’ancienne estimation |
| `tim_payment_due` | tâche de suivi prioritaire, alerte finance | paiement, relance externe ou modification d’accord | preuve de constat et approbateur audités ; doublon exact ignoré | rester `to_verify` si source insuffisante ; Mouaad/compétence comptable tranche |
| `tim_payment_received` | recalcul déterministe du solde, clôture proposée | inventer référence, modifier accord, déclencher paiement inverse | idempotence forte par source paiement + hash ; collision bloquée | statut à rapprocher ; aucun `paid` automatique en cas d’incohérence |
| `content_idea_created` | recherche d’angle, brouillon et contrôle TRUST-01 | production/publication sans problème source ni destination | provenance Lab anonymisée ; idées proches restent distinctes ou fusionnées humainement | idée reste en backlog ; Mouaad peut la classer sans agent |
| `content_approved` | préparation/publication dans périmètre approuvé | modifier le texte, canal ou CTA après approbation | hash de version et portée ; toute modification expire l’approbation | retour `waiting_approval`; publication manuelle possible après nouvelle revue |
| `content_published` | mesure, contrôle de destination/CTA | créer une preuve de demande ou attribuer un lead sans source | identifiant externe ; confirmation manuelle si connecteur absent | statut « publication à vérifier » ; contrôle humain sur le canal |
| `content_performance_updated` | comparaison agrégée, hypothèse GROW-01 | modifier dossier client, conclure causalité individuelle | fenêtre/version ; upsert idempotent de la projection, événement immuable | métrique marquée manquante/stale ; aucun contenu relancé sur donnée incomplète |
| `product_insight_created` | qualification, ticket proposé, revue produit | déploiement, accès aux événements S2 sources ou collecte supplémentaire de PII | seuil d’agrégation, rareté et anonymisation audités ; aucune date, localité fine ou combinaison réidentifiante | insight conservé `to_confirm`; observation manuelle |
| `website_error_detected` | incident PROD-01, contrôle intake et escalade | accès aux logs bruts PII ou déploiement autonome | fingerprint/bucket ; occurrences agrégées sans masquer gravité | mode manuel, alerte Mouaad ; les soumissions persistées restent la référence |

### 5.4 Confiance et orchestration

| Événement | Déclenchements autorisés | Déclenchements interdits | Audit et doublons | Comportement en cas d’échec |
|---|---|---|---|---|
| `consent_withdrawn` | blocage déterministe de la finalité, inventaire des campagnes/brouillons | effacer obligations légales, déduire d’autres finalités, continuer le marketing | audit S3 restreint ; retrait répété confirme l’état sans dupliquer | priorité maximale ; suspension prudente manuelle si propagation incertaine |
| `erasure_requested` | vérification, inventaire, gel des traitements non nécessaires, file TRUST-01 | suppression irréversible automatique, effacement financier aveugle | audit séparé et accès restreint ; doublon rattaché après vérification humaine | escalade immédiate ; procédure manuelle documentée et suivi d’échéance |
| `agent_mission_failed` | retry autorisé, replanification, fallback humain, briefing si impact | boucle infinie, augmentation de budget/droits, exposition du contenu d’erreur | code nommé, tentative et coût ; une terminale par tentative | CP arrête ou isole ; cockpit reste utilisable manuellement |
| `approval_requested` | affichage dans file Mouaad et rappel interne | exécution avant décision, approbation par email/SMS ou auto-approbation | scope/hash/version/budget audités ; demande identique réutilisée, modifiée = nouvelle | expiration sûre ; mission `waiting_approval`; action manuelle possible hors agent |
| `approval_granted` | reprise de la seule action figée dans sa portée | délégation, action différente, budget supérieur, version modifiée | identité/session/conditions auditées ; consommation idempotente | incohérence ou expiration = ne rien exécuter et redemander |
| `approval_rejected` | clôture de la mission avec raison `rejected`; une correction crée un nouvel artefact et une nouvelle demande dans une mission non terminale | exécuter quand même, reformuler silencieusement pour contourner ou rouvrir une mission terminale | raison codée, décision terminale pour l’artefact | mission `completed(reason=rejected)` ou `cancelled`; toute replanification crée une nouvelle mission corrélée |

## 6. Politique commune de doublons, ordre et échec

### Doublons

1. Le producteur applique la clé d’idempotence avant émission.
2. Le consommateur conserve son propre marqueur `(consumer_id, event_id)`.
3. Même clé et même empreinte : retour du résultat antérieur, aucune nouvelle action.
4. Même clé et empreinte différente : `IDEMPOTENCY_CONFLICT`, quarantaine et revue humaine.
5. Deux sources différentes mais ressemblantes ne sont jamais fusionnées automatiquement pour une personne, un bien, une offre ou un Accord TIM.

### Ordre et fraîcheur

- `aggregate_version` inférieur à la version déjà traitée : fait conservé, déclenchement courant ignoré comme ancien ;
- version manquante : événement en quarantaine pour les mutations métier ;
- saut de version : pause du consommateur sur cet agrégat, recharge D1 et reconstruction ;
- changement de révision/snapshot : propositions, évaluations, approbations et drafts dépendants passent `stale` ou expirent ;
- une date de portail ou de document ne remplace jamais `observed_at` et `recorded_at`.

### Échec de livraison ou de consommateur

```text
événement D1 enregistré
        │
        ├── routage réussi ──► accusé idempotent
        │
        └── routage échoué
                │
                ├── retry borné si action interne réversible
                ├── quarantaine si contrat/version invalide
                └── alerte + fallback cockpit si délai dépassé
```

- aucun retry automatique d’envoi externe, paiement, suppression, consentement, matching final ou transition sensible ;
- la file morte conserve des identifiants et codes d’erreur, jamais le payload personnel complet ;
- une panne du routage ne retire jamais les tâches, dossiers et approbations des vues déterministes du cockpit ;
- le kill switch arrête les consommateurs agentiques, pas les opérations manuelles de lecture et de mise à jour autorisées.

## 7. Compatibilité, évolution et audit

- les contrats d’événements sont versionnés ; un consommateur inconnu refuse une version majeure plutôt que de deviner ;
- un renommage crée une période de compatibilité documentée, jamais deux événements métier contradictoires ;
- la rétention suit le type de donnée et la base de conservation, pas une durée universelle inventée ;
- les métriques conservent des compteurs agrégés et anonymisés ; les journaux techniques sont redactés ;
- chaque chaîne événement → mission → proposition → approbation → commande conserve `correlation_id` et `causation_id` ;
- une suppression autorisée produit un journal minimal de preuve, mais n’expose pas la donnée supprimée ;
- le catalogue doit être relu avec la matrice d’autorité avant toute implémentation.
- un lint contractuel refuse tout `event_name` absent des 39 contrats canoniques et tout couple événement→mission absent de l’allowlist 4.5 ; un artefact ou `mission_type` ne peut jamais occuper `event_name`.

## 8. Tests contractuels futurs — hors de cette phase

1. rejouer deux fois chaque événement sans doubler les effets ;
2. refuser une collision de clé avec payload différent ;
3. prouver qu’une proposition agent ne modifie aucune vérité métier ;
4. rendre stale toute dépendance d’une révision ou d’un snapshot remplacé ;
5. maintenir l’indépendance des trois axes TIM ;
6. prouver qu’un retrait de consentement bloque immédiatement la finalité concernée ;
7. continuer à afficher les tâches et approbations quand agents ou connecteurs sont arrêtés ;
8. vérifier que les logs, files d’erreur et métriques ne contiennent aucune PII brute ;
9. vérifier qu’une approbation expirée ou dont le hash diffère ne peut être consommée ;
10. reconstruire les projections depuis les faits canoniques sans utiliser un cache agent comme autorité.
11. refuser chaque pseudo-événement d’artefact et chaque route événement→mission non allowlistée.
