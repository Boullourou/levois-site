# Contenu éditorial V2 — conservation du Markdown

Le format V1 reste accepté sans migration. V2 conserve les métadonnées éditoriales et remplace `sections` par `content: { "format": "commonmark", "markdown": "…" }`. La date réelle de rédaction `dates.createdAt` peut être omise si inconnue ; V1 la conserve obligatoire. Le validateur conserve la chaîne Markdown exacte, y compris les espaces, les fins de ligne et les liens. Une tentative invalide échoue avec le type de structure et sa position ; elle ne transforme pas le texte pour le faire passer.

Le parseur est **satteri 0.10.5**, déjà installé par Astro et désormais déclaré directement dans `package.json` et son verrouillage. Son API `markdownToMdast` fournit un arbre CommonMark. La [documentation primaire du projet](https://github.com/bruits/satteri) et les déclarations de la version installée définissent cette API. Le rendu ne compile pas MDX et n’exécute aucun code ; un second passage de reconnaissance MDX sert uniquement à refuser le JSX que CommonMark pourrait traiter comme du texte.

## Structures acceptées et refusées

- Paragraphes, H2/H3, listes ordonnées ou à puces et leurs sous-listes, citations, emphase, gras, liens directs ou par référence, URL nues et sauts de ligne forcés.
- Un H1 initial est accepté uniquement si son texte est exactement `title`. Il reste dans `content.markdown` ; seul son rendu dans le corps est omis, car l’en-tête affiche déjà ce titre une fois. Tout autre H1 est refusé.
- HTML, JSX, images dans le corps, code, tableaux, tâches, texte barré, notes de bas de page, frontmatter et autres types non pris en charge sont refusés. Une image passe par la métadonnée `image`, avec une légende visible.
- Liens : HTTP/HTTPS absolu sans identifiants, chemin commençant par un seul `/`, ou ancre `#`. Protocoles actifs, URL commençant par `//`, contrôles et antislashs sont refusés. Les destinations acceptées ne sont pas réécrites. Tous les textes et attributs sont échappés avant le rendu HTML à balises fixes.

## Métadonnées explicites, jamais devinées

`answer`, `author`, `scope`, `limits`, `category`, `primaryDestination`, dates et statut doivent être fournis par le fichier complémentaire ou par des champs explicitement documentés du fichier source. Le validateur n’extrait aucune conclusion, statistique, identité ou date du corps.

Les sources V2 sont `{ id, label, url, accessedAt, scope }`. L’identifiant documentaire est conservé. Une méthode sans URL utilise `url: null` et s’affiche comme texte ; aucune référence de remplacement n’est créée. `scope` expose la portée du document. `accessedAt` accepte une date civile `YYYY-MM-DD` ou un horodatage avec fuseau, en conservant la précision fournie.

`image` reste `null` ou devient `{ src, alt, width, height, caption }` : la légende est obligatoire en V2 et visible sous l’image, notamment pour une illustration IA. Le chemin local et les dimensions suivent les mêmes contrôles que V1.

`dates.createdAt` et `dates.updatedAt` acceptent aussi une date civile en V2. `createdAt` inconnu est omis, y compris dans le texte visible et le JSON-LD ; une date de source, d'import ou de publication prévue ne le remplace jamais. Aucune heure à minuit n’est ajoutée. `publishAt` reste une échéance à **07:00 Europe/Paris** avec le bon décalage saisonnier ; elle ne devient jamais `datePublished`. Les révisions exigent une date réelle de modification, supérieure à la dernière date connue lorsqu'elle existe ; une précision horaire peut être nécessaire pour plusieurs modifications le même jour.

## Vérifications reproductibles

`npx vitest run src/lib/editorial/markdown.test.ts src/lib/editorial/schema.test.ts src/lib/editorial/import.test.ts tests/editorial-library.test.ts` vérifie la rétrocompatibilité, la conservation exacte, les structures imbriquées, les sources sans URL, la précision des dates et le refus des liens ou contenus non pris en charge.

`node tests/editorial-markdown.browser.mjs` compile le véritable template d’article dans un site de test isolé sous `artifacts/`, puis vérifie 360/390/430 px sans JavaScript. Aucun faux article n’est ajouté au catalogue publié. Les marqueurs `levois:topic-id` et `levois:revision` permettent au contrôle de livraison de comparer chaque page au manifeste attendu.
