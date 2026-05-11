# Commandes (write-side) — RH / Workforce

Les **commandes** sont l’intention métier explicite (CQRS). Elles valident les invariants, appliquent les **policies** ([policies.md](./policies.md)), écrivent les agrégats et **émettent des événements** ([events.md](./events.md)).

Implémentation cible : handlers dans `services/domain` (ou module dédié `services/hr/commands`) + persistance `domain_events` existante.

## Présence & temps

| Commande | Entrée | Effet |
|--------|--------|--------|
| `RecordPresenceTransition` | userId, toStatus, source, at? | `Presence.StatusChanged` |
| `OpenWorkday` | userId, date | `Workday.Started` |
| `CloseWorkday` | userId, date, summary | `Workday.Closed` |
| `AttachWorkEvidence` | userId, date, type, ref | `WorkEvidence.Attached` |
| `SubmitTimeEntry` | userId, minutes, projectId?, taskId? | validation policy → `Task.WorkLogged` / entrée temps |
| `ValidateTimeEntry` | entryId, validatorId | `TimeEntry.Validated` |

## Congés

| Commande | Effet |
|--------|--------|
| `SubmitLeaveRequest` | `LeaveRequest.Submitted` |
| `ApproveLeaveRequest` | `LeaveRequest.Approved` |
| `RejectLeaveRequest` | `LeaveRequest.Rejected` |

## Contrats

| Commande | Effet |
|--------|--------|
| `CreateContract` | `Contract.Created` |
| `ChangeContractStatus` | `Contract.StatusChanged` |
| `ProposeContractRenewal` | `Contract.RenewalProposed` |
| `TerminateContract` | `Contract.Terminated` |

## Paie

| Commande | Effet |
|--------|--------|
| `OpenPayrollRun` | `Payroll.RunOpened` |
| `RunPayrollSimulation` | `Payroll.Simulated` |
| `ValidatePayrollRunHr` | `Payroll.ValidatedByHr` |
| `ValidatePayrollRunFinance` | `Payroll.ValidatedByFinance` |
| `ClosePayrollRun` | `Payroll.Closed` |
| `GeneratePayrollSlip` | `Payroll.SlipGenerated` |
| `RequestPayrollAccountingPost` | `Payroll.PostingRequested` |

## Performance

| Commande | Effet |
|--------|--------|
| `RecomputeEmployeePerformanceScore` | `EmployeePerformanceScore.Recomputed` |

## Idempotence & sécurité

- Clé d’idempotence par commande + acteur + fenêtre temporelle pour les actions de masse (runs paie).
- RBAC : [permissions.md](./permissions.md) ; séparation **self** / **manager** / **HR** / **finance**.
