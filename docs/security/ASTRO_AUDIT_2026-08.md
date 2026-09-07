# Audit de sécurité Astro — août 2026

Date de référence : 18 août 2026
Branche : `codex/levois-phase2-5-security-access`
Baseline auditée : `astro@4.16.19`, issue du snapshot Phase 2 `7b975733dbf63676858b7114269a8c2641e1d49b`
Cible retenue : `astro@7.2.3`

## Décision

La chaîne Astro 4 ne doit pas recevoir de données client réelles. Son audit de production contient des vulnérabilités hautes, même si la plupart des chemins signalés ne sont pas exécutables dans le déploiement statique actuel.

La migration a été validée par paliers :

```text
Astro 4.16.19 -> Astro 5.18.2 -> Astro 6.4.8 -> Astro 7.2.3
```

Astro 5 a servi de palier de compatibilité, pas de cible finale : plusieurs avis publiés ensuite exigent Astro 6 ou 7. Astro 6 a corrigé les vulnérabilités hautes propres au cœur Astro connues à ce stade, mais ne pouvait pas corriger `GHSA-4g3v-8h47-v7g6`, dont le premier correctif officiel est Astro 7.1.0. Il conservait aussi `sharp` sous 0.35.0, signalé HIGH. Astro 7.2.3 est la première cible stable testée qui dépasse tous les seuils de correction applicables et produit un audit de production à zéro.

Cette décision ne vaut pas autorisation de données réelles à elle seule. Cloudflare Access, l’isolation de la D1 preview, la sauvegarde/restauration et la checklist de données réelles restent des gates indépendantes.

## Méthode et lecture correcte de `npm audit`

Commandes de référence :

```bash
npm audit --omit=dev --json
npm ls astro vite esbuild sharp js-yaml nanoid postcss --omit=dev --all
```

L’audit initial a été exécuté avec Node 24.14.1 et npm 11.18.0, avant toute mise à niveau. L’audit final a été exécuté sur le lockfile Astro 7.2.3.

Deux précisions évitent une mauvaise interprétation :

- le résumé npm « 5 high / 2 moderate » compte sept **nœuds de packages agrégés**, pas sept advisories ; la baseline contient 26 advisories uniques ;
- Astro, Vite, esbuild, PostCSS, Tailwind, `js-yaml` et `sharp` étaient déclarés ou résolus comme dépendances de production, donc inclus par `--omit=dev`, mais l’architecture LEVOIS les utilise principalement au build. Cela réduit l’atteignabilité en production ; cela ne rend pas un package vulnérable acceptable pour la mise en service.

Les identifiants CVE, plages vulnérables et premiers correctifs proviennent des fiches GitHub Global Security Advisory liées dans les tableaux. « Aucun CVE » signifie que le champ `cve_id` officiel était nul au 18 août 2026.

## Résultat initial — Astro 4.16.19

`npm audit --omit=dev --json` : échec, code de sortie 1.

| Sévérité agrégée npm | Packages |
| --- | --- |
| HIGH | `astro@4.16.19`, `js-yaml@3.14.2/4.2.0`, `nanoid@3.3.16`, `sharp@0.33.5`, `vite@5.4.21` |
| MODERATE | `esbuild@0.21.5`, `postcss@8.5.22` |

Résumé exact retourné :

```json
{
  "info": 0,
  "low": 0,
  "moderate": 2,
  "high": 5,
  "critical": 0,
  "total": 7
}
```

Le rapport recensait 386 dépendances `prod`, 166 `dev`, 190 `optional`, 28 `peer`, soit 630 entrées au total. Ces nombres décrivent le graphe npm, pas les modules réellement chargés par Cloudflare Pages.

## Chemins de dépendance initiaux

| Package installé | Chemins concrets depuis LEVOIS |
| --- | --- |
| `astro@4.16.19` | `levois-site -> astro`; également peer dédupliqué de `@astrojs/tailwind@5.1.5` |
| `vite@5.4.21` | `levois-site -> astro -> vite`; `levois-site -> astro -> vitefu@1.1.3 -> vite` |
| `esbuild@0.21.5` | `levois-site -> astro -> esbuild`; `levois-site -> astro -> vite -> esbuild` |
| `sharp@0.33.5` | `levois-site -> astro -> sharp` ; dépendance optionnelle d’Astro effectivement installée |
| `js-yaml@4.2.0` | `levois-site -> astro -> js-yaml` |
| `js-yaml@3.14.2` | `levois-site -> astro -> gray-matter@4.0.3 -> js-yaml`; `levois-site -> astro -> which-pm@3.0.1 -> load-yaml-file@0.2.0 -> js-yaml` |
| `postcss@8.5.22` | `levois-site -> @astrojs/tailwind -> postcss`; branches `autoprefixer` et `postcss-load-config`; `levois-site -> astro -> vite -> postcss`; branches `tailwindcss@3.4.19` et ses plugins PostCSS |
| `nanoid@3.3.16` | chacune des branches précédentes se terminant par `postcss -> nanoid` |

## Matrice des 26 advisories

### Astro core et adapter Cloudflare

Les 16 lignes suivantes affectaient le nœud direct `astro@4.16.19`.

| # | Advisory / CVE | Sévérité / CVSS | Sujet et plage vulnérable | Premier correctif officiel | Exécution et portée LEVOIS |
| ---: | --- | --- | --- | --- | --- |
| 1 | [GHSA-5ff5-9fcw-vg88](https://github.com/advisories/GHSA-5ff5-9fcw-vg88) / CVE-2025-61925 | MODERATE / 6.5 | `X-Forwarded-Host` réfléchi sans validation ; Astro `<5.14.3` | `5.14.3` | Cœur serveur Astro. Non exécuté par la sortie statique ; ni le site public ni le cockpit Pages Functions n’utilisent ce runtime SSR. |
| 2 | [GHSA-hr2q-hp5q-x767](https://github.com/advisories/GHSA-hr2q-hp5q-x767) / CVE-2025-64525 | MODERATE / 6.5 | Manipulation d’URL via headers, avec bypass de middleware ; `>=2.16.0 <5.15.5` | `5.15.5` | Cœur serveur Astro. Non exécuté dans l’architecture statique actuelle. |
| 3 | [GHSA-wrwg-2hg8-v723](https://github.com/advisories/GHSA-wrwg-2hg8-v723) / CVE-2025-64764 | HIGH / 7.1 | XSS réfléchi via server islands ; `<=5.15.6` | `5.15.8` | Aucune server island dans le dépôt. Non atteignable sur le public ou le cockpit actuels. |
| 4 | [GHSA-x3h8-62x9-952g](https://github.com/advisories/GHSA-x3h8-62x9-952g) / CVE-2025-64757 | LOW / 3.5 | Lecture arbitraire de fichier par le serveur de développement ; Astro `<5.14.3` | `5.14.3` | Dev/build uniquement. Risque poste local si le serveur de développement est exposé à un réseau non fiable. |
| 5 | [GHSA-fvmw-cj7j-j39q](https://github.com/advisories/GHSA-fvmw-cj7j-j39q) / CVE-2025-65019 | MODERATE / 5.4 | Stored XSS sur `/_image` avec l’adapter Cloudflare ; Astro `<5.15.9` | `5.15.9` | `@astrojs/cloudflare` n’était ni installé ni configuré ; aucun endpoint Astro `/_image`. Non atteignable. |
| 6 | [GHSA-ggxq-hp9w-j794](https://github.com/advisories/GHSA-ggxq-hp9w-j794) / CVE-2025-64765 | MODERATE / non publié | Bypass d’authentification fondée sur `url.pathname` via valeurs encodées ; Astro `<5.15.8` | `5.15.8` | Middleware Astro SSR absent. L’authentification cockpit est effectuée séparément par Pages Functions. |
| 7 | [GHSA-whqg-ppgf-wp8c](https://github.com/advisories/GHSA-whqg-ppgf-wp8c) / CVE-2025-66202 | MODERATE / 6.5 | Bypass par double encodage d’URL ; Astro `<5.15.8` | `5.15.8` | Même portée serveur ; non atteignable dans le déploiement actuel. |
| 8 | [GHSA-g735-7g2w-hh3f](https://github.com/advisories/GHSA-g735-7g2w-hh3f) / CVE-2026-33769 | LOW / 5.3 | Bypass d’allowlist d’images distantes ; `>=2.10.10 <5.18.1` | `5.18.1` | Aucun import `astro:assets`, aucune `remotePatterns` et aucune image distante traitée par Astro. |
| 9 | [GHSA-j687-52p2-xcff](https://github.com/advisories/GHSA-j687-52p2-xcff) / CVE-2026-41067 | MODERATE / 6.1 | XSS `define:vars` par nettoyage incomplet de `</script>` ; Astro `<6.1.6` | `6.1.6` | Une occurrence sur `/ma-recherche`, alimentée uniquement par les constantes statiques LEVOIS téléphone/email. L’HTML public serait concerné si une valeur build non fiable y était introduite ; aucune donnée cockpit/D1 n’y entre. |
| 10 | [GHSA-xr5h-phrj-8vxv](https://github.com/advisories/GHSA-xr5h-phrj-8vxv) / CVE-2026-45028 | LOW / 6.1 | Replay inter-composants de paramètres chiffrés de server island ; Astro `<6.1.10` | `6.1.10` | Server islands absentes ; non atteignable. |
| 11 | [GHSA-jrpj-wcv7-9fh9](https://github.com/advisories/GHSA-jrpj-wcv7-9fh9) / CVE-2026-54298 | MODERATE / 4.2 | XSS par nom d’attribut non échappé dans des spread props ; Astro `<6.4.6` | `6.4.6` | Aucun spread de props Astro trouvé. Impact HTML public/cockpit seulement si une entrée build contrôle un nom d’attribut. |
| 12 | [GHSA-f48w-9m4c-m7f5](https://github.com/advisories/GHSA-f48w-9m4c-m7f5) / CVE-2026-59729 | MODERATE / non publié | Correctif incomplet de CVE-2026-54298 dans `renderHTMLElement` ; Astro `<7.0.6` | `7.0.6` | Même portée de rendu ; aucune entrée attaquable identifiée dans le code actuel. |
| 13 | [GHSA-7pw4-f3q4-r2p2](https://github.com/advisories/GHSA-7pw4-f3q4-r2p2) / CVE-2026-59727 | LOW / non publié | XSS par valeur `transition:*` non échappée sur island hydratée ; `>=3.10.0 <7.0.4` | `7.0.4` | Aucune directive Astro `transition:*`; les occurrences `transition` du dépôt sont du CSS. |
| 14 | [GHSA-4g3v-8h47-v7g6](https://github.com/advisories/GHSA-4g3v-8h47-v7g6) / CVE-2026-73422 | MODERATE / non publié | XSS réfléchi via propriétés d’animation View Transition ; `>=2.9.0 <=7.0.9` | `7.1.0` | Aucun `ViewTransitions` ni `ClientRouter`. Non atteignable aujourd’hui, mais cet avis interdit de considérer Astro 5 ou 6 comme une cible auditée définitive. |
| 15 | [GHSA-2pvr-wf23-7pc7](https://github.com/advisories/GHSA-2pvr-wf23-7pc7) / CVE-2026-54299 | HIGH / 7.5 | SSRF par Host header lors du fetch d’une page d’erreur pré-rendue ; Astro `<6.4.6` | `6.4.6` | Runtime SSR Astro absent ; non atteignable sur Pages statiques. |
| 16 | [GHSA-8hv8-536x-4wqp](https://github.com/advisories/GHSA-8hv8-536x-4wqp) / CVE-2026-50146 | HIGH / 7.1 | XSS réfléchi par nom de slot non échappé ; Astro `<6.3.3` | `6.3.3` | Les propriétés `slot={...}` trouvées alimentent des composants internes depuis le catalogue statique d’images ; aucun nom de slot ne vient d’une requête. |

### Dépendances transitives

| # | Package / advisory / CVE | Sévérité / CVSS | Instances et plage vulnérable | Premier correctif officiel | Exécution et portée LEVOIS |
| ---: | --- | --- | --- | --- | --- |
| 17 | `esbuild@0.21.5` — [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) / aucun CVE | MODERATE / 5.3 | Un site tiers peut envoyer des requêtes au dev server et lire les réponses ; `<=0.24.2` | `0.25.0` | Dev/build uniquement. Absent du runtime Pages Functions. |
| 18 | `js-yaml@3.14.2` — [GHSA-h67p-54hq-rp68](https://github.com/advisories/GHSA-h67p-54hq-rp68) / CVE-2026-53550 | MODERATE / 5.3 | DoS quadratique par aliases de merge ; 3.x `<3.15.0`. L’instance 4.2.0 était déjà corrigée pour ce seul avis. | `3.15.0`; branche 4 : `4.2.0` | Parsing YAML/front matter au build. Sources versionnées, aucun upload utilisateur. |
| 19 | `js-yaml@3.14.2` et `4.2.0` — [GHSA-52cp-r559-cp3m](https://github.com/advisories/GHSA-52cp-r559-cp3m) / CVE-2026-59869 | HIGH / 7.5 | Chaînes de merge keys quadratiques ; 3.x `<3.15.0`, 4.x `<4.3.0` | `3.15.0` / `4.3.0` | Build/CI. Un contributeur contrôlant un YAML pourrait épuiser le CPU ; pas de chemin depuis un formulaire public. |
| 20 | `js-yaml@3.14.2` et `4.2.0` — [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) / aucun `cve_id` officiel | HIGH / 7.5 | CPU quadratique lors de la résolution `!!omap`; 3.x `<3.15.1`, 4.x `<4.3.1`. La notice mentionne CVE-2026-59870 non rétroporté. | `3.15.1` / `4.3.1` | Build/CI uniquement dans LEVOIS. Seuil complet retenu pour `js-yaml`. |
| 21 | `nanoid@3.3.16` — [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) / CVE-2026-67213 | HIGH / 5.9 | Un générateur personnalisé peut boucler indéfiniment avec une taille nulle ; `<3.3.18` | `3.3.18` | Transitif de PostCSS, API vulnérable non appelée par le code LEVOIS ; build-only. |
| 22 | `postcss@8.5.22` — [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) / CVE-2026-69153 | MODERATE / non publié | Un `sourceMappingURL` contrôlé peut lire un fichier `.map` lorsque `from` est absent ; `<=8.5.22` | `8.5.23` | Compilation CSS à partir de sources du dépôt ; pas de CSS utilisateur. |
| 23 | `sharp@0.33.5` — [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) / `CVE-2026-33327`, `CVE-2026-33328`, `CVE-2026-35590`, `CVE-2026-35591` dans libvips | HIGH / non publié | Vulnérabilités héritées de libvips ; `sharp <0.35.0` | `0.35.0` | Processeur d’images au build. Aucun upload client, image distante ou service d’image Astro runtime. |
| 24 | `vite@5.4.21` — [GHSA-4w7w-66w2-5vf9](https://github.com/advisories/GHSA-4w7w-66w2-5vf9) / CVE-2026-39365 | MODERATE / non publié | Traversal des `.map` de dépendances optimisées ; Vite `<=6.4.1`. Aucun correctif branche 5 publié. | `6.4.2`; branches 7/8 : `7.3.2` / `8.0.5` | Dev server uniquement ; pas de runtime navigateur ou Pages. |
| 25 | `vite@5.4.21` — [GHSA-v6wh-96g9-6wx3](https://github.com/advisories/GHSA-v6wh-96g9-6wx3) / CVE-2026-53632 | MODERATE / non publié | `launch-editor` peut divulguer un hash NTLMv2 via chemin UNC sous Windows ; Vite `<=6.4.2`. Aucun correctif branche 5. | `6.4.3`; branches 7/8 : `7.3.5` / `8.0.16` | Dev server Windows uniquement. Le serveur cockpit local est lié explicitement à `127.0.0.1`. |
| 26 | `vite@5.4.21` — [GHSA-fx2h-pf6j-xcff](https://github.com/advisories/GHSA-fx2h-pf6j-xcff) / CVE-2026-53571 | HIGH / 7.5 | Bypass de `server.fs.deny` par chemins alternatifs Windows ; Vite `<=6.4.2`. Aucun correctif branche 5. | `6.4.3`; branches 7/8 : `7.3.5` / `8.0.16` | Dev server Windows uniquement. Aucun impact direct sur les assets statiques déjà construits. |

## Atteignabilité dans l’architecture LEVOIS

### Site public

Le site Astro est produit statiquement. Aucun adapter Astro Cloudflare n’est installé et aucun serveur Astro ne s’exécute dans Cloudflare Pages. Les avis Host/header, middleware, server islands, `/_image` et SSRF ne disposaient donc pas de chemin runtime en production.

Les avis XSS de rendu restent pertinents pour la chaîne de build : du contenu non fiable introduit dans `define:vars`, des noms d’attributs, slots ou transitions pourrait être compilé dans l’HTML public. Le scan de la baseline a montré :

- aucune server island ;
- aucun `ViewTransitions` ou `ClientRouter` ;
- aucune directive Astro `transition:*` ;
- aucun spread de props Astro ;
- aucune configuration d’image distante ;
- un unique `define:vars` sur `/ma-recherche`, alimenté par des constantes statiques contrôlées.

Cette faible atteignabilité explique pourquoi le site public n’était pas considéré comme activement compromis. Elle ne justifie pas le maintien d’une branche non corrigée.

### Cockpit privé

Astro construit uniquement une coque statique sans donnée client. Les données sont lues après authentification via les Pages Functions et D1. Le JWT Access, l’origin/CSRF et le BFF sont implémentés dans `functions/**`, sans importer Astro, Vite, esbuild, PostCSS, `js-yaml` ou `sharp`. `jose@6.1.3`, utilisé à l’exécution, n’était pas signalé par l’audit.

Ainsi, les vulnérabilités Astro SSR n’offraient pas de bypass direct du contrôle Access du cockpit. Le blocage de données réelles restait néanmoins correct : une chaîne de build vulnérable, une future activation de fonctionnalité Astro ou un serveur de développement mal exposé auraient pu changer l’atteignabilité sans alerte.

### Build et poste local

Les avis Vite/esbuild concernent le serveur de développement ; PostCSS, Nano ID, YAML et Sharp concernent la compilation ou le traitement d’assets. Les mesures compensatoires déjà présentes — sources versionnées, absence d’upload vers le build, serveur cockpit lié à `127.0.0.1` — réduisaient le risque, sans remplacer les correctifs.

## Trajectoire validée

| Étape | Validation technique | Résultat sécurité | Décision |
| --- | --- | --- | --- |
| Astro `4.16.19` | Baseline Phase 2 : `npm test` 93/93, cockpit 52/52, sécurité 13/13, market 6/6, build 33 pages | Audit prod : 5 HIGH + 2 MODERATE au niveau packages agrégés | Gate rouge ; aucune donnée réelle |
| Astro `5.18.2` | `npm test` 93/93 sur 13 fichiers ; cockpit 52/52 sur 6 ; sécurité 13/13 sur 2 ; market 6/6 ; build 33 pages ; `git diff --check` OK ; Pages Functions locales OK ; captures desktop/mobile sur 8 routes | Total intermédiaire non retenu ; gate encore rouge. Les avis exigeant Astro 6/7 et des HIGH restaient ouverts. | Palier de compatibilité validé ; poursuivre |
| Astro `6.4.8` | Même matrice : 93/93, 52/52, 13/13, 6/6, build 33 pages, diff-check et Pages Functions OK ; 8 routes en desktop/mobile | Total intermédiaire non retenu ; gate encore rouge. `GHSA-4g3v-8h47-v7g6` n’est corrigé qu’en 7.1.0 et `sharp <0.35.0` restait HIGH. | Palier validé ; poursuivre vers Astro 7 |
| Astro `7.2.3` | Migration finale retenue ; validations fonctionnelles et visuelles consignées dans le rapport Phase 2.5 | Audit prod exact : 0 vulnérabilité | Chaîne Astro admissible ; les gates Access/D1/données restent séparées |

Les totaux d’audit intermédiaires n’ont volontairement pas été reconstitués après coup. Seuls l’audit baseline archivé et le résultat final reproductible sont présentés comme nombres exacts.

## Pourquoi Astro 7.2.3

Le seuil théorique minimum commun aux advisories Astro est 7.1.0, imposé par CVE-2026-73422. La version 7.2.3 a été retenue parce que :

1. elle est la version stable proposée par `npm audit` pour résoudre l’agrégat Astro de la baseline ;
2. elle dépasse les correctifs 7.0.4, 7.0.6 et 7.1.0 sans rester sur le bord d’une plage vulnérable ;
3. sa chaîne résolue remplace aussi les transitives vulnérables ;
4. les passages 5 puis 6 ont isolé les breaking changes et prouvé la non-régression avant la major suivante ;
5. l’audit final de production est vide.

La migration a aussi remplacé l’ancienne intégration `@astrojs/tailwind` par `@tailwindcss/vite@4.3.3` avec `tailwindcss@4.3.3`. Ce changement est une adaptation de chaîne de build ; aucune évolution de direction artistique n’est incluse dans ce lot.

## Résultat final — Astro 7.2.3

Versions effectivement résolues :

| Package | Version finale | Seuil minimal de correction applicable |
| --- | ---: | ---: |
| `astro` | `7.2.3` | `7.1.0` |
| `vite` | `8.2.1` | `6.4.3`, ou `7.3.5`, ou `8.0.16` selon la branche |
| `esbuild` | `0.28.2` | `0.25.0` |
| `sharp` | `0.35.3` | `0.35.0` |
| `js-yaml` | `4.3.1` | `4.3.1` |
| `postcss` | `8.5.26` | `8.5.23` |
| `nanoid` | `3.3.18` | `3.3.18` |

Chemins finaux contrôlés :

```text
levois-site -> astro@7.2.3 -> vite@8.2.1
levois-site -> astro@7.2.3 -> esbuild@0.28.2
levois-site -> astro@7.2.3 -> js-yaml@4.3.1
levois-site -> astro@7.2.3 -> sharp@0.35.3
levois-site -> @tailwindcss/vite@4.3.3 -> vite@8.2.1
levois-site -> vite@8.2.1 -> postcss@8.5.26 -> nanoid@3.3.18
```

`npm audit --omit=dev --json` : succès, code de sortie 0.

```json
{
  "info": 0,
  "low": 0,
  "moderate": 0,
  "high": 0,
  "critical": 0,
  "total": 0
}
```

Le graphe final retourné compte 227 dépendances `prod`, 106 `dev`, 184 `optional`, 1 `peer`, soit 459 entrées.

## Gate de sécurité résultant

Pour la chaîne de dépendances Astro, le gate est vert : aucune vulnérabilité de production connue n’est retournée par npm au 18 août 2026.

Ce résultat ne doit pas être extrapolé :

- il est daté et doit être rejoué avant chaque mise en service ou mise à jour importante ;
- un audit à zéro ne prouve pas l’absence de vulnérabilité inconnue ;
- aucune donnée réelle ne doit être saisie tant que Cloudflare Access et la séparation D1 ne sont pas eux-mêmes vérifiés ;
- aucune preview non protégée ne doit recevoir de binding vers une base réelle.
