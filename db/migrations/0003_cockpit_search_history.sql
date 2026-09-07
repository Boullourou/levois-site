-- LEVOIS cockpit V1 — human decisions and append-oriented criterion history.

PRAGMA foreign_keys = ON;

CREATE TABLE decision (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES project(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('criterion_change', 'stage_change', 'status_change', 'project_link', 'other')),
  summary TEXT NOT NULL CHECK (length(trim(summary)) > 0),
  reason TEXT,
  source_kind TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_kind IN ('manual', 'interaction', 'observation', 'fixture', 'other')),
  source_ref TEXT,
  effective_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actor_id TEXT NOT NULL
) STRICT;

CREATE INDEX decision_project_timeline_idx
  ON decision(project_id, effective_at DESC, recorded_at DESC);

CREATE TABLE criterion_event (
  id TEXT PRIMARY KEY NOT NULL,
  buyer_search_id TEXT NOT NULL REFERENCES buyer_search(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  search_scenario_id TEXT NOT NULL,
  criterion_key TEXT NOT NULL CHECK (criterion_key IN (
    'property_type', 'zone', 'municipalities', 'max_travel_time', 'budget',
    'surface', 'bedrooms', 'outdoor', 'works', 'energy_rating', 'heating',
    'financing', 'prior_sale', 'horizon', 'environment', 'layout', 'other'
  )),
  operation TEXT NOT NULL DEFAULT 'set'
    CHECK (operation IN ('set', 'revise', 'confirm', 'invalidate', 'remove')),
  value_json TEXT NOT NULL CHECK (json_valid(value_json)),
  value_schema_version INTEGER NOT NULL DEFAULT 1 CHECK (value_schema_version >= 1),
  importance TEXT NOT NULL
    CHECK (importance IN ('essential', 'important', 'preference', 'contextual')),
  flexibility TEXT NOT NULL DEFAULT 'unknown'
    CHECK (flexibility IN ('none', 'low', 'medium', 'high', 'unknown')),
  certainty TEXT NOT NULL
    CHECK (certainty IN ('confirmed', 'observed', 'inferred', 'to_confirm')),
  matching_role TEXT NOT NULL DEFAULT 'unknown'
    CHECK (matching_role IN ('hard', 'soft', 'context', 'unknown')),
  hard_validated INTEGER NOT NULL DEFAULT 0 CHECK (hard_validated IN (0, 1)),
  hard_validated_by_actor_id TEXT,
  hard_validated_at TEXT,
  source_kind TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_kind IN ('manual', 'interaction', 'observation', 'form', 'import', 'fixture', 'other')),
  source_ref TEXT,
  reason TEXT,
  effective_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actor_id TEXT NOT NULL,
  replaces_criterion_event_id TEXT REFERENCES criterion_event(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  decision_id TEXT REFERENCES decision(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  FOREIGN KEY (search_scenario_id, buyer_search_id)
    REFERENCES search_scenario(id, buyer_search_id) ON UPDATE RESTRICT ON DELETE CASCADE,
  UNIQUE (id, buyer_search_id, search_scenario_id, criterion_key),
  CHECK (replaces_criterion_event_id IS NULL OR replaces_criterion_event_id <> id),
  CHECK (
    hard_validated = 0
    OR (
      certainty = 'confirmed'
      AND importance = 'essential'
      AND flexibility = 'none'
      AND matching_role = 'hard'
      AND hard_validated_by_actor_id IS NOT NULL
      AND hard_validated_at IS NOT NULL
    )
  ),
  CHECK (
    hard_validated = 1
    OR (hard_validated_by_actor_id IS NULL AND hard_validated_at IS NULL)
  )
) STRICT;

CREATE INDEX criterion_event_current_lookup_idx
  ON criterion_event(
    buyer_search_id,
    search_scenario_id,
    criterion_key,
    effective_at DESC,
    recorded_at DESC
  );

-- One linear history per (search, scenario, criterion): concurrent revisions
-- cannot fork the same event, and a second independent root is rejected.
CREATE UNIQUE INDEX criterion_event_one_successor
  ON criterion_event(replaces_criterion_event_id)
  WHERE replaces_criterion_event_id IS NOT NULL;

CREATE UNIQUE INDEX criterion_event_one_root_per_scope
  ON criterion_event(buyer_search_id, search_scenario_id, criterion_key)
  WHERE replaces_criterion_event_id IS NULL;

CREATE INDEX criterion_event_to_confirm_idx
  ON criterion_event(buyer_search_id, effective_at DESC)
  WHERE certainty = 'to_confirm';
