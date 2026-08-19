import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertNoPii, composeBriefing, evaluateOpsSnapshot } from "../../agentic";
import { buildOpsSnapshot, readOperationalWatermark } from "./agentic-snapshot";
import { SqliteD1 } from "./testing/sqlite-d1";

const AS_OF = "2026-08-19T08:00:00.000Z";
const TIM_WINDOW_END = "2026-08-26T08:00:00.000Z";
const MIGRATIONS = [
  "0001_cockpit_identity.sql",
  "0002_cockpit_projects.sql",
  "0003_cockpit_search_history.sql",
  "0004_cockpit_tim_core.sql",
  "0005_cockpit_workflow_tim_finance.sql",
  "0006_cockpit_governance_integrity.sql",
  "0007_agentic_a1_control_plane.sql",
] as const;

const LOGICAL_BUDGET = {
  sourceRows: 1_000,
  ruleEvaluations: 7_000,
  findings: 1_000,
  briefingItems: 7,
  traceEntries: 10_000,
} as const;

function applySql(sqlite: SqliteD1, folder: "migrations" | "fixtures", file: string): void {
  sqlite.raw.exec(readFileSync(resolve(process.cwd(), "db", folder, file), "utf8"));
}

async function projectAndEvaluate(sqlite: SqliteD1) {
  const snapshot = await buildOpsSnapshot(sqlite.asD1(), { asOf: AS_OF, fixtureOnly: true });
  const result = evaluateOpsSnapshot(snapshot, {
    observedAt: AS_OF,
    timDeadlineWindowEnd: TIM_WINDOW_END,
    logicalBudget: LOGICAL_BUDGET,
  });
  return { snapshot, result };
}

describe("Agentic A1 D1 fixture → minimized OPS projection", () => {
  let sqlite: SqliteD1;

  beforeEach(() => {
    sqlite = new SqliteD1();
    for (const migration of MIGRATIONS) applySql(sqlite, "migrations", migration);
    applySql(sqlite, "fixtures", "agentic-a1.sql");
  });

  afterEach(() => sqlite.close());

  it("applies migrations 0001→0007, loads the fixture, and leaves every switch absent/stopped", () => {
    expect(sqlite.raw.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    const agenticTables = sqlite.raw.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table' AND name LIKE 'agent_%'
      ORDER BY name
    `).all() as Array<{ name: string }>;
    expect(agenticTables.map((entry) => entry.name)).toEqual([
      "agent_control_switch",
      "agent_cos_briefing_item",
      "agent_mission",
      "agent_ops_shadow_finding",
      "agent_trace",
    ]);
    expect(sqlite.raw.prepare("SELECT count(*) AS count FROM agent_control_switch").get()).toEqual({ count: 0 });
    expect(sqlite.raw.prepare("SELECT count(*) AS count FROM agent_mission").get()).toEqual({ count: 0 });
  });

  it("projects only the allowlisted structural fields and excludes fixture free text and PII-shaped fields", async () => {
    const snapshot = await buildOpsSnapshot(sqlite.asD1(), { asOf: AS_OF, fixtureOnly: true });
    expect(snapshot).toMatchObject({
      schemaVersion: "ops-snapshot.v1",
      fixtureOnly: true,
      asOf: AS_OF,
      coverage: {
        projects: "complete",
        tasks: "complete",
        promises: "complete",
        intake: "canonical_signal_absent",
        timAgreements: "complete",
        timDeadlines: "complete",
      },
    });
    expect(() => assertNoPii(snapshot)).not.toThrow();

    const serialized = JSON.stringify(snapshot);
    for (const forbidden of [
      "Fixture structurelle",
      "FIXTURE_OVERDUE",
      "Conseiller fixture",
      "Accord fixture",
      '"summary"',
      '"title"',
      '"label"',
      '"displayName"',
      '"email"',
      '"phone"',
      '"address"',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(Object.keys(snapshot.projects[0]).sort()).toEqual(["projectId", "stage", "status", "version"]);
    expect(Object.keys(snapshot.tasks[0]).sort()).toEqual([
      "dueAt",
      "isNextAction",
      "projectId",
      "sourcePriority",
      "status",
      "taskId",
      "version",
    ]);
  });

  it("produces a stable snapshot and operational watermark for an unchanged source", async () => {
    const first = await buildOpsSnapshot(sqlite.asD1(), { asOf: AS_OF, fixtureOnly: true });
    const second = await buildOpsSnapshot(sqlite.asD1(), { asOf: AS_OF, fixtureOnly: true });
    expect(second).toEqual(first);
    expect(await readOperationalWatermark(sqlite.asD1())).toBe(first.operationalWatermark);
    expect(first.snapshotId).toMatch(/^SNAP_[a-f0-9]{32}$/);
    expect(first.operationalWatermark).toMatch(/^WM_[a-f0-9]{64}$/);
    expect(first.sourceHash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("covers fixture cases A–D without false positives on future/completed rows", async () => {
    const { result } = await projectAndEvaluate(sqlite);
    const has = (ruleId: string, scopeId: string, subjectId?: string) => result.findings.some((finding) => (
      finding.ruleId === ruleId
      && finding.scopeId === scopeId
      && (subjectId === undefined || finding.subjectId === subjectId)
    ));

    expect(has("OPS-PROJECT-NEXT-ACTION-001", "PRJ-FX-A")).toBe(true);
    expect(has("OPS-PROJECT-NEXT-ACTION-001", "PRJ-FX-B")).toBe(false);
    expect(has("OPS-TASK-OVERDUE-002", "PRJ-FX-C", "TSK-FX-C")).toBe(true);
    expect(result.findings.some((finding) => finding.scopeId === "PRJ-FX-D" || finding.subjectId === "TSK-FX-D")).toBe(false);
  });

  it("covers fixture cases E–H, including due promise, TIM terminal exclusion and linked grouping", async () => {
    const { snapshot, result } = await projectAndEvaluate(sqlite);
    const forScope = (scopeId: string) => result.findings.filter((finding) => finding.scopeId === scopeId);

    expect(forScope("PRJ-FX-E")).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: "OPS-PROMISE-DUE-003",
        subjectId: "INT-FX-E",
        dueAt: AS_OF,
      }),
    ]));
    expect(forScope("PRJ-FX-E").some((finding) => finding.ruleId === "OPS-TASK-OVERDUE-002")).toBe(false);
    expect(forScope("TIM-FX-F")).toEqual([
      expect.objectContaining({ ruleId: "OPS-TIM-NEXT-ACTION-005" }),
    ]);
    expect(forScope("TIM-FX-G")).toEqual([]);

    const linked = forScope("PRJ-FX-H");
    expect(linked.map((finding) => finding.ruleId).sort()).toEqual([
      "OPS-PROMISE-DUE-003",
      "OPS-TASK-OVERDUE-002",
    ]);
    expect(linked.every((finding) => finding.linkKind === "promise_task" && finding.linkRef === "INT-FX-H")).toBe(true);

    const briefing = composeBriefing({
      missionId: "MSN-COS-FX-SNAPSHOT-H",
      sourceOpsMissionId: "MSN-OPS-FX-SNAPSHOT",
      sourceOpsResultHash: "sha256:fixture-ops-result",
      snapshotId: snapshot.snapshotId,
      operationalWatermark: snapshot.operationalWatermark,
      currentOperationalWatermark: snapshot.operationalWatermark,
      findings: linked,
      coverage: result.coverage,
      createdAt: AS_OF,
      logicalBudget: LOGICAL_BUDGET,
    });
    expect(briefing).toMatchObject({
      state: "current",
      items: [expect.objectContaining({ scopeId: "PRJ-FX-H", primaryRuleId: "OPS-PROMISE-DUE-003", signalCount: 2 })],
    });
  });

  it("preserves exact date boundaries, the TIM window, and disabled rule 004 coverage", async () => {
    const { snapshot, result } = await projectAndEvaluate(sqlite);
    expect(snapshot.promises.find((promise) => promise.promiseId === "INT-FX-E")).toMatchObject({
      dueAt: AS_OF,
      fulfilled: false,
      linkedTaskId: "TSK-FX-E",
    });
    expect(snapshot.timDeadlines.find((deadline) => deadline.deadlineId === "TSK-FX-TIM-NEAR")).toMatchObject({
      timId: "TIM-FX-T",
      dueAt: "2026-08-24T08:00:00.000Z",
      status: "open",
    });
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: "OPS-TIM-DEADLINE-NEAR-006",
        scopeId: "TIM-FX-T",
        dueAt: "2026-08-24T08:00:00.000Z",
        reasonCode: "TIM_DEADLINE_NEAR",
      }),
    ]));
    expect(result.coverage).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: "OPS-INTAKE-UNTREATED-004",
        evaluationStatus: "not_evaluated",
        reasonCode: "CANONICAL_SIGNAL_ABSENT",
      }),
    ]));
  });

  it("contains more than seven eligible scopes while COS publishes exactly seven and keeps the omitted count", async () => {
    const { snapshot, result } = await projectAndEvaluate(sqlite);
    const volumeFindings = result.findings.filter((finding) => finding.scopeId.startsWith("PRJ-FX-I-"));
    expect(volumeFindings).toHaveLength(10);
    expect(volumeFindings.every((finding) => finding.ruleId === "OPS-PROJECT-NEXT-ACTION-001")).toBe(true);

    const briefing = composeBriefing({
      missionId: "MSN-COS-FX-SNAPSHOT-I",
      sourceOpsMissionId: "MSN-OPS-FX-SNAPSHOT",
      sourceOpsResultHash: "sha256:fixture-ops-result",
      snapshotId: snapshot.snapshotId,
      operationalWatermark: snapshot.operationalWatermark,
      currentOperationalWatermark: snapshot.operationalWatermark,
      findings: result.findings,
      coverage: result.coverage,
      createdAt: AS_OF,
      logicalBudget: LOGICAL_BUDGET,
    });
    expect(briefing.items).toHaveLength(7);
    expect(briefing.omittedCount).toBeGreaterThan(0);
  });

  it("changes the watermark after a business mutation and marks the previous result stale", async () => {
    const { snapshot, result } = await projectAndEvaluate(sqlite);
    sqlite.raw.prepare(`
      UPDATE task
      SET status = 'completed',
          is_next_action = 0,
          completed_at = ?,
          updated_at = ?,
          version = version + 1
      WHERE id = 'TSK-FX-C'
    `).run(AS_OF, AS_OF);

    const currentWatermark = await readOperationalWatermark(sqlite.asD1());
    expect(currentWatermark).not.toBe(snapshot.operationalWatermark);
    const nextSnapshot = await buildOpsSnapshot(sqlite.asD1(), { asOf: AS_OF, fixtureOnly: true });
    expect(nextSnapshot.operationalWatermark).toBe(currentWatermark);

    const briefing = composeBriefing({
      missionId: "MSN-COS-FX-STALE",
      sourceOpsMissionId: "MSN-OPS-FX-SNAPSHOT",
      sourceOpsResultHash: "sha256:fixture-ops-result",
      snapshotId: snapshot.snapshotId,
      operationalWatermark: snapshot.operationalWatermark,
      currentOperationalWatermark: currentWatermark,
      findings: result.findings,
      coverage: result.coverage,
      createdAt: AS_OF,
      logicalBudget: LOGICAL_BUDGET,
    });
    expect(briefing).toMatchObject({
      state: "invalid",
      invalidReason: "CP_SOURCE_STALE",
      items: [],
      suggestedManualActionCode: "RUN_NEW_BRIEFING",
    });
  });
});
