# Rapport de sécurité — cockpit V1

## Conclusion

Le code est conçu pour refuser fermé et pour séparer le cockpit du site public et de sa D1 actuelle. Il est adapté à une démonstration locale ou preview avec fixtures fictives. Il ne doit recevoir aucune donnée réelle tant que Cloudflare Access, les secrets, l’allowlist de hostname et d’identité, ainsi qu’une D1 preview séparée n’ont pas été configurés et testés manuellement.

## Contrôles implémentés

| Surface | Contrôle |
|---|---|
| Pages privées | middleware sur `/cockpit/*`, authentification avant livraison de la page |
| API privée | authentification répétée dans le BFF `/api/cockpit/*` |
| Access | validation cryptographique RS256 via JWKS, issuer, audience, expiration et contraintes temporelles |
| Identité | `sub` et email issus du JWT signé, email obligatoire dans une allowlist, sujet optionnellement allowlisté |
| Hostname | allowlist distante obligatoire ; localhost traité séparément |
| Développement | bypass uniquement avec `COCKPIT_LOCAL_BYPASS=1` et hostname exact `localhost`/`127.0.0.1` |
| Mutations | même Origin, `application/json`, CSRF HMAC lié à l’acteur et à l’origine, expiration de 30 minutes |
| Idempotence | clé requise, empreinte HMAC du payload, reçu d’audit ; paiement unique par compensation + clé |
| Concurrence | versions d’agrégat et réponses `409` en cas d’écriture obsolète |
| D1 | binding `COCKPIT_DB` dédié, absence de fallback vers `RECHERCHE_DB`, erreurs de base en `503` |
| Cache/indexation | `Cache-Control: private, no-store`, `Pragma: no-cache`, `X-Robots-Tag: noindex, nofollow, noarchive` |
| Navigateur | `nosniff`, `no-referrer`, `X-Frame-Options: DENY`, Permissions Policy restrictive |
| HTML statique | coque sans donnée client, données chargées depuis le BFF après authentification |
| Analytics | layout cockpit indépendant, sans composant Analytics/PostHog |
| Hors ligne | manifeste installable, aucun service worker et aucune donnée privée mise en cache hors ligne |
| Saisie/rendu | validation serveur, limites de longueur, enums fermées ; rendu dynamique par `textContent` |
| Markdown | export à la demande, échappement des contenus, périmètre strict du dossier, mode sans coordonnées |
| Historique | critères, statuts TIM et audit conservés sans réécriture silencieuse |
| Données sensibles | aucune prise en charge d’audio, transcription brute, pièce jointe ou fichier en V1 |

## Séparation public/privé

- Les parcours publics ne sont pas modifiés et ne sont pas reliés au cockpit.
- Les routes cockpit utilisent un layout dédié et ne chargent pas les composants analytiques publics.
- La D1 publique `RECHERCHE_DB` n’est jamais consultée par le BFF cockpit.
- Le fichier local Wrangler contient des identifiants D1 nuls et ne peut pas désigner une base distante réelle.
- La base preview doit être créée et bindée manuellement ; aucune D1 de production n’est configurée par cette phase.

## Minimisation

- Coordonnées facultatives lors de la création d’une personne.
- Consentement initial `unknown` si aucune preuve n’existe.
- Les contacts uniquement associés à TIM restent hors de la liste Clients sans projet directement accompagné.
- Le sujet d’un Accord TIM peut rester un simple libellé minimisé.
- Les interactions stockent un résumé, jamais une transcription brute.
- LEVOIS Lab impose une confirmation humaine d’anonymisation.
- L’export permet d’omettre email et téléphone.

## Traçabilité

`audit_event` enregistre les commandes métier réussies et les exports avec acteur, action, cible, clé d’idempotence et empreinte HMAC. Le contenu brut de la requête n’est pas copié dans l’audit. Les événements de critère, états TIM, paiements et versions de termes assurent leur propre historique.

## Risques résiduels et actions manuelles

| Risque/limite | État | Mesure requise |
|---|---|---|
| Politique Access non versionnée | manuel | suivre `ACCESS_SETUP.md`, limiter à Mouaad, tester négativement |
| D1 preview non créée/bindée | manuel | créer une base séparée et vérifier le binding `COCKPIT_DB` |
| Données réelles avant validation | interdit | conserver uniquement les fixtures fictives |
| CSP dédiée | implémentée | valider la politique avec Cloudflare Access et les assets de preview avant toute donnée réelle |
| Dépendances Astro 4 | `npm audit --omit=dev` signale 5 vulnérabilités hautes et 2 modérées | traiter dans une branche de mise à niveau dédiée ; `npm audit` propose Astro 7.2.3, une migration majeure trop risquée pour les parcours publics dans cette phase |
| Rate limiting cockpit | non ajouté | Access et allowlist réduisent l’exposition ; ajouter une limite si l’audience s’élargit |
| Journal des refus d’authentification | non persisté dans D1 | utiliser les logs Access/Cloudflare ; définir une politique de conservation |
| Suppression complète d’un dossier | pas de commande/UI | concevoir un workflow d’effacement audité avant exploitation durable |
| Conservation configurable | pas de commande/UI | définir durées et jobs de revue avant production de données réelles |
| Sauvegardes | opération manuelle | exporter hors Git, chiffrer et tester une restauration |
| Secrets | hors Git mais à créer | utiliser les secrets Cloudflare et organiser leur rotation |
| Headers de transport (HSTS/TLS) | plateforme | vérifier la configuration de zone Cloudflare |
| Recette Workerd Windows | validée localement | rejouer la même recette sur la D1 preview séparée après configuration Access |

## Décision go/no-go

### Autorisé maintenant

- tests automatisés ;
- build Astro ;
- démonstration locale avec fixtures fictives ;
- preview de branche fermée, sans binding de production, si Access et la D1 preview sont validés.

### Non autorisé maintenant

- saisie des dossiers ou Accords TIM réels ;
- connexion de `COCKPIT_DB` à une D1 de production ;
- réutilisation de `RECHERCHE_DB` ;
- déploiement manuel en production ;
- copie de sauvegarde, export client ou secret dans Git ;
- ouverture publique temporaire de la preview.
- saisie de données réelles avant traitement ou acceptation formelle du risque de dépendances Astro 4 signalé par `npm audit`.
