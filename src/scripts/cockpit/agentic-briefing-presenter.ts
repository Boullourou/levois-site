export type BriefingPresentationState =
  | 'not_run'
  | 'available'
  | 'empty'
  | 'stale'
  | 'incomplete'
  | 'stopped'
  | 'failed';

export type BriefingPriority = 'urgent' | 'high' | 'normal' | 'low';

export type BriefingItemPresentation = {
  id: string;
  rank: number;
  priority: BriefingPriority;
  priorityLabel: string;
  referenceLabel: string;
  explanation: string;
  suggestedHumanAction: string;
  sourceLabel: string;
  sourceOpsMissionId: string;
  snapshotId: string;
  operationalWatermark: string;
  signalCount: number;
  href?: string;
};

export type BriefingPresentation = {
  state: BriefingPresentationState;
  statusLabel: string;
  summary: string;
  items: BriefingItemPresentation[];
  generatedAt?: string;
  missionId?: string;
  omittedCount: number;
};

const MAX_ITEMS = 7;
const MAX_COPY_LENGTH = 600;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SAFE_RULE_ID = /^OPS-[A-Z0-9-]+-[0-9]{3}$/;
const PRIORITY_LABELS: Record<BriefingPriority, string> = {
  urgent: 'Urgent',
  high: 'Prioritaire',
  normal: 'À suivre',
  low: 'Secondaire',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function boundedText(value: unknown, maximum = MAX_COPY_LENGTH): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text && text.length <= maximum ? text : undefined;
}

function safeId(value: unknown): string | undefined {
  const id = boundedText(value, 128);
  return id && SAFE_ID.test(id) ? id : undefined;
}

function safeCount(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

function failedPresentation(): BriefingPresentation {
  return {
    state: 'failed',
    statusLabel: 'Indisponible',
    summary: 'Le briefing Shadow ne peut pas être affiché. La file de travail reste disponible ci-dessous.',
    items: [],
    omittedCount: 0,
  };
}

function inactivePresentation(
  state: Exclude<BriefingPresentationState, 'available' | 'empty' | 'failed'>,
  raw: Record<string, unknown>,
): BriefingPresentation {
  const copy = {
    not_run: {
      statusLabel: 'Pas encore exécuté',
      summary: 'Aucun briefing Shadow n’a encore été exécuté. Lancez-le manuellement lorsque vous souhaitez analyser les fixtures.',
    },
    stale: {
      statusLabel: 'À actualiser',
      summary: 'Le briefing précédent n’est plus actuel. Lancez une nouvelle analyse manuelle avant de l’utiliser.',
    },
    incomplete: {
      statusLabel: 'Source incomplète',
      summary: 'La photographie opérationnelle est incomplète. Aucun briefing vide n’est présenté à tort.',
    },
    stopped: {
      statusLabel: 'Shadow arrêté',
      summary: 'Le kill switch empêche toute nouvelle mission Shadow. La file de travail manuelle reste disponible.',
    },
  }[state];

  return {
    state,
    ...copy,
    items: [],
    generatedAt: boundedText(raw.generatedAt ?? raw.createdAt, 64),
    missionId: safeId(raw.missionId),
    omittedCount: 0,
  };
}

function itemHref(scopeKind: string, scopeId: string): string | undefined {
  if (scopeKind === 'project') return `/cockpit/clients?project=${encodeURIComponent(scopeId)}`;
  if (scopeKind === 'tim_agreement') return `/cockpit/tim/dossier?id=${encodeURIComponent(scopeId)}`;
  return undefined;
}

function presentItem(value: unknown, rank: number, missionId: string): BriefingItemPresentation | undefined {
  if (!isRecord(value)) return undefined;
  const source = isRecord(value.source) ? value.source : undefined;
  const priority = boundedText(value.priority ?? value.proposedPriority, 16) as BriefingPriority | undefined;
  const scopeKind = boundedText(value.scopeKind ?? value.entityType, 32);
  const scopeId = safeId(value.scopeId ?? value.entityId);
  const ruleId = boundedText(value.primaryRuleId ?? value.ruleId, 64);
  const explanation = boundedText(value.explanation);
  const action = boundedText(value.suggestedHumanAction ?? value.suggestedHumanActionLabel);
  const sourceOpsMissionId = safeId(source?.sourceOpsMissionId);
  const snapshotId = safeId(source?.snapshotId);
  const operationalWatermark = safeId(source?.operationalWatermark);
  const signalCount = safeCount(value.signalCount) ?? 1;

  if (
    !priority || !(priority in PRIORITY_LABELS)
    || !scopeKind || !['project', 'tim_agreement'].includes(scopeKind)
    || !scopeId || !ruleId || !SAFE_RULE_ID.test(ruleId)
    || !explanation || !action || !sourceOpsMissionId || !snapshotId || !operationalWatermark
    || signalCount < 1
  ) return undefined;

  const kindLabel = scopeKind === 'tim_agreement' ? 'Accord TIM' : scopeKind === 'project' ? 'Projet' : 'Dossier';
  return {
    id: safeId(value.itemId ?? value.id) ?? `${missionId}:${rank}`,
    rank,
    priority,
    priorityLabel: PRIORITY_LABELS[priority],
    referenceLabel: `${kindLabel} ${scopeId}`,
    explanation,
    suggestedHumanAction: action,
    sourceLabel: `Règle ${ruleId} · photographie ${snapshotId}`,
    sourceOpsMissionId,
    snapshotId,
    operationalWatermark,
    signalCount,
    href: itemHref(scopeKind, scopeId),
  };
}

export function presentBriefing(value: unknown): BriefingPresentation {
  if (!isRecord(value) || value.fixtureOnly !== true || value.shadowMode !== true) return failedPresentation();

  const rawState = boundedText(value.state, 32);
  if (rawState === 'not_run' || rawState === 'stale' || rawState === 'incomplete' || rawState === 'stopped') {
    return inactivePresentation(rawState, value);
  }
  if (rawState === 'failed') return failedPresentation();
  if (rawState === 'invalid') {
    return inactivePresentation(value.invalidReason === 'CP_SOURCE_STALE' ? 'stale' : 'incomplete', value);
  }
  if (!['available', 'empty', 'current'].includes(rawState ?? '')) return failedPresentation();

  const missionId = safeId(value.missionId);
  const rawItems = Array.isArray(value.items) ? value.items : undefined;
  const omittedCount = safeCount(value.omittedCount);
  if (!missionId || !rawItems || rawItems.length > MAX_ITEMS || omittedCount === undefined) return failedPresentation();

  const items = rawItems.map((item, index) => presentItem(item, index + 1, missionId));
  if (items.some((item) => !item)) return failedPresentation();
  if (rawState === 'empty' && items.length) return failedPresentation();

  const state: BriefingPresentationState = items.length ? 'available' : 'empty';
  const count = items.length;
  return {
    state,
    statusLabel: state === 'empty' ? 'À jour · aucune priorité' : 'À jour',
    summary: state === 'empty'
      ? 'Aujourd’hui — aucune nouvelle priorité dans la photographie complète.'
      : `Aujourd’hui — ${count} priorité${count > 1 ? 's' : ''}.`,
    items: items as BriefingItemPresentation[],
    generatedAt: boundedText(value.generatedAt ?? value.createdAt, 64),
    missionId,
    omittedCount,
  };
}

export function presentBriefingFailure(code?: string): BriefingPresentation {
  if (code === 'CP_KILL_SWITCH_ACTIVE') return inactivePresentation('stopped', {});
  if (code === 'CP_SOURCE_STALE') return inactivePresentation('stale', {});
  if (code === 'CP_SOURCE_EMPTY' || code === 'CP_UPSTREAM_UNAVAILABLE') return inactivePresentation('incomplete', {});
  return failedPresentation();
}
