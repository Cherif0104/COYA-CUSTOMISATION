# Événements domaine — Programmes & Projets

Catalogue **nommé** pour alimenter le futur bus et les read models. Convention : `Project.*` / `Task.*` en **past** tense (anglais stable pour code) ou équivalent FR dans les specs produit.

## Projet

| Événement | Payload minimal | Consommateurs typiques |
|-----------|-----------------|------------------------|
| `Project.Created` | projectId, orgId, ownerId | audit, analytics |
| `Project.StatusChanged` | projectId, from, to, actorId | workflows, notifications |
| `Project.BudgetThresholdCrossed` | projectId, thresholdType, amount | finance, workflows, cockpit |
| `Project.HealthRecalculated` | projectId, score, reasons[] | read models KPI |

## Tâche

| Événement | Payload minimal | Consommateurs typiques |
|-----------|-----------------|------------------------|
| `Task.Created` | taskId, projectId, creatorId | audit, planning |
| `Task.Assigned` | taskId, assigneeId, actorId | notifications, hr charge |
| `Task.StatusChanged` | taskId, from, to, actorId | audit, KPI, planning |
| `Task.DueDateBreached` | taskId, projectId, daysLate | workflows, alertes |
| `Task.Validated` | taskId, validatorId | KPI, progression projet |
| `Task.Cancelled` | taskId, reason | audit, planning |

## Activité (terrain)

| Événement | Payload minimal |
|-----------|-----------------|
| `Activity.Scheduled` | activityId, projectId, slot |
| `Activity.Completed` | activityId, outcomes |

## Règles d’émission

- Toute **transition d’état** (`states.md`) émet au minimum `*.StatusChanged`.
- Les événements sont **immutables** ; la correction se fait par événement compensateur + audit.
