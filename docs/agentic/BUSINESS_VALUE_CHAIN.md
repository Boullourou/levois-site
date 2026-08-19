# LEVOIS — chaîne de valeur de bout en bout

Statut : cartographie documentaire de l’architecture cible. Aucun événement, agent, connecteur ou workflow décrit ici n’est actif du seul fait de ce document.

## 1. Résultat recherché

La chaîne de valeur n’optimise pas le volume d’entrées. Elle protège le passage suivant :

```text
signal faible
→ compréhension utile
→ prochaine action explicite
→ conversation humaine qualifiée
→ décision humaine
→ suivi
→ résultat observable
→ apprentissage
```

La North Star est **une conversation humaine qualifiée, déclenchée avec suffisamment de contexte pour permettre à Mouaad et à la personne d’avancer réellement**. Une restitution utile sans activation peut également être un bon résultat ; elle ne doit pas être dégradée pour forcer un contact.

## 2. État actuel et cible

| Dimension | État actuel documenté au commit de référence | Architecture cible |
|---|---|---|
| Acquisition | contenus, points d’entrée publics, parcours acheteur/vendeur, bouche-à-oreille et audit d’annonce | origine et hypothèse de besoin reliées à la restitution, sans profilage excessif |
| Valeur publique | moteurs/parcours déterministes avec valeur avant coordonnées | contrat de restitution commun et mesure de la compréhension, pas seulement du formulaire |
| Activation | formulaires puis réception/triage | activation volontaire, idempotente, avec provenance et finalité explicites |
| Opérations | cockpit V1, personnes/projets, interactions, tâches, critères, TIM et Lab | orchestration légère au-dessus de la source de vérité ; aucune écriture agentique directe dans une vérité confirmée |
| Marché | DVF intégrée ; Yanport par exports manuels ; annonces publiques avec limites | snapshots datés et propositions d’analyse, fraîcheur et provenance visibles |
| Contenu/apprentissage | destinations et enseignements envisagés | boucle terrain → Lab → contenu/produit → conversation, avec validation conformité et Mouaad |
| Agentique | frontières IA documentées, aucun agent réel | neuf rôles logiques V1 dans une architecture hybride, introduits progressivement |

## 3. Légende de responsabilité

- **D** — déterministe : applique une règle explicite, conserve une projection ou signale une échéance.
- **A** — agent : analyse et propose dans son périmètre ; ne confirme, n’envoie, ne publie ni ne paie.
- **H** — humain : Mouaad comprend, décide, valide et déclenche les actions sensibles.
- **P** — personne concernée : fournit, corrige, consent et décide pour son projet.

Dans les colonnes « Événement produit », seul un nom exact en backticks de `EVENT_CATALOG.md` est canonique. « Mission interne » ou « aucun événement canonique V1 » désigne un artefact ou une preuve manuelle : ces mentions ne peuvent jamais être sérialisées comme `event_name`. Toute extension future exige une décision et une nouvelle version du catalogue.

Les durées ci-dessous sont des **objectifs de service proposés**, à calibrer après observation ; elles ne constituent ni une promesse client ni une donnée de marché.

## 4. Chaîne principale — faire émerger et qualifier une situation

| Étape | Acteur principal | Agent potentiel | Donnée produite | Événement produit | Prochaine étape | Validation humaine | Durée cible | Indicateur | Risque | Plan d’échec / fallback |
|---|---|---|---|---|---|---|---|---|---|---|
| 1. Contenu, bouche-à-oreille, prospection ou recommandation | H / audience | GROW-01 ; TRUST-01 contrôle | origine, contenu/source, destination prévue, aucune PII de tiers par défaut | `content_published` ou signal d’origine référencé | site ou parcours pertinent | Mouaad valide tout contenu, ciblage ou message externe | lien immédiat vers une destination utile ; campagne selon décision | conversations qualifiées par origine, pas vues seules | contenu sans besoin réel, affirmation non sourcée, recommandation intrusive | arrêter la diffusion, conserver la route organique, corriger manuellement ; ne jamais contacter un tiers non activé |
| 2. Arrivée sur le site public | P | PROD-01 observe ; GROW-01 analyse agrégé | page, campagne autorisée, consentement analytics applicable | événement produit déterministement si mesure autorisée ; pas d’événement métier client | choisir une cible ou un parcours | aucune pour consulter | chargement rapide et accès immédiat | accès au parcours, compréhension testée, erreurs | tracker avant consentement, page sans destination, perte mobile | site reste utilisable sans analytics ni IA ; lien direct vers les parcours |
| 3. Parcours adapté | P | BUY-01 ou SEL-01 propose une lecture future ; D pour règles existantes | réponses minimales, état de parcours, inconnues | `submission_received` seulement à l’activation ; avant cela état local/anonyme | restitution | aucune coordonnée requise | dans la session, sans attente d’un agent | parcours terminé, abandons par étape, questions utiles révélées | collecte prématurée, inférence présentée comme fait | conserver une restitution déterministe minimale ; permettre de quitter sans perte artificielle |
| 4. Restitution de valeur | P | BUY-01 / SEL-01 peut préparer une proposition ; règles déterministes prioritaires | observations, hypothèses, limites, prochaine question | pas nécessairement d’événement métier nominatif | activation volontaire ou fin utile | Mouaad seulement si restitution personnalisée/sensible | immédiate pour la couche déterministe ; délai affiché si analyse humaine | compréhension, activation volontaire, absence de plainte | faux verdict, chiffre inventé, conclusion malgré source bloquée | s’abstenir, afficher les inconnues, fournir les actions déterministes disponibles |
| 5. Activation volontaire | P | OPS-01 prépare le triage | finalité, canal choisi, données minimales, provenance de restitution | `lead_received`, `submission_received` | réception cockpit | preuve de consentement lorsqu’une finalité l’exige ; aucun consentement déduit | accusé de réception déterministe immédiat si canal disponible | activations valides, doublons, retraits | consentement groupé, double soumission, fuite PII | clé d’idempotence ; saisie manuelle autorisée ; aucun message supplémentaire hors finalité |
| 6. Réception et triage cockpit | H | OPS-01 au niveau 1/2 | proposition de rattachement, statut de triage, anomalie éventuelle | `project_created` seulement après décision ; sinon signal interne | qualification | Mouaad choisit créer/rattacher/classer et vérifie les doublons | même jour ouvré comme cible interne à confirmer | délai de prise en compte, leads non traités, erreurs de rattachement | mauvaise personne, projet artificiel, TIM confondu avec client | laisser `needs_review`, ne rien fusionner ; traiter manuellement avec la capture source |
| 7. Qualification initiale | H / P | BUY-01 ou SEL-01 ; OPS-01 organise | situation, demande réelle, inconnues, statut non confirmé | `project_status_changed` ou `interaction_recorded` après validation | préparation de conversation | Mouaad valide le sens et toute vérité métier | avant premier échange utile ou complétée pendant celui-ci | part des dossiers avec contexte suffisant, corrections | questionnaire trop lourd, conclusion agentique | afficher les propositions comme telles ; revenir aux réponses source et à une qualification humaine courte |
| 8. Préparation d’appel/rendez-vous | H | BUY-01 / SEL-01 responsable ; OPS-01 échéances | briefing limité : faits, contradictions, questions, objectif, prochaine décision | mission interne ; `approval_requested` seulement si une proposition nécessite revue | interaction humaine | Mouaad relit le briefing ; rien n’est envoyé | disponible avant le créneau ; génération interrompue si source périmée | temps de préparation, informations corrigées, utilité déclarée | briefing trop long, mauvais dossier, source obsolète | fiche cockpit manuelle et sources datées ; agent s’abstient s’il ne peut borner le dossier |
| 9. Interaction humaine | Mouaad / P | aucun agent pendant l’engagement ; OPS-01 peut préparer un brouillon après source autorisée | notes, décisions, questions, promesse de retour | `interaction_recorded` après enregistrement humain | validation des enseignements et prochaine action | Mouaad valide résumé, promesse et données dérivées | compte rendu court à la suite de l’échange | conversation qualifiée, promesses explicites, corrections | relation parasitée, transcription non consentie, attribution erronée | notes manuelles minimales ; pas d’enregistrement ; source et locuteurs vérifiés |

## 5. Chaîne opérationnelle — transformer la compréhension en suivi utile

| Étape | Acteur principal | Agent potentiel | Donnée produite | Événement produit | Prochaine étape | Validation humaine | Durée cible | Indicateur | Risque | Plan d’échec / fallback |
|---|---|---|---|---|---|---|---|---|---|---|
| 10. Extraction proposée | H | BUY-01 / SEL-01 ; OPS-01 | propositions granulaires avec source : fait, critère, décision, tâche, question | `criterion_proposed` ou proposition interne | revue ligne par ligne | Mouaad accepte, corrige ou rejette ; aucune écriture directe | avant réutilisation dans un matching ou une stratégie | taux de correction, preuve disponible, abstention appropriée | lot opaque, confiance IA confondue avec certitude métier | rejeter/expirer le lot ; saisir manuellement ; conserver la source autorisée |
| 11. Critères, scénarios ou situation validés | Mouaad / P | BUY-01 ou SEL-01 prépare | révision datée, certitudes, inconnues, raisons | `criterion_confirmed`, `criterion_changed`, `project_stage_changed` | tâches puis recherche/commercialisation | Mouaad obligatoire ; la personne corrige ce qui la concerne | au terme de la qualification, révisé à chaque apprentissage pertinent | projets correctement définis, révisions périmées | écrasement de l’historique, règle financière implicite | événement compensatoire, nouvelle révision ; ancienne analyse marquée obsolète |
| 12. Prochaine action et tâches | H | OPS-01 détecte/propose ; D signale retards | tâche, responsable, échéance, raison d’attente | `task_created`, `task_due`, `task_overdue`, `project_without_next_action`, `promise_due` | exécution humaine ou préparation interne | Mouaad valide la tâche sensible et garde la responsabilité | chaque dossier actif a une prochaine action ou une anomalie visible | dossiers sans action, retards, promesses non tenues | inflation de tâches, faux sentiment de contrôle | regrouper/supprimer les suggestions non utiles ; file manuelle « Aujourd’hui » reste opérationnelle |
| 13A. Préparation de recherche acquéreur | Mouaad / P | BUY-01 | scénarios validés, fiche d’export manuel, révision de recherche | mission interne ; aucun envoi | export Yanport manuel ou veille autorisée | Mouaad valide la fiche et l’export | après révision confirmée | temps gagné, erreurs d’export, pertinence | API Yanport supposée, critère mal traduit | export manuel contrôlé ; conserver l’empreinte de la révision utilisée |
| 13B. Préparation vendeur/commercialisation | Mouaad / P | SEL-01 | situation, stratégie proposée, pièces manquantes, jalons | mission interne ; éventuellement `task_created` validé | rendez-vous, estimation ou suivi | estimation, mandat et stratégie par Mouaad | selon calendrier humain du projet | décisions préparées, dossiers actifs suivis | audit confondu avec estimation, mandat présumé | utiliser checklist et notes manuelles ; afficher les limites et inconnues |
| 14. Veille marché et annonces | H | MKT-01 | snapshot daté, source, fraîcheur, changement détecté | `listing_discovered`, `listing_changed` | analyse bornée | pas pour constater une source ; Mouaad avant usage client/sensible | au rythme des imports/consultations autorisés, pas de fausse fraîcheur | annonces pertinentes détectées, périmées, manquantes | scraping/API inexistante, source hostile, duplication | import manuel, quarantaine, déduplication ; aucune veille promise si connecteur absent |
| 15. Analyse annonce/recherche ou signaux vendeur | H | BUY-01 / SEL-01 avec MKT-01 | facteurs `met/not_met/unknown/conditional`, preuves, compromis, verdict proposé | `listing_evaluated`, puis `approval_requested` | revue Mouaad | obligatoire avant matching, envoi ou stratégie | après snapshot et révision figés ; expire si l’un change | pertinence, faux positifs, corrections, temps gagné | donnée absente transformée en succès, critère dur masqué | résultat `to_verify`, abstention ; comparaison manuelle avec source et révision |
| 16. Approbation et transmission/stratégie | Mouaad | COS-01 suit la file ; agent métier prépare | décision, texte/version à envoyer, sources et expiration | `approval_granted` ou `approval_rejected`; `property_proposed` après action humaine | retour, visite ou observation | Mouaad relit et déclenche toute action externe | approbation avant expiration de la source ; SLA interne à décider | délai d’approbation, propositions expirées, retours obtenus | envoi automatique, mauvaise personne, contenu périmé | bloquer l’action ; copier un brouillon dans le canal choisi après vérification manuelle |
| 17. Rendez-vous ou visite | Mouaad / P | BUY-01 / SEL-01 prépare ; OPS-01 rappelle en interne | objectifs, points à vérifier, état planifié/réalisé | `visit_planned`, `visit_completed` ou interaction vendeur | retour structuré | Mouaad confirme le rendez-vous et sa tenue | préparation avant rendez-vous ; retour à chaud selon disponibilité | visites utiles, questions résolues, no-shows | calendrier désynchronisé, préparation fondée sur ancienne version | confirmation manuelle ; fiche imprimable/consultable sans agent |
| 18. Retour et apprentissage dossier | Mouaad / P | BUY-01 / SEL-01 propose ; OPS-01 suit promesse | observations, motifs, propositions de critères, prochaine action | `client_feedback_received`, `criterion_proposed`, `interaction_recorded` | nouvelle révision, autre recherche ou arrêt | Mouaad valide toute évolution ; la personne peut corriger | avant la prochaine sélection ou décision | retours exploitables, répétitions évitées | généralisation abusive, sentiment transformé en exclusion permanente | garder l’observation séparée ; poser une question au prochain échange |
| 19. Offre éventuelle | Mouaad / P | BUY-01 / SEL-01 prépare seulement des éléments | contexte, décisions et références ; aucun engagement agentique | `offer_received` pour une offre reçue et saisie ; aucun événement canonique V1 d'offre émise, seulement `interaction_recorded` après saisie humaine si utile | négociation ou arrêt | humaine et professionnelle obligatoire | selon échéance réelle, jamais dictée par l’agent | offres, délais de réponse, issues documentées | conseil juridique, engagement ou montant altéré | procédure humaine et outils officiels ; aucun agent si le cadre n’est pas validé |
| 20. Transaction éventuelle | Mouaad / parties habilitées | OPS-01 suit les jalons ; FIN-01 observe TIM | jalons confirmés, tâches, décisions, références minimales | aucun événement canonique V1 de transaction ; `interaction_recorded` ou `project_stage_changed` seulement après commande humaine applicable | post-transaction et TIM le cas échéant | toute décision juridique/financière reste humaine | selon processus professionnel externe | jalons tenus, incidents, prochaines actions | transaction présumée, copie de données inutiles | suivi manuel dans les systèmes officiels ; cockpit n’est pas l’autorité juridique |
| 21. Suivi post-transaction | Mouaad / P | OPS-01 propose une tâche ; GROW-01 n’accède qu’à des motifs anonymisés | suivi convenu, retour autorisé, enseignement distinct de la donnée client | `interaction_recorded`, éventuellement `product_insight_created` après anonymisation | Lab ou clôture | Mouaad valide le contact ; consentement distinct pour témoignage/marketing | cadence convenue avec la personne | continuité, problème résolu, enseignement utile | relance intrusive, témoignage supposé | aucune relance automatique ; contact manuel selon accord, ou clôture |

## 6. Boucle d’apprentissage — du terrain au produit et au contenu

| Étape | Acteur principal | Agent potentiel | Donnée produite | Événement produit | Prochaine étape | Validation humaine | Durée cible | Indicateur | Risque | Plan d’échec / fallback |
|---|---|---|---|---|---|---|---|---|---|---|
| 22. Observation LEVOIS Lab | Mouaad | OPS-01 propose ; TRUST-01 contrôle la minimisation | motif anonymisé, source de type, fréquence qualitative, impact | `product_insight_created` ou `content_idea_created` | qualification du motif | Mouaad valide la généralisation et l’absence de PII | lors de la revue de dossier ou hebdomadaire | enseignements exploitables, notes sans PII | copier une histoire client, inventer une demande | reformuler manuellement et supprimer le détail ; ne rien publier |
| 23. Priorisation contenu ou produit | Mouaad | COS-01 consolide ; GROW-01 / PROD-01 analysent | problème, cible, hypothèse, destination, coût attendu, test | mission interne ; aucun événement canonique V1 de priorisation | produire un brouillon ou un ticket | Mouaad choisit la priorité | revue hebdomadaire ; arbitrage mensuel | problèmes récurrents traités, coût par résultat | backlog gonflé, métrique locale | limiter le travail en cours ; classer sans action si valeur insuffisante |
| 24. Conception et contrôle | Mouaad | GROW-01 ou PROD-01 ; TRUST-01 | script/page/ticket/prototype, preuves, limites, plan de mesure | `approval_requested` | validation | conformité puis Mouaad ; aucun déploiement/publication automatique | selon timebox décidée pour la mission | délai, corrections, risques détectés | contenu sensible, changement produit non testé | retour en brouillon, abandon documenté ou traitement manuel |
| 25. Publication ou déploiement humain | Mouaad / opérateur autorisé | agent prépare seulement | version diffusée, destination, CTA ou release, provenance | `content_approved`, `content_published` pour le contenu ; aucun événement canonique V1 de déploiement produit | mesure | Mouaad déclenche ; déploiement reste hors autonomie | fenêtre choisie par Mouaad | conversations qualifiées, friction résolue | publication sans destination, panne, promesse excessive | dépublier/rollback humain selon procédure ; parcours existant reste disponible |
| 26. Mesure et décision d’apprentissage | Mouaad | GROW-01 / PROD-01 consolident ; COS-01 arbitre | résultat, limites d’attribution, coût, décision garder/modifier/arrêter | `content_performance_updated`, nouvel insight éventuel | nouveau cycle ou arrêt | Mouaad valide la conclusion | hebdomadaire pour signaux ; mensuel pour décision | impact sur North Star, confiance, coût | confondre corrélation et causalité, optimiser les vues | marquer « attribution inconnue », compléter qualitativement, arrêter l’automatisation |

## 7. Branche Accords TIM

Un Accord TIM est un agrégat autonome. Il ne crée pas automatiquement une personne cliente, un projet vendeur, un mandat ou une transaction.

| Étape | Acteur principal | Agent potentiel | Donnée produite | Événement produit | Prochaine étape | Validation humaine | Durée cible | Indicateur | Risque | Plan d’échec / fallback |
|---|---|---|---|---|---|---|---|---|---|---|
| Information reçue/transmise | Mouaad | FIN-01 / OPS-01 proposent un dossier minimal | source, parties professionnelles minimales, sujet minimisé | signal interne puis `tim_agreement_created` après décision | formalisation | Mouaad vérifie le périmètre | dès que le suivi est nécessaire | accords à formaliser | création d’un client artificiel | conserver une note/interaction TIM manuelle sans projet |
| Formalisation/signature | Mouaad / conseiller concerné | FIN-01 prépare la checklist | termes versionnés et référence privée | `tim_status_changed` | dépôt OMEGA | Mouaad valide termes et référence | selon échéance convenue | formalisation sans retard | formulaire supposé signé | état `to_formalize`, tâche manuelle, aucune transition automatique |
| Dépôt OMEGA | Mouaad | FIN-01 signale l’échéance | preuve/référence minimale autorisée | `tim_status_changed` | suivi opération | Mouaad confirme le dépôt | dès action humaine réalisée | accords avec preuve à jour | prétendre qu’une API OMEGA existe | saisie manuelle de la confirmation |
| Mandat/opération | conseiller responsable / Mouaad | FIN-01 surveille les états séparés | événement opérationnel confirmé | `tim_status_changed` | fait générateur éventuel | Mouaad confirme ; aucun mandat déduit d’un message | quand l’information fiable est reçue | opérations par stade, états inconnus | statut périmé, confusion de responsabilité | marquer `unknown/to_verify`, tâche de vérification humaine |
| Rémunération estimée/due | Mouaad | FIN-01 calcule seulement selon règle validée et entrées confirmées | estimation ou montant dû clairement distincts | `tim_payment_estimated`, `tim_payment_due` | paiement/vérification | Mouaad valide assiette, fait générateur, bénéficiaire et montant | à l’apparition du fait confirmé | estimées, dues, litiges | somme inventée ou déclarée due trop tôt | bloquer le calcul, conserver `to_verify`, consulter le cadre officiel |
| Paiement et clôture | Mouaad | FIN-01 rapproche/propose ; OPS-01 suit | paiement confirmé, référence, solde, raison de clôture | `tim_payment_received`, `tim_status_changed` | archivage/rétention | Mouaad confirme tout paiement et la clôture | après preuve autorisée | délai de paiement, accords sans action | paiement automatique, double saisie | rapprochement manuel/idempotent, état litigieux si divergence |

## 8. Ruptures actuelles à traiter

Les ruptures ci-dessous combinent des limites explicitement documentées et des risques opérationnels plausibles. Toute fréquence ou gravité devra être observée avant de prioriser.

| Rupture | État / preuve disponible | Conséquence possible | Réponse cible minimale | Ce qui reste humain |
|---|---|---|---|---|
| Origine → conversation | continuité mesurable entre contenu, diagnostic, demande et relation encore requise | impossible de savoir quel contenu aide réellement | provenance et destination conservées, attribution prudente | interpréter le motif réel de la conversation |
| Restitution → cockpit | activation et triage existent, mais l’ensemble des parcours n’est pas encore une chaîne orchestrée | contexte répété ou perdu | capture figée, synthèse proposée et source visible | rattacher/créer/classer |
| Email/conversation → prochaine action | le modèle cible interactions, promesses et tâches ; les fonctions agentiques ne sont pas livrées | retour promis oublié | détection déterministe des échéances et proposition OPS-01 | valider la tâche et répondre |
| Interaction → critères | extraction future seulement ; aucune sortie IA ne peut écrire directement | nuance perdue ou critère écrasé | proposition granulaire avec preuve et nouvelle révision | confirmer/corriger/rejeter |
| Yanport → recherche | export manuel retenu, API non retenue à ce stade | ressaisie, fraîcheur inconnue, doublons | import/export manuel daté et empreinte de révision | lancer, contrôler et décider |
| Annonce → client | portails parfois bloquants, annonces imparfaites | fausse certitude ou silence | fallback déterministe, inconnues visibles, snapshot daté | valider le matching et envoyer |
| Visite → apprentissage | notes et observations peuvent rester isolées | mêmes faux positifs répétés | retour court, proposition de critère, prochaine action | décider si le projet a réellement évolué |
| TIM → paiement | états multiples et outils externes | accord, opération et rémunération confondus | trois axes séparés et tâche de vérification | confirmer termes, fait générateur et paiement |
| Terrain → contenu | Lab prévu, mais risque de notes dispersées | contenu générique sans besoin réel | motif anonymisé, destination, hypothèse, mesure | choisir l’angle et valider la publication |
| Incident agent → travail quotidien | agents futurs, aucune dépendance acceptable | cockpit bloqué par un fournisseur | agents facultatifs, files explicites, saisie manuelle | continuer l’opération sans IA |

## 9. Contrat de handoff entre étapes

Une étape ne remet pas un simple texte à la suivante. Elle remet un paquet conceptuel limité :

- identifiant de corrélation non sensible ;
- dossier ou contexte explicitement borné ;
- source et date ;
- faits séparés des hypothèses ;
- version/révision utilisée ;
- inconnues et expiration ;
- action proposée ;
- validation requise ;
- coût déjà engagé et budget restant ;
- fallback manuel.

Si la source, la révision ou l’autorisation change, le paquet est obsolète. Il ne doit pas être traité comme actuel par l’étape suivante.

## 10. Critères de santé de la chaîne

La chaîne est saine lorsque :

1. la personne reçoit une valeur avant toute coordonnée ;
2. chaque dossier actif possède une prochaine action ou une anomalie visible ;
3. chaque analyse affiche sa source, sa fraîcheur et ses inconnues ;
4. une proposition agentique ne devient jamais silencieusement un fait ;
5. toute action externe sensible attend Mouaad ;
6. la panne d’un agent ou d’un connecteur laisse un chemin manuel ;
7. l’enseignement retourne vers le produit ou le contenu sans exposer un dossier ;
8. le coût et l’administration ajoutés restent inférieurs au temps et au risque réellement retirés.
