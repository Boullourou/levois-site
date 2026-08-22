# Restore drill A2

## Statut

`STATUS: TESTED LOCALLY / REAL PREVIEW NOT EXECUTED`

Le drill A2 reste fixture-only. Il ne constitue pas une procedure de reprise production.

## Objectif

Prouver qu'une D1 preview de test peut etre reconstruite et que les anciennes missions agentiques ne continuent pas silencieusement apres restauration.

## Procedure locale

1. Creer une D1 de test vide.
2. Appliquer les migrations `0001` a `0007`.
3. Charger uniquement `db/fixtures/agentic-a1.sql`.
4. Demarrer les switches A2 explicitement.
5. Executer `OPS-01` puis `COS-01`.
6. Verifier le briefing courant.
7. Simuler une restauration en incrementant le fencing `restore_epoch` et la version des switches dans une base de test.
8. Relire le briefing courant.

## Resultat attendu

- Les tables metier restent identiques avant/apres run.
- Les cinq tables agentiques restent coherentes.
- Les traces restent reconstructibles depuis `mission_id`.
- Les switches conservent ou retrouvent explicitement un etat sur.
- Le briefing precedent devient `stale` si le fencing de restauration change.
- Aucune ancienne mission ne reprend automatiquement.

## Preuve automatisee

Test: `src/lib/cockpit/server/agentic-service.integration.test.ts`

Cas couvert:

- `invalidates a completed briefing when a restore drill bumps switch fencing epochs`
- `simulates J0, J+1, J+3 and J+7 shadow briefings without changing business data`

## Limite

Le test local simule le fencing de restauration dans SQLite. Avant toute preview reelle, il faudra executer le meme scenario sur une D1 preview Cloudflare separee, avec export/restauration documentes par Mouaad.
