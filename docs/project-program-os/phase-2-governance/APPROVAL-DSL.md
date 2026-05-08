# PHASE 2 — Approval DSL (déclarative)

Objectif: définir une mini-DSL déclarative (YAML-like) décrivant des **policies d’approbation** (conditions, steps, quorum, escalation timers, délégation, override) réutilisable pour l’implémentation (PHASE 7) et testable.

La DSL ci-dessous est un **contrat** (pas un runtime). Elle doit rester stable et versionnable.

---

## 1) Modèle de policy (format)

Format recommandé: YAML (ou JSON équivalent) versionné.

### 1.1 Schéma conceptuel

```yaml
policy_version: "1.0"
policy_key: "<string>"              # identifiant stable: ex "activity.field.validation.v1"
target:
  type: "<programme|project|activity|mission|expense|report|incident>"
  action: "<approve|validate|authorize|close|publish|declare_critical|...>"

conditions:                          # ABAC / contexte
  all:                               # AND
    - op: "<eq|in|gte|lte|between|exists>"
      field: "<amount|territory_id|programme_id|budget_line|severity|partner_id|funder_id|...>"
      value: <scalar|list|range>
  any: []                            # OR (optionnel)
  none: []                           # NOT (optionnel)

constraints:
  separation_of_duties:
    forbid_self_approval: true
  partner_rules:
    requires_partner_signoff: false  # peut être conditionnel dans examples
    mode: "<acknowledge|co_approve>"

delegation:
  enabled: true
  max_validity_days: 30
  scope_fields: ["programme_id", "project_id", "territory_id"]
  enforce_min_approval_limit: true   # délégation ne peut pas augmenter le plafond

override:
  enabled: true
  actors: ["super_admin"]
  require_reason: true
  require_post_review: true
  post_review_policy_key: "<string>" # ex "governance.post_review.break_glass.v1"

steps:
  - step_key: "<string>"
    type: "<role|committee|user_set>"
    assignees:
      roles: ["regional_coordinator"]  # ou committee members
      resolve_by: "<scope>"            # ex: territory_id / programme_id
    quorum:                            # optionnel
      required: 1                      # nombre minimal de votes
      ratio: "1/1"                     # ou "2/3"
    sla:
      due_in: "24h"
      escalation:
        - after: "24h"
          action: "notify"
          channels: ["in_app", "email"]
        - after: "36h"
          action: "reassign"
          to_roles: ["program_director"]
        - after: "48h"
          action: "fallback"
          to_roles: ["super_admin"]
    decision:
      on_reject: "stop"                # stop | continue (rare)
      on_approve: "next"               # next | complete

audit:
  write_audit_log: true
  outbox_events: true
  idempotence_key_field: "event_id"
```

---

## 2) Sémantique d’exécution (contrat)

- Le moteur construit une **ApprovalRequest** à partir de `(policy_key, target, context)`.
- Il résout les assignees (par rôle + scope ABAC).
- Une step est “complete” si quorum atteint (ou 1/1).
- Une step “reject” arrête la policy (sauf `on_reject=continue` explicitement).
- Les timers `sla` déclenchent des actions d’escalade (outbox events + notifications).
- La délégation est évaluée lors de la résolution des assignees.
- L’override force `state=overridden` et déclenche `post_review_policy_key`.
- Toute action (approve/reject/delegate/override/comment/reopen) est idempotente via `event_id`.

---

## 3) Exemples complets

### Exemple A — Validation activité terrain (région + finance)

```yaml
policy_version: "1.0"
policy_key: "activity.field.validation.v1"
target:
  type: "activity"
  action: "validate"

conditions:
  all:
    - { op: "exists", field: "territory_id" }
    - { op: "eq", field: "is_field_activity", value: true }
  any: []
  none: []

constraints:
  separation_of_duties:
    forbid_self_approval: true
  partner_rules:
    requires_partner_signoff: false
    mode: "acknowledge"

delegation:
  enabled: true
  max_validity_days: 30
  scope_fields: ["territory_id", "programme_id", "project_id"]
  enforce_min_approval_limit: true

override:
  enabled: true
  actors: ["super_admin"]
  require_reason: true
  require_post_review: true
  post_review_policy_key: "governance.post_review.break_glass.v1"

steps:
  - step_key: "region_signoff"
    type: "role"
    assignees:
      roles: ["regional_coordinator"]
      resolve_by: "territory_id"
    quorum: { required: 1, ratio: "1/1" }
    sla:
      due_in: "24h"
      escalation:
        - { after: "24h", action: "notify", channels: ["in_app", "email"] }
        - { after: "36h", action: "reassign", to_roles: ["program_director"] }
    decision: { on_reject: "stop", on_approve: "next" }

  - step_key: "finance_signoff"
    type: "role"
    assignees:
      roles: ["finance_officer"]
      resolve_by: "programme_id"
    quorum: { required: 1, ratio: "1/1" }
    sla:
      due_in: "24h"
      escalation:
        - { after: "24h", action: "notify", channels: ["in_app"] }
        - { after: "48h", action: "fallback", to_roles: ["program_director"] }
    decision: { on_reject: "stop", on_approve: "complete" }

audit:
  write_audit_log: true
  outbox_events: true
  idempotence_key_field: "event_id"
```

### Exemple B — Dépense avec seuils (approval_limit) + lignes sensibles

```yaml
policy_version: "1.0"
policy_key: "expense.approval.thresholds.v1"
target:
  type: "expense"
  action: "approve"

conditions:
  all:
    - { op: "exists", field: "budget_line" }
    - { op: "exists", field: "amount" }
  any: []
  none: []

constraints:
  separation_of_duties:
    forbid_self_approval: true
  partner_rules:
    requires_partner_signoff: false
    mode: "acknowledge"

delegation:
  enabled: true
  max_validity_days: 14
  scope_fields: ["programme_id", "project_id"]
  enforce_min_approval_limit: true

override:
  enabled: true
  actors: ["super_admin"]
  require_reason: true
  require_post_review: true
  post_review_policy_key: "governance.post_review.break_glass.v1"

steps:
  - step_key: "finance_primary"
    type: "role"
    assignees:
      roles: ["finance_officer"]
      resolve_by: "programme_id"
    quorum: { required: 1, ratio: "1/1" }
    sla:
      due_in: "24h"
      escalation:
        - { after: "24h", action: "notify", channels: ["in_app", "email"] }
        - { after: "48h", action: "fallback", to_roles: ["program_director"] }
    decision: { on_reject: "stop", on_approve: "next" }

  - step_key: "director_required_over_limit"
    type: "role"
    assignees:
      roles: ["program_director"]
      resolve_by: "programme_id"
    quorum: { required: 1, ratio: "1/1" }
    conditions:
      any:
        - { op: "gte", field: "amount", value: 250001 }      # T1 start (référence)
        - { op: "in", field: "budget_line", value: ["consulting", "procurement", "asset", "cash_advance"] }
    sla:
      due_in: "48h"
      escalation:
        - { after: "48h", action: "fallback", to_roles: ["super_admin"] }
    decision: { on_reject: "stop", on_approve: "next" }

  - step_key: "finance_committee_high_amount"
    type: "committee"
    assignees:
      roles: ["finance_officer", "program_director"]          # pool comité (impl: resolve members)
      resolve_by: "programme_id"
    quorum: { required: 2, ratio: "2/3" }
    conditions:
      any:
        - { op: "gte", field: "amount", value: 2000001 }      # T2 start (référence)
    sla:
      due_in: "5d"
      escalation:
        - { after: "3d", action: "notify", channels: ["in_app", "email"] }
        - { after: "5d", action: "fallback", to_roles: ["super_admin"] }
    decision: { on_reject: "stop", on_approve: "complete" }

audit:
  write_audit_log: true
  outbox_events: true
  idempotence_key_field: "event_id"
```

### Exemple C — Incident critique (severity) + break-glass

```yaml
policy_version: "1.0"
policy_key: "incident.critical.escalation.v1"
target:
  type: "incident"
  action: "declare_critical"

conditions:
  all:
    - { op: "gte", field: "severity", value: "critical" }
    - { op: "exists", field: "territory_id" }
  any: []
  none: []

constraints:
  separation_of_duties:
    forbid_self_approval: false
  partner_rules:
    requires_partner_signoff: false
    mode: "acknowledge"

delegation:
  enabled: true
  max_validity_days: 7
  scope_fields: ["territory_id", "programme_id"]
  enforce_min_approval_limit: true

override:
  enabled: true
  actors: ["super_admin"]
  require_reason: true
  require_post_review: true
  post_review_policy_key: "governance.post_review.break_glass.v1"

steps:
  - step_key: "regional_ack"
    type: "role"
    assignees:
      roles: ["regional_coordinator"]
      resolve_by: "territory_id"
    quorum: { required: 1, ratio: "1/1" }
    sla:
      due_in: "2h"
      escalation:
        - { after: "2h", action: "reassign", to_roles: ["program_director"] }
    decision: { on_reject: "stop", on_approve: "next" }

  - step_key: "director_ack"
    type: "role"
    assignees:
      roles: ["program_director"]
      resolve_by: "programme_id"
    quorum: { required: 1, ratio: "1/1" }
    sla:
      due_in: "4h"
      escalation:
        - { after: "4h", action: "fallback", to_roles: ["super_admin"] }
    decision: { on_reject: "stop", on_approve: "complete" }

audit:
  write_audit_log: true
  outbox_events: true
  idempotence_key_field: "event_id"
```

---

## 4) Notes d’implémentation (PHASE 7)

- Résolution des assignees:
  - `resolve_by=territory_id`: sélectionner membres ayant scope sur ce territoire.
  - `resolve_by=programme_id`: sélectionner owners programme + finance assignés.
- `approval_limit`:
  - s’applique à `finance_officer` (et éventuellement `program_director`) lors de l’exécution.
  - ne doit pas être contournable par délégation.
- Pour Postgres/RLS: prévoir des “read models” (vues) si nécessaire, mais toujours avec policies.

