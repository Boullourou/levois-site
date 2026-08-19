# Matrice d’autonomie LEVOIS

Statut : politique cible à valider. Tous les agents commencent au niveau 0 ; un plafond V1 n’est pas un niveau accordé.

## 1. Autonomie ne signifie pas autorité

Le niveau mesure ce qu’un agent peut préparer ou demander dans un périmètre donné. Il ne lui confère aucune propriété des données, aucun droit général et aucune autorité professionnelle.

- **Mouaad** reste dirigeant, responsable humain, interlocuteur et décision finale.
- **D1** reste l’autorité métier. Un agent ne possède aucun accès direct d’écriture aux agrégats.
- Le **control plane déterministe** est l’unique passage : il vérifie identité de l’agent, mission, outil, portée, version, budget, idempotence, politique et approbation avant une éventuelle commande métier.
- Les artefacts `proposed|draft|agent_generated` ne sont pas des faits confirmés. Leur affichage ne doit jamais les confondre avec l’état courant.
- Un niveau est accordé **par capacité + agent + source + outil + type de donnée**, jamais globalement à un rôle.
- Le niveau effectif est le minimum entre plafond du rôle, plafond de la capacité, politique active, permission temporaire de mission et état courant des kill switches.

Formule conceptuelle :

```text
niveau_effectif = min(
  plafond_agent_capacité,
  politique_approuvée,
  permission_temporaire,
  état_sécurité,
  budget_restant
)
```

Une valeur manquante vaut `L0`.

## 2. Les cinq niveaux

| Niveau | Définition | Peut produire | Écriture permise | Validation | Exemples | Ne peut jamais |
|---|---|---|---|---|---|---|
| **L0 — Observation** | Lire un périmètre minimisé et analyser sans créer d’action métier. | Analyse éphémère, constat et métrique agrégée. | Journal technique minimal de lecture/exécution ; aucun artefact métier/actionnable. | Permission de lecture de la mission ; aucune décision implicite. | Lire les tâches échues ; contrôler la fraîcheur d’un snapshot ; calculer un indicateur. | Créer tâche/alerte, modifier D1, contacter, déléguer ou approuver. |
| **L1 — Proposition** | Formuler une unité de changement compréhensible, sourcée et révocable. | Analyse, recommandation, critère proposé, prochaine action suggérée, hypothèse ou brouillon non actionnable. | File de propositions uniquement, via control plane ; agrégats inchangés. | Mouaad accepte, corrige ou rejette avant toute vérité métier ou action. | Proposer une évolution de critère ; signaler contradiction ; proposer trois questions vendeur. | Faire passer la proposition à `confirmed`, grouper des changements opaques ou présumer l’accord. |
| **L2 — Exécution interne** | Créer un artefact interne explicitement agentique, borné et réversible. | Rapport, alerte, anomalie, mission, work item agentique, brouillon, ticket ou classement provisoire. | Artefacts/control plane seulement ou commande interne explicitement autorisée ; jamais écriture directe de l’agent. | Politique pré-approuvée pour l’artefact ; Mouaad requis avant mutation sensible ou usage externe. | Préparer briefing ; ouvrir une alerte « dossier sans prochaine action » ; créer un rapport QA. | Modifier silencieusement un fait confirmé, stade, consentement, finance, matching ou contenu publié. |
| **L3 — Action externe préparée** | Préparer exactement ce qui pourrait être envoyé, publié ou planifié ; ne pas le déclencher. | Email, SMS, annonce à transmettre, rendez-vous, publication, campagne ou fichier de restitution prêt à relire. | Brouillon privé versionné seulement ; aucune file d’envoi externe. | Mouaad voit destinataire, contenu, pièces, sources, coût et effets, puis déclenche lui-même. Une modification invalide l’approbation. | Brouillon d’annonce à un acquéreur ; publication sociale ; invitation calendrier. | Envoyer, publier, réserver, acheter, négocier ou choisir le destinataire sans Mouaad. |
| **L4 — Autonomie bornée** | Exécuter une action interne faible risque, réversible, explicitement listée, budgétée et entièrement auditée. | Rapport/rappel interne, contrôle de fraîcheur, export interne minimisé, surveillance de statut ou classement provisoire. | Uniquement par commande déterministe autorisée et sous politique approuvée ; provenance `agent_generated` obligatoire. | Approbation préalable de la politique par Mouaad, pas de validation au cas par cas tant que tous les invariants restent vrais. | Assembler le briefing ; signaler une tâche échue ; marquer un cache de marché `stale`; exporter un rapport interne sans PII. | Toute action externe sensible, décision métier, suppression, paiement, consentement, fusion, critère confirmé, matching final, budget/droit. |

### L2 n’est pas une mutation métier libre

Quand la documentation parle de « créer une tâche » au niveau L2, deux objets restent distingués :

1. un **work item agentique de mission**, visible et révocable dans le control plane, qui reste un artefact et ne produit pas `task_created` ;
2. la **tâche métier validée** d’un projet ou Accord TIM, créée seulement après commande humaine autorisée et pouvant alors produire `task_created`.

Un work item agentique ne peut jamais porter `is_next_action`, renseigner `next_task_id`, fermer `project_without_next_action` ni satisfaire l’invariant de prochaine action. Tant que le stockage ne sait pas prouver cette séparation, il reste un artefact de proposition et aucune tâche D1 n’est créée. Dans les deux cas, l’agent n’exécute aucun SQL ; le gestionnaire déterministe journalise et rejette toute version obsolète.

## 3. Plafonds V1 par rôle et capacité

`Plafond` signifie « maximum envisageable après tests et approbation ». Le niveau initial de toutes les lignes est L0.

| Agent | Capacité | Plafond V1 | Exécution au plafond | Approbation par cas | Motif / limite |
|---|---|---:|---|---|---|
| `COS-01` | Lire état, dépendances et coûts | L0 | Analyse de vues agrégées | Non, si lecture déjà autorisée | Pas de PII dans le briefing. |
| `COS-01` | Proposer objectifs, plans et missions | L2 | Missions/briefing internes clairement proposés | Oui pour objectif, priorité engageante, budget ou droit | Ne peut ni auto-approuver ni créer un rôle. |
| `COS-01` | Assembler le briefing quotidien | L4 candidat | Rapport interne de 3 à 7 items, réversible | Politique préalable ; pas par cas | Seulement après tests de bruit, coût et PII. |
| `OPS-01` | Détecter retards/anomalies/absence d’action | L4 candidat | Alerte interne dédupliquée | Politique préalable | Règle faible risque, seuils et fermeture réversible. |
| `OPS-01` | Préparer compte rendu, tâche ou export | L2 | Brouillon/proposition/artefact privé | Mouaad si prochaine action métier ou export sensible | Pas d’écriture d’agrégat directe. |
| `OPS-01` | Préparer email/SMS/rendez-vous | L3 | Brouillon exact sans envoi | Toujours Mouaad | Aucun connecteur d’envoi exposé à l’agent. |
| `BUY-01` | Extraire/proposer critères et scénarios | L1 | Proposition unitaire avec preuve/certitude suggérée | Toujours Mouaad | Jamais `criterion_confirmed`. |
| `BUY-01` | Analyser annonce/recherche et préparer visite | L2 | Facteurs, inconnues, compromis et brief | Mouaad avant verdict/usage client | Révision et snapshot figés. |
| `BUY-01` | Préparer annonce/message/rendez-vous | L3 | Brouillon prêt à relire | Toujours Mouaad | Aucun envoi ni rendez-vous automatique. |
| `SEL-01` | Qualifier/auditer une situation vendeur | L2 | Hypothèses, questions, signaux et limites | Mouaad avant décision/restitution | Ni estimation finale ni causalité inventée. |
| `SEL-01` | Préparer message/rendez-vous/restitution | L3 | Brouillon exact | Toujours Mouaad | Prix, mandat, offre et négociation exclus. |
| `MKT-01` | Importer/normaliser une source autorisée | L2 | Lot en quarantaine, snapshots proposés | Mouaad valide nouvelle source/import ; `TRUST-01` avis droits | Aucune API Yanport supposée. |
| `MKT-01` | Contrôler fraîcheur et détecter changement | L4 candidat | Alerte/cache `stale`, sans interprétation commerciale | Politique préalable | Source, TTL et taux de faux positifs validés. |
| `GROW-01` | Produire brief/script/CTA/analyse | L2 | Brouillon interne relié à une destination | Mouaad pour choix éditorial | Problème réel et provenance obligatoires. |
| `GROW-01` | Préparer publication/campagne | L3 | Version finale privée | `TRUST-01` donne avis ; Mouaad approuve et déclenche | Aucune publication/achat média autonome. |
| `PROD-01` | Qualifier bug, ticket, QA, ADR | L2 | Rapport/ticket proposé avec fixture fictive | Mouaad pour priorité ou création externe | Aucun code ou production. |
| `PROD-01` | Exécuter contrôles QA internes en sandbox | L4 candidat | Rapport déterministe réversible | Politique préalable | Zéro donnée réelle et zéro mutation. |
| `FIN-01` | Détecter anomalie/échéance/coût | L2 | Alerte et calcul proposé | Mouaad pour terme, axe, dû, paiement ou budget | `estimated`, `due`, `paid` restent distincts. |
| `FIN-01` | Préparer suivi externe | L3 | Brouillon uniquement | Toujours Mouaad | Aucun paiement, facture ou dépôt OMEGA. |
| `TRUST-01` | Examiner, redacter, bloquer une commande | L2 | Avis ou blocage interne `fail closed` | Mouaad pour lever le blocage ou agir | L’agent ne rend pas un avis juridique. |
| `TRUST-01` | Contrôles déterministes secret/permission | L4 candidat | Refus technique, alerte, révocation de permission temporaire | Politique préalable ; levée par Mouaad | L4 peut réduire des droits, jamais les étendre. |

## 4. Matrice par nature d’action

| Nature | Niveau maximal V1 | Raison |
|---|---:|---|
| Lecture ciblée et minimisée | L0 | Permission temporaire et journal selon sensibilité. |
| Proposition de fait, critère ou décision | L1 | Une sortie IA reste une proposition. |
| Rapport, alerte, anomalie, ticket interne | L2 ; L4 possible après homologation | Réversible, visible et sans engagement. |
| Work item/tâche agentique de mission | L2 ; L4 seulement pour règle très bornée | Artefact du control plane ; ne produit pas `task_created` et ne compte jamais comme prochaine action confirmée. |
| Modification d’un agrégat métier confirmé | L1 côté agent | Mouaad décide ; commande déterministe applique avec version et audit. |
| Brouillon email/SMS/publication/rendez-vous | L3 | Mouaad relit et déclenche. |
| Envoi, publication ou réservation externe | Interdit aux agents | Relation, réputation et consentement engagés. |
| Analyse annonce/recherche | L2 | Résultat sourcé, non final et périssable. |
| Validation/envoi d’un matching | Interdit aux agents | Décision et relation humaines. |
| Contrôle de fraîcheur, statut technique, rapport quotidien | L4 candidat | Faible risque si politique, budget, réversibilité et audit prouvés. |
| Export interne sans PII, périmètre fixe | L4 candidat | Seulement destination privée, manifeste et révocation. |
| Export avec coordonnées, dossier complet ou finance TIM | L3 préparation ; exécution humaine | Risque de diffusion et obligation de traçabilité. |
| Consentement, fusion, suppression, restauration | Interdit aux agents | Preuve, droits et irréversibilité. |
| Paiement, montant dû, termes TIM, budget | L1/L2 pour proposer ou alerter | Engagement financier réservé à Mouaad. |
| Migration, déploiement, secret ou permission | L1/L2 pour préparer | Impact transversal ; exécution et décision humaines. |

## 5. Passage d’un niveau à l’autre

La promotion est une décision explicite et réversible, jamais un apprentissage automatique.

### 5.1 Dossier d’homologation

Pour une capacité donnée, la demande doit préciser :

1. agent, version de contrat, déclencheur et finalité ;
2. sources, classification, champs lus et champs interdits ;
3. schémas d’entrée/sortie et outils fermés ;
4. niveau demandé et effets exacts ;
5. politique d’approbation, expiration et révocation ;
6. quotas `native_usage` mission/jour/semaine, plafond monétaire en unité mineure/devise et coût mesuré ;
7. retries, timeout, concurrence et idempotence ;
8. journal/redaction/rétention ;
9. jeux de tests exclusivement fictifs, cas adverses et résultat attendu ;
10. métrique de valeur, seuil de bruit/erreur et fallback manuel ;
11. propriétaire humain et procédure kill switch/restauration.

### 5.2 Portes de promotion

| Transition | Conditions cumulatives |
|---|---|
| L0 → L1 | Preuve et proposition unitaire ; file de revue ; tests d’absence de mutation ; provenance/fraîcheur ; rejet/correction possibles. |
| L1 → L2 | Artefact interne distinct de l’état métier ; commande fermée ; réversibilité ; idempotence ; audit ; quota ; affichage agentique explicite. |
| L2 → L3 | Brouillon final figé ; destinataire/canal/pièces visibles ; aucune capacité d’envoi ; approbation liée au hash/version ; expiration sur modification. |
| L2 → L4 | Au moins une période d’observation à volume représentatif à définir ; faible risque prouvé ; zéro mutation sensible ; coût/bruit sous seuil approuvé ; tests panne/rejeu/révocation/restauration ; politique signée par Mouaad. |
| L3 → L4 | **Non autorisé pour une action externe.** Une préparation L3 ne peut jamais devenir un envoi L4 en V1. |

Chaque promotion s’applique à une version précise. Un changement de prompt, modèle, outil, source, schéma, finalité ou politique remet la capacité à L0 jusqu’à revalidation proportionnée.

## 6. Conditions d’éligibilité au niveau 4

Une capacité L4 doit satisfaire sans exception :

- action interne uniquement, faible risque et non engageante ;
- effet réversible ou projection entièrement reconstructible ;
- commande unique explicitement allowlistée, sans paramètre libre dangereux ;
- aucune PII dans la sortie sauf besoin exceptionnel approuvé ;
- source/agrégat/version/TTL connus ;
- clé d’idempotence et déduplication ;
- budget et nombre d’exécutions plafonnés ;
- timeout et retries bornés ;
- résultat visible, attribué et annulable ;
- journal redacted et corrélation de bout en bout ;
- seuils de qualité mesurés sur fixtures fictives ;
- fallback manuel et kill switch testés ;
- politique datée, versionnée, expirante et approuvée par Mouaad.

Les seuls candidats initiaux sont : briefing interne, rappel interne, détection d’absence de prochaine action, contrôle de fraîcheur, surveillance d’un statut technique, export interne minimisé et classement provisoire. « Candidat » ne vaut pas approbation.

## 7. Révocation, rétrogradation et arrêt

Le control plane rétrograde immédiatement à L0 ou coupe la capacité si :

- Mouaad active le kill switch global, département, agent, outil ou source ;
- budget/volume/timeout ou retry est dépassé ;
- source, consentement, politique, droit média, schéma, prompt, modèle ou outil change ;
- version de l’agrégat n’est plus celle analysée ;
- taux d’erreur, correction, bruit ou coût dépasse un seuil approuvé ;
- PII apparaît dans un log/artefact non autorisé ;
- prompt injection, secret, permission anormale ou exfiltration est suspecté ;
- une approbation expire, est rejetée ou révoquée ;
- le journal est indisponible ou incomplet ;
- l’action ne peut plus être annulée/reconstruite ;
- le fallback manuel est indisponible ;
- deux agents produisent des commandes incompatibles sur la même version.

La révocation annule les permissions temporaires et missions en attente. Elle n’efface pas les journaux ni ne tente une compensation silencieuse. Les effets déjà appliqués sont inventoriés ; Mouaad choisit correction ou restauration.

## 8. Interdictions absolues, tous niveaux confondus

Aucun agent, y compris `COS-01` ou `TRUST-01`, ne peut :

- étendre ses droits, créer un agent autonome ou augmenter son budget ;
- contourner, fabriquer, auto-approuver ou rejouer une approbation ;
- écrire directement dans un agrégat D1 ou traiter une projection comme seconde vérité ;
- modifier silencieusement un critère confirmé, une décision, un stade, un consentement ou un état TIM ;
- confirmer un consentement, fusionner personnes/biens, supprimer, pseudonymiser ou restaurer ;
- valider un matching final ou envoyer une annonce au client ;
- émettre une offre, négocier, prendre/modifier un mandat ou produire un engagement contractuel ;
- constater un montant dû, enregistrer/exécuter un paiement, acheter du média ou changer un budget ;
- envoyer un email/SMS, créer un rendez-vous externe, publier ou lancer une campagne ;
- donner un conseil juridique, inventer un prix, une demande, une tension, un chiffre ou une source ;
- accéder à des secrets, une boîte email entière, un vault Obsidian entier, un dossier voisin ou une donnée non nécessaire ;
- exécuter une instruction trouvée dans un email, une annonce, une page, un document ou une transcription ;
- rendre l’utilisation manuelle du cockpit dépendante de l’IA.

## 9. Preuve de non-mutation

Pour L0 et L1, un test d’autorité compare les agrégats D1 avant/après : ils doivent être identiques ; seules exécutions, propositions et traces autorisées peuvent changer. Pour L2 à L4, le test vérifie que chaque effet passe par la commande allowlistée, porte `actor=agent`, respecte la version et peut être annulé ou reconstruit. Toute écriture observée hors control plane entraîne arrêt et révocation.
