# Plan d’implémentation — proposition de Phase A1

Statut : plan documentaire, non autorisé à l’exécution.

Décideur : Mouaad.

Condition de départ : nouvelle validation explicite après Phase A0.

Condition de fin proposée : tranche A1 utilisable **uniquement avec fixtures fictives**, désactivée par défaut, sans modèle ni connecteur. Le passage à des données réelles ou à un déclenchement planifié exige une décision ultérieure distincte.

## 1. Résultat attendu de la future Phase A1

La Phase A1 devra produire un seul incrément vertical :

```text
commande privée de Mouaad
  -> mission OPS bornée
  -> snapshot D1 minimisé
  -> sept règles déterministes
  -> mission COS bornée
  -> fraîcheur + dédoublage + ordre
  -> briefing privé de 0 à 7 éléments
  -> trace complète
```

Le résultat est utile si Mouaad peut ouvrir un briefing court, comprendre chaque item, retrouver sa source et continuer à utiliser immédiatement la vue « Aujourd’hui » si la chaîne est indisponible.

Il n’y a aucune reformulation IA. Le texte provient de patrons déterministes versionnés.

## 2. Contraintes de conception gelées

1. D1 reste l’unique source de vérité métier.
2. Les cinq futures tables agentiques sont non souveraines et séparées des agrégats métier.
3. `OPS-01` et `COS-01` restent L0 ; leur persistance technique n’est pas une action métier.
4. `OPS-01` n’a qu’un port de lecture minimisé ; `COS-01` ne lit pas D1 métier.
5. Seuls `ops.shadow_scan.v1` et `cos.daily_briefing.v1` sont exécutables.
6. `BUY-01` demeure désactivé ; sa future arrivée justifie seulement des identifiants versionnés et une allowlist fermée.
7. Une exécution A1 possède une tentative et zéro retry automatique.
8. Budget logique et timeout sont toujours explicites et finis. Absence = refus.
9. L’absence d’un switch équivaut à `stopped`, jamais à « autorisé ».
10. Aucun `GET` ne crée de mission ou ne régénère un briefing.
11. Aucun cron, queue, runtime local, modèle, appel réseau ou connecteur n’est construit.
12. Toute variation du watermark entre OPS, COS et affichage invalide le briefing entier.
13. Le chemin manuel cockpit → D1 ne dépend d’aucun module agentique.
14. Aucun moteur d’agents générique, registre dynamique, graphe arbitraire ou système de plugins n’entre dans A1.

## 3. Réutilisation obligatoire de l’existant

| Élément existant | Réutilisation future | Précaution |
|---|---|---|
| D1 cockpit et migrations linéaires `db/migrations` | une migration additive après la dernière migration existante | aucune modification destructive, aucune table métier détournée |
| `src/lib/cockpit/server/db.ts` | types D1, erreurs de domaine, helpers de lecture/batch | conserver le namespace métier existant ; mapper les erreurs agentiques vers `CP_*` |
| `src/lib/cockpit/server/queries.ts` | règles et requêtes déjà éprouvées de `getToday()`, notamment tâches échues, absence de prochaine action, promesses et TIM | extraire ou partager les prédicats ; ne pas recopier une seconde définition divergente |
| `parisDayBounds` | calcul de la journée cockpit | les détecteurs reçoivent toujours `as_of`; aucune lecture implicite de l’horloge |
| `functions/cockpit/_middleware.ts` | Cloudflare Access, domaine privé et défense en profondeur | mêmes contrôles sur toutes les routes futures |
| dispatcher privé `functions/api/cockpit/[[path]].ts` | intégrer des routes nommées et fermées | aucun `PATCH` générique, aucun paramètre libre de type d’agent |
| `src/lib/cockpit/server/testing/sqlite-d1.ts` | D1 local en mémoire pour contrats et intégrations | ajouter l’observation SQL nécessaire à la preuve de non-mutation sans affaiblir les tests existants |
| suites cockpit et API existantes | non-régression et fallback manuel | les tests agentiques s’ajoutent ; ils ne remplacent aucune suite |
| page cockpit « Aujourd’hui » | fallback et emplacement naturel d’un panneau briefing futur | le panneau est isolable et masquable ; la page reste utilisable sans lui |

### 3.1 Écart connu à ne pas masquer

`getToday().newDossiers` repose aujourd’hui sur `project.status IN ('new','qualifying')`. Cela ne prouve pas un état « non traité » et aucun `inbound_submission.status` canonique n’existe dans le schéma actuel.

La Phase A1 ne crée pas un schéma intake pour résoudre cet écart. `OPS-INTAKE-UNTREATED-004` reste `not_evaluated`/désactivée et le diagnostic de couverture l’explique. Une simple ligne `new|qualifying` peut au plus être libellée « nouveau à vérifier » dans la vue existante, jamais « non traité » par OPS.

## 4. Architecture minimale à construire plus tard

```text
Cockpit privé existant
   |
   +-- POST explicite de Mouaad -------------------------------+
   |                                                           |
   +-- GET briefing/missions/trace/switches                    |
   |                                                           v
   |                                                Politique A1 fermée
   |                                        type + agent + budget + timeout
   |                                        kill global/agent/capability
   |                                                           |
   |                                                           v
   |                                                  Ledger de mission
   |                                                           |
   |                                  +------------------------+------------------+
   |                                  |                                           |
   |                                  v                                           v
   |                         Snapshot reader D1                          Trace append-only
   |                                  |
   |                                  v
   |                         OPS rules 001..007
   |                                  |
   |                                  v
   |                        findings non souverains
   |                                  |
   |                         watermark courant ?
   |                                  |
   |                                  v
   |                  COS dedupe -> rank -> max 7
   |                                  |
   |                                  v
   |                         briefing non souverain
   |                                  |
   +--------------------- watermark courant ? -----------------+
                    non -> fallback « Aujourd’hui »
                    oui -> affichage privé
```

## 5. Nombre de structures estimé

### 5.1 Cinq tables additives, pas davantage

La proposition suit exactement `CONTROL_PLANE_MINIMAL_SCHEMA.md` :

| Table conceptuelle future | Rôle | Ce qu’elle remplace volontairement |
|---|---|---|
| `agent_mission` | état courant, contrat, source, agent, statut, priorité, temps, budget logique, résultat/erreur de la mission | aucune table objectif, plan, dépendance ou queue |
| `agent_trace` | journal append-only : source, transitions, tentative, résultat, coût, `approval_ref` éventuelle, erreur et dates | aucune table tentative, coût, approval ou log séparée |
| `agent_control_switch` | état versionné `global\|agent\|capability`, décideur et raison | aucun service de feature flag ou registre de droits générique |
| `agent_ops_shadow_finding` | observations structurées OPS, fingerprint, règle, scope, source et watermark | aucune alerte/tâche métier et aucun artefact générique |
| `agent_cos_briefing_item` | items ordonnés 0..7 d’une mission COS ; header/compteurs restent sur la mission | aucune table de contenu ou de notification |

Estimation : **5 tables futures dans une migration additive unique**.

Aucune table supplémentaire n’est créée pour `goal`, `subtask`, `dependency`, `queue`, `lease`, `agent_registry`, `tool_registry`, `approval`, `budget`, `artifact`, `prompt` ou `model_run`.

### 5.2 Projections de lecture, sans nouvelle vérité

Trois structures logiques de lecture sont nécessaires, mais elles ne sont ni des tables ni des vues matérialisées obligatoires :

1. `OpsSnapshotV1`, snapshot OPS minimisé contenant le watermark ;
2. `OpsCoverageV1`, diagnostic par règle versé dans la trace ;
3. `BriefingViewV1`, briefing courant résolu pour le cockpit.

Le choix SQL CTE, fonction de requête ou vue D1 non matérialisée sera fait pendant A1 selon les tests. Leur contrat est fixé ; leur forme physique ne doit pas multiplier les copies.

## 6. Modules conceptuels futurs

Les noms ci-dessous décrivent des responsabilités ; ils ne prétendent pas que des fichiers existent déjà et ne prescrivent pas leur chemin final.

| Module conceptuel | Responsabilité exacte | Dépendances autorisées | Interdictions |
|---|---|---|---|
| `A1 mission policy` | allowlist type→agent→capabilities, transitions, budget/timeout et admission | configuration A1 fermée, switch reader | découverte dynamique, modèle, connecteur |
| `A1 mission ledger` | créer/lire une mission, ajouter trace, transition atomique, idempotence/version | D1 et helpers existants | écrire une table métier |
| `A1 switch controller` | lire/activer global, agent, capacité ; vérifier Mouaad et version | BFF privé, ledger/trace | auto-réactivation, règle implicite permissive |
| `OPS snapshot reader` | projeter les champs allowlistés et le watermark depuis D1 | requêtes cockpit partagées | coordonnées, notes libres, écriture |
| `OPS deterministic evaluator` | exécuter sept règles fermées et valider le résultat | snapshot en mémoire | SQL direct, réseau, génération libre |
| `COS deterministic composer` | fraîcheur, fingerprint, groupement, ordre total, limite sept, patrons | findings OPS validés | D1 métier, création de tâche, IA |
| `A1 bounded runner` | exécuter séquentiellement une OPS puis une COS depuis une commande dédiée | cinq modules précédents | graphe arbitraire, worker dynamique, boucle de retry |
| `A1 private BFF` | routes de lecture, déclenchement explicite, annulation et switches | middleware cockpit existant | endpoint public, mutation générique |
| `A1 cockpit presenter` | état, briefing/fallback, raisons, liens et kill status | BFF privé | déclenchement sur `GET`, action externe |

Le runner n’est pas une plateforme. Il connaît exactement deux types et un enchaînement : OPS réussie et fraîche peut produire une COS corrélée. Tout autre type est refusé.

## 7. Déroulé synchrone borné proposé

Pour 5 à 20 dossiers et sans queue, la première implémentation peut exécuter une commande manuelle dans une requête serveur bornée :

1. authentifier Mouaad, valider Origin/CSRF et idempotency key ;
2. vérifier que le mode est `fixture_only` ;
3. vérifier les switches global, `OPS-01`, `ops.read_snapshot`, `ops.evaluate_rules` ;
4. vérifier budget logique et timeout explicites ;
5. créer `ops.shadow_scan.v1`, tentative 1, puis passer par `planned`, `assigned`, `running` ;
6. lire une photographie cohérente et son watermark ;
7. appliquer les sept règles, sceller findings et trace, terminer OPS ;
8. revérifier switches, budget et watermark ;
9. créer `cos.daily_briefing.v1` corrélée ;
10. dédupliquer, classer, garder 0 à 7 items et sceller la trace ;
11. vérifier une dernière fois watermark et switches ;
12. publier le résultat technique comme briefing courant ou l’invalider ;
13. répondre avec identifiants, statut et lien privé, jamais avec un payload métier complet.

Si la requête s’interrompt, la prochaine commande privée commence par réconcilier les missions `running` dont le timeout est dépassé. Elle les termine `failed` avec `CP_TIMEOUT`; elle ne reprend pas leur tentative. Cette réconciliation bornée ne constitue ni queue ni cron.

Un résultat tardif est refusé par version/tentative. Chaque checkpoint relit le switch et le budget. L’arrêt « immédiat » signifie : aucun nouveau checkpoint ne commence après persistance du switch ; une opération D1 atomique déjà engagée se termine, puis le résultat devient non publiable.

## 8. Endpoints futurs envisagés — non créés en A0

Toutes les routes restent sous le BFF cockpit privé, protégées comme le cockpit actuel. Les formes finales pourront être intégrées au dispatcher existant ; aucune route n’est autorisée par ce document.

| Méthode et chemin conceptuel | Usage | Entrée minimale | Sortie | Effet permis | Refus principal |
|---|---|---|---|---|---|
| `POST /api/cockpit/agentic/daily-briefing-runs` | déclencher la chaîne OPS→COS sur fixtures | idempotency key, `fixture_id`, `policy_version`; le serveur résout timeout/budget finis du profil fixture | IDs des deux missions, statut, briefing éventuel | écrit seulement les 5 tables agentiques | non-Mouaad, CSRF, type/profil libre, budget absent, switch applicable à `stopped` |
| `GET /api/cockpit/agentic/briefings/today` | lire le dernier briefing frais | aucune donnée client en query string | header, 0..7 items, raisons, watermark, fallback status | lecture seule ; ne régénère jamais | briefing stale, watermark indisponible |
| `GET /api/cockpit/agentic/missions/{mission_id}` | inspecter une mission | ID opaque | contrat minimisé, statut, coût logique, résultat/erreur | lecture seule | scope/ID invalide |
| `GET /api/cockpit/agentic/missions/{mission_id}/trace` | reconstruire le chemin | ID opaque, pagination bornée | entrées append-only redacted | lecture seule | export global ou pagination non bornée |
| `POST /api/cockpit/agentic/missions/{mission_id}/cancel` | annuler une mission précise | raison, expected version, idempotency key | statut terminal et trace | mission/trace uniquement | mission terminale, version stale, acteur non-Mouaad |
| `GET /api/cockpit/agentic/control-switches` | voir global/agents/capacités | aucune | état effectif et versions | lecture seule | aucune exposition publique |
| `PUT /api/cockpit/agentic/control-switches/{scope}/{key}` | stop/réactivation explicite | `stopped\|enabled`, raison, expected version, idempotency key | état et audit d’autorité | switch/trace ; annule portée active | clé inconnue, silence, auto-approval, acteur non-Mouaad |

Il n’existe pas de `POST /missions` générique. Il n’existe aucun endpoint d’email, SMS, tâche, interaction, consentement, paiement, publication, export ou connecteur dans A1.

## 9. Budget logique A1

Le budget logique mesure du travail déterministe, pas une dépense monétaire. Ses cinq compteurs fermés sont :

- `source_rows` ;
- `rule_evaluations` ;
- `findings` ;
- `briefing_items` ;
- `trace_entries`.

La durée reste observée séparément et bornée par `timeout_at` ; elle ne reçoit aucun coefficient de conversion en coût.

Chaque mission reçoit un plafond explicite dans son contrat. L’admission calcule un maximum possible à partir des bornes de la requête. Si le plafond est absent ou inférieur au minimum requis, elle refuse avant lecture. Si le plafond est atteint en cours de mission, elle s’arrête avec `CP_BUDGET_EXCEEDED`, journalise le consommé et ne publie aucun résultat partiel.

Ce mécanisme permet de tester la borne sans décider D-013. Aucun montant, devise, plafond quotidien ou coût fournisseur n’est inventé. Une future donnée réelle reste interdite jusqu’à la décision monétaire.

## 10. Séquence d’implémentation tests-first

Chaque étape suit `red -> green minimal -> refactor sous tests`. Une étape ne commence pas si sa gate précédente échoue.

### A1-00 — Rejouer la baseline et figer les contrats

**Travail**

- confirmer le commit de base A0 et l’absence de changement applicatif antérieur ;
- exécuter toutes les suites existantes et capturer la baseline ;
- figer types, capacités, sept règles, cinq tables, statuts et erreurs `CP_*` ;
- rendre le mode agentique absent/désactivé par défaut ;
- confirmer que la configuration réelle échoue fermée tant que D-007/008/009/013/014/018 sont ouvertes.

**Gate** : tests actuels verts ; revue documentaire sans divergence de vocabulaire.

**Rollback** : aucun artefact applicatif n’existe encore.

### A1-01 — Écrire le harness et les tests rouges

**Travail**

- ajouter les fixtures de `ACCEPTANCE_TESTS.md` uniquement dans l’environnement de test ;
- étendre le wrapper SQLite-D1 de test pour capturer les instructions SQL ;
- construire l’oracle de snapshot de toutes les tables non agentiques ;
- écrire contrats de mission, switch, findings, briefing, PII canaries et réseau interdit ;
- écrire d’abord `AC-01` à `AC-15`, dont la course stale et les trois scopes de kill switch.

**Gate** : tests nouveaux échouent pour la raison attendue, sans altérer les suites existantes.

**Rollback** : supprimer seulement le harness/tests A1 ; aucune migration.

### A1-02 — Ajouter le schéma minimal

**Travail**

- écrire une migration additive contenant exactement les cinq tables ;
- ajouter contraintes allowlist, clés étrangères seulement entre structures agentiques, unicités/idempotence, version et index minimaux ;
- garantir par design qu’aucune FK agentique n’impose une suppression/mutation en cascade vers le métier ;
- tester migration depuis toutes les migrations existantes et création sur base vierge de test.

**Gate** : tests de schéma, contraintes, index, append-only trace et migration locale verts.

**Rollback** : ne jamais faire de down-migration destructive sur une base partagée ; désactiver la tranche et laisser les tables additives dormantes.

### A1-03 — Construire ledger et politique d’admission

**Travail**

- implémenter les transitions du sous-ensemble A1 ;
- appliquer allowlist type→agent→capabilities ;
- exiger timeout et budget finis ;
- appliquer idempotence, expected version et tentative unique ;
- sceller une trace pour chaque transition, refus et coût ;
- refuser résultat tardif, transition illégale et mission terminale rouverte.

**Gate** : contrats lifecycle/idempotence/budget/timeout verts ; aucune table métier écrite.

**Rollback** : feature off ; données agentiques de fixtures réinitialisables.

### A1-04 — Construire les kill switches avant les runners

**Travail**

- implémenter global, `OPS-01`, `COS-01` et six capabilities exactes ;
- absence de ligne = stopped ;
- autoriser stop/réactivation uniquement à Mouaad via contrôle serveur ;
- relire le switch avant admission, snapshot, évaluation, persistance et publication ;
- annuler les missions actives de la portée avec raison et version.

**Gate** : `AC-10`, tests de concurrence et autorité verts avant toute évaluation OPS.

**Rollback** : global `stopped`; aucun autre chemin de réactivation.

### A1-05 — Construire la projection OPS minimisée

**Travail**

- partager les prédicats de `getToday()` pour éviter deux vérités ;
- corriger dans le contrat partagé la borne `promised_due_at <= as_of` ;
- distinguer indisponible, incomplet et vide ;
- produire snapshot, versions et watermark sans persister une copie métier ;
- exclure noms, contacts, textes de tâches, résumés, montants TIM et documents ;
- laisser intake `not_evaluated` faute de statut canonique.

**Gate** : minimisation/PII, cohérence temporelle, complétude et baseline `getToday()` vertes.

**Rollback** : revenir aux requêtes cockpit non agentiques ; aucun consommateur métier dépend du snapshot.

### A1-06 — Implémenter les sept règles OPS

**Travail**

- une fonction déterministe par règle, entrée/sortie fermées ;
- tester toutes les partitions de statut/date/référence ;
- empêcher une tâche future dans `promisedReturns` d’être considérée due ;
- empêcher l’échéance TIM « proche » de doubler une tâche déjà échue ;
- détecter comme unique incohérence 007 une tâche ouverte `is_next_action=1` sur projet ou Accord TIM terminal ;
- émettre `link_kind`/`link_ref` opaques uniquement depuis une relation structurée explicite, afin de relier une promesse/échéance à sa tâche sans texte ni heuristique ;
- persister seulement les constats positifs et produire `OpsCoverageV1` par règle avec `evaluated|not_evaluated|failed` ;
- écrire uniquement `agent_ops_shadow_finding` et `agent_trace`.

**Gate** : couverture exacte des fixtures, deux exécutions identiques et double preuve de non-mutation vertes.

**Rollback** : switch `OPS-01=stopped`; vues manuelles intactes.

### A1-07 — Implémenter COS minimal

**Travail**

- rejeter finding incomplet, stale ou hors mission OPS corrélée ;
- dédupliquer fingerprint exact, rapprocher les couples structurés `(scope, link_kind, link_ref)`, puis grouper par `(scope_kind, scope_id)` ;
- conserver toutes les raisons et choisir la raison principale par ordre fermé ;
- trier par `proposed_priority` (`urgent`, `high`, `normal`, `low`), puis classe de signal (promesse, overdue, incohérence, intake éventuel, absence d’action, due-soon), `due_at`, `detected_at`, et enfin scope/fingerprint stables ;
- conserver 0 à 7 items et compter les omis ;
- générer explications/actions via patrons fermés ;
- écrire seulement `agent_cos_briefing_item`, mission et trace.

**Gate** : `AC-05`, `AC-06`, `AC-07`, golden files et stabilité sous permutation verts.

**Rollback** : switch `COS-01=stopped`; findings OPS restent inspectables en test.

### A1-08 — Assembler le runner borné et la fraîcheur

**Travail**

- enchaîner exactement une OPS puis, si succès/fraîcheur, une COS ;
- appliquer checkpoint switch/budget/timeout à chaque frontière ;
- annuler COS sur watermark modifié ;
- sur race, invalider le briefing et revenir à « Aujourd’hui », sans créer aucune mission ;
- permettre seulement à Mouaad de déclencher ensuite une nouvelle OPS corrélée ; ce déclenchement reste une nouvelle mission et jamais un retry ;
- réconcilier lors de la prochaine commande les missions expirées, sans background worker.

**Gate** : chemins heureux, vide, erreur, timeout, kill et race de `ACCEPTANCE_TESTS.md` tous verts.

**Rollback** : désactiver la commande dédiée ; aucune lecture cockpit n’est affectée.

### A1-09 — Ajouter le BFF privé fermé

**Travail**

- ajouter seulement les routes proposées nécessaires aux tests ;
- appliquer Access, hostname, owner, CSRF/Origin, no-store, pagination et validation stricte ;
- refuser tout agent/type/capability hors allowlist ;
- garantir que les GET sont sans effet ;
- faire échouer tout `fetch` réseau dans les tests A1.

**Gate** : sécurité BFF, idempotence et `AC-13`/`AC-14` verts.

**Rollback** : feature off retourne 404/indisponible sur routes agentiques, routes cockpit historiques inchangées.

### A1-10 — Ajouter la présentation cockpit minimale

**Travail**

- panneau isolé « Briefing shadow » dans « Aujourd’hui » ;
- afficher état frais/stale/indisponible, 0..7 items, explication, heure et source ;
- résoudre les labels côté BFF autorisé sans les persister dans la trace ;
- bouton manuel de génération séparé de la lecture ;
- lien vers le dossier existant, jamais bouton d’action agentique ;
- contrôles kill switch dans un écran propriétaire explicite avec confirmation.

**Gate** : la page et les commandes cockpit fonctionnent avec panneau absent, flag off, runner en panne et briefing stale.

**Rollback** : masquer le panneau ; la vue « Aujourd’hui » redevient l’unique interface.

### A1-11 — Revue sécurité, autorité et non-régression

**Travail**

- exécuter AC complets, tests existants, build et diff check ;
- relire toutes les requêtes d’écriture et l’allowlist de tables ;
- injecter D1 indisponible, timeout, contenu hostile, PII canary, résultat tardif et réseau ;
- vérifier que global stopped bloque la totalité ;
- vérifier qu’une configuration non-fixture échoue fermée.

**Gate** : `T0` à `T7` de `ACCEPTANCE_TESTS.md` verts, aucun P0/P1 de revue.

**Rollback** : global stopped + feature off + retour au déploiement précédent ; tables additives laissées dormantes.

### A1-12 — Démonstration fixture-only et STOP

**Travail**

- faire exécuter par Mouaad une génération manuelle sur le jeu fictif ;
- démontrer les 15 AC, le journal reconstructible et les trois switches ;
- mesurer lisibilité, bruit et temps sur fixtures, sans prétendre à un KPI réel ;
- documenter écarts et décision go/no-go suivante.

**Gate** : acceptation explicite de Mouaad. La réussite ne change pas automatiquement le mode.

**STOP** : aucune donnée réelle, aucun cron, aucun modèle et aucun connecteur sans nouvelle décision.

## 11. Dépendances et gates bloquantes

| Dépendance | Besoin pour A1 fixture-only | Besoin avant réel |
|---|---|---|
| Socle cockpit/D1 actuel | tests et migration locale fiables | disponibilité/backup évalués |
| Cloudflare Access | contrats de sécurité et environnement de test | configuration production explicitement vérifiée |
| D-007 sensibilité | paquet fixture marqué synthétique, PII canaries | catégories/champs autorisés décidés |
| D-008 rétention | base de test jetable | TTL/purge/sauvegardes décidés |
| D-009 export/effacement | aucun export, reset complet des fixtures | procédure et copies inventoriées |
| D-013 budgets | budget logique fini par fixture, aucun coût monétaire | plafonds monétaires/département/jour décidés |
| D-014 timeout/retries | valeur explicite par test, 0 retry | valeurs et incident policy décidés |
| D-018 seuils | exactitude binaire des AC | seuils de bruit, valeur, délai et arrêt décidés |
| Modèle IA | aucun | toujours non requis pour ce briefing |
| Connecteurs | aucun | toujours non requis pour ce briefing |

La future application doit posséder un garde `fixture_only`. Toute tentative d’utiliser la tranche avec données réelles avant levée documentée des six gates doit retourner un refus `CP_PERMISSION_DENIED` ou `CP_CONTRACT_INVALID`, jamais seulement un warning.

## 12. Parallélisation sûre

La séquence critique A1-02 → A1-04 → A1-05 → A1-08 reste séquentielle. La migration, le lifecycle, les statuts, les types et le dispatcher privé ont un seul propriétaire à la fois.

Après gel du contrat et création des tests rouges, trois lanes limitées sont possibles :

| Lane | Travail isolable | Prérequis | Interdiction de chevauchement |
|---|---|---|---|
| A | schéma, ledger et switch avec tests de contrat | A1-01 | aucune modification concurrente de migration/statuts |
| B | fonctions pures OPS et COS sur DTO fixture figé | contrat de snapshot/résultat gelé | aucun accès D1, route ou UI |
| C | panneau cockpit sur réponses mockées du contrat BFF | contrat HTTP gelé | aucune écriture du dispatcher ou du schéma |

L’intégration se fait ensuite dans cet ordre : A, B, runner, BFF, C. Un changement du DTO ou du schéma arrête les lanes et repasse par revue ; il n’est pas résolu par deux adaptateurs concurrents.

Pour une équipe réduite, l’exécution séquentielle reste préférable : la fonctionnalité est petite et le risque principal est la divergence, pas le volume de code.

## 13. Stratégie de rollback et reprise

### 13.1 Avant activation

- configuration absente = tranche off ;
- switches absents = stopped ;
- tables additives vides n’influencent aucune requête métier ;
- routes agentiques peuvent répondre 404 lorsque la feature est off.

### 13.2 Incident fonctionnel

1. Mouaad active le kill switch global ;
2. toute mission non terminale est annulée au checkpoint suivant ;
3. le panneau affiche « indisponible — utiliser Aujourd’hui » ;
4. aucune commande métier n’est suspendue ;
5. diagnostic sur IDs techniques et fixtures, sans PII ;
6. réactivation seulement après correction, tests et décision de Mouaad ;
7. aucune mission terminale n’est rouverte.

### 13.3 Retour de version

- déployer la version applicative antérieure ;
- ne pas supprimer les cinq tables par une commande destructive ;
- les laisser dormantes jusqu’à migration de nettoyage séparée éventuellement approuvée ;
- vérifier que les migrations métier et commandes cockpit n’en dépendent pas ;
- conserver ou purger les fixtures selon le protocole de test, jamais appliquer une politique réelle non décidée.

### 13.4 Restauration D1

Une restauration doit laisser la tranche stopped et imposer `CP_RECONCILIATION_REQUIRED`. Les missions/briefings restaurés sont considérés stale jusqu’à comparaison explicite du watermark. Aucun résultat n’est republié automatiquement.

## 14. Complexité qualitative

| Bloc | Complexité | Pourquoi |
|---|---|---|
| cinq tables + migration | moyenne | contraintes, idempotence, append-only et non-interférence |
| ledger/lifecycle | moyenne à élevée | concurrence, résultat tardif, reprise sans retry |
| kill switches | élevée malgré peu de code | autorité, fail-closed, checkpoints et réactivation exclusive |
| snapshot OPS | moyenne | réutiliser `getToday` sans exposer PII ni dupliquer les règles |
| sept détecteurs | faible à moyenne | fonctions fermées, mais nombreuses frontières d’état/date |
| COS | moyenne | dédoublage multi-règles, ordre total, fraîcheur et explicabilité |
| BFF/UI | faible à moyenne | surface petite, sécurité privée non négociable |
| tests et preuve de non-mutation | élevée | partie la plus importante de la tranche |

Complexité globale : **moyenne à élevée en assurance, faible à moyenne en fonctionnalité**. Le volume de code doit rester réduit ; la difficulté réside dans les garanties de non-mutation, fraîcheur, arrêt et fallback.

## 15. Definition of Done proposée pour A1

A1 est terminée uniquement si :

1. exactement cinq tables additives supportent la tranche ;
2. seulement deux types de mission et six capabilities sont admis ;
3. les quinze critères d’acceptation passent ;
4. le briefing fonctionne byte-for-byte sans modèle et sans réseau ;
5. tout briefing stale disparaît avant affichage ;
6. le diff de chaque table métier est nul sur succès et échecs ;
7. global/agent/capability stoppent et Mouaad seul réactive ;
8. le cockpit manuel passe ses tests lorsque toute la tranche est cassée ou absente ;
9. aucun email, SMS, tâche, interaction, connecteur ou mutation métier n’est accessible ;
10. une configuration réelle est refusée tant que les six décisions restent ouvertes ;
11. aucune abstraction hors besoins OPS/COS et extension explicite BUY n’a été ajoutée ;
12. Mouaad accepte la démonstration fixture-only.

La Definition of Done ne contient aucun déploiement réel ni activation automatique. Le chantier s’arrête après démonstration et rapport.
