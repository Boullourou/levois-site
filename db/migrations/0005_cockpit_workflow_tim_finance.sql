-- LEVOIS cockpit V1 — interactions, tasks and independent TIM financial/status axes.

PRAGMA foreign_keys = ON;

CREATE TABLE interaction (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT REFERENCES project(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  tim_agreement_id TEXT REFERENCES tim_agreement(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('call', 'email', 'sms', 'whatsapp', 'meeting', 'form', 'other')),
  direction TEXT NOT NULL
    CHECK (direction IN ('incoming', 'outgoing')),
  summary TEXT NOT NULL CHECK (length(trim(summary)) > 0),
  outcome TEXT,
  promised_action TEXT,
  promised_due_at TEXT,
  source_kind TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_kind IN ('manual', 'form', 'fixture', 'other')),
  source_ref TEXT,
  occurred_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actor_id TEXT NOT NULL,
  CHECK ((project_id IS NOT NULL) + (tim_agreement_id IS NOT NULL) = 1),
  CHECK (promised_due_at IS NULL OR promised_action IS NOT NULL)
) STRICT;

CREATE INDEX interaction_project_timeline_idx
  ON interaction(project_id, occurred_at DESC, recorded_at DESC)
  WHERE project_id IS NOT NULL;

CREATE INDEX interaction_tim_timeline_idx
  ON interaction(tim_agreement_id, occurred_at DESC, recorded_at DESC)
  WHERE tim_agreement_id IS NOT NULL;

CREATE INDEX interaction_promised_due_idx
  ON interaction(promised_due_at)
  WHERE promised_due_at IS NOT NULL;

CREATE TABLE task (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT REFERENCES project(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  tim_agreement_id TEXT REFERENCES tim_agreement(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'waiting', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_at TEXT,
  reminder_at TEXT,
  waiting_reason TEXT,
  is_next_action INTEGER NOT NULL DEFAULT 0 CHECK (is_next_action IN (0, 1)),
  promised_from_interaction_id TEXT REFERENCES interaction(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by_actor_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  CHECK ((project_id IS NOT NULL) + (tim_agreement_id IS NOT NULL) = 1),
  CHECK (is_next_action = 0 OR status IN ('open', 'in_progress', 'waiting')),
  CHECK (status <> 'completed' OR completed_at IS NOT NULL),
  CHECK (reminder_at IS NULL OR due_at IS NULL OR reminder_at <= due_at)
) STRICT;

CREATE UNIQUE INDEX task_one_next_per_project
  ON task(project_id)
  WHERE project_id IS NOT NULL
    AND is_next_action = 1
    AND status IN ('open', 'in_progress', 'waiting');

CREATE UNIQUE INDEX task_one_next_per_tim_agreement
  ON task(tim_agreement_id)
  WHERE tim_agreement_id IS NOT NULL
    AND is_next_action = 1
    AND status IN ('open', 'in_progress', 'waiting');

CREATE INDEX task_due_open_idx
  ON task(due_at, priority, status)
  WHERE status IN ('open', 'in_progress', 'waiting');

CREATE INDEX task_project_open_idx
  ON task(project_id, is_next_action, due_at)
  WHERE project_id IS NOT NULL AND status IN ('open', 'in_progress', 'waiting');

CREATE INDEX task_tim_open_idx
  ON task(tim_agreement_id, is_next_action, due_at)
  WHERE tim_agreement_id IS NOT NULL AND status IN ('open', 'in_progress', 'waiting');

CREATE TABLE tim_compensation (
  id TEXT PRIMARY KEY NOT NULL,
  tim_agreement_id TEXT NOT NULL REFERENCES tim_agreement(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  beneficiary_party_id TEXT NOT NULL REFERENCES tim_agreement_party(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  tim_agreement_terms_id TEXT NOT NULL REFERENCES tim_agreement_terms(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  supersedes_compensation_id TEXT REFERENCES tim_compensation(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  is_current INTEGER NOT NULL DEFAULT 1 CHECK (is_current IN (0, 1)),
  current_compensation_status TEXT NOT NULL DEFAULT 'not_due'
    CHECK (current_compensation_status IN ('not_due', 'estimated', 'due', 'paid', 'to_verify', 'disputed', 'cancelled')),
  estimated_total_fees_minor INTEGER NOT NULL DEFAULT 0 CHECK (estimated_total_fees_minor >= 0),
  estimated_share_minor INTEGER NOT NULL DEFAULT 0 CHECK (estimated_share_minor >= 0),
  amount_due_minor INTEGER NOT NULL DEFAULT 0 CHECK (amount_due_minor >= 0),
  amount_paid_minor INTEGER NOT NULL DEFAULT 0 CHECK (amount_paid_minor >= 0),
  currency_code TEXT NOT NULL DEFAULT 'EUR'
    CHECK (length(currency_code) = 3 AND currency_code = upper(currency_code)),
  due_at TEXT,
  expected_payment_at TEXT,
  calculation_note TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by_actor_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  UNIQUE (id, tim_agreement_id),
  CHECK (supersedes_compensation_id IS NULL OR supersedes_compensation_id <> id),
  CHECK (
    current_compensation_status <> 'paid'
    OR (amount_due_minor > 0 AND amount_paid_minor >= amount_due_minor)
  )
) STRICT;

CREATE UNIQUE INDEX tim_compensation_one_current_beneficiary
  ON tim_compensation(tim_agreement_id, beneficiary_party_id)
  WHERE is_current = 1;

CREATE INDEX tim_compensation_status_idx
  ON tim_compensation(current_compensation_status, expected_payment_at, tim_agreement_id)
  WHERE is_current = 1;

CREATE TABLE tim_payment (
  id TEXT PRIMARY KEY NOT NULL,
  tim_compensation_id TEXT NOT NULL REFERENCES tim_compensation(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL CHECK (length(trim(idempotency_key)) >= 8),
  request_fingerprint TEXT NOT NULL CHECK (length(trim(request_fingerprint)) >= 8),
  kind TEXT NOT NULL DEFAULT 'payment'
    CHECK (kind IN ('payment', 'adjustment', 'refund')),
  amount_minor INTEGER NOT NULL CHECK (amount_minor <> 0),
  currency_code TEXT NOT NULL DEFAULT 'EUR'
    CHECK (length(currency_code) = 3 AND currency_code = upper(currency_code)),
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('pending', 'confirmed', 'voided', 'failed')),
  reverses_payment_id TEXT REFERENCES tim_payment(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  external_reference TEXT,
  paid_at TEXT,
  recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  recorded_by_actor_id TEXT NOT NULL,
  UNIQUE (tim_compensation_id, idempotency_key),
  CHECK (reverses_payment_id IS NULL OR reverses_payment_id <> id),
  CHECK (kind <> 'payment' OR amount_minor > 0),
  CHECK (kind <> 'refund' OR amount_minor < 0),
  CHECK (status <> 'confirmed' OR paid_at IS NOT NULL)
) STRICT;

CREATE INDEX tim_payment_compensation_idx
  ON tim_payment(tim_compensation_id, paid_at DESC, recorded_at DESC);

CREATE TABLE tim_status_event (
  id TEXT PRIMARY KEY NOT NULL,
  tim_agreement_id TEXT NOT NULL REFERENCES tim_agreement(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  tim_compensation_id TEXT REFERENCES tim_compensation(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  state_axis TEXT NOT NULL CHECK (state_axis IN ('agreement', 'operation', 'compensation')),
  from_state TEXT,
  to_state TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_kind IN ('manual', 'interaction', 'fixture', 'other')),
  source_ref TEXT,
  reason TEXT,
  effective_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actor_id TEXT NOT NULL,
  CHECK (
    (state_axis = 'compensation' AND tim_compensation_id IS NOT NULL)
    OR (state_axis IN ('agreement', 'operation') AND tim_compensation_id IS NULL)
  ),
  CHECK (
    (state_axis = 'agreement' AND to_state IN ('to_formalize', 'signed', 'omega_uploaded', 'active', 'cancelled', 'closed'))
    OR (state_axis = 'operation' AND to_state IN (
      'information_transmitted', 'contacted', 'mandate_obtained',
      'marketing_or_search_active', 'offer_or_application_received',
      'precontract_or_lease_signed', 'completed', 'abandoned'
    ))
    OR (state_axis = 'compensation' AND to_state IN (
      'not_due', 'estimated', 'due', 'paid', 'to_verify', 'disputed', 'cancelled'
    ))
  ),
  CHECK (
    from_state IS NULL
    OR (state_axis = 'agreement' AND from_state IN ('to_formalize', 'signed', 'omega_uploaded', 'active', 'cancelled', 'closed'))
    OR (state_axis = 'operation' AND from_state IN (
      'information_transmitted', 'contacted', 'mandate_obtained',
      'marketing_or_search_active', 'offer_or_application_received',
      'precontract_or_lease_signed', 'completed', 'abandoned'
    ))
    OR (state_axis = 'compensation' AND from_state IN (
      'not_due', 'estimated', 'due', 'paid', 'to_verify', 'disputed', 'cancelled'
    ))
  )
) STRICT;

CREATE INDEX tim_status_event_timeline_idx
  ON tim_status_event(tim_agreement_id, effective_at DESC, recorded_at DESC);

CREATE INDEX tim_status_event_compensation_idx
  ON tim_status_event(tim_compensation_id, effective_at DESC)
  WHERE tim_compensation_id IS NOT NULL;
