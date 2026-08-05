# Framework LEVOIS — site et parcours

## 1. Rôle du site

Le site LEVOIS transforme une audience locale en décisions mieux préparées, puis en relations entrantes choisies. Il ne commence pas par demander des coordonnées : il commence par rendre une situation plus lisible.

La séquence de référence est toujours :

**faits disponibles → perception du marché → décision à prendre → accompagnement humain facultatif**

## 2. Deux côtés, une seule boucle

Acheteurs et vendeurs ont la même importance éditoriale et fonctionnelle.

- Une recherche acheteur mieux définie renseigne ce que le marché attend réellement.
- Une vente mieux positionnée produit une offre plus pertinente pour les acheteurs.
- Les deux parcours convergent vers Mouaad seulement après une première restitution utile.

Le site ne présente jamais le vendeur comme le parcours principal et l’acheteur comme une simple preuve commerciale.

## 3. Architecture des entrées

| Intention | Entrée | Valeur délivrée avant contact | Suite possible |
| --- | --- | --- | --- |
| Comprendre une recherche | `/ma-recherche` | Synthèse des critères, compromis et niveau de préparation | Échange avec Mouaad sur demande |
| Lire les ventes autour d’une adresse | `/votre-rue` | Transactions DVF et limites de lecture | Situer la vente ou approfondir |
| Situer une vente en cours | `/situer-ma-vente` | Lecture structurée des signaux disponibles | Ressource ou échange sur demande |
| Continuer depuis la carte de visite | `/carte` | Présentation et orientation courte | Choix du parcours pertinent |

Les URLs imprimées ou déjà diffusées restent stables.

## 4. Architecture de la page d’accueil

1. **Promesse** — « Rendre la valeur lisible. »
2. **Double entrée** — acheteur et vendeur au même niveau.
3. **Mécanisme** — ce que le bien est, ce que le marché perçoit, ce que la personne décide.
4. **Boucle de marché** — une recherche mieux définie et une vente mieux positionnée.
5. **Méthode** — constater, interpréter, décider.
6. **Preuve locale** — données DVF sourcées, période, territoire et limites.
7. **Passage à l’humain** — Mouaad intervient pour arbitrer, négocier et organiser la suite.
8. **Double sortie** — reprise des deux parcours sans pression commerciale.

Une section ne doit rester que si elle remplit l’un de ces rôles. Les galeries, cartes de ressources ou profils exclusivement vendeurs appartiennent aux parcours secondaires tant qu’un équivalent acheteur n’existe pas.

## 5. Framework de contenu

Chaque contenu social ou éditorial suit une structure réutilisable :

1. **Tension vérifiable** — une croyance, une erreur de lecture ou une question locale précise.
2. **Fait** — ce qui est réellement observable et sourçable.
3. **Écart** — ce que le marché peut percevoir différemment.
4. **Conséquence** — pourquoi cet écart change une décision.
5. **Action utile** — ce que la personne peut vérifier ou préparer maintenant.
6. **CTA doux** — une ressource ou un outil LEVOIS qui prolonge la valeur, sans exiger un contact.

Le hook peut être fort, mais il ne doit jamais dépasser la force de la preuve disponible.

## 6. Règles de preuve

- Ne jamais inventer un prix, une statistique, un délai, un témoignage ou un résultat.
- Distinguer explicitement **observation**, **interprétation** et **conclusion**.
- Afficher la source, la période et la limite de toute donnée locale.
- Une transaction voisine est un repère, pas une estimation.
- La DVF décrit des ventes passées ; elle ne prouve pas la demande actuelle et n’est pas exhaustive.
- Un export Yanport isolé ne prouve ni le prix final ni l’historique complet d’une annonce.
- Les informations personnelles ne sont transmises à Mouaad qu’après une action volontaire et explicite.

## 7. Données et automatisation

### Sources admises

- DVF public pour les mutations passées ;
- exports Yanport manuels pour les annonces et leurs changements entre deux instantanés ;
- outils SAFTI/Oméga dans leur cadre autorisé ;
- réponses fournies volontairement dans les parcours LEVOIS.

### Pipeline cible

1. Importer et dater la source.
2. Valider le schéma et supprimer les doublons.
3. Séparer les faits bruts des signaux calculés.
4. Générer une restitution compréhensible et ses limites.
5. Enregistrer le consentement avant toute transmission.
6. Mesurer l’origine du parcours, la restitution consultée et la demande volontaire.

L’automatisation prépare la lecture. Elle ne remplace ni l’estimation professionnelle, ni la négociation, ni le jugement humain.

## 8. Comportement de l’interface

- Mobile d’abord, clavier utilisable, objectif WCAG 2.2 AA.
- Aucun contenu essentiel ne dépend du mouvement, de la couleur ou de JavaScript.
- Le récit scroll-driven est un enrichissement réservé aux écrans adaptés ; mobile et `prefers-reduced-motion` reçoivent une version statique complète.
- Les animations restent courtes, déterministes et informatives.
- Les liens d’ancre compensent le header collant.
- Les anciennes pages conservent leur interface tant qu’elles n’ont pas été migrées explicitement vers le système LEVOIS V2.

## 9. Critères de publication

Une surface est publiable lorsque :

- son parcours principal aboutit à une route existante ;
- sa promesse est soutenue par une preuve ou formulée comme une hypothèse ;
- ordinateur, mobile, clavier et réduction des mouvements ont été vérifiés ;
- le build et les tests passent ;
- aucune donnée personnelle ou clé d’API n’est exposée ;
- les mentions légales, la confidentialité et le cadre SAFTI restent accessibles.

## 10. État d’intégration

La page d’accueil V2 et la route canonique acheteur `/ma-recherche` sont intégrées dans la même branche. Chaque environnement de production doit relier la fonction `/api/recherche` à la base D1 `RECHERCHE_DB` et configurer l’envoi Resend avant d’accepter de vraies demandes.
