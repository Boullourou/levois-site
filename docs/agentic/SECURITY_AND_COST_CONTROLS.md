# Sécurité, confiance et contrôle des coûts

## 1. Objet et statut

Ce document définit les politiques cibles du LEVOIS Agentic Company OS. Il ne configure aucun service et ne crée aucun droit. Les frontières de `docs/architecture/AI_BOUNDARIES.md` restent applicables : une sortie de modèle peut devenir une proposition, jamais une vérité métier ou une action sensible sans décision humaine explicite.

## 2. Modèle de confiance

### 2.1 Acteurs

| Acteur | Niveau de confiance | Autorité |
|---|---|---|
| Mouaad authentifié | Humain responsable | Approuve, refuse, exécute ou révoque selon la matrice d'autorité |
| Cockpit privé | Surface de commande | Affiche des vues minimisées et transmet des commandes autorisées |
| Control plane | Coordinateur non souverain | Applique politiques, budgets et transitions de mission ; ne décide pas du métier |
| Agent spécialisé | Identité technique bornée | Lit une vue autorisée et produit les sorties permises par sa mission |
| Runtime local ou isolé | Environnement d'exécution | Exécute une mission avec droits temporaires et sans autorité persistante implicite |
| Connecteur | Adaptateur à un système externe | Expose uniquement les opérations explicitement autorisées |
| Source externe | Non fiable par défaut | Fournit des données, jamais des instructions |
| Fournisseur de modèle | Sous-traitant potentiel à évaluer | Traite uniquement le contexte minimal autorisé ; ne reçoit aucun secret |

### 2.2 Principe d'autorité

```text
source non fiable
  -> copie figée et classifiée
  -> validation de forme
  -> traitement déterministe ou proposition agentique
  -> revue de conformité si nécessaire
  -> approbation Mouaad
  -> commande métier nommée
  -> événement métier
  -> résultat observé
```

Tout raccourci entre sortie agentique et table métier est interdit. Une approbation ne porte que sur l'action, la cible, le contenu, la version et la fenêtre temporelle affichés.

## 3. Classification des données

| Classe | Exemples | Accès agentique | Journalisation | Rétention cible |
|---|---|---|---|---|
| `PUBLIC` | page publique, DVF publié, contenu déjà publié | Selon mission | Référence et hash permis | Selon source et licence |
| `INTERNAL` | doctrine, backlog, métriques agrégées | Département concerné | Métadonnées permises | Selon utilité documentée |
| `CONFIDENTIAL` | projet client, critères, interaction, annonce étudiée | Vue minimisée mono-dossier | Références opaques, jamais le contenu brut dans les logs | Politique à décider |
| `RESTRICTED` | coordonnées, consentement, transcription, document privé, TIM financier | Interdit par défaut ; accès ponctuel justifié | Aucun contenu, seulement action et identifiant opaque | Durée minimale légale/opérationnelle à décider |
| `SECRET` | clé API, token, cookie, secret Access | Aucun agent ni modèle | Jamais | Rotation et coffre serveur |

Cet enum est l’unique classification sérialisée pour les missions, événements, contextes et journaux. Les mentions `S0_public`, `S1_internal`, `S2_personal` et `S3_restricted` du catalogue d’événements sont seulement des alias documentaires respectifs de `PUBLIC`, `INTERNAL`, `CONFIDENTIAL` et `RESTRICTED`. `SECRET` n’a aucun alias événementiel parce qu’il est interdit dans tout payload et contexte agentique. En cas d’ambiguïté, la classe la plus restrictive gagne ; aucune transformation ou anonymisation déclarée par un agent ne déclasse la donnée.

Une donnée n'est pas déclassée parce qu'elle a été résumée. Un résumé contenant une adresse, un email ou une information financière reste au moins de la classe de sa source.

## 4. Permissions minimales

### 4.1 Capabilities, pas rôles larges

Chaque mission reçoit une liste fermée de capacités, par exemple :

- `project.summary.read` ;
- `task.proposal.create` ;
- `market.snapshot.read` ;
- `content.draft.create` ;
- `approval.request.create`.

Les capacités globales comme `database.read`, `email.read_all`, `drive.search_all`, `filesystem.write_all` ou `send_message` sont interdites. Une capacité inclut une portée d'objet, un environnement, une date d'expiration et un plafond de volume.

### 4.2 Séparation des départements

| Département | Vue par défaut | Accès exclu par défaut |
|---|---|---|
| Direction | Synthèses et métriques agrégées | Contenu brut des pièces et secrets |
| Opérations | Projets, tâches, échéances, interactions minimisées | Médias bruts, secrets, données financières détaillées hors besoin |
| Acquéreur | Dossier acquéreur explicitement assigné | Autres dossiers, TIM, candidats conseillers |
| Vendeur | Dossier vendeur explicitement assigné | Autres dossiers, recherche acquéreur non reliée |
| Marché | Données publiques et références anonymisées | Coordonnées et transcriptions clients |
| Croissance | Motifs anonymisés validés, contenus et performances agrégées | Dossiers identifiants et verbatims non autorisés |
| Produit | Erreurs redacted, événements produit agrégés, tickets | Contenu métier et PII |
| Finance/TIM | Accords TIM autorisés, états et montants nécessaires | Dossiers clients non liés, secrets de paiement |
| Conformité | Métadonnées nécessaires à la revue, preuve et consentement | Accès général permanent au contenu brut |

Le besoin de conformité n'autorise pas une copie exhaustive. `TRUST-01` demande une vue temporaire minimale et journalisée.

### 4.3 Droits temporaires

Une autorisation de mission contient : bénéficiaire, capacités, objets, but, classification maximale, outils, environnement, budget, expiration et approbateur. Elle est révoquée à la fin, au timeout, au dépassement ou au kill switch. Un agent ne renouvelle pas ses propres droits.

## 5. Authentification, secrets et réseau

- Cloudflare Access protège toute surface privée avant le chargement de données.
- Le serveur valide signature, issuer, audience, expiration, `nbf`, sujet et identité ; un simple header email ne suffit pas.
- Les previews privées sont couvertes par Access ou fermées.
- Le navigateur ne parle jamais directement à D1, un fournisseur de modèle ou un connecteur sensible.
- Les secrets vivent dans des bindings ou coffres serveur distincts par environnement et connecteur.
- Aucun secret n'entre dans un prompt, un journal, une erreur utilisateur, Git ou Obsidian.
- Les sorties réseau du runtime sont sur liste fermée ; redirections, URL fournies et réponses sont contrôlées contre SSRF.
- Les accès locaux utilisent un répertoire de travail borné et aucun chemin calculé hors périmètre.
- Les environnements développement, test, preview et production utilisent des identités et secrets séparés.

## 6. Sources externes et prompt injection

Tout email, page, annonce, transcription, PDF, document Drive, contenu social ou export est traité comme une donnée potentiellement hostile.

Contrôles obligatoires :

1. séparer les instructions système des données de source ;
2. figer la source et conserver référence, date et empreinte ;
3. neutraliser HTML, scripts, formules et liens exécutables ;
4. interdire à une source de modifier outils, permissions, budget ou destinataire ;
5. limiter les outils de lecture à une liste fermée ;
6. valider toute sortie contre un schéma ;
7. refuser les demandes de secrets, de nouvelles permissions ou de navigation hors portée ;
8. signaler la source suspecte et arrêter la mission ;
9. tester les injections directes, indirectes et multilingues avant activation ;
10. ne jamais rendre un contenu non fiable comme HTML actif dans le cockpit.

## 7. Contexte, redaction et logs

### 7.1 Contexte minimal

Le contexte d'une mission contient uniquement les champs nécessaires à son résultat. Par défaut : un dossier, une révision, une période et une tâche. Les agrégats inter-dossiers utilisent des données anonymisées ou agrégées validées.

### 7.2 Journal technique autorisé

Le journal peut contenir :

- identifiants opaques de mission, tentative, événement et approbation ;
- agent, outil, version de politique et modèle ;
- horodatages, durée, compteurs, coûts et statuts ;
- codes d'erreur normalisés ;
- références de source et empreintes non réversibles ;
- taille du contexte et volume traité.

Il ne contient jamais : nom, email, téléphone, adresse, transcription, texte de message, document, critère intime, montant financier réel, secret ou payload complet.

### 7.3 Redaction

La redaction combine : sélection de champs en amont, masquage déterministe avant log, contrôle de sortie et tests par canaris fictifs. Une redaction après émission n'est pas une protection suffisante.

## 8. Approbations

Une approbation doit conserver :

- l'action exacte et son risque ;
- la cible et le destinataire ;
- le contenu ou diff approuvé ;
- la version des données, de la politique et du brouillon ;
- l'identité humaine ;
- la date, l'expiration et la décision ;
- les conditions ou corrections ;
- l'exécution résultante ou la raison de non-exécution.

Après modification du brouillon, changement de destinataire, nouvelle donnée critique ou expiration, une nouvelle approbation est requise. `approval_granted` n'est jamais une autorisation générique réutilisable.

## 9. Actions toujours interdites aux agents

- confirmer un consentement ;
- fusionner deux personnes ;
- supprimer irréversiblement une donnée ;
- accepter une offre, modifier un mandat ou prendre un engagement ;
- effectuer un paiement ou décider qu'un montant est dû ;
- produire un conseil juridique ;
- valider définitivement un matching ou un bien ;
- modifier silencieusement un critère confirmé ;
- envoyer un message sensible ou publier un contenu engageant ;
- créer un nouvel agent, étendre ses droits ou relever son budget ;
- ingérer silencieusement une boîte email, un Drive, un vault ou un répertoire ;
- accéder aux secrets ou les transmettre à un modèle ;
- exécuter une migration ou un déploiement ;
- restaurer une base ou rejouer des actions externes.

## 10. Gouvernance des coûts

### 10.1 Unité de budget

Avant le choix d'un fournisseur, les budgets sont exprimés dans deux dimensions :

- **unités de calcul** : tokens, secondes CPU, pages, minutes audio ou unités fournisseur selon l'outil ;
- **monnaie** : coût estimé et coût réel dans la devise décidée par Mouaad.

Aucun montant fictif n'est figé dans cette architecture. Les plafonds sont des paramètres à décider et doivent exister avant activation.

### 10.2 Hiérarchie

```text
plafond entreprise
  -> plafond département
      -> plafond agent
          -> plafond journalier / hebdomadaire
              -> plafond mission
                  -> plafond tentative
                      -> plafond appel outil
```

Le plafond le plus restrictif gagne. Un budget non configuré signifie « exécution interdite », pas « illimité ».

### 10.3 Fiche de coût d'une mission

| Champ | Règle |
|---|---|
| Valeur potentielle | Classe qualitative et justification métier, jamais inventée |
| Coût attendu | Fourchette par outil et contexte |
| Coût réservé | Montant bloqué avant lancement |
| Coût réel | Calcul consolidé après chaque tentative |
| Écart | Attendu vs réel, avec raison |
| Plafond mission | Bloquant |
| Plafond temps | Timeout bloquant |
| Retries | Nombre et budget additionnel maximum |
| Valeur observée | Résultat utile, temps économisé ou absence de valeur |
| Décision | Continuer, réduire, mettre en pause ou arrêter |

### 10.4 Réduction de coût par ordre de préférence

1. ne pas lancer une mission sans décision utile attendue ;
2. réutiliser une donnée publique versionnée encore fraîche ;
3. réduire la portée, le nombre de sources et la fenêtre temporelle ;
4. utiliser un traitement déterministe pour validation, calcul, tri et déduplication technique ;
5. résumer localement une source autorisée avant le modèle, sans perdre les preuves ;
6. choisir le modèle le moins coûteux ayant passé les évaluations de la tâche ;
7. arrêter tôt lorsque l'information manque ou que le résultat est déjà certain ;
8. demander une approbation avant de dépasser le plafond ou d'élargir la mission.

Le cache est autorisé uniquement pour des données non sensibles ou des résultats déterministes versionnés, avec clé incluant source, version, politique et date de fraîcheur. Les sorties personnalisées, décisions, consentements, données sensibles et réponses externes ne sont pas mutualisées entre dossiers.

## 11. Retries, timeouts et circuit breakers

| Type d'action | Retry automatique | Condition | Après épuisement |
|---|---:|---|---|
| Lecture interne idempotente | Oui, limité | Erreur transitoire classifiée | Échec visible et fallback manuel |
| Lecture externe publique | Oui, limité avec backoff | Timeout/429, respect de la source | Source indisponible, aucune donnée inventée |
| Analyse modèle | Oui, au plus selon politique | Timeout ou sortie de forme invalide ; même contexte figé | Proposition absente, mission en échec ou attente humaine |
| Création interne idempotente | Oui, même clé | Réponse inconnue ou conflit transitoire | Réconciliation avant nouvelle tentative |
| Action externe préparée | Non pour l'exécution | Aucun rejeu automatique | Vérification humaine de l'état externe |
| Paiement, suppression, migration, déploiement | Jamais par agent | Interdit | Processus humain distinct |

Un circuit breaker s'ouvre par connecteur et par type d'erreur après le seuil décidé. Il bloque les nouvelles missions dépendantes, conserve les opérations manuelles et produit une alerte sans données sensibles.

## 12. Kill switches

| Portée | Effet |
|---|---|
| Global | Stoppe tout lancement et toute reprise agentique ; le cockpit manuel reste disponible |
| Département | Stoppe les agents et planifications d'un département |
| Agent | Stoppe les nouvelles missions de l'identité concernée |
| Connecteur | Révoque l'accès et bloque les appels |
| Capacité | Retire une action précise sans arrêter les lectures |
| Mission | Empêche tout nouveau démarrage ; une mission active perd sa lease et passe à `cancelled` avec une raison de coupe-circuit |

Une pause est un drapeau de portée du control plane, jamais un statut supplémentaire de mission. Le kill switch n'efface rien et ne tente pas automatiquement d'annuler une action externe déjà exécutée. Après réconciliation et réactivation humaine, une mission annulée n'est jamais rouverte : une nouvelle mission corrélée est requise.

## 13. Rétention, export, suppression et restauration

### 13.1 Rétention

Chaque classe de données possède finalité, durée, base, propriétaire et méthode de suppression. Une durée indéfinie par défaut est interdite. Les contextes de modèle et copies temporaires expirent plus vite que la donnée source.

### 13.2 Export

Un export sensible est préparé puis approuvé. Il est court, traçable, révocable lorsque le support le permet, accompagné d'un manifeste et d'une empreinte, et n'est jamais envoyé à un modèle pour simple mise en forme.

### 13.3 Effacement

L'effacement est une commande humaine qui inventorie D1, projections, exports, temporaires et fournisseurs. Les obligations TIM et financières sont traitées par déliaison ou pseudonymisation lorsqu'une suppression en cascade serait incorrecte. Un registre non identifiant permet de rejouer l'effacement après restauration.

### 13.4 Restauration

Après restauration :

1. fermer les exécutions agentiques ;
2. identifier le point restauré et la fenêtre perdue ;
3. invalider les droits et caches postérieurs ;
4. comparer événements, missions, approbations et actions externes ;
5. rejouer uniquement les événements internes idempotents validés ;
6. ne jamais rejouer automatiquement un email, message, publication, rendez-vous ou paiement ;
7. rejouer les demandes d'effacement applicables ;
8. réouvrir après validation humaine et rapport de réconciliation.

## 14. Menaces principales

| Menace | Probabilité | Impact | Prévention | Détection / réponse |
|---|---|---|---|---|
| Prompt injection indirecte | Moyenne | Élevé | Source comme donnée, outils allowlistés, aucun secret | Code d'erreur, quarantaine de source, arrêt mission |
| Accès inter-dossiers | Faible à moyenne | Élevé | Vue mono-dossier, capacités et objet liés | Audit de portée, alerte, révocation |
| Approbation rejouée sur une nouvelle version | Moyenne | Élevé | Approbation liée au hash/version et expiration | Rejet de version, nouvelle revue |
| Double exécution | Moyenne | Élevé selon action | Idempotence, inbox/outbox conceptuels, pas de retry externe | Réconciliation, blocage connecteur |
| PII dans logs ou prompts | Moyenne | Élevé | Sélection en amont, redaction, tests canaris | Scanner, purge contrôlée, incident confidentialité |
| Coût en boucle | Moyenne | Moyen à élevé | Plafonds imbriqués, timeout, retries limités | Alerte coût, pause agent/département |
| Source périmée utilisée comme actuelle | Élevée sans contrôle | Moyen à élevé | `observed_at`, `valid_until`, version et stale explicite | Mission bloquée ou résultat marqué périmé |
| Agent compromis ou mal configuré | Faible | Élevé | Identité dédiée, droits temporaires, sandbox | Kill switch, révocation et audit causal |
| Fichier local mal ciblé | Faible | Élevé | Racine autorisée, chemins résolus, lecture seule par défaut | Refus, alerte et journal de capacité |
| Dépendance fournisseur | Moyenne | Moyen | Adaptateur, export, mode manuel, pas de logique métier propriétaire | Bascule fournisseur ou pause |

## 15. Registre des échecs

Ce tableau réutilise le registre canonique `CP_*` de `CONTROL_PLANE.md`; il n’introduit aucun second namespace. `agent_mission_failed.error_code` doit contenir l’un de ces codes versionnés, jamais un libellé fournisseur libre.

| Chemin | Échec nommé | Retry | Ce que voit Mouaad | Fallback | Silence permis |
|---|---|---:|---|---|---|
| Chargement d'une vue | `CP_UPSTREAM_UNAVAILABLE` | Limité | Données indisponibles, dernière fraîcheur connue | Ouvrir le dossier manuellement | Non |
| Contrôle de version | `CP_SOURCE_STALE` | Non | Source modifiée depuis la mission | Relancer sur nouvelle version | Non |
| Autorisation | `CP_PERMISSION_DENIED` | Non | Capacité ou portée refusée | Action humaine ou nouvelle mission approuvée | Non |
| Budget | `CP_BUDGET_EXCEEDED` | Non | Coût atteint et étape stoppée | Réduire la portée ou approuver un nouveau budget | Non |
| Fournisseur de modèle | `CP_TIMEOUT` avec cause `model` | Limité | Proposition non produite | Traitement manuel | Non |
| Sortie de modèle | `CP_RESULT_INVALID` | Une correction bornée | Brouillon indisponible | Rédaction humaine | Non |
| Source suspecte | `CP_PROMPT_INJECTION` | Non | Source mise en attente | Lecture humaine sécurisée | Non |
| Conflit d'écriture | `CP_VERSION_CONFLICT` | Non aveugle | Une autre modification existe | Comparaison puis décision humaine | Non |
| Approbation | `CP_APPROVAL_EXPIRED` | Non | Relecture requise | Nouvelle approbation | Non |
| Connecteur externe | `CP_EXTERNAL_OUTCOME_UNKNOWN` | Non | État externe à vérifier | Vérification manuelle avant reprise | Non |
| Restauration | `CP_RECONCILIATION_REQUIRED` | Non | Agents suspendus | Runbook humain de réconciliation | Non |

## 16. Tests exigés avant toute activation

- tests d'autorité : sans approbation, les agrégats métier restent identiques ;
- tests de portée : un agent ne peut lire un autre dossier ;
- tests de permission : outil absent, capability expirée et élévation refusée ;
- tests de prompt injection et exfiltration ;
- tests de redaction avec canaris fictifs ;
- tests de stale input, conflit de version et approbation expirée ;
- tests d'idempotence et de double livraison ;
- tests de budget, timeout, retry et circuit breaker ;
- tests de kill switch global, département, agent et connecteur ;
- tests de panne fournisseur avec cockpit manuel disponible ;
- exercice de restauration et réconciliation sans rejeu externe ;
- évaluations qualité sur cas fictifs avant tout contexte réel ;
- vérification contractuelle de rétention et d'entraînement par chaque fournisseur.

## 17. Décisions de sécurité et coût encore requises

Les valeurs suivantes ne doivent pas être inventées : durées de rétention, fournisseurs, régions de traitement, plafonds monétaires, quotas, seuils de circuit breaker, nombre de retries, timeouts, exigences de chiffrement propres aux connecteurs, règles légales TIM, niveau de service et tolérance d'erreur. Elles sont regroupées dans `DECISIONS_REQUIRED.md`.
