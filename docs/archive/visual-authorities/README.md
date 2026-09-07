# Autorités visuelles remplacées — site public

L’utilisateur a validé **quartier miniature + Satoshi + cobalt comme identité finale de LEVOIS le 6 septembre 2026** et demandé sa généralisation à tout le public. L’exploration artistique est close.

La référence courte est [DESIGN.md](../../../DESIGN.md), complétée par [.impeccable/design.json](../../../.impeccable/design.json). Les valeurs normatives sont dans [src/styles/tokens.css](../../../src/styles/tokens.css). En cas de divergence documentaire, relever le code effectif puis corriger la documentation ; ne pas rétablir une ancienne direction.

| Élément conservé | Statut et usage autorisé |
|---|---|
| [.impeccable/approved-20260906](../../../.impeccable/approved-20260906) | Instantané de la proposition approuvée avant industrialisation. Référence historique de continuité visuelle ; ses limites de portée et ses anciens chemins ne définissent plus le produit. |
| [.impeccable/perspective-brief.md](../../../.impeccable/perspective-brief.md) | Brief d’exploration archivé en place. Le contrat limité à six entrées est remplacé par le contrat de tout le public. |
| [.impeccable/mocks](../../../.impeccable/mocks) | Recherches de composition. Aucune maquette ne prouve une fonction, un chiffre, un portrait réel ou un résultat commercial. |
| [docs/design/DIRECTIONS.md](../../design/DIRECTIONS.md) | Anciennes pistes ; son bandeau d’archive retire toute autorité visuelle sur le public. |
| [docs/design/EXPERIENCE_SYSTEM.md](../../design/EXPERIENCE_SYSTEM.md) et [EXPERIENCE_AUDIT.md](../../design/EXPERIENCE_AUDIT.md) | Documents historiques du cockpit privé ; ils ne prescrivent ni palette, ni composition, ni composants pour le public. |

Le code public passe uniquement par [Layout.astro](../../../src/layouts/Layout.astro), qui charge `public-base.css`, `levois.css` et `editorial.css`. [tailwind.public.config.mjs](../../../tailwind.public.config.mjs) est indépendant du thème privé. Les anciens `ReperesLayout.astro` et `reperes.css` ne sont plus des sources actives ; leur instantané reste dans le dossier approuvé ci-dessus.

`global.css`, `tailwind.config.mjs` et `CockpitLayout.astro` servent exclusivement le cockpit privé. Les composants historiques Hero, Header, Footer et JourneyImmersion ne sont plus des points d’entrée du site public. Leurs styles ne doivent pas revenir par un import ou une copie.

Les alias et classes historiques compatibles (`argile`, `papier`, `rp-*`, `mr-*`, `vr-*`) décrivent une continuité d’implémentation, pas une autorité graphique. Les couleurs d’erreur, de succès et de réserve métier ne rétablissent aucune ancienne palette orange, lime ou verte.

Le contrôle des 24 routes est automatisé par [`scripts/verify-public.mjs`](../../../scripts/verify-public.mjs). Les captures de livraison restent des artefacts locaux non versionnés. Les conclusions de QA appartiennent au rapport de mission ; ce classement d’archives ne constitue pas une validation de tests, un commit ou un déploiement.
