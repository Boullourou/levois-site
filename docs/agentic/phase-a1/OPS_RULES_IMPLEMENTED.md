# Règles OPS-01 implémentées

## 1. Contrat d'entrée

`OPS-01` reçoit un `OpsSnapshotV1` construit à une date `asOf` explicite. La projection contient seulement :

- IDs opaques ;
- statuts et versions ;
- stade projet ;
- échéances structurées ;
- priorité structurée ;
- indicateur `isNextAction` ;
- liens structurés promesse/tâche ou TIM/échéance.

Les familles `projects`, `tasks`, `promises`, `timAgreements` et `timDeadlines` doivent être `complete`. Sinon, l'évaluation échoue avec `CP_SOURCE_EMPTY` au lieu de conclure « aucune anomalie ».

La famille `intake` vaut volontairement `canonical_signal_absent`.

## 2. Catalogue fermé

| Règle | Condition déterministe | Exclusions | Priorité | Action humaine codée |
|---|---|---|---|---|
| `OPS-PROJECT-NEXT-ACTION-001` | Projet `new|qualifying|active|paused` sans tâche ouverte `isNextAction=true` | projet terminal | `normal` | `DEFINE_NEXT_ACTION` |
| `OPS-TASK-OVERDUE-002` | Tâche `open|in_progress|waiting`, contexte ouvert, `dueAt < asOf` | tâche close, date absente, contexte terminal | `urgent` seulement si la source est urgente, sinon `high` | `REVIEW_OVERDUE_TASK` |
| `OPS-PROMISE-DUE-003` | Promesse structurée, non satisfaite, contexte ouvert, `dueAt <= asOf` | texte inféré, date absente, promesse satisfaite, projet terminal | `urgent` seulement si la source est urgente, sinon `high` | `REVIEW_PROMISE_AND_CONTACT` |
| `OPS-INTAKE-UNTREATED-004` | **Aucune détection A1** | `new|qualifying` ne prouve pas « non traité » | aucune | aucune |
| `OPS-TIM-NEXT-ACTION-005` | Accord `to_formalize|signed|omega_uploaded|active` sans tâche ouverte `isNextAction=true` | TIM `cancelled|closed` | `normal` | `DEFINE_TIM_FOLLOW_UP` |
| `OPS-TIM-DEADLINE-NEAR-006` | Échéance TIM structurée ouverte, TIM actionnable, `dueAt <= windowEnd` explicite | date absente, échéance close, TIM terminal | `high` si due/dépassée, sinon `normal` | `REVIEW_TIM_DEADLINE` |
| `OPS-INCONSISTENCY-007` | Tâche ouverte `isNextAction=true` sur projet ou TIM terminal | toute autre incohérence non approuvée | `high` | `REVIEW_TERMINAL_NEXT_ACTION` |

Les codes de raison produits par le noyau sont fermés :

- `PROJECT_WITHOUT_NEXT_ACTION` ;
- `TASK_OVERDUE` ;
- `PROMISE_DUE` ;
- `TIM_WITHOUT_NEXT_ACTION` ;
- `TIM_DEADLINE_NEAR` ou `TIM_DEADLINE_OVERDUE` ;
- `TERMINAL_SCOPE_WITH_OPEN_NEXT_ACTION`.

Le contrat SQL `0007`, le noyau, le store et le service emploient ce même vocabulaire. Les contraintes D1 refusent une combinaison règle/raison/action différente.

## 3. Règle 004

`OPS-INTAKE-UNTREATED-004` apparaît dans `OpsCoverageV1` avec :

```json
{
  "ruleId": "OPS-INTAKE-UNTREATED-004",
  "evaluationStatus": "not_evaluated",
  "reasonCode": "CANONICAL_SIGNAL_ABSENT"
}
```

Aucun finding 004 n'est produit ou persistable. Le statut d'un projet seul ne déclenche jamais cette règle.

## 4. Findings

Chaque finding contient au minimum :

- ID et fingerprint déterministes ;
- mission, règle et version ;
- scope et éventuel sujet opaque ;
- lien structuré éventuel ;
- raison et action issues d'une allowlist ;
- priorité proposée ;
- snapshot, watermark et source hash ;
- version source ;
- dates structurées.

Le fingerprint est construit à partir de la règle, du scope, du sujet et de la condition matérielle. Il ne contient aucun nom.

## 5. Cas fixture couverts

| Cas | Fixture | Résultat attendu et testé |
|---|---|---|
| A | `PRJ-FX-A` actif, sans action | finding 001 |
| B | `PRJ-FX-B`, action future | aucun finding |
| C | `TSK-FX-C` échue | finding 002 |
| D | projet/tâche terminés | aucun finding |
| E | `INT-FX-E`, promesse due à `asOf` | finding 003 ; la tâche due exactement à `asOf` n'est pas « overdue » |
| F | `TIM-FX-F` actif sans action | finding 005 |
| G | `TIM-FX-G` fermé | aucun finding |
| H | tâche échue et promesse liée | deux findings structurés, un seul groupe COS |
| I | dix projets sans action | dix findings possibles ; COS en retient sept |
| X | scope terminal avec prochaine action ouverte | finding 007 uniquement |

## 6. Fenêtre TIM

La fixture passe explicitement `windowEnd=2026-08-26T08:00:00.000Z` pour un `asOf=2026-08-19T08:00:00.000Z`. Cette fenêtre de sept jours est une donnée synthétique du scénario, pas un défaut de production ni une décision D-014.

## 7. Budget et arrêt

Avant et après l'évaluation, le noyau compare :

- nombre de lignes source ;
- évaluations de règle ;
- findings ;
- items ;
- traces prévues ;

au budget logique fourni. Une absence, valeur nulle, négative, non finie ou dépassée ferme l'exécution. Aucun retry automatique n'est lancé.

## 8. Limites

- aucune inférence depuis une note ou un texte client ;
- aucune notion de valeur commerciale ;
- aucune détection de dossier « non traité » ;
- aucune écriture de tâche, statut, interaction ou Accord TIM ;
- aucune activation sur données réelles ;
- aucun seuil opérationnel définitif n'est déduit des fixtures.
