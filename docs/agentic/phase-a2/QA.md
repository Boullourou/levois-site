# QA A2

## Etat courant

Les preuves locales couvrent :

- gate preview A2 ;
- fixture-only ;
- mauvaise D1 preview ;
- idempotency key trop courte ;
- kill switches ;
- absence de mutation metier ;
- absence de modele et d'appel reseau dans OPS/COS ;
- stale apres changement de donnees ;
- stale apres changement de switches ;
- stale apres restore fencing ;
- simulation J0/J+1/J+3/J+7 ;
- PII exclue des sorties agentiques.

## Commandes

```powershell
npm test
npm run test:agentic
npm run test:cockpit
npm run test:cockpit:security
npm run test:market
npm run build
git diff --check
```

## Resultats de la derniere passe

| Commande | Resultat |
|---|---|
| `npm test` | 20 fichiers, 210 tests verts |
| `npm run test:agentic` | 7 fichiers, 114 tests verts |
| `npm run test:cockpit` | 8 fichiers, 76 tests verts |
| `npm run test:cockpit:security` | 2 fichiers, 16 tests verts |
| `npm run test:market` | 6 tests verts |
| `npm run build` | 33 pages generees |
| `git diff --check` | OK |

## QA visuelle

Le bloc "Briefing LEVOIS" et le bloc discret "Agentic OS" doivent rester lisibles en mobile 390 x 844.

Verification attendue :

- pas de debordement horizontal ;
- boutons tactiles utilisables ;
- etats `available`, `stopped`, `stale`, `failed` lisibles ;
- aucune console DevOps complexe exposee.

Statut A2 local : build compile. Capture preview privee non generee dans cette passe car Access/MFA/D1 preview Cloudflare reels restent `NO-GO`.

## Limites

Access/MFA reels ne sont pas validates par les tests locaux. Le gate reel reste `NO-GO`.
