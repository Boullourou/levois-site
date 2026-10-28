# PRODUCTION.json → article LEVOIS : contrat exécutable

Préparé le 28 octobre 2026. Aucun lot réel importé, aucune publication activée. Ce document complète le [contrat historique](CONTRAT_LIMOVA_2026-10-28.md), le [schéma Markdown V2](CONTRAT_MARKDOWN_EDITORIAL_V2.md) et le [protocole de publication par lots](PUBLICATION_LOTS_LIMOVA_2026-10-28.md).

## Entrées réellement inspectées et limites

**Complément de recette du 28 octobre :** les sept dossiers J001–J007 du lot V3 ont depuis été contrôlés. Markdown, liens et sources passent les contrôles techniques ; l'import complet reste refusé faute de `SITE.json`, `LOT.json` et couvertures finales. Le [bilan réel des sept journées](SORTIE_CORRECTIONS_ET_VALIDATION_J001_2026-10-28.md) distingue ces résultats des tests sur fixtures et des conditions d'activation. Les observations J001/J010 ci-dessous restent l'historique de préparation du contrat.

Les PRODUCTION.json J001 et J010 du lot Drive `LEVOIS-LOT10-V3-20261028` ont été lus, sans modifier Drive. Ils contiennent les champs article annoncés, les sources et leurs dates de consultation, une limite explicite, ainsi que les contenus sociaux. Leur Markdown passe le parseur strict V2. La valeur `version` est une version du lot, **pas un identifiant durable de campagne**.

Il manque un sidecar explicite pour l'identité de campagne, la révision, l'auteur structuré, la date réelle de rédaction, la réponse immédiate, le périmètre et la catégorie. Ces valeurs ne sont pas déduites du nom de dossier, de l'heure d'envoi Drive ni d'une signature analysée dans le texte. Le fichier référence `REFERENCE.png` ne prouve pas qu'une couverture finale 1600 × 900 a été fabriquée. Aucune photo de substitution n'est générée.

J001/J010 ne contiennent pas de présentation Facebook sous `article`. Le texte LinkedIn de repli examiné pointe vers un parcours, et non l'URL du futur article. Il faut donc préparer/valider ces textes de diffusion dans Drive et y prévoir l'URL publique exacte. Le site et l'adaptateur ne réécrivent pas ces textes. La compatibilité des connecteurs Limova (article LinkedIn, PDF multipage, suivi des reçus Actions) reste à tester dans Limova.

## Arborescence à remettre par le chat ARTICLE

```text
lot/
  LOT.json
  J001/PRODUCTION.json
  J001/SITE.json
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
      "metadata": "J001/SITE.json",
      "cover": "J001/cover.png",
      "coverWidth": 1600,
      "coverHeight": 900
    }
  ]
}
```

L'extrait montre la structure d'une entrée : le fichier réel doit en avoir sept. Les chemins sont relatifs au lot, sans sortie de dossier, même par lien symbolique. La couverture peut être `null` seulement si `article.image` vaut explicitement `null` ; omettre alors ses dimensions. Chaque JSON est limité à 100 000 octets.

`SITE.json` accompagne chaque journée :

```json
{
  "schemaVersion": 1,
  "campaignId": "campagne-exemple",
  "dayId": "J001",
  "revision": 1,
  "author": { "name": "Auteur réel à renseigner", "role": "Fonction réelle à renseigner" },
  "dates": { "createdAt": "DATE_REELLE_A_FOURNIR" },
  "answer": "Réponse immédiate exacte, préparée et validée en amont.",
  "scope": "Périmètre exact préparé et validé en amont.",
  "category": "ventes-locales"
}
```

Ces exemples sont des gabarits, pas des faits validés. Les placeholders sont volontairement refusés par le validateur. Le responsable éditorial complète les données avant transmission ; Limova n'invente ni réponse, ni auteur, ni date. Une date connue au jour reste `YYYY-MM-DD`, sans minuit fabriqué. Si une heure réelle est connue, ISO 8601 avec fuseau explicite est accepté. `updatedAt` apparaît seulement pour une modification réelle ; une deuxième révision doit être strictement plus récente. Deux modifications le même jour peuvent nécessiter leurs heures réellement connues.

## Mapping sans réécriture

| Source | Sortie V2 |
|---|---|
| `SITE.campaignId` + `PRODUCTION.id` | `topicId = campagne-j001` ; ne dépend ni de la version du lot, ni du titre, ni de la date |
| `SITE.revision` | `revision`, identique |
| `article.title / slug_propose / meta_description` | `title / slug / summary`, chaînes exactes |
| `article.markdown` | `content.markdown`, chaîne exacte, `format=commonmark` |
| `SITE.answer / author / scope / category / dates` | Champs correspondants, sans valeur par défaut |
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

1. Convention d'identifiant de campagne pérenne et sept SITE.json documentés.
2. Sept couvertures finales ou absence explicitement assumée.
3. Revue éditoriale réelle des sept journées et son horodatage ; les flags de fabrication ne la remplacent pas.
4. Accès Limova au dépôt et lecture des artefacts Actions vérifiés, avec une branche/PR stable par lot.
5. Textes sociaux validés et attente des reçus `socialReady=true`, selon le protocole des lots.
6. Décision d'activation B, réglages GitHub et recette distante : aucune de ces étapes n'est déduite d'un simple login navigateur.
