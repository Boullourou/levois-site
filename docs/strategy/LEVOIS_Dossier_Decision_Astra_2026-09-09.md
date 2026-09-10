# LEVOIS — Dossier de décision Astra

**Architecture cible de l’expérience · 9 septembre 2026 · Proposition à arbitrer**

Ce dossier recommande une cible unique pour LEVOIS, à partir du cahier des charges maître Astra V1 et des fichiers réellement présents dans le worktree. Il couvre l’audit, les parcours, les restitutions, le design, la continuité et le passage à l’implémentation. Il n’autorise ni n’engage cette implémentation.

**Référence technique auditée** : `C:\Users\PC\.codex\worktrees\levois-experience-cible-20260909` ; branche `codex/levois-experience-cible-20260909` ; HEAD `52c92ca64ca22606272ae9dd933b5706f4301842`. Les quatre contrôles initiaux étaient conformes, dont un statut Git propre.

**Hiérarchie des preuves** : le document maître gouverne la stratégie ; les sources actives et leur exécution locale établissent l’existant. Les anciens briefs, composants non importés et captures historiques ne prouvent pas une fonctionnalité actuelle. Les exemples de cible ci-dessous sont des cas illustratifs, pas des dossiers de clients ni des promesses de résultat.

**Lecture** : A donne la décision ; B ses raisons ; C à H décrivent le système ; I fixe la direction d’expérience ; J à L préparent le chantier ; M contient les seuls arbitrages encore ouverts.

## A. Verdict exécutif

**LEVOIS devient un espace où l’on construit, conserve et révise une décision immobilière, avec Mouaad comme continuité humaine.** La personne entre par sa question du moment, obtient une première compréhension, examine les suites possibles et repart avec une lecture qui reste utile même sans contact.

La cible repose sur **un contexte de projet commun, trois parcours et trois profondeurs de restitution**, accessibles depuis les cinq portes du maître. La page d’accueil oriente ; elle ne concentre ni toutes les preuves ni tous les débuts de parcours. Une vidéo ouvre directement la question promise. Un lien après rendez-vous reprend ce qui a été compris. Une personne recommandée découvre une preuve de méthode avant de livrer son dossier.

Le changement principal porte sur l’orchestration et la justesse des conclusions. Le site actuel possède déjà une identité reconnaissable, des données locales, cinq branches vendeurs, six ressources, un audit d’annonce avec secours et plusieurs restitutions ouvertes. **Les reconstruire intégralement ferait perdre des acquis sans résoudre les ruptures constatées.** En revanche, après la motivation initiale, le parcours acquéreur place la typologie et les paramètres de marché avant la clarification approfondie des usages et priorités ; il n’implémente pas les sept séquences du maître. La transition vente–achat et la reprise d’un contexte connu ne sont pas des expériences publiques abouties.

La décision recommandée est donc de :

1. **Conserver l’identité et les actifs éprouvés**, mais composer les écrans autour de la compréhension : logo actuel, Satoshi, cobalt, portrait identifié comme Mouaad, illustration de quartier qualifiée, données DVF, questions vendeurs et ressources utiles.
2. **Faire de la restitution le centre du produit** : situation comprise, éléments solides, options conditionnelles, inconnues et prochaine décision utile ; raisons visibles, correction fidèle, conservation libre.
3. **Réaligner l’acquéreur sur les sept séquences du maître** : usages avant typologie, priorité distincte d’exclusion, lecture qualitative possible sans budget ou données de marché.
4. **Créer la transition comme parcours propre**, articulant vente, achat, intervalle et conditions de compatibilité, sans juxtaposer deux questionnaires.
5. **Relier chaque prolongement à une incertitude précise** : emporter, approfondir, demander une relecture ou échanger. Le contact n’est ni le prix du résultat ni la preuve que la décision est bonne.

La direction visuelle recommandée est une **composition éditoriale de la décision** : une question principale, un contraste concret, une marge de lecture qui rassemble ce qui devient clair. Sur mobile, cette marge devient une synthèse accessible au bon moment. L’ambition tient à la composition, à la qualité des interactions et à la précision des mots ; elle ne nécessite pas de changer arbitrairement de palette ou d’ajouter un spectacle technique.

Le résultat commercial recherché demeure des projets qualifiés et des mandats cohérents. L’exclusivité peut découler d’un besoin de coordination démontré ; elle n’est jamais présentée comme la condition pour être éclairé. Attendre, renoncer ou reformuler restent des décisions réussies lorsqu’elles correspondent aux faits et aux priorités de la personne.

**Après arbitrage** : transformer par tranches complètes, conserver les anciennes routes et lectures jusqu’à validation de leur remplacement. Aucun nouveau stack, CRM, pipeline vidéo, catalogue de biens ou chantier de recrutement n’est nécessaire à cette cible.

## B. Audit de l’existant

### B1. Méthode et portée réelle des vérifications

Le cahier maître a été lu intégralement. L’audit croise les pages, leurs imports actifs, les questionnaires, moteurs, ressources, calculs locaux, API de réception et mécanismes de consentement. Le site a été exécuté localement à partir du verrou de dépendances du worktree, sans modifier ses sources pour l’inspection.

Vérifications effectuées :

- 18 routes inspectées en navigateur à 390 × 844 et 1440 × 900 : pages publiques principales, résultat vendeur vide, pages secondaires, 404 et référence de composants. Les routes répondent ; `/404` retourne bien 404. Aucun débordement horizontal ni erreur JavaScript de page relevé sur ces états initiaux.
- Les six articles de ressources répondent et affichent leur réponse courte avant toute collecte.
- Les cinq branches vendeurs ont été parcourues jusqu’à une restitution avec des réponses d’essai ; la copie et l’impression sont présentes avant le formulaire. La correction d’une lecture partagée dans un contexte neuf revient au sélecteur : rupture reproduite.
- Une recherche acquéreur d’essai a été parcourue jusqu’à la lecture et au choix des suites. Le ratio DVF et les concessions proposées ont été observés ; la lecture précède les coordonnées. Cela ne valide pas la pertinence de ces conclusions.
- L’audit d’annonce a été parcouru avec transport indisponible : les trois réponses et les deux actions restent accessibles. Le test porte sur le secours, pas sur la lecture d’une annonce réelle par un portail.
- Sept pages principales contrôlées à 320 px sans débordement initial ; ouverture du menu mobile, fermeture avec Échap et retour du focus observés.
- **38 tests existants réussis, dans cinq fichiers** : moteur vendeur, audit bloqué, analyse d’URL, contrats publics et analytics. Les tests d’API utilisent des transports simulés ; ils ne prouvent pas une livraison réelle à Mouaad.

Les appels externes et les endpoints de transmission étaient bloqués dans le navigateur d’audit. Aucun message, dossier client ni donnée personnelle n’a été envoyé. Le géocodage distant, la lecture réelle des portails, la délivrabilité des notifications et le raccord à des bases déployées ne sont donc **pas validés en production**. Leurs contrats ont été lus dans les sources.

Les captures actuelles et relevés sont conservés comme preuves locales dans `artifacts/astra-audit/`. La barre d’outils Astro visible sur certaines captures appartient au serveur de développement. L’inspection ne constitue ni une certification d’accessibilité, ni une mesure de performance en conditions réelles, ni un test utilisateur du délai de première valeur.

Les références documentaires de design comportent aussi un décalage entre `DESIGN.md` et son fichier secondaire `.impeccable/design.json`. Elles n’ont pas été corrigées dans cet audit : leur réalignement pourra accompagner la documentation des futurs écrans validés. Les sources actives et captures locales priment pour décrire le rendu actuel.

### B2. Décisions par page et actif

Priorités : **P0** = contrat de confiance ou fidélité à régler avant bascule ; **P1** = nécessaire à la cible complète ; **P2** = finition ou extension après le fonctionnement complet. Les actions de cette matrice sont proposées au futur chantier, pas exécutées dans cette mission.

| Page ou actif réel | Décision | Justification et transformation | Priorité |
|---|---|---|---|
| `/` | Garder l’identité ; modifier l’orchestration | Trois entrées actuelles achat/vente/ventes locales. Ajouter la transition au même niveau que les projets ; placer la consultation locale en entrée d’outil. Préserver l’image qualifiée et le fait local expliqué. | P1 |
| Navigation et footer actifs | Modifier | Ils viennent de `Layout.astro`, pas des anciens `Header`/`Footer`. Donner accès aux trois projets, à la reprise et aux preuves ; réduire le footer commercial dans les séquences de travail. | P1 |
| `/ma-recherche` | Conserver des questions ; recomposer le parcours | Onze étapes réelles, investissement proposé, typologie avant usages, flexibilité déduite des absences. Aligner sur sept séquences et quatre blocs maîtres ; conserver les bonnes questions de secteur, financement, horizon, vente préalable. | P0 |
| `/situer-ma-vente` | Garder le noyau ; transformer en aiguilleur | Cinq branches et 24 questions utiles. Ajouter réflexion avant vente, incident et transition sans imposer toutes les branches à tous. Introduire une micro-valeur avant la fin. | P1 |
| `/situer-ma-vente/resultat` | Garder ; étendre | Reformulation, limite, action, ressource, copie et impression existent. Ajouter options, preuves distinguées, révision versionnée et correction fidèle depuis un lien partagé. | P0 |
| `/audit-annonce` | Garder ; relier | Trois réponses/deux actions et secours fonctionnent. Ajouter correction après résultat, conservation et transfert des réponses utiles au diagnostic vendeur ; distinguer transport indisponible et portail effectivement bloquant. | P1 |
| `/votre-rue` | Garder l’URL et la valeur locale ; refondre sa qualification | Repères ouverts et limites réelles. Une seconde promesse de lecture conduit pourtant directement aux coordonnées. Livrer cette lecture d’abord ; relier ensuite au bon projet. | P0 |
| Observatoire communal | Garder ; clarifier | Synthèse locale structurée, états de faible effectif. Faire coïncider titre, périmètre, période et calcul. Une commune n’est pas un quartier. | P0 |
| `/carte` | Garder ; réordonner | Portrait, contact, téléphone et vCard utiles. La valeur vient après une présentation/contact sur mobile. Donner aussi un premier choix utile dans le premier écran. Ne pas supposer un échange préalable du seul fait du QR. | P1 |
| `/methode` | Modifier ; déplacer la méthode vendeur | Le Système des Écarts explique la commercialisation, pas tout LEVOIS. Faire de cette route la démonstration commune ; conserver le contenu vendeur dans une destination dédiée. | P1 |
| `/accompagnement` | Garder les étapes ; élargir | Très bonne logique de limite humaine, mais centrée vente. Décliner les apports concrets pour achat et transition. Nuancer l’affirmation d’une seule main nécessaire en toutes circonstances. | P1 |
| `/mouaad` | Garder identité/portrait/coordonnées ; corriger le discours | Le texte évoque propriétaires rencontrés et lecture quotidienne du marché sans preuve associée dans le dossier audité. Construire la légitimité sur la méthode et le cadre établis, pas sur une ancienneté implicite. | P0 |
| `/contact` | Garder l’accès direct ; distinguer du relais contextualisé | Le contact volontaire direct est légitime. Le relais depuis une lecture doit reprendre le contexte, ne pas redemander nom, objet et récit complet. Corriger le statut de réception trop affirmatif. | P1 |
| `/ressources` | Garder ; organiser par questions utiles | Six réponses vendeurs existantes. Offrir un retour à la décision en cours et compléter uniquement les besoins achat/transition indispensables ; pas de bibliothèque massive. | P1 |
| `lancement-coherent` | Garder la checklist ; nuancer | Conserver l’ordre de préparation ; transformer les généralisations irréversibles sur les premières semaines en risques conditionnels. | P0 |
| `premiere-impression-annonce` | Garder ; relier à l’audit | Mini-test utile ; ne pas présenter tous les comportements d’acheteurs ou portails comme identiques. Le visiteur doit savoir si le CTA ouvre un article ou un outil. | P1 |
| `annonce-vue-peu-de-contacts` | Garder ; qualifier les mesures | La distinction vues/ouvertures/contacts est utile ; la définition des métriques dépend de la source. Relier aux réponses déjà données. | P0 |
| `retours-de-visite` | Garder la grille ; nuancer les seuils | Répétition d’un motif utile, mais trois visites ne constituent pas automatiquement une preuve représentative. | P0 |
| `verifier-avant-baisse-prix` | Garder ; conditionner les conclusions | Les vérifications sont utiles ; « la baisse ne changera rien » ne peut être une règle générale. Ajouter conditions et options sans conseiller un montant. | P0 |
| `reprendre-commercialisation` | Garder ; rendre les options réelles | Pause, reprise ou continuité doivent rester possibles ; l’ancienneté seule ne prouve pas une annonce irrécupérable. | P0 |
| `/recommander` | Garder en secondaire | Il s’agit de recommander un proche via SAFTI Connect, pas d’accueillir un visiteur recommandé. Créer cette seconde entrée séparément. | P1 |
| `/rejoindre` | Conserver en secondaire | Ne gêne pas la cible si elle reste hors navigation principale. Aucun chantier métier, rémunération ou recrutement à lancer ici. | P2 |
| `/confidentialite` | Garder ; aligner aux fonctions réellement livrées | Mettre à jour conservation, reprise, géocodage, suites choisies et mesure à chaque tranche ; aucune promesse de sauvegarde non disponible. | P0 |
| `/mentions-legales` | Garder ; corriger les crédits factuels | Le logo servi est décrit comme issu de DM Serif Display par les actifs vectoriels, alors que les mentions citent encore Archivo Black. Les mentions professionnelles ne sont pas certifiées par cet audit technique. | P2 |
| `/404` | Garder la récupération ; élargir | Proposer achat, vente, transition et reprise. Le jeu de mots sur les écarts et les seuls liens vendeurs ne répondent pas à tous les visiteurs. | P1 |
| `/composants` | Garder comme référence interne | Noindex existant ; devenir le futur témoin des états communs après implémentation, pas une porte publique. | P2 |
| Redirections existantes | Garder ; contrôler les destinations | Préserver `/carte`, `/votre-rue`, `/ma-recherche` et les anciens liens. `/lea` est une redirection, pas un personnage à réintroduire. | P0 |
| Cockpit et TIM | Conserver hors refonte | Modèle privé riche de projets, critères et historiques. Ajouter seulement le contrat d’entrée/sortie de contexte nécessaire aux parcours publics. | P1 |
| Composants et visuels non utilisés | Ne pas supprimer automatiquement | Présence d’un fichier ≠ présence dans le site. Démontrer absence de références et d’usage avant toute suppression dans un chantier ultérieur. | P2 |

### B3. Ce que chaque séquence actuelle apporte

Les quatre colonnes suivantes répondent au contrôle du maître : fonction, compréhension, valeur immédiate, prochaine étape. Une aide expliquant la question n’est pas comptée comme une restitution personnalisée.

| Séquence réelle | Fonction | Compréhension et valeur | Suite réelle / décision d’audit |
|---|---|---|---|
| Accueil : titre et quartier | Reconnaissance émotionnelle locale | Une vie derrière l’adresse ; image explicitement illustrée | Trois choix. Garder l’accroche, rapprocher le premier choix et rendre la transition visible. |
| Accueil : fait DVF et limites | Preuve de méthode | Une médiane n’est pas une estimation | Exploration locale libre ; conserver cette distinction. |
| Accueil : méthode et Mouaad | Situer le service | Faits, priorités, décision puis humain | Carte/contact ; enrichir par un exemple concret de décision plutôt que des promesses répétées. |
| Vendeur : cinq situations | Nommer le moment | Reconnaissance utile, avant jargon | 4–5 questions selon branche ; conserver. |
| Vendeur : 24 questions | Situer calendrier, préparation ou signaux | Contexte pertinent ; bénéfice surtout différé | Calcul puis résultat ; intercaler une clarification liée aux réponses sans rallonger systématiquement. |
| Vendeur : transition d’analyse | Signaler le changement d’état | Pas de valeur propre ; calcul déjà synchrone | Délai fixe de 1,1 s hors mouvement réduit. Remplacer par une transition brève sans attente artificielle. |
| Vendeur : résultat | Reformuler, interpréter, limiter | Première lecture autonome réelle | Une action et ressource, puis formulaire. Ajouter comparaison et conditions de réexamen. |
| Audit : URL | Chercher des éléments visibles | Explique la lecture ponctuelle | Trois questions même en secours ; garder. |
| Audit : durée, signal, contexte | Localiser l’étape probable | Questions adaptées, retour possible | Deux actions ; ajouter « information inconnue » lorsque nécessaire. |
| Audit : résultat | Donner deux actions et une limite | Valeur concrète avant collecte | Recommencer ou transmettre ; ajouter corriger/emporter/continuer avec ce contexte. |
| Rue : adresse puis repères | Délimiter une observation locale | Ventes passées, effectif, intervalle et limites | Qualification personnelle ; garder calculs, dates et périmètres explicites. |
| Rue : qualification | Comprendre l’intention et quelques contraintes | Questions utiles, mais pas de nouvelle lecture issue des réponses | Formulaire direct : rompt la promesse locale personnalisée. |
| Ressource : réponse courte puis grille | Expliquer et aider à vérifier | Valeur indépendante du contact | Parcours vendeur préorienté ; ajouter retour à la lecture d’origine. |
| Carte : portrait/contact | Identifier Mouaad et garder ses coordonnées | Utilité pratique réelle | Outils sous le premier écran ; rendre le premier éclairage plus rapide. |
| Méthode/accompagnement | Expliquer la manière de travailler | Limites et rôle humain explicités | Entrées surtout vendeuses ; élargir sans effacer la méthode vendeur. |
| Formulaire de suite | Faire choisir et transmettre | Consentement explicite ; certains états d’échec solides | Pas encore une continuité commune ni une relecture structurée. |

**Acquéreur, écran par écran.** Les onze étapes réelles ne doivent pas être confondues avec les sept séquences validées du maître.

| Écran réel | Fonction / valeur observée | Traitement recommandé |
|---|---|---|
| Introduction | Promesse ouverte, bouton « Dessiner ma recherche » | Garder la promesse ; adapter à l’entrée ; CTA « Mettre ma recherche au clair ». |
| 1 Motivation | Premier achat, agrandissement, cadre, rapprochement… | Conserver les formulations utiles. Retirer investissement de ce seul parcours résidence principale. |
| 2 Typologie | Filtre maison/appartement pour DVF | Déplacer après compréhension des usages ; ne pas forcer une forme de bien. |
| 3 Secteur | Communes acceptables, ancrage, trajet | Conserver ; séparer les questions majeures et le point de trajet. |
| 4 Préparation | Financement, vente préalable, horizon sur un écran | Conserver les données ; révéler successivement les dépendances et ouvrir transition. |
| 5 Budget | Montant pour le bien distinct des frais/travaux | Conserver cette précision ; autoriser inconnu et une lecture sans chiffre. |
| 6 Surface | Minimum déclaré, nécessaire au calcul actuel | Déplacer après usages ; minimum déclaré ≠ exclusion professionnelle validée. |
| 7 Marché | Première forte restitution, quartiles et ratio | Conserver le repère, supprimer les conclusions de disponibilité et les m² prétendument offerts. |
| 8 Priorités | Choix de 1–3 éléments | Conserver hiérarchisation ; non sélectionné doit rester non renseigné. |
| 9 Arbitrage | Scénarios localisation/surface/les deux si ratio bas | Garder le principe comparatif ; partir d’une tension réelle, pas d’un seul quartile. |
| 10 Lecture | Prochaine action, synthèse, impression avant coordonnées | Recomposer en quatre blocs maîtres avec justification et révision. |
| 11 Suites | Copie, opportunité, échange, cases indépendantes | Conserver le choix ; ajouter relecture distincte et copie autonome sans appel. |
| Confirmation | Enregistrement distingué de notification ; copie manuelle annoncée | Conserver la nuance ; garder accès à la restitution après envoi. |

### B4. Corrections justifiées, sans réécriture massive

| Problème précis | Preuve actuelle | Gain attendu et limite du changement |
|---|---|---|
| Question locale suivie de collecte avant lecture promise | `votre-rue.astro:1034`, `:1181`, `:1192` | Ajouter une micro-restitution issue des réponses ; ne pas supprimer la valeur DVF déjà ouverte. |
| Priorité absente transformée en flexibilité | `ma-recherche.astro:666`, `:969`, `:1069` | Séparer priorité, préférence, condition d’ouverture, exclusion déclarée et inconnu. Aucune contrainte ne devient négociable par omission. |
| Anciennes ventes transformées en offre disponible | `ma-recherche.astro:924`, `:995` | Dire « repère issu des ventes passées » ; aucune promesse de surface, de bien existant ou de délai. |
| Modification d’un résultat partagé perd les réponses | `resultat.astro:30`, `:203` ; reproduit en navigateur | Ouvrir une revue du même état, avec édition ciblée ; versionner avant de réordonner des options. |
| Budget changé mais lecture dérivée potentiellement ancienne | `ma-recherche.astro:748`, `:1262` | Déclarer les dépendances et invalider la lecture dès modification. Risque repéré dans le code ; recette spécifique exigée. |
| Panne ou absence DVF sans issue qualitative | `ma-recherche.astro:642`, `:650`, `:1254` | Rendre une lecture limitée sur les priorités/dépendances, sans ratio ni conclusion numérique. |
| Réponse « Le prix » reformulée en intention de baisser | `situations.ts:513` | Dire « vous vous interrogez sur le prix » ; garder la question et son choix. |
| « Prix modifié » reformulé en baisse | `situations.ts:632` | Dire « modifié » ; ne pas demander un champ supplémentaire si la direction n’est pas utile. |
| Intuition personnelle renforçant un niveau comme une observation | `engine.ts:43` | Conserver le moteur, qualifier la provenance des indices ; convergence interne ≠ preuve de marché. |
| CTA de prestation ouvrant un article | `situations.ts:94`, `resultat.astro:255` | Annoncer « Ouvrir la grille de lancement » ; réserver la relecture à une action humaine réelle. |
| Affirmations générales non étayées ou absolues | `situations.ts:214`, `:215`, `:410` ; `resourceContent.ts:25` et suites | Garder questions, grilles et prudence ; rendre délais et effets conditionnels. Ne pas fabriquer de source pour maintenir une formule. |
| Légitimité fondée sur un terrain non documenté | `methode.astro:159`, `mouaad.astro:39`, `ressources/index.astro:70` | Remplacer les formulations non établies par la méthode observable. Ne pas inventer ancienneté, volume ou témoignages. |
| Attribution déduite de la route | `votre-rue.astro:1230`, `lib/analytics.ts:43` | Conserver une source explicitement connue ; sinon « inconnue ». Une consultation de marché ne signifie pas vendeur. |
| Copie demandée confondue avec contact | `votre-rue.astro:1201` | Séparer recevoir sans appel, demander une relecture et échanger. |

Les données disponibles sont **6 318 mutations dans sept communes, de 2021 à 2025, extraction datée du 24 juillet 2026** (`public/data/dvf-meta.json`). Aucun fait sur les prix de septembre 2026, les annonces disponibles ou la demande actuelle n’est déduit de cette base.

Trois lectures statistiques coexistent : rayon adaptatif autour d’une adresse ; commune/type/année ; ratio budget–surface confronté à une distribution sur cinq ans. Elles peuvent légitimement différer. La cible partage leurs définitions et leurs règles de qualité, sans prétendre que leurs résultats sont interchangeables.

## C. Architecture cible unique

### C1. Carte du système

```text
VIDÉO / SOCIAL ─ promesse précise ─────────────┐
GOOGLE ─ réponse ou orientation ───────────────┤
QR / CARTE ─ utilité locale ou personnelle ────┤
APRÈS ÉCHANGE ─ contexte confirmé ─────────────┤
RECOMMANDATION ─ preuve de méthode ───────────┘
                        ↓
       Reconnaître la situation et le niveau d’avancement
                        ↓
       PREMIÈRE VALEUR OU REPRISE DU DÉJÀ COMPRIS
                        ↓
       VENDRE ←──── contexte de projet ────→ ACHETER
           ╲                 │                 ╱
            ╲────────── TRANSITION ────────────╱
                        ↓
       Décisions communes + réponses conditionnelles
       faits / priorités / preuves / inconnues / options
                        ↓
       MICRO-LECTURE → LECTURE → SYNTHÈSE APPROFONDIE
       (profondeur choisie ; jamais trois péages obligatoires)
                        ↓
       Corriger · Emporter · Approfondir · Attendre
                        │
                        ├── Demander une relecture à Mouaad
                        └── Échanger directement avec Mouaad
                              ↓ selon le besoin et le choix
                           Accompagnement si pertinent
```

Le moteur est une responsabilité fonctionnelle commune, **pas un choix de technologie ou une obligation d’IA**. Il conserve la provenance et la portée des éléments, sélectionne les seules questions utiles, assemble une lecture explicable et identifie les conclusions à réviser après un changement.

### C2. Trois profondeurs, choisies selon le contexte

| Profondeur | Entrée adaptée | Effort cible de conception | Résultat minimum |
|---|---|---|---|
| Micro-lecture | Sujet précis vidéo, QR, recherche thématique | Réponse utile immédiatement ; 1–2 interactions ; première valeur visée en moins de 30 s | Une distinction appliquée, une inconnue et une prochaine vérification ; export/copie libre. |
| Lecture intermédiaire | Personne qui veut situer son projet | Séquences courtes ; environ 2–4 min à confirmer par tests | Situation, éléments clairs, options, limites et prochaine décision, sans identité requise. |
| Synthèse approfondie | Après échange ou approfondissement volontaire | Jusqu’à 8–10 min si le contexte le justifie ; reprise possible | Contexte détaillé, dépendances, scénarios, responsabilités de vérification, prochaine action et support de relais. |

Ces durées sont des objectifs de conception, pas des temps déjà mesurés ni une promesse universelle. Un contact chaud peut choisir court ; un visiteur anonyme peut aller loin. La profondeur ne dépend jamais de la valeur commerciale estimée du visiteur.

### C3. Progression mentale et responsabilité des écrans

| Niveau maître | Mécanisme cible | Preuve que l’écran mérite sa place |
|---|---|---|
| Se reconnaître | Situation formulée dans les mots du quotidien | La personne identifie ce qui l’amène ou peut le préciser autrement. |
| Comprendre ce qui compte | Une distinction et sa conséquence | Elle sépare fait, impression et contrainte. |
| Voir options et conséquences | Comparaison sur les mêmes dimensions | Elle voit ce que chaque option préserve, exige et laisse incertain. |
| Identifier ce qui manque | Vérification nommée et utile | Elle sait quelle information peut changer la décision. |
| Comprendre l’humain | Apport de Mouaad lié à ce manque | Elle comprend ce qu’il vérifiera lui-même ou coordonnera. |
| Décider et assumer | Choix provisoire et motif de réexamen | Elle peut expliquer son choix à froid, y compris une attente. |

Le système peut s’arrêter à une vérification nécessaire. Il ne force pas les six niveaux pour prétendre avoir produit une décision définitive.

### C4. Registre interne des décisions

| Famille de travail interne | Décisions du maître | Réutilisation |
|---|---|---|
| Projet et quotidien | D01 changement ; D02 accord ; D03 compromis ; D04 secteur compatible | Achat, vente et transition selon le projet réel. |
| Moyens et réalité du bien | D05 coût complet ; D06 limite supportable ; D07 ressources mobilisables ; D08 valeur défendable ; D09 état/travaux | Même distinction connu/estimé/à vérifier ; applications différentes. |
| Possibilité d’agir et engagements | D10 pouvoir de décider ; D11 usage possible ; D12 règles collectives ; D20 conditions d’engagement ; D21 changement après engagement ; D22 remise et usage | Clarifier conditions et interlocuteurs compétents, sans validation automatique. |
| Choix acquéreur | D16 biens à visiter ; D17 vérifications de visite ; D18 biens disponibles ; D19 proposition d’achat | Mobilisées selon avancement ; aucun moteur de recommandation de biens dans cette V1. |
| Mise en vente | D23 moment ; D24 préparation ; D25 prix de présentation ; D26 présentation/accès ; D27 blocage ; D28 propositions reçues | Appui sur les cinq branches actuelles ; les montants/offres nécessitent le dossier réel. |
| Transition | D29 ordre vente/achat ; D30 intervalle ; D31 compatibilité des engagements | Une vue commune de deux projets reliés. |
| Accompagnement et incertitude | D13 périmètre d’accompagnement ; D14 poursuivre/recadrer/changer ; D15 lever l’incertitude déterminante | Présents au point de limite dans chaque parcours. |
| Réexamen | D32 attendre, renoncer ou reformuler | Sortie légitime de toute décision ; ne déclenche pas une relance automatique. |

Les 32 décisions ont une place dans l’architecture ; cela ne demande ni 32 pages ni 32 questionnaires. La première réalisation approfondit les décisions nécessaires aux trois parcours spécifiés ci-dessous. Les autres restent des vérifications ou suites humaines clairement annoncées tant qu’une expérience spécifique n’existe pas.

Une **réponse LEVOIS** réutilisable porte : décision éclairée ; conditions d’application ; variables nécessaires ; connaissances et preuves avec portée ; raisonnement ; options ; inconnues ; limites ; éléments qui changeraient la conclusion ; versions. Le contexte d’un visiteur ne devient jamais une preuve générale. Modifier le support de restitution ne crée pas une nouvelle réponse métier.

## D. Les cinq portes, du premier écran au prolongement

### D1. Vidéo ou réseau social

**État initial** : attention fragile, question déjà choisie. Le lien désigne une expérience et une promesse autorisée ; il ne doit pas simplement marquer une provenance pour ouvrir le même questionnaire long.

| Écran | Contenu et interaction | Compréhension obtenue / suite |
|---|---|---|
| V0 · Continuité | Titre reprenant exactement la question du contenu ; réponse courte visible, sans lecture préalable de la marque. Exemple : « Des visites, mais aucune offre : que vérifier ? » | Distinguer le fait du diagnostic. Le CTA annonce la petite action suivante. |
| V1 · Application | Une question sur le facteur qui change réellement la lecture, puis au plus une précision. « Quel retour revient ? » / « Aucun retour précis ». | Micro-valeur située ; l’inconnu donne un moyen de l’éclairer. |
| V2 · Micro-lecture | Réponse, raison, limite et prochaine vérification visibles avant coordonnées. | Copier/garder, modifier ou approfondir. |
| V3 · Approfondissement facultatif | Montrer ce qui est déjà connu ; n’ajouter que les séquences utiles du parcours métier. | Lecture intermédiaire ou approfondie selon l’effort choisi. |
| V4 · Relais éventuel | Une incertitude précise justifie une relecture ou un échange. | Paquet de contexte approuvé, pas de recommencement. |

La même expérience peut recevoir cent vidéos : chaque lien référence la promesse et la variante utile, pas une copie de page. Un sujet inconnu affiche une orientation honnête ; il ne prétend pas personnaliser une promesse qu’il ne reconnaît pas. Sans provenance exploitable, le titre de l’expérience reste suffisant pour comprendre l’action.

### D2. Google ou découverte directe

| Écran | Arrivée et interaction | Valeur / suite |
|---|---|---|
| G0 · Réponse ou orientation | Article, outil local ou question ciblée : réponse immédiatement visible. Sur accueil : « Acheter, vendre, ou coordonner les deux ? » | La personne trouve soit sa réponse, soit son point de départ en un choix. |
| G1 · Première distinction | Fait local avec limites, exemple d’arbitrage ou explication d’un signal selon la page. | Preuve de méthode avant demande de projet complet. |
| G2 · Situer son cas | « Voir ce que cela change pour mon projet » ; choix de situation s’il n’est pas connu. | Micro-lecture contextualisée. |
| G3 · Parcours pertinent | Acquéreur, vendeur ou transition, profondeur choisie. | Restitution proportionnelle ; retour possible à la ressource consultée. |
| G4 · Sorties | Emporter, vérifier seul, relecture, échange. | La réponse cherchée reste accessible si la personne s’arrête. |

Les visiteurs qui cherchent directement Mouaad gardent un accès immédiat à ses coordonnées. Le principe de valeur avant collecte n’oblige pas quelqu’un qui veut écrire à suivre un outil auparavant.

### D3. QR, carte ou publicité locale

Il existe deux promesses physiques déjà matérialisées dans les destinations : **voir des ventes locales** avec `/votre-rue`, et **retrouver Mouaad** avec `/carte`. La cible respecte les deux ; un QR ne signifie pas automatiquement « contact chaud ».

| Écran | QR local / `/votre-rue` | Carte / `/carte` |
|---|---|---|
| Q0 | Adresse ou commune ; préciser que l’on consulte des ventes passées. | Portrait réel, identité courte, garder le contact ; choix « Quel sujet voulez-vous éclaircir ? » visible rapidement. |
| Q1 | Repère local avec période, effectif et limite ; si adresse non résolue, choisir la commune ou continuer sans adresse. | Achat, vente ou transition ; une distinction utile liée au sujet. |
| Q2 | Une question : « Que cherchez-vous à comprendre avec ce repère ? » | Une ou deux interactions adaptées, sans présentation institutionnelle obligatoire. |
| Q3 | Micro-lecture personnalisée avant coordonnées. | Micro-lecture, ou reprise si un contexte a réellement été transmis. |
| Q4 | Approfondir le bon projet, conserver ou demander une relecture précise. | Mêmes sorties ; écrire/appeler reste disponible. |

### D4. Après un échange avec Mouaad

| Écran | Contenu et contrôle | Valeur / suite |
|---|---|---|
| H0 · Reprendre | « À la suite de notre échange : voici ce que nous avons déjà posé. » Contexte daté, visible seulement après accès autorisé. | Confirmer/corriger, choisir un autre projet ou signaler « Ce n’est pas mon dossier ». |
| H1 · But du travail | La question à préparer maintenant, ce qui est déjà connu et le temps indicatif. | La personne comprend pourquoi une exploration plus longue est utile. |
| H2 · Compléter le manque | Questions utiles des séquences métier, déjà renseignées omises ; preuves demandées seulement si nécessaires. | Clarifications à chaque séquence ; reprise à tout moment. |
| H3 · Comparer | Deux ou trois scénarios ancrés dans le contexte ; engagements ou pièces à vérifier isolés. | Conséquences et conditions comparables. |
| H4 · Synthèse | Lecture approfondie datée ; changements depuis l’échange mis en évidence. | Corriger, conserver, préparer une question pour Mouaad. |
| H5 · Partage choisi | Aperçu exact du contenu et de la suite demandée. | Mouaad reçoit le contexte corrigé et les points ouverts. |

L’identité peut intervenir dès H0 parce qu’il s’agit de protéger et reprendre un dossier connu. Elle n’est pas un moyen de débloquer artificiellement un résultat. Si le contexte est indisponible, proposer le parcours autonome ou une demande de nouveau lien ; ne pas inventer de préremplissage. Une modification faite dans le dossier privé ne remplace pas silencieusement la version du visiteur.

### D5. Recommandation entrante

| Écran | Contenu et interaction | Valeur / suite |
|---|---|---|
| R0 · Accueil | « On vous a parlé de Mouaad. Voyez comment LEVOIS peut vous aider à décider. » Identité courte, aucune affirmation sur le proche non connue. | Preuve de méthode immédiatement accessible, pas de formulaire de parrainage. |
| R1 · Démonstration | Situation illustrative clairement indiquée : une observation, deux interprétations possibles, la vérification qui les départage. | La confiance transférée devient une méthode compréhensible. |
| R2 · Mon cas | Achat, vente ou transition ; situation et niveau d’avancement. | Micro-lecture propre à la personne. |
| R3 · Profondeur choisie | Approfondir les séquences utiles ou s’arrêter à la première lecture. | Même qualité que les autres portes. |
| R4 · Sortie | Conserver, relecture ou échange avec contenu approuvé. | Aucune information transmise au prescripteur automatiquement. |

`/recommander` conserve sa fonction actuelle de recommandation sortante. L’arrivée d’une personne recommandée ne signifie ni consentement de contact, ni autorisation de collecter le nom ou les coordonnées de son proche.

### D6. Les quinze déclinaisons concrètes

Les codes E, F et G renvoient aux contrats détaillés ci-dessous. Les étapes de la porte s’ajoutent uniquement lorsqu’elles ne répètent pas une valeur déjà reçue.

| Porte × projet | Premier écran / première valeur | Séquence jusqu’à la restitution | Passage humain pertinent |
|---|---|---|---|
| Vidéo × vendeur | « Avant de toucher au prix, où l’intérêt s’arrête-t-il ? » Distinguer observation et cause. | V0–V2/F1 → E2 branche concernée si souhaité → F2 | Vérifier annonce, comparables ou retours manquants ; G3. |
| Vidéo × acquéreur | « Plus de mètres carrés, pour changer quoi ? » Un usage peut compter plus qu’une surface seule. | V0–V2/F1 → E3 séquences manquantes si souhaité → F2 | Traduire usages et contraintes dans les biens réellement disponibles. |
| Vidéo × transition | « Acheter avant de vendre : qu’est-ce qui rendrait cela possible ? » La séquence dépend des ressources et de l’intervalle. | V0–V2/F1 → E4 si souhaité → F2 | Vérifier la disponibilité des fonds et la compatibilité des calendriers avec les interlocuteurs concernés. |
| Google × vendeur | Réponse de ressource ou orientation de vente, visible immédiatement. | G0–G2 → E2 → F2 ; article consultable seul | Confronter une hypothèse commerciale précise. |
| Google × acquéreur | « Qu’est-ce que votre achat doit changer ? » ou outil explicitement recherché. | G0–G2 → E3 → F2 | Traiter une incertitude de recherche ou de bien repéré. |
| Google × transition | Réponse sur l’ordre vente/achat, puis dépendance principale. | G0–G2 → E4 → F2 | Comparer les conditions encore non vérifiées. |
| QR × vendeur | Faits locaux ou carte puis « Vous préparez une vente ? » | Q0–Q3 → E2 sans ressaisie des faits utiles → F2 | Situer ce que le repère ne dit pas du bien et du projet. |
| QR × acquéreur | Faits locaux ou carte puis « Vous cherchez un logement ? » | Q0–Q3 → E3, DVF repris comme référence seulement → F2 | Relier quotidien, secteurs et options concrètes. |
| QR × transition | « Votre prochain logement dépend-il d’une vente ? » | Q0–Q3 → E4 → F2 | Reconstituer les dépendances, pas seulement estimer la vente. |
| Après échange × vendeur | Contexte et question convenus : lancement, blocage, offre ou incident. | H0–H2 → E2 ciblé, pièces si utiles → H3–H4/F3 | Relecture des évolutions et décisions à coordonner. |
| Après échange × acquéreur | Objectif et critères déjà exprimés à confirmer. | H0–H2 → E3 sans répétitions → H3–H4/F3 | Même Profil Acquéreur ; distinguer ce qui vient du visiteur et de Mouaad. |
| Après échange × transition | Vente/achat et dates connues dans un même contexte. | H0–H2 → E4 points manquants → H3–H4/F3 | Conditions croisées et solution d’attente à vérifier. |
| Recommandation × vendeur | Démonstration vendeur courte, puis « Où en est votre vente ? » | R0–R2 → E2 → F2, F3 seulement volontaire | Lire la situation de cette personne, sans importer celle du prescripteur. |
| Recommandation × acquéreur | Exemple usage/préférence, puis avancement personnel. | R0–R2 → E3 → F2 | Relecture des priorités et incertitudes réellement exprimées. |
| Recommandation × transition | Exemple de dates compatibles en apparence mais fonds non disponibles. | R0–R2 → E4 → F2 | Comparer les conditions du dossier, sans scénario financier automatique. |

## E. Spécification des expériences clés

### E1. Aiguilleur commun

**Rôle et promesse** : aider à choisir la prochaine question utile. L’accueil affiche « Je cherche mon prochain logement », « Je réfléchis à vendre ou je vends déjà », « Je dois coordonner une vente et un achat ». « Explorer les ventes locales » reste un accès d’outil explicite, distinct des trois projets.

**Information nécessaire** : intention seulement, puis avancement si utile. Aucune adresse, identité ou budget requis pour orienter. Si les mots ne conviennent pas : « Ma situation ne rentre pas dans ces choix » donne une explication des limites et l’accès direct à Mouaad ; ce n’est pas un formulaire obligatoire.

**Interaction et micro-valeur** : chaque choix montre immédiatement la question que l’expérience permettra de clarifier. Une vente déjà publiée ne doit pas recevoir un cours d’introduction à l’achat. Une source vidéo connue saute l’aiguilleur et conserve un accès « Ce n’est pas ma situation ».

**Sortie** : E2, E3, E4, E5 ou contact volontaire. **Réussite** : orientation comprise en un choix lorsque la situation est explicite ; zéro répétition de l’intention entre pages. **Limite** : le choix ne qualifie ni urgence réelle, ni solvabilité, ni maturité commerciale.

### E2. Vendeur, choisir le prochain pas

**Promesse** : « Comprendre ce que votre situation permet de décider maintenant, et ce qu’il faut vérifier avant d’agir. »

Le repérage distingue d’abord **avant publication**, **bien en vente**, **offre ou incident**. Les cinq situations actuelles restent accessibles directement par leurs liens. « Réfléchir à vendre » n’est pas assimilé à « prêt à publier ».

| Séquence cible | Informations et interaction | Micro-valeur / sortie |
|---|---|---|
| S1 · Ce que la vente doit permettre | Pour une réflexion : changement recherché et contrainte de date si connue. Pour une vente engagée : situation déjà identifiée. | Distinguer décision de vendre et réglage de commercialisation. Si prochain achat dépendant, proposer E4 en reprenant les réponses. |
| S2 · Le bon diagnostic | Préparer, publié récemment, peu de contacts, visites sans offre, vente longue : réutiliser leurs 24 questions sans toutes les poser. | Après une séquence significative, afficher ce qui se distingue déjà et ce qui reste inconnu. |
| S3 · Ce que l’on sait réellement | Revue courte des faits déclarés, des suppositions et des pièces manquantes. | Éviter qu’une impression sur le prix devienne un fait établi. |
| S4 · Les suites possibles | Deux options pertinentes sur les mêmes dimensions ; troisième uniquement si elle apporte un vrai choix. | Comparer vérifier, agir sur un levier, observer ou suspendre. Ne pas imposer une relance. |
| S5 · Lecture | Restitution F2 ; lien entre réponses, hypothèse et limites. | Conserver, corriger, appliquer une grille ou demander une relecture ciblée. |

**Branches à ajouter, de façon bornée** :

- **Réflexion avant vente** : ce qui motive le changement → ce que l’attente permettrait ou empêcherait → informations manquantes → préparer/attendre/explorer. Pas d’estimation obligatoire pour être utile.
- **Offre reçue** : montant, conditions et calendrier peuvent être inconnus ou déclarés ; montrer qu’un montant seul ne permet pas de choisir. Préparer une grille de comparaison, puis une vérification humaine si l’engagement est en jeu. Ne pas recommander automatiquement une acceptation.
- **Compromis annulé ou événement après engagement** : nommer ce qui a changé, ce qui est confirmé et les interlocuteurs déjà saisis. Livrer une liste de points à vérifier et d’options à examiner. Aucun diagnostic juridique automatique, aucune nouvelle publication recommandée sans contexte.

**Questionnaire à conserver** : préparation (calendrier, origine du prix, décision difficile, présentation, documents) ; publication (durée, signaux, changements, attente) ; contacts (durée, vues, réactions, fragilité perçue, prix) ; visites (nombre, seconde visite, retours, décrochage, changement envisagé) ; durée longue (ancienneté, modifications, évolution, préoccupation, projet). Les corrections B4 portent sur l’interprétation et la continuité, pas sur un remplacement massif de ces questions.

**Critères de réussite** : une personne sans statistiques peut obtenir un prochain relevé utile ; une publication récente n’est pas automatiquement déclarée défaillante ; attendre est une option avec condition de réexamen ; aucune baisse chiffrée ni estimation n’est inventée ; modifier une réponse modifie uniquement les conclusions dépendantes.

### E3. Acquéreur, mettre la recherche au clair

**Périmètre** : future résidence principale. Investissement et résidence secondaire ont une explication de périmètre et une sortie autonome/contact volontaire ; ils ne réutilisent pas une lecture de résidence principale présentée comme adaptée.

**Socle commun** : le visiteur anonyme et l’acquéreur connu utilisent le même sens des données et la même logique. La différence est le contexte déjà disponible, son niveau de confirmation et la profondeur souhaitée. Aucun score global, recommandation automatique de biens ou présomption de financement.

| Séquence validée | Question principale et embranchements utiles | Micro-valeur attendue |
|---|---|---|
| A1 · Avancement | « Où en êtes-vous ? » Idée, préparation, recherche/visites, bien repéré, engagement en cours. Pour un dossier connu, confirmer ce stade. | La prochaine décision n’est pas la même avant une première visite et après une offre. |
| A2 · Situation actuelle | « Dans votre logement actuel, qu’est-ce qui vous conduit à envisager un changement ? » Statut et vente préalable seulement s’ils créent une dépendance. | Séparer envie de changement et obligation de calendrier ; ouvrir la transition si nécessaire. |
| A3 · Amélioration recherchée | « Qu’est-ce que cet achat doit changer en premier ? » Puis ce qui mérite d’être conservé. Texte libre facultatif, choix concrets et correction de la reformulation. | L’objectif devient formulable dans les mots de la personne. |
| A4 · Usages avant typologie | « De quoi avez-vous besoin dans votre quotidien ? » Isolement pour travailler, accès, extérieur, pièces et trajets selon réponse. Typologie/surface ensuite si utiles. | Transformer une caractéristique en usage, sans prétendre déduire automatiquement un nombre de pièces ou de m². |
| A5 · Cadre de réalité | Secteur/point de trajet ; budget pour le bien et dépenses non comprises ; niveau de vérification ; calendrier ; dépendance de vente. Une question majeure à la fois. | Distinguer limite supportable, montant estimé et ressources confirmées. Repère DVF facultatif, avec limites attachées au chiffre. |
| A6 · Arbitrage utile | Une tension réellement exprimée ; deux ou trois options, dont vérifier/attendre si pertinent. Sans tension identifiée : confirmer l’ouverture, ne pas en fabriquer. | Chaque option dit ce qu’elle préserve et exige ; la personne peut ne pas choisir encore. |
| A7 · Lecture avant coordonnées | Les quatre blocs du maître, puis « Votre prochaine décision utile ». | Compréhension exploitable, explication, correction, copie et suites choisies. |

Les sept séquences ne sont pas sept écrans surchargés. Les réponses déjà connues sont confirmées ou omises ; les précisions se dévoilent selon leur utilité. Chaque séquence produit sa clarification. La version approfondie peut explorer plusieurs usages ; la version courte peut conserver certains usages comme inconnus sans livrer une fausse conclusion.

**Sémantique impérative** :

| Notion | Sens | Règle |
|---|---|---|
| Priorité | Ce que la personne veut protéger d’abord | Ne dit pas automatiquement ce qu’elle refuserait. |
| Préférence | Ce qui serait souhaitable | Peut rester non arbitrée. |
| Ouverture sous condition | Variation explicitement acceptable si une condition est remplie | La condition fait partie du critère et de la restitution. |
| Exclusion déclarée | Ce que la personne dit ne pas pouvoir accepter | À distinguer d’une exclusion validée dans le suivi professionnel ; ne pas effacer sa déclaration. |
| Non renseigné | La question n’a pas été traitée ou la personne ne sait pas | Ne signifie ni flexibilité ni absence de besoin. |

**Exemple d’interaction** : « J’aimerais plus grand pour télétravailler au calme. » La lecture propose de comparer une pièce réellement isolable et davantage de surface sans isolement. Elle ne conclut pas qu’un appartement convient ou qu’une maison est nécessaire. Le choix permet de garder « calme pendant le travail » et de laisser le type de bien ouvert sous une condition exprimée.

**Limites et états** : sans budget, lire les besoins et l’ordre des vérifications ; sans DVF, conserver toute la lecture qualitative ; hors secteur couvert, dire qu’aucun repère local n’est disponible ; si plusieurs personnes ne sont pas d’accord, restituer le désaccord sans choisir un porte-parole à leur place. Un bien déjà repéré peut servir de contexte à une vérification humaine, sans construire un comparateur d’annonces dans cette mission.

### E4. Transition, rendre vente et achat compatibles

**Promesse** : « Voir ce qui dépend de quoi avant de choisir l’ordre entre votre vente et votre achat. »

Ce parcours relie deux projets ; il ne calcule pas automatiquement une faisabilité bancaire. Il accueille aussi bien une vente préalable certaine qu’une dépendance à vérifier. Les données déjà saisies côté achat ou vente sont reprises avec leur provenance.

| Écran ou séquence | Information minimale | Interaction, valeur et sortie |
|---|---|---|
| T1 · Le changement | Ce que le prochain logement doit permettre ; avancement de vente et d’achat | Deux projets sur une même ligne de vie, sans exiger deux questionnaires. |
| T2 · Ce qui dépend de la vente | « L’achat nécessite-t-il le produit de la vente ? » Oui/non/à vérifier ; ressources confirmées ou estimées | Une dépendance est nommée. Un montant net inconnu reste inconnu. |
| T3 · Les dates | Date souhaitée, contrainte réelle, engagement déjà pris ; pour chaque projet | Frise simple distinguant souhait, condition et engagement. Aucune date inventée ni durée standard présentée comme certaine. |
| T4 · L’intervalle | Possibilité d’hébergement temporaire, durée acceptable, contraintes de vie ; montant seulement si connu | Rendre concret ce que signifie vendre avant d’acheter. |
| T5 · Coût et capacité de cumul | Frais identifiés, logement transitoire, charges simultanées, travaux ou déménagement | Liste de postes connus/à chiffrer ; addition seulement de valeurs fournies sur un périmètre commun. Aucun forfait bancaire ou fiscal inventé. |
| T6 · Scénarios | Vendre puis acheter ; acheter puis vendre ; coordonner les engagements | Comparer bénéfice, condition nécessaire, intervalle/cumul et point d’échec. Ne pas déclarer une option possible faute de vérification. |
| T7 · Ce qui ferait changer le choix | Ressource indisponible, date modifiée, vente ou achat retardé | Nommer une solution de repli à examiner ; sinon rendre visible l’absence de repli. |
| T8 · Lecture et relais | Choix provisoire ou vérification prioritaire | Restitution commune, plus tableau des dépendances et question précise à Mouaad. |

**Comparaison attendue** :

| Option | Ce qu’elle peut permettre | Ce qu’il faut accepter ou vérifier |
|---|---|---|
| Vendre puis acheter | Disposer d’un résultat de vente mieux établi avant l’achat | Disponibilité réelle des fonds, solution d’attente, coût et calendrier du prochain logement. |
| Acheter puis vendre | Sécuriser d’abord le prochain logement | Ressources et éventuel cumul vérifiés, résistance à un retard de vente, solution si le scénario échoue. |
| Coordonner vente et achat | Réduire potentiellement l’intervalle entre logements | Dépendances croisées, disponibilités des parties, portée des engagements et plan en cas de décalage. |
| Attendre ou reformuler | Éviter un engagement tant qu’un facteur déterminant est inconnu | Ce qui sera vérifié, par qui, et le fait qui permettra de réexaminer. |

**Réussite** : la personne peut nommer la dépendance déterminante et la prochaine vérification ; les données achat/vente ne sont pas ressaisies ; une option reste conditionnelle tant que ses prérequis le sont. **Limite** : ni simulation de crédit, ni conseil juridique sur un acte, ni validation de ressources ou prix net par le site. Mouaad peut organiser les vérifications avec banque/courtier, notaire ou professionnel compétent selon le point concerné.

### E5. Repères locaux, une preuve contextualisée

**Rôle** : apporter une observation utile, avec sa portée. **Données** : commune ou adresse seulement si nécessaire à cette observation ; type de bien et période pertinents, version de la base. **Interaction** : adresse confirmée, filtre explicite, résultat lisible sans manipuler une carte.

La sortie doit distinguer trois niveaux : « ventes observées ici », « ce que cela permet de comparer », « ce que cela ne dit pas de votre bien ou de votre recherche ». Le marché communal, le rayon autour d’une adresse et le bassin ne deviennent pas des équivalents silencieux.

Après les repères, une question d’intention produit une micro-lecture avant toute collecte. Exemple : « Vous préparez une vente. Ces ventes donnent un premier ensemble de références, mais l’état, les caractéristiques et les alternatives actuelles restent à comparer. Votre prochaine étape est de distinguer les références réellement comparables. » Cela ne fournit pas une estimation.

**États obligatoires** : ambiguïté d’adresse ; secteur hors couverture ; données indisponibles ; effectif insuffisant ; période ancienne ; types hétérogènes ; élargissement du rayon. Dans chaque état, expliquer le périmètre effectivement montré et proposer une action libre. Les seuils déjà utilisés doivent être documentés et conservés tant qu’une autre méthode n’est pas justifiée ; aucun chiffre de confiance global ne remplace cette explication.

### E6. Audit d’annonce et ressources reliées

L’audit conserve son contrat simple : lien ponctuel, trois réponses, deux actions avant coordonnées. Il distingue **page lisible**, **portail qui refuse**, **erreur de transport**, **contenu insuffisant**. Une panne technique n’autorise pas à affirmer que le portail refuse la lecture.

Les deux actions indiquent ce qui vient du contenu lu et ce qui vient des déclarations. Le résultat peut être corrigé, copié et repris ; « Continuer à situer ma vente » réutilise durée et signaux compatibles. Une contradiction avec une réponse antérieure est proposée à la correction, jamais écrasée.

Les ressources restent des réponses ouvertes : réponse courte, explication, exemple identifié comme illustratif, vérification praticable, limite et suite. Le système présente au plus la ressource utile à la décision du moment, avec « Revenir à ma lecture ». Une grille annoncée doit être réellement utilisable ; un article ne prend pas le nom d’une prestation humaine.

La cible initiale ajoute seulement les supports requis par E3/E4 : grille usages/priorités, liste des postes de coût et grille des dépendances. Ce sont les supports de ces expériences, pas une commande de production éditoriale massive.

## F. Restitutions proportionnelles, explicables et révisables

### F1. Micro-lecture froide

**Anatomie** : réponse promise → élément fourni qui l’éclaire → inconnue → prochaine vérification → modifier/emporter/approfondir. Cible indicative : une lecture courte visible sans ouvrir quatre accordéons. Les réserves essentielles restent auprès de la conclusion.

**Exemple illustratif, vendeur venu d’une vidéo**

> Vous avez des visites, mais aucun retour précis sur ce qui retient les visiteurs.
>
> À ce stade, l’absence d’offre ne permet pas d’isoler une cause. Modifier le prix et la présentation en même temps rendrait aussi la réaction suivante difficile à interpréter.
>
> **Le prochain point utile** : obtenir un retour concret sur ce qui a empêché de poursuivre. Vous pourrez alors comparer une adaptation ciblée et la poursuite de l’observation.
>
> Cette lecture vient de votre réponse « aucun retour précis ». Elle changerait si plusieurs visiteurs décrivaient la même difficulté.

Actions : **« Garder cette lecture »**, **« Modifier ma réponse »**, **« Organiser mes retours de visite »**. La possibilité de relecture existe ensuite : « Mouaad peut vous aider à distinguer les retours qui éclairent une décision. » Pas de formulaire avant le texte.

### F2. Lecture intermédiaire

**Anatomie commune** :

1. Situation et objectif compris, corrigeables.
2. Ce qui paraît solide, avec provenance et portée.
3. Ce qui peut évoluer sous condition ou les options à comparer.
4. Ce qui reste à décider/vérifier, avec moyen de vérification.
5. **Votre prochaine décision utile**, sa raison et ce qui ferait changer la lecture.

Pour l’acquéreur, les titres sont ceux du maître : **« Ce que l’achat doit changer »**, **« Ce qui paraît solide »**, **« Ce qui peut évoluer sous condition »**, **« Ce qui reste à décider ou vérifier »**, puis **« Votre prochaine décision utile »**. Vendeur et transition adaptent le premier titre à leur promesse, pas le degré d’exigence.

**Exemple illustratif, acquéreur**

> **Ce que l’achat doit changer.** Vous voulez pouvoir travailler au calme sans utiliser la pièce de vie. Vous souhaitez conserver l’accès à vos proches.
>
> **Ce qui paraît solide.** Vous confirmez que l’isolement pendant le travail compte davantage qu’une surface totale idéale. Les communes que vous avez retenues sont des lieux où vous accepteriez de vivre ; leurs trajets réels restent à vérifier.
>
> **Ce qui peut évoluer sous condition.** Vous êtes ouvert à une surface plus petite si une pièce permet réellement de s’isoler. Le type de bien reste non renseigné ; nous ne supposons ni préférence ni flexibilité.
>
> **Ce qui reste à décider ou vérifier.** Votre enveloppe est estimée et les dépenses de travaux ne sont pas chiffrées. Aucun repère de vente passée ne valide ce budget complet.
>
> **Votre prochaine décision utile.** Définir la limite financière supportable et la faire vérifier avant d’utiliser cette enveloppe pour sélectionner des biens. Ensuite, comparer les logements à partir de l’usage « travailler au calme ».

Un lien **« Pourquoi cette lecture ? »** expose les réponses et la règle, pas un score. La personne peut conserver l’ensemble, modifier un point, approfondir seule ou demander à Mouaad de relire la relation entre usages, budget et recherche.

### F3. Synthèse approfondie chaude

**Anatomie** : en-tête contexte/date/version ; objectif ; acquis depuis l’échange ; faits déclarés et pièces vérifiées distingués ; options comparées ; dépendances ; points à confirmer et responsable pressenti ; prochaine décision ; question de la personne ; sorties et historique des corrections. La synthèse imprimée reste complète même si certains détails sont repliés à l’écran.

Pour l’acquéreur, la synthèse approfondie conserve les quatre blocs et la prochaine décision utile de F2. Elle les enrichit du contexte daté, des changements depuis l’échange, des vérifications et de l’historique ; elle ne les remplace pas par une autre structure.

**Exemple illustratif, transition après échange**

> Vous souhaitez changer de logement avant la rentrée que vous avez indiquée. L’achat dépend, selon votre déclaration, du produit de la vente. Le montant réellement mobilisable et sa date de disponibilité ne sont pas encore confirmés.
>
> Vous avez identifié une solution temporaire chez un proche pour une durée limitée. Cette possibilité reste à confirmer avec la personne concernée ; nous ne la traitons pas comme acquise.

| Scénario | Déjà exprimé | À vérifier | Conséquence sur la décision |
|---|---|---|---|
| Vendre puis acheter | Une solution d’attente est envisagée | Accord, durée, contraintes et budget de transition | Option à examiner si l’intervalle devient supportable. |
| Acheter puis vendre | Souhait de limiter les déménagements | Ressources et capacité de cumul, y compris si la vente tarde | Aucune faisabilité conclue à ce stade. |
| Coordonner les deux | Préférence pour un passage rapproché | Compatibilité des dates et engagements ; solution de repli | La préférence ne prouve pas que la coordination sera possible. |

> **Votre prochaine décision utile** : faire confirmer les ressources disponibles et la solution d’attente, puis comparer de nouveau les scénarios.
>
> **Question à reprendre avec Mouaad** : quelles informations de vente et quels interlocuteurs mobiliser pour fiabiliser cette comparaison ?
>
> **Cette lecture changerait si** la solution temporaire devenait impossible, la date cible changeait ou les ressources confirmées différaient des ressources envisagées.

### F4. Règles communes de personnalisation et de révision

| Règle | Comportement attendu |
|---|---|
| Conclusion liée à un élément | Une conclusion personnalisée identifie la réponse, le fait ou la preuve qui la soutient. |
| Pas de remplissage | Un bloc sans information dit ce qui manque ; il ne transforme pas une hypothèse générique en diagnostic personnel. |
| Désaccord visible | Les versions divergentes entre personnes ou entre visiteur/Mouaad restent à confirmer, sans fusion silencieuse. |
| Modifier un élément | Montrer l’élément à corriger avec sa valeur ; revenir ensuite à la lecture et signaler ce qui a changé. |
| Dépendances | Recalculer ou retirer toutes les conclusions dépendantes ; aucune lecture ancienne affichée comme nouvelle. |
| Mise à jour de preuve | Une lecture sauvegardée reste identifiable dans sa version. Proposer une nouvelle lecture, avec différences, au lieu de remplacer le passé. |
| Inconnu | Réponse « Je ne sais pas encore » acceptée ; elle oriente vers la prochaine vérification. |
| Emporter | Copie/impression/export lisible sans identité ; les versions, limites et inconnues voyagent avec le résultat. |
| Reprendre | Même appareil selon choix de conservation ; entre appareils seulement par accès volontaire protégé. |
| Pas d’issue forcée | Approfondir, attendre, renoncer et ne pas transmettre gardent une place explicite. |

## G. Passage naturel vers Mouaad

### G1. Le moment du relais

Le relais apparaît **après la réponse promise** et se construit en trois phrases : ce qui est déjà compris ; la vérification encore nécessaire ; ce que Mouaad peut apporter dans ce cas. Le prénom et le portrait servent à identifier une responsabilité réelle, pas à donner une apparence humaine à un moteur automatisé.

| Situation | Formulation fonctionnelle proposée |
|---|---|
| Vendeur, hypothèse non départagée | « Vous avez repéré où l’intérêt s’arrête. Il reste à confronter les retours, l’annonce et les alternatives actuelles. Mouaad peut reprendre ces éléments avec vous avant de choisir ce qu’il serait utile de modifier. » |
| Acquéreur, usages/préférences clarifiés | « Votre priorité est plus claire. Il reste à voir comment elle se traduit dans des logements réellement disponibles. Mouaad peut relire ces critères avec vous et distinguer ce qui demande une vérification sur place. » |
| Transition | « Les dépendances sont posées. La disponibilité des fonds et les dates restent à vérifier. Mouaad peut vous aider à réunir les éléments de vente et à coordonner les questions avec les interlocuteurs concernés. » |
| Repère local | « Ces ventes constituent un point de comparaison. Elles ne décrivent pas l’état de votre bien ni les alternatives actuelles. Mouaad peut examiner ce qui mérite réellement d’être rapproché. » |
| Incident après engagement | « Le changement que vous décrivez peut modifier la suite du projet. Les pièces et la portée de l’engagement doivent être examinées. Mouaad peut reprendre le contexte et vous aider à identifier les vérifications à mener avec les professionnels concernés. » |

### G2. Quatre niveaux d’engagement

| Choix visible | Données nécessaires | Effet réel attendu |
|---|---|---|
| **Garder cette lecture** | Aucune coordonnée | Copie, impression ou conservation choisie sur l’appareil ; aucune transmission humaine. |
| **M’envoyer cette synthèse (sans appel)** | Adresse électronique nécessaire à l’envoi | Envoyer la version affichée, sans créer une demande d’appel, de relecture ou d’opportunité. Si l’envoi est indisponible, l’indiquer et garder l’export immédiat. |
| **Demander à Mouaad de relire** | Moyen de réponse, contenu approuvé ; prénom utile ; précision facultative | Demande de relecture sur les points ouverts ; pas de rendez-vous imposé ni d’appel par défaut. |
| **Échanger avec Mouaad** | Moyen de contact adapté et modalité souhaitée | Échange choisi autour du contexte approuvé ; téléphone requis seulement si cette modalité est choisie. |

Le choix actuel d’être averti d’une opportunité pertinente reste une permission distincte, facultative et compréhensible. Il ne devient pas un moteur automatique de recommandations de biens et n’est pas précoché après une relecture.

### G3. Séquence de transmission

1. Le visiteur choisit la suite. Le site montre **ce qui part**, **à qui** et **pour quoi faire**.
2. Un aperçu présente objectif, synthèse exacte, points ouverts, option envisagée et question à reprendre. Le visiteur peut corriger ou retirer un commentaire libre.
3. Seules les coordonnées utiles sont demandées. La réutilisation d’une coordonnée connue reste visible ; une autorisation passée ne vaut pas nouvelle permission générale.
4. Une validation explicite transmet cette version et cette demande. Aucune relance, newsletter ou appel supplémentaire n’en découle automatiquement.
5. Le statut distingue : demande enregistrée ; notification envoyée ; notification en échec ; retour humain effectué. Un prestataire qui accepte un message ne prouve pas que Mouaad l’a lu.
6. La lecture reste accessible après envoi. Une erreur ne la détruit pas ; une nouvelle tentative ne crée pas plusieurs demandes identiques.

### G4. Ce que Mouaad doit recevoir et pouvoir reprendre

Le support de réception contient l’origine réellement connue, la promesse, le projet et son stade, la profondeur parcourue, la version exacte approuvée, les faits déclarés, les preuves et limites, les critères avec leur sémantique, les scénarios, les inconnues, la prochaine décision, la question du visiteur et les suites consenties.

La liste de traitement doit permettre à Mouaad de voir rapidement **pourquoi la personne demande son aide**, ce qu’il faut lire avant de répondre et ce qui requiert un autre professionnel. Un retour humain est identifié comme tel, daté et distinct de la lecture automatique. Si Mouaad contredit la première hypothèse, les éléments nouveaux et la raison de la révision sont conservés.

Le cockpit existant contient des projets reliés, des critères, des niveaux de certitude et un historique. Le futur chantier doit organiser leur raccord avec les restitutions publiques ; l’existant ne réalise pas ce pont. La portée reste la réception et la reprise utiles : aucun changement TIM, finance interne ou CRM général n’est demandé.

Dans la cible, Mouaad peut créer ou enrichir le même Profil Acquéreur depuis le suivi existant. Le lien chaud reprend ce contexte autorisé. Une transmission issue du parcours anonyme est rattachée à un profil existant seulement après identification fiable et rattachement explicite ; sinon elle reste une demande distincte à qualifier. Une correction du visiteur devient une nouvelle déclaration attribuée, sans écraser une vérification professionnelle ni étendre les consentements. Les divergences restent visibles jusqu’à leur résolution.

### G5. Du raisonnement à l’accompagnement

La proposition d’accompagnement décrit les responsabilités qui deviennent utiles : présentation, comparaison, visites, vérification, négociation, coordination, suivi des décisions selon le projet. Lorsqu’une coordination unique est pertinente, l’exclusivité peut être expliquée par ces responsabilités et leurs conditions. Elle ne doit pas être présentée comme la seule manière possible de travailler avant examen du contexte.

La personne garde les raisons de son choix et les points de réexamen. Une relecture qui conduit à attendre ou à choisir un autre périmètre ne déclenche pas un mécanisme pour forcer la conversion. C’est ainsi que LEVOIS prépare la confiance et la recommandation durable.

## H. Architecture de l’information et continuité des liens

### H1. Navigation publique

Navigation principale recommandée : **Acheter**, **Vendre**, **Vendre et acheter**, **Les repères locaux**, puis **Mouaad**. « Reprendre ma lecture » apparaît quand une reprise locale existe, sans exposer d’informations personnelles dans le header. Sur les expériences ciblées, un en-tête compact conserve marque, progression utile et accès à la sortie ; il ne reproduit pas tout le menu.

Méthode, ressources, accompagnement, contact, recommandation sortante, métier, confidentialité et mentions restent accessibles au footer ou au menu complet. Leurs accès contextuels priment sur leur multiplication dans chaque écran.

### H2. Routes recommandées

| Route | Statut et fonction cible | Règle de continuité |
|---|---|---|
| `/` | Conservée, orientation et preuve de méthode | Aucun parcours ne doit exiger d’y passer. |
| `/ma-recherche` | Conservée, résidence principale, sept séquences | Même URL engagée ; reprise de l’ancien état seulement avec conversion sémantique explicite. |
| `/situer-ma-vente` | Conservée, aiguilleur vendeur et branches | Conserver les identifiants historiques `s` ; ne pas changer leur sens. |
| `/situer-ma-vente/resultat` | Conservée pour compatibilité des lectures | Ancien code `r` interprété avec le schéma et le moteur figés au HEAD audité, pas avec des index réordonnés. Sans copie antérieure, ne pas prétendre retrouver une version historique exacte. |
| `/vendre-et-acheter` | Nouvelle, transition | Reprendre le contexte existant ; ne pas créer deux dossiers indépendants par défaut. |
| `/votre-rue` | Conservée, promesse des supports physiques | Paramètre d’adresse existant reconnu ; adresse confirmée, sans réinterprétation silencieuse. |
| `/audit-annonce` | Conservée, audit ciblé | Lien et réponses réutilisables dans le contexte du visiteur, selon son choix. |
| `/carte` | Conservée, identité et première utilité | Garder vCard/téléphone ; distinguer QR simple et véritable contexte après échange. |
| `/bienvenue` | Nouvelle, recommandation entrante | Pas de formulaire de recommandation d’un tiers. Choix du projet vers les mêmes expériences. |
| `/reprendre` | Nouvelle, reprise locale ou d’un contexte autorisé | Lien expiré/invalide : état utile, aucune information privée révélée. |
| `/lecture` | Nouvelle, restitution courante et ses sorties | Non indexée ; état local ou accès protégé, sans données de projet dans l’URL. |
| `/experiences/{question}` | Nouvelle famille limitée de micro-expériences | Slug décrivant la question, pas une vidéo ni un identifiant de personne. Registre de promesses, aucune génération massive d’URLs vides. |
| `/ressources` et les six slugs | Conservées | Réponses ouvertes ; retour à la lecture courante ; ne pas rediriger des articles utiles vers un formulaire. |
| `/methode` | Conservée, méthode commune démontrée | Les liens généraux restent valides ; le contenu vendeur demeure accessible. |
| `/methode/vendre` | Nouvelle destination de la méthode vendeur actuelle | Conserver cinq temps et exemples utiles, après corrections factuelles ciblées. |
| `/mouaad`, `/accompagnement` | Conservées | Identité et service élargis aux trois projets, sans fausses preuves. |
| `/contact` | Conservée, contact direct ou suite contextualisée | Le motif de route prépare l’interface ; il ne vaut jamais consentement d’envoi. |
| `/recommander`, `/rejoindre` | Conservées, secondaires | Aucun développement périphérique ; vérifier les liens en migration. |
| Pages légales, 404, redirections | Conservées et alignées | Le domaine et les liens physiques ne changent pas. |

Exemples de questions pour la première famille : `/experiences/visites-sans-offre`, `/experiences/usages-du-logement`, `/experiences/ordre-vente-achat`. Leur contenu métier est celui d’E2/E3/E4 rendu en profondeur courte ; ils ne créent pas trois moteurs supplémentaires.

### H3. Ce que les paramètres peuvent et ne peuvent pas faire

Une source, une famille de contenu et une promesse peuvent voyager comme métadonnées publiques reconnues. Elles orientent l’entrée et la mesure ; elles ne prouvent ni identité, ni confiance, ni consentement. Les paramètres inconnus sont ignorés avec une entrée générique intelligible.

Budget, situation familiale, adresse précise, commentaires, réponses et coordonnées n’entrent pas dans les nouveaux liens d’acquisition ou URLs analytiques. Un accès de reprise personnelle doit être protégé, limité et révocable ; le moyen technique sera choisi ultérieurement. Un lien d’acquisition transféré à un proche ouvre la même promesse, pas le dossier de son premier destinataire.

Les états publics informatifs restent accessibles aux moteurs de recherche. Les dossiers et restitutions personnelles ne sont ni indexés ni publics. Les liens anciens sont inventoriés avant toute redirection ; les nouveaux paramètres ne doivent pas casser `q`, `s`, `r` ou `src` existants.

## I. Direction d’expérience et design

### I1. Une composition éditoriale de la décision

**Idée directrice** : la personne voit son projet devenir plus clair à mesure qu’elle agit. L’écran met en relation la question du moment, sa conséquence et ce qui est désormais compris. La restitution est la forme aboutie de cette construction, pas un changement d’univers à la fin d’un formulaire.

L’orchestration d’expériences courtes et longues autour d’un contexte et d’une restitution communs garde les choix lisibles, rend les scénarios comparables et réutilise les actifs utiles. La méthode reste visible : la personne peut examiner ce qui soutient la lecture, corriger une réponse et choisir sa suite, sans dépendre d’une conversation opaque ou d’un personnage artificiel.

La proposition approfondit le monde visuel réel plutôt que de changer les signes déjà cohérents. L’identité actuelle associe un mot-symbole à empattements, une typographie de lecture simple, une illustration locale détaillée, du cobalt et un portrait identifiable. Le gain recherché vient de leur usage plus précis : moins d’espace consommé avant l’action sur mobile, plus de rythme dans les lectures, et une continuité graphique entre choix, preuves et décision.

### I2. Identité, matériaux et hiérarchie

| Élément | Direction retenue | Fonction dans l’expérience |
|---|---|---|
| Mot-symbole | Conserver le dessin vectoriel actuel et son point orange | Reconnaissance de marque ; aucune nouvelle campagne de logo. |
| Typographie | Conserver Satoshi ; mieux distinguer titres, texte, faits et notes | Titres expressifs et lisibles, corps plus confortable ; le logo garde sa singularité. |
| Palette | Papier clair `#f5f6fa`, encre `#111a30`, cobalt `#2545df`, surfaces blanches | Cobalt pour agir ou relier une information, pas pour décorer toute la page. |
| Accent humain | Orange `#f47b20` existant, rare | Identité de Mouaad et annotations humaines identifiées ; jamais une fausse preuve ou une couleur de verdict. |
| Image | Quartier miniature explicitement illustré ; portrait identifié comme Mouaad | Accueil et ancrage, sans se substituer aux données ni représenter un bien disponible. |
| Plans | Espaces ouverts, lignes fines, fonds limités aux choix/saisies/états | Éviter une succession de cartes identiques qui donne le même poids à tout. |
| Données | Chiffre, unité, date/période, périmètre, effectif et limite dans un même ensemble | La réserve ne doit pas disparaître dans une note éloignée. |
| Comparaison | Axes identiques, ordre stable ; conditions visibles sous chaque option | Le visiteur compare des conséquences, pas la couleur ou la longueur des cartes. |
| Présence de Mouaad | Portrait réel et signature aux moments pertinents | Accompagnateur identifiable ; pas de personnage récurrent ni d’avatar d’assistance. |

Le quartier peut être recadré et utilisé comme ponctuation éditoriale, avec une pleine qualité d’image. Il ne devient pas un arrière-plan permanent derrière les questions. Aucune teinte ou voile permanent ne doit appauvrir les visuels. Une image sans rôle précis n’est pas conservée par obligation décorative.

### I3. Composition des écrans principaux

Les repères ci-dessous sont des intentions de composition suffisamment précises pour être dessinées ; ce ne sont pas des contraintes de hauteur fixe qui feraient déborder un texte réel.

**Accueil, référence mobile 390 × 844** : en-tête compact d’environ 64–72 px ; titre sur deux ou trois lignes, environ 38–44 px selon le texte ; phrase de service claire ; fragment de quartier de qualité ; trois choix de projet en lignes lisibles ; accès aux ventes locales distinct. Le premier choix doit être visible sans défilement et les trois accessibles sans chercher un menu. L’image ne doit pas repousser l’orientation après un écran complet.

```text
levois                          Mouaad / Menu

Votre projet immobilier.
La prochaine décision, plus claire.
Un premier éclairage, sans coordonnées.

[ Un fragment de quartier, net et qualifié ]

Je cherche mon prochain logement             →
Je réfléchis à vendre ou je vends déjà         →
Je dois coordonner une vente et un achat      →

Explorer les ventes locales
```

Cette proposition de texte remplace la seule évocation émotionnelle par une promesse de service plus explicite. « Il y a une vie derrière chaque adresse » reste disponible comme passage éditorial près du quartier ; elle ne doit pas expliquer à elle seule ce que le site permet de faire.

**Micro-expérience mobile** : marque et sujet court ; réponse initiale déjà lisible ; une question ; deux à quatre choix adaptés ; conséquence juste après la réponse ; réserve essentielle et sortie. Pas de compteur de onze étapes, pas de panneau vide « Votre projet prend forme », pas de champ d’email en avant-plan.

```text
levois                              Quitter
Visites sans offre

Une visite ne dit pas encore
pourquoi la personne ne poursuit pas.

Quel retour avez-vous obtenu ?
[ Un motif revient ]
[ Les retours sont différents ]
[ Je n’ai pas de retour précis ]

Ce que cette réponse change
Une clarification concrète et sa limite.

Garder cette lecture     Approfondir →
```

**Parcours approfondi mobile** : une ligne « Ce que nous avons déjà posé » repliable, puis la question active et son aide utile. Le récapitulatif ne consomme pas l’espace supérieur avant la première réponse, contrairement à l’état actuel de l’acquéreur. Retour et modification sont accessibles ; la commande d’action reste dans le flux, ou en bas seulement si elle ne masque ni options, ni clavier, ni message d’erreur.

**Lecture mobile** : commencer par ce qui a été compris et la prochaine décision ; montrer immédiatement la limite déterminante. Puis les quatre blocs et les options comparées verticalement sur les mêmes critères. Les outils « modifier » et « garder » restent faciles à retrouver. La proposition humaine suit la lecture complète ; le grand footer institutionnel devient un pied de parcours compact.

**Desktop, référence 1440 × 900** : composition asymétrique maîtrisée. La zone de raisonnement occupe environ deux tiers de la largeur utile, la marge de projet un tiers. Cette marge reprend seulement les éléments acquis et les inconnues utiles ; elle n’est ni un tableau de bord ni un inventaire de champs. En restitution, la largeur peut s’ouvrir pour comparer deux scénarios, puis revenir à une colonne de lecture. Le desktop exploite l’espace pour rendre des relations visibles, sans inventer une autre expérience.

### I4. Interaction signature et rythme

L’interaction distinctive est **voir ce qu’une réponse change**. Après une réponse, une phrase de conséquence apparaît au voisinage de la question ; le fil du projet accueille ensuite le fait acquis ou l’inconnue. Lors d’une modification, le résultat marque les conclusions changées et dit pourquoi. Le mouvement matérialise cette relation, sans transporter artificiellement chaque élément à travers l’écran.

| Moment | Comportement | Mouvement et état sans animation |
|---|---|---|
| Choix de situation | Une intention claire ouvre la séquence utile | Transition brève ; mêmes informations immédiatement accessibles en mouvement réduit. |
| Réponse simple | Sélection visible puis conséquence | 160–240 ms visées ; aucune attente pour « faire réfléchir » un moteur déjà prêt. |
| Comparaison | Les dimensions restent alignées ; les valeurs changent explicitement | Pas de carrousel imposé ; le changement est lisible même sans animation. |
| Correction | Retour à la réponse, puis différence dans la lecture | Mise en évidence temporaire non fondée sur la couleur seule ; annonce textuelle. |
| Passage humain | Nouvelle responsabilité et contenu transmis visibles | Transition de section, pas de pop-up promotionnel. |
| Chargement réel | Nommer ce qui charge et garder la dernière valeur valable comme telle | Pas de faux pourcentage ; possibilité de continuer sans donnée si le raisonnement le permet. |

**Décision d’interaction** : les choix de navigation peuvent ouvrir immédiatement une destination. Dans une question de fond, la sélection laisse lire sa conséquence et une action « Continuer » ou « Voir ce que cette réponse change » valide le passage. Ce changement par rapport à l’avancement automatique actuel est justifié par le contrôle, le temps de lecture et la correction. Il devra être comparé à l’existant lors des tests ; il ne doit pas multiplier inutilement les validations de champs simples. Au clavier, parcourir des options ne doit jamais déclencher seul un changement de contexte.

Le rythme alterne reconnaissance, petite clarification, comparaison et lecture. La révélation progressive réduit la densité ; elle ne cache pas une information essentielle pour entretenir la curiosité. Une phrase utile vaut mieux qu’une animation supplémentaire.

### I5. Composants et états à spécifier au prochain chantier

| Composant commun | États indispensables |
|---|---|
| Question et choix | Non répondu, choisi, inconnu, correction, invalide, dépendance non confirmée. |
| Contexte de projet | Vide utile, partiel, confirmé, ancien, contradictoire, autre projet. |
| Repère et preuve | Disponible, faible effectif, périmètre élargi, obsolète, indisponible, source consultable. |
| Option de décision | À examiner, condition non vérifiée, option choisie provisoirement, écartée par la personne, à réexaminer. |
| Restitution | Partielle, complète au niveau demandé, mise à jour proposée, ancienne version, correction en cours. |
| Conservation | Non activée, sur cet appareil, export réussi/échoué, reprise disponible/expirée, effacement. |
| Relais humain | Choix de suite, aperçu, coordonnées utiles, consentement, enregistrement, notification, erreur et reprise sans doublon. |
| Menu et détails | Ouvert/fermé, focus cohérent, clavier, mouvement réduit, contenu long. |

### I6. Mobile, accessibilité et benchmark de qualité

**Plancher à préserver** : sur les états initiaux contrôlés, le site tient à 320 et 390 px, garde des cibles visibles et un menu mobile utilisable. La cible doit également traiter les états longs : résultats, clavier ouvert, comparaison, erreur et reprise. Le contrôle de largeur seul ne valide pas leur qualité.

Exigences de livraison proposées : corps de lecture 16–18 px ; notes essentielles généralement au moins 14 px ; lignes courtes sur mobile et environ 55–70 caractères dans les lectures larges ; contraste vérifié sur chaque paire de couleurs ; choix tactiles visés à 44 × 44 px minimum, avec 48–56 px pour les actions principales. Ce niveau tactile est un choix de confort LEVOIS plus exigeant que le minimum de 24 × 24 CSS px, avec exceptions, décrit pour WCAG 2.2 AA dans [la référence W3C sur la taille des cibles](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Clavier complet, focus visible, titres sémantiques, erreurs associées aux champs, sélection compréhensible sans couleur, zoom et reflow, textes longs, absence de survol obligatoire, lecture sans mouvement et contrôle des changements de contexte font partie de la recette. Les cartes ont toujours une alternative textuelle. Une fermeture du clavier ou une rotation ne perd pas les réponses. Sans JavaScript, les contenus de méthode, ressources, contacts et orientations restent utilisables ; un calcul interactif indisponible le dit clairement au lieu d’afficher une interface vide.

Le principe de revue ciblée des réponses rejoint [le pattern Check answers du GOV.UK Design System](https://design-system.service.gov.uk/patterns/check-answers/) : les réponses restent visibles et modifiables, sans recommencer une séquence complète. La référence porte sur le comportement ; elle ne dicte pas l’identité visuelle LEVOIS.

**Benchmark de livraison**, à juger sur le rendu réel futur face aux captures actuelles :

| Dimension | Niveau demandé et preuve |
|---|---|
| Première impression | Une capture d’accueil reconnaissable, une question de service comprise et un premier choix accessible ; qualité d’image au moins égale au site actuel. |
| Valeur froide | Au moins quatre personnes sur cinq dans un petit test formatif trouvent une clarification en moins de 30 s, sans coordonnées ni aide de l’observateur. Objectif proposé, pas résultat obtenu. |
| Compréhension | La personne peut redire ce qui est connu, ce qui est incertain et sa prochaine action. Une simple arrivée à la page résultat ne suffit pas. |
| Comparaison | Deux options se lisent sur les mêmes axes à 390 px ; aucune conséquence essentielle uniquement hors écran ou dans une infobulle. |
| Contrôle | Modifier une réponse retrouve sa valeur et signale les conséquences ; les autres réponses restent intactes. |
| Cohérence visuelle | Même grammaire de choix, source, limite, correction et relais sur les trois parcours et toutes les profondeurs. |
| Finition | Zéro texte coupé, superposition, saut de mise en page gênant ou contraste insuffisant dans les états de recette ; image et typographie nettes. |
| Performance ressentie | Réponse visible immédiate aux actions locales, chargement distant expliqué, première valeur qui ne dépend pas d’un décor lourd. Budgets mesurés à fixer sur la première tranche réelle. |
| Liberté | La lecture emportée reste utile sans contact ; attendre ou renoncer ne déclenche pas de pression. |

L’ambition « grande agence » n’est pas déclarée acquise par ce document : elle doit être démontrée sur les futurs écrans, en particulier mobile. Le cahier impose une supériorité d’expérience ; les critères ci-dessus rendent cette ambition vérifiable.

## J. Données, continuité et mesure

### J1. Quatre objets distincts

| Objet fonctionnel | Contenu et raison d’être | Règle de conservation |
|---|---|---|
| Brouillon de parcours | Réponses utiles et progression | Session par défaut. Proposition de conservation sur cet appareil seulement par choix explicite, durée affichée et effacement possible. |
| Restitution | Lecture exacte, données utilisées, limites et version | Export autonome ; reprise choisie ; une ancienne version n’est pas recalculée silencieusement. |
| Demande transmise | Version approuvée, question, coordonnées et suites choisies | Enregistrement et statut séparés de la notification ; durée définie avant activation selon M2. |
| Suivi humain | Vérifications, retour de Mouaad, décisions et historique | Accès limité ; changements attribués et conservés selon les besoins retenus, sans réutilisation automatique en contenu général. |

L’idée d’un contexte commun n’autorise pas une base universelle mêlant navigation anonyme et dossiers privés. La continuité est d’abord sémantique : les mêmes éléments gardent leur sens quand la personne choisit de poursuivre ou transmettre.

### J2. Contrat fonctionnel du contexte partagé

| Élément | Usage précis | Règle |
|---|---|---|
| Identifiant de contexte et projet(s) | Relier une lecture, une correction et une demande | Ne pas rapprocher deux personnes sur des critères approximatifs ou un simple cookie. |
| Porte, source et promesse connues | Adapter le premier écran ; comprendre ce qui a été promis | « Inconnue » accepté ; première origine et entrée actuelle distinguées. |
| Avancement et profondeur | Choisir les séquences utiles | Ne pas inférer urgence ou confiance du nombre de champs remplis. |
| Réponses et provenance | Personnaliser sans répéter | Valeur, auteur, date, mode déclaré/importé/confirmé et version sémantique. |
| Objectif et usages | Restituer ce qui doit changer | Conserver les mots utiles sans interprétation psychologique. |
| Priorités, préférences, conditions et exclusions | Comparer sans effacer les limites de la personne | Valeurs distinctes ; inconnu autorisé ; confirmation humaine identifiable si nécessaire. |
| Preuves et repères | Soutenir une affirmation délimitée | Source, date/période, périmètre, effectif, filtres, qualité, version et limites. |
| Décisions et options | Décrire le raisonnement | Décision du registre, conditions, conséquences et choix provisoire éventuel. |
| Incertitudes et vérifications | Organiser le prochain pas | Information manquante, effet possible, moyen de vérification, acteur si connu. |
| Dépendances entre vente et achat | Construire la transition | Dates souhaitées et engagées distinctes ; aucune compatibilité supposée. |
| Versions de question/réponse/méthode | Préserver la fidélité dans le temps | Historique lisible ; raisons de modification ; conclusions dépendantes invalidées. |
| Consentements par finalité | Respecter le choix exact de suite | Pas de regroupement copie/relecture/appel/opportunité ; horodatage et texte de référence. |
| Coordonnée et canal choisis | Envoyer ou répondre | Collecte au moment utile, jamais dans les outils de mesure ou les liens publics. |
| État opérationnel de demande | Éviter les faux succès et doublons | Enregistrée, notification, traitement et réponse sont des faits différents. |

**Règle de conflit** : si un budget ou une date préremplie diffère d’une valeur actuelle, présenter les deux avec provenance et demander laquelle utiliser. La valeur récente ne remplace pas automatiquement une donnée confirmée, et une note de Mouaad ne supplante pas silencieusement la déclaration de la personne.

**Règle de minimisation** : expliquer la raison des données exigeantes ; demander une date plutôt qu’un récit familial si elle suffit ; ne pas demander les coordonnées d’un conjoint ou proche pour noter qu’un accord reste à obtenir. Un commentaire libre n’est pas requis pour obtenir la valeur.

### J3. Reprise, conservation et suppression

Pour le brouillon anonyme, la cible par défaut est la session existante. « Reprendre plus tard sur cet appareil » peut proposer une durée courte clairement annoncée, avec **30 jours comme hypothèse de produit à confirmer lors de l’implémentation**, pas comme obligation légale. La personne peut effacer le contexte sans s’identifier. Un appareil partagé justifie une explication au moment de l’activation.

Entre appareils, le visiteur choisit un moyen de reprise protégé. Un lien ne doit pas exposer le projet avant vérification d’accès, ni placer ses réponses dans la query string. Si le lien expire, l’interface propose une récupération volontaire ou le parcours autonome ; elle ne révèle pas l’existence ou le contenu d’un dossier à un tiers.

Copier ou imprimer une lecture reste possible sans activer de mémoire longue. Une suppression ou un retrait de permission doit être compréhensible : ce qui est effacé de l’appareil, ce qui concerne une demande déjà transmise et le moyen de traiter cette demande. Aucune conservation illimitée « au cas où » ne constitue le réglage par défaut. Le détail de la conservation des dossiers transmis fait partie des deux arbitrages M.

### J4. Mesure utile et respect du choix

Conserver les mécanismes actuels : audience désactivée avant accord, respect de DNT/GPC, absence d’autocapture et de replay, retrait des paramètres et champs non autorisés. Les événements nécessaires au fonctionnement d’une demande et la mesure optionnelle d’usage sont des responsabilités distinctes ; leur cadre doit être explicitement décrit dans la politique réellement appliquée.

| Événement métier | Déclenchement réel | Ce qu’il permet de comprendre |
|---|---|---|
| Entrée d’expérience | Ouverture d’une promesse reconnue | Adéquation porte/sujet ; origine inconnue conservée comme telle. |
| Première valeur affichée | Micro-lecture réellement rendue, non simple chargement | Délai jusqu’au premier bénéfice potentiel. |
| Première valeur consultée | Partie utile visible selon une règle définie | Exposition à la lecture ; **ne prouve pas sa compréhension**. |
| Parcours commencé/repris | Première réponse ou reprise confirmée | Effort accepté et utilité de la continuité. |
| Séquence clarifiée | Réponse et conséquence rendues | Progression dans le raisonnement, sans stocker le contenu privé en analytics. |
| Réponse corrigée | Modification validée | Contrôle et points d’ambiguïté ; pas une erreur de conversion. |
| Lecture produite | Restitution disponible, profondeur et version | Capacité du système à tenir sa promesse, y compris partielle. |
| Lecture conservée | Export ou conservation effectivement réalisé | Valeur emportable ; distinguer clic et succès technique. |
| Suite autonome choisie | Ressource, vérification ou attente sélectionnée | Valeur produite sans contact ; attente ≠ abandon commercial. |
| Relecture/échange demandé | Choix confirmé et demande enregistrée | Intention réelle, distincte du clic sur le CTA. |
| Notification envoyée/échouée | Résultat du transport | Fiabilité de la continuité, pas lecture effective par Mouaad. |
| Retour humain effectué | Action constatée dans le suivi | Charge, délais observés et utilité du relais. |
| Compréhension déclarée | Réponse volontaire à une question courte | « La prochaine étape est-elle plus claire ? » ; résultat déclaratif, non imposé avant la sortie. |

Événements optionnels limités à des identifiants de porte, expérience, étape, profondeur, version et résultat technique autorisés. Pas d’adresse, montant personnel, coordonnées, texte libre ou réponses détaillées dans l’analytics. Une URL d’annonce n’est pas un identifiant de mesure.

**Indicateurs à suivre ensemble** : taux de première valeur par entrée ; temps jusqu’à valeur ; sorties sans résultat ; corrections et reprises ; lectures conservées ; compréhension déclarée ; demandes de relecture et échanges qualifiés ; temps de traitement et stock de demandes de Mouaad. Les taux sont calculés sur la population effectivement mesurable, avec couverture du consentement affichée. Un départ après lecture peut être une réussite ; un arrêt de session ne prouve pas un abandon.

**Charge humaine** : visualiser les demandes à relire, leur ancienneté et le point à traiter. Si la capacité de Mouaad ne permet pas une promesse de délai, ne pas en afficher. L’envoi d’une copie autonome ne doit pas consommer le même circuit qu’une relecture. Le choix d’attendre par le visiteur ne déclenche aucune relance automatique.

## K. Plan de migration depuis l’existant

### K1. Ordre de transformation

| Tranche future | Ce qu’elle construit | Conservation et preuve de sortie |
|---|---|---|
| 0 · Contrats et référence | Inventaire des routes, questions, identifiants, réponses, calculs et sorties actuels ; copies de référence des lectures calculées au HEAD audité | HEAD de départ et cas de test identifiables ; droits d’accès et transmissions réelles inventoriés avant branchement. Aucun changement de stack imposé. |
| 1 · Restitution commune sur un parcours vendeur | Lecture explicable, options, correction, copie, reprise versionnée, relais contextualisé ; corrections P0 ciblées | Les cinq situations/24 questions et six ressources restent accessibles ; ancien résultat toujours interprétable. Une tranche inclut son mobile, ses erreurs et son relais, pas seulement sa page. |
| 2 · Acquéreur conforme | Sept séquences, états inconnus, sémantique des critères, lecture qualitative sans DVF ; restitution et relais communs | Anciennes réponses importées seulement quand leur sens correspond. « Non choisi » n’est jamais migré comme souplesse consentie. |
| 3 · Transition complète | Deux projets reliés, dépendances, intervalle, options conditionnelles et synthèse | Passage depuis achat/vente sans doublon ; scénario incomplet produit une vérification, pas une faisabilité inventée. |
| 4 · Outils et cinq portes | Qualification locale après valeur ; audit relié ; entrées vidéo/Google/QR/chaud/recommandation ; nouvelle orchestration home/méthode | Entrées et destinations en place ; parcours sans dossier privé vérifiés ; liens physiques stables. L’accès chaud est validé avec son raccord en tranche 5. |
| 5 · Réception et reprise entre public et humain | Accès chaud protégé, synthèse approuvée, version, consentements et statut réel repris dans le suivi existant | Acquéreur connu/anonyme convergent ; vendeur/transition reçus avec contexte ; les quinze déclinaisons D6 fonctionnent. Pas de refonte TIM/CRM. |
| 6 · Recette et bascule arbitrée | Vérification des parcours, compatibilités, contenu, mobile, accessibilité, mesure et charge | Tous les critères L2 satisfaits ; les défauts bloquants sont corrigés avant remplacement. Déploiement seulement sur autorisation du futur chantier. |

Le découpage organise l’exécution ; il ne réduit pas la cible finale. Les cinq portes et les trois projets appartiennent au résultat complet. Les contrats de données, consentement, mesure et relais sont définis dès la tranche 0 et appliqués à chaque tranche ; leur raccord final n’est pas une excuse pour livrer des parcours qui perdent le contexte.

### K2. Protection des actifs et retour arrière

- **Questions vendeurs** : conserver leurs identifiants et la correspondance des anciennes options. Toute nouvelle question porte une raison de compréhension, pas une simple volonté d’enrichir le fichier commercial.
- **Liens de résultat vendeur** : figer la correspondance des questions/options et le moteur du HEAD `52c92ca64ca22606272ae9dd933b5706f4301842` avant évolution. Les liens actuels n’ayant ni version ni copie de restitution, leur rendu exact antérieur à ce HEAD ne peut être garanti. Une lecture reconstruite est annoncée comme telle, avec sa référence ; elle ne prétend pas être la copie de ce qu’une personne avait vu. Une nouvelle lecture est proposée séparément. Les futurs résultats versionnés, eux, conservent leur restitution exacte.
- **Ancien état acquéreur** : reprendre situation, communes, horizon et valeurs déclarées si compatibles ; redemander confirmation des significations qui changent. Ne pas fabriquer logement actuel, usages ou exclusions à partir des anciens champs.
- **Anciennes transmissions** : conserver les consentements réellement recueillis et leur portée ; une nouvelle expérience n’autorise pas à contacter rétroactivement quelqu’un pour une autre finalité.
- **Données locales** : conserver dataset, métadonnées, filtres et cas de faible effectif. Les pages utilisent un vocabulaire méthodologique cohérent, sans fusionner des statistiques différentes.
- **Navigation et contenus** : ne supprimer aucune route utile avant une destination équivalente ; contrôler vCard, QR, ancres, redirections et retours de ressources. Les composants inactifs ne sont nettoyés que si cela est utile et démontré.
- **Retour arrière** : pouvoir revenir à la route et à l’interprétation précédente sans perdre les nouvelles demandes. Les versions de contexte restent lisibles indépendamment de l’interface active. Le procédé sera décidé au chantier technique.

### K3. Risques à traiter explicitement

| Risque | Réponse de conception |
|---|---|
| Refonte perçue comme un formulaire plus long | Valeur micro immédiate, profondeur choisie, clarifications régulières et reprise. |
| Perte du niveau visuel | Comparaison sur mêmes écrans et mêmes formats avec la baseline, avant remplacement. |
| Moteur prétendant savoir plus que ses données | Contrat de preuve/portée, états inconnus, retrait des conclusions non soutenues. |
| Écrasement d’un critère ou d’un dossier connu | Provenance, confirmation des conflits, version exacte de restitution. |
| Sur-sollicitation de Mouaad | Copie autonome, relecture distincte, demande contextualisée et suivi de charge. |
| Attribution trop confiante | Source connue ou inconnue ; pas de déduction depuis la route ou de promesse d’attribution exhaustive. |
| Projet qui s’étend vers vidéo/CRM/catalogue | Registre de décisions réutilisable, supports limités aux parcours, critères de sortie bornés. |

## L. Handoff au prochain chantier Codex

### L1. Ce qu’il devra construire, après arbitrage

Le prochain chantier reçoit une cible fonctionnelle décidée : trois parcours E2–E4, les cinq portes D1–D5, le moteur commun C4, trois profondeurs F, quatre suites G2, routes H, direction I, continuité J et migration K. Il commence par les fichiers réels de la branche arbitrée, en recontrôlant l’état Git ; il ne réinterprète pas le dossier comme une commande de site neuf.

| Lot de spécification | Résultat concret à construire | Ce que le développeur ne doit pas inventer |
|---|---|---|
| Contexte et décisions | Modèle partagé, provenance, versions et dépendances | Score de maturité, psychologie du visiteur, fusion de profils implicite. |
| Questions | Sélection des questions utiles, inconnus acceptés, contrôle et correction | Réécriture intégrale des 24 questions vendeurs ; typologie avant usages côté achat. |
| Restitution | Les quatre blocs, prochaine décision, raisons et révision | Conclusions financières, juridiques ou de disponibilité sans preuve. |
| Conservation | Export libre, reprise choisie et accès protégé | Compte requis pour lire ; lien public contenant les réponses privées. |
| Relais | Aperçu approuvé, suite précise, transmission et état fiable | Appel automatique, consentement regroupé, promesse de réception humaine non établie. |
| Entrées | Adaptateurs de contexte vers les expériences communes | Cinq sites ou quinze questionnaires distincts. |
| Données locales | Repères datés, qualifiés et indépendants du raisonnement qualitatif | Prix de septembre 2026, bien disponible, demande active ou faisabilité déduits de DVF 2021–2025. |
| Design | Compositions mobile et desktop, interaction de conséquence, états complets | Prototype décoratif présenté comme expérience validée. |
| Suivi humain | Raccord borné au modèle existant et synthèse intelligible | Nouveau CRM, refonte TIM, outil vidéo ou automatisation commerciale globale. |

### L2. Recette d’acceptation obligatoire

| ID | Cas à vérifier | Résultat attendu |
|---|---|---|
| AC01 | Arrivée depuis chaque porte, pour chacun des trois projets | Les quinze cas D6 trouvent la promesse et la profondeur adaptées ; aucun détour obligatoire par home. |
| AC02 | Visiteur froid qui ne donne aucune coordonnée | Une première valeur promise est lisible et conservable ; aucune restitution prise en otage. |
| AC03 | Retour depuis ressource ou outil | Le contexte utile reste disponible ; une question connue n’est pas répétée sans raison. |
| AC04 | Acquéreur cherchant une résidence principale, anonyme ou connu | Sept séquences dans l’ordre logique avec sauts du déjà confirmé, usages avant typologie, quatre blocs exacts et prochaine décision dans les deux modes. |
| AC05 | Critère non sélectionné ou inconnu | Il reste non renseigné ; il ne devient ni flexible ni exclusion. |
| AC06 | Acquéreur sans budget, DVF absente ou jeu vide | Lecture qualitative utile ; aucun quartile nul interprété comme position de marché. |
| AC07 | Modification budget/surface/secteur puis navigation directe | Toutes les conclusions dépendantes sont recalculées ou retirées ; aucune ancienne lecture présentée comme actuelle. |
| AC08 | Cinq branches vendeurs historiques | Questions et réponses compatibles ; résultat ouvert, limites explicites, options et correction fidèle. |
| AC09 | Résultat vendeur partagé ouvert dans une session neuve | Les réponses du lien sont revues et modifiées, pas celles d’une autre session. |
| AC10 | Ancien code vendeur après évolution des questions | Correspondance et moteur du HEAD audité conservés ; reconstruction signalée, aucune prétention d’exactitude avant ce HEAD sans preuve ; nouvelle lecture proposée distinctement. |
| AC11 | Audit d’annonce lisible, bloqué, panne et contenu insuffisant | État honnête ; trois réponses et deux actions quand le secours le permet ; pas de prix inventé ; correction/conservation possibles. |
| AC12 | `/votre-rue` puis qualification personnelle | Repères puis micro-lecture issue des réponses, avant toute demande de coordonnées. |
| AC13 | Adresse ambiguë, hors zone ou petit effectif | Périmètre et limites annoncés ; alternative utile ; pas de fausse précision géographique. |
| AC14 | Vente et achat dépendants | Un même contexte ; frise avec statuts des dates ; intervalle/cumul et conditions non vérifiées visibles. |
| AC15 | Aucun scénario de transition encore vérifié | Le résultat recommande une vérification précise, jamais un financement ou un engagement supposé faisable. |
| AC16 | Choix d’attendre, renoncer ou changer de stratégie | Lecture conservée, raison et condition de réexamen ; aucune pression ou relance automatique. |
| AC17 | « M’envoyer cette synthèse (sans appel) » | Copie de la version affichée ; aucun consentement d’appel/opportunité ajouté ; statut réel. |
| AC18 | Relecture ou échange | Aperçu exact, coordonnées minimales, choix de canal, consentement explicite ; la lecture reste accessible. |
| AC19 | Enregistrement réussi, notification échouée | Message précis, demande préservée, aucun doublon à la reprise. |
| AC20 | Contexte chaud connu avec réponse modifiée | Confirmation des données et différences ; pas de ressaisie complète ni d’écrasement silencieux ; les quatre blocs acquéreur restent présents en profondeur chaude. |
| AC21 | Lien personnel invalide, expiré ou reçu par un tiers | Aucun contenu privé révélé ; récupération volontaire ou parcours autonome. |
| AC22 | Réception par Mouaad | Il retrouve la lecture approuvée, les inconnues, les versions, la question et les seules suites consenties. |
| AC23 | Retour humain différent de l’hypothèse automatique | Nouvelle preuve et raison de révision visibles ; auteurs/versions distincts. |
| AC24 | Refus de mesure d’audience | Tous les outils restent utilisables ; pas d’événement optionnel ni donnée privée dans analytics. |
| AC25 | Visiteur acheteur sur `/votre-rue` ou source inconnue | Pas de classification automatique comme vendeur/QR ; origine inconnue admise. |
| AC26 | Mobile 320/390, tablette, desktop, zoom, clavier et mouvement réduit | Toutes les étapes et états restent utilisables ; contraste/focus/lecture vérifiés ; aucun contenu caché par clavier ou commandes. |
| AC27 | Impression/copie avec détails repliés | Lecture entière, options, limites, dates et versions présentes ; pas seulement les titres visibles. |
| AC28 | Liens physiques, six ressources et redirections | Destinations utiles conservées ; aucun renvoi forcé vers une collecte. |
| AC29 | Discours public et preuves | Pas d’ancienneté, vente, témoignage, observation terrain ou validation professionnelle inventés ; exemples signalés. |
| AC30 | Revue de design face à l’existant | Niveau visuel au moins préservé et expérience améliorée, démontrés sur mobile et états réels. |
| AC31 | Même contexte confirmé dans les modes anonyme et connu | Même lecture et même Profil Acquéreur sémantique ; raccord explicite conservant provenance, historique et permissions, sans doublon ni fusion implicite. |

Les tests techniques du futur chantier complètent cette recette ; ils ne remplacent pas l’observation de personnes utilisant le parcours. Le délai de première valeur et la compréhension nécessitent une petite évaluation formative. Un taux de contact supérieur ne compense pas une perte de liberté ou de justesse.

### L3. Décisions déjà prises dans ce dossier

Sont recommandés sans nouvelle phase stratégique : une architecture commune ; trois projets ; trois profondeurs choisies ; maintien des routes historiques ; conservation du noyau vendeur et des données locales ; réalignement du parcours acquéreur ; création de la transition ; restitution avant collecte ; quatre suites distinctes ; aucune recommandation automatique de biens ; méthode vendeur comme application du système ; identité actuelle approfondie par une nouvelle composition ; réception limitée au besoin de continuité.

Restent au chantier technique les moyens d’implémentation, l’organisation des composants, le stockage, l’accès protégé et les outils de mesure. Ils doivent servir les contrats de ce dossier, sans rouvrir le périmètre produit ni ajouter un chantier périphérique.

### L4. Contrôle des treize principes intouchables

| Principe | Traduction vérifiable dans la cible |
|---|---|
| 1 Valeur avant coordonnées | D1–D3, F1–F2, AC02/AC12 ; exception chaude limitée à la reprise protégée. |
| 2 Valeur autonome puis humain | F et G ; export et suites autonomes disponibles. |
| 3 Incertitude explicite | C4, F4, E4/E5 ; limites attachées aux conclusions. |
| 4 Personne aux commandes | Modification, choix provisoire, non-choix et réexamen. |
| 5 Contexte d’entrée respecté | C2 et les quinze déclinaisons D6. |
| 6 Limite honnête de l’automatisation | E3–E6 et G1 ; vérification compétente lorsque nécessaire. |
| 7 Psychologie au service de la compréhension | I4 ; conséquences lisibles, pas d’urgence, rareté ou peur fabriquées. |
| 8 Excellence visuelle intégrée | I et AC30 ; mobile fait partie du niveau de référence. |
| 9 Chaque écran avance | B3, C3 et séquences E ; pas d’attente théâtrale. |
| 10 Aucune impasse | États inconnus/pannes/sorties et AC06/AC11/AC13/AC16. |
| 11 Continuité du contexte | J, F4, G4 ; modes connu/anonyme et reprises. |
| 12 Collecte justifiée | E1, G2 et J2 ; information demandée au moment utile. |
| 13 Restitution avant conversion | F puis G, AC02/AC17/AC18 ; aucune valeur bloquée. |

## M. Décisions réellement ouvertes

Deux arbitrages opérationnels nécessitent Mouaad. Ils ne changent pas l’architecture recommandée et n’ont pas empêché de terminer ce dossier. Aucune liste de choix esthétiques ou techniques n’est renvoyée au commanditaire.

| Arbitrage | Pourquoi Mouaad doit le trancher | Recommandation par défaut | Effet sur le futur chantier |
|---|---|---|---|
| **M1 · Service de relecture et capacité réelle** | La fréquence, le format de réponse et la capacité disponible ne sont pas établis par le code ou le maître. Un délai inventé créerait une promesse de service. | Commencer par une relecture écrite ciblée sur les points ouverts, avec échange sur demande. Ne pas annoncer de délai chiffré avant validation d’une capacité soutenable. Séparer l’envoi de copie de la relecture humaine. | Fixer formulation du service, suivi de charge et éventuelle règle d’indisponibilité avant activation publique. La valeur autonome reste disponible. |
| **M2 · Conservation des demandes et dossiers transmis** | Elle dépend du suivi effectivement souhaité, des obligations applicables et des moyens d’effacement. Le dépôt ne suffit pas à arrêter une politique cible complète. | Durées finies et documentées par finalité ; pas de conservation commerciale générale issue d’une simple demande de copie ; confirmation des règles avec le cadre professionnel concerné avant activation. Brouillon anonyme en session tant qu’une mémoire longue n’a pas été choisie. | Définir durées, effacement/retrait et texte de confidentialité avant de brancher la nouvelle conservation distante. Aucun stack n’est impliqué par cet arbitrage. |

### État de remise et règle d’arrêt

Ce dossier est la proposition consolidée d’Astra. L’audit n’a créé aucune page, aucun composant, aucune animation, aucun prototype technique, branche, commit, PR ou déploiement. Aucun pipeline vidéo, calendrier éditorial, lot de scripts de contenus, avatar ou refonte de cockpit n’a été engagé.

Le prochain travail est **l’arbitrage de ce dossier**. L’implémentation commence seulement après cet arbitrage. Le présent chantier s’arrête à cette remise.
