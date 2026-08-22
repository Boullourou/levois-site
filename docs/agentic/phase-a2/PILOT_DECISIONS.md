# Décisions A2 — ouverture pilotage Shadow

Ce document formalise uniquement les décisions **encore ouvertes** et leur régime A2.

## Format

- **Décision définitive requise** : la décision finale attendue avant le passage réel.
- **Règle conservatrice A2** : application provisoire pour démontrer la préparation.
- **Ce qui reste bloqué** : éléments encore en attente de validation métier/juridique.

| Décision | Décision définitive requise | Règle conservatrice A2 | Ce qui reste bloqué |
|---|---|---|---|
| D-007 — Sensibilité | Définition officielle des niveaux, règles d’accès et des interdits de sortie. | Mappage provisoire: `PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`, `SECRET`. `SECRET` jamais transmis aux agents ni aux vues d’opération. | Validité juridique / conformité finale, revue DPO/commerciale avant réel. |
| D-008 — Rétention | Durées de conservation exactes par classe + purge/restauration. | Fixtures jetables. Traces A2 en mode pilotage : courte durée de rétention opérationnelle (TTL court), purge contrôlée et restitution scriptée. | Durées réelles pour données clients confirmées après pilote réel. |
| D-009 — Export / effacement | Politique définitive export/effacement (réels). | Export de test uniquement, suppression totale des fixtures possible, preuve de purge/recréation via script de drill. | Procédure juridique de purge client réelle, horodatage immuable. |
| D-013 — Budgets | Politique budgétaire réelle globale (finance/observabilité) non figée. | `0 €` modèle, `0 €` connecteur ; budget logique actif par mission + plafond run explicite + aucune valeur non bornée. | Ajustement de coût réel quand un connecteur IA est autorisé. |
| D-014 — Retry / timeout | Stratégie officielle de fiabilité pour pilotes/lots réels. | Timeout explicites par mission, **0 retry automatique**, reprise manuelle seule. | Politique complète de retry d’infrastructure quand des actions externes seront actives. |
| D-018 — Critères de succès pilote | Critères de performance du pilote réel, seuils de validation. | Mesures préparées : `temps de préparation`, `faux positifs`, `faux négatifs`, `items utiles`, `charge de revue`, `coûts`, `incidents d’autorité`. | Seuils de valeur acceptée et durée de stabilisation non fixés (proposé dans `REAL_SHADOW_PILOT_PROTOCOL.md`). |

## Règles transversales A2

- La règle de gate A2 (voir `PREVIEW_ENVIRONMENT.md`) doit rester active tant qu’au moins une décision ci-dessus n’est pas close.
- Aucune décision ouverte ne peut autoriser :
  - des données réelles,
  - une action métier automatique,
  - un coût non borné.
