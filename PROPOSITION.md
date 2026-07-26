# LEVOIS — Proposition de conception

**Réponse au cahier des charges du 24 juillet 2026 · Document de cadrage avant prototypage**

---

## 1. Ma compréhension de la vision

LEVOIS n'est pas un site immobilier. C'est un **système d'aide à la décision** dont le héros est le propriétaire, pas le conseiller. Tout le document converge vers une inversion du modèle habituel du secteur :

- L'immobilier classique dit : « Donnez-moi vos coordonnées, je vous dirai ce que vaut votre bien. »
- LEVOIS dit : « Racontez-moi où vous en êtes, je vous aide d'abord à lire ce qui se passe. Ensuite, si vous le souhaitez, Mouaad reprendra la conversation exactement là où elle s'est arrêtée. »

Le cœur conceptuel tient en une phrase : **une seule réalité, deux lectures, un écart**. Le propriétaire lit son bien avec son histoire ; le marché le lit en quelques secondes avec un prix, des images et une promesse. Le site ne juge pas cet écart — il apprend à le voir, distingue l'hypothèse de la conclusion, et dit honnêtement ce qu'il ne peut pas encore conclure.

Les quatre moments émotionnels de réussite (5 secondes / 1 minute / 3 minutes / contact) me servent de grille de conception : chaque choix visuel ou technique sera évalué contre eux, et contre les trois questions du CdC (est-ce que cela aide à comprendre, à agir, et est-ce que cela marche sur mobile lent sans animation).

Ce que je retiens des deux références :

- **Jack / MotionSites** : pas la 3D, mais la sensation de *pièce construite* — un point focal fort, une typographie qui fait partie de la scène, de la profondeur par plans. Traduit pour LEVOIS en matière chaude, documentaire et photographique.
- **TonyRobbins.com** : pas le ton, mais l'*architecture de valeur* — plusieurs portes d'entrée selon la situation, des ressources gratuites réellement utiles, une progression de la compréhension vers l'action. Traduit pour LEVOIS en cinq situations + six ressources + un accompagnement humain en continuité.

---

## 2. Concept créatif proposé : « Deux lectures »

### 2.1 Le motif signature — la même photographie, vue deux fois

Plutôt que d'illustrer l'écart par un effet abstrait, je propose de le rendre **littéral et immédiatement compréhensible** : montrer *la même image* dans les deux lectures.

- **Lecture du propriétaire** : la photographie en pleine largeur, chaleureuse, cadrée large, avec de l'air — le bien comme un lieu de vie.
- **Lecture du marché** : la même photographie recadrée en vignette froide, posée dans une grille d'annonces anonymes, avec un prix et 4 lignes de caractéristiques.

Le passage de l'une à l'autre (par scroll maîtrisé, masque ou simple juxtaposition selon le support) *est* la démonstration du concept. Aucune 3D, aucun texte nécessaire pour comprendre — la promesse des cinq secondes est tenue par la composition elle-même.

### 2.2 La ligne d'écart — fil conducteur graphique

Un second dispositif, discret et systémique : **une fine ligne argile** qui matérialise l'écart et voyage dans tout le site.

- Dans la Hero, elle sépare (puis relie) les deux lectures.
- Dans le sélecteur, elle souligne la situation choisie.
- Dans le questionnaire, elle devient la barre de progression.
- Dans le résultat, elle pointe l'écart principal.
- Dans les ressources, elle marque la « réponse courte » immédiatement visible.

C'est l'identité en mouvement de LEVOIS : un seul élément, jamais décoratif, toujours porteur de sens (sélection, progression, écart, décision) — exactement le rôle que le CdC assigne à la couleur argile.

### 2.3 Univers visuel

**Palette** — j'évolue les tokens existants du dépôt vers la palette du CdC :

| Token | Rôle | Piste de départ |
|---|---|---|
| `papier` | fond chaud dominant | `#F7F2EA` (existant, conservé) |
| `papier-vif` | surfaces relevées, cartes | `#FDFBF6` |
| `encre` | texte, scènes sombres | `#1F1B16` (existant, conservé) |
| `brun-doux` | texte secondaire, légendes | `#6B5D4F` |
| `argile` | écart, sélection, action | `#A85638` (à calibrer sur les 19 images) |
| `argile-lumineuse` | hover, états actifs | `#C97B52` |

Les scènes sombres (encre) sont réservées aux moments de bascule — la lecture du marché, la transition d'analyse — pour créer le contraste « surface sombre / accents lumineux » de Jack sans jamais poser de voile sur les photographies. Les valeurs exactes, contrastes AA et variantes seront livrés en tokens CSS à la phase DA, calibrés sur les couleurs réelles des 19 images.

**Typographie** — une paire :

- *Display* : **Fraunces** (déjà en place, licence libre, personnalité éditoriale forte, optiques variables qui permettent des titres massifs à la Jack et des italiques sensibles). Je propose de la conserver — c'est un excellent choix qu'un changement n'améliorerait pas.
- *Lecture / interface* : une sans neutre d'excellente facture (**Instrument Sans** ou **Inter**, auto-hébergées, chiffres naturels), pour les questionnaires, réponses, formulaires et paragraphes utiles. La distinction serif/sans incarne d'ailleurs les deux lectures : la voix du propriétaire (serif, chaleureuse) et la voix du marché (sans, factuelle).

**Mise en page** — grille 12 colonnes, compositions asymétriques assumées, alternance de densités : grandes scènes typographiques → panneaux d'information calmes → interaction. Jamais deux sections consécutives sur la même grille.

### 2.4 Les deux familles de mouvement (conformes §26.2)

- **Famille A — narration** (accueil, méthode) : révélations lentes au viewport, recadrages progressifs, progression chromatique papier → argile sur les cinq étapes de la méthode, parallaxe ≤ 24 px. Sticky uniquement court et relisible.
- **Famille B — interaction** (sélecteur, questionnaire, formulaire) : réponse instantanée, sélection nette soulignée d'argile, transitions 200–350 ms, focus déplacé logiquement, retour arrière immédiat.

Les deux systèmes de cartes sont visuellement distincts : **situations** = grandes cartes photographiques numérotées 01–05, interaction riche ; **méthode** = panneaux éditoriaux à progression chromatique, lisibles sans clic. `prefers-reduced-motion` : contenu affiché directement, fondus courts, aucune hauteur artificielle.

### 2.5 Storyboard de l'accueil (résumé)

1. **Hero** — « Vous connaissez votre maison. » en Fraunces massif sur papier, photographie du propriétaire. Deux à trois hauteurs d'écran maximum jusqu'au sélecteur.
2. **Bascule** — la même image devient vignette d'annonce sur scène encre : « Le marché, lui, la découvre en quelques secondes. »
3. **Signature** — « Une seule réalité. Deux lectures. Un écart. » + la phrase de dédramatisation du CdC.
4. **Bifurcation** — « Où en est votre vente aujourd'hui ? » : cinq situations, grille asymétrique desktop, pile verticale mobile (pas de carrousel : le pouce défile naturellement, zéro geste à apprendre). Sélection → badge contexte + bouton « Commencer » explicite.
5. **Méthode** — les cinq temps en progression chromatique, CTA vers la page dédiée.
6. **Ressources** — les six cartes avec question, bénéfice, durée réelle.
7. **Preuves** — uniquement le vérifiable ; si les témoignages manquent, la crédibilité vient de la précision (engagements de transparence, méthode explicite, cadre SAFTI).
8. **Territoire** — composition documentaire des sept communes, sans fausse carte interactive.
9. **Léa puis Mouaad** — deux traitements distincts reflétant leurs rôles.
10. **CTA final** — « Vous n'avez pas besoin de tout changer… » + « Situer ma vente ».

---

## 3. Architecture et parcours

### 3.1 Sitemap V1

```
/                                   Accueil (Hero → bifurcation → écosystème)
/methode                            Le Système des Écarts
/situer-ma-vente                    Sélecteur + questionnaire (île interactive)
/situer-ma-vente/resultat           Résultat personnalisé + transmission
/ressources                         Bibliothèque (6 ressources)
/ressources/[slug]                  6 pages ressources
/accompagnement                     Ce que change un accompagnement
/mouaad                             Page Mouaad
/lea                                Présentation de Léa (courte, peut vivre dans /ressources)
/contact                            Contact simple (solution de secours)
/mentions-legales · /confidentialite · 404 utile
```

Le questionnaire vit sur une **route dédiée** (`/situer-ma-vente?s=peu-de-contacts`) : les cinq situations sont pré-sélectionnables par lien direct — indispensable pour les contenus de Léa et les publications de Mouaad (§10.3). L'accueil embarque le sélecteur et passe la main à la route.

**Restaurable et partageable sans données personnelles** : réponses en `sessionStorage` (jamais les coordonnées), et un état de résultat encodable en paramètre compact (`?r=3.ab2c`) qui ne contient que les identifiants de réponses — rechargeable, imprimable, transmissible.

### 3.2 Moteur de signaux (déterministe et transparent)

Conforme au §14 : chaque option de réponse porte des tags de signaux pondérés + un fragment de reformulation. À la fin : agrégation → écart principal (+ secondaire éventuel) → niveau qualitatif (*hypothèse à vérifier / signal qui se répète / signaux convergents*) → reformulation assemblée → limite → action → ressource → CTA.

Tout le contenu du moteur vit dans **des fichiers de données typés et validés** (zod), séparés des composants : `src/data/situations/*.ts`. Les trois exemples du §17 deviennent des **tests automatisés** — le moteur est recetté par le code, pas seulement à l'œil. Les cas d'égalité et d'insuffisance de données sont des sorties de première classe, pas des cas d'erreur.

### 3.3 Transmission à Mouaad

Formulaire affiché *après* le résultat complet, jamais bloquant. Route serveur : validation client + serveur, honeypot + limitation de fréquence, envoi du contexte complet (situation, réponses, signaux, écart, niveau, reformulation, limite, action, ressource) par email structuré à Mouaad + enregistrement, confirmation uniquement après réponse positive du serveur, message d'erreur honnête qui préserve le résumé à l'écran. Consentement de transmission distinct de tout consentement marketing.

---

## 4. Choix techniques recommandés

Le CdC recommande Next.js mais laisse la stack au choix du développeur (§28). **Je recommande de rester sur Astro** (mise à niveau vers Astro 5) — un choix motivé, pas un choix de confort :

1. **La performance est non négociable** (LCP < 2,5 s mobile, INP < 200 ms, JS initial limité). Astro livre du HTML statique avec zéro JavaScript par défaut ; seul le parcours adaptatif est une « île » interactive. C'est structurellement l'architecture la plus proche des exigences du §29 — un site Next.js atteint ces chiffres en se battant, un site Astro les a par défaut.
2. **Le contenu est roi** : pages ressources en MDX via content collections, indexables sans JavaScript (§31), administrables.
3. **La continuité** : le dépôt, le déploiement Netlify, le domaine levois.fr, Tailwind et Fraunces existent déjà et fonctionnent.

| Besoin | Choix | Pourquoi |
|---|---|---|
| Framework | **Astro 5** (output hybride) | statique par défaut, îles pour l'interactif |
| Parcours adaptatif | **Île Preact** (~4 kb) + moteur en TS pur | le moteur est testable sans navigateur |
| Styles / tokens | **Tailwind** + tokens CSS custom properties | déjà en place, design tokens centralisés |
| Animation | **CSS + IntersectionObserver** ; **Motion One** (~5 kb) uniquement pour la Hero et la transition d'analyse | aucun contenu ne dépend de la lib (§28) |
| Contenu ressources | **MDX content collections** + **Keystatic** (interface d'édition qui écrit dans le dépôt Git) | administrable sans CMS lourd ni base de données |
| Questions / règles | Fichiers TS typés + zod, documentés | éditables en confiance, versionnés, testés |
| Formulaire | **Route serveur Astro** (fonction Netlify) + **Resend** pour l'email + copie dans un stockage (Netlify Blobs ou Airtable, à décider) | secrets côté serveur, validation double, anti-spam |
| Images | Pipeline Astro : AVIF/WebP, `srcset/sizes`, dimensions intrinsèques, art direction par breakpoint | §24 intégralement couvert |
| Analytics | GA4 est déjà installé — voir §6, point à décider (consentement cookies) vs **Plausible** (sans bandeau) | mesurer le parcours, pas les personnes |
| Monitoring | Sentry (gratuit à ce volume) | erreurs formulaire et parcours |
| Tests | Vitest (moteur de règles, 3 cas du §17) + Playwright (parcours critique, clavier, mobile) | la recette §39 devient exécutable |

---

## 5. Améliorations proposées au-delà du cahier des charges

1. **Le motif « même image, deux lectures »** (§2.1 ci-dessus) — le CdC demande une interprétation graphique de l'écart ; celle-ci est démontrable en cinq secondes, sans effet coûteux, et devient un asset de marque réutilisable dans les contenus de Léa.
2. **Résumé imprimable/copiable du résultat** dès la V1 (version simple, sans génération PDF) : le propriétaire « repart avec quelque chose » de tangible même sans contact — cela renforce la priorité n°1.
3. **Les trois exemples du §17 en tests automatisés** : la personnalisation réelle est garantie par la CI à chaque modification de contenu, pas seulement à la recette.
4. **Liens profonds instrumentés** pour les réseaux (`/situer-ma-vente?s=…&from=…`) : chaque vidéo de Léa peut mesurer son parcours complet jusqu'au lead, dans le respect du consentement.
5. **Email de synthèse à double destinataire** (option) : le propriétaire peut choisir de *recevoir lui aussi* son résumé — de la valeur ajoutée, et une raison légitime et transparente de donner son email.
6. **Une question d'ouverture par le microcopy** : chaque écran de question affiche « pourquoi nous posons cette question » en une ligne — le CdC le demande ; j'en fais un élément de design visible, car c'est précisément ce qui déclenche « on cherche à me comprendre ».

---

## 6. Informations et contenus nécessaires avant chaque phase

**Bloquant pour la phase DA (prototypes) :**
- les **19 images** en haute définition — l'audit (qualité, cadrages possibles, visages, droits) conditionne la Hero et la répartition §24.2 ;
- le **logo LEVOIS** dans les formats disponibles ;
- photos de **Mouaad** et de **Léa** (le dépôt contient des portraits — sont-ils les bons ?).

**Bloquant pour le développement du noyau :**
- **destination des leads** : simple email à Mouaad ? copie dans un tableau (Airtable/Notion) ? CRM SAFTI ? — cela fixe l'intégration serveur ;
- validation des **questions et options** des cinq parcours (§13) comme base éditoriale.

**Bloquant pour la mise en ligne :**
- mentions et éléments de marque **SAFTI** autorisés ;
- **témoignages réels** avec autorisation (ou décision assumée de s'en passer en V1) ;
- coordonnées professionnelles définitives, liens sociaux actifs, textes légaux, politique de traitement des leads ;
- **décision analytics** : GA4 (déjà posé, mais impose un bandeau de consentement) ou Plausible (payant ~9 €/mois, sans bandeau, plus cohérent avec le positionnement « on ne vous surveille pas »). Je recommande Plausible.

**Décision de transition :** que faire de l'existant (carnets de terrain, votre-rue, observatoire, guide) ? Ma recommandation : les retirer de la navigation V1 (le CdC interdit les pages qui détournent l'attention), conserver les URLs avec redirections propres, et réintroduire les carnets plus tard comme contenus signés — ils sont dans l'esprit « preuve par la précision locale ».

---

## 7. Phases, planning estimatif et budget

Conforme au processus §37, avec des **jalons de validation** — rien n'est développé avant que vous ayez approuvé l'étape précédente.

| Phase | Contenu | Livrable / jalon de validation | Durée indicative |
|---|---|---|---|
| **0 · Cadrage** | ce document + vos décisions (§6) + audit des 19 images | document de décisions validé | 2–3 jours |
| **1 · Architecture & UX** | sitemap final, flux, logique de résultats, wireframes desktop/mobile, inventaire des états | prototype basse fidélité cliquable | 4–6 jours |
| **2 · Direction artistique** | tokens, paire typo, et **quatre écrans seulement** : Hero, sélecteur, question, résultat | **DA approuvée sur prototype haute fidélité navigable** (dans le vrai navigateur, pas une image figée) | 6–8 jours |
| **3 · Noyau fonctionnel** | structure globale, sélecteur, questionnaire, moteur de règles + tests §17, résultat, formulaire serveur | parcours complet fonctionnel de bout en bout | 10–14 jours |
| **4 · Contenus & pages** | 6 ressources, méthode, accompagnement, Mouaad, Léa, contact, légales, 404, intégration des 19 images, SEO/OG | site complet en prévisualisation | 6–8 jours |
| **5 · Recette & mise en ligne** | grille §39, accessibilité WCAG 2.2 AA, Lighthouse mobile+desktop, tests 5 utilisateurs (§40), ajustements, déploiement, test réel du formulaire | mise en production + handoff §36.4 | 4–6 jours |

**Total : environ 32 à 45 jours de travail, soit 6 à 9 semaines calendaires** en incluant vos temps de validation et les tests utilisateurs.

**Budget — repères de marché** pour un projet de ce niveau d'exigence (design sur mesure + moteur de personnalisation + recette accessibilité/performance) :

- freelance senior design + dev : **20 000 – 38 000 € HT** (TJM 550–850 €) ;
- studio spécialisé : **40 000 – 70 000 € HT**.

Postes récurrents à prévoir hors conception : hébergement Netlify (0–19 €/mois à ce trafic), domaine (déjà acquis), Resend (gratuit < 3 000 emails/mois), Plausible (~9 €/mois), Keystatic (gratuit). **Aucune licence typographique à acheter** avec la paire proposée (Fraunces + Instrument Sans/Inter, licences libres).

Dans notre mode de collaboration, ces repères servent à situer la valeur ; le vrai coût se pilote par jalons : chaque phase produit un livrable vérifiable que vous validez avant la suivante.

---

## 8. Ce que je vous propose de valider maintenant

1. **Le concept « Deux lectures »** : même image vue deux fois + ligne d'écart argile comme fil conducteur (§2.1–2.2).
2. **L'architecture** : sitemap §3.1, questionnaire sur route dédiée avec liens profonds, moteur de signaux en données typées et testées.
3. **La stack** : Astro 5 + île Preact + MDX/Keystatic + route serveur Netlify + Resend — au lieu de Next.js, pour les raisons du §4.
4. **Le sort de l'existant** : retrait de la navigation V1 avec redirections (recommandé) ou conservation partielle.
5. **Analytics** : Plausible sans bandeau (recommandé) ou GA4 existant + bandeau de consentement.

Dès validation (même partielle — le concept et l'architecture suffisent pour démarrer), la phase suivante est le **prototype navigable des quatre écrans clés** : Hero, sélecteur de situations, un écran de question, un résultat complet — construits avec les vraies technologies, testables sur votre téléphone.
