# QA cockpit — Phase 2.5

La validation combine une installation propre, les tests domaine/BFF, les Pages Functions locales, une non-régression visuelle des parcours publics, la D1 preview fictive et la recette Access distante. **Les tests locaux ne remplacent jamais Cloudflare Access.**

## Environnement retenu

- Astro : `7.2.3` ;
- Node cible : `22.23.2` via `.node-version`, moteur minimal `>=22.12.0` ;
- npm de reproductibilité : `10.9.2` ;
- Wrangler : `4.124.0` ;
- D1 cockpit preview créée : `levois-cockpit-preview-phase2-5` (`88539c49-0d41-42df-a3b1-1a269e1acbe3`) ; binding Pages restant à déployer et vérifier ;
- D1 recherche preview créée : `levois-recherche-preview-phase2-5` (`308c98e9-d484-4fdd-9892-539abb6b0ffd`), schéma présent et 0 ligne ;
- données : fixtures fictives uniquement.

## Commandes finales obligatoires

```bash
npx --yes npm@10.9.2 ci
npm audit --omit=dev --json
npm audit --json
npm test
npm run test:cockpit
npm run test:cockpit:security
npm run test:market
npm run build
git diff --check
```

Résultats finaux observés sur Astro 7.2.3 après réinstallation propre :

| Contrôle | Résultat final |
|---|---|
| `npx --yes npm@10.9.2 ci` | OK, 0 vulnérabilité annoncée |
| `npm audit --omit=dev --json` | 0 vulnérabilité |
| `npm audit --json` | 0 vulnérabilité |
| `npm test` | 96/96, 13 fichiers |
| `npm run test:cockpit` | 55/55, 6 fichiers |
| `npm run test:cockpit:security` | 16/16, 2 fichiers |
| `npm run test:market` | 6/6 |
| `npm run build` | OK, 33 pages |
| `git diff --check` | OK ; relancé avant le handoff final |

Les détails et la classification des advisories historiques sont dans [`../security/ASTRO_AUDIT_2026-08.md`](../security/ASTRO_AUDIT_2026-08.md).

## Migration Astro par paliers

La mise à niveau n’a pas été réalisée en un saut aveugle :

| Palier | Version | Tests/build | Décision |
|---|---:|---|---|
| baseline | Astro 4.16.19 | suites historiques, Pages Functions et captures établies | vulnérabilités applicables ; migration nécessaire |
| palier 1 | Astro 5.18.2 | 93/93, cockpit 52/52, sécurité 13/13, market 6/6, build 33 pages | techniquement compatible mais vulnérabilités restantes |
| palier 2 | Astro 6.4.8 | mêmes suites vertes ; migration Tailwind/Vite validée | branche Astro non maintenue et vulnérabilité `sharp` restante |
| final | Astro 7.2.3 | 96/96, cockpit 55/55, sécurité 16/16, market 6/6, build 33 pages | version retenue, audits production et complet à 0 |

Le passage Astro 6 a remplacé l’intégration Tailwind dépréciée par `@tailwindcss/vite`. La normalisation typographique explicite du cockpit a restauré la baseline sans modifier la direction artistique.

## Couverture automatisée

### Domaine, base et services

- application des migrations 0001–0006 sur une base vide ;
- exactement 22 tables métier et aucune erreur de clé étrangère ;
- création atomique/idempotente personne + projet + recherche + tâche ;
- projet et Accord TIM actifs sans prochaine action visibles comme anomalies ;
- interactions, critères append-only et révisions sans perte d’historique ;
- `to_confirm` jamais bloquant ;
- concurrence optimiste ;
- exclusion Clients d’un contact uniquement TIM ;
- vente 20/80 avec confirmation explicite ;
- location sans allocation automatique ;
- trois axes TIM indépendants ;
- termes versionnés, compensation liée à sa version ;
- paiements partiels/multiples et retry sans duplication.

### Sécurité et export

- refus fermé sans Access ;
- bypass seulement sur localhost avec variable explicite ;
- JWT falsifié, mauvais issuer, mauvaise audience, `exp`/`nbf` absents ou invalides et identité non autorisée refusés ;
- API protégée directement ;
- Origin/CSRF/content type ;
- headers `private`, `no-store`, `noindex` ;
- erreur D1 distincte d’un état vide ;
- export Markdown avec/sans coordonnées, périmètre d’un dossier, échappement et absence d’URL permanente.

## Pages Functions locales

Après build, lancer Wrangler avec l’état local fictif. Vérifier au minimum :

- `/api/cockpit/session` : `200` uniquement avec le bypass local explicite ;
- `/api/cockpit/today` : `200`, données fictives et headers privés ;
- `/api/lead` et `/api/recherche` en `GET` : `405`, comportement public inchangé ;
- aucun contenu fixture dans le HTML statique du cockpit ;
- aucune analytics/PostHog dans le cockpit.

Résultat final Astro 7 / Wrangler 4.124.0 : **validé en local**. Session et file « Aujourd’hui » répondent avec les headers privés attendus ; les routes publiques conservent leur garde de méthode. Cette preuve locale ne remplace pas la revalidation des deux bindings après le push.

## Non-régression visuelle

Routes capturées à chaque palier :

- `/` ;
- `/ma-recherche` ;
- `/situer-ma-vente` ;
- `/audit-annonce` ;
- `/votre-rue` ;
- `/recommander` ;
- `/rejoindre` ;
- `/cockpit/` avec fixtures fictives.

Viewports : desktop `1440 × 1000` et mobile `390 × 844`. Chaque capture vérifie aussi l’absence de débordement horizontal.

| Série | Répertoire | État |
|---|---|---|
| avant migration | `docs/security/screenshots/astro4-baseline/` | 16 captures présentes |
| Astro 5 | `docs/security/screenshots/astro5/` | 16 captures présentes |
| Astro 6 | `docs/security/screenshots/astro6/` | 16 captures présentes |
| Astro 7 final | `docs/security/screenshots/astro7-final/` | 16 captures présentes |

Les écarts publics observés proviennent des animations continues ; aucun changement de layout ou débordement n’a été relevé. Deltas Astro 4 → Astro 7 avec seuil de différence par canal `> 30` :

| Route | Desktop | Mobile |
|---|---:|---:|
| `/audit-annonce` | 0,387 % | 0,178 % |
| `/cockpit/` | 0,018 % | 0 % |
| `/` | 0,081 % | 0,123 % |
| `/ma-recherche` | 0,271 % | 0,144 % |
| `/recommander` | 0 % | 0 % |
| `/rejoindre` | 0,186 % | 0 % |
| `/situer-ma-vente` | 0 % | 0 % |
| `/votre-rue` | 0,006 % | 0,023 % |

Ces valeurs faibles et localisées ont été inspectées ; aucune régression visuelle fonctionnelle n’a été retenue.

## Recette fonctionnelle fictive finale

Rejouer sur la base locale ou preview isolée :

### Client

1. créer une personne et un projet fictifs ;
2. ajouter une recherche, plusieurs critères et une prochaine action ;
3. retrouver l’action dans « Aujourd’hui » ;
4. ajouter une interaction ;
5. réviser un critère et vérifier les deux événements ;
6. exporter Markdown avec puis sans coordonnées.

### Accord TIM

1. créer une vente fictive 20/80 et confirmer les allocations ;
2. faire évoluer l’opération sans changer les autres axes ;
3. enregistrer estimation, montant dû et paiement partiel ;
4. vérifier le solde et la prochaine action dans « Aujourd’hui » ;
5. créer une location fictive custom et confirmer qu’aucune allocation/fait générateur n’est automatique.

### Mobile `390 × 844`

- navigation sans zoom/débordement ;
- formulaires, création de tâche, mise à jour TIM et export accessibles ;
- clavier affiché sans action principale masquée ;
- cibles tactiles d’au moins 44 px, focus visible et reduced motion.

Résultat de la recette finale : **validée avec les seules données fictives**. Les parcours Client et TIM, la file « Aujourd’hui », l’historique, l’export Markdown et le viewport mobile `390 × 844` ont été rejoués sans action inaccessible ni débordement.

## D1 preview, binding Pages et restauration

Contrôles déjà validés sur la base D1 `levois-cockpit-preview-phase2-5` elle-même :

- migrations exactes 0001–0006 ;
- `PRAGMA foreign_key_check` sans résultat ;
- `person=3`, `project=2`, `tim_agreement=2`, `lab_observation=1` ;
- configuration Git préparée avec `COCKPIT_DB` fictive et `RECHERCHE_DB` preview vide, toutes deux non-production.

La configuration Git cible maintenant aussi `RECHERCHE_DB → levois-recherche-preview-phase2-5` (`308c98e9-d484-4fdd-9892-539abb6b0ffd`). `lectures_recherche` y existe, contient 0 ligne et la vérification d’intégrité est vide.

Constat du Dashboard Pages avant push : **la preview distante contient encore seulement `RECHERCHE_DB → levois-recherche`, sans `COCKPIT_DB`**. La séparation de l’environnement Pages n’est donc pas validée et le gate « aucune D1 production dans la preview » est rouge. Après le déploiement Git automatique, il faut inspecter les bindings distants et prouver l’absence de toute D1 de production.

Le risque de retirer `RECHERCHE_DB` aux routes publiques est donc traité sans production. Il faut encore vérifier, après le déploiement automatique, que Pages utilise effectivement les deux UUID non-production et rejouer `/api/recherche`.

Test d’export/restauration sur `levois-cockpit-restore-test-phase2-5-v2` : **validé**. Les deux bases présentent 6 migrations, 26 triggers, aucune erreur de clé étrangère et les mêmes comptages logiques (`3/2/1/11/2/2/2/0/1` pour personnes, projets, recherches, critères, conseillers, accords, allocations, paiements et observations Lab). Le snapshot complet n’étant pas directement importable à cause de l’ordre des triggers, la procédure validée reconstruit le schéma par migrations puis importe un export données seules entre dépose/recréation contrôlée des triggers. Voir [OPERATIONS.md](./OPERATIONS.md).

## Recette Cloudflare Access — bloquante

État : **NON OPÉRATIONNEL — onboarding Zero Trust partiel, aucun plan/app/policy/AUD/MFA/DNS ; previews encore publiques. Fail closed est activé.**

Les cas cryptographiques, y compris JWT falsifié et `nbf` absent/futur, sont couverts par les 16 tests sécurité. Les sept cas Access distants restent impossibles sans application et identité MFA réelles. Restrict previews reste à activer. Voir [ACCESS_SETUP.md](./ACCESS_SETUP.md).

## Contrôles de confidentialité après build

```bash
rg -n "posthog|analytics" dist/cockpit
rg -n "Cf-Access-Jwt-Assertion|COCKPIT_CSRF_SECRET|COCKPIT_AUDIT_SECRET" dist/cockpit
```

Ces recherches ne doivent révéler ni analytics actif, ni secret, ni donnée fictive ou réelle dans le HTML/JavaScript statique. Inspecter aussi l’onglet Réseau : les données doivent venir uniquement de `/api/cockpit/*` après authentification.

## Gate final

Même si toutes les suites locales passent, le résultat reste **NO-GO données réelles** tant que :

- Access/MFA n’est pas opérationnel et testé sur le hostname réel ;
- le binding de production n’est pas encore retiré du Dashboard Pages déployé ;
- la restauration fictive séparée n’est pas prouvée ;
- [REAL_DATA_CHECKLIST.md](./REAL_DATA_CHECKLIST.md) n’est pas entièrement verte.
