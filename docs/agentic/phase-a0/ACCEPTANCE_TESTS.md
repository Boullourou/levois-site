# Tests d’acceptation — Phase A0 / future Phase A1

Statut : contrat documentaire de tests, aucune implémentation.

Décideur des gates : Mouaad.

Périmètre : future première tranche cloud-only, fixture-only puis shadow, limitée à `OPS-01`, `COS-01` minimal, au journal, aux missions, au briefing et aux kill switches. Ce document n’autorise ni donnée réelle, ni modèle, ni connecteur, ni action externe.

## 1. Objet de la preuve

La future Phase A1 ne sera pas acceptée parce qu’un écran « semble fonctionner ». Elle devra prouver, sur fixtures fictives et avec une horloge contrôlée, que :

1. les règles OPS couvrent exactement leur périmètre ;
2. COS déduplique, classe et limite sans inventer de priorité ;
3. une source devenue obsolète invalide le briefing avant affichage ;
4. chaque chemin est reconstructible depuis le journal ;
5. aucune exécution ne modifie une table métier ;
6. le cockpit manuel fonctionne lorsque toute la tranche agentique est absente, en panne ou arrêtée ;
7. un budget, un droit ou une décision manquante ferme l’accès au lieu de créer une valeur implicite.

La propriété « rien ne passe inaperçu » est évaluée **au watermark d’un scan OPS réussi**. Entre deux scans, le système ne prétend pas observer en continu. Avant composition et avant affichage, le watermark est comparé à l’état opérationnel courant ; s’il a changé, le briefing complet est invalidé et la vue déterministe « Aujourd’hui » devient le fallback.

## 2. Système sous test futur

Le système sous test est volontairement fermé :

| Bloc | Responsabilité testée | Hors périmètre |
|---|---|---|
| Admission déterministe | reconnaître deux types de mission, vérifier droits, budget logique et kill switches | catalogue dynamique, agent créé à la volée |
| Ledger de mission | cycle, tentative, résultat, erreur, coût logique, trace | moteur générique, queue distribuée |
| `OPS-01` | lire un snapshot minimisé et appliquer sept règles fermées | résumé IA, suggestion libre, mutation métier |
| `COS-01` minimal | lire les anomalies OPS, dédupliquer, classer et composer 0 à 7 items | planification d’entreprise, création de tâche, accès direct aux dossiers |
| Lecture cockpit privée | afficher le dernier briefing encore frais ou le fallback déterministe | envoi, publication, exposition publique |
| Kill switches | stopper globalement, par agent ou par capacité | auto-réactivation, délégation d’autorité |

Types de mission autorisés :

- `ops.shadow_scan.v1` ;
- `cos.daily_briefing.v1`.

Capacités autorisées :

- `ops.read_snapshot` ;
- `ops.evaluate_rules` ;
- `cos.read_ops_results` ;
- `cos.deduplicate` ;
- `cos.rank` ;
- `cos.compose_briefing`.

`BUY-01` est seulement la prochaine extension envisagée. Aucun test A1 ne doit nécessiter son activation ni une abstraction destinée à d’autres agents.

### 2.1 Réutilisation contrôlée de l’existant

La projection `getToday` existante fournit déjà les bases déterministes pour les tâches échues, les projets/Accords TIM sans prochaine action et les promesses structurées. Elle sert de baseline à consolider, pas de second moteur concurrent.

Le schéma actuel ne fournit en revanche aucun `inbound_submission.status`. La liste actuelle des projets `new|qualifying` ne prouve pas qu’un dossier est « non traité ». En A1 :

- `OPS-INTAKE-UNTREATED-004` reste désactivée lorsque la projection explicite n’existe pas ;
- un éventuel libellé issu seulement de `new|qualifying` dit « nouveau à vérifier », jamais « non traité » ;
- aucun schéma métier n’est ajouté pour combler ce manque dans la tranche agentique ;
- le test doit prouver le refus fermé et l’absence de faux fait.

### 2.2 Couches de preuve obligatoires

| Couche | Cible | Forme de preuve |
|---|---|---|
| Tests unitaires | chaque règle OPS, fingerprint, groupement, ordre, limite, budget et transition | cas tabulaires avec horloge injectée, fonctions pures et résultats exacts |
| Tests de contrat | DTO, cinq structures, enums, types de mission, capabilities et erreurs | validation positive/négative, champs supplémentaires refusés, golden contracts versionnés |
| Tests d’intégration D1 | snapshot, mission, trace, findings, briefing, idempotence et watermark | D1 SQLite en mémoire, migrations complètes, concurrence et états reconstruits |
| Tests de sécurité | Access/owner, CSRF, PII, SQL boundary, kill, réseau et résultat tardif | requêtes hostiles, canaris fictifs, spy SQL/réseau et contrôle de versions |
| Tests de non-régression | cockpit, vues et commandes humaines | suites existantes avec tranche absente, stoppée, en panne puis active sur fixtures |
| Tests de panne/course | timeout, D1 indisponible, stale, double livraison, switch concurrent | fault injection et horloge contrôlée, jamais de retry implicite |

Une preuve unitaire ne remplace pas l’intégration D1 ; une preuve d’intégration heureuse ne remplace pas les chemins de panne, sécurité et non-régression.

## 3. Conventions déterministes

### 3.1 Horloge et dates

- horloge de référence des fixtures : `2030-01-15T08:00:00Z`, soit `09:00` à Paris ;
- toutes les comparaisons sont faites sur des timestamps ISO UTC passés explicitement ;
- les tests de frontière couvrent `due_at = as_of`, une milliseconde avant et une milliseconde après ;
- aucun test ne lit l’horloge système directement ;
- les bornes de jour réutilisent le comportement de `parisDayBounds` déjà testé dans le cockpit.

### 3.2 Résultat attendu d’une anomalie

Chaque anomalie acceptée par le contrat contient au minimum :

- `rule_id` ;
- `scope_kind` et `scope_id` opaques ;
- `source_ref`, `source_version` et `snapshot_id` ;
- `operational_watermark` ;
- `detected_at` ;
- raison codée et explication déterministe ;
- priorité source proposée ;
- action humaine suggérée issue d’une table fermée ;
- `link_kind`/`link_ref` opaques seulement lorsqu'une relation structurée explicite relie deux constats du même scope ;
- empreinte de dédoublage ;
- aucune coordonnée, aucun verbatim et aucune note libre du dossier.

Le libellé humain éventuel est résolu côté cockpit autorisé au moment de l’affichage. Il ne doit pas être copié dans les tables de trace si l’identifiant opaque suffit.

### 3.3 Oracle de fraîcheur

Chaque résultat OPS porte `snapshot_id`, `operational_watermark` et les versions des sources. COS ne relit pas les tables métier. Juste avant composition puis avant affichage, le control plane compare le watermark déclaré au watermark opérationnel courant :

- identique : la composition peut continuer ;
- différent : la mission COS est `cancelled` avec la raison `stale_source`, le briefing n’est pas publié et **aucune mission n’est créée automatiquement** ; Mouaad peut ensuite déclencher manuellement une nouvelle mission OPS corrélée ;
- échec de lecture du watermark : aucun briefing n’est présenté comme frais ; fallback vers « Aujourd’hui ».

Un éventuel nouveau déclenchement manuel est une nouvelle mission, pas un retry caché. Le nombre de retries généraux reste zéro dans les defaults fixture-only.

## 4. Registre de fixtures fictives

Les fixtures sont locales, éphémères et détruites à la fin de chaque test. Les identifiants ne correspondent à aucune personne ou opération réelle.

| Fixture | État synthétique | Résultat attendu |
|---|---|---|
| `fx-project-no-next-001` | projet `active`, aucune tâche suivante ouverte | `OPS-PROJECT-NEXT-ACTION-001` |
| `fx-project-next-open-002` | projet `active`, prochaine tâche `open` | aucune anomalie d’absence d’action |
| `fx-project-next-done-003` | projet opérationnellement ouvert avec seulement une ancienne tâche `completed` marquée next action | `OPS-PROJECT-NEXT-ACTION-001` ; une tâche close ne vaut pas prochaine action ouverte |
| `fx-project-terminal-004` | projet `completed\|abandoned\|archived`, aucune tâche | aucune anomalie projet |
| `fx-task-overdue-open-005` | tâche `open`, échéance avant `as_of` | `OPS-TASK-OVERDUE-002` |
| `fx-task-overdue-done-006` | tâche `completed`, même échéance passée | aucune anomalie tâche |
| `fx-task-due-boundary-007` | trois tâches aux trois frontières temporelles | résultat conforme à la convention documentée |
| `fx-promise-due-008` | promesse structurée, échue, non résolue | `OPS-PROMISE-DUE-003` |
| `fx-promise-linked-task-008b` | promesse échue et tâche échue explicitement liées par le même `link_ref` opaque | un seul item COS ; promesse principale, tâche en raison secondaire |
| `fx-promise-linked-task-008b` | promesse due et tâche échue reliées par `promised_from_interaction_id` | un item COS, promesse principale, tâche raison secondaire |
| `fx-promise-resolved-009` | promesse structurée avec preuve de résolution | aucune anomalie promesse |
| `fx-promise-future-009b` | promesse non résolue avec `promised_due_at > as_of` | aucune anomalie ; corrige la projection actuelle trop large |
| `fx-intake-unavailable-010` | schéma actuel sans indicateur canonique `untriaged` | règle 004 `not_evaluated`, jamais le fait « non traité » |
| `fx-intake-new-only-011` | projet seulement `new\|qualifying` dans `getToday().newDossiers` | règle 004 `not_evaluated` ; au plus « nouveau à vérifier » dans la vue existante |
| `fx-tim-no-next-012` | Accord TIM actionnable, aucune prochaine tâche ouverte | `OPS-TIM-NEXT-ACTION-005` |
| `fx-tim-closed-013` | Accord TIM terminal, aucune tâche | aucune anomalie TIM |
| `fx-tim-due-near-014` | échéance structurée dans la fenêtre fixture-only de sept jours | `OPS-TIM-DEADLINE-NEAR-006` |
| `fx-tim-due-outside-015` | échéance après la fenêtre fixture-only | aucune anomalie d’échéance proche |
| `fx-tim-overdue-015b` | même échéance TIM déjà échue et tâche en retard | un seul item COS, catégorie échue, jamais doublon « proche » |
| `fx-terminal-next-open-017b` | projet ou Accord TIM terminal avec prochaine tâche ouverte | `OPS-INCONSISTENCY-007`, pas une absence d’action |
| `fx-dedupe-multi-018` | même dossier touché par trois règles | un item COS, trois raisons conservées |
| `fx-briefing-eight-019` | huit dossiers admissibles et ordonnables | sept items, huitième visible dans la trace des omis |
| `fx-no-anomaly-020` | tous les dossiers cohérents | mission réussie, briefing vide, aucune invention |
| `fx-stale-race-021` | tâche clôturée après le scan OPS et avant COS | briefing invalidé ; fallback ; aucune mission automatique |
| `fx-pii-canary-022` | champs métier contenant `CANARY_PERSON_022` et `canary-022@example.invalid` | aucune occurrence dans contexte OPS, artefact, briefing ou log |

La fenêtre de sept jours est une valeur **fixture-only**. Elle ne vaut pas décision métier ou seuil de production.

## 5. Règles OPS à tester

| Règle | Partition positive | Partitions négatives obligatoires | Preuve |
|---|---|---|---|
| `OPS-PROJECT-NEXT-ACTION-001` | projet opérationnellement ouvert (`new\|qualifying\|active\|paused`) sans tâche ouverte `is_next_action=1` | projet terminal ; présence d’une telle tâche ouverte | ensemble attendu = ensemble détecté au watermark |
| `OPS-TASK-OVERDUE-002` | tâche ouverte avec `due_at < as_of` | `completed`, `cancelled`, date future, date absente | aucune tâche terminale dans les résultats |
| `OPS-PROMISE-DUE-003` | promesse structurée non résolue avec `promised_due_at <= as_of` | résolue, annulée, `promised_due_at > as_of`, non structurée | source et échéance présentes, aucun texte libre ; une promesse future n’est jamais « due » |
| `OPS-INTAKE-UNTREATED-004` | aucune partition positive en A1 initiale : aucun indicateur canonique `untriaged=true` n’existe | simple projet `new\|qualifying`, projection absente ou tout statut seulement supposé | règle `not_evaluated`, jamais « aucun nouveau dossier » ni « dossier non traité » ; un futur signal exige un contrat métier séparé |
| `OPS-TIM-NEXT-ACTION-005` | accord actionnable sans prochaine tâche ouverte valide | accord terminal ; tâche ouverte valide | Accord TIM sans projet client artificiel |
| `OPS-TIM-DEADLINE-NEAR-006` | échéance structurée ouverte avec `due_at <= as_of + window`; « dépassée » si `due_at <= as_of`, sinon « proche » | date absente, échéance close, hors fenêtre | une tâche TIM déjà overdue et l’échéance concernée sont regroupées sur le même scope, jamais deux items |
| `OPS-INCONSISTENCY-007` | unique incohérence A1 : tâche ouverte `is_next_action=1` rattachée à un projet ou Accord TIM terminal | toute autre anomalie de qualité ; scope terminal sans telle tâche | code de raison fermé ; aucune réparation automatique |

Pour chaque règle, un test tabulaire couvre toutes les combinaisons pertinentes de statut, date et validité de référence. Un test d’intégration compare l’ensemble exact des `scope_id` éligibles à l’ensemble produit : aucun manquant et aucun surplus.

## 6. Contrat COS à tester

### 6.1 Dédoublage

1. éliminer les répétitions de fingerprint exact ;
2. rapprocher les constats partageant le même `(scope_kind, scope_id, link_kind, link_ref)` lorsque le lien structuré existe ;
3. regrouper ensuite par `(scope_kind, scope_id)` ;
4. conserver toutes les raisons distinctes, sources et échéances utiles ;
5. conserver l’explication de la raison arrivée en tête ;
6. ne jamais fusionner deux dossiers différents, même si leurs libellés se ressemblent.

### 6.2 Ordre total

À données identiques, l’ordre est stable :

1. `proposed_priority` : `urgent`, `high`, `normal`, `low` ;
2. classe de signal : promesse due, tâche/échéance échue, incohérence, intake éventuel, absence de prochaine action, échéance TIM future ;
3. `due_at` croissant, valeurs absentes après les dates connues ;
4. `detected_at` croissant ;
5. `scope_kind`, `scope_id`, puis fingerprint, dans un ordre lexical stable.

L’ordre ne dépend ni d’un modèle, ni de l’ordre de lecture SQL. La classe intake reste sans résultat en A1 initiale puisque la règle 004 est `not_evaluated`.

### 6.3 Taille

- garder au maximum sept items ;
- ne jamais compléter artificiellement jusqu’à trois ;
- accepter un briefing de zéro, un ou deux items lorsque ce sont les seules priorités réelles ;
- journaliser le nombre d’éléments admissibles, retenus et omis, sans copier leur PII.

### 6.4 Explicabilité

Chaque item doit répondre avec des champs structurés à :

- « pourquoi maintenant ? » ;
- « sur quelle règle et quelle source ? » ;
- « quelle action humaine est suggérée ? » ;
- « à quelle date et à quel watermark ? ».

Aucun texte génératif n’est nécessaire. Les formulations proviennent de patrons déterministes versionnés.

## 7. Matrice des quinze critères obligatoires

| ID | Critère à prouver | Scénario Given / When / Then | Niveau | Évidence bloquante |
|---|---|---|---|---|
| `AC-01` | 0 dossier actif sans prochaine action peut passer inaperçu | **Given** matrice des quatre statuts opérationnellement ouverts, avec zéro tâche ouverte `is_next_action=1`, seulement une tâche close, ou une tâche ouverte valide ; **When** scan au watermark W ; **Then** l’ensemble des scopes sans prochaine action ouverte égale exactement l’ensemble détecté par 001 | unité + intégration D1 | assertion d’égalité de sets, pas simple compteur |
| `AC-02` | Une tâche terminée ne reste pas dans le briefing | **Given** détection initiale puis tâche clôturée avant COS ; **When** contrôle de watermark ; **Then** briefing entier invalidé, fallback et aucune mission créée ; **When** Mouaad déclenche ensuite une nouvelle mission ; **Then** le signal de tâche échue est absent, même si le dossier peut désormais relever séparément de la règle 001 | intégration + course | aucune publication avec ancien watermark, compteur de missions inchangé avant action humaine |
| `AC-03` | Un dossier clôturé ne crée pas de fausse alerte | **Given** `fx-project-terminal-004` pour chaque statut terminal ; **When** catalogue de règles ; **Then** aucune anomalie projet | unité + intégration | zéro résultat pour le scope |
| `AC-04` | Un Accord TIM actif sans prochaine action apparaît | **Given** `fx-tim-no-next-012` sans projet artificiel ; **When** scan ; **Then** règle 005 et item COS explicable | intégration | scope TIM exact et action suggérée humaine |
| `AC-05` | Les doublons sont regroupés | **Given** double livraison exacte, promesse+tâche liées, échéance+tâche TIM liées et `fx-dedupe-multi-018` ; **When** COS ; **Then** un item par scope, raisons distinctes conservées et fingerprint exact idempotent | unité + contrat | règles de rapprochement structurées uniquement, traçabilité de toutes les causes |
| `AC-06` | Le briefing contient au maximum 7 items | **Given** huit items ordonnés ; **When** composition ; **Then** sept publiés et compteur `omitted_count=1` | unité + intégration | `0 <= item_count <= 7` pour toute entrée |
| `AC-07` | Chaque item explique sa présence | **Given** chaque famille de règle ; **When** composition ; **Then** règle, raison, source, date, watermark et action proposée non vides | contrat + snapshot | validation de schéma et golden files déterministes |
| `AC-08` | Une panne agentique ne bloque pas le cockpit | **Given** tables/runner agentiques indisponibles ou exception forcée ; **When** consultation et mutation manuelles existantes ; **Then** APIs cockpit historiques conservent leur résultat et « Aujourd’hui » affiche le fallback | intégration + non-régression | suite cockpit existante verte avec feature off et panne injectée |
| `AC-09` | Aucune sortie agentique ne modifie une table métier | **Given** snapshot complet des tables non agentiques ; **When** chaîne OPS/COS réussie et en échec ; **Then** snapshot identique et aucune instruction d’écriture ciblant ces tables | intégration + sécurité | double preuve contenu avant/après + trace SQL |
| `AC-10` | Le kill switch stoppe immédiatement les missions | **Given** missions à chaque checkpoint ; **When** Mouaad active global, agent ou capacité ; **Then** aucune nouvelle admission, `execution_epoch`/fingerprint invalidé, mission non terminale annulée avant checkpoint suivant, aucun résultat publié | concurrence + sécurité | trace switch → cancel ; seul Mouaad peut réactiver |
| `AC-11` | Les missions sont reconstructibles par audit | **Given** succès, vide, dédoublage, stale, budget refusé, timeout, kill et erreur D1 ; **When** lecture de trace ; **Then** événement/source, mission, tentative, résultat, coût, approbation éventuelle, erreur et dates forment une chaîne complète | contrat + intégration | reconstructeur ne consulte aucun log externe |
| `AC-12` | Aucune PII inutile n’est transmise | **Given** canaris fictifs dans les tables métier ; **When** scan, briefing, erreur et journal ; **Then** aucun canari dans paquets, sorties, traces ou logs ; seuls IDs opaques autorisés | sécurité | scan récursif des valeurs persistées et logs capturés |
| `AC-13` | Le système fonctionne sans modèle | **Given** aucune clé/fournisseur et `fetch` réseau qui échoue ; **When** chaîne complète ; **Then** même résultat déterministe que le golden file | intégration + non-régression | zéro appel réseau et briefing complet |
| `AC-14` | Aucun email, SMS ou action externe n’est possible | **Given** tous les chemins et erreurs ; **When** missions admises ; **Then** aucune capacité, route, commande ou appel réseau d’envoi ; une demande hors allowlist échoue fermée | contrat + sécurité | inventaire des capacités + spy réseau à zéro |
| `AC-15` | Aucun budget absent ne devient illimité | **Given** budget logique absent, nul, négatif ou dépassé ; **When** admission/checkpoint ; **Then** refus ou arrêt borné, coût observé journalisé, jamais fallback vers infini | unité + intégration | tests de limites et absence de valeur implicite |

Les quinze critères sont tous bloquants. Une moyenne ou un score global ne peut pas compenser un échec d’autorité, de sécurité ou de non-mutation.

## 8. Tests supplémentaires obligatoires

### 8.1 Cycle et contrat de mission

| Test | Attendu |
|---|---|
| type inconnu | refus avant assignation |
| `agent_id` autre que `OPS-01`/`COS-01` pour ces deux missions | refus de politique |
| capacité non listée | refus et trace minimale |
| transition illégale | conflit explicite, statut antérieur conservé |
| résultat tardif après annulation | rejet par tentative/`execution_epoch`/version |
| même clé d’idempotence, même payload | résultat existant retourné, aucune seconde mission |
| même clé, payload différent | conflit explicite |
| mission terminale relancée | nouvelle mission corrélée ; jamais réouverture |
| résultat vide valide | `completed`, briefing de zéro item |
| erreur partielle | `failed`, résultat partiel marqué non publiable |

### 8.2 Priorité, stabilité et volume

- mêmes entrées dans un ordre aléatoire : même sortie byte-for-byte hors identifiants et timestamps explicitement variables ;
- dix anomalies sur un même scope : un item et dix raisons uniques sans dépassement de taille ;
- vingt dossiers fictifs : couverture exhaustive, sept items maximum et compte des omis ;
- deux identifiants proches : jamais fusionnés ;
- `due_at` absent : placement déterministe documenté, jamais date inventée ;
- briefing déjà présent avec même watermark : lecture idempotente, aucune régénération sur `GET`.

### 8.3 Sécurité BFF et séparation

- domaine public : routes agentiques inaccessibles ;
- absence ou invalidité de l’assertion Cloudflare Access : refus fermé ;
- identité autre que Mouaad : lecture et mutation refusées ;
- mutation sans Origin/CSRF valides : refus ;
- lecture privée : `Cache-Control: private, no-store` et interdiction d’indexation ;
- tentative de réactivation par `COS-01`, `OPS-01` ou composant système : refus ;
- paramètres libres de type d’agent/capacité : refus par allowlist ;
- injection de HTML/Markdown dans une raison source : affichage neutralisé ou valeur rejetée ;
- logs d’erreur D1 : code et trace technique seulement, aucun contenu de ligne métier.

### 8.4 Non-régression cockpit

Les suites existantes restent obligatoires :

```text
npm test
npm run test:cockpit
npm run test:cockpit:security
npm run test:market
npm run build
git diff --check
```

Ajouter lors d’A1 deux modes d’exécution de la suite cockpit :

1. tranche agentique absente ou feature flag désactivée ;
2. tranche activée sur fixtures, puis runner forcé en panne.

Dans les deux cas, lecture et commandes humaines existantes doivent garder leurs contrats. Aucun test agentique ne remplace une suite cockpit existante.

## 9. Preuve de non-mutation D1

La preuve combine deux mécanismes indépendants.

### 9.1 Snapshot de contenu

1. lire la liste des tables D1 de la base de test ;
2. séparer par allowlist les seules structures agentiques documentées dans `CONTROL_PLANE_MINIMAL_SCHEMA.md` ;
3. sérialiser chaque table non agentique avec colonnes et lignes triées de manière stable ;
4. exécuter tous les chemins OPS/COS, y compris erreurs, stale et kill switch ;
5. resérialiser ;
6. exiger une égalité profonde byte-for-byte pour toutes les tables métier.

La liste des tables métier n’est pas maintenue manuellement : toute nouvelle table non agentique découverte entre automatiquement dans la preuve.

### 9.2 Trace des instructions SQL

Le harness de test enregistre les instructions D1 exécutées. Il refuse `INSERT`, `UPDATE`, `DELETE`, `REPLACE`, `ALTER`, `DROP` ou `CREATE` visant une table hors de l’allowlist agentique. Les détecteurs OPS ne disposent que d’un port de lecture. COS ne reçoit même pas ce port : il lit seulement le résultat OPS minimisé.

Un succès exige les deux preuves. Une égalité finale seule ne suffirait pas, car une écriture suivie d’un rollback pourrait masquer un chemin d’autorité interdit.

## 10. Exécution sans modèle ni connecteur

Le test de référence lance le processus avec :

- aucune variable de fournisseur de modèle ;
- aucun secret Gmail, Resend, SMS, Calendar ou réseau social ;
- aucune queue, aucun cron et aucun runtime local ;
- un `fetch` sortant remplacé par un spy qui échoue immédiatement ;
- uniquement D1 de test, fonctions déterministes et BFF privé.

Le golden briefing doit rester identique. Toute tentative réseau fait échouer `AC-13` et `AC-14`, même si elle est rattrapée par le code.

## 11. Graphe des chemins et échecs

```text
Mouaad authentifié / commande manuelle explicite
                         |
                         v
                 [contrat de requête]
          invalide ------+------ valide
             |                      |
     refus + trace                  v
                       [kill global/agent/capacité ?]
                         oui -------+------- non
                          |                    |
                 mission cancelled            v
                 raison kill_switch      [budget présent
                                           et suffisant ?]
                                  non --------+-------- oui
                                   |                     |
                           refus/arrêt borné              v
                           coût journalisé       mission planned/assigned
                                                           |
                                           execution_epoch + tentative 1
                                                           |
                                                           v
                                              [lecture snapshot OPS]
                              D1 indisponible/timeout -----+----- succès
                                      |                              |
                               mission failed                        v
                               fallback Aujourd’hui       [7 règles déterministes]
                                                      erreur --------+------ résultat
                                                        |                       |
                                                 mission failed                 v
                                                 aucun résultat publié   anomalies 0..N
                                                                                |
                                                                                v
                                                              [persistance idempotente]
                                                    conflit/tardif -------+------ succès
                                                         |                         |
                                                  rejet + trace                    v
                                                                     mission OPS completed
                                                                                |
                                                                                v
                                                                 mission COS corrélée
                                                                                |
                                                        [watermark toujours courant ?]
                                                      non -----------+----------- oui
                                                       |                           |
                                              COS cancelled(stale)                 v
                                              briefing non publié       dédupliquer/ordonner
                                              aucune mission auto                |
                                                       |                           v
                                              fallback Aujourd’hui        garder 0..7 items
                                                                                  |
                                                                                  v
                                                                     [kill/budget/checkpoint]
                                                      stop/erreur --------+------- succès
                                                            |                      |
                                                  COS cancelled/failed             v
                                                  briefing non publié       briefing completed
                                                                                  |
                                                                                  v
                                                              [watermark avant affichage]
                                                      stale/illisible -----+------ courant
                                                            |                      |
                                                   fallback Aujourd’hui      affichage privé
```

### 11.1 Matrice d’échec et trace minimale

| Échec injecté | État terminal attendu | Publication | Trace minimale | Fallback |
|---|---|---|---|---|
| contrat/type/capacité invalide | brouillon `failed` avec `CP_CONTRACT_INVALID` ou `CP_SCOPE_VIOLATION`; aucune assignation | non | acteur, requête hashée, règle de refus, date | cockpit manuel |
| kill switch déjà actif | `cancelled` | non | scope du switch, version, décideur, raison | cockpit manuel |
| budget absent/invalide | `failed`, `CP_CONTRACT_INVALID`, avant assignation | non | champ manquant/invalide et étape, sans valeur implicite | cockpit manuel |
| budget atteint | `failed`, `CP_BUDGET_EXCEEDED` | non | plafond, consommé, unité et checkpoint | cockpit manuel |
| D1 de lecture indisponible | `failed`, `CP_UPSTREAM_UNAVAILABLE` | non | code redacté, tentative, durée | « Aujourd’hui » ou état indisponible explicite |
| timeout | `failed`, `CP_TIMEOUT` | non | timeout déclaré, étape, coût logique consommé | cockpit manuel |
| règle OPS en erreur | `failed`, `CP_RESULT_INVALID` | non | `rule_id`, code, aucun contenu de ligne | cockpit manuel |
| conflit idempotence | mission existante ou conflit | jamais en double | clé et hash techniques | résultat existant ou erreur lisible |
| résultat après epoch/annulation | rejeté | non | tentative/epoch/version attendus et reçus | dernier résultat valide |
| watermark stale | `cancelled(reason=stale_source)`, `CP_SOURCE_STALE` | non | anciens/nouveaux watermarks, corrélation et absence de création automatique | « Aujourd’hui » ; Mouaad peut relancer manuellement |
| erreur COS | `failed`, `CP_RESULT_INVALID` | non | étape déduplication/classement/composition | « Aujourd’hui » |
| zéro anomalie | `completed` | briefing vide valide | compteurs zéro, watermark | aucune fausse priorité |
| plus de sept anomalies | `completed` | sept items | retenus/omis et règle d’ordre | accès aux dossiers via cockpit, pas via trace |
| panne de lecture du briefing | mission inchangée | non | incident technique sans PII | « Aujourd’hui » |
| tentative réseau | `failed`, `CP_SCOPE_VIOLATION` | non | connecteur/capacité interdite, aucune URL sensible | cockpit manuel |

Les codes d’erreur exacts doivent provenir du namespace `CP_*` figé dans le contrat minimal. Cette matrice ne crée pas un second vocabulaire.

## 12. Décisions ouvertes et defaults de test

| Décision | Default uniquement fixture/shadow synthétique | Gate avant donnée réelle |
|---|---|---|
| D-007 sensibilité | labels documentaires existants utilisés pour les cas de test ; `fixture_only=true` obligatoire | catégories et règles de transmission validées |
| D-008 rétention | base en mémoire ou espace local jetable, détruit après la suite ; aucune durée de production déduite | politique par structure et copie validée |
| D-009 export/effacement | aucun endpoint ; destruction de la base de test complète | procédure, inventaire des copies et preuve de purge validés |
| D-013 budgets monétaires | aucun coût monétaire implicite ; budget logique explicitement fourni par chaque fixture | devise, plafonds et alertes validés ; absence = refus |
| D-014 timeout/retries | timeout explicitement fourni par chaque cas, zéro retry automatique et une tentative ; horloge simulée | valeurs opérationnelles et politique de reprise validées |
| D-018 seuils de réussite | exactitude binaire sur matrice fictive ; les quinze AC restent à 100 % | seuils faux positifs, charge, délai et valeur validés sur protocole autorisé |

Tant qu’une de ces décisions nécessaire au traitement réel reste ouverte, une configuration `fixture_only=false` doit échouer au démarrage ou à l’admission. Un simple avertissement n’est pas acceptable.

## 13. Gates de sortie A1

| Gate | Condition cumulative |
|---|---|
| `T0` Contrats | types, règles, structures, statuts, erreurs et fixtures versionnés |
| `T1` Déterminisme | unités OPS/COS vertes, golden files stables, aucune horloge implicite |
| `T2` D1 | intégrations idempotence, cycle, concurrence, watermark et reconstruction vertes |
| `T3` Autorité | double preuve de non-mutation métier verte |
| `T4` Arrêt | global/agent/capacité, annulation au checkpoint et réactivation Mouaad uniquement vertes |
| `T5` Résilience | panne runner/D1 agentique n’affecte pas le cockpit manuel |
| `T6` Sécurité | Access, CSRF, PII canaries, logs, HTML et réseau vertes |
| `T7` Indépendance | suite complète sans modèle, secret, cron, queue ou connecteur verte |
| `T8` Décision | Mouaad accepte explicitement le passage de fixtures à l’étape suivante ; aucune décision ouverte requise pour le réel |

Un échec de `T3`, `T4`, `T5`, `T6` ou `T7` impose kill switch global actif et interdit toute expérimentation avec données réelles. La réussite de Phase A1 sur fixtures n’autorise pas à elle seule le shadow sur données réelles.
