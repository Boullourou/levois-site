-- LEVOIS Agentic A1 — strictly fictional, structural fixtures.
-- This file never enables an agentic switch. Missing switch rows mean stopped.

PRAGMA foreign_keys = ON;

INSERT INTO project (
  id, type, status, stage_key, objective, calendar_summary,
  responsible_actor_id, closed_at, closure_reason, created_at, updated_at
) VALUES
  ('PRJ-FX-A', 'sale', 'active', 'qualification', '', '', 'ACTOR-FX', NULL, NULL, '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z'),
  ('PRJ-FX-B', 'primary_residence_purchase', 'active', 'search_active', '', '', 'ACTOR-FX', NULL, NULL, '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z'),
  ('PRJ-FX-C', 'sale', 'active', 'qualification', '', '', 'ACTOR-FX', NULL, NULL, '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z'),
  ('PRJ-FX-D', 'sale', 'completed', 'completed', '', '', 'ACTOR-FX', '2026-08-18T08:00:00.000Z', 'fixture_complete', '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z'),
  ('PRJ-FX-E', 'primary_residence_purchase', 'active', 'qualification', '', '', 'ACTOR-FX', NULL, NULL, '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z'),
  ('PRJ-FX-H', 'primary_residence_purchase', 'active', 'qualification', '', '', 'ACTOR-FX', NULL, NULL, '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z'),
  ('PRJ-FX-X', 'sale', 'completed', 'completed', '', '', 'ACTOR-FX', '2026-08-18T08:00:00.000Z', 'fixture_complete', '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z'),
  ('PRJ-FX-I-01', 'sale', 'active', 'qualification', '', '', 'ACTOR-FX', NULL, NULL, '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z'),
  ('PRJ-FX-I-02', 'sale', 'active', 'qualification', '', '', 'ACTOR-FX', NULL, NULL, '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z'),
  ('PRJ-FX-I-03', 'sale', 'active', 'qualification', '', '', 'ACTOR-FX', NULL, NULL, '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z'),
  ('PRJ-FX-I-04', 'sale', 'active', 'qualification', '', '', 'ACTOR-FX', NULL, NULL, '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z'),
  ('PRJ-FX-I-05', 'sale', 'active', 'qualification', '', '', 'ACTOR-FX', NULL, NULL, '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z'),
  ('PRJ-FX-I-06', 'sale', 'active', 'qualification', '', '', 'ACTOR-FX', NULL, NULL, '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z'),
  ('PRJ-FX-I-07', 'sale', 'active', 'qualification', '', '', 'ACTOR-FX', NULL, NULL, '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z'),
  ('PRJ-FX-I-08', 'sale', 'active', 'qualification', '', '', 'ACTOR-FX', NULL, NULL, '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z'),
  ('PRJ-FX-I-09', 'sale', 'active', 'qualification', '', '', 'ACTOR-FX', NULL, NULL, '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z'),
  ('PRJ-FX-I-10', 'sale', 'active', 'qualification', '', '', 'ACTOR-FX', NULL, NULL, '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z');

INSERT INTO interaction (
  id, project_id, type, direction, summary, promised_action,
  promised_due_at, source_kind, source_ref, occurred_at, recorded_at, actor_id
) VALUES
  ('INT-FX-E', 'PRJ-FX-E', 'call', 'outgoing', 'Fixture structurelle E', 'fixture_follow_up', '2026-08-19T08:00:00.000Z', 'fixture', 'FX-E', '2026-08-18T08:00:00.000Z', '2026-08-18T08:00:00.000Z', 'ACTOR-FX'),
  ('INT-FX-H', 'PRJ-FX-H', 'call', 'outgoing', 'Fixture structurelle H', 'fixture_follow_up', '2026-08-17T08:00:00.000Z', 'fixture', 'FX-H', '2026-08-16T08:00:00.000Z', '2026-08-16T08:00:00.000Z', 'ACTOR-FX');

INSERT INTO task (
  id, project_id, title, status, priority, due_at, is_next_action,
  promised_from_interaction_id, completed_at, created_at, updated_at, created_by_actor_id
) VALUES
  ('TSK-FX-B', 'PRJ-FX-B', 'FIXTURE_FUTURE_ACTION', 'open', 'normal', '2026-08-21T08:00:00.000Z', 1, NULL, NULL, '2026-08-18T08:00:00.000Z', '2026-08-18T08:00:00.000Z', 'ACTOR-FX'),
  ('TSK-FX-C', 'PRJ-FX-C', 'FIXTURE_OVERDUE', 'open', 'normal', '2026-08-17T08:00:00.000Z', 1, NULL, NULL, '2026-08-16T08:00:00.000Z', '2026-08-16T08:00:00.000Z', 'ACTOR-FX'),
  ('TSK-FX-D', 'PRJ-FX-D', 'FIXTURE_COMPLETED', 'completed', 'high', '2026-08-17T08:00:00.000Z', 0, NULL, '2026-08-18T08:00:00.000Z', '2026-08-16T08:00:00.000Z', '2026-08-18T08:00:00.000Z', 'ACTOR-FX'),
  ('TSK-FX-E', 'PRJ-FX-E', 'FIXTURE_PROMISE_DUE', 'open', 'high', '2026-08-19T08:00:00.000Z', 1, 'INT-FX-E', NULL, '2026-08-18T08:00:00.000Z', '2026-08-18T08:00:00.000Z', 'ACTOR-FX'),
  ('TSK-FX-H', 'PRJ-FX-H', 'FIXTURE_LINKED_DUPLICATE', 'open', 'high', '2026-08-17T08:00:00.000Z', 1, 'INT-FX-H', NULL, '2026-08-16T08:00:00.000Z', '2026-08-16T08:00:00.000Z', 'ACTOR-FX'),
  ('TSK-FX-X', 'PRJ-FX-X', 'FIXTURE_TERMINAL_INCONSISTENCY', 'open', 'normal', '2026-08-21T08:00:00.000Z', 1, NULL, NULL, '2026-08-18T08:00:00.000Z', '2026-08-18T08:00:00.000Z', 'ACTOR-FX');

INSERT INTO advisor_profile (
  id, display_name, network, external_advisor_ref, is_current_operator, status,
  created_at, updated_at
) VALUES
  ('ADV-FX-OPERATOR', 'Conseiller fixture opérateur', 'FIXTURE', NULL, 1, 'active', '2026-08-01T08:00:00.000Z', '2026-08-01T08:00:00.000Z'),
  ('ADV-FX-PARTNER', 'Conseiller fixture partenaire', 'FIXTURE', NULL, 0, 'active', '2026-08-01T08:00:00.000Z', '2026-08-01T08:00:00.000Z');

INSERT INTO tim_agreement (
  id, internal_reference, label, agreement_type, transaction_type,
  information_nature, current_agreement_status, current_operation_status,
  information_transmitted_at, created_at, updated_at
) VALUES
  ('TIM-FX-F', 'TIM-FX-F', 'Accord fixture F', 'information_referral_20_80', 'sale', 'seller', 'to_formalize', 'information_transmitted', '2026-08-01T08:00:00.000Z', '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z'),
  ('TIM-FX-G', 'TIM-FX-G', 'Accord fixture G', 'information_referral_20_80', 'sale', 'seller', 'to_formalize', 'completed', '2026-08-01T08:00:00.000Z', '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z'),
  ('TIM-FX-T', 'TIM-FX-T', 'Accord fixture échéance', 'information_referral_20_80', 'sale', 'seller', 'to_formalize', 'contacted', '2026-08-01T08:00:00.000Z', '2026-08-01T08:00:00.000Z', '2026-08-18T08:00:00.000Z');

INSERT INTO tim_agreement_party (
  id, tim_agreement_id, advisor_profile_id, role, active_from, created_at
) VALUES
  ('TPTY-FX-F-1', 'TIM-FX-F', 'ADV-FX-OPERATOR', 'referrer', '2026-08-01T08:00:00.000Z', '2026-08-01T08:00:00.000Z'),
  ('TPTY-FX-F-2', 'TIM-FX-F', 'ADV-FX-PARTNER', 'handling_advisor', '2026-08-01T08:00:00.000Z', '2026-08-01T08:00:00.000Z'),
  ('TPTY-FX-G-1', 'TIM-FX-G', 'ADV-FX-OPERATOR', 'referrer', '2026-08-01T08:00:00.000Z', '2026-08-01T08:00:00.000Z'),
  ('TPTY-FX-G-2', 'TIM-FX-G', 'ADV-FX-PARTNER', 'handling_advisor', '2026-08-01T08:00:00.000Z', '2026-08-01T08:00:00.000Z'),
  ('TPTY-FX-T-1', 'TIM-FX-T', 'ADV-FX-OPERATOR', 'referrer', '2026-08-01T08:00:00.000Z', '2026-08-01T08:00:00.000Z'),
  ('TPTY-FX-T-2', 'TIM-FX-T', 'ADV-FX-PARTNER', 'handling_advisor', '2026-08-01T08:00:00.000Z', '2026-08-01T08:00:00.000Z');

UPDATE tim_agreement
SET current_agreement_status = 'active',
    form_signed_at = '2026-08-02T08:00:00.000Z',
    formalized_at = '2026-08-02T08:00:00.000Z',
    updated_at = '2026-08-18T08:00:00.000Z',
    version = version + 1
WHERE id IN ('TIM-FX-F', 'TIM-FX-T');

UPDATE tim_agreement
SET current_agreement_status = 'closed',
    updated_at = '2026-08-18T08:00:00.000Z',
    version = version + 1
WHERE id = 'TIM-FX-G';

INSERT INTO task (
  id, tim_agreement_id, title, status, priority, due_at, is_next_action,
  created_at, updated_at, created_by_actor_id
) VALUES
  ('TSK-FX-TIM-NEAR', 'TIM-FX-T', 'FIXTURE_TIM_DEADLINE', 'open', 'normal', '2026-08-24T08:00:00.000Z', 1, '2026-08-18T08:00:00.000Z', '2026-08-18T08:00:00.000Z', 'ACTOR-FX');
