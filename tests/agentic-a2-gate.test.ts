import { describe, expect, it } from "vitest";
import { onRequest } from "../functions/api/cockpit/[[path]]";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { SqliteD1 } from "../src/lib/cockpit/server/testing/sqlite-d1";
import { presentBriefing } from "../src/scripts/cockpit/agentic-briefing-presenter";

const ORIGIN = "http://127.0.0.1:8788";
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
const PREVIEW_D1_ID = "00000000-1111-2222-3333-444444444444";
const FIXTURE = { fixtureOnly: true, fixtureId: "agentic-a1-v1" } as const;
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

function environment(database: SqliteD1, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ...secrets,
    COCKPIT_LOCAL_BYPASS: "1",
    COCKPIT_AGENTIC_FIXTURE_ONLY: "1",
    COCKPIT_DB: database.asD1(),
    COCKPIT_AGENTIC_PREVIEW_ENFORCED: "1",
    COCKPIT_AGENTIC_PREVIEW_D1_ID: PREVIEW_D1_ID,
    COCKPIT_AGENTIC_PREVIEW_D1_ALLOWLIST: PREVIEW_D1_ID,
    COCKPIT_ENVIRONMENT: "preview",
    ...overrides,
  };
}

function call(path: string, request: Request, env: Record<string, unknown>): Promise<Response> {
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
): Promise<Response> {
  return call(path, new Request(`${ORIGIN}/api/cockpit/${path}`, {
    method: "POST",
    headers: {
      Origin: ORIGIN,
      "Content-Type": "application/json",
      "X-LEVOIS-CSRF": token,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  }), env);
}

describe("agentic A2 preview canary", () => {
  it("refuses agentic access when preview guard is enabled but env is wrong", async () => {
    const database = databaseWithAgenticFixtures();
    const env = environment(database, {
      COCKPIT_ENVIRONMENT: "production",
    });
    const current = await call("agentic/briefing/current", new Request(`${ORIGIN}/api/cockpit/agentic/briefing/current`), env);
    expect(current.status).toBe(403);
    expect(await current.json()).toMatchObject({ error: { code: "CP_SCOPE_VIOLATION" } });
    const run = await call("agentic/briefing/run", new Request(`${ORIGIN}/api/cockpit/agentic/briefing/run`), env);
    expect(run.status).toBe(403);
    expect(await run.json()).toMatchObject({ error: { code: "CP_SCOPE_VIOLATION" } });
    database.close();
  });

  it("refuses agentic access when the bound preview D1 id is missing", async () => {
    const database = databaseWithAgenticFixtures();
    const env = environment(database, {
      COCKPIT_AGENTIC_PREVIEW_D1_ID: "",
      COCKPIT_AGENTIC_PREVIEW_D1_ALLOWLIST: PREVIEW_D1_ID,
    });
    const current = await call("agentic/briefing/current", new Request(`${ORIGIN}/api/cockpit/agentic/briefing/current`), env);
    expect(current.status).toBe(503);
    expect(await current.json()).toMatchObject({ error: { code: "CP_CONFIG_INCOMPLETE" } });
    database.close();
  });

  it("refuses agentic access when D1 id is not allowlisted", async () => {
    const database = databaseWithAgenticFixtures();
    const env = environment(database, {
      COCKPIT_AGENTIC_PREVIEW_D1_ALLOWLIST: "11111111-1111-1111-1111-111111111111",
    });
    const current = await call("agentic/switches", new Request(`${ORIGIN}/api/cockpit/agentic/switches`), env);
    expect(current.status).toBe(403);
    expect(await current.json()).toMatchObject({ error: { code: "CP_SCOPE_VIOLATION" } });
    database.close();
  });

  it("accepts full A2 preview canary path and keeps fixture-only behavior", async () => {
    const database = databaseWithAgenticFixtures();
    const env = environment(database);
    const token = await csrf(env);

    for (const [index, scope] of SWITCHES.entries()) {
      const started = await post(env, token, `agentic/switches/${scope}/start`, {
        ...FIXTURE,
        expectedVersion: 0,
      }, `a2-start-${index}`);
      expect(started.status).toBe(200);
      expect(await started.json()).toMatchObject({ data: { effectiveState: "enabled", reasonCode: "human_start" } });
    }

    const run = await post(env, token, "agentic/briefing/run", FIXTURE, "a2-run-001");
    const runBody = await run.clone().json() as Record<string, any>;
    if (run.status >= 300) {
      const missionRows = database.raw.prepare("SELECT id, status, result_status AS resultStatus, error_code AS errorCode, close_reason AS closeReason FROM agent_mission ORDER BY created_at").all();
      const traceRows = database.raw.prepare("SELECT mission_id AS missionId, entry_kind AS entryKind, error_code AS errorCode FROM agent_trace ORDER BY occurred_at").all();
      const switchRows = database.raw.prepare("SELECT scope_kind AS scopeKind, scope_key AS scopeKey, state, version FROM agent_control_switch ORDER BY scope_kind, scope_key").all();
      // eslint-disable-next-line no-console
      console.log("A2 run status", run.status, runBody, { missionRows, traceRows, switchRows });
    }
    expect(run.status).toBe(201);
    const runBodyObj = await run.json() as Record<string, any>;
    expect(runBodyObj.data.briefing).toMatchObject({ state: "available", itemCount: expect.any(Number), fixtureOnly: true, shadowMode: true });
    expect(presentBriefing(runBodyObj.data.briefing)).toMatchObject({ state: "available" });

    const current = await call("agentic/briefing/current", new Request(`${ORIGIN}/api/cockpit/agentic/briefing/current`), env);
    expect(current.status).toBe(200);
    expect((await current.json()) as Record<string, any>).toMatchObject({ data: { state: "available", fixtureOnly: true, shadowMode: true } });
    database.close();
  });

  it("rejects a short idempotency key before any agentic mission write", async () => {
    const database = databaseWithAgenticFixtures();
    const env = environment(database);
    const token = await csrf(env);

    const run = await post(env, token, "agentic/briefing/run", FIXTURE, "a2-run");

    expect(run.status).toBe(400);
    expect(await run.json()).toMatchObject({ error: { code: "CP_CONTRACT_INVALID" } });
    expect(database.raw.prepare("SELECT count(*) AS count FROM agent_mission").get()).toMatchObject({ count: 0 });
    database.close();
  });
});
