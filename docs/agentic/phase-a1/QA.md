# QA Phase A1

## 1. Stratégie de preuve

La tranche a commencé par un jalon RED : 55 contrats ont été écrits avant le noyau déterministe. Ils échouaient parce que `src/lib/agentic/index.ts` n'existait pas. Le noyau a ensuite été implémenté sans assouplir ces contrats.

Les preuves A1 couvrent maintenant six niveaux :

1. fonctions pures ;
2. migration SQLite/D1 ;
3. fixture et projection D1 minimisée ;
4. service d'orchestration et BFF cockpit privé ;
5. présentation cockpit fail-closed ;
6. smoke test BFF/D1 et contrôle visuel local.

## 2. Suites A1 exécutées

| Fichier | Portée |
|---|---|
| `tests/agentic.a1.test.ts` | mission, autorité, OPS, COS, sécurité et menaces |
| `tests/agentic-api.test.ts` | routeur privé, propriétaire, fixture gate, CSRF, idempotence, kill switch et non-mutation métier |
| `src/lib/agentic/migration.integration.test.ts` | additivité, contraintes, cinq tables, transitions et journal append-only |
| `src/lib/cockpit/server/agentic-snapshot.test.ts` | migrations `0001→0007`, fixture, projection PII-free, cas A–I et watermark |
| `src/lib/cockpit/server/agentic-service.integration.test.ts` | orchestration OPS/COS, traces, concurrence, stop/start et fermeture hors fixture |
| `src/scripts/cockpit/agentic-briefing-presenter.test.ts` | validation et présentation fail-closed du payload UI |

Dernier run ciblé effectué sur l'état courant du worktree A1, le 2026-08-19 :

```text
npm run test:agentic
Test Files  6 passed (6)
Tests       107 passed (107)
```

Les avertissements `node:sqlite` relatifs au statut expérimental de l'API n'ont provoqué aucun échec.

## 3. Couverture contractuelle

### Missions et autorité

- création fixture-only avec budget logique fini et timeout explicite ;
- cycle autorisé, transitions interdites et terminal non rouvert ;
- timeout, annulation, version optimiste et retry manuel comme nouvelle mission ;
- idempotence, collision de clé et double clic concurrent coalescé ;
- switch absent arrêté, stop avant mission et aux checkpoints ;
- agent et capability allowlistés uniquement ;
- aucune capability, commande ni endpoint de mutation métier.

### OPS-01

- projet actif sans prochaine action ;
- projet actif avec action future et projet terminal exclus ;
- tâche échue et tâche terminée exclue ;
- promesse due et promesse future exclue ;
- TIM actif sans action, TIM fermé exclu et échéance dans la fenêtre fixture ;
- incohérence terminale simple ;
- règle 004 `not_evaluated` tant que le signal canonique est absent ;
- source partielle refusée et input non muté.

### COS-01

- duplicat exact et regroupement d'anomalies liées au même scope ;
- ordre total reproductible quel que soit l'ordre d'entrée ;
- maximum sept items et `omittedCount` explicite ;
- zéro item accepté uniquement avec couverture et fraîcheur valides ;
- explication, action humaine et source obligatoires ;
- briefing invalidé par watermark différent ou couverture incomplète ;
- aucune mission de remplacement automatique.

### BFF et service

- propriétaire unique requis hors bypass local explicite ;
- fermeture si `COCKPIT_AGENTIC_FIXTURE_ONLY` manque ;
- Origin, JSON, CSRF, idempotence, schémas fermés et corps limité à 16 Kio ;
- lecture des neuf switches effectifs, absents donc arrêtés par défaut ;
- start/stop versionnés et audités pour global, agent et capability ;
- exécution manuelle OPS puis COS, replay idempotent et coalescence d'un double clic concurrent ;
- fallback inter-isolates simulés par la contrainte d'idempotence D1, sans seconde paire de missions ;
- lecture redacted de mission, trace paginée et briefing courant ;
- annulation optimiste et stop d'urgence même lorsque le gate d'activation est fermé ;
- ancien briefing invalidé après stop puis start ;
- route agentique métier inexistante (`404`) ;
- tables métier sérialisées avant/après un run complet et exigées byte-stables.

### Sécurité

- cinq seules tables d'écriture ;
- aucun modèle, appel réseau, retry automatique ou action externe ;
- PII canarie, payload excessif et champs inconnus refusés ;
- `reasonCode`, entity ID, agent, capability, scope ou version manipulés refusés ;
- mission, source ou snapshot stale fermés ;
- panne ou fermeture agentique sans suppression des fonctions manuelles du cockpit.

## 4. Fixture D1

Les suites d'intégration :

- appliquent `0001` à `0007` sur SQLite vide ;
- vérifient foreign keys, intégrité et additivité ;
- chargent `db/fixtures/agentic-a1.sql` ;
- vérifient zéro mission et zéro switch seedés ;
- comparent deux snapshots identiques et un watermark stable ;
- couvrent les cas A à H et plus de sept scopes éligibles pour le cas I ;
- composent exactement sept items avec un compteur omis ;
- modifient une donnée métier dans le test seulement ;
- prouvent alors le changement de watermark et l'invalidation du briefing précédent.

Cette mutation de test reste dans une base SQLite en mémoire ou un état local jetable ; elle n'est pas une capacité du service.

## 5. Commandes de validation finale

```powershell
npm test
npm run test:agentic
npm run test:cockpit
npm run test:cockpit:security
npm run test:market
npm run build
git diff --check
```

Le smoke test D1 local utilise exclusivement :

```powershell
npm run db:agentic:migrate:local
npm run db:agentic:seed:local
npm run dev:agentic
```

Les instructions d'exécution et de reset sont dans [RUNBOOK.md](./RUNBOOK.md).

## 6. Smoke test et QA visuelle locale

Le 2026-08-19, une D1 Wrangler neuve a reçu les migrations `0001→0007`, puis uniquement `db/fixtures/agentic-a1.sql`. L'introspection a confirmé exactement cinq tables `agent_*`, `17` projets fictifs, `7` tâches fictives, `3` accords TIM fictifs, zéro mission et zéro switch après seed.

Après activation humaine explicite des neuf scopes :

- OPS et COS se sont terminés avec le statut `completed` ;
- le briefing courant était `available`, avec `7` items visibles et `10` omis ;
- `fixtureOnly=true` et `shadowMode=true` ;
- le stop global `v1→v2` a rendu le briefing `stopped` avec zéro item visible.

Le viewport mobile a été imposé par Chrome DevTools à `390 × 844`. Mesure obtenue : `documentScrollWidth=390`, `documentClientWidth=390`, `bodyScrollWidth=390`, aucun élément hors viewport. Les captures sont conservées dans [evidence/](./evidence/).

Les résultats exacts des suites et du build sont consignés dans le rapport final, après la dernière passe sur le commit de livraison.

Dernière matrice complète exécutée sur l'état consolidé :

| Commande | Résultat |
|---|---|
| `npm test` | 19 fichiers, 203 tests réussis |
| `npm run test:agentic` | 6 fichiers, 107 tests réussis |
| `npm run test:cockpit` | 8 fichiers, 74 tests réussis |
| `npm run test:cockpit:security` | 2 fichiers, 16 tests réussis |
| `npm run test:market` | 6 tests réussis |
| `npm run build` | 33 pages construites |

## 7. Environnement de validation

- D1 : SQLite en mémoire dans les tests et état Wrangler local `.wrangler/state/agentic-a1` pour le runbook ;
- données : fixture fictive `agentic-a1-v1` uniquement ;
- réseau agentique : aucun ;
- modèle : aucun ;
- retry automatique : zéro ;
- preview Cloudflare : aucune générée ou publiée.

## 8. Critère de sortie

A1 est démontrée lorsque les suites du commit final sont vertes, que D1 locale vide puis fixture fonctionnent, que le BFF reste fermé hors fixture et que le cockpit manuel reste utilisable avec tous les switches agentiques arrêtés.
