# QA du cockpit V1

La validation combine tests automatisés, build statique, contrôle Git et recette manuelle dans un environnement fictif.

## Commandes automatisées

Installation propre avec la version npm compatible Cloudflare :

```bash
npx --yes npm@10.9.2 ci
```

Suite ciblée cockpit :

```bash
npm run test:cockpit
```

Sécurité BFF seule :

```bash
npm run test:cockpit:security
```

Régressions du site existant et build :

```bash
npm test
npm run test:market
npm run build
git diff --check
```

## Couverture automatisée présente

### Domaine et validation

- catalogue fermé des critères ;
- cohérence des stades acheteur/vendeur ;
- achat et vente liés modélisés en deux projets ;
- règle complète de contrainte dure ;
- `to_confirm` valide mais jamais bloquant ;
- critère textuel contrôlé ;
- rôles TIM et répartitions non codées comme automatisme ;
- location sans allocation automatique ;
- confirmation explicite et total des allocations ;
- indépendance des axes TIM ;
- unités mineures, points de base, paiement partiel, ajustement et remboursement traçable.

### Base et services

- application des six migrations sur une base vide ;
- exactement 22 tables métier et aucune erreur de clé étrangère ;
- fixtures uniquement fictives ;
- exclusion d’un contact uniquement TIM de la liste Clients ;
- création atomique et idempotente personne + projet + recherche + tâche ;
- projet actif sans tâche exposé comme anomalie, puis résolu ;
- conflit de concurrence optimiste sans deuxième écriture ;
- historique d’un critère conservé ;
- compensation liée à l’ancienne version des termes ;
- retry de paiement sans duplication.

### Sécurité et BFF

- refus fermé sans Access ;
- bypass accepté uniquement en local avec variable explicite ;
- JWT signé, issuer/audience et identité allowlistée ;
- origine étrangère refusée avant D1 ;
- jeton CSRF HMAC à durée courte ;
- headers privés/no-store/noindex ;
- erreur D1 distincte d’une file vide.

### Export Markdown

- front matter et identifiants stables ;
- historique du dossier ;
- deux modes de coordonnées ;
- absence de données d’un autre dossier ;
- échappement du HTML et des caractères Markdown dangereux ;
- refus d’une date ou d’un identifiant invalide.

## Recette manuelle

Toujours utiliser la fixture ou des identités explicitement fictives.

### A — Dossier acquéreur

1. Ouvrir `/cockpit/clients/nouveau`.
2. Créer une personne fictive et un projet d’achat actif.
3. Saisir une synthèse de recherche et ouvrir plusieurs scénarios.
4. Ajouter une prochaine action.
5. Vérifier sa présence dans « Aujourd’hui ».
6. Ouvrir la fiche, ajouter un appel puis un critère `to_confirm`.
7. Réviser le critère et vérifier que les deux événements restent dans l’historique.
8. Exporter avec coordonnées, puis sans coordonnées ; comparer les fichiers.

### B — Absence de prochaine action

1. Créer un projet actif sans tâche en cochant la confirmation explicite.
2. Vérifier l’anomalie dans « Aujourd’hui ».
3. Ajouter une tâche marquée prochaine action.
4. Recharger « Aujourd’hui » et vérifier la disparition de l’anomalie.

### C — Accord TIM vente

1. Charger les profils conseillers fictifs.
2. Créer un accord vente « envoi d’information ».
3. Cliquer volontairement sur la suggestion 20/80, puis confirmer les termes.
4. Faire évoluer l’état de l’accord et l’état de l’opération séparément.
5. Vérifier que l’état de rémunération n’a pas suivi automatiquement.
6. Enregistrer une estimation puis une somme due.
7. Enregistrer un paiement partiel, recharger et vérifier le solde.
8. Réessayer la même requête avec la même clé d’idempotence et vérifier l’absence de doublon.
9. Vérifier la prochaine action dans « Aujourd’hui ».

### D — Accord TIM location

1. Créer une opération `rental` de type `custom`.
2. Vérifier que les deux champs de pourcentage sont vides et qu’aucune suggestion n’est affichée.
3. Conserver le fait générateur à `unknown` ou saisir des termes manuels.
4. Ne créer aucune rémunération due sans conditions confirmées.
5. Faire évoluer uniquement l’opération et vérifier les deux autres axes.

### E — Mobile et accessibilité

Tester A et C sur une viewport de `390 × 844` :

- sans zoom ni débordement horizontal ;
- navigation basse utilisable à une main ;
- cibles tactiles d’au moins 44 px ;
- focus visible au clavier ;
- dialogues et formulaires longs utilisables lorsque le clavier virtuel est ouvert ;
- boutons Copier/Télécharger accessibles ;
- préférence `prefers-reduced-motion` respectée.

Faire également un passage desktop représentatif.

## États d’erreur

Vérifier séparément :

- résultat vide : message calme et action proposée ;
- `COCKPIT_DB` absent : message « Données indisponibles », jamais une journée vide ;
- session Access absente/expirée : refus, jamais le shell avec données ;
- conflit de version : message de conflit et aucune écriture concurrente ;
- problème réseau : bouton Réessayer.

## Contrôles de confidentialité

Après `npm run build` :

```bash
rg -n "posthog|analytics" dist/cockpit
rg -n "Cf-Access-Jwt-Assertion|COCKPIT_CSRF_SECRET|COCKPIT_AUDIT_SECRET" dist/cockpit
```

Les deux commandes ne doivent révéler ni analytics actif ni secret dans le HTML/JavaScript statique. Inspecter aussi l’onglet Réseau : les données viennent uniquement de `/api/cockpit/*` après authentification.

## Validation locale Pages Functions

La procédure Windows a été exécutée avec succès : migrations Wrangler sur base vide, chargement des fixtures fictives, démarrage de `wrangler pages dev`, lecture du BFF et navigation réelle. `npm run test:cockpit` rejoue en parallèle le schéma et les services avec `node:sqlite` en mémoire. Cette double vérification ne remplace pas la recette Cloudflare Access de la future preview, qui reste obligatoire avant toute donnée réelle.

## Captures de la recette locale

- [Aujourd’hui — desktop](./screenshots/cockpit-desktop.png)
- [Accord TIM fictif — mobile 390 × 844](./screenshots/cockpit-mobile.png)

Ces captures contiennent exclusivement les fixtures fictives de la base locale. Elles ne prouvent pas la configuration Cloudflare Access distante, qui demeure un contrôle séparé et bloquant avant toute donnée réelle.
