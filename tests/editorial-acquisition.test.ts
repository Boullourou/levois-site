import { describe, expect, it } from 'vitest';
import { resolveArticleContext } from '../src/lib/editorial/acquisition-server';

describe('public article context', () => {
  it('resolves canonical metadata without trusting submitted labels', () => {
    const result = resolveArticleContext({id:'marge-negociation-erreur-25000',slug:'https://evil.test',title:'Réponse personnelle'});
    expect(result?.slug).toBe('marge-negociation-erreur-25000');
    expect(result?.title).toBe('Faut-il ajouter une marge de négociation au prix de vente ?');
    expect(result && Object.keys(result)).toEqual(['id','slug','title']);
  });
  it('ignores unknown or malformed identities', () => {
    for (const input of [null, 'secret', {id:'person@example.com'}, {id:'__proto__'}, {id:42}]) expect(resolveArticleContext(input)).toBeNull();
  });
});
