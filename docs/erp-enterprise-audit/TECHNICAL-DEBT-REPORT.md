# Technical Debt Report — COYA (priorisé)

## Dette critique (P0)

- **`App.tsx` ~3366 lignes** : orchestration navigation + bootstrap données + guards + overlays.
- **Mega-composants** :
  - `ProgrammeModule.tsx` ~3076
  - `ProjectDetailPage.tsx` ~3041
  - `Finance.tsx` ~2168
  - `RhModule.tsx` ~1583

Impact : maintenabilité, tests, perf, risque régression, onboarding.

## Dette structurante (P0–P1)

- Double moteur : `workflowEngine` vs `services/domain` vs mutations directes UI.
- Modèle d’identité : `user.id` vs `profileId` vs entités métier (déjà corrigé côté départements/permissions, à généraliser).

## Dette UX (P1)

- Modules hors workspaces : finance/crm/long tail.
- Cohérence floorplans / inspector inégale.

## Actions recommandées (découpage App)

Proposition cible :

```txt
AppShell
 ├── NavigationRuntime
 ├── WorkspaceRouter
 ├── OverlayRuntime
 ├── RealtimeRuntime
 ├── PresenceRuntime
 └── ModuleBoundary
```

Puis `hooks/app/` :

- `useAppBootstrap`
- `useWorkspaceNavigation`
- `useRealtimeSubscriptions`
- `usePresenceRuntime`

