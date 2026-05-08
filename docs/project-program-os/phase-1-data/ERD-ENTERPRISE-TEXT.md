# PHASE 1 — Data Architecture

Objectif: établir une **base relationnelle** robuste (PostgreSQL) compatible:
- multi-tenant (isolation par `organization_id` + RLS),
- territorialisation (arbre + scopes),
- auditabilité (audit trail + versioning documents),
- workflows (instances + événements),
- event-driven (outbox + catalogue events),
- offline-first (idempotence + versioning + “sync cursors”).

---

## 1) ERD (texte) — agrégats & relations

### 1.1 Agrégat Programme
- `programs` (1) → `projects` (n)
- `programs` (m) ↔ `partners` (m) via `program_partners`
- `programs` (m) ↔ `territories` (m) via `program_territories`
- `programs` (1) → `budgets` (n) (budget annuel / tranche / bailleur)
- `programs` (1) → `workflows_instances` (n) (workflow “programme”)
- `programs` (1) → `entity_documents` (n) → `documents` (n)
- `programs` (1) → `audit_logs` (n)

### 1.2 Agrégat Projet
- `projects` (1) → `project_components` (n) (optionnel)
- `projects` (1) → `activities` (n)
- `projects` (m) ↔ `partners` (m) via `project_partners`
- `projects` (m) ↔ `territories` (m) via `project_territories`
- `projects` (1) → `budgets` (n)
- `projects` (1) → `workflows_instances` (n) (workflow “projet”)
- `projects` (1) → `entity_documents` (n)

### 1.3 Agrégat Activité / Mission (terrain)
- `activities` (1) → `missions` (n)
- `activities` (1) → `workflows_instances` (n) (workflow “activité”)
- `missions` (1) → `mission_team_members` (n)
- `missions` (1) → `expenses` (n)
- `missions` (1) → `incidents` (n)
- `missions` (1) → `evidence_items` (n)
- `missions` (1) → `entity_documents` (n)

### 1.4 Territoires (arbre)
- `territories` (1) → `territories` (n) via `parent_id`
- `devices` (n) → `territories` (1)
- Les scopes ABAC référencent `territories` via tables de “grants” (phase 2)

### 1.5 Documents & versioning
- `documents` (1) → `document_versions` (n)
- `entity_documents` lie (polymorphe) une version de doc à une entité (programme/projet/activité/mission/dépense/incident)
- `document_versions` peut porter: hash, signature, stockage (S3/MinIO/Supabase Storage)

### 1.6 M&E (natif)
- `indicators` (1) → `indicator_targets` (n)
- `indicators` (1) → `indicator_measurements` (n)
- `indicator_targets` peut être “scopé” par territoire / cohorte / période
- `indicator_measurements` référence potentiellement `evidence_items`

### 1.7 Workflows / Audit / Outbox
- `workflow_definitions` (1) → `workflow_states` (n)
- `workflow_definitions` (1) → `workflow_transitions` (n)
- `workflow_instances` (1) → `workflow_events` (n)
- `audit_logs` référence une entité “target” (type + id) + “actor”
- `outbox_events` enregistre les événements domaine à publier (idempotent)

---

## 2) Politiques structurantes (contrats)

### 2.1 Tenant isolation
- `organization_id` obligatoire sur toutes les entités transactionnelles
- RLS: `organization_id = current_org()`

### 2.2 Soft delete & archivage
- Soft delete: `deleted_at` + `deleted_by` (conservation audit)
- Archivage: `archived_at` + `archived_by` (lecture permise, écriture bloquée par workflow/policy)

### 2.3 Event strategy (pragmatique)
- **Source of truth** = tables transactionnelles
- **Event sourcing** = “light”: outbox + immutable event log pour audit/trace + projections read-model
- Idempotence: `outbox_events.event_id` unique + `workflow_events.event_id` unique

### 2.4 Document immutability
- `document_versions` immuables; un document “final” = version verrouillée (WORM recommandé)

---

## 3) Livrables associés (dans ce dossier)

- `POSTGRES-SCHEMA-DRAFT.sql`
- `RLS-POLICIES-DRAFT.sql`
- `MIGRATION-STRATEGY.md`

