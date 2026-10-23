# LEVOIS V7 sur les sources complètes fournies pour 9d1d955

## État de la livraison
La nouvelle identité est intégrée à l’archive levois-site-9d1d955-sources.zip fournie par Mouaad. Les 42 routes sont conservées, dont /vendre-et-acheter, /reprendre et /lecture. Le code de ces parcours est conservé ; leur présentation utilise la V7.
La correspondance du nom de l’archive avec le commit de production provient de la remise utilisateur, pas d’un commit Git vérifiable dans cette archive.
Aucune mise en ligne n’a été effectuée depuis cet environnement. Cloudflare n’y est pas authentifié.
Cette livraison remplace la première livraison V7 réalisée à partir d’un ZIP plus ancien/incomplet. Ne pas déployer le premier ZIP.

## Ce qui a changé
- Accueil V7 de référence, ses images, sa vidéo, ses polices et son comportement interactif.
- En-tête/pied de page communs ; liens vers la lecture, la reprise, la transition et préférences de confidentialité conservés.
- Présentation des pages publiques et des parcours : ivoire, marine, orange, grandes typographies et angles arrondis, cartes et formulaires cohérents.
- Les composants internes du cockpit et leur mise en page sont préservés : cette livraison harmonise le site public, sans refonte de l’outil de travail privé.
- Schémas et carte locale : correction d’une règle de taille d’icônes qui réduisait aussi les graphiques ; couleurs des graphiques harmonisées.
- Transition CSS expérimentale entre pages désactivée après une erreur navigateur ; animations internes de la V7 conservées.
- Les fonctions serveur, données, logique des parcours, scripts métier, migrations, configurations Cloudflare et dépendances restent identiques à l’archive reçue.

## Vérifications réalisées
- Compilation : 42 pages.
- Tests unitaires/API locaux : 286 tests dans 25 fichiers, tous réussis.
- 19 routes publiques à 1440, 390 et 320 px : pas de débordement horizontal, d’image cassée ou d’erreur JavaScript détecté. Accueil et graphiques revérifiés après les dernières corrections.
- Huit scénarios acheteur/transition existants réussis : parcours, lecture sans budget, réponses exclusives, correction budget/secteur/surface, continuité de session, reprise et transition.
- Dix scénarios de contrat public réussis sur le build : envoi de la synthèse approuvée, reprise idempotente, choix volontaire de coordonnées, export, réimport protégé, code de reprise à huit chiffres, erreurs HTTP, stockage refusé, protection contre l’exécution d’un fichier importé.
- Menu mobile, Échap, onglets au clic et au clavier, choix de confidentialité, validation du formulaire et réponses simulées 503/200 vérifiés.
- Tests navigateur exécutés avec API simulée : aucune livraison réelle d’email et aucun service de production testé. Le contrôle interne parseContext importé via /src dans un test de développement a été omis dans son adaptation au build ; les assertions de reprise en navigateur ont été conservées, et le domaine est testé par Vitest.
- Une assertion de test a été rendue insensible à la casse pour accepter les titres affichés en majuscules. Les contenus des questions sont inchangés.
Les rapports JSON sont dans verification-v7. Les anciens rapports datés dans docs restent historiques.

## Utilisation locale
Node.js >= 22.12.0.

    npm ci
    npm test
    npm run build
    npm run preview

La prévisualisation Astro sert les pages. Les fonctions Cloudflare ne sont pas reproduites par npm run preview. Voir les scripts de développement existants pour les fonctions.
Aucun dossier node_modules, dist, cache ou secret privé n’est inclus. La clé publique d’ingestion analytique déjà présente reste une configuration publique du navigateur, avec consentement conservé.

## Publication
Suivre PUBLIER_AVEC_CODEX_LOCAL.md. Préserver les réglages et bindings déjà actifs sur Cloudflare. Ce dossier n’autorise aucune suppression de base, aucune migration, aucun changement de domaine ou de secret.
