import {
  CRITERION_CERTAINTY,
  CRITERION_EVENT_TYPES,
  CRITERION_FLEXIBILITY,
  CRITERION_IMPORTANCE,
  CRITERION_KEYS,
  CRITERION_MATCHING_ROLES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  TIM_AGREEMENT_STATUSES,
  TIM_AGREEMENT_TYPES,
  TIM_COMPENSATION_STATUSES,
  TIM_FEE_BASES,
  TIM_INFORMATION_NATURES,
  TIM_OPERATION_STATUSES,
  TIM_OPERATION_TYPES,
  TIM_PARTY_ROLES,
  TIM_PAYMENT_KINDS,
  TIM_PAYMENT_STATUSES,
  TIM_STATUS_AXES,
  isStageAllowedForProject,
  isTaxonomyCode,
  type CriterionCertainty,
  type CriterionEventType,
  type CriterionFlexibility,
  type CriterionImportance,
  type CriterionKey,
  type CriterionMatchingRole,
  type ProjectStage,
  type ProjectStatus,
  type ProjectType,
  type TimAgreementStatus,
  type TimAgreementType,
  type TimCompensationStatus,
  type TimFeeBase,
  type TimInformationNature,
  type TimOperationStatus,
  type TimOperationType,
  type TimPartyRole,
  type TimPaymentKind,
  type TimPaymentStatus,
  type TimStatusAxis,
} from './taxonomy';

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; issues: ValidationIssue[] };

type UnknownRecord = Record<string, unknown>;

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const STABLE_ID = /^[A-Za-z0-9](?:[A-Za-z0-9._:-]{0,126}[A-Za-z0-9])?$/;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9](?:[A-Za-z0-9._:-]{6,126}[A-Za-z0-9])?$/;
const ISO_CURRENCY = /^[A-Z]{3}$/;

const recordOf = (input: unknown): UnknownRecord | undefined =>
  typeof input === 'object' && input !== null && !Array.isArray(input)
    ? (input as UnknownRecord)
    : undefined;

const pushIssue = (
  issues: ValidationIssue[],
  path: string,
  code: string,
  message: string,
): void => {
  issues.push({ path, code, message });
};

const textValue = (
  value: unknown,
  issues: ValidationIssue[],
  path: string,
  options: { required?: boolean; max?: number } = {},
): string | undefined => {
  const required = options.required ?? false;
  const max = options.max ?? 500;

  if (value === undefined || value === null || value === '') {
    if (required) pushIssue(issues, path, 'required', 'Ce champ est obligatoire.');
    return undefined;
  }

  if (typeof value !== 'string') {
    pushIssue(issues, path, 'invalid_type', 'La valeur doit être un texte.');
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    if (required) pushIssue(issues, path, 'required', 'Ce champ est obligatoire.');
    return undefined;
  }

  if (normalized.length > max) {
    pushIssue(issues, path, 'too_long', `Le texte ne peut pas dépasser ${max} caractères.`);
    return undefined;
  }

  if (CONTROL_CHARACTERS.test(normalized)) {
    pushIssue(issues, path, 'control_character', 'Le texte contient un caractère de contrôle interdit.');
    return undefined;
  }

  return normalized;
};

const stableIdValue = (
  value: unknown,
  issues: ValidationIssue[],
  path: string,
): string | undefined => {
  const normalized = textValue(value, issues, path, { required: true, max: 128 });
  if (normalized && !STABLE_ID.test(normalized)) {
    pushIssue(issues, path, 'invalid_id', 'L’identifiant interne a un format invalide.');
    return undefined;
  }
  return normalized;
};

const isoDateValue = (
  value: unknown,
  issues: ValidationIssue[],
  path: string,
  required = false,
): string | undefined => {
  const normalized = textValue(value, issues, path, { required, max: 64 });
  if (!normalized) return undefined;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    pushIssue(issues, path, 'invalid_date', 'La date est invalide.');
    return undefined;
  }
  return parsed.toISOString();
};

const booleanValue = (
  value: unknown,
  issues: ValidationIssue[],
  path: string,
): boolean | undefined => {
  if (typeof value !== 'boolean') {
    pushIssue(issues, path, 'invalid_type', 'La valeur doit être un booléen.');
    return undefined;
  }
  return value;
};

const integerValue = (
  value: unknown,
  issues: ValidationIssue[],
  path: string,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
): number | undefined => {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    pushIssue(issues, path, 'invalid_integer', `La valeur doit être un entier compris entre ${minimum} et ${maximum}.`);
    return undefined;
  }
  return value as number;
};

const codeValue = <T extends string>(
  value: unknown,
  codes: readonly T[],
  issues: ValidationIssue[],
  path: string,
): T | undefined => {
  if (!isTaxonomyCode(value, codes)) {
    pushIssue(issues, path, 'invalid_code', 'La valeur ne fait pas partie de la taxonomie autorisée.');
    return undefined;
  }
  return value;
};

const result = <T>(issues: ValidationIssue[], data: T): ValidationResult<T> =>
  issues.length > 0 ? { success: false, issues } : { success: true, data };

export interface HardCriterionInput {
  certainty: CriterionCertainty;
  importance: CriterionImportance;
  flexibility: CriterionFlexibility;
  matchingRole: CriterionMatchingRole;
  hardValidated: boolean;
}

/**
 * The sole rule that may classify a criterion as blocking. Partial matches are
 * deliberately false; inferred and to_confirm values can never exclude a
 * property automatically.
 */
export const isStrictHardCriterion = (criterion: HardCriterionInput): boolean =>
  criterion.certainty === 'confirmed'
  && criterion.importance === 'essential'
  && criterion.flexibility === 'none'
  && criterion.matchingRole === 'hard'
  && criterion.hardValidated === true;

export interface ProjectDraft {
  id: string;
  type: ProjectType;
  status: ProjectStatus;
  stage: ProjectStage;
  objective?: string;
  timeline?: string;
  version: number;
}

export const validateProjectDraft = (input: unknown): ValidationResult<ProjectDraft> => {
  const issues: ValidationIssue[] = [];
  const source = recordOf(input);
  if (!source) return { success: false, issues: [{ path: '', code: 'invalid_type', message: 'Le projet doit être un objet.' }] };

  const id = stableIdValue(source.id, issues, 'id') ?? '';
  const type = codeValue(source.type, PROJECT_TYPES, issues, 'type');
  const status = codeValue(source.status, PROJECT_STATUSES, issues, 'status');
  const stage = type && isStageAllowedForProject(type, source.stage)
    ? source.stage
    : undefined;
  if (!stage) pushIssue(issues, 'stage', 'invalid_stage', 'Cette étape n’est pas autorisée pour ce type de projet.');

  const objective = textValue(source.objective, issues, 'objective', { max: 2_000 });
  const timeline = textValue(source.timeline, issues, 'timeline', { max: 500 });
  const version = integerValue(source.version, issues, 'version', 1) ?? 1;

  return result(issues, {
    id,
    type: type ?? 'other',
    status: status ?? 'new',
    stage: stage ?? 'new_contact',
    ...(objective ? { objective } : {}),
    ...(timeline ? { timeline } : {}),
    version,
  });
};

export interface CreateLinkedPurchaseSaleCommand {
  personId: string;
  relationshipId: string;
  purchaseProject: ProjectDraft;
  saleProject: ProjectDraft;
}

export interface ValidatedLinkedPurchaseSaleCommand extends CreateLinkedPurchaseSaleCommand {
  relationship: {
    id: string;
    fromProjectId: string;
    toProjectId: string;
    type: 'purchase_depends_on_sale';
  };
}

/**
 * "Achat et vente liés" is a creation command, never a persisted project type.
 * The command creates two distinct aggregates plus their explicit relationship.
 */
export const validateLinkedPurchaseSaleCommand = (
  input: unknown,
): ValidationResult<ValidatedLinkedPurchaseSaleCommand> => {
  const issues: ValidationIssue[] = [];
  const source = recordOf(input);
  if (!source) return { success: false, issues: [{ path: '', code: 'invalid_type', message: 'La commande doit être un objet.' }] };

  const personId = stableIdValue(source.personId, issues, 'personId') ?? '';
  const relationshipId = stableIdValue(source.relationshipId, issues, 'relationshipId') ?? '';
  const purchaseResult = validateProjectDraft(source.purchaseProject);
  const saleResult = validateProjectDraft(source.saleProject);

  if (!purchaseResult.success) {
    issues.push(...purchaseResult.issues.map((issue) => ({ ...issue, path: `purchaseProject${issue.path ? `.${issue.path}` : ''}` })));
  }
  if (!saleResult.success) {
    issues.push(...saleResult.issues.map((issue) => ({ ...issue, path: `saleProject${issue.path ? `.${issue.path}` : ''}` })));
  }

  if (purchaseResult.success && purchaseResult.data.type !== 'primary_residence_purchase') {
    pushIssue(issues, 'purchaseProject.type', 'invalid_linked_purchase_type', 'Le volet achat doit être un achat de résidence principale.');
  }
  if (saleResult.success && saleResult.data.type !== 'sale') {
    pushIssue(issues, 'saleProject.type', 'invalid_linked_sale_type', 'Le volet vente doit être un projet de vente.');
  }
  if (purchaseResult.success && saleResult.success && purchaseResult.data.id === saleResult.data.id) {
    pushIssue(issues, 'saleProject.id', 'same_project', 'L’achat et la vente doivent être deux projets distincts.');
  }

  if (issues.length || !purchaseResult.success || !saleResult.success) return { success: false, issues };

  return {
    success: true,
    data: {
      personId,
      relationshipId,
      purchaseProject: purchaseResult.data,
      saleProject: saleResult.data,
      relationship: {
        id: relationshipId,
        fromProjectId: purchaseResult.data.id,
        toProjectId: saleResult.data.id,
        type: 'purchase_depends_on_sale',
      },
    },
  };
};

export interface CriterionEventInput extends HardCriterionInput {
  id: string;
  buyerSearchId: string;
  scenarioId: string;
  eventType: CriterionEventType;
  key: CriterionKey;
  customLabel?: string;
  value: string;
  source: string;
  effectiveAt: string;
  recordedAt: string;
  supersedesEventId?: string;
  reason?: string;
}

export interface ValidatedCriterionEvent extends CriterionEventInput {
  isBlocking: boolean;
}

export const validateCriterionEvent = (input: unknown): ValidationResult<ValidatedCriterionEvent> => {
  const issues: ValidationIssue[] = [];
  const source = recordOf(input);
  if (!source) return { success: false, issues: [{ path: '', code: 'invalid_type', message: 'L’événement de critère doit être un objet.' }] };

  const id = stableIdValue(source.id, issues, 'id') ?? '';
  const buyerSearchId = stableIdValue(source.buyerSearchId, issues, 'buyerSearchId') ?? '';
  const scenarioId = stableIdValue(source.scenarioId, issues, 'scenarioId') ?? '';
  const eventType = codeValue(source.eventType, CRITERION_EVENT_TYPES, issues, 'eventType') ?? 'set';
  const key = codeValue(source.key, CRITERION_KEYS, issues, 'key') ?? 'other';
  const customLabel = textValue(source.customLabel, issues, 'customLabel', { max: 100 });
  if (key === 'other' && !customLabel) {
    pushIssue(issues, 'customLabel', 'required_for_other', 'Un libellé contrôlé est requis pour un autre critère.');
  }

  const value = textValue(source.value, issues, 'value', { required: true, max: 2_000 }) ?? '';
  const importance = codeValue(source.importance, CRITERION_IMPORTANCE, issues, 'importance') ?? 'contextual';
  const flexibility = codeValue(source.flexibility, CRITERION_FLEXIBILITY, issues, 'flexibility') ?? 'unknown';
  const certainty = codeValue(source.certainty, CRITERION_CERTAINTY, issues, 'certainty') ?? 'to_confirm';
  const matchingRole = codeValue(source.matchingRole, CRITERION_MATCHING_ROLES, issues, 'matchingRole') ?? 'unknown';
  const hardValidated = booleanValue(source.hardValidated, issues, 'hardValidated') ?? false;
  const criterionSource = textValue(source.source, issues, 'source', { required: true, max: 500 }) ?? '';
  const effectiveAt = isoDateValue(source.effectiveAt, issues, 'effectiveAt', true) ?? '';
  const recordedAt = isoDateValue(source.recordedAt, issues, 'recordedAt', true) ?? '';
  const supersedesEventId = source.supersedesEventId === undefined
    ? undefined
    : stableIdValue(source.supersedesEventId, issues, 'supersedesEventId');
  if (supersedesEventId && supersedesEventId === id) {
    pushIssue(issues, 'supersedesEventId', 'self_supersession', 'Un événement ne peut pas se remplacer lui-même.');
  }
  const reason = textValue(source.reason, issues, 'reason', { max: 1_000 });

  const strictInput: HardCriterionInput = { certainty, importance, flexibility, matchingRole, hardValidated };
  const normalized: ValidatedCriterionEvent = {
    id,
    buyerSearchId,
    scenarioId,
    eventType,
    key,
    ...(customLabel ? { customLabel } : {}),
    value,
    ...strictInput,
    source: criterionSource,
    effectiveAt,
    recordedAt,
    ...(supersedesEventId ? { supersedesEventId } : {}),
    ...(reason ? { reason } : {}),
    isBlocking: isStrictHardCriterion(strictInput),
  };

  return result(issues, normalized);
};

export interface TimAgreementPartyInput {
  advisorId: string;
  role: TimPartyRole;
  responsibility?: string;
}

export interface TimAgreementDraft {
  id: string;
  internalReference: string;
  label: string;
  agreementType: TimAgreementType;
  operationType: TimOperationType;
  informationNature: TimInformationNature;
  parties: TimAgreementPartyInput[];
  transmittedAt: string;
  formalizedAt?: string;
  formSigned: boolean;
  omegaUploaded: boolean;
  mandateObtained: boolean;
  mandateReference?: string;
  subjectLabel?: string;
  propertyOrProjectLabel?: string;
  nextAction?: string;
  dueAt?: string;
  notes?: string;
  version: number;
}

export const validateTimAgreement = (input: unknown): ValidationResult<TimAgreementDraft> => {
  const issues: ValidationIssue[] = [];
  const source = recordOf(input);
  if (!source) return { success: false, issues: [{ path: '', code: 'invalid_type', message: 'L’Accord TIM doit être un objet.' }] };

  const id = stableIdValue(source.id, issues, 'id') ?? '';
  const internalReference = textValue(source.internalReference, issues, 'internalReference', { required: true, max: 80 }) ?? '';
  const label = textValue(source.label, issues, 'label', { required: true, max: 200 }) ?? '';
  const agreementType = codeValue(source.agreementType, TIM_AGREEMENT_TYPES, issues, 'agreementType') ?? 'custom';
  const operationType = codeValue(source.operationType, TIM_OPERATION_TYPES, issues, 'operationType') ?? 'other';
  const informationNature = codeValue(source.informationNature, TIM_INFORMATION_NATURES, issues, 'informationNature') ?? 'other';

  const rawParties = Array.isArray(source.parties) ? source.parties : [];
  if (!Array.isArray(source.parties)) pushIssue(issues, 'parties', 'invalid_type', 'Les parties doivent former une liste.');
  const parties: TimAgreementPartyInput[] = [];
  rawParties.forEach((candidate, index) => {
    const party = recordOf(candidate);
    if (!party) {
      pushIssue(issues, `parties.${index}`, 'invalid_type', 'La partie doit être un objet.');
      return;
    }
    const advisorId = stableIdValue(party.advisorId, issues, `parties.${index}.advisorId`) ?? '';
    const role = codeValue(party.role, TIM_PARTY_ROLES, issues, `parties.${index}.role`) ?? 'other';
    const responsibility = textValue(party.responsibility, issues, `parties.${index}.responsibility`, { max: 300 });
    if (role === 'other' && !responsibility) {
      pushIssue(issues, `parties.${index}.responsibility`, 'required_for_other', 'La responsabilité est requise pour le rôle other.');
    }
    parties.push({ advisorId, role, ...(responsibility ? { responsibility } : {}) });
  });

  if (new Set(parties.map((party) => party.advisorId)).size !== parties.length) {
    pushIssue(issues, 'parties', 'duplicate_advisor', 'Un conseiller ne peut apparaître qu’une fois dans un accord.');
  }
  if (parties.length < 2) {
    pushIssue(issues, 'parties', 'missing_parties', 'Un Accord TIM doit réunir au moins deux conseillers.');
  }

  const roles = new Map(parties.map((party) => [party.role, party.advisorId]));
  if (agreementType === 'information_referral_20_80'
      && (!roles.has('referrer') || !roles.has('handling_advisor') || roles.get('referrer') === roles.get('handling_advisor'))) {
    pushIssue(issues, 'parties', 'missing_referral_roles', 'Un envoi d’information exige un apporteur et un conseiller traitant distincts.');
  }
  if (agreementType === 'mandate_50_50'
      && (!roles.has('seller_mandate_advisor') || !roles.has('buyer_advisor') || roles.get('seller_mandate_advisor') === roles.get('buyer_advisor'))) {
    pushIssue(issues, 'parties', 'missing_mandate_roles', 'Un mandat 50/50 exige un conseiller vendeur et un conseiller acquéreur distincts.');
  }

  const transmittedAt = isoDateValue(source.transmittedAt, issues, 'transmittedAt', true) ?? '';
  const formalizedAt = isoDateValue(source.formalizedAt, issues, 'formalizedAt');
  const formSigned = booleanValue(source.formSigned, issues, 'formSigned') ?? false;
  const omegaUploaded = booleanValue(source.omegaUploaded, issues, 'omegaUploaded') ?? false;
  const mandateObtained = booleanValue(source.mandateObtained, issues, 'mandateObtained') ?? false;
  const mandateReference = textValue(source.mandateReference, issues, 'mandateReference', { max: 100 });
  const subjectLabel = textValue(source.subjectLabel, issues, 'subjectLabel', { max: 200 });
  const propertyOrProjectLabel = textValue(source.propertyOrProjectLabel, issues, 'propertyOrProjectLabel', { max: 200 });
  const nextAction = textValue(source.nextAction, issues, 'nextAction', { max: 300 });
  const dueAt = isoDateValue(source.dueAt, issues, 'dueAt');
  const notes = textValue(source.notes, issues, 'notes', { max: 2_000 });
  const version = integerValue(source.version, issues, 'version', 1) ?? 1;

  if (omegaUploaded && !formSigned) {
    pushIssue(issues, 'omegaUploaded', 'unsigned_form', 'Le dépôt OMEGA ne peut pas être confirmé sans formulaire signé.');
  }

  return result(issues, {
    id,
    internalReference,
    label,
    agreementType,
    operationType,
    informationNature,
    parties,
    transmittedAt,
    ...(formalizedAt ? { formalizedAt } : {}),
    formSigned,
    omegaUploaded,
    mandateObtained,
    ...(mandateReference ? { mandateReference } : {}),
    ...(subjectLabel ? { subjectLabel } : {}),
    ...(propertyOrProjectLabel ? { propertyOrProjectLabel } : {}),
    ...(nextAction ? { nextAction } : {}),
    ...(dueAt ? { dueAt } : {}),
    ...(notes ? { notes } : {}),
    version,
  });
};

export interface TimTermsAllocationInput {
  advisorId: string;
  basisPoints: number;
}

export interface TimTermsInput {
  id: string;
  agreementId: string;
  version: number;
  agreementType: TimAgreementType;
  operationType: TimOperationType;
  feeBasis: TimFeeBase;
  currency: string;
  triggeringEvent: string;
  allocations: TimTermsAllocationInput[];
  termsConfirmed: boolean;
  allocationsConfirmed: boolean;
  effectiveAt: string;
}

export const validateTimTerms = (input: unknown): ValidationResult<TimTermsInput> => {
  const issues: ValidationIssue[] = [];
  const source = recordOf(input);
  if (!source) return { success: false, issues: [{ path: '', code: 'invalid_type', message: 'Les termes TIM doivent être un objet.' }] };

  const id = stableIdValue(source.id, issues, 'id') ?? '';
  const agreementId = stableIdValue(source.agreementId, issues, 'agreementId') ?? '';
  const version = integerValue(source.version, issues, 'version', 1) ?? 1;
  const agreementType = codeValue(source.agreementType, TIM_AGREEMENT_TYPES, issues, 'agreementType') ?? 'custom';
  const operationType = codeValue(source.operationType, TIM_OPERATION_TYPES, issues, 'operationType') ?? 'other';
  const feeBasis = codeValue(source.feeBasis, TIM_FEE_BASES, issues, 'feeBasis') ?? 'unknown';
  const currencyRaw = textValue(source.currency, issues, 'currency', { required: true, max: 16 }) ?? '';
  const currency = currencyRaw.toUpperCase();
  if (currency && !ISO_CURRENCY.test(currency)) pushIssue(issues, 'currency', 'invalid_currency', 'La devise doit utiliser trois lettres ISO.');
  const triggeringEvent = textValue(source.triggeringEvent, issues, 'triggeringEvent', { required: true, max: 300 }) ?? '';
  const termsConfirmed = booleanValue(source.termsConfirmed, issues, 'termsConfirmed') ?? false;
  const allocationsConfirmed = booleanValue(source.allocationsConfirmed, issues, 'allocationsConfirmed') ?? false;
  const effectiveAt = isoDateValue(source.effectiveAt, issues, 'effectiveAt', true) ?? '';

  const rawAllocations = Array.isArray(source.allocations) ? source.allocations : [];
  if (!Array.isArray(source.allocations)) pushIssue(issues, 'allocations', 'invalid_type', 'Les allocations doivent former une liste.');
  const allocations: TimTermsAllocationInput[] = [];
  rawAllocations.forEach((candidate, index) => {
    const allocation = recordOf(candidate);
    if (!allocation) {
      pushIssue(issues, `allocations.${index}`, 'invalid_type', 'L’allocation doit être un objet.');
      return;
    }
    const advisorId = stableIdValue(allocation.advisorId, issues, `allocations.${index}.advisorId`) ?? '';
    const basisPoints = integerValue(allocation.basisPoints, issues, `allocations.${index}.basisPoints`, 0, 10_000) ?? 0;
    allocations.push({ advisorId, basisPoints });
  });

  if (new Set(allocations.map((allocation) => allocation.advisorId)).size !== allocations.length) {
    pushIssue(issues, 'allocations', 'duplicate_advisor', 'Chaque conseiller ne peut recevoir qu’une allocation par version.');
  }
  const totalBasisPoints = allocations.reduce((sum, allocation) => sum + allocation.basisPoints, 0);
  if (totalBasisPoints > 10_000) {
    pushIssue(issues, 'allocations', 'over_allocated', 'Les allocations dépassent 100 %.');
  }
  if (allocations.length > 0 && !allocationsConfirmed) {
    pushIssue(issues, 'allocationsConfirmed', 'confirmation_required', 'Les allocations doivent être confirmées explicitement avant enregistrement.');
  }
  if (!termsConfirmed) {
    pushIssue(issues, 'termsConfirmed', 'confirmation_required', 'Les termes doivent être confirmés explicitement avant enregistrement.');
  }

  // The agreement code names common practices, not immutable percentages.
  // Deliberately no 20/80 or 50/50 equality check is performed here.
  return result(issues, {
    id,
    agreementId,
    version,
    agreementType,
    operationType,
    feeBasis,
    currency,
    triggeringEvent,
    allocations,
    termsConfirmed,
    allocationsConfirmed,
    effectiveAt,
  });
};

export interface TimStatusChangeInput {
  axis: TimStatusAxis;
  fromStatus: TimAgreementStatus | TimOperationStatus | TimCompensationStatus;
  toStatus: TimAgreementStatus | TimOperationStatus | TimCompensationStatus;
  effectiveAt: string;
  reason?: string;
}

export const validateTimStatusChange = (input: unknown): ValidationResult<TimStatusChangeInput> => {
  const issues: ValidationIssue[] = [];
  const source = recordOf(input);
  if (!source) return { success: false, issues: [{ path: '', code: 'invalid_type', message: 'Le changement d’état doit être un objet.' }] };
  const axis = codeValue(source.axis, TIM_STATUS_AXES, issues, 'axis') ?? 'agreement';
  const statusCodes = axis === 'agreement'
    ? TIM_AGREEMENT_STATUSES
    : axis === 'operation'
      ? TIM_OPERATION_STATUSES
      : TIM_COMPENSATION_STATUSES;
  const fromStatus = codeValue(source.fromStatus, statusCodes, issues, 'fromStatus') ?? statusCodes[0];
  const toStatus = codeValue(source.toStatus, statusCodes, issues, 'toStatus') ?? statusCodes[0];
  if (fromStatus === toStatus) pushIssue(issues, 'toStatus', 'unchanged', 'Le nouvel état doit être différent de l’état courant.');
  const effectiveAt = isoDateValue(source.effectiveAt, issues, 'effectiveAt', true) ?? '';
  const reason = textValue(source.reason, issues, 'reason', { max: 1_000 });
  return result(issues, {
    axis,
    fromStatus,
    toStatus,
    effectiveAt,
    ...(reason ? { reason } : {}),
  });
};

export interface TimPaymentInput {
  id: string;
  compensationId: string;
  kind: TimPaymentKind;
  amountMinor: number;
  currency: string;
  status: TimPaymentStatus;
  paidAt?: string;
  idempotencyKey: string;
  reversesPaymentId?: string;
  reference?: string;
}

export const validateTimPayment = (input: unknown): ValidationResult<TimPaymentInput> => {
  const issues: ValidationIssue[] = [];
  const source = recordOf(input);
  if (!source) return { success: false, issues: [{ path: '', code: 'invalid_type', message: 'Le paiement doit être un objet.' }] };

  const id = stableIdValue(source.id, issues, 'id') ?? '';
  const compensationId = stableIdValue(source.compensationId, issues, 'compensationId') ?? '';
  const kind = source.kind === undefined
    ? 'payment'
    : codeValue(source.kind, TIM_PAYMENT_KINDS, issues, 'kind') ?? 'payment';
  const amountMinimum = kind === 'refund' ? -Number.MAX_SAFE_INTEGER : kind === 'adjustment' ? -Number.MAX_SAFE_INTEGER : 1;
  const amountMinor = integerValue(source.amountMinor, issues, 'amountMinor', amountMinimum) ?? 0;
  if ((kind === 'refund' && amountMinor >= 0) || (kind === 'adjustment' && amountMinor === 0)) {
    pushIssue(issues, 'amountMinor', 'invalid_signed_amount', 'Le signe du montant ne correspond pas à la nature du mouvement.');
  }
  const currencyRaw = textValue(source.currency, issues, 'currency', { required: true, max: 16 }) ?? '';
  const currency = currencyRaw.toUpperCase();
  if (currency && !ISO_CURRENCY.test(currency)) pushIssue(issues, 'currency', 'invalid_currency', 'La devise doit utiliser trois lettres ISO.');
  const status = source.status === undefined
    ? 'confirmed'
    : codeValue(source.status, TIM_PAYMENT_STATUSES, issues, 'status') ?? 'pending';
  const paidAt = isoDateValue(source.paidAt, issues, 'paidAt', status === 'confirmed') ?? '';
  const idempotencyKey = textValue(source.idempotencyKey, issues, 'idempotencyKey', { required: true, max: 128 }) ?? '';
  if (idempotencyKey && !IDEMPOTENCY_KEY.test(idempotencyKey)) {
    pushIssue(issues, 'idempotencyKey', 'invalid_idempotency_key', 'La clé d’idempotence a un format invalide.');
  }
  const reversesPaymentId = source.reversesPaymentId === undefined
    ? undefined
    : stableIdValue(source.reversesPaymentId, issues, 'reversesPaymentId');
  if (reversesPaymentId && reversesPaymentId === id) {
    pushIssue(issues, 'reversesPaymentId', 'self_reversal', 'Un mouvement ne peut pas s’annuler lui-même.');
  }
  const reference = textValue(source.reference, issues, 'reference', { max: 160 });

  return result(issues, {
    id,
    compensationId,
    kind,
    amountMinor,
    currency,
    status,
    ...(paidAt ? { paidAt } : {}),
    idempotencyKey,
    ...(reversesPaymentId ? { reversesPaymentId } : {}),
    ...(reference ? { reference } : {}),
  });
};

export interface TimCompensationInput {
  id: string;
  agreementId: string;
  beneficiaryPartyId: string;
  termsId: string;
  supersedesCompensationId?: string;
  status: TimCompensationStatus;
  estimatedTotalFeesMinor: number;
  estimatedShareMinor: number;
  amountDueMinor: number;
  amountPaidMinor: number;
  currency: string;
  dueAt?: string;
  expectedPaymentAt?: string;
  note?: string;
  version: number;
}

export const validateTimCompensation = (input: unknown): ValidationResult<TimCompensationInput> => {
  const issues: ValidationIssue[] = [];
  const source = recordOf(input);
  if (!source) return { success: false, issues: [{ path: '', code: 'invalid_type', message: 'La rémunération doit être un objet.' }] };

  const id = stableIdValue(source.id, issues, 'id') ?? '';
  const agreementId = stableIdValue(source.agreementId, issues, 'agreementId') ?? '';
  const beneficiaryPartyId = stableIdValue(source.beneficiaryPartyId, issues, 'beneficiaryPartyId') ?? '';
  const termsId = stableIdValue(source.termsId, issues, 'termsId') ?? '';
  const supersedesCompensationId = source.supersedesCompensationId === undefined
    ? undefined
    : stableIdValue(source.supersedesCompensationId, issues, 'supersedesCompensationId');
  if (supersedesCompensationId && supersedesCompensationId === id) {
    pushIssue(issues, 'supersedesCompensationId', 'self_supersession', 'Une rémunération ne peut pas se remplacer elle-même.');
  }
  const status = codeValue(source.status, TIM_COMPENSATION_STATUSES, issues, 'status') ?? 'not_due';
  const estimatedTotalFeesMinor = integerValue(source.estimatedTotalFeesMinor, issues, 'estimatedTotalFeesMinor', 0) ?? 0;
  const estimatedShareMinor = integerValue(source.estimatedShareMinor, issues, 'estimatedShareMinor', 0) ?? 0;
  const amountDueMinor = integerValue(source.amountDueMinor, issues, 'amountDueMinor', 0) ?? 0;
  const amountPaidMinor = integerValue(source.amountPaidMinor, issues, 'amountPaidMinor', 0) ?? 0;
  const currencyRaw = textValue(source.currency, issues, 'currency', { required: true, max: 16 }) ?? '';
  const currency = currencyRaw.toUpperCase();
  if (currency && !ISO_CURRENCY.test(currency)) pushIssue(issues, 'currency', 'invalid_currency', 'La devise doit utiliser trois lettres ISO.');
  const dueAt = isoDateValue(source.dueAt, issues, 'dueAt');
  const expectedPaymentAt = isoDateValue(source.expectedPaymentAt, issues, 'expectedPaymentAt');
  const note = textValue(source.note, issues, 'note', { max: 1_000 });
  const version = integerValue(source.version, issues, 'version', 1) ?? 1;

  if (status === 'estimated' && estimatedTotalFeesMinor === 0 && estimatedShareMinor === 0) {
    pushIssue(issues, 'status', 'missing_estimate', 'Une rémunération estimée doit comporter au moins un montant estimé.');
  }
  if (['due', 'paid'].includes(status) && amountDueMinor === 0) {
    pushIssue(issues, 'amountDueMinor', 'missing_due_amount', 'Une rémunération due ou payée doit comporter un montant dû.');
  }
  if (status === 'paid' && amountPaidMinor < amountDueMinor) {
    pushIssue(issues, 'amountPaidMinor', 'insufficient_payment', 'Le statut payé exige que le montant payé couvre le montant dû.');
  }

  return result(issues, {
    id,
    agreementId,
    beneficiaryPartyId,
    termsId,
    ...(supersedesCompensationId ? { supersedesCompensationId } : {}),
    status,
    estimatedTotalFeesMinor,
    estimatedShareMinor,
    amountDueMinor,
    amountPaidMinor,
    currency,
    ...(dueAt ? { dueAt } : {}),
    ...(expectedPaymentAt ? { expectedPaymentAt } : {}),
    ...(note ? { note } : {}),
    version,
  });
};
