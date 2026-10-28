import { markdownToMdast, mdxToMdast, type MdastNode } from 'satteri';

type MarkdownRoot = Extract<MdastNode, { type: 'root' }>;
type Definition = Extract<MdastNode, { type: 'definition' }>;
export class EditorialMarkdownError extends Error {}

function reject(node: MdastNode, reason: string): never {
  const location = node.position?.start;
  throw new EditorialMarkdownError(`content.markdown${location ? `:${location.line}:${location.column}` : ''}: ${reason}`);
}

/** Keep the submitted destination; never silently rewrite an unsafe link. */
function validateLink(url: string, node: MdastNode): void {
  if (!url || /[\u0000-\u0020\u007f\\]/.test(url) || /%(?:0[0-9a-f]|1[0-9a-f]|7f|5c)/i.test(url)) reject(node, 'lien avec espace, contrôle ou antislash interdit');
  if (url.startsWith('#')) return;
  if (url.startsWith('/') && !url.startsWith('//')) return;
  let parsed: URL;
  try { parsed = new URL(url); } catch { return reject(node, 'lien HTTPS/HTTP absolu, chemin /local ou #ancre attendu'); }
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) reject(node, 'protocole ou identifiants interdits dans le lien');
}

/**
 * Parse, then allow only structures the renderer knows how to preserve.
 * GFM/frontmatter recognition is enabled solely to reject unsupported nodes
 * explicitly instead of presenting tables, tasks or metadata as plain prose.
 * There is no MDX compilation, HTML passthrough or text normalization.
 */
export function parseEditorialMarkdown(markdown: string, options: { title?: string } = {}): MarkdownRoot {
  if (typeof markdown !== 'string' || !markdown.trim() || markdown.length > 70_000) throw new EditorialMarkdownError('content.markdown: texte non vide de 70 000 caractères maximum attendu');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(markdown)) throw new EditorialMarkdownError('content.markdown: caractère de contrôle interdit');
  const tree = markdownToMdast(markdown, { features: { gfm: true, frontmatter: true, smartPunctuation: false, rawHtml: false } });
  if (tree.type !== 'root') reject(tree, 'racine Markdown attendue');
  const firstBlock = tree.children[0];
  const definitions = new Map<string, Definition>();
  const references: Extract<MdastNode, { type: 'linkReference' }>[] = [];
  let count = 0;
  function visit(node: MdastNode, depth = 0): void {
    if (++count > 6000 || depth > 32) reject(node, 'structure trop volumineuse ou trop imbriquée');
    switch (node.type) {
      case 'root': case 'paragraph': case 'blockquote': case 'emphasis': case 'strong': case 'break': break;
      case 'text': {
        // JSX spread attributes/fragments can fall back to CommonMark text.
        // Parse that raw span as MDX only to recognize and reject JSX; never
        // compile it. Escaped angle brackets and ordinary comparisons remain text.
        const raw = markdown.slice(node.position?.start.offset, node.position?.end.offset);
        if (raw.includes('<')) {
          let jsx: MdastNode | undefined;
          try { jsx = mdxToMdast(raw); } catch { /* Not valid JSX: escaped text stays text. */ }
          const hasJsx = (candidate: MdastNode): boolean => candidate.type.startsWith('mdxJsx') || ('children' in candidate && candidate.children.some(hasJsx));
          if (jsx && hasJsx(jsx)) reject(node, 'élément JSX non pris en charge');
        }
        break;
      }
      case 'heading':
        if (node.depth === 1) {
          if (node !== firstBlock || node.children.length !== 1 || node.children[0].type !== 'text' || node.children[0].value !== options.title) reject(node, 'le seul H1 accepté est le premier bloc, identique au title explicite');
        } else if (node.depth !== 2 && node.depth !== 3) reject(node, 'seuls les titres H2 et H3 sont acceptés dans le corps');
        break;
      case 'list':
        if (node.ordered && (!Number.isSafeInteger(node.start) || (node.start ?? -1) < 0)) reject(node, 'début de liste ordonnée invalide');
        break;
      case 'listItem':
        if (node.checked !== undefined && node.checked !== null) reject(node, 'liste de tâches non prise en charge');
        break;
      case 'link': validateLink(node.url, node); break;
      case 'definition':
        validateLink(node.url, node);
        // CommonMark resolves reference labels case-insensitively. Do not
        // discard a second, potentially conflicting definition silently.
        if (definitions.has(node.identifier)) reject(node, 'définition de lien dupliquée');
        definitions.set(node.identifier, node);
        break;
      case 'linkReference': references.push(node); break;
      default: reject(node, `élément ${node.type} non pris en charge (HTML, JSX, images et code interdits)`);
    }
    if ('children' in node) for (const child of node.children) visit(child, depth + 1);
  }
  visit(tree);
  for (const reference of references) if (!definitions.has(reference.identifier)) reject(reference, 'référence de lien sans définition');
  return tree;
}

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);

/** Only fixed tags and escaped text/attributes leave this validated AST. */
export function renderEditorialMarkdown(markdown: string, options: { title?: string } = {}): string {
  const tree = parseEditorialMarkdown(markdown, options);
  const definitions = new Map<string, Definition>();
  function collect(node: MdastNode): void {
    if (node.type === 'definition') definitions.set(node.identifier, node);
    if ('children' in node) node.children.forEach(collect);
  }
  collect(tree);
  function render(node: MdastNode, tight = false): string {
    const children = () => 'children' in node ? node.children.map((child) => render(child)).join('') : '';
    switch (node.type) {
      case 'root': return children();
      case 'text': return escapeHtml(node.value);
      case 'paragraph': return tight ? children() : `<p>${children()}</p>`;
      // The exact initial H1 is displayed once by the article header. Its
      // original bytes remain in content.markdown, including during imports.
      case 'heading': return node.depth === 1 ? '' : `<h${node.depth}>${children()}</h${node.depth}>`;
      case 'emphasis': return `<em>${children()}</em>`;
      case 'strong': return `<strong>${children()}</strong>`;
      case 'break': return '<br>';
      case 'blockquote': return `<blockquote>${children()}</blockquote>`;
      case 'list': {
        const tag = node.ordered ? 'ol' : 'ul';
        const start = node.ordered && node.start !== 1 ? ` start="${node.start}"` : '';
        return `<${tag}${start}>${node.children.map((item) => render(item, !node.spread && !item.spread)).join('')}</${tag}>`;
      }
      case 'listItem': return `<li>${node.children.map((child) => render(child, tight)).join('')}</li>`;
      case 'link': case 'linkReference': {
        const target = node.type === 'link' ? node : definitions.get(node.identifier)!;
        return `<a href="${escapeHtml(target.url)}"${target.title ? ` title="${escapeHtml(target.title)}"` : ''}>${children()}</a>`;
      }
      case 'definition': return '';
      default: return reject(node, `élément ${node.type} sans rendu`);
    }
  }
  return render(tree);
}
