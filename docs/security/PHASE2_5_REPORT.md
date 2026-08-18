# Rapport Phase 2.5 — sécurisation et mise en service contrôlée

Date de travail : 18 août 2026
Branche : `codex/levois-phase2-5-security-access`
Point de départ : `7b975733dbf63676858b7114269a8c2641e1d49b`

## Décision

**NO-GO données réelles.**

La migration de dépendances et les deux D1 preview non-production sont prêtes. La séparation du binding Pages n’est toutefois pas encore effective : le Dashboard Preview montre toujours `RECHERCHE_DB → levois-recherche` jusqu’au prochain push. Fail closed est activé, mais les previews restent publiques. L’onboarding Zero Trust est partiel et aucun plan/app/policy/AUD/MFA/DNS cockpit n’est actif. Access demeure non opérationnel ; aucune preview ne peut être déclarée sûre pour des données réelles.

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
- binding cible préparé dans Git : `COCKPIT_DB` sous `env.preview`, non encore observé dans Pages.

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

Constat Pages distant avant push : Preview contient encore uniquement `RECHERCHE_DB → levois-recherche`, sans `COCKPIT_DB`. Le gate d’isolation distante est donc **rouge**. Après le déploiement Git automatique, il faut inspecter le Dashboard et prouver qu’aucune D1 de production n’est accessible.

La configuration Git cible donc les deux UUID non-production et préserve le schéma de `/api/recherche`. Elle doit encore être confirmée dans le Dashboard après le déploiement automatique ; l’ancien binding production interdit toujours le GO.

## 6. Cloudflare Access

État : **NON OPÉRATIONNEL — BLOQUANT**.

Constats :

- onboarding Cloudflare Zero Trust commencé, mais aucun plan actif ;
- les previews Pages sont publiques et l’action « Restrict previews » n’est pas activée ;
- le mode Preview est **Fail closed** ;
- le DNS `cockpit.levois.fr` est absent ;
- aucune application Access self-hosted vérifiée pour `cockpit.levois.fr` ;
- aucune audience dédiée ;
- aucune politique Mouaad-only + MFA prouvée ;
- variables/secrets Access distants non validés ;
- sept tests distants non exécutables dans cet état.

La procédure deny-by-default, MFA, audience/issuer, variables, hostname et tests se trouve dans [`../cockpit/ACCESS_SETUP.md`](../cockpit/ACCESS_SETUP.md).

URL cockpit sûre : **aucune à ce stade**. Fail closed est vert, mais une URL de preview automatiquement créée ne doit pas être présentée comme sûre tant que Restrict previews, Access et les bindings distants ne sont pas tous validés.

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

État actuel : **non verte**. La restauration fictive, les audits et la recette locale sont prouvés. Il faut encore retirer effectivement le binding production après push, activer Restrict previews et Access, créer une D1 destinée aux données réelles et définir la sauvegarde réelle, l’effacement et la conservation.

## 9. SHA et livraison

| Élément | Valeur |
|---|---|
| SHA final | transmis dans le handoff final après commit/push, non figé dans ce document |
| branche cible | `codex/levois-phase2-5-security-access` |
| preview automatique | transmise dans le handoff final après push ; elle ne vaut pas URL cockpit sûre sans Access |
| statut Git final | transmis dans le handoff final après commit/push |

Aucun merge vers `main`, aucun force-push et aucun déploiement manuel de production ne sont autorisés.

## 10. Limites restantes

- Access/MFA et hostname privé non opérationnels ;
- onboarding Zero Trust sans plan actif, previews publiques malgré Fail closed et DNS cockpit absent ;
- binding Pages Preview encore relié à `levois-recherche` ;
- bindings non-production préparés pour le cockpit et `/api/recherche`, mais non encore observés après déploiement ;
- aucune D1 cockpit de données réelles créée ;
- restauration distante fictive validée mais workflow manuel à revalider après toute migration ;
- première D1 de restauration partielle à supprimer après validation explicite ;
- suppression complète d’un dossier sans commande/UI auditable ;
- conservation et durée des sauvegardes non validées ;
- rate limiting cockpit non implémenté ;
- logs d’échecs d’authentification gérés par Cloudflare uniquement ;
- inspection des bindings et recette distante à effectuer après push.

## Conclusion

La base technique peut continuer à être testée localement et directement sur la D1 fictive. La migration Astro élimine les vulnérabilités observées et Fail closed est actif, mais la séparation Pages preview/production n’est pas encore démontrée. Sans retrait du binding de production, Restrict previews et Cloudflare Access opérationnel/testé, **STOP — ne pas autoriser les données réelles**.

La Phase 3 n’est pas commencée.
