# LEVOIS — Livraison finale du Plan vivant
10 septembre 2026 · Branche dédiée · Aucune mise en production

## État de la livraison
La cible publique complète est construite dans le seul worktree autorisé. Le Plan vivant est devenu le langage des parcours et des pages publiques. La base auditée reste récupérable dans Git.

La version est prête pour la validation de Mouaad et l’activation de production. **Les nouveaux services distants ne sont pas encore activés** : schéma opérationnel D1, protection Access, paramètres de reprise/CSRF et recette d’envoi. Leur mise en place est préparée et attend le **GO PRODUCTION**. Aucun nouveau chantier applicatif n’est identifié avant cette activation.

Les essais n’ont envoyé aucun message à un prospect et n’ont modifié aucune donnée distante.

## Consulter le résultat
- [Galerie des vingt écrans structurants](../design/cible-20260910/index.html) : dix situations, mobile 390 et desktop 1440, captures longues consultables.
- Site compilé local : http://127.0.0.1:4332
- Site et vraies Functions avec D1 locale : http://127.0.0.1:4333 après npm run dev:experience.
- Sources : npm run dev -- --host 127.0.0.1 --port 4331
- Artefact compilé : npm run build, puis npm run preview -- --host 127.0.0.1 --port 4332

La preview Astro permet de parcourir l’interface. Les transmissions nécessitent Pages Functions ; leur absence y produit une erreur honnête. Le serveur Pages local permet l’enregistrement opérationnel de test et désactive les transports d’e-mail et les secours externes. Une copie ou un code d’accès n’y sont jamais présentés comme réellement envoyés.

## Ce qui a été construit
Trois parcours partagent un même contexte de session, des réponses attribuées et versionnées, une restitution avant coordonnées et quatre suites distinctes.

**Acquéreur** : sept séquences, quotidien et usages avant typologie, priorités/préférences/ouvertures sous condition/exclusions/non-renseigné distincts. La restitution comporte les quatre rubriques validées. Aucune absence ne devient une souplesse. Les questions déjà confirmées sont sautées. Le pont vers le Profil Acquéreur explicite la sémantique réelle du cockpit, sans créer ni fusionner un client.

**Vendeur** : les cinq branches et les 24 questions existantes restent compatibles. Le moteur historique est figé séparément. Les aides excessivement affirmatives ont été corrigées dans la cible. Réflexion, offre, incident et articulation avec un achat enrichissent le parcours sans supprimer les acquis.

**Vendre et acheter** : huit séquences propres, ressources estimées/confirmées, dates souhaitées/contraintes/engagées, intervalle, cumul, dépenses ponctuelles et mensuelles, scénarios conditionnels et repli. La frise et les coûts utilisent la version affichée, y compris dans un ancien résultat ou un export. Aucun financement ou engagement n’est déclaré faisable par l’outil.

**Outils et entrées** : trois micro-expériences interactives, gratuites et sans coordonnées ; registre de sujets extensible sans nouvelle architecture. Google, vidéo, QR et recommandation transportent une origine explicite ; une origine inconnue reste inconnue. Un simple paramètre ne confère jamais un contexte chaud vérifié. La reprise chaude demande un lien individuel et un code à huit chiffres.

**Votre rue** conserve le vrai jeu DVF et ses moteurs géographiques. Les deux questions personnelles produisent désormais leur propre lecture avant coordonnées. Source, période, périmètre, nombre et limites restent visibles. L’accès acquéreur aux ventes historiques est conservé ; le rapport budget/surface n’est plus présenté comme une offre disponible.

**Audit d’annonce** garde son contrat : lien, trois réponses, deux actions. La lecture distingue extraction utile, contenu insuffisant, portail bloquant, panne et limitation technique. Son HTML conservé est réimportable sans inventer une nouvelle extraction.

**Continuité humaine** : export HTML autonome, copie d’e-mail sans dossier commercial, demande de relecture écrite, échange choisi. Les demandes humaines conservent l’aperçu approuvé, les seules coordonnées utiles, le consentement et une référence idempotente. Enregistrement et notification sont distingués. Une réponse HTTP incohérente n’affiche pas une réussite.

L’opérateur privé /cockpit/relectures permet de retrouver la version reçue, d’ajouter une note attribuée, de corriger un contexte sans écrasement silencieux, de préparer/révoquer un accès et de supprimer le dossier. Il complète le cockpit existant ; il ne constitue pas un nouveau CRM.

## Inventaire des routes

| Route | Traitement | Rôle final |
|---|---|---|
| / | Recomposition | Trois projets immédiats, preuve interactive, local séparé, relais humain. |
| /ma-recherche | Reconstruction | Parcours acquéreur à sept séquences. |
| /situer-ma-vente | Recomposition conservatrice du moteur | Branches historiques et situations supplémentaires. |
| /situer-ma-vente/resultat | Migration compatible | Anciens paramètres, reconstruction datée, reprise explicite. |
| /vendre-et-acheter | Création | Dépendances, calendrier, coûts, scénarios et conditions. |
| /votre-rue | Calculs conservés + recomposition | Ventes passées et lecture personnelle avant collecte. |
| /audit-annonce | Recomposition, API conservée | Trois réponses, deux actions, correction, export et continuité vendeur. |
| /carte | Recomposition | Entrée physique, trois projets, vCard et contact. |
| /methode | Recomposition | Information, clarification, options, décision, vérification. |
| /methode/vendre | Création | Système des Écarts comme application vendeur. |
| /accompagnement | Recomposition | Apports et limites de l’intervention humaine. |
| /mouaad | Recomposition | Portrait réel, rôle, méthode et cadre professionnel. |
| /contact | Recomposition, transport conservé | Message volontaire, consentement ciblé et statut réel. |
| /ressources | Recomposition | Six ressources gratuites organisées par décision. |
| /ressources/lancement-coherent | Révision | Cohérence du lancement sans calendrier arbitraire. |
| /ressources/premiere-impression-annonce | Révision | Relire la présentation mobile du bien. |
| /ressources/annonce-vue-peu-de-contacts | Révision | Distinguer visibilité, compréhension et contact. |
| /ressources/retours-de-visite | Révision | Organiser les retours sans inventer leur représentativité. |
| /ressources/verifier-avant-baisse-prix | Révision | Examiner les faits avant une décision sur le prix. |
| /ressources/reprendre-commercialisation | Révision | Reprendre avec un constat daté. |
| /bienvenue | Création | Recommandation entrante distincte de la recommandation sortante. |
| /reprendre | Création | Import local et reprise individuelle protégée. |
| /lecture | Création | Restitution versionnée, correction, export et quatre suites. |
| /experiences/visites-sans-offre | Création | Première lecture précise issue d’une vidéo. |
| /experiences/surface-ou-usage | Création | Usage avant surface, comparaison et conséquence. |
| /experiences/vendre-avant-acheter | Création | Première clarification de la dépendance financière. |
| /recommander | Révision | Dispositif existant, sans gain non vérifié. |
| /rejoindre | Révision | Présentation du métier, sans promesse de revenu. |
| /mentions-legales | Habillage et crédits | Informations professionnelles du dépôt conservées. |
| /confidentialite | Révision | Session, export, consentement, traitements réels et effacement. |
| 404 | Recomposition | Issue utile vers les projets et les ressources. |

Navigation, footer, indexation et sitemap appartiennent au même langage. Les lectures individuelles et pages privées sont exclues de l’indexation. /composants reste un écran interne non indexé ; le cockpit historique est conservé. /cockpit/relectures est la seule nouvelle surface privée.

Redirections conservées : /le-projet → /mouaad ; /guide et /carnets-de-terrain → /ressources ; /observatoire-immo → / ; /vendre-a-leves → /situer-ma-vente ; /lea → /mouaad ; /merci → / ; /carnets-de-terrain/* → /ressources.

Les contrats q, s, r, src, le vCard, les liens physiques et les six slugs de ressources sont préservés ou convertis explicitement. Un ancien r non versionné est présenté comme une reconstruction avec le moteur de la base du 9 septembre ; aucune fidélité antérieure à cette base n’est prétendue.

## Le Plan vivant maturé
[Spécification visuelle finale](../design/LEVOIS_Plan_Vivant_Systeme_Final_2026-09-10.md).

| Élément | Choix et fonction |
|---|---|
| Encre #111a30, blanc #ffffff | Lecture et structure. |
| Cobalt #2545df | Actions, liens et relation réponse → conséquence. |
| Bleu pâle #eaf0ff | Informations et appuis de lecture. |
| Pêche #f4d4bf | Conditions et contexte. |
| Lavande #eee8f4 | Inconnues ; jamais un score négatif. |
| Cuivre #ca581c | Point d’attention. |
| Typographie | Satoshi locale 400/500/700 ; logo réel conservé. |
| Composition | Lignes ouvertes, rails, comparaisons et frise ; desktop en deux champs, mobile en colonne. |
| Mouvement | Conséquence immédiate ; aucun faux temps d’attente ; mouvement réduit respecté. |
| Local | Communes et données réelles ; schéma territorial clairement non géographique. |
| Images | Portrait réel ; scène de vie illustrée légendée, sans faux bien ni faux lieu documenté. |

Le visuel architectural de l’exploration a été remplacé par une scène de vie ordinaire. La couleur porte le raisonnement. Les choix sont indiqués par un contrôle et une légende, pas par la couleur seule. Le relais vers Mouaad intervient à la limite de ce que la lecture peut établir.

Les écrans longs, inconnus, corrections, erreurs, comparaisons, menus et impressions ont été examinés. L’ambition visuelle reste un jugement de design : les captures permettent de l’apprécier. Aucun test de préférence avec des habitants n’est revendiqué ou imposé.

## Vérifications finales
- Build Astro réussi : **42 pages**, publiques et privées comprises.
- **257 tests Vitest**, tous réussis : domaines, historique vendeur, provenance/corrections, export, API et sécurité.
- Vérifications historiques du jeu DVF et des agrégations réussies : **6 318 ventes, sept communes**, sans doublon selon les contrôles du dépôt.
- **31 routes × quatre largeurs** : 320, 390, 768 et 1440 ; **55 destinations internes** résolues.
- Acquéreur/transition : huit scénarios navigateur. Local : données, qualification, origine inconnue, panne et responsive. Audit : douze scénarios et dix états Axe.
- Continuité : dix scénarios publics ; cinq scénarios supplémentaires sur stockage bloqué, historique, import audit/local et correction micro → vendeur.
- Opérateur et runtime Pages/D1 réels testés localement : accès, CSRF, enregistrement, note, révocation et suppression.
- Menu clavier à quatre largeurs, 44 liens atteints. Modale à 390 × 430, texte long, reflow à 320, Escape/focus et impression des annotations.
- Aucun envoi extérieur dans la recette. Les transports sont simulés ou désactivés ; la délivrabilité de production reste une vérification d’activation.
- TypeScript des interfaces partagées et contrats serveur vérifié. Aucun débordement, erreur JavaScript ou violation Axe restant dans les états contrôlés.
- Chromium émule les dimensions mobiles. **Aucun essai sur téléphone physique, Safari/iOS ou réseau de terrain n’est revendiqué.** Axe ne vaut pas certification d’accessibilité.

[Rapport global](../design/cible-20260910/preuves/global/rapport-public-pages-final.json) · [Acquéreur/transition/local](../design/cible-20260910/preuves/buyer-transition-local-qa.md) · [Audit](../design/cible-20260910/preuves/audit-ui-verification.json) · [Conservation et correction](../design/cible-20260910/preuves/final-continuity-verification.json) · [Artefact et performance](../design/cible-20260910/preuves/delivery-verification.json).

Mesure indicative sur l’artefact compilé : Chromium, cache vide, réseau 1,6 Mb/s, latence 150 ms, CPU ×4. LCP relevé : accueil 1,62 s ; acquéreur 1,35 s ; micro-expérience 1,24 s ; Votre rue 1,43 s. CLS : 0 / 0 / 0 / 0,027. Le premier écran du parcours est servi dans le HTML pour éviter le déplacement initial découvert pendant la recette. Ce ne sont pas des mesures de terrain ni une garantie des Core Web Vitals.

Reproduction : npm test ; npm run test:market ; npm run data:verify ; npm run test:public avec le serveur 4331 ; npm run test:delivery avec la preview compilée 4332. Les anciens scripts liés au DOM de la base restent dans scripts/verify-public-legacy.mjs ; les scénarios courants testent la nouvelle architecture.

## Matrice Astra AC01–AC31
| Critère | État et preuve |
|---|---|
| AC01 | Trois projets, micro-entrées, Google/QR/recommandation propagés ; reprise vérifiée. Tests de contexte, liens et reprise. |
| AC02 | Lecture et export anonymes, dont session refusée ; aucune coordonnée préalable. |
| AC03 | Contexte commun entre ressource, outil et parcours ; réponses réutilisées. |
| AC04 | Sept séquences et quatre blocs exacts ; anonyme et confirmé. |
| AC05 | Inconnu, exclusion et ouverture distincts ; tests de domaine. |
| AC06 | Sans budget et DVF absente : lecture qualitative, aucun quartile nul transformé en conclusion. |
| AC07 | Budget/secteur/surface corrigés : invalidation et historique testés. |
| AC08 | Cinq branches et 24 questions ; mapping et toutes combinaisons historiques contrôlés. |
| AC09 | Ancien résultat isolé de la session courante, confirmation explicite. |
| AC10 | Snapshot figé et reconstruction datée, tests de hachage. |
| AC11 | Audit lisible/bloqué/insuffisant/panne, correction et HTML réimportable. |
| AC12 | Votre rue : qualification et lecture avant coordonnées. |
| AC13 | BAN ambiguë, périmètre, DVF absente/petit effectif : limites et issue utile. |
| AC14 | Un contexte de transition, frise, ressources et coûts distingués. |
| AC15 | Aucun scénario faisable supposé ; prochaines vérifications explicites. |
| AC16 | Attendre/repli conservables, condition de réexamen, aucune relance automatique. |
| AC17 | Copie de l’aperçu exact, pas de dossier commercial ; tests client/API. |
| AC18 | Relecture et échange distincts, aperçu, consentement et canal. |
| AC19 | Enregistré/notifié/inconnu séparés ; retry idempotent, aucun faux succès HTTP. |
| AC20 | Confirmation chaude, choix des différences, aucune fusion de contextes distincts. |
| AC21 | Lien + OTP, expiration/révocation/usages/accès tiers contrôlés ; activation préparée. |
| AC22 | Opérateur reçoit version et accord exacts ; tests Pages/D1 et navigateur. |
| AC23 | Notes attribuées et raisons séparées ; longues notes préservées. |
| AC24 | Consentement analytics conservé, champs limités, aucune donnée privée ajoutée. |
| AC25 | Origine inconnue admise ; Votre rue n’implique ni vendeur ni QR. |
| AC26 | Quatre largeurs, clavier, modale courte, mouvement réduit, reflow ; limite physique explicitée. |
| AC27 | HTML/copie/impression complets : dates, coûts, options, limites, annotations. |
| AC28 | Six ressources, vCard et redirections conservés ; 55 liens vérifiés. |
| AC29 | Revue des textes : aucune ancienneté, vente ou preuve terrain inventée ; illustration signalée. |
| AC30 | Vingt captures structurantes et états longs examinés ; appréciation finale laissée à Mouaad. |
| AC31 | Même moteur anonyme/confirmé ; pont de critères explicite, aucune fusion CRM automatique. |

## Remplacement de production
[Procédure d’activation](LEVOIS_Activation_Continuite_2026-09-10.md) · [Contrats de continuité](LEVOIS_Contrat_Continuite_2026-09-10.md).

La vérification distante en lecture seule confirme le projet Pages levois-site, sa branche de production Pages main, le binding RECHERCHE_DB et les noms de secrets d’envoi. L’accès administratif est disponible.

Après **GO PRODUCTION** seulement :
1. Relever le déploiement actuellement servi pour disposer du retour arrière.
2. Configurer Access pour les chemins privés de levois.fr et les paramètres du runbook, sans protéger les portes publiques.
3. Appliquer db/experience.sql à la D1 explicitement nommée ; schéma additif et idempotent.
4. Confirmer l’expéditeur et les permissions du transport ; assurer le suivi et la suppression des dossiers opérationnels.
5. Refaire le build validé depuis cette branche et publier son artefact :
   node node_modules/wrangler/bin/wrangler.js pages deploy dist --project-name levois-site --branch main
6. Faire la recette avec une boîte contrôlée et des données fictives : copie, demande, opérateur, OTP, révocation, erreurs, suppression des fixtures.
7. En cas d’échec matériel, revenir au déploiement Pages précédent. Aucun rollback destructif de base n’est nécessaire.

L’option --branch main désigne l’environnement Pages ; **aucune fusion Git dans main n’est effectuée**. L’autorisation de déployer n’existe pas encore.

Les vrais prérequis restants sont cette configuration et sa recette, pas des routes, moteurs ou interfaces manquants. Le site ne doit pas être publié avec une continuité humaine partiellement activée.

## Conservation et hors périmètre
La session anonyme est locale. Le fichier téléchargé appartient à la personne. La copie par e-mail n’autorise ni appel ni relance. Seule une demande volontaire crée le dossier nécessaire.

Aucune durée commerciale générale, conservation longue « au cas où », CRM nouveau, pipeline vidéo, bibliothèque massive, simulation bancaire ou conseil juridique automatisé n’a été construit. Le traitement humain réel requiert un suivi et une suppression à la fin de sa finalité ; tout archivage long ou usage ultérieur doit être cadré avant activation.

La version ne prétend pas connaître les biens actuellement disponibles, leur prix exact ou leur délai de vente. DVF décrit des ventes passées. Les pannes de BAN, d’extraction et d’envoi gardent une issue utile.

## Git et traçabilité
Worktree : C:\Users\PC\.codex\worktrees\levois-experience-cible-20260909
Branche : codex/levois-experience-cible-20260909
Base : 52c92ca64ca22606272ae9dd933b5706f4301842

Les actifs, données et fonctions utiles sont préservés ; la recomposition remplace les interfaces concernées. Les explorations restent archivées séparément. Aucun autre worktree n’a été utilisé. Les commits, le HEAD final et l’état propre sont fournis dans le message de livraison ; vérification par git rev-parse HEAD et git status --short.

## Transmettre au chat pilote
Joindre ce rapport et les captures de la galerie. Les liens 127.0.0.1 ne sont accessibles que sur votre ordinateur : le chat pilote doit recevoir les fichiers, pas seulement ces liens. Le paquet LEVOIS_Livraison_20260910.zip rassemble le rapport, la galerie et les vingt captures structurantes. Les interactions restent consultables dans le site local ; aucune image ne permet à elle seule de tester leur comportement.

Commits sécurisés : 5f3a3f71c790c8e3fdf3b073c7558247d5512951 (décisions et explorations) ; 43e73075f1987bba74fb9a7f1466c7bbd386ef70 (site complet, API et tests). Le commit de livraison documentaire les complète. Diff du commit applicatif : 103 fichiers, environ 6 300 lignes ajoutées et 4 100 retirées, hors captures et archives de direction.

La démonstration Pages réelle a également passé sept contrôles finaux : enregistrement dans D1 locale, lecture opérateur, suppression des fixtures, notifications désactivées honnêtement, aucune erreur JS ni requête extérieure. [Mode d’emploi local](LEVOIS_Demonstration_Locale_2026-09-10.md).
