---
name: LEVOIS — accueil forêt, orange et lin
description: La clarté avant l'engagement, pour les projets immobiliers du bassin chartrain.
colors:
  vert-fond: "#132a22"
  vert-principal: "#1e3a2f"
  vert-doux: "#2d5a49"
  orange-safti: "#ea580c"
  orange-hover: "#c2410c"
  orange-subtil: "#fff7ed"
  orange-action-hover: "#9a3412"
  fond-page: "#faf9f6"
  fond-carte: "#fff"
  texte-fonce: "#0f172a"
  texte-moyen: "#475569"
  texte-leger: "#64748b"
  texte-footer: "#b9cbc1"
  bordure-douce: "#e2e8f0"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(32px, 5vw, 54px)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-1px"
  headline:
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "-.5px"
  title:
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif"
    lineHeight: 1.6
  label:
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: ".5px"
rounded:
  label: "4px"
  navigation-item: "6px"
  button: "8px"
  tool: "12px"
  project: "16px"
  biography: "20px"
  badge: "100px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.orange-hover}"
    textColor: "{colors.fond-carte}"
    rounded: "{rounded.button}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "{colors.orange-action-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.texte-fonce}"
    rounded: "{rounded.button}"
    padding: "14px 22px"
  button-header:
    backgroundColor: "{colors.vert-principal}"
    textColor: "{colors.fond-carte}"
    rounded: "{rounded.button}"
    padding: "10px 18px"
  button-header-hover:
    backgroundColor: "{colors.vert-fond}"
  project-card:
    backgroundColor: "{colors.fond-carte}"
    textColor: "{colors.texte-fonce}"
    rounded: "{rounded.project}"
    padding: "32px 28px"
  tool-card:
    backgroundColor: "{colors.fond-carte}"
    textColor: "{colors.texte-fonce}"
    rounded: "{rounded.tool}"
    padding: "24px"
  hero-badge:
    backgroundColor: "{colors.orange-subtil}"
    textColor: "{colors.orange-hover}"
    rounded: "{rounded.badge}"
    padding: "6px 14px"
---

# Design System: LEVOIS — accueil

Portée : route `/` uniquement. Sources visuelles : `src/pages/index.astro` et `src/styles/home-luxury.css`. Les autres surfaces V7, le `DESIGN.md` historique et le sidecar global restent inchangés. `design.json`, dans ce dossier, complète uniquement cette référence locale.

La feuille de style de l'accueil est intégrée au HTML généré, via l'import Vite `?inline`, pour supprimer une requête bloquant le premier affichage. Son fichier source reste séparé pour la maintenance.

## Overview

**Creative North Star: "La clarté avant l'engagement"**

L'accueil traduit le HTML prescrit par l'utilisateur : forêt, orange SAFTI, fond lin et Plus Jakarta Sans. La promesse est centrée, puis les trois cartes achat, vente et double projet donnent accès aux parcours. Les outils précèdent la présentation de Mouaad. Le ton reste direct, calme et sans pression, conformément à `PRODUCT.md`.

**Key Characteristics:**

- Trois cartes de même traitement visuel pour les trois projets.
- Surfaces claires, titres forêt et orange réservé aux accents et actions.
- Portrait existant de Mouaad, navigation native et profondeur discrète.

Finition : la revue indépendante a conclu à une disposition **ship**, sans correction matérielle demandée. Fidélité **match** pour la composition, la palette et la typographie prescrites. Les adaptations servent les routes existantes, le menu mobile, le clavier, le consentement et le chargement local de la police.

## Colors

### Primary

Le vert principal porte les titres, la marque et le CTA d'en-tête. Le vert de fond ferme la page dans le pied de page ; le vert doux distingue les catégories des projets.

### Secondary

L'orange SAFTI souligne la fin du titre, les points de marque et les séparateurs territoriaux. L'orange plus sombre porte les libellés d'action, le bouton de contact et le focus. Le badge utilise un fond orange subtil ; le bouton de contact fonce encore au survol.

### Neutral

Le lin est le fond général, le blanc celui des cartes. Trois niveaux de texte séparent titres, descriptions et mentions secondaires. Les bordures sont gris clair ; le texte du pied de page est un vert grisé sur forêt sombre.

## Typography

Une seule famille : **Plus Jakarta Sans**, avec repli système. La variable locale (`/fonts/plus-jakarta-sans-latin-variable.woff2`, 27 348 octets, environ 27 Ko) couvre les graisses 400 à 800 ; elle est préchargée et utilise `font-display: swap`.

Le titre principal utilise le rôle `display` et une largeur maximale de 880 px. Les titres de section utilisent `headline`, ramené à 28 px sous 768 px. Les titres des projets utilisent `title` ; ceux des outils sont à 17 px et le nom de Mouaad à 28 px. Les titres principaux et de section utilisent `text-wrap: balance`.

Le chapeau est à 18 px, graisse 500, sur 680 px maximum ; il passe à 16 px sous 768 px. Les descriptions des projets sont à 14 px avec une hauteur de ligne de 1,5 ; celles des outils à 13 px. Les catégories et le badge sont en capitales. La marque est à 22 px, graisse 800.

## Layout

Le conteneur atteint 1 140 px, avec des marges intérieures latérales de 24 px. L'en-tête collant mesure au moins 76 px ; le document réserve 100 px pour les ancres. Le héros a des espacements verticaux de 70/50 px, réduits à 44/28 px sous 768 px.

Les projets utilisent une grille automatique de colonnes d'au moins 300 px, avec un écart de 24 px, réduit à 16 px sous 768 px. Les outils utilisent le même principe avec un minimum de 280 px et un écart de 20 px. Le minimum est borné à 100 % pour éviter le débordement sur petit écran. Les espacements avant les grandes sections vont de 48 à 80 px.

La biographie associe un portrait de 280 px à un contenu flexible, espacés de 40 px, dans un cadre rembourré de 48 px. Sous 900 px : portrait de 220 px, espacement de 28 px et marge intérieure de 32 px. Sous 768 px : une colonne, portrait centré de 200 px maximum et marge intérieure de 28 px. Le pied de page passe alors de `2fr 1fr 1fr` à une colonne.

À 1 040 px et moins, le menu `<details>` remplace les liens horizontaux. Le CTA d'en-tête reste visible jusqu'à 620 px ; en dessous, le contact reste accessible dans le menu. Les deux actions de la biographie occupent alors toute la largeur. Sous 359 px, les cartes et la biographie réduisent leurs marges intérieures à 24/20 px, le sous-titre de marque passe à 9 px et le nom à 26 px.

## Elevation & Depth

Les bordures fines et les fonds clairs structurent la page. Les cartes de projet ont une ombre légère au repos ; au survol, elles montent de 6 px, leur ombre devient flottante et une barre forêt de 4 px apparaît en haut. Le menu mobile et la fenêtre de confidentialité utilisent aussi l'ombre flottante.

- Carte : `0 10px 25px -5px rgb(30 58 47 / 5%), 0 8px 10px -6px rgb(30 58 47 / 3%)`.
- Flottant : `0 20px 35px -10px rgb(30 58 47 / 12%)`.
- En-tête : fond lin à 96 % et flou d'arrière-plan de 12 px.

## Shapes

Les boutons ont des angles de 8 px ; les outils de 12 px ; les projets, le portrait et la fenêtre de confidentialité de 16 px ; la biographie de 20 px. Le badge est arrondi à 100 px, puis 16 px sous 620 px. Les cartes et outils ont une bordure de 1 px. Le portrait existant `/v7/asset-07.webp` est recadré en 4:5 avec `object-fit: cover`, chargé paresseusement et décodé de façon asynchrone.

## Components

- **Navigation.** Liens et CTA d'en-tête d'au moins 44 px de haut. Le menu natif fonctionne sans JavaScript, son panneau est défilable et ne dépasse pas la largeur disponible. Son signe « + » pivote de 45° quand il est ouvert.
- **Projets.** Chaque carte est un lien complet, avec catégorie, titre, description et action alignée en bas. Destinations : `/ma-recherche/`, `/situer-ma-vente/`, `/vendre-et-acheter/`. Aucun effet n'est nécessaire pour comprendre ou ouvrir le parcours.
- **Outils.** Trois liens complets, numérotés dans un petit cartouche forêt. Le survol colore leur bordure en orange sombre.
- **Actions.** Contact orange sombre et téléphone transparent bordé, tous deux d'au moins 48 px de haut. Le CTA d'en-tête est forêt. Les changements de couleur durent 0,2 s ; ceux des cartes 0,3 s, avec `cubic-bezier(.16, 1, .3, 1)` pour leur déplacement. Les survols sont limités aux appareils capables de survoler.
- **Clavier et mouvement.** Lien « Aller au contenu », cible principale focalisable et contour de focus de 3 px décalé de 5 px ; le contour devient blanc dans le pied de page. `prefers-reduced-motion: reduce` désactive transitions et animations, ainsi que le déplacement des cartes.
- **Sans JavaScript.** Les liens, le téléphone et le menu restent utilisables. Le bouton « Choix de confidentialité » est masqué ; aucune mesure d'audience ne démarre.
- **Confidentialité.** Le bouton du pied de page ouvre un `<dialog>` avec fermeture, refus et acceptation. La mesure reste désactivée jusqu'à un accord explicite valide et une configuration active ; DNT ou GPC la maintiennent désactivée. Le choix expire après 180 jours. Le SDK est chargé à la demande, sans autocapture ni enregistrement de session, et chaque envoi vérifie encore l'accord. Les sources de ce comportement sont `src/components/Analytics.astro`, `src/scripts/analytics.ts` et `src/lib/analytics-consent.ts`.

## Do's and Don'ts

### Do:

- **Do** conserver les trois cartes de projet comme liens complets et de même traitement visuel.
- **Do** conserver la palette forêt/orange/lin, Plus Jakarta Sans locale et le portrait existant sur cet accueil.
- **Do** préserver les liens natifs, le focus visible et la préférence de mouvement réduit.

### Don't:

- **Don't** étendre cette référence locale aux autres surfaces V7 sans décision distincte.
- **Don't** conditionner la navigation ou la lecture de l'accueil au JavaScript ou à la mesure d'audience.
- **Don't** activer la mesure d'audience avant l'accord explicite valide.
