# LEVOIS — contenu, réponse utile et demande qualifiée

Audit et corrections du 28 octobre 2026. Branche `codex/editorial-conversion-20261028`, base `3737bc944e4a926509054f8c5001f9448cd290a5`. Ce mandat prépare une preview et une PR ; il n’autorise pas leur fusion ni une publication en production.

## État confirmé de l’environnement

- Dépôt public `Boullourou/levois-site`, branche de production `main`. Astro 7.4.2 produit des fichiers statiques ; les API sont des Cloudflare Pages Functions. Aucun CMS, base d’articles ou endpoint Limova n’a été découvert.
- Cloudflare Pages `levois-site` : intégration GitHub active, `npm run build`, dossier `dist`, previews de branches activées. Domaines existants : `levois.fr`, `www.levois.fr`, `levois-site.pages.dev`.
- Production observée avant travail : déploiement `723ae144-3a72-4ec5-ab0c-571be11ae4e8`, commit `3737bc9`, réussi le 27 octobre. Les variables, domaines et bindings de production sont conservés.
- D1 `RECHERCHE_DB` production : `077d24f8-5efc-4787-a451-05b041ddd2f7`. Preview : `308c98e9-d484-4fdd-9892-539abb6b0ffd`. Le cockpit dispose en preview d’un autre binding D1. Aucun KV, R2 ou service lié n’est exposé dans la configuration Pages consultée.
- Resend est configuré dans les deux environnements ; le code conserve Formspree comme recours pour les demandes humaines. PostHog est chargé seulement après consentement, sous réserve des signaux de confidentialité du navigateur. Sa clé publique d’ingestion n’est pas un secret de serveur.
- La preview ne possédait initialement que `lectures_recherche`. Les schémas additifs `db/experience.sql`, `db/experience-email-leads.sql` et `db/contact-delivery.sql` y ont été appliqués. **Aucune migration de production** n’a été effectuée.
- Les secrets de reprise protégée sont présents en production, absents en preview. L’envoi de synthèse et le contact ne les nécessitent pas. La reprise distante protégée n’est pas déclarée validée en preview.

## Constats et corrections

| Priorité | Constat confirmé | Correction et preuve |
|---|---|---|
| P0 | Le dernier article affirme 80 % de visibilité, 90 jours et une perte de 25 000 € sans preuve retrouvée. Son cas est présenté comme réel et illustratif. | Chiffres et garanties supprimés ; mécanisme conditionnel sans montant fictif. Titre, extrait, description, OG et Article utilisent le texte corrigé. Ancien slug conservé. Relevé complet dans `AUDIT_AFFIRMATIONS_2026-10-28.md`. |
| P0 | Sans JavaScript, le contact et le formulaire initial des diagnostics sans méthode explicite pouvaient soumettre les champs dans une URL GET. | Méthode POST explicite, bouton activé seulement après initialisation du contrôleur, accès e-mail/téléphone et liens utiles sans JavaScript. |
| P0 | Le contact pouvait être renvoyé après une réponse perdue ; le honeypot rempli recevait un faux `ok:true`. | Référence stable, reçu D1 et verrou atomique ; refus antispam sans succès. Confirmation uniquement après réponse serveur concordante et transport accepté. |
| P0 | La fiabilité de l’envoi ne se déduit pas d’un clic ou d’une extraction HTML. | Scénarios erreur réseau, refus du transport, confirmation incohérente, double clic et retry. Distinction enregistrement / service d’envoi / réception réelle. Aucun prospect réel utilisé. |
| P0 | Message de stockage bloqué présent dans le HTML mais masqué ; honeypot correctement caché. | Pas de faux diagnostic fondé sur l’extraction. Tests stockage normal/refusé, clavier et erreurs. Détails dans `AUDIT_FORMULAIRES_2026-10-28.md`. |
| P1 | La synthèse était réservée aux visiteurs laissant leurs coordonnées. | Trois blocs immédiatement visibles après les cinq questions, copie e-mail facultative ensuite. Règles métier et limites inchangées. |
| P1 | L’article et la lecture déjà obtenue devaient être réexpliqués au contact. | Identifiant public d’article dans les liens ; résolution canonique côté serveur. Aperçu et choix de joindre la synthèse par POST. Aucune réponse personnelle dans une URL. |
| P1 | Sept guides codés en dur, catégories attribuées par position, aucune pagination. | Catalogue partagé, quatre catégories, pages de 12, recherche globale chargée à la demande à partir de 12 ressources. Sept URL historiques conservées ; aucune série de landing pages. |
| P1 | Aucun mécanisme réel de réception ou publication quotidienne. | JSON typé, import atomique/idempotent, revue Git, validation CI, calendrier Paris et workflow opt-in. Contrat complet dans `CONTRAT_LIMOVA_2026-10-28.md`. |
| P1 | Les pages de ressources imbriquaient deux éléments `main` ; pas de données structurées Article propres aux guides. | Un seul contenu principal, auteur et périmètre visibles, JSON-LD conforme, sources et limites explicites. Dates historiques inconnues non inventées. |
| P1 | Le clic submit était mesuré comme soumission sans confirmation serveur. | Événement de tentative nommé explicitement, événements distincts `synthesis_saved`, `synthesis_email_accepted`, `contact_message_accepted`. Propriétés textuelles arbitraires retirées. |
| P1 | Recrutement et recommandation occupaient une section importante de l’accueil. | Accès conservés dans la navigation secondaire du pied de page ; accueil centré sur le projet immobilier. Identité visuelle préservée. |

Les six autres corps d’articles restent conservés : leur examen n’a pas justifié une réécriture générale. Les durées de lecture non calculées ont été retirées, y compris des cartes d’accueil. La page de confidentialité décrit désormais la restitution immédiate, le contexte public et les reçus techniques, sans modifier le choix préalable d’audience.

## Hypothèses de conversion à mesurer

1. Une réponse utile avant les coordonnées peut renforcer la confiance et la pertinence des demandes. Aucun taux de gain n’est démontré.
2. Un CTA adapté au sujet et le rappel du contexte peuvent réduire les répétitions. Le simple clic n’établit pas une intention qualifiée.
3. Séparer le projet immobilier du recrutement peut rendre le choix initial plus lisible. Ce n’est pas une preuve d’amélioration commerciale.

Mesurer, avec consentement : entrée de parcours → fin des questions → résultat vu → projet enregistré → e-mail accepté ou message accepté. `article_id` désigne uniquement un article public connu. Noms, coordonnées, adresses recherchées, réponses, messages, identifiants de dossier et paramètres de campagne restent exclus. Les enregistrements de session et l’autocapture des champs restent désactivés.

**Indicateur métier principal : demandes réellement qualifiées par Mouaad**, après examen du projet, du secteur, de la difficulté et de la suite volontaire. Ce jugement n’est pas déduit automatiquement de cinq réponses et n’est pas promis par l’analytics. Tenir un relevé agrégé hebdomadaire par sujet et parcours ; distinguer lectures, envois, demandes utiles et échanges réalisés. Aucun objectif chiffré arbitraire n’est fixé faute de référence de conversion mesurée.

## SEO, DVF et cache

- `robots.txt`, `sitemap-index.xml` et `sitemap-0.xml` répondent directement en HTTP 200. Leur existence est vérifiée sans dépendre d’un outil de lecture externe.
- Canonicals de production fondées sur le chemin, sans paramètres UTM ou `article`. Previews Cloudflare à vérifier avec leur en-tête `X-Robots-Tag`. Les pages de lecture/reprise/cockpit restent hors sitemap.
- Contrôle statique des titres, descriptions, OG, JSON-LD, liens et sitemap par `scripts/audit-editorial-seo.mjs`. Les sources ajoutées expliquent le sujet ; elles ne valident pas rétroactivement des chiffres retirés. Aucun backlink externe n’est considéré acquis par un lien interne ou une publication LinkedIn.
- DVF : DGFiP / Etalab, extraction indiquée `2026-07-24T19:57:24.717Z`, 6 318 mutations uniques, sept communes, ventes du 4 janvier 2021 au 31 décembre 2025. Date et source conservées. Le jeu n’est pas présenté comme une mise à jour d’octobre.
- `npm run test:market` contrôle notamment les filtres, les cinq années civiles disponibles et les quantiles R-7. `npm run data:verify` confirme l’intégrité du jeu ; cela ne confirme ni l’état d’un logement ni sa valeur actuelle. Le détail de méthode reste dans `scripts/build-market-summary.mjs` et les sources du jeu.
- Les réponses des API personnelles utilisent `private, no-store` ou `no-store`. Le HTML statique ne contient pas les réponses du visiteur. La session est traitée dans le navigateur puis transmise uniquement par l’action choisie.
- La lecture des rulesets et Page Rules de zone est **refusée par les droits OAuth actuels (HTTP 403)**. Les règles de cache administratives ne sont donc pas déclarées auditées exhaustivement. Les en-têtes réellement servis et le code sont vérifiés ; aucune règle Cloudflare n’est modifiée.
- Protections conservées : honeypot, validation, contrôle d’origine, limite de taille, reçus et verrou de transport. Le limiteur mémoire existant est un secours par instance, pas une limite globale garantie ; aucun binding KV n’est actuellement configuré.

## Validation et preuves

### Code et parcours compilés

- `npm test` : **445 tests réussis dans 38 fichiers**. `npm run check` : **0 erreur, 0 avertissement, 33 indications** non bloquantes. Build statique final : **54 pages**.
- Recette navigateur du build local : **44 scénarios réussis, aucun échec**, comprenant les parcours acheteur, vendeur, vente-achat et contact aux largeurs 360, 390, 430 px et desktop. Retour, modification, persistance, stockage refusé, clavier, erreurs, doubles clics, perte de réponse et retry sont couverts. **15 contrôles Axe : aucune violation détectée** sur les états examinés ; cela ne constitue pas une certification d’accessibilité exhaustive.
- Les écritures réseau de cette recette sont interceptées : aucune notification vers un vrai prospect et aucune preuve de réception en boîte réelle. Les tests d’API vérifient séparément le reçu, la confirmation serveur et les refus du fournisseur simulé.
- Après le dernier garde-fou POST : **3 contrôles supplémentaires réussis sur le build final**, un par questionnaire, sans réponse dans l’URL sans JavaScript et progression normale après initialisation. Total : 44 scénarios de recette et 3 contrôles ciblés, sans les présenter comme une seule exécution de 47 scénarios.
- Confidentialité à 360/390/430 px : aucun appel d’audience avant consentement ou après refus ; propriétés privées fictives exclues des événements et du referrer ; arrêt après retrait. Tous les appels PostHog sont interceptés. La recette simule un navigateur visiteur car le SDK exclut volontairement les navigateurs automatisés ; aucun filtre applicatif n’a été désactivé.
- Fixture isolée de 365 nouveaux sujets, plus les sept guides historiques : 31 pages de bibliothèque, recherche globale, catégories, navigation sans JavaScript et reprise après erreur réseau vérifiées à 360/390/430 px. Aucun faux article de test dans le catalogue livré.
- Audit statique : 54 pages HTML, 88 cibles internes et 39 URL de sitemap, zéro erreur ni avertissement après correction. Contrôles DVF : six tests réussis et intégrité des 6 318 mutations confirmée.

### Preview Cloudflare et limites restantes

- PR en brouillon : https://github.com/Boullourou/levois-site/pull/5. Branche `codex/editorial-conversion-20261028`.
- Preview de branche : https://codex-editorial-conversion-2.levois-site.pages.dev. Premier déploiement immuable réussi : https://dbc4b9d3.levois-site.pages.dev, commit `6bd04b9`.
- **Cloudflare Access protège toutes les previews de ce projet.** Les GET anonymes retournent HTTP 302 vers la connexion. Ce résultat ne prouve ni un défaut applicatif ni l’absence de robots/sitemap ; la recette applicative distante reste non exécutée. Une connexion a été demandée dans l’onglet de preview, sans retirer la protection.
- Le test d’envoi réel attend aussi une adresse sous contrôle confirmée par Mouaad. Aucun envoi réel n’a été effectué. L’acceptation par Resend, la réception destinataire et la livraison de la synthèse restent à valider en preview authentifiée.
- Les secrets de reprise protégée absents de preview et les droits insuffisants de lecture des règles de cache restent explicitement hors des validations obtenues. Aucun secret ou réglage de production n’est modifié.

### Performances avant / après

Comparaison des builds compilés du commit `3737bc9` et de cette branche, tous deux servis par Astro Preview en local, sur le même poste. Chromium **153.0.8010.12**, viewport **390 × 844**, DPR 1, CPU ×4, paramètres réseau CDP 150 ms / 1,6 Mbit/s descendant / 0,75 Mbit/s montant, cache désactivé et nouveau contexte à chaque passage. Trois passages à froid par page, sans consentement d’audience ; aucun autre test navigateur en parallèle. La première série de référence ayant chevauché une recette a été remplacée par une série au repos.

| Page | LCP médian avant | LCP médian après | Corps encodés avant → après | Requêtes avant → après | CLS maximal avant / après |
|---|---:|---:|---:|---:|---:|
| Accueil | 1 048 ms | 992 ms | 148 990 → 123 681 octets | 9 → 10 | 0 / 0 |
| Ressources | 848 ms | 856 ms | 112 383 → 139 392 octets | 7 → 10 | 0 / 0 |
| Article négociation | 888 ms | 908 ms | 139 351 → 140 545 octets | 8 → 10 | 0 / 0 |

Ces petits écarts sur trois passages ne prouvent pas un gain ou une régression durable. La bibliothèque charge davantage de code et de contenu qu’avant ; son index de recherche demeure chargé à la demande. Les mesures locales isolent les changements du site, **sans mesurer le CDN Cloudflare, l’INP ni les Core Web Vitals de vrais visiteurs**. Aucun score PageSpeed n’a été calculé.

Douze captures complémentaires (accueil, bibliothèque, article et contact × 360/390/430 px) : aucun débordement horizontal ni image cassée détecté. Les captures des états de formulaire et du panneau de confidentialité complètent ce contrôle. Résultats chiffrés : [comparaison JSON](review/2026-10-28/performance-comparison.json).

### Captures et journaux

Trois captures du résultat vendeur **avant toute saisie de coordonnées**, sur le build local et avec réponses fictives, sont jointes à ce rapport : [360 px](review/2026-10-28/synthese-locale-360.png), [390 px](review/2026-10-28/synthese-locale-390.png), [430 px](review/2026-10-28/synthese-locale-430.png).

Les rapports JSON, journaux et autres PNG sont conservés dans `artifacts/editorial-20261028/` du worktree de cette branche. Ils sont exclus du dépôt pour ne pas embarquer toutes les sorties de test dans le site :

- `local-forms/report.json` et `*-reading-{360,390,430}.png` : synthèses immédiatement accessibles sur le build local ;
- `local-before/` et `local-after/` : captures et mesures comparables du commit de production et de la branche, servis localement ;
- `before/` : observation initiale du site public ; elle n’est pas utilisée comme comparateur des mesures locales ;
- `seo-static.json`, `seo-preview.json` : contrôles statiques et blocage d’authentification distant ;
- `privacy.json` : vérifications de consentement et filtrage des propriétés avec transport d’audience intercepté.

Les mesures et captures locales ne sont pas renommées « captures Cloudflare ». Aucun score PageSpeed ni mesure INP n’est annoncé sans mesure correspondante.

## Publication ultérieure et retour arrière

Le workflow quotidien est désactivé par défaut. Limova fournit le même identifiant stable à chaque retry et ouvre/met à jour une PR ; aucun secret de serveur ne lui est transmis. Le site ne publie pas les carrousels ni les vidéos. Les horaires 11:30 et 17:00 restent à assurer dans Limova.

Une date future ne publie rien sans rebuild et déploiement. Le cron tient compte de Paris et des changements d’heure, mais GitHub peut retarder son exécution ; 07:00 n’est pas une garantie à la seconde. L’activation, les secrets GitHub et les protections de branche/environnement restent des actions distinctes à valider, pas des réglages supposés existants.

Avant une éventuelle fusion : valider la preview et la livraison réelle de test ; appliquer seulement `db/contact-delivery.sql` à la base de production identifiée, sous une autorisation de production distincte. Sans cette table, le nouveau contact échoue honnêtement au lieu d’envoyer sans reçu.

Retour arrière : ne pas fusionner ferme simplement la proposition et laisse la production inchangée. Après une future mise en production autorisée, remettre le déploiement Cloudflare antérieur puis rétablir les sources par un revert relu ; ne pas supprimer les tables ou les dossiers. Désactiver le scheduler s’il a été activé. Le rollback du site n’efface pas les demandes déjà reçues.
