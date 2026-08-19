# Modèle de menaces — première tranche agentique minimale

Statut : **analyse documentaire Phase A0 ; aucun contrôle n'est déployé par ce document**.

Date de cadrage : **2026-08-19**.

Décideur et unique autorité de réactivation V1 : **Mouaad**.

## 1. Portée et hypothèses

Le système étudié est la future Phase A1 cloud-only décrite dans ce pack :

- `OPS-01` applique sept règles déterministes sur une projection D1 minimisée ;
- `COS-01` déduplique, ordonne et compose 0 à 7 items ;
- le control plane suit deux types de mission, un journal et trois portées de kill switch ;
- les sorties sont des observations L0 sans mutation métier ;
- aucun modèle, prompt, connecteur, réseau sortant, email, SMS, publication, paiement ou action externe n'est autorisé ;
- le cockpit manuel reste un chemin indépendant ;
- seules des fixtures fictives sont admises tant que les gates réelles ne sont pas levées.

Types de mission fermés :

- `ops.shadow_scan.v1` ;
- `cos.daily_briefing.v1`.

Le modèle ne couvre pas un runtime local, `BUY-01` actif, les sept autres rôles, Gmail, Calendar, Obsidian, Yanport, OMEGA, un fournisseur de modèle ou une action externe. Toute introduction de l'un de ces éléments exige une nouvelle analyse de menace.

## 2. Objectifs de sécurité

Par ordre de priorité :

1. **intégrité métier** — aucune sortie agentique ne modifie une vérité D1 ;
2. **continuité humaine** — aucune panne agentique ne bloque le cockpit ;
3. **autorité** — Mouaad seul arrête, réactive ou approuve en V1 ;
4. **confidentialité** — aucune PII inutile, aucun montant TIM et aucun secret dans snapshot, résultat ou trace ;
5. **fraîcheur** — un résultat stale ne peut pas être affiché comme courant ;
6. **traçabilité** — toute mission est reconstructible sans log fournisseur ;
7. **bornage** — budget absent, timeout absent ou capability inconnue ferment l'admission ;
8. **explicabilité** — chaque priorité cite une règle, une source, une date et une action humaine suggérée ;
9. **réversibilité** — couper la couche agentique rend immédiatement le système `manual_only` sans effacer le métier.

## 3. Actifs à protéger

| Actif | Pourquoi il compte | Autorité |
|---|---|---|
| Agrégats D1 métier | personnes, projets, tâches, interactions, Accords TIM et décisions | commandes métier humaines existantes |
| Identité Access de Mouaad | commande les switches et les surfaces privées | fournisseur d'identité + validation serveur |
| Projection `OpsSnapshotV1` | conditionne couverture et faux positifs/négatifs | service déterministe de lecture |
| Watermark et versions | empêchent un ancien constat de paraître courant | D1/projection déterministe |
| Missions et trace | prouvent l'exécution, l'arrêt, le coût et l'erreur | control plane, non souverain métier |
| Findings OPS | preuve shadow datée, non état métier | mission `OPS-01` |
| Items COS | briefing dérivé et révocable | mission `COS-01` |
| Kill switches | arrêt global, par agent ou capacité | Mouaad uniquement |
| Budget et timeout | empêchent boucle et charge non bornée | politique déterministe validée |
| Disponibilité du cockpit | permet de travailler sans agent | cockpit/BFF/D1 métier |

## 4. Acteurs et capacités hostiles

| Acteur ou panne | Capacité supposée | Ce qu'il ne faut pas lui permettre |
|---|---|---|
| Utilisateur non authentifié | appeler une URL privée, rejouer une requête | lire un briefing, lancer une mission ou changer un switch |
| Identité authentifiée autre que Mouaad | posséder une assertion Access valide mais non allowlistée | agir comme approbateur ou réactivateur |
| Fonction de règle défectueuse | produire un faux constat, surconsommer, demander un champ libre | écrire D1 métier, élargir son contexte ou appeler le réseau |
| Exécution retardée | terminer après timeout, kill, restauration ou nouveau snapshot | publier un résultat tardif |
| Fixture hostile | contenir HTML, canari PII, identifiant ambigu ou valeur extrême | contaminer log/rendu ou provoquer une écriture arbitraire |
| Erreur opérateur | double clic, mauvais scope de switch, réactivation prématurée | créer doublon, rouvrir une mission ou donner une autorité implicite |
| Panne D1/control plane | retourner erreur, timeout ou résultat partiel | se faire passer pour une liste vide ou bloquer le cockpit manuel |
| Administrateur de l'environnement | modifier code, bindings ou données avec ses droits propres | être confondu avec une garantie cryptographique du ledger |

Les fonctions `OPS-01` et `COS-01` ne sont pas considérées comme fiables pour l'autorité. Elles sont fiables seulement dans la mesure où leurs entrées, sorties et capacités sont vérifiées par des composants déterministes.

## 5. Frontières de confiance

```text
                 Internet / navigateur
                         │
                 [B1 Cloudflare Access]
                         │ identité vérifiée, Mouaad allowlisté
                         ▼
                 Cockpit privé / BFF
                  │                  │
       chemin manuel                  │ commandes agentiques fermées
                  │                  ▼
                  │        [B2 Admission + switches]
                  │                  │
                  ▼                  ├────────► agent_control_switch
          D1 métier existante        │
                  │                  ▼
                  │         agent_mission / agent_trace
                  │
          [B3 lecture allowlistée]
                  │ aucune écriture
                  ▼
             OpsSnapshotV1
                  │
          [B4 fonctions pures]
             OPS-01 puis COS-01
                  │
          [B5 validation de sortie]
                  │
                  ▼
      findings / briefing items / trace
                  │
          [B6 contrôle watermark]
                  │
                  ▼
          rendu cockpit privé

 Il n'existe aucun B7 vers un modèle, un connecteur ou Internet sortant.
 Il n'existe aucun arc de B4/B5 vers une table métier.
```

### Contrôles attendus par frontière

| Frontière | Contrôles | Échec fermé |
|---|---|---|
| B1 | validation signature, issuer, audience, dates, sujet et identité Mouaad ; Origin/CSRF sur mutation | `403`/`404`, aucun contenu privé |
| B2 | matrice type/agent/capability fixe, budget, timeout, switches, fixture gate | aucune mission assignée |
| B3 | sélection explicite des champs, requêtes préparées, projection cohérente, familles marquées | snapshot rejeté ou partiel non publiable |
| B4 | objets typés, aucun binding D1, aucun `fetch`, aucune fonction d'outil | résultat de forme seulement |
| B5 | schéma fermé, redaction, empreinte, IDs/règles allowlistés | `CP_RESULT_INVALID` ou `CP_PII_POLICY_VIOLATION` |
| B6 | comparaison du watermark et du hash juste avant composition et affichage | briefing stale masqué, fallback manuel |

## 6. Chemin d'arrêt et course concurrente

```text
mission running, fingerprint C17
             │
             ├── Mouaad passe un switch à stopped, version C18
             │          │
             │          ├── nouvelles admissions refusées
             │          ├── mission → cancelled(reason=kill_switch)
             │          └── trace switch + clôture
             │
             └── worker tardif présente C17
                        │ comparaison atomique C17 != C18
                        ▼
                  résultat refusé
                  aucun briefing publié
```

« Immédiatement » signifie pour A1 : avant la prochaine unité bornée de travail et, dans tous les cas, avant toute persistance ou publication de résultat. Il n'existe aucune action externe irréversible à interrompre. Le délai réel entre commande et checkpoint doit être mesuré ; aucune durée n'est inventée dans A0.

Si la mise à jour du switch réussit mais l'annulation d'une mission échoue, le fingerprint périmé suffit à refuser son prochain write. La réconciliation complète ensuite la clôture avec `CP_RECONCILIATION_REQUIRED`. Le cockpit manuel n'attend pas cette réconciliation.

## 7. Registre des menaces

Les niveaux `critique`, `élevé`, `moyen` et `faible` qualifient le risque avant contrôle. Le risque résiduel n'est acceptable que pour les fixtures tant qu'une gate réelle reste ouverte.

| ID | Menace / scénario | Risque | Contrôles obligatoires | Test et preuve | Fallback / résiduel |
|---|---|---|---|---|---|
| `TM-AUTH-01` | appel privé sans Access ou avec une autre identité | critique | validation complète Access, Mouaad allowlisté, deny-by-default, no-store | tests 401/403/404, JWT falsifié/expiré/mauvaise audience | aucune surface ; cockpit exige réauthentification |
| `TM-AUTH-02` | `OPS-01` ou `COS-01` tente d'activer un switch ou de s'accorder une capability | critique | acteur humain obligatoire, matrice type/agent/capability compilée, aucun registre dynamique | requêtes signées par acteur système/agent refusées ; `AC-10`, `AC-14` | mode `manual_only`; incident audité |
| `TM-AUTH-03` | silence, timeout humain ou ancienne approbation interprété comme accord | élevé | aucune approbation consommée en A1 ; champ `approval_ref` non autorisant ; absence = attente/refus | mission `waiting_approval` interdite pour les deux types ; replay d'une ref sans effet | décision directe de Mouaad dans le cockpit |
| `TM-SCOPE-01` | type inconnu, `BUY-01` ou un autre rôle est activé par paramètre libre | élevé | deux types et six capabilities allowlistés ; `BUY-01` sans type admis | fuzz type/agent/capability, inconnu → `CP_CONTRACT_INVALID` | nouvelle phase documentaire avant extension |
| `TM-INTEGRITY-01` | code agentique écrit `project`, `task`, `interaction` ou TIM | critique | `OpsShadowReader` sans écriture ; `AgentControlStore` limité à cinq tables ; règles sans binding D1 | hash/dump des tables métier avant/après succès et échec ; inventaire SQL ; `AC-09` | kill global et rollback de la tranche ; séparation applicative reste un risque résiduel |
| `TM-INTEGRITY-02` | une sortie agentique est prise pour une tâche ou prochaine action métier | élevé | aucune colonne/statut métier dans findings/items ; textes sans commande ; aucun bouton d'exécution | recherche de writes et d'événements métier, tests UI, `AC-09`, `AC-14` | Mouaad utilise les commandes manuelles existantes |
| `TM-INTEGRITY-03` | tâche terminée ou dossier clôturé reste dans un briefing ancien | élevé | snapshot/version/watermark ; revalidation avant COS et affichage ; invalidation du briefing entier | course clôture après scan ; `AC-02`, `AC-03` | masquer briefing et ouvrir « Aujourd'hui » |
| `TM-INTEGRITY-04` | source indisponible est interprétée comme une liste vide, masquant un dossier | élevé | complétude par famille, états `not_evaluated`, `failed`, `ok`, `empty` et `error` distincts | panne d'une famille et égalité des ensembles au watermark ; `AC-01` | briefing non publié, vue manuelle |
| `TM-INTEGRITY-05` | le statut `new` ou `qualifying` est présenté à tort comme « non traité » | élevé | règle intake 004 désactivée sans signal canonique `untriaged` | fixture sans projection : `not_evaluated`, aucun finding | libellé manuel « nouveau / à vérifier » sans affirmation |
| `TM-INTEGRITY-06` | doublon d'événement, double clic ou double scan crée plusieurs missions/items | moyen | clés d'idempotence + hash, contraintes uniques, déduplication fingerprint puis scope | même clé/même hash ; collision autre hash ; multi-règles ; `AC-05` | conflit visible, aucune fusion approximative |
| `TM-INTEGRITY-07` | deux dossiers aux libellés proches sont fusionnés | élevé | groupement uniquement par `(scope_kind, scope_id)`, IDs opaques, jamais similarité textuelle | deux IDs proches et même alias donnent deux items | vérification humaine dans le cockpit |
| `TM-INTEGRITY-08` | date, timezone ou égalité de borne classe mal une échéance | moyen | UTC explicite, `as_of` injecté, bornes Paris réutilisées, opérateurs documentés | tests `=`, juste avant/après, changement heure été/hiver | vue tâches/échéances manuelle |
| `TM-INTEGRITY-09` | incohérence inconnue est « réparée » automatiquement | élevé | unique règle simple 007 ; sortie observation seulement ; aucune commande de réparation | fixture scope terminal avec tâche ouverte `is_next_action=1`, diff métier nul | Mouaad vérifie puis corrige manuellement |
| `TM-RACE-01` | résultat tardif après timeout, kill ou restauration est accepté | critique | tentative, `execution_epoch`, `restore_epoch`, control fingerprint et statut terminal comparés à chaque write | concurrence à chaque checkpoint et écriture tardive ; `AC-10` | résultat rejeté, nouvelle mission après revue |
| `TM-RACE-02` | D1 change entre OPS et COS ou entre COS et affichage | élevé | watermark identique obligatoire aux deux frontières ; aucun scan automatique, toute reprise est une nouvelle mission manuelle corrélée | mutation entre étapes ; aucun run sans nouvelle demande de Mouaad ; `AC-02` | fallback « Aujourd'hui » si instable |
| `TM-PII-01` | surlecture de noms, contacts, notes, montants TIM ou documents | critique | projection par champs allowlistés ; IDs opaques ; parties/montants/textes exclus | canaris fictifs dans chaque colonne exclue ; scan récursif ; `AC-12` | `CP_PII_POLICY_VIOLATION`, kill de capacité |
| `TM-PII-02` | PII fuit dans trace, erreur, métrique ou screenshot | critique | codes fermés, aucun payload/log libre, redaction avant émission, logs serveur minimisés | canaris dans chemin succès/erreur/timeout, scan logs/captures | incident, purge contrôlée selon politique future ; réel bloqué D-008/D-009 |
| `TM-INPUT-01` | texte ou HTML hostile est rendu comme instruction/script | élevé | aucun texte métier dans snapshot ; patrons fermés ; échappement UI ; CSP existante | valeurs `<script>`, Markdown, URLs et instructions de fixture | rejet du champ ou rendu texte neutralisé |
| `TM-COST-01` | budget absent devient illimité ou une boucle consomme D1 | élevé | compteurs finis obligatoires, checkpoints, zéro retry, une tentative, volume fixture borné | absent/nul/négatif/dépassé ; `AC-15` | mission refusée/arrêtée, cockpit manuel |
| `TM-COST-02` | appel modèle/réseau tarifé apparaît indirectement | élevé | aucune capability réseau/modèle, aucun secret, spy `fetch`, coût monétaire `not_applicable` | exécution complète hors réseau, inventaire de dépendances ; `AC-13`, `AC-14` | résultat déterministe local ou pas de briefing |
| `TM-AUDIT-01` | mission dite réussie sans source, tentative, coût ou résultat reconstructible | élevé | trace append-only, séquence unique, hashes/références, succès interdit si journal incomplet | reducer d'audit sur succès, vide, stale, kill, budget, timeout et panne ; `AC-11` | mission `failed`, briefing absent |
| `TM-AUDIT-02` | journal modifié par un administrateur est supposé inviolable | moyen | append-only au niveau service, accès privé, contrôles de cohérence et sauvegarde future | tentative update/delete via surface applicative refusée ; exercice divergence | risque DBA résiduel explicite ; ne pas revendiquer non-répudiation cryptographique |
| `TM-AVAIL-01` | panne agentique bloque le chargement ou une mutation manuelle du cockpit | critique | routes et modules séparés, timeout agent court à décider, rendu en fallback, aucune dépendance dans services métier | tables agentiques absentes/erreur/kill, suites cockpit inchangées ; `AC-08` | état `degraded` ou `manual_only`, vue « Aujourd'hui » |
| `TM-AVAIL-02` | scan trop large monopolise D1 | élevé | projection bornée, budget `source_rows`, pagination/lots, aucune transaction longue, mesure des plans | volume limite, panne/timeout, latence cockpit en parallèle | stop mission, pause OPS, lecture manuelle prioritaire |
| `TM-SWITCH-01` | switch manquant ou configuration incomplète autorise quand même | critique | ligne absente = `stopped`; les trois scopes doivent être explicitement `enabled` | suppression de chaque ligne, toutes les admissions refusées | activation manuelle explicite seulement |
| `TM-SWITCH-02` | mauvaise portée tuée ou réactivée par double commande | élevé | portée fermée, aperçu, concurrence de version, idempotence, trace acteur/raison | collision de version et replay de commande | global stop disponible ; correction humaine auditée |
| `TM-RESTORE-01` | restauration ressuscite une mission/briefing ancien | élevé | incrément `restore_epoch`, invalidation des fingerprints, système stoppé jusqu'à réconciliation | restauration fixture, ancienne écriture et ancien briefing refusés | cockpit manuel puis nouvelle mission après Mouaad |
| `TM-RETENTION-01` | fixtures ou futures traces persistent sans durée et exposent des données | élevé pour réel | fixtures isolées/reset ; aucune donnée personnelle admise ; gate D-008/D-009 | vérification reset et absence de données réelles | aucune activation réelle avant politiques et purge testées |
| `TM-METRIC-01` | seuils non décidés sont présentés comme succès ou autorisation | moyen | résultats bruts seulement, aucune moyenne compensatoire, gate D-018 | rapport sans verdict go-live, quinze critères tous bloquants | Mouaad décide après baseline ; système reste fixture-only |

## 8. Risque majeur : séparation d'écriture colocalisée

Le contrôle le plus important n'est pas un prompt : c'est l'impossibilité pratique pour le chemin agentique d'écrire dans une table métier.

Dans une D1 colocalisée, un même binding serveur peut techniquement exécuter plus que les cinq écritures prévues. A1 doit donc prouver une frontière applicative stricte :

1. les fonctions de règles sont pures et n'importent aucun accès D1 ;
2. `OpsShadowReader` ne publie que des méthodes de lecture nommées ;
3. `AgentControlStore` ne contient que des statements vers les cinq tables agentiques ;
4. aucune chaîne de nom de table ou SQL libre ne provient d'une mission ;
5. les tests capturent toutes les instructions d'écriture ;
6. un snapshot exhaustif des tables métier est identique avant/après chaque scénario ;
7. le chemin agentique peut être désactivé sans toucher au chemin métier.

Risque résiduel : une erreur dans la couche serveur disposant du binding pourrait contourner cette discipline. Avant des données réelles, la revue de code, les tests d'autorité et la mesure des contrôles disponibles dans la stack réellement choisie sont obligatoires. Une séparation d'identité ou de Worker n'est recommandée que si elle apporte une propriété vérifiable ; elle ne doit pas créer une seconde autorité métier.

## 9. Confidentialité et minimisation

### 9.1 Manifeste A1

Autorisé dans le contexte agentique :

- IDs opaques de projet, tâche, interaction structurée, TIM et échéance ;
- statuts fermés et versions ;
- timestamps structurés ;
- indicateurs booléens de présence/cohérence ;
- règles, codes de raison, patrons et compteurs ;
- watermark, hashes et identifiants de mission.

Interdit :

- nom, prénom, alias réel, email, téléphone, adresse ;
- titre ou note libre de tâche, verbatim, résumé d'appel, transcription ;
- parties, termes, répartition, montant, document ou référence privée TIM ;
- contenu de formulaire, consentement, document, pièce jointe ;
- secret, token, cookie, assertion Access, URL signée ;
- payload SQL ou exception contenant une ligne métier.

Les aliases « Client A » et « Accord TIM B » sont uniquement des libellés de fixtures ou de rendu privé. Ils ne sont pas transmis à `OPS-01` ou `COS-01`.

### 9.2 Canaris

Chaque famille de fixture place des chaînes fictives distinctes dans les champs exclus. Les tests recherchent ces canaris dans : snapshot, contexte de règle, findings, briefing items, trace, erreur, métrique, sortie console et HTML rendu. Une seule occurrence constitue un échec bloquant.

## 10. Disponibilité et modes dégradés

| Défaillance | Présentation | Ce qui continue | Ce qui s'arrête |
|---|---|---|---|
| OPS échoue | « briefing indisponible, données manuelles disponibles » | vues et commandes cockpit | finding et briefing courant |
| COS échoue | aucun ancien briefing présenté comme neuf | findings auditables et cockpit | composition |
| tables agentiques indisponibles | `manual_only` | tout le métier D1 | missions, traces et briefing |
| source/watermark indisponible | erreur, jamais « zéro priorité » | vue « Aujourd'hui » | publication agentique |
| budget/timeout absent | mission non admise | cockpit | exécution agentique |
| kill global | indicateur coupure par Mouaad | cockpit complet | toutes missions et publications agentiques |
| Access indisponible | surface privée fermée | aucun accès privé jusqu'au retour | cockpit et agentique privés ; aucune donnée exposée |

Un cache de briefing ne doit pas masquer une panne ou une source stale. S'il existe plus tard, il est privé, `no-store` côté navigateur pour les données sensibles, versionné et invalidé par watermark ; il n'est jamais le seul accès aux priorités.

## 11. Defaults provisoires et gates

| Sujet | Default fixture-only | Gate données réelles |
|---|---|---|
| Sensibilité D-007 | tout champ non allowlisté refusé ; identifiants opaques ; `fixture_only=true` | catégories, responsabilités et manifeste définitifs décidés |
| Rétention D-008 | base isolée remise à zéro après tests ; aucune durée légale inventée | TTL, backups, purge et preuves validés |
| Export/effacement D-009 | aucun export personnel ; reset de fixture | procédure multi-système et restauration validées |
| Budget D-013 | limites logiques finies explicites ; zéro capability tarifée | devise et plafonds monétaires décidés |
| Timeout/retry D-014 | timeout fini fourni par scénario, une tentative, zéro retry | valeurs et circuit breaker par capacité décidés |
| Réussite D-018 | métriques observées, aucun go-live automatique | baseline et seuils décidés par Mouaad |

Toute configuration omise ferme l'admission. Le passage `fixture_only=false` est lui-même une opération interdite tant que les gates applicables ne sont pas toutes matérialisées.

## 12. Programme de vérification sécurité A1

### 12.1 Autorité

- Access absent, invalide, expiré, mauvaise audience et mauvaise identité ;
- agent/système incapable de modifier ou réactiver un switch ;
- type, agent et capability inconnus refusés ;
- absence d'approbation sans effet et aucune autorisation par silence ;
- mission terminale non réouverte.

### 12.2 Intégrité

- égalité exacte des tables métier avant/après tous les chemins ;
- partitions de statuts ouverts/clos pour projets, tâches et TIM ;
- modification entre OPS/COS/affichage ;
- double livraison, ordre SQL aléatoire et IDs proches ;
- stale, résultat tardif, restore epoch et conflit de version.

### 12.3 Confidentialité

- canaris dans chaque champ interdit ;
- HTML/Markdown/URL hostile ;
- erreurs D1 et résultats invalides ;
- scan de toutes les cinq tables, logs, métriques et rendu ;
- aucune partie, montant ou document TIM hors D1 métier.

### 12.4 Coût et disponibilité

- budgets absent, nul, négatif et dépassé ;
- timeout à chaque checkpoint ;
- preuve de zéro retry et zéro réseau ;
- kill global, agent et chacune des capabilities ;
- tables agentiques absentes et exception du runner avec suites cockpit vertes ;
- charge de fixture correspondant à 5–20 dossiers et contrôle des plans de requête.

### 12.5 Audit

Un reconstructeur déterministe doit retrouver, pour chaque scénario : événement/source, mission, tentative, transitions, résultat, coût, approbation éventuelle, erreur, acteur et dates. Il ne consulte ni log console, ni fournisseur, ni table métier pour combler une trace manquante.

## 13. Conditions de stop sécurité

La Phase A1 future doit rester désactivée ou revenir à `manual_only` si l'un des faits suivants est observé :

- écriture ou tentative d'écriture vers une table métier ;
- PII, montant TIM, secret ou texte client dans une donnée agentique ;
- résultat stale ou tardif affiché comme courant ;
- mission admise avec budget, timeout ou switch manquant ;
- réactivation par une identité autre que Mouaad ;
- journal incomplet présenté comme succès ;
- panne agentique dégradant une commande manuelle ;
- appel réseau, modèle ou connecteur ;
- règle intake affirmant « non traité » sans signal canonique ;
- création d'un type d'agent ou d'une capability hors allowlist.

La réponse est : kill global, conservation des traces redactées, vérification des tables métier, retour au cockpit manuel, correction sur fixtures puis nouvelle décision de Mouaad. Aucun arrêt de sécurité n'autorise une réparation automatique du métier.

## 14. Risques résiduels explicitement acceptés pour les fixtures seulement

- le contrôle d'écriture est applicatif tant qu'une D1 colocalisée utilise un binding commun ;
- le ledger est append-only par service mais n'est pas une preuve cryptographique contre un administrateur D1 ;
- un scan est une photographie, pas une surveillance continue ; « zéro dossier manqué » vaut au watermark d'un scan réussi ;
- le délai concret du kill dépend des checkpoints et doit être mesuré ;
- les règles de rétention, effacement, budget monétaire, timeout réel et seuils de réussite ne sont pas décidées ;
- la règle « nouveau dossier non traité » reste désactivée en l'absence d'un signal canonique ;
- la disponibilité de la couche agentique peut être nulle sans que cela constitue une panne du cockpit.

Aucun de ces risques n'autorise l'usage de données réelles. Leur acceptation pour un shadow réel exige les décisions ouvertes, les tests bloquants et une nouvelle validation explicite.
