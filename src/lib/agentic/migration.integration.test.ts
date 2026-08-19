import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SqliteD1 } from "../cockpit/server/testing/sqlite-d1";

const MIGRATIONS_DIR = fileURLToPath(new URL("../../../db/migrations/", import.meta.url));
const AGENT_TABLES = [
  "agent_control_switch",
  "agent_cos_briefing_item",
  "agent_mission",
  "agent_ops_shadow_finding",
  "agent_trace",
] as const;

const migrations = readdirSync(MIGRATIONS_DIR)
  .filter((name) => /^\d{4}_.+\.sql$/.test(name))
  .sort();

function applyMigrations(database: SqliteD1, selected: readonly string[]): void {
  for (const name of selected) {
    database.raw.exec(readFileSync(`${MIGRATIONS_DIR}/${name}`, "utf8"));
  }
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function agentTableNames(database: SqliteD1): string[] {
  return (database.raw.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name LIKE 'agent_%'
    ORDER BY name
  `).all() as Array<{ name: string }>).map(({ name }) => name);
}

function businessSnapshot(database: SqliteD1): unknown {
  const tables = (database.raw.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
      AND name NOT LIKE 'agent_%'
    ORDER BY name
  `).all() as Array<{ name: string }>).map(({ name }) => name);

  return tables.map((table) => ({
    table,
    objects: database.raw.prepare(`
      SELECT type, name, tbl_name, sql
      FROM sqlite_master
      WHERE tbl_name = ? AND type IN ('table', 'index', 'trigger')
      ORDER BY type, name
    `).all(table),
    rows: database.raw.prepare(`SELECT * FROM ${quoteIdentifier(table)} ORDER BY rowid`).all(),
  }));
}

function insertBusinessFixtures(database: SqliteD1): void {
  database.raw.prepare(`
    INSERT INTO project (
      id, type, status, stage_key, objective, calendar_summary,
      responsible_actor_id, created_at, updated_at, version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "PRJ-FX-MIGRATION-001",
    "primary_residence_purchase",
    "active",
    "qualification",
    "Fixture structurelle",
    "",
    "ACTOR-FX-MOUAAD",
    "2030-01-15T08:00:00.000Z",
    "2030-01-15T08:00:00.000Z",
    1,
  );

  database.raw.prepare(`
    INSERT INTO task (
      id, project_id, title, status, priority, due_at, is_next_action,
      created_at, updated_at, created_by_actor_id, version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "TSK-FX-MIGRATION-001",
    "PRJ-FX-MIGRATION-001",
    "Action fictive",
    "open",
    "normal",
    "2030-01-16T08:00:00.000Z",
    1,
    "2030-01-15T08:00:00.000Z",
    "2030-01-15T08:00:00.000Z",
    "ACTOR-FX-MOUAAD",
    1,
  );
}

function insertOpsMission(database: SqliteD1, id = "MSN-FX-OPS-001"): void {
  database.raw.prepare(`
    INSERT INTO agent_mission (
      id, mission_type, agent_id, capabilities_json, objective_code, objective,
      priority, trigger_kind, trigger_ref, triggered_by_actor_id,
      source_kind, source_ref, source_version,
      idempotency_key, input_hash, correlation_id,
      created_at, timeout_at, logical_budget_json,
      policy_version, fixture_only
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    "ops.shadow_scan.v1",
    "OPS-01",
    '["ops.read_snapshot","ops.evaluate_rules"]',
    "OPS_SHADOW_SCAN",
    "Détecter les anomalies déterministes de la fixture.",
    "normal",
    "manual",
    `REQ-${id}`,
    "ACTOR-FX-MOUAAD",
    "fixture_request",
    "FIXTURE-A1",
    "fixture.v1",
    `IDEMPOTENCY-${id}`,
    `sha256:input-${id}`,
    `CORRELATION-${id}`,
    "2030-01-15T08:00:00.000Z",
    "2030-01-15T08:00:30.000Z",
    '{"source_rows":100,"rule_evaluations":7,"findings":20,"briefing_items":0,"trace_entries":100}',
    "policy-a1.v1",
    1,
  );
}

function advanceOpsMissionToRunning(database: SqliteD1, id = "MSN-FX-OPS-001"): void {
  database.raw.prepare(`
    UPDATE agent_mission
    SET status = 'planned', planned_at = ?, control_fingerprint = ?, version = 2
    WHERE id = ? AND version = 1
  `).run("2030-01-15T08:00:01.000Z", "CONTROL-FX-001", id);

  database.raw.prepare(`
    UPDATE agent_mission
    SET status = 'assigned', assigned_at = ?, version = 3
    WHERE id = ? AND version = 2
  `).run("2030-01-15T08:00:02.000Z", id);

  database.raw.prepare(`
    UPDATE agent_mission
    SET status = 'running', started_at = ?, snapshot_id = ?,
        operational_watermark = ?, as_of = ?, source_hash = ?, version = 4
    WHERE id = ? AND version = 3
  `).run(
    "2030-01-15T08:00:03.000Z",
    "SNAP-FX-001",
    "WM-FX-001",
    "2030-01-15T08:00:00.000Z",
    "sha256:source-fixture-001",
    id,
  );
}

describe("agentic A1 migration 0007", () => {
  it("applies migrations 0001 through 0007 on an empty SQLite D1", () => {
    const database = new SqliteD1();
    try {
      expect(migrations.at(-1)).toBe("0007_agentic_a1_control_plane.sql");
      applyMigrations(database, migrations);

      expect(agentTableNames(database)).toEqual(AGENT_TABLES);
      expect(database.raw.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
      expect(database.raw.prepare("PRAGMA integrity_check").get()).toEqual({ integrity_check: "ok" });
      expect(database.raw.prepare("SELECT count(*) AS count FROM agent_control_switch").get()).toEqual({ count: 0 });
    } finally {
      database.close();
    }
  });

  it("adds only agentic objects and leaves every business schema and row byte-stable", () => {
    const database = new SqliteD1();
    try {
      applyMigrations(database, migrations.slice(0, -1));
      insertBusinessFixtures(database);
      const before = businessSnapshot(database);

      applyMigrations(database, [migrations.at(-1)!]);

      expect(businessSnapshot(database)).toEqual(before);
      expect(agentTableNames(database)).toEqual(AGENT_TABLES);

      const foreignTargets = AGENT_TABLES.flatMap((table) =>
        (database.raw.prepare(`PRAGMA foreign_key_list(${quoteIdentifier(table)})`).all() as Array<{ table: string }>)
          .map((row) => row.table),
      );
      expect(foreignTargets.every((table) => AGENT_TABLES.includes(table as typeof AGENT_TABLES[number]))).toBe(true);

      const triggerTargets = database.raw.prepare(`
        SELECT DISTINCT tbl_name
        FROM sqlite_master
        WHERE type = 'trigger' AND name LIKE 'agent_%'
        ORDER BY tbl_name
      `).all() as Array<{ tbl_name: string }>;
      expect(triggerTargets.every(({ tbl_name }) => AGENT_TABLES.includes(tbl_name as typeof AGENT_TABLES[number]))).toBe(true);
    } finally {
      database.close();
    }
  });

  it("enforces the canonical mission capability sets and permits atomic versioned transitions", () => {
    const database = new SqliteD1();
    try {
      applyMigrations(database, migrations);
      insertOpsMission(database);
      advanceOpsMissionToRunning(database);

      expect(database.raw.prepare("SELECT status, version FROM agent_mission WHERE id = ?").get("MSN-FX-OPS-001"))
        .toEqual({ status: "running", version: 4 });

      expect(() => database.raw.prepare(`
        UPDATE agent_mission SET status = 'waiting_input', version = 5 WHERE id = ?
      `).run("MSN-FX-OPS-001")).toThrow();

      expect(() => insertOpsMission(database, "MSN-FX-OPS-002")).not.toThrow();
      expect(() => database.raw.prepare(`
        UPDATE agent_mission
        SET capabilities_json = '["ops.read_snapshot"]', version = 2
        WHERE id = 'MSN-FX-OPS-002'
      `).run()).toThrow();
    } finally {
      database.close();
    }
  });

  it("prevents terminal reopening and preserves the append-only ledger", () => {
    const database = new SqliteD1();
    try {
      applyMigrations(database, migrations);
      insertOpsMission(database);
      advanceOpsMissionToRunning(database);

      database.raw.prepare(`
        UPDATE agent_mission
        SET status = 'completed', finished_at = ?, close_reason = 'completed',
            result_status = 'valid', result_kind = 'ops_findings',
            result_schema_version = 1, result_hash = ?, version = 5
        WHERE id = ? AND version = 4
      `).run("2030-01-15T08:00:04.000Z", "sha256:result-fixture-001", "MSN-FX-OPS-001");

      expect(() => database.raw.prepare(`
        UPDATE agent_mission
        SET status = 'planned', finished_at = NULL, close_reason = NULL,
            result_status = 'pending', result_kind = NULL, result_hash = NULL, version = 6
        WHERE id = ?
      `).run("MSN-FX-OPS-001")).toThrow();

      database.raw.prepare(`
        INSERT INTO agent_trace (
          id, stream_kind, stream_id, sequence_no, mission_id,
          occurred_at, correlation_id, actor_kind, actor_id, agent_id,
          entry_kind, attempt_no, execution_epoch, restore_epoch,
          idempotency_key, payload_hash, policy_version, redaction_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "TRACE-FX-001", "mission", "MSN-FX-OPS-001", 1, "MSN-FX-OPS-001",
        "2030-01-15T08:00:04.000Z", "CORRELATION-MSN-FX-OPS-001",
        "control_plane", "CONTROL-PLANE-A1", "OPS-01", "mission_closed",
        1, 1, 1, "TRACE-IDEMPOTENCY-FX-001", "sha256:trace-payload-001",
        "policy-a1.v1", "redaction-a1.v1",
      );

      expect(() => database.raw.prepare("UPDATE agent_trace SET outcome_code = 'changed' WHERE id = ?")
        .run("TRACE-FX-001")).toThrow();
      expect(() => database.raw.prepare("DELETE FROM agent_trace WHERE id = ?")
        .run("TRACE-FX-001")).toThrow();
    } finally {
      database.close();
    }
  });

  it("audits a switch command without inventing a sixth table or mission", () => {
    const database = new SqliteD1();
    try {
      applyMigrations(database, migrations);
      database.raw.prepare(`
        INSERT INTO agent_control_switch (
          id, scope_kind, scope_key, state, reason_code,
          decided_by_actor_id, decided_at, idempotency_key, payload_hash, fixture_only
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "SWITCH-FX-GLOBAL", "global", "global", "stopped", "human_stop",
        "ACTOR-FX-MOUAAD", "2030-01-15T08:00:00.000Z",
        "SWITCH-IDEMPOTENCY-FX-001", "sha256:switch-payload-001", 1,
      );

      database.raw.prepare(`
        INSERT INTO agent_trace (
          id, stream_kind, stream_id, sequence_no, switch_id,
          occurred_at, correlation_id, actor_kind, actor_id,
          entry_kind, restore_epoch, idempotency_key, payload_hash,
          policy_version, redaction_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "TRACE-FX-SWITCH-001", "control_switch", "SWITCH-FX-GLOBAL", 1,
        "SWITCH-FX-GLOBAL", "2030-01-15T08:00:00.000Z", "CORRELATION-SWITCH-FX-001",
        "human", "ACTOR-FX-MOUAAD", "switch_applied", 1,
        "TRACE-IDEMPOTENCY-SWITCH-001", "sha256:trace-switch-payload-001",
        "policy-a1.v1", "redaction-a1.v1",
      );

      expect(database.raw.prepare(`
        SELECT stream_kind, mission_id, switch_id FROM agent_trace WHERE id = ?
      `).get("TRACE-FX-SWITCH-001")).toEqual({
        stream_kind: "control_switch",
        mission_id: null,
        switch_id: "SWITCH-FX-GLOBAL",
      });
      expect(agentTableNames(database)).toEqual(AGENT_TABLES);
    } finally {
      database.close();
    }
  });

  it("keeps intake rule 004 coverage-only and rejects a persisted finding", () => {
    const database = new SqliteD1();
    try {
      applyMigrations(database, migrations);
      insertOpsMission(database);
      advanceOpsMissionToRunning(database);

      expect(() => database.raw.prepare(`
        INSERT INTO agent_ops_shadow_finding (
          id, mission_id, observation_fingerprint, rule_id, reason_code,
          scope_kind, scope_id, source_ref, source_version,
          snapshot_id, operational_watermark, source_hash,
          observed_at, as_of, proposed_priority,
          suggested_human_action_code, evidence_code, evidence_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "FINDING-FX-004", "MSN-FX-OPS-001", "sha256:fingerprint-intake-004",
        "OPS-INTAKE-UNTREATED-004", "INTAKE_UNTRIAGED",
        "project", "PRJ-FX-INTAKE", "PRJ-FX-INTAKE", 1,
        "SNAP-FX-001", "WM-FX-001", "sha256:source-fixture-001",
        "2030-01-15T08:00:03.000Z", "2030-01-15T08:00:00.000Z", "normal",
        "REVIEW_INTAKE", "CANONICAL_UNTRIAGED", "sha256:evidence-intake-004",
      )).toThrow();
    } finally {
      database.close();
    }
  });
});
