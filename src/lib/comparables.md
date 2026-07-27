# Moteur de comparables LEVOIS — méthodologie

Ce document trace les choix méthodologiques du moteur utilisé par la page
`/votre-rue` pour réduire progressivement les transactions DVF vers celles
qui ressemblent réellement au bien décrit par l'utilisateur.

Les paramètres numériques ne sont pas issus d'une intuition : ils ont été
calibrés sur les 6 318 transactions du secteur, dans une étude conservée
dans le scratchpad (`scratchpad/calibration.mjs`, `calibration-out.txt`).

Deux principes verrouillés côté produit :

- **Absence de donnée ⇒ poids retiré et score renormalisé** — jamais de
  pénalité fictive pour un champ manquant côté cible ou côté transaction.
- **Aucun prix estimé du bien n'est jamais produit** — seule une fourchette
  observée sur les références retenues, avec le nombre exact et un niveau
  de confiance issu du bootstrap.

## 1 · Exclusion des ventes composites (`lots > 1`)

Sur 6 318 transactions, 414 sont composites (6,6 %). Elles agrègent
plusieurs lots vendus en même temps — la surface, le prix et le €/m²
résultant ne représentent alors ni un lot ni un logement isolé.

| Groupe | Médiane €/m² | Extrêmes p5-p95 |
|---|---|---|
| Maisons composites | 2 697 € | 1 504 – 5 778 |
| Maisons simples | 2 414 € | fourchette resserrée |
| Appartements composites | 4 274 € | 1 452 – 11 539 |
| Appartements simples | 2 401 € | fourchette resserrée |

Écart de médiane : **+12 % sur maisons, +78 % sur appartements**. Ratio
max/min sur composites : **6 à 600×**. Décision : les composites sont
exclus du moteur de comparables.

Fonction : `retirerComposites()`.

## 2 · Backtest par validation croisée (leave-one-out)

Pour chaque transaction du dataset propre (~2 454 maisons, ~3 450 apts) :
son prix est masqué, on cherche ses N plus ressemblantes, on calcule un
repère central, on compare au vrai €/m².

**Résultat empirique majeur — les poids importent peu.** Sept
configurations de pondération testées (surface dominante, terrain fort,
récence forte, équilibré, etc.) donnent toutes une erreur médiane
comprise entre **15,0 et 15,8 %** sur maisons et **12,2 et 13,5 %** sur
appartements. Écart entre la meilleure et la pire config : < 1,5 point.

Cette variabilité résiduelle de ~15 % correspond à ce que DVF ne connaît
pas : état, exposition, rénovation, nuisances, prestations. **Aucune
combinaison de critères DVF ne peut la réduire.** C'est le message
pédagogique du tunnel — les données le confirment.

## 3 · Pondérations retenues

Les poids ne sont pas prétendument optimaux (le backtest le contredirait).
Ils sont **transparents et défendables** :

| Critère | Maison | Appartement | Justification |
|---|---|---|---|
| Surface habitable | 35 | 35 | Le prix DVF est mécaniquement lié à la surface |
| Pièces | 15 | 20 | Différencie T2/T3/T4 à surface proche |
| Géographique | 25 | 35 | Micro-marché plus fort en collectif |
| Terrain (maison) | 15 | 0 | Chiffré à 92 % pour maisons, inexistant en appartement |
| Récence | 10 | 10 | 2025 plus informatif que 2021 |

Somme = 100 dans les deux cas.

Défini dans `POIDS`.

## 4 · Échelles de normalisation

Chaque écart entre la cible et une transaction est normalisé sur son
échelle propre puis clampé à 1 (au-delà, malus maximum).

| Critère | Échelle | Interprétation |
|---|---|---|
| Surface | ±40 % | 90 m² → 54–126 m² pour un écart normalisé de 1 |
| Pièces | 3 pièces | +/− 1 pièce = 0,33 de malus |
| Géographique | 1 500 m | Rayon urbain typique |
| Terrain (maison) | ±100 % | Terrain plus élastique |
| Récence | 4 ans | 2021 vs 2025 = malus max |

Défini dans `ECHELLES`.

## 5 · Sélection finale par seuil de score

La sélection ne retient pas « les N meilleures » : elle applique un seuil
de score et retourne les transactions qui le passent. Les seuils testés
donnent, sur 200 cibles réelles, les tailles médianes suivantes :

| Seuil score | Médiane maisons retenues | Médiane apts |
|---|---|---|
| ≥ 60 | 254 | 293 |
| ≥ 65 | 124 | 203 |
| ≥ 70 | 54 | 128 |
| **≥ 75** | **24** | **76** |
| ≥ 80 | 10 | 42 |

Seuil retenu : **75** (compromis entre ressemblance exigeante et
échantillon suffisant). Élargissement automatique 75 → 70 → 65 → 60 si le
seuil supérieur ne fournit pas assez de références (voir § 6).

Défini dans `SEUILS_SCORE`.

## 6 · Stabilité de la fourchette par bootstrap

Pour différentes tailles d'échantillon, on rééchantillonne 500 fois avec
remise et on mesure la dispersion de Q1, médiane et Q3 en % de la médiane
centrale (demi-intervalle 95 %).

| N | Maisons Q1/méd/Q3 | Appts Q1/méd/Q3 |
|---|---|---|
| 10 | ±29 / ±23 / ±15 % | ±18 / ±11 / ±30 % |
| **15** | **±23 / ±24 / ±13 %** | **±13 / ±12 / ±17 %** |
| 20 | ±18 / ±11 / ±17 % | ±11 / ±11 / ±16 % |
| **30** | **±16 / ±10 / ±19 %** | **±7 / ±5 / ±12 %** |
| 50 | ±9 / ±7 / ±15 % | ±6 / ±5 / ±13 % |

**Trois seuils naturels :**

- **N ≥ 30 : `solide`** — incertitude sur la médiane ≤ 10 %.
- **15 ≤ N < 30 : `prudence`** — lecture affichée avec message de prudence.
- **N < 15 : `insuffisant`** — pas de lecture chiffrée présentée comme
  solide. Message honnête et redirection vers un échange humain.

Défini dans `N_SOLIDE` et `N_MIN`. Le niveau est calculé par
`calculerLecture()`.

## 7 · Élargissement automatique — langage produit

Les filtres surface / pièces / terrain acceptent trois paliers de
tolérance. Si le premier palier ne fournit pas `N_MIN` références, on
passe au suivant. La progression affiche « élargi » et **la plage
réellement acceptée en m² ou en pièces** — jamais l'échelle interne
normalisée.

Exemple : « entre 72 et 108 m² · élargi » plutôt que « ±20 % → ±40 % ».

## 8 · Ce qui ne dépend pas des données publiques

Après les étapes DVF, une rupture visuelle sépare deux zones :

- ce que les ventes publiques permettent de comparer (type, surface,
  pièces, localisation, terrain pour une maison, récence) ;
- ce que les données publiques ne savent pas du bien (état, exposition,
  prestations, nuisances, extérieur, rénovation).

Les questions déclaratives **ne modifient pas le compteur de références**.
Elles alimentent la lecture textuelle envoyée à Mouaad si l'utilisateur
demande à recevoir la lecture par e-mail.
