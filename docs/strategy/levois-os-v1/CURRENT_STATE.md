# État actuel honnête

Statut observé dans ce worktree le 22 août 2026. Les éléments Agentic sont présents comme worktrees locaux archivés sous `.impeccable/`, mais ne font pas partie de l’implémentation racine actuellement exécutable. PMO et Obsidian sont classés selon les informations de mission, pas comme des preuves techniques inspectées.

| Élément | État | Constat | Décision de convergence |
|---|---|---|---|
| Tomas onboarding / PDF de démarrage | Documenté seulement | Aucun artefact vérifié dans ce worktree. | Garder comme support d’entretien, définir un format source unique hors Git si données réelles. |
| Mandat | Manuel / externe | Aucun mandat ne doit être copié dans Git ou D1 V1. | Rester une source externe ; ne conserver qu’un statut/référence minimisés lorsque nécessaire. |
| Outil Tomas terrain | Prototype local utilisable | `src/pages/tomas-terrain.astro` est non suivi localement ; autosave navigateur, 7 biens réels. | Stabiliser et tester sur iPad, puis décider d’un stockage privé ; ne pas le pousser sans revue des données. |
| Yanport CSV | Documenté seulement | Aucun importeur ni CSV contrôlé observé. | Construire plus tard un module CSV -> shortlist, sans API Yanport. |
| Cockpit | Réel, V1 fonctionnelle avec fixtures | D1, BFF, pages privées, TIM, export Markdown et tests existent dans l’historique. | Ne l’ouvrir aux données réelles qu’après le GO sécurité encore bloqué. |
| Agentic A1/A2, COS-01 / OPS-01 | En chantier, worktrees locaux archivés | `.impeccable/agentic-a1-worktree`, `agentic-a2-worktree` et `agentic-company-os-worktree` existent. Leurs tests sont accidentellement découverts depuis la racine et échouent car ils recherchent migrations/fixtures Agentic absentes de la racine. | Les traiter comme consommateurs contrôlés du pipeline ; ne pas relancer A2 sans décision. |
| Site public | Réel, en exploration | Parcours publics Astro existants ; DA publique non validée. | Geler les refontes jusqu’à clarification du pipeline opérationnel. |
| Vidéos Chartres | En chantier / hors Git | Audit d’assets demandé, mais sources non versionnables et non inspectables ici. | Reprendre seulement après parcours/CTA clarifiés. |
| PMO / Direction Générale | Manuel / Obsidian | Cité comme mémoire stratégique ; non vérifiable ici. | Garder le pilotage et les décisions, pas les données opérationnelles dupliquées. |
| Obsidian | Réel comme destination, pas synchronisé | Export Markdown cockpit prévu ; aucune écriture directe Cloudflare. | Mémoire longue et PMO ; exports datés, pas vérité opérationnelle. |
| GitHub | Réel | Historique code/docs ; aucune donnée client autorisée. | Source du produit et de sa documentation seulement. |

## Découpage utile

- **Réel et utilisable** : site public, cockpit avec fixtures, migrations/tests cockpit, export Markdown, parcours D1 historiques.
- **Prototype** : page terrain Tomas locale ; design explorations.
- **Documenté seulement** : Yanport ingestion, procédure mandat, synchronisation Obsidian.
- **En chantier isolé** : Agentic A1/A2/COS/OPS dans des worktrees `.impeccable/` non intégrés à la racine.
- **En chantier** : accès réel cockpit, D1 réelle séparée, asset strategy publique.
- **À abandonner ou fusionner** : les suivis parallèles non attribués à une source de vérité ; l’idée d’un Agentic OS qui recréerait dossiers, tâches ou mémoire métier.

## Risque principal

Le risque n’est pas l’absence d’un nouvel outil : c’est qu’une même prochaine action, un même critère ou une même information vivent à la fois dans un chat, Obsidian, email, page locale et cockpit sans autorité explicite.
