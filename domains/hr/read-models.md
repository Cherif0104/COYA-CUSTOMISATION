# Read models — Human Capital & Workforce

Projections **lecture seule** pour UI cockpit, workspace, analytics. Source de vérité événementielle + tables matérialisées (selon perf).

## Workforce Cockpit (RH-5)

| Read model | Contenu | Consommateurs |
|------------|---------|---------------|
| `WorkforcePresenceNow` | présents / absents / en pause / en réunion (agrégat temps réel) | homepage RH |
| `WorkforceAttendanceToday` | retards, anomalies, HS en attente | cockpit |
| `WorkforceLeavePipeline` | demandes pending par manager | cockpit |
| `WorkforceContractAlerts` | contrats < 30j, essai finissant | cockpit |
| `WorkforcePayrollPreview` | masse salariale simulée période | RH + finance |
| `WorkforceRiskSignals` | turnover risk, sous-performance (seuils) | HRBP |
| `WorkforceDepartmentCost` | coût RH / département (projection) | analytics |

## Employee Workspace (RH-4)

| Read model | Contenu | Surface |
|------------|---------|---------|
| `EmployeeHeroSummary` | nom, rôle, dépt, statut contrat, disponibilité | hero |
| `EmployeeKpiStrip` | présence semaine, tâches actives, soldes congés, dernier bulletin | strip |
| `EmployeeAttendanceTimeline` | journées + états + anomalies | tab Attendance |
| `EmployeeWorkEvidenceDay` | preuves + temps + validations par jour | tab Journal |
| `EmployeePayrollSummary` | derniers slips, run en cours, variables | tab Payroll |
| `EmployeePerformanceScoreCard` | score + facteurs + historique | tab Performance |
| `EmployeeDocumentVault` | docs RH typés + expiration | tab Documents |
| `EmployeeLeaveBalance` | soldes + historique demandes | tab Leave |
| `EmployeeCareerMilestones` | postes, promotions, formations | tab Career |
| `EmployeeAccessAudit` | accès, rôles, dernières actions sensibles | tab Access |
| `EmployeeHistoryFeed` | domain events filtrés employé | tab History |

## Listes & matrices

| Read model | Usage |
|------------|--------|
| `EmployeeDirectoryRow` | ligne liste + filtres cockpit |
| `TeamAvailabilityMatrix` | charge × disponibilité (lien `projects`, `planning`) |
| `LeaveBalanceSummary` | self-service + manager |
| `PayrollRunDashboardRow` | run + états validation + compteurs |

## Règles

- Read models **ne mutent jamais** l’état ; invalidation par événements ou polling contrôlé.
- Score performance : recalcul **asynchrone** après batch d’événements (`Task.*`, `Presence.*`, feedback).
