# COYA — Project & Program OS — Executive Summary

Ce document clôture le programme “Project & Program OS” en reliant:
- **PHASES 1–6**: spécifications contractuelles (Canonical Spec)
- **PHASE 7**: backlog d’exécution (Build Execution Pack) + gates + DoD

## 1) Canonical Spec (référence unique)

La Canonical Spec est composée des artefacts suivants (à implémenter sans ambiguïté):

### PHASE 1 — Data / RLS / Migration
- `phase-1-data/MIGRATION-STRATEGY.md`
- `phase-1-data/POSTGRES-SCHEMA-DRAFT.sql`
- `phase-1-data/RLS-POLICIES-DRAFT.sql`
- `phase-1-data/ERD-ENTERPRISE-TEXT.md`

### PHASE 2 — Governance Engine
- `phase-2-governance/GOVERNANCE-ENGINE-OVERVIEW.md`
- `phase-2-governance/APPROVAL-MATRIX.md`
- `phase-2-governance/APPROVAL-DSL.md`
- `phase-2-governance/TEMPORAL-FLOWS-DRAFT.md`
- `phase-2-governance/PERMISSIONS-GOVERNANCE.md`

### PHASE 3 — Operations (Terrain + Offline-first)
- `phase-3-operations/OPERATIONS-ENGINE-OVERVIEW.md`
- `phase-3-operations/MISSION-LIFECYCLE.md`
- `phase-3-operations/ACTIVITY-STATES.md`
- `phase-3-operations/OFFLINE-SYNC-MODEL.md`
- `phase-3-operations/CONFLICT-RESOLUTION.md`
- `phase-3-operations/EVIDENCE-COLLECTION.md`
- `phase-3-operations/EVENT-CATALOG-OPERATIONS.md`

### PHASE 4 — M&E + Impact Engine
- `phase-4-me-impact/ME-ENGINE-OVERVIEW.md`
- `phase-4-me-impact/KPI-FRAMEWORK.md`
- `phase-4-me-impact/INDICATOR-FORMULA-ENGINE.md`
- `phase-4-me-impact/AGGREGATION-ENGINE.md`
- `phase-4-me-impact/DATA-QUALITY-RULES.md`
- `phase-4-me-impact/DONOR-REPORT-TEMPLATES.md`
- `phase-4-me-impact/EVENT-CATALOG-ME.md`

### PHASE 5 — AI Ops (contractuel, safe-by-design)
- `phase-5-ai-ops/AI-OPS-OVERVIEW.md`
- `phase-5-ai-ops/AI-CONTRACTS.md`
- `phase-5-ai-ops/RAG-ARCHITECTURE.md`
- `phase-5-ai-ops/PROMPT-ORCHESTRATION.md`
- `phase-5-ai-ops/GOVERNANCE-GUARDRAILS.md`
- `phase-5-ai-ops/EVAL-AND-TEST-STRATEGY.md`

### PHASE 6 — UX/UI System (Command Center)
- `phase-6-ux-ui/README.md`
- `phase-6-ux-ui/UX-OVERVIEW.md`
- `phase-6-ux-ui/COMPONENT-ARCHITECTURE.md`
- `phase-6-ux-ui/MISSION-CONTROL.md`
- `phase-6-ux-ui/INCIDENT-CENTER.md`
- `phase-6-ux-ui/GOVERNANCE-MATRIX-VIEW.md`
- `phase-6-ux-ui/TERRITORIAL-COMMAND-VIEW.md`
- `phase-6-ux-ui/IMPACT-ANALYTICS.md`

### PHASE 7 — Build Execution Pack (exécution)
- `phase-7-build-pack/README.md`
- `phase-7-build-pack/BUILD-TICKETS.md`
- `phase-7-build-pack/TEST-STRATEGY.md`

## 2) 10 décisions d’architecture (clés)

1) **RLS-first / tenant isolation**: aucune table `public` sans RLS + policies validées.
2) **Idempotence end-to-end**: `event_id` unique sur toutes commandes/événements; replays sûrs.
3) **Outbox pattern**: publication fiable d’événements; pas d’envoi “best effort”.
4) **Offline-first explicite**: outbox client + sync idempotent + UX de statut (sync badge, queue).
5) **CQRS pragmatique**: write-side normalisé + read-models/projections pour UI et reporting.
6) **Workflows gouvernés**: approbations/quorum/délégation/escalades/override audités.
7) **Evidence-linked**: indicateurs/rapports reliés à des preuves; auditabilité native.
8) **Snapshots / run_id**: exports et agrégations reproductibles (freeze + hash).
9) **RBAC + ABAC**: rôles + scopes (programme/projet/territoire/montant/sévérité) appliqués partout.
10) **AI Ops read-only + citations**: IA sans auto-approval, sorties traçables et sourcées.

## 3) Risques majeurs + plan de remédiation

### Risque R1 — Tables `public.*` avec RLS désactivé (critique)
- **Signal**: PHASE 1 indique un advisory critique (ex: `roles`, `permissions`, `audit_logs`, `organizations`, etc.).
- **Impact**: fuite inter-tenant, accès non autorisé, non-conformité.
- **Plan**:
  - inventaire policies réelles (staging d’abord),
  - définir policies minimales par table (owner),
  - activer RLS progressivement, monitorer erreurs, rollback plan.
- **Ticket**: `PP-DB-002`, `PP-SEC-001`.

### Risque R2 — Offline sync instable (doublons / pertes)
- **Impact**: données terrain incohérentes; confiance perdue.
- **Plan**: protocole idempotent, merge strategy, replay tests, observabilité sync.
- **Tickets**: `PP-FE-001`, `PP-OFF-001`, `PP-OFF-002`, `PP-OBS-001`.

### Risque R3 — Workflow “stuck” (timers/escalades non fiables)
- **Impact**: décisions bloquées, SLA non respectés.
- **Plan**: timers robustes, dead-letter, dashboards “stuck workflows”.
- **Tickets**: `PP-WF-003`, `PP-OBS-001`.

### Risque R4 — Reporting non reproductible (absence freeze/run_id)
- **Impact**: incapacité à auditer des rapports bailleurs.
- **Plan**: snapshot/run_id, hash, audit trail, tests de reproductibilité.
- **Tickets**: `PP-REP-001`, `PP-BE-004`.

### Risque R5 — AI Ops prématuré (sécurité/citations insuffisantes)
- **Impact**: fuite, hallucinations, décisions induites.
- **Plan**: AI en P2, read-only, citations obligatoires, eval/red-team.
- **Tickets**: `PP-AI-001..003`.

## 4) Ordre d’implémentation (P0/P1) + jalons

### Jalons P0 (sécurité + fiabilité + offline)
- **M0 — Préflight & CI**: gates qualité, envs, observabilité base.
- **M1 — Data Foundation**: migrations + RLS + outbox + audit durci.
- **M2 — Workflows**: runtime gouvernance + workflow engine + timers.
- **M3 — Offline**: outbox client + sync idempotent + conflits + UX sync.
- **M4 — UX terrain v1**: Mission Control + Incident Center (offline visible).

### Jalons P1 (valeur produit, reporting, monitoring)
- **M5 — Read-models**: projections UI + perf/indexing.
- **M6 — M&E/Impact**: KPI/formules + règles qualité + dashboards.
- **M7 — Reporting bailleur**: export pack reproductible (freeze + hash).
- **M8 — Notifications**: escalades + in-app/email.

### Jalons P2 (accélérateurs)
- **M9 — AI Ops**: endpoints read-only + RAG multi-tenant + eval.

## 5) Point d’entrée Build Pack

Aller dans `phase-7-build-pack/`:
- `BUILD-TICKETS.md` (index)
- `README.md` (ordre/gates/DoD)
- `TEST-STRATEGY.md` (tests consolidés)

