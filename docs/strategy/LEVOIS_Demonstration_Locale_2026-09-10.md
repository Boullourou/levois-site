# Démonstration locale complète de LEVOIS

Depuis le worktree cible :

~~~powershell
npm run dev:experience
~~~

La commande exécute scripts/dev-experience.mjs. Elle construit Astro, applique db/schema.sql et db/experience.sql à une D1 strictement locale, puis démarre le vrai runtime Pages sur **http://127.0.0.1:4333**.

- Expérience publique : http://127.0.0.1:4333/
- Lecture de la session : http://127.0.0.1:4333/lecture/
- Opérateur : http://127.0.0.1:4333/cockpit/relectures/

L’interface opérateur utilise un bypass réservé à 127.0.0.1 dans cette copie locale. Le hostname localhost et les autres hôtes sont refusés. Le serveur écoute uniquement sur 127.0.0.1, pas sur le réseau local.

La demande de relecture ou d’échange est réellement enregistrée dans D1 locale et visible par l’opérateur. Son statut de notification reste honnêtement « indisponible ». La copie e-mail et l’envoi OTP restent indisponibles. Resend est vide et le secours Formspree, y compris pour l’ancien formulaire /api/lead, pointe vers un chemin local qui refuse l’envoi.

Le lanceur ne possède aucune commande de déploiement. Il retire les variables d’environnement d’envoi et d’authentification Cloudflare héritées et prépare une configuration séparée avec un identifiant D1 fictif. Les secrets CSRF/reprise sont aléatoires, locaux et renouvelés au démarrage, jamais affichés.

## Reprise d’un build déjà réalisé

Après npm run build, ou lorsque root a déjà construit la version exacte :

~~~powershell
node scripts/dev-experience.mjs --skip-build
~~~

Le build, les Functions et leurs modules sont copiés dans .wrangler/experience-local. Cette copie n’est pas surveillée en direct : arrêter puis relancer après modification du produit. Ctrl+C arrête le lanceur. Si 4333 est déjà utilisé, le lanceur refuse de remplacer le processus existant.

La D1 persiste séparément dans .wrangler/state/experience-local. Redémarrer conserve les demandes locales ; la suppression depuis l’opérateur les efface réellement. Les copies de code sont remplacées uniquement dans le répertoire généré .wrangler/experience-local, sans modifier les sources ou les données D1.

## Vérification de la démonstration

~~~powershell
node tests/experience-local.browser.mjs
~~~

Ce test utilise uniquement 127.0.0.1:4333 et des données fictives. Il vérifie le refus de localhost, les transports désactivés, une demande envoyée depuis le navigateur, sa conservation réelle, sa lecture exacte par l’opérateur puis sa suppression. Les requêtes navigateur extérieures sont bloquées.

Résultat observé : sept vérifications passées, aucune erreur JS et aucune requête extérieure. Rapport : artifacts/continuite-local/rapport.json. Capture : artifacts/continuite-local/demande-d1-locale.png.

Le contrôle runtime complémentaire peut être relancé ainsi :

~~~powershell
$env:LEVOIS_RUNTIME_BASE='http://127.0.0.1:4333'
node tests/experience-runtime.node.mjs
~~~

Il vérifie le middleware privé, CSRF, les refus d’origine et la création/suppression D1 d’un contexte fictif. Aucun envoi réel n’est réalisé.
