# Contrat de transmission éditoriale LEVOIS — V1 et Markdown V2

État préparé le 28 octobre 2026, sur une branche de travail. Aucune automatisation de production n'est activée par ce document. Une validation humaine de la branche et de la preview précède toute décision de mise en production.

Compléments opérationnels : [adaptateur PRODUCTION.json](CONTRAT_ADAPTATEUR_PRODUCTION.md), [lots de sept jours et reçus Limova](PUBLICATION_LOTS_LIMOVA_2026-10-28.md), [Markdown V2](CONTRAT_MARKDOWN_EDITORIAL_V2.md). Ils précisent le traitement des nouveaux lots sans modifier les URL historiques.

## 1. Architecture réelle et périmètre

Le site est compilé par Astro (`astro.config.mjs`, sortie statique par défaut). Les sept ressources historiques résident dans `src/data/resources.ts` et `resourceContent.ts`. Le dépôt contient également des Cloudflare Pages Functions et des bindings D1 pour les demandes et le cockpit : **ils ne constituent pas un CMS éditorial**. Aucun endpoint d'ingestion d'article, CMS ni base d'articles n'a été découvert ou ajouté.

Les nouveaux articles sont des JSON versionnés dans `src/content/editorial/`. La réception passe par Git et une pull request relue. Limova n'a besoin d'aucun secret Cloudflare, D1, e-mail ou outil d'audience. Si Limova ne sait pas créer une PR, il peut transmettre le même JSON et les images au responsable du dépôt, qui exécute les commandes ci-dessous. Cette solution de repli est exploitable sans prétendre qu'une intégration Limova a déjà été connectée.

Un sujet stable sert à relier l'article de 07:00, le carrousel de 11:30 et la vidéo de 17:00. **Ce dépôt ne publie aucun contenu sur les réseaux sociaux.** Ces sorties restent du ressort de Limova et des comptes concernés. La vidéo reste limitée à dix secondes selon le brief, sans contrôle automatique par ce contrat d'article. La coordination des trois chats, la revue de sept jours et les confirmations machine sont précisées dans [Publication par lots Limova](PUBLICATION_LOTS_LIMOVA_2026-10-28.md).

## 2. Enveloppe exacte

Un fichier UTF-8 JSON par sujet, nommé `{topicId}.json`. Taille maximale : 100 000 octets. Les propriétés inconnues sont refusées. Pas de HTML, script, iframe, Markdown exécutable, code de suivi, secret ni donnée personnelle de prospect. La table suivante décrit le format V1 conservé. Le [format V2](CONTRAT_MARKDOWN_EDITORIAL_V2.md) remplace `sections` par un Markdown CommonMark conservé exactement et précise les sources, dates et légendes ; aucun article V1 ne doit être migré pour continuer à fonctionner.

| Champ | Règle |
|---|---|
| `schemaVersion` | Entier `1` |
| `topicId` | Identifiant stable, unique, minuscules ASCII/chiffres/tirets, 100 caractères maximum. Exemple de convention : `lv-2027-001`. Ne jamais le régénérer lors d'un retry. |
| `revision` | Entier positif. Première livraison `1`, modification suivante exactement `+1`. |
| `slug` | Même syntaxe que l'identifiant. URL résultante `/ressources/{slug}/`. Stable après la première réception. |
| `title` | Texte brut, 140 caractères maximum. Aucun résultat garanti non étayé. |
| `summary` | Texte brut, 320 caractères maximum. Sert aussi à l'extrait et à la description. |
| `answer` | Réponse immédiate à la question annoncée, 1 200 caractères maximum. |
| `sections` | 1 à 16 objets `{heading, paragraphs}`. Titre de section : 160 caractères ; 1 à 12 paragraphes de 3 000 caractères maximum chacun. |
| `author` | `{name, role}` : auteur réel et fonction, respectivement 120/200 caractères maximum. Le fait que Limova prépare le texte ne vaut pas validation par Mouaad. |
| `dates` | `{createdAt, publishAt, updatedAt?}` ; dates ISO 8601 avec secondes et décalage explicite. Voir section suivante. |
| `sources` | 0 à 30 objets `{label, url, accessedAt}` ; URL HTTPS, sans identifiants. Liste vide admise pour un conseil de méthode sans affirmation nécessitant une source ; la validation technique ne prouve jamais la véracité. |
| `scope` | Périmètre géographique et champ d'application explicites, 600 caractères maximum. |
| `limits` | 1 à 8 limites explicites, 700 caractères maximum chacune. |
| `image` | `null`, ou `{src, alt, width, height}`. Image locale réelle, règles ci-dessous. |
| `category` | `vendre`, `acheter`, `vente-achat` ou `ventes-locales`. |
| `primaryDestination` | Une des cinq destinations autorisées ci-dessous. Aucun paramètre personnel. |
| `status` | `draft`, `scheduled`, `published` ou `archived`. |

Catégories et destinations habituelles :

| Sujet | Destination principale |
|---|---|
| Prix et transactions passées | `/votre-rue/` |
| Préparation ou difficulté de vente | `/situer-ma-vente/` |
| Recherche d'un logement | `/ma-recherche/` |
| Vente puis achat | `/vendre-et-acheter/` |
| Demande directe appropriée au sujet | `/contact/` |

Chaque article conserve en complément un accès secondaire pour écrire à Mouaad. Le contexte transmis est l'identifiant du sujet, résolu côté serveur depuis le catalogue connu. Aucun nom, e-mail, téléphone, adresse de recherche ou réponse libre dans une URL.

Le schéma exécutable faisant autorité est `src/lib/editorial/schema.ts`. Aucun temps de lecture n'est fabriqué. Aucun sujet n'est créé dans ce dossier à titre de faux article de démonstration.

## 3. Dates et publication

- `createdAt` : moment réel de création du texte, fourni par son auteur. Exemple de syntaxe : `2026-10-28T10:00:00+01:00` ; ce n'est pas une date à recopier systématiquement.
- `publishAt` : échéance souhaitée, à **07:00:00 Europe/Paris**. Le schéma vérifie le bon décalage saisonnier : `+01:00` en hiver, `+02:00` en été. Exemple hiver : `2027-01-15T07:00:00+01:00` ; été : `2027-07-15T07:00:00+02:00`.
- `updatedAt` : seulement pour une modification réellement effectuée, avec sa date exacte. Champ absent pour un texte jamais modifié. Ne pas le rafraîchir automatiquement à chaque build.
- `publishAt` est un **horaire prévu**, pas la preuve d'une première mise en ligne réussie. Ne pas le présenter dans les données structurées comme un horodatage de déploiement. La date de rédaction connue peut être affichée comme telle. L'heure réelle de mise en ligne se vérifie dans le déploiement Cloudflare réussi ; aucun journal durable de première publication n'est inventé ici.
- `draft` et `archived` sont exclus des pages générées. `scheduled` et `published` sont exposés seulement quand leur échéance est passée à l'heure commune de compilation. `published` ne contourne donc pas une date future.
- Un seul nouveau sujet actif par jour de calendrier parisien. Les brouillons peuvent partager un jour de travail. Les sept historiques ne reçoivent pas de dates de publication arbitraires.

Les dates de passage à l'heure d'été et d'hiver 2027 sont couvertes par des tests. À 07:00, il n'existe ni heure locale doublée ni heure locale manquante. Les instructions de planification données à Limova doivent utiliser `Europe/Paris`, et non « UTC+1 toute l'année ».

## 4. Images

Transmettre l'image dans `public/editorial/{topicId}/{nom}.webp` (AVIF, JPEG ou PNG également acceptés). `image.src` vaut `/editorial/{topicId}/{nom}.webp`. Le nom suit la syntaxe ASCII minuscules/chiffres/tirets. Aucun téléchargement externe n'est effectué par le build.

Maximum 500 000 octets, 4 000 pixels par dimension, image fixe. Fournir les dimensions exactes et un texte alternatif descriptif, sans mots-clés artificiels. Le validateur lit le fichier avec Sharp et refuse fichier absent, mauvais dossier, dimensions fausses et animation. Une image absente doit être déclarée `null`, jamais remplacée par une URL cassée. Vérifier les droits, la fidélité et l'absence d'information privée lors de la revue humaine.

## 5. Transmission, idempotence et contrôle des accès

Dans une branche `content/{topicId}` issue de la branche de référence validée :

```sh
npm ci
npm run editorial:import -- --file chemin/livraison.json
npm run editorial:import -- --file chemin/livraison.json --write
npm run editorial:check
npm run check
npm test
npm run build
```

La première commande d'import vérifie sans écrire. `--write` écrit exclusivement `src/content/editorial/{topicId}.json`. Les images doivent déjà être présentes à leur chemin autorisé. La sortie JSON indique `topicId`, `revision`, `action` (`created`, `updated`, `unchanged`), `written` et `path`. Toute erreur retourne un code non nul sans modifier l'article existant.

- Même identifiant, même révision et même contenu : `unchanged`, aucun second fichier.
- Même identifiant/révision avec un contenu différent : conflit, rejet.
- Révision plus ancienne : rejet. Une nouvelle tentative ne peut pas écraser une correction récente.
- Révision suivante : `updated`, avec `updatedAt` réel plus récent obligatoire.
- Collision d'identifiant ou de slug avec tout autre article, y compris les sept historiques : rejet.
- `topicId`, `slug`, `createdAt` et `publishAt` sont immuables dans l'import courant. Une correction exceptionnelle d'identité ou de calendrier demande une PR explicitement relue, notamment pour les redirections si l'URL change.
- Verrou exclusif pendant l'import et remplacement atomique : deux imports simultanés ne produisent pas deux articles. Un processus concurrent peut recevoir une erreur de verrou ; réessayer le même payload après la fin du premier. Si un crash laisse `.import.lock`, vérifier l'absence de processus actif avant sa suppression manuelle.
- Une nouvelle livraison reprend **la même branche et la même PR** pour ce `topicId`. La création de PR par Limova n'est pas implémentée dans le site ; son connecteur doit rechercher la PR ouverte avant d'en ouvrir une nouvelle.

Ouvrir une PR avec le sujet, les sources et limites, la destination, la date prévue et la preuve de relecture. La CI `editorial-validate.yml` vérifie le contrat et les tests. La revue humaine vérifie notamment chaque chiffre, le statut réel/illustratif des exemples, les affirmations de droit ou de financement, et la conformité au contenu visible.

Si une GitHub App Limova est installée ultérieurement, limiter son installation à `Boullourou/levois-site`, avec accès au contenu et aux pull requests nécessaire à la création de branches/PR, et `Actions: read` si elle récupère les reçus. Pas de permission d'administration, de secrets, de déploiement ni de modification des workflows. Les fichiers `.github/workflows/` restent du ressort du propriétaire ; l'accès `Contents` pour transmettre les articles ne justifie pas de lui accorder le droit `Workflows`. Protéger `main` par revue obligatoire et checks ; le contrôle fin par dossier ne découle pas d'une simple permission GitHub « Contents ». Ces protections et l'installation Limova restent à vérifier/configurer par le propriétaire, elles ne sont pas présumées actives.

## 6. Mécanisme réel du calendrier statique

Une date future dans un JSON ne modifie pas les fichiers déjà hébergés. Il faut **un nouveau build, puis un déploiement réussi** pour rendre l'article disponible.

Le workflow fourni `.github/workflows/editorial-schedule.yml` prépare ce mécanisme sans l'activer. Les réveils UTC à 05h/06h/07h/08h, minutes 00/20/40, couvrent les deux décalages de Paris. Le script applique une fenêtre locale de rattrapage entre 07:00 et 10:00 (dernier réveil éligible à 09:40) et compare l'empreinte des articles dus au manifeste réellement servi. Un catalogue inchangé ne demande aucun déploiement. Une erreur réseau ou un manifeste invalide fait échouer l'étape, sans fausse confirmation.

Si un article devient dû : validation du contrat, `npm run check`, tests, build Astro, puis déploiement explicite du build par Wrangler. L'horloge du plan est transmise à `npm prebuild`, au HTML, au registre utilisé par les Functions et à `/editorial-manifest.json`, puis à la vérification. Le build et ses deux fichiers générés voyagent ensemble dans le même artefact ; l'étape de déploiement ne les régénère pas avec une autre heure. Le manifeste ne contient que les identifiants/slugs/révisions déjà publics et une empreinte, jamais les brouillons, les corps de texte ou des données de contact. Les builds Git habituels génèrent aussi ce manifeste. Le job `verify` contrôle ensuite le manifeste ET chaque URL exacte : HTTP 200 HTML, canonical, H1, identifiant et révision. Il produit un reçu JSON par sujet et un artefact GitHub même en cas d'échec constaté. Un catalogue déjà déployé peut être revérifié sans nouveau déploiement ; une preview vérifiée n'autorise jamais une diffusion sociale. Le [contrat des reçus](PUBLICATION_LOTS_LIMOVA_2026-10-28.md#4-confirmation-machine-après-lecture-réelle) décrit les champs et leur récupération authentifiée par Limova.

**07:00 est une cible de déclenchement, pas une garantie à la seconde.** GitHub peut retarder ou abandonner un événement planifié ; les tests/build/déploiement prennent également du temps. Une publication à heure stricte demanderait une autre architecture, hors périmètre de cette adaptation statique. En cas d'incident, le prochain réveil compare à nouveau le catalogue ; le déclenchement manuel permet aussi un rattrapage. Plusieurs sujets en retard sont rattrapés ensemble, sans en créer de copies.

Avant activation future :

1. Fusionner une version relue ; les crons GitHub n'agissent que depuis la branche par défaut. Garder l'automatisation dormante tant que la preview n'est pas validée.
2. Créer les environnements GitHub `levois-editorial-preview` et `levois-editorial-production`. Restreindre la production à `main`. Pour une exécution autonome après revue du lot, décider explicitement d'une politique permettant ces jobs automatiques : des reviewers requis sur l'environnement imposeraient une approbation à chaque exécution. La revue humaine des contenus reste faite en PR avant leurs dates ; aucune protection existante n'est modifiée par cette branche.
3. Fournir, dans ces environnements seulement, `CLOUDFLARE_API_TOKEN` et `CLOUDFLARE_ACCOUNT_ID`. Le token doit pouvoir déployer Pages sur le compte concerné ; pas de clé globale ni de droits D1 nécessaires à ce job. Vérifier sa portée réelle et l'accès au seul compte nécessaire.
4. Tester manuellement `target=preview`, `deploy=false` : construit l'artefact si un changement est dû, aucun déploiement. Puis tester `target=preview`, `deploy=true`. Destination explicite : branche Pages `editorial-preview`. L'hôte comparé par défaut est `https://editorial-preview.levois-site.pages.dev/` ; cette adresse est une **destination de configuration**, pas l'affirmation d'une preview déjà créée.
5. Pour les réveils automatiques, définir `LEVOIS_EDITORIAL_SCHEDULE_ENABLED=true`. Le target demeure `preview` par défaut. `LEVOIS_EDITORIAL_PREVIEW_HOST` permet de préciser l'hôte de preview existant.
6. Seulement après décision de production distincte : `LEVOIS_EDITORIAL_PRODUCTION_ENABLED=true` et `LEVOIS_EDITORIAL_TARGET=production`. Le workflow refuse une publication de production depuis une branche autre que `main`.

### Preview protégée par Cloudflare Access

La preview LEVOIS est protégée par Access. Une session interactive ouverte dans le navigateur ne connecte pas automatiquement GitHub Actions ou les scripts Node. Une page de connexion Access, une redirection, un HTTP 401/403 ou un HTML à la place du manifeste JSON ne prouvent donc ni la disparition du site ni l'échec d'un build.

`editorial-schedule.mjs` et `editorial-confirm.mjs` acceptent facultativement **ensemble** `CF_ACCESS_CLIENT_ID` et `CF_ACCESS_CLIENT_SECRET`, injectés comme secrets d'environnement. Ces variables ne sont ni des paramètres d'URL, ni des champs JSON Limova, ni des arguments de commande à copier dans un journal. Le helper `scripts/editorial-http.mjs` ajoute les en-têtes `CF-Access-Client-Id` et `CF-Access-Client-Secret` seulement pour un sous-domaine direct validé `*.levois-site.pages.dev`. Il ne les transmet pas à `levois.fr`, `www.levois.fr`, au domaine Pages de production, à un domaine tiers ou à un hôte imbriqué. Les identifiants partiels sont refusés avant toute requête ; toutes les redirections sont interdites, y compris vers le portail de connexion. Le helper ne lit que `/editorial-manifest.json` et les routes exactes `/ressources/{slug}/` dont le slug est validé.

**Prérequis à vérifier avant activation, sans modifier les protections existantes :** l'application Access qui couvre l'hôte de preview doit accepter un jeton de service dédié au contrôle éditorial, avec une politique `Service Auth` correspondant à ce jeton. Une application SaaS d'authentification SAML/OIDC ou une politique de connexion humaine ne vaut pas automatiquement cette autorisation machine. Vérifier le type réel et la compatibilité de l'application Pages gérée ; si elle ne permet pas cette politique, l'automatisation de lecture reste bloquée jusqu'à une décision d'architecture Access séparée. Aucun contournement, politique `Bypass`, récupération de cookie humain ou désactivation d'Access n'est proposé. [Documentation Cloudflare sur les jetons de service](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/).

Si cette autorisation existe, le propriétaire peut stocker le couple dans les secrets GitHub de l'environnement `levois-editorial-preview`. Le workflow le fournit uniquement à l'étape de comparaison du job `plan` et à l'étape de confirmation du job `verify`, uniquement lorsque la cible vaut `preview`. Les étapes de build et les PR Limova n'en reçoivent pas. Le jeton de déploiement Pages reste distinct, réservé à l'étape Wrangler. Prévoir expiration, rotation et révocation du jeton de lecture.

Cette branche ne crée aucun jeton, secret GitHub, application Access ou politique. Les tests ciblés du helper et des reçus utilisent des valeurs fictives et des réponses simulées ; la livraison à travers Access reste à confirmer avec le propriétaire. Le planificateur reste désactivé par défaut. Ce complément d'authentification n'ajoute ni CMS, ni base de contenu, ni API de réception.

Aucune de ces variables, aucun secret ni réglage Cloudflare n'est créé/modifié par cette branche. Le workflow ne modifie pas les bindings D1, noms de domaine ou règles de cache. Le déploiement normal de la branche principale doit continuer à être maîtrisé lors de chaque fusion : fusionner après 07:00 un article déjà dû le rend publiable au build suivant. Un garde-fou vérifie immédiatement avant l'envoi que la branche source pointe toujours sur le commit testé ; sinon le job s'arrête. Il ne constitue pas un verrou transactionnel avec les déploiements Git Cloudflare : éviter une fusion/déploiement manuel simultané à une sortie programmée, et vérifier le commit finalement servi en cas de concurrence.

Surveiller les exécutions manquées, les expirations de token et les protections d'environnement. GitHub documente aussi la désactivation de workflows planifiés dans les dépôts publics après une période sans activité : une année de fichiers préchargés ne remplace donc pas cette surveillance. Les liens et métadonnées ne sont pas des preuves de livraison : vérifier le statut final et ouvrir la nouvelle URL après un déploiement réussi.

## 7. Reprise et retour arrière

Pour corriger le contenu, livrer la révision suivante dans la même PR ou une PR de correction. Pour arrêter les réveils automatiques, désactiver `LEVOIS_EDITORIAL_SCHEDULE_ENABLED` ; le contenu déjà servi reste disponible. **Cela n'empêche pas un build Git classique de publier un article `scheduled` déjà dû.** Pour suspendre aussi son éligibilité, revoir son statut dans Git et déployer cette correction de façon maîtrisée. Pour retirer un article publié, traiter `archived` en revue : prévoir la redirection pertinente ou la suppression assumée, sans recycler son slug. Un rollback de déploiement Cloudflare restaure un build antérieur mais ne modifie pas Git : corriger également la source pour ne pas republier le défaut au build suivant.

Les URL des sept ressources existantes restent réservées. Aucune reconstruction de faits manquants, aucune fausse date de mise à jour et aucune activation de production ne sont nécessaires pour transmettre ce contrat à Limova.

## Références techniques vérifiées

- [Astro — modes de rendu](https://docs.astro.build/en/guides/on-demand-rendering/) : distinction compilation statique et rendu à la demande.
- [GitHub — événements planifiés](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) : branche par défaut, délais possibles, désactivation après inactivité.
- [Cloudflare Pages — intégration Git](https://developers.cloudflare.com/pages/configuration/git-integration/) : build à la réception d'un changement Git, preview des branches.
- [Cloudflare Pages — previews](https://developers.cloudflare.com/pages/configuration/preview-deployments/) : aliases et indexabilité des previews.
