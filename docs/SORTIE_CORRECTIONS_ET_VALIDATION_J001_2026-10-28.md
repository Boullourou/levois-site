# LEVOIS — sortie des corrections et validation réelle J001–J007

Constat du 28 octobre 2026. **A est soumis à revue ; B reste désactivé. La conversion sans couverture est validée, les couvertures finales restent à produire avant préparation du lot publiable.** Aucune fusion, migration de production, activation, publication d'article ou intégration sociale effectuée. Aucun nouveau message de test envoyé.

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

## B — contrat corrigé : conversion directe réussie

Le précédent bilan exigeait à tort SITE.json en entrée. Ce point est corrigé : **PRODUCTION.json produit SITE.json**. Les détails et preuves actuels figurent dans [VALIDATION_CONVERSION_DIRECTE_2026-10-28.md](VALIDATION_CONVERSION_DIRECTE_2026-10-28.md).

- Sept conversions réelles réussies avec image:null explicitement réservé au test, sans modifier les originaux. Les 38 liens, 19 sources, textes et limites sont conservés ; les identifiants globaux sont maintenant validés sous le namespace technique stable levois-365-2026-2027.
- Auteur, périmètre et réponse extraits du Markdown selon des règles déterministes ; catégorie déduite de la destination. La date de rédaction absente reste omise en V2, sans remplacement par une date de source ou d'import.
- J001 importé et construit dans une copie locale isolée : 55 pages, dont l'article, et 24 contrôles HTML réussis. Horloge simulée uniquement dans cette recette, jamais preuve de publication. Les rejeux ne réécrivent aucun fichier et ne créent aucun doublon.
- LOT.json généré techniquement. Les sept couvertures finales 1600 × 900 restent à fabriquer par ARTICLE puis à compresser ; la préparation normale du lot reste bloquée sur ces fichiers absents.
- Revue du lot complet et activation restent des décisions distinctes. Aucun article dans le catalogue livré, aucun calendrier activé, aucune publication. La validation technique ne valide pas automatiquement les faits.

Aucun SITE.json ni date de rédaction supposée n'est demandé comme pièce manquante. Le commit applicatif a changé pour cette correction du convertisseur : la tête finale et ses checks figurent dans la PR, les constats A ci-dessus sont les preuves antérieures de la recette des formulaires restés inchangés.
