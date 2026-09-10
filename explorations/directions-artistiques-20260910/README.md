# Explorations artistiques LEVOIS

Trois prototypes isolés : La Ligne claire, Le Plan vivant, À portée. Aucun fichier source de production n’est modifié.

## Ouvrir localement

Depuis le worktree autorisé :

```powershell
Set-Location -LiteralPath 'C:\Users\PC\.codex\worktrees\levois-experience-cible-20260909'
node explorations/directions-artistiques-20260910/serve.mjs
```

Ouvrir **http://127.0.0.1:4340/**. Le serveur ne dépend pas d’Astro et ne nécessite aucune installation supplémentaire. Il ne sert que cette exploration et les actifs publics du même worktree. Ctrl+C l’arrête. Si 4340 est occupé, ajouter `--port 4341`.

- Comparaison : http://127.0.0.1:4340/
- Dossier lisible : http://127.0.0.1:4340/comparaison.html
- La Ligne claire : http://127.0.0.1:4340/ligne-claire/?screen=accueil
- Le Plan vivant : http://127.0.0.1:4340/plan-vivant/?screen=accueil
- À portée : http://127.0.0.1:4340/a-portee/?screen=accueil

Les écrans directs sont `accueil`, `visites`, `recherche`, `lecture`, plus deux aperçus `transition` et `local`. Le comparateur commute les quatre situations principales et les largeurs 390/320. Ouvrir une direction en plein écran pour le desktop ; redimensionner la fenêtre pour comparer.

## Sur un téléphone réel

Sur le même réseau local que le PC, relancer le serveur avec `--host 0.0.0.0`, puis ouvrir `http://ADRESSE-IP-LOCALE-DU-PC:4340/` dans le navigateur du téléphone. L’adresse locale du PC apparaît notamment avec `ipconfig`. Windows peut demander une autorisation réseau ; aucune règle du pare-feu n’a été modifiée par cette mission. Ce mode est facultatif et n’est pas activé par défaut. Ne pas exposer le port sur Internet.

## Ce qui fonctionne

Sélection, conséquence personnalisée, correction, retour, session anonyme et téléchargement texte. Les autres suites sont des prévisualisations locales explicites. Aucune API, coordonnée, transmission, conservation distante, relance ou analyse d’audience. Les demandes ne sont pas envoyées à Mouaad.

Les exemples et plans sont fictifs. Les trois parcours ne sont pas implémentés intégralement. Les trois directions ne sont pas trois versions de production.

## Fichiers utiles

- `comparaison.md` : dossier source ; `comparaison.html` : version lisible dans le navigateur.
- `concepts/` : trois planches d’intention et leurs prompts ; les photos approximatives des planches ne font pas autorité sur l’identité de Mouaad.
- `preuves/` : captures exactes et rapports automatisés par direction.
- `*/NOTES.md` : logique de chaque direction et registre de fidélité.
- `shared/experience.js` : faits, conséquences et comportements communs ; aucun code de production ne l’importe.
- `verify.mjs` : vérifications et captures reproductibles avec les dépendances de développement déjà installées dans ce worktree. Serveur local nécessaire : `node explorations/directions-artistiques-20260910/verify.mjs`.
- `build-doc.mjs` : reconstruit la version HTML du dossier avec le moteur Markdown déjà présent dans les dépendances du site.

**Règle d’arrêt : attendre l’arbitrage explicite ; aucune migration, fusion ou publication à la suite de cette exploration.**
