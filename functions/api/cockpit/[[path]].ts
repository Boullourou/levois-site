import {
  authenticateCockpit,
  assertMutationSecurity,
  createCsrfToken,
  privateHeaders,
  requestFingerprint,
  SecurityError,
  type CockpitActor,
  type CockpitEnv,
} from "../../_lib/cockpit/security";
import {
  auditExport,
  changeLabStatus,
  changeProjectStage,
  changeTimStatus,
  completeTask,
  createAdvisor,
  createClientAndProject,
  createLabObservation,
  createTask,
  createTimAgreement,
  recordInteraction,
  recordTimCompensation,
  recordTimPayment,
  reviseCriterion,
  reviseTimTerms,
  type CommandContext,
} from "../../../src/lib/cockpit/server/commands";
import { DomainError, requireDatabase } from "../../../src/lib/cockpit/server/db";
import {
  getClient,
  getTimAgreement,
  getToday,
  listAdvisors,
  listClients,
  listLab,
  listTimAgreements,
} from "../../../src/lib/cockpit/server/queries";
import { generateClientMarkdown } from "../../../src/lib/cockpit/markdown-export";

interface Params extends Record<string, unknown> {
  path?: string | string[];
}

interface FunctionContext {
  request: Request;
  env: CockpitEnv;
  params: Params;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: privateHeaders("application/json; charset=utf-8"),
  });
}

function routePath(params: Params): string {
  const value = params.path;
  return (Array.isArray(value) ? value.join("/") : value ?? "").replace(/^\/+|\/+$/g, "");
}

async function body(request: Request): Promise<Record<string, unknown>> {
  const maximumBytes = 1_000_000;
  const length = Number(request.headers.get("Content-Length") ?? "0");
  if (length > maximumBytes) throw new DomainError(413, "PAYLOAD_TOO_LARGE", "La commande dépasse 1 Mo.");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maximumBytes) {
    throw new DomainError(413, "PAYLOAD_TOO_LARGE", "La commande dépasse 1 Mo.");
  }
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("object required");
    return value as Record<string, unknown>;
  } catch {
    throw new DomainError(400, "INVALID_JSON", "Le corps JSON est invalide.");
  }
}

function commandContext(
  request: Request,
  actor: CockpitActor,
  fingerprint: string,
): CommandContext {
  return {
    actorId: actor.id,
    idempotencyKey: request.headers.get("Idempotency-Key")?.trim() ?? "",
    fingerprint,
  };
}

function mappedClientExport(detail: Record<string, unknown>, withContacts: boolean) {
  const person = detail.person as Record<string, unknown>;
  const contacts = detail.contacts as Array<Record<string, unknown>>;
  const projects = detail.projects as Array<Record<string, unknown>>;
  const relationships = detail.relationships as Array<Record<string, unknown>>;
  const searches = detail.searches as Array<Record<string, unknown>>;
  const scenarios = detail.scenarios as Array<Record<string, unknown>>;
  const criteria = detail.criteria as Array<Record<string, unknown>>;
  const interactions = detail.interactions as Array<Record<string, unknown>>;
  const tasks = detail.tasks as Array<Record<string, unknown>>;
  const decisions = detail.decisions as Array<Record<string, unknown>>;
  const displayName = String(person.preferredName || `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() || "Dossier client");
  const email = contacts.find((contact) => contact.type === "email")?.displayValue;
  const phone = contacts.find((contact) => contact.type === "phone")?.displayValue;
  return generateClientMarkdown({
    generatedAt: new Date().toISOString(),
    coordinateMode: withContacts ? "with_coordinates" : "without_coordinates",
    person: {
      id: String(person.id),
      displayName,
      firstName: String(person.firstName ?? ""),
      lastName: String(person.lastName ?? ""),
      usageName: person.preferredName ? String(person.preferredName) : undefined,
      email: email ? String(email) : undefined,
      phone: phone ? String(phone) : undefined,
      origin: String(person.origin ?? "unknown"),
      summary: String(person.summary ?? ""),
      createdAt: person.createdAt ? String(person.createdAt) : undefined,
      lastContactAt: person.lastContactAt ? String(person.lastContactAt) : undefined,
    },
    projects: projects.map((project) => ({
      id: String(project.id),
      personId: String(person.id),
      type: project.type as never,
      status: project.status as never,
      stage: project.stage as never,
      objective: String(project.objective ?? ""),
      timeline: String(project.calendarSummary ?? ""),
      relatedProjectIds: relationships
        .filter((relation) => relation.sourceProjectId === project.id || relation.targetProjectId === project.id)
        .map((relation) => String(relation.sourceProjectId === project.id ? relation.targetProjectId : relation.sourceProjectId)),
    })),
    buyerSearches: searches.map((search) => ({
      id: String(search.id), projectId: String(search.projectId), summary: String(search.summary ?? ""),
    })),
    scenarios: scenarios.map((scenario) => ({
      id: String(scenario.id), buyerSearchId: String(scenario.buyerSearchId), type: scenario.kind as never,
      label: String(scenario.label), condition: scenario.conditionText ? String(scenario.conditionText) : undefined,
    })),
    criterionEvents: criteria.map((criterion) => {
      let value = String(criterion.valueJson ?? "");
      let customLabel: string | undefined;
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const record = parsed as Record<string, unknown>;
          customLabel = typeof record.customLabel === "string" ? record.customLabel : undefined;
          const rawValue = Object.hasOwn(record, "value") ? record.value
            : Object.hasOwn(record, "text") ? record.text
              : parsed;
          value = typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue);
        } else {
          value = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
        }
      } catch { /* The migration already guarantees valid JSON. */ }
      return {
        id: String(criterion.id), buyerSearchId: String(criterion.buyerSearchId),
        scenarioId: String(criterion.scenarioId), eventType: criterion.operation as never,
        key: criterion.criterionKey as never, customLabel, value,
        importance: criterion.importance as never, flexibility: criterion.flexibility as never,
        certainty: criterion.certainty as never, matchingRole: criterion.matchingRole as never,
        source: String(criterion.sourceRef ?? criterion.sourceKind ?? "manual"),
        effectiveAt: String(criterion.effectiveAt), recordedAt: String(criterion.recordedAt),
        supersedesEventId: criterion.replacesCriterionEventId ? String(criterion.replacesCriterionEventId) : undefined,
        reason: criterion.reason ? String(criterion.reason) : undefined,
      };
    }),
    interactions: interactions.map((interaction) => ({
      id: String(interaction.id), personId: String(person.id), projectId: String(interaction.projectId),
      occurredAt: String(interaction.occurredAt), type: interaction.type as never,
      direction: interaction.direction as never, summary: String(interaction.summary),
      outcome: interaction.outcome ? String(interaction.outcome) : undefined,
      promisedAction: interaction.promisedAction ? String(interaction.promisedAction) : undefined,
      promisedDueAt: interaction.promisedDueAt ? String(interaction.promisedDueAt) : undefined,
    })),
    tasks: tasks.map((task) => ({
      id: String(task.id), projectId: String(task.projectId), title: String(task.title),
      dueAt: task.dueAt ? String(task.dueAt) : undefined, priority: task.priority as never,
      state: task.status as never, waitingReason: task.waitingReason ? String(task.waitingReason) : undefined,
      isNextAction: Boolean(task.isNextAction),
    })),
    decisions: decisions.map((decision) => ({
      id: String(decision.id), projectId: String(decision.projectId),
      effectiveAt: String(decision.effectiveAt), summary: String(decision.summary),
      reason: decision.reason ? String(decision.reason) : undefined,
    })),
  });
}

async function dispatch(
  request: Request,
  env: CockpitEnv,
  params: Params,
  actor: CockpitActor,
): Promise<Response> {
  const method = request.method.toUpperCase();
  const path = routePath(params);

  if (method === "GET" && path === "session") {
    return json({ ok: true, data: { actor: { id: actor.id, email: actor.email, local: actor.local }, csrfToken: await createCsrfToken(request, actor, env), databaseAvailable: Boolean(env.COCKPIT_DB) } });
  }

  const database = requireDatabase(env.COCKPIT_DB);
  if (method === "GET" && path === "today") return json({ ok: true, data: await getToday(database) });
  if (method === "GET" && path === "clients") {
    const url = new URL(request.url);
    return json({ ok: true, data: { items: await listClients(database, {
      search: url.searchParams.get("q") ?? undefined,
      type: url.searchParams.get("type") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      stage: url.searchParams.get("stage") ?? undefined,
      origin: url.searchParams.get("origin") ?? undefined,
      overdue: url.searchParams.get("overdue") === "1",
      withoutNextAction: url.searchParams.get("withoutNextAction") === "1",
    }) } });
  }
  const clientMatch = /^clients\/([^/]+)$/.exec(path);
  if (method === "GET" && clientMatch) return json({ ok: true, data: await getClient(database, clientMatch[1]) });
  if (method === "GET" && path === "advisors") return json({ ok: true, data: { items: await listAdvisors(database) } });
  if (method === "GET" && path === "tim") {
    const url = new URL(request.url);
    return json({ ok: true, data: { items: await listTimAgreements(database, Object.fromEntries(url.searchParams)) } });
  }
  const timMatch = /^tim\/([^/]+)$/.exec(path);
  if (method === "GET" && timMatch) return json({ ok: true, data: await getTimAgreement(database, timMatch[1]) });
  if (method === "GET" && path === "lab") return json({ ok: true, data: { items: await listLab(database) } });

  if (method !== "POST") return json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "Méthode non autorisée." } }, 405);
  await assertMutationSecurity(request, actor, env);
  const payload = await body(request);
  const context = commandContext(request, actor, await requestFingerprint({
    method,
    path,
    payload,
  }, env));

  if (path === "clients/create") return json({ ok: true, data: await createClientAndProject(database, payload, context) }, 201);
  const exportMatch = /^clients\/([^/]+)\/export$/.exec(path);
  if (exportMatch) {
    const withContacts = payload.mode === "with_contacts" || payload.mode === "with_coordinates";
    if (!["with_contacts", "with_coordinates", "without_contacts", "without_coordinates"].includes(String(payload.mode))) {
      throw new DomainError(400, "VALIDATION_ERROR", "Le mode d'export est invalide.");
    }
    const detail = await getClient(database, exportMatch[1]);
    const markdown = mappedClientExport(detail, withContacts);
    await auditExport(database, exportMatch[1], withContacts, context);
    const headers = privateHeaders(markdown.mediaType);
    headers.set("Content-Disposition", `attachment; filename="${markdown.filename}"`);
    return new Response(markdown.content, { status: 200, headers });
  }
  const projectStageMatch = /^projects\/([^/]+)\/stage\/change$/.exec(path);
  if (projectStageMatch) return json({ ok: true, data: await changeProjectStage(database, projectStageMatch[1], payload, context) });
  const interactionMatch = /^projects\/([^/]+)\/interactions\/record$/.exec(path);
  if (interactionMatch) return json({ ok: true, data: await recordInteraction(database, interactionMatch[1], payload, context) }, 201);
  const projectTaskMatch = /^projects\/([^/]+)\/tasks\/create$/.exec(path);
  if (projectTaskMatch) return json({ ok: true, data: await createTask(database, { projectId: projectTaskMatch[1] }, payload, context) }, 201);
  const completeTaskMatch = /^tasks\/([^/]+)\/complete$/.exec(path);
  if (completeTaskMatch) return json({ ok: true, data: await completeTask(database, completeTaskMatch[1], payload, context) });
  const criterionMatch = /^searches\/([^/]+)\/criteria\/revise$/.exec(path);
  if (criterionMatch) return json({ ok: true, data: await reviseCriterion(database, criterionMatch[1], payload, context) }, 201);
  if (path === "advisors/create") return json({ ok: true, data: await createAdvisor(database, payload, context) }, 201);
  if (path === "tim/create") return json({ ok: true, data: await createTimAgreement(database, payload, context) }, 201);
  const timTermsMatch = /^tim\/([^/]+)\/terms\/revise$/.exec(path);
  if (timTermsMatch) return json({ ok: true, data: await reviseTimTerms(database, timTermsMatch[1], payload, context) }, 201);
  const timStatusMatch = /^tim\/([^/]+)\/status\/change$/.exec(path);
  if (timStatusMatch) return json({ ok: true, data: await changeTimStatus(database, timStatusMatch[1], payload, context) });
  const timCompensationMatch = /^tim\/([^/]+)\/compensations\/record$/.exec(path);
  if (timCompensationMatch) return json({ ok: true, data: await recordTimCompensation(database, timCompensationMatch[1], payload, context) }, 201);
  const timPaymentMatch = /^tim\/([^/]+)\/payments\/record$/.exec(path);
  if (timPaymentMatch) return json({ ok: true, data: await recordTimPayment(database, timPaymentMatch[1], payload, context) }, 201);
  const timTaskMatch = /^tim\/([^/]+)\/tasks\/create$/.exec(path);
  if (timTaskMatch) return json({ ok: true, data: await createTask(database, { timAgreementId: timTaskMatch[1] }, payload, context) }, 201);
  if (path === "lab/create") return json({ ok: true, data: await createLabObservation(database, payload, context) }, 201);
  const labStatusMatch = /^lab\/([^/]+)\/status\/change$/.exec(path);
  if (labStatusMatch) return json({ ok: true, data: await changeLabStatus(database, labStatusMatch[1], payload, context) });

  return json({ ok: false, error: { code: "NOT_FOUND", message: "Commande cockpit inconnue." } }, 404);
}

export const onRequest = async (context: FunctionContext): Promise<Response> => {
  try {
    const actor = await authenticateCockpit(context.request, context.env);
    return await dispatch(context.request, context.env, context.params, actor);
  } catch (error) {
    if (error instanceof SecurityError || error instanceof DomainError) {
      return json({ ok: false, error: { code: error.code, message: error.message, ...(error instanceof DomainError && error.details ? { details: error.details } : {}) } }, error.status);
    }
    return json({ ok: false, error: { code: "DB_UNAVAILABLE", message: "Les données privées sont momentanément indisponibles." } }, 503);
  }
};
