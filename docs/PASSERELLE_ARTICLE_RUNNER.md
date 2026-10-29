# Passerelle ARTICLE → GitHub Actions — préparation seulement

## Ce qui change

ARTICLE télécharge les fichiers privés au moyen de **sa connexion Drive authentifiée**, dont la lecture a été démontrée. Il utilise uniquement Node et ses modules natifs pour calculer les empreintes et chiffrer les octets. Aucun npm, Sharp, Astro ni jeton Drive n'est requis dans Limova. Les URL Drive ne sont jamais utilisées comme URL publiques par le runner.

Le dépôt étant public, seuls une enveloppe et ses segments chiffrés y transitent. La clé publique est dans `config/editorial-intake/public.pem`. La configuration prévue est un secret privé dédié à l'environnement GitHub `levois-editorial-intake`, limité aux branches `codex/article-intake-*`. **Cet environnement et ce secret ne sont pas encore installés : la revue automatique a demandé une autorisation explicite.** Le verrou de réception `LEVOIS_INTAKE_ENABLED` reste absent ; il est distinct des verrous de publication. Ce secret n'est ni une connexion Drive ni une autorisation Cloudflare. Ne jamais transmettre de clé privée, cookie, URL de téléchargement signée ou texte source dans un commit, une PR ou un journal public.

La capacité d'écriture GitHub d'ARTICLE reste à démontrer. Nos propres accès GitHub ne la démontrent pas. La voie choisie exige création de branche, écriture de fichiers texte, commit et création/lecture d'une PR. Le déclenchement est un **push** des fichiers de réception, pas un appel API `workflow_dispatch` qui demanderait une capacité supplémentaire. Si le connecteur n'offre pas ces écritures ou refuse les segments de 256 000 caractères, arrêter et fournir le nom de l'outil, l'opération refusée et le code d'erreur sans identifiant secret. Aucun téléchargement Drive anonyme de remplacement.

## Protocole et frontières

1. ARTICLE reçoit ou trouve les sept journées. Il télécharge les octets originaux, pas une extraction Markdown ou une image d'aperçu. `LOT.json` décrit les chemins relatifs, la campagne et le lot. `PRODUCTION.json` reste la source éditoriale ; `SITE.json` reste une sortie du convertisseur.
2. `editorial-transfer-manifest.mjs` produit `TRANSFER.json` : version, identifiant de lot, mode, chemin du LOT et inventaire chemin/taille/SHA-256. Il ne modifie aucun fichier source.
3. `editorial-transfer.mjs` vérifie l'inventaire, sérialise de manière canonique, calcule `transferId`, puis chiffre RSA-OAEP SHA-256 + AES-256-GCM. L'identité du contenu est stable malgré l'aléa du chiffrement. Sortie : `ENVELOPE.json` et `chunk-NNNN.txt`, 256 000 caractères maximum par segment.
4. ARTICLE crée la branche `codex/article-intake-<transferId>` depuis le commit du socle indiqué dans l'instruction de test. Il ajoute uniquement ces fichiers dans `.editorial-inbox/`, idéalement en un commit via blobs/tree/commit/update-ref. Aucun fichier de code ou workflow ne doit être changé. Aucun écrasement forcé d'une référence.
5. Le push déclenche `editorial-intake.yml`. Ce workflow charge les scripts et le verrou de dépendances depuis un **commit immuable**, séparément des seuls fichiers chiffrés de l'entrée. Il installe Node depuis `.node-version`, npm 11.18.0 et `npm ci`, puis exécute les tests du récepteur.
6. Le runner déchiffre, vérifie intégrité, limites de taille, chemins, catalogue éditorial JSON courant de main, schéma, Markdown, sources et dates déclarées. Ce catalogue est téléchargé séparément en lecture seule ; aucun code de main ou de l'entrée n'est exécuté, et son commit figure dans le reçu. Il convertit via `prepareBatch`, puis prépare sept brouillons dans son checkout éphémère pour un build. Il ne pousse aucun résultat dans Git, ne déploie rien et ne dispose d'aucun secret Cloudflare. L'import ultérieur devra revérifier le catalogue à son tour : un reçu de préparation n'est pas un verrou exclusif sur une future fusion.
7. L'artefact du run contient `RECEIPT.json` lisible et le bundle préparé chiffré. `state: prepared`, `build: passed` et l'empreinte attendue sont requis. `intendedUrl` est une destination future, **pas une confirmation de disponibilité**. Aucun message social ne doit partir à partir de ce reçu.

Les droits d'écriture du dépôt permettent aussi de changer des workflows : ils doivent être réservés à des intégrations de confiance. Le pin protège contre l'exécution accidentelle de code provenant du lot ; il ne remplace pas la gouvernance des personnes pouvant modifier les workflows ou les environnements. Aucune nouvelle protection de `main` n'est présumée.

## Deux modes d'entrée

- `prepared-v3` : uniquement le lot J001–J007 déjà validé. Les quinze fichiers sont LOT + sept PRODUCTION + sept WebP. Les hashes de sources, WebP et rapports de compression sont fixés dans `approved-v3.json`. L'empreinte finale doit rester `76e272e575ccfccc53aa75b9a818601a53b601f4ac0b754650fc41beb114afea`. **Aucune recompression**. Les chemins du LOT sont adaptés en mémoire pour lire les WebP ; le LOT original, les dates et les textes ne changent pas.
- `source` : les prochains lots transmettent LOT + sept PRODUCTION + sept PNG finaux. Le runner exige 1600 × 900 et utilise le compresseur existant pour produire des WebP ≤ 500 000 octets. Aucune génération d'image. Un champ indispensable manquant ou un Markdown non pris en charge bloque le lot.

## Reprise et incidents

Le registre durable d'ARTICLE sur Drive doit conserver : batchId, transferId, commit du socle, référence de branche, PR, commit d'entrée, runId, tentative, empreinte de résultat, état, checkedAt et URL de l'artefact. Archiver aussi l'enveloppe chiffrée avant de perdre le sandbox.

Avant chaque écriture, chercher la branche et la PR par leur nom exact. Si elles existent, vérifier ENVELOPE.transferId, réutiliser le run réussi et ne pas recréer la PR. En cas de réception partielle, compléter les segments attendus depuis l'enveloppe archivée ; ne pas mélanger deux chiffrements. En cas de contenu différent, produire un nouveau transferId et signaler qu'il remplace le précédent ; la révision éditoriale reste indépendante et explicite. La préparation n'écrit jamais dans le catalogue durable, donc un rejeu ne crée aucun article supplémentaire.

Un nouvel essai du même workflow peut créer un nouveau run de contrôle, jamais une seconde publication. La concurrence est sérialisée par branche. Les noms d'artefacts incluent run et tentative, leur rétention est de 30 jours : **le registre Drive et l'archivage par ARTICLE sont nécessaires** pour une traçabilité d'un an.

`RECEIPT.json` expose stage/code/field quand possible. Codes utiles : INTAKE_KEY_MISSING, BRANCH_ID_MISMATCH, CHUNK_INVALID, DECRYPTION_FAILED, FILE_HASH_MISMATCH, V3_SOURCE_CHANGED, V3_COVER_CHANGED, CONTENT_VALIDATION_FAILED, BUILD_FAILED. Les détails et logs susceptibles de contenir un texte privé restent chiffrés. Si aucune étape de réception n'a démarré (installation/permissions), aucun faux reçu n'est produit : consigner l'échec du job et son URL. Une panne n'est jamais convertie en succès.

## Préparation ≠ publication quotidienne

Ce workflow n'a ni cron, ni commande d'activation, ni fusion, ni déploiement. Il ne change pas les variables du calendrier. Les dates dépassées sont signalées, jamais corrigées automatiquement. Le lot actuel conserve ses dates du 29 octobre au 4 novembre 2026.

La publication relève du workflow existant `editorial-schedule.yml`, toujours opt-in et désactivé. Son activation, l'import des articles relus, le choix d'un lancement commun aux trois formats et les accès Cloudflare feront l'objet d'une décision distincte. Avant automatisation durable, le socle d'intégration doit être revu et fusionné explicitement ; ce test de branche ne le fusionne pas. Le correctif de confirmation Windows de la PR #6 reste séparé.

Une routine Limova pourra lancer les préparations de lots sans retransmission manuelle par Mouaad **après** succès du test d'écriture et configuration explicite de la routine. Aucune routine n'est créée ici. Les horaires sociaux et leurs connecteurs restent entièrement gérés par Limova. Les posts avec lien doivent attendre le reçu de disponibilité publique produit après un vrai déploiement, pas ce reçu de préparation.

## Opérations humaines restantes

Test ARTICLE des écritures et archivage du reçu ; revue du code de passerelle et décision séparée de fusion ; validation éditoriale/factuelle du lot ; décision de dates communes et d'activation ; configuration initiale de la routine Limova et des accès de publication. La validation technique ne valide pas les faits et ne donne aucune autorisation de publication.

Références techniques : [événements GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), [secrets d'environnement](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets), [crypto Node](https://nodejs.org/docs/latest-v24.x/api/crypto.html).
