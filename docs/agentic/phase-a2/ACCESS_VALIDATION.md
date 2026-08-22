# Validation Access — Phase A2

## Objectif

Valider que les routes cockpit et agentiques ne sont pas accessibles hors cockpit autorisé et que l’identité Mouaad est la seule à piloter A2.

## Conditions techniques validées en test

1. Anonyme refusé (`ACCESS_REQUIRED`).
2. JWT falsifié refusé (`ACCESS_INVALID`).
3. Mauvaise audience refusée (`ACCESS_INVALID`).
4. Mauvais issuer refusé (`ACCESS_INVALID`).
5. Token expiré/`nbf` futur refusé (`ACCESS_INVALID`).
6. autre identité refusée (email/sous-jet).
7. identité Mouaad autorisée et locale : `AGENTIC_OWNER_REQUIRED` respecté.
8. appel direct sans Access non autorisé sur routes cockpit.
9. politique identique sur routes classiques et `/agentic/*`.
10. `agentic` inaccessible depuis domaine non-cockpit (par DNS/host allowlist + `authenticateCockpit`).

### Références testées

- `functions/_lib/cockpit/security.test.ts`
- `tests/agentic-a2-gate.test.ts`
- `tests/agentic-api.test.ts` (mutations agentiques sous owner local + canary)

## Checklist de validation manuelle Cloudflare

Les points ci-dessous ne sont pas automatisables localement et **doivent être validés côté compte Cloudflare** avant A2 réel :

- DNS `cockpit.levois.fr` pointé correctement.
- Policy Access appliquée à `api/cockpit/*`.
- Audience (`CF_ACCESS_AUD`) et Issuer (`CF_ACCESS_TEAM_DOMAIN`) alignés avec la config réelle.
- Utilisateur de test :
  - un compte « identité réelle autorisée » (Mouaad) ;
  - un compte non autorisé (autre identité, test utilisateur).
- Vérification visuelle : refus systématique sans assertion et accès autorisé uniquement à Mouaad.

## Arrêt/contre-mesure

Si une de ces vérifications échoue au réel, la phase A2 doit être stoppée.
Le pointage en local reste possible pour la partie A1/A2, mais l’enveloppe pilote réel n’est pas autorisée tant que Cloudflare Access n’est pas fermé correctement.
