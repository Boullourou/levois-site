import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const ordinarySurfaces = [
  'src/config/site.ts',
  'src/components/Footer.astro',
  'src/pages/index.astro',
  'src/pages/mouaad.astro',
  'src/pages/carte.astro',
  'src/pages/accompagnement.astro',
];

describe('public professional identity', () => {
  it('uses only the validated ordinary wording across public surfaces', () => {
    for (const path of ordinarySurfaces) {
      const content = source(path);
      expect(content, path).not.toMatch(
        /conseiller immobilier indépendant|au sein du réseau SAFTI|Conseiller immobilier indépendant · Réseau SAFTI/i,
      );
      expect(content, path).not.toMatch(/\bagent immobilier\b/i);
    }

    expect(source('src/config/site.ts')).toContain(
      "titre: 'Conseiller immobilier SAFTI à Lèves et alentours'",
    );
  });

  it('describes Mouaad, not LEVOIS, as the professional entity in JSON-LD', () => {
    const layout = source('src/layouts/Layout.astro');
    expect(layout).toContain("jobTitle: 'Conseiller immobilier SAFTI'");
    expect(layout).toContain('https://www.safti.fr/votre-conseiller-safti/mouaad-boullourou');
    expect(layout).not.toContain("'@type': 'RealEstateAgent'");
    expect(layout).not.toContain('worksFor:');
    expect(layout).not.toContain("'@type': 'Organization'");
    expect(layout).not.toMatch(/\bagent immobilier\b/i);
  });

  it('records the dated SAFTI proof while keeping the SIRET provisional', () => {
    const register = source('docs/strategy/phase-2-plateforme-editoriale-et-accueil.md');
    expect(register).toContain('VÉRIFIÉ le 30 août 2026');
    expect(register).toContain(
      'https://www.safti.fr/votre-conseiller-safti/mouaad-boullourou',
    );
    expect(register).toContain('EI - Agent commercial - 824 194 419 RSAC CHARTRES');
    expect(register).toContain('`824 194 419 00043`, provisoire');
    expect(register).toContain('ne constitue pas un SIRET');
    expect(register).toContain('ne jamais employer « agent immobilier »');
  });
});
