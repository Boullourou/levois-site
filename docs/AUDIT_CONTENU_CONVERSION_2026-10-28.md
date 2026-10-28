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
| P0 | Sans JavaScript, le contact sans méthode explicite pouvait soumettre les champs dans une URL GET. | Méthode POST explicite, bouton activé seulement après initialisation du contrôleur, accès e-mail/téléphone sans JavaScript. |
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

Les résultats définitifs de preview, les mesures comparées et les liens de captures sont ajoutés après le déploiement de branche. Les recettes ne constituent pas une preuve de livraison en boîte réelle lorsqu’elles simulent le transport.

## Publication ultérieure et retour arrière

Le workflow quotidien est désactivé par défaut. Limova fournit le même identifiant stable à chaque retry et ouvre/met à jour une PR ; aucun secret de serveur ne lui est transmis. Le site ne publie pas les carrousels ni les vidéos. Les horaires 11:30 et 17:00 restent à assurer dans Limova.

Une date future ne publie rien sans rebuild et déploiement. Le cron tient compte de Paris et des changements d’heure, mais GitHub peut retarder son exécution ; 07:00 n’est pas une garantie à la seconde. L’activation, les secrets GitHub et les protections de branche/environnement restent des actions distinctes à valider, pas des réglages supposés existants.

Avant une éventuelle fusion : valider la preview et la livraison réelle de test ; appliquer seulement `db/contact-delivery.sql` à la base de production identifiée, sous une autorisation de production distincte. Sans cette table, le nouveau contact échoue honnêtement au lieu d’envoyer sans reçu.

Retour arrière : ne pas fusionner ferme simplement la proposition et laisse la production inchangée. Après une future mise en production autorisée, remettre le déploiement Cloudflare antérieur puis rétablir les sources par un revert relu ; ne pas supprimer les tables ou les dossiers. Désactiver le scheduler s’il a été activé. Le rollback du site n’efface pas les demandes déjà reçues.
