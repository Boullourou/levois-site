# Exploitation du cockpit

Ce runbook couvre le développement local et les D1 de preview **fictives**. Il n’autorise aucune opération sur une base de production ni aucune saisie réelle. Au 18 août 2026, Pages Preview est en Fail closed, mais Cloudflare Access n’est pas opérationnel et le Dashboard distant conserve encore l’ancien binding `RECHERCHE_DB` de production jusqu’au prochain push. Le cockpit reste **NO-GO données réelles**.

Les D1 `levois-cockpit-preview-phase2-5` et `levois-recherche-preview-phase2-5` sont isolées et sans donnée réelle, mais elles ne sont pas encore les bindings effectivement observés dans Pages. Les commandes de sauvegarde ci-dessous ciblent la base cockpit par son nom exact et ne valent pas validation de l’environnement Pages.

## Démarrage quotidien local

```bash
npm run db:cockpit:migrate:local
npm run dev:cockpit
```

Ne relancer `npm run db:cockpit:seed:local` que sur une base neuve, après avoir vérifié que les fixtures ne sont pas déjà présentes.

Avant une démonstration :

1. vérifier que l’URL commence par `http://localhost` ou `http://127.0.0.1` ;
2. vérifier que seules les données fictives sont présentes ;
3. vérifier que « Aujourd’hui » distingue état vide et erreur de base ;
4. ne jamais saisir de donnée réelle tant que [REAL_DATA_CHECKLIST.md](./REAL_DATA_CHECKLIST.md) n’est pas entièrement verte.

## Sauvegarde locale

Un export D1 peut contenir l’intégralité des données. Pour toute future base réelle, choisir un chemin absolu privé **hors du dépôt**, chiffré et protégé par les contrôles d’accès du poste.

```bash
npx wrangler d1 export levois-cockpit-local --local --config wrangler.cockpit.toml --persist-to .wrangler/state/cockpit --output "<CHEMIN_PRIVE_HORS_REPO>/levois-cockpit-local.sql"
```

Après l’export :

- vérifier que le fichier existe, n’est pas vide et n’est pas suivi par Git ;
- calculer une empreinte SHA-256 et la conserver avec la date, l’environnement et la dernière migration, hors Git si l’export contient des données réelles ;
- chiffrer la sauvegarde avant toute copie vers un autre support ;
- ne jamais joindre le fichier à une issue, un email non chiffré ou une pull request.

## Restauration locale isolée

Ne jamais restaurer par-dessus la base courante pour un test. Utiliser un autre état Wrangler :

```bash
npx wrangler d1 execute levois-cockpit-local --local --config wrangler.cockpit.toml --persist-to .wrangler/state/cockpit-restore-check --file "<CHEMIN_PRIVE_HORS_REPO>/levois-cockpit-local.sql"
npx wrangler d1 execute levois-cockpit-local --local --config wrangler.cockpit.toml --persist-to .wrangler/state/cockpit-restore-check --command "PRAGMA foreign_key_check;"
```

Vérifier ensuite les migrations, les comptages attendus et ouvrir le cockpit sur cet état isolé. Ne remplacer une base active qu’après validation du contenu et avec une sauvegarde antérieure disponible.

## Sauvegarde de la D1 preview fictive

La cible autorisée pour la Phase 2.5 est exactement :

- nom : `levois-cockpit-preview-phase2-5` ;
- UUID : `88539c49-0d41-42df-a3b1-1a269e1acbe3` ;
- environnement : `preview` ;
- contenu : fixtures fictives uniquement.

Avant l’export, relire ces quatre éléments dans `wrangler.toml` et confirmer que la cible n’est ni `levois-recherche`, ni une D1 de production.

Pour le test Phase 2.5 avec fixtures uniquement, des fichiers éphémères sous `.wrangler/backups/` sont acceptables car `.wrangler/` est ignoré. Ils devront être supprimés après la recette. Une future sauvegarde réelle doit impérativement vivre dans un emplacement privé hors dépôt.

```bash
npx wrangler d1 export levois-cockpit-preview-phase2-5 --remote --config wrangler.toml --env preview --output .wrangler/backups/levois-cockpit-preview-phase2-5-2026-08-18.sql
```

Résultat du snapshot complet fictif :

- taille : `73 869` octets ;
- SHA-256 : `3F7713A8EEFFC09EE773F98C39182C3AFB4F7707B5BAF758971B03D36D311468` ;
- emplacement : `.wrangler/backups/`, confirmé ignoré par Git ;
- contenu contrôlé : fixtures fictives uniquement.

Le snapshot complet Wrangler n’a pas été importable en une seule étape dans une D1 vide : des triggers étaient créés avant les tables qu’ils référencent (`no such table: main.project`). Cette tentative a été conservée comme preuve d’échec ; elle ne constitue pas une restauration valide.

La première cible `levois-cockpit-restore-test-phase2-5` (`629bb438-21c7-45e3-8ebc-cf0ef101d80a`) subsiste comme base de test partielle, sans donnée réelle et sans binding Pages. Elle doit être supprimée après validation explicite de son nom/UUID ; ne jamais l’utiliser comme restauration.

La restauration réussie utilise en complément un export **données seules**, table par table, dont le schéma est reconstruit depuis les migrations versionnées :

```bash
npx wrangler d1 export levois-cockpit-preview-phase2-5 --remote --config wrangler.toml --env preview --output .wrangler/backups/levois-cockpit-preview-phase2-5-data-2026-08-18.sql --table person --table contact_method --table consent_event --table project --table project_party --table project_relationship --table buyer_search --table search_scenario --table criterion_event --table interaction --table task --table decision --table advisor_profile --table tim_agreement --table tim_agreement_party --table tim_agreement_terms --table tim_agreement_allocation --table tim_status_event --table tim_compensation --table tim_payment --table audit_event --table lab_observation
```

Résultat données seules : `29 220` octets, SHA-256 `0F767DAC9B4E7275B42CD590053AD69185ED1DDDD4C10091EFB392F914C8BB3C`.

## Restauration distante de test

La restauration doit viser une nouvelle D1 séparée, jamais la source :

- nom : `levois-cockpit-restore-test-phase2-5-v2` ;
- UUID : `b1358142-fb12-4c80-a038-6ea099da4705` ;
- aucune liaison Pages ;
- aucune donnée autre que l’export fictif de la preview.

Créer la base, puis noter et relire l’UUID avant l’import. La commande de création ne doit être lancée qu’avec les droits Cloudflare attendus :

```bash
npx wrangler d1 create levois-cockpit-restore-test-phase2-5-v2
npx wrangler d1 migrations apply levois-cockpit-restore-test-phase2-5-v2 --remote --config .wrangler/restore-test.toml
npx wrangler d1 execute levois-cockpit-restore-test-phase2-5-v2 --remote --config .wrangler/restore-test.toml --file .wrangler/restore-drop-integrity-triggers.sql
npx wrangler d1 execute levois-cockpit-restore-test-phase2-5-v2 --remote --config .wrangler/restore-test.toml --file .wrangler/backups/levois-cockpit-preview-phase2-5-data-2026-08-18.sql
npx wrangler d1 execute levois-cockpit-restore-test-phase2-5-v2 --remote --config .wrangler/restore-test.toml --file .wrangler/restore-create-integrity-triggers.sql
```

Les deux scripts temporaires de triggers ont été dérivés des migrations 0001–0006, relus puis laissés sous `.wrangler/` sans être versionnés. Ils désactivent les 26 triggers uniquement pendant l’import de la copie isolée, puis les recréent. Après toute future migration, ils devront être régénérés et la restauration entièrement rejouée ; ne pas réutiliser aveuglément ces fichiers pour une base réelle.

Contrôler ensuite :

```bash
npx wrangler d1 execute levois-cockpit-restore-test-phase2-5-v2 --remote --command "PRAGMA foreign_key_check;"
npx wrangler d1 execute levois-cockpit-restore-test-phase2-5-v2 --remote --command "SELECT name, applied_at FROM d1_migrations ORDER BY id;"
npx wrangler d1 execute levois-cockpit-restore-test-phase2-5-v2 --remote --command "SELECT (SELECT COUNT(*) FROM person) AS persons, (SELECT COUNT(*) FROM project) AS projects, (SELECT COUNT(*) FROM buyer_search) AS buyer_searches, (SELECT COUNT(*) FROM criterion_event) AS criteria, (SELECT COUNT(*) FROM advisor_profile) AS advisors, (SELECT COUNT(*) FROM tim_agreement) AS tim_agreements, (SELECT COUNT(*) FROM tim_agreement_allocation) AS allocations, (SELECT COUNT(*) FROM tim_payment) AS payments, (SELECT COUNT(*) FROM lab_observation) AS lab_observations, (SELECT COUNT(*) FROM d1_migrations) AS migrations, (SELECT COUNT(*) FROM sqlite_schema WHERE type='trigger') AS triggers;"
```

Résultats obtenus sur la source **et** la restauration : `persons=3`, `projects=2`, `buyer_searches=1`, `criteria=11`, `advisors=2`, `tim_agreements=2`, `allocations=2`, `payments=0`, `lab_observations=1`, `migrations=6`, `triggers=26`. `PRAGMA foreign_key_check` ne retourne aucune ligne.

État de la restauration fictive : **validée**. La D1 de test n’est reliée à aucun projet Pages. Sa suppression ultérieure doit faire l’objet d’une validation explicite du nom et de l’UUID.

## Procédure en cas d’erreur ou suppression accidentelle

1. Stopper immédiatement les mutations ; ne pas « réparer » à la main dans la base atteinte.
2. Relever le nom, l’UUID, l’environnement, l’heure et la dernière commande connue, sans copier de donnée client dans les logs partagés.
3. Retirer temporairement le binding cockpit ou désactiver l’application concernée si l’intégrité ou la confidentialité est incertaine.
4. Exporter l’état atteint vers un emplacement privé pour analyse, sans écraser la dernière sauvegarde saine.
5. Créer une **nouvelle** D1 de restauration et y importer la dernière sauvegarde saine.
6. Appliquer seulement les migrations manquantes, puis vérifier `PRAGMA foreign_key_check`, `d1_migrations` et des comptages métier agrégés.
7. Rejouer la recette fonctionnelle et sécurité avec une identité autorisée.
8. Basculer un binding uniquement après validation humaine et conserver l’ancienne D1 en lecture seule pendant la période décidée.
9. Documenter l’incident, la correction, les limites de la sauvegarde et toute donnée perdue ; ne publier aucun contenu réel.

## Tâches et anomalies

Le cockpit considère comme ouverte une tâche `open`, `in_progress` ou `waiting`.

- Un projet en `new`, `qualifying`, `active` ou `paused` sans tâche ouverte marquée `is_next_action` apparaît dans « Sans prochaine action ».
- Un Accord TIM en `to_formalize`, `signed`, `omega_uploaded` ou `active` suit la même règle.
- Terminer la prochaine action sans en désigner une autre rend l’anomalie visible ; c’est volontaire.
- Une promesse issue d’une interaction reste dans « Retours promis » tant qu’aucune tâche associée terminée ou annulée ne la clôt.

## Export Obsidian

Depuis une fiche client :

- « Copier » place le Markdown dans le presse-papiers ;
- « Télécharger .md » génère un fichier à la demande ;
- le mode « avec coordonnées » inclut email et téléphone ;
- le mode « sans coordonnées » les omet.

Le fichier n’est pas publié sous une URL durable et le cockpit n’accède jamais au vault. Un export avec coordonnées doit rester dans un espace privé et être supprimé lorsqu’il n’est plus nécessaire.

## Incident ou doute de confidentialité

1. Ne plus saisir, modifier ni exporter de donnée.
2. Retirer le binding ou désactiver l’application cockpit concernée.
3. Révoquer et faire tourner `COCKPIT_CSRF_SECRET` et `COCKPIT_AUDIT_SECRET` si une exposition est possible.
4. Invalider les sessions Access et vérifier les politiques, journaux et événements Cloudflare.
5. Identifier la D1 exacte et préserver une sauvegarde privée pour analyse.
6. Ne copier aucun contenu client dans Git, les logs partagés ou un ticket public.
7. Ne rouvrir qu’après reprise complète de la checklist données réelles.

La suppression complète d’un dossier et la conservation configurable n’ont pas encore de commande métier ou d’interface auditable. Elles restent des limites bloquantes à arbitrer avant une exploitation durable avec des données réelles.
