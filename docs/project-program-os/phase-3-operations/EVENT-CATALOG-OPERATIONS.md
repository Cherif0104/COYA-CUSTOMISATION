# Event Catalog — Operations (mission/activity/evidence/sync)

Objectif: fournir un catalogue contractuel des événements opérationnels publiés via `outbox_events` (serveur) et via outbox locale (client offline).

Contraintes:
- Payload **minimal** (pas de données sensibles).
- **Idempotence obligatoire**: chaque événement porte `event_id` unique (PHASE 1/2).
- Corrélation: `correlation_id` regroupe un flux (ex: “mission-flow”).
- Alignement tables PHASE 1: `outbox_events`, `workflow_events`, `audit_logs` (ou équivalent).

---

## 1) Envelope commun (tous événements)

Champs minimaux (envelope):
- `event_id` (UUID) — idempotence key (unique)
- `event_type` (string)
- `occurred_at` (timestamp serveur si possible; sinon client + `received_at`)
- `organization_id`
- `actor_id` (optionnel pour événements système)
- `correlation_id` (UUID)
- `aggregate_type` (`activity|mission|evidence|incident|sync`)
- `aggregate_id`
- `schema_version` (ex: `"1.0"`)

Conventions:
- `event_type` utilise des namespaces: `mission.*`, `activity.*`, `evidence.*`, `incident.*`, `sync.*`.
- En offline, `occurred_at` = `client_timestamp` et le serveur ajoute `received_at`.

---

## 2) `activity.*` (opérationnel)

### `activity.validation_requested`
Quand: submit activity en gouvernance.
Payload minimal:
- `activity_id`
- `project_id`
- `territory_id`
- `requested_policy_key` (string)

### `activity.validated`
Quand: gouvernance approuve.
Payload minimal:
- `activity_id`
- `approved_policy_key`
- `approval_id` (si exposé)

### `activity.scheduled`
Payload minimal:
- `activity_id`
- `start_date`, `end_date`

### `activity.execution_started`
Payload minimal:
- `activity_id`
- `mission_id` (première mission in_progress)

### `activity.paused`
Payload minimal:
- `activity_id`
- `reason_code` (string)

### `activity.resumed`
Payload minimal:
- `activity_id`

### `activity.completed`
Payload minimal:
- `activity_id`

### `activity.reported`
Payload minimal:
- `activity_id`
- `report_id` (optionnel)

### `activity.archived`
Payload minimal:
- `activity_id`

---

## 3) `mission.*`

### `mission.created`
Payload minimal:
- `mission_id`
- `activity_id`
- `territory_id`

### `mission.validated`
Quand: mission autorisée/validée (après gouvernance si applicable).
Payload minimal:
- `mission_id`
- `approval_id` (optionnel)
- `policy_key` (string)

### `mission.deployed`
Payload minimal:
- `mission_id`
- `deployment_window` (start/end)

### `mission.check_in`
Payload minimal:
- `mission_id`
- `check_in_at` (client_timestamp)
- `geo_point` (optionnel)
- `geo_accuracy_m` (optionnel)

### `mission.check_out`
Payload minimal:
- `mission_id`
- `check_out_at` (client_timestamp)
- `geo_point` (optionnel)

### `mission.completed`
Payload minimal:
- `mission_id`
- `completion_at` (client_timestamp)
- `evidence_count` (int)
- `incident_count` (int)
- `no_evidence_reason` (optionnel)

### `mission.reported`
Payload minimal:
- `mission_id`
- `report_id` (optionnel)

### `mission.archived`
Payload minimal:
- `mission_id`

---

## 4) `evidence.*`

### `evidence.created`
Payload minimal:
- `evidence_id`
- `mission_id`
- `evidence_type`
- `captured_at` (client_timestamp)
- `content_hash` (optionnel si binaire pas encore upload)

### `evidence.upload_started`
Payload minimal:
- `evidence_id`
- `mission_id`
- `size_bytes` (optionnel)

### `evidence.upload_confirmed`
Payload minimal:
- `evidence_id`
- `mission_id`
- `content_hash`
- `document_version_id` (optionnel)

### `evidence.upload_failed`
Payload minimal:
- `evidence_id`
- `mission_id`
- `error_code` (`NETWORK|RLS_DENIED|VALIDATION|CONFLICT|STORAGE`)

---

## 5) `incident.*`

### `incident.created`
Payload minimal:
- `incident_id`
- `mission_id` (optionnel)
- `activity_id` (optionnel)
- `severity`
- `incident_type`

### `incident.severity_escalated`
Payload minimal:
- `incident_id`
- `from_severity`
- `to_severity`

### `incident.declare_critical_requested`
Payload minimal:
- `incident_id`
- `policy_key` (string)

### `incident.status_changed`
Payload minimal:
- `incident_id`
- `from_status`
- `to_status`

---

## 6) `sync.*` (diagnostic, sans données sensibles)

### `sync.replay_started`
Payload minimal:
- `client_id`
- `batch_id`

### `sync.replay_acked`
Payload minimal:
- `batch_id`
- `acked_count`

### `sync.replay_duplicate_ignored`
Payload minimal:
- `event_id`

### `sync.cursor_advanced`
Payload minimal:
- `stream` (`missions|activities|evidence|incidents|governance`)
- `cursor` (string)

### `sync.conflict_detected`
Payload minimal:
- `aggregate_type`
- `aggregate_id`
- `client_version` (string)
- `server_version` (string)

### `sync.conflict_resolved`
Payload minimal:
- `aggregate_type`
- `aggregate_id`
- `strategy` (`server_wins|merge|client_wins|defer`)

### `sync.conflict_rejected`
Payload minimal:
- `aggregate_type`
- `aggregate_id`
- `reason_code` (`INVARIANT|ARCHIVED|RLS_DENIED|VALIDATION`)

### `sync.rls_denied`
Payload minimal:
- `target_type`
- `target_id`
- `action` (string)

---

## 7) Règles d’idempotence (rappel)

- Toute insertion `outbox_events` doit garantir l’unicité `event_id`.
- Les consumers doivent traiter `event_id` comme “exactly-once effect” (au minimum “at-least-once delivery + de-dup”).
- En cas de duplication: retourner ACK et produire (optionnel) `sync.replay_duplicate_ignored` (diagnostic).

