# Runbook A2

## Demarrer localement

```powershell
npm run build
npm run db:agentic:migrate:local
npm run db:agentic:seed:local
npm run dev:agentic
```

## Variables preview requises

```text
COCKPIT_AGENTIC_PREVIEW_ENFORCED=1
COCKPIT_ENVIRONMENT=preview
COCKPIT_AGENTIC_PREVIEW_D1_ID=<uuid-preview>
COCKPIT_AGENTIC_PREVIEW_D1_ALLOWLIST=<uuid-preview>
COCKPIT_AGENTIC_FIXTURE_ONLY=1
```

## Verifier les switches

Lire :

```text
GET /api/cockpit/agentic/switches
```

Tous les scopes absents ou stoppes signifient arret par defaut.

## Activer une demo fixture

Depuis le cockpit prive, utiliser uniquement les commandes de switches existantes :

```text
POST /api/cockpit/agentic/switches/global/start
POST /api/cockpit/agentic/switches/agent/OPS-01/start
POST /api/cockpit/agentic/switches/agent/COS-01/start
POST /api/cockpit/agentic/switches/capability/ops.read_snapshot/start
POST /api/cockpit/agentic/switches/capability/ops.evaluate_rules/start
POST /api/cockpit/agentic/switches/capability/cos.read_ops_results/start
POST /api/cockpit/agentic/switches/capability/cos.deduplicate/start
POST /api/cockpit/agentic/switches/capability/cos.rank/start
POST /api/cockpit/agentic/switches/capability/cos.compose_briefing/start
```

Payload ferme :

```json
{ "fixtureOnly": true, "fixtureId": "agentic-a1-v1", "expectedVersion": 0 }
```

## Lancer le briefing

```text
POST /api/cockpit/agentic/briefing/run
```

Payload :

```json
{ "fixtureOnly": true, "fixtureId": "agentic-a1-v1" }
```

## Stopper

Stop global :

```text
POST /api/cockpit/agentic/switches/global/stop
```

La reactivation exige une commande humaine explicite avec version attendue.

## Inspecter

```text
GET /api/cockpit/agentic/briefing/current
GET /api/cockpit/agentic/missions/:id
GET /api/cockpit/agentic/missions/:id/trace
```

## Purger les fixtures

A2 ne fournit pas de commande HTTP de purge. La purge se fait en supprimant/recreant la D1 preview de test ou en restaurant une base vierge migree puis re-seedee avec `db/fixtures/agentic-a1.sql`.

## Incident

Si une route agentique renvoie `CP_SCOPE_VIOLATION`, `CP_KILL_SWITCH_ACTIVE`, `CP_SOURCE_STALE` ou `CP_CONTROL_CHANGED`, ne pas forcer le run. Relire les switches, le binding D1 preview et les decisions ouvertes.
