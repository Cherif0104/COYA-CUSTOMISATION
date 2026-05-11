# Component Architecture (UI)

## Contrat
- Les pages sont des **projections** (read-models), pas la source de vérité.
- Les composants respectent `docs/GUIDE-STYLE-MODULES.md` (header gradient, métriques, states).

## Layout Shell (OS)
- `CommandCenterShell`
  - `ContextHeader` (programme/projet/territoire + workflow_state + SyncBadge)
  - `KpiTilesRow`
  - `FiltersBar` (période/territoire/statut/bailleur)
  - `Tabs` (Synthèse/Carte/Impact/Timeline/Docs/Incidents/Gouvernance)
  - `SidePanel` (actions rapides + pending approvals + alerts)

## Widgets (réutilisables)
- `HealthScoreWidget` (score santé + facteurs)
- `RiskBadge` (low/medium/high/critical)
- `BudgetBurnWidget`
- `TimelineEventStream`
- `EvidenceCompletenessWidget`
- `ApprovalQueueWidget`
- `DQScoreWidget`

## Charts / Data viz
- privilégier composants légers, lazy-load
- éviter sur-rendu en mobile (responsive: simplifier)

## Offline components
Voir `OFFLINE-UX-PATTERNS.md`:
- `SyncBadge`, `OutboxPanel`, `UploadQueue`, `ConflictBanner`, `ReadOnlyModeNotice`

## Acceptance Criteria
- **AC-COMP-01**: composants UI ne contiennent pas de règles métier non observables.
- **AC-COMP-02**: tous les écrans majeurs réutilisent ContextHeader + SyncBadge.
- **AC-COMP-03**: la data viz est responsive + progressive (pas de freeze).

