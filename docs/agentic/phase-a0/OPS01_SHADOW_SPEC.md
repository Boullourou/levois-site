# `OPS-01` — Spécification shadow mode minimale

Statut : **spécification de future Phase A1, non implémentée**.

Niveau initial : **L0 — Observation**.

Type de mission fermé : **`ops.shadow_scan.v1`**.

Mode autorisé : **fixtures fictives ; shadow mode réel interdit tant que les gates de `SCOPE.md` ne sont pas levées**.

## 1. Mission gelée

`OPS-01` lit une photographie opérationnelle minimisée, applique sept règles déterministes et retourne les écarts actuels au control plane. Il ne cherche pas « ce qui paraît important » et n’interprète aucun texte libre.

Il doit uniquement détecter :

1. un projet actif sans prochaine action ;
2. une tâche échue ;
3. une promesse de retour arrivée à échéance ;
4. un nouveau dossier non traité si cet état structuré existe ;
5. un Accord TIM actionnable sans prochaine action ;
6. une échéance TIM proche ou dépassée si elle est structurée ;
7. une incohérence opérationnelle simple appartenant à l’allowlist de cette spécification.

Chaque résultat explique la règle. Il ne crée aucune tâche, alerte métier, interaction, prochaine action, approbation ou événement métier.

## 2. État actuel et cible A1

| Capacité | État actuel | Future A1 |
|---|---|---|
| Lecture opérationnelle | Les vues cockpit interrogent déjà D1 | Projection privée minimisée et versionnée, dédiée à la mission |
| Détection | Invariants documentés et vues « Aujourd’hui » | Sept règles fermées exécutées sans modèle |
| Résultat | Aucun artefact OPS | Résultat technique de mission append-only, non souverain |
| Action | Mouaad travaille dans le cockpit | Inchangé : `OPS-01` ne déclenche rien |
| Reprise | Mode manuel | Échec visible puis vue cockpit ; aucune boucle automatique |

A1 réutilise les règles et lectures existantes, **pas le payload brut de `getToday()`**, qui contient aujourd’hui des libellés et titres inutiles à OPS. La future projection les retire. Deux écarts existants sont également explicités : `promisedReturns` ne borne pas actuellement `promised_due_at` à `as_of`, donc la règle 003 doit le faire ; `newDossiers` signifie seulement `project.status ∈ {new, qualifying}`, pas « non traité ».

## 3. Frontière de données

### 3.1 Snapshot requis

Une mission reçoit un snapshot cohérent portant :

- `snapshot_id` opaque ;
- `as_of` en UTC ;
- `operational_watermark` monotone ;
- version du contrat de projection ;
- indicateur de complétude par famille ;
- lignes allowlistées et versionnées décrites ci-dessous.

Le snapshot n’est pas une copie durable de D1. C’est une projection de lecture bornée produite par un composant déterministe. Si une famille requise est indisponible, la mission ne peut pas conclure « aucune anomalie ».

### 3.2 Champs allowlistés

| Famille | Champs conceptuels strictement nécessaires | Champs exclus |
|---|---|---|
| Projet | identifiant opaque, `status`, version, présence d’une tâche ouverte `is_next_action=1` calculée depuis les tâches existantes | personne, coordonnées, notes, objectif détaillé |
| Tâche | identifiant opaque, contexte projet ou TIM, `status`, `due_at`, priorité source, `is_next_action`, `promised_from_interaction_id`, version | titre libre, corps, destinataire, coordonnées |
| Promesse structurée | identifiant opaque, contexte, `due_at`, état résolu/non résolu, référence source, version | texte de l’échange, email, transcription |
| Signal de triage éventuel | identifiant opaque, indicateur canonique `untriaged`, date et version — famille actuellement absente | formulaire brut, identité, email, téléphone |
| Accord TIM | identifiant opaque, état d’accord, version, présence d’une tâche ouverte `is_next_action=1` | parties, termes, allocations, montants, documents |
| Échéance TIM structurée | identifiant opaque, accord, type allowlisté, `due_at`, état, version | montant, preuve, texte libre |

Une promesse ou échéance ne peut être extraite d’une note, d’un email ou d’une transcription. Si la projection structurée n’existe pas, la règle concernée retourne `not_evaluated` dans le diagnostic de couverture ; elle n’invente ni date ni absence.

### 3.3 Contextes éligibles

- projet opérationnellement ouvert selon la lecture existante `getToday()` : `project.status ∈ {new, qualifying, active, paused}` ;
- tâche ouverte : `task.status ∈ {open, in_progress, waiting}` ;
- tâche close : `task.status ∈ {completed, cancelled}` ;
- Accord TIM actionnable selon la lecture existante : `current_agreement_status ∈ {to_formalize, signed, omega_uploaded, active}` ;
- signal « non traité » : indicateur canonique explicite à créer ou identifier ; **aucun n’existe dans le dépôt au cadrage A0**.

Un projet `completed|abandoned|archived` est terminal. Un Accord TIM `cancelled|closed` est terminal. Les valeurs ci-dessus reflètent le schéma et les requêtes actuels ; A1 ne doit pas inventer un second vocabulaire.

## 4. Catalogue fermé des règles

Les identifiants et versions de règle sont journalisés. Leur nom n’est pas un nom d’événement métier.

| ID de règle | Entrée et condition exacte | Exclusions obligatoires | Raison produite | Priorité proposée | Action humaine suggérée |
|---|---|---|---|---|---|
| `OPS-PROJECT-NEXT-ACTION-001` | projet opérationnellement ouvert sans tâche ouverte portant `is_next_action=1` | projet terminal | « Projet opérationnel ouvert sans prochaine action. » | `normal` | « Définir la prochaine étape. » |
| `OPS-TASK-OVERDUE-002` | tâche ouverte, contexte unique éligible et `due_at < as_of` | `completed\|cancelled`, date absente, projet terminal, TIM terminal | « Tâche ouverte échue depuis la date indiquée. » | `urgent` seulement si la priorité source est `urgent`, sinon `high` | « Replanifier, terminer ou clôturer après vérification. » |
| `OPS-PROMISE-DUE-003` | promesse explicitement structurée, non résolue, contexte éligible et `due_at <= as_of` | promesse inférée, résolue, sans date ou contexte terminal | « Retour explicitement promis arrivé à échéance. » | `high`, ou `urgent` seulement si la source l’était déjà | « Vérifier le contexte puis reprendre contact manuellement. » |
| `OPS-INTAKE-UNTREATED-004` | **désactivée** tant qu’un indicateur canonique `untriaged=true` n’existe pas ; si un tel signal est ultérieurement validé, l’évaluer sans PII | `project.status ∈ {new, qualifying}` seul ne suffit jamais ; la liste actuelle `newDossiers` n’est pas une preuve de non-traitement | Aucune en A1 initiale ; état de couverture `not_evaluated` | aucune tant que désactivée | La vue peut afficher « nouveau / à vérifier », mais OPS ne dit pas « non traité ». |
| `OPS-TIM-NEXT-ACTION-005` | Accord TIM actionnable sans tâche ouverte portant `is_next_action=1` | `cancelled\|closed` | « Accord TIM actionnable sans prochaine action. » | `normal` | « Définir le prochain suivi TIM. » |
| `OPS-TIM-DEADLINE-NEAR-006` | échéance structurée d’un TIM actionnable avec `due_at <= as_of + window` et état ouvert | date/type absent, échéance close, TIM terminal | « Échéance TIM structurée proche » ou « dépassée », avec date | `high` si `due_at <= as_of`, sinon `normal` | « Vérifier l’échéance et décider du suivi. » |
| `OPS-INCONSISTENCY-007` | une tâche ouverte `is_next_action=1` est rattachée à un projet terminal ou un Accord TIM terminal ; c’est l’unique incohérence simple A1 | toute autre anomalie de qualité ; scope terminal sans tâche ainsi marquée | « Une prochaine action ouverte subsiste sur un dossier terminal. » | `high` | « Vérifier puis clôturer ou réaffecter manuellement la tâche. » |

Pour les fixtures uniquement, `window` de `OPS-TIM-DEADLINE-NEAR-006` est recommandé à **7 jours calendaires**. Cette valeur est une configuration synthétique, pas une décision métier pour données réelles.

### 4.1 Complétude de couverture

Pour un snapshot complet :

- `OPS-PROJECT-NEXT-ACTION-001` reprend l’invariant actuel de `getToday().withoutNextAction` pour les projets opérationnellement ouverts ;
- `OPS-TIM-NEXT-ACTION-005` reprend le même invariant pour les Accords TIM actionnables ;
- une tâche close n’est jamais considérée comme prochaine action valide.

Un projet terminal sans prochaine tâche ouverte contradictoire ne produit aucune observation. Une tâche ordinaire d’un projet terminal est exclue de `OPS-TASK-OVERDUE-002` ; seule une tâche encore explicitement `is_next_action=1` déclenche `OPS-INCONSISTENCY-007`. L’assainissement général des tâches orphelines ou historiques est différé afin de ne pas polluer le briefing A1.

## 5. Contrat de résultat d’une détection

Chaque observation du résultat de mission contient au minimum :

| Champ conceptuel | Règle |
|---|---|
| `observation_id` | identifiant technique opaque |
| `observation_fingerprint` | empreinte stable de règle, scope, sujet et fait déclencheur ; jamais de PII |
| `rule_id` et `rule_version` | exactement une règle du catalogue fermé |
| `scope_kind` / `scope_id` | dossier `project`, `tim_agreement` ou futur `triage_signal`, identifiant opaque ; une tâche reste rattachée à son dossier |
| `subject_id` | identifiant de tâche/promesse/échéance si distinct du scope |
| `link_kind` / `link_ref` | liaison optionnelle `promise_task\|tim_deadline_task` et identifiant opaque partagé, uniquement si une relation structurée explicite existe ; jamais de rapprochement textuel |
| `reason_code` / `reason_text` | code fermé et texte déterministe sans donnée libre |
| `source_ref` / `source_version` | référence D1 technique et version observée |
| `snapshot_id` / `operational_watermark` | photographie ayant produit le constat |
| `detected_at` / `as_of` / `due_at` | dates UTC ; `due_at` peut être nul seulement pour absence d’action |
| `proposed_priority` | `low\|normal\|high\|urgent` selon la table, sans valeur client supposée |
| `suggested_human_action` | phrase allowlistée ; aucune commande exécutable |
| Nature de la ligne | chaque observation est, par définition, un constat positif `detected` ; aucun statut de couverture n'est dupliqué dans la ligne |

Le résultat global contient aussi `OpsCoverageV1` : une ligne par règle avec `evaluation_status=evaluated|not_evaluated|failed`, le nombre de lignes lues, le nombre de constats, le coût logique, la durée et les erreurs redacted. Une règle évaluée avec zéro constat reste `evaluated` ; aucune observation négative n'est persistée.

L’empreinte est basée conceptuellement sur :

```text
rule_id + scope_kind + scope_id + subject_id + due_at_or_condition_key
```

Elle n’inclut pas le nom d’une personne. Une nouvelle version sans changement du fait garde la même empreinte ; un changement matériel de date ou de sujet en produit une nouvelle.

## 6. Capacités OPS-01

| Capacité | Entrée | Règle / traitement | Sortie | Erreur | Fallback | Mesure |
|---|---|---|---|---|---|---|
| `ops.read_snapshot` | mission valide et projection minimisée | Vérifier contrat, complétude, watermark, portée et absence de champs interdits | Snapshot admis ou rejet explicite | `CP_CONTRACT_INVALID`, `CP_PII_POLICY_VIOLATION`, `CP_SOURCE_EMPTY`, `CP_KILL_SWITCH_ACTIVE` | Ouvrir les vues cockpit correspondantes | Champs lus, familles complètes, violations = 0 |
| `ops.evaluate_rules` | snapshot admis | Évaluer les sept règles, chacune une fois, sans modèle ni texte libre | Résultat structuré et diagnostic de couverture | `CP_RESULT_INVALID`, `CP_SOURCE_STALE`, `CP_BUDGET_EXCEEDED`, `CP_TIMEOUT` | Exécuter les checklists/vues manuelles | Couverture fixture, faux positifs/négatifs, durée, coût logique |
| Sceller le résultat | observations, diagnostic, tentative et watermark | Valider schéma, redaction et empreintes ; écrire uniquement résultat/journal agentique | Résultat de mission consultable par COS | journal impossible ou hash invalide → mission `failed`, jamais `completed` | Aucun briefing agentique ; cockpit manuel | 100 % de résultats corrélés et reconstructibles |

`OPS-01` ne possède pas de capability d’écriture métier, de création de tâche, de communication, d’export, de réseau ou d’invocation de modèle.

## 7. Ordre d’exécution et cohérence

1. le control plane vérifie type de mission, agent, kill switches, timeout et budget logique ;
2. le composant de lecture construit une photographie cohérente avec un seul `as_of` et un watermark ;
3. `OPS-01` vérifie que toutes les familles requises sont complètes ;
4. les sept règles s’exécutent sur cette photographie, dans n’importe quel ordre mais avec le même résultat ;
5. le validateur déterministe refuse tout champ hors contrat ;
6. résultat et journal sont scellés sous la tentative ;
7. `COS-01` peut lire ce résultat seulement si son watermark est encore courant.

Une modification de D1 pendant ou après le scan ne fusionne jamais deux versions. Elle rend le résultat stale. Seul un nouveau déclenchement manuel de Mouaad peut créer une mission corrélée avec un nouveau budget et un nouveau snapshot ; ce n’est pas un retry implicite.

## 8. Gestion des erreurs

| Situation | Comportement obligatoire |
|---|---|
| Famille vide alors qu’elle devait être disponible | `CP_SOURCE_EMPTY`, résultat partiel marqué non fiable ; ne pas afficher « aucun élément » |
| Watermark/version modifié | `CP_SOURCE_STALE`, résultat invalidé |
| Champ PII ou non allowlisté reçu | `CP_PII_POLICY_VIOLATION`, arrêt et journal redacted |
| Résultat non conforme | `CP_RESULT_INVALID`, aucune observation transmise à COS |
| Budget logique absent ou atteint | admission refusée ou `CP_BUDGET_EXCEEDED`; jamais illimité |
| Timeout | `CP_TIMEOUT`, `execution_epoch` et `control_fingerprint` invalidés, aucun résultat tardif accepté |
| Kill switch | `CP_KILL_SWITCH_ACTIVE`, aucune nouvelle mission ; mission active `cancelled` avec raison |
| Une règle manque sa projection optionnelle | règle `not_evaluated`, couverture dégradée visible ; pas de faux négatif silencieux |

Le retry automatique provisoire est **zéro**. Une panne n’écrit rien dans les tables métier et ne bloque aucune vue manuelle.

## 9. Arrêt et kill switch

La mission s’arrête dès que :

- le résultat complet est scellé ;
- le snapshot devient stale ou incomplet ;
- le budget logique ou le timeout est atteint ;
- un champ interdit apparaît ;
- le kill switch global, `OPS-01` ou l’une des capabilities OPS est actif.

Seul Mouaad peut réactiver la portée. Une réactivation ne rouvre aucune mission terminale.

## 10. Fixtures minimales à préparer en A1

| Fixture fictive | État | Attendu |
|---|---|---|
| `PRJ-DEMO-001` | `active`, aucune tâche ouverte `is_next_action=1` | `OPS-PROJECT-NEXT-ACTION-001` |
| `TASK-DEMO-001` | `open`, projet actif, échue de deux jours | `OPS-TASK-OVERDUE-002` |
| `TASK-DEMO-002` | `completed`, ancienne échéance | aucune détection |
| `PRJ-DEMO-002` | `completed`, aucune tâche | aucune détection |
| `PROMISE-DEMO-001` | explicite, non résolue, due aujourd’hui | `OPS-PROMISE-DUE-003` |
| `PRJ-DEMO-NEW-001` | `new`, sans signal de triage canonique | règle 004 `not_evaluated`, jamais « non traité » |
| `TIM-DEMO-001` | `active`, aucune tâche ouverte `is_next_action=1` | `OPS-TIM-NEXT-ACTION-005` |
| `TIM-DEMO-002` | `signed`, échéance structurée à J+3 | `OPS-TIM-DEADLINE-NEAR-006` |
| `PRJ-DEMO-003` | `completed`, possède encore une tâche ouverte `is_next_action=1` | `OPS-INCONSISTENCY-007` |
| `TIM-DEMO-003` | `closed`, aucune tâche | aucune détection |

Les libellés « Client fictif A » ou « Accord TIM fictif B » sont des aliases fictifs de présentation ; ils ne font pas partie du snapshot OPS.

## 11. Preuves attendues avant toute donnée réelle

- 100 % des anomalies attendues dans les fixtures sont détectées ; le seuil opérationnel réel reste D-018 ;
- une tâche `completed|cancelled` ne produit jamais d’observation active ;
- un projet terminal et un TIM terminal sans contradiction explicite ne produisent pas de fausse alerte ;
- une tâche ouverte encore marquée prochaine action sur un scope terminal est signalée une seule fois ;
- `new|qualifying` n’est jamais présenté comme « non traité » sans signal canonique distinct ;
- chaque observation comporte règle, raison, source, date, priorité et action humaine suggérée ;
- deux exécutions sur le même snapshot donnent le même résultat ordonné après normalisation ;
- le diff des tables métier avant/après mission est nul ;
- aucune PII, aucun montant TIM, aucun texte client et aucun secret n’apparaît dans snapshot, résultat ou journal ;
- sans modèle, réseau ou connecteur, toutes les fixtures passent ;
- une mission sans budget logique ou timeout explicite est refusée.

Ces preuves ne valent pas autorisation d’activation. Les gates de `SCOPE.md` et une nouvelle décision de Mouaad restent obligatoires.
