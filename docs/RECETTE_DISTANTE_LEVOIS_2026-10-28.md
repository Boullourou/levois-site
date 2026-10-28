# Recette distante LEVOIS — protocole préparé le 28 octobre 2026

**Actualisation :** le protocole ci-dessous conserve son état de préparation historique. La recette exécutée sur le candidat `70e7abb`, les sept réceptions confirmées et les deux rejeux sont consignés dans [les résultats distants](RECETTE_DISTANTE_RESULTATS_2026-10-28.md). Les mentions « en attente » ci-dessous ne décrivent donc plus toutes l'état courant.

**À exécuter après ouverture autorisée de la preview et confirmation des destinataires.** Aucun envoi réel n’a été effectué pour rédiger cette procédure. Elle ne vaut ni validation distante ni autorisation de publication en production.

## Cible et état des preuves

- Candidat : `2d1fe76a82a0e0b939b440fe61f44deb1b8cda6a`.
- Preview immuable correspondante : `https://600d0e08.levois-site.pages.dev` ; à remplacer et revalider si le code change.
- Projet Pages : `levois-site`, branche `codex/editorial-conversion-20261028`.
- D1 preview : `308c98e9-d484-4fdd-9892-539abb6b0ffd`. Ne jamais employer `--env production` pour les vérifications des reçus de cette recette.
- Le déploiement Cloudflare est réussi. Les tentatives de navigation externes ont été redirigées par Access : elles ne prouvent aucun défaut applicatif et **aucun scénario applicatif distant n’est encore déclaré réussi**.
- Les résultats compilés locaux, les tests simulés et les captures déjà produits sont dans [AUDIT_FORMULAIRES_2026-10-28.md](AUDIT_FORMULAIRES_2026-10-28.md). Ils ne remplacent pas ce contrôle de livraison.

Les extensions d’adaptation par lots et de reçus ont été préparées après le SHA indiqué. Leur validation demande leur propre commit et preview immuable : ne pas attribuer à cette preview précédente les nouvelles fonctions non encore déployées.

## 1. Accès : trois canaux différents

| Canal | Prérequis réel | Limite actuelle |
|---|---|---|
| Navigateur humain | Connexion normale à l’application Cloudflare Access de la preview | La session appartient au navigateur connecté. Un navigateur Playwright neuf n’en hérite pas. |
| Scripts Node / navigateur automatisé | Autorisation machine compatible, ou recette interactive dans une session autorisée | `editorial-http.mjs` accepte un couple Access pour ses GET de manifeste et d’articles exacts ; `qa-short-diagnostics.mjs` n’importe ni cookie humain ni jeton Access automatiquement. |
| GitHub Actions éditorial | Secrets de l’environnement preview + politique Access qui les autorise réellement | Le token de déploiement Pages ne donne pas accès à la preview protégée. Les secrets Access sont limités aux lectures des jobs `plan` et `verify`, pas aux builds ni à la production. |

Vérifier le type de l’application Access qui couvre l’hôte exact, ainsi que la possibilité d’une politique **Service Auth** acceptant un jeton dédié. Une application SaaS ou une connexion humaine n’implique pas cette compatibilité. Un token créé sans politique adaptée peut toujours recevoir une page de connexion. Ne pas présumer que l’application Pages gérée accepte ce montage ; si ce n’est pas le cas, consigner le blocage et demander une décision d’accès séparée. [Documentation Cloudflare](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/).

Aucun contournement ni désactivation d’Access, aucune politique Bypass. Ne pas copier de cookie humain ou de secret dans le dépôt, une URL, une capture, un argument de commande ou un journal. Ne pas ajouter d’en-têtes secrets globalement à toutes les requêtes du navigateur : ils pourraient atteindre un domaine tiers. Toute éventuelle adaptation du runner pour l’authentification doit être relue et limiter les credentials à l’origine de preview validée.

Après connexion, obtenir une vraie page LEVOIS, puis `/editorial-manifest.json` en JSON, sans redirection ni HTML de connexion. Consigner hôte, heure, statut et SHA de déploiement, jamais les credentials. Si Access bloque encore, arrêter la recette distante ; ne pas traiter ces réponses comme des erreurs de formulaires ou de sitemap.

## 2. Destinataires et volume à faire confirmer avant tout envoi

Le code effectif est dans `functions/_lib/experience/email-leads.ts`, `functions/_lib/experience/common.ts`, `functions/api/lead.ts` et `functions/_lib/contact-delivery.ts`.

| Rôle | Résolution exacte | Confirmation attendue |
|---|---|---|
| Copie du diagnostic | Adresse saisie dans le formulaire | Une boîte de test contrôlée par Mouaad ou l’opérateur, autorisée pour ces messages |
| Notifications conseiller | `LEAD_TO_EMAIL`, sinon `LEAD_TO`, sinon l’adresse de repli du code | Adresse effective de **preview**, confirmée par son propriétaire ; la présence d’un secret chiffré ne révèle pas sa valeur |
| Expéditeur | `LEAD_FROM_EMAIL`, sinon `LEAD_FROM`, sinon valeur de repli de `sendMail` | Expéditeur/domaine autorisé chez Resend, sans remplacer les réglages existants pour le test |

La voie nominale est Resend si `RESEND_API_KEY` est présent. En son absence, les copies visiteur ne sont pas envoyées (`unavailable`) et seules les notifications humaines peuvent utiliser Formspree. Son destinataire n’est pas observable par le Worker : il faut le confirmer dans le service. **Ne pas utiliser ce secours comme preuve des sept livraisons attendues.** Si le routage est incertain, arrêter avant les soumissions.

**Volume nominal : quatre soumissions initiales → sept e-mails : trois à la boîte test et quatre au destinataire conseiller. Jusqu’à deux boîtes distinctes à confirmer, ou une seule si elles sont identiques.** Le formulaire contact n’envoie pas de copie au visiteur. L’adresse de réponse des notifications est la boîte test. Laisser le téléphone vide partout : aucune demande de rappel.

| Parcours / prénom synthétique | Messages à la boîte test | Notification au conseiller |
|---|---|---|
| Vente — `Recette Vente` | 1 × `Votre synthèse d’arbitrage LEVOIS` | 1 × `LEVOIS · Arbitrage demandé — Recette Vente` |
| Achat — `Recette Achat` | 1 × `Votre synthèse d’arbitrage LEVOIS` | 1 × `LEVOIS · Arbitrage demandé — Recette Achat` |
| Vente-achat — `Recette Transition` | 1 × `Votre synthèse d’arbitrage LEVOIS` | 1 × `LEVOIS · Arbitrage demandé — Recette Transition` |
| Contact — prénom `Recette`, nom `LEVOIS` | 0 | 1 × `LEVOIS · Message de Recette LEVOIS — RECETTE PREVIEW LEVOIS — contact — 2026-10-28` |

Les copies contiennent la synthèse exacte affichée, la référence et les limites de l’accord. Les notifications diagnostic contiennent aussi les réponses déclarées, le consentement et le contexte article éventuel. Utiliser seulement les situations fictives ci-dessous. Ces messages identifiés comme recettes ne doivent déclencher aucune relance commerciale, newsletter ou traitement comme nouveau prospect réel.

L’autorisation attendue porte sur ces sept messages et leurs deux destinations. Un retry réussi du **même UUID et du même corps** doit produire zéro message supplémentaire ; il ne fait pas partie d’un nouveau lot de sept. Une erreur incertaine ne donne jamais l’autorisation de renvoyer avec un nouvel UUID.

## 3. Recette automatique sans aucun envoi réel

Après adaptation/validation du canal d’authentification si nécessaire, le runner existant peut viser la preview :

```powershell
$env:LEVOIS_TEST_URL = 'https://600d0e08.levois-site.pages.dev'
$env:LEVOIS_QA_OUTPUT = 'artifacts/editorial-20261028/preview-forms-final'
node scripts/qa-short-diagnostics.mjs
```

**Ne pas exécuter en boucle tant que l’accès n’est pas acquis dans ce runner.** Il ouvre actuellement des contextes neufs. Un login dans un autre navigateur ne suffit pas.

Le script ne cible que localhost ou une preview `*.levois-site.pages.dev`, exclut la production et intercepte tous les POST. Ses fixtures utilisent `example.invalid`. Les cas de succès, échec réseau, double clic, retry et réponses malformées sont donc des **transports simulés**, même si les pages viennent de Cloudflare. Conserver ces interceptions ; ne pas les retirer pour transformer la suite entière en envois réels.

La suite actuelle attend 47 scénarios, dont les trois cas no-JS ajoutés aux questionnaires, et 15 analyses Axe. Contrôler le rapport réel, pas le nombre attendu. Pour une exécution complète, relever aussi les erreurs de console et les requêtes bloquées. Captures aux largeurs 360, 390 et 430 : synthèse avant saisie d’e-mail, contact vide, navigation et bandeau de confidentialité. Vérifier que le bandeau ne masque pas l’action, que les cibles restent accessibles et qu’aucun débordement n’apparaît.

Critères fonctionnels : progression et retour conservent les réponses ; résultat utile avant coordonnées ; stockage refusé sans écran vide ; import/reprise corrects ; aucune réponse personnelle dans l’URL ; chemin article → diagnostic → contact avec seulement l’ID public ; synthèse jointe visible et facultative ; clavier, erreurs annoncées et liens no-JS utilisables. Ne pas afficher de vraies coordonnées dans les captures destinées à la PR.

## 4. HTTP applicatif réel, sans demande envoyable

Depuis la session autorisée sur **la même origine**, contrôler les pages, `robots.txt`, sitemap et manifeste avec des GET directs. Capturer statuts/en-têtes applicatifs sans corps privé. Les GET de `/api/experience/actions` et `/api/lead` doivent être refusés par l’API, pas réussir comme des soumissions.

Deux POST invalides au maximum par endpoint suffisent : JSON `{}` puis JSON `{"site_web":"recette-antispam"}`. `Content-Type: application/json`, `Origin` correspondant à la preview ; aucun nom, adresse ou consentement valide. Les deux doivent donner une erreur applicative explicite (`400`, `ok:false`), sans écriture de demande ni envoi. L’API d’actions exige aussi l’origine même-site. Un `302` Access n’est pas un résultat applicatif ; un `429` nécessite d’attendre la fenêtre de limitation, pas de la contourner.

Vérifier `Cache-Control` interdisant le cache des réponses personnelles/erreurs : `no-store` sur l’API lead, et `private, no-store, max-age=0` sur les réponses partagées Experience/contact. Examiner aussi `X-Content-Type-Options: nosniff`. Ne pas annoncer ces headers comme confirmés avant d’avoir réellement atteint l’application.

Les endpoints limitent les tentatives ; `/api/lead` compte même les demandes invalides. Ne pas multiplier les essais : ses cinq tentatives sur dix minutes incluent le futur contact et son unique replay. Les compteurs sont best effort sans binding KV ; cette recette n’est pas une démonstration de résistance au spam distribué.

## 5. Quatre soumissions réelles autorisées, manuellement contrôlées

Utiliser un navigateur autorisé **sans interception de POST**, séparé de la suite simulée. Garder le panneau Réseau privé uniquement pour relever les UUID et états. Consigner le contact de test dans un dossier d’intervention privé, sans exporter le payload dans Git.

### Vente — `/situer-ma-vente/`

Réponses : « Pour déménager ou acheter ailleurs » → « Il y a déjà des visites » → « Les visites ne donnent pas d’offre » → « Dans les prochains mois » → « Comprendre les retours des acheteurs ».

Constater les trois blocs, les ressources adaptées et l’accès au contact. Ouvrir l’envoi facultatif, prénom `Recette Vente`, boîte test confirmée, téléphone vide, consentement explicite. Envoyer une seule fois et relever le requestId, le statut HTTP et les états copie/conseiller.

### Achat — `/ma-recherche/`

Réponses : « Je regarde les annonces » → « Je ne trouve pas le bon logement » → « La place pour vivre au quotidien » → « Pas encore » pour le financement → « Dans les prochains mois ».

Même contrôle de résultat avant coordonnées, prénom `Recette Achat`, même boîte test, téléphone vide. Aucune conclusion de capacité de financement ne doit être présentée comme un accord bancaire.

### Vente-achat — `/vendre-et-acheter/`

Réponses : « Je dois changer de secteur » → « J’ai repéré mon prochain logement » → « Vendre et me retrouver sans logement » → « Je ne souhaite pas de logement temporaire » → « Un échange est en cours » avec la banque.

Même contrôle, prénom `Recette Transition`, même boîte test, téléphone vide. La restitution doit expliciter les points à vérifier sans garantir prêt relais, prix ou synchronisation.

### Contact — `/contact/`

Depuis une ressource, reprendre son ID public et, si souhaité, joindre une des synthèses fictives après lecture de l’aperçu. Prénom `Recette`, nom `LEVOIS`, boîte test confirmée, objet exact : `RECETTE PREVIEW LEVOIS — contact — 2026-10-28`.

Message exact :

> Test technique autorisé de la preview LEVOIS. Cette situation est fictive. Aucun prospect réel, aucun rappel et aucune relance commerciale ne sont demandés. Merci de confirmer uniquement la réception de ce test dans le dossier de recette.

Vérifier le piège `site_web` masqué et vide, le consentement volontaire, puis soumettre une fois. Il n’y a pas de copie au visiteur. Si une synthèse est jointe, vérifier qu’elle correspond à l’aperçu et que son contenu n’a pas été placé dans l’URL.

## 6. Validation serveur, prestataire et boîtes : trois preuves

| Niveau | Diagnostics | Contact |
|---|---|---|
| Réponse serveur | UUID attendu, `ok:true`, `saved:true`, `copySent:true`, `copyState:"sent"`, `advisorNotificationSent:true`, `advisorNotificationState:"sent"` | UUID attendu, HTTP 200, `ok:true`, `notificationSent:true`, `notificationState:"sent"` |
| État durable | Une ligne par UUID dans `experience_email_leads`, copie et conseiller `sent`, compteurs cohérents | Une ligne par UUID dans `contact_delivery_receipts`, `sent`, compteur cohérent |
| Réception | Trois copies en boîte test + trois notifications conseiller, contenu conforme à la synthèse | Une notification conseiller avec le message fictif et le contexte choisi |

`saved:true` seul prouve un enregistrement, pas un e-mail. `sent` dans le contrat actuel signifie **accepté par le prestataire**, pas livré dans la boîte ni lu par Mouaad. Vérifier réellement les sept réceptions, l’absence de doublon, le dossier indésirables éventuel et, si disponible, le statut chez le prestataire. Ne pas répondre aux messages par un outil sans autorisation séparée : la vérification de boîte suffit.

Pour la preuve D1, après autorisation de la recette, interroger uniquement les UUID **de test** relevés, jamais une extraction générale des contacts. Exemples SQL à utiliser sur le binding preview par défaut, après validation stricte des UUID :

```sql
SELECT id, copy_state, advisor_state, copy_attempts, advisor_attempts
FROM experience_email_leads WHERE id = 'UUID-DIAGNOSTIC-DE-TEST';
SELECT id, notification_state, attempts
FROM contact_delivery_receipts WHERE id = 'UUID-CONTACT-DE-TEST';
```

Pas de `contact_email`, `context_json`, `consent_json`, synthèse ou texte dans les preuves partagées. Les placeholders ci-dessus doivent être remplacés par les références de cette session, pas par celles d’un prospect. La table contact ne stocke pas le message lui-même : l’absence de réception ne se résout pas en le cherchant dans ce reçu.

Après confirmation des sept réceptions, rejouer **une seule demande diagnostic et la demande contact**, avec leur payload et UUID inchangés, dans la session autorisée. Attendu : même état de succès, aucune nouvelle ligne ni tentative de transport, **zéro message supplémentaire**. Ne pas resoumettre les trois diagnostics depuis des formulaires vierges : cela créerait de nouveaux UUID et donc de nouvelles demandes légitimes. Préserver les limites de fréquence ; attendre leur fenêtre si nécessaire.

`failed`/`unavailable` permettent la reprise de la même demande après résolution de la cause. `unknown` ou `sending` peuvent signifier que le prestataire a accepté l’e-mail mais que la réponse a été perdue ou que le worker s’est arrêté. Dans ce cas : arrêt, rapprochement des références prestataire/boîtes, aucune remise à zéro d’état et aucun nouveau UUID. L’absence de doublon est protégée ; un envoi « exactement une fois » jusque dans la boîte n’est pas garanti.

## 7. Compte rendu et décision de clôture

Pour le complément éditorial, vérifier un vrai contenu légitime du lot approuvé, puis le reçu associé. `editorial-confirm.mjs` doit confirmer manifeste et URL exacte : HTTP 200 HTML, canonical de production, H1, ID et révision conformes. La preview peut produire `deploymentState:"verified"`, mais **`socialReady` doit rester `false`**. Le run de production futur doit avoir la bonne provenance GitHub et une passe complète réussie avant diffusion sociale. Rejouer la vérification d’un catalogue inchangé sans second déploiement et conserver l’artefact de reçu. Aucun envoi à LinkedIn/Facebook/Instagram/TikTok n’est effectué par cette recette du site. Voir [PUBLICATION_LOTS_LIMOVA_2026-10-28.md](PUBLICATION_LOTS_LIMOVA_2026-10-28.md).

Compléter ce tableau avec les preuves réelles ; ne pas cocher par déduction des tests locaux.

| Contrôle | Statut à la rédaction | Preuve à fournir |
|---|---|---|
| Access navigateur | En attente | URL immuable, heure, page LEVOIS réelle |
| Access scripts / Actions | Compatibilité à vérifier | Type/politique autorisée et GET de manifeste réussi, sans secret |
| Recette automatique distante | Non validée | Rapport réellement exécuté, captures 360/390/430, transports explicitement simulés |
| HTTP applicatif / cache / antispam | Non validé à distance | Statuts et headers des seules requêtes invalides |
| Trois diagnostics + contact réels | En attente des deux destinations confirmées | Quatre UUID de test, réponses serveur et états D1 |
| Livraison effective | Aucun message envoyé dans cette préparation | Sept réceptions confirmées, zéro prospect réel |
| Retry identique | Non exécuté à distance | Deux replays, zéro message supplémentaire |
| Production | Non déployée par cette préparation | Décision A séparée et [runbook de production](MISE_EN_PRODUCTION_LEVOIS_2026-10-28.md) |

Si un contrôle reste bloqué, livrer son état exact et sa cause. Un `ok` simulé, un job Cloudflare réussi ou une page Access lisible ne suffit pas à annoncer la chaîne article → réponse utile → demande qualifiée validée de bout en bout.
