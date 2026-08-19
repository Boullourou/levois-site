# Migration D1 A1

## 1. Portée

Fichier : `db/migrations/0007_agentic_a1_control_plane.sql`.

La migration est additive. Elle s'applique après `0001` à `0006` et crée exactement cinq tables techniques préfixées `agent_`. Elle ne modifie aucune colonne, ligne, clé, index ou contrainte des tables métier existantes.

## 2. Tables

| Table | Responsabilité | N'est pas |
|---|---|---|
| `agent_mission` | État courant compact d'une mission OPS ou COS | un projet, une tâche ou une décision métier |
| `agent_trace` | Ledger d'exécution append-only et corrélé | un journal client ou une source métier |
| `agent_control_switch` | État versionné d'un switch global, agent ou capability | une permission qu'un agent peut s'accorder |
| `agent_ops_shadow_finding` | Observation déterministe non souveraine | une anomalie métier confirmée ou une tâche |
| `agent_cos_briefing_item` | Ligne classée d'un briefing Shadow | une prochaine action validée |

Il n'existe aucune sixième table implicite pour les tentatives, approbations, coûts ou liens. Les champs nécessaires restent dans `agent_mission` et `agent_trace`.

## 3. Invariants du schéma

### `agent_mission`

- types fermés : `ops.shadow_scan.v1` et `cos.daily_briefing.v1` ;
- agents fermés : `OPS-01` et `COS-01` ;
- capability set exact par mission ;
- `fixture_only=1`, `autonomy_level=L0`, tentative unique ;
- budget logique JSON obligatoire ;
- coût monétaire fixé à zéro et `not_applicable` ;
- timeout fini obligatoire ;
- transitions limitées au cycle A1 ;
- mission terminale non réouvrable ;
- maximum de sept items pour une mission COS terminée.

### `agent_trace`

- ordre unique par stream ;
- idempotence unique ;
- append-only par triggers `no_update` et `no_delete` ;
- aucune monnaie, devise, PII ou payload libre nécessaire ;
- le stream peut documenter une mission ou une commande de switch sans table supplémentaire.

### Findings et briefing

- parent OPS/COS valide exigé par trigger ;
- fingerprint unique par mission ;
- règle, raison, action et priorité contraintes ;
- finding et item immuables ;
- un seul item par rang, groupe et scope ;
- `rank BETWEEN 1 AND 7`.

## 4. Séparation avec les tables métier

Les clés étrangères de `0007` ne ciblent que des tables agentiques. Les triggers `agent_*` ne s'exécutent que sur ces cinq tables et ne contiennent aucune écriture vers `project`, `task`, `interaction`, `tim_agreement` ou une autre table métier.

La preuve d'intégration :

1. applique `0001` à `0006` ;
2. insère des lignes métier fictives ;
3. capture schéma et contenu métier ;
4. applique `0007` ;
5. exige une égalité profonde du métier avant/après ;
6. inspecte cibles de foreign keys et de triggers.

## 5. Index strictement nécessaires

- idempotence et dernière mission par type ;
- missions non terminales par agent/statut ;
- ordre de trace et audit temporel ;
- unicité du scope de switch ;
- findings par mission/scope ;
- items de briefing par rang/groupe/scope.

Aucun index n'est ajouté aux tables métier dans cette tranche.

## 6. Fixture SQL

Fichier : `db/fixtures/agentic-a1.sql`.

La fixture utilise uniquement des identifiants opaques explicitement balisés `FX` et les cas structurés A à I. Les textes requis par le schéma métier sont explicitement fictifs. La projection OPS ne les transporte pas.

La fixture :

- ne crée aucune personne ni coordonnée ;
- ne contient aucun montant TIM ;
- ne crée aucune mission ;
- ne crée aucune trace ;
- ne crée surtout **aucun switch**.

Une ligne absente de `agent_control_switch` vaut `stopped`. Le chargement de la fixture ne peut donc pas activer le système.

## 7. Application locale seulement

```powershell
npm run db:agentic:migrate:local
npm run db:agentic:seed:local
```

Ces scripts utilisent `--local`, le nom `levois-cockpit-local`, un UUID nul et l'état isolé `.wrangler/state/agentic-a1`. Aucune commande de ce document ne doit être réutilisée avec `--remote`.

## 8. Vérifications locales

```powershell
npx wrangler d1 execute levois-cockpit-local `
  --local `
  --config wrangler.cockpit.toml `
  --persist-to .wrangler/state/agentic-a1 `
  --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'agent_%' ORDER BY name"

npx wrangler d1 execute levois-cockpit-local `
  --local `
  --config wrangler.cockpit.toml `
  --persist-to .wrangler/state/agentic-a1 `
  --command "SELECT count(*) AS switch_count FROM agent_control_switch"
```

Attendu après migration et fixture : cinq noms de table et `switch_count=0`.

## 9. Retour arrière

Il n'existe volontairement aucune migration destructive inverse. La base A1 est fixture-only : le reset supporté consiste à supprimer **uniquement l'état local explicitement résolu**, puis à recréer la base avec toutes les migrations et fixtures. Voir [RUNBOOK.md](./RUNBOOK.md).
