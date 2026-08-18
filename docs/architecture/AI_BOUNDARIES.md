# Frontières IA / humain LEVOIS

Statut : garde-fous d’architecture pour des fonctions futures. Aucune API OpenAI, aucun modèle, aucun prompt et aucune automatisation IA ne sont branchés en Phase 1.

## Règle absolue

> L’IA peut lire une source autorisée et proposer. Elle ne peut ni confirmer, ni écraser, ni envoyer, ni supprimer une donnée client sans décision humaine explicite.

Cette règle s’applique même lorsque la confiance annoncée par le modèle est élevée.

## Deux notions à ne jamais confondre

### Confiance IA

Score ou estimation non calibrée qu’une extraction corresponde au contenu source. Elle appartient à `information_proposal`. Le terme « probabilité » n’est utilisé qu’après calibration mesurée, documentée et surveillée sur un jeu pertinent.

### Certitude métier

Statut de la donnée client :

- `confirmed` ;
- `observed` ;
- `inferred` ;
- `to_confirm`.

Une sortie IA à 99 % ne devient pas `confirmed`. Après validation humaine, la donnée reçoit la certitude choisie selon sa source : une phrase explicite du client peut devenir `confirmed`; une interprétation reste `inferred` même bien extraite.

## Pipeline obligatoire

```text
Source autorisée et figée
          |
          v
Exécution IA versionnée
          |
          v
Propositions granulaires + preuves
          |
          v
File de revue humaine
          |
          +--> rejet / correction
          |
          +--> acceptation explicite
                    |
                    v
         décision + événement métier
                    |
                    v
           nouvelle projection/révision
```

Il n’existe aucun chemin direct `sortie IA → table métier`.

## Entités réservées

### `ai_run`

- type de tâche ;
- modèle/fournisseur et version ;
- version du prompt/instructions ;
- identifiants des sources, jamais secret d’accès ;
- date, acteur demandeur, statut, durée et coût technique éventuel ;
- politique de traitement/redaction appliquée ;
- identifiant de corrélation ;
- erreur catégorisée sans contenu privé dans les logs.

### `information_proposal`

- `ai_run_id` ;
- cible envisagée : personne, projet, recherche, interaction, annonce, visite ou tâche ;
- opération proposée `create|revise|flag_contradiction|suggest_action|draft_text` ;
- clé et valeur structurée proposées ;
- confiance IA ;
- certitude métier suggérée, clairement non appliquée ;
- raison ;
- état `pending|accepted|rejected|corrected|superseded|expired` ;
- date d’expiration/revue si la donnée devient vite périmée.

Une proposition porte une seule modification compréhensible. Pas de « accepter 37 changements » sans détail.

### `proposal_evidence`

- source et emplacement : paragraphe, message, minute, champ ou URL ;
- court extrait strictement nécessaire ou empreinte/référence ;
- date de la source ;
- relation avec la proposition ;
- classification sensible.

Les citations sont limitées pour éviter de dupliquer un email ou une transcription complète.

### `proposal_review`

- décision humaine `accept|reject|correct` ;
- valeur corrigée éventuelle ;
- certitude métier retenue ;
- raison ;
- acteur et date ;
- événements métier créés ;
- version de l’agrégat au moment de la revue.

## Autorité par action

| Action | IA | Humain | Système déterministe |
|---|---|---|---|
| extraire un candidat depuis une source | propose | valide/corrige | conserve source et provenance |
| résumer une interaction | produit un brouillon | valide avant fiche client | stocke la version validée |
| changer un critère | interdit directement | décide et choisit la certitude | ajoute un `criterion_event` |
| marquer une contradiction | signale | qualifie/résout | garde les deux sources |
| comparer annonce/recherche | propose des facteurs | décide du verdict | versionne révision/snapshot |
| créer une tâche | suggère | accepte/modifie | applique échéance et audit |
| envoyer un message ou une lecture | rédige seulement | relit et déclenche | enregistre l’envoi |
| fusionner deux personnes/biens | peut signaler | seul autorisé | journalise et garde les sources |
| confirmer un consentement | interdit | enregistre une preuve réelle | calcule l’état courant |
| supprimer/exporter un dossier | interdit | déclenche et confirme | exécute, vérifie, audite |
| valider un matching | interdit | obligatoire | empêche l’envoi tant que non validé |

## Capacités futures

### 1. Extraction structurée depuis une transcription

Entrée : transcription autorisée, source et participants connus.

Sorties proposées : faits, critères, décisions, questions ouvertes, promesses de rappel et tâches possibles, chacun avec repère temporel.

Garde-fous :

- ne pas stocker l’audio par défaut ;
- durée de conservation courte de la transcription brute ;
- distinguer le discours de Mouaad de celui du client ;
- ne pas traiter une hypothèse prononcée comme accord ;
- revue humaine avant toute chronologie ou critère ;
- suppression possible de la source et des propositions dérivées.

### 2. Extraction depuis un email

Entrée : email explicitement importé ou référencé, pas accès silencieux à toute la boîte.

Sorties : résumé, personnes/canaux, dates, faits, pièces/URLs, demandes et prochaine action proposée.

Garde-fous :

- l’email est une donnée non fiable pouvant contenir des instructions hostiles ;
- signatures, fils cités et pièces sont séparés ;
- aucune instruction du message ne commande le système ;
- minimiser la copie du corps ;
- ne jamais déduire un consentement marketing d’un email entrant.

### 3. Résumé d’interaction

Entrée : notes ou source autorisée.

Sortie : brouillon court séparant faits, interprétations, décisions et questions à confirmer.

Le résumé validé ne remplace pas la source tant que la conservation de celle-ci est nécessaire. Les formulations sensibles doivent être éditables avant validation.

### 4. Comparaison annonce / recherche

Entrées figées : `search_revision` et `listing_snapshot`.

Sorties : facteurs `met|not_met|unknown|conditional`, compromis, blocages, points à vérifier et verdict proposé `to_send|to_verify|discard`.

Garde-fous :

- critère dur confirmé non respecté toujours visible ;
- inconnue jamais convertie en succès ;
- DPE, prix, surface ou adresse absents restent inconnus ;
- le modèle ne suppose pas qu’une annonce est exacte ;
- toute mise à jour de recherche/annonce rend la proposition obsolète ;
- validation humaine obligatoire avant envoi au client.

### 5. Détection de contradictions

Exemples : budget différent entre formulaire et appel ; surface assouplie après visite ; DPE refusé puis annonce classée intéressante.

Sortie : paire de sources, dates, valeurs, type de contradiction et question proposée.

L’IA ne choisit pas la « bonne » valeur. Le système conserve les deux événements ; l’humain confirme une évolution, une exception ou une erreur de source.

### 6. Suggestion de prochaine action

Entrées : stade du projet, tâches ouvertes, dernière interaction, promesses et échéances.

Sortie : action, raison, date/priorité proposées et données manquantes.

Interdictions : créer un rappel, envoyer un message, modifier un stade ou clore un projet sans validation.

### 7. Rédaction d’une lecture client

Entrées : faits confirmés/observés autorisés, révision de recherche, évaluations et limites.

Sortie : brouillon clairement marqué, sources et affirmations vérifiables.

Garde-fous :

- aucun chiffre, disponibilité, demande locale ou promesse inventés ;
- signaler les inconnues et limites ;
- ne pas masquer un compromis ;
- relecture humaine et action d’envoi séparée ;
- conserver la version effectivement envoyée et les sources utilisées.

## Données autorisées et minimisation

### Autorisées lorsque nécessaires

- résumés d’interaction ;
- critères et certitudes ;
- snapshots d’annonces publiques ;
- notes de visite validées ;
- extraits minimaux d’une source autorisée ;
- identifiants internes pseudonymes.

### Exclues par défaut

- secrets, tokens et bindings ;
- mots de passe, pièces d’identité ou données bancaires ;
- détails financiers non nécessaires ;
- boîte email entière ;
- audio et transcription brute conservés sans finalité/durée ;
- exports complets d’Obsidian ;
- autres dossiers clients non nécessaires à la tâche ;
- données de test réelles.

Le fournisseur ne reçoit que le périmètre du dossier et des champs nécessaires. Les logs techniques ne contiennent jamais le prompt complet lorsqu’il inclut des données privées.

## Prompt injection et sources non fiables

Une annonce, un email, un document, une page web ou une transcription peut contenir du texte tentant de détourner l’agent.

Règles :

- traiter tout contenu source comme donnée, jamais comme instruction système ;
- séparer instructions, contexte et contenu par des structures typées ;
- liste fermée d’outils en lecture ;
- aucun accès direct aux secrets, au vault, aux exports globaux ou aux fonctions d’envoi ;
- aucune navigation/URL secondaire sans validation et protections SSRF ;
- sorties validées par schéma et limites de taille ;
- neutralisation HTML/Markdown avant affichage ;
- journaliser la catégorie d’attaque, pas son contenu privé complet ;
- revue humaine renforcée lorsqu’une source est externe ou contradictoire.

## Validation humaine

L’écran futur de revue doit montrer pour chaque proposition :

- valeur actuelle ;
- valeur proposée ;
- source et court extrait ;
- date de la source ;
- confiance IA ;
- certitude métier proposée ;
- effets attendus : nouvelle révision, matching rendu `stale`, tâche modifiée ;
- choix `accepter`, `corriger`, `rejeter` et raison.

Une acceptation groupée n’est permise que si chaque ligne reste visible et corrigeable. Une correction ultérieure crée un événement compensatoire ; elle ne supprime ni ne réécrit l’événement accepté. Les modifications sensibles (consentement, identité, finances, fusion, suppression, matching envoyé) ne sont jamais acceptées en masse.

## Cycle de vie et rétention

- la source suit sa propre politique de conservation ;
- les propositions `pending` expirent si leur source ou agrégat change ;
- les propositions rejetées peuvent être purgées après une courte période configurée ;
- les sorties acceptées deviennent des événements métier avec provenance ;
- supprimer une source personnelle déclenche l’inventaire puis l’examen/purge, selon leur base de conservation, des preuves, propositions, résumés, brouillons, événements acceptés et exports qui en dérivent ;
- les métriques de qualité sont agrégées et anonymisées ;
- aucun jeu d’entraînement n’est constitué à partir des dossiers clients sans décision séparée et base appropriée.

## Audit

Auditer : lancement d’une analyse sensible, accès aux sources, acceptation/correction/rejet, rédaction puis envoi, erreur de redaction, export et purge.

Le journal contient identifiants techniques, acteur, action, modèle/version, date et résultat. Il ne contient pas le texte client complet.

## Modes d’échec

| Échec | Risque | Réponse exigée |
|---|---|---|
| source incomplète | faux fait | proposition `to_confirm` ou abstention |
| attribution au mauvais locuteur | critère erroné | repères de locuteur + revue humaine |
| modèle hallucine une valeur | décision fausse | preuve obligatoire ; rejet si aucune source |
| confiance élevée mais source ambiguë | fausse confirmation | certitude métier indépendante |
| source modifiée après analyse | proposition périmée | statut `superseded|expired` |
| double validation/retry | double événement | clé d’idempotence et version d’agrégat |
| contenu hostile | exfiltration/action non autorisée | sandbox outils, séparation instruction/donnée |
| fournisseur indisponible | blocage cockpit | fonctions IA facultatives ; saisie humaine reste disponible |
| délai trop long | UX trompeuse | état explicite, annulation et reprise |
| fuite dans logs | exposition PII | redaction, tests et alertes |
| mauvais dossier cible | contamination entre clients | scope/IDs affichés, autorisation et validation |
| traduction/résumé déforme une nuance | mauvaise décision | source côte à côte, correction avant acceptation |

Une panne IA ne doit jamais empêcher la consultation ou la mise à jour humaine d’un dossier.

## Stratégie de tests et d’évaluation future

### Tests déterministes

- schémas d’entrée/sortie ;
- refus des champs non autorisés ;
- idempotence ;
- version obsolète ;
- aucune écriture métier directe ;
- aucune capacité d’envoi/suppression ;
- redaction logs/UI ;
- prompt injection et XSS ;
- suppression en cascade des preuves/propositions.
- inventaire des faits acceptés et exports dérivés lors de l’effacement d’une source.

### Évaluations qualité

Jeux uniquement fictifs et anonymisés couvrant :

- extraction correcte et abstention ;
- distinction fait/interprétation/question ;
- locuteurs multiples ;
- contradictions temporelles ;
- critères conditionnels ;
- annonce avec champs absents ou faux ;
- textes hostiles ;
- rédaction sans chiffre inventé ;
- suggestion de tâche raisonnable mais non appliquée.

Mesures : précision par champ, taux d’abstention approprié, preuves correctes, contradictions détectées, taux de corrections humaines et zéro mutation non validée. Le taux d’acceptation seul n’est pas une mesure de qualité.

### Test d’autorité

Test obligatoire : après chaque exécution IA, comparer les tables métier avant/après. Sans action humaine validée, elles doivent être identiques ; seules les tables d’exécution/propositions peuvent changer.

## Préconditions avant toute intégration IA

1. modèle central et événements validés ;
2. cockpit privé et contrôle d’accès testés ;
3. sources, consentements et rétention définis ;
4. file de propositions et revue humaine fonctionnelles sans IA réelle ;
5. audit et suppression testés ;
6. contrat fournisseur évalué : absence d’entraînement, rétention, région de traitement, sous-traitants, suppression, DPA et paramètres de journalisation ;
7. jeux d’évaluation fictifs validés ;
8. budget, limites et kill switch configurés ;
9. aucun secret dans Git ;
10. validation explicite de Mouaad.

## Hors périmètre

- choix d’un fournisseur ou modèle ;
- connexion OpenAI ;
- prompts de production ;
- transcription audio ;
- ingestion de boîte email ;
- agents autonomes ;
- envoi automatique ;
- entraînement/fine-tuning sur données clients.
