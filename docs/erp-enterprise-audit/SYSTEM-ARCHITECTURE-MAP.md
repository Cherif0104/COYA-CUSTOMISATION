# System Architecture Map — COYA (état réel)

## 1) Résumé exécutif

COYA est une **plateforme ERP/HCM** en transition entre :

- **monolithe React** (vues métiers volumineuses, mutations directes),
- et un **runtime orienté domaine** (commandes + événements + policies + read models), déjà amorcé côté **projets** et en forte accélération côté **Workforce/RH**.

## 2) Carte (couches)

```txt
UI Layout (Sidebar / Header / Docks / Overlays)
  └─ App router (currentView) + URL shards (/projects/:id, /hr/employees/:profileId)
      ├─ Modules UI (components/*)
      ├─ UI Runtime (ui-runtime/*) : floorplans, KPI strip, pills, workspaces
      ├─ Contexts (auth, presence, localization, navigation)
      └─ Services façade (DataAdapter, DataService, module services)

Runtime métier (partiel)
  ├─ services/domain/* : bus, orchestrator, commands, events, policies, event_store (domain_events)
  └─ services/workflowEngine.ts : scan transverse → actions (notifications / updates)

Canon & gouvernance
  ├─ domains/* : bounded contexts (events, commands, policies, read-models, workspace-contract)
  └─ docs/enterprise-canon/* : normes couches + UX contract + gouvernance événements
```

## 3) Composants “système” (points de concentration)

- **`App.tsx` (~3366 lignes)** : orchestration navigation + bootstrap données + overlays + guards.
- **Mega-vues** : `ProjectDetailPage.tsx` (~3041), `ProgrammeModule.tsx` (~3076), `Finance.tsx` (~2168), `RhModule.tsx` (~1583).
- **Runtime event-driven v0** : `services/domain/*` (projets).
- **Workforce OS** : `components/hr/EmployeeWorkspaceShell.tsx`, `components/hr/workforce-live/*`, `PresenceContext`.

## 4) Routing & navigation

- Routeur principal par **`currentView`** (switch + `viewRegistry.tsx` pour certains modules).
- Routes URL “shards” :
  - projet : `/projects/:id`
  - employé : `/hr/employees/:profileId` (**canon** côté workspace RH)

## 5) Sécurité & scope (départements)

- Identités :
  - **`user.id` (auth)** = sécurité / RLS / `user_departments`, `user_module_permissions`
  - **`profileId` (`profiles.id`)** = identité métier (workspaces RH, corrélations runtime)
- Scope :
  - `DepartmentService.getAllowedModuleSlugsForUser(userId)` → allowed slugs
  - `applyDepartmentScopeToPermissions(...)` → filtre final permissions
  - modules plateforme non scopés : `dashboard`, `settings`

## 6) Event-driven : état réel

- **Projets** : commandes (`applyTaskStatusChange`) → events → policies → read model + persistance `domain_events`.
- **Workflows** : `workflowEngine` = automation transversale (style impératif).
- **RH** : direction canon RH-5 (`domains/hr/attendance-runtime.md`) ; implémentation présence encore basée sur `PresenceSession` / `PresenceStatusEvent` (transition strangler).

## 7) Principaux risques structuraux

1. **Divergence de philosophies runtime** (workflowEngine vs domain bus vs mutations UI).
2. **App.tsx** centralise trop (risque régression / tests difficiles).
3. **Finance** critique mais peu event-driven / peu modulée.

