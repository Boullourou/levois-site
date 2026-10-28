# LEVOIS — sortie des corrections et validation réelle J001–J007

Constat du 28 octobre 2026. **A est prêt à être soumis à revue ; B reste désactivé et son premier lot n'est pas importable en l'état.** Aucune fusion, migration de production, activation, publication d'article ou intégration sociale effectuée. Aucun nouveau message de test envoyé.

## A — corrections du site

La [PR nº 5](https://github.com/Boullourou/levois-site/pull/5) porte les corrections, sur `codex/editorial-conversion-20261028`. Le candidat contrôlé avant ce complément documentaire est `27165fe918a7391ad2b0e9f7ee42e1a7d101a155`. La tête finale à déployer sera indiquée dans la PR après les checks du commit documentaire ; aucun code applicatif ne change dans ce complément.

- Recette réelle sur le code `70e7abba461e1d3e65f5e908d4887a61b23477a6` : trois diagnostics et un contact fictifs, sept messages acceptés par Resend puis reçus selon Mouaad ; deux rejeux exacts sans nouvelle tentative d'envoi, ni message supplémentaire confirmé. Les commits suivants jusqu'à ce bilan ne changent que documentation et captures.
- Checks verts sur `27165fe` : CI de validation éditoriale, vérification du site et build Cloudflare. La suite documentée comprend 588 tests / 44 fichiers, vérification Astro, build, contrôles des données et recette navigateur locale ; les 109 tests de contrat rejoués ici sont un sous-ensemble, pas 109 tests supplémentaires.
- Les pannes simulées, stockage refusé, no-JS et Axe restent couverts localement/CI lorsqu'ils n'ont pas été rejoués à distance. Les réceptions preview ne prouvent pas le routage des e-mails de production. [Périmètre exact et captures](RECETTE_DISTANTE_RESULTATS_2026-10-28.md).
- Aucun article réel dans `src/content/editorial`, aucune variable d'activation ni aucun secret Actions du dépôt configurés au relevé. La fusion de A peut ajouter le workflow mais laisse son calendrier dormant. Attention : un article déjà dû et placé dans le catalogue pourrait être publié par un build Git ordinaire ; ce n'est pas le cas de ce candidat.

L'accès machine absent empêche le runner distant complet et les GET automatisés du manifeste/des articles sur **la preview protégée par Access**. Il ne bloque pas les builds locaux/CI, l'intégration Git Cloudflare ou le site public (HTTP 200 sans Access). Le manifeste public répond actuellement 404 parce que l'ancienne production ne contient pas cette route ; sa présence sera contrôlée après A. Le workflow de production n'utilise pas les credentials Access de preview. B nécessite séparément son lot, sa revue, les credentials de déploiement Actions et sa recette. Aucun élargissement de permission n'est demandé pour A.

### Ordre préparé, à exécuter uniquement après décision de production A

1. Recontrôler le SHA approuvé, le schéma D1, l'absence de publication concurrente, le catalogue et les drapeaux désactivés ; relever le déploiement sain et le bookmark D1.
2. Appliquer **uniquement `db/contact-delivery.sql`** au binding `RECHERCHE_DB --env production`, UUID `077d24f8-5efc-4787-a451-05b041ddd2f7`. Le contrôle en lecture seule confirme l'absence de `contact_delivery_receipts` et de son index ; les autres schémas nécessaires sont conformes. Migration additive, non exécutée.
3. Vérifier le DDL, les colonnes et index après migration ; seulement ensuite fusionner le commit relu. L'intégration Git existante déploie `main`.
4. Vérifier le SHA réellement servi, les pages clés, diagnostics et synthèse sans envoi, contact, canonicals, robots/sitemap/manifeste, erreurs d'API et absence de cache public des réponses personnelles. Maintenir les drapeaux éditoriaux désactivés.
5. En cas d'échec bloquant, rollback vers le dernier déploiement **de production** sain, puis correction/revert Git revu. Conserver toutes les tables, demandes et reçus : ni suppression ni restauration globale de D1.

Production observée : `3737bc944e4a926509054f8c5001f9448cd290a5`, déploiement `723ae144-3a72-4ec5-ab0c-571be11ae4e8`. À revalider lors de l'intervention. [Procédure détaillée et commandes](MISE_EN_PRODUCTION_LEVOIS_2026-10-28.md). Preuves locales en lecture seule : `artifacts/release-readiness-20261028/`.

## B — adaptateur implémenté, premier lot incomplet

L'adaptateur déterministe, le parseur Markdown, la compression de couverture, les identifiants/révisions, les garde-fous de lot et les reçus sont **implémentés et testés**. Cela ne signifie pas qu'un article réel incomplet est importable. Aucun changement du contrat n'a été improvisé pour accepter les données absentes.

Source examinée : [LOT_10_JOURS_FIGES_V3 dans Drive](https://drive.google.com/drive/folders/1Na4Ft14mmSpoYuFNMcMZiLnmfrhvp7cJ), sept premiers dossiers, sans modifier Drive. Le registre et les fichiers de fabrication ne valent pas manifeste d'import ni revue éditoriale du lot. Les contenus réels restent dans les artefacts locaux ignorés ; ils ne sont pas ajoutés au site.

### J001 puis contrôle des sept premières journées

| Jour | Sujet | Échéance déclarée Europe/Paris | Résultat |
|---|---|---|---|
| J001 | Prix des ventes à Lèves | 29/10/2026 07:00, UTC+01 | Texte compatible ; import bloqué |
| J002 | Canapé et passage des portes | 30/10/2026 07:00, UTC+01 | Texte compatible ; import bloqué |
| J003 | Documents avant l'annonce | 31/10/2026 07:00, UTC+01 | Texte compatible ; import bloqué |
| J004 | DPE et facture d'énergie | 01/11/2026 07:00, UTC+01 | Texte compatible ; import bloqué |
| J005 | Budget au-delà du prix affiché | 02/11/2026 07:00, UTC+01 | Texte compatible ; import bloqué |
| J006 | Adresse et trajet Filibus à Lèves | 03/11/2026 07:00, UTC+01 | Texte compatible ; import bloqué |
| J007 | Ordre de vente et d'achat | 04/11/2026 07:00, UTC+01 | Texte compatible ; import bloqué |

Contrôles réellement obtenus :

- Les **14 empreintes SHA-256** des `PRODUCTION.json` et `DOSSIER_COMPLET.md` correspondent au registre. Les sept chaînes Markdown sont retrouvées à l'identique dans les dossiers et acceptées par le parseur ; les 38 occurrences de liens restent identiques dans le rendu.
- Les 19 entrées de sources, dont quatre avec URL null, sont conservées par une projection réversible. Aucune URL ni référence inventée. Ce contrôle établit la conservation des champs, pas la véracité des affirmations ni l'accessibilité des sources.
- Les sept dates sont consécutives et résolues à **06:00 UTC / 07:00 Europe/Paris**, après le passage à l'heure d'hiver. Les tests du planificateur couvrent aussi les deux changements d'heure 2027. Ces échéances ne sont pas des dates de publication effective.
- Aucun doublon de jour/slug ni collision avec les sept URL historiques. L'identifiant global `campaignId + dayId` et sa collision réelle restent **non validables sans `campaignId` explicite** ; les reprises/idempotences du code passent les tests techniques.
- Les sept `REFERENCE.png` font **941 × 1672 px**, environ 1,95 à 2,48 Mo : références de fabrication, pas couvertures finales 1600 × 900. Ni composition ni compression d'une couverture réelle prétendue.
- L'appel réel à l'adaptateur pour chaque journée refuse les champs manquants. La CLI sans activation refuse `LOT.json` absent (`ENOENT`), sans créer de bundle. Le registre V3 n'est pas accepté comme manifeste de remplacement.

**Import complet et build incluant J001 : non réalisés, bloqués par les entrées obligatoires absentes.** Le build vert du site et les 109 tests techniques réussis ne sont pas présentés comme une validation de J001. Il ne s'agit ni d'une nouvelle rédaction ni d'une validation automatique des faits.

### Éléments précis à fournir avant la prochaine recette du lot

1. Sept `SITE.json` conformes au [contrat](CONTRAT_ADAPTATEUR_PRODUCTION.md) : `schemaVersion`, `campaignId` durable, `dayId`, `revision`, `author.name`, `author.role`, `dates.createdAt` réelle, `answer`, `scope`, `category`. Certains textes existent dans les dossiers, mais aucune valeur n'a été inférée ; une date de fichier Drive ou de consultation de source n'est pas une date de rédaction.
2. Sept couvertures finales **1600 × 900**, déjà composées, avec leur texte alternatif validé. La recette vérifiera dimensions/orientation puis compression WebP ≤500 000 octets, sans modifier les originaux.
3. Un `LOT.json` référençant exactement ces sept PRODUCTION, SITE et couvertures. Une revue liée à l'empreinte du lot ne sera demandée qu'après préparation réussie, avant l'étape distincte d'activation.

À réception : rejouer l'adaptation J001, contrôler la conservation de toutes les données, l'identité, la couverture et le build isolé ; puis préparer les sept brouillons. Aucun `--activate`, fusion ou déclenchement du calendrier n'est autorisé par cette recette technique. Les relais Facebook/LinkedIn restent conditionnés ultérieurement à un reçu de disponibilité de l'URL publique.

Preuves locales détaillées : `artifacts/editorial-validation-20261028/BILAN_REEL_J001_J007.md`, `real-seven-report.json`, `reference-images.json`, `technical-contract-tests.json` et rapports individuels. Les entrées originales n'ont pas été modifiées.
