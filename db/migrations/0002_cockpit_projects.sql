-- LEVOIS cockpit V1 — projects, project relationships and buyer-search scenarios.

PRAGMA foreign_keys = ON;

CREATE TABLE project (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL
    CHECK (type IN ('primary_residence_purchase', 'sale', 'investment', 'other')),
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'qualifying', 'active', 'paused', 'completed', 'abandoned', 'archived')),
  stage_key TEXT NOT NULL DEFAULT 'new_contact'
    CHECK (stage_key IN (
      'new_contact', 'qualification', 'project_defined',
      'search_active', 'properties_proposed', 'visit_preparing', 'visit_completed',
      'offer_considered', 'offer_submitted', 'preparation', 'mandate_pending',
      'mandate_active', 'marketing', 'visits', 'offer_received',
      'under_contract', 'completed'
    )),
  objective TEXT NOT NULL DEFAULT '',
  calendar_summary TEXT NOT NULL DEFAULT '',
  responsible_actor_id TEXT NOT NULL,
  last_interaction_at TEXT,
  closed_at TEXT,
  closure_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  CHECK (
    status NOT IN ('completed', 'abandoned', 'archived')
    OR closed_at IS NOT NULL
  )
) STRICT;

CREATE TABLE project_party (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES project(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  person_id TEXT NOT NULL REFERENCES person(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  role TEXT NOT NULL
    CHECK (role IN ('primary', 'co_buyer', 'co_seller', 'referrer', 'advisor', 'other')),
  role_detail TEXT,
  valid_from TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  valid_to TEXT,
  source_kind TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_kind IN ('manual', 'form', 'import', 'fixture', 'other')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (project_id, person_id, role),
  CHECK (role <> 'other' OR role_detail IS NOT NULL),
  CHECK (valid_to IS NULL OR valid_to >= valid_from)
) STRICT;

CREATE INDEX project_party_person_idx
  ON project_party(person_id, project_id)
  WHERE valid_to IS NULL;

CREATE TABLE project_relationship (
  id TEXT PRIMARY KEY NOT NULL,
  source_project_id TEXT NOT NULL REFERENCES project(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  target_project_id TEXT NOT NULL REFERENCES project(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('purchase_depends_on_sale', 'sale_enables_purchase', 'related')),
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (source_project_id, target_project_id, type),
  CHECK (source_project_id <> target_project_id)
) STRICT;

CREATE TABLE buyer_search (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL UNIQUE REFERENCES project(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  summary TEXT NOT NULL DEFAULT '',
  reference_timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  opened_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  closed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  CHECK (status NOT IN ('completed', 'archived') OR closed_at IS NOT NULL)
) STRICT;

CREATE TABLE search_scenario (
  id TEXT PRIMARY KEY NOT NULL,
  buyer_search_id TEXT NOT NULL REFERENCES buyer_search(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  lineage_key TEXT NOT NULL CHECK (length(trim(lineage_key)) > 0),
  version_number INTEGER NOT NULL DEFAULT 1 CHECK (version_number >= 1),
  kind TEXT NOT NULL CHECK (kind IN ('preferred', 'acceptable', 'conditional')),
  label TEXT NOT NULL CHECK (length(trim(label)) > 0),
  condition_text TEXT,
  priority INTEGER NOT NULL DEFAULT 100 CHECK (priority >= 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'superseded', 'archived')),
  parent_scenario_id TEXT REFERENCES search_scenario(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  supersedes_scenario_id TEXT REFERENCES search_scenario(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  source_kind TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_kind IN ('manual', 'interaction', 'observation', 'fixture', 'other')),
  effective_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by_actor_id TEXT NOT NULL,
  UNIQUE (buyer_search_id, lineage_key, version_number),
  UNIQUE (id, buyer_search_id),
  CHECK (kind <> 'conditional' OR condition_text IS NOT NULL),
  CHECK (parent_scenario_id IS NULL OR parent_scenario_id <> id),
  CHECK (supersedes_scenario_id IS NULL OR supersedes_scenario_id <> id)
) STRICT;

CREATE INDEX project_status_stage_idx
  ON project(status, stage_key, updated_at DESC);

CREATE INDEX project_type_status_idx
  ON project(type, status, updated_at DESC);

CREATE INDEX buyer_search_status_idx
  ON buyer_search(status, updated_at DESC);

CREATE INDEX search_scenario_current_idx
  ON search_scenario(buyer_search_id, kind, priority, effective_at DESC)
  WHERE status = 'active';
