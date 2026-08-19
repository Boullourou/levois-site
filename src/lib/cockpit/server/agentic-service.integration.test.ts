import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AGENTIC_A1_FIXTURE_ID,
  getAgenticMission,
  getCurrentAgenticBriefing,
  listAgenticMissionTrace,
  listAgenticSwitches,
  runAgenticBriefing,
  setAgenticSwitch,
  type AgenticExecutionContext,
} from "./agentic-service";
import { findStoredMission, updateStoredMission } from "./agentic-store";
import { SqliteD1 } from "./testing/sqlite-d1";

const AS_OF = "2026-08-19T08:00:00.000Z";
const MIGRATIONS = [
  "0001_cockpit_identity.sql",
  "0002_cockpit_projects.sql",
  "0003_cockpit_search_history.sql",
  "0004_cockpit_tim_core.sql",
  "0005_cockpit_workflow_tim_finance.sql",
  "0006_cockpit_governance_integrity.sql",
  "0007_agentic_a1_control_plane.sql",
] as const;
const SWITCHES = [
  ["global", "global"],
  ["agent", "OPS-01"],
  ["agent", "COS-01"],
  ["capability", "ops.read_snapshot"],
  ["capability", "ops.evaluate_rules"],
  ["capability", "cos.read_ops_results"],
  ["capability", "cos.deduplicate"],
  ["capability", "cos.rank"],
  ["capability", "cos.compose_briefing"],
] as const;

function applySql(sqlite: SqliteD1, folder: "migrations" | "fixtures", file: string): void {
  sqlite.raw.exec(readFileSync(resolve(process.cwd(), "db", folder, file), "utf8"));
}

function context(key: string, inputHash = `sha256:${key}:fixture-input`): AgenticExecutionContext {
  return {
    actorId: "MOUAAD-FIXTURE",
    idempotencyKey: key,
    inputHash,
    now: AS_OF,
    clock: () => AS_OF,
  };
}

function businessSnapshot(sqlite: SqliteD1): Record<string, unknown[]> {
  const tables = sqlite.raw.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'agent_%'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all() as Array<{ name: string }>;
  return Object.fromEntries(tables.map(({ name }) => [
    name,
    sqlite.raw.prepare(`SELECT * FROM "${name}" ORDER BY rowid`).all(),
  ]));
}

function distinctD1View(sqlite: SqliteD1): ReturnType<SqliteD1["asD1"]> {
  const base = sqlite.asD1() as unknown as object;
  return new Proxy(base, {
    get(target, property) {
      const value = Reflect.get(target, property, target) as unknown;
      return typeof value === "function" ? value.bind(target) : value;
    },
  }) as ReturnType<SqliteD1["asD1"]>;
}

async function enableAll(sqlite: SqliteD1): Promise<void> {
  for (const [scopeKind, scopeKey] of SWITCHES) {
    await setAgenticSwitch(sqlite.asD1(), { scopeKind, scopeKey }, {
      state: "enabled",
      reasonCode: "A1_FIXTURE_ENABLE",
      expectedVersion: 0,
      fixtureOnly: true,
      fixtureId: AGENTIC_A1_FIXTURE_ID,
    }, context(`switch-enable-${scopeKind}-${scopeKey}`));
  }
}

describe("Agentic A1 server orchestration", () => {
  let sqlite: SqliteD1;

  beforeEach(() => {
    sqlite = new SqliteD1();
    for (const migration of MIGRATIONS) applySql(sqlite, "migrations", migration);
    applySql(sqlite, "fixtures", "agentic-a1.sql");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sqlite.close();
  });

  it("fails closed with absent switches and creates no mission", async () => {
    await expect(getCurrentAgenticBriefing(sqlite.asD1())).resolves.toMatchObject({
      state: "stopped",
      items: [],
      fixtureOnly: true,
      shadowMode: true,
    });
    await expect(runAgenticBriefing(sqlite.asD1(), {
      fixtureOnly: true,
      fixtureId: AGENTIC_A1_FIXTURE_ID,
    }, context("run-with-switches-absent"))).rejects.toMatchObject({ code: "CP_KILL_SWITCH_ACTIVE", status: 423 });
    expect(sqlite.raw.prepare("SELECT count(*) AS count FROM agent_mission").get()).toEqual({ count: 0 });
  });

  it("runs OPS then COS deterministically, audits them, and never writes a business table or the network", async () => {
    await enableAll(sqlite);
    const before = businessSnapshot(sqlite);
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    sqlite.clearPreparedSql();

    const result = await runAgenticBriefing(sqlite.asD1(), {
      fixtureOnly: true,
      fixtureId: AGENTIC_A1_FIXTURE_ID,
    }, context("run-a1-complete-fixture"));

    expect(result.replayed).toBe(false);
    expect(result.opsMission).toMatchObject({ agentId: "OPS-01", status: "completed", fixtureOnly: true });
    expect(result.cosMission).toMatchObject({ agentId: "COS-01", status: "completed", fixtureOnly: true });
    expect(result.briefing.state).toBe("available");
    expect(result.briefing.items.length).toBeGreaterThan(0);
    expect(result.briefing.items.length).toBeLessThanOrEqual(7);
    expect(result.briefing.items[0]).toMatchObject({
      itemId: expect.any(String),
      priority: expect.stringMatching(/^(urgent|high|normal|low)$/),
      primaryRuleId: expect.stringMatching(/^OPS-/),
      explanation: expect.any(String),
      source: {
        sourceOpsMissionId: result.opsMission.missionId,
        snapshotId: expect.any(String),
        operationalWatermark: expect.any(String),
      },
    });
    expect(await getCurrentAgenticBriefing(sqlite.asD1())).toMatchObject({ state: "available" });

    const mission = await getAgenticMission(sqlite.asD1(), result.opsMission.missionId);
    expect(mission).toMatchObject({
      capabilities: ["ops.read_snapshot", "ops.evaluate_rules"],
      objectiveCode: "OPS_SHADOW_SCAN",
      trigger: { kind: "manual", ref: "run-a1-complete-fixture" },
      source: { kind: "fixture_request", ref: AGENTIC_A1_FIXTURE_ID },
      snapshotId: expect.any(String),
      operationalWatermark: expect.any(String),
      correlationId: expect.any(String),
      attemptNo: 1,
    });
    expect(mission).not.toHaveProperty("inputHash");
    expect(mission).not.toHaveProperty("resultHash");
    expect(mission.logicalUsage.sourceRows).toBeGreaterThan(0);
    expect(mission.logicalUsage.ruleEvaluations).toBe(mission.logicalUsage.sourceRows * 7);

    const trace = await listAgenticMissionTrace(sqlite.asD1(), result.opsMission.missionId, { limit: 100 });
    expect(trace.items.map((entry) => entry.entryKind)).toEqual(expect.arrayContaining([
      "mission_created",
      "mission_started",
      "snapshot_read",
      "rule_evaluated",
      "finding_produced",
      "mission_completed",
    ]));
    expect(trace.items[0]).toMatchObject({ correlationId: mission.correlationId, logicalUsageDelta: {} });
    expect(trace.items[0]).not.toHaveProperty("resultHash");

    const stored = await findStoredMission(sqlite.asD1(), result.opsMission.missionId);
    expect(stored).not.toBeNull();
    const traceCountBeforeConflict = (sqlite.raw.prepare(`
      SELECT count(*) AS count FROM agent_trace WHERE mission_id = ?
    `).get(result.opsMission.missionId) as { count: number }).count;
    await expect(updateStoredMission(sqlite.asD1(), stored!.version + 10, {
      ...stored!,
      version: stored!.version + 11,
    }, {
      entryKind: "mission_transitioned",
      occurredAt: AS_OF,
      actorId: "CONTROL-PLANE-A1",
      agentId: "OPS-01",
      fromStatus: stored!.status,
      toStatus: stored!.status,
      payloadHash: "sha256:stale-version-must-not-create-trace",
      policyVersion: stored!.policyVersion,
    })).rejects.toThrow(/CP_VERSION_CONFLICT/);
    expect((sqlite.raw.prepare(`
      SELECT count(*) AS count FROM agent_trace WHERE mission_id = ?
    `).get(result.opsMission.missionId) as { count: number }).count).toBe(traceCountBeforeConflict);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(businessSnapshot(sqlite)).toEqual(before);
    const mutatingTargets = sqlite.preparedSql.flatMap((sql) => {
      const match = sql.match(/^\s*(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+([a-z_]+)/i);
      return match ? [match[1].toLowerCase()] : [];
    });
    expect(mutatingTargets.length).toBeGreaterThan(0);
    expect(mutatingTargets.every((table) => [
      "agent_mission",
      "agent_trace",
      "agent_control_switch",
      "agent_ops_shadow_finding",
      "agent_cos_briefing_item",
    ].includes(table))).toBe(true);
  });

  it("keeps observation fingerprints stable but finding ids unique across two manual runs", async () => {
    await enableAll(sqlite);
    const input = { fixtureOnly: true as const, fixtureId: AGENTIC_A1_FIXTURE_ID };
    const first = await runAgenticBriefing(sqlite.asD1(), input, context("run-same-fixture-first"));
    const second = await runAgenticBriefing(sqlite.asD1(), input, context("run-same-fixture-second"));
    expect(first.opsMission.missionId).not.toBe(second.opsMission.missionId);
    expect(second.briefing.state).toBe("available");

    const rows = sqlite.raw.prepare(`
      SELECT mission_id, id, observation_fingerprint
      FROM agent_ops_shadow_finding
      WHERE mission_id IN (?, ?)
      ORDER BY mission_id, observation_fingerprint
    `).all(first.opsMission.missionId, second.opsMission.missionId) as Array<{
      mission_id: string;
      id: string;
      observation_fingerprint: string;
    }>;
    const firstRows = rows.filter((row) => row.mission_id === first.opsMission.missionId);
    const secondRows = rows.filter((row) => row.mission_id === second.opsMission.missionId);
    expect(firstRows.length).toBeGreaterThan(0);
    expect(secondRows.map((row) => row.observation_fingerprint)).toEqual(
      firstRows.map((row) => row.observation_fingerprint),
    );
    expect(secondRows.some((row) => firstRows.some((firstRow) => firstRow.id === row.id))).toBe(false);
  });

  it("replays commands idempotently and rejects collisions or missing explicit versions", async () => {
    const scope = { scopeKind: "global" as const, scopeKey: "global" };
    const input = {
      state: "enabled" as const,
      reasonCode: "A1_FIXTURE_ENABLE",
      expectedVersion: 0,
      fixtureOnly: true as const,
      fixtureId: AGENTIC_A1_FIXTURE_ID,
    };
    const command = context("switch-replay-global");
    const first = await setAgenticSwitch(sqlite.asD1(), scope, input, command);
    const replay = await setAgenticSwitch(sqlite.asD1(), scope, input, command);
    expect(replay).toEqual(first);
    await expect(setAgenticSwitch(sqlite.asD1(), scope, input, {
      ...command,
      inputHash: "sha256:different-switch-command",
    })).rejects.toMatchObject({ code: "CP_IDEMPOTENCY_CONFLICT", status: 409 });
    await expect(setAgenticSwitch(sqlite.asD1(), { scopeKind: "agent", scopeKey: "OPS-01" }, {
      ...input,
      expectedVersion: undefined as never,
    }, context("switch-no-explicit-version"))).rejects.toMatchObject({ code: "CP_CONTRACT_INVALID", status: 400 });

    await setAgenticSwitch(sqlite.asD1(), scope, {
      ...input,
      state: "stopped",
      expectedVersion: 1,
    }, context("switch-stop-after-original-command"));
    await expect(setAgenticSwitch(sqlite.asD1(), scope, input, command)).resolves.toEqual(first);
    await expect(listAgenticSwitches(sqlite.asD1())).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ scopeKind: "global", scopeKey: "global", effectiveState: "stopped", version: 2 }),
    ]));
  });

  it("invalidates an old briefing after stop then start and never resurrects it", async () => {
    await enableAll(sqlite);
    const run = await runAgenticBriefing(sqlite.asD1(), {
      fixtureOnly: true,
      fixtureId: AGENTIC_A1_FIXTURE_ID,
    }, context("run-before-control-change"));
    expect(run.briefing.state).toBe("available");

    const scope = { scopeKind: "agent" as const, scopeKey: "COS-01" };
    await setAgenticSwitch(sqlite.asD1(), scope, {
      state: "stopped",
      reasonCode: "A1_HUMAN_STOP",
      expectedVersion: 1,
      fixtureOnly: true,
      fixtureId: AGENTIC_A1_FIXTURE_ID,
    }, context("stop-cos-after-briefing"));
    expect(await getCurrentAgenticBriefing(sqlite.asD1())).toMatchObject({ state: "stopped", items: [] });

    await setAgenticSwitch(sqlite.asD1(), scope, {
      state: "enabled",
      reasonCode: "A1_HUMAN_RESTART",
      expectedVersion: 2,
      fixtureOnly: true,
      fixtureId: AGENTIC_A1_FIXTURE_ID,
    }, context("restart-cos-after-briefing"));
    expect(await getCurrentAgenticBriefing(sqlite.asD1())).toMatchObject({
      state: "stale",
      reasonCode: "CP_CONTROL_CHANGED",
      items: [],
    });
  });

  it("stops on an OPS source switch and keeps the old briefing stale after OPS restarts", async () => {
    await enableAll(sqlite);
    const run = await runAgenticBriefing(sqlite.asD1(), {
      fixtureOnly: true,
      fixtureId: AGENTIC_A1_FIXTURE_ID,
    }, context("run-before-ops-control-change"));
    expect(run.briefing.state).toBe("available");

    const scope = { scopeKind: "agent" as const, scopeKey: "OPS-01" };
    await setAgenticSwitch(sqlite.asD1(), scope, {
      state: "stopped",
      reasonCode: "A1_HUMAN_STOP",
      expectedVersion: 1,
      fixtureOnly: true,
      fixtureId: AGENTIC_A1_FIXTURE_ID,
    }, context("stop-ops-after-briefing"));
    expect(await getCurrentAgenticBriefing(sqlite.asD1())).toMatchObject({ state: "stopped", items: [] });

    await setAgenticSwitch(sqlite.asD1(), scope, {
      state: "enabled",
      reasonCode: "A1_HUMAN_RESTART",
      expectedVersion: 2,
      fixtureOnly: true,
      fixtureId: AGENTIC_A1_FIXTURE_ID,
    }, context("restart-ops-after-briefing"));
    expect(await getCurrentAgenticBriefing(sqlite.asD1())).toMatchObject({
      state: "stale",
      reasonCode: "CP_CONTROL_CHANGED",
      items: [],
    });
  });

  it("collapses a light concurrent double click onto one OPS/COS mission pair", async () => {
    await enableAll(sqlite);
    const input = { fixtureOnly: true as const, fixtureId: AGENTIC_A1_FIXTURE_ID };
    const command = context("run-concurrent-double-click");
    const results = await Promise.allSettled([
      runAgenticBriefing(sqlite.asD1(), input, command),
      runAgenticBriefing(sqlite.asD1(), input, command),
    ]);
    expect(
      results.every((result) => result.status === "fulfilled"),
      JSON.stringify(results.map((result) => result.status === "rejected"
        ? { code: (result.reason as { code?: string }).code, message: (result.reason as Error).message }
        : { replayed: result.value.replayed })),
    ).toBe(true);
    const values = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
    expect(values.map((value) => value.replayed).sort()).toEqual([false, true]);
    expect(new Set(values.map((value) => value.opsMission.missionId)).size).toBe(1);
    expect(sqlite.raw.prepare("SELECT count(*) AS count FROM agent_mission").get()).toEqual({ count: 2 });
  });

  it("uses the D1 idempotency ledger when two isolate-like wrappers race", async () => {
    await enableAll(sqlite);
    const input = { fixtureOnly: true as const, fixtureId: AGENTIC_A1_FIXTURE_ID };
    const command = context("run-cross-isolate-double-click");
    const results = await Promise.allSettled([
      runAgenticBriefing(distinctD1View(sqlite), input, command),
      runAgenticBriefing(distinctD1View(sqlite), input, command),
    ]);
    expect(
      results.every((result) => result.status === "fulfilled"),
      JSON.stringify(results.map((result) => result.status === "rejected"
        ? { code: (result.reason as { code?: string }).code, message: (result.reason as Error).message }
        : { replayed: result.value.replayed })),
    ).toBe(true);
    const values = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
    expect(values.map((value) => value.replayed).sort()).toEqual([false, true]);
    expect(new Set(values.map((value) => value.opsMission.missionId)).size).toBe(1);
    expect(sqlite.raw.prepare("SELECT count(*) AS count FROM agent_mission").get()).toEqual({ count: 2 });
  });

  it("stops at the explicit fixture timeout with zero automatic retry", async () => {
    await enableAll(sqlite);
    const timedOut = {
      ...context("run-explicit-timeout"),
      clock: () => "2026-08-19T08:00:31.000Z",
    };
    await expect(runAgenticBriefing(sqlite.asD1(), {
      fixtureOnly: true,
      fixtureId: AGENTIC_A1_FIXTURE_ID,
    }, timedOut)).rejects.toMatchObject({ code: "CP_TIMEOUT", status: 409 });
    expect(sqlite.raw.prepare(`
      SELECT status, error_code, attempt_no FROM agent_mission
    `).get()).toEqual({ status: "failed", error_code: "CP_TIMEOUT", attempt_no: 1 });
    expect(sqlite.raw.prepare("SELECT count(*) AS count FROM agent_mission").get()).toEqual({ count: 1 });
  });

  it("never resurfaces an older COS briefing after a newer OPS mission fails before COS", async () => {
    await enableAll(sqlite);
    const successful = await runAgenticBriefing(sqlite.asD1(), {
      fixtureOnly: true,
      fixtureId: AGENTIC_A1_FIXTURE_ID,
    }, context("run-before-later-ops-failure"));
    expect(successful.briefing.state).toBe("available");

    await expect(runAgenticBriefing(sqlite.asD1(), {
      fixtureOnly: true,
      fixtureId: AGENTIC_A1_FIXTURE_ID,
    }, {
      ...context("run-later-ops-timeout"),
      clock: () => "2026-08-19T08:00:31.000Z",
    })).rejects.toMatchObject({ code: "CP_TIMEOUT", status: 409 });

    await expect(getCurrentAgenticBriefing(sqlite.asD1())).resolves.toMatchObject({
      state: "failed",
      items: [],
      reasonCode: "CP_TIMEOUT",
    });
  });

  it("rejects non-fixture execution before writing anything", async () => {
    await expect(runAgenticBriefing(sqlite.asD1(), {
      fixtureOnly: false,
      fixtureId: "production",
    } as never, context("run-forbidden-real-scope"))).rejects.toMatchObject({ code: "CP_SCOPE_VIOLATION", status: 403 });
    expect(sqlite.raw.prepare("SELECT count(*) AS count FROM agent_mission").get()).toEqual({ count: 0 });
    expect((await listAgenticSwitches(sqlite.asD1())).every((entry) => entry.effectiveState === "stopped")).toBe(true);
  });
});
