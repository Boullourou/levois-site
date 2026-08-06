# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

LEVOIS s'adresse avec le même niveau de priorité à deux publics du bassin chartrain :

- les propriétaires vendeurs, avant ou pendant la commercialisation de leur bien, qui veulent comprendre leur position sans subir une démarche commerciale classique ;
- les acheteurs, qui veulent mieux lire la valeur, les compromis et les signaux d'un bien avant de décider.

Ces publics ne sont pas deux silos. Un fichier d'acheteurs sérieux et qualifiés renforce la capacité de commercialisation proposée aux vendeurs. Les biens confiés à Mouaad alimentent en retour une offre plus pertinente pour les acheteurs et peuvent soutenir les accords TIM SAFTI ou les coopérations inter-agences.

## Product Purpose

LEVOIS aide à réduire l'écart entre ce qu'un bien peut raisonnablement défendre et la façon dont le marché le perçoit. Le produit rend les signaux immobiliers compréhensibles avant de proposer un accompagnement humain.

Le succès ne se limite pas au volume de contacts. Il signifie :

- être reconnu comme la référence locale en ligne à Lèves et dans le bassin chartrain ;
- créer une audience utile de vendeurs et d'acheteurs ;
- transformer cette audience en demandes entrantes qualifiées ;
- automatiser la collecte, la première lecture et le suivi pour préserver le temps consacré à la relation, au jugement et à la négociation.

## Positioning

LEVOIS ne promet ni estimation instantanée ni vérité automatique. Sa différence est de séparer les faits, les perceptions et les décisions afin de rendre la valeur d'un bien plus lisible pour les deux côtés du marché.

Signature stratégique confirmée : **Rendre la valeur lisible.**

Phrase manifeste : **Le marché ne voit pas un bien. Il lit des signaux.**

Mouaad ne se présente pas comme un agent qui « prospecte autrement ». Il accompagne acheteurs et vendeurs avec une lecture locale, des preuves explicables et une stratégie de commercialisation complète.

## Operating Context

- Secteur initial : Lèves, Chartres et le bassin chartrain.
- Réseau professionnel : conseiller immobilier indépendant SAFTI.
- Acquisition : contenus éducatifs organiques, amplification publicitaire des contenus déjà performants, outils gratuits sur le site et suivi humain lorsque la personne le souhaite.
- Cible éditoriale vidéo prioritaire : propriétaires qui envisagent une vente dans quelques mois, sans avoir encore engagé de démarche, et propriétaires dont le projet pourra être déclenché plus tard par un changement de vie. Les contenus doivent installer LEVOIS dans leur mémoire avant l’urgence, sans exploiter l’événement déclencheur ni provoquer artificiellement une prise de contact.
- Production de contenu : voix professionnelle ElevenLabs, avatar HeyGen et montage/motion design HyperFrames.
- Données locales : DVF public, outils SAFTI/Oméga et exports manuels Yanport Agent 360. L'API Yanport n'est pas retenue à ce stade pour des raisons de coût.
- Les exports Yanport successifs doivent permettre de reconstruire l'évolution des annonces ; un export isolé ne donne pas le prix de vente final ni l'historique complet.

## Capabilities and Constraints

Capacités existantes :

- parcours vendeur adaptatif avec moteur de signaux déterministe ;
- ressources éducatives gratuites ;
- lecture locale DVF par adresse ;
- parcours acheteur « Situer ma recherche », avec restitution avant demande de contact ;
- formulaire transmis seulement après restitution de valeur ;
- liens profonds entre contenus sociaux et parcours du site.

Capacités requises mais pas encore livrées :

- constitution volontaire et exploitable d'un fichier d'acheteurs qualifiés à partir de ce parcours, avec possibilité secondaire d'ajouter un bien précis à analyser ;
- outil d'audit d'annonce ;
- import sécurisé des exports Yanport, score d'opportunité et déduplication ;
- préparation de courriers ciblés non nominatifs lorsque l'usage des données et le cadre légal le permettent ;
- suivi par snapshots des changements de prix, de diffusion et de durée ;
- continuité mesurable entre contenu, diagnostic, demande entrante et relation humaine.

Contraintes :

- ne jamais fabriquer de prix, de preuve, de statistique, de témoignage ou de résultat ;
- distinguer clairement hypothèse, signal et conclusion ;
- préserver le fonctionnement du moteur déterministe et ses tests lors de la refonte ;
- ne pas exposer de données personnelles ou d'adresses issues des exports ;
- vérifier les droits de réutilisation des données avant toute prospection ;
- conserver une expérience rapide, mobile-first, utilisable sans animation et accessible au clavier ;
- aucune consommation automatique de crédits HeyGen ou ElevenLabs sans validation du script et du prototype.

## Brand Commitments

- Nom conservé pour le lancement : **LEVOIS**. Il est court, disponible sur `levois.fr`, mémorisable et possède un ancrage réel à Lèves sans enfermer l'activité dans une adresse. Un changement de nom ne sera envisagé qu'après un test comparatif explicite, pas comme une correction esthétique improvisée.
- Le mot-symbole actuel en Archivo Black est une signature de lancement, pas encore un logo propriétaire définitif. Il peut rester tant que la marque construit sa reconnaissance ; une personnalisation typographique viendra seulement si elle apporte un signe réellement distinctif.
- Porte-parole et visage : Mouaad Boullourou.
- Ton : direct, calme, précis, pédagogique, sans pression commerciale.
- La valeur doit être donnée avant toute demande de coordonnées.
- Le site conduit de la curiosité vers la méthode : verdict visible, preuves, limites franches, première lecture, puis analyse humaine comme suite logique.
- Le diagnostic automatique doit annoncer clairement sa frontière. Mouaad compare ensuite les scénarios et leurs conséquences ; l’acheteur ou le propriétaire garde la décision.
- Les parcours à choix unique avancent dès la sélection ; seuls les champs à saisir, les choix multiples et la transmission finale demandent une validation explicite.
- Acheteurs et vendeurs doivent être représentés avec la même dignité et la même importance.
- L'intelligence artificielle est un avantage opérationnel assumé mais discret : elle accélère l'analyse et la production sans remplacer le jugement, la négociation ou la relation.
- La mention du réseau SAFTI sert de preuve de cadre professionnel et de crédibilité, sans devoir gouverner l'identité LEVOIS ni occuper le premier plan.
- L'identité doit être résolument moderne et cohérente entre le site, les vidéos et les supports de communication.
- L'univers visuel de la première version du site n'est pas une source d'inspiration. Sa palette papier/argile, sa typographie éditoriale et son motif « deux lectures » ne doivent pas être conservés par inertie.
- Éviter les codes convenus de l'agent immobilier : maison, toit, clé, poignée de main, beige-or, luxe générique et discours centré sur le mandat.

## Evidence on Hand

- Dépôt Astro fonctionnel avec routes, contenus, moteur de signaux et tests.
- Trois URLs déjà engagées sur des supports physiques doivent rester stables : `levois.fr/votre-rue` sur l'encart A5, `levois.fr/carte` sur la carte de visite et `levois.fr/ma-recherche` pour le parcours acquéreur déjà publié en prévisualisation.
- Encart A5 et carte de visite existants avec portrait de Mouaad, QR codes et coordonnées. Ils prouvent la continuité des points d'entrée mais leur palette orange, leur serif et leur composition ne sont pas des contraintes pour la refonte.
- Données DVF déjà intégrées au projet.
- Export Yanport du 2 juillet 2026 : 232 biens, 48 champs, dont 222 possèdent le socle minimal exploitable pour un premier audit automatisé. Le fichier ne contient ni nom, ni téléphone, ni email.
- Échantillon de la voix professionnelle ElevenLabs de Mouaad : MP3 mono, 44,1 kHz, 32,32 secondes. Le niveau mesuré est faible et devra être normalisé dans le pipeline de production.
- Avatar HeyGen et identifiants de voix déjà centralisés dans le projet vidéo LEVOIS.
- Bibliothèque existante de photographies, ressources et visuels locaux ; leurs droits et leur pertinence doivent être confirmés avant réutilisation dans le nouveau monde visuel.
- Aucun témoignage client vérifié ni résultat commercial historique ne doit être supposé au lancement.

## Product Principles

1. **Deux côtés, une seule boucle.** Les besoins acheteurs renforcent la proposition vendeurs, et inversement.
2. **La valeur avant le contact.** Chaque parcours livre une compréhension utile avant de demander une coordonnée.
3. **Le signal avant la conclusion.** Montrer ce qui est observé, ce qui est supposé et ce qui reste à vérifier.
4. **La technologie en infrastructure.** Automatiser ce qui peut l'être pour réserver l'humain aux décisions qui comptent.
5. **La preuve locale plutôt que la posture.** La précision, les données explicables et la continuité du service construisent la crédibilité.

## Accessibility & Inclusion

Le produit doit viser WCAG 2.2 AA, rester lisible sur téléphone et réseau lent, fonctionner au clavier, respecter `prefers-reduced-motion` et ne jamais réserver une information essentielle à une animation, une couleur ou un effet visuel.
