# Roadmap progressive du LEVOIS Agentic Company OS

## 1. Principe de construction

Chaque étape doit fournir une capacité utilisable et désactivable. La roadmap n'autorise aucune réalisation : elle ordonne le travail futur après validation de Mouaad.

La séquence suit quatre règles :

1. rendre le travail manuel plus fiable avant d'ajouter de l'IA ;
2. construire autorité, journal, approbation, budget et kill switch avant tout agent spécialisé ;
3. commencer avec des données fictives, puis shadow, puis proposition, puis exécution interne bornée ;
4. ne passer à l'étape suivante que si le gain net dépasse la charge de revue et les coûts.

## 2. Portes communes à toutes les étapes

| Porte | Preuve attendue |
|---|---|
| G0 Autorité | Sans action humaine autorisée, aucune vérité métier confirmée ne change |
| G1 Sécurité | Accès mono-dossier, secrets serveur, redaction, prompt injection et révocation testés |
| G2 Manuel | Le cockpit et le workflow humain restent utilisables sans agent/modèle/connecteur |
| G3 Coût | Budget, timeout, retries et kill switch testés avant données réelles |
| G4 Qualité | Cas fictifs heureux, incomplets, périmés, contradictoires et hostiles couverts |
| G5 Observabilité | Mission, source, version, coût, approbation, résultat et erreur reconstruisibles |
| G6 Valeur | Temps gagné ou risque réduit mesuré ; faux positifs et charge d'approbation acceptables |
| G7 Réversibilité | Activation par capacité, pause immédiate et rollback sans perte métier |

Une étape peut être arrêtée même si elle fonctionne techniquement si elle n'améliore pas les conversations qualifiées, la continuité ou le temps de Mouaad.

### Socle opérationnel préalable — gate, pas neuvième étape agentique

Avant l’étape 1, un test de disponibilité doit confirmer dans le cockpit réellement exploitable : intake/triage minimal, personne et projet, interaction avec promesse, tâche métier confirmée, Accord TIM minimal, vue « Aujourd’hui » déterministe, commandes humaines, audit et Cloudflare Access. Il faut mesurer manuellement le temps de préparation et les oublis sur des cas fictifs puis, seulement après autorisation ultérieure, sur le faible volume réel.

Si un de ces éléments n’est pas disponible ou fiable, la roadmap agentique s’arrête. LEVOIS termine d’abord la tranche verticale correspondante du modèle/cockpit selon `MIGRATION_PLAN.md`; aucun agent, mission ou table agentique ne sert à contourner ce prérequis. Cette gate valide l’existant au moment de construire, elle n’autorise aucune modification dans la présente phase documentaire.

## 3. Préconditions : décisions et contrats

| Champ | Définition |
|---|---|
| Bénéfice | Évite de coder des ambiguïtés d'autorité, de rétention, de budget ou de connecteur |
| Dépendances | Validation de `DECISIONS_REQUIRED.md` et cohérence des documents agentiques |
| Périmètre | Définition de la conversation qualifiée, événements, missions, approbations, erreurs, scopes et politiques |
| Livrable | ADR futurs, contrats versionnés et plan de tests, sans activation |
| Test | Revue sur scénarios fictifs ; chaque action sensible possède approbateur et fallback |
| Coût | Temps de décision et revue ; aucun coût fournisseur requis |
| Risque | Transformer des paramètres inconnus en fausses certitudes |
| Réussite | Décisions bloquantes explicites, inconnues assumées et non-objectifs acceptés |
| Décision humaine | Mouaad valide périmètre, North Star, V1, cible hybride et première tranche cloud-only/hybrid-ready |

**Condition d'arrêt** : désaccord sur l'autorité de D1, les interdictions absolues ou la conservation du mode manuel.

## 4. Étape 1 : control plane minimal

### Capacité utilisable

Créer et suivre une mission fictive ou interne, voir son état, ses sources, son budget, ses erreurs et ses approbations, puis la stopper.

| Champ | Définition |
|---|---|
| Bénéfice | Rend toute future exécution bornée, visible et réversible |
| Dépendances | Préconditions et gate de socle ; Cloudflare Access ; modèle métier/cockpit stabilisé ; aucun modèle requis |
| Périmètre | État durable control plane colocalisé dans D1, missions, tentatives, inbox/outbox, dépendances minimales, identités d'agents, trust gateway déterministe, journal, approbations, coûts natifs/monétaires, timeouts, kill switches et `restore_epoch` |
| Livrable | Control plane en mode test puis shadow ; `COS-01` minimal pour planifier et consolider |
| Tests | États/transitions ; lint de tout `event_name` et allowlist événement→mission ; idempotence ; fencing lease/restore ; droits expirés ; budget dépassé ; approval stale ; kill switch ; panne sans impact cockpit |
| Coût | Infrastructure légère + développement ; plafonds réels décidés avant activation |
| Risque | Construire un orchestrateur générique avant un cas d'usage ; créer une seconde vérité |
| Réussite | Une mission peut être reconstruite de bout en bout et ne contourne aucune commande métier |
| Décision humaine | Validation du modèle de mission, de la file d'approbation et du budget |

**Hors périmètre** : queue distribuée sophistiquée, agents dynamiques, orchestration multi-fournisseur, exécution externe.

**Condition d'arrêt** : impossible de garantir qu'un output agentique ne modifie pas directement les agrégats métier.

## 5. Étape 2 : agent Opérations

### Capacité utilisable

Produire un briefing court et détecter les oublis opérationnels sans envoyer ni modifier une donnée confirmée.

| Champ | Définition |
|---|---|
| Bénéfice | Réduit les dossiers sans prochaine action, promesses oubliées et temps de préparation quotidien |
| Dépendances | Étape 1 ; vues cockpit minimisées ; tâches/interactions/TIM disponibles et fiables ; contrôles TIM déterministes sans FIN-01 actif |
| Périmètre | Dossiers sans prochaine action, tâches échues, promesses dues, nouveaux contacts à trier, TIM à surveiller, anomalies de complétude |
| Livrable | `OPS-01` en shadow puis niveau 1/2 ; briefing 3 à 7 items ; propositions de tâches/alertes |
| Tests | 0 dossier, 20 dossiers, doublons, dates/fuseaux, données périmées, dossier clos, TIM sans tâche, panne D1, faux positif ; un work item agentique ne ferme jamais `project_without_next_action` |
| Coût | Majoritairement déterministe ; modèle facultatif pour compression du briefing |
| Risque | Bruit, fatigue d'approbation et fausse urgence |
| Réussite | Moins d'oublis, briefing lu rapidement, faux positifs sous seuil décidé, charge nette réduite |
| Décision humaine | Mouaad choisit les règles de priorité, heures, SLA et seuils |

**Progression d'autonomie** : shadow -> propositions -> work items/alertes internes bornés. Le niveau 4 n'est envisagé que pour rapport interne, alerte de fraîcheur ou classement provisoire réversible ; il ne crée jamais une tâche métier D1.

**Condition d'arrêt** : le briefing dépasse régulièrement 7 items ou demande plus de temps de revue que la préparation actuelle.

## 6. Étape 3 : agent Acquéreur

### Capacité utilisable

Préparer un appel acquéreur, proposer une structuration des critères/scénarios et préparer une fiche Yanport manuelle à partir d'une révision validée.

| Champ | Définition |
|---|---|
| Bénéfice | Évite de recommencer depuis zéro et réduit les annonces inutiles |
| Dépendances | Étapes 1-2 ; modèle central personne/projet/recherche ; révisions et critères ; consentements ; export manuel défini |
| Périmètre | Briefing, informations à confirmer, critères proposés, scénarios preferred/acceptable/conditional, contradictions, fiche Yanport, analyse d'annonce proposée |
| Livrable | `BUY-01` niveaux 1/2 ; file de validation granulaire ; export interne versionné |
| Tests | Critères contradictoires, unknown, dur non respecté, recherche stale, annonce incomplète, double source, correction humaine, absence de modèle |
| Coût | Par dossier/annonce ; modèle économique évalué ; cache uniquement données marché versionnées |
| Risque | Transformer une préférence en exclusion, inventer un matching ou noyer Mouaad de propositions |
| Réussite | Appels mieux préparés, critères confirmés plus vite, moins d'annonces inutiles, retours exploitables |
| Décision humaine | Confirmation des critères/scénarios, validation du bien/matching et envoi client |

**Hors périmètre** : scraping non autorisé, API Yanport supposée, envoi autonome, décision d'offre.

**Condition d'arrêt** : une proposition agentique est confondue avec un critère confirmé ou un matching final.

## 7. Étape 4 : agent Vendeur

### Capacité utilisable

Préparer la qualification, le rendez-vous et le suivi d'une situation vendeur sans produire une estimation définitive.

| Champ | Définition |
|---|---|
| Bénéfice | Relie signaux, attentes et prochaines décisions ; réduit les ajustements au hasard |
| Dépendances | Étapes 1-2 ; modèle vendeur ; moteur déterministe existant ; interactions et tâches fiables |
| Périmètre | Vendeur futur, annonce en ligne, audit de signaux, préparation rendez-vous, suivi de commercialisation, questions à confirmer |
| Livrable | `SEL-01` niveaux 1/2 ; briefing vendeur ; propositions de prochaine action |
| Tests | Données insuffisantes, portail bloqué, vues sans contacts, visites sans offre, changement de prix non confirmé, source obsolète, mandat absent |
| Coût | Analyse à la demande ; pas de veille continue avant preuve de valeur |
| Risque | Faire passer une hypothèse pour estimation, promesse ou conseil définitif |
| Réussite | Rendez-vous mieux préparés, décisions sourcées, moins de changements non expliqués |
| Décision humaine | Estimation, stratégie, mandat, prix, communication et offre |

**Condition d'arrêt** : le système formule une valeur de bien ou une recommandation commerciale sans validation professionnelle.

## 8. Étape 5 : croissance et contenu

### Capacité utilisable

Transformer des motifs terrain anonymisés et validés en briefs de contenus reliés à une cible, une destination et une hypothèse mesurable.

| Champ | Définition |
|---|---|
| Bénéfice | Évite la production de contenu déconnectée des vrais problèmes |
| Dépendances | LEVOIS Lab gouverné ; consentement et anonymisation ; parcours et analytics ; bibliothèque média ; trust gateway déterministe et revue humaine active, sans exiger le runtime TRUST-01 |
| Périmètre | Agrégation de motifs, sujet, angle, script/page, CTA, destination, contrôle conformité, mesure de conversation qualifiée |
| Livrable | `GROW-01` niveau 1 à 3 ; fiche contenu ; file de revue conjointe Mouaad/Conformité |
| Tests | Motif isolé, verbatim identifiant, chiffre non sourcé, contenu sans destination, asset sans droit, CTA trompeur, performance sans causalité |
| Coût | Budget par contenu et canal ; crédits médias toujours approuvés |
| Risque | Optimiser les vues, révéler un dossier ou industrialiser du contenu générique |
| Réussite | Chaque contenu a une origine, destination, résultat et enseignement ; conversations utiles mesurées |
| Décision humaine | Sujet sensible, affirmation, script final, média, coût, publication et réponse |

**Condition d'arrêt** : impossibilité de relier le contenu à un problème réel anonymisé ou à une destination utile.

## 9. Étape 6 : intelligence marché

### Capacité utilisable

Contrôler la fraîcheur des sources et proposer des opportunités à vérifier à partir de DVF, annonces autorisées et exports manuels.

| Champ | Définition |
|---|---|
| Bénéfice | Réduit les recherches répétitives et les données périmées |
| Dépendances | Mémoire marché, règles de source/licence, connecteurs réellement disponibles, agents acquéreur/vendeur |
| Périmètre | DVF versionné, snapshots, changements de prix, nouvelles annonces, communes/quartiers, comparaison et fraîcheur |
| Livrable | `MKT-01` niveau 0 à 2 ; alertes sourcées ; facteurs explicables |
| Tests | Source absente, annonce retirée, doublon, changement trompeur, géographie ambiguë, date périmée, quotas/429, robots/conditions d'usage |
| Coût | Priorité aux sources/versionnements existants ; veille limitée aux dossiers actifs |
| Risque | Faux positif, scraping interdit, donnée passée traitée comme demande actuelle |
| Réussite | Moins de temps de veille, fraîcheur visible, taux de faux positifs accepté |
| Décision humaine | Validation d'une opportunité, interprétation commerciale et transmission |

**Condition d'arrêt** : source, droit ou fraîcheur invérifiable.

## 10. Étape 7 : produit et QA

### Capacité utilisable

Transformer les frictions validées en tickets reproductibles, tests proposés et mesure post-changement.

| Champ | Définition |
|---|---|
| Bénéfice | Ferme la boucle terrain -> produit sans mélanger analytics et vérité client |
| Dépendances | Lab, erreurs redacted, GitHub, pipeline de tests, métriques de parcours |
| Périmètre | Triage friction, hypothèse, ticket, critères d'acceptation, plan de test, vérification de régression, mesure |
| Livrable | `PROD-01` niveau 1/2 ; backlog préparé ; aucun commit ou déploiement autonome |
| Tests | Erreur sans PII, doublon de ticket, corrélation trompeuse, absence de reproduction, régression, métrique manquante |
| Coût | Budget d'analyse et de test ; aucun outil payant sans approbation |
| Risque | Créer du backlog bruité ou modifier le produit pour une anecdote |
| Réussite | Problèmes reproductibles, décisions claires, impact mesuré après validation humaine |
| Décision humaine | Priorité, architecture, modification, commit, déploiement et rollback |

**Condition d'arrêt** : aucune preuve reproductible ou métrique de résultat plausible.

## 11. Étape 8 : agents spécialisés finance, TIM et conformité

### Capacité utilisable

Surveiller séparément accords, opérations, rémunérations, paiements, coûts, consentements et droits sans automatiser les décisions sensibles.

| Champ | Définition |
|---|---|
| Bénéfice | Réduit les oublis financiers et de conformité, rend les coûts agentiques pilotables |
| Dépendances | Control plane mature ; modèle TIM ; politiques de rétention/consentement ; données initialisées manuellement et auditées |
| Périmètre | `FIN-01` : états TIM, estimé/dû/payé, échéances et budgets ; `TRUST-01` : consentements, droits, promesses, export, rétention, effacement |
| Livrable | Alertes, revues et mises en attente ; aucune décision ou exécution financière |
| Tests | Trois axes TIM indépendants, paiement dupliqué, montant inconnu, consentement retiré, droit média absent, effacement lié à obligation, dépassement coût |
| Coût | Priorité aux règles déterministes ; revue humaine des exceptions |
| Risque | Faux sentiment de conformité, confusion estimé/dû/payé, exposition de données restreintes |
| Réussite | Aucun TIM ouvert sans prochaine action ; coûts visibles ; actions non conformes bloquées avant exécution |
| Décision humaine | Accord, statut engageant, montant dû, paiement, consentement, export, suppression et politique |

**Condition d'arrêt** : l'agent devient source d'une obligation, d'un consentement ou d'un montant dû.

## 12. Ordre de déploiement futur

```text
Préconditions Décisions + socle
    |
Étape 1 Control plane
    |
Étape 2 Opérations
    +------------------+
    |                  |
Étape 3 Acquéreur   Étape 4 Vendeur
    |                  |
    +--------+---------+
             |
       Étape 5 Croissance
             |
       Étape 6 Marché
             |
       Étape 7 Produit
             |
       Étape 8 Finance/Conformité
```

L'ordre 5/6 peut être inversé si la veille manuelle est le principal goulot mesuré. Le trust gateway, la minimisation, le retrait de consentement, les droits et les contrôles de coût existent dès les préconditions/étape 1 sous forme déterministe ou humaine. Finance/TIM possède une surveillance déterministe minimale avant et pendant l'étape 2. Seuls les runtimes spécialisés FIN-01/TRUST-01 et leurs analyses restent en étape 8 ; aucune opération sensible n’attend un agent pour être protégée.

## 13. Stratégie de parallélisation future

Après stabilisation du control plane, certaines préparations peuvent être menées en parallèle, mais pas les changements d'autorité :

| Lane | Travail futur | Dépendance | Conflit principal |
|---|---|---|---|
| A | Opérations puis briefing | Control plane | Modèle tâches/interactions |
| B | Cas fictifs acquéreur et vendeur | Contrats et vues | Commandes métier partagées |
| C | Politiques sécurité/coût et évaluations | Control plane | Matrice d'autorité |
| D | Gouvernance Lab/média | Décisions conformité | Métadonnées et droits |

Les lanes B acquéreur/vendeur peuvent préparer leurs jeux de tests séparément, mais les mutations et événements partagés doivent être intégrés séquentiellement. Aucun travail en parallèle ne justifie plusieurs schémas concurrents.

## 14. Mesure de progression

Une étape n'est pas « terminée » parce que l'agent répond. Elle est terminée lorsque :

- les cas fictifs et échecs ont été testés ;
- le fallback manuel est documenté et exercé ;
- la sécurité et le coût sont visibles ;
- Mouaad comprend et peut annuler l'action ;
- le gain net est mesuré sur la période décidée ;
- les faux positifs, erreurs et approbations restent sous les seuils décidés ;
- aucun incident d'autorité n'a eu lieu ;
- la capacité peut être désactivée sans perdre la donnée métier.

## 15. Première tranche de développement proposée

Après validation explicite uniquement :

1. passer la gate de socle opérationnel et finaliser les décisions P0 de `DECISIONS_REQUIRED.md` ;
2. spécifier les contrats de mission, tentative, approbation, budget et journal ;
3. définir les vues minimales nécessaires à `OPS-01` ;
4. construire les transitions et tests d'autorité avec fixtures fictives ;
5. ajouter le briefing en shadow, sans modèle au départ si les règles suffisent ;
6. comparer le briefing à la préparation manuelle pendant une période décidée ;
7. autoriser uniquement les propositions de tâches après preuve ;
8. décider ensuite si un modèle améliore réellement la compression ou si le déterministe suffit.

Le premier composant agentique/directeur à construire est **`COS-01` minimal**, indissociable du control plane et limité à la planification/consolidation interne. Le premier agent spécialisé est ensuite **`OPS-01`**. Le second agent spécialisé est **`BUY-01`**, seulement après preuve que les opérations réduisent la charge de Mouaad.
