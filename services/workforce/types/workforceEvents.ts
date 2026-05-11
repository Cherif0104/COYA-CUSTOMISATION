/**
 * Contrat canonique « Activity Event » — Workforce Intelligence OS.
 * @see docs/HUMAN-CAPITAL-WORKFORCE-INTELLIGENCE-OS-ARCHITECTURE.md
 */

/** Dimension métier pour imputation / corrélation multi-modules */
export type WorkforceDimension =
  | 'project'
  | 'programme'
  | 'task'
  | 'client'
  | 'department'
  | 'objective';

/** Référence typée vers une entité métier (identifiant stable côté COYA) */
export interface WorkforceObjectRef {
  type: WorkforceDimension;
  id: string;
}

/**
 * Verbes MVP — couverture présence, temps, tâches, missions, feuilles de temps.
 * Extension future sans casser les consommateurs : élargir l’union uniquement.
 */
export type ActivityVerb =
  | 'clock_in'
  | 'clock_out'
  | 'break_start'
  | 'break_end'
  | 'presence_session_opened'
  | 'presence_session_closed'
  | 'time_entry_started'
  | 'time_entry_stopped'
  | 'task_focus_start'
  | 'task_focus_end'
  | 'task_completed'
  | 'mission_started'
  | 'mission_ended'
  | 'mission_check_in'
  | 'mission_check_out'
  | 'imputation_recorded'
  | 'timesheet_submitted'
  | 'timesheet_validated';

/** Données non destructrices associées à l’événement (garde volontairement réduit) */
export interface ActivityEventPayload {
  source?: string;
  metadata?: Record<string, string | number | boolean | null>;
  duration_seconds?: number;
  note?: string;
}

/** Traçabilité / chaîne d’audit (optionnel, Phase Enterprise) */
export interface ActivityEventIntegrity {
  device_id?: string;
  chain_prev_hash?: string;
  signature?: string;
}

export interface ActivityEvent {
  event_id: string;
  /** Horodatage ISO 8601 (UTC recommandé pour stockage) */
  occurred_at: string;
  actor_worker_id: string;
  verb: ActivityVerb;
  object_refs: WorkforceObjectRef[];
  payload?: ActivityEventPayload;
  integrity?: ActivityEventIntegrity;
}

/** Saisie avant normalisation (identifiants et date optionnels) */
export type ActivityEventInput = Omit<ActivityEvent, 'event_id' | 'occurred_at'> & {
  event_id?: string;
  occurred_at?: string;
};
