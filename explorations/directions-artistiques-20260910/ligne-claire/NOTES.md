# La Ligne claire

## Idée

Une lecture éditoriale annotée. La valeur n'est pas installée dans une série de cartes ; elle se lit dans la relation entre une question, un choix, un fait et sa glose. La marge matérialise le recul nécessaire à la décision.

Planche créée avec l'outil imagegen intégré et inspectée avant le code : `../concepts/ligne-claire.png`. Prompt exact : `../concepts/ligne-claire-prompt.md`. La planche est une intention de composition ; le texte et les comportements du CONTRAT priment sur les approximations de génération.

## Système extrait avant implémentation

- Papier très clair #f7f5ef, encre #202c33, vermillon #ae412c, filets gris #b2b6b4. Pas de dégradé, ombre ou voile.
- Georgia pour les titres et gloses ; Public Sans local pour le corps et les commandes. Le corps serif apparu dans certaines parties de la planche est corrigé selon le contrat.
- Titres mobiles 40–51 px (36–44 px à 320), desktop jusqu'à 93 px ; corps mobile 14–15 px, desktop 15–18 px. Les limites restent lisibles et auprès de l'interprétation.
- Marges mobiles 24 px, ramenées à 20 px à 320 ; grandes gouttières sur desktop. Le desktop oppose question à gauche et comparaison/glose à droite. La lecture distribue les quatre constats puis prochaine décision et relais.
- Trois familles seulement : ligne ouverte de choix, comparaison en colonnes à filets, fragment numéroté avec annotation. Aucun conteneur de carte, aucun tableau de bord.
- Flèches SVG sobres partagées et véritables contrôles à focus visible. Les cercles des choix indiquent un état, pas une notation.
- Logo réel inchangé. Portrait réel de Mouaad uniquement au relais humain, sans filtre ni retouche. Images rares et légendées. La planche ne fournit pas de portrait ; aucun portrait généré n'est employé.

## Intention d'interaction

La sélection déplace la petite trace vermillon sur l'attribut à examiner dans les deux logements fictifs. Une glose relie usage et conséquence. « Voir ce que cette réponse change » dirige le regard et le focus vers un raisonnement déjà affiché ; aucun résultat n'est retenu. La correction revient à la question et met la lecture à jour, sans faux historique ou animation d'attente. Les transitions sont très brèves et supprimées avec mouvement réduit.

## Force / limite / risque

**Force :** forte personnalité typographique, précision, maîtrise et respiration ; texte et décision ont la première place. Le système reste identifiable sans image.

**Limite :** moins immédiatement figuratif que les deux autres directions ; il demande une rédaction courte et hiérarchisée. L'absence de photographies en accueil est assumée.

**Risque :** une multiplication d'annotations ferait dériver l'expérience vers un dossier intimidant. Une seule conséquence dominante à la fois, pas de long appareil de notes en premier écran. Les grandes lettres ne doivent pas repousser la première valeur hors du mobile.

## Déploiement du langage à plusieurs expériences

Les cinq fragments de lecture et les gloses se réemploient pour vendeur, acquéreur et transition sans changer de grammaire visuelle. Les marges accueillent auteur, limite ou prochaine vérification ; elles n'inventent pas une preuve.

Un lien vidéo ouvre directement sa question avec sa première distinction visible. La continuité se tient dans les mots de la promesse, la hiérarchie et le filet d'annotation : aucun détour institutionnel ni habillage spectaculaire. Le mode sans retour précis est aussi utile et visuellement abouti qu'une réponse plus déterminée.

## Écarts intentionnels à la planche

Le prototype utilise le logo réel, le corps Public Sans, les textes métier du runtime et le portrait réel au moment du relais. Il retire les faux marqueurs de progression « 03/05 », les liens non demandés, toute affirmation générée sur des critères essentiels ou des opportunités. La signature manquante du petit mobile de la planche est bien présente dans le prototype, suivant le contrat. Les trois suites de contact ouvrent une simulation explicite sans transmission ; aucun champ de coordonnées n'est conservé.

## Vérification

Le parent mène la recette navigateur commune 320 / 390 / 1440. L'auteur a inspecté avec `view_image` la planche ainsi que les captures accueil390/320, recherche390-complet/320/1440, visites390-complet, lecture390-complet/1440. Le rapport `../preuves/ligne-claire-verification.json` ne signalait aucune erreur, défaillance, sortie réseau ou anomalie axe pour ces états. Le parent a aussi confirmé dans IAB la correction calme → proches et le focus vers la conséquence.

| Point de fidélité | Concept et preuve | Décision / correction |
|---|---|---|
| Papier, encre et vermillon | Comparaison directe planche / captures390 et1440 | Palette et absence de dégradé conservées. |
| Typographie | Georgia et italique dominants ; contrôles Public Sans dans les captures | Le corps suit le contrat, sans copier les approximations serif de la planche. |
| Composition de l'accueil | La planche sépare la promesse italique ; première capture390 collait « Des » à « immobilier. » | Retour à la ligne imposé avant la phrase italique. |
| Question et glose desktop | Recherche1440 : deux champs ouverts, comparaison A/B, annotation sous les faits | Relation spatiale conservée ; aucune carte ajoutée. |
| Première valeur mobile | La conséquence était après les deux spécimens ; cela la repoussait loin sous le premier écran | Sur mobile, la glose précède désormais les deux logements, sans cacher la comparaison ni modifier le texte ; sur desktop, elle reste sous les faits. |
| Mobile étroit | Accueil320 et recherche320 : texte et contrôles dans280px utiles | Aucun débordement constaté ; petites commandes logo/nav/reset portées à44px. |
| Ordre de la lecture | Lecture390-complet : quatre fragments, prochaine décision, portrait puis suites | Ordre conforme ; tous les paragraphes restent présents et lisibles. |
| Portrait et image | Lecture390/1440 : portrait réel non filtré au point de responsabilité | Écart voulu à la planche sans portrait ; pas de faux accompagnateur. |
| Copie initiale | Les H1 du rapport sont exactement ceux du contrat | Aucun nouveau titre métier inventé ; suppressions des marqueurs fictifs03/05 et liens hors périmètre documentées ci-dessus. |
| Barre de statut hors écran | Barre vide visible dans les premières captures longues à la limite du viewport | Signalé au parent pour correction du socle commun ; aucune règle locale ne neutralise cette correction. |

La planche est une composition composite1184×1328, non un viewport unique. Le contrôle natif porte donc sur ses écrans conceptuels, puis sur les dimensions réelles320/390/1440 ; il ne prétend pas superposer pixel à pixel l'ensemble de la planche. Les paragraphes métier plus complets produisent davantage de défilement que le texte généré abrégé. Aucun contenu essentiel n'est supprimé pour reproduire artificiellement la hauteur de l'image.

**Contrôle final de fidélité, 10 septembre 2026 :** nouvelle inspection `view_image` de la planche et des dernières captures accueil 390, recherche 390 complète / 320 et lecture 1440. La phrase italique retrouve sa ligne propre ; la conséquence mobile commence dans le premier viewport ; le comparatif reste entier en dessous ; la barre sombre vide a disparu après correction du socle ; la capture desktop retrouve le haut de page. Le rapport final de 09:37 UTC ne relève aucune erreur, anomalie axe, petite cible signalée ou transmission sortante. La réalisation est vérifiée fidèle à la direction de composition, avec les écarts de contenu et d'ordre mobile explicitement justifiés dans ce document. Aucun écart matériel non traité dans les captures inspectées.
