import type { D1Database } from "@cloudflare/workers-types";
import {
  cancelAgenticMission,
  getAgenticMission,
  getCurrentAgenticBriefing,
  listAgenticMissionTrace,
  listAgenticSwitches,
  runAgenticBriefing,
  setAgenticSwitch,
  type AgenticBriefingDto,
  type AgenticMissionDto,
  type AgenticSwitchDto,
  type RunAgenticBriefingResult,
} from "../../../src/lib/cockpit/server/agentic-service";
import { DomainError } from "../../../src/lib/cockpit/server/db";
import {
  assertMutationSecurity,
  privateHeaders,
  requestFingerprint,
  SecurityError,
  type CockpitActor,
  type CockpitEnv,
} from "./security";

const MAXIMUM_BODY_BYTES = 16 * 1024;
const FIXTURE_ID = "agentic-a1-v1" as const;
const SAFE_CODE = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/;
const PHONE_SHAPED_PII = /(?<![A-Za-z0-9])(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}(?![A-Za-z0-9])/;
const AGENT_IDS = new Set(["OPS-01", "COS-01"]);
const CAPABILITY_IDS = new Set([
  "ops.read_snapshot",
  "ops.evaluate_rules",
  "cos.read_ops_results",
  "cos.deduplicate",
  "cos.rank",
  "cos.compose_briefing",
]);

type JsonRecord = Record<string, unknown>;

export interface AgenticDispatchInput {
  request: Request;
  env: CockpitEnv;
  actor: CockpitActor;
  database: D1Database;
  path: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: privateHeaders("application/json; charset=utf-8"),
  });
}

function csv(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function assertAgenticOwner(actor: CockpitActor, env: CockpitEnv): void {
  if (actor.local) return;
  const allowedSubjects = csv(env.COCKPIT_ALLOWED_SUB);
  if (allowedSubjects.length !== 1 || allowedSubjects[0] !== actor.id.trim().toLowerCase()) {
    throw new SecurityError(403, "AGENTIC_OWNER_REQUIRED", "Seul le propriétaire explicitement configuré peut piloter A1.");
  }
}

function assertNoQuery(request: Request, allowed: ReadonlySet<string> = new Set()): URLSearchParams {
  const parameters = new URL(request.url).searchParams;
  const seen = new Set<string>();
  for (const key of parameters.keys()) {
    if (!allowed.has(key) || seen.has(key)) {
      throw new DomainError(400, "CP_CONTRACT_INVALID", "La requête contient un paramètre inconnu ou dupliqué.");
    }
    seen.add(key);
  }
  return parameters;
}

async function readClosedBody(
  request: Request,
  allowedKeys: readonly string[],
  requiredKeys: readonly string[] = [],
): Promise<JsonRecord> {
  const declaredLength = Number(request.headers.get("Content-Length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAXIMUM_BODY_BYTES) {
    throw new DomainError(413, "PAYLOAD_TOO_LARGE", "La commande agentique dépasse 16 Kio.");
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAXIMUM_BODY_BYTES) {
    throw new DomainError(413, "PAYLOAD_TOO_LARGE", "La commande agentique dépasse 16 Kio.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new DomainError(400, "INVALID_JSON", "Le corps JSON agentique est invalide.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new DomainError(400, "CP_CONTRACT_INVALID", "Un objet JSON fermé est requis.");
  }
  const value = parsed as JsonRecord;
  const allowed = new Set(allowedKeys);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new DomainError(400, "CP_CONTRACT_INVALID", "Le corps contient un champ agentique inconnu.");
  const missing = requiredKeys.find((key) => !Object.hasOwn(value, key));
  if (missing) throw new DomainError(400, "CP_CONTRACT_INVALID", `Champ agentique requis : ${missing}.`);
  return value;
}

function requiredIdempotencyKey(request: Request): string {
  const key = request.headers.get("Idempotency-Key")?.trim() ?? "";
  if (!SAFE_CODE.test(key)) {
    throw new DomainError(400, "CP_CONTRACT_INVALID", "Une clé d'idempotence opaque est requise.");
  }
  if (PHONE_SHAPED_PII.test(key)) {
    throw new DomainError(400, "CP_PII_POLICY_VIOLATION", "La clé d'idempotence ne peut contenir aucune donnée personnelle.");
  }
  return key;
}

function assertFixtureReadActivation(env: CockpitEnv): void {
  if (env.COCKPIT_AGENTIC_FIXTURE_ONLY !== "1") {
    throw new DomainError(403, "CP_SCOPE_VIOLATION", "Les artefacts fixture A1 sont indisponibles dans cet environnement.");
  }
}

function optionalVersion(value: unknown, minimum = 0): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) {
    throw new DomainError(400, "CP_CONTRACT_INVALID", "expectedVersion doit être un entier positif ou nul.");
  }
  return value;
}

function assertOpaqueId(value: string, label: string): string {
  if (!SAFE_CODE.test(value)) throw new DomainError(400, "CP_CONTRACT_INVALID", `${label} est invalide.`);
  return value;
}

function assertFixturePayload(payload: JsonRecord): asserts payload is JsonRecord & {
  fixtureOnly: true;
  fixtureId: typeof FIXTURE_ID;
} {
  if (payload.fixtureOnly !== true || payload.fixtureId !== FIXTURE_ID) {
    throw new DomainError(403, "CP_SCOPE_VIOLATION", "A1 accepte uniquement la fixture isolée autorisée.");
  }
}

function assertFixtureActivation(env: CockpitEnv, payload: JsonRecord): void {
  assertFixturePayload(payload);
  if (env.COCKPIT_AGENTIC_FIXTURE_ONLY !== "1") {
    throw new DomainError(403, "CP_SCOPE_VIOLATION", "L'activation fixture A1 est fermée dans cet environnement.");
  }
}

function sanitizeMission(value: AgenticMissionDto): AgenticMissionDto {
  const counters = (source: Record<string, number>): Record<string, number> => Object.fromEntries(
    ["sourceRows", "ruleEvaluations", "findings", "briefingItems", "traceEntries"]
      .filter((key) => Number.isSafeInteger(source[key]) && source[key] >= 0)
      .map((key) => [key, source[key]]),
  );
  return {
    missionId: value.missionId,
    missionType: value.missionType,
    agentId: value.agentId,
    capabilities: [...value.capabilities],
    objectiveCode: value.objectiveCode,
    status: value.status,
    priority: value.priority,
    trigger: { kind: value.trigger.kind, ref: value.trigger.ref },
    source: { kind: value.source.kind, ref: value.source.ref, version: value.source.version },
    snapshotId: value.snapshotId,
    operationalWatermark: value.operationalWatermark,
    asOf: value.asOf,
    correlationId: value.correlationId,
    causationId: value.causationId,
    createdAt: value.createdAt,
    startedAt: value.startedAt,
    finishedAt: value.finishedAt,
    timeoutAt: value.timeoutAt,
    attemptNo: value.attemptNo,
    logicalBudget: counters(value.logicalBudget),
    logicalUsage: counters(value.logicalUsage),
    resultStatus: value.resultStatus,
    resultTotalCount: value.resultTotalCount,
    resultSelectedCount: value.resultSelectedCount,
    resultOmittedCount: value.resultOmittedCount,
    closeReason: value.closeReason,
    errorCode: value.errorCode,
    fixtureOnly: true,
    shadowMode: true,
    version: value.version,
  };
}

function sanitizeBriefing(value: AgenticBriefingDto): JsonRecord {
  const state = value.state;
  const safeItems = value.items.map((item) => ({
    itemId: item.itemId,
    rank: item.rank,
    priority: item.priority,
    scopeKind: item.scopeKind,
    scopeId: item.scopeId,
    primaryRuleId: item.primaryRuleId,
    reasonCode: item.reasonCode,
    explanation: item.explanation,
    suggestedActionCode: item.suggestedActionCode,
    suggestedHumanAction: item.suggestedHumanAction,
    signalCount: item.signalCount,
    source: {
      sourceOpsMissionId: item.source.sourceOpsMissionId,
      snapshotId: item.source.snapshotId,
      operationalWatermark: item.source.operationalWatermark,
    },
  }));
  if (safeItems.length > 7) throw new DomainError(503, "CP_RESULT_INVALID", "Le briefing dépasse la limite A1.");
  if (
    value.itemCount !== safeItems.length
    || (state === "available" && safeItems.length === 0)
    || (state === "empty" && safeItems.length !== 0)
    || (!["available", "empty"].includes(state) && safeItems.length !== 0)
  ) {
    throw new DomainError(503, "CP_RESULT_INVALID", "Le briefing ne respecte pas son contrat de présentation.");
  }
  const items = state === "available" || state === "empty" ? safeItems : [];
  return {
    state,
    missionId: value.missionId,
    generatedAt: value.generatedAt,
    itemCount: items.length,
    omittedCount: value.omittedCount,
    items,
    reasonCode: value.reasonCode,
    fixtureOnly: true,
    shadowMode: true,
    performsAutomaticActions: false,
  };
}

function sanitizeRun(value: RunAgenticBriefingResult): JsonRecord {
  return {
    replayed: value.replayed,
    opsMission: sanitizeMission(value.opsMission),
    cosMission: value.cosMission ? sanitizeMission(value.cosMission) : null,
    briefing: sanitizeBriefing(value.briefing),
    fixtureOnly: true,
    shadowMode: true,
  };
}

function sanitizeSwitch(value: AgenticSwitchDto): AgenticSwitchDto {
  return {
    scopeKind: value.scopeKind,
    scopeKey: value.scopeKey,
    effectiveState: value.effectiveState,
    present: value.present,
    version: value.version,
    reasonCode: value.reasonCode,
    decidedAt: value.decidedAt,
    fixtureOnly: true,
    shadowMode: true,
  };
}

function sanitizeTrace(value: Awaited<ReturnType<typeof listAgenticMissionTrace>>): JsonRecord {
  return {
    items: value.items.map((item) => ({
      traceId: item.id,
      missionId: item.missionId,
      sequenceNo: item.sequenceNo,
      occurredAt: item.occurredAt,
      correlationId: item.correlationId,
      causationId: item.causationId,
      entryKind: item.entryKind,
      fromStatus: item.fromStatus,
      toStatus: item.toStatus,
      reasonCode: item.reasonCode,
      resultKind: item.resultKind,
      resultRef: item.resultRef,
      logicalUsageDelta: Object.fromEntries(
        ["sourceRows", "ruleEvaluations", "findings", "briefingItems", "traceEntries"]
          .filter((key) => Number.isSafeInteger(item.logicalUsageDelta[key]) && item.logicalUsageDelta[key] >= 0)
          .map((key) => [key, item.logicalUsageDelta[key]]),
      ),
      errorCode: item.errorCode,
      errorStage: item.errorStage,
    })),
    nextCursor: value.nextCursor,
  };
}

function parseSwitchPath(path: string): {
  scopeKind: "global" | "agent" | "capability";
  scopeKey: string;
  action: "start" | "stop";
} | null {
  const globalMatch = /^switches\/global\/(start|stop)$/.exec(path);
  if (globalMatch) return { scopeKind: "global", scopeKey: "global", action: globalMatch[1] as "start" | "stop" };
  const scopedMatch = /^switches\/(agent|capability)\/([^/]+)\/(start|stop)$/.exec(path);
  if (!scopedMatch) return null;
  const scopeKind = scopedMatch[1] as "agent" | "capability";
  const scopeKey = assertOpaqueId(scopedMatch[2], "scopeKey");
  if (scopeKind === "agent" && !AGENT_IDS.has(scopeKey)) throw new DomainError(400, "CP_SCOPE_VIOLATION", "Agent logique inconnu.");
  if (scopeKind === "capability" && !CAPABILITY_IDS.has(scopeKey)) throw new DomainError(400, "CP_SCOPE_VIOLATION", "Capability inconnue.");
  return { scopeKind, scopeKey, action: scopedMatch[3] as "start" | "stop" };
}

export async function dispatchAgenticRequest(input: AgenticDispatchInput): Promise<Response> {
  const { request, env, actor, database, path } = input;
  const method = request.method.toUpperCase();
  assertAgenticOwner(actor, env);

  if (method === "GET" && path === "briefing/current") {
    assertNoQuery(request);
    if (env.COCKPIT_AGENTIC_FIXTURE_ONLY !== "1") {
      return json({
        ok: true,
        data: {
          state: "stopped",
          missionId: null,
          generatedAt: null,
          itemCount: 0,
          omittedCount: 0,
          items: [],
          reasonCode: "CP_SCOPE_VIOLATION",
          fixtureOnly: true,
          shadowMode: true,
          performsAutomaticActions: false,
        },
      });
    }
    return json({ ok: true, data: sanitizeBriefing(await getCurrentAgenticBriefing(database)) });
  }
  const traceMatch = /^missions\/([^/]+)\/trace$/.exec(path);
  if (method === "GET" && traceMatch) {
    assertFixtureReadActivation(env);
    const missionId = assertOpaqueId(traceMatch[1], "missionId");
    const query = assertNoQuery(request, new Set(["cursor", "limit"]));
    const parseInteger = (name: string, fallback: number, minimum: number, maximum: number): number => {
      const raw = query.get(name);
      if (raw == null) return fallback;
      if (!/^\d+$/.test(raw)) throw new DomainError(400, "CP_CONTRACT_INVALID", `${name} est invalide.`);
      const parsed = Number(raw);
      if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
        throw new DomainError(400, "CP_CONTRACT_INVALID", `${name} est hors limites.`);
      }
      return parsed;
    };
    const trace = await listAgenticMissionTrace(database, missionId, {
      cursor: parseInteger("cursor", 0, 0, Number.MAX_SAFE_INTEGER),
      limit: parseInteger("limit", 50, 1, 100),
    });
    return json({ ok: true, data: sanitizeTrace(trace) });
  }
  const missionMatch = /^missions\/([^/]+)$/.exec(path);
  if (method === "GET" && missionMatch) {
    assertFixtureReadActivation(env);
    assertNoQuery(request);
    return json({ ok: true, data: sanitizeMission(await getAgenticMission(database, assertOpaqueId(missionMatch[1], "missionId"))) });
  }
  if (method === "GET" && path === "switches") {
    assertFixtureReadActivation(env);
    assertNoQuery(request);
    const switches = (await listAgenticSwitches(database)).map(sanitizeSwitch);
    return json({
      ok: true,
      data: {
        items: switches,
      },
    });
  }

  if (method !== "POST") {
    return json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "Méthode agentique non autorisée." } }, 405);
  }
  await assertMutationSecurity(request, actor, env);
  const idempotencyKey = requiredIdempotencyKey(request);

  if (path === "briefing/run") {
    const payload = await readClosedBody(request, ["fixtureOnly", "fixtureId"], ["fixtureOnly", "fixtureId"]);
    assertFixtureActivation(env, payload);
    const inputHash = await requestFingerprint({ method, path, payload }, env);
    const result = await runAgenticBriefing(database, { fixtureOnly: true, fixtureId: FIXTURE_ID }, {
      actorId: actor.id,
      idempotencyKey,
      inputHash,
      now: new Date().toISOString(),
    });
    return json({ ok: true, data: sanitizeRun(result) }, result.replayed ? 200 : 201);
  }

  const cancelMatch = /^missions\/([^/]+)\/cancel$/.exec(path);
  if (cancelMatch) {
    const missionId = assertOpaqueId(cancelMatch[1], "missionId");
    const payload = await readClosedBody(request, ["expectedVersion"], ["expectedVersion"]);
    const expectedVersion = optionalVersion(payload.expectedVersion, 1);
    const inputHash = await requestFingerprint({ method, path, payload }, env);
    const result = await cancelAgenticMission(database, missionId, {
      reasonCode: "human_cancelled",
      expectedVersion: expectedVersion!,
    }, {
      actorId: actor.id,
      idempotencyKey,
      inputHash,
      now: new Date().toISOString(),
    });
    return json({ ok: true, data: sanitizeMission(result) });
  }

  const switchRoute = parseSwitchPath(path);
  if (switchRoute) {
    const payload = await readClosedBody(
      request,
      ["fixtureOnly", "fixtureId", "expectedVersion"],
      ["fixtureOnly", "fixtureId", "expectedVersion"],
    );
    assertFixturePayload(payload);
    if (switchRoute.action === "start") assertFixtureActivation(env, payload);
    const expectedVersion = optionalVersion(payload.expectedVersion);
    const inputHash = await requestFingerprint({ method, path, payload }, env);
    const result = await setAgenticSwitch(database, {
      scopeKind: switchRoute.scopeKind,
      scopeKey: switchRoute.scopeKey,
    }, {
      state: switchRoute.action === "start" ? "enabled" : "stopped",
      reasonCode: switchRoute.action === "start" ? "human_start" : "human_stop",
      fixtureOnly: true,
      fixtureId: FIXTURE_ID,
      expectedVersion: expectedVersion!,
    }, {
      actorId: actor.id,
      idempotencyKey,
      inputHash,
      now: new Date().toISOString(),
    });
    return json({ ok: true, data: sanitizeSwitch(result) });
  }

  return json({ ok: false, error: { code: "NOT_FOUND", message: "Route agentique inconnue." } }, 404);
}
