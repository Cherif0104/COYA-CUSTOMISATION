# Automatisations — Programmes & Projets

Règles du type **SI événement / condition ALORS actions**. À brancher sur l’orchestrateur cible (`domains/workflows/`).

| ID | Déclencheur | Condition | Actions | Priorité |
|----|-------------|-----------|---------|----------|
| AUTO-PRJ-001 | `Task.DueDateBreached` | — | Notifier CP + badge cockpit « retard » | haute |
| AUTO-PRJ-002 | `Project.BudgetThresholdCrossed` | seuil org paramétrable | Notifier DAF + option blocage validation dépense | critique |
| AUTO-PRJ-003 | `Task.StatusChanged` → `done` | — | Recalcul `Project.HealthRecalculated` | normale |
| AUTO-PRJ-004 | `Task.Assigned` | assignee changé | Mise à jour charge read model RH | normale |
| AUTO-PRJ-005 | `Task.Validated` | — | Journal audit + progression jalons si lié | normale |

## Idempotence

- Chaque règle porte un **identifiant** ; l’orchestrateur ne doit pas dupliquer les effets (clé idempotence par événement + règle).

## Hors périmètre immédiat

- ML / détection d’anomalies : consommer les mêmes événements une fois le bus stable.
