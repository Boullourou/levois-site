-- LEVOIS public continuity. Apply ONLY to RECHERCHE_DB, separately from
-- db/migrations (COCKPIT_DB). Additive, idempotent, contains no visitor data.
-- No anonymous browsing or email-copy content is stored in these tables.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS experience_requests (
  id TEXT PRIMARY KEY NOT NULL,
  payload_hash TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('review','exchange')),
  created_at TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('email','phone')),
  first_name TEXT NOT NULL DEFAULT '',
  question TEXT NOT NULL DEFAULT '',
  context_json TEXT NOT NULL CHECK (json_valid(context_json)),
  synthesis TEXT NOT NULL,
  consent_json TEXT NOT NULL CHECK (json_valid(consent_json)),
  notification_state TEXT NOT NULL DEFAULT 'pending' CHECK (notification_state IN ('pending','sending','sent','failed','unknown','unavailable','not-requested')),
  notification_provider TEXT,
  notification_updated_at TEXT,
  notification_attempts INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','closed')),
  CHECK ((channel = 'email' AND contact_email IS NOT NULL AND contact_phone IS NULL) OR
         (action = 'exchange' AND channel = 'phone' AND contact_phone IS NOT NULL AND contact_email IS NULL)),
  CHECK (action <> 'review' OR channel = 'email')
) STRICT;
CREATE INDEX IF NOT EXISTS experience_requests_open ON experience_requests(status, created_at DESC);

CREATE TABLE IF NOT EXISTS experience_notes (
  id TEXT PRIMARY KEY NOT NULL,
  request_id TEXT NOT NULL REFERENCES experience_requests(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  text TEXT NOT NULL,
  reason TEXT NOT NULL,
  evidence TEXT NOT NULL,
  context_json TEXT CHECK (context_json IS NULL OR json_valid(context_json))
) STRICT;

CREATE TABLE IF NOT EXISTS experience_access (
  id TEXT PRIMARY KEY NOT NULL,
  request_id TEXT NOT NULL REFERENCES experience_requests(id) ON DELETE CASCADE,
  note_id TEXT REFERENCES experience_notes(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  contact_email TEXT NOT NULL,
  context_json TEXT NOT NULL CHECK (json_valid(context_json)),
  synthesis TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  code_hash TEXT,
  code_expires_at TEXT,
  challenge_sent_at TEXT,
  challenge_count INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_verified_at TEXT,
  CHECK (expires_at > created_at)
) STRICT;
CREATE INDEX IF NOT EXISTS experience_access_request ON experience_access(request_id);
