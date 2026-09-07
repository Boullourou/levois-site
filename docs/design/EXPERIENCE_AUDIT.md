# Audit d’expérience LEVOIS — Phase 2.6

- Date de l’audit : 18 août 2026
- Périmètre : cockpit V1, écrans **Aujourd’hui**, **fiche acquéreur** et **Accord TIM**
- Référence fonctionnelle : `f93c7903739448713f129e53e5e37d1773996d7c`

## Verdict

Le cockpit actuel est fiable, sécurisé et complet, mais sa présentation ressemble encore à la projection directe d’un modèle de données. La répétition de panneaux bordés, de compteurs ronds et de badges donne le même poids à presque tout. Sur mobile, l’utilisateur doit faire défiler avant de trouver ce qui demande une action.

La Phase 2.6 ne doit donc pas « embellir les cartes ». Elle doit changer l’ordre perceptif : **attention → décision → détail**, tout en conservant exactement les données, les commandes et les états métier.

## Ce qui fonctionne et doit rester vrai

- La navigation privée reste limitée à cinq entrées et demeure stable entre mobile et ordinateur.
- Les états chargement, vide et erreur sont distincts. Une panne ne ressemble pas à une journée calme.
- Les cibles principales dépassent 44 px, le focus est visible, le zoom n’est pas bloqué et `prefers-reduced-motion` est respecté.
- Les textes issus de la base sont injectés avec `textContent` ; la refonte ne doit pas fragiliser cette frontière XSS.
- L’historique des critères n’est pas écrasé et les trois axes TIM restent réellement indépendants.
- Le cockpit n’embarque ni PostHog, ni donnée statique, ni cache hors ligne.

## Bruit transversal

### Une succession de cartes équivalentes

Les trois écrans déroulent des sections bordées, elles-mêmes remplies de sous-cartes. La bordure sert simultanément de structure, de séparation et d’accent : elle ne dit plus rien. La lecture devient « quelle section vient ensuite ? » alors qu’elle devrait être « que dois-je décider ? ».

### Une hiérarchie typographique trop uniforme

Les grands titres prennent beaucoup de hauteur, puis de nombreuses informations métier utiles retombent à 12–13 px. Les libellés en capitales et les badges se multiplient alors que la prochaine action, l’échéance ou l’incertitude devraient dominer.

### Des actions en double

La création de tâche apparaît au niveau page puis dans la section Tâches. Sur Aujourd’hui, le titre est déjà un lien mais un second lien « Ouvrir » est répété. Cette duplication alourdit sans sécuriser l’action.

### Le langage technique remonte à la surface

Des expressions comme « unités mineures », « paiement idempotent », certains codes d’état et l’empilement importance/flexibilité/certitude/rôle matching exposent le fonctionnement interne. Ces informations doivent rester disponibles, mais en profondeur.

## Écran 1 — Aujourd’hui

### Ce qui ralentit

- Les deux créations globales précèdent la file de travail et concurrencent la priorité réelle.
- Cinq panneaux sont toujours rendus avec une hauteur minimale importante, y compris lorsqu’ils sont vides.
- Le premier panneau ressemble à une carte KPI élargie ; les suivants forment une grille de dashboard.
- Les compteurs ronds occupent une place visuelle sans aider à décider.
- Le titre lié et le bouton « Ouvrir » décrivent deux fois la même destination.

### Ce que l’écran doit devenir

Une séquence continue, triée par attention, dont la première ligne suffit à répondre : **qui, pourquoi maintenant, quelle action**. Les rubriques restent présentes pour préserver les distinctions métier, mais deviennent des passages d’une même partition plutôt que cinq widgets.

## Écran 2 — Fiche client acquéreur

### Ce qui ralentit

- Le nom est affiché dans le titre puis répété dans la synthèse.
- Les six grands blocs s’enchaînent à pleine largeur sans vue de travail compacte.
- Chaque critère courant devient une carte qui expose immédiatement jusqu’à quatre métadonnées, sa provenance et son action.
- La chronologie répète une partie des interactions, tâches et changements déjà visibles ailleurs.
- Les scénarios préféré, acceptable et conditionnel ne forment pas encore une image mentale claire.

### Ce que l’écran doit devenir

Le premier viewport doit réunir identité, projet, stade, prochaine action et échéance. La recherche devient une lecture humaine : **indispensable**, **important**, **souple**, **à confirmer**. Les métadonnées et l’historique restent consultables à la demande, sans disparaître.

## Écran 3 — Accord TIM

### Ce qui ralentit

- Le titre fictif long, la description et trois actions repoussent les trois axes sous le pli mobile.
- La synthèse répète la référence et le libellé déjà annoncés.
- Accord, opération et rémunération sont corrects dans les données mais apparaissent comme trois mini-cartes identiques.
- Cinq montants financiers sont présentés avec un poids équivalent.
- Les termes, paiements et événements d’état sont ouverts dans une longue page avant que l’utilisateur ait répondu à « que dois-je surveiller ? ».

### Ce que l’écran doit devenir

Une lecture en quelques secondes : **accord → opération → rémunération**, puis prochaine action et échéance. La part estimée, le dû, le payé et le solde sont hiérarchisés ; les termes versionnés et le journal restent accessibles plus bas, sans apparence de logiciel comptable.

## Mobile 390 × 844

Le socle ne déborde pas horizontalement, mais le cumul titre + actions pleines largeurs + bordures + paddings consomme le premier écran. La navigation basse est utilisable, toutefois ses libellés actuels sont trop petits. Les formulaires longs restent techniquement accessibles mais demandent une progression visuelle plus nette et un pied de dialogue toujours atteignable avec le clavier affiché.

## Accessibilité à améliorer dans la présentation

- Remonter les textes métier essentiels à 15–17 px ; réserver 11–12 px aux vrais labels secondaires.
- Renforcer l’affordance des lignes tactiles sans dépendre du survol.
- Ne porter aucun statut uniquement par une couleur : texte, position et forme doivent confirmer le sens.
- Conserver un focus très visible sur fond clair comme sur fond sombre.
- Éviter qu’une racine de fiche entière soit annoncée comme une zone live lors du chargement.
- Dans les dialogues, amener le focus sur le premier champ utile plutôt que sur le bouton fermer lorsque cela peut être fait sans changer le contrat fonctionnel.

## Décisions de prototype

1. Remplacer la grille de panneaux d’Aujourd’hui par une file typographique continue.
2. Donner au client une bande de situation et une recherche lisible en surface, détaillée en profondeur.
3. Faire des trois axes TIM la composition principale, pas une sous-section.
4. Conserver tous les endpoints, formulaires, champs, valeurs, états d’erreur et règles de sécurité.
5. Limiter la nouvelle présentation aux trois pages pilotes via leur identifiant de page.

## Baseline visuelle

Les captures avant refonte sont conservées sous :

- `docs/design/screenshots/before/mobile/`
- `docs/design/screenshots/before/desktop/`

Elles utilisent le même snapshot D1 fictif que les captures finales ; aucune réinitialisation n’est effectuée entre les deux séries.
