# Conversion directe PRODUCTION → SITE — 28 octobre 2026

**Correction du précédent bilan : SITE.json est une sortie, pas une pièce oubliée à fournir.** L'adaptateur précédent exigeait inutilement un sidecar. Il produit désormais le format V2 directement depuis PRODUCTION.json, avec une configuration technique de campagne stable. Aucun texte n'a été réécrit, aucun fichier Drive modifié, aucun article ajouté au catalogue livré ou publié.

## Résultat de J001

- Identifiant : `levois-365-2026-2027-j001`, révision initiale 1. Le namespace correspond au dispositif connu ; il ne varie ni avec le lot V3/V4, ni avec la date, ni avec le titre.
- Sorties locales : `artifacts/editorial-validation-20261028/direct-v2/J001/SITE.json` et `CONVERSION.json`. Le premier est un article V2 valide en `draft`, avec `image:null` pour le test ; le second conserve les empreintes, la provenance et le blocage de couverture. Aucun horodatage n'est inventé dans ces fichiers.
- Titre, slug, résumé et Markdown copiés exactement. Sources et limites conservées. La réponse est le texte visible du premier paragraphe de l'AST ; ses liens restent dans le Markdown original. Auteur, rôle et périmètre sont extraits de l'unique signature explicite. La catégorie `ventes-locales` provient de `/votre-rue/`.
- Échéance déclarée : `2026-10-29T07:00:00+01:00`, soit 06:00 UTC. Ce n'est pas une heure de publication effective.
- La date réelle de rédaction n'est pas fournie. Elle est désormais facultative en V2 et reste omise, y compris dans le rendu et le JSON-LD. V1 conserve ses exigences. Aucune substitution par `source_read_date`, l'horloge d'import ou la date du dossier.

### Contrôles réussis

Conversion réelle, validation du schéma, import à blanc et rejeu identique réussis. Dans une **copie locale isolée**, import avec écriture puis rejeu `unchanged`, sans seconde écriture. La conversion dans le même dossier après import conserve aussi ses fichiers à l'identique ; les observations d'exécution ne font pas partie de l'empreinte de revue.

Build isolé réussi : **55 pages, dont J001**. Pour construire cette page prévue le lendemain sans l'activer, seul ce processus de test utilise une horloge simulée au 29 octobre à 07:00:01 Europe/Paris ; le garde contre une horloge future reste inchangé dans le code. Le SITE généré reste `draft` ; seul son exemplaire dans la copie de test a été rendu éligible au build. Aucun déploiement, workflow ou catalogue principal n'utilise cette simulation.

Le HTML compilé a été inspecté : H1 unique, contenu et liens, sources, limites, identité/révision, CTA, absence de figure de couverture et de date de rédaction inventée. La couverture n'a pas été fabriquée ni compressée lors de cette recette. Aucun résultat de performance ou de validation factuelle n'en est déduit.

Validation du dépôt : **613 tests / 45 fichiers réussis**, `npm run check` sans erreur ni warning (32 indications existantes), `npm run build` réussi avec les **54 pages du site sans nouvel article**. Cette compilation ordinaire est distincte du build isolé à 55 pages.

## Sept journées contrôlées

| Jour | Identifiant stable | Conversion sans couverture | Date Europe/Paris |
|---|---|---|---|
| J001 | `levois-365-2026-2027-j001` | Réussie | 29/10/2026 07:00 +01:00 |
| J002 | `levois-365-2026-2027-j002` | Réussie | 30/10/2026 07:00 +01:00 |
| J003 | `levois-365-2026-2027-j003` | Réussie | 31/10/2026 07:00 +01:00 |
| J004 | `levois-365-2026-2027-j004` | Réussie | 01/11/2026 07:00 +01:00 |
| J005 | `levois-365-2026-2027-j005` | Réussie | 02/11/2026 07:00 +01:00 |
| J006 | `levois-365-2026-2027-j006` | Réussie | 03/11/2026 07:00 +01:00 |
| J007 | `levois-365-2026-2027-j007` | Réussie | 04/11/2026 07:00 +01:00 |

Les sept conversions sont déterministes, conservent textes/sources/limites et ne réécrivent aucun original. Les identifiants et slugs sont distincts ; le deuxième passage écrit zéro fichier. Les contrôles de collision conservent les URL historiques. Ces sept conversions techniques ne constituent pas une revue des faits ou des sources.

Le manifeste **`inputs/LOT.json` est généré**, sans champ `metadata`, à partir des sept chemins et de la configuration technique. `batchId=levois-365-2026-2027-j001-j007`. La préparation normale du lot refuse le premier `J001/cover.png` absent avant toute création de bundle. Elle ne peut pas réutiliser implicitement le mode de test `image:null` de la commande unitaire.

## Pièces encore nécessaires, exactement

1. **Sept couvertures finales 1600 × 900**, à fabriquer par ARTICLE selon le canon. Les sept `REFERENCE.png` de 941 × 1672 restent des références. Les textes alternatifs et légendes existent déjà dans PRODUCTION et seront conservés ; ils ne sont pas à réinventer.
2. Après fabrication : contrôle des dimensions/orientation, compression WebP ≤500 000 octets et revue visuelle des fichiers réels. Aucun succès de compression de ces couvertures absentes n'est annoncé.
3. Revue du lot complet liée à son empreinte : identité du relecteur et date réelle de revue dans `REVUE.json`, puis décision distincte d'activation. Aucun de ces accords n'est déduit des flags de fabrication.

**Aucun champ éditorial indispensable ne manque pour convertir J001 dans le schéma corrigé.** La date réelle de rédaction est absente mais facultative, donc non bloquante. SITE.json et LOT.json ne sont plus demandés comme contenus à produire manuellement. Pour un futur article sans signature univoque, sans premier paragraphe utilisable ou avec une destination ambiguë, le convertisseur nomme le champ concerné (`article.author`, `article.scope`, `article.answer`, `article.category`) et sa règle ; il n'invente pas de valeur.

La recette machine de la preview et les credentials du futur calendrier restent des sujets distincts, décrits dans la [procédure A/B](MISE_EN_PRODUCTION_LEVOIS_2026-10-28.md). Aucune fusion, migration de production, activation ou publication sociale effectuée. [Contrat exécutable corrigé et commandes](CONTRAT_ADAPTATEUR_PRODUCTION.md).
