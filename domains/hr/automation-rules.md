# Automatisations — Human Capital & Workforce

Règles **réaction** à des événements ou seuils read model. Alignées sur [events.md](./events.md) et [policies.md](./policies.md).

| ID | Déclencheur | Actions |
|----|-------------|---------|
| AUTO-HR-001 | `LeaveRequest.Approved` | Mise à jour disponibilité + notif équipe projet + cohérence `planning` |
| AUTO-HR-002 | `Attendance.AnomalyDetected` / anomalie présence | Notif RH + badge cockpit |
| AUTO-HR-003 | `Contract.ExpiringSoon` | Création tâche manager + workflow renouvellement |
| AUTO-HR-004 | `Contract.Terminated` | Tâche IT révocation + archivage + notification paie |
| AUTO-HR-005 | `TimeEntry` en attente > SLA | Relance manager (policy `OvertimePolicy` / `WorkPolicy`) |
| AUTO-HR-006 | `Payroll.Simulated` + écart masse salariale | Alerte finance si écart > seuil |
| AUTO-HR-007 | `EmployeePerformanceScore.Recomputed` sous seuil | Alerte HRBP + suggestion plan d’action |

## Chaîne paie (rappel)

Automatisations futures doivent respecter la chaîne documentée dans [overview.md](./overview.md) : **temps validé → variables → simulation → validations → clôture → PDF → compta** — jamais export direct sans trace d’événements.
