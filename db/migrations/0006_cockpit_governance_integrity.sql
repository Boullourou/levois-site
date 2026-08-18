-- LEVOIS cockpit V1 — minimal governance and cross-aggregate integrity guards.

PRAGMA foreign_keys = ON;

CREATE TABLE audit_event (
  id TEXT PRIMARY KEY NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (length(trim(action)) > 0),
  target_kind TEXT NOT NULL CHECK (target_kind IN (
    'person', 'project', 'buyer_search', 'criterion_event', 'interaction', 'task',
    'tim_agreement', 'tim_terms', 'tim_compensation', 'tim_payment',
    'lab_observation', 'export', 'auth', 'system'
  )),
  target_id TEXT,
  result TEXT NOT NULL DEFAULT 'success'
    CHECK (result IN ('success', 'denied', 'conflict', 'failure')),
  request_id TEXT,
  idempotency_key TEXT,
  request_fingerprint TEXT,
  result_target_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}'
    CHECK (json_valid(metadata_json)),
  occurred_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (
    (idempotency_key IS NULL AND request_fingerprint IS NULL)
    OR (
      idempotency_key IS NOT NULL
      AND request_fingerprint IS NOT NULL
      AND length(trim(idempotency_key)) >= 8
      AND length(trim(request_fingerprint)) >= 8
    )
  )
) STRICT;

CREATE UNIQUE INDEX audit_event_command_idempotency
  ON audit_event(actor_id, action, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX audit_event_target_idx
  ON audit_event(target_kind, target_id, occurred_at DESC);

CREATE INDEX audit_event_time_idx
  ON audit_event(occurred_at DESC);

CREATE TABLE lab_observation (
  id TEXT PRIMARY KEY NOT NULL,
  observation TEXT NOT NULL CHECK (length(trim(observation)) > 0),
  problem TEXT NOT NULL DEFAULT '',
  learning TEXT NOT NULL DEFAULT '',
  improvement_proposal TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'captured'
    CHECK (status IN ('captured', 'to_review', 'accepted', 'rejected', 'implemented')),
  internal_reference TEXT,
  observed_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by_actor_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
) STRICT;

CREATE INDEX lab_observation_status_idx
  ON lab_observation(status, observed_at DESC);

-- Buyer searches are valid only for buyer-oriented projects in V1.
CREATE TRIGGER buyer_search_project_type_insert
BEFORE INSERT ON buyer_search
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1 FROM project
  WHERE id = NEW.project_id AND type IN ('primary_residence_purchase', 'investment')
)
BEGIN
  SELECT RAISE(ABORT, 'buyer_search requires a buyer-oriented project');
END;

CREATE TRIGGER buyer_search_project_type_update
BEFORE UPDATE OF project_id ON buyer_search
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1 FROM project
  WHERE id = NEW.project_id AND type IN ('primary_residence_purchase', 'investment')
)
BEGIN
  SELECT RAISE(ABORT, 'buyer_search requires a buyer-oriented project');
END;

-- Project stages remain compatible with the project type.
CREATE TRIGGER project_stage_type_insert
BEFORE INSERT ON project
FOR EACH ROW
WHEN
  (NEW.type IN ('primary_residence_purchase', 'investment') AND NEW.stage_key IN (
    'preparation', 'mandate_pending', 'mandate_active', 'marketing', 'visits', 'offer_received'
  ))
  OR (NEW.type = 'sale' AND NEW.stage_key IN (
    'search_active', 'properties_proposed', 'visit_preparing', 'visit_completed',
    'offer_considered', 'offer_submitted'
  ))
BEGIN
  SELECT RAISE(ABORT, 'stage_key is incompatible with project type');
END;

CREATE TRIGGER project_stage_type_update
BEFORE UPDATE OF type, stage_key ON project
FOR EACH ROW
WHEN
  (NEW.type IN ('primary_residence_purchase', 'investment') AND NEW.stage_key IN (
    'preparation', 'mandate_pending', 'mandate_active', 'marketing', 'visits', 'offer_received'
  ))
  OR (NEW.type = 'sale' AND NEW.stage_key IN (
    'search_active', 'properties_proposed', 'visit_preparing', 'visit_completed',
    'offer_considered', 'offer_submitted'
  ))
BEGIN
  SELECT RAISE(ABORT, 'stage_key is incompatible with project type');
END;

-- Self-references in event histories never cross their aggregate boundary.
CREATE TRIGGER consent_event_supersedes_same_scope
BEFORE INSERT ON consent_event
FOR EACH ROW
WHEN NEW.supersedes_event_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM consent_event previous
  WHERE previous.id = NEW.supersedes_event_id
    AND previous.person_id = NEW.person_id
    AND previous.purpose = NEW.purpose
)
BEGIN
  SELECT RAISE(ABORT, 'superseded consent must share person and purpose');
END;

CREATE TRIGGER search_scenario_links_same_search_insert
BEFORE INSERT ON search_scenario
FOR EACH ROW
WHEN
  (NEW.parent_scenario_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM search_scenario parent
    WHERE parent.id = NEW.parent_scenario_id
      AND parent.buyer_search_id = NEW.buyer_search_id
  ))
  OR (NEW.supersedes_scenario_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM search_scenario previous
    WHERE previous.id = NEW.supersedes_scenario_id
      AND previous.buyer_search_id = NEW.buyer_search_id
      AND previous.lineage_key = NEW.lineage_key
  ))
BEGIN
  SELECT RAISE(ABORT, 'scenario links must stay in the same search and lineage');
END;

CREATE TRIGGER criterion_event_replaces_same_scope
BEFORE INSERT ON criterion_event
FOR EACH ROW
WHEN NEW.replaces_criterion_event_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM criterion_event previous
  WHERE previous.id = NEW.replaces_criterion_event_id
    AND previous.buyer_search_id = NEW.buyer_search_id
    AND previous.search_scenario_id = NEW.search_scenario_id
    AND previous.criterion_key = NEW.criterion_key
)
BEGIN
  SELECT RAISE(ABORT, 'replaced criterion must share search, scenario and key');
END;

CREATE TRIGGER criterion_event_decision_same_project
BEFORE INSERT ON criterion_event
FOR EACH ROW
WHEN NEW.decision_id IS NOT NULL AND NOT EXISTS (
  SELECT 1
  FROM decision d
  JOIN buyer_search s ON s.project_id = d.project_id
  WHERE d.id = NEW.decision_id AND s.id = NEW.buyer_search_id
)
BEGIN
  SELECT RAISE(ABORT, 'criterion decision must belong to the search project');
END;

-- A TIM agreement can leave draft state only after the relevant advisor roles exist.
CREATE TRIGGER tim_agreement_formal_state_insert
BEFORE INSERT ON tim_agreement
FOR EACH ROW
WHEN NEW.current_agreement_status IN ('signed', 'omega_uploaded', 'active', 'closed')
BEGIN
  SELECT RAISE(ABORT, 'create TIM agreement as to_formalize before adding parties');
END;

CREATE TRIGGER tim_agreement_formal_state_update
BEFORE UPDATE OF current_agreement_status ON tim_agreement
FOR EACH ROW
WHEN NEW.current_agreement_status IN ('signed', 'omega_uploaded', 'active', 'closed') AND (
  (SELECT count(DISTINCT advisor_profile_id)
   FROM tim_agreement_party
   WHERE tim_agreement_id = NEW.id AND active_to IS NULL) < 2
  OR (
    NEW.agreement_type = 'information_referral_20_80'
    AND (
      NOT EXISTS (SELECT 1 FROM tim_agreement_party WHERE tim_agreement_id = NEW.id AND role = 'referrer' AND active_to IS NULL)
      OR NOT EXISTS (SELECT 1 FROM tim_agreement_party WHERE tim_agreement_id = NEW.id AND role = 'handling_advisor' AND active_to IS NULL)
    )
  )
  OR (
    NEW.agreement_type = 'mandate_50_50'
    AND (
      NOT EXISTS (SELECT 1 FROM tim_agreement_party WHERE tim_agreement_id = NEW.id AND role = 'seller_mandate_advisor' AND active_to IS NULL)
      OR NOT EXISTS (SELECT 1 FROM tim_agreement_party WHERE tim_agreement_id = NEW.id AND role = 'buyer_advisor' AND active_to IS NULL)
    )
  )
  OR (
    NEW.current_agreement_status IN ('signed', 'omega_uploaded', 'active')
    AND NEW.form_signed_at IS NULL
  )
  OR (NEW.current_agreement_status = 'omega_uploaded' AND NEW.omega_uploaded_at IS NULL)
)
BEGIN
  SELECT RAISE(ABORT, 'formal TIM state requires two advisors, required roles and evidence dates');
END;

CREATE TRIGGER tim_terms_match_agreement
BEFORE INSERT ON tim_agreement_terms
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1 FROM tim_agreement agreement
  WHERE agreement.id = NEW.tim_agreement_id
    AND agreement.agreement_type = NEW.agreement_type
    AND agreement.transaction_type = NEW.transaction_type
)
BEGIN
  SELECT RAISE(ABORT, 'TIM terms must match current agreement and transaction types');
END;

CREATE TRIGGER tim_allocation_same_agreement
BEFORE INSERT ON tim_agreement_allocation
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1
  FROM tim_agreement_terms terms
  JOIN tim_agreement_party party
    ON party.tim_agreement_id = terms.tim_agreement_id
  WHERE terms.id = NEW.tim_agreement_terms_id
    AND party.id = NEW.tim_agreement_party_id
)
BEGIN
  SELECT RAISE(ABORT, 'TIM allocation party and terms must share an agreement');
END;

CREATE TRIGGER tim_compensation_same_agreement
BEFORE INSERT ON tim_compensation
FOR EACH ROW
WHEN
  NOT EXISTS (
    SELECT 1 FROM tim_agreement_party party
    WHERE party.id = NEW.beneficiary_party_id
      AND party.tim_agreement_id = NEW.tim_agreement_id
  )
  OR NOT EXISTS (
    SELECT 1 FROM tim_agreement_terms terms
    WHERE terms.id = NEW.tim_agreement_terms_id
      AND terms.tim_agreement_id = NEW.tim_agreement_id
  )
  OR (
    NEW.supersedes_compensation_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM tim_compensation previous
      WHERE previous.id = NEW.supersedes_compensation_id
        AND previous.tim_agreement_id = NEW.tim_agreement_id
        AND previous.beneficiary_party_id = NEW.beneficiary_party_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'TIM compensation references must stay in one agreement');
END;

CREATE TRIGGER tim_compensation_financial_activation
BEFORE INSERT ON tim_compensation
FOR EACH ROW
WHEN NEW.current_compensation_status IN ('estimated', 'due', 'paid') AND NOT EXISTS (
  SELECT 1
  FROM tim_agreement_terms terms
  JOIN tim_agreement_allocation allocation
    ON allocation.tim_agreement_terms_id = terms.id
   AND allocation.tim_agreement_party_id = NEW.beneficiary_party_id
  WHERE terms.id = NEW.tim_agreement_terms_id
    AND terms.tim_agreement_id = NEW.tim_agreement_id
    AND terms.confirmed_at IS NOT NULL
    AND terms.allocations_confirmed_at IS NOT NULL
)
BEGIN
  SELECT RAISE(ABORT, 'financial activation requires confirmed terms and beneficiary allocation');
END;

CREATE TRIGGER tim_compensation_same_agreement_update
BEFORE UPDATE OF tim_agreement_id, beneficiary_party_id, tim_agreement_terms_id,
  supersedes_compensation_id ON tim_compensation
FOR EACH ROW
WHEN
  NOT EXISTS (
    SELECT 1 FROM tim_agreement_party party
    WHERE party.id = NEW.beneficiary_party_id
      AND party.tim_agreement_id = NEW.tim_agreement_id
  )
  OR NOT EXISTS (
    SELECT 1 FROM tim_agreement_terms terms
    WHERE terms.id = NEW.tim_agreement_terms_id
      AND terms.tim_agreement_id = NEW.tim_agreement_id
  )
  OR (
    NEW.supersedes_compensation_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM tim_compensation previous
      WHERE previous.id = NEW.supersedes_compensation_id
        AND previous.tim_agreement_id = NEW.tim_agreement_id
        AND previous.beneficiary_party_id = NEW.beneficiary_party_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'TIM compensation references must stay in one agreement');
END;

CREATE TRIGGER tim_compensation_financial_activation_update
BEFORE UPDATE OF current_compensation_status, beneficiary_party_id,
  tim_agreement_terms_id, tim_agreement_id ON tim_compensation
FOR EACH ROW
WHEN NEW.current_compensation_status IN ('estimated', 'due', 'paid') AND NOT EXISTS (
  SELECT 1
  FROM tim_agreement_terms terms
  JOIN tim_agreement_allocation allocation
    ON allocation.tim_agreement_terms_id = terms.id
   AND allocation.tim_agreement_party_id = NEW.beneficiary_party_id
  WHERE terms.id = NEW.tim_agreement_terms_id
    AND terms.tim_agreement_id = NEW.tim_agreement_id
    AND terms.confirmed_at IS NOT NULL
    AND terms.allocations_confirmed_at IS NOT NULL
)
BEGIN
  SELECT RAISE(ABORT, 'financial activation requires confirmed terms and beneficiary allocation');
END;

CREATE TRIGGER tim_status_compensation_same_agreement
BEFORE INSERT ON tim_status_event
FOR EACH ROW
WHEN NEW.tim_compensation_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM tim_compensation compensation
  WHERE compensation.id = NEW.tim_compensation_id
    AND compensation.tim_agreement_id = NEW.tim_agreement_id
)
BEGIN
  SELECT RAISE(ABORT, 'TIM status compensation must belong to its agreement');
END;

CREATE TRIGGER tim_payment_same_currency_and_scope
BEFORE INSERT ON tim_payment
FOR EACH ROW
WHEN
  NOT EXISTS (
    SELECT 1 FROM tim_compensation compensation
    WHERE compensation.id = NEW.tim_compensation_id
      AND compensation.currency_code = NEW.currency_code
  )
  OR (
    NEW.reverses_payment_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM tim_payment previous
      WHERE previous.id = NEW.reverses_payment_id
        AND previous.tim_compensation_id = NEW.tim_compensation_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'TIM payment must match compensation scope and currency');
END;

CREATE TRIGGER tim_payment_same_currency_and_scope_update
BEFORE UPDATE OF tim_compensation_id, currency_code, reverses_payment_id ON tim_payment
FOR EACH ROW
WHEN
  NOT EXISTS (
    SELECT 1 FROM tim_compensation compensation
    WHERE compensation.id = NEW.tim_compensation_id
      AND compensation.currency_code = NEW.currency_code
  )
  OR (
    NEW.reverses_payment_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM tim_payment previous
      WHERE previous.id = NEW.reverses_payment_id
        AND previous.tim_compensation_id = NEW.tim_compensation_id
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'TIM payment must match compensation scope and currency');
END;

CREATE TRIGGER task_promised_interaction_same_scope
BEFORE INSERT ON task
FOR EACH ROW
WHEN NEW.promised_from_interaction_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM interaction source
  WHERE source.id = NEW.promised_from_interaction_id
    AND source.project_id IS NEW.project_id
    AND source.tim_agreement_id IS NEW.tim_agreement_id
)
BEGIN
  SELECT RAISE(ABORT, 'promised interaction and task must share a context');
END;

CREATE TRIGGER task_promised_interaction_same_scope_update
BEFORE UPDATE OF project_id, tim_agreement_id, promised_from_interaction_id ON task
FOR EACH ROW
WHEN NEW.promised_from_interaction_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM interaction source
  WHERE source.id = NEW.promised_from_interaction_id
    AND source.project_id IS NEW.project_id
    AND source.tim_agreement_id IS NEW.tim_agreement_id
)
BEGIN
  SELECT RAISE(ABORT, 'promised interaction and task must share a context');
END;

-- Fact histories are revised by adding rows, never by overwriting prior evidence.
CREATE TRIGGER consent_event_no_update
BEFORE UPDATE ON consent_event
BEGIN
  SELECT RAISE(ABORT, 'consent_event is append-only');
END;

CREATE TRIGGER criterion_event_no_update
BEFORE UPDATE ON criterion_event
BEGIN
  SELECT RAISE(ABORT, 'criterion_event is append-only');
END;

CREATE TRIGGER tim_allocation_no_update
BEFORE UPDATE ON tim_agreement_allocation
BEGIN
  SELECT RAISE(ABORT, 'TIM allocations are revised through new terms');
END;

CREATE TRIGGER tim_status_event_no_update
BEFORE UPDATE ON tim_status_event
BEGIN
  SELECT RAISE(ABORT, 'tim_status_event is append-only');
END;

CREATE TRIGGER audit_event_no_update
BEFORE UPDATE ON audit_event
BEGIN
  SELECT RAISE(ABORT, 'audit_event is append-only');
END;
