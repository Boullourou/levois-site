# Fiabilité des formulaires — 28 octobre 2026

Périmètre : `/situer-ma-vente/`, `/ma-recherche/`, `/vendre-et-acheter/`, `/lecture/`, `/contact/`. Changements préparés en preview, pas de publication en production par cette recette.

## Constats confirmés et corrections

| Constat | Preuve dans le dépôt | Correction / décision |
|---|---|---|
| Les synthèses récentes étaient cachées jusqu’à un enregistrement serveur avec coordonnées. | `diagnostic-reading.ts` testait `deliveryMode === email-arbitrage-v1` et affichait uniquement la capture. | Les trois blocs sont immédiatement accessibles après les cinq réponses. Copie par e-mail facultative, appel/écriture toujours disponibles. Les anciennes sauvegardes restent importables. |
| Le retour arrière et le rechargement exploitent déjà un contexte de session versionné. | `experience-journey.ts`, `experience/context.ts`, `diagnostic-reading-state.ts`. | Conservation du mécanisme, tests de retour/correction/rechargement et export. Aucune régression volontaire des méthodes historiques. |
| Le message « sauvegarde de session bloquée » existe dans le HTML, mais porte `hidden`. | `ExperienceJourney.astro`, `persist()` et règle CSS `[hidden]`. | Ce n’est pas un bug d’affichage démontré par extraction. Vérifier stockage normal puis refus réel ; le secours calcule la lecture dans la page sans stockage ni coordonnées. Message révisé pour proposer une copie téléchargée. |
| Les erreurs de questions étaient annoncées mais pas reliées aux champs. | `experience-journey.ts`, `<p data-error role=alert>`. | ID d’erreur, `aria-describedby`, `aria-invalid`, focus sur le premier choix et suppression des attributs à la correction. |
| « Votre site web » est un piège antispam correctement masqué. | `/contact/` : conteneur `hidden aria-hidden`, champ `tabindex=-1`, `autocomplete=off`. | Conservé. L’API renvoyait néanmoins `{ok:true}` au piège rempli : remplacé par un refus sans transmission ni faux succès. |
| Le contact direct empêchait le double clic dans la page mais pas une nouvelle tentative après réponse réseau perdue. | Ancien `/contact/` et `/api/lead` : nouveau UUID généré serveur à chaque POST, aucun reçu durable. | Payload et UUID figés dans le navigateur, reçu D1 atomique et clé d’idempotence du transport. Confirmation affichée uniquement pour `notificationSent:true` avec UUID concordant. |
| Sans JavaScript, le formulaire contact sans méthode explicite pouvait utiliser un GET natif et placer les coordonnées dans l’URL. | Relecture du balisage : absence de `method` et `action`. | `method=post`, `action=/api/lead`, bouton désactivé tant que le contrôleur n’est pas prêt ; alternatives e-mail/appel dans `noscript`. Recette navigateur sans JS : aucune donnée personnelle dans les requêtes GET. |
| Les trois questionnaires pouvaient aussi soumettre leur premier choix en GET natif sans JavaScript. | `ExperienceJourney.astro` : formulaire initial sans méthode, bouton actif avant initialisation. | Méthode POST sur le formulaire initial et le formulaire rendu ; bouton initial désactivé, remplacé par le contrôleur initialisé. Liens `noscript` méthode/ressources/contact conservés. Tests des trois parcours : aucun `answer` dans une URL, puis activation et progression normales avec JavaScript. |
| Les captures de diagnostic disposent déjà d’un reçu D1 et d’un verrou atomique par destinataire. | `experience_email_leads`, `email-leads.ts`. | Maintien ; blocage du submit programmatique quand le bouton est désactivé et distinction entre enregistrement et acceptation de l’e-mail. |
| Un contexte de lecture disponible était à recopier lors d’un contact direct. | L’ancienne page invitait à repartir de `/lecture/` mais ne joignait rien. | Aperçu du contexte + choix visible pour joindre la synthèse et les réponses ; envoi seulement après consentement du formulaire. Aucune réponse personnelle dans l’URL. |

## Hypothèse de conversion, pas promesse

Montrer le résultat avant de demander les coordonnées peut améliorer la confiance et la qualité des demandes. Ce n’est pas un gain démontré. Mesurer séparément fin du questionnaire, lecture du résultat, projet enregistré, e-mail accepté et message direct accepté. Un clic d’appel ne prouve ni appel réalisé ni demande qualifiée.

Les règles métier de calcul restent inchangées : résultat déterministe issu des réponses, limites visibles, aucune estimation automatique experte ou validation de financement. Les coordonnées sont facultatives pour lire/télécharger la synthèse. Le formulaire facultatif conserve les champs existants : prénom/e-mail, téléphone facultatif avec intention d’appel explicite.

## Livraison réelle et idempotence

Le nouveau contrat du contact courant fournit `requestId` UUID v4 stable. Le serveur enregistre seulement son hash de payload et l’état de transport dans `contact_delivery_receipts` ; il n’y stocke ni message, ni coordonnées. La notification utilise le transport existant et son destinataire configuré. Les autres formulaires historiques de `/api/lead` conservent leur contrat antérieur.

Précondition de preview et futur déploiement : appliquer **`db/contact-delivery.sql`** sur le binding **`RECHERCHE_DB` approprié**, après identification explicite de la base. C’est un ajout de table/index ; aucune table existante n’est supprimée. Ne pas utiliser la base de production pour une recette de preview.

- `pending/failed/unavailable` : nouvelle tentative autorisée avec le même identifiant.
- `sending/unknown` : aucune nouvelle émission automatique. Le fournisseur peut avoir accepté le message malgré la perte de confirmation.
- `sent` : retour de la confirmation déjà obtenue, sans nouvelle émission.
- Même UUID avec contenu différent : refus 409.
- Base indisponible : aucune émission du contact moderne et aucun succès annoncé.

Si le worker s’arrête après le verrou `sending`, il faut contrôler la référence chez le fournisseur. Ne remettre en attente qu’après avoir établi l’absence d’acceptation ; en cas de doute, conserver l’état et traiter le contact direct volontaire. Le dispositif ne prétend pas garantir « exactement une livraison » ni la réception/lecture dans une boîte. Les reçus minimaux doivent être intégrés à la politique de rétention avant une purge planifiée ; aucune suppression automatique ajoutée ici.

## Contexte et confidentialité

Seul un identifiant d’article public peut transiter dans `?article=`. L’ID est résolu dans le manifeste canonique ; titre/slug reçus du navigateur ne sont jamais considérés comme une autorité. La synthèse est jointe dans le corps POST uniquement avec le choix visible du visiteur. Le stockage navigateur bloqué ne bloque pas le formulaire direct.

Réponses API modernes : `private, no-store`, `noindex`, pas de secret côté navigateur. Les événements d’audience ne contiennent ni coordonnées, ni adresse recherchée, ni réponses libres. `synthesis_saved` signifie enregistrement serveur ; `synthesis_email_accepted` et `contact_message_accepted` signifient acceptation par le transport, jamais lecture humaine.

## Validation consolidée

- **90 tests API ciblés réussis** : lead historique, reçus de contact et APIs expérience. Contacts fictifs et transports simulés uniquement.
- **44/44 scénarios réussis sur le build compilé local**, sans HMR, aux largeurs desktop et 360/390/430 px : navigation, corrections, validations, double soumission, échecs/réessais, stockage refusé, contexte article, clavier, contact sans JavaScript. **15 contrôles Axe, aucune violation.** Rapport et captures : `artifacts/editorial-20261028/local-forms/`.
- **3/3 contrôles ciblés supplémentaires réussis après le dernier garde-fou des questionnaires et le build final** : pour chaque parcours, sans JavaScript aucune réponse dans une URL et liens utiles disponibles ; avec JavaScript, bouton actif et progression vers la deuxième question. Rapport : `artifacts/editorial-20261028/local-nojs-final/report.json`.
- **Toutes les soumissions navigateur de ces recettes sont interceptées.** Un scénario vert confirme le comportement face aux réponses simulées, pas une livraison effective ni l’enregistrement distant. Aucun contact réel et aucun vrai prospect utilisés.
- **Preview distante non validée** : `dbc4b9d3.levois-site.pages.dev` est protégée par Cloudflare Access ; le navigateur neuf reçoit une redirection d’authentification. Aucun scénario applicatif distant exécuté et aucun POST réel envoyé. Ce blocage d’accès n’est pas un défaut des formulaires. Détails : `artifacts/editorial-20261028/preview-forms/ACCESS_BLOCKED.md`.
- **Livraison réelle en attente** : elle exige un destinataire de test contrôlé, une session preview autorisée et une inspection de l’acceptation chez le transport / réception par le destinataire. Les headers et validations HTTP distants restent également à vérifier après authentification.

Commande de recette : `scripts/qa-short-diagnostics.mjs`. Le runner comprend désormais 47 scénarios : 44 ont passé la recette compilée complète, puis les trois nouveaux ont été rejoués sur le build final avec le filtre `Questionnaire sans JavaScript`. Les captures pleine page sont prises depuis le haut du document pour respecter la position du header fixe.

## Retour arrière

Revenir au commit de base pour le code de cette PR. La table additive peut rester en place pour conserver les reçus sans effet sur les anciennes routes. Ne pas effacer les reçus pendant une période de reprise réseau. Aucun changement de binding/secret Cloudflare n’est nécessaire au retour arrière du code.
