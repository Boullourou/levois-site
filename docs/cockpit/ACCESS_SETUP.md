# Cloudflare Access — configuration du cockpit

> **État au 18 août 2026 : BLOQUANT.** Pages Preview est désormais réglé sur **Fail closed**, mais les previews restent publiques. L’onboarding Zero Trust est seulement partiel : aucun plan actif, aucune application/politique/AUD/MFA, et aucun DNS `cockpit.levois.fr`. **Aucune donnée réelle ne doit être saisie tant que toute la recette distante de ce document n’est pas verte.**

La cible est une application Access self-hosted couvrant l’hôte entier `cockpit.levois.fr`, avec une seule identité autorisée au départ : Mouaad, authentifié avec MFA. Le domaine public et les previews `pages.dev` ne doivent jamais servir de chemin de contournement vers le cockpit.

## Défense applicative déjà présente

Pour chaque page `/cockpit/*` et chaque route `/api/cockpit/*`, le serveur :

1. refuse tout hostname distant absent de `COCKPIT_ALLOWED_HOSTS` ;
2. exige `Cf-Access-Jwt-Assertion` hors bypass local ;
3. récupère les clés publiques depuis `https://<TEAM_DOMAIN>/cdn-cgi/access/certs` ;
4. vérifie la signature RS256, l’issuer, l’audience et exige `exp`, `nbf` et `sub` avec `jose` ;
5. exige `type=app`, `sub` et `email` dans le jeton signé ;
6. compare l’email à `COCKPIT_ALLOWED_EMAIL` et, si configuré, le sujet à `COCKPIT_ALLOWED_SUB` ;
7. ajoute `Cache-Control: private, no-store`, `X-Robots-Tag: noindex, nofollow, noarchive` et les autres en-têtes privés.

Un simple en-tête email, y compris `Cf-Access-Authenticated-User-Email`, n’est jamais accepté comme preuve d’identité. Les API appliquent la même vérification que le HTML.

Référence officielle : [validation du JWT Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/).

`exp`, `nbf` et `sub` sont obligatoires dans l’implémentation actuelle. Les tests refusent un JWT sans `nbf` ou dont `nbf` est futur. Lors de la future recette Access, il faudra confirmer que les JWT réellement émis contiennent bien ce claim.

## Constat distant actuel

- **Pages → Preview access** affiche encore l’action « Restrict previews » : la preview est publique au niveau plateforme ;
- **Pages → Preview fail mode** est maintenant sur **Fail closed** ;
- **Pages → Preview bindings** contient seulement `RECHERCHE_DB → levois-recherche`, sans `COCKPIT_DB` ni variables cockpit ;
- l’onboarding **Zero Trust** a été commencé, mais aucun plan n’est actif et aucune application/politique/AUD/MFA n’existe ;
- aucun enregistrement DNS `cockpit.levois.fr` n’existe ;
- aucune application, audience ou politique Access n’a donc pu être testée.

Fail closed retire un risque de contournement par service statique lorsque les Functions sont indisponibles. Il ne rend pas la preview privée : Restrict previews et l’application Access restent indispensables.

## Initialiser Zero Trust

Cette opération est actuellement à faire dans le Dashboard Cloudflare par le propriétaire du compte :

1. Reprendre l’onboarding **Zero Trust** et activer un plan approprié.
2. Choisir un **Team Domain** stable. Le noter dans le gestionnaire de secrets ; ne pas le deviner à partir du nom de zone.
3. Activer de préférence **Cloudflare Access Independent MFA** au niveau de l’organisation, avec application d’authentification ou clé de sécurité. Une alternative est un fournisseur d’identité externe qui impose et transmet réellement le MFA.
4. Dans les réglages MFA de l’application, exiger le MFA à chaque connexion ou documenter une durée courte explicitement approuvée. Un simple code envoyé par email ne doit pas être considéré comme le second facteur demandé.
5. Ne créer aucune règle `Bypass`, `Service Auth`, groupe de domaine entier ou règle `Everyone` autorisante.

Référence : [exigences MFA dans les politiques Access](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/mfa-requirements/).

Si l’organisation Zero Trust ou le MFA ne peuvent pas être initialisés, s’arrêter ici : l’état reste **NO-GO données réelles**.

## Durcir les previews Pages

Dans les paramètres **Preview** du projet Pages :

1. vérifier que **Fail closed** reste sélectionné — contrôle effectué le 18/08/2026 ;
2. activer **Restrict previews** ;
3. vérifier en fenêtre privée qu’une preview refuse l’accès avant toute donnée ;
4. conserver uniquement des fixtures fictives même après restriction.

Ne pas poursuivre tant que le Dashboard propose encore « Restrict previews » comme action non activée, même si Fail closed est déjà vert.

## Créer l’application deny-by-default

Dans **Zero Trust → Access → Applications** :

1. Créer une application **Self-hosted** nommée par exemple `LEVOIS Cockpit`.
2. Déclarer le domaine exact `cockpit.levois.fr` et couvrir l’hôte entier. Protéger ainsi `/cockpit/*`, `/api/cockpit/*` et toute autre route servie par cet hôte.
3. Choisir une durée de session courte et explicite ; proposition initiale : 8 heures maximum, à valider par Mouaad.
4. Ajouter en première position une politique **Allow — Mouaad avec MFA** :
   - `Include` : l’adresse exacte du seul compte de Mouaad, renseignée dans Cloudflare et jamais dans Git ;
   - `Require` : méthode d’authentification `mfa`, ou condition équivalente documentée par le fournisseur d’identité ;
   - aucune identité, domaine ou groupe supplémentaire.
5. Access est deny-by-default : une identité qui ne correspond pas à l’Allow est refusée. Une politique explicite **Block — Everyone** est optionnelle ; si elle est ajoutée, conserver l’Allow exacte avant elle et revalider l’ordre effectif.
6. Enregistrer et relever l’**Application Audience (`AUD`)** affichée par Access.
7. Vérifier qu’aucune autre application Access plus large ou politique réutilisable n’accorde un bypass à ce hostname.

Le DNS/custom domain doit pointer vers l’environnement cockpit prévu sans lancer de déploiement manuel de production. Tant que ce raccordement n’existe pas, il n’y a pas d’URL cockpit sûre à publier.

## Variables et secrets Cloudflare

Configurer ces valeurs dans l’environnement qui porte le cockpit, jamais dans Git :

| Nom | Nature | Valeur attendue |
|---|---|---|
| `CF_ACCESS_TEAM_DOMAIN` | variable | domaine d’équipe exact, par exemple `equipe.cloudflareaccess.com` |
| `CF_ACCESS_AUD` | secret recommandé | audience exacte de l’application `LEVOIS Cockpit` |
| `COCKPIT_ALLOWED_HOSTS` | variable | `cockpit.levois.fr` ; ajouter une preview seulement si elle possède sa propre protection Access validée |
| `COCKPIT_ALLOWED_EMAIL` | secret recommandé | l’unique identité de Mouaad |
| `COCKPIT_ALLOWED_SUB` | secret facultatif mais recommandé | le `sub` stable observé dans un JWT Access valide |
| `COCKPIT_CSRF_SECRET` | secret | valeur aléatoire indépendante, au moins 24 caractères |
| `COCKPIT_AUDIT_SECRET` | secret | autre valeur aléatoire indépendante, au moins 24 caractères |
| `COCKPIT_DB` | binding D1 | base dédiée à l’environnement ; jamais `RECHERCHE_DB` |

Ne jamais définir `COCKPIT_LOCAL_BYPASS` dans Cloudflare. Ne jamais copier les valeurs de secrets dans une commande consignée, un ticket, une capture ou Git.

Pour une preview de branche, les variables, secrets, l’application Access et `COCKPIT_ALLOWED_HOSTS` doivent correspondre au hostname exact de cette preview. Une URL `pages.dev` non couverte par Access doit rester refusée par l’application et ne doit contenir que des fixtures fictives.

## Recette distante obligatoire

Exécuter chaque test sur le hostname réellement protégé, d’abord avec uniquement la D1 preview et ses fixtures fictives. Conserver une preuve sans jeton ni donnée personnelle.

| Test | Résultat attendu | État au 18/08/2026 |
|---|---|---|
| navigateur privé, sans session Access | écran Access ou refus avant toute donnée | **bloqué : application Access absente** |
| mode de panne Preview | Fail closed | **activé dans Pages** |
| appel direct de `/api/cockpit/session` sans JWT | refus, aucune donnée | couvert en local ; à revalider après déploiement automatique |
| JWT falsifié | `401 ACCESS_INVALID` | couvert par la suite sécurité finale 16/16 |
| mauvaise audience | `401 ACCESS_INVALID` | couvert par la suite sécurité finale 16/16 |
| mauvais issuer | `401 ACCESS_INVALID` | couvert par la suite sécurité finale 16/16 |
| `nbf` absent ou futur | `401 ACCESS_INVALID` | couvert par la suite sécurité finale 16/16 |
| identité authentifiée mais non allowlistée | `403 IDENTITY_NOT_ALLOWED` | couvert par la suite sécurité finale 16/16 |
| identité Mouaad + MFA + JWT valide | accès au shell puis aux fixtures | **bloqué : AUD/MFA/app absents** |
| API privée appelée directement sans JWT | refus | couvert en local ; à revalider après déploiement automatique |
| `/cockpit/*` et `/api/cockpit/*` sur le domaine public LEVOIS | refus, même avec un simple header email | couvert par les tests applicatifs ; à revalider à distance |
| mutation depuis une autre Origin | `403 ORIGIN_INVALID` | couvert par la suite sécurité finale 16/16 |
| réponse privée | `private, no-store` et `noindex, nofollow, noarchive` | couvert en local ; à revalider à distance |
| réseau navigateur | aucune requête PostHog/analytics | couvert en recette locale ; à revalider à distance |

Après un test authentifié, vérifier également `exp`, puis attendre ou utiliser un jeton expiré de test pour confirmer le refus. Confirmer que le JWT Access réel contient `nbf`, désormais obligatoire. Ne pas copier un JWT réel dans les preuves.

Si un seul test échoue, retirer le binding ou désactiver l’application cockpit et conserver le statut **NO-GO données réelles**.

## Bypass local

Le bypass local nécessite simultanément :

- `COCKPIT_LOCAL_BYPASS=1` ;
- un hostname exactement égal à `localhost` ou `127.0.0.1`.

Un hostname distant, un sous-domaine ressemblant à localhost ou un simple header `Host` ne suffit pas. Sans la double condition, le serveur exige Access et refuse fermé.
