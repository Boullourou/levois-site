-- LEVOIS cockpit V1 — identity, contact and consent history.
-- Additive migration. It intentionally contains no client data.

PRAGMA foreign_keys = ON;

CREATE TABLE person (
  id TEXT PRIMARY KEY NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  preferred_name TEXT,
  origin TEXT NOT NULL DEFAULT 'unknown'
    CHECK (origin IN (
      'referral', 'website', 'professional_network', 'property_portal',
      'event', 'outbound', 'tim', 'other', 'unknown'
    )),
  summary TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'erasure_pending', 'erased')),
  last_contact_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  CHECK (length(trim(first_name)) > 0 OR length(trim(last_name)) > 0 OR preferred_name IS NOT NULL)
) STRICT;

CREATE TABLE contact_method (
  id TEXT PRIMARY KEY NOT NULL,
  person_id TEXT NOT NULL REFERENCES person(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'whatsapp', 'other')),
  display_value TEXT NOT NULL CHECK (length(trim(display_value)) > 0),
  normalized_value TEXT NOT NULL CHECK (length(trim(normalized_value)) > 0),
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  verification_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (verification_status IN ('unknown', 'unverified', 'verified', 'invalid')),
  source_kind TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_kind IN ('manual', 'form', 'import', 'fixture', 'other')),
  first_observed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_observed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  CHECK (last_observed_at >= first_observed_at)
) STRICT;

CREATE UNIQUE INDEX contact_method_one_primary_per_type
  ON contact_method(person_id, type)
  WHERE is_primary = 1;

CREATE INDEX contact_method_person_idx
  ON contact_method(person_id, type);

CREATE INDEX contact_method_normalized_idx
  ON contact_method(normalized_value, type);

CREATE TABLE consent_event (
  id TEXT PRIMARY KEY NOT NULL,
  person_id TEXT NOT NULL REFERENCES person(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  project_id TEXT REFERENCES project(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  purpose TEXT NOT NULL DEFAULT 'unknown'
    CHECK (purpose IN ('human_contact', 'deliver_reading', 'matching_alert', 'service_follow_up', 'other', 'unknown')),
  action TEXT NOT NULL DEFAULT 'unknown'
    CHECK (action IN ('unknown', 'granted', 'refused', 'withdrawn')),
  evidence_quality TEXT NOT NULL DEFAULT 'unknown'
    CHECK (evidence_quality IN ('complete', 'evidence_incomplete', 'unknown')),
  channel TEXT NOT NULL DEFAULT 'unknown'
    CHECK (channel IN ('web', 'email', 'sms', 'phone', 'paper', 'manual', 'other', 'unknown')),
  notice_version TEXT,
  notice_fingerprint TEXT,
  source_kind TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_kind IN ('manual', 'form', 'import', 'fixture', 'other')),
  source_ref TEXT,
  supersedes_event_id TEXT REFERENCES consent_event(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  effective_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  actor_id TEXT NOT NULL,
  CHECK (supersedes_event_id IS NULL OR supersedes_event_id <> id),
  CHECK (action <> 'granted' OR evidence_quality = 'complete'),
  CHECK (
    evidence_quality <> 'complete'
    OR (notice_version IS NOT NULL AND notice_fingerprint IS NOT NULL)
  )
) STRICT;

CREATE INDEX consent_event_person_purpose_idx
  ON consent_event(person_id, purpose, effective_at DESC, recorded_at DESC);

CREATE INDEX consent_event_project_idx
  ON consent_event(project_id, effective_at DESC)
  WHERE project_id IS NOT NULL;
