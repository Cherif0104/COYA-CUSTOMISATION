# Read models — Programmes & Projets

Projections **lecture seule** pour cockpits, listes enrichies et inspecteurs. Alimentées par événements + snapshots batch si nécessaire.

| Read model | Consommateurs | Événements sources (exemples) | Rafraîchissement |
|------------|---------------|-------------------------------|------------------|
| `ProjectCockpitSummary` | Workspace projet, dashboard | `Task.*`, `Project.*`, budget | incremental |
| `ProjectTaskBoard` | Kanban / liste tâches | `Task.StatusChanged`, `Task.Assigned` | realtime |
| `ProgramPortfolioKpis` | Liste programmes | agrégation projets enfants | batch / lazy |
| `ProjectTeamLoadSlice` | Onglet Équipe | `Task.Assigned`, données `hr` | quotidien |
| `ProjectBudgetSnapshot` | Onglet Budget | `finance.*` liés projet | événementiel + batch |

## Références code existantes

- `services/projectCockpitReadModel.ts` — à aligner explicitement sur ce tableau (champs, sources, invalidation).

## Principes

- **Pas** de logique transactionnelle dans le read model builder.
- En cas de divergence : corriger la **chaîne d’événements** ou le **mapper**, pas multiplier les requêtes ad hoc dans les composants.
