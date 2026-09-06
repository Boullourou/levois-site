---
name: LEVOIS — Une vie derrière chaque adresse
description: Un quartier à explorer, des faits à comprendre, une relation à choisir.
colors:
  accent: "#2545df"
  accent-hover: "#1732b5"
  human: "#f47b20"
  ink: "#111a30"
  paper: "#f5f6fa"
  muted: "#596378"
  line: "#dce0e9"
  surface: "#ffffff"
  selected: "#edf1ff"
  dark: "#182447"
  dark-field: "#223155"
  on-dark: "#c6cfe5"
  error: "#9c352c"
  error-bg: "#ffefed"
  success: "#286547"
  success-bg: "#eaf4ee"
typography:
  display: {fontFamily: "Satoshi, sans-serif", fontSize: "clamp(56px, 5.4vw, 82px)", fontWeight: 400, lineHeight: 1.04, letterSpacing: "-0.035em"}
  headline: {fontFamily: "Satoshi, sans-serif", fontSize: "clamp(38px, 4.25vw, 62px)", fontWeight: 400, lineHeight: 1.12, letterSpacing: "-0.035em"}
  page: {fontFamily: "Satoshi, sans-serif", fontSize: "clamp(36px, 4.2vw, 60px)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.035em"}
  question: {fontFamily: "Satoshi, sans-serif", fontSize: "clamp(30px, 3.25vw, 46px)", fontWeight: 400, lineHeight: 1.12, letterSpacing: "-0.03em"}
  body: {fontFamily: "Satoshi, sans-serif", fontSize: "16px", fontWeight: 400, lineHeight: 1.6}
  action: {fontFamily: "Satoshi, sans-serif", fontSize: "15px", fontWeight: 500, lineHeight: 1.4}
rounded:
  field: "8px"
  action: "9px"
  choice: "12px"
  dock: "15px"
  sheet: "16px"
spacing:
  edge: "clamp(24px, 4vw, 72px)"
  mobile-edge: "22px"
components:
  button-primary: {backgroundColor: "{colors.accent}", textColor: "{colors.surface}", typography: "{typography.action}", rounded: "{rounded.action}", padding: "16px 24px"}
  button-primary-hover: {backgroundColor: "{colors.accent-hover}", textColor: "{colors.surface}"}
  button-secondary: {backgroundColor: "{colors.surface}", textColor: "{colors.ink}", rounded: "{rounded.action}", padding: "14px 24px"}
  choice: {backgroundColor: "{colors.surface}", textColor: "{colors.ink}", rounded: "{rounded.choice}", padding: "20px 42px 20px 20px"}
  choice-selected: {backgroundColor: "{colors.selected}", textColor: "{colors.ink}", rounded: "{rounded.choice}"}
  address-dock: {backgroundColor: "rgba(255,255,255,0.97)", rounded: "{rounded.dock}", padding: "18px 20px 12px"}
---

# Design System: LEVOIS

## Overview

**Creative North Star: "Une vie derrière chaque adresse."**

Identité finale validée par l’utilisateur le **6 septembre 2026**, applicable à **tout le site public**. L’exploration artistique est close. Le quartier miniature, Satoshi et le cobalt relient une adresse, les faits du marché, le projet personnel et l’accompagnement de Mouaad.

L’interface est lumineuse, calme et concrète. La composition, le rythme et les images portent l’émotion ; les outils et les textes longs gardent la même identité avec moins de mise en scène. La première compréhension précède les coordonnées facultatives.

**Key Characteristics:**

- Un quartier illustré reconnaissable et une action réelle immédiatement accessible.
- Une seule famille de lecture ; des titres amples et réguliers.
- Le cobalt pour agir ou sélectionner, l’encre pour comprendre.
- Des surfaces sobres, des séparations fines et une présence humaine continue.

**Autorité opérationnelle.** [tokens.css](src/styles/tokens.css) porte les valeurs normatives ; le frontmatter ci-dessus en est le relevé avec les rôles typographiques du code. [Layout.astro](src/layouts/Layout.astro) est l’unique layout public et charge, dans cet ordre, [public-base.css](src/styles/public-base.css), [levois.css](src/styles/levois.css), puis [editorial.css](src/styles/editorial.css). [tailwind.public.config.mjs](tailwind.public.config.mjs) est autonome. Le [sidecar](.impeccable/design.json) complète ce document sans ajouter de palette.

**Frontière.** Les 24 routes publiques sont contrôlées par [verify-public.mjs](scripts/verify-public.mjs). Les noms historiques de classes ou d’alias (`rp-*`, `mr-*`, `vr-*`, `argile`, `papier`, `--rp-yellow`) assurent la compatibilité du code ; ils ne désignent pas une autre identité. `global.css` et `tailwind.config.mjs` appartiennent exclusivement au cockpit privé via `CockpitLayout.astro`. Les [anciennes autorités](docs/archive/visual-authorities/README.md) sont archivées et ne contraignent plus le public.

## Colors

**Primary.** Le cobalt `accent` marque actions principales, sélections et mesures dominantes. `accent-hover` confirme le survol ; `selected` accompagne une sélection sans masquer son libellé ni son indicateur.

**Neutral.** `paper` est le fond froid ; `surface` détache les commandes ; `ink`, `muted` et `line` hiérarchisent lecture, explications et séparations. `dark`, `dark-field` et `on-dark` servent les séquences de méthode et de transmission, avec leurs contrastes propres.

**États métier.** Erreur et succès utilisent les couples sémantiques du frontmatter. Le parcours acheteur conserve aussi des signaux locaux vert discret et ocre, accompagnés d’un texte explicatif. Ces états ne deviennent jamais des accents de marque.

**Accents maîtrisés.** Le cobalt reste la couleur des actions et des données principales. L’orange humain `human` (#f47b20) est le seul accent secondaire : point du i, détail du portrait, numéros sur fond nuit. Aucune grande surface ni bouton orange, aucun dégradé bleu-orange, aucun état communiqué par l’orange seul. Les bleus et neutres dominent ; l’orange reste nettement sous 10 % de la composition. Contraste mesuré : 5,57:1 sur `dark`, utilisable pour les petits numéros ; 2,53:1 sur `paper`, réservé aux éléments décoratifs et au point du logo.

## Typography

**Display Font / Body Font:** Satoshi, repli `sans-serif`. Les trois WOFF2 auto-hébergés (`satoshi-400`, `satoshi-500`, `satoshi-700`) couvrent lecture, actions et emphases. Les grands titres sont réguliers ; les données gardent unités, période et effectif à proximité.

**Signature:** mot-symbole vectoriel « levois », encre et point orange, avec liaison v–o et contreforme fermée du o. Les cinq SVG normatifs sont dans [public/brand](public/brand/README.md) et [favicon.svg](public/favicon.svg). Le dessin est issu de contours DM Serif Display adaptés ; aucune police supplémentaire n’est chargée. Archivo Black et le signe de porte historiques ne doivent plus servir de logo public.

La hiérarchie du frontmatter distingue accueil, sections, pages, questions, corps et actions. Les articles utilisent des sous-titres en 500 et une lecture plus aérée ; les champs d’adresse mobiles restent à 16 px. Les légendes du quartier sont à 11 px minimum ; la réassurance, la légende humaine et les liens de footer sont à 12 px minimum.

## Layout

Les largeurs de référence sont `--levois-wide` (1280 px) et `--levois-reading` (70 ch). Les familles existantes conservent leurs ajustements : panneau d’entrée de l’accueil (940 px, puis 680 px sous 900 px), article éditorial (840 px), parcours et données en colonnes. Le rythme provient des marges, de l’alternance image/texte et des traits, sans enfermer chaque paragraphe.

Le header passe de 88 à 72 px sous 900 px ; les accès métier deviennent un menu avec état ouvert, Échap et retour du focus. Le logo garde 129 × 40 px sur desktop et 110 × 34 px dans l’en-tête mobile, sans augmenter la hauteur du header. Le nom et le portrait de Mouaad persistent. La fiche acheteur latérale devient un récapitulatif compact ; les colonnes de lecture, formulaires et cartes s’empilent selon leur contenu.

Seuils effectivement utilisés : 1100, 900, 700, 600 et 359 px, complétés par les utilitaires responsives. Les marges générales passent à 28 px puis 22 px ; les panneaux ont leurs propres marges. À moins de 600 px, le dock empile saisie et action. Le titre d’accueil passe à 65, 43 puis 36 px selon les seuils 900, 600 et 359 px.

Toute évolution conserve une lecture sans débordement aux formats 1440 × 900, 768 px, 390 × 844, 320 px et au zoom réel de 200 %. Ces formats sont des contrôles de livraison, pas de nouveaux breakpoints. Les résultats de vérification restent dans les artefacts et le rapport de mission.

## Elevation & Depth

La profondeur vient d’abord du quartier illustré. Les contenus restent plats ; une ombre situe une commande ou une couche superposée. `--levois-shadow` porte le dock et la fenêtre de confidentialité ; la liste d’adresses dispose d’une ombre locale. Les cartes éditoriales sont des entrées séparées par un trait, sans ombre ni cadre arrondi.

Le mouvement accompagne un état ou une continuité : transition rapide commune (`--levois-fast`, 180 ms), survol d’action (200 ms), question (300 ms), navigation native (220 ms ; éléments partagés 350 ms, `--levois-ease`). Sous `prefers-reduced-motion: reduce`, animations, transitions et défilement doux sont désactivés ; le contenu reste complet.

## Shapes

Les rayons du frontmatter distinguent champs, actions, choix, dock et fenêtres. Les portraits et le territoire schématique peuvent former une arche ; cette silhouette ne s’applique pas à tous les conteneurs. Les ressources et textes légaux privilégient alignements, espace et séparations horizontales.

**Iconographie.** Réutiliser [WorldIcon.astro](src/components/WorldIcon.astro) : SVG 24 × 24, trait 1,5, `currentColor`, extrémités et jonctions arrondies. Les pictogrammes accompagnent un texte ou un nom accessible. Maison, clé et repère servent des actions précises, jamais un nouveau logo immobilier décoratif.

**Images.** Le quartier est une illustration éditoriale, ni un bien réel, ni une carte factuelle, ni une preuve de transaction. Les cartes de données restent identifiées comme schématiques. Utiliser les portraits réels et les images existantes avec recadrage responsive et qualification adaptée ; aucun chiffre, bouton ou texte fonctionnel ne doit être rasterisé dans une image.

## Components

- **Actions.** Primaire cobalt, secondaire blanche bordée, action texte cobalt et variante claire sur fond nuit. Le primaire courant mesure au moins 56 px de haut ; le secondaire au moins 48 px. Survol plus sombre, léger déplacement du primaire et de sa flèche ; focus visible cobalt. Le bouton acheteur désactivé devient gris et reste inactif.
- **Navigation.** Lien courant et survol soulignés, cibles du header d’au moins 44 px, lien d’évitement, menus nommés et état annoncé. Les accès légaux, partenaires et confidentialité restent au footer.
- **Champs et choix.** Libellé visible, aide associée, fond blanc et bord fin ; focus cobalt, erreur textuelle et `aria-invalid`. Choix inactif, survol et sélection se distinguent par bord, fond et indicateur. Un choix unique avance ; saisie, choix multiples et envoi demandent validation explicite. Le retour permet de corriger.
- **Entrée de l’accueil.** « Qu’est-ce qui vous amène ? » précède trois portes visibles : « Je cherche un logement », « Je prépare ou je vends un bien », « Je consulte les ventes près de chez moi ». Achat et vente ouvrent leurs parcours ; seul le troisième choix révèle l’adresse, avec retour au projet. Sans JavaScript, les trois portes sont des liens utilisables. La révélation dure 220 ms avec mouvement autorisé et reste immédiate en mouvement réduit. Styles limités à `index.astro`.
- **Adresse.** Après le choix des ventes locales, le dock et sa combobox rendent visibles suggestions, chargement, absence de correspondance et erreur. La personne choisit une adresse proposée ; le résultat ne retient pas silencieusement la première correspondance. L’extrait `address-dock` décrit cet état, pas l’entrée initiale.
- **Données.** Filtres segmentés avec état sélectionné ; chiffres avec unité, périmètre, période, source, effectif et limites. État vide explicite. L’adresse confirmée et la référence communale restent distinctes ; les 6 318 mutations DVF du jeu réel ne sont pas une estimation individuelle.
- **Conteneurs.** Choix et saisies peuvent être encadrés ; synthèses, ressources et résultats utilisent surtout l’espace et les traits. Les réserves disposent d’un encart à bord gauche cobalt. Une fenêtre narrative révèle une explication sans inventer une preuve.
- **Formulaires.** Prévoir attente, validation, erreur, succès et indisponibilité avec messages compréhensibles et annonces accessibles. L’audit d’annonce conserve son parcours de secours et ses questions lorsque la lecture du lien échoue ; son résultat précède la transmission humaine facultative.
- **Confidentialité.** Mesure d’audience désactivée par défaut ; la fenêtre optionnelle s’ouvre depuis « Mes choix de confidentialité » au footer. Refus et acceptation ont une importance visuelle comparable ; fermer ne vaut pas accepter.

**Applications de référence.** Page émotionnelle : `/`, quartier et choix de la situation ; adresse seulement après le choix des ventes locales ; ensuite un fait local expliqué, la méthode, Mouaad puis la prochaine action. La section « Un prix ne raconte jamais toute l’histoire » donne la médiane réelle et son contexte, avec un seul lien vers les ventes locales ; elle ne répète plus les trois portes. Formulaire : `/ma-recherche`, question lisible et fiche révisable, restitution avant coordonnées. Données : `/votre-rue`, adresse confirmée puis atlas communal, mesures et limites. Les ressources, pages légales, accompagnement et partenaires prolongent cette identité avec une composition plus sobre.

## Do's and Don'ts

### Do:

- **Do** reprendre les tokens publics, Satoshi et les composants existants pour toute route publique.
- **Do** donner une première compréhension avant les coordonnées et conserver une sortie volontaire.
- **Do** joindre aux chiffres leurs sources et limites, et aux états une explication indépendante de la couleur.
- **Do** préserver clavier, focus visible, lecture mobile et fonctionnement sans mouvement.

### Don't:

- **Don't** rouvrir une direction, une palette ou une composition générale sans défaut concret d’usage, d’accessibilité ou de faisabilité.
- **Don't** importer le thème privé ou appliquer une ancienne autorité visuelle au public.
- **Don't** accumuler cartes, cadres arrondis, ombres, effets décoratifs ou familles typographiques.
- **Don't** présenter une illustration, une maquette ou des données DVF comme une preuve commerciale individuelle.
- **Don't** promettre une validation d’accessibilité ou une performance mesurée à partir de cette documentation.
