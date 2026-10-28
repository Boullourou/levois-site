# Mise en production LEVOIS — procédure préparée le 28 octobre 2026

**Document de préparation, pas autorisation d’exécution.** Aucun déploiement, migration de production, réglage, secret ou automatisation n’a été appliqué pendant sa rédaction. La lecture du schéma D1 décrite ci-dessous a été effectuée sans lire les demandes.

**Complément de conversion directe :** le contrat a été corrigé pour produire SITE.json depuis PRODUCTION.json seul. Les références de commit/preview ci-dessous décrivent les contrôles antérieurs ; la tête finale proposée est indiquée dans la PR après ses nouveaux checks. Les résultats J001 sans couverture sont des tests locaux isolés, pas une activation du contenu. Voir [la recette de conversion](VALIDATION_CONVERSION_DIRECTE_2026-10-28.md).

## Deux décisions distinctes

| Lot | Objet | Autorisation et effets |
|---|---|---|
| **A — corrections** | Fiabilité éditoriale, formulaires, synthèse immédiate, catalogue et contrat Limova | Après recette distante et validation du commit : migration additive du reçu de contact, puis fusion de la PR. L’intégration Git existante publie `main` sur levois.fr. Le calendrier reste dormant. |
| **B — planification** | Builds des articles dus à 07:00 Europe/Paris | Décision séparée après A et recette du planificateur en preview. Environnements/secrets/variables GitHub à vérifier, puis activation explicite. A n’autorise pas B. |

Le site reste Astro statique pour les pages publiques, avec Pages Functions et D1 pour les demandes. Les articles passent par des fichiers JSON relus dans Git ; aucun CMS ni endpoint Limova n’est créé. Le contrat détaillé est [CONTRAT_LIMOVA_2026-10-28.md](CONTRAT_LIMOVA_2026-10-28.md), complété par le [protocole de lots](PUBLICATION_LOTS_LIMOVA_2026-10-28.md), le [contrat d’adaptation PRODUCTION.json](CONTRAT_ADAPTATEUR_PRODUCTION.md) et le [Markdown V2](CONTRAT_MARKDOWN_EDITORIAL_V2.md).

## État observé et identités à revérifier le jour de l’exécution

| Élément | Valeur observée |
|---|---|
| Dépôt / projet Pages | `Boullourou/levois-site` / `levois-site` |
| Compte Cloudflare | `0f0bffd8e630cc790af849a70ff0e768` |
| Production | Branche `main`, commit `3737bc944e4a926509054f8c5001f9448cd290a5` |
| Déploiement de retour arrière observé | `723ae144-3a72-4ec5-ab0c-571be11ae4e8`, production, réussi |
| Candidat de correction contrôlé | `27165fe918a7391ad2b0e9f7ee42e1a7d101a155` sur `codex/editorial-conversion-20261028` ; figer la tête finale de PR indiquée au compte rendu avant exécution |
| Preview de ce candidat | `https://0a251104.levois-site.pages.dev` ; déploiement réussi, quatre checks verts ; recette réelle sur `70e7abb`, suivie uniquement de documentation et captures |
| `RECHERCHE_DB` production | `077d24f8-5efc-4787-a451-05b041ddd2f7` |
| `RECHERCHE_DB` preview | `308c98e9-d484-4fdd-9892-539abb6b0ffd`, distincte de la production |
| Intégration Git existante | GitHub, déploiements de production activés sur `main`, previews de toutes les branches, `npm run build`, sortie `dist` |

Preuves d’inspection actualisées le 28 octobre à 15:19–15:23 UTC : `artifacts/release-readiness-20261028/` (déploiements, configuration GitHub, schéma D1, portée Access). Ces relevés datés ne remplacent pas une lecture juste avant intervention. Une nouvelle modification du code implique un nouveau SHA, une nouvelle preview et les contrôles concernés ; ne pas déployer un SHA différent de celui validé.

Les extensions de traitement par lots, couvertures et reçus sont incluses dans ce candidat et testées localement/CI. Leur présence n'active pas le calendrier. Aucun JSON d'article réel n'est présent dans `src/content/editorial` : la validation J001–J007 reste isolée dans les artefacts ignorés. Aucune publication automatique réelle de lot n'est encore validée.

Les secrets `RESEND_API_KEY`, `LEAD_FROM`, `LEAD_TO` existent dans les deux environnements, mais leurs valeurs chiffrées n’ont pas été consultées. Les sept messages de recette preview ont été reçus et confirmés par Mouaad ; cela ne prouve pas le routage de production, dont les réglages doivent être préservés. Préserver aussi les secrets Access/cockpit et ceux de reprise protégée déjà présents en production. Aucun ajout de binding `COCKPIT_DB` à la production n’est nécessaire pour cette livraison : l’avertissement Wrangler sur sa non-héritabilité ne justifie pas une modification.

## Ce que bloque réellement l'accès machine

| Opération | État et portée |
|---|---|
| Navigateur connecté de la preview | Recette réelle effectuée : sept réceptions et deux rejeux sans nouvelle tentative d'envoi. |
| Runner automatisé sur la preview | Bloqué par Access : les GET sans session autorisée sont redirigés en HTTP 302. Le runner ouvre un autre navigateur et n'hérite pas de la connexion humaine. |
| Vérification machine du manifeste et des URL preview | Même blocage Access pour les lectures des jobs `plan` et `verify`. Le manifeste a été lu avec succès dans le navigateur connecté. |
| Build local/CI et intégration Git Cloudflare | Non bloqués par cette absence d'accès : checks et previews existantes réussis. |
| Site public et lectures futures du manifeste public | Aucun challenge Access observé : accueil public HTTP 200. Le manifeste de l'ancienne production est HTTP 404, car cette route n'est pas encore publiée ; contrôler son HTTP 200 après A. |
| Publication programmée de production | Pas de dépendance aux credentials Access de preview dans le workflow. B reste néanmoins désactivé et nécessite séparément un lot valide, sa revue, les credentials de déploiement Actions et la recette de son fonctionnement. |

La mise en production A ne demande aucun élargissement d'accès. Au relevé GitHub, aucune variable éditoriale, aucun secret Actions du dépôt et aucun environnement ne sont configurés. Le cron est dormant sans `LEVOIS_EDITORIAL_SCHEDULE_ENABLED=true`. Un déclenchement manuel peut exécuter `plan`, mais ne déploie pas par défaut ; la production exige aussi `LEVOIS_EDITORIAL_PRODUCTION_ENABLED=true` et `main`. Aucun de ces éléments n'a été activé. Une éventuelle authentification machine de preview sera décidée seulement pour les contrôles B qui en ont besoin, avec une politique compatible et limitée ; un jeton seul ne suffit pas. [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/).

## A1 — Préconditions et recette de la version exacte

1. Relire les [résultats de recette distante](RECETTE_DISTANTE_RESULTATS_2026-10-28.md) : trois diagnostics, un contact, sept acceptations Resend, sept réceptions confirmées par Mouaad et deux rejeux sans tentative supplémentaire. Ne pas renvoyer ces messages automatiquement. Les tests de pannes simulées, stockage refusé, no-JS et Axe restent locaux/CI quand non rejoués à distance ; cette limite ne bloque pas la revue de A au vu des contrôles réellement obtenus.
2. Conserver la séparation preview/production. Aucun prospect réel ni téléphone n'a été utilisé ; un éventuel test d'e-mail en production nécessiterait son propre destinataire et volume autorisés. Le contrôle après déploiement A décrit plus bas utilise par défaut des parcours sans envoi valide.
3. Relire la PR et consigner l’accord explicite pour A, le SHA testé, l’URL de preview, le créneau et l’opérateur. Confirmer que les variables d’activation du calendrier ne valent pas `true` ; si une activation inconnue est trouvée, arrêter et clarifier avant toute fusion.
4. Vérifier l’absence de fusion, de déploiement manuel et de job éditorial concurrents. Les verrous GitHub du planificateur ne verrouillent pas l’intégration Git Cloudflare.
5. Depuis le checkout propre du commit approuvé, rejouer les checks applicables si le code a changé. Les scripts `precheck`, `pretest` et `prebuild` génèrent les fichiers éditoriaux nécessaires ; ne pas les contourner en appelant Astro directement.

```powershell
git status --short
git rev-parse HEAD
npm ci
npm run editorial:check
npm run check
npm test
npm run build
node scripts/audit-editorial-seo.mjs --out artifacts/editorial-20261028/seo-release.json
```

Ne pas fixer arbitrairement `LEVOIS_EDITORIAL_BUILD_AT` pour un build de livraison : l’horloge doit être réelle. Le workflow transmet son instant réel de plan au build et à la vérification pour comparer le même catalogue ; cette transmission n’est pas une simulation de date. Les JSON futurs restent exclus jusqu’à leur échéance. Un article déjà dû dans le commit fusionné peut paraître au build de A, même sans activation de B : relire le catalogue avant fusion.

## A2 — Lecture du schéma avant migration

Wrangler local **4.152.0**, commandes vérifiées avec son aide. Les commandes de cette section sont de lecture. Elles doivent pointer explicitement vers `--env production`, jamais vers le binding par défaut qui désigne la preview.

```powershell
npx --no-install wrangler whoami
npx --no-install wrangler pages deployment list --project-name levois-site --environment production --json
npx --no-install wrangler d1 info RECHERCHE_DB --env production --json
npx --no-install wrangler d1 time-travel info RECHERCHE_DB --env production --json
```

Consigner le déploiement de production et le bookmark courant dans le dossier d’intervention privé. `d1 time-travel info` lit le bookmark ; il ne restaure rien. Ne pas exporter la base de prospects dans Git ou les artefacts publics.

Exécuter les cinq SELECT de [contact-delivery-check.sql](../db/contact-delivery-check.sql). Ils lisent uniquement `sqlite_master` et les métadonnées de colonnes/index, y compris lorsqu’une table manque. Sous PowerShell, cette invocation évite l’interprétation des commentaires multilignes par le lanceur `.cmd` et utilise le endpoint de requête, plutôt que le mécanisme d’import de `--file` :

```powershell
$schemaSql = (Get-Content -LiteralPath db/contact-delivery-check.sql | Where-Object { $_ -notmatch '^\s*--' }) -join ' '
node node_modules/wrangler/bin/wrangler.js d1 execute RECHERCHE_DB --env production --remote --command $schemaSql --json
```

**Résultat réel du 28 octobre 2026 :** `experience_requests`, `experience_notes`, `experience_access` et `experience_email_leads` sont présentes, avec leurs colonnes et index attendus ; leur DDL est cohérent avec les fichiers versionnés. `contact_delivery_receipts` et `idx_contact_delivery_created` sont absents. Les cinq réponses D1 portent `changes: 0`, `rows_written: 0`, `changed_db: false`. Aucune ligne de demande n’a été lue. Le contrôle a aussi été vérifié sur SQLite en mémoire, schéma vide puis complet, sans changement du schéma ni d’une ligne témoin synthétique.

Les statuts `PRESENT_REVIEW_DDL` demandent une comparaison des contraintes, types, valeurs par défaut et clés avec les migrations versionnées. **`IF NOT EXISTS` ne répare pas une table incompatible.** Si le schéma diffère de ce relevé, arrêter et préparer une migration spécifique ; ne pas tenter de suppression/recréation.

## A3 — Migration additive, uniquement après autorisation de A

Avec le schéma constaté, **seul `db/contact-delivery.sql` est à appliquer en production** avant que le nouveau formulaire de contact soit servi. Il ajoute une table de reçus (UUID, empreinte, état de transmission, compteurs et dates) et un index ; aucun message ni coordonnée dans cette table.

**Commande modificatrice préparée, non exécutée :**

```powershell
npx --no-install wrangler d1 execute RECHERCHE_DB --env production --remote --file db/contact-delivery.sql
```

Lire la cible affichée, vérifier l’UUID `077d24f8-5efc-4787-a451-05b041ddd2f7`, puis confirmer seulement dans le créneau approuvé. Ne pas utiliser `db/migrations` du cockpit, ne pas réappliquer de fixtures et ne pas toucher à `COCKPIT_DB`.

Rejouer immédiatement A2. Résultat attendu : cinq tables présentes, aucune colonne manquante, cinq index présents et DDL conforme. En cas de migration partielle, ne pas fusionner : ces créations sont idempotentes mais la reprise exige de vérifier ce qui existe réellement. Les fichiers `experience.sql` et `experience-email-leads.sql` restent des références ; leur application n’est pas nécessaire au vu de l’inspection de production.

## A4 — Déploiement Git et contrôle après publication

La voie retenue est **la fusion de la PR relue vers `main`**, qui déclenche l’intégration Git Cloudflare déjà active. Aucun second déploiement Wrangler parallèle, aucun changement de domaine, binding, secret, règle de cache ou commande de build.

Avant la fusion, vérifier que la tête de PR est toujours le SHA testé, que `main` n’a pas avancé de façon incompatible et que les checks obligatoires sont verts. Si la fusion crée un nouveau commit, enregistrer son SHA et vérifier que son arbre applicatif correspond au candidat approuvé ; relancer les checks sur le résultat de fusion en cas de conflit ou de modification. Ne pas présenter l’ancienne preview comme celle d’un code nouvellement changé.

Après le déploiement, utiliser `pages deployment list` ou le tableau de bord pour confirmer `environment=production`, `branch=main`, le **SHA résultant attendu** et l’étape finale réussie. Puis vérifier directement sur `https://levois.fr` :

- `/`, `/ressources/`, l’article corrigé `/ressources/marge-negociation-erreur-25000/`, les trois diagnostics, `/lecture/`, `/reprendre/`, `/contact/` et `/votre-rue/` ; aucun lien historique perdu.
- Canonicals de production sans paramètres de campagne, titre/extrait/JSON-LD cohérents ; `robots.txt`, sitemap et `editorial-manifest.json` effectivement servis. La preview doit rester non indexable, la production publique doit rester indexable selon ses règles existantes.
- Diagnostic jusqu’à la synthèse, sans soumission de coordonnées ; clavier, 390 px, accès direct au contact, absence de données personnelles dans l’URL.
- Réponses d’API invalides/antispam uniquement pour ce smoke par défaut : erreur explicite, aucun faux succès, `Cache-Control` excluant le cache public. Ne pas rejouer automatiquement les sept messages de preview en production.
- Manifeste réel cohérent avec le build publié. Le contrôle `node scripts/editorial-confirm.mjs --host https://levois.fr/` nécessite le manifeste local **du même artefact**, les sources correspondantes et aucune variable Access de preview dans ce processus. La version avec reçus vérifie ensuite chaque URL exacte (HTTP 200 HTML, canonical, H1, ID et révision) et écrit un rapport machine. L’empreinte éditoriale confirme le catalogue, pas le SHA de tout le code : conserver aussi la preuve Cloudflare du commit.

Une réception réelle en production est une validation distincte si elle est demandée : reconfirmer les destinataires de **production** et le volume autorisé. Aucun score de performance ou gain de conversion n’est déduit de la réussite de cette procédure.

## A5 — Retour arrière sans perdre les demandes

Déclencheurs : formulaire incapable de traiter les demandes, confirmations inexactes, défaut bloquant de navigation, exposition privée/cache public, contenu incorrect majeur. Conserver les UUID et heures techniques nécessaires au diagnostic, sans publier les messages ou coordonnées.

1. Identifier le dernier déploiement de production sain consigné avant A. La référence observée à la rédaction est `723ae144-3a72-4ec5-ab0c-571be11ae4e8` ; la revalider au moment de l’intervention.
2. Dans Cloudflare Pages → `levois-site` → Deployments, choisir ce déploiement **de production réussi**, puis l’action de rollback. Une preview n’est pas une cible valide. Cette opération doit être autorisée dans le plan de retour arrière de A. [Procédure Cloudflare](https://developers.cloudflare.com/pages/configuration/rollbacks/).
3. **Conserver toutes les tables, reçus et demandes.** Ne pas lancer de `DROP`, `DELETE`, remise à zéro ou restauration D1 globale. Un rollback du code n’exige pas de supprimer la table additive. Une restauration Time Travel écraserait les demandes reçues après le bookmark et ne fait pas partie du retour arrière courant. [Nature destructive d’une restauration D1](https://developers.cloudflare.com/d1/reference/time-travel/).
4. Vérifier le domaine, le SHA redevenu actif et les parcours sans envoi. Les demandes de synthèse déjà enregistrées restent en D1 ; les messages contact sont transmis par e-mail, leur table conserve seulement le reçu. Ne pas promettre une récupération du texte contact depuis cette table.
5. Ne jamais remettre `sending` ou `unknown` à `pending` pour forcer un renvoi : le fournisseur a pu accepter le message avant une réponse perdue. Confronter les références avec les traces du prestataire et la boîte destinataire, sans créer un nouvel UUID pour la même demande. Les reçus gardés évitent les doublons lors de la remise en service du code corrigé.
6. Préparer la correction ou le revert Git revu afin qu’un build ultérieur ne republie pas le défaut. Ne pas fusionner pendant la stabilisation du rollback. Si B avait été activé séparément, suspendre ses prochains déclenchements et annuler l’exécution en cours avant rollback ; ne pas supposer qu’une variable désactivée arrête un job déjà lancé.

## B — Activation éventuelle du calendrier, décision ultérieure

Le fichier `.github/workflows/editorial-schedule.yml` est opt-in. Une fusion dans `main` ne suffit pas à activer son cron tant que `LEVOIS_EDITORIAL_SCHEDULE_ENABLED` n’est pas `true`. Elle peut néanmoins déclencher le build Git ordinaire décrit dans A.

### Préparation et contrôle en preview

1. Après validation de A, inventorier les environnements GitHub existants, leurs protections et secrets **par nom seulement**. Prévoir `levois-editorial-preview` et `levois-editorial-production`, avec restriction de branche `main` et approbation du lot dans la PR. Des reviewers obligatoires d’environnement suspendent chaque job qui le référence : pour une publication autonome après revue des sept jours, décider explicitement d’une politique permettant les runs de `main` déjà relue sans accord quotidien. Ne pas modifier ces protections dans le présent mandat préparatoire.
2. Définir un responsable de supervision : retards, jobs manqués, expiration de credentials, validation éditoriale et réception Limova. Le site ne publie ni le carrousel de 11:30 ni la vidéo de 17:00 ; ces diffusions restent à vérifier côté Limova.
3. Confirmer la compatibilité réelle de l’application Access de preview avec une politique `Service Auth` dédiée. Une session de navigateur, un token de déploiement Pages et un jeton Access sont trois choses différentes. Créer un jeton de service ne suffit pas à l’autoriser. Voir la [recette distante](RECETTE_DISTANTE_LEVOIS_2026-10-28.md). Si incompatible, arrêter cette activation et décider séparément de l’architecture d’accès, sans désactiver Access.
4. Seulement après approbation de B, provisionner les secrets d’environnement nécessaires : `CLOUDFLARE_API_TOKEN` et `CLOUDFLARE_ACCOUNT_ID` pour le déploiement ; `CF_ACCESS_CLIENT_ID` + `CF_ACCESS_CLIENT_SECRET` dans l’environnement de preview pour ses GET de manifeste et d’articles exacts. Aucun secret Limova, aucun droit D1 nécessaire au planificateur. Les credentials Access ne vont ni au build, ni à la production, ni dans les URL/journaux.
5. Vérifier la valeur de `LEVOIS_EDITORIAL_PREVIEW_HOST` contre l’hôte effectivement créé. Le défaut `https://editorial-preview.levois-site.pages.dev/` est une configuration, pas une preuve d’existence. Le workflow publie sur la branche Pages `editorial-preview` ; la confirmation doit viser son véritable alias, pas une ancienne preview immuable.
6. Déclencher manuellement le workflow depuis le commit relu avec `target=preview`, `deploy=false`. Il compare le manifeste et construit si une modification est due. Puis, après examen de l’artefact, `target=preview`, `deploy=true`. Si le catalogue est inchangé, le build/déploiement peut être ignoré : ce résultat ne valide pas un envoi d’artefact qui n’a pas eu lieu. Tester avec un contenu légitime validé, sans antidater de publication ni ajouter un faux article public.
7. Contrôler SHA, manifeste, URL d’article, heure réelle et idempotence d’un second déclenchement. Un même `topicId` n’ajoute pas un second article. Le job indépendant `verify` relit aussi un catalogue inchangé : il peut reprendre une confirmation ratée après déploiement réussi sans redéployer. Une erreur Access, un manifeste invalide ou une redirection doit rester un échec, pas un succès caché.

### Lots, couvertures et signal de disponibilité

Préparer les sept journées avec `npm run editorial:batch -- --file chemin/LOT.json --out chemin/prepared`. SITE.json est généré depuis PRODUCTION, pas fourni en entrée ; le manifeste technique porte les chemins et l'identité stable de campagne. Les champs sont copiés ou extraits selon des règles explicites ; la date de rédaction inconnue est omise. `--review chemin/REVUE.json` vérifie la revue mais conserve les brouillons. L’étape distincte `--activate` exige cette revue, copie les articles `scheduled` dans la branche locale et **ne fusionne ni ne publie rien**. La couverture finale doit être déjà composée aux dimensions explicites après orientation EXIF ; elle est seulement compressée en WebP, sans crop ni redimensionnement, avec contrôle du budget. L'option de test unitaire sans image n'existe pas dans la préparation/activation du lot et aucune référence visuelle n'est remplacée par une image inventée.

Le workflow suit `plan → build → deploy → verify`. `verify` produit `editorial-publication-receipts-{preview|production}-{run_id}-{run_attempt}`, conservé trente jours, même si la vérification échoue. Les secrets Access sont limités à `plan` et `verify` en preview ; les credentials Pages restent dans l’étape Wrangler de `deploy`.

Limova lit les reçus par l’API GitHub authentifiée avec `Actions: read` sur le seul dépôt nécessaire. Il doit vérifier la provenance réelle du run, la branche/SHA attendus, l’identité/révision et toutes les preuves. `socialReady` vaut `true` seulement pour une passe complète confirmée sur **levois.fr** ; jamais en preview. La présence d’une URL calculée ou un simple job vert n’autorise pas la diffusion. La réception et l’idempotence des publications sociales restent à tester côté Limova ; le site ne publie rien sur les réseaux. Les commandes et formats exacts sont décrits dans [PUBLICATION_LOTS_LIMOVA_2026-10-28.md](PUBLICATION_LOTS_LIMOVA_2026-10-28.md).

### Variables d’activation

| Variable | Recette automatique de preview | Production, après décision séparée |
|---|---|---|
| `LEVOIS_EDITORIAL_SCHEDULE_ENABLED` | `true` seulement quand la preview automatisée est autorisée | `true` |
| `LEVOIS_EDITORIAL_TARGET` | `preview` | `production` |
| `LEVOIS_EDITORIAL_PRODUCTION_ENABLED` | absente ou `false` | `true` |
| `LEVOIS_EDITORIAL_PREVIEW_HOST` | alias preview vérifié | non utilisé par la cible production |

L’autorisation de production exige `main` et le drapeau dédié. Les réveils UTC `0,20,40 5,6,7,8 * * *` sont filtrés à **07:00 ≤ heure Europe/Paris < 10:00**, y compris les changements d’heure ; les tests couvrent les deux bascules 2027. `workflow_dispatch` force la comparaison hors fenêtre, mais n’avance pas l’échéance des articles. Une date future dans un JSON ne déclenche rien à elle seule.

07:00 demeure une cible : GitHub peut retarder le job, et checks/build/déploiement ajoutent leur durée. Ne pas promettre une publication à la seconde. Surveiller les échecs et le prochain rattrapage ; vérifier aussi les règles d’inactivité GitHub pour les workflows planifiés. La version existante refuse de publier si la branche source a changé pendant les tests, mais ne fournit pas de verrou transactionnel contre une fusion Git concurrente.

Pour interrompre B, remettre `LEVOIS_EDITORIAL_SCHEDULE_ENABLED` à `false`, arrêter les runs en cours et vérifier leur état ; garder les contenus déjà publiés et les données de demandes. Révoquer/faire tourner un jeton séparément selon sa nécessité et son propriétaire, sans toucher aux secrets du site par automatisme.

## Références et limites

- [Cloudflare — commandes D1](https://developers.cloudflare.com/d1/wrangler-commands/) ; syntaxe revérifiée avec le Wrangler local 4.152.0.
- [Cloudflare — jetons de service Access](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/) ; politique compatible à vérifier, aucune modification préparatoire.
- [GitHub — déclenchements planifiés](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
- Les résultats locaux sont consignés dans [AUDIT_CONTENU_CONVERSION_2026-10-28.md](AUDIT_CONTENU_CONVERSION_2026-10-28.md) et [AUDIT_FORMULAIRES_2026-10-28.md](AUDIT_FORMULAIRES_2026-10-28.md). La recette réelle et les sept réceptions sont maintenant acquises dans leur périmètre décrit dans [RECETTE_DISTANTE_RESULTATS_2026-10-28.md](RECETTE_DISTANTE_RESULTATS_2026-10-28.md) ; la suite distante complète et l'activation B restent distinctes.
