import type { D1Database } from "@cloudflare/workers-types";
import { allRows, DomainError, firstRow } from "./db";

const OPEN_TASKS = "'open','in_progress','waiting'";
const ACTIVE_PROJECTS = "'new','qualifying','active','paused'";
const OPEN_TIM = "'to_formalize','signed','omega_uploaded','active'";
const PARIS_TIME_ZONE = "Europe/Paris";
const PARIS_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: PARIS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function dateTimeParts(date: Date): DateTimeParts {
  const values = Object.fromEntries(
    PARIS_PARTS.formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  ) as unknown as DateTimeParts;
  return values;
}

function parisLocalMidnightUtc(year: number, month: number, day: number): Date {
  const target = Date.UTC(year, month - 1, day, 0, 0, 0);
  let candidate = target;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const observed = dateTimeParts(new Date(candidate));
    const observedAsUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      observed.second,
    );
    const correction = target - observedAsUtc;
    candidate += correction;
    if (correction === 0) break;
  }
  return new Date(candidate);
}

export function parisDayBounds(now: Date): { start: Date; end: Date } {
  const local = dateTimeParts(now);
  const nextCalendarDay = new Date(Date.UTC(local.year, local.month - 1, local.day + 1));
  return {
    start: parisLocalMidnightUtc(local.year, local.month, local.day),
    end: parisLocalMidnightUtc(
      nextCalendarDay.getUTCFullYear(),
      nextCalendarDay.getUTCMonth() + 1,
      nextCalendarDay.getUTCDate(),
    ),
  };
}

export async function getToday(database: D1Database, now = new Date()): Promise<Record<string, unknown>> {
  const { start: todayStart, end: tomorrow } = parisDayBounds(now);
  const nowIso = now.toISOString();
  const startIso = todayStart.toISOString();
  const endIso = tomorrow.toISOString();

  const taskBase = `
    SELECT task.id, task.title, task.status, task.priority, task.due_at AS dueAt,
      task.waiting_reason AS waitingReason, task.is_next_action AS isNextAction,
      task.project_id AS projectId, task.tim_agreement_id AS timAgreementId,
      person.id AS personId,
      COALESCE(person.preferred_name, trim(person.first_name || ' ' || person.last_name), agreement.label) AS contextLabel,
      CASE WHEN task.project_id IS NOT NULL THEN 'project' ELSE 'tim' END AS contextKind
    FROM task
    LEFT JOIN project ON project.id = task.project_id
    LEFT JOIN project_party ON project_party.project_id = project.id
      AND project_party.role = 'primary' AND project_party.valid_to IS NULL
    LEFT JOIN person ON person.id = project_party.person_id
    LEFT JOIN tim_agreement agreement ON agreement.id = task.tim_agreement_id
  `;
  const actionsToday = await allRows(database.prepare(`${taskBase}
    WHERE task.status IN (${OPEN_TASKS}) AND task.due_at >= ?1 AND task.due_at < ?2
    ORDER BY CASE task.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, task.due_at
  `).bind(startIso, endIso));
  const overdueRows = await allRows<{ dueAt: string; [key: string]: unknown }>(database.prepare(`${taskBase}
    WHERE task.status IN (${OPEN_TASKS}) AND task.due_at < ?1
    ORDER BY task.due_at, CASE task.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END
  `).bind(nowIso));
  const overdue = overdueRows.map((row) => ({
    ...row,
    daysOverdue: Math.max(1, Math.ceil((now.getTime() - Date.parse(row.dueAt)) / 86_400_000)),
  }));
  const withoutNextAction = await allRows(database.prepare(`
    SELECT 'project' AS kind, project.id, project.type, project.status, project.stage_key AS stage,
      person.id AS personId,
      COALESCE(person.preferred_name, trim(person.first_name || ' ' || person.last_name), project.objective) AS label
    FROM project
    LEFT JOIN project_party ON project_party.project_id = project.id
      AND project_party.role = 'primary' AND project_party.valid_to IS NULL
    LEFT JOIN person ON person.id = project_party.person_id
    WHERE project.status IN (${ACTIVE_PROJECTS})
      AND NOT EXISTS (
        SELECT 1 FROM task WHERE task.project_id = project.id
          AND task.is_next_action = 1 AND task.status IN (${OPEN_TASKS})
      )
    UNION ALL
    SELECT 'tim' AS kind, agreement.id, agreement.transaction_type AS type,
      agreement.current_agreement_status AS status, agreement.current_operation_status AS stage,
      NULL AS personId, agreement.label
    FROM tim_agreement agreement
    WHERE agreement.current_agreement_status IN (${OPEN_TIM})
      AND NOT EXISTS (
        SELECT 1 FROM task WHERE task.tim_agreement_id = agreement.id
          AND task.is_next_action = 1 AND task.status IN (${OPEN_TASKS})
      )
    ORDER BY kind, label
  `));
  const promisedReturns = await allRows(database.prepare(`
    SELECT interaction.id, interaction.promised_action AS title,
      interaction.promised_due_at AS dueAt, interaction.project_id AS projectId,
      interaction.tim_agreement_id AS timAgreementId,
      person.id AS personId,
      COALESCE(person.preferred_name, trim(person.first_name || ' ' || person.last_name), agreement.label) AS contextLabel,
      CASE WHEN interaction.project_id IS NOT NULL THEN 'project' ELSE 'tim' END AS contextKind
    FROM interaction
    LEFT JOIN project ON project.id = interaction.project_id
    LEFT JOIN project_party ON project_party.project_id = project.id
      AND project_party.role = 'primary' AND project_party.valid_to IS NULL
    LEFT JOIN person ON person.id = project_party.person_id
    LEFT JOIN tim_agreement agreement ON agreement.id = interaction.tim_agreement_id
    WHERE interaction.promised_due_at IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM task WHERE task.promised_from_interaction_id = interaction.id
          AND task.status IN ('completed','cancelled')
      )
    ORDER BY interaction.promised_due_at
    LIMIT 100
  `));

  const newDossiers = await allRows(database.prepare(`
    SELECT person.id AS personId, project.id AS projectId,
      COALESCE(person.preferred_name, trim(person.first_name || ' ' || person.last_name)) AS label,
      project.type, project.status, project.stage_key AS stage, project.created_at AS createdAt
    FROM project
    JOIN project_party party ON party.project_id = project.id
      AND party.role = 'primary' AND party.valid_to IS NULL
    JOIN person ON person.id = party.person_id
    WHERE project.status IN ('new','qualifying')
    ORDER BY project.created_at DESC
    LIMIT 25
  `));

  return { generatedAt: nowIso, actionsToday, overdue, withoutNextAction, promisedReturns, newDossiers };
}

export interface ClientFilters {
  search?: string;
  type?: string;
  status?: string;
  stage?: string;
  origin?: string;
  overdue?: boolean;
  withoutNextAction?: boolean;
}

export async function listClients(database: D1Database, filters: ClientFilters = {}): Promise<unknown[]> {
  const clauses = ["project_party.role IN ('primary','co_buyer','co_seller')", "project_party.valid_to IS NULL"];
  const bindings: unknown[] = [];
  const add = (sql: string, value?: unknown) => {
    clauses.push(sql.replace("?", `?${bindings.length + 1}`));
    bindings.push(value);
  };
  if (filters.type) add("project.type = ?", filters.type);
  if (filters.status) add("project.status = ?", filters.status);
  if (filters.stage) add("project.stage_key = ?", filters.stage);
  if (filters.origin) add("person.origin = ?", filters.origin);
  if (filters.search) {
    const query = `%${filters.search.trim().toLowerCase()}%`;
    const offset = bindings.length;
    clauses.push(`(
      lower(person.first_name || ' ' || person.last_name || ' ' || COALESCE(person.preferred_name,'')) LIKE ?${offset + 1}
      OR lower(person.summary) LIKE ?${offset + 2}
      OR EXISTS (SELECT 1 FROM contact_method contact WHERE contact.person_id = person.id AND lower(contact.normalized_value) LIKE ?${offset + 3})
    )`);
    bindings.push(query, query, query);
  }
  if (filters.withoutNextAction) clauses.push(`NOT EXISTS (
    SELECT 1 FROM task next_task WHERE next_task.project_id = project.id
      AND next_task.is_next_action = 1 AND next_task.status IN (${OPEN_TASKS})
  )`);
  if (filters.overdue) clauses.push(`EXISTS (
    SELECT 1 FROM task late_task WHERE late_task.project_id = project.id
      AND late_task.status IN (${OPEN_TASKS}) AND late_task.due_at < strftime('%Y-%m-%dT%H:%M:%fZ','now')
  )`);

  return allRows(database.prepare(`
    SELECT person.id AS personId, person.first_name AS firstName, person.last_name AS lastName,
      person.preferred_name AS preferredName, person.origin, person.summary,
      project.id AS projectId, project.type AS projectType, project.status, project.stage_key AS stage,
      project.last_interaction_at AS lastInteractionAt, project.version AS projectVersion,
      next_task.id AS nextActionId, next_task.title AS nextAction,
      next_task.due_at AS nextActionDueAt, next_task.priority AS nextActionPriority,
      CASE WHEN next_task.due_at < strftime('%Y-%m-%dT%H:%M:%fZ','now') THEN 1 ELSE 0 END AS overdue,
      CASE WHEN next_task.id IS NULL THEN 1 ELSE 0 END AS withoutNextAction,
      CASE WHEN EXISTS (
        SELECT 1 FROM buyer_search search
        JOIN criterion_event criterion ON criterion.buyer_search_id = search.id
        WHERE search.project_id = project.id AND criterion.certainty = 'to_confirm'
          AND NOT EXISTS (SELECT 1 FROM criterion_event successor WHERE successor.replaces_criterion_event_id = criterion.id)
      ) THEN 1 ELSE 0 END AS hasToConfirm
    FROM person
    JOIN project_party ON project_party.person_id = person.id
    JOIN project ON project.id = project_party.project_id
    LEFT JOIN task next_task ON next_task.project_id = project.id
      AND next_task.is_next_action = 1 AND next_task.status IN (${OPEN_TASKS})
    WHERE ${clauses.join(" AND ")}
    ORDER BY COALESCE(next_task.due_at, '9999-12-31'), lower(COALESCE(person.preferred_name, person.first_name || ' ' || person.last_name))
    LIMIT 250
  `).bind(...bindings));
}

export async function getClient(database: D1Database, personId: string): Promise<Record<string, unknown>> {
  const person = await firstRow<Record<string, unknown>>(database.prepare(`
    SELECT id, first_name AS firstName, last_name AS lastName, preferred_name AS preferredName,
      origin, summary, status, last_contact_at AS lastContactAt, created_at AS createdAt,
      updated_at AS updatedAt, version FROM person WHERE id = ?1
  `).bind(personId));
  if (!person) throw new DomainError(404, "NOT_FOUND", "Client introuvable.");

  const directProjectCount = await firstRow<{ count: number }>(database.prepare(`
    SELECT count(*) AS count FROM project_party
    WHERE person_id = ?1 AND role IN ('primary','co_buyer','co_seller') AND valid_to IS NULL
  `).bind(personId));
  if (!directProjectCount?.count) throw new DomainError(404, "NOT_FOUND", "Ce contact n'appartient pas au pipeline client.");

  const [contacts, projects, searches, scenarios, criteria, interactions, tasks, decisions, relationships] = await Promise.all([
    allRows(database.prepare(`SELECT id, type, display_value AS displayValue, normalized_value AS normalizedValue,
      is_primary AS isPrimary, verification_status AS verificationStatus FROM contact_method WHERE person_id = ?1 ORDER BY is_primary DESC, type`).bind(personId)),
    allRows(database.prepare(`SELECT project.id, project.type, project.status, project.stage_key AS stage,
      project.objective, project.calendar_summary AS calendarSummary, project.last_interaction_at AS lastInteractionAt,
      project.created_at AS createdAt, project.updated_at AS updatedAt, project.version
      FROM project JOIN project_party ON project_party.project_id = project.id
      WHERE project_party.person_id = ?1
        AND project_party.role IN ('primary','co_buyer','co_seller')
        AND project_party.valid_to IS NULL ORDER BY project.updated_at DESC`).bind(personId)),
    allRows(database.prepare(`SELECT search.id, search.project_id AS projectId, search.status, search.summary,
      search.opened_at AS openedAt, search.updated_at AS updatedAt, search.version
      FROM buyer_search search JOIN project_party party ON party.project_id = search.project_id
      WHERE party.person_id = ?1 AND party.role IN ('primary','co_buyer','co_seller')
        AND party.valid_to IS NULL`).bind(personId)),
    allRows(database.prepare(`SELECT scenario.id, scenario.buyer_search_id AS buyerSearchId, scenario.kind,
      scenario.label, scenario.condition_text AS conditionText, scenario.priority, scenario.effective_at AS effectiveAt
      FROM search_scenario scenario JOIN buyer_search search ON search.id = scenario.buyer_search_id
      JOIN project_party party ON party.project_id = search.project_id
      WHERE party.person_id = ?1 AND party.role IN ('primary','co_buyer','co_seller')
        AND party.valid_to IS NULL AND scenario.status = 'active'
      ORDER BY scenario.priority`).bind(personId)),
    allRows(database.prepare(`SELECT criterion.id, criterion.buyer_search_id AS buyerSearchId,
      criterion.search_scenario_id AS scenarioId, criterion.criterion_key AS criterionKey,
      criterion.operation, criterion.value_json AS valueJson, criterion.importance, criterion.flexibility,
      criterion.certainty, criterion.matching_role AS matchingRole, criterion.hard_validated AS hardValidated,
      criterion.source_kind AS sourceKind, criterion.source_ref AS sourceRef, criterion.reason,
      criterion.effective_at AS effectiveAt, criterion.recorded_at AS recordedAt,
      criterion.replaces_criterion_event_id AS replacesCriterionEventId,
      CASE WHEN EXISTS (SELECT 1 FROM criterion_event successor WHERE successor.replaces_criterion_event_id = criterion.id) THEN 0 ELSE 1 END AS isCurrent
      FROM criterion_event criterion JOIN buyer_search search ON search.id = criterion.buyer_search_id
      JOIN project_party party ON party.project_id = search.project_id
      WHERE party.person_id = ?1 AND party.role IN ('primary','co_buyer','co_seller')
        AND party.valid_to IS NULL
      ORDER BY criterion.effective_at DESC, criterion.recorded_at DESC`).bind(personId)),
    allRows(database.prepare(`SELECT interaction.id, interaction.project_id AS projectId, interaction.type,
      interaction.direction, interaction.summary, interaction.outcome, interaction.promised_action AS promisedAction,
      interaction.promised_due_at AS promisedDueAt, interaction.source_kind AS sourceKind,
      interaction.occurred_at AS occurredAt, interaction.recorded_at AS recordedAt
      FROM interaction JOIN project_party party ON party.project_id = interaction.project_id
      WHERE party.person_id = ?1 AND party.role IN ('primary','co_buyer','co_seller')
        AND party.valid_to IS NULL ORDER BY interaction.occurred_at DESC`).bind(personId)),
    allRows(database.prepare(`SELECT task.id, task.project_id AS projectId, task.title, task.status,
      task.priority, task.due_at AS dueAt, task.waiting_reason AS waitingReason,
      task.is_next_action AS isNextAction, task.completed_at AS completedAt, task.version
      FROM task JOIN project_party party ON party.project_id = task.project_id
      WHERE party.person_id = ?1 AND party.role IN ('primary','co_buyer','co_seller')
        AND party.valid_to IS NULL
      ORDER BY CASE task.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'waiting' THEN 2 ELSE 3 END,
        COALESCE(task.due_at, '9999-12-31')`).bind(personId)),
    allRows(database.prepare(`SELECT decision.id, decision.project_id AS projectId, decision.type,
      decision.summary, decision.reason, decision.source_kind AS sourceKind,
      decision.effective_at AS effectiveAt, decision.recorded_at AS recordedAt
      FROM decision JOIN project_party party ON party.project_id = decision.project_id
      WHERE party.person_id = ?1 AND party.role IN ('primary','co_buyer','co_seller')
        AND party.valid_to IS NULL ORDER BY decision.effective_at DESC`).bind(personId)),
    allRows(database.prepare(`SELECT relationship.id, relationship.source_project_id AS sourceProjectId,
      relationship.target_project_id AS targetProjectId, relationship.type, relationship.detail
      FROM project_relationship relationship
      WHERE relationship.source_project_id IN (
        SELECT project_id FROM project_party WHERE person_id = ?1
          AND role IN ('primary','co_buyer','co_seller') AND valid_to IS NULL
      ) OR relationship.target_project_id IN (
        SELECT project_id FROM project_party WHERE person_id = ?1
          AND role IN ('primary','co_buyer','co_seller') AND valid_to IS NULL
      )`).bind(personId)),
  ]);
  return { person, contacts, projects, searches, scenarios, criteria, interactions, tasks, decisions, relationships };
}

export async function listTimAgreements(database: D1Database, filters: Record<string, string | undefined> = {}): Promise<unknown[]> {
  const clauses: string[] = [];
  const bindings: unknown[] = [];
  const filterMap: Record<string, string> = {
    transactionType: "agreement.transaction_type",
    agreementStatus: "agreement.current_agreement_status",
    operationStatus: "agreement.current_operation_status",
    compensationStatus: "compensation.current_compensation_status",
  };
  for (const [key, column] of Object.entries(filterMap)) {
    if (filters[key]) {
      bindings.push(filters[key]);
      clauses.push(`${column} = ?${bindings.length}`);
    }
  }
  if (filters.advisorId) {
    bindings.push(filters.advisorId);
    clauses.push(`EXISTS (
      SELECT 1 FROM tim_agreement_party filter_party
      WHERE filter_party.tim_agreement_id = agreement.id
        AND filter_party.advisor_profile_id = ?${bindings.length}
        AND filter_party.active_to IS NULL
    )`);
  }
  if (filters.q?.trim()) {
    bindings.push(`%${filters.q.trim().slice(0, 120)}%`);
    clauses.push(`(agreement.internal_reference LIKE ?${bindings.length}
      OR agreement.label LIKE ?${bindings.length}
      OR other_advisor.display_name LIKE ?${bindings.length})`);
  }
  if (filters.dueSoon === "1") {
    clauses.push(`next_task.due_at IS NOT NULL
      AND datetime(next_task.due_at) <= datetime('now', '+7 days')`);
  }
  if (filters.withoutNextAction === "1") {
    clauses.push(`next_task.id IS NULL
      AND agreement.current_agreement_status IN (${OPEN_TIM})`);
  }
  return allRows(database.prepare(`
    SELECT agreement.id, agreement.internal_reference AS internalReference, agreement.label,
      agreement.agreement_type AS agreementType, agreement.transaction_type AS transactionType,
      agreement.current_agreement_status AS agreementStatus,
      agreement.current_operation_status AS operationStatus, agreement.version,
      other_advisor.display_name AS otherAdvisor,
      compensation.current_compensation_status AS compensationStatus,
      compensation.estimated_share_minor AS estimatedShareMinor,
      compensation.amount_due_minor AS amountDueMinor,
      compensation.amount_paid_minor AS amountPaidMinor,
      compensation.currency_code AS currencyCode,
      next_task.id AS nextActionId, next_task.title AS nextAction,
      next_task.due_at AS nextActionDueAt, next_task.priority AS nextActionPriority,
      CASE WHEN next_task.id IS NULL AND agreement.current_agreement_status IN (${OPEN_TIM}) THEN 1 ELSE 0 END AS withoutNextAction
    FROM tim_agreement agreement
    LEFT JOIN tim_agreement_party other_party ON other_party.tim_agreement_id = agreement.id AND other_party.active_to IS NULL
      AND other_party.advisor_profile_id <> (SELECT id FROM advisor_profile WHERE is_current_operator = 1 AND status = 'active' LIMIT 1)
    LEFT JOIN advisor_profile other_advisor ON other_advisor.id = other_party.advisor_profile_id
    LEFT JOIN tim_compensation compensation ON compensation.tim_agreement_id = agreement.id AND compensation.is_current = 1
      AND compensation.beneficiary_party_id IN (
        SELECT party.id FROM tim_agreement_party party JOIN advisor_profile advisor ON advisor.id = party.advisor_profile_id
        WHERE party.tim_agreement_id = agreement.id AND advisor.is_current_operator = 1
      )
    LEFT JOIN task next_task ON next_task.tim_agreement_id = agreement.id AND next_task.is_next_action = 1
      AND next_task.status IN (${OPEN_TASKS})
    ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
    GROUP BY agreement.id
    ORDER BY COALESCE(next_task.due_at, '9999-12-31'), agreement.updated_at DESC
    LIMIT 250
  `).bind(...bindings));
}

export async function getTimAgreement(database: D1Database, agreementId: string): Promise<Record<string, unknown>> {
  const agreement = await firstRow<Record<string, unknown>>(database.prepare(`
    SELECT id, internal_reference AS internalReference, label, agreement_type AS agreementType,
      transaction_type AS transactionType, information_nature AS informationNature,
      subject_person_id AS subjectPersonId, subject_label AS subjectLabel,
      current_agreement_status AS agreementStatus, current_operation_status AS operationStatus,
      information_transmitted_at AS informationTransmittedAt, formalized_at AS formalizedAt,
      form_signed_at AS formSignedAt, omega_uploaded_at AS omegaUploadedAt,
      mandate_obtained_at AS mandateObtainedAt, mandate_reference AS mandateReference,
      notes, created_at AS createdAt, updated_at AS updatedAt, version
    FROM tim_agreement WHERE id = ?1
  `).bind(agreementId));
  if (!agreement) throw new DomainError(404, "NOT_FOUND", "Accord TIM introuvable.");
  const [parties, terms, allocations, compensations, payments, tasks, statusEvents, interactions] = await Promise.all([
    allRows(database.prepare(`SELECT party.id, party.role, party.responsibility_text AS responsibilityText,
      advisor.id AS advisorId, advisor.display_name AS displayName, advisor.network,
      advisor.is_current_operator AS isCurrentOperator
      FROM tim_agreement_party party JOIN advisor_profile advisor ON advisor.id = party.advisor_profile_id
      WHERE party.tim_agreement_id = ?1 AND party.active_to IS NULL ORDER BY advisor.is_current_operator DESC, advisor.display_name`).bind(agreementId)),
    allRows(database.prepare(`SELECT id, version_number AS versionNumber, agreement_type AS agreementType,
      transaction_type AS transactionType, fee_basis AS feeBasis, currency_code AS currencyCode,
      calculation_method AS calculationMethod, payment_trigger_code AS paymentTriggerCode,
      payment_trigger_text AS paymentTriggerText, conditions_text AS conditionsText,
      change_reason AS changeReason, is_current AS isCurrent, confirmed_at AS confirmedAt,
      allocations_confirmed_at AS allocationsConfirmedAt, effective_at AS effectiveAt
      FROM tim_agreement_terms WHERE tim_agreement_id = ?1 ORDER BY version_number DESC`).bind(agreementId)),
    allRows(database.prepare(`SELECT allocation.id, allocation.tim_agreement_terms_id AS termsId,
      allocation.tim_agreement_party_id AS partyId, allocation.share_basis_points AS shareBasisPoints
      FROM tim_agreement_allocation allocation JOIN tim_agreement_terms terms ON terms.id = allocation.tim_agreement_terms_id
      WHERE terms.tim_agreement_id = ?1 ORDER BY terms.version_number DESC, allocation.share_basis_points DESC`).bind(agreementId)),
    allRows(database.prepare(`SELECT id, beneficiary_party_id AS beneficiaryPartyId,
      tim_agreement_terms_id AS termsId, supersedes_compensation_id AS supersedesCompensationId,
      is_current AS isCurrent, current_compensation_status AS compensationStatus,
      estimated_total_fees_minor AS estimatedTotalFeesMinor, estimated_share_minor AS estimatedShareMinor,
      amount_due_minor AS amountDueMinor, amount_paid_minor AS amountPaidMinor,
      currency_code AS currencyCode, due_at AS dueAt, expected_payment_at AS expectedPaymentAt,
      calculation_note AS calculationNote, version FROM tim_compensation
      WHERE tim_agreement_id = ?1 ORDER BY is_current DESC, created_at DESC`).bind(agreementId)),
    allRows(database.prepare(`SELECT payment.id, payment.tim_compensation_id AS compensationId,
      payment.kind, payment.amount_minor AS amountMinor, payment.currency_code AS currencyCode,
      payment.status, payment.external_reference AS externalReference, payment.paid_at AS paidAt,
      payment.recorded_at AS recordedAt FROM tim_payment payment
      JOIN tim_compensation compensation ON compensation.id = payment.tim_compensation_id
      WHERE compensation.tim_agreement_id = ?1 ORDER BY payment.recorded_at DESC`).bind(agreementId)),
    allRows(database.prepare(`SELECT id, title, status, priority, due_at AS dueAt,
      waiting_reason AS waitingReason, is_next_action AS isNextAction, completed_at AS completedAt, version
      FROM task WHERE tim_agreement_id = ?1 ORDER BY is_next_action DESC, COALESCE(due_at,'9999-12-31')`).bind(agreementId)),
    allRows(database.prepare(`SELECT id, tim_compensation_id AS compensationId, state_axis AS stateAxis,
      from_state AS fromState, to_state AS toState, reason, effective_at AS effectiveAt,
      recorded_at AS recordedAt FROM tim_status_event WHERE tim_agreement_id = ?1
      ORDER BY effective_at DESC, recorded_at DESC`).bind(agreementId)),
    allRows(database.prepare(`SELECT id, type, direction, summary, outcome, promised_action AS promisedAction,
      promised_due_at AS promisedDueAt, occurred_at AS occurredAt, recorded_at AS recordedAt
      FROM interaction WHERE tim_agreement_id = ?1 ORDER BY occurred_at DESC`).bind(agreementId)),
  ]);
  return { agreement, parties, terms, allocations, compensations, payments, tasks, statusEvents, interactions };
}

export async function listAdvisors(database: D1Database): Promise<unknown[]> {
  return allRows(database.prepare(`SELECT id, display_name AS displayName, network,
    is_current_operator AS isCurrentOperator, status, version FROM advisor_profile
    WHERE status = 'active' ORDER BY is_current_operator DESC, display_name`));
}

export async function listLab(database: D1Database): Promise<unknown[]> {
  return allRows(database.prepare(`SELECT id, observation, problem, learning,
    improvement_proposal AS improvementProposal, status, internal_reference AS internalReference,
    observed_at AS observedAt, created_at AS createdAt, updated_at AS updatedAt, version
    FROM lab_observation ORDER BY observed_at DESC, created_at DESC LIMIT 250`));
}
