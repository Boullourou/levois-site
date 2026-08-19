/**
 * Phase A1 fixtures are deliberately structural and fictional.
 *
 * No label, free-form client text, contact detail, address, amount or external
 * reference is allowed in this file. Production code must receive the same
 * minimized projection.
 */

export const AS_OF = "2026-08-19T08:00:00.000Z";
export const FUTURE = "2026-08-21T08:00:00.000Z";
export const OVERDUE = "2026-08-17T08:00:00.000Z";
export const TIM_WINDOW_END = "2026-08-26T08:00:00.000Z";

export type FixtureProjectStatus =
  | "new"
  | "qualifying"
  | "active"
  | "paused"
  | "completed"
  | "abandoned"
  | "archived";

export type FixtureTaskStatus = "open" | "in_progress" | "waiting" | "completed" | "cancelled";
export type FixtureTimStatus =
  | "to_formalize"
  | "signed"
  | "omega_uploaded"
  | "active"
  | "cancelled"
  | "closed";

export type OpsSnapshotFixture = {
  schemaVersion: "ops-snapshot.v1";
  snapshotId: string;
  fixtureOnly: true;
  asOf: string;
  operationalWatermark: string;
  sourceHash: string;
  coverage: {
    projects: "complete" | "incomplete";
    tasks: "complete" | "incomplete";
    promises: "complete" | "incomplete";
    intake: "canonical_signal_absent";
    timAgreements: "complete" | "incomplete";
    timDeadlines: "complete" | "incomplete";
  };
  projects: Array<{
    projectId: string;
    status: FixtureProjectStatus;
    stage: string;
    version: number;
  }>;
  tasks: Array<{
    taskId: string;
    projectId?: string;
    timId?: string;
    status: FixtureTaskStatus;
    dueAt: string | null;
    sourcePriority: "low" | "normal" | "high" | "urgent";
    isNextAction: boolean;
    promisedFromInteractionId?: string;
    timDeadlineId?: string;
    version: number;
  }>;
  promises: Array<{
    promiseId: string;
    projectId: string;
    dueAt: string;
    fulfilled: boolean;
    sourcePriority: "normal" | "high" | "urgent";
    linkedTaskId?: string;
    version: number;
  }>;
  timAgreements: Array<{
    timId: string;
    agreementStatus: FixtureTimStatus;
    operationStatus: string | null;
    version: number;
  }>;
  timDeadlines: Array<{
    deadlineId: string;
    timId: string;
    kind: "follow_up" | "payment_check" | "mandate_check";
    dueAt: string;
    status: "open" | "completed" | "cancelled";
    linkedTaskId?: string;
    version: number;
  }>;
};

export function snapshotFixture(overrides: Partial<OpsSnapshotFixture> = {}): OpsSnapshotFixture {
  return {
    schemaVersion: "ops-snapshot.v1",
    snapshotId: "SNAP-FX-001",
    fixtureOnly: true,
    asOf: AS_OF,
    operationalWatermark: "WM-FX-001",
    sourceHash: "sha256:fixture-source-001",
    coverage: {
      projects: "complete",
      tasks: "complete",
      promises: "complete",
      intake: "canonical_signal_absent",
      timAgreements: "complete",
      timDeadlines: "complete",
    },
    projects: [],
    tasks: [],
    promises: [],
    timAgreements: [],
    timDeadlines: [],
    ...overrides,
  };
}

export const CASE_A_PROJECT_WITHOUT_NEXT_ACTION = snapshotFixture({
  snapshotId: "SNAP-FX-A",
  operationalWatermark: "WM-FX-A",
  sourceHash: "sha256:fixture-a",
  projects: [{ projectId: "PRJ-FX-A", status: "active", stage: "qualification", version: 1 }],
});

export const CASE_B_PROJECT_WITH_FUTURE_ACTION = snapshotFixture({
  snapshotId: "SNAP-FX-B",
  operationalWatermark: "WM-FX-B",
  sourceHash: "sha256:fixture-b",
  projects: [{ projectId: "PRJ-FX-B", status: "active", stage: "search_active", version: 1 }],
  tasks: [{
    taskId: "TSK-FX-B",
    projectId: "PRJ-FX-B",
    status: "open",
    dueAt: FUTURE,
    sourcePriority: "normal",
    isNextAction: true,
    version: 1,
  }],
});

export const CASE_C_OVERDUE_TASK = snapshotFixture({
  snapshotId: "SNAP-FX-C",
  operationalWatermark: "WM-FX-C",
  sourceHash: "sha256:fixture-c",
  projects: [{ projectId: "PRJ-FX-C", status: "active", stage: "qualification", version: 1 }],
  tasks: [{
    taskId: "TSK-FX-C",
    projectId: "PRJ-FX-C",
    status: "open",
    dueAt: OVERDUE,
    sourcePriority: "normal",
    isNextAction: true,
    version: 1,
  }],
});

export const CASE_D_COMPLETED_OLD_TASK = snapshotFixture({
  snapshotId: "SNAP-FX-D",
  operationalWatermark: "WM-FX-D",
  sourceHash: "sha256:fixture-d",
  projects: [{ projectId: "PRJ-FX-D", status: "completed", stage: "closed", version: 2 }],
  tasks: [{
    taskId: "TSK-FX-D",
    projectId: "PRJ-FX-D",
    status: "completed",
    dueAt: OVERDUE,
    sourcePriority: "high",
    isNextAction: false,
    version: 2,
  }],
});

export const CASE_E_PROMISE_DUE = snapshotFixture({
  snapshotId: "SNAP-FX-E",
  operationalWatermark: "WM-FX-E",
  sourceHash: "sha256:fixture-e",
  projects: [{ projectId: "PRJ-FX-E", status: "active", stage: "qualification", version: 1 }],
  tasks: [{
    taskId: "TSK-FX-E",
    projectId: "PRJ-FX-E",
    status: "open",
    dueAt: AS_OF,
    sourcePriority: "high",
    isNextAction: true,
    promisedFromInteractionId: "PROM-FX-E",
    version: 1,
  }],
  promises: [{
    promiseId: "PROM-FX-E",
    projectId: "PRJ-FX-E",
    dueAt: AS_OF,
    fulfilled: false,
    sourcePriority: "high",
    linkedTaskId: "TSK-FX-E",
    version: 1,
  }],
});

export const CASE_F_ACTIVE_TIM_WITHOUT_NEXT_ACTION = snapshotFixture({
  snapshotId: "SNAP-FX-F",
  operationalWatermark: "WM-FX-F",
  sourceHash: "sha256:fixture-f",
  timAgreements: [{ timId: "TIM-FX-F", agreementStatus: "active", operationStatus: "mandate", version: 1 }],
});

export const CASE_G_CLOSED_TIM = snapshotFixture({
  snapshotId: "SNAP-FX-G",
  operationalWatermark: "WM-FX-G",
  sourceHash: "sha256:fixture-g",
  timAgreements: [{ timId: "TIM-FX-G", agreementStatus: "closed", operationStatus: "closed", version: 3 }],
});

export const CASE_H_LINKED_DUPLICATES = snapshotFixture({
  snapshotId: "SNAP-FX-H",
  operationalWatermark: "WM-FX-H",
  sourceHash: "sha256:fixture-h",
  projects: [{ projectId: "PRJ-FX-H", status: "active", stage: "qualification", version: 1 }],
  tasks: [{
    taskId: "TSK-FX-H",
    projectId: "PRJ-FX-H",
    status: "open",
    dueAt: OVERDUE,
    sourcePriority: "high",
    isNextAction: true,
    promisedFromInteractionId: "PROM-FX-H",
    version: 1,
  }],
  promises: [{
    promiseId: "PROM-FX-H",
    projectId: "PRJ-FX-H",
    dueAt: OVERDUE,
    fulfilled: false,
    sourcePriority: "high",
    linkedTaskId: "TSK-FX-H",
    version: 1,
  }],
});

export const CASE_J_INCOMPLETE_SNAPSHOT = snapshotFixture({
  snapshotId: "SNAP-FX-J",
  operationalWatermark: "WM-FX-J",
  sourceHash: "sha256:fixture-j",
  coverage: {
    projects: "complete",
    tasks: "incomplete",
    promises: "complete",
    intake: "canonical_signal_absent",
    timAgreements: "complete",
    timDeadlines: "complete",
  },
  projects: [{ projectId: "PRJ-FX-J", status: "active", stage: "qualification", version: 1 }],
});

export type FindingFixture = {
  findingId: string;
  missionId: string;
  observationFingerprint: string;
  ruleId: string;
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

export function findingFixture(overrides: Partial<FindingFixture> = {}): FindingFixture {
  return {
    findingId: "FND-FX-001",
    missionId: "MSN-OPS-FX-001",
    observationFingerprint: "fp:ops-project-next-action:PRJ-FX-001",
    ruleId: "OPS-PROJECT-NEXT-ACTION-001",
    ruleVersion: "1",
    scopeKind: "project",
    scopeId: "PRJ-FX-001",
    subjectId: null,
    linkKind: null,
    linkRef: null,
    reasonCode: "PROJECT_WITHOUT_NEXT_ACTION",
    proposedPriority: "normal",
    suggestedActionCode: "DEFINE_NEXT_ACTION",
    sourceRef: "PRJ-FX-001",
    sourceVersion: 1,
    snapshotId: "SNAP-FX-COS",
    operationalWatermark: "WM-FX-COS",
    sourceHash: "sha256:fixture-cos",
    observedAt: AS_OF,
    dueAt: null,
    ...overrides,
  };
}

export const CASE_I_TEN_FINDINGS = [
  findingFixture({
    findingId: "FND-FX-I-01",
    observationFingerprint: "fp:i:01",
    scopeId: "PRJ-FX-I-01",
    sourceRef: "PRJ-FX-I-01",
    ruleId: "OPS-PROMISE-DUE-003",
    reasonCode: "PROMISE_DUE",
    proposedPriority: "urgent",
    suggestedActionCode: "REVIEW_PROMISE_AND_CONTACT",
    dueAt: OVERDUE,
  }),
  findingFixture({ findingId: "FND-FX-I-02", observationFingerprint: "fp:i:02", scopeId: "PRJ-FX-I-02", sourceRef: "PRJ-FX-I-02", ruleId: "OPS-TASK-OVERDUE-002", reasonCode: "TASK_OVERDUE", proposedPriority: "high", suggestedActionCode: "REVIEW_OVERDUE_TASK", dueAt: OVERDUE }),
  findingFixture({ findingId: "FND-FX-I-03", observationFingerprint: "fp:i:03", scopeId: "PRJ-FX-I-03", sourceRef: "PRJ-FX-I-03", ruleId: "OPS-INCONSISTENCY-007", reasonCode: "TERMINAL_SCOPE_WITH_OPEN_NEXT_ACTION", proposedPriority: "high", suggestedActionCode: "REVIEW_TERMINAL_NEXT_ACTION" }),
  findingFixture({ findingId: "FND-FX-I-04", observationFingerprint: "fp:i:04", scopeId: "PRJ-FX-I-04", sourceRef: "PRJ-FX-I-04", proposedPriority: "normal" }),
  findingFixture({ findingId: "FND-FX-I-05", observationFingerprint: "fp:i:05", scopeKind: "tim_agreement", scopeId: "TIM-FX-I-05", sourceRef: "TIM-FX-I-05", ruleId: "OPS-TIM-NEXT-ACTION-005", reasonCode: "TIM_WITHOUT_NEXT_ACTION", proposedPriority: "normal", suggestedActionCode: "DEFINE_TIM_FOLLOW_UP" }),
  findingFixture({ findingId: "FND-FX-I-06", observationFingerprint: "fp:i:06", scopeKind: "tim_agreement", scopeId: "TIM-FX-I-06", sourceRef: "TIM-FX-I-06", ruleId: "OPS-TIM-DEADLINE-NEAR-006", reasonCode: "TIM_DEADLINE_NEAR", proposedPriority: "normal", suggestedActionCode: "REVIEW_TIM_DEADLINE", dueAt: FUTURE }),
  findingFixture({ findingId: "FND-FX-I-07", observationFingerprint: "fp:i:07", scopeId: "PRJ-FX-I-07", sourceRef: "PRJ-FX-I-07", proposedPriority: "low" }),
  findingFixture({ findingId: "FND-FX-I-08", observationFingerprint: "fp:i:08", scopeId: "PRJ-FX-I-08", sourceRef: "PRJ-FX-I-08", proposedPriority: "low" }),
  findingFixture({ findingId: "FND-FX-I-09", observationFingerprint: "fp:i:09", scopeId: "PRJ-FX-I-09", sourceRef: "PRJ-FX-I-09", proposedPriority: "low" }),
  findingFixture({ findingId: "FND-FX-I-10", observationFingerprint: "fp:i:10", scopeId: "PRJ-FX-I-10", sourceRef: "PRJ-FX-I-10", proposedPriority: "low" }),
];

export const FULL_RULE_COVERAGE = [
  { ruleId: "OPS-PROJECT-NEXT-ACTION-001", evaluationStatus: "evaluated" },
  { ruleId: "OPS-TASK-OVERDUE-002", evaluationStatus: "evaluated" },
  { ruleId: "OPS-PROMISE-DUE-003", evaluationStatus: "evaluated" },
  { ruleId: "OPS-INTAKE-UNTREATED-004", evaluationStatus: "not_evaluated", reasonCode: "CANONICAL_SIGNAL_ABSENT" },
  { ruleId: "OPS-TIM-NEXT-ACTION-005", evaluationStatus: "evaluated" },
  { ruleId: "OPS-TIM-DEADLINE-NEAR-006", evaluationStatus: "evaluated" },
  { ruleId: "OPS-INCONSISTENCY-007", evaluationStatus: "evaluated" },
] as const;

export const ENABLED_SWITCHES = [
  { scopeKind: "global", scopeKey: "global", state: "enabled", version: 1 },
  { scopeKind: "agent", scopeKey: "OPS-01", state: "enabled", version: 1 },
  { scopeKind: "agent", scopeKey: "COS-01", state: "enabled", version: 1 },
  { scopeKind: "capability", scopeKey: "ops.read_snapshot", state: "enabled", version: 1 },
  { scopeKind: "capability", scopeKey: "ops.evaluate_rules", state: "enabled", version: 1 },
  { scopeKind: "capability", scopeKey: "cos.read_ops_results", state: "enabled", version: 1 },
  { scopeKind: "capability", scopeKey: "cos.deduplicate", state: "enabled", version: 1 },
  { scopeKind: "capability", scopeKey: "cos.rank", state: "enabled", version: 1 },
  { scopeKind: "capability", scopeKey: "cos.compose_briefing", state: "enabled", version: 1 },
] as const;

export function missionInputFixture(overrides: Record<string, unknown> = {}) {
  return {
    missionId: "MSN-OPS-FX-001",
    missionType: "ops.shadow_scan.v1",
    contractVersion: "1",
    logicalAgent: "OPS-01",
    capabilities: ["ops.read_snapshot", "ops.evaluate_rules"],
    objectiveCode: "OPS_SHADOW_SCAN",
    priority: "normal",
    trigger: { kind: "manual", ref: "CMD-FX-001", actorId: "ACTOR-MOUAAD-FX" },
    source: {
      kind: "ops_snapshot",
      ref: "SNAP-FX-001",
      version: "ops-snapshot.v1",
      hash: "sha256:fixture-source-001",
      operationalWatermark: "WM-FX-001",
    },
    idempotencyKey: "ops.shadow_scan.v1:SNAP-FX-001:sha256-fixture-source-001:policy-a1",
    inputHash: "sha256:fixture-mission-input-001",
    correlationId: "COR-FX-001",
    causationId: "CMD-FX-001",
    createdAt: AS_OF,
    timeoutAt: "2026-08-19T08:00:30.000Z",
    logicalBudget: {
      sourceRows: 100,
      ruleEvaluations: 700,
      findings: 100,
      briefingItems: 7,
      traceEntries: 1000,
    },
    fixtureOnly: true,
    autonomyLevel: "L0",
    attemptNo: 1,
    version: 1,
    ...overrides,
  };
}
