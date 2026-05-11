# Workflows — Human Capital & Workforce

Orchestrations longues : N+1, renouvellements, clôtures. Implémentation cible : moteur workflows + `domain_events`.

## WF-HR-LEAVE

Soumission → validation N+1 (paramétrable par policy) → mise à jour calendrier / charge / `LeaveRequest.Approved`.

## WF-HR-OVERLOAD

Détection surcharge (read model) → notification manager + suggestion réaffectation (`projects`).

## WF-HR-CONTRACT-RENEWAL

`Contract.ExpiringSoon` → tâche manager → `Contract.RenewalProposed` → signature / `Contract.StatusChanged` → archivage ancien contrat.

## WF-HR-CONTRACT-TERMINATION

`Contract.Terminated` → révocation accès (IT) → archivage employé → notification RH + `Payroll` (dernier bulletin).

## WF-HR-PAYROLL-CLOSE

`Payroll.RunOpened` → collecte temps validés + variables → `Payroll.Simulated` → `Payroll.ValidatedByHr` → `Payroll.ValidatedByFinance` → `Payroll.Closed` → `Payroll.SlipGenerated` (batch) → `Payroll.PostingRequested` (finance).

## WF-HR-PERFORMANCE-RECOMPUTE

Batch ou événement déclenché (`Task.Completed`, `Presence.*`, feedback) → `EmployeePerformanceScore.Recomputed` → alertes bonus / promotion si seuils `PerformancePolicy`.
