# D1 du cockpit

Le cockpit utilise un binding `COCKPIT_DB` dédié. Il ne réutilise pas `RECHERCHE_DB`, qui reste lié au parcours public `/ma-recherche`.

Trois environnements doivent rester séparés :

| Environnement | Base | Données autorisées |
|---|---|---|
| local | état Wrangler sous `.wrangler/state/cockpit` | fixtures fictives ou saisies de test fictives |
| preview | D1 Cloudflare séparée, créée manuellement | fixtures fictives uniquement |
| production | aucune D1 cockpit configurée dans cette phase | aucune migration, aucune donnée |

`wrangler.cockpit.toml` contient des identifiants `00000000-0000-0000-0000-000000000000`. Ce fichier sert au développement local et ne référence volontairement aucune D1 distante.

Références officielles : [développement local D1](https://developers.cloudflare.com/d1/best-practices/local-development/), [bindings Pages Functions](https://developers.cloudflare.com/pages/functions/bindings/) et [développement local Pages Functions](https://developers.cloudflare.com/pages/functions/local-development/).

## Migrations

Les six migrations sont additives, numérotées et sans donnée métier :

| Migration | Contenu |
|---|---|
| `0001_cockpit_identity.sql` | identité, coordonnées normalisées, historique minimal des consentements |
| `0002_cockpit_projects.sql` | projets, parties, relations achat/vente, recherche et scénarios |
| `0003_cockpit_search_history.sql` | décisions et événements de critères append-only |
| `0004_cockpit_tim_core.sql` | conseillers, accords TIM, parties, termes versionnés et allocations |
| `0005_cockpit_workflow_tim_finance.sql` | interactions, tâches, rémunérations, paiements et événements des trois axes TIM |
| `0006_cockpit_governance_integrity.sql` | audit, LEVOIS Lab et contraintes d’intégrité inter-tables |

## Les 22 tables créées

Noyau client :

1. `person`
2. `contact_method`
3. `consent_event`
4. `project`
5. `project_party`
6. `project_relationship`
7. `buyer_search`
8. `search_scenario`
9. `criterion_event`
10. `interaction`
11. `task`
12. `decision`

Accords TIM :

13. `advisor_profile`
14. `tim_agreement`
15. `tim_agreement_party`
16. `tim_agreement_terms`
17. `tim_agreement_allocation`
18. `tim_status_event`
19. `tim_compensation`
20. `tim_payment`

Pilotage :

21. `audit_event`
22. `lab_observation`

Aucune table bien, annonce, visite, offre, matching, IA, fichier ou synchronisation n’est créée.

## Initialisation locale

Installation propre :

```bash
npx --yes npm@10.9.2 ci
```

Appliquer toutes les migrations sur la D1 locale persistée :

```bash
npm run db:cockpit:migrate:local
```

Charger ensuite les fixtures fictives, une seule fois sur cette base :

```bash
npm run db:cockpit:seed:local
```

Le script de fixtures n’est pas une migration. Il contient : un dossier acquéreur fictif, un dossier vendeur fictif, un contact uniquement TIM, un Accord TIM vente fictif avec allocations confirmées, un Accord TIM location sans allocation automatique et une observation Lab fictive.

Pour vérifier une base vide sans toucher à l’état local courant, utiliser un autre répertoire de persistance :

```bash
npx wrangler d1 migrations apply levois-cockpit-local --local --config wrangler.cockpit.toml --persist-to .wrangler/state/cockpit-empty-check
```

Puis exécuter `npm run test:cockpit`, qui applique également les six fichiers sur une base SQLite en mémoire, vérifie les 22 tables et lance `PRAGMA foreign_key_check`.

## D1 de preview séparée

Cette procédure est manuelle et ne doit viser que l’environnement de preview :

1. Créer une nouvelle D1 portant un nom explicitement associé au cockpit preview.
2. Conserver son identifiant hors Git.
3. Ajouter dans Pages, environnement **Preview**, un binding nommé exactement `COCKPIT_DB` vers cette base.
4. Créer un fichier Wrangler temporaire et non versionné sous `.wrangler/` avec le nom et l’UUID de cette base, ainsi que `migrations_dir = "db/migrations"`.
5. Relire le nom et l’UUID du fichier avant toute commande distante.
6. Appliquer les migrations avec :

```bash
npx wrangler d1 migrations apply <PREVIEW_DB_NAME> --remote --config <CONFIG_PREVIEW_NON_VERSIONNEE>
```

7. Vérifier la table de suivi des migrations et le nombre de tables.
8. Si une démonstration est nécessaire, charger `db/fixtures/cockpit-v1.sql` uniquement après avoir confirmé une deuxième fois qu’il s’agit de la D1 preview :

```bash
npx wrangler d1 execute <PREVIEW_DB_NAME> --remote --config <CONFIG_PREVIEW_NON_VERSIONNEE> --file db/fixtures/cockpit-v1.sql
```

9. Configurer ensuite Cloudflare Access selon [ACCESS_SETUP.md](./ACCESS_SETUP.md).

Ne jamais remplacer les placeholders de `wrangler.cockpit.toml` par des identifiants réels. Ne jamais utiliser `--remote` avec un nom ambigu. Aucune commande distante n’est exécutée automatiquement par les scripts npm de cette phase.

## Règles d’intégrité principales

- les historiques de consentement, de critères, d’états TIM et d’audit sont append-only ;
- un critère n’est bloquant que si les quatre attributs requis concordent et qu’une validation humaine est enregistrée ;
- une révision de critère conserve l’événement remplacé ;
- un seul successeur peut remplacer un événement de critère ;
- un projet ou Accord TIM actif sans prochaine action reste requêtable comme anomalie ;
- les termes TIM sont versionnés ; les allocations sont enregistrées en points de base entiers ;
- une location ne reçoit aucune allocation automatique ;
- les trois axes TIM sont historisés séparément ;
- les montants utilisent des unités monétaires mineures entières ;
- un paiement est unique par compensation et clé d’idempotence ;
- les contraintes et triggers interdisent les références croisées entre agrégats incohérents.
