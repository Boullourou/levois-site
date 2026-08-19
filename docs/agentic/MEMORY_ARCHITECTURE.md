# Architecture de mémoire — LEVOIS Agentic Company OS

Statut : architecture cible documentaire, non implémentée.

Principe directeur : D1 est l’autorité métier opérationnelle ; les autres mémoires sont des sources spécialisées, des représentations datées ou des journaux, jamais des copies concurrentes de l’état client courant.
Décideur et validateur final : Mouaad.

## 1. Pourquoi une mémoire à plusieurs couches

LEVOIS doit retrouver le bon contexte sans mélanger :

- ce qui s’est effectivement passé ;
- ce qu’une personne ou une source a déclaré ;
- ce qu’un agent a inféré ;
- ce que Mouaad a décidé ;
- ce qui est seulement une photographie exportée ;
- ce qui est une donnée publique susceptible d’avoir changé ;
- ce qui est un coût, une erreur ou une trace d’exécution.

La mémoire n’est donc pas « un grand contexte IA ». C’est un ensemble de couches ayant chacune une autorité, un propriétaire, une fraîcheur et une politique d’accès.

```text
                         Mouaad
              décisions / validations / droits
                            │
                            ▼
              D1 — autorité opérationnelle
        faits, événements, états et approbations
           │           │             │
  export daté     références      vues minimisées
           │           │             │
           ▼           ▼             ▼
      Obsidian      Marché/Média   Agents / journal
      stratégie      sources       exécutions
           ▲                             │
           │                             │
           └──── doctrine versionnée ────┤
                         GitHub            │
                                         ▼
                           propositions, jamais vérité
```

## 2. État actuel et cible

### 2.1 État actuel vérifié

| Couche | Ce qui existe | Limite actuelle |
|---|---|---|
| Opérationnelle D1 | D1 recherche historique et D1 cockpit V1 ; personnes, projets, recherche, critères, interactions, tâches, décisions, Accords TIM, LEVOIS Lab, audit | deux périmètres D1 distincts ; les autres formulaires restent en partie email-first ; aucune mémoire de mission agentique |
| Stratégique Obsidian | export Markdown prévu et export cockpit disponible | export daté, pas synchronisation bidirectionnelle ; aucun pont cloud direct vers le vault |
| Produit GitHub | code, documentation, migrations, tests et design system versionnés | aucune donnée réelle autorisée ; pas de prompts/agents de production dans cette phase |
| Marché | DVF utilisée par les parcours, observation publique ponctuelle, Yanport envisagé par export manuel | fraîcheur et droits variables ; aucune API Yanport supposée ; aucune veille agentique active |
| Média | assets publics et audit documentaire des médias | droits, propriétaires et usages ne sont pas tous nécessairement confirmés ; pas de bibliothèque agentique active |
| Journal des agents | absent | aucune mission, aucun coût modèle, aucune proposition agentique active |

### 2.2 Architecture cible

La cible ajoute une orchestration et un journal sans déplacer l’autorité métier. Elle n’implique, dans cette phase, ni table, ni migration, ni connecteur, ni donnée réelle.

## 3. Typologie obligatoire de l’information

Toute unité mémorisée ou transmise à un agent porte une nature explicite.

| Nature | Définition | Auteur possible | Peut devenir vérité courante ? | Exemple fictif |
|---|---|---|---|---|
| `source_statement` | assertion telle qu’une source l’a fournie | client, conseiller, formulaire, document | non sans qualification | « la personne déclare viser un trajet inférieur à 25 minutes » |
| `observed_fact` | observation datée avec provenance | humain ou système déterministe | oui, avec certitude `observed` | prix affiché dans un snapshot public à une date donnée |
| `deterministic_fact` | résultat d’une règle vérifiable | composant déterministe | oui dans son périmètre et sa version | une tâche ouverte a dépassé son échéance |
| `inference` | interprétation, hypothèse ou extraction | humain ou agent | jamais automatiquement | « la proximité semble prioritaire » |
| `proposal` | modification/action suggérée et sourcée | agent ou humain | non avant revue | confirmer le critère transport |
| `decision` | choix explicite et responsable | Mouaad ou personne habilitée par politique | oui, via événement métier | conserver deux scénarios de recherche |
| `projection` | vue reconstruisible des événements | système déterministe | oui comme commodité, pas comme source historique | critère courant, prochaine tâche, solde TIM |
| `artifact` | briefing, brouillon, rapport, export | agent, système ou humain | non | briefing du matin, fiche Yanport datée |

### Règles de certitude

- `confirmed` : confirmé par l’humain approprié à partir d’une source explicite ;
- `observed` : constat daté, sans prétendre à une validité permanente ;
- `inferred` : interprétation assumée ;
- `to_confirm` : information utile mais non résolue.

La confiance annoncée par un modèle n’est pas une certitude métier. Même une extraction très confiante reste une `proposal` ou une `inference` jusqu’à validation.

## 4. Les six couches de mémoire

## 4.1 Mémoire opérationnelle — D1

### Rôle

D1 porte l’état opérationnel courant et l’historique métier : personnes, projets, critères et révisions, interactions, tâches, décisions, consentements, Accords TIM, états, événements, futures missions, approbations et journaux d’audit.

Le présent document ne prescrit aucun nouveau schéma. Il fixe les responsabilités que toute évolution future devra respecter.

### Autorité et écritures

- une commande humaine autorisée ou une règle déterministe bornée peut produire une mutation et un événement atomiques ;
- un agent écrit seulement dans son espace de mission, d’artefact ou de proposition ;
- l’acceptation cockpit déclenche ensuite une commande déterministe attribuée à Mouaad ;
- aucune sortie IA n’écrit directement une personne, un critère courant, un stade, une offre, un consentement, un montant dû ou un paiement ;
- les projections sont reconstruisibles depuis l’historique et ne deviennent pas une seconde chronologie.

### Unité de lecture agentique

L’agent ne reçoit pas une base ou une table. Il reçoit un **paquet de contexte** limité contenant :

- `mission_id`, objectif et action autorisée ;
- identifiants internes de l’unique dossier ou agrégat ;
- champs explicitement autorisés ;
- sources figées et références minimales ;
- versions d’agrégats et dates `as_of` ;
- classification et finalité ;
- outils permis et durée d’accès ;
- limites de rétention et redaction ;
- budget et expiration.

## 4.2 Mémoire stratégique — Obsidian

### Contenu

Doctrine, positionnement, méthodes, décisions durables, stratégies, guides, apprentissages, identité et plans.

### Frontière d’autorité

- Mouaad possède et valide les notes stratégiques ;
- un export client Markdown est une photographie D1 datée, identifiée par révision et manifeste ;
- les notes humaines dans le vault ne sont jamais écrasées par un export ;
- un pont local futur peut préparer un export/import borné, mais aucun Worker cloud n’écrit directement dans le vault ;
- une note Obsidian ne change pas silencieusement le statut d’un projet. Toute décision opérationnelle revient par une commande cockpit explicite ;
- les données client ne servent pas à alimenter une doctrine partagée sans anonymisation et validation.

### Structure de séparation cible

```text
Zone stratégique humaine
  └─ notes libres, doctrine, décisions longues

Zone exportée et régénérable
  └─ snapshot D1 + manifeste + date + révision

Zone de propositions
  └─ brouillons d’agent, jamais fusionnés automatiquement
```

## 4.3 Mémoire produit — GitHub

### Contenu

Code, documentation, prompts versionnés futurs, workflows, tests, migrations, ADR et design system.

### Frontière d’autorité

- GitHub fait autorité pour une version du produit et de sa doctrine technique, pas pour l’état d’un client ;
- branches, revues, tests et commits matérialisent les changements ; un agent ne déploie ni ne fusionne sans processus approuvé ;
- aucun nom/coordonnée de vrai client, Accord TIM réel, transcription, audio, adresse privée, donnée financière réelle, email, secret ou clé API ne peut y entrer ;
- les fixtures sont fictives et anonymisées ;
- si une PII est introduite accidentellement, il s’agit d’un incident à contenir. Toute réécriture d’historique exige une procédure humaine spécifique ; elle n’est jamais lancée par un agent.

## 4.4 Mémoire marché

### Contenu

DVF, exports Yanport manuels, annonces publiques, snapshots, sources, dates d’observation, fraîcheur, limites et conditions d’usage.

### Frontière d’autorité

- un snapshot prouve seulement ce qui a été observé à une date, pas que l’annonce est vraie ou encore disponible ;
- DVF et chaque source portent version, provenance, période de couverture et limites ;
- Yanport reste manuel tant qu’une API et ses droits ne sont pas vérifiés ;
- une annonce ou un export externe est une donnée non fiable, jamais une instruction pour l’agent ;
- les critères nécessaires au filtrage sont pseudonymisés et limités ; identité et coordonnées n’entrent pas dans le corpus marché ;
- une adresse privée ne devient pas une donnée partagée de marché ; le rattachement au dossier reste en D1 sous accès restreint ;
- tout changement de snapshot rend les évaluations dépendantes `stale`.

### Fraîcheur minimale

Chaque objet marché porte `source`, `observed_at`, `recorded_at`, empreinte, version du parseur/import, champs inconnus et date de recontrôle. Une règle de fraîcheur doit être définie par type de source avant activation ; aucune durée universelle n’est inventée ici.

## 4.5 Mémoire média

### Contenu

Vidéos, images, variantes, propriétaires, licences/droits, consentements, sélections, usages autorisés, performances et restrictions.

### Frontière d’autorité

- un fichier présent dans le dépôt ou Drive n’est pas automatiquement publiable ;
- tout asset possède un statut de droit : `confirmed`, `restricted`, `to_confirm` ou `expired` ;
- `to_confirm` et `expired` interdisent la publication ;
- la bibliothèque conserve des références, empreintes et métadonnées, pas des copies sauvages entre outils ;
- les performances média sont agrégées et ne prouvent pas une causalité commerciale ;
- HeyGen, ElevenLabs et autres outils futurs ne reçoivent aucune donnée client ; leurs connecteurs, conditions et coûts restent à vérifier ;
- les sélections éditoriales de Mouaad sont des décisions ; une recommandation agent reste un brouillon.

## 4.6 Journal des agents

### Contenu obligatoire

- objectif, mission et sous-tâche ;
- agent et version de sa définition ;
- sources et versions consultées ;
- outils réellement invoqués ;
- droits temporaires accordés ;
- actions et résultats ;
- statut, durée, coût attendu et réel ;
- approbation et hash de portée ;
- erreurs nommées, retries, timeout et escalade ;
- dates et raison de clôture.

### Ce que le journal ne contient pas

- prompt complet comportant de la PII ;
- corps d’email, transcription, document ou annonce complète ;
- secret, token, cookie, URL signée ou en-tête d’authentification ;
- raisonnement interne libre ;
- copie globale du dossier ;
- résultat présenté comme vérité sans statut et provenance.

### Autorité

Le journal prouve l’exécution, pas le métier. Une ligne « BUY-01 propose budget X » ne change pas le budget de recherche. Le résultat accepté doit pointer vers l’événement métier créé par la commande humaine ; il ne le remplace pas.

## 5. Matrice d’autorité par couche

`Écrire` signifie une écriture directe autorisée dans cette couche, pas une modification métier indirecte. Les permissions réelles doivent être plus étroites encore, par mission.

| Couche | Lire | Écrire directement | Proposer | Valider | Supprimer |
|---|---|---|---|---|---|
| D1 opérationnelle | Mouaad ; DET ; agents sur vue de mission minimisée | Mouaad via cockpit et DET ; CP pour métadonnées de mission/journal seulement | agents du dossier dans espace de propositions | Mouaad ; TRUST-01 ne valide pas à sa place mais peut bloquer pour risque | jamais un agent ; Mouaad déclenche, TRUST-01 instruit, moteur déterministe exécute après inventaire |
| Obsidian stratégique | Mouaad ; agents seulement sur corpus explicitement sélectionné | Mouaad ; pont local borné dans zone exportée | COS-01/GROW-01/PROD-01 dans zone de brouillon | Mouaad | Mouaad selon sauvegarde ; aucun effacement client par simple suppression de note |
| GitHub produit | Mouaad ; PROD-01 et agents autorisés sur périmètre public/non personnel | humain/processus Git autorisé ; agent seulement sur branche et mission explicitement ouvertes dans une phase future | PROD-01, TRUST-01 et agents reviewers | Mouaad + processus de revue/tests | humain autorisé ; jamais pour masquer une donnée ou contourner l’historique |
| Marché | Mouaad ; MKT-01 ; BUY-01/SEL-01 sur sources utiles ; GROW-01 sur agrégats | importateur DET autorisé et saisie humaine | MKT-01 propose rapprochement, fraîcheur et qualité | Mouaad valide usage client ; DET valide contrat/empreinte | politique source ; agent peut demander invalidation, jamais effacer une preuve nécessaire |
| Média | Mouaad ; GROW-01/PROD-01/TRUST-01 selon rôle | gestionnaire humain ou import DET après contrôle | GROW-01 propose sélection/usage | Mouaad pour création ; TRUST-01 contrôle droits et peut bloquer | propriétaire/gestionnaire humain selon droits ; journal et usages dérivés inventoriés |
| Journal agents | Mouaad ; COS-01 ; TRUST-01 ; agent sur sa mission seulement ; FIN-01 sur ses coûts | CP append-only ; agent fournit résultat qui est enveloppé/validé par CP | non applicable | DET valide schéma ; Mouaad valide les effets métier, pas le fait technique | purge déterministe selon rétention validée ; jamais par l’agent journalisé |

## 6. Matrice d’accès des neuf agents

| Agent | Lecture autorisée par défaut | Écriture directe | Propositions autorisées | Données exclues par défaut |
|---|---|---|---|---|
| `COS-01` | objectifs, états agrégés, missions, approbations, coûts, risques ; détails de dossier seulement si nécessaire à l’escalade | plans, missions et journal via CP | priorités, dépendances, arbitrages | contenus complets des dossiers, emails, transcriptions, détails financiers sans mission |
| `OPS-01` | files CRM, tâches, interactions minimisées, promesses, statuts et prochaines actions | artefacts et work items du control plane uniquement ; aucune tâche D1 | triage, tâche métier à soumettre à commande humaine, anomalie, résumé | données de marché globales, média brut, paiement détaillé non nécessaire |
| `BUY-01` | un dossier acquéreur, révision, sources autorisées, annonces candidates | proposition/journal seulement | critères, scénarios, briefing, analyse, retour | autres dossiers, TIM/finance, identité au-delà du contact nécessaire |
| `SEL-01` | un dossier vendeur, signaux, snapshots et interactions autorisés | proposition/journal seulement | briefing, hypothèses, prochaine action | autres dossiers, détails TIM, corpus marketing identifiable |
| `MKT-01` | corpus marché, critères pseudonymisés nécessaires, sources publiques | snapshots/imports via DET autorisé ; journal | fraîcheur, comparaison, opportunité à vérifier | noms, coordonnées, conversations, consentements, finance TIM |
| `GROW-01` | LEVOIS Lab anonymisé, contenus, performance agrégée, doctrine | brouillons et journal | angle, script, CTA, destination, apprentissage | dossiers identifiables, emails/appels bruts, montants individuels |
| `PROD-01` | code/docs autorisés, métriques agrégées, incidents redactés | artefacts produit/branche seulement dans une phase autorisée ; journal | ticket, test, diagnostic, rollback | base client brute, secrets de production, données financières/personnelles |
| `FIN-01` | Accords TIM, termes, états, coûts et paiements selon mission | propositions/journal ; calculs de projection DET | estimation, alerte, rapprochement à vérifier | dossiers acheteur/vendeur non liés, contenu marketing, consentements hors nécessité |
| `TRUST-01` | politiques, preuves minimales, consentements, demandes de droits, journaux et actions à risque | rapports, blocages de politique et journal ; aucune mutation métier arbitraire | redaction, rétention, autorisation/refus recommandé | contenu complet lorsque référence/empreinte suffit ; secrets en clair |

Une permission de département n’est pas une permission de mission. L’accès effectif est l’intersection : rôle de l’agent ∩ périmètre de mission ∩ finalité ∩ classification ∩ durée ∩ état du consentement.

## 7. Prévenir une seconde source de vérité

| Système ou artefact | Ce qu’il peut être | Ce qu’il ne peut pas être | Retour vers l’autorité |
|---|---|---|---|
| Gmail | canal, source importée explicitement, preuve d’envoi | CRM, file de tâches ou consentement implicite | interaction/commande cockpit avec référence minimale |
| Google Calendar | représentation de rendez-vous | propriétaire final du stade ou de la relation | confirmation/synchronisation explicite vers D1 ; conflit visible |
| Obsidian | mémoire stratégique et snapshot | état client courant bidirectionnel | commande humaine cockpit, jamais parsing silencieux |
| Yanport | outil de recherche alimenté par export | source des critères confirmés | retour/import manuel daté et revu |
| OMEGA | système professionnel externe | preuve implicite de dépôt ou copie de l’accord dans Git | confirmation humaine + référence privée |
| PostHog | analytics produit agrégées | fiche client, matching ou vérité commerciale | insight Lab anonymisé |
| GitHub | autorité produit | stockage métier ou journal de données réelles | aucun retour client ; déploiement via processus distinct |
| Journal agent | preuve d’exécution | événement métier ou décision | référence vers événement D1 après acceptation |
| cache/vectorisation future | accélération éphémère sur corpus autorisé | mémoire permanente autonome | invalidation par version/TTL ; relecture de la source |
| email/briefing exporté | notification ou photographie | file de travail actuelle | lien cockpit et rechargement obligatoire avant action |

## 8. Concurrence, versions et conflits

### 8.1 Concurrence optimiste

Toute proposition et commande sensible référence :

- l’identifiant de l’agrégat ;
- sa version attendue ;
- la révision/snapshot exact utilisé ;
- l’empreinte de l’artefact ;
- l’heure `as_of` ;
- l’auteur et la source.

Si la version D1 diffère, la commande est refusée. Mouaad voit valeur actuelle, valeur proposée, source et impact. Aucun « dernier écrivain gagne » n’est autorisé pour critères, identité, consentement, état TIM, offre, paiement, matching ou suppression.

### 8.2 Écritures append-only et projections

```text
événement métier v17
        │
        ├──► projection courante v17
        └──► dépendances estampillées v17

nouvel événement v18
        │
        ├──► projection courante v18
        └──► dépendances v17 = stale
```

Une correction ajoute un événement compensatoire. Les projections `criterion_current`, prochaine action, états TIM et totaux reconstruisibles peuvent être réparées depuis l’historique ; elles ne sont pas réécrites à partir d’un résumé d’agent.

### 8.3 Conflits typiques

| Conflit | Réponse |
|---|---|
| deux valeurs de budget entre formulaire et appel | conserver les deux sources ; BUY-01 signale ; Mouaad confirme évolution/exception/erreur |
| note Obsidian plus récente qu’un export | préserver les blocs humains ; générer une nouvelle zone exportée ; aucune importation métier implicite |
| Calendar et D1 divergent | afficher conflit ; Mouaad choisit le créneau courant ; événement compensatoire explicite |
| snapshot annonce changé après analyse | évaluation et approbation passent `stale` ; nouvelle analyse ou abandon |
| termes TIM changés après estimation | nouvelle estimation versionnée ; dû et paiements existants intacts |
| retrait de consentement pendant une mission | droit temporaire révoqué ; mission annulée/expurgée ; contrôle des dérivés |
| deux agents proposent la même tâche | dédoublage par clé/règle ; aucune fusion de contenus sensibles par similarité |

## 9. Fraîcheur et staleness

### 9.1 Métadonnées minimales

Chaque source exploitable porte : `source_ref`, version, `observed_at`, `recorded_at`, `valid_from` éventuel, date de recontrôle, classification et champs inconnus. Chaque artefact agent porte la liste de ces versions et un `expires_at`.

### 9.2 Règle de décision

1. vérifier que la source existe et reste autorisée ;
2. comparer sa version à celle du paquet de contexte ;
3. appliquer la politique de fraîcheur propre au type de donnée ;
4. si inconnue, ne pas supposer frais ; marquer `to_verify` ;
5. invalider en cascade propositions, matchings, exports et approbations dépendants ;
6. conserver l’historique pour expliquer la décision passée.

### 9.3 Priorité des sources

Il n’existe pas de hiérarchie universelle « email > formulaire > agent ». La source la plus récente n’est pas nécessairement la plus vraie. Une décision humaine explicite et sourcée fixe l’état courant ; les contradictions restent visibles.

## 10. Restauration et reprise après incident

### 10.1 Objectifs

- restaurer sans mélanger production, preview, local et données fictives ;
- ne jamais restaurer automatiquement une sauvegarde sur une base distante réelle ;
- prouver le point de reprise, l’intégrité, les événements manquants et les actions externes incertaines ;
- redémarrer le cockpit manuel avant les agents.

### 10.2 Séquence cible

```text
incident détecté
      │
      ▼
kill switch agents + gel des écritures concernées
      │
      ▼
inventaire : autorité, point de reprise, journaux, actions externes
      │
      ▼
restauration dans environnement isolé
      │
      ▼
incrément du restore_epoch
invalidation leases / approbations / résultats anciens
      │
      ▼
contrôles d’intégrité + reconstruction des projections
      │
      ▼
validation Mouaad / responsable technique
      │
      ▼
reprise manuelle du cockpit
      │
      ▼
réactivation graduelle des départements agents
```

### 10.3 Par couche

| Couche | Restauration cible | Contrôle avant reprise |
|---|---|---|
| D1 | procédure de sauvegarde/restauration existante ou future, d’abord en environnement isolé ; nouveau `restore_epoch` durable | versions, contraintes, projections, événements, tâches/consentements/TIM, missions/approbations anciennes invalidées, actions externes non rejouées |
| Obsidian | sauvegarde locale/historique ; régénérer seulement les zones exportées depuis D1 | blocs humains intacts, manifeste et date visibles |
| GitHub | commit/tag/revue et rebuild reproductible | aucun secret/PII, tests et approbation de déploiement |
| Marché | réimport depuis source autorisée ou snapshots avec empreinte | provenance, droits, couverture et fraîcheur |
| Média | restaurer le fichier et son manifeste de droits ensemble | empreinte, propriétaire, droit et usages |
| Journal agents | restaurer pour audit, jamais pour rejouer automatiquement une action externe | détection de doublons, approbations expirées, coûts et résultats partiels |

Une restauration ne réexécute jamais automatiquement email, SMS, publication, suppression, paiement, offre, rendez-vous ou changement TIM. Ces actions passent dans une file « résultat à vérifier ».

## 11. Minimisation, PII et rétention

### 11.1 Minimisation

- identifiants internes pseudonymes dans les événements et journaux ;
- contexte limité à un dossier et une finalité ;
- coordonnées uniquement lorsque l’action autorisée l’exige ;
- extraits courts ou empreintes plutôt que documents entiers ;
- corpus Lab, contenu, produit et croissance anonymisés ;
- aucune boîte email, vault Obsidian, base D1 ou bibliothèque média complète envoyée à un agent ;
- redaction avant fournisseur de modèle et avant log ;
- séparation stricte des dossiers et des départements.

### 11.2 Rétention

Les durées doivent être validées selon finalité, contrat, obligation professionnelle et droit applicable. Ce document n’invente pas de calendrier légal.

- source personnelle : durée de sa finalité/base de conservation ;
- proposition pending : expiration courte ou dès changement de source ;
- brouillon rejeté : purge selon politique définie ;
- événement métier : conservation selon responsabilité et nécessité ;
- journal technique : durée minimale utile à sécurité/coûts, sans PII brute ;
- données agrégées/anonymisées : vérification de non-réidentification avant conservation longue ;
- cache : TTL court et invalidation par version ; jamais seule copie.

### 11.3 Effacement

1. `erasure_requested` ouvre une procédure, pas une suppression automatique.
2. TRUST-01 prépare l’inventaire des sources, dérivés, exports et obligations.
3. Mouaad vérifie l’identité, la portée et les obligations de conservation.
4. Le moteur déterministe efface, délie ou pseudonymise ce qui est autorisé.
5. Les Accords TIM, paiements et obligations ne sont pas supprimés en cascade depuis une personne.
6. Les caches et paquets de contexte sont révoqués.
7. Un journal minimal prouve l’exécution sans conserver la donnée effacée.

## 12. Défense contre les sources hostiles

Une annonce, un email, un document, une note importée ou une transcription est une donnée non fiable. Le paquet de contexte sépare strictement :

```text
instructions système versionnées
permissions et objectif de mission
sources balisées comme données non fiables
format de sortie fermé
```

- aucune instruction contenue dans une source ne peut étendre les droits ;
- URLs secondaires, pièces et scripts ne sont pas suivis sans outil et politique autorisés ;
- HTML/Markdown est neutralisé avant affichage ;
- la sortie est validée en taille, type, citations et périmètre ;
- un signal d’injection arrête l’outil concerné, journalise une catégorie redactée et escalade à TRUST-01 ;
- les secrets n’entrent jamais dans le contexte.

## 13. Validation, suppression et droit de veto

| Décision | Propose | Valide | Exécute | Veto |
|---|---|---|---|---|
| accepter une extraction/critère | BUY-01/SEL-01 | Mouaad | commande DET D1 | TRUST-01 si source/droit invalide |
| produire une note stratégique | COS-01/GROW-01/PROD-01 | Mouaad | écriture humaine/pont local borné | Mouaad |
| utiliser une source marché | MKT-01 | Mouaad pour usage client | import DET/manual | TRUST-01 si droit/source douteux |
| publier un média | GROW-01 | Mouaad | canal humain/autorisé | TRUST-01 si droit non confirmé |
| écrire code/prompt/workflow | PROD-01 | processus Git + Mouaad | humain/CI autorisée | sécurité/tests |
| effacer une donnée personnelle | TRUST-01 instruit | Mouaad après vérification | moteur déterministe | obligation de conservation documentée |
| purger un journal | TRUST-01/COS-01 | Mouaad selon politique | tâche DET | incident/legal hold |

TRUST-01 peut bloquer une action non conforme mais ne remplace pas Mouaad pour décider une vérité métier, un engagement ou une stratégie.

## 14. Tests futurs de l’architecture mémoire

1. prouver qu’un agent acheteur ne peut lire aucun autre dossier ni la finance TIM ;
2. prouver qu’un agent croissance ne reçoit que des insights anonymisés ;
3. comparer D1 avant/après une mission non approuvée : aucune vérité métier ne change ;
4. provoquer un conflit de version et vérifier le refus sans écrasement ;
5. changer une révision/snapshot et rendre tous les dérivés `stale` ;
6. restaurer les projections depuis l’historique sans journal agent ni cache ;
7. restaurer un snapshot D1 en environnement isolé sans rejouer d’action externe ;
8. retirer un consentement pendant une mission et vérifier révocation, arrêt et inventaire ;
9. exporter Obsidian deux fois en préservant les notes humaines ;
10. scanner Git, logs, files d’erreur et métriques pour absence de PII/secrets ;
11. traiter une source contenant une injection sans outil supplémentaire ni fuite ;
12. vérifier que le cockpit manuel reste utilisable quand journal, modèle et runtime local sont coupés.

## 15. Décisions à prendre avant implémentation

- politiques de rétention par type de donnée et obligation ;
- durée de fraîcheur par source marché/média ;
- schéma, index, chiffrement, accès et rétention du journal d’agents colocalisé avec les métadonnées durables du control plane dans D1 ;
- format exact du manifeste d’export Obsidian et propriété des blocs ;
- procédure de rapprochement Calendar/Gmail lorsque les connecteurs seront évalués ;
- fournisseur de modèles, région, rétention, entraînement, DPA et redaction ;
- classification précise des montants/données TIM et rôles d’accès ;
- procédure de restauration D1 et objectifs RPO/RTO après mesure réelle ;
- conditions de purge des propositions, artefacts, caches et journaux ;
- niveau d’anonymisation requis avant passage d’un retour terrain vers LEVOIS Lab.
