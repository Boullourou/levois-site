# Sécurité A1

## 1. Posture

A1 est une démonstration locale fixture-only, fail-closed et L0. Sa réussite ne constitue pas une autorisation de connecter la D1 production ou des données réelles.

## 2. Frontières

```text
Tables métier D1
  │ lecture allowlistée
  ▼
OpsSnapshotV1 sans PII
  │ valeur non souveraine
  ▼
OPS-01 pur → findings techniques
  │ entrée fermée
  ▼
COS-01 pur → briefing Shadow
  │ présentation privée
  ▼
Mouaad décide et agit manuellement
```

Il n'existe aucun arc d'écriture vers les tables métier.

## 3. Minimisation des données

La projection exclut :

- nom et prénom ;
- email et téléphone ;
- adresse ;
- titre libre de tâche ;
- résumé ou texte d'interaction ;
- libellé, parties et montants TIM ;
- note, transcription, document et secret.

Le noyau refuse aussi les clés PII connues, les emails et numéros de téléphone autonomes présents dans un payload. Un digest technique au format SHA-256 exact reste autorisé même si une suite de chiffres ressemble à un numéro ; les tests bornent explicitement cette exception et injectent une canarie `email` exigeant `CP_PII_POLICY_VIOLATION`.

Les traces utilisent des IDs opaques, codes, hashes, compteurs et dates structurées. Elles ne doivent jamais recevoir le snapshot brut.

## 4. Autorité

Les deux seules paires actives sont :

| Mission | Agent | Capabilities exactes |
|---|---|---|
| `ops.shadow_scan.v1` | `OPS-01` | `ops.read_snapshot`, `ops.evaluate_rules` |
| `cos.daily_briefing.v1` | `COS-01` | `cos.read_ops_results`, `cos.deduplicate`, `cos.rank`, `cos.compose_briefing` |

`BUY-01`, une capability métier ou un capability set partiel sont refusés. Un agent ne peut ni étendre ses droits, ni changer son budget, ni démarrer/réactiver un switch.

Les routes sont sous le routeur cockpit privé et conservent les contrôles existants : host allowlisté, Cloudflare Access hors bypass local explicite, identité autorisée, Origin identique, `application/json`, CSRF, idempotence et réponses `private, no-store`.

Le pilotage agentique ajoute une contrainte : hors local, `COCKPIT_ALLOWED_SUB` doit contenir exactement le sujet Access du propriétaire. Une liste vide, multiple ou différente produit `AGENTIC_OWNER_REQUIRED`.

Le BFF accepte des objets JSON fermés de 16 Kio maximum. Il refuse paramètres, champs, agent, capability, scope ou version inconnus, ainsi que toute clé d'idempotence de forme PII/téléphone. `start` et `run` exigent en plus `COCKPIT_AGENTIC_FIXTURE_ONLY=1`, `fixtureOnly=true` et `fixtureId=agentic-a1-v1`. Si le gate environnemental est fermé, `briefing/current` expose uniquement un DTO arrêté ; les lectures persistées de mission, trace et switches sont refusées sans données.

## 5. Kill switches

Portées implémentées et contraintes par la migration :

- `global:global` ;
- `agent:OPS-01` ;
- `agent:COS-01` ;
- une ligne par capability allowlistée.

Règles :

- ligne absente = `stopped` ;
- les trois niveaux applicables doivent être `enabled` ;
- toute version de switch participe au fingerprint ;
- changement, arrêt ou absence au checkpoint annule la mission ;
- un résultat tardif ne peut pas devenir courant ;
- une mission annulée n'est jamais rouverte ;
- réactivation explicite et auditée seulement ;
- le cockpit manuel n'est pas soumis à ces switches.

Le noyau teste l'arrêt avant admission et au checkpoint. Les tests service/BFF prouvent aussi :

- neuf switches absents exposés comme `stopped`, version zéro ;
- start/stop versionnés et audités ;
- stop global autorisé même lorsque le gate d'activation est fermé ;
- annulation immédiate d'une mission active avec `closeReason=kill_switch` ;
- réactivation sans résurrection d'un ancien briefing ;
- aucune réouverture de mission annulée.

La coalescence en mémoire couvre le double clic dans un même isolate. Entre deux wrappers simulant des isolates distincts, la contrainte d'idempotence D1 reste l'autorité : le perdant relit puis rejoue le résultat du gagnant, sans relancer le travail OPS/COS. Ce fallback est couvert par un test d'intégration dédié.

## 6. Fixture-only

- `fixture_only=false` est refusé.
- Toute exécution déclarée `production` est refusée.
- Le binding local versionné utilise un UUID nul.
- Les commandes documentées portent toutes `--local`.
- La fixture ne seed aucun switch.
- Aucun endpoint public agentique n'est autorisé.

## 7. Réseau et modèles

Le noyau agentique :

- n'importe aucun SDK IA ;
- ne lit aucune clé fournisseur ;
- n'appelle pas `fetch` ;
- ne connaît aucun connecteur ;
- n'envoie aucun message ;
- ne produit aucun contenu public.

Un test remplace `fetch` par un spy rejetant et exige zéro appel pendant OPS + COS.

## 8. Mutation métier

Deux défenses indépendantes :

1. le noyau pur ne reçoit pas de handle D1 ou de commande métier ;
2. la migration ne référence et ne cible que les cinq tables agentiques.

Les tests conservent les inputs business-shaped byte-stables et vérifient que `AGENTIC_WRITE_TABLES` vaut exactement la liste des cinq tables.

Le store utilise une allowlist d'écriture égale aux cinq tables `agent_*`. Les tests BFF capturent l'état des tables métier avant/après un run complet et exigent une égalité byte-stable ; une fausse route agentique de création de tâche retourne `404` sans mutation.

## 9. Menaces testées

- agent ou capability inconnu ;
- transition interdite et réouverture terminale ;
- collision d'idempotence ;
- concurrence de version ;
- timeout ;
- budget absent ou dépassé ;
- switch global, OPS, COS ou capability arrêté ;
- source et mission stale ;
- `reasonCode` manipulé ;
- entity ID inconnu ;
- payload excessif ;
- snapshot partiel ;
- PII injectée ;
- appel réseau ;
- mutation de l'input ;
- ancien briefing présenté comme courant ;
- création automatique d'une mission de remplacement.

## 10. Décisions toujours ouvertes

D-007, D-008, D-009, D-013, D-014 et D-018 ne sont pas résolues par A1. Les defaults de fixture ne deviennent jamais des politiques réelles.
