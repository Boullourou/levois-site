# LEVOIS — Phase 1 — Dossier d’arbitrage éditorial, acquisition, SEO local et visibilité IA

**Date de vérification :** 30 août 2026  
**Périmètre :** audit et décisions structurantes, sans code, sans direction artistique, sans campagne, sans CRM et sans réouverture de BUY OS.  
**Statut :** **Phase 1 validée avec modifications par la Direction générale.** Les décisions finales sont consignées dans `docs/strategy/phase-1-validation-direction-generale.md`, qui prévaut sur les recommandations initiales en cas d’écart.

## 0. Verdict d’arbitrage

La Phase 1 permet d’arrêter l’architecture suivante :

- `/` reste la porte universelle pour une arrivée sans intention plus précise ; son premier écran doit identifier Mouaad, son statut prouvé, sa zone de travail provisoire, les trois situations servies et un accès immédiat au contact. Les trois situations restent immédiatement accessibles, mais l’acquisition de nouveaux acquéreurs autorise « Mettre ma recherche au clair » comme action visuellement principale.
- `/carte` reste l’interface de rappel après une rencontre physique ; elle ne doit plus être une porte presque exclusivement vendeuse.
- `/ma-recherche` est reconstruite selon les sept blocs métier déjà validés. La version en production et la version de travail font calculer l’essentiel de leur lecture avec seulement le type, une zone grossière, le budget et la surface ; plusieurs réponses n’ont pas d’effet réel.
- `/votre-rue` est conservée comme preuve locale et outil personnel. Sa couche éditoriale doit être renforcée avant indexation ; les résultats liés à une adresse restent privés et non indexables.
- `/situer-ma-vente` est conservée comme outil d’orientation vendeur ; son moteur et sa restitution prudente sont de bons actifs, mais la progression, l’attribution et la hiérarchie éditoriale sont à corriger.
- `/audit-annonce` est conservée : c’est déjà une mini-expérience réelle, distincte de `/situer-ma-vente`, pour une annonce publiée dont on veut localiser le point de rupture.
- `/mouaad` existe déjà. Elle n’est donc pas à créer, mais à corriger pour devenir la source de vérité interne au site ; les informations réglementées restent fondées sur les documents officiels et le profil SAFTI.
- Le capital de connaissance des six ressources existantes est intégralement préservé et n’est pas traité comme un blog. Les URL pourront toutefois être fusionnées, redirigées ou restructurées si aucune connaissance utile n’est perdue.
- Lèves devient le pilote local. Chartres peut devenir une page-réponse quantitative sans revendiquer une expertise terrain non prouvée ; son module humain attend la confirmation de la zone réelle. Mainvilliers est placée après Lèves et Chartres : sa page peut d’abord être quantitative, mais sa publication exige une réponse distincte et non clonée.
- L’attribution doit conserver séparément première touche, dernière touche, porte d’arrivée et source déclarée. La déclaration humaine ne doit jamais écraser les données techniques brutes ; elle doit les compléter et primer pour les canaux hors ligne ou indétectables.

Deux erreurs publiques sont P0 :

1. le SIRET `824 194 419 00027` affiché par LEVOIS correspond à un établissement fermé le 22 juin 2026 ; l’API officielle consultée indiquait `824 194 419 00043`, numéro attendu mais maintenu **provisoire jusqu’à réception d’une attestation RNE récente** ;
2. les identifiants SAFTI recopiés sur LEVOIS ne correspondent pas aux mentions légales SAFTI consultées le 30 août 2026.

Ces constats autorisent la suppression des formulations erronées, mais pas l’invention d’un RSAC, d’un mandat, d’une adresse ou d’une qualité réglementée. Le noyau factuel public **VÉRIFIÉ** est :

> **Mouaad Boullourou, conseiller immobilier SAFTI à Lèves et alentours.**

La qualification juridique ou commerciale de LEVOIS reste une **HYPOTHÈSE PROVISOIRE**. La définition publique V1 autorisée par la Direction générale est toutefois arrêtée :

> **LEVOIS est la démarche et l’ensemble d’outils d’aide à la compréhension et à la décision portés par Mouaad dans le cadre de son activité de conseiller immobilier SAFTI.**

LEVOIS n’est ni une agence immobilière autonome, ni un réseau, ni un produit officiellement édité par SAFTI. Cette définition reste évolutive et ne préjuge pas de sa forme future.

## 0.1. Convention de preuve

- **VÉRIFIÉ** : confirmé par la production, un fichier versionné correspondant à la production ou une source officielle indépendante.
- **HYPOTHÈSE PROVISOIRE** : cohérent avec le brief ou le dépôt, mais pas assez documenté pour devenir une affirmation publique figée.
- **À FOURNIR PAR MOUAAD** : information contractuelle, opérationnelle, privée ou relevant d’un compte auquel l’audit n’a pas accès.

Une recommandation est une décision de conception. Elle n’est pas marquée « VÉRIFIÉ » comme s’il s’agissait d’un fait.

## 0.2. États techniques à ne pas mélanger

| État | Référence vérifiée | Ce que ce dossier en fait |
|---|---|---|
| **Production** | `README.md:94-98` indique que `main` déploie `levois.fr`. `main` et `origin/main` pointent sur `cb0ab22`. Les réponses HTTP et le HTML public ont été contrôlés le 30 août 2026. | Source prioritaire pour « l’existant actuel ». |
| **Branche de travail** | Worktree sur `codex/buy-os-t0` au commit `795908e`. La page d’accueil, `/ma-recherche`, `/audit-annonce`, `/situer-ma-vente`, le footer et la mesure divergent de `main`. | Auditée pour éviter d’importer une régression et pour récupérer les ajouts utiles ; jamais présentée comme déjà en ligne. |
| **Branche privée versionnée** | Neuf routes `/cockpit/*`, un layout cockpit et leurs scripts existent sur la branche mais pas sur `main`; elles sont protégées par l’infrastructure. | Hors produit public, hors SEO et hors Phase 1 éditoriale. |
| **Explorations non suivies** | `/buy-os-lab`, `/tomas-terrain`, `/visual-lab/*` et leurs dépendances sont présents localement mais non suivis par Git. | Exclus de l’architecture publique. Leur présence ne vaut ni validation ni intention de publication. |
| **Anciennes URL** | `public/_redirects:3-11` redirige notamment `/le-projet`, `/guide`, `/carnets-de-terrain`, `/observatoire-immo`, `/vendre-a-leves`, `/lea` et `/merci`. | Aliases de continuité, pas pages actives. |
| **Explorations créatives écartées** | Le brief source nomme Atlas vivant, Architecture des choix et Compas sensible comme territoires déjà explorés et à abandonner dans la rédaction publique. | Décision éditoriale acquise ; aucun artefact de route n’est arbitrairement étiqueté « abandonné » sans preuve. |

**Contradiction documentaire :** `public/_redirects:23-32` affirme encore que `main` ne contient pas `/votre-rue`. Cette affirmation est périmée : `main@cb0ab22` contient la route et la production la sert. Le commentaire ne doit plus être utilisé comme preuve d’état.

## 0.3. Registre des principales sources

| Code | Source | Usage |
|---|---|---|
| P | `https://levois.fr` et routes publiques, vérifiées le 30 août 2026 | Production réellement servie, titres, robots, HTML, parcours accessibles. |
| M | Git `main@cb0ab22` | Code correspondant au déploiement de production selon `README.md`. |
| W | Git `codex/buy-os-t0@795908e` | Version de travail non publiée. |
| R | `src/pages/*`, `src/data/resources.ts`, `src/data/resourceContent.ts`, `src/data/situations.ts`, `src/lib/engine.ts` et ses tests, `src/scripts/analytics.ts`, `src/layouts/Layout.astro`, `public/sitemap.xml`, `public/robots.txt`, `public/_redirects` | Preuves locales détaillées. |
| D | `public/data/dvf-secteur.json`, `public/data/dvf-meta.json`, `src/data/dvf-market-summary.json` | Données DVF utilisées par les pages et outils. |
| E1 | [Profil officiel SAFTI de Mouaad](https://www.safti.fr/votre-conseiller-safti/mouaad-boullourou) et [annuaire SAFTI Lèves](https://www.safti.fr/trouver-un-conseiller/leves-28300) | Nom, qualité « conseiller SAFTI », Lèves et alentours, téléphone public. |
| E2 | [BODACC B2026014746](https://www.bodacc.fr/pages/annonces-commerciales-detail/?q.id=id:B2026014746) et [API Recherche d’entreprises](https://recherche-entreprises.api.gouv.fr/search?q=824194419) | SIREN, entrepreneur individuel, établissement actif/fermé, APE. |
| E3 | [Mentions légales SAFTI](https://www.safti.fr/cms/mentions-legales) | Identité légale actuelle du réseau, carte professionnelle et mention de responsabilité civile professionnelle. |
| E4 | [Règles Google Business Profile](https://support.google.com/business/answer/3038177?hl=fr) et [activité de zone desservie](https://support.google.com/business/answer/9157481?hl=fr) | Nom public, adresse, réception, zone desservie. |
| E5 | [Google — contenus pour fonctions IA](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) et [AI features](https://developers.google.com/search/docs/appearance/ai-features) | Crawlabilité, contenu visible, absence de balisage IA spécial et absence de rôle de `llms.txt`. |
| E6 | [OpenAI — crawlers](https://developers.openai.com/api/docs/bots) et [suivi des références ChatGPT](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq) | Séparation `OAI-SearchBot`/`GPTBot`, `utm_source=chatgpt.com`. |
| E7 | [Perplexity — crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) | Séparation `PerplexityBot`/`Perplexity-User`. |
| E8 | [Anthropic — robots Claude](https://support.claude.com/fr/articles/8896518-anthropic-explore-t-il-les-donnees-du-web-et-comment-les-proprietaires-de-sites-peuvent-ils-bloquer-l-explorateur), [Cloudflare — Managed robots.txt](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/) et [Google — robots courants](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) | Distinction `ClaudeBot`/`Claude-SearchBot`/`Claude-User`, portée volontaire de robots.txt, signaux Cloudflare et portée de `Google-Extended`. |

**Protocole live :** lecture seule le 30 août 2026 sur Edge, viewport desktop 1 358×636 et mobile 390×844. Vingt routes/états ont été contrôlés sans soumettre de formulaire. Aucun débordement horizontal ni erreur console n’a été observé ; `lang=fr`, skip-link, labels et alertes sont globalement présents. Les défauts d’adresse, parsing, landmarks, fallback formulaire, canonical/soft-404 et premier écran sont consignés aux lignes de décision correspondantes. Les comptes PostHog, Search Console et Google Business Profile n’étaient pas accessibles.

## 0.4. Plan d’exécution de Phase 1 — accompli

| Séquence exécutée | Résultat produit | Statut |
|---|---|---|
| 1. Fixer les états et les preuves | Production, branche, privé, non suivi et envisagé séparés ; registre P/M/W/R/D/E. | **TERMINÉ** |
| 2. Inventorier routes et capital informatif | Inventaire route par route en §1 ; inventaire/audit de chaque contenu en §8. | **TERMINÉ** |
| 3. Sécuriser l’entité publique | Tableau Mouaad–SAFTI–LEVOIS, niveaux de preuve et pièces exactes en §2. | **TERMINÉ sous hypothèses explicitement signalées** |
| 4. Affecter chaque acquisition à une porte | Cinq sources déclinées en 17 intentions en §3 ; contrats des huit portes en §4. | **TERMINÉ** |
| 5. Auditer le parcours acquéreur | Relevé écran/question, effet réel et écarts aux sept blocs en §5. | **TERMINÉ** |
| 6. Arbitrer SEO local et visibilité IA | Indexation, HTML, schema, robots, pages locales et maillage en §6. | **TERMINÉ** |
| 7. Définir la mesure sans coder | Attribution, événements, propriétés, exclusions et définitions métier en §7. | **TERMINÉ** |
| 8. Consolider les décisions | Décisions page par page en §8, tableau unique en §9 et paquet de validation en §10–11. | **TERMINÉ** |

## 1. Inventaire de l’existant

Les 17 champs demandés sont répartis en deux tableaux portant les mêmes identifiants. Cette séparation évite un tableau illisible ou cassé. « HTML » signifie que la réponse essentielle existe dans le document initial sans exécution du JavaScript ; elle ne signifie pas que toute personnalisation est rendue côté serveur.

### 1.1. Routes réellement en production — fonction, public, promesse et valeur

| ID | Route | Fonction actuelle | Public principal | Promesse actuelle | Source de trafic probable | Valeur avant coordonnées | CTA principal | CTA secondaire | Données demandées | Restitution produite |
|---|---|---|---|---|---|---|---|---|---|---|
| R01 | `/` | Porte commune et orientation par la preuve locale. | Visiteur sans intention précise ; acheteur ; vendeur ; recherche locale. | « Rendre la valeur lisible » à partir de faits DVF. | Accès direct, nom de marque, Google/GBP, liens génériques. | Sélecteur DVF, repère local, méthode et chemins acheteur/vendeur. | Choisir acheteur ou vendeur. | `/votre-rue`, Mouaad, contact. | Aucune donnée métier. | Orientation + repères DVF Lèves/Chartres. |
| R02 | `/carte` | Prolonger une rencontre ou une carte de visite. | Personne ayant rencontré Mouaad ou trouvé sa carte. | Mouaad local commence par écouter. | QR/imprimé, saisie directe. | Identité, territoire déclaré, méthode et cadre. | `/situer-ma-vente?src=carte`. | Contact/téléphone. | Aucune. | Rappel de qui est Mouaad et orientation actuellement vendeuse. |
| R03 | `/ma-recherche` | Clarifier une recherche d’achat. | Acquéreur débutant ou actif. | Confronter budget, surface, secteur et priorités aux ventes enregistrées. | Social, publicité acheteur, liens internes, partage. | Lecture marché, priorités, arbitrage et synthèse. | Activer une suite après lecture. | Modifier/revenir. | Motif, typologie, zone, budget, surface, priorités ; la branche ajoute financement, vente préalable, horizon, communes et trajet. Coordonnées seulement après lecture. | Synthèse et lecture DVF, puis choix de transmission. |
| R04 | `/votre-rue` | Donner une preuve locale personnalisée autour d’une adresse. | Curieux local, vendeur latent/actif, acheteur du secteur. | « Combien s’est vendue la dernière maison de votre quartier ? » en environ 30 s. | QR/encart, vidéo locale, recherche « ventes dans ma rue », accueil. | Transactions, médiane, quartiles, tendance, dernières ventes, sources et limites. | Lancer la recherche d’adresse. | Situer la vente/contact après le résultat. | Adresse envoyée au géocodeur public ; qualification et coordonnées seulement si poursuite. | Lecture DVF dans un rayon adaptatif, puis prochaine action. |
| R05 | `/situer-ma-vente` | Orienter un vendeur à partir de cinq situations. | Propriétaire préparant ou ayant déjà publié. | 3 à 5 questions, première lecture sans coordonnées. | Google vendeur, ressource, audit, publicité situationnelle, accueil. | Choix de situation et questions structurées. | Voir la première lecture. | Retour/modification. | Situation et 3 à 5 réponses stockées en session. | Redirection vers un résultat déterministe. |
| R06 | `/situer-ma-vente/resultat` | Délivrer la valeur du parcours vendeur et proposer le relais humain. | Personne ayant terminé R05 ou reçu un code partageable. | Reformulation, hypothèse, limite, action et ressource. | R05 uniquement/partage du code. | Résultat complet, copie et impression avant contact. | Demander une analyse à Mouaad. | Lire la ressource recommandée/recommencer. | Après le résultat : prénom, nom, email, commune ; téléphone, annonce et détail facultatifs. | Reformulation, écart probable, seconde hypothèse, niveau de confiance, limite et action. |
| R07 | `/audit-annonce` | Examiner une annonce déjà publiée et donner deux actions. | Vendeur avec URL d’annonce. | « Collez votre annonce. 3 réponses. 2 actions. » | Recherche vendeur, ressource, publicité annonce bloquée, accueil. | Résultat et limite avant coordonnées, y compris si le portail bloque la lecture. | Analyser l’annonce. | Ressource adaptée/lecture humaine. | URL publique ; durée, signal, contexte ; coordonnées seulement pour la lecture humaine. | Deux actions, faits utilisés, limites et suite pertinente. |
| R08 | `/contact` | Contact direct multicanal. | Toute personne déjà décidée à parler. | Écrire, appeler ou envoyer un message à Mouaad. | Toutes routes, GBP, nom de Mouaad. | Coordonnées directes ; aucune promesse de diagnostic. | Envoyer le message. | Appeler/envoyer un email. | Prénom, nom, email, objet, message ; téléphone facultatif. | Confirmation et promesse de réponse en 24–48 h ouvrées. |
| R09 | `/mouaad` | Profil d’entité et de confiance. | Recherche de marque/nom, GBP, prospect avant contact. | Conseiller SAFTI local, lecture avant décision. | Google nom, GBP, liens internes, carte. | Identité, territoire déclaré, engagements, coordonnées. | Situer une vente. | Contact. | Aucune. | Présentation personnelle et professionnelle. |
| R10 | `/methode` | Expliquer le « Système des Écarts ». | Surtout vendeurs voulant comprendre l’approche. | Comprendre, aligner, positionner, piloter, apprendre. | Maillage interne, recherche de marque/méthode. | Méthode complète, exemple et limites. | Choisir une situation vendeur. | Découvrir Mouaad. | Aucune. | Cadre méthodologique statique. |
| R11 | `/accompagnement` | Expliquer le passage de l’outil à l’humain. | Vendeur envisageant un accompagnement. | Lecture sur pièces, restitution honnête, pilotage. | Résultats/outils, recherche de marque. | Étapes, cadre SAFTI déclaré et FAQ. | Situer une vente. | Écrire à Mouaad. | Aucune. | Réassurance et déroulé de service. |
| R12 | `/ressources` | Hub de contenus de compréhension. | Vendeurs selon l’étape de commercialisation. | Comprendre avant d’ajuster, sans inscription. | SEO informationnel, outils, maillage. | Résumé de six questions/réponses. | Ouvrir une ressource. | Situer une vente. | Aucune. | Orientation vers six pages-réponses. |
| R13 | `/ressources/lancement-coherent` | Expliquer l’ordre des décisions avant publication. | Vendeur avant lancement. | Documents → préparation → prises de vue → comparaison → hypothèse de prix. | SEO, R05 situation « préparer », vidéo/encart. | Réponse directe, explication, exemple, erreurs, checklist, limite. | Appliquer la checklist. | R05 préconfiguré/accompagnement. | Aucune. | Page-réponse statique. |
| R14 | `/ressources/premiere-impression-annonce` | Expliquer ce qui fait ouvrir une annonce. | Vendeur publié ou préparant sa diffusion. | Un « mini-test » photo/titre/prix sur mobile. | SEO, R07, vidéo sociale. | Explication et checklist en cinq points. | Refaire le test en conditions réelles. | R05/R07. | Aucune. | Liste statique ; pas de test intégré réel. |
| R15 | `/ressources/annonce-vue-peu-de-contacts` | Localiser la rupture vue → ouverture → contact → visite. | Vendeur avec peu de demandes. | Identifier le premier levier à vérifier. | SEO, R05/R07, publicité situationnelle. | Modèle de lecture, exemple et checklist. | Localiser l’étape perdue. | R05/R07. | Aucune. | Page-réponse statique ; pas d’arbre intégré. |
| R16 | `/ressources/retours-de-visite` | Apprendre à lire les retours. | Vendeur ayant des visites sans offre. | Distinguer politesse, objection et motif récurrent. | SEO, résultat R05, vidéo. | Questions de débrief, exemple, erreurs et limites. | Mettre en place une grille. | R05/accompagnement. | Aucune. | Conseils statiques ; aucune grille utilisable ou sauvegardable. |
| R17 | `/ressources/verifier-avant-baisse-prix` | Sécuriser la décision de prix. | Vendeur inquiet du silence ou des visites. | Vérifier signal, comparaison et historique avant une baisse. | SEO, R05/R07, vidéo. | Six vérifications et limite explicite. | Refaire la comparaison actuelle. | R05/accompagnement. | Aucune. | Checklist statique ; aucun calcul, ce qui est prudent. |
| R18 | `/ressources/reprendre-commercialisation` | Repartir après une vente longue. | Vendeur avec annonce ancienne. | Reconstituer l’historique et choisir pause, repositionnement ou continuité. | SEO, R05 situation « longtemps ». | Explication, exemple, erreurs, checklist, limite. | Reconstituer la chronologie. | R05/accompagnement. | Aucune. | Liste statique ; pas de frise ni plan personnalisé. |
| R19 | `/mentions-legales` | Identifier l’éditeur et le cadre immobilier. | Tout public ; obligations légales. | Transparence sur Mouaad, SAFTI, hébergement et propriété. | Footer, contrôle de confiance. | Informations juridiques. | Consulter la confidentialité. | Email/téléphone. | Aucune. | Mentions légales, dont deux blocs actuellement erronés. |
| R20 | `/confidentialite` | Expliquer données, bases, destinataires, conservation et mesure. | Toute personne utilisant un formulaire ou outil. | Les données servent à répondre, sans publicité. | Footer et consentements. | Explication RGPD et commande d’opposition analytics. | Refuser/réactiver la mesure. | Email/CNIL. | Préférence analytics locale. | Politique de confidentialité. |
| R21 | `/composants` | Inventaire interne de l’interface. | Équipe uniquement, malgré accessibilité publique. | Montrer composants et états. | Accès direct accidentel. | Documentation technique, aucune valeur visiteur. | Aucun CTA métier. | Aucun. | Aucune. | Inventaire UI. |
| R22 | `/404` | Récupérer une navigation en erreur. | Visiteur perdu. | Proposer plusieurs chemins. | URL invalide. | Orientation. | Vente/ressources/méthode/contact. | Accueil. | Aucune. | Page de récupération. |
| R23 | `/merci` | Le dépôt prévoit un ancien alias ; la variante live testée `/merci/` répond 404. | Ancien lien éventuel. | Aucune. | Historique. | Aucune sur la variante testée ; une 301 exacte `/merci` est prévue dans `public/_redirects`. | Aucun actuellement. | Aucun. | Aucune. | Page 404 pour `/merci/`. |

### 1.2. Routes réellement en production — découvrabilité, mesure, continuités et décision

| ID | Indexabilité actuelle | Sitemap production | Contenu critique en HTML | Données structurées | Événements existants en production | Continuités actuelles | Contradictions/doublons prouvés | Décision route |
|---|---|---|---|---|---|---|---|---|
| R01 | Indexable. | Oui, priorité 1. | Oui pour promesse, données et orientation. | Graphe global + `Dataset`. | Page/navigation/formulaire générique et engagement ; aucun test de compréhension. | Acheteur, vendeur, rue, méthode, ressources, Mouaad. | Production trop centrée sur la preuve avant l’identité ; branche trop centrée acheteur. Sur écran live 1 358×636, les CTA principaux du contenu commencent vers y=838 : aucun CTA de parcours n’est visible dans le hero desktop, tandis que les entrées « Acheter » et « Vendre » restent visibles dans l’en-tête. | **RECONSTRUIRE** l’architecture éditoriale ; conserver les blocs DVF utiles. |
| R02 | Indexable. | Oui. | Oui. | Graphe global. | Génériques seulement ; pas d’identifiant QR durable. | Vente, contact, Mouaad/méthode. | Portes acheteur et exploration des données locales absentes ; « transmet tout votre contexte sans coordonnées » est faux ; `src=carte` se perd. Sur mobile 390×844, le portrait pousse le H1 vers y=609 et le premier CTA vers y=853. | **CORRIGER** ; URL intangible, cible `noindex,follow`, hors sitemap. |
| R03 | `noindex`. | Non. | Non : le HTML live initial ne contient aucun H1 et seulement environ 378 caractères hors scripts. | Graphe global inadapté à une page privée. | La production ne capture pas le détail du tunnel ; la branche ajoute démarrage/étapes/résultat/consentements. | Parcours fermé, presque sans contenus connexes. | Structure métier non respectée ; réponses sans effet ; typologie avant usages ; aucune occupation ; conclusions trop fortes. En live, l’étape 7 saute à « 9 sur 10 » et le bouton Retour de l’entrée est activable mais inerte. | **RECONSTRUIRE** ; conserver URL, données et restitution avant coordonnées. |
| R04 | `noindex`. | Non. | Oui pour promesse, méthode, source et limites ; non pour résultat personnel. | Graphe global seulement. | Génériques ; recherche d’adresse et lead confondus comme formulaires `/votre-rue`. | Vente et contact ; acheteur faiblement relié. | Le H1 promet la « dernière maison », alors que le résultat compte maisons et appartements puis peut sélectionner une transaction dont le type n’est pas garanti par cette promesse ; source forcée `QR`; géocodage absent de la politique. **Live P0 :** « 1 rue » sans suggestion sélectionnée produit 1 218 ventes centrées sur Chartres sans afficher l’adresse résolue. Une adresse exacte à Lèves produit bien une lecture riche avant contact. | **CORRIGER P0** : exiger la suggestion ou confirmation et afficher l’adresse géocodée ; puis indexer la couche statique seulement quand complète. |
| R05 | Indexable. | Oui. | Partiel : situations visibles, questions JS. | Graphe global. | Génériques seulement. | R06, deep links par situation. | Auto-avance sans traduction ; source perdue ; le HTML/JS de production contient déjà plusieurs H1 selon l’état du parcours, et la branche ajoute `JourneyImmersion`, ce qui aggrave la hiérarchie. | **CORRIGER** sans refaire le moteur. |
| R06 | `noindex`. | Non. | Squelette seulement ; résultat JS. | Graphe global inutile. | Formulaire générique, pas résultat/lead réussi. | Ressource recommandée, retour, contact. | Consentement visible mais non versionné/transmis ; source absente du payload. | **CONSERVER** comme résultat privé ; corriger consentement/mesure/attribution. |
| R07 | Indexable. | Oui. | Oui pour réponse, méthode, limites et FAQ ; résultat personnel JS. | Graphe global + `WebApplication` + `FAQPage`. | Meilleure couverture : démarrage, lecture URL, étapes, résultat, ressource, demande humaine. | Ressource contextualisée et relais humain. | **Live P0 :** sur une annonce SAFTI publique, l’extracteur a retenu « SAFTI » comme titre puis fondé un conseil sur ce titre extrait erroné. Un `<main>` imbriqué existe déjà en production ; la branche ajoute en plus un H1 via `JourneyImmersion`. | **CONSERVER LA ROUTE, CORRIGER P0** : rejeter la marque/site comme titre, faire valider les champs extraits, basculer en questionnaire si parsing insuffisant. |
| R08 | Indexable. | Oui. | Oui. | Graphe global. | Tentative de formulaire, pas succès API ; clics non distingués téléphone/email. | R05 et confidentialité. | Seller-first ; `src`/UTM ignorés ; pas de question déclarative ; consentement visible non transmis ; délai 24–48 h non prouvé. Sans JS, `novalidate` + absence de `method/action` peut envoyer les coordonnées dans l’URL/logs. | **CORRIGER P0** et rendre universelle ; définir un fallback sans exposition de PII. |
| R09 | Indexable. | Oui. | Oui. | `Person` dans le graphe, sans `ProfilePage`; champs non prouvés. | Génériques. | Vente/contact. | Pas de lien SAFTI visible comme preuve ; claims sept communes et « indépendant » non figés ; acheteurs absents. | **CORRIGER** ; devient nœud d’entité. |
| R10 | Indexable. | Oui. | Oui. | Graphe global. | Génériques. | Cinq situations vendeur + Mouaad. | Seller-only ; langage « écarts/signaux » et règles générales non sourcées. | **CORRIGER** ; conserver comme page de méthode principalement éditoriale. |
| R11 | Indexable. | Oui. | Oui. | Graphe global ; FAQ visible sans schéma dédié. | Génériques. | Vente/contact. | Seller-only ; cadre SAFTI et promesses de service à documenter. | **CORRIGER** ; bifurquer clairement entre accompagnement d’un achat et accompagnement d’une vente, sans inventer d’offre acquéreur. |
| R12 | Indexable. | Oui. | Oui. | Graphe global + `ItemList`. | Génériques. | Six ressources + vente. | Six contenus vendeurs, aucune entrée acheteur/local ; auteur/date/source absents. | **CORRIGER** et élargir par situations, sans devenir un blog. |
| R13 | Indexable. | Oui. | Oui. | Graphe global + `Article`. | Génériques. | R05 « préparer » + accompagnement. | « Fenêtre qui ne se rejoue pas », 5–8 annonces, J+14 et « coûte des semaines » présentés comme règles. | **CORRIGER** ; décision de format détaillée en section 8. |
| R14 | Indexable. | Oui. | Oui. | Graphe global + `Article`. | Génériques. | R05 + accompagnement ; R07 insuffisamment mis en avant. | Promet un « mini-test » mais livre une checklist ; « trois secondes » non sourcé. | **CORRIGER** ; mini-expérience légère. |
| R15 | Indexable. | Oui. | Oui. | Graphe global + `Article`. | Génériques. | R05 + accompagnement. | Arbre causal utile mais seulement écrit ; 10–14 jours énoncé comme règle. | **CORRIGER** ; arbre de décision prudent. |
| R16 | Indexable. | Oui. | Oui. | Graphe global + `Article`. | Génériques. | R05 + accompagnement. | Promet une « grille » mais n’en fournit pas ; seuil de trois visites présenté trop sûrement. | **CORRIGER** ; grille utilisable. |
| R17 | Indexable. | Oui. | Oui. | Graphe global + `Article`. | Génériques. | R05 + accompagnement. | « Les portails affichent les baisses » et « seule référence valable » trop généraux ; pas de mise en balance exploitable. | **CORRIGER** ; balance prudente des preuves, sans montant ni verdict automatique. |
| R18 | Indexable. | Oui. | Oui. | Graphe global + `Article`. | Génériques. | R05 + accompagnement. | Pause de six semaines/J+14 exemples pris comme repères sans étiquette ; pas de chronologie utilisable. | **CORRIGER** ; frise/plan personnalisé. |
| R19 | Indexable. | Oui. | Oui. | Graphe global contradictoire. | Génériques. | Confidentialité et contacts. | Ancien SIRET Mouaad ; identité/carte/garantie SAFTI erronées ; le texte dit LEVOIS non-agence mais le schema dit `RealEstateAgent` LEVOIS. | **CORRIGER P0** dès pièces reçues ; retirer immédiatement les identifiants faux lors de la prochaine mise en production. |
| R20 | Indexable. | Oui. | Oui. | Graphe global. | Opt-out + génériques. | Email/CNIL. | Ne décrit pas Géoplateforme ni toute la donnée acheteur/rue ; affirme un consentement que plusieurs payloads ne prouvent pas. | **CORRIGER P0** avant amplification. |
| R21 | `noindex`. | Non. | Oui. | Graphe global malgré nature interne. | Génériques, polluant la mesure publique. | Aucune continuité métier. | Page interne publiquement routable. | **SUPPRIMER** du build public ou protéger par environnement. |
| R22 | Pas de `noindex`. `/404/` fait 308 vers `/404`, puis `/404` répond 200. | Non. | Oui. | Graphe global ; canonical `/404/`, qui redirige. | Génériques ; pas d’événement 404. | Plusieurs routes utiles. | **Soft-404 live** avec canonical vers une URL redirigée. | **CORRIGER P1** : vraie réponse 404, `noindex`, canonical supprimée/appropriée. |
| R23 | La variante live `/merci/` répond 404 ; le dépôt prévoit une 301 exacte `/merci`. | Non. | Page 404 sur la variante testée. | Hérite de R22. | Aucun propre. | Aucun. | Gestion slash/redirect non cohérente ; `robots.txt` bloque en plus `/merci`. | **CORRIGER** : tester les deux variantes, décider si continuité historique réelle, puis aligner production et dépôt. |

### 1.3. Routes et composants qui ne sont pas en production

| Élément | État exact | Observation | Décision |
|---|---|---|---|
| `/recommander` | **Branche de travail uniquement** ; absent de `main`. | Promet 10 % via SAFTI Connect ; taux, code et conditions doivent être reverifiés. Le footer et le sitemap de la branche l’exposent déjà. | **DIFFÉRER**. Aucun rôle dans l’architecture client cœur. |
| `/rejoindre` | **Branche de travail uniquement** ; absent de `main`. | Acquisition de candidats conseillers, non de clients ; statut et sources officielles incomplets. | **DIFFÉRER**. Ne doit pas gouverner la navigation principale. |
| `/cockpit/*` (9 routes) | **Branche privée versionnée**, non publiée par `main`. | Outil opérationnel avec données privées, `noindex,nofollow,noarchive`, sécurité et D1 production non validés. | **DIFFÉRER** et exclure entièrement du sitemap, schema, analytics public et Phase 1. |
| `WorldGateway.astro` et `JourneyImmersion.astro` | **Composants de branche**. | Le premier force une hiérarchie acheteur ; le second réintroduit une expérience cinématographique et des H1 multiples. | **DIFFÉRER** ; ne pas en déduire l’architecture éditoriale validée. |
| `EvidenceHero.astro` | **Composant présent sur `main`/production**. | Capital de preuve DVF riche et statique. | **CONSERVER** comme bloc de preuve sous le premier écran universel, pas comme substitut d’identité. |
| `/buy-os-lab`, `/tomas-terrain`, `/visual-lab`, `/visual-lab/mr-30` | **Fichiers locaux non suivis**, donc explorations. | Prototypes privés ; Tomas contient des biens réels. | **DIFFÉRER** et exclure de toute publication. La mission maintient l’interdiction de rouvrir BUY OS. |
| `/immobilier/chartres`, `/immobilier/leves`, `/immobilier/mainvilliers` | **Envisagées, inexistantes**. | Architecture locale demandée ; décision commune par commune en section 6.4. | Lèves **CRÉER** comme pilote ; Chartres **CRÉER** comme page de données sans claim de service non prouvé ; Mainvilliers **PLACER EN TROISIÈME POSITION** et publier seulement si la réponse quantitative est distincte et non clonée. |

### 1.4. Routes API : frontière de produit et de mesure

| Route | État | Rôle | Risque prouvé | Décision Phase 1 |
|---|---|---|---|---|
| `/api/lead` | Production. | Contact, vendeur, rue et audit vers Resend/Formspree. | Le consentement n’est exigé/vérifié que pour l’audit ; provenance incomplète ; aucun événement serveur de succès. | **CONSERVER** le contrat, spécifier consentement versionné, attribution et succès métier. Aucun code dans cette phase. |
| `/api/recherche` | Production, enrichie sur la branche. | Persistance D1 et notification du parcours acheteur. | Un booléen générique ne prouve pas trois finalités ; supervision de notification absente du plan de mesure. | **CONSERVER** et intégrer la spécification de consentement/attribution. |
| `/api/audit-url` | Production. | Lecture ponctuelle d’une URL publique avec secours si portail bloqué. | Résultat dépendant du portail ; limitation en mémoire par instance. | **CONSERVER** ; c’est une dépendance de R07, pas une page SEO. |
| `/api/cockpit/*` | Branche privée. | BFF cockpit. | Environnement réel non validé. | **DIFFÉRER**, hors périmètre. |

## 2. Source de vérité Mouaad–SAFTI–LEVOIS

### 2.1. Tableau de preuve et formulations autorisées

| Information | Formulation actuellement utilisée | Source | Niveau de preuve | Risque | Formulation provisoire autorisée | Justificatif nécessaire pour figer |
|---|---|---|---|---|---|---|
| Nom public | « Mouaad Boullourou » | E1 ; BODACC B2026014746 publié le 5 août 2026. | **VÉRIFIÉ** | Faible. | **Mouaad Boullourou** | Aucun pour l’usage courant. |
| Qualité immobilière | « Conseiller immobilier indépendant SAFTI » | E1 affiche « Conseiller SAFTI » à Lèves. | **VÉRIFIÉ** seulement pour « conseiller immobilier SAFTI ». | Moyen si le lien contractuel ou l’adjectif est surinterprété. | **Conseiller immobilier SAFTI à Lèves et alentours.** | Attestation/mandat SAFTI en cours pour « indépendant » ou « sous mandat ». |
| « Indépendant » | Config, profil, footer et légal. | `src/config/site.ts:14`, `/mouaad`, footer. | **HYPOTHÈSE PROVISOIRE** pour la formulation professionnelle complète. | Moyen. | L’omettre dans la phrase courte. | Attestation SAFTI précisant la qualité exacte. |
| Entrepreneur individuel | « Mouaad Boullourou — Entrepreneur individuel » | BODACC relie le nom au SIREN ; API officielle `est_entrepreneur_individuel: true`. | **VÉRIFIÉ** | Faible sur le fond, élevé si associé au mauvais établissement. | **Mouaad Boullourou — entrepreneur individuel** dans les mentions juridiques. | Attestation RNE récente à archiver. |
| Agent commercial | « Sous mandat de SAFTI » sans numéro RSAC. | Le site ; aucune attestation RSAC accessible. | **À FOURNIR PAR MOUAAD** | Élevé : qualité réglementée. | Ne pas employer « agent commercial ». | Attestation RSAC/RNE actuelle + mandat SAFTI ou attestation d’habilitation. |
| RSAC | Aucun numéro publié. | Le BODACC confirme **RCS Chartres**, pas RSAC. | **À FOURNIR PAR MOUAAD** | Élevé ; RCS et RSAC ne sont pas interchangeables. | Aucune mention provisoire. | Attestation portant explicitement « RSAC » et greffe compétent. |
| SIREN | Sous-jacent au SIRET public. | BODACC B2026014746. | **VÉRIFIÉ** : `824 194 419`. | Faible. | **SIREN 824 194 419**. | Attestation RNE pour le dossier de preuve. |
| SIRET Mouaad | `824 194 419 00027` dans `src/pages/mentions-legales.astro:20`. | API officielle mise à jour le 29 août 2026 : `00027` fermé le 22 juin 2026 ; `00043` actif depuis le 1er août 2026. | **VÉRIFIÉ : formulation actuelle obsolète** | **CRITIQUE**. | Retirer `00027`. Préférer temporairement le SIREN ; ne publier `00043` qu’après confirmation. | Attestation RNE confirmant que `00043` porte bien l’activité et le site. |
| Activité enregistrée | « Intermédiation immobilière ». | API officielle : code APE déclaré `68.31Z`, établissement actif. | **VÉRIFIÉ** pour la classification statistique APE, pas pour un mandat ou une habilitation. | Moyen. | **Code APE déclaré : 68.31Z** dans le légal seulement. | RNE + pièce SAFTI pour la nature contractuelle. |
| Secteur minimal | Lèves, Chartres et bassin chartrain. | E1. | **VÉRIFIÉ** pour **Lèves et alentours**. | Faible. | **À Lèves et alentours.** | Aucun pour cette formulation minimale. |
| Chartres/Mainvilliers + sept communes | « Lèves, Chartres, Mainvilliers, Lucé, Champhol, Le Coudray, Luisant ». | `src/config/site.ts:10-11`, `/mouaad` ; aucune preuve officielle individuelle. | **À FOURNIR PAR MOUAAD** | Moyen : surpromesse locale, schema et GBP incohérents. | Formulation de travail autorisée par la DG : **« Lèves, Chartres et alentours »**. « Bassin chartrain » reste une aire éditoriale étudiée, pas une zone de service de substitution. | Liste écrite des communes réellement desservies + exemples anonymisés si une expertise terrain est revendiquée. |
| Adresse publique ou masquée | Aucune adresse de Mouaad sur LEVOIS. | Confirmation opérationnelle de Mouaad le 31 août 2026 : aucun lieu d’accueil physique ouvert au public. | **VÉRIFIÉ PAR DÉCLARATION DE MOUAAD** | Élevé si une adresse privée ou administrative est publiée par déduction. | Ne publier aucune adresse d’accueil et conserver l’adresse masquée. Aucun horaire n’est déduit. | Aucun tant que cette organisation ne change pas. |
| Téléphone | `07 81 38 01 21`. | LEVOIS et profil officiel SAFTI concordent ; Mouaad confirme le 31 août 2026 que le numéro peut être publié pour les appels et les SMS. | **VÉRIFIÉ** | Faible tant que la ligne reste contrôlée. | **07 81 38 01 21 — appels et SMS.** | Aucun ; révision seulement en cas de changement opérationnel. |
| Email | `mouaad@levois.fr`. | LEVOIS (`src/config/site.ts:7`, `/contact`) ; Mouaad confirme le 31 août 2026 que l’adresse est fonctionnelle et consultée régulièrement. | **VÉRIFIÉ PAR DÉCLARATION OPÉRATIONNELLE** | Faible ; la délivrabilité des formulaires reste une vérification technique séparée. | **mouaad@levois.fr** | Aucun pour la publication de l’adresse ; le flux formulaire reste soumis à son propre test technique. |
| Réception physique | Aucun lieu d’accueil physique ouvert au public. | Confirmation opérationnelle de Mouaad le 31 août 2026. | **VÉRIFIÉ PAR DÉCLARATION DE MOUAAD** | Élevé si une adresse, des horaires ou une disponibilité permanente sont inventés. | **Aucun accueil à une adresse publique. Les modalités d’un échange sont convenues avec Mouaad selon la situation.** | Aucun tant qu’aucun lieu public n’est ouvert. |
| Nature de LEVOIS | « Sa méthode… ni agence indépendante, ni réseau ». | `/mentions-legales` ; aucune déclaration de **LEVOIS** comme nom commercial ou enseigne n’a été vérifiée. La notice BODACC consultée porte un autre nom commercial, potentiellement historique ou incohérent avec l’activité actuelle. | **HYPOTHÈSE PROVISOIRE** pour la qualification juridique ou commerciale ; définition publique V1 validée. | Élevé si LEVOIS signe ou se présente comme agence ; le nom BODACC ne doit pas davantage être figé sans RNE actuel. | **LEVOIS est la démarche et l’ensemble d’outils d’aide à la compréhension et à la décision portés par Mouaad dans le cadre de son activité de conseiller immobilier SAFTI. LEVOIS n’est ni une agence autonome, ni un réseau, ni un produit officiellement édité par SAFTI.** | Attestation RNE actuelle précisant nom commercial/enseigne, s’il existe, et autorisation/règles SAFTI d’usage des marques. |
| Lien contractuel LEVOIS–SAFTI | « Sous mandat de SAFTI » ; « cadre professionnel SAFTI ». | Référencement SAFTI officiel, contrat non public. | **HYPOTHÈSE PROVISOIRE** | Élevé si relation/responsabilités mal décrites. | **Mouaad Boullourou est référencé comme conseiller immobilier SAFTI. LEVOIS ne constitue pas une agence ni un réseau.** | Mandat/attestation SAFTI + validation du vocabulaire autorisé. |
| Identité légale SAFTI recopiée | LEVOIS : SAS, SIRET `522 869 935 00026`, CPI `9401…`, Gentilly et « garantie financière : GALIAN ». | E3, consultée le 30 août 2026 : SIRET `523 964 328 00026`, RCS Toulouse, CPI `3101 2018 000 025 936` et, exactement, « Garantie Responsabilité Civile Professionnelle : GENERALI IARD » ; API officielle concordante pour le SIRET. | **VÉRIFIÉ : bloc LEVOIS incorrect** | **CRITIQUE** : une responsabilité civile professionnelle ne doit pas être présentée comme une garantie financière. | Ne plus utiliser le bloc actuel ; lier la source SAFTI ou reprendre uniquement les mentions juridiquement requises après validation. | Copie datée E3 + validation de ce que LEVOIS doit reproduire, dont la nature exacte des garanties/assurances exigées. |
| Formulation footer | « Conseiller immobilier indépendant · Réseau SAFTI » ou « au sein du réseau ». | Footer local et production ; E1 ne prouve pas tous les termes. | **HYPOTHÈSE PROVISOIRE partielle** | Moyen. | **Mouaad Boullourou · Conseiller immobilier SAFTI · Lèves et alentours.** | Pièce SAFTI avant « indépendant », « agent commercial » ou « sous mandat ». |
| Formulation données structurées | `Organization` LEVOIS + `RealEstateAgent` nommé LEVOIS + `Person.jobTitle=indépendant` + `worksFor=SAFTI` + sept communes. | `src/layouts/Layout.astro:64-103`. | **HYPOTHÈSE PROVISOIRE contradictoire** | Élevé : le schema transforme LEVOIS en agent/agence et suggère un emploi. | Temporairement : `WebSite` publié par la `Person` Mouaad ; `jobTitle: Conseiller immobilier`, `sameAs` vers le profil SAFTI. Ajouter `affiliation` seulement après validation du lien exact. Pas de `RealEstateAgent`, `LocalBusiness`, adresse ni sept communes. | Statut LEVOIS, pièce SAFTI, zone réelle et modèle GBP. |
| Formulation Google Business Profile | La fiche existe et Mouaad peut l’administrer. | Confirmation opérationnelle de Mouaad le 31 août 2026 ; configuration détaillée non inspectée dans ce registre. | **VÉRIFIÉ** pour l’existence et la capacité d’administration ; **À INSPECTER** pour la configuration exacte. | Élevé en cas d’adresse personnelle visible, de mauvais nom ou de modification non contrôlée. | Ne déduire ni adresse, ni horaires, ni disponibilité permanente. Toute future copy reste alignée sur le noyau public validé. | Lien Maps direct et inventaire en lecture seule de la configuration avant toute modification distante. |

### 2.2. Décision spécifique Google Business Profile

- Le nom doit refléter l’activité telle qu’elle existe réellement dans les documents, le site et la signalétique. L’audit ne choisit donc pas arbitrairement entre « LEVOIS », « SAFTI : Mouaad Boullourou » ou une autre forme.
- Mouaad a confirmé qu’il ne reçoit pas de clients dans un lieu ouvert au public : l’adresse doit rester masquée et la fiche doit fonctionner en zone desservie. Aucun horaire ou accueil permanent n’est déduit.
- La continuité accueil ↔ GBP est spécifiable dès maintenant : même nom validé, même téléphone, même URL marquée, même zone réelle, mêmes services et aucune promesse absente de la fiche.

### 2.3. Pièces exactes à demander une seule fois

1. Attestation RNE de moins de trois mois montrant SIREN, SIRET actif, forme, activité et éventuel nom commercial/enseigne.
2. Attestation RSAC explicite, si cette qualité doit être publiée.
3. Mandat ou attestation SAFTI en cours + formulation publique autorisée + éventuelle attestation d’habilitation/carte collaborateur.
4. Capture/PDF daté des mentions légales SAFTI retenues pour le site.
5. Lien de partage direct de la fiche Google, place ID et captures de tous les champs listés dans le tableau.
6. Réponse écrite « accueil physique : oui/non » ; aucune adresse personnelle n’est demandée dans ce dossier.
7. Confirmation du téléphone, test de la boîte `mouaad@levois.fr` et engagement réaliste de délai de réponse.
8. Liste des communes réellement desservies, distinguée des communes simplement couvertes par les données DVF.

## 3. Matrice complète des cinq sources d’acquisition

Chaque variante ci-dessous correspond à une intention réellement distincte. Les champs 1 à 10 sont dans le premier tableau ; les champs 11 à 15 dans le second.

### 3.1. Contexte, promesse, destination et premier écran

| ID | Source / intention | 1. Contexte d’arrivée | 2. Connaissance de Mouaad | 3. Intention | 4. Question principale | 5. Promesse qui provoque l’arrivée | 6. Destination recommandée | 7. Premier écran attendu | 8. Preuve nécessaire | 9. CTA principal | 10. CTA secondaire |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A01 | Carte remise après échange | Conversation récente à prolonger. | Moyenne à forte. | Variable, souvent encore ouverte. | « Qui est-il exactement et quelle suite m’avait-il proposée ? » | Retrouver Mouaad et choisir la suite adaptée. | `/carte` | Photo/nom, « conseiller immobilier SAFTI à Lèves et alentours », rappel simple, trois situations. | Profil SAFTI, téléphone concordant, zone minimale. | Choisir : acheter / vendre / comprendre les ventes locales. | Appeler ou écrire. |
| A02 | Carte trouvée dans un commerce | Contact physique indirect, pas de conversation. | Faible. | Faible à moyenne. | « Qui est Mouaad et pourquoi cette carte est-elle ici ? » | Une aide immobilière locale claire, sans engagement forcé. | `/carte` | Identité, statut, zone, utilité de LEVOIS, aucune supposition de projet. | Identité SAFTI + preuve locale datée. | Choisir sa situation. | Voir Mouaad/contact. |
| A03 | Encart « ventes dans votre rue » | QR depuis un imprimé local. | Nulle à faible. | Curiosité locale ou vente latente. | « Quelles ventes ont réellement eu lieu autour de chez moi ? » | Voir des ventes DVF autour d’une adresse et leurs limites. | `/votre-rue` | Même promesse que l’encart, source/date, champ adresse, confidentialité géocodeur. | DVF, licence, date d’extraction, rayon, limites. | Voir les ventes autour de mon adresse. | Comprendre la méthode sans saisir d’adresse. |
| A04 | Encart « mon annonce n’avance pas » avec URL déjà publiée | Vendeur actif reconnaissant un symptôme. | Faible. | Forte. | « Où l’intérêt se perd-il ? » | 3 réponses, 2 actions, résultat avant coordonnées. | `/audit-annonce` | URL + durée/signal/contexte, limite d’automatisation. | Fonctionnement réel du lecteur/fallback, confidentialité URL. | Auditer mon annonce. | Situer ma vente sans lien. |
| A05 | Encart vente encore non publiée | Propriétaire préparant ou hésitant. | Faible. | Moyenne. | « Quelle est ma prochaine vérification ? » | Une première lecture adaptée à mon stade. | `/situer-ma-vente?s=preparer` ou sélecteur. | Situation correspondante, valeur avant contact, durée réelle. | Moteur déterministe et limites. | Faire le point. | Lire la ressource lancement. |
| A06 | Encart « recherche confuse » | Acquéreur se reconnaissant dans un problème. | Faible. | Moyenne à forte. | « Que dois-je vraiment améliorer ou arbitrer ? » | Transformer une recherche confuse en critères et vérifications utiles. | `/ma-recherche` | Question vécue, résultat avant coordonnées, temps estimé, correction possible. | Logique adaptative réelle ; aucun faux diagnostic. | Mettre ma recherche au clair. | Lire une page-réponse acheteur liée. |
| A07 | Vidéo acheteur sur un usage concret | La vidéo a déjà enseigné une idée. | Faible à moyenne. | Informationnelle → exploratoire. | Exemple : « 10 m² de plus améliorent-ils vraiment mon quotidien ? » | Appliquer l’idée à son logement actuel. | Future page-réponse acheteur « surface utile/usages », puis `/ma-recherche`. | Reprise exacte de l’idée, réponse directe, mini-cas, pas de redémarrage générique. | Exemple honnête, distinctions usage/surface, limites. | Tester ce que la surface doit changer. | Continuer dans `/ma-recherche`. |
| A08 | Vidéo vendeur sur un signal | Une cause ou erreur vient d’être expliquée. | Faible à moyenne. | Informationnelle avec problème réel. | « Est-ce aussi ce qui se passe pour mon annonce ? » | Localiser la prochaine vérification, sans conclure au prix trop vite. | Ressource exacte R14–R18 ou `/audit-annonce`. | Résumé de la vidéo + opération à faire sur son cas. | Source/nuance de la règle, date, auteur. | Appliquer la grille/l’arbre. | Auditer/situer la vente. |
| A09 | Vidéo locale/DVF | Le visiteur a vu un chiffre ou une comparaison. | Faible. | Curiosité locale. | « D’où vient ce chiffre et vaut-il pour mon bien ? » | Voir la donnée complète, sa date et ses limites. | Page locale de la commune ; `/votre-rue` ensuite. | Chiffre daté, taille d’échantillon, types de biens, réponse directe. | Dataset téléchargeable, méthode, licence. | Voir les données de la commune. | Voir autour de mon adresse. |
| A10 | Google — recherche « Mouaad Boullourou » | Recherche de personne, vérification après recommandation/rencontre. | Moyenne. | Forte sur la confiance, variable sur le projet. | « Qui est-il, quel est son statut et comment le joindre ? » | Une fiche d’identité professionnelle vérifiable. | `/mouaad` | Nom, statut sûr, Lèves et alentours, moyen de contact confirmé, profil SAFTI. | SAFTI, RNE légal, même identité et coordonnées confirmées partout. | Contacter Mouaad. | Choisir acheteur/vendeur/local. |
| A11 | Google Business Profile — bouton Site | Fiche déjà consultée. | Moyenne. | Locale, souvent forte. | « Que peut-il faire pour moi maintenant ? » | Poursuivre exactement les services de la fiche. | `/` avec UTM GBP. | Même nom/statut/zone/téléphone ; trois situations et contact visible. | Capture GBP + cohérence site/SAFTI. | Choisir sa situation. | Appeler/écrire. |
| A12 | Google — « conseiller immobilier Lèves/Chartres » | Recherche de service local. | Nulle. | Forte. | « Accompagne-t-il acheteurs et vendeurs ici, et pourquoi lui ? » | Conseiller local identifiable + preuve + action immédiate. | `/` ou page locale/service selon requête. | Mouaad, statut, zone prouvée, services, preuve locale, contact. | Profil SAFTI, données locales, activité réelle. | Choisir acheter/vendre. | Voir profil/contact. |
| A13 | Google — « prix immobilier / ventes rue / commune » | Recherche d’information, pas nécessairement de conseiller. | Nulle. | Informationnelle à commerciale latente. | « Quels sont les prix réellement observés ici et leurs limites ? » | Réponse locale datée et vérifiable. | `/immobilier/leves` ou `/immobilier/chartres`; `/votre-rue` pour adresse. | Réponse chiffrée, période, N, maisons/appartements, limite. | DVF + méthode + date + auteur. | Lire la réponse locale. | Tester une adresse/échanger. |
| A14 | Google — problème vendeur précis | Recherche « annonce vue peu de contacts », « baisser prix », etc. | Nulle. | Moyenne à forte. | Question identique au titre de la ressource. | Réponse directe + prochaine vérification. | R13–R18 selon requête, puis outil. | Réponse en 1–2 phrases, ce qui est certain/incertain, action. | Sources/heuristiques étiquetées, auteur/date. | Utiliser la checklist/l’arbre. | R05/R07/contact. |
| A15 | Assistant IA — question locale précise | Une conversation détaillée précède le clic. | Nulle à faible. | Informationnelle qualifiée. | Ex. « Comment savoir si une maison est trop chère à Lèves ? » | Confirmer la question, répondre, montrer preuves et limites. | Page-réponse locale exacte, pas l’accueil. | Question exacte, réponse directe, date, source, méthode, limite. | DVF + données locales + auteur + corroboration externe. | Appliquer la prochaine vérification. | `/votre-rue` ou échange. |
| A16 | Assistant IA — arbitrage acheteur | La personne a déjà décrit sa situation au modèle. | Nulle à faible. | Exploratoire mais riche. | « Rester près de Chartres ou s’éloigner pour gagner une pièce ? » | Comparer deux conséquences concrètes et expliciter l’information manquante. | Page-réponse/comparateur acheteur, puis `/ma-recherche`. | Reprise de l’arbitrage, deux scénarios, aucune conclusion automatique. | Hypothèses de trajet/coût étiquetées ; données locales si utilisées. | Comparer les scénarios. | Construire la synthèse acheteur. |
| A17 | Publicité conversationnelle — service général | Message sponsorisé dans un environnement IA, si accès/politique/ciblage confirmés plus tard. | Nulle. | Dépend du message ; doit rester service général. | Celle portée par l’annonce, jamais un bien précis. | Continuité exacte annonce → outil/page. | `/ma-recherche`, `/votre-rue`, R05 ou R07 selon création. | Même promesse, statut pub non ambigu, résultat avant contact. | Validation plateforme, ciblage local, conformité immobilière, landing vérifiable. | Démarrer l’expérience annoncée. | Lire la méthode/contact. |

### 3.2. Scénario de maturation, attribution et conversion

| ID | 11. Si la personne n’est pas décidée | 12. Paramètres d’attribution | 13. Événement de conversion | 14. Lead qualifié | 15. Rupture actuelle |
|---|---|---|---|---|---|
| A01 | Profil Mouaad + choix des trois situations, sans formulaire. | `utm_source=carte`, `utm_medium=offline_qr`, `utm_campaign=always_on`, `utm_content=remise_main`; identifiant de version imprimée. | `door_selected`; puis appel/email/demande réussie. | Demande immobilière explicite + moyen de réponse valide + zone/situation exploitable. | `/carte` est seller-first et `src=carte` disparaît. |
| A02 | Preuve locale puis profil, sans supposer une rencontre. | Même schéma, `utm_content=commerce_<id>` sans nom de personne. | Consultation preuve + choix de porte ; pas un lead au simple scan. | Même définition A01. | La page parle comme si une relation existait déjà. |
| A03 | Lire méthode/source et garder le résultat local sans être relancé. | `utm_source=encart`, `utm_medium=print_qr`, campagne `prix_rue`, contenu = support/emplacement/version. | `experience_result_viewed`; lead seulement après demande réussie. | Propriétaire/acheteur du secteur + intention/horizon ou question explicite + contact consenti. | Source forcée à `QR /votre-rue`, aucun événement résultat/succès, géocodage non déclaré. |
| A04 | Consulter les deux actions et la ressource sans transmettre. | Encart/print + campagne `annonce_bloquee` + création/version. | `audit_result_viewed`; puis `exchange_requested`/`lead_submitted`. | URL ou contexte réel + stade/signal + demande humaine et contact valide. | Mesure audit correcte, mais first/last touch non persistées. |
| A05 | Ressource lancement et possibilité de revenir. | Encart + campagne `preparer_vente` + contenu/version ; conserver deep link `s`. | `seller_result_viewed`; puis sauvegarde/échange. | Propriétaire ou mandataire du bien + situation en périmètre + prochaine action explicite. | Aucun tunnel vendeur ni attribution durable. |
| A06 | Résultat complet et modification de réponse ; page-réponse acheteur. | Encart + campagne `recherche_claire`; contenu/version. | `buyer_result_viewed`, `answer_changed`, puis demande/envoi. | Projet d’achat réel + zone compatible ou à clarifier + amélioration recherchée + contact consenti. | Parcours actuel ne suit pas la structure validée et plusieurs réponses ne changent rien. |
| A07 | Cas interactif, checklist de visite ou sauvegarde de l’idée. | Réseau réel (`instagram`, `facebook`, `youtube`, etc.), `organic_social`, campagne série, `utm_content=<video_id>`. | `content_next_action_identified`; puis entrée buyer. | Seulement si demande d’aide explicite après valeur ; une lecture n’est pas un lead. | Contenus acheteurs intermédiaires absents. |
| A08 | Ressource connexe exacte, pas retour générique accueil. | Réseau + `organic_social`/`paid_social`, campagne thème, vidéo/création. | Expérience démarrée/complétée/résultat ; puis demande qualifiée. | Propriétaire + signal réel + besoin de prochaine vérification/échange. | Ressources statiques promettent parfois test/grille sans outil réel. |
| A09 | Consulter source/méthode et comparer le type de bien. | Réseau + contenu vidéo ; conserver commune comme propriété de page, pas PII. | `local_answer_viewed` puis `street_tool_started`. | Curiosité seule = non-lead ; demande sur achat/vente local + contact = lead. | Pages locales inexistantes ; `/votre-rue` noindex. |
| A10 | Voir preuves/méthode et revenir par situation. | Référent Google organique, `landing_path=/mouaad`; pas d’UTM inventée. | `phone_clicked`, `email_clicked`, `contact_succeeded`. | Demande relevant du service/zone, identité/contact valides. | Profil incomplet factuellement et global schema contradictoire. |
| A11 | Choisir une situation ou lire le profil sans démarrer un diagnostic. | URL GBP : `utm_source=google`, `utm_medium=organic`, `utm_campaign=gbp`, `utm_content=website`. | Porte choisie, appel/email ou lead réussi. | Même A10, avec source déclarée conservée. | GBP non auditable ; accueil ne prolonge pas encore toutes les informations attendues. |
| A12 | Lire la page locale/profil et voir les preuves. | Référent Google + landing ; GBP seulement si UTM GBP. | Consultation preuve + porte ; lead réussi. | Projet acheteur/vendeur + commune desservie + prochaine action + contact. | Statut/zone exacts non figés ; accueil incomplet. |
| A13 | Lire méthode et limites, tester l’adresse sans obligation de contact. | Référent Google ; requête seulement via Search Console agrégée, jamais dans l’événement visiteur. | `local_answer_viewed`, `street_result_viewed`; lead seulement après demande. | Intention achat/vente déclarée, pas simple vue de prix. | Pas de pages locales ; meilleur outil non indexé. |
| A14 | Ressource suivante cohérente ou outil exact. | Référent Google + landing_path ; campagne seulement si Ads future. | Prochaine action identifiée, outil complété, demande réussie. | Signal de vente réel + bien/zone + volonté d’agir ou d’échanger. | Auteur/date/sources absents ; généralités trop affirmatives. |
| A15 | Conserver la réponse, vérifier la source, poser la prochaine question. | `utm_source=chatgpt.com` si fourni ; sinon `referrer_host` normalisé (`chatgpt.com`, `perplexity.ai`, `bing.com`) + landing. | Réponse consultée + prochaine action ; pas le clic seul. | Question locale + projet explicite + demande humaine/contact. | Pages-réponses locales manquantes ; entité fragile ; robots Cloudflare à monitorer. |
| A16 | Comparateur/scénario et synthèse modifiable. | Même logique A15 ; ne pas stocker la conversation ou le prompt. | Comparaison complétée, réponse modifiée, synthèse consultée. | Projet réel + arbitrage identifié + demande d’aide, pas simple usage. | Contenus acheteurs et parcours adaptatif insuffisants. |
| A17 | Résultat sans coordonnées, retargeting non supposé. | `utm_source=<plateforme>`, `utm_medium=cpc`, `utm_campaign`, `utm_content`, `utm_id`; identifiant clic seulement après validation privacy/plateforme. | Résultat consulté, demande réussie, lead qualifié et issue commerciale. | Critères de la porte choisie + contact consenti + zone réelle. | Canal non lancé ; disponibilité/ciblage/politique à reverifier avant toute campagne. |

### 3.3. Décisions transversales d’acquisition

- Une source n’a pas une landing unique : c’est **source + intention + promesse** qui détermine la destination.
- Une recherche du nom « Mouaad Boullourou » va vers l’entité `/mouaad`; une recherche « prix immobilier à Lèves » va vers une réponse locale. Elles ne partagent ni premier écran ni conversion.
- L’accueil reçoit les arrivées ambiguës ; il n’absorbe pas les promesses précises d’un encart, d’une vidéo, d’une requête ou d’une publicité.
- Aucun scan, clic ou résultat consulté n’est automatiquement un lead.

## 4. Contrat de chaque porte

### 4.1. `/` — porte universelle

- **À qui / état d’esprit :** personne arrivant sans promesse plus précise, depuis le nom, le GBP, une recommandation ou une URL directe ; elle veut d’abord comprendre qui, où et pour quoi.
- **Question traitée :** « Mouaad peut-il m’aider à acheter, vendre ou comprendre le marché local, et comment commencer ? »
- **Compréhension en cinq secondes :** « Mouaad Boullourou, conseiller immobilier SAFTI à Lèves et alentours. LEVOIS aide à clarifier un achat, préparer ou relire une vente et comprendre les ventes locales. »
- **Valeur délivrée :** orientation sans formulaire + première preuve locale datée + accès immédiat au contact.
- **Ne doit pas :** forcer `/ma-recherche`, retarder l’identité et les portes, présenter LEVOIS comme agence, surcharger de communes, masquer l’accès au contact.
- **CTA principal :** **Mettre ma recherche au clair** peut porter la priorité visuelle acquéreur. **Faire le point sur ma vente** et **Voir les ventes locales** restent immédiatement visibles au premier écran.
- **CTA secondaire :** **Contacter Mouaad**.
- **Entrées :** accès direct, recherche marque/service, GBP marqué, liens internes génériques.
- **Sorties :** `/ma-recherche`, `/situer-ma-vente`, `/votre-rue`, `/mouaad`, `/contact`, pages locales/réponses.
- **Preuves :** profil SAFTI, formulation de statut validée, source/date/limites DVF ; coordonnées seulement après confirmation opérationnelle.
- **Informations minimales :** nom, statut sûr, zone sûre, acheteur + vendeur + local, différence LEVOIS, accès au contact et absence de confusion agence/réseau.
- **Indexation :** indexable, canonical `/`, sitemap.
- **Relation contenus :** hub vers pages locales et pages-réponses ; la preuve DVF `EvidenceHero` reste un bloc secondaire fort.
- **Formulation démonstrative, non copy finale :** « Vous partez de ce que vous vivez. LEVOIS vous aide à comprendre ce que cela change pour votre achat ou votre vente — avec des repères locaux et leurs limites. »

### 4.2. `/carte` — rappel après contact physique

- **À qui / état d’esprit :** personne ayant rencontré Mouaad ou trouvé son support imprimé ; confiance initiale variable, intention inconnue.
- **Question traitée :** « Qui est Mouaad et quelle prochaine action correspond à ma situation ? »
- **Compréhension en cinq secondes :** identité, statut, Lèves et alentours, contexte « vous venez d’une carte », trois situations.
- **Valeur délivrée :** retrouver la conversation et être orienté sans recommencer par un formulaire vendeur.
- **Ne doit pas :** supposer que la personne vend, dire que le contexte est transmis avant coordonnées, dupliquer la page `/mouaad`.
- **CTA principal :** **Choisir ma situation** avec trois portes.
- **CTA secondaire :** **Appeler ou écrire à Mouaad**.
- **Entrées :** QR ou URL imprimée avec version/emplacement.
- **Sorties :** trois outils + `/mouaad` + `/contact`.
- **Preuves :** profil SAFTI, coordonnées, éventuelle photo réellement actuelle.
- **Informations minimales :** même identité que l’accueil/GBP ; rappel de confidentialité et absence d’engagement forcé.
- **Indexation :** cible `noindex,follow`, hors sitemap ; URL maintenue sans limite de durée.
- **Relation contenus :** porte d’orientation, pas page locale ni article.

### 4.3. `/ma-recherche` — traducteur de projet acquéreur

- **À qui / état d’esprit :** acquéreur confus, en préparation ou actif, qui voit des annonces sans savoir ce qui doit réellement guider ses choix.
- **Question traitée :** « Qu’est-ce que mon achat doit changer, que dois-je préserver, assouplir ou vérifier ? »
- **Compréhension en cinq secondes :** parcours de clarification, valeur avant coordonnées, réponses modifiables, pas de diagnostic certain.
- **Valeur délivrée :** synthèse distinguant déclaration, interprétation, incertitude et prochaine vérification.
- **Ne doit pas :** demander la typologie avant les usages, faire d’une réponse décorative, réduire la faisabilité au budget/surface, convertir toute priorité non choisie en flexibilité, cacher le résultat derrière un contact.
- **CTA principal :** **Mettre ma recherche au clair** puis **Voir ma synthèse**.
- **CTA secondaire :** **Modifier une réponse** ; après résultat seulement : **M’envoyer la synthèse** ou **Échanger avec Mouaad**.
- **Entrées :** encart/vidéo acheteur, page-réponse, accueil, assistant IA, publicité de service future.
- **Sorties :** synthèse privée, contenus acheteurs, demande d’envoi/échange, contact.
- **Preuves :** règles de branchement documentées, DVF daté quand utilisé, niveau de prudence visible.
- **Informations minimales :** sept blocs validés ; occupation ; dépendance de vente uniquement si propriétaire ; amélioration et usages ; cadre réel ; arbitrage concret ; raison du choix ; information manquante.
- **Indexation :** aucune URL publique de résultat. La route reste `noindex,follow` tant qu’elle ne possède pas une couche HTML substantielle utile sans commencer le questionnaire ; elle pourra devenir indexable ensuite. À défaut, une page acquéreur éditoriale distincte portera la visibilité organique.
- **Relation contenus :** pages-réponses acheteurs sont indexables et alimentent le parcours ; le parcours ne remplace pas leur réponse statique.

### 4.4. `/votre-rue` — preuve DVF autour d’une adresse

- **À qui / état d’esprit :** personne curieuse de son secteur, propriétaire encore non décidé, acheteur local ou vendeur actif.
- **Question traitée :** « Quelles ventes ont été enregistrées autour de cette adresse, et que peut-on raisonnablement en déduire ? »
- **Compréhension en cinq secondes :** donnée DVF, période, rayon, maisons/appartements, résultat personnel non public, adresse envoyée au géocodeur.
- **Valeur délivrée :** transactions, distribution, évolution, exemple de dernière mutation, taille d’échantillon et limites avant contact.
- **Ne doit pas :** promettre la « dernière maison » lorsque le résultat ne garantit pas ce type, produire une estimation individuelle, appeler « rue » un rayon sans le dire, forcer une qualification vendeur après le résultat.
- **CTA principal :** **Voir les ventes autour de mon adresse**.
- **CTA secondaire :** **Comprendre les données et leurs limites** ; après résultat, prochaine action selon intention.
- **Entrées :** encart/QR, page locale, vidéo donnée, Google/assistant sur ventes de rue.
- **Sorties :** résultat local, page méthode DVF, page commune, R05/R07, `/ma-recherche`, contact.
- **Preuves :** DVF DGFiP/Etalab, date d’extraction, rayon réel, N, types, licence, limites.
- **Informations minimales :** adresse seulement pour géocodage ; aucune coordonnée pour voir le résultat ; consentement distinct pour transmission.
- **Indexation :** maintenir `noindex` jusqu’à correction. Cible : base éditoriale indexable et canonical `/votre-rue` une fois complète ; aucune adresse ni résultat personnel dans l’URL, le sitemap ou le HTML public.
- **Relation contenus :** chaque page locale explique la commune et renvoie vers l’outil ; une page méthode DVF statique explique calcul et limites.

### 4.5. `/situer-ma-vente` — orientation vendeur par situation

- **À qui / état d’esprit :** propriétaire avant publication, nouvellement publié, peu contacté, visité sans offre ou longtemps exposé.
- **Question traitée :** « Quelle est la prochaine vérification rationnelle dans ma situation ? »
- **Compréhension en cinq secondes :** sélectionner son stade, répondre à 3–5 questions, recevoir une lecture avant contact.
- **Valeur délivrée :** observation déclarée, hypothèse principale et alternative, manque d’information, prochaine action et contenu associé.
- **Ne doit pas :** diagnostiquer la valeur, auto-avancer sans retour, dupliquer l’audit d’une URL, exiger un tunnel neuf.
- **CTA principal :** **Choisir ma situation** puis **Voir ma première lecture**.
- **CTA secondaire :** **Lire la ressource liée** ; après résultat **Demander une lecture humaine**.
- **Entrées :** accueil, carte, ressources, recherche/Ads situationnelles, audit sans URL.
- **Sorties :** résultat privé R06, ressource contextualisée, R07 si annonce publiée, contact.
- **Preuves :** moteur déterministe testable, formulations de prudence, règles de branchement.
- **Informations minimales :** stade, réponses nécessaires à l’hypothèse ; jamais les coordonnées avant la lecture.
- **Indexation :** indexable si une réponse statique, les cinq situations, la méthode et les limites restent visibles ; résultat R06 `noindex`.
- **Relation contenus :** chaque situation est reliée à une page-réponse ; les ressources renvoient au deep link pertinent.

### 4.6. `/mouaad` — source d’identité vérifiable

- **À qui / état d’esprit :** personne qui vérifie Mouaad après recherche, GBP, recommandation, carte ou contenu.
- **Question traitée :** « Qui est Mouaad, quel est son statut exact, où intervient-il et comment travaille-t-il ? »
- **Compréhension en cinq secondes :** nom, statut sûr, zone sûre, acheteur + vendeur, LEVOIS distinct de SAFTI, coordonnées.
- **Valeur délivrée :** preuve d’identité, limites de rôle, méthode humaine et accès direct.
- **Ne doit pas :** inventer adresse, horaires, avis, RSAC, sept communes ou relation contractuelle ; rester seller-only.
- **CTA principal :** **Choisir acheter / vendre / comprendre le local**.
- **CTA secondaire :** **Contacter Mouaad**.
- **Entrées :** recherche du nom, GBP, carte, footer, contenu signé.
- **Sorties :** contact et trois portes.
- **Preuves :** profil SAFTI, RNE/BODACC pour le légal, documents à fournir, photo/coordonnées cohérentes.
- **Informations minimales :** formulation sûre, rôle de LEVOIS, services, zone prouvée, téléphone/email testés.
- **Indexation :** indexable, sitemap ; future `ProfilePage`/`Person` cohérente avec le visible.
- **Relation contenus :** auteur/relecteur des contenus et jeux de données, avec lien retour depuis chaque page.

### 4.7. `/contact` — sortie humaine universelle

- **À qui / état d’esprit :** personne qui veut poser une question ou convenir d’une suite sans passer par un outil.
- **Question traitée :** « Comment joindre Mouaad et que se passera-t-il après ? »
- **Compréhension en cinq secondes :** téléphone, email, formulaire, délai réaliste, absence ou non d’appel automatique selon confirmation.
- **Valeur délivrée :** accès direct et attentes opérationnelles claires.
- **Ne doit pas :** renvoyer prioritairement tous les visiteurs vers le vendeur, perdre la provenance, promettre 24–48 h sans engagement réel.
- **CTA principal :** **Envoyer mon message**.
- **CTA secondaire :** **Appeler** ou **envoyer un email**.
- **Entrées :** toutes routes, GBP, recherche de nom.
- **Sorties :** confirmation, retour éventuel vers la porte pertinente.
- **Preuves :** coordonnées testées, délai confirmé, consentement versionné.
- **Informations minimales :** objet/situation ; prénom, email et message ; téléphone facultatif ; question déclarative de source facultative.
- **Indexation :** indexable ; sitemap possible mais faible priorité.
- **Relation contenus :** reçoit le contexte de la porte et de la dernière prochaine action, pas les réponses sensibles dans l’analytics.

### 4.8. `/audit-annonce` — mini-expérience spécialisée

- **À qui / état d’esprit :** vendeur dont l’annonce est publique et dont le signal est insuffisant ou incompris.
- **Question traitée :** « Que dit déjà mon annonce et quelles deux vérifications faire maintenant ? »
- **Compréhension en cinq secondes :** URL + trois réponses ; deux actions ; résultat avant coordonnées ; limite si portail fermé.
- **Valeur délivrée :** actions contextualisées, faits utilisés, limite et ressource pertinente.
- **Ne doit pas :** estimer le bien, prétendre voir ce que le portail bloque, dupliquer R05, demander contact avant résultat.
- **CTA principal :** **Analyser mon annonce**.
- **CTA secondaire :** **Situer ma vente sans lien** ou lire la ressource.
- **Entrées :** encart, recherche vendeur, R05/R14–R18, social, future publicité de service.
- **Sorties :** résultat, ressource, lecture humaine consentie.
- **Preuves :** description du fetch/fallback, données utilisées, limites, URL non conservée avant demande humaine.
- **Informations minimales :** URL, durée, signal, contexte ; coordonnées après résultat seulement.
- **Indexation :** indexable grâce à la couche éditoriale statique ; résultat de session non indexable.
- **Relation contenus :** page pivot pour R14/R15/R17 ; R05 reste la porte quand aucune annonce n’est publiée.

## 5. Audit conversationnel de `/ma-recherche`

### 5.1. Deux états audités

- **Production (`main@cb0ab22`) :** introduction, motif, typologie, contrainte/zone, budget, surface, lecture DVF, priorités, arbitrage conditionnel, synthèse, coordonnées, confirmation. Pas d’instrumentation de tunnel effectivement écoutée par l’analytics de `main`.
- **Branche (`795908e`) :** ajoute communes libres, temps de trajet, financement, vente préalable, horizon et consentements distincts. Ces ajouts sont utiles comme contexte, mais ne réparent pas la structure métier.
- **Invariant de calcul :** la fonction d’analyse de la branche reçoit seulement `data`, `type`, `secteur`, `budget`, `surface` (`src/pages/ma-recherche.astro:619-634`). La production utilise la même logique fondamentale. Le reste ne peut donc pas être présenté comme ayant modifié cette analyse.

### 5.2. Relevé écran/question par écran/question

| Écran/question actuelle | Ce qui est demandé | Pourquoi l’information existe | Influence réelle dans le code | Modifie la restitution ? | Décision | Embranchements/réponses sans effet et information absente | Intervention attendue du « traducteur en direct » |
|---|---|---|---|---|---|---|---|
| Introduction | Aucun champ ; promesse de « stratégie » et confrontation marché. | Donner une raison de commencer et rassurer sur les coordonnées. | Charge le parcours/DVF ; aucune personnalisation. | Non. | **REFORMULER** et conserver l’engagement « résultat avant coordonnées ». | N’annonce ni correction facile, ni distinction déclaration/interprétation/limite ; réduit déjà la recherche à marché/budget/surface. | Avant le départ : « Commencez par ce que l’achat doit changer ; LEVOIS vous aidera ensuite à regarder les contraintes. » |
| Motif actuel : premier achat, agrandissement, changement de cadre, investissement, rapprochement, autre | « Qu’est-ce qui vous amène à chercher aujourd’hui ? » | Nommer une situation vécue. | La valeur est stockée ; elle n’entre pas dans `analyser`. | Principalement un libellé dans la synthèse. | **CONSERVER, DÉPLACER ET ENRICHIR** dans « situation/logement actuel » ; ne pas en faire le niveau d’avancement. | Aucun embranchement propre à premier achat/investissement/agrandissement ; « autre » sans voie d’explication structurée. Niveau d’avancement absent. | « Vous ne cherchez pas seulement un autre bien : vous cherchez à changer ___ ; nous devons encore préciser ce qui doit s’améliorer au quotidien. » |
| Typologie : maison/appartement/les deux | Type recherché. | Filtrer le dataset DVF. | Filtre effectivement les transactions. | Oui, sur quartiles/médiane. | **DÉPLACER** après les usages ; conserver comme contrainte ou hypothèse, pas comme point de départ. | Aucune option « je ne sais pas encore » explicite ; aucun lien avec usages. | « Vous associez aujourd’hui ce besoin à une maison ; cela reste une hypothèse de solution tant que les usages ne sont pas décrits. » |
| Secteur contraint + Chartres intramuros ou ensemble de la zone | Si une contrainte impose un secteur, puis zone binaire. | Choisir le sous-ensemble DVF. | `chartres` filtre Chartres ; toute autre réponse agrège sept communes très différentes. | Oui, mais de façon grossière. | **CONSERVER DANS LE CADRE DE RÉALITÉ ET RECONSTRUIRE** les branches. | Une contrainte « oui » ne distingue pas emploi, école, aidant, garde ou préférence ; l’agrégat « toute zone » masque les écarts communaux. | « Ce lieu semble lié à ___ ; nous ne savons pas encore si la contrainte porte sur une commune, un trajet ou une personne. » |
| Communes libres (branche) | Noms libres de communes. | Nuancer la zone binaire. | N’entre pas dans `analyser`. | Affichage éventuel seulement ; ne change pas la lecture chiffrée. | **CONSERVER MAIS RENDRE OPÉRATIONNEL** ou supprimer du parcours. | Réponse actuellement décorative face à la promesse de personnalisation ; aucune validation de commune. | « Vous ouvrez la recherche à ___ ; la donnée affichée reste pour l’instant celle de la zone agrégée, pas de ces seules communes. » |
| Temps de trajet maximal (branche) | 10, 15, 20, 30+ minutes. | Représenter une contrainte concrète. | N’entre pas dans le calcul et n’est relié à aucun point de départ. | Résumé au mieux, sans conséquence. | **RECONSTRUIRE** : demander « depuis où/vers quoi » sans adresse précise, puis utiliser dans un arbitrage. | Sans destination, un temps de trajet est vide ; aucune donnée de mobilité ni scénario. | « Vous accepteriez jusqu’à ___ pour gagner ___ ; ce compromis reste à tester sur deux trajets réels. » |
| Financement (branche) | Cadré / estimé / à préciser. | Évaluer le cadre de réalité. | N’entre pas dans l’analyse DVF ; influence une prochaine action textuelle. | Oui, faiblement et après coup. | **CONSERVER** dans « cadre de réalité », avec option d’incertitude. | Ne distingue pas budget total, frais, travaux, apport ; « accord de principe » peut être surinterprété. | « Le budget est un repère [cadré/estimé], pas encore une capacité d’achat garantie ; il faut encore intégrer ___. » |
| Vente préalable (branche) | Non / oui / peut-être. | Savoir si l’achat dépend d’une vente. | N’entre pas dans le calcul ; influence un conseil de suite. | Oui, faiblement. | **DÉPLACER ET CONDITIONNER** à la réponse « propriétaire » ; ajouter « je ne sais pas encore ». | Demandée à tout le monde ; occupation locataire/propriétaire/hébergé/temporaire absente ; pas de branche propriétaire. | « Votre achat [dépend/ne semble pas dépendre] d’une vente ; nous ne demandons ni adresse ni valeur à ce stade. » |
| Horizon (branche) | 0–3, 3–6, 6–12 mois, exploration. | Calibrer le rythme et le stade. | N’entre pas dans la lecture de marché ; peut influencer le texte de suite. | Faiblement. | **CONSERVER** mais le distinguer du **niveau d’avancement** (simple idée, veille, visites, offre, etc.). | Horizon temporel ≠ avancement concret ; aucune branche « une offre/un bien déjà identifié ». | « Votre horizon est ___, mais votre niveau d’avancement est encore ___ ; cela change la prochaine vérification, pas la valeur des biens. » |
| Budget global | Montant unique. | Produire budget/m² et surface théorique à la médiane. | Variable centrale du calcul. | Oui, fortement. | **CONSERVER DANS LE CADRE DE RÉALITÉ**, préciser ce qu’il inclut et autoriser une fourchette/incertitude. | Frais de notaire, travaux, charges et réserve non distingués ; un montant précis donne une fausse précision. | « Cette enveloppe permet seulement un repère historique ; elle ne dit pas encore quels biens sont disponibles ni leur état. » |
| Surface habitable minimale | Nombre de m². | Calculer budget/m² et surface au prix médian. | Variable centrale du calcul. | Oui, fortement. | **DÉPLACER APRÈS AMÉLIORATION + USAGES**, conserver comme conséquence et non point de départ. | Aucune question sur pièces, moments de friction, télétravail, extérieur, rangement, évolution familiale ; « minimum acceptable » peut être arbitraire. | « Vous avez traduit votre besoin en ___ m² ; nous devons vérifier si ce chiffre vient d’un usage ou d’une habitude de recherche. » |
| Lecture de marché DVF | Position budget/surface face aux quartiles 2021–2025. | Apporter une preuve locale avant contact. | Calcul réel sur transactions historiques filtrées grossièrement. | Oui ; c’est le cœur du résultat. | **CONSERVER LA DONNÉE, REFORMULER L’INTERPRÉTATION** et afficher N/période/type/zone. | Ne connaît ni offre actuelle, état, terrain, charges, travaux, frais, micro-localisation. « Cohérent » et « le marché offre » sont trop affirmatifs. | « Observation : votre ratio se situe ___. Cela pourrait signifier ___. Autres explications : ___. Il manque ___. Prochaine vérification : ___. » |
| Priorités à « préserver » (1 à 3 parmi localisation, surface, cadre, état, délai, budget) | Sélection de priorités. | Construire une synthèse de préférences. | Ne change pas la donnée ; alimente le récit. Tout non-sélectionné devient `flexible` (`src/pages/ma-recherche.astro:908-925`). | Oui, mais avec une inférence invalide. | **RECONSTRUIRE** : séparer « essentiel », « souhaité », « réellement assouplissable », « je ne sais pas ». | Ne pas choisir n’est pas accepter d’assouplir ; restriction à trois force de faux arbitrages ; aucune raison demandée. | « Vous avez dit que ___ est essentiel. Rien ne permet encore de conclure que ___ est flexible ; il reste à tester. » |
| Arbitrage conditionnel | Si ratio sous Q1 : préserver localisation, surface ou les deux. | Résoudre une tension budget/surface. | Apparaît seulement sous le premier quartile ; modifie un texte narratif. | Oui, narrative uniquement. | **RECONSTRUIRE** avec deux scénarios concrets de même prix + « aucun » + « pourquoi ». | N’existe pas pour d’autres tensions ; option « préserver les deux » renvoie à l’humain sans apprendre ; « ce profil existe moins fréquemment » n’est pas calculé. | Avant choix : prédire la conséquence. Après choix : reformuler le gain accepté, le coût accepté et l’information à vérifier. |
| Synthèse actuelle | Situation, décisions, axes, marché, action. | Délivrer la valeur avant coordonnées. | Agrège le state, y compris des réponses peu ou pas actives. | Oui. | **RECONSTRUIRE SELON QUATRE SORTIES** : doit changer / préserver / pourrait assouplir / à décider-vérifier. | Ne sépare pas assez « déclaré », « interprété » et « impossible à conclure » ; certitudes non étiquetées. | Chaque bloc porte une étiquette : « clair d’après vos réponses », « semble important », « impossible à conclure ». |
| Activation / coordonnées | Choix de suite et coordonnées/consentements. | Envoyer la synthèse, matcher ou demander une lecture. | La branche persiste D1 et notifie ; la production est moins instrumentée. | Après la valeur, ce qui est correct. | **CONSERVER APRÈS RÉSULTAT**, expliquer précisément chaque finalité et l’action de Mouaad. | « 15 minutes », sans engagement, absence d’appel automatique et délai doivent être confirmés ; l’attribution est réduite à `src`. | « Si vous choisissez ___, Mouaad recevra ___ et fera ___ ; il ne fera pas ___ » seulement après validation opérationnelle. |
| Confirmation | Accusé de réception. | Fermer la boucle. | Confirme la soumission. | Oui, opérationnelle. | **CONSERVER ET FIABILISER** sur succès serveur réel. | Ne doit pas promettre un envoi/rappel si la notification échoue. | Résumer ce qui a été demandé, délai confirmé, canal et moyen de modifier/annuler. |

### 5.3. Matrice « réponse → effet réel »

| Réponse | Effet actuel réel | Verdict |
|---|---|---|
| Motif/situation | Libellé de synthèse ; pas de branche métier ni calcul. | **Effet insuffisant**. |
| Typologie | Filtre le dataset maison/appartement. | **Effet réel**, mais demandé trop tôt. |
| Secteur | Chartres seul ou agrégat de sept communes. | **Effet réel mais trop grossier**. |
| Contrainte de secteur | Ouvre une question ; nature de la contrainte inutilisée. | **Effet d’interface seulement**. |
| Communes libres | Ne filtre pas la donnée. | **Aucun effet analytique**. |
| Temps de trajet | Aucun calcul/scénario. | **Aucun effet analytique**. |
| Financement | Texte de prochaine action. | **Effet narratif limité**. |
| Vente préalable | Texte de prochaine action, sans condition propriétaire. | **Effet narratif mal branché**. |
| Horizon | Résumé/rythme textuel. | **Effet narratif limité**. |
| Budget + surface | Calculent budget/m², quartiles, surface à médiane. | **Effet central, surpondéré**. |
| Priorités sélectionnées | Récit ; les autres deviennent à tort flexibles. | **Effet réel mais conclusion invalide**. |
| Arbitrage | Récit de synthèse sous condition Q1. | **Effet réel mais cas trop abstrait et trop rare**. |

### 5.4. Conclusions actuelles à abaisser d’un cran

| Formulation/type actuel | Pourquoi elle dépasse les données | Formulation de prudence attendue |
|---|---|---|
| « Votre budget est cohérent avec les prix constatés » | Un ratio budget/surface dans les quartiles historiques ne valide ni frais, travaux, état, stock ni micro-localisation. | « Votre ratio se situe dans la moitié centrale des ventes historiques retenues. Cela ne suffit pas à confirmer la faisabilité. » |
| « Le marché offre typiquement X m² pour Y € » | Les DVF décrivent des ventes passées, pas l’offre disponible ni le coût total d’achat. | « À la médiane historique retenue, Y € correspondrait arithmétiquement à environ X m², avant frais, travaux et différences de biens. » |
| « Vous dépassez 75 % des prix constatés » | Le percentile du €/m² n’est pas un pouvoir d’achat ni une disponibilité. | « Votre ratio est supérieur au troisième quartile des €/m² de l’échantillon historique. » |
| « Ce profil existe moins fréquemment » | Aucune fréquence de profils répondant aux critères n’est calculée. | Supprimer, ou calculer et documenter la fréquence avant publication. |
| « Les critères non choisis sont flexibles » | Une absence de sélection n’est pas un consentement à céder. | « Ces critères n’ont pas encore été classés. » |

### 5.5. Écarts par rapport aux sept blocs validés

| Structure validée | Capital actuel récupérable | Écart à combler avant script final |
|---|---|---|
| 1. Niveau d’avancement | Horizon de branche. | Ajouter stade concret : idée, veille, visites, bien identifié/offre ; ne pas confondre date et avancement. |
| 2. Situation et logement actuel | Motif d’achat + vente préalable. | Ajouter locataire/propriétaire/hébergé/temporaire/à préciser ; conditionner la vente préalable ; décrire logement actuel sans adresse/valeur. |
| 3. Amélioration attendue | « Agrandissement », « cadre », « rapprochement ». | Demander le changement vécu attendu, avec possibilité d’expliquer et incertitude. |
| 4. Usages avant typologie | Aucun. | Introduire moments/activités/pièces qui créent la friction ; seulement ensuite traduire en type/surface. |
| 5. Cadre de réalité | Zone, trajet, budget, financement, horizon. | Clarifier chaque donnée, la faire agir, distinguer contraintes vérifiées/hypothèses et expliciter les limites du DVF. |
| 6. Arbitrage utile | Priorités + choix localisation/surface. | Passer à scénarios concrets équivalents, demander pourquoi, proposer « aucun », varier la tension selon réponses. |
| 7. Lecture avant coordonnées | Synthèse et activation après résultat. | Réorganiser en quatre sorties, niveaux de certitude et prochaines vérifications ; conserver correction avant envoi. |

**Décision finale du parcours : RECONSTRUIRE.** Conserver l’URL, le principe de valeur avant contact, le dataset, l’infrastructure D1/consentements et les éléments de restitution prudents. Ne pas rédiger le script final avant validation de ce relevé d’écarts.

## 6. Architecture SEO local et visibilité IA

### 6.1. État actuel et cible technique/éditoriale

| Dimension | État actuel vérifié | Cible arbitrée |
|---|---|---|
| Indexation | Pages éditoriales, accueil, contact, carte et outils vendeurs indexables ; `/ma-recherche`, `/votre-rue`, R06 et `/composants` en `noindex`. `/404` n’a pas de `noindex` explicite. | Indexer seulement les pages qui répondent intégralement dans le HTML. Garder parcours/résultats privés en `noindex`. `/carte` devient `noindex,follow`; `/votre-rue` ne devient indexable qu’après complétude de sa couche statique. |
| Sitemap | Sitemap manuel de `main` avec 17 URL ; pas de `lastmod`; divergence déjà créée sur la branche. En live, ses URL sans slash font un 308 alors que les canonical finissent par `/`; les liens internes reproduisent souvent ce détour. | Générer ou tester automatiquement contre les routes indexables et publier directement les URL canoniques finales ; exclure résultats, carte, 404, composants, cockpit et labs ; ajouter des dates exactes seulement si fiables. |
| `robots.txt` | Le fichier versionné ne désautorise que `/merci`. La production Cloudflare sert une politique différente : `search=yes`, `ai-train=no`, désautorisations par user-agent, mais aucun signal `ai-input` observé. Robots.txt reste volontaire et ne prouve pas l’accès effectif. | Documenter Cloudflare comme source servie, aligner dépôt/production, contrôler WAF/logs et réponses 2xx. Ne pas assimiler `search=yes` à une autorisation des résumés IA et ne jamais utiliser robots pour masquer des données sensibles : elles ne doivent pas être publiées. |
| Canonical | `src/layouts/Layout.astro:33` compose domaine + pathname, donc retire les paramètres. Même logique sur pages `noindex` et 404. | Canonical auto-référente pour pages publiques ; paramètres attribution exclus. Aucun résultat personnel indexable. 404 : `noindex` et pas de canonical de contenu normal. |
| Titres | Système unique via Layout ; plusieurs titres génériques (« Accueil », « Contact », « Accompagnement »). Audit seul cible explicitement Chartres. | Titre = question/service + localité seulement si la page le prouve. Ex. accueil : « Mouaad Boullourou, conseiller immobilier SAFTI à Lèves — LEVOIS » ; local : « Prix immobiliers à Lèves : ventes DVF 2021–2025 — LEVOIS ». |
| H1 | R05 comporte déjà plusieurs H1 selon l’état du parcours ; la branche ajoute `JourneyImmersion` et aggrave ce défaut. R07 possède déjà un `main` imbriqué ; la branche ajoute un H1 via l’immersion. | Un H1 qui porte la question principale de la page ; questions d’étapes en H2/legend ; un seul repère `main`. Aucun préambule cinématographique concurrent. |
| HTML sans JS | Accueil, profils, méthode, ressources, FAQ et couches statiques de R04/R07 sont lisibles. Les questions/résultats de R03, R05/R06 et résultats de R04/R07 sont JS. | Toute page indexable fournit question, réponse directe, explication, exemple, sources, date, auteur, limites et prochaine action dans le HTML initial. La personnalisation peut rester JS si l’essentiel n’est pas caché. |
| Liens explorables | Navigation et maillage utilisent principalement de vrais `<a>`. Les étapes de parcours utilisent des boutons, ce qui est normal. | Chaque page indexable reçoit au moins un lien depuis un hub et renvoie par liens HTML vers méthode/source, contenu suivant, outil et entité. Aucun maillage critique uniquement en JS. |
| Données structurées globales | `WebSite + Organization LEVOIS + Person + RealEstateAgent LEVOIS`. Le `RealEstateAgent` contredit les mentions visibles et porte sept communes non prouvées. | Avant pièces : `WebSite` publié par `Person` Mouaad, `sameAs` SAFTI, `affiliation` prudente ; retirer `RealEstateAgent`/`LocalBusiness`/adresse/zone étendue. Ajouter uniquement des types page-spécifiques visibles. |
| Données structurées page | Accueil `Dataset`; R07 `WebApplication + FAQPage`; hub `ItemList`; ressources `Article` sans dates. | Local : `WebPage + BreadcrumbList + Dataset` si chiffres visibles. Ressource : `Article` avec auteur/date publiés visiblement. Outil : `WebApplication` si fonctionnement et limites visibles. FAQ seulement pour FAQ visible. `Service` après validation juridique du service. |
| Auteur | Ressources ont un auteur dans le JSON-LD seulement ; profil Mouaad séparé. | Auteur/relecteur visible, lien `/mouaad`, rôle exact. Si donnée automatisée : responsable éditorial + méthode de génération séparés. |
| Dates | Dataset daté (`sourceGeneratedAt` 24 juillet 2026 ; mutations jusqu’au 31 décembre 2025). Ressources/méthode/FAQ sans date de vérification. | Afficher « publié », « vérifié le » et politique de mise à jour ; `dateModified` ne change que lors d’une révision réelle. Données : date d’extraction et dernière mutation distinctes. |
| Sources | Accueil/R04 citent DVF ; ressources et méthode n’ont pas de références externes par affirmation. | Lien vers source primaire près du fait ; les conseils LEVOIS sont étiquetés conseil/interprétation. Une règle non sourcée devient « repère de travail », pas vérité du marché. |
| Limites méthodologiques | Bon capital dans `dvf-market-summary.json`, R04, R06 et R07. Inégal ou absent ailleurs. | Bloc standard : observé / pourrait signifier / autres explications / information manquante / prochaine vérification. |
| Maillage interne | Très vendeur ; buyer/local peu reliés. Header n’expose pas les trois portes ; ressources renvoient surtout R05/accompagnement. | Maillage situationnel décrit en 6.5. Acheteur, vendeur et local restent trois chemins distincts reliés par accueil, entité et méthode. |
| Pages locales | Aucune route `/immobilier/*`. | Créer Lèves, puis Chartres quantitative ; placer Mainvilliers en troisième position et ne la publier que si sa réponse est distincte, même sans module terrain. |
| Pages-réponses | Six pages vendeurs seulement. | Conserver/enrichir ces six ; ajouter un petit corpus acheteur et une méthode DVF, pas une production massive. |
| Outils interactifs | R03/R04/R05/R07 ; R04 et R03 `noindex`. R07 est le meilleur exemple de valeur + limite + relais. | Outils distincts des contenus mais reliés. Un outil indexable conserve toute la réponse essentielle dans le HTML. |

### 6.2. Statuts d’URL cibles, disjoints et exhaustifs

| Statut | URL actuelles/cibles | Règle |
|---|---|---|
| **1. Pages publiques destinées à être indexées** | `/`, `/mouaad`, `/contact`, `/methode`, `/accompagnement`, `/ressources`, R13–R18, `/audit-annonce`, base publique de `/situer-ma-vente`, futures `/immobilier/leves` et `/immobilier/chartres`, pages-réponses acheteurs et page méthode DVF ; base de `/votre-rue` après correction. | Réponse complète dans le HTML initial, auteur/date/sources/limites, canonical propre, sitemap et maillage. La page Chartres ne porte aucun claim de service ou d’expertise terrain avant preuve. |
| **2. Outils publics pouvant rester non indexés** | `/carte` ; temporairement `/ma-recherche` et la base de `/votre-rue`. | Valeur accessible aux personnes, mais pas promue comme document de référence tant que la couche statique n’est pas suffisante. `/carte` reste `noindex,follow`. `/ma-recherche` pourra sortir de cette classe si elle fournit une couche HTML substantielle utile avant le questionnaire ; sinon une page-réponse acquéreur distincte porte l’organique. |
| **3. Résultats et états personnels jamais publics** | `/situer-ma-vente/resultat`, synthèse acheteur, résultat d’adresse, résultat d’audit et toute future URL/état de simulation. | Aucun paramètre, URL ou HTML serveur contenant réponses ou PII ; `noindex`, hors sitemap, aucun schema de page publique et contrôle de cache adapté. Quand le résultat vit sur une base indexable, seule sa couche éditoriale générique est crawlable. |
| **4. Pages légales et de confidentialité** | `/mentions-legales`, `/confidentialite`. | Publiques et reliées depuis le footer ; cible `noindex,follow`, canonical propre, hors sitemap. Elles restent accessibles aux personnes et assistants par lien direct. |
| **5. États techniques et de confirmation** | `/404`, `/merci` et variantes historiques. | Une absence renvoie réellement 404 ; une confirmation n’est accessible qu’après succès ou redirige proprement. Toujours `noindex`, hors sitemap, sans canonical vers un faux contenu public. |
| **6. Interfaces internes, privées ou exploratoires** | `/composants`, `/cockpit/*`, BUY OS, Tomas, Visual Lab, routes de démonstration. | Supprimer du build public ou protéger ; aucun sitemap, schema public ni analytics marketing. `noindex` seul n’est pas une protection. |

Les **contenus statiques citables** ne forment pas une classe d’URL concurrente : c’est une couche éditoriale transverse obligatoire sur les pages de statut 1 et sur toute base d’outil appelée à y entrer. Elle comprend la méthode DVF, les pages locales, les pages-réponses vendeur/acheteur, la méthode LEVOIS et les explications de R04/R07 ; question et réponse essentielles restent indépendantes de l’interactivité, avec liens source directs, version et limites.

### 6.3. Directives robots réellement servies le 30 août 2026

| Robot/usage | Directive observée dans le robots.txt servi | Décision |
|---|---|---|
| Googlebot | Non désautorisé. | **CONSERVER** pour la recherche ; confirmer l’accès effectif par WAF/logs. |
| Bingbot | Non désautorisé. | **CONSERVER** pour la recherche ; confirmer l’accès effectif par WAF/logs. |
| `OAI-SearchBot` | Non désautorisé par la règle générique. | **CONSERVER** si l’objectif ChatGPT Search est confirmé ; vérifier WAF/logs. |
| `GPTBot` | Désautorisé explicitement. | **CONSERVER** si le refus d’entraînement est volontaire ; décision indépendante de `OAI-SearchBot`. |
| `PerplexityBot` | Non désautorisé par la règle générique. | **CONSERVER** pour la découvrabilité ; vérifier WAF/logs. |
| `ChatGPT-User` / `Perplexity-User` | Non spécifiquement désautorisés ; ils relèvent de requêtes déclenchées par l’utilisateur. | Ne pas les confondre avec indexation. Tester seulement l’accessibilité d’URL publiques. |
| `Google-Extended` | Désautorisé. | Documenter ce choix : il gouverne l’entraînement Gemini **et certains usages de grounding**, sans effet sur l’inclusion ni le classement Google Search. |
| `ClaudeBot` | Désautorisé explicitement. | **CONSERVER** si le refus d’entraînement Anthropic est volontaire. |
| `Claude-SearchBot` / `Claude-User` | Non spécifiquement désautorisés ; ils passent sous la règle générique observée. | Décider séparément recherche Claude et requêtes utilisateur ; confirmer l’accès par WAF/logs. |
| CCBot, Bytespider, Applebot-Extended | Désautorisés explicitement. | Maintenir ou modifier par choix de gouvernance, jamais comme « levier SEO ». |
| `OAI-AdsBot` | Non désautorisé par défaut. | Sans effet tant qu’aucune landing n’est soumise à une publicité. |

Ces directives expriment une préférence volontaire ; elles ne garantissent ni obéissance du robot ni accès technique. Cloudflare précise en outre que `search=yes` n’emporte pas les résumés IA et qu’aucun signal `ai-input` n’est ici exprimé. Actions de contrôle : exporter la configuration « Managed robots/content signals » Cloudflare, contrôler l’absence de règle WAF contraire et vérifier des accès 2xx dans les logs. L’absence de `llms.txt` n’est pas un manque bloquant : Google indique ne pas l’utiliser et ne demande aucun schema spécial pour ses fonctions IA (E5, E8).

### 6.4. Chartres, Lèves et Mainvilliers : preuve de différenciation

Les chiffres ci-dessous viennent du résumé filtré de production `src/data/dvf-market-summary.json`, dont la méthode exclut les surfaces nulles, dédoublonne les mutations et limite aux locaux d’habitation éligibles. Ils décrivent des ventes 2021–2025, pas une estimation actuelle.

| Commune | Capital quantitatif distinct | Différence éditoriale légitime | Preuve manquante | Décision |
|---|---|---|---|---|
| **Lèves** | 2025 : 38 maisons, médiane observée 2 353 €/m², qualité « forte » ; 29 appartements, 2 453 €/m², qualité « exploitable ». Sur 2021–2025 : 201 maisons vs 109 appartements éligibles. | Commune à dominante maison dans l’échantillon ; expliquer l’incertitude plus forte des appartements, la différence entre médiane/dispersion, et pourquoi une vente voisine ne vaut pas estimation. Lien naturel vers R04. | 2–3 observations terrain réelles et validées ; zone de service exacte. | **CRÉER** comme pilote local, avec données seules si les observations ne sont pas encore disponibles. Ne pas présenter Mouaad comme expert de chaque rue. |
| **Chartres** | 2025 : 188 maisons à 2 507 €/m² et 430 appartements à 2 448 €/m², deux séries « fortes ». Sur 2021–2025 : 983 maisons vs 2 398 appartements. | Volume et forte dominance appartement ; permettre une lecture séparée maison/appartement et montrer qu’une médiane commune masquerait la composition. Traiter les variations intra-communales seulement avec données prouvées. | Confirmation de desserte et cas/observations anonymisés uniquement pour ajouter un module de service ou d’expertise terrain. | **CRÉER** comme page-réponse quantitative distincte, après Lèves ou en parallèle. Jusqu’aux preuves, ne pas y revendiquer que Mouaad dessert Chartres ni présenter d’observations terrain. |
| **Mainvilliers** | 2025 : 71 maisons à 2 309 €/m² et 47 appartements à 2 267 €/m², séries « fortes » ; tendances annuelles différentes (-2,4 % vs +10,2 %), à interpréter prudemment. | Mix plus équilibré ; excellent cas pour expliquer pourquoi évolution annuelle et composition ne prouvent pas une tendance de valeur individuelle. | Une réponse quantitative réellement distincte et une lecture prudente de l’écart annuel ; activité/observations seulement si un module terrain est revendiqué. | **PLACER APRÈS LÈVES ET CHARTRES.** Préparer une page quantitative ; ne publier que si elle n’est pas clonée et n’ajouter aucun claim terrain sans preuve. |

Chaque page locale devra varier sur : question principale, composition maison/appartement, taille et qualité d’échantillon, dispersion, évolution et limite spécifique, cas local réel, arbitrage usager et prochaine action. Changer uniquement le nom de la commune est interdit.

### 6.5. Maillage cible

| Depuis | Vers | Raison du lien |
|---|---|---|
| Accueil | Trois portes + `/mouaad` + pages locales | Orienter une intention ambiguë et prouver l’entité. |
| Page locale | Méthode DVF, R04, page acheteur/vendeur pertinente, `/mouaad` | Passer du chiffre à la méthode, puis au cas personnel sans faire du chiffre une estimation. |
| Page-réponse vendeur | R05 ou R07 selon présence d’une annonce + ressource précédente/suivante | Transformer la compréhension en prochaine vérification. |
| Page-réponse acheteur | R03 + autre réponse du même arbitrage | Appliquer une notion à son projet et construire la synthèse. |
| R03/R04/R05/R07 | Méthode/source + contenu correspondant + contact | Garder une sortie utile sans formulaire et expliquer le résultat. |
| Résultat privé | Contenu exact + modification + demande humaine | Continuité situationnelle, pas retour générique. |
| Chaque contenu signé | `/mouaad` | Corroborer auteur/responsable et entité. |

### 6.6. Exigences minimales par contenu indexable

1. Une question humaine en H1.
2. Une réponse directe en une ou deux phrases.
3. L’explication du raisonnement, avec exemple.
4. Les faits distingués des interprétations, hypothèses et conseils.
5. Sources primaires accessibles et date de vérification.
6. Auteur ou responsable identifiable.
7. Limites, taille d’échantillon et période si données.
8. Une prochaine action cohérente, réalisable sans contact obligatoire.
9. Un lien HTML depuis un hub et vers la méthode/entité.
10. Schema correspondant exactement au texte visible, sans adresse, avis, horaires ou zone inventés.

## 7. Architecture de mesure

### 7.1. Ce qui existe et ce qui manque

**VÉRIFIÉ :** `src/scripts/analytics.ts` configure PostHog UE en mode cookieless, sans profil, autocapture, replay ni capture du texte/attributs. Il respecte DNT/GPC et retire les paramètres des URL envoyées. Les pageviews, sorties, clics de navigation, débuts/tentatives de formulaire et engagement sont présents. R07 possède une taxonomie métier détaillée ; la branche ajoute des événements de parcours acquéreur.

**Ruptures :**

- la première et la dernière source ne persistent pas ;
- les paramètres sont supprimés avant d’être normalisés ;
- `form_submitted` mesure une tentative DOM avant la réponse API, pas un formulaire réellement reçu ;
- téléphone et email sont noyés dans les clics de navigation ;
- R04 et R05 n’ont pas de tunnel métier ;
- la recherche d’adresse et le formulaire lead de R04 portent le même nom générique ;
- la provenance forcée `QR /votre-rue` est fausse pour les autres canaux ;
- il n’existe ni `lead_qualified` ni résultat commercial ;
- l’état réel des dashboards PostHog/GSC/GBP n’est pas accessible : **À FOURNIR PAR MOUAAD** si des historiques doivent être préservés.

### 7.2. Modèle d’attribution

| Dimension | Définition | Règle de conservation |
|---|---|---|
| Première source connue | Première source non directe reconnue pour le navigateur et consentie. | Ne jamais l’écraser. Sans consentement mesure : session seulement. Avec consentement : durée intersession limitée au minimum réellement utile, à fixer après revue de confidentialité ; **90 jours n’est plus une valeur décidée**. |
| Dernière source connue | Dernière source non directe reconnue avant conversion. | Mise à jour à chaque arrivée externe reconnue ; une visite directe ne remplace pas une dernière source non directe existante. |
| Porte d’arrivée | `landing_path` normalisé : accueil, carte, buyer, street, seller, audit, local, answer, mouaad, contact. | Dérivée de l’URL ; ne dépend pas de l’UTM. Première porte et porte de conversion séparées. |
| Campagne | `utm_campaign` et éventuellement `utm_id`. | Valeurs contrôlées, sans PII ni texte libre utilisateur. |
| Contenu/création | `utm_content` ou identifiant QR/vidéo/création. | Identifiant stable, pas le texte de la création. |
| Source déclarée | Réponse facultative « Comment nous avez-vous connu ? ». | Stockée avec le lead, séparée de l’attribution technique. |
| Référent | Domaine normalisé seulement. | Pas d’URL complète, chemin, query ni prompt. |

**Paramètres à accepter et normaliser :** `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_id`; `utm_term` seulement comme identifiant de ciblage configuré, jamais comme requête libre ; `src` maintenu temporairement pour compatibilité ; domaine référent, chemin d’entrée et horodatage. `gclid`, `gbraid`, `wbraid` et `msclkid` sont **DIFFÉRÉS** jusqu’à activation d’une campagne, revue de consentement et besoin de conversion offline.

**Durée :**

- contexte de navigation : `sessionStorage`, supprimé à la fermeture ;
- première/dernière touche cross-session : seulement après consentement de mesure, pour la durée minimale réellement utile confirmée après revue de confidentialité ; sinon aucune persistance cross-session ;
- attribution jointe à un lead : source/medium/campagne/contenu/portes/timestamps sous forme normalisée, conservés et supprimés avec le dossier du lead ; le plafond « trois ans » actuel reste à valider dans la politique, il n’est pas réinventé ici ;
- aucune synchronisation publicitaire ni retargeting n’est autorisé par cette architecture.

### 7.3. Taxonomie d’événements

Les noms ci-dessous sont la cible. Les événements historiques pourront être mappés, mais un même concept ne doit pas garder deux noms.

| Événement | Déclencheur exact | Propriétés utiles, non sensibles |
|---|---|---|
| `attribution_set` | Première normalisation d’une arrivée externe. | `touch=first/last`, source, medium, campaign_id/name, content_id, referrer_host, landing_path, entry_door. |
| `door_viewed` | Première vue d’une porte. | `door`, `landing_path`, attribution commune. |
| `door_selected` | Clic sur acheter/vendre/local/contact. | `from_door`, `selected_door`, `placement`, destination. |
| `content_answer_viewed` | Réponse directe réellement visible. | `content_id`, situation, page_type, localité dérivée de la page. |
| `experience_started` | Première action qui engage l’outil, pas simple pageview. | `experience_id`, version, entry_door. |
| `experience_step_viewed` | Étape rendue et focalisée. | `experience_id`, `step_id`, `step_number`, `branch_id`. |
| `experience_step_completed` | Réponse valide acceptée. | Mêmes propriétés + `was_skipped=false/true`; **pas la valeur de la réponse**. |
| `experience_answer_changed` | Une réponse déjà acceptée est modifiée. | `experience_id`, `step_id`, nombre de modifications. |
| `experience_completed` | Dernière étape nécessaire achevée. | `experience_id`, version, nombre d’étapes vues/complétées, durée active agrégée. |
| `experience_result_viewed` | Résultat effectivement affiché à l’écran. | `experience_id`, result_template/category non sensible, source_date si donnée. |
| `experience_result_saved` | Copie, impression, téléchargement ou sauvegarde réelle. | `experience_id`, `save_method`. |
| `experience_result_send_requested` | Clic explicite pour s’envoyer la synthèse. | `experience_id`, sans email. |
| `experience_next_action_identified` | La personne choisit/confirme une prochaine vérification. | `experience_id`, `action_id` contrôlé. |
| `phone_clicked` | Clic `tel:`. | `placement`, door/page, attribution ; jamais le numéro. |
| `email_clicked` | Clic `mailto:`. | `placement`, door/page ; jamais l’adresse ni le sujet. |
| `exchange_requested` | Clic qui ouvre/choisit une demande d’échange. | `experience_id` ou page, `request_type` contrôlé. |
| `lead_form_started` | Premier champ d’un vrai formulaire de contact. | `form_id` distinct (`contact`, `seller_result`, `street_lead`, `audit_human`, `buyer_send`, `buyer_exchange`). |
| `lead_submit_attempted` | Validation client réussie et requête envoyée. | `form_id`, `consent_version`, aucune PII. |
| `lead_submitted` | API confirme la réception/persistance utile. | `form_id`, `lead_correlation_id` aléatoire, request_type, attribution. |
| `lead_submit_failed` | API/notification/persistance échoue. | `form_id`, classe d’erreur contrôlée, retry possible. |
| `lead_created` | Événement serveur après création unique. | `lead_id` pseudonyme, porte, source, type de besoin. |
| `lead_qualified` | Mouaad ou une règle métier revue confirme la qualification. | `lead_id`, qualification_reason contrôlée, zone_fit oui/non/inconnu, project_type, stage. |
| `commercial_stage_updated` | Changement ultérieur documenté. | `lead_id`, stage précédent/nouveau, date, raison contrôlée. |

### 7.4. Définitions métier

- **Formulaire envoyé :** l’API a accepté le payload. Ce n’est pas encore un lead si spam/test/invalide.
- **Lead :** demande explicite reçue avec un moyen de réponse valide, consentement requis et contexte immobilier minimal. Un clic téléphone/email reste un signal, pas un lead prouvé.
- **Lead qualifié :** non-spam, besoin immobilier réel, zone de service « oui » ou « à confirmer », situation/prochaine action compréhensible et possibilité de reprendre contact. Le téléphone, un budget exact ou un délai court ne sont pas obligatoires.
- **Résultat commercial ultérieur :** `contacted`, `exchange_scheduled`, `exchange_held`, `project_qualified`, `accompaniment_started`, `transaction_in_progress`, `transaction_completed`, `closed_out_of_scope`, `closed_no_response`, `closed_other`. Le vocabulaire contractuel final dépendra du statut validé ; aucun CRM n’est construit ici.

### 7.5. Informations à ne pas collecter dans l’analytics

- nom, prénom, email, téléphone, message, commentaire ou texte libre ;
- adresse saisie ou adresse géocodée ;
- URL d’annonce ;
- budget, surface, situation d’occupation, financement ou vente préalable, même sous forme exacte ;
- contenu d’une réponse du parcours, prompt ou conversation avec un assistant ;
- URL de référent complète, query de recherche ou identifiants publicitaires avant autorisation ;
- données du cockpit ou du dossier commercial.

Les réponses nécessaires au service peuvent être transmises au lead après consentement, mais ne doivent pas être dupliquées dans PostHog.

### 7.6. « Comment nous avez-vous connu ? »

Question facultative, après que la personne a reçu la valeur et au moment du contact :

> Comment nous avez-vous connu ?

Choix : Google, fiche Google, ChatGPT, Copilot/Bing, Perplexity, vidéo, carte de visite, encart, recommandation, autre. « Autre » ouvre un texte court uniquement dans le dossier lead, jamais dans l’analytics.

Règle d’arbitrage :

- la **source déclarée prime pour l’origine de notoriété** quand le canal est hors ligne, cross-device, long ou indétectable ;
- la **dernière touche technique prime pour l’efficacité d’une campagne/clic mesurable** ;
- les deux restent conservées côte à côte ; aucune ne réécrit l’autre ;
- en cas de contradiction, le reporting dit « technique : X ; déclaré : Y » et ne fabrique pas une attribution unique.

Cas où la déclaration doit primer : carte transmise par un tiers, recommandation orale, vidéo vue sur un autre appareil, assistant IA dont le référent est masqué, lien copié/enregistré, retour direct plusieurs semaines après.

## 8. Système de contenus et d’expériences LEVOIS

### 8.1. Périmètre exhaustif du capital informatif

Le capital informatif public actuellement observable comprend :

- les trois blocs de l’accueil : preuve DVF, explication de méthode, orientation acheteur/vendeur/local ;
- les couches éditoriale et interactive de `/votre-rue`, `/situer-ma-vente`, son résultat, `/audit-annonce` et `/ma-recherche` ;
- `/methode`, `/accompagnement`, `/ressources` et les six ressources ;
- les explications d’identité de `/mouaad` et `/carte` ;
- les informations de conformité de `/mentions-legales` et `/confidentialite`.

`/contact`, `/404`, `/composants`, les aliases, API, cockpit et labs ne sont pas comptés comme capital éditorial central ; ils ont néanmoins tous reçu une décision explicite dans l’inventaire route par route. Aucun contenu public explicatif identifié n’est omis ci-dessous.

### 8.2. Audit éditorial et expérientiel — réponse, utilité et promesse réelle

| ID | Page/bloc | 1. Question humaine | 2. Public/situation | 3. Qualité de la réponse directe | 4. Ce que la personne comprend | 5. Ce qu’elle peut accomplir/décider | 16. Promesse du format vs livraison | Décision contenu |
|---|---|---|---|---|---|---|---|---|
| C01 | Accueil — preuve DVF | « Où se situent les ventes observées à Lèves/Chartres ? » | Acheteur/vendeur/local non décidé. | **Bonne**, chiffre, N, quartiles et limite. | Différence entre repère et estimation. | Choisir commune/type puis aller vers rue/vente/achat. | La preuve promise est réellement livrée. | **ENRICHIR** et déplacer sous l’identité universelle. |
| C02 | Accueil — méthode/limites | « Pourquoi le chiffre ne suffit-il pas ? » | Toute personne attirée par un prix. | **Bonne mais dispersée.** | Marché observé ≠ décision individuelle. | Aller vers un parcours humainement pertinent. | Réponse réelle, mais plusieurs concepts avant l’identité. | **CONSERVER COMME BLOC-RÉPONSE**, simplifier. |
| C03 | Accueil — orientation | « Par où commencer ? » | Arrivée ambiguë. | **Incomplète au premier écran desktop.** | Acheteur et vendeur sont servis ; Mouaad arrive trop tard. | Choisir des portes, mais CTA hors premier viewport desktop. | Promesse de hub seulement partiellement livrée. | **RÉÉCRIRE** selon contrat R01. |
| C04 | `/votre-rue` — méthode statique | « Que disent les DVF autour d’une adresse ? » | Curieux local, vendeur/acheteur. | **Bonne**, source/limites/rayon présents. | Donnée historique et limites. | Décider de lancer la recherche. | Réponse éditoriale réelle, malgré `noindex`. | **ENRICHIR** puis rendre indexable. |
| C05 | `/votre-rue` — expérience/résultat | « Quelles mutations précisément autour de moi ? » | Même public, adresse en main. | **Très riche si adresse exacte.** | Typologie, médiane, dispersion, tendance, dernières ventes. | Observer puis choisir une prochaine action. | Exploration réelle ; échec grave sur saisie ambiguë et H1/type. | **ENRICHIR/CORRIGER P0**. La restitution doit afficher adresse confirmée, type de bien, période, rayon, taille d’échantillon, ce que les données éclairent et ce qu’elles ne permettent pas de conclure. |
| C06 | `/situer-ma-vente` — orientation | « Quelle est ma prochaine vérification selon mon stade ? » | Cinq situations vendeur. | **Bonne après complétion**, faible pendant. | Situation et hypothèse de travail. | Choisir une action et une ressource. | Diagnostic prudent réel, pas simple liste ; sa pédagogie fait partie du capital à préserver. | **ENRICHIR** avec traduction après réponses et maintenir son rôle dans la feuille de route des contenus. |
| C07 | Résultat vendeur | « Que permettent réellement de lire mes réponses ? » | Fin de C06. | **Très bonne.** | Observation, hypothèse, alternative, limite. | Copier/imprimer, lire, demander une analyse. | Le résultat promis est livré avant contact. | **CONSERVER COMME MODÈLE DE RESTITUTION**. |
| C08 | `/audit-annonce` — méthode/FAQ | « Que peut et ne peut pas auditer l’outil ? » | Annonce déjà publiée. | **Bonne**, visible sans JS. | Première impression, données utilisées, limites. | Décider de coller l’URL ou choisir R05. | Couche éditoriale complète, FAQ réelle. | **ENRICHIR** auteur/date/sources. |
| C09 | `/audit-annonce` — expérience | « Quelles deux actions faire maintenant ? » | Vendeur avec URL. | **Bonne en structure, non fiable si extraction pauvre.** | Faits lus + réponses + actions. | Appliquer deux actions ou demander une lecture. | Mini-expérience réelle ; extraction « SAFTI » → conseil au fondement factuel non fiable. | **ENRICHIR/CORRIGER P0** le contrôle de preuve. |
| C10 | `/ma-recherche` | « Que doit changer mon achat ? » | Acquéreur. | **Partielle** ; calcul marché plus fort que compréhension du vécu. | Surtout budget/surface/zone/priorités. | Lire une synthèse puis activer une suite. | Promet une stratégie personnalisée, mais trop de réponses sont décoratives. | **RÉÉCRIRE** selon section 5. |
| C11 | `/methode` | « Comment LEVOIS raisonne-t-il avant d’ajuster ? » | Principalement vendeur. | **Structurée**, mais jargon/règles non sourcées. | Cinq étapes de raisonnement. | Réutiliser l’ordre de vérification et s’exercer sur des cas courts. | Page de méthode réelle ; elle doit aussi faire vivre la distinction fait/interprétation/hypothèse. | **RÉÉCRIRE** en langage simple ; garder principalement éditoriale et ajouter 2–3 cas courts. |
| C12 | `/accompagnement` | « Que se passe-t-il quand Mouaad intervient ? » | Vendeur considérant un relais humain. | **Bonne structure**, preuves professionnelles incomplètes. | Étapes, cadre, FAQ, limites déclarées. | Décider de parler ou rester autonome. | FAQ/explication réelles. | **RÉÉCRIRE/ENRICHIR** et clarifier acheteur/vendeur. |
| C13 | `/ressources` | « Quelle réponse correspond à ma situation ? » | Vendeurs uniquement. | **Bonne pour six cas**, corpus incomplet. | Six problèmes de commercialisation. | Choisir une page. | Hub réel, mais pas « système LEVOIS » complet. | **ENRICHIR** par situations acheteur/local. |
| C14 | Lancement cohérent | « Dans quel ordre décider avant de publier ? » | Vendeur prépublication. | **Directe mais trop absolue.** | Ordre de préparation. | Faire une liste et dater le lancement. | Promet surtout une lecture ; la checklist existe mais n’est pas personnalisable. | **TRANSFORMER EN CHECKLIST** avec couche éditoriale. |
| C15 | Première impression | « Que voit un acheteur en quelques secondes ? » | Vendeur avant/après publication. | **Claire.** | Rôle photo/titre/prix/liste mobile. | Refaire un test avec un proche. | Dit « mini-test », livre une liste statique. | **TRANSFORMER EN MINI-EXPÉRIENCE**, reliée à C09. |
| C16 | Annonce vue, peu de contacts | « À quelle étape l’intérêt se perd-il ? » | Vendeur avec statistiques. | **Très claire.** | Vue ≠ ouverture ≠ contact ≠ visite. | Chercher la donnée manquante et un premier levier. | L’arbre existe dans le texte, pas dans l’expérience. | **TRANSFORMER EN ARBRE DE DÉCISION**. |
| C17 | Retours de visite | « Comment distinguer fait, politesse et objection ? » | Vendeur après visites. | **Utile**, seuils trop assurés. | Motifs répétés et informations manquantes. | Noter et relire les retours. | Promet une « grille », n’en fournit pas d’utilisable. | **TRANSFORMER EN GRILLE OU PLAN PERSONNALISÉ**. |
| C18 | Avant baisse de prix | « Quelle vérification précède une baisse ? » | Vendeur inquiet du silence. | **Bonne et prudente sur le calcul.** | Une baisse ne répare pas toute cause. | Mettre en balance exposition, première impression, comparaison, retours de visite et informations manquantes. | La structure existe, mais pas encore la balance personnelle réellement utilisable. | **TRANSFORMER EN BALANCE PRUDENTE DES PREUVES**, sans montant ni verdict automatique. |
| C19 | Reprendre une commercialisation | « Comment repartir après plusieurs mois ? » | Vendeur avec historique long. | **Bonne.** | Reprise ≠ retouche ; l’historique doit être reconstitué. | Refaire chronologie et extraire enseignements. | Parle de chronologie mais ne permet pas de la construire. | **TRANSFORMER EN FRISE CHRONOLOGIQUE / PLAN**. |
| C20 | `/mouaad` — identité/méthode | « Qui est Mouaad et sur quoi repose sa posture ? » | Recherche de confiance. | **Lisible mais factuellement fragile.** | Statut déclaré, zone, engagements. | Contacter/choisir une porte. | Profil réel, preuves externes insuffisantes. | **RÉÉCRIRE/ENRICHIR** comme source d’entité. |
| C21 | `/carte` — rappel/orientation | « Qui ai-je rencontré et que faire ensuite ? » | Trafic physique. | **Seller-first et tardive sur mobile.** | Mouaad local et méthode. | Vendre ou contacter ; achat/local absents. | Promet rappel/orientation, livre surtout une entrée vendeur. | **RÉÉCRIRE**. |
| C22 | Mentions légales | « Qui édite et sous quel cadre ? » | Contrôle juridique. | **Incorrecte sur deux identifiants critiques.** | Mauvais SIRET actif et mauvais bloc SAFTI. | Rien de sûr sans recoupement. | Format légal présent, vérité non fiable. | **RÉÉCRIRE P0** avec pièces. |
| C23 | Confidentialité | « Quelles données partent où et pourquoi ? » | Utilisateur d’outil/formulaire. | **Claire mais incomplète.** | Sessions, audit, lead, PostHog. | Exercer droits/opt-out. | Explication réelle, mais géocodeur et consentements/payloads manquent. | **RÉÉCRIRE P0** lors de l’alignement des flux. |

### 8.3. Audit factuel, local, SEO, accessibilité et continuité

| ID | 6. Affirmations à prouver/nuancer | 7. Règles générales à requalifier | 8. Données locales | 9. Date/pérennité | 10. Fait/interprétation | 11. Répétitions/contradictions | 12. Maillage cible | 13. Intention SEO/conversationnelle | 14. Mobile/accessibilité | 15. Prochaine action |
|---|---|---|---|---|---|---|---|---|---|---|
| C01 | « Prix stables » doit rester relié au seuil et à la série. | Médiane ≠ valeur individuelle. | Oui, fortes et sourcées. | Extraction 24/07/2026, ventes jusqu’au 31/12/2025. | Bonne limite visible. | Schema couvre Lèves/Chartres quand dataset complet couvre 7 communes ; expliquer le sous-ensemble. | Locales → méthode DVF → R04. | Prix/ventes Lèves/Chartres. | Bon mobile ; CTA desktop sous la ligne de flottaison. | Choisir commune/type puis porte. |
| C02 | « Une lecture avant toute proposition » à confirmer opérationnellement. | Aucun chiffre n’explique seul une décision. | S’appuie sur C01. | Evergreen, revue annuelle. | Bonne philosophie ; vocabulaire abstrait à réduire. | Répète `/methode`. | `/methode`, `/mouaad`, trois portes. | Méthode de lecture immobilière locale. | SSR accessible. | Aller vers situation. |
| C03 | Statut/zone/coordonnées à prouver. | Aucun. | Preuve locale en aval. | Révision à chaque changement GBP/statut. | LEVOIS/SAFTI mal distingués au premier écran. | Branche buyer-first contredit universalité. | Trois portes + profil/contact. | Conseiller immobilier local/brand. | Mobile bon ; desktop sans CTA visible. | Choisir porte. |
| C04 | « 30 secondes » et « dernière maison » à corriger/prouver. | Rayon ≠ rue ; mutation ≠ estimation. | Oui. | Date source affichée dynamiquement ; mise à jour à documenter. | Limites plutôt bonnes. | Contradiction entre promesse « maison » et type de résultat non garanti. | Page locale, méthode DVF, C05. | Ventes immobilières autour de moi. | SSR ; autocomplete clavier présent, mais bug de résolution live. | Confirmer adresse. |
| C05 | Résolution adresse, filtre type et rayon. | Tendance historique ≠ prévision. | Oui, personnalisées. | Extraction/date mutation visibles. | Bonne couche limite, adresse réelle parfois cachée. | Qualification duplique R05/R03. | Résultat → page commune → outil selon intention. | Non indexer résultat ; page base porte l’intention. | Pas de débordement ; **P0 adresse ambiguë**. | Vérifier adresse puis observation/manque/action. |
| C06 | « Diagnostic » doit rester hypothèse. | Moteur déterministe ≠ avis professionnel. | Pas de donnée locale dans l’entrée. | Revue à chaque modification du moteur. | Bonne sur résultat, faible pendant. | Recouvre C16–C19 mais doit les orienter. | Deep links ressources, C09 si URL, contact. | Préparer/relire vente. | Deux H1 potentiels, auto-avance. | Voir lecture. |
| C07 | Niveau de confiance doit refléter les règles. | Aucun verdict certain. | Pas nécessaire. | Versionner le moteur. | **Très bonne séparation**. | Ne doit pas recopier tout le contenu ressource. | Ressource exacte + modification/contact. | Résultat privé, non SEO. | Responsive ; copie/impression utiles. | Lire/appliquer/échanger. |
| C08 | Affirmations sur comportement acheteur à sourcer ou qualifier. | « L’acheteur découvre d’abord… » = modèle, pas universel. | Titre Chartres mais outil générique. | Auteur/date absents. | Limites explicites. | Recoupe C15/C16. | C15/C16 + R05 + C09. | Audit annonce immobilière. | SSR/FAQ accessibles ; main imbriqué. | Lancer ou choisir fallback. |
| C09 | Toute donnée extraite doit être visible/validée. | Pas de conseil fondé sur parsing incertain. | L’URL peut être locale, sans preuve automatique. | État ponctuel, non conservé avant demande. | Structure bonne ; bug « SAFTI » casse le fait. | Peut dupliquer C15 si pas de distinction. | Résultat → C15/C16/C18. | Outil audit ; résultat privé. | Clavier/formulaires bons ; main imbriqué. | Valider faits extraits puis 2 actions. |
| C10 | Interprétations budget/surface à abaisser. | Quartile historique ≠ faisabilité. | DVF zone grossière. | Dataset 2021–2025 ; version parcours à publier. | Séparation insuffisante. | Duplique future pages acheteur si celles-ci n’expliquent pas leur rôle. | Contenus acheteurs → parcours → synthèse privée. | Clarifier recherche immobilière. | HTML sans H1, rôle main imbriqué, retour inerte, compteur saute. | Modifier/sauvegarder/échanger. |
| C11 | 5–8 alternatives et autres règles à sourcer. | « Un seul levier », « écart » = repères de méthode. | Non. | Evergreen, revue annuelle + date visible. | Mélange doctrine et faits de marché. | Répète les six ressources. | Hub de méthode → contenus/outils. | Méthode pour décider avant d’ajuster. | SSR, structuré. | Choisir situation/cas. |
| C12 | Diffusion SAFTI, engagement, exclusivité, délai/rôle à vérifier. | Aucun service universel sans preuve. | Zone déclarée seulement. | Très volatile ; date/validation SAFTI. | FAQ claire, preuve externe absente. | Seller-only contredit accueil universel. | Branche acheteur/vendeur, profil, contact. | Accompagnement immobilier Mouaad. | FAQ native accessible. | Comprendre puis contacter. |
| C13 | « Questions terrain/données disponibles » à préciser. | Aucun. | Non. | Aucun auteur/date. | Contenus mélangent conseils et faits. | Six pages structurées pareil. | Situations acheteur/vendeur/local. | Hub de réponses, pas « blog ». | SSR, cartes responsive. | Choisir question. |
| C14 | Fenêtre initiale, « coûte des semaines », 5–8, J+14. | Tous deviennent repères, pas lois. | Aucune comparaison locale intégrée. | Date/auteur/source absents. | Limite finale bonne, début trop affirmatif. | J+14 répété C16/C19. | R05 préparer, C15, accompagnement. | Préparer lancement annonce. | SSR accessible. | Checklist ordonnée personnalisée. |
| C15 | « Quelques/3 secondes », meilleure photo. | Test de proche = exercice, pas test scientifique. | Aucune. | Date/auteur/source absents. | Exemple clairement illustratif. | Chevauche R07 ; doit être méthode de premier écran, pas audit complet. | R07 + C16. | Première impression annonce. | SSR ; promesse « test » trompeuse. | Comparer/predire/révéler. |
| C16 | 10–14 jours ; causalité vue/ouverture selon portails. | Arbre = hypothèses, pas diagnostic. | Aucune donnée locale. | Données portails très volatiles. | Limite sans statistiques bonne. | Recoupe R07/R05. | R07 si URL ; C15/C18 selon branche. | Annonce vue peu de contacts. | SSR accessible. | Identifier donnée manquante puis levier. |
| C17 | Seuil trois visites, « la plupart », six visiteurs = écart certain. | Répétition augmente le signal mais ne prouve pas la cause. | Non. | Revue annuelle. | Limite perception ≠ valeur excellente. | Recoupe C18 prix. | R05 visites, C18. | Analyser retours de visite. | SSR ; aucune grille exportable. | Enregistrer faits, interprétations, motif. |
| C18 | Tous portails affichent baisses ; « seule référence valable ». | Comparaison actuelle = une source parmi d’autres. | Locale souhaitable mais absente. | Concurrence très volatile ; date indispensable. | Limite « ne calcule pas » excellente. | Recoupe C16/C17. | Entonnoir C16, grille C17, R05/R07. | Faut-il baisser prix ? | SSR accessible. | Lire la balance des preuves et identifier l’élément manquant. |
| C19 | Usure mécanique, pause six semaines, J+14. | Durées = exemples, pas prescriptions. | Marché actuel local absent. | Historique personnel + données datées. | Limite correcte. | Répète lancement/prix. | C14/C18 + R05 longtemps. | Reprendre commercialisation. | SSR ; pas de frise. | Reconstruire chronologie. |
| C20 | « Indépendant », sept communes, « vit/travaille », pratiques. | Engagements = promesses à confirmer. | Zone déclarée, pas preuves/cas. | Revue au changement statut/GBP. | Distinction LEVOIS/SAFTI incomplète. | Contredit JSON-LD agence LEVOIS. | Toutes pages signées → profil → portes. | Mouaad Boullourou SAFTI. | SSR/mobile bon. | Vérifier puis choisir/contact. |
| C21 | Habitant/connaissance locale et transmission sans coordonnées. | Relation physique ne signifie pas intention vendeur. | Déclarations locales sans source. | Support imprimé durable, contenu doit rester stable. | « Transmet » faux. | Duplique profil et accueil. | Trois portes/profil/contact. | Route hors SEO, QR. | Portrait repousse H1/CTA mobile. | Choisir situation. |
| C22 | SIRET Mouaad et identifiants SAFTI faux ; agent/mandat/RSAC absents. | Aucune déduction juridique. | Non. | Vérifier à chaque changement officiel. | Actuellement non fiable. | Contredit schema. | Footer/profil/schema/GBP. | Confiance/entité, pas cible de trafic. | SSR. | Lire une information correcte. |
| C23 | Géoplateforme, parcours acheteur/rue, consentement/payload. | « Destinataire unique » à distinguer des sous-traitants. | Adresse de recherche locale = donnée traitée. | Revue à chaque flux/prestataire. | Texte clair, réalité incomplète. | Contradiction consentement visible/non transmis. | Chaque formulaire/outils + opt-out. | Confidentialité, pas cible de trafic. | SSR ; contrôle opt-out accessible. | Comprendre/refuser/exercer droits. |

### 8.4. Cartographie par situation utilisateur

| Situation | Première réponse éditoriale | Expérience utile | Suite cohérente |
|---|---|---|---|
| « Je ne sais pas encore si j’achète ou je vends » | Accueil universel. | Aucune expérience imposée. | Trois portes ou contact. |
| « Je veux comprendre les ventes locales » | Page commune + méthode DVF. | R04 autour d’une adresse. | Achat, vente ou simple observation explicitement séparés. |
| « Je vois beaucoup d’annonces, mais ma recherche reste confuse » | Page acheteur « ce que l’achat doit changer ». | R03 reconstruit. | Synthèse/modification/envoi/échange. |
| « J’hésite entre rester proche et gagner de l’espace » | Page-réponse comparative. | Comparateur concret A/B/aucun. | R03 avec arbitrage précontextualisé. |
| « Je suis propriétaire et mon achat dépend peut-être d’une vente » | Page acheteur sur séquence achat/vente. | Petit arbre de questions, sans valeur/adresse. | R03 ou R05 selon décision immédiate. |
| « Je prépare la mise en vente » | C14. | Checklist de lancement. | R05 `preparer`, puis accompagnement si demandé. |
| « Mon annonce est vue mais génère peu de contacts » | C16. | Arbre de rupture ; R07 si URL. | C15/C18 selon l’information manquante. |
| « J’ai des visites mais pas d’offre » | C17. | Grille de retours. | C18 seulement si le prix devient une hypothèse documentée. |
| « Dois-je baisser ? » | C18. | Balance prudente des preuves : exposition, première impression, comparaison, retours de visite et informations manquantes ; aucun montant ni verdict. | R05/R07 ou comparaison locale. |
| « Mon annonce est ancienne » | C19. | Frise de commercialisation. | Plan de reprise + C14/C18. |
| « Je veux vérifier Mouaad avant de parler » | C20 + C12. | Aucune gamification. | Contact ou trois portes. |

### 8.5. Formats interactifs retenus et contenus restant principalement éditoriaux

| Contenu | Opération mentale utile | Format retenu | Pourquoi ce format |
|---|---|---|---|
| C14 lancement | Ordonner et vérifier des prérequis. | **Plan ordonné personnalisable**. | Une simulation ou un score n’ajouterait rien. |
| C15 première impression | Prédire ce qui sera perçu puis comparer. | **Mini-expérience/cas interactif**. | Rend visible l’écart entre intention du vendeur et perception ; ne remplace pas R07. |
| C16 peu de contacts | Déterminer où l’intérêt se resserre et quelle donnée vérifier. | **Entonnoir prudent**. | La question suit vue → ouverture → contact → visite, sans attribuer automatiquement une cause. |
| C17 retours | Enregistrer plusieurs observations et repérer des récurrences. | **Grille personnalisée**. | La valeur vient de l’historique structuré, pas d’un quiz. |
| C18 avant baisse | Confronter plusieurs familles de preuves et leurs absences. | **Balance prudente des preuves**. | Les données actuelles ne permettent ni calculateur, ni montant, ni verdict fiable. |
| C19 reprise | Reconstruire une suite d’événements et changements. | **Frise chronologique + plan**. | Rend les effets et informations manquantes visibles. |
| R03 | Transformer le vécu en critères et arbitrages. | **Traducteur conversationnel adaptatif**. | Déjà validé ; doit faire agir chaque réponse. |
| R04 | Explorer des mutations locales confirmées et leurs limites. | **Exploration locale prudente**. | Outil existant justifié ; aucune estimation individuelle ni conclusion à partir d’une adresse ambiguë. |
| R05 | Localiser une prochaine vérification selon le stade. | **Arbre conversationnel déterministe**. | Outil existant et utile. |
| R07 | Confronter une annonce publique à des questions guidées. | **Audit assisté avec fallback**. | Outil existant, à sécuriser factuellement. |

Restent **principalement éditoriaux** : accueil, `/methode`, `/accompagnement`, `/mouaad`, pages locales, méthode DVF, pages-réponses acheteurs, couches éditoriales de chaque outil, mentions et confidentialité. Leur valeur tient à une explication citable, pas à une interaction ajoutée artificiellement.

**Contrat ludique commun :** l’intérêt vient uniquement d’une opération intellectuelle — choisir entre deux situations, prédire puis révéler, repérer une donnée absente, classer, confronter, reconstruire, tester une hypothèse ou compléter une synthèse. Sont exclus : badges, points, confettis, classement, faux score, minuterie persuasive et diagnostic certain. Toute sortie affiche dans cet ordre : observé → pourrait signifier → autres explications → information manquante → prochaine vérification.

**Couche éditoriale obligatoire :** même après transformation, chaque contenu conservé — sur son URL actuelle ou sur une destination issue d’une fusion — garde en HTML une question explicite, une réponse directe, une explication, un exemple, les sources utiles, une date de vérification, un auteur/responsable, les limites et une prochaine action. L’expérience complète cette réponse ; elle ne la remplace pas.

**Test DG d’une mini-expérience :** réponse immédiate → activité mentale propre à la page → résultat personnel réellement utilisable → faits, sources et limites → prochaine vérification. Transformer une liste en questionnaire animé sans gain de compréhension ne satisfait pas ce contrat.

### 8.6. Contenus manquants pour les acquéreurs

| Priorité | Question manquante | Format | Porte reliée |
|---|---|---|---|
| P1 | « Qu’est-ce que mon achat doit réellement améliorer dans mon quotidien ? » | Page-réponse + cas fait/interprétation. | R03 bloc 2–3. |
| P1 | « Ai-je besoin de plus de mètres carrés ou d’un meilleur usage des pièces ? » | Page-réponse + mini-comparaison de plans/usages, sans score. | R03 usages avant typologie. |
| P1 | « Rester proche ou s’éloigner pour gagner une pièce : que faut-il comparer ? » | Comparateur de deux scénarios concrets + « aucun ». | R03 arbitrage. |
| P1 | « Mon achat dépend-il de la vente de mon logement actuel ? » | Page-réponse + petit arbre conditionnel locataire/propriétaire. | R03 situation/cadre ; R05 si vente devient active. |
| P2 | « Que comprend réellement mon budget d’achat ? » | Page-réponse prudente : prix, frais, travaux, charges, marge ; sources officielles. | R03 cadre de réalité. |
| P2 | « Que vérifier pendant une visite plutôt que se fier à une impression ? » | Checklist faits / préférences / information à demander. | R03 et futurs contenus visite. |
| P2 | « Comment comparer Chartres et Lèves pour mon usage, pas seulement au €/m² ? » | Comparateur éditorial daté ; Mainvilliers ajouté seulement après preuve. | Pages locales + R03. |

### 8.7. Contenus manquants pour l’information locale

| Priorité | Contenu | Preuve minimale | Décision |
|---|---|---|---|
| P0 | Méthode DVF LEVOIS | Source, licence, filtres, quantiles, seuils qualité, date, limites, exemples. | **CRÉER** comme référence commune. |
| P1 | `/immobilier/leves` | Séries maison/appartement, N, dispersion, date, limites, 1–2 observations réelles si disponibles. | **CRÉER** pilote. |
| P1 | `/immobilier/chartres` | Séries fortes séparées, composition appartement/maison, date et limites. Le module humain exige ensuite la confirmation de la zone accompagnée. | **CRÉER** après/avec Lèves comme page quantitative ; ajouter le module humain après confirmation. |
| P2 | `/immobilier/mainvilliers` | Dataset déjà suffisant + angle quantitatif distinct de Lèves et Chartres. Les observations terrain ne sont nécessaires que si elles sont revendiquées. | **PRÉPARER APRÈS LÈVES ET CHARTRES** ; publier seulement si la réponse est distincte et non clonée. |
| P2 | « Comment lire une vente voisine sans estimer son bien ? » | Cas DVF anonymisé, facteurs absents, méthode. | **CRÉER** comme page-réponse reliée à R04. |
| P2 | Comparaison entre communes | Séries comparables, mêmes périodes/filtres, différences d’usage réelles, pas seulement prix. | **DIFFÉRER** après deux pages locales solides. |

### 8.8. Maillage cible entre contenus, outils et humain

```text
Accueil
├── Acheter → pages-réponses acheteur → /ma-recherche → synthèse privée → contenu exact / Mouaad
├── Vendre → /situer-ma-vente → résultat privé → C14–C19 ou /audit-annonce → Mouaad
├── Comprendre le local → page commune → méthode DVF → /votre-rue → acheter / vendre / observer
└── Vérifier l’interlocuteur → /mouaad → /accompagnement → contact ou porte pertinente
```

Règles :

- chaque contenu a une seule prochaine action principale liée à la question ;
- une ressource vendeur renvoie à R07 seulement si une annonce est déjà publiée, sinon R05 ;
- une page locale ne renvoie pas directement à une estimation : elle passe par méthode/limites puis R04 ou humain ;
- R03 et R05 renvoient vers le contenu expliquant la conclusion, jamais vers un hub générique ;
- contact direct reste disponible sans forcer un outil.

### 8.9. Feuille de route priorisée du système de contenus

Dans cette section, **P0, P1 et P2 sont des niveaux de priorité du système de contenus**. Ils ne désignent pas les Phases 1, 2 et 3 du projet global.

| Ordre | Travail | Décision | Dépendance |
|---|---|---|---|
| 1 — P0 | Corriger vérité légale/entité, confidentialité et les deux défauts live R04/R07. | **CORRIGER** avant amplification. | Pièces Mouaad pour le légal ; aucune pièce pour corriger la logique de preuve des outils. |
| 2 — P0 | Figer contrats accueil, portes et modèle d’attribution. | **RECONSTRUIRE/CORRIGER**. | Source de vérité provisoire déjà disponible. |
| 2 bis — P0 | Préserver et réordonner les données, explications DVF et limites déjà présentes sur l’accueil sous l’identité et les portes. | **CONSERVER/ENRICHIR** le capital, sans reprendre l’architecture data-first. | Architecture éditoriale de l’accueil. |
| 3 — P1 | Ajouter auteur, date, sources, limites et prochaine action aux six ressources, méthode et accompagnement. | **ENRICHIR** sans changer encore tous les formats. | Profil auteur provisoire sûr. |
| 3 bis — P1 | Préserver la couche pédagogique et la restitution de `/situer-ma-vente` comme modèle de sortie prudente ; améliorer la traduction pendant le parcours. | **CONSERVER/ENRICHIR**. | Contrat éditorial commun des outils. |
| 4 — P1 | Produire méthode DVF + pages Lèves puis Chartres. | **CRÉER**. | Zone réelle, observations locales si revendiquées. |
| 5 — P1 | Produire les quatre premières pages-réponses acheteurs. | **CRÉER**. | Structure métier R03 déjà validée. |
| 6 — P1 | Reconstruire le script complet R03 lors de la Phase 3. | **RÉÉCRIRE**. | Validation de la section 5, langage de Phase 2. |
| 7 — P1 | Transformer C16 en arbre et C17 en grille. | **TRANSFORMER**. | Couche éditoriale sourcée. |
| 8 — P2 | C14 plan ordonné, C15 test de perception, C18 balance des preuves, C19 frise. | **TRANSFORMER** progressivement. | Mesure commune et preuve de demande. |
| 9 — P2 | Mainvilliers quantitative, après Lèves et Chartres, puis comparaison communale. | **PRÉPARER PUIS PUBLIER SEULEMENT SI DISTINCTE**. | Réponse non clonée ; aucun claim terrain sans preuve. |

### 8.10. Concepts des mini-expériences prioritaires

#### E1 — « Où l’intérêt se perd-il ? » — C16

Entrées : statistiques disponibles (présence, pas valeurs exactes dans analytics), stade vue/ouverture/contact/visite, capacité à reproduire la recherche. Progression en **entonnoir prudent** : repérer jusqu’où l’intérêt avance → prédire la cause la plus tentante → révéler deux autres explications → choisir la prochaine vérification. Sortie :

1. observé : « vous disposez de ___ » ;
2. pourrait signifier : une hypothèse ;
3. autres explications : deux alternatives ;
4. information manquante : une donnée précise ;
5. prochaine vérification : une action unique.

Pas de score, pas de diagnostic de prix, résultat avant contact. Indicateur de succès : prochaine vérification identifiée, pas durée passée.

#### E2 — « Grille des retours de visite » — C17

Entrées : date, ce qui a été dit, ce qui a été observé, question non répondue ; aucune identité de visiteur nécessaire. Progression : ajouter plusieurs lignes → classer « fait / interprétation / politesse / question » → faire apparaître les motifs récurrents sans seuil magique. Sortie standard en cinq blocs, avec export/copie locale. L’outil ne dit jamais « baissez » ; il dit quelle information mérite vérification.

#### E3 — « Reconstituer ma commercialisation » — C19

Entrées : dates de publication, changements de photo/texte/prix/diffusion, vues/contacts/visites si disponibles, pauses. Progression : construire la frise → repérer les changements simultanés → marquer les périodes impossibles à interpréter → choisir ce qui doit être observé ensuite. Sortie : chronologie, conclusions possibles, conclusions impossibles, données manquantes et plan de reprise.

#### E4 — « Trois secondes, puis pourquoi ? » — C15

Entrées : choix entre deux vignettes/cas pédagogiques ou observation guidée de sa propre annonce dans une vraie liste ; pas d’upload obligatoire en V1. Progression : prédire ce qui sera remarqué → révéler photo/titre/prix/contexte → appliquer la grille à son annonce. Sortie : forces observées, hypothèses de perception, autres causes, information manquante, prochaine vérification. R07 prend le relais uniquement si une URL est disponible.

#### E5 — « La balance avant de changer le prix » — C18

Entrées : exposition, première impression, comparaison actuelle et historique, retours de visite et informations manquantes. Progression : placer chaque famille sur une balance de preuve, sans pondération pseudo-scientifique. Sortie : « plusieurs éléments convergent », « les éléments se contredisent » ou « une information manque encore pour discuter le positionnement », jamais un montant ni un verdict automatique.

### 8.11. Indicateurs d’utilité réelle

| Indicateur | Ce qu’il mesure | Interprétation utile |
|---|---|---|
| Démarrage d’expérience | La promesse donne envie d’agir. | À comparer à la vue de la réponse, pas au trafic brut. |
| Complétion | La progression reste compréhensible. | Par branche/étape, sans collecter la réponse. |
| Consultation du résultat | La valeur a réellement été délivrée. | Conversion primaire des outils. |
| Modification d’une réponse | La personne comprend qu’elle peut corriger sa pensée. | Signal positif de réflexion, pas erreur à minimiser. |
| Copie/impression/sauvegarde | Le résultat ou la grille est réutilisable. | Plus fort que le temps passé. |
| Ligne ajoutée à une grille/frise | L’expérience est appliquée au cas réel. | Mesurer quantité agrégée, pas contenu. |
| Prochaine action identifiée | La personne sait quoi vérifier ensuite. | Indicateur central de LEVOIS. |
| Poursuite vers un contenu cohérent | Maillage situationnel fonctionne. | Mesurer destination attendue, pas pages/session. |
| Retour ultérieur sur le même outil | Le contenu accompagne une décision longue. | Seulement avec consentement de mesure. |
| Demande d’échange qualifiée | La valeur conduit à un besoin humain explicite. | Relier à `lead_qualified`, pas au formulaire tenté. |
| Taux d’hypothèses prudentes | Résultats affichant aussi alternatives/manque/limite. | Garde-fou qualité éditoriale, vérifié par QA de contenu. |
| Taux de faux résultats/erreurs de preuve | Adresse/titre/donnée invalides détectés. | Doit tendre vers zéro avant amplification. |

Le trafic, le temps passé et les pages vues restent des métriques de contexte ; ils ne définissent pas l’utilité d’un contenu LEVOIS.

## 9. Tableau final unique des décisions

| Élément | Constat prouvé | Décision | Priorité | Dépendance | Responsable | Bloquant pour la suite |
|---|---|---|---|---|---|---|
| Référence d’état | `main@cb0ab22` est déclaré source de production ; branche/labs divergent. | **CONSERVER** `main` + live comme base de l’existant ; ne pas confondre les états. | P0 | Aucune. | Responsable technique. | Oui pour tout audit fiable ; résolu par ce dossier. |
| Commentaires `_redirects` | Le texte sur `/votre-rue` est périmé ; `/merci` diffère entre dépôt et live. | **CORRIGER** la documentation de déploiement. | P1 | État Cloudflare. | Technique. | Non pour Phase 2, oui avant déploiement. |
| SIRET Mouaad | `00027` public fermé ; l’API officielle consultée indiquait `00043`, maintenu provisoire par la DG jusqu’au RNE. | **CORRIGER P0** ; retirer l’ancien, publier le nouveau seulement après attestation RNE récente. | P0 | Attestation RNE. | Mouaad + juridique/technique. | **Oui pour publication légale finale.** |
| Mentions SAFTI | SIRET, carte, adresse et mention « garantie financière : GALIAN » de LEVOIS ne correspondent pas à E3, qui mentionne notamment une **responsabilité civile professionnelle GENERALI IARD**. | **CORRIGER P0** depuis la source officielle validée sans confondre RCP et garantie financière. | P0 | Validation de ce qui doit être reproduit. | Mouaad + SAFTI/juridique. | **Oui pour publication légale finale.** |
| Formulation d’entité | Le noyau professionnel est prouvé et la définition publique V1 de LEVOIS est validée ; « indépendant/sous mandat/agent/7 communes » et une éventuelle qualification juridique ou commerciale de LEVOIS ne le sont pas. | **CORRIGER** toutes les surfaces avec le noyau vérifié et la définition V1 ; réserver le statut d’hypothèse à la qualification juridique/commerciale. | P0 | Pièces listées en 2.3 pour les seules qualités réglementées ou commerciales. | Éditorial + Mouaad. | Non pour Phase 2 ; oui avant publication des qualités concernées. |
| GBP | Aucun lien/capture fiable. | **DIFFÉRER** toute création/renommage ; auditer la fiche existante. | P0 | Lien, place ID, captures, réception oui/non. | Mouaad. | **Oui pour continuité GBP finale**, pas pour commencer l’accueil. |
| Accueil | Production data-first ; branche buyer-first ; identité/services/contact incomplets au premier écran. | **RECONSTRUIRE** l’architecture éditoriale universelle. | P0 | Formulation d’entité ; GBP pour alignement final. | Phase 2 éditoriale + Mouaad. | **Oui, objet principal de Phase 2.** |
| `EvidenceHero`/preuve DVF | Bloc riche, SSR, sourcé et prudent. | **CONSERVER** sous le premier écran universel. | P1 | Aucune. | Éditorial/données. | Non. |
| `/carte` | URL imprimée utile, mais seller-first, attribution perdue, contenu tardif mobile. | **CORRIGER** ; trois portes, `noindex,follow`, URL maintenue. | P1 | Formule d’entité, attribution. | Éditorial + futur technique. | Non pour Phase 2, oui avant nouvel imprimé. |
| `/ma-recherche` | Structure métier non respectée ; nombreuses réponses sans effet ; synthèse avant contact reste un actif. | **RECONSTRUIRE** selon les sept blocs, sans BUY OS. | P0 | Validation section 5 + plateforme de langage Phase 2. | Phase 3 conversationnelle. | Non pour démarrer Phase 2 ; oui pour Phase 3. |
| R04 adresse ambiguë | Saisie « 1 rue » peut calculer sur Chartres sans afficher l’adresse résolue. | **CORRIGER P0** : sélection/confirmation obligatoire + adresse affichée. | P0 | Aucune pièce Mouaad. | Technique + QA. | Oui avant indexation/acquisition R04. |
| R04 promesse/confidentialité | « Dernière maison » ne correspond pas au calcul ; géocodeur absent de la politique ; source forcée QR. | **CORRIGER** texte, transparence et attribution. | P0 | Décision de wording ; flux technique. | Éditorial + privacy + technique. | Oui avant amplification. |
| R04 indexation | Couche SSR réelle mais incomplète ; résultat personnel JS. | **CORRIGER puis INDEXER** la base ; résultats jamais publics. | P1 | Corrections R04 + auteur/date/source. | SEO/éditorial + technique. | Non pour accueil ; oui pour SEO local. |
| `/situer-ma-vente` | Moteur déterministe utile, mais auto-avance sans traduction ni mesure. | **CORRIGER** progression, attribution et événements ; ne pas recréer. | P1 | Taxonomie section 7. | UX/technique. | Non pour Phase 2. |
| Résultat vendeur | Bonne prudence et valeur avant contact ; consentement/source non transmis. | **CONSERVER** ; corriger consentement et mesure. | P1 | Privacy/attribution. | Technique + privacy. | Non pour Phase 2 ; oui avant campagne. |
| `/audit-annonce` | Mini-expérience réelle, couche SSR, bonne mesure. | **CONSERVER** comme porte spécialisée. | P1 | Aucune. | Produit/éditorial. | Non. |
| Parsing audit | Une annonce SAFTI a produit le titre erroné « SAFTI » et un conseil au fondement factuel non fiable. | **CORRIGER P0** : validation des champs, rejet marque, fallback honnête. | P0 | Tests multi-portails. | Technique + QA éditoriale. | Oui avant amplification de R07. |
| `/contact` | Universel en intention mais seller-first ; attribution perdue ; tentative ≠ succès ; fallback peut exposer PII. | **CORRIGER P0** contenu, fallback, consentement, attribution et succès. | P0 | Délai/canal confirmés par Mouaad. | Éditorial + technique + privacy. | Oui avant accueil final/campagnes. |
| `/mouaad` | Route existe ; claims/statut/zone non tous prouvés ; pas de lien SAFTI visible. | **CORRIGER/ENRICHIR**, pas créer. Elle devient la source de vérité interne au site, adossée aux documents officiels et au profil SAFTI pour les données réglementées. | P0 | Pièces d’entité. | Phase 2 éditoriale + Mouaad. | Non pour rédiger ; oui avant publication des qualités concernées. |
| `/methode` | Bonne structure, seller-only, jargon et repères non sourcés. | **CORRIGER** et garder principalement éditoriale. | P1 | Plateforme de langage. | Éditorial. | Non. |
| `/accompagnement` | FAQ/service seller-only, cadre SAFTI non documenté. | **CORRIGER** en page de réassurance avec bifurcation explicite : accompagnement d’un achat / accompagnement d’une vente, sans offre acquéreur artificielle. | P1 | Description des accompagnements réellement tenus + documents SAFTI. | Mouaad + éditorial. | Partiellement pour la proposition de valeur. |
| `/ressources` | Six contenus vendeurs, aucun acheteur/local. | **CORRIGER/ENRICHIR** par situations ; pas un blog. | P1 | Nouveaux contenus prioritaires. | Éditorial. | Non. |
| Lancement cohérent | Checklist existante mais règles absolues. | **CORRIGER** ; transformer en checklist personnalisable. | P2 | Sources/heuristiques. | Éditorial/expérience. | Non. |
| Première impression | « Mini-test » statique. | **CORRIGER** ; transformer en mini-expérience reliée à audit. | P2 | R07 fiable. | Éditorial/expérience. | Non. |
| Annonce vue peu contacts | Excellent arbre causal seulement écrit. | **CORRIGER** ; transformer en arbre de décision prudent. | P1 | Couche sourcée. | Éditorial/expérience. | Non. |
| Retours de visite | Promet une grille sans outil ; seuils trop sûrs. | **CORRIGER** ; transformer en grille personnalisée. | P1 | Modèle de données non sensible. | Éditorial/expérience. | Non. |
| Avant baisse de prix | Bonne limite, règles portails/comparaison trop générales. | **CORRIGER** ; balance prudente des preuves, sans montant ni verdict automatique. | P2 | Sources actuelles. | Éditorial/expérience. | Non. |
| Reprise commercialisation | Bonne méthode, pas de chronologie utilisable. | **CORRIGER** ; transformer en frise/plan. | P2 | Modèle de sauvegarde locale. | Éditorial/expérience. | Non. |
| Auteur/date/sources | Absents visiblement des ressources/méthode ; schema Article sans dates. | **CORRIGER** sur tout contenu indexable. | P1 | Profil auteur sûr. | Éditorial/SEO. | Oui avant expansion AEO, non pour démarrer Phase 2. |
| Méthode DVF statique | Méthode existe dans les données/code, pas comme référence autonome complète. | **CRÉER** une page de méthode citable. | P1 | Dataset/méthode déjà disponibles. | Données + éditorial. | Non pour Phase 2 ; oui pour pages locales. |
| Page locale Lèves | Séries distinctes suffisantes et SAFTI prouve Lèves/alentours. | **CRÉER** comme pilote non cloné. | P1 | Formule service + éventuelles observations terrain. | SEO local + Mouaad. | Non pour accueil ; oui pour feuille de route locale. |
| Page locale Chartres | Séries fortes et composition très différente : la page de données peut être non clonée sans claim de service. | **CRÉER** comme page-réponse quantitative ; **DIFFÉRER** le module service/terrain. | P1 | Aucune pour la couche quantitative ; zone desservie + observations pour le module humain. | SEO local + Mouaad. | Non. |
| Page locale Mainvilliers | Dataset suffisant et angle quantitatif identifiable ; activité/observations propres non prouvées. | **PRÉPARER EN TROISIÈME POSITION** ; publier seulement si la page est distincte, sans claim terrain non documenté. | P2 | Lèves et Chartres structurées ; preuve de distinction éditoriale. | SEO local + Mouaad. | Non. |
| Contenus acheteurs | Quatre questions centrales n’ont aucune page-réponse. | **CRÉER** le noyau P1 de section 8.6. | P1 | Plateforme éditoriale Phase 2. | Éditorial. | Oui pour l’écosystème buyer, pas pour l’accueil seul. |
| Schema global | `RealEstateAgent` LEVOIS contredit le visible et contient des champs non prouvés. | **CORRIGER P0** vers WebSite + Person prudent ; enrichir après pièces. | P0 | Source d’entité. | SEO technique + juridique. | Oui avant publication de la nouvelle identité. |
| Sitemap/canonical/liens | 16 des 17 URL du sitemap — toutes sauf l’accueil — sont sans slash et font une redirection 308 vers leur canonique avec slash ; pas de `lastmod`; sitemap manuel. | **CORRIGER** pour URL finales et contrôle automatique. | P1 | Architecture indexation validée. | SEO technique. | Non pour contenu, oui avant expansion SEO. |
| Robots Cloudflare | Production différente du dépôt ; certains robots de recherche ne sont pas désautorisés, tandis que plusieurs robots d’entraînement/usage IA le sont. Robots.txt ne prouve pas l’accès réel et `search=yes` ne couvre pas tout usage IA. | **CONSERVER** une gouvernance séparant recherche, requête utilisateur, grounding/input et entraînement ; documenter puis contrôler WAF/logs. | P1 | Choix de gouvernance Mouaad. | Mouaad + technique. | Non pour Phase 2. |
| Attribution | Aucune première/dernière touche persistante ; `src` se perd. | **CRÉER** le contrat section 7.2. | P0 | Revue privacy. | Mesure + technique. | Oui avant campagnes, non avant rédaction Phase 2. |
| Événements | Tentative formulaire assimilée à conversion ; tunnels R04/R05 absents. | **CORRIGER** selon section 7.3. | P1 | Attribution + API. | Mesure + technique. | Non pour Phase 2 ; oui avant acquisition payante. |
| Consentements/privacy | Plusieurs cases visibles non transmises ; Géoplateforme absente. | **CORRIGER P0** flux et politique ensemble. | P0 | Validation privacy. | Technique + conseil juridique. | Oui avant amplification et envoi fiable. |
| `/404` et `/merci` | Soft-404/canonical incohérent ; `/merci/` live 404 alors qu’une 301 `/merci` existe dans le dépôt. | **CORRIGER** et aligner slash/état voulu. | P1 | Inventaire liens historiques. | Technique/SEO. | Non. |
| `/composants` public | Page interne accessible, noindex mais analytics/schema publics. | **SUPPRIMER** du build public ou protéger. | P1 | Choix d’environnement. | Technique. | Non. |
| `/recommander`, `/rejoindre` | Branche-only, preuves/conditions non validées, visibles dans nav/sitemap de branche. | **DIFFÉRER**. | P2 | Sources SAFTI et priorité produit. | Mouaad. | Non. |
| Cockpit | Branche privée, pas de GO données réelles. | **DIFFÉRER** et exclure du public. | P2 | Sécurité/D1 séparées. | Produit/technique. | Non ; hors mission. |
| BUY OS/Tomas/Visual Lab | Fichiers non suivis, prototypes, données réelles possibles. | **DIFFÉRER** ; ne pas publier ni rouvrir. | P2 | Mission ultérieure explicite. | Mouaad/produit. | Non. |

## 10. Paquet de validation

### 10.1. Décisions validables immédiatement

1. Architecture des portes et contrats R01–R08.
2. Accueil universel ; rejet de la branche buyer-first comme architecture commune.
3. Reconstruction R03 selon les sept blocs et le relevé d’écarts.
4. Conservation/correction de R04, R05/R06 et R07 ; R07 reste spécialisé annonce publiée.
5. Préservation de tout le capital des six ressources avec décisions de format C14–C19 ; fusion, redirection ou restructuration possibles sans perte de connaissance.
6. Création d’une méthode DVF et d’une page Lèves ; création d’une page-réponse quantitative Chartres sans claim de service avant preuve ; Mainvilliers placée ensuite, sous condition de contenu distinct.
7. Taxonomie d’attribution/événements et définition du lead qualifié.
8. Indexation selon les six statuts disjoints de la section 6.2, couche statique citable transverse, et retrait de `/carte` du sitemap cible.
9. Modèle d’entité prudent : noyau public vérifié, définition V1 de LEVOIS validée, qualification juridique/commerciale encore provisoire et retrait du `RealEstateAgent` LEVOIS.
10. Exclusion de cockpit, BUY OS, Tomas et Visual Lab.

### 10.2. Hypothèses provisoires

- LEVOIS est présenté en V1 comme la démarche et l’ensemble d’outils de compréhension et de décision portés par Mouaad dans son activité de conseiller immobilier SAFTI ; il n’est ni une agence autonome, ni un réseau, ni un produit officiel SAFTI. Son éventuel statut de nom commercial ou d’enseigne reste à prouver.
- « Indépendant », « sous mandat » et le périmètre de sept communes sont suspendus aux pièces.
- L’email est affiché et le délai de réponse de 24–48 h est promis en production ; leur réalité opérationnelle reste à tester et confirmer.
- La base de R04 peut devenir indexable après correction et enrichissement.
- La persistance cross-session est autorisée après consentement, mais sa durée doit être le minimum réellement utile après revue privacy.
- Mainvilliers devient la troisième page locale candidate ; sa publication dépend d’une réponse quantitative non clonée, pas nécessairement d’un module terrain.

### 10.3. Informations exactes attendues de Mouaad

1. Attestation RNE récente confirmant le SIRET actif et l’éventuel nom commercial.
2. Attestation RSAC si « agent commercial » doit apparaître.
3. Mandat/attestation SAFTI en cours, habilitation éventuelle et vocabulaire autorisé.
4. Confirmation des communes réellement desservies, distinctes du dataset.
5. Lien direct/ID/captures complètes du GBP et statut de propriété.
6. Réponse oui/non sur la réception physique, sans transmettre d’adresse personnelle ici.
7. Confirmation/test téléphone + email + délai de réponse ; l’absence d’appel automatique est déjà validée.
8. Deux ou trois observations/cas anonymisés vérifiables par commune revendiquée.
9. Accès ou exports historiques PostHog, GSC et GBP seulement si la conservation de séries existantes importe.

### 10.4. Contradictions exigeant un arbitrage

| Contradiction | Arbitrage demandé |
|---|---|
| LEVOIS « ni agence ni réseau » vs schema `RealEstateAgent` LEVOIS | Adopter immédiatement le modèle provisoire `WebSite + Person`; enrichir après pièces. |
| « Indépendant/sous mandat/7 communes » vs seules preuves « conseiller SAFTI à Lèves et alentours » | Conserver le noyau vérifié ou fournir les pièces nécessaires à une formulation plus complète. |
| GBP potentiellement existant mais invisible à l’audit | Fournir la fiche avant tout renommage/création. |
| `/accompagnement` au nom universel mais contenu vendeur | Arbitrage rendu : bifurquer clairement entre accompagnement d’un achat et accompagnement d’une vente, sans inventer de prestation acquéreur non tenue. |
| Maintien des désautorisations `GPTBot`, `Google-Extended`, `ClaudeBot` et traitement de `Claude-SearchBot`/`Claude-User` | Choix de gouvernance Mouaad ; recherche, requête utilisateur, grounding/input et entraînement doivent être décidés séparément. |
| `/merci` 301 exacte dans le dépôt mais `/merci/` 404 en live | Tester les deux variantes et confirmer l’existence d’anciens liens/formulaires ; sinon supprimer la dette, sinon rendre la redirection robuste. |

### 10.5. Éléments qui bloquent la publication ou le figement des champs concernés, pas la Phase 2 éditoriale

- formulation juridique/publicitaire définitive de Mouaad–SAFTI–LEVOIS ;
- source de vérité GBP et décision adresse masquée/accueil physique ;
- zone de service à afficher sur l’accueil ;
- réalité des promesses opérationnelles de contact ;
- description exacte des accompagnements acheteur et vendeur réellement tenus.

La rédaction et l’architecture de Phase 2 avancent avec le noyau factuel vérifié, la définition publique V1 validée de LEVOIS et des champs provisoires pour le reste. Ces cinq points ne bloquent que la publication ou le figement des formulations qu’ils affectent.

### 10.6. Éléments résolubles plus tard sans risque pour Phase 2

- la production de Mainvilliers après Lèves et Chartres, sous condition d’une réponse quantitative distincte ;
- transformations P2 des ressources ;
- `/recommander` et `/rejoindre` ;
- politique de crawl et d’usage IA des robots — recherche, requête utilisateur, grounding/input et entraînement — tant que l’accès utile reste testé ;
- dashboards et panel d’assistants ;
- paramètres click-ID de futures campagnes ;
- cockpit, BUY OS, Tomas et labs ;
- schema enrichi `Service`/types professionnels après preuves ;
- brief de direction artistique, explicitement reporté.

## 11. Critère de passage

La Phase 1 est **validée avec modifications par la Direction générale** : chaque source possède une destination, chaque route un rôle, chaque affirmation un niveau de preuve, chaque conversion une taxonomie et chaque contenu existant une décision. La Phase 2 strictement éditoriale est autorisée sous champs provisoires. Toute publication reste interdite tant que les P0 de la surface concernée et ses engagements réglementaires/opérationnels ne sont pas corrigés ou confirmés. Voir `docs/strategy/phase-1-validation-direction-generale.md`.
