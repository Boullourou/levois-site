# Rapport Phase 2 — cockpit privé LEVOIS V1

## Résultat

La Phase 2 implémente une première tranche verticale du cockpit : schéma D1, services métier, BFF privé, interface mobile/desktop, export Markdown, fixtures fictives et tests. Les parcours publics restent séparés et inchangés fonctionnellement.

La livraison n’applique aucune migration distante et ne configure pas la production. Une preview ne peut devenir utilisable qu’après la procédure manuelle Access + D1 séparée ; sans cela, elle doit refuser l’accès.

## Livrables techniques

### Six migrations

1. `db/migrations/0001_cockpit_identity.sql`
2. `db/migrations/0002_cockpit_projects.sql`
3. `db/migrations/0003_cockpit_search_history.sql`
4. `db/migrations/0004_cockpit_tim_core.sql`
5. `db/migrations/0005_cockpit_workflow_tim_finance.sql`
6. `db/migrations/0006_cockpit_governance_integrity.sql`

Elles créent exactement les 22 tables détaillées dans [D1_SETUP.md](./D1_SETUP.md).

### Pages privées

- `/cockpit/`
- `/cockpit/clients/`
- `/cockpit/clients/nouveau`
- `/cockpit/clients/dossier?id=…`
- `/cockpit/tim/`
- `/cockpit/tim/nouveau`
- `/cockpit/tim/dossier?id=…`
- `/cockpit/lab`
- `/cockpit/reglages`

### Routes BFF privées

Lectures :

| Méthode | Route | Résultat |
|---|---|---|
| GET | `/api/cockpit/session` | acteur local/Access, jeton CSRF, disponibilité du binding |
| GET | `/api/cockpit/today` | file de travail et anomalies |
| GET | `/api/cockpit/clients` | liste et filtres |
| GET | `/api/cockpit/clients/:personId` | fiche client complète |
| GET | `/api/cockpit/advisors` | profils conseillers actifs |
| GET | `/api/cockpit/tim` | liste TIM et filtres |
| GET | `/api/cockpit/tim/:agreementId` | fiche TIM complète |
| GET | `/api/cockpit/lab` | observations Lab |

Commandes :

| Méthode | Route | Commande métier |
|---|---|---|
| POST | `/api/cockpit/clients/create` | créer personne, projet(s), recherche et prochaine action |
| POST | `/api/cockpit/clients/:personId/export` | générer et auditer l’export Markdown |
| POST | `/api/cockpit/projects/:projectId/stage/change` | changer le stade avec historique |
| POST | `/api/cockpit/projects/:projectId/interactions/record` | enregistrer une interaction client |
| POST | `/api/cockpit/projects/:projectId/tasks/create` | créer une tâche projet |
| POST | `/api/cockpit/tasks/:taskId/complete` | terminer une tâche |
| POST | `/api/cockpit/searches/:searchId/criteria/revise` | ajouter/réviser un événement de critère |
| POST | `/api/cockpit/advisors/create` | créer un profil conseiller |
| POST | `/api/cockpit/tim/create` | créer l’agrégat TIM et ses termes initiaux |
| POST | `/api/cockpit/tim/:agreementId/terms/revise` | créer une nouvelle version des termes |
| POST | `/api/cockpit/tim/:agreementId/status/change` | modifier un seul axe TIM |
| POST | `/api/cockpit/tim/:agreementId/compensations/record` | créer/réviser une rémunération |
| POST | `/api/cockpit/tim/:agreementId/payments/record` | enregistrer un mouvement idempotent |
| POST | `/api/cockpit/tim/:agreementId/tasks/create` | créer une tâche TIM |
| POST | `/api/cockpit/lab/create` | enregistrer une observation anonymisée |
| POST | `/api/cockpit/lab/:observationId/status/change` | faire évoluer son état |

Il n’existe aucun endpoint générique `PATCH anything` et aucun accès D1 direct depuis le navigateur.

## Règles métier structurantes

- Un achat/vente lié crée deux projets et une relation, pas un type hybride persistant.
- Une personne uniquement concernée par TIM n’est pas un client par défaut.
- Un projet actif ou un Accord TIM ouvert peut être créé sans action uniquement après confirmation explicite ; il devient alors une anomalie visible.
- Les critères sont des événements historisés par scénario ; une révision conserve la valeur précédente.
- `to_confirm`, `observed` ou `inferred` ne peut pas devenir une contrainte bloquante.
- 20/80 et 50/50 sont des suggestions UI pour une vente, appliquées seulement après action et confirmation ; les valeurs persistées restent configurables.
- Une location ne reçoit ni allocation ni fait générateur automatique.
- Accord, opération et rémunération évoluent sur trois axes indépendants.
- Les termes TIM sont versionnés et une rémunération garde la version utilisée.
- Pourcentages en points de base, montants en unités mineures, paiements idempotents.

## Expérience livrée

- file de travail orientée action, avec états vide/erreur distincts ;
- listes Clients et TIM filtrables ;
- création manuelle d’un dossier, y compris achat/vente liés ;
- fiche client avec recherche, critères, historique, interactions, tâches et export ;
- création et fiche TIM avec termes, trois états, rémunération, solde et tâches ;
- LEVOIS Lab avec confirmation d’anonymisation ;
- Réglages pour créer le profil opérateur et les conseillers TIM ;
- navigation desktop et basse mobile ;
- cibles tactiles de 44 px, focus visible et reduced motion ;
- manifeste installable sans cache offline.

Les captures de recette sont disponibles dans [QA.md](./QA.md#captures-de-la-recette-locale).

## Fixtures

`db/fixtures/cockpit-v1.sql` ne contient que des identités de démonstration et des références `demo-*`. Il couvre un acheteur fictif du secteur chartrain, un vendeur fictif sans adresse, un contact uniquement TIM, un accord vente fictif, un accord location fictif et une observation Lab fictive. Aucun accord ou client réel n’y est reproduit.

## Sécurité

Le contrôle Access, l’allowlist, le bypass local à double condition, la protection Origin/CSRF, les headers privés, la séparation de layout et de binding, la validation serveur, l’idempotence et l’audit minimal sont implémentés. Le détail et les conditions de go/no-go figurent dans [SECURITY_REPORT.md](./SECURITY_REPORT.md).

## Limites connues

- Cloudflare Access, les secrets et la D1 preview sont à configurer manuellement.
- `npm audit --omit=dev` signale 5 vulnérabilités hautes et 2 modérées dans l’ancienne chaîne Astro 4 ; la correction proposée impose une migration majeure, volontairement laissée hors de cette phase pour ne pas risquer les parcours publics.
- Aucun identifiant D1 distant ni URL de preview n’est versionné.
- La D1 locale, les migrations Wrangler, les fixtures, Pages Functions et la navigation navigateur ont été validées sous Windows.
- L’écran Réglages permet de créer le profil opérateur puis les autres conseillers nécessaires aux Accords TIM.
- La fiche TIM lit son journal d’interactions, mais la V1 n’expose pas encore un formulaire dédié pour enregistrer une interaction TIM.
- La suppression/erasure complète, la conservation configurable, les sauvegardes automatisées et la rotation assistée des secrets ne sont pas implémentées.
- Il n’y a ni matching, ni biens/annonces, ni visites, ni IA, ni connexion des formulaires publics.
- Aucune synchronisation Obsidian : export uniquement à la demande.

## Configuration manuelle restante

1. Créer une D1 preview séparée.
2. Appliquer les six migrations uniquement à cette base.
3. Configurer le binding Preview `COCKPIT_DB`.
4. Créer et restreindre l’application Cloudflare Access.
5. Ajouter hostname, audience, domaine d’équipe, identité autorisée et secrets.
6. Rejouer les scénarios de [QA.md](./QA.md) sur mobile et desktop.
7. Ne permettre les données réelles qu’après un go explicite sur sécurité, sauvegarde et procédure d’effacement.

## Phase 3 proposée

Avant le matching ou l’IA, consolider l’exploitation privée :

- mettre à niveau Astro et sa chaîne de build dans une branche de sécurité dédiée, puis rejouer les tests publics et cockpit ;
- interactions TIM complètes ;
- procédure d’export global, effacement audité et conservation ;
- sauvegardes et test de restauration preview ;
- durcissement CSP et observabilité des refus sans contenu sensible ;
- connexion progressive des formulaires publics via une couche d’ingestion séparée, seulement après validation de migration.

L’analyse d’annonces, les visites, le matching et les fonctions IA restent hors périmètre jusqu’à validation explicite.
