# LEVOIS — levois.fr

LEVOIS aide à clarifier un achat, une vente ou un projet de vente et d’achat. Chaque diagnostic comporte **5 questions**, puis demande le prénom et l’adresse e-mail pour recevoir et consulter la synthèse complète. Cette étape est annoncée dès l’entrée du parcours. La synthèse distingue le constat, l’angle mort à surveiller et la prochaine étape utile. Deux ressources sont proposées selon les réponses.

La demande enregistre le projet et les coordonnées auprès de Mouaad. Le téléphone reste facultatif : le renseigner demande un échange direct au sujet de ce projet. Aucun abonnement à une newsletter n’est demandé. Dès que le serveur confirme l’enregistrement, la synthèse s’affiche et peut être téléchargée, même si l’envoi par e-mail échoue ; cet échec est alors signalé et une nouvelle tentative est proposée lorsque son état le permet. Les lectures historiques et les sauvegardes déjà détenues restent consultables.

Ce document décrit l’architecture active au **25 octobre 2026**. Les anciens documents de cadrage et recettes restent disponibles comme archives ; ils ne décrivent pas nécessairement les parcours actifs.

## Socle technique

- **Astro 7** génère les pages statiques dans `dist/`. La configuration actuelle n’utilise pas d’adaptateur SSR : les traitements serveur sont assurés par les **Cloudflare Pages Functions** dans `functions/`.
- **TypeScript**, CSS du site et intégration **Tailwind CSS 4** via Vite. La charte publique active utilise un fond écru, des verts profonds et un orange assombri pour le contraste. Les polices **Plus Jakarta Sans** et **Satoshi** sont auto-hébergées dans `public/fonts/`.
- Les questionnaires et la lecture fonctionnent dans le navigateur. Le contexte anonyme reste dans `sessionStorage`. Les lectures exportées et les anciens contextes conservent leur version.
- **Cloudflare D1** conserve les données transmises volontairement et les données des outils professionnels. Les séries DVF sont préparées séparément, versionnées et servies en JSON.
- **Vitest**, SQLite, workerd/Miniflare et **Playwright/Axe** couvrent le domaine, les API et les parcours. Les versions reproductibles sont dans `package-lock.json`.

## Installer et vérifier

Utiliser la version Node de `.node-version` (24.14.1 lors de cette mise à jour), puis :

```powershell
npm ci
npm run dev
```

Le serveur Astro de développement démarre normalement sur `http://localhost:4321`. Il ne remplace pas le runtime des Pages Functions.

```powershell
npm run check
npm test
npm run test:market
npm run build
```

- `check` vérifie les types TypeScript et les composants Astro.
- `test` comprend les diagnostics, la compatibilité historique, les API, l’import et les tests d’envoi simulé. Le test de capture utilise aussi une **vraie base D1 locale dans workerd**, avec le schéma SQL livré, sans accès réseau extérieur.
- `test:market` contrôle les règles de calcul DVF.
- `build` produit le site compilé sans publier ni modifier les données distantes.

Sous Windows, SQLite/workerd peut échouer avec `internal error` si `TEMP` désigne un chemin de worktree trop long. Pour les tests, choisir un dossier temporaire court :

```powershell
$env:TEMP = Join-Path $env:LOCALAPPDATA 'Temp\levois-tests'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null
npm test
```

### Recette sur le site compilé

Après le build, lancer dans un terminal :

```powershell
npm run preview -- --host 127.0.0.1 --port 4346
```

Dans un second terminal :

```powershell
$env:LEVOIS_TEST_URL = 'http://127.0.0.1:4346'
npm run test:public
$env:LEVOIS_QA_BASE = $env:LEVOIS_TEST_URL
node scripts/qa-resume-final.mjs
```

La recette publique utilise le DOM compilé, sans importer de modules `/src` depuis le navigateur. Elle couvre les trois diagnostics à 320, 390 et 1440 px, les corrections, la restitution et les transmissions simulées. La recette de reprise ajoute import, remplacement explicite, code de reprise simulé, clavier et fonctionnement sans JavaScript. Les preuves sont écrites sous `artifacts/`, exclu de Git. Les scripts refusent un serveur distant et n’envoient pas de demande réelle.

Chrome est utilisé par défaut sur Windows. Sur les autres plateformes, installer Chromium avec `npx playwright install chromium`. Le workflow `.github/workflows/site-checks.yml` exécute les vérifications et la recette compilée sur les pull requests et les pushes vers `main`.

## Où modifier quoi

| Fonction | Fichiers actifs |
|---|---|
| Coordonnées et identité professionnelle | `src/config/site.ts` |
| Accueil | `src/pages/index.astro`, `src/components/home/v7-content.html`, `src/styles/home-v7.css` |
| Structure et styles publics | `src/layouts/Layout.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/styles/v7.css`, `src/styles/v7-production.css` |
| Questions, synthèses et choix des deux ressources | `src/lib/experience/diagnostics.ts` |
| Affichage des questionnaires | `src/components/ExperienceJourney.astro`, `src/scripts/experience-journey.ts` |
| Restitution, capture et continuité locale | `src/pages/lecture.astro`, `src/scripts/diagnostic-reading.ts`, `src/scripts/diagnostic-capture.ts`, `src/lib/experience/diagnostic-delivery.ts`, `src/styles/diagnostics.css` |
| Contexte, versions et export | `src/lib/experience/context.ts`, `types.ts`, `export.ts` |
| Reprise de session, import et accès protégé | `src/pages/reprendre.astro`, `src/scripts/experience-resume.ts`, `src/lib/experience/resume.ts` |
| Ressources éditoriales | `src/data/resources.ts`, `src/data/resourceContent.ts`, `src/pages/ressources/` |
| Enregistrement et envoi des synthèses | `functions/api/experience/actions.ts`, `functions/_lib/experience/email-leads.ts` |
| API de reprise par code | `functions/api/experience/reprise.ts` |
| Données communales et présentation DVF | `src/data/dvf-market-summary.json`, `src/lib/local-market.ts`, `src/pages/prix-immobilier/[commune].astro`, `src/components/LocalObservatory.astro` |
| Analyse des ventes autour d’une adresse | `src/pages/votre-rue.astro`, `public/data/dvf-secteur.json`, `public/data/dvf-meta.json` |

Les anciens modèles de `src/data/situations.ts`, `src/lib/engine.ts` et les parcours longs ne pilotent pas les nouveaux diagnostics. Certains restent nécessaires pour lire des liens, exports ou réponses historiques : ne pas les supprimer sans vérifier leurs usages et tests de compatibilité. Les anciennes recettes sont identifiées dans `scripts/verify-public-pre-diagnostics.mjs` et `scripts/verify-public-legacy.mjs`.

Les médias publiés se trouvent notamment dans `public/v7/`, `public/images/`, `public/assets/` et `public/fonts/`. Conserver leurs chemins lors d’une mise à jour.

## DVF : une source calculée commune

Les pages communales et l’observatoire utilisent le même `dvf-market-summary.json`. Les séries de ventes, médianes et quartiles ne doivent plus être recopiées à la main dans les pages éditoriales. `src/lib/local-market.ts` ajoute les informations de présentation et les précautions liées aux faibles effectifs.

```powershell
npm run data:dvf
npm run data:market
npm run data:verify
npm run test:market
```

Ces commandes régénèrent les fichiers de données : les lancer lors d’une mise à jour DVF, pas pour une simple modification de texte ou de style. `data:market` produit les copies concordantes dans `src/data/` et `public/data/`. Le workflow `dvf-update.yml` prépare les actualisations. Distinguer la période des ventes, la date de production des données et la date de relecture éditoriale ; une révision de page ne constitue pas une nouvelle extraction.

La base DVF fournit des repères sur les transactions retenues. Elle ne démontre pas à elle seule un délai de commercialisation, une décote DPE ni la valeur d’un logement particulier. Toute nouvelle affirmation chiffrée doit préciser sa source, sa période et sa méthode.

## Données, e-mails et reprise

L’action `synthesis-email`, avec le consentement `2026-10-25-arbitrage`, enregistre le contexte approuvé, la synthèse, le prénom, l’e-mail et l’éventuelle demande d’échange téléphonique dans `experience_email_leads`, avant toute tentative d’envoi. Le prénom et le téléphone sont conservés dans `consent_json.contact`, avec l’intention explicite `phoneExchangeRequested`. Ils ne sont pas ajoutés au contexte anonyme ni aux exports de lecture. Cette évolution réutilise le schéma existant.

La copie visiteur et la notification à Mouaad ont des états indépendants. Une acceptation par le prestataire ne prouve ni réception ni lecture. Un résultat incertain n’est jamais réémis automatiquement ; les nouvelles tentatives autorisées réutilisent le même payload et la même référence. Le serveur rejette la réutilisation d’une référence avec des coordonnées ou un contenu modifiés.

Pour les nouvelles lectures `email-arbitrage-v1`, l’affichage complet attend une réponse positive du serveur avec `saved: true` et la référence attendue. L’état d’envoi de l’e-mail ne bloque pas une demande déjà enregistrée. Le marqueur de continuité en `sessionStorage` conserve uniquement des identifiants de lecture, aucune coordonnée ; il ne donne accès à aucune donnée serveur. Lorsque le stockage du navigateur est bloqué, le parcours ouvert continue en mémoire. L’import explicite d’une sauvegarde complète permet de la relire sans demander à nouveau les coordonnées.

L’ancien contrat `synthesis-email` avec consentement `2026-10-25` reste compatible avec son payload et son empreinte d’origine. L’ancien `email-copy` reste également compatible : il envoie seulement une copie au visiteur, sans créer de lead. Les actions historiques de relecture et d’échange restent distinctes. Les endpoints historiques `/api/lead` et `/api/recherche` peuvent encore servir leurs écrans de compatibilité ; ils ne pilotent pas la nouvelle capture de synthèse.

| Réglage existant | Usage |
|---|---|
| `RECHERCHE_DB` | Binding D1 pour les demandes de synthèse, dossiers de continuité et accès protégés |
| `RESEND_API_KEY` | Envoi de la synthèse au visiteur et des codes de reprise ; expéditeur Resend vérifié requis |
| `LEAD_FROM_EMAIL`, `LEAD_TO_EMAIL` | Expéditeur et destinataire professionnels ; les alias historiques `LEAD_FROM`, `LEAD_TO` restent reconnus |
| `FORMSPREE_ENDPOINT` | Relais professionnel existant si Resend n’est pas configuré ; jamais un substitut à l’envoi visiteur ou au code OTP |
| `EXPERIENCE_ACCESS_SECRET` | Secret nécessaire à la reprise protégée par code, avec la D1 et Resend |
| `EXPERIENCE_PUBLIC_ORIGIN` | Origine publique des liens partagés, si explicitement configurée |
| `RATE_LIMIT` | KV optionnel pour une limitation partagée ; sans lui, limitation technique en mémoire de l’instance |

Ne pas copier de secrets dans Git ni dans les rapports. Les réglages Cloudflare existants doivent être vérifiés et conservés lors de la publication. Sans stockage disponible, aucune demande de synthèse n’est confirmée ni envoyée. Sans Resend, le projet peut être enregistré, mais l’envoi visiteur reste explicitement indisponible.

### Schémas D1

Les schémas publics concernent **RECHERCHE_DB** : `db/schema.sql` pour l’historique, `db/experience.sql` pour les dossiers et accès protégés, puis **`db/experience-email-leads.sql` pour la nouvelle capture**. Ce dernier est additif et réexécutable ; il doit être appliqué à la base publique existante avant de publier le nouveau formulaire. Les migrations `db/migrations/` concernent le cockpit privé et ne doivent pas être confondues avec cette base.

La procédure, le contrat API et les règles de consultation/suppression sont décrits dans [docs/SYNTHESE_EMAIL_2026-10-25.md](docs/SYNTHESE_EMAIL_2026-10-25.md). L’application distante reste une opération explicite : les tests et le build ne l’effectuent pas. Aucun effacement automatique ni durée de conservation arbitraire ne sont annoncés.

### Démonstration locale avec Functions

```powershell
npm run dev:experience
```

Ce lanceur reconstruit le site puis utilise une D1 locale isolée sur `http://127.0.0.1:4333`. Il applique les trois schémas publics, n’importe pas les secrets de production et désactive l’envoi des e-mails et codes. `astro preview` seul ne sert pas les Pages Functions.

Le cockpit privé utilise ses propres services, contrôles Cloudflare Access/CSRF et le binding `COCKPIT_DB`. Voir [docs/cockpit/README.md](docs/cockpit/README.md). La présence du code cockpit ne garantit pas l’activation de ses bindings dans chaque environnement ; ne pas élargir la configuration de production pour une modification publique.

## Textes de l’accueil

L’option 3 « Retrouver de la place pour vivre », validée le 26 octobre 2026, est intégrée dans `src/components/home/v7-content.html`. Les textes complets des options 1 « Choc & Protection » et 2 « Vérité de Terrain » sont conservés pour les futures pages dédiées et les carrousels dans [l’archive de copywriting](docs/COPYWRITING_ACCUEIL_2026-10-26.md).

## Publication et propriété

Le dépôt est `Boullourou/levois-site`, projet Cloudflare Pages `levois-site`. La branche `main` alimente la production `levois.fr` via l’intégration Git. Les redirections historiques sont dans `public/_redirects` ; `/reprendre` est désormais une vraie page et ne doit plus rediriger vers le vendeur. Vérifier le déploiement et ses routes après le push, en conservant les réglages existants.

Code, créations, contenus, domaine, données et comptes techniques appartiennent à Mouaad Boullourou. Conserver les fichiers de licence associés aux polices et ressources distribuées.
