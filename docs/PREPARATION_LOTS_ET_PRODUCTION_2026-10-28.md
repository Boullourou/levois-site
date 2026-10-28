# LEVOIS — préparation des lots et de la mise en production

État du 28 octobre 2026. Travail conservé dans la [PR de preview nº 5](https://github.com/Boullourou/levois-site/pull/5), branche `codex/editorial-conversion-20261028`. Aucune fusion, migration de production, activation de calendrier ni publication sociale effectuée.

**Recette distante complétée :** quatre demandes réelles fictives, sept acceptations Resend, sept messages reçus selon confirmation de Mouaad, puis deux rejeux sans nouvelle tentative de transport. [Résultats, captures mobiles et limites](RECETTE_DISTANTE_RESULTATS_2026-10-28.md). Le candidat applicatif testé est `70e7abb`.

**Décisions A/B séparées :** les corrections sont proposées pour revue indépendamment du calendrier, maintenu désactivé. Le [bilan de sortie et de validation réelle J001–J007](SORTIE_CORRECTIONS_ET_VALIDATION_J001_2026-10-28.md) précise les preuves, les refus d'import et les éléments à fournir. Aucun accès machine supplémentaire n'est nécessaire à A.

## Livré

| Élément | Résultat et contrat |
|---|---|
| Adaptateur déterministe | PRODUCTION.json → SITE.json V2 généré, Markdown conservé, identité technique campagne/journée, signature et introduction extraites sans réécriture ; date de rédaction inconnue omise. [Contrat et commandes](CONTRAT_ADAPTATEUR_PRODUCTION.md) |
| Compatibilité Markdown | Titres, listes, citations, emphase, liens ; structures non supportées refusées, sources sans URL et dates au jour conservées. [Contrat V2](CONTRAT_MARKDOWN_EDITORIAL_V2.md) |
| Couverture | Compression de l'image finale fournie en WebP ≤500 000 octets ; dimensions et orientation contrôlées, aucune modification de l'original. |
| Lot de sept journées | Préparation de brouillons, revue liée à une empreinte, activation explicite dans une branche ; rejouer ne crée pas de second article. |
| Publication et relais | Déclencheur statique opt-in, reprise et reçus par sujet/révision/URL/état/heure de vérification. Facebook et LinkedIn attendent `socialReady=true`. [Organisation des trois chats et protocole](PUBLICATION_LOTS_LIMOVA_2026-10-28.md) |
| Recette distante | URL Access, étapes, routage et sept messages prévus ; preuves serveur/prestataire/boîte séparées. [Protocole](RECETTE_DISTANTE_LEVOIS_2026-10-28.md) |
| Production A/B | Vérification D1, migration additive, déploiement du commit validé, contrôles et rollback conservant les demandes ; calendrier activé seulement par décision B. [Procédure ordonnée](MISE_EN_PRODUCTION_LEVOIS_2026-10-28.md) |

Le site ne reçoit aucune intégration Facebook, Instagram, TikTok, LinkedIn ou Drive. Seul ARTICLE intervient dans GitHub. Aucun article réel ni brouillon de démonstration n'a été ajouté au catalogue.

## Preuves et validation

- `npm test` : 588 tests, 44 fichiers, tous réussis.
- `npm run check` : zéro erreur, zéro warning ; 32 indications non bloquantes.
- `npm run build` : 54 pages compilées, sitemap généré.
- Commande réelle dans une copie isolée : préparation, revue sans activation, activation locale, retry identique et refus sur main : **5/5**. [Rapport](review/2026-10-28/batch-cli-report.json).
- Template Markdown réel avec JavaScript désactivé : **360/390/430 px**, un H1, listes imbriquées, liens, source sans URL, légende et marqueurs d'identité présents, aucun débordement. [Rapport](review/2026-10-28/markdown-report.json) ; captures du corps Markdown : [360](review/2026-10-28/markdown-360.png), [390](review/2026-10-28/markdown-390.png), [430](review/2026-10-28/markdown-430.png). Ce sont des fixtures locales, pas des articles publiés.
- Garde-fous additionnels : sortie UTF-8 limitée à 100 000 octets même après conversion ; brouillons interdits dans les fichiers publics, y compris par chemins trompeurs ou jonctions.
- Les sept PRODUCTION J001–J007 V3 réels sont convertis en SITE.json de test sans couverture : sources/textes/limites conservés, identités stables et rejeux sans écriture. J001 importé puis construit dans une copie locale isolée, avec horloge simulée documentée ; aucun article ajouté au catalogue livré. Les couvertures finales restent nécessaires à la préparation du lot de publication. [Résultats et limites](VALIDATION_CONVERSION_DIRECTE_2026-10-28.md).
- D1 production inspectée uniquement par cinq SELECT de métadonnées : zéro écriture, aucune demande lue. La table de reçus contact et son index manquent ; les autres tables requises sont présentes. La migration `db/contact-delivery.sql` reste préparée, **non appliquée**.

L'environnement Windows bloquait initialement les temporaires de Vitest ; les tests ont ensuite été exécutés normalement hors sandbox. Les clones/captures générés sont désormais exclus des collectes TypeScript/Vitest. Les résultats finaux ci-dessus sont ceux de la suite applicative, pas d'une collecte accidentelle de copies de tests.

Les reçus de publication ont été testés avec transports simulés, y compris faux 200 Access, mauvaise révision, redirections, panne réseau et reprise. Aucun reçu réel d'article en production n'est présenté comme obtenu. La compilation ou un job Cloudflare réussi ne remplace pas la recette applicative distante ni la réception d'un e-mail.

## Prérequis restants

1. **Recette navigateur et livraison** : connexion Access, quatre demandes et sept réceptions désormais confirmées. Deux rejeux conservent les mêmes compteurs et horodatages D1. Voir les résultats distants pour la couverture précise et les contrôles encore uniquement locaux.
2. **Validation complémentaire** : la suite complète de pannes simulées, stockage refusé, no-JS et Axe n'a pas été rejouée dans le navigateur distant. Aucun résultat local n'est présenté comme distant.
3. **Recette machine de preview** : l'autorisation Access propre aux scripts/Actions manque pour la suite distante complète et les lectures automatisées du manifeste/URL de preview. Elle n'est pas requise pour le site public ni les builds Git. Aucun jeton ni politique d'accès n'a été créé ; ce complément concerne la recette de B, pas un blocage de revue de A.
4. **Premier lot réel** : ARTICLE doit fabriquer les sept couvertures finales ; le manifeste et les SITE.json sont générés techniquement, pas demandés comme nouvelles pièces éditoriales. La revue réelle du lot et la décision d'activation restent distinctes. Les flags de fabrication ne constituent pas cette revue.
5. **Limova** : vérifier les capacités des connecteurs, la lecture authentifiée des reçus Actions, le journal anti-doublon social et l'alerte en cas de retard. Les présentations Facebook/LinkedIn doivent contenir l'URL de l'article, préparée sans réécriture improvisée.
6. **Décisions A puis B** : valider A après recette et seulement alors appliquer la migration additive puis déployer. B reste une activation ultérieure du contenu et de l'automatisation, avec les droits/protections GitHub vérifiés. Aucun réglage n'a été modifié pour supprimer une approbation existante.

07:00 Europe/Paris reste un objectif de disponibilité. Les changements d'heure sont pris en charge ; une date future seule ne déclenche pas un déploiement. Les reprises et l'attente des confirmations limitent les erreurs de diffusion, sans garantir l'heure à la seconde ni une livraison sociale exactement une fois.
