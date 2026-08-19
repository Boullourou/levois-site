-- LEVOIS Agentic Company OS A1 — deterministic fixture-only control plane.
-- Exactly five additive tables. No foreign key or trigger targets a business table.

PRAGMA foreign_keys = ON;

CREATE TABLE agent_mission (
  id TEXT PRIMARY KEY NOT NULL,
  mission_type TEXT NOT NULL
    CHECK (mission_type IN ('ops.shadow_scan.v1', 'cos.daily_briefing.v1')),
  agent_id TEXT NOT NULL CHECK (agent_id IN ('OPS-01', 'COS-01')),
  capabilities_json TEXT NOT NULL CHECK (json_valid(capabilities_json)),
  objective_code TEXT NOT NULL
    CHECK (objective_code IN ('OPS_SHADOW_SCAN', 'COS_DAILY_BRIEFING')),
  objective TEXT NOT NULL CHECK (length(trim(objective)) BETWEEN 1 AND 240),

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'planned', 'assigned', 'running',
      'waiting_input', 'waiting_approval',
      'completed', 'failed', 'cancelled'
    )),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  close_reason TEXT,

  trigger_kind TEXT NOT NULL CHECK (trigger_kind = 'manual'),
  trigger_ref TEXT NOT NULL CHECK (length(trim(trigger_ref)) BETWEEN 1 AND 160),
  triggered_by_actor_id TEXT NOT NULL
    CHECK (length(trim(triggered_by_actor_id)) BETWEEN 1 AND 200),

  source_kind TEXT NOT NULL
    CHECK (source_kind IN ('fixture_request', 'ops_mission')),
  source_ref TEXT NOT NULL CHECK (length(trim(source_ref)) BETWEEN 1 AND 200),
  source_version TEXT NOT NULL CHECK (length(trim(source_version)) BETWEEN 1 AND 80),
  source_hash TEXT,
  snapshot_id TEXT,
  operational_watermark TEXT,
  as_of TEXT,

  idempotency_key TEXT NOT NULL CHECK (length(trim(idempotency_key)) >= 8),
  input_hash TEXT NOT NULL CHECK (length(trim(input_hash)) >= 16),
  correlation_id TEXT NOT NULL CHECK (length(trim(correlation_id)) >= 8),
  causation_id TEXT,

  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  planned_at TEXT,
  assigned_at TEXT,
  started_at TEXT,
  finished_at TEXT,
  timeout_at TEXT NOT NULL,
  heartbeat_at TEXT,

  attempt_no INTEGER NOT NULL DEFAULT 1 CHECK (attempt_no = 1),
  execution_epoch INTEGER NOT NULL DEFAULT 1 CHECK (execution_epoch >= 1),
  restore_epoch INTEGER NOT NULL DEFAULT 1 CHECK (restore_epoch >= 1),
  control_fingerprint TEXT,

  budget_schema_version INTEGER NOT NULL DEFAULT 1 CHECK (budget_schema_version = 1),
  logical_budget_json TEXT NOT NULL CHECK (json_valid(logical_budget_json)),
  logical_usage_json TEXT NOT NULL DEFAULT '{}'
    CHECK (json_valid(logical_usage_json)),

  monetary_cost_state TEXT NOT NULL DEFAULT 'not_applicable'
    CHECK (monetary_cost_state = 'not_applicable'),
  cost_actual_minor INTEGER NOT NULL DEFAULT 0 CHECK (cost_actual_minor = 0),

  result_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (result_status IN ('pending', 'valid', 'invalid')),
  result_kind TEXT
    CHECK (result_kind IS NULL OR result_kind IN ('ops_findings', 'cos_briefing')),
  result_schema_version INTEGER
    CHECK (result_schema_version IS NULL OR result_schema_version >= 1),
  result_hash TEXT,
  result_total_count INTEGER NOT NULL DEFAULT 0 CHECK (result_total_count >= 0),
  result_selected_count INTEGER NOT NULL DEFAULT 0 CHECK (result_selected_count >= 0),
  result_omitted_count INTEGER NOT NULL DEFAULT 0 CHECK (result_omitted_count >= 0),

  error_status TEXT NOT NULL DEFAULT 'none'
    CHECK (error_status IN ('none', 'error')),
  error_code TEXT,
  error_stage TEXT,
  error_detail_code TEXT,

  contract_version TEXT NOT NULL DEFAULT 'a1.v1' CHECK (contract_version = 'a1.v1'),
  policy_version TEXT NOT NULL CHECK (length(trim(policy_version)) BETWEEN 1 AND 80),
  autonomy_level TEXT NOT NULL DEFAULT 'L0' CHECK (autonomy_level = 'L0'),
  retention_policy_ref TEXT NOT NULL DEFAULT 'fixture-ephemeral-v1'
    CHECK (retention_policy_ref = 'fixture-ephemeral-v1'),
  fixture_only INTEGER NOT NULL CHECK (fixture_only = 1),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),

  CHECK (
    (
      mission_type = 'ops.shadow_scan.v1'
      AND agent_id = 'OPS-01'
      AND capabilities_json = '["ops.read_snapshot","ops.evaluate_rules"]'
      AND objective_code = 'OPS_SHADOW_SCAN'
      AND source_kind = 'fixture_request'
    )
    OR
    (
      mission_type = 'cos.daily_briefing.v1'
      AND agent_id = 'COS-01'
      AND capabilities_json = '["cos.read_ops_results","cos.deduplicate","cos.rank","cos.compose_briefing"]'
      AND objective_code = 'COS_DAILY_BRIEFING'
      AND source_kind = 'ops_mission'
    )
  ),
  CHECK (timeout_at > created_at),
  CHECK (status NOT IN ('waiting_input', 'waiting_approval')),
  CHECK (
    status NOT IN ('planned', 'assigned', 'running', 'completed')
    OR control_fingerprint IS NOT NULL
  ),
  CHECK (
    status NOT IN ('planned', 'assigned', 'running', 'completed')
    OR planned_at IS NOT NULL
  ),
  CHECK (
    status NOT IN ('assigned', 'running', 'completed')
    OR assigned_at IS NOT NULL
  ),
  CHECK (
    status NOT IN ('running', 'completed')
    OR started_at IS NOT NULL
  ),
  CHECK (
    (
      status IN ('completed', 'failed', 'cancelled')
      AND finished_at IS NOT NULL
      AND close_reason IS NOT NULL
    )
    OR
    (
      status NOT IN ('completed', 'failed', 'cancelled')
      AND finished_at IS NULL
      AND close_reason IS NULL
    )
  ),
  CHECK (
    status <> 'completed'
    OR (
      result_status = 'valid'
      AND result_hash IS NOT NULL
      AND snapshot_id IS NOT NULL
      AND operational_watermark IS NOT NULL
      AND (
        (mission_type = 'ops.shadow_scan.v1' AND result_kind = 'ops_findings')
        OR
        (mission_type = 'cos.daily_briefing.v1' AND result_kind = 'cos_briefing')
      )
    )
  ),
  CHECK (status = 'completed' OR result_status <> 'valid'),
  CHECK (
    status <> 'failed'
    OR (
      result_status = 'invalid'
      AND error_status = 'error'
      AND error_code IS NOT NULL
    )
  ),
  CHECK (status = 'failed' OR error_status = 'none'),
  CHECK (status <> 'cancelled' OR result_status = 'invalid'),
  CHECK (
    mission_type <> 'cos.daily_briefing.v1'
    OR result_selected_count BETWEEN 0 AND 7
  )
) STRICT;

CREATE UNIQUE INDEX agent_mission_idempotency_uq
  ON agent_mission(idempotency_key);

CREATE INDEX agent_mission_active_idx
  ON agent_mission(agent_id, status, created_at)
  WHERE status NOT IN ('completed', 'failed', 'cancelled');

CREATE INDEX agent_mission_latest_completed_idx
  ON agent_mission(mission_type, finished_at DESC)
  WHERE status = 'completed';


CREATE TABLE agent_control_switch (
  id TEXT PRIMARY KEY NOT NULL,
  scope_kind TEXT NOT NULL
    CHECK (scope_kind IN ('global', 'agent', 'capability')),
  scope_key TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('enabled', 'stopped')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  restore_epoch INTEGER NOT NULL DEFAULT 1 CHECK (restore_epoch >= 1),
  reason_code TEXT NOT NULL CHECK (length(trim(reason_code)) BETWEEN 1 AND 80),
  decided_by_actor_id TEXT NOT NULL
    CHECK (length(trim(decided_by_actor_id)) BETWEEN 1 AND 200),
  decided_at TEXT NOT NULL,
  idempotency_key TEXT NOT NULL CHECK (length(trim(idempotency_key)) >= 8),
  payload_hash TEXT NOT NULL CHECK (length(trim(payload_hash)) >= 16),
  fixture_only INTEGER NOT NULL CHECK (fixture_only = 1),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  CHECK (
    (scope_kind = 'global' AND scope_key = 'global')
    OR
    (scope_kind = 'agent' AND scope_key IN ('OPS-01', 'COS-01'))
    OR
    (
      scope_kind = 'capability'
      AND scope_key IN (
        'ops.read_snapshot',
        'ops.evaluate_rules',
        'cos.read_ops_results',
        'cos.deduplicate',
        'cos.rank',
        'cos.compose_briefing'
      )
    )
  ),
  UNIQUE (scope_kind, scope_key)
) STRICT;

CREATE UNIQUE INDEX agent_control_switch_idempotency_uq
  ON agent_control_switch(idempotency_key);


CREATE TABLE agent_trace (
  id TEXT PRIMARY KEY NOT NULL,
  stream_kind TEXT NOT NULL CHECK (stream_kind IN ('mission', 'control_switch')),
  stream_id TEXT NOT NULL CHECK (length(trim(stream_id)) > 0),
  sequence_no INTEGER NOT NULL CHECK (sequence_no >= 1),

  mission_id TEXT
    REFERENCES agent_mission(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  switch_id TEXT
    REFERENCES agent_control_switch(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

  occurred_at TEXT NOT NULL,
  correlation_id TEXT NOT NULL CHECK (length(trim(correlation_id)) >= 8),
  causation_id TEXT,
  source_event_type TEXT,
  source_event_ref TEXT,
  source_event_version TEXT,

  actor_kind TEXT NOT NULL
    CHECK (actor_kind IN ('human', 'control_plane', 'logical_agent')),
  actor_id TEXT NOT NULL CHECK (length(trim(actor_id)) BETWEEN 1 AND 200),
  agent_id TEXT CHECK (agent_id IS NULL OR agent_id IN ('OPS-01', 'COS-01')),

  entry_kind TEXT NOT NULL CHECK (entry_kind IN (
    'mission_created',
    'mission_started',
    'snapshot_read',
    'rule_evaluated',
    'finding_produced',
    'briefing_composed',
    'mission_completed',
    'error_recorded',
    'kill_switch_encountered',
    'mission_cancelled',
    -- Administrative switch changes use the same ledger without a sixth table.
    'switch_applied',
    -- Kept for explicit lifecycle inspection without storing free-form payloads.
    'mission_transitioned',
    'logical_cost_recorded'
  )),

  attempt_no INTEGER CHECK (attempt_no IS NULL OR attempt_no = 1),
  execution_epoch INTEGER CHECK (execution_epoch IS NULL OR execution_epoch >= 1),
  restore_epoch INTEGER NOT NULL CHECK (restore_epoch >= 1),
  from_status TEXT CHECK (
    from_status IS NULL OR from_status IN (
      'draft', 'planned', 'assigned', 'running',
      'waiting_input', 'waiting_approval',
      'completed', 'failed', 'cancelled'
    )
  ),
  to_status TEXT CHECK (
    to_status IS NULL OR to_status IN (
      'draft', 'planned', 'assigned', 'running',
      'waiting_input', 'waiting_approval',
      'completed', 'failed', 'cancelled'
    )
  ),
  reason_code TEXT,

  idempotency_key TEXT NOT NULL CHECK (length(trim(idempotency_key)) >= 8),
  payload_hash TEXT NOT NULL CHECK (length(trim(payload_hash)) >= 16),
  result_kind TEXT,
  result_ref TEXT,
  result_hash TEXT,
  outcome_code TEXT,

  logical_usage_delta_json TEXT NOT NULL DEFAULT '{}'
    CHECK (json_valid(logical_usage_delta_json)),
  monetary_cost_state TEXT NOT NULL DEFAULT 'not_applicable'
    CHECK (monetary_cost_state = 'not_applicable'),
  cost_delta_minor INTEGER NOT NULL DEFAULT 0 CHECK (cost_delta_minor = 0),
  currency_code TEXT CHECK (currency_code IS NULL),

  approval_ref TEXT,
  approval_outcome TEXT,
  error_code TEXT,
  error_stage TEXT,
  error_detail_code TEXT,
  policy_version TEXT NOT NULL CHECK (length(trim(policy_version)) BETWEEN 1 AND 80),
  control_fingerprint TEXT,
  redaction_version TEXT NOT NULL
    CHECK (length(trim(redaction_version)) BETWEEN 1 AND 80),

  CHECK (
    (
      stream_kind = 'mission'
      AND mission_id IS NOT NULL
      AND mission_id = stream_id
      AND switch_id IS NULL
    )
    OR
    (
      stream_kind = 'control_switch'
      AND mission_id IS NULL
      AND switch_id IS NOT NULL
      AND switch_id = stream_id
    )
  ),
  CHECK (
    stream_kind <> 'mission'
    OR (attempt_no = 1 AND agent_id IS NOT NULL)
  ),
  UNIQUE (stream_kind, stream_id, sequence_no)
) STRICT;

CREATE UNIQUE INDEX agent_trace_idempotency_uq
  ON agent_trace(idempotency_key);

CREATE INDEX agent_trace_time_kind_idx
  ON agent_trace(occurred_at DESC, entry_kind);


CREATE TABLE agent_ops_shadow_finding (
  id TEXT PRIMARY KEY NOT NULL,
  mission_id TEXT NOT NULL
    REFERENCES agent_mission(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  observation_fingerprint TEXT NOT NULL
    CHECK (length(trim(observation_fingerprint)) >= 16),
  rule_id TEXT NOT NULL CHECK (rule_id IN (
    'OPS-PROJECT-NEXT-ACTION-001',
    'OPS-TASK-OVERDUE-002',
    'OPS-PROMISE-DUE-003',
    'OPS-TIM-NEXT-ACTION-005',
    'OPS-TIM-DEADLINE-NEAR-006',
    'OPS-INCONSISTENCY-007'
  )),
  rule_version INTEGER NOT NULL DEFAULT 1 CHECK (rule_version = 1),
  reason_code TEXT NOT NULL,
  reason_template_version INTEGER NOT NULL DEFAULT 1
    CHECK (reason_template_version = 1),

  scope_kind TEXT NOT NULL CHECK (scope_kind IN ('project', 'tim_agreement')),
  scope_id TEXT NOT NULL CHECK (length(trim(scope_id)) > 0),
  subject_id TEXT,
  link_kind TEXT
    CHECK (link_kind IS NULL OR link_kind IN ('promise_task', 'tim_deadline_task')),
  link_ref TEXT,

  source_ref TEXT NOT NULL CHECK (length(trim(source_ref)) > 0),
  source_version INTEGER NOT NULL CHECK (source_version >= 1),
  snapshot_id TEXT NOT NULL CHECK (length(trim(snapshot_id)) > 0),
  operational_watermark TEXT NOT NULL
    CHECK (length(trim(operational_watermark)) > 0),
  source_hash TEXT NOT NULL CHECK (length(trim(source_hash)) >= 16),
  source_freshness TEXT NOT NULL DEFAULT 'current_at_observation'
    CHECK (source_freshness = 'current_at_observation'),
  observed_at TEXT NOT NULL,
  as_of TEXT NOT NULL,
  due_at TEXT,

  proposed_priority TEXT NOT NULL
    CHECK (proposed_priority IN ('low', 'normal', 'high', 'urgent')),
  suggested_human_action_code TEXT NOT NULL,
  suggested_action_template_version INTEGER NOT NULL DEFAULT 1
    CHECK (suggested_action_template_version = 1),
  evidence_code TEXT NOT NULL,
  evidence_hash TEXT NOT NULL CHECK (length(trim(evidence_hash)) >= 16),
  schema_version INTEGER NOT NULL DEFAULT 1 CHECK (schema_version = 1),

  CHECK (
    (link_kind IS NULL AND link_ref IS NULL)
    OR (link_kind IS NOT NULL AND link_ref IS NOT NULL)
  ),
  CHECK (
    (
      rule_id = 'OPS-PROJECT-NEXT-ACTION-001'
      AND scope_kind = 'project'
      AND subject_id IS NULL
      AND due_at IS NULL
      AND reason_code = 'PROJECT_WITHOUT_NEXT_ACTION'
      AND proposed_priority = 'normal'
      AND suggested_human_action_code = 'DEFINE_NEXT_ACTION'
      AND evidence_code = 'NO_OPEN_NEXT_ACTION'
    )
    OR
    (
      rule_id = 'OPS-TASK-OVERDUE-002'
      AND subject_id IS NOT NULL
      AND due_at IS NOT NULL
      AND reason_code = 'TASK_OVERDUE'
      AND proposed_priority IN ('high', 'urgent')
      AND suggested_human_action_code = 'REVIEW_OVERDUE_TASK'
      AND evidence_code = 'OPEN_TASK_PAST_DUE'
    )
    OR
    (
      rule_id = 'OPS-PROMISE-DUE-003'
      AND subject_id IS NOT NULL
      AND due_at IS NOT NULL
      AND reason_code = 'PROMISE_DUE'
      AND proposed_priority IN ('high', 'urgent')
      AND suggested_human_action_code = 'REVIEW_PROMISE_AND_CONTACT'
      AND evidence_code = 'STRUCTURED_PROMISE_DUE'
    )
    OR
    (
      rule_id = 'OPS-TIM-NEXT-ACTION-005'
      AND scope_kind = 'tim_agreement'
      AND subject_id IS NULL
      AND due_at IS NULL
      AND reason_code = 'TIM_WITHOUT_NEXT_ACTION'
      AND proposed_priority = 'normal'
      AND suggested_human_action_code = 'DEFINE_TIM_FOLLOW_UP'
      AND evidence_code = 'OPEN_TIM_NO_NEXT_ACTION'
    )
    OR
    (
      rule_id = 'OPS-TIM-DEADLINE-NEAR-006'
      AND scope_kind = 'tim_agreement'
      AND subject_id IS NOT NULL
      AND due_at IS NOT NULL
      AND suggested_human_action_code = 'REVIEW_TIM_DEADLINE'
      AND evidence_code = 'STRUCTURED_TIM_DEADLINE'
      AND (
        (
          reason_code = 'TIM_DEADLINE_OVERDUE'
          AND due_at <= as_of
          AND proposed_priority = 'high'
        )
        OR
        (
          reason_code = 'TIM_DEADLINE_NEAR'
          AND due_at > as_of
          AND proposed_priority = 'normal'
        )
      )
    )
    OR
    (
      rule_id = 'OPS-INCONSISTENCY-007'
      AND subject_id IS NOT NULL
      AND reason_code = 'TERMINAL_SCOPE_WITH_OPEN_NEXT_ACTION'
      AND proposed_priority = 'high'
      AND suggested_human_action_code = 'REVIEW_TERMINAL_NEXT_ACTION'
      AND evidence_code = 'OPEN_NEXT_ACTION_ON_TERMINAL_SCOPE'
    )
  ),
  UNIQUE (mission_id, observation_fingerprint)
) STRICT;

CREATE INDEX agent_ops_finding_scope_idx
  ON agent_ops_shadow_finding(mission_id, scope_kind, scope_id);


CREATE TABLE agent_cos_briefing_item (
  id TEXT PRIMARY KEY NOT NULL,
  mission_id TEXT NOT NULL
    REFERENCES agent_mission(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  source_ops_mission_id TEXT NOT NULL
    REFERENCES agent_mission(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 7),
  group_fingerprint TEXT NOT NULL CHECK (length(trim(group_fingerprint)) >= 16),
  scope_kind TEXT NOT NULL CHECK (scope_kind IN ('project', 'tim_agreement')),
  scope_id TEXT NOT NULL CHECK (length(trim(scope_id)) > 0),
  finding_refs_json TEXT NOT NULL CHECK (
    json_valid(finding_refs_json)
    AND json_type(finding_refs_json) = 'array'
    AND json_array_length(finding_refs_json) BETWEEN 1 AND 64
  ),

  priority_bucket TEXT NOT NULL
    CHECK (priority_bucket IN ('urgent', 'high', 'normal', 'low')),
  due_at TEXT,
  source_priority TEXT NOT NULL
    CHECK (source_priority IN ('urgent', 'high', 'normal', 'low')),
  tie_breaker TEXT NOT NULL CHECK (length(trim(tie_breaker)) > 0),
  primary_rule_id TEXT NOT NULL CHECK (primary_rule_id IN (
    'OPS-PROJECT-NEXT-ACTION-001',
    'OPS-TASK-OVERDUE-002',
    'OPS-PROMISE-DUE-003',
    'OPS-TIM-NEXT-ACTION-005',
    'OPS-TIM-DEADLINE-NEAR-006',
    'OPS-INCONSISTENCY-007'
  )),
  why_now_code TEXT NOT NULL CHECK (length(trim(why_now_code)) > 0),
  explanation_template_version INTEGER NOT NULL DEFAULT 1
    CHECK (explanation_template_version = 1),
  suggested_human_action_code TEXT NOT NULL CHECK (
    suggested_human_action_code IN (
      'DEFINE_NEXT_ACTION',
      'REVIEW_OVERDUE_TASK',
      'REVIEW_PROMISE_AND_CONTACT',
      'DEFINE_TIM_FOLLOW_UP',
      'REVIEW_TIM_DEADLINE',
      'REVIEW_TERMINAL_NEXT_ACTION'
    )
  ),
  suggested_action_template_version INTEGER NOT NULL DEFAULT 1
    CHECK (suggested_action_template_version = 1),

  snapshot_id TEXT NOT NULL CHECK (length(trim(snapshot_id)) > 0),
  operational_watermark TEXT NOT NULL
    CHECK (length(trim(operational_watermark)) > 0),
  source_result_hash TEXT NOT NULL CHECK (length(trim(source_result_hash)) >= 16),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  schema_version INTEGER NOT NULL DEFAULT 1 CHECK (schema_version = 1),
  item_hash TEXT NOT NULL CHECK (length(trim(item_hash)) >= 16),

  CHECK (priority_bucket = source_priority),
  UNIQUE (mission_id, rank),
  UNIQUE (mission_id, group_fingerprint),
  UNIQUE (mission_id, scope_kind, scope_id)
) STRICT;


-- All triggers below only reject invalid writes on the five agentic tables.
CREATE TRIGGER agent_mission_status_transition_guard
BEFORE UPDATE OF status ON agent_mission
FOR EACH ROW
WHEN NEW.status <> OLD.status AND NOT (
  (OLD.status = 'draft' AND NEW.status IN ('planned', 'failed', 'cancelled'))
  OR (OLD.status = 'planned' AND NEW.status IN ('assigned', 'failed', 'cancelled'))
  OR (OLD.status = 'assigned' AND NEW.status IN ('running', 'failed', 'cancelled'))
  OR (OLD.status = 'running' AND NEW.status IN ('completed', 'failed', 'cancelled'))
)
BEGIN
  SELECT RAISE(ABORT, 'invalid agent mission status transition');
END;

CREATE TRIGGER agent_mission_identity_immutable
BEFORE UPDATE OF
  mission_type, agent_id, capabilities_json, objective_code,
  trigger_kind, trigger_ref, triggered_by_actor_id,
  source_kind, source_ref, source_version,
  idempotency_key, input_hash, correlation_id, causation_id,
  attempt_no, contract_version, autonomy_level, fixture_only
ON agent_mission
BEGIN
  SELECT RAISE(ABORT, 'agent mission authority fields are immutable');
END;

CREATE TRIGGER agent_mission_version_guard
BEFORE UPDATE ON agent_mission
FOR EACH ROW
WHEN NEW.version <> OLD.version + 1
BEGIN
  SELECT RAISE(ABORT, 'agent mission version must increase by one');
END;

CREATE TRIGGER agent_mission_no_delete
BEFORE DELETE ON agent_mission
BEGIN
  SELECT RAISE(ABORT, 'agent mission is retained in fixture ledger');
END;

CREATE TRIGGER agent_control_switch_identity_immutable
BEFORE UPDATE OF scope_kind, scope_key, fixture_only
ON agent_control_switch
BEGIN
  SELECT RAISE(ABORT, 'agent control switch scope is immutable');
END;

CREATE TRIGGER agent_control_switch_version_guard
BEFORE UPDATE ON agent_control_switch
FOR EACH ROW
WHEN NEW.version <> OLD.version + 1 OR NEW.restore_epoch < OLD.restore_epoch
BEGIN
  SELECT RAISE(ABORT, 'agent control switch version or restore epoch invalid');
END;

CREATE TRIGGER agent_control_switch_no_delete
BEFORE DELETE ON agent_control_switch
BEGIN
  SELECT RAISE(ABORT, 'agent control switch cannot be deleted');
END;

CREATE TRIGGER agent_trace_no_update
BEFORE UPDATE ON agent_trace
BEGIN
  SELECT RAISE(ABORT, 'agent_trace is append-only');
END;

CREATE TRIGGER agent_trace_no_delete
BEFORE DELETE ON agent_trace
BEGIN
  SELECT RAISE(ABORT, 'agent_trace is append-only');
END;

CREATE TRIGGER agent_ops_finding_parent_guard
BEFORE INSERT ON agent_ops_shadow_finding
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1
  FROM agent_mission mission
  WHERE mission.id = NEW.mission_id
    AND mission.mission_type = 'ops.shadow_scan.v1'
    AND mission.agent_id = 'OPS-01'
    AND mission.status = 'running'
    AND mission.fixture_only = 1
    AND mission.snapshot_id = NEW.snapshot_id
    AND mission.operational_watermark = NEW.operational_watermark
)
BEGIN
  SELECT RAISE(ABORT, 'finding requires the current running OPS fixture mission');
END;

CREATE TRIGGER agent_ops_finding_no_update
BEFORE UPDATE ON agent_ops_shadow_finding
BEGIN
  SELECT RAISE(ABORT, 'agent OPS finding is immutable');
END;

CREATE TRIGGER agent_ops_finding_no_delete
BEFORE DELETE ON agent_ops_shadow_finding
BEGIN
  SELECT RAISE(ABORT, 'agent OPS finding is immutable');
END;

CREATE TRIGGER agent_cos_item_parent_guard
BEFORE INSERT ON agent_cos_briefing_item
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1
  FROM agent_mission cos
  JOIN agent_mission ops ON ops.id = NEW.source_ops_mission_id
  WHERE cos.id = NEW.mission_id
    AND cos.mission_type = 'cos.daily_briefing.v1'
    AND cos.agent_id = 'COS-01'
    AND cos.status = 'running'
    AND cos.fixture_only = 1
    AND cos.source_kind = 'ops_mission'
    AND cos.source_ref = ops.id
    AND ops.mission_type = 'ops.shadow_scan.v1'
    AND ops.agent_id = 'OPS-01'
    AND ops.status = 'completed'
    AND ops.result_status = 'valid'
    AND ops.result_hash = NEW.source_result_hash
    AND ops.snapshot_id = NEW.snapshot_id
    AND ops.operational_watermark = NEW.operational_watermark
)
BEGIN
  SELECT RAISE(ABORT, 'briefing item requires a running COS mission and completed OPS source');
END;

CREATE TRIGGER agent_cos_item_no_update
BEFORE UPDATE ON agent_cos_briefing_item
BEGIN
  SELECT RAISE(ABORT, 'agent COS briefing item is immutable');
END;

CREATE TRIGGER agent_cos_item_no_delete
BEFORE DELETE ON agent_cos_briefing_item
BEGIN
  SELECT RAISE(ABORT, 'agent COS briefing item is immutable');
END;
