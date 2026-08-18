-- LEVOIS cockpit V1 — manifestly fictional local/preview fixtures only.
-- These records do not describe a real client, advisor, property, agreement or payment.
-- Never apply this file to the production D1 database.

PRAGMA foreign_keys = ON;

INSERT INTO person (
  id, first_name, last_name, preferred_name, origin, summary, status,
  last_contact_at, created_at, updated_at, version
) VALUES
  (
    'demo-person-buyer-001', 'Camille', 'Démonstration', 'Camille (démo)', 'other',
    'Profil entièrement fictif : projet de retraite et recherche de résidence principale dans le secteur chartrain.',
    'active', '2026-08-15T10:00:00.000Z', '2026-08-01T09:00:00.000Z', '2026-08-15T10:00:00.000Z', 1
  ),
  (
    'demo-person-seller-001', 'Alex', 'Démonstration', 'Alex (démo)', 'referral',
    'Profil entièrement fictif : projet vendeur en qualification, sans adresse exacte.',
    'active', '2026-08-14T16:00:00.000Z', '2026-08-03T09:00:00.000Z', '2026-08-14T16:00:00.000Z', 1
  ),
  (
    'demo-person-tim-subject-001', 'Contact', 'TIM Fictif', 'Contact TIM (démo)', 'professional_network',
    'Contact fictif lié uniquement à un Accord TIM ; aucun projet directement accompagné.',
    'active', NULL, '2026-08-04T09:00:00.000Z', '2026-08-04T09:00:00.000Z', 1
  );

INSERT INTO contact_method (
  id, person_id, type, display_value, normalized_value, is_primary,
  verification_status, source_kind, first_observed_at, last_observed_at
) VALUES (
  'demo-contact-buyer-email-001', 'demo-person-buyer-001', 'email',
  'camille.demo@example.invalid', 'camille.demo@example.invalid', 1,
  'unverified', 'fixture', '2026-08-01T09:00:00.000Z', '2026-08-15T10:00:00.000Z'
);

INSERT INTO consent_event (
  id, person_id, project_id, purpose, action, evidence_quality, channel,
  source_kind, source_ref, effective_at, actor_id
) VALUES (
  'demo-consent-buyer-unknown-001', 'demo-person-buyer-001', NULL,
  'human_contact', 'unknown', 'unknown', 'manual', 'fixture', 'fictional-seed',
  '2026-08-01T09:00:00.000Z', 'demo-operator'
);

INSERT INTO project (
  id, type, status, stage_key, objective, calendar_summary, responsible_actor_id,
  last_interaction_at, created_at, updated_at, version
) VALUES
  (
    'demo-project-buyer-001', 'primary_residence_purchase', 'active', 'search_active',
    'Préparer une résidence principale fictive pour un projet de retraite.',
    'Horizon volontairement à confirmer.', 'demo-operator', '2026-08-15T10:00:00.000Z',
    '2026-08-01T09:00:00.000Z', '2026-08-15T10:00:00.000Z', 1
  ),
  (
    'demo-project-seller-001', 'sale', 'qualifying', 'qualification',
    'Qualifier un projet de vente fictif dans le bassin chartrain, sans adresse exacte.',
    'Calendrier à définir avec le contact fictif.', 'demo-operator', '2026-08-14T16:00:00.000Z',
    '2026-08-03T09:00:00.000Z', '2026-08-14T16:00:00.000Z', 1
  );

INSERT INTO project_party (
  id, project_id, person_id, role, source_kind, valid_from
) VALUES
  (
    'demo-project-party-buyer-001', 'demo-project-buyer-001', 'demo-person-buyer-001',
    'primary', 'fixture', '2026-08-01T09:00:00.000Z'
  ),
  (
    'demo-project-party-seller-001', 'demo-project-seller-001', 'demo-person-seller-001',
    'primary', 'fixture', '2026-08-03T09:00:00.000Z'
  );

INSERT INTO buyer_search (
  id, project_id, status, summary, reference_timezone, opened_at, created_at, updated_at, version
) VALUES (
  'demo-search-retirement-001', 'demo-project-buyer-001', 'active',
  'Recherche fictive : secteur chartrain, maison privilégiée, appartement possible selon qualité.',
  'Europe/Paris', '2026-08-01T09:00:00.000Z', '2026-08-01T09:00:00.000Z',
  '2026-08-16T09:00:00.000Z', 2
);

INSERT INTO search_scenario (
  id, buyer_search_id, lineage_key, version_number, kind, label, condition_text,
  priority, status, source_kind, effective_at, created_by_actor_id
) VALUES
  (
    'demo-scenario-preferred-001', 'demo-search-retirement-001', 'preferred-main', 1,
    'preferred', 'Cible privilégiée', NULL, 10, 'active', 'fixture',
    '2026-08-01T09:00:00.000Z', 'demo-operator'
  ),
  (
    'demo-scenario-acceptable-001', 'demo-search-retirement-001', 'acceptable-flat', 1,
    'acceptable', 'Alternative appartement', NULL, 20, 'active', 'fixture',
    '2026-08-01T09:00:00.000Z', 'demo-operator'
  ),
  (
    'demo-scenario-conditional-001', 'demo-search-retirement-001', 'conditional-layout', 1,
    'conditional', 'Surface plus petite si agencement excellent',
    'La surface plus faible reste acceptable uniquement si la distribution et la pièce de vie sont convaincantes.',
    30, 'active', 'fixture', '2026-08-15T10:00:00.000Z', 'demo-operator'
  );

INSERT INTO decision (
  id, project_id, type, summary, reason, source_kind, source_ref, effective_at, actor_id
) VALUES (
  'demo-decision-surface-001', 'demo-project-buyer-001', 'criterion_change',
  'Valider un scénario conditionnel à partir d’une observation fictive.',
  'Conserver la cible idéale tout en documentant une exception d’agencement.',
  'observation', 'fictional-observation', '2026-08-16T09:00:00.000Z', 'demo-operator'
);

INSERT INTO criterion_event (
  id, buyer_search_id, search_scenario_id, criterion_key, operation, value_json,
  importance, flexibility, certainty, matching_role, hard_validated,
  hard_validated_by_actor_id, hard_validated_at, source_kind, source_ref, reason,
  effective_at, actor_id, replaces_criterion_event_id, decision_id
) VALUES
  (
    'demo-criterion-property-preferred-001', 'demo-search-retirement-001',
    'demo-scenario-preferred-001', 'property_type', 'set', '{"values":["house"]}',
    'important', 'low', 'confirmed', 'soft', 0, NULL, NULL,
    'fixture', 'fictional-profile', NULL, '2026-08-01T09:00:00.000Z', 'demo-operator', NULL, NULL
  ),
  (
    'demo-criterion-property-acceptable-001', 'demo-search-retirement-001',
    'demo-scenario-acceptable-001', 'property_type', 'set', '{"values":["apartment"]}',
    'important', 'medium', 'confirmed', 'soft', 0, NULL, NULL,
    'fixture', 'fictional-profile', NULL, '2026-08-01T09:00:00.000Z', 'demo-operator', NULL, NULL
  ),
  (
    'demo-criterion-area-001', 'demo-search-retirement-001',
    'demo-scenario-preferred-001', 'zone', 'set', '{"label":"secteur chartrain","max_minutes":15}',
    'essential', 'low', 'confirmed', 'hard', 0, NULL, NULL,
    'fixture', 'fictional-profile', NULL, '2026-08-01T09:00:00.000Z', 'demo-operator', NULL, NULL
  ),
  (
    'demo-criterion-communes-001', 'demo-search-retirement-001',
    'demo-scenario-preferred-001', 'municipalities', 'set', '{"values":[]}',
    'important', 'unknown', 'to_confirm', 'unknown', 0, NULL, NULL,
    'fixture', 'fictional-profile', 'Liste opérationnelle volontairement inconnue.',
    '2026-08-01T09:00:00.000Z', 'demo-operator', NULL, NULL
  ),
  (
    'demo-criterion-budget-001', 'demo-search-retirement-001',
    'demo-scenario-preferred-001', 'budget', 'set',
    '{"min_minor":20000000,"max_minor":23000000,"currency":"EUR"}',
    'essential', 'low', 'confirmed', 'hard', 0, NULL, NULL,
    'fixture', 'fictional-profile', NULL, '2026-08-01T09:00:00.000Z', 'demo-operator', NULL, NULL
  ),
  (
    'demo-criterion-surface-ideal-001', 'demo-search-retirement-001',
    'demo-scenario-preferred-001', 'surface', 'set', '{"min":80,"max":100,"unit":"sqm"}',
    'important', 'medium', 'confirmed', 'soft', 0, NULL, NULL,
    'fixture', 'fictional-profile', 'Cible idéale conservée.',
    '2026-08-01T09:00:00.000Z', 'demo-operator', NULL, NULL
  ),
  (
    'demo-criterion-surface-observed-001', 'demo-search-retirement-001',
    'demo-scenario-conditional-001', 'surface', 'set', '{"min":72,"unit":"sqm"}',
    'important', 'medium', 'observed', 'soft', 0, NULL, NULL,
    'observation', 'fictional-observation', 'Observation fictive avant validation humaine.',
    '2026-08-15T10:00:00.000Z', 'demo-operator', NULL, NULL
  ),
  (
    'demo-criterion-surface-confirmed-001', 'demo-search-retirement-001',
    'demo-scenario-conditional-001', 'surface', 'revise', '{"min":70,"unit":"sqm"}',
    'important', 'medium', 'confirmed', 'soft', 0, NULL, NULL,
    'manual', 'fictional-human-review', 'Exception conditionnelle confirmée sans effacer l’idéal.',
    '2026-08-16T09:00:00.000Z', 'demo-operator',
    'demo-criterion-surface-observed-001', 'demo-decision-surface-001'
  ),
  (
    'demo-criterion-layout-001', 'demo-search-retirement-001',
    'demo-scenario-conditional-001', 'layout', 'set', '{"requirement":"excellent","definition":null}',
    'important', 'unknown', 'to_confirm', 'context', 0, NULL, NULL,
    'fixture', 'fictional-profile', 'La définition d’un excellent agencement reste à confirmer.',
    '2026-08-16T09:00:00.000Z', 'demo-operator', NULL, NULL
  ),
  (
    'demo-criterion-dpe-001', 'demo-search-retirement-001',
    'demo-scenario-preferred-001', 'energy_rating', 'set', '{"excluded":["F","G"]}',
    'essential', 'none', 'confirmed', 'hard', 1, 'demo-operator', '2026-08-01T09:00:00.000Z',
    'fixture', 'fictional-profile', 'Contrainte dure explicitement validée dans ce cas fictif.',
    '2026-08-01T09:00:00.000Z', 'demo-operator', NULL, NULL
  ),
  (
    'demo-criterion-works-001', 'demo-search-retirement-001',
    'demo-scenario-preferred-001', 'works', 'set',
    '{"accepted":"targeted_if_global_cost_coherent","scope":null}',
    'important', 'medium', 'confirmed', 'soft', 0, NULL, NULL,
    'fixture', 'fictional-profile', 'Le périmètre précis des travaux reste à confirmer.',
    '2026-08-01T09:00:00.000Z', 'demo-operator', NULL, NULL
  );

INSERT INTO interaction (
  id, project_id, tim_agreement_id, type, direction, summary, outcome,
  promised_action, promised_due_at, source_kind, source_ref, occurred_at, actor_id
) VALUES
  (
    'demo-interaction-buyer-call-001', 'demo-project-buyer-001', NULL,
    'call', 'outgoing', 'Appel fictif de qualification de la recherche.',
    'Les scénarios sont clarifiés ; certaines communes restent à confirmer.',
    'Envoyer une synthèse fictive puis reprendre contact.',
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+1 day'),
    'fixture', 'fictional-call', '2026-08-15T10:00:00.000Z', 'demo-operator'
  ),
  (
    'demo-interaction-seller-call-001', 'demo-project-seller-001', NULL,
    'call', 'incoming', 'Premier échange fictif sur un projet vendeur sans adresse exacte.',
    'Qualification à poursuivre.', NULL, NULL, 'fixture', 'fictional-call',
    '2026-08-14T16:00:00.000Z', 'demo-operator'
  );

INSERT INTO task (
  id, project_id, tim_agreement_id, title, status, priority, due_at,
  is_next_action, promised_from_interaction_id, created_by_actor_id
) VALUES
  (
    'demo-task-buyer-next-001', 'demo-project-buyer-001', NULL,
    'Confirmer les communes et le calendrier fictifs', 'open', 'high',
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+4 hours'), 1,
    'demo-interaction-buyer-call-001', 'demo-operator'
  ),
  (
    'demo-task-buyer-overdue-001', 'demo-project-buyer-001', NULL,
    'Relire la synthèse de recherche fictive', 'open', 'normal',
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day'), 0,
    NULL, 'demo-operator'
  ),
  (
    'demo-task-seller-next-001', 'demo-project-seller-001', NULL,
    'Planifier l’entretien fictif de qualification vendeur', 'open', 'normal',
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+2 days'), 1,
    NULL, 'demo-operator'
  );

INSERT INTO advisor_profile (
  id, display_name, network, is_current_operator, status
) VALUES
  ('demo-advisor-operator-001', 'Opérateur LEVOIS — démonstration', 'SAFTI', 1, 'active'),
  ('demo-advisor-alpha-001', 'Conseillère Démo Alpha', 'SAFTI', 0, 'active');

INSERT INTO tim_agreement (
  id, internal_reference, label, agreement_type, transaction_type, information_nature,
  subject_person_id, subject_label, current_agreement_status, current_operation_status,
  information_transmitted_at, formalized_at, form_signed_at, notes, created_at, updated_at, version
) VALUES
  (
    'demo-tim-sale-001', 'TIM-DEMO-VENTE-001', 'Accord TIM vente entièrement fictif',
    'information_referral_20_80', 'sale', 'seller', 'demo-person-tim-subject-001',
    'Bien fictif dans le bassin chartrain — aucune adresse', 'to_formalize',
    'information_transmitted', '2026-08-05T09:00:00.000Z', '2026-08-06T09:00:00.000Z',
    '2026-08-06T09:00:00.000Z', 'Démonstration locale ; aucun accord réel.',
    '2026-08-05T09:00:00.000Z', '2026-08-12T09:00:00.000Z', 1
  ),
  (
    'demo-tim-rental-001', 'TIM-DEMO-LOCATION-001', 'Accord TIM location entièrement fictif',
    'custom', 'rental', 'landlord', NULL,
    'Projet locatif fictif — aucune adresse', 'to_formalize', 'information_transmitted',
    '2026-08-10T09:00:00.000Z', NULL, NULL,
    'Répartition et fait générateur volontairement laissés à confirmer.',
    '2026-08-10T09:00:00.000Z', '2026-08-10T09:00:00.000Z', 1
  );

INSERT INTO tim_agreement_party (
  id, tim_agreement_id, advisor_profile_id, role, responsibility_text, active_from
) VALUES
  (
    'demo-tim-sale-party-referrer-001', 'demo-tim-sale-001', 'demo-advisor-operator-001',
    'referrer', 'Transmission fictive d’une information qualifiée.', '2026-08-05T09:00:00.000Z'
  ),
  (
    'demo-tim-sale-party-handler-001', 'demo-tim-sale-001', 'demo-advisor-alpha-001',
    'handling_advisor', 'Traitement fictif de l’opération et de la relation.', '2026-08-05T09:00:00.000Z'
  ),
  (
    'demo-tim-rental-party-referrer-001', 'demo-tim-rental-001', 'demo-advisor-operator-001',
    'referrer', 'Transmission fictive d’une information locative.', '2026-08-10T09:00:00.000Z'
  ),
  (
    'demo-tim-rental-party-handler-001', 'demo-tim-rental-001', 'demo-advisor-alpha-001',
    'handling_advisor', 'Qualification fictive des conditions locatives.', '2026-08-10T09:00:00.000Z'
  );

INSERT INTO tim_agreement_terms (
  id, tim_agreement_id, version_number, agreement_type, transaction_type,
  fee_basis, currency_code, calculation_method, payment_trigger_code,
  conditions_text, change_reason, is_current, confirmed_at, confirmed_by_actor_id,
  allocations_confirmed_at, allocations_confirmed_by_actor_id,
  effective_at, created_at, created_by_actor_id
) VALUES
  (
    'demo-tim-sale-terms-v1', 'demo-tim-sale-001', 1,
    'information_referral_20_80', 'sale', 'ht', 'EUR', 'percentage', 'funds_received',
    'Conditions fictives confirmées uniquement pour démontrer la version vente.',
    'Création de la version fictive.', 1,
    '2026-08-06T09:00:00.000Z', 'demo-operator',
    '2026-08-06T09:00:00.000Z', 'demo-operator',
    '2026-08-06T09:00:00.000Z', '2026-08-06T09:00:00.000Z', 'demo-operator'
  ),
  (
    'demo-tim-rental-terms-v1', 'demo-tim-rental-001', 1,
    'custom', 'rental', 'unknown', 'EUR', 'unknown', 'unknown',
    'À renseigner manuellement : aucune règle 20/80 appliquée à cette location fictive.',
    'Brouillon fictif non confirmé.', 1,
    NULL, NULL, NULL, NULL,
    '2026-08-10T09:00:00.000Z', '2026-08-10T09:00:00.000Z', 'demo-operator'
  );

-- Explicitly confirmed sale allocations. No allocation row exists for the rental fixture.
INSERT INTO tim_agreement_allocation (
  id, tim_agreement_terms_id, tim_agreement_party_id, share_basis_points, created_by_actor_id
) VALUES
  (
    'demo-tim-sale-allocation-referrer-001', 'demo-tim-sale-terms-v1',
    'demo-tim-sale-party-referrer-001', 2000, 'demo-operator'
  ),
  (
    'demo-tim-sale-allocation-handler-001', 'demo-tim-sale-terms-v1',
    'demo-tim-sale-party-handler-001', 8000, 'demo-operator'
  );

INSERT INTO tim_compensation (
  id, tim_agreement_id, beneficiary_party_id, tim_agreement_terms_id,
  is_current, current_compensation_status, estimated_total_fees_minor,
  estimated_share_minor, amount_due_minor, amount_paid_minor, currency_code,
  expected_payment_at, calculation_note, created_at, updated_at,
  created_by_actor_id, version
) VALUES
  (
    'demo-tim-sale-comp-001', 'demo-tim-sale-001',
    'demo-tim-sale-party-referrer-001', 'demo-tim-sale-terms-v1',
    1, 'estimated', 1000000, 200000, 0, 0, 'EUR', NULL,
    'Montants purement fictifs pour démontrer la distinction estimé / dû / payé.',
    '2026-08-07T09:00:00.000Z', '2026-08-07T09:00:00.000Z', 'demo-operator', 1
  ),
  (
    'demo-tim-rental-comp-001', 'demo-tim-rental-001',
    'demo-tim-rental-party-referrer-001', 'demo-tim-rental-terms-v1',
    1, 'to_verify', 0, 0, 0, 0, 'EUR', NULL,
    'Aucune rémunération inventée : allocation et fait générateur restent à confirmer.',
    '2026-08-10T09:00:00.000Z', '2026-08-10T09:00:00.000Z', 'demo-operator', 1
  );

INSERT INTO tim_status_event (
  id, tim_agreement_id, tim_compensation_id, state_axis, from_state, to_state,
  source_kind, source_ref, reason, effective_at, actor_id
) VALUES
  (
    'demo-tim-sale-status-agreement-001', 'demo-tim-sale-001', NULL,
    'agreement', 'to_formalize', 'signed', 'fixture', 'fictional-agreement',
    'Signature fictive enregistrée indépendamment des autres axes.',
    '2026-08-06T09:00:00.000Z', 'demo-operator'
  ),
  (
    'demo-tim-sale-status-operation-001', 'demo-tim-sale-001', NULL,
    'operation', 'information_transmitted', 'marketing_or_search_active',
    'fixture', 'fictional-operation',
    'Progression fictive de l’opération, sans rendre automatiquement la rémunération due.',
    '2026-08-12T09:00:00.000Z', 'demo-operator'
  ),
  (
    'demo-tim-sale-status-compensation-001', 'demo-tim-sale-001',
    'demo-tim-sale-comp-001', 'compensation', 'not_due', 'estimated',
    'fixture', 'fictional-estimate', 'Estimation fictive, aucune somme due.',
    '2026-08-07T09:00:00.000Z', 'demo-operator'
  ),
  (
    'demo-tim-rental-status-compensation-001', 'demo-tim-rental-001',
    'demo-tim-rental-comp-001', 'compensation', 'not_due', 'to_verify',
    'fixture', 'fictional-rental-review',
    'La rémunération de location doit être définie manuellement.',
    '2026-08-10T09:00:00.000Z', 'demo-operator'
  );

UPDATE tim_agreement
SET current_agreement_status = 'signed',
    current_operation_status = 'marketing_or_search_active',
    updated_at = '2026-08-12T09:00:00.000Z',
    version = version + 1
WHERE id = 'demo-tim-sale-001';

INSERT INTO interaction (
  id, project_id, tim_agreement_id, type, direction, summary, outcome,
  source_kind, source_ref, occurred_at, actor_id
) VALUES (
  'demo-interaction-tim-sale-001', NULL, 'demo-tim-sale-001',
  'email', 'outgoing', 'Demande fictive d’avancement adressée à la conseillère de démonstration.',
  'Retour fictif attendu.', 'fixture', 'fictional-email',
  '2026-08-12T09:30:00.000Z', 'demo-operator'
);

INSERT INTO task (
  id, project_id, tim_agreement_id, title, status, priority, due_at,
  is_next_action, created_by_actor_id
) VALUES
  (
    'demo-task-tim-sale-next-001', NULL, 'demo-tim-sale-001',
    'Demander une actualisation fictive de la commercialisation', 'open', 'high',
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+1 day'), 1, 'demo-operator'
  ),
  (
    'demo-task-tim-rental-next-001', NULL, 'demo-tim-rental-001',
    'Confirmer manuellement la répartition et le fait générateur fictifs', 'open', 'urgent',
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+3 days'), 1, 'demo-operator'
  );

INSERT INTO lab_observation (
  id, observation, problem, learning, improvement_proposal, status,
  internal_reference, observed_at, created_by_actor_id
) VALUES (
  'demo-lab-observation-001',
  'Observation fictive : une réponse binaire sur les travaux ne décrit pas le compromis réel.',
  'Le coût global et la valeur finale peuvent compter davantage que la présence de travaux.',
  'Séparer l’acceptation de travaux, leur ampleur et la cohérence économique.',
  'Maintenir un critère travaux structuré et une zone de contexte validée humainement.',
  'to_review', 'LAB-DEMO-001', '2026-08-16T09:00:00.000Z', 'demo-operator'
);

INSERT INTO audit_event (
  id, actor_id, action, target_kind, target_id, result, request_id, metadata_json, occurred_at
) VALUES (
  'demo-audit-fixture-load-001', 'demo-operator', 'load_fictional_preview_fixture',
  'system', NULL, 'success', 'demo-fixture-seed-v1',
  '{"fixture":"cockpit-v1","contains_real_data":false}',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
);
