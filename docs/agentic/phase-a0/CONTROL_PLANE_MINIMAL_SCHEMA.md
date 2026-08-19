# Schéma conceptuel minimal du control plane — Phase A0

Statut : **contrat documentaire pour une future Phase A1 ; aucune table, migration, route ou donnée n'est créée ici**.

Date de cadrage : **2026-08-19**.

Décideur : **Mouaad**.

Périmètre : `OPS-01` en shadow mode, `COS-01` minimal, puis compatibilité explicite avec un futur `BUY-01` sans l'activer. D1 reste l'unique autorité opérationnelle.

## 1. Décision de taille

La future Phase A1 devrait ajouter **cinq tables persistantes de control plane**, et pas davantage :

1. `agent_mission` — contrat et état courant d'une mission ;
2. `agent_trace` — journal append-only, tentatives, sources, résultats, coûts, approbation éventuelle et erreurs ;
3. `agent_control_switch` — kill switches global, agent et capacité ;
4. `agent_ops_shadow_finding` — constats déterministes non souverains de `OPS-01` ;
5. `agent_cos_briefing_item` — lignes ordonnées du briefing déterministe de `COS-01`.

Ce nombre est une **estimation de préparation**, pas une autorisation de migration. Il est volontairement inférieur au schéma général décrit dans `CONTROL_PLANE.md` : le besoin A1 ne justifie ni table d'objectif, ni sous-tâche, ni dépendance, ni queue, ni lease dédiée, ni registre dynamique d'agents, ni budget séparé, ni artefact générique, ni approbation générique.

Trois structures non persistantes complètent ces tables :

- `OpsSnapshotV1`, projection de lecture minimisée issue des tables métier et des calculs existants de `getToday()` ;
- `OpsCoverageV1`, diagnostic de complétude des sept règles ;
- `BriefingViewV1`, rendu privé résolu à la lecture par le cockpit.

Elles sont des contrats fermés, pas un framework de plugins. Un futur `BUY-01` réutilisera seulement l'identité, le cycle, la trace, le budget et les switches ; sa sortie typée sera conçue lorsque son incrément sera autorisé.

## 2. Ce schéma ne duplique pas le métier

Les objets `project`, `task`, `interaction`, `tim_agreement` et les autres agrégats restent exclusivement dans le modèle métier D1 existant. Les cinq futures tables :

- ne contiennent aucune personne, coordonnée, note libre, transcription, adresse, montant TIM, document ou secret ;
- ne portent aucun champ `next_task_id`, stade, statut client, consentement, matching, offre, mandat ou paiement ;
- ne servent jamais à décider si un dossier est réellement à jour ;
- conservent une preuve datée de ce qu'une règle a observé sur une version ;
- sont entièrement ignorables par les parcours manuels du cockpit.

Un `agent_ops_shadow_finding` n'est donc pas une anomalie métier courante. C'est le résultat non souverain d'une mission sur un snapshot. Avant composition puis avant affichage, sa fraîcheur est revalidée. La vue déterministe « Aujourd'hui » reste le fallback et la référence opérationnelle manuelle.

## 3. Flux de données fermé

```text
 D1 métier existante
 project / task / interaction / tim_agreement / vues getToday()
           │
           │ lecture SQL allowlistée, champs minimisés, aucune écriture
           ▼
   OpsSnapshotV1 + watermark
           │
           │ ops.shadow_scan.v1 — règles déterministes
           ▼
 agent_ops_shadow_finding ───────► agent_trace
           │                            ▲
           │ lecture par COS seulement │
           ▼                            │
 cos.daily_briefing.v1                  │
 déduplication + ordre total            │
           │                            │
           ▼                            │
 agent_cos_briefing_item ───────────────┘
           │
           │ contrôle du watermark, résolution privée des libellés
           ▼
 Cockpit : 0 à 7 priorités + compteur d'éléments omis

 Aucun arc de retour vers une table métier.
 Un échec sur tout le chemin agentique laisse le cockpit manuel inchangé.
```

`COS-01` ne relit pas les dossiers. Il reçoit les constats OPS encore frais. Le cockpit peut résoudre un identifiant opaque en alias visible uniquement après authentification et uniquement au moment du rendu.

## 4. Contrats non persistants

### 4.1 `OpsSnapshotV1`

Le composant déterministe de lecture construit une photographie cohérente avec :

| Groupe | Champs conceptuels |
|---|---|
| Identité | `snapshot_id`, `schema_version`, `as_of`, `operational_watermark`, `source_hash` |
| Couverture | disponibilité et version de chaque famille projet, tâche, promesse, triage éventuel, TIM et échéance TIM |
| Projet | identifiant opaque, statut, version, présence d'une prochaine tâche ouverte valide |
| Tâche | identifiant opaque, contexte opaque unique, statut, `due_at`, priorité source, `is_next_action`, `promised_from_interaction_id` opaque éventuel, version |
| Promesse | identifiant d'interaction opaque, contexte opaque, date structurée, résolue ou non, référence et version |
| Triage éventuel | identifiant opaque, signal canonique `untriaged`, date et version ; famille absente au cadrage |
| TIM | identifiant opaque, statut d'accord, version, présence d'une prochaine tâche ouverte valide |
| Échéance TIM | identifiant opaque, accord opaque, type fermé, `due_at`, état, version |

Les noms, emails, téléphones, textes de tâche, résumés d'interaction, parties TIM, allocations, montants et documents sont exclus. Une famille indisponible vaut `not_evaluated`, jamais « aucun résultat ».

Le `operational_watermark` doit être monotone et varier dès qu'une ligne susceptible de modifier les sept règles change. Sa forme technique sera choisie en A1 ; le contrat exige seulement qu'il soit stable pour une même photographie, comparable et accompagné d'un `source_hash` calculé sur la projection minimisée triée.

### 4.2 `OpsCoverageV1`

Une ligne logique par règle conserve : `rule_id`, `rule_version`, `evaluation_status` (`evaluated|not_evaluated|failed`), nombre de lignes lues, nombre de constats, et code d'erreur redacté éventuel. Ce diagnostic est versé dans `agent_trace`; il n'exige pas de table dédiée.

### 4.3 `BriefingViewV1`

La vue contient : date métier, watermark, état de fraîcheur, nombre total de groupes admissibles, nombre retenu, nombre omis, puis 0 à 7 items. Elle ne complète jamais artificiellement une journée calme jusqu'à trois éléments.

## 5. `agent_mission`

### 5.1 Responsabilité

Une ligne est l'état courant compact d'une mission. L'historique complet reste dans `agent_trace`. Deux types seulement sont admis en A1 :

| `mission_type` | `agent_id` imposé | Capabilities imposées |
|---|---|---|
| `ops.shadow_scan.v1` | `OPS-01` | `ops.read_snapshot`, `ops.evaluate_rules` |
| `cos.daily_briefing.v1` | `COS-01` | `cos.read_ops_results`, `cos.deduplicate`, `cos.rank`, `cos.compose_briefing` |

`BUY-01` peut être une valeur connue de l'enum d'identité, mais aucune paire mission/capability A1 ne l'autorise. Une mission `BUY-01` reste donc inadmissible jusqu'à une nouvelle décision et un contrat typé.

### 5.2 Champs conceptuels

| Groupe | Champs | Règle |
|---|---|---|
| Identité | `mission_id`, `mission_type`, `contract_version`, `agent_id` | opaques ou enums fermés ; paire type/agent fixe |
| Objectif | `objective_code`, `objective_text` | texte issu d'un patron fermé, sans saisie client libre |
| État | `status`, `priority`, `close_reason`, `version` | transition optimiste, aucune réouverture terminale |
| Déclencheur | `trigger_kind`, `trigger_ref`, `triggered_by_actor_id` | A1 : `manual` uniquement ; COS conserve aussi la mission OPS terminée dans ses champs source |
| Source | `source_kind`, `source_ref`, `source_version`, `source_hash`, `snapshot_id`, `operational_watermark`, `as_of` | OPS pointe vers le snapshot ; COS vers la mission OPS |
| Idempotence | `idempotency_key`, `input_hash`, `correlation_id`, `causation_id` | même clé et même hash retourne la mission ; hash différent refuse |
| Temps | `created_at`, `planned_at`, `started_at`, `finished_at`, `timeout_at`, `heartbeat_at` | UTC serveur ; `timeout_at` fini obligatoire avant `planned` |
| Exécution | `attempt_no`, `execution_epoch`, `restore_epoch`, `control_fingerprint` | une tentative fixture ; contrôle de résultat tardif et kill switch |
| Budget logique | `budget_schema_version`, `budget_limits`, `usage_actual` | compteurs fermés et finis ; absence ou valeur non positive refuse l'admission |
| Coût monétaire | `monetary_cost_state`, `cost_actual_minor`, `currency_code` | A1 vaut `not_applicable`, aucun outil tarifé autorisé ; pas de devise inventée |
| Résultat | `result_kind`, `result_schema_version`, `result_hash`, `result_total_count`, `result_selected_count`, `result_omitted_count` | lignes détaillées dans les tables typées ; hash obligatoire au succès |
| Erreur | `error_code`, `error_stage`, `error_detail_code` | namespace `CP_*`, aucun message ou payload personnel |
| Politique | `policy_version`, `autonomy_level`, `retention_policy_ref`, `fixture_only` | `autonomy_level=L0` et `fixture_only=true` tant que les gates réelles restent fermées |

`budget_limits` et `usage_actual` sont des objets à schéma fermé, limités aux compteurs `source_rows`, `rule_evaluations`, `findings`, `briefing_items` et `trace_entries`. Aucun poids convertible en argent n'est inventé. Le plafond effectif est vérifié avant chaque lot borné.

### 5.3 Contraintes

- `mission_id`, `idempotency_key` et la paire `(mission_type, contract_version)` sont non nuls.
- `agent_id` doit correspondre exactement à la matrice ci-dessus.
- `autonomy_level` vaut exactement `L0`; toute autre valeur est hors contrat A1.
- `fixture_only=false` est refusé tant que les gates D-007, D-008, D-009, D-013, D-014 et D-018 exigées ne sont pas levées.
- `timeout_at`, le budget logique, le `policy_version` et le fingerprint des switches sont obligatoires avant `planned`.
- `result_hash` est obligatoire pour `completed`; `error_code` ou une raison de clôture l'est pour `failed|cancelled`.
- `result_selected_count` est compris entre 0 et 7 pour COS et égale le nombre de lignes de briefing.
- une mission terminale ne change plus, sauf ajout de traces techniques qui ne modifient pas son résultat.

## 6. `agent_trace`

### 6.1 Responsabilité

`agent_trace` est le ledger append-only minimal. Il remplace dans A1 des tables séparées de tentative, coût, événement source et approbation. Une mission est reconstructible sans consulter un log fournisseur.

### 6.2 Champs conceptuels

| Groupe | Champs |
|---|---|
| Ordre | `trace_id`, `mission_id`, `sequence_no`, `occurred_at` |
| Corrélation | `correlation_id`, `causation_id`, `source_event_type`, `source_event_ref`, `source_event_version` |
| Auteur | `actor_kind`, `actor_id`, `agent_id` éventuel |
| Entrée | `entry_kind`, `attempt_no`, `execution_epoch`, `restore_epoch` |
| Transition | `from_status`, `to_status`, `reason_code` |
| Idempotence | `idempotency_key`, `payload_hash` |
| Résultat | `result_kind`, `result_ref`, `result_hash`, `outcome_code` |
| Coût | `logical_usage_delta`, `monetary_cost_state`, `cost_delta_minor`, `currency_code` |
| Approbation | `approval_ref`, `approval_outcome` — toujours nuls pour les deux missions A1 |
| Erreur | `error_code`, `error_stage`, `error_detail_code` |
| Sécurité | `policy_version`, `control_fingerprint`, `redaction_version` |

Valeurs A1 de `entry_kind` :

```text
source_observed
mission_created
mission_transitioned
attempt_started
rule_coverage_recorded
finding_recorded
briefing_composed
logical_cost_recorded
approval_referenced
error_recorded
switch_applied
mission_closed
```

`approval_referenced` existe pour conserver l'« approbation éventuelle » du contrat général, pas pour introduire un moteur d'approbation. En A1, aucune mission autorisée n'attend ni ne consomme une approbation pour produire un effet.

### 6.3 Invariants d'audit

- unicité `(mission_id, sequence_no)` et de `idempotency_key` ;
- ordre strict croissant par mission ;
- aucune mise à jour ni suppression par le service agentique ;
- toute transition courante de `agent_mission` possède une trace correspondante ;
- toute tentative commence par `attempt_started` et finit par `mission_closed` ou une erreur terminale visible ;
- tout finding et tout briefing item possède une trace avec référence et hash ;
- chaque delta de coût est non négatif ; un ajustement éventuel utilise un événement compensatoire nommé, jamais un écrasement ;
- aucune trace ne contient de texte métier libre, de PII, de montant TIM ou de secret.

La reconstruction suit : source → création → transitions → tentative → règles → résultat → coût → erreur ou clôture. Une discordance entre état courant et trace est `CP_RECONCILIATION_REQUIRED`; la mission ne peut pas être présentée comme réussie.

## 7. `agent_control_switch`

### 7.1 Clés et champs

| Champ | Contrat |
|---|---|
| `switch_id` | identifiant opaque |
| `scope_kind` | `global`, `agent` ou `capability` uniquement |
| `scope_key` | `global`, `COS-01`, `OPS-01`, ou capability allowlistée |
| `state` | `enabled` ou `stopped` |
| `version` | concurrence optimiste, strictement croissante |
| `restore_epoch` | invalide les travaux antérieurs après restauration |
| `reason_code` | motif fermé, sans note client |
| `decided_by_actor_id` | sujet Access opaque de Mouaad, jamais son email dans le journal |
| `decided_at` | heure serveur UTC |
| `idempotency_key`, `payload_hash` | même commande rejouée sans double effet ; collision refusée |

Unicité : `(scope_kind, scope_key)`. Une ligne absente vaut **`stopped`**, jamais `enabled`.

### 7.2 Calcul d'autorité

Une étape est autorisée seulement si les trois switches applicables sont présents et `enabled` :

```text
global
  AND agent:<agent_id>
  AND capability:<capability_id>
```

Le `control_fingerprint` de mission hash les versions de ces lignes. Avant assignation, avant chaque lot de lecture/règles, avant toute écriture de résultat et avant affichage, le service compare ce fingerprint. Une version différente arrête la mission.

### 7.3 Effet du kill switch

Une commande authentifiée de Mouaad :

1. passe le switch ciblé à `stopped` avec contrôle de version ;
2. invalide le fingerprint et l'`execution_epoch` des missions concernées ;
3. fait passer toute mission non terminale concernée à `cancelled`, `close_reason=kill_switch` ;
4. écrit les traces de switch et de clôture ;
5. empêche toute publication d'un résultat tardif.

Le chemin de lecture et les commandes manuelles du cockpit ne consultent pas cette table et restent disponibles. Une réactivation est une nouvelle commande de Mouaad, auditée ; elle ne rouvre jamais une mission annulée.

## 8. `agent_ops_shadow_finding`

### 8.1 Champs conceptuels

| Groupe | Champs |
|---|---|
| Identité | `finding_id`, `mission_id`, `observation_fingerprint` |
| Règle | `rule_id`, `rule_version`, `reason_code`, `reason_template_version` |
| Portée | `scope_kind`, `scope_id`, `subject_id` éventuel |
| Liaison structurée | `link_kind`, `link_ref` éventuels |
| Source | `source_ref`, `source_version`, `snapshot_id`, `operational_watermark`, `source_hash` |
| Temps | `detected_at`, `as_of`, `due_at` éventuel |
| Proposition | `proposed_priority`, `suggested_action_code`, `suggested_action_template_version` |
| Preuve | `evidence_code`, `evidence_hash`, `schema_version` |

Les règles possibles sont exactement les sept IDs de `OPS01_SHADOW_SPEC.md`. `proposed_priority` utilise `low|normal|high|urgent`. Les textes visibles sont rendus depuis des patrons versionnés ; aucun résumé client libre n'est stocké.

### 8.2 Clés et invariants

- clé étrangère vers une mission `ops.shadow_scan.v1` appartenant à `OPS-01` ;
- unicité `(mission_id, observation_fingerprint)` ;
- empreinte stable sur règle, portée, sujet et condition matérielle, jamais sur un nom ;
- `scope_kind` fermé à `project|tim_agreement|triage_signal` ;
- `subject_id` peut référencer une tâche, promesse ou échéance, avec validation applicative de son appartenance au scope ;
- `link_kind` est fermé à `promise_task|tim_deadline_task`; `link_ref` est un identifiant opaque issu d'une relation structurée explicite, et les deux champs sont soit nuls, soit présents ensemble ;
- deux findings ne sont reliés que si leur `link_kind`, leur `link_ref` et leur scope sont identiques ; aucun lien n'est déduit d'un texte, d'un alias ou d'une proximité de date ;
- seules les détections positives sont insérées ; `not_evaluated` et erreurs de couverture vont dans `agent_trace` ;
- aucune colonne de statut courant, d'acquittement ou de prochaine action : la ligne ne pilote pas le métier ;
- un résultat stale reste explicable historiquement mais ne peut plus alimenter un briefing courant.

## 9. `agent_cos_briefing_item`

### 9.1 Champs conceptuels

| Groupe | Champs |
|---|---|
| Identité | `briefing_item_id`, `mission_id`, `source_ops_mission_id`, `rank` |
| Groupe | `group_fingerprint`, `scope_kind`, `scope_id`, `finding_refs` |
| Ordre | `priority_bucket`, `due_at` éventuel, `source_priority`, `tie_breaker` |
| Explication | `primary_rule_id`, `why_now_code`, `explanation_template_version` |
| Action | `suggested_action_code`, `suggested_action_template_version` |
| Fraîcheur | `snapshot_id`, `operational_watermark`, `source_result_hash`, `created_at` |
| Intégrité | `schema_version`, `item_hash` |

`finding_refs` est une liste JSON fermée, triée, sans doublon, d'identifiants opaques appartenant à la même mission OPS et au même scope. Cette liste bornée évite une sixième table de liaison. Toute évolution vers des volumes qui la rendraient inadéquate devra être mesurée avant de modifier le schéma.

### 9.2 Contraintes

- mission parente obligatoirement `cos.daily_briefing.v1` et `COS-01` ;
- source OPS obligatoirement `completed`, fraîche et de même watermark ;
- `rank` entier de 1 à 7 ; unicité `(mission_id, rank)` et `(mission_id, group_fingerprint)` ;
- un seul item par `(scope_kind, scope_id)`, toutes les raisons distinctes restant dans `finding_refs` ;
- ordre total conforme à `COS01_MINIMAL_SPEC.md`, indépendant de l'ordre SQL ;
- aucune insertion si le watermark a changé ; la mission COS devient `cancelled`, raison `stale_source` ;
- le nombre omis est calculé par différence entre groupes admissibles et items persistés, et enregistré dans `agent_mission`/`agent_trace` ; aucun dossier n'est déclaré absent parce qu'il dépasse sept.

## 10. Cycle de mission A1

Le schéma conserve les statuts canoniques validés :

```text
draft, planned, assigned, running,
waiting_input, waiting_approval,
completed, failed, cancelled
```

Les deux missions A1 utilisent seulement ce sous-ensemble :

```text
                      contrat invalide / budget absent
                                  ┌──────────────► failed
                                  │
draft ──► planned ──► assigned ──► running ──────► completed
  │          │            │           │
  └──────────┴────────────┴───────────┴──────────► cancelled
                   kill switch / stale / décision Mouaad
```

`waiting_input` et `waiting_approval` restent des valeurs canoniques mais sont inadmissibles pour `ops.shadow_scan.v1` et `cos.daily_briefing.v1`. Leur présence n'autorise aucune capacité supplémentaire.

Conditions principales :

| Transition | Conditions obligatoires |
|---|---|
| `draft → planned` | type/agent allowlistés, source complète, timeout explicite, budget logique fini, fixture gate valide |
| `planned → assigned` | switches global, agent et chaque capability actifs ; fingerprint scellé |
| `assigned → running` | `execution_epoch` acquis sur la ligne mission, tentative et trace créées |
| `running → completed` | sortie typée validée, résultat et coût tracés, watermark encore valide |
| non terminal → `failed` | erreur terminale nommée, aucune sortie publiée |
| non terminal → `cancelled` | kill, stale, supersession ou ordre explicite de Mouaad |

Une mission terminale n'est jamais rouverte. Une reprise crée un nouvel ID, une nouvelle clé de corrélation, un nouveau snapshot, un nouveau budget et une nouvelle trace.

## 11. Idempotence et déduplication

### 11.1 Mission OPS

Clé conceptuelle :

```text
ops.shadow_scan.v1:<snapshot_id>:<source_hash>:<policy_version>
```

Le même input retourne la même mission. Même clé avec autre hash : `CP_IDEMPOTENCY_CONFLICT` et aucun résultat.

### 11.2 Mission COS

Clé conceptuelle :

```text
cos.daily_briefing.v1:<business_date>:<ops_result_hash>:<policy_version>
```

Un `GET` cockpit ne crée jamais de mission. La date ne suffit pas : un nouveau snapshot exige une nouvelle mission corrélée.

### 11.3 Findings et briefing

- finding : déduplication exacte par `(mission_id, observation_fingerprint)` ;
- COS : appliquer les trois passes fermées de `COS01_MINIMAL_SPEC.md` — fingerprint exact, même fait structuré explicitement lié, puis regroupement par `(scope_kind, scope_id)` ;
- briefing : un item par groupe, maximum sept ;
- ordre total canonique : `proposed_priority` (`urgent`, `high`, `normal`, `low`), classe de signal, `due_at`, `detected_at`, puis scope et fingerprint opaques ;
- une similarité de libellé ne fusionne jamais deux scopes.

### 11.4 Switch

Même clé de commande et même payload retourne l'état existant. Même clé avec autre état ou portée est refusée. Le silence de Mouaad ne crée jamais une transition.

## 12. Budget, timeout et erreurs

### 12.1 Default fermé

- budget logique absent, nul, négatif ou non borné : mission refusée ;
- timeout absent ou non fini : mission refusée ;
- capability payante, réseau ou modèle demandée : mission refusée ;
- retry automatique A1 : **zéro** ;
- nombre de tentatives fixture : **une** ;
- les valeurs quantitatives de test sont injectées par chaque fixture et ne deviennent pas des defaults de données réelles.

Une invalidation stale suivie d'un nouveau scan est une nouvelle mission, pas un retry caché.

### 12.2 Codes A1

Le sous-ensemble utile du registre canonique est :

```text
CP_CONTRACT_INVALID
CP_PERMISSION_DENIED
CP_SCOPE_VIOLATION
CP_SOURCE_STALE
CP_SOURCE_EMPTY
CP_UPSTREAM_UNAVAILABLE
CP_IDEMPOTENCY_CONFLICT
CP_VERSION_CONFLICT
CP_BUDGET_EXCEEDED
CP_TIMEOUT
CP_RESULT_INVALID
CP_PII_POLICY_VIOLATION
CP_KILL_SWITCH_ACTIVE
CP_DEPENDENCY_FAILED
CP_RECONCILIATION_REQUIRED
```

`CP_RETRY_EXHAUSTED` ne devrait pas apparaître avec zéro retry ; il reste réservé au namespace global. Les erreurs de fournisseur, prompt injection ou résultat externe sont hors A1 puisqu'aucun modèle, source libre ou connecteur n'est autorisé.

## 13. Index conceptuels

Ces index seront confirmés par plans de requête sur fixtures ; ils ne sont pas des migrations :

| Structure | Index ou unicité envisagé | Usage |
|---|---|---|
| `agent_mission` | unique `mission_id` ; unique `idempotency_key` | création et rejeu sûr |
| `agent_mission` | `(status, agent_id, created_at)` | arrêt des missions actives et vues de santé |
| `agent_mission` | `(mission_type, finished_at)` | dernier scan/briefing terminé |
| `agent_mission` | `(source_ref, source_version, status)` | staleness et corrélation |
| `agent_trace` | unique `(mission_id, sequence_no)` ; unique `idempotency_key` | reconstruction ordonnée |
| `agent_trace` | `(occurred_at, entry_kind)` | audit et incidents |
| `agent_control_switch` | unique `(scope_kind, scope_key)` | contrôle constant et versionné |
| `agent_ops_shadow_finding` | unique `(mission_id, observation_fingerprint)` | déduplication exacte |
| `agent_ops_shadow_finding` | `(mission_id, scope_kind, scope_id)` | regroupement COS |
| `agent_cos_briefing_item` | unique `(mission_id, rank)` | rendu ordonné |
| `agent_cos_briefing_item` | unique `(mission_id, group_fingerprint)` | un item par dossier |

Les index des tables métier restent ceux du cockpit. A1 ne les modifie pas « pour l'agent » sans mesure et migration distincte.

## 14. Command/write boundary

### 14.1 Deux façades, aucun SQL libre

La future implémentation sépare :

```text
OpsShadowReader
  └─ SELECT allowlistés sur projections métier minimisées
     aucune méthode insert/update/delete

AgentControlStore
  └─ commandes nommées sur les cinq tables agentiques
     aucune référence de table métier
```

Les fonctions déterministes `OPS-01` et `COS-01` reçoivent des objets typés. Elles ne reçoivent ni binding D1, ni builder SQL, ni nom de table, ni callback générique d'écriture. Seul le control plane enveloppe et valide leurs résultats avant persistance.

Les futures commandes se limitent conceptuellement à créer/faire progresser une mission allowlistée, écrire une trace, sceller un finding/item et changer un switch sur ordre de Mouaad. Aucune commande métier existante n'est appelable depuis ces composants.

### 14.2 Résidu de séparation D1

Une D1 colocalisée et un binding serveur partagé n'apportent pas, à eux seuls, une ACL par table. La séparation écriture/lecture est donc d'abord **applicative** en A1. C'est un risque résiduel explicite, couvert par :

- modules et interfaces distincts ;
- requêtes préparées nommées et allowlistées ;
- absence du binding D1 dans le code de règle ;
- inventaire statique des écritures ;
- snapshot des tables métier avant/après chaque mission d'intégration ;
- test qui échoue si une instruction agentique cible une table hors des cinq autorisées ;
- identité/Worker séparé ultérieurement si le contrôle applicatif devient insuffisant et si le mécanisme D1 réellement disponible apporte une séparation mesurable.

Aucune nouvelle base n'est proposée dans A1 : D1 reste l'autorité, et la valeur manuelle ne doit pas dépendre de cette couche.

## 15. Fraîcheur, restauration et résultat tardif

- OPS scelle `snapshot_id`, versions et watermark sur chaque finding.
- COS refuse un résultat si le watermark courant diffère avant composition.
- Le cockpit refuse le briefing complet si le watermark diffère avant affichage ; il montre « Aujourd'hui » en mode manuel.
- `restore_epoch` est lu depuis le contrôle global. Après restauration, son incrément invalide missions, résultats et fingerprints plus anciens.
- Une écriture porte `mission_id`, `attempt_no`, `execution_epoch`, `restore_epoch` et `control_fingerprint`; toute valeur non courante est refusée.
- Un résultat tardif ne remplace ni n'amende le résultat d'une mission annulée ou échouée.

## 16. Gates des décisions encore ouvertes

| Décision | Recommandation provisoire fixture/shadow synthétique | Blocage réel |
|---|---|---|
| D-007 — sensibilité | `fixture_only=true`, identifiants opaques, champs opérationnels allowlistés, rejet de tout champ personnel ; les classes d'architecture restent un vocabulaire de travail, pas une décision définitive | aucun snapshot de données réelles avant classification, manifeste de champs et revue appropriée |
| D-008 — rétention | base de fixtures isolée et réinitialisée ; `retention_policy_ref=fixture-ephemeral-v1` sans durée légale inventée | aucune persistance réelle avant durées, sauvegardes, purge et responsabilités décidées |
| D-009 — export/effacement | aucun export individuel ; reset intégral de la fixture comme mécanisme de nettoyage | aucune donnée réelle avant procédure multi-système, preuve, restauration et obligations TIM validées |
| D-013 — budgets monétaires | aucun outil tarifé ; budget logique fini explicite ; coût monétaire `not_applicable` | aucun appel payant ni contexte réel tant que devise et plafonds ne sont pas décidés |
| D-014 — timeout/retries | timeout fini injecté par scénario ; zéro retry automatique ; une tentative | aucune exécution réelle avant valeurs par capacité, conditions de retry et circuit breaker décidés |
| D-018 — réussite | mesurer couverture fixture, bruit, temps, usage logique et incidents ; aucune conclusion go-live | aucune activation réelle avant baseline et seuils go/no-go décidés par Mouaad |

Toutes ces lignes restent `open`. Une valeur test n'est jamais promue en configuration réelle.

## 17. Exemple entièrement fictif

```text
mission M-DEMO-OPS-001
  type        = ops.shadow_scan.v1
  agent       = OPS-01
  source      = SNAP-DEMO-001 / watermark W-DEMO-17
  scope       = fixture_only
  résultat    = F-DEMO-001, F-DEMO-002

finding F-DEMO-001
  rule        = OPS-PROJECT-NEXT-ACTION-001
  scope       = project / PRJ-DEMO-001
  raison      = PROJECT_OPEN_WITHOUT_NEXT_ACTION
  proposition = définir humainement la prochaine étape

mission M-DEMO-COS-001
  type        = cos.daily_briefing.v1
  source      = M-DEMO-OPS-001 / W-DEMO-17
  résultat    = 1 item retenu, 0 omis
```

Les identifiants sont synthétiques. Aucun nom, email, téléphone, adresse, montant, document ou référence réelle n'est admis.

## 18. Preuves exigées avant proposition d'implémentation

1. le schéma peut représenter les deux missions et reconstruire succès, vide, stale, erreur, timeout, budget refusé et kill ;
2. l'ensemble exact des constats se déduit d'une fixture et du watermark ;
3. une tâche terminée ou un dossier terminal est absent du briefing courant ;
4. les doublons exacts et multi-règles donnent un seul item par dossier ;
5. le briefing contient 0 à 7 items et rend visible un `omitted_count` ;
6. aucun chemin de code futur n'écrit une table métier ;
7. le kill global, agent ou capacité bloque l'admission et tout résultat tardif ;
8. le journal suffit à reconstruire source, mission, tentative, résultat, coût, approbation éventuelle, erreur et dates ;
9. aucune PII inutile n'apparaît dans snapshot, finding, item, trace ou log ;
10. le cockpit manuel passe ses tests lorsque les cinq tables sont absentes, indisponibles ou stoppées.

Ce schéma ne doit pas être implémenté avant une nouvelle validation explicite de Phase A1.
