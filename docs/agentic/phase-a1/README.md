# Phase A1 — Control plane minimal, OPS-01 Shadow et briefing COS-01

Statut documentaire : **état implémenté dans la branche A1 au 2026-08-19**.

Cette tranche démontre exclusivement le flux suivant sur des données fictives :

```text
D1 locale de fixture
  → OpsSnapshotV1 minimisé
  → OPS-01 applique des règles déterministes
  → résultat technique traçable
  → COS-01 déduplique et ordonne
  → briefing déterministe de 0 à 7 éléments
  → lecture humaine en SHADOW MODE
```

Elle n'active aucune autonomie métier. Les mots « agent », `OPS-01` et `COS-01` désignent ici des capacités de code déterministes, sans modèle IA.

## 1. Garanties A1

- `fixture_only=true` est obligatoire.
- Autonomie limitée à `L0 — Observation`.
- Budget monétaire : zéro.
- Modèle IA : aucun.
- Réseau agentique : aucun.
- Retry automatique : zéro.
- Timeout : fourni explicitement par chaque mission ou scénario.
- Déclenchement : manuel uniquement.
- Sortie : findings techniques et briefing Shadow.
- Mutation métier : aucune.
- Une ligne agentique n'est jamais une vérité métier.
- Une panne agentique ne retire aucune capacité manuelle au cockpit.
- Un switch absent vaut `stopped`.
- Mouaad reste l'unique autorité humaine de démarrage, d'arrêt et de réactivation.

## 2. État réellement implémenté

| Composant | État | Preuve principale |
|---|---|---|
| Migration additive | Implémentée | `db/migrations/0007_agentic_a1_control_plane.sql` |
| Cinq tables agentiques | Implémentées | tests de migration et introspection SQLite |
| Fixture fictive A1 | Implémentée | `db/fixtures/agentic-a1.sql` |
| Noyau déterministe | Implémenté | `src/lib/agentic/index.ts` |
| Projection `OpsSnapshotV1` | Implémentée | `src/lib/cockpit/server/agentic-snapshot.ts` |
| Sept règles OPS | Implémentées ; règle 004 désactivée | tests unitaires et intégration fixture |
| Déduplication, ordre COS, maximum 7 | Implémentés | tests unitaires et intégration fixture |
| Kill switch dans le noyau pur | Implémenté et testé aux checkpoints | tests `test:agentic` |
| Persistance orchestrée des missions et traces | Implémentée et testée | `agentic-store.ts`, `agentic-service.ts`, tests d'intégration |
| Routes privées agentiques | Implémentées et testées | dispatcher fermé, tests BFF et sécurité cockpit |
| Bloc cockpit « Briefing LEVOIS » | Raccordé au BFF | présentation fail-closed testée ; QA `390 × 844` et desktop validée sans débordement |

Le service persiste exclusivement dans les cinq tables `agent_*`. L'UI appelle le BFF privé ; elle n'exécute aucune règle ni requête D1 directement.

Le dernier run ciblé de `npm run test:agentic` couvre six suites et passe `107/107` tests. Les validations historiques, le build, le smoke test D1 et la QA visuelle sont consignés dans [QA.md](./QA.md).

### 2.1 Routes privées présentes

| Méthode | Route | Usage |
|---|---|---|
| `POST` | `/api/cockpit/agentic/briefing/run` | exécuter manuellement OPS puis COS sur `agentic-a1-v1` |
| `GET` | `/api/cockpit/agentic/briefing/current` | lire le briefing courant ou son état fail-closed |
| `GET` | `/api/cockpit/agentic/missions/:id` | inspecter une mission redacted |
| `GET` | `/api/cockpit/agentic/missions/:id/trace` | lire la trace paginée redacted |
| `POST` | `/api/cockpit/agentic/missions/:id/cancel` | annuler explicitement une mission non terminale |
| `GET` | `/api/cockpit/agentic/switches` | lire les neuf switches effectifs |
| `POST` | `/api/cockpit/agentic/switches/global/start` et `/stop` | démarrer ou arrêter le scope global |
| `POST` | `/api/cockpit/agentic/switches/agent/:id/start` et `/stop` | démarrer ou arrêter `OPS-01` ou `COS-01` |
| `POST` | `/api/cockpit/agentic/switches/capability/:id/start` et `/stop` | démarrer ou arrêter une capability allowlistée |

Il n'existe aucune route agentique de mutation métier et aucune route publique agentique.

## 3. Structures ajoutées

La migration `0007` crée exactement :

1. `agent_mission` ;
2. `agent_trace` ;
3. `agent_control_switch` ;
4. `agent_ops_shadow_finding` ;
5. `agent_cos_briefing_item`.

Elle ne crée ni table générique d'agent, ni queue, ni cron, ni table d'approbation, ni table de budget, ni table de prompt.

## 4. Modules exécutables

### Noyau déterministe

`src/lib/agentic/index.ts` fournit des fonctions pures pour :

- admettre et faire évoluer une mission fermée A1 ;
- vérifier budget, timeout, idempotence et version ;
- calculer l'autorité des switches ;
- arrêter une mission à un checkpoint ;
- évaluer un snapshot OPS ;
- valider les findings ;
- composer et invalider un briefing COS ;
- refuser PII, agent, capability ou payload hors contrat.

Le module ne reçoit aucun accès D1 et n'importe aucun client HTTP.

### Projection D1

`src/lib/cockpit/server/agentic-snapshot.ts` lit les tables métier existantes et retourne uniquement les champs nécessaires aux règles. Le hash SHA-256 de la projection canonique produit :

- `sourceHash` ;
- `operationalWatermark` ;
- `snapshotId`, également lié à `asOf`.

Les titres, noms, coordonnées, résumés d'interaction, libellés TIM et autres textes métier libres ne sortent pas de la projection.

## 5. Parcours de lecture

1. Une commande humaine fournit la preuve fixture et une clé d'idempotence ; le service fixe `asOf`, timeout et budgets logiques depuis le profil A1 fermé.
2. La projection lit D1 sans l'écrire.
3. OPS évalue le catalogue fermé.
4. La couverture distingue `evaluated` de `not_evaluated`.
5. COS refuse une couverture incomplète ou un watermark périmé.
6. COS regroupe et trie les findings valides.
7. Il conserve au plus sept items et expose `omittedCount`.
8. Le cockpit présente une explication et une action **humaine proposée**.

## 6. Lancer la validation locale

Depuis le worktree A1 :

```powershell
npm ci
npm run test:agentic
```

Pour la D1 locale complète et le cockpit local, suivre [RUNBOOK.md](./RUNBOOK.md). Ne jamais retirer `--local`, ne jamais substituer un identifiant D1 réel et ne jamais utiliser une fixture contenant une donnée réelle.

Les scripts dédiés A1 isolent leur état sous `.wrangler/state/agentic-a1` :

```powershell
npm run db:agentic:migrate:local
npm run db:agentic:seed:local
npm run dev:agentic
```

Aucune preview Cloudflare n'a été générée ou publiée pendant cette phase.

## 7. Ce qui reste hors périmètre

- `L1` ou niveau supérieur ;
- données réelles ;
- `BUY-01`, `SELL-01` ou autre rôle ;
- modèle IA, prompt ou fournisseur ;
- cron, queue ou scheduler ;
- email, SMS, Calendar, Gmail, Drive, Obsidian, Yanport ;
- publication, paiement, offre, mandat, matching final ;
- tâche métier ou modification automatique d'un dossier ;
- preview reliée à une D1 distante ;
- déploiement ou merge vers `main`.

La réussite A1 ne lève aucune de ces interdictions.
