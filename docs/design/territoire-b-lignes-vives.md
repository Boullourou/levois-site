# Territoire B — Lignes vives

## Idée centrale

La situation immobilière devient un champ de relations lisible : chaque réponse déplace un repère explicitement nommé, sans produire de score ni masquer l’incertitude.

## Monde visuel

- **Craie** `#f5f2e8` : surface de travail et respiration.
- **Aubergine** `#32103f` : structure, texte, champs de décision.
- **Fuchsia** `#e6268b` : déplacement, tension ou point à examiner.
- **Jaune acide** `#e8ff3f` : action, réponse sélectionnée et repère abouti.
- **Lilas** `#d8c5e1` : texte secondaire sur aubergine.

Les surfaces sont plates, bord à bord et reliées par des rails de 1 px. Il n’existe ni carte générique, ni ombre, ni verre, ni gradient. La profondeur provient des adjacences, du changement d’échelle typographique et du déplacement des lignes.

## Typographie

Archivo Black porte les titres de thèse et les mots qui doivent rester en mémoire. Public Sans porte les questions, explications, données et contrôles. Les chiffres utilisent des formes tabulaires ; aucune monospace décorative n’est employée.

## Composition par surface

### Accueil

La promesse validée occupe sept colonnes. Un champ de relations explicite — situation, options, vérifications — occupe les cinq autres. Les quatre entrées déplacent ce champ au survol ou au focus, sans cacher la copie. Les sections suivantes fonctionnent comme des rails pleine largeur, puis une donnée locale devient un intervalle et non un chiffre héro.

### `/ma-recherche`

Le parcours garde un rail permanent des sept fonctions métier. Le démonstrateur expose cinq états : ouverture, question, traducteur, arbitrage et première lecture. Les choix reconfigurent la formulation et les lignes. La restitution assemble quatre régions de page contiguës, avec leurs sources et leurs possibilités de correction.

### `/votre-rue`

Le rayon s’élargit visiblement de 250 m à 1 km jusqu’au seuil de 20 ventes. Le résultat de démonstration emploie l’adresse d’exemple existante et le jeu DVF livré : 81 ventes de maisons, du 8 janvier 2021 au 19 décembre 2025, dans un rayon de 1 km ; quartiles 2 069 et 2 785 €/m², médiane 2 388 €/m². La limite est placée au même niveau que l’intervalle.

### Ressource pilote

`/ressources/annonce-vue-peu-de-contacts` devient un entonnoir prudent. La personne localise un décrochage possible puis reçoit toujours cinq sorties : observé, interprétation possible, autres explications, information manquante et prochaine vérification. Aucun verdict automatique n’est produit.

## Mouvement

Le mouvement appartient aux relations : un nœud change de position, une ligne s’allonge, un point de rupture se déplace. Le contenu est présent avant l’animation. Avec `prefers-reduced-motion`, tous les états utiles restent complets et statiques.

## Responsive et accessibilité

- Cible desktop : 1440 px ; cible mobile : 390 px.
- Navigation persistante puis menu explicite sous 1080 px.
- Cibles de contrôle d’au moins 44 px.
- État actif porté par texte, contraste et géométrie, jamais par la couleur seule.
- Démonstrateurs navigables au clavier ; onglets avec flèches, début et fin.
- Pas de contenu critique réservé au survol ou au mouvement.

## Assets

Aucun asset généré et aucune photographie. La piste prouve sa force uniquement par le code, les données existantes, la composition et la typographie. Elle n’introduit donc aucun faux portrait, faux bien, faux client ou faux témoignage.

## Limites honnêtes du démonstrateur

- `/ma-recherche` démontre les états et la grammaire d’interaction, pas l’implémentation fonctionnelle complète validée en Phase 3.
- Le résultat local supérieur est un état de démonstration prérempli ; l’outil existant reste disponible plus bas sur la même route.
- La police de titrage reste Archivo Black, déjà livrée dans le dépôt. Un travail typographique propriétaire pourrait renforcer le territoire après son choix, pas avant.
- Les trois territoires doivent rester séparés jusqu’au choix de Mouaad ; aucun élément de cette piste n’est une recommandation de convergence.
