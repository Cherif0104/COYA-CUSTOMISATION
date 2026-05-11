import type { ActivityVerb } from './types/workforceEvents';
import type { ActivityTimelineSegmentKind } from './types/sessionTimelineModel';

/**
 * Projection grossière événement → segment timeline (MVP).
 * Les segments « instantanés » utilisent ended_at = started_at ; la consolidation fusionne les plages réelles plus tard.
 */
export function segmentKindFromActivityVerb(verb: ActivityVerb): ActivityTimelineSegmentKind {
  switch (verb) {
    case 'presence_session_opened':
      return 'system_connected';
    case 'presence_session_closed':
      return 'off_system';
    case 'break_start':
      return 'declared_break';
    case 'break_end':
      return 'business_activity';
    case 'imputation_recorded':
      return 'productive_output';
    case 'task_completed':
      return 'productive_output';
    case 'clock_in':
      return 'system_connected';
    case 'clock_out':
      return 'off_system';
    case 'time_entry_started':
    case 'time_entry_stopped':
      return 'business_activity';
    case 'mission_started':
    case 'mission_check_in':
      return 'off_system_productive_context';
    case 'mission_ended':
    case 'mission_check_out':
      return 'business_activity';
    case 'task_focus_start':
    case 'task_focus_end':
      return 'productive_output';
    case 'timesheet_submitted':
      return 'business_activity';
    case 'timesheet_validated':
      return 'productive_output';
    default:
      return 'business_activity';
  }
}
