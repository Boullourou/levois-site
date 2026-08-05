---
name: "LEVOIS"
description: "Mise au point — un système éditorial franc qui rend les signaux immobiliers lisibles des deux côtés du marché."
colors:
  paper-mineral: "#f2f5ef"
  white: "#ffffff"
  ink-deep: "#111522"
  ink-soft: "#202635"
  cobalt: "#243cff"
  lime: "#d7ff42"
  terracotta: "#a84531"
  structural-line: "#c9cec8"
  muted: "#58615b"
  muted-on-ink: "#d5dad4"
typography:
  display:
    fontFamily: "Archivo Black, sans-serif"
    fontSize: "clamp(56px, 7vw, 96px)"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "-0.035em"
  wordmark:
    fontFamily: "Archivo Black, sans-serif"
    fontSize: "clamp(24px, 2.2vw, 34px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "clamp(42px, 5.5vw, 76px)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "clamp(28px, 3vw, 42px)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  lead:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "clamp(18px, 1.65vw, 22px)"
    fontWeight: 400
    lineHeight: 1.58
    letterSpacing: "normal"
  body:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "normal"
rounded:
  sharp: "0px"
spacing:
  micro: "4px"
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "30px"
  xl: "38px"
  page-edge: "clamp(22px, 5vw, 76px)"
  section-y: "clamp(80px, 9vw, 138px)"
components:
  home-header:
    backgroundColor: "{colors.paper-mineral}"
    textColor: "{colors.ink-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.sharp}"
    padding: "0 clamp(22px, 5vw, 76px)"
    height: "78px"
  route-light:
    backgroundColor: "{colors.paper-mineral}"
    textColor: "{colors.ink-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.sharp}"
    padding: "15px 20px"
    height: "82px"
  route-light-hover:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink-deep}"
  route-dark:
    backgroundColor: "{colors.ink-deep}"
    textColor: "{colors.paper-mineral}"
    typography: "{typography.body}"
    rounded: "{rounded.sharp}"
    padding: "15px 20px"
    height: "82px"
  route-dark-hover:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.paper-mineral}"
  story-facts:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.paper-mineral}"
    typography: "{typography.title}"
    rounded: "{rounded.sharp}"
    padding: "clamp(24px, 3vw, 42px)"
  story-market:
    backgroundColor: "{colors.ink-soft}"
    textColor: "{colors.paper-mineral}"
    typography: "{typography.title}"
    rounded: "{rounded.sharp}"
    padding: "clamp(24px, 3vw, 42px)"
  story-decision:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink-deep}"
    typography: "{typography.title}"
    rounded: "{rounded.sharp}"
    padding: "clamp(24px, 3vw, 42px)"
  principle-cell:
    backgroundColor: "{colors.paper-mineral}"
    textColor: "{colors.ink-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.sharp}"
    padding: "15px clamp(22px, 5vw, 76px)"
    height: "66px"
  method-row:
    backgroundColor: "{colors.paper-mineral}"
    textColor: "{colors.ink-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.sharp}"
    padding: "30px clamp(28px, 5vw, 68px)"
  method-row-emphasis:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink-deep}"
  proof-metric:
    backgroundColor: "{colors.paper-mineral}"
    textColor: "{colors.ink-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.sharp}"
    padding: "19px 18px"
  home-footer:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.sharp}"
    padding: "28px clamp(22px, 5vw, 76px)"
    height: "132px"
---

# Design System: LEVOIS

## Overview

**Creative North Star: "Mise au point"**

LEVOIS emprunte au geste de calibration : un papier minéral posé à plat, une encre profonde qui fixe la structure, puis des aplats cobalt et lime qui isolent un signal jusqu’à le rendre évident. Le système doit paraître direct, précis et contemporain, avec la franchise d’une feuille de travail éditoriale plutôt que les codes aspirationnels de l’immobilier.

La composition traite acheteurs et vendeurs comme les deux lectures d’un même marché. Les grilles partagées, les actions jumelles et les séquences fait → perception → décision rendent cette égalité visible sans dépendre d’un discours commercial. La terre cuite intervient seulement comme contrepoint humain, local ou prudent.

Le monde visuel est plat, structuré et volontaire : grands caractères, aplats francs, lignes utiles, photographie pleine surface et mouvement explicatif. Il rejette les gradients, les ombres décoratives, les cartes génériques et les symboles immobiliers convenus.

**Key Characteristics:**

- Grilles bilatérales et lignes structurelles qui rendent les relations visibles.
- Typographie massive mais disciplinée, réservant Archivo Black au mot-symbole et au héros.
- Cobalt analytique, lime décisif et terre cuite employée comme accent mineur.
- Profondeur produite par l’adjacence des aplats, jamais par une ombre décorative.
- Mouvement informatif sur ordinateur, contenu complet et statique sur mobile ou en réduction de mouvement.

## Colors

La palette oppose un fond minéral calme à des couleurs de calibration très franches ; chaque accent porte une fonction lisible.

### Primary

- **Cobalt de calibration** (#243cff): isole l’analyse, la méthode, les transitions de lecture et les états actifs à forte intensité.

### Secondary

- **Lime de décision** (#d7ff42): marque une conclusion, une progression aboutie, un survol positif ou une zone de sortie claire.

### Tertiary

- **Terre cuite locale** (#a84531): signale l’humain, le territoire ou une limite à lire avec attention ; elle reste un accent mineur.

### Neutral

- **Papier minéral** (#f2f5ef): surface principale, contrechamp calme et texte clair sur les aplats sombres.
- **Blanc net** (#ffffff): surface ponctuelle autour de la présence humaine et texte sur terre cuite.
- **Encre profonde** (#111522): texte principal, structure, cadres et grands aplats sombres.
- **Encre assouplie** (#202635): état intermédiaire entre fait et décision dans le récit.
- **Ligne minérale** (#c9cec8): séparateurs secondaires et maintien de la structure lorsque l’encre serait trop forte.
- **Gris de contexte** (#58615b): métadonnées, limites, source et informations de second niveau sur fond clair.
- **Brume sur encre** (#d5dad4): texte secondaire lisible sur les surfaces sombres.

### Named Rules

**The Calibration Rule.** Le cobalt et le lime doivent faire comprendre un état, une étape ou une décision ; ils ne servent jamais à remplir un vide décoratif.

**The Terracotta Counterpoint Rule.** La terre cuite reste rare et attachée à l’humain, au local ou aux limites ; sa rareté lui donne son autorité.

## Typography

**Display Font:** Archivo Black (avec `sans-serif` en repli)
**Body Font:** Public Sans (avec `system-ui, sans-serif` en repli)

**Character:** Archivo Black produit une promesse compacte, frontale et mémorable. Public Sans apporte ensuite la précision, la continuité et la neutralité nécessaires à une lecture factuelle.

### Hierarchy

- **Display** (400, `clamp(56px, 7vw, 96px)`, 0.9): titre héro uniquement, très serré et composé sur peu de lignes.
- **Wordmark** (400, `clamp(24px, 2.2vw, 34px)`, 1): signature LEVOIS dans l’en-tête et le pied de page.
- **Headline** (800, `clamp(42px, 5.5vw, 76px)`, 0.98): titres de sections majeures en Public Sans, denses mais nettement distincts du héros.
- **Title** (700, `clamp(28px, 3vw, 42px)`, 1.02): états du récit et messages structurants à l’intérieur d’un aplat.
- **Lead** (400, `clamp(18px, 1.65vw, 22px)`, 1.58): explications de premier niveau, limitées à une largeur confortable de lecture.
- **Body** (400, 16px, 1.55): texte courant, descriptions et arguments explicatifs.
- **Label** (500, 12px, 1.35): rôles, territoire, sources et métadonnées ; la casse reste naturelle.

### Named Rules

**The Two-Voice Rule.** Archivo Black est réservé au mot-symbole LEVOIS et au titre héro ; tous les autres titres, textes, contrôles et données utilisent Public Sans.

## Layout

La grille est éditoriale et bord à bord. La marge horizontale suit `clamp(22px, 5vw, 76px)` et les grandes sections respirent sur un rythme vertical proche de `clamp(80px, 9vw, 138px)`. Le héros partage l’écran entre une promesse et un mécanisme de lecture ; les sections suivantes alternent deux colonnes, rangées structurées et médias pleine hauteur. Les divisions sont matérialisées par des lignes de 1px, tandis que les deux parcours sont réunis dans un cadre d’encre de 2px avec un interstice de 2px.

Sur grand écran, le récit est sticky sous un en-tête de 78px et sa progression accompagne le défilement. À 980px et moins, les grilles majeures s’empilent, l’en-tête passe à 104px et le récit devient entièrement statique. À 620px et moins, la marge devient 20px, les deux parcours s’empilent sans changer de hiérarchie et les rangées complexes passent à une colonne. Le pied de page se réorganise à 820px et la preuve chiffrée à 1100px.

**The Equal Weight Rule.** Toute double entrée acheteur/vendeur conserve des dimensions, une présence et une proximité identiques ; la couleur distingue les chemins sans établir de priorité.

**The Complete Static Rule.** Le mouvement enrichit la lecture sur grand écran, mais chaque information et chaque état restent visibles sans animation sur mobile et avec `prefers-reduced-motion`.

## Elevation & Depth

Le système n’utilise aucune ombre. La profondeur vient de la juxtaposition des aplats, des cadres d’encre, des lignes de séparation, des changements d’échelle typographique et du recadrage photographique. La légère translucidité et le flou de 12px de l’en-tête sticky servent uniquement à préserver sa lisibilité pendant le défilement ; ils ne deviennent pas un effet de surface réutilisable.

### Named Rules

**The Flat-by-Default Rule.** Une surface reste plate à tous ses états ; les changements de couleur, de ligne et de position racontent la hiérarchie sans ombre ni gradient.

## Shapes

La forme de base est le rectangle franc à angles droits (rayon 0px). Les cellules, contrôles, panneaux et légendes s’assemblent bord à bord ; la silhouette naît de la grille, pas d’un rayon de carte. Les flèches sont construites avec un trait horizontal et une pointe géométrique, et les marqueurs d’étape sont de courtes lignes qui s’allongent lorsque l’état devient actif. Les photographies restent rectangulaires, recadrées en pleine surface et accompagnées d’une légende en aplat.

**The Structural Line Rule.** Chaque ligne doit séparer, relier, mesurer ou signaler une progression ; aucune ligne n’est ajoutée comme ornement autonome.

## Components

Les composants ont une présence tactile et précise : grandes zones d’action, contrastes francs, angles droits et états exprimés par la couleur plutôt que par un effet de relief.

### Buttons

- **Shape:** sélecteurs de parcours rectangulaires (rayon 0px), réunis dans un cadre de 2px et hauts d’au moins 82px sur grand écran.
- **Primary / Acheteur:** papier minéral sur encre, avec 15px × 20px de padding ; le survol passe au lime.
- **Primary / Vendeur:** encre sur papier minéral, avec les mêmes dimensions ; le survol passe au cobalt.
- **Focus:** contour cobalt de 3px décalé de 4px ; la variante sombre utilise le lime pour rester visible.
- **Internal structure:** rôle en 12px, action en 15px semi-gras et flèche linéaire de 29px.

**The Bilateral Control Rule.** Les contrôles acheteur et vendeur sont toujours conçus, placés et testés comme une paire indissociable.

### Navigation

L’en-tête sticky garde le mot-symbole à gauche, trois ancres centrées et le territoire à droite. Les liens ont une cible minimale de 44px et se soulignent au survol ; à 980px, les trois ancres occupent une rangée complète de largeur égale. Le mot-symbole reste en Archivo Black, tout le reste en Public Sans.

### Story Stages

Les trois étapes sont de grandes rangées structurelles : cobalt pour les faits, encre assouplie pour la perception du marché, lime pour la décision. Sur ordinateur, un aplat se révèle de gauche à droite et la courte ligne d’état s’allonge ; en mode statique, les trois aplats et leurs textes sont immédiatement visibles.

### Principle, Method & Proof Rows

Le rail de principes aligne trois cellules égales de 66px minimum. La méthode emploie trois rangées avec libellé et résultat, la dernière étant entièrement lime. La preuve DVF utilise des cellules chiffrées séparées par des lignes d’encre ; les libellés restent discrets et les valeurs dominantes.

### Cards / Containers

Il n’existe pas de carte générique dans ce monde. Les conteneurs sont des régions de page bord à bord, définies par un aplat, une ligne ou une photographie pleine surface, sans rayon ni ombre.

### Footer

Le pied de page est un aplat lime de 132px minimum qui rassemble marque, contacts et mentions dans trois colonnes. Il passe à deux colonnes à 820px puis à une colonne à 520px ; ses liens épaississent simplement leur soulignement au survol.

## Do's and Don'ts

### Do:

- **Do** donner exactement le même poids visuel aux parcours acheteur et vendeur.
- **Do** réserver Archivo Black au mot-symbole et au titre héro, puis utiliser Public Sans partout ailleurs.
- **Do** employer le cobalt, le lime et la terre cuite pour exprimer une fonction ou un changement de lecture.
- **Do** construire la hiérarchie avec des aplats, des lignes structurelles, des échelles typographiques et des images pleine surface.
- **Do** livrer une version statique complète dès que le défilement piloté ou les transitions sont réduits.

### Don't:

- **Don't** utiliser de gradient, d’ombre décorative, de verre décoratif ou de carte générique.
- **Don't** transformer la terre cuite en couleur dominante ni multiplier les accents dans une même zone.
- **Don't** employer Archivo Black pour les titres de section, le corps, les contrôles ou les données.
- **Don't** représenter l’immobilier avec une maison, un toit, une clé, une poignée de main ou un luxe beige-or générique.
- **Don't** cacher une information essentielle derrière une animation, une couleur seule ou un état interactif.
