# Questionnaire vendeur historique — immuable

Copie des trois fichiers au commit `52c92ca64ca22606272ae9dd933b5706f4301842`, réalisée avant leur évolution : `src/data/situations.ts`, `src/data/types.ts`, `src/lib/engine.ts`. Seul l’import des types dans le moteur a été normalisé vers `./types` pour rendre le snapshot autonome. Les octets normalisés en LF sont protégés par des empreintes dans `src/lib/experience/legacy-seller.test.ts`.

Ne pas modifier les questions, l’ordre des options, les fragments ou le moteur ici. Les anciens codes `r` ne contiennent pas de version. Ils sont reconstruits avec ce HEAD audité ; sans archive antérieure, cela ne prouve pas le texte vu à une date plus ancienne.

La méthode actuelle se trouve dans `src/lib/experience/seller.ts`. Elle réutilise les 24 questions avec une lecture nouvelle et séparée. Les corrections de discours actuelles ne doivent jamais réinterpréter silencieusement les index d’un ancien lien.
