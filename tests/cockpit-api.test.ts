import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { onRequest } from "../functions/api/cockpit/[[path]]";
import { SqliteD1 } from "../src/lib/cockpit/server/testing/sqlite-d1";

const migrations = [
  "0001_cockpit_identity.sql",
  "0002_cockpit_projects.sql",
  "0003_cockpit_search_history.sql",
  "0004_cockpit_tim_core.sql",
  "0005_cockpit_workflow_tim_finance.sql",
  "0006_cockpit_governance_integrity.sql",
];

function databaseWithFixtures(): SqliteD1 {
  const database = new SqliteD1();
  for (const migration of migrations) {
    database.raw.exec(readFileSync(resolve(process.cwd(), "db/migrations", migration), "utf8"));
  }
  database.raw.exec(readFileSync(resolve(process.cwd(), "db/fixtures/cockpit-v1.sql"), "utf8"));
  return database;
}

const secrets = {
  COCKPIT_CSRF_SECRET: "test-only-csrf-secret-at-least-24-characters",
  COCKPIT_AUDIT_SECRET: "test-only-audit-secret-at-least-24-characters",
};

function call(path: string, request: Request, env: Record<string, unknown>) {
  return onRequest({ request, env, params: { path } } as never);
}

describe("private cockpit BFF", () => {
  it("fails closed without Access, including on localhost when bypass is absent", async () => {
    const response = await call("session", new Request("http://127.0.0.1:8788/api/cockpit/session"), secrets);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "ACCESS_REQUIRED" } });
  });

  it("allows the explicit local-only bypass and returns a short-lived CSRF token", async () => {
    const response = await call("session", new Request("http://127.0.0.1:8788/api/cockpit/session"), {
      ...secrets,
      COCKPIT_LOCAL_BYPASS: "1",
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    const payload = await response.json() as Record<string, any>;
    expect(payload.data.actor.local).toBe(true);
    expect(payload.data.csrfToken).toMatch(/^\d+\.[a-f0-9]{64}$/);
  });

  it("distinguishes an unavailable database from an empty queue", async () => {
    const noDatabase = await call("today", new Request("http://127.0.0.1:8788/api/cockpit/today"), {
      ...secrets,
      COCKPIT_LOCAL_BYPASS: "1",
    });
    expect(noDatabase.status).toBe(503);
    expect(await noDatabase.json()).toMatchObject({ error: { code: "DB_UNAVAILABLE" } });

    const sqlite = databaseWithFixtures();
    const available = await call("today", new Request("http://127.0.0.1:8788/api/cockpit/today"), {
      ...secrets,
      COCKPIT_LOCAL_BYPASS: "1",
      COCKPIT_DB: sqlite.asD1(),
    });
    expect(available.status).toBe(200);
    const body = await available.json() as Record<string, any>;
    expect(body.data.actionsToday).toBeInstanceOf(Array);
    expect(body.data.withoutNextAction).toBeInstanceOf(Array);
    sqlite.close();
  });

  it("rejects a mutation with a foreign Origin before touching D1", async () => {
    const sqlite = databaseWithFixtures();
    const response = await call("lab/create", new Request("http://127.0.0.1:8788/api/cockpit/lab/create", {
      method: "POST",
      headers: { Origin: "https://attacker.invalid", "Content-Type": "application/json" },
      body: JSON.stringify({ observation: "Texte fictif" }),
    }), {
      ...secrets,
      COCKPIT_LOCAL_BYPASS: "1",
      COCKPIT_DB: sqlite.asD1(),
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: "ORIGIN_INVALID" } });
    expect((sqlite.raw.prepare("SELECT count(*) AS count FROM lab_observation").get() as { count: number }).count).toBe(1);
    sqlite.close();
  });

  it("executes a same-origin mutation with the real session CSRF token", async () => {
    const sqlite = databaseWithFixtures();
    const env = {
      ...secrets,
      COCKPIT_LOCAL_BYPASS: "1",
      COCKPIT_DB: sqlite.asD1(),
    };
    const session = await call("session", new Request("http://127.0.0.1:8788/api/cockpit/session"), env);
    const sessionPayload = await session.json() as Record<string, any>;
    const response = await call("lab/create", new Request("http://127.0.0.1:8788/api/cockpit/lab/create", {
      method: "POST",
      headers: {
        Origin: "http://127.0.0.1:8788",
        "Content-Type": "application/json",
        "X-LEVOIS-CSRF": sessionPayload.data.csrfToken,
        "Idempotency-Key": "bff-lab-create-001",
      },
      body: JSON.stringify({
        observation: "Observation BFF entièrement fictive",
        problem: "Problème fictif",
        insight: "Enseignement fictif",
        proposal: "Proposition fictive",
        status: "captured",
      }),
    }), env);
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ ok: true, data: { replayed: false } });
    expect((sqlite.raw.prepare("SELECT count(*) AS count FROM lab_observation").get() as { count: number }).count).toBe(2);
    sqlite.close();
  });

  it("binds idempotency to the resource path and rejects reuse on another project", async () => {
    const sqlite = databaseWithFixtures();
    const env = {
      ...secrets,
      COCKPIT_LOCAL_BYPASS: "1",
      COCKPIT_DB: sqlite.asD1(),
    };
    const session = await call("session", new Request("http://127.0.0.1:8788/api/cockpit/session"), env);
    const csrfToken = ((await session.json()) as Record<string, any>).data.csrfToken as string;
    const payload = JSON.stringify({ title: "Action BFF fictive", priority: "normal", isNextAction: false, expectedVersion: 1 });
    const mutate = (projectId: string) => call(`projects/${projectId}/tasks/create`, new Request(
      `http://127.0.0.1:8788/api/cockpit/projects/${projectId}/tasks/create`, {
        method: "POST",
        headers: {
          Origin: "http://127.0.0.1:8788",
          "Content-Type": "application/json",
          "X-LEVOIS-CSRF": csrfToken,
          "Idempotency-Key": "bff-cross-resource-001",
        },
        body: payload,
      },
    ), env);
    expect((await mutate("demo-project-buyer-001")).status).toBe(201);
    const collision = await mutate("demo-project-seller-001");
    expect(collision.status).toBe(409);
    expect(await collision.json()).toMatchObject({ error: { code: "IDEMPOTENCY_CONFLICT" } });
    sqlite.close();
  });

  it("rejects an oversized JSON body even when Content-Length is absent", async () => {
    const sqlite = databaseWithFixtures();
    const env = {
      ...secrets,
      COCKPIT_LOCAL_BYPASS: "1",
      COCKPIT_DB: sqlite.asD1(),
    };
    const session = await call("session", new Request("http://127.0.0.1:8788/api/cockpit/session"), env);
    const csrfToken = ((await session.json()) as Record<string, any>).data.csrfToken as string;
    const response = await call("lab/create", new Request("http://127.0.0.1:8788/api/cockpit/lab/create", {
      method: "POST",
      headers: {
        Origin: "http://127.0.0.1:8788",
        "Content-Type": "application/json",
        "X-LEVOIS-CSRF": csrfToken,
        "Idempotency-Key": "bff-oversized-body-001",
      },
      body: JSON.stringify({ observation: "x".repeat(1_000_100) }),
    }), env);
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ error: { code: "PAYLOAD_TOO_LARGE" } });
    sqlite.close();
  });
});
