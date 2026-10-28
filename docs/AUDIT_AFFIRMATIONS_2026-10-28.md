# Fiabilité des sept ressources LEVOIS — 28 octobre 2026

Périmètre : ressources présentes dans le commit de départ `3737bc944e4a926509054f8c5001f9448cd290a5`, leurs titres, questions et extraits. Correction sur la branche de preview ; ce document n’atteste pas un déploiement en production.

## Sources examinées et limites de la recherche

- `src/data/resources.ts`, `src/data/resourceContent.ts`, leur historique Git et le gabarit `src/pages/ressources/[slug].astro`.
- Documentation du dépôt, notamment `docs/CONVERSION_2026-10-25.md` et `docs/COPYWRITING_ACCUEIL_2026-10-26.md` : les chiffres de pertes ou de délais non justifiés avaient déjà été écartés.
- Notes générales du coffre Obsidian : mémoire LEVOIS, `10_CANONS`, `20_MOTEURS`, `40_PREUVES`. Aucun dossier nominatif de prospect n’est reproduit ni utilisé comme preuve publique.
- `20_MOTEURS/LEVOIS_Architecture_Contenu_Multiformat_V1.md`, cas 1 (lignes 329–331 lors de l’examen) : les montants 250 000 € et 275 000 € appartiennent explicitement à un **exemple fictif**. Le passage explique qu’un écart se calcule mais ne justifie pas, seul, une comparaison. Il ne décrit ni une vente à 225 000 €, ni une perte de 25 000 €.
- `20_MOTEURS/LEVOIS_MOTEUR_EDITORIAL_CARROUSELS_V1.md` exige l’origine des montants, un périmètre commun et des limites ; sinon le chiffre doit être retiré. Les occurrences dans `40_PREUVES/EVIDENCE_CACHE_V1.md` reprennent des pistes de création et de recherche, pas des relevés de transactions attestant le cas publié.
- Source primaire consultée le 28 octobre 2026 : [DGFiP — Demandes de valeurs foncières](https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres). Elle décrit des transactions issues des actes notariés et des informations cadastrales. Elle ne fournit pas une étude des statistiques de consultation des annonces. La [FAQ DGFiP](https://www.data.gouv.fr/api/1/datasets/r/087ec735-74fd-48a7-a82e-0b1cd3ea6fe9) explique notamment les mises à jour et les limites des surfaces et valeurs restituées.

« Preuve absente » signifie qu’aucun document justificatif pertinent n’a été retrouvé dans ce périmètre. Cela ne prétend pas démontrer qu’aucun document extérieur n’existe. Aucune référence de substitution n’a été inventée.

## P0 — marge de négociation

URL historique conservée : `/ressources/marge-negociation-erreur-25000/`. Le nombre subsiste uniquement dans l’identifiant et l’URL existants pour préserver les liens ; il ne sert plus d’accroche ni de preuve.

| Affirmation initiale | Preuve disponible | Correction réalisée |
| --- | --- | --- |
| Titre : « L’erreur de la marge de négociation à 25 000 € » ; question présentant une surévaluation de 10 % comme cause certaine de perte | Aucun échantillon local ni dossier de vente attesté. Le montant proche retrouvé dans le coffre appartient à un exemple fictif distinct. | Titre : « Faut-il ajouter une marge de négociation au prix de vente ? ». Question et extrait reformulés sans perte chiffrée ni résultat garanti, dans `resources.ts`. |
| « Le réflexe le plus coûteux du marché immobilier actuel » | Aucun classement des causes de coût, aucune méthode ou comparaison. | Superlatif retiré de la réponse courte. Explication du filtre de prix sous condition. |
| Tous les acheteurs solvables utilisent des budgets stricts, des alertes et consultent instantanément DVF | Aucune étude ou mesure disponible pour cette généralisation. | Description du comportement d’un filtre si l’acheteur l’utilise ; aucun comportement prêté à l’ensemble des acheteurs. |
| « Les trois premières semaines concentrent 80 % de la visibilité et des contacts qualifiés » | Aucun export de portail, échantillon, définition de « contact qualifié », période ou source. DVF ne mesure pas ces indicateurs. | Chiffre et fenêtre supprimés. Invitation à rassembler les observations réellement disponibles. |
| Au-delà de 90 jours les acheteurs présument un défaut, puis la décote dépasse la marge initiale | Aucun suivi documenté de cohortes ou lien causal établi. | Seuil, psychologie généralisée et conséquence certaine supprimés. L’historique appelle un examen, pas une conclusion automatique. |
| Le bon prix crée plusieurs offres au prix et « neutralise toute tentative de négociation » | Aucune preuve possible d’une telle garantie pour chaque vente. | Mention explicite : prix argumenté ne garantit ni plusieurs offres, ni vente au prix, ni délai ; une négociation reste possible. |
| « Cas réel » à Lèves : valeur 250 000 € établie par DVF, affichage 275 000 €, quatre mois puis acceptation 225 000 € | Aucune référence de mutation, mandat, chronologie, offre ou document attestant ce récit. L’exemple retrouvé dans le coffre est fictif et ne contient pas cette vente finale. | Récit et montants entièrement retirés. Scénario conditionnel sans euros : une annonce dépassant un plafond peut être exclue d’une recherche. Le texte indique qu’il ne s’agit pas d’une vente observée à Lèves. |
| 25 000 € de « perte nette » par rapport à une vente au prix dès le jour 1 | Même un prix de vente documenté ne prouverait pas ce scénario alternatif ni un calcul net. Aucun document disponible ici. | Perte et résultat alternatif retirés ; aucune perte fictive n’est conservée comme démonstration. |
| Rayon de 500 m et douze mois prescrits comme méthode universelle de comparaison | Aucun protocole local justifiant ces seuils pour tous les types de biens. | Recherche de comparables pertinents avec date, source, caractéristiques et inconnues explicites. |
| Les acheteurs ne visitent « tout simplement pas » ; les baisses successives décrédibilisent nécessairement l’annonce | Aucun constat universel établi. | Suppositions à éviter, sans prédire la réaction de tous les acheteurs. |
| Le bon prix ne garantit pas une vente instantanée seulement si des anomalies demeurent | Réserve trop étroite laissant subsister une garantie dans les autres cas. | Limite générale explicite sur prix, marge, perte et délai. |

Les corrections de corps sont dans `src/data/resourceContent.ts`. Le titre, la question et le bénéfice de `resources.ts` alimentent aussi les cartes et les métadonnées du gabarit historique. La vérification du HTML compilé, des aperçus sociaux et des données structurées doit confirmer leur propagation dans la recette de preview.

## Examen des six autres articles

| Ressource | Affirmation ou risque examiné | Preuve / formulation existante | Décision |
| --- | --- | --- | --- |
| `lancement-coherent` | Ordre de préparation et effets sur la vente | Conseil de méthode ; l’exemple dit explicitement qu’il ne promet aucun résultat. La limite exclut prix et délai calculés. | Corps conservé. Aucun chiffre de performance ou fait client attribué. |
| `premiere-impression-annonce` | Première image et nombre de contacts | Le texte précise qu’un test de compréhension ne prédit ni contacts ni vente et que la photo ne corrige pas une information fausse. | Corps conservé. Exemple illustratif, pas un résultat de test revendiqué. |
| `annonce-vue-peu-de-contacts` | Explication du passage vue → contact | Définitions des portails à vérifier, échantillon et période à documenter ; la cause n’est pas déduite automatiquement. | Corps conservé. Aucun taux normatif ou « bon » taux inventé. |
| `retours-de-visite` | Répétition des retours comme preuve de valeur | Le texte distingue perceptions, interprétation et vérification ; il interdit d’en tirer une preuve de valeur ou de probabilité. | Corps conservé. Les deux visiteurs sont dans un exemple illustratif, pas une statistique. |
| `verifier-avant-baisse-prix` | Effet du prix et lecture DVF | Le texte distingue annonces et ventes, et exclut un effet garanti de l’ajustement. | Corps conservé. Aucun montant de décote ni délai promis. |
| `reprendre-commercialisation` | Usure automatique de l’annonce | Le corps indique que l’ancienneté seule n’impose pas une relance et qu’une pause ne garantit pas un nouvel intérêt. L’extrait de bibliothèque pouvait paraître plus affirmatif. | Corps conservé ; extrait aligné : relire l’historique et examiner les options plutôt qu’affirmer une usure. |

Les exemples des six textes sont des scénarios pédagogiques et ne sont pas présentés comme des témoignages ou ventes réelles dans leur gabarit. Aucune réécriture générale n’a été effectuée.

## Durées, dates et historique

- Les sept libellés de lecture de 5 à 8 minutes n’avaient ni méthode de calcul ni mesure documentée. Ils sont remplacés dans le champ historique `duree` par « Guide pratique », « Guide et exercice » ou « Guide et grille ». Le nom de champ reste inchangé pour compatibilité avec les composants existants.
- Le gabarit historique comportait aussi « L’essentiel en 30 secondes », signalé à l’intégration pour remplacement par « L’essentiel ».
- Les six premiers contenus figurent dans l’historique à partir de `68c8cd9` (24 juillet 2026). Leur corps actuel a été révisé par `43e7307` le 10 septembre 2026 à 17:03:23 +02:00.
- Le septième est ajouté par `3737bc9` le 27 octobre 2026 à 13:19:58 +01:00.
- Ces horodatages Git attestent des versions du code, **pas l’heure de première mise en ligne**. Ne pas les convertir silencieusement en `datePublished` ou `dateModified`. Les dates de publication inconnues restent inconnues ; une future publication dispose de son propre journal d’exécution.
- Le 28 octobre dans ce document est la date réelle de l’audit et des corrections locales, pas une affirmation de mise en ligne.

## Points de contrôle de l’intégration

1. Conserver les sept identifiants et URL ; ne pas créer de redirection de l’ancien slug vers une nouvelle accroche chiffrée.
2. Afficher le titre corrigé dans la bibliothèque, le H1, le fil d’Ariane, les liens associés, les métadonnées et les données structurées.
3. Publier les limites et les sources qui étayent effectivement la page. La source DGFiP justifie la nature de DVF, pas des pertes commerciales ou les performances de portails.
4. Vérifier qu’aucune image, légende ou donnée structurée indépendante ne réintroduit le récit retiré.
5. Réserver la date réelle de publication aux contenus dont elle est connue et auditable.

La correction de crédibilité est un défaut démontré. L’effet de ces textes plus fiables sur les demandes qualifiées reste une hypothèse de conversion à mesurer.
