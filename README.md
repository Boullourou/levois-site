# LEVOIS — levois.fr

**Une expérience numérique de décision immobilière.** Le propriétaire choisit sa
situation, répond à trois à cinq questions, reçoit une lecture réellement liée à
ses réponses — et ne transmet ses coordonnées que s'il le souhaite, après la valeur.

Voir `PROPOSITION.md` pour la vision, la direction artistique et l'architecture.

## Stack

- **Astro 4** — statique par défaut, le parcours est la seule « île » interactive
- **Tailwind CSS** — tokens LEVOIS (papier minéral, encre, cobalt, lime) dans `tailwind.config.mjs`
- **Archivo Black + Public Sans** auto-hébergées (licences SIL OFL)
- **Vitest** — le moteur de personnalisation est testé (cas de recette du CdC §17)
- **Cloudflare Pages** — hébergement, Pages Functions, D1 et données DVF versionnées

## Démarrer

```bash
npm install
npm run dev        # http://localhost:4321
npm test           # moteur de signaux + formulaires Cloudflare
npm run test:market # calculs et filtres du résumé DVF
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
| Résumé local du marché | `scripts/build-market-summary.mjs` + `src/data/dvf-market-summary.json` |

**Règle absolue** : après toute modification de `situations.ts`, lancer `npm test` —
les trois exemples du cahier des charges (§17) doivent continuer de passer.

## Images et données locales

Les images publiées vivent dans `/public/images/` et sont décrites dans
`src/data/images.ts` avec leurs dimensions, textes alternatifs et recadrages.
Le héros utilise une photographie réelle de Chartres, créditée dans l’interface.

Les ventes DVF sont préparées hors build et versionnées. Le workflow
`.github/workflows/dvf-update.yml` régénère à la fois le dataset de `/votre-rue`
et le résumé chiffré de l’accueil.

## Formulaires (transmission à Mouaad + contact)

Routes Cloudflare Pages Functions :

- `functions/api/lead.ts` pour le contact, la lecture vendeur et `/votre-rue` ;
- `functions/api/recherche.ts` pour le parcours acheteur et sa persistance D1.

Variables d'environnement à définir dans Cloudflare Pages :

| Variable | Rôle |
|---|---|
| `RESEND_API_KEY` | Clé API [Resend](https://resend.com) — **obligatoire** pour activer l'envoi |
| `LEAD_TO_EMAIL` | Destinataire (défaut : mouaad@levois.fr) |
| `LEAD_FROM_EMAIL` | Expéditeur vérifié Resend (défaut : onboarding@resend.dev) |
| `RECHERCHE_DB` | Binding D1 requis par `/api/recherche` |
| `RATE_LIMIT` | Binding KV optionnel pour partager la limitation de `/api/lead` |

Sans clé, le formulaire affiche une erreur honnête avec les coordonnées directes —
jamais de fausse confirmation.

## Déploiement

- `main` → production (`levois.fr`) via Cloudflare Pages
- branches → prévisualisations Cloudflare Pages
- Redirections des anciennes URLs : `public/_redirects`

## Propriété

Code, créations, contenus, domaine, données et comptes techniques appartiennent
à Mouaad Boullourou. Licences typographiques : SIL OFL (aucun achat requis).
