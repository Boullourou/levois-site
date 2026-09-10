# LEVOIS — Contrat de continuité publique, 10 septembre 2026

Ce backend est additif. Les API `/api/lead` et `/api/recherche` restent compatibles et inchangées. Les nouvelles expériences utilisent les routes ci-dessous. Aucun rattachement à un profil CRM n’est inféré.

## Quatre suites

| Suite | Chemin réel | Données / effet |
|---|---|---|
| Garder cette lecture | Export, impression ou copie navigateur | Aucun appel API, aucune identité. |
| M’envoyer cette synthèse, sans appel | POST /api/experience/actions, action=email-copy | E-mail vers le visiteur seul via Resend. Aucun dossier D1, copie à Mouaad, fallback Formspree ou permission commerciale. |
| Relecture écrite ciblée | Même route, action=review | Dossier opérationnel + notification à Mouaad. E-mail de réponse seulement ; aucun appel ni délai garanti. |
| Échange choisi | Même route, action=exchange | Dossier opérationnel + notification ; coordonnée correspondant au canal choisi seulement. |

Un HTTP 200 avec `saved:true` confirme l’enregistrement du dossier. `notificationSent:true` signifie seulement que le transport a accepté la notification ; ni livraison finale ni lecture humaine ne sont établies. Une copie conserve toujours `saved:false`.

## Contrat navigateur

POST JSON même origine, `Content-Type: application/json`, corps maximal 100 000 octets :

```json
{
  "requestId": "UUID v4 créé au moment de la validation",
  "action": "email-copy | review | exchange",
  "approved": true,
  "channel": "email | phone",
  "email": "adresse utile si canal email",
  "phone": "numéro utile si exchange + phone",
  "firstName": "facultatif, pas pour email-copy",
  "question": "facultative, pas pour email-copy",
  "context": "objet Context pour review/exchange uniquement, omis pour email-copy",
  "synthesis": "texte exact affiché dans l’aperçu",
  "consent": {
    "purpose": "copy | review | exchange",
    "textVersion": "2026-09-10",
    "acceptedAt": "date ISO du choix explicite"
  },
  "site_web": ""
}
```

L’interface retire les champs sans utilité au canal sélectionné ; elle n’envoie pas des coordonnées cachées. `channel` vaut `email` par défaut. Téléphone et e-mail ne sont pas collectés ensemble. `firstName` et `question` sont omis pour une copie. La validation lie intention, aperçu et permission ; aucune option d’opportunité ou newsletter n’est incluse.

`context` reprend le contrat partagé : version 1, identifiant, révision, projet buyer/seller/transition/local/audit, entrée, réponses avec valeur/provenance/date/révision, dates de contexte et lecture facultative. Taille maximale 65 000 octets, profondeur et nombre d’éléments bornés. Cette copie est une déclaration approuvée du visiteur : elle ne devient jamais une preuve vérifiée par le serveur. `synthesis` reste inchangée, maximum 30 000 caractères.

**Retry :** conserver exactement le même `requestId`, `consent.acceptedAt` et contenu en cas de répétition réseau. Tout changement de contenu ou d’intention exige un nouvel aperçu et un nouvel UUID. Un identifiant réutilisé pour un contenu différent donne 409, sans exposer le dossier antérieur. La contrainte UNIQUE et une acquisition atomique de l’envoi empêchent les dossiers et notifications simultanés.

Les réponses comprennent `ok`, `message`, `saved`, `notificationSent`, `notificationState`, et `requestId` pour une demande humaine. États d’envoi : sent, failed, unknown, unavailable. Une notification en cours concurrente est rendue comme unknown. Une panne réseau ou un HTTP 5xx est incertain : aucun retry automatique de cette notification, aucun basculement vers un second prestataire. Un refus certain peut être retenté explicitement avec le même dossier. Resend reçoit une clé d’idempotence stable. En l’absence de clé Resend, Formspree peut notifier Mouaad seulement. Une copie n’utilise jamais ce secours.

Erreurs 400 données ou permission, 403 origine/refus accès, 409 version différente, 413 corps trop grand, 415 format, 429 limite technique, 503 configuration/transport/stockage. La lecture doit rester affichée et exportable après toutes ces réponses.

## Reprise après échange

Le lien créé par Mouaad ressemble à `https://levois.fr/reprendre#acces=jeton`. Aucun nom, adresse, réponse ni identifiant de dossier n’y figure. Le jeton est aléatoire sur 256 bits ; seule son empreinte SHA-256 est stockée.

L’UI lit le fragment puis le retire immédiatement avec `history.replaceState`, avant toute mesure ou navigation. Elle le garde seulement en mémoire le temps de la vérification. Aucun jeton dans analytics, sessionStorage, logs ou query string.

1. POST /api/experience/reprise `{step:"challenge",token}` après action explicite de la personne. Réponse générique identique que l’accès existe ou non. Si valide, un code va uniquement à l’adresse déjà autorisée du dossier ; aucune adresse de destination libre n’est acceptée.
2. POST même route `{step:"verify",token,code}`. Code de huit chiffres, validité technique 10 minutes, consommation atomique unique. Cinq tentatives au maximum pour le lien ; demander un nouveau code ne remet pas ce compteur à zéro. Cinq codes au maximum pour un lien et au moins une minute entre demandes.
3. Succès : `{ok:true,context,synthesis,humanNote,provenance:{mode:"after-exchange",sharedAt,verifiedAt},message}`. La note contient id, text, reason, evidence, createdAt, author et kind. Elle reste séparée des réponses et de la lecture automatique.
4. Invalide, révoqué, expiré ou épuisé : 403 générique, aucun contenu privé. Proposer une récupération volontaire auprès de Mouaad ou un parcours autonome.

Un échec d’envoi du code invalide ce code en base. La réponse publique reste générique pour ne pas révéler l’existence d’un dossier. Le lien seul, même reçu par un tiers, ne donne accès à aucun projet. Une fois ouvert, le contexte est remis au navigateur pour confirmation/correction selon le contrat du core. La permission de reprise ne devient pas une permission de relecture ou de relance.

## API opérateur minimale

`/api/experience/operator` utilise exactement les gardes existantes Cloudflare Access (signature, audience, issuer, identité autorisée) et CSRF du cockpit. Le bypass local n’est possible que sur localhost/127.0.0.1.

GET sans paramètre : 100 dernières demandes (intention, prénom facultatif, question, statut), `csrfToken`.
GET `?id=UUID` : `request`, `notes`, `accesses`, `csrfToken`. Les empreintes et codes d’accès ne sont jamais renvoyés. Le détail du contexte et du consentement est présent sous forme JSON dans context_json et consent_json.

Toutes les mutations utilisent POST JSON, Origin exact, et `X-LEVOIS-CSRF` obtenu par GET. Chaque commande contient `operation` et `requestId`.

| operation | Champs supplémentaires | Effet |
|---|---|---|
| create-context | context, synthesis, email, firstName?, authorized:true, permissionEvidence, agreedAt | Enregistre un contexte établi après échange et sa trace d’accord. Peut démarrer sans demande publique préalable. Aucun envoi. |
| annotate | noteId UUID, text, reason, evidence, context? | Ajoute une note datée/attribuée ; ne remplace aucune déclaration. Le contexte révisé doit conserver son identifiant et une révision au moins égale. |
| create-access | noteId, authorized:true, expiresAt ISO, synthesis? | Crée un lien après accord de partage, vers l’adresse existante du dossier. Nécessite une note humaine. Une synthèse correspondante est obligatoire si cette note contient un contexte révisé. Retourne accessId,url,expiresAt. Aucun envoi. |
| revoke-access | accessId | Révoque le lien et son code. |
| set-status | status=open/answered/closed | Enregistre une déclaration explicite du statut humain ; aucun envoi. |
| retry-notification | — | Retente seulement un refus certain ou une configuration précédemment absente. Envoi incertain/en cours refusé en 409. |
| delete | confirm="delete-operational-request" | Supprime dossier, notes et accès dans D1. Les messageries externes restent à traiter séparément. |

`create-access` nécessite une échéance de sécurité future choisie explicitement par Mouaad. Aucune durée de conservation commerciale n’en est déduite. Les dossiers téléphoniques sans adresse ne peuvent pas recevoir de lien e-mail par déduction. L’opérateur peut créer un contexte après un nouvel accord direct explicite ; il n’existe aucun rapprochement automatique par nom ou adresse.

## Base et activation

`db/experience.sql` s’applique **uniquement à RECHERCHE_DB**. Le répertoire `db/migrations` appartient à COCKPIT_DB et ne doit pas être utilisé pour cette extension. Trois tables additives : experience_requests, experience_notes, experience_access. Le schéma est idempotent, sans donnée personnelle de fixture. Les clés étrangères propagent les suppressions du dossier aux notes et accès.

La base de production déclarée dans wrangler.toml est levois-recherche. La preview a une base dédiée. Aucune donnée de dossier distante n’a été lue ni modifiée pendant ce chantier. Le contrôle final en lecture seule porte sur les bindings et l’existence des tables, décrit ci-dessous. À l’activation autorisée : appliquer ce fichier sur l’environnement choisi avant d’y activer les demandes humaines. L’absence de schéma ou binding échoue explicitement ; elle n’affecte pas les lectures autonomes ou la copie Resend.

| Variable / binding | Rôle |
|---|---|
| RECHERCHE_DB | D1 des dossiers opérationnels et accès. Déjà déclaré dans wrangler.toml. Pas utilisé par email-copy. |
| RESEND_API_KEY | Secret d’envoi existant. Obligatoire pour copies visiteur et codes de reprise. Jamais renvoyé ni journalisé. |
| LEAD_FROM_EMAIL ou LEAD_FROM | Expéditeur vérifié. Défaut contact@levois.fr. La vérification réelle du domaine est à confirmer lors de l’activation. |
| LEAD_TO_EMAIL ou LEAD_TO | Destinataire des demandes humaines. Défaut mouaad@levois.fr. |
| FORMSPREE_ENDPOINT | Secours humain si Resend absent. Défaut formulaire historique xnjynroj ; seules URL HTTPS formspree.io acceptées. Aucun secours copie/code. |
| EXPERIENCE_ACCESS_SECRET | Nouveau secret aléatoire, minimum 32 caractères, pour HMAC des codes. Requis seulement pour reprise protégée. Une rotation rend les codes en cours invalides, sans invalider les liens hachés. |
| EXPERIENCE_PUBLIC_ORIGIN | Origine publique exacte, sans slash final. Exemple https://levois.fr. Sert à créer les liens lorsque l’opérateur utilise un autre hôte. |
| RATE_LIMIT | KV existant facultatif : compteurs techniques hachés expirant après la fenêtre. À défaut mémoire bornée best effort par isolate. Ce mécanisme n’est pas une limite globale atomique ; la protection Cloudflare en amont peut compléter la limite en production. |
| COCKPIT_ALLOWED_HOSTS, COCKPIT_ALLOWED_EMAIL, COCKPIT_ALLOWED_SUB | Autorisation opérateur existante. |
| CF_ACCESS_TEAM_DOMAIN, CF_ACCESS_AUD | Validation cryptographique Access existante. |
| COCKPIT_CSRF_SECRET | Protection des commandes opérateur existante. |
| COCKPIT_LOCAL_BYPASS | Seulement en test local : jamais utilisé pour un hôte distant. |

Cloudflare Access doit couvrir aussi `/api/experience/operator` sur l’hôte autorisé. La vérification interne reste obligatoire même si une règle de bord est oubliée : l’API échoue fermée sans assertion valide. L’interface de reprise et la lecture personnelle doivent être non indexées et exclure les identifiants privés de toute mesure.

Aucun nouveau secret n’a été créé dans un service distant. Aucun e-mail réel n’a été envoyé. La configuration distante de Resend/Access n’est pas présentée comme vérifiée par les tests locaux.

## Conservation

Session anonyme gérée par le frontend. Aucune sauvegarde de copie dans D1 ; le prestataire traite l’envoi demandé. Les demandes humaines sont des dossiers de travail pendant leur traitement choisi. Aucune purge ou conservation commerciale à durée inventée n’est activée. L’opérateur dispose d’une suppression réelle en base ; il traite séparément les copies reçues dans les messageries. Fermer une demande n’est pas supprimer ses données : l’interface doit permettre de choisir la suppression lorsque le dossier n’est plus nécessaire. Une politique de conservation longue requiert une décision ultérieure explicite.

Les codes/compteurs ont des échéances techniques de sécurité ; ce ne sont pas des durées de conservation de projet. Le schéma ne crée aucune liste de prospection, newsletter, matching ni relance.

## Vérifications

32 tests ajoutés dans tests/experience-api.test.ts, SQLite réellement exécuté, transports intégralement simulés. 43 tests historiques lead/recherche/Access également conservés. Vérification TypeScript ciblée avec compilateur temporaire, sans changement package.json/lockfile. Compilation locale `wrangler pages functions build` réussie.

Références techniques consultées : [Workers](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/), [D1 prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/), [idempotence Resend](https://resend.com/docs/dashboard/emails/idempotency-keys). La durée d’idempotence du prestataire n’est pas utilisée comme une conservation commerciale du site.


## Écran opérateur livré

La route privée /cockpit/relectures et son script src/scripts/cockpit/relectures.ts rendent ces commandes utilisables dans CockpitLayout existant. La navigation et le layout partagés sont inchangés.

La liste distingue intention et état. Le détail montre la synthèse exactement reçue, le canal autorisé, la question, les réponses/provenances et l’accord. Une note porte sa raison, ses éléments de vérification et sa date. La création de lien présente le contexte et la note exacts sélectionnés avant l’accord explicite de partage. La note la plus récente est sélectionnée par défaut ; une autre sélection invalide cet accord.

« Contexte après échange » réutilise les questions et moteurs buyer/seller/transition du site, avec champs non renseignés laissés inconnus. Les informations reprises portent la provenance imported ; le visiteur pourra les confirmer/corriger. Le formulaire demande l’adresse autorisée, la date et la trace d’accord, puis une relecture explicite de l’aperçu. Un contexte sans réponse peut être conservé à la révision zéro. Une correction part de la dernière révision humaine disponible et conserve la version précédente utile ; la version originale reçue n’est jamais remplacée. Toute saisie modifiée invalide l’approbation de l’aperçu.

La note, le lien et le contexte créé ne déclenchent aucun envoi. Le contexte créé directement par Mouaad porte notification_state=not-requested : aucune notification n’a été demandée. Seule la commande explicitement intitulée « Réessayer la notification » peut notifier, pour un refus certain ou une configuration absente. La suppression requiert une confirmation dédiée et rappelle le traitement séparé des copies en messagerie.

Recette navigateur : node tests/experience-operator.browser.mjs, serveur Astro local par défaut http://127.0.0.1:4396 (variable LEVOIS_QA_BASE). API intégralement interceptée, données fictives, toute origine extérieure bloquée. Lecture, note, correction, approbation, lien/révocation, contexte chaud, statut et suppression vérifiés. Captures 320/390/1440 et formulaire chaud 390 inspectés. Aucun débordement, erreur JS, requête extérieure ni violation axe. Rapport : artifacts/continuite-operateur/rapport.json.

Recette runtime : node tests/experience-runtime.node.mjs, Pages local par défaut http://127.0.0.1:8796 (LEVOIS_RUNTIME_BASE). Elle exerce middleware privé, CSRF, refus d’origine, création version zéro, note et suppression D1 d’une fixture. Aucun endpoint d’envoi exercé. Schéma appliqué avec Wrangler --local dans l’état isolé .wrangler/state/experience-qa ; aucune D1 distante contactée. Rapport : artifacts/continuite-operateur/runtime.json.

### Minimisation de la copie e-mail

Pour `email-copy`, le payload utile est exclusivement `requestId`, `action`, `email`, `synthesis`, `approved` et `consent` (purpose `copy`). Aucun contexte ni réponse détaillée ne doit être envoyé par l’interface. Un champ `context` provenant d’un ancien client est ignoré côté API : il n’est ni validé comme un projet, ni conservé, ni transmis au prestataire. La synthèse exacte est le seul contenu copié. Les actions `review` et `exchange` exigent toujours leur contexte approuvé complet.

### Commandes de vérification reproductibles

- API et compatibilité : node node_modules/vitest/vitest.mjs run tests/experience-api.test.ts tests/lead.test.ts tests/public-contracts.test.ts functions/_lib/cockpit/security.test.ts.
- Contrats navigateur publics simulés : node tests/experience-public-contract.browser.mjs (LEVOIS_QA_BASE pour le serveur local).
- TypeScript déjà téléchargé localement pour cette recette : node .cache/experience-typecheck/_npx/9ca470fa61f45e06/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --skipLibCheck --lib es2023,dom,dom.iterable functions/_lib/experience/common.ts functions/api/experience/actions.ts functions/api/experience/reprise.ts functions/api/experience/operator.ts src/scripts/cockpit/relectures.ts. Aucun ajout à package.json ou package-lock.json.
- La recette finale Pages utilise exclusivement .wrangler/state/experience-qa-final avec --local. La fixture créée est supprimée à la fin du scénario ; le serveur local est arrêté après vérification.



## État réel Cloudflare vérifié le 10 septembre 2026

Lecture seule effectuée après la recette locale : métadonnées Pages/D1/Access via le connecteur Cloudflare et état d’authentification Wrangler. Aucune valeur de secret, identité de politique ou donnée de dossier n’a été affichée. Une requête SELECT sur sqlite_master a contrôlé exclusivement l’existence des trois tables expérience ; aucun contenu de table métier n’a été lu ou modifié.

- Projet Pages levois-site : production sur main, domaines levois.fr, www.levois.fr et levois-site.pages.dev. Dernier déploiement de production observé : 7 septembre 2026, réussi. Aucun déploiement de cette version cible.
- Production : RECHERCHE_DB pointe sur levois-recherche (077d24f8…), existence de la D1 confirmée. Les trois tables expérience sont absentes : appliquer db/experience.sql constitue bien une étape d’activation nécessaire.
- Preview : RECHERCHE_DB 308c98e9… et COCKPIT_DB 88539c49…, séparées de production. Aucun binding KV ; RATE_LIMIT fonctionne donc actuellement avec son secours mémoire borné best effort.
- Production et preview comportent les noms de secrets RESEND_API_KEY, LEAD_FROM et LEAD_TO. Leur présence est confirmée, pas leur validité d’envoi ou celle du domaine expéditeur ; aucune valeur n’a été lue ni aucun message envoyé.
- Les variables CF_ACCESS_TEAM_DOMAIN, CF_ACCESS_AUD, COCKPIT_ALLOWED_HOSTS, COCKPIT_ALLOWED_EMAIL, COCKPIT_ALLOWED_SUB, COCKPIT_CSRF_SECRET, EXPERIENCE_ACCESS_SECRET et EXPERIENCE_PUBLIC_ORIGIN ne figurent dans aucun des deux environnements Pages inspectés.
- L’unique application Access observée couvre *.levois-site.pages.dev. Sa politique contient deux règles e-mail autorisées, aucune règle everyone et aucune exigence MFA dans cette politique. Elle ne couvre pas levois.fr/cockpit ni levois.fr/api/experience/operator. Les identités autorisées n’ont pas été exposées. Une politique et une application correspondant au chemin ou à l’hôte opérateur retenu doivent être configurées, puis leurs valeurs issuer/audience et l’identité autorisée raccordées au garde applicatif.
- Wrangler est authentifié par OAuth sur le bon compte, avec autorisations Pages et D1 ; le connecteur Cloudflare a lu Pages, D1 et Access avec succès. Il n’y a donc pas de blocage d’accès administratif constaté. Les étapes restantes sont de la configuration et de la validation d’activation, pas un backend simulé.

Avant usage distant : appliquer SQL, configurer et valider Access/CSRF pour l’opérateur, définir le secret de reprise et l’origine publique, vérifier la capacité Resend avec le domaine autorisé dans une recette d’envoi séparément autorisée. Les quatre suites locales et les contrats backend fonctionnent sans prétendre que ces étapes de production ont déjà été exécutées.

La recette navigateur publique finale valide 10 scénarios : copie sans contexte, relecture identique au retry, échange au canal choisi, export local, OTP huit chiffres et entrée known, import HTML inerte, refus de faux succès HTTP, accusé humain cohérent, notification incertaine sans renvoi automatique et maintien du contexte lorsque le stockage navigateur est refusé. Rapport : artifacts/continuite-public-contract/rapport.json. Toutes les API y sont simulées, aucune origine extérieure appelée.
