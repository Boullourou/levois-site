# LEVOIS Agentic Company OS

## Statut du document

- **Nature** : architecture cible, exclusivement documentaire.
- **Référence de départ** : commit `ad0de9a664f5e9054da8a25b651fee0e93ee9eb3`.
- **État actuel** : site public, parcours, cockpit V1, modèle client, Accords TIM et frontières IA déjà documentés ou partiellement réalisés.
- **État cible** : entreprise assistée par une organisation bornée d'agents spécialisés, avec Mouaad comme dirigeant, décideur et interlocuteur humain.
- **Ce document n'autorise aucune implémentation** : aucune migration, table, API, queue, tâche planifiée, intégration, donnée réelle ou action externe.

Les documents spécialisés de `docs/agentic/` complètent ce document. En cas d'ambiguïté, les règles d'autorité, de sécurité et de validation humaine les plus restrictives prévalent.

## 1. Thèse

LEVOIS ne doit pas devenir un ensemble de robots qui produisent davantage de tâches, de messages ou de contenus. Le système doit rendre l'entreprise plus continue : une information utile ne se perd pas, une décision reste reliée à ses preuves, une promesse produit une échéance, une action possède un responsable et un résultat peut devenir un apprentissage.

La chaîne recherchée est :

```text
comprendre une personne
  -> formuler le problème juste
  -> donner une première valeur
  -> obtenir une activation volontaire
  -> préparer une conversation humaine
  -> exécuter et suivre la décision humaine
  -> observer le résultat
  -> apprendre sans transformer une corrélation en vérité
```

L'agent n'est jamais le professionnel immobilier. Il prépare, relie, vérifie, propose, surveille et documente. Mouaad conserve le jugement, la relation, la négociation, les engagements, la validation commerciale, juridique et financière, ainsi que toute décision sensible.

## 2. North Star et contrat de valeur

La métrique directrice est :

> **Une conversation humaine qualifiée, déclenchée avec suffisamment de contexte pour permettre à Mouaad et à la personne d'avancer réellement.**

Avant l’échange, un dossier est **`conversation_ready`** lorsque, au minimum :

1. la personne a volontairement demandé ou accepté l'échange ;
2. sa situation et son objectif sont identifiés sans surinterprétation ;
3. les faits, hypothèses et informations à confirmer sont séparés ;
4. une prochaine décision ou question utile est formulée ;
5. Mouaad dispose d'un briefing court, sourcé et à jour ;
6. la question que l’échange doit permettre de trancher est explicite.

La **conversation humaine qualifiée** n’est comptée qu’après un échange réel avec Mouaad, une revue humaine, une déduplication conversation/projet, une raison codée et une issue — avancer, attendre, arrêter ou orienter — selon le contrat unique de `KPI_SYSTEM.md`. La définition finale des fenêtres et seuils reste une décision de Mouaad. Une vue, un formulaire, un email, une annonce analysée ou une tâche créée ne constitue pas, seul, un résultat.

## 3. Résultat recherché pour Mouaad

Avec 5 à 20 dossiers actifs, le système doit d'abord :

- montrer les dossiers sans prochaine action ;
- retrouver les retours promis et échéances ;
- préparer les appels sans obliger à relire plusieurs outils ;
- distinguer le confirmé, l'observé, l'inféré et l'information à confirmer ;
- proposer des mises à jour sans écraser les faits validés ;
- suivre séparément accord, opération et rémunération TIM ;
- transformer les motifs terrain répétés en sujets de contenu reliés à une destination ;
- produire un briefing quotidien limité à 3 à 7 priorités ;
- expliquer le coût et la provenance de chaque mission agentique ;
- laisser le cockpit entièrement utilisable lorsque les agents ou un fournisseur de modèle sont indisponibles.

Le premier gain attendu n'est donc pas une autonomie spectaculaire. C'est la suppression fiable des oublis et de la reconstitution manuelle du contexte.

## 4. Ce qui existe et ce qui manque

| Domaine | État au commit de référence | Réutilisation cible | Écart à combler plus tard |
|---|---|---|---|
| Site et parcours | Parcours acheteur, vendeur, audit et lecture locale | Entrées versionnées et activation volontaire | Relier proprement les activations au système client |
| D1 recherche actuel | `lectures_recherche` spécialisé acquéreur | Source historique à migrer de façon additive | Modèle central non déployé |
| Cockpit V1 | Tranche privée sécurisée, personnes, projets, tâches, TIM, Lab | Surface humaine de lecture, commande et approbation | Pas de missions, approbations ou agents actifs |
| Modèle client | Architecture détaillée, événements, révisions et projections | Vocabulaire canonique | Tables cibles non créées dans cette phase |
| Frontières IA | Pipeline source -> proposition -> revue humaine | Autorité minimale obligatoire | Aucun fournisseur ni runtime sélectionné |
| Obsidian | Export Markdown unidirectionnel prévu | Mémoire stratégique et snapshots contrôlés | Pont local non construit |
| Marché | DVF versionné, Yanport manuel, sources publiques à vérifier | Mémoire marché sourcée et datée | Pas de veille autonome ni API Yanport supposée |
| Contenu | Doctrine éditoriale, parcours et mesure privacy-first | Entrées du moteur de contenu | Pas de chaîne Lab -> publication active |
| Médias | Audit, droits et matrice de décision | Gouvernance des usages | Bibliothèque gouvernée non implémentée |
| Entreprise agentique | Aucun control plane actif | Nouvelle couche cible | Architecture à construire par incréments |

Le système cible réutilise ces actifs. Il ne crée ni CRM parallèle, ni base de vérité agentique, ni boîte noire qui duplique le cockpit.

## 5. Principes non négociables

### 5.1 Personnes avant agents

Les cibles, leurs décisions et leurs craintes déterminent les offres et les workflows. L'organigramme agentique vient ensuite. Voir `TARGET_AND_OFFER_SYSTEM.md`.

### 5.2 Valeur avant coordonnées

Une première lecture utile et ses limites précèdent l'activation volontaire. La collecte est minimale, finalisée et explicable.

### 5.3 Information reçue != vérité métier

Chaque information importante porte une provenance, une date, une portée, une fraîcheur et une certitude métier. Une confiance de modèle n'est jamais une certitude métier.

### 5.4 Proposition != décision != exécution

Une proposition agentique reste séparée d'une décision humaine et de la commande qui applique cette décision. Aucun résultat de modèle n'écrit directement dans un agrégat métier.

### 5.5 Une seule autorité opérationnelle

D1 reste la source de vérité opérationnelle cible. Le journal d'agents explique l'exécution, mais ne devient pas une seconde base client. Obsidian conserve doctrine et snapshots, GitHub conserve produit et architecture, les mémoires marché et média conservent leurs sources spécialisées.

### 5.6 Humain en continuité, pas en secours tardif

Mouaad intervient là où sa présence crée la valeur : conversation, diagnostic, estimation professionnelle, sélection finale, négociation, mandat, offre, engagement, finance et droit. Le fallback humain existe à chaque workflow, pas uniquement après une panne.

### 5.7 Manuel sans IA

Le cockpit et les commandes métier doivent rester utilisables sans agent, sans modèle et sans connecteur externe. Une panne agentique dégrade la préparation ; elle ne bloque pas l'exploitation.

### 5.8 Le coût fait partie de la décision

Toute mission possède un plafond, une estimation, un coût réel, un délai, des retries limités et une condition d'arrêt. Un agent ne peut augmenter son budget.

## 6. Architecture d'entreprise cible

L'architecture cible recommandée est hybride, mais la première tranche est **cloud-only et hybrid-ready** :

```text
Canaux publics et manuels
        |
        v
Contrats d'entrée versionnés
        |
        v
D1 canonique + événements métier
        |
        +------------------------+
        |                        |
        v                        v
Cockpit privé              Control plane léger
lecture, commandes,        missions, politiques,
approbations               budgets, traces
        |                        |
        +-----------+------------+
                    |
          autorisation bornée
                    v
        Runtime isolé local ou dédié
        missions lourdes, brouillons,
        analyse de sources autorisées
                    |
          propositions uniquement
                    v
             File d'approbation
                    |
              décision Mouaad
                    |
            commande métier auditée
```

Le cloud garde l'état durable, les événements, les politiques, les approbations et l'accès mobile. Un runtime local ou isolé traite les missions lourdes qui exigent des fichiers, de longs contextes ou le pont Obsidian. Les secrets, permissions et journaux sont séparés. Une mission locale interrompue reste visible et reprenable dans le cockpit.

Cette recommandation est comparée aux options cloud et locale dans `TECHNICAL_OPTIONS.md`.

## 7. Organisation V1 recommandée

Neuf rôles logiques couvrent les neuf départements demandés sans créer une foule d'agents :

| ID | Agent | Département | Rôle V1 | Plafond V1 proposé — niveau initial L0 |
|---|---|---|---|---|
| `COS-01` | Chief of Staff | Direction et stratégie | Planifie, délègue, consolide et prépare les revues | L2 ; L4 candidat pour briefing interne seulement |
| `OPS-01` | Opérations | Opérations et CRM | Détecte oublis, retards, promesses et anomalies | L2 ; L4 candidat pour alertes/work items internes |
| `BUY-01` | Acquéreur | Acquisition acquéreurs | Prépare appels, critères, scénarios et analyses | L3 pour brouillons externes, sans déclenchement |
| `SEL-01` | Vendeur | Acquisition vendeurs | Prépare qualification, rendez-vous et suivi | L3 pour brouillons externes, sans déclenchement |
| `MKT-01` | Intelligence marché | Intelligence marché | Contrôle sources, fraîcheur et comparaisons | L2 ; L4 candidat pour fraîcheur déterministe |
| `GROW-01` | Croissance et contenu | Marketing et croissance | Transforme les motifs validés en contenus préparés | L3, publication toujours humaine |
| `PROD-01` | Produit et QA | Produit et technologie | Triage les frictions, prépare tests et backlog | L2 ; L4 candidat pour QA sandbox fictive |
| `FIN-01` | Finance et TIM | Finance et Accords TIM | Surveille états, échéances, coûts et écarts | L3 pour brouillon de suivi, aucun paiement |
| `TRUST-01` | Conformité et confiance | Conformité et confiance | Vérifie consentement, droits, promesses et exposition | L2 agent ; L4 candidat pour refus déterministe seulement |

Ces rôles sont logiques, pas neuf processus permanents. Toutes les capacités commencent en L0. La première tranche n'active que `COS-01` minimal et `OPS-01`, selon un manifeste explicite `logical_role / runtime_enabled / capability / initial_level / ceiling`. Les autres restent des contrats documentés jusqu'à ce qu'un volume réel justifie leur activation. Les fiches complètes figurent dans `AGENT_CATALOG.md`.

## 8. Rôle de Mouaad

Mouaad conserve :

- vision, positionnement, goût et priorités ;
- responsabilité professionnelle et relation client ;
- qualification finale d'une conversation ;
- confirmation des critères et scénarios ;
- validation d'un matching et d'un bien à transmettre ;
- estimation, recommandation commerciale, mandat, négociation et offre ;
- validation des communications externes et contenus sensibles ;
- engagements contractuels, juridiques et financiers ;
- consentement, fusion de personnes, export sensible, effacement et restauration ;
- budgets, permissions, connecteurs, déploiements et kill switch ;
- décision finale lorsqu'un agent, une politique ou une source se contredisent.

Le silence de Mouaad n'est jamais une approbation. Une approbation expire et reste liée à un objet, une version, une action et un destinataire précis.

## 9. Niveaux d'autonomie

| Niveau | Capacité | Effet autorisé |
|---|---|---|
| 0 | Observation | Lire une vue autorisée, mesurer et signaler sans créer d'action métier |
| 1 | Proposition | Produire analyse, brouillon, recommandation ou changement proposé |
| 2 | Exécution interne | Créer rapport, work item/tâche agentique de mission, alerte, mission, anomalie ou brouillon identifié comme agentique ; jamais `task_created` |
| 3 | Action externe préparée | Préparer un message, rendez-vous, contenu ou annonce ; Mouaad relit et déclenche |
| 4 | Autonomie bornée | Exécuter une action interne faible risque, réversible, budgétée, explicitement autorisée et auditée |

Le niveau s'applique à une capacité, pas à la personnalité entière de l'agent. Il est plafonné par politique, environnement et mission. L'éligibilité L4 exige des tests sur données fictives, un taux d'erreur accepté par Mouaad, une marche arrière, une alerte, un plafond de coût et un kill switch. Les interdictions absolues de la matrice d'autonomie restent valables à tous les niveaux.

## 10. Control plane

Le control plane ne décide pas du métier. Il coordonne l'exécution autorisée :

- objectifs et horizon ;
- missions et sous-tâches ;
- dépendances et priorité ;
- identités d'agents et droits temporaires ;
- déclencheurs et planifications ;
- files de travail et d'approbation ;
- budgets, délais, retries et timeouts ;
- résultats, erreurs et escalades ;
- coût, durée, provenance et traces ;
- pause par département et kill switch global.

Cycle canonique :

```text
draft -> planned -> assigned -> running
                               |   |
                               |   +-> waiting_input
                               |   +-> waiting_approval
                               |
                               +-> completed
                               +-> failed
                               +-> cancelled
```

Les transitions terminales ne sont pas rouvertes silencieusement. Une reprise crée une tentative corrélée ou une nouvelle mission. Les règles détaillées figurent dans `CONTROL_PLANE.md`.

## 11. Mémoire partagée

La mémoire est stratifiée :

1. **D1 opérationnelle** : personnes, projets, critères, interactions, tâches, décisions, TIM et, dans la cible, références de missions et approbations.
2. **Obsidian stratégique** : doctrine, méthodes, décisions durables, plans et apprentissages validés.
3. **GitHub produit** : code, documents, prompts versionnés, workflows, tests, migrations et ADR.
4. **Mémoire marché** : DVF, exports Yanport manuels, annonces et snapshots avec date, source, fraîcheur et limites.
5. **Mémoire média** : originaux hors Git, dérivés autorisés, droits, restrictions, usages et performances.
6. **Journal des agents** : mission, version de politique, sources, outils, action, résultat, coût, durée, approbation et erreur, sans PII dans les logs techniques.

Une restauration de D1 ne restaure pas automatiquement le monde extérieur. Après restauration, les événements et actions externes sont réconciliés avant toute reprise. Une version ancienne n'est jamais traitée comme actuelle sans contrôle de version et de fraîcheur. Voir `MEMORY_ARCHITECTURE.md`.

## 12. Événements et workflows

Les événements métier expriment un fait survenu, pas une instruction cachée. Ils utilisent une enveloppe avec identifiant, type, version, date d'occurrence, source, acteur, corrélation, causalité, classification, référence d'objet et clé d'idempotence. Le payload reste minimal.

Les workflows couvrent :

1. acquéreur, de l'entrée à l'offre éventuelle ;
2. vendeur futur, de la première lecture au mandat éventuel ;
3. annonce déjà publiée, de l'audit à l'ajustement humain ;
4. Accord TIM, de l'information à la clôture financière ;
5. contenu et croissance, du motif terrain à l'apprentissage ;
6. amélioration produit, de la friction à la mesure ;
7. briefing quotidien, des événements aux 3 à 7 priorités.

Chaque workflow sépare collecte, validation, proposition, approbation, commande, résultat et apprentissage. Chaque étape possède un délai cible à décider, un plafond de coût, un fallback humain et une condition d'arrêt. Voir `EVENT_CATALOG.md` et `END_TO_END_WORKFLOWS.md`.

## 13. Connecteurs

| Intégration | Statut de connaissance | Usage cible | Écriture autonome V1 |
|---|---|---|---|
| Cockpit / D1 | Disponible dans le socle, extension cible non construite | Autorité métier et approbations | Non ; commandes internes bornées seulement après construction |
| GitHub | Disponible pour le dépôt | Mémoire produit, tickets et revues | Non en première tranche |
| Gmail | Futur, capacité et politique à vérifier | Entrées explicitement sélectionnées, brouillons | Jamais d'envoi autonome sensible |
| Google Calendar | Futur, connecteur à vérifier | Disponibilités et rendez-vous préparés | Création déclenchée par Mouaad |
| Google Drive | Futur, connecteur à vérifier | Documents explicitement autorisés | Non par défaut |
| Obsidian | Manuel puis pont local futur | Doctrine et snapshots | Export interne borné seulement |
| DVF | Disponible par jeu de données versionné | Preuves historiques locales | Lecture et calcul déterministe |
| Yanport | Manuel | Export/import contrôlé | Aucune API supposée |
| Resend | Disponible pour certains parcours actuels | Notification applicative | Pas de campagne ou message sensible autonome |
| PostHog | Disponible, privacy-first | Mesure agrégée de parcours | Événements non identifiants seulement |
| Cloudflare | Disponible | Hébergement, D1, Access et frontières réseau | Administration humaine |
| Réseaux sociaux | Manuel / à vérifier selon canal | Publication de contenu approuvé | Non |
| Bibliothèque média | Partielle, gouvernance cible | Droits, sélections et usages | Non |
| HeyGen | Manuel / futur | Production après script validé | Aucune consommation de crédits autonome |
| ElevenLabs | Manuel / futur | Voix après validation | Aucune consommation de crédits autonome |
| HyperFrames | Manuel / futur | Brouillon vidéo local après script/assets validés | Aucun rendu ou publication autonome |
| SMS | Futur, fournisseur à sélectionner | Message préparé | Aucun envoi ni retry autonome |
| OMEGA | Manuel / système externe à vérifier | Dépôt TIM et confirmation de jalons | Aucune connexion ou dépôt autonome |
| Transcription | Fournisseur et contrat à décider | Source explicitement fournie | Proposition uniquement |
| Fournisseur de modèles | Non sélectionné | Analyse et rédaction bornées | Aucun accès avant évaluation et politique |

Une intégration marquée « futur » ou « à vérifier » n'est pas une dépendance disponible. Son absence déclenche un chemin manuel explicite.

## 14. Sécurité, confiance et coût

Les contrôles minimaux sont : moindre privilège par mission, droits temporaires, secrets serveur, source externe non fiable, séparation instruction/donnée, schémas de sortie, redaction des logs, contexte limité au dossier concerné, aucune PII dans la télémétrie, approbations liées à une version, audit sans payload sensible, révocation, rétention, export, effacement, pause par agent/département et kill switch global.

Le budget est hiérarchique : entreprise -> département -> agent -> mission -> appel outil. Le premier dépassement bloque l'étape suivante. Les retries ont un plafond, utilisent une clé d'idempotence et ne rejouent jamais automatiquement une action externe. Voir `SECURITY_AND_COST_CONTROLS.md`.

## 15. V1 utile, puis montée en capacité

### Première tranche recommandée

Après validation explicite, vérifier d’abord la gate de socle opérationnel décrite dans `ROADMAP.md` : intake/triage, projets, interactions/promesses, tâches humaines, TIM, vue « Aujourd’hui », audit et Access doivent être réellement fiables. Sinon, achever cette tranche cockpit avant tout développement agentique.

Construire ensuite un control plane/COS-01 minimal cloud-only puis un agent Opérations en mode shadow :

- lecture de vues minimisées et fictives pendant les tests ;
- détection des dossiers sans prochaine action, tâches échues, promesses dues et TIM à surveiller ;
- briefing quotidien préparé, non envoyé, limité à 3 à 7 items ;
- propositions de tâches ou alertes, jamais appliquées sans revue au début ;
- budget, timeout, journal et kill switch dès le premier incrément ;
- mesure du temps de préparation économisé et des faux positifs.

### Critère de passage à l'étape suivante

Mouaad doit constater un gain net : moins d'oublis et moins de temps de reconstitution, sans hausse disproportionnée des validations, faux positifs ou coûts. Si la file d'approbation devient une nouvelle boîte de réception à vider, le système est mal calibré.

## 16. Ce qui n'est pas dans le périmètre

- développement ou activation d'un agent ;
- nouveau schéma D1, migration ou backfill ;
- connecteur Gmail, Calendar, Drive, réseau social ou fournisseur de modèle ;
- API Yanport supposée ;
- ingestion silencieuse d'une boîte email, d'un vault ou d'un Drive ;
- prospection, envoi, publication ou prise de rendez-vous autonome ;
- estimation automatique, conseil juridique ou engagement financier ;
- paiement, modification de mandat, offre d'achat ou validation finale d'un matching ;
- mémoire vectorielle globale contenant toutes les données clients ;
- équipe de sous-agents dynamiques créés par les agents ;
- modification du site, du cockpit, des assets ou de la direction artistique ;
- migration, déploiement ou données réelles.

Ces éléments sont différés parce qu'ils exigent des décisions, connecteurs, contrats, tests ou autorisations qui n'existent pas encore.

## 17. Contre-revue critique

| Question | Verdict | Correction ou garde-fou retenu |
|---|---|---|
| Utile avec 5 à 20 dossiers ? | Oui, si la V1 commence par les oublis et briefings ; non si neuf agents tournent immédiatement | Deux agents activés seulement dans la première tranche ; les neuf rôles restent des contrats logiques |
| Certains agents peuvent-ils être supprimés ? | Oui à l'exécution initiale | Marché, croissance, produit, finance et conformité ne deviennent des runtimes distincts qu'après preuve de volume ; aucun agent « recherche générale », « rédacteur » ou « analyste » séparé |
| Plus d'administration qu'elle n'en retire ? | Risque élevé | Approbations regroupées, briefing court, proposition expirée, métrique de charge de revue et arrêt si le coût humain augmente |
| Une action sensible peut-elle échapper à validation ? | Pas dans l'architecture | Deny-by-default, matrice d'autorité, approbation liée à la version, exécution externe séparée, silence != approbation |
| Un agent peut-il modifier une donnée confirmée ? | Non | Proposition granulaire puis commande humaine ; contrôle de version ; journal ; critères confirmés protégés |
| Une erreur peut-elle contaminer plusieurs dossiers ? | Risque contenu mais réel | Scope mono-dossier par défaut, pas de fan-out non approuvé, limites de lot, canary fictif, corrélation et circuit breaker |
| Exposition au mauvais agent ? | Non par conception | Vues minimisées, compartiments par département et mission, droits temporaires, aucune recherche globale par défaut |
| Coûts incontrôlables ? | Contrôlables si les plafonds précèdent le modèle | Budgets imbriqués, estimation, contexte limité, modèles économiques, cache de données publiques versionnées, retries limités et kill switch |
| Utilisable sans IA ? | Oui, exigence structurante | Cockpit et commandes manuelles restent autorité ; agents en couche additive ; aucune transition métier ne dépend uniquement d'un modèle |
| Briefing court ? | Oui si règle dure | 3 à 7 priorités, regroupement des doublons, lien vers détail, aucun inventaire complet dans le briefing |
| Fallback humain dans chaque workflow ? | Oui | File manuelle, état explicite `waiting_input` ou `failed`, source et contexte conservés, jamais de panne silencieuse |
| Premier incrément utile ? | Oui | Dossiers sans prochaine action, promesses et TIM ; mesure avant extension |
| Dépendance excessive aux API ? | Évitée | Architecture hybride, statuts manuel/futur/à vérifier, Yanport manuel, aucune API supposée |
| Site, cockpit et agents forment-ils un seul système ? | Oui si D1 et les contrats restent centraux | Les canaux produisent des événements ; le cockpit commande ; les agents proposent ; aucun silo parallèle |
| Les agents améliorent-ils la conversation humaine ? | Mesurable, pas garanti | North Star, qualité du briefing, contexte confirmé, issue de l'échange et retour terrain priment sur le volume |

### Résultat de la contre-revue

L'architecture est retenue avec une **réduction d'exécution**, pas une réduction de vision : neuf responsabilités logiques, deux agents seulement dans la première tranche, aucune autonomie externe, aucun connecteur considéré disponible sans vérification. Le principal risque n'est pas l'incapacité technique ; c'est de créer une nouvelle couche de gestion. La roadmap impose donc une preuve de temps gagné et de faux positifs acceptables avant chaque nouvel agent.

## 18. Critères d'acceptation de cette architecture documentaire

- chaque cible possède une offre et un moment de relais humain ;
- chaque département possède mission, entrées, sorties, métriques, risques et validations ;
- chaque agent possède une fiche complète, un plafond d'autonomie et un exemple fictif ;
- chaque événement possède producteur, consommateur, idempotence, validité et mode d'échec ;
- chaque workflow possède validation, fallback, coût et arrêt ;
- les mémoires ne se disputent pas l'autorité ;
- aucune action sensible n'est implicite ;
- les architectures cloud, locale et hybride sont comparées ;
- la première tranche apporte une valeur exploitable sans attendre l'organisation complète ;
- les décisions non prises sont listées dans `DECISIONS_REQUIRED.md`.

## 19. Règle de passage au développement

Aucun développement agentique ne commence sur la base de ce document seul. Mouaad doit d'abord valider les décisions bloquantes, le périmètre de la première tranche, les niveaux d'autonomie, les budgets, la politique de rétention, les connecteurs et les tests d'autorité. La construction doit ensuite suivre `ROADMAP.md`, par capacités réversibles et désactivées par défaut.
