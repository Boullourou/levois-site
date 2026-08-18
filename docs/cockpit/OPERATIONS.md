# Exploitation du cockpit

Ce runbook concerne uniquement la base locale et, après validation explicite, une D1 de preview séparée. Il n’autorise aucune opération sur la production.

## Démarrage quotidien local

```bash
npm run db:cockpit:migrate:local
npm run dev:cockpit
```

Ne relancer `npm run db:cockpit:seed:local` que sur une base neuve ou après avoir vérifié que les fixtures ne sont pas déjà présentes.

Avant une démonstration :

1. vérifier que l’URL commence par `http://localhost` ou `http://127.0.0.1` ;
2. vérifier que seules les données fictives sont présentes ;
3. vérifier que la page « Aujourd’hui » distingue état vide et erreur de base ;
4. ne jamais saisir de donnée réelle dans une preview tant que Access et la séparation D1 ne sont pas validés.

## Sauvegarde locale

Les exports D1 contiennent potentiellement toutes les données. Choisir un chemin absolu privé **hors du dépôt**, protégé par les contrôles d’accès du poste. Ne pas placer une sauvegarde dans `docs`, `db`, `.wrangler` ou un autre dossier susceptible d’être commité.

```bash
npx wrangler d1 export levois-cockpit-local --local --config wrangler.cockpit.toml --persist-to .wrangler/state/cockpit --output "<CHEMIN_PRIVE_HORS_REPO>/levois-cockpit-local.sql"
```

Après export :

- vérifier que le fichier existe et n’est pas vide ;
- chiffrer le support si la sauvegarde contient un jour des données réelles ;
- consigner la date, l’environnement et la version de migration hors Git ;
- ne jamais joindre le fichier à une issue ou une pull request.

## Test de restauration locale

Restaurer d’abord dans un répertoire de persistance distinct afin de ne pas écraser la base courante :

```bash
npx wrangler d1 execute levois-cockpit-local --local --config wrangler.cockpit.toml --persist-to .wrangler/state/cockpit-restore-check --file "<CHEMIN_PRIVE_HORS_REPO>/levois-cockpit-local.sql"
```

Contrôler ensuite :

```bash
npx wrangler d1 execute levois-cockpit-local --local --config wrangler.cockpit.toml --persist-to .wrangler/state/cockpit-restore-check --command "PRAGMA foreign_key_check;"
```

Lancer le cockpit avec cet état de restauration uniquement dans un environnement local isolé. Ne remplacer l’état courant qu’après validation du contenu et avec une sauvegarde précédente disponible.

## Sauvegarde et restauration preview

Une opération distante exige une validation humaine distincte du présent runbook :

1. utiliser la configuration preview non versionnée décrite dans [D1_SETUP.md](./D1_SETUP.md) ;
2. afficher et relire le nom de la base ciblée ;
3. confirmer qu’elle n’est ni la D1 publique `RECHERCHE_DB`, ni une D1 de production ;
4. exporter vers un chemin privé hors dépôt ;
5. restaurer d’abord dans une **nouvelle** D1 preview, jamais par-dessus la seule copie disponible ;
6. reconnecter éventuellement le binding Preview après vérification.

Aucune commande `--remote` ne doit être exécutée par automatisme ou à partir des placeholders du dépôt.

## Tâches et anomalies

Le cockpit considère comme ouverte une tâche `open`, `in_progress` ou `waiting`.

- Un projet en `new`, `qualifying`, `active` ou `paused` sans tâche ouverte marquée `is_next_action` apparaît dans « Sans prochaine action ».
- Un Accord TIM en `to_formalize`, `signed`, `omega_uploaded` ou `active` suit la même règle.
- Terminer la prochaine action sans en désigner une autre rend donc l’anomalie visible ; c’est volontaire.
- Une promesse issue d’une interaction reste dans « Retours promis » tant qu’aucune tâche associée terminée ou annulée ne la clôt.

## Export Obsidian

Depuis une fiche client :

- « Copier » place le Markdown dans le presse-papiers ;
- « Télécharger .md » génère un fichier à la demande ;
- le mode « avec coordonnées » inclut email et téléphone ;
- le mode « sans coordonnées » les omet.

Le fichier n’est pas publié sous une URL durable et le cockpit n’accède jamais au vault. Après téléchargement, l’utilisateur décide manuellement où le stocker. Un export contenant des coordonnées doit rester dans un espace privé.

## Incident ou doute de confidentialité

1. Ne plus saisir ni exporter de donnée.
2. Retirer le binding preview ou désactiver l’application Pages concernée.
3. Révoquer/faire tourner `COCKPIT_CSRF_SECRET` et `COCKPIT_AUDIT_SECRET` si une exposition est possible.
4. Vérifier la politique Access et les logs Cloudflare.
5. Identifier la D1 exacte et préserver une sauvegarde privée pour analyse.
6. Ne pas copier de contenu client dans Git, les logs partagés ou un ticket public.

La suppression complète d’un dossier, la conservation configurable et la restauration sélective ne disposent pas encore d’interface ni de commande métier en V1. Elles nécessitent une phase dédiée avant exploitation avec données réelles à plus grande échelle.
