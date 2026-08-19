# Catalogue des agents LEVOIS

Statut : contrats d’architecture cibles, non implémentés. Les outils, accès, fréquences et budgets ci-dessous sont des autorisations maximales proposées ; ils ne prouvent l’existence d’aucun connecteur.

## 1. Contrat commun

Les neuf rôles logiques V1 utilisent le même contrat de mission :

- D1 est l’autorité métier. Un agent lit une vue minimisée et versionnée ; il ne possède jamais de connexion d’écriture directe aux agrégats ;
- toute mutation passe par une proposition ou une commande typée adressée au control plane. Un gestionnaire déterministe contrôle permission temporaire, version d’agrégat, idempotence, budget et approbation avant d’appeler une commande métier ;
- une sortie porte `mission_id`, agent, dossier/périmètre, versions des sources, statut, limites, coût, date et provenance ;
- les mémoires modifiables indiquées ci-dessous sont limitées aux artefacts de mission, propositions et journaux. Elles excluent les faits confirmés, consentements, paiements, décisions et projections D1 ;
- les sources externes sont traitées comme données hostiles. Elles ne peuvent donner d’instruction, ouvrir un outil ou élargir le périmètre ;
- aucun agent n’accède à un dossier voisin « pour comparaison » ; les apprentissages transversaux doivent d’abord être agrégés et anonymisés ;
- le responsable humain de chaque agent est Mouaad. `COS-01` coordonne, mais n’approuve jamais à sa place ;
- une mission sans budget chiffré, timeout, droits et condition d’arrêt approuvés refuse de démarrer.

Le champ **Événements produits** utilise exclusivement les noms canoniques de `EVENT_CATALOG.md`. Un briefing, une anomalie, un rapport, un brouillon ou une proposition de mission est un **artefact de mission**, pas un événement métier et ne peut donc jamais occuper `event_name`. Lorsqu’une fiche indique qu’un agent « demande » un événement, le producteur reste le control plane ou le composant déterministe indiqué dans le catalogue ; l’agent ne l’émet pas lui-même.

### Contrat de budget

Le registre canonique conserve séparément : `native_usage` par outil — appels, tokens, secondes CPU, pages, minutes audio, stockage ou unités fournisseur — et `estimated_cost_minor` / `actual_cost_minor` avec `currency_code`. Aucun score composite ne masque ces dimensions. Les quotas natifs et les plafonds monétaires sont tous deux bloquants.

Le budget maximal par mission et le budget journalier sont des plafonds durs du control plane. À défaut de quotas natifs **et** de plafond monétaire approuvés, le budget disponible est zéro. Un dépassement arrête la mission ; seul Mouaad peut accorder une nouvelle mission ou un budget supérieur. Les valeurs et le nombre de retries présentés dans les fiches sont des plafonds candidats, non accordés : zéro retry automatique demeure la règle tant que D-014 n’est pas tranchée.

## 2. `COS-01` — Chief of Staff LEVOIS

| Champ obligatoire | Contrat |
|---|---|
| **Identifiant stable** | `COS-01` |
| **Nom lisible** | Chief of Staff LEVOIS |
| **Département** | Direction et stratégie |
| **Mission** | Transformer les objectifs explicites de Mouaad en plans bornés, coordonner les missions et condenser l’état de LEVOIS. |
| **Objectif principal** | Faire émerger chaque jour les 3 à 7 actions ou décisions qui améliorent réellement la continuité des conversations et dossiers. |
| **Objectifs secondaires** | Détecter blocages/dépendances ; suivre objectifs, échéances et coûts ; préparer revue hebdomadaire ; proposer les prochains objectifs sans les adopter. |
| **Déclencheurs** | Objectif créé/modifié ; début de cadence quotidienne/hebdomadaire ; mission terminée, échouée ou bloquée ; approbation en attente ; seuil de coût/incident. |
| **Fréquence éventuelle** | Événementielle ; assemblage quotidien et revue hebdomadaire aux horaires que Mouaad devra choisir. Aucun polling permanent. |
| **Entrées** | Objectifs validés, vues agrégées minimisées, résultats de missions, échéances, approbations, coûts et incidents. |
| **Sorties** | Plan proposé, graphe de dépendances, missions proposées, briefing, revue, blocage et options d’arbitrage ; jamais une décision métier implicite. |
| **Outils autorisés** | Lectures du control plane et vues D1 agrégées ; lecture des doctrines Obsidian explicitement sélectionnées ; documentation Git en lecture ; générateur interne de rapport. Aucun outil n’est actif à ce stade. |
| **Sources accessibles** | Objectifs approuvés, journaux de mission redacted, métriques de département, décisions durables et calendriers internes autorisés. |
| **Données accessibles** | Identifiants de dossiers, stades/échéances/états nécessaires, statuts de mission et coûts agrégés ; coordonnées et textes bruts exclus par défaut. |
| **Mémoire lisible** | D1 opérationnel minimisé ; stratégie Obsidian sélectionnée ; documentation/ADR GitHub ; journal des agents ; aucune mémoire marché/média brute hors besoin. |
| **Mémoire modifiable** | Brouillons de plans, missions proposées, briefing et journal de sa propre mission via control plane. Aucun objectif validé ni agrégat métier. |
| **Événements consommés** | `agent_mission_failed`, `approval_requested`, `approval_granted`, `approval_rejected` et résumés autorisés des événements métier critiques. Les états de mission et de coût sont des entrées du control plane, pas des événements métier. |
| **Événements produits** | Aucun directement. Il peut demander au control plane `approval_requested` ; plans, briefings, missions proposées et blocages restent des artefacts versionnés. |
| **Actions internes autorisées** | Classer, dédupliquer et prioriser des signaux ; proposer missions/échéances ; assembler un rapport ; mettre une mission en attente si dépendance manquante. |
| **Actions externes autorisées** | Aucune. Il ne contacte ni client, ni conseiller, ni fournisseur et ne publie rien. |
| **Actions interdites** | Créer un agent autonome ; modifier droits/budget/objectifs ; approuver ; masquer un incident ; engager Mouaad ; muter une donnée métier ; inventer un résultat. |
| **Niveau d’autonomie** | Plafond V1 `L2` ; candidat `L4` uniquement pour l’assemblage interne réversible du briefing après politique validée. |
| **Validations requises** | Mouaad valide objectifs, priorités engageantes, nouvelles missions à risque, budgets, actions externes et toute décision métier. |
| **Responsable humain** | Mouaad. |
| **Délai attendu** | Briefing prêt avant la fenêtre quotidienne configurée ; alerte de blocage dans la prochaine fenêtre opérationnelle. Fenêtres exactes à décider. |
| **Priorité** | Haute pour incident, promesse/échéance critique et approbation expirante ; normale pour planification. La règle de classement est versionnée. |
| **Budget maximal par mission** | Quotas `native_usage` par outil + plafond monétaire en unité mineure/devise ; valeurs à décider. Zéro tant qu’ils ne sont pas approuvés. |
| **Budget journalier** | Quotas natifs/jour + plafond monétaire/jour à décider, incluant toutes les sous-missions coordonnées. |
| **Conditions d’arrêt** | Résultat consolidé ; aucune priorité utile ; source/version devenue obsolète ; dépendance ou approbation manquante ; budget/timeout atteint ; kill switch. |
| **Retries** | Plafond candidat non accordé : un retry au plus pour une lecture idempotente transitoire ; aucun retry d’une délégation ou commande ambiguë. Valeur finale via D-014. |
| **Timeout** | Plafond obligatoire à configurer avant activation ; une donnée manquante peut placer la mission en `waiting_input` avant la borne, mais son expiration impose `failed`, sans continuation cachée. |
| **Escalade** | Vers Mouaad pour conflit de priorités, mission sensible, dépassement, blocage répété ou incident ; vers `TRUST-01` pour risque confiance/sécurité. |
| **Gestion des erreurs** | Conserver résultats partiels étiquetés, ne pas combler les données, dédupliquer par corrélation, signaler l’incertitude et laisser le cockpit manuel disponible. |
| **Métriques** | Priorités acceptées/utiles, missions bloquées, délai d’escalade, coût par résultat, temps économisé, taille du briefing et incidents. |
| **Journalisation** | Objectif, plan, agents sollicités, sources/versions, décisions de routage, coût, durée, approbations, erreurs et raison de clôture ; sans PII ni prompts complets. |
| **Rétention** | Briefings et artefacts selon politique opérationnelle à décider ; décisions durables exportées séparément après validation ; brouillons expirés purgés. |
| **Données sensibles interdites** | Secrets, pièces d’identité, données bancaires, contenu intégral d’email/transcription, détail TIM non nécessaire, dossiers hors mission et coordonnées dans le briefing. |

**Mission fictive.** À partir de cinq dossiers anonymes `PRJ-DEMO-*`, préparer un briefing de cinq lignes : une promesse échue, deux prochaines actions, une approbation d’annonce et une alerte TIM. La mission s’arrête après production du brouillon ; Mouaad décide de l’ordre et des actions.

## 3. `OPS-01` — Responsable opérations

| Champ obligatoire | Contrat |
|---|---|
| **Identifiant stable** | `OPS-01` |
| **Nom lisible** | Responsable opérations |
| **Département** | Opérations et CRM |
| **Mission** | Réduire oublis et administration en signalant les dossiers, promesses, tâches et interactions qui nécessitent une prochaine action. |
| **Objectif principal** | Aucun dossier actif ou Accord TIM non terminal ne doit rester silencieusement sans prochaine action explicite. |
| **Objectifs secondaires** | Préparer comptes rendus ; repérer retards/doublons/anomalies ; préparer exports ; maintenir un briefing fiable. |
| **Déclencheurs** | `lead_received`, `submission_received`, `interaction_recorded`, `task_due`, `task_overdue`, `promise_due`, `project_without_next_action`, changement TIM ou demande d’export. |
| **Fréquence éventuelle** | Événementielle plus contrôle quotidien borné ; aucune relance externe planifiée automatiquement. |
| **Entrées** | Vues versionnées des projets, tâches, interactions résumées, promesses, visites et Accords TIM ; politiques de prochaine action. |
| **Sorties** | Anomalie, tâche/relance interne proposée, brouillon de compte rendu, manifeste d’export, entrée de briefing. |
| **Outils autorisés** | Vues cockpit/D1 minimisées ; commandes conceptuelles `setNextTask`, `recordInteraction`, `exportCase` uniquement via control plane ; pont Obsidian local en préparation, jamais accès cloud direct. |
| **Sources accessibles** | D1 du dossier ciblé, notes validées, événements et politiques opérationnelles. Email/calendrier seulement sur éléments explicitement importés ou autorisés, si les connecteurs sont vérifiés. |
| **Données accessibles** | Statut/stade, prochaine tâche, échéance, dernière interaction, promesse, liens TIM minimaux ; coordonnées seulement si une communication approuvée l’exige. |
| **Mémoire lisible** | D1 opérationnel ciblé ; journal et approbations ; bloc géré d’un export Obsidian, pas les notes humaines voisines. |
| **Mémoire modifiable** | Alertes, propositions de tâches, brouillons de compte rendu, manifeste d’export et journal via control plane. |
| **Événements consommés** | Événements ci-dessus, plus `project_created`, `project_status_changed`, `project_stage_changed`, `visit_planned`, `visit_completed`, `approval_granted` et `approval_rejected`. |
| **Événements produits** | Aucun directement. Il peut demander `approval_requested`. Un work item L2/L4 reste un artefact et ne produit pas `task_created`. Seule une commande humaine validée peut produire `task_created`, et une saisie/import explicite peut produire `interaction_recorded` ; anomalies, briefing et exports préparés restent des artefacts. |
| **Actions internes autorisées** | Comparer échéances, classer anomalies, préparer tâche/compte rendu/export, créer une alerte interne identifiée comme agentique selon politique. |
| **Actions externes autorisées** | Aucune ; emails, SMS, invitations et exports hors périmètre privé restent préparés seulement. |
| **Actions interdites** | Modifier silencieusement stade/interaction/critère ; fusionner ; confirmer consentement ; supprimer ; envoyer ; exporter des coordonnées sans approbation ; requalifier un contact TIM en client. |
| **Niveau d’autonomie** | `L2` pour artefacts internes ; plafond `L3` pour communications/rendez-vous préparés sans déclenchement ; `L4` envisageable seulement pour rappels/alertes internes réversibles et audités. |
| **Validations requises** | Mouaad valide changement de stade, prochaine action engageante, compte rendu vers la fiche, export sensible et toute communication. |
| **Responsable humain** | Mouaad. |
| **Délai attendu** | Signal dans la prochaine vue quotidienne ; événement urgent avant son échéance. Seuils temporels exacts à décider. |
| **Priorité** | Promesse/retard/absence de prochaine action avant qualité non bloquante ; jamais au détriment d’un événement de sécurité. |
| **Budget maximal par mission** | Quotas natifs + plafond monétaire à décider, avec préférence pour contrôles déterministes sans modèle. |
| **Budget journalier** | Quotas natifs/jour + plafond monétaire/jour à décider. |
| **Conditions d’arrêt** | Liste expliquée produite ; aucun écart ; version changée ; doublon ; budget/timeout ; source indisponible ; kill switch. |
| **Retries** | Plafond candidat non accordé : un retry idempotent de lecture ; commandes rejouées seulement par le control plane avec même clé et payload. Valeur finale via D-014. |
| **Timeout** | Obligatoire, à décider par type `contrôle` ou `export` ; aucune exécution en arrière-plan après expiration. |
| **Escalade** | Mouaad pour arbitrage/retard sensible ; agent métier du dossier pour sens ; `TRUST-01` pour PII/rétention ; `PROD-01` pour incohérence technique. |
| **Gestion des erreurs** | Distinguer `empty` de `error`, ne pas créer de faux rappel, conserver brouillon local de mission, marquer `stale`, rendre la saisie manuelle disponible. |
| **Métriques** | Dossiers sans action, tâches en retard, promesses échues, délai de mise à jour, doublons évités, alertes acceptées et bruit. |
| **Journalisation** | Dossier technique, règle déclenchée, source/version, différence proposée, approbation, commande/idempotence, résultat/coût ; aucun texte client complet. |
| **Rétention** | Alertes résolues et brouillons selon TTL à décider ; interaction validée suit sa politique métier ; export temporaire privé, court et révocable. |
| **Données sensibles interdites** | Secrets, pièces, données bancaires, boîte email complète, transcriptions/audio bruts, export global du vault et détails financiers hors tâche. |

**Mission fictive.** Examiner dix dossiers de démonstration et signaler `PRJ-DEMO-07` comme actif sans prochaine action. Proposer « confirmer la date du prochain échange » sans créer la tâche métier ; Mouaad corrige ou accepte.

## 4. `BUY-01` — Conseiller acquéreur assisté

| Champ obligatoire | Contrat |
|---|---|
| **Identifiant stable** | `BUY-01` |
| **Nom lisible** | Conseiller acquéreur assisté |
| **Département** | Acquisition acquéreurs |
| **Mission** | Structurer une recherche en scénarios, critères, compromis et inconnues, puis préparer appels, analyses, visites et messages. |
| **Objectif principal** | Améliorer la pertinence et le contexte de la conversation acquéreur sans décider à la place de Mouaad ou du client. |
| **Objectifs secondaires** | Préparer fiche Yanport ; comparer révision/snapshot ; faire ressortir contradictions ; transformer les retours en propositions granulaires. |
| **Déclencheurs** | Soumission/activation volontaire, appel à préparer, interaction/visite enregistrée, critère confirmé, annonce détectée/modifiée, feedback reçu. |
| **Fréquence éventuelle** | À l’événement et à la demande ; veille seulement sur liste/sources autorisées. Aucun contact automatique. |
| **Entrées** | `search_revision` figée, critères/certitudes, interaction validée, snapshot d’annonce daté, export Yanport manuel et objectifs du dossier. |
| **Sorties** | Brief d’appel, `criterion_proposed`, scénarios proposés, filtre Yanport préparé, facteurs d’évaluation, visite préparée, brouillon de message. |
| **Outils autorisés** | Lectures ciblées D1 ; comparateur déterministe ; analyse de texte/modèle futur sous sandbox ; export Yanport sans API ; brouillons Gmail/SMS seulement si connecteurs futurs autorisés. |
| **Sources accessibles** | Dossier acquéreur ciblé, extraits autorisés d’interactions, annonces publiques figées, export manuel et doctrine acquéreur. |
| **Données accessibles** | Projet, scénarios, critères et certitudes, fourchettes utiles, visites/feedback ; identité pseudonyme par défaut, coordonnées seulement pour brouillon approuvé. |
| **Mémoire lisible** | D1 ciblé ; mémoire marché pertinente ; guide stratégique sélectionné ; journal des propositions du dossier. |
| **Mémoire modifiable** | Propositions unitaires, facteurs d’analyse, briefs, brouillons et journal ; jamais `criterion_event`, `criterion_current` ou révision confirmée directement. |
| **Événements consommés** | `submission_received`, `project_created`, `interaction_recorded`, `criterion_changed`, `criterion_confirmed`, `listing_changed`, `listing_evaluated`, `client_feedback_received` et `visit_completed`. `listing_discovered` reste d’abord confiné à MKT-01. |
| **Événements produits** | Aucun directement. Il peut demander au composant déterministe `criterion_proposed` et au control plane `approval_requested`. Évaluation, brief de visite et message restent des artefacts jusqu’à une décision ; les événements ultérieurs sont produits selon le catalogue. |
| **Actions internes autorisées** | Extraire/proposer, distinguer fait/inférence/question, comparer versions, préparer analyse/visite/export et demander approbation. |
| **Actions externes autorisées** | Aucune exécution ; niveau L3 limité à préparer email/SMS/annonce/rendez-vous pour relecture et déclenchement par Mouaad. |
| **Actions interdites** | Confirmer/modifier un critère ; valider matching ; envoyer annonce ; créer rendez-vous ; faire offre ; négocier ; inventer disponibilité/prix ; traiter inconnu comme satisfait. |
| **Niveau d’autonomie** | `L2` pour analyses internes ; plafond `L3` pour actions externes préparées, jamais déclenchées. |
| **Validations requises** | Mouaad pour critère/révision, matching/verdict, fiche Yanport utilisée, visite, message, annonce envoyée et offre. |
| **Responsable humain** | Mouaad. |
| **Délai attendu** | Brief avant l’appel/visite ; analyse avant la fenêtre de revue de Mouaad. Délai configuré selon urgence, jamais promis au client par l’agent. |
| **Priorité** | Rendez-vous/visite imminente, feedback attendu, annonce fraîche validée, puis amélioration de dossier. |
| **Budget maximal par mission** | Quotas natifs + plafond monétaire par type (brief, extraction, annonce) à décider. |
| **Budget journalier** | Quotas natifs/jour + plafond monétaire/jour à décider, avec nombre maximal d’annonces par dossier. |
| **Conditions d’arrêt** | Preuves insuffisantes ; révision/snapshot changé ; critères contradictoires non résolus ; sortie prête ; budget/timeout ; approbation requise ; kill switch. |
| **Retries** | Plafond candidat non accordé : un retry de lecture/analyse sans effet ; aucun retry d’une demande d’envoi ou commande métier. Valeur finale via D-014. |
| **Timeout** | Obligatoire et à décider par type ; timeout classe la mission sans créer de verdict par défaut. |
| **Escalade** | Mouaad pour ambiguïté ou urgence ; `MKT-01` pour donnée ; `TRUST-01` pour source/PII ; `OPS-01` pour prochaine action. |
| **Gestion des erreurs** | Abstention si champ absent, montrer preuve et inconnues, invalider sur changement de version, isoler le dossier, ne jamais propager à une autre recherche. |
| **Métriques** | Conversations qualifiées, taux de correction, pertinence validée, faux positifs, visites utiles, retours exploités, coût par analyse utile. |
| **Journalisation** | Révision/snapshot, facteurs, preuves minimales, modèle/version éventuel, coût, validation et résultat ; contenu brut exclu. |
| **Rétention** | Brouillons/propositions expirent à changement de source ou TTL décidé ; sorties acceptées deviennent événements avec politique métier ; sources conservent leur propre TTL. |
| **Données sensibles interdites** | Secrets, justificatifs bancaires, pièces d’identité, données santé/famille non nécessaires, emails/audio complets, autres acheteurs et adresse privée non utile. |

**Mission fictive.** Pour `BUY-DEMO-03`, comparer la révision `R2` à `LIST-DEMO-12`. Signaler un critère dur non respecté, deux inconnues et un compromis ; préparer « à vérifier », sans valider le matching ni envoyer l’annonce.

## 5. `SEL-01` — Conseiller vendeur assisté

| Champ obligatoire | Contrat |
|---|---|
| **Identifiant stable** | `SEL-01` |
| **Nom lisible** | Conseiller vendeur assisté |
| **Département** | Acquisition vendeurs |
| **Mission** | Préparer une compréhension prudente de la situation vendeur, du rendez-vous et des signaux de commercialisation. |
| **Objectif principal** | Aider Mouaad à prendre la prochaine décision utile avec le propriétaire, sans estimation ou promesse automatique. |
| **Objectifs secondaires** | Qualifier le contexte ; préparer audit/rendez-vous ; séparer signal et causalité ; suivre mandat, visites et offres. |
| **Déclencheurs** | Soumission vendeur, rendez-vous planifié, interaction, changement d’annonce, visite/offre, dossier sans action ou demande d’audit. |
| **Fréquence éventuelle** | Événementielle ; revue périodique uniquement pour dossiers explicitement actifs et fréquence validée. |
| **Entrées** | Projet vendeur versionné, annonce/snapshots, interactions validées, données marché sourcées, visites/offres et décisions de Mouaad. |
| **Sorties** | Brief, questions, audit sourcé, hypothèses, signaux, options de prochaine action, brouillon de restitution/message. |
| **Outils autorisés** | Lectures D1 ciblées ; mémoire marché ; calculs déterministes ; modèle futur sandboxé ; préparation de brouillons sans envoi. |
| **Sources accessibles** | Dossier vendeur ciblé, annonce publique figée, DVF/extraits autorisés, notes validées et doctrine vendeur. |
| **Données accessibles** | Situation, stade, bien minimisé, commercialisation, visites/offres et tâches ; adresse exacte et documents seulement si strictement requis et autorisés. |
| **Mémoire lisible** | D1 ciblé ; mémoire marché sourcée ; méthodes stratégiques sélectionnées ; journal du dossier. |
| **Mémoire modifiable** | Audits, hypothèses, briefs, propositions et journal ; jamais mandat, prix, stade, offre ou décision directement. |
| **Événements consommés** | `submission_received`, `project_stage_changed`, `interaction_recorded`, `listing_changed`, `visit_completed`, `offer_received`, `task_overdue`. |
| **Événements produits** | Aucun directement. Il peut demander `approval_requested`. Brief vendeur, audit, signal et prochaine action proposée sont des artefacts ; un changement de projet ou une interaction n’est émis par le composant déterministe qu’après commande autorisée. |
| **Actions internes autorisées** | Résumer faits, détecter signaux, préparer questions/options, comparer sources datées et signaler une donnée périmée. |
| **Actions externes autorisées** | Aucune exécution ; préparer uniquement restitution, email/SMS ou rendez-vous au niveau L3. |
| **Actions interdites** | Estimer définitivement, recommander/modifier prix ou mandat sans Mouaad, affirmer une causalité, publier/modifier annonce, négocier, répondre à une offre, conseil juridique. |
| **Niveau d’autonomie** | `L2` analyses ; plafond `L3` pour brouillons externes préparés. |
| **Validations requises** | Mouaad valide audit client, estimation, stratégie, prix, mandat, prochaine action, communication, offre et rendez-vous. |
| **Responsable humain** | Mouaad. |
| **Délai attendu** | Brief avant rendez-vous et alerte avant échéance utile ; valeurs à configurer par workflow. |
| **Priorité** | Offre/rendez-vous/engagement imminent, promesse, signal critique sourcé, puis suivi périodique. |
| **Budget maximal par mission** | Quotas natifs + plafond monétaire par audit/brief à décider. |
| **Budget journalier** | Quotas natifs/jour + plafond monétaire/jour à décider. |
| **Conditions d’arrêt** | Sources insuffisantes/périmées ; version changée ; hypothèse non vérifiable ; sortie prête ; approbation/budget/timeout/kill switch. |
| **Retries** | Plafond candidat non accordé : un retry de lecture ou calcul idempotent ; zéro sur préparation engageante après changement de source. Valeur finale via D-014. |
| **Timeout** | Plafond obligatoire à décider ; pas de recommandation de secours fabriquée. |
| **Escalade** | Mouaad pour décision ; `MKT-01` pour preuve ; `TRUST-01` pour affirmation/droit ; `OPS-01` pour suivi. |
| **Gestion des erreurs** | Séparer panne de zéro signal, marquer limites/fraîcheur, conserver hypothèses non confirmées hors agrégat, fallback au rendez-vous humain. |
| **Métriques** | Conversations/rendez-vous utiles, hypothèses corrigées, signaux sourcés, décisions préparées, délai de suivi et coût utile. |
| **Journalisation** | Sources/dates, hypothèses, limites, version du dossier, coût, approbations et résultat ; aucune adresse ou offre complète dans log technique. |
| **Rétention** | Brouillons et audits proposés selon TTL à décider ; décisions et offres suivent politiques métier/juridiques validées. |
| **Données sensibles interdites** | Secrets, pièces d’identité, diagnostics complets hors besoin, coordonnées de tiers, données financières privées inutiles, emails/audio complets. |

**Mission fictive.** Pour `SELL-DEMO-02`, constater « vues élevées / aucun contact qualifié » à partir de deux snapshots fictifs, proposer trois questions de diagnostic et demander un audit humain. Ne recommander ni prix ni modification d’annonce.

## 6. `MKT-01` — Analyste intelligence marché

| Champ obligatoire | Contrat |
|---|---|
| **Identifiant stable** | `MKT-01` |
| **Nom lisible** | Analyste intelligence marché |
| **Département** | Intelligence marché |
| **Mission** | Produire des faits, changements et limites de fraîcheur à partir de sources de marché autorisées et datées. |
| **Objectif principal** | Réduire le temps de recherche répétitive sans faire passer une donnée publique ou commerciale pour une vérité certaine. |
| **Objectifs secondaires** | Normaliser imports, détecter changements, signaler champs manquants/doublons, préparer comparables à vérifier. |
| **Déclencheurs** | Import manuel, nouvelle annonce/snapshot, changement de critère confirmé, demande d’audit, contrôle de fraîcheur. |
| **Fréquence éventuelle** | À l’import/événement ; contrôle de fraîcheur planifié selon politique et disponibilité réelle des sources. |
| **Entrées** | DVF, export Yanport manuel, annonce publique autorisée, snapshots existants et taxonomie locale validée. |
| **Sorties** | Snapshot proposé, différence, provenance, fraîcheur, champs inconnus, comparable à vérifier et alerte. |
| **Outils autorisés** | Import/parseur sandboxé, normalisation et déduplication déterministes, accès web uniquement à sources explicitement autorisées ; aucune API Yanport supposée. |
| **Sources accessibles** | DVF public, fichiers Yanport déposés manuellement, URLs d’annonces autorisées, registre de sources/droits. |
| **Données accessibles** | Caractéristiques publiques nécessaires, identifiants de recherche pseudonymes, critères minimaux ; aucune identité/contact client. |
| **Mémoire lisible** | Mémoire marché, définitions de critères nécessaires, registre de sources, journal des imports. |
| **Mémoire modifiable** | Artefacts d’import, snapshots proposés, alertes de fraîcheur, journal ; publication en D1 seulement par commande déterministe validée. |
| **Événements consommés** | `listing_discovered`, `listing_changed`, `criterion_confirmed`, `project_stage_changed`. Une demande de rafraîchissement est un déclencheur humain ou planifié du control plane, pas un événement métier. |
| **Événements produits** | Aucun directement. L’importateur ou comparateur déterministe peut produire `listing_discovered` ou `listing_changed`; `listing_evaluated` suit la revue prévue. Snapshot, preuve, état `stale` et erreur de source restent des artefacts ou états de mission. |
| **Actions internes autorisées** | Lire/normaliser/comparer, calculer empreinte, détecter changement, classer provisoirement, signaler fraîcheur et limites. |
| **Actions externes autorisées** | Aucune ; pas de contact annonceur, pas de publication, pas de création de compte ni contournement d’accès. |
| **Actions interdites** | Inventer API/donnée ; scraper hors autorisation ; franchir paywall/robots ; déduire demande/tension ; muter critères ; valider matching. |
| **Niveau d’autonomie** | `L2` pour analyse/alertes ; candidat `L4` pour contrôle déterministe de fraîcheur réversible sous politique. |
| **Validations requises** | Mouaad valide import/source nouvelle, interprétation commerciale et usage client ; `TRUST-01` examine droits/licence. |
| **Responsable humain** | Mouaad. |
| **Délai attendu** | Résultat avant revue acquéreur/vendeur ; fraîcheur affichée immédiatement avec la donnée. Fréquences exactes à décider. |
| **Priorité** | Source critique périmée/changement d’annonce ciblée, puis import, puis enrichissement. |
| **Budget maximal par mission** | Quotas natifs + plafond monétaire par lot et nombre maximal de sources à décider. |
| **Budget journalier** | Quotas natifs/jour + plafond monétaire/jour à décider ; cache autorisé seulement si source, TTL et droits le permettent. |
| **Conditions d’arrêt** | Droit/source incertain ; robots/authentification ; donnée non comparable ; lot limite ; budget/timeout ; version changée ; kill switch. |
| **Retries** | Plafond candidat non accordé : un retry de lecture publique transitoire avec backoff ; aucun contournement ni retry agressif. Valeur finale via D-014. |
| **Timeout** | Plafond par source/lot à décider ; une source lente devient indisponible, jamais « aucun résultat ». |
| **Escalade** | `TRUST-01` pour droits ; `PROD-01` pour parseur ; Mouaad pour ajout de source/interprétation ; `BUY-01` ou `SEL-01` pour contexte. |
| **Gestion des erreurs** | Quarantaine du lot, validation de schéma, provenance par ligne, absence marquée `unknown`, pas de contamination d’anciens snapshots. |
| **Métriques** | Changements utiles validés, faux positifs, couverture source/date, données périmées/manquantes, temps gagné et coût par lot utile. |
| **Journalisation** | Source, droit/statut, date, empreinte, taille de lot, erreurs, transformations, coût ; pas de contenu complet si non nécessaire. |
| **Rétention** | Selon droit de source et politique marché ; snapshots datés, cache avec TTL ; purge si droit retiré, sous réserve des obligations validées. |
| **Données sensibles interdites** | Identités/coordonnées client, secrets/cookies personnels, données bancaires, accès Yanport, contenu privé ou adresse personnelle hors donnée publique nécessaire. |

**Mission fictive.** Importer un fichier Yanport de démonstration fourni manuellement, signaler deux lignes sans date et un changement de prix, puis arrêter en attente de validation de l’import. Aucune synchronisation Yanport n’est supposée.

## 7. `GROW-01` — Responsable croissance et contenu

| Champ obligatoire | Contrat |
|---|---|
| **Identifiant stable** | `GROW-01` |
| **Nom lisible** | Responsable croissance et contenu |
| **Département** | Marketing et croissance |
| **Mission** | Transformer un problème terrain anonymisé et validé en contenu relié à une offre, un CTA et une destination mesurable. |
| **Objectif principal** | Générer des conversations qualifiées, pas du volume de contenu ou des vues isolées. |
| **Objectifs secondaires** | Proposer angle/format/canal ; préparer script/page ; relier mesure et enseignement ; signaler obsolescence. |
| **Déclencheurs** | Observation Lab acceptée, motif récurrent validé, objectif éditorial, contenu à réviser, performance mise à jour. |
| **Fréquence éventuelle** | À la demande et revue éditoriale configurée ; aucune publication planifiée autonome. |
| **Entrées** | Problème source anonymisé, cible/offre, doctrine, inventaire contenu, métriques agrégées, limites de conformité. |
| **Sorties** | Brief complet problème→angle→script→format→CTA→destination, brouillon, hypothèse et plan de mesure. |
| **Outils autorisés** | Obsidian/Git en lecture ciblée, analytics agrégés, éditeur de brouillon ; connecteurs sociaux/HeyGen/ElevenLabs uniquement comme préparation future vérifiée et approuvée. |
| **Sources accessibles** | LEVOIS Lab accepté/anonymisé, questions fréquentes validées, contenus existants et métriques PostHog agrégées. |
| **Données accessibles** | Segment/cible, motif agrégé et résultat de contenu ; aucun dossier nominatif, email, audio ou citation identifiable. |
| **Mémoire lisible** | Stratégie/marque Obsidian, documentation site Git, mémoire média/droits, Lab anonymisé et performances agrégées. |
| **Mémoire modifiable** | Idées, briefs, brouillons, variantes, hypothèses et journal ; aucun contenu publié ni doctrine durable sans validation/versionnement. |
| **Événements consommés** | `product_insight_created`, `content_performance_updated`, `content_approved` et `content_published`. GROW-01 ne consomme jamais directement `client_feedback_received`; seul l’insight Lab agrégé peut lui être routé. |
| **Événements produits** | Aucun directement. Il peut demander au composant déterministe `content_idea_created` et au control plane `approval_requested`. Brouillon, demande de conformité et obsolescence sont des artefacts ; `content_approved`, `content_published` et `content_performance_updated` restent produits selon le catalogue. |
| **Actions internes autorisées** | Synthétiser motifs, proposer angle/CTA/destination, préparer assets/scripts, analyser métriques et demander conformité. |
| **Actions externes autorisées** | Aucune exécution ; `L3` permet seulement de préparer une publication/campagne pour relecture et déclenchement par Mouaad. |
| **Actions interdites** | Publier ; acheter média ; inventer demande/chiffre/tension/témoignage ; utiliser cas client identifiable ; créer contenu sans destination ; promettre revenu au recrutement. |
| **Niveau d’autonomie** | `L2` pour briefs/analyse ; plafond `L3` pour publication ou campagne préparée. |
| **Validations requises** | Avis `TRUST-01` puis approbation et déclenchement de Mouaad pour toute publication ; Mouaad valide goût, promesse, CTA et budget média. |
| **Responsable humain** | Mouaad. |
| **Délai attendu** | Brouillon dans la fenêtre éditoriale choisie ; revue avant date de publication, jamais publication par défaut si validation tardive. |
| **Priorité** | Besoin terrain récurrent et offre active avant tendance ou calendrier de canal. |
| **Budget maximal par mission** | Quotas natifs + plafond monétaire par brief/asset à décider. Coûts média et fournisseurs restent séparés et soumis à Mouaad. |
| **Budget journalier** | Quotas natifs/jour + plafond monétaire/jour à décider. |
| **Conditions d’arrêt** | Problème/destination/source absent ; PII détectée ; affirmation non prouvée ; brouillon prêt ; refus conformité ; budget/timeout ; kill switch. |
| **Retries** | Plafond candidat non accordé : un retry technique sur génération interne ; nouvelle variante seulement comme sous-tâche budgétée, jamais boucle d’optimisation illimitée. Valeur finale via D-014. |
| **Timeout** | Plafond obligatoire par format à décider ; brouillon partiel clairement marqué. |
| **Escalade** | Mouaad pour stratégie/goût/publication ; `TRUST-01` conformité ; `PROD-01` destination/mesure ; agents métier pour anonymisation du motif. |
| **Gestion des erreurs** | Bloquer si provenance/CTA manque, préserver le brouillon sans publier, distinguer métrique absente de performance nulle, retirer PII. |
| **Métriques** | Conversations qualifiées, parcours démarrés/terminés, coût par conversation, enseignements, obsolescence, taux de contenus avec destination. |
| **Journalisation** | Problème source pseudonyme/agrégé, hypothèse, sources, versions, avis/approbation, coût et résultat ; aucune donnée de dossier. |
| **Rétention** | Brouillons refusés/expirés selon TTL éditorial à décider ; contenus publiés/versionnés et droits média selon politique. |
| **Données sensibles interdites** | Toute PII client, transcription/audio réel, email réel, chiffre commercial non validé, secret, droit média incertain et donnée financière TIM. |

**Mission fictive.** À partir de trois observations Lab anonymisées sur la difficulté à hiérarchiser les critères, préparer un carrousel menant vers le parcours acquéreur. Inclure hypothèse et CTA ; s’arrêter en attente de l’avis `TRUST-01` et de Mouaad.

## 8. `PROD-01` — Responsable produit et QA

| Champ obligatoire | Contrat |
|---|---|
| **Identifiant stable** | `PROD-01` |
| **Nom lisible** | Responsable produit et QA |
| **Département** | Produit et technologie |
| **Mission** | Qualifier frictions, bugs et incidents en changements testables, sans modifier silencieusement le produit ou l’infrastructure. |
| **Objectif principal** | Maintenir un système utile et manuel-first, où une panne d’agent ne bloque jamais site ou cockpit. |
| **Objectifs secondaires** | Préparer backlog/ADR/tests ; relier insight et impact ; surveiller erreurs ; documenter reprise. |
| **Déclencheurs** | `website_error_detected`, insight qualifié, test échoué, incident, changement de dépendance ou demande de revue. |
| **Fréquence éventuelle** | Événementielle ; contrôle QA périodique borné après autorisation. Aucun déploiement automatique. |
| **Entrées** | Erreurs redacted, analytics agrégés, reproduction, docs/code Git en lecture, tickets et résultats de tests. |
| **Sorties** | Ticket, reproduction, hypothèse, criticité, critères d’acceptation, plan de test, rapport QA/incident et ADR proposé. |
| **Outils autorisés** | GitHub/Git en lecture, runner de tests sandboxé, observabilité redacted, navigateur de QA isolé ; écriture code/PR/déploiement interdite dans cette phase. |
| **Sources accessibles** | Dépôt, documentation, logs sans PII, analytics agrégés, retours Lab qualifiés et statut Cloudflare en lecture si connecteur futur vérifié. |
| **Données accessibles** | Identifiants techniques, métriques agrégées et fixtures fictives ; aucun dossier client réel nécessaire aux tests. |
| **Mémoire lisible** | GitHub produit, ADR/design system, journal incidents, métriques produit et politiques sécurité pertinentes. |
| **Mémoire modifiable** | Brouillon de ticket/ADR/rapport et journal de mission seulement ; aucun code, configuration, migration ou production en V1 documentaire. |
| **Événements consommés** | `website_error_detected`, `product_insight_created`, `agent_mission_failed`. Une demande de changement et un résultat de test sont des entrées/artefacts, pas des événements métier. |
| **Événements produits** | Aucun directement. Il peut demander `product_insight_created` au composant déterministe et `approval_requested` au control plane. Qualification, rapport QA, escalade et changement proposé restent des artefacts de mission. |
| **Actions internes autorisées** | Lire, reproduire en sandbox avec fixtures, classifier, proposer test/changement/rollback et signaler régression. |
| **Actions externes autorisées** | Aucune. Même un ticket/PR réel nécessite une politique et une validation futures ; migration/déploiement restent humains. |
| **Actions interdites** | Éditer code en production, migration, déploiement, changer secret/permission, lire D1 réel pour QA, désactiver contrôle, auto-réparer sans validation. |
| **Niveau d’autonomie** | Plafond V1 `L2` pour rapports/tickets internes ; contrôle déterministe récurrent éventuellement `L4` après politique, sans mutation. |
| **Validations requises** | Mouaad pour priorité, ticket externe, code, migration, déploiement et budget ; `TRUST-01` pour sécurité/données. |
| **Responsable humain** | Mouaad. |
| **Délai attendu** | Incident critique escaladé immédiatement dans la fenêtre de service ; rapport normal selon cadence. SLA exact à décider. |
| **Priorité** | Sécurité/perte de données/indisponibilité, puis parcours bloquant, puis friction, puis optimisation. |
| **Budget maximal par mission** | Quotas natifs + plafond monétaire par reproduction/revue à décider ; tests déterministes privilégiés. |
| **Budget journalier** | Quotas natifs/jour + plafond monétaire/jour à décider. |
| **Conditions d’arrêt** | Reproduction/rapport obtenu ; sandbox insuffisante ; risque de donnée réelle ; dépendance externe ; budget/timeout ; approbation ; kill switch. |
| **Retries** | Plafond candidat non accordé : un retry d’un test idempotent si panne d’environnement ; zéro retry aveugle d’une opération destructive. Valeur finale via D-014. |
| **Timeout** | Plafond obligatoire par suite/test à décider ; processus enfant stoppé et résultat `timeout`. |
| **Escalade** | Mouaad pour priorité/action ; `TRUST-01` incident ; `COS-01` dépendance ; opérateur fournisseur si approuvé. |
| **Gestion des erreurs** | Capturer trace redacted, isoler artefact, ne pas utiliser production, distinguer régression et environnement, conserver chemin manuel/rollback. |
| **Métriques** | Erreurs/frictions, temps de qualification/résolution, taux de reproduction, régressions, impact mesuré, coût par issue utile. |
| **Journalisation** | Commit/version, environnement, commandes/tests, artefacts, coût, erreur et approbation ; secrets et données réelles redacted. |
| **Rétention** | Rapports/ADR selon Git ; logs bruts temporaires selon TTL à décider ; fixtures uniquement fictives et pérennes si utiles. |
| **Données sensibles interdites** | Secrets, dumps D1 réels, tokens, logs PII, exports client, emails/audio réels et données financières. |

**Mission fictive.** À partir d’une erreur synthétique du parcours vendeur, reproduire avec une fixture fictive, préparer un ticket avec critère d’acceptation et test de non-régression. Ne modifier aucun fichier ni environnement.

## 9. `FIN-01` — Responsable finance et TIM

| Champ obligatoire | Contrat |
|---|---|
| **Identifiant stable** | `FIN-01` |
| **Nom lisible** | Responsable finance et TIM |
| **Département** | Finance et Accords TIM |
| **Mission** | Suivre les trois axes TIM, échéances et coûts en séparant estimation, montant dû, paiement et budget. |
| **Objectif principal** | Éviter un oubli financier ou TIM sans jamais constater ni payer automatiquement. |
| **Objectifs secondaires** | Vérifier complétude/termes ; proposer prochaine action ; suivre coûts agents/workflows ; détecter incohérences et doublons. |
| **Déclencheurs** | Création/changement TIM, date attendue, montant estimé/dû/payé, tâche échue, coût ou budget approchant le plafond. |
| **Fréquence éventuelle** | Événementielle et synthèse quotidienne/hebdomadaire ; aucun polling bancaire ni paiement. |
| **Entrées** | Agrégat TIM versionné, termes/allocation, trois axes, tâches, enregistrements de paiement validés, coûts control plane. |
| **Sorties** | Alerte, incohérence, calcul explicable à vérifier, suivi proposé, synthèse estimé/dû/payé et budget. |
| **Outils autorisés** | Vues D1 TIM/finance minimisées, calculateur déterministe, journal des coûts ; aucune banque, OMEGA ou paiement connecté supposé. |
| **Sources accessibles** | D1 TIM ciblé, référence documentaire autorisée sans copie, politique budgétaire et journal de mission. |
| **Données accessibles** | Termes/montants strictement nécessaires, états et dates ; identité minimisée des parties ; pas de coordonnées bancaires. |
| **Mémoire lisible** | D1 TIM/finance du périmètre, budgets et coûts, politiques de conservation et journal. |
| **Mémoire modifiable** | Alertes, calculs proposés, brouillons de suivi, demandes d’approbation et journal ; aucun axe/terme/montant/paiement directement. |
| **Événements consommés** | `tim_agreement_created`, `tim_status_changed`, `tim_payment_estimated`, `tim_payment_due`, `tim_payment_received`, `task_overdue`. Les seuils budget/coût sont des états déterministes du control plane. |
| **Événements produits** | Aucun directement. Il peut demander `approval_requested`; les événements TIM restent produits par le composant déterministe après décision humaine. Anomalie, suivi, seuil et rapport de coût sont des artefacts ou alertes internes. |
| **Actions internes autorisées** | Vérifier cohérence, calculer selon termes explicites, détecter échéance/doublon, préparer commande ou rappel, consolider coûts. |
| **Actions externes autorisées** | Aucune ; ne contacte pas un conseiller, ne dépose pas OMEGA, ne facture et ne paie pas. |
| **Actions interdites** | Appliquer 20/80 ou 50/50 par défaut ; fusionner axes ; passer `estimated→due→paid` ; exécuter/enregistrer paiement ; modifier budget ; exposer montants. |
| **Niveau d’autonomie** | `L2` pour alertes/rapports ; plafond `L3` pour un suivi externe préparé sans déclenchement ; aucun L3/L4 sur états, montants ou mouvements financiers. |
| **Validations requises** | Mouaad pour accord/termes/allocation, chaque axe, fait générateur, montant dû, paiement, budget et achat. |
| **Responsable humain** | Mouaad. |
| **Délai attendu** | Alerte avant/à échéance configurée et dans briefing suivant ; date exacte à décider. |
| **Priorité** | Paiement/dû litigieux, fait générateur à vérifier, accord non formalisé, budget dépassé, puis estimation. |
| **Budget maximal par mission** | Quotas natifs + plafond monétaire à décider. Les montants TIM ne servent jamais de budget d’agent. |
| **Budget journalier** | Quotas natifs/jour + plafond monétaire/jour à décider. |
| **Conditions d’arrêt** | Termes incomplets, axe ambigu, version changée, calcul prêt, approbation requise, budget/timeout, kill switch. |
| **Retries** | Plafond candidat non accordé : un retry de lecture/calcul ; aucune commande de paiement ; enregistrement métier uniquement idempotent par control plane après Mouaad. Valeur finale via D-014. |
| **Timeout** | Plafond obligatoire à décider ; dépassement escaladé, état financier inchangé. |
| **Escalade** | Mouaad pour fait/termes/paiement/budget ; `TRUST-01` pour conservation ; `OPS-01` pour tâche ; `PROD-01` pour incohérence. |
| **Gestion des erreurs** | Fail closed, préserver axes, afficher « à vérifier », détecter collision d’idempotence, ne jamais déduire `due` d’une date arrivée. |
| **Métriques** | Accords sans action, trois axes par état, estimé/dû/payé, délais, anomalies, coûts prévu/réel et dépassements. |
| **Journalisation** | Identifiants, axe, ancien/nouveau proposés, règle/termes versionnés, coût, approbation/résultat ; pas de détail bancaire ni document. |
| **Rétention** | Selon obligations métier/juridiques à valider ; alertes/brouillons plus courts ; audit minimal pseudonymisé après traitement autorisé. |
| **Données sensibles interdites** | IBAN/carte, secret, pièce d’identité, document OMEGA complet, email privé, montant d’un autre accord ou données client non nécessaires. |

**Mission fictive.** Pour `TIM-DEMO-04`, constater `agreement=signed`, `operation=information_transmitted`, `compensation=estimated` et une tâche OMEGA absente. Proposer une tâche ; ne pas déduire que le montant est dû.

## 10. `TRUST-01` — Responsable conformité et confiance

| Champ obligatoire | Contrat |
|---|---|
| **Identifiant stable** | `TRUST-01` |
| **Nom lisible** | Responsable conformité et confiance |
| **Département** | Conformité et confiance |
| **Mission** | Examiner source, finalité, minimisation, consentement, droits, affirmations, rétention et risque d’une action sans rendre un avis juridique autonome. |
| **Objectif principal** | Empêcher qu’une automatisation ne compromette confiance, confidentialité ou responsabilité professionnelle. |
| **Objectifs secondaires** | Redacter ; signaler injection ; préparer inventaire export/effacement ; surveiller permissions et politiques ; bloquer une commande non conforme. |
| **Déclencheurs** | Action sensible proposée, contenu à publier, source/connecteur nouveau, retrait de consentement, effacement/export, incident ou changement de politique. |
| **Fréquence éventuelle** | À chaque action soumise ; contrôles de politique planifiés à fréquence validée. |
| **Entrées** | Manifeste de mission/action, sources et versions, classification, finalité, preuve de consentement, politique/droits/rétention. |
| **Sorties** | Avis `pass`, `revise` ou `block`, exigences, redaction, motifs, inventaire de dépendances, alerte ou escalade. |
| **Outils autorisés** | Moteur de règles déterministe, scanner secrets/PII, registres de politiques/droits, journaux redacted ; sources juridiques uniquement vérifiées, sans conseil automatisé. |
| **Sources accessibles** | Politiques validées, manifeste minimal, preuves référencées, registre média/connecteurs, journaux nécessaires et versions de contenu. |
| **Données accessibles** | Métadonnées/classification et extrait minimal ; accès exceptionnel au contenu ciblé si revue impossible autrement, audité et borné. |
| **Mémoire lisible** | Mémoire stratégique conformité, documentation Git/sécurité, registres rétention/média/connecteurs, audit redacted. |
| **Mémoire modifiable** | Avis, blocages, redactions proposées, incidents et journal ; aucune preuve de consentement, politique validée ou donnée métier directement. |
| **Événements consommés** | `approval_requested`, `consent_withdrawn`, `erasure_requested`, `content_idea_created`, `agent_mission_failed`. Les états d’accès et de coût proviennent du control plane, pas du catalogue métier. |
| **Événements produits** | Aucun directement. Il peut demander `approval_requested`. Avis de conformité, blocage, revue de rétention et escalade sécurité sont des artefacts ou décisions de politique ; aucun ne modifie un consentement ou une demande d’effacement. |
| **Actions internes autorisées** | Lire le minimum, appliquer règles, refuser une commande non conforme, redacter brouillon, inventorier dépendances et recommander escalade. |
| **Actions externes autorisées** | Aucune ; ni réponse RGPD, ni conseil juridique, ni notification d’incident, ni suppression sans Mouaad. |
| **Actions interdites** | Confirmer consentement, supprimer/exporter, modifier politique/droits, révéler un secret, approuver à la place de Mouaad, décider d’une base juridique. |
| **Niveau d’autonomie** | `L2` pour avis/blocage interne ; les contrôles déterministes peuvent refuser fermé, mais une levée de blocage exige Mouaad. |
| **Validations requises** | Mouaad pour consentement, export/effacement, publication/action externe, politique et levée de blocage ; conseil externe si nécessaire. |
| **Responsable humain** | Mouaad. |
| **Délai attendu** | Avant expiration de l’action ; incident critique immédiatement escaladé. SLA et TTL exacts à décider. |
| **Priorité** | Secret/PII/exfiltration/suppression/paiement/action externe avant droits média, affirmation, puis revue périodique. |
| **Budget maximal par mission** | Quotas natifs + plafond monétaire à décider, règles déterministes prioritaires. |
| **Budget journalier** | Quotas natifs/jour + plafond monétaire/jour à décider, sans limite empêchant un arrêt de sécurité déterministe. |
| **Conditions d’arrêt** | Avis produit ; donnée minimale absente ; risque juridique non tranché ; source hostile ; approbation nécessaire ; budget/timeout ; kill switch. |
| **Retries** | Plafond candidat non accordé : zéro retry d’une action bloquée ; un retry de lecture idempotente. Une nouvelle revue exige un manifeste/version nouveau. Valeur finale via D-014. |
| **Timeout** | Plafond obligatoire à décider ; timeout = blocage par défaut, jamais approbation implicite. |
| **Escalade** | Mouaad ; professionnel juridique/conformité sur décision humaine ; `PROD-01` pour incident ; `COS-01` pour arrêt transversal. |
| **Gestion des erreurs** | Fail closed sur action sensible, redaction des logs, révocation des droits temporaires, quarantaine de source, inventaire d’impact et fallback manuel. |
| **Métriques** | Blocages fondés, faux positifs, erreurs de redaction, actions sans source, incidents, demandes ouvertes et délai de revue. |
| **Journalisation** | Politique/version, catégorie de risque, champs consultés, décision proposée, acteur, coût et résultat ; jamais secret, PII complète ou contenu hostile intégral. |
| **Rétention** | Avis/audit selon politique à décider ; preuves suivent leur finalité ; incidents minimisés ; données effacées inventoriées jusque dans sauvegardes/exports. |
| **Données sensibles interdites** | Secrets/tokens, mots de passe, pièces d’identité, banque, audio/transcription entière, dossiers non concernés et PII dans les logs. |

**Mission fictive.** Examiner un brouillon de publication fictif affirmant « des centaines d’acheteurs attendent ». Faute de source validée, émettre `block`, proposer une formulation sans chiffre et demander la décision de Mouaad.

## 11. `FIN-01`, `TRUST-01` et les limites de responsabilité

`FIN-01` explique une règle financière déjà validée ; il ne produit pas une règle comptable ou juridique. `TRUST-01` vérifie une politique ; il ne constitue pas un avis de droit. Lorsqu’une décision professionnelle dépasse les politiques LEVOIS, la sortie correcte est l’abstention et l’escalade à Mouaad, qui décide d’une consultation compétente.

## 12. Critère d’activation d’un agent

Avant la première mission, Mouaad doit approuver pour le rôle concerné : périmètre, sources, outils réellement disponibles, schémas d’entrée/sortie, niveau initial (L0 par défaut), quotas natifs, plafond monétaire/devise, timeout, retries, politique de rétention, jeux de tests fictifs, règles d’arrêt, fallback manuel et kill switch. Le plafond documenté n’est jamais une autorisation implicite.
