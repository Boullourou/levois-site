# Cockpit privé LEVOIS V1

Ce dossier documente la tranche verticale livrée en Phase 2. Le cockpit reste dans la stack existante : une coque Astro sans donnée métier, un client TypeScript, un BFF privé dans Pages Functions et une base D1 dédiée. Le navigateur ne dialogue jamais directement avec D1.

Le périmètre couvre :

- la file de travail « Aujourd’hui » ;
- les personnes ayant au moins un projet directement accompagné ;
- les projets, recherches acquéreur, scénarios et critères historisés ;
- les interactions, tâches, échéances et décisions ;
- les Accords TIM, leurs termes versionnés, trois axes d’état indépendants, rémunérations et paiements ;
- LEVOIS Lab ;
- l’export Markdown d’une fiche client, avec ou sans coordonnées.

Il ne couvre pas encore les formulaires publics, les biens et annonces, les visites, le matching, Yanport, l’IA, Google Calendar, les pièces jointes ni une synchronisation automatique avec Obsidian.

## Architecture d’exécution

```text
/cockpit/* (HTML statique sans donnée)
        │  protégé par functions/cockpit/_middleware.ts
        ▼
client TypeScript ── commandes explicites ──► /api/cockpit/*
                                                  │
                                      validation + sécurité
                                                  │
                                                  ▼
                                   services métier + COCKPIT_DB
```

Le layout privé `src/layouts/CockpitLayout.astro` n’importe ni l’en-tête public, ni le pied de page public, ni PostHog. Les données sont chargées après authentification par le BFF. Le manifeste permet l’ajout à l’écran d’accueil, sans service worker et sans cache hors ligne.

## Écrans

La navigation comporte cinq entrées :

| Écran | Route | Usage |
|---|---|---|
| Aujourd’hui | `/cockpit/` | actions du jour, retards, anomalies sans prochaine action, retours promis, nouveaux dossiers |
| Clients | `/cockpit/clients/` | recherche et filtres, création manuelle, fiche et export |
| Accords TIM | `/cockpit/tim/` | liste filtrable, création, termes, états, rémunération, paiements et tâches |
| LEVOIS Lab | `/cockpit/lab` | capture manuelle d’enseignements anonymisés |
| Réglages | `/cockpit/reglages` | création des profils conseillers nécessaires aux Accords TIM |

Les fiches utilisent un identifiant en paramètre de requête :

- `/cockpit/clients/dossier?id=<PERSON_ID>` ;
- `/cockpit/tim/dossier?id=<TIM_AGREEMENT_ID>`.

## Démarrage local

Prérequis : Node.js, npm et une installation propre des dépendances. Le lockfile est maintenu avec npm 10.9.2 pour rester cohérent avec l’environnement Cloudflare.

```bash
npx --yes npm@10.9.2 ci
npm run db:cockpit:migrate:local
npm run db:cockpit:seed:local
```

Créer ensuite un fichier `.dev.vars` non versionné :

```dotenv
COCKPIT_CSRF_SECRET=remplacer-par-un-secret-local-de-24-caracteres-minimum
COCKPIT_AUDIT_SECRET=remplacer-par-un-autre-secret-local-de-24-caracteres-minimum
```

Puis lancer :

```bash
npm run dev:cockpit
```

Wrangler sert normalement le cockpit sur `http://127.0.0.1:8788/cockpit/`. Le bypass local n’est accepté que si `COCKPIT_LOCAL_BYPASS=1` **et** si le hostname est exactement `localhost` ou `127.0.0.1`.

La procédure a été validée sous Windows avec Wrangler : six migrations appliquées, fixtures chargées et Pages Functions servies avec la D1 locale. Les tests exécutent aussi les migrations sur une base SQLite en mémoire compatible avec l’API D1 pour obtenir une preuve indépendante. Voir [QA.md](./QA.md).

## Commandes utiles

```bash
npm run test:cockpit
npm run test:cockpit:security
npm test
npm run test:market
npm run build
git diff --check
```

```bash
npm run db:cockpit:migrate:local
npm run db:cockpit:seed:local
npm run dev:cockpit
```

## Documentation

- [ACCESS_SETUP.md](./ACCESS_SETUP.md) — Cloudflare Access, variables et procédure preview ;
- [D1_SETUP.md](./D1_SETUP.md) — migrations, tables, D1 locale et preview séparée ;
- [OPERATIONS.md](./OPERATIONS.md) — sauvegarde, restauration et exploitation ;
- [QA.md](./QA.md) — tests automatisés et recette manuelle ;
- [SECURITY_REPORT.md](./SECURITY_REPORT.md) — contrôles présents et risques résiduels ;
- [PHASE2_REPORT.md](./PHASE2_REPORT.md) — inventaire de livraison et limites.

## Garde-fous

- `COCKPIT_DB` est un binding séparé de `RECHERCHE_DB`.
- `wrangler.cockpit.toml` contient uniquement des UUID nuls : il ne peut pas désigner une base distante réelle.
- La preview reste fermée tant que Cloudflare Access, l’allowlist d’identité, les secrets et le binding preview ne sont pas tous configurés.
- Aucune migration de ce dossier ne doit être appliquée à la D1 de production sans une nouvelle validation explicite.
- `db/fixtures/cockpit-v1.sql` contient exclusivement des données de démonstration fictives.
- Aucune donnée réelle ne doit être saisie avant validation de l’accès privé et de la séparation de base.
