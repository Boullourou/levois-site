# LEVOIS — système de KPI

Statut : cadre documentaire de mesure. Il ne crée aucun tracker, événement, table, dashboard ou objectif chiffré.

## 1. North Star

La métrique directrice est :

> **Une conversation humaine qualifiée, déclenchée avec suffisamment de contexte pour permettre à Mouaad et à la personne d’avancer réellement.**

### 1.1 Définition opérationnelle proposée

Une interaction compte comme conversation humaine qualifiée si une revue humaine peut confirmer :

1. une personne a réellement échangé avec Mouaad ;
2. sa situation et la décision recherchée sont connues ou explicitement inconnues ;
3. les faits utiles sont séparés des hypothèses ;
4. au moins une objection, contrainte, priorité ou question ouverte a été comprise ;
5. une prochaine action ou une décision de ne pas poursuivre a été formulée.

Formule conceptuelle :

```text
conversations humaines qualifiées
= nombre d’interactions uniques satisfaisant les cinq critères
  après déduplication par conversation et projet
```

Un formulaire, un clic, un email envoyé, un matching ou un rapport agentique ne compte pas seul. Une conversation peut être qualifiée même si elle conduit à une pause ou à un renoncement éclairé plutôt qu’à une transaction.

### 1.2 Mesures compagnes obligatoires

La North Star est toujours lue avec :

- délai jusqu’à la première réponse utile ;
- contexte corrigé par Mouaad ou par la personne ;
- prochaine action tenue ou non ;
- confiance : plainte, retrait, erreur de destinataire, donnée non autorisée ;
- coût et temps de préparation ;
- résultat qualitatif : avancer, attendre, arrêter ou orienter.

Sans ces mesures, le système pourrait augmenter artificiellement les conversations au prix de contacts prématurés ou mal préparés.

## 2. État actuel et cible

| Dimension | État actuel documenté | Architecture cible |
|---|---|---|
| Données opérationnelles | cockpit D1 avec projets, interactions, tâches, critères, TIM, audit et Lab | calculs déterministes depuis la source de vérité, avec fraîcheur et couverture visibles |
| Web | parcours publics et analytics à compléter/valider selon disponibilité et consentement | continuité prudente contenu → restitution → activation → conversation ; attribution inconnue acceptée |
| Agents | aucun agent réel ni journal de coût actif | chaque mission journalise résultat, durée, coût et approbation sans PII |
| Seuils | pas de baseline agentique | seuils commerciaux décidés par Mouaad après une baseline suffisante ; tolérance zéro sur les violations d’autorité |
| Décision | données exploitables manuellement | KPI sert une décision nommée : garder, corriger, réduire, arrêter ou approfondir |

## 3. Doctrine de mesure

### 3.1 Quatre familles

| Famille | Question | Exemples |
|---|---|---|
| Résultat | la personne ou l’entreprise a-t-elle avancé ? | conversations qualifiées, décision utile, offre, prochaine action tenue |
| Flux | où le travail attend-il ? | délai de réponse, approbation, tâche en retard, dossier sans action |
| Qualité/confiance | le résultat est-il fiable et responsable ? | correction humaine, faux positif, source périmée, incident, retrait |
| Ressource | quelle ressource a été consommée ? | temps, coût par mission, retries, coût par résultat |

Une métrique locale n’est pilotable que si elle possède au moins une métrique de qualité/confiance et une métrique de ressource associées.

### 3.2 Statut des seuils

| Code | Sens |
|---|---|
| À calibrer | Mouaad décide après observation manuelle et vérification de la qualité des données ; aucun chiffre n’est inventé dans cette phase |
| Par échéance | le seuil vient d’une promesse, d’un rendez-vous, d’un contrat ou d’une obligation vérifiée |
| Tolérance zéro | aucune occurrence acceptable : action externe non autorisée, permission contournée, PII interdite dans un log, donnée confirmée modifiée silencieusement |
| Informatif | mesure de diagnostic ; elle ne déclenche pas seule une action |

### 3.3 Sources

Les mentions d’événements et d’entités ci-dessous sont des sources conceptuelles déjà documentées ou prévues. Elles n’autorisent aucune nouvelle table ni aucun nouvel événement actif. Quand une source n’est pas disponible, la métrique est `non mesurée`, jamais estimée.

## 4. Direction et stratégie — COS-01

| KPI | Formule conceptuelle | Source | Fréquence | Owner | Seuil / décision | Garde-fou |
|---|---|---|---|---|---|---|
| Objectifs accomplis | objectifs clos avec critère de réussite vérifié / objectifs arrivés à revue | décisions de revue et missions | hebdomadaire, mensuelle | Mouaad ; COS-01 prépare | à calibrer ; revoir qualité des objectifs avant le ratio | ne pas réduire le périmètre après coup pour « réussir » |
| Missions bloquées | missions `waiting_input` ou `waiting_approval` au-delà de leur échéance + missions sans owner/dépendance résolue | futur control plane | quotidien, hebdomadaire | COS-01 | par échéance ; débloquer, réduire ou annuler | une attente humaine explicite n’est pas un échec agentique |
| Approbations en attente | demandes valides non décidées, ventilées par risque et expiration | file d’approbation future | quotidien | COS-01 ; Mouaad décide | par échéance ; jamais approbation implicite | distinguer expirée, bloquée et volontairement différée |
| Coût par résultat | coûts attribuables des missions / résultats définis et attribuables | journal de missions + KPI de résultat | hebdomadaire, mensuelle | COS-01 / FIN-01 | à calibrer ; arrêter si valeur potentielle ne justifie plus le coût | ne pas diviser par un résultat mal défini ou multi-attribué |
| Temps économisé net | temps manuel de référence vérifié − temps manuel résiduel − temps de revue/administration | échantillon manuel et journal de durée | mensuelle | Mouaad / COS-01 | informatif puis à calibrer | ne pas utiliser une estimation fournie par l’agent comme preuve |
| Incidents | incidents par gravité, autorité, confidentialité, disponibilité et récupération | audit/registre d’incident | immédiat, hebdomadaire | TRUST-01 / PROD-01 | tolérance zéro pour autorité/PII ; autres à calibrer | un faible nombre peut signaler une sous-détection |
| Valeur du portefeuille de missions | missions ayant produit une décision ou supprimé un risque / missions terminées | décisions de revue | mensuelle | COS-01 | à calibrer ; supprimer les missions décoratives | ne pas compter un rapport lu comme résultat sans action ou apprentissage |

## 5. Acquisition acquéreurs — BUY-01

| KPI | Formule conceptuelle | Source | Fréquence | Owner | Seuil / décision | Garde-fou |
|---|---|---|---|---|---|---|
| Conversations qualifiées acquéreurs | conversations qualifiées rattachées à un projet achat, dédupliquées | interactions/projets validés | hebdomadaire, mensuelle | BUY-01 prépare ; Mouaad valide | à calibrer | ne pas provoquer un appel avant que la restitution soit utile |
| Délai de première réponse utile | temps entre activation volontaire valide et première réponse humaine apportant une suite | soumission, interaction | quotidien, hebdomadaire | OPS-01 / BUY-01 | par engagement affiché, sinon à décider | accusé automatique ≠ réponse utile |
| Projets correctement définis | projets actifs avec révision validée, inconnues visibles et prochaine action / projets achat actifs | recherche, critères, tâches | hebdomadaire | BUY-01 | à calibrer | complétude n’autorise pas à inventer une réponse |
| Stabilité utile des critères | révisions expliquées et sourcées ; part de modifications silencieuses | événements de critères et décisions | hebdomadaire, mensuelle | BUY-01 / TRUST-01 | modifications silencieuses : tolérance zéro | un changement après visite peut être un apprentissage sain |
| Annonces réellement pertinentes | biens que Mouaad a validés comme dignes d’attention / annonces analysées dans un périmètre comparable | évaluations, matching, décisions | hebdomadaire | BUY-01 / MKT-01 | à calibrer | un taux élevé obtenu en analysant trop peu n’est pas suffisant |
| Faux positifs de matching | propositions validées pour revue mais rejetées pour violation/absence majeure qui aurait dû être visible / propositions revues | évaluations et raisons de rejet | hebdomadaire, mensuelle | BUY-01 | à calibrer ; critère dur masqué = incident qualité | séparer donnée manquante, source fausse et erreur d’analyse |
| Visites utiles | visites ayant résolu une question, confirmé un arbitrage ou conduit à une décision / visites réalisées | visites, retours, décisions | mensuelle | Mouaad / BUY-01 | à calibrer | une visite sans offre peut être utile ; ne pas pousser à visiter |
| Retours clients exploitables | retours avec observation, question/proposition et prochaine action / retours reçus | interactions/visites | hebdomadaire | BUY-01 | à calibrer | ne jamais modifier automatiquement un critère |
| Offres acquéreur | offres humaines documentées, ventilées par issue sans valeur inventée | événements/décisions autorisés | mensuelle | Mouaad | informatif | le volume d’offres ne doit pas encourager une offre inadaptée |
| Temps de préparation d’appel/visite | durée humaine + durée agentique et revue par préparation | journal de mission + saisie manuelle | hebdomadaire, mensuelle | BUY-01 / COS-01 | à calibrer par rapport à la qualité | réduire le temps ne doit pas réduire la compréhension |

## 6. Acquisition vendeurs — SEL-01

| KPI | Formule conceptuelle | Source | Fréquence | Owner | Seuil / décision | Garde-fou |
|---|---|---|---|---|---|---|
| Conversations qualifiées vendeurs | conversations qualifiées rattachées à une situation/vente, dédupliquées | interactions/projets validés | hebdomadaire, mensuelle | SEL-01 / Mouaad | à calibrer | ne pas convertir un audit gratuit en pression de mandat |
| Délai de première réponse utile | activation valide → première réponse humaine contextualisée | soumission, interaction | quotidien, hebdomadaire | OPS-01 / SEL-01 | par engagement affiché, sinon à décider | distinguer réponse utile et notification technique |
| Situations correctement définies | projets actifs avec situation, inconnues, stade validé et prochaine action / projets vente actifs | projet vendeur, interactions, tâches | hebdomadaire | SEL-01 | à calibrer | une adresse consultée ne prouve pas un projet vendeur |
| Audits conduisant à une décision utile | audits après lesquels une vérification/action/arrêt est décidé / audits relus | audit, interaction, décision | mensuelle | SEL-01 / Mouaad | à calibrer | aucune recommandation automatique de baisse |
| Décisions de commercialisation étayées | décisions avec signaux, sources, limites et validation humaine / décisions de commercialisation | interactions/décisions | mensuelle | Mouaad / SEL-01 | à calibrer | une source publique ne remplace pas la visite et le jugement |
| Dossiers vendeur sans prochaine action | projets vente actifs sans tâche ouverte valide | projets/tâches | quotidien, hebdomadaire | OPS-01 / SEL-01 | cible opérationnelle : aucun dossier invisible ; toute exception documentée | ne pas créer une tâche artificielle pour faire disparaître l’alerte |
| Visites et retours exploitables | visites avec retour daté, signal et prochaine action / visites réalisées | visites/interactions | hebdomadaire | SEL-01 | à calibrer | protéger PII et distinguer opinion d’un fait |
| Offres reçues et suivies | offres reçues avec owner, échéance et décision humaine / offres reçues | événement `offer_received`, tâches, décisions | par événement, hebdomadaire | Mouaad / OPS-01 | par échéance réelle | aucune réponse, acceptation ou conseil juridique par agent |

## 7. Opérations et CRM — OPS-01

| KPI | Formule conceptuelle | Source | Fréquence | Owner | Seuil / décision | Garde-fou |
|---|---|---|---|---|---|---|
| Dossiers sans prochaine action | projets actifs sans tâche ouverte référencée + anomalies de référence | projets/tâches | quotidien | OPS-01 | visibilité obligatoire ; objectif chiffré à calibrer | une tâche vague ne résout pas l’anomalie |
| Accords TIM sans prochaine action | accords non terminaux ou rémunérations `due/to_verify/disputed` sans tâche ouverte | TIM/tâches | quotidien | OPS-01 / FIN-01 | visibilité obligatoire | ne pas créer un projet client pour porter la tâche |
| Tâches en retard | tâches ouvertes après échéance, par priorité et ancienneté | tâches | quotidien, hebdomadaire | OPS-01 | par échéance | le nombre baisse par exécution/replanification motivée, pas suppression |
| Promesses non tenues | engagements de retour arrivés à échéance sans interaction/résolution correspondante | interactions/tâches | quotidien, hebdomadaire | Mouaad / OPS-01 | par promesse ; zéro oubli silencieux | une notification envoyée n’est pas la réponse promise |
| Délai de mise à jour | interaction/décision → validation de son compte rendu ou prochaine action | interactions/décisions/tâches | hebdomadaire | OPS-01 | à calibrer | une mise à jour rapide mais fausse est pire qu’une donnée `to_confirm` |
| Données à confirmer | propositions/inconnues encore valides et utiles, ventilées par âge/impact | critères/propositions futures | hebdomadaire | OPS-01 + agent métier | à calibrer ; expirer l’obsolète | ne pas pousser à confirmer une donnée inutile |
| Dossiers inactifs | projets actifs sans interaction, décision ou tâche exécutée dans la fenêtre choisie | projets/chronologie | hebdomadaire | OPS-01 / Mouaad | fenêtre à décider par type de projet | absence d’activité peut être un attente légitime et documentée |
| Nouveaux contacts non triés | soumissions `received/needs_review` non classées | soumissions | quotidien | OPS-01 | par engagement de réponse | pas de rattachement/fusion automatique |
| Doublons et rattachements corrigés | candidats doublons, faux rattachements, corrections | ingestion/audit | hebdomadaire, mensuelle | OPS-01 / TRUST-01 | faux rattachement sensible : tolérance zéro | ne pas optimiser le ratio en fusionnant agressivement |
| Charge administrative nette | temps de triage + revue + ressaisie − tâches manuelles supprimées, selon échantillon | observation manuelle/journal | mensuelle | Mouaad / COS-01 | doit démontrer un gain avant extension | ne pas considérer le temps machine seul |

## 8. Intelligence marché — MKT-01

| KPI | Formule conceptuelle | Source | Fréquence | Owner | Seuil / décision | Garde-fou |
|---|---|---|---|---|---|---|
| Annonces pertinentes détectées | annonces que Mouaad juge dignes de revue pour une révision donnée | snapshots/évaluations/décisions | à chaque import puis hebdomadaire | MKT-01 / BUY-01 | à calibrer par source | pertinence ≠ envoi client ; validation obligatoire |
| Faux positifs | annonces rejetées pour raisons que les données disponibles permettaient de détecter / annonces proposées | évaluations et raisons | hebdomadaire, mensuelle | MKT-01 | à calibrer | séparer défaut de source et défaut d’analyse |
| Informations périmées utilisées | décisions/propositions fondées sur une source déjà expirée ou remplacée | versions, fraîcheur, audit | par incident, hebdomadaire | MKT-01 / TRUST-01 | tolérance zéro pour présentation comme actuelle | un snapshot historique peut être utilisé s’il est clairement daté |
| Données manquantes | facteurs nécessaires restés `unknown` par analyse/source | snapshots/évaluations | par import, hebdomadaire | MKT-01 | informatif puis à calibrer | inconnue ne devient jamais succès ou échec implicite |
| Fraîcheur couverte | objets dans la fenêtre de fraîcheur validée / objets utilisés | snapshots/sources | par import, hebdomadaire | MKT-01 | fenêtre à décider par usage/source | ne pas promettre du temps réel sans connecteur |
| Changements confirmés | changements dédupliqués et vérifiés / changements détectés | snapshots successifs | hebdomadaire | MKT-01 | à calibrer | un export isolé ne prouve pas l’historique complet ni le prix final |
| Temps gagné net | temps de veille manuelle de référence − temps de contrôle/import/revue | échantillon manuel/journal | mensuelle | MKT-01 / COS-01 | à calibrer | aucune estimation auto-déclarée comme preuve |
| Disponibilité des sources | imports/consultations réussis et frais / tentatives autorisées | journal de connecteur/import | par exécution, hebdomadaire | MKT-01 / PROD-01 | à calibrer ; fallback manuel requis | ne pas multiplier les retries ni supposer une API |

## 9. Marketing et croissance — GROW-01

| KPI | Formule conceptuelle | Source | Fréquence | Owner | Seuil / décision | Garde-fou |
|---|---|---|---|---|---|---|
| Conversations qualifiées par contenu | conversations attribuables avec confiance documentée / contenu | contenu, provenance, interaction | hebdomadaire, mensuelle | GROW-01 / Mouaad | à calibrer ; `inconnu` autorisé | ne pas imposer une attribution mono-source |
| Parcours démarrés | démarrages consentis/mesurables par destination et contenu | analytics disponible à vérifier | hebdomadaire | GROW-01 / PROD-01 | informatif | ne pas tracker sans base/consentement applicable |
| Parcours terminés | restitutions obtenues / parcours démarrés mesurables | événements web autorisés | hebdomadaire | GROW-01 / PROD-01 | à calibrer après contrôle technique | ne pas cacher la valeur derrière les coordonnées pour augmenter le ratio |
| Activations volontaires | activations valides après restitution / restitutions mesurables | soumissions/provenance | hebdomadaire, mensuelle | GROW-01 / OPS-01 | à calibrer | un taux faible peut signifier que la valeur autonome fonctionne |
| Coût par conversation qualifiée | coûts contenus + production + distribution attribuables / conversations attribuables | journal de contenu/coût + interactions | mensuelle | GROW-01 / FIN-01 | à calibrer ; ne pas calculer si attribution insuffisante | inclure temps de validation et coûts d’outils |
| Enseignements produits | décisions utiles issues de contenus, pas nombre de notes | Lab/décisions | mensuelle | GROW-01 | informatif puis objectif qualitatif | une observation non appliquée n’est pas un résultat |
| Contenus devenus obsolètes | contenus dont source, claim, destination ou date de revue a expiré | registre documentaire/média | hebdomadaire, mensuelle | GROW-01 / TRUST-01 | retrait/correction par condition d’expiration | ne pas republier automatiquement |
| Contenus sans destination | contenus en production/publiés sans destination utile disponible | fiches contenus/pages | avant publication, hebdomadaire | GROW-01 / PROD-01 | tolérance zéro | une page d’accueil générique ne suffit pas si le CTA promet un parcours précis |
| Claims corrigés ou rejetés | affirmations modifiées/bloquées lors du contrôle / affirmations revues | contrôle conformité | par contenu, mensuelle | TRUST-01 / GROW-01 | informatif ; répétition déclenche correction de méthode | ne pas viser zéro en évitant de documenter les claims |
| Vues et engagement | diagnostic de distribution par canal | plateformes/analytics disponibles | hebdomadaire | GROW-01 | informatif uniquement | ne déclenche ni budget ni reproduction sans North Star/qualité |

## 10. Produit et technologie — PROD-01

| KPI | Formule conceptuelle | Source | Fréquence | Owner | Seuil / décision | Garde-fou |
|---|---|---|---|---|---|---|
| Erreurs | erreurs distinctes par impact, route et version | logs redacted, signal utilisateur, tests | quotidien, hebdomadaire | PROD-01 | tolérance zéro pour exposition/intégrité ; autres à calibrer | volume dépend de l’observabilité ; dédupliquer |
| Abandons | sorties avant restitution par étape, lorsque mesurables | analytics consentis à vérifier | hebdomadaire | PROD-01 / GROW-01 | baseline puis à calibrer | abandon peut être choix sain ; ne pas forcer la progression |
| Frictions qualifiées | observations avec problème, cible, preuve et impact / observations produit | LEVOIS Lab | hebdomadaire | PROD-01 | informatif | ne pas compter chaque commentaire comme bug |
| Temps de résolution | détection → restauration ou correction vérifiée, par gravité | incident/ticket/déploiement | par incident, mensuelle | PROD-01 | par niveau à décider | distinguer contournement et résolution durable |
| Enseignements implémentés | insights donnant lieu à changement livré/testé / insights priorisés | Lab, tickets, décisions | mensuelle | PROD-01 / Mouaad | à calibrer | volume livré ≠ impact |
| Impact mesuré | différence sur le KPI ciblé avant/après avec limites documentées | KPI associé, version/release | après fenêtre pertinente | PROD-01 / COS-01 | critère défini avant réalisation | ne pas attribuer causalement sans protocole suffisant |
| Régressions | comportements auparavant valides devenus invalides après changement | tests, incidents, retours | par build/release | PROD-01 | régression sécurité/flux critique : tolérance zéro avant déploiement | tests verts ne remplacent pas la vérification humaine proportionnée |
| Disponibilité manuelle sans IA | parcours/cockpit critiques testés avec agents désactivés / tests prévus | tests de résilience | à chaque changement agentique puis mensuelle | PROD-01 / TRUST-01 | doit rester vraie | ne pas utiliser un mock agent comme fallback réel |
| Documentation à jour | changements avec contrat/ADR/docs revus / changements concernés | GitHub/documentation | par changement, mensuelle | PROD-01 | à décider par type de changement | quantité de pages ≠ clarté |

## 11. Finance et Accords TIM — FIN-01

| KPI | Formule conceptuelle | Source | Fréquence | Owner | Seuil / décision | Garde-fou |
|---|---|---|---|---|---|---|
| Accords actifs | accords non terminaux, ventilés par axe confirmé | Accords TIM | hebdomadaire, mensuelle | FIN-01 | informatif | actif ne signifie ni mandat ni transaction acquise |
| Accords sans prochaine action | accords non terminaux sans tâche ouverte valide | TIM/tâches | quotidien, hebdomadaire | FIN-01 / OPS-01 | visibilité obligatoire | pas de tâche factice |
| Opérations par stade | comptes par état opérationnel confirmé, avec `unknown` visible | événements TIM | hebdomadaire, mensuelle | FIN-01 | informatif | aucun état déduit d’un silence ou d’un email ambigu |
| Rémunérations estimées | total/compte des estimations validées, séparés par devise/règle et incertitude | compensations TIM | hebdomadaire, mensuelle | FIN-01 / Mouaad | informatif | estimation ≠ créance ; ne pas agréger devises/règles incompatibles |
| Rémunérations dues | montants/éléments dont fait générateur et assiette sont validés | compensations, décisions | par événement, hebdomadaire | Mouaad / FIN-01 | par échéance vérifiée | aucun passage automatique estimé → dû |
| Rémunérations payées | paiements confirmés et rapprochés, nets des doublons | paiements TIM | hebdomadaire, mensuelle | Mouaad / FIN-01 | informatif | référence minimale ; aucune donnée bancaire dans les logs agents |
| Délai de paiement | date de paiement confirmée − date de fait dû confirmé | événements/paiements | mensuelle | FIN-01 | par termes/règles vérifiés | ne pas calculer depuis une date estimée |
| Écarts et litiges | compensations `to_verify/disputed`, divergences estimation/dû/payé | TIM/audit | quotidien, hebdomadaire | FIN-01 | par risque ; décision Mouaad | l’agent ne tranche pas un litige |
| Coûts agents/outils | coût réel par rôle, mission, workflow et fournisseur, si mesuré | journal de coûts futur/factures | quotidien agrégé, hebdomadaire, mensuelle | FIN-01 / COS-01 | plafonds à décider ; arrêt automatique au plafond mission | exclure PII du journal ; inclure retries et production média |
| Écart budget | coût réel − budget autorisé, par mission/département | control plane futur | quotidien, hebdomadaire | FIN-01 / COS-01 | aucun dépassement sans nouvelle approbation | un budget non consommé n’est pas une invitation à dépenser |

## 12. Conformité et confiance — TRUST-01

| KPI | Formule conceptuelle | Source | Fréquence | Owner | Seuil / décision | Garde-fou |
|---|---|---|---|---|---|---|
| Actions externes non autorisées | nombre d’envois, publications, paiements ou engagements sans approbation valide | audit/connecteurs | immédiat | TRUST-01 / Mouaad | tolérance zéro ; kill switch | absence de log ne prouve pas absence d’action |
| Mutations silencieuses | données confirmées modifiées sans événement/décision autorisée | audit, contrôle d’intégrité | immédiat, hebdomadaire | TRUST-01 / PROD-01 | tolérance zéro | inclure critères, consentements, stades, TIM et matching |
| PII interdite dans les logs | occurrences détectées dans journaux techniques/agents | scans/tests autorisés | immédiat, par release | TRUST-01 | tolérance zéro | les scans doivent eux-mêmes minimiser et protéger les résultats |
| Retraits/effacements en cours | demandes ouvertes par étape, échéance vérifiée et blocage d’usage | consentements/demandes | quotidien | TRUST-01 / Mouaad | selon obligation/source officielle | ne pas inventer de délai légal ; aucune suppression irréversible par agent |
| Sources non vérifiées utilisées | propositions/contenus/décisions dont source requise manque ou est expirée | provenance/audit | par revue, hebdomadaire | TRUST-01 | sensible : tolérance zéro avant action externe | une hypothèse peut rester visible si étiquetée et non utilisée comme fait |
| Approbations expirées exécutées | actions associées à une approbation expirée ou à un périmètre différent | approbations/audit | immédiat | TRUST-01 | tolérance zéro | l’identité de l’action, version, canal et destinataire doivent correspondre |
| Incidents de mauvais périmètre | accès/proposition portant sur le mauvais dossier ou département | audit/incident | immédiat | TRUST-01 / COS-01 | tolérance zéro | tester aussi les refus d’accès, pas seulement les succès |
| Taux de correction humaine | propositions corrigées / propositions revues, par type | file de propositions | hebdomadaire, mensuelle | TRUST-01 + agent concerné | diagnostic, pas objectif de baisse isolé | un taux faible peut refléter une revue complaisante |
| Temps de récupération | détection → confinement → restauration vérifiée | incidents | par incident, mensuelle | TRUST-01 / PROD-01 | selon gravité à décider | distinguer service restauré et cause corrigée |

## 13. Matrice de lecture croisée

Une équipe ne peut optimiser sa métrique principale sans surveiller les contre-mesures suivantes :

| Optimisation locale tentante | Métrique de résultat | Contre-mesure qualité/confiance | Contre-mesure ressource |
|---|---|---|---|
| Augmenter les contacts | conversations qualifiées | retraits, plaintes, contexte corrigé, valeur avant coordonnées | coût et temps par conversation |
| Envoyer plus d’annonces | annonces réellement pertinentes | faux positifs, critères durs masqués, retours négatifs | temps de revue par annonce utile |
| Créer plus de tâches | promesses tenues et dossiers avancés | tâches annulées/vagues, surcharge du briefing | charge administrative nette |
| Publier plus | conversations par contenu | claims rejetés, contenus sans destination/obsolètes | coût par conversation qualifiée |
| Réduire le temps de réponse | première réponse utile | corrections, satisfaction qualitative, mauvaise personne | temps humain total et incidents |
| Réduire le coût modèle | coût par résultat | erreurs, abstention, corrections, reprise humaine | coût total incluant retries/revue |
| Accélérer l’approbation | décisions prises à temps | approbations corrigées/annulées, périmètre expiré | temps de revue |
| Fermer plus de missions | objectifs accomplis | valeur réellement produite, incidents | coût par résultat |

## 14. Anti-métriques

Ces volumes peuvent diagnostiquer une étape, mais ne deviennent jamais des objectifs autonomes :

- vues, impressions, likes et abonnés ;
- formulaires ou leads bruts ;
- emails/SMS envoyés ;
- annonces parcourues ou scores calculés ;
- tâches, alertes, missions ou rapports créés ;
- contenus publiés ;
- tokens, appels modèle ou temps machine consommés ;
- taux d’acceptation des propositions sans mesure des corrections ;
- nombre de critères « complétés » ;
- montant TIM estimé ;
- temps économisé déclaré par l’agent ;
- taux de conversion isolé de la confiance et de la qualité.

## 15. Règles d’attribution

1. Conserver l’origine déclarée et la provenance technique autorisée séparément.
2. Accepter `direct`, `multiple`, `inconnu` ou `non mesurable`.
3. Ne pas attribuer toute la conversation au dernier clic si un échange ou une recommandation antérieure est connue.
4. Ne pas fusionner une personne pour améliorer l’attribution.
5. Une recommandation n’autorise pas le suivi d’un tiers non activé.
6. Une campagne payante est évaluée avec son coût complet et son contenu/destination exacts.
7. Corrélation temporelle n’est pas causalité ; une conclusion causale exige un protocole séparé.

## 16. Qualité et fraîcheur des KPI

Chaque KPI affiché porte :

- définition/version ;
- périmètre et période ;
- date de calcul ;
- source et couverture ;
- exclusions et doublons ;
- part `unknown/non mesurée` ;
- owner ;
- décision qu’il peut éclairer ;
- date de prochaine revue de définition.

Si une source ou une définition change, les séries avant/après sont signalées comme non directement comparables. Un calcul agentique n’écrit pas une métrique officielle sans validation déterministe de sa définition et de ses entrées.

## 17. Revue et retrait d’un KPI

Un KPI est supprimé ou rétrogradé en diagnostic s’il :

- ne conduit à aucune décision pendant plusieurs revues ;
- exige plus de saisie qu’il n’évite d’erreurs ;
- incite à contacter, envoyer, publier ou créer des tâches sans valeur ;
- ne peut pas être expliqué à partir de ses sources ;
- expose une donnée trop sensible pour sa valeur ;
- reste trop incomplet pour être interprété ;
- duplique une vue opérationnelle plus simple.

La revue mensuelle choisit explicitement les KPI à garder, corriger, réduire ou retirer. Ajouter un KPI n’est pas une preuve de maturité ; rendre une meilleure décision avec moins de métriques l’est.
