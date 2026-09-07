# Système client LEVOIS

Statut : proposition d’architecture Phase 1, à valider avant toute création de table ou interface.

Référence de départ : `1cb7053399f8e71dba90fcf7c5fd7bd903a1bca6`.

## Décision d’ensemble

LEVOIS doit devenir un système unique, mais pas un écran unique ni un stockage indistinct :

- le site public produit de la valeur et recueille seulement ce qui est nécessaire ;
- les points d’entrée serveur transforment les demandes en données traçables ;
- D1 devient la source opérationnelle canonique ;
- le cockpit privé lit et modifie cette source sous contrôle humain ;
- les emails sont des notifications, pas une base client ;
- Yanport reçoit un export de recherche, sans synchronisation dans cette phase ;
- Obsidian reçoit des exports Markdown et reste la mémoire longue ;
- l’IA future formule des propositions, jamais des mutations silencieuses.

```text
Site public / interactions humaines
                  |
                  v
        Contrats d’entrée versionnés
                  |
                  v
       D1 : source opérationnelle
        |          |           |
        v          v           v
  Cockpit privé  Notifications  Exports versionnés
                    email       |              |
                                v              v
                             Yanport        Obsidian
```

La frontière structurante est la suivante : **une information reçue n’est pas automatiquement une vérité métier**. Elle garde une source, une date, un niveau de certitude et, lorsque nécessaire, une validation humaine.

## Périmètre de cette phase

Cette phase définit le modèle, les responsabilités, la sécurité et la migration. Elle ne crée aucune table, aucun endpoint, aucune interface cockpit et aucune intégration externe.

### Hors périmètre explicite

- migration D1 et backfill : différés jusqu’à validation du modèle ;
- cockpit et routes privées : différés jusqu’à validation des vues et de l’authentification ;
- API Yanport : non prévue à ce stade ;
- écriture Cloudflare vers le vault Obsidian : interdite par conception ;
- API OpenAI, transcription et automatisation IA : différées ;
- déduplication automatique des personnes ou des biens : trop risquée sans validation humaine ;
- score de matching présenté comme une vérité : contraire à la doctrine LEVOIS ;
- conservation d’audios, transcriptions ou emails bruts : non nécessaire pour la V1 ;
- changement des parcours publics existants : aucun changement fonctionnel en Phase 1.
- import des Accords TIM existants ou de la notice interne SAFTI : données privées et document interne hors dépôt ; toute reprise sera un chantier privé séparé.

## Ce qui existe déjà

Le futur système réutilise les éléments actuels au lieu de les reconstruire en parallèle :

- `lectures_recherche` fournit un premier stockage D1 des demandes acquéreur ;
- `/api/recherche` applique déjà le principe « persister avant de notifier » ;
- `/api/lead` centralise les transmissions vendeur, audit, rue et contact, mais reste email-only ;
- `/situer-ma-vente` possède déjà un moteur déterministe, des réponses structurées et une restitution prudente ;
- `/audit-annonce` sépare le lien observé, les réponses déclarées et la limite de l’automatisation ;
- `/votre-rue` produit une lecture DVF réelle, puis une qualification volontaire ;
- les consentements acheteur sont déjà séparés dans l’interface, même s’ils ne sont pas encore exploitables comme événements autonomes ;
- les événements analytiques mesurent des parcours, mais ne doivent jamais devenir une fiche client ou une source métier.
- les Accords TIM opérationnels actuels restent hors Git et ne disposent encore d’aucun stockage structuré dans l’application.

## Audit des données actuelles

### Matrice source → destination

| Source actuelle | Données produites | Stockage actuel vérifié | Limites actuelles | Destination future proposée |
|---|---|---|---|---|
| `/ma-recherche`, avant soumission | situation, type, secteur, communes acceptables, temps maximal, financement, vente préalable, horizon, budget, surface, priorités, flexibilité, arbitrage, lecture DVF | mémoire JavaScript de la page uniquement ; pas de `sessionStorage` | perte au rechargement ; valeurs courantes sans historique ; critères mêlés à une restitution calculée | `inbound_submission` puis `person`, `project`, `buyer_search`, scénarios, critères versionnés et révision de recherche |
| `/ma-recherche`, activation | prénom, contact libre, commentaire, origine `src`, trois choix de consentement | envoi à `/api/recherche` | le champ contact mélange potentiellement email et téléphone ; identité minimale ; pas de version de notice | `consent_capture` lié à la soumission, puis `contact_method`, `consent_event` par finalité, `interaction` et provenance de campagne après rattachement |
| `/api/recherche` | normalisation partielle, identifiant UUID, date serveur, colonnes historiques, `lecture_json`, état de notification | insert obligatoire dans D1 `lectures_recherche`, puis notification Resend ou Formspree | schéma spécialisé acquéreur ; validation métier limitée ; champs enrichis imbriqués ; consentement historique générique ; pas de test dédié à l’endpoint | adaptateur rétrocompatible vers le modèle central, avec journal d’ingestion idempotent et notification découplée |
| D1 `lectures_recherche` | une ligne par lecture acquéreur | D1 ; champs principaux en colonnes, projet/consentements enrichis dans `lecture_json` | plusieurs soumissions d’une même personne restent des lignes non reliées ; critères figés ; pas d’interactions, tâches, historique ni retraits de consentement ; JSON difficile à filtrer | source legacy conservée pendant la migration, puis mapping traçable vers personne/projet/recherche/critères/consentements |
| `/situer-ma-vente` | situation parmi cinq parcours, réponses structurées, étape courante | `sessionStorage` `levois.parcours` ; aucune coordonnée | données limitées à l’onglet/session ; aucune vue opérationnelle ; réponses écrasées lors des changements | rester dans le navigateur avant contact ; créer une `inbound_submission` seulement lors d’une transmission ou d’une sauvegarde serveur explicitement demandée, cette dernière exigeant une décision produit/confidentialité séparée |
| `/situer-ma-vente/resultat` | résultat déterministe, niveau qualitatif, reformulation, limite, prochaine action, ressource ; code compact `?r=` | `sessionStorage` `levois.resultat` ou paramètres d’URL ; affichage navigateur | le code URL peut rester dans historique/referrer ; ce n’est pas une chronologie ; aucune persistance centrale avant contact | `seller_signal`, `decision/proposal`, `interaction` et première tâche après consentement ; éviter les données sensibles dans l’URL future |
| formulaire vendeur résultat | prénom, nom, email, téléphone facultatif, commune, URL d’annonce facultative, détail, synthèse et réponses | `/api/lead` puis email Resend/Formspree ; aucune D1 | consentement vérifié uniquement par le navigateur et non transmis comme preuve ; pas de statut de traitement ; email non requêtable | `inbound_submission` et `consent_capture`, puis personne/projet vendeur, interaction et tâche seulement après triage |
| `/audit-annonce` avant contact | URL, snapshot temporaire (source, titre, description, prix, photos, localisation), durée, signal, réponse contextuelle, faits, deux actions | mémoire navigateur ; `/api/audit-url` ne persiste pas applicativement | pas d’historique d’observation ; URL et snapshot perdus ; la disponibilité du portail varie | `listing`, `listing_snapshot` et évaluation uniquement après sauvegarde volontaire ; provenance et date d’observation obligatoires |
| `/api/audit-url` | lecture ponctuelle d’une URL publique, extraction JSON-LD/OpenGraph, analyse ou fallback | aucun stockage applicatif ; réponse `no-store` | donnée transitoire ; les logs de plateforme et politiques du portail ne sont pas décrits par le repo ; pas un observateur récurrent | service d’observation à usage ponctuel ; aucun stockage sans action explicite ; snapshot versionné si sauvegardé |
| formulaire `/audit-annonce` | identité/contact, URL, précision, résultat, faits, actions, réponses, consentement booléen ; seulement source, titre, prix et nombre de photos du snapshot sont transmis, pas la description/localisation extraites | `/api/lead` puis email uniquement | consentement non historisé ni versionné ; annonce non reliée à un bien/projet ; snapshot transmissible partiel ; aucun retour client | `inbound_submission` et `consent_capture` d’abord ; après triage, `listing_snapshot` partiel, bien/projet éventuels, évaluation et interaction ; description/localisation restent absentes ou `to_confirm` |
| `/votre-rue` avant contact | adresse/requête, coordonnées géocodées, transactions DVF, médianes/quartiles, composition, tendance | calcul en mémoire depuis JSON DVF ; adresse envoyée au service public de géocodage ; aucune D1 | adresse non persistée dans le navigateur mais transmise au tiers de géocodage ; lecture de secteur non rattachée à un projet ; pas d’historique | observation de marché non personnelle par défaut ; rattachement à un projet seulement après consentement et minimisation de l’adresse |
| qualification `/votre-rue` | intention, profil, réponses, prénom, email, téléphone, adresse recherchée, commune de la transaction DVF retenue, contexte infographie | `/api/lead` puis email uniquement | consentement requis dans l’UI mais non conservé comme événement ; la `commune` n’est pas une commune déclarée/confirmée de l’adresse recherchée ; pas de dossier | `inbound_submission` et `consent_capture`, puis personne/projet selon triage, interaction et prochaine tâche ; commune qualifiée avec sa provenance DVF |
| `/api/lead` | contact générique, vendeur, audit-annonce ou votre-rue ; corps email structuré | Resend si configuré, sinon Formspree ; aucune base | rétention dépendante du fournisseur et de la boîte email ; absence d’idempotence, de statut métier et de recherche ; impossible de détecter un lead non traité | point d’entrée stable, ajout futur d’une persistance D1 avant notification, avec statut de triage et identifiant de corrélation |
| `/contact` | prénom, nom, email, téléphone, objet, message | `/api/lead` puis email uniquement | mêmes limites que `/api/lead` ; consentement UI non auditable dans le système | personne éventuelle, interaction de type formulaire, consentement/finalité, projet créé seulement après qualification |
| événements PostHog | navigation, étapes, résultats vus, activations | plateforme analytique externe ; seul le choix d’opposition est mémorisé localement dans `localStorage` (`levois_analytics_opt_out`) | événements produit, pas données client canoniques ; ne doivent pas servir au matching ou à la relation client | conserver séparé ; importer uniquement des agrégats produit dans LEVOIS Lab si utile, sans identité client |
| Accords TIM actuels | collaboration entre conseillers, information transmise, opération, formalisation et rémunération | hors Git et hors modèle D1 actuel ; aucune source applicative à auditer | aucune alerte, séparation d’états ou prochaine action dans LEVOIS ; un contact transmis risque d’être confondu avec un client géré | futur agrégat privé `tim_agreement`, initialisé manuellement hors fixtures et sans importer automatiquement emails, OMEGA ou notice interne |

### Schéma D1 vérifié

`lectures_recherche` contient exactement : `id`, `created_at`, `src`, `prenom`, `contact`, `commentaire`, `situation`, `type_bien`, `secteur`, `secteur_contraint`, `budget`, `surface`, `preserves`, `preserves_labels`, `flexibles`, `flexibles_labels`, `decision_tension`, `lecture_json`, `consent`, `email_envoye`. Les index actuels portent sur la date et `src`. Les listes et la lecture enrichie sont sérialisées en JSON texte ; il n’existe aucune clé étrangère vers une personne ou un projet.

### Observations importantes

1. La seule base métier structurée actuelle dans D1 est `lectures_recherche` et elle ne couvre que l’acquéreur ; les emails et PostHog restent des stockages externes séparés.
2. Les autres parcours sont « email-first » : une panne de notification ou un classement de boîte peut rendre un dossier invisible.
3. La page acheteur envoie `source: 'ma-recherche'`, mais l’API enregistre uniquement `src`, le paramètre de campagne éventuel. La route source est donc perdue dans la ligne actuelle.
4. `project` et les trois consentements acheteur ne sont ajoutés à `lecture_json` que si `body.lecture` est un objet ; le projet y est persisté sous la clé française `projet`, et une soumission API incomplète peut perdre ces enrichissements.
5. Le booléen D1 `consent=1` ne décrit aucune finalité. L’API accepte par ailleurs `consent:true` sans valider elle-même qu’au moins un consentement métier est vrai.
6. Les consentements vendeur et rue sont imposés dans l’interface, sans preuve serveur durable contenant finalité, date et version de notice.
7. Les réponses vendeur et rue finissent principalement sous forme de libellés français dans l’email. Sans code stable et version de questionnaire, leur sens peut dériver lorsque les textes changent.
8. Les critères « flexibles » de `/ma-recherche` sont calculés par complément des priorités préservées ; ce sont des inférences, pas toujours une déclaration explicite.
9. Aucun endpoint actuel ne gère l’idempotence : un retry peut créer plusieurs lignes ou plusieurs emails.
10. Le parcours vendeur garde des informations non identifiantes dans `sessionStorage`; le code `?r=` expose un résumé compact dans l’URL et dépend d’indices d’options non versionnés.
11. La politique publique annonce au maximum trois ans sans contact, mais le schéma ne contient encore aucun mécanisme de purge, d’export ou d’effacement.
12. Aucun contenu client réel ne doit être reconstitué depuis les emails dans Git ou dans des fixtures de test.
13. Un propriétaire, acquéreur, bailleur ou locataire transmis dans un Accord TIM n’est pas automatiquement un client géré par Mouaad et ne doit pas entrer seul dans le pipeline Clients.

## Architecture fonctionnelle cible

### Contextes fonctionnels

| Contexte | Responsabilité | Source de vérité |
|---|---|---|
| Acquisition publique | donner une lecture, recueillir une activation explicite, protéger les secrets | code public + contrats d’entrée ; aucune donnée client dans le HTML généré |
| Intake | valider, limiter les abus, dater, attribuer une provenance, rendre la soumission idempotente | D1 `inbound_submission` |
| Client/projet | identité minimale, projets multiples, stade, calendrier, responsable | D1 personnes/projets |
| Recherche acquéreur | scénarios, critères, certitudes, historique et révisions | D1 événements de critères + projection courante |
| Vente/bien | situation vendeur, bien, commercialisation, diagnostics, signaux, visites, offres | D1 projet vendeur + entités immobilières |
| Collaboration inter-conseillers / TIM | accords, parties, termes, opération, rémunération et prochaine action | D1 agrégat TIM distinct des projets clients |
| Relation | interactions, tâches, documents/liens et prochaine action | D1 interactions/tâches |
| Matching | candidats explicables et décision humaine | D1 rapprochements versionnés |
| Cockpit | lecture/action privée ; aucune vérité propre | projections D1 |
| Exports | représentations datées pour Yanport et Obsidian | révision D1 référencée par un manifeste |
| IA future | propositions sourcées et révocables | file de propositions ; jamais la donnée métier directement |

### Règles de propriété des données

- D1 possède l’état opérationnel courant et son historique métier.
- Une notification email porte un identifiant de dossier et un lien cockpit, pas une copie exhaustive si ce n’est pas nécessaire.
- Obsidian reçoit une photographie Markdown datée. Une note humaine ne doit pas être écrasée par un futur pont local.
- Yanport reçoit un filtre exporté depuis une révision précise de recherche.
- PostHog conserve la mesure produit séparément.
- un Accord TIM peut référencer un contact, un bien, un projet ou une transaction, sans créer automatiquement un projet client ni prétendre que Mouaad détient le mandat ;
- les pourcentages et conditions sont enregistrés sur chaque accord et ne sont jamais déduits d’un modèle global ;
- Les fichiers sources, tests et documentation Git ne contiennent aucune donnée client, adresse privée, transcription ou audio.

### Accords TIM — définition métier

TIM signifie « Taux Inter Mandataire ». Un Accord TIM est une collaboration interne entre conseillers SAFTI qui formalise la répartition d’honoraires lorsqu’ils travaillent sur une même information, opportunité ou transaction. Ce n’est ni un statut client, ni une étape vendeur, ni un mandat détenu par Mouaad, ni une transaction acquise.

Deux configurations usuelles servent de point de départ, sans devenir des règles immuables :

- `information_referral_20_80` : un conseiller transmet une information qualifiée et l’autre traite le mandat, les clients et l’opération ; le partage recommandé est 20 % / 80 % ;
- `mandate_50_50` : un conseiller gère le mandat et le vendeur, l’autre trouve et gère l’acquéreur ; le partage recommandé est 50 % / 50 % ;
- `custom` : termes librement renseignés.

Le cas d’usage principal actuel est l’envoi d’information, mais le modèle reste symétrique : Mouaad peut être apporteur ou conseiller traitant. Les pourcentages effectivement convenus sont toujours persistés dans l’accord et peuvent différer du partage usuel.

Chaque Accord TIM conserve trois axes indépendants :

1. état de l’accord : `to_formalize|signed|uploaded_to_omega|active|cancelled|closed` ;
2. état de l’opération : `information_transmitted|contact_made|mandate_obtained|marketing_or_search_in_progress|offer_or_application_received|precontract_or_lease_signed|deed_or_rental_finalized|operation_abandoned` ;
3. état de la rémunération : `not_yet_due|estimated|due|paid|to_verify|disputed|cancelled`.

Un accord peut donc être signé alors que l’opération est encore en cours et que la rémunération n’est pas due. `transaction_type` accepte `sale|rental|other`. Pour `rental`, pourcentages, conditions et fait générateur du paiement sont obligatoirement saisis manuellement : aucun 20/80 automatique.

## Choix de base de données

### Option A — étendre D1

**Recommandation : oui.** Une seule base relationnelle D1 couvre le besoin V1 avec moins de synchronisation, moins de secrets et moins de maintenance.

Hypothèse de dimensionnement à valider après mesure : quelques milliers de personnes/projets et jusqu’à quelques centaines de milliers d’événements, snapshots et facteurs sur plusieurs années, avec une concurrence d’écriture faible liée à un opérateur principal. Ce volume n’exige pas une seconde stack.

Atouts :

- D1 et son binding existent déjà dans le projet ;
- le modèle est relationnel et bénéficie de clés étrangères, index et migrations SQL ;
- l’historique append-only et les projections courantes sont compatibles avec SQLite ;
- la facturation est liée aux lignes lues/écrites et au stockage, avec mise à l’échelle à zéro ;
- Time Travel offre une restauration à un point dans le temps sur les bases compatibles ; un export hors plateforme reste nécessaire pour une conservation plus longue ;
- FTS5 existe si une recherche textuelle simple devient utile, sans l’imposer à la V1.

Limites à gérer :

- une base D1 traite les requêtes séquentiellement ; les requêtes longues et scans complets doivent être évités ;
- les recherches géospatiales ou sémantiques avancées ne doivent pas être promises en V1 ;
- les projections et index augmentent les écritures, donc doivent répondre à des vues cockpit réelles ;
- la restauration fournisseur ne remplace pas des exports portables chiffrés et des tests de restauration ;
- les migrations doivent suivre `expand → backfill → bascule → contract`, jamais une réécriture brutale.

Sources techniques vérifiées le 18 août 2026 : [limites D1](https://developers.cloudflare.com/d1/platform/limits/), [tarification D1](https://developers.cloudflare.com/d1/platform/pricing/), [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/), [clés étrangères](https://developers.cloudflare.com/d1/sql-api/foreign-keys/), [migrations](https://developers.cloudflare.com/d1/reference/migrations/) et [SQL/FTS5](https://developers.cloudflare.com/d1/sql-api/sql-statements/).

### Option B — introduire une autre base

Non retenue maintenant. PostgreSQL ou une base spécialisée deviendrait justifiable seulement avec des mesures montrant au moins un de ces besoins : forte concurrence multi-utilisateur, reporting/BI externe lourd, réplication complexe, géospatial avancé, recherche sémantique opérationnelle ou volume dépassant durablement les capacités D1.

L’introduire dès maintenant créerait une double gestion des identités, secrets, migrations, sauvegardes, coûts et incidents sans valeur utilisateur prouvée.

### Critères de réévaluation

Mesurer avant de changer : volume par table, lignes lues/écrites, latence p95 des vues cockpit, erreurs de surcharge, taille D1, durée des exports et temps de restauration. Une réévaluation est déclenchée par une limite mesurée, pas par une hypothèse.

## Sécurité et confidentialité

### Séparation public / privé

- héberger de préférence le cockpit sur un sous-domaine privé dédié, protégé intégralement par Cloudflare Access ;
- à défaut, protéger explicitement `/cockpit/*` et `/api/cockpit/*`, en vérifiant que les routes plus spécifiques héritent de la bonne politique ;
- limiter l’accès initial à l’identité de Mouaad, refus par défaut ;
- valider côté serveur la signature JWT via JWKS Access, issuer/team domain, audience, `exp`, `nbf`, sujet et identité autorisée ; ne jamais faire confiance à un simple header email ;
- protéger les endpoints serveur, pas seulement les pages ;
- ne générer aucune donnée client dans un fichier statique, le HTML public, les props hydratées ou les analytics ;
- appliquer `X-Robots-Tag: noindex, nofollow, noarchive` et une directive robots en défense secondaire, jamais comme contrôle d’accès ;
- conserver les secrets uniquement dans les variables/bindings Cloudflare.

Cloudflare Access peut protéger un hostname ou un chemin et applique une politique deny-by-default lorsqu’il est configuré comme application privée : [application paths](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/) et [self-hosted applications](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/).

### Actions sensibles à auditer

- consultation d’un dossier complet ;
- export avec coordonnées ;
- fusion de personnes ou de biens ;
- confirmation d’un critère ;
- validation ou envoi d’un rapprochement ;
- modification d’un consentement ;
- modification des termes, répartitions ou trois états d’un Accord TIM ;
- constatation d’un montant dû, enregistrement ou correction d’un paiement TIM ;
- formalisation, signature ou indication de téléchargement OMEGA ;
- suppression, pseudonymisation ou restauration ;
- changement de politique de conservation.

Le journal contient acteur, action, cible, date, résultat et identifiant de corrélation. Il ne duplique ni message brut, ni secret, ni données financières détaillées.

### Conservation, export et suppression

- politiques configurables par catégorie et finalité ;
- export dossier avant suppression lorsque demandé ;
- gel temporaire pendant une opération d’export/suppression ;
- purge de la donnée métier et pseudonymisation du journal minimal lorsque légalement possible ;
- aucune durée définitive n’est inventée en Phase 1 : elle doit être validée métier/juridiquement ;
- sauvegardes et exports chiffrés restent hors Git.

La politique inventorie aussi Time Travel/sauvegardes, fichiers temporaires, Resend/Formspree, boîte email et futurs sous-traitants : responsable, TTL, capacité d’effacement et limite connue. Après une restauration, un registre minimal non identifiant des effacements doit être rejoué avant remise en service.

## Yanport

Il n’y a ni API ni synchronisation Yanport dans cette phase. Un export opérationnel est produit depuis une `search_revision` et contient deux niveaux :

1. **Filtres de découverte** : zones, communes, fourchettes de budget/surface/type/DPE volontairement assez larges pour ne pas perdre une exception utile.
2. **Filtres humains LEVOIS** : critères souples, conditions, exclusions, inconnues et points à vérifier manuellement.

Chaque export porte un identifiant, une date, la révision source et les élargissements appliqués. Une notion qualitative comme « excellent agencement » ne devient jamais un faux filtre automatique.

## Obsidian

Obsidian reste la mémoire longue et stratégique ; D1 reste la source opérationnelle. L’export Markdown doit pouvoir produire :

- fiche client et coordonnées selon le mode d’export ;
- projets et relations entre projets ;
- recherche et révision utilisée ;
- historique des critères et décisions ;
- annonces, évaluations et visites ;
- interactions résumées ;
- tâches et prochaine action ;
- Accords TIM dans une section distincte, avec parties, termes, trois états, échéances et montants selon le mode d’export ;
- enseignements LEVOIS Lab.

Le fichier utilise des identifiants stables en front matter, un horodatage, un manifeste et éventuellement un hash. Un futur script local peut déposer ou mettre à jour des blocs gérés dans le vault. Cloudflare ne reçoit aucun accès direct au chemin local du vault.

## Cas pilotes utilisés pour valider l’architecture

- un acquéreur entièrement fictif, projet de retraite et résidence principale autour de Chartres, avec scénarios préférés et conditionnels, critères confirmés et questions `to_confirm` ;
- un vendeur générique sans identité ni adresse exacte, couvrant bien, commercialisation, mandat, diagnostics, signaux, visites, offres et tâches ;
- un Accord TIM fictif d’envoi d’information lié à une vente, avec deux conseillers anonymes, termes explicitement enregistrés et trois états indépendants.

Le détail des pilotes se trouve dans `DATA_MODEL.md`. Aucune donnée réelle n’est utilisée.

## Arbitrages nécessaires avant implémentation

1. stades propres à chaque type de projet et définition d’un dossier actif ;
2. règles qui transforment importance, flexibilité et certitude en critère dur ;
3. finalités et durées de conservation ;
4. base des honoraires TIM (HT/TTC), devise et règle d’arrondi ;
5. fait générateur exact du montant dû, notamment hors vente 20/80 ;
6. paiements TIM partiels, multiples, corrigés ou annulés après versement ;
7. preuve métier attendue pour `signed` et `uploaded_to_omega` ;
8. gestion d’un foyer/couple et des coordonnées partagées ;
9. règles de déduplication des personnes, biens et annonces ;
10. format opérationnel Yanport réellement utilisé ;
11. politique de conflit du futur pont Obsidian ;
12. sous-domaine privé ou routes protégées pour le cockpit ;
13. éventuels futurs utilisateurs autres que Mouaad et leurs droits ;
14. règle de suppression quand une obligation professionnelle impose une trace minimale, y compris pour les accords et paiements TIM.
