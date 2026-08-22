# Environnement preview A2 (D1 + canary)

## But

Établir une D1 preview dédiée, distincte de toute D1 production, avec gate de démarrage empêchant toute activation non conforme.

## Variables A2

- `COCKPIT_AGENTIC_PREVIEW_ENFORCED=1`
- `COCKPIT_ENVIRONMENT=preview`
- `COCKPIT_AGENTIC_PREVIEW_D1_ID=<uuid-du-binding-preview>`
- `COCKPIT_AGENTIC_PREVIEW_D1_ALLOWLIST=<uuid1>,<uuid2>`
- `COCKPIT_AGENTIC_FIXTURE_ONLY=1` (A2 fixture-only)

## Garde logique

En mode `COCKPIT_AGENTIC_PREVIEW_ENFORCED=1`, le dispatcher agentique refuse :

- non-`preview`,
- `COCKPIT_AGENTIC_PREVIEW_D1_ID` manquant,
- identifiant non autorisé par allowlist,
- D1 preview id mal formé.

Erreur de rejet : `CP_SCOPE_VIOLATION`, `CP_CONFIG_INCOMPLETE` ou `CP_CONTRACT_INVALID`.

## Vérifications préalables de canary

1. Migration 0001→0007 sur la D1 preview vierge.
2. Lecture de `sqlite_schema` pour vérifier 5 tables `agent_*`.
3. Chargement fixtures A1 dans la D1 preview uniquement.
4. Contrôle de binding id avec check-list `db id + allowlist`.
5. Appel A1: `agentic/briefing/current` en mode preview sans run en erreur tant que les envs sont incohérentes.
6. `fixture_only=true` obligatoire.

## Exemple d’arrêts de sécurité

- `COCKPIT_AGENTIC_PREVIEW_D1_ID` absent → arrêt.
- `COCKPIT_AGENTIC_PREVIEW_D1_ID` non allowlisté → arrêt.
- `COCKPIT_ENVIRONMENT` ≠ `preview` → arrêt.
- `COCKPIT_AGENTIC_FIXTURE_ONLY` différent de `1` → arrêt.

## Conformité

- A2 ne lit la D1 réelle que si une revue explicite est faite après pilote réel et si toutes les décisions ouvertes D-007/D-008/D-009/D-013/D-014/D-018 sont closes.
