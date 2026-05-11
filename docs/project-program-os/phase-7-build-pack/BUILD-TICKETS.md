# PHASE 7 — Build Execution Pack — Index des tickets

Objectif: transformer les phases 1–6 (spécifications) en **backlog d’exécution** actionnable, exhaustif et testable.

- **Format recommandé**: `BUILD-TICKETS.md` = index + liens → 1 fichier par ticket dans `tickets/`
- **Convention d’ID**: `PP-<AREA>-###-<slug>.md`
- **Références**: voir `README.md` (ordre d’exécution / gates / DoD) et `TEST-STRATEGY.md` (stratégie consolidée)

## Vue d’ensemble (par domaines)

### Backend (API + services)
- P0: [`PP-BE-001-api-foundation-contracts`](tickets/PP-BE-001-api-foundation-contracts.md)
- P0: [`PP-BE-002-governance-runtime`](tickets/PP-BE-002-governance-runtime.md)
- P0: [`PP-BE-003-operations-write-model`](tickets/PP-BE-003-operations-write-model.md)
- P1: [`PP-BE-004-read-models-projections`](tickets/PP-BE-004-read-models-projections.md)
- P1: [`PP-BE-005-evidence-upload-pipeline`](tickets/PP-BE-005-evidence-upload-pipeline.md)

### Frontend (web) + Offline UX
- P0: [`PP-FE-001-offline-outbox-client`](tickets/PP-FE-001-offline-outbox-client.md)
- P0: [`PP-FE-002-mission-control-v1`](tickets/PP-FE-002-mission-control-v1.md)
- P0: [`PP-FE-003-incident-center-v1`](tickets/PP-FE-003-incident-center-v1.md)
- P1: [`PP-FE-004-governance-matrix-ui`](tickets/PP-FE-004-governance-matrix-ui.md)
- P1: [`PP-FE-005-impact-analytics-v1`](tickets/PP-FE-005-impact-analytics-v1.md)

### Data/DB (migrations, schéma, projections)
- P0: [`PP-DB-001-foundation-tables-migrations`](tickets/PP-DB-001-foundation-tables-migrations.md)
- P0: [`PP-DB-002-rls-remediation-critical`](tickets/PP-DB-002-rls-remediation-critical.md)
- P0: [`PP-DB-003-event-outbox-schema`](tickets/PP-DB-003-event-outbox-schema.md)
- P1: [`PP-DB-004-me-schema-kpi-formulas`](tickets/PP-DB-004-me-schema-kpi-formulas.md)
- P1: [`PP-DB-005-read-models-schema`](tickets/PP-DB-005-read-models-schema.md)

### Sécurité (RLS, RBAC/ABAC, audit)
- P0: [`PP-SEC-001-tenant-isolation-contract`](tickets/PP-SEC-001-tenant-isolation-contract.md)
- P0: [`PP-SEC-002-audit-log-hardening`](tickets/PP-SEC-002-audit-log-hardening.md)
- P1: [`PP-SEC-003-secrets-and-key-rotation`](tickets/PP-SEC-003-secrets-and-key-rotation.md)

### Workflows (governance, timers, idempotence)
- P0: [`PP-WF-001-approval-dsl-compiler`](tickets/PP-WF-001-approval-dsl-compiler.md)
- P0: [`PP-WF-002-workflow-engine-states`](tickets/PP-WF-002-workflow-engine-states.md)
- P1: [`PP-WF-003-timers-escalations`](tickets/PP-WF-003-timers-escalations.md)
- P1: [`PP-WF-004-replay-and-compensation`](tickets/PP-WF-004-replay-and-compensation.md)

### Offline sync (serveur + client) + conflits
- P0: [`PP-OFF-001-sync-protocol-idempotent`](tickets/PP-OFF-001-sync-protocol-idempotent.md)
- P0: [`PP-OFF-002-conflict-resolution-merge`](tickets/PP-OFF-002-conflict-resolution-merge.md)
- P1: [`PP-OFF-003-sync-observability`](tickets/PP-OFF-003-sync-observability.md)

### Notifications (in-app/email)
- P1: [`PP-NOTIF-001-notification-service`](tickets/PP-NOTIF-001-notification-service.md)
- P1: [`PP-NOTIF-002-escalation-notifications`](tickets/PP-NOTIF-002-escalation-notifications.md)

### Reporting (packs bailleurs, exports)
- P1: [`PP-REP-001-donor-pack-freeze-hash`](tickets/PP-REP-001-donor-pack-freeze-hash.md)
- P1: [`PP-REP-002-report-templates-renderer`](tickets/PP-REP-002-report-templates-renderer.md)

### AI Ops (read-only, citations, guardrails)
- P2: [`PP-AI-001-ai-contracts-implementation`](tickets/PP-AI-001-ai-contracts-implementation.md)
- P2: [`PP-AI-002-rag-multitenant-pipeline`](tickets/PP-AI-002-rag-multitenant-pipeline.md)
- P2: [`PP-AI-003-eval-and-redteam`](tickets/PP-AI-003-eval-and-redteam.md)

### Analytics/Monitoring (observabilité, métriques)
- P0: [`PP-OBS-001-structured-logging-tracing`](tickets/PP-OBS-001-structured-logging-tracing.md)
- P1: [`PP-OBS-002-kpis-data-quality-monitoring`](tickets/PP-OBS-002-kpis-data-quality-monitoring.md)

### Infra/DevOps (CI/CD, environnements)
- P0: [`PP-INFRA-001-ci-quality-gates`](tickets/PP-INFRA-001-ci-quality-gates.md)
- P0: [`PP-INFRA-002-migrations-pipeline`](tickets/PP-INFRA-002-migrations-pipeline.md)
- P1: [`PP-INFRA-003-release-train-and-rollbacks`](tickets/PP-INFRA-003-release-train-and-rollbacks.md)

---

## Règles de lecture
- **P0**: bloquant (sécurité, isolation, offline sync, workflow fiable)
- **P1**: valeur forte (UI/exports/monitoring), dépend de P0
- **P2**: accélérateurs (AI Ops) — uniquement après sécurité/audit/exports stables

