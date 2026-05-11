import type { PresenceStatus } from '../../../types';

/** Libellés « événement runtime » pour la timeline (mapping depuis statut segment — jusqu’au bus CLOCK_IN dédié). */
export function timelineMessageFromStatus(status: PresenceStatus, fr: boolean): string {
  switch (status) {
    case 'online':
    case 'present':
      return fr ? 'CONNEXION / PRÉSENT' : 'CLOCK_IN / PRESENT';
    case 'pause':
    case 'pause_coffee':
    case 'pause_lunch':
      return fr ? 'PAUSE' : 'BREAK';
    case 'in_meeting':
    case 'brief_team':
      return fr ? 'RÉUNION' : 'MEETING';
    case 'away_mission':
      return fr ? 'MISSION EXTÉRIEURE' : 'FIELD_WORK';
    case 'technical_issue':
      return fr ? 'INCIDENT TECHNIQUE' : 'TECH_ISSUE';
    case 'absent':
      return fr ? 'ABSENT / SORTIE' : 'ABSENT / CLOCK_OUT';
    default:
      return String(status).toUpperCase();
  }
}
