# Plan de continuité & transformation — COYA (enterprise)

## PHASE 0 (P0) — Runtime boundary & non divergence

- Écrire un document **normatif** `docs/runtime-boundary.md` :
  - automation système → `workflowEngine`
  - mutation métier / projections → `services/domain`
  - presence/payroll → domain bus (à terme)

## PHASE 1 (P0) — Décomposition App & mega-modules

- Découper `App.tsx` en runtimes (navigation, presence, realtime, overlays).
- Découper `ProjectDetailPage`, `ProgrammeModule`, `Finance`.

## PHASE 2 (P0–P1) — Workforce source of truth

- Introduire `PresenceEvent` append-only (strangler).
- Projections temps (worked, idle, break, overtime detected/validated/paid).

## PHASE 3 (P1) — Command layer généralisée

- Prioriser 1 commande RH (ex. validation overtime) + events + read model.
- Éviter mutations critiques dans UI.

## PHASE 4 (P2) — Finance runtime

- Séparer write-side (commands) et projections (worklists, dashboards).
- Conformité OHADA : règles encapsulées + audit trail.

## PHASE 5 (P3) — Workforce intelligence / analytics & IA

- Read models fiables → copilots et agents (anomalies, compliance, planning).

