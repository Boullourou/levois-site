import type { D1Database, D1PreparedStatement, D1Result } from "@cloudflare/workers-types";
import { AGENTIC_WRITE_TABLES } from "../../agentic";
import { allRows, firstRow, newId } from "./db";

export const AGENTIC_STORE_WRITE_TABLES = AGENTIC_WRITE_TABLES;

export type AgenticEntryKind =
  | "mission_created"
  | "mission_started"
  | "snapshot_read"
  | "rule_evaluated"
  | "finding_produced"
  | "briefing_composed"
  | "mission_completed"
  | "error_recorded"
  | "kill_switch_encountered"
  | "mission_cancelled"
  | "switch_applied"
  | "mission_transitioned"
  | "logical_cost_recorded";

export type MissionStatus =
  | "draft"
  | "planned"
  | "assigned"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface StoredMission {
  missionId: string;
  missionType: "ops.shadow_scan.v1" | "cos.daily_briefing.v1";
  logicalAgent: "OPS-01" | "COS-01";
  capabilities: string[];
  contractVersion: "a1.v1";
  objectiveCode: string;
  objective: string;
  status: MissionStatus;
  priority: "low" | "normal" | "high" | "urgent";
  trigger: { kind: "manual"; ref: string; actorId: string };
  source: {
    kind: "fixture_request" | "ops_mission";
    ref: string;
    version: string;
    hash: string;
    operationalWatermark: string;
  };
  idempotencyKey: string;
  inputHash: string;
  correlationId: string;
  causationId: string;
  createdAt: string;
  plannedAt?: string;
  assignedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  timeoutAt: string;
  heartbeatAt?: string;
  attemptNo: 1;
  executionEpoch: number;
  restoreEpoch: number;
  controlFingerprint?: string;
  logicalBudget: Record<string, number>;
  logicalUsage: Record<string, number>;
  resultStatus: "pending" | "valid" | "invalid";
  resultKind?: "ops_findings" | "cos_briefing";
  resultHash?: string;
  resultTotalCount: number;
  resultSelectedCount: number;
  resultOmittedCount: number;
  closeReason?: string;
  errorCode?: string;
  errorStage?: string;
  policyVersion: string;
  autonomyLevel: "L0";
  fixtureOnly: true;
  version: number;
  snapshotId?: string;
  operationalWatermark?: string;
  asOf?: string;
  sourceHash?: string;
}

export interface StoredSwitch {
  id: string;
  scopeKind: "global" | "agent" | "capability";
  scopeKey: string;
  state: "enabled" | "stopped";
  version: number;
  restoreEpoch: number;
  reasonCode: string;
  decidedByActorId: string;
  decidedAt: string;
  fixtureOnly: true;
}

export interface StoredTrace {
  id: string;
  missionId: string | null;
  switchId: string | null;
  sequenceNo: number;
  occurredAt: string;
  correlationId: string;
  causationId: string | null;
  entryKind: AgenticEntryKind;
  fromStatus: string | null;
  toStatus: string | null;
  reasonCode: string | null;
  resultKind: string | null;
  resultRef: string | null;
  resultHash: string | null;
  logicalUsageDelta: Record<string, number>;
  errorCode: string | null;
  errorStage: string | null;
}

export interface TraceWrite {
  entryKind: AgenticEntryKind;
  occurredAt: string;
  actorKind?: "human" | "control_plane" | "logical_agent";
  actorId: string;
  agentId?: "OPS-01" | "COS-01";
  fromStatus?: string | null;
  toStatus?: string | null;
  reasonCode?: string | null;
  resultKind?: string | null;
  resultRef?: string | null;
  resultHash?: string | null;
  outcomeCode?: string | null;
  errorCode?: string | null;
  errorStage?: string | null;
  errorDetailCode?: string | null;
  logicalUsage?: Record<string, number>;
  payloadHash: string;
  idempotencyKey?: string;
  policyVersion: string;
  controlFingerprint?: string | null;
}

interface MissionRow {
  id: string;
  mission_type: StoredMission["missionType"];
  agent_id: StoredMission["logicalAgent"];
  capabilities_json: string;
  contract_version: "a1.v1";
  objective_code: string;
  objective: string;
  status: MissionStatus;
  priority: StoredMission["priority"];
  trigger_kind: "manual";
  trigger_ref: string;
  triggered_by_actor_id: string;
  source_kind: StoredMission["source"]["kind"];
  source_ref: string;
  source_version: string;
  source_hash: string | null;
  snapshot_id: string | null;
  operational_watermark: string | null;
  as_of: string | null;
  idempotency_key: string;
  input_hash: string;
  correlation_id: string;
  causation_id: string;
  created_at: string;
  planned_at: string | null;
  assigned_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  timeout_at: string;
  heartbeat_at: string | null;
  attempt_no: 1;
  execution_epoch: number;
  restore_epoch: number;
  control_fingerprint: string | null;
  logical_budget_json: string;
  logical_usage_json: string;
  result_status: StoredMission["resultStatus"];
  result_kind: StoredMission["resultKind"] | null;
  result_hash: string | null;
  result_total_count: number;
  result_selected_count: number;
  result_omitted_count: number;
  close_reason: string | null;
  error_code: string | null;
  error_stage: string | null;
  policy_version: string;
  autonomy_level: "L0";
  fixture_only: 1;
  version: number;
}

interface SwitchRow {
  id: string;
  scope_kind: StoredSwitch["scopeKind"];
  scope_key: string;
  state: StoredSwitch["state"];
  version: number;
  restore_epoch: number;
  reason_code: string;
  decided_by_actor_id: string;
  decided_at: string;
  fixture_only: 1;
}

function parseObject(value: string): Record<string, number> {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("CP_RECONCILIATION_REQUIRED");
  return parsed as Record<string, number>;
}

function missionFromRow(row: MissionRow): StoredMission {
  return {
    missionId: row.id,
    missionType: row.mission_type,
    logicalAgent: row.agent_id,
    capabilities: JSON.parse(row.capabilities_json) as string[],
    contractVersion: row.contract_version,
    objectiveCode: row.objective_code,
    objective: row.objective,
    status: row.status,
    priority: row.priority,
    trigger: { kind: row.trigger_kind, ref: row.trigger_ref, actorId: row.triggered_by_actor_id },
    source: {
      kind: row.source_kind,
      ref: row.source_ref,
      version: row.source_version,
      hash: row.source_hash ?? "sha256:pending-fixture-source",
      operationalWatermark: row.operational_watermark ?? "WM_PENDING_FIXTURE",
    },
    idempotencyKey: row.idempotency_key,
    inputHash: row.input_hash,
    correlationId: row.correlation_id,
    causationId: row.causation_id,
    createdAt: row.created_at,
    ...(row.planned_at ? { plannedAt: row.planned_at } : {}),
    ...(row.assigned_at ? { assignedAt: row.assigned_at } : {}),
    ...(row.started_at ? { startedAt: row.started_at } : {}),
    ...(row.finished_at ? { finishedAt: row.finished_at, completedAt: row.finished_at } : {}),
    timeoutAt: row.timeout_at,
    ...(row.heartbeat_at ? { heartbeatAt: row.heartbeat_at } : {}),
    attemptNo: 1,
    executionEpoch: Number(row.execution_epoch),
    restoreEpoch: Number(row.restore_epoch),
    ...(row.control_fingerprint ? { controlFingerprint: row.control_fingerprint } : {}),
    logicalBudget: parseObject(row.logical_budget_json),
    logicalUsage: parseObject(row.logical_usage_json),
    resultStatus: row.result_status,
    ...(row.result_kind ? { resultKind: row.result_kind } : {}),
    ...(row.result_hash ? { resultHash: row.result_hash } : {}),
    resultTotalCount: Number(row.result_total_count),
    resultSelectedCount: Number(row.result_selected_count),
    resultOmittedCount: Number(row.result_omitted_count),
    ...(row.close_reason ? { closeReason: row.close_reason } : {}),
    ...(row.error_code ? { errorCode: row.error_code } : {}),
    ...(row.error_stage ? { errorStage: row.error_stage } : {}),
    policyVersion: row.policy_version,
    autonomyLevel: "L0",
    fixtureOnly: true,
    version: Number(row.version),
    ...(row.snapshot_id ? { snapshotId: row.snapshot_id } : {}),
    ...(row.operational_watermark ? { operationalWatermark: row.operational_watermark } : {}),
    ...(row.as_of ? { asOf: row.as_of } : {}),
    ...(row.source_hash ? { sourceHash: row.source_hash } : {}),
  };
}

function switchFromRow(row: SwitchRow): StoredSwitch {
  return {
    id: row.id,
    scopeKind: row.scope_kind,
    scopeKey: row.scope_key,
    state: row.state,
    version: Number(row.version),
    restoreEpoch: Number(row.restore_epoch),
    reasonCode: row.reason_code,
    decidedByActorId: row.decided_by_actor_id,
    decidedAt: row.decided_at,
    fixtureOnly: true,
  };
}

function traceStatement(
  database: D1Database,
  input: TraceWrite & {
    streamKind: "mission" | "control_switch";
    streamId: string;
    missionId?: string | null;
    switchId?: string | null;
    sequenceNo: number;
    correlationId: string;
    causationId?: string | null;
    restoreEpoch: number;
    executionEpoch?: number | null;
    onlyIfPreviousStatementChanged?: boolean;
  },
): D1PreparedStatement {
  const id = newId("atrace");
  const valuesClause = input.onlyIfPreviousStatementChanged
    ? "SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE changes() = 1"
    : "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  return database.prepare(`
    INSERT INTO agent_trace (
      id, stream_kind, stream_id, sequence_no, mission_id, switch_id,
      occurred_at, correlation_id, causation_id,
      actor_kind, actor_id, agent_id, entry_kind,
      attempt_no, execution_epoch, restore_epoch,
      from_status, to_status, reason_code,
      idempotency_key, payload_hash,
      result_kind, result_ref, result_hash, outcome_code,
      logical_usage_delta_json, error_code, error_stage, error_detail_code,
      policy_version, control_fingerprint, redaction_version
    ) ${valuesClause}
  `).bind(
    id,
    input.streamKind,
    input.streamId,
    input.sequenceNo,
    input.missionId ?? null,
    input.switchId ?? null,
    input.occurredAt,
    input.correlationId,
    input.causationId ?? null,
    input.actorKind ?? "control_plane",
    input.actorId,
    input.agentId ?? null,
    input.entryKind,
    input.streamKind === "mission" ? 1 : null,
    input.executionEpoch ?? null,
    input.restoreEpoch,
    input.fromStatus ?? null,
    input.toStatus ?? null,
    input.reasonCode ?? null,
    input.idempotencyKey ?? `${input.streamId}:${input.sequenceNo}:${input.entryKind}`,
    input.payloadHash,
    input.resultKind ?? null,
    input.resultRef ?? null,
    input.resultHash ?? null,
    input.outcomeCode ?? null,
    JSON.stringify(input.logicalUsage ?? {}),
    input.errorCode ?? null,
    input.errorStage ?? null,
    input.errorDetailCode ?? null,
    input.policyVersion,
    input.controlFingerprint ?? null,
    "redaction-a1.v1",
  );
}

function changes(result: D1Result<unknown> | undefined): number {
  return Number(result?.meta?.changes ?? 0);
}

async function nextSequence(database: D1Database, streamKind: string, streamId: string): Promise<number> {
  const row = await firstRow<{ next_sequence: number }>(database.prepare(`
    SELECT coalesce(max(sequence_no), 0) + 1 AS next_sequence
    FROM agent_trace
    WHERE stream_kind = ? AND stream_id = ?
  `).bind(streamKind, streamId));
  return Number(row?.next_sequence ?? 1);
}

export async function findStoredMission(database: D1Database, id: string): Promise<StoredMission | null> {
  const row = await firstRow<MissionRow>(database.prepare(`
    SELECT * FROM agent_mission WHERE id = ?
  `).bind(id));
  return row ? missionFromRow(row) : null;
}

export async function findStoredMissionByIdempotency(
  database: D1Database,
  idempotencyKey: string,
): Promise<StoredMission | null> {
  const row = await firstRow<MissionRow>(database.prepare(`
    SELECT * FROM agent_mission WHERE idempotency_key = ?
  `).bind(idempotencyKey));
  return row ? missionFromRow(row) : null;
}

export async function findCosMissionForOps(database: D1Database, opsMissionId: string): Promise<StoredMission | null> {
  const row = await firstRow<MissionRow>(database.prepare(`
    SELECT *
    FROM agent_mission
    WHERE mission_type = 'cos.daily_briefing.v1' AND source_ref = ?
    ORDER BY created_at DESC, rowid DESC
    LIMIT 1
  `).bind(opsMissionId));
  return row ? missionFromRow(row) : null;
}

export async function createStoredMission(
  database: D1Database,
  mission: StoredMission,
  trace: TraceWrite,
): Promise<void> {
  const sourceHash = mission.sourceHash ?? mission.source.hash;
  const sequenceNo = 1;
  const results = await database.batch([
    database.prepare(`
      INSERT INTO agent_mission (
        id, mission_type, agent_id, capabilities_json, objective_code, objective,
        status, priority, trigger_kind, trigger_ref, triggered_by_actor_id,
        source_kind, source_ref, source_version, source_hash,
        snapshot_id, operational_watermark, as_of,
        idempotency_key, input_hash, correlation_id, causation_id,
        created_at, timeout_at, attempt_no, execution_epoch, restore_epoch, control_fingerprint,
        logical_budget_json, logical_usage_json,
        policy_version, autonomy_level, fixture_only, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      mission.missionId,
      mission.missionType,
      mission.logicalAgent,
      JSON.stringify(mission.capabilities),
      mission.objectiveCode,
      mission.objective,
      mission.status,
      mission.priority,
      mission.trigger.kind,
      mission.trigger.ref,
      mission.trigger.actorId,
      mission.source.kind,
      mission.source.ref,
      mission.source.version,
      sourceHash,
      mission.snapshotId ?? null,
      mission.operationalWatermark ?? null,
      mission.asOf ?? null,
      mission.idempotencyKey,
      mission.inputHash,
      mission.correlationId,
      mission.causationId,
      mission.createdAt,
      mission.timeoutAt,
      1,
      mission.executionEpoch,
      mission.restoreEpoch,
      mission.controlFingerprint ?? null,
      JSON.stringify(mission.logicalBudget),
      JSON.stringify(mission.logicalUsage ?? {}),
      mission.policyVersion,
      "L0",
      1,
      mission.version,
    ),
    traceStatement(database, {
      ...trace,
      streamKind: "mission",
      streamId: mission.missionId,
      missionId: mission.missionId,
      sequenceNo,
      correlationId: mission.correlationId,
      causationId: mission.causationId,
      restoreEpoch: mission.restoreEpoch,
      executionEpoch: mission.executionEpoch,
      agentId: mission.logicalAgent,
      onlyIfPreviousStatementChanged: true,
    }),
  ]);
  if (changes(results[0]) !== 1 || changes(results[1]) !== 1) throw new Error("CP_RECONCILIATION_REQUIRED");
}

export async function updateStoredMission(
  database: D1Database,
  previousVersion: number,
  mission: StoredMission,
  trace: TraceWrite,
): Promise<void> {
  const sequenceNo = await nextSequence(database, "mission", mission.missionId);
  const results = await database.batch([
    database.prepare(`
      UPDATE agent_mission
      SET status = ?, close_reason = ?, planned_at = ?, assigned_at = ?, started_at = ?,
          finished_at = ?, heartbeat_at = ?, source_hash = ?, snapshot_id = ?,
          operational_watermark = ?, as_of = ?, execution_epoch = ?, restore_epoch = ?,
          control_fingerprint = ?, logical_usage_json = ?, result_status = ?,
          result_kind = ?, result_schema_version = ?, result_hash = ?,
          result_total_count = ?, result_selected_count = ?, result_omitted_count = ?,
          error_status = ?, error_code = ?, error_stage = ?, error_detail_code = ?, version = ?
      WHERE id = ? AND version = ?
    `).bind(
      mission.status,
      mission.closeReason ?? null,
      mission.plannedAt ?? null,
      mission.assignedAt ?? null,
      mission.startedAt ?? null,
      mission.finishedAt ?? null,
      mission.heartbeatAt ?? null,
      mission.sourceHash ?? mission.source.hash,
      mission.snapshotId ?? null,
      mission.operationalWatermark ?? null,
      mission.asOf ?? null,
      mission.executionEpoch,
      mission.restoreEpoch,
      mission.controlFingerprint ?? null,
      JSON.stringify(mission.logicalUsage ?? {}),
      mission.resultStatus,
      mission.resultKind ?? null,
      mission.status === "completed" ? 1 : null,
      mission.resultHash ?? null,
      mission.resultTotalCount,
      mission.resultSelectedCount,
      mission.resultOmittedCount,
      mission.status === "failed" ? "error" : "none",
      mission.errorCode ?? null,
      mission.errorStage ?? null,
      null,
      mission.version,
      mission.missionId,
      previousVersion,
    ),
    traceStatement(database, {
      ...trace,
      streamKind: "mission",
      streamId: mission.missionId,
      missionId: mission.missionId,
      sequenceNo,
      correlationId: mission.correlationId,
      causationId: mission.causationId,
      restoreEpoch: mission.restoreEpoch,
      executionEpoch: mission.executionEpoch,
      agentId: mission.logicalAgent,
      onlyIfPreviousStatementChanged: true,
    }),
  ]);
  if (changes(results[0]) !== 1 || changes(results[1]) !== 1) throw new Error("CP_VERSION_CONFLICT");
}

export async function appendMissionTrace(
  database: D1Database,
  mission: StoredMission,
  trace: TraceWrite,
): Promise<void> {
  const sequenceNo = await nextSequence(database, "mission", mission.missionId);
  const result = await traceStatement(database, {
    ...trace,
    streamKind: "mission",
    streamId: mission.missionId,
    missionId: mission.missionId,
    sequenceNo,
    correlationId: mission.correlationId,
    causationId: mission.causationId,
    restoreEpoch: mission.restoreEpoch,
    executionEpoch: mission.executionEpoch,
    agentId: mission.logicalAgent,
  }).run();
  if (changes(result) !== 1) throw new Error("CP_RECONCILIATION_REQUIRED");
}

const EVIDENCE_CODES: Record<string, string> = {
  "OPS-PROJECT-NEXT-ACTION-001": "NO_OPEN_NEXT_ACTION",
  "OPS-TASK-OVERDUE-002": "OPEN_TASK_PAST_DUE",
  "OPS-PROMISE-DUE-003": "STRUCTURED_PROMISE_DUE",
  "OPS-TIM-NEXT-ACTION-005": "OPEN_TIM_NO_NEXT_ACTION",
  "OPS-TIM-DEADLINE-NEAR-006": "STRUCTURED_TIM_DEADLINE",
  "OPS-INCONSISTENCY-007": "OPEN_NEXT_ACTION_ON_TERMINAL_SCOPE",
};

export async function storeOpsResult(
  database: D1Database,
  mission: StoredMission,
  input: {
    findings: Array<Record<string, unknown>>;
    coverage: Array<Record<string, unknown>>;
    asOf: string;
    now: string;
    sourceRowCount: number;
  },
): Promise<void> {
  let sequenceNo = await nextSequence(database, "mission", mission.missionId);
  const statements: D1PreparedStatement[] = [];
  for (const coverage of input.coverage) {
    const ruleId = String(coverage.ruleId);
    statements.push(traceStatement(database, {
      streamKind: "mission",
      streamId: mission.missionId,
      missionId: mission.missionId,
      sequenceNo: sequenceNo++,
      correlationId: mission.correlationId,
      causationId: mission.causationId,
      restoreEpoch: mission.restoreEpoch,
      executionEpoch: mission.executionEpoch,
      entryKind: "rule_evaluated",
      occurredAt: input.now,
      actorKind: "logical_agent",
      actorId: mission.logicalAgent,
      agentId: mission.logicalAgent,
      reasonCode: String(coverage.evaluationStatus),
      resultKind: "ops_rule_coverage",
      resultRef: ruleId,
      resultHash: `${mission.sourceHash ?? mission.source.hash}:${ruleId}:${String(coverage.findingCount ?? 0)}`,
      logicalUsage: { ruleEvaluations: input.sourceRowCount, traceEntries: 1 },
      payloadHash: `${mission.inputHash}:${ruleId}:coverage`,
      policyVersion: mission.policyVersion,
      controlFingerprint: mission.controlFingerprint,
    }));
  }
  for (const finding of input.findings) {
    const ruleId = String(finding.ruleId);
    const findingId = String(finding.findingId);
    const fingerprint = String(finding.observationFingerprint);
    statements.push(database.prepare(`
      INSERT INTO agent_ops_shadow_finding (
        id, mission_id, observation_fingerprint, rule_id, rule_version,
        reason_code, reason_template_version, scope_kind, scope_id, subject_id,
        link_kind, link_ref, source_ref, source_version,
        snapshot_id, operational_watermark, source_hash, source_freshness,
        observed_at, as_of, due_at, proposed_priority,
        suggested_human_action_code, suggested_action_template_version,
        evidence_code, evidence_hash, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 1)
    `).bind(
      findingId,
      mission.missionId,
      fingerprint,
      ruleId,
      Number(finding.ruleVersion),
      String(finding.reasonCode),
      String(finding.scopeKind),
      String(finding.scopeId),
      finding.subjectId == null ? null : String(finding.subjectId),
      finding.linkKind == null ? null : String(finding.linkKind),
      finding.linkRef == null ? null : String(finding.linkRef),
      String(finding.sourceRef),
      Number(finding.sourceVersion),
      String(finding.snapshotId),
      String(finding.operationalWatermark),
      String(finding.sourceHash),
      "current_at_observation",
      String(finding.observedAt),
      input.asOf,
      finding.dueAt == null ? null : String(finding.dueAt),
      String(finding.proposedPriority),
      String(finding.suggestedActionCode),
      EVIDENCE_CODES[ruleId],
      `${String(finding.sourceHash)}:${fingerprint}`,
    ));
    statements.push(traceStatement(database, {
      streamKind: "mission",
      streamId: mission.missionId,
      missionId: mission.missionId,
      sequenceNo: sequenceNo++,
      correlationId: mission.correlationId,
      causationId: mission.causationId,
      restoreEpoch: mission.restoreEpoch,
      executionEpoch: mission.executionEpoch,
      entryKind: "finding_produced",
      occurredAt: input.now,
      actorKind: "logical_agent",
      actorId: mission.logicalAgent,
      agentId: mission.logicalAgent,
      reasonCode: String(finding.reasonCode),
      resultKind: "ops_finding",
      resultRef: findingId,
      resultHash: fingerprint,
      logicalUsage: { findings: 1, traceEntries: 1 },
      payloadHash: `${mission.inputHash}:${fingerprint}`,
      policyVersion: mission.policyVersion,
      controlFingerprint: mission.controlFingerprint,
    }));
  }
  if (statements.length === 0) return;
  const results = await database.batch(statements);
  if (results.some((result) => changes(result) !== 1)) throw new Error("CP_RECONCILIATION_REQUIRED");
}

export async function listOpsFindings(database: D1Database, missionId: string): Promise<Array<Record<string, unknown>>> {
  const rows = await allRows<Record<string, unknown>>(database.prepare(`
    SELECT id, observation_fingerprint, rule_id, rule_version,
           scope_kind, scope_id, subject_id, link_kind, link_ref,
           reason_code, proposed_priority, suggested_human_action_code,
           source_ref, source_version, snapshot_id, operational_watermark,
           source_hash, observed_at, due_at
    FROM agent_ops_shadow_finding
    WHERE mission_id = ?
    ORDER BY observation_fingerprint
  `).bind(missionId));
  return rows.map((row) => ({
    findingId: row.id,
    missionId,
    observationFingerprint: row.observation_fingerprint,
    ruleId: row.rule_id,
    ruleVersion: String(row.rule_version),
    scopeKind: row.scope_kind,
    scopeId: row.scope_id,
    subjectId: row.subject_id,
    linkKind: row.link_kind,
    linkRef: row.link_ref,
    reasonCode: row.reason_code,
    proposedPriority: row.proposed_priority,
    suggestedActionCode: row.suggested_human_action_code,
    sourceRef: row.source_ref,
    sourceVersion: Number(row.source_version),
    snapshotId: row.snapshot_id,
    operationalWatermark: row.operational_watermark,
    sourceHash: row.source_hash,
    observedAt: row.observed_at,
    dueAt: row.due_at,
  }));
}

export async function storeBriefingItems(
  database: D1Database,
  mission: StoredMission,
  items: Array<Record<string, unknown>>,
  findings: Array<Record<string, unknown>>,
  now: string,
  itemHashes: Map<string, { groupFingerprint: string; itemHash: string }>,
): Promise<void> {
  let sequenceNo = await nextSequence(database, "mission", mission.missionId);
  const statements: D1PreparedStatement[] = [];
  for (const item of items) {
    const refs = item.findingRefs as string[];
    const primary = findings.find((finding) =>
      finding.scopeKind === item.scopeKind
      && finding.scopeId === item.scopeId
      && finding.ruleId === item.primaryRuleId
      && finding.reasonCode === item.reasonCode,
    );
    if (!primary) throw new Error("CP_RESULT_INVALID");
    const hashes = itemHashes.get(String(item.briefingItemId));
    if (!hashes) throw new Error("CP_RESULT_INVALID");
    const source = item.source as Record<string, unknown>;
    statements.push(database.prepare(`
      INSERT INTO agent_cos_briefing_item (
        id, mission_id, source_ops_mission_id, rank, group_fingerprint,
        scope_kind, scope_id, finding_refs_json,
        priority_bucket, due_at, source_priority, tie_breaker,
        primary_rule_id, why_now_code, explanation_template_version,
        suggested_human_action_code, suggested_action_template_version,
        snapshot_id, operational_watermark, source_result_hash,
        created_at, schema_version, item_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1, ?, ?, ?, ?, 1, ?)
    `).bind(
      String(item.briefingItemId),
      mission.missionId,
      String(source.sourceOpsMissionId),
      Number(item.rank),
      hashes.groupFingerprint,
      String(item.scopeKind),
      String(item.scopeId),
      JSON.stringify(refs),
      String(primary.proposedPriority),
      primary.dueAt == null ? null : String(primary.dueAt),
      String(primary.proposedPriority),
      `${String(primary.observedAt)}:${String(item.scopeKind)}:${String(item.scopeId)}:${String(primary.observationFingerprint)}`,
      String(item.primaryRuleId),
      String(item.reasonCode),
      String(item.suggestedActionCode),
      String(source.snapshotId),
      String(source.operationalWatermark),
      String(source.sourceOpsResultHash),
      now,
      hashes.itemHash,
    ));
  }
  statements.push(traceStatement(database, {
    streamKind: "mission",
    streamId: mission.missionId,
    missionId: mission.missionId,
    sequenceNo,
    correlationId: mission.correlationId,
    causationId: mission.causationId,
    restoreEpoch: mission.restoreEpoch,
    executionEpoch: mission.executionEpoch,
    entryKind: "briefing_composed",
    occurredAt: now,
    actorKind: "logical_agent",
    actorId: mission.logicalAgent,
    agentId: mission.logicalAgent,
    resultKind: "cos_briefing",
    resultRef: mission.missionId,
    resultHash: `${mission.inputHash}:briefing:${items.length}`,
    logicalUsage: { briefingItems: items.length, traceEntries: 1 },
    payloadHash: `${mission.inputHash}:briefing-composed`,
    policyVersion: mission.policyVersion,
    controlFingerprint: mission.controlFingerprint,
  }));
  const results = await database.batch(statements);
  if (results.some((result) => changes(result) !== 1)) throw new Error("CP_RECONCILIATION_REQUIRED");
}

export async function listStoredSwitches(database: D1Database): Promise<StoredSwitch[]> {
  const rows = await allRows<SwitchRow>(database.prepare(`
    SELECT id, scope_kind, scope_key, state, version, restore_epoch,
           reason_code, decided_by_actor_id, decided_at, fixture_only
    FROM agent_control_switch
    ORDER BY scope_kind, scope_key
  `));
  return rows.map(switchFromRow);
}

export async function findStoredSwitch(
  database: D1Database,
  scopeKind: StoredSwitch["scopeKind"],
  scopeKey: string,
): Promise<StoredSwitch | null> {
  const row = await firstRow<SwitchRow>(database.prepare(`
    SELECT id, scope_kind, scope_key, state, version, restore_epoch,
           reason_code, decided_by_actor_id, decided_at, fixture_only
    FROM agent_control_switch
    WHERE scope_kind = ? AND scope_key = ?
  `).bind(scopeKind, scopeKey));
  return row ? switchFromRow(row) : null;
}

export async function findTraceByIdempotency(database: D1Database, key: string): Promise<{
  payloadHash: string;
  streamKind: "mission" | "control_switch";
  streamId: string;
  sequenceNo: number;
  entryKind: AgenticEntryKind;
  occurredAt: string;
  reasonCode: string | null;
  outcomeCode: string | null;
} | null> {
  const row = await firstRow<{
    payload_hash: string;
    stream_kind: "mission" | "control_switch";
    stream_id: string;
    sequence_no: number;
    entry_kind: AgenticEntryKind;
    occurred_at: string;
    reason_code: string | null;
    outcome_code: string | null;
  }>(database.prepare(`
    SELECT payload_hash, stream_kind, stream_id, sequence_no, entry_kind,
           occurred_at, reason_code, outcome_code
    FROM agent_trace
    WHERE idempotency_key = ?
  `).bind(key));
  return row ? {
    payloadHash: row.payload_hash,
    streamKind: row.stream_kind,
    streamId: row.stream_id,
    sequenceNo: Number(row.sequence_no),
    entryKind: row.entry_kind,
    occurredAt: row.occurred_at,
    reasonCode: row.reason_code,
    outcomeCode: row.outcome_code,
  } : null;
}

export async function writeStoredSwitch(
  database: D1Database,
  existing: StoredSwitch | null,
  input: {
    scopeKind: StoredSwitch["scopeKind"];
    scopeKey: string;
    state: StoredSwitch["state"];
    reasonCode: string;
    actorId: string;
    now: string;
    idempotencyKey: string;
    payloadHash: string;
  },
): Promise<StoredSwitch> {
  const id = existing?.id ?? newId("aswitch");
  const version = (existing?.version ?? 0) + 1;
  const restoreEpoch = existing?.restoreEpoch ?? 1;
  const sequenceNo = await nextSequence(database, "control_switch", id);
  const write = existing
    ? database.prepare(`
        UPDATE agent_control_switch
        SET state = ?, version = ?, reason_code = ?, decided_by_actor_id = ?,
            decided_at = ?, idempotency_key = ?, payload_hash = ?
        WHERE id = ? AND version = ?
      `).bind(
        input.state, version, input.reasonCode, input.actorId, input.now,
        input.idempotencyKey, input.payloadHash, id, existing.version,
      )
    : database.prepare(`
        INSERT INTO agent_control_switch (
          id, scope_kind, scope_key, state, version, restore_epoch,
          reason_code, decided_by_actor_id, decided_at,
          idempotency_key, payload_hash, fixture_only
        ) VALUES (?, ?, ?, ?, 1, 1, ?, ?, ?, ?, ?, 1)
      `).bind(
        id, input.scopeKind, input.scopeKey, input.state, input.reasonCode,
        input.actorId, input.now, input.idempotencyKey, input.payloadHash,
      );
  const results = await database.batch([
    write,
    traceStatement(database, {
      streamKind: "control_switch",
      streamId: id,
      switchId: id,
      sequenceNo,
      correlationId: `SWITCH-${id}`,
      restoreEpoch,
      entryKind: "switch_applied",
      occurredAt: input.now,
      actorKind: "human",
      actorId: input.actorId,
      reasonCode: input.reasonCode,
      resultKind: "control_switch",
      resultRef: id,
      resultHash: input.payloadHash,
      outcomeCode: input.state,
      payloadHash: input.payloadHash,
      idempotencyKey: input.idempotencyKey,
      policyVersion: "policy-a1.v1",
      onlyIfPreviousStatementChanged: true,
    }),
  ]);
  if (changes(results[0]) !== 1 || changes(results[1]) !== 1) throw new Error("CP_VERSION_CONFLICT");
  return {
    id,
    scopeKind: input.scopeKind,
    scopeKey: input.scopeKey,
    state: input.state,
    version,
    restoreEpoch,
    reasonCode: input.reasonCode,
    decidedByActorId: input.actorId,
    decidedAt: input.now,
    fixtureOnly: true,
  };
}

export async function listActiveMissionsForScope(
  database: D1Database,
  scope: { scopeKind: StoredSwitch["scopeKind"]; scopeKey: string },
): Promise<StoredMission[]> {
  let sql = `SELECT * FROM agent_mission WHERE status NOT IN ('completed', 'failed', 'cancelled')`;
  const bindings: string[] = [];
  if (scope.scopeKind === "agent") {
    sql += " AND agent_id = ?";
    bindings.push(scope.scopeKey);
  } else if (scope.scopeKind === "capability") {
    sql += " AND capabilities_json LIKE ?";
    bindings.push(`%\"${scope.scopeKey}\"%`);
  }
  sql += " ORDER BY created_at, id";
  const statement = bindings.length ? database.prepare(sql).bind(...bindings) : database.prepare(sql);
  return (await allRows<MissionRow>(statement)).map(missionFromRow);
}

export async function listStoredTrace(
  database: D1Database,
  missionId: string,
  cursor: number,
  limit: number,
): Promise<StoredTrace[]> {
  const rows = await allRows<Record<string, unknown>>(database.prepare(`
    SELECT id, mission_id, switch_id, sequence_no, occurred_at,
           correlation_id, causation_id, entry_kind,
           from_status, to_status, reason_code, result_kind, result_ref,
           result_hash, logical_usage_delta_json, error_code, error_stage
    FROM agent_trace
    WHERE stream_kind = 'mission' AND mission_id = ? AND sequence_no > ?
    ORDER BY sequence_no
    LIMIT ?
  `).bind(missionId, cursor, limit));
  return rows.map((row) => ({
    id: String(row.id),
    missionId: row.mission_id == null ? null : String(row.mission_id),
    switchId: row.switch_id == null ? null : String(row.switch_id),
    sequenceNo: Number(row.sequence_no),
    occurredAt: String(row.occurred_at),
    correlationId: String(row.correlation_id),
    causationId: row.causation_id == null ? null : String(row.causation_id),
    entryKind: String(row.entry_kind) as AgenticEntryKind,
    fromStatus: row.from_status == null ? null : String(row.from_status),
    toStatus: row.to_status == null ? null : String(row.to_status),
    reasonCode: row.reason_code == null ? null : String(row.reason_code),
    resultKind: row.result_kind == null ? null : String(row.result_kind),
    resultRef: row.result_ref == null ? null : String(row.result_ref),
    resultHash: row.result_hash == null ? null : String(row.result_hash),
    logicalUsageDelta: parseObject(String(row.logical_usage_delta_json)),
    errorCode: row.error_code == null ? null : String(row.error_code),
    errorStage: row.error_stage == null ? null : String(row.error_stage),
  }));
}

export async function latestCosMission(database: D1Database): Promise<StoredMission | null> {
  const row = await firstRow<MissionRow>(database.prepare(`
    SELECT * FROM agent_mission
    WHERE mission_type = 'cos.daily_briefing.v1'
    ORDER BY created_at DESC, rowid DESC
    LIMIT 1
  `));
  return row ? missionFromRow(row) : null;
}

export async function latestOpsMission(database: D1Database): Promise<StoredMission | null> {
  const row = await firstRow<MissionRow>(database.prepare(`
    SELECT * FROM agent_mission
    WHERE mission_type = 'ops.shadow_scan.v1'
    ORDER BY created_at DESC, rowid DESC
    LIMIT 1
  `));
  return row ? missionFromRow(row) : null;
}

export async function storedBriefingItems(database: D1Database, missionId: string): Promise<Array<Record<string, unknown>>> {
  const rows = await allRows<Record<string, unknown>>(database.prepare(`
    SELECT id, source_ops_mission_id, rank, scope_kind, scope_id, finding_refs_json,
           priority_bucket, due_at, primary_rule_id, why_now_code,
           suggested_human_action_code, snapshot_id, operational_watermark,
           source_result_hash, created_at
    FROM agent_cos_briefing_item
    WHERE mission_id = ?
    ORDER BY rank
  `).bind(missionId));
  return rows.map((row) => ({
    briefingItemId: row.id,
    sourceOpsMissionId: row.source_ops_mission_id,
    rank: Number(row.rank),
    scopeKind: row.scope_kind,
    scopeId: row.scope_id,
    findingRefs: JSON.parse(String(row.finding_refs_json)) as string[],
    priority: row.priority_bucket,
    dueAt: row.due_at,
    primaryRuleId: row.primary_rule_id,
    reasonCode: row.why_now_code,
    suggestedActionCode: row.suggested_human_action_code,
    snapshotId: row.snapshot_id,
    operationalWatermark: row.operational_watermark,
    sourceResultHash: row.source_result_hash,
    createdAt: row.created_at,
  }));
}
