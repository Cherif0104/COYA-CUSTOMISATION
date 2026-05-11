# Événements — Human Capital & Workforce

Convention : noms **stables en anglais** pour le code (`Domain.Object.Verb`), libellés FR côté produit. Toute transition d’état significative émet au minimum un `*.StatusChanged` ou un événement métier dédié.

Les événements doivent être **corrélables** avec `projects`, `planning`, `tickets`, `documents` via `correlation_id` / `entity_ref` (voir [event-catalog](../shared/event-catalog.md)).

## Présence & connexion

Spécification runtime détaillée (session, **append-only**, types `CLOCK_IN` / `BREAK_*` / `OVERTIME_*`, agrégats temps) : [attendance-runtime.md](./attendance-runtime.md).  
Le tableau ci-dessous reste le **vocabulaire bus / domaine** ; les types bas niveau du journal peuvent mapper 1:1 ou agréger vers ces noms.

| Événement | Payload minimal | Consommateurs |
|-----------|-----------------|---------------|
| `Presence.UserOnline` | userId, orgId, at | cockpit, audit |
| `Presence.UserOffline` | userId, orgId, at | cockpit |
| `Presence.StatusChanged` | userId, from, to, reason?, source | planning, payroll prep, analytics |
| `Presence.AwayWarningRaised` | userId, idleSeconds | notifications |
| `Presence.BreakStarted` | userId, at | journal, policies |
| `Presence.BreakEnded` | userId, at | journal, policies |
| `Presence.FieldMissionStarted` | userId, geoRef? | journal |
| `Presence.TrainingSessionJoined` | userId, sessionId | learning |

### États cibles (vocabulaire officiel)

Référence runtime : `OFFLINE`, `ONLINE`, `PRESENT`, `BREAK`, `MEETING`, `FOCUS`, `FIELD_MISSION`, `TRAINING`, `SICK`, `LEAVE`, `TECHNICAL_ISSUE`, `DISCONNECTED` — mapping progressif depuis l’existant (`states.md`).

## Journée & preuves

| Événement | Payload minimal | Consommateurs |
|-----------|-----------------|---------------|
| `Workday.Started` | userId, date, orgId | journal |
| `Workday.Closed` | userId, date, summary | payroll prep |
| `WorkEvidence.Attached` | userId, date, evidenceType, refId | audit, performance |
| `Task.WorkLogged` | userId, taskId, minutes, projectId? | charge, payroll variable |
| `TimeEntry.Validated` | entryId, validatorId | payroll, disputes |

## Congés & absences

| Événement | Payload minimal | Consommateurs |
|-----------|-----------------|---------------|
| `LeaveRequest.Submitted` | requestId, userId, dates | managers, workflows |
| `LeaveRequest.Approved` | requestId, approverId | planning, présence |
| `LeaveRequest.Rejected` | requestId, reason | notifications |
| `Absence.Recorded` | userId, date, type, source | payroll, analytics |

## Contrats

| Événement | Payload minimal | Consommateurs |
|-----------|-----------------|---------------|
| `Contract.Created` | contractId, employeeId | documents, IT provisioning |
| `Contract.StatusChanged` | contractId, from, to | access, payroll |
| `Contract.ExpiringSoon` | contractId, daysLeft | cockpit, workflows |
| `Contract.RenewalProposed` | contractId, proposalId | workflows |
| `Contract.Terminated` | contractId, reason, effectiveDate | IT revoke, archive, payroll |

## Paie

| Événement | Payload minimal | Consommateurs |
|-----------|-----------------|---------------|
| `Payroll.RunOpened` | runId, period, orgId | finance prep |
| `Payroll.Simulated` | runId, employeeId?, totalsHash | RH review |
| `Payroll.ValidatedByHr` | runId, actorId | finance |
| `Payroll.ValidatedByFinance` | runId, actorId | compta |
| `Payroll.Closed` | runId | immutable archive |
| `Payroll.SlipGenerated` | slipId, employeeId, pdfRef | documents, self-service |
| `Payroll.PostingRequested` | runId, journalEntryRef? | finance OHADA |

## Performance & risques RH

| Événement | Payload minimal | Consommateurs |
|-----------|-----------------|---------------|
| `EmployeePerformanceScore.Recomputed` | employeeId, score, factors[] | cockpit, bonus workflows |
| `TurnoverRisk.Flagged` | employeeId, severity | HRBP |

## Règles d’émission

- Événements **immutables** ; correction = événement compensateur + trace audit.
- Toute entrée **temps** ou **paie** critique passe par **validation** (policy) avant clôture.
- Corrélation obligatoire avec **organisation** et **contrat actif** quand applicable.
