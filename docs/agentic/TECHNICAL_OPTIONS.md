# Options techniques et connecteurs

## 1. Objet

Ce document compare trois architectures conceptuelles pour le futur LEVOIS Agentic Company OS et inventorie les intégrations envisagées. Il ne sélectionne aucun fournisseur de modèle, ne confirme aucune API non vérifiée et n'autorise aucune connexion.

## 2. Contraintes de décision

L'architecture doit :

- rester utile pour 5 à 20 dossiers actifs ;
- préserver D1 comme autorité métier et le cockpit comme surface humaine ;
- être utilisable depuis un iPhone pour consulter, approuver, refuser ou mettre en pause ;
- laisser les opérations manuelles disponibles sans IA ;
- minimiser les copies de données clients ;
- permettre des missions lourdes sans exposer tout le système ;
- rendre chaque action, coût, source et approbation traçable ;
- ne pas dépendre d'une API Yanport ou d'un connecteur non confirmé ;
- permettre un arrêt global immédiat et une reprise après incident ;
- éviter une plateforme multi-agents surdimensionnée.

## 3. Option A : orchestration cloud intégrée

### 3.1 Forme conceptuelle

```text
site / cockpit
      |
Cloudflare Access + BFF
      |
 D1 + événements
      |
Workers / files / planifications / workflows
      |
APIs de modèles et connecteurs externes
```

Les composants cloud gèrent données, déclencheurs, files, états de mission, exécutions, approbations et appels externes.

### 3.2 Forces

- disponibilité continue sans ordinateur personnel allumé ;
- bonne consultation et approbation depuis iPhone ;
- planifications et reprises plus simples à centraliser ;
- observabilité et contrôle d'accès cohérents avec Cloudflare Access ;
- événements proches de la source D1 ;
- faible friction pour les tâches courtes et déterministes.

### 3.3 Faiblesses

- davantage de données sensibles transitent par des services distants ;
- missions longues, fichiers locaux et pont Obsidian plus difficiles ;
- dépendance à plusieurs offres cloud et à leurs limites d'exécution ;
- risque d'empiler queue, workflow, cron et fonctions avant que le volume le justifie ;
- gestion des secrets et connecteurs plus étendue ;
- coût permanent potentiel, même pour un faible volume ;
- panne cloud ou mauvaise configuration peut affecter toute l'organisation agentique.

### 3.4 Profil de risque

- **Sécurité** : bonne frontière réseau possible, surface distante plus large.
- **Confidentialité** : correcte si minimisation stricte, moins adaptée aux sources locales privées.
- **Résilience** : haute disponibilité possible, dépendance cloud concentrée.
- **Maintenance** : moyenne à élevée selon le nombre de composants.
- **Autonomie** : forte pour tâches planifiées ; risque de sur-autonomisation.
- **Reprise** : exige idempotence, file d'échec, réconciliation et procédure de restauration.

## 4. Option B : runtime agentique local

### 4.1 Forme conceptuelle

```text
ordinateur autorisé
  runtime local
    |-- dépôt Git
    |-- pont Obsidian
    |-- fichiers explicitement sélectionnés
    `-- vues/commandes bornées vers le cockpit
```

Les missions sont lancées depuis une machine contrôlée. Le cockpit reste l'autorité, mais l'orchestration et une partie du journal vivent localement ou sont synchronisées par commandes bornées.

### 4.2 Forces

- contrôle direct des fichiers et du pont Obsidian ;
- contexte privé pouvant rester local si aucun modèle distant n'est appelé ;
- environnements et missions lourdes plus flexibles ;
- arrêt physique simple ;
- coût d'infrastructure permanent réduit ;
- bonne solution de prototypage et d'évaluation sur données fictives.

### 4.3 Faiblesses

- indisponible lorsque la machine est éteinte, hors ligne ou verrouillée ;
- approbation et supervision depuis iPhone limitées sans control plane distant ;
- sauvegarde, mise à jour et reprise plus fragiles ;
- risque de secrets ou copies de données dispersés localement ;
- planifications dépendantes d'une machine personnelle ;
- traçabilité difficile si des actions contournent le cockpit ;
- concurrence et synchronisation à gérer entre état local et D1.

### 4.4 Profil de risque

- **Sécurité** : surface réseau réduite, risque poste local et fichiers plus élevé.
- **Confidentialité** : favorable pour fichiers locaux, dépend encore du fournisseur de modèle.
- **Résilience** : faible sans redondance ; bon mode manuel de secours.
- **Maintenance** : simple au départ, fragile si elle devient une infrastructure permanente.
- **Autonomie** : limitée par la présence de la machine.
- **Reprise** : dépend de journaux exportés, checkpoints et synchronisation explicite.

## 5. Option C : architecture hybride

### 5.1 Forme conceptuelle

```text
                         +----------------------+
site / parcours -------->| D1 + événements      |
                         | cockpit + approbation|
                         | control plane léger  |
                         +----------+-----------+
                                    |
                         mission + droits bornés
                                    |
                    +---------------+----------------+
                    |                                |
             exécution cloud courte          runtime isolé/local
             contrôle, rappels, état          analyse lourde, fichiers,
             et tâches déterministes          pont Obsidian, production
                    |                                |
                    +---------------+----------------+
                                    |
                              propositions
                                    |
                           file d'approbation
```

Le cloud conserve l'état durable, les événements, les approbations, les budgets, les politiques et les tâches courtes. Le runtime local ou isolé ne reçoit que des missions lourdes explicitement autorisées et renvoie des propositions. Aucun état local n'est une vérité métier.

### 5.2 Forces

- accès mobile au briefing, aux approbations et au kill switch ;
- données et gouvernance centralisées sans forcer toutes les sources dans le cloud ;
- missions lourdes et pont Obsidian possibles ;
- séparation des secrets et blast radius réduit ;
- mode manuel conservé si le runtime local ou le modèle tombe ;
- activation progressive : le control plane peut fonctionner avant tout runtime lourd ;
- possibilité de choisir cloud ou local par classification de donnée et coût.

### 5.3 Faiblesses

- architecture la plus exigeante en contrats, versions et observabilité ;
- synchronisation et état inconnu après interruption locale ;
- deux environnements à maintenir et sécuriser ;
- demande une procédure stricte de reprise et de révocation ;
- risque de devenir complexe si les missions sont réparties sans règle simple.

### 5.4 Règle de placement

| Type de capacité | Placement recommandé |
|---|---|
| Validation, déduplication technique, contrôle de fraîcheur | Déterministe au plus près de D1 |
| Détection de retard ou dossier sans prochaine action | Cloud court, sans modèle si possible |
| Briefing à partir de vues structurées | Cloud ou local selon fournisseur, proposition uniquement |
| Analyse longue de plusieurs documents explicitement choisis | Runtime isolé/local |
| Pont Obsidian | Local, unidirectionnel et déclenché |
| Publication, email, SMS, rendez-vous | Préparé ; déclenchement humain via connecteur contrôlé |
| Paiement, migration, déploiement, effacement | Processus humain distinct, jamais agentique autonome |

## 6. Comparaison structurée

Notation qualitative : 1 = faible, 5 = favorable. La colonne « Poids » exprime la criticité, pas un coefficient arithmétique. Aucun total n’est calculé : l’absence de poids numériques validés rendrait un score global artificiel. Les notes expriment l'adéquation à LEVOIS, pas une vérité universelle.

| Critère | Poids | A Cloud | B Local | C Hybride | Commentaire |
|---|---:|---:|---:|---:|---|
| Sécurité par moindre privilège | Élevé | 4 | 3 | 5 | L'hybride réduit la portée si les contrats restent simples |
| Confidentialité | Élevé | 3 | 4 | 5 | Placement par classification et contexte minimal |
| Coût à faible volume | Élevé | 3 | 4 | 4 | Cloud léger + runtime à la demande |
| Disponibilité | Élevé | 5 | 2 | 4 | Le control plane reste disponible sans runtime local |
| Maintenance | Élevé | 3 | 3 | 2 | L'hybride exige plus de discipline ; d'où une V1 réduite |
| Autonomie bornée | Moyen | 5 | 2 | 4 | Les tâches courtes peuvent rester cloud |
| Accès iPhone | Élevé | 5 | 1 | 5 | Approbations dans le cockpit cloud |
| Résilience | Élevé | 4 | 2 | 5 | Dégradation partielle et mode manuel |
| Mémoire stratégique locale | Moyen | 2 | 5 | 5 | Pont Obsidian local sans accès cloud au vault |
| Contrôle humain | Élevé | 4 | 4 | 5 | Approbation centrale et exécution séparée |
| Difficulté initiale | Élevé | 3 | 4 | 2 | À compenser par un incrément très étroit |
| Dépendance fournisseur | Moyen | 2 | 4 | 4 | Adaptateurs et placement flexible |
| Reprise après incident | Élevé | 4 | 2 | 4 | Réconciliation obligatoire entre cloud et local |

## 7. Recommandation

**Retenir l'option C comme architecture cible, avec une première tranche cloud-only et hybrid-ready.**

Le premier incrément est un monolithe modulaire D1/cockpit/control plane avec une interface abstraite de runner. Il ne nécessite ni transport/synchronisation locale, ni runtime local permanent, ni queue complexe, ni connecteurs externes. Il nécessite : missions, politiques, journal, approbations, coûts, lecture bornée et briefing préparé. Le runtime local apparaît uniquement lorsque l'analyse de fichiers, le pont Obsidian ou une mission lourde apporte une valeur mesurée.

Cette séquence évite deux erreurs : centraliser trop tôt des données privées dans le cloud, ou faire dépendre l'exploitation quotidienne d'un ordinateur personnel.

## 8. Topologie de reprise

```text
runtime local indisponible
  -> mission visible comme bloquée
  -> aucun état métier modifié
  -> Mouaad continue dans le cockpit
  -> reprise ou annulation explicite

cloud agentique indisponible
  -> cockpit métier manuel conservé
  -> planifications suspendues
  -> aucun envoi externe rejoué
  -> réconciliation avant redémarrage

fournisseur de modèle indisponible
  -> traitement déterministe continue
  -> brouillons et analyses passent en attente
  -> aucune donnée inventée
```

## 9. Inventaire des connecteurs

Les statuts décrivent uniquement la connaissance au commit de référence. « Futur » signifie non construit ; « à vérifier » signifie que disponibilité, contrat ou API ne sont pas établis.

### 9.1 Cockpit et D1

| Champ | Décision documentaire |
|---|---|
| Usage | Source de vérité opérationnelle, vues privées, commandes et approbations futures |
| Lecture | Vues BFF minimisées, paginées, par capability et objet |
| Écriture | Commandes métier nommées ; jamais SQL direct par agent |
| Authentification | Cloudflare Access + identité serveur vérifiée |
| Secrets | Bindings serveur, aucun secret navigateur ou modèle |
| Permissions | Champ et objet minimaux par mission |
| Autonomie autorisée | Interne faible risque seulement après tests ; aucune mutation confirmée silencieuse |
| Validation humaine | Toute donnée confirmée ou action sensible |
| Journalisation | Commande, acteur, cible, version, corrélation, résultat |
| Rétention | Selon politique D1 à décider |
| Coût | Cloudflare/D1 à mesurer |
| Limites | Schéma agentique non créé ; faible concurrence à réévaluer par mesure |
| Fallback | Cockpit manuel et exports contrôlés |
| Statut | Socle disponible ; capacités agentiques futures |

### 9.2 GitHub

| Champ | Décision documentaire |
|---|---|
| Usage | Mémoire produit : code, docs, ADR, prompts, tests, issues et revues |
| Lecture | Dépôt et éléments explicitement autorisés |
| Écriture | Proposition de ticket ou branche ; push/merge selon workflow humain distinct |
| Authentification | Identité technique dédiée ou session humaine, à choisir |
| Secrets | Token à portée dépôt, serveur/local sécurisé |
| Permissions | Lecture par défaut ; écriture minimale et branche protégée |
| Autonomie autorisée | Aucune publication ou merge V1 |
| Validation humaine | Commit, push, PR, merge, release et changement de workflow |
| Journalisation | Mission, diff, commit, approbation et acteur |
| Rétention | Historique Git et politique de l'hébergeur |
| Coût | Offre et consommation à vérifier |
| Limites | Ne pas stocker PII, médias privés ou secrets |
| Fallback | Git local et création manuelle |
| Statut | Disponible pour le dépôt ; usage agentique futur |

### 9.3 Gmail

| Champ | Décision documentaire |
|---|---|
| Usage | Source explicitement sélectionnée et brouillons de suivi |
| Lecture | Message ou conversation choisis ; jamais boîte entière silencieuse |
| Écriture | Brouillon uniquement avant déclenchement humain |
| Authentification | OAuth et scopes minimaux, à vérifier |
| Secrets | Jetons chiffrés côté serveur ou coffre local, rotation/révocation |
| Permissions | Lecture ciblée, création de brouillon ; envoi exclu V1 |
| Autonomie autorisée | Aucune action externe |
| Validation humaine | Lecture de contenu sensible et tout envoi |
| Journalisation | Référence opaque, action, date, sans corps ni adresse |
| Rétention | Copie minimale et temporaire ; politique à décider |
| Coût | API/Workspace à vérifier |
| Limites | Connecteur, quotas, conformité et accès disponibles à vérifier |
| Fallback | Copie manuelle d'un extrait autorisé et brouillon manuel |
| Statut | Futur / à vérifier |

### 9.4 Google Calendar

| Champ | Décision documentaire |
|---|---|
| Usage | Lire disponibilités minimales et préparer un rendez-vous |
| Lecture | Créneaux libre/occupé, pas les calendriers complets par défaut |
| Écriture | Événement préparé puis créé par action humaine |
| Authentification | OAuth à scopes minimaux, à vérifier |
| Secrets | Jeton serveur sécurisé et révocable |
| Permissions | Free/busy puis création ciblée si validée |
| Autonomie autorisée | Rappel interne seulement ; aucune invitation autonome |
| Validation humaine | Participants, horaire, lieu, texte et envoi |
| Journalisation | Référence événement, décision et résultat, sans description privée |
| Rétention | Référence nécessaire au suivi, pas de copie complète |
| Coût | À vérifier |
| Limites | Fuseaux, doublons, annulations et disponibilité du connecteur |
| Fallback | Vérification et création manuelles |
| Statut | Futur / à vérifier |

### 9.5 Google Drive

| Champ | Décision documentaire |
|---|---|
| Usage | Lire ou déposer un document explicitement sélectionné |
| Lecture | Fichier ou dossier allowlisté, jamais recherche globale |
| Écriture | Version ou export approuvé dans un emplacement borné |
| Authentification | OAuth/service account selon gouvernance, à vérifier |
| Secrets | Serveur sécurisé, scopes minimaux |
| Permissions | Lecture seule par défaut, expiration des partages |
| Autonomie autorisée | Aucune écriture V1 |
| Validation humaine | Toute copie, partage ou export sensible |
| Journalisation | ID opaque, hash, action et approbation |
| Rétention | Selon document et Drive ; inventaire d'effacement requis |
| Coût | À vérifier |
| Limites | Partages hérités, droits externes, formats et quotas |
| Fallback | Sélection et dépôt manuels |
| Statut | Futur / à vérifier |

### 9.6 Obsidian via pont local

| Champ | Décision documentaire |
|---|---|
| Usage | Doctrine, décisions durables et snapshots Markdown |
| Lecture | Dossiers explicitement autorisés ; doctrine versionnée |
| Écriture | Export unidirectionnel avec manifeste, date et hash |
| Authentification | Identité locale + capability de chemin |
| Secrets | Aucun secret dans le vault ou les exports |
| Permissions | Racine bornée, lecture seule par défaut, écriture ciblée |
| Autonomie autorisée | Export interne réversible après validation de la politique |
| Validation humaine | Nouveau type d'export, PII, suppression ou remplacement |
| Journalisation | Chemin logique, hash, version et résultat |
| Rétention | Politique du vault et inventaire d'effacement |
| Coût | Local, stockage et maintenance |
| Limites | Machine disponible, conflits et restauration |
| Fallback | Export Markdown manuel |
| Statut | Manuel ; pont futur |

### 9.7 DVF

| Champ | Décision documentaire |
|---|---|
| Usage | Repères historiques locaux, calculs et fraîcheur |
| Lecture | Jeu versionné et sources officielles |
| Écriture | Construction déterministe de dérivés, jamais modification source |
| Authentification | Selon source publique officielle |
| Secrets | Aucun attendu, à vérifier par source |
| Permissions | Lecture |
| Autonomie autorisée | Vérification et calcul déterministes |
| Validation humaine | Interprétation client, estimation ou conclusion commerciale |
| Journalisation | Version, source, période, géographie et limites |
| Rétention | Selon licence et politique de versionnage |
| Coût | Téléchargement, stockage et calcul |
| Limites | Passé, délais, géocodage, qualité et absence de demande actuelle |
| Fallback | Dernière version valide marquée périmée ou absence de résultat |
| Statut | Disponible dans le socle |

### 9.8 Yanport par export manuel

| Champ | Décision documentaire |
|---|---|
| Usage | Fiche de recherche et exports/imports explicitement opérés |
| Lecture | Fichier exporté manuellement et figé |
| Écriture | Fichier préparé ; dépôt ou import manuel |
| Authentification | Session humaine Yanport hors agent |
| Secrets | Aucun identifiant Yanport transmis à l'agent |
| Permissions | Fichier sélectionné uniquement |
| Autonomie autorisée | Préparation interne d'un export |
| Validation humaine | Contenu, destinataire et import |
| Journalisation | Version de recherche, hash du fichier, date et opérateur |
| Rétention | Export temporaire selon finalité |
| Coût | Abonnement et temps manuel à mesurer |
| Limites | Aucune API supposée ; export isolé != historique complet |
| Fallback | Saisie ou export manuel |
| Statut | Manuel |

### 9.9 Resend

| Champ | Décision documentaire |
|---|---|
| Usage | Notifications applicatives existantes et, plus tard, messages approuvés |
| Lecture | Statut de livraison minimal si disponible et autorisé |
| Écriture | Envoi par contrat applicatif nommé |
| Authentification | Clé serveur et domaine configuré |
| Secrets | Binding serveur, jamais agent/modèle |
| Permissions | Templates et destinataires autorisés |
| Autonomie autorisée | Aucune communication sensible ; notifications techniques à cadrer |
| Validation humaine | Tout message client personnalisé ou campagne |
| Journalisation | Template/version, référence destinataire opaque, statut, sans contenu |
| Rétention | Selon fournisseur et politique à vérifier |
| Coût | À mesurer selon offre |
| Limites | Délivrabilité, quotas, suppression fournisseur, état inconnu |
| Fallback | Brouillon puis envoi humain ou contact manuel |
| Statut | Disponible pour des parcours actuels ; extension future |

### 9.10 PostHog

| Champ | Décision documentaire |
|---|---|
| Usage | Analytics produit agrégés et privacy-first |
| Lecture | Agrégats, jamais source métier |
| Écriture | Événements non identifiants et URL nettoyée |
| Authentification | Clés distinctes selon usage, configuration existante |
| Secrets | Aucun secret serveur exposé au navigateur |
| Permissions | Projet analytics uniquement |
| Autonomie autorisée | Émission d'événements conformes au contrat validé |
| Validation humaine | Nouveau type d'événement ou donnée |
| Journalisation | Version du plan de tracking |
| Rétention | Paramètres fournisseur à vérifier/décider |
| Coût | Offre à mesurer |
| Limites | Pas de replay, heatmap, autocapture ou profil client dans la doctrine actuelle |
| Fallback | Mesure serveur agrégée ou absence de métrique |
| Statut | Disponible |

### 9.11 Cloudflare

| Champ | Décision documentaire |
|---|---|
| Usage | Pages, Functions, D1, Access et future orchestration légère |
| Lecture | Configuration et métriques autorisées |
| Écriture | Déploiement/configuration par processus humain distinct |
| Authentification | Access, tokens de compte à scopes minimaux |
| Secrets | Bindings/variables serveur |
| Permissions | Par environnement et ressource |
| Autonomie autorisée | Aucune administration ou déploiement agentique V1 |
| Validation humaine | D1, DNS, Access, secret, déploiement, queue ou planification |
| Journalisation | Audit fournisseur + journal Git/mission |
| Rétention | Selon service, à vérifier |
| Coût | À mesurer par produit |
| Limites | Quotas, runtime, localisation et restauration selon offre |
| Fallback | Mode manuel, export et rollback documenté |
| Statut | Socle disponible ; fonctions agentiques futures |

### 9.12 Réseaux sociaux

| Champ | Décision documentaire |
|---|---|
| Usage | Distribution de contenus approuvés |
| Lecture | Performance agrégée et commentaires explicitement sélectionnés |
| Écriture | Publication préparée, déclenchée humainement |
| Authentification | Sessions ou APIs par canal, existence à vérifier |
| Secrets | Jetons séparés, révocables et hors modèle |
| Permissions | Compte/canal et type d'action bornés |
| Autonomie autorisée | Aucune publication ou réponse V1 |
| Validation humaine | Texte, média, chiffres, CTA, timing et réponse |
| Journalisation | Version du contenu, canal, approbation et URL publiée |
| Rétention | Données de performance minimales, selon canal |
| Coût | Outils et média éventuel à décider |
| Limites | APIs, règles, droits médias, commentaires sensibles et dépendance plateforme |
| Fallback | Publication et collecte manuelles |
| Statut | Manuel / à vérifier par canal |

### 9.13 Bibliothèque média

| Champ | Décision documentaire |
|---|---|
| Usage | Originaux, dérivés, droits, usages, restrictions et performances |
| Lecture | Métadonnées et dérivés autorisés selon mission |
| Écriture | Proposition de sélection ou métadonnée ; fichier original hors Git |
| Authentification | Stockage et identité à décider |
| Secrets | Accès stockage côté serveur/local |
| Permissions | Par asset, droit et usage |
| Autonomie autorisée | Contrôle de complétude et alerte d'expiration |
| Validation humaine | Droit, visage, domicile, marque, publication et suppression |
| Journalisation | ID asset, provenance, droit, décision et usage |
| Rétention | Contrat, droit et politique à décider |
| Coût | Stockage, transcodage et outils |
| Limites | Provenance incomplète de nombreux assets actuels |
| Fallback | Sélection manuelle d'assets vérifiés |
| Statut | Audit disponible ; bibliothèque gouvernée future |

### 9.14 HeyGen

| Champ | Décision documentaire |
|---|---|
| Usage | Production d'un brouillon vidéo après validation éditoriale |
| Lecture | Script, assets autorisés et statut d'une mission approuvée |
| Écriture | Génération d'un brouillon vidéo |
| Authentification | Clé fournisseur serveur/local, capacité disponible à vérifier |
| Secrets | Jamais dans Git, prompt ou journal |
| Permissions | Projet et mission bornés, crédits plafonnés |
| Autonomie autorisée | Aucune consommation de crédits V1 |
| Validation humaine | Script, avatar/voix, assets, droits, coût et lancement |
| Journalisation | Fournisseur, version, paramètres non sensibles, coût et résultat |
| Rétention | Contrat fournisseur et fichiers générés à vérifier |
| Coût | Crédits et stockage, plafond obligatoire |
| Limites | Droits avatar/voix, cohérence de marque, qualité, disponibilité et dépendance fournisseur |
| Fallback | Production manuelle ou format sans génération |
| Statut | Manuel / futur ; capacité et contrat à vérifier |

### 9.15 ElevenLabs

| Champ | Décision documentaire |
|---|---|
| Usage | Génération d'un brouillon vocal après validation du texte et des droits |
| Lecture | Script approuvé, paramètres de voix autorisés et statut de mission |
| Écriture | Génération d'un fichier audio brouillon |
| Authentification | Clé fournisseur serveur/local, capacité disponible à vérifier |
| Secrets | Jamais dans Git, prompt ou journal |
| Permissions | Projet, voix et mission bornés, crédits plafonnés |
| Autonomie autorisée | Aucune consommation de crédits V1 |
| Validation humaine | Texte, voix, droits, prononciation, coût et lancement |
| Journalisation | Fournisseur, version, paramètres non sensibles, coût et résultat |
| Rétention | Contrat fournisseur, voix et fichiers générés à vérifier |
| Coût | Crédits, durée audio et stockage, plafond obligatoire |
| Limites | Droits de voix, qualité, prononciation, disponibilité et dépendance fournisseur |
| Fallback | Enregistrement humain ou format sans voix générée |
| Statut | Manuel / futur ; capacité et contrat à vérifier |

### 9.16 Transcription

| Champ | Décision documentaire |
|---|---|
| Usage | Transcrire un audio explicitement fourni avec consentement et finalité |
| Lecture | Fichier unique autorisé |
| Écriture | Transcription temporaire puis propositions granulaires |
| Authentification | Fournisseur/local à décider |
| Secrets | Serveur/local sécurisé |
| Permissions | Fichier, langue, durée et mission bornés |
| Autonomie autorisée | Aucune ingestion automatique d'appels |
| Validation humaine | Consentement, envoi fournisseur, corrections et extraction métier |
| Journalisation | Hash, durée, fournisseur, coût, statut ; aucun texte |
| Rétention | Audio et transcription avec expiration courte à décider |
| Coût | Minute audio, calcul et stockage |
| Limites | Erreurs, locuteurs, bruit, données sensibles, contrat fournisseur |
| Fallback | Compte rendu humain structuré |
| Statut | Futur / fournisseur à décider |

### 9.17 Fournisseur de modèles

| Champ | Décision documentaire |
|---|---|
| Usage | Classification, extraction, synthèse et rédaction bornées |
| Lecture | Contexte minimisé et explicitement autorisé |
| Écriture | Sortie structurée vers zone de proposition uniquement |
| Authentification | Clé serveur par environnement et budget |
| Secrets | Jamais exposés à l'agent, au contexte ou au client |
| Permissions | Aucun outil implicite ; outil allowlisté par mission |
| Autonomie autorisée | Analyse/proposition ; actions selon matrices, jamais sensible |
| Validation humaine | Toute vérité métier, action externe et décision sensible |
| Journalisation | Fournisseur, modèle/version, politique, coût, latence, résultat de forme |
| Rétention | Zéro entraînement/rétention ou garanties acceptées à vérifier contractuellement |
| Coût | Tokens/appels/outils, budget imbriqué |
| Limites | Hallucination, refus, sortie invalide, disponibilité, région, changement de modèle |
| Fallback | Déterministe ou humain ; fournisseur alternatif après évaluation |
| Statut | Non sélectionné |

### 9.18 SMS

| Champ | Décision documentaire |
|---|---|
| Usage | Préparer un message court de suivi lorsque ce canal est approprié et autorisé |
| Lecture | Statut de livraison minimal seulement si un fournisseur futur le permet |
| Écriture | Brouillon privé ; envoi déclenché manuellement par Mouaad |
| Authentification | Fournisseur et méthode non sélectionnés ; à vérifier |
| Secrets | Jeton serveur séparé et révocable si un connecteur est retenu |
| Permissions | Destinataire, finalité, template/message et mission bornés |
| Autonomie autorisée | Aucune émission, réponse ou retry externe |
| Validation humaine | Destinataire, numéro, texte, horaire, consentement/finalité et déclenchement |
| Journalisation | Canal, référence opaque, hash/version, approbation et résultat ; aucun numéro complet |
| Rétention | Copie minimale selon finalité et contrat fournisseur à décider |
| Coût | Message, abonnement et éventuels numéros ; à mesurer |
| Limites | Aucun fournisseur/API confirmé, délivrabilité, opt-out, état externe inconnu |
| Fallback | Message saisi et envoyé manuellement depuis l’outil humain habituel |
| Statut | Futur / fournisseur à sélectionner et vérifier |

### 9.19 OMEGA

| Champ | Décision documentaire |
|---|---|
| Usage | Dépôt professionnel d’un Accord TIM et confirmation humaine de jalons |
| Lecture | Aucune lecture automatisée ; référence ou confirmation explicitement saisie dans le cockpit |
| Écriture | Dépôt effectué manuellement par Mouaad dans OMEGA |
| Authentification | Session humaine hors agent ; aucune API supposée |
| Secrets | Aucun identifiant, cookie ou secret OMEGA transmis au control plane ou au modèle |
| Permissions | L’agent reçoit seulement le statut/référence minimale déjà confirmés dans D1 |
| Autonomie autorisée | Aucune connexion, dépôt, modification ou vérification implicite |
| Validation humaine | Document, parties, termes, dépôt, référence et changement de l’axe Accord TIM |
| Journalisation | Confirmation, date, acteur et référence privée opaque ; aucun document copié dans le journal |
| Rétention | Selon obligations professionnelles et politique TIM à décider |
| Coût | Outil professionnel et temps manuel ; à mesurer séparément des agents |
| Limites | Disponibilité/API/droits non établis ; un brouillon ne prouve jamais un dépôt |
| Fallback | Procédure OMEGA entièrement manuelle, puis saisie de confirmation dans le cockpit |
| Statut | Manuel / système externe à vérifier |

### 9.20 HyperFrames

| Champ | Décision documentaire |
|---|---|
| Usage | Produire ou rendre un brouillon vidéo local après validation du script et des assets |
| Lecture | Script figé, assets autorisés et paramètres de rendu de la mission |
| Écriture | Artefacts de brouillon dans un chemin local borné ; aucune publication |
| Authentification | Runtime local/capability de fichiers ; dépendances ou services éventuels à vérifier |
| Secrets | Aucun secret dans le projet, le prompt, les assets ou le journal |
| Permissions | Chemin, composition, assets, durée et ressources explicitement allowlistés |
| Autonomie autorisée | Aucun lancement V1 ; rendu seulement après validation humaine du coût et du périmètre |
| Validation humaine | Script, design, médias/droits, paramètres, coût, lancement et rendu final |
| Journalisation | Version, composition, hashes d’assets, durée, coût machine et résultat sans donnée client |
| Rétention | Brouillons temporaires et rendus selon bibliothèque média/politique à décider |
| Coût | Temps machine, stockage et éventuels services associés ; plafond par contenu |
| Limites | Outil local, disponibilité machine, droits médias, qualité et aucun connecteur de publication |
| Fallback | Production manuelle, format statique ou absence de vidéo |
| Statut | Manuel / intégration agentique future à vérifier |

## 10. Critères de sélection futurs

Avant d'activer un connecteur ou fournisseur, documenter : besoin réel, statut de l'API, conditions contractuelles, localisation des données, scopes, durée de rétention, export/suppression, coûts, quotas, erreurs, idempotence, sandbox, test d'autorité, runbook, réversibilité et fallback manuel. Une démonstration commerciale ne vaut pas validation d'architecture.
