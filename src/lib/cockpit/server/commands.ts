import type { D1Database, D1PreparedStatement } from "@cloudflare/workers-types";
import {
  CONTACT_ORIGINS,
  CRITERION_CERTAINTY,
  CRITERION_EVENT_TYPES,
  CRITERION_FLEXIBILITY,
  CRITERION_IMPORTANCE,
  CRITERION_KEYS,
  CRITERION_MATCHING_ROLES,
  INTERACTION_DIRECTIONS,
  INTERACTION_TYPES,
  LAB_OBSERVATION_STATUSES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  TASK_PRIORITIES,
  TIM_AGREEMENT_STATUSES,
  TIM_AGREEMENT_TYPES,
  TIM_COMPENSATION_STATUSES,
  TIM_FEE_BASES,
  TIM_INFORMATION_NATURES,
  TIM_OPERATION_STATUSES,
  TIM_OPERATION_TYPES,
  TIM_PARTY_ROLES,
  isStageAllowedForProject,
} from "../taxonomy";
import {
  validateCriterionEvent,
  validateTimAgreement,
  validateTimCompensation,
  validateTimPayment,
  validateTimStatusChange,
  validateTimTerms,
} from "../validation";
import {
  allRows,
  batch,
  boolean,
  changed,
  DomainError,
  enumValue,
  expectedVersion,
  firstRow,
  integer,
  newId,
  nowIso,
  optionalIso,
  requiredIso,
  text,
} from "./db";

export interface CommandContext {
  actorId: string;
  idempotencyKey: string;
  fingerprint: string;
}

interface AuditReceipt {
  request_fingerprint: string;
  result_target_id: string | null;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DomainError(400, "VALIDATION_ERROR", "La commande doit être un objet.");
  }
  return value as Record<string, unknown>;
}

function nested(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function commandKey(value: string): string {
  const key = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{6,126}[A-Za-z0-9]$/.test(key)) {
    throw new DomainError(400, "IDEMPOTENCY_KEY_INVALID", "Une clé Idempotency-Key stable de 8 à 128 caractères est requise.");
  }
  return key;
}

async function existingReceipt(database: D1Database, action: string, context: CommandContext): Promise<string | null> {
  commandKey(context.idempotencyKey);
  const receipt = await firstRow<AuditReceipt>(database.prepare(`
    SELECT request_fingerprint, result_target_id FROM audit_event
    WHERE actor_id = ?1 AND action = ?2 AND idempotency_key = ?3
  `).bind(context.actorId, action, context.idempotencyKey));
  if (!receipt) return null;
  if (receipt.request_fingerprint !== context.fingerprint) {
    throw new DomainError(409, "IDEMPOTENCY_CONFLICT", "Cette clé d'idempotence a déjà été utilisée avec une autre commande.");
  }
  return receipt.result_target_id;
}

function auditStatement(
  database: D1Database,
  action: string,
  targetKind: string,
  targetId: string | null,
  resultTargetId: string | null,
  context: CommandContext,
  occurredAt: string,
  guard?: { sql: string; bindings: unknown[] },
): D1PreparedStatement {
  return database.prepare(`INSERT INTO audit_event (
    id, actor_id, action, target_kind, target_id, result, idempotency_key,
    request_fingerprint, result_target_id, metadata_json, occurred_at
  ) SELECT ?1, ?2, ?3, ?4, ?5, 'success', ?6, ?7, ?8, '{}', ?9
    ${guard ? `WHERE ${guard.sql}` : ""}`)
    .bind(newId("audit"), context.actorId, action, targetKind, targetId, context.idempotencyKey,
      context.fingerprint, resultTargetId, occurredAt, ...(guard?.bindings ?? []));
}

async function runIdempotent(
  database: D1Database,
  action: string,
  context: CommandContext,
  targetId: string,
  statements: D1PreparedStatement[],
): Promise<{ id: string; replayed: boolean }> {
  const replay = await existingReceipt(database, action, context);
  if (replay) return { id: replay, replayed: true };
  try {
    await batch(database, statements);
    return { id: targetId, replayed: false };
  } catch (error) {
    if (error instanceof DomainError && error.status === 409) {
      const concurrent = await existingReceipt(database, action, context);
      if (concurrent) return { id: concurrent, replayed: true };
    }
    throw error;
  }
}

interface ClientCreationReceipt {
  personId: string;
  projectId: string;
  linkedProjectId: string | null;
  taskId: string | null;
  linkedTaskId: string | null;
  searchId: string | null;
}

interface TimCreationReceipt {
  agreementId: string;
  partyIds: Record<string, string>;
  termsId: string | null;
  compensationId: string | null;
}

async function clientCreationReceipt(database: D1Database, personId: string): Promise<ClientCreationReceipt> {
  const projects = await allRows<{ id: string; type: string }>(database.prepare(`
    SELECT project.id, project.type
    FROM project JOIN project_party party ON party.project_id = project.id
    WHERE party.person_id = ?1 AND party.role = 'primary' AND party.valid_to IS NULL
    ORDER BY project.created_at, project.id
  `).bind(personId));
  if (!projects.length) throw new DomainError(503, "IDEMPOTENCY_RECEIPT_INVALID", "Le reçu de création du dossier est incomplet.");
  const projectIds = new Set(projects.map((project) => project.id));
  const relationship = projects.length > 1
    ? await firstRow<{ source_project_id: string; target_project_id: string }>(database.prepare(`
      SELECT source_project_id, target_project_id FROM project_relationship
      WHERE type = 'purchase_depends_on_sale'
        AND source_project_id IN (SELECT project_id FROM project_party WHERE person_id = ?1 AND role = 'primary')
        AND target_project_id IN (SELECT project_id FROM project_party WHERE person_id = ?1 AND role = 'primary')
      LIMIT 1
    `).bind(personId))
    : null;
  const projectId = relationship?.source_project_id
    ?? projects.find((project) => project.type !== "sale")?.id
    ?? projects[0].id;
  const linkedProjectId = relationship?.target_project_id
    ?? projects.find((project) => project.id !== projectId)?.id
    ?? null;
  if (!projectIds.has(projectId)) throw new DomainError(503, "IDEMPOTENCY_RECEIPT_INVALID", "Le projet créé est introuvable.");
  const [task, linkedTask, search] = await Promise.all([
    firstRow<{ id: string }>(database.prepare(`SELECT id FROM task WHERE project_id = ?1 AND is_next_action = 1
      ORDER BY created_at LIMIT 1`).bind(projectId)),
    linkedProjectId
      ? firstRow<{ id: string }>(database.prepare(`SELECT id FROM task WHERE project_id = ?1 AND is_next_action = 1
        ORDER BY created_at LIMIT 1`).bind(linkedProjectId))
      : Promise.resolve(null),
    firstRow<{ id: string }>(database.prepare(`SELECT id FROM buyer_search WHERE project_id = ?1 ORDER BY created_at LIMIT 1`).bind(projectId)),
  ]);
  return {
    personId,
    projectId,
    linkedProjectId,
    taskId: task?.id ?? null,
    linkedTaskId: linkedTask?.id ?? null,
    searchId: search?.id ?? null,
  };
}

async function timCreationReceipt(database: D1Database, agreementId: string): Promise<TimCreationReceipt> {
  const parties = await allRows<{ id: string; advisor_profile_id: string }>(database.prepare(`
    SELECT id, advisor_profile_id FROM tim_agreement_party
    WHERE tim_agreement_id = ?1 AND active_to IS NULL ORDER BY created_at, id
  `).bind(agreementId));
  const [terms, compensation] = await Promise.all([
    firstRow<{ id: string }>(database.prepare(`SELECT id FROM tim_agreement_terms
      WHERE tim_agreement_id = ?1 AND is_current = 1 LIMIT 1`).bind(agreementId)),
    firstRow<{ id: string }>(database.prepare(`SELECT id FROM tim_compensation
      WHERE tim_agreement_id = ?1 AND is_current = 1 LIMIT 1`).bind(agreementId)),
  ]);
  return {
    agreementId,
    partyIds: Object.fromEntries(parties.map((party) => [party.advisor_profile_id, party.id])),
    termsId: terms?.id ?? null,
    compensationId: compensation?.id ?? null,
  };
}

function normalizeContact(type: "email" | "phone", value: string): string {
  if (type === "email") return value.trim().toLowerCase();
  const prefix = value.trim().startsWith("+") ? "+" : "";
  return `${prefix}${value.replace(/\D/g, "")}`;
}

const TIM_TRIGGER_CODES = ["unknown", "deed_signed", "funds_received", "lease_signed", "custom"] as const;

function normalizeTimPaymentTrigger(source: Record<string, unknown>): { code: typeof TIM_TRIGGER_CODES[number]; text: string | null } {
  const rawCode = text(source.paymentTriggerCode ?? source.payment_trigger_code, "Code du fait générateur", {
    optional: true,
    max: 80,
  });
  const rawText = text(source.triggeringEvent ?? source.paymentTriggerText ?? source.payment_trigger_text,
    "Fait générateur", { optional: true, max: 500 });
  if (!rawCode) {
    if (!rawText || rawText === "unknown") return { code: "unknown", text: null };
    if (TIM_TRIGGER_CODES.includes(rawText as typeof TIM_TRIGGER_CODES[number]) && rawText !== "custom") {
      return { code: rawText as typeof TIM_TRIGGER_CODES[number], text: null };
    }
    return { code: "custom", text: rawText };
  }
  if (!TIM_TRIGGER_CODES.includes(rawCode as typeof TIM_TRIGGER_CODES[number])) {
    return { code: "custom", text: rawText ?? rawCode };
  }
  if (rawCode === "custom") {
    if (!rawText || rawText === "custom" || rawText === "unknown") {
      throw new DomainError(400, "VALIDATION_ERROR", "Un fait générateur personnalisé exige un libellé explicite.");
    }
    return { code: "custom", text: rawText };
  }
  return { code: rawCode as typeof TIM_TRIGGER_CODES[number], text: null };
}

export async function createClientAndProject(
  database: D1Database,
  input: unknown,
  context: CommandContext,
): Promise<Record<string, unknown>> {
  const source = object(input);
  const personInput = nested(source.person);
  const projectInput = nested(source.project);
  const nextInput = nested(source.nextAction ?? source.next_action);
  const searchInput = nested(source.search);
  const linkedInput = nested(source.linkedProject ?? source.linked_project);
  const now = nowIso();
  const personId = newId("person");
  const projectId = newId("project");
  const partyId = newId("party");
  const consentId = newId("consent");

  const firstName = text(personInput.firstName ?? source.firstName, "Prénom", { optional: true, max: 100 }) ?? "";
  const lastName = text(personInput.lastName ?? source.lastName, "Nom", { optional: true, max: 100 }) ?? "";
  const preferredName = text(personInput.preferredName ?? personInput.usageName, "Nom d'usage", { optional: true, max: 160 });
  if (!firstName && !lastName && !preferredName) throw new DomainError(400, "VALIDATION_ERROR", "Une identité minimale est requise.");
  const origin = enumValue(personInput.origin ?? source.origin ?? "unknown", CONTACT_ORIGINS, "Origine");
  const summary = text(personInput.summary ?? source.summary, "Synthèse", { optional: true, max: 1_000 }) ?? "";
  const projectType = enumValue(projectInput.type ?? source.projectType, PROJECT_TYPES, "Type de projet");
  const projectStatus = enumValue(projectInput.status ?? source.status ?? "new", PROJECT_STATUSES, "Statut du projet");
  if (["completed", "abandoned", "archived"].includes(projectStatus)) {
    throw new DomainError(400, "VALIDATION_ERROR", "Un nouveau projet ne peut pas être créé directement dans un état terminal.");
  }
  const stageRaw = projectInput.stage ?? source.stage ?? "new_contact";
  if (typeof stageRaw !== "string" || !isStageAllowedForProject(projectType, stageRaw)) {
    throw new DomainError(400, "VALIDATION_ERROR", "L'étape n'est pas compatible avec le type de projet.");
  }
  const objective = text(projectInput.objective, "Objectif", { optional: true, max: 2_000 }) ?? "";
  const calendarSummary = text(projectInput.calendarSummary ?? projectInput.timeline, "Calendrier", { optional: true, max: 500 }) ?? "";
  const nextTitle = text(nextInput.title ?? source.nextActionTitle, "Prochaine action", { optional: true, max: 300 });
  const allowWithout = boolean(source.allowWithoutNextAction ?? source.allow_without_next_action, "Confirmation sans prochaine action", false);
  if (projectStatus === "active" && !nextTitle && !allowWithout) {
    throw new DomainError(400, "NEXT_ACTION_REQUIRED", "Un projet actif exige une prochaine action ou une confirmation explicite de l'anomalie.");
  }

  const statements: D1PreparedStatement[] = [
    database.prepare(`INSERT INTO person (
      id, first_name, last_name, preferred_name, origin, summary, status, created_at, updated_at, version
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'active', ?7, ?7, 1)`)
      .bind(personId, firstName, lastName, preferredName, origin, summary, now),
    database.prepare(`INSERT INTO project (
      id, type, status, stage_key, objective, calendar_summary, responsible_actor_id, created_at, updated_at, version
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8, 1)`)
      .bind(projectId, projectType, projectStatus, stageRaw, objective, calendarSummary, context.actorId, now),
    database.prepare(`INSERT INTO project_party (
      id, project_id, person_id, role, source_kind, valid_from, created_at
    ) VALUES (?1, ?2, ?3, 'primary', 'manual', ?4, ?4)`)
      .bind(partyId, projectId, personId, now),
    database.prepare(`INSERT INTO consent_event (
      id, person_id, project_id, purpose, action, evidence_quality, channel,
      source_kind, effective_at, recorded_at, actor_id
    ) VALUES (?1, ?2, ?3, 'human_contact', 'unknown', 'unknown', 'manual', 'manual', ?4, ?4, ?5)`)
      .bind(consentId, personId, projectId, now, context.actorId),
  ];

  let linkedProjectId: string | null = null;
  if (Object.keys(linkedInput).length) {
    if (projectType !== "primary_residence_purchase") {
      throw new DomainError(400, "VALIDATION_ERROR", "Le projet principal d'un achat + vente lié doit être l'achat.");
    }
    const linkedType = enumValue(linkedInput.type ?? "sale", PROJECT_TYPES, "Type du projet lié");
    if (linkedType !== "sale") throw new DomainError(400, "VALIDATION_ERROR", "Le second projet lié doit être une vente.");
    const linkedStatus = enumValue(linkedInput.status ?? projectStatus, PROJECT_STATUSES, "Statut de la vente liée");
    if (["completed", "abandoned", "archived"].includes(linkedStatus)) {
      throw new DomainError(400, "VALIDATION_ERROR", "La vente liée ne peut pas être créée dans un état terminal.");
    }
    const linkedStage = linkedInput.stage ?? "new_contact";
    if (typeof linkedStage !== "string" || !isStageAllowedForProject("sale", linkedStage)) {
      throw new DomainError(400, "VALIDATION_ERROR", "L'étape de la vente liée est invalide.");
    }
    linkedProjectId = newId("project");
    statements.push(
      database.prepare(`INSERT INTO project (
        id, type, status, stage_key, objective, calendar_summary, responsible_actor_id,
        created_at, updated_at, version
      ) VALUES (?1, 'sale', ?2, ?3, ?4, ?5, ?6, ?7, ?7, 1)`)
        .bind(linkedProjectId, linkedStatus, linkedStage,
          text(linkedInput.objective, "Objectif de vente", { optional: true, max: 2_000 }) ?? "",
          text(linkedInput.calendarSummary, "Calendrier de vente", { optional: true, max: 500 }) ?? "",
          context.actorId, now),
      database.prepare(`INSERT INTO project_party (
        id, project_id, person_id, role, source_kind, valid_from, created_at
      ) VALUES (?1, ?2, ?3, 'primary', 'manual', ?4, ?4)`)
        .bind(newId("party"), linkedProjectId, personId, now),
      database.prepare(`INSERT INTO project_relationship (
        id, source_project_id, target_project_id, type, detail, created_at
      ) VALUES (?1, ?2, ?3, 'purchase_depends_on_sale', ?4, ?5)`)
        .bind(newId("relationship"), projectId, linkedProjectId,
          text(linkedInput.relationshipDetail, "Lien achat-vente", { optional: true, max: 500 }), now),
    );
  }

  for (const type of ["email", "phone"] as const) {
    const raw = text(personInput[type], type, { optional: true, max: 200 });
    if (!raw) continue;
    const normalized = normalizeContact(type, raw);
    if (!normalized) throw new DomainError(400, "VALIDATION_ERROR", `${type} est invalide.`);
    statements.push(database.prepare(`INSERT INTO contact_method (
      id, person_id, type, display_value, normalized_value, is_primary,
      verification_status, source_kind, first_observed_at, last_observed_at, created_at, updated_at, version
    ) VALUES (?1, ?2, ?3, ?4, ?5, 1, 'unknown', 'manual', ?6, ?6, ?6, ?6, 1)`)
      .bind(newId("contact"), personId, type, raw, normalized, now));
  }

  let taskId: string | null = null;
  let linkedTaskId: string | null = null;
  if (nextTitle) {
    taskId = newId("task");
    const dueAt = optionalIso(nextInput.dueAt ?? source.nextActionDueAt, "Échéance");
    const priority = enumValue(nextInput.priority ?? "normal", TASK_PRIORITIES, "Priorité");
    statements.push(database.prepare(`INSERT INTO task (
      id, project_id, title, status, priority, due_at, is_next_action,
      created_at, updated_at, created_by_actor_id, version
    ) VALUES (?1, ?2, ?3, 'open', ?4, ?5, 1, ?6, ?6, ?7, 1)`)
      .bind(taskId, projectId, nextTitle, priority, dueAt, now, context.actorId));
    if (linkedProjectId) {
      linkedTaskId = newId("task");
      statements.push(database.prepare(`INSERT INTO task (
        id, project_id, title, status, priority, due_at, is_next_action,
        created_at, updated_at, created_by_actor_id, version
      ) VALUES (?1, ?2, ?3, 'open', ?4, ?5, 1, ?6, ?6, ?7, 1)`)
        .bind(linkedTaskId, linkedProjectId, nextTitle, priority, dueAt, now, context.actorId));
    }
  }

  let searchId: string | null = null;
  if (boolean(searchInput.enabled ?? source.createSearch, "Créer la recherche", false)
      || projectType === "primary_residence_purchase" || projectType === "investment") {
    searchId = newId("search");
    statements.push(database.prepare(`INSERT INTO buyer_search (
      id, project_id, status, summary, reference_timezone, opened_at, created_at, updated_at, version
    ) VALUES (?1, ?2, ?3, ?4, 'Europe/Paris', ?5, ?5, ?5, 1)`)
      .bind(searchId, projectId, projectStatus === "active" ? "active" : "draft",
        text(searchInput.summary, "Résumé de recherche", { optional: true, max: 2_000 }) ?? "", now));
    const scenarios = [
      { kind: "preferred", label: "Préféré", priority: 10 },
      { kind: "acceptable", label: "Acceptable", priority: 20 },
      { kind: "conditional", label: "Conditionnel", priority: 30 },
    ];
    for (const scenario of scenarios) {
      statements.push(database.prepare(`INSERT INTO search_scenario (
        id, buyer_search_id, lineage_key, version_number, kind, label, condition_text,
        priority, status, source_kind, effective_at, recorded_at, created_by_actor_id
      ) VALUES (?1, ?2, ?3, 1, ?4, ?5, ?6, ?7, 'active', 'manual', ?8, ?8, ?9)`)
        .bind(newId("scenario"), searchId, `${scenario.kind}-main`, scenario.kind, scenario.label,
          scenario.kind === "conditional" ? "Condition à préciser et valider humainement." : null,
          scenario.priority, now, context.actorId));
    }
  }

  statements.push(auditStatement(database, "create_client_and_project", "person", personId, personId, context, now));
  const result = await runIdempotent(database, "create_client_and_project", context, personId, statements);
  if (result.replayed) return { ...result, ...await clientCreationReceipt(database, result.id) };
  return { ...result, personId: result.id, projectId, linkedProjectId, taskId, linkedTaskId, searchId };
}

export async function changeProjectStage(database: D1Database, projectId: string, input: unknown, context: CommandContext) {
  const source = object(input);
  const version = expectedVersion(source.expectedVersion ?? source.expected_version);
  const current = await firstRow<{ type: string; stage_key: string }>(database.prepare(`SELECT type, stage_key FROM project WHERE id = ?1`).bind(projectId));
  if (!current) throw new DomainError(404, "NOT_FOUND", "Projet introuvable.");
  const stage = text(source.stage, "Étape", { max: 80 })!;
  if (!isStageAllowedForProject(current.type as never, stage)) throw new DomainError(400, "VALIDATION_ERROR", "Étape incompatible avec le projet.");
  const now = nowIso();
  const decisionId = newId("decision");
  const statements = [
    database.prepare(`UPDATE project SET stage_key = ?1, updated_at = ?2, version = version + 1
      WHERE id = ?3 AND version = ?4`).bind(stage, now, projectId, version),
    database.prepare(`INSERT INTO decision (id, project_id, type, summary, reason, source_kind, effective_at, recorded_at, actor_id)
      SELECT ?1, ?2, 'stage_change', ?3, ?4, 'manual', ?5, ?5, ?6
      WHERE EXISTS (SELECT 1 FROM project WHERE id = ?2 AND version = ?7 AND updated_at = ?5)`)
      .bind(decisionId, projectId, `Étape : ${current.stage_key} → ${stage}`,
        text(source.reason, "Raison", { optional: true, max: 1_000 }), now, context.actorId, version + 1),
    auditStatement(database, "change_project_stage", "project", projectId, projectId, context, now, {
      sql: "EXISTS (SELECT 1 FROM project WHERE id = ?10 AND version = ?11 AND updated_at = ?12)",
      bindings: [projectId, version + 1, now],
    }),
  ];
  const replay = await existingReceipt(database, "change_project_stage", context);
  if (replay) return { id: replay, replayed: true };
  const results = await batch(database, statements);
  if (changed(results[0]) !== 1) throw new DomainError(409, "VERSION_CONFLICT", "Le projet a été modifié ailleurs.");
  return { id: projectId, replayed: false, version: version + 1 };
}

export async function recordInteraction(database: D1Database, projectId: string, input: unknown, context: CommandContext) {
  const source = object(input);
  const version = expectedVersion(source.expectedVersion ?? source.expected_version);
  const interactionId = newId("interaction");
  const type = enumValue(source.type, INTERACTION_TYPES, "Type d'interaction");
  const direction = enumValue(source.direction, INTERACTION_DIRECTIONS, "Sens");
  const summary = text(source.summary, "Résumé", { max: 2_000 })!;
  const occurredAt = requiredIso(source.occurredAt ?? source.occurred_at, "Date réelle");
  const promisedAction = text(source.promisedAction ?? source.promised_action, "Action promise", { optional: true, max: 500 });
  const promisedDueAt = optionalIso(source.promisedDueAt ?? source.promised_due_at, "Date promise");
  if (promisedDueAt && !promisedAction) throw new DomainError(400, "VALIDATION_ERROR", "Une date promise exige une action promise.");
  const now = nowIso();
  const statements = [
    database.prepare(`INSERT INTO interaction (
      id, project_id, type, direction, summary, outcome, promised_action, promised_due_at,
      source_kind, source_ref, occurred_at, recorded_at, actor_id
    ) SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'manual', ?9, ?10, ?11, ?12
      WHERE EXISTS (SELECT 1 FROM project WHERE id = ?2 AND version = ?13)`)
      .bind(interactionId, projectId, type, direction, summary,
        text(source.outcome, "Résultat", { optional: true, max: 1_000 }), promisedAction, promisedDueAt,
        text(source.sourceRef ?? source.source_ref, "Source", { optional: true, max: 300 }), occurredAt,
        now, context.actorId, version),
    database.prepare(`UPDATE project SET
      last_interaction_at = CASE
        WHEN last_interaction_at IS NULL OR datetime(?1) > datetime(last_interaction_at) THEN ?1
        ELSE last_interaction_at
      END,
      updated_at = ?2, version = version + 1
      WHERE id = ?3 AND version = ?4
        AND EXISTS (SELECT 1 FROM interaction WHERE id = ?5)`)
      .bind(occurredAt, now, projectId, version, interactionId),
    database.prepare(`UPDATE person SET
      last_contact_at = CASE
        WHEN last_contact_at IS NULL OR datetime(?1) > datetime(last_contact_at) THEN ?1
        ELSE last_contact_at
      END,
      updated_at = ?2, version = version + 1
      WHERE id IN (SELECT person_id FROM project_party WHERE project_id = ?3 AND valid_to IS NULL)
        AND EXISTS (SELECT 1 FROM interaction WHERE id = ?4)`)
      .bind(occurredAt, now, projectId, interactionId),
    auditStatement(database, "record_interaction", "interaction", interactionId, interactionId, context, now, {
      sql: "EXISTS (SELECT 1 FROM interaction WHERE id = ?10)", bindings: [interactionId],
    }),
  ];
  const replay = await existingReceipt(database, "record_interaction", context);
  if (replay) return { id: replay, replayed: true };
  const results = await batch(database, statements);
  if (changed(results[1]) !== 1) throw new DomainError(409, "VERSION_CONFLICT", "Le projet a été modifié ailleurs.");
  return { id: interactionId, projectId, version: version + 1, replayed: false };
}

export async function createTask(
  database: D1Database,
  scope: { projectId?: string; timAgreementId?: string },
  input: unknown,
  context: CommandContext,
) {
  const source = object(input);
  const taskId = newId("task");
  const title = text(source.title, "Action", { max: 300 })!;
  const priority = enumValue(source.priority ?? "normal", TASK_PRIORITIES, "Priorité");
  const dueAt = optionalIso(source.dueAt ?? source.due_at, "Échéance");
  const isNext = boolean(source.isNextAction ?? source.is_next_action, "Prochaine action", true);
  const now = nowIso();
  if ((!scope.projectId && !scope.timAgreementId) || (scope.projectId && scope.timAgreementId)) {
    throw new DomainError(400, "VALIDATION_ERROR", "La tâche doit cibler exactement un projet ou un Accord TIM.");
  }
  const scopeId = scope.projectId ?? scope.timAgreementId!;
  const aggregateTable = scope.projectId ? "project" : "tim_agreement";
  const currentAggregate = await firstRow<{ version: number }>(database.prepare(`SELECT version FROM ${aggregateTable} WHERE id = ?1`).bind(scopeId));
  if (!currentAggregate) throw new DomainError(404, "NOT_FOUND", scope.projectId ? "Projet introuvable." : "Accord TIM introuvable.");
  const version = expectedVersion(source.expectedVersion ?? source.expected_version);
  const statements: D1PreparedStatement[] = [
    database.prepare(`INSERT INTO task (
      id, project_id, tim_agreement_id, title, status, priority, due_at, waiting_reason,
      is_next_action, promised_from_interaction_id, created_at, updated_at, created_by_actor_id, version
    ) SELECT ?1, ?2, ?3, ?4, 'open', ?5, ?6, ?7, 0, ?8, ?9, ?9, ?10, 1
      WHERE EXISTS (SELECT 1 FROM ${aggregateTable} WHERE id = ?11 AND version = ?12)`)
      .bind(taskId, scope.projectId ?? null, scope.timAgreementId ?? null, title, priority, dueAt,
        text(source.waitingReason ?? source.waiting_reason, "Raison d'attente", { optional: true, max: 500 }),
        text(source.promisedFromInteractionId, "Interaction promise", { optional: true, max: 128 }),
        now, context.actorId, scopeId, version),
    database.prepare(`UPDATE ${aggregateTable} SET updated_at = ?1, version = version + 1
      WHERE id = ?2 AND version = ?3 AND EXISTS (SELECT 1 FROM task WHERE id = ?4)`)
      .bind(now, scopeId, version, taskId),
  ];
  if (isNext) {
    const column = scope.projectId ? "project_id" : "tim_agreement_id";
    statements.push(database.prepare(`UPDATE task SET is_next_action = 0, updated_at = ?1, version = version + 1
      WHERE ${column} = ?2 AND is_next_action = 1 AND status IN ('open','in_progress','waiting')
        AND EXISTS (SELECT 1 FROM task marker WHERE marker.id = ?3)
        AND EXISTS (SELECT 1 FROM ${aggregateTable} WHERE id = ?4 AND version = ?5)`)
      .bind(now, scopeId, taskId, scopeId, version + 1));
    statements.push(database.prepare(`UPDATE task SET is_next_action = 1, updated_at = ?1
      WHERE id = ?2 AND EXISTS (SELECT 1 FROM ${aggregateTable} WHERE id = ?3 AND version = ?4)`)
      .bind(now, taskId, scopeId, version + 1));
  }
  statements.push(auditStatement(database, "create_task", "task", taskId, taskId, context, now, {
    sql: "EXISTS (SELECT 1 FROM task WHERE id = ?10)", bindings: [taskId],
  }));
  const replay = await existingReceipt(database, "create_task", context);
  if (replay) return { id: replay, replayed: true };
  const results = await batch(database, statements);
  if (changed(results[1]) !== 1) throw new DomainError(409, "VERSION_CONFLICT", "Le dossier a été modifié ailleurs.");
  return { id: taskId, replayed: false, version: version + 1 };
}

export async function completeTask(database: D1Database, taskId: string, input: unknown, context: CommandContext) {
  const source = object(input);
  const version = expectedVersion(source.expectedVersion ?? source.expected_version);
  const now = nowIso();
  const statements = [
    database.prepare(`UPDATE task SET status = 'completed', is_next_action = 0, completed_at = ?1,
      updated_at = ?1, version = version + 1 WHERE id = ?2 AND version = ?3 AND status IN ('open','in_progress','waiting')`)
      .bind(now, taskId, version),
    auditStatement(database, "complete_task", "task", taskId, taskId, context, now, {
      sql: "EXISTS (SELECT 1 FROM task WHERE id = ?10 AND version = ?11 AND completed_at = ?12)",
      bindings: [taskId, version + 1, now],
    }),
  ];
  const replay = await existingReceipt(database, "complete_task", context);
  if (replay) return { id: replay, replayed: true };
  const results = await batch(database, statements);
  if (changed(results[0]) !== 1) throw new DomainError(409, "VERSION_CONFLICT", "La tâche est déjà terminée ou a été modifiée.");
  return { id: taskId, replayed: false, version: version + 1 };
}

export async function reviseCriterion(database: D1Database, searchId: string, input: unknown, context: CommandContext) {
  const source = object(input);
  if (source.value == null || (typeof source.value === "string" && !source.value.trim())) {
    throw new DomainError(400, "VALIDATION_ERROR", "La valeur du critère est requise.");
  }
  const scenarioId = text(source.scenarioId ?? source.scenario_id, "Scénario", { max: 128 })!;
  const recordedAt = nowIso();
  const eventId = newId("criterion");
  const validated = validateCriterionEvent({
    id: eventId,
    buyerSearchId: searchId,
    scenarioId,
    eventType: source.operation ?? source.eventType ?? "set",
    key: source.criterionKey ?? source.key,
    customLabel: source.customLabel,
    value: typeof source.value === "string" ? source.value : JSON.stringify(source.value ?? null),
    importance: source.importance,
    flexibility: source.flexibility,
    certainty: source.certainty,
    matchingRole: source.matchingRole ?? source.matching_role,
    hardValidated: source.hardValidated ?? source.hard_validated ?? false,
    source: source.source ?? "manual",
    effectiveAt: source.effectiveAt ?? source.effective_at ?? recordedAt,
    recordedAt,
    supersedesEventId: source.replacesCriterionEventId ?? source.supersedesEventId,
    reason: source.reason,
  });
  if (!validated.success) throw new DomainError(400, "VALIDATION_ERROR", "L'événement de critère est invalide.", validated.issues);
  const currentSearch = await firstRow<{ project_id: string; version: number }>(database.prepare(`SELECT project_id, version FROM buyer_search WHERE id = ?1`).bind(searchId));
  if (!currentSearch) throw new DomainError(404, "NOT_FOUND", "Recherche introuvable.");
  const version = expectedVersion(source.expectedVersion ?? source.expected_version ?? currentSearch.version);
  const decisionId = newId("decision");
  const valueJson = JSON.stringify({
    value: source.value,
    customLabel: validated.data.customLabel ?? null,
  });
  const statements = [
    database.prepare(`UPDATE buyer_search SET updated_at = ?1, version = version + 1 WHERE id = ?2 AND version = ?3`)
      .bind(recordedAt, searchId, version),
    database.prepare(`INSERT INTO decision (id, project_id, type, summary, reason, source_kind, effective_at, recorded_at, actor_id)
      SELECT ?1, project_id, 'criterion_change', ?2, ?3, 'manual', ?4, ?5, ?6 FROM buyer_search
      WHERE id = ?7 AND version = ?8 AND updated_at = ?5`)
      .bind(decisionId, `Critère ${validated.data.key} révisé`, validated.data.reason ?? null,
        validated.data.effectiveAt, recordedAt, context.actorId, searchId, version + 1),
    database.prepare(`INSERT INTO criterion_event (
      id, buyer_search_id, search_scenario_id, criterion_key, operation, value_json,
      importance, flexibility, certainty, matching_role, hard_validated,
      hard_validated_by_actor_id, hard_validated_at, source_kind, source_ref, reason,
      effective_at, recorded_at, actor_id, replaces_criterion_event_id, decision_id
    ) SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13,
      ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21
      WHERE EXISTS (SELECT 1 FROM buyer_search WHERE id = ?2 AND version = ?22 AND updated_at = ?18)`)
      .bind(eventId, searchId, scenarioId, validated.data.key, validated.data.eventType, valueJson,
        validated.data.importance, validated.data.flexibility, validated.data.certainty, validated.data.matchingRole,
        validated.data.hardValidated ? 1 : 0, validated.data.hardValidated ? context.actorId : null,
        validated.data.hardValidated ? recordedAt : null, "manual", validated.data.source,
        validated.data.reason ?? null, validated.data.effectiveAt, recordedAt, context.actorId,
        validated.data.supersedesEventId ?? null, decisionId, version + 1),
    auditStatement(database, "revise_criterion", "criterion_event", eventId, eventId, context, recordedAt, {
      sql: "EXISTS (SELECT 1 FROM criterion_event WHERE id = ?10)", bindings: [eventId],
    }),
  ];
  const replay = await existingReceipt(database, "revise_criterion", context);
  if (replay) return { id: replay, replayed: true };
  const results = await batch(database, statements);
  if (changed(results[0]) !== 1) throw new DomainError(409, "VERSION_CONFLICT", "La recherche a été modifiée ailleurs.");
  return { id: eventId, searchId, version: version + 1, isBlocking: validated.data.isBlocking, replayed: false };
}

export async function createAdvisor(database: D1Database, input: unknown, context: CommandContext) {
  const source = object(input);
  const id = newId("advisor");
  const now = nowIso();
  const statements = [
    database.prepare(`INSERT INTO advisor_profile (id, display_name, network, is_current_operator, status, created_at, updated_at, version)
      VALUES (?1, ?2, ?3, ?4, 'active', ?5, ?5, 1)`)
      .bind(id, text(source.displayName ?? source.display_name, "Nom du conseiller", { max: 200 }),
        text(source.network, "Réseau", { optional: true, max: 100 }) ?? "SAFTI",
        boolean(source.isCurrentOperator ?? source.is_current_operator, "Opérateur courant", false) ? 1 : 0, now),
    auditStatement(database, "create_advisor", "system", id, id, context, now),
  ];
  return runIdempotent(database, "create_advisor", context, id, statements);
}

export async function createTimAgreement(database: D1Database, input: unknown, context: CommandContext) {
  const source = object(input);
  const agreementInput = Object.keys(nested(source.agreement)).length ? nested(source.agreement) : source;
  const id = newId("tim");
  const parties = Array.isArray(source.parties)
    ? source.parties
    : Array.isArray(agreementInput.parties) ? agreementInput.parties : [];
  const firstTask = Object.keys(nested(source.firstTask)).length
    ? nested(source.firstTask)
    : nested(agreementInput.nextAction);
  const normalized = {
    id,
    internalReference: agreementInput.internalReference ?? agreementInput.internal_reference,
    label: agreementInput.label,
    agreementType: agreementInput.agreementType ?? agreementInput.agreement_type,
    operationType: agreementInput.transactionType ?? agreementInput.operationType ?? agreementInput.transaction_type,
    informationNature: agreementInput.informationNature ?? agreementInput.information_nature,
    parties: parties.map((party) => {
      const item = nested(party);
      return { advisorId: item.advisorId ?? item.advisor_id, role: item.role, responsibility: item.responsibility };
    }),
    transmittedAt: agreementInput.informationTransmittedAt ?? agreementInput.transmittedAt ?? agreementInput.information_transmitted_at,
    formalizedAt: agreementInput.formalizedAt ?? agreementInput.formalized_at,
    formSigned: agreementInput.formSigned ?? agreementInput.form_signed ?? false,
    omegaUploaded: agreementInput.omegaUploaded ?? agreementInput.omega_uploaded ?? false,
    mandateObtained: agreementInput.mandateObtained ?? agreementInput.mandate_obtained ?? false,
    mandateReference: agreementInput.mandateReference ?? agreementInput.mandate_reference,
    subjectLabel: agreementInput.subjectLabel ?? agreementInput.subject_label,
    propertyOrProjectLabel: agreementInput.propertyOrProjectLabel ?? agreementInput.property_or_project_label,
    nextAction: firstTask.title ?? agreementInput.nextActionTitle,
    dueAt: firstTask.dueAt ?? agreementInput.nextActionDueAt,
    notes: agreementInput.notes,
    version: 1,
  };
  const validated = validateTimAgreement(normalized);
  if (!validated.success) throw new DomainError(400, "VALIDATION_ERROR", "L'Accord TIM est invalide.", validated.issues);
  const now = nowIso();
  const notes = [
    validated.data.propertyOrProjectLabel
      ? `Bien ou projet : ${validated.data.propertyOrProjectLabel}`
      : null,
    validated.data.notes ?? null,
  ].filter((value): value is string => Boolean(value)).join("\n");
  const statements: D1PreparedStatement[] = [
    database.prepare(`INSERT INTO tim_agreement (
      id, internal_reference, label, agreement_type, transaction_type, information_nature,
      subject_label, current_agreement_status, current_operation_status,
      information_transmitted_at, formalized_at, form_signed_at, omega_uploaded_at,
      mandate_obtained_at, mandate_reference, notes, created_at, updated_at, version
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'to_formalize', 'information_transmitted',
      ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?15, 1)`)
      .bind(id, validated.data.internalReference, validated.data.label, validated.data.agreementType,
        validated.data.operationType, validated.data.informationNature,
        validated.data.subjectLabel ?? null,
        validated.data.transmittedAt, validated.data.formalizedAt ?? null,
        validated.data.formSigned ? validated.data.formalizedAt ?? validated.data.transmittedAt : null,
        validated.data.omegaUploaded ? validated.data.formalizedAt ?? validated.data.transmittedAt : null,
        validated.data.mandateObtained ? validated.data.formalizedAt ?? validated.data.transmittedAt : null,
        validated.data.mandateReference ?? null, notes, now),
  ];
  const partyIds = new Map<string, string>();
  for (const party of validated.data.parties) {
    const partyId = newId("tim_party");
    partyIds.set(party.advisorId, partyId);
    statements.push(database.prepare(`INSERT INTO tim_agreement_party (
      id, tim_agreement_id, advisor_profile_id, role, responsibility_text, active_from, created_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)`)
      .bind(partyId, id, party.advisorId, party.role, party.responsibility ?? null, now));
  }

  const termsInput = nested(source.terms);
  let termsId: string | null = null;
  let compensationId: string | null = null;
  if (Object.keys(termsInput).length) {
    termsId = newId("tim_terms");
    const paymentTrigger = normalizeTimPaymentTrigger(termsInput);
    const rawAllocations = Array.isArray(termsInput.allocations) ? termsInput.allocations : [];
    const allocations = rawAllocations.map((entry) => {
      const allocation = nested(entry);
      const advisorId = text(allocation.advisorId ?? allocation.advisor_id, "Conseiller alloué", { max: 128 })!;
      const partyId = partyIds.get(advisorId);
      if (!partyId) throw new DomainError(400, "VALIDATION_ERROR", "Une allocation vise un conseiller absent de l'accord.");
      return { advisorId, partyId, basisPoints: allocation.basisPoints ?? allocation.share_basis_points };
    });
    const validatedTerms = validateTimTerms({
      id: termsId,
      agreementId: id,
      version: 1,
      agreementType: validated.data.agreementType,
      operationType: validated.data.operationType,
      feeBasis: termsInput.feeBasis ?? termsInput.fee_basis ?? "unknown",
      currency: termsInput.currency ?? termsInput.currencyCode ?? "EUR",
      triggeringEvent: paymentTrigger.text ?? paymentTrigger.code,
      allocations,
      termsConfirmed: termsInput.termsConfirmed ?? termsInput.terms_confirmed ?? false,
      allocationsConfirmed: termsInput.allocationsConfirmed ?? termsInput.allocations_confirmed ?? false,
      effectiveAt: termsInput.effectiveAt ?? termsInput.effective_at ?? now,
    });
    if (!validatedTerms.success) throw new DomainError(400, "VALIDATION_ERROR", "Les termes TIM initiaux sont invalides.", validatedTerms.issues);
    if (allocations.length && allocations.reduce((sum, allocation) => sum + Number(allocation.basisPoints), 0) !== 10_000) {
      throw new DomainError(400, "VALIDATION_ERROR", "Les allocations initiales doivent totaliser 10 000 points de base.");
    }
    if (validated.data.operationType === "rental" && termsInput.useSuggestedAllocation === true) {
      throw new DomainError(400, "RENTAL_AUTOMATION_FORBIDDEN", "Une location ne peut recevoir aucune allocation automatique.");
    }
    statements.push(database.prepare(`INSERT INTO tim_agreement_terms (
      id, tim_agreement_id, version_number, agreement_type, transaction_type,
      fee_basis, currency_code, calculation_method, payment_trigger_code,
      payment_trigger_text, conditions_text, change_reason, is_current,
      confirmed_at, confirmed_by_actor_id, allocations_confirmed_at,
      allocations_confirmed_by_actor_id, effective_at, created_at, created_by_actor_id
    ) VALUES (?1, ?2, 1, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 1,
      ?12, ?13, ?14, ?15, ?16, ?17, ?13)`)
      .bind(termsId, id, validated.data.agreementType, validated.data.operationType,
        validatedTerms.data.feeBasis, validatedTerms.data.currency,
        allocations.length ? "percentage" : "unknown", paymentTrigger.code,
        paymentTrigger.text,
        text(termsInput.conditionsText ?? termsInput.conditions_text, "Conditions", { optional: true, max: 2_000 }),
        text(termsInput.changeReason ?? termsInput.change_reason, "Raison", { optional: true, max: 1_000 }),
        validatedTerms.data.termsConfirmed ? now : null,
        validatedTerms.data.termsConfirmed ? context.actorId : null,
        validatedTerms.data.allocationsConfirmed ? now : null,
        validatedTerms.data.allocationsConfirmed ? context.actorId : null,
        validatedTerms.data.effectiveAt, now));
    for (const allocation of allocations) {
      statements.push(database.prepare(`INSERT INTO tim_agreement_allocation (
        id, tim_agreement_terms_id, tim_agreement_party_id, share_basis_points, created_at, created_by_actor_id
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`)
        .bind(newId("allocation"), termsId, allocation.partyId,
          integer(allocation.basisPoints, "Points de base", { min: 0, max: 10_000 }), now, context.actorId));
    }
  }

  const statuses = nested(source.statuses);
  const agreementStatus = enumValue(statuses.agreementStatus ?? statuses.agreement ?? "to_formalize", TIM_AGREEMENT_STATUSES, "État de l'accord");
  const operationStatus = enumValue(statuses.operationStatus ?? statuses.operation ?? "information_transmitted", TIM_OPERATION_STATUSES, "État de l'opération");
  if (["signed", "omega_uploaded", "active"].includes(agreementStatus) && !validated.data.formSigned) {
    throw new DomainError(400, "VALIDATION_ERROR", "Un état d'accord formalisé exige un formulaire signé.");
  }
  if (agreementStatus === "omega_uploaded" && !validated.data.omegaUploaded) {
    throw new DomainError(400, "VALIDATION_ERROR", "L'état OMEGA exige la confirmation du dépôt.");
  }
  if (agreementStatus !== "to_formalize" || operationStatus !== "information_transmitted") {
    statements.push(database.prepare(`UPDATE tim_agreement SET current_agreement_status = ?1,
      current_operation_status = ?2, updated_at = ?3, version = version + 1 WHERE id = ?4`)
      .bind(agreementStatus, operationStatus, now, id));
  }
  if (agreementStatus !== "to_formalize") {
    statements.push(database.prepare(`INSERT INTO tim_status_event (
      id, tim_agreement_id, state_axis, from_state, to_state, source_kind, effective_at, recorded_at, actor_id
    ) VALUES (?1, ?2, 'agreement', 'to_formalize', ?3, 'manual', ?4, ?4, ?5)`)
      .bind(newId("tim_status"), id, agreementStatus, now, context.actorId));
  }
  if (operationStatus !== "information_transmitted") {
    statements.push(database.prepare(`INSERT INTO tim_status_event (
      id, tim_agreement_id, state_axis, from_state, to_state, source_kind, effective_at, recorded_at, actor_id
    ) VALUES (?1, ?2, 'operation', 'information_transmitted', ?3, 'manual', ?4, ?4, ?5)`)
      .bind(newId("tim_status"), id, operationStatus, now, context.actorId));
  }

  const compensationInput = nested(source.compensation);
  const requestedCompensationStatus = statuses.compensationStatus ?? statuses.compensation;
  if (Object.keys(compensationInput).length || requestedCompensationStatus) {
    if (!termsId) throw new DomainError(400, "VALIDATION_ERROR", "Un état de rémunération initial exige une version de termes.");
    const operator = await firstRow<{ id: string }>(database.prepare(`SELECT id FROM advisor_profile WHERE is_current_operator = 1 AND status = 'active' LIMIT 1`));
    const beneficiaryAdvisorId = text(compensationInput.beneficiaryAdvisorId, "Conseiller bénéficiaire", { optional: true, max: 128 }) ?? operator?.id;
    const beneficiaryPartyId = beneficiaryAdvisorId ? partyIds.get(beneficiaryAdvisorId) : undefined;
    if (!beneficiaryPartyId) throw new DomainError(400, "VALIDATION_ERROR", "La partie bénéficiaire de la rémunération doit être précisée.");
    compensationId = newId("compensation");
    const validatedCompensation = validateTimCompensation({
      id: compensationId,
      agreementId: id,
      beneficiaryPartyId,
      termsId,
      status: requestedCompensationStatus ?? compensationInput.status ?? "not_due",
      estimatedTotalFeesMinor: compensationInput.estimatedTotalFeesMinor ?? 0,
      estimatedShareMinor: compensationInput.estimatedShareMinor ?? 0,
      amountDueMinor: compensationInput.amountDueMinor ?? 0,
      amountPaidMinor: 0,
      currency: compensationInput.currency ?? termsInput.currency ?? "EUR",
      dueAt: compensationInput.dueAt,
      expectedPaymentAt: compensationInput.expectedPaymentAt,
      note: compensationInput.note,
      version: 1,
    });
    if (!validatedCompensation.success) throw new DomainError(400, "VALIDATION_ERROR", "La rémunération initiale est invalide.", validatedCompensation.issues);
    statements.push(database.prepare(`INSERT INTO tim_compensation (
      id, tim_agreement_id, beneficiary_party_id, tim_agreement_terms_id, is_current,
      current_compensation_status, estimated_total_fees_minor, estimated_share_minor,
      amount_due_minor, amount_paid_minor, currency_code, due_at, expected_payment_at,
      calculation_note, created_at, updated_at, created_by_actor_id, version
    ) VALUES (?1, ?2, ?3, ?4, 1, ?5, ?6, ?7, ?8, 0, ?9, ?10, ?11, ?12, ?13, ?13, ?14, 1)`)
      .bind(compensationId, id, beneficiaryPartyId, termsId, validatedCompensation.data.status,
        validatedCompensation.data.estimatedTotalFeesMinor, validatedCompensation.data.estimatedShareMinor,
        validatedCompensation.data.amountDueMinor, validatedCompensation.data.currency,
        validatedCompensation.data.dueAt ?? null, validatedCompensation.data.expectedPaymentAt ?? null,
        validatedCompensation.data.note ?? null, now, context.actorId));
    statements.push(database.prepare(`INSERT INTO tim_status_event (
      id, tim_agreement_id, tim_compensation_id, state_axis, from_state, to_state,
      source_kind, effective_at, recorded_at, actor_id
    ) VALUES (?1, ?2, ?3, 'compensation', NULL, ?4, 'manual', ?5, ?5, ?6)`)
      .bind(newId("tim_status"), id, compensationId, validatedCompensation.data.status, now, context.actorId));
  }

  const nextTitle = text(firstTask.title ?? agreementInput.nextActionTitle, "Prochaine action", { optional: true, max: 300 });
  const allowWithoutNextAction = boolean(
    source.allowWithoutNextAction ?? source.allow_without_next_action,
    "Confirmation sans prochaine action",
    false,
  );
  if (agreementStatus === "active" && !nextTitle && !allowWithoutNextAction) {
    throw new DomainError(400, "NEXT_ACTION_REQUIRED", "Un Accord TIM actif exige une prochaine action ou une confirmation explicite de l'anomalie.");
  }
  if (nextTitle) {
    statements.push(database.prepare(`INSERT INTO task (
      id, tim_agreement_id, title, status, priority, due_at, is_next_action,
      created_at, updated_at, created_by_actor_id, version
    ) VALUES (?1, ?2, ?3, 'open', ?4, ?5, 1, ?6, ?6, ?7, 1)`)
      .bind(newId("task"), id, nextTitle,
        enumValue(firstTask.priority ?? "normal", TASK_PRIORITIES, "Priorité"),
        optionalIso(firstTask.dueAt ?? agreementInput.nextActionDueAt, "Échéance"), now, context.actorId));
  }
  statements.push(auditStatement(database, "create_tim_agreement", "tim_agreement", id, id, context, now));
  const result = await runIdempotent(database, "create_tim_agreement", context, id, statements);
  if (result.replayed) return { ...result, ...await timCreationReceipt(database, result.id) };
  return { ...result, agreementId: result.id, partyIds: Object.fromEntries(partyIds), termsId, compensationId };
}

export async function reviseTimTerms(database: D1Database, agreementId: string, input: unknown, context: CommandContext) {
  const source = object(input);
  const agreementVersion = expectedVersion(source.expectedVersion ?? source.expected_version);
  const currentAgreement = await firstRow<{ agreement_type: string; transaction_type: string }>(database.prepare(`
    SELECT agreement_type, transaction_type FROM tim_agreement WHERE id = ?1
  `).bind(agreementId));
  if (!currentAgreement) throw new DomainError(404, "NOT_FOUND", "Accord TIM introuvable.");
  const currentVersion = await firstRow<{ version_number: number }>(database.prepare(`
    SELECT version_number FROM tim_agreement_terms WHERE tim_agreement_id = ?1 AND is_current = 1
  `).bind(agreementId));
  const termsId = newId("tim_terms");
  const allocationsRaw = Array.isArray(source.allocations) ? source.allocations : [];
  const advisorAllocations = await Promise.all(allocationsRaw.map(async (entry) => {
    const item = nested(entry);
    const partyId = text(item.partyId ?? item.party_id, "Partie TIM", { optional: true, max: 128 });
    if (partyId) {
      const party = await firstRow<{ advisor_profile_id: string }>(database.prepare(`SELECT advisor_profile_id FROM tim_agreement_party WHERE id = ?1 AND tim_agreement_id = ?2`).bind(partyId, agreementId));
      if (!party) throw new DomainError(400, "VALIDATION_ERROR", "Une allocation vise une partie étrangère à l'accord.");
      return { advisorId: party.advisor_profile_id, partyId, basisPoints: item.basisPoints ?? item.share_basis_points };
    }
    const advisorId = text(item.advisorId ?? item.advisor_id, "Conseiller", { max: 128 })!;
    const party = await firstRow<{ id: string }>(database.prepare(`SELECT id FROM tim_agreement_party WHERE advisor_profile_id = ?1 AND tim_agreement_id = ?2 AND active_to IS NULL`).bind(advisorId, agreementId));
    if (!party) throw new DomainError(400, "VALIDATION_ERROR", "Le conseiller n'est pas une partie active de l'accord.");
    return { advisorId, partyId: party.id, basisPoints: item.basisPoints ?? item.share_basis_points };
  }));
  const effectiveAt = source.effectiveAt ?? source.effective_at ?? nowIso();
  const paymentTrigger = normalizeTimPaymentTrigger(source);
  const validated = validateTimTerms({
    id: termsId,
    agreementId,
    version: (currentVersion?.version_number ?? 0) + 1,
    agreementType: currentAgreement.agreement_type,
    operationType: currentAgreement.transaction_type,
    feeBasis: source.feeBasis ?? source.fee_basis ?? "unknown",
    currency: source.currency ?? source.currencyCode ?? "EUR",
    triggeringEvent: paymentTrigger.text ?? paymentTrigger.code,
    allocations: advisorAllocations,
    termsConfirmed: source.termsConfirmed ?? source.terms_confirmed ?? false,
    allocationsConfirmed: source.allocationsConfirmed ?? source.allocations_confirmed ?? false,
    effectiveAt,
  });
  if (!validated.success) throw new DomainError(400, "VALIDATION_ERROR", "Les termes TIM sont invalides.", validated.issues);
  if (validated.data.allocations.length && validated.data.allocations.reduce((sum, item) => sum + item.basisPoints, 0) !== 10_000) {
    throw new DomainError(400, "VALIDATION_ERROR", "Les allocations confirmées doivent totaliser 10 000 points de base en V1.");
  }
  const now = nowIso();
  if (currentAgreement.transaction_type === "rental" && source.useSuggestedAllocation === true) {
    throw new DomainError(400, "RENTAL_AUTOMATION_FORBIDDEN", "Aucune répartition automatique n'est autorisée pour une location.");
  }
  const statements: D1PreparedStatement[] = [
    database.prepare(`UPDATE tim_agreement_terms SET is_current = 0
      WHERE tim_agreement_id = ?1 AND is_current = 1
        AND EXISTS (SELECT 1 FROM tim_agreement WHERE id = ?1 AND version = ?2)`)
      .bind(agreementId, agreementVersion),
    database.prepare(`INSERT INTO tim_agreement_terms (
      id, tim_agreement_id, version_number, agreement_type, transaction_type,
      fee_basis, currency_code, calculation_method, payment_trigger_code,
      payment_trigger_text, conditions_text, change_reason, is_current,
      confirmed_at, confirmed_by_actor_id, allocations_confirmed_at,
      allocations_confirmed_by_actor_id, effective_at, created_at, created_by_actor_id
    ) SELECT ?1, id, ?2, agreement_type, transaction_type, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 1,
      ?10, ?11, ?12, ?13, ?14, ?15, ?11 FROM tim_agreement WHERE id = ?16 AND version = ?17`)
      .bind(termsId, validated.data.version, validated.data.feeBasis, validated.data.currency,
        validated.data.allocations.length ? "percentage" : "unknown", paymentTrigger.code,
        paymentTrigger.text,
        text(source.conditionsText ?? source.conditions_text, "Conditions", { optional: true, max: 2_000 }),
        text(source.changeReason ?? source.change_reason, "Raison", { optional: true, max: 1_000 }),
        validated.data.termsConfirmed ? now : null,
        validated.data.termsConfirmed ? context.actorId : null,
        validated.data.allocationsConfirmed ? now : null,
        validated.data.allocationsConfirmed ? context.actorId : null,
        validated.data.effectiveAt, now, agreementId, agreementVersion),
  ];
  for (const allocation of advisorAllocations) {
    statements.push(database.prepare(`INSERT INTO tim_agreement_allocation (
      id, tim_agreement_terms_id, tim_agreement_party_id, share_basis_points, created_at, created_by_actor_id
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`)
      .bind(newId("allocation"), termsId, allocation.partyId,
        integer(allocation.basisPoints, "Points de base", { min: 0, max: 10_000 }), now, context.actorId));
  }
  statements.push(
    database.prepare(`UPDATE tim_agreement SET updated_at = ?1, version = version + 1 WHERE id = ?2 AND version = ?3`)
      .bind(now, agreementId, agreementVersion),
    auditStatement(database, "revise_tim_terms", "tim_terms", termsId, termsId, context, now, {
      sql: "EXISTS (SELECT 1 FROM tim_agreement_terms WHERE id = ?10)", bindings: [termsId],
    }),
  );
  const replay = await existingReceipt(database, "revise_tim_terms", context);
  if (replay) return { id: replay, replayed: true };
  const results = await batch(database, statements);
  const updateIndex = statements.length - 2;
  if (changed(results[updateIndex]) !== 1) throw new DomainError(409, "VERSION_CONFLICT", "L'Accord TIM a été modifié ailleurs.");
  return { id: termsId, agreementId, version: agreementVersion + 1, termsVersion: validated.data.version, replayed: false };
}

export async function changeTimStatus(database: D1Database, agreementId: string, input: unknown, context: CommandContext) {
  const source = object(input);
  const normalized = {
    axis: source.axis,
    fromStatus: source.fromStatus ?? source.from_status,
    toStatus: source.toStatus ?? source.to_status,
    effectiveAt: source.effectiveAt ?? source.effective_at ?? nowIso(),
    reason: source.reason,
  };
  const validated = validateTimStatusChange(normalized);
  if (!validated.success) throw new DomainError(400, "VALIDATION_ERROR", "Le changement d'état TIM est invalide.", validated.issues);
  const now = nowIso();
  const statusEventId = newId("tim_status");
  const statements: D1PreparedStatement[] = [];
  if (validated.data.axis === "agreement" || validated.data.axis === "operation") {
    const version = expectedVersion(source.expectedVersion ?? source.expected_version);
    const column = validated.data.axis === "agreement" ? "current_agreement_status" : "current_operation_status";
    const additional = validated.data.axis === "agreement"
      ? validated.data.toStatus === "signed"
        ? ", form_signed_at = COALESCE(form_signed_at, ?1), formalized_at = COALESCE(formalized_at, ?1)"
        : validated.data.toStatus === "omega_uploaded"
          ? ", omega_uploaded_at = COALESCE(omega_uploaded_at, ?1)"
          : ""
      : validated.data.toStatus === "mandate_obtained" ? ", mandate_obtained_at = COALESCE(mandate_obtained_at, ?1)" : "";
    statements.push(database.prepare(`UPDATE tim_agreement SET ${column} = ?2${additional}, updated_at = ?1,
      version = version + 1 WHERE id = ?3 AND version = ?4 AND ${column} = ?5`)
      .bind(now, validated.data.toStatus, agreementId, version, validated.data.fromStatus));
    statements.push(database.prepare(`INSERT INTO tim_status_event (
      id, tim_agreement_id, state_axis, from_state, to_state, source_kind, reason,
      effective_at, recorded_at, actor_id
    ) SELECT ?1, ?2, ?3, ?4, ?5, 'manual', ?6, ?7, ?8, ?9
      WHERE EXISTS (SELECT 1 FROM tim_agreement WHERE id = ?2 AND version = ?10 AND updated_at = ?8)`)
      .bind(statusEventId, agreementId, validated.data.axis, validated.data.fromStatus,
        validated.data.toStatus, validated.data.reason ?? null, validated.data.effectiveAt,
        now, context.actorId, version + 1));
  } else {
    const compensationId = text(source.compensationId ?? source.compensation_id, "Rémunération", { max: 128 })!;
    const version = expectedVersion(source.expectedVersion ?? source.expected_version);
    statements.push(database.prepare(`UPDATE tim_compensation SET current_compensation_status = ?1,
      updated_at = ?2, version = version + 1 WHERE id = ?3 AND tim_agreement_id = ?4
      AND version = ?5 AND current_compensation_status = ?6`)
      .bind(validated.data.toStatus, now, compensationId, agreementId, version, validated.data.fromStatus));
    statements.push(database.prepare(`INSERT INTO tim_status_event (
      id, tim_agreement_id, tim_compensation_id, state_axis, from_state, to_state,
      source_kind, reason, effective_at, recorded_at, actor_id
    ) SELECT ?1, ?2, ?3, 'compensation', ?4, ?5, 'manual', ?6, ?7, ?8, ?9
      WHERE EXISTS (SELECT 1 FROM tim_compensation WHERE id = ?3 AND version = ?10 AND updated_at = ?8)`)
      .bind(statusEventId, agreementId, compensationId, validated.data.fromStatus,
        validated.data.toStatus, validated.data.reason ?? null, validated.data.effectiveAt,
        now, context.actorId, version + 1));
  }
  statements.push(auditStatement(database, "change_tim_status", "tim_agreement", agreementId, agreementId, context, now, {
    sql: "EXISTS (SELECT 1 FROM tim_status_event WHERE id = ?10)", bindings: [statusEventId],
  }));
  const replay = await existingReceipt(database, "change_tim_status", context);
  if (replay) return { id: replay, replayed: true };
  const results = await batch(database, statements);
  if (changed(results[0]) !== 1) throw new DomainError(409, "VERSION_CONFLICT", "L'état TIM a changé depuis l'ouverture de la fiche.");
  return { id: agreementId, statusEventId, axis: validated.data.axis, replayed: false };
}

export async function recordTimCompensation(database: D1Database, agreementId: string, input: unknown, context: CommandContext) {
  const source = object(input);
  const compensationId = newId("compensation");
  const normalized = {
    id: compensationId,
    agreementId,
    beneficiaryPartyId: source.beneficiaryPartyId ?? source.beneficiary_party_id,
    termsId: source.termsId ?? source.terms_id,
    supersedesCompensationId: source.supersedesCompensationId ?? source.supersedes_compensation_id,
    status: source.status ?? source.compensationStatus,
    estimatedTotalFeesMinor: source.estimatedTotalFeesMinor ?? source.estimated_total_fees_minor ?? 0,
    estimatedShareMinor: source.estimatedShareMinor ?? source.estimated_share_minor ?? 0,
    amountDueMinor: source.amountDueMinor ?? source.amount_due_minor ?? 0,
    amountPaidMinor: source.amountPaidMinor ?? source.amount_paid_minor ?? 0,
    currency: source.currency ?? source.currencyCode ?? "EUR",
    dueAt: source.dueAt ?? source.due_at,
    expectedPaymentAt: source.expectedPaymentAt ?? source.expected_payment_at,
    note: source.note ?? source.calculationNote,
    version: 1,
  };
  const validated = validateTimCompensation(normalized);
  if (!validated.success) throw new DomainError(400, "VALIDATION_ERROR", "La rémunération TIM est invalide.", validated.issues);
  if (validated.data.amountPaidMinor !== 0) throw new DomainError(400, "VALIDATION_ERROR", "Le payé provient uniquement des écritures de paiement.");
  const agreementVersion = expectedVersion(source.expectedVersion ?? source.expected_version);
  const now = nowIso();
  const statements: D1PreparedStatement[] = [];
  if (validated.data.supersedesCompensationId) {
    statements.push(database.prepare(`UPDATE tim_compensation SET is_current = 0, updated_at = ?1,
      version = version + 1 WHERE id = ?2 AND tim_agreement_id = ?3 AND is_current = 1
      AND EXISTS (SELECT 1 FROM tim_agreement WHERE id = ?3 AND version = ?4)`)
      .bind(now, validated.data.supersedesCompensationId, agreementId, agreementVersion));
  }
  statements.push(database.prepare(`INSERT INTO tim_compensation (
    id, tim_agreement_id, beneficiary_party_id, tim_agreement_terms_id,
    supersedes_compensation_id, is_current, current_compensation_status,
    estimated_total_fees_minor, estimated_share_minor, amount_due_minor, amount_paid_minor,
    currency_code, due_at, expected_payment_at, calculation_note,
    created_at, updated_at, created_by_actor_id, version
  ) SELECT ?1, agreement.id, ?2, ?3, ?4, 1, ?5, ?6, ?7, ?8,
    COALESCE((SELECT previous.amount_paid_minor FROM tim_compensation previous
      WHERE previous.id = ?4 AND previous.tim_agreement_id = agreement.id), 0),
    ?9, ?10, ?11, ?12,
    ?13, ?13, ?14, 1 FROM tim_agreement agreement WHERE agreement.id = ?15 AND agreement.version = ?16`)
    .bind(compensationId, validated.data.beneficiaryPartyId, validated.data.termsId,
      validated.data.supersedesCompensationId ?? null, validated.data.status,
      validated.data.estimatedTotalFeesMinor, validated.data.estimatedShareMinor,
      validated.data.amountDueMinor, validated.data.currency, validated.data.dueAt ?? null,
      validated.data.expectedPaymentAt ?? null, validated.data.note ?? null, now, context.actorId,
      agreementId, agreementVersion));
  statements.push(
    database.prepare(`UPDATE tim_agreement SET updated_at = ?1, version = version + 1 WHERE id = ?2 AND version = ?3`)
      .bind(now, agreementId, agreementVersion),
    database.prepare(`INSERT INTO tim_status_event (
      id, tim_agreement_id, tim_compensation_id, state_axis, from_state, to_state,
      source_kind, reason, effective_at, recorded_at, actor_id
    ) SELECT ?1, ?2, ?3, 'compensation', ?4, ?5, 'manual', ?6, ?7, ?7, ?8
      WHERE EXISTS (SELECT 1 FROM tim_compensation WHERE id = ?3)`)
      .bind(newId("tim_status"), agreementId, compensationId,
        validated.data.supersedesCompensationId ? null : "not_due", validated.data.status,
        validated.data.note ?? null, now, context.actorId),
    auditStatement(database, "record_tim_compensation", "tim_compensation", compensationId, compensationId, context, now, {
      sql: "EXISTS (SELECT 1 FROM tim_compensation WHERE id = ?10)", bindings: [compensationId],
    }),
  );
  const replay = await existingReceipt(database, "record_tim_compensation", context);
  if (replay) return { id: replay, replayed: true };
  const results = await batch(database, statements);
  const agreementUpdateIndex = validated.data.supersedesCompensationId ? 2 : 1;
  if (changed(results[agreementUpdateIndex]) !== 1) throw new DomainError(409, "VERSION_CONFLICT", "L'Accord TIM a été modifié ailleurs.");
  return { id: compensationId, agreementId, version: agreementVersion + 1, replayed: false };
}

export async function recordTimPayment(database: D1Database, agreementId: string, input: unknown, context: CommandContext) {
  const source = object(input);
  const paymentId = newId("payment");
  const compensationId = text(source.compensationId ?? source.compensation_id, "Rémunération", { max: 128 })!;
  const paymentKind = source.kind ?? "payment";
  const rawAmount = source.amountMinor ?? source.amount_minor;
  const signedAmount = paymentKind === "refund" && typeof rawAmount === "number" && rawAmount > 0
    ? -rawAmount
    : rawAmount;
  const normalized = {
    id: paymentId,
    compensationId,
    kind: paymentKind,
    amountMinor: signedAmount,
    currency: source.currency ?? source.currencyCode ?? "EUR",
    status: source.status ?? "confirmed",
    paidAt: source.paidAt ?? source.paid_at ?? nowIso(),
    idempotencyKey: context.idempotencyKey,
    reversesPaymentId: source.reversesPaymentId ?? source.reverses_payment_id,
    reference: source.reference ?? source.externalReference,
  };
  const validated = validateTimPayment(normalized);
  if (!validated.success) throw new DomainError(400, "VALIDATION_ERROR", "Le paiement TIM est invalide.", validated.issues);
  const version = expectedVersion(source.expectedVersion ?? source.expected_version);
  const now = nowIso();
  const statements = [
    database.prepare(`INSERT INTO tim_payment (
      id, tim_compensation_id, idempotency_key, request_fingerprint, kind,
      amount_minor, currency_code, status, reverses_payment_id, external_reference,
      paid_at, recorded_at, recorded_by_actor_id
    ) SELECT ?1, id, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12
      FROM tim_compensation WHERE id = ?13 AND tim_agreement_id = ?14 AND version = ?15 AND is_current = 1`)
      .bind(paymentId, context.idempotencyKey, context.fingerprint, validated.data.kind,
        validated.data.amountMinor, validated.data.currency, validated.data.status,
        validated.data.reversesPaymentId ?? null, validated.data.reference ?? null,
        validated.data.paidAt ?? null, now, context.actorId, compensationId, agreementId, version),
    database.prepare(`UPDATE tim_compensation SET amount_paid_minor = amount_paid_minor + ?1,
      updated_at = ?2, version = version + 1 WHERE id = ?3 AND tim_agreement_id = ?4 AND version = ?5
      AND EXISTS (SELECT 1 FROM tim_payment WHERE id = ?6)`)
      .bind(validated.data.status === "confirmed" ? validated.data.amountMinor : 0,
        now, compensationId, agreementId, version, paymentId),
    auditStatement(database, "record_tim_payment", "tim_payment", paymentId, paymentId, context, now, {
      sql: "EXISTS (SELECT 1 FROM tim_payment WHERE id = ?10)", bindings: [paymentId],
    }),
  ];
  const replay = await existingReceipt(database, "record_tim_payment", context);
  if (replay) return { id: replay, replayed: true };
  try {
    const results = await batch(database, statements);
    if (changed(results[0]) !== 1 || changed(results[1]) !== 1) {
      throw new DomainError(409, "VERSION_CONFLICT", "La rémunération a été modifiée ailleurs.");
    }
  } catch (error) {
    if (error instanceof DomainError && error.status === 409) {
      const concurrent = await existingReceipt(database, "record_tim_payment", context);
      if (concurrent) return { id: concurrent, replayed: true };
    }
    throw error;
  }
  return { id: paymentId, compensationId, version: version + 1, replayed: false };
}

export async function createLabObservation(database: D1Database, input: unknown, context: CommandContext) {
  const source = object(input);
  const id = newId("lab");
  const now = nowIso();
  const statements = [
    database.prepare(`INSERT INTO lab_observation (
      id, observation, problem, learning, improvement_proposal, status,
      internal_reference, observed_at, created_at, updated_at, created_by_actor_id, version
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9, ?10, 1)`)
      .bind(id, text(source.observation, "Observation", { max: 2_000 }),
        text(source.problem, "Problème", { optional: true, max: 2_000 }) ?? "",
        text(source.learning, "Enseignement", { optional: true, max: 2_000 }) ?? "",
        text(source.improvementProposal ?? source.improvement_proposal, "Proposition", { optional: true, max: 2_000 }) ?? "",
        enumValue(source.status ?? "captured", LAB_OBSERVATION_STATUSES, "Statut"),
        text(source.internalReference ?? source.internal_reference, "Référence", { optional: true, max: 100 }),
        requiredIso(source.observedAt ?? source.observed_at ?? now, "Date"), now, context.actorId),
    auditStatement(database, "create_lab_observation", "lab_observation", id, id, context, now),
  ];
  return runIdempotent(database, "create_lab_observation", context, id, statements);
}

export async function changeLabStatus(database: D1Database, observationId: string, input: unknown, context: CommandContext) {
  const source = object(input);
  const version = expectedVersion(source.expectedVersion ?? source.expected_version);
  const status = enumValue(source.status, LAB_OBSERVATION_STATUSES, "Statut");
  const now = nowIso();
  const statements = [
    database.prepare(`UPDATE lab_observation SET status = ?1, updated_at = ?2, version = version + 1
      WHERE id = ?3 AND version = ?4`).bind(status, now, observationId, version),
    auditStatement(database, "change_lab_status", "lab_observation", observationId, observationId, context, now, {
      sql: "EXISTS (SELECT 1 FROM lab_observation WHERE id = ?10 AND version = ?11 AND updated_at = ?12)",
      bindings: [observationId, version + 1, now],
    }),
  ];
  const replay = await existingReceipt(database, "change_lab_status", context);
  if (replay) return { id: replay, replayed: true };
  const results = await batch(database, statements);
  if (changed(results[0]) !== 1) throw new DomainError(409, "VERSION_CONFLICT", "L'observation a été modifiée ailleurs.");
  return { id: observationId, status, version: version + 1, replayed: false };
}

export async function auditExport(database: D1Database, personId: string, withContacts: boolean, context: CommandContext) {
  const now = nowIso();
  const targetId = newId("export");
  return runIdempotent(database, "export_client_markdown", context, targetId, [
    database.prepare(`INSERT INTO audit_event (
      id, actor_id, action, target_kind, target_id, result, idempotency_key,
      request_fingerprint, result_target_id, metadata_json, occurred_at
    ) VALUES (?1, ?2, 'export_client_markdown', 'export', ?3, 'success', ?4, ?5, ?6, ?7, ?8)`)
      .bind(newId("audit"), context.actorId, personId, context.idempotencyKey, context.fingerprint,
        targetId, JSON.stringify({ withContacts }), now),
  ]);
}
