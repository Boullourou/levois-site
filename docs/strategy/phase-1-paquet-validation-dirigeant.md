# LEVOIS — Paquet de validation dirigeant — Phase 1

**Source unique :** dossier Phase 1 vérifié le 30 août 2026.  
**Statut :** **VALIDÉ AVEC MODIFICATIONS PAR LA DIRECTION GÉNÉRALE.**  
**Périmètre :** extraction décisionnelle uniquement ; aucun nouvel audit, aucune nouvelle recherche et aucune rédaction de Phase 2.

> Ce paquet a servi de porte de validation. Il est désormais archivé comme document de consultation. Les arbitrages qui le modifient sont consignés dans `docs/strategy/phase-1-validation-direction-generale.md`, qui prévaut en cas d’écart. La Phase 2 strictement éditoriale est autorisée ; toute publication reste interdite.

Les faits démontrés — SIRET obsolète, bloc SAFTI incorrect, défauts fonctionnels observés — ne sont pas soumis à validation. Ils imposent une correction. Mouaad arbitre uniquement les choix structurants ci-dessous.

## 1. Décisions proposées à validation

| Décision | Recommandation | Pourquoi | Conséquence si validée | Alternative crédible | Risque |
|---|---|---|---|---|---|
| **D01 — Positionnement public** | Construire l’identité autour de **Mouaad Boullourou, conseiller immobilier SAFTI à Lèves et alentours**. Traiter LEVOIS comme le site et la méthode éditoriale de Mouaad, sous statut provisoire, jamais comme agence ou réseau. Suspendre « indépendant », « agent commercial », « sous mandat » et les sept communes jusqu’aux preuves. | Le noyau Mouaad–SAFTI–Lèves est vérifié ; la nature juridique de LEVOIS et les qualités supplémentaires ne le sont pas. | Accueil, profil, footer, mentions, contenus signés, schema et futur GBP parlent de la même personne et du même rôle. | Réduire provisoirement toute l’identité au seul noyau vérifié, sans définir LEVOIS ; ou adopter plus tard un positionnement LEVOIS autonome après déclaration et autorisation SAFTI. | La relation LEVOIS devra peut-être être reformulée après les pièces. Un positionnement autonome sans preuve créerait un risque juridique et sémantique élevé. |
| **D02 — Accueil** | Faire de `/` une porte universelle : identité et zone prouvées, trois situations de même niveau — acheter, vendre, comprendre les ventes locales — contact direct, puis preuve DVF. | La production est data-first ; la branche est buyer-first. Aucune ne sert correctement toutes les arrivées ambiguës. | L’accueil oriente sans imposer un diagnostic et conserve le capital DVF sous le premier écran. | Conserver l’accueil data-first ou adopter l’accueil buyer-first de la branche. | Une partie du public ne comprendrait pas qui intervient, pour quel besoin et quelle suite choisir. |
| **D03 — Routage de l’acquisition** | Faire dépendre la destination de **source + intention + promesse**. Réserver l’accueil aux arrivées ambiguës ; envoyer une promesse précise vers sa page ou son outil exact. | Une recherche sur Mouaad, une recherche de prix à Lèves et un encart sur une annonce bloquée ne posent pas la même question. | Chaque canal possède une continuité explicite et une conversion adaptée ; aucun clic ou scan n’est assimilé à un lead. | Utiliser l’accueil comme landing unique pour tous les canaux. | Rupture de promesse, baisse de compréhension et attribution inutilisable. |
| **D04 — Rôle de `/carte`** | Conserver l’URL comme rappel durable après carte de visite ou rencontre, avec identité et trois portes ; cible `noindex,follow`, hors sitemap. | L’URL imprimée a une valeur propre, mais la page actuelle suppose trop vite un vendeur. | Les supports existants restent valides et la page cesse de dupliquer l’accueil ou le profil. | La transformer en page locale indexable ou la fusionner avec l’accueil. | Perte de continuité des imprimés, ou confusion entre porte hors ligne et contenu SEO. |
| **D05 — Rôle de `/ma-recherche`** | Conserver l’URL et reconstruire le parcours selon les sept blocs validés ; chaque réponse doit agir sur la suite ou la restitution ; lecture complète avant coordonnées. | Le parcours actuel place la typologie avant les usages et plusieurs réponses n’ont aucun effet réel. | Le parcours devient un traducteur de projet acquéreur, pas un faux diagnostic de marché. | Corriger seulement les textes et quelques embranchements. | Personnalisation décorative, conclusions trop affirmatives et perte de confiance. |
| **D06 — Rôle de `/votre-rue`** | Conserver l’outil de preuve locale ; corriger le P0 adresse/type ; rendre la couche éditoriale indexable lorsqu’elle est complète, mais ne jamais publier les résultats personnels d’adresse. | L’outil apporte une valeur locale réelle, distincte d’une estimation, mais son résultat peut actuellement partir d’une adresse ambiguë. | Une page-réponse citable explique DVF et limites ; l’expérience personnelle reste privée. | Garder toute la route non indexée ; ou indexer aussi les états personnels. | Première option : potentiel local perdu. Seconde : contenu faible, duplication et risque de confidentialité. |
| **D07 — Deux outils vendeurs distincts** | Conserver `/situer-ma-vente` pour orienter une vente selon son stade et `/audit-annonce` pour une annonce déjà publiée ; corriger les deux, sans les fusionner. | L’un traite la situation globale ; l’autre localise une rupture dans une annonce existante. | Chaque symptôme mène à une prochaine vérification adaptée et à une ressource précise. | Les regrouper dans un diagnostic vendeur unique. | Parcours plus lourd, promesse moins précise et conclusions moins traçables. |
| **D08 — Entité, contact et accompagnement** | Faire de `/mouaad` la source publique de vérité et de `/contact` une sortie humaine universelle. Pour `/accompagnement`, bifurquer acheteur/vendeur seulement si les deux offres existent réellement ; sinon assumer et nommer une page vendeur. | Le profil est incomplet, le contact est seller-first et l’intitulé universel d’accompagnement masque un contenu vendeur. | Le visiteur peut vérifier l’interlocuteur, comprendre l’offre réelle et contacter Mouaad sans passer par un outil. | Maintenir `/accompagnement` comme FAQ vendeur en le renommant explicitement. | Une bifurcation sans offre acheteur réelle créerait une promesse non tenue ; conserver l’ambiguïté actuelle tromperait l’acheteur. |
| **D09 — Engagement envers le visiteur** | Délivrer la réponse ou restitution utile avant les coordonnées ; permettre la correction des réponses ; séparer « recevoir une synthèse » de « demander un échange » ; laisser le contact direct disponible. | La valeur avant contact est le contrat commun déjà retenu pour les outils. | Les leads correspondent à une demande humaine réelle, pas à un résultat consulté ou à un formulaire tenté. | Mettre la restitution derrière un formulaire obligatoire. | Moins de confiance et davantage de faux leads ; la possibilité d’appel automatique reste suspendue à la réponse de Mouaad. |
| **D10 — Capital informatif** | Conserver toutes les ressources existantes, les organiser comme système de réponses par situation et appliquer les transformations ciblées du §3. Toute expérience garde une couche éditoriale indexable complète. | Les contenus contiennent déjà une méthode utile mais certains promettent test, grille ou diagnostic sans livrer l’expérience annoncée. | Aucun contenu n’est abandonné ; l’interactivité est progressive et sert une opération mentale précise. | Garder toutes les pages strictement statiques après simple réécriture. | Moins d’application au cas réel, mais coût de production inférieur ; transformer tout indistinctement créerait de l’interactivité artificielle. |
| **D11 — Indexation** | Indexer les pages-réponses complètes ; garder `/ma-recherche` et `/carte` hors index ; ne jamais indexer un résultat personnel ; garder légal/confidentialité hors sitemap ; retirer ou protéger les interfaces internes. | L’index doit contenir des réponses citables, pas des coquilles JS, des états privés ou des outils internes. | Sitemap, canoniques et maillage correspondent au rôle réel de chaque URL. | Tout indexer, ou garder également les preuves locales hors index. | Indexation faible et confidentialité dans un cas ; perte de visibilité locale dans l’autre. |
| **D12 — Données et mesure** | Conserver séparément première source connue, dernière source connue, porte d’arrivée, campagne/création et source déclarée. Persistance intersession proposée : 90 jours avec consentement, session seulement sinon. Mesurer progression/résultat/demande/succès/qualification, jamais le contenu des réponses ni les PII dans l’analytics. | L’attribution actuelle perd `src`, confond tentative et succès et ne reconnaît pas correctement le hors ligne. | Les canaux deviennent comparables sans transformer les réponses personnelles en données marketing. | Mesure de session uniquement ; ou dernière touche uniquement. | La persistance exige une revue privacy ; une mesure minimale fragmente les parcours longs et sous-estime les rencontres physiques. |
| **D13 — Ordre et exclusions** | Après validation : 1) vérité/privacité/P0 ; 2) plateforme éditoriale, contrats et accueil ; 3) enrichissement sourcé des contenus ; 4) méthode DVF, Lèves, Chartres quantitative et noyau acheteur ; 5) reconstruction complète de `/ma-recherche` en Phase 3 ; 6) transformations interactives P1 puis P2. Cockpit, BUY OS, Tomas, Visual Lab, `/recommander` et `/rejoindre` restent hors périmètre. | Cet ordre sécurise les fondations avant les expériences et évite le retour des explorations non validées. | La Phase 2 reste éditoriale et concentrée ; les transformations ne bloquent pas l’accueil. | Produire simultanément accueil, outils, pages locales et toutes les expériences. | Dispersion, dépendances instables et réintroduction de périmètres expressément différés. |

## 2. Arbitrages géographiques

La zone d’exercice, la zone de données et la zone qui mérite une page sont trois choses différentes. Une commune réellement desservie peut être citée comme telle après confirmation de Mouaad même si elle ne possède pas encore de page locale ; l’absence de page n’interdit donc pas d’en parler.

| Territoire | 1. Zone d’exercice réellement prouvée | 2. Données détenues | 3. Preuve éditoriale différenciante | 4. Page indexable maintenant | Proposition à valider |
|---|---|---|---|---|---|
| **Lèves** | **VÉRIFIÉ :** Lèves et alentours ; la limite exacte des alentours reste à préciser. | Séries maisons/appartements 2021–2025, avec volumes et niveaux de qualité exploitables. | Profil SAFTI à Lèves, composition locale distincte et limites DVF explicitables. | **Oui.** | **G01 — Lèves devient le pilote local.** La page peut être quantitative sans prétendre connaître chaque rue ; les observations terrain l’enrichissent si elles sont fournies. |
| **Chartres** | Non prouvée individuellement comme commune desservie ; elle peut relever des « alentours », à confirmer. | Séries très fortes, avec forte dominance des appartements et comparaison maison/appartement distincte. | La composition et les volumes justifient une réponse quantitative non clonée. La preuve de service/terrain manque seulement pour un module humain. | **Oui, comme page quantitative.** | **G02 — Créer la page-réponse Chartres sans claim de service ni d’expertise terrain avant confirmation.** Ajouter ensuite le module humain si Mouaad confirme intervenir à Chartres. |
| **Mainvilliers** | Non prouvée comme commune desservie. | Dataset suffisant, avec mix plus équilibré et évolutions annuelles à manier prudemment. | Un angle quantitatif existe, mais l’activité et les observations propres à la commune manquent ; le risque de page générique reste supérieur à l’utilité immédiate. | **Non pour l’instant.** | **G03 — Différer la page.** Mouaad peut néanmoins citer Mainvilliers comme commune accompagnée s’il confirme réellement y intervenir, sans revendiquer une expertise éditoriale non documentée. |
| **Bassin chartrain** | Seule la formule « Lèves et alentours » est publiquement étayée ; la liste des communes réellement accompagnées doit venir de Mouaad. | LEVOIS possède des données sur plusieurs communes du secteur configuré. | La détention de données ne prouve ni activité ni expertise locale de service. | Pas de page générique « bassin » décidée à ce stade. | **G04 — Employer “bassin chartrain” comme aire éditoriale étudiée, et publier séparément la liste réelle des communes accompagnées après réponse de Mouaad.** |

**Séquence proposée :** Lèves pilote → Chartres quantitative → Mainvilliers différée.  
**Règle à valider :** une mention de service dépend de la pratique réelle confirmée ; une page indexable dépend d’une réponse éditoriale différenciante.

## 3. Capital informatif

| Contenu | Valeur à préserver | Problème principal | Décision proposée | Expérience cible | Priorité |
|---|---|---|---|---|---|
| `/ressources` | Un point d’entrée vers six réponses vendeurs déjà structurées. | Ensemble seller-only, présenté comme collection de cartes plutôt que système par situation ; auteur/date/sources incomplets. | **CORRIGER ET ENRICHIR**, jamais supprimer. | Hub principalement éditorial orienté par situation, incluant ensuite acheteur et local. | **P1** |
| `/ressources/lancement-coherent` | Ordonner les prérequis d’une mise en vente. | Délais et règles trop absolus ; checklist seulement textuelle. | **CORRIGER**, puis transformer. | Checklist personnalisable et ordonnée, reliée à `/situer-ma-vente?s=preparer`. | **P1 enrichissement ; P2 interaction** |
| `/ressources/premiere-impression-annonce` | Comprendre ce qu’un acheteur perçoit d’abord. | Promet un « mini-test » mais livre une liste statique ; chevauchement possible avec l’audit. | **CORRIGER**, puis transformer sans remplacer `/audit-annonce`. | Mini-cas « prédire → révéler → appliquer » ; audit seulement si une URL existe. | **P1 enrichissement ; P2 interaction** |
| `/ressources/annonce-vue-peu-de-contacts` | Localiser la rupture vue → ouverture → contact → visite. | Bon arbre causal, mais seulement écrit ; causalités trop assurées. | **TRANSFORMER** en priorité. | Arbre de décision prudent menant à une seule prochaine vérification. | **P1** |
| `/ressources/retours-de-visite` | Distinguer faits, interprétations et motifs récurrents. | Promet une grille sans la fournir ; seuils de visites trop sûrs. | **TRANSFORMER** en priorité. | Grille personnalisée sans identité visiteur, avec copie/export local. | **P1** |
| `/ressources/verifier-avant-baisse-prix` | Empêcher une baisse de prix décidée avant les vérifications utiles. | Règles portails/comparaison trop générales et non datées. | **CORRIGER**, puis transformer ; aucun calculateur. | Checklist/gate : éléments suffisants pour discuter ou information manquante, jamais un montant. | **P1 enrichissement ; P2 interaction** |
| `/ressources/reprendre-commercialisation` | Reconstituer l’historique avant une reprise. | Durées trop prescriptives ; aucune chronologie utilisable. | **CORRIGER**, puis transformer. | Frise chronologique et plan de reprise mettant en évidence changements simultanés et données absentes. | **P1 enrichissement ; P2 interaction** |
| `/methode` | Doctrine de décision et distinction observation/interprétation. | Seller-only, jargon et repères non sourcés ; répétition des ressources. | **CORRIGER** et conserver principalement éditoriale. | Page-réponse citable avec exemples, sources, date, limites et liens vers les situations. | **P1** |
| Contenus pédagogiques de `/votre-rue` | Source DVF, date, rayon et limites avant toute estimation. | Promesse « dernière maison » non garantie ; transparence géocodeur et couche de référence incomplètes. | **CORRIGER ET ENRICHIR** ; conserver l’outil. | Réponse statique indexable + visualisation/calcul prudent après confirmation d’adresse ; résultat personnel privé. | **P0 fonctionnel ; P1 éditorial** |
| `/audit-annonce` | Méthode exposition/attractivité/conversion, FAQ, résultat et deux actions avant contact. | Extraction factuelle non fiable sur un cas SAFTI ; risque de conseil fondé sur un titre erroné. | **CONSERVER LA ROUTE ET CORRIGER P0**. | Audit assisté avec champs extraits visibles/validés et fallback questionnaire. | **P0 correction ; P1 enrichissement** |
| `/accompagnement` | FAQ de réassurance et explication de la relation humaine. | Contenu vendeur sous un nom universel ; engagements SAFTI non documentés. | **CORRIGER** : bifurquer si l’offre acheteur existe, sinon assumer/renommer vendeur. | Page principalement éditoriale de réassurance, sans interaction artificielle. | **P1** |

**Contrôle d’exhaustivité :** aucune des onze pages ou couches demandées n’est abandonnée. Toutes reçoivent une décision explicite de conservation, correction, enrichissement ou transformation.

## 4. P0 à traiter

Les catégories A et B sont des portes de **publication**, pas des prérequis à la réflexion éditoriale. La production actuelle comporte déjà certains défauts : leur correction est urgente, mais elle n’est pas réalisée dans ce paquet.

### A — Bloque immédiatement toute nouvelle publication globale

| Problème | Preuve | Risque concret | Périmètre bloqué | Correction attendue | Moment de correction |
|---|---|---|---|---|---|
| **A01 — SIRET Mouaad obsolète** | `824 194 419 00027` est publié alors que l’établissement est fermé ; l’API officielle déclare `00043` actif. | Identité légale publiquement erronée. | Toute reprise des mentions légales et tout déploiement global les conservant. | Retirer `00027` ; employer provisoirement le SIREN ; publier `00043` seulement après attestation RNE. | Retrait à la prochaine mise en production ; nouveau numéro avant mentions finales. |
| **A02 — Bloc légal SAFTI incorrect** | SIRET, carte, adresse et « garantie financière GALIAN » recopiés ne correspondent pas aux mentions SAFTI contrôlées ; RCP et garantie financière ne sont pas interchangeables. | Information réglementée fausse ou mal qualifiée. | Mentions légales et toute surface reprenant le cadre SAFTI. | Supprimer le bloc faux ; ne reproduire que les mentions validées et leur nature exacte. | Avant toute nouvelle publication globale. |
| **A03 — Entité et qualités non prouvées** | Le schema déclare `RealEstateAgent` LEVOIS ; « indépendant », « sous mandat », « agent commercial » et sept communes ne sont pas établis. | Fausse entité dans les moteurs/assistants et affirmation professionnelle injustifiable. | Accueil, `/mouaad`, footer, schema, contenus signés et futur GBP. | Utiliser le noyau vérifié ; retirer les qualités non prouvées ; passer provisoirement à `WebSite + Person`. | Avant publication de la nouvelle identité ou du nouveau schema. |
| **A04 — Consentement et exposition potentielle de données** | Cases visibles non transmises ; Géoplateforme absente de la politique ; fallback de `/contact` sans méthode/action pouvant placer des coordonnées dans l’URL ou les logs. | Consentement non démontré et exposition de PII. | Tout déploiement contenant formulaires, envois ou géocodage concernés. | Aligner interface, payload, succès serveur, prestataires et politique ; empêcher tout fallback exposant des PII. | Avant tout nouveau déploiement de ces flux et avant toute campagne. |

### B — Bloque uniquement la publication, l’indexation ou l’amplification de la page concernée

| Problème | Preuve | Risque concret | Périmètre bloqué | Correction attendue | Moment de correction |
|---|---|---|---|---|---|
| **B01 — Adresse ambiguë de `/votre-rue`** | « 1 rue » a produit 1 218 ventes centrées sur Chartres sans adresse résolue visible ; le H1 promet une maison sans garantir ce type. | Résultat local erroné ou mal compris. | `/votre-rue` uniquement : acquisition, indexation et promotion. | Sélection/confirmation obligatoire, adresse résolue affichée, promesse corrigée, géocodeur et attribution transparents. | Avant indexation ou amplification de la route. |
| **B02 — Extraction de `/audit-annonce`** | Une annonce SAFTI a été extraite avec « SAFTI » comme titre puis utilisée comme fondement d’un conseil. | Restitution fondée sur un fait non fiable. | `/audit-annonce` uniquement. | Valider les champs, rejeter marque/site comme titre, afficher le niveau de confiance et utiliser le questionnaire en fallback. | Avant toute nouvelle promotion ou activation de la route. |
| **B03 — Contact** | Page seller-first, attribution perdue, tentative confondue avec succès et fallback potentiellement exposant. | Lead perdu, conversion fausse ou donnée exposée. | `/contact` et campagnes qui y conduisent. | Rendre universelle, sécuriser le fallback, transmettre consentement/attribution, compter seulement le succès serveur. | Avant accueil final et toute campagne. |
| **B04 — `/ma-recherche` actuel** | Réponses sans effet, structure métier non respectée, compteur d’étapes incohérent et retour initial inerte. | Promesse de personnalisation non délivrée. | Nouvelle publication ou promotion de `/ma-recherche`, pas la plateforme de langage de Phase 2. | Reconstruire selon les sept blocs et tester l’effet réel de chaque réponse. | Phase 3, avant relance du parcours. |

### C — Ne bloque pas la conception de la Phase 2

| Problème | Preuve | Risque concret | Périmètre bloqué | Correction attendue | Moment de correction |
|---|---|---|---|---|---|
| **C01 — Pièces professionnelles manquantes** | RNE, RSAC conditionnel et mandat/attestation SAFTI non disponibles. | Formulation finale impossible à figer. | Champs professionnels détaillés seulement. | Utiliser le noyau vérifié ; compléter après pièces. | Pendant Phase 2, avant gel juridique/publication. |
| **C02 — GBP et accueil physique inconnus** | Aucun lien/place ID/capture fiable ; réception oui/non inconnue. | Mauvais nom, doublon, suspension ou adresse personnelle exposée si une action est menée trop tôt. | Formulation GBP, adresse, horaires et continuité finale. | Ne rien créer/renommer ; recueillir les réponses et la fiche. | Avant toute action GBP, pas avant travail éditorial. |
| **C03 — Zone de service exacte** | Seuls « Lèves et alentours » sont étayés ; les sept communes sont déclaratives dans le dépôt. | Surpromesse géographique. | Liste de communes et modules de service. | Faire confirmer les communes ; ne pas confondre service, données et pages. | Avant texte final de l’accueil, pas avant son architecture. |
| **C04 — Promesses opérationnelles de contact** | Email, durée d’échange, envoi de synthèse, appel automatique et délai réel ne sont pas tous confirmés. | Engagement non tenu. | Microcopy et automatisations de contact. | Obtenir les réponses Q10–Q16 ; maintenir des champs provisoires. | Avant copy finale et activation, pas avant architecture. |
| **C05 — Persistance et événements** | Le contrat existe, mais 90 jours reste un compromis soumis à revue privacy. | Surcollecte ou parcours mal attribué. | Implémentation de mesure. | Arbitrer 90 jours consentis ou session seulement ; implémenter avant campagnes. | Après Phase 2 éditoriale, avant acquisition payante. |
| **C06 — Mainvilliers et preuves terrain** | Dataset suffisant, mais activité et observations différenciantes non documentées. | Page générique ou expertise implicite. | Page Mainvilliers uniquement. | Différer ; recueillir service et cas si la page devient prioritaire. | Plus tard, sans risque pour Phase 2. |
| **C07 — Gouvernance des robots IA** | Les directives servies distinguent plusieurs usages, mais le choix de gouvernance n’est pas figé. | Visibilité ou réutilisation non souhaitée. | Crawl et usages IA. | Décider séparément recherche, requête utilisateur, grounding/input et entraînement. | Plus tard ; non bloquant pour Phase 2. |

## 5. Informations attendues de Mouaad

Une réponse opérationnelle suffit sauf lorsqu’une qualité réglementée, une identité légale, une adresse publique ou le GBP doivent être figés.

| ID | Question directe | Réponse ou pièce attendue |
|---|---|---|
| **Q01** | Quel SIRET actif doit figurer sur LEVOIS ? | Numéro exact **et attestation RNE récente**. |
| **Q02** | LEVOIS est-il déclaré comme nom commercial ou enseigne, ou seulement utilisé comme nom du site et de la méthode ? | Réponse courte ; le RNE de Q01 tranche la déclaration officielle. |
| **Q03** | Quels termes SAFTI sommes-nous autorisés à publier : « indépendant », « sous mandat », « agent commercial » ? | Phrase exacte autorisée ; mandat/attestation SAFTI seulement pour figer ces termes. |
| **Q04** | Souhaites-tu publier la qualité d’agent commercial et un RSAC ? | Oui/non. Si oui : numéro, greffe et attestation portant explicitement RSAC. |
| **Q05** | Quelles mentions SAFTI LEVOIS doit-il reproduire plutôt que simplement lier ? | Liste ou formulation validée par SAFTI/juridique, avec nature exacte des assurances/garanties. |
| **Q06** | Reçois-tu des clients à une adresse professionnelle permanente ? | Oui/non, sans communiquer d’adresse personnelle ici. |
| **Q07** | Si oui, cette adresse peut-elle être publiée et quels horaires d’accueil sont réellement tenus ? | Réponse directe ; preuve d’enseigne/accueil seulement si publication de l’adresse. |
| **Q08** | Existe-t-il déjà un Google Business Profile et en es-tu le propriétaire principal ? | Oui/non, lien direct, place ID et captures du nom, catégorie, téléphone, site, adresse visible/masquée, zones, horaires et services. |
| **Q09** | Quelles communes accompagnes-tu réellement aujourd’hui ? | Liste directe, distincte des communes pour lesquelles LEVOIS possède seulement des données. Aucun document exigé pour cette décision opérationnelle. |
| **Q10** | Quels canaux proposes-tu publiquement : appel, SMS, email, formulaire, WhatsApp ou autre ? | Liste exacte des canaux réellement suivis. |
| **Q11** | Le `07 81 38 01 21` est-il toujours professionnel, contrôlé et ouvert aux SMS ? | Oui/non pour appels et SMS. |
| **Q12** | `mouaad@levois.fr` est-il suivi et testé, ou faut-il utiliser une adresse SAFTI ? | Choix du courriel public et confirmation d’un test envoi/réception/réponse. |
| **Q13** | Quelle durée proposes-tu réellement pour un premier échange ? | Durée ou formulation exacte ; aucun document requis. |
| **Q14** | Une demande ou un formulaire déclenche-t-il un appel automatique ? | Oui/non ; si oui, pour quelles demandes et dans quel délai. |
| **Q15** | Peut-on demander l’envoi d’une synthèse sans demander d’appel ? | Oui/non ; préciser pour `/ma-recherche`, `/situer-ma-vente` et `/audit-annonce`. |
| **Q16** | Quel délai de réponse peux-tu réellement tenir ? | Délai exact, jours ouvrés ou non, et éventuelles plages horaires. |
| **Q17** | Accompagnes-tu réellement les acheteurs, les vendeurs ou les deux ? | Réponse nette pour l’accueil et `/accompagnement`. |
| **Q18** | Valides-tu une attribution intersession de 90 jours après consentement, ou préfères-tu une mesure limitée à la session ? | Choix de gouvernance ; aucun document requis. |
| **Q19** | Peux-tu fournir deux ou trois observations ou cas anonymisés pour les communes où une expertise terrain sera revendiquée ? | Éléments seulement si un module d’expertise locale est souhaité ; non requis pour une page purement quantitative. |

## 6. Périmètre recommandé de la Phase 2

Ce périmètre ne constitue pas un démarrage. Il devient applicable uniquement après la réponse de Mouaad au §7.

### Travail pouvant commencer immédiatement après validation

- plateforme éditoriale : promesse, rôle de LEVOIS, principes de preuve et de prudence ;
- vocabulaire commun, mots autorisés/interdits et niveaux de certitude ;
- règles de reformulation : observé, interprétation, hypothèse, autre explication, information manquante, prochaine vérification ;
- architecture et rédaction de l’accueil universel ;
- messages par canal et intention, sans produire de campagne ;
- articulation accueil → contenus → outils → accompagnement humain ;
- architecture éditoriale de `/mouaad`, `/contact`, `/methode`, `/ressources` et `/accompagnement` ;
- couche éditoriale commune des outils et préparation des contenus acheteurs/local, sans code ni script complet de `/ma-recherche`.

### Travail à maintenir avec des champs provisoires

| Champ | Valeur de travail |
|---|---|
| Statut court | « Mouaad Boullourou, conseiller immobilier SAFTI à Lèves et alentours. » |
| Relation LEVOIS | Hypothèse explicitement marquée : site et méthode éditoriale de Mouaad. |
| Qualités détaillées | Omettre « indépendant », « sous mandat », « agent commercial » et RSAC jusqu’aux réponses/pièces. |
| Identifiants | Retirer le SIRET fermé ; employer le SIREN en travail ; nouveau SIRET après RNE. |
| Zone | « Lèves et alentours » pour le service ; liste exacte et modules communaux en attente. |
| Données structurées | Modèle prudent `WebSite + Person` en spécification ; enrichissements, adresse et affiliations en attente. |
| GBP | Nom, catégorie, adresse, zones, horaires et services laissés en champs provisoires. |
| Contact | Durée, synthèse, appel automatique, canaux et délai laissés en champs provisoires. |
| Mesure | 90 jours après consentement reste une option à arbitrer ; session sinon. |

### Travail interdit avant résolution des P0

- toute publication ou tout déploiement de la Phase 2 ;
- mise en ligne de nouvelles mentions juridiques non validées ;
- publication d’un nouveau SIRET sans RNE ou reprise du SIRET fermé ;
- publication du bloc SAFTI actuel ou confusion entre RCP et garantie financière ;
- mise en ligne d’un schema `RealEstateAgent`, d’une adresse ou de qualités/communes non prouvées ;
- création, duplication ou renommage du GBP ;
- indexation, promotion ou acquisition vers `/votre-rue` avant B01 ;
- promotion ou activation de `/audit-annonce` avant B02 ;
- campagne vers `/contact` avant B03 et A04 ;
- relance de `/ma-recherche` avant B04 ;
- toute activation de cockpit, BUY OS, Tomas, Visual Lab, `/recommander` ou `/rejoindre`.

## 7. Fiche de décision finale attendue de Mouaad

### Réponse la plus courte possible

Copier, compléter et renvoyer :

```text
STATUT GLOBAL PHASE 1 :
[VALIDÉ / VALIDÉ AVEC MODIFICATION / NON VALIDÉ / INFORMATION À FOURNIR]

DÉCISIONS D01–D13 :
[VALIDÉES / exceptions : D__ = ...]

GÉOGRAPHIE G01–G04 :
[VALIDÉE / modifications : ...]

CAPITAL INFORMATIF :
[VALIDÉ ENSEMBLE / modifications par URL : ...]

P0 A01–A04 ET B01–B04 :
[PRIS EN COMPTE / désaccord de périmètre : ...]

INFORMATIONS Q01–Q19 :
Q__ = ...

AUTORISATION DE COMMENCER LA PHASE 2 :
[OUI / NON]
```

### Sens des quatre statuts

| Statut | Signification |
|---|---|
| **VALIDÉ** | Les recommandations et le périmètre sont acceptés sans modification. |
| **VALIDÉ AVEC MODIFICATION** | Indiquer uniquement les identifiants D, G ou URL concernés et la modification voulue. |
| **NON VALIDÉ** | Indiquer les identifiants refusés ; aucune Phase 2 ne commence. |
| **INFORMATION À FOURNIR** | Répondre aux Q concernées ; la Phase 2 reste suspendue tant que Mouaad ne donne pas explicitement son autorisation finale. |
