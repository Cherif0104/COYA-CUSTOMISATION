import type { PlanningSlotType } from '../../types';

export const SLOT_TYPE_LABELS_FR: Record<PlanningSlotType, string> = {
  telework: 'Télétravail',
  onsite: 'Présentiel',
  leave: 'Congé',
  meeting: 'Réunion',
  modulation: 'Modulation',
  other: 'Autre',
};

export const SLOT_TYPE_LABELS_EN: Record<PlanningSlotType, string> = {
  telework: 'Remote',
  onsite: 'On-site',
  leave: 'Leave',
  meeting: 'Meeting',
  modulation: 'Modulation',
  other: 'Other',
};

/** Barres type MAKE FIGMA / Planification (pastilles couleur). */
export const SLOT_TYPE_BAR_CLASS: Record<PlanningSlotType, string> = {
  telework: 'bg-blue-500',
  onsite: 'bg-slate-600',
  leave: 'bg-amber-500',
  meeting: 'bg-violet-500',
  modulation: 'bg-cyan-500',
  other: 'bg-gray-400',
};

export const SLOT_TYPE_BORDER_L_CLASS: Record<PlanningSlotType, string> = {
  telework: 'border-l-blue-500',
  onsite: 'border-l-slate-600',
  leave: 'border-l-amber-500',
  meeting: 'border-l-violet-500',
  modulation: 'border-l-cyan-500',
  other: 'border-l-gray-400',
};

export const SLOT_TYPE_ICONS: Record<PlanningSlotType, string> = {
  telework: 'fas fa-laptop-house',
  onsite: 'fas fa-building',
  leave: 'fas fa-umbrella-beach',
  meeting: 'fas fa-video',
  modulation: 'fas fa-exchange-alt',
  other: 'fas fa-calendar-day',
};

/** Créneaux injectés automatiquement (tâches projet, demandes parc auto) — non modifiables dans le planning. */
export function isPlanningSlotAutoInjectedNotes(notes: string | undefined | null): boolean {
  const n = notes || '';
  return n.startsWith('COYA_TASK_SYNC:') || n.startsWith('COYA_VEHICLE_REQUEST:');
}
