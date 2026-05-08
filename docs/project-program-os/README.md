# COYA — Project & Program OS — Build Execution Layer

Ce dossier transforme la **Canonical Specification** en artefacts exécutable pour le build.

Référence canonique:
- `docs/PROJECT-PROGRAM-OS-SPEC.md`

---

## Roadmap de build (phases)

### PHASE 1 — Foundation Architecture
- Data architecture: tables, relations, isolation tenant, hiérarchie territoriale, versioning doc, audit, outbox/events, soft delete, archivage
- Livrables: ERD (texte), schéma PostgreSQL (draft), policies RLS (draft), stratégie migrations

### PHASE 2 — Governance Engine
- Chaînes de validation, délégation, matrice d’approbation, approbations conditionnelles, escalade, quorum, override, politiques
- Livrables: flows Temporal (draft), DSL d’approbation (draft), matrice permissions/approvals (draft)

### PHASE 3 — Operation Engine (Terrain)
- Activités, missions, exécution terrain, collecte preuves, géolocalisation, logistique, offline sync, résolution conflits
- Livrables: modèle sync mobile, lifecycle missions/activités, règles conflits, preuves (evidence)

### PHASE 4 — M&E + Impact Engine
- KPIs, baselines, targets, cohortes, formules, agrégations, analytics, templates bailleurs
- Livrables: framework KPI, formula engine (contrat), agrégation (contrat), templates reporting

### PHASE 5 — AI Ops Layer
- Détection anomalies, recommandations, génération rapports, copilotes, assistant conformité
- Livrables: contrats IA, orchestration prompts, stratégie RAG/vectorisation, guardrails gouvernance

### PHASE 6 — UX/UI System (Command Center)
- Program Detail OS, Territorial Command View, Mission Control, Incident Center, Governance Matrix, Beneficiary Intelligence, Funding Oversight, Impact Analytics
- Livrables: UX flows, wireframes (texte), architecture composants, responsive, patterns offline UX

### PHASE 7 — Build Execution Pack
- Tickets backend/frontend/infra/security/analytics/sync/workflows/AI
- Chaque ticket: priorité, dépendances, estimation, owner, acceptance criteria, test strategy

---

## Dossiers

- `phase-1-data/`
- `phase-2-governance/`
- `phase-3-operations/`
- `phase-4-me-impact/`
- `phase-5-ai-ops/`
- `phase-6-ux-ui/`
- `phase-7-build-pack/`

