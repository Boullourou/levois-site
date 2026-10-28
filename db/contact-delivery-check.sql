-- READ ONLY: schema metadata for RECHERCHE_DB, no visitor rows or secrets.
-- Production must resolve to 077d24f8-5efc-4787-a451-05b041ddd2f7.
-- Preview resolves to 308c98e9-d484-4fdd-9892-539abb6b0ffd.
-- An absent table is reported, not queried. This file never applies a migration.

WITH expected(name) AS (VALUES
  ('contact_delivery_receipts'), ('experience_email_leads'),
  ('experience_requests'), ('experience_notes'), ('experience_access')
)
SELECT e.name AS expected_table,
  CASE WHEN s.name IS NULL THEN 'MISSING' ELSE 'PRESENT_REVIEW_DDL' END AS status
FROM expected e LEFT JOIN sqlite_master s ON s.type = 'table' AND s.name = e.name
ORDER BY e.name;

WITH expected(table_name, columns_json) AS (VALUES
  ('contact_delivery_receipts', '["id","payload_hash","notification_state","notification_provider","created_at","updated_at","attempts"]'),
  ('experience_email_leads', '["id","payload_hash","created_at","contact_email","context_json","synthesis","consent_json","copy_state","copy_provider","copy_updated_at","copy_attempts","advisor_state","advisor_provider","advisor_updated_at","advisor_attempts"]'),
  ('experience_requests', '["id","payload_hash","action","created_at","contact_email","contact_phone","channel","first_name","question","context_json","synthesis","consent_json","notification_state","notification_provider","notification_updated_at","notification_attempts","status"]'),
  ('experience_notes', '["id","request_id","actor_id","created_at","text","reason","evidence","context_json"]'),
  ('experience_access', '["id","request_id","note_id","token_hash","contact_email","context_json","synthesis","actor_id","created_at","expires_at","revoked_at","code_hash","code_expires_at","challenge_sent_at","challenge_count","attempts","last_verified_at"]')
)
SELECT e.table_name, j.value AS missing_column
FROM expected e, json_each(e.columns_json) j
WHERE NOT EXISTS (SELECT 1 FROM pragma_table_info(e.table_name) p WHERE p.name = j.value)
ORDER BY e.table_name, j.value;

WITH expected(name) AS (VALUES
  ('contact_delivery_receipts'), ('experience_email_leads'),
  ('experience_requests'), ('experience_notes'), ('experience_access')
)
SELECT e.name AS table_name, p.cid, p.name AS column_name, p.type,
  p."notnull" AS is_not_null, p.dflt_value, p.pk
FROM expected e, pragma_table_info(e.name) p
ORDER BY e.name, p.cid;

WITH expected(name, table_name) AS (VALUES
  ('idx_contact_delivery_created', 'contact_delivery_receipts'),
  ('experience_email_leads_created', 'experience_email_leads'),
  ('experience_email_leads_email', 'experience_email_leads'),
  ('experience_requests_open', 'experience_requests'),
  ('experience_access_request', 'experience_access')
)
SELECT e.name AS expected_index, e.table_name,
  CASE WHEN s.name IS NULL THEN 'MISSING' ELSE 'PRESENT_REVIEW_DDL' END AS status,
  s.sql
FROM expected e LEFT JOIN sqlite_master s ON s.type = 'index' AND s.name = e.name AND s.tbl_name = e.table_name
ORDER BY e.name;

-- Inspect CHECK constraints, primary/foreign keys and STRICT against the three
-- versioned migration files. IF NOT EXISTS does not repair an incompatible table.
SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name IN (
  'contact_delivery_receipts', 'experience_email_leads',
  'experience_requests', 'experience_notes', 'experience_access'
) ORDER BY name;
