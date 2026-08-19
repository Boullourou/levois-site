import type { D1Database } from "@cloudflare/workers-types";
import { allRows } from "./db";

export const OPS_SNAPSHOT_SCHEMA_VERSION = "ops-snapshot.v1" as const;

type CoverageState = "complete" | "incomplete";

export interface OpsSnapshotV1 {
  schemaVersion: typeof OPS_SNAPSHOT_SCHEMA_VERSION;
  snapshotId: string;
  fixtureOnly: true;
  asOf: string;
  operationalWatermark: string;
  sourceHash: string;
  coverage: {
    projects: CoverageState;
    tasks: CoverageState;
    promises: CoverageState;
    intake: "canonical_signal_absent";
    timAgreements: CoverageState;
    timDeadlines: CoverageState;
  };
  projects: Array<{
    projectId: string;
    status: string;
    stage: string;
    version: number;
  }>;
  tasks: Array<{
    taskId: string;
    projectId?: string;
    timId?: string;
    status: string;
    dueAt: string | null;
    sourcePriority: string;
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
    sourcePriority: string;
    linkedTaskId?: string;
    version: number;
  }>;
  timAgreements: Array<{
    timId: string;
    agreementStatus: string;
    operationStatus: string | null;
    version: number;
  }>;
  timDeadlines: Array<{
    deadlineId: string;
    timId: string;
    kind: "follow_up";
    dueAt: string;
    status: string;
    linkedTaskId: string;
    version: number;
  }>;
}

interface ProjectRow {
  project_id: string;
  status: string;
  stage_key: string;
  version: number;
}

interface TaskRow {
  task_id: string;
  project_id: string | null;
  tim_agreement_id: string | null;
  status: string;
  due_at: string | null;
  priority: string;
  is_next_action: number;
  promised_from_interaction_id: string | null;
  version: number;
}

interface PromiseRow {
  promise_id: string;
  project_id: string;
  due_at: string;
  linked_task_id: string | null;
  linked_task_status: string | null;
  linked_task_priority: string | null;
}

interface TimRow {
  tim_id: string;
  agreement_status: string;
  operation_status: string | null;
  version: number;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function assertIso(value: string): string {
  const normalized = new Date(value).toISOString();
  if (normalized !== value) throw new Error("CP_CONTRACT_INVALID: asOf must be normalized UTC ISO");
  return normalized;
}

async function readMinimizedRows(database: D1Database) {
  const projects = await allRows<ProjectRow>(database.prepare(`
    SELECT id AS project_id, status, stage_key, version
    FROM project
    ORDER BY id
  `));
  const tasks = await allRows<TaskRow>(database.prepare(`
    SELECT id AS task_id, project_id, tim_agreement_id, status, due_at,
           priority, is_next_action, promised_from_interaction_id, version
    FROM task
    ORDER BY id
  `));
  const promises = await allRows<PromiseRow>(database.prepare(`
    SELECT interaction.id AS promise_id,
           interaction.project_id,
           interaction.promised_due_at AS due_at,
           linked.id AS linked_task_id,
           linked.status AS linked_task_status,
           linked.priority AS linked_task_priority
    FROM interaction
    LEFT JOIN task linked
      ON linked.promised_from_interaction_id = interaction.id
     AND linked.id = (
       SELECT min(candidate.id)
       FROM task candidate
       WHERE candidate.promised_from_interaction_id = interaction.id
     )
    WHERE interaction.project_id IS NOT NULL
      AND interaction.promised_due_at IS NOT NULL
    ORDER BY interaction.id, linked.id
  `));
  const timAgreements = await allRows<TimRow>(database.prepare(`
    SELECT id AS tim_id,
           current_agreement_status AS agreement_status,
           current_operation_status AS operation_status,
           version
    FROM tim_agreement
    ORDER BY id
  `));
  return { projects, tasks, promises, timAgreements };
}

function minimizeRows(rows: Awaited<ReturnType<typeof readMinimizedRows>>) {
  const projects = rows.projects.map((row) => ({
    projectId: row.project_id,
    status: row.status,
    stage: row.stage_key,
    version: Number(row.version),
  }));
  const tasks = rows.tasks.map((row) => ({
    taskId: row.task_id,
    ...(row.project_id ? { projectId: row.project_id } : {}),
    ...(row.tim_agreement_id ? { timId: row.tim_agreement_id } : {}),
    status: row.status,
    dueAt: row.due_at,
    sourcePriority: row.priority,
    isNextAction: row.is_next_action === 1,
    ...(row.promised_from_interaction_id ? { promisedFromInteractionId: row.promised_from_interaction_id } : {}),
    ...(row.tim_agreement_id && row.due_at ? { timDeadlineId: row.task_id } : {}),
    version: Number(row.version),
  }));
  const promises = rows.promises.map((row) => ({
    promiseId: row.promise_id,
    projectId: row.project_id,
    dueAt: row.due_at,
    fulfilled: row.linked_task_status === "completed" || row.linked_task_status === "cancelled",
    sourcePriority: row.linked_task_priority === "urgent" || row.linked_task_priority === "high"
      ? row.linked_task_priority
      : "normal",
    ...(row.linked_task_id ? { linkedTaskId: row.linked_task_id } : {}),
    version: 1,
  }));
  const timAgreements = rows.timAgreements.map((row) => ({
    timId: row.tim_id,
    agreementStatus: row.agreement_status,
    operationStatus: row.operation_status,
    version: Number(row.version),
  }));
  const timDeadlines = rows.tasks
    .filter((row) => row.tim_agreement_id && row.due_at)
    .map((row) => ({
      deadlineId: row.task_id,
      timId: row.tim_agreement_id as string,
      kind: "follow_up" as const,
      dueAt: row.due_at as string,
      status: row.status,
      linkedTaskId: row.task_id,
      version: Number(row.version),
    }));
  return { projects, tasks, promises, timAgreements, timDeadlines };
}

export async function buildOpsSnapshot(
  database: D1Database,
  options: { asOf: string; fixtureOnly: true },
): Promise<OpsSnapshotV1> {
  const asOf = assertIso(options.asOf);
  const rows = await readMinimizedRows(database);
  const source = minimizeRows(rows);
  const sourceDigest = await sha256(canonical(source));
  const snapshotDigest = await sha256(`${OPS_SNAPSHOT_SCHEMA_VERSION}:${asOf}:${sourceDigest}`);
  return {
    schemaVersion: OPS_SNAPSHOT_SCHEMA_VERSION,
    snapshotId: `SNAP_${snapshotDigest.slice(0, 32)}`,
    fixtureOnly: true,
    asOf,
    operationalWatermark: `WM_${sourceDigest}`,
    sourceHash: `sha256:${sourceDigest}`,
    coverage: {
      projects: "complete",
      tasks: "complete",
      promises: "complete",
      intake: "canonical_signal_absent",
      timAgreements: "complete",
      timDeadlines: "complete",
    },
    ...source,
  };
}

export async function readOperationalWatermark(database: D1Database): Promise<string> {
  const rows = await readMinimizedRows(database);
  const source = minimizeRows(rows);
  return `WM_${await sha256(canonical(source))}`;
}
