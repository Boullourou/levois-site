/**
 * Central vocabulary for the first LEVOIS cockpit slice.
 *
 * These codes are persisted and exchanged by the private API. Keep the code
 * stable; labels may evolve without rewriting historical records.
 */

export const PROJECT_TYPES = [
  'primary_residence_purchase',
  'sale',
  'investment',
  'other',
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  primary_residence_purchase: 'Achat de résidence principale',
  sale: 'Vente',
  investment: 'Investissement',
  other: 'Autre',
};

export const PROJECT_STATUSES = [
  'new',
  'qualifying',
  'active',
  'paused',
  'completed',
  'abandoned',
  'archived',
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const BUYER_PROJECT_STAGES = [
  'new_contact',
  'qualification',
  'project_defined',
  'search_active',
  'properties_proposed',
  'visit_preparing',
  'visit_completed',
  'offer_considered',
  'offer_submitted',
  'under_contract',
  'completed',
] as const;

export type BuyerProjectStage = (typeof BUYER_PROJECT_STAGES)[number];

export const SELLER_PROJECT_STAGES = [
  'new_contact',
  'qualification',
  'project_defined',
  'preparation',
  'mandate_pending',
  'mandate_active',
  'marketing',
  'visits',
  'offer_received',
  'under_contract',
  'completed',
] as const;

export type SellerProjectStage = (typeof SELLER_PROJECT_STAGES)[number];
export type ProjectStage = BuyerProjectStage | SellerProjectStage;

export const PROJECT_STAGES_BY_TYPE: Record<ProjectType, readonly ProjectStage[]> = {
  primary_residence_purchase: BUYER_PROJECT_STAGES,
  sale: SELLER_PROJECT_STAGES,
  investment: BUYER_PROJECT_STAGES,
  // An "other" project remains explicit: the operator may select either
  // vocabulary, while the objective records what the project actually is.
  other: [...new Set([...BUYER_PROJECT_STAGES, ...SELLER_PROJECT_STAGES])],
};

export const PROJECT_RELATIONSHIP_TYPES = [
  'purchase_depends_on_sale',
  'sale_enables_purchase',
  'related',
] as const;

export type ProjectRelationshipType = (typeof PROJECT_RELATIONSHIP_TYPES)[number];

export const CONTACT_ORIGINS = [
  'referral',
  'website',
  'professional_network',
  'property_portal',
  'event',
  'outbound',
  'tim',
  'other',
  'unknown',
] as const;

export type ContactOrigin = (typeof CONTACT_ORIGINS)[number];

export const SEARCH_SCENARIO_TYPES = ['preferred', 'acceptable', 'conditional'] as const;
export type SearchScenarioType = (typeof SEARCH_SCENARIO_TYPES)[number];

export const CRITERION_KEYS = [
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
] as const;

export type CriterionKey = (typeof CRITERION_KEYS)[number];

export const CRITERION_LABELS: Record<CriterionKey, string> = {
  property_type: 'Type de bien',
  zone: 'Zone',
  municipalities: 'Communes',
  max_travel_time: 'Temps de trajet maximal',
  budget: 'Budget',
  surface: 'Surface',
  bedrooms: 'Chambres',
  outdoor: 'Extérieur',
  works: 'Travaux',
  energy_rating: 'DPE',
  heating: 'Chauffage',
  financing: 'Financement',
  prior_sale: 'Vente préalable',
  horizon: 'Horizon',
  environment: 'Environnement',
  layout: 'Agencement',
  other: 'Autre critère',
};

export const CRITERION_IMPORTANCE = ['essential', 'important', 'preference', 'contextual'] as const;
export type CriterionImportance = (typeof CRITERION_IMPORTANCE)[number];

export const CRITERION_FLEXIBILITY = ['none', 'low', 'medium', 'high', 'unknown'] as const;
export type CriterionFlexibility = (typeof CRITERION_FLEXIBILITY)[number];

export const CRITERION_CERTAINTY = ['confirmed', 'observed', 'inferred', 'to_confirm'] as const;
export type CriterionCertainty = (typeof CRITERION_CERTAINTY)[number];

export const CRITERION_MATCHING_ROLES = ['hard', 'soft', 'context', 'unknown'] as const;
export type CriterionMatchingRole = (typeof CRITERION_MATCHING_ROLES)[number];

export const CRITERION_EVENT_TYPES = ['set', 'revise', 'confirm', 'invalidate', 'remove'] as const;
export type CriterionEventType = (typeof CRITERION_EVENT_TYPES)[number];

export const INTERACTION_TYPES = [
  'call',
  'email',
  'sms',
  'whatsapp',
  'meeting',
  'form',
  'other',
] as const;

export type InteractionType = (typeof INTERACTION_TYPES)[number];

export const INTERACTION_DIRECTIONS = ['incoming', 'outgoing'] as const;
export type InteractionDirection = (typeof INTERACTION_DIRECTIONS)[number];

export const TASK_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATES = ['open', 'in_progress', 'waiting', 'completed', 'cancelled'] as const;
export type TaskState = (typeof TASK_STATES)[number];

export const TIM_AGREEMENT_TYPES = [
  'information_referral_20_80',
  'mandate_50_50',
  'custom',
] as const;

export type TimAgreementType = (typeof TIM_AGREEMENT_TYPES)[number];

export const TIM_OPERATION_TYPES = ['sale', 'rental', 'other'] as const;
export type TimOperationType = (typeof TIM_OPERATION_TYPES)[number];

export const TIM_INFORMATION_NATURES = ['seller', 'buyer', 'landlord', 'tenant', 'other'] as const;
export type TimInformationNature = (typeof TIM_INFORMATION_NATURES)[number];

export const TIM_PARTY_ROLES = [
  'referrer',
  'handling_advisor',
  'seller_mandate_advisor',
  'buyer_advisor',
  'other',
] as const;

export type TimPartyRole = (typeof TIM_PARTY_ROLES)[number];

export const TIM_FEE_BASES = ['unknown', 'ht', 'ttc', 'other'] as const;
export type TimFeeBase = (typeof TIM_FEE_BASES)[number];

export const TIM_AGREEMENT_STATUSES = [
  'to_formalize',
  'signed',
  'omega_uploaded',
  'active',
  'cancelled',
  'closed',
] as const;

export type TimAgreementStatus = (typeof TIM_AGREEMENT_STATUSES)[number];

export const TIM_OPERATION_STATUSES = [
  'information_transmitted',
  'contacted',
  'mandate_obtained',
  'marketing_or_search_active',
  'offer_or_application_received',
  'precontract_or_lease_signed',
  'completed',
  'abandoned',
] as const;

export type TimOperationStatus = (typeof TIM_OPERATION_STATUSES)[number];

export const TIM_COMPENSATION_STATUSES = [
  'not_due',
  'estimated',
  'due',
  'paid',
  'to_verify',
  'disputed',
  'cancelled',
] as const;

export type TimCompensationStatus = (typeof TIM_COMPENSATION_STATUSES)[number];

export const TIM_STATUS_AXES = ['agreement', 'operation', 'compensation'] as const;
export type TimStatusAxis = (typeof TIM_STATUS_AXES)[number];

export const TIM_PAYMENT_KINDS = ['payment', 'adjustment', 'refund'] as const;
export type TimPaymentKind = (typeof TIM_PAYMENT_KINDS)[number];

export const TIM_PAYMENT_STATUSES = ['pending', 'confirmed', 'voided', 'failed'] as const;
export type TimPaymentStatus = (typeof TIM_PAYMENT_STATUSES)[number];

export const LAB_OBSERVATION_STATUSES = [
  'captured',
  'to_review',
  'accepted',
  'rejected',
  'implemented',
] as const;

export type LabObservationStatus = (typeof LAB_OBSERVATION_STATUSES)[number];

export const CONSENT_STATES = ['unknown', 'granted', 'refused', 'withdrawn'] as const;
export type ConsentState = (typeof CONSENT_STATES)[number];

const FRENCH_LABELS: Readonly<Record<string, string>> = {
  primary_residence_purchase: 'Achat de résidence principale',
  sale: 'Vente',
  investment: 'Investissement',
  other: 'Autre',
  new: 'Nouveau',
  qualifying: 'En qualification',
  active: 'Actif',
  paused: 'En pause',
  completed: 'Terminé',
  abandoned: 'Abandonné',
  archived: 'Archivé',
  new_contact: 'Nouveau contact',
  qualification: 'Qualification',
  project_defined: 'Projet défini',
  search_active: 'Recherche active',
  properties_proposed: 'Biens proposés',
  visit_preparing: 'Visite à préparer',
  visit_completed: 'Visite réalisée',
  offer_considered: 'Offre envisagée',
  offer_submitted: 'Offre déposée',
  under_contract: 'Sous contrat',
  preparation: 'Préparation',
  mandate_pending: 'Mandat à obtenir',
  mandate_active: 'Mandat actif',
  marketing: 'Commercialisation',
  visits: 'Visites',
  offer_received: 'Offre reçue',
  purchase_depends_on_sale: 'Achat dépendant de la vente',
  sale_enables_purchase: 'Vente permettant l’achat',
  related: 'Liés',
  referral: 'Recommandation',
  website: 'Site web',
  professional_network: 'Réseau professionnel',
  property_portal: 'Portail immobilier',
  event: 'Événement',
  outbound: 'Prospection sortante',
  tim: 'Accord TIM',
  unknown: 'À confirmer',
  preferred: 'Préféré',
  acceptable: 'Acceptable',
  conditional: 'Conditionnel',
  property_type: 'Type de bien',
  zone: 'Zone',
  municipalities: 'Communes',
  max_travel_time: 'Temps de trajet maximal',
  budget: 'Budget',
  surface: 'Surface',
  bedrooms: 'Chambres',
  outdoor: 'Extérieur',
  works: 'Travaux',
  energy_rating: 'DPE',
  heating: 'Chauffage',
  financing: 'Financement',
  prior_sale: 'Vente préalable',
  horizon: 'Horizon',
  environment: 'Environnement',
  layout: 'Agencement',
  essential: 'Essentiel',
  important: 'Important',
  preference: 'Préférence',
  contextual: 'Contextuel',
  none: 'Aucune',
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
  confirmed: 'Confirmé',
  observed: 'Observé',
  inferred: 'Inféré',
  to_confirm: 'À confirmer',
  hard: 'Dur',
  soft: 'Souple',
  context: 'Contexte',
  set: 'Défini',
  revise: 'Révisé',
  confirm: 'Confirmé',
  invalidate: 'Invalidé',
  remove: 'Retiré',
  call: 'Appel',
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  meeting: 'Rendez-vous',
  form: 'Formulaire',
  incoming: 'Entrant',
  outgoing: 'Sortant',
  normal: 'Normale',
  urgent: 'Urgente',
  open: 'Ouverte',
  in_progress: 'En cours',
  waiting: 'En attente',
  cancelled: 'Annulé',
  information_referral_20_80: 'Envoi d’information',
  mandate_50_50: 'Mandat partagé',
  custom: 'Personnalisé',
  rental: 'Location',
  seller: 'Vendeur',
  buyer: 'Acquéreur',
  landlord: 'Bailleur',
  tenant: 'Locataire',
  referrer: 'Conseiller apporteur',
  handling_advisor: 'Conseiller traitant',
  seller_mandate_advisor: 'Conseiller vendeur',
  buyer_advisor: 'Conseiller acquéreur',
  ht: 'HT',
  ttc: 'TTC',
  to_formalize: 'À formaliser',
  signed: 'Signé',
  omega_uploaded: 'Téléchargé dans OMEGA',
  closed: 'Clôturé',
  information_transmitted: 'Information transmise',
  contacted: 'Contact pris',
  mandate_obtained: 'Mandat obtenu',
  marketing_or_search_active: 'Commercialisation ou recherche en cours',
  offer_or_application_received: 'Offre ou candidature reçue',
  precontract_or_lease_signed: 'Compromis ou bail signé',
  not_due: 'Non encore due',
  estimated: 'Estimée',
  due: 'Due',
  paid: 'Payée',
  to_verify: 'À vérifier',
  disputed: 'Contestée',
  agreement: 'Accord',
  operation: 'Opération',
  compensation: 'Rémunération',
  payment: 'Paiement',
  adjustment: 'Ajustement',
  refund: 'Remboursement',
  pending: 'En attente',
  voided: 'Annulé',
  failed: 'Échoué',
  captured: 'Capturée',
  to_review: 'À revoir',
  accepted: 'Acceptée',
  rejected: 'Rejetée',
  implemented: 'Mise en œuvre',
  granted: 'Accordé',
  refused: 'Refusé',
  withdrawn: 'Retiré',
};

/** Returns the stable French label used by the UI and exports. */
export const taxonomyLabel = (code: string): string =>
  FRENCH_LABELS[code]
  ?? code.split('_').filter(Boolean).join(' ').replace(/^./, (letter) => letter.toUpperCase());

export const isTaxonomyCode = <T extends string>(
  value: unknown,
  codes: readonly T[],
): value is T => typeof value === 'string' && (codes as readonly string[]).includes(value);

export const allowedStagesForProject = (type: ProjectType): readonly ProjectStage[] =>
  PROJECT_STAGES_BY_TYPE[type];

export const isStageAllowedForProject = (type: ProjectType, stage: unknown): stage is ProjectStage =>
  isTaxonomyCode(stage, PROJECT_STAGES_BY_TYPE[type]);

export interface TimAllocationSuggestion {
  agreementType: TimAgreementType;
  operationType: TimOperationType;
  basisPoints: readonly [number, number];
  requiresExplicitConfirmation: true;
}

/**
 * Suggestions are display-only. Persisting terms still requires an explicit
 * human confirmation. Rental agreements deliberately receive no suggestion.
 */
export const timAllocationSuggestion = (
  agreementType: TimAgreementType,
  operationType: TimOperationType,
): TimAllocationSuggestion | undefined => {
  if (operationType !== 'sale') return undefined;

  if (agreementType === 'information_referral_20_80') {
    return { agreementType, operationType, basisPoints: [2_000, 8_000], requiresExplicitConfirmation: true };
  }

  if (agreementType === 'mandate_50_50') {
    return { agreementType, operationType, basisPoints: [5_000, 5_000], requiresExplicitConfirmation: true };
  }

  return undefined;
};
