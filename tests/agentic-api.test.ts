import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { assertAgenticOwner } from "../functions/_lib/cockpit/agentic";
import { onRequest } from "../functions/api/cockpit/[[path]]";
import {
  createStoredMission,
  type StoredMission,
} from "../src/lib/cockpit/server/agentic-store";
import { SqliteD1 } from "../src/lib/cockpit/server/testing/sqlite-d1";
import { presentBriefing } from "../src/scripts/cockpit/agentic-briefing-presenter";

const ORIGIN = "http://127.0.0.1:8788";
const FIXTURE = { fixtureOnly: true, fixtureId: "agentic-a1-v1" } as const;
const SWITCHES = [
  "global",
  "agent/OPS-01",
  "agent/COS-01",
  "capability/ops.read_snapshot",
  "capability/ops.evaluate_rules",
  "capability/cos.read_ops_results",
  "capability/cos.deduplicate",
  "capability/cos.rank",
  "capability/cos.compose_briefing",
] as const;

const secrets = {
  COCKPIT_CSRF_SECRET: "test-only-csrf-secret-at-least-24-characters",
  COCKPIT_AUDIT_SECRET: "test-only-audit-secret-at-least-24-characters",
};

function databaseWithAgenticFixtures(): SqliteD1 {
  const database = new SqliteD1();
  const directory = resolve(process.cwd(), "db/migrations");
  for (const migration of readdirSync(directory).filter((name) => /^\d+.*\.sql$/.test(name)).sort()) {
    database.raw.exec(readFileSync(resolve(directory, migration), "utf8"));
  }
  database.raw.exec(readFileSync(resolve(process.cwd(), "db/fixtures/agentic-a1.sql"), "utf8"));
  return database;
}

function environment(database: SqliteD1, fixtureGate = true): Record<string, unknown> {
  return {
    ...secrets,
    COCKPIT_LOCAL_BYPASS: "1",
    ...(fixtureGate ? { COCKPIT_AGENTIC_FIXTURE_ONLY: "1" } : {}),
    COCKPIT_DB: database.asD1(),
  };
}

function call(path: string, request: Request, env: Record<string, unknown>) {
  return onRequest({ request, env, params: { path } } as never);
}

async function csrf(env: Record<string, unknown>): Promise<string> {
  const response = await call("session", new Request(`${ORIGIN}/api/cockpit/session`), env);
  expect(response.status).toBe(200);
  return ((await response.json()) as { data: { csrfToken: string } }).data.csrfToken;
}

async function post(
  env: Record<string, unknown>,
  token: string,
  path: string,
  payload: unknown,
  idempotencyKey: string,
  origin = ORIGIN,
): Promise<Response> {
  return call(path, new Request(`${ORIGIN}/api/cockpit/${path}`, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "X-LEVOIS-CSRF": token,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  }), env);
}

async function startAll(env: Record<string, unknown>, token: string): Promise<void> {
  for (const [index, scope] of SWITCHES.entries()) {
    const response = await post(env, token, `agentic/switches/${scope}/start`, {
      ...FIXTURE,
      expectedVersion: 0,
    }, `start-a1-${index}`);
    expect(response.status, JSON.stringify(await response.clone().json())).toBe(200);
    expect(await response.json()).toMatchObject({ data: { effectiveState: "enabled", fixtureOnly: true } });
  }
}

function businessState(database: SqliteD1): string {
  const tables = ["project", "task", "interaction", "advisor_profile", "tim_agreement", "tim_agreement_party"];
  return JSON.stringify(Object.fromEntries(tables.map((table) => [
    table,
    database.raw.prepare(`SELECT * FROM ${table} ORDER BY id`).all(),
  ])));
}

function collectKeys(value: unknown, result = new Set<string>()): Set<string> {
  if (Array.isArray(value)) for (const item of value) collectKeys(item, result);
  else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      result.add(key);
      collectKeys(item, result);
    }
  }
  return result;
}

async function seedDraftMission(database: SqliteD1, id = "amission-cancel-fixture"): Promise<void> {
  const mission: StoredMission = {
    missionId: id,
    missionType: "ops.shadow_scan.v1",
    logicalAgent: "OPS-01",
    capabilities: ["ops.read_snapshot", "ops.evaluate_rules"],
    contractVersion: "a1.v1",
    objectiveCode: "OPS_SHADOW_SCAN",
    objective: "Objectif déterministe fixture.",
    status: "draft",
    priority: "normal",
    trigger: { kind: "manual", ref: "fixture-seed", actorId: "local:operator" },
    source: {
      kind: "fixture_request",
      ref: "agentic-a1-v1",
      version: "a1.v1",
      hash: "sha256:fixture-source",
      operationalWatermark: "WM_PENDING_FIXTURE",
    },
    idempotencyKey: `seed-${id}`,
    inputHash: "sha256:fixture-input",
    correlationId: `acorr-${id}`,
    causationId: "local:operator",
    createdAt: "2026-08-19T08:00:00.000Z",
    timeoutAt: "2026-08-20T08:00:00.000Z",
    attemptNo: 1,
    executionEpoch: 1,
    restoreEpoch: 1,
    logicalBudget: { sourceRows: 100, ruleEvaluations: 100, findings: 100, briefingItems: 1, traceEntries: 100 },
    logicalUsage: {},
    resultStatus: "pending",
    resultTotalCount: 0,
    resultSelectedCount: 0,
    resultOmittedCount: 0,
    policyVersion: "policy-a1.v1",
    autonomyLevel: "L0",
    fixtureOnly: true,
    version: 1,
  };
  await createStoredMission(database.asD1(), mission, {
    entryKind: "mission_created",
    occurredAt: mission.createdAt,
    actorKind: "human",
    actorId: "local:operator",
    agentId: "OPS-01",
    fromStatus: null,
    toStatus: "draft",
    payloadHash: `sha256:seed-${id}`,
    policyVersion: mission.policyVersion,
  });
}

describe("private A1 agentic BFF", () => {
  it("requires the one configured owner outside the explicit local bypass", () => {
    expect(() => assertAgenticOwner(
      { id: "owner-sub", email: "owner@example.invalid", local: false },
      { COCKPIT_ALLOWED_SUB: "owner-sub" },
    )).not.toThrow();
    expect(() => assertAgenticOwner(
      { id: "owner-sub", email: "owner@example.invalid", local: false },
      { COCKPIT_ALLOWED_SUB: "owner-sub,second-sub" },
    )).toThrowError(expect.objectContaining({ code: "AGENTIC_OWNER_REQUIRED", status: 403 }));
    expect(() => assertAgenticOwner(
      { id: "owner-sub", email: "owner@example.invalid", local: false },
      { COCKPIT_ALLOWED_SUB: "another-sub" },
    )).toThrowError(expect.objectContaining({ code: "AGENTIC_OWNER_REQUIRED", status: 403 }));
    expect(() => assertAgenticOwner(
      { id: "local:operator", email: "local@cockpit.invalid", local: true },
      {},
    )).not.toThrow();
  });

  it("fails closed without the fixture gate and never treats an old result or switch as active", async () => {
    const database = databaseWithAgenticFixtures();
    await seedDraftMission(database, "amission-hidden-fixture");
    const openEnv = environment(database, true);
    const token = await csrf(openEnv);
    const started = await post(openEnv, token, "agentic/switches/global/start", {
      ...FIXTURE,
      expectedVersion: 0,
    }, "fixture-gate-old-switch");
    expect(started.status).toBe(200);

    const closedEnv = environment(database, false);
    const closedToken = await csrf(closedEnv);
    const current = await call("agentic/briefing/current", new Request(`${ORIGIN}/api/cockpit/agentic/briefing/current`), closedEnv);
    expect(await current.json()).toMatchObject({ data: { state: "stopped", items: [] } });
    const switches = await call("agentic/switches", new Request(`${ORIGIN}/api/cockpit/agentic/switches`), closedEnv);
    expect(switches.status).toBe(403);
    expect(await switches.json()).toMatchObject({ error: { code: "CP_SCOPE_VIOLATION" } });

    const mission = await call(
      "agentic/missions/amission-hidden-fixture",
      new Request(`${ORIGIN}/api/cockpit/agentic/missions/amission-hidden-fixture`),
      closedEnv,
    );
    expect(mission.status).toBe(403);
    expect(await mission.json()).toMatchObject({ error: { code: "CP_SCOPE_VIOLATION" } });

    const trace = await call(
      "agentic/missions/amission-hidden-fixture/trace",
      new Request(`${ORIGIN}/api/cockpit/agentic/missions/amission-hidden-fixture/trace`),
      closedEnv,
    );
    expect(trace.status).toBe(403);
    expect(await trace.json()).toMatchObject({ error: { code: "CP_SCOPE_VIOLATION" } });

    const refused = await post(closedEnv, closedToken, "agentic/briefing/run", FIXTURE, "fixture-gate-refused-run");
    expect(refused.status).toBe(403);
    expect(await refused.json()).toMatchObject({ error: { code: "CP_SCOPE_VIOLATION" } });
    expect((database.raw.prepare("SELECT count(*) AS count FROM agent_mission").get() as { count: number }).count).toBe(1);
    database.close();
  });

  it("enforces CSRF, closed payloads, bounded bodies, known scopes and required versions", async () => {
    const database = databaseWithAgenticFixtures();
    const env = environment(database);
    const token = await csrf(env);

    const foreign = await post(env, token, "agentic/switches/global/start", {
      ...FIXTURE,
      expectedVersion: 0,
    }, "foreign-origin", "https://attacker.invalid");
    expect(foreign.status).toBe(403);
    expect(await foreign.json()).toMatchObject({ error: { code: "ORIGIN_INVALID" } });

    const unknownField = await post(env, token, "agentic/briefing/run", { ...FIXTURE, capability: "project.update" }, "unknown-field");
    expect(unknownField.status).toBe(400);
    expect(await unknownField.json()).toMatchObject({ error: { code: "CP_CONTRACT_INVALID" } });

    const unknownCapability = await post(env, token, "agentic/switches/capability/project.update/start", {
      ...FIXTURE,
      expectedVersion: 0,
    }, "unknown-capability");
    expect(unknownCapability.status).toBe(400);
    expect(await unknownCapability.json()).toMatchObject({ error: { code: "CP_SCOPE_VIOLATION" } });

    const unknownAgent = await post(env, token, "agentic/switches/agent/BUY-01/start", {
      ...FIXTURE,
      expectedVersion: 0,
    }, "unknown-agent");
    expect(unknownAgent.status).toBe(400);
    expect(await unknownAgent.json()).toMatchObject({ error: { code: "CP_SCOPE_VIOLATION" } });

    const wrongFixture = await post(env, token, "agentic/briefing/run", {
      fixtureOnly: false,
      fixtureId: "agentic-a1-v1",
    }, "wrong-fixture");
    expect(wrongFixture.status).toBe(403);
    expect(await wrongFixture.json()).toMatchObject({ error: { code: "CP_SCOPE_VIOLATION" } });

    const versionMissing = await post(env, token, "agentic/switches/global/start", FIXTURE, "missing-version");
    expect(versionMissing.status).toBe(400);
    expect(await versionMissing.json()).toMatchObject({ error: { code: "CP_CONTRACT_INVALID" } });

    const oversized = await post(env, token, "agentic/briefing/run", {
      ...FIXTURE,
      extra: "x".repeat(17_000),
    }, "oversized");
    expect(oversized.status).toBe(413);

    const before = businessState(database);
    const fakeBusinessRoute = await post(env, token, "agentic/projects/PRJ-FX-A/tasks/create", { title: "forbidden" }, "no-business-route");
    expect(fakeBusinessRoute.status).toBe(404);
    expect(businessState(database)).toBe(before);
    database.close();
  });

  it("rejects phone-shaped PII in every agentic idempotency key before switch or mission writes", async () => {
    const database = databaseWithAgenticFixtures();
    await seedDraftMission(database, "amission-pii-canary");
    const env = environment(database);
    const token = await csrf(env);

    const switchCanary = await post(env, token, "agentic/switches/global/start", {
      ...FIXTURE,
      expectedVersion: 0,
    }, "0612345678");
    expect(switchCanary.status).toBe(400);
    expect(await switchCanary.json()).toMatchObject({ error: { code: "CP_PII_POLICY_VIOLATION" } });
    expect((database.raw.prepare("SELECT count(*) AS count FROM agent_control_switch").get() as { count: number }).count).toBe(0);

    const cancelCanary = await post(env, token, "agentic/missions/amission-pii-canary/cancel", {
      expectedVersion: 1,
    }, "06.12.34.56.78");
    expect(cancelCanary.status).toBe(400);
    expect(await cancelCanary.json()).toMatchObject({ error: { code: "CP_PII_POLICY_VIOLATION" } });
    expect(database.raw.prepare("SELECT status FROM agent_mission WHERE id = ?").get("amission-pii-canary")).toMatchObject({ status: "draft" });
    expect((database.raw.prepare("SELECT count(*) AS count FROM agent_trace WHERE mission_id = ?").get("amission-pii-canary") as { count: number }).count).toBe(1);
    database.close();
  });

  it("reports all missing switches as stopped", async () => {
    const database = databaseWithAgenticFixtures();
    const env = environment(database);
    const response = await call("agentic/switches", new Request(`${ORIGIN}/api/cockpit/agentic/switches`), env);
    expect(response.status).toBe(200);
    const payload = await response.json() as { data: { items: Array<Record<string, unknown>> } };
    expect(payload.data.items).toHaveLength(9);
    expect(payload.data.items.every((item) => item.present === false && item.effectiveState === "stopped" && item.version === 0)).toBe(true);

    const token = await csrf(env);
    for (const [index, scope] of SWITCHES.entries()) {
      const started = await post(env, token, `agentic/switches/${scope}/start`, {
        ...FIXTURE,
        expectedVersion: 0,
      }, `all-scopes-start-${index}`);
      expect(started.status).toBe(200);
      expect(await started.json()).toMatchObject({ data: { effectiveState: "enabled", version: 1 } });
      const stopped = await post(env, token, `agentic/switches/${scope}/stop`, {
        ...FIXTURE,
        expectedVersion: 1,
      }, `all-scopes-stop-${index}`);
      expect(stopped.status).toBe(200);
      expect(await stopped.json()).toMatchObject({ data: { effectiveState: "stopped", version: 2 } });
    }
    const final = await call("agentic/switches", new Request(`${ORIGIN}/api/cockpit/agentic/switches`), env);
    const finalPayload = await final.json() as { data: { items: Array<Record<string, unknown>> } };
    expect(finalPayload.data.items.every((item) => item.present === true && item.effectiveState === "stopped" && item.version === 2)).toBe(true);
    database.close();
  });

  it("runs OPS/COS idempotently, exposes a redacted audit and never mutates business tables", async () => {
    const database = databaseWithAgenticFixtures();
    const env = environment(database);
    const token = await csrf(env);
    await startAll(env, token);
    const beforeBusiness = businessState(database);

    const first = await post(env, token, "agentic/briefing/run", FIXTURE, "briefing-double-click");
    expect(first.status, JSON.stringify(await first.clone().json())).toBe(201);
    const firstBody = await first.json() as Record<string, any>;
    expect(firstBody.data.replayed).toBe(false);
    expect(firstBody.data.briefing.items.length).toBeLessThanOrEqual(7);
    expect(firstBody.data.briefing.items.length).toBeGreaterThan(0);
    expect(presentBriefing(firstBody.data.briefing)).toMatchObject({ state: "available" });
    for (const item of firstBody.data.briefing.items) {
      expect(item).toMatchObject({
        explanation: expect.any(String),
        suggestedHumanAction: expect.any(String),
        primaryRuleId: expect.stringMatching(/^OPS-[A-Z0-9-]+-\d{3}$/),
        source: {
          sourceOpsMissionId: expect.any(String),
          snapshotId: expect.any(String),
          operationalWatermark: expect.any(String),
        },
      });
    }

    const second = await post(env, token, "agentic/briefing/run", FIXTURE, "briefing-double-click");
    expect(second.status).toBe(200);
    const secondBody = await second.json() as Record<string, any>;
    expect(secondBody.data.replayed).toBe(true);
    expect(secondBody.data.opsMission.missionId).toBe(firstBody.data.opsMission.missionId);
    expect(secondBody.data.cosMission.missionId).toBe(firstBody.data.cosMission.missionId);
    expect((database.raw.prepare("SELECT count(*) AS count FROM agent_mission").get() as { count: number }).count).toBe(2);

    const countBeforeRead = (database.raw.prepare("SELECT count(*) AS count FROM agent_mission").get() as { count: number }).count;
    const current = await call("agentic/briefing/current", new Request(`${ORIGIN}/api/cockpit/agentic/briefing/current`), env);
    expect(current.status).toBe(200);
    expect((await current.json()) as Record<string, any>).toMatchObject({ data: { fixtureOnly: true, shadowMode: true } });
    expect((database.raw.prepare("SELECT count(*) AS count FROM agent_mission").get() as { count: number }).count).toBe(countBeforeRead);

    const missionId = firstBody.data.opsMission.missionId as string;
    const mission = await call(`agentic/missions/${missionId}`, new Request(`${ORIGIN}/api/cockpit/agentic/missions/${missionId}`), env);
    const missionBody = await mission.json() as Record<string, any>;
    expect(missionBody.data).toMatchObject({
      missionId,
      capabilities: ["ops.read_snapshot", "ops.evaluate_rules"],
      objectiveCode: "OPS_SHADOW_SCAN",
      attemptNo: 1,
      fixtureOnly: true,
    });
    const missionKeys = collectKeys(missionBody);
    for (const forbidden of ["objective", "inputHash", "payloadHash", "resultHash", "email"]) expect(missionKeys.has(forbidden)).toBe(false);

    const trace = await call(
      `agentic/missions/${missionId}/trace`,
      new Request(`${ORIGIN}/api/cockpit/agentic/missions/${missionId}/trace?limit=2&cursor=0`),
      env,
    );
    const traceBody = await trace.json() as Record<string, any>;
    expect(traceBody.data.items).toHaveLength(2);
    expect(traceBody.data.nextCursor).toEqual(expect.any(Number));
    expect(traceBody.data.items[0]).toMatchObject({ correlationId: expect.any(String), logicalUsageDelta: expect.any(Object) });
    const traceKeys = collectKeys(traceBody);
    for (const forbidden of ["inputHash", "payloadHash", "resultHash", "actorId", "email", "metadataJson"]) expect(traceKeys.has(forbidden)).toBe(false);

    const serialized = JSON.stringify(firstBody);
    for (const forbiddenValue of ["Conseiller fixture", "Accord fixture", "Fixture structurelle", "FIXTURE_OVERDUE"]) {
      expect(serialized).not.toContain(forbiddenValue);
    }
    expect(businessState(database)).toBe(beforeBusiness);

    database.raw.prepare("UPDATE task SET updated_at = ?, version = version + 1 WHERE id = ?")
      .run("2026-08-19T23:59:59.000Z", "TSK-FX-C");
    const stale = await call("agentic/briefing/current", new Request(`${ORIGIN}/api/cockpit/agentic/briefing/current`), env);
    const staleBody = await stale.json() as Record<string, any>;
    expect(staleBody).toMatchObject({ data: { state: "stale", items: [] } });
    expect(presentBriefing(staleBody.data)).toMatchObject({ state: "stale", items: [] });
    database.close();
  });

  it("cancels an active mission with optimistic versioning and audits the replay", async () => {
    const database = databaseWithAgenticFixtures();
    await seedDraftMission(database);
    const env = environment(database);
    const token = await csrf(env);
    const payload = { expectedVersion: 1 };
    const cancelled = await post(env, token, "agentic/missions/amission-cancel-fixture/cancel", payload, "cancel-fixture-mission");
    expect(cancelled.status, JSON.stringify(await cancelled.clone().json())).toBe(200);
    expect(await cancelled.json()).toMatchObject({ data: { status: "cancelled", closeReason: "human_cancelled", version: 2 } });
    const replay = await post(env, token, "agentic/missions/amission-cancel-fixture/cancel", payload, "cancel-fixture-mission");
    expect(replay.status).toBe(200);
    expect(await replay.json()).toMatchObject({ data: { status: "cancelled", version: 2 } });
    const traces = database.raw.prepare("SELECT entry_kind FROM agent_trace WHERE mission_id = ? ORDER BY sequence_no").all("amission-cancel-fixture") as Array<{ entry_kind: string }>;
    expect(traces.map((entry) => entry.entry_kind)).toEqual(["mission_created", "mission_cancelled"]);
    database.close();
  });

  it("stops a scope even when activation is closed and immediately cancels an active mission", async () => {
    const database = databaseWithAgenticFixtures();
    await seedDraftMission(database, "amission-kill-fixture");
    const env = environment(database, false);
    const token = await csrf(env);
    const stopped = await post(env, token, "agentic/switches/global/stop", {
      ...FIXTURE,
      expectedVersion: 0,
    }, "global-emergency-stop");
    expect(stopped.status, JSON.stringify(await stopped.clone().json())).toBe(200);
    expect(await stopped.json()).toMatchObject({ data: { effectiveState: "stopped", present: true } });
    expect(database.raw.prepare("SELECT status, close_reason FROM agent_mission WHERE id = ?").get("amission-kill-fixture"))
      .toMatchObject({ status: "cancelled", close_reason: "kill_switch" });
    database.close();
  });
});
