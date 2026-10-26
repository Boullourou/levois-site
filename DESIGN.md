---
name: LEVOIS — Ivoire et encre
description: Une lecture immobilière claire, des choix explicites et une présence humaine discrète.
colors:
  ink: "#141413"
  ink-hover: "#343330"
  door-hover: "#2C2D29"
  paper: "#F7F6F2"
  surface: "#FAF9F6"
  white: "#FFFFFF"
  body: "#3C3D3A"
  muted: "#5A5D58"
  line: "#dcd9d2"
  card-line: "rgba(20, 20, 20, .05)"
  control-line: "rgba(20, 20, 20, .12)"
  selected: "#eeece7"
  accent: "#9a4313"
  accent-hover: "#76340f"
typography:
  display: {fontFamily: "Satoshi, sans-serif", fontSize: "clamp(36px, 4.6vw, 66px)", fontWeight: 500, lineHeight: 1.1, letterSpacing: "-0.035em"}
  headline: {fontFamily: "Satoshi, sans-serif", fontSize: "clamp(26px, 3.2vw, 40px)", fontWeight: 500, lineHeight: 1.25, letterSpacing: "-0.025em"}
  question: {fontFamily: "Satoshi, sans-serif", fontSize: "clamp(28px, 2.7vw, 38px)", fontWeight: 500, lineHeight: 1.2, letterSpacing: "-0.025em"}
  reading: {fontFamily: "Satoshi, sans-serif", fontSize: "clamp(32px, 3.7vw, 48px)", fontWeight: 500, lineHeight: 1.17, letterSpacing: "-0.025em"}
  body: {fontFamily: "Plus Jakarta Sans, Satoshi, sans-serif", fontSize: "17px", fontWeight: 400, lineHeight: 1.65}
  action: {fontFamily: "Plus Jakarta Sans, Satoshi, sans-serif", fontSize: "14px", fontWeight: 600, lineHeight: 1.6}
  wordmark: {fontFamily: "Satoshi, sans-serif", fontSize: "26px", fontWeight: 700, lineHeight: 1, letterSpacing: "0.11em"}
rounded:
  nav: "8px"
  field: "10px"
  action-home: "12px"
  card-home: "12px"
  surface: "14px"
  pill: "99px"
spacing:
  edge: "20px"
  mobile-edge: "16px"
  section: "76px"
  mobile-section: "48px"
components:
  button-primary: {backgroundColor: "{colors.ink}", textColor: "{colors.paper}", typography: "{typography.action}", rounded: "{rounded.action-home}", padding: "15px 22px"}
  button-primary-hover: {backgroundColor: "{colors.ink-hover}", textColor: "{colors.paper}"}
  button-secondary: {backgroundColor: "{colors.white}", textColor: "{colors.ink}", typography: "{typography.action}", rounded: "{rounded.action-home}", padding: "15px 22px"}
  button-secondary-hover: {backgroundColor: "{colors.surface}", textColor: "{colors.ink}"}
  project-door-hover: {backgroundColor: "{colors.door-hover}", textColor: "{colors.paper}"}
  home-card: {backgroundColor: "{colors.white}", textColor: "{colors.body}", rounded: "{rounded.card-home}", padding: "clamp(20px, 2vw, 28px)"}
  capture: {backgroundColor: "{colors.surface}", textColor: "{colors.ink}", rounded: "{rounded.surface}", padding: "28px"}
  synthesis-card: {backgroundColor: "{colors.surface}", textColor: "{colors.ink}", rounded: "{rounded.surface}", padding: "28px 30px"}
  choice: {backgroundColor: "{colors.white}", textColor: "{colors.ink}", rounded: "{rounded.surface}"}
  choice-selected: {backgroundColor: "{colors.selected}", textColor: "{colors.ink}", rounded: "{rounded.surface}"}
---

# Design System: LEVOIS

## Overview

**Creative North Star: "Une lecture claire, sur un même papier."**

Référence extraite de l’implémentation du **25 octobre 2026**, affinée le **26 octobre 2026** : un fond ivoire continu, une typographie en encre, des actions nettes et des images reliées au sujet. L’accueil, les diagnostics et la synthèse privilégient la lecture et les choix explicites. Les grandes surfaces sombres, le cobalt dominant et le quartier miniature comme composition d’accueil appartiennent aux directions précédentes.

Ce document décrit le monde actuellement implémenté. Il remplace l’autorité visuelle de septembre ; il ne constitue ni une nouvelle exploration artistique ni une certification d’accessibilité ou de performance. Les ressources historiques peuvent conserver des règles locales de compatibilité.

**Key Characteristics:**

- Une même surface ivoire de l’en-tête au pied de page.
- Des titres Satoshi en casse naturelle et un mot-symbole LEVOIS en capitales espacées.
- Des actions en encre localisées, des bordures fines et des cartes d’accueil blanches légèrement détachées du papier.
- Des images documentées, une présence identifiable de Mouaad et une collecte de coordonnées annoncée.

**Sources opérationnelles.** `src/layouts/Layout.astro` charge `public-base.css`, `levois.css`, `editorial.css`, `plan-vivant.css`, puis `v7.css` et `v7-production.css`. Ces deux derniers fichiers portent les tokens et adaptations actifs du site public. `home-v7.css` précise l’accueil ; `diagnostics.css` précise les questionnaires, la capture et la restitution. Les anciennes valeurs de `tokens.css` et les classes conservées ne constituent pas à elles seules la charte actuelle : tenir compte de la cascade complète. Les styles du cockpit restent distincts.

Les captures et relevés de la passe locale sont conservés dans `artifacts/conversion/design/`. Ils documentent des écrans précis ; ils ne prouvent pas une conformité générale. Le sidecar `.impeccable/design.json` contient des extraits représentatifs des composants et les extensions du format.

## Colors

**Primary.** `ink` porte les titres, le mot-symbole et les actions principales. `ink-hover` confirme le survol des boutons partagés ; `door-hover` s’applique uniquement à la porte principale de l’accueil. Les boutons sombres restent des commandes identifiables, pas des sections pleine largeur utilisées pour séparer la page.

**Neutral.** `paper` est le fond général ; `surface` reste une variante claire et `white` porte les cartes d’accueil et les actions secondaires. `body` donne sa couleur au texte courant ; `muted` hiérarchise les petites introductions et aides. `line` sépare les sections, `card-line` borde discrètement les cartes d’accueil et `control-line` délimite leurs actions secondaires. `selected` indique une sélection avec le contrôle natif et son libellé.

**Accent fonctionnel.** L’ambre `accent`, exposé aussi sous les noms historiques `--v7-rust` et `--v7-orange`, sert notamment au focus et à certains repères locaux. Il ne remplace pas l’encre des CTA principaux. Les couleurs d’erreur ou de succès restent des états accompagnés d’un texte, pas des variantes de marque.

**Touches orange de l’accueil — choix validé le 26 octobre.** `--home-action-orange: #F97316` apparaît uniquement derrière la flèche d’un choix de projet au survol, sur un appareil qui dispose d’un pointeur précis. Aucun accent orange permanent dans le kicker, les titres ou le bouton d’appel. La couleur est décorative : les liens et leur focus restent compréhensibles sans survol et sans mouvement. La validation finale du diagnostic reste un emplacement possible pour une future touche orange, sans modification de ce parcours dans cette passe.

**The Continuous Paper Rule.** L’accueil, les diagnostics, leurs panneaux d’aide et le pied de page partagent une lecture claire sur fond clair ; ne pas réintroduire de grandes bandes cobalt, forêt ou nuit pour fabriquer du contraste.

## Typography

**Titres et marque :** Satoshi, auto-hébergée. Les titres utilisent la graisse 500, une approche légèrement serrée et une casse naturelle. Le mot-symbole est un lien textuel **LEVOIS**, en graisse 700 ; il n’utilise ni Archivo Black ni l’ancien SVG en minuscules.

**Texte et commandes :** la pile active commence par Plus Jakarta Sans, puis Satoshi et les polices système. Les deux familles sont servies en WOFF2 avec `font-display: swap` dans `v7-fonts.css`. Ne pas documenter une police unique alors que les deux rôles restent effectivement distincts dans le code.

La taille d’accueil est bornée plutôt qu’étendue à tout l’écran. À 640 px et moins, son titre utilise `clamp(33px, 9.4vw, 48px)` et une interligne de 1,13. Les questions, la capture et la synthèse ont leurs propres échelles, indiquées dans le frontmatter. Les champs de capture gardent un texte de 16 px ; les aides restent visuellement secondaires mais lisibles. Les rares capitales servent les petites indications de contexte, pas les longs titres.

## Layout

Le conteneur partagé est limité à 1200 px avec 20 px de marge minimale par côté ; à 640 px et moins, la marge passe à 16 px. Sur l’accueil, les séquences éditoriales ont 76 px d’espacement vertical, puis 48 px sur mobile. Les trois entrées de diagnostic sont sur une ligne au desktop et deviennent une colonne sur téléphone. Les colonnes de contenu se replient sans imposer une largeur minimale aux textes.

L’en-tête fixe réserve sa hauteur réelle dans le document via `--site-header-h`. Les valeurs CSS initiales sont 81 px, puis 73 px à 1040 px et moins. `Header.astro` remesure cette hauteur avec `ResizeObserver` et après le chargement des polices. Le défilement tient compte de cette mesure et ajoute une respiration de 16 px aux cibles ; ne pas ajouter une seconde compensation fixe sur chaque page.

Les questionnaires disposent d’un panneau de progression latéral à partir de 1024 px. Il disparaît en dessous et dans la restitution. La synthèse est limitée à 940 px ; la capture initiale à 800 px. Prénom et e-mail sont côte à côte au desktop et empilés à 760 px et moins.

Sans JavaScript, l’en-tête revient dans le flux et les liens de navigation restent visibles. Les questionnaires interactifs annoncent leur besoin de JavaScript et proposent méthode, guides et contact ; ils ne prétendent pas exécuter le diagnostic sans script.

## Elevation & Depth

Le système courant repose sur les valeurs claires, les bordures et les espaces. Les cartes « angles morts », opportunités et ressources de l’accueil utilisent une ombre légère (`0 4px 24px -2px rgba(20, 20, 20, .04)`) et une bordure `card-line`. Le formulaire de capture, la synthèse et le panneau de progression restent sans ombre. Les photographies donnent la profondeur utile au contenu. Les anciennes ombres de composants cartographiques ou historiques restent des règles locales, pas un modèle à reproduire sur les nouveaux écrans.

Les transitions servent la confirmation d’un état : environ 150 à 200 ms pour les fonds, bordures ou liens ; le menu possède une transition propre. Elles ne retardent pas l’accès au contenu. `prefers-reduced-motion` réduit animations et transitions et conserve les mêmes informations et commandes.

## Shapes

Les actions rectangulaires et les cartes de l’accueil ont des angles adoucis (12 px), les cartes et panneaux des diagnostics conservent leur rayon de 14 px, les liens de navigation celui de 8 px. Les champs de capture ont une règle spécifique de 10 px. Les commandes partagées des pages intérieures et le bouton d’appel conservent une forme capsule (99 px). Ces différences correspondent aux composants existants : ne pas uniformiser leurs formes par une nouvelle règle globale.

Les avatars restent circulaires. Les photographies éditoriales utilisent principalement des angles discrets (12 à 14 px) ; leurs proportions suivent leur contenu. Les traits fins et les repères de sélection suffisent à séparer les blocs.

## Components

**Navigation.** Mot-symbole à gauche, liens de parcours et ressources, appel identifiable. Le lien courant et le survol reçoivent une surface neutre. En dessous de 1041 px, un bouton de 44 × 44 px ouvre le menu, expose `aria-expanded` et son libellé d’état ; Échap le ferme et rend le focus au bouton. Le menu reste borné par la hauteur disponible.

**Actions.** Fond encre pour l’action principale ; sur l’accueil, les actions secondaires utilisent un fond blanc et la bordure `control-line`, puis la surface claire et une bordure à 20 % d’opacité au survol. La porte principale possède son propre état `door-hover`, sans changer les variantes partagées. Les boutons d’accueil ont une hauteur minimale de 52 px ; les portes de diagnostic 64 px, puis 56 px sur téléphone. Les longs libellés peuvent revenir à la ligne. Le focus visible utilise un contour ambre de 3 px, sans dépendre du survol.

**Choix de diagnostic.** Le libellé est une cible entière avec radio ou case native, bordure légère et sélection neutre renforcée par la bordure encre. La progression et la commande de validation restent distinctes. Les états ne reposent pas sur la couleur seule.

**Capture.** Après les cinq réponses, les nouveaux diagnostics demandent prénom et e-mail obligatoires ; cette étape est annoncée dès l’entrée. Le téléphone est facultatif et son aide explique la demande d’échange direct. Les libellés restent visibles, les erreurs sont textuelles et l’état d’envoi possède une annonce accessible. La synthèse s’affiche après confirmation de l’enregistrement, même si le prestataire d’e-mail échoue ; l’interface ne transforme pas cette confirmation en promesse de réception. Les lectures historiques et les imports complets restent accessibles.

**Restitution et ressources.** Trois blocs courts — constat, angle mort, prochaine étape — puis deux ressources adaptées aux réponses. Les outils de copie, de correction et de reprise restent identifiables. Les liens éditoriaux utilisent le texte, le soulignement ou une flèche pour signaler leur rôle, sans cadre décoratif systématique.

**Images.** Le portrait identifie Mouaad. La section locale de l’accueil montre désormais une photographie réelle du pont des Minimes et du moulin de Ponceau à Chartres, prise par Patrick Giraud le 28 mai 2005, sous licence CC BY 2.5. Elle est affichée en 16:10, avec un rayon de 12 px, sans filtre ni modification des couleurs. Les variantes `chartres-eure-*` conservent une définition adaptée à l’écran. La mention d’illustration n’accompagne plus cette photographie ; le lien « Crédits photo » du pied de page mène à `/mentions-legales/#credits-photo`, qui donne l’auteur, la source, la licence et les transformations. Les autres scènes illustrées restent identifiées comme telles. Aucune image ni représentation de données ne doit passer pour une preuve individuelle de prix, de vente ou de résultat commercial.

## Do's and Don'ts

### Do:

- **Do** partir des styles V7 actifs et de leur cascade pour réutiliser un composant.
- **Do** conserver les surfaces claires continues et réserver l’encre pleine aux commandes et petits repères.
- **Do** distinguer titres Satoshi et corps Plus Jakarta Sans tels qu’ils sont implémentés.
- **Do** annoncer la capture, rendre les états explicites et préserver les anciennes lectures.
- **Do** maintenir les libellés, le focus visible, le repli mobile et la lecture sans mouvement.

### Don't:

- **Don't** réintroduire l’ancienne autorité cobalt de septembre, Archivo Black ou le logo SVG historique dans l’en-tête actuel.
- **Don't** accumuler grands aplats sombres, ombres, ornements ou animations pour compenser une hiérarchie faible.
- **Don't** remplacer la mesure du header par des espacements arbitraires propres à chaque route.
- **Don't** présenter une acceptation d’envoi comme une réception garantie ni demander le téléphone comme condition de la synthèse.
- **Don't** annoncer une certification d’accessibilité, un niveau de concours de design ou une performance mesurée à partir de cette documentation.
