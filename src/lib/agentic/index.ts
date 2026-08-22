/**
 * LEVOIS Agentic Company OS — deterministic Phase A1 kernel.
 *
 * This module is intentionally pure. It has no D1 handle, clock, network,
 * model, connector or business command. Callers must provide every timestamp,
 * watermark, budget and switch value explicitly.
 */

export const AGENTIC_WRITE_TABLES = [
  "agent_mission",
  "agent_trace",
  "agent_control_switch",
  "agent_ops_shadow_finding",
  "agent_cos_briefing_item",
] as const;

export const AGENTIC_CAPABILITY_ALLOWLIST = [
  "ops.read_snapshot",
  "ops.evaluate_rules",
  "cos.read_ops_results",
  "cos.deduplicate",
  "cos.rank",
  "cos.compose_briefing",
] as const;

export const DEFAULT_AGENTIC_SWITCH_STATE = "stopped" as const;

export const TRACE_ENTRY_KINDS = [
  "mission_created",
  "mission_started",
  "snapshot_read",
  "rule_evaluated",
  "finding_produced",
  "briefing_composed",
  "mission_completed",
  "error_recorded",
  "kill_switch_encountered",
  "mission_cancelled",
] as const;

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled"]);
const PROJECT_OPEN_STATUSES = new Set(["new", "qualifying", "active", "paused"]);
const PROJECT_TERMINAL_STATUSES = new Set(["completed", "abandoned", "archived"]);
const TASK_OPEN_STATUSES = new Set(["open", "in_progress", "waiting"]);
const TIM_OPEN_STATUSES = new Set(["to_formalize", "signed", "omega_uploaded", "active"]);
const TIM_TERMINAL_STATUSES = new Set(["cancelled", "closed"]);

const REQUIRED_BUDGET_KEYS = [
  "sourceRows",
  "ruleEvaluations",
  "findings",
  "briefingItems",
  "traceEntries",
] as const;

const AGENT_CAPABILITIES = {
  "OPS-01": ["ops.read_snapshot", "ops.evaluate_rules"],
  "COS-01": ["cos.read_ops_results", "cos.deduplicate", "cos.rank", "cos.compose_briefing"],
} as const;

const MISSION_AGENT = {
  "ops.shadow_scan.v1": "OPS-01",
  "cos.daily_briefing.v1": "COS-01",
} as const;

type ErrorCode =
  | "CP_CONTRACT_INVALID"
  | "CP_PERMISSION_DENIED"
  | "CP_SCOPE_VIOLATION"
  | "CP_SOURCE_STALE"
  | "CP_SOURCE_EMPTY"
  | "CP_IDEMPOTENCY_CONFLICT"
  | "CP_VERSION_CONFLICT"
  | "CP_BUDGET_EXCEEDED"
  | "CP_TIMEOUT"
  | "CP_RESULT_INVALID"
  | "CP_PII_POLICY_VIOLATION"
  | "CP_KILL_SWITCH_ACTIVE";

export class AgenticContractError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "AgenticContractError";
    this.code = code;
  }
}

type UnknownRecord = Record<string, unknown>;

type Mission = UnknownRecord & {
  missionId: string;
  missionType: keyof typeof MISSION_AGENT;
  logicalAgent: keyof typeof AGENT_CAPABILITIES;
  capabilities: string[];
  status: string;
  version: number;
  fixtureOnly: true;
  autonomyLevel: "L0";
  createdAt: string;
  timeoutAt: string;
  inputHash: string;
  idempotencyKey: string;
  attemptNo: 1;
};

type Finding = UnknownRecord & {
  findingId: string;
  missionId: string;
  observationFingerprint: string;
  ruleId: RuleId;
  ruleVersion: "1";
  scopeKind: "project" | "tim_agreement" | "triage_signal";
  scopeId: string;
  subjectId: string | null;
  linkKind: "promise_task" | "tim_deadline_task" | null;
  linkRef: string | null;
  reasonCode: string;
  proposedPriority: "low" | "normal" | "high" | "urgent";
  suggestedActionCode: string;
  sourceRef: string;
  sourceVersion: number;
  snapshotId: string;
  operationalWatermark: string;
  sourceHash: string;
  observedAt: string;
  dueAt: string | null;
};

type RuleId =
  | "OPS-PROJECT-NEXT-ACTION-001"
  | "OPS-TASK-OVERDUE-002"
  | "OPS-PROMISE-DUE-003"
  | "OPS-INTAKE-UNTREATED-004"
  | "OPS-TIM-NEXT-ACTION-005"
  | "OPS-TIM-DEADLINE-NEAR-006"
  | "OPS-INCONSISTENCY-007";

type RuleDefinition = {
  reasonCodes: readonly string[];
  actions: readonly string[];
  signalClass: number;
};

const RULES: Record<RuleId, RuleDefinition> = {
  "OPS-PROJECT-NEXT-ACTION-001": {
    reasonCodes: ["PROJECT_WITHOUT_NEXT_ACTION"],
    actions: ["DEFINE_NEXT_ACTION"],
    signalClass: 5,
  },
  "OPS-TASK-OVERDUE-002": {
    reasonCodes: ["TASK_OVERDUE"],
    actions: ["REVIEW_OVERDUE_TASK"],
    signalClass: 2,
  },
  "OPS-PROMISE-DUE-003": {
    reasonCodes: ["PROMISE_DUE"],
    actions: ["REVIEW_PROMISE_AND_CONTACT"],
    signalClass: 1,
  },
  "OPS-INTAKE-UNTREATED-004": {
    reasonCodes: [],
    actions: [],
    signalClass: 4,
  },
  "OPS-TIM-NEXT-ACTION-005": {
    reasonCodes: ["TIM_WITHOUT_NEXT_ACTION"],
    actions: ["DEFINE_TIM_FOLLOW_UP"],
    signalClass: 5,
  },
  "OPS-TIM-DEADLINE-NEAR-006": {
    reasonCodes: ["TIM_DEADLINE_NEAR", "TIM_DEADLINE_OVERDUE"],
    actions: ["REVIEW_TIM_DEADLINE"],
    signalClass: 6,
  },
  "OPS-INCONSISTENCY-007": {
    reasonCodes: ["TERMINAL_SCOPE_WITH_OPEN_NEXT_ACTION"],
    actions: ["REVIEW_TERMINAL_NEXT_ACTION"],
    signalClass: 3,
  },
};

const EXPLANATION_TEMPLATES: Record<string, string> = {
  PROJECT_WITHOUT_NEXT_ACTION: "Ce projet est actif mais aucune prochaine action n’est définie.",
  TASK_OVERDUE: "Une tâche ouverte est arrivée à échéance.",
  PROMISE_DUE: "Un retour explicitement promis est arrivé à échéance.",
  TIM_WITHOUT_NEXT_ACTION: "Cet Accord TIM est actionnable mais aucun prochain suivi n’est défini.",
  TIM_DEADLINE_NEAR: "Une échéance TIM structurée approche.",
  TIM_DEADLINE_OVERDUE: "Une échéance TIM structurée est dépassée.",
  TERMINAL_SCOPE_WITH_OPEN_NEXT_ACTION: "Une prochaine action ouverte subsiste sur un dossier terminal.",
};

const ACTION_TEMPLATES: Record<string, string> = {
  DEFINE_NEXT_ACTION: "Définir la prochaine étape.",
  REVIEW_OVERDUE_TASK: "Replanifier, terminer ou clôturer après vérification.",
  REVIEW_PROMISE_AND_CONTACT: "Vérifier le contexte puis reprendre contact manuellement.",
  DEFINE_TIM_FOLLOW_UP: "Définir le prochain suivi TIM.",
  REVIEW_TIM_DEADLINE: "Vérifier l’échéance et décider du suivi.",
  REVIEW_TERMINAL_NEXT_ACTION: "Vérifier puis clôturer ou réaffecter manuellement la tâche.",
};

export function renderBriefingTemplates(
  reasonCode: string,
  suggestedActionCode: string,
): { explanation: string; suggestedHumanAction: string } {
  const definition = Object.values(RULES).find((rule) => (
    rule.reasonCodes.includes(reasonCode) && rule.actions.includes(suggestedActionCode)
  ));
  const explanation = EXPLANATION_TEMPLATES[reasonCode];
  const suggestedHumanAction = ACTION_TEMPLATES[suggestedActionCode];
  if (!definition || !explanation || !suggestedHumanAction) {
    fail("CP_RESULT_INVALID", "briefing template codes do not form an allowlisted A1 pair");
  }
  return { explanation, suggestedHumanAction };
}

function fail(code: ErrorCode, message: string): never {
  throw new AgenticContractError(code, message);
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, field: string): UnknownRecord {
  if (!isRecord(value)) fail("CP_CONTRACT_INVALID", `${field} must be an object`);
  return value;
}

function requireString(value: unknown, field: string, maxLength = 256): string {
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength) {
    fail("CP_CONTRACT_INVALID", `${field} must be a bounded non-empty string`);
  }
  return value;
}

function requireOpaqueId(value: unknown, field: string): string {
  const id = requireString(value, field, 160);
  if (!/^[A-Za-z0-9][A-Za-z0-9:._-]*$/.test(id)) {
    fail("CP_RESULT_INVALID", `${field} is not an opaque identifier`);
  }
  return id;
}

function requireIsoDate(value: unknown, field: string): string {
  const date = requireString(value, field, 40);
  const epoch = Date.parse(date);
  if (!Number.isFinite(epoch) || !date.endsWith("Z")) {
    fail("CP_CONTRACT_INVALID", `${field} must be a finite UTC timestamp`);
  }
  return date;
}

function epoch(value: unknown, field: string): number {
  return Date.parse(requireIsoDate(value, field));
}

function requireVersion(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1) {
    fail("CP_CONTRACT_INVALID", `${field} must be a positive integer`);
  }
  return Number(value);
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function validateLogicalBudget(value: unknown): Record<(typeof REQUIRED_BUDGET_KEYS)[number], number> {
  const budget = requireRecord(value, "logicalBudget");
  const unknownKey = Object.keys(budget).find((key) => !REQUIRED_BUDGET_KEYS.includes(key as (typeof REQUIRED_BUDGET_KEYS)[number]));
  if (unknownKey || Object.keys(budget).length !== REQUIRED_BUDGET_KEYS.length) {
    fail("CP_CONTRACT_INVALID", "logicalBudget must use exactly the closed A1 counters");
  }
  const result = {} as Record<(typeof REQUIRED_BUDGET_KEYS)[number], number>;
  for (const key of REQUIRED_BUDGET_KEYS) {
    const amount = budget[key];
    if (typeof amount !== "number" || !Number.isFinite(amount) || !Number.isSafeInteger(amount) || amount <= 0) {
      fail("CP_CONTRACT_INVALID", `logicalBudget.${key} must be a finite positive integer`);
    }
    result[key] = amount;
  }
  return result;
}

function checkBudgetUsage(
  budgetValue: unknown,
  usage: Partial<Record<(typeof REQUIRED_BUDGET_KEYS)[number], number>>,
): void {
  const budget = validateLogicalBudget(budgetValue);
  for (const [key, amount] of Object.entries(usage)) {
    if (amount !== undefined && amount > budget[key as keyof typeof budget]) {
      fail("CP_BUDGET_EXCEEDED", `${key} exceeds the explicit logical budget`);
    }
  }
}

function stableHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function sameStringSet(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length
    && [...actual].sort().every((value, index) => value === [...expected].sort()[index]);
}

export function assertFixtureOnly(input: UnknownRecord): void {
  if (input.fixtureOnly !== true) fail("CP_SCOPE_VIOLATION", "A1 only accepts fixture-only execution");
  if (input.environment !== undefined && !["fixture", "test", "local"].includes(String(input.environment))) {
    fail("CP_SCOPE_VIOLATION", "A1 cannot run outside an isolated fixture environment");
  }
}

export function assertAuthorizedCapabilities(agentId: string, capabilities: readonly string[]): void {
  if (!(agentId in AGENT_CAPABILITIES)) fail("CP_SCOPE_VIOLATION", "logical agent is not active in A1");
  const allowed = AGENT_CAPABILITIES[agentId as keyof typeof AGENT_CAPABILITIES] as readonly string[];
  if (!Array.isArray(capabilities) || capabilities.length === 0 || capabilities.some((capability) => !allowed.includes(capability))) {
    fail("CP_SCOPE_VIOLATION", "capability is not allowed for this A1 logical agent");
  }
}

const FORBIDDEN_PII_KEYS = new Set([
  "name",
  "firstname",
  "first_name",
  "lastname",
  "last_name",
  "preferredname",
  "preferred_name",
  "email",
  "phone",
  "telephone",
  "mobile",
  "address",
  "adresse",
  "postal_address",
  "client_text",
  "summary",
  "notes",
  "transcript",
  "transcription",
]);

function scanForPii(value: unknown, seen: Set<object>): boolean {
  if (typeof value === "string") {
    if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value)) return true;
    if (/^sha256:[0-9a-f]{64}$/i.test(value)) return false;
    return /(?<![A-Za-z0-9])(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}(?![A-Za-z0-9])/.test(value);
  }
  if (typeof value !== "object" || value === null) return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some((entry) => scanForPii(entry, seen));
  return Object.entries(value).some(([key, entry]) => (
    FORBIDDEN_PII_KEYS.has(key.toLowerCase()) || scanForPii(entry, seen)
  ));
}

export function assertNoPii(value: unknown): void {
  if (scanForPii(value, new Set())) {
    fail("CP_PII_POLICY_VIOLATION", "PII or a forbidden free-text field crossed the A1 boundary");
  }
}

export function createMission(inputValue: UnknownRecord): Mission {
  const input = clone(requireRecord(inputValue, "mission"));
  assertFixtureOnly(input);
  assertNoPii(input);

  const missionId = requireOpaqueId(input.missionId, "missionId");
  const missionType = requireString(input.missionType, "missionType", 64);
  const logicalAgent = requireString(input.logicalAgent, "logicalAgent", 32);
  if (!(missionType in MISSION_AGENT) || !(logicalAgent in AGENT_CAPABILITIES)) {
    fail("CP_SCOPE_VIOLATION", "mission type or logical agent is not active in A1");
  }
  if (MISSION_AGENT[missionType as keyof typeof MISSION_AGENT] !== logicalAgent) {
    fail("CP_SCOPE_VIOLATION", "mission type and logical agent do not match");
  }

  if (!Array.isArray(input.capabilities) || input.capabilities.some((value) => typeof value !== "string")) {
    fail("CP_CONTRACT_INVALID", "capabilities must be a closed string list");
  }
  const capabilities = input.capabilities as string[];
  assertAuthorizedCapabilities(logicalAgent, capabilities);
  const requiredCapabilities = AGENT_CAPABILITIES[logicalAgent as keyof typeof AGENT_CAPABILITIES] as readonly string[];
  if (!sameStringSet(capabilities, requiredCapabilities)) {
    fail("CP_SCOPE_VIOLATION", "mission must declare exactly its closed A1 capability set");
  }

  requireString(input.contractVersion, "contractVersion", 16);
  requireString(input.objectiveCode, "objectiveCode", 128);
  if (!['low', 'normal', 'high', 'urgent'].includes(String(input.priority))) {
    fail("CP_CONTRACT_INVALID", "priority is outside the closed A1 vocabulary");
  }
  const trigger = requireRecord(input.trigger, "trigger");
  if (trigger.kind !== "manual") fail("CP_SCOPE_VIOLATION", "only manual A1 triggers are allowed");
  requireOpaqueId(trigger.ref, "trigger.ref");
  requireOpaqueId(trigger.actorId, "trigger.actorId");
  const source = requireRecord(input.source, "source");
  requireString(source.kind, "source.kind", 64);
  requireOpaqueId(source.ref, "source.ref");
  requireString(source.version, "source.version", 64);
  requireString(source.hash, "source.hash", 256);
  requireString(source.operationalWatermark, "source.operationalWatermark", 160);
  requireString(input.idempotencyKey, "idempotencyKey", 512);
  requireString(input.inputHash, "inputHash", 256);
  requireOpaqueId(input.correlationId, "correlationId");
  requireOpaqueId(input.causationId, "causationId");

  const createdAt = requireIsoDate(input.createdAt, "createdAt");
  const timeoutAt = requireIsoDate(input.timeoutAt, "timeoutAt");
  if (epoch(timeoutAt, "timeoutAt") <= epoch(createdAt, "createdAt")) {
    fail("CP_CONTRACT_INVALID", "timeoutAt must be after createdAt");
  }
  validateLogicalBudget(input.logicalBudget);
  if (input.autonomyLevel !== "L0") fail("CP_SCOPE_VIOLATION", "A1 autonomy is fixed at L0");
  if (input.attemptNo !== 1) fail("CP_SCOPE_VIOLATION", "A1 has exactly one attempt per mission");
  if (input.version !== 1) fail("CP_VERSION_CONFLICT", "new missions start at version 1");

  return {
    ...input,
    missionId,
    missionType: missionType as keyof typeof MISSION_AGENT,
    logicalAgent: logicalAgent as keyof typeof AGENT_CAPABILITIES,
    capabilities: [...capabilities],
    status: "draft",
    version: 1,
    fixtureOnly: true,
    autonomyLevel: "L0",
    createdAt,
    timeoutAt,
    inputHash: input.inputHash as string,
    idempotencyKey: input.idempotencyKey as string,
    attemptNo: 1,
    closeReason: null,
    errorCode: null,
    resultHash: null,
  };
}

function assertMissionVersion(mission: Mission, expectedVersion: unknown): void {
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion !== mission.version) {
    fail("CP_VERSION_CONFLICT", "mission version changed");
  }
}

export function transitionMission(missionValue: UnknownRecord, commandValue: UnknownRecord): Mission {
  const mission = clone(missionValue) as Mission;
  const command = clone(requireRecord(commandValue, "transition"));
  assertMissionVersion(mission, command.expectedVersion);
  requireIsoDate(command.now, "transition.now");

  if (TERMINAL_STATUSES.has(mission.status)) {
    fail("CP_CONTRACT_INVALID", "terminal missions cannot be reopened");
  }

  const to = requireString(command.to, "transition.to", 32);
  if (["waiting_input", "waiting_approval"].includes(to)) {
    fail("CP_CONTRACT_INVALID", "waiting states are canonical but inadmissible for A1 missions");
  }

  const allowed: Record<string, readonly string[]> = {
    draft: ["planned", "failed", "cancelled"],
    planned: ["assigned", "failed", "cancelled"],
    assigned: ["running", "failed", "cancelled"],
    running: ["completed", "failed", "cancelled"],
  };
  if (!allowed[mission.status]?.includes(to)) fail("CP_CONTRACT_INVALID", "mission transition is not allowed");

  const next: Mission = { ...mission, status: to, version: mission.version + 1 };
  if (to === "planned") {
    validateLogicalBudget(mission.logicalBudget);
    if (hasMissionTimedOut(mission, command.now as string)) fail("CP_TIMEOUT", "mission timed out before planning");
    next.plannedAt = command.now;
  }
  if (to === "assigned") {
    const switchResult = evaluateSwitches({
      agentId: mission.logicalAgent,
      capabilities: mission.capabilities,
      switches: command.switches,
    });
    if (!switchResult.allowed) fail("CP_KILL_SWITCH_ACTIVE", `switch stopped: ${switchResult.blockingScope ?? "unknown"}`);
    next.controlFingerprint = switchResult.fingerprint;
    next.assignedAt = command.now;
  }
  if (to === "running") {
    next.startedAt = command.now;
    next.executionEpoch = requireVersion(mission.executionEpoch ?? 1, "executionEpoch");
  }
  if (to === "completed") {
    next.resultHash = requireString(command.resultHash, "resultHash", 256);
    next.resultKind = requireString(command.resultKind, "resultKind", 128);
    next.completedAt = command.now;
    next.finishedAt = command.now;
  }
  if (to === "failed") {
    next.errorCode = requireString(command.errorCode, "errorCode", 128);
    next.closeReason = "error";
    next.completedAt = command.now;
    next.finishedAt = command.now;
  }
  if (to === "cancelled") {
    next.closeReason = requireString(command.reasonCode, "reasonCode", 128);
    next.completedAt = command.now;
    next.finishedAt = command.now;
  }
  return next;
}

export function cancelMission(mission: UnknownRecord, command: UnknownRecord): Mission {
  return transitionMission(mission, {
    ...command,
    to: "cancelled",
  });
}

export function hasMissionTimedOut(mission: UnknownRecord, now: string): boolean {
  return epoch(now, "now") >= epoch(mission.timeoutAt, "timeoutAt");
}

type Switch = {
  scopeKind: string;
  scopeKey: string;
  state: string;
  version: number;
  restoreEpoch: number;
};

function switchFingerprint(switches: Switch[]): string {
  const material = [...switches]
    .sort((left, right) => `${left.scopeKind}:${left.scopeKey}`.localeCompare(`${right.scopeKind}:${right.scopeKey}`))
    .map((entry) => `${entry.scopeKind}:${entry.scopeKey}:${entry.state}:${entry.version}:${entry.restoreEpoch}`)
    .join("|");
  return `ctrl:${stableHash(material)}`;
}

export function evaluateSwitches(inputValue: UnknownRecord): { allowed: boolean; blockingScope?: string; fingerprint: string } {
  const input = requireRecord(inputValue, "switch evaluation");
  const agentId = requireString(input.agentId, "agentId", 32);
  if (!Array.isArray(input.capabilities) || input.capabilities.some((value) => typeof value !== "string")) {
    fail("CP_CONTRACT_INVALID", "capabilities must be an array");
  }
  const capabilities = input.capabilities as string[];
  assertAuthorizedCapabilities(agentId, capabilities);
  const switches = Array.isArray(input.switches) ? input.switches.map((value) => {
    const entry = requireRecord(value, "switch");
    const state = requireString(entry.state, "switch.state", 16);
    if (!['enabled', 'stopped'].includes(state)) fail("CP_CONTRACT_INVALID", "invalid switch state");
    return {
      scopeKind: requireString(entry.scopeKind, "switch.scopeKind", 32),
      scopeKey: requireString(entry.scopeKey, "switch.scopeKey", 128),
      state,
      version: requireVersion(entry.version, "switch.version"),
      restoreEpoch: entry.restoreEpoch === undefined ? 1 : requireVersion(entry.restoreEpoch, "switch.restoreEpoch"),
    };
  }) : [];

  const required = [
    ["global", "global"],
    ["agent", agentId],
    ...capabilities.map((capability) => ["capability", capability]),
  ] as Array<[string, string]>;

  const applicable: Switch[] = [];
  for (const [scopeKind, scopeKey] of required) {
    const entry = switches.find((candidate) => candidate.scopeKind === scopeKind && candidate.scopeKey === scopeKey);
    if (entry) applicable.push(entry);
    if (!entry || entry.state !== "enabled") {
      return {
        allowed: false,
        blockingScope: `${scopeKind}:${scopeKey}`,
        fingerprint: switchFingerprint(applicable),
      };
    }
  }
  return { allowed: true, fingerprint: switchFingerprint(applicable) };
}

export function checkpointMission(missionValue: UnknownRecord, checkpointValue: UnknownRecord): Mission {
  const mission = clone(missionValue) as Mission;
  const checkpoint = clone(requireRecord(checkpointValue, "checkpoint"));
  assertMissionVersion(mission, checkpoint.expectedVersion);
  const now = requireIsoDate(checkpoint.now, "checkpoint.now");
  if (TERMINAL_STATUSES.has(mission.status)) fail("CP_CONTRACT_INVALID", "terminal mission has no checkpoints");

  if (hasMissionTimedOut(mission, now)) {
    return transitionMission(mission, {
      to: "failed",
      now,
      expectedVersion: mission.version,
      errorCode: "CP_TIMEOUT",
    });
  }

  const switchResult = evaluateSwitches({
    agentId: mission.logicalAgent,
    capabilities: checkpoint.capabilities ?? mission.capabilities,
    switches: checkpoint.switches,
  });
  if (!switchResult.allowed || (mission.controlFingerprint && mission.controlFingerprint !== switchResult.fingerprint)) {
    return cancelMission(mission, {
      now,
      expectedVersion: mission.version,
      reasonCode: "kill_switch",
      actorId: "CONTROL-PLANE",
    });
  }
  if (
    checkpoint.expectedOperationalWatermark !== undefined
    && checkpoint.currentOperationalWatermark !== checkpoint.expectedOperationalWatermark
  ) {
    return cancelMission(mission, {
      now,
      expectedVersion: mission.version,
      reasonCode: "stale_source",
      actorId: "CONTROL-PLANE",
    });
  }
  return mission;
}

export function checkMissionIdempotency(existingValue: UnknownRecord | null, inputValue: UnknownRecord): "new" | "replay" {
  if (existingValue === null) return "new";
  const existing = requireRecord(existingValue, "existing mission");
  const input = requireRecord(inputValue, "mission command");
  if (existing.idempotencyKey !== input.idempotencyKey) return "new";
  if (existing.inputHash !== input.inputHash) fail("CP_IDEMPOTENCY_CONFLICT", "idempotency key was reused with another input");
  return "replay";
}

const SNAPSHOT_KEYS = new Set([
  "schemaVersion",
  "snapshotId",
  "fixtureOnly",
  "asOf",
  "operationalWatermark",
  "sourceHash",
  "coverage",
  "projects",
  "tasks",
  "promises",
  "timAgreements",
  "timDeadlines",
]);

const PROJECT_KEYS = new Set(["projectId", "status", "stage", "version"]);
const TASK_KEYS = new Set([
  "taskId",
  "projectId",
  "timId",
  "status",
  "dueAt",
  "sourcePriority",
  "isNextAction",
  "promisedFromInteractionId",
  "timDeadlineId",
  "version",
]);
const PROMISE_KEYS = new Set([
  "promiseId",
  "projectId",
  "dueAt",
  "fulfilled",
  "sourcePriority",
  "linkedTaskId",
  "version",
]);
const TIM_KEYS = new Set(["timId", "agreementStatus", "operationStatus", "version"]);
const TIM_DEADLINE_KEYS = new Set(["deadlineId", "timId", "kind", "dueAt", "status", "linkedTaskId", "version"]);

function assertOnlyKeys(record: UnknownRecord, allowed: Set<string>, field: string): void {
  const unknown = Object.keys(record).find((key) => !allowed.has(key));
  if (unknown) fail("CP_RESULT_INVALID", `${field}.${unknown} is not allowlisted`);
}

function requireArray(value: unknown, field: string): UnknownRecord[] {
  if (!Array.isArray(value) || value.some((entry) => !isRecord(entry))) {
    fail("CP_CONTRACT_INVALID", `${field} must be an object array`);
  }
  return value as UnknownRecord[];
}

function buildFinding(input: {
  missionId?: string;
  ruleId: RuleId;
  scopeKind: Finding["scopeKind"];
  scopeId: string;
  subjectId: string | null;
  linkKind: Finding["linkKind"];
  linkRef: string | null;
  reasonCode: string;
  proposedPriority: Finding["proposedPriority"];
  suggestedActionCode: string;
  sourceRef: string;
  sourceVersion: number;
  snapshotId: string;
  operationalWatermark: string;
  sourceHash: string;
  observedAt: string;
  dueAt: string | null;
}): Finding {
  const condition = input.dueAt ?? "condition-present";
  const fingerprint = `fp:${input.ruleId}:${input.scopeKind}:${input.scopeId}:${input.subjectId ?? "scope"}:${condition}`;
  const finding: Finding = {
    findingId: `FND-${stableHash(fingerprint)}`,
    missionId: input.missionId ?? "MSN-OPS-FX-PENDING",
    observationFingerprint: fingerprint,
    ruleId: input.ruleId,
    ruleVersion: "1",
    scopeKind: input.scopeKind,
    scopeId: input.scopeId,
    subjectId: input.subjectId,
    linkKind: input.linkKind,
    linkRef: input.linkRef,
    reasonCode: input.reasonCode,
    proposedPriority: input.proposedPriority,
    suggestedActionCode: input.suggestedActionCode,
    sourceRef: input.sourceRef,
    sourceVersion: input.sourceVersion,
    snapshotId: input.snapshotId,
    operationalWatermark: input.operationalWatermark,
    sourceHash: input.sourceHash,
    observedAt: input.observedAt,
    dueAt: input.dueAt,
  };
  validateFinding(finding, { knownScopeIds: [input.scopeId] });
  return finding;
}

function isProjectOpen(project: UnknownRecord | undefined): boolean {
  return project !== undefined && PROJECT_OPEN_STATUSES.has(String(project.status));
}

function isProjectTerminal(project: UnknownRecord | undefined): boolean {
  return project !== undefined && PROJECT_TERMINAL_STATUSES.has(String(project.status));
}

function isTimOpen(tim: UnknownRecord | undefined): boolean {
  return tim !== undefined && TIM_OPEN_STATUSES.has(String(tim.agreementStatus));
}

function isTimTerminal(tim: UnknownRecord | undefined): boolean {
  return tim !== undefined && TIM_TERMINAL_STATUSES.has(String(tim.agreementStatus));
}

export function evaluateOpsSnapshot(snapshotValue: UnknownRecord, optionsValue: UnknownRecord): {
  findings: Finding[];
  coverage: UnknownRecord[];
  snapshotId: string;
  operationalWatermark: string;
} {
  const snapshot = clone(requireRecord(snapshotValue, "snapshot"));
  const options = clone(requireRecord(optionsValue, "OPS options"));
  assertFixtureOnly(snapshot);
  assertNoPii(snapshot);
  assertOnlyKeys(snapshot, SNAPSHOT_KEYS, "snapshot");
  if (snapshot.schemaVersion !== "ops-snapshot.v1") fail("CP_CONTRACT_INVALID", "unsupported OPS snapshot version");
  const snapshotId = requireOpaqueId(snapshot.snapshotId, "snapshotId");
  const operationalWatermark = requireString(snapshot.operationalWatermark, "operationalWatermark", 160);
  const sourceHash = requireString(snapshot.sourceHash, "sourceHash", 256);
  const asOf = requireIsoDate(snapshot.asOf, "asOf");
  const observedAt = requireIsoDate(options.observedAt, "observedAt");
  const windowEnd = requireIsoDate(options.timDeadlineWindowEnd, "timDeadlineWindowEnd");
  if (epoch(windowEnd, "timDeadlineWindowEnd") < epoch(asOf, "asOf")) {
    fail("CP_CONTRACT_INVALID", "TIM deadline window cannot end before asOf");
  }

  const coverageInput = requireRecord(snapshot.coverage, "coverage");
  for (const family of ["projects", "tasks", "promises", "timAgreements", "timDeadlines"] as const) {
    if (coverageInput[family] !== "complete") fail("CP_SOURCE_EMPTY", `${family} coverage is incomplete`);
  }
  if (coverageInput.intake !== "canonical_signal_absent") {
    fail("CP_CONTRACT_INVALID", "A1 intake rule must remain disabled without a canonical signal");
  }

  const projects = requireArray(snapshot.projects, "projects");
  const tasks = requireArray(snapshot.tasks, "tasks");
  const promises = requireArray(snapshot.promises, "promises");
  const timAgreements = requireArray(snapshot.timAgreements, "timAgreements");
  const timDeadlines = requireArray(snapshot.timDeadlines, "timDeadlines");
  projects.forEach((entry) => assertOnlyKeys(entry, PROJECT_KEYS, "project"));
  tasks.forEach((entry) => assertOnlyKeys(entry, TASK_KEYS, "task"));
  promises.forEach((entry) => assertOnlyKeys(entry, PROMISE_KEYS, "promise"));
  timAgreements.forEach((entry) => assertOnlyKeys(entry, TIM_KEYS, "timAgreement"));
  timDeadlines.forEach((entry) => assertOnlyKeys(entry, TIM_DEADLINE_KEYS, "timDeadline"));

  const sourceRows = projects.length + tasks.length + promises.length + timAgreements.length + timDeadlines.length;
  checkBudgetUsage(options.logicalBudget, {
    sourceRows,
    ruleEvaluations: sourceRows * 7,
  });

  const projectsById = new Map(projects.map((entry) => [requireOpaqueId(entry.projectId, "projectId"), entry]));
  const timById = new Map(timAgreements.map((entry) => [requireOpaqueId(entry.timId, "timId"), entry]));
  const findings: Finding[] = [];

  for (const project of projects) {
    const projectId = requireOpaqueId(project.projectId, "projectId");
    const version = requireVersion(project.version, "project.version");
    if (!isProjectOpen(project)) continue;
    const hasNextAction = tasks.some((task) => (
      task.projectId === projectId
      && TASK_OPEN_STATUSES.has(String(task.status))
      && task.isNextAction === true
    ));
    if (!hasNextAction) {
      findings.push(buildFinding({
        ruleId: "OPS-PROJECT-NEXT-ACTION-001",
        scopeKind: "project",
        scopeId: projectId,
        subjectId: null,
        linkKind: null,
        linkRef: null,
        reasonCode: "PROJECT_WITHOUT_NEXT_ACTION",
        proposedPriority: "normal",
        suggestedActionCode: "DEFINE_NEXT_ACTION",
        sourceRef: projectId,
        sourceVersion: version,
        snapshotId,
        operationalWatermark,
        sourceHash,
        observedAt,
        dueAt: null,
      }));
    }
  }

  for (const task of tasks) {
    const taskId = requireOpaqueId(task.taskId, "taskId");
    const projectId = typeof task.projectId === "string" ? task.projectId : undefined;
    const timId = typeof task.timId === "string" ? task.timId : undefined;
    if ((projectId ? 1 : 0) + (timId ? 1 : 0) !== 1) fail("CP_RESULT_INVALID", "task must have exactly one operational scope");
    const project = projectId ? projectsById.get(projectId) : undefined;
    const tim = timId ? timById.get(timId) : undefined;
    if (!project && !tim) fail("CP_RESULT_INVALID", "task scope does not exist in the snapshot");
    const scopeKind = projectId ? "project" : "tim_agreement";
    const scopeId = projectId ?? timId as string;
    const contextOpen = projectId ? isProjectOpen(project) : isTimOpen(tim);
    const contextTerminal = projectId ? isProjectTerminal(project) : isTimTerminal(tim);
    const statusOpen = TASK_OPEN_STATUSES.has(String(task.status));
    const dueAt = task.dueAt === null ? null : requireIsoDate(task.dueAt, "task.dueAt");
    const sourceVersion = requireVersion(task.version, "task.version");

    if (statusOpen && contextOpen && dueAt && epoch(dueAt, "task.dueAt") < epoch(asOf, "asOf")) {
      const priority = task.sourcePriority === "urgent" ? "urgent" : "high";
      const promiseLink = typeof task.promisedFromInteractionId === "string" ? task.promisedFromInteractionId : null;
      const deadlineLink = typeof task.timDeadlineId === "string" ? task.timDeadlineId : null;
      findings.push(buildFinding({
        ruleId: "OPS-TASK-OVERDUE-002",
        scopeKind,
        scopeId,
        subjectId: taskId,
        linkKind: promiseLink ? "promise_task" : deadlineLink ? "tim_deadline_task" : null,
        linkRef: promiseLink ?? deadlineLink,
        reasonCode: "TASK_OVERDUE",
        proposedPriority: priority,
        suggestedActionCode: "REVIEW_OVERDUE_TASK",
        sourceRef: taskId,
        sourceVersion,
        snapshotId,
        operationalWatermark,
        sourceHash,
        observedAt,
        dueAt,
      }));
    }

    if (statusOpen && contextTerminal && task.isNextAction === true) {
      findings.push(buildFinding({
        ruleId: "OPS-INCONSISTENCY-007",
        scopeKind,
        scopeId,
        subjectId: taskId,
        linkKind: null,
        linkRef: null,
        reasonCode: "TERMINAL_SCOPE_WITH_OPEN_NEXT_ACTION",
        proposedPriority: "high",
        suggestedActionCode: "REVIEW_TERMINAL_NEXT_ACTION",
        sourceRef: taskId,
        sourceVersion,
        snapshotId,
        operationalWatermark,
        sourceHash,
        observedAt,
        dueAt: null,
      }));
    }
  }

  for (const promise of promises) {
    const promiseId = requireOpaqueId(promise.promiseId, "promiseId");
    const projectId = requireOpaqueId(promise.projectId, "promise.projectId");
    const project = projectsById.get(projectId);
    if (!project) fail("CP_RESULT_INVALID", "promise project does not exist in the snapshot");
    const dueAt = requireIsoDate(promise.dueAt, "promise.dueAt");
    if (promise.fulfilled === false && isProjectOpen(project) && epoch(dueAt, "promise.dueAt") <= epoch(asOf, "asOf")) {
      findings.push(buildFinding({
        ruleId: "OPS-PROMISE-DUE-003",
        scopeKind: "project",
        scopeId: projectId,
        subjectId: promiseId,
        linkKind: typeof promise.linkedTaskId === "string" ? "promise_task" : null,
        linkRef: typeof promise.linkedTaskId === "string" ? promiseId : null,
        reasonCode: "PROMISE_DUE",
        proposedPriority: promise.sourcePriority === "urgent" ? "urgent" : "high",
        suggestedActionCode: "REVIEW_PROMISE_AND_CONTACT",
        sourceRef: promiseId,
        sourceVersion: requireVersion(promise.version, "promise.version"),
        snapshotId,
        operationalWatermark,
        sourceHash,
        observedAt,
        dueAt,
      }));
    }
  }

  for (const tim of timAgreements) {
    const timId = requireOpaqueId(tim.timId, "timId");
    if (!isTimOpen(tim)) continue;
    const hasNextAction = tasks.some((task) => (
      task.timId === timId
      && TASK_OPEN_STATUSES.has(String(task.status))
      && task.isNextAction === true
    ));
    if (!hasNextAction) {
      findings.push(buildFinding({
        ruleId: "OPS-TIM-NEXT-ACTION-005",
        scopeKind: "tim_agreement",
        scopeId: timId,
        subjectId: null,
        linkKind: null,
        linkRef: null,
        reasonCode: "TIM_WITHOUT_NEXT_ACTION",
        proposedPriority: "normal",
        suggestedActionCode: "DEFINE_TIM_FOLLOW_UP",
        sourceRef: timId,
        sourceVersion: requireVersion(tim.version, "tim.version"),
        snapshotId,
        operationalWatermark,
        sourceHash,
        observedAt,
        dueAt: null,
      }));
    }
  }

  for (const deadline of timDeadlines) {
    const deadlineId = requireOpaqueId(deadline.deadlineId, "deadlineId");
    const timId = requireOpaqueId(deadline.timId, "deadline.timId");
    const tim = timById.get(timId);
    if (!tim) fail("CP_RESULT_INVALID", "TIM deadline scope does not exist in the snapshot");
    const dueAt = requireIsoDate(deadline.dueAt, "deadline.dueAt");
    if (
      deadline.status === "open"
      && isTimOpen(tim)
      && epoch(dueAt, "deadline.dueAt") <= epoch(windowEnd, "timDeadlineWindowEnd")
    ) {
      const overdue = epoch(dueAt, "deadline.dueAt") <= epoch(asOf, "asOf");
      findings.push(buildFinding({
        ruleId: "OPS-TIM-DEADLINE-NEAR-006",
        scopeKind: "tim_agreement",
        scopeId: timId,
        subjectId: deadlineId,
        linkKind: typeof deadline.linkedTaskId === "string" ? "tim_deadline_task" : null,
        linkRef: typeof deadline.linkedTaskId === "string" ? deadlineId : null,
        reasonCode: overdue ? "TIM_DEADLINE_OVERDUE" : "TIM_DEADLINE_NEAR",
        proposedPriority: overdue ? "high" : "normal",
        suggestedActionCode: "REVIEW_TIM_DEADLINE",
        sourceRef: deadlineId,
        sourceVersion: requireVersion(deadline.version, "deadline.version"),
        snapshotId,
        operationalWatermark,
        sourceHash,
        observedAt,
        dueAt,
      }));
    }
  }

  checkBudgetUsage(options.logicalBudget, { findings: findings.length });
  findings.sort((left, right) => left.observationFingerprint.localeCompare(right.observationFingerprint));

  const findingCounts = new Map<RuleId, number>();
  for (const finding of findings) findingCounts.set(finding.ruleId, (findingCounts.get(finding.ruleId) ?? 0) + 1);
  const coverage = (Object.keys(RULES) as RuleId[]).map((ruleId) => ruleId === "OPS-INTAKE-UNTREATED-004"
    ? { ruleId, ruleVersion: "1", evaluationStatus: "not_evaluated", reasonCode: "CANONICAL_SIGNAL_ABSENT", findingCount: 0 }
    : { ruleId, ruleVersion: "1", evaluationStatus: "evaluated", findingCount: findingCounts.get(ruleId) ?? 0 });

  return { findings, coverage, snapshotId, operationalWatermark };
}

export function validateFinding(findingValue: UnknownRecord, inputValue: UnknownRecord): void {
  const finding = requireRecord(findingValue, "finding");
  const input = requireRecord(inputValue, "finding validation");
  assertNoPii(finding);
  const ruleId = requireString(finding.ruleId, "finding.ruleId", 64) as RuleId;
  const definition = RULES[ruleId];
  if (!definition || ruleId === "OPS-INTAKE-UNTREATED-004") fail("CP_RESULT_INVALID", "finding rule is not producible in A1");
  if (!definition.reasonCodes.includes(String(finding.reasonCode))) fail("CP_RESULT_INVALID", "reason code does not match its rule");
  if (!definition.actions.includes(String(finding.suggestedActionCode))) fail("CP_RESULT_INVALID", "action code does not match its rule");
  requireOpaqueId(finding.findingId, "findingId");
  requireOpaqueId(finding.missionId, "finding.missionId");
  requireString(finding.observationFingerprint, "observationFingerprint", 512);
  const scopeId = requireOpaqueId(finding.scopeId, "scopeId");
  if (!['project', 'tim_agreement', 'triage_signal'].includes(String(finding.scopeKind))) {
    fail("CP_RESULT_INVALID", "unknown finding scope kind");
  }
  if (Array.isArray(input.knownScopeIds) && !(input.knownScopeIds as unknown[]).includes(scopeId)) {
    fail("CP_RESULT_INVALID", "finding scope is unknown to its source result");
  }
  if (!['low', 'normal', 'high', 'urgent'].includes(String(finding.proposedPriority))) {
    fail("CP_RESULT_INVALID", "unknown finding priority");
  }
  requireOpaqueId(finding.sourceRef, "finding.sourceRef");
  requireVersion(finding.sourceVersion, "finding.sourceVersion");
  requireOpaqueId(finding.snapshotId, "finding.snapshotId");
  requireString(finding.operationalWatermark, "finding.operationalWatermark", 160);
  requireString(finding.sourceHash, "finding.sourceHash", 256);
  requireIsoDate(finding.observedAt, "finding.observedAt");
  if (finding.dueAt !== null) requireIsoDate(finding.dueAt, "finding.dueAt");
  if ((finding.linkKind === null) !== (finding.linkRef === null)) fail("CP_RESULT_INVALID", "finding link fields must be paired");
  if (finding.linkKind !== null && !['promise_task', 'tim_deadline_task'].includes(String(finding.linkKind))) {
    fail("CP_RESULT_INVALID", "finding link kind is invalid");
  }
}

function findingComparator(left: Finding, right: Finding): number {
  const priorityRank = { urgent: 0, high: 1, normal: 2, low: 3 } as const;
  const priority = priorityRank[left.proposedPriority] - priorityRank[right.proposedPriority];
  if (priority !== 0) return priority;
  const signalClass = (finding: Finding): number => (
    finding.reasonCode === "TIM_DEADLINE_OVERDUE"
      ? 2
      : RULES[finding.ruleId].signalClass
  );
  const signal = signalClass(left) - signalClass(right);
  if (signal !== 0) return signal;
  const leftDue = left.dueAt === null ? Number.POSITIVE_INFINITY : Date.parse(left.dueAt);
  const rightDue = right.dueAt === null ? Number.POSITIVE_INFINITY : Date.parse(right.dueAt);
  if (leftDue !== rightDue) return leftDue - rightDue;
  const detected = Date.parse(left.observedAt) - Date.parse(right.observedAt);
  if (detected !== 0) return detected;
  const scope = `${left.scopeKind}:${left.scopeId}`.localeCompare(`${right.scopeKind}:${right.scopeId}`);
  if (scope !== 0) return scope;
  return left.observationFingerprint.localeCompare(right.observationFingerprint);
}

function invalidBriefing(input: UnknownRecord, reason: string): UnknownRecord {
  return {
    missionId: input.missionId,
    version: "briefing.v1",
    state: "invalid",
    invalidReason: reason,
    items: [],
    totalCount: 0,
    omittedCount: 0,
    snapshotId: input.snapshotId,
    operationalWatermark: input.operationalWatermark,
    suggestedManualActionCode: "RUN_NEW_BRIEFING",
  };
}

function validCoverage(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  const byRule = new Map(value.filter(isRecord).map((entry) => [entry.ruleId, entry]));
  for (const ruleId of Object.keys(RULES) as RuleId[]) {
    const row = byRule.get(ruleId);
    if (!row) return false;
    if (ruleId === "OPS-INTAKE-UNTREATED-004") {
      if (row.evaluationStatus !== "not_evaluated" || row.reasonCode !== "CANONICAL_SIGNAL_ABSENT") return false;
    } else if (row.evaluationStatus !== "evaluated") {
      return false;
    }
  }
  return true;
}

export function composeBriefing(inputValue: UnknownRecord): UnknownRecord {
  const input = clone(requireRecord(inputValue, "briefing input"));
  const missionId = requireOpaqueId(input.missionId, "briefing.missionId");
  const sourceOpsMissionId = requireOpaqueId(input.sourceOpsMissionId, "sourceOpsMissionId");
  requireString(input.sourceOpsResultHash, "sourceOpsResultHash", 256);
  const snapshotId = requireOpaqueId(input.snapshotId, "briefing.snapshotId");
  const operationalWatermark = requireString(input.operationalWatermark, "briefing.operationalWatermark", 160);
  const currentOperationalWatermark = requireString(input.currentOperationalWatermark, "currentOperationalWatermark", 160);
  const createdAt = requireIsoDate(input.createdAt, "briefing.createdAt");
  validateLogicalBudget(input.logicalBudget);

  if (operationalWatermark !== currentOperationalWatermark) return invalidBriefing(input, "CP_SOURCE_STALE");
  if (!validCoverage(input.coverage)) return invalidBriefing(input, "CP_SOURCE_EMPTY");
  const rawFindings = requireArray(input.findings, "briefing.findings") as Finding[];
  const knownScopeIds = [...new Set(rawFindings.map((finding) => String(finding.scopeId)))];
  for (const finding of rawFindings) {
    validateFinding(finding, { knownScopeIds });
    if (finding.snapshotId !== snapshotId || finding.operationalWatermark !== operationalWatermark) {
      return invalidBriefing(input, "CP_SOURCE_STALE");
    }
  }

  const exact = new Map<string, Finding>();
  for (const finding of rawFindings) {
    const existing = exact.get(finding.observationFingerprint);
    if (!existing) {
      exact.set(finding.observationFingerprint, clone(finding));
      continue;
    }
    const existingMaterial = { ...existing, findingId: undefined };
    const incomingMaterial = { ...finding, findingId: undefined };
    if (JSON.stringify(existingMaterial) !== JSON.stringify(incomingMaterial)) {
      fail("CP_RESULT_INVALID", "same fingerprint carries conflicting finding material");
    }
  }

  const grouped = new Map<string, Finding[]>();
  for (const finding of exact.values()) {
    const key = `${finding.scopeKind}:${finding.scopeId}`;
    const entries = grouped.get(key) ?? [];
    entries.push(finding);
    grouped.set(key, entries);
  }
  const groups = [...grouped.values()].map((entries) => [...entries].sort(findingComparator));
  groups.sort((left, right) => findingComparator(left[0], right[0]));

  checkBudgetUsage(input.logicalBudget, {
    findings: rawFindings.length,
    briefingItems: Math.min(groups.length, 7),
  });

  const selected = groups.slice(0, 7);
  const items = selected.map((entries, index) => {
    const primary = entries[0];
    const findingRefs = [...new Set(entries.map((finding) => finding.findingId))].sort();
    const copy = renderBriefingTemplates(primary.reasonCode, primary.suggestedActionCode);
    return {
      briefingItemId: `BRI-${stableHash(`${missionId}:${primary.scopeKind}:${primary.scopeId}`)}`,
      rank: index + 1,
      scopeKind: primary.scopeKind,
      scopeId: primary.scopeId,
      primaryRuleId: primary.ruleId,
      reasonCode: primary.reasonCode,
      explanation: copy.explanation,
      suggestedActionCode: primary.suggestedActionCode,
      suggestedHumanAction: copy.suggestedHumanAction,
      signalCount: entries.length,
      findingRefs,
      source: {
        sourceOpsMissionId,
        sourceOpsResultHash: input.sourceOpsResultHash,
        snapshotId,
        operationalWatermark,
      },
      createdAt,
    };
  });

  return {
    missionId,
    version: "briefing.v1",
    state: "current",
    invalidReason: null,
    items,
    totalCount: groups.length,
    omittedCount: Math.max(0, groups.length - items.length),
    snapshotId,
    operationalWatermark,
    createdAt,
  };
}

export function isBriefingCurrent(briefingValue: UnknownRecord, inputValue: UnknownRecord): boolean {
  const briefing = requireRecord(briefingValue, "briefing");
  const input = requireRecord(inputValue, "briefing freshness");
  return briefing.state === "current"
    && input.missionStatus === "completed"
    && typeof input.currentOperationalWatermark === "string"
    && briefing.operationalWatermark === input.currentOperationalWatermark;
}
