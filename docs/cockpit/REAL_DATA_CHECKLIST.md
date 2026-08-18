# Checklist avant toute donnée réelle

> **Statut au 18 août 2026 : NO-GO.** Cette checklist n’est pas entièrement verte. Fail closed est activé, les audits et la recette locale sont verts, mais Cloudflare Access, Restrict previews, le hostname privé, le retrait effectif du binding D1 de production dans Pages, la base destinée aux données réelles et les règles de conservation/effacement restent à valider. Aucun dossier réel et aucun Accord TIM réel ne doit être saisi dans le cockpit, la preview, les fixtures ou Git.

Chaque case doit être cochée avec une preuve datée, sans secret ni donnée personnelle. Une case « non applicable » exige une justification écrite approuvée par Mouaad ; elle ne doit pas être simplement ignorée.

## 1. Périmètre minimal des données

### Données nécessaires autorisables

Une fois tous les gates verts, la V1 pourra stocker uniquement ce qui est nécessaire au suivi opérationnel :

- identité minimale : prénom, nom ou libellé d’usage ;
- email et téléphone facultatifs, uniquement si utiles au contact ;
- origine du contact et synthèse courte ;
- type, état, stade, objectif et calendrier des projets ;
- recherche acquéreur, scénarios, critères, certitude, source et historique ;
- résumés d’interactions et résultats utiles, sans contenu brut ;
- tâches, échéances, priorités, attente et prochaine action ;
- consentement `unknown` par défaut, puis événement de preuve seulement si une preuve existe ;
- pour un Accord TIM : référence/libellé minimisé, conseillers, nature, opération, termes, trois états, tâches et interactions utiles ;
- rémunération TIM : devise, points de base, unités monétaires mineures, statut, dates et référence interne minimale.

### Données interdites dans cette V1

- audio ou transcription brute ;
- copie intégrale d’email, SMS, WhatsApp ou compte rendu contenant plus que le résumé utile ;
- pièce d’identité, diagnostic, mandat, formulaire TIM, contrat, bail, compromis ou autre fichier ;
- adresse exacte d’un bien lorsqu’un libellé/secteur suffit ;
- IBAN, carte bancaire, information bancaire ou fiscale ;
- mot de passe, code MFA, cookie, JWT Access, secret Cloudflare ou clé API ;
- donnée sensible sans nécessité explicite, dont santé, opinions, religion ou situation familiale détaillée ;
- donnée d’un autre conseiller ou d’un tiers non nécessaire à l’accord ;
- donnée personnelle dans LEVOIS Lab, PostHog, les logs partagés, fixtures, migrations, captures ou Git.

### Gate minimisation

- [x] Le schéma V1 n’accepte ni audio, ni transcription, ni pièce jointe.
- [x] Les interactions utilisent un résumé structuré.
- [x] Les contacts sont facultatifs et les contacts uniquement TIM sont exclus de la liste Clients par défaut.
- [x] Les allocations sont en points de base et les montants en unités mineures.
- [x] L’export peut omettre les coordonnées.
- [ ] Mouaad a validé, champ par champ, que la liste « nécessaire » ci-dessus suffit au pilote réel.
- [ ] Une base légale, l’information des personnes et le traitement des consentements ont été validés pour le contexte réel.

## 2. Dépendances et non-régression

- [x] Astro final retenu : `7.2.3`.
- [x] `npm audit --omit=dev --json` observé à 0 vulnérabilité après migration.
- [x] Installation finale propre avec npm `10.9.2` rejouée, 0 vulnérabilité annoncée.
- [x] Audits runtime et complet finaux à 0 ; aucune HIGH runtime ouverte.
- [x] `npm test` 96/96, `test:cockpit` 55/55, sécurité 16/16, market 6/6 et build 33 pages verts.
- [x] Captures Astro 7 desktop/mobile comparées à la baseline ; aucune régression fonctionnelle retenue.

## 3. Cloudflare Access et hostname

- [ ] Organisation Cloudflare Zero Trust initialisée.
- [ ] Cloudflare Independent MFA, ou fournisseur d’identité équivalent, configuré avec MFA obligatoire pour Mouaad.
- [x] Pages Preview réglé sur **Fail closed**.
- [ ] « Restrict previews » activé.
- [ ] Application self-hosted couvrant l’hôte entier `cockpit.levois.fr`.
- [ ] Politique Allow limitée à l’unique identité de Mouaad avec condition MFA.
- [ ] Aucune politique Bypass, Service Auth ou Everyone autorisante.
- [ ] Audience dédiée et Team Domain relevés depuis Cloudflare, sans les placer dans Git.
- [ ] `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`, `COCKPIT_ALLOWED_HOSTS`, `COCKPIT_ALLOWED_EMAIL`, `COCKPIT_ALLOWED_SUB`, `COCKPIT_CSRF_SECRET` et `COCKPIT_AUDIT_SECRET` configurés dans le bon environnement.
- [ ] `COCKPIT_LOCAL_BYPASS` absent de tout environnement distant.
- [ ] Sans Access : refus avant toute donnée.
- [ ] JWT falsifié : refus.
- [ ] Mauvaise audience : refus.
- [ ] Mauvais issuer : refus.
- [x] Tests applicatifs : `nbf` absent ou futur refusé.
- [ ] JWT Access réel : présence de `nbf` confirmée après création de l’application.
- [ ] Utilisateur non autorisé : refus.
- [ ] Mouaad + MFA + JWT valide : accès.
- [ ] API appelée directement sans JWT : refus.
- [ ] `/cockpit/*` et `/api/cockpit/*` appelés sur le domaine public LEVOIS : refus.
- [ ] Aucun autre hostname, y compris une URL `pages.dev`, ne contourne la protection.

## 4. Bases et environnements

- [x] D1 preview séparée : `levois-cockpit-preview-phase2-5` (`88539c49-0d41-42df-a3b1-1a269e1acbe3`).
- [x] D1 recherche preview séparée : `levois-recherche-preview-phase2-5` (`308c98e9-d484-4fdd-9892-539abb6b0ffd`), schéma présent et 0 ligne.
- [x] Configuration Git préparée avec `COCKPIT_DB` et `RECHERCHE_DB` pointant vers ces deux bases non-production.
- [x] Migrations 0001–0006 seules appliquées à la preview.
- [x] Preview limitée aux fixtures fictives ; aucune donnée de production.
- [x] `PRAGMA foreign_key_check` sans anomalie sur la preview.
- [ ] Dashboard Pages après déploiement : `COCKPIT_DB` pointe sur l’UUID attendu.
- [ ] Dashboard Pages après déploiement : aucun binding ne pointe sur `levois-recherche` ou une autre D1 de production. État actuel : **rouge**, `RECHERCHE_DB → levois-recherche` est encore présent.
- [x] `/api/recherche` conserve un binding de schéma via la D1 fictive séparée, sans accès production.
- [ ] Après push, `/api/recherche` rejoué sur la preview et absence de donnée production confirmée.
- [ ] Une D1 distincte destinée aux données réelles a été créée seulement après autorisation explicite, sans réutiliser la preview ni `RECHERCHE_DB`.
- [ ] Le binding de cette D1 réelle est limité à l’environnement privé attendu et relu par deux contrôles indépendants.
- [ ] Aucun binding de production n’est accessible depuis une preview.

La D1 preview de Phase 2.5 ne doit jamais devenir une base réelle par simple changement d’étiquette.

## 5. Sauvegarde et restauration

- [x] Exports complet et données seules de la D1 fictive effectués sous `.wrangler/` ignoré ; tailles et SHA-256 consignés.
- [x] Données restaurées dans `levois-cockpit-restore-test-phase2-5-v2`, jamais sur la source.
- [x] Migrations 0001–0006, 26 triggers, clés étrangères et comptages fictifs vérifiés après restauration.
- [x] La base de restauration validée n’est liée à aucun projet Pages.
- [ ] La première cible partielle `levois-cockpit-restore-test-phase2-5` a été supprimée après validation explicite de son UUID.
- [ ] Pour les futures données réelles, emplacement chiffré hors Git et personnes autorisées documentés.
- [ ] Fréquence de sauvegarde validée. Proposition à arbitrer : avant chaque migration, après une importation exceptionnelle et au moins une fois par semaine pendant le pilote.
- [ ] Nombre de générations et durée des sauvegardes validés ; aucune conservation indéfinie par défaut.
- [ ] Une procédure d’incident, de restauration et de rotation des secrets a été répétée par l’opérateur.

## 6. Export, effacement et conservation

- [x] Export Markdown disponible avec ou sans coordonnées et sans URL publique permanente.
- [ ] Un export complet du dossier au titre des droits de la personne est défini et testé ; le Markdown V1 seul n’est pas encore déclaré suffisant.
- [ ] Une procédure d’effacement complète, auditable et testée existe. La suppression manuelle ad hoc en SQL n’est pas acceptée comme procédure normale.
- [ ] Les effets de l’effacement sur audit, historique, exports et sauvegardes sont définis.
- [ ] Une durée de conservation provisoire est validée par Mouaad avant le pilote.
- [ ] Chaque catégorie possède un déclencheur de revue : prospect sans suite, projet achevé/abandonné, Accord TIM clôturé, paiement terminé, audit et sauvegarde.
- [ ] Un rappel de revue périodique existe ; aucune donnée ne reste sans échéance de revue.

Décision encore requise : la Phase 2 ne possède ni commande de suppression complète ni moteur de conservation. Tant qu’une méthode auditable et des durées ne sont pas validées, cette section reste bloquante.

## 7. TIM et données financières minimisées

- [x] Les trois états accord/opération/rémunération sont indépendants.
- [x] Les termes sont versionnés et les allocations configurables.
- [x] Une location ne reçoit ni répartition ni fait générateur automatique.
- [x] Les paiements sont idempotents et peuvent être partiels.
- [ ] Mouaad confirme que seuls honoraires, parts, dû/payé, devise, dates et référence minimale sont saisis.
- [ ] Aucun document, compte bancaire, information fiscale ou commentaire financier superflu n’est saisi.
- [ ] La durée de conservation des montants TIM et des références de paiement est validée séparément.

## 8. Confidentialité navigateur, logs et dépôt

- [x] Aucun analytics/PostHog n’est chargé dans le layout cockpit.
- [x] Aucun service worker ne met des dossiers en cache hors ligne.
- [x] Headers privés/no-store/noindex implémentés.
- [ ] Contrôle final du HTML statique : aucune fixture, coordonnée, secret ou donnée cockpit.
- [ ] Contrôle réseau distant : aucune requête analytics et données uniquement via `/api/cockpit/*` après authentification.
- [ ] Paramètres de logs Cloudflare revus : aucun body, résumé client, email ou montant réel n’est volontairement journalisé.
- [ ] `git diff`, historique de branche et fichiers non suivis inspectés pour confirmer l’absence de donnée réelle, secret, export ou sauvegarde.
- [x] Captures finales vérifiées visuellement : fixtures fictives uniquement.

## 9. Validation opérationnelle finale

- [x] Scénario client fictif complet passé localement.
- [x] Projet actif sans prochaine action visible puis résolu localement.
- [x] Accord TIM vente fictif, états indépendants, compensation et paiement partiel passés localement.
- [x] Accord TIM location fictif sans automatisme passé localement.
- [x] Recette mobile `390 × 844` passée avec actions accessibles.
- [ ] Les mêmes scénarios rejoués sur le hostname protégé par Access.
- [x] Erreur D1 distinguée d’un état vide par les tests applicatifs.
- [x] Sauvegarde et restauration fictives prouvées.
- [ ] Mouaad a daté et signé la décision GO après revue de toutes les cases.

## Décision

| Champ | Valeur |
|---|---|
| Décision actuelle | **NO-GO données réelles** |
| Raisons bloquantes | plan/app/policy/AUD/MFA/DNS Access absents ; Preview publique malgré Fail closed ; ancien binding D1 production encore présent jusqu’au push ; D1 réelle non créée ; politique de sauvegarde réelle à valider ; conservation/effacement non validés |
| Décideur | Mouaad |
| Date de future revue | non fixée tant qu’Access n’est pas activable |
| Preuve de validation | à produire dans le handoff d’un futur GO, hors donnée personnelle et hors secret |

Le GO ne peut être donné par un build vert seul. Toutes les sections doivent être vertes simultanément.
