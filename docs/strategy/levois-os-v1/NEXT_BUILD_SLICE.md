# Prochaine tranche de construction : stabiliser la qualification terrain

## Choix

La prochaine tranche unique est : **finir et valider l’outil de qualification terrain avant toute connexion au cockpit.**

## Pourquoi ce choix

- Il répond à un besoin immédiat et concret : demain, Mouaad parle à des propriétaires et professionnels.
- Le prototype local existe déjà ; une courte boucle terrain peut révéler les vraies informations utiles.
- Brancher maintenant l’outil à D1 ou au cockpit créerait une dépendance aux données réelles alors que l’accès reste NO-GO.
- Yanport CSV, agenda et Agentic dépendront tous de la même clarification : quelles informations capturer pour prendre une décision et définir la prochaine action ?

## Périmètre fermé

1. Recette sur iPad des 7 fiches fictives/de travail local.
2. Vérification du scénario : raison du contact < 2 secondes ; prochaine question < 2 secondes ; STOP immédiat ; débrief < 60 secondes.
3. Liste courte de frictions observées et décision : garder, retirer ou reporter.
4. Définition d’un format de sortie minimal : bien, interlocuteur, accès, trois notes, verdict, prochaine action.

## Critères d’acceptation

- aucune navigation publique ajoutée ;
- aucun stockage distant et aucune donnée réelle dans Git ;
- une fiche reste exploitable debout, sur iPad, sans scroll horizontal ;
- toute information non connue est « À vérifier » ;
- une prochaine action unique est visible à la sortie.

## Hors tranche

Intégration cockpit, D1, matching, Yanport API/CSV, agenda automatique, IA, site public, vidéo, Agentic OPS/COS.
