# Trois preuves, une même expérience

Phase isolée de direction artistique autorisée le 10 septembre 2026. Aucun changement de route ou de source de production. Base : 52c92ca64ca22606272ae9dd933b5706f4301842. Le dossier Astra est le cadre fonctionnel validé ; ses anciennes préconisations de direction unique et de test préalable sont remplacées par les arbitrages du 10 septembre.

## Périmètre et comparaison

Exactement trois directions : **La Ligne claire**, **Le Plan vivant**, **À portée**. Chacune a son propre HTML de rendu, sa composition et son CSS. Seuls les faits, conséquences et comportements de conservation sont communs. Quatre situations principales : accueil, visites, recherche, lecture. Traduction desktop de chacune, 390 × 844 prioritaire, vérification 320 px et 1440 px. Deux aperçus courts permettent aussi de suivre les liens transition et repères locaux sans fabriquer de parcours complet.

Les données sont un cas d’étude déclaré, sans client, bien en vente ou budget validé. Les deux logements comparés sont fictifs. Toutes les informations essentielles restent visibles ; le bouton signature dirige vers une conséquence déjà présente, sans verrou ni attente artificielle. La sélection et la correction changent réellement le contenu. Pas de soumission réseau, d’analyse d’audience ou de collecte dans ces preuves.

## Contenu partagé immuable

Accueil : « Un projet immobilier. Des choix plus clairs. » ; « Partir de votre situation, comprendre vos options, décider de la suite. » Trois projets : « Acheter », « Vendre », « Vendre et acheter ». Accès séparé « Explorer les repères locaux ». Aucun formulaire initial.

Vidéo : « Des visites, mais aucune offre ? » Première valeur immédiatement : « Une visite sans offre ne suffit pas à expliquer ce qui freine la vente. » Question : « Qu’est-ce qui revient après les visites ? » Trois réponses : « Le même point revient », « Les retours sont différents », « Je n’ai pas de retour précis ». Conséquences : un frein à examiner, des raisons à distinguer, un retour concret à construire. Jamais de baisse de prix automatiquement déduite. Limite : « Ces retours ne suffisent pas à conclure sur le prix ou sur la qualité du bien. » Suite : « Préparer la prochaine question ». La dernière réponse est un état parfaitement utile.

Acquéreur : « Qu’est-ce que votre prochain logement doit rendre possible ? » Réponses : « Travailler au calme », « Recevoir mes proches », « Profiter du dehors ». Une priorité à la fois dans cette séquence. Aucune absence de sélection ne vaut renoncement. À défaut, calme constitue l’exemple initial. Signature : « Voir ce que cette réponse change ». Comparaison fictive constante : logement A, 92 m², pièce indépendante, séjour compact, jardin 35 m² ; logement B, 105 m², coin bureau dans le séjour, séjour ouvert, balcon 6 m². Le choix d’usage change le critère à examiner, jamais une recommandation d’achat. Budget, localisation, nuisances et disponibilité inconnus. Prochaine action : « Garder cette priorité » puis lecture, ou modifier.

Restitution : « Votre projet, un peu plus clair. » Ordre obligatoire : « Ce qui est compris », « Ce qui paraît solide », « Ce qui peut évoluer », « Ce qui reste à vérifier », « La prochaine décision utile », puis seulement les suites. Contenu personnalisé par la priorité courante. Ne pas inventer un budget, une maturité, une disponibilité, une compatibilité ou un seuil de marché.

Mouaad apparaît au point de responsabilité humaine dans la lecture, avec le portrait réel utilisé par les sources actives /images/levois-mouaad.webp. Apport : relire les points ouverts, rapprocher le projet du terrain, distinguer ce qui demande une vérification. Pas d’avatar fictif. Pas de délai chiffré.

Actions distinctes : « Garder cette lecture » (fichier texte local réel) ; « M’envoyer cette synthèse sans appel » (aperçu explicite, aucun envoi) ; « Demander à Mouaad de relire » (relecture humaine écrite, ciblée, pas d’appel automatique) ; « Échanger avec Mouaad ». Dialogues des trois dernières actions : simulation locale clairement indiquée, aucune transmission ni conservation de coordonnées. Retour et correction conservent seulement les réponses anonymes dans la session de l’onglet. Aucune conservation commerciale, CRM, durée distante ou relance.

## Contrat technique pour les trois rendus

Chaque dossier possède index.html, style.css, app.js. Importer { boot, C, icon } depuis ../shared/experience.js. Appeler boot({ direction: 'ligne-claire' | 'plan-vivant' | 'a-portee', render: (state, C) => `HTML` }). Le conteneur principal est #app. Le runtime fournit l’état : screen, priority (calme/recevoir/dehors), visit (commun/divers/inconnu ou vide), confirmed, revision. C expose home, visit, priorities, examples, reading(state), visitResult(value). Les polices et images existantes sont servies avec leurs chemins /fonts/..., /images/..., /brand/.... N’utiliser aucun actif d’un autre worktree. L’illustration de quartier n’est pas une photographie ni une carte réelle.

Interactions déléguées par le runtime : data-action="navigate" data-screen="accueil|visites|recherche|lecture|transition|local" ; data-action="priority" data-value="calme|recevoir|dehors" ; data-action="visit" data-value="commun|divers|inconnu" ; data-action="focus-impact" dirige le focus vers #impact et ajoute la classe impact-pulse ; data-action="confirm" conserve la priorité et ouvre lecture ; data-action="correct" retourne à recherche ; data-action="save" télécharge ; data-action="copy|reread|exchange" ouvre un dialogue commun stylable ; data-action="question" ouvre la suite utile de la micro-expérience ; data-action="reset" réinitialise cet exemple. Le rendu fournit un seul h1 et un #impact tabindex="-1" sur recherche et sur résultat visite. Utiliser de vrais boutons, états aria-pressed, headings et focus visibles.

Chaque document HTML contient un petit bandeau explicite « Exploration · [nom] » et un lien ../ vers le comparateur. Le bandeau est séparé du produit ; le produit ne raconte pas sa technique. Une navigation de preuve discrète avec les quatre écrans peut figurer dans le bandeau. La page doit rester utilisable en accès direct et conserver screen dans l’URL. Sur desktop, exploiter l’espace en composition ouverte, pas en tableau de bord.

Le runtime gère navigation, session uniquement, téléchargement, dialogues, conservation du scroll lors des sélections, focus utile, retour navigateur, signal d’état pour le comparateur. Chaque direction invente sa matérialisation visuelle de la conséquence sans en modifier le sens. Respecter prefers-reduced-motion. Aucun chargement simulé. Aucune librairie lourde.

## Répartition créative

La Ligne claire : une lecture éditoriale annotée, papier très clair #f7f5ef, encre #202c33, vermillon #ae412c ; Georgia titres / Public Sans corps, logo existant ; filets, marges, fragments numérotés, correction comme annotation remplacée. Photos rares, portées par une légende. Desktop question et glose, lecture en grandes colonnes éditoriales. Pas de grille de cartes.

Le Plan vivant : le projet comme une composition qui se précise, fond blanc #ffffff, cobalt #2545df, encre #111a30, orange #f47b20 ; Satoshi, titres plus géométriques, contrastes d’échelle ; plans ouverts, connexions sobres, aplats nets ; la réponse déplace le point d’attention dans la comparaison. Pas de néon, gradient, grille de tableau de bord ou assistant IA. Desktop deux champs composés, lecture de gauche à droite.

À portée : une décision ancrée dans la vie ordinaire, calcaire #f3f0e8, pin #264b42, terre #a44029 ; Bricolage Grotesque titres / Satoshi corps ; cadrage ample de l’illustration locale existante, sans la présenter comme preuve géographique. Choix en rubans, repères sensibles mais précis, conséquence comme un feuillet qui s’ouvre. Desktop image et récit puis comparaison en table ouverte. Mouaad présent au passage humain seulement.

Ces éléments sont des concepts de travail, pas un choix de l’utilisateur. Chaque auteur produit d’abord une planche conceptuelle avec l’outil imagegen intégré et l’inspecte, puis le prototype codé. Sauvegarder concept et prompt dans concepts/. Les captures de navigateur seront les preuves définitives de fonctionnement, les images générées étant des intentions de composition.
