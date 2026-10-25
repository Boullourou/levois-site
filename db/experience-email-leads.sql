-- Additive schema for the explicitly requested synthesis + project record.
-- Apply ONLY to the existing RECHERCHE_DB, never to COCKPIT_DB.
-- Does not alter historical email-copy or review/exchange contracts.
CREATE TABLE IF NOT EXISTS experience_email_leads (
  id TEXT PRIMARY KEY NOT NULL,
  payload_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  context_json TEXT NOT NULL CHECK (json_valid(context_json)),
  synthesis TEXT NOT NULL,
  consent_json TEXT NOT NULL CHECK (json_valid(consent_json)),
  copy_state TEXT NOT NULL DEFAULT 'pending' CHECK (copy_state IN ('pending','sending','sent','failed','unknown','unavailable')),
  copy_provider TEXT,
  copy_updated_at TEXT,
  copy_attempts INTEGER NOT NULL DEFAULT 0,
  advisor_state TEXT NOT NULL DEFAULT 'pending' CHECK (advisor_state IN ('pending','sending','sent','failed','unknown','unavailable')),
  advisor_provider TEXT,
  advisor_updated_at TEXT,
  advisor_attempts INTEGER NOT NULL DEFAULT 0
) STRICT;
CREATE INDEX IF NOT EXISTS experience_email_leads_created ON experience_email_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS experience_email_leads_email ON experience_email_leads(contact_email);
