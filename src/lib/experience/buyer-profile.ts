/**
 * Explicit, read-only bridge to the EXISTING cockpit criterion vocabulary.
 * The cockpit does not expose a BuyerProfile aggregate: it stores a project,
 * buyer search, scenarios and criterion events. This DTO is not a new CRM and
 * does not create those records, identify a person or grant contact rights.
 */
import type { CriterionEventInput } from '../cockpit/validation';
import { CRITERION_KEYS, type BuyerProjectStage, type CriterionKey, type ProjectType } from '../cockpit/taxonomy';
import { list, number, str, type Answer, type Context, type Reading } from './types';
import { BUYER_METHOD_VERSION, buyerDependencies, buyerLabel, currentDomainContext, domainEvidence, type DomainEvidence } from './buyer';

export const BUYER_PROFILE_BRIDGE_VERSION = 'buyer-profile-bridge-2026-09-10.1';
export type BuyerCriterionMeaning = 'priority' | 'need' | 'preference' | 'conditional_opening' | 'declared_exclusion' | 'context';
type ExistingCriterionFields = Pick<CriterionEventInput, 'key' | 'customLabel' | 'value' | 'importance' | 'flexibility' | 'certainty' | 'matchingRole' | 'hardValidated'>;
export interface BuyerProfileCriterion extends ExistingCriterionFields, DomainEvidence {
  id: string;
  meaning: BuyerCriterionMeaning;
  condition?: string;
  semanticVersion: typeof BUYER_PROFILE_BRIDGE_VERSION;
}
export interface BuyerProfileBridge {
  schemaVersion: 1;
  semanticVersion: typeof BUYER_PROFILE_BRIDGE_VERSION;
  methodVersion: typeof BUYER_METHOD_VERSION;
  author: 'LEVOIS · pont sémantique, sans écriture cockpit';
  context: { id: string; revision: number; updatedAt: string };
  projectType: ProjectType | null;
  /** Only an exact stage correspondence is exposed; other stages need confirmation. */
  stage: BuyerProjectStage | null;
  stageDeclaration: string | null;
  objective: string | null;
  criteria: BuyerProfileCriterion[];
  unknownCriterionKeys: CriterionKey[];
  answers: Record<string, Answer>;
  readingHistory: Reading[];
  permissions: { writesCockpit: false; automaticMatching: false; identifiesPerson: false; grantsContact: false };
  warnings: string[];
}

const useKeys: Record<string, CriterionKey> = { work: 'layout', bedrooms: 'bedrooms', outdoors: 'outdoor', access: 'layout', host: 'layout', storage: 'layout', transport: 'max_travel_time', quiet: 'environment' };
const goalKeys: Record<string, CriterionKey> = { quiet: 'environment', space: 'layout', journeys: 'max_travel_time', outdoors: 'outdoor', access: 'layout', stability: 'other', other: 'other' };
const exclusionKeys: Record<string, CriterionKey> = { heavy_works: 'works', no_outdoor: 'outdoor', stairs: 'layout', long_commute: 'max_travel_time', other: 'other' };

export function buildBuyerProfileBridge(raw: Context): BuyerProfileBridge {
  const context = currentDomainContext(raw, buyerDependencies);
  const criteria: BuyerProfileCriterion[] = [];
  const add = (answerId: string, key: CriterionKey, meaning: BuyerCriterionMeaning, value: string, ids: string[] = [answerId], condition?: string, suffix = '') => {
    if (!value || value === 'unknown') return;
    const evidence = domainEvidence(context, ids, 'Personne · déclaration conservée par LEVOIS');
    const confirmed = evidence.provenance.length > 0 && evidence.provenance.every(source => source.mode === 'confirmed');
    criteria.push({
      id: `${answerId}${suffix ? `:${suffix}` : ''}`, key, value, meaning,
      importance: meaning === 'declared_exclusion' ? 'essential' : meaning === 'priority' || meaning === 'need' ? 'important' : meaning === 'preference' ? 'preference' : 'contextual',
      // A preference and an absent answer never manufacture consent to loosen a criterion.
      flexibility: meaning === 'declared_exclusion' ? 'none' : 'unknown',
      certainty: confirmed ? 'confirmed' : 'to_confirm',
      matchingRole: 'unknown', hardValidated: false,
      semanticVersion: BUYER_PROFILE_BRIDGE_VERSION, ...evidence,
      ...(condition ? { condition } : {}), ...(key === 'other' ? { customLabel: meaning === 'priority' ? 'Changement recherché' : 'Déclaration à préciser' } : {}),
    });
  };
  const purpose = str(context, 'buyer_purpose');
  const projectType = purpose === 'primary' ? 'primary_residence_purchase' : purpose === 'investment' ? 'investment' : purpose === 'secondary' ? 'other' : null;
  const inScope = purpose !== 'investment' && purpose !== 'secondary';
  if (inScope) {
    const goal = str(context, 'buyer_goal');
    if (goalKeys[goal]) add('buyer_goal', goalKeys[goal], 'priority', buyerLabel('buyer_goal', goal));
    if (str(context, 'buyer_goal_detail')) add('buyer_goal_detail', 'other', 'context', str(context, 'buyer_goal_detail'), ['buyer_goal', 'buyer_goal_detail']);
    for (const use of list(context, 'buyer_uses')) if (useKeys[use]) add('buyer_uses', useKeys[use], 'need', buyerLabel('buyer_uses', use), ['buyer_uses'], undefined, use);
    if (str(context, 'buyer_type') && str(context, 'buyer_type') !== 'unknown') add('buyer_type', 'property_type', 'preference', buyerLabel('buyer_type', str(context, 'buyer_type')));
    if (number(context, 'buyer_surface') !== undefined) add('buyer_surface', 'surface', 'preference', `${number(context, 'buyer_surface')} m² souhaités`);
    if (number(context, 'buyer_bedrooms') !== undefined) add('buyer_bedrooms', 'bedrooms', 'preference', `${number(context, 'buyer_bedrooms')} chambres souhaitées`);
    // Free text may contain a district, several towns or a journey. Never manufacture municipality IDs.
    if (str(context, 'buyer_sector')) add('buyer_sector', 'zone', 'preference', str(context, 'buyer_sector'));
    if (str(context, 'buyer_travel_point')) add('buyer_travel_point', 'zone', 'context', `Lieu de trajet : ${str(context, 'buyer_travel_point')}`);
    if (number(context, 'buyer_travel_minutes') !== undefined) add('buyer_travel_minutes', 'max_travel_time', 'preference', `${number(context, 'buyer_travel_minutes')} minutes déclarées ; mode et horaires à vérifier`);
    if (['estimated', 'checked'].includes(str(context, 'buyer_budget_status')) && number(context, 'buyer_budget') !== undefined) {
      add('buyer_budget', 'budget', 'context', `${number(context, 'buyer_budget')} EUR ; ${buyerLabel('buyer_budget_status', str(context, 'buyer_budget_status'))} ; périmètre : ${buyerLabel('buyer_costs_status', str(context, 'buyer_costs_status') || 'unknown')}`, ['buyer_budget_status', 'buyer_budget', 'buyer_costs_status']);
      if (str(context, 'buyer_financing') && str(context, 'buyer_financing') !== 'unknown') add('buyer_financing', 'financing', 'context', buyerLabel('buyer_financing', str(context, 'buyer_financing')), ['buyer_budget', 'buyer_financing']);
    }
    if (str(context, 'buyer_prior_sale') && str(context, 'buyer_prior_sale') !== 'unknown') add('buyer_prior_sale', 'prior_sale', 'context', buyerLabel('buyer_prior_sale', str(context, 'buyer_prior_sale')));
    if (str(context, 'buyer_horizon') && str(context, 'buyer_horizon') !== 'unknown') add('buyer_horizon', 'horizon', 'context', `${buyerLabel('buyer_horizon', str(context, 'buyer_horizon'))}${str(context, 'buyer_date') ? ` ; ${str(context, 'buyer_date')}` : ''}`, ['buyer_horizon', 'buyer_date']);
    if (str(context, 'buyer_works') && str(context, 'buyer_works') !== 'unknown') add('buyer_works', 'works', 'preference', buyerLabel('buyer_works', str(context, 'buyer_works')), ['buyer_works', 'buyer_works_condition'], str(context, 'buyer_works') === 'conditional' ? str(context, 'buyer_works_condition') || undefined : undefined);
    const openingTarget = str(context, 'buyer_opening_target') as CriterionKey;
    if (str(context, 'buyer_opening') === 'conditional' && ['surface', 'property_type', 'zone', 'works', 'horizon', 'other'].includes(openingTarget) && str(context, 'buyer_opening_condition')) add('buyer_opening_condition', openingTarget, 'conditional_opening', `Ouverture déclarée sur ${buyerLabel('buyer_opening_target', openingTarget)}`, ['buyer_opening', 'buyer_opening_target', 'buyer_opening_condition'], str(context, 'buyer_opening_condition'));
    for (const exclusion of list(context, 'buyer_exclusions')) if (exclusionKeys[exclusion]) add('buyer_exclusions', exclusionKeys[exclusion], 'declared_exclusion', `${buyerLabel('buyer_exclusions', exclusion)}${exclusion === 'other' && str(context, 'buyer_exclusion_detail') ? ` : ${str(context, 'buyer_exclusion_detail')}` : ''}`, ['buyer_exclusions', ...(exclusion === 'other' ? ['buyer_exclusion_detail'] : [])], undefined, exclusion);
  }
  const answers = Object.fromEntries(Object.entries(context.answers).filter(([id]) => id.startsWith('buyer_')).map(([id, answer]) => [id, { ...answer, value: Array.isArray(answer.value) ? [...answer.value] : answer.value }]));
  const currentKeys = new Set(criteria.map(criterion => criterion.key));
  return {
    schemaVersion: 1, semanticVersion: BUYER_PROFILE_BRIDGE_VERSION, methodVersion: BUYER_METHOD_VERSION,
    author: 'LEVOIS · pont sémantique, sans écriture cockpit', context: { id: context.id, revision: context.revision, updatedAt: context.updatedAt },
    projectType, stage: str(context, 'buyer_stage') === 'searching' ? 'search_active' : null,
    stageDeclaration: str(context, 'buyer_stage') ? buyerLabel('buyer_stage', str(context, 'buyer_stage')) : null,
    objective: str(context, 'buyer_goal_detail') || (str(context, 'buyer_goal') && str(context, 'buyer_goal') !== 'unknown' ? buyerLabel('buyer_goal', str(context, 'buyer_goal')) : null),
    criteria, unknownCriterionKeys: CRITERION_KEYS.filter(key => !currentKeys.has(key)), answers,
    readingHistory: structuredClone((context.history ?? []).filter(reading => reading.methodVersion.startsWith('buyer-'))),
    permissions: { writesCockpit: false, automaticMatching: false, identifiesPerson: false, grantsContact: false },
    warnings: [
      'Les exclusions déclarées sont conservées mais ne constituent jamais des critères bloquants validés automatiquement.',
      'Une ouverture n’existe qu’avec sa condition explicite. Un critère absent reste non renseigné.',
      'Aucune personne, recherche ou scénario privé n’est associé automatiquement. Un raccord opérationnel exige des identifiants explicites et les permissions de la suite choisie.',
      ...(!inScope ? ['Le parcours de résidence principale ne produit pas de critères personnalisés pour cette destination.'] : []),
    ],
  };
}

export const buildBuyerProfile = buildBuyerProfileBridge;

export interface BuyerImportReview { answerId: string; current: Answer | null; proposed: Answer; status: 'same' | 'new' | 'conflict'; sourceContextId: string; sourceVersion: number }
/** A review proposal only: the caller must explicitly confirm a choice before applying anything. */
export function reviewBuyerProfileImport(context: Context, profile: BuyerProfileBridge): BuyerImportReview[] {
  if (profile.schemaVersion !== 1 || profile.semanticVersion !== BUYER_PROFILE_BRIDGE_VERSION) throw new Error('La version de ce profil nécessite une correspondance sémantique explicite avant reprise.');
  return Object.entries(profile.answers).filter(([id]) => id.startsWith('buyer_')).map(([answerId, proposed]) => {
    const existing = context.answers[answerId];
    const same = existing !== undefined && JSON.stringify(existing.value) === JSON.stringify(proposed.value);
    return { answerId, current: existing ? structuredClone(existing) : null, proposed: structuredClone(proposed), status: same ? 'same' : existing ? 'conflict' : 'new', sourceContextId: profile.context.id, sourceVersion: profile.context.revision };
  });
}
