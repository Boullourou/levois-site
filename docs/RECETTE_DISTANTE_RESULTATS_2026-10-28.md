# Recette distante LEVOIS — résultats du 28 octobre 2026

Les trois diagnostics et le contact ont été vérifiés dans la preview authentifiée. Les quatre demandes ont été enregistrées, les sept e-mails acceptés par Resend et **Mouaad a confirmé la réception des sept messages** dans ce chat. Le rejeu exact d'un diagnostic et du contact n'a déclenché aucune nouvelle tentative de transport.

Cette conclusion porte sur les scénarios ci-dessous. Elle ne vaut ni recette exhaustive de production ni autorisation de fusion, migration ou activation du calendrier.

## Version et périmètre

- Commit applicatif testé : `70e7abba461e1d3e65f5e908d4887a61b23477a6`.
- Branche : `codex/editorial-conversion-20261028`, [PR nº 5](https://github.com/Boullourou/levois-site/pull/5).
- [Preview utilisée](https://codex-editorial-conversion-2.levois-site.pages.dev/) ; [déploiement immuable correspondant](https://499272a1.levois-site.pages.dev/).
- D1 preview vérifiée : `308c98e9-d484-4fdd-9892-539abb6b0ffd`. Les tables nécessaires, dont `contact_delivery_receipts`, sont présentes.
- Production toujours sur `3737bc9`, déploiement `723ae144-3a72-4ec5-ab0c-571be11ae4e8`, selon la lecture Cloudflare de 14:41 UTC. Aucune action de publication ni écriture de production effectuée.
- Identités fictives `TEST LEVOIS`, téléphone vide. Boîte sous contrôle de Mouaad, explicitement autorisée. Aucun prospect réel utilisé.

La connexion Access appartient au navigateur. Aucun cookie n'a été exporté ; aucun secret ni droit d'accès n'a été créé ou modifié. Cette connexion ne valide pas l'authentification des scripts ou de GitHub Actions.

## Parcours et livraison réelle

| Parcours | Largeur de fenêtre | Envoi initial UTC / Paris | Confirmation serveur | Preuve durable et réception |
|---|---:|---|---|---|
| Vendeur, visites sans offre | 390 px | 14:29:41 / 15:29:41 | HTTP 200, `ok`, `saved`, copie et conseiller `sent` | 1 demande, 2 acceptations Resend ; 2 messages reçus |
| Acheteur, logement introuvable | 360 px | 14:31:39 / 15:31:39 | HTTP 200, mêmes états | 1 demande, 2 acceptations Resend ; 2 messages reçus |
| Vente-achat, crainte d'une période sans logement | 430 px | 14:33:17 / 15:33:17 | HTTP 200, mêmes états | 1 demande, 2 acceptations Resend ; 2 messages reçus |
| Contact depuis « Construire un lancement cohérent » | 390 px | 14:39:27 / 15:39:27 | HTTP 200, `ok`, notification `sent` | 1 reçu contact, 1 acceptation Resend ; 1 message reçu |

Les états `sent` signifient acceptation par le prestataire. La réception en boîte est une preuve distincte, fournie ici par la confirmation explicite de Mouaad. Aucune vérification indépendante du classement inbox/indésirables ni comparaison intégrale des corps reçus n'est revendiquée.

Les lectures D1 ont été limitées aux quatre UUID de test : aucun message, contexte, e-mail ou autre demande n'a été extrait. Les SELECT indiquent zéro écriture. Le relevé initial du 28 octobre à 14:41:06 UTC montre trois lignes diagnostic et une ligne contact, avec sept compteurs de transport à `1`.

## Comportements observés

- Les trois questionnaires aboutissent à une synthèse visible avant les coordonnées, composée du constat, de l'angle mort, de la prochaine étape, des limites et de deux lectures adaptées.
- Le retour de la question 3 à la question 2 du vendeur conserve la sélection. Un contrôle au clavier avec Espace/Entrée fonctionne ; cela ne constitue pas une recette exhaustive avec lecteur d'écran.
- Le vendeur soumis sans prénom déclenche une erreur visible et place le focus sur le champ. Le contact sans consentement affiche l'accord manquant et place le focus sur la case. Dans ces deux essais, aucun POST ne part.
- Le double clic sur l'envoi de la synthèse acheteur produit exactement un POST.
- Après confirmation, le bouton diagnostic indique « Analyse transmise au service d'envoi » ; le contact indique « Message transmis ». Les textes distinguent transmission, réception et lecture.
- Depuis l'article, le contact reprend le titre et le contexte public `article=lancement-coherent`. Aucune réponse personnelle n'est ajoutée à l'URL.
- La synthèse jointe est facultative et son aperçu est accessible. La session utilisée successivement pour trois projets conserve aussi leurs réponses précédentes, visibles dans l'aperçu ; les scénarios réels ont tous utilisé des réponses fictives.
- Le piège antispam `site_web` est vide, masqué par son conteneur, absent de l'arbre accessible, sans rectangle affiché et avec `tabindex=-1`.
- Aucun débordement horizontal n'a été observé sur les synthèses aux fenêtres 360, 390 et 430 px, ni sur le contact à 390 px. Les captures incluent la barre de navigation et les actions.

## Rejeu et erreurs serveur

Après réception des sept messages, Mouaad a autorisé explicitement deux rejeux, avec le risque annoncé de trois e-mails supplémentaires si l'anti-doublon était défectueux. Le contrôle automatique avait d'abord bloqué cette opération ; aucune requête n'était partie avant l'accord complémentaire.

Un diagnostic et le contact ont ensuite été rejoués une seule fois chacun, **avec le même corps et le même UUID**, dans la session authentifiée. Ils ont rendu HTTP 200 et les états déjà confirmés. Le contrôle D1 de **14:48:23 UTC** constate des états, fournisseurs, compteurs et horodatages strictement inchangés sur les quatre reçus : **aucune nouvelle tentative de transport**. Ce résultat vérifie ces deux reprises ; il ne garantit pas un « exactement une fois » universel jusque dans une boîte e-mail.

| Contrôle réel | Résultat |
|---|---|
| GET `/api/experience/actions` et `/api/lead` | HTTP 405, refus explicite |
| POST `{}` sur chacun des deux endpoints | HTTP 400, erreur compréhensible, `ok:false` |
| POST contenant seulement `site_web: recette-antispam`, sur chacun | HTTP 400, demande non transmise, `ok:false` |
| Réponses des envois réussis et rejeux | `Cache-Control: private, no-store, max-age=0` |
| Erreurs API | `no-store` ; `private, no-store, max-age=0` pour Experience ; `X-Content-Type-Options: nosniff` |

Les POST invalides ne contenaient aucune coordonnée ni consentement. Le code et les tests placent leur rejet avant le traitement des demandes ; aucun scan global des demandes n'a été réalisé pour les contrôler.

## HTTP éditorial

- `/editorial-manifest.json` : HTTP 200 JSON, catalogue éditorial nouveau vide (`articles: []`). Ce résultat n'est pas un reçu de publication d'un premier lot réel. Les articles historiques restent distincts de ce catalogue.
- `/robots.txt` : HTTP 200 texte, sitemap déclaré ; en-tête preview `X-Robots-Tag: noindex`.
- `/sitemap-index.xml` et `/sitemap-0.xml` : HTTP 200 XML. Les URL référencées sont celles de `https://levois.fr`.
- `/lecture/` : canonical de production sans paramètre et meta `noindex,nofollow`.
- Deux erreurs de console sans URL source ont été relevées lors de l'ouverture des XML (`Cannot use 'in' operator to search for 'animation' in undefined`). Une nouvelle navigation sur le sitemap reproduit l'erreur ; aucun échec de formulaire ne lui est attribué. La source exacte navigateur/outillage reste non identifiée.

## Captures

- [Vendeur, fenêtre 390 px](review/2026-10-28/remote/seller-before-390.png)
- [Acheteur, fenêtre 360 px](review/2026-10-28/remote/buyer-before-360.png)
- [Vente-achat, fenêtre 430 px](review/2026-10-28/remote/transition-before-430.png)
- [Confirmation du contact, fenêtre 390 px](review/2026-10-28/remote/contact-confirmation-390.png)

La largeur utile des captures est inférieure de 15 px à celle de la fenêtre, du fait de la barre de défilement. Les images et résultats détaillés privés restent aussi dans `artifacts/remote-recipe-20261028/`. Les reçus minimaux D1 avant/après et le contrôle de version sont dans `artifacts/editorial-20261028/authorized-preview-*.json`. Aucun cookie, header d'authentification ou corps personnel n'est ajouté à la documentation.

## Limites et prérequis restants

1. **Pannes simulées et stockage refusé à distance** : non rejoués dans cette session. Le navigateur connecté n'expose pas l'interception réseau demandée (`Network.setBlockedURLs` non pris en charge) ; aucune simulation n'a été appliquée. Les résultats locaux existants couvrent ces cas, ainsi que JavaScript indisponible, et restent identifiés comme locaux/simulés. Ils ne sont pas requalifiés en tests distants.
2. **Suite distante complète** : le runner ouvre un navigateur séparé et n'hérite pas d'Access. Son authentification machine et la politique compatible restent à valider. Le test mobile manuel ci-dessus ne remplace pas ses 47 scénarios ni une nouvelle passe Axe distante. Le bandeau de confidentialité n'a pas été réinitialisé dans la session existante.
3. **Production A** : appliquer seulement après décision séparée la migration additive `db/contact-delivery.sql`, recontrôler le schéma puis déployer le commit validé. La table manquante en production n'a pas été créée ici. Voir [la procédure A/B](MISE_EN_PRODUCTION_LEVOIS_2026-10-28.md).
4. **Calendrier B** : fournir/revoir les sept journées réelles et leurs métadonnées, vérifier les permissions GitHub/Access et la consommation des reçus par Limova. Aucun calendrier, connecteur social ou lot réel n'a été activé.

Aucun code applicatif n'a été modifié pendant cette recette. Les 588 tests et le build du candidat sont ceux consignés dans [la préparation](PREPARATION_LOTS_ET_PRODUCTION_2026-10-28.md) ; ils n'ont pas été relancés artificiellement pour cette documentation. Aucun nouveau score de performance ou gain de conversion n'est annoncé.
