# PHASE 8 — Audit d’alignement — COYA vs Project & Program OS

Objectif: produire un **audit complet et actionnable** de l’alignement entre:
- **COYA (repo actuel)**: implémentation React + Supabase (migrations, services, UI)
- **Project & Program OS (docs)**: Canonical Spec (PHASE 1–6) + backlog d’exécution (PHASE 7)

Contraintes: preuves concrètes (paths), score /10, statut OK/Partiel/Manquant, recommandations P0/P1/P2 **séquencées** et appuyées sur les tickets PHASE 7.

## 0) Sources de preuve (référence rapide)

- **Canonical Spec & synthèse OS**: `docs/project-program-os/EXEC-SUMMARY.md`
- **PHASE 7 (Build Pack)**: `docs/project-program-os/phase-7-build-pack/README.md`, `docs/project-program-os/phase-7-build-pack/BUILD-TICKETS.md`, `docs/project-program-os/phase-7-build-pack/TEST-STRATEGY.md`, `docs/project-program-os/phase-7-build-pack/tickets/*.md`
- **RLS/multi-tenant en DB (migrations)**: `supabase/migrations/*.sql` (ex: `20250220000000_add_departments.sql`, `20250220160000_phase2_project_attachments_and_settings.sql`)
- **Client Supabase + auth**: `services/supabaseService.ts`, `middleware/authGuard.ts`
- **Workflows runtime (app)**: `services/workflowEngine.ts`
- **IA (app)**: `services/geminiService.ts`, `components/AuthAIAssistant.tsx`
- **UX/UI (app)**: `components/**/*.tsx`, `ui-runtime/**/*.tsx`, `contexts/*.tsx`

---

## 1) Axe — Structure OS (phases, artefacts, traçabilité)

- **Preuves**
  - OS structuré par phases + référence unique: `docs/project-program-os/EXEC-SUMMARY.md`
  - Spécifs par domaine: `docs/project-program-os/phase-1-data/*`, `phase-2-governance/*`, `phase-3-operations/*`, `phase-4-me-impact/*`, `phase-5-ai-ops/*`, `phase-6-ux-ui/*`
  - Exécution (backlog + gates + DoD): `docs/project-program-os/phase-7-build-pack/README.md`

- **Score**: **9/10**
- **Statut**: **OK**
- **Justification**
  - La structure “spec → build pack” est **cohérente et navigable**: l’Executive Summary ancre les artefacts (phases 1–7) et les gates.
- **Gaps**
  - L’audit d’alignement (PHASE 8) manquait avant ce fichier (désormais comblé).

---

## 2) Axe — UX/UI (Command Center, projections, cockpit)

- **Preuves**
  - Principes UX contractuels (Command Center, navigation hiérarchique, offline UX): `docs/project-program-os/phase-6-ux-ui/UX-OVERVIEW.md`, `docs/project-program-os/phase-6-ux-ui/OFFLINE-UX-PATTERNS.md`
  - Implémentation UI réelle: `components/**/*.tsx` (ex: `components/ProgrammesProjectsShell.tsx`, `components/dashboard/*`), `ui-runtime/**/*.tsx`
  - E2E UI: `cypress/e2e/*.cy.ts`

- **Score**: **7/10**
- **Statut**: **Partiel**
- **Justification**
  - UI riche (modules, dashboards, shells) existe, mais l’alignement “Pages = projections read-model” (PHASE 6) n’est pas encore explicitement garanti par un read-model layer / CQRS durci.
- **Gaps (principaux)**
  - Couplage probable UI↔tables (risque) au lieu de read-models stables (cf. PHASE 7 `PP-BE-004`, `PP-DB-005`).

---

## 3) Axe — IA (AI Ops: contrats, citations, guardrails, multi-tenant)

- **Preuves**
  - Contrats AI Ops (citations obligatoires, run_id/event_id, multi-tenant): `docs/project-program-os/phase-5-ai-ops/AI-CONTRACTS.md`
  - Backlog AI Ops (P2): `docs/project-program-os/phase-7-build-pack/BUILD-TICKETS.md` (PP-AI-001..003)
  - Implémentation IA côté app (LLM “assistant”): `services/geminiService.ts`, UI `components/AuthAIAssistant.tsx`

- **Score**: **4/10**
- **Statut**: **Partiel / Manquant (sur exigences OS)**
- **Justification**
  - Une intégration IA existe, mais **ne démontre pas** les invariants OS attendus: citations internes, read-only garanti, séparation tenant, audit/replay (run_id), et gating “human-in-the-loop”.
- **Gaps**
  - Absence de “citations internes obligatoires” côté implémentation app (tel que défini par PHASE 5).

---

## 4) Axe — Africa-first / offline-first / faible connectivité

- **Preuves**
  - Contrat offline-first détaillé (outbox, cursors, conflits, faible connectivité): `docs/project-program-os/phase-3-operations/OFFLINE-SYNC-MODEL.md`
  - UX offline contractuelle: `docs/project-program-os/phase-6-ux-ui/OFFLINE-UX-PATTERNS.md`
  - Backlog build offline: `docs/project-program-os/phase-7-build-pack/tickets/PP-FE-001-offline-outbox-client.md`, `PP-OFF-001-sync-protocol-idempotent.md`, `PP-OFF-002-conflict-resolution-merge.md`

- **Score**: **6/10**
- **Statut**: **Partiel**
- **Justification**
  - Le “contrat offline” est très solide côté docs, mais l’implémentation repo visible (services/components) ne prouve pas encore un outbox client + sync idempotent complet en prod.
- **Gaps**
  - Preuves code “outbox offline client + sync protocol” à rendre explicites (PHASE 7 P0/P1 offline).

---

## 5) Axe — Multi-org / multi-tenant (isolation, RLS, scopes)

- **Preuves**
  - RLS activé + policies basées sur `profiles.organization_id` et `auth.uid()`: `supabase/migrations/20250220000000_add_departments.sql`
  - RLS sur objets projet/attachments/settings: `supabase/migrations/20250220160000_phase2_project_attachments_and_settings.sql`
  - Doc d’architecture multi-tenant (analyse): `docs/ANALYSE-COMPLETE-PROJET-MULTI-TENANT.md`
  - Indices multi-tenant dans types: `types.ts` (références `profiles.organization_id`)

- **Score**: **8/10**
- **Statut**: **OK / Partiel (hardening)**
- **Justification**
  - Le repo montre une implémentation multi-tenant réelle via RLS.
  - Le hardening (contrat isolation + tests systématiques + audit logs immuables) reste à industrialiser selon PHASE 7.
- **Gaps**
  - Pack de tests RLS “org A vs org B” à formaliser/automatiser (PHASE 7 `PP-SEC-001`, `PP-DB-002`).

---

## 6) Axe — Terrain (opérations, preuves, workflow des missions/incidents)

- **Preuves**
  - Contrats opérationnels (missions/activities/incidents/evidence): `docs/project-program-os/phase-3-operations/*` (ex: `MISSION-LIFECYCLE.md`, `EVIDENCE-COLLECTION.md`)
  - UI “terrain / ops / RH live” côté app: `components/hr/workforce-live/*`, `components/ProgrammeModule.tsx`, `components/Projects.tsx`
  - Workflows runtime “alerting” applicatif: `services/workflowEngine.ts`

- **Score**: **7/10**
- **Statut**: **Partiel**
- **Justification**
  - Beaucoup de surfaces opérationnelles existent, mais l’OS attend une exécution “event/outbox/audit” et offline-first end-to-end (PHASE 7).
- **Gaps**
  - Chaîne “evidence → audit trail → reporting reproducible” à verrouiller (PHASE 7 `PP-BE-005`, `PP-REP-001`).

---

## 7) Axe — Gouvernance (approvals, quorum, délégation, escalades, audit)

- **Preuves**
  - Spec governance & DSL: `docs/project-program-os/phase-2-governance/APPROVAL-DSL.md`, `APPROVAL-MATRIX.md`
  - Backlog d’exécution: `docs/project-program-os/phase-7-build-pack/tickets/PP-WF-001-approval-dsl-compiler.md`, `PP-WF-002-workflow-engine-states.md`, `PP-WF-003-timers-escalations.md`, `PP-BE-002-governance-runtime.md`

- **Score**: **5/10**
- **Statut**: **Partiel / Manquant (runtime OS)**
- **Justification**
  - Les contrats sont présents, mais l’implémentation repo visible montre plutôt un workflow “app-level” (ex: `services/workflowEngine.ts`) qu’un **governance runtime** conforme (DSL compilée + engine + audit log immuable).

---

## 8) Axe — Architecture technique (CQRS, outbox, events, observabilité)

- **Preuves**
  - Décisions d’archi OS (RLS-first, outbox, CQRS, offline): `docs/project-program-os/EXEC-SUMMARY.md`
  - Observabilité (gates + exigences): `docs/project-program-os/phase-7-build-pack/tickets/PP-OBS-001-structured-logging-tracing.md`
  - Migrations + functions Supabase: `supabase/migrations/*.sql`, `supabase/functions/crm-webhook-dispatch/index.ts`

- **Score**: **6/10**
- **Statut**: **Partiel**
- **Justification**
  - La base technique (Supabase + migrations + RLS + fonctions) est tangible.
  - Le pattern outbox / events / projections “OS-grade” n’est pas encore démontré comme standard transversal dans le code applicatif.

---

## 9) Axe — Produit (valeur, modules, M&E/Reporting, auditabilité)

- **Preuves**
  - M&E (KPI, formules, qualité, templates bailleurs): `docs/project-program-os/phase-4-me-impact/*`
  - Reporting reproductible (freeze+hash) en backlog: `docs/project-program-os/phase-7-build-pack/tickets/PP-REP-001-donor-pack-freeze-hash.md`, `PP-REP-002-report-templates-renderer.md`
  - UI analytics existante: `components/FinanceAnalytics.tsx`, `components/Analytics.tsx`, `components/GoalsAnalytics.tsx`

- **Score**: **7/10**
- **Statut**: **Partiel**
- **Justification**
  - Surfaces produit et analytics existent; la partie “auditabilité native + reproductibilité export” est surtout dans les docs/tickets (à exécuter).

---

## 10) Synthèse “OK / Partiel / Manquant”

- **OK**
  - Structure OS: phases + canon (`docs/project-program-os/*`)
  - Multi-tenant via RLS (migrations Supabase)
- **Partiel**
  - UX/UI (aligner sur read-models/projections)
  - Offline-first (implémentation à prouver)
  - Terrain (chaîne evidence→audit→reporting à verrouiller)
  - Architecture technique (outbox/events/projections standardiser)
  - Produit (reporting reproductible à implémenter)
- **Manquant (au sens OS runtime)**
  - Gouvernance runtime (DSL compilée + engine + escalades + audit immuable)
  - AI Ops conforme (citations internes, read-only, guardrails, multi-tenant)

---

## 11) Recommandations (P0/P1/P2) + séquence par gates (appuyée sur PHASE 7)

### Gate G0 — Préflight (P0)
Objectif: rendre le delivery sûr, reproductible, observable.
- **P0**: CI “quality gates” → `PP-INFRA-001`
- **P0**: pipeline migrations → `PP-INFRA-002`
- **P0**: logs structurés + corrélation → `PP-OBS-001`

### Gate G1 — Data/DB Foundation (P0)
Objectif: isolation multi-tenant et socle event/outbox.
- **P0**: foundation tables/migrations → `PP-DB-001`
- **P0**: remédiation RLS critique + tests multi-tenant → `PP-DB-002`, `PP-SEC-001`
- **P0**: schéma outbox/events → `PP-DB-003`
- **P0**: audit log hardening (immutabilité/accès) → `PP-SEC-002`

### Gate G2 — Gouvernance & Workflows fiables (P0)
Objectif: décisions gouvernées auditées, timers/escalades robustes.
- **P0**: compiler DSL approvals → `PP-WF-001`
- **P0**: governance runtime décisions + audit → `PP-BE-002`
- **P0**: workflow engine (états/transitions) → `PP-WF-002`
- **P1**: timers/escalades + notif → `PP-WF-003`, `PP-NOTIF-002`
- **P1**: replay/compensation → `PP-WF-004`

### Gate G3 — Offline sync (P0)
Objectif: mode avion end-to-end (créations → resync sans doublons).
- **P0**: protocole sync idempotent serveur → `PP-OFF-001`
- **P0**: outbox offline client → `PP-FE-001`
- **P0**: résolution conflits + UX conflit → `PP-OFF-002`
- **P1**: observabilité sync → `PP-OFF-003`

### Gate G4 — UX opérationnelle (P0/P1)
Objectif: Mission Control / Incident Center + visibilité gouvernance/sync.
- **P0**: Mission Control v1 → `PP-FE-002`
- **P0**: Incident Center v1 → `PP-FE-003`
- **P1**: Governance matrix UI → `PP-FE-004`
- **P1**: read-models endpoints/projections (pour “pages = projections”) → `PP-BE-004`, `PP-DB-005`

### Gate G5 — M&E + Reporting bailleurs (P1)
Objectif: KPI exécutables + export reproductible audit-proof.
- **P1**: schéma KPI/formules → `PP-DB-004`
- **P1**: monitoring DQ/KPI → `PP-OBS-002`
- **P1**: donor pack freeze+hash → `PP-REP-001`
- **P1**: renderer templates rapports → `PP-REP-002`
- **P1**: pipeline upload preuves (hash/idempotence) → `PP-BE-005`

### Gate G6 — AI Ops (P2, uniquement après G1–G5)
Objectif: IA **read-only**, citée, multi-tenant, évaluée.
- **P2**: implémenter contrats AI (read-only + citations) → `PP-AI-001`
- **P2**: pipeline RAG multi-tenant → `PP-AI-002`
- **P2**: eval & red-team → `PP-AI-003`

---

## 12) Notes d’exécution (audit → action)

Cet audit se veut “actionnable”: toute zone **Partiel/Manquant** doit être traitée en suivant les gates ci-dessus, en gardant:
- **RLS-first** (G1) avant toute feature “valeur”
- **Workflows + offline** (G2–G3) avant reporting/IA
- **Reporting reproductible** (G5) avant AI Ops (G6)

