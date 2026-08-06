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
3. **Preuve locale immédiate** — photographie réelle, repères DVF sourcés et limites dans le premier écran.
4. **Preuve locale** — données DVF sourcées, période, territoire et limites.
5. **Frontière franche** — le site dit ce que les chiffres et le diagnostic automatique ne peuvent pas conclure.
6. **Méthode** — constater, interpréter, comparer les scénarios puis décider.
7. **Application au projet** — première lecture acheteur ou propriétaire avant toute coordonnée.
8. **Passage à l’humain** — Mouaad confronte la synthèse au terrain ; le client garde la décision.

Une section ne doit rester que si elle remplit l’un de ces rôles. Les galeries, cartes de ressources ou profils exclusivement vendeurs appartiennent aux parcours secondaires tant qu’un équivalent acheteur n’existe pas.

## 5. Framework de contenu

### Cible éditoriale vidéo prioritaire

La ligne vidéo vise d’abord les propriétaires situés **avant la mise en vente** : ceux qui pensent vendre dans quelques mois et ceux qui ne passeront à l’action qu’après un changement de vie ou une contrainte imprévue. LEVOIS doit être la référence déjà connue, utile et crédible lorsque la décision devient concrète.

Cette priorité modifie la nature des contenus :

- préparer plutôt que récupérer une commercialisation déjà abîmée ;
- expliquer les décisions qui se prennent avant l’annonce, le prix et les premières visites ;
- créer des repères mémorisables et enregistrables, pas une urgence commerciale ;
- proposer comme CTA une ressource, une vérification ou un outil utile maintenant, même si la vente n’aura lieu que plus tard ;
- installer le repère propriétaire comme réflexe d’anticipation : connaître un premier positionnement local et disposer d'un contact de proximité avant qu'un calendrier subi réduise le temps de décision ;
- ne jamais instrumentaliser une succession, une séparation, une mutation professionnelle, une difficulté financière ou tout autre événement déclencheur.

Les acheteurs restent présents dans la ligne éditoriale et dans le produit : leur lecture du marché rend les contenus vendeurs plus solides et entretient la boucle bilatérale LEVOIS. La priorité d’acquisition vidéo ne transforme donc pas le site en parcours exclusivement vendeur.

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
- La transition scroll-driven du héros (couleur → monochrome et montée des preuves) reste progressive sur ordinateur comme sur mobile ; `prefers-reduced-motion` reçoit une version statique complète.
- Dans les formulaires, un choix unique fait avancer le parcours automatiquement après un retour visuel bref. Une validation reste obligatoire pour les choix multiples, les champs saisis, la relecture et la transmission.
- Les animations restent courtes, déterministes et informatives.
- Les liens d’ancre compensent le header collant.
- Toutes les pages publiques partagent le même en-tête, le même pied de page, les mêmes typographies et les mêmes tokens LEVOIS V2 ; les parcours longs conservent seulement leurs besoins fonctionnels spécifiques.

## 9. Critères de publication

Une surface est publiable lorsque :

- son parcours principal aboutit à une route existante ;
- sa promesse est soutenue par une preuve ou formulée comme une hypothèse ;
- ordinateur, mobile, clavier et réduction des mouvements ont été vérifiés ;
- le build et les tests passent ;
- aucune donnée personnelle ou clé d’API n’est exposée ;
- les mentions légales, la confidentialité et le cadre SAFTI restent accessibles.

## 10. État d’intégration

La page d’accueil V2, les routes QR et les parcours acheteur/vendeur sont intégrés dans le même shell visuel. Chaque environnement de production doit relier `/api/recherche` à la base D1 `RECHERCHE_DB` et exposer `/api/lead` via Cloudflare Pages Functions. Resend est la voie de notification principale ; le Formspree historique assure le secours lorsqu’aucune clé Resend n’est configurée.
