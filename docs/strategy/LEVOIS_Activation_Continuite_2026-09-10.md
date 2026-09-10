# LEVOIS — Procédure d’activation de la continuité

Préparée le 10 septembre 2026. Aucune commande de mutation ci-dessous n’a été exécutée. La livraison actuelle reste dans le worktree cible ; ni main ni production n’ont été modifiés.

## Ce qui reste réellement

La version cible fonctionne : 75 tests API/compatibilité, 10 scénarios navigateur publics, opérateur desktop/mobile et runtime Pages/D1 local passent. Les vérifications Cloudflare en lecture seule confirment une session administrative utilisable et les services existants. Il reste une application/politique Access correctement ciblée, les paramètres Pages associés, une application de schéma SQL et une recette distante autorisée. Aucun nouveau CRM, fournisseur ou backend n’est nécessaire.

La copie e-mail dispose déjà des noms de secrets d’envoi en production. Les demandes humaines ne peuvent pas encore être conservées : les trois tables expérience sont absentes. L’opérateur et la reprise protégée ne peuvent pas encore fonctionner à distance : leur configuration Access/CSRF/secret est absente.

## Configuration cible proposée

Employer l’hôte déjà raccordé levois.fr et /cockpit/relectures. Cela évite de créer un domaine supplémentaire. La reprise visiteur reste sur https://levois.fr/reprendre.

1. Dans Cloudflare Zero Trust, créer une application Access Self-hosted dédiée, avec un même AUD pour les chemins privés ci-dessous. Utiliser les destinations publiques prévues par l’API Access actuelle :
   - levois.fr/cockpit et levois.fr/cockpit/*
   - levois.fr/api/experience/operator
   - levois.fr/api/cockpit et levois.fr/api/cockpit/* pour les routes privées existantes du layout.
2. Autoriser seulement l’identité exacte de Mouaad ; l’identité doit être la même que celle de COCKPIT_ALLOWED_EMAIL. Prévoir la vérification MFA du compte opérateur selon le mécanisme pris en charge par son fournisseur d’identité. Aucun everyone, bypass ou service-token exposé au navigateur. Conserver la couverture preview existante séparée.
3. Relever le domaine d’équipe et l’AUD de cette application. Le JWT doit porter le même issuer/audience sur le HTML privé et sur /api/experience/operator. Éviter une portée de cookie limitée au seul chemin /cockpit, qui empêcherait l’API située sous /api/experience d’utiliser la session.
4. Dans Pages → levois-site → paramètres → variables et secrets, sélectionner explicitement Production. Conserver tous les bindings et secrets existants. Ajouter :

| Nom | Valeur / traitement |
|---|---|
| CF_ACCESS_TEAM_DOMAIN | Domaine d’équipe Cloudflare Access réel. |
| CF_ACCESS_AUD | AUD de la nouvelle application privée, conservé comme secret. |
| COCKPIT_ALLOWED_HOSTS | levois.fr uniquement pour ce choix de routage. |
| COCKPIT_ALLOWED_EMAIL | Identité e-mail exacte de Mouaad, comme secret. |
| COCKPIT_CSRF_SECRET | Secret aléatoire indépendant, au moins 32 caractères. |
| EXPERIENCE_ACCESS_SECRET | Autre secret aléatoire indépendant, au moins 32 caractères. |
| EXPERIENCE_PUBLIC_ORIGIN | https://levois.fr |
| COCKPIT_ALLOWED_SUB | Facultatif : sujet stable du login positif, à ajouter après l’avoir vérifié sans journaliser le JWT. |

Générer et saisir les deux nouveaux secrets dans les outils de gestion des secrets ; ne pas les placer dans Git, une ligne de commande, un rapport ou une capture. Ne jamais activer COCKPIT_LOCAL_BYPASS à distance. COCKPIT_DB et COCKPIT_AUDIT_SECRET ne sont pas nécessaires pour les nouvelles routes de continuité ; les ajouter ne fait pas partie de cette activation.

L’API opérateur échoue fermée si un paramètre manque. L’application Access doit protéger exactement ces chemins, sans rendre les expériences publiques dépendantes d’un login.

## SQL exact, uniquement après autorisation d’activation

Depuis C:\Users\PC\.codex\worktrees\levois-experience-cible-20260909, inspecter une dernière fois db/experience.sql puis exécuter une seule application additive sur la D1 explicitement nommée :

~~~powershell
node node_modules/wrangler/bin/wrangler.js d1 execute levois-recherche --remote --file db/experience.sql
~~~

Vérification de métadonnées seulement :

~~~powershell
node node_modules/wrangler/bin/wrangler.js d1 execute levois-recherche --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('experience_requests','experience_notes','experience_access') ORDER BY name"
~~~

Le résultat doit contenir les trois noms. Ne pas employer db/migrations : il appartient à l’autre base cockpit. Ne pas recopier une base de production vers une preview. Pour une recette préalable sur preview, appliquer ce même fichier uniquement à levois-recherche-preview-phase2-5, avec sa propre configuration Access et ses propres secrets de recette.

Le schéma est idempotent et non destructif. S’il faut interrompre le lancement, laisser les routes privées fermées et conserver les tables ; aucune suppression de base ou de table n’est nécessaire.

## Livraison et recette

Une autorisation distincte de mise en ligne permettra ensuite le processus de livraison convenu par root. La simple configuration Pages ne publie pas le code de ce worktree ; les nouveaux paramètres doivent être présents dans le déploiement choisi. Ne pas fusionner ou déployer sous couvert de cette procédure.

Avant GO opérationnel :

- Hors session Access : aucun dossier n’est lisible sur les chemins privés, y compris appel direct de l’API. Sur les domaines non autorisés, le garde applicatif reste fermé.
- Avec le compte Mouaad : le GET opérateur retourne la liste et un CSRF utilisable ; mutation sans CSRF ou depuis une autre origine refusée. Tester un contexte fictif, une note, un lien/révocation puis la suppression de la fixture.
- Confirmer dans Resend le statut de l’expéditeur LEAD_FROM et les permissions de la clé déjà configurée. La présence du nom RESEND_API_KEY n’atteste pas ces propriétés.
- Après autorisation d’envoi vers une boîte de test contrôlée : copie uniquement vers cette boîte, aucun dossier ; relecture vers la destination humaine configurée avec une seule demande malgré retry ; échange avec le seul canal choisi.
- Pour le lien de reprise fictif : fragment retiré de l’URL, aucune donnée avant code, huit chiffres, un seul usage ; lien révoqué et code expiré refusés. Vérifier que le destinataire libre n’est jamais accepté par l’API de reprise.
- Tester un échec d’envoi contrôlé : la demande humaine conservée reste clairement distinguée d’une notification acceptée. L’état unknown ne provoque pas de renvoi automatique.
- Supprimer les fixtures D1 et traiter séparément les messages de test dans la messagerie. Ne jamais garder des captures contenant token, code ou adresse privée.

Ces contrôles distants servent à valider la configuration, pas à remplacer les 75 tests backend et 10 scénarios navigateur déjà passés. Aucune recette ne nécessite l’envoi à un vrai prospect.

## Seules décisions professionnelles restantes

Le brief a déjà autorisé une relecture écrite ciblée, sans appel imposé ni délai garanti, et un dossier opérationnel strictement nécessaire à la demande volontaire. Il a exclu la prospection générale et une conservation longue non décidée. Ces choix suffisent à délimiter les fonctionnalités livrées ; aucune nouvelle promesse commerciale ou prestation certifiée n’est introduite.

Pour le traitement distant réel, Mouaad doit assurer le suivi des demandes, la réponse aux droits et la clôture/suppression effective des dossiers et des copies en messagerie. Un critère opérationnel de suppression lié à la fin du traitement demandé doit être documenté ; « fermer » un dossier dans le logiciel ne l’efface pas. La CNIL admet l’information sur une durée ou les critères qui la déterminent, et rattache la conservation à la finalité : [information des personnes](https://cnil.fr/fr/informer-les-personnes), [durées de conservation](https://www.cnil.fr/fr/passer-laction/les-durees-de-conservation-des-donnees). Aucune durée commerciale chiffrée n’est déduite de ces sources.

Un archivage long, une conservation imposée par un futur mandat, ou une réutilisation dans le cadre SAFTI demanderait de préciser la finalité, le rôle professionnel et les obligations correspondantes avant son activation. Ce choix ne conditionne pas les parcours anonymes ni l’export local. Les paramètres techniques Access et l’identité de login relèvent de l’administration du service ; ils ne constituent pas un nouvel arbitrage sur le produit.
