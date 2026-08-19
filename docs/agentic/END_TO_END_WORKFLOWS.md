# Workflows de bout en bout — LEVOIS Agentic Company OS

Statut : architecture cible documentaire, non exécutée.

Décideur : Mouaad.

Autorité opérationnelle : D1 ; approbations : cockpit privé.
Organisation de référence : `COS-01`, `OPS-01`, `BUY-01`, `SEL-01`, `MKT-01`, `GROW-01`, `PROD-01`, `FIN-01`, `TRUST-01`.

## 1. Frontière entre l’existant et la cible

### Existant

- les parcours publics produisent déjà des restitutions déterministes et prudentes ;
- le cockpit V1 couvre personnes, projets, critères, interactions, tâches, décisions, Accords TIM, LEVOIS Lab et export Markdown ;
- D1 du cockpit et D1 historique de recherche sont séparées ; aucune fusion ou migration n’est réalisée par cette phase ;
- Yanport est un export manuel, Obsidian un export Markdown, Gmail et Calendar ne sont pas synchronisés, et aucun agent n’est actif ;
- certains formulaires vendeur/contact sont encore email-first ; PostHog reste analytique et non métier.

### Cible

Les workflows ci-dessous décrivent comment un futur système hybride pourrait coordonner cloud léger, cockpit et runtime isolé. Ils ne supposent aucune API. Toute étape dépendant d’un connecteur absent possède un chemin manuel. Une sortie IA est un brouillon, une analyse ou une proposition ; seule une commande humaine validée peut faire évoluer une vérité métier.

## 2. Contrat transversal

### 2.1 Classes de traitement et de coût

| Classe | Traitement | Usage | Garde-fou de coût |
|---|---|---|---|
| `D0` | déterministe, sans modèle | règles d’échéance, versions, projections, calculs déjà définis | coût infra mesuré ; pas de budget modèle |
| `A1` | agent court, contexte minimal | synthèse, classement proposé, checklist | plafond mission bas ; arrêt si source vide ou périmée |
| `A2` | agent analytique borné | comparaison de sources figées, analyse d’annonce, motifs Lab | approbation de budget si volume inhabituel ; cache seulement sur empreinte non personnelle autorisée |
| `H` | travail humain | appel, rendez-vous, jugement, validation, négociation | temps humain mesuré comme capacité, jamais masqué dans le coût agent |

Aucun montant fournisseur n’est inventé. Le control plane doit conserver coût attendu, plafond et coût réel lorsque le fournisseur et sa tarification auront été choisis.

### 2.2 Légende des tableaux

- **Responsable** : un seul propriétaire de l’étape ; les autres sont contributeurs.
- **Validation** : `auto D0`, `revue Mouaad`, `action Mouaad` ou `aucune mutation`.
- **Arrêt** : condition qui interdit de poursuivre automatiquement.
- **Événement** : seul un nom exact en backticks présent dans `EVENT_CATALOG.md` peut devenir `event_name`. « Mission interne », « artefact de mission » ou « aucun événement canonique V1 » sont des traces ou preuves manuelles, jamais des événements émis. Toute extension exige une décision et une nouvelle version du catalogue.
- Les délais sont des **cibles de conception à valider**, pas des engagements client actuels.

### 2.3 Invariants

1. Une activation volontaire précède la création d’un dossier à partir d’un parcours public.
2. Un lead n’est pas automatiquement une personne, un projet, un client ou un mandat.
3. Une proposition agent ne modifie pas un critère confirmé, un stade, un état TIM, un consentement, une offre ou une décision.
4. Une révision de recherche et un snapshot d’annonce précis accompagnent toute évaluation acquéreur.
5. Un résultat `stale` n’est jamais envoyé ni présenté comme courant.
6. Email, calendrier, réseau social, Yanport, OMEGA et Obsidian peuvent rester entièrement manuels.
7. Une panne d’agent ramène au cockpit et au travail humain ; elle ne bloque pas le dossier.
8. Chaque sortie externe sensible expire dès que son contenu, sa source ou sa cible change.

## 3. Workflow acquéreur

### 3.1 Chaîne nominale et contrôles

| # | Étape | Responsable / contributeurs | Données minimales entrée → sortie | Événement | Validation | Délai cible | Coût | Métrique | Échec | Fallback humain | Arrêt automatique |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Signal vers parcours | GROW-01 / BUY-01 | contenu, recommandation ou contact → source de parcours ; aucune identité par défaut | aucun événement métier avant activation | auto D0 pour navigation | immédiat | D0 | parcours démarré et provenance agrégée | lien/CTA indisponible | donner l’URL ou expliquer le parcours | aucune collecte cachée |
| 2 | Parcours et restitution | BUY-01 comme doctrine / PROD-01 | réponses en navigateur → lecture déterministe, arbitrages et limites | aucun événement métier tant que non activé | auto D0 ; restitution non contractuelle | pendant la session | D0 | restitution atteinte, compréhension qualitative | réponses vides ou contradictoires | Mouaad clarifie directement | pas de contact ni de persistance sans activation |
| 3 | Activation volontaire | OPS-01 / TRUST-01 | coordonnées minimales, finalités, version de notice, synthèse → soumission datée | `submission_received`, puis `lead_received` si contact exploitable | auto D0 après validation du contrat d’entrée | < 1 min technique | D0 | soumissions persistées avant notification | persistance ou preuve de finalité en échec | formulaire de contact manuel sans copier de donnée dans Git | aucun email/agent si persistance invalide |
| 4 | Triage et dossier | OPS-01 / BUY-01 | soumission → décision : rattacher, créer, demander précision ou classer | `project_created`, `task_created` | action Mouaad pour identité/déduplication/projet | même jour ouvré, cible à valider | H + D0 | leads triés, projet avec prochaine action | doublon ambigu, contact incomplet | triage cockpit et recherche manuelle | pas de fusion probabiliste ni projet inventé |
| 5 | Préparation d’appel | BUY-01 / OPS-01, MKT-01 | dossier autorisé, parcours, historique → briefing faits/inférences/questions | mission interne ; `approval_requested` seulement si action préparée | aucune mutation ; Mouaad lit | avant l’appel, < 10 min machine | A1/A2 borné | temps de préparation et questions utiles | contexte vide, trop large ou stale | lire la fiche et les réponses source | arrêter si mauvais dossier, source expirée ou budget atteint |
| 6 | Appel humain | Mouaad / BUY-01 en préparation seulement | briefing + conversation → notes minimales, décisions, promesses | `interaction_recorded`, éventuellement `promise_due` via échéancier | action Mouaad | selon rendez-vous | H | conversation qualifiée et prochaine action claire | client indisponible, information incertaine | replanifier manuellement | aucune déduction de fait depuis un appel non consigné |
| 7 | Extraction proposée | BUY-01 | notes/source autorisée figée → propositions granulaires, preuves, contradictions | `criterion_proposed` | aucune mutation | après l’appel, cible < 15 min | A1/A2 | propositions sourcées, taux de correction | source sans repères ou locuteurs ambigus | Mouaad saisit les critères à la main | arrêt si preuve absente, source non autorisée ou injection détectée |
| 8 | Validation des critères et scénarios | Mouaad / BUY-01 | propositions + valeur actuelle → événements acceptés/corrigés/rejetés et révision | `criterion_changed`, `criterion_confirmed` | action Mouaad ligne par ligne | avant toute veille/envoi | H + D0 | critères confirmés, inconnues visibles | concurrence de version | recharger puis confirmer manuellement | aucun matching sur révision incohérente |
| 9 | Fiche Yanport | BUY-01 / OPS-01 | révision précise → fiche/export daté avec inconnues | aucun événement canonique V1 ; résultat de mission et référence d'export manuel seulement | revue Mouaad ; export manuel | après validation recherche | D0 ou A1 | export rattaché à la bonne révision | format Yanport inconnu ou import refusé | recopier manuellement les filtres | aucune supposition d’API ou de synchronisation |
| 10 | Veille et découverte | MKT-01 / BUY-01 | export manuel, DVF ou annonce publique → snapshot daté | `listing_discovered`, `listing_changed` | contrôle source ; aucune proposition client | cadence décidée, pas de cron supposé | D0/A1 | annonces fraîches, faux positifs | source indisponible, vide ou conditions d’usage incertaines | recherche manuelle par Mouaad | arrêter collecte si droit/connecteur non validé |
| 11 | Analyse d’annonce | BUY-01 / MKT-01 | révision + snapshot → facteurs `met/not_met/unknown/conditional`, limites, verdict proposé | `listing_evaluated` après enregistrement de l’artefact revu | revue Mouaad obligatoire avant matching final | cible < 10 min/annonce | A2 borné | pertinence après revue, faux positifs | champ absent, snapshot stale, contradiction | grille manuelle révision/snapshot | ne jamais convertir `unknown` en `met` |
| 12 | Approbation et envoi | Mouaad / BUY-01, OPS-01 | brouillon figé + évaluation courante → envoi humain tracé | `approval_requested`, `approval_granted` ou `approval_rejected`, puis `property_proposed` | action Mouaad ; déclenchement séparé | tant que annonce et recherche sont fraîches | H + D0 | annonces envoyées réellement pertinentes | approbation expirée, canal absent, annonce retirée | copier le lien et rédiger depuis le canal choisi | aucune sortie si hash/version diffère |
| 13 | Retour client | Mouaad / OPS-01, BUY-01 | interaction → retour structuré et questions | `client_feedback_received`, `interaction_recorded` | revue Mouaad des implications | selon engagement pris | H/A1 | retours exploitables, promesses tenues | pas de réponse ou retour ambigu | relance humaine décidée, pas automatique | ne pas changer un critère sans validation |
| 14 | Préparation et visite | BUY-01 / OPS-01, Mouaad | bien approuvé, questions, créneau → checklist, visite et compte rendu | `visit_planned`, `visit_completed` | Mouaad confirme calendrier, visite et notes | avant/après visite | A1 + H | visites utiles, retour saisi | Calendar absent, visite annulée, données bien stale | cockpit + calendrier manuel | arrêt si disponibilité non vérifiée |
| 15 | Apprentissage et évolution | Mouaad / BUY-01, GROW-01 | retour validé → évolution proposée, insight anonymisé | `criterion_proposed`, puis `criterion_changed`; `product_insight_created` si motif agrégé | Mouaad confirme recherche ; anonymisation contrôlée | avant prochain matching | A1 + H | révisions explicables, apprentissages utiles | un cas isolé pris pour tendance | saisie manuelle et note Lab anonymisée | pas de réutilisation inter-dossiers de PII |
| 16 | Offre éventuelle | Mouaad / BUY-01, OPS-01, TRUST-01 si nécessaire | décision et document privé → offre reçue/en préparation suivie | `offer_received` seulement pour une offre reçue ; aucun événement canonique V1 d'offre émise, `interaction_recorded` seulement après saisie humaine si utile | exclusivement Mouaad et professionnels compétents | selon échéance réelle | H | offre traitée dans les délais | donnée juridique/financière incertaine | processus professionnel manuel | aucune offre, négociation ou conseil juridique autonome |

### 3.2 Quatre chemins à tester

| Chemin | Comportement attendu |
|---|---|
| `happy` | activation persistée → triage humain → appel → critères validés → révision → snapshot frais → évaluation revue → envoi humain → retour → visite ou arrêt explicite |
| `nil-empty` | pas d’activation : aucune fiche ; soumission vide : rejet déterministe ; aucune annonce pertinente : rapport « rien de suffisamment pertinent », aucune invention ni notification client |
| `stale` | toute évolution de critère ou annonce invalide évaluation, approbation et brouillon dépendants ; retour à l’étape 10 ou 11 |
| `upstream-failure` | Yanport/export, portail, modèle, email ou Calendar indisponible : tâche cockpit et traitement manuel ; aucune perte de la vérité D1 |

Condition d’arrêt du workflow : projet clos/classé avec raison, demande d’arrêt du client, absence de base légitime, budget de mission dépassé, offre passée au processus humain sensible ou décision explicite de Mouaad.

## 4. Workflow vendeur futur

### 4.1 Chaîne nominale et contrôles

| # | Étape | Responsable / contributeurs | Données minimales entrée → sortie | Événement | Validation | Délai cible | Coût | Métrique | Échec | Fallback humain | Arrêt automatique |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Entrée contenu, DVF ou recommandation | GROW-01 / SEL-01, MKT-01 | source → parcours vendeur ; DVF publique datée | aucun événement métier avant activation | auto D0 | immédiat | D0 | parcours qualifiés, pas seulement clics | DVF/source indisponible | expliquer les limites sans chiffre | ne pas inventer une valeur de marché |
| 2 | Parcours et restitution | SEL-01 comme doctrine / PROD-01 | situation déclarée → lecture déterministe et prochaine décision | aucun événement métier avant activation | auto D0 ; limites visibles | session | D0 | restitution comprise | réponses incomplètes | conversation directe | aucune estimation définitive automatisée |
| 3 | Activation et intake | OPS-01 / TRUST-01, SEL-01 | coordonnées minimales + finalité + synthèse → soumission | `submission_received`, `lead_received` | auto D0 sur contrat, triage H | < 1 min technique | D0 | persistance et triage | preuve/stockage en échec | saisie manuelle sécurisée | pas de notification avant persistance |
| 4 | Qualification et projet | OPS-01 / SEL-01 | lead → projet vendeur ou classement motivé | `project_created`, `task_created` | action Mouaad | même jour ouvré, cible à valider | H + D0 | projet avec prochaine action | identité/bien ambigu | cockpit manuel | ne pas déduire mandat/propriété |
| 5 | Préparation rendez-vous | SEL-01 / MKT-01, OPS-01 | situation, interactions, DVF datée → briefing, questions et documents à vérifier | mission interne | aucune mutation ; revue Mouaad | avant rendez-vous | A1/A2 | temps gagné, inconnues explicites | adresse/sources insuffisantes | préparation manuelle et DVF consultée avec prudence | pas d’estimation si dossier/source inadéquat |
| 6 | Rendez-vous humain | Mouaad / SEL-01 | briefing + échange → notes, décisions, promesses | `interaction_recorded`, `promise_due` | action Mouaad | rendez-vous | H | conversation qualifiée, prochaine décision | report/refus | replanifier ou classer | aucune promesse ou mandat déduit |
| 7 | Estimation et lecture de marché | Mouaad / MKT-01, SEL-01 | faits du bien, sources datées, jugement → restitution humaine documentée | interaction/décision ; aucun événement automatique de valeur | exclusivement Mouaad ; limites affichées | après vérifications | H + A2 de support | décision mieux préparée, corrections | comparables faibles/stale | expertise manuelle, demander pièces | arrêter si données insuffisantes ; ne pas présenter une IA comme estimation définitive |
| 8 | Décision et mandat éventuel | Mouaad / SEL-01, TRUST-01 | décision propriétaire + documents → stade/statut et prochaine action | `project_stage_changed`, `project_status_changed`, `task_created` | exclusivement humain | selon client | H + D0 | décisions explicites et délais | document/consentement manquant | suivi manuel professionnel | aucun engagement/mandat autonome |
| 9 | Suivi | SEL-01 / OPS-01, MKT-01 | interactions, tâches, signaux → briefing et décisions proposées | `interaction_recorded`, `task_due`, `project_without_next_action` | Mouaad pour tout message/ajustement | cadence convenue | A1 + H | aucune promesse oubliée | agent/notification en panne | vue Aujourd’hui et agenda manuel | classer sur décision, retrait ou absence de base légitime |

### 4.2 Quatre chemins à tester

| Chemin | Comportement attendu |
|---|---|
| `happy` | lecture utile → activation → triage → rendez-vous préparé → analyse humaine → décision → prochaine action |
| `nil-empty` | aucune donnée comparable ou projet non mûr : restitution de limites et question utile, sans estimation inventée ni pression commerciale |
| `stale` | toute donnée DVF, annonce ou situation ancienne est datée, revalidée avant rendez-vous, et n’alimente pas silencieusement une valeur actuelle |
| `upstream-failure` | DVF, géocodage, email ou modèle indisponible : entretien et saisie manuelle ; aucun blocage de la relation |

Arrêt : propriétaire ne souhaite pas poursuivre, situation hors périmètre, base légale absente, conflit nécessitant expertise, décision de Mouaad ou passage à un processus de mandat exclusivement humain.

## 5. Workflow annonce déjà en ligne

### 5.1 Chaîne nominale et contrôles

| # | Étape | Responsable / contributeurs | Données minimales entrée → sortie | Événement | Validation | Délai cible | Coût | Métrique | Échec | Fallback humain | Arrêt automatique |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Audit ponctuel | SEL-01 / MKT-01 | URL volontaire + réponses → snapshot partiel daté | `listing_discovered` seulement après sauvegarde volontaire | contrôle source ; aucune persistance cachée | session | D0/A1 | audits terminés et limites comprises | portail bloque, URL invalide | audit à partir des faits fournis | ne pas contourner un portail ni suivre sans accord |
| 2 | Lecture des signaux | SEL-01 / MKT-01 | vues, contacts, visites, offres déclarés → entonnoir et inconnues | `interaction_recorded` seulement après saisie humaine ; aucun événement canonique V1 de signal ponctuel | Mouaad confirme ce qui devient métier | session/après échange | A1 | signaux correctement qualifiés | compteurs absents/incomparables | grille manuelle qualitative | aucune causalité automatique prix/photo/texte |
| 3 | Restitution | SEL-01 | signaux → lecture prudente, alternatives, prochaine question | aucun événement métier avant activation | restitution déterministe/revue selon contenu | immédiat | D0/A1 | échange utile déclenché | signal vide | montrer limites et demander une donnée utile | pas de recommandation tranchée sans contexte |
| 4 | Échange humain | Mouaad / SEL-01, OPS-01 | activation + restitution → interaction et contexte commercial | `lead_received`, `project_created` si triage, `interaction_recorded` | action Mouaad | selon engagement | H | conversation qualifiée | mauvais contact ou propriétaire non vérifié | qualification manuelle | ne pas supposer propriété, mandat ou droit d’agir |
| 5 | Analyse de commercialisation | SEL-01 / MKT-01 | snapshots, chronologie et retours → hypothèses sourcées | `listing_evaluated` si artefact conservé | revue Mouaad | avant recommandation | A2 | hypothèses corrigées, décisions utiles | données stale ou comparaison invalide | audit humain | aucune instruction de modification directe |
| 6 | Prochaine action | Mouaad / SEL-01, OPS-01 | hypothèses + objectif vendeur → décision et tâche | `task_created`, éventuellement `project_stage_changed` | action Mouaad | date convenue | H + D0 | action tenue et mesurable | accord ambigu | noter une question ou classer | aucune action externe sans validation |
| 7 | Observation et ajustement | MKT-01 / SEL-01, Mouaad | nouveau snapshot/signaux → comparaison puis proposition d’ajustement | `listing_changed`, `listing_evaluated` | Mouaad décide l’ajustement | fenêtre explicitement convenue | D0/A2 | signal après action, pas simples vues | source inaccessible ou période trop courte | collecte/saisie manuelle | arrêter si observation non autorisée, projet clos ou données non comparables |

### 5.2 Quatre chemins à tester

| Chemin | Comportement attendu |
|---|---|
| `happy` | audit volontaire → signaux datés → échange → analyse → une action décidée → fenêtre d’observation → revue |
| `nil-empty` | aucune statistique ou snapshot : produire une liste de vérifications, pas un diagnostic de prix ou de demande |
| `stale` | annonce modifiée ou retirée : toutes analyses précédentes restent historiques mais non actionnables ; nouvelle revue nécessaire |
| `upstream-failure` | extraction du portail indisponible : utiliser informations déclarées et capture manuelle autorisée, avec certitude `to_confirm` |

Arrêt : retrait de l’annonce, refus du propriétaire, absence de droit d’observation, résultat non comparable, décision humaine ou risque de conseil non autorisé.

## 6. Workflow Accord TIM

### 6.1 Chaîne nominale et contrôles

| # | Étape | Responsable / contributeurs | Données minimales entrée → sortie | Événement | Validation | Délai cible | Coût | Métrique | Échec | Fallback humain | Arrêt automatique |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Information reçue/transmise | Mouaad / FIN-01, OPS-01 | contexte minimal, sens, conseiller, prochaine action → brouillon d’accord | aucun changement client automatique | action Mouaad | dès qualification | H | informations non oubliées | contact/opération ambigu | note/tâche TIM manuelle | ne jamais créer automatiquement client, mandat ou transaction |
| 2 | Création de l’accord | FIN-01 / OPS-01 | parties, type, sens, transaction, termes à confirmer → agrégat autonome | `tim_agreement_created`, `task_created` | action Mouaad | cible < 1 jour ouvré | H + D0 | accords ouverts avec prochaine action | doublon ou parties non vérifiées | recherche cockpit et création manuelle | aucune fusion automatique ni ratio par défaut imposé |
| 3 | Formalisation | FIN-01 / TRUST-01 | brouillon + termes exacts → version soumise/signée | `tim_status_changed` sur axe accord | Mouaad valide termes et preuve | échéance décidée | H/A1 de checklist | accords signés sans champs critiques manquants | document/assiette incertain | processus documentaire manuel | pas de signature ou conseil juridique agentique |
| 4 | Dépôt OMEGA | Mouaad / FIN-01, OPS-01 | document signé + confirmation de dépôt → référence privée et statut | `tim_status_changed` sur axe accord | confirmation Mouaad | selon règle professionnelle | H | dépôts confirmés | OMEGA indisponible ou sans API | dépôt et confirmation manuels | ne jamais supposer le dépôt depuis un brouillon |
| 5 | Suivi mandat/opération | FIN-01 / OPS-01 | faits datés → transition de l’axe opération et tâche | `tim_status_changed` sur axe opération | action Mouaad | selon jalons | H + D0 | opérations à jour, aucune sans prochaine action | nouvelle information non vérifiée | saisir après confirmation | ne jamais modifier axe accord/rémunération implicitement |
| 6 | Estimation de rémunération | FIN-01 / COS-01 | termes versionnés, hypothèses et assiette → estimation explicable | `tim_payment_estimated` | Mouaad valide hypothèses ; expertise si nécessaire | quand données suffisantes | D0/A1 | estimations sourcées et corrections | devise/assiette/termes absents | calcul manuel, état `to_verify` | pas d’estimation présentée comme due |
| 7 | Constat du dû | Mouaad / FIN-01 | fait générateur + preuve → montant dû et échéance | `tim_payment_due`, `tim_status_changed` sur rémunération | exclusivement humain | dès vérification | H + D0 | dû correctement constaté | fait générateur litigieux | `to_verify`/`disputed` et suivi manuel | aucun passage `due` par date seule |
| 8 | Paiement | Mouaad / FIN-01 | preuve/référence privée → versement idempotent et solde | `tim_payment_received`, éventuellement `tim_status_changed` | action Mouaad | après réception réelle | H + D0 | délais et soldes rapprochés | montant/devise/doublon incohérent | rapprochement manuel | aucun paiement émis ou reçu inventé |
| 9 | Clôture | Mouaad / FIN-01, OPS-01 | trois axes + obligations → clôture motivée et rétention | `tim_status_changed` sur axe accord | action Mouaad | après résolution | H + D0 | accords clos sans solde/action orpheline | rémunération encore due/litige | garder ouvert avec tâche | bloquer clôture si obligation non résolue |

### 6.2 Quatre chemins à tester

| Chemin | Comportement attendu |
|---|---|
| `happy` | création → termes exacts → signature → confirmation OMEGA → jalons opération → estimation → constat du dû → paiement → clôture |
| `nil-empty` | montant ou assiette inconnus : état `to_verify`, question et tâche ; aucun zéro, 20/80 ou 50/50 inventé |
| `stale` | termes modifiés : estimation antérieure reste historique et nouvelle version exigée ; dû/paiements validés ne sont jamais écrasés |
| `upstream-failure` | OMEGA, email ou document indisponible : statut non avancé, tâche manuelle et référence à vérifier |

Arrêt : accord annulé, opération abandonnée, litige escaladé, obligation de conservation, budget atteint ou décision explicite de Mouaad. Un axe terminal ne ferme jamais silencieusement les deux autres.

## 7. Workflow contenu et croissance

### 7.1 Chaîne nominale et contrôles

| # | Étape | Responsable / contributeurs | Données minimales entrée → sortie | Événement | Validation | Délai cible | Coût | Métrique | Échec | Fallback humain | Arrêt automatique |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Capturer le terrain | GROW-01 / OPS-01, BUY-01, SEL-01 | interactions/retours → observation Lab anonymisée | `product_insight_created` si qualifiée | revue de minimisation ; aucune PII | proche de l’interaction | A1/H | enseignements exploitables | exemple isolé ou trop identifiable | Mouaad rédige un insight anonyme | ne jamais copier email/transcription/client |
| 2 | Analyser les motifs | GROW-01 / COS-01 | observations + performance agrégée → problème récurrent et force de preuve | mission interne | aucune vérité client | hebdomadaire ou sur seuil décidé | A2 | motifs corroborés | corpus vide/biaisé | revue Lab manuelle | pas de « tendance » sans base explicite |
| 3 | Définir sujet et angle | GROW-01 / BUY-01 ou SEL-01 | problème, cible, niveau de conscience → idée, promesse, destination | `content_idea_created` | Mouaad peut prioriser | backlog | A1 | idées liées à un problème réel | pas de destination/CTA | classer ou reformuler | arrêter si demande inventée |
| 4 | Script, format, CTA et page | GROW-01 / PROD-01 | idée → artefact versionné, format, CTA, parcours/page existante | mission interne | aucune publication | selon capacité éditoriale | A1/A2 | brouillons complets avec destination | affirmation sans source, page absente | rédaction manuelle | aucune production sans destination fonctionnelle |
| 5 | Contrôle confiance | TRUST-01 / GROW-01, MKT-01 | brouillon + sources → rapport promesses/chiffres/droits/PII | `approval_requested` quand prêt | TRUST-01 propose ; Mouaad décide | avant production/publication | A1 + H | incidents évités, corrections | droit média ou chiffre non vérifié | retirer l’élément ou demander preuve | blocage ferme sur affirmation/asset non autorisé |
| 6 | Validation Mouaad | Mouaad / GROW-01 | version figée + rapport → approbation, rejet ou correction | `content_approved`, `approval_granted` ou `approval_rejected` | action Mouaad | avant production finale/publication | H | délai d’approbation, qualité | version change après approbation | nouvelle revue | approbation expirée si hash différent |
| 7 | Production | GROW-01 / bibliothèque média, outils futurs | version approuvée → média/page final à contrôler | mission interne | revue Mouaad si rendu change le sens | selon format | A1/A2 + coûts outils mesurés | coût par contenu utile | HeyGen/ElevenLabs/média indisponible | production manuelle ou format plus simple | aucun upload de donnée client ; budget plafond |
| 8 | Publication | Mouaad / GROW-01 | artefact final + canal + date → publication vérifiée | `content_published` | Mouaad déclenche toujours ; une publication n’est pas éligible au niveau 4 | planifiée | H/D0 | publication liée à CTA/destination | réseau social sans connecteur ou erreur | publication manuelle et confirmation cockpit | ne pas supposer API ; pas de retry aveugle |
| 9 | Parcours et mesure | GROW-01 / PROD-01 | publication, CTA, analytics agrégées → entonnoir par contenu | `content_performance_updated` | D0 ; analytics non métier | fenêtre déclarée | D0 | conversations qualifiées, coût/conversation | attribution absente ou consentement analytics retiré | mesure agrégée minimale et qualitative | ne pas attribuer causalité individuelle sans preuve |
| 10 | Apprentissage | GROW-01 / COS-01, PROD-01 | résultats + conversations qualifiées → leçon, maintien/arrêt/itération | `product_insight_created`, nouvelle idée éventuelle | revue Mouaad sur stratégie | hebdomadaire/mensuelle | A1 + H | enseignement actionnable | vues élevées sans conversations | revue qualitative des échanges | arrêter les contenus vanity ou devenus obsolètes |

### 7.2 Quatre chemins à tester

| Chemin | Comportement attendu |
|---|---|
| `happy` | problème réel anonymisé → angle → contenu avec destination → conformité → approbation → publication → conversations → apprentissage |
| `nil-empty` | aucun motif corroboré ou aucune destination : aucun contenu produit ; backlog explicite plutôt qu’une demande inventée |
| `stale` | chiffre, droit média, parcours, CTA ou contexte de marché expiré : approbation invalidée, contenu à revoir ou dépublier humainement |
| `upstream-failure` | réseau, HeyGen, ElevenLabs, analytics ou générateur indisponible : format manuel/simple, publication différée, aucune répétition aveugle |

Arrêt : absence de problème ou destination, risque conformité, coût supérieur à la valeur potentielle, refus Mouaad, contenu obsolète ou performance sans conversations utiles après fenêtre convenue.

## 8. Workflow amélioration produit

### 8.1 Chaîne nominale et contrôles

| # | Étape | Responsable / contributeurs | Données minimales entrée → sortie | Événement | Validation | Délai cible | Coût | Métrique | Échec | Fallback humain | Arrêt automatique |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Friction observée | PROD-01 / OPS-01, GROW-01 | erreur, abandon agrégé, retour → observation minimale | `website_error_detected` ou `product_insight_created` | aucune mutation produit | dès détection | D0/A1 | incidents/frictions qualifiés | log PII ou signal isolé | reproduction manuelle | couper ingestion si redaction douteuse |
| 2 | Qualifier le problème | PROD-01 / COS-01 | observations → portée, fréquence, sévérité, personnes affectées sans PII | mission interne | Mouaad tranche priorité sensible | selon sévérité | A1/H | vrais problèmes vs bruit | non reproductible | entretien/reproduction manuelle | ne pas transformer corrélation en cause |
| 3 | Hypothèse | PROD-01 / GROW-01, BUY-01/SEL-01 | problème + contexte → hypothèse falsifiable et mesure | mission interne | revue Mouaad si changement de parcours/doctrine | backlog | A1 | hypothèses testables | mesure impossible | simplifier ou classer | pas de solution sans problème défini |
| 4 | Ticket | PROD-01 / COS-01 | hypothèse → périmètre, critères, risques, rollback | aucun événement GitHub supposé ; référence manuelle | Mouaad approuve priorité | avant développement | D0/A1 | tickets prêts, dépendances visibles | GitHub indisponible | document/tâche cockpit | aucune écriture GitHub sans connecteur/permission |
| 5 | Prototype | PROD-01 / humain produit | ticket approuvé → prototype isolé et données fictives | mission future séparée | approbation de développement | selon roadmap | coût de développement mesuré | temps vers apprentissage | dépendance non prête | maquette locale/document | arrêt si données réelles requises ou scope dérive |
| 6 | Test | PROD-01 / TRUST-01, utilisateurs autorisés | prototype + scénarios fictifs → résultats, défauts, risques | `website_error_detected` si incident | validation critères, sécurité et accessibilité | avant déploiement | D0/H | critères passés, régressions | environnement non représentatif | recette manuelle | aucun passage si contrôle critique échoue |
| 7 | Validation et déploiement | Mouaad / PROD-01, TRUST-01 | preuves de test + rollback → décision puis déploiement humain | `approval_requested`, puis `approval_granted` ou `approval_rejected`; aucun événement canonique V1 de déploiement | Mouaad ; processus Git/CI distinct | fenêtre décidée | H + infra | succès/rollback/incidents | CI, Cloudflare ou approbation en échec | ne pas déployer, corriger manuellement | aucun déploiement agentique autonome |
| 8 | Mesure et décision | PROD-01 / GROW-01, COS-01 | métriques avant/après → impact et décision maintenir/revenir | `content_performance_updated` si contenu ; `product_insight_created` sinon | Mouaad décide suite | fenêtre prévue | D0/A1 | impact sur conversation/fiabilité | données insuffisantes/stale | revue qualitative | ne pas revendiquer impact sans base comparable |

### 8.2 Quatre chemins à tester

| Chemin | Comportement attendu |
|---|---|
| `happy` | friction corroborée → hypothèse → ticket borné → prototype → tests → approbation → déploiement humain → mesure |
| `nil-empty` | aucune preuve/reproduction : classer `to_observe`, ne pas construire une fonctionnalité spéculative |
| `stale` | contexte, métrique de base ou code change : ticket/prototype rebasé et tests rejoués avant approbation |
| `upstream-failure` | GitHub, CI, Cloudflare ou analytics indisponible : aucun déploiement ; documentation et test local restent possibles |

Arrêt : hypothèse réfutée, bénéfice trop faible, risque élevé, dépendance absente, budget atteint, refus Mouaad ou échec d’un contrôle critique.

## 9. Workflow briefing quotidien

### 9.1 Chaîne nominale et contrôles

| # | Étape | Responsable / contributeurs | Données minimales entrée → sortie | Événement | Validation | Délai cible | Coût | Métrique | Échec | Fallback humain | Arrêt automatique |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Déclenchement | CP / COS-01 | horaire configuré ou demande Mouaad → mission de briefing | mission planifiée ; aucun cron actuel supposé | auto D0 si activé | une fois/jour, heure à décider | D0 | un briefing au plus par fenêtre | planification absente | bouton « générer » ou vue Aujourd’hui | ne pas dupliquer dans la même fenêtre |
| 2 | Snapshot D1 | OPS-01 / FIN-01, CP | tâches, retards, promesses, nouveaux contacts, TIM, approbations, incidents, coûts → photographie versionnée | événements existants corrélés ; pas de nouvel événement métier | lecture seulement | < 1 min cible | D0 | couverture des files déterministes | lecture partielle/timeout | ouvrir directement les vues cockpit | arrêt si cohérence ou autorisation échoue |
| 3 | Contrôle qualité/fraîcheur | OPS-01 / TRUST-01, FIN-01 | snapshot → anomalies, sources stale, champs sensibles masqués | `project_without_next_action` peut déjà exister | auto D0 ; aucune correction silencieuse | immédiat | D0 | zéro donnée stale présentée comme actuelle | projection divergente | afficher anomalie et lien dossier | ne pas synthétiser une photographie incohérente |
| 4 | Synthèse et classement | COS-01 / OPS-01, agents départementaux | snapshot minimisé → 3 à 7 priorités, risques, opportunités, coûts | artefact de mission | aucune mutation ; priorisation proposée | cible < 3 min | A1 | longueur 3–7, taux d’actions utiles | contexte trop long, modèle indisponible | tri déterministe par échéance/risque | arrêter au plafond de coût ; ne pas masquer urgences déterministes |
| 5 | File d’approbations | COS-01 / CP | approbations non expirées → bloc dédié avec portée et délai | `approval_requested` déjà émis | action Mouaad pour chaque décision | au début de journée | D0/H | approbations traitées sans contournement | artefact stale/expiré | ouvrir la fiche et régénérer | aucune approbation depuis le résumé seul si contexte insuffisant |
| 6 | Présentation et clôture | COS-01 / CP ; CKP est le composant d’affichage | briefing → affichage cockpit, liens et coûts | mission `completed` ou `failed` | Mouaad choisit ses priorités | début de journée | D0 | temps de lecture, priorités suivies | rendu absent | vue Aujourd’hui reste fonctionnelle | ne jamais envoyer automatiquement à un canal externe |

### 9.2 Contenu maximal

Le briefing contient, dans cet ordre : urgences/retards, promesses, nouveaux contacts à trier, approbations, changements importants/opportunités, TIM à surveiller, contenus/produit à valider, missions terminées/échouées et coût. Il affiche **3 à 7 priorités**, les autres éléments restant accessibles dans les files détaillées.

### 9.3 Quatre chemins à tester

| Chemin | Comportement attendu |
|---|---|
| `happy` | snapshot cohérent → synthèse courte → 3–7 priorités → liens cockpit → choix de Mouaad |
| `nil-empty` | aucune urgence : afficher « aucune priorité critique » et au plus les revues planifiées ; ne pas inventer du travail |
| `stale` | snapshot ou approbation changé pendant la synthèse : marquer l’item stale, recharger avant action, ne pas afficher l’ancien bouton d’approbation |
| `upstream-failure` | modèle/runtime indisponible : vue Aujourd’hui déterministe triée par priorité, échéance et risque ; aucun blocage |

Arrêt : snapshot incohérent, kill switch, budget atteint, accès refusé ou briefing déjà produit pour la fenêtre. La mission peut échouer sans rendre le cockpit indisponible.

## 10. Règles de reprise et de fallback communes

| Mode d’échec | Détection | Réponse automatique autorisée | Reprise humaine |
|---|---|---|---|
| entrée vide (`nil-empty`) | contrat/champ critique absent, liste vide | produire une absence explicite, pas une valeur par défaut métier | compléter, classer ou arrêter |
| donnée périmée (`stale`) | version, empreinte, date ou source remplacée | invalider brouillon/proposition/approbation dépendante | recharger et revalider |
| amont indisponible (`upstream-failure`) | timeout/code nommé/absence connecteur | retry borné uniquement pour lecture idempotente | utiliser source manuelle ou reporter |
| conflit de concurrence | version D1 différente | aucune écriture ; présenter diff minimal | Mouaad recharge et choisit |
| budget dépassé | coût réservé/réel au plafond | arrêter mission, conserver résultat partiel non actionnable | Mouaad réduit le périmètre ou augmente explicitement le budget |
| source hostile | injection ou instruction dans une donnée | isoler contenu, révoquer outils non nécessaires | lire la source comme donnée, jamais exécuter ses instructions |
| action externe incertaine | absence d’accusé fiable | ne pas retry automatiquement | vérifier le canal puis enregistrer le résultat |

## 11. Preuves de qualité futures

Pour chaque workflow, les tests futurs utiliseront uniquement des dossiers fictifs et anonymisés. Ils devront prouver :

- le chemin nominal, `nil-empty`, `stale` et panne amont ;
- l’idempotence de chaque commande et consommation ;
- l’absence de mutation métier par une sortie IA non approuvée ;
- l’expiration d’une approbation après changement de source ou d’artefact ;
- le maintien du fallback manuel ;
- la visibilité des inconnues et des limites ;
- l’absence de PII dans journaux et métriques ;
- l’arrêt au budget, timeout, retrait de consentement et kill switch ;
- la contribution finale à une conversation humaine qualifiée, pas seulement à un volume d’actions.
