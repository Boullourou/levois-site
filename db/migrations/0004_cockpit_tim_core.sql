-- LEVOIS cockpit V1 — TIM collaboration aggregate and versioned terms.
-- Agreement labels never imply automatic percentages.

PRAGMA foreign_keys = ON;

CREATE TABLE advisor_profile (
  id TEXT PRIMARY KEY NOT NULL,
  person_id TEXT REFERENCES person(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  display_name TEXT NOT NULL CHECK (length(trim(display_name)) > 0),
  network TEXT NOT NULL DEFAULT 'SAFTI' CHECK (length(trim(network)) > 0),
  external_advisor_ref TEXT,
  is_current_operator INTEGER NOT NULL DEFAULT 0 CHECK (is_current_operator IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
) STRICT;

CREATE UNIQUE INDEX advisor_profile_one_current_operator
  ON advisor_profile(is_current_operator)
  WHERE is_current_operator = 1 AND status = 'active';

CREATE TABLE tim_agreement (
  id TEXT PRIMARY KEY NOT NULL,
  internal_reference TEXT NOT NULL UNIQUE CHECK (length(trim(internal_reference)) > 0),
  label TEXT NOT NULL CHECK (length(trim(label)) > 0),
  agreement_type TEXT NOT NULL
    CHECK (agreement_type IN ('information_referral_20_80', 'mandate_50_50', 'custom')),
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('sale', 'rental', 'other')),
  information_nature TEXT NOT NULL
    CHECK (information_nature IN ('seller', 'buyer', 'landlord', 'tenant', 'other')),
  subject_person_id TEXT REFERENCES person(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  related_project_id TEXT REFERENCES project(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  subject_label TEXT,
  current_agreement_status TEXT NOT NULL DEFAULT 'to_formalize'
    CHECK (current_agreement_status IN ('to_formalize', 'signed', 'omega_uploaded', 'active', 'cancelled', 'closed')),
  current_operation_status TEXT NOT NULL DEFAULT 'information_transmitted'
    CHECK (current_operation_status IN (
      'information_transmitted', 'contacted', 'mandate_obtained',
      'marketing_or_search_active', 'offer_or_application_received',
      'precontract_or_lease_signed', 'completed', 'abandoned'
    )),
  information_transmitted_at TEXT NOT NULL,
  formalized_at TEXT,
  form_signed_at TEXT,
  omega_uploaded_at TEXT,
  mandate_obtained_at TEXT,
  mandate_reference TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  CHECK (omega_uploaded_at IS NULL OR form_signed_at IS NOT NULL)
) STRICT;

CREATE TABLE tim_agreement_party (
  id TEXT PRIMARY KEY NOT NULL,
  tim_agreement_id TEXT NOT NULL REFERENCES tim_agreement(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  advisor_profile_id TEXT NOT NULL REFERENCES advisor_profile(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  role TEXT NOT NULL CHECK (role IN (
    'referrer', 'handling_advisor', 'seller_mandate_advisor', 'buyer_advisor', 'other'
  )),
  responsibility_text TEXT,
  active_from TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  active_to TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tim_agreement_id, advisor_profile_id, role),
  UNIQUE (id, tim_agreement_id),
  CHECK (role <> 'other' OR responsibility_text IS NOT NULL),
  CHECK (active_to IS NULL OR active_to >= active_from)
) STRICT;

CREATE INDEX tim_agreement_party_advisor_idx
  ON tim_agreement_party(advisor_profile_id, tim_agreement_id)
  WHERE active_to IS NULL;

CREATE TABLE tim_agreement_terms (
  id TEXT PRIMARY KEY NOT NULL,
  tim_agreement_id TEXT NOT NULL REFERENCES tim_agreement(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number >= 1),
  agreement_type TEXT NOT NULL
    CHECK (agreement_type IN ('information_referral_20_80', 'mandate_50_50', 'custom')),
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('sale', 'rental', 'other')),
  fee_basis TEXT NOT NULL DEFAULT 'unknown'
    CHECK (fee_basis IN ('unknown', 'ht', 'ttc', 'other')),
  currency_code TEXT NOT NULL DEFAULT 'EUR'
    CHECK (length(currency_code) = 3 AND currency_code = upper(currency_code)),
  calculation_method TEXT NOT NULL DEFAULT 'unknown'
    CHECK (calculation_method IN ('unknown', 'percentage', 'fixed', 'custom')),
  payment_trigger_code TEXT NOT NULL DEFAULT 'unknown'
    CHECK (payment_trigger_code IN ('unknown', 'deed_signed', 'funds_received', 'lease_signed', 'custom')),
  payment_trigger_text TEXT,
  conditions_text TEXT,
  change_reason TEXT,
  is_current INTEGER NOT NULL DEFAULT 1 CHECK (is_current IN (0, 1)),
  confirmed_at TEXT,
  confirmed_by_actor_id TEXT,
  allocations_confirmed_at TEXT,
  allocations_confirmed_by_actor_id TEXT,
  effective_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by_actor_id TEXT NOT NULL,
  UNIQUE (tim_agreement_id, version_number),
  UNIQUE (id, tim_agreement_id),
  CHECK (payment_trigger_code <> 'custom' OR payment_trigger_text IS NOT NULL),
  CHECK (
    (confirmed_at IS NULL AND confirmed_by_actor_id IS NULL)
    OR (confirmed_at IS NOT NULL AND confirmed_by_actor_id IS NOT NULL)
  ),
  CHECK (
    (allocations_confirmed_at IS NULL AND allocations_confirmed_by_actor_id IS NULL)
    OR (allocations_confirmed_at IS NOT NULL AND allocations_confirmed_by_actor_id IS NOT NULL)
  )
) STRICT;

CREATE UNIQUE INDEX tim_agreement_terms_one_current
  ON tim_agreement_terms(tim_agreement_id)
  WHERE is_current = 1;

CREATE TABLE tim_agreement_allocation (
  id TEXT PRIMARY KEY NOT NULL,
  tim_agreement_terms_id TEXT NOT NULL,
  tim_agreement_party_id TEXT NOT NULL,
  share_basis_points INTEGER NOT NULL CHECK (share_basis_points BETWEEN 0 AND 10000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by_actor_id TEXT NOT NULL,
  FOREIGN KEY (tim_agreement_terms_id)
    REFERENCES tim_agreement_terms(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  FOREIGN KEY (tim_agreement_party_id)
    REFERENCES tim_agreement_party(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  UNIQUE (tim_agreement_terms_id, tim_agreement_party_id)
) STRICT;

CREATE INDEX tim_agreement_status_idx
  ON tim_agreement(current_agreement_status, current_operation_status, updated_at DESC);

CREATE INDEX tim_agreement_type_idx
  ON tim_agreement(transaction_type, agreement_type, updated_at DESC);
