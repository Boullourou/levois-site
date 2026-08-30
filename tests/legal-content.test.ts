import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const legalPagePath = fileURLToPath(
  new URL('../src/pages/mentions-legales.astro', import.meta.url),
);
const legalPage = readFileSync(legalPagePath, 'utf8');

describe('mentions légales', () => {
  it('distingue le SIREN / RSAC du SIRET encore provisoire', () => {
    expect(legalPage).toContain('SIREN : 824 194 419');
    expect(legalPage).not.toMatch(/\bSIRET\b/i);
    expect(legalPage.replace(/\s/g, '')).not.toContain('82419441900027');
    expect(legalPage.replace(/\s/g, '')).not.toContain('82419441900043');
  });

  it('ne publie pas le bloc factuel SAFTI retiré', () => {
    expect(legalPage).not.toMatch(/522\s+869\s+935\s+00026/);
    expect(legalPage).not.toMatch(/CPI\s+9401\s+2016\s+000\s+014\s+002/);
    expect(legalPage).not.toMatch(
      /GALIAN|garantie financière|responsabilité civile|\bRCP\b/i,
    );
    expect(legalPage).not.toContain('ne reçoit ni fonds, ni effets, ni valeurs');
  });

  it('publie la formulation juridique validée sans employer agent immobilier', () => {
    expect(legalPage.replace(/\s+/g, ' ')).toContain(
      'Mouaad Boullourou, entrepreneur individuel, agent commercial immatriculé au RSAC de Chartres sous le numéro 824 194 419.',
    );
    expect(legalPage).toContain('conseiller immobilier SAFTI à Lèves et alentours');
    expect(legalPage).not.toMatch(/agent immobilier|indépendant|sous mandat/i);
    expect(legalPage.replace(/\s+/g, ' ')).toContain(
      'ni une agence immobilière autonome, ni un réseau, ni un produit officiellement édité par SAFTI',
    );
  });
});
