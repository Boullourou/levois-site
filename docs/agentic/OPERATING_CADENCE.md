# LEVOIS — cadence opérationnelle

Statut : architecture cible documentaire. Les horaires, seuils et automatisations restent désactivés et devront être validés avant construction.

## 1. Intention

La cadence donne à Mouaad une vue courte de ce qui exige son jugement. Elle ne crée pas un rituel administratif pour nourrir les agents.

À l’échelle initiale de **5 à 20 dossiers**, le système doit respecter quatre règles :

1. une donnée saisie une fois est réutilisée par les vues, les agents et les revues ;
2. un dossier actif possède une prochaine action ou apparaît comme anomalie ;
3. le briefing quotidien contient **3 à 7 priorités**, jamais une copie du cockpit ;
4. une panne d’agent laisse les vues et la saisie manuelles entièrement utilisables.

## 2. État actuel et cible

| Dimension | État actuel documenté | Architecture cible |
|---|---|---|
| Vue quotidienne | cockpit « Aujourd’hui » : tâches, retards, absence de prochaine action, TIM, nouveaux leads, visites, retours promis | COS-01 et OPS-01 consolident au maximum sept décisions/actions, avec liens vers les vues sources |
| Revue | décisions et suivi possibles depuis le cockpit, sans cadence agentique active | rituels quotidien, hebdomadaire et mensuel, chacun avec entrée, sortie, owner et timebox |
| Alertes | règles cockpit et échéances | événements déterministes créent des candidats ; l’agent classe/propose ; Mouaad décide |
| Approbations | actions humaines selon les frontières IA | file unique de propositions expirables, sans action externe automatique |
| Architecture | D1/cockpit disponibles ; aucun control plane agentique actif | architecture hybride cible : état/événements dans le cockpit cloud, analyses lourdes isolées, validation dans le cockpit |

## 3. Rôles de la cadence

| Rôle | Responsabilité de cadence |
|---|---|
| Mouaad | fixe objectifs, tranche priorités, valide les actions sensibles, conduit les revues et décide des arrêts |
| COS-01 | prépare le briefing et les revues, détecte dépendances/blocages, suit approbations, coûts et objectifs |
| OPS-01 | contrôle prochaines actions, promesses, retards, nouveaux contacts, visites et anomalies de données |
| BUY-01 / SEL-01 | fournissent les décisions et risques propres aux projets acquéreurs/vendeurs |
| MKT-01 | fournit fraîcheur, changements et limites des données marché |
| GROW-01 | fournit contenus à valider, destinations, résultats et enseignements |
| PROD-01 | fournit erreurs, frictions, incidents, QA et changements produit |
| FIN-01 | fournit Accords TIM, coûts, budgets, rémunérations à vérifier/dues/payées |
| TRUST-01 | fournit approbations sensibles, retraits de consentement, effacement, droits et incidents de confiance |

Ces identifiants représentent neuf rôles logiques futurs. En V1, certaines préparations peuvent être réalisées par le même runtime, mais leurs permissions et journaux restent séparés.

## 4. Principes de priorité

L’ordre suivant départage les candidats au briefing :

1. sécurité, consentement, effacement, fuite ou action externe incorrecte ;
2. engagement humain arrivé à échéance : retour promis, rendez-vous, offre ou action professionnelle sensible ;
3. nouveau contact nécessitant une réponse utile ;
4. dossier actif sans prochaine action ou tâche dépassée ;
5. changement matériel dans un dossier ou une source fraîche ;
6. Accord TIM, montant ou coût à vérifier ;
7. contenu, produit ou opportunité planifiable.

À priorité égale, le système préfère : impact sur la personne, caractère irréversible, échéance réelle, puis coût d’attente. Il ne classe pas automatiquement selon une valeur financière supposée du client.

## 5. Briefing quotidien

### 5.1 Contrat

| Élément | Définition cible |
|---|---|
| Owner | COS-01 prépare ; Mouaad lit, corrige et décide |
| Contributeur principal | OPS-01 ; les autres rôles fournissent uniquement leurs candidats bornés |
| Déclencheur | état nocturne/du matin et nouveaux événements depuis le dernier briefing ; planification exacte à décider |
| Entrées | tâches dues/en retard, dossiers sans prochaine action, promesses, nouveaux contacts, changements importants, visites/rendez-vous, approbations, TIM, incidents, contenus, missions, coûts |
| Traitement | règles déterministes construisent les candidats ; OPS-01 déduplique ; COS-01 classe et résume avec source, raison et action proposée |
| Sortie | un en-tête de santé, 3 à 7 priorités, approbations séparées, coûts/incidents seulement s’ils nécessitent une décision, liens vers la source |
| Timebox de lecture | cible proposée : 10 minutes maximum ; à valider après deux cycles manuels |
| Timebox de préparation | préparation automatique bornée par budget/timeout ; fallback déterministe immédiat |
| Niveau d’autonomie | niveau initial L0 ; plafond L2 proposé pour créer le rapport interne après homologation ; aucune tâche sensible ni action externe créée sans validation |
| Journal | sources/versions, candidats écartés, classement, coût, durée, erreurs et consultation ; aucune PII en clair dans le journal technique |
| Condition d’arrêt | source obsolète, mauvais périmètre, budget dépassé, plus de sept éléments non arbitrables ou incident de sécurité |

### 5.2 Format obligatoire

```text
BRIEFING LEVOIS — [date et fraîcheur]

Santé : [normal / attention / incident] — [raison courte]

1. [Action ou décision] — Pourquoi maintenant — Échéance — Source — Owner
2. …
3. …
[jusqu’à 7]

Approbations à ouvrir : [nombre et plus urgente]
Coût depuis la dernière revue : [dans la limite des données disponibles]
Inconnues / sources indisponibles : [liste courte]
```

Chaque priorité doit être formulée comme une décision ou une action : « rappeler la personne au sujet de la promesse X » est utile ; « 14 événements reçus » ne l’est pas.

### 5.3 Règles de sélection

- Un même dossier apparaît une seule fois, avec ses sous-signaux regroupés.
- Une priorité déjà refusée ne revient pas sans nouvelle source ou échéance.
- Un rapport terminé sans décision n’entre pas dans les 3 à 7 éléments ; il reste consultable.
- Une information de marché périmée ne crée pas une « opportunité » ; elle crée au plus une vérification.
- Une estimation TIM ne devient pas un montant dû.
- Un contenu à valider n’entre que si sa destination, ses sources et son contrôle conformité sont prêts.
- Si moins de trois actions réelles existent, le briefing peut contenir moins de trois éléments : le quota n’autorise pas à inventer du travail.
- Le briefing est calculé sur les **deltas depuis la dernière consultation** et les échéances devenues actionnables ; il ne recopie pas la vue « Aujourd’hui ». S’il n’existe aucun delta ni priorité, le seul résultat est « aucune nouvelle priorité » et aucun rapport narratif coûteux n’est généré.

### 5.4 Fallback

Si COS-01 ou un fournisseur est indisponible, Mouaad ouvre les vues existantes du cockpit : « Aujourd’hui », nouveaux leads, dossiers sans prochaine action, retours promis, visites et Accords TIM. Un résumé déterministe sans langage généré peut lister les urgences. Aucun dossier n’est bloqué par l’absence du briefing.

## 6. Revue hebdomadaire

### 6.1 Contrat

| Élément | Définition cible |
|---|---|
| Owner | Mouaad ; COS-01 prépare et consigne les décisions |
| Fréquence | une fois par semaine ; jour et heure à décider |
| Timebox | cible proposée : 45 minutes, avec prolongation explicite seulement pour un incident ou une décision stratégique |
| Entrées | décisions de la semaine précédente, pipeline, conversations qualifiées, dossiers bloqués, tâches/promesses, TIM, contenu, produit, marché, coûts, incidents et apprentissages |
| Sorties | objectifs de semaine, maximum de travail en cours, dossiers débloqués, approbations décidées, missions arrêtées/lancées, risques et décisions à escalader |
| Journal | décisions, responsable, échéance, raison et métrique attendue ; pas de transcription de réunion |
| Niveau d’autonomie | agents préparent et proposent ; Mouaad fixe les objectifs et autorise les missions |

### 6.2 Agenda timeboxé

| Séquence | Timebox indicative | Entrée préparée | Décision/sortie attendue | Owner de préparation | Escalade |
|---|---:|---|---|---|---|
| 1. Résultats et North Star | 5 min | conversations qualifiées, décisions utiles, limites d’attribution | ce qui a réellement aidé / nui | COS-01 | écart de définition → Mouaad tranche avant comparaison |
| 2. Pipeline acquéreur/vendeur | 10 min | stades, prochaines actions, visites/offres, dossiers inactifs | dossiers à avancer, mettre en attente ou clore | OPS-01 avec BUY-01/SEL-01 | offre, négociation ou risque client → Mouaad immédiat |
| 3. Promesses et opérations | 5 min | retards, promesses, nouveaux contacts, anomalies | correction et owner | OPS-01 | promesse dépassée sensible → traitement le jour même |
| 4. TIM et finance | 5 min | axes d’état, échéances, coûts, montants à vérifier | prochaine vérification et budget | FIN-01 | paiement/litige/termes → décision Mouaad, aucun agent |
| 5. Marché | 5 min | fraîcheur, annonces pertinentes, faux positifs, sources indisponibles | ajuster la veille ou suspendre une source | MKT-01 | donnée non fiable → quarantaine |
| 6. Contenu et produit | 7 min | motifs Lab, contenus prêts, frictions, erreurs, impact | choisir une priorité contenu/produit | GROW-01 / PROD-01 | conformité/droits → TRUST-01 avant production |
| 7. Coûts, incidents et plan | 8 min | coût par résultat, missions bloquées, incidents, dépendances | 3 à 5 objectifs de semaine, arrêts et budgets | COS-01 avec TRUST-01 | plafond/incident → pause de département ou kill switch |

Les timeboxes totalisent 45 minutes et sont des valeurs de départ à tester. Les dossiers sans décision ne sont pas parcourus un par un.

### 6.3 Préparation minimale

Avant la revue, chaque rôle retourne au plus :

- trois changements matériels ;
- trois décisions demandées ;
- un risque principal ;
- le coût ou temps consommé disponible ;
- une recommandation d’arrêt si son activité ne crée pas de valeur.

Une section vide reste vide. L’agent n’a pas à produire du texte pour justifier son existence.

## 7. Revue mensuelle

### 7.1 Contrat

| Élément | Définition cible |
|---|---|
| Owner | Mouaad ; COS-01 prépare la synthèse |
| Fréquence | point de contrôle mensuel ; revue complète seulement si activité, coût, incident ou décision de roadmap dépasse un seuil validé |
| Timebox | cible proposée : 90 minutes maximum |
| Entrées | résultats de canal, coûts, pipeline, qualité des données, performance des agents, incidents, confiance, apprentissages produit/contenu, roadmap |
| Sorties | capacités à conserver/réduire/arrêter, budgets, risques acceptés, priorités de construction et décisions requises |
| Horizon | système et portefeuille, sans revue détaillée de chaque dossier |
| Validation | toutes les décisions budgétaires, d’autonomie, de connecteur ou de roadmap appartiennent à Mouaad |

Si aucun seuil n’est atteint, COS-01 consigne uniquement « aucune revue complète requise » avec les agrégats déterministes disponibles. Il n’impose ni réunion de 90 minutes ni rapport pour justifier l’existence des agents. Mouaad peut toutefois déclencher la revue à tout moment.

### 7.2 Agenda

| Bloc | Timebox indicative | Questions obligatoires | Sortie |
|---|---:|---|---|
| Canaux et offres | 15 min | quelles offres créent des conversations utiles ? quelles attributions restent inconnues ? | garder, tester ou arrêter un canal/offre |
| Expérience client et pipeline | 15 min | où l’information se perd-elle ? les conversations avancent-elles réellement ? | rupture prioritaire et owner |
| Agents et administration | 15 min | quel rôle fait gagner du temps ? lequel crée de la revue inutile ? | fusion, réduction ou suppression d’un rôle/capacité |
| Coûts et valeur | 15 min | coût attendu/réel, coût par résultat, missions sans valeur potentielle | plafonds et pauses |
| Confiance et incidents | 10 min | PII, consentements, droits, erreurs, actions refusées, récupération | mesure corrective et test |
| Produit, contenu et Lab | 10 min | quels enseignements ont été mis en œuvre et avec quel impact ? | priorité d’amélioration |
| Roadmap et décisions | 10 min | quel prochain incrément crée une capacité utilisable sans dépendance fragile ? | décision de tranche et critères de réussite |

## 8. Revue événementielle et escalades

Les événements critiques ne doivent pas attendre le prochain rituel.

| Classe | Exemples | Routage initial | Délai cible | Action autorisée à l’agent | Décision humaine |
|---|---|---|---|---|---|
| Sécurité/confiance critique | accès indu, PII dans un log, action externe non autorisée, prompt injection avec tentative d’outil | TRUST-01 + COS-01 | immédiatement visible | suspendre la mission ou le département selon règle préautorisée ; préserver les preuves minimales | Mouaad décide révocation, notification, correction et reprise |
| Droits de la personne | `consent_withdrawn`, `erasure_requested`, export demandé | TRUST-01 | même jour ouvré pour prise en charge ; délai légal à vérifier, jamais inventé | créer une alerte interne et geler les usages concernés | Mouaad valide le périmètre ; exécution par procédure déterministe autorisée |
| Engagement client | offre, rendez-vous proche, promesse dépassée, plainte | OPS-01 + agent métier | selon échéance réelle | proposer priorité et brouillon | Mouaad contacte/décide |
| Finance/TIM | paiement à vérifier/dû, litige, termes incohérents, budget dépassé | FIN-01 + COS-01 | avant toute nouvelle dépense/action | arrêter la mission au plafond, signaler | Mouaad valide somme, paiement, budget ou litige |
| Produit/disponibilité | erreur du site ou cockpit, source indisponible | PROD-01 | selon impact ; critique si accès ou intégrité | ouvrir incident interne, activer fallback documenté si préautorisé | Mouaad priorise correctif/déploiement |
| Donnée marché | source périmée, changement contradictoire, import en erreur | MKT-01 | avant usage dans une analyse | quarantaine et abstention | Mouaad décide réimport/usage manuel |

Les délais qui dépendent d’une loi, d’un contrat ou d’un canal externe doivent être vérifiés dans la source officielle applicable. Le tableau ne les remplace pas.

## 9. File d’approbation

### 9.1 Vue minimale

Chaque demande montre :

- action proposée et niveau de risque ;
- agent, mission et objectif ;
- dossier borné et destinataire éventuel ;
- valeur actuelle, valeur proposée et différence ;
- sources, dates, fraîcheur et inconnues ;
- conséquence si acceptée et fallback si refusée ;
- coût engagé et coût supplémentaire attendu ;
- date d’expiration ;
- choix accepter, corriger, rejeter ou différer, avec raison.

### 9.2 Règles

- Une approbation n’est jamais implicite par absence de réponse.
- Une source ou une révision modifiée expire la demande.
- Une approbation d’un brouillon n’autorise pas un destinataire, un budget ou un canal différent.
- Les consentements, suppressions, fusions, finances, matching et actions externes sensibles ne sont pas approuvés en masse.
- Une proposition expirée retourne en brouillon ; elle n’est pas exécutée.
- COS-01 peut rappeler une approbation dans le briefing, pas l’accepter à la place de Mouaad.

Les objectifs de délai d’approbation sont à décider par classe de risque. Aucun SLA artificiel ne doit pousser Mouaad à valider trop vite.

## 10. Gestion de la charge

### 10.1 Limites proposées

- Un dossier actif : une prochaine action primaire.
- Un briefing : 3 à 7 priorités.
- Une revue hebdomadaire : 3 à 5 objectifs actifs au niveau entreprise.
- Une proposition : une modification compréhensible.
- Un rôle agentique : au plus trois décisions demandées par revue.
- Une mission : un objectif, un budget et une condition d’arrêt.

Les nombres ci-dessus sont des limites ergonomiques proposées pour éviter la dispersion, pas des objectifs de production.

### 10.2 Anti-administration

Une nouvelle vue, métrique ou revue n’est acceptée que si elle :

1. remplace une recherche ou ressaisie existante ;
2. conduit à une décision nommée ;
3. possède un owner ;
4. peut être supprimée si elle reste inutilisée ;
5. n’exige pas de PII supplémentaire ;
6. reste disponible en mode manuel.

## 11. Coût et disponibilité

| Contrôle | Application à la cadence |
|---|---|
| Budget par mission | chaque préparation de briefing/revue possède un plafond ; les règles déterministes passent avant une analyse coûteuse |
| Cache | uniquement sur états non sensibles, versionnés et encore frais ; jamais pour recycler une synthèse client obsolète |
| Timeout | si la synthèse n’est pas prête, afficher les données déterministes et l’erreur catégorisée |
| Retries | nombre borné ; aucune boucle sur une source indisponible |
| Pause | pause par rôle/département sans arrêter le cockpit |
| Kill switch | désactive toute exécution agentique ; la consultation et la saisie humaines continuent |
| Modèle économique | utiliser l’outil le moins coûteux qui satisfait une tâche autorisée ; aucun fournisseur n’est choisi dans cette phase |

## 12. Contre-revue mensuelle obligatoire

Mouaad répond explicitement à ces questions :

- Ai-je lu le briefing en moins de la timebox ?
- Une priorité importante a-t-elle été omise ?
- Ai-je validé quelque chose seulement pour vider la file ?
- Un rôle a-t-il créé plus de tâches qu’il n’a supprimé d’oublis ?
- Les conversations ont-elles été mieux préparées ?
- Une donnée ancienne a-t-elle été présentée comme actuelle ?
- Les dossiers restent-ils utilisables sans IA ?
- Les coûts et retries sont-ils compréhensibles ?
- Un agent peut-il être supprimé, regroupé ou ramené à l’observation ?

Une réponse défavorable déclenche une réduction de périmètre avant toute augmentation d’autonomie.
