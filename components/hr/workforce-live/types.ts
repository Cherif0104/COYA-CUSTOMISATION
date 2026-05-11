import type { PresenceStatus } from '../../../types';

/** Compteurs agrégés pour le hero live (RH-5.0). */
export type WorkforceLiveCounters = {
  present: number;
  pause: number;
  meeting: number;
  absent: number;
  technical: number;
  field: number;
};

export type WorkforceLiveTimelineEntry = {
  id: string;
  at: string;
  message: string;
  severity?: 'info' | 'warning' | 'danger';
};

export type WorkforceAlert = {
  id: string;
  label: string;
  severity: 'info' | 'warning' | 'danger';
};

export type DepartmentPresenceCard = {
  id: string;
  label: string;
  presentPct: number;
  absentCount: number;
  lateCount: number;
  overtimeStress?: boolean;
};

export type PresenceLiveGridRow = {
  profileId: string;
  displayName: string;
  currentStatus: PresenceStatus | 'absent';
  dayRate: number;
  todayWorkedSeconds: number;
  dailyTargetSeconds: number;
};
