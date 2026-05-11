/**
 * Modèle conceptuel — timeline comportementale & consolidation multi-session.
 * @see docs/workforce-os/BEHAVIORAL-TIMELINE-SESSION-MODEL.md
 *
 * Non utilisé encore par la persistance Supabase : contrat pour moteurs Session / Consolidation / Context.
 */

/** Segment élémentaire sur la timeline consolidée d’un travailleur */
export type ActivityTimelineSegmentKind =
  | 'system_connected'
  | 'technical_activity'
  | 'business_activity'
  | 'productive_output'
  | 'collaboration'
  | 'declared_break'
  | 'idle_detected'
  | 'off_system'
  | 'off_system_productive_context'
  | 'consolidated_gap';

export type OperationalContext =
  | 'office'
  | 'remote'
  | 'hybrid'
  | 'field_mission'
  | 'external_meeting'
  | 'client_call'
  | 'travel'
  | 'training'
  | 'support'
  | 'other';

export interface DeviceSessionRef {
  device_id?: string;
  client_type?: 'web' | 'mobile' | 'desktop_agent' | 'kiosk' | 'unknown';
  session_fingerprint?: string;
}

/** Hypothèses d’interprétation — jamais affichées comme verdict sur la personne */
export type WorkforceInterpretationHypothesis =
  | 'possible_overload'
  | 'possible_misallocation'
  | 'possible_skill_gap'
  | 'possible_workflow_friction'
  | 'possible_tooling_issue'
  | 'possible_management_load'
  | 'possible_excessive_multitasking'
  | 'insufficient_data';

/** Synthèse journalière cible (read-model futur) */
export interface DailyWorkforceRollupConcept {
  worker_id: string;
  day: string;
  timezone: string;
  /** secondes */
  total_connected_seconds?: number;
  active_seconds?: number;
  productive_seconds?: number;
  collaborative_seconds?: number;
  idle_seconds?: number;
  declared_break_seconds?: number;
  off_system_seconds?: number;
  off_system_productive_seconds?: number;
  multitask_estimate_seconds?: number;
  efficiency_ratio?: number;
  /** 0–1 ou échelle contractuelle */
  fatigue_risk_score?: number;
  planning_alignment?: 'good' | 'medium' | 'poor' | 'unknown';
  hypotheses?: WorkforceInterpretationHypothesis[];
}
