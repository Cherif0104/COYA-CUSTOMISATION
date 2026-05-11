# PHASE 5 — AI Contracts (Entrées/Sorties) — contractuel

Objectif: définir des **contrats stricts** (inputs/outputs) pour les capabilities AI Ops. Ces contrats sont conçus pour:
- **human-in-the-loop** (pas d’auto-approval),
- **citations internes obligatoires**,
- **audit et reproductibilité** (`run_id`, `event_id`, `correlation_id`),
- **séparation multi-tenant** (`organization_id`),
- **compatibilité offline / deferred AI** (données potentiellement “stale”).

> Note: les schémas ci-dessous sont des **schemas JSON/pseudo** destinés au build (PHASE 7). Ils ne supposent aucune techno LLM spécifique.

---

## 0) Conventions (communes)

### 0.1 Identifiants & idempotence
- `event_id` (UUID): clé d’idempotence d’une demande (ex: “générer le rapport X pour la période Y”).
- `correlation_id` (UUID): regroupe une séquence (ex: incident → synthèse → recommandations → pack).
- `run_id` (UUID/ULID): identifiant d’exécution AI (audit/replay).

### 0.2 Multi-tenant & scope
Tout contrat inclut:
- `organization_id` (obligatoire)
- un **scope**: `programme_id`, `project_id`, `territory_id`, `partner_id`, et fenêtre temporelle.

### 0.3 Citations (format canonique)
Une citation pointe vers une source interne stable:

```json
{
  "citation_id": "c1",
  "source_type": "document_version|evidence_item|measurement|audit_log|outbox_event|governance_decision|kpi_definition|aggregation_run",
  "source_id": "uuid",
  "source_locator": {
    "page": 12,
    "section": "3.2",
    "quote": "extrait court optionnel"
  },
  "retrieved_at": "ISO-8601",
  "confidence": 0.0
}
```

Règles:
- Toute assertion factuelle/chiffrée doit référencer ≥ 1 citation.
- Les citations doivent respecter l’isolation (même `organization_id`).

### 0.4 Structure d’output “safe”
Chaque output doit inclure:
- `status`: `ok|needs_more_evidence|refused_by_policy|stale_data_warning`
- `safety`: décisions de policies appliquées (ex: “no_write_actions”)
- `freshness`: niveau de fraîcheur (sources et âge)

---

## 1) Capability: `generate_report`

### 1.1 Input schema (pseudo)

```json
{
  "capability": "generate_report",
  "schema_version": "v1",
  "event_id": "uuid",
  "correlation_id": "uuid",

  "organization_id": "uuid",
  "scope": {
    "programme_id": "uuid|null",
    "project_id": "uuid|null",
    "territory_id": "uuid|null",
    "partner_id": "uuid|null"
  },

  "period": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD", "timezone": "Africa/Abidjan" },
  "report_type": "donor_pack|programme_summary|project_status|incident_report|me_quarterly",
  "language": "fr",

  "audience": { "kind": "internal|donor|partner", "funder_id": "uuid|null" },
  "constraints": {
    "require_citations": true,
    "min_citations_per_section": 2,
    "allow_estimates": false,
    "offline_mode": "deferred|local_templates_only|online"
  },

  "source_refs": {
    "kpi_set_id": "uuid|null",
    "aggregation_run_id": "uuid|null",
    "measurement_ids": ["uuid"],
    "document_version_ids": ["uuid"],
    "evidence_item_ids": ["uuid"],
    "governance_decision_ids": ["uuid"]
  },

  "requested_sections": ["executive_summary", "kpis", "activities", "risks", "compliance", "annexes"],
  "output_format": "markdown|docx_placeholder|json"
}
```

### 1.2 Required fields
- `event_id`, `organization_id`, `period`, `report_type`, `constraints.require_citations=true`
- Au moins une source de vérité: `aggregation_run_id` **ou** `measurement_ids` **ou** `document_version_ids`

### 1.3 Output schema (pseudo)

```json
{
  "capability": "generate_report",
  "schema_version": "v1",
  "run_id": "uuid",
  "event_id": "uuid",
  "correlation_id": "uuid",
  "organization_id": "uuid",

  "status": "ok|needs_more_evidence|refused_by_policy|stale_data_warning",
  "freshness": {
    "as_of": "ISO-8601",
    "max_source_age_seconds": 0,
    "stale_sources": [{ "source_type": "measurement", "source_id": "uuid", "age_seconds": 0 }]
  },
  "safety": {
    "human_approval_required": true,
    "no_irreversible_actions": true,
    "policy_decisions": [{ "policy": "citations_required", "decision": "allow|block", "reason": "..." }]
  },

  "report": {
    "title": "string",
    "sections": [
      {
        "section_key": "executive_summary",
        "content_md": "string",
        "citations": ["c1", "c2"],
        "claims": [
          { "claim_id": "cl1", "text": "assertion", "citation_ids": ["c1"], "claim_type": "fact|number|policy" }
        ]
      }
    ],
    "annexes": [{ "kind": "table|timeline|list", "content_md": "string", "citations": ["c3"] }]
  },

  "citations": [/* canonical citations */],
  "next_actions": [
    { "action": "request_approval", "target_type": "report_draft", "reason": "Publication requires governance approval" }
  ]
}
```

### 1.4 Citations (exigences)
- Section `kpis`: citations vers `aggregation_run_id` et/ou `measurement_id` + `indicator`/definition.
- Section `compliance`: citations vers `APPROVAL-DSL` / policies / décisions gouvernance.
- Annexe “evidence pack”: citations vers `evidence_item_id` / `document_version_id`.

---

## 2) Capability: `detect_anomalies`

### 2.1 Input schema (pseudo)

```json
{
  "capability": "detect_anomalies",
  "schema_version": "v1",
  "event_id": "uuid",
  "correlation_id": "uuid",

  "organization_id": "uuid",
  "scope": { "programme_id": "uuid|null", "project_id": "uuid|null", "territory_id": "uuid|null" },
  "period": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },

  "signal_space": ["kpi", "budget", "evidence", "sync", "governance"],
  "thresholds": {
    "severity_min": "low|medium|high|critical",
    "max_missing_evidence_ratio": 0.0,
    "kpi_outlier_z": 0.0
  },

  "source_refs": {
    "aggregation_run_id": "uuid|null",
    "measurement_ids": ["uuid"],
    "audit_log_ids": ["uuid"],
    "outbox_event_ids": ["uuid"],
    "evidence_item_ids": ["uuid"]
  },

  "constraints": { "require_explanations": true, "require_citations": true, "offline_mode": "deferred|online" }
}
```

### 2.2 Output schema (pseudo)

```json
{
  "capability": "detect_anomalies",
  "schema_version": "v1",
  "run_id": "uuid",
  "event_id": "uuid",
  "organization_id": "uuid",

  "status": "ok|stale_data_warning|refused_by_policy",
  "anomalies": [
    {
      "anomaly_id": "a1",
      "severity": "low|medium|high|critical",
      "category": "kpi_outlier|missing_evidence|budget_drift|sync_conflict|governance_gap",
      "title": "string",
      "explanation": "string",
      "impact": "string",
      "affected_scope": { "programme_id": "uuid|null", "project_id": "uuid|null", "territory_id": "uuid|null" },
      "evidence": {
        "citation_ids": ["c1", "c2"],
        "related_entities": [{ "entity_type": "measurement|mission|expense|approval", "entity_id": "uuid" }]
      },
      "recommended_next_steps": [
        { "action": "request_missing_evidence", "owner_role": "field_ops", "priority": "P1|P2|P3" }
      ]
    }
  ],

  "citations": [/* canonical citations */]
}
```

---

## 3) Capability: `recommend_actions`

### 3.1 Input schema (pseudo)

```json
{
  "capability": "recommend_actions",
  "schema_version": "v1",
  "event_id": "uuid",
  "correlation_id": "uuid",

  "organization_id": "uuid",
  "context": {
    "anomaly_ids": ["a1"],
    "incident_id": "uuid|null",
    "programme_id": "uuid|null",
    "project_id": "uuid|null",
    "territory_id": "uuid|null"
  },

  "constraints": {
    "no_write_actions": true,
    "require_citations": true,
    "require_human_decision": true,
    "offline_mode": "deferred|online"
  },

  "source_refs": {
    "audit_log_ids": ["uuid"],
    "governance_decision_ids": ["uuid"],
    "document_version_ids": ["uuid"],
    "evidence_item_ids": ["uuid"]
  }
}
```

### 3.2 Output schema (pseudo)

```json
{
  "capability": "recommend_actions",
  "schema_version": "v1",
  "run_id": "uuid",
  "event_id": "uuid",
  "organization_id": "uuid",

  "status": "ok|needs_more_evidence|refused_by_policy",
  "recommendations": [
    {
      "recommendation_id": "r1",
      "priority": "P0|P1|P2|P3",
      "action_type": "open_task|request_approval|request_evidence|run_data_quality_checks|escalate",
      "title": "string",
      "rationale": "string",
      "human_decision_required": true,
      "risks": ["string"],
      "citations": ["c1", "c2"],
      "suggested_owner_roles": ["programme_manager", "me_officer", "auditor"]
    }
  ],
  "citations": [/* canonical citations */]
}
```

---

## 4) Capability: `summarize_incident`

### 4.1 Input schema (pseudo)

```json
{
  "capability": "summarize_incident",
  "schema_version": "v1",
  "event_id": "uuid",
  "correlation_id": "uuid",

  "organization_id": "uuid",
  "incident_id": "uuid",
  "constraints": {
    "require_citations": true,
    "pii_redaction": "strict",
    "offline_mode": "deferred|online"
  },

  "source_refs": {
    "evidence_item_ids": ["uuid"],
    "document_version_ids": ["uuid"],
    "audit_log_ids": ["uuid"],
    "outbox_event_ids": ["uuid"]
  },

  "output_format": "markdown|json"
}
```

### 4.2 Output schema (pseudo)

```json
{
  "capability": "summarize_incident",
  "schema_version": "v1",
  "run_id": "uuid",
  "event_id": "uuid",
  "organization_id": "uuid",

  "status": "ok|needs_more_evidence|stale_data_warning|refused_by_policy",
  "summary": {
    "headline": "string",
    "timeline": [{ "when": "ISO-8601|YYYY-MM-DD", "what": "string", "citations": ["c1"] }],
    "current_status": "string",
    "impact_assessment": "string",
    "actions_taken": ["string"],
    "open_questions": ["string"]
  },
  "citations": [/* canonical citations */],
  "pii": { "redactions_applied": true, "redaction_notes": ["string"] }
}
```

---

## 5) Capability: `donor_pack_assistant`

Assistant spécialisé pour assembler un **pack bailleur** (PHASE 4) avec exigences:
- narration + chiffres “gelés” (`aggregation_run_id` / snapshot),
- annexes evidence (preuves),
- conformité (statuts, validations, désagrégations),
- **sans publication automatique** (soumis à approvals).

### 5.1 Input schema (pseudo)

```json
{
  "capability": "donor_pack_assistant",
  "schema_version": "v1",
  "event_id": "uuid",
  "correlation_id": "uuid",

  "organization_id": "uuid",
  "funder_id": "uuid",
  "programme_id": "uuid",
  "period": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },

  "constraints": {
    "require_citations": true,
    "require_frozen_numbers": true,
    "min_disaggregation_completeness": 0.95,
    "offline_mode": "deferred|online"
  },

  "source_refs": {
    "donor_template_id": "string|uuid",
    "aggregation_run_id": "uuid",
    "kpi_definition_ids": ["uuid"],
    "evidence_item_ids": ["uuid"],
    "document_version_ids": ["uuid"],
    "governance_decision_ids": ["uuid"]
  },

  "output_format": "markdown|json"
}
```

### 5.2 Output schema (pseudo)

```json
{
  "capability": "donor_pack_assistant",
  "schema_version": "v1",
  "run_id": "uuid",
  "event_id": "uuid",
  "organization_id": "uuid",

  "status": "ok|needs_more_evidence|refused_by_policy|stale_data_warning",
  "pack": {
    "cover": { "title": "string", "period": "string", "programme": "string", "funder": "string" },
    "executive_summary_md": "string",
    "kpi_tables_md": "string",
    "activities_md": "string",
    "risks_md": "string",
    "compliance_md": "string",
    "annex_evidence_index_md": "string"
  },
  "citations": [/* canonical citations */],
  "gating": {
    "requires_governance_approval": true,
    "approval_policy_key": "string",
    "blockers": [
      { "kind": "missing_citations|numbers_not_frozen|low_disaggregation_completeness|stale_data", "detail": "string" }
    ]
  },
  "next_actions": [
    { "action": "request_approval", "target_type": "donor_pack_draft", "reason": "Publication requires approval chain" }
  ]
}
```

---

## 6) Codes d’erreur (contractuels)

Les capabilities peuvent retourner (dans `status` ou un champ `errors[]` si besoin):
- `REFUSED_POLICY`: bloqué par guardrails (ex: citations insuffisantes, scope invalide, tentative action irréversible).
- `STALE_DATA`: données trop anciennes (sync en retard / snapshot manquant).
- `INSUFFICIENT_EVIDENCE`: références sources absentes ou insuffisantes.
- `TENANT_SCOPE_VIOLATION`: tentative d’accès hors `organization_id` (doit être traité comme incident sécurité).

