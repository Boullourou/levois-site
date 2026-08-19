import { describe, expect, it, vi } from "vitest";
import {
  AS_OF,
  CASE_A_PROJECT_WITHOUT_NEXT_ACTION,
  CASE_B_PROJECT_WITH_FUTURE_ACTION,
  CASE_C_OVERDUE_TASK,
  CASE_D_COMPLETED_OLD_TASK,
  CASE_E_PROMISE_DUE,
  CASE_F_ACTIVE_TIM_WITHOUT_NEXT_ACTION,
  CASE_G_CLOSED_TIM,
  CASE_H_LINKED_DUPLICATES,
  CASE_I_TEN_FINDINGS,
  CASE_J_INCOMPLETE_SNAPSHOT,
  ENABLED_SWITCHES,
  FULL_RULE_COVERAGE,
  FUTURE,
  OVERDUE,
  TIM_WINDOW_END,
  findingFixture,
  missionInputFixture,
  snapshotFixture,
} from "./agentic.a1.fixtures";

type AgenticImplementation = {
  AGENTIC_CAPABILITY_ALLOWLIST: readonly string[];
  AGENTIC_WRITE_TABLES: readonly string[];
  DEFAULT_AGENTIC_SWITCH_STATE: string;
  TRACE_ENTRY_KINDS: readonly string[];
  createMission(input: Record<string, unknown>): Record<string, any>;
  transitionMission(mission: Record<string, any>, command: Record<string, unknown>): Record<string, any>;
  cancelMission(mission: Record<string, any>, command: Record<string, unknown>): Record<string, any>;
  hasMissionTimedOut(mission: Record<string, any>, now: string): boolean;
  checkpointMission(mission: Record<string, any>, checkpoint: Record<string, unknown>): Record<string, any>;
  evaluateSwitches(input: Record<string, unknown>): { allowed: boolean; blockingScope?: string; fingerprint?: string };
  checkMissionIdempotency(existing: Record<string, any> | null, input: Record<string, unknown>): "new" | "replay";
  assertFixtureOnly(input: Record<string, unknown>): void;
  assertAuthorizedCapabilities(agentId: string, capabilities: readonly string[]): void;
  assertNoPii(value: unknown): void;
  validateFinding(finding: Record<string, any>, input: Record<string, unknown>): void;
  evaluateOpsSnapshot(snapshot: Record<string, any>, input: Record<string, unknown>): {
    findings: Array<Record<string, any>>;
    coverage: Array<Record<string, any>>;
    snapshotId: string;
    operationalWatermark: string;
  };
  composeBriefing(input: Record<string, unknown>): Record<string, any>;
  isBriefingCurrent(briefing: Record<string, any>, input: Record<string, unknown>): boolean;
};

const implementationUrl = new URL("../src/lib/agentic/index.ts", import.meta.url).href;
let implementationPromise: Promise<AgenticImplementation> | undefined;

function implementation(): Promise<AgenticImplementation> {
  implementationPromise ??= import(/* @vite-ignore */ implementationUrl) as Promise<AgenticImplementation>;
  return implementationPromise;
}

function expectCode(action: () => unknown, code: string) {
  expect(action).toThrowError(expect.objectContaining({ code }));
}

function runOpsSnapshot(api: AgenticImplementation, snapshot: Record<string, any>) {
  return api.evaluateOpsSnapshot(snapshot, {
    observedAt: AS_OF,
    timDeadlineWindowEnd: TIM_WINDOW_END,
    logicalBudget: missionInputFixture().logicalBudget,
  });
}

function compose(api: AgenticImplementation, findings: Array<Record<string, any>>, overrides: Record<string, unknown> = {}) {
  return api.composeBriefing({
    missionId: "MSN-COS-FX-001",
    sourceOpsMissionId: "MSN-OPS-FX-001",
    sourceOpsResultHash: "sha256:ops-result-fixture",
    snapshotId: "SNAP-FX-COS",
    operationalWatermark: "WM-FX-COS",
    currentOperationalWatermark: "WM-FX-COS",
    findings,
    coverage: FULL_RULE_COVERAGE,
    createdAt: AS_OF,
    logicalBudget: missionInputFixture().logicalBudget,
    ...overrides,
  });
}

function advanceToRunning(api: AgenticImplementation) {
  let mission = api.createMission(missionInputFixture());
  mission = api.transitionMission(mission, { to: "planned", now: AS_OF, expectedVersion: 1 });
  mission = api.transitionMission(mission, {
    to: "assigned",
    now: AS_OF,
    expectedVersion: 2,
    switches: ENABLED_SWITCHES,
  });
  return api.transitionMission(mission, { to: "running", now: AS_OF, expectedVersion: 3 });
}

describe("Phase A1 — mission contract", () => {
  it("creates a fixture-only draft mission with an explicit finite budget and timeout", async () => {
    const api = await implementation();
    expect(api.createMission(missionInputFixture())).toMatchObject({
      missionId: "MSN-OPS-FX-001",
      status: "draft",
      fixtureOnly: true,
      autonomyLevel: "L0",
      version: 1,
    });
  });

  it("accepts only the A1 lifecycle draft → planned → assigned → running → completed", async () => {
    const api = await implementation();
    const running = advanceToRunning(api);
    const completed = api.transitionMission(running, {
      to: "completed",
      now: "2026-08-19T08:00:10.000Z",
      expectedVersion: 4,
      resultHash: "sha256:fixture-result",
      resultKind: "ops_shadow_findings.v1",
    });
    expect(completed).toMatchObject({ status: "completed", version: 5 });
  });

  it("rejects an inadmissible waiting_input transition for OPS-01", async () => {
    const api = await implementation();
    const running = advanceToRunning(api);
    expectCode(
      () => api.transitionMission(running, { to: "waiting_input", now: AS_OF, expectedVersion: 4 }),
      "CP_CONTRACT_INVALID",
    );
    expect(running.status).toBe("running");
  });

  it("never silently reopens a terminal mission", async () => {
    const api = await implementation();
    const cancelled = api.cancelMission(api.createMission(missionInputFixture()), {
      now: AS_OF,
      expectedVersion: 1,
      actorId: "ACTOR-MOUAAD-FX",
      reasonCode: "human_cancelled",
    });
    expectCode(
      () => api.transitionMission(cancelled, { to: "planned", now: AS_OF, expectedVersion: 2 }),
      "CP_CONTRACT_INVALID",
    );
    expect(cancelled.status).toBe("cancelled");
  });

  it("detects timeout exactly from the scenario-provided deadline", async () => {
    const api = await implementation();
    const mission = api.createMission(missionInputFixture());
    expect(api.hasMissionTimedOut(mission, "2026-08-19T08:00:29.999Z")).toBe(false);
    expect(api.hasMissionTimedOut(mission, "2026-08-19T08:00:30.000Z")).toBe(true);
  });

  it("cancels a non-terminal mission explicitly and records the close reason", async () => {
    const api = await implementation();
    const cancelled = api.cancelMission(advanceToRunning(api), {
      now: "2026-08-19T08:00:05.000Z",
      expectedVersion: 4,
      actorId: "ACTOR-MOUAAD-FX",
      reasonCode: "human_cancelled",
    });
    expect(cancelled).toMatchObject({ status: "cancelled", closeReason: "human_cancelled" });
  });

  it("fails closed when a kill switch changes during a checkpoint", async () => {
    const api = await implementation();
    const running = advanceToRunning(api);
    const stopped = ENABLED_SWITCHES.map((entry) => entry.scopeKey === "OPS-01" ? { ...entry, state: "stopped", version: 2 } : entry);
    const checked = api.checkpointMission(running, {
      now: "2026-08-19T08:00:05.000Z",
      expectedVersion: 4,
      capabilities: ["ops.read_snapshot", "ops.evaluate_rules"],
      switches: stopped,
      checkpoint: "before_result_write",
    });
    expect(checked).toMatchObject({ status: "cancelled", closeReason: "kill_switch" });
  });

  it("rejects a stale concurrent transition by mission version", async () => {
    const api = await implementation();
    const mission = api.createMission(missionInputFixture());
    const planned = api.transitionMission(mission, { to: "planned", now: AS_OF, expectedVersion: 1 });
    expectCode(
      () => api.transitionMission(planned, { to: "assigned", now: AS_OF, expectedVersion: 1, switches: ENABLED_SWITCHES }),
      "CP_VERSION_CONFLICT",
    );
  });

  it("treats a double click with the same idempotency key and hash as a replay", async () => {
    const api = await implementation();
    const input = missionInputFixture();
    const mission = api.createMission(input);
    expect(api.checkMissionIdempotency(mission, input)).toBe("replay");
  });

  it("rejects an idempotency-key collision with a different payload", async () => {
    const api = await implementation();
    const input = missionInputFixture();
    const mission = api.createMission(input);
    expectCode(
      () => api.checkMissionIdempotency(mission, missionInputFixture({ inputHash: "sha256:other-fixture-input" })),
      "CP_IDEMPOTENCY_CONFLICT",
    );
  });

  it("requires a manual retry to use a new mission instead of reopening attempt one", async () => {
    const api = await implementation();
    const failed = api.transitionMission(api.createMission(missionInputFixture()), {
      to: "failed",
      now: AS_OF,
      expectedVersion: 1,
      errorCode: "CP_TIMEOUT",
    });
    expectCode(() => api.transitionMission(failed, { to: "planned", now: AS_OF, expectedVersion: 2 }), "CP_CONTRACT_INVALID");
    const retry = api.createMission(missionInputFixture({
      missionId: "MSN-OPS-FX-RETRY-002",
      idempotencyKey: "ops.shadow_scan.v1:SNAP-FX-002:sha256-fixture-source-002:policy-a1",
      inputHash: "sha256:fixture-retry-input-002",
      causationId: failed.missionId,
      attemptNo: 1,
    }));
    expect(retry).toMatchObject({ status: "draft", attemptNo: 1 });
    expect(retry.missionId).not.toBe(failed.missionId);
  });
});

describe("Phase A1 — closed authority and switches", () => {
  it("defaults every absent switch to stopped", async () => {
    const api = await implementation();
    expect(api.DEFAULT_AGENTIC_SWITCH_STATE).toBe("stopped");
    expect(api.evaluateSwitches({ agentId: "OPS-01", capabilities: ["ops.read_snapshot"], switches: [] })).toMatchObject({
      allowed: false,
    });
  });

  it.each([
    ["global", "global"],
    ["agent", "OPS-01"],
    ["agent", "COS-01"],
  ])("honours a stopped %s switch for %s", async (scopeKind, scopeKey) => {
    const api = await implementation();
    const agentId = scopeKey === "COS-01" ? "COS-01" : "OPS-01";
    const capabilities = agentId === "COS-01" ? ["cos.compose_briefing"] : ["ops.read_snapshot"];
    const switches = ENABLED_SWITCHES.map((entry) => entry.scopeKind === scopeKind && entry.scopeKey === scopeKey
      ? { ...entry, state: "stopped", version: 2 }
      : entry);
    expect(api.evaluateSwitches({ agentId, capabilities, switches })).toMatchObject({ allowed: false });
  });

  it("honours a stopped capability switch", async () => {
    const api = await implementation();
    const switches = ENABLED_SWITCHES.map((entry) => entry.scopeKey === "ops.evaluate_rules"
      ? { ...entry, state: "stopped", version: 2 }
      : entry);
    expect(api.evaluateSwitches({ agentId: "OPS-01", capabilities: ["ops.read_snapshot", "ops.evaluate_rules"], switches })).toMatchObject({
      allowed: false,
      blockingScope: "capability:ops.evaluate_rules",
    });
  });

  it("rejects an unknown logical agent", async () => {
    const api = await implementation();
    expectCode(() => api.createMission(missionInputFixture({ logicalAgent: "BUY-01" })), "CP_SCOPE_VIOLATION");
  });

  it("rejects an unknown or business-mutating capability", async () => {
    const api = await implementation();
    expectCode(() => api.assertAuthorizedCapabilities("OPS-01", ["project.update"]), "CP_SCOPE_VIOLATION");
    expect(api.AGENTIC_CAPABILITY_ALLOWLIST).not.toContain("project.update");
  });

  it("exposes exactly the five technical write targets and no business table", async () => {
    const api = await implementation();
    expect([...api.AGENTIC_WRITE_TABLES].sort()).toEqual([
      "agent_control_switch",
      "agent_cos_briefing_item",
      "agent_mission",
      "agent_ops_shadow_finding",
      "agent_trace",
    ]);
    expect(api.AGENTIC_WRITE_TABLES).not.toEqual(expect.arrayContaining(["project", "task", "interaction", "tim_agreement"]));
  });

  it("declares the reconstructible trace entry kinds required by A1", async () => {
    const api = await implementation();
    expect(api.TRACE_ENTRY_KINDS).toEqual(expect.arrayContaining([
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
    ]));
  });

  it("rejects non-fixture execution and any non-fixture environment", async () => {
    const api = await implementation();
    expectCode(() => api.assertFixtureOnly({ fixtureOnly: false, environment: "production" }), "CP_SCOPE_VIOLATION");
    expectCode(() => api.createMission(missionInputFixture({ fixtureOnly: false })), "CP_SCOPE_VIOLATION");
  });

  it("never turns a missing logical budget into an unlimited one", async () => {
    const api = await implementation();
    expectCode(() => api.createMission(missionInputFixture({ logicalBudget: undefined })), "CP_CONTRACT_INVALID");
    expectCode(() => api.createMission(missionInputFixture({ logicalBudget: { findings: 0 } })), "CP_CONTRACT_INVALID");
  });

  it("rejects an excessive free payload before admission", async () => {
    const api = await implementation();
    expectCode(() => api.createMission(missionInputFixture({ objectiveCode: "X".repeat(2_000) })), "CP_CONTRACT_INVALID");
  });
});

describe("Phase A1 — OPS-01 deterministic shadow rules", () => {
  it("detects an active project without a next action", async () => {
    const api = await implementation();
    const result = runOpsSnapshot(api, CASE_A_PROJECT_WITHOUT_NEXT_ACTION);
    expect(result.findings).toEqual([
      expect.objectContaining({
        ruleId: "OPS-PROJECT-NEXT-ACTION-001",
        scopeKind: "project",
        scopeId: "PRJ-FX-A",
        reasonCode: "PROJECT_WITHOUT_NEXT_ACTION",
      }),
    ]);
  });

  it("does not flag an active project with a future next action", async () => {
    const api = await implementation();
    expect(runOpsSnapshot(api, CASE_B_PROJECT_WITH_FUTURE_ACTION).findings).toEqual([]);
  });

  it("never flags a terminal project as missing a next action", async () => {
    const api = await implementation();
    const result = runOpsSnapshot(api, CASE_D_COMPLETED_OLD_TASK);
    expect(result.findings.some((entry) => entry.ruleId === "OPS-PROJECT-NEXT-ACTION-001")).toBe(false);
  });

  it("detects an overdue open task", async () => {
    const api = await implementation();
    expect(runOpsSnapshot(api, CASE_C_OVERDUE_TASK).findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: "OPS-TASK-OVERDUE-002",
        subjectId: "TSK-FX-C",
        reasonCode: "TASK_OVERDUE",
        proposedPriority: "high",
      }),
    ]));
  });

  it("never flags a completed task even when its due date is old", async () => {
    const api = await implementation();
    expect(runOpsSnapshot(api, CASE_D_COMPLETED_OLD_TASK).findings.some((entry) => entry.ruleId === "OPS-TASK-OVERDUE-002")).toBe(false);
  });

  it("detects a structured unfulfilled promise due now", async () => {
    const api = await implementation();
    expect(runOpsSnapshot(api, CASE_E_PROMISE_DUE).findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: "OPS-PROMISE-DUE-003",
        subjectId: "PROM-FX-E",
        reasonCode: "PROMISE_DUE",
      }),
    ]));
  });

  it("does not flag a future promise", async () => {
    const api = await implementation();
    const snapshot = snapshotFixture({
      projects: [{ projectId: "PRJ-FX-PROM-FUTURE", status: "active", stage: "qualification", version: 1 }],
      tasks: [{ taskId: "TSK-FX-PROM-FUTURE", projectId: "PRJ-FX-PROM-FUTURE", status: "open", dueAt: FUTURE, sourcePriority: "normal", isNextAction: true, version: 1 }],
      promises: [{ promiseId: "PROM-FX-FUTURE", projectId: "PRJ-FX-PROM-FUTURE", dueAt: FUTURE, fulfilled: false, sourcePriority: "normal", version: 1 }],
    });
    expect(runOpsSnapshot(api, snapshot).findings.some((entry) => entry.ruleId === "OPS-PROMISE-DUE-003")).toBe(false);
  });

  it("keeps intake triage disabled while the canonical signal is absent", async () => {
    const api = await implementation();
    const result = runOpsSnapshot(api, snapshotFixture({
      projects: [{ projectId: "PRJ-FX-NEW", status: "new", stage: "intake", version: 1 }],
    }));
    expect(result.findings.some((entry) => entry.ruleId === "OPS-INTAKE-UNTREATED-004")).toBe(false);
    expect(result.coverage).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: "OPS-INTAKE-UNTREATED-004",
        evaluationStatus: "not_evaluated",
        reasonCode: "CANONICAL_SIGNAL_ABSENT",
      }),
    ]));
  });

  it("detects an actionable TIM agreement without a next action", async () => {
    const api = await implementation();
    expect(runOpsSnapshot(api, CASE_F_ACTIVE_TIM_WITHOUT_NEXT_ACTION).findings).toEqual([
      expect.objectContaining({
        ruleId: "OPS-TIM-NEXT-ACTION-005",
        scopeKind: "tim_agreement",
        scopeId: "TIM-FX-F",
        reasonCode: "TIM_WITHOUT_NEXT_ACTION",
      }),
    ]);
  });

  it("does not flag a closed TIM agreement", async () => {
    const api = await implementation();
    expect(runOpsSnapshot(api, CASE_G_CLOSED_TIM).findings).toEqual([]);
  });

  it("detects a structured TIM deadline inside the explicit fixture window", async () => {
    const api = await implementation();
    const snapshot = snapshotFixture({
      timAgreements: [{ timId: "TIM-FX-DUE", agreementStatus: "active", operationStatus: "mandate", version: 1 }],
      tasks: [{ taskId: "TSK-FX-TIM-DUE", timId: "TIM-FX-DUE", status: "open", dueAt: FUTURE, sourcePriority: "normal", isNextAction: true, timDeadlineId: "DUE-FX-001", version: 1 }],
      timDeadlines: [{ deadlineId: "DUE-FX-001", timId: "TIM-FX-DUE", kind: "follow_up", dueAt: FUTURE, status: "open", linkedTaskId: "TSK-FX-TIM-DUE", version: 1 }],
    });
    expect(runOpsSnapshot(api, snapshot).findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: "OPS-TIM-DEADLINE-NEAR-006",
        reasonCode: "TIM_DEADLINE_NEAR",
        dueAt: FUTURE,
      }),
    ]));
  });

  it("detects only the approved simple inconsistency on a terminal scope", async () => {
    const api = await implementation();
    const snapshot = snapshotFixture({
      projects: [{ projectId: "PRJ-FX-TERMINAL-NEXT", status: "completed", stage: "closed", version: 2 }],
      tasks: [{ taskId: "TSK-FX-TERMINAL-NEXT", projectId: "PRJ-FX-TERMINAL-NEXT", status: "open", dueAt: OVERDUE, sourcePriority: "normal", isNextAction: true, version: 1 }],
    });
    expect(runOpsSnapshot(api, snapshot).findings).toEqual([
      expect.objectContaining({
        ruleId: "OPS-INCONSISTENCY-007",
        reasonCode: "TERMINAL_SCOPE_WITH_OPEN_NEXT_ACTION",
      }),
    ]);
  });

  it("marks incomplete source families invalid instead of claiming zero findings", async () => {
    const api = await implementation();
    expectCode(() => runOpsSnapshot(api, CASE_J_INCOMPLETE_SNAPSHOT), "CP_SOURCE_EMPTY");
  });

  it("does not mutate its snapshot input", async () => {
    const api = await implementation();
    const snapshot = structuredClone(CASE_H_LINKED_DUPLICATES);
    const before = structuredClone(snapshot);
    runOpsSnapshot(api, snapshot);
    expect(snapshot).toEqual(before);
  });
});

describe("Phase A1 — COS-01 deterministic briefing", () => {
  it("deduplicates an exact fingerprint", async () => {
    const api = await implementation();
    const duplicate = findingFixture();
    const briefing = compose(api, [duplicate, structuredClone(duplicate)]);
    expect(briefing.items).toHaveLength(1);
    expect(briefing.items[0].findingRefs).toEqual([duplicate.findingId]);
  });

  it("groups a linked due promise and overdue task in the same scope", async () => {
    const api = await implementation();
    const ops = runOpsSnapshot(api, CASE_H_LINKED_DUPLICATES);
    const briefing = compose(api, ops.findings, {
      snapshotId: CASE_H_LINKED_DUPLICATES.snapshotId,
      operationalWatermark: CASE_H_LINKED_DUPLICATES.operationalWatermark,
      currentOperationalWatermark: CASE_H_LINKED_DUPLICATES.operationalWatermark,
    });
    expect(briefing.items).toHaveLength(1);
    expect(briefing.items[0]).toMatchObject({ primaryRuleId: "OPS-PROMISE-DUE-003", signalCount: 2 });
  });

  it("produces the same total order for every input order", async () => {
    const api = await implementation();
    const forward = compose(api, CASE_I_TEN_FINDINGS).items.map((entry: Record<string, any>) => entry.scopeId);
    const reverse = compose(api, [...CASE_I_TEN_FINDINGS].reverse()).items.map((entry: Record<string, any>) => entry.scopeId);
    expect(reverse).toEqual(forward);
    expect(forward.slice(0, 3)).toEqual(["PRJ-FX-I-01", "PRJ-FX-I-02", "PRJ-FX-I-03"]);
  });

  it("selects at most seven items and records omitted groups", async () => {
    const api = await implementation();
    const briefing = compose(api, CASE_I_TEN_FINDINGS);
    expect(briefing.items).toHaveLength(7);
    expect(briefing.omittedCount).toBe(3);
  });

  it("accepts zero items only when coverage is valid", async () => {
    const api = await implementation();
    expect(compose(api, [])).toMatchObject({ state: "current", items: [], omittedCount: 0 });
  });

  it("requires deterministic explanation, action and source on every item", async () => {
    const api = await implementation();
    const briefing = compose(api, [findingFixture()]);
    expect(briefing.items[0]).toEqual(expect.objectContaining({
      explanation: expect.stringMatching(/\S/),
      suggestedHumanAction: expect.stringMatching(/\S/),
      source: expect.objectContaining({
        sourceOpsMissionId: "MSN-OPS-FX-001",
        snapshotId: "SNAP-FX-COS",
        operationalWatermark: "WM-FX-COS",
      }),
    }));
  });

  it("invalidates the whole briefing when the operational watermark changed", async () => {
    const api = await implementation();
    const briefing = compose(api, [findingFixture()], { currentOperationalWatermark: "WM-FX-NEWER" });
    expect(briefing).toMatchObject({ state: "invalid", invalidReason: "CP_SOURCE_STALE", items: [] });
  });

  it("invalidates incomplete coverage instead of presenting an empty briefing", async () => {
    const api = await implementation();
    const coverage = FULL_RULE_COVERAGE.map((entry) => entry.ruleId === "OPS-TASK-OVERDUE-002"
      ? { ...entry, evaluationStatus: "failed", reasonCode: "SOURCE_PARTIAL" }
      : entry);
    expect(compose(api, [], { coverage })).toMatchObject({ state: "invalid", items: [] });
  });

  it("does not create or request a replacement mission for a stale briefing", async () => {
    const api = await implementation();
    const briefing = compose(api, [findingFixture()], { currentOperationalWatermark: "WM-FX-NEWER" });
    expect(briefing).not.toHaveProperty("replacementMission");
    expect(briefing).not.toHaveProperty("autoRetry");
    expect(briefing).toMatchObject({ suggestedManualActionCode: "RUN_NEW_BRIEFING" });
  });

  it("never treats a previous-watermark briefing as current", async () => {
    const api = await implementation();
    const briefing = compose(api, [findingFixture()]);
    expect(api.isBriefingCurrent(briefing, { currentOperationalWatermark: "WM-FX-COS", missionStatus: "completed" })).toBe(true);
    expect(api.isBriefingCurrent(briefing, { currentOperationalWatermark: "WM-FX-NEXT", missionStatus: "completed" })).toBe(false);
  });
});

describe("Phase A1 — security, privacy and threat cases", () => {
  it("rejects a manipulated reason_code", async () => {
    const api = await implementation();
    expectCode(
      () => api.validateFinding(findingFixture({ reasonCode: "<script>project.update()</script>" }), { knownScopeIds: ["PRJ-FX-001"] }),
      "CP_RESULT_INVALID",
    );
  });

  it("rejects an unknown entity id instead of resolving or inventing it", async () => {
    const api = await implementation();
    expectCode(
      () => api.validateFinding(findingFixture({ scopeId: "PRJ-FX-UNKNOWN", sourceRef: "PRJ-FX-UNKNOWN" }), { knownScopeIds: ["PRJ-FX-001"] }),
      "CP_RESULT_INVALID",
    );
  });

  it("rejects PII canaries and unknown extra fields in a snapshot", async () => {
    const api = await implementation();
    const poisoned = structuredClone(CASE_A_PROJECT_WITHOUT_NEXT_ACTION) as Record<string, any>;
    poisoned.projects[0].email = "fixture-canary@example.invalid";
    expectCode(() => runOpsSnapshot(api, poisoned), "CP_PII_POLICY_VIOLATION");
    expectCode(() => api.assertNoPii(poisoned), "CP_PII_POLICY_VIOLATION");
  });

  it("emits no PII, free client text or address in findings and briefing", async () => {
    const api = await implementation();
    const ops = runOpsSnapshot(api, CASE_A_PROJECT_WITHOUT_NEXT_ACTION);
    const briefing = compose(api, ops.findings, {
      snapshotId: CASE_A_PROJECT_WITHOUT_NEXT_ACTION.snapshotId,
      operationalWatermark: CASE_A_PROJECT_WITHOUT_NEXT_ACTION.operationalWatermark,
      currentOperationalWatermark: CASE_A_PROJECT_WITHOUT_NEXT_ACTION.operationalWatermark,
    });
    const serialized = JSON.stringify({ ops, briefing }).toLowerCase();
    for (const forbidden of ["email", "phone", "telephone", "address", "adresse", "client_text", "summary"]) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(() => api.assertNoPii({ ops, briefing })).not.toThrow();
  });

  it("performs no network or model call during the full deterministic chain", async () => {
    const api = await implementation();
    const originalFetch = globalThis.fetch;
    const fetchSpy = vi.fn(() => Promise.reject(new Error("NETWORK_FORBIDDEN_IN_A1")));
    globalThis.fetch = fetchSpy as typeof fetch;
    try {
      const ops = runOpsSnapshot(api, CASE_A_PROJECT_WITHOUT_NEXT_ACTION);
      compose(api, ops.findings, {
        snapshotId: CASE_A_PROJECT_WITHOUT_NEXT_ACTION.snapshotId,
        operationalWatermark: CASE_A_PROJECT_WITHOUT_NEXT_ACTION.operationalWatermark,
        currentOperationalWatermark: CASE_A_PROJECT_WITHOUT_NEXT_ACTION.operationalWatermark,
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("does not mutate business-shaped inputs on success or stale failure", async () => {
    const api = await implementation();
    const snapshot = structuredClone(CASE_E_PROMISE_DUE);
    const before = structuredClone(snapshot);
    const ops = runOpsSnapshot(api, snapshot);
    compose(api, ops.findings, {
      snapshotId: snapshot.snapshotId,
      operationalWatermark: snapshot.operationalWatermark,
      currentOperationalWatermark: "WM-FX-STALE",
    });
    expect(snapshot).toEqual(before);
  });

  it("fails closed for a stale mission checkpoint", async () => {
    const api = await implementation();
    const running = advanceToRunning(api);
    const result = api.checkpointMission(running, {
      now: "2026-08-19T08:00:05.000Z",
      expectedVersion: 4,
      capabilities: ["ops.read_snapshot", "ops.evaluate_rules"],
      switches: ENABLED_SWITCHES,
      checkpoint: "before_result_write",
      expectedOperationalWatermark: "WM-FX-001",
      currentOperationalWatermark: "WM-FX-002",
    });
    expect(result).toMatchObject({ status: "cancelled", closeReason: "stale_source" });
  });

  it("fails closed when even one required snapshot family is partial", async () => {
    const api = await implementation();
    const partial = snapshotFixture({
      coverage: { ...snapshotFixture().coverage, promises: "incomplete" },
    });
    expectCode(() => runOpsSnapshot(api, partial), "CP_SOURCE_EMPTY");
  });
});
