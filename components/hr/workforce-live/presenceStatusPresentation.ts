import type { PresenceStatus } from '../../../types';

export function presenceStatusLabel(status: PresenceStatus | 'absent', fr: boolean): string {
  if (status === 'absent') return fr ? 'Absent' : 'Absent';
  if (status === 'in_meeting') return fr ? 'En réunion' : 'In meeting';
  if (status === 'pause' || status === 'pause_coffee' || status === 'pause_lunch') return fr ? 'En pause' : 'On break';
  if (status === 'brief_team') return fr ? 'Brief équipe' : 'Team brief';
  if (status === 'technical_issue') return fr ? 'Incident technique' : 'Technical issue';
  if (status === 'away_mission') return fr ? 'Mission extérieure' : 'Field work';
  return fr ? 'Présent' : 'Present';
}

export function presenceStatusBadgeClass(status: PresenceStatus | 'absent'): string {
  if (status === 'absent') return 'bg-red-100 text-red-700';
  if (status === 'in_meeting' || status === 'brief_team') return 'bg-blue-100 text-blue-700';
  if (status === 'pause' || status === 'pause_coffee' || status === 'pause_lunch') return 'bg-amber-100 text-amber-700';
  if (status === 'technical_issue') return 'bg-rose-100 text-rose-700';
  if (status === 'away_mission') return 'bg-purple-100 text-purple-700';
  return 'bg-emerald-100 text-emerald-700';
}
