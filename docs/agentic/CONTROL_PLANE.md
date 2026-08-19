# Control plane — LEVOIS Agentic Company OS

Statut : architecture cible documentaire, non implémentée.

Décideur : Mouaad.

Orchestrateur fonctionnel : `COS-01` sous contraintes déterministes.

Autorité métier : D1 ; canal d’approbation : cockpit privé.
Architecture cible recommandée : hybride. Première tranche : cloud-only, monolithe modulaire au plus près du cockpit, avec interface de runner mais sans transport local construit.

## 1. Rôle et non-rôle

Le control plane transforme un objectif explicite en missions bornées, attribuées, observables, budgétées et révocables. Il gère : objectifs, missions, sous-tâches, dépendances, agents, files, déclencheurs, planifications, échéances, priorités, budgets, approbations, retries, timeouts, escalades, résultats, coûts, observabilité et kill switches.

Il ne devient pas :

- un second CRM ;
- un détenteur de vérité client distinct de D1 ;
- un moyen de contourner le cockpit ;
- un agent auto-administré ;
- une boîte noire qui décide du métier ;
- un moteur d’actions externes par défaut ;
- une dépendance nécessaire à la saisie et à la consultation manuelles.

## 2. État actuel et cible

### 2.1 État actuel vérifié

- le cockpit V1 et ses commandes humaines existent dans la stack Astro/Pages Functions/D1 ;
- Cloudflare Access protège le cockpit prévu, et la base cockpit est séparée de la base recherche historique ;
- D1 porte déjà des primitives métier et d’audit, mais aucune mission agentique ;
- aucun agent, modèle, fournisseur, queue, cron, workflow cloud, runtime local, Gmail/Calendar ou autre connecteur agentique n’est actif ;
- les opérations manuelles restent la voie de référence.

### 2.2 Cible hybride, première tranche cloud-only

```text
                     téléphone / navigateur de Mouaad
                                │
                                ▼
                    Cockpit privé + approbations
                                │
                  commandes déterministes autorisées
                                │
            ┌───────────────────┴───────────────────┐
            ▼                                       ▼
     D1 autorité métier                    Control plane léger
  événements / états / tâches          missions / budgets / leases
            ▲                                       │
            │                                 paquet minimisé
            │                                       ▼
            │                            Runtime local ou isolé
            │                         9 agents du catalogue fermé
            │                                       │
            │                         artefact / proposition / log
            └────────── commande après approbation ◄┘

 Connecteurs externes futurs = adaptateurs séparés, droits minimaux,
 jamais invoqués si disponibilité/API/conditions n’ont pas été vérifiées.
```

Le runtime lourd ne reçoit pas les identifiants d’administration D1 ni les secrets globaux. Il reçoit un paquet temporaire, minimisé et signé par le control plane selon un mécanisme qui restera à choisir. Le cockpit recharge toujours l’état courant avant d’afficher ou consommer une approbation.

### 2.3 Placement durable décidé

Pour la V1 cible, D1 colocalise l’état durable nécessaire au control plane — missions, tentatives, inbox/outbox, approbations d’exécution, références d’artefacts, registre de coûts et audit technique minimisé — sans mélanger ces objets à la vérité client. Le runtime est stateless et ne possède aucune mémoire souveraine. Lorsqu’une commande métier produit un événement, l’outbox correspondante est écrite dans la même transaction D1 ; la livraison reste au moins une fois et idempotente.

Une restauration incrémente un `restore_epoch` durable. Toute lease, tentative, approbation ou résultat portant un epoch antérieur devient invalide ; les agents restent suspendus jusqu’à la réconciliation des effets externes et du registre d’effacement. Ce choix ne prescrit aucune table dans cette phase : le schéma exact, la rétention et les index devront être validés avant construction.

## 3. Acteurs et séparation des responsabilités

| Acteur | Peut | Ne peut pas |
|---|---|---|
| Mouaad | fixer objectifs, approuver/rejeter, déclencher actions sensibles, changer budgets/droits, arrêter/reprendre | déléguer implicitement sa responsabilité à un résumé |
| Control plane déterministe | valider contrat, planifier, assigner, limiter, journaliser, expirer, arrêter | inventer objectif, contenu métier ou permission |
| `COS-01` | proposer plans/missions, suivre dépendances, synthétiser, escalader | s’accorder un droit, augmenter budget, créer un agent, approuver à la place de Mouaad |
| Agent spécialisé | exécuter une mission dans son manifeste, produire artefact/proposition | utiliser un autre outil/dossier, persister une vérité, déléguer à un agent non autorisé |
| `TRUST-01` | contrôler politiques, redaction, rétention, injection ; bloquer une action risquée | confirmer un fait client ou engager Mouaad |
| Gateway de commande | appliquer une commande humaine idempotente, écrire D1 et l’événement atomiquement | accepter une sortie libre comme commande ou ignorer une version |
| Connecteur futur | lire/écrire le strict périmètre vérifié | devenir source de vérité, conserver un secret dans Git, auto-retry une action sensible |

## 4. Objets du control plane

### 4.1 Objectif

Un objectif contient :

- identifiant, intitulé, résultat attendu et lien avec la North Star ;
- responsable humain ;
- périmètre, hors-périmètre et horizon ;
- métrique principale et garde-fous de confiance ;
- budget plafond et capacité humaine attendue ;
- risques, dépendances et condition d’arrêt ;
- statut de décision : proposé, validé, suspendu ou clos.

Un objectif n’autorise aucune action. Il permet seulement de planifier des missions conformes aux politiques existantes.

### 4.2 Mission — contrat canonique conceptuel

La mission est l’unité d’autorité, de coût et d’audit. Ce contrat ne prescrit pas de table.

| Groupe | Champs obligatoires |
|---|---|
| Identité | `mission_id`, type/version, `objective_id`, titre, raison de création, corrélation/causalité |
| Résultat attendu | résultat attendu, format fermé, critères d’acceptation, métrique, condition de clôture |
| Périmètre | département, agrégat/dossier autorisé, inclusions, exclusions, classification maximale selon l’enum canonique `PUBLIC / INTERNAL / CONFIDENTIAL / RESTRICTED` |
| Sources | références, versions, dates `as_of`, fraîcheur, finalité, empreintes ; jamais secret |
| Attribution | agent stable parmi les neuf, version de définition, responsable humain, priorité |
| Droits temporaires | outils, opérations lecture/écriture, cibles, durée, nombre d’appels, réseau autorisé ou non |
| Temps | créée, planifiée, échéance, SLA, début, `attempt_no`, `lease_epoch`, `restore_epoch`, heartbeat, timeout, fin |
| Budget | `native_usage` attendu/réel, quotas par outil, `estimated_cost_minor`, `actual_cost_minor`, plafond mission, réserve, plafonds agent/jour et département/semaine, `currency_code` |
| Dépendances | sous-tâches, prédécesseurs, condition de satisfaction, données attendues |
| État | statut canonique, tentative, heartbeat, attente, raison de blocage |
| Sorties | artefacts, propositions, sources citées, validation de forme, limites et inconnues |
| Approbations | type d’action, risque, hash de portée, version, décideur, expiration, décision et conditions |
| Erreurs | code nommé, étape, retry possible, impact, détail redacté, escalade |
| Journal | outils utilisés, volumes, durées, coûts, événements consommés/produits, contrôles |
| Clôture | résultat final, raison parmi `success`, `rejected`, `superseded`, `budget`, `timeout`, `manual`, `policy` et `error`, dérivés et rétention |

### 4.3 Sous-tâche

Une sous-tâche est une mission bornée reliée à un parent. Elle possède son propre agent, budget, droits, résultat et statut. Le parent ne transmet pas automatiquement toutes ses permissions : l’enfant reçoit l’intersection minimale nécessaire. Un agent peut **proposer** une sous-tâche ; seul le control plane peut la créer à partir du catalogue autorisé.

### 4.4 Dépendance

Une dépendance spécifie : mission amont, type `hard|soft|data|approval`, résultat/version attendu et comportement si échec. Une dépendance `hard` bloque l’assignation ; `soft` autorise une sortie explicitement incomplète ; `approval` ne peut être satisfaite que par le cockpit.

### 4.5 File et lease

La file représente l’attente, pas un statut de mission supplémentaire. Une mission `planned` peut être dans une file ; une mission `assigned` a un agent choisi et attend ou possède une lease. La lease est courte, renouvelée par heartbeat et récupérable après timeout sans rejouer une action externe.

Chaque tentative obtient un `attempt_no` et un `lease_epoch` strictement croissants. Tout résultat, artefact et écriture de journal les transporte avec `restore_epoch`; D1 les accepte uniquement par comparaison atomique avec la tentative et la lease courantes. Un résultat tardif, une lease perdue ou un epoch antérieur est rejeté par fencing, même si le worker croit encore exécuter.

## 5. Cycle de vie exact

Les seuls statuts canoniques sont, dans le vocabulaire demandé :

```text
draft → planned → assigned → running → waiting_input → waiting_approval → completed → failed → cancelled
```

Cette ligne énumère le cycle canonique ; `completed`, `failed` et `cancelled` sont des états terminaux alternatifs, pas des étapes successives obligatoires. Les reprises contrôlées sont les suivantes :

```text
draft
  │ cadrage valide
  ▼
planned ────────────────┐
  │ dépendances prêtes   │ replanification explicite
  ▼                     │
assigned                │
  │ lease acquise        │
  ▼                     │
running ────────┬────────┴─────────┬─────────────┐
  │             │                  │             │
  │ entrée      │ action à         │ succès      │ erreur terminale
  │ manquante   │ approuver        │             │
  ▼             ▼                  ▼             ▼
waiting_input  waiting_approval  completed      failed
  │             │
  └──► running ◄┘

Depuis tout état non terminal : cancelled sur ordre humain, kill switch,
retrait de consentement, expiration de finalité ou supersession.
```

### 5.1 Transitions et conditions

| De → vers | Condition obligatoire | Effet interdit |
|---|---|---|
| `draft → planned` | objectif/périmètre/sources/agent/coût/risque/arrêt définis ; politiques passées | réserver un outil ou exécuter |
| `planned → assigned` | dépendances hard prêtes, budget réservé, agent autorisé et capacité disponible | assigner hors catalogue ou sans version |
| `assigned → running` | lease acquise, paquet de contexte frais, droits temporaires émis | partager secret global ou toute la base |
| `running → waiting_input` | donnée indispensable absente et question minimale formulée | inventer une valeur par défaut métier |
| `waiting_input → running` | entrée humaine/source reçue, validée et reversionnée | reprendre avec ancien contexte |
| `running → waiting_approval` | artefact figé, hashé, explicable, contrôlé et action décrite | effectuer l’action avant décision |
| `waiting_approval → running` | approbation valide pour même hash/version, si une dernière étape interne est nécessaire | étendre portée, outil, canal, coût ou durée |
| `running/waiting_approval → completed` | critères d’acceptation ou rejet humain traités, résultats/journal scellés | marquer succès si sortie non validée |
| état non terminal → `failed` | erreur non retryable ou retries/timeout épuisés | masquer résultat partiel ou coût |
| état non terminal → `cancelled` | ordre, kill switch, stale, retrait, budget ou supersession | continuer une action ou conserver une lease |

Une mission terminale n’est jamais rouverte. Une reprise crée une nouvelle mission corrélée, avec nouveau contexte, budget et idempotence.

## 6. De l’événement à la mission

```text
événement ou demande humaine
            │
            ▼
  filtre déterministe d’éligibilité
  - contrat/version
  - finalité/consentement
  - doublon
  - fraîcheur
  - kill switch
            │
      ┌─────┴─────┐
      │ non       │ oui
      ▼           ▼
 journal/ignore  mission draft
                    │
                    ▼
              plan proposé COS-01
                    │
                    ▼
              admission déterministe
                    │
          ┌─────────┴──────────┐
          ▼                    ▼
     file bornée          rejet/escalade
```

### 6.1 Types de déclencheurs

| Type | Exemple | Admission | Interdiction |
|---|---|---|---|
| Humain | « préparer mon appel fictif A-104 » | identité, dossier, périmètre et budget explicites | interpréter une phrase vague comme permission externe |
| Événement métier | `project_without_next_action` | règle cataloguée + dédoublage par agrégat/version | chaîne illimitée d’événements auto-générés |
| Planification | briefing quotidien | fenêtre, timezone, une occurrence, kill switch | supposer qu’un cron est déjà disponible |
| Seuil déterministe | coût, tâche en retard, fraîcheur | métrique fiable + hystérésis/cooldown | créer du bruit à chaque lecture |
| Reprise manuelle | mission corrigée après rejet | nouvelle mission, nouvelle version | rouvrir une terminale ou réutiliser une ancienne approbation |

Chaque événement possède une liste blanche de missions autorisées dans `EVENT_CATALOG.md`. Aucun agent ne s’abonne librement à de nouveaux événements.

## 7. Planification, files et priorités

### 7.1 Files logiques

- une file par département ;
- une file séparée d’approbations humaines ;
- une file de quarantaine pour contrats invalides et collisions d’idempotence ;
- une file d’incidents sans payload personnel ;
- aucune file spécifique ne devient une table métier ou ne duplique la fiche client.

### 7.2 Priorités

| Priorité | Usage | Exemples | Préemption |
|---|---|---|---|
| `P0` | confiance/sécurité immédiate | retrait de consentement, incident de fuite, kill switch | stoppe missions incompatibles |
| `P1` | échéance humaine/commerciale ferme | offre reçue, promesse due, paiement TIM à vérifier | passe avant analyses/background |
| `P2` | continuité de dossier | lead nouveau, prochaine action, préparation d’appel | ordre par échéance puis ancienneté |
| `P3` | amélioration planifiée | contenu, QA, recherche marché | capacité résiduelle budgétée |
| `P4` | exploration | analyse non urgente | suspendue en premier |

La priorité est calculée par règles visibles ; un agent peut suggérer, pas s’auto-promouvoir. Le scheduler applique quotas et vieillissement pour éviter qu’un département monopolise la capacité. Une opportunité commerciale n’écrase jamais un retrait de consentement ou un contrôle sécurité.

### 7.3 Échéances et SLA

Le SLA est une cible de traitement interne, pas une promesse client. Il comporte : `start_by`, `complete_by`, `approval_by` éventuel et `stale_at`. Un dépassement crée une alerte ou escalade ; il n’autorise pas l’action. Les valeurs exactes seront validées après mesure sur 5 à 20 dossiers.

## 8. Catalogue fermé des agents et attribution

La V1 cible exactement neuf identifiants stables :

| Agent | Missions admises |
|---|---|
| `COS-01` | planification, briefing, consolidation, dépendances, risques et coûts |
| `OPS-01` | triage proposé, anomalies, tâches/promesses, qualité et synthèses opérationnelles |
| `BUY-01` | préparation acquéreur, critères proposés, scénarios, analyse d’annonces et visites |
| `SEL-01` | préparation vendeur, audit, signaux et suivi de commercialisation |
| `MKT-01` | sources marché, fraîcheur, snapshots, comparaison et opportunités à vérifier |
| `GROW-01` | motifs Lab anonymisés, sujets, contenus, CTA, destinations et mesure agrégée |
| `PROD-01` | incidents, QA, tickets, documentation et mesure produit |
| `FIN-01` | Accords TIM, coûts, estimations, échéances et rapprochements proposés |
| `TRUST-01` | consentements, droits, redaction, rétention, conformité et contrôle des actions |

Le control plane refuse tout `agent_id` inconnu. Les définitions sont versionnées via le processus produit. Aucun agent ne crée, clone, reconfigure ou met à jour un agent en exécution.

## 9. Permissions et outils

### 9.1 Manifeste d’autorité temporaire

Une mission reçoit un manifeste en liste blanche :

- agent/version ;
- dossier/agrégat exact ;
- champs et sources lisibles ;
- outils et opérations ;
- hôtes/domaines éventuels ;
- écriture limitée à artefact/proposition/journal ;
- nombre maximal d’appels ;
- budget et timeout ;
- expiration et révocation ;
- actions exigeant approbation ;
- classes de données interdites.

### 9.2 Invariants non négociables

Aucun agent ne peut :

1. modifier ses propres permissions ;
2. créer un nouvel agent autonome ;
3. augmenter seul son budget ou son nombre de retries ;
4. contourner, auto-accorder ou réutiliser une approbation ;
5. invoquer un outil non autorisé ;
6. changer de dossier ou de finalité ;
7. accéder aux secrets en clair ;
8. écrire directement une vérité métier depuis une sortie IA ;
9. envoyer, publier, payer, supprimer, fusionner ou engager Mouaad sans autorité explicite ;
10. traiter une source externe comme une instruction ;
11. transmettre des données d’un client à un autre agent non concerné ;
12. désactiver journal, limites, redaction ou kill switch.

Toute tentative devient `CP_PERMISSION_DENIED` ou `CP_SCOPE_VIOLATION`, termine l’invocation concernée et peut déclencher TRUST-01.

## 10. Approvals plane

### 10.1 Contrat d’approbation

Une demande contient : action exacte, destinataire/canal/cible, artefact complet figé, sources et versions, effets attendus, niveau de risque, coût restant, expiration, alternatives et hash de portée.

Le cockpit montre au minimum :

- valeur/état actuel ;
- proposition ou artefact ;
- preuves minimales et dates ;
- différences ;
- effets métier/externes ;
- coût et droit utilisés ;
- choix accepter, corriger, rejeter ;
- expiration et raison si stale.

### 10.2 Consommation

```text
artefact v3 + sources S7/R12
          │
          ▼
approval_requested(hash H3, expiration T)
          │
       cockpit
     ┌────┼────┐
     ▼    ▼    ▼
 accepter corriger rejeter
     │       │      │
     │       │      └── mission `completed(reason=rejected)` ; nouveau plan = nouvelle mission
     │       └── nouvel artefact v4, nouvelle demande
     ▼
relecture D1 + contrôle H3/version/expiration/budget
     │
  conforme ? ── non ──► aucune action, nouvelle revue
     │ oui
     ▼
commande humaine idempotente / action externe déclenchée par Mouaad
```

L’approbation n’est jamais donnée par réponse email, Slack, SMS ou simple absence d’opposition. Une approbation groupée reste ligne par ligne visible et exclut identité, consentement, finance, suppression, fusion, matching envoyé et autres actions sensibles.

### 10.3 Une mission, deux revues distinctes

Le control plane réutilise les primitives définies dans `AI_BOUNDARIES.md` et `DATA_MODEL.md`; il ne crée pas un second système de propositions :

```text
mission
  └─ zéro ou plusieurs ai_run
       └─ information_proposal + proposal_evidence
            └─ proposal_review humaine

artefact externe ou commande sensible figée
  └─ execution_approval à usage unique
       └─ déclenchement séparé par Mouaad
```

- Toute proposition de fait, critère, synthèse métier ou prochaine action utilise `information_proposal`, ses preuves et sa revue.
- Un artefact générique de mission ne peut pas muter une donnée métier ni contourner cette file.
- `proposal_review=accepted` accepte uniquement la proposition métier correspondante ; il ne vaut jamais autorisation d’envoi, publication, paiement, export, suppression ou autre effet.
- Une action externe ou sensible utilise une `execution_approval` distincte, liée à un hash, une cible, une version, un coût et une expiration ; l’événement `approval_requested` en référence la demande.
- Corriger une proposition crée une version corrigée ; modifier l’action à exécuter crée une nouvelle approbation d’exécution.

Ces noms décrivent les responsabilités conceptuelles existantes ; ils n’autorisent aucun nouveau schéma dans cette phase.

## 11. Budget et admission de coût

### 11.1 Niveaux de plafond

1. plafond par appel/outillage ;
2. plafond par tentative ;
3. plafond par mission ;
4. plafond par agent et jour ;
5. plafond par département et semaine ;
6. plafond global et période ;
7. réserve dédiée aux P0/P1.

Le plafond effectif est le minimum de ces limites. Le coût est réservé avant assignation, rapproché après chaque étape et libéré à la clôture.

### 11.2 Admission

```text
valeur potentielle explicitée
        │
        ▼
coût attendu + pire cas borné
        │
   dans les plafonds ?
      ┌─┴─┐
     non oui
      │   │
      │   └──► réserver ► exécuter ► rapprocher
      ▼
réduire contexte/modèle/volume, différer ou demander Mouaad
```

Une mission s’arrête avant dépassement. Elle ne continue au-delà de la valeur potentielle qu’après nouvelle décision de Mouaad, matérialisée par une nouvelle version/budget ; jamais par auto-augmentation.

### 11.3 Leviers autorisés

- traitement déterministe avant modèle ;
- contexte minimal et résumé validé plutôt que historique complet ;
- modèle économique pour tâche simple, après évaluation qualité ;
- regroupement uniquement de données de même finalité et sensibilité ;
- cache sur empreinte/version, sans PII ou selon politique stricte ;
- arrêt précoce sur vide, stale, preuve absente ou confiance insuffisante ;
- limite du nombre d’annonces/sources par mission ;
- aucun retry de génération si la première sortie suffit ou si le défaut vient des données.

## 12. Retries, timeouts et idempotence

| Classe d’opération | Retry automatique | Timeout | Après échec |
|---|---|---|---|
| lecture D1/idempotente | borné, backoff + jitter | court, selon mesure | fallback cockpit/relecture |
| lecture source publique autorisée | borné si conditions permettent | court | source `unavailable`, import manuel |
| appel modèle sans effet externe | au plus selon budget et cause transitoire | borne mission | résultat partiel ou fallback humain |
| écriture artefact/proposition idempotente | un retry avec même clé/hash | court | collision en quarantaine |
| email/SMS/publication | aucun retry aveugle | attente d’accusé bornée | statut `outcome_unknown`, vérification humaine |
| rendez-vous/calendrier | aucun doublon automatique | borne connecteur | vérifier puis saisir manuellement |
| paiement/offre/contrat/TIM sensible | jamais autonome | non applicable agent | traitement exclusivement humain |
| suppression/export de droits | pas de retry sans inventaire d’étape | procédure dédiée | TRUST-01 + Mouaad |

Un timeout libère la lease, révoque les droits, fige le coût et marque l’étape. Il ne garantit pas qu’une action externe a échoué ; ces cas sont toujours `outcome_unknown` jusqu’à vérification.

## 13. Résultats et validation

Chaque résultat porte : mission/agent/version, sources, citations/références minimales, `as_of`, nature (`fact|inference|proposal|artifact`), inconnues, limites, schéma/version, coût/durée et statut de contrôle.

Le validateur déterministe vérifie :

- format et taille ;
- champs autorisés ;
- références présentes et dans le scope ;
- versions non stale ;
- absence de secrets/PII interdite ;
- absence d’action ou d’instruction non permise ;
- cohérence des totaux et types lorsqu’elle est déterministe ;
- conditions d’approbation.

Une sortie invalide ne devient ni événement métier ni approbation. Elle peut être corrigée dans la limite de retry, sinon fallback humain.

## 14. Erreurs nommées et réponse

| Code | Déclencheur | Réponse du control plane | Retry | Fallback manuel |
|---|---|---|---|---|
| `CP_CONTRACT_INVALID` | mission/événement/résultat hors contrat | quarantaine, aucune exécution | non avant correction | recréer la mission correctement |
| `CP_PERMISSION_DENIED` | outil/opération non listé | refuser, révoquer invocation, auditer | non | action humaine autorisée si légitime |
| `CP_SCOPE_VIOLATION` | autre dossier/finalité/classification | annuler mission, alerter TRUST-01 | non | nouvelle mission bornée après revue |
| `CP_SOURCE_STALE` | version/date/empreinte remplacée | annuler résultat et approbation | après replanification | recharger source et réévaluer |
| `CP_SOURCE_EMPTY` | entrée critique vide | `waiting_input` ou clôture sans résultat | non technique | compléter/classer |
| `CP_UPSTREAM_UNAVAILABLE` | connecteur/source/runtime indisponible | backoff borné si lecture sûre | oui, borné | import/saisie/traitement manuel |
| `CP_IDEMPOTENCY_CONFLICT` | même clé, hash différent | quarantaine, aucun effet | non | comparer les deux commandes |
| `CP_VERSION_CONFLICT` | agrégat D1 modifié | refuser commande/approbation | après recharge | Mouaad tranche la valeur courante |
| `CP_BUDGET_EXCEEDED` | réserve/coût atteint | stop, résultat partiel non actionnable | non sans nouveau budget | réduire périmètre ou valider une nouvelle mission |
| `CP_TIMEOUT` | étape ou mission dépasse borne | révoquer lease/droits et passer la tentative ou mission à `failed` | selon classe sûre | exécuter manuellement |
| `CP_RETRY_EXHAUSTED` | tentatives maximales | `failed`, événement d’échec | non | COS-01 propose un fallback |
| `CP_APPROVAL_EXPIRED` | expiration ou source changée | bloquer consommation | nouvelle demande seulement | revoir dans cockpit |
| `CP_APPROVAL_MISMATCH` | hash/canal/cible/version diffère | bloquer et auditer | non | corriger puis nouvelle approbation |
| `CP_RESULT_INVALID` | schéma, preuve, redaction ou taille invalide | rejeter sortie | une correction si budget | produire manuellement |
| `CP_PROMPT_INJECTION` | source tente de donner des instructions | isoler source, couper outil, alerter TRUST-01 | non automatique | lecture humaine prudente |
| `CP_PII_POLICY_VIOLATION` | donnée interdite dans contexte/log/sortie | stop, redaction/incident | non avant analyse | procédure sécurité/confiance |
| `CP_EXTERNAL_OUTCOME_UNKNOWN` | absence d’accusé d’une action externe | interdire retry, créer vérification | non | contrôler le canal et enregistrer résultat |
| `CP_RECONCILIATION_REQUIRED` | restauration ou divergence entre état durable et effets externes | suspendre agents, leases et approbations | non avant runbook humain | réconcilier chaque effet puis réactiver |
| `CP_KILL_SWITCH_ACTIVE` | coupe-circuit applicable | ne pas assigner/démarrer, annuler leases | après réactivation humaine | cockpit manuel |
| `CP_DEPENDENCY_FAILED` | dépendance hard en échec | bloquer/annuler selon politique | après nouvelle dépendance | reprendre l’étape manuellement |
| `CP_LEASE_LOST` | heartbeat absent/concurrence worker | arrêter résultat tardif | nouvelle tentative sûre | traitement humain si urgent |

Les messages utilisateurs restent clairs et courts ; les journaux contiennent le code et des identifiants, jamais le contenu privé complet. `agent_mission_failed.error_code` utilise exclusivement ce namespace `CP_*` versionné.

## 15. Escalades

| Situation | Destinataire | Délai | Contenu |
|---|---|---|---|
| P0 consentement/fuite/injection sévère | Mouaad + TRUST-01 | immédiat | impact, périmètre, action de confinement, aucune PII brute |
| offre/promesse/paiement TIM P1 | Mouaad + agent département | selon échéance réelle | fait vérifié, source, délai, prochaine action |
| mission bloquée sur entrée | Mouaad via cockpit | fenêtre opérationnelle | une question minimale, choix possibles |
| dépassement coût prévisible | Mouaad + COS-01 | avant dépense | coût engagé, valeur attendue, options réduire/arrêter |
| dépendance technique | PROD-01 + COS-01 | selon sévérité | composant, impact, fallback manuel |
| trois échecs similaires | COS-01 + propriétaire de politique | revue hebdomadaire ou avant reprise | motif, fréquence, coût, recommandation de désactivation |

Une escalade ne donne pas de permission supplémentaire. Elle demande une décision.

## 16. Observabilité et coût

### 16.1 Signal minimal

- missions par statut, agent, département et priorité ;
- délai file, temps d’exécution et attente humaine séparés ;
- taux de succès, fallback, rejet, correction et stale ;
- retries, timeouts, erreurs nommées et dépendances ;
- coûts attendu/réservé/réel par mission/agent/département/résultat ;
- approbations en attente/expirées/rejetées ;
- événements consommés et retard par consommateur ;
- kill switches actifs ;
- métrique métier finale : contribution à une conversation humaine qualifiée.

### 16.2 Journalisation

Le journal contient identifiants techniques, versions, codes, volumes, durées et coûts. Il exclut corps d’email, prompt complet avec PII, transcription, secret, document, adresse et coordonnées. Les vues de coûts et de santé fonctionnent sur agrégats.

### 16.3 Alertes anti-bruit

- dédoublage par cause/agrégat/fenêtre ;
- seuil et cooldown ;
- regroupement sans masquer un P0/P1 ;
- pas d’alerte si la vue cockpit déterministe suffit et que l’échéance n’approche pas ;
- revue mensuelle des alertes ignorées et des agents peu utiles.

## 17. Kill switches et pauses

### 17.1 Niveaux

1. mission ;
2. agent ;
3. département ;
4. outil/connecteur ;
5. fournisseur de modèle/runtime ;
6. actions externes ;
7. global agentique.

### 17.2 Effet

- empêcher nouvelles assignations ;
- révoquer leases et droits temporaires ;
- laisser terminer uniquement une opération déterministe atomique déjà engagée si son interruption créerait une incohérence ;
- appliquer un drapeau de pause à la portée concernée, sans inventer de statut de mission ;
- après achèvement exceptionnel d'une opération déterministe atomique impossible à interrompre proprement, passer toute mission active concernée à `cancelled` avec `reason=kill_switch` ou `reason=policy_pause` ;
- conserver journaux/coûts ;
- invalider approbations non consommées si leur contexte peut avoir changé ;
- maintenir l’authentification, la lecture et les commandes manuelles du cockpit.

### 17.3 Réactivation

Réactivation exclusivement humaine après : cause identifiée, périmètre vérifié, données/retries examinés, test fictif réussi et budget/droits revalidés. Elle est graduelle : outil → agent pilote → département → global. Elle ne rouvre jamais une mission terminale : la reprise crée une nouvelle mission corrélée.

## 18. Fallback manuel garanti

| Capacité agentique | Mode manuel obligatoire |
|---|---|
| briefing COS-01 | vue Aujourd’hui triée par échéance, priorité et anomalie |
| triage OPS-01 | lecture de l’intake et création/classement cockpit |
| extraction BUY-01/SEL-01 | saisie humaine de notes, critères et tâches |
| veille MKT-01 | recherche publique et import/saisie autorisés manuellement |
| contenu GROW-01 | rédaction, contrôle et publication manuels |
| QA PROD-01 | tests et ticket manuels |
| suivi FIN-01 | vue TIM, calcul et rapprochement manuels |
| contrôle TRUST-01 | checklist et procédure humaine |

La disponibilité du cockpit n’attend ni modèle, ni runtime local, ni file, ni connecteur. Un indicateur visible distingue `agent_off`, `degraded` et `manual_only`.

## 19. Plan de tests futur

### 19.1 Autorité

- agent incapable de modifier permission, budget, catalogue ou kill switch ;
- sortie agent sans approbation : état métier D1 strictement identique ;
- approbation de mauvais hash/version/cible refusée ;
- autre dossier ou champ non autorisé inaccessible ;
- action sensible jamais auto-retryée.
- work item/tâche agentique de mission incapable de renseigner `next_task_id`, de produire `task_created` ou de fermer `project_without_next_action` sans commande humaine ;

### 19.2 Cycle et concurrence

- toutes transitions autorisées et refus des transitions non listées ;
- lease perdue, résultat tardif ignoré ;
- mission terminale non réouverte ;
- événement dupliqué sans double mission ;
- collision d’idempotence en quarantaine ;
- dépendance hard/soft/approval correctement traitée.

### 19.3 Coût et résilience

- réserve et rapprochement ; arrêt avant plafond ;
- plafonds imbriqués et réserve P0/P1 ;
- timeout et retries par classe ;
- kill switch à chaque niveau ;
- panne modèle/runtime/connecteur avec cockpit manuel intact ;
- briefing déterministe de secours en 3 à 7 priorités.

### 19.4 Sécurité et confidentialité

- prompt injection, URL hostile et sortie hors schéma ;
- redaction journaux, erreurs, métriques et files ;
- retrait de consentement pendant la mission ;
- purge/révocation des paquets temporaires ;
- aucune donnée réelle dans fixtures, Git ou tests.

## 20. Décisions requises avant implémentation

1. schéma, index, rétention et accès exacts des métadonnées colocalisées dans D1, sans créer une seconde autorité ;
2. mécanisme futur de transport entre cloud et runtime local, authentification, chiffrement et révocation — différé, non bloquant pour la tranche cloud-only ;
3. valeurs initiales de SLA, timeouts, retries et leases après observation du travail réel ;
4. quotas natifs et plafonds monétaires/devise par mission, agent, jour, département et mois ;
5. fournisseur(s) de modèle et garanties de traitement ;
6. liste initiale des outils par agent et politique réseau ;
7. actions internes de niveau 2 pouvant être créées sans revue et leur marquage ;
8. types d’approbation, durée et éventuelle double validation ;
9. politique d’archivage/purge des missions, artefacts et journaux ;
10. procédure opérationnelle de kill switch et personnes habilitées en plus de Mouaad ;
11. ordre de construction : COS-01 minimal/control plane, puis OPS-01 spécialisé, avant toute action externe ;
12. critères chiffrés d’arrêt d’un agent qui coûte plus d’administration qu’il n’en retire.

## 21. Critère d’acceptation du control plane V1

La V1 est utile seulement si, sur des dossiers fictifs puis un pilote explicitement autorisé :

- elle produit un briefing court et une file d’approbations fiable ;
- OPS-01 détecte les dossiers/promesses/TIM sans prochaine action ;
- chaque mission est bornée, traçable, budgétée et révocable ;
- aucune sortie IA ne devient une vérité métier sans Mouaad ;
- les actions sensibles restent impossibles sans approbation valide ;
- le coût et les erreurs sont visibles ;
- un kill switch rend immédiatement le système `manual_only` ;
- Mouaad peut continuer à travailler normalement dans le cockpit sans aucun agent.
