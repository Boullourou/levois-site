import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createClientAndProject,
  createTask,
  createTimAgreement,
  recordInteraction,
  recordTimCompensation,
  recordTimPayment,
  reviseCriterion,
} from "./commands";
import { getClient, getToday, listClients, parisDayBounds } from "./queries";
import { SqliteD1 } from "./testing/sqlite-d1";

const migrationFiles = [
  "0001_cockpit_identity.sql",
  "0002_cockpit_projects.sql",
  "0003_cockpit_search_history.sql",
  "0004_cockpit_tim_core.sql",
  "0005_cockpit_workflow_tim_finance.sql",
  "0006_cockpit_governance_integrity.sql",
];

function applyFiles(sqlite: SqliteD1, files: string[]) {
  for (const file of files) sqlite.raw.exec(readFileSync(resolve(process.cwd(), "db", file.includes("cockpit-v1") ? "fixtures" : "migrations", file), "utf8"));
}

function command(key: string, fingerprint = `fingerprint-${key}`) {
  return { actorId: "test-operator", idempotencyKey: key, fingerprint };
}

describe("cockpit D1 vertical slice", () => {
  let sqlite: SqliteD1;

  beforeEach(() => {
    sqlite = new SqliteD1();
    applyFiles(sqlite, migrationFiles);
  });

  afterEach(() => sqlite.close());

  it("applies all migrations on an empty database with exactly 22 product tables", () => {
    const tables = sqlite.raw.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`).all() as Array<{ name: string }>;
    expect(tables).toHaveLength(22);
    expect(sqlite.raw.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  });

  it("loads only fictional fixtures and excludes a TIM-only person from Clients", async () => {
    applyFiles(sqlite, ["cockpit-v1.sql"]);
    const clients = await listClients(sqlite.asD1());
    expect(clients).toHaveLength(2);
    expect(JSON.stringify(clients)).not.toContain("demo-person-tim-subject-001");
    expect(sqlite.raw.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  });

  it("creates a client, active project, search and next action atomically and idempotently", async () => {
    const payload = {
      person: { firstName: "Personne", lastName: "Fictive", origin: "other", summary: "Cas de test entièrement fictif." },
      project: { type: "primary_residence_purchase", status: "active", stage: "search_active", objective: "Recherche fictive" },
      search: { enabled: true, summary: "Secteur fictif" },
      nextAction: { title: "Rappeler le contact fictif", priority: "high", dueAt: new Date().toISOString() },
    };
    const first = await createClientAndProject(sqlite.asD1(), payload, command("create-client-001"));
    const retry = await createClientAndProject(sqlite.asD1(), payload, command("create-client-001"));
    expect(retry).toMatchObject({
      personId: first.personId,
      projectId: first.projectId,
      taskId: first.taskId,
      searchId: first.searchId,
      replayed: true,
    });
    expect(await listClients(sqlite.asD1())).toHaveLength(1);
    expect((await getToday(sqlite.asD1())).withoutNextAction).toEqual([]);
  });

  it("surfaces an explicitly accepted project without next action, then clears the anomaly", async () => {
    const created = await createClientAndProject(sqlite.asD1(), {
      person: { preferredName: "Dossier anomalie fictif", origin: "other" },
      project: { type: "sale", status: "active", stage: "qualification" },
      allowWithoutNextAction: true,
    }, command("create-no-task-001"));
    let today = await getToday(sqlite.asD1());
    expect((today.withoutNextAction as Array<{ id: string }>).some((item) => item.id === created.projectId)).toBe(true);
    await createTask(sqlite.asD1(), { projectId: String(created.projectId) }, {
      title: "Qualifier le projet fictif", priority: "normal", isNextAction: true, expectedVersion: 1,
    }, command("create-next-task-001"));
    today = await getToday(sqlite.asD1());
    expect((today.withoutNextAction as Array<{ id: string }>).some((item) => item.id === created.projectId)).toBe(false);
  });

  it("rejects an optimistic-concurrency loser without inserting a second task", async () => {
    const created = await createClientAndProject(sqlite.asD1(), {
      person: { preferredName: "Concurrence fictive", origin: "other" },
      project: { type: "sale", status: "active", stage: "qualification" },
      allowWithoutNextAction: true,
    }, command("create-concurrency-001"));
    await createTask(sqlite.asD1(), { projectId: String(created.projectId) }, {
      title: "Première commande", priority: "normal", isNextAction: true, expectedVersion: 1,
    }, command("concurrent-task-a"));
    await expect(createTask(sqlite.asD1(), { projectId: String(created.projectId) }, {
      title: "Commande obsolète", priority: "normal", isNextAction: true, expectedVersion: 1,
    }, command("concurrent-task-b"))).rejects.toMatchObject({ status: 409, code: "VERSION_CONFLICT" });
    const count = sqlite.raw.prepare("SELECT count(*) AS count FROM task WHERE project_id = ?").get(String(created.projectId)) as { count: number };
    expect(count.count).toBe(1);
  });

  it("uses Europe/Paris calendar boundaries even when the Worker runtime is UTC", () => {
    const summer = parisDayBounds(new Date("2026-08-18T22:30:00.000Z"));
    expect(summer.start.toISOString()).toBe("2026-08-18T22:00:00.000Z");
    expect(summer.end.toISOString()).toBe("2026-08-19T22:00:00.000Z");
    const winter = parisDayBounds(new Date("2026-12-10T23:30:00.000Z"));
    expect(winter.start.toISOString()).toBe("2026-12-10T23:00:00.000Z");
    expect(winter.end.toISOString()).toBe("2026-12-11T23:00:00.000Z");
  });

  it("reports overdue days and identifies a TIM anomaly distinctly", async () => {
    applyFiles(sqlite, ["cockpit-v1.sql"]);
    sqlite.raw.exec(`DELETE FROM task WHERE tim_agreement_id = 'demo-tim-sale-001'`);
    const today = await getToday(sqlite.asD1(), new Date());
    expect((today.overdue as Array<{ daysOverdue: number }>)[0].daysOverdue).toBeGreaterThanOrEqual(1);
    expect(today.withoutNextAction).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "demo-tim-sale-001", kind: "tim" }),
    ]));
  });

  it("gives both active projects in an achat-vente link a visible next action", async () => {
    const created = await createClientAndProject(sqlite.asD1(), {
      person: { preferredName: "Dossier lié fictif", origin: "other" },
      project: { type: "primary_residence_purchase", status: "active", stage: "qualification" },
      linkedProject: { type: "sale", status: "active", stage: "qualification" },
      nextAction: { title: "Qualifier les deux volets fictifs", priority: "normal" },
    }, command("create-linked-projects-001"));
    const tasks = sqlite.raw.prepare(`SELECT project_id FROM task WHERE is_next_action = 1 ORDER BY project_id`).all() as Array<{ project_id: string }>;
    expect(tasks.map((task) => task.project_id).sort()).toEqual([
      String(created.projectId),
      String(created.linkedProjectId),
    ].sort());
    expect((await getToday(sqlite.asD1())).withoutNextAction).toEqual([]);
  });

  it("keeps latest-contact projections monotonic and leaves no trace after a stale interaction", async () => {
    const created = await createClientAndProject(sqlite.asD1(), {
      person: { preferredName: "Historique fictif", origin: "other" },
      project: { type: "sale", status: "active", stage: "qualification" },
      allowWithoutNextAction: true,
    }, command("create-interaction-history-001"));
    await recordInteraction(sqlite.asD1(), String(created.projectId), {
      expectedVersion: 1,
      type: "call",
      direction: "outgoing",
      summary: "Interaction fictive récente",
      occurredAt: "2026-08-18T12:00:00.000Z",
    }, command("interaction-recent-001"));
    await recordInteraction(sqlite.asD1(), String(created.projectId), {
      expectedVersion: 2,
      type: "email",
      direction: "incoming",
      summary: "Interaction fictive historique",
      occurredAt: "2026-08-10T12:00:00.000Z",
    }, command("interaction-historical-001"));
    const beforeStale = sqlite.raw.prepare(`SELECT last_contact_at FROM person WHERE id = ?`).get(String(created.personId)) as { last_contact_at: string };
    expect(beforeStale.last_contact_at).toBe("2026-08-18T12:00:00.000Z");
    await expect(recordInteraction(sqlite.asD1(), String(created.projectId), {
      expectedVersion: 2,
      type: "sms",
      direction: "incoming",
      summary: "Commande fictive obsolète",
      occurredAt: "2026-08-19T12:00:00.000Z",
    }, command("interaction-stale-001"))).rejects.toMatchObject({ status: 409, code: "VERSION_CONFLICT" });
    const afterStale = sqlite.raw.prepare(`SELECT last_contact_at FROM person WHERE id = ?`).get(String(created.personId)) as { last_contact_at: string };
    expect(afterStale).toEqual(beforeStale);
    expect((sqlite.raw.prepare(`SELECT count(*) AS count FROM interaction WHERE project_id = ?`).get(String(created.projectId)) as { count: number }).count).toBe(2);
  });

  it("never exports projects where the client is only a referrer", async () => {
    const created = await createClientAndProject(sqlite.asD1(), {
      person: { preferredName: "Export cloisonné fictif", origin: "other" },
      project: { type: "sale", status: "qualifying", stage: "qualification" },
    }, command("create-export-scope-001"));
    sqlite.raw.exec(`
      INSERT INTO project (id, type, status, stage_key, responsible_actor_id)
      VALUES ('project-unrelated-fixture', 'sale', 'qualifying', 'qualification', 'test-operator');
      INSERT INTO project_party (id, project_id, person_id, role, source_kind)
      VALUES ('party-unrelated-fixture', 'project-unrelated-fixture', '${String(created.personId)}', 'referrer', 'fixture');
      INSERT INTO interaction (id, project_id, type, direction, summary, source_kind, occurred_at, recorded_at, actor_id)
      VALUES ('interaction-unrelated-fixture', 'project-unrelated-fixture', 'call', 'outgoing',
        'NE_DOIT_PAS_ETRE_EXPORTE', 'fixture', '2026-08-18T10:00:00.000Z', '2026-08-18T10:00:00.000Z', 'test-operator');
    `);
    const detail = await getClient(sqlite.asD1(), String(created.personId));
    expect((detail.projects as Array<{ id: string }>).map((project) => project.id)).toEqual([created.projectId]);
    expect(JSON.stringify(detail)).not.toContain("NE_DOIT_PAS_ETRE_EXPORTE");
  });

  it("keeps criterion history and never treats to_confirm as blocking", async () => {
    applyFiles(sqlite, ["cockpit-v1.sql"]);
    const search = sqlite.raw.prepare("SELECT version FROM buyer_search WHERE id = ?").get("demo-search-retirement-001") as { version: number };
    const result = await reviseCriterion(sqlite.asD1(), "demo-search-retirement-001", {
      scenarioId: "demo-scenario-preferred-001",
      criterionKey: "zone",
      value: "Zone fictive élargie",
      importance: "essential",
      flexibility: "none",
      certainty: "to_confirm",
      matchingRole: "hard",
      hardValidated: false,
      source: "test-fixture",
      effectiveAt: new Date().toISOString(),
      replacesCriterionEventId: "demo-criterion-area-001",
      expectedVersion: search.version,
    }, command("criterion-revise-001"));
    expect(result.isBlocking).toBe(false);
    const rows = sqlite.raw.prepare("SELECT id FROM criterion_event WHERE criterion_key = 'zone'").all();
    expect(rows).toHaveLength(2);
  });

  it("preserves the controlled label of a structured custom criterion", async () => {
    applyFiles(sqlite, ["cockpit-v1.sql"]);
    const search = sqlite.raw.prepare("SELECT version FROM buyer_search WHERE id = ?").get("demo-search-retirement-001") as { version: number };
    await reviseCriterion(sqlite.asD1(), "demo-search-retirement-001", {
      scenarioId: "demo-scenario-conditional-001",
      criterionKey: "other",
      customLabel: "Valeur finale cohérente",
      value: { maximumTotalMinor: 24000000, currency: "EUR" },
      importance: "important",
      flexibility: "medium",
      certainty: "to_confirm",
      matchingRole: "context",
      source: "test-fixture",
      effectiveAt: "2026-08-18T10:00:00.000Z",
      expectedVersion: search.version,
    }, command("criterion-custom-001"));
    const row = sqlite.raw.prepare(`SELECT value_json FROM criterion_event
      WHERE buyer_search_id = ? AND criterion_key = 'other'`).get("demo-search-retirement-001") as { value_json: string };
    expect(JSON.parse(row.value_json)).toEqual({
      value: { maximumTotalMinor: 24000000, currency: "EUR" },
      customLabel: "Valeur finale cohérente",
    });
  });

  it("keeps old TIM terms on compensation and makes payment retries idempotent", async () => {
    applyFiles(sqlite, ["cockpit-v1.sql"]);
    const agreement = sqlite.raw.prepare("SELECT version FROM tim_agreement WHERE id = ?").get("demo-tim-sale-001") as { version: number };
    const compensation = await recordTimCompensation(sqlite.asD1(), "demo-tim-sale-001", {
      beneficiaryPartyId: "demo-tim-sale-party-referrer-001",
      termsId: "demo-tim-sale-terms-v1",
      supersedesCompensationId: "demo-tim-sale-comp-001",
      status: "due",
      estimatedTotalFeesMinor: 1_000_000,
      estimatedShareMinor: 200_000,
      amountDueMinor: 200_000,
      amountPaidMinor: 0,
      currency: "EUR",
      expectedVersion: agreement.version,
    }, command("compensation-due-001"));
    const paymentPayload = {
      compensationId: compensation.id,
      kind: "payment",
      amountMinor: 50_000,
      currency: "EUR",
      status: "confirmed",
      paidAt: new Date().toISOString(),
      expectedVersion: 1,
    };
    const first = await recordTimPayment(sqlite.asD1(), "demo-tim-sale-001", paymentPayload, command("tim-payment-001"));
    const retry = await recordTimPayment(sqlite.asD1(), "demo-tim-sale-001", paymentPayload, command("tim-payment-001"));
    expect(retry).toMatchObject({ id: first.id, replayed: true });
    const row = sqlite.raw.prepare("SELECT amount_paid_minor, tim_agreement_terms_id FROM tim_compensation WHERE id = ?").get(compensation.id) as Record<string, unknown>;
    expect(row.amount_paid_minor).toBe(50_000);
    expect(row.tim_agreement_terms_id).toBe("demo-tim-sale-terms-v1");
    await recordTimPayment(sqlite.asD1(), "demo-tim-sale-001", {
      compensationId: compensation.id,
      kind: "refund",
      amountMinor: 10_000,
      currency: "EUR",
      status: "confirmed",
      paidAt: new Date().toISOString(),
      expectedVersion: 2,
    }, command("tim-refund-001"));
    const afterRefund = sqlite.raw.prepare("SELECT amount_paid_minor FROM tim_compensation WHERE id = ?").get(compensation.id) as { amount_paid_minor: number };
    expect(afterRefund.amount_paid_minor).toBe(40_000);

    const currentAgreement = sqlite.raw.prepare("SELECT version FROM tim_agreement WHERE id = ?").get("demo-tim-sale-001") as { version: number };
    const revised = await recordTimCompensation(sqlite.asD1(), "demo-tim-sale-001", {
      beneficiaryPartyId: "demo-tim-sale-party-referrer-001",
      termsId: "demo-tim-sale-terms-v1",
      supersedesCompensationId: compensation.id,
      status: "due",
      estimatedTotalFeesMinor: 1_050_000,
      estimatedShareMinor: 210_000,
      amountDueMinor: 210_000,
      amountPaidMinor: 0,
      currency: "EUR",
      expectedVersion: currentAgreement.version,
    }, command("compensation-revised-001"));
    const revisedRow = sqlite.raw.prepare(`SELECT amount_paid_minor, tim_agreement_terms_id
      FROM tim_compensation WHERE id = ?`).get(revised.id) as Record<string, unknown>;
    expect(revisedRow.amount_paid_minor).toBe(40_000);
    expect(revisedRow.tim_agreement_terms_id).toBe("demo-tim-sale-terms-v1");
  });

  it("does not unset the current TIM compensation when a stale revision loses", async () => {
    applyFiles(sqlite, ["cockpit-v1.sql"]);
    const agreement = sqlite.raw.prepare("SELECT version FROM tim_agreement WHERE id = ?").get("demo-tim-sale-001") as { version: number };
    const current = sqlite.raw.prepare(`SELECT id FROM tim_compensation
      WHERE tim_agreement_id = ? AND is_current = 1`).get("demo-tim-sale-001") as { id: string };
    await expect(recordTimCompensation(sqlite.asD1(), "demo-tim-sale-001", {
      beneficiaryPartyId: "demo-tim-sale-party-referrer-001",
      termsId: "demo-tim-sale-terms-v1",
      supersedesCompensationId: current.id,
      status: "estimated",
      estimatedTotalFeesMinor: 1_000_000,
      estimatedShareMinor: 200_000,
      amountDueMinor: 0,
      amountPaidMinor: 0,
      currency: "EUR",
      expectedVersion: agreement.version + 1,
    }, command("compensation-stale-001"))).rejects.toMatchObject({ status: 409, code: "VERSION_CONFLICT" });
    const rows = sqlite.raw.prepare(`SELECT id FROM tim_compensation
      WHERE tim_agreement_id = ? AND is_current = 1`).all("demo-tim-sale-001") as Array<{ id: string }>;
    expect(rows).toEqual([{ id: current.id }]);
  });

  it("creates a confirmed 20/80 sale atomically without coupling its three axes", async () => {
    applyFiles(sqlite, ["cockpit-v1.sql"]);
    const payload = {
      agreement: {
        internalReference: "TIM-TEST-SALE-ATOMIC",
        label: "Accord vente fictif atomique",
        agreementType: "information_referral_20_80",
        transactionType: "sale",
        informationNature: "seller",
        informationTransmittedAt: new Date().toISOString(),
        formalizedAt: new Date().toISOString(),
        formSigned: true,
        omegaUploaded: false,
        mandateObtained: true,
      },
      parties: [
        { advisorId: "demo-advisor-operator-001", role: "referrer" },
        { advisorId: "demo-advisor-alpha-001", role: "handling_advisor" },
      ],
      terms: {
        feeBasis: "ht", currency: "EUR", triggeringEvent: "Encaissement fictif confirmé",
        termsConfirmed: true, allocationsConfirmed: true,
        allocations: [
          { advisorId: "demo-advisor-operator-001", basisPoints: 2000 },
          { advisorId: "demo-advisor-alpha-001", basisPoints: 8000 },
        ],
      },
      statuses: { agreementStatus: "signed", operationStatus: "marketing_or_search_active", compensationStatus: "estimated" },
      compensation: {
        beneficiaryAdvisorId: "demo-advisor-operator-001",
        estimatedTotalFeesMinor: 900_000,
        estimatedShareMinor: 180_000,
        amountDueMinor: 0,
      },
      firstTask: { title: "Demander des nouvelles fictives", priority: "high", dueAt: new Date().toISOString() },
    };
    const result = await createTimAgreement(sqlite.asD1(), payload, command("tim-create-atomic-001"));
    const retry = await createTimAgreement(sqlite.asD1(), payload, command("tim-create-atomic-001"));
    expect(retry).toMatchObject({
      agreementId: result.agreementId,
      partyIds: result.partyIds,
      termsId: result.termsId,
      compensationId: result.compensationId,
      replayed: true,
    });
    const agreement = sqlite.raw.prepare(`SELECT current_agreement_status, current_operation_status FROM tim_agreement WHERE id = ?`).get(result.id) as Record<string, unknown>;
    const compensation = sqlite.raw.prepare(`SELECT current_compensation_status FROM tim_compensation WHERE tim_agreement_id = ?`).get(result.id) as Record<string, unknown>;
    const terms = sqlite.raw.prepare(`SELECT payment_trigger_code, payment_trigger_text FROM tim_agreement_terms
      WHERE tim_agreement_id = ? AND is_current = 1`).get(result.id) as Record<string, unknown>;
    expect(agreement).toMatchObject({ current_agreement_status: "signed", current_operation_status: "marketing_or_search_active" });
    expect(compensation.current_compensation_status).toBe("estimated");
    expect(terms).toMatchObject({ payment_trigger_code: "custom", payment_trigger_text: "Encaissement fictif confirmé" });
  });

  it("creates a rental with no automatic allocation or payment trigger", async () => {
    applyFiles(sqlite, ["cockpit-v1.sql"]);
    const result = await createTimAgreement(sqlite.asD1(), {
      agreement: {
        internalReference: "TIM-TEST-RENTAL-MANUAL",
        label: "Accord location fictif manuel",
        agreementType: "custom",
        transactionType: "rental",
        informationNature: "landlord",
        informationTransmittedAt: new Date().toISOString(),
        formSigned: false,
        omegaUploaded: false,
        mandateObtained: false,
      },
      parties: [
        { advisorId: "demo-advisor-operator-001", role: "referrer" },
        { advisorId: "demo-advisor-alpha-001", role: "handling_advisor" },
      ],
      terms: {
        feeBasis: "unknown", currency: "EUR", paymentTriggerCode: "unknown",
        triggeringEvent: "unknown", termsConfirmed: true, allocationsConfirmed: false, allocations: [],
      },
      statuses: { agreementStatus: "to_formalize", operationStatus: "information_transmitted", compensationStatus: "to_verify" },
      compensation: { beneficiaryAdvisorId: "demo-advisor-operator-001" },
      firstTask: { title: "Confirmer les conditions locatives fictives", priority: "normal" },
    }, command("tim-create-rental-001"));
    const terms = sqlite.raw.prepare(`SELECT payment_trigger_code FROM tim_agreement_terms WHERE tim_agreement_id = ?`).get(result.id) as Record<string, unknown>;
    const allocations = sqlite.raw.prepare(`SELECT count(*) AS count FROM tim_agreement_allocation WHERE tim_agreement_terms_id = ?`).get(result.termsId) as { count: number };
    expect(terms.payment_trigger_code).toBe("unknown");
    expect(allocations.count).toBe(0);
  });
});
