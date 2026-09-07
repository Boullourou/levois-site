# LEVOIS — Passation complète site, parcours, données et création

Version : 2026-08-17  
Auteur de la passation : Codex  
Objet : permettre à un nouveau chat / agent Codex de reprendre le projet sans historique de conversation.

Ce document décrit l’état réel du projet au moment de la passation. Il ne remplace pas `PRODUCT.md`, `DESIGN.md` ni le code : il sert de carte de reprise.

Verdict court : la version à reprendre est le dossier local `levois-site-redesign`, branche `redesign/levois-dynamic`, avec des modifications locales non commités. La production `https://levois.fr` fonctionne, mais elle ne contient pas toute la dernière création locale buyer-first.

---

## 0. Règle de reprise immédiate

Ne repars pas de zéro.

À reprendre :

- dossier local : `C:\Users\PC\Desktop\Obsidian Mouaad SAFTI\levois-site-redesign`
- branche locale : `redesign/levois-dynamic`
- base Git distante la plus proche : `origin/main` à `b032e42`
- état utile réel : `b032e42` + working tree local non commité

À ne pas reprendre comme source principale :

- `C:\Users\PC\Desktop\Obsidian Mouaad SAFTI\levois-site`
- la branche locale `main` actuellement à `0faad08`
- la branche distante `origin/redesign/levois-dynamic` actuellement à `3503ab4`
- l’ancien brief `PROPOSITION.md`, qui est désormais une archive
- tout ancien contenu, spot, scénario ou écran centré sur Léa

---

## 1. État Git et localisation projet

### 1.1 Localisation

Repo actif :

```text
C:\Users\PC\Desktop\Obsidian Mouaad SAFTI\levois-site-redesign
```

`git rev-parse --show-toplevel` :

```text
C:/Users/PC/Desktop/Obsidian Mouaad SAFTI/levois-site-redesign
```

Remote :

```text
origin  https://github.com/Boullourou/levois-site.git
```

### 1.2 Branche active

Branche active :

```text
redesign/levois-dynamic
```

État :

```text
## redesign/levois-dynamic...origin/redesign/levois-dynamic [ahead 11]
```

Point important : la branche locale suit `origin/redesign/levois-dynamic`, mais son `HEAD` est aussi le même commit que `origin/main`.

### 1.3 Commits et branches

Dernier commit local :

```text
b032e42 fix: declare DVF dataset license
```

Branches connues :

```text
main                                            0faad08 [origin/main: behind 14] chore: bind buyer journey storage
redesign/levois-dynamic                         b032e42 [origin/redesign/levois-dynamic: ahead 11] fix: declare DVF dataset license
remotes/origin/HEAD                             -> origin/main
remotes/origin/claude/levois-site-vision-vmuyp1 01b83d1 fix(ma-recherche): bouton Retour sticky au lieu de fixed
remotes/origin/main                             b032e42 fix: declare DVF dataset license
remotes/origin/redesign/levois-dynamic          3503ab4 feat: guide market insight into personalized analysis
```

Branches distantes vérifiées :

```text
origin/main                             b032e42
origin/redesign/levois-dynamic          3503ab4
origin/claude/levois-site-vision-vmuyp1 01b83d1
```

PR GitHub vérifiées :

```text
#1 LEVOIS V1 — Jalon 1 : noyau complet navigable (prévisualisation)
branche claude/levois-site-vision-vmuyp1
statut MERGED
date 2026-07-24T01:45:49Z
```

Aucune PR ouverte n’a été trouvée dans la liste récente.

### 1.4 Commits locaux en avance sur `origin/redesign/levois-dynamic`

La branche locale contient 11 commits que `origin/redesign/levois-dynamic` n’a pas :

```text
b032e42 fix: declare DVF dataset license
1d92cb5 chore: activate PostHog EU analytics
97b17e0 docs: add partner growth journeys
2879e54 feat: add privacy-first journey analytics
df30284 feat: personalize listing audit with seller signals
3ab5ae3 feat: route blocked audits by seller signal
965ba77 fix: use canonical audit endpoint
bf1a390 feat: make listing audit URL-first
7604e8c feat: add listing audit tool
09c2935 fix: prevent homepage metric overflow
5536721 copy: clarify local market reading
```

Ces commits sont déjà sur `origin/main`. Ils ne sont pas perdus, mais la branche distante `origin/redesign/levois-dynamic` est en retard.

### 1.5 Modifications locales non commités

Aucun changement n’est staged.

Fichiers modifiés suivis :

```text
M .astro/settings.json
M DESIGN.md
M PROPOSITION.md
M README.md
M functions/api/recherche.ts
M public/sitemap.xml
M src/components/Footer.astro
M src/components/Header.astro
M src/pages/audit-annonce.astro
M src/pages/contact.astro
M src/pages/index.astro
M src/pages/ma-recherche.astro
M src/pages/situer-ma-vente.astro
M src/scripts/analytics.ts
M src/styles/global.css
```

Fichiers non suivis :

```text
.codex-dev-server.err.log
.codex-dev-server.out.log
public/fonts/antonio-latin-variable.woff2
public/fonts/bricolage-grotesque-latin-variable.woff2
src/components/home/DecisionHero.astro
src/components/home/WorldGateway.astro
src/components/journeys/
src/pages/recommander.astro
src/pages/rejoindre.astro
```

À committer probablement :

- `README.md`
- `DESIGN.md`
- `PROPOSITION.md`
- `functions/api/recherche.ts`
- `public/sitemap.xml`
- `public/fonts/antonio-latin-variable.woff2`
- `public/fonts/bricolage-grotesque-latin-variable.woff2`
- `src/components/Footer.astro`
- `src/components/Header.astro`
- `src/components/home/WorldGateway.astro`
- `src/components/journeys/`
- `src/pages/index.astro`
- `src/pages/ma-recherche.astro`
- `src/pages/recommander.astro`
- `src/pages/rejoindre.astro`
- `src/pages/audit-annonce.astro`
- `src/pages/contact.astro`
- `src/pages/situer-ma-vente.astro`
- `src/scripts/analytics.ts`
- `src/styles/global.css`

À ne pas committer sans raison :

- `.codex-dev-server.err.log`
- `.codex-dev-server.out.log`
- probablement `.astro/settings.json`, à vérifier avant commit

### 1.6 Diff actuel

Diff tracked du working tree :

```text
15 files changed, 828 insertions(+), 817 deletions(-)
```

Fichiers principaux dans ce diff :

```text
DESIGN.md
PROPOSITION.md
README.md
functions/api/recherche.ts
public/sitemap.xml
src/components/Footer.astro
src/components/Header.astro
src/pages/audit-annonce.astro
src/pages/contact.astro
src/pages/index.astro
src/pages/ma-recherche.astro
src/pages/situer-ma-vente.astro
src/scripts/analytics.ts
src/styles/global.css
```

Diff commités entre `origin/redesign/levois-dynamic` et `HEAD` :

```text
27 files changed, 2103 insertions(+), 582 deletions(-)
```

Il s’agit surtout de :

- PostHog privacy-first ;
- audit d’annonce URL-first ;
- API audit URL ;
- enrichissements API `/api/lead` ;
- ressources analytics ;
- docs produit et framework ;
- corrections homepage et DVF.

Diff avec `origin/main` :

- `HEAD` est égal à `origin/main` ;
- l’écart actuel avec la production Git est donc essentiellement le working tree local non commité.

Attention : la branche locale `main` est dans un autre worktree et reste à `0faad08`. Ne pas l’utiliser pour juger l’état actuel.

---

## 2. Stack technique

### 2.1 Framework et runtime

Projet :

```json
{
  "name": "levois-site",
  "type": "module",
  "version": "0.1.0",
  "private": true
}
```

Framework :

- Astro `^4.16.0` dans `package.json`
- Astro installé : `4.16.19`
- build statique : `astro build`
- output : `static`

CSS :

- Tailwind CSS `^3.4.13`, installé `3.4.19`
- `@astrojs/tailwind`
- styles globaux dans `src/styles/global.css`
- tokens Tailwind dans `tailwind.config.mjs`

Tests :

- Vitest `^4.1.10`
- Node test runner pour `tests/market-summary.node.mjs`

Analytics :

- `posthog-js ^1.380.0`
- import slim : `posthog-js/dist/module.slim`

### 2.2 Scripts npm

```bash
npm install
npm run dev
npm test
npm run test:market
npm run build
npm run preview
npm run data:dvf
npm run data:market
npm run data:verify
```

Sur Windows / PowerShell, utiliser de préférence :

```powershell
& 'C:\Program Files\nodejs\npm.cmd' test
& 'C:\Program Files\nodejs\npm.cmd' run build
```

### 2.3 Vérifications du 17 août 2026

Tests Vitest :

```text
Test Files  7 passed (7)
Tests       41 passed (41)
```

Tests marché DVF :

```text
tests 6
pass 6
fail 0
```

Build :

```text
24 page(s) built
Complete
```

Pages générées :

```text
/404
/accompagnement
/audit-annonce
/carte
/composants
/confidentialite
/contact
/
/ma-recherche
/mentions-legales
/methode
/mouaad
/recommander
/rejoindre
/ressources
/ressources/lancement-coherent
/ressources/premiere-impression-annonce
/ressources/annonce-vue-peu-de-contacts
/ressources/retours-de-visite
/ressources/verifier-avant-baisse-prix
/ressources/reprendre-commercialisation
/situer-ma-vente/resultat
/situer-ma-vente
/votre-rue
```

### 2.4 Astro config

`astro.config.mjs` :

- `site: 'https://levois.fr'`
- intégration Tailwind active ;
- intégration sitemap commentée pour incompatibilité versions `@astrojs/sitemap 3.2.1 + Astro 4.16+` ;
- `build.inlineStylesheets = 'auto'`.

Le sitemap actuel est donc manuel : `public/sitemap.xml`.

### 2.5 Hébergement

Hébergement actif :

- Cloudflare Pages
- build output : `dist`
- Pages Functions dans `functions/api`
- D1 pour le parcours acheteur
- KV optionnel pour le rate limit

Config Cloudflare :

```toml
name = "levois-site"
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "RECHERCHE_DB"
database_name = "levois-recherche"
database_id = "077d24f8-5efc-4787-a451-05b041ddd2f7"
```

`db/schema.sql` contient encore des commentaires parlant de Netlify / variables Netlify. Ce sont des restes historiques à corriger : l’état réel est Cloudflare Pages.

### 2.6 Variables d’environnement

Variables documentées :

```text
PUBLIC_POSTHOG_KEY
PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
RESEND_API_KEY
FORMSPREE_ENDPOINT
LEAD_TO_EMAIL
LEAD_FROM_EMAIL
LEAD_TO
LEAD_FROM
RECHERCHE_DB
RATE_LIMIT
```

Détails :

- `PUBLIC_POSTHOG_KEY` est publique par nature côté navigateur, mais il vaut mieux la gérer par env plutôt que par fallback hardcodé.
- `src/components/Analytics.astro` contient actuellement un fallback de clé PostHog publique en production. Ne pas traiter cette clé comme un secret, mais idéalement la déplacer en configuration.
- `/api/lead` accepte `LEAD_TO_EMAIL` / `LEAD_FROM_EMAIL`, avec alias `LEAD_TO` / `LEAD_FROM`.
- `/api/recherche` utilise `LEAD_TO` / `LEAD_FROM`.
- `README.md` documente surtout `LEAD_TO_EMAIL` / `LEAD_FROM_EMAIL`. Il faut harmoniser la doc et les fonctions.
- `RECHERCHE_DB` est obligatoire pour `/api/recherche`.
- `RATE_LIMIT` est optionnel : si absent, fallback mémoire par instance.

### 2.7 Auth et sécurité

Pas d’auth utilisateur.

Sécurité existante :

- endpoints POST-only ;
- validation serveur ;
- honeypot ;
- same-origin sur `/api/lead` et `/api/audit-url` ;
- rate limit par IP ;
- SSRF guards sur `/api/audit-url` ;
- pas de CORS public volontaire ;
- aucun secret envoyé au navigateur ;
- analytics sans autocapture, sans replay, sans heatmap, sans profil personne.

---

## 3. Architecture publique du site

### 3.1 Routes réelles locales

Fichiers dans `src/pages` :

```text
/
/404
/accompagnement
/audit-annonce
/carte
/composants
/confidentialite
/contact
/ma-recherche
/mentions-legales
/methode
/mouaad
/recommander
/rejoindre
/ressources
/ressources/[slug]
/situer-ma-vente
/situer-ma-vente/resultat
/votre-rue
```

### 3.2 Rôle des routes

| Route | Rôle | État local |
|---|---|---|
| `/` | Accueil buyer-first avec trois portails, preuve locale DVF, passage humain Mouaad, portes partenaires | actif local non commité |
| `/ma-recherche` | Parcours acheteur buyer-first avec lecture du projet et activations volontaires | actif local non commité |
| `/situer-ma-vente` | Sélecteur vendeur + questions déterministes | actif |
| `/situer-ma-vente/resultat` | Résultat vendeur : reformulation, signal, limite, action, ressource, transmission | actif |
| `/audit-annonce` | Audit annonce publiée : lien URL, 3 réponses, 2 actions, transmission facultative | actif |
| `/votre-rue` | Lecture DVF par adresse / rue, données locales, conversion facultative | actif |
| `/carte` | Landing QR carte de visite | actif, URL imprimée protégée |
| `/ressources` | Bibliothèque de 6 ressources vendeurs | actif |
| `/ressources/[slug]` | Pages ressources détaillées | actif |
| `/methode` | Méthode LEVOIS | actif |
| `/accompagnement` | Ce que change l’accompagnement | actif |
| `/mouaad` | Page Mouaad | actif |
| `/contact` | Formulaire contact général | actif |
| `/recommander` | Parcours SAFTI Connect / prescripteur | local seulement, non poussé |
| `/rejoindre` | Parcours candidat / équipe | local seulement, non poussé |
| `/confidentialite` | Données, droits, analytics opt-out | actif |
| `/mentions-legales` | Mentions légales | actif |
| `/composants` | Inventaire interne, `noindex` | actif local |

### 3.3 Redirections

`public/_redirects` :

```text
/le-projet            /mouaad           301
/guide                /ressources       301
/carnets-de-terrain   /ressources       301
/carnets-de-terrain/* /ressources       301
/observatoire-immo    /                 301
/vendre-a-leves       /situer-ma-vente  301
/lea                  /mouaad           301
/merci                /                 301
```

La redirection `/lea -> /mouaad` est volontaire : elle préserve l’ancienne URL sans réintroduire Léa dans le produit.

### 3.4 État production vérifié le 17 août 2026

Production : `https://levois.fr`

Vérification HEAD / réseau :

```text
/                         200
/ma-recherche/            200
/situer-ma-vente/         200
/audit-annonce/           200
/votre-rue/               200
/recommander/             404
/rejoindre/               404
/lea                      redirige vers /mouaad, résultat final 200
/api/recherche            405 sur HEAD/GET, POST-only
/api/lead                 405 sur HEAD/GET, POST-only
```

Sans slash final, Cloudflare / Astro renvoie des `308` vers les URLs canoniques.

Écart important : production fonctionne, mais ne reflète pas les dernières modifications locales non commités, notamment :

- nouvelle homepage buyer-first locale ;
- `WorldGateway` local non suivi ;
- `/ma-recherche` enrichi ;
- pages `/recommander` et `/rejoindre` locales.

---

## 4. Version locale de refonte

### 4.1 Source de vérité

Le dossier `levois-site-redesign` est la source visuelle et fonctionnelle actuelle.

Fichiers structurants :

```text
PRODUCT.md
DESIGN.md
framework.md
README.md
src/pages/index.astro
src/components/home/WorldGateway.astro
src/pages/ma-recherche.astro
src/pages/situer-ma-vente.astro
src/pages/situer-ma-vente/resultat.astro
src/pages/audit-annonce.astro
src/pages/votre-rue.astro
functions/api/recherche.ts
functions/api/lead.ts
functions/api/audit-url.ts
db/schema.sql
```

### 4.2 Accueil local `src/pages/index.astro`

Contrat design intégré :

```text
LEVOIS_HOME_BUYER_FIRST
THESIS: Faire entrer par la recherche acheteur, puis maintenir deux portes vendeurs utiles sans les diminuer.
FIRST VIEWPORT: La recherche acheteur est visible et active en premier; les deux parcours vendeurs restent lisibles, actionnables et proches.
```

Structure actuelle :

1. `WorldGateway` : trois portes de parcours, acheteur actif en premier.
2. `local-scene` : preuve DVF locale Lèves, géométrie abstraite, médiane maisons.
3. `three-gestures` : “Voir clair / Comprendre ce qui change / Choisir sans subir”.
4. `human-scene` : Mouaad comme relais humain quand l’écran ne suffit plus.
5. `side-doors` : deux mondes secondaires `/recommander` et `/rejoindre`.

### 4.3 `WorldGateway`

Fichier local non suivi :

```text
src/components/home/WorldGateway.astro
```

Trois mondes, dans l’ordre :

| Monde | Journey analytics | Route | Phrase |
|---|---|---|---|
| buying | `buyer` | `/ma-recherche` | “Je veux acheter autour de Chartres.” |
| anticipate | `seller_future` | `/situer-ma-vente` | “Je possède un bien.” |
| selling | `listing_live` | `/audit-annonce` | “Mon annonce est déjà en ligne.” |

État actif par défaut :

```html
data-active="buying"
```

Effet :

- desktop : grille `1.32fr .84fr .84fr` quand l’acheteur est actif ;
- mobile : bande horizontale scroll-snap ;
- focus / hover mettent à jour `data-active`.

### 4.4 `DecisionHero`

Fichier local non suivi :

```text
src/components/home/DecisionHero.astro
```

Il n’est pas importé par `src/pages/index.astro` au moment de la passation. C’est un prototype alternatif ou une relique de travail. Ne pas supposer qu’il est actif.

### 4.5 `JourneyImmersion`

Dossier local non suivi :

```text
src/components/journeys/
```

Composant identifié :

```text
src/components/journeys/JourneyImmersion.astro
```

Rôle : scène d’immersion de destination pour trois mondes :

- `anticipate`
- `selling`
- `buying`

Il contient des signaux visuels propres à chaque situation : ligne temporelle, champ de signaux, carte de choix.

### 4.6 Pages partenaires

Pages locales non suivies :

```text
src/pages/recommander.astro
src/pages/rejoindre.astro
```

`/recommander` :

- explique SAFTI Connect ;
- CTA externe vers SAFTI Connect ;
- code conseiller : `813785` ;
- mentionne 10 % des honoraires si la vente se conclut ;
- cite la source SAFTI Connect consultée le 7 août 2026 ;
- doit rester secondaire et ne pas concurrencer les parcours clients.

`/rejoindre` :

- présente le métier de conseiller immobilier indépendant ;
- insiste sur liberté + exigence ;
- renvoie vers `/contact?motif=equipe` ;
- ne promet aucun revenu ;
- présente Mouaad comme accompagnateur concret.

Ces pages ne sont pas en production : production répond `404` pour `/recommander/` et `/rejoindre/`.

### 4.7 Handoff humain Mouaad

L’accueil local contient un passage explicite :

```text
Puis il y a ce qu’aucun écran ne peut décider à votre place.
```

Rôle :

- rappeler que l’outil ne conclut pas tout seul ;
- faire de Mouaad le relais humain unique ;
- éviter la posture commerciale ;
- préserver la décision côté visiteur.

---

## 5. Direction artistique actuelle

### 5.1 Statut

La DA actuelle est une base, pas une version finale validée.

Elle mélange :

- nouvelle direction “trois mondes vivants” dans `DESIGN.md` ;
- tokens Tailwind encore hérités de LEVOIS V2 minéral/cobalt ;
- plusieurs explorations locales sur l’accueil et les pages partenaires.

Ne pas figer comme charte définitive sans QA visuelle.

### 5.2 Couleurs déclarées dans `DESIGN.md`

Principales :

```text
paper-day        #f7f9f5
white            #ffffff
ink-deep         #0b1730
blue-calm        #2a6ff5
cobalt           #243cff
lime             #d7ff42
coral            #f56a5a
portal-anticipate #377aca
portal-selling    #172c73
portal-buying     #d65d4f
human-sky       #e9f3ff
connect-orange  #ff5a1f
team-mist       #eef0ff
muted           #526077
```

Tokens Tailwind actuels :

```text
papier       #F2F5EF
papier-vif   #FFFFFF
encre        #111522
encre-2      #202635
brun         #58615B
argile       #243CFF
argile-lum   #D7FF42
argile-pale  #EEF0FF
beige        #C9CEC8
```

### 5.3 Typographies

Fonts auto-hébergées :

```text
public/fonts/archivo-black-latin.woff2
public/fonts/public-sans-latin.woff2
public/fonts/antonio-latin-variable.woff2
public/fonts/bricolage-grotesque-latin-variable.woff2
```

Règle cible dans `DESIGN.md` :

- Bricolage Grotesque : grandes phrases, mondes, expression ;
- Public Sans : lecture, interface, actions, preuves ;
- Archivo Black : mot-symbole LEVOIS ;
- Antonio apparaît sur `/rejoindre`, mais ce n’est pas encore harmonisé.

Incohérence à noter :

- `tailwind.config.mjs` définit encore `fontFamily.display` sur Public Sans ;
- plusieurs composants utilisent directement Bricolage / Archivo / Antonio en CSS local ;
- une passe de consolidation typo est nécessaire.

### 5.4 Formes et mouvement

Principes actuels :

- surfaces plates, pas d’ombres décoratives ;
- grandes ellipses / masques organiques ;
- portails arrondis avec silhouettes différentes ;
- actions en pilules ;
- focus visible ;
- `prefers-reduced-motion` respecté dans les composants récents ;
- mouvement informatif : élargissement de monde, pulsations, orbites, progression.

### 5.5 Responsive

Principes existants :

- header desktop sticky 78 px, mobile 68 px ;
- menu explicite sous 980 px ;
- portails home en scroll-snap horizontal sous 900 px ;
- pages longues empilées sous 720 px ;
- cibles interactives au moins 44 px dans les composants récents.

À vérifier :

- QA réelle téléphone ;
- clavier complet sur `/ma-recherche` ;
- lisibilité des très grands titres sur petits écrans ;
- compatibilité reduced-motion après toutes les animations locales.

### 5.6 Incohérences visuelles connues

- `DESIGN.md` vise Bricolage Grotesque, mais le système Tailwind historique reste Public Sans.
- `/rejoindre` utilise Antonio dans ses titres.
- `DecisionHero.astro` existe mais n’est pas utilisé.
- La navigation production diffère de la navigation locale.
- `DESIGN.md` est très ambitieux ; le code n’implémente pas encore tout de façon systémique.
- Certaines pages anciennes gardent des classes et rythmes de la V1.

---

## 6. Données et logique métier

### 6.1 Sources de données

Sources réellement utilisées :

- DVF public / DGFiP via dataset géolocalisé Etalab ;
- Géoplateforme / BAN pour géocodage `/votre-rue` ;
- réponses volontaires des utilisateurs ;
- liens d’annonce publics pour `/audit-annonce`, quand lisibles ;
- SAFTI Connect via lien externe seulement ;
- PostHog EU pour mesure d’audience privacy-first.

Sources prévues / non actives :

- exports Yanport manuels : prévus dans `PRODUCT.md`, non intégrés au runtime ;
- API Yanport : non retenue à ce stade pour coût ;
- outils SAFTI / Oméga : contexte métier, pas d’API active dans le site ;
- HeyGen / ElevenLabs : contexte vidéo, pas dans le site.

### 6.2 Données DVF

Fichiers :

```text
public/data/dvf-secteur.json
public/data/dvf-meta.json
public/data/dvf-market-summary.json
src/data/dvf-market-summary.json
```

Meta actuelle :

```text
status: ready
generatedAt: 2026-07-24T19:57:24.717Z
département: 28
communes: Lèves, Chartres, Mainvilliers, Lucé, Champhol, Le Coudray, Luisant
années incluses: 2021, 2022, 2023, 2024, 2025
count: 6318
vente la plus récente: 2025-12-31
vente la plus ancienne: 2021-01-04
licence: Licence ouverte / Etalab 2.0
```

Le fichier `src/data/dvf-market-summary.json` est utilisé au build de l’accueil.  
Le fichier `public/data/dvf-market-summary.json` est publié côté public.  
Les tests exigent qu’ils soient identiques.

### 6.3 Scripts DVF

```text
scripts/build-dvf.mjs
scripts/build-market-summary.mjs
scripts/verify-dvf.mjs
tests/market-summary.node.mjs
```

Workflow GitHub :

```text
.github/workflows/dvf-update.yml
```

Il :

1. télécharge / prépare DVF ;
2. génère `public/data/dvf-secteur.json` ;
3. régénère les repères marché ;
4. commit seulement si le dataset change réellement.

Workflow temporaire :

```text
.github/workflows/dvf-bootstrap.yml
```

Il est marqué “à supprimer avant fusion” et cible encore `claude/levois-site-vision-vmuyp1`. C’est de la dette.

### 6.4 Base D1

Table :

```sql
CREATE TABLE IF NOT EXISTS lectures_recherche (
  id                TEXT    PRIMARY KEY,
  created_at        TEXT    NOT NULL,
  src               TEXT,
  prenom            TEXT    NOT NULL,
  contact           TEXT    NOT NULL,
  commentaire       TEXT,
  situation         TEXT,
  type_bien         TEXT,
  secteur           TEXT,
  secteur_contraint INTEGER,
  budget            INTEGER,
  surface           INTEGER,
  preserves         TEXT,
  preserves_labels  TEXT,
  flexibles         TEXT,
  flexibles_labels  TEXT,
  decision_tension  TEXT,
  lecture_json      TEXT,
  consent           INTEGER NOT NULL DEFAULT 1,
  email_envoye      INTEGER NOT NULL DEFAULT 0
);
```

Index :

```sql
CREATE INDEX IF NOT EXISTS idx_created_at ON lectures_recherche (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_src        ON lectures_recherche (src);
```

Usage actuel :

- uniquement `/api/recherche` ;
- stockage des champs principaux en colonnes ;
- stockage des champs enrichis et consentements dans `lecture_json`.

Dette :

- les nouveaux consentements acheteur ne sont pas en colonnes séparées ;
- il faudra une migration si Mouaad veut filtrer facilement `consent_lecture`, `consent_matching`, `consent_contact`.

### 6.5 API `/api/recherche`

Fichier :

```text
functions/api/recherche.ts
```

Route :

```text
POST /api/recherche
```

Rôle :

- reçoit la lecture acheteur de `/ma-recherche` ;
- valide JSON, prénom, contact, consentement ;
- neutralise honeypot `site_web` ;
- rate limit : 5 demandes / minute / IP ;
- insère en D1 avant tout envoi ;
- notifie Mouaad via Resend ;
- fallback Formspree si Resend absent ou échoue ;
- marque `email_envoye=1` en D1 si notification OK.

Comportement en cas d’échec :

- D1 absent : `503`, pas de `ok:true`.
- insert D1 échoué : `500`, pas de `ok:true`.
- Resend absent : tente Formspree ; si Formspree échoue, réponse `503` malgré insert D1 réussi.
- Resend configuré mais échec : tente Formspree ; si tout échoue, la lecture reste en D1 avec `email_envoye=0`, mais l’API peut répondre `ok:true` après persistance.

Champs enrichis :

```text
communesAcceptables
tempsMax
financement
ventePrealable
horizon
project
consents
```

Les champs `project` et `consents` sont intégrés à `lecture_json`.

### 6.6 API `/api/lead`

Fichier :

```text
functions/api/lead.ts
```

Route :

```text
POST /api/lead
```

Rôle :

- contact général ;
- résultat vendeur `/situer-ma-vente/resultat` ;
- demande `/votre-rue` ;
- transmission audit annonce.

Sécurité :

- same-origin ;
- rate limit 5 tentatives / 10 minutes / IP ;
- KV optionnel `RATE_LIMIT`, fallback mémoire ;
- honeypot ;
- validation email ;
- pour `type='parcours'`, commune requise ;
- pour `type='audit-annonce'`, consentement explicite requis.

Stockage :

- pas de DB ;
- envoi email via Resend ;
- fallback Formspree si `RESEND_API_KEY` absent ;
- ne confirme pas si notification impossible.

### 6.7 API `/api/audit-url`

Fichier :

```text
functions/api/audit-url.ts
```

Route :

```text
POST /api/audit-url/
```

Rôle :

- lit une URL publique d’annonce ;
- extrait JSON-LD, OpenGraph, meta description, titre, images, prix ;
- appelle `analyseListing(snapshot)` ;
- renvoie fallback guidé si portail bloqué ou insuffisant.

Sécurité :

- same-origin ;
- rate limit 12 / 10 minutes / IP ;
- URL publique http/https seulement ;
- refuse credentials URL, localhost, `.local`, `.internal`, IP direct, ports non 80/443 ;
- max redirects : 3 ;
- max HTML : 800 KB ;
- timeout : 9 s ;
- user-agent LEVOIS.

Stockage :

- aucun stockage ;
- lien transmis à Mouaad seulement si l’utilisateur remplit ensuite le formulaire d’audit et donne consentement.

---

## 7. Parcours acheteur `/ma-recherche`

### 7.1 Fichier

```text
src/pages/ma-recherche.astro
```

État : fortement enrichi localement, non commité.

Objectif :

> Clarifier secteur, budget, surface, priorités, préparation et arbitrages d’un acheteur avant toute coordonnée.

### 7.2 État client

Objet `E` :

```text
step
situation
type
secteurContraint
secteur
communesAcceptables
tempsMax
financement
ventePrealable
horizon
budget
surface
preserves
decisionTension
lecture
prenom
contact
commentaire
consentLecture
consentMatching
consentContact
src
```

Le parcours ne persiste pas dans `sessionStorage` avant soumission. L’état est en mémoire JS côté page.

### 7.3 Étapes

Nombre total : 12 écrans dont intro et confirmation. L’UI affiche “Étape 1 sur 11” à “Étape 11 sur 11”.

0. Intro : promesse “Votre recherche doit devenir une stratégie.”
1. Situation : premier achat, agrandissement, cadre de vie, investissement, rapprochement, autre.
2. Type de bien : maison, appartement, indifférent.
3. Territoire acceptable : secteur précis ou ouvert ; Chartres ou zone chartraine ; communes acceptables ; temps maximal.
4. Préparation du projet : financement, vente préalable, horizon.
5. Budget global.
6. Surface habitable minimale.
7. Lecture de marché DVF.
8. Priorités à préserver : 1 à 3 parmi localisation, surface, cadre, état, délai, budget.
9. Arbitrage si budget sous Q1 : localisation, surface, les deux, ou passer.
10. Lecture du projet.
11. Activations volontaires et formulaire.
12. Confirmation.

### 7.4 Calcul DVF acheteur

Données chargées :

```text
/data/dvf-secteur.json
```

Fonction :

```text
analyser(data, type, secteur, budget, surface)
```

Filtres :

- exclut multi-lots (`!t.lots || t.lots <= 1`) ;
- filtre par type sauf `Indifferent` ;
- si `secteur === 'chartres'`, filtre commune Chartres ;
- sinon garde la zone chartraine complète.

Calculs :

- prix/m² transaction = `valeur / surface bâtie` ;
- Q1, médiane, Q3 ;
- nombre de transactions ;
- ventes/an approximées `Math.round(n / 5)` ;
- budget/m² = `budget / surface` ;
- surface au prix médian = `budget / median`.

Position :

```text
sous_q1       si budgetPPM2 < q1
q1_q3         si q1 <= budgetPPM2 <= q3
au_dessus_q3  si budgetPPM2 > q3
```

Limite affichée :

> Les DVF décrivent des ventes passées ; ils ne prouvent ni la disponibilité d’un bien ni la demande actuelle.

### 7.5 Lecture du projet

Écran 10 :

1. Situation : contexte, type, zone, communes acceptables, temps max, horizon.
2. Décisions prises : budget, surface, financement, vente préalable, priorités préservées.
3. Axes d’évolution : tout ce qui n’a pas été préservé.
4. Arbitrage restant : tension choisie ou absence d’arbitrage forcé.
5. Repère DVF et limite.
6. Prochaine action utile.

La prochaine action dépend notamment de :

- `ventePrealable === 'oui'` : sécuriser calendrier de vente ;
- `financement === 'a_preciser'` : valider capacité ;
- sinon : construire veille courte sur communes acceptables.

### 7.6 Activations

Écran 11 :

- recevoir ma lecture ;
- être averti d’un rapprochement pertinent ;
- demander un échange.

Règle bouton :

- prénom requis ;
- contact requis ;
- au moins une activation cochée.

Soumission :

```text
POST /api/recherche
```

Payload inclut :

```text
source: ma-recherche
src
site_web
prenom
contact
commentaire
consent: true
situation
type
secteur
secteurContraint
communesAcceptables
tempsMax
financement
ventePrealable
horizon
budget
surface
preserves
preservesLabels
flexibles
flexiblesLabels
decisionTension
lecture
project
consents
```

### 7.7 Tracking acheteur

Événements envoyés via `levois:journey` :

```text
journey_started
result_viewed
journey_completed
reading_consent_submitted
matching_consent_submitted
contact_consent_submitted
```

`journey_step_completed` est autorisé côté analytics, mais pas encore systématiquement émis à chaque étape de `/ma-recherche`.

Dette :

- ajouter l’émission de `journey_step_completed` sur chaque passage d’étape si la mesure du tunnel complet devient prioritaire ;
- QA mobile réelle ;
- QA clavier ;
- vérifier la lisibilité de l’arbitrage sous Q1 ;
- décider si la copie de lecture doit être réellement envoyée au visiteur, pas seulement notifiée à Mouaad.

---

## 8. Parcours vendeur

Il y a deux parcours vendeurs actifs :

1. `/situer-ma-vente` : vente future / en cours / signaux généraux.
2. `/audit-annonce` : annonce déjà publiée, URL-first.

### 8.1 `/situer-ma-vente`

Fichiers :

```text
src/pages/situer-ma-vente.astro
src/pages/situer-ma-vente/resultat.astro
src/data/situations.ts
src/lib/engine.ts
src/data/types.ts
src/data/resources.ts
src/data/resourceContent.ts
```

Situations :

| id | titre |
|---|---|
| `preparer` | Je prépare ma vente |
| `publiee` | Mon annonce vient d’être publiée |
| `peu-contacts` | J’ai peu de contacts |
| `visites` | J’ai des visites, mais aucune offre |
| `longtemps` | Mon bien est en vente depuis longtemps |

Chaque situation contient :

- questions ;
- options ;
- signaux pondérés ;
- fragments de reformulation ;
- règles de résultat ;
- ressource recommandée ;
- sortie `donneesInsuffisantes`.

### 8.2 Moteur `computeResult`

Fichier :

```text
src/lib/engine.ts
```

Logique :

1. agrège les signaux pondérés ;
2. compte les contributions par question ;
3. assemble une reformulation ;
4. détecte données insuffisantes si aucune réponse, trop d’inconnues ou aucun signal ;
5. classe les signaux ;
6. choisit la règle principale ;
7. ajoute une seconde piste si égalité stricte ;
8. qualifie le niveau :
   - `hypothese`
   - `repete`
   - `convergents`
   - `insuffisant`

Le moteur ne sort aucun score chiffré à l’utilisateur.

### 8.3 Persistance vendeur

Dans `/situer-ma-vente` :

- état questionnaire sauvegardé en `sessionStorage` sous `levois.parcours` ;
- résultat sauvegardé sous `levois.resultat` ;
- un code compact peut être passé en query param `?r=...` sur la page résultat.

La page résultat peut reconstruire le résultat depuis :

1. `?r=...` ;
2. `sessionStorage`.

### 8.4 Résultat vendeur

Route :

```text
/situer-ma-vente/resultat
```

Sections affichées :

- reformulation ;
- interprétation ;
- écart probable ;
- niveau de confiance qualitatif ;
- seconde piste éventuelle ;
- ce que l’on ne peut pas conclure ;
- prochaine décision utile ;
- ressource recommandée ;
- copier résumé ;
- imprimer / PDF ;
- transmission facultative à Mouaad.

Transmission :

```text
POST /api/lead
type: parcours
```

Champs requis :

- prénom ;
- nom ;
- email ;
- commune ;
- consentement.

### 8.5 `/audit-annonce`

Fichiers :

```text
src/pages/audit-annonce.astro
src/lib/audit-url.ts
src/lib/audit-blocked.ts
src/lib/audit-annonce.ts
functions/api/audit-url.ts
functions/api/lead.ts
```

Promesse :

> Collez votre annonce. 3 réponses. 2 actions.

Flux :

1. l’utilisateur colle une URL ;
2. `POST /api/audit-url/` tente de lire la page ;
3. si lisible : snapshot + analyse automatique ;
4. si bloqué : fallback guidé sans bloquer l’utilisateur ;
5. trois questions :
   - durée ;
   - étape / signal déclaré ;
   - question contextuelle selon le signal ;
6. résultat : deux actions prioritaires ;
7. ressource adaptée ;
8. transmission facultative à Mouaad via `/api/lead`.

Signaux `ListingSignal` :

```text
peu-vues
vues-sans-contact
contacts-sans-visite
visites-sans-offre
offre-recue
```

Durées :

```text
moins-7
7-30
plus-30
```

Événements audit :

```text
audit_started
audit_url_readable
audit_url_blocked
audit_stage_identified
audit_result_viewed
audit_resource_clicked
audit_human_requested
```

Limite importante :

- l’audit lit une annonce et des réponses ;
- il ne juge pas la valeur réelle ;
- il ne remplace pas la comparaison concurrentielle, l’état sur place, les contacts et la situation vendeur.

---

## 9. `/votre-rue`

Fichier :

```text
src/pages/votre-rue.astro
```

Rôle :

> Transformer une adresse ou une rue en lecture DVF locale compréhensible.

Flux :

1. l’utilisateur saisit une adresse / rue ;
2. suggestions via Géoplateforme :
   - `https://data.geopf.fr/geocodage/search`
3. la page charge :
   - `/data/dvf-secteur.json`
   - `/data/dvf-meta.json`
4. calcule les ventes autour des coordonnées ;
5. affiche une analyse animée ;
6. affiche plusieurs blocs :
   - ventes analysées ;
   - maisons vs appartements ;
   - médianes / quartiles ;
   - tendance 2021–2025 ;
   - surface effect pour appartements si données suffisantes ;
   - dernières transactions ;
   - conclusion prudente ;
7. propose trois suites :
   - parler à Mouaad ;
   - explorer ressources / parcours ;
   - recevoir une analyse personnalisée.

### 9.1 Calculs

Distances :

- haversine ;
- rayons testés : 700 m, 1500 m, 3000 m ;
- rayon final selon nombre de ventes disponibles ;
- exclusion multi-lots ;
- type dominant : maison ou appartement selon volume autour de l’adresse.

Tendance :

- médianes annuelles 2021 à 2025 ;
- régression linéaire ;
- conversion en pourcentage 2025 vs 2021 ;
- seuil de stabilité : ±3 %.

Limite :

> Une adresse donne le contexte, elle ne suffit pas à situer votre bien.

### 9.2 Transmission

Le formulaire de qualification envoie :

```text
POST /api/lead
type: votre-rue
```

Champs :

- prénom ;
- email ;
- téléphone facultatif ;
- adresse recherchée ;
- intention ;
- qualification ;
- contexte infographie.

Réponse UX :

> Mouaad prépare votre analyse personnalisée et vous l'envoie sous 24 à 48 h ouvrées.

Dette :

- bien clarifier que `/votre-rue` donne une lecture de secteur, pas une estimation ;
- vérifier conformité RGPD / conservation si les demandes deviennent nombreuses ;
- vérifier que les adresses affichées dans les transactions DVF sont acceptables côté privacy / doctrine.

---

## 10. Analytics et mesure

Fichiers :

```text
src/components/Analytics.astro
src/scripts/analytics.ts
src/lib/analytics.ts
src/lib/analytics.test.ts
```

Contrat privacy :

- PostHog EU ;
- cookieless mode always ;
- person profiles never ;
- no autocapture ;
- no heatmaps ;
- no session recording ;
- respect DNT / Global Privacy Control ;
- URLs nettoyées des query strings et fragments ;
- suppression referrer domain ;
- `mask_all_text`;
- `mask_all_element_attributes`.

Opt-out :

```text
localStorage key: levois_analytics_opt_out
page: /confidentialite#mesure-audience
```

Mapping `journeyForPath` :

| Path | Journey |
|---|---|
| `/audit-annonce` | `listing_live` |
| `/situer-ma-vente`, `/situer-ma-vente/*`, `/votre-rue` | `seller_future` |
| `/ma-recherche`, `/ma-recherche/*` | `buyer` |
| `/recommander`, `/recommander/*` | `prescriber` |
| `/rejoindre`, `/rejoindre/*` | `team_candidate` |
| autre | `brand` |

Événements principaux :

```text
route_selected
levois_journey_selected
levois_navigation_clicked
levois_form_started
levois_form_submitted
levois_page_engagement
audit_started
audit_url_readable
audit_url_blocked
audit_stage_identified
audit_result_viewed
audit_resource_clicked
audit_human_requested
journey_started
journey_step_completed
journey_completed
result_viewed
contact_consent_submitted
matching_consent_submitted
reading_consent_submitted
```

Dette :

- `journey_step_completed` est whitelisté mais pas encore émis partout ;
- les pages partenaires utilisent `data-event="partner_cta_click"` mais `analytics.ts` ne lit pas encore génériquement `data-event`.

---

## 11. Intégrations externes

### Cloudflare

Utilisé pour :

- Pages ;
- Pages Functions ;
- D1 ;
- KV optionnel ;
- domaine `levois.fr` très probablement derrière Cloudflare ;
- redirections `_redirects`.

Non vérifié dans le repo :

- DNS exact ;
- projet Pages exact côté dashboard ;
- variables prod exactes ;
- previews actuellement disponibles.

### GitHub

Repo :

```text
https://github.com/Boullourou/levois-site.git
```

Déploiement :

- `main` → production Cloudflare Pages ;
- branches → previews Cloudflare Pages.

### Resend

Voie principale pour les notifications email si `RESEND_API_KEY` est configurée.

Endpoints :

- `/api/lead`
- `/api/recherche`

### Formspree

Fallback historique :

```text
https://formspree.io/f/xnjynroj
```

Utilisé si Resend absent ou selon fallback.

### PostHog

PostHog EU via `PUBLIC_POSTHOG_HOST`.

Mesure privacy-first.

### DVF / Etalab / DGFiP

Source :

```text
https://files.data.gouv.fr/geo-dvf/latest/csv/
```

Licence :

```text
Licence ouverte / Etalab 2.0
```

### Géoplateforme / BAN

Endpoint utilisé par `/votre-rue` :

```text
https://data.geopf.fr/geocodage/search
```

### SAFTI

Utilisé comme cadre professionnel et pour SAFTI Connect.

Page externe SAFTI Connect utilisée localement :

```text
https://www.safti.fr/conseiller-safti/mouaad-boullourou/contact/safti-connect
```

Règle :

- ne jamais promettre un revenu ;
- ne publier un chiffre SAFTI Connect que sourcé à jour ;
- garder les pages partenaires secondaires.

### Yanport

Mentionné dans `PRODUCT.md` comme source future / manuelle.

État :

- pas d’API active ;
- exports manuels envisagés ;
- un export isolé ne donne pas historique complet ni prix final.

---

## 12. Dette technique et problèmes connus

### 12.1 Dette critique

1. Beaucoup de travail utile est local non commité. Risque fort de perte si le prochain agent repart de `origin/main` ou de la production seule.
2. `WorldGateway`, `/recommander`, `/rejoindre`, fonts Bricolage / Antonio sont non suivis.
3. `origin/redesign/levois-dynamic` est en retard de 11 commits par rapport au local.
4. La production ne contient pas les dernières modifications locales buyer-first.
5. Les nouveaux consentements acheteur sont dans `lecture_json`, pas en colonnes D1.

### 12.2 Dette docs

- `PROPOSITION.md` est archive, mais reste long et peut induire en erreur.
- `README.md` dit bien que `PROPOSITION.md` est supersédée, mais l’ensemble docs doit être harmonisé après commit.
- `db/schema.sql` parle encore de variables Netlify.
- `public/_redirects` contient des commentaires anciens sur `/votre-rue` protégée, alors que la production vérifiée répond `200` sur `/votre-rue/`.
- `DESIGN.md` est une direction, pas une charte appliquée parfaitement.

### 12.3 Dette technique

- `@astrojs/sitemap` installé mais intégration commentée ; sitemap manuel à maintenir.
- `DecisionHero.astro` non utilisé.
- Le fallback public PostHog est codé dans `Analytics.astro`; préférer env propre.
- `journey_step_completed` pas encore branché partout.
- `data-event` pas encore capturé génériquement.
- `dvf-bootstrap.yml` temporaire à supprimer ou neutraliser.
- Aucune vraie QA Playwright / mobile réelle dans cette passe.
- Le serveur `npm run dev` a déjà eu des soucis de résolution locale `aria-query` / `axobject-query`; le build et preview du build fonctionnent.

### 12.4 Léa

État actuel :

- recherche `Léa` / `Lea` dans le repo : plus de référence active ;
- seules occurrences utiles : mention archive/supersédée, pas Léa ;
- `/lea` redirige vers `/mouaad`.

Règle :

- ne pas réintroduire Léa ;
- Mouaad est l’unique interlocuteur humain visible.

---

## 13. À conserver / refactorer / repenser / supprimer

### À CONSERVER

- `levois-site-redesign` comme dossier de reprise.
- Doctrine : valeur avant coordonnées.
- Architecture buyer-first.
- Les deux parcours vendeurs.
- `/ma-recherche` enrichi avec lecture du projet.
- `/situer-ma-vente` + moteur déterministe.
- `/audit-annonce` URL-first + fallback guidé.
- `/votre-rue` DVF réel.
- D1 `lectures_recherche`.
- PostHog privacy-first.
- Redirection `/lea -> /mouaad`.
- Coordonnées Mouaad centralisées dans `src/config/site.ts`.
- Données DVF versionnées et tests `test:market`.

### À REFACTORER

- Harmoniser variables email (`LEAD_TO_EMAIL` / `LEAD_FROM_EMAIL` vs `LEAD_TO` / `LEAD_FROM`).
- Sortir la clé PostHog fallback de `Analytics.astro`.
- Mettre les consentements acheteur en colonnes D1 si exploitation opérationnelle.
- Nettoyer `public/_redirects` commentaires obsolètes.
- Consolider typographies et tokens.
- Supprimer ou intégrer clairement `DecisionHero`.
- Brancher `journey_step_completed`.
- Capturer `data-event` pour pages partenaires.

### À REPENSER

- Forme finale de la DA.
- UX mobile complète du triptyque de l’accueil.
- Restitution acheteur : écran seul, copie envoyée, PDF ou email ?
- Règle exacte d’alerte “rapprochement pertinent”.
- Durée de conservation des recherches acheteur.
- Définition d’une “conversation qualifiée”.
- Protocole UTM pour contenus vidéo / carrousel.

### À SUPPRIMER

- Tout actif Léa non redirectionnel s’il réapparaît.
- Anciens spots produits avant le 17 août 2026.
- `dvf-bootstrap.yml` si la branche bootstrap n’a plus d’usage.
- Logs `.codex-dev-server.*` avant commit.
- Commentaires Netlify historiques si Cloudflare est confirmé.

---

## 14. Déploiement

Production :

```text
https://levois.fr
```

Méthode :

- push / merge sur `main` ;
- Cloudflare Pages build ;
- output `dist`;
- Pages Functions depuis `functions/api`.

Config :

```text
wrangler.toml
public/_redirects
astro.config.mjs
```

Production vérifiée :

- routes principales `200` ;
- APIs POST-only ;
- pages partenaires `404`.

Preview :

- Cloudflare Pages devrait produire des previews de branches ;
- aucune URL de preview active n’est documentée dans le repo au moment de la passation.

Procédure locale :

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run build
& 'C:\Program Files\nodejs\npm.cmd' run preview
```

Procédure Cloudflare Functions locale cible :

```text
wrangler pages dev dist --d1 RECHERCHE_DB
```

Avant déploiement :

1. décider quoi committer ;
2. exclure logs et artefacts locaux ;
3. tester build ;
4. tester endpoints avec env Cloudflare ;
5. vérifier production après déploiement.

---

## 15. Arborescence utile

```text
levois-site-redesign/
  PRODUCT.md
  DESIGN.md
  framework.md
  README.md
  PROPOSITION.md
  astro.config.mjs
  tailwind.config.mjs
  wrangler.toml
  db/
    schema.sql
  functions/
    api/
      audit-url.ts
      lead.ts
      recherche.ts
  public/
    _redirects
    sitemap.xml
    data/
      dvf-secteur.json
      dvf-meta.json
      dvf-market-summary.json
    fonts/
      archivo-black-latin.woff2
      public-sans-latin.woff2
      antonio-latin-variable.woff2
      bricolage-grotesque-latin-variable.woff2
    images/
  scripts/
    build-dvf.mjs
    build-market-summary.mjs
    verify-dvf.mjs
  src/
    components/
      Analytics.astro
      Footer.astro
      Header.astro
      ResponsiveImage.astro
      home/
        WorldGateway.astro
        DecisionHero.astro
      journeys/
        JourneyImmersion.astro
    config/
      site.ts
    data/
      dvf-market-summary.json
      images.ts
      resources.ts
      resourceContent.ts
      situations.ts
      types.ts
    layouts/
      Layout.astro
    lib/
      analytics.ts
      audit-annonce.ts
      audit-blocked.ts
      audit-url.ts
      engine.ts
    pages/
      index.astro
      ma-recherche.astro
      situer-ma-vente.astro
      situer-ma-vente/
        resultat.astro
      audit-annonce.astro
      votre-rue.astro
      recommander.astro
      rejoindre.astro
      ressources/
      contact.astro
      carte.astro
      mouaad.astro
    scripts/
      analytics.ts
    styles/
      global.css
  tests/
    market-summary.node.mjs
```

---

## 16. Décisions importantes

| Décision | Raison | Impact |
|---|---|---|
| Architecture buyer-first | Priorité du système d’acquisition décidée le 17 août 2026 | L’accueil doit ouvrir par `/ma-recherche`, sans diminuer les vendeurs |
| Valeur avant coordonnées | Doctrine LEVOIS et confiance | Chaque parcours livre une restitution avant formulaire |
| Mouaad seul visage humain | Léa abandonnée | Toute page active doit renvoyer à Mouaad, pas à un persona fictif |
| Anciens spots rejetés | Ils ne correspondent plus au système | Ne pas corriger / décliner les anciennes vidéos |
| D1 pour recherches acheteur | Exploiter un fichier acheteur qualifié | `/api/recherche` doit persister avant notification |
| `/api/lead` sans DB | Contact et seller journeys restent email-first | Simple, mais moins exploitable pour CRM |
| DVF versionné | Build fiable sans réseau externe | Données reproductibles, tests possibles |
| PostHog privacy-first | Mesure utile sans trahir la promesse | Pas d’autocapture, pas de replay, URLs nettoyées |
| Pages partenaires secondaires | Recommandation et recrutement renforcent mais ne gouvernent pas LEVOIS | `/recommander` et `/rejoindre` après parcours principaux |
| Pas d’API Yanport maintenant | Coût et cadre non validés | Exports manuels seulement, pas de runtime |
| Sitemap manuel | Incompatibilité sitemap/Astro | Risque de dérive si routes changent |

---

## 17. Ce qui vient uniquement de la conversation / mémoire

Ces éléments ne sont pas tous déductibles du code seul. Les conserver.

1. Le 17 août 2026, Mouaad a validé le nettoyage et le passage à la création après avoir demandé si Léa existait encore.
2. Léa est abandonnée, pas seulement masquée.
3. Les anciens spots vidéo produits avant le 17 août 2026 sont rejetés de A à Z.
4. Les vidéos et carrousels ne doivent pas être produits tant que la destination, la restitution et la mesure ne sont pas validées ensemble.
5. La métrique directrice est la conversation humaine qualifiée, pas les vues ni les formulaires ouverts.
6. Les trois triptyques pilotes de création sont :
   - `LEVOIS-ACH-001` : budget et surface ;
   - `LEVOIS-ACH-002` : localisation ou surface ;
   - `LEVOIS-VEN-001` : beaucoup de vues, peu de contacts.
7. Aucune demande, correspondance acheteur ou statistique de demande ne doit être inventée.
8. Avatar, HeyGen et ElevenLabs restent facultatifs jusqu’à preuve d’un gain réel.
9. La promesse acheteur de travail :
   > En indiquant son secteur, son budget, la surface recherchée et ses priorités, un acquéreur obtient immédiatement une lecture de la cohérence de sa recherche, des compromis possibles et de la prochaine décision utile, avant tout contact.
10. La promesse vendeur de travail :
    > En indiquant où en est sa vente et quelques signaux concrets, un vendeur obtient immédiatement une première lecture de ce que le marché semble indiquer, de ce qui reste inconcluant et de l’action utile suivante, avant tout contact.

---

## 18. Bloc exact de handoff

### VERSION À REPRENDRE

```text
C:\Users\PC\Desktop\Obsidian Mouaad SAFTI\levois-site-redesign
branche: redesign/levois-dynamic
HEAD: b032e42 fix: declare DVF dataset license
état réel: HEAD + modifications locales non commités
```

Ne pas repartir de `levois-site`, ni de la branche locale `main`, ni de `origin/redesign/levois-dynamic` seul.

### FONCTIONNEL

- `npm test` : 7 fichiers, 41 tests OK.
- `npm run test:market` : 6 tests OK.
- `npm run build` : 24 pages OK.
- Production `levois.fr` répond sur :
  - `/`
  - `/ma-recherche/`
  - `/situer-ma-vente/`
  - `/audit-annonce/`
  - `/votre-rue/`
- APIs prod répondent `405` hors POST, donc routes présentes.
- `/lea` redirige vers `/mouaad`.

### PARTIELLEMENT FONCTIONNEL

- `/ma-recherche` localement enrichi, mais pas encore QA mobile réelle.
- Analytics parcours enrichi, mais `journey_step_completed` pas branché partout.
- D1 reçoit les enrichissements via JSON, pas encore via colonnes dédiées.
- `/recommander` et `/rejoindre` buildent localement, mais ne sont pas en production.
- DA locale fonctionne mais n’est pas consolidée comme système final.

### NON TERMINÉ

- QA visuelle mobile réelle.
- QA clavier exhaustive.
- Validation finale des promesses acheteur / vendeur.
- Convention UTM pour vidéos / carrousels.
- Définition opérationnelle d’une conversation qualifiée.
- Politique de conservation / suppression des recherches acheteur.
- Migration éventuelle D1 des consentements.
- Harmonisation docs Cloudflare / Netlify.
- Nettoyage workflow DVF bootstrap.

### NON POUSSÉ UNIQUEMENT LOCAL

Modifications tracked :

```text
.astro/settings.json
DESIGN.md
PROPOSITION.md
README.md
functions/api/recherche.ts
public/sitemap.xml
src/components/Footer.astro
src/components/Header.astro
src/pages/audit-annonce.astro
src/pages/contact.astro
src/pages/index.astro
src/pages/ma-recherche.astro
src/pages/situer-ma-vente.astro
src/scripts/analytics.ts
src/styles/global.css
```

Fichiers non suivis :

```text
public/fonts/antonio-latin-variable.woff2
public/fonts/bricolage-grotesque-latin-variable.woff2
src/components/home/DecisionHero.astro
src/components/home/WorldGateway.astro
src/components/journeys/
src/pages/recommander.astro
src/pages/rejoindre.astro
```

Ne pas committer :

```text
.codex-dev-server.err.log
.codex-dev-server.out.log
```

### RISQUES

1. Repartir de la production ferait perdre le buyer-first local.
2. Repartir de `origin/redesign/levois-dynamic` ferait perdre 11 commits déjà présents sur `origin/main`.
3. Ne pas committer les fichiers non suivis ferait disparaître les nouvelles pages et la homepage.
4. La production n’a pas `/recommander` / `/rejoindre`.
5. La doc contient encore des traces historiques Netlify et des commentaires obsolètes.
6. Les consentements acheteur sont exploitables mais pas requêtables proprement en colonnes.
7. La DA peut être confondue avec une validation finale alors qu’elle reste une base.
8. L’ancien document `PROPOSITION.md` peut réorienter vers une logique dépassée.
9. Le fallback PostHog public codé en dur doit être assumé ou déplacé.
10. Les vidéos / carrousels ne doivent pas démarrer avant validation de la destination et des mesures.

### FIRST CHECKS

À faire en premier par le prochain agent :

```powershell
cd "C:\Users\PC\Desktop\Obsidian Mouaad SAFTI\levois-site-redesign"
git status --short --branch
git branch -vv --all
& 'C:\Program Files\nodejs\npm.cmd' test
& 'C:\Program Files\nodejs\npm.cmd' run test:market
& 'C:\Program Files\nodejs\npm.cmd' run build
```

Puis :

1. relire `PRODUCT.md`, `DESIGN.md`, `framework.md`, ce handoff ;
2. inspecter `src/pages/index.astro` et `src/components/home/WorldGateway.astro` ;
3. inspecter `src/pages/ma-recherche.astro` et `functions/api/recherche.ts` ;
4. vérifier les fichiers non suivis avant tout commit ;
5. décider du commit de sauvegarde local ;
6. seulement ensuite reprendre création vidéo / carrousel.

---

## 19. Prochaine action recommandée

Avant toute création vidéo ou carrousel :

1. faire un commit de sauvegarde du travail local utile, hors logs ;
2. QA mobile réelle de `/`, `/ma-recherche`, `/situer-ma-vente`, `/audit-annonce`, `/votre-rue` ;
3. valider explicitement les deux promesses acheteur / vendeur ;
4. valider les événements de mesure ;
5. produire ensuite seulement les trois triptyques pilotes.

La création peut commencer, mais pas en aveugle : le site est maintenant assez avancé pour servir de destination, à condition de préserver l’état local et de vérifier le mobile.
