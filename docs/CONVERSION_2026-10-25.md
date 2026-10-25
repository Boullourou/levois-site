# LEVOIS — restructuration du parcours et de l’accueil

Livraison du 25 octobre 2026, à partir du commit publié `0a056a5`.

## Expérience livrée

- Accueil ivoire et encre, titres Satoshi, mot-symbole LEVOIS, sans vidéo ni numérotation décorative. Trois actions visibles : évaluer une vente, coordonner vente et achat, cadrer une recherche. Le lien DVF descend au quartier illustré puis mène à `/votre-rue/`.
- Trois angles morts immédiatement après le hero : positionnement du prix, calendrier du relais, travaux et DPE. Le portrait réel et le téléphone de Mouaad terminent la page.
- Header fixe dont la hauteur mesurée réserve l’espace du contenu. Ancres, défilement et focus clavier tiennent compte de cette hauteur ; le menu reste utilisable sans JavaScript.
- Chaque diagnostic conserve cinq questions et annonce dès son entrée la demande de prénom et d’e-mail. Le téléphone est facultatif et son renseignement constitue une demande explicite d’échange sur ce projet.
- Après confirmation serveur de l’enregistrement du lead, la synthèse complète est accessible à l’écran et au téléchargement, même si le service d’envoi échoue. Les trois blocs, les deux ressources adaptées et l’appel direct restent disponibles.
- Les lectures déjà détenues, les sauvegardes importées et les anciens contrats d’envoi restent compatibles. Les coordonnées ne sont pas ajoutées au contexte anonyme ni à son export.

## Organisation du code

`diagnostic-capture.ts` porte le formulaire, la validation, l’envoi et les reprises avec un identifiant stable. `diagnostic-reading.ts` compose l’étape de capture et la restitution. `diagnostic-delivery.ts` mémorise uniquement les identifiants de lectures dont l’enregistrement a été confirmé ; ce marqueur assure la continuité de l’interface, pas un contrôle d’accès serveur.

Le contrat `synthesis-email` est versionné `2026-10-25-arbitrage`. Le prénom, le téléphone éventuel et l’intention de rappel sont stockés dans le document de consentement existant. Aucune migration de base de données ni modification des secrets, domaines ou liaisons Cloudflare n’est nécessaire. Voir [le contrat d’envoi](SYNTHESE_EMAIL_2026-10-25.md).

Les règles visuelles actives sont documentées dans `DESIGN.md` et son sidecar. `PRODUCT.md`, la page de confidentialité et `llms.txt` décrivent le parcours réellement livré.

## Affirmations éditoriales

Les chiffres proposés de 8 %, 15 000 €, quatre mois et 1 500 €/mois n’avaient ni échantillon local, ni méthode, ni paramètres de financement vérifiables. Ils ne sont pas publiés comme faits. Les textes expliquent les risques sous une forme conditionnelle et orientent vers les références comparables, le chiffrage bancaire et les devis.

Sources primaires utilisées pour ces formulations :

- [DGFiP — Demandes de valeurs foncières](https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres) : transactions passées, sans prix initiaux d’annonce ni durées de commercialisation.
- [Fédération bancaire française — prêt relais](https://www.lesclesdelabanque.com/particulier/pret-relais-immobilier/) : montant, durée, intérêts, assurance et conditions contractuelles.
- [France Rénov’ — DPE et audit énergétique](https://france-renov.gouv.fr/preparer-projet/dpe-audit) et [comparaison des devis](https://france-renov.gouv.fr/annuaires-professionnels/artisan-rge-architecte).
- [ANIL — frais annexes d’un achat](https://www.anil.org/votre-besoin/acheter/financement/frais-annexes/).

La synthèse est construite à partir des réponses, sans prétendre calculer automatiquement une estimation individuelle ou un financement validé pour un secteur.

## Validation

- `npm test` : **380 tests, 32 fichiers**, réussis, dont les tests API et D1/workerd du contrat de capture.
- `npm run check` : **0 erreur, 0 avertissement** ; 33 indications Astro existantes.
- `npm run build` : **51 pages** générées.
- Recette des diagnostics : **30 scénarios** réussis sur 375, 768 et 1440 px, avec cas supplémentaires à 320 px. Les quatre premiers échecs provenaient d’un sélecteur utilisant l’ancien libellé du bouton ; le rejeu ciblé est vert. **14 passages Axe, aucune violation détectée**.
- Reprise : **8 scénarios** réussis, dont import avec confirmation, anciennes lectures, stockage bloqué, lien protégé simulé et accès sans JavaScript.
- Liens et partage : **847 liens internes** de l’accueil et de la navigation commune vérifiés dans le site compilé, **41 jeux de métadonnées publiques** cohérents avec leurs titres, URL et image existante.
- Recette visuelle : **27 contrôles** réussis et **4 passages Axe** sans violation ; trois actions du hero visibles à 375 × 844, header et ancre quartier vérifiés, aucune erreur JavaScript ni ressource manquante dans ce périmètre.
- Reflow correspondant à une fenêtre de 1440 px à 200 % contrôlé à 720 pixels CSS avec densité 2. Il ne s’agit pas d’un test du zoom natif du navigateur.

La revue visuelle indépendante conclut à l’absence de blocage. Ses deux ajustements ciblés ont été confirmés : les champs conservent leur rayon de 10 px malgré la cascade historique, et les paragraphes de synthèse sont limités à 72ch sur grand écran.

Les écritures des recettes navigateur sont simulées avec des adresses `example.invalid` ; aucun prospect ni e-mail réel n’a été créé par ces tests. L’acceptation d’un message par le prestataire n’est pas une preuve de réception en boîte mail. Les résultats Axe ne constituent pas à eux seuls une certification d’accessibilité. Aucun gain de conversion ni score PageSpeed n’est affirmé sans mesure.

Rapports et captures locaux, non suivis par Git : `artifacts/conversion/diagnostics/`, `diagnostics-recheck/`, `design/confirmation/`, `finish-review.md` et `artifacts/final-validation/reprise/`.
