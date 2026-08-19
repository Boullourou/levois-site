# Ordre et composition COS-01 implémentés

## 1. Entrée fermée

`COS-01` reçoit uniquement :

- un résultat OPS scellé ;
- des findings conformes au catalogue ;
- `OpsCoverageV1` ;
- le snapshot et son watermark ;
- le watermark opérationnel courant ;
- un budget logique ;
- une date de composition explicite.

Il ne possède aucun accès D1 métier et ne relit ni personne, ni projet, ni TIM.

## 2. Gates avant composition

Le résultat est invalidé si :

- le watermark OPS diffère du watermark courant ;
- une famille obligatoire n'est pas `evaluated` ;
- la règle 004 ne porte pas le couple attendu `not_evaluated/CANONICAL_SIGNAL_ABSENT` ;
- un finding porte une règle, raison, action, scope ou priorité inconnue ;
- un finding vise un autre snapshot/watermark ;
- un payload contient un champ PII interdit ;
- le budget logique est invalide ou dépassé.

Un résultat invalide contient zéro item. Il n'est jamais converti en briefing vide réussi.

## 3. Déduplication

### Passe 1 — fingerprint exact

Un même `observationFingerprint` ne produit qu'un finding courant. Si le même fingerprint transporte deux contenus matériels différents, COS rejette le résultat avec `CP_RESULT_INVALID`.

### Passe 2 — liaison structurée

Les liens `promise_task` et `tim_deadline_task` permettent de conserver plusieurs causes structurées du même fait. Aucune similarité de texte ou de nom n'est utilisée.

### Passe 3 — scope

Tous les findings restants d'un même `(scopeKind, scopeId)` deviennent un item. L'item conserve :

- le finding primaire ;
- toutes les références uniques ;
- `signalCount` ;
- l'action de la cause primaire.

Deux scopes distincts ne sont jamais fusionnés.

## 4. Ordre total

Chaque groupe est comparé selon la clé suivante :

1. priorité : `urgent`, `high`, `normal`, `low` ;
2. classe de signal :
   1. promesse explicitement due ;
   2. tâche ou échéance TIM dépassée ;
   3. prochaine action incohérente avec un scope terminal ;
   4. triage canonique prouvé — inactif en A1 ;
   5. projet ou TIM sans prochaine action ;
   6. échéance TIM future dans la fenêtre ;
3. `dueAt` croissant, date absente en dernier ;
4. `observedAt` croissant ;
5. `scopeKind`, `scopeId`, puis fingerprint en ordre lexical.

La fonction ne dépend jamais de l'ordre SQL d'entrée. Le test inverse la liste de dix findings et exige le même résultat.

## 5. Troncature

- zéro groupe avec couverture complète : briefing `current` vide valide ;
- un ou deux groupes : aucun remplissage artificiel ;
- trois à sept : tous sont retenus ;
- plus de sept : sept items, et `omittedCount` conserve le nombre de groupes non affichés.

La huitième anomalie n'est pas supprimée du résultat OPS. Elle n'apparaît simplement pas dans le résumé court.

## 6. Explications déterministes

Les explications et actions viennent de templates fermés. Exemple :

```text
PROJECT_WITHOUT_NEXT_ACTION
→ Ce projet est actif mais aucune prochaine action n’est définie.
→ Définir la prochaine étape.
```

Il n'existe aucun prompt, modèle, texte génératif libre ou reformulation distante.

Chaque item présente :

- rang ;
- scope opaque ;
- règle principale ;
- explication ;
- action humaine proposée ;
- nombre de signaux ;
- références de findings ;
- mission OPS source ;
- snapshot et watermark.

## 7. Fraîcheur

Un briefing n'est courant que si :

- `state=current` ;
- la mission est terminée ;
- son watermark égale le watermark opérationnel courant.

Après mutation d'une tâche fixture, les tests prouvent que le watermark change et que le briefing précédent devient :

```text
state=invalid
invalidReason=CP_SOURCE_STALE
items=[]
suggestedManualActionCode=RUN_NEW_BRIEFING
```

Cette suggestion n'est pas une commande. COS ne crée jamais une mission de remplacement et ne lance aucun retry.

## 8. Coût actuel

Le coût runtime externe est nul :

- aucun token ;
- aucun appel modèle ;
- aucun appel réseau ;
- aucune queue ;
- aucun cron.

Le coût local se limite aux lectures D1, au SHA-256, aux comparaisons, au tri borné et aux écritures techniques du service dans les cinq tables `agent_*`.
