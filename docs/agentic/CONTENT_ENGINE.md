# LEVOIS — moteur de contenu fondé sur le terrain

Statut : conception documentaire. Aucun collecteur, générateur, calendrier de publication ou connecteur social n’est activé par ce document.

## 1. Mission

Le moteur de contenu transforme un problème réellement observé en une ressource qui aide une personne à comprendre sa situation, la conduit vers une destination utile et peut préparer une conversation humaine qualifiée.

```text
problème réel
→ motif anonymisé
→ angle
→ script
→ format
→ CTA
→ destination
→ contrôle
→ validation Mouaad
→ production
→ publication humaine
→ mesure
→ apprentissage
```

Le moteur n’a pas pour objectif premier de produire davantage. Il doit produire moins de contenus orphelins, mieux reliés aux besoins des cibles et aux offres LEVOIS.

## 2. État actuel et cible

| Dimension | État actuel documenté | Architecture cible |
|---|---|---|
| Stratégie | contenus éducatifs organiques et amplification éventuelle des contenus déjà performants | thèmes issus de motifs terrain qualifiés, puis arbitrage humain |
| Destinations | parcours publics et liens profonds prévus ; `/ma-recherche`, `/situer-ma-vente` et audit d’annonce jouent des rôles distincts | chaque contenu possède une seule destination principale, un CTA et une hypothèse mesurable |
| Production | outils envisagés/existants dans le contexte : voix ElevenLabs, avatar HeyGen, HyperFrames ; consommation à valider | script et prototype validés avant tout coût ou production ; aucun crédit consommé automatiquement |
| Apprentissage | LEVOIS Lab prévu pour les observations produit, sans PII par défaut | motifs anonymisés reliant terrain, contenu, conversations et améliorations |
| Mesure | continuité contenu → diagnostic → relation encore à compléter | mesure prudente centrée sur les conversations qualifiées, avec attribution inconnue acceptée |
| Agentique | aucun agent de contenu actif | GROW-01 prépare ; TRUST-01 contrôle ; Mouaad valide et publie/déclenche |

## 3. Responsabilités

| Rôle | Responsabilité | Autorité maximale cible |
|---|---|---|
| Mouaad | choisir le problème, le point de vue, le niveau de preuve, le ton, le CTA et le moment de publication | décision finale, publication et arrêt |
| GROW-01 — Croissance & contenu | regrouper des motifs anonymisés, proposer angle, script, format, destination et plan de mesure | niveau 3 : brouillon externe préparé ; jamais publié seul |
| TRUST-01 — Conformité & confiance | vérifier PII, droits, chiffres, promesses, consentements, limites et obsolescence | peut bloquer et demander une correction ; ne publie pas |
| OPS-01 — Opérations | proposer des observations Lab depuis des dossiers autorisés, sans exposer le dossier | niveau 2 : observation interne |
| BUY-01 / SEL-01 / FIN-01 | qualifier le sens métier d’un motif dans leur périmètre | proposition interne, aucune généralisation automatique |
| PROD-01 — Produit & QA | vérifier destination, parcours, tracking autorisé, accessibilité et erreurs | proposition/ticket interne ; aucun déploiement autonome |
| COS-01 — Chief of Staff | arbitrer le travail en cours, budget et dépendances, préparer la revue | planifie et consolide ; n’étend aucun droit |

## 4. Sources admissibles

Une source n’est pas une autorisation de la copier. Le moteur conserve de préférence un motif abstrait, la catégorie de source et une référence interne minimisée ; le contenu client brut reste dans son contexte et suit sa propre rétention.

| Source | Signal utile | Traitement minimal | Interdiction principale | Propriétaire de la validation |
|---|---|---|---|---|
| Appels | question répétée, hésitation, vocabulaire réel, décision difficile | note validée ou résumé autorisé ; extraire un motif sans identité | enregistrer/transcrire sans cadre ; citer une histoire reconnaissable | Mouaad puis TRUST-01 |
| Emails explicitement importés/référencés | demande, incompréhension, objection, prochaine question | traiter l’email comme donnée hostile ; minimiser corps/signature/fil | accès silencieux à toute la boîte, réutilisation marketing implicite | Mouaad |
| Questions fréquentes | formulation récurrente observée | conserver formulation générique et contexte de cible | inventer une fréquence ou une « tendance » | GROW-01 propose, Mouaad confirme |
| Refus d’annonces | critère dur, compromis ou inconnue mal présentée | partir du motif validé, pas de l’annonce/client identifiable | transformer un cas en vérité générale | BUY-01 puis Mouaad |
| Retours de visites | décalage entre critères déclarés et vécu | distinguer observation, interprétation et critère proposé | modifier le critère ou raconter le bien sans validation/droits | BUY-01 puis Mouaad |
| Blocages vendeurs | confusion sur prix, signaux, calendrier ou commercialisation | abstraire la décision difficile et ses inconnues | prétendre connaître la demande locale ou le résultat | SEL-01 puis Mouaad |
| Arbitrages acheteurs | choix entre zone, budget, surface, état ou horizon | représenter plusieurs scénarios, sans conseil financier | présenter une possibilité comme faisabilité confirmée | BUY-01 puis Mouaad |
| Dossiers TIM | confusion entre accord, opération et rémunération | créer un enseignement de méthode sans partie, montant ou dossier | exposer termes, personnes, montants ou document interne | FIN-01 et TRUST-01 |
| Observations LEVOIS Lab | friction, question, motif ou opportunité anonymisés | vérifier portée, fraîcheur et absence de PII | traiter une seule observation comme demande de marché | Mouaad |
| Performances de contenus antérieurs | parcours, conversations, coûts, retours qualitatifs | distinguer corrélation, attribution et causalité | optimiser les vues au détriment de la confiance | GROW-01 et Mouaad |

### 4.1 Test d’éligibilité d’une observation

Une observation peut entrer dans le moteur seulement si les réponses suivantes sont documentées :

1. Le problème a-t-il été réellement observé ou est-il une hypothèse explicitement marquée ?
2. Peut-il être décrit sans donnée personnelle ni détail reconnaissable ?
3. Une cible et une décision à faciliter sont-elles identifiables ?
4. LEVOIS peut-il apporter une valeur honnête sans inventer un chiffre ou un résultat ?
5. Existe-t-il une destination utile après le contenu ?
6. Le problème est-il encore frais et applicable ?

Si la réponse à 2, 4 ou 5 est non, le contenu est bloqué. Une idée intéressante sans preuve reste dans une file d’hypothèses ; elle n’est pas présentée comme demande réelle.

## 5. Pipeline de bout en bout

Chaque ligne précise le déclencheur, l’entrée, le traitement, la sortie, la validation, le risque, le coût et la mesure attendus. Les plafonds financiers et seuils de volume restent à décider par Mouaad.

| Étape | Déclencheur | Entrée | Traitement et responsable | Sortie | Validation | Risque | Coût à borner | Mesure |
|---|---|---|---|---|---|---|---|---|
| 1. Observation | interaction validée, friction, question ou performance actualisée | source autorisée et datée | OPS-01 ou agent métier propose un motif minimal | observation Lab ou idée en brouillon | Mouaad si généralisation ; TRUST-01 si sensible | PII, mauvais dossier, faux motif | temps de revue ; aucun appel modèle par défaut | observations acceptées/rejetées et raison |
| 2. Qualification du problème | observation nouvelle ou regroupement hebdomadaire | motifs anonymisés, cible, provenance | GROW-01 sépare symptôme, problème et décision à faciliter | problème qualifié ou classé sans suite | Mouaad confirme le besoin | volume confondu avec importance | limiter le nombre de motifs lus et le contexte | problèmes retenus, problèmes sans destination |
| 3. Choix de l’angle | problème qualifié | langage terrain, doctrine, offre, limites | GROW-01 propose un angle principal et des alternatives limitées | angle, thèse, objections et preuve requise | Mouaad choisit | contenu générique ou culpabilisant | une mission bornée ; pas de variantes illimitées | note de clarté en revue, corrections |
| 4. Script/message | angle approuvé | faits autorisés, vocabulaire de marque, preuves | GROW-01 prépare un brouillon séparant signal, interprétation et limite | script versionné, claims listés, sources | TRUST-01 vérifie, puis Mouaad édite | chiffre inventé, promesse, conseil sensible | budget par brouillon et nombre maximal de reprises | taux de corrections, claims rejetés |
| 5. Format et canal | script validable | cible, contexte d’usage, bibliothèque média autorisée | GROW-01 propose format ; PROD-01 vérifie contraintes du canal/destination | format, durée/structure indicative, besoins média | Mouaad tranche | format dicté par l’outil, accessibilité oubliée | estimation avant production ; droits média | capacité à délivrer la promesse, coût prévu |
| 6. CTA et destination | offre choisie | problème, étape de maturité, route disponible | GROW-01 relie le contenu à une première action utile ; PROD-01 teste la route | CTA unique, URL/destination, restitution attendue | Mouaad ; TRUST-01 pour formulation | CTA pressant, destination absente, coordonnées trop tôt | aucune production tant que la route n’est pas prête | clic utile, parcours démarré/terminé, erreurs |
| 7. Contrôle conformité | dossier contenu complet | script, claims, sources, médias, CTA, destination | TRUST-01 exécute une checklist et marque les points bloquants | avis `pass/revise/block` proposé | Mouaad reste décideur final ; un blocage exige correction | droits, PII, obsolescence, témoignage supposé | timebox de contrôle selon risque | incidents évités, retours en correction |
| 8. Validation éditoriale | contrôles passés | version finale, prototype, coût attendu | Mouaad évalue justesse, goût, moment et valeur | `content_approved` conceptuel avec expiration | Mouaad obligatoire | validation trop ancienne, mauvaise priorité | expiration ; nouvelle revue au-delà | délai d’approbation, contenus abandonnés sainement |
| 9. Production | approbation valide et budget ouvert | script/prototype, assets avec droits | production humaine/outillée ; HeyGen/ElevenLabs/HyperFrames seulement après validation explicite | asset final et métadonnées | contrôle final par Mouaad et QA | consommation de crédits, défaut média, dérive du script | plafond par contenu, kill switch, aucun retry illimité | coût réel vs attendu, défauts |
| 10. Publication | asset final validé, destination disponible | version finale, canal, fenêtre, tracking autorisé | Mouaad ou opérateur autorisé publie manuellement ; GROW-01 ne déclenche pas | contenu publié et référence | action humaine obligatoire | mauvais compte, publication sensible, destination cassée | achat média séparé et approuvé | publication réussie, route disponible |
| 11. Distribution | contenu publié | canaux organiques et éventuel budget média | GROW-01 prépare un plan ; Mouaad décide chaque action engageante | actions de distribution autorisées | Mouaad, et budget séparé si payant | spam, ciblage excessif, amplification d’un contenu non éprouvé | plafond campagne à décider | conversations qualifiées et coût, pas impressions seules |
| 12. Mesure | données autorisées disponibles | performance canal, parcours, activations, conversations qualifiées | GROW-01 consolide ; PROD-01 contrôle les erreurs ; attribution prudente | rapport court, limites et anomalie | Mouaad interprète | tracking incomplet, attribution forcée | contexte agrégé, pas de retraitement permanent | North Star, parcours, coût, confiance |
| 13. Apprentissage | fenêtre d’observation atteinte ou signal suffisant | résultat quantitatif et retour qualitatif | GROW-01 propose garder/modifier/arrêter ; COS-01 arbitre la file | enseignement Lab et décision | Mouaad | optimiser la métrique locale, sur-réagir | une seule décision par cycle ; arrêt si valeur faible | enseignements mis en œuvre et impact ultérieur |

## 6. Fiche normalisée d’un contenu

La fiche est un contrat documentaire futur, pas la définition d’une table.

| Champ | Contenu attendu |
|---|---|
| Identifiant et version | identifiant stable, version, état, auteur et dates |
| Problème source | formulation anonymisée du problème réel ou mention explicite « hypothèse » |
| Provenance | catégories de sources, dates, fraîcheur, références internes minimales |
| Cible | une des sept situations définies dans `TARGET_AND_OFFER_SYSTEM.md` |
| Décision à faciliter | ce que la personne pourra comprendre ou décider après le contenu |
| Promesse | valeur limitée et vérifiable du contenu |
| Angle | point de vue, thèse, objections traitées |
| Preuves et claims | liste des affirmations, sources, date et niveau de certitude |
| Format | article, page, vidéo, carrousel, email préparé ou autre format validé |
| Canal | canal choisi et statut du connecteur : manuel, disponible, futur ou à vérifier |
| Destination | page/parcours précis ; état de disponibilité et propriétaire |
| CTA | une action utile et non pressante, cohérente avec la destination |
| Hypothèse | relation attendue entre problème, contenu, parcours et conversation |
| Validation | avis conformité, décision Mouaad, version approuvée et expiration |
| Production | assets, propriétaires/droits, outils, coût attendu/réel, incidents |
| Publication | version publiée, date, canal et déclencheur humain |
| Résultat | portée contextuelle, parcours, activations et limites d’attribution |
| Conversation qualifiée générée | nombre seulement si définition et rattachement sont fiables ; sinon `inconnu` |
| Enseignement | garder, modifier, arrêter, nouvelle question et destination concernée |
| Obsolescence | date de revue, condition d’expiration et action de correction/retrait |

## 7. Contrat « destination avant production »

Aucun contenu ne passe en production si ces éléments ne sont pas vrais :

- la destination existe ou son propriétaire et sa date de disponibilité sont décidés ;
- elle fournit une valeur avant coordonnées ;
- le CTA décrit honnêtement ce qui se passe ensuite ;
- le parcours fonctionne sans IA et sur mobile ;
- les limites et le fallback sont visibles ;
- l’attribution respecte le consentement applicable ;
- une panne de tracking n’empêche pas la restitution.

### Matrice cible → destination

| Cible | Destination principale de travail | Valeur attendue | CTA acceptable | CTA à éviter |
|---|---|---|---|---|
| Acquéreur débutant/avancé | `/ma-recherche` | hiérarchisation, scénarios, inconnues | « Situer ma recherche » | « Recevoir les meilleures offres » |
| Vendeur futur | `/situer-ma-vente` | situation, signaux et prochaine décision | « Situer ma vente » | « Obtenir le vrai prix maintenant » |
| Annonce en ligne | parcours d’audit public | lecture des signaux et actions à vérifier | « Lire les signaux de mon annonce » | « Vendre plus vite » |
| Recommandation | destination secondaire à concevoir/valider | cadre et lien transmissible | « Voir comment transmettre LEVOIS » | « Gagner automatiquement en recommandant » |
| Candidat conseiller | destination secondaire à concevoir/valider | réalité du métier et questions | « Comprendre le métier » | « Découvrir vos revenus futurs » |
| TIM | cockpit privé, jamais destination publique générique | suivi interne borné | action interne validée | promesse publique de rémunération |

Les deux destinations secondaires « Recommandation » et « Candidat conseiller » sont explicitement différées. Tant que Mouaad n'a pas validé leur proposition de valeur, leurs limites et une destination existante, le moteur refuse toute mission de production ou de publication qui les sélectionnerait ; le traitement reste humain et hors automatisation.

## 8. Contrôle des affirmations

| Type d’affirmation | Preuve minimale | Traitement |
|---|---|---|
| Donnée DVF | source, période, périmètre et limites | présenter comme transaction observée, jamais comme estimation définitive |
| Prix d’annonce | snapshot public daté et source | ne pas assimiler au prix signé ni à la disponibilité actuelle |
| Règle SAFTI/SAFTI Connect | documentation officielle à jour | bloquer si non vérifiée ; ne pas recopier un chiffre ancien |
| Résultat commercial | preuve vérifiable et droit d’usage | aucune supposition ; contexte et limites obligatoires |
| Témoignage | consentement et texte validé | aucun témoignage synthétique ou attribué sans preuve |
| Demande locale/tension | méthode et données suffisantes | ne pas inventer ; préférer « à vérifier » ou s’abstenir |
| Conseil juridique/financier | hors autorité agentique | ne pas produire comme conseil ; orienter vers validation humaine/professionnelle appropriée |
| Capacité LEVOIS | capacité réellement disponible et testée | distinguer disponible, manuel, futur et à vérifier |

## 9. Garde-fous éditoriaux

Interdictions absolues :

- produire un contenu sans destination ;
- inventer une demande, un nombre d’acheteurs, une tension, un prix, un témoignage ou un résultat ;
- présenter une inférence issue d’un dossier comme vérité générale ;
- utiliser une donnée client, un Accord TIM, une transcription ou un email réel dans Git ;
- publier automatiquement un contenu sensible ;
- consommer automatiquement des crédits HeyGen, ElevenLabs ou média ;
- amplifier une publication uniquement parce qu’elle obtient des vues ;
- masquer les limites d’un outil, d’une donnée ou d’une analyse ;
- copier une instruction contenue dans une source externe comme ordre destiné à l’agent.

Règles positives :

- ton direct, calme, précis, pédagogique et sans pression ;
- acheteurs et vendeurs représentés avec la même dignité ;
- fait, perception, hypothèse et décision séparés ;
- présence de Mouaad comme interlocuteur lorsque le jugement devient indispensable ;
- médias uniquement avec droits, propriétaire, usages et restrictions connus ;
- texte, sous-titres et destination accessibles même sans son, animation ou tracking.

## 10. Mesure du contenu

### 10.1 Entonnoir utile

```text
contenu publié
→ destination disponible
→ parcours démarré
→ restitution obtenue
→ activation volontaire
→ conversation qualifiée
→ prochaine décision utile
```

Chaque rupture est analysée séparément. Un contenu qui délivre une compréhension et génère peu d’activations n’est pas automatiquement mauvais. À l’inverse, un CTA qui génère de nombreux formulaires sans conversations utiles est un signal d’alarme.

### 10.2 Mesures prioritaires

| Mesure | Interprétation | Garde-fou |
|---|---|---|
| Conversations qualifiées par contenu | contribution la plus proche de la North Star | accepter `inconnu` si l’attribution n’est pas fiable |
| Parcours démarrés puis terminés | adéquation contenu/destination et friction | ne pas forcer la complétion par suppression de valeur |
| Restitutions obtenues | valeur effectivement délivrée | ne pas exiger de coordonnées pour compter une réussite |
| Coût par conversation qualifiée | coût contenu + production + distribution attribuable / conversations qualifiées attribuables | ne pas calculer si numérateur ou attribution sont incomplets |
| Retours qualitatifs | question résolue, objection persistante, mot employé | anonymiser ; ne pas surinterpréter un cas |
| Contenus obsolètes | contenu arrivé à sa date/condition de revue | retrait ou correction avant nouvelle diffusion |
| Enseignements implémentés | décisions de garder/modifier/arrêter réellement appliquées | mesurer l’impact ensuite, pas le volume de notes |

Les vues, impressions, likes et durée de visionnage sont des diagnostics de distribution. Ils ne deviennent jamais la North Star.

## 11. Exemple fictif et anonymisé

> Exemple de conception uniquement ; aucune personne, adresse ou donnée de marché réelle.

| Champ | Exemple |
|---|---|
| Problème source | Plusieurs observations fictives indiquent que des acquéreurs confondent « indispensable » et « préférence » après des visites décevantes. La fréquence réelle reste à mesurer. |
| Cible | Acquéreur déjà avancé |
| Décision à faciliter | Savoir quels critères excluent réellement un bien et lesquels ouvrent un compromis |
| Angle | « Un critère dur doit survivre à la visite ; sinon c’était peut-être une préférence » |
| Format | Carrousel éducatif proposé |
| Promesse | Donner une méthode en trois catégories, sans promettre un matching |
| CTA | « Situer ma recherche » |
| Destination | `/ma-recherche`, sous réserve de test de la restitution correspondante |
| Claims | Aucune donnée de marché ; uniquement doctrine produit validée |
| Contrôle | Vérifier absence de conseil financier, ton non culpabilisant et accessibilité |
| Validation | TRUST-01 recommande ; Mouaad décide et publie |
| Mesure | restitutions, activations volontaires, conversations qualifiées ; attribution `inconnue` si non démontrable |
| Fallback | Si la destination ne traite pas réellement ces catégories, ne pas produire le contenu ; créer d’abord un insight produit |

## 12. Conditions d’arrêt

Une mission de contenu s’arrête ou revient à Mouaad si :

- la source ne permet pas d’établir le problème ;
- une PII ne peut pas être supprimée sans perdre le sens ;
- un chiffre ou un droit ne peut pas être vérifié ;
- aucune destination utile n’existe ;
- le coût prévu dépasse le plafond de mission ;
- le nombre de reprises atteint la limite définie ;
- l’approbation ou les sources ont expiré ;
- le contenu risque davantage d’éroder la confiance qu’il ne peut faciliter une conversation.

Le meilleur résultat du moteur peut être la décision documentée de **ne pas publier**.
