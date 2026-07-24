# LEVOIS — levois.fr

**Une expérience numérique de décision immobilière.** Le propriétaire choisit sa
situation, répond à trois à cinq questions, reçoit une lecture réellement liée à
ses réponses — et ne transmet ses coordonnées que s'il le souhaite, après la valeur.

Voir `PROPOSITION.md` pour la vision, la direction artistique et l'architecture.

## Stack

- **Astro 4** — statique par défaut, le parcours est la seule « île » interactive
- **Tailwind CSS** — tokens LEVOIS (papier, encre, argile) dans `tailwind.config.mjs`
- **Fraunces + Instrument Sans** (Google Fonts, licences SIL OFL)
- **Vitest** — le moteur de personnalisation est testé (cas de recette du CdC §17)
- **Netlify** — hébergement + fonction serveur pour les formulaires

## Démarrer

```bash
npm install
npm run dev        # http://localhost:4321
npm test           # tests du moteur de signaux
npm run build      # production dans dist/
```

## Architecture du contenu (administrable sans toucher aux composants)

| Quoi | Où |
|---|---|
| Coordonnées, textes de rôle | `src/config/site.ts` |
| Les 5 situations : questions, options, signaux, résultats | `src/data/situations.ts` |
| Les 6 ressources : métadonnées | `src/data/resources.ts` |
| Les 6 ressources : contenu complet | `src/data/resourceContent.ts` |
| Manifeste des images (slots, alt, recadrages) | `src/data/images.ts` |
| Moteur de décision | `src/lib/engine.ts` (+ tests `engine.test.ts`) |

**Règle absolue** : après toute modification de `situations.ts`, lancer `npm test` —
les trois exemples du cahier des charges (§17) doivent continuer de passer.

## Images

Les emplacements sont définitifs, les fichiers arrivent quand ils arrivent :
déposer l'image dans `/public/images/` puis renseigner `file:` dans
`src/data/images.ts`. Le traitement provisoire disparaît automatiquement.

⚠️ Visuels « Piloter » et « Apprendre » : recadrage obligatoire (zoom/position
déjà configurés dans le manifeste) pour que les chiffres fictifs ne soient
jamais lisibles — et jamais mentionnés dans les textes alternatifs.
⚠️ La photographie de rue avec une autre personne ne doit jamais être
présentée comme une photographie de Mouaad.

## Formulaires (transmission à Mouaad + contact)

Route serveur : `netlify/functions/lead.mts` (via `/api/lead`).
Variables d'environnement à définir dans Netlify (Site configuration → Environment variables) :

| Variable | Rôle |
|---|---|
| `RESEND_API_KEY` | Clé API [Resend](https://resend.com) — **obligatoire** pour activer l'envoi |
| `LEAD_TO_EMAIL` | Destinataire (défaut : mouaad@levois.fr) |
| `LEAD_FROM_EMAIL` | Expéditeur vérifié Resend (défaut : onboarding@resend.dev) |

Sans clé, le formulaire affiche une erreur honnête avec les coordonnées directes —
jamais de fausse confirmation.

## Déploiement

- `main` → production (levois.fr) via Netlify
- Branches → prévisualisations (activer *Branch deploys* ou passer par une Pull Request)
- Redirections des anciennes URLs : `public/_redirects`

## Propriété

Code, créations, contenus, domaine, données et comptes techniques appartiennent
à Mouaad Boullourou. Licences typographiques : SIL OFL (aucun achat requis).
