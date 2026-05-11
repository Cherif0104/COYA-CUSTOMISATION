/**
 * Contrat canonique — Programme Cockpit CQRS (P0)
 *
 * Rôle: source de vérité de lecture pour le module Programme & Projets.
 * Ce fichier fige:
 * - schema id (stable)
 * - model version (int)
 * - types TypeScript consommés par l'UI (read-only)
 * - convention d'IDs d'alertes déterministes
 */

export const PROGRAMME_COCKPIT_SCHEMA_ID = 'programme_cockpit.v1' as const;
export const PROGRAMME_COCKPIT_MODEL_VERSION = 1 as const;

export type ProgrammeAlertSeverity = 'high' | 'medium' | 'low';
export type ProgrammeAlertKind =
  | 'budget_variance'
  | 'budget_approval_pending'
  | 'burn_rate'
  | 'mel_anomaly'
  | 'action_overdue'
  | 'proof_missing'
  | 'sync_degraded'
  | 'risk_proxy';

export type ProgrammeAlertEntityType =
  | 'programme'
  | 'programme_action'
  | 'budget_cascade_line'
  | 'project_activity'
  | 'expense_request';

export type ProgrammeAlert = {
  /** ID déterministe (hash) */
  id: string;
  /** Clé lisible déterministe (debug/audit) */
  key?: string;
  kind: ProgrammeAlertKind;
  severity: ProgrammeAlertSeverity;
  fr: string;
  en: string;
  entityType?: ProgrammeAlertEntityType;
  entityId?: string;
  metric?: { name: string; value: number; unit?: string };
  createdAt: string;
};

export type ProgrammeBudgetTotals = {
  currency: string;
  plannedTotal: number;
  actualTotal: number;
  variance: number;
  variancePercent: number;
  burnRatePercent: number;
  alertLevel: 'critical' | 'warning' | 'under' | 'ok';
};

export type ProgrammeBudgetRollupByPost = {
  expensePostCode: string;
  currency: string;
  totalPlanned: number;
  totalActual: number;
  variancePlannedMinusActual: number;
  lineCount: number;
};

export type ProgrammeBudgetRollupByScope = {
  scopeLevel: 'programme' | 'project' | 'activity' | 'task';
  currency: string;
  totalPlanned: number;
  totalActual: number;
  variancePlannedMinusActual: number;
  lineCount: number;
};

export type ProgrammeTerrainMEL = {
  activitiesCount: number;
  byStatus: { planned: number; ongoing: number; done: number; cancelled: number };
  melCoverage: {
    withTarget: number;
    withResult: number;
    withUnit: number;
    completenessPercent: number;
  };
  melAnomalies: {
    missingTargetCount: number;
    missingResultCount: number;
    resultExceedsTargetCount: number;
    negativeOrInvalidCount: number;
  };
  progress: { plannedCount: number; completedCount: number; completionPercent: number };
};

export type ProgrammeActionKpis = {
  total: number;
  byStatus: Record<
    'draft' | 'pending_validation' | 'validated' | 'assigned' | 'done' | 'cancelled' | 'not_realized',
    number
  >;
  due: {
    withDueDate: number;
    overdueCount: number;
    dueSoonCount: number;
    nextDue: Array<{
      id: string;
      title: string;
      status: string;
      dueDate: string;
      assigneeProfileIds: string[];
      proofStatus: 'missing' | 'uploaded' | 'linked' | 'na';
    }>;
  };
  assignees: { uniqueAssignees: number; unassignedCount: number };
};

export type ProgrammeGovernance = {
  pendingApprovalsCount: number;
  byWorkflow: {
    budgetCascadePending: number;
    expenseRequestsPending: number;
    actionsPendingValidation: number;
  };
  pendingApprovalSamples: Array<{
    entityType: 'budget_cascade_line' | 'expense_request' | 'programme_action';
    entityId: string;
    label: string;
    workflowStatus: string;
    updatedAt?: string;
  }>;
};

export type ProgrammeProofs = {
  programmeActionProofs: {
    totalActionsRequiringProof: number;
    withProofCount: number;
    missingProofCount: number;
    completenessPercent: number;
  };
  uploads: Record<string, never>;
};

export type ProgrammeRiskProxy = {
  level: 'low' | 'medium' | 'high';
  score: number;
  drivers: Array<
    | { kind: 'budget'; severity: ProgrammeAlertSeverity; value: number }
    | { kind: 'overdue_actions'; severity: ProgrammeAlertSeverity; value: number }
    | { kind: 'mel_anomalies'; severity: ProgrammeAlertSeverity; value: number }
    | { kind: 'pending_approvals'; severity: ProgrammeAlertSeverity; value: number }
    | { kind: 'sync'; severity: ProgrammeAlertSeverity; value: number }
  >;
};

export type ProgrammeSyncHealth = {
  projectorStatus: 'ok' | 'degraded' | 'stalled' | 'disabled';
  lastProjectedAt: string | null;
  lastProcessedEventOccurredAt: string | null;
  lagSeconds: number | null;
  watermark: { stream: 'domain_events'; position: string | null };
  dataFreshness: { budgetsAt: string | null; terrainAt: string | null; actionsAt: string | null };
};

export type ProgrammeCockpitReadModel = {
  schemaId: typeof PROGRAMME_COCKPIT_SCHEMA_ID;
  modelVersion: typeof PROGRAMME_COCKPIT_MODEL_VERSION;
  programmeId: string;
  organizationId: string;
  generatedAt: string;
  period: { startDate: string | null; endDate: string | null; elapsedPercent: number | null };
  budget: ProgrammeBudgetTotals;
  budgetRollups: { byPost: ProgrammeBudgetRollupByPost[]; byScope: ProgrammeBudgetRollupByScope[] };
  terrain: ProgrammeTerrainMEL;
  actions: ProgrammeActionKpis;
  governance: ProgrammeGovernance;
  proofs: ProgrammeProofs;
  riskProxy: ProgrammeRiskProxy;
  alerts: ProgrammeAlert[];
  sync: ProgrammeSyncHealth;
};

/**
 * Clé lisible d’alerte (déterministe). La fonction de hash est côté runtime (Edge).
 * Convention: `prog:<programmeId>:<kind>:<scope>:<referenceId>`
 */
export function buildProgrammeAlertKey(params: {
  programmeId: string;
  kind: ProgrammeAlertKind;
  scope: string;
  referenceId: string;
}): string {
  return `prog:${params.programmeId}:${params.kind}:${params.scope}:${params.referenceId}`;
}

