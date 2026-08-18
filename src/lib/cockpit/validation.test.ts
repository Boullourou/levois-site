import { describe, expect, it } from 'vitest';
import {
  isStrictHardCriterion,
  validateCriterionEvent,
  validateLinkedPurchaseSaleCommand,
  validateProjectDraft,
  validateTimAgreement,
  validateTimCompensation,
  validateTimPayment,
  validateTimStatusChange,
  validateTimTerms,
} from './validation';

const strictCriterion = {
  certainty: 'confirmed' as const,
  importance: 'essential' as const,
  flexibility: 'none' as const,
  matchingRole: 'hard' as const,
  hardValidated: true,
};

describe('strict criterion rule', () => {
  it('requires every condition and explicit human validation', () => {
    expect(isStrictHardCriterion(strictCriterion)).toBe(true);
    expect(isStrictHardCriterion({ ...strictCriterion, certainty: 'to_confirm' })).toBe(false);
    expect(isStrictHardCriterion({ ...strictCriterion, certainty: 'inferred' })).toBe(false);
    expect(isStrictHardCriterion({ ...strictCriterion, importance: 'important' })).toBe(false);
    expect(isStrictHardCriterion({ ...strictCriterion, flexibility: 'low' })).toBe(false);
    expect(isStrictHardCriterion({ ...strictCriterion, matchingRole: 'soft' })).toBe(false);
    expect(isStrictHardCriterion({ ...strictCriterion, hardValidated: false })).toBe(false);
  });

  it('keeps a to_confirm event valid but never blocking', () => {
    const result = validateCriterionEvent({
      id: 'criterion-demo-001',
      buyerSearchId: 'search-demo-001',
      scenarioId: 'scenario-demo-001',
      eventType: 'set',
      key: 'energy_rating',
      value: 'Classe E à confirmer',
      importance: 'essential',
      flexibility: 'none',
      certainty: 'to_confirm',
      matchingRole: 'hard',
      hardValidated: true,
      source: 'Question ouverte du rendez-vous fictif',
      effectiveAt: '2026-08-18T09:00:00+02:00',
      recordedAt: '2026-08-18T09:05:00+02:00',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isBlocking).toBe(false);
      expect(result.data.effectiveAt).toBe('2026-08-18T07:00:00.000Z');
    }
  });

  it('requires a controlled label for an other criterion and preserves supersession', () => {
    const invalid = validateCriterionEvent({
      id: 'criterion-demo-002',
      buyerSearchId: 'search-demo-001',
      scenarioId: 'scenario-demo-001',
      eventType: 'revise',
      key: 'other',
      value: 'Condition fictive',
      ...strictCriterion,
      source: 'Validation humaine',
      effectiveAt: '2026-08-18',
      recordedAt: '2026-08-18',
      supersedesEventId: 'criterion-demo-002',
    });

    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.issues.map((issue) => issue.code)).toEqual(
        expect.arrayContaining(['required_for_other', 'self_supersession']),
      );
    }
  });
});

describe('project validation', () => {
  it('refuses a seller stage on a buyer project', () => {
    const result = validateProjectDraft({
      id: 'project-demo-001',
      type: 'primary_residence_purchase',
      status: 'active',
      stage: 'mandate_active',
      version: 1,
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues.some((issue) => issue.code === 'invalid_stage')).toBe(true);
  });

  it('models linked purchase and sale as two projects plus one relationship', () => {
    const result = validateLinkedPurchaseSaleCommand({
      personId: 'person-demo-linked-001',
      relationshipId: 'relationship-demo-001',
      purchaseProject: {
        id: 'project-demo-purchase-001',
        type: 'primary_residence_purchase',
        status: 'active',
        stage: 'search_active',
        version: 1,
      },
      saleProject: {
        id: 'project-demo-sale-001',
        type: 'sale',
        status: 'qualifying',
        stage: 'qualification',
        version: 1,
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.purchaseProject.id).not.toBe(result.data.saleProject.id);
      expect(result.data.relationship).toEqual({
        id: 'relationship-demo-001',
        fromProjectId: 'project-demo-purchase-001',
        toProjectId: 'project-demo-sale-001',
        type: 'purchase_depends_on_sale',
      });
    }
  });

  it('refuses to flatten linked purchase and sale into one or mistyped project', () => {
    const result = validateLinkedPurchaseSaleCommand({
      personId: 'person-demo-linked-002',
      relationshipId: 'relationship-demo-002',
      purchaseProject: {
        id: 'project-demo-same-001',
        type: 'other',
        status: 'active',
        stage: 'search_active',
        version: 1,
      },
      saleProject: {
        id: 'project-demo-same-001',
        type: 'sale',
        status: 'active',
        stage: 'marketing',
        version: 1,
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.map((issue) => issue.code)).toEqual(
        expect.arrayContaining(['invalid_linked_purchase_type', 'same_project']),
      );
    }
  });
});

const referralAgreement = {
  id: 'tim-demo-sale-001',
  internalReference: 'TIM-DEMO-001',
  label: 'Transmission fictive secteur test',
  agreementType: 'information_referral_20_80',
  operationType: 'sale',
  informationNature: 'seller',
  parties: [
    { advisorId: 'advisor-demo-referrer', role: 'referrer' },
    { advisorId: 'advisor-demo-handler', role: 'handling_advisor' },
  ],
  transmittedAt: '2026-08-18',
  formalizedAt: '2026-08-19',
  formSigned: true,
  omegaUploaded: true,
  mandateObtained: false,
  nextAction: 'Vérifier le suivi fictif',
  dueAt: '2026-08-25',
  version: 1,
};

describe('TIM validation', () => {
  it('validates referral roles without hard-coding a distribution', () => {
    const agreement = validateTimAgreement(referralAgreement);
    expect(agreement.success).toBe(true);

    const terms = validateTimTerms({
      id: 'terms-demo-001',
      agreementId: referralAgreement.id,
      version: 1,
      agreementType: 'information_referral_20_80',
      operationType: 'sale',
      feeBasis: 'ht',
      currency: 'eur',
      triggeringEvent: 'Condition fictive explicitement convenue',
      allocations: [
        { advisorId: 'advisor-demo-referrer', basisPoints: 2_500 },
        { advisorId: 'advisor-demo-handler', basisPoints: 7_500 },
      ],
      termsConfirmed: true,
      allocationsConfirmed: true,
      effectiveAt: '2026-08-19',
    });
    expect(terms.success).toBe(true);
    if (terms.success) expect(terms.data.currency).toBe('EUR');
  });

  it('refuses a referral without both distinct operational roles', () => {
    const result = validateTimAgreement({
      ...referralAgreement,
      parties: [
        { advisorId: 'advisor-demo-a', role: 'referrer' },
        { advisorId: 'advisor-demo-b', role: 'other', responsibility: 'Observation fictive' },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues.some((issue) => issue.code === 'missing_referral_roles')).toBe(true);
  });

  it('allows manually confirmed rental terms with an unknown trigger', () => {
    const terms = validateTimTerms({
      id: 'terms-demo-rental-001',
      agreementId: 'tim-demo-rental-001',
      version: 1,
      agreementType: 'custom',
      operationType: 'rental',
      feeBasis: 'unknown',
      currency: 'EUR',
      triggeringEvent: 'unknown',
      allocations: [
        { advisorId: 'advisor-demo-a', basisPoints: 3_000 },
        { advisorId: 'advisor-demo-b', basisPoints: 7_000 },
      ],
      termsConfirmed: true,
      allocationsConfirmed: true,
      effectiveAt: '2026-08-20',
    });
    expect(terms.success).toBe(true);
  });

  it('requires explicit allocation confirmation and rejects over-allocation', () => {
    const result = validateTimTerms({
      id: 'terms-demo-002',
      agreementId: referralAgreement.id,
      version: 2,
      agreementType: 'information_referral_20_80',
      operationType: 'sale',
      feeBasis: 'ttc',
      currency: 'EUR',
      triggeringEvent: 'Condition fictive',
      allocations: [
        { advisorId: 'advisor-demo-referrer', basisPoints: 4_000 },
        { advisorId: 'advisor-demo-handler', basisPoints: 7_000 },
      ],
      termsConfirmed: true,
      allocationsConfirmed: false,
      effectiveAt: '2026-08-20',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues.map((issue) => issue.code)).toEqual(
        expect.arrayContaining(['over_allocated', 'confirmation_required']),
      );
    }
  });

  it('validates only the selected status axis', () => {
    const operationChange = validateTimStatusChange({
      axis: 'operation',
      fromStatus: 'contacted',
      toStatus: 'mandate_obtained',
      effectiveAt: '2026-08-21',
    });
    expect(operationChange.success).toBe(true);

    const wrongAxis = validateTimStatusChange({
      axis: 'operation',
      fromStatus: 'contacted',
      toStatus: 'paid',
      effectiveAt: '2026-08-21',
    });
    expect(wrongAxis.success).toBe(false);
  });

  it('requires integer minor units and a reusable idempotency key', () => {
    const valid = validateTimPayment({
      id: 'payment-demo-001',
      compensationId: 'compensation-demo-001',
      amountMinor: 12_345,
      currency: 'eur',
      paidAt: '2026-08-22',
      idempotencyKey: 'pay-demo-20260822-001',
      reference: 'Référence fictive',
    });
    expect(valid.success).toBe(true);

    const invalid = validateTimPayment({
      id: 'payment-demo-002',
      compensationId: 'compensation-demo-001',
      amountMinor: 12.34,
      currency: 'EURO',
      paidAt: 'not-a-date',
      idempotencyKey: 'short',
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.issues.map((issue) => issue.code)).toEqual(
        expect.arrayContaining(['invalid_integer', 'invalid_currency', 'invalid_date', 'invalid_idempotency_key']),
      );
    }
  });

  it('validates traceable compensation revisions and partial payments', () => {
    const partial = validateTimCompensation({
      id: 'compensation-demo-002',
      agreementId: 'tim-demo-sale-001',
      beneficiaryPartyId: 'party-demo-referrer',
      termsId: 'terms-demo-001',
      supersedesCompensationId: 'compensation-demo-001',
      status: 'due',
      estimatedTotalFeesMinor: 0,
      estimatedShareMinor: 0,
      amountDueMinor: 50_000,
      amountPaidMinor: 20_000,
      currency: 'EUR',
      expectedPaymentAt: '2026-09-01',
      version: 2,
    });
    expect(partial.success).toBe(true);

    const falselyPaid = validateTimCompensation({
      id: 'compensation-demo-003',
      agreementId: 'tim-demo-sale-001',
      beneficiaryPartyId: 'party-demo-referrer',
      termsId: 'terms-demo-001',
      status: 'paid',
      estimatedTotalFeesMinor: 0,
      estimatedShareMinor: 0,
      amountDueMinor: 50_000,
      amountPaidMinor: 20_000,
      currency: 'EUR',
      version: 3,
    });
    expect(falselyPaid.success).toBe(false);
    if (!falselyPaid.success) {
      expect(falselyPaid.issues.some((issue) => issue.code === 'insufficient_payment')).toBe(true);
    }
  });

  it('allows a signed refund only as a traceable reversal movement', () => {
    const result = validateTimPayment({
      id: 'payment-demo-refund-001',
      compensationId: 'compensation-demo-001',
      kind: 'refund',
      amountMinor: -2_000,
      currency: 'EUR',
      status: 'confirmed',
      paidAt: '2026-08-23',
      idempotencyKey: 'refund-demo-20260823-001',
      reversesPaymentId: 'payment-demo-001',
    });
    expect(result.success).toBe(true);
  });
});
