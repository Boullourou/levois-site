# LEVOIS OS V1 — plan directeur

## Définition

LEVOIS OS V1 est le système de travail quotidien de Mouaad pour lire une situation immobilière, suivre les personnes, décider de la prochaine action et conserver les enseignements utiles. Ce n’est ni un site, ni un cockpit, ni un agent, ni un CRM, ni un outil Yanport isolé : ce sont des modules d’un même système.

La promesse opérationnelle est simple : **chaque opportunité a un contexte, un propriétaire humain, une prochaine action et une trace proportionnée.**

## Système cible

```text
Site public ───> entrées qualifiées ───┐
Terrain ───────> notes de qualification ├──> dossier / projet / tâches ───> cockpit Aujourd’hui
Yanport / marché -> candidats / lectures ┘                 │
                                                          ├──> export Obsidian
                                                          ├──> rappels / agenda
                                                          └──> agents OPS/COS (propositions et traces)
```

## Règles de conception

1. L’humain garde le contrôle des décisions, de la qualification et de toute mutation métier sensible.
2. Une information observée, déduite ou à confirmer n’est pas un fait confirmé.
3. Un dossier actif sans prochaine action est une anomalie visible, jamais un silence.
4. Le site public éclaire et oriente ; le cockpit privé organise le travail ; le terrain sert la conversation.
5. Les agents préparent, vérifient, signalent et journalisent. Ils ne deviennent ni une seconde base client ni un automate opaque.
6. Les données réelles ne sont admises qu’après les gates sécurité, Access et conservation documentés.

## Modules V1

- Suivi client et projets : personnes, projets, interactions, tâches, critères et décisions.
- Recherche de biens : formulation versionnée de la recherche, import contrôlé de résultats, shortlist humaine.
- Qualification terrain : une fiche par bien, notes rapides et verdict, sans transformer l’échange en CRM.
- Agenda et suivi : une vue de travail quotidienne, rappels, retours promis et anomalies.
- Accords TIM : suivi distinct de la collaboration, de l’opération et de la rémunération.
- Site public : clarification avant prise de contact, sans exposer de données privées.
- Mémoire / pilotage : Obsidian pour le PMO et la mémoire stratégique, GitHub pour le produit.
- Agentic OS : missions circonscrites, traces, kill switches et briefings ; pas une couche parallèle de vérité métier.

## Non-objectifs maintenant

- CRM immobilier exhaustif ; matching automatique ; IA qui modifie les dossiers ; synchronisation Obsidian ; intégration Yanport en direct ; refonte publique ou vidéo avant stabilisation du pipeline ; multiplication de départements agents.

## Critère de succès V1

Un lundi matin, Mouaad peut : retrouver le dossier ou le bien concerné, comprendre ce qui a changé, voir la prochaine action, agir depuis téléphone ou ordinateur, puis conserver un résumé utile — sans reconstruire l’histoire dans plusieurs chats ou fichiers.
