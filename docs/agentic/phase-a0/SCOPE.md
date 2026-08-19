# Phase A0 — Périmètre gelé de la première tranche agentique

Statut : **implementation readiness pack documentaire**.

Date de cadrage : **2026-08-19**.

Décideur : **Mouaad**.

Implémentation : **aucune dans cette phase**.

## 1. Objet

La Phase A0 transforme l’architecture cible en un incrément de développement borné. Elle ne construit ni agent, ni control plane, ni table, ni endpoint. Elle décrit la future Phase A1 avec assez de précision pour que son implémentation puisse être testée sans interprétation stratégique supplémentaire.

La future tranche A1 aura un seul résultat utile : **rendre visibles, sans mutation, les anomalies opérationnelles déjà prouvables par D1 et les condenser en un briefing déterministe de sept priorités au plus**.

Elle supportera uniquement :

- `OPS-01` en shadow mode ;
- `COS-01` minimal ;
- la forme minimale nécessaire pour accueillir plus tard `BUY-01`, sans implémenter aucune de ses capacités.

Ce périmètre ne constitue pas un moteur d’agents générique.

## 2. État actuel, A0 et future A1

| Horizon | Réalité |
|---|---|
| État actuel vérifié | Le cockpit, D1 et les contrats métier existent ; les vues « Aujourd’hui », tâches, projets et Accords TIM fournissent le socle déterministe. Aucun agent ni control plane agentique n’est actif. |
| Phase A0, présente livraison | Sept documents de préparation, fixtures seulement décrites, aucun code, aucune donnée réelle, aucun nouveau schéma déployé et aucun workflow actif. |
| Future Phase A1, après nouvelle validation | Control plane cloud-only minimal, `OPS-01` et `COS-01` sans modèle, tous deux limités à L0, sur fixtures fictives puis shadow mode explicitement autorisé. |
| Architecture cible ultérieure | Hybride et extensible à `BUY-01`, mais transport local, modèles et autres rôles restent hors A1. |

## 3. What already exists

La future implémentation doit réutiliser, sans créer une vérité parallèle :

- D1 comme source unique de vérité opérationnelle ;
- les statuts effectivement implémentés de `project`, `task` et `tim_agreement` ;
- les tâches `is_next_action`, versions, promesses structurées et échéances disponibles ;
- la lecture `getToday()` et les vues manuelles du cockpit, en particulier « Aujourd’hui » ; `getToday()` calcule déjà tâches échues, projets/TIM sans prochaine action, retours promis et dossiers `new|qualifying` ;
- les invariants « projet actif avec prochaine action ou visible comme anomalie » et « Accord TIM actionnable avec prochaine action ou visible comme anomalie » ;
- le cycle canonique des missions et le namespace d’erreurs `CP_*` ;
- l’autorité exclusive de Mouaad sur approbations, kill switches et réactivation.

Ce qui **n’existe pas encore** : tables de mission, journal agentique durable, ordonnanceur agentique, runner `COS-01` ou `OPS-01`, écran de briefing agentique, endpoint agentique, budget agentique, signal canonique « dossier non traité » et intégration à un fournisseur de modèle. La liste actuelle `newDossiers` repose seulement sur `project.status ∈ {new, qualifying}` ; elle ne prouve pas qu’un dossier n’a pas été traité.

## 4. Capacité future strictement autorisée

Chaque ligne décrit une capacité complète. Les détails de stockage et d’API restent à décider dans le reste du pack A0 ; aucune ligne n’autorise une implémentation pendant la présente phase.

| Capacité A1 | Entrée minimale | Règle / traitement | Sortie | Erreur et arrêt | Fallback sans agent | Mesure |
|---|---|---|---|---|---|---|
| Suivre une mission | Commande humaine explicite de Mouaad, type/version, agent, portée, timeout et budget logique explicites | Refuser tout type autre que `ops.shadow_scan.v1` ou `cos.daily_briefing.v1` ; appliquer le cycle canonique | Statut, tentative, résultat ou erreur, trace corrélée | Contrat, budget ou timeout absent → `CP_CONTRACT_INVALID` ; kill switch → `CP_KILL_SWITCH_ACTIVE` | Ouvrir les vues du cockpit ; aucune mission n’est nécessaire au travail manuel | Missions reconstructibles, transitions valides, zéro mission hors catalogue |
| Journaliser | Événement source éventuel, mission, tentative et résultat | Écriture append-only, identifiants opaques, coût logique et erreur nommée ; aucune PII | Trace ordonnée et corrélée | Écriture impossible → mission non déclarée réussie ; état `failed` ou incident explicite | Journal métier et vues D1 existants restent accessibles | 100 % des missions et tentatives corrélées, aucun secret/PII |
| Appliquer un kill switch | Décision authentifiée de Mouaad, portée `global\|agent\|capability`, raison | Bloquer toute nouvelle assignation, invalider `execution_epoch` et `control_fingerprint`, annuler la mission active ; jamais s’auto-réactiver | État de coupure et trace d’autorité | Autorité ou portée invalide → refus et audit | Cockpit en mode manuel | Zéro mission commencée dans une portée coupée ; délai d’arrêt mesuré |
| Détecter avec `OPS-01` | Snapshot D1 minimisé, cohérent, versionné, horodaté | Évaluer uniquement les sept règles fermées de `OPS01_SHADOW_SPEC.md` | Résultat de mission contenant des observations expliquées, jamais des tâches métier | Snapshot incomplet/stale → échec explicite, pas « aucune anomalie » | Vues Aujourd’hui, tâches, intake et TIM | Couverture des fixtures, faux positifs, anomalies manquées, mutation métier = 0 |
| Consolider avec `COS-01` | Résultat courant et valide d’une mission OPS | Filtrer, dédupliquer, grouper par dossier, ordonner avec la règle gelée | Briefing déterministe de 0 à 7 éléments expliqués | Watermark changé → invalider et suggérer à Mouaad un nouveau déclenchement manuel ; aucune mission automatique, aucun ancien briefing présenté comme courant | Vue Aujourd’hui triée déterministement | Maximum 7, explication complète, reproductibilité, doublons regroupés |
| Afficher le briefing | Artefact COS valide, watermark courant | Résoudre les libellés uniquement dans la couche cockpit autorisée ; ne proposer que des actions humaines textuelles | « Aujourd’hui — N priorité(s) » et liens vers les sources | Rendu absent ou mission échouée → état `degraded\|manual_only` | Cockpit existant, sans dépendance agentique | Temps de lecture, items consultés, aucun blocage du cockpit |

## 5. Périmètre exact du control plane A1

Le futur control plane minimal pourra seulement :

1. admettre l’un des deux types de mission fermés ;
2. affecter cette mission à `OPS-01` ou `COS-01` selon une correspondance fixe ;
3. faire respecter statut, priorité, déclencheur, source, temps, timeout et budget logique ;
4. enregistrer tentatives, résultats, coûts logiques, approbation éventuelle et erreurs ;
5. appliquer un kill switch global, par agent ou par capacité ;
6. comparer le watermark opérationnel avant publication d’un briefing ;
7. exposer l’état nécessaire au cockpit privé et à l’audit.

Il ne planifie pas des graphes arbitraires, ne crée pas de sous-agent, ne découvre pas d’outil, ne choisit pas de modèle, ne compose pas de prompt, ne gère pas de connecteur externe et n’exécute aucune commande métier.

## 6. Frontières d’autorité

### 6.1 D1 et données métier

- D1 reste la seule autorité sur projets, tâches, interactions, personnes et Accords TIM.
- `OPS-01` reçoit une projection de lecture minimisée ; il ne reçoit aucun accès SQL d’écriture.
- `COS-01` lit uniquement les résultats OPS valides et l’état technique des missions ; il ne relit pas directement les dossiers.
- Une observation, un résultat de mission ou une ligne de briefing n’est ni une tâche, ni une interaction, ni une décision, ni une prochaine action métier.
- Les tables métier doivent être prouvées identiques avant et après chaque mission de fixture.

### 6.2 Autonomie

Toutes les capacités commencent à **L0 — Observation**. Le stockage d’un résultat et de sa trace est un effet technique du control plane, pas une mutation métier ni une alerte L2.

Dans A1 :

- aucun agent ne crée de tâche ou de mission ; le control plane déterministe crée seulement une mission allowlistée depuis une commande humaine explicite de Mouaad ;
- aucun agent n’approuve, n’envoie, ne publie, ne supprime, ne fusionne et ne change un statut métier ;
- les « actions proposées » du briefing sont du texte explicatif non actionnable, sans bouton d’exécution agentique ;
- Mouaad est le seul approbateur et le seul détenteur des kill switches ; son silence vaut attente ou expiration, jamais accord.

### 6.3 Disponibilité

Le chemin manuel cockpit → D1 ne dépend jamais du control plane. Une panne, un timeout, un budget nul ou un kill switch doit seulement masquer ou marquer stale la couche agentique. Les lectures et commandes humaines existantes continuent.

## 7. Données et fixtures

Seules des fixtures entièrement fictives sont autorisées. Elles utilisent des identifiants comme `PRJ-DEMO-001`, `TASK-DEMO-001`, `TIM-DEMO-001` et `PRJ-DEMO-NEW-001`.

Sont interdits dans les fixtures, résultats, captures et journaux :

- toute identité ou coordonnée réelle ;
- toute donnée d’une personne réelle ou identifiable ;
- un Accord TIM réel, un montant réel ou une référence OMEGA réelle ;
- email, téléphone, adresse, audio, transcription, document, secret ou clé API réels.

Le label affiché reste un alias fictif. Dans une activation réelle ultérieure, le control plane conserverait seulement un identifiant opaque ; le cockpit autorisé résoudrait le libellé à l’affichage sans le transmettre à `COS-01`.

## 8. NOT in scope

Sont explicitement exclus de A0 et de la future A1 :

- moteur d’agents générique, graphe arbitraire, délégation dynamique ou création de sous-agents ;
- activation de `BUY-01`, `SEL-01`, `MKT-01`, `GROW-01`, `PROD-01`, `FIN-01` ou `TRUST-01` ;
- modèle IA, prompt, vector store, mémoire sémantique ou reformulation générative ;
- Gmail, SMS, Resend, Calendar, Drive, Obsidian, DVF, Yanport, OMEGA, réseau social ou autre connecteur ;
- email, SMS, invitation, export, publication, paiement ou autre action externe ;
- approbation générique, paiement, consentement, effacement, fusion, mandat, offre, matching final, migration ou déploiement ;
- création ou modification d’une tâche métier, d’un statut, d’un stade, d’une interaction, d’un critère ou d’un Accord TIM ;
- briefing hebdomadaire, revue mensuelle, objectifs d’entreprise et orchestration des sept autres rôles ;
- runtime local et pont hybride effectif ; A1 préserve seulement une frontière d’adaptateur pour un besoin futur démontré.

`BUY-01` influence uniquement deux choix de non-régression : identifiants de type/version stables et affectation par catalogue fermé. Aucun champ ou abstraction propre à l’acquisition n’est ajouté « au cas où ».

## 9. Décisions ouvertes : recommandations provisoires et gates

Ces recommandations permettent les fixtures et le shadow mode synthétique. Elles ne transforment pas les décisions en `decided`.

| Décision ouverte | Recommandation provisoire A0/A1 fictive | Gate avant toute donnée réelle |
|---|---|---|
| D-007 — sensibilité | Marquer tout jeu `fixture_only=true` et `contains_personal_data=false`; utiliser seulement identifiants opaques et champs opérationnels allowlistés | Classification définitive, manifeste de champs et fournisseurs approuvés |
| D-008 — rétention | Fixtures sources fictives versionnées ; résultats de test supprimables par reset ; journaux synthétiques avec expiration courte et jamais illimitée | Durées par finalité, sauvegardes et purge décidées et testées |
| D-009 — export/effacement | Aucun export de personne ; reset intégral des données synthétiques comme seul mécanisme de test | Procédure multi-système, identité, portée, audit et restauration validés |
| D-013 — budgets monétaires | Aucun appel payant ; budget logique obligatoire et fini ; valeur absente = admission refusée | Devise, plafond mission/jour et règles d’augmentation décidés |
| D-014 — timeouts/retries | Chaque scénario fictif fournit un timeout fini explicite ; absence = admission refusée ; zéro retry automatique ; aucune valeur de production n’est proposée ; toute régénération est une nouvelle mission corrélée | Valeurs par capacité, circuit breaker et conditions de retry décidés après tests de panne |
| D-018 — seuils de réussite | Instrumenter couverture, bruit, temps gagné, coût logique et incidents sans déclarer de go-live | Baseline manuelle et seuils go/no-go explicitement décidés |

Une gate non satisfaite se traduit par une capacité `fixture_only` ou désactivée, jamais par une valeur par défaut permissive.

## 10. Déclenchement et fraîcheur

La Phase A0 n’active aucun cron. Pour la future A1 :

- le déclenchement initial recommandé est manuel dans un environnement de fixtures ;
- une fenêtre quotidienne ne pourra être configurée qu’après validation de l’implémentation ;
- un scan OPS produit un `operational_watermark` couvrant sa photographie cohérente ;
- avant de présenter le briefing, le control plane compare ce watermark à l’état opérationnel courant ;
- tout changement invalide l’ensemble du briefing ; seul un nouveau déclenchement manuel de Mouaad crée une **nouvelle mission OPS corrélée**, jamais un retry caché ;
- si aucun nouveau snapshot cohérent n’est obtenu, le briefing n’est pas publié comme courant et la vue manuelle prend le relais.

Cette règle garantit notamment qu’une tâche terminée après le scan ne reste pas dans le briefing.

## 11. Critères de sortie de la Phase A0

A0 est terminée seulement si :

1. les sept documents demandés existent et utilisent les mêmes types de mission, règles, statuts et frontières ;
2. les sept règles OPS sont fermées et testables sur fixtures ;
3. le tri, le dédoublage, la fraîcheur et le maximum de sept éléments COS sont déterministes ;
4. le schéma proposé distingue strictement données métier, résultats de mission et journal ;
5. chaque scénario d’acceptation possède fixture, attendu et preuve de non-mutation ;
6. les kill switches global, agent et capacité ont une autorité et un effet non ambigus ;
7. les décisions D-007, D-008, D-009, D-013, D-014 et D-018 restent visiblement ouvertes avec gates réelles ;
8. le modèle de menace couvre PII, élévation de droits, stale data, budget, reprise et indisponibilité ;
9. l’implémentation est découpée sans moteur générique ni connecteur ;
10. le diff Git ne contient que de la documentation A0 et la mise à jour explicite des décisions validées.

La sortie de A0 autorise seulement une proposition de Phase A1. Elle n’autorise ni son développement, ni un déploiement, ni l’usage de données réelles.
