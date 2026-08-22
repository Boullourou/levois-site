import type { D1Database } from "@cloudflare/workers-types";
import {
  AgenticContractError,
  cancelMission,
  checkMissionIdempotency,
  checkpointMission,
  composeBriefing,
  createMission,
  evaluateSwitches,
  evaluateOpsSnapshot,
  renderBriefingTemplates,
  transitionMission,
} from "../../agentic";
import { DomainError, newId } from "./db";
import { buildOpsSnapshot, readOperationalWatermark } from "./agentic-snapshot";
import {
  appendMissionTrace,
  createStoredMission,
  findCosMissionForOps,
  findStoredMission,
  findStoredMissionByIdempotency,
  findStoredSwitch,
  findTraceByIdempotency,
  latestOpsMission,
  listActiveMissionsForScope,
  listOpsFindings,
  listStoredSwitches,
  listStoredTrace,
  storeBriefingItems,
  storeOpsResult,
  storedBriefingItems,
  updateStoredMission,
  writeStoredSwitch,
  type AgenticEntryKind,
  type StoredMission,
  type StoredSwitch,
  type TraceWrite,
} from "./agentic-store";

export const AGENTIC_A1_FIXTURE_ID = "agentic-a1-v1" as const;
export const AGENTIC_A1_SHADOW_MODE = true as const;

const OPS_CAPABILITIES = ["ops.read_snapshot", "ops.evaluate_rules"] as const;
const COS_CAPABILITIES = [
  "cos.read_ops_results",
  "cos.deduplicate",
  "cos.rank",
  "cos.compose_briefing",
] as const;

const EXPECTED_SWITCH_SCOPES = [
  ["global", "global"],
  ["agent", "OPS-01"],
  ["agent", "COS-01"],
  ...OPS_CAPABILITIES.map((key) => ["capability", key]),
  ...COS_CAPABILITIES.map((key) => ["capability", key]),
] as const;

const FIXTURE_PROFILE = {
  timeoutMs: 30_000,
  timDeadlineWindowMs: 7 * 24 * 60 * 60 * 1_000,
  opsBudget: {
    sourceRows: 10_000,
    ruleEvaluations: 70_000,
    findings: 1_000,
    briefingItems: 1,
    traceEntries: 20_000,
  },
  cosBudget: {
    sourceRows: 1,
    ruleEvaluations: 1,
    findings: 1_000,
    briefingItems: 7,
    traceEntries: 2_000,
  },
} as const;

type UnknownRecord = Record<string, unknown>;

export interface AgenticExecutionContext {
  actorId: string;
  idempotencyKey: string;
  inputHash: string;
  now: string;
  clock?: () => string;
}

export interface RunAgenticBriefingInput {
  fixtureOnly: true;
  fixtureId: typeof AGENTIC_A1_FIXTURE_ID;
}

export interface AgenticMissionDto {
  missionId: string;
  missionType: StoredMission["missionType"];
  agentId: StoredMission["logicalAgent"];
  capabilities: string[];
  objectiveCode: string;
  status: StoredMission["status"];
  priority: StoredMission["priority"];
  trigger: {
    kind: "manual";
    ref: string;
  };
  source: {
    kind: StoredMission["source"]["kind"];
    ref: string;
    version: string;
  };
  snapshotId: string | null;
  operationalWatermark: string | null;
  asOf: string | null;
  correlationId: string;
  causationId: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  timeoutAt: string;
  attemptNo: 1;
  logicalBudget: Record<string, number>;
  logicalUsage: Record<string, number>;
  resultStatus: StoredMission["resultStatus"];
  resultTotalCount: number;
  resultSelectedCount: number;
  resultOmittedCount: number;
  closeReason: string | null;
  errorCode: string | null;
  fixtureOnly: true;
  shadowMode: true;
  version: number;
}

export interface AgenticBriefingItemDto {
  itemId: string;
  rank: number;
  priority: "urgent" | "high" | "normal" | "low";
  primaryRuleId: string;
  scopeKind: "project" | "tim_agreement";
  scopeId: string;
  reasonCode: string;
  explanation: string;
  suggestedActionCode: string;
  suggestedHumanAction: string;
  signalCount: number;
  source: {
    sourceOpsMissionId: string;
    snapshotId: string;
    operationalWatermark: string;
  };
}

export interface AgenticBriefingDto {
  state: "not_run" | "available" | "empty" | "stale" | "incomplete" | "stopped" | "failed";
  missionId: string | null;
  generatedAt: string | null;
  itemCount: number;
  omittedCount: number;
  items: AgenticBriefingItemDto[];
  reasonCode: string | null;
  fixtureOnly: true;
  shadowMode: true;
  performsAutomaticActions: false;
}

export interface RunAgenticBriefingResult {
  replayed: boolean;
  opsMission: AgenticMissionDto;
  cosMission: AgenticMissionDto | null;
  briefing: AgenticBriefingDto;
  fixtureOnly: true;
  shadowMode: true;
}

export interface AgenticSwitchDto {
  scopeKind: "global" | "agent" | "capability";
  scopeKey: string;
  effectiveState: "enabled" | "stopped";
  present: boolean;
  version: number;
  reasonCode: string | null;
  decidedAt: string | null;
  fixtureOnly: true;
  shadowMode: true;
}

function now(context: AgenticExecutionContext): string {
  return context.clock?.() ?? new Date().toISOString();
}

function assertUtc(value: string, field: string): string {
  if (new Date(value).toISOString() !== value) throw new DomainError(400, "CP_CONTRACT_INVALID", `${field} invalide.`);
  return value;
}

function assertBoundedCode(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/.test(value)) {
    throw new DomainError(400, "CP_CONTRACT_INVALID", `${field} invalide.`);
  }
  return value;
}

function assertContext(context: AgenticExecutionContext): void {
  assertBoundedCode(context.actorId, "actorId");
  if (["OPS-01", "COS-01", "CONTROL-PLANE"].includes(context.actorId)) {
    throw new DomainError(403, "CP_PERMISSION_DENIED", "Une autorité humaine est requise.");
  }
  assertBoundedCode(context.idempotencyKey, "idempotencyKey");
  if (typeof context.inputHash !== "string" || context.inputHash.length < 16 || context.inputHash.length > 256) {
    throw new DomainError(400, "CP_CONTRACT_INVALID", "inputHash invalide.");
  }
  assertUtc(context.now, "now");
}

function assertFixtureInput(input: { fixtureOnly: unknown; fixtureId: unknown }): void {
  if (input.fixtureOnly !== true || input.fixtureId !== AGENTIC_A1_FIXTURE_ID) {
    throw new DomainError(403, "CP_SCOPE_VIOLATION", "A1 accepte uniquement la fixture isolée autorisée.");
  }
}

function statusForCode(code: string): number {
  if (code === "CP_KILL_SWITCH_ACTIVE") return 423;
  if ([
    "CP_IDEMPOTENCY_CONFLICT",
    "CP_VERSION_CONFLICT",
    "CP_SOURCE_STALE",
    "CP_SOURCE_EMPTY",
    "CP_BUDGET_EXCEEDED",
    "CP_TIMEOUT",
  ].includes(code)) return 409;
  if (code === "CP_PERMISSION_DENIED" || code === "CP_SCOPE_VIOLATION") return 403;
  if ([
    "CP_UPSTREAM_UNAVAILABLE",
    "CP_DEPENDENCY_FAILED",
    "CP_RECONCILIATION_REQUIRED",
    "CP_RESULT_INVALID",
    "CP_PII_POLICY_VIOLATION",
  ].includes(code)) return 503;
  return 400;
}

function toDomainError(error: unknown): DomainError {
  if (error instanceof DomainError) return error;
  if (error instanceof AgenticContractError) {
    return new DomainError(statusForCode(error.code), error.code, "La mission agentique a été refusée par son contrat A1.");
  }
  const message = error instanceof Error ? error.message : "";
  const match = message.match(/\bCP_[A-Z_]+\b/);
  if (match) return new DomainError(statusForCode(match[0]), match[0], "La mission agentique n'a pas pu être exécutée.");
  return new DomainError(503, "CP_UPSTREAM_UNAVAILABLE", "La couche agentique est indisponible ; le cockpit manuel reste utilisable.");
}

async function guarded<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw toDomainError(error);
  }
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as UnknownRecord)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

const PHONE_SHAPED_ID = /(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}/;

function newAgenticId(prefix: string): string {
  let value = newId(prefix);
  // UUIDs are opaque, but a random decimal run can accidentally look like a
  // French phone number to the strict boundary scanner. Replace only that
  // impossible-for-a-UUID semantic with a non-decimal marker.
  while (PHONE_SHAPED_ID.test(value)) {
    value = value.replace(PHONE_SHAPED_ID, (match) => `x${match.slice(1)}`);
  }
  return value;
}

async function hash(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonical(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function missionDto(mission: StoredMission): AgenticMissionDto {
  return {
    missionId: mission.missionId,
    missionType: mission.missionType,
    agentId: mission.logicalAgent,
    capabilities: [...mission.capabilities],
    objectiveCode: mission.objectiveCode,
    status: mission.status,
    priority: mission.priority,
    trigger: { kind: mission.trigger.kind, ref: mission.trigger.ref },
    source: { kind: mission.source.kind, ref: mission.source.ref, version: mission.source.version },
    snapshotId: mission.snapshotId ?? null,
    operationalWatermark: mission.operationalWatermark ?? null,
    asOf: mission.asOf ?? null,
    correlationId: mission.correlationId,
    causationId: mission.causationId || null,
    createdAt: mission.createdAt,
    startedAt: mission.startedAt ?? null,
    finishedAt: mission.finishedAt ?? null,
    timeoutAt: mission.timeoutAt,
    attemptNo: mission.attemptNo,
    logicalBudget: { ...mission.logicalBudget },
    logicalUsage: { ...mission.logicalUsage },
    resultStatus: mission.resultStatus,
    resultTotalCount: mission.resultTotalCount,
    resultSelectedCount: mission.resultSelectedCount,
    resultOmittedCount: mission.resultOmittedCount,
    closeReason: mission.closeReason ?? null,
    errorCode: mission.errorCode ?? null,
    fixtureOnly: true,
    shadowMode: true,
    version: mission.version,
  };
}

function normalizeMission(value: UnknownRecord, base?: StoredMission): StoredMission {
  const status = String(value.status) as StoredMission["status"];
  const terminal = status === "completed" || status === "failed" || status === "cancelled";
  return {
    ...(base ?? {} as StoredMission),
    ...(value as unknown as StoredMission),
    missionId: String(value.missionId),
    missionType: String(value.missionType) as StoredMission["missionType"],
    logicalAgent: String(value.logicalAgent) as StoredMission["logicalAgent"],
    capabilities: [...value.capabilities as string[]],
    contractVersion: "a1.v1",
    objectiveCode: String(value.objectiveCode),
    objective: String(value.objective),
    status,
    priority: String(value.priority) as StoredMission["priority"],
    trigger: value.trigger as StoredMission["trigger"],
    source: value.source as StoredMission["source"],
    idempotencyKey: String(value.idempotencyKey),
    inputHash: String(value.inputHash),
    correlationId: String(value.correlationId),
    causationId: String(value.causationId),
    createdAt: String(value.createdAt),
    timeoutAt: String(value.timeoutAt),
    attemptNo: 1,
    executionEpoch: Number(value.executionEpoch ?? base?.executionEpoch ?? 1),
    restoreEpoch: Number(value.restoreEpoch ?? base?.restoreEpoch ?? 1),
    logicalBudget: value.logicalBudget as Record<string, number>,
    logicalUsage: (value.logicalUsage ?? base?.logicalUsage ?? {}) as Record<string, number>,
    resultStatus: status === "completed" ? "valid" : terminal ? "invalid" : "pending",
    resultTotalCount: Number(value.resultTotalCount ?? base?.resultTotalCount ?? 0),
    resultSelectedCount: Number(value.resultSelectedCount ?? base?.resultSelectedCount ?? 0),
    resultOmittedCount: Number(value.resultOmittedCount ?? base?.resultOmittedCount ?? 0),
    policyVersion: String(value.policyVersion),
    autonomyLevel: "L0",
    fixtureOnly: true,
    version: Number(value.version),
    ...(status === "completed" ? { closeReason: "completed" } : {}),
  };
}

function trace(
  context: AgenticExecutionContext,
  mission: StoredMission,
  entryKind: AgenticEntryKind,
  options: Partial<TraceWrite> = {},
): TraceWrite {
  const value: TraceWrite = {
    entryKind,
    occurredAt: now(context),
    actorKind: options.actorKind ?? "control_plane",
    actorId: options.actorId ?? "CONTROL-PLANE-A1",
    agentId: mission.logicalAgent,
    payloadHash: options.payloadHash ?? `${context.inputHash}:${mission.missionId}:${entryKind}:${mission.version}`,
    policyVersion: mission.policyVersion,
    controlFingerprint: mission.controlFingerprint,
    ...options,
  };
  value.logicalUsage = { traceEntries: 1, ...(options.logicalUsage ?? {}) };
  return value;
}

function pureSwitches(switches: StoredSwitch[]): Array<Record<string, unknown>> {
  return switches.map((entry) => ({
    scopeKind: entry.scopeKind,
    scopeKey: entry.scopeKey,
    state: entry.state,
    version: entry.version,
    restoreEpoch: entry.restoreEpoch,
  }));
}

function admitSwitches(
  agentId: "OPS-01" | "COS-01",
  capabilities: readonly string[],
  switches: StoredSwitch[],
): string {
  const evaluation = evaluateSwitches({
    agentId,
    capabilities: [...capabilities],
    switches: pureSwitches(switches),
  });
  if (!evaluation.allowed) {
    throw new DomainError(423, "CP_KILL_SWITCH_ACTIVE", "Le mode Shadow est arrêté par un contrôle humain.");
  }
  return evaluation.fingerprint;
}

function assertSealedAdmission(
  mission: StoredMission,
  switches: StoredSwitch[],
): void {
  const fingerprint = admitSwitches(mission.logicalAgent, mission.capabilities, switches);
  if (!mission.controlFingerprint || mission.controlFingerprint !== fingerprint) {
    throw new DomainError(423, "CP_KILL_SWITCH_ACTIVE", "Les contrôles ont changé depuis l'admission de la mission.");
  }
}

async function persistTransition(
  database: D1Database,
  previous: StoredMission,
  command: UnknownRecord,
  context: AgenticExecutionContext,
  entryKind: AgenticEntryKind,
  options: { counts?: { total?: number; selected?: number; omitted?: number }; reasonCode?: string } = {},
): Promise<StoredMission> {
  const transitioned = transitionMission(previous as unknown as UnknownRecord, command) as UnknownRecord;
  const next = normalizeMission(transitioned, previous);
  if (options.counts) {
    next.resultTotalCount = options.counts.total ?? 0;
    next.resultSelectedCount = options.counts.selected ?? 0;
    next.resultOmittedCount = options.counts.omitted ?? 0;
  }
  await updateStoredMission(database, previous.version, next, trace(context, next, entryKind, {
    fromStatus: previous.status,
    toStatus: next.status,
    reasonCode: options.reasonCode ?? next.closeReason ?? null,
    resultKind: next.resultKind ?? null,
    resultRef: next.status === "completed" ? next.missionId : null,
    resultHash: next.resultHash ?? null,
    errorCode: next.errorCode ?? null,
    errorStage: next.errorStage ?? null,
  }));
  return next;
}

async function attachSnapshot(
  database: D1Database,
  mission: StoredMission,
  snapshot: Awaited<ReturnType<typeof buildOpsSnapshot>>,
  context: AgenticExecutionContext,
): Promise<StoredMission> {
  const next: StoredMission = {
    ...mission,
    snapshotId: snapshot.snapshotId,
    operationalWatermark: snapshot.operationalWatermark,
    asOf: snapshot.asOf,
    sourceHash: snapshot.sourceHash,
    source: { ...mission.source, hash: snapshot.sourceHash, operationalWatermark: snapshot.operationalWatermark },
    heartbeatAt: now(context),
    version: mission.version + 1,
  };
  await updateStoredMission(database, mission.version, next, trace(context, next, "snapshot_read", {
    fromStatus: mission.status,
    toStatus: mission.status,
    resultKind: "ops_snapshot",
    resultRef: snapshot.snapshotId,
    resultHash: snapshot.sourceHash,
    logicalUsage: {
      sourceRows: snapshot.projects.length + snapshot.tasks.length + snapshot.promises.length
        + snapshot.timAgreements.length + snapshot.timDeadlines.length,
    },
  }));
  return next;
}

async function checkpoint(
  database: D1Database,
  mission: StoredMission,
  context: AgenticExecutionContext,
  expectedWatermark?: string,
): Promise<StoredMission> {
  const switches = await listStoredSwitches(database);
  const currentWatermark = expectedWatermark ? await readOperationalWatermark(database) : undefined;
  const checked = checkpointMission(mission as unknown as UnknownRecord, {
    now: now(context),
    expectedVersion: mission.version,
    capabilities: mission.capabilities,
    switches: pureSwitches(switches),
    ...(expectedWatermark ? {
      expectedOperationalWatermark: expectedWatermark,
      currentOperationalWatermark: currentWatermark,
    } : {}),
  }) as UnknownRecord;
  if (String(checked.status) === mission.status && Number(checked.version) === mission.version) return mission;
  const next = normalizeMission(checked, mission);
  const killed = next.closeReason === "kill_switch";
  await updateStoredMission(database, mission.version, next, trace(context, next, killed
    ? "kill_switch_encountered"
    : next.status === "cancelled" ? "mission_cancelled" : "error_recorded", {
    fromStatus: mission.status,
    toStatus: next.status,
    reasonCode: next.closeReason ?? next.errorCode ?? null,
    errorCode: next.errorCode ?? null,
  }));
  if (killed) {
    await appendMissionTrace(database, next, trace(context, next, "mission_cancelled", {
      fromStatus: mission.status,
      toStatus: "cancelled",
      reasonCode: "kill_switch",
    }));
  }
  return next;
}

async function failMission(
  database: D1Database,
  mission: StoredMission,
  error: unknown,
  context: AgenticExecutionContext,
): Promise<StoredMission> {
  if (["completed", "failed", "cancelled"].includes(mission.status)) return mission;
  const domain = toDomainError(error);
  if (domain.code === "CP_KILL_SWITCH_ACTIVE" || domain.code === "CP_SOURCE_STALE") {
    return persistTransition(database, mission, {
      to: "cancelled",
      now: now(context),
      expectedVersion: mission.version,
      reasonCode: domain.code === "CP_SOURCE_STALE" ? "stale_source" : "kill_switch",
    }, context, domain.code === "CP_KILL_SWITCH_ACTIVE" ? "kill_switch_encountered" : "mission_cancelled", {
      reasonCode: domain.code === "CP_SOURCE_STALE" ? "stale_source" : "kill_switch",
    });
  }
  return persistTransition(database, mission, {
    to: "failed",
    now: now(context),
    expectedVersion: mission.version,
    errorCode: domain.code,
  }, context, "error_recorded", { reasonCode: domain.code });
}

function makeMission(
  type: "ops.shadow_scan.v1" | "cos.daily_briefing.v1",
  input: {
    id: string;
    idempotencyKey: string;
    inputHash: string;
    correlationId: string;
    causationId: string;
    actorId: string;
    createdAt: string;
    timeoutAt: string;
    sourceRef: string;
    sourceHash: string;
    sourceWatermark: string;
    logicalBudget: Record<string, number>;
    controlFingerprint: string;
  },
): StoredMission {
  const ops = type === "ops.shadow_scan.v1";
  const raw = createMission({
    missionId: input.id,
    missionType: type,
    logicalAgent: ops ? "OPS-01" : "COS-01",
    capabilities: ops ? [...OPS_CAPABILITIES] : [...COS_CAPABILITIES],
    contractVersion: "a1.v1",
    objectiveCode: ops ? "OPS_SHADOW_SCAN" : "COS_DAILY_BRIEFING",
    objective: ops
      ? "Détecter les écarts opérationnels déterministes de la fixture A1."
      : "Composer le briefing déterministe depuis le résultat OPS courant.",
    priority: "normal",
    trigger: { kind: "manual", ref: input.idempotencyKey, actorId: input.actorId },
    source: {
      kind: ops ? "fixture_request" : "ops_mission",
      ref: input.sourceRef,
      version: "a1.v1",
      hash: input.sourceHash,
      operationalWatermark: input.sourceWatermark,
    },
    idempotencyKey: input.idempotencyKey,
    inputHash: input.inputHash,
    correlationId: input.correlationId,
    causationId: input.causationId,
    createdAt: input.createdAt,
    timeoutAt: input.timeoutAt,
    logicalBudget: input.logicalBudget,
    logicalUsage: {},
    policyVersion: "policy-a1.v1",
    autonomyLevel: "L0",
    attemptNo: 1,
    executionEpoch: 1,
    restoreEpoch: 1,
    controlFingerprint: input.controlFingerprint,
    fixtureOnly: true,
    environment: "fixture",
    version: 1,
  }) as UnknownRecord;
  return normalizeMission(raw);
}

async function briefingForMission(
  database: D1Database,
  mission: StoredMission | null,
  sourceOps: StoredMission | null = null,
): Promise<AgenticBriefingDto> {
  const base = {
    fixtureOnly: true as const,
    shadowMode: true as const,
    performsAutomaticActions: false as const,
  };
  const switches = pureSwitches(await listStoredSwitches(database));
  const control = evaluateSwitches({
    agentId: "COS-01",
    capabilities: [...COS_CAPABILITIES],
    switches,
  });
  const opsControl = sourceOps ? evaluateSwitches({
    agentId: "OPS-01",
    capabilities: [...OPS_CAPABILITIES],
    switches,
  }) : null;
  if (!control.allowed || (opsControl && !opsControl.allowed)) {
    return {
      ...base,
      state: "stopped",
      missionId: mission?.missionId ?? null,
      generatedAt: mission?.finishedAt ?? mission?.createdAt ?? null,
      itemCount: 0,
      omittedCount: 0,
      items: [],
      reasonCode: "CP_KILL_SWITCH_ACTIVE",
    };
  }
  if (!mission && sourceOps) {
    const stopped = sourceOps.status === "cancelled" && sourceOps.closeReason === "kill_switch";
    const stale = sourceOps.status === "cancelled" && sourceOps.closeReason === "stale_source";
    const failed = sourceOps.status === "failed";
    return {
      ...base,
      state: stopped ? "stopped" : stale ? "stale" : failed ? "failed" : "incomplete",
      missionId: sourceOps.missionId,
      generatedAt: sourceOps.finishedAt ?? sourceOps.createdAt,
      itemCount: 0,
      omittedCount: 0,
      items: [],
      reasonCode: sourceOps.errorCode ?? sourceOps.closeReason ?? "COS_MISSION_MISSING",
    };
  }
  if (!mission) return { ...base, state: "not_run", missionId: null, generatedAt: null, itemCount: 0, omittedCount: 0, items: [], reasonCode: "NO_BRIEFING" };
  if (sourceOps && (!sourceOps.controlFingerprint || sourceOps.controlFingerprint !== opsControl?.fingerprint)) {
    return {
      ...base,
      state: "stale",
      missionId: mission.missionId,
      generatedAt: mission.finishedAt ?? mission.createdAt,
      itemCount: 0,
      omittedCount: mission.resultOmittedCount,
      items: [],
      reasonCode: "CP_CONTROL_CHANGED",
    };
  }
  if (!mission.controlFingerprint || mission.controlFingerprint !== control.fingerprint) {
    return {
      ...base,
      state: "stale",
      missionId: mission.missionId,
      generatedAt: mission.finishedAt ?? mission.createdAt,
      itemCount: 0,
      omittedCount: mission.resultOmittedCount,
      items: [],
      reasonCode: "CP_CONTROL_CHANGED",
    };
  }
  if (mission.status !== "completed" || mission.resultStatus !== "valid") {
    const stopped = mission.status === "cancelled" && mission.closeReason === "kill_switch";
    const stale = mission.status === "cancelled" && mission.closeReason === "stale_source";
    const incomplete = mission.errorCode === "CP_SOURCE_EMPTY" || mission.errorCode === "CP_RECONCILIATION_REQUIRED";
    const failed = mission.status === "failed";
    return {
      ...base,
      state: stopped ? "stopped" : stale ? "stale" : incomplete ? "incomplete" : failed ? "failed" : "incomplete",
      missionId: mission.missionId,
      generatedAt: mission.finishedAt ?? mission.createdAt,
      itemCount: 0,
      omittedCount: 0,
      items: [],
      reasonCode: mission.errorCode ?? mission.closeReason ?? "MISSION_NOT_COMPLETED",
    };
  }
  let currentWatermark: string;
  try {
    currentWatermark = await readOperationalWatermark(database);
  } catch {
    return {
      ...base,
      state: "failed",
      missionId: mission.missionId,
      generatedAt: mission.finishedAt ?? mission.createdAt,
      itemCount: 0,
      omittedCount: mission.resultOmittedCount,
      items: [],
      reasonCode: "CP_UPSTREAM_UNAVAILABLE",
    };
  }
  if (!mission.operationalWatermark || mission.operationalWatermark !== currentWatermark) {
    return {
      ...base,
      state: "stale",
      missionId: mission.missionId,
      generatedAt: mission.finishedAt ?? mission.createdAt,
      itemCount: 0,
      omittedCount: mission.resultOmittedCount,
      items: [],
      reasonCode: "CP_SOURCE_STALE",
    };
  }
  const rows = await storedBriefingItems(database, mission.missionId);
  if (rows.length !== mission.resultSelectedCount || rows.length > 7) {
    return {
      ...base,
      state: "incomplete",
      missionId: mission.missionId,
      generatedAt: mission.finishedAt ?? mission.createdAt,
      itemCount: 0,
      omittedCount: mission.resultOmittedCount,
      items: [],
      reasonCode: "CP_RECONCILIATION_REQUIRED",
    };
  }
  const items = rows.map((row) => {
    const copy = renderBriefingTemplates(String(row.reasonCode), String(row.suggestedActionCode));
    return {
      itemId: String(row.briefingItemId),
      rank: Number(row.rank),
      priority: String(row.priority) as AgenticBriefingItemDto["priority"],
      primaryRuleId: String(row.primaryRuleId),
      scopeKind: String(row.scopeKind) as "project" | "tim_agreement",
      scopeId: String(row.scopeId),
      reasonCode: String(row.reasonCode),
      explanation: copy.explanation,
      suggestedActionCode: String(row.suggestedActionCode),
      suggestedHumanAction: copy.suggestedHumanAction,
      signalCount: (row.findingRefs as string[]).length,
      source: {
        sourceOpsMissionId: String(row.sourceOpsMissionId),
        snapshotId: String(row.snapshotId),
        operationalWatermark: String(row.operationalWatermark),
      },
    };
  });
  return {
    ...base,
    state: items.length === 0 ? "empty" : "available",
    missionId: mission.missionId,
    generatedAt: mission.finishedAt ?? mission.createdAt,
    itemCount: items.length,
    omittedCount: mission.resultOmittedCount,
    items,
    reasonCode: null,
  };
}

async function replayResult(database: D1Database, ops: StoredMission): Promise<RunAgenticBriefingResult> {
  const cos = await findCosMissionForOps(database, ops.missionId);
  return {
    replayed: true,
    opsMission: missionDto(ops),
    cosMission: cos ? missionDto(cos) : null,
    briefing: await briefingForMission(database, cos, ops),
    fixtureOnly: true,
    shadowMode: true,
  };
}

async function executeAgenticBriefing(
  database: D1Database,
  input: RunAgenticBriefingInput,
  context: AgenticExecutionContext,
): Promise<RunAgenticBriefingResult> {
  return guarded(async () => {
    assertContext(context);
    assertFixtureInput(input);
    const existing = await findStoredMissionByIdempotency(database, context.idempotencyKey);
    if (existing) {
      checkMissionIdempotency(existing as unknown as UnknownRecord, {
        idempotencyKey: context.idempotencyKey,
        inputHash: context.inputHash,
      });
      return replayResult(database, existing);
    }

    // Admission is fail-closed for both A1 capabilities before any mission row
    // is created. The fingerprints are then sealed onto the draft missions.
    const admissionSwitches = await listStoredSwitches(database);
    const opsControlFingerprint = admitSwitches("OPS-01", OPS_CAPABILITIES, admissionSwitches);
    const cosControlFingerprint = admitSwitches("COS-01", COS_CAPABILITIES, admissionSwitches);
    const startedAt = context.now;
    const timeoutAt = new Date(Date.parse(startedAt) + FIXTURE_PROFILE.timeoutMs).toISOString();
    const timWindowEnd = new Date(Date.parse(startedAt) + FIXTURE_PROFILE.timDeadlineWindowMs).toISOString();
    const correlationId = newAgenticId("acorr");
    let ops = makeMission("ops.shadow_scan.v1", {
      id: newAgenticId("amission"),
      idempotencyKey: context.idempotencyKey,
      inputHash: context.inputHash,
      correlationId,
      causationId: context.actorId,
      actorId: context.actorId,
      createdAt: startedAt,
      timeoutAt,
      sourceRef: AGENTIC_A1_FIXTURE_ID,
      sourceHash: context.inputHash,
      sourceWatermark: "WM_PENDING_FIXTURE",
      logicalBudget: { ...FIXTURE_PROFILE.opsBudget },
      controlFingerprint: opsControlFingerprint,
    });
    try {
      await createStoredMission(database, ops, trace(context, ops, "mission_created", {
        actorKind: "human",
        actorId: context.actorId,
        fromStatus: null,
        toStatus: "draft",
      }));
    } catch (error) {
      // A second isolate can pass the initial read before the winner commits.
      // D1's unique idempotency constraint is authoritative: re-read and
      // replay the winner without retrying any mission work.
      const concurrent = await findStoredMissionByIdempotency(database, context.idempotencyKey);
      if (concurrent) {
        checkMissionIdempotency(concurrent as unknown as UnknownRecord, {
          idempotencyKey: context.idempotencyKey,
          inputHash: context.inputHash,
        });
        return replayResult(database, concurrent);
      }
      throw error;
    }

    try {
      ops = await persistTransition(database, ops, {
        to: "planned", now: now(context), expectedVersion: ops.version,
      }, context, "mission_transitioned");
      const switches = await listStoredSwitches(database);
      assertSealedAdmission(ops, switches);
      ops = await persistTransition(database, ops, {
        to: "assigned", now: now(context), expectedVersion: ops.version, switches: pureSwitches(switches),
      }, context, "mission_transitioned");
      ops = await persistTransition(database, ops, {
        to: "running", now: now(context), expectedVersion: ops.version,
      }, context, "mission_started");
      ops = await checkpoint(database, ops, context);
      if (ops.status !== "running") throw new Error(ops.errorCode ?? "CP_KILL_SWITCH_ACTIVE");

      const snapshot = await buildOpsSnapshot(database, { asOf: startedAt, fixtureOnly: true });
      const sourceRowCount = snapshot.projects.length + snapshot.tasks.length + snapshot.promises.length
        + snapshot.timAgreements.length + snapshot.timDeadlines.length;
      ops = await attachSnapshot(database, ops, snapshot, context);
      ops = await checkpoint(database, ops, context, snapshot.operationalWatermark);
      if (ops.status !== "running") throw new Error(ops.closeReason === "stale_source" ? "CP_SOURCE_STALE" : "CP_KILL_SWITCH_ACTIVE");

      const evaluated = evaluateOpsSnapshot(snapshot as unknown as UnknownRecord, {
        observedAt: now(context),
        timDeadlineWindowEnd: timWindowEnd,
        logicalBudget: ops.logicalBudget,
      });
      const findings = await Promise.all(evaluated.findings.map(async (finding) => ({
        ...finding,
        missionId: ops.missionId,
        findingId: `FND_${(await hash({
          missionId: ops.missionId,
          observationFingerprint: finding.observationFingerprint,
        })).slice("sha256:".length, "sha256:".length + 32)}`,
      })));
      await storeOpsResult(database, ops, {
        findings,
        coverage: evaluated.coverage,
        asOf: snapshot.asOf,
        now: now(context),
        sourceRowCount,
      });
      ops.logicalUsage = {
        sourceRows: sourceRowCount,
        ruleEvaluations: sourceRowCount * 7,
        findings: findings.length,
        briefingItems: 0,
        traceEntries: evaluated.coverage.length + findings.length + 6,
      };
      ops = await checkpoint(database, ops, context, snapshot.operationalWatermark);
      if (ops.status !== "running") throw new Error(ops.closeReason === "stale_source" ? "CP_SOURCE_STALE" : "CP_KILL_SWITCH_ACTIVE");
      const opsResultHash = await hash({ snapshotId: snapshot.snapshotId, coverage: evaluated.coverage, findings });
      ops = await persistTransition(database, ops, {
        to: "completed",
        now: now(context),
        expectedVersion: ops.version,
        resultHash: opsResultHash,
        resultKind: "ops_findings",
      }, context, "mission_completed", { counts: { total: findings.length, selected: findings.length, omitted: 0 } });

      let cos = makeMission("cos.daily_briefing.v1", {
        id: newAgenticId("amission"),
        idempotencyKey: `${context.idempotencyKey}:cos`,
        inputHash: await hash({ opsMissionId: ops.missionId, opsResultHash }),
        correlationId,
        causationId: ops.missionId,
        actorId: context.actorId,
        createdAt: now(context),
        timeoutAt,
        sourceRef: ops.missionId,
        sourceHash: opsResultHash,
        sourceWatermark: snapshot.operationalWatermark,
        logicalBudget: { ...FIXTURE_PROFILE.cosBudget },
        controlFingerprint: cosControlFingerprint,
      });
      cos.snapshotId = snapshot.snapshotId;
      cos.operationalWatermark = snapshot.operationalWatermark;
      cos.asOf = snapshot.asOf;
      cos.sourceHash = opsResultHash;
      await createStoredMission(database, cos, trace(context, cos, "mission_created", {
        actorKind: "human",
        actorId: context.actorId,
        fromStatus: null,
        toStatus: "draft",
      }));

      try {
        cos = await persistTransition(database, cos, {
          to: "planned", now: now(context), expectedVersion: cos.version,
        }, context, "mission_transitioned");
        const cosSwitches = await listStoredSwitches(database);
        assertSealedAdmission(cos, cosSwitches);
        cos = await persistTransition(database, cos, {
          to: "assigned", now: now(context), expectedVersion: cos.version, switches: pureSwitches(cosSwitches),
        }, context, "mission_transitioned");
        cos = await persistTransition(database, cos, {
          to: "running", now: now(context), expectedVersion: cos.version,
        }, context, "mission_started");
        cos = await checkpoint(database, cos, context, snapshot.operationalWatermark);
        if (cos.status !== "running") throw new Error(cos.closeReason === "stale_source" ? "CP_SOURCE_STALE" : "CP_KILL_SWITCH_ACTIVE");

        const currentWatermark = await readOperationalWatermark(database);
        const briefing = composeBriefing({
          missionId: cos.missionId,
          sourceOpsMissionId: ops.missionId,
          sourceOpsResultHash: opsResultHash,
          snapshotId: snapshot.snapshotId,
          operationalWatermark: snapshot.operationalWatermark,
          currentOperationalWatermark: currentWatermark,
          findings,
          coverage: evaluated.coverage,
          createdAt: now(context),
          logicalBudget: cos.logicalBudget,
        }) as UnknownRecord;
        if (briefing.state !== "current") {
          const code = briefing.invalidReason === "CP_SOURCE_STALE" ? "CP_SOURCE_STALE" : "CP_SOURCE_EMPTY";
          throw new Error(code);
        }
        const items = briefing.items as Array<Record<string, unknown>>;
        const itemHashes = new Map<string, { groupFingerprint: string; itemHash: string }>();
        for (const item of items) {
          itemHashes.set(String(item.briefingItemId), {
            groupFingerprint: await hash({ scopeKind: item.scopeKind, scopeId: item.scopeId }),
            itemHash: await hash(item),
          });
        }
        await storeBriefingItems(database, cos, items, findings, now(context), itemHashes);
        cos.logicalUsage = {
          sourceRows: 1,
          ruleEvaluations: 1,
          findings: findings.length,
          briefingItems: items.length,
          traceEntries: 6,
        };
        cos = await checkpoint(database, cos, context, snapshot.operationalWatermark);
        if (cos.status !== "running") throw new Error(cos.closeReason === "stale_source" ? "CP_SOURCE_STALE" : "CP_KILL_SWITCH_ACTIVE");
        const briefingHash = await hash(briefing);
        cos = await persistTransition(database, cos, {
          to: "completed",
          now: now(context),
          expectedVersion: cos.version,
          resultHash: briefingHash,
          resultKind: "cos_briefing",
        }, context, "mission_completed", {
          counts: {
            total: Number(briefing.totalCount),
            selected: items.length,
            omitted: Number(briefing.omittedCount),
          },
        });
        return {
          replayed: false,
          opsMission: missionDto(ops),
          cosMission: missionDto(cos),
          briefing: await briefingForMission(database, cos, ops),
          fixtureOnly: true,
          shadowMode: true,
        };
      } catch (error) {
        cos = await failMission(database, cos, error, context);
        throw error;
      }
    } catch (error) {
      ops = await failMission(database, ops, error, context);
      throw error;
    }
  });
}

const IN_FLIGHT_RUNS = new WeakMap<object, Map<string, {
  inputHash: string;
  promise: Promise<RunAgenticBriefingResult>;
}>>();

export async function runAgenticBriefing(
  database: D1Database,
  input: RunAgenticBriefingInput,
  context: AgenticExecutionContext,
): Promise<RunAgenticBriefingResult> {
  return guarded(async () => {
    assertContext(context);
    assertFixtureInput(input);
    let runs = IN_FLIGHT_RUNS.get(database as object);
    if (!runs) {
      runs = new Map();
      IN_FLIGHT_RUNS.set(database as object, runs);
    }
    const existing = runs.get(context.idempotencyKey);
    if (existing) {
      if (existing.inputHash !== context.inputHash) {
        throw new DomainError(409, "CP_IDEMPOTENCY_CONFLICT", "Clé déjà utilisée avec une autre commande.");
      }
      const result = await existing.promise;
      return { ...result, replayed: true };
    }
    const promise = executeAgenticBriefing(database, input, context);
    const owned = { inputHash: context.inputHash, promise };
    runs.set(context.idempotencyKey, owned);
    try {
      return await promise;
    } finally {
      if (runs.get(context.idempotencyKey) === owned) runs.delete(context.idempotencyKey);
    }
  });
}

export async function getCurrentAgenticBriefing(database: D1Database): Promise<AgenticBriefingDto> {
  return guarded(async () => {
    const ops = await latestOpsMission(database);
    const cos = ops ? await findCosMissionForOps(database, ops.missionId) : null;
    return briefingForMission(database, cos, ops);
  });
}

export async function getAgenticMission(database: D1Database, id: string): Promise<AgenticMissionDto> {
  return guarded(async () => {
    assertBoundedCode(id, "missionId");
    const mission = await findStoredMission(database, id);
    if (!mission) throw new DomainError(404, "CP_MISSION_NOT_FOUND", "Mission introuvable.");
    return missionDto(mission);
  });
}

export async function listAgenticMissionTrace(
  database: D1Database,
  id: string,
  options: { cursor?: number; limit?: number } = {},
): Promise<{ items: Array<Omit<Awaited<ReturnType<typeof listStoredTrace>>[number], "resultHash">>; nextCursor: number | null }> {
  return guarded(async () => {
    assertBoundedCode(id, "missionId");
    const cursor = Number.isSafeInteger(options.cursor) && Number(options.cursor) >= 0 ? Number(options.cursor) : 0;
    const limit = Number.isSafeInteger(options.limit) ? Math.min(100, Math.max(1, Number(options.limit))) : 50;
    if (!await findStoredMission(database, id)) throw new DomainError(404, "CP_MISSION_NOT_FOUND", "Mission introuvable.");
    const rows = await listStoredTrace(database, id, cursor, limit);
    const items = rows.map(({ resultHash: _resultHash, ...row }) => row);
    return { items, nextCursor: rows.length === limit ? rows.at(-1)!.sequenceNo : null };
  });
}

export async function cancelAgenticMission(
  database: D1Database,
  id: string,
  input: { reasonCode: string; expectedVersion: number },
  context: AgenticExecutionContext,
): Promise<AgenticMissionDto> {
  return guarded(async () => {
    assertContext(context);
    assertBoundedCode(id, "missionId");
    const reasonCode = assertBoundedCode(input.reasonCode, "reasonCode");
    if (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 1) {
      throw new DomainError(400, "CP_CONTRACT_INVALID", "expectedVersion doit être un entier positif explicite.");
    }
    const replay = await findTraceByIdempotency(database, context.idempotencyKey);
    if (replay) {
      if (replay.payloadHash !== context.inputHash) throw new DomainError(409, "CP_IDEMPOTENCY_CONFLICT", "Clé déjà utilisée.");
      const current = await findStoredMission(database, id);
      if (!current) throw new DomainError(404, "CP_MISSION_NOT_FOUND", "Mission introuvable.");
      return missionDto(current);
    }
    const mission = await findStoredMission(database, id);
    if (!mission) throw new DomainError(404, "CP_MISSION_NOT_FOUND", "Mission introuvable.");
    if (["completed", "failed", "cancelled"].includes(mission.status)) {
      throw new DomainError(409, "CP_CONTRACT_INVALID", "Une mission terminale ne peut pas être annulée à nouveau.");
    }
    const expectedVersion = input.expectedVersion;
    if (expectedVersion !== mission.version) throw new DomainError(409, "CP_VERSION_CONFLICT", "Version de mission obsolète.");
    const raw = cancelMission(mission as unknown as UnknownRecord, {
      now: now(context), expectedVersion, reasonCode, actorId: context.actorId,
    }) as UnknownRecord;
    const cancelled = normalizeMission(raw, mission);
    await updateStoredMission(database, mission.version, cancelled, trace(context, cancelled, "mission_cancelled", {
      actorKind: "human",
      actorId: context.actorId,
      fromStatus: mission.status,
      toStatus: "cancelled",
      reasonCode,
      payloadHash: context.inputHash,
      idempotencyKey: context.idempotencyKey,
    }));
    return missionDto(cancelled);
  });
}

export async function listAgenticSwitches(database: D1Database): Promise<AgenticSwitchDto[]> {
  return guarded(async () => {
    const stored = await listStoredSwitches(database);
    return EXPECTED_SWITCH_SCOPES.map(([scopeKind, scopeKey]) => {
      const row = stored.find((candidate) => candidate.scopeKind === scopeKind && candidate.scopeKey === scopeKey);
      return {
        scopeKind: scopeKind as AgenticSwitchDto["scopeKind"],
        scopeKey,
        effectiveState: row?.state ?? "stopped",
        present: Boolean(row),
        version: row?.version ?? 0,
        reasonCode: row?.reasonCode ?? null,
        decidedAt: row?.decidedAt ?? null,
        fixtureOnly: true,
        shadowMode: true,
      };
    });
  });
}

function validateSwitchScope(scope: { scopeKind: string; scopeKey: string }): asserts scope is {
  scopeKind: StoredSwitch["scopeKind"];
  scopeKey: string;
} {
  const valid = EXPECTED_SWITCH_SCOPES.some(([kind, key]) => kind === scope.scopeKind && key === scope.scopeKey);
  if (!valid) throw new DomainError(400, "CP_SCOPE_VIOLATION", "Portée de switch inconnue.");
}

export async function setAgenticSwitch(
  database: D1Database,
  scope: { scopeKind: "global" | "agent" | "capability"; scopeKey: string },
  input: {
    state: "enabled" | "stopped";
    reasonCode: string;
    expectedVersion: number;
    fixtureOnly: true;
    fixtureId: typeof AGENTIC_A1_FIXTURE_ID;
  },
  context: AgenticExecutionContext,
): Promise<AgenticSwitchDto> {
  return guarded(async () => {
    assertContext(context);
    assertFixtureInput(input);
    validateSwitchScope(scope);
    if (!['enabled', 'stopped'].includes(input.state)) throw new DomainError(400, "CP_CONTRACT_INVALID", "État de switch invalide.");
    const reasonCode = assertBoundedCode(input.reasonCode, "reasonCode");
    if (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 0) {
      throw new DomainError(400, "CP_CONTRACT_INVALID", "expectedVersion doit être un entier explicite supérieur ou égal à zéro.");
    }
    const replay = await findTraceByIdempotency(database, context.idempotencyKey);
    if (replay) {
      if (replay.payloadHash !== context.inputHash) throw new DomainError(409, "CP_IDEMPOTENCY_CONFLICT", "Clé déjà utilisée.");
      if (
        replay.streamKind !== "control_switch"
        || replay.entryKind !== "switch_applied"
        || !["enabled", "stopped"].includes(replay.outcomeCode ?? "")
      ) {
        throw new DomainError(409, "CP_IDEMPOTENCY_CONFLICT", "Clé déjà utilisée par une autre commande.");
      }
      const current = await findStoredSwitch(database, scope.scopeKind, scope.scopeKey);
      if (!current || current.id !== replay.streamId) {
        throw new DomainError(503, "CP_RECONCILIATION_REQUIRED", "Switch introuvable après replay.");
      }
      return {
        scopeKind: current.scopeKind,
        scopeKey: current.scopeKey,
        effectiveState: replay.outcomeCode as "enabled" | "stopped",
        present: true,
        version: replay.sequenceNo,
        reasonCode: replay.reasonCode,
        decidedAt: replay.occurredAt,
        fixtureOnly: true,
        shadowMode: true,
      };
    }
    const existing = await findStoredSwitch(database, scope.scopeKind, scope.scopeKey);
    if (existing && input.expectedVersion !== existing.version) {
      throw new DomainError(409, "CP_VERSION_CONFLICT", "Version de switch obsolète.");
    }
    if (!existing && input.expectedVersion !== 0) {
      throw new DomainError(409, "CP_VERSION_CONFLICT", "Le switch n'existe pas encore.");
    }
    const written = await writeStoredSwitch(database, existing, {
      scopeKind: scope.scopeKind,
      scopeKey: scope.scopeKey,
      state: input.state,
      reasonCode,
      actorId: context.actorId,
      now: now(context),
      idempotencyKey: context.idempotencyKey,
      payloadHash: context.inputHash,
    });
    if (input.state === "stopped") {
      const active = await listActiveMissionsForScope(database, scope);
      for (const mission of active) {
        const raw = cancelMission(mission as unknown as UnknownRecord, {
          now: now(context), expectedVersion: mission.version, reasonCode: "kill_switch", actorId: context.actorId,
        }) as UnknownRecord;
        const cancelled = normalizeMission(raw, mission);
        await updateStoredMission(database, mission.version, cancelled, trace(context, cancelled, "kill_switch_encountered", {
          actorKind: "human",
          actorId: context.actorId,
          fromStatus: mission.status,
          toStatus: "cancelled",
          reasonCode: "kill_switch",
        }));
        await appendMissionTrace(database, cancelled, trace(context, cancelled, "mission_cancelled", {
          fromStatus: mission.status,
          toStatus: "cancelled",
          reasonCode: "kill_switch",
        }));
      }
    }
    return {
      scopeKind: written.scopeKind,
      scopeKey: written.scopeKey,
      effectiveState: written.state,
      present: true,
      version: written.version,
      reasonCode: written.reasonCode,
      decidedAt: written.decidedAt,
      fixtureOnly: true,
      shadowMode: true,
    };
  });
}
