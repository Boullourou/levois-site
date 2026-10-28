# Publication par lots de sept jours — contrat opérationnel Limova

Préparé le 28 octobre 2026 sur la branche de preview. Ce document ne constitue ni une activation du calendrier, ni une mise en production, ni la confirmation que les connecteurs sociaux de Limova sont opérationnels. Aucun secret, réglage Access ou compte social n'a été modifié.

## 1. Trois chats indépendants, un sujet commun

Les trois chats lisent les mêmes dossiers Drive et conservent le même identifiant de sujet. Seul le chat ARTICLE transmet du contenu au dépôt GitHub. Le site n'ajoute aucun connecteur social et ne dispose pas d'un CMS.

| Chat | Horaire Europe/Paris | Travail et destinations |
|---|---|---|
| ARTICLE | 07:00, cible de disponibilité du site | Article LEVOIS. Ensuite article LinkedIn si le connecteur prend réellement en charge ce format ; sinon publication LinkedIn avec lien. Publication Facebook avec lien. Ces relais attendent le reçu de disponibilité de l'article. |
| CARROUSEL | 11:30 | Instagram, TikTok et Facebook. PDF multipage LinkedIn seulement si le connecteur accepte réellement ce format. |
| VIDEO | 17:00 | Vidéo de dix secondes maximum sur Facebook, Instagram et TikTok. |

Les médias et publications sociales restent intégralement exécutés par Limova. Les capacités réelles de chaque connecteur, les comptes destinataires et les droits de publication doivent être confirmés lors de leur activation. Un contenu préparé ou un fichier présent dans Drive n'est pas une publication sociale réussie.

Les liens utilisés pour relayer l'article proviennent du reçu vérifié décrit plus bas. Les anciennes consignes Drive qui supposent un CMS ou remplacent l'URL de l'article par `/votre-rue/`, `/situer-ma-vente/` ou une autre porte ne décrivent pas ce contrat. Les destinations métier restent les CTA de l'article ; elles ne remplacent pas sa preuve de disponibilité. Les fichiers Drive ne sont pas modifiés par cette adaptation.

## 2. Préparer et approuver sept jours d'avance

La livraison regroupe exactement sept jours consécutifs, avec un sujet par jour à 07:00 Europe/Paris. La revue porte sur l'ensemble du lot avant sa fenêtre de diffusion : textes figés, faits et sources, limites, auteur, métadonnées, visuels et droits, destinations, dates et formats sociaux.

Les échantillons Drive `J001` et `J010` examinés utilisent un `PRODUCTION.json` contenant notamment `article.title`, `article.slug_propose`, `article.meta_description`, `article.markdown`, `carousel.slides`, `video.voice_exact` et `video.scene_exact`. L'adaptateur reprend les champs de l'article ; les contenus carrousel et vidéo restent dans le paquet source pour leurs chats respectifs. Le Markdown ne doit pas être réécrit pour entrer dans le format V1. Le [contrat Markdown V2](CONTRAT_MARKDOWN_EDITORIAL_V2.md) décrit son rendu et les constructions refusées.

`version: LEVOIS-LOT10-V3-20261028` désigne une version de paquet. Elle ne doit pas devenir l'identité durable d'une campagne : un passage V3 vers V4 ne doit pas recréer les sujets. Le sidecar exige une identité de campagne canonique stable et une révision entière explicite. `J001` est unique à l'intérieur de cette campagne, pas à lui seul dans tout le site. Les relivraisons conservent l'identifiant final, le slug et le calendrier déjà acceptés.

Les booléens `ready_for_production` et les libellés de contrôle dans `PRODUCTION.json` ne remplacent pas la décision humaine d'approuver le lot. L'absence d'auteur validé, de réponse immédiate, de périmètre, de catégorie ou d'une autre métadonnée obligatoire arrête l'adaptation. Aucune valeur manquante n'est devinée. Une date de source connue au jour près reste une date ; aucune heure de lecture fictive n'est ajoutée.

Le responsable prépare une branche de contenu avec les sept dossiers et leurs sidecars, exécute l'adaptateur et son contrôle de lot, puis les contrôles éditoriaux, tests et build. La sortie candidate est examinée en preview et la PR porte la preuve de revue des sept sujets. L'import ne vaut pas autorisation de fusion ni activation du calendrier. Les URL historiques restent réservées ; une nouvelle tentative du même contenu doit répondre `unchanged`.

L'interface du lot est :

```sh
npm run editorial:batch -- --file chemin/LOT.json --out chemin/prepared
npm run editorial:batch -- --file chemin/LOT.json --out chemin/prepared --review chemin/REVUE.json
```

`LOT.json` porte `schemaVersion:1`, `batchId`, `campaignId` et `days`, exactement sept entrées contenant les chemins `production`, `metadata`, `cover` (ou `null`), `coverWidth` et `coverHeight`. Les chemins sont relatifs au manifeste. Le sidecar `SITE.json` porte `schemaVersion:1`, `campaignId`, `dayId`, `revision`, `author:{name,role}`, `dates:{createdAt,updatedAt?}`, `answer`, `scope` et `category`. L'identifiant final est `campaignId` suivi du jour en minuscules, par exemple `campagne-exemple-j001` ; cet exemple n'est pas une campagne réelle à recopier.

La première commande produit un bundle `draft` et son empreinte. Le document `REVUE.json` porte explicitement `schemaVersion:1`, `batchId`, `campaignId`, `fingerprint`, `reviewer` et `reviewedAt` : une identité et une date de revue réelles, jamais préremplies comme acquises. La seconde commande vérifie cette revue et **laisse encore le bundle en brouillon**.

L'option distincte `--activate` exige `--review` ; elle passe les articles à `scheduled` et les copie dans la branche locale après validation complète. Elle ne fusionne et ne déploie rien. Cette étape doit appartenir à la future PR de lot autorisée, distincte de la PR de corrections techniques actuelle qui n'ajoute aucun article. Si un brouillon de révision 1 existe déjà dans le catalogue, son activation est une modification : la métadonnée fournit la révision 2 et une vraie date `updatedAt`, conformément aux règles d'import.

**Fusionner des articles `scheduled` les rend éligibles à tout build suivant leur date, même si le calendrier automatique est désactivé.** L'activation du contenu et celle du workflow sont donc deux décisions explicites ; aucun interrupteur de cron ne doit être présenté comme une mise en attente de tous les articles.

Voir le [contrat de transmission](CONTRAT_LIMOVA_2026-10-28.md) pour les règles d'import, les chemins d'images et la protection de la branche. Les commandes exactes de l'adaptateur et du lot figurent dans le [contrat de l'adaptateur](CONTRAT_ADAPTATEUR_PRODUCTION.md) ; ne pas envoyer directement `PRODUCTION.json` au schéma V1 et ne pas placer les sept productions brutes dans `src/content/editorial/`.

## 3. Activer une fois, puis publier les lots approuvés sans accord quotidien

La revue humaine des sept jours se fait en amont dans la PR. Une fois le dispositif expressément activé, les échéances de ce lot peuvent être exécutées automatiquement ; le workflow ne demande pas une nouvelle décision éditoriale chaque matin.

Il existe cependant un prérequis de configuration : un environnement GitHub configuré avec des reviewers obligatoires suspend chacun des jobs qui le référencent. Pour le fonctionnement autonome demandé, le propriétaire doit choisir, lors de l'activation distincte, une politique d'environnement autorisant les exécutions automatiques de `main` déjà relue, avec secrets limités et restrictions de branche. La protection et la revue de `main` restent nécessaires. Cette branche ne modifie aucune protection d'environnement. [GitHub : règles d'environnement](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments).

Les garde-fous fournis restent dormants :

- `LEVOIS_EDITORIAL_SCHEDULE_ENABLED` doit être explicitement `true` pour les réveils automatiques.
- La cible par défaut est `preview`. La production exige séparément `LEVOIS_EDITORIAL_PRODUCTION_ENABLED=true`, `LEVOIS_EDITORIAL_TARGET=production` et la branche `main`.
- Un lancement manuel a `deploy=false` par défaut. Il peut vérifier un catalogue déjà servi, ou construire un nouveau catalogue sans le déployer.
- Les identifiants Cloudflare Pages sont réservés au job de déploiement. Les identifiants Access éventuels sont réservés aux lectures de preview. Limova ne reçoit aucun de ces secrets.
- Une preview protégée par Access doit accepter une authentification machine adaptée. Une session SSO humaine ou une application SaaS ne prouve pas ce prérequis. Sans accès machine autorisé, la vérification de preview reste bloquée ; aucune protection n'est contournée.

Le site est statique. Une échéance dans un fichier ne publie rien à elle seule : le planificateur compare le catalogue dû au manifeste distant, construit si nécessaire, teste, déploie puis vérifie les pages. L'horloge du plan est transmise au build et à la vérification afin de comparer les mêmes révisions. Les changements d'heure sont traités en Europe/Paris ; l'été n'est pas traité comme UTC+1.

**07:00 reste une cible, pas une garantie d'heure exacte.** Les réveils GitHub peuvent être retardés ou manqués ; tests, build et diffusion ajoutent leur durée. Le prochain réveil dans la fenêtre locale 07:00–10:00 réessaie. Un lancement manuel permet le rattrapage au-delà. Le chat ARTICLE attend la disponibilité constatée avant Facebook/LinkedIn, même si elle survient après 07:00. Limova doit signaler un incident prolongé au responsable : ce canal d'alerte reste à configurer et tester dans Limova. Aucun faux reçu ou lien deviné ne doit remplacer la confirmation.

La fusion de contenu déjà dû peut également le rendre visible via le déploiement Git habituel. Préparer les lots avant leurs échéances, maîtriser la fusion et éviter un déploiement manuel concurrent au planificateur. Les paramètres de production et les protections réellement en place doivent être vérifiés au moment de l'activation.

## 4. Confirmation machine après lecture réelle

Le job `verify` exécute `scripts/editorial-confirm.mjs`. Il contrôle :

1. Le manifeste HTTPS servi, son schéma, son empreinte du contenu et sa liste exacte d'identifiants/slugs/révisions.
2. Chaque URL exacte `/ressources/{slug}/`, avec HTTP 200 et contenu HTML.
3. Une seule URL canonique correspondant à `https://levois.fr/ressources/{slug}/`.
4. Le H1 visible correspondant au titre prévu, avec normalisation des espaces et entités HTML.
5. Les métadonnées `levois:topic-id` et `levois:revision` correspondant au sujet prévu.

Les redirections sont refusées. Une page de connexion Access retournant 200, un vieux HTML, une page d'accueil de repli ou un manifeste seul ne suffisent pas. Les corps de réponse et les identifiants de service ne figurent jamais dans les reçus. La vérification ne crée ni article ni déploiement.

Le JSON de sortie, `receipts.json`, utilise `schemaVersion: 1`. Il ne contient que des métadonnées éditoriales publiques et des informations d'exécution :

| Champ | Sens et règle de consommation |
|---|---|
| `environment` | `production` seulement si l'hôte contrôlé est exactement `https://levois.fr/` ; sinon `preview`. |
| `deploymentState` | `verified` si le manifeste et tous les articles du contrôle sont vérifiés ; `failed` sinon. |
| `checkedAt` | Date UTC réelle de réalisation du contrôle. |
| `verifiedAt` | Date UTC de confirmation complète ; `null` en cas d'échec. Ce n'est pas la date de première publication. |
| `manifestFingerprint` | SHA-256 du catalogue dû, reconstruit depuis les sources validées. |
| `workflow` | `repository`, `runId`, `runAttempt`, `commitSha`. Ce SHA décrit la source vérifiée ; aucun identifiant de déploiement Cloudflare n'est inventé. |
| `receipts` | Liste des reçus par sujet, décrits ci-dessous. Les sept articles historiques ne sont pas artificiellement convertis en nouveaux sujets. |

Chaque entrée `receipts[]` contient :

| Champ | Sens |
|---|---|
| `id` | Identifiant stable du sujet, identique au `topicId` accepté. |
| `revision` | Révision entière effectivement contrôlée. |
| `url` | URL canonique de production de l'article. Sa présence seule ne constitue pas une confirmation. |
| `checkedUrl` | URL qui a réellement été lue, production ou preview. |
| `deploymentState` | `verified` ou `failed` pour cet article. |
| `verifiedAt` | Horodatage UTC réel du contrôle réussi, sinon `null`. |
| `socialReady` | `true` seulement en production et après réussite du contrôle complet. Toujours `false` en preview ou lors d'un contrôle partiellement échoué. |
| `failureCode` | `null` si l'article est vérifié ; sinon code stable de diagnostic, sans données privées. |
| `evidence` | Booléens `manifest`, `http200`, `html`, `canonical`, `title`, `id`, `revision`. Tous doivent être `true`. |

Un contrôle partiel peut conserver un reçu individuel `verified` avec `socialReady:false`. Il sert au diagnostic ; le chat ARTICLE attend une passe complète réussie. Une liste vide n'autorise aucune diffusion. Un reçu absent, `failed`, périmé pour la révision attendue, de preview ou dont la provenance ne correspond pas au workflow approuvé signifie **attendre et réessayer**, pas « publier quand même ».

L'outil réessaie trois fois par défaut, espacées de cinq secondes. Il écrit le reçu après chaque passe. En cas d'échec final, il retourne un code non nul et le workflow conserve le diagnostic. Si le déploiement avait réussi mais que la confirmation avait échoué, un réveil suivant réexamine les pages même lorsque l'empreinte n'a pas changé ; il ne déploie pas une copie supplémentaire.

## 5. Récupération des reçus par Limova

Le workflow conserve un artefact nommé :

```text
editorial-publication-receipts-{preview|production}-{run_id}-{run_attempt}
```

Sa rétention est de 30 jours. Limova peut le lire par l'API GitHub authentifiée, avec une GitHub App ou un jeton fin limité à ce dépôt et à **Actions: read**. Les permissions de création de branches/PR, si nécessaires à la transmission, sont distinctes. Aucun droit de déploiement ou d'administration n'est requis pour lire les reçus.

```text
GET /repos/Boullourou/levois-site/actions/runs/{run_id}/artifacts
GET /repos/Boullourou/levois-site/actions/artifacts/{artifact_id}/zip
```

L'API de téléchargement retourne une redirection vers une URL temporaire. Effectuer cette seconde lecture sans transmettre l'en-tête d'authentification GitHub au stockage externe. Un artefact expiré doit être revérifié, pas supposé valide. [GitHub : API des artefacts](https://docs.github.com/en/rest/actions/artifacts).

Le consommateur doit rattacher l'artefact au run réel du workflow `.github/workflows/editorial-schedule.yml` du dépôt `Boullourou/levois-site`, à la branche et au SHA de `main` approuvés, et à la bonne tentative. Il vérifie ensuite `environment=production`, le résultat complet `verified`, le sujet et la révision attendus, `socialReady=true`, `verifiedAt` renseigné et toutes les preuves vraies. Un simple nom d'artefact, un job vert ou une URL calculée à partir du slug ne remplace pas ces contrôles. Les métadonnées du run et du SHA doivent provenir de l'API GitHub authentifiée, pas seulement du fichier lui-même.

Limova conserve un journal durable par sujet/révision/canal/format, avec le reçu et l'identifiant de publication retourné par le réseau. Une nouvelle tentative de réception du même reçu ne recrée pas une publication déjà confirmée. Après un timeout ambigu du réseau social, rechercher la publication existante avant de réessayer ; le dépôt garantit l'idempotence de ses articles, pas une garantie universelle d'envoi unique des plateformes sociales. Le raccordement de ce journal et les essais des connecteurs Limova restent des prérequis externes.

## 6. Limites vérifiées et marche arrière

Les contrôles automatisés couvrent l'authentification de preview sans fuite par redirection, les faux HTTP 200 Access, les mauvaises révisions/canonicals/titres, les échecs réseau, la confirmation partielle et la répétition sans mutation. Ils utilisent des réponses simulées ; ils ne prouvent pas qu'un compte Limova ou un jeton Cloudflare a été connecté.

L'activation reste à décider séparément après validation de la preview, de la revue du lot, du transport GitHub/artefacts, des droits Access éventuels et des comptes sociaux. Aucun des sept sujets ne doit être prétendu « publié » parce que son JSON a été importé.

Pour suspendre les réveils automatiques, désactiver le calendrier puis la cible de production. Cette action ne retire pas les pages déjà servies et n'empêche pas les builds Git classiques d'exposer les articles `scheduled` arrivés à échéance. Suspendre aussi le contenu demande une correction de statut relue dans Git. Corriger un sujet par sa révision suivante et une PR ; restaurer un ancien déploiement seulement avec une correction concordante de Git. Les contenus sociaux déjà diffusés suivent la procédure de correction de Limova et de la plateforme concernée.
