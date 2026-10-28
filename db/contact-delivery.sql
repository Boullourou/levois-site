-- Additive migration on RECHERCHE_DB. Delivery receipts only, no message or contact details.
CREATE TABLE IF NOT EXISTS contact_delivery_receipts (
  id TEXT PRIMARY KEY,
  payload_hash TEXT NOT NULL,
  notification_state TEXT NOT NULL DEFAULT 'pending'
    CHECK (notification_state IN ('pending','sending','sent','failed','unknown','unavailable')),
  notification_provider TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_contact_delivery_created ON contact_delivery_receipts(created_at);
