# Matrice d’autorité et d’approbation LEVOIS

Statut : architecture cible à valider. Aucune action, intégration ou approbation décrite n’est active.

## 1. Règle d’autorité

Mouaad est l’unique décideur et responsable humain en V1. Un agent peut **proposer** ou **préparer** selon son contrat ; il ne peut jamais se désigner approbateur. Un avis de `TRUST-01` est une condition de contrôle, pas une décision à la place de Mouaad.

D1 demeure l’autorité métier. Aucun agent n’écrit directement dans ses agrégats. Le chemin conceptuel unique est :

```text
agent → proposition/brouillon/commande demandée
      → contrôles déterministes du control plane
      → approbation explicite et bornée de Mouaad si requise
      → gestionnaire de commande métier
      → événement + projection D1 + audit
```

Pour une action externe, l’approbation et le déclenchement sont séparés. En V1, Mouaad relit puis déclenche lui-même ; aucun agent ne possède l’outil d’envoi, de publication, de paiement ou de déploiement.

## 2. Légende

Agents : `COS` = `COS-01`, `OPS` = `OPS-01`, `BUY` = `BUY-01`, `SEL` = `SEL-01`, `MKT` = `MKT-01`, `GROW` = `GROW-01`, `PROD` = `PROD-01`, `FIN` = `FIN-01`, `TRUST` = `TRUST-01`.

Risque :

- **R1 — faible** : interne, réversible, sans PII ou engagement ;
- **R2 — modéré** : modifie l’organisation interne ou expose un brouillon/donnée ciblée ;
- **R3 — élevé** : touche client, réputation, donnée confirmée, finance, droit ou système ;
- **R4 — critique** : irréversible/difficilement réversible, contractuel, paiement, suppression, consentement, secret ou production.

`Expiration` désigne la durée de validité d’une approbation, pas la rétention du journal. Aucun nombre arbitraire n’est fixé ici : les TTL chiffrés devront être décidés avant activation.

## 3. Matrice obligatoire

| Action | Agent(s) pouvant proposer | Agent pouvant préparer | Approbateur / exécutant | Auto autorisée ? | Journal requis | Expiration de l’approbation | Risque |
|---|---|---|---|---|---|---|---:|
| **Création de tâche** | `COS`, `OPS`, `BUY`, `SEL`, `FIN`, `TRUST` | `OPS` prépare la commande et l’échéance ; agent métier garde le contexte | Mouaad pour toute tâche métier et prochaine action ; gestionnaire déterministe exécute | **Non pour `task_created` en V1**. Un futur L4 peut seulement créer un work item/une alerte de mission réversible, jamais une tâche D1, une promesse ou une prochaine action | Oui : règle/source, cible, acteur, échéance, version, idempotence et résultat | Au changement du dossier/source/échéance ou TTL configuré, au premier terme atteint | R1 artefact / R2 métier |
| **Modification d’un critère** | `BUY` ; `OPS` peut signaler une contradiction | `BUY` prépare une proposition granulaire avec ancienne valeur, preuve et certitude suggérée | **Mouaad** choisit valeur et certitude ; commande `confirmCriterionChange` ajoute événement/révision | **Non** | Oui : proposition, preuve minimale, ancienne/nouvelle valeur, certitude, révision et décision | Immédiate si source/révision/projet change ; sinon TTL configuré | R3 |
| **Modification d’un critère confirmé** | `BUY` uniquement comme nouvelle proposition ; aucun agent ne « corrige » directement | `BUY` montre historique et effets sur matchings | **Mouaad obligatoire** | **Jamais** | Oui, non écrasant : nouvel événement, auteur, raison, révision, matchings devenus `stale` | Un seul usage, liée à la version exacte ; toute différence l’invalide | R4 |
| **Modification d’un stade de projet** | `OPS`, `BUY` ou `SEL` selon dossier | `OPS` prépare commande, raisons et effets sur tâches | **Mouaad** ; gestionnaire déterministe applique | **Non** | Oui : ancien/nouveau, raison, version, effets et acteur | Au changement de version ou TTL configuré | R3 |
| **Envoi d’email** | Agent métier (`BUY`, `SEL`, `FIN`) ou `OPS`; `GROW` pour diffusion éditoriale | Agent proposant prépare le texte ; `OPS` vérifie destinataire/pièces ; `TRUST` donne avis si sensible | **Mouaad relit et déclenche** | **Non, aucune action externe sensible automatisée** | Oui : destinataire pseudonymisé dans log technique, version/hash du contenu, pièces, finalité, approbation, résultat fournisseur | Dès que destinataire, objet, corps, pièce, finalité, source ou dossier change ; sinon TTL court à décider | R3/R4 |
| **Envoi de SMS** | `BUY`, `SEL`, `FIN` ou `OPS` | Agent métier + `OPS`, message exact | **Mouaad relit et déclenche** | **Non** | Oui : canal, cible technique minimisée, hash/version, finalité, approbation et résultat | Même règle que l’email ; jamais approbation permanente d’un fil | R3 |
| **Envoi d’une annonce à un acquéreur** | `BUY` | `BUY` prépare facteurs, limites et message à partir de révision/snapshot figés ; `OPS` vérifie canal | **Mouaad valide le matching, relit et envoie** | **Non** | Oui : recherche/révision, annonce/snapshot, facteurs, décision, message envoyé et résultat | Immédiate si annonce, prix, disponibilité, recherche, critère ou message change ; sinon TTL à décider | R3 |
| **Publication sociale** | `GROW` | `GROW` prépare version finale, média, CTA/destination ; `TRUST` rend avis | **Mouaad approuve et publie/déclenche** | **Non** | Oui : problème source anonymisé, contenu/hash, droits média, canal, CTA, avis, approbation et résultat | À tout changement de texte, média, droit, canal, date, CTA, destination ou contexte ; TTL éditorial à décider | R3 |
| **Création de rendez-vous externe** | `OPS`, `BUY`, `SEL`, `FIN` | `OPS` prépare participants, objet, créneau, lieu/lien et rappel | **Mouaad confirme et crée/envoie l’invitation** | **Non** | Oui : participants minimisés, finalité, créneau, fuseau, version et résultat | Dès que participant/créneau/lieu/objet change ; expire au début du créneau ou TTL décidé | R3 |
| **Analyse d’annonce** | `MKT`, `BUY`, `SEL` | `MKT` prépare faits/provenance ; `BUY` ou `SEL` prépare l’interprétation ciblée | Aucun accord requis pour conserver un brouillon L2 ; **Mouaad** approuve tout verdict/usage externe | **Oui seulement comme analyse interne L2**, jamais comme vérité/matching/envoi ; L4 éventuel limité au contrôle de fraîcheur | Oui : source/snapshot, révision si acquéreur, facteurs, inconnues, modèle/règle, coût | Analyse devient `stale` dès qu’une source ou révision change ; TTL source obligatoire | R2 interne / R3 utilisée |
| **Validation d’un matching** | `BUY` | `BUY` prépare facteurs durs/souples/inconnus, compromis et verdict proposé | **Mouaad obligatoire** | **Jamais** | Oui : toutes versions, facteurs, décision, raison et éventuel envoi | Un seul usage ; invalidation à tout changement de révision/snapshot/critère | R4 |
| **Export Obsidian** | `OPS`, agent métier pour le périmètre, `TRUST` pour demande d’accès/effacement | `OPS` prépare sélection, aperçu, manifeste, destination et redaction | Mouaad pour tout export nominatif, dossier complet ou TIM ; gestionnaire d’export exécute | **Partielle seulement** : futur L4 pour rapport interne prédéfini, minimisé, sans coordonnées ni finance, vers bloc géré autorisé ; sinon non | Oui : périmètre/champs, manifeste/hash, destination, acteur, expiration/révocation et résultat | Au changement de sélection/version/destination ; lien/export temporaire TTL à décider | R2 minimisé / R4 sensible |
| **Paiement** | `FIN` peut uniquement signaler/proposer une vérification | `FIN` prépare un état explicable ou le futur enregistrement après preuve ; jamais une instruction bancaire | **Mouaad seul décide et exécute hors agent** ; il valide séparément l’enregistrement D1 | **Jamais** | Oui : accord/compensation, fait générateur, montant/devise, preuve référencée, idempotence, approbation et résultat ; aucune donnée bancaire dans log | Approbation d’enregistrement liée à la preuve/version et à usage unique ; une autorisation ne vaut jamais ordre permanent | R4 |
| **Enregistrement ou modification d’un Accord TIM** | `FIN`; `OPS` peut signaler l’absence | `FIN` prépare termes, parties, allocations et un seul axe de statut à la fois ; `TRUST` examine minimisation/rétention | **Mouaad obligatoire** | **Non** | Oui : création, version termes/allocation, axe ancien/nouveau, raison, références et acteur | Version exacte, usage unique ; toute modification de termes/parties/axe invalide | R4 |
| **Constatation d’un montant TIM dû / enregistrement d’un paiement** | `FIN` propose après preuve | `FIN` prépare commande et rapprochement ; jamais de déduction par date seule | **Mouaad obligatoire** | **Jamais** | Oui : fait générateur/preuve, montant/devise, état antérieur, idempotence et résultat | Usage unique, preuve/version exactes ; révocation avant exécution ; collision bloque | R4 |
| **Suppression / pseudonymisation / restauration** | `TRUST` à partir d’une demande vérifiée ; `OPS` peut signaler | `TRUST` inventorie dépendances/rétention ; `OPS` prépare export éventuel ; exécuteur déterministe prépare un plan | **Mouaad obligatoire avec confirmation distincte** ; consultation externe si obligation incertaine | **Jamais** | Oui : demande vérifiée, inventaire, bases de conservation, plan, confirmation, résultat par système et preuve non identifiante | Autorisation à usage unique, liée à inventaire/version ; expire si dépendance/politique/sauvegarde change | R4 |
| **Consentement : enregistrement, correction ou retrait** | `TRUST` peut signaler une preuve ou incohérence ; aucun agent ne peut inférer un consentement | `TRUST` prépare examen de la preuve ; capture serveur brute reste un fait déterministe distinct | **Mouaad obligatoire** pour qualifier/corriger l’état métier ; le retrait demandé bloque immédiatement les usages concernés | **Jamais par un agent** | Oui : finalité, version du texte, preuve/qualité, source serveur, décision et effets ; pas de corps brut inutile | Liée à la preuve/finalité/version ; pas de consentement permanent ou réutilisable pour autre finalité | R4 |
| **Fusion de personnes ou de biens** | `OPS`, `BUY`, `SEL` ou `MKT` peuvent signaler des doublons | `OPS` prépare comparaison et impacts ; `TRUST` examine données/TIM/rétention | **Mouaad obligatoire** ; exécuteur déterministe conserve provenance et possibilité de correction | **Jamais** | Oui : candidats, preuves, conflits, liens dépendants, décision et résultat ; audit sans PII complète | Usage unique/version exacte ; toute mutation d’un candidat invalide | R4 |
| **Migration de données ou schéma** | `PROD` ; `OPS`/`FIN` peuvent exprimer besoin | `PROD` prépare plan `expand→backfill→bascule→contract`, tests, sauvegarde/rollback ; `TRUST` examine données | **Mouaad obligatoire** ; exécution humaine selon procédure séparée | **Non en V1** | Oui : commit, schéma/version, environnement, sauvegarde, tests, approbation, opérateur et résultat | Liée au commit, schéma, environnement et fenêtre ; expire à tout changement ou fin de fenêtre | R4 |
| **Déploiement** | `PROD` | `PROD` prépare artefact, diff, tests, canary et rollback | **Mouaad obligatoire et déclenchement humain** | **Non en V1** | Oui : commit/artefact, environnement, tests, approbation, opérateur, résultat et rollback | Liée au commit/artefact/environnement et fenêtre ; usage unique | R4 |
| **Achat média** | `GROW` propose hypothèse/canal ; `FIN` contrôle budget | `GROW` prépare campagne ; `FIN` prépare coût/plafond ; `TRUST` examine contenu/ciblage | **Mouaad seul approuve et déclenche** | **Jamais** | Oui : hypothèse, audience, contenu, montant/plafond, durée, avis et résultat | Liée au budget, audience, création, canal et fenêtre ; tout changement invalide | R4 |
| **Accorder, modifier ou révoquer une capability/droit** | `COS`, `TRUST` ou `PROD` peuvent signaler un besoin/risque | `TRUST` prépare portée, durée, données, outils et effets ; l’agent concerné ne prépare pas sa propre élévation | **Mouaad** accorde/modifie ; expiration, kill switch ou règle déterministe peut seulement révoquer/réduire | **Jamais pour accorder/étendre** ; révocation automatique fail-closed autorisable | Oui : sujet, capability, ancien/nouveau périmètre, motif, durée, approbation/révocation | Grant à TTL court configuré ; toute mission/outil/finalité/version différente invalide | R4 |
| **Activer, pauser ou désactiver un agent/connecteur** | `COS`, `TRUST`, `PROD` ou `FIN` pour coût | `TRUST`/`PROD` préparent manifeste, tests, scopes, budget, fallback et runbook | **Mouaad** active/réactive ; le control plane peut pauser automatiquement selon politique | Pause/désactivation fail-closed : oui ; activation/réactivation : **jamais** | Oui : composant/version, environnement, état, raison, approbation, tests et résultat | Activation liée au manifeste/version/période ; pause immédiate ; réactivation = nouvelle décision | R4 |
| **Rotation ou révocation d’un secret** | `TRUST`/`PROD` signalent ; aucun agent ne lit la valeur | Processus humain prépare inventaire des dépendances et fenêtre | **Mouaad ou opérateur humain explicitement habilité** exécute dans le coffre/fournisseur | **Jamais par un agent** ; révocation d’urgence par contrôle déterministe préautorisé seulement | Oui sans valeur du secret : identifiant logique, portée, acteur, date, dépendances et résultat | Usage unique et fenêtre courte ; toute exposition déclenche révocation/incident | R4 |
| **Kill switch et réactivation** | Tout rôle peut demander l’arrêt ; `TRUST`/`COS` qualifient l’impact | CP prépare portée global/département/agent/connecteur/mission et état à préserver | CP déclenche automatiquement les arrêts de politique ; **Mouaad seul réactive en V1** | Arrêt : oui selon politique ; réactivation : **jamais** | Oui : portée, cause, état, leases révoquées, coûts, acteur et conditions de reprise | Arrêt sans expiration ; réactivation liée au runbook, versions et réconciliation | R4 |
| **Émettre, accepter ou refuser une offre** | `BUY`/`SEL` peuvent seulement préparer un brief factuel ; `TRUST` signale risque | Aucun agent ne prépare une décision engageante ; documents et canal restent dans le processus professionnel humain | **Mouaad et parties/professionnels habilités**, hors agent | **Jamais** | Oui : références privées, versions, échéance, décision humaine et canal ; aucun texte/document dans log technique | Décision à usage unique, échéance et document exacts ; toute modification invalide | R4 |
| **Prendre, signer ou modifier un mandat** | `SEL` peut préparer questions/checklist ; aucun agent ne propose une signature | Processus professionnel humain prépare le mandat et vérifie les parties | **Mouaad et parties habilitées** | **Jamais** | Oui : type d’action, référence privée, version, acteurs, date et résultat | Usage unique/version exacte ; aucune approbation générique de mandat | R4 |
| **Négociation ou engagement commercial** | `BUY`/`SEL` peuvent synthétiser faits, options et inconnues | Brouillon non engageant seulement si Mouaad le demande ; aucun argument ou concession envoyé | **Mouaad conduit et décide** | **Jamais** | Oui : dossier, sources/version, décision humaine, échéance et issue ; contenu sensible hors journal | Liée à l’échange et au contexte courant ; expire à tout nouvel élément | R4 |
| **Changement de budget agent/workflow/outil** | `COS` ou `FIN`; agent concerné peut seulement signaler insuffisance | `FIN` prépare consommation native, valeur attendue, nouveau plafond monétaire et arrêt | **Mouaad obligatoire** | **Jamais** | Oui : anciens/nouveaux quotas natifs, montant en unité mineure/devise, motif, périmètre, durée, approbation et consommation | Liée à agent/capacité/période ; expire fin de période ou à changement de politique | R4 |

## 4. Autorité sur les actions sans approbation par cas

Seules des actions L4 explicitement homologuées peuvent éviter une approbation par exécution. Elles restent soumises à une **approbation de politique** préalable de Mouaad. La politique doit nommer : agent, capacité, commande, paramètres autorisés, sources, champs, quotas natifs, plafond monétaire/devise, fréquence, expiration, métriques, seuil d’arrêt, journal et procédure de révocation.

Actions candidates, non accordées par ce document :

- assembler un rapport quotidien interne de 3 à 7 items ;
- créer/fermer un work item ou une alerte interne dédupliquée de tâche échue, sans produire `task_created` ni satisfaire la prochaine action ;
- signaler un dossier sans prochaine action ;
- marquer une donnée/cache `stale` sans modifier le fait source ;
- exécuter un contrôle QA en sandbox avec fixtures fictives ;
- exporter un rapport interne prédéfini sans PII ni donnée TIM financière.

Une politique L4 ne peut jamais couvrir une action externe, un agrégat confirmé ou une catégorie R4.

## 5. Quorum et séparation des responsabilités

### 5.1 Quorum V1

Le quorum humain V1 est **une approbation explicite de Mouaad**, puisque LEVOIS est opéré par un dirigeant principal. Aucun vote d’agents ne compte dans ce quorum.

Pour une action R4, la robustesse vient de trois éléments cumulatifs :

1. une préparation par le rôle compétent ;
2. des préconditions déterministes et, lorsque pertinent, un avis `TRUST-01` ;
3. une confirmation explicite de Mouaad distincte de la préparation.

Pour suppression, restauration, fusion, consentement, paiement, migration, déploiement et budget, l’interface future impose une **double étape de confirmation par Mouaad** : revue du manifeste/effets puis déclenchement. Cela n’est pas présenté comme deux personnes indépendantes. Si une réglementation, un contrat ou la croissance future exige un second humain, l’action reste bloquée jusqu’à la définition de ce rôle ; un agent ne peut le remplacer.

### 5.2 Séparation des rôles

- Le proposant ne peut pas approuver sa propre sortie.
- `TRUST-01` peut bloquer mais ne peut pas lever son propre blocage.
- `COS-01` peut prioriser une file proposée, jamais valider son contenu métier.
- L’exécuteur déterministe ne raisonne pas : il applique un schéma/une politique ou refuse.
- Mouaad peut agir manuellement dans le cockpit ; cette action reste auditée et ne donne pas rétroactivement un droit à un agent.

## 6. Portée et expiration d’une approbation

Une approbation contient au minimum :

- `approval_id`, type d’action et risque ;
- acteur proposant/préparant et approbateur ;
- cible/périmètre exacts ;
- commande et paramètres normalisés ;
- empreinte du brouillon, pièces et sources ;
- versions d’agrégat, recherche, annonce, politique, agent/prompt/modèle et outil ;
- coût/plafond et droits temporaires ;
- date de création, TTL configuré, statut et motif ;
- effets attendus, mode de compensation et clé d’idempotence.

Elle expire à la première des conditions suivantes : TTL dépassé, utilisation réussie, rejet/révocation, mission close, budget insuffisant, changement de cible/destinataire/contenu/pièce/source/version/politique/outil, retrait de consentement, kill switch ou perte du journal. « Approuver tous les futurs emails de ce dossier » est invalide.

Le TTL chiffré varie par action et reste à décider. Une absence de TTL vaut expiration immédiate, pas validité illimitée.

## 7. Rejeu, idempotence et concurrence

Chaque demande d’exécution utilise une clé d’idempotence dérivée de l’approbation et de la commande normalisée, jamais d’un contenu secret.

- même clé + même empreinte après succès : retourner le résultat existant, sans nouvel effet ;
- même clé + payload différent : collision, blocage et audit ;
- approbation déjà utilisée/expirée/révoquée : refus ;
- version D1 différente : conflit lisible, nouvelle analyse et nouvelle approbation ;
- timeout au statut inconnu : vérifier le journal/résultat fournisseur avant tout retry ;
- commande externe : aucun retry autonome ; Mouaad décide après vérification ;
- paiement/TIM : preuve et idempotence obligatoires, jamais d’inférence « probablement réussi » ;
- suppression partielle : demande reste ouverte, accès gelé si nécessaire, inventaire des restes et intervention humaine ;
- deux commandes incompatibles : première validation de version gagne, l’autre devient `stale`, sans fusion automatique.

Un rejeu après restauration D1 doit d’abord appliquer le registre non identifiant des effacements afin de ne pas ressusciter silencieusement une personne.

## 8. Refus fermé et voie manuelle

Le control plane refuse une action si permission, version, source, approbation, budget, journal ou idempotence manque. Ce refus ne doit jamais bloquer la consultation ou la saisie manuelle autorisée du cockpit. Mouaad peut reprendre l’action depuis le dossier, avec contexte visible et nouvel audit ; il ne contourne pas secrètement les invariants D1.

## 9. Contenu minimal du journal d’autorité

Le journal conserve identifiants techniques, mission, agent, action, cible pseudonymisée, version, outil, politique, approbation, clé d’idempotence, résultat, coût, durée, erreur catégorisée et raison de clôture. Il ne conserve ni secret, ni corps complet de message, ni coordonnées complètes, ni document TIM, ni donnée bancaire. Les détails sensibles restent dans leur agrégat autorisé et sont référencés, pas recopiés.
