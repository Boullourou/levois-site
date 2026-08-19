# LEVOIS — audit des assets publics

Statut : **audit de décision, pas validation de publication**

Phase : 2.7a — recadrage de l’expérience publique

Périmètre : images présentes dans le dépôt et rushes Chartres fournis hors Git

## Verdict

Les vidéos sont **utiles, mais insuffisantes seules**. Elles apportent une matière locale réelle et plusieurs plans solides pour le mobile, les transitions et la preuve de territoire. Elles ne fournissent toutefois ni présence crédible de Mouaad, ni relation humaine, ni couverture horizontale pensée pour un grand écran. La qualité et la diversité ne permettent donc pas de bâtir toute l’identité publique autour des seuls rushes actuels.

La voie la plus crédible est une **route C hybride** : quelques fragments locaux réels, un système graphique de lecture du territoire et une présence humaine produite spécifiquement. Une mini séance complémentaire de une à deux heures est nécessaire avant toute refonte généralisée.

Ce verdict ne vaut pas autorisation d’utiliser un fichier. Aucun rush n’est considéré comme *cleared* : provenance, droits de captation et autorisations éventuelles restent à confirmer avant publication.

## Méthode et limites

L’audit a suivi quatre niveaux :

1. inventaire des fichiers et des références dans le code public ;
2. vérification de la documentation de source et de licence disponible dans le dépôt ;
3. extraction locale de trois images de triage pour chacun des 104 rushes ;
4. extraction de douze images timecodées pour 24 rushes présélectionnés.

Les originaux n’ont été ni déplacés, ni modifiés, ni copiés dans Git. Les dérivés, inventaires techniques et planches restent sous `.local/asset-audit/`, dossier ignoré par Git.

Limites importantes :

- la stabilité est estimée à partir des séquences de frames ; elle devra être confirmée par lecture intégrale à taille réelle avant montage ;
- la détection des personnes, plaques, enseignes et adresses est visuelle, non exhaustive et non assimilable à une revue juridique ;
- aucune autorisation de personne, de lieu ou de marque n’a été trouvée dans le périmètre audité ;
- le fait qu’une vidéo soit fournie ou stockée localement ne prouve pas à lui seul les droits de publication ;
- les timecodes ci-dessous sont des fenêtres de travail approximatives, à resserrer sur les fichiers originaux ;
- l’audio n’a pas été retenu comme matière publique et n’a pas fait l’objet d’une validation éditoriale.

## Images actuelles

### Inventaire global

`public/images/` contient **172 dérivés AVIF/WebP**, regroupés en **28 familles** déclarées dans `src/data/images.ts` :

- 4 familles de hero : `hero-chartres-evidence`, `hero-dialogue`, `hero-marche`, `hero-proprietaires` ;
- 5 situations : `situation-preparer`, `situation-publiee`, `situation-peu-contacts`, `situation-visites`, `situation-longtemps` ;
- 6 ressources éditoriales ;
- 4 profils illustratifs ;
- 2 familles Mouaad ;
- 5 familles méthode ;
- 2 familles territoire.

Une seule famille possède une provenance et une licence vérifiables dans le code :

- `public/images/hero-chartres-evidence-*` — photographie de Ludvig14, Wikimedia Commons, licence CC BY-SA 4.0, avec attribution et lien de licence prévus dans les composants concernés.

Pour les **27 autres familles**, aucun original, registre de provenance, licence d’exploitation ou autorisation de modèle n’a été retrouvé dans le dépôt. Cela ne démontre pas qu’aucun droit n’existe ; cela interdit seulement de les considérer comme prêtes à publier ou à étendre sans vérification extérieure.

### Usages réellement rendus aujourd’hui

| Page ou zone | Asset ou traitement actuel | Constat |
| --- | --- | --- |
| Accueil `/` | `hero-marche`, `profil-femme`, `situation-publiee` dans `WorldGateway` | Trois portes de parcours, mais imagerie hétérogène et générique ; priorité de remplacement. |
| Accueil `/` | `mouaad-rdv` | Passage humain utile dans la narration, mais provenance et autorisations non documentées dans le dépôt ; à réévaluer immédiatement. |
| Accueil / métadonnées sociales | `hero-chartres-evidence` | Source claire ; image très lisible mais registre « vue de Chartres / cathédrale » trop carte postale pour porter seule la future identité. |
| `/ma-recherche` | `JourneyImmersion` graphique, sans photo | Aucun ancien asset ne contraint le prochain premier écran. |
| `/situer-ma-vente` | `JourneyImmersion` graphique, sans photo | Même liberté de conception ; ne pas injecter une photo par réflexe. |
| `/audit-annonce` | `JourneyImmersion` graphique, sans photo | L’idée de signal et d’attente peut rester graphique ou hybride. |
| `/mouaad` | `mouaad-terrain`, `mouaad-rdv` | Le besoin humain est juste ; les fichiers doivent être remplacés ou validés à partir d’originaux et d’autorisations établis. |

Les autres familles sont principalement référencées par des composants, catalogues ou explorations non rendus dans la composition publique actuelle : ancien hero en trois scènes, galeries de profils, panneaux méthode, rail de situations, scène territoire et vignettes de ressources. Leur présence dans le dépôt ne constitue pas une raison de les reconduire.

### Garder / remplacer / supprimer / réévaluer

| Décision | Familles concernées | Motif |
| --- | --- | --- |
| **Garder sous conditions** | `hero-chartres-evidence` | Droits documentés et qualité technique correcte. À employer comme preuve locale secondaire, avec attribution conforme, pas comme image maîtresse automatique. |
| **Remplacer en priorité** | `hero-marche`, `profil-femme`, `situation-publiee` | Actifs sur l’accueil, langage de banque d’images ou de scène illustrative, cohérence insuffisante avec l’ambition premium et locale. |
| **Réévaluer puis remplacer si la preuve manque** | `mouaad-terrain`, `mouaad-rdv` | Rôle narratif essentiel, mais absence d’originaux et d’autorisations vérifiables dans le dépôt. Une captation réelle dédiée serait plus crédible. |
| **Ne pas reconduire dans la future expérience** | `hero-proprietaires`, `hero-dialogue`, profils non actifs, `territoire-carte`, `territoire-rue` | Ancienne direction, représentations génériques ou ambiguës, territoire illustré plutôt que vécu, droits non documentés. « Supprimer » signifie ici écarter de la future sélection, pas effacer les fichiers pendant cette phase. |
| **Réévaluer seulement si un besoin éditorial précis revient** | situations restantes, ressources, méthode | Certaines scènes peuvent encore illustrer un article, mais leur style ne doit pas dicter la DA et leurs droits doivent d’abord être établis. |

Le détail famille par famille est destiné à la matrice de décision [`PUBLIC_ASSET_DECISION_MATRIX.md`](./PUBLIC_ASSET_DECISION_MATRIX.md). La règle commune reste : **aucune image n’est gardée parce qu’elle existe déjà**.

## Vidéos Chartres

### Inventaire technique

L’archive locale comporte 209 entrées : **104 fichiers `.MOV` réels**, **104 fichiers de métadonnées macOS** et une entrée de dossier. Seuls les 104 rushes réels ont été extraits pour l’audit.

Empreinte de l’archive source auditée : `SHA-256 99F93965CEC0368A92097BB715D78E259A13B066964E81D46C07AFE0C949301C` ; taille : `1 362 790 566` octets. Cette empreinte permet de rattacher l’inventaire à la source sans committer ni déplacer l’archive.

- poids extrait : **1 378 350 672 octets**, soit environ 1,378 Go en notation décimale ;
- durée cumulée : **1 169,8 secondes**, soit environ 19 min 30 s ;
- durée moyenne : **11,25 s** ;
- plus court : **0,4 s** ;
- plus long : **22,7 s** ;
- 22 rushes sous 8 s, 41 de 8 à moins de 12 s, 29 de 12 à moins de 16 s et 12 de 16 s ou plus ;
- résolution : **1080 × 1920 pour les 104 fichiers** ;
- orientation : **104/104 verticales**.

La série va de `IMG_1250.MOV` à `IMG_1355.MOV`, avec deux numéros absents de l’archive : `IMG_1287.MOV` et `IMG_1332.MOV`.

Cette homogénéité est un avantage réel pour un usage mobile. Elle devient une contrainte forte pour les grands cadrages desktop : un hero panoramique imposerait recadrage, juxtaposition, arrière-plan abstrait ou nouvel asset horizontal.

### Planches locales hors Git

L’audit a produit :

- **18 planches de triage**, avec 3 frames par rush pour les 104 fichiers ;
- **29 planches détaillées**, avec 12 frames timecodées par rush présélectionné ;
- les inventaires techniques JSON et CSV associés.

Une archive locale de consultation, `.local/asset-audit/LEVOIS_ASSET_AUDIT_CONTACT_SHEETS.zip`, regroupe les 47 planches, le CSV technique et un mode d’emploi, sans aucun fichier vidéo. Taille : `19 573 741` octets ; SHA-256 : `8C93964CD3349BF7AAD71D9F7F34FD3B8B5CBBF296E38DA47F672E49A2D02BF0`.

Ces éléments sont conservés uniquement dans `.local/asset-audit/`. Ils ne sont ni des livrables publics, ni une sélection de publication.

Le mode d’emploi inclus dans le ZIP relie chacune des 29 planches détaillées à un mini-commentaire visuel, une fenêtre de travail et les principales vigilances. La matrice versionnée fournit le même contexte pour les 104 rushes sans embarquer les images.

### Grandes familles de rushes

| Série approximative | Matière observée | Potentiel | Vigilance principale |
| --- | --- | --- | --- |
| `IMG_1250`–`IMG_1256` | Hôtel de Ville et place de Lèves | preuve locale, ouverture calme, repère civique | signalétique visible, rendu parfois descriptif |
| `IMG_1257`–`IMG_1260` | commerces et enseignes | contexte urbain ponctuel | logos, marques, faible intemporalité |
| `IMG_1265`–`IMG_1266` | panneaux et histoire locale | ponctuation éditoriale | texte, signalétique, rendu informatif plutôt que premium |
| `IMG_1268`–`IMG_1280` | moulin, eau, passerelles, voie verte | texture, parcours, projection, respiration | passants ou façades selon les plans |
| `IMG_1281`–`IMG_1286` | viaduc, arches, arbres, route | meilleure matière hero/transition ; notion de lignes et de lecture | véhicules et plaques sur certains rushes |
| `IMG_1288`–`IMG_1334` | centre de Chartres, gare, cathédrale | mouvement, connexion, preuve territoriale | carte postale, passants, enseignes, identité trop touristique |
| `IMG_1344`–`IMG_1347` | bâtiments civiques et voirie | texture ou repère secondaire | qualité inégale, véhicules, plaques et signalétique |
| `IMG_1348`–`IMG_1355` | école, rues et résidentiel | vendeur, quartier, environnement | enfants, plaques, adresses et maisons identifiables |

## Meilleures candidates

Les fenêtres suivantes sont des points de montage à contrôler, pas des extraits autorisés.

La classification emploie exclusivement les quatre niveaux demandés : **très utile**, **utile sous conditions**, **exploitable pour textures seulement**, **à écarter**. Une classe exprime le potentiel créatif ; les contrôles de droit, de personne, de plaque ou de marque restent indiqués séparément et peuvent toujours interdire la publication.

| Rush | Fenêtre indicative | Lecture possible | Classement provisoire | Conditions |
| --- | --- | --- | --- | --- |
| `IMG_1281.MOV` | ~00:02–00:10 | viaduc, lignes, profondeur, nature | **très utile** — hero mobile, territoire, texture | vérifier stabilité complète et signalétique au recadrage |
| `IMG_1250.MOV` | ~00:00–00:06 | Hôtel de Ville et place de Lèves | **très utile** — preuve locale | assumer la signalétique ; éviter un rendu institutionnel |
| `IMG_1275.MOV` | ~00:00–00:07 | moulin, rivière et venelle | **très utile** — territoire, parcours, texture | vérifier propriétés et signalétique visibles |
| `IMG_1276.MOV` | ~00:00–00:08 | eau, moulin, végétation | **très utile** — respiration et texture | vérifier les silhouettes lointaines et couper avant le contre-jour |
| `IMG_1280.MOV` | ~00:00–00:08 | rivière, saule et pont | **très utile** — territoire et transition | couper avant la signalisation routière |
| `IMG_1291.MOV` | ~00:00–00:06 | allée de platanes | **très utile** — profondeur et matière végétale | couper avant l’arrivée d’une personne |
| `IMG_1294.MOV` | ~00:08–00:12 | grande place et cathédrale en repère | **très utile** — territoire | vérifier personnes, véhicules et plaques ; éviter le registre carte postale |
| `IMG_1295.MOV` | ~00:03–00:08 | place plus dégagée et cathédrale | **très utile** — repère territorial | mêmes contrôles et rôle secondaire seulement |
| `IMG_1321.MOV` | ~00:00–00:04 | axe piéton avec profondeur vers la cathédrale | **très utile** — rue et territoire | personnes et enseignes à vérifier |
| `IMG_1326.MOV` | ~00:02–00:09 | façade de la cathédrale | **très utile** — repère patrimonial | petit train, signalétique et passants ; ne pas en faire le langage principal |
| `IMG_1327.MOV` | ~00:00–00:04 | cathédrale puis place | **très utile** — patrimoine | couper avant les personnes plus proches |
| `IMG_1328.MOV` | ~00:00–00:03 | cathédrale et parvis | **très utile** — alternative patrimoniale | personnes, petit train et signalétique |
| `IMG_1284.MOV` | ~00:00–00:07 | arches et déplacement du regard | **utile sous conditions** — transition | couper avant l’intersection générique |
| `IMG_1271.MOV` | ~00:06–00:08 | entrée de voie verte | **utile sous conditions** — parcours acheteur | fenêtre courte et signalétique visible |
| `IMG_1302.MOV` | ~00:01–00:08 | passerelle, rails et cathédrale | **utile sous conditions** — mobilité et signaux | netteté faible, infrastructure et signalétique |
| `IMG_1304.MOV` | ~00:00–00:04 | fontaines urbaines | **utile sous conditions** — matière urbaine | personnes, dont des enfants possibles, enseignes et barrières ; préférer un autre plan si le recadrage ne suffit pas |
| `IMG_1353.MOV` | — | maison, portail et voie résidentielle | **à écarter** | maison privée et contexte trop précisément identifiable |

### Classement par usage créatif

**Hero potentiel**

- `IMG_1281` en priorité pour ses lignes et sa profondeur ;
- `IMG_1250` si le hero recherche une preuve explicite de Lèves ;
- `IMG_1276` ou `IMG_1280` pour une version plus sensible et moins institutionnelle ;
- `IMG_1294`, `IMG_1295` et `IMG_1326`–`IMG_1328` uniquement comme repères patrimoniaux contrôlés, jamais comme identité complète.

Ces plans sont naturellement adaptés au mobile. Aucun ne résout à lui seul un hero desktop panoramique.

**Territoire / Chartres et Lèves**

- `IMG_1250`, `IMG_1275`, `IMG_1276`, `IMG_1280` et `IMG_1281` pour Lèves et ses continuités ;
- `IMG_1281`, `IMG_1284`, `IMG_1290` pour les lignes, les parcours et le paysage vécu ;
- `IMG_1302` pour la connexion au bassin chartrain, à utiliser sans transformer Chartres en destination touristique.

**Parcours acheteur**

- `IMG_1271` : franchir un seuil et avancer ;
- `IMG_1290` : profondeur d’une rue et projection ;
- `IMG_1302` : déplacement et périmètre, sous réserve d’un traitement sobre.

Ces rushes évoquent un cheminement ; ils ne montrent ni comparaison de biens, ni décision humaine. Une captation complémentaire reste nécessaire.

**Parcours vendeur**

- `IMG_1277` sur sa première moitié ;
- `IMG_1275` seulement après vérification des façades et du contexte ;
- détails de rue ou de seuil issus des séries résidentielles uniquement si aucune adresse, plaque ou maison singulière ne reste identifiable.

**Annonce en ligne / signaux**

- `IMG_1302` peut suggérer les flux et la mise en relation ;
- `IMG_1280` ou `IMG_1282` peuvent fournir des lignes de transition ;
- aucun rush ne montre proprement le téléphone, l’écran, l’attente ou la lecture d’une annonce.

**Passage vers Mouaad**

- **aucune candidate suffisante**. Les rushes ne montrent pas Mouaad et ne peuvent pas remplacer un portrait en situation ou une scène d’écoute.

**Texture / transition**

- eau et reflets : `IMG_1276`, `IMG_1280` ;
- pierre, arches et lignes : `IMG_1281`, `IMG_1284` ;
- voie et feuillage : `IMG_1271`, `IMG_1290`.

**À écarter**

- scènes dominées par enseignes ou logos (`IMG_1257`–`IMG_1260`) sauf justification éditoriale précise ;
- scènes très touristiques où la cathédrale devient le seul sujet ;
- foule ou personnes identifiables, notamment `IMG_1304` ;
- écoles, enfants, plaques, adresses ou domiciles reconnaissables ;
- `IMG_1353` et tout équivalent cadrant une maison privée comme sujet principal ;
- rushes flous, trop courts, instables ou sans fonction narrative, même s’ils sont locaux.

## Droits, marques et confidentialité

Avant tout export web, chaque candidat devra passer une fiche de validation comprenant au minimum : auteur/capteur, date, propriété du fichier source, périmètre des droits accordés, personnes reconnaissables, mineurs, plaques, adresses, marques, œuvres ou lieux soumis à conditions, durée d’utilisation et possibilité de recadrage.

Règles de prudence retenues pour la suite :

- pas de publication d’une personne reconnaissable sans base et autorisation établies ;
- exclusion par défaut des mineurs ;
- masquage ou sélection d’un autre plan si une plaque, une adresse ou un document est lisible ;
- pas de commerce ou logo comme sujet central sans raison et vérification ;
- pas de maison privée isolée donnant l’impression d’un dossier réel ;
- pas de crédit visible dans le hero : si une licence impose une attribution, celle-ci doit être accessible proprement dans le dispositif éditorial ;
- aucune capture Google Maps ou Street View ;
- conservation hors Git des originaux et des frames tant qu’une décision explicite n’est pas prise.

## Routes créatives réalistes

### Route A — immersion locale réelle

Le site s’appuie principalement sur les rushes de Lèves et Chartres, des détails de pierre, d’eau, de rues et sur une future présence de Mouaad.

**Avantages :** confiance, ancrage immédiat, authenticité, distance nette avec les templates immobiliers.

**Risques :** rushes exclusivement verticaux, lumière et stabilité inégales, rendu documentaire ou touristique, dépendance à un shooting humain encore absent.

Cette route est crédible après une captation complémentaire, mais fragile si les vidéos existantes doivent tout porter.

### Route B — lecture abstraite du territoire

Le site privilégie lignes, cartes abstraites, repères, données, cadrages et mouvements contrôlés. Les rushes deviennent des textures rares.

**Avantages :** système plus maîtrisable, premium et cohérent avec l’idée de lecture ; moins dépendant de photos parfaites ; bonne continuité entre parcours.

**Risques :** froideur, distance avec les particuliers, effet produit SaaS ou poster graphique si la présence humaine et le réel local s’effacent.

Cette route répond au concept LEVOIS, mais ne suffit pas à construire la confiance seule.

### Route C — hybride recommandée

Quelques fragments réels forts — viaduc, voie, eau, Lèves — apportent la preuve. Un langage abstrait rend les signaux lisibles. Mouaad devient le point d’ancrage humain dans des images nouvelles, sobres et réelles.

**Avantages :** équilibre entre authenticité, contrôle premium et méthode ; résilience si un rush est écarté ; même univers possible sur tous les parcours sans uniformité.

**Risques :** demande une direction de montage stricte et une mini séance humaine ; le système graphique ne doit ni masquer le réel ni surcharger les images.

**Recommandation : route C**, sous trois conditions :

1. valider juridiquement une sélection courte de rushes ;
2. produire quelques plans horizontaux et verticaux de Mouaad et de situations de lecture ;
3. tester les images dans une composition avant de décider de leur place définitive.

## Besoins non couverts et conclusion

Les rushes couvrent correctement : territoire, mouvement, matière minérale et végétale, repères de Lèves et certains passages de Chartres. Ils couvrent partiellement : projection acheteur, regard extérieur vendeur et notion de flux.

Ils ne couvrent pas :

- Mouaad en situation réelle ;
- l’écoute et la relation ;
- un rendez-vous sobre ;
- la lecture d’une annonce ou d’une carte sans donnée privée ;
- des gestes de comparaison et de décision ;
- un hero horizontal conçu pour desktop ;
- des plans résidentiels neutres assurément non identifiants.

Conclusion : **vidéos utiles mais shooting complémentaire nécessaire**. Il ne faut ni jeter cette matière locale, ni lui demander de résoudre seule l’expérience publique. La prochaine décision ne doit porter que sur la sélection des rushes à contrôler et sur la courte liste de plans à produire ; aucune maquette ou propagation visuelle ne découle automatiquement de cet audit.
