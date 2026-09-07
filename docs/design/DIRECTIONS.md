# ARCHIVE — ne plus utiliser comme autorité visuelle

La direction miniature / Satoshi / cobalt a été validée le 6 septembre 2026. Seuls DESIGN.md et src/styles/tokens.css font autorité pour le site public. Le contenu ci-dessous conserve l’historique ; ses recommandations visuelles sont remplacées. Les règles métier restent à vérifier dans le code.

---

# Directions visuelles LEVOIS — Phase 2.6

Ces directions interrogent entièrement la présentation sans modifier le contenu, les fonctions ni les règles métier. Elles doivent pouvoir produire un mode public expressif et un mode cockpit calme dans une seule marque.

## Dérivation

Sept systèmes concrets ont servi de matière de départ : registre de quart, atlas cadastral, tableau de régulation ferroviaire, feuille de conduite scénique, affiche musicale structurée par une grille, signalétique de transport et cartel d’exposition. Ils couvrent le temps, le territoire, la coordination, la séquence, la hiérarchie typographique, l’orientation et la mémoire.

Les pistes rétro-informatiques et les métaphores trop littérales ont été écartées : une pile HyperCard rendrait l’édition évidente mais éloignerait LEVOIS de son contexte humain ; une interface télétexte ou un tableau de bord de contrôle transformerait la précision en gimmick.

## Direction 1 — Partition active

### Philosophie

Une situation immobilière est une succession de signaux, de décisions et d’engagements datés. L’interface les compose comme une partition : une ligne continue, des temps forts, des respirations et une prochaine mesure évidente.

### Palette

| Rôle | Couleur |
| --- | --- |
| Background | `#F1F3EE` |
| Surface | `#FAFBF7` |
| Text primary | `#15221E` |
| Text secondary | `#58645E` |
| Accent / information active | `#3247D8` |
| Success | `#2F6F58` |
| Attention | `#805708` |
| Danger / retard | `#9B3B2D` |
| Rule / separator | `#C9CFC8` |

La stratégie couleur est **restreinte** : les neutres construisent la surface, l’ultramarin porte l’action, les couleurs d’état n’apparaissent que lorsqu’elles ont un sens.

### Typographie

- **Display, temps, montants :** Antonio Variable, étroite et précise.
- **Heading, body, labels :** Public Sans, auto-hébergée, lisible et stable à petite taille.
- **Mot-symbole de lancement :** Archivo Black, sans prétendre définir un logo final.
- **Données numériques :** chiffres tabulaires de Public Sans ou Antonio selon le contexte.

### Densité et surfaces

Une feuille continue, des filets, des bandes de situation et des lignes tactiles. Peu de rayons, aucune ombre décorative, aucune grille de cartes. Le mobile n’est pas une pile : c’est le format principal de la partition.

### Motion

- 140 ms pour le feedback immédiat ;
- 220 ms pour l’expansion d’un détail ;
- easing `cubic-bezier(.2,.75,.25,1)` ;
- apparition par opacité et translation de 6 px maximum ;
- aucun mouvement ambiant ;
- état final instantané avec `prefers-reduced-motion`.

### Avantages

- Répond directement à « que dois-je faire maintenant ? ».
- Transforme les historiques en évolutions lisibles sans effacer leur profondeur.
- Évite le vocabulaire visuel du CRM SaaS.
- Peut devenir plus spectaculaire sur le site public par l’échelle typographique et le rythme, sans changer de grammaire.

### Risques

- Une typographie condensée trop dominante deviendrait autoritaire.
- Trop de filets produiraient un formulaire administratif.
- Les titres doivent rester compacts dans le cockpit.

### Adéquation

Public : **8/10** — expressif par l’échelle et le rythme.<br>
Cockpit : **9,5/10** — attention, temps et action sont sa structure native.

## Direction 2 — Atlas des décisions

### Philosophie

LEVOIS rend lisibles un territoire, une situation et leurs changements. Le public raconte des trajectoires ; le cockpit montre la couche actuelle, les alternatives et les bifurcations.

### Palette

Fond minéral `#F2F4F1`, encre `#10233A`, bleu cadastral `#315E79`, oxyde `#A94E37`, mousse `#536A57`, safran `#C48F2F`.

### Typographie

Bricolage Grotesque pour les phrases humaines, Public Sans pour l’interface, Antonio pour folios, dates et index.

### Densité et surfaces

Feuilles superposées, frises, repères de provenance, lignes avant/après et zones cartographiques abstraites. Les groupes ressemblent à des couches d’information, pas à des cartes d’application.

### Motion

Révélation par couche, comparaison avant/après, tracé bref d’un itinéraire de décision ; 180–260 ms.

### Avantages

Très cohérent avec le bassin chartrain, les zones de recherche, la provenance et l’évolution des critères. Le site public disposerait d’une matière narrative locale forte.

### Risques

Peut devenir cérébral, surchargé de traits ou trop littéralement cartographique. L’attention immédiate est moins native que dans Partition active.

### Adéquation

Public : **9/10**.<br>
Cockpit : **8/10**.

## Direction 3 — Feuille continue

### Philosophie

Un dossier n’est jamais remplacé : il se plie, se précise et garde la trace de ses formes précédentes. La progressive disclosure devient la matière même de l’interface.

### Palette

Blanc fibre `#F5F4EF`, sumi `#1A211E`, vermillon `#C9402C`, or sourd `#B7923C`, gris pli `#D9D7CF`.

### Typographie

Public Sans pour le texte et Antonio pour la numérotation des étapes ; le caractère vient surtout de la composition et des plis, pas d’une police décorative.

### Densité et surfaces

Chaque section est un pan d’une même feuille. Les détails s’ouvrent comme un pli, les versions successives conservent un sillon et les actions sont intégrées aux bords actifs.

### Motion

Déploiement en 240–320 ms, rotation très faible et uniquement lorsque la relation parent/détail doit être expliquée. En réduction de mouvement, simple apparition instantanée.

### Avantages

Donne une forme mémorable à l’historique, aux scénarios et aux termes versionnés. Le public pourrait employer la feuille à grande échelle de façon très expressive.

### Risques

La métaphore peut prendre le pas sur l’usage, les transitions devenir gratuites et le vermillon rappeler une identité éditoriale déjà explorée. Le cockpit quotidien supporterait mal un excès de matière.

### Adéquation

Public : **8,5/10**.<br>
Cockpit : **7/10**.

## Recommandation de prototype

**Partition active** est retenue pour les trois écrans pilotes. Elle gagne sur les deux critères décisifs : identification de l’usage quotidien et clarté du produit. L’Atlas est plus naturellement local ; la Feuille est plus métaphorique. Aucune des deux n’égale la capacité de la Partition à rendre l’action immédiatement évidente sur 390 × 844 px.

Trois compositions mobiles ont été explorées dans cette direction :

1. flux vertical continu ;
2. déclaration « avant midi » avec rail temporel ;
3. action persistante dans la zone du pouce.

Le prototype conserve le flux vertical de la première et l’en-tête compact de la troisième. Il écarte le titre monumental de la seconde et la barre persistante de la troisième, qui concurrencerait la navigation.

Cette recommandation autorise seulement le prototype Phase 2.6. Elle ne valide ni la propagation au reste du cockpit, ni l’identité publique.
