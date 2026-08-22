# Briefing review scorecard

## But

Cette grille servira au futur pilote Shadow L0 reel. Elle ne declenche aucune action et ne valide aucun agent L1.

## Fiche par item

| Champ | Valeurs |
|---|---|
| Date | `YYYY-MM-DD` |
| Mission COS | `mission_id` |
| Rang | `1..7` |
| Scope | `project:<id>` ou `tim_agreement:<id>` |
| Regle OPS | `OPS-...` |
| Correct factuellement ? | oui / non / incertain |
| Utile ? | oui / non / partiel |
| Urgent ? | oui / non / trop haut / trop bas |
| Deja couvert ? | non / oui par rang X |
| Action suggeree raisonnable ? | oui / non / a reformuler |
| Explication suffisante ? | oui / non |
| Source fraiche ? | oui / non / stale |
| Aurait du etre absent ? | non / oui |
| Commentaire Mouaad | texte court, sans PII inutile |

## Score synthetique

| Mesure | Calcul |
|---|---|
| Precision utile | items utiles / items presentes |
| Faux positifs | items qui auraient du etre absents |
| Faux negatifs | oublis detectes manuellement hors briefing |
| Charge de revue | minutes de lecture + correction |
| Gain percu | preparation manuelle baseline - preparation assistee |
| Incidents d'autorite | toute sortie qui semble demander une action automatique |

## Regle de prudence

Un item utile ne donne pas de droit supplementaire a l'agent. Le score sert uniquement a decider `GO / ADJUST / STOP` pour un futur pilote reel supervise.
