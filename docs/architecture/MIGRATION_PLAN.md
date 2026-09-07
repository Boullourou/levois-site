# Plan de migration vers le système client LEVOIS

Statut : stratégie proposée. Aucune migration D1, modification d’endpoint ou bascule n’est exécutée en Phase 1.

## Objectif

Faire évoluer progressivement :

- D1 `lectures_recherche` ;
- `POST /api/recherche` ;
- `POST /api/lead` ;

vers le modèle central sans casser `/ma-recherche`, `/situer-ma-vente`, `/audit-annonce`, `/votre-rue` ni `/contact`.

La stratégie est `expand → backfill → shadow → bascule → contract`. Les anciens contrats restent utilisables pendant la construction ; aucune table ou colonne historique n’est supprimée dans le même incrément que la bascule.

## Invariants non négociables

1. aucune donnée source existante n’est modifiée pendant le backfill ;
2. aucune notification n’est déclenchée par un import historique ;
3. aucune personne ni aucun bien n’est fusionné automatiquement ;
4. un consentement absent ou ambigu devient `unknown`, jamais `granted` ;
5. un retry portant la même clé d’idempotence valide ou le même UUID legacy ne crée pas deux objets centraux ; les anciens clients sans clé restent détectables mais ne permettent pas cette garantie absolue ;
6. le comportement HTTP et les emails des parcours existants restent inchangés tant que le mode shadow n’est pas validé ;
7. une panne du nouveau modèle ne rend pas un parcours public indisponible pendant le shadow ;
8. les migrations sont additives, numérotées et testées sur une base isolée ;
9. rollback applicatif par configuration avant toute restauration D1 ;
10. sauvegardes, exports et rapports contenant des données restent privés et hors Git ;
11. aucune fixture ne contient de personne, adresse, annonce ou conversation réelle ;
12. la politique de confidentialité est mise à jour avant d’activer une nouvelle persistance publique ;
13. aucun Accord TIM réel n’est reconstruit depuis un email, OMEGA, une notice ou un document interne, et aucune personne transmise n’entre automatiquement dans le pipeline client.

## État de départ vérifié

| Élément | Comportement actuel à préserver initialement |
|---|---|
| `lectures_recherche` | unique stockage D1, spécialisé acquéreur, champs mixtes colonnes/JSON |
| `/api/recherche` | D1 obligatoire ; insert avant notification ; `email_envoye=1` indique seulement qu’un fournisseur a répondu `ok`, pas la remise au destinataire |
| `/ma-recherche` | état en mémoire avant envoi ; payload historique + `project` + trois consentements |
| `/api/lead` | aucun stockage D1 ; envoi Resend, ou Formspree seulement lorsque la clé Resend manque |
| `/situer-ma-vente` | réponses/résultat sans coordonnées dans `sessionStorage` et code `?r=` |
| `/audit-annonce` | lecture URL et questionnaire en mémoire ; persistance uniquement sous forme d’email après demande humaine |
| `/votre-rue` | géocodage et calcul DVF côté navigateur ; qualification envoyée uniquement par email |
| Accords TIM | informations opérationnelles actuelles conservées hors Git et hors D1 ; aucun endpoint, schéma central ou import applicatif |
| tests | `/api/lead` et `/api/audit-url` couverts ; aucun test contractuel dédié à `/api/recherche` |

### Dette de consentement à ne pas masquer

- `/ma-recherche` envoie trois consentements granulaires, stockés dans `lecture_json` lorsque la lecture est présente ;
- `lectures_recherche.consent=1` est un héritage générique et ne prouve pas ces trois finalités ;
- les cases de `/contact`, `/situer-ma-vente/resultat` et `/votre-rue` sont vérifiées dans le navigateur mais ne sont pas transmises comme preuve structurée ;
- `/audit-annonce` transmet `consentement:true`, sans version du texte ni date serveur attachée à la finalité.

La migration ne crée aucune preuve rétroactive qui n’existe pas.

## Architecture de transition

```text
Pages publiques inchangées
          |
          v
Endpoints existants
          |
          +------> chemin legacy ----------------> comportement actuel
          |
          +------> adaptateur central (mode configurable)
                              |
                              v
                     ingestion idempotente D1
                              |
                              v
                 objets centraux + réconciliation

Modes : off -> shadow -> required
```

- `off` : seul le chemin legacy agit ;
- `shadow` : le chemin legacy reste autorité, le central est écrit et comparé sans modifier la réponse publique ;
- `required` : le central devient nécessaire après une période de réconciliation propre.

Le mode est une configuration serveur, pas un secret, mais sa modification doit être auditée.

## M0 — Geler les contrats et préparer les preuves

### Travail futur

- capturer avec des données fictives les payloads exacts de `/ma-recherche`, vendeur, audit, rue et contact ;
- ajouter des tests contractuels `/api/recherche` pour validation, D1 absent, insert échoué, notifications Resend/Formspree et méthode non autorisée ;
- figer comme baselines les asymétries exactes : sans clé Resend, échec Formspree après insert D1 → `503` ; avec clé Resend, échec Resend puis Formspree → D1 conservée, `200 {ok:true}`, `email_envoye=0` ; pour `/api/lead`, clé Resend présente + échec Resend → aucun fallback Formspree et `502` ;
- documenter le schéma de chaque payload par `schema_version` sans rendre le champ obligatoire immédiatement ;
- introduire conceptuellement `correlation_id` et `source_submission_id` ;
- exporter la D1 existante dans un emplacement privé et vérifier la procédure de restauration sur une base isolée ;
- mesurer volumes, taille, lignes lues/écrites et nombre de lignes `email_envoye=0`.

Les Accords TIM ne font pas partie des contrats publics à capturer : aucune fixture ne doit être fabriquée depuis un accord, un email, un formulaire OMEGA ou une notice réels. Les futurs tests du modèle TIM utiliseront uniquement des cas synthétiques et anonymisés.

### Critère d’acceptation

Aucune page, réponse HTTP, validation ou notification ne change. Tous les contrats actuels ont une fixture fictive et un test de référence.

### Rollback

Aucun changement métier ; retirer uniquement les instruments de test défaillants.

## M1 — Créer le schéma central de façon additive

Après validation explicite de l’architecture :

- créer des migrations D1 numérotées pour le seul noyau Phase 2 : ingestion/import/réconciliation, capture de consentement, personne/contact, projet/participants, recherche/scénarios/révisions/critères, interaction et notification minimales ;
- ne pas modifier ni supprimer `lectures_recherche` ;
- ajouter les contraintes, clés étrangères et index réellement nécessaires ;
- tester chaque migration sur base vide puis sur une copie fictive de la structure legacy ;
- enregistrer une version de schéma ;
- prévoir l’unicité de la référence `source + source_id + mapper_version` et les lots d’import désactivables ;
- commencer en mode central `off`.

Le schéma TIM est exclu de ce noyau Phase 2. Sa création exige un lot additif distinct et une validation explicite de son périmètre, de ses règles financières, de sa conservation et de son accès privé.

### Critère d’acceptation

Migration reproductible, aucun changement de ligne legacy, aucune dépendance des pages publiques aux nouvelles tables, et export/restauration testés.

### Rollback

Désactiver le chemin central. Corriger en avant ; ne pas utiliser une down migration destructive sur la base opérationnelle.

## M2 — Backfill idempotent de `lectures_recherche`

### Méthode

1. lire les lignes par lots ordonnés ;
2. valider et parser les JSON sans toucher la source ;
3. ouvrir un `import_batch` versionné et créer un `ingestion_result` pour chaque référence unique `lectures_recherche:<id>` ;
4. classer chaque source `migrated`, `needs_review`, `invalid_payload` ou `duplicate_candidate`, même si aucune cible n’est créée ;
5. réconcilier les comptes et champs ;
6. produire un rapport privé sans données personnelles ;
7. pouvoir rejouer le lot sans doublon.

### Mapping proposé

| Champ legacy | Destination | Règle de migration |
|---|---|---|
| `id` | `ingestion_result.source_id` | conserver intégralement, unicité source/version de mapper |
| `created_at` | soumission + interaction initiale | date source, UTC si interprétable |
| `src` | provenance d’acquisition | ne pas confondre avec la route `/ma-recherche` |
| `prenom` | personne provisoire | aucune déduplication automatique |
| `contact` | contact à qualifier | détecter prudemment email/téléphone ; sinon type `other` |
| `commentaire` | résumé/note d’interaction | minimiser et garder la source |
| `situation` | contexte du projet achat | déclaration directe, `confirmed` si non ambiguë |
| `type_bien` | critère `property_type` | déclaration directe |
| `secteur` | critère géographique | déclaration directe ; précision legacy conservée |
| `secteur_contraint` | flexibilité géographique | mapper la réponse, pas une dureté automatique |
| `budget`, `surface` | critères typés | déclarations directes avec unité explicite |
| `preserves` | critères prioritaires | sélection directe ; importance à mapper selon règle validée |
| `preserves_labels` | aide de revue legacy | conserver comme libellés historiques ; les codes restent canoniques lorsqu’ils existent |
| `flexibles` | critères souples | souvent dérivés par complément : `inferred`, pas `confirmed` |
| `flexibles_labels` | aide de revue legacy | conserver comme libellés historiques ; ne pas en faire une seconde source canonique |
| `decision_tension` | décision/arbitrage | direct si explicitement choisi, sinon absent |
| `lecture_json` statistiques DVF | observation de marché | `observed`, datée de la soumission, méthode legacy |
| `lecture_json` interprétations | propositions/lectures | `inferred`, jamais fait confirmé |
| `lecture_json.projet` | critères financement/zone/horizon | clé française réellement persistée ; déclarations directes si présentes et valides |
| `lecture_json.consentements` | `consent_capture` legacy | garder les booléens explicites, mais qualité `evidence_incomplete` faute de notice versionnée ; ne pas créer `granted` |
| `consent` | métadonnée legacy générique | ne crée pas les trois consentements métier |
| `email_envoye` | `notification_delivery` | indicateur legacy d’acceptation HTTP fournisseur, pas preuve de remise ; `0` reste ambigu (non tenté, échec fournisseur ou mise à jour asynchrone échouée) |

### Cas incomplets

- JSON absent/malformé : importer les colonnes valides et classer le reste en revue ;
- `contact` ambigu : ne pas inventer un email ou téléphone ;
- doublons probables : créer des candidats de fusion, sans fusion ;
- consentements granulaires absents : `unknown` ;
- valeurs calculées par l’ancienne page : `observed` ou `inferred` selon leur nature.

### Critère d’acceptation

Chaque ligne possède exactement un résultat par version de mapper ; aucune cible n’est créée deux fois pour cette version ; les totaux source/cible sont réconciliés ; aucun email, matching ou tâche de relance n’est déclenché.

### Rollback

Passer l’`import_batch` fautif à `inactive`, exclure ses mappings, reconstruire les projections puis rejouer un nouveau lot/version de mapper. Ne pas supprimer la table legacy ni restaurer toute la base pour une erreur localisée.

## M3 — Écriture shadow de `/api/recherche`

### Séquence

1. conserver la validation et l’insert `lectures_recherche` actuels ;
2. utiliser l’UUID legacy comme référence stable ;
3. projeter la soumission dans le central en mode shadow ;
4. si le central échoue, garder la réponse publique actuelle ; la reprise durable vient de l’anti-jointure entre `lectures_recherche` et les mappings actifs, les logs n’étant qu’un signal ;
5. conserver exactement les trois branches HTTP/notification figées en M0 et la sémantique ambiguë de `email_envoye` ;
6. réconcilier régulièrement toute ligne legacy sans projection ;
7. passer à `required` seulement après une fenêtre validée sans échec non résolu.

Le futur navigateur peut envoyer un `source_submission_id` aléatoire suffisamment entropique, stable pendant les retries et limité à sa source. Le serveur conserve aussi une empreinte canonique de requête : même clé et même payload renvoient le même résultat logique ; même clé avec payload différent renvoie `409` sans révéler la soumission existante. Pour les anciens clients, l’UUID serveur reste la clé de mapping ; des doubles soumissions possibles sont signalées, pas fusionnées.

### Critère d’acceptation

Mêmes statuts/corps HTTP, mêmes notifications et aucune régression `/ma-recherche`. Une même clé valide ne duplique rien ; les doubles possibles des anciens clients apparaissent au triage. L’anti-jointure de réconciliation est vide.

### Rollback

Repasser le mode à `off`. Le chemin legacy reste fonctionnel et aucun rollback de schéma n’est nécessaire.

## M4 — Persistance progressive de `/api/lead`

### Pourquoi un intake de triage

Les variantes vendeur, audit, rue et contact n’identifient pas toujours un projet ou un bien avec certitude. Elles créent d’abord une `inbound_submission`; Mouaad choisit ensuite de créer/rattacher une personne et un projet. Cela évite les faux doublons et la supposition qu’une adresse recherchée appartient au visiteur.

### Évolution rétrocompatible du contrat

Conserver endpoint et champs historiques. Ajouter facultativement :

- `schema_version` ;
- `source_submission_id`, stable pendant les retries ;
- consentement structuré côté client : action et code stable du formulaire uniquement ; le serveur résout la finalité, la version/empreinte du texte connu et fixe l’heure de réception dans `consent_capture` ;
- codes stables de réponses en plus des libellés ;
- version du questionnaire ou moteur.

Valider origine, anti-bot et format avant persistance. La validation du contrat historique reste distincte de la qualité de preuve : les anciens clients sans nouveaux champs restent acceptés pendant la transition, mais leur capture est `evidence_incomplete|unknown` et ne crée jamais un accord prouvé.

### Mapping par source

- `parcours` : intake + interaction + projet vendeur candidat ; la règle du moteur reste `inferred` ;
- `audit-annonce` : intake d’abord ; après triage, listing/snapshot partiel (URL, source, titre, prix, nombre de photos) + lecture vendeur ; description/localisation extraites mais non transmises restent absentes ou `to_confirm` ; jamais une évaluation acquéreur automatique ;
- `votre-rue` : intake + observation de marché ; adresse ≠ preuve de propriété ;
- `contact` : interaction avec type de projet inconnu jusqu’au triage.

### Sémantique de succès

En mode shadow, préserver la sémantique historique : `/api/lead` confirme seulement si le fournisseur accepte la notification. Si D1 réussit et l’email échoue, conserver `notification_delivery.status=failed`, mais retourner encore l’erreur historique jusqu’à décision explicite de changer l’UX.

Après validation, une évolution possible serait d’annoncer « demande enregistrée, notification retardée ». Ce changement produit doit être décidé et testé séparément.

### Emails historiques

Ne pas scraper ou importer automatiquement Resend, Formspree ou la boîte email. Une éventuelle reprise est un chantier séparé, manuel, minimal et sourcé `legacy_email`.

### Confidentialité préalable

La page actuelle annonce une conservation pendant le suivi puis au maximum trois ans sans contact. Avant la nouvelle persistance, mettre à jour la politique pour décrire D1, les catégories exactes, finalités, destinataires, suppression et durées configurées. Cette étape exige une validation métier/juridique ; la présente architecture n’est pas un avis juridique.

### Critère d’acceptation

Pages et emails inchangés ; idempotence garantie pour une même clé valide, doubles legacy visibles au triage ; lead visible dans la file ; capture de consentement correcte pour les nouveaux formulaires instrumentés ; aucun projet créé sans règle humaine validée.

### Rollback

Désactiver l’écriture centralisée ; `/api/lead` redevient email-only. Conserver les intakes déjà enregistrés selon leur politique de rétention.

## Accords TIM — initialisation privée différée

Les Accords TIM connus aujourd’hui ne sont ni dans D1 ni dans Git. Ils ne constituent pas une source legacy des parcours publics et ne doivent pas être aspirés depuis la boîte email, OMEGA, une notice interne ou des documents existants.

Après validation d’un lot TIM séparé, l’initialisation des accords réels se fera manuellement dans un outil privé authentifié, ou au moyen d’un script ponctuel privé offrant les mêmes validations et le même audit. Elle devra :

- créer explicitement l’accord dédié sans créer automatiquement de projet vendeur, mandat ou statut client ;
- demander une allocation explicite pour chaque conseiller, le type d’opération et les conditions applicables à cet accord ;
- exiger pour une location la saisie manuelle des pourcentages, du fait générateur du paiement et des conditions, sans appliquer de preset 20/80 ;
- conserver séparément l’état de l’accord, l’état de l’opération et l’état de la rémunération ;
- rattacher une personne, un bien, un projet ou une interaction seulement après choix humain et selon le minimum nécessaire ;
- créer une prochaine action ou signaler immédiatement l’accord ouvert comme dépourvu de prochaine action ;
- conserver toute référence de formulaire signé ou de dépôt OMEGA dans un stockage privé contrôlé, jamais dans Git.

Cette initialisation n’est ni un backfill automatique ni une tâche du noyau Phase 2 proposé ci-dessous. Aucun accord réel, nombre d’accords, identité, bien, montant ou document interne ne doit apparaître dans les migrations, fixtures, rapports versionnés ou logs.

## M5 — Cockpit en lecture seule

- protéger hostname/routes/API avant toute donnée ;
- lire uniquement les projections centrales ;
- afficher leads, erreurs de normalisation, données `to_confirm` et réconciliation ;
- ne permettre aucune mutation métier ;
- vérifier qu’aucune donnée privée n’apparaît sur le domaine public, dans `dist`, le sitemap, le cache ou PostHog.

### Critère d’acceptation

Sans authentification : aucun HTML ou JSON sensible. Avec authentification : comptes, statuts et totaux correspondent aux fixtures et rapports de réconciliation.

### Rollback

Désactiver les routes privées ou révoquer l’application Access, sans effet sur l’ingestion publique.

## M6 — Mutations humaines contrôlées

Ordre recommandé :

1. triage intake ;
2. interactions et tâches/prochaine action ;
3. projets et relations achat/vente ;
4. critères versionnés et révisions ;
5. biens, annonces et snapshots ;
6. évaluations et visites ;
7. matching humain ;
8. exports et suppression.

Chaque incrément possède ses tests, audit et rollback applicatif. Toute modification de critère crée un événement ; toute fusion, confirmation, export, suppression et validation de matching est auditée.

Les Accords TIM suivent une séquence ultérieure indépendante : modèle et contraintes, tests fictifs, routes privées, saisie manuelle auditée, puis seulement initialisation des accords réels hors Git. Ils ne sont pas ajoutés au volet vendeur par commodité.

### Critère d’acceptation

Historique complet, conflits visibles, export/suppression vérifiés, aucun projet actif invisible lorsqu’il manque une prochaine action.

## M7 — Bascule d’autorité et retrait progressif du legacy

- faire du modèle central l’autorité après période d’usage réelle ;
- garder un miroir temporaire encore inscriptible dans `lectures_recherche` pendant la fenêtre de compatibilité ;
- traiter les notifications comme une livraison séparée, rejouable depuis un état persistant ;
- comparer les lectures legacy et centrales pendant une fenêtre définie ;
- arrêter ensuite le miroir, effectuer une réconciliation finale, puis seulement passer la table legacy en lecture seule ;
- ne la supprimer qu’après export, délai de conservation, validation et livraison séparée.

### Rollback

Revenir au dernier mode d’écriture stable. Utiliser Time Travel uniquement pour un incident de données confirmé ; une bascule applicative ordinaire ne justifie pas d’écraser la base.

## Observabilité sans PII

### Journal technique

- `correlation_id`, source, version de schéma ;
- étapes `validated`, `legacy_written`, `core_written`, `normalized`, `notified` ;
- durée, code d’erreur catégorisé, canal/statut de notification ;
- identifiants techniques internes, jamais le payload ou les coordonnées.

### Indicateurs

- lignes legacy sans projection ;
- imports `needs_review|invalid_payload` ;
- retries et doublons potentiels ;
- notifications échouées ;
- leads non traités ;
- projets actifs sans prochaine action ;
- matchings `stale` ;
- exports/suppressions échoués ;
- refus d’accès aux routes privées.

Une reprise critique ne dépend pas uniquement de `waitUntil` : pour l’acquéreur, l’anti-jointure durable legacy/mappings indique quoi rejouer ; pour les leads email-only, aucune reprise garantie n’existe avant une persistance réussie. Les logs ne sont jamais la file de reprise.

## Modes d’échec à couvrir

| Cas | Risque | Garde-fou |
|---|---|---|
| D1 indisponible avant insert legacy | perte acquéreur | comportement actuel explicite, aucun faux succès |
| legacy réussi / central échoué | divergence | shadow non bloquant + réconciliation idempotente |
| D1 réussi / notification échouée | lead invisible dans l’email | statut persistant, file « notification failed » |
| réponse réseau perdue puis retry | doublon | idempotence si clé stable ; sinon candidat legacy visible au triage |
| même clé d’idempotence, payload différent | collision ou abus | `409`, aucune donnée existante révélée, audit technique sans payload |
| JSON historique malformé | ligne oubliée | classification/revue, compte source réconcilié |
| consentement legacy absent | fausse autorisation | `unknown`, jamais déduit |
| même coordonnée sur deux projets | fusion erronée | personne/projets séparés et fusion humaine |
| options vendeur modifiées | code `?r=` mal interprété | versionner questionnaire/codes avant réutilisation serveur |
| Accord TIM transformé en statut vendeur ou projet client | faux mandat et pipeline trompeur | entité dédiée ; aucun rattachement ou projet créé sans décision humaine |
| reprise automatique depuis email, OMEGA ou document interne | fuite, doublon ou interprétation erronée | reprise interdite ; initialisation privée manuelle, validée et auditée |
| location préremplie en 20/80 | partage ou exigibilité inventés | pourcentages, fait générateur et conditions obligatoirement saisis par accord |
| états TIM fusionnés | rémunération déclarée due trop tôt ou accord clôturé à tort | trois axes et historiques distincts, transitions testées séparément |
| saisie TIM répétée | double suivi ou double montant attendu | identifiant stable, contrôle de doublon et confirmation humaine sans fusion automatique |
| preview cockpit non protégée | fuite client | Access et test automatisé sur toutes les URLs de preview |
| export interrompu | fichier partiel | génération atomique, lien seulement après succès |
| suppression partielle | résidus/orphelins | état de demande, inventaire et vérification finale |

## Stratégie de tests future

### Contrats publics

- payloads exacts des cinq sources ;
- méthodes non autorisées ;
- validation, honeypot, origine et rate limit ;
- D1/email en succès et panne ;
- maintien des statuts et messages existants pendant shadow.

### Adaptateurs

- mapping de chaque champ ;
- distinction `confirmed|observed|inferred|to_confirm` ;
- consentement absent/retiré ;
- consentement capturé avant création d’une personne et retrait annulant une notification en attente ;
- codes/libellés/version de questionnaires ;
- normalisation sans fusion.

### D1 et backfill

- migrations base vierge et structure legacy ;
- idempotence et retries ;
- collision/réutilisation hostile d’une clé d’idempotence ;
- clés étrangères ;
- lots interrompus/repris ;
- JSON invalide ;
- réconciliation des totaux ;
- reconstruction des projections ;
- restauration dans une base isolée.
- restauration puis réapplication du registre d’effacements ;

### E2E

- chaque parcours public jusqu’à sa réponse actuelle ;
- reprise `sessionStorage` vendeur ;
- double soumission ;
- panne lente/réseau ;
- Access/noindex/cache/IDOR/CSRF/XSS ;
- JWT Access falsifié, mauvais issuer/audience, et preview non couverte qui doit échouer fermée ;
- triage, historique, matching stale, export et suppression.

### Confidentialité

- aucune PII dans les logs, analytics, `dist` ou fixtures ;
- finalité/version/date des consentements ;
- retrait, export, délai de grâce et purge ;
- expiration/révocation des URLs d’export, absence dans les referrers et rétention effective des payloads temporaires ;
- absence d’audio/transcription brute ;
- absence d’Accord TIM réel, de formulaire signé, de contenu OMEGA ou de notice interne dans les fixtures et le dépôt.

### Accords TIM — lot ultérieur

- fixtures exclusivement synthétiques, sans reproduire un accord réel ni son document ;
- indépendance des états accord/opération/rémunération, notamment accord signé avec opération en cours et rémunération non due ;
- aucun projet, `seller_case`, mandat ou statut client créé lors de la saisie d’un accord ;
- parts enregistrées sur chaque accord et modifiables par commande auditée, sans règle immuable 20/80 ou 50/50 ;
- `transaction_type=rental` sans valeur par défaut, refusé tant que pourcentages, fait générateur et conditions ne sont pas saisis ;
- montants estimé, dû et payé non confondus, y compris paiement partiel ou correction future ;
- accord ouvert sans prochaine action visible dans les contrôles opérationnels ;
- initialisation manuelle idempotente, accès privé, audit et rollback applicatif sans suppression de preuve utile.

## Dépendances et parallélisation de la future réalisation

| Lot | Modules touchés | Dépend de |
|---|---|---|
| Contrats/tests publics | tests, fonctions publiques | M0 |
| Schéma/migrations | D1/migrations | validation Phase 1 |
| Backfill/réconciliation | scripts privés, D1 | schéma + contrats |
| Adaptateur `/api/recherche` | fonction recherche, services ingestion | schéma + tests |
| Adaptateur `/api/lead` | fonction lead, services ingestion | schéma + consentements validés |
| Auth/cockpit lecture | routes privées, BFF | projections centrales fiables |
| Exports/effacement | services privés | cockpit + politique de conservation |
| Accords TIM | migrations additives, services métier et vues privées dédiées | validation explicite du lot TIM + authentification privée + interactions/tâches + politique financière et de conservation |

Les tests de contrat et la conception des migrations peuvent avancer en parallèle. Les deux adaptateurs partagent les services d’ingestion et doivent être séquencés ou coordonnés. Le cockpit attend la réconciliation du modèle central.

## Proposition de Phase 2

Limiter la Phase 2 à la fondation de données, sans cockpit :

1. valider les arbitrages bloquants du modèle et des consentements ;
2. écrire les tests contractuels manquants, surtout `/api/recherche` ;
3. créer les migrations D1 additives du noyau seulement : ingestion/import/réconciliation, capture de consentement, personne/contact, projet/participants, recherche/scénarios/révisions/critères, interaction et notification minimales ; différer vendeur avancé, Accords TIM, annonces, visites, matching, IA, Lab et exports ;
4. écrire des adaptateurs purs source → commandes centrales ;
5. exécuter un backfill idempotent en lecture seule de `lectures_recherche` ;
6. produire un rapport de réconciliation sans données personnelles ;
7. rester en mode central `off` ou shadow contrôlé ;
8. ne créer ni cockpit, ni IA, ni API Yanport, ni bascule d’autorité dans ce même incrément.

Cette Phase 2 proposée nécessite une validation explicite séparée. Elle n’autorise ni schéma TIM, ni interface TIM, ni reprise des accords existants.

## Arbitrages avant Phase 2

La définition métier de TIM est désormais validée. Les questions TIM suivantes ne bloquent pas le noyau Phase 2, mais devront être tranchées avant le lot TIM :

1. assiette des honoraires et représentation HT/TTC/devise ;
2. fait générateur et conditions de rémunération de chaque location ;
3. gestion des paiements partiels, multiples, corrigés ou contestés ;
4. règle de clôture lorsqu’une rémunération reste due ou à vérifier ;
5. somme des pourcentages : contrainte stricte ou alerte autorisant un accord personnalisé ;
6. emplacement privé, durée de conservation et droits d’accès des références de formulaire signé et de dépôt OMEGA.

Arbitrages restant nécessaires pour le noyau Phase 2 :

1. échelles et règle de confirmation des critères ;
2. création d’un projet brouillon à l’intake ou triage préalable ;
3. sémantique future si D1 réussit mais l’email échoue ;
4. finalités/textes de consentement par parcours ;
5. durées de conservation et délai de grâce ;
6. import ou non des anciens emails — recommandation : non automatique ;
7. fenêtre et seuils de validation du mode shadow ;
8. objectifs de restauration et fréquence d’exports privés ;
9. définition opérationnelle d’un projet actif et de sa prochaine action.
