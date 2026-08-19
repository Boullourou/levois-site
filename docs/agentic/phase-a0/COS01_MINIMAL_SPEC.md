# `COS-01` — Spécification minimale du briefing

Statut : **spécification de future Phase A1, non implémentée**.

Niveau initial : **L0 — Observation**.

Type de mission fermé : **`cos.daily_briefing.v1`**.

Dépendance obligatoire : **un résultat courant et valide de `ops.shadow_scan.v1`**.

## 1. Mission gelée

Dans A1, `COS-01` n’est pas encore le directeur de l’entreprise. Il sait uniquement :

1. lire les observations déterministes produites par `OPS-01` ;
2. rejeter les résultats incomplets ou périmés ;
3. dédupliquer et regrouper les observations ;
4. les ordonner selon une règle fixe ;
5. composer un briefing de sept priorités au plus ;
6. expliquer, pour chaque ligne, la raison et l’action humaine suggérée.

Il ne crée ni objectif, ni mission, ni tâche, ni approbation. Il ne lit pas directement un dossier D1, ne contacte personne et ne décide aucune action.

## 2. État actuel et cible A1

| Capacité | État actuel | Future A1 |
|---|---|---|
| Source quotidienne | `getToday()` et vues cockpit manuelles | Résultat OPS minimisé et scellé, dérivé des mêmes faits |
| Dédoublage | L’utilisateur rapproche visuellement les blocs | Empreintes et liens structurés, sans rapprochement sémantique |
| Priorisation | Tri de chaque vue | Tri inter-règles fixe, explicable et stable |
| Briefing | Aucun briefing agentique | Artefact technique privé de 0 à 7 lignes, sans modèle |
| Action | Mouaad agit manuellement | Inchangé ; le briefing ne déclenche rien |

## 3. Entrée minimale

`COS-01` reçoit un paquet unique contenant :

- `ops_mission_id`, `ops_attempt_no` et version du contrat ;
- `snapshot_id`, `as_of` et `operational_watermark` ;
- état de complétude des sept règles ;
- observations `detected` conformes au contrat OPS ;
- `link_kind` et `link_ref` opaques lorsqu'une relation structurée explicite existe ;
- coût logique et erreurs redacted de la mission OPS ;
- état des kill switches applicable à `COS-01`, `OPS-01` et leurs capabilities.

Il ne reçoit ni nom, ni email, ni téléphone, ni adresse, ni notes, ni texte d’interaction, ni montant TIM. Le label affiché est un alias fictif dans les tests ; dans un usage réel futur, la couche cockpit résoudrait localement l’identifiant opaque après la mission COS.

Sont refusés :

- une mission OPS non `completed` ;
- un résultat partiel présenté comme complet ;
- une règle obligatoire sans statut de couverture ;
- un watermark non courant ;
- une observation contenant un champ non allowlisté ;
- une mission hors budget, timeout ou portée.

## 4. Capacités COS-01

| Capacité | Entrée | Règle / traitement | Sortie | Erreur | Fallback | Mesure |
|---|---|---|---|---|---|---|
| `cos.read_ops_results` | résultat OPS scellé et identifiants de tentative | Vérifier type, schéma, complétude, redaction et watermark sans relire le métier | Ensemble admis ou rejet explicite | `CP_CONTRACT_INVALID`, `CP_RESULT_INVALID`, `CP_SOURCE_STALE`, `CP_PII_POLICY_VIOLATION` | Vue `getToday()` / cockpit | Résultats refusés par cause, stale présenté comme courant = 0 |
| `cos.deduplicate` | observations admises | Appliquer les trois passes déterministes de la section 5 ; ne jamais fusionner deux dossiers | Groupes, raisons conservées, observation principale | Liaison contradictoire → `CP_RESULT_INVALID` pour le groupe, autres groupes non promus silencieusement | Afficher les files séparées du cockpit | Duplicats retirés, raisons perdues = 0, fusions inter-dossiers = 0 |
| `cos.rank` | groupes dédupliqués | Appliquer la clé de tri totale de la section 6 | Liste stable complète | Valeur de priorité inconnue → résultat invalide, pas de rang deviné | Tri cockpit par échéance et priorité | Reproductibilité bit-à-bit après normalisation, inversions de règle = 0 |
| `cos.compose_briefing` | liste triée et contrat de format | Prendre les sept premiers au plus, construire les explications par templates fermés | Briefing technique et nombre d’éléments restant dans la file complète | Budget/timeout/kill switch → arrêt ; aucun briefing partiel déclaré courant | « Aujourd’hui » manuel ; liste déterministe complète | Taille ≤ 7, explication/action/source présentes à 100 %, modèle appelé = 0 |

Aucune capability ne permet de créer une tâche métier, une alerte L2, un message, un rendez-vous, un export ou une commande.

## 5. Dédoublage déterministe

Le dédoublage se fait sans modèle et sans similarité de texte.

### Passe 1 — duplicat exact

Deux observations avec le même `observation_fingerprint` représentent le même fait. Seule la version issue du snapshot courant est conservée ; les anciennes restent dans le journal, jamais dans le briefing courant.

### Passe 2 — même fait structuré

Les rapprochements suivants seulement sont permis :

- une promesse due et sa tâche portant le même couple `link_kind=promise_task` / `link_ref` dans le même scope forment un groupe ; la promesse due est la raison principale et la tâche échue reste une raison secondaire ;
- une échéance TIM et sa tâche portant le même couple `link_kind=tim_deadline_task` / `link_ref` dans le même scope forment un groupe ; si la tâche est déjà échue, la raison « échue » prévaut sur « proche » ;
- deux occurrences de la même tâche ou de la même échéance avec le même scope et le même `subject_id` forment un groupe.

Aucun rapprochement n’est fondé sur un nom, une phrase ressemblante ou une supposition.

### Passe 3 — une priorité par dossier

Les groupes restants ayant le même couple `(scope_kind, scope_id)` deviennent **un seul item de briefing**. L’item conserve :

- la raison principale selon le tri de la section 6 ;
- toutes les raisons secondaires et leurs références ;
- l’action humaine suggérée de la raison principale ;
- le nombre de signaux regroupés.

Deux `scope_id` différents ne sont jamais fusionnés, même s’ils concernent la même personne ou semblent liés. Un projet et un Accord TIM restent deux scopes distincts.

## 6. Ordre total des priorités

`COS-01` ne modifie pas `proposed_priority`. Il trie les groupes avec cette clé, dans l’ordre :

1. priorité proposée : `urgent`, `high`, `normal`, `low` ;
2. classe de signal :
   1. retour humain explicitement promis et arrivé à échéance ;
   2. tâche ou échéance TIM dépassée ;
   3. prochaine action ouverte incohérente avec un scope terminal ;
   4. dossier non traité prouvé par un signal canonique — règle désactivée en A1 initiale ;
   5. projet ou Accord TIM opérationnel sans prochaine action ;
   6. échéance TIM future dans la fenêtre ;
3. `due_at` croissant, les dates absentes en dernier ;
4. `detected_at` croissant ;
5. `scope_kind`, puis `scope_id`, puis `observation_fingerprint` en ordre lexical.

Cette clé est totale : le même snapshot produit toujours le même ordre. Ni valeur financière supposée, ni potentiel commercial, ni ancienneté d’une personne ne participent au tri.

### 6.1 Troncature sans oubli

- si la liste contient 3 à 7 groupes, tous sont affichés ;
- si elle en contient plus de 7, seuls les 7 premiers composent le briefing, avec « N autres anomalies dans la file détaillée » ;
- si elle en contient 1 ou 2, `COS-01` affiche seulement ces priorités ; il n’invente rien pour atteindre trois ;
- si elle est vide et toutes les règles ont été évaluées, il affiche « Aujourd’hui — aucune nouvelle priorité » ;
- si une famille est indisponible, il affiche un état dégradé, jamais « aucune priorité ».

Ainsi, le briefing reste court mais chaque anomalie OPS demeure visible dans la file déterministe complète. « Maximum 7 » ne signifie pas que la huitième anomalie disparaît.

## 7. Gate de fraîcheur avant affichage

La fraîcheur est revalidée par le control plane ; `COS-01` ne reçoit aucun accès métier supplémentaire.

1. OPS scelle le résultat avec `operational_watermark=W1`.
2. COS déduplique et classe à partir de W1.
3. Juste avant de marquer l’artefact courant, le control plane compare W1 au watermark opérationnel présent.
4. Si le watermark vaut encore W1, le briefing peut être affiché.
5. S’il vaut W2, tout le briefing est invalidé avec `CP_SOURCE_STALE`.
6. Le control plane ne crée aucune mission de remplacement : il propose seulement à Mouaad de déclencher manuellement une **nouvelle mission** `ops.shadow_scan.v1` corrélée ; il ne relance pas la tentative ancienne.
7. Sans nouvelle commande humaine et nouveau résultat cohérent, le cockpit affiche `degraded|manual_only` et ses vues natives.

Cette règle couvre la course suivante : OPS détecte une tâche échue, Mouaad la termine, puis COS tente d’afficher. Le changement de watermark invalide le briefing ; la tâche `completed` est absente du nouveau scan.

## 8. Contrat du briefing

### 8.1 En-tête

```text
Aujourd’hui — N priorité(s)
Photographie au JJ/MM/AAAA HH:MM Europe/Paris
```

L’horodatage source est en UTC dans le journal et rendu en `Europe/Paris` à l’écran. Le nombre `N` est compris entre 0 et 7.

### 8.2 Item

Chaque item contient exactement :

| Élément | Contenu |
|---|---|
| Référence | alias fictif ou libellé résolu par le cockpit, plus lien privé vers le scope |
| Pourquoi | raison déterministe principale, date utile et éventuel nombre de signaux regroupés |
| Action proposée | phrase humaine non exécutable issue de la règle OPS principale |
| Traçabilité | référence technique vers observation(s), mission OPS et snapshot ; masquée dans l’affichage court mais accessible à l’audit |

Il n’existe aucun bouton « exécuter », « envoyer », « créer la tâche » ou « approuver » dans l’artefact A1.

### 8.3 Exemple exclusivement fictif

```text
Aujourd’hui — 4 priorités

1. Client fictif A
   Retour explicitement promis arrivé à échéance aujourd’hui.
   Action proposée : vérifier le contexte puis reprendre contact manuellement.

2. Accord TIM fictif B
   Accord actionnable sans prochaine action.
   Action proposée : définir le prochain suivi TIM.

3. Client fictif C
   Projet opérationnel ouvert sans prochaine action.
   Action proposée : définir la prochaine étape.

4. Client fictif D
   Tâche ouverte échue depuis deux jours.
   Action proposée : replanifier, terminer ou clôturer après vérification.
```

Ces aliases ne correspondent à aucune personne ou opération réelle.

## 9. Erreurs, arrêt et fallback

| Situation | Sortie COS | Fallback humain |
|---|---|---|
| Résultat OPS absent ou `failed` | mission COS non admise ou `CP_DEPENDENCY_FAILED` | ouvrir « Aujourd’hui » |
| Snapshot incomplet | état dégradé ; aucune conclusion globale | ouvrir chaque bloc natif concerné |
| Watermark changé | `CP_SOURCE_STALE`, briefing non courant | recharger la vue ; Mouaad peut déclencher manuellement un nouveau scan séparé |
| Champ PII/interdit | `CP_PII_POLICY_VIOLATION`, arrêt et journal redacted | cockpit privé, incident selon politique |
| Schéma, liaison ou priorité inconnue | `CP_RESULT_INVALID` | files déterministes non consolidées |
| Budget logique absent/atteint | admission refusée ou `CP_BUDGET_EXCEEDED` | lecture directe, sans coût agentique |
| Timeout | `CP_TIMEOUT`, aucun artefact partiel courant | lecture directe |
| Kill switch global, COS ou capability | `CP_KILL_SWITCH_ACTIVE`, mission active annulée | cockpit `manual_only` |

Le retry automatique est zéro tant que D-014 reste ouverte. Une nouvelle photographie est une nouvelle mission. Seul Mouaad peut réactiver une portée coupée.

## 10. Budget et coût logique

Le briefing n’appelle aucun modèle, fournisseur ou réseau. Le coût journalisé se limite à des unités natives déterministes : nombre d’observations lues, groupes formés et items rendus.

- budget logique explicite et fini avant admission ;
- valeur absente = zéro disponible et mission refusée ;
- aucun coût monétaire estimé tant qu’aucun service payant n’est autorisé ;
- le dépassement ne réduit jamais silencieusement la couverture : il échoue et renvoie au cockpit manuel.

## 11. Mesures shadow

| Mesure | Définition A1 |
|---|---|
| Taille | nombre d’items, toujours `0..7` |
| Complétude | pourcentage d’items avec pourquoi, action et trace ; attendu de sécurité : 100 % |
| Taux de regroupement | observations admises moins items, sans raison perdue |
| Faux regroupement | deux scopes différents fusionnés ; attendu : 0 |
| Stale publié | briefing affiché après changement de watermark ; attendu : 0 |
| Reproductibilité | même entrée normalisée → même briefing normalisé ; attendu : 100 % |
| Couverture hors briefing | anomalies au-delà de 7 encore visibles dans la file détaillée ; attendu : 100 % |
| Dépendance modèle | nombre d’appels modèle ; attendu : 0 |
| Mutation métier | différence des tables métier avant/après ; attendu : 0 |

Les seuils d’utilité métier — temps net gagné, bruit acceptable et adoption — restent ouverts sous D-018. Ces mesures servent à les établir, pas à les décider implicitement.

## 12. Conditions de réussite avant données réelles

- tous les cas de dédoublage donnent un item par scope et conservent toutes les raisons ;
- une tâche passée à `completed` entre OPS et COS n’apparaît pas après revalidation ;
- un scope fermé sans incohérence explicite ne produit aucune ligne ;
- une tâche TIM à la fois « proche » et « échue » n’apparaît qu’une fois, avec « échue » comme raison principale ;
- une promesse et sa tâche liée n’apparaissent qu’une fois ;
- le huitième candidat reste accessible dans la file mais jamais dans le briefing ;
- chaque item explique exactement sa présence ;
- aucun modèle, connecteur ou chemin d’action externe n’est requis ;
- cockpit et commandes humaines fonctionnent quand COS est coupé ou en échec ;
- le journal permet de reconstruire snapshot, groupes, tri, troncature et raison de clôture.

Ces critères ne valent ni homologation L1/L2, ni autorisation de développement, ni activation. Une nouvelle validation de Mouaad est nécessaire pour la Phase A1.
