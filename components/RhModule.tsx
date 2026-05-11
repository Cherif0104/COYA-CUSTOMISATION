import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useModulePermissions } from '../hooks/useModulePermissions';
import {
  DEFAULT_PRESENCE_POLICY,
  HR_ATTENDANCE_POLICY_FORM_DEFAULT,
  LeaveRequest,
  User,
  Job,
  Employee,
  HrAbsenceEvent,
  HrAttendancePolicy,
  PresenceSession,
  PresenceStatus,
  PresenceStatusEvent,
} from '../types';
import DataAdapter from '../services/dataAdapter';
import OrganizationService from '../services/organizationService';
import LeaveManagement from './LeaveManagement';
import LeaveManagementAdmin from './LeaveManagementAdmin';
import PostesListReadOnly from './PostesListReadOnly';
import OrganigrammeView from './OrganigrammeView';
import PayrollTab from './PayrollTab';
import SalariésList from './SalariésList';
import EmployeeProfile from './EmployeeProfile';
import Jobs from './Jobs';
import PresenceEmployeeDetailPanel from './PresenceEmployeeDetailPanel';
import * as hrAnalyticsService from '../services/hrAnalyticsService';
import { usePresence } from '../contexts/PresenceContext';
import { DataService } from '../services/dataService';
import WorkJournalTab from './WorkJournalTab';
import { WorkforceLiveDashboard } from './hr/workforce-live';
import type { DepartmentPresenceCard, WorkforceAlert, WorkforceLiveTimelineEntry } from './hr/workforce-live';
import { timelineMessageFromStatus } from './hr/workforce-live/eventTimelineCopy';
import { WorkforceDayInterpretationPanel } from './hr/WorkforceDayInterpretationPanel';

function emptyAttendancePolicyDraft(): HrAttendancePolicy {
  return {
    ...HR_ATTENDANCE_POLICY_FORM_DEFAULT,
    id: '',
    organizationId: '',
  };
}

export type RhTab =
  | 'workforce_live'
  | 'employees'
  | 'time_attendance'
  | 'journal'
  | 'leave'
  | 'postes'
  | 'organigramme'
  | 'payroll'
  | 'jobs';

interface RhModuleProps {
  leaveRequests: LeaveRequest[];
  users: User[];
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  setView: (view: string) => void;
  onAddLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateLeaveRequest: (id: string, status: 'approved' | 'rejected', reason?: string) => Promise<void>;
  onUpdateLeaveDates?: (id: string, startDate: string, endDate: string, reason: string) => Promise<void>;
  onDeleteLeaveRequest: (id: string) => Promise<void>;
  isLoading?: boolean;
  loadingOperation?: string | null;
  /** Ouvre la coquille workspace salarié `/hr/employees/:profileId` (RH-4). */
  onOpenEmployeeWorkspace?: (profileId: string) => void;
  /** UI compacte (ex. intégration Planning) */
  embedded?: boolean;
  /** Onglet synchronisé depuis le parent (Planning) ; masque la barre d’onglets RH si défini */
  planningEmbedTab?: RhTab | null;
}

const SLA_DAYS_WARNING = 2;

type PresenceLiveRow = {
  profileId: string;
  displayName: string;
  currentStatus: PresenceStatus | 'absent';
  lastConnectionAt: string | null;
  /** Secondes effectives (plage 9h–19h locale, pauses déduites, hors absent) */
  hourWorkedSeconds: number;
  todayWorkedSeconds: number;
  weekWorkedSeconds: number;
  monthWorkedSeconds: number;
  dailyTargetSeconds: number;
  weekTargetSeconds: number;
  monthTargetSeconds: number;
  dayRate: number;
  todayPresentSeconds: number;
  todayPauseSeconds: number;
  todayIncoherenceSeconds: number;
  /** Segment de statut encore ouvert (pas de ended_at) pour afficher la durée live */
  openStatusSegment: PresenceStatusEvent | null;
};

const RhModule: React.FC<RhModuleProps> = ({
  leaveRequests,
  users,
  jobs,
  setJobs,
  setView,
  onAddLeaveRequest,
  onUpdateLeaveRequest,
  onUpdateLeaveDates,
  onDeleteLeaveRequest,
  isLoading,
  loadingOperation,
  onOpenEmployeeWorkspace,
  embedded = false,
  planningEmbedTab = null,
}) => {
  const { t, language } = useLocalization();
  const { canAccessModule, hasPermission } = useModulePermissions();
  const [activeTab, setActiveTab] = useState<RhTab>('workforce_live');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { currentSession } = usePresence();
  const [presencePeriod, setPresencePeriod] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [presenceMetrics, setPresenceMetrics] = useState<ReturnType<typeof hrAnalyticsService.computePresenceMetrics>>([]);
  const [absenceEvents, setAbsenceEvents] = useState<HrAbsenceEvent[]>([]);
  const [absenceProfileId, setAbsenceProfileId] = useState('');
  const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().slice(0, 10));
  const [absenceDuration, setAbsenceDuration] = useState('480');
  const [absenceAuthorized, setAbsenceAuthorized] = useState(true);
  const [absenceReason, setAbsenceReason] = useState('');
  const [policy, setPolicy] = useState<HrAttendancePolicy | null>(null);
  const [rhOrganizationId, setRhOrganizationId] = useState<string | null>(null);
  const [policySaving, setPolicySaving] = useState(false);
  const [userIdByProfile, setUserIdByProfile] = useState<Record<string, string>>({});
  const [complianceRows, setComplianceRows] = useState<hrAnalyticsService.PresenceComplianceMetric[]>([]);
  const [presenceSessions, setPresenceSessions] = useState<PresenceSession[]>([]);
  const [presenceStatusEvents, setPresenceStatusEvents] = useState<PresenceStatusEvent[]>([]);
  const [historyUserProfileId, setHistoryUserProfileId] = useState<string>('');
  const [historyRangeMode, setHistoryRangeMode] = useState<'day' | 'month' | 'all'>('month');
  const [historyFilterDay, setHistoryFilterDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [historyFilterMonth, setHistoryFilterMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [historyStatusFilter, setHistoryStatusFilter] = useState<PresenceStatus | 'all'>('all');
  const [historyLiveTick, setHistoryLiveTick] = useState(0);
  const [detailSessions, setDetailSessions] = useState<PresenceSession[]>([]);
  const [detailStatusEvents, setDetailStatusEvents] = useState<PresenceStatusEvent[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [presenceDetailOpen, setPresenceDetailOpen] = useState(false);
  const [presenceDetailInitialProfile, setPresenceDetailInitialProfile] = useState<string>('');
  const [selectedEmployeeSheet, setSelectedEmployeeSheet] = useState<Employee | null>(null);
  const [employeeListVersion, setEmployeeListVersion] = useState(0);
  const fr = language === 'fr';
  const selectedProfileIdForJournal = historyUserProfileId || (selectedEmployeeSheet?.profileId ? String(selectedEmployeeSheet.profileId) : '');

  useEffect(() => {
    const id = window.setInterval(() => setHistoryLiveTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const loadEmployees = useCallback(async () => {
    const orgId = await OrganizationService.getCurrentUserOrganizationId();
    const list = await DataAdapter.listEmployees(orgId ?? undefined);
    setEmployees(list ?? []);
  }, []);
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  /**
   * Roster Workforce Live : fiches `employees` + utilisateurs org. (`users`) sans ligne HR.
   * Les `users` sont déjà filtrés côté App/RLS ; on n’invente pas de profils distants.
   * Sans fiche `employees`, cibles présence / paie restent les défauts org. (pas `expectedDailyMinutes` perso).
   */
  const workforceLiveRosterEntries = useMemo(() => {
    const fromEmployees = employees.map((e) => ({ profileId: String(e.profileId), employee: e }));
    const seen = new Set(fromEmployees.map((r) => r.profileId));
    const extras: { profileId: string; employee: Employee | null }[] = [];
    for (const u of users) {
      const pid = u.profileId != null ? String(u.profileId) : '';
      if (!pid || seen.has(pid)) continue;
      seen.add(pid);
      extras.push({ profileId: pid, employee: null });
    }
    return [...fromEmployees, ...extras];
  }, [employees, users]);

  useEffect(() => {
    if (planningEmbedTab) setActiveTab(planningEmbedTab);
  }, [planningEmbedTab]);

  const sessionById = useMemo(() => {
    const m = new Map<string, PresenceSession>();
    (presenceSessions || []).forEach((s) => m.set(String(s.id), s));
    return m;
  }, [presenceSessions]);

  const loadPresenceAndAbsences = useCallback(async () => {
    const orgId = await OrganizationService.getCurrentUserOrganizationId();
    if (!orgId) return;
    setRhOrganizationId(orgId);
    const [sessions, absences, loadedPolicy, profileRows, statusEvents] = await Promise.all([
      DataAdapter.getPresenceSessions({ organizationId: orgId }),
      hrAnalyticsService.listHrAbsenceEvents(orgId),
      DataAdapter.getHrAttendancePolicy(orgId),
      DataService.getProfiles(),
      DataAdapter.listPresenceStatusEvents({ organizationId: orgId, defaultRecentWindow: true }),
    ]);
    const profileRowsList = (profileRows.data ?? []) as Array<{ id?: string; user_id?: string }>;
    const profileMap = profileRowsList.reduce<Record<string, string>>((acc, row) => {
      if (row?.id && row?.user_id) acc[String(row.id)] = String(row.user_id);
      return acc;
    }, {});
    setUserIdByProfile(profileMap);
    setPresenceSessions(sessions || []);
    setPresenceStatusEvents(statusEvents || []);
    // Même liste de profils que la grille live + conformité paie période (incl. org users sans fiche HR).
    const rosterProfileIds = workforceLiveRosterEntries.map((r) => r.profileId);
    const metrics = hrAnalyticsService.computePresenceMetrics({
      sessions: sessions || [],
      profileIds: rosterProfileIds,
      period: presencePeriod,
      userIdByProfile: profileMap,
    });
    setPresenceMetrics(metrics);
    setPolicy(loadedPolicy);
    setAbsenceEvents(absences);
    const bounds = hrAnalyticsService.getPayrollPeriodBounds(new Date(), loadedPolicy?.payrollPeriodStartDay ?? 1);
    const compliance = hrAnalyticsService.computePresenceCompliance({
      workforceRoster: workforceLiveRosterEntries,
      sessions: sessions || [],
      statusEvents: statusEvents || [],
      absences,
      policy: loadedPolicy,
      userIdByProfile: profileMap,
      periodStart: bounds.start.toISOString().slice(0, 10),
      periodEnd: bounds.end.toISOString().slice(0, 10),
    });
    setComplianceRows(compliance);
  }, [workforceLiveRosterEntries, presencePeriod]);

  const loadPresenceDetailForRange = useCallback(async (fromIso: string, toIso: string) => {
    const orgId = await OrganizationService.getCurrentUserOrganizationId();
    if (!orgId) return;
    setDetailLoading(true);
    const from = `${fromIso}T00:00:00.000`;
    const to = `${toIso}T23:59:59.999`;
    try {
      const [sessions, evts] = await Promise.all([
        DataAdapter.getPresenceSessions({ organizationId: orgId, from, to }),
        DataAdapter.listPresenceStatusEvents({
          organizationId: orgId,
          from,
          to,
          defaultRecentWindow: false,
        }),
      ]);
      setDetailSessions(sessions || []);
      setDetailStatusEvents(evts || []);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const livePresenceRows = useMemo<PresenceLiveRow[]>(() => {
    const now = new Date();
    const nowMs = now.getTime();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayOfWeek = (now.getDay() + 6) % 7;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).getTime();
    const orgDailyMinutes = Math.max(1, policy?.expectedDailyMinutes ?? 540);

    const openSegmentByUserId = new Map<string, PresenceStatusEvent>();
    (presenceStatusEvents || []).forEach((evt) => {
      if (!evt.endedAt) openSegmentByUserId.set(String(evt.userId), evt);
    });

    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    return workforceLiveRosterEntries.map(({ profileId: profileIdRaw, employee }) => {
      const profileId = String(profileIdRaw);
      const linkedUser = users.find((u) => String((u as any).profileId || '') === profileId);
      const authUserId =
        userIdByProfile[profileId] || (linkedUser?.id != null ? String(linkedUser.id) : profileId);
      const sessions = presenceSessions
        .filter((s) => String(s.userId) === authUserId)
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      const active = sessions.find((s) => !s.endedAt && hrAnalyticsService.presenceStatusCountsTowardDuration(s.status));
      const latest = sessions[0];
      const displayName = linkedUser?.fullName || linkedUser?.name || linkedUser?.email || profileId.slice(0, 8);

      const dailyTargetSeconds = Math.max(60, (employee?.expectedDailyMinutes ?? orgDailyMinutes) * 60);
      const weekTargetSeconds = hrAnalyticsService.ATTENDANCE_WEEKLY_TARGET_SECONDS;
      const monthTargetSeconds = Math.max(
        60,
        hrAnalyticsService.expectedWeeklyScaledHoursBetween(startOfMonth, endOfMonth) * 3600,
      );

      const hourWorkedSeconds = hrAnalyticsService.computeEffectiveWorkedSecondsFromSessions(
        presenceSessions,
        authUserId,
        startOfHour,
        nowMs,
        nowMs,
      );
      const todayWorkedSeconds = hrAnalyticsService.computeEffectiveWorkedSecondsFromSessions(
        presenceSessions,
        authUserId,
        startOfDay,
        nowMs,
        nowMs,
      );
      const weekWorkedSeconds = hrAnalyticsService.computeEffectiveWorkedSecondsFromSessions(
        presenceSessions,
        authUserId,
        startOfWeek,
        nowMs,
        nowMs,
      );
      const monthWorkedSeconds = hrAnalyticsService.computeEffectiveWorkedSecondsFromSessions(
        presenceSessions,
        authUserId,
        startOfMonth,
        endOfMonth,
        nowMs,
      );

      const dayRate = Math.min(100, dailyTargetSeconds > 0 ? (todayWorkedSeconds / dailyTargetSeconds) * 100 : 0);

      const breakdown = hrAnalyticsService.computeDailyPresenceBreakdown({
        events: presenceStatusEvents || [],
        dateIso: todayIso,
        userId: authUserId,
        nowMs,
        sessionById,
      });
      const split = hrAnalyticsService.computeDailyQuotaSplitFromBreakdown(breakdown, dailyTargetSeconds);

      return {
        profileId,
        displayName,
        currentStatus: (active?.status || 'absent') as PresenceStatus | 'absent',
        lastConnectionAt: latest?.startedAt || null,
        hourWorkedSeconds,
        todayWorkedSeconds,
        weekWorkedSeconds,
        monthWorkedSeconds,
        dailyTargetSeconds,
        weekTargetSeconds,
        monthTargetSeconds,
        dayRate,
        todayPresentSeconds: split.presentSeconds,
        todayPauseSeconds: split.pauseSeconds,
        todayIncoherenceSeconds: split.incoherenceSeconds,
        openStatusSegment: openSegmentByUserId.get(String(authUserId)) || null,
      };
    });
  }, [
    workforceLiveRosterEntries,
    presenceSessions,
    presenceStatusEvents,
    userIdByProfile,
    policy?.expectedDailyMinutes,
    users,
    sessionById,
    historyLiveTick,
  ]);

  const profileIdByUserId = useMemo(() => {
    const reverse: Record<string, string> = {};
    Object.entries(userIdByProfile).forEach(([profileId, userId]) => {
      reverse[String(userId)] = String(profileId);
    });
    return reverse;
  }, [userIdByProfile]);

  const historyRangeBoundsMs = useMemo(() => {
    if (historyRangeMode === 'day') {
      const [y, m, d] = historyFilterDay.split('-').map(Number);
      const start = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
      const end = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
      return { startMs: start, endMs: end };
    }
    if (historyRangeMode === 'month') {
      const [y, m] = historyFilterMonth.split('-').map(Number);
      const start = new Date(y, m - 1, 1, 0, 0, 0, 0).getTime();
      const end = new Date(y, m, 0, 23, 59, 59, 999).getTime();
      return { startMs: start, endMs: end };
    }
    return { startMs: 0, endMs: Date.now() + 86400000 };
  }, [historyRangeMode, historyFilterDay, historyFilterMonth]);

  const eventOverlapsHistoryRange = useCallback((evt: PresenceStatusEvent) => {
    const s = new Date(evt.startedAt).getTime();
    const e = evt.endedAt ? new Date(evt.endedAt).getTime() : Date.now();
    return s < historyRangeBoundsMs.endMs && e > historyRangeBoundsMs.startMs;
  }, [historyRangeBoundsMs.endMs, historyRangeBoundsMs.startMs]);

  const statusHistoryRows = useMemo(() => {
    const base = (presenceStatusEvents || []).map((evt) => {
      const profileId = profileIdByUserId[String(evt.userId)] || '';
      const linkedUser = users.find((u) => String((u as any).profileId || '') === profileId);
      return {
        ...evt,
        profileId,
        displayName: linkedUser?.fullName || linkedUser?.name || linkedUser?.email || profileId || String(evt.userId).slice(0, 8),
      };
    });
    let filtered = base.filter((r) => eventOverlapsHistoryRange(r));
    if (historyUserProfileId) {
      filtered = filtered.filter((r) => r.profileId === historyUserProfileId);
    }
    if (historyStatusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === historyStatusFilter);
    }
    return filtered.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [
    presenceStatusEvents,
    profileIdByUserId,
    users,
    historyUserProfileId,
    historyStatusFilter,
    eventOverlapsHistoryRange,
    historyLiveTick,
  ]);

  const pauseOverrunRows = useMemo(
    () => hrAnalyticsService.listPauseOverrunEvents(statusHistoryRows, DEFAULT_PRESENCE_POLICY.maxPauseMinutes, sessionById),
    [statusHistoryRows, sessionById],
  );

  const dailyCategoryOrder: hrAnalyticsService.DailyPresenceCategory[] = ['productive', 'meeting', 'pause', 'mission', 'absent', 'technical'];
  const dailyCatLabel = useCallback(
    (cat: hrAnalyticsService.DailyPresenceCategory) =>
      fr ? hrAnalyticsService.DAILY_PRESENCE_CATEGORY_LABELS_FR[cat] : hrAnalyticsService.DAILY_PRESENCE_CATEGORY_LABELS_EN[cat],
    [fr]
  );

  const dailyBreakdownView = useMemo(() => {
    if (historyRangeMode !== 'day') return null;
    const dateIso = historyFilterDay;
    const nowMs = Date.now();
    if (historyUserProfileId) {
      const uid = userIdByProfile[historyUserProfileId];
      if (!uid) return { kind: 'single' as const, missingLink: true, dateIso, profileId: historyUserProfileId };
      const b = hrAnalyticsService.computeDailyPresenceBreakdown({
        events: presenceStatusEvents || [],
        dateIso,
        userId: uid,
        nowMs,
        sessionById,
      });
      return { kind: 'single' as const, missingLink: false, dateIso, profileId: historyUserProfileId, ...b };
    }
    const rows = employees
      .map((emp) => {
        const profileId = String(emp.profileId);
        const uid = userIdByProfile[profileId];
        if (!uid) return null;
        const b = hrAnalyticsService.computeDailyPresenceBreakdown({
          events: presenceStatusEvents || [],
          dateIso,
          userId: uid,
          nowMs,
          sessionById,
        });
        const linkedUser = users.find((u) => String((u as any).profileId || '') === profileId);
        const displayName = linkedUser?.fullName || linkedUser?.name || linkedUser?.email || profileId.slice(0, 8);
        return { profileId, displayName, ...b };
      })
      .filter(Boolean) as Array<{
        profileId: string;
        displayName: string;
        categories: Record<hrAnalyticsService.DailyPresenceCategory, number>;
        totalSeconds: number;
        totalSecondsIncludingAbsent: number;
        pauseSegmentCount: number;
        pauseSegmentsOverTwoMinutes: number;
      }>;
    return { kind: 'all' as const, dateIso, rows };
  }, [
    historyRangeMode,
    historyFilterDay,
    historyUserProfileId,
    presenceStatusEvents,
    userIdByProfile,
    employees,
    users,
    historyLiveTick,
    sessionById,
  ]);

  const formatSegmentDuration = useCallback(
    (evt: PresenceStatusEvent) => {
      if (!hrAnalyticsService.presenceStatusCountsTowardDuration(evt.status)) return '—';
      const nowMs = Date.now();
      let sec = hrAnalyticsService.presenceEventDurationSeconds(evt, nowMs, sessionById);
      const isOpen = !evt.endedAt;
      let capped = false;
      if (isOpen && sec > hrAnalyticsService.PRESENCE_OPEN_SEGMENT_DISPLAY_CAP_SECONDS) {
        sec = hrAnalyticsService.PRESENCE_OPEN_SEGMENT_DISPLAY_CAP_SECONDS;
        capped = true;
      }
      const base =
        sec >= 3600
          ? hrAnalyticsService.formatWorkedSecondsClockCompact(sec, fr)
          : (() => {
              const m = Math.floor(sec / 60);
              const s = sec % 60;
              return fr ? `${m} min ${String(s).padStart(2, '0')} s` : `${m}m ${String(s).padStart(2, '0')}s`;
            })();
      if (capped) return fr ? `${base} (ouvert, plaf.)` : `${base} (open, cap)`;
      return base;
    },
    [fr, sessionById, historyLiveTick],
  );

  /** Détail périodes + ventilation (infobulle tableau principal). */
  const livePresenceTooltip = useCallback(
    (row: PresenceLiveRow) => {
      const line = (label: string, value: string) => `${label}: ${value}`;
      return [
        line(fr ? 'Cette heure' : 'This hour', hrAnalyticsService.formatWorkedSecondsClockCompact(row.hourWorkedSeconds, fr)),
        line(fr ? 'Semaine' : 'Week', hrAnalyticsService.formatWorkedVsTargetSeconds(row.weekWorkedSeconds, row.weekTargetSeconds, fr, row.dailyTargetSeconds)),
        line(fr ? 'Mois' : 'Month', hrAnalyticsService.formatWorkedVsTargetSeconds(row.monthWorkedSeconds, row.monthTargetSeconds, fr, row.dailyTargetSeconds)),
        '—',
        line(fr ? 'Présent' : 'Present', hrAnalyticsService.formatWorkedSecondsClockCompact(row.todayPresentSeconds, fr)),
        line(fr ? 'Pauses' : 'Breaks', hrAnalyticsService.formatWorkedSecondsClockCompact(row.todayPauseSeconds, fr)),
        line(fr ? 'Écart' : 'Gap', hrAnalyticsService.formatWorkedSecondsClockCompact(row.todayIncoherenceSeconds, fr)),
      ].join('\n');
    },
    [fr],
  );

  const formatDelayReadable = useCallback((minutes: number) => {
    if (minutes <= 0) return fr ? '0 min' : '0 min';
    if (minutes < 60) return fr ? `${minutes} min` : `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return fr ? `${h} h ${m} min` : `${h}h ${m}m`;
  }, [fr]);

  const exportHistoryCsv = useCallback(() => {
    const sep = ';';
    const nowMs = Date.now();
    const head = ['Salarié', 'Statut', 'Début', 'Fin', 'Durée', 'Source'];
    const lines = statusHistoryRows.map((row) => {
      let sec = hrAnalyticsService.presenceEventDurationSeconds(row, nowMs, sessionById);
      if (!row.endedAt && sec > hrAnalyticsService.PRESENCE_OPEN_SEGMENT_DISPLAY_CAP_SECONDS) {
        sec = hrAnalyticsService.PRESENCE_OPEN_SEGMENT_DISPLAY_CAP_SECONDS;
      }
      const parts = hrAnalyticsService.secondsToHmsParts(sec);
      const dur = hrAnalyticsService.formatHmsFrench(parts);
      return [
        row.displayName,
        row.status,
        row.startedAt,
        row.endedAt || '',
        dur,
        row.source || '',
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(sep);
    });
    const blob = new Blob([head.join(sep) + '\n' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `historique_presence_${historyFilterDay || historyFilterMonth}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [statusHistoryRows, historyFilterDay, historyFilterMonth, sessionById, historyLiveTick]);

  const statusLabel = useCallback((status: PresenceStatus | 'absent') => {
    if (status === 'absent') return fr ? 'Absent' : 'Absent';
    if (status === 'in_meeting') return fr ? 'En réunion' : 'In meeting';
    if (status === 'pause' || status === 'pause_coffee' || status === 'pause_lunch') return fr ? 'En pause' : 'On break';
    if (status === 'brief_team') return fr ? 'Brief équipe' : 'Team brief';
    if (status === 'technical_issue') return fr ? 'Incident technique' : 'Technical issue';
    if (status === 'away_mission') return fr ? 'Mission' : 'Mission';
    return fr ? 'Présent' : 'Present';
  }, [fr]);

  const statusBadgeClass = useCallback((status: PresenceStatus | 'absent') => {
    if (status === 'absent') return 'bg-red-100 text-red-700';
    if (status === 'in_meeting' || status === 'brief_team') return 'bg-blue-100 text-blue-700';
    if (status === 'pause' || status === 'pause_coffee' || status === 'pause_lunch') return 'bg-amber-100 text-amber-700';
    if (status === 'technical_issue') return 'bg-rose-100 text-rose-700';
    if (status === 'away_mission') return 'bg-purple-100 text-purple-700';
    return 'bg-emerald-100 text-emerald-700';
  }, []);

  const formatDateTime = useCallback((iso: string | null | undefined) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(fr ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [fr]);

  const displayNameByProfileId = useMemo(() => {
    const m: Record<string, string> = {};
    users.forEach((u: any) => {
      const pid = u.profileId;
      if (pid) m[String(pid)] = u.fullName || u.name || u.email || String(pid).slice(0, 8);
    });
    return m;
  }, [users]);

  const workforceGridRows = useMemo(
    () =>
      livePresenceRows.map((r) => ({
        profileId: r.profileId,
        displayName: r.displayName,
        currentStatus: r.currentStatus,
        dayRate: r.dayRate,
        todayWorkedSeconds: r.todayWorkedSeconds,
        dailyTargetSeconds: r.dailyTargetSeconds,
      })),
    [livePresenceRows],
  );

  const workforceTimelineEntries = useMemo((): WorkforceLiveTimelineEntry[] => {
    const sorted = [...(presenceStatusEvents || [])].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
    return sorted.slice(0, 40).map((evt) => {
      const pid = profileIdByUserId[String(evt.userId)] || '';
      const name = displayNameByProfileId[pid] || String(evt.userId).slice(0, 6);
      const t = new Date(evt.startedAt).toLocaleTimeString(fr ? 'fr-FR' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const msg = timelineMessageFromStatus(evt.status, fr);
      return {
        id: evt.id,
        at: t,
        message: `${name} — ${msg}`,
        severity: evt.status === 'technical_issue' ? ('warning' as const) : ('info' as const),
      };
    });
  }, [presenceStatusEvents, profileIdByUserId, displayNameByProfileId, fr]);

  const workforceDepartmentCards = useMemo((): DepartmentPresenceCard[] => {
    const labels = fr ? ['Pôle Opérations', 'Pôle Support', 'Pôle Produit'] : ['Operations', 'Support', 'Product'];
    const chunkSize = Math.max(1, Math.ceil(livePresenceRows.length / 3) || 1);
    return labels.map((label, i) => {
      const slice = livePresenceRows.slice(i * chunkSize, (i + 1) * chunkSize);
      const n = slice.length || 1;
      const presentNow = slice.filter((r) => ['online', 'present'].includes(r.currentStatus)).length;
      const absentCount = slice.filter((r) => r.currentStatus === 'absent').length;
      const lateCount = slice.filter((r) => r.dayRate < 70 && r.currentStatus !== 'absent').length;
      const presentPct = Math.round((presentNow / n) * 100);
      const overtimeStress = slice.some((r) => r.monthWorkedSeconds > 50 * 3600);
      return { id: String(i), label, presentPct, absentCount, lateCount, overtimeStress };
    });
  }, [livePresenceRows, fr]);

  const payrollWorkedRows = useMemo(
    () =>
      hrAnalyticsService.listPayrollPeriodWorkedRows({
        employees,
        sessions: presenceSessions,
        policy,
        userIdByProfile,
        displayNameByProfileId,
      }),
    [employees, presenceSessions, policy, userIdByProfile, displayNameByProfileId],
  );

  const payrollPeriodBounds = useMemo(
    () => hrAnalyticsService.getPayrollPeriodBounds(new Date(), policy?.payrollPeriodStartDay ?? 1),
    [policy?.payrollPeriodStartDay],
  );
  const payrollPeriodStartStr = payrollPeriodBounds.start.toISOString().slice(0, 10);
  const payrollPeriodEndStr = payrollPeriodBounds.end.toISOString().slice(0, 10);

  const presenceMetricsEnriched = useMemo(() => {
    const orgDailyMinutes = Math.max(1, policy?.expectedDailyMinutes ?? 540);
    const bounds = hrAnalyticsService.periodBounds(presencePeriod);
    const startIso = hrAnalyticsService.toLocalDateIso(bounds.start);
    const endIso = hrAnalyticsService.toLocalDateIso(bounds.end);
    const dayCount = hrAnalyticsService.enumerateLocalDateIsoInclusive(startIso, endIso).length;
    const skipRollup = dayCount > 62 || !presenceSessions.length;
    return presenceMetrics.map((m) => {
      if (skipRollup) return { ...m, workedDayCount: undefined, avgHoursPerWorkedDay: undefined };
      const emp = employees.find((e) => String(e.profileId) === String(m.profileId));
      const authUserId = userIdByProfile[m.profileId] || m.profileId;
      const dailyTargetSeconds = Math.max(60, (emp?.expectedDailyMinutes ?? orgDailyMinutes) * 60);
      const series = hrAnalyticsService.computePresenceDailySeries({
        sessions: presenceSessions,
        authUserId,
        startDateIso: startIso,
        endDateIso: endIso,
        dailyTargetSeconds,
        nowMs: Date.now(),
      });
      const roll = hrAnalyticsService.summarizePresenceDailySeries(series);
      return {
        ...m,
        workedDayCount: roll.workedDayCount,
        avgHoursPerWorkedDay: roll.avgHoursPerWorkedDay,
      };
    });
  }, [presenceMetrics, presenceSessions, presencePeriod, employees, policy, userIdByProfile]);

  const exportAssiduityRollupCsv = useCallback(() => {
    const orgDailyMinutes = Math.max(1, policy?.expectedDailyMinutes ?? 540);
    const bounds = hrAnalyticsService.periodBounds(presencePeriod);
    const startIso = hrAnalyticsService.toLocalDateIso(bounds.start);
    const endIso = hrAnalyticsService.toLocalDateIso(bounds.end);
    const rows: hrAnalyticsService.PresenceRollupCsvRow[] = presenceMetrics.map((m) => {
      const emp = employees.find((e) => String(e.profileId) === String(m.profileId));
      const authUserId = userIdByProfile[m.profileId] || m.profileId;
      const dailyTargetSeconds = Math.max(60, (emp?.expectedDailyMinutes ?? orgDailyMinutes) * 60);
      const series = hrAnalyticsService.computePresenceDailySeries({
        sessions: presenceSessions,
        authUserId,
        startDateIso: startIso,
        endDateIso: endIso,
        dailyTargetSeconds,
        nowMs: Date.now(),
      });
      const roll = hrAnalyticsService.summarizePresenceDailySeries(series);
      const proj = hrAnalyticsService.projectPeriodCompletionFromDailySeries(series);
      const displayName = displayNameByProfileId[m.profileId] || m.profileId.slice(0, 8);
      return {
        displayName,
        profileId: m.profileId,
        ...roll,
        projectedAssiduityPct: proj.projectedAssiduityPct,
      };
    });
    const csv = hrAnalyticsService.buildPresenceRollupMultiCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `assiduite_recap_${presencePeriod}_${startIso}_${endIso}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [presenceMetrics, presenceSessions, presencePeriod, employees, policy, userIdByProfile, displayNameByProfileId]);

  const liveCounters = useMemo(() => {
    const present = livePresenceRows.filter((r) => ['online', 'present'].includes(r.currentStatus)).length;
    const meeting = livePresenceRows.filter((r) => ['in_meeting', 'brief_team'].includes(r.currentStatus)).length;
    const pause = livePresenceRows.filter((r) => ['pause', 'pause_coffee', 'pause_lunch'].includes(r.currentStatus)).length;
    const absent = livePresenceRows.filter((r) => r.currentStatus === 'absent').length;
    const technical = livePresenceRows.filter((r) => r.currentStatus === 'technical_issue').length;
    const field = livePresenceRows.filter((r) => r.currentStatus === 'away_mission').length;
    return { present, meeting, pause, absent, technical, field };
  }, [livePresenceRows]);

  /** Présence / politique / absences : chargées dès l’org connue, même sans ligne `employees` (sinon Temps & Présence et politique restaient vides). */
  useEffect(() => {
    void loadPresenceAndAbsences();
  }, [employees, loadPresenceAndAbsences]);

  const showSalaries = canAccessModule('rh');
  const showLeave = canAccessModule('leave_management') || canAccessModule('leave_management_admin');
  const showPostes = canAccessModule('postes_management');
  const showOrganigramme = canAccessModule('organization_management');
  const showPayroll = canAccessModule('rh') && hasPermission('rh', 'read');
  const showJobs = canAccessModule('jobs');

  const tabs: { id: RhTab; label: string; show: boolean }[] = [
    { id: 'workforce_live', label: fr ? 'Workforce Live' : 'Workforce Live', show: showSalaries },
    { id: 'employees', label: fr ? 'Employés' : 'Employees', show: showSalaries },
    { id: 'time_attendance', label: fr ? 'Temps & Présence' : 'Time & attendance', show: showSalaries },
    { id: 'journal', label: fr ? 'Journal du jour' : 'Daily journal', show: showSalaries },
    { id: 'leave', label: fr ? 'Congés' : 'Leave', show: showLeave },
    { id: 'postes', label: fr ? 'Fiche poste' : 'Job profile', show: showPostes },
    { id: 'organigramme', label: fr ? 'Organigramme' : 'Org chart', show: showOrganigramme },
    { id: 'payroll', label: fr ? 'Paie' : 'Payroll', show: showPayroll },
    { id: 'jobs', label: fr ? 'Offres d\'emploi' : 'Job offers', show: showJobs },
  ];

  const visibleTabs = tabs.filter(tab => tab.show);
  const tabForContent = visibleTabs[0]?.id ?? 'workforce_live';
  const currentTab = visibleTabs.some(t => t.id === activeTab) ? activeTab : tabForContent;

  const pendingLeaves = leaveRequests.filter(r => r.status === 'pending');

  const workforceAlerts = useMemo((): WorkforceAlert[] => {
    const out: WorkforceAlert[] = [];
    const hour = new Date().getHours();
    if (hour >= 10) {
      const thin = livePresenceRows.filter(
        (r) => r.todayWorkedSeconds < 120 && r.currentStatus !== 'absent' && ['online', 'present'].includes(r.currentStatus),
      ).length;
      if (thin > 0) {
        out.push({
          id: 'thin-clock',
          severity: 'warning',
          label: fr
            ? `${thin} salarié(s) avec très peu de temps comptabilisé ce matin`
            : `${thin} employee(s) with almost no time counted this morning`,
        });
      }
    }
    const highDelay = complianceRows.filter((r) => r.delayMinutes >= 60).length;
    if (highDelay > 0) {
      out.push({
        id: 'delays',
        severity: 'warning',
        label: fr
          ? `${highDelay} profil(s) avec retards cumulés élevés (période)`
          : `${highDelay} profile(s) with high cumulative delays (period)`,
      });
    }
    if (pendingLeaves.length > 0) {
      out.push({
        id: 'leave-pending',
        severity: 'info',
        label: fr
          ? `${pendingLeaves.length} demande(s) de congé en attente`
          : `${pendingLeaves.length} leave request(s) pending`,
      });
    }
    const noShow = livePresenceRows.filter((r) => r.currentStatus === 'absent').length;
    if (noShow > 0) {
      out.push({
        id: 'absent',
        severity: 'info',
        label: fr ? `${noShow} absent(s) au moment T` : `${noShow} absent now`,
      });
    }
    return out.slice(0, 8);
  }, [livePresenceRows, complianceRows, pendingLeaves, fr]);

  const pendingOverSla = pendingLeaves.filter(r => {
    const created = r.createdAt ? new Date(r.createdAt).getTime() : 0;
    const days = (Date.now() - created) / (24 * 60 * 60 * 1000);
    return days >= SLA_DAYS_WARNING;
  });
  const approvedCount = leaveRequests.filter(r => r.status === 'approved').length;
  const rejectedCount = leaveRequests.filter(r => r.status === 'rejected').length;

  return (
    <div
      className={
        embedded
          ? 'max-w-none mx-auto px-0 py-1 text-gray-900'
          : 'p-6 space-y-6 text-gray-900'
      }
    >
      {!embedded && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-gray-900">
              {fr ? 'Ressources Humaines' : 'Human resources'}
            </h2>
            <p className="text-gray-500 text-sm">
              {fr
                ? 'Workforce Live en premier : statuts temps réel, anomalies, puis employés, temps & présence, congés, paie.'
                : 'Workforce Live first: real-time status and alerts, then employees, time & attendance, leave, payroll.'}
            </p>
          </div>
        </div>
      )}

      {!planningEmbedTab && (
        <div
          className={
            embedded
              ? 'bg-white rounded-xl border border-slate-200 p-1 mb-3 inline-flex flex-wrap gap-0.5'
              : 'bg-white rounded-2xl border border-slate-200 p-1.5 mb-6 inline-flex flex-wrap gap-1'
          }
        >
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl font-medium transition-all ${
                embedded ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm'
              } ${
                currentTab === tab.id
                  ? 'bg-coya-green text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              aria-label={tab.label}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {currentTab === 'workforce_live' && (
        <WorkforceLiveDashboard
          fr={fr}
          counters={liveCounters}
          timelineEntries={workforceTimelineEntries}
          alerts={workforceAlerts}
          departments={workforceDepartmentCards}
          gridRows={workforceGridRows}
          presenceGridEmptyLabel={
            fr
              ? 'Aucun collaborateur (fiches salariés + utilisateurs org. visibles).'
              : 'No roster (HR employee rows + visible org users).'
          }
          onRefresh={loadPresenceAndAbsences}
          onOpenTimeAttendance={() => setActiveTab('time_attendance')}
          onRowAnalysis={(profileId) => {
            setPresenceDetailInitialProfile(profileId);
            setPresenceDetailOpen(true);
          }}
        />
      )}

      {currentTab === 'employees' && (
        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">{fr ? 'Liste des salariés' : 'Employees list'}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {fr
                  ? 'Utilisez « Associer un utilisateur » pour créer une fiche, puis « Fiche salarié » pour renseigner poste, taux horaire, CNSS, etc.'
                  : 'Use « Associate user » to create a record, then « Employee record » to edit position, hourly rate, CNSS, etc.'}
              </p>
            </div>
            <div className="p-4">
              <SalariésList
                users={users}
                listVersion={employeeListVersion}
                onSelectEmployee={(emp) => setSelectedEmployeeSheet(emp)}
                onOpenWorkspace={
                  onOpenEmployeeWorkspace
                    ? (emp) => {
                        if (emp.profileId) onOpenEmployeeWorkspace(String(emp.profileId));
                      }
                    : undefined
                }
                onEmployeesMutated={loadEmployees}
              />
            </div>
          </section>
          {selectedEmployeeSheet ? (
            <EmployeeProfile
              platformUsers={users}
              selectedEmployee={selectedEmployeeSheet}
              onClearSelection={() => setSelectedEmployeeSheet(null)}
              onSaved={() => {
                setEmployeeListVersion((n) => n + 1);
                loadEmployees();
              }}
            />
          ) : (
            <p className="text-sm text-slate-500 px-1">
              {fr
                ? 'Sélectionnez un salarié dans le tableau (colonne Actions → Fiche salarié) pour afficher et modifier sa fiche.'
                : 'Pick an employee in the table (Actions → Employee record) to view and edit their HR record.'}
            </p>
          )}
        </div>
      )}

      {currentTab === 'time_attendance' && (
        <section className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950">
            <p className="font-semibold">{fr ? 'Temps & Présence — vue analytique' : 'Time & attendance — analytical view'}</p>
            <p className="mt-1 text-emerald-900/90">
              {fr
                ? 'Le cockpit temps réel (compteurs, grille live, timeline) est sur l’onglet **Workforce Live**. Ici : politiques, historiques, exports et indicateurs de période.'
                : 'The real-time cockpit (counters, live grid, timeline) is on **Workforce Live**. Here: policies, history, exports and period metrics.'}
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('workforce_live')}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
            >
              {fr ? 'Ouvrir Workforce Live' : 'Open Workforce Live'}
            </button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{fr ? 'Indicateurs par période' : 'Period indicators'}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{fr ? 'Vue d’ensemble assiduité (hors détail temps réel ci-dessous).' : 'Assiduity overview (separate from live table below).'}</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={presencePeriod} onChange={(e) => setPresencePeriod(e.target.value as any)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="day">{fr ? 'Jour' : 'Day'}</option>
                <option value="week">{fr ? 'Semaine' : 'Week'}</option>
                <option value="month">{fr ? 'Mois' : 'Month'}</option>
                <option value="quarter">{fr ? 'Trimestre' : 'Quarter'}</option>
                <option value="year">{fr ? 'Année' : 'Year'}</option>
              </select>
              <button type="button" onClick={loadPresenceAndAbsences} className="px-3 py-2 rounded-lg bg-coya-green text-white text-sm hover:bg-coya-institutional-secondary">{fr ? 'Actualiser' : 'Refresh'}</button>
            </div>
          </div>
          <details className="bg-white rounded-xl border border-slate-200 overflow-hidden group">
            <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-slate-800 hover:bg-slate-50 list-none flex items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
              <span>{fr ? 'Politique présence & paie (optionnel)' : 'Attendance & payroll policy (optional)'}</span>
              <span className="text-slate-400 text-xs font-normal group-open:hidden">{fr ? 'Afficher' : 'Show'}</span>
              <span className="text-slate-400 text-xs font-normal hidden group-open:inline">{fr ? 'Masquer' : 'Hide'}</span>
            </summary>
            <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="number"
                min={1}
                max={28}
                value={policy?.payrollPeriodStartDay ?? 1}
                onChange={(e) => setPolicy((prev) => ({ ...(prev || emptyAttendancePolicyDraft()), payrollPeriodStartDay: Number(e.target.value || 1) }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder={fr ? 'Début mois comptable (1-28)' : 'Accounting month start (1-28)'}
              />
              <input
                type="number"
                min={0}
                value={policy?.monthlyDelayToleranceMinutes ?? 45}
                onChange={(e) => setPolicy((prev) => ({ ...(prev || emptyAttendancePolicyDraft()), monthlyDelayToleranceMinutes: Number(e.target.value || 0) }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder={fr ? 'Tolérance retard mensuelle (min)' : 'Monthly delay tolerance (min)'}
              />
              <input
                type="number"
                min={0}
                value={policy?.monthlyUnjustifiedAbsenceToleranceMinutes ?? 480}
                onChange={(e) => setPolicy((prev) => ({ ...(prev || emptyAttendancePolicyDraft()), monthlyUnjustifiedAbsenceToleranceMinutes: Number(e.target.value || 0) }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder={fr ? 'Tolérance absence injustifiée (min/mois)' : 'Unauthorized absence tolerance (min/month)'}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="number"
                min={60}
                value={policy?.expectedDailyMinutes ?? 480}
                onChange={(e) => setPolicy((prev) => ({ ...(prev || emptyAttendancePolicyDraft()), expectedDailyMinutes: Number(e.target.value || 480) }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder={fr ? 'Minutes prévues/jour' : 'Expected minutes/day'}
              />
              <input
                title={fr ? 'Début journée attendu' : 'Expected day start'}
                type="time"
                value={(policy?.expectedWorkStartTime || '09:00:00').slice(0, 5)}
                onChange={(e) => setPolicy((prev) => ({ ...(prev || emptyAttendancePolicyDraft()), expectedWorkStartTime: `${e.target.value}:00` }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                title={fr ? 'Fin journée attendue' : 'Expected day end'}
                type="time"
                value={(policy?.expectedWorkEndTime || '17:00:00').slice(0, 5)}
                onChange={(e) => setPolicy((prev) => ({ ...(prev || emptyAttendancePolicyDraft()), expectedWorkEndTime: `${e.target.value}:00` }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <input
                title={fr ? 'Fin matinée (obligation présence)' : 'Morning segment end'}
                type="time"
                value={(policy?.morningSegmentEndTime || '12:00:00').slice(0, 5)}
                onChange={(e) => setPolicy((prev) => ({ ...(prev || emptyAttendancePolicyDraft()), morningSegmentEndTime: `${e.target.value}:00` }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                title={fr ? 'Début pause déjeuner' : 'Lunch start'}
                type="time"
                value={(policy?.lunchStartTime || '13:00:00').slice(0, 5)}
                onChange={(e) => setPolicy((prev) => ({ ...(prev || emptyAttendancePolicyDraft()), lunchStartTime: `${e.target.value}:00` }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                title={fr ? 'Fin pause déjeuner' : 'Lunch end'}
                type="time"
                value={(policy?.lunchEndTime || '14:00:00').slice(0, 5)}
                onChange={(e) => setPolicy((prev) => ({ ...(prev || emptyAttendancePolicyDraft()), lunchEndTime: `${e.target.value}:00` }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                title={fr ? 'Reprise après-midi obligatoire' : 'Afternoon presence from'}
                type="time"
                value={(policy?.afternoonPresenceDeadlineTime || '14:00:00').slice(0, 5)}
                onChange={(e) => setPolicy((prev) => ({ ...(prev || emptyAttendancePolicyDraft()), afternoonPresenceDeadlineTime: `${e.target.value}:00` }))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="rounded-lg bg-slate-900 text-white text-sm px-3 py-2 disabled:opacity-60"
                disabled={policySaving}
                onClick={async () => {
                  const orgId = await OrganizationService.getCurrentUserOrganizationId();
                  if (!orgId) return;
                  setPolicySaving(true);
                  const payload = policy ?? emptyAttendancePolicyDraft();
                  const saved = await DataAdapter.upsertHrAttendancePolicy({ ...payload, organizationId: orgId });
                  if (saved) setPolicy(saved);
                  setPolicySaving(false);
                  await loadPresenceAndAbsences();
                }}
              >
                {policySaving ? (fr ? 'Enregistrement…' : 'Saving…') : (fr ? 'Sauvegarder politique' : 'Save policy')}
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <input
                id="enforceIp"
                type="checkbox"
                checked={policy?.enforceOfficeIp === true}
                onChange={(e) => setPolicy((prev) => ({ ...(prev || emptyAttendancePolicyDraft()), enforceOfficeIp: e.target.checked }))}
              />
              <label htmlFor="enforceIp">{fr ? 'Bloquer les sessions "bureau" hors IP autorisées' : 'Block "office" sessions outside allowed IPs'}</label>
            </div>
            </div>
          </details>
          <WorkforceDayInterpretationPanel
            fr={fr}
            organizationId={rhOrganizationId}
            policy={policy}
            sessions={presenceSessions}
            employees={employees}
            users={users}
            userIdByProfile={userIdByProfile}
            canManage={hasPermission('rh', 'write')}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setPresenceDetailInitialProfile('');
                setPresenceDetailOpen(true);
              }}
              className="text-sm px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
            >
              {fr ? 'Analyse salarié (tous)' : 'Employee analysis (all)'}
            </button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-md font-semibold text-slate-900">{fr ? 'Historique des statuts' : 'Status history'}</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    {fr
                      ? 'Durées lisibles ; segments ouverts plafonnés si non clôturés. « Absent » ne compte pas comme temps travaillé.'
                      : 'Readable durations; open segments capped if not closed. « Absent » does not count as worked time.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={exportHistoryCsv}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 hover:bg-slate-50"
                >
                  {fr ? 'Exporter CSV' : 'Export CSV'}
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-3 border border-slate-100 rounded-lg p-2 max-h-64 overflow-y-auto">
                  <p className="text-xs font-semibold text-slate-500 uppercase px-2 py-1">{fr ? 'Salariés' : 'Staff'}</p>
                  <button
                    type="button"
                    onClick={() => setHistoryUserProfileId('')}
                    className={`w-full text-left px-2 py-2 rounded-md text-sm ${!historyUserProfileId ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}
                  >
                    {fr ? 'Tous (filtres ci-dessous)' : 'Everyone (use filters)'}
                  </button>
                  {employees.map((emp) => {
                    const linkedUser = users.find((u) => String((u as any).profileId || '') === String(emp.profileId));
                    const name = linkedUser?.fullName || linkedUser?.name || linkedUser?.email || String(emp.profileId).slice(0, 8);
                    const sel = historyUserProfileId === String(emp.profileId);
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => setHistoryUserProfileId(String(emp.profileId))}
                        className={`w-full text-left px-2 py-2 rounded-md text-sm truncate ${sel ? 'bg-emerald-700 text-white' : 'hover:bg-slate-50'}`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
                <div className="lg:col-span-9 space-y-3">
                  <div className="flex flex-wrap gap-2 items-end">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">{fr ? 'Période' : 'Period'}</label>
                      <select
                        value={historyRangeMode}
                        onChange={(e) => setHistoryRangeMode(e.target.value as 'day' | 'month' | 'all')}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="day">{fr ? 'Jour précis' : 'Specific day'}</option>
                        <option value="month">{fr ? 'Mois précis' : 'Specific month'}</option>
                        <option value="all">{fr ? 'Tout l’historique chargé' : 'All loaded history'}</option>
                      </select>
                    </div>
                    {historyRangeMode === 'day' && (
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">{fr ? 'Date' : 'Date'}</label>
                        <input
                          type="date"
                          value={historyFilterDay}
                          onChange={(e) => setHistoryFilterDay(e.target.value)}
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    )}
                    {historyRangeMode === 'month' && (
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">{fr ? 'Mois' : 'Month'}</label>
                        <input
                          type="month"
                          value={historyFilterMonth}
                          onChange={(e) => setHistoryFilterMonth(e.target.value)}
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">{fr ? 'Statut' : 'Status'}</label>
                      <select
                        value={historyStatusFilter}
                        onChange={(e) => setHistoryStatusFilter(e.target.value as PresenceStatus | 'all')}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="all">{fr ? 'Tous' : 'All'}</option>
                        <option value="online">{fr ? 'Présent / en ligne' : 'Online'}</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="pause">Pause</option>
                        <option value="pause_coffee">{fr ? 'Pause café' : 'Coffee break'}</option>
                        <option value="pause_lunch">{fr ? 'Pause déjeuner' : 'Lunch'}</option>
                        <option value="in_meeting">{fr ? 'Réunion' : 'Meeting'}</option>
                        <option value="brief_team">Brief</option>
                        <option value="away_mission">{fr ? 'Mission' : 'Mission'}</option>
                        <option value="technical_issue">{fr ? 'Incident tech.' : 'Tech issue'}</option>
                      </select>
                    </div>
                  </div>
                  {pauseOverrunRows.length > 0 && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                      <strong>{fr ? 'Pauses dépassant' : 'Pauses over'} {DEFAULT_PRESENCE_POLICY.maxPauseMinutes} min :</strong>{' '}
                      {pauseOverrunRows.length}{' '}
                      {fr ? 'segment(s) dans la période sélectionnée.' : 'segment(s) in the selected period.'}
                    </div>
                  )}
                  {dailyBreakdownView && (
                    <details className="rounded-xl border border-slate-200 bg-slate-50/80 overflow-hidden group">
                      <summary className="px-3 py-2.5 cursor-pointer text-sm font-semibold text-slate-900 hover:bg-slate-100/80 list-none flex items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                        <span>
                          {fr ? 'Détail par catégorie (jour)' : 'Category breakdown (day)'}
                          <span className="font-normal text-slate-500"> — {dailyBreakdownView.dateIso}</span>
                        </span>
                        <span className="text-xs font-normal text-slate-400">{fr ? 'Afficher / masquer' : 'Show / hide'}</span>
                      </summary>
                      <div className="px-3 pb-3 pt-0 space-y-3 border-t border-slate-200/80">
                      {dailyBreakdownView.kind === 'single' && dailyBreakdownView.missingLink && (
                        <p className="text-sm text-amber-800">{fr ? 'Profil sans user_id : impossible d’agréger les segments.' : 'Profile has no linked user_id.'}</p>
                      )}
                      {dailyBreakdownView.kind === 'single' && !dailyBreakdownView.missingLink && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-800">
                            {users.find((u) => String((u as any).profileId || '') === dailyBreakdownView.profileId)?.fullName ||
                              users.find((u) => String((u as any).profileId || '') === dailyBreakdownView.profileId)?.name ||
                              dailyBreakdownView.profileId.slice(0, 8)}
                          </p>
                          <div className="flex flex-wrap gap-3 items-baseline">
                            <div>
                              <span className="text-xs uppercase text-slate-500 block">{fr ? 'Temps suivi (hors absent)' : 'Tracked (excl. absent)'}</span>
                              <span className="font-mono text-sm font-semibold text-slate-900">
                                {hrAnalyticsService.formatHmsFrench(hrAnalyticsService.secondsToHmsParts(dailyBreakdownView.totalSeconds))}
                              </span>
                            </div>
                            {dailyBreakdownView.totalSecondsIncludingAbsent > dailyBreakdownView.totalSeconds && (
                              <div>
                                <span className="text-xs uppercase text-slate-500 block">{fr ? 'Dont absent' : 'Including absent'}</span>
                                <span className="font-mono text-xs text-slate-600">
                                  {hrAnalyticsService.formatHmsFrench(
                                    hrAnalyticsService.secondsToHmsParts(
                                      dailyBreakdownView.totalSecondsIncludingAbsent - dailyBreakdownView.totalSeconds,
                                    ),
                                  )}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-xs uppercase text-slate-500 block">{fr ? 'Pauses (segments)' : 'Break segments'}</span>
                              <span className="font-mono text-sm text-slate-800">
                                {dailyBreakdownView.pauseSegmentCount}
                                {fr ? ' · ' : ' · '}
                                <span className="text-slate-600">
                                  {fr
                                    ? `${dailyBreakdownView.pauseSegmentsOverTwoMinutes} > 2 min`
                                    : `${dailyBreakdownView.pauseSegmentsOverTwoMinutes} over 2 min`}
                                </span>
                              </span>
                            </div>
                          </div>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            {dailyCategoryOrder.map((cat) => (
                              <li key={cat} className="flex justify-between gap-2 border border-slate-100 rounded-lg bg-white px-2 py-1.5">
                                <span className="text-slate-600">{dailyCatLabel(cat)}</span>
                                <span className="font-mono text-slate-900">
                                  {hrAnalyticsService.formatHmsFrench(hrAnalyticsService.secondsToHmsParts(dailyBreakdownView.categories[cat]))}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {dailyBreakdownView.kind === 'all' && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs sm:text-sm min-w-[640px]">
                            <thead>
                              <tr className="border-b border-slate-200 text-left text-slate-600">
                                <th className="py-2 pr-2">{fr ? 'Salarié' : 'Employee'}</th>
                                <th className="py-2 pr-2 font-mono whitespace-nowrap">{fr ? 'Suivi (hors absent)' : 'Tracked (excl. absent)'}</th>
                                <th className="py-2 pr-2 font-mono whitespace-nowrap">{fr ? 'Pauses' : 'Breaks'}</th>
                                {dailyCategoryOrder.map((cat) => (
                                  <th key={cat} className="py-2 pr-2 font-mono whitespace-nowrap">
                                    {dailyCatLabel(cat)}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {dailyBreakdownView.rows.map((r) => (
                                <tr key={r.profileId} className="border-b border-slate-100">
                                  <td className="py-2 pr-2">{r.displayName}</td>
                                  <td className="py-2 pr-2 font-mono">
                                    {hrAnalyticsService.formatHmsFrench(hrAnalyticsService.secondsToHmsParts(r.totalSeconds))}
                                  </td>
                                  <td className="py-2 pr-2 font-mono text-xs whitespace-nowrap" title={fr ? 'Segments pause / &gt; 2 min' : 'Pause segments / over 2 min'}>
                                    {r.pauseSegmentCount}
                                    <span className="text-slate-500"> / {r.pauseSegmentsOverTwoMinutes}</span>
                                  </td>
                                  {dailyCategoryOrder.map((cat) => (
                                    <td key={cat} className="py-2 pr-2 font-mono whitespace-nowrap">
                                      {hrAnalyticsService.formatHmsFrench(hrAnalyticsService.secondsToHmsParts(r.categories[cat]))}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {dailyBreakdownView.rows.length === 0 && (
                            <p className="text-sm text-slate-500 py-2">{fr ? 'Aucun salarié lié ou pas de segments ce jour-là.' : 'No linked employees or no segments that day.'}</p>
                          )}
                        </div>
                      )}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left">{fr ? 'Salarié' : 'Employee'}</th>
                    <th className="px-4 py-3 text-left">{fr ? 'Statut' : 'Status'}</th>
                    <th className="px-4 py-3 text-left">{fr ? 'Début' : 'Start'}</th>
                    <th className="px-4 py-3 text-left">{fr ? 'Fin' : 'End'}</th>
                    <th className="px-4 py-3 text-right">{fr ? 'Durée (précise)' : 'Duration (precise)'}</th>
                    <th className="px-4 py-3 text-left">{fr ? 'Source' : 'Source'}</th>
                  </tr>
                </thead>
                <tbody>
                  {statusHistoryRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100">
                      <td className="px-4 py-3">{row.displayName}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadgeClass(row.status as PresenceStatus)}`}>
                          {statusLabel(row.status as PresenceStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(row.startedAt)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(row.endedAt ?? null)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{formatSegmentDuration(row)}</td>
                      <td className="px-4 py-3 text-slate-600">{row.source || 'system'}</td>
                    </tr>
                  ))}
                  {statusHistoryRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        {fr
                          ? 'Aucun segment dans cette période. Choisissez un salarié ou élargissez les filtres.'
                          : 'No segments in this period. Pick an employee or widen filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <details className="bg-white rounded-xl border border-slate-200 overflow-hidden group">
            <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-slate-900 hover:bg-slate-50 list-none flex items-center justify-between gap-2 border-b border-slate-200 [&::-webkit-details-marker]:hidden">
              <span>{fr ? 'Assiduité, paie et absences (déplier si besoin)' : 'Assiduity, payroll & absences (expand if needed)'}</span>
              <span className="text-xs font-normal text-slate-400">{fr ? 'Ouvrir' : 'Open'}</span>
            </summary>
            <div className="p-4 space-y-4 border-t border-slate-100">
            <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200">
              <p className="text-xs text-slate-500">
                {fr ? 'Selon la période choisie en haut de page (jour / semaine / mois…).' : 'Uses the period selected at the top of this tab.'}
              </p>
              <button
                type="button"
                onClick={exportAssiduityRollupCsv}
                className="text-xs px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100"
              >
                {fr ? 'Export CSV récap (tous)' : 'Export CSV summary (all)'}
              </button>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">{fr ? 'Salarié' : 'Employee'}</th>
                  <th className="px-4 py-3 text-right">{fr ? 'J. trav.' : 'Days'}</th>
                  <th className="px-4 py-3 text-right">{fr ? 'Moy. h/j' : 'Avg h/d'}</th>
                  <th className="px-4 py-3 text-right">{fr ? 'Réalisé' : 'Done'}</th>
                  <th className="px-4 py-3 text-right">{fr ? 'Prévu' : 'Target'}</th>
                  <th className="px-4 py-3 text-right">{fr ? 'Taux' : 'Rate'}</th>
                </tr>
              </thead>
              <tbody>
                {presenceMetricsEnriched.map((m) => {
                  const name = displayNameByProfileId[m.profileId] || m.profileId.slice(0, 8);
                  return (
                    <tr key={m.profileId} className="border-b border-slate-100">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{name}</span>
                        <button
                          type="button"
                          className="block text-[11px] text-emerald-700 hover:underline mt-0.5"
                          onClick={() => {
                            setPresenceDetailInitialProfile(m.profileId);
                            setPresenceDetailOpen(true);
                          }}
                        >
                          {fr ? 'Analyse & export…' : 'Analysis & export…'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-800">
                        {m.workedDayCount == null ? '—' : m.workedDayCount}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-800">
                        {m.avgHoursPerWorkedDay == null ? '—' : `${m.avgHoursPerWorkedDay.toFixed(1)} h`}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-800">{m.totalHours.toFixed(1)} h</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">{m.expectedHours.toFixed(1)} h</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${m.assiduityRate >= 90 ? 'bg-emerald-100 text-emerald-700' : m.assiduityRate >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {m.assiduityRate.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {presenceMetricsEnriched.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{fr ? 'Aucune donnée de présence.' : 'No attendance data.'}</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-900">{fr ? 'Contrôle paie (mois comptable)' : 'Payroll check (accounting month)'}</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">{fr ? 'Salarié' : 'Employee'}</th>
                  <th className="px-4 py-3 text-right">{fr ? 'Déco.' : 'Out'}</th>
                  <th className="px-4 py-3 text-right">{fr ? 'Retard' : 'Late'}</th>
                  <th className="px-4 py-3 text-right">{fr ? 'Abs. NA' : 'Unauth.'}</th>
                  <th className="px-4 py-3 text-right">{fr ? 'Payable' : 'Payable'}</th>
                  <th className="px-4 py-3 text-right">{fr ? 'Montant' : 'Amount'}</th>
                </tr>
              </thead>
              <tbody>
                {complianceRows.map((row) => {
                  const displayUser = users.find((u) => String((u as any).profileId || '') === row.profileId);
                  return (
                    <tr key={row.profileId} className="border-b border-slate-100">
                      <td className="px-4 py-3">{displayUser?.fullName || displayUser?.name || row.profileId.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.disconnectCount}</td>
                      <td className="px-4 py-3 text-right text-sm" title={`${row.delayMinutes} min`}>{formatDelayReadable(row.delayMinutes)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.unauthorizedAbsenceMinutes}</td>
                      <td className="px-4 py-3 text-right font-mono">{(row.paidMinutes / 60).toFixed(1)} h</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{row.payableAmount.toLocaleString()} XOF</td>
                    </tr>
                  );
                })}
                {complianceRows.length === 0 && (
                  <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={6}>{fr ? 'Aucun indicateur de conformité.' : 'No compliance metric yet.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-900">
                {fr ? 'Base rémunération' : 'Pay base'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {fr
                  ? `Période comptable · heures paie = minutes ÷ ${hrAnalyticsService.PAYROLL_MINUTES_PER_PAID_HOUR} · montant = heures × taux fiche salarié.`
                  : `Accounting period · pay hours = minutes ÷ ${hrAnalyticsService.PAYROLL_MINUTES_PER_PAID_HOUR} · amount = hours × employee rate.`}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left">{fr ? 'Salarié' : 'Employee'}</th>
                    <th className="px-4 py-3 text-left">{fr ? 'Période' : 'Period'}</th>
                    <th className="px-4 py-3 text-right">{fr ? 'Temps' : 'Time'}</th>
                    <th className="px-4 py-3 text-right">{fr ? 'H. paie' : 'Pay h.'}</th>
                    <th className="px-4 py-3 text-right">{fr ? 'Jours' : 'Days'}</th>
                    <th className="px-4 py-3 text-right">{fr ? 'Taux' : 'Rate'}</th>
                    <th className="px-4 py-3 text-right">{fr ? 'Montant' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollWorkedRows.map((row) => (
                    <tr key={row.profileId} className="border-b border-slate-100">
                      <td className="px-4 py-3">{row.displayName}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{row.periodLabel}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {row.workedSeconds >= 72 * 3600
                          ? hrAnalyticsService.formatWorkedSecondsAsDayAndClock(row.workedSeconds, fr)
                          : hrAnalyticsService.formatHmsFrench(hrAnalyticsService.secondsToHmsParts(row.workedSeconds))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{row.payableHours.toFixed(3)} h</td>
                      <td className="px-4 py-3 text-right">{row.distinctWorkDays}</td>
                      <td className="px-4 py-3 text-right font-mono">{row.hourlyRate.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono">{row.estimatedPay.toLocaleString()} XOF</td>
                    </tr>
                  ))}
                  {payrollWorkedRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        {fr ? 'Aucun salarié ou pas de sessions sur la période.' : 'No employees or no sessions in period.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 space-y-3 bg-slate-50/30">
            <h3 className="text-sm font-semibold text-slate-900">{fr ? 'Absence codifiée' : 'Record absence'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <select value={absenceProfileId} onChange={(e) => setAbsenceProfileId(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">{fr ? 'Salarié' : 'Employee'}</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.profileId}>
                    {displayNameByProfileId[e.profileId] || e.profileId.slice(0, 8)}
                  </option>
                ))}
              </select>
              <input type="date" value={absenceDate} onChange={(e) => setAbsenceDate(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              <input type="number" value={absenceDuration} onChange={(e) => setAbsenceDuration(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="minutes" />
              <select value={absenceAuthorized ? 'yes' : 'no'} onChange={(e) => setAbsenceAuthorized(e.target.value === 'yes')} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="yes">{fr ? 'Autorisée' : 'Authorized'}</option>
                <option value="no">{fr ? 'Non autorisée' : 'Unauthorized'}</option>
              </select>
              <button
                type="button"
                className="rounded-lg bg-slate-900 text-white text-sm px-3 py-2"
                onClick={async () => {
                  const orgId = await OrganizationService.getCurrentUserOrganizationId();
                  if (!orgId || !absenceProfileId) return;
                  await hrAnalyticsService.createHrAbsenceEvent({
                    organizationId: orgId,
                    profileId: absenceProfileId,
                    absenceDate,
                    durationMinutes: Number(absenceDuration || 0),
                    isAuthorized: absenceAuthorized,
                    reason: absenceReason || null,
                    createdById: currentSession?.userId || null,
                  });
                  setAbsenceReason('');
                  await loadPresenceAndAbsences();
                }}
              >
                {fr ? 'Enregistrer' : 'Save'}
              </button>
            </div>
            <input value={absenceReason} onChange={(e) => setAbsenceReason(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder={fr ? 'Motif' : 'Reason'} />
            <div className="text-xs text-slate-500">
              {fr ? 'Récent : ' : 'Recent: '}
              {absenceEvents.slice(0, 5).map((a) => `${a.absenceDate} (${a.isAuthorized ? 'A' : 'NA'})`).join(', ') || '—'}
            </div>
          </div>
            </div>
          </details>
          <PresenceEmployeeDetailPanel
            open={presenceDetailOpen}
            onClose={() => setPresenceDetailOpen(false)}
            fr={fr}
            employees={employees}
            userIdByProfile={userIdByProfile}
            displayNameByProfileId={displayNameByProfileId}
            policy={policy}
            detailSessions={detailSessions}
            detailStatusEvents={detailStatusEvents}
            detailLoading={detailLoading}
            onLoadRange={loadPresenceDetailForRange}
            initialProfileId={presenceDetailInitialProfile || undefined}
          />
        </section>
      )}

      {currentTab === 'journal' && (
        <section className="space-y-4 bg-white rounded-xl border border-slate-200 p-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{fr ? 'Journal du jour' : 'Daily journal'}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {fr
                ? 'Synthèse par jour (temps projet, planning, présence) + preuves (URL Drive, capture, etc.). Sélectionne un salarié (onglet Salariés) pour ajouter des preuves.'
                : 'Daily summary (project time, planning, attendance) + proofs (Drive URL, screenshot, etc.). Select an employee (Employees tab) to add proofs.'}
            </p>
          </div>
          <WorkJournalTab profileId={selectedProfileIdForJournal || undefined} />
        </section>
      )}

      {currentTab === 'leave' && (
        <div className="space-y-6">
          {showLeave && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">{fr ? 'Total demandes' : 'Total requests'}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{leaveRequests.length}</p>
              </div>
              <div className="rounded-xl border border-amber-200/70 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">{fr ? 'En attente' : 'Pending'}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{pendingLeaves.length}</p>
              </div>
              <div className="rounded-xl border border-emerald-200/70 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">{fr ? 'Approuvées' : 'Approved'}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{approvedCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">{fr ? 'Rejetées' : 'Rejected'}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{rejectedCount}</p>
              </div>
            </div>
          )}
          {pendingOverSla.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 flex items-center gap-2">
              <i className="fas fa-exclamation-triangle text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                {fr ? `${pendingOverSla.length} demande(s) en attente depuis plus de ${SLA_DAYS_WARNING} jours (SLA).` : `${pendingOverSla.length} request(s) pending for over ${SLA_DAYS_WARNING} days (SLA).`}
              </span>
            </div>
          )}
          {canAccessModule('leave_management') && (
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">
                  {fr ? 'Mes demandes de congés' : 'My leave requests'}
                </h2>
              </div>
              <div className="p-4">
                <LeaveManagement
                  leaveRequests={leaveRequests}
                  users={users}
                  onAddLeaveRequest={onAddLeaveRequest}
                  onUpdateLeaveRequest={onUpdateLeaveRequest}
                  onDeleteLeaveRequest={onDeleteLeaveRequest}
                />
              </div>
            </section>
          )}
          {canAccessModule('leave_management_admin') && (
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-6">
              <div className="px-4 py-3 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">
                  {fr ? 'Validation / Liste des demandes' : 'Approval / Request list'}
                </h2>
              </div>
              <div className="p-4">
                <LeaveManagementAdmin
                  leaveRequests={leaveRequests}
                  users={users}
                  onUpdateLeaveRequest={onUpdateLeaveRequest}
                  onUpdateLeaveDates={onUpdateLeaveDates}
                  onDeleteLeaveRequest={onDeleteLeaveRequest}
                />
              </div>
            </section>
          )}
        </div>
      )}

      {currentTab === 'postes' && (
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">{fr ? 'Référentiel des postes' : 'Postes reference'}</h2>
          </div>
          <div className="p-4">
            <PostesListReadOnly compact={embedded} />
          </div>
        </section>
      )}

      {currentTab === 'organigramme' && (
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">{fr ? 'Organigramme' : 'Organization chart'}</h2>
          </div>
          <div className="p-4">
            <OrganigrammeView />
          </div>
        </section>
      )}

      {currentTab === 'payroll' && (
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">{fr ? 'Paie' : 'Payroll'}</h2>
          </div>
          <div className="p-4">
            <PayrollTab
              users={users}
              employees={employees}
              periodStart={payrollPeriodStartStr}
              periodEnd={payrollPeriodEndStr}
              periodLabel={payrollPeriodBounds.label}
              canWriteRh={hasPermission('rh', 'write')}
            />
          </div>
        </section>
      )}

      {currentTab === 'jobs' && (
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4">
            <Jobs jobs={jobs} setJobs={setJobs} setView={setView} />
          </div>
        </section>
      )}
    </div>
  );
};

export default RhModule;
