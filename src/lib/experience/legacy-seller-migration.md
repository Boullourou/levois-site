# Raccord vendeur

`parseLegacySeller(new URLSearchParams(location.search))` ne lit aucun stockage. Un `r` présent est prioritaire ; un code invalide ne doit jamais afficher la lecture d’une session précédente. `result.initialAnswers` contient uniquement les valeurs à importer dans un contexte seller explicite, avec provenance `imported`. Proposer de confirmer/corriger ce contexte pour produire une **nouvelle** lecture par `sellerJourney` ; conserver la reconstruction séparément. `result.answers` et `result.result` sont les valeurs et calculs historiques exacts du HEAD figé.

`s` accepte `preparer`, `publiee`, `peu-contacts`, `visites`, `longtemps` et leurs cinq slugs historiques. `q` concerne l’adresse de Votre rue à la base ; il ne doit pas devenir une réponse vendeur. Les nouveaux liens d’acquisition ne doivent pas encoder de réponses ou de données privées.

Le sélecteur actuel utilise `seller_situation`. Les identifiants historiques sont préfixés par `seller_<branche>_<question>` en remplaçant les tirets par des underscores : les durées des trois branches ne peuvent ainsi pas se contaminer. `sellerInactiveAnswerIds(context)` indique les réponses de branche devenues inutiles ; la lecture les ignore aussi défensivement. Les anciennes lectures doivent rester datées et versionnées dans l’historique lorsque le contexte change.

Les cinq branches gardent leurs 24 questions et leurs choix d’origine. `unknown` est ajouté dans la cible uniquement. Réflexion, offre reçue et incident complètent ce noyau. Le choix historique `longtemps / preoccupation=compromis-annule` ouvre la vérification incident sans supprimer les cinq questions historiques. Les questions communes finales sont `seller_appui`, `seller_apres_vente` et `seller_rythme`.

Douze aides explicatives sont reformulées dans la cible : elles ne classent plus les réponses selon une fiabilité non étayée (« dix avis », seconde visite « plus fiable ») et n’imposent pas d’urgence de modification. Les fragments historiques ne servent jamais à la lecture cible : « Le prix » ou « prix modifié » ne deviennent pas une baisse. Le snapshot reste strictement inchangé et les anciens liens utilisent toujours ses formulations, explicitement datées comme reconstruction.

`sellerNeedsTransition(context)` signale un lien à reprendre dans le même contexte de projet, sans créer une faisabilité. `getSellerResource(context)` est une ressource ouverte. Le libellé historique « Faire relire mon lancement » ouvre `/ressources/lancement-coherent` ; il ne soumet jamais une demande humaine. La relecture écrite ciblée et l’échange sont les sorties distinctes du composant partagé.

Les lectures utilisent cinq blocs, des réponses sources, deux ou trois options conditionnelles et un réexamen de l’attente. Une réponse confirmée par le visiteur reste déclarative : elle n’est jamais transformée automatiquement en pièce vérifiée. Ni coordonnées, ni transmission, ni consentement ne sont gérés dans ce domaine pur.
