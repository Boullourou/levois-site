# Système d’expérience LEVOIS — Prototype cockpit Phase 2.6

> **Statut : NON VALIDÉ par Mouaad.** Direction **Partition active**, seed `bc058939`. Verdict de review : **PASS WITH MINOR OPEN**, sans P0 ni P1. Le seul P2 matériel ouvert est la restitution du focus après un rerender dynamique. La chaîne brute `funds_received`, encore visible dans le champ d’édition des termes TIM, est une dette mineure de microcopie.

## 1. Autorité et frontière

Ce document décrit l’expression réellement construite pour trois écrans pilotes :

1. **Aujourd’hui** (`data-cockpit-page="today"`) ;
2. **fiche client acquéreur** (`data-cockpit-page="client-detail"`) ;
3. **Accord TIM** (`data-cockpit-page="tim-detail"`).

Il ne constitue ni une validation produit, ni une nouvelle charte LEVOIS. Le frontmatter et les règles publiques de `DESIGN.md` restent normatifs pour le site public. Les valeurs ci-dessous sont des tokens de prototype, confinés à `body[data-cockpit-experience='partition-active']` dans `src/styles/cockpit-experience.css`.

Le contrat d’activation est volontairement explicite : `CockpitLayout.astro` accepte l’option `experience?: 'partition-active'`, la reporte dans `data-cockpit-experience`, puis les trois routes pilotes seulement importent la feuille d’expérience et passent cette valeur. Sans cette option, le cockpit conserve sa présentation existante.

**Règle de frontière.** Ne pas recopier ces tokens dans le frontmatter de `DESIGN.md`, dans les styles globaux, sur une autre route cockpit ou sur une page publique avant le jalon de propagation défini en section 11.

## 2. Intention de la direction

Partition active traduit une situation immobilière en succession datée de signaux, de décisions et d’engagements. La lecture suit **attention → décision → détail** : la première vue répond à « quoi regarder et quoi faire maintenant ? », puis laisse les faits, versions et historiques s’ouvrir sans les supprimer.

La forme évite le vocabulaire d’un dashboard SaaS : feuille continue, lignes tactiles, temps en marge, bandes de situation, peu de rayons et aucune ombre décorative. L’ultramarin porte l’action ou l’information active ; les couleurs d’état n’apparaissent qu’avec un libellé métier.

## 3. Tokens de couleur

Les tokens ci-dessous reflètent la feuille CSS finale. Les deux valeurs d’état qui avaient dérivé dans l’exploration ont été réalignées : attention `#805708`, danger `#9B3B2D`.

### Palette principale

| Token CSS | Valeur | Rôle dans le prototype |
| --- | --- | --- |
| `--cockpit-paper` | `#F1F3EE` | Fond minéral continu du workspace. |
| `--cockpit-white` | `#FAFBF7` | Surface claire des contrôles, signaux financiers et dialogues. |
| `--cockpit-ink` | `#15221E` | Texte principal, règles fortes et navigation sombre. |
| `--cockpit-muted` | `#58645E` | Descriptions, métadonnées et contexte secondaire. |
| `--cockpit-line` | `#C9CFC8` | Séparateurs non essentiels et rythme de la partition. |
| `--experience-control-border` | `#718078` | Contour perceptible des contrôles sur surface claire. |
| `--experience-focus-on-dark` | `#C6CCFF` | Focus clavier dans la navigation sombre. |
| `--cockpit-blue` | `#3247D8` | Action primaire, information active, lien et prochain geste. |
| `--cockpit-lime` | `#D7E6DD` | Accent secondaire discret hérité par certains signaux du cockpit. |
| `--cockpit-danger` | `#9B3B2D` | Retard, absence de prochaine action et danger explicite. |
| `--experience-success` | `#2F6F58` | État confirmé ou réussi. |
| `--experience-attention` | `#805708` | Vigilance ou condition, toujours avec texte. |
| `--experience-info-soft` | `#E6E9FB` | Fond du premier signal et des états d’information. |
| `--experience-danger-soft` | `#F6E7E3` | Fond d’un manque ou d’un état dangereux. |
| `--experience-success-soft` | `#E4EEE8` | Fond d’un état confirmé. |

### Paires d’état observées

| Usage | Texte / fond |
| --- | --- |
| Action primaire | `#FFFFFF` / `#3247D8` ; survol `#FFFFFF` / `#2437B8`. |
| Information | `#2437B8` / `#E6E9FB`, contour `#ADB7EE`. |
| Succès | `#245843` / `#E4EEE8`, contour `#B4D1C2`. |
| Attention | `#75500F` / `#F5EDDC`, contour `#D4BD8B`. |
| Danger | `#8D3526` / `#F6E7E3`, contour `#D7ACA3`. |
| Navigation | texte `#C7D0CB`, métadonnée `#AAB5AF`, fond `#15221E`. |

### Contrastes vérifiés

Les ratios sont calculés selon la luminance relative WCAG pour les paires opaques déclarées.

| Paire | Ratio | Lecture |
| --- | ---: | --- |
| Encre / papier | `14.69:1` | AAA pour le texte courant. |
| Encre / surface | `15.79:1` | AAA pour le texte courant. |
| Texte secondaire / papier | `5.53:1` | AA pour le texte courant. |
| Blanc / ultramarin | `6.93:1` | AA pour le texte courant. |
| Ultramarin / papier | `6.21:1` | AA pour les liens et libellés. |
| Information / fond information | `7.53:1` | AAA pour le texte courant. |
| Succès / fond succès | `6.93:1` | AA pour le texte courant. |
| Attention / fond attention | `6.19:1` | AA pour le texte courant. |
| Danger / fond danger | `6.54:1` | AA pour le texte courant. |
| Texte navigation / encre | `10.41:1` | AAA pour le texte courant. |
| Focus clair / encre | `10.54:1` | Très visible sur surface sombre. |
| Bord de contrôle / surface | `3.99:1` | Dépasse le seuil non textuel de `3:1`. |
| Séparateur / papier | `1.42:1` | Décoratif seulement ; ne doit jamais porter seul une limite de contrôle ou une information. |

La couleur ne constitue jamais l’unique signal : les états associent texte, position, forme ou contour. Le faible contraste des filets est intentionnel uniquement parce qu’ils organisent l’espace sans transmettre le statut.

## 4. Typographie

### Familles

| Rôle | Famille | Usage |
| --- | --- | --- |
| Display, temps, montants | `Antonio`, repli `Public Sans`, sans-serif | Titres de page et de section, heures, échéances et montants ; chiffres tabulaires lorsqu’ils doivent s’aligner. |
| Interface et lecture | `Public Sans`, repli `system-ui`, sans-serif | Corps, boutons, navigation, formulaires, états et métadonnées. |
| Mot-symbole | `Archivo Black`, sans-serif | `LEVOIS` uniquement ; ne devient pas une police d’interface. |

Antonio et Public Sans sont auto-hébergées en WOFF2 avec `font-display: swap`. Antonio expose les graisses 100–700 ; Public Sans, 100–900.

### Échelle observée

| Rôle | Valeur finale |
| --- | --- |
| H1 cockpit | `clamp(42px, 5vw, 68px)`, poids 560, interligne `.96` ; mobile 44px, fiche client 42px, Accord TIM 32px. |
| Déclaration d’attention | `clamp(48px, 5.4vw, 78px)`, poids 560, interligne `.96` ; mobile 40px / `.92`. |
| Titre de section | `clamp(28px, 3vw, 40px)`, poids 520, interligne `1` ; mobile 32px. |
| Temps principal | 32px, poids 600 ; 25px sur mobile. |
| Montants / échéances | 22–32px, poids 560–580, chiffres tabulaires. |
| Corps essentiel | 15–18px selon le contexte, interligne 1.4–1.6. |
| Action et métadonnée | 12–13px, poids 600–760. |
| Libellé opérationnel secondaire | 11px, graisse forte et capitales espacées lorsque le rôle l’exige. |

Les libellés métier précédemment observés à 10px ont été remontés à 11px lors du polish final. Les 10px restants sont confinés à une signature de marque secondaire, pas à une donnée nécessaire à la décision. Les valeurs longues, titres de critères, axes TIM et notes emploient `overflow-wrap: anywhere` ; ce durcissement ne doit pas être retiré.

## 5. Espacement, grille et formes

Le système n’introduit pas une échelle abstraite nouvelle ; il documente les rythmes réellement répétés.

- **Cadre desktop :** sidebar 216px ; contenu plafonné à 1320px ; marges principales `clamp(30px, 4.5vw, 64px)` verticalement et `clamp(26px, 5vw, 76px)` horizontalement.
- **Rythme courant :** 8px entre actions, puis 12, 14, 18, 20, 22, 28 et 36px selon le passage du contrôle au groupe et du groupe à la section.
- **Mobile ≤ 900px :** contenu 24px / 20px / 42px, navigation basse avec zone sûre ; les actions passent sur une grille de deux colonnes.
- **Mobile ≤ 620px :** bords 16px, composition spécifique par écran, dialogues plein écran ; l’Accord TIM garde trois actions compactes dans son en-tête.
- **Recomposition ≤ 1080px :** les mises en page de détail reviennent à une colonne sans changer l’ordre métier.
- **Cibles :** 44px minimum pour boutons et divulgations ; 54px pour la navigation desktop ; 60px pour chaque entrée mobile.

### Formes

| Élément | Forme |
| --- | --- |
| Sections et lignes de travail | Rayon 0 ; séparation par filets de 1px et rythme vertical. |
| Boutons | Rayon 8px, hauteur minimale 44px. |
| Badges | Rayon 4px, hauteur minimale 28px. |
| Champs | Rayon 7px, fond blanc et contour de contrôle. |
| Dialogue desktop | Rayon 12px et ombre structurelle `0 28px 72px rgba(21, 34, 30, .28)`. |
| Dialogue mobile | Plein écran, rayon et bord supprimés. |
| Marqueurs de certitude / chronologie | Cercles de 7px et 13px, toujours accompagnés d’un texte. |

Il n’y a aucune ombre décorative sur les surfaces de travail. La seule ombre du prototype appartient au plan modal et sert à distinguer le dialogue de l’arrière-plan inerté.

## 6. Grammaire des trois écrans

### Aujourd’hui

La grille de widgets devient une file continue. Une déclaration d’attention annonce le volume, puis chaque rubrique garde son sens métier dans la même partition. Le temps occupe une marge dédiée ; la première action reçoit un fond information et un filet ultramarin. La ligne entière est actionnable, tandis que le lien textuel confirme explicitement la destination.

### Fiche client acquéreur

Le premier niveau réunit situation, synthèse, type de projet, prochaine action et échéance. La recherche acquéreur domine ensuite la colonne principale ; préféré, acceptable et conditionnel forment une bande lisible. Importance, flexibilité, provenance et historique passent dans une divulgation native, sans perte de données. Tâches, interactions, projets et chronologie gardent leur ordre et leur profondeur.

### Accord TIM

Accord, opération et rémunération constituent la composition principale. La prochaine action et le montant à recevoir maintenant suivent immédiatement. La rémunération, les tâches et les termes versionnés viennent ensuite ; l’historique reste disponible en profondeur. Les trois axes restent indépendants dans le contenu comme dans l’interface.

### Dialogues

Les dialogues desktop conservent un cadre centré de 720px ou 840px. À 620px et moins, ils occupent `100vw × 100dvh`, suppriment le rayon et gardent un pied d’action atteignable. Les captures couvrent l’édition d’un critère acquéreur et la révision des termes TIM.

## 7. Motion et réduction de mouvement

| Token / comportement | Valeur | Usage |
| --- | --- | --- |
| `--experience-ease` | `cubic-bezier(.2, .75, .25, 1)` | Easing unique du prototype. |
| Feedback | 140ms | Couleur, fond, bord et translation maximale de 1px sur bouton ; fond de ligne et navigation. |
| Arrivée | 220ms | Opacité `.6 → 1` et translation verticale `6px → 0` sur l’introduction d’attention. |

Aucun mouvement ambiant n’est permis. Les détails natifs n’ajoutent pas de tween décoratif. Le socle cockpit impose, avec `prefers-reduced-motion: reduce`, un défilement automatique sans lissage, aucune animation et des transitions ramenées à `.01ms`; la feuille scopée supprime en plus explicitement l’arrivée et les transitions de boutons, lignes et navigation.

## 8. Iconographie

La navigation de Partition active utilise cinq SVG inline : onde de travail pour Aujourd’hui, silhouette pour Clients, doubles flèches pour TIM, fiole pour Lab et curseurs pour Réglages. Chaque pictogramme respecte le même contrat :

- `viewBox="0 0 24 24"`, rendu 20 × 20px ;
- trait `currentColor` de 1.7px, extrémités et jonctions arrondies ;
- aucun remplissage, image distante, police d’icônes ou emoji ;
- `aria-hidden="true"`, car le libellé du lien porte le nom accessible ;
- état courant confirmé par `aria-current="page"`, le fond ou le texte, jamais par l’icône colorée seule.

Ces icônes sont fonctionnelles et privées. Elles ne deviennent pas l’iconographie publique LEVOIS et n’autorisent pas les clichés immobiliers maison, toit, clé ou poignée de main.

## 9. Accessibilité

- La page fournit un lien d’évitement vers `#cockpit-main`.
- Le focus global garde un contour de 3px ; Partition active ajoute un décalage de 4px et emploie `#C6CCFF` sur les surfaces sombres.
- Les boutons, liens de ligne, résumés de divulgation et entrées de navigation respectent des cibles d’au moins 44px.
- Les informations d’état combinent texte, couleur et forme. Les axes TIM, échéances et montants restent lisibles sans animation.
- La navigation mobile réserve `env(safe-area-inset-bottom)` et ne bloque pas le zoom ; le document reste utilisable dès 320px.
- Les SVG décoratifs sont cachés aux technologies d’assistance ; les régions de navigation sont nommées.
- Les toasts utilisent une région `aria-live="polite"` et `aria-atomic="true"`. Une racine de fiche entière ne doit pas devenir une zone live.
- Les contrastes textuels principaux satisfont WCAG 2.2 AA. Les filets faibles sont décoratifs et ne remplacent jamais un contour de contrôle.
- Les libellés métier essentiels commencent désormais à 11px ; le corps de décision reste à 15–18px.

**P2 matériel ouvert : focus après rerender.** Après un rendu dynamique de la fiche ou de l’accord, la restitution du focus utile doit être vérifiée au clavier sur une nouvelle capture/inspection. Le focus visible dans les dialogues statiques ne suffit pas à fermer ce point.

## 10. État des preuves

### Ce qui est établi

- `docs/design/EXPERIENCE_AUDIT.md` conserve l’audit initial et la cible **attention → décision → détail**.
- `docs/design/DIRECTIONS.md` conserve les trois explorations et la recommandation Partition active ; sa palette correspond désormais aux tokens CSS finaux.
- `CockpitLayout.astro` porte le contrat d’opt-in, la thèse et le seed `bc058939`.
- Les trois routes pilotes importent explicitement la feuille scopée ; aucune autre route n’en hérite par défaut.
- La matrice contient **20 captures** : 10 avant et 10 après, chacune couvrant Aujourd’hui, fiche acquéreur, Accord TIM, dialogue critère ouvert et dialogue termes TIM ouvert, en desktop 1440 × 1000 et mobile 390 × 844.
- Les séries avant/après utilisent le même snapshot D1 fictif ; la comparaison ne suppose ni donnée client réelle ni réinitialisation intermédiaire.
- Le polish post-review a remonté les libellés opérationnels concernés à 11px et ajouté le retour à la ligne défensif aux valeurs/titres de critères, axes TIM et notes longues.
- Les captures « after » ont été reprises après le dernier polish source et établissent la composition finale reviewée. Elles ne simulent toutefois pas une soumission réussie suivie d’un rerender et ne ferment donc pas le point de restitution du focus.
- Verdict final : **PASS WITH MINOR OPEN** ; P0 : aucun ; P1 : aucun ; seul P2 matériel ouvert : focus après rerender.

### Ce que ces preuves n’établissent pas

- Elles ne valent pas validation explicite de Mouaad.
- Elles ne couvrent pas le reste du cockpit ni une page publique.
- Elles ne prouvent pas la robustesse avec toutes les données réelles, toutes les langues ou toutes les longueurs de chaîne.
- Elles ne ferment pas le parcours clavier après chaque rerender dynamique.
- Elles n’érigent pas `funds_received` en libellé acceptable ; cette microcopie brute reste à traduire ou expliciter.

## 11. Conditions de propagation

Aucune propagation n’est permise avant que toutes les conditions suivantes soient réunies :

1. Mouaad valide explicitement la direction Partition active et chacun des trois écrans pilotes.
2. Le P2 focus est corrigé puis vérifié au clavier après rerender sur les trois écrans et dans les deux dialogues témoins.
3. La microcopie `funds_received` reçoit un libellé métier compréhensible ou une décision explicite de conservation.
4. Une nouvelle matrice de captures confirme desktop, mobile 390px, largeur minimale 320px et `prefers-reduced-motion` avec le même snapshot déterministe.
5. La review finale est rejouée sans P0, P1 ni P2 matériel ouvert.
6. Une décision séparée définit, token par token, ce qui peut rejoindre le cockpit étendu ; la charte publique fait l’objet d’une validation distincte.

Même après validation, l’extension doit rester page par page via le contrat `experience`, avec comparaison avant/après et possibilité de retrait. Aucun déplacement global des tokens, aucune réécriture du frontmatter public et aucune généralisation par simple héritage CSS ne sont autorisés par ce prototype.

## 12. Sidecar Impeccable

`.impeccable/design.json` est généré comme artefact local ignoré. Il sert uniquement à prévisualiser quelques primitives de Partition active dans le panneau Impeccable. Son titre, sa narration et ses composants rappellent le statut **NON VALIDÉ** ; il ne remplace ni `DESIGN.md`, ni cette spécification, ni le CSS source.
