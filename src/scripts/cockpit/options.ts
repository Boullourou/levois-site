import {
  BUYER_PROJECT_STAGES,
  CONTACT_ORIGINS as CONTACT_ORIGIN_CODES,
  CRITERION_CERTAINTY,
  CRITERION_FLEXIBILITY,
  CRITERION_IMPORTANCE,
  CRITERION_KEYS,
  CRITERION_MATCHING_ROLES,
  INTERACTION_TYPES,
  LAB_OBSERVATION_STATUSES,
  PROJECT_STATUSES as PROJECT_STATUS_CODES,
  PROJECT_TYPES as PROJECT_TYPE_CODES,
  SEARCH_SCENARIO_TYPES,
  SELLER_PROJECT_STAGES,
  TASK_PRIORITIES,
  TIM_AGREEMENT_STATUSES as TIM_AGREEMENT_STATUS_CODES,
  TIM_AGREEMENT_TYPES as TIM_AGREEMENT_TYPE_CODES,
  TIM_COMPENSATION_STATUSES as TIM_COMPENSATION_STATUS_CODES,
  TIM_INFORMATION_NATURES as TIM_INFORMATION_NATURE_CODES,
  TIM_OPERATION_STATUSES as TIM_OPERATION_STATUS_CODES,
  TIM_OPERATION_TYPES,
  taxonomyLabel,
} from '../../lib/cockpit/taxonomy';

export type Option = Readonly<{ value: string; label: string }>;
const options = (codes: readonly string[]): readonly Option[] => codes.map((value) => ({ value, label: taxonomyLabel(value) }));

const projectOptions = options(PROJECT_TYPE_CODES);
export const PROJECT_TYPES: readonly Option[] = [
  projectOptions.find((option) => option.value === 'primary_residence_purchase')!,
  projectOptions.find((option) => option.value === 'sale')!,
  { value: 'linked_purchase_sale', label: 'Achat et vente liés' },
  projectOptions.find((option) => option.value === 'investment')!,
  projectOptions.find((option) => option.value === 'other')!,
];
export const PROJECT_STATUSES = options(PROJECT_STATUS_CODES);
export const BUYER_STAGES = options(BUYER_PROJECT_STAGES);
export const SELLER_STAGES = options(SELLER_PROJECT_STAGES);
export const PROJECT_STAGES = [...BUYER_STAGES, ...SELLER_STAGES.filter(
  (seller) => !BUYER_STAGES.some((buyer) => buyer.value === seller.value),
)];
export const CONTACT_ORIGINS = options(CONTACT_ORIGIN_CODES);
export const CRITERION_TYPES = options(CRITERION_KEYS);
export const SCENARIO_TYPES = options(SEARCH_SCENARIO_TYPES);
export const IMPORTANCE_LEVELS = options(CRITERION_IMPORTANCE);
export const FLEXIBILITY_LEVELS = options(CRITERION_FLEXIBILITY);
export const CERTAINTY_LEVELS = options(CRITERION_CERTAINTY);
export const MATCHING_ROLES = options(CRITERION_MATCHING_ROLES);
export const INTERACTION_CHANNELS = options(INTERACTION_TYPES);
export const PRIORITIES = options(TASK_PRIORITIES.slice().reverse());
export const TIM_AGREEMENT_TYPES: readonly Option[] = TIM_AGREEMENT_TYPE_CODES.map((value) => ({
  value,
  label: value === 'information_referral_20_80'
    ? 'Envoi d’information 20/80'
    : value === 'mandate_50_50'
      ? 'Mandat 50/50'
      : taxonomyLabel(value),
}));
export const TIM_TRANSACTION_TYPES = options(TIM_OPERATION_TYPES);
export const TIM_INFORMATION_NATURES = options(TIM_INFORMATION_NATURE_CODES);
export const TIM_AGREEMENT_STATUSES = options(TIM_AGREEMENT_STATUS_CODES);
export const TIM_OPERATION_STATUSES = options(TIM_OPERATION_STATUS_CODES);
export const TIM_COMPENSATION_STATUSES = options(TIM_COMPENSATION_STATUS_CODES);
export const LAB_STATUSES = options(LAB_OBSERVATION_STATUSES);

export function labelFor(list: readonly Option[], value: unknown): string {
  if (typeof value !== 'string' || !value) return 'À préciser';
  return list.find((option) => option.value === value)?.label ?? taxonomyLabel(value);
}

export function stagesForProject(type: string): readonly Option[] {
  return type === 'sale' ? SELLER_STAGES : BUYER_STAGES;
}
