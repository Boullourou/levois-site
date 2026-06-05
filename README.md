# Site Lèves — carnet de terrain

Starter Astro + Tailwind pour le site cartographe de Lèves.
Posture : carnet de terrain public, pas vitrine commerciale.

## Stack
- **Astro 4** (sites statiques rapides, contenu en Markdown)
- **Tailwind CSS** (atomic CSS, payload mince)
- **Fraunces** (Google Fonts, variable, une seule famille)

## Installation locale

```bash
# Node 18+ requis
npm install
npm run dev
```

Puis ouvre `http://localhost:4321` dans le navigateur.

## Mise en ligne

### 1. Achat du domaine
- Domaine proposé : `vivre-a-leves.fr` (à vérifier)
- Alternatives : `leves.info`, `tout-leves.fr`
- Registrar recommandé : OVH ou Gandi (FR, support correct)

### 2. Repo GitHub
```bash
git init
git add .
git commit -m "Initial commit — starter Astro carnet Lèves"
gh repo create leves-site --private --source=. --push
```

### 3. Déploiement Netlify
- Connecte le repo GitHub à Netlify
- Build command : `npm run build`
- Publish directory : `dist`
- Active l'auto-deploy sur la branche `main`

### 4. Formulaire Contribuer
- Crée un compte Formspree (gratuit jusqu'à 50 soumissions/mois)
- Récupère ton endpoint
- Remplace `REMPLACE_PAR_TON_ID` dans `src/pages/contribuer.astro`

### 5. Plausible Analytics
- Crée un compte sur plausible.io (payant ~9€/mois) OU plausible.umami.is (gratuit, self-hosted)
- Ajoute le script dans `src/layouts/Layout.astro`, juste avant `</head>`

## Structure

```
src/
├── layouts/
│   └── Layout.astro          # layout principal avec header/footer/SEO
├── components/
│   ├── Header.astro          # navigation
│   ├── Footer.astro          # phrase anti-vente + signature deux casquettes
│   └── PageEnConstruction.astro  # étiquette réutilisable
├── pages/
│   ├── index.astro           # accueil
│   ├── le-projet.astro       # page-âme du site
│   ├── pourquoi-vivre-a-leves.astro
│   ├── secteurs.astro
│   ├── ecoles.astro
│   ├── commerces.astro
│   ├── carnets-de-terrain.astro
│   ├── contribuer.astro      # formulaire 3 questions
│   ├── contact.astro
│   └── mentions-legales.astro
└── styles/
    └── global.css            # base Tailwind + Fraunces
```

## Tokens de marque

Définis dans `tailwind.config.mjs` :
- `cream` `#F7F2EA` — fond, sensation papier
- `ink` `#1F1B16` — texte principal
- `sapin` `#2C4A3E` — accent paysage
- `ocre` `#C9924A` — accent terre
- `beige` `#E8DFD0` — filets/bordures
- `muted` `#6B6258` — texte secondaire

## À remplacer dans le code (recherche `[ton ...]`)
- `[ton nom]` dans `Footer.astro`, `index.astro`, `le-projet.astro`, `mentions-legales.astro`
- `[ton email]` dans `contact.astro`, `mentions-legales.astro`
- `[ton téléphone]` dans `contact.astro`, `mentions-legales.astro`
- `REMPLACE_PAR_TON_ID` dans `contribuer.astro` (endpoint Formspree)
- SIRET et adresse dans `mentions-legales.astro`

## Règle d'or éditoriale
Ne jamais publier ce qu'on n'a pas vérifié ou ce qu'on ne sait pas vrai.
Préférer le vide ou le "à enrichir" à l'invention.
