# D1 du cockpit

Le BFF cockpit utilise exclusivement un binding `COCKPIT_DB` et n’a aucun fallback vers `RECHERCHE_DB`. Le projet Pages partagé sert toutefois aussi `/ma-recherche` : les bindings réellement déployés doivent donc être contrôlés au niveau de l’environnement Pages, pas seulement dans le code.

## État Phase 2.5 au 18 août 2026

| Environnement | Base | Identifiant | État | Données autorisées |
|---|---|---|---|---|
| local | `levois-cockpit-local` | UUID nul dans `wrangler.cockpit.toml` | migrations 0001–0006 testées | fixtures fictives |
| D1 cockpit preview | `levois-cockpit-preview-phase2-5` | `88539c49-0d41-42df-a3b1-1a269e1acbe3` | créée en WEUR, migrations 0001–0006 et fixtures fictives chargées | fixtures fictives uniquement |
| D1 recherche preview | `levois-recherche-preview-phase2-5` | `308c98e9-d484-4fdd-9892-539abb6b0ffd` | schéma `lectures_recherche` présent, 0 ligne, intégrité vérifiée | aucune donnée réelle |
| binding Pages Preview actuellement déployé | `RECHERCHE_DB` → `levois-recherche` | base publique/production | **STOP : `COCKPIT_DB` absent, binding de production encore visible dans le Dashboard** | aucune donnée cockpit réelle |
| restauration de test | `levois-cockpit-restore-test-phase2-5-v2` | `b1358142-fb12-4c80-a038-6ea099da4705` | restauration logique validée, 6 migrations, 26 triggers, clés étrangères saines | copie des fixtures fictives uniquement |
| première tentative de restauration | `levois-cockpit-restore-test-phase2-5` | `629bb438-21c7-45e3-8ebc-cf0ef101d80a` | import complet échoué sur l’ordre des triggers ; base de test partielle, jamais liée à Pages | aucune donnée réelle ; à supprimer après validation explicite |
| production cockpit | aucune | aucune | non créée/non bindée | aucune donnée |

L’identifiant D1 n’est pas un secret ; il est versionné dans `wrangler.toml` pour rendre la cible de preview auditable. Il n’accorde aucun accès sans les autorisations du compte Cloudflare. Les secrets Access et cockpit, eux, ne doivent jamais être versionnés.

Références officielles : [développement local D1](https://developers.cloudflare.com/d1/best-practices/local-development/), [bindings Pages Functions](https://developers.cloudflare.com/pages/functions/bindings/) et [développement local Pages Functions](https://developers.cloudflare.com/pages/functions/local-development/).

## Séparation préparée dans Git, non encore effective dans Pages

La configuration racine conserve le binding public de production :

```toml
[[d1_databases]]
binding = "RECHERCHE_DB"
database_name = "levois-recherche"
database_id = "077d24f8-5efc-4787-a451-05b041ddd2f7"
```

La configuration **à déployer automatiquement après push** redéfinit l’environnement `preview` avec deux bases non-production :

```toml
[[env.preview.d1_databases]]
binding = "RECHERCHE_DB"
database_name = "levois-recherche-preview-phase2-5"
database_id = "308c98e9-d484-4fdd-9892-539abb6b0ffd"
preview_database_id = "308c98e9-d484-4fdd-9892-539abb6b0ffd"

[[env.preview.d1_databases]]
binding = "COCKPIT_DB"
database_name = "levois-cockpit-preview-phase2-5"
database_id = "88539c49-0d41-42df-a3b1-1a269e1acbe3"
preview_database_id = "88539c49-0d41-42df-a3b1-1a269e1acbe3"
migrations_dir = "db/migrations"
```

Les bindings D1 Wrangler ne sont pas hérités entre environnements. La cible versionnée donne donc à la preview `COCKPIT_DB` fictive et une `RECHERCHE_DB` séparée, vide de données, afin de préserver le schéma de `/api/recherche` sans exposer la production. **Cette cible n’est pas encore l’état distant** : le Dashboard Pages consulté avant le push montre toujours uniquement `RECHERCHE_DB → levois-recherche`, sans `COCKPIT_DB` ni variables cockpit. Conformément au gate Phase 2.5, le statut reste STOP jusqu’au déploiement et à l’inspection.

Après le prochain déploiement Git automatique, vérifier dans **Pages → Settings → Bindings → Preview** :

1. `COCKPIT_DB` pointe vers `88539c49-0d41-42df-a3b1-1a269e1acbe3` ;
2. `RECHERCHE_DB` pointe vers `308c98e9-d484-4fdd-9892-539abb6b0ffd` ;
3. aucun binding ne pointe vers `levois-recherche` ni une autre D1 de production ;
4. les variables cockpit existent uniquement dans l’environnement visé ;
5. une requête de lecture via le cockpit retourne les fixtures fictives ;
6. la base recherche preview possède `lectures_recherche` et reste à 0 ligne avant la recette publique.

Capturer le nom des bindings et UUID, sans secret ni donnée, comme preuve. Tant que cette inspection n’est pas faite, la séparation distante n’est pas verte.

Toute commande distante cockpit doit comporter à la fois le nom exact et `--env preview`. Un warning Wrangler indiquant que le binding racine n’est pas hérité est attendu. Il ne faut surtout pas « corriger » la preview en lui redonnant la D1 `levois-recherche`.

### Routes publiques de preview

Le risque de retirer `RECHERCHE_DB` du projet Pages partagé est traité dans Git par une seconde D1 de preview : `levois-recherche-preview-phase2-5`. `db/schema.sql` y a créé `lectures_recherche`; la vérification distante retourne 0 ligne et aucune erreur d’intégrité. Cette base ne contient ni copie ni fixture de production.

Après le push, il reste obligatoire de vérifier le binding réellement déployé et de rejouer `/api/recherche` sur la preview. La présence des deux UUID dans `wrangler.toml` ne vaut pas preuve du Dashboard distant.

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

La D1 preview contient exactement ces versions dans `d1_migrations`. `PRAGMA foreign_key_check` y retourne zéro anomalie.

## Les 22 tables métier

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

Charger ensuite les fixtures fictives, une seule fois sur une base neuve :

```bash
npm run db:cockpit:seed:local
```

Le script `db/fixtures/cockpit-v1.sql` n’est pas une migration. Il contient uniquement : un dossier acquéreur fictif, un dossier vendeur fictif, un contact uniquement TIM, un Accord TIM vente fictif avec allocations confirmées, un Accord TIM location sans allocation automatique et une observation Lab fictive.

Pour vérifier une base vide sans toucher à l’état local courant :

```bash
npx wrangler d1 migrations apply levois-cockpit-local --local --config wrangler.cockpit.toml --persist-to .wrangler/state/cockpit-empty-check
```

`npm run test:cockpit` applique aussi les six migrations sur une base SQLite en mémoire, vérifie les 22 tables et lance `PRAGMA foreign_key_check`.

## Rejouer la recette distante preview

Avant chaque commande, afficher `wrangler.toml`, relire le nom et l’UUID et vérifier que la cible n’est pas `levois-recherche`.

```bash
npx wrangler d1 migrations list levois-cockpit-preview-phase2-5 --remote --config wrangler.toml --env preview
npx wrangler d1 execute levois-cockpit-preview-phase2-5 --remote --config wrangler.toml --env preview --command "SELECT name, applied_at FROM d1_migrations ORDER BY id;"
npx wrangler d1 execute levois-cockpit-preview-phase2-5 --remote --config wrangler.toml --env preview --command "PRAGMA foreign_key_check;"
```

N’appliquer les migrations que si la liste le demande :

```bash
npx wrangler d1 migrations apply levois-cockpit-preview-phase2-5 --remote --config wrangler.toml --env preview
```

Les fixtures ont déjà été chargées. Ne pas rejouer automatiquement :

```bash
npx wrangler d1 execute levois-cockpit-preview-phase2-5 --remote --config wrangler.toml --env preview --file db/fixtures/cockpit-v1.sql
```

Comptages fictifs observés après le chargement initial : `person=3`, `project=2`, `tim_agreement=2`, `lab_observation=1`. Ces nombres servent de contrôle de restauration, pas de contrat fonctionnel.

## Règles d’intégrité principales

- les historiques de consentement, de critères, d’états TIM et d’audit sont append-only ;
- un critère n’est bloquant que si les quatre attributs requis concordent et qu’une validation humaine est enregistrée ;
- une révision de critère conserve l’événement remplacé ;
- un seul successeur peut remplacer un événement de critère ;
- un projet ou Accord TIM actif sans prochaine action reste requêtable comme anomalie ;
- les termes TIM sont versionnés et les allocations sont enregistrées en points de base entiers ;
- une location ne reçoit aucune allocation automatique ;
- les trois axes TIM sont historisés séparément ;
- les montants utilisent des unités monétaires mineures entières ;
- un paiement est unique par compensation et clé d’idempotence ;
- les contraintes et triggers interdisent les références croisées entre agrégats incohérents.

## Interdictions

- aucune donnée réelle dans la D1 preview ;
- aucune migration cockpit appliquée à une D1 de production ;
- aucun binding `RECHERCHE_DB` de production ajouté à `env.preview` ; seule la D1 preview `308c98e9-d484-4fdd-9892-539abb6b0ffd` est autorisée ;
- aucune copie d’export D1, secret, JWT ou fixture réelle dans Git ;
- aucune utilisation distante de `wrangler.cockpit.toml`, qui contient volontairement un UUID nul.
