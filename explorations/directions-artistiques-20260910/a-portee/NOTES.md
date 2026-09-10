# À portée

## Idée

Une décision immobilière se construit à hauteur de vie. Le ruban est un choix à portée de main ; le feuillet rassemble ce que ce choix permet de comprendre. Le voisinage illustré rend sensible un lieu de vie sans le faire passer pour une preuve géographique. La présence humaine intervient lorsque la lecture atteint une question à vérifier.

Cette exploration possède sa composition, son HTML de rendu et ses styles. Elle utilise le socle commun uniquement pour les textes, les conséquences, la navigation, l’état de session et les actions de conservation. Aucun fichier de production n’est modifié.

## Système visuel

- Fond calcaire `#f3f0e8`, feuillet `#fbfaf6`, texte pin `#264b42`, accents terre `#a44029`, rubans `#e8e4d9`. Pas de gradient ni voile coloré sur les images.
- Titres en **Bricolage Grotesque**, poids 600–650, espacement resserré, corps en **Satoshi**. Les deux familles sont les fichiers locaux du worktree. Le logo actuel est conservé, avec ses empattements propres ; les titres et boutons n’en ont pas.
- Marges mobiles de 22 px, 18 px à 320 px. Les titres se recomposent, le texte reste libre de grandir. Les boutons structurants mesurent au moins 51–60 px de haut ; les liens d’action au moins 44 px.
- Trois familles : rubans de réponse ; feuillet à bord terre avec coin plié ; comparaison en table ouverte. Aucun empilement de cartes indépendantes ni tableau de bord.
- Les flèches, le signe de correction et le téléchargement utilisent les icônes du socle. Le signe de sélection indique un choix de question ; il ne certifie pas un logement.

## Images et données

`/images/levois-quartier-1672.webp` a été inspecté avant usage. À l’accueil et dans l’aperçu local, il est recadré sur les maisons et jardins sans filtre. Sa légende le qualifie d’illustration, pas de carte. Les bâtiments ne représentent aucun bien disponible. La comparaison acquéreur ne réutilise pas cette image pour prétendre représenter les logements A et B : elle reste une comparaison textuelle de deux cas fictifs.

`/images/levois-mouaad.webp` a été inspecté avant usage. Son identité et ses proportions sont conservées. Il apparaît dans la lecture au point du relais humain, pas comme vendeur imposé à l’accueil. Le portrait constitue une présence identifiable, pas une preuve d’ancienneté ou de résultats.

Les surfaces des deux exemples restent identiques entre les choix : A, 92 m², pièce indépendante, séjour compact et jardin de 35 m² ; B, 105 m², bureau dans le séjour, séjour ouvert et balcon de 6 m². Aucune donnée de prix ou de disponibilité n’est ajoutée. Changer de priorité modifie le critère à examiner, son explication et la lecture, jamais les faits des logements.

## Choix, incertitude et mouvement

Les rubans se lisent avant leur sélection. La couleur pin indique la réponse active. Le critère concerné se marque dans la table et le point à examiner reçoit un soulignement terre. La conséquence reste visible sans cliquer la signature : « Voir ce que cette réponse change » y dirige le focus et le regard. Le feuillet bouge brièvement à ce moment seulement, sans masquer le contenu ni introduire de chargement fictif. Le mouvement est supprimé pour `prefers-reduced-motion`.

La réponse « Je n’ai pas de retour précis » débouche sur une prochaine question utilisable, pas sur un échec. Les limites accompagnent la conséquence. Dans la recherche, les trois usages demeurent ouverts ; l’absence de sélection ne devient pas une concession. Les cinq blocs de la lecture sont dans l’ordre du contrat.

## Mouaad et conservation

La lecture propose successivement la correction, le fichier texte réel et l’aperçu d’une copie sans appel. Mouaad peut relire les points ouverts, rapprocher le projet du terrain et distinguer les vérifications. La relecture écrite et l’échange direct sont deux actions distinctes. Les dialogues sont explicitement des simulations locales : ni coordonnées collectées, ni soumission réseau, ni relance, ni délai promis. L’état de projet anonyme reste dans la session de l’onglet via le socle commun. Sur desktop également, le relais humain forme une bande sous le document et ses cinq blocs : il n’est pas une sollicitation affichée à droite dès l’entrée dans la restitution.

## Forces, limites et risques

**Forces.** Identité chaleureuse immédiatement différente des deux autres directions ; continuité claire entre geste de choix et conséquence ; illustration réellement disponible ; tableau factuel qui évite de déguiser les exemples en annonces ; traduction desktop ouverte plutôt qu’un mobile agrandi.

**Limites.** L’image d’accueil occupe une part importante du premier écran. La lecture exacte contient davantage de texte que la planche conceptuelle : elle exige un défilement sur mobile. La matérialité du papier doit rester sobre pour ne pas réduire la sensation de rigueur.

**Risques à vérifier.** Le coin de feuillet peut paraître décoratif s’il ne reste pas associé à une conséquence. Le soulignement d’un attribut ne doit pas être perçu comme une recommandation de logement. L’image miniature peut évoquer un territoire trop idéalisé ; la légende reste donc visible et n’est jamais reléguée dans une infobulle.

## Vidéos et croissance

Une arrivée après vidéo ouvre la question « Des visites, mais aucune offre ? » et sa première distinction directement, sans rejouer l’accueil ni simuler un lecteur vidéo. La signature peut se retrouver dans les vidéos comme mouvement de ruban puis de feuillet, avec la même fonction : rendre une conséquence intelligible.

Le système peut croître par situations et par feuillets de décision. Les titres conservent leur respiration ; les listes de faits restent comparables. La future densité ne doit pas mener à ajouter des rubans pour chaque micro-paramètre ni à transformer le feuillet en longue fiche opaque. Les aperçus local et transition montrent l’extension de la direction sans prétendre livrer ces parcours complets.

## Planche, code et vérification

Planche finale : `../concepts/a-portee.png`, générée avec imagegen intégré et inspectée avec `view_image`. Prompt complet et correction typographique : `../concepts/a-portee-prompt.md`. Le premier essai à empattements a été rejeté ; il reste uniquement comme trace dans `a-portee-v1.png`.

Le code applique les contenus communs exacts lorsque la planche a abrégé un texte. Il conserve le logo vectoriel réel plutôt que le mot « LEVOIS » approximé par la génération. Il remplace également les légers effets photographiques de la planche par les aplats explicitement demandés. Ces différences sont intentionnelles et nécessaires au contrat, pas de nouvelles fonctionnalités.

Contrôle statique effectué : syntaxe JavaScript valide (`node --check`). Contrastes calculés : pin/calcaire 8,51:1 ; terre/calcaire 5,51:1 ; texte secondaire/calcaire 5,57:1 ; texte clair/bouton terre 6,04:1.

Les premières captures du navigateur ont été inspectées avec `view_image`, en plus de la planche retenue : accueil 390/1440 ; recherche 390 complet/320/1440 ; lecture 390 complet/1440 ; visites 390 complet ; aperçus local et transition 390 complet. Le registre QA du parent distingue les observations, erreurs, images et contrôles automatiques. La comparaison ne s’appuie pas sur des captures historiques du site.

| Point de fidélité | Constat et décision |
|---|---|
| Couleurs | Calcaire, pin et terre identiques aux tokens du brief ; pas de gradient ajouté. |
| Typographie | Bricolage et Satoshi réels ; premier concept serif corrigé avant codage. La coupure du titre d’accueil a été ajustée pour séparer les deux phrases. |
| Choix | Rubans pointus, état sélectionné pin, marque de réponse ; hiérarchie et géométrie conformes à l’intention. Les petites cibles de logo, menu de preuve et footer ont été portées à 44 px après le premier contrôle. |
| Conséquence | Feuillet à bord terre et coin plié ; conséquence avant table. Le texte commun intégral remplace les abrégés de la planche et accroît la hauteur de page. |
| Comparaison | Table ouverte, mêmes dimensions pour les deux logements, ligne concernée mise en évidence, aucune carte d’annonce fabriquée. |
| Images | Quartier existant sans filtre et avec légende ; portrait réel dans la seule lecture. Le cadrage réel conserve davantage de contexte que la petite vignette conceptuelle. |
| Desktop | Accueil spatial image/récit ; recherche en deux champs ; lecture séquentielle et relais humain sous le document. Le relais placé initialement à droite a été déplacé pour respecter l’ordre de responsabilité. |
| Copie visible | Les quatre titres, réponses et signatures viennent de C. Les légendes et phrases d’orientation sont des ajouts limités de composition ; aucune valeur immobilière ni garantie ajoutée. Le logo réel remplace la transcription approximative de la planche. |

La passe finale du registre `../preuves/a-portee-verification.json` (10 septembre, 09:38 UTC) relève zéro erreur de page, zéro panne enregistrée, zéro requête sortante, zéro cible de bouton inférieure au seuil du contrôle et aucune violation axe sur les états testés. Les captures finales accueil 320/390/1440, recherche 390 complet et lecture 390 complet ont été revues avec `view_image` dans la même passe que la planche retenue : coupures de titre confirmées, cibles agrandies et barre de statut vide absente. La comparaison concept/rendu ne présente plus de défaut matériel identifié ; les différences intentionnelles sont décrites dans le registre ci-dessus. Cette vérification circonscrite n’est ni un test utilisateur ni une certification d’accessibilité.
