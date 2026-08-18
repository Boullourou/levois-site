# Rapport Phase 2.5 — sécurisation et mise en service contrôlée

Date de travail : 18 août 2026
Branche : `codex/levois-phase2-5-security-access`
Point de départ : `7b975733dbf63676858b7114269a8c2641e1d49b`

## Décision

**NO-GO données réelles.**

La migration de dépendances est validée. Le déploiement automatique `8a8426a0-44c4-4fe4-9dda-4cb2cf3d8931` refuse les requêtes anonymes par redirect Access et Fail closed est actif. La configuration Pages téléchargée confirme les deux D1 non-production en Preview/default et seulement `RECHERCHE_DB` production sous `env.production` : la séparation D1 distante est verte. Policy exacte, allow Mouaad, MFA, login positif, AUD/issuer BFF, secrets et DNS cockpit restent non validés ; **NO-GO données réelles**.

Aucune donnée réelle n’a été ajoutée pendant la Phase 2.5. Aucun déploiement manuel de production, migration de D1 production ou changement fonctionnel des parcours publics n’a été effectué.

## 1. Version Astro retenue

Version finale : **Astro `7.2.3`**.

La migration a été testée par paliers :

1. baseline Astro `4.16.19` ;
2. Astro `5.18.2` ;
3. Astro `6.4.8` ;
4. Astro `7.2.3`.

Astro 5 a confirmé la compatibilité applicative mais ne corrigeait pas l’ensemble des advisories. Astro 6 a nécessité le remplacement de l’intégration Tailwind dépréciée par `@tailwindcss/vite`; les styles explicites du cockpit ont rétabli la baseline. Astro 6 n’étant plus maintenu et laissant un risque `sharp`, Astro 7 a été évalué puis retenu. Aucun changement de direction artistique n’a été introduit.

Environnement final : Node cible `22.23.2`, npm `10.9.2`, Wrangler `4.124.0`, `sharp` `0.35.3`.

## 2. Vulnérabilités

Le rapport exact package/version/advisory/sévérité/chemin/applicabilité/correctif est dans [ASTRO_AUDIT_2026-08.md](./ASTRO_AUDIT_2026-08.md).

- baseline runtime : 7 nœuds de packages vulnérables, soit 5 HIGH et 2 MODERATE au sens du résumé npm ;
- audit runtime observé après passage à Astro 7.2.3 : **0 vulnérabilité** ;
- audit complet final après la dernière installation propre : **0 vulnérabilité**.

Aucune vulnérabilité HIGH applicable au runtime ne peut être acceptée pour un GO. Si le dernier audit en révèle une, le statut reste STOP sans exception implicite.

## 3. Non-régression et tests

Résultats finaux après le dernier durcissement des claims Access :

- `npm test` : 96/96 ;
- `npm run test:cockpit` : 55/55 ;
- `npm run test:cockpit:security` : 16/16 ;
- `npm run test:market` : 6/6 ;
- `npm run build` : OK, 33 pages ;
- `git diff --check` : OK.

Revalidation réalisée après le dernier `npm ci` :

| Contrôle | Résultat final |
|---|---|
| `npx --yes npm@10.9.2 ci` | OK, 0 vulnérabilité annoncée |
| `npm audit --omit=dev --json` | 0 vulnérabilité |
| `npm audit --json` | 0 vulnérabilité |
| `npm test` | 96/96, 13 fichiers |
| `npm run test:cockpit` | 55/55, 6 fichiers |
| `npm run test:cockpit:security` | 16/16, 2 fichiers |
| `npm run test:market` | 6/6 |
| `npm run build` | OK, 33 pages |
| `git diff --check` | OK ; relancé avant le handoff final |
| Pages Functions locales | session et file « Aujourd’hui » validées avec les headers privés ; routes publiques gardées |
| recette fonctionnelle fictive | Client, TIM et mobile `390 × 844` validés |

## 4. Captures avant/après

Les huit routes demandées ont été capturées en desktop `1440 × 1000` et mobile `390 × 844` : `/`, `/ma-recherche`, `/situer-ma-vente`, `/audit-annonce`, `/votre-rue`, `/recommander`, `/rejoindre` et `/cockpit/`.

| Palier | Desktop | Mobile | État |
|---|---:|---:|---|
| Astro 4 baseline | 8 | 8 | présent dans `screenshots/astro4-baseline/` |
| Astro 5 | 8 | 8 | présent dans `screenshots/astro5/` |
| Astro 6 | 8 | 8 | présent dans `screenshots/astro6/` |
| Astro 7 final | 8 | 8 | présent dans `screenshots/astro7-final/` |

Les écarts matériels correspondent principalement aux animations continues. Aucun débordement horizontal ni changement de layout n’a été détecté. Deltas Astro 4 → Astro 7, seuil par canal `> 30` :

| Route | Desktop | Mobile |
|---|---:|---:|
| `/audit-annonce` | 0,387 % | 0,178 % |
| `/cockpit/` | 0,018 % | 0 % |
| `/` | 0,081 % | 0,123 % |
| `/ma-recherche` | 0,271 % | 0,144 % |
| `/recommander` | 0 % | 0 % |
| `/rejoindre` | 0,186 % | 0 % |
| `/situer-ma-vente` | 0 % | 0 % |
| `/votre-rue` | 0,006 % | 0,023 % |

Ces écarts ont été inspectés et aucune régression visuelle fonctionnelle n’a été retenue.

## 5. D1 preview

Base créée :

- nom : `levois-cockpit-preview-phase2-5` ;
- UUID : `88539c49-0d41-42df-a3b1-1a269e1acbe3` ;
- région : WEUR ;
- binding Preview/default confirmé après push : `COCKPIT_DB`.

Contrôles réalisés :

- migrations exactes `0001` à `0006` appliquées ;
- fixtures fictives seules chargées ;
- `PRAGMA foreign_key_check` sans anomalie ;
- comptages : `person=3`, `project=2`, `tim_agreement=2`, `lab_observation=1` ;
- `wrangler.toml` cible un environnement sans aucune D1 de production ; `RECHERCHE_DB` y désigne la base preview séparée ci-dessous.

Une seconde D1 non-production maintient les routes publiques de preview :

- nom : `levois-recherche-preview-phase2-5` ;
- UUID : `308c98e9-d484-4fdd-9892-539abb6b0ffd` ;
- binding cible : `RECHERCHE_DB` sous `env.preview` ;
- état : schéma `lectures_recherche` présent, 0 ligne et aucune erreur d’intégrité.

La configuration Pages téléchargée à 22:48 confirme Preview/default avec `COCKPIT_DB` `88539c49…` et `RECHERCHE_DB` `308c98e9…`. `env.production` contient seulement `RECHERCHE_DB` `077d24f8…`. La séparation D1 est **verte**. `/api/recherche` après login reste à tester ; sans cookie, Access répond `302` avant la Function.

## 6. Cloudflare Access

État : **NON OPÉRATIONNEL — BLOQUANT**.

Constats :

- onboarding Cloudflare Zero Trust commencé, mais aucun plan actif ;
- la preview hash refuse bien l’accès anonyme par `302` vers le team domain ;
- le mode Preview est **Fail closed** ;
- le DNS `cockpit.levois.fr` est absent ;
- aucune application Access self-hosted vérifiée pour `cockpit.levois.fr` ;
- aucune audience dédiée ;
- aucune politique Mouaad-only + MFA prouvée ;
- variables/secrets Access distants non validés ;
- policy exacte, allow Mouaad, MFA et login positif non testés.

La procédure deny-by-default, MFA, audience/issuer, variables, hostname et tests se trouve dans [`../cockpit/ACCESS_SETUP.md`](../cockpit/ACCESS_SETUP.md).

Preview protégée en bordure : `https://8a8426a0.levois-site.pages.dev` (HEAD déployé `4b78eed3…`). Elle n’est pas une URL cockpit utilisable ou autorisée pour des données réelles tant que la policy, Mouaad, le MFA, le login positif, l’AUD/issuer, les secrets BFF et le DNS ne sont pas validés.

## 7. Sauvegarde/restauration

Source autorisée : D1 preview fictive ci-dessus.
Cible validée : D1 distincte `levois-cockpit-restore-test-phase2-5-v2` (`b1358142-fb12-4c80-a038-6ea099da4705`), jamais liée à Pages.

| Étape | Résultat |
|---|---|
| snapshot complet ignoré | OK, `73 869` octets |
| SHA-256 snapshot complet | `3F7713A8EEFFC09EE773F98C39182C3AFB4F7707B5BAF758971B03D36D311468` |
| export données seules | OK, `29 220` octets, SHA-256 `0F767DAC9B4E7275B42CD590053AD69185ED1DDDD4C10091EFB392F914C8BB3C` |
| UUID de la D1 de restauration | `b1358142-fb12-4c80-a038-6ea099da4705` |
| import réussi | oui, après migrations puis dépose/recréation contrôlée des triggers |
| migrations/triggers | 6 / 26 sur source et restauration |
| `PRAGMA foreign_key_check` | aucune ligne |
| comptages identiques | oui : `3/2/1/11/2/2/2/0/1` sur les neuf agrégats contrôlés |

Le snapshot complet Wrangler ne s’importe pas directement dans une D1 vide (`no such table: main.project`, ordre de création des triggers). La procédure restaurable validée associe les migrations versionnées à l’export données seules. La première cible partielle `levois-cockpit-restore-test-phase2-5` (`629bb438-21c7-45e3-8ebc-cf0ef101d80a`) reste à supprimer après validation explicite ; elle ne contient aucune donnée réelle et n’est liée à aucun projet Pages.

Le runbook exact et la procédure d’incident sont dans [`../cockpit/OPERATIONS.md`](../cockpit/OPERATIONS.md).

## 8. Politique données réelles

La checklist se trouve dans [`../cockpit/REAL_DATA_CHECKLIST.md`](../cockpit/REAL_DATA_CHECKLIST.md). Elle documente :

- les données strictement nécessaires et les catégories interdites ;
- la minimisation des montants TIM ;
- l’absence d’audio/transcription/fichiers ;
- l’absence de PostHog et de cache hors ligne ;
- les gates Access, D1, sauvegarde, export, effacement et conservation ;
- la vérification Git/logs/captures ;
- la décision GO signée par Mouaad.

État actuel : **non verte**. La restauration fictive, les audits, la recette locale, le refus anonyme et la séparation D1 distante sont prouvés. Il faut encore valider Access de bout en bout, créer une D1 destinée aux données réelles et définir la sauvegarde réelle, l’effacement et la conservation.

## 9. SHA et livraison

| Élément | Valeur |
|---|---|
| SHA final | transmis dans le handoff final après commit/push, non figé dans ce document |
| branche cible | `codex/levois-phase2-5-security-access` |
| preview automatique | `https://8a8426a0.levois-site.pages.dev`, protégée anonymement mais non autorisée aux données réelles |
| statut Git final | transmis dans le handoff final après commit/push |

Aucun merge vers `main`, aucun force-push et aucun déploiement manuel de production ne sont autorisés.

## 10. Limites restantes

- Access/MFA et hostname privé non opérationnels ;
- onboarding Zero Trust sans plan actif, policy exacte/MFA/login positif non validés et DNS cockpit absent ;
- `/api/recherche` protégé anonymement mais non testé après login ;
- aucune D1 cockpit de données réelles créée ;
- restauration distante fictive validée mais workflow manuel à revalider après toute migration ;
- première D1 de restauration partielle à supprimer après validation explicite ;
- suppression complète d’un dossier sans commande/UI auditable ;
- conservation et durée des sauvegardes non validées ;
- rate limiting cockpit non implémenté ;
- logs d’échecs d’authentification gérés par Cloudflare uniquement ;
- recette Access authentifiée et configuration des secrets BFF encore à effectuer.

## Conclusion

La migration Astro, Fail closed, le refus anonyme et la séparation Pages preview/production sont démontrés. Cloudflare Access n’est toutefois pas validé de bout en bout. Sans policy Mouaad-only, MFA, login positif, AUD/issuer, secrets BFF et DNS cockpit vérifiés, **STOP — ne pas autoriser les données réelles**.

La Phase 3 n’est pas commencée.
