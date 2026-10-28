# PRODUCTION.json → article LEVOIS : contrat exécutable

Corrigé le 28 octobre 2026 après clarification de Mouaad. **PRODUCTION.json est l'entrée ; SITE.json est une sortie de conversion, pas une pièce éditoriale à fournir.** Les conversions réelles restent dans les artefacts locaux ignorés. Aucun article ajouté au catalogue livré, aucune publication activée. Ce document complète le [schéma Markdown V2](CONTRAT_MARKDOWN_EDITORIAL_V2.md) et le [protocole de publication par lots](PUBLICATION_LOTS_LIMOVA_2026-10-28.md).

## Entrées réellement inspectées et limites

Les sept PRODUCTION J001–J007 du lot V3 passent la conversion directe avec l'option de test sans couverture. Les anciens constats de refus faute de SITE.json décrivent le précédent contrat, désormais corrigé. La validation technique ne valide ni les faits ni la disponibilité publique de l'article.

Les PRODUCTION.json J001 et J010 du lot Drive `LEVOIS-LOT10-V3-20261028` ont été lus, sans modifier Drive. Ils contiennent les champs article annoncés, les sources et leurs dates de consultation, une limite explicite, ainsi que les contenus sociaux. Leur Markdown passe le parseur strict V2. La valeur `version` est une version du lot, **pas un identifiant durable de campagne**.

Le namespace technique du dispositif est `levois-365-2026-2027`, correspondant à la campagne connue ; il est passé explicitement à la commande et reste stable entre les lots. Le jour vient de `production.id`, la première révision vaut 1. La signature explicite du Markdown fournit l'auteur et le périmètre ; le premier paragraphe fournit la réponse par extraction du texte visible, sans réécriture ; la destination détermine la catégorie selon une table fixe. Une date réelle de rédaction inconnue est omise en V2, jamais remplacée par la date de consultation des sources ou de publication prévue. Le fichier `REFERENCE.png` n'est pas une couverture finale 1600 × 900 : celle-ci reste à fabriquer par ARTICLE.

## Conversion unitaire et test sans image

```sh
npm run editorial:convert -- --file /chemin/J001/PRODUCTION.json --campaign levois-365-2026-2027 --out artifacts/conversion-j001 --test-without-cover
npm run editorial:import -- --file artifacts/conversion-j001/SITE.json
```

La première commande produit un `SITE.json` V2 en `draft` et `CONVERSION.json` : provenance des champs, empreintes source/sortie et blocages de publication. L'option explicite autorise `image:null` uniquement pour le test et conserve référence/alt/légende dans le rapport. Le PRODUCTION original n'est pas modifié. `publicationReady` reste `false`. La seconde commande teste l'import **sans écrire au catalogue** (pas de `--write`).

Avec une couverture finale, remplacer `--test-without-cover` par `--cover /chemin/cover.png` : la commande vérifie 1600 × 900 puis compresse et produit `cover.webp`. Un dossier de sortie existant ne peut être écrasé par des octets différents. Rejouer la même conversion est sans effet, y compris après import du sujet. Les sorties sont interdites dans `public/` et le catalogue ; dans le dépôt elles restent sous `artifacts/`.

J001/J010 ne contiennent pas de présentation Facebook sous `article`. Le texte LinkedIn de repli examiné pointe vers un parcours, et non l'URL du futur article. Il faut donc préparer/valider ces textes de diffusion dans Drive et y prévoir l'URL publique exacte. Le site et l'adaptateur ne réécrivent pas ces textes. La compatibilité des connecteurs Limova (article LinkedIn, PDF multipage, suivi des reçus Actions) reste à tester dans Limova.

## Arborescence à remettre par le chat ARTICLE

```text
lot/
  LOT.json
  J001/PRODUCTION.json
  J001/cover.png
  ... six autres journées ...
```

Le chat ARTICLE utilise ces fichiers locaux téléchargés depuis Drive. Aucun connecteur Drive n'est ajouté au site. Les deux autres chats ne modifient pas GitHub. Un lot contient exactement **sept dates consécutives**, et peut chevaucher un changement d'heure.

`LOT.json` :

```json
{
  "schemaVersion": 1,
  "batchId": "campagne-exemple-lot-001",
  "campaignId": "campagne-exemple",
  "days": [
    {
      "production": "J001/PRODUCTION.json",
      "cover": "J001/cover.png",
      "coverWidth": 1600,
      "coverHeight": 900
    }
  ]
}
```

L'extrait montre la structure d'une entrée : le fichier réel doit en avoir sept. Les chemins sont relatifs au lot, sans sortie de dossier, même par lien symbolique. La couverture peut être `null` seulement si `article.image` vaut explicitement `null` ; omettre alors ses dimensions. Chaque JSON est limité à 100 000 octets.

`LOT.json` est un manifeste technique générable à partir des chemins, jours et de l'identifiant de campagne ; il n'exige aucune nouvelle rédaction. `SITE.json` ne figure pas parmi ses entrées. L'ancien champ `metadata` reste accepté uniquement pour compatibilité avec les lots déjà préparés ; il n'est plus demandé dans le flux V3.

Les champs éditoriaux explicites facultatifs `article.author`, `article.answer`, `article.scope`, `article.category` et `article.dates` sont prioritaires s'ils existent. Sinon, les règles d'extraction ci-dessous s'appliquent. Une signature absente/ambiguë, une réponse trop longue ou une destination sans catégorie déterminable produit une erreur nommée, jamais un auteur par défaut ou une troncature.

Une date connue au jour reste `YYYY-MM-DD`, sans minuit fabriqué. `article.dates.createdAt` est facultatif en V2 ; `updatedAt` apparaît seulement pour une modification réelle. Une nouvelle révision doit porter une date de modification explicite, strictement après la dernière date connue si elle existe. Aucune date de rédaction/JSON-LD `dateCreated` n'est affichée quand elle est inconnue.

## Mapping sans réécriture

| Source | Sortie V2 |
|---|---|
| Configuration `campaignId` + `PRODUCTION.id` | `topicId = levois-365-2026-2027-j001` ; ne dépend ni de la version du lot, ni du titre, ni de la date |
| Nouveau sujet / catalogue existant | `revision=1` pour un nouveau sujet ; révision conservée au rejeu ; révision suivante explicite pour modifier |
| `article.title / slug_propose / meta_description` | `title / slug / summary`, chaînes exactes |
| `article.markdown` | `content.markdown`, chaîne exacte, `format=commonmark` |
| Premier paragraphe AST du Markdown | `answer` : texte visible exact, emphase retirée et libellés des liens conservés ; contenu et destinations restent intacts dans `content.markdown`. Maximum 1200 caractères, sinon refus |
| Unique signature `Nom — rôle. RSAC … . Périmètre.` | `author.name`, `author.role` et `scope` : extraits littéraux ; signature entière conservée dans le corps |
| Destination `/votre-rue/`, `/situer-ma-vente/`, `/ma-recherche/`, `/vendre-et-acheter/` | Respectivement `ventes-locales`, `vendre`, `acheter`, `vente-achat` ; `/contact/` exige `article.category` explicite |
| `article.dates.createdAt / updatedAt`, si présents | Copie exacte validée ; absents = omis, sans horodatage inventé |
| `date` + `article.time=07:00` + `timezone=Europe/Paris` | `dates.publishAt`, échéance prévue calculée avec +01:00/+02:00 ; **jamais heure de déploiement prétendue** |
| `sources[].id / editeur / url / lecture / portee` | `id / label / url / accessedAt / scope`, exacts ; URL `null` reste null |
| `limites` | Un élément exact dans `limits`, sans découpage ni résumé |
| `destination` | Chemin de l'un des cinq parcours autorisés, origine LEVOIS, sans paramètres |
| Couverture finale fournie | WebP local vérifié, dimensions réelles et nom lié au hash |
| `article.image_alt / image_caption` | `image.alt / caption`, exacts, y compris la transparence d'une illustration IA |
| État de préparation | `draft` obligatoire ; les indicateurs `ready_for_production` ne valent pas revue humaine |

Les champs `facts`, `sujet`, les autres métadonnées de fabrication et les contenus carrousel/vidéo/sociaux restent dans le PRODUCTION original ; ils ne deviennent pas des blocs visibles supplémentaires inventés. Les assertions réellement publiées sont celles du Markdown. Les fichiers de source sont liés au bundle par SHA-256 : modifier même un champ social du PRODUCTION impose de refaire sa revue liée à l'empreinte, sans changer l'identité du sujet.

Markdown : paragraphes, titres, emphase, listes ordonnées/non ordonnées imbriquées, citations et liens sont rendus. Le premier H1 doit être identique au titre et n'est pas dupliqué : le header l'affiche. Les structures non prises en charge sont **refusées avec localisation**, jamais aplaties silencieusement. Aucun HTML, JSX, script, code, tableau ou image intégrée n'est exécuté. Voir le contrat Markdown pour les détails. Les liens absolus conservés vers levois.fr restent des liens de production lorsqu'on lit une preview ; utiliser les CTA relatifs du template pour la recette des formulaires.

## Couverture

Fournir une couverture **déjà composée** aux dimensions déclarées (par exemple 1600 × 900). Formats d'entrée fixes PNG/JPEG/WebP/AVIF, maximum 25 000 000 octets et 16 millions de pixels ; dimension 1–4000. Après application de l'orientation EXIF, les dimensions doivent correspondre exactement. Pas de recadrage ni d'étirement.

Sharp, version verrouillée, encode WebP avec la première qualité satisfaisante parmi 88, 80, 72, 64, 56, 48 (effort 6). Le résultat doit faire au plus **500 000 octets** ; sinon refus. Les métadonnées EXIF/GPS sont retirées. Une vérification visuelle du résultat reste obligatoire lors de la revue : une limite de poids ne prouve pas la qualité de l'image.

L'original n'est jamais modifié. Le bundle conserve poids, dimensions, qualité et empreintes entrée/sortie. Le chemin public est `/editorial/{topicId}/cover-{hash16}.webp` : une nouvelle image ne remplace pas silencieusement l'ancienne. Pour un même environnement Node/Sharp verrouillé et les mêmes entrées, la sortie est déterministe.

## Préparer, relire, puis activer explicitement

Depuis le dépôt sur une branche de travail, après `npm ci` :

```sh
npm run editorial:batch -- --file /chemin/lot/LOT.json --out /chemin/prepared-lot-001
```

La commande contrôle les sept journées, les sources, Markdown, dimensions, dates, collisions avec le catalogue et les URL historiques. **Aucun fichier du site n'est modifié** sans `--activate`. Elle crée un bundle immutable avec `PREPARATION.json`, les sept brouillons et leurs couvertures. Rejouer les mêmes entrées dans le même dossier est sans effet ; une sortie différente est refusée, choisir un nouveau dossier après modification.

Le responsable examine le texte source et le bundle, les preuves/limites, images, destinations et dates. Il fournit un `REVUE.json` lié à l'empreinte exacte affichée :

```json
{
  "schemaVersion": 1,
  "batchId": "campagne-exemple-lot-001",
  "campaignId": "campagne-exemple",
  "fingerprint": "EMPREINTE_PREPARATION_A_RECOPIER",
  "reviewer": "Nom du responsable ayant réellement relu",
  "reviewedAt": "HORODATAGE_REEL_DE_LA_REVUE_AVEC_FUSEAU"
}
```

```sh
npm run editorial:batch -- --file /chemin/lot/LOT.json --out /chemin/prepared-lot-001 --review /chemin/REVUE.json
```

Cette étape valide la déclaration de revue, conserve le bundle en brouillon et **n'active rien**. Le fichier est une trace, pas une signature cryptographique ni un substitut aux droits et à la revue GitHub.

Seulement lors de la décision distincte d'activer ce lot :

```sh
npm run editorial:batch -- --file /chemin/lot/LOT.json --out /chemin/prepared-lot-001 --review /chemin/REVUE.json --activate
npm run editorial:check
npm run check
npm test
npm run build
```

`--activate` est refusé sur main, master ou HEAD détachée. Il copie les fichiers validés sur la branche courante, avec `status=scheduled`. La revue de la PR, sa preview et sa fusion restent distinctes. La commande ne commit, ne pousse, ne fusionne et ne déploie rien. Joindre à la PR les traces PREPARATION/REVUE sans secrets ni données de prospect.

L'identité stable + révision prévient les doublons : même article/révision/contenu → inchangé ; contenu différent avec révision identique → refus ; modification → exactement révision suivante et date réelle plus récente. Slug, création et date prévue déjà importés restent immuables hors correction exceptionnelle revue. Deux sujets ne peuvent occuper la même date active.

Un verrou partagé avec l'import unitaire protège l'activation. Les validations ont lieu avant les écritures. Une erreur d'écriture restaure les fichiers modifiés par cette exécution, tant qu'aucun tiers ne les a modifiés. Un arrêt brutal du processus peut laisser une activation partielle locale : vérifier le diff, l'absence de processus actif avant de retirer un verrou résiduel, puis rejouer le même lot. Ne jamais committer une activation échouée sans vérification.

**Attention :** une fois le lot scheduled fusionné, tout build après son échéance peut publier l'article, même si le cron est désactivé. Pour suspendre aussi cette éligibilité, conserver les brouillons ou retirer explicitement le statut scheduled en revue. La PR actuelle de corrections ne contient aucun article réel ; sa mise en production A ne constitue pas l'activation B du calendrier.

## Ce qui reste à fournir

1. Les sept PRODUCTION V3 sont présents ; aucun SITE.json entrant supplémentaire n'est à fournir. Le manifeste technique est généré à partir du lot.
2. Sept couvertures finales 1600 × 900 fabriquées par ARTICLE ; les références actuelles ne les remplacent pas. `image:null` du test ne vaut pas renoncement à ces couvertures.
3. Revue éditoriale réelle des sept journées et son horodatage ; les flags de fabrication ne la remplacent pas.
4. Accès Limova au dépôt et lecture des artefacts Actions vérifiés, avec une branche/PR stable par lot.
5. Textes sociaux validés et attente des reçus `socialReady=true`, selon le protocole des lots.
6. Décision d'activation B, réglages GitHub et recette distante : aucune de ces étapes n'est déduite d'un simple login navigateur.
