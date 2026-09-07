# ARCHIVE — ne plus utiliser comme autorité visuelle

La direction miniature / Satoshi / cobalt a été validée le 6 septembre 2026. Seuls DESIGN.md et src/styles/tokens.css font autorité pour le site public. Le contenu ci-dessous conserve l’historique ; ses recommandations visuelles sont remplacées. Les règles métier restent à vérifier dans le code.

---

# LEVOIS — Validation de Direction générale — Phase 1

**Décision :** **VALIDÉ AVEC MODIFICATIONS**  
**Date d’enregistrement :** 30 août 2026  
**Effet :** la Phase 1 est close. La Phase 2 strictement éditoriale est autorisée. Toute publication, tout code, toute campagne et toute direction artistique restent hors de la Phase 2. Les P0 déjà présents en production forment un chantier urgent séparé, sans déploiement automatique.

Ce document enregistre les arbitrages définitifs du dirigeant. En cas d’écart, il prévaut sur les recommandations du dossier Phase 1 et du paquet de validation.

## 1. Décisions D01–D13 après arbitrage

| ID | Décision définitive |
|---|---|
| **D01** | Le noyau provisoire reste : **« Mouaad Boullourou, conseiller immobilier SAFTI à Lèves et alentours. »** En V1, **LEVOIS est la démarche et l’ensemble d’outils d’aide à la compréhension et à la décision portés par Mouaad dans le cadre de son activité de conseiller SAFTI**. LEVOIS n’est ni une agence immobilière autonome, ni un réseau, ni un produit officiellement édité par SAFTI. Cette définition est évolutive et ne préjuge pas de la forme future de LEVOIS. |
| **D02** | L’accueil reste universel et rend immédiatement accessibles acheter, vendre, comprendre les ventes locales et contacter Mouaad. Ces entrées ne sont pas contraintes à une hiérarchie visuelle égale : l’acquisition de nouveaux acquéreurs étant prioritaire, **« Mettre ma recherche au clair »** peut être l’action principale. |
| **D03** | Validée sans modification : la destination dépend de source + intention + promesse ; l’accueil reçoit les arrivées ambiguës. |
| **D04** | Validée sans modification : `/carte` reste la porte de rappel hors ligne, durable, hors index. |
| **D05** | Validée sans modification : `/ma-recherche` conserve son URL et sera reconstruit selon les sept blocs, avec valeur avant coordonnées. |
| **D06** | Validée sans modification : `/votre-rue` reste une exploration locale prudente ; sa couche éditoriale pourra devenir indexable après correction, jamais ses résultats personnels. |
| **D07** | Validée sans modification : `/situer-ma-vente` et `/audit-annonce` conservent des rôles distincts. |
| **D08** | `/mouaad` devient la source de vérité interne au site ; toute information réglementée reste fondée sur les documents officiels et le profil SAFTI. Mouaad accompagne réellement acheteurs et vendeurs. `/accompagnement` bifurque donc clairement entre achat et vente, sans inventer d’offre acquéreur non tenue. |
| **D09** | Validée : valeur avant coordonnées, réponses modifiables, contact direct. Aucun appel automatique. Une synthèse peut être demandée ou reçue sans demander d’appel lorsque cette fonction existe réellement ; ne jamais la promettre avant fonctionnement. |
| **D10** | Tout le capital de connaissance est préservé, mais aucune URL n’est sanctuarisée. Fusion, redirection ou restructuration restent possibles si l’expérience s’améliore et si aucune connaissance utile n’est perdue. |
| **D11** | Contenu public, outil interactif et résultats personnels restent distincts. Les résultats personnels ne sont jamais indexés ; `/carte` reste hors index. Le `noindex` de `/ma-recherche` n’est pas définitif : la route pourra être indexable si elle offre une couche HTML substantielle utile sans démarrer le questionnaire ; sinon une page acquéreur éditoriale distincte portera l’organique. |
| **D12** | Architecture d’attribution validée et interdiction des réponses personnelles/PII dans l’analytics. Attribution intersession possible après consentement valable ; session uniquement sans consentement. La durée finale sera le minimum réellement utile, après revue de confidentialité ; 90 jours n’est pas figé. |
| **D13** | Deux flux parallèles : **1)** confinement/correction urgente des P0 déjà en production ; **2)** Phase 2 strictement éditoriale, sans publication. La réflexion et la rédaction avancent avec des champs provisoires sans attendre tous les documents administratifs. Aucune surface n’est publiée tant que ses P0 ne sont pas corrigés. Toutes les exclusions sont maintenues. Le seuil de qualité visuelle déjà enregistré ne sera réactivé qu’à la future direction artistique, jamais pendant la Phase 2. |

## 2. Arbitrages géographiques finaux

| ID | Décision définitive |
|---|---|
| **G01 — Lèves** | Pilote local validé. |
| **G02 — Chartres** | La page quantitative peut être préparée. Le module humain et la mention d’accompagnement sont ajoutés après confirmation de la zone réelle, sans prétendre connaître exhaustivement chaque quartier. |
| **G03 — Mainvilliers** | Placée explicitement après Lèves et Chartres dans la feuille de route locale. Sa publication dépend d’une réponse réellement distincte et non clonée. Elle peut d’abord être quantitative, sans revendication terrain non documentée. |
| **G04 — Périmètre global** | Toujours séparer communes accompagnées, communes couvertes par les données et communes dotées d’une page. Formulation publique principale provisoire : **« Lèves, Chartres et alentours »**. La liste exacte vient après confirmation opérationnelle. « Bassin chartrain » reste une désignation éditoriale, pas un substitut à une zone de service compréhensible. |

Règle d’application : l’absence de page locale n’interdit jamais de citer une commune réellement accompagnée ; la pratique doit seulement être confirmée. Inversement, posséder des données sur une commune ne prouve pas que Mouaad y intervient.

## 3. Modifications validées du capital informatif

1. Ajouter explicitement au système de contenus et à sa feuille de route :
   - les données et explications présentes sur l’accueil ;
   - la couche pédagogique et la restitution de `/situer-ma-vente`.
2. `/methode` reste principalement éditoriale et intègre deux ou trois cas courts où la personne distingue : fait observé, interprétation, hypothèse, autre explication et information manquante.
3. `/ressources/verifier-avant-baisse-prix` devient une **balance prudente des preuves** : exposition, première impression, comparaison, retours de visite et informations manquantes. Aucun montant, aucun verdict automatique.
4. `/votre-rue` est une **exploration locale prudente**, pas un calculateur. La restitution montre adresse confirmée, type de bien, période, rayon, taille d’échantillon, compréhension possible et conclusion impossible.
5. Toute mini-expérience suit : **réponse immédiate → activité mentale propre à la page → résultat personnel réellement utilisable → faits, sources et limites → prochaine vérification**. Un questionnaire animé à partir d’une liste n’est pas une mini-expérience.
6. Les formats restent distincts :
   - grille pour les retours de visite ;
   - entonnoir prudent pour les vues et contacts ;
   - frise pour l’historique ;
   - test de perception pour la première impression ;
   - plan ordonné pour le lancement ;
   - balance des preuves pour le prix.
7. Dans le système de contenus, **P0, P1 et P2 désignent des niveaux de priorité**, jamais les phases générales du projet.

## 4. Séquencement P0

- A01, A02, A04 et B01–B03 sont considérés comme exposés en production.
- Ils forment un lot urgent séparé : retrait des mentions fausses, neutralisation des flux à risque, correction ou suspension des résultats non fiables et absence de promotion.
- B04 `/ma-recherche` reste en Phase 3 ; la route ne doit pas être promue avant reconstruction.
- Le lot P0 peut être corrigé en parallèle, mais aucune publication ou déploiement n’est automatiquement autorisé par cette validation.

## 5. Réponses Q01–Q19 enregistrées

| ID | Réponse enregistrée | État |
|---|---|---|
| **Q01** | SIRET attendu : `824 194 419 00043`, provisoire jusqu’à attestation RNE récente. | **PIÈCE À FOURNIR** |
| **Q02** | LEVOIS est utilisé comme nom du site, de la démarche et des outils de Mouaad. Aucun nom commercial ou enseigne déclaré n’est revendiqué à ce stade. | **VALIDÉ** |
| **Q03** | Conserver seulement « Mouaad Boullourou, conseiller immobilier SAFTI à Lèves et alentours » jusqu’à autorisation des qualités supplémentaires. | **VALIDÉ** |
| **Q04** | Agent commercial et RSAC publiés seulement si les justificatifs les portent exactement. | **INFORMATION/PIÈCE À FOURNIR** |
| **Q05** | Aucun bloc SAFTI détaillé avant validation de la formulation et de la nature exacte des assurances/garanties. | **INFORMATION À FOURNIR** |
| **Q06** | Aucun lieu d’accueil physique ouvert au public. | **VALIDÉ PAR MOUAAD** |
| **Q07** | Sans objet : aucune adresse d’accueil n’est publiée. Aucun horaire ni disponibilité permanente ne sont déduits. | **VALIDÉ / SANS OBJET** |
| **Q08** | La fiche Google Business Profile existe et Mouaad peut l’administrer. Son lien et sa configuration exacte restent à inspecter avant toute modification distante. | **VALIDÉ POUR EXISTENCE ET ADMINISTRATION** |
| **Q09** | Liste de travail à confirmer : Lèves, Chartres, Mainvilliers, Lucé, Champhol, Le Coudray et Luisant. | **À CONFIRMER** |
| **Q10** | Canaux publics confirmés : appel et SMS au `07 81 38 01 21`, email à `mouaad@levois.fr`. Le formulaire reste soumis à sa validation technique ; aucune modalité supplémentaire n’est déduite. | **VALIDÉ POUR APPEL, SMS ET EMAIL** |
| **Q11** | Le `07 81 38 01 21` peut être publié pour les appels et les SMS. | **VALIDÉ** |
| **Q12** | `mouaad@levois.fr` est fonctionnel et consulté régulièrement. | **VALIDÉ** |
| **Q13** | Plusieurs modalités de premier échange sont possibles et convenues avec Mouaad selon la situation et ce qui convient aux personnes concernées. Aucune durée fixe n’est publiée. | **VALIDÉ** |
| **Q14** | Aucun appel automatique ; un appel suit uniquement une demande explicite ou le choix clair de ce canal. | **VALIDÉ** |
| **Q15** | Une synthèse peut être demandée/reçue sans appel sur les trois outils lorsqu’elle est techniquement disponible ; aucune promesse prématurée. | **VALIDÉ COMME POLITIQUE CIBLE** |
| **Q16** | Aucun délai de réponse n’est publié ou déduit. | **VALIDÉ COMME RÈGLE ÉDITORIALE** |
| **Q17** | Mouaad accompagne réellement acheteurs et vendeurs. | **VALIDÉ** |
| **Q18** | Intersession après consentement valable ; session sans consentement ; durée minimale utile après revue. | **VALIDÉ, DURÉE À FIXER** |
| **Q19** | Aucun cas/témoignage inventé ; aucun module d’expertise terrain avant deux ou trois observations réelles et anonymisables. | **VALIDÉ** |

## 6. Autorisation et limites de Phase 2

### Autorisé

- plateforme éditoriale ;
- vocabulaire public et interdit ;
- règles de reformulation, prudence et CTA ;
- architecture et rédaction de l’accueil ;
- messages selon les canaux ;
- articulation avec le capital informatif ;
- champs provisoires clairement signalés.

### Interdit

- code ;
- publication ou déploiement ;
- campagne ;
- CRM ;
- direction artistique ;
- script complet de `/ma-recherche` ;
- production massive d’articles ;
- réouverture de BUY OS, cockpit, Tomas, Visual Lab, `/recommander` ou `/rejoindre`.

## 7. Portes de publication

La Phase 2 peut être rédigée entièrement sous champs provisoires. Une surface ne peut être publiée que si :

1. ses P0 propres sont corrigés ;
2. ses informations réglementées sont documentées ;
3. ses engagements opérationnels sont confirmés ;
4. sa collecte réelle correspond à sa politique et à sa microcopy ;
5. ses résultats personnels restent privés ;
6. sa promesse correspond à une fonction effectivement disponible.
