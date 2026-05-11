# ERP Test Strategy — COYA

## Objectif

Tester COYA comme **plateforme ERP enterprise** :

- workflows métier cross-modules,
- role-based access,
- runtime (events/policies/projections),
- UX workspace (structure + navigation + responsive),
- non-régression sur chemins critiques.

## Pyramide recommandée

- Unit : policies + fonctions pures (ex. transitions, calculs temps)
- Intégration : bus domaine, DataAdapter, workflowEngine (sans UI)
- E2E : scénarios métiers (peu, critiques)

## Axes prioritaires

1. **Navigation & accès** : sidebar → dashboard / RH / projets (anti-régression).
2. **Projet runtime** : `applyTaskStatusChange` → domain events → KPI/timeline.
3. **Workforce** : pointage global (actions) + chrono + Workforce Live rendering.
4. **Permissions** : `user_module_permissions` + `user_departments` + garde UI (et tests RLS séparés).

## Outils

- E2E : Cypress (déjà présent).
- Unit/Integration : Vitest/Jest (à brancher si absent), sinon tests “node” ciblés.

