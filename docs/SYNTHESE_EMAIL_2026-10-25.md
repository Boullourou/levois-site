# Synthèse par e-mail et projet conservé

## Contrat et finalité

`POST /api/experience/actions`, action `synthesis-email`, ajoute la demande explicite de synthèse et le projet aux contacts qualifiés de Mouaad. Cette action ne demande ni appel, ni relecture humaine, ni newsletter ou prospection générale. Le formulaire explique cet enregistrement avant validation.

Le contrat historique `email-copy` avec consentement `2026-09-10` continue d’envoyer uniquement la copie au visiteur sans enregistrer de prospect. Il ne doit pas être utilisé par le nouveau formulaire.

Payload nouveau : `requestId` UUID v4, `action: "synthesis-email"`, `channel: "email"`, `email`, `approved: true`, `context` validé, `synthesis` exacte, `consent: {purpose: "synthesis", textVersion: "2026-10-25", acceptedAt: ISO}`. Aucun prénom ou téléphone n’est nécessaire.

## Schéma additif, avant publication

1. Vérifier dans la configuration existante quelle base D1 est liée à `RECHERCHE_DB` du projet Pages `levois-site`. Ne pas toucher à `COCKPIT_DB` et ne pas créer de binding.
2. Appliquer `db/experience-email-leads.sql` à cette base, après validation locale :

```powershell
npx wrangler d1 execute NOM_BASE_RECHERCHE_EXISTANTE --remote --file=db/experience-email-leads.sql
```

Le fichier ne contient aucune donnée personnelle ni suppression. `CREATE TABLE/INDEX IF NOT EXISTS` le rend réexécutable. Il ajoute seulement `experience_email_leads`. Vérifier les noms de colonnes avec `PRAGMA table_info(experience_email_leads)` sans lire de dossiers.

Sans cette table ou sans `RECHERCHE_DB`, l’action répond 503 et n’envoie aucun e-mail. Aucun réglage de fournisseur ou secret n’est modifié par le code.

## Enregistrement et états d’envoi

Le projet est enregistré avant toute tentative d’envoi. Il contient e-mail, contexte approuvé, synthèse, consentement horodaté et états d’envoi. Le même `requestId` et le même payload ne créent qu’un dossier ; un contenu différent sous cette référence est rejeté (409).

Les deux destinataires ont des états séparés : `copy_state` pour le visiteur, `advisor_state` pour Mouaad. Chacun a une prise en charge atomique et une clé prestataire stable. `pending`, `failed` ou `unavailable` peuvent être réessayés avec la même demande. `sending` et `unknown` nécessitent une vérification du prestataire avant toute réémission : aucun doublon automatique. `sent` signifie acceptation par le prestataire, pas réception ni lecture prouvée.

L’envoi visiteur utilise Resend exclusivement. La notification professionnelle peut utiliser le relais Formspree existant. Aucun envoi n’est effectué par la migration ou les tests.

Réponse après stockage : `{ok:true, saved:true, requestId, copySent, copyState, advisorNotificationSent, advisorNotificationState, notificationSent:copySent, notificationState:copyState, message}`. Une copie non confirmée ne supprime pas le projet. L’interface doit distinguer ces deux résultats et permettre le téléchargement immédiat.

## Consultation et suppression professionnelles

Les demandes sont notifiées à Mouaad et conservées dans `RECHERCHE_DB`. Elles ne sont pas présentées comme des demandes de relecture dans l’ancienne file du cockpit. L’accès D1 nécessite les autorisations Cloudflare existantes.

Pour diagnostiquer sans afficher de données personnelles, sélectionner uniquement `id`, `created_at`, `copy_state`, `advisor_state` et les compteurs d’essais. Pour consulter un dossier nécessaire au traitement, utiliser l’interface privée D1 de Cloudflare avec sa référence. Ne pas exporter les e-mails, contextes ou synthèses vers les journaux, captures d’audit ou dépôts Git.

La suppression par référence s’effectue dans la console privée D1 avec une requête ciblée : `DELETE FROM experience_email_leads WHERE id = 'REFERENCE_VERIFIEE';`. Vérifier d’abord la référence et le périmètre de la demande. Traiter séparément les copies présentes dans les messageries et chez les prestataires. Aucun effacement automatique ni durée arbitraire n’est ajouté ; la conservation reste liée au besoin exposé dans la page de confidentialité.

## Vérifications locales

`npm test` vérifie le stockage avant envoi, la portée du consentement, la séparation avec `email-copy`, la gestion des erreurs, les appels concurrents et les reprises idempotentes. `tests/experience-synthesis-workerd.test.ts` exécute aussi l’action livrée et le schéma SQL réel dans workerd avec une liaison D1 locale. Les prestataires sont simulés et les seules adresses acceptées sont des fixtures `example.test` ; toute autre sortie réseau est refusée.

La reprise navigateur se vérifie sur une prévisualisation locale :

```powershell
$env:LEVOIS_QA_BASE = 'http://127.0.0.1:4345'
node scripts/qa-resume-final.mjs
```

La recette refuse les hôtes distants, bloque les écritures non simulées et conserve les captures dans `artifacts/final-validation/reprise`.
