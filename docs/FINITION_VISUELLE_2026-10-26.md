# LEVOIS — finition visuelle du 26 octobre 2026

La structure éditoriale et les parcours du commit `453dfac` sont conservés. Cette passe concerne la matière, les couleurs, les cartes et la photographie locale.

## Ajustements

- Papier chaud `#F7F6F2` sur le fond et le contenu principal ; titres `#141413`, corps `#3C3D3A`, repères secondaires `#5A5D58`.
- Cartes des angles morts, SAFTI Connect/recrutement et articles sur fond blanc, rayon 12 px, bordure `rgba(20,20,20,.05)` et ombre `0 4px 24px -2px rgba(20,20,20,.04)`.
- Actions secondaires blanches avec bordure discrète. La porte « Évaluer ma vente » reste encre et s’éclaircit vers `#2C2D29` au survol, en 180 ms. Le mouvement réduit reste respecté.
- Photographies sans filtre ni réduction d’opacité. La vue locale passe au format d’affichage 16:10 ; l’ancienne miniature et sa légende sont retirées de l’accueil.
- Métadonnées des articles alignées sur deux lignes dans la grille tablette, pour maintenir les titres au même niveau.

## Photo et provenance

La photographie représente le pont des Minimes, le moulin de Ponceau et les bords de l’Eure à Chartres. Auteur : **Patrick Giraud** ; prise de vue : 28 mai 2005 ; original : 3008 × 2000 px.

[Source Wikimedia Commons](https://commons.wikimedia.org/wiki/File:France_Eure_et_Loir_Chartres_Bords_de_l_Eure.jpg), licence choisie parmi celles proposées : [CC BY 2.5](https://creativecommons.org/licenses/by/2.5/). Crédit accessible dans le pied de page vers `/mentions-legales/#credits-photo`, avec auteur, source, licence et transformations. La photographie ne représente pas une vente DVF déterminée.

Les six variantes auto-hébergées, AVIF/WebP en 640, 1000 et 1600 px, totalisent environ **775 Kio**. Le navigateur choisit une seule variante grâce à `picture`, `srcset` et `sizes`. La variante AVIF de 640 px pèse environ 37 Kio. Aucun original lourd n’est ajouté au site ; couleurs et proportions originales des fichiers conservées, recadrage uniquement à l’affichage.

## Vérification

- Compilation : **51 pages**.
- Vérification Astro : **0 erreur, 0 avertissement**, 33 indications existantes.
- **32 contrôles navigateur réussis**, dont 320/375/768/1440 px, reflow équivalent à 200 %, clavier, réduction de mouvement et accès sans JavaScript. Les parcours de capture sont rejoués avec des réponses API simulées.
- **4 analyses Axe sans violation détectée** dans les écrans contrôlés.
- Comparaison du HTML avant/après : contenu d’accueil identique en dehors du bloc média demandé.
- Revue visuelle indépendante : aucun blocage. Son unique ajustement mineur, l’alignement tablette des métadonnées d’articles, est appliqué et contrôlé séparément.

Les contrôles ne constituent pas une certification d’accessibilité ni une mesure d’augmentation de conversion. Aucune logique de diagnostic, donnée DVF, configuration de déploiement, dépendance ou secret n’est modifié.

Preuves locales ignorées par Git : `artifacts/warm-20261026/` (avant, batch, confirmation et revue finale). Références visuelles mises à jour : `DESIGN.md` et `.impeccable/design.json`.
