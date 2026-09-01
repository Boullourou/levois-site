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

  it('publishes the validated legal identity without promoting an unconfirmed SIRET', () => {
    const legal = source('src/pages/mentions-legales.astro');
    const config = source('src/config/site.ts');

    expect(config).toContain("nom: 'Mouaad Boullourou'");
    expect(config).toContain("titre: 'Conseiller immobilier SAFTI à Lèves et alentours'");
    expect(legal).toContain('SIREN : 824 194 419');
    expect(legal).toMatch(
      /Mouaad Boullourou, entrepreneur individuel, agent commercial immatriculé au RSAC de Chartres\s+sous le numéro 824 194 419\./,
    );
    expect(legal).toContain(
      'Mouaad Boullourou est <strong>conseiller immobilier SAFTI à Lèves et alentours</strong>.',
    );
    expect(legal).toContain('LEVOIS n’est ni une agence immobilière autonome, ni un réseau,');
    expect(legal).not.toMatch(/\bSIRET\b/i);
    expect(legal).not.toMatch(/\bagent immobilier\b/i);
  });
});
