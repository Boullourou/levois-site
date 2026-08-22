# Phase A2 — Pilot Readiness (préparation Shadow L0)

## Objectif

Cette phase transforme la Phase A1 en état prêt pour un pilote Shadow L0 supervisé, sans données réelles, sans modèle IA, sans action métier automatique.

Flux cible validé :

```text
D1 preview de fixture
  → OPS-01 (L0)
  → COS-01 (L0)
  → briefing deterministe
  → trace pilotable
  → kill switch global/agent/capability
  → restauration contrôlée
```

## Référence

- Base commit A1 : `5ad9a99d9f67a2152533e33d0e24f42d2ebcede8`
- Branche documentaire A1 source : `codex/levois-agentic-a1-control-plane`
- Branche A2 en cours : `codex/levois-agentic-a2-pilot-readiness`
- Worktree : `.impeccable/agentic-a2-worktree`

## Périmètre A2

- Toujours **fixture-only**.
- **Pas de BUY-01 / SELL-01**.
- **Pas de connecteur externe**, pas de modèle, pas de cron, pas de queue.
- Aucune donnée client réelle ; aucun appel métier réel.
- Validation de préparation Cloudflare Access + canary preview + restauration D1.

## Sorties de cette phase

- `docs/agentic/phase-a2/*` :
  - décisions en blocage A2,
  - validation d’accès,
  - stratégie environnement preview,
  - protocole de restauration,
  - scorecard de revue,
  - gate NO-GO,
  - protocole futur de pilote réel,
  - QA + runbook.
- A2 garde-fou preview dans `functions/_lib/cockpit/agentic.ts`.
- Tests A2 intégrés à `npm run test:agentic`.

## Exécution locale (A2)

```powershell
npm test
npm run test:agentic
npm run test:cockpit
npm run test:cockpit:security
npm run test:market
npm run build
git diff --check
```

## Conventions

- Les tests/fixtures restent **fictifs**.
- `fixture_only=true` et `environment=preview` sont des conditions A2.
- Toute réussite doit rester sans mutation métier.
