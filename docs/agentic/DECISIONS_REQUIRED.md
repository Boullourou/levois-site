# Décisions requises de Mouaad

## 1. Mode d'emploi

Ce registre sépare les décisions nécessaires avant construction de celles qui peuvent attendre un incrément ultérieur. Une recommandation n'est pas une décision. Tant qu'une ligne P0 n'est pas tranchée, la capacité qu'elle bloque reste désactivée.

États possibles : `open`, `decided`, `deferred`, `rejected`, `superseded`. Toutes les lignes sont `open` à la création de ce document.

Responsable de décision initial : Mouaad pour chaque ligne, avec consultation du rôle indiqué par le sujet. Échéance : avant la construction ou l'activation de la capacité inscrite dans « Bloque » ; aucune date calendaire fictive n'est imposée. Lorsqu'une décision est prise, son statut, sa date, sa preuve et son échéance de réexamen doivent être ajoutés au registre.

## 2. P0 : avant toute construction agentique

| ID | Décision | Pourquoi maintenant | Recommandation | Preuve/entrée requise | Bloque |
|---|---|---|---|---|---|
| D-001 | Confirmer la North Star et définir précisément une « conversation humaine qualifiée » | Sans définition, les agents optimisent des proxys | Exiger activation volontaire, contexte suffisant, décision/prochaine action et issue enregistrée | Exemples fictifs positifs/négatifs | KPI, contenu, acquisition |
| D-002 | Valider la cible hybride et la première tranche cloud-only/hybrid-ready | Détermine frontières, secrets et accès iPhone sans imposer tout de suite un transport local complexe | Monolithe modulaire cloud pour état/approbations avec interface de runner ; local/isolé différé jusqu’à besoin fichiers/Obsidian mesuré | Revue `TECHNICAL_OPTIONS.md` | Frontières du control plane, pas son transport local initial |
| D-003 | Confirmer D1 comme unique autorité opérationnelle | Évite un CRM ou journal agentique concurrent | Garder agents, Obsidian et GitHub comme couches non souveraines | Validation architecture client | Tout le système |
| D-004 | Valider les neuf rôles logiques et seulement deux agents actifs en première tranche | Empêche l'organisation de devenir une usine | Activer `COS-01` minimal et `OPS-01`, garder les sept autres comme contrats | Revue charge 5-20 dossiers | Roadmap V1 |
| D-005 | Valider les interdictions absolues d'autonomie | Définit le test d'autorité | Aucun paiement, consentement, fusion, suppression, offre, mandat, matching final, publication ou envoi sensible | Matrices autorité/autonomie | Sécurité |
| D-006 | Définir qui peut approuver en l'absence de Mouaad | Le silence ou l'absence ne peut valoir accord | Aucun délégataire V1 ; expiration et attente | Organisation réelle | Approbations |
| D-007 | Définir les catégories de sensibilité et données interdites aux modèles | Conditionne vues et connecteurs | Adopter les cinq classes proposées et interdire `SECRET` | Revue juridique/confidentialité | Contextes et fournisseurs |
| D-008 | Définir la politique de rétention opérationnelle, agentique et temporaire | Les docs existantes laissent la durée ouverte | Durées par finalité, contexte modèle plus court, aucun illimité par défaut | Exigences légales et SAFTI | D1, logs, fournisseurs |
| D-009 | Définir le processus d'export et d'effacement | La restauration et les obligations TIM exigent une doctrine | Inventaire multi-système, approbation, manifeste et registre non identifiant | Revue juridique | Gouvernance donnée |
| D-010 | Définir l'enveloppe d'événement canonique et sa version initiale | Conditionne idempotence et causalité | Valider les champs de `EVENT_CATALOG.md` sans payload universel | Revue architecture | Control plane |
| D-011 | Valider le cycle de mission et les transitions | Évite les états implicites | Cycle proposé ; reprise = nouvelle tentative corrélée | Scénarios de panne fictifs | Control plane |
| D-012 | Choisir le modèle d'approbation | Évite les approbations génériques rejouables | Action + cible + contenu + version + expiration | Scénarios email, critère, contenu, TIM | Actions sensibles |
| D-013 | Fixer les budgets initiaux et la devise de pilotage | Un budget absent doit bloquer, pas être illimité | Petits plafonds par mission/jour, valeurs décidées après benchmark fictif | Tarifs fournisseurs et valeur attendue | Tout appel payant |
| D-014 | Fixer timeouts, retries et seuils de circuit breaker | Empêche boucles et doubles actions | Retry seulement lecture/idempotent ; aucun rejeu externe | Tests de panne | Exécution |
| D-015 | Définir le kill switch et l'autorité de réactivation | La révocation doit précéder l'autonomie | Mouaad seul V1 ; global, département, agent, connecteur, mission | Runbook fictif | Activation |
| D-016 | Définir les vues minimales de `OPS-01` | Première tranche et risque d'exposition | Uniquement IDs opaques, statuts, tâches, échéances, promesses et flags TIM nécessaires | Audit champs cockpit | Étape 2 |
| D-017 | Définir les règles du briefing 3 à 7 items | Sans règle, il devient un inventaire | Priorité par urgence, engagement humain, risque et blocage ; regroupement des doublons | Exemples de journées fictives | `OPS-01` |
| D-018 | Définir les seuils de réussite de la première tranche | Condition de go/no-go | Temps net gagné, faux positifs, charge d'approbation, oublis et incidents d'autorité | Baseline manuelle | Passage à BUY-01 |

## 3. P1 : avant agents métier ou connecteurs

| ID | Décision | Recommandation | Dépendance / capacité bloquée |
|---|---|---|---|
| D-019 | Politique de consentement par finalité et canal | Consentement explicite, versionné, révocable ; ne jamais inférer depuis l'historique | Acquéreur, vendeur, transcription, contenus |
| D-020 | Définition et confirmation des critères acquéreur | Agent propose ; Mouaad/personne confirme ; modification versionnée | `BUY-01` |
| D-021 | Règle d'un matching « pertinent » | Facteurs explicables, `unknown` != succès, dur confirmé non compensable | `BUY-01`, `MKT-01` |
| D-022 | Restitution personnalisée de référence | Choisir écran/email/PDF/combinaison et ce qui fait autorité | Offre personnalisée |
| D-023 | Processus Yanport | Conserver export manuel, versionné et hashé ; ne supposer aucune API | Fiche Yanport |
| D-024 | Sources d'annonces autorisées et droits d'usage | Liste blanche source par source ; absence de droit = pas d'ingestion | Intelligence marché |
| D-025 | Fraîcheur par type de donnée marché | `valid_until` par source/usage, affichage stale obligatoire | `MKT-01` |
| D-026 | Politique d'utilisation DVF | Repère historique sourcé ; jamais estimation ni preuve de demande actuelle | Vendeur, marché, contenu |
| D-027 | Politique Gmail | Message explicitement sélectionné, brouillon seulement, aucun accès boîte entière | Connecteur Gmail |
| D-028 | Politique Calendar | Free/busy minimal puis création humaine ; gérer fuseaux, doublons et annulations | Calendar |
| D-029 | Politique Drive | Fichiers/dossiers allowlistés, aucun search global, partages contrôlés | Drive |
| D-030 | Format du pont Obsidian | Unidirectionnel, manifeste/hash, chemin borné, politique de conflit | Mémoire stratégique |
| D-031 | Fournisseur de transcription et consentement | Comparer local/distant, rétention, région, entraînement, coût, qualité | Transcription |
| D-032 | Fournisseur(s) de modèles | Benchmark par tâche, région, rétention, coûts, portabilité et sorties structurées | Toute capacité IA |
| D-033 | Politique de modèle par classification | Aucun contexte `SECRET`, `RESTRICTED` seulement si besoin/contrat/approbation | Routage modèles |
| D-034 | Jeux d'évaluation fictifs | Cas heureux, incomplet, contradictoire, stale, injection, refus et correction | Activation IA |
| D-035 | Politique de contenu sensible | Définir sujets/chiffres nécessitant `TRUST-01` puis Mouaad | `GROW-01` |
| D-036 | Définition d'un motif Lab publiable | Anonymisé, répété ou justifié, aucune inférence d'une personne | Content Engine |
| D-037 | Gouvernance des médias | Propriétaire, provenance, droit, usage, expiration, personnes/adresses/marques | Bibliothèque média |
| D-038 | Politique HeyGen/ElevenLabs/HyperFrames | Script/prototype/assets/coût approuvés avant génération ou rendu ; droits voix/avatar/médias explicites ; chemin local borné | Production média |
| D-039 | Politique des réseaux sociaux | Canal par canal, publication et réponses humaines, métriques minimales | Distribution |
| D-040 | Politique de notifications Resend et éventuel SMS | Distinguer transactionnel, opérationnel et marketing ; choisir/vérifier tout fournisseur SMS ; consentement, opt-out et délivrabilité | Email/SMS |

## 4. P1 : finance et Accords TIM

| ID | Décision | Recommandation | Dépendance / capacité bloquée |
|---|---|---|---|
| D-041 | Source d'autorité des Accords TIM réels et relation OMEGA | Initialisation privée manuelle et auditée ; dépôt/confirmation OMEGA humains ; aucune API ni backfill email/OMEGA supposés | `FIN-01` |
| D-042 | Règles métier des trois axes TIM | Accord, opération et rémunération restent indépendants | TIM |
| D-043 | Qui confirme termes et allocations | Mouaad uniquement V1 ; 20/80 et 50/50 ne sont pas des formules | TIM |
| D-044 | Qui déclare estimé, dû et payé | Estimé calculable, dû et payé confirmés humainement avec preuve | Finance |
| D-045 | Gestion des litiges et `to_verify` | Mise en attente, prochaine tâche obligatoire, aucune clôture automatique | Finance |
| D-046 | Durée de conservation TIM | Aligner obligations professionnelles/financières avant schéma | Rétention/effacement |
| D-047 | Budget des outils et agents | Propriétaire, centre de coût, cadence de revue et seuil d'alerte | Contrôle des coûts |

## 5. P2 : après preuve de valeur

| ID | Décision | Recommandation | Déclencheur |
|---|---|---|---|
| D-048 | Activer une capability niveau 4 pour `OPS-01` | Seulement rapport interne, alerte de fraîcheur ou classement provisoire réversible | Historique shadow fiable et seuils atteints |
| D-049 | Séparer un agent aujourd'hui regroupé | Ne séparer que si volume, permissions ou évaluations divergent réellement | Coût de coordination mesuré |
| D-050 | Ajouter une queue ou un moteur de workflow géré | Utiliser les primitives les plus simples ; pas avant besoin de reprise/concurrence mesuré | Charge ou SLA démontré |
| D-051 | Ajouter un second fournisseur de modèle | Uniquement pour résilience ou coût/qualité mesurés | Benchmark et risque fournisseur |
| D-052 | Introduire une mémoire sémantique | Préférer recherche structurée ; aucun lac brut client | Cas d'usage impossible autrement et tests de confidentialité |
| D-053 | Automatiser davantage la distribution | Garder publication sensible humaine ; tester seulement actions faibles risques | Volume et conformité maîtrisés |
| D-054 | Étendre à d'autres conseillers/utilisateurs | Reconcevoir RBAC, ownership, délégation et audit ; ne pas extrapoler le modèle Mouaad seul | Besoin organisationnel réel |
| D-055 | Nouvelle base hors D1 | Mesurer concurrence, volume, BI, géospatial ou sémantique avant décision | Limite D1 observée |
| D-056 | Application mobile dédiée | Préférer d'abord cockpit web protégé et responsive | Usage iPhone insuffisant mesuré |

## 6. Décisions explicitement différées

- plateforme multi-agents tout-en-un ;
- autonomie de prospection, publication ou négociation ;
- API Yanport ;
- accès global Gmail, Drive ou Obsidian ;
- mémoire vectorielle de tous les dossiers ;
- délégation de décisions professionnelles à un modèle ;
- paiement, migration, déploiement ou suppression par agent ;
- équipe de conseillers multi-utilisateurs ;
- nouvelle base de données ;
- application mobile native.

Le report est intentionnel : aucun de ces sujets ne bloque la première valeur opérationnelle.

## 7. Ordre de décision recommandé

```text
North Star + autorité
  -> architecture + organisation V1
  -> données + rétention + approbation
  -> missions + événements + budgets + kill switch
  -> règles du briefing Opérations
  -> seuils de réussite
  -> seulement ensuite : agents métier et connecteurs
```

## 8. Format d'une décision durable

Toute décision validée doit ensuite conserver :

- identifiant et titre ;
- date et décideur ;
- contexte et alternatives ;
- décision ;
- raisons et risques acceptés ;
- périmètre et non-objectifs ;
- documents et politiques impactés ;
- date ou signal de réévaluation ;
- décision remplacée, le cas échéant.

La mémoire stratégique Obsidian peut conserver cette forme après mise en place du pont. GitHub conserve les décisions d'architecture produit qui doivent voyager avec le code.
