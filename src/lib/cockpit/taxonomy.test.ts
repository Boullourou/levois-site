import { describe, expect, it } from 'vitest';
import {
  CRITERION_KEYS,
  PROJECT_STAGES_BY_TYPE,
  isStageAllowedForProject,
  taxonomyLabel,
  timAllocationSuggestion,
} from './taxonomy';

describe('cockpit taxonomy', () => {
  it('centralizes the closed V1 criterion catalogue', () => {
    expect(CRITERION_KEYS).toEqual([
      'property_type',
      'zone',
      'municipalities',
      'max_travel_time',
      'budget',
      'surface',
      'bedrooms',
      'outdoor',
      'works',
      'energy_rating',
      'heating',
      'financing',
      'prior_sale',
      'horizon',
      'environment',
      'layout',
      'other',
    ]);
  });

  it('keeps buyer and seller stages coherent', () => {
    expect(isStageAllowedForProject('primary_residence_purchase', 'search_active')).toBe(true);
    expect(isStageAllowedForProject('primary_residence_purchase', 'mandate_active')).toBe(false);
    expect(isStageAllowedForProject('sale', 'mandate_active')).toBe(true);
    expect(PROJECT_STAGES_BY_TYPE.other).toContain('search_active');
    expect(PROJECT_STAGES_BY_TYPE.other).toContain('marketing');
  });

  it('offers sale distributions only as explicit suggestions', () => {
    expect(timAllocationSuggestion('information_referral_20_80', 'sale')).toEqual({
      agreementType: 'information_referral_20_80',
      operationType: 'sale',
      basisPoints: [2_000, 8_000],
      requiresExplicitConfirmation: true,
    });
    expect(timAllocationSuggestion('mandate_50_50', 'sale')?.basisPoints).toEqual([5_000, 5_000]);
    expect(timAllocationSuggestion('information_referral_20_80', 'rental')).toBeUndefined();
    expect(timAllocationSuggestion('custom', 'sale')).toBeUndefined();
  });

  it('provides stable French labels with a readable fallback', () => {
    expect(taxonomyLabel('information_referral_20_80')).toBe('Envoi d’information');
    expect(taxonomyLabel('omega_uploaded')).toBe('Téléchargé dans OMEGA');
    expect(taxonomyLabel('future_code')).toBe('Future code');
  });
});
