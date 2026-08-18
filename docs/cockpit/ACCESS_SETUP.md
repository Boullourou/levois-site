# Configuration Cloudflare Access

Le code applique une défense en profondeur, mais la politique Cloudflare Access reste une configuration manuelle obligatoire. Une preview sans configuration complète doit répondre par un refus ; elle ne doit jamais devenir un environnement de démonstration ouvert.

## Ce que le serveur vérifie

Pour chaque page `/cockpit/*` et chaque route `/api/cockpit/*`, le serveur :

1. refuse tout hostname distant absent de `COCKPIT_ALLOWED_HOSTS` ;
2. exige l’en-tête `Cf-Access-Jwt-Assertion` hors bypass local ;
3. récupère les clés publiques depuis `https://<TEAM_DOMAIN>/cdn-cgi/access/certs` ;
4. vérifie la signature RS256, l’issuer, l’audience et l’expiration obligatoire du JWT avec `jose` ;
5. exige `type=app`, `sub` et `email` dans le jeton signé ;
6. compare l’email à `COCKPIT_ALLOWED_EMAIL` et, si configuré, le sujet à `COCKPIT_ALLOWED_SUB` ;
7. ajoute des en-têtes `private, no-store`, `noindex`, `nosniff`, `DENY`, une CSP restrictive et une politique de permissions restrictive.

Un simple header email n’est jamais accepté comme preuve d’identité.

Référence officielle : [validation du JWT Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/).

## Variables et secrets

Configurer ces valeurs uniquement dans l’environnement Cloudflare concerné, jamais dans Git :

| Nom | Nature | Rôle |
|---|---|---|
| `CF_ACCESS_TEAM_DOMAIN` | variable | domaine d’équipe Access, avec ou sans `https://` |
| `CF_ACCESS_AUD` | variable/secrète | audience de l’application Access |
| `COCKPIT_ALLOWED_HOSTS` | variable | liste CSV exacte des hostnames autorisés |
| `COCKPIT_ALLOWED_EMAIL` | variable/secrète | identité autorisée, liste CSV ; une seule au départ |
| `COCKPIT_ALLOWED_SUB` | variable/secrète facultative | verrou supplémentaire sur le sujet JWT |
| `COCKPIT_CSRF_SECRET` | secret | HMAC des jetons CSRF, au moins 24 caractères |
| `COCKPIT_AUDIT_SECRET` | secret | empreinte HMAC des commandes, au moins 24 caractères |
| `COCKPIT_DB` | binding D1 | base cockpit propre à l’environnement |

Ne pas définir `COCKPIT_LOCAL_BYPASS` dans Cloudflare. Même s’il était présent, le code refuse son utilisation sur un hostname distant ; son absence reste la configuration correcte.

## Procédure preview, sans production

1. Créer une D1 dédiée à la preview et suivre [D1_SETUP.md](./D1_SETUP.md). Ne pas sélectionner `RECHERCHE_DB` ni une D1 de production.
2. Dans Cloudflare Zero Trust, créer une application Access de type self-hosted pour le hostname exact de preview, couvrant les chemins `/cockpit/*` et `/api/cockpit/*`.
3. Créer une politique `Allow` limitée à l’identité de Mouaad. Ne pas utiliser une règle générale de domaine si elle autoriserait d’autres comptes.
4. Relever l’Application Audience (`AUD`) et le Team Domain depuis Cloudflare.
5. Dans les paramètres **Preview** du projet Pages, ajouter le binding `COCKPIT_DB` vers la D1 preview séparée.
6. Ajouter les variables et secrets ci-dessus dans l’environnement **Preview** uniquement.
7. Ajouter le hostname exact à `COCKPIT_ALLOWED_HOSTS`.
8. Laisser la production inchangée. Aucun binding cockpit ni migration ne doit y être ajouté dans cette phase.
9. Déclencher uniquement le build automatique de branche déjà autorisé ; ne pas lancer de déploiement manuel.

Selon la configuration Pages, la protection des previews de branche peut aussi être activée depuis les paramètres Access du projet. Dans tous les cas, la validation applicative du JWT reste active. Voir la [documentation du plugin Access pour Pages Functions](https://developers.cloudflare.com/pages/functions/plugins/cloudflare-access/).

## Vérification avant toute donnée réelle

Effectuer les contrôles suivants avec uniquement les fixtures fictives :

- fenêtre privée, non authentifiée : `/cockpit/` est refusé ;
- requête directe non authentifiée vers `/api/cockpit/session` : `401` ;
- JWT signé pour une autre audience : `401` ;
- identité Access valide mais non allowlistée : `403` ;
- hostname non allowlisté : `403` ;
- identité autorisée : chargement du shell puis des données fictives ;
- mutation depuis une origine différente : `403` ;
- réponse cockpit : `Cache-Control: private, no-store` et `X-Robots-Tag: noindex, nofollow, noarchive` ;
- aucune requête PostHog ou analytics depuis le cockpit.

Si l’un de ces contrôles échoue, ne saisir aucune donnée réelle. La preview doit rester une démonstration fictive ou être désactivée.

## Bypass local

Le bypass local nécessite simultanément :

- `COCKPIT_LOCAL_BYPASS=1` ;
- un hostname exactement égal à `localhost` ou `127.0.0.1`.

Une URL distante, un sous-domaine ressemblant à localhost ou un header `Host` non autorisé ne suffit pas. Sans la double condition, le serveur exige Access et refuse fermé.
