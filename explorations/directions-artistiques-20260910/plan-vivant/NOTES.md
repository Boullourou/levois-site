# Le Plan vivant

## Point de vue

La décision prend une forme. Un choix ne déclenche pas un commentaire détaché : il déplace un point d’attention dans une comparaison déjà visible. Le blanc laisse lire, le cobalt met en relation, l’orange désigne l’endroit à regarder. L’expérience garde un rythme digital et spatial, distinct d’un dossier éditorial à empattements et d’un récit chaleureux de quartier.

## Système extrait de la planche avant code

- **Typographie** : Satoshi 400/500/700 du dépôt. Titres géométriques, forte différence d’échelle, interlettrage serré ; textes et commandes restent modérés. Mot-symbole SVG LEVOIS existant.
- **Couleurs** : blanc véritable #ffffff ; encre #111a30 ; cobalt #2545df ; orange #f47b20. Pas de gradient ni de néon. Les plans ont une surface cobalt pâle pour rendre un espace repérable, jamais pour attribuer un score.
- **Composition** : accueil en lignes ouvertes ; questions et comparaison en deux champs sur desktop ; plans comparables côte à côte ; restitution verticale numérotée, avec titre dans une marge gauche sur grand écran. Pas de tableau de bord ni de cartes imbriquées.
- **Espacement** : marges mobiles 24 px (20 px à 320), boutons 56–59 px ; filets fins ; lignes de texte bornées. Le contenu peut s’allonger sans hauteur d’écran imposée.
- **Images** : architecture générée, déclarée fictive, sans filtre permanent ; production autonome depuis la planche, jamais planche découpée en interface. Portrait réel /images/levois-mouaad.webp seulement après la restitution. Aucune photo d’un logement fictif.
- **Données et plans** : comparaison A/B immuable du contrat ; schémas SVG informatifs explicitement non à l’échelle. Les deux espaces pertinents sont repérés, un trait accompagne le critère discriminant. A et B ne sont jamais présentés comme des biens disponibles ni comme un choix conseillé.
- **Icônes** : icônes linéaires du socle partagé, flèche de suite, coche de sélection, crayon de correction, téléchargement. Pas d’icône décorative multipliée.
- **Choix** : sélection en encre, coche et point orange ; le changement actualise le texte partagé et le plan. Une priorité non choisie n’est jamais déclarée abandonnée.
- **Incertitudes** : texte lisible au voisinage de la conséquence, aucune note critique exclusivement masquée. Retour de visite inconnu = une question utile à construire.
- **Mouvement** : le bouton signature conduit à #impact et marque brièvement le lieu de lecture ; la conséquence et les limites sont déjà présentes. Pas d’attente ni de chargement simulé. Réduction des mouvements respectée.
- **Mouaad** : une responsabilité personnelle reconnaissable, pas un assistant incarné. Relecture écrite ciblée puis échange restent deux actions ; copie sans appel et conservation locale sont également distinctes.

## Écrans et fonctionnement

Les quatre états principaux et leurs déclinaisons desktop utilisent le runtime partagé. Deux aperçus brefs ouvrent transition et repères locaux. Le bandeau d’exploration est extérieur au produit, avec accès au comparateur et aux quatre états. Le menu utilise une disclosure native. Les boutons ont des actions réelles ; les sorties réseau sont des dialogues de prévisualisation locale, conformément au contrat.

`priority`, `visit`, `confirmed`, `revision` et `screen` viennent du runtime. La direction n’écrit ni backend ni analytics et ne collecte aucune coordonnée. La lecture se télécharge réellement en texte ; les autres sorties indiquent qu’aucun envoi n’est effectué.

## Force, faiblesse et risques

**Force** : comprendre la différence entre quantité et usage à partir de deux objets visibles. La forme montre le rôle de la réponse au lieu de simplement l’affirmer. Le dispositif donne une personnalité forte avec peu d’éléments.

**Faiblesse** : la représentation spatiale est particulièrement convaincante pour l’usage du logement ; elle doit rester sobre dans les décisions où un plan n’apporte rien. Les écrans vendeur utilisent donc une relation choix → conséquence et la lecture une ligne de raisonnement.

**Risque de perception** : l’architecture blanche/cobalt pourrait évoquer une offre immobilière ou un studio d’architecture. Les légendes la qualifient comme illustration ; aucun bien disponible ni maîtrise architecturale professionnelle n’est revendiqué. Un plan plus bleu ne signifie pas un logement meilleur.

**Risque de lisibilité** : les deux plans deviennent petits à 320 px. Les caractéristiques décisives sont donc aussi écrites en HTML et ne dépendent pas de la lecture du dessin. Les textes longs des réponses réelles priment sur la compacité de la planche.

**Vidéo** : le principe de point d’attention permet un raccord visuel immédiat entre la question d’une vidéo et l’expérience. La page commence par la valeur promise ; aucun contenu vidéo n’est produit dans cette preuve.

**Échelle** : réutiliser les champs ouverts, les choix, la conséquence, la limite et la ligne de restitution. Créer un plan uniquement si le sujet le justifie ; ne pas transformer chaque décision en illustration géométrique ni multiplier des moteurs.

## Fidélité et différences intentionnelles

La planche conceptuelle a été inspectée avec view_image avant code ; l’actif architectural aussi. Cinq repères structurants sont repris : fond blanc/cobalt ; échelle et poids des titres ; accueil par lignes ouvertes ; comparaison A/B en plans liés à un critère ; lecture numérotée suivie du passage humain.

Le contrat partagé est prioritaire sur le texte d’intention généré : formulations exactes de C, limites plus complètes, transparence sur les exemples, portrait réel et toutes les suites obligatoires sont conservés. Les petites phrases décoratives ajoutées par l’image ne sont pas reprises. Les dessins des logements sont des schémas de principe et non la transcription d’une distribution architecturale créée par l’image.

### Registre de fidélité — passe du 10 septembre 2026

La planche `../concepts/plan-vivant.png` et les captures navigateur réactualisées dans `../preuves/` ont été ouvertes avec `view_image` dans la même passe, après les corrections. La planche de 1254 × 1254 contient plusieurs compositions ; elle ne correspond pas à un viewport unique du produit. Les vérifications portent donc sur les surfaces réelles à 390 × 844, 320 × 844 et 1440 × 1000, avec captures complètes des écrans mobiles.

| Point inspecté | Preuve dans le concept | Preuve du rendu et décision |
| --- | --- | --- |
| Couleur et lumière | Blanc net, cobalt, encre, petit point orange ; architecture sans filtre | `plan-vivant-accueil-390-complet.png` : même distribution, blanc préservé. Aucun gradient, filtre coloré ou fond crème ajouté. |
| Typographie et chrome | Titres sans empattements très présents ; menu discret ; flèches linéaires | Titres Satoshi du dépôt, géométriques ; logo existant conservé. H1 recherche ramené à environ 36 px à 390 et 33 px à 320 pour rendre la première conséquence visible. Bandeau extérieur au produit : commandes de 44 × 44 px minimum et texte de 12 px. |
| Accueil et contenants | Trois entrées ouvertes, filets fins, image architecturale sous les entrées | `plan-vivant-accueil-390-complet.png` : mêmes trois lignes et lien local avant l’illustration ; pas de cartes empilées. L’image autonome diffère dans ses volumes, mais garde les plans blancs/cobalt, l’arbre et le point orange. |
| Choix vendeur et relation | Réponse sélectionnée en encre ; connecteur vers une conséquence ; limite visible | `plan-vivant-visites-390-complet.png` : relation immédiatement sous les réponses. Le texte complet du contrat prime sur la formulation raccourcie de la planche. Aucune déduction automatique de prix. |
| Première valeur acquéreur | Choix, plans, conséquence dans le concept initial | La première passe rejetait la conséquence vers 1100 px sur mobile. `plan-vivant-recherche-390.png` montre désormais son énoncé complet vers 726–803 px, avant les plans. À 320, il reste entièrement visible dans les 844 premiers pixels. L’ordre a été corrigé en QA : conséquence, justification/limites, puis preuves spatiales. |
| Plans et signature | Deux plans A/B ; un espace repéré par un point et un trait | `plan-vivant-recherche-390-complet.png` et `plan-vivant-recherche-1440.png` : comparaison côte à côte, donnée immuable, zone fonctionnelle actualisée avec la priorité. Dessins SVG explicatifs et non à l’échelle, avec faits HTML lisibles aussi à 320. Aucune fidélité à une distribution architecturale réelle n’est revendiquée. |
| Lecture et Mouaad | Ruban de priorité ; cinq points numérotés ; suites puis passage humain | `plan-vivant-lecture-390-complet.png` et `plan-vivant-lecture-1440.png` : ordre complet conservé, correction accessible, portrait réel ajouté. Sur desktop, le passage humain reste après les cinq points et les actions de conservation. |
| Textes visibles et limites | Titres et CTA communs ; certains textes raccourcis ou décoratifs produits par l’image | Les titres, réponses, conséquences, limites et CTA du contrat sont conservés dans C. Les phrases décoratives de l’image sont omises. Le bandeau de comparaison, les légendes de fiction, l’accès à la correction et les mentions de simulation sont des ajouts explicites de la preuve. |
| Transition | Pas de composition détaillée dans la planche | Aperçu borné fondé sur C.transition. Numéros 01/02/03 supprimés pour ne pas suggérer un ordre vente/achat acquis ; une phrase rend cette indétermination visible. |

L’illustration de bord droit du desktop acquéreur n’est pas reprise : la largeur est consacrée aux deux exemples et à leur explication. L’architecture porte l’accueil et accompagne certains écrans desktop ; elle n’est pas ajoutée aux conséquences là où elle n’aide pas à comprendre. Les textes plus complets, la correction et les limites expliquent des pages plus longues que les vignettes d’intention.

### Vérification

Le parent a ouvert et manipulé les prototypes avec IAB via `cua_repl` ; pour Le Plan vivant, cela inclut l’entrée vendeur après vidéo et la réponse « Je n’ai pas de retour précis ». Les captures reproductibles et assertions à plusieurs tailles viennent de `verify.mjs` avec Playwright local : ce complément enregistre les preuves sur disque et répète les scénarios, alors que l’API IAB utilisée ne propose pas de destination de capture sur disque. L’agent de cette direction a inspecté directement les fichiers par `view_image`.

`node --check` réussit sur `app.js`. Le rapport navigateur `../preuves/plan-vivant-verification.json`, consulté dans cette passe, couvre 17 combinaisons d’écran et de largeur : aucune erreur JavaScript, assertion échouée, requête réseau externe, violation axe ou cible de bouton trop petite détectée. Ces résultats sont ceux de la passe QA automatisée coordonnée par le parent ; ils ne constituent pas un test d’usage humain ni une certification d’accessibilité. Aucun téléphone physique n’a été testé.

La fidélité à la direction conceptuelle a été vérifiée visuellement sur les points ci-dessus, avec les écarts intentionnels consignés. Le toast vide visible sur les premières captures a été corrigé dans le socle partagé par le parent, puis sa disparition a été constatée sur les captures réactualisées. Aucun score arbitraire de fidélité ou de préférence utilisateur n’est revendiqué.
