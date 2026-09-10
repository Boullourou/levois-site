# Acquéreur, transition et lecture locale — vérification du 10 septembre 2026

Périmètre : worktree `levois-experience-cible-20260909`, serveur local `http://127.0.0.1:4331`. Aucun déploiement, aucun envoi de demande, aucune écriture cockpit.

## Résultats

- **41 tests de domaine réussis** : `buyer-transition.test.ts`, `domain-revision.test.ts`, `local-experience.test.ts`, `buyer-historical-resource.test.ts` (dernière exécution : 16:33).
- **8 parcours Chromium réussis en sessions fraîches**, après les corrections du runtime commun : lecture acquéreur vide ; parcours réellement saisi sans budget ; choix inconnu exclusif ; correction budget/secteur/surface ; retour depuis les ressources ; reprise d’un parcours complet ; conditions/dates et choix d’attendre en transition ; transition vide autonome. Rapport : `buyer-transition-ui-verification.json`.
- **Lecture locale réussie** sur 320, 390 et 1440 px, sans débordement horizontal ni erreur de page : deux questions avant toute coordonnée, conservation de la lecture partagée, absence de classification implicite vendeur/QR, réponse DVF indisponible utile. Rapport : `local-ui-verification.json`.

Les captures finales mobiles acquéreur, transition et locale ont été examinées visuellement. La lecture reste lisible en colonne, les conditions et les éléments inconnus sont distingués. Les captures antérieures suffixées `failure` documentent les défauts trouvés puis corrigés ; elles ne représentent pas le résultat final.

## Régressions trouvées puis corrigées avec le responsable du runtime

1. Un choix « inconnu » pouvait coexister avec des choix connus dans une réponse multiple : exclusivité corrigée et vérifiée.
2. La reprise d’un parcours complètement renseigné redemandait le premier écran : navigation vers la lecture corrigée et vérifiée.
3. Premier clic « Continuer / Actualiser » perdu après saisie : le rendu d’impact sur `change` déplaçait le bouton entre l’appui et le relâchement. Correctif de gestion du pointeur vérifié par saisie réelle, notamment sans budget et pour attendre en transition.
4. Une exécution intermédiaire a rencontré un export d’audit manquant pendant des modifications concurrentes. L’export a été rétabli ; les huit scénarios ont ensuite été relancés avec succès dans des pages neuves.

## Conservation des faits DVF

L’ancien acquéreur affichait des statistiques utiles (nombre de ventes, médiane, dispersion par zone/type). Il les associait aussi à des conclusions budget/surface qui ne sont pas conservées. La restitution acquéreur actuelle inclut un repère historique facultatif et fournit `getBuyerResource(context)`, avec un lien vers `Votre rue`, contextualisé uniquement par le secteur déclaré encodé dans `q`.

Ce lien ne confirme jamais une adresse libre, ne modifie pas la source d’entrée et ne dépend ni du budget ni de la surface. La ressource rappelle source DGFiP/Etalab, période, périmètre, nombre observé et limites ; elle ne conclut ni prix actuel, ni disponibilité, ni capacité d’achat. Les trois tests spécifiques de cette restauration sont inclus dans les 41 tests ci-dessus. Son branchement dans le runtime partagé appartient au responsable de ce runtime.

Les fonctions préexistantes `geocoder`, `computeTrend` et `computeModel` de `votre-rue.astro` sont identiques au HEAD initial après normalisation des fins de ligne. Les données DVF et les moteurs d’observatoire n’ont pas été modifiés.

## Limite de vérification

Le test local utilise le véritable jeu DVF du dépôt et une réponse BAN simulée à partir d’une de ses adresses réelles. Il vérifie l’ambiguïté, le choix explicite et la compatibilité historique `q` / `confirmee`. Il ne certifie pas la disponibilité actuelle du service BAN distant. Aucune vérification TypeScript autonome n’est revendiquée : ce lot a été vérifié par Vitest et par les pages Astro réelles servies localement.

Reproduction : `node scripts/qa-buyer-transition.mjs`, `node scripts/verify-local-experience.mjs`, puis `npm test -- src/lib/experience/buyer-transition.test.ts src/lib/experience/domain-revision.test.ts src/lib/experience/local-experience.test.ts src/lib/experience/buyer-historical-resource.test.ts`.
