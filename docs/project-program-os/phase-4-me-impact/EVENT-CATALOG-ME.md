# Event Catalog — M&E (PHASE 4)

## Objet

Ce document définit le **catalogue d’événements M&E** (Monitoring & Evaluation) pour :

- supporter l’**offline-first** (events produits côté client, sync via outbox),
- assurer l’**audit trail** (qui/quand/pourquoi),
- piloter les **projections** (streaming read-models),
- gouverner la **validation** (statuts, approvals),
- tracer la **qualité** (DQ incidents, flags, waivers).

Les événements sont regroupés par domaines :

- `indicator.*` (définition KPI, formule, activation)
- `target.*` (cibles)
- `measurement.*` (mesures)
- `evidence.*` (preuves)
- `dq.*` (qualité & incidents)
- `report_pack.*` (packs bailleurs)

## 1) Envelope (payload minimal commun)

Chaque événement doit être enveloppé dans un format stable (aligné sur l’outbox PHASE 1) :

- **`event_id`** (ULID, obligatoire)
- **`event_type`** (string, obligatoire)
- **`occurred_at`** (ISO-8601, obligatoire, timezone incluse)
- **`producer`** :
  - `actor_id` (user/service)
  - `actor_type` (`user | service`)
  - `device_id` (optionnel, offline)
  - `client_app` (version)
- **`scope`** :
  - `kind` (`program | project | territory | cohort | partner | org_unit`)
  - `ids` (string[])
- **`dedupe_key`** (string, obligatoire en offline)
- **`correlation_id`** (ULID, optionnel)
- **`causation_id`** (ULID, optionnel)
- **`schema_version`** (ex. `1.0`)
- **`payload`** (objet spécifique, obligatoire)

Règles :

- `dedupe_key` stable ⇒ idempotence lors des retries.
- `correlation_id` relie une série d’événements (ex. import).
- `causation_id` pointe l’événement déclencheur.

## 2) Événements `indicator.*`

### 2.1 `indicator.created`

Payload minimal :

- `indicator_id`
- `code`
- `revision`
- `unit`
- `frequency`
- `scopes_allowed[]`
- `disaggregation[]`

### 2.2 `indicator.formula_set`

Payload minimal :

- `indicator_id`
- `revision`
- `formula` (JSON conforme au contrat)

### 2.3 `indicator.activated` / `indicator.deactivated`

Payload minimal :

- `indicator_id`
- `revision`
- `reason` (optionnel)

## 3) Événements `target.*`

### 3.1 `target.created`

Payload minimal :

- `target_id`
- `indicator_id`
- `indicator_revision`
- `period_start`, `period_end`
- `target_value`
- `unit`
- `target_type`
- `assumptions` (optionnel)

### 3.2 `target.approved` / `target.superseded`

Payload minimal :

- `target_id`
- `approved_by` / `superseded_by_target_id`
- `reason` (optionnel)

## 4) Événements `measurement.*`

### 4.1 `measurement.created` (offline-friendly)

Payload minimal :

- `measurement_id` (ULID, client-side possible)
- `client_idempotency_key` (obligatoire)
- `indicator_id`
- `indicator_revision`
- `value`
- `unit`
- `time` : `as_of` OU `{ start_at, end_at }`
- `dimensions` (objet) — peut être vide
- `source`
- `method_version` (optionnel)
- `evidence_refs[]` (optionnel)
- `status` = `draft`

### 4.2 `measurement.updated`

Payload minimal :

- `measurement_id`
- `patch` (RFC6902 ou équivalent) OU champs modifiés
- `reason_code` (optionnel)

### 4.3 `measurement.submitted`

Payload minimal :

- `measurement_id`
- `submitted_by`

### 4.4 `measurement.validated`

Payload minimal :

- `measurement_id`
- `validated_by`
- `validation_notes` (optionnel)

### 4.5 `measurement.rejected`

Payload minimal :

- `measurement_id`
- `rejected_by`
- `reasons[]` (codes DQ)

### 4.6 `measurement.corrected` (audit)

Payload minimal :

- `measurement_id` (nouvelle version ou même id selon stratégie)
- `previous_measurement_id`
- `correction_reason`
- `evidence_refs[]` (optionnel)

### 4.7 `measurement.computed` (résultat moteur)

Payload minimal :

- `measurement_id`
- `indicator_id`
- `indicator_revision`
- `value`
- `unit`
- `window`
- `group_by[]`
- `dimensions`
- `computed_by` = `formula_engine|aggregation_engine`
- `run_id`
- `input_fingerprint`

## 5) Événements `evidence.*`

### 5.1 `evidence.item_created`

Payload minimal :

- `evidence_id`
- `evidence_type`
- `title`
- `uri` (ou storage ref)
- `hash` (optionnel)
- `captured_at`
- `tags[]` (optionnel)

### 5.2 `evidence.attached`

Payload minimal :

- `evidence_id`
- `entity_type` (`measurement|target|report_pack|indicator`)
- `entity_id`
- `attachment_role` (ex. `source_doc`, `audit_proof`, `waiver`)

## 6) Événements `dq.*`

### 6.1 `dq.validation_failed`

Payload minimal :

- `entity_type` (`measurement|target|pack`)
- `entity_id`
- `rules_failed[]` (codes)
- `severity`

### 6.2 `dq.flagged_outlier`

Payload minimal :

- `measurement_id`
- `rule` (ex. `B3_STDDEV`)
- `observed_value`
- `expected_range` (optionnel)
- `severity`

### 6.3 `dq.incident_opened`

Payload minimal :

- `incident_id`
- `category`
- `severity`
- `status` = `open`
- `window`
- `indicator_code` (optionnel)
- `impacted_measurement_ids[]` (optionnel)
- `owner_id`

### 6.4 `dq.incident_resolved` / `dq.incident_waived`

Payload minimal :

- `incident_id`
- `resolved_by` / `waived_by`
- `resolution_notes` / `waiver_reason`
- `evidence_refs[]` (optionnel)

### 6.5 `dq.duplicate_detected` / `dq.sync_conflict`

Payload minimal :

- `entity_type`
- `entity_ids[]`
- `dedupe_key` / `conflict_key`
- `resolution` (optionnel)

## 7) Événements `report_pack.*`

### 7.1 `report_pack.created`

Payload minimal :

- `pack_id`
- `pack_code`
- `donor_id`
- `period_start`, `period_end`
- `kpi_set[]` (code + revision)

### 7.2 `report_pack.preview_generated`

Payload minimal :

- `pack_id`
- `run_id`
- `artifact_refs[]` (exports)
- `warnings[]` (DQ, coverage)

### 7.3 `report_pack.approved` / `report_pack.frozen` / `report_pack.published`

Payload minimal :

- `pack_id`
- `approved_by` / `frozen_by` / `published_by`
- `run_id` (obligatoire pour frozen/published)
- `snapshot_ref` (obligatoire pour frozen)
- `signatures[]` (optionnel)

## 8) Invariants (event-driven)

- **E1 — Immutable** : un événement ne se modifie pas; corrections = nouveaux événements.
- **E2 — Idempotent** : `event_id` + `dedupe_key` assurent replay safe.
- **E3 — Scope-aware** : tout événement utile à l’agrégation porte `scope`.
- **E4 — Evidence-linkable** : `evidence.attached` relie les preuves aux entités.
- **E5 — Governance gates** : les transitions `approved/frozen/published` sont pilotées par événements et bloquées par DQ incidents critiques.

## Acceptance Criteria (mini)

- **AC1** : L’envelope minimal (event_id, type, occurred_at, producer, scope, dedupe_key, schema_version, payload) est défini.
- **AC2** : Les événements couvrent `indicator.*`, `measurement.*`, `target.*`, `dq.*`, `evidence.*`, `report_pack.*`.
- **AC3** : Les payloads incluent les champs nécessaires à offline-first (dedupe_key, idempotency_key) et audit (run_id, input_fingerprint, evidence refs).
- **AC4** : Les invariants event-driven (immutabilité, idempotence, gates gouvernance) sont explicités.
