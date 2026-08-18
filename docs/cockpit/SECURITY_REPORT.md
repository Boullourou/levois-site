# Rapport de sécurité — cockpit Phase 2.5

## Décision au 18 août 2026

**NO-GO données réelles.**

La mise à niveau applicative retient Astro `7.2.3` ; les audits runtime et complet sont à 0. Le déploiement automatique `8a8426a0-44c4-4fe4-9dda-4cb2cf3d8931` refuse les requêtes anonymes par redirect Access et Fail closed est actif. La configuration Pages téléchargée confirme les deux D1 non-production en Preview/default et uniquement `RECHERCHE_DB` production dans `env.production`. La séparation D1 est verte. La politique Access exacte, l’allowlist Mouaad, le MFA, le login positif, l’AUD/issuer applicatifs, les secrets BFF et le DNS cockpit ne sont toutefois pas validés : **NO-GO données réelles**.

Le refus fermé du code réduit le risque d’exposition accidentelle, mais ne constitue pas à lui seul la protection en bordure demandée. Aucun dossier client, Accord TIM réel, coordonnée, transcription ou montant réel ne doit être saisi avant la recette Access/MFA complète et la validation de [REAL_DATA_CHECKLIST.md](./REAL_DATA_CHECKLIST.md).

## Supply chain et runtime

| Élément | État Phase 2.5 |
|---|---|
| Astro | `7.2.3`, retenu après validation par paliers 4 → 5 → 6 → 7 |
| Node | cible `22.23.2`, minimum `>=22.12.0` |
| npm | lockfile reproductible avec npm `10.9.2` |
| `npm audit --omit=dev --json` | 0 vulnérabilité observée après migration |
| audits final runtime + complet | 0 vulnérabilité |
| tests/build finaux post-`npm ci` | 96/96 ; cockpit 55/55 ; sécurité 16/16 ; market 6/6 ; build 33 pages |

La liste exacte des advisories historiques, leurs chemins, leur applicabilité et leurs versions corrigées est conservée dans [`../security/ASTRO_AUDIT_2026-08.md`](../security/ASTRO_AUDIT_2026-08.md).

## Contrôles applicatifs implémentés

| Surface | Contrôle |
|---|---|
| Pages privées | middleware sur `/cockpit/*`, authentification avant livraison de la page |
| API privée | authentification répétée dans le BFF `/api/cockpit/*` |
| JWT Access | validation RS256 via JWKS, issuer, audience ; `exp`, `nbf` et `sub` obligatoires |
| Identité | `type=app`, `sub` et email issus du JWT signé ; email allowlisté, sujet facultativement allowlisté |
| Hostname | allowlist distante obligatoire ; localhost traité séparément |
| Développement | bypass uniquement avec `COCKPIT_LOCAL_BYPASS=1` et hostname exact `localhost`/`127.0.0.1` |
| Mutations | même Origin, `application/json`, CSRF HMAC lié à l’acteur et à l’origine, expiration de 30 minutes |
| Idempotence | clé requise, empreinte HMAC du payload, reçu d’audit ; paiement unique par compensation + clé |
| Concurrence | versions d’agrégat et `409` en cas d’écriture obsolète |
| D1 | binding `COCKPIT_DB` dédié, aucun fallback `RECHERCHE_DB`, erreurs de base en `503` |
| Cache/indexation | `private, no-store`, `Pragma: no-cache`, `X-Robots-Tag: noindex, nofollow, noarchive` |
| Navigateur | `nosniff`, `no-referrer`, `DENY`, CSP et Permissions Policy restrictives |
| HTML statique | coque sans donnée client, chargement depuis le BFF après authentification |
| Analytics | layout cockpit indépendant, sans composant Analytics/PostHog |
| Hors ligne | manifeste installable, aucun service worker ni cache de dossiers privés |
| Saisie/rendu | validation serveur, limites de longueur, enums fermées, rendu dynamique par `textContent` |
| Markdown | export à la demande, échappement, périmètre strict du dossier, mode sans coordonnées |
| Historique | critères, statuts TIM, termes, paiements et audit sans réécriture silencieuse |
| Données exclues | aucun audio, transcription brute, pièce jointe, banque ou document interne en V1 |

Le MFA n’est pas réimplémenté dans l’application : il doit être imposé par Cloudflare Independent MFA ou par un fournisseur d’identité équivalent. Les tests applicatifs refusent `nbf` absent ou futur ; la future recette doit confirmer que les JWT Access réels contiennent ce claim et que la politique exige effectivement le MFA.

## Séparation public/privé et D1

- Les parcours publics ne sont pas reliés au cockpit et leur comportement n’est pas modifié par cette phase.
- Les routes cockpit utilisent un layout dédié sans analytics public.
- Le BFF cockpit n’accède qu’à `COCKPIT_DB` et n’a aucun fallback vers `RECHERCHE_DB`.
- La D1 cockpit créée est `levois-cockpit-preview-phase2-5` (`88539c49-0d41-42df-a3b1-1a269e1acbe3`).
- La D1 recherche créée est `levois-recherche-preview-phase2-5` (`308c98e9-d484-4fdd-9892-539abb6b0ffd`) : schéma `lectures_recherche`, 0 ligne.
- La configuration Pages téléchargée après push pointe Preview/default vers `COCKPIT_DB` et `RECHERCHE_DB` non-production.
- `env.production` contient seulement `RECHERCHE_DB → levois-recherche` et aucun binding cockpit.
- Seules les migrations 0001–0006 et `db/fixtures/cockpit-v1.sql` ont été appliquées à la D1 preview.
- `PRAGMA foreign_key_check` est vide ; les comptages fictifs sont `person=3`, `project=2`, `tim_agreement=2`, `lab_observation=1`.
- Aucune D1 cockpit de production n’a été créée ou migrée.

Les deux bases preview sont séparées et sans donnée réelle ; **la séparation de l’environnement Pages est verte**. La D1 recherche fictive maintient le schéma nécessaire à `/api/recherche` sans utiliser la production. Son comportement après login Access reste à tester.

## Minimisation

- Les coordonnées sont facultatives lors de la création d’une personne.
- Le consentement reste `unknown` lorsqu’aucune preuve n’est enregistrée.
- Les contacts uniquement associés à TIM restent hors de la liste Clients sans projet directement accompagné.
- Le sujet d’un Accord TIM peut rester un libellé minimisé.
- Les interactions stockent un résumé utile, jamais une transcription brute.
- Les montants TIM sont limités aux unités mineures, devise, états, dates et références opérationnelles ; aucune coordonnée bancaire n’est prévue.
- LEVOIS Lab exige une anonymisation et une validation humaines.
- L’export permet d’omettre email et téléphone.

## Traçabilité

`audit_event` enregistre les commandes réussies et les exports avec acteur, action, cible, clé d’idempotence et empreinte HMAC. Le payload brut n’est pas copié dans l’audit. Les événements de critère, états TIM, paiements et versions de termes conservent leur propre historique.

Limite : les refus d’authentification restent dans les journaux Cloudflare/Access et ne sont pas enregistrés dans D1. Une politique de conservation et d’accès à ces journaux doit être validée avant exploitation réelle.

## Risques résiduels

| Risque/limite | État | Mesure obligatoire |
|---|---|---|
| Zero Trust/Access | **bloquant, onboarding partiel sans plan actif** | activer le plan, créer l’application deny-by-default, MFA et une seule identité ; exécuter tous les tests distants |
| Preview Pages | Fail closed et refus anonyme `302` actifs | valider policy, allow Mouaad, MFA et login positif avant toute donnée réelle |
| Binding Preview | **vert : deux D1 non-production** | conserver la preuve téléchargée et recontrôler après tout changement Pages |
| Hostname cockpit sûr | DNS absent | raccorder `cockpit.levois.fr` à l’environnement attendu et vérifier qu’aucun `pages.dev` ne contourne Access |
| Routes publiques preview | D1 recherche fictive créée, 0 ligne ; accès anonyme refusé | tester `/api/recherche` après login Access |
| Secrets Cloudflare | non configurés/vérifiés | créer, séparer et faire tourner les secrets ; aucun dans Git |
| Audits de dépendances | runtime et complet à 0 | conserver le résultat et rejouer après toute modification du lockfile |
| Sauvegarde/restauration | test fictif validé ; workflow manuel | conserver migrations + export données seules, chiffrer hors Git pour le réel, revalider après chaque migration |
| D1 de première tentative | base partielle encore présente | supprimer `629bb438-21c7-45e3-8ebc-cf0ef101d80a` après validation explicite |
| Rate limiting | absent | Access + identité unique limitent l’exposition ; ajouter avant élargissement d’audience |
| Suppression complète d’un dossier | pas de commande/UI | définir un workflow d’effacement audité avant exploitation durable |
| Conservation configurable | non implémentée | valider les durées et la revue périodique avant première saisie réelle |
| Journal des refus | Cloudflare uniquement | limiter l’accès et fixer une conservation |
| Headers HSTS/TLS | plateforme | vérifier la zone et le hostname après raccordement |
| Recette mobile/fonctionnelle locale | validée avec fixtures fictives | la rejouer à distance seulement après Access et bindings sûrs |

## Go/no-go

### Autorisé maintenant

- installation, audits, tests et build locaux ;
- démonstration locale avec fixtures fictives ;
- commandes directes sur la D1 cockpit preview séparée avec fixtures fictives ;
- configuration manuelle de Cloudflare Access et tests négatifs/positifs avec les seules fixtures.

### Interdit maintenant

- toute saisie de donnée réelle, dont les dossiers et Accords TIM existants ;
- connexion de la preview à une D1 de production ;
- ajout d’une `RECHERCHE_DB` de production à l’environnement preview ;
- déploiement manuel en production ;
- copie de sauvegarde, JWT, secret, export client ou donnée réelle dans Git ;
- ouverture publique temporaire du cockpit ;
- utilisation de la preview avec données réelles tant que la policy, Mouaad, MFA, le login positif et les secrets BFF ne sont pas validés ;
- démarrage de la Phase 3.

Le passage au statut GO exige simultanément : audit final sans HIGH applicable au runtime, Access/MFA opérationnel, aucune D1 production dans la preview, restauration testée et checklist données réelles entièrement verte.
