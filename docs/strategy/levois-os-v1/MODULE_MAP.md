# Cartographie des modules

| Module | Objectif / utilisateur | Entrée -> sortie | Données nécessaires | État / premier incrément | Manuel maintenant / automatisable plus tard |
|---|---|---|---|---|---|
| Client Success | Mouaad suit une personne et ses projets. | contact + échange -> synthèse, prochaine action, historique | personne, projet, interaction, tâche, consentement minimal | Cockpit V1 réel ; rendre la routine Aujourd’hui fiable. | Qualification, décisions et notes ; rappels et signalement d’anomalies. |
| Recherche de biens | Transformer une recherche en shortlist explicable. | critères + CSV -> candidats qualifiés | recherche, scénarios, critères versionnés, provenance annonce | Documenté ; importer un CSV fictif puis filtrer localement. | Verdict final ; normalisation, dédoublonnage et suggestions. |
| Qualification terrain | Soutenir l’échange devant un propriétaire/pro. | annonce + notes -> verdict et prochaine action | bien temporaire, interlocuteur, accès, notes, verdict | Prototype local Tomas ; recette iPad. | Questions et jugement ; préremplissage contrôlé / report vers cockpit. |
| Agenda et suivi | Éviter les oublis. | tâches, promesses -> file Aujourd’hui | échéance, priorité, statut, attente, lien dossier | Cockpit V1 réel ; utiliser la vue chaque jour avec fixtures. | Priorisation ; rappels et détection des dossiers silencieux. |
| Yanport ingestion | Introduire des résultats marché sans prétendre à une API. | CSV exporté -> lignes candidates et anomalies | CSV local, mapping, source, date, recherche cible | Absent ; import CSV local réversible. | Choix de colonnes ; parsing et contrôles de format. |
| Agentic briefing | Donner un contexte borné à une mission OPS/COS. | brief approuvé -> proposition + trace | objectif, périmètre, sources autorisées, sortie attendue, kill switch | Worktrees locaux isolés présents, non intégrés ; définir contrat unique avant reprise. | Approbation et exécution risquée ; synthèse, contrôles et trace. |
| Site public | Clarifier une situation et orienter vers Mouaad. | intention -> lecture, activation explicite | contenus publics, réponses consenties, attribution | Réel ; ne pas refondre maintenant. | Relation humaine ; aide progressive et instrumentation produit. |
| Content Engine | Transformer apprentissages validés en contenus. | observation Lab validée -> brief / contenu | observation anonymisée, thème, décision éditoriale | Absent ; simple file de sujets validés. | Angle, vérité locale, validation ; préparation de brouillons. |
| Media Engine | Produire/organiser des assets cohérents. | brief -> sélection / plan de tournage | droits, consentements, métadonnées, fichiers locaux | En audit hors Git ; pas de sources médias dans dépôt. | choix créatif/droits ; planches de contact et inventaire. |
| PMO / pilotage | Arbitrer et conserver les décisions. | état modules -> décisions, ordre, risques | roadmap, décision, propriétaire, date, preuve | Obsidian / extérieur ; convergence documentée ici. | arbitrage ; consolidation de statuts et alertes. |

## Dépendances critiques

1. Terrain et Yanport doivent alimenter une **recherche versionnée**, pas un carnet parallèle.
2. Une recherche active doit produire au moins une prochaine action dans Agenda.
3. Agentic briefing n’accède qu’aux données explicitement autorisées par le module source ; sa trace référence, elle ne remplace pas le dossier.
4. Le site public ne doit pas dicter le modèle opérationnel : il le rejoint par un intake contrôlé lorsque celui-ci sera validé.
