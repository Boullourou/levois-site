# Validation technique éditoriale — 28 octobre 2026

Cette note porte sur le contrat de transmission et le catalogue. Elle complète les tests des parcours, de la livraison et de la preview menés séparément. Aucun test décrit ici n'envoie un e-mail ni ne déploie en production.

## Contrat et réception

`src/lib/editorial/schema.test.ts` et `import.test.ts` : **24 tests réussis**.

- Payload complet, champs inconnus, HTML, identifiants et destinations interdits.
- Date impossible, fuseau manquant et mauvais décalage Paris refusés.
- Deux changements d'heure 2027 : 27/28 mars et 30/31 octobre, avec vérification juste avant puis à 07:00 locale.
- Exclusion des brouillons, archives et articles futurs, y compris au statut `published`.
- Collision avec les URL historiques, doublons de sujets/URL/créneau quotidien.
- Retry identique sans écriture, retry altéré et révision périmée refusés.
- Deux processus d'import lancés simultanément dans une copie isolée : un seul article, puis retry accepté sans copie supplémentaire.
- Aucun fichier du catalogue réel créé pour ces tests.

Le premier lancement sandbox a échoué avant collecte à cause d'un `EPERM` dans le cache temporaire Vitest. En définissant `TEMP` et `TMP` vers `artifacts/editorial-temp`, les 24 tests ont réellement été exécutés et sont passés. Ce problème d'environnement n'est pas présenté comme un défaut du site.

`npm run editorial:check` réussit : zéro nouvel article de démonstration, sept identités historiques réservées. `npm prebuild` génère le registre public et une horloge réelle commune, exclus de Git et reproductibles à chaque build.

## Build et préparation de livraison

Build Astro réussi : **54 pages**, mode `static`, génération de `/editorial-manifest.json`, du catalogue et des sitemaps. La commande Wrangler de compilation des Functions a également réussi dans une copie isolée des sources, avec les deux fichiers générés repris du build validé. Aucun appel de déploiement n'a été fait. Wrangler a signalé un refus d'écriture de son journal utilisateur dans la sandbox, sans échec de compilation du Worker.

Le workflow transporte désormais `dist/`, `article-registry.generated.json` et `build-clock.generated.json` dans le même artefact. Il ne reconstitue pas les identités avec une autre heure au moment du déploiement.

## Liens et SEO

Script réutilisable sans soumission de formulaire :

```sh
node scripts/audit-editorial-seo.mjs --out artifacts/editorial-20261028/seo-static.json
node scripts/audit-editorial-seo.mjs --base https://ADRESSE-DE-PREVIEW/ --out artifacts/editorial-20261028/seo-preview.json
```

La première passe sur le build a contrôlé 54 pages HTML, 88 cibles locales et 39 URL de sitemap. Aucun lien interne cassé n'a été trouvé. `robots.txt` et les fichiers sitemap existent réellement dans `dist`. Les dix pages du cockpit sont `noindex` et absentes du sitemap ; leur absence de balises sociales n'est pas un défaut SEO public.

Un écart a été repéré sur `/estimation-immobiliere-chartres/` : le `headline` du JSON-LD Article différait du h1. Il a été aligné dans la source, sans réécrire le contenu de cette page. Le champ Article `url`, facultatif et absent, n'a pas été traité comme une erreur puisque `mainEntityOfPage` est correct.

Le rapport statique initial conserve ce dernier écart car il décrit le build antérieur à la correction du titre. **Relancer le script après le build final** pour produire la preuve finale, puis avec l'URL de preview pour confirmer les réponses HTTP, l'image sociale, les canonicals de campagne et le `X-Robots-Tag`. Une réussite statique n'est pas présentée comme une vérification HTTP déjà effectuée.

## Limites d'exploitation explicites

- Aucun connecteur Limova n'a été configuré ni prétendu connecté ; le contrat JSON/PR et les commandes sont prêts.
- Le planificateur reste dormant par défaut. Aucun secret ni paramètre Cloudflare n'a été créé ou changé.
- 07:00 Europe/Paris est la cible ; le retard possible du planificateur, des tests et du déploiement est documenté.
- Une revue humaine reste nécessaire pour prouver les affirmations, les dates réelles et les droits des images.
- La compilation est un contrôle distinct de l'envoi et de la livraison effective d'une demande : ces derniers relèvent des tests des formulaires.
