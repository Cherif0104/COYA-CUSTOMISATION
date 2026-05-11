# Automated Test Matrix — COYA

Légende : **U** = Unitaire · **I** = Intégration · **E** = E2E · **·** = à faire

| Flux / domaine | U | I | E | Notes |
|---|---:|---:|---:|---|
| Auth / login / first landing | · | · | E | rôle → landing |
| Sidebar → Dashboard | · | · | E | anti-régression “dashboard inaccessible” |
| Permissions dept scope | U | I | · | `applyDepartmentScopeToPermissions` |
| Projet: change task status | U | I | E | commande+events+policy |
| domain_events persist | · | I | · | idempotence, schéma |
| workflowEngine cycle | U | I | · | éviter duplication |
| RH: Workforce Live render | · | · | E | KPI/timeline/alerts |
| Pointage global (actions) | · | I | E | `PresenceContext.setStatus` |
| Workspace employé URL | · | · | E | `/hr/employees/:profileId` |

## Priorité 30 jours (sprint audit)

1. **E2E** : sidebar → dashboard, RH, projets.
2. **U/I** : scope départements, commande projet.
3. **E2E smoke** : workforce dock + chrono.

