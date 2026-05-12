import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContextSupabase';
import { useLocalization } from '../contexts/LocalizationContext';
import {
  Job,
  LeaveRequest,
  Meeting,
  Language,
  PlanningSlot,
  PlanningSlotType,
  Role,
  User,
  PLANNING_ORG_SCOPE_ROLES,
  PLANNING_SWAP_APPROVER_ROLES,
} from '../types';
import DataAdapter from '../services/dataAdapter';
import { DataService } from '../services/dataService';
import OrganizationService from '../services/organizationService';
import ConfirmationModal from './common/ConfirmationModal';
import { PlanningItineraryFigmaView, type PlanningItineraryViewMode } from './planning/PlanningItineraryFigmaView';
import { toYMD, monthRangeYmd } from '../services/planning/calendarLayout';
import { timeToMinutes, minutesToHHmm } from '../services/planning/dayTimelineLayout';
import {
  SLOT_TYPE_LABELS_FR,
  SLOT_TYPE_LABELS_EN,
  SLOT_TYPE_ICONS,
  isPlanningSlotAutoInjectedNotes,
} from '../services/planning/planningConstants';

/** La grille « Équipe et planification » charge tout le monde ; la vue Gantt limite les lignes pour la perf. */
const PLANNING_GANTT_MAX_MEMBERS = 48;

function getWeekBounds(d: Date): { start: Date; end: Date } {
  const start = new Date(d);
  const day = start.getDay();
  const diff = start.getDate() - (day === 0 ? 6 : day - 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/** Réunions → créneaux synthétiques (même forme que planning_slots pour vues unifiées). */
function isSlotAutoSyncedFromTask(s: PlanningSlot) {
  return isPlanningSlotAutoInjectedNotes(s.notes);
}

function meetingsToPlanningSlots(meetings: Meeting[], userId: string, ymdFrom: string, ymdTo: string): PlanningSlot[] {
  const out: PlanningSlot[] = [];
  const pad = (n: number) => String(n).padStart(2, '0');
  const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  for (const m of meetings) {
    const org = String(m.organizerId);
    const att = (m.attendees || []).map((u) => String(u.id));
    if (org !== userId && !att.includes(userId)) continue;
    const start = new Date(m.startTime);
    const end = new Date(m.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
    const slotDate = toYMD(start);
    if (slotDate < ymdFrom || slotDate > ymdTo) continue;
    out.push({
      id: `meeting-${m.id}`,
      userId,
      slotDate,
      slotType: 'meeting',
      startTime: hhmm(start),
      endTime: hhmm(end),
      title: m.title,
      meetingId: String(m.id),
    });
  }
  return out;
}

/** Données & callbacks RH branchés depuis App (congés, salariés, offres) */
export type PlanningRhBridgeProps = {
  leaveRequests: LeaveRequest[];
  users: User[];
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  onAddLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateLeaveRequest: (id: string, status: 'approved' | 'rejected', reason?: string) => Promise<void>;
  onUpdateLeaveDates?: (id: string, startDate: string, endDate: string, reason: string) => Promise<void>;
  onDeleteLeaveRequest: (id: string) => Promise<void>;
  isLoading?: boolean;
  loadingOperation?: string | null;
};

interface PlanningProps {
  meetings?: Meeting[];
  setView?: (view: string) => void;
  rh?: PlanningRhBridgeProps | null;
}

type PlanningNavTab = 'hub' | 'my_schedule' | 'team_board' | 'marketplace' | 'conflicts';

const NAV_TABS: { id: PlanningNavTab; icon: string; labelFr: string; labelEn: string }[] = [
  { id: 'hub', icon: 'fas fa-grip-horizontal', labelFr: 'Pilotage', labelEn: 'Command center' },
  { id: 'my_schedule', icon: 'fas fa-calendar-week', labelFr: 'Planification semaine', labelEn: 'Weekly schedule' },
  { id: 'team_board', icon: 'fas fa-users-cog', labelFr: 'Équipe et planification', labelEn: 'Team & scheduling' },
  { id: 'marketplace', icon: 'fas fa-people-arrows', labelFr: 'Changements et échanges', labelEn: 'Changes & swaps' },
  { id: 'conflicts', icon: 'fas fa-exclamation-triangle', labelFr: 'Conflits', labelEn: 'Conflicts' },
];

const Planning: React.FC<PlanningProps> = ({ meetings = [], setView, rh }) => {
  const { language } = useLocalization();
  const isFr = language === Language.FR;
  const SLOT_TYPE_LABELS = useMemo(() => (isFr ? SLOT_TYPE_LABELS_FR : SLOT_TYPE_LABELS_EN), [isFr]);
  const { user } = useAuth();
  const [navTab, setNavTab] = useState<PlanningNavTab>('my_schedule');
  const dragPayloadRef = useRef<{ slotId: string } | null>(null);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const { start } = getWeekBounds(d);
    return start;
  });
  const [slots, setSlots] = useState<PlanningSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalSlot, setModalSlot] = useState<PlanningSlot | null | 'new'>(null);
  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);
  const [form, setForm] = useState({
    slotDate: toYMD(new Date()),
    slotType: 'onsite' as PlanningSlotType,
    startTime: '09:00',
    endTime: '18:00',
    title: '',
    notes: ''
  });
  const [viewMode, setViewMode] = useState<PlanningItineraryViewMode>('calendar');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedCalendarYmd, setSelectedCalendarYmd] = useState(() => toYMD(new Date()));
  const [timelineUserIds, setTimelineUserIds] = useState<string[]>([]);
  const [timelineLabels, setTimelineLabels] = useState<Record<string, string>>({});

  const { start: dateFrom, end: dateTo } = useMemo(() => getWeekBounds(weekStart), [weekStart]);
  const dateFromStr = toYMD(dateFrom);
  const dateToStr = toYMD(dateTo);
  const calendarMonthKey = useMemo(
    () => `${calendarMonth.getFullYear()}-${calendarMonth.getMonth()}`,
    [calendarMonth],
  );

  useEffect(() => {
    const { from, to } = monthRangeYmd(calendarMonth);
    if (selectedCalendarYmd < from || selectedCalendarYmd > to) {
      setSelectedCalendarYmd(from);
    }
  }, [calendarMonth, selectedCalendarYmd]);

  const isOrgScopePlanner = useMemo(
    () => PLANNING_ORG_SCOPE_ROLES.includes(String(user?.role || '') as Role),
    [user?.role],
  );

  const canApproveSwapRequests = useMemo(
    () => Boolean(user?.role && PLANNING_SWAP_APPROVER_ROLES.includes(user.role as Role)),
    [user?.role],
  );

  const visibleNavTabs = NAV_TABS;

  const refreshPlanningDirectory = useCallback(async (): Promise<{ ids: string[]; labels: Record<string, string> }> => {
    if (!user?.id) return { ids: [], labels: {} };
    try {
      const orgId = await OrganizationService.getCurrentUserOrganizationId();
      const { data: profiles } = await DataService.getProfiles();
      const inOrg = (profiles || []).filter((p: any) => !orgId || p.organization_id === orgId);
      const authIds = inOrg.map((p: any) => String(p.user_id)).filter(Boolean);
      let ids = Array.from(new Set([String(user.id), ...authIds]));
      if (!isOrgScopePlanner) ids = [String(user.id)];
      const labels: Record<string, string> = {};
      inOrg.forEach((p: any) => {
        const uid = String(p.user_id);
        if (uid) labels[uid] = p.full_name || p.email || uid;
      });
      labels[String(user.id)] = 'Moi';
      const me = String(user.id);
      ids.sort((a, b) => {
        if (a === me && b !== me) return -1;
        if (b === me && a !== me) return 1;
        const la = (labels[a] || a).toLowerCase();
        const lb = (labels[b] || b).toLowerCase();
        return la.localeCompare(lb, undefined, { sensitivity: 'base' });
      });
      return { ids, labels };
    } catch {
      return { ids: [String(user.id)], labels: { [String(user.id)]: 'Moi' } };
    }
  }, [user?.id, isOrgScopePlanner]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { ids, labels } = await refreshPlanningDirectory();
      if (!cancelled) {
        setTimelineUserIds(ids);
        setTimelineLabels(labels);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isOrgScopePlanner, refreshPlanningDirectory]);

  useEffect(() => {
    if (!user?.id) return;
    if (viewMode === 'gantt') return;
    let cancelled = false;
    setLoading(true);

    if (viewMode === 'week') {
      DataAdapter.getPlanningSlots({
        dateFrom: dateFromStr,
        dateTo: dateToStr,
        userId: String(user.id),
      })
        .then((list) => {
          if (!cancelled) setSlots(list);
        })
        .catch(() => {
          if (!cancelled) setSlots([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    if (viewMode === 'calendar') {
      const { from, to } = monthRangeYmd(calendarMonth);
      DataAdapter.getPlanningSlots({
        dateFrom: from,
        dateTo: to,
        userId: String(user.id),
      })
        .then((list) => {
          if (!cancelled) setSlots(list);
        })
        .catch(() => {
          if (!cancelled) setSlots([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    return () => {
      cancelled = true;
    };
  }, [viewMode, dateFromStr, dateToStr, user?.id, calendarMonthKey]);

  const ganttUserIdsLimited = useMemo(() => {
    const full = timelineUserIds.length ? timelineUserIds : user?.id ? [String(user.id)] : [];
    if (full.length <= PLANNING_GANTT_MAX_MEMBERS) return full;
    return full.slice(0, PLANNING_GANTT_MAX_MEMBERS);
  }, [timelineUserIds, user?.id]);

  useEffect(() => {
    if (!user?.id || viewMode !== 'gantt') return;
    let cancelled = false;
    setLoading(true);
    const ids = ganttUserIdsLimited.length ? ganttUserIdsLimited : [String(user.id)];
    DataAdapter.getPlanningSlots({
      dateFrom: dateFromStr,
      dateTo: dateToStr,
      userIds: ids,
    })
      .then((list) => {
        if (!cancelled) setSlots(list);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [viewMode, dateFromStr, dateToStr, user?.id, ganttUserIdsLimited]);

  const mergeRange = useMemo(() => {
    if (viewMode === 'calendar') return monthRangeYmd(calendarMonth);
    return { from: dateFromStr, to: dateToStr };
  }, [viewMode, calendarMonth, dateFromStr, dateToStr]);

  const meetingDerivedSlots = useMemo(() => {
    const { from, to } = mergeRange;
    const uids =
      viewMode === 'gantt' && ganttUserIdsLimited.length > 0
        ? ganttUserIdsLimited
        : user?.id
          ? [String(user.id)]
          : [];
    return uids.flatMap((uid) => meetingsToPlanningSlots(meetings, uid, from, to));
  }, [meetings, mergeRange, viewMode, ganttUserIdsLimited, user?.id]);

  const mergedSlots = useMemo(() => {
    const merged = [...slots, ...meetingDerivedSlots];
    merged.sort(
      (a, b) =>
        a.slotDate.localeCompare(b.slotDate) ||
        (a.startTime || '').localeCompare(b.startTime || '') ||
        String(a.id).localeCompare(String(b.id)),
    );
    return merged;
  }, [slots, meetingDerivedSlots]);

  const slotsByDay = useMemo(() => {
    const map: Record<string, PlanningSlot[]> = {};
    mergedSlots.forEach((s) => {
      if (!map[s.slotDate]) map[s.slotDate] = [];
      map[s.slotDate].push(s);
    });
    return map;
  }, [mergedSlots]);

  const weekDays = useMemo(() => {
    const days: string[] = [];
    const cur = new Date(dateFrom);
    for (let i = 0; i < 7; i++) {
      days.push(toYMD(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }, [dateFrom]);

  const prevWeek = () => setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  const nextWeek = () => setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  const goToday = () => setWeekStart(getWeekBounds(new Date()).start);
  const prevCalendarMonth = () =>
    setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextCalendarMonth = () =>
    setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const openNew = () => {
    const defaultDate =
      viewMode === 'calendar' ? selectedCalendarYmd : toYMD(new Date());
    setForm({
      slotDate: defaultDate,
      slotType: 'onsite',
      startTime: '09:00',
      endTime: '18:00',
      title: '',
      notes: ''
    });
    setModalSlot('new');
  };

  const openEdit = (slot: PlanningSlot) => {
    setForm({
      slotDate: slot.slotDate,
      slotType: slot.slotType,
      startTime: slot.startTime?.slice(0, 5) || '09:00',
      endTime: slot.endTime?.slice(0, 5) || '18:00',
      title: slot.title || '',
      notes: slot.notes || ''
    });
    setModalSlot(slot);
  };

  const saveSlot = async () => {
    if (!user?.id) return;
    if (modalSlot === 'new') {
      const created = await DataAdapter.createPlanningSlot({
        userId: String(user.id),
        slotDate: form.slotDate,
        slotType: form.slotType,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        title: form.title || undefined,
        notes: form.notes || undefined
      });
      if (created) {
        setSlots((prev) => {
          const next = [...prev, created].sort(
            (a, b) => a.slotDate.localeCompare(b.slotDate) || (a.startTime || '').localeCompare(b.startTime || ''),
          );
          return next;
        });
      }
    } else if (modalSlot && modalSlot !== 'new') {
      const updated = await DataAdapter.updatePlanningSlot(modalSlot.id, {
        slotDate: form.slotDate,
        slotType: form.slotType,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        title: form.title || null,
        notes: form.notes || null
      });
      if (updated) setSlots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    }
    setModalSlot(null);
  };

  const confirmDelete = async () => {
    if (!deleteSlotId) return;
    const row = mergedSlots.find((x) => x.id === deleteSlotId);
    if (isPlanningSlotAutoInjectedNotes(row?.notes) || String(deleteSlotId).startsWith('meeting-')) {
      setDeleteSlotId(null);
      return;
    }
    try {
      await DataAdapter.deletePlanningSlot(deleteSlotId);
      setSlots((prev) => prev.filter((s) => s.id !== deleteSlotId));
    } finally {
      setDeleteSlotId(null);
    }
  };

  const locale = isFr ? 'fr-FR' : 'en-US';
  const weekLabel = `${dateFrom.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} – ${dateTo.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;

  // ===== WFM: Pilotage data =====
  const [hubLoading, setHubLoading] = useState(false);
  const [hubMetrics, setHubMetrics] = useState<{
    slotsThisWeek: number;
    openShifts: number;
    swapPending: number;
    leavesPending: number;
  } | null>(null);

  // ===== WFM: Team board =====
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamSlots, setTeamSlots] = useState<PlanningSlot[]>([]);
  const [teamFilter, setTeamFilter] = useState('');
  const [teamWeekAnchor, setTeamWeekAnchor] = useState<Date>(() => new Date());
  const teamWeek = useMemo(() => getWeekBounds(teamWeekAnchor), [teamWeekAnchor]);
  const teamDateFrom = teamWeek.start;
  const teamDateTo = teamWeek.end;
  const teamWeekDays = useMemo(() => {
    const d: string[] = [];
    const cur = new Date(teamDateFrom);
    cur.setHours(12, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      d.push(toYMD(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return d;
  }, [teamDateFrom]);

  // ===== WFM: Marketplace =====
  const [marketLoading, setMarketLoading] = useState(false);
  const [openShifts, setOpenShifts] = useState<any[]>([]);
  const [swapRequests, setSwapRequests] = useState<any[]>([]);

  // ===== WFM: Conflicts =====
  const [conflictsLoading, setConflictsLoading] = useState(false);
  const [conflicts, setConflicts] = useState<
    Array<{
      id: string;
      severity: 'high' | 'medium' | 'low';
      userId: string;
      date: string;
      title: string;
      details?: string;
      suggestion?: string;
    }>
  >([]);

  const ymdFromDate = (d: Date) => toYMD(d);

  const computeConflictsFromSlots = (slots: PlanningSlot[]) => {
    const byUser = new Map<string, PlanningSlot[]>();
    for (const s of slots) {
      const arr = byUser.get(String(s.userId)) || [];
      arr.push(s);
      byUser.set(String(s.userId), arr);
    }
    const out: Array<{
      id: string;
      severity: 'high' | 'medium' | 'low';
      userId: string;
      date: string;
      title: string;
      details?: string;
      suggestion?: string;
    }> = [];
    const MIN_REST_MIN = 11 * 60;

    for (const [uid, list] of byUser.entries()) {
      const sorted = [...list].sort((a, b) => {
        const da = String(a.slotDate).localeCompare(String(b.slotDate));
        if (da !== 0) return da;
        return (timeToMinutes(a.startTime) ?? 0) - (timeToMinutes(b.startTime) ?? 0);
      });

      // Overlaps same day
      const byDay = new Map<string, PlanningSlot[]>();
      for (const s of sorted) {
        const arr = byDay.get(s.slotDate) || [];
        arr.push(s);
        byDay.set(s.slotDate, arr);
      }
      for (const [day, daySlots] of byDay.entries()) {
        const ds = [...daySlots].sort((a, b) => (timeToMinutes(a.startTime) ?? 0) - (timeToMinutes(b.startTime) ?? 0));
        for (let i = 1; i < ds.length; i++) {
          const prev = ds[i - 1];
          const cur = ds[i];
          const prevEnd = timeToMinutes(prev.endTime) ?? 0;
          const curStart = timeToMinutes(cur.startTime) ?? 0;
          if (curStart < prevEnd) {
            const alignStart = minutesToHHmm(prevEnd);
            out.push({
              id: `overlap:${uid}:${day}:${prev.id}:${cur.id}`,
              severity: 'high',
              userId: uid,
              date: day,
              title: isFr ? 'Chevauchement' : 'Overlap',
              details: isFr
                ? 'Deux créneaux (ou réunion + créneau) se chevauchent. Déplacez l’un des blocs dans « Équipe et planification » ou ajustez les heures.'
                : 'Two items overlap. Move one block in Team & scheduling or adjust times.',
              suggestion: isFr
                ? `Piste : faire commencer le second bloc à ${alignStart} (juste après la fin du premier).`
                : `Try: start the second block at ${alignStart} (right after the first ends).`,
            });
          }
        }
      }

      // Rest between days (very lightweight heuristic)
      for (let i = 1; i < sorted.length; i++) {
        const a = sorted[i - 1];
        const b = sorted[i];
        if (!a.endTime || !b.startTime) continue;
        const aDay = a.slotDate;
        const bDay = b.slotDate;
        if (aDay === bDay) continue;
        const dayGap = Math.round((new Date(bDay + 'T12:00:00').getTime() - new Date(aDay + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24));
        if (dayGap !== 1) continue;
        const restMin = (24 * 60 - (timeToMinutes(a.endTime) ?? 0)) + (timeToMinutes(b.startTime) ?? 0);
        if (restMin < MIN_REST_MIN) {
          const deficit = MIN_REST_MIN - restMin;
          out.push({
            id: `rest:${uid}:${aDay}:${bDay}:${a.id}:${b.id}`,
            severity: 'medium',
            userId: uid,
            date: bDay,
            title: isFr ? 'Repos insuffisant' : 'Insufficient rest',
            details: isFr ? `Repos ~${Math.max(0, restMin)} min (min 660).` : `Rest ~${Math.max(0, restMin)} min (min 660).`,
            suggestion: isFr
              ? `Piste : décaler le début du ${bDay} d’au moins ${Math.ceil(deficit / 15) * 15} min, ou terminer la veille plus tôt.`
              : `Try: shift the ${bDay} start by at least ${Math.ceil(deficit / 15) * 15} min, or end the previous day earlier.`,
          });
        }
      }
    }
    return out;
  };

  const loadHub = async () => {
    if (!user?.id) return;
    setHubLoading(true);
    try {
      const from = ymdFromDate(teamDateFrom);
      const to = ymdFromDate(teamDateTo);
      const leavesSource =
        rh?.leaveRequests != null ? Promise.resolve(rh.leaveRequests) : DataAdapter.getLeaveRequests();
      const [slots, open, swaps, leaves] = await Promise.all([
        DataAdapter.getPlanningSlots({ dateFrom: from, dateTo: to, userIds: timelineUserIds.length ? timelineUserIds : [String(user.id)] }),
        DataAdapter.getOpenShifts({ dateFrom: from, dateTo: to, status: 'open' }),
        DataAdapter.getSwapRequests({ status: 'pending', dateFrom: from, dateTo: to }),
        leavesSource,
      ]);
      const leavePending = Array.isArray(leaves) ? leaves.filter((r: any) => String(r.status || '').toLowerCase() === 'pending').length : 0;
      setHubMetrics({
        slotsThisWeek: slots.length,
        openShifts: open.length,
        swapPending: swaps.length,
        leavesPending: leavePending,
      });
    } finally {
      setHubLoading(false);
    }
  };

  const loadTeamBoard = async () => {
    if (!user?.id) return;
    setTeamLoading(true);
    try {
      const from = ymdFromDate(teamDateFrom);
      const to = ymdFromDate(teamDateTo);
      const ids = timelineUserIds.length ? timelineUserIds : [String(user.id)];
      const slots = await DataAdapter.getPlanningSlots({ dateFrom: from, dateTo: to, userIds: ids });
      setTeamSlots(slots);
    } finally {
      setTeamLoading(false);
    }
  };

  const loadMarketplace = async () => {
    if (!user?.id) return;
    setMarketLoading(true);
    try {
      const from = ymdFromDate(teamDateFrom);
      const to = ymdFromDate(teamDateTo);
      const [open, swaps] = await Promise.all([
        DataAdapter.getOpenShifts({ dateFrom: from, dateTo: to, status: 'open' }),
        DataAdapter.getSwapRequests({ dateFrom: from, dateTo: to }),
      ]);
      setOpenShifts(open);
      setSwapRequests(swaps);
    } finally {
      setMarketLoading(false);
    }
  };

  const loadConflicts = async () => {
    setConflictsLoading(true);
    try {
      const from = ymdFromDate(teamDateFrom);
      const to = ymdFromDate(teamDateTo);
      const ids = timelineUserIds.length ? timelineUserIds : user?.id ? [String(user.id)] : [];
      const slotList = await DataAdapter.getPlanningSlots({ dateFrom: from, dateTo: to, userIds: ids });
      const fromMeetings = ids.flatMap((uid) => meetingsToPlanningSlots(meetings, uid, from, to));
      setConflicts(computeConflictsFromSlots([...slotList, ...fromMeetings]));
    } finally {
      setConflictsLoading(false);
    }
  };

  useEffect(() => {
    if (navTab === 'hub') void loadHub();
    if (navTab === 'team_board') void loadTeamBoard();
    if (navTab === 'marketplace') void loadMarketplace();
    if (navTab === 'conflicts') void loadConflicts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navTab, teamWeekAnchor, language, rh?.leaveRequests]);

  const hubCards: { tab: PlanningNavTab; titleFr: string; titleEn: string; descFr: string; descEn: string; icon: string }[] = [
    {
      tab: 'my_schedule',
      titleFr: 'Planification semaine',
      titleEn: 'Weekly schedule',
      descFr: 'Calendrier, liste hebdomadaire, Gantt ; créneaux et réunions agrégés.',
      descEn: 'Calendar, weekly list, Gantt; slots and meetings combined.',
      icon: 'fas fa-calendar-week',
    },
    {
      tab: 'team_board',
      titleFr: 'Équipe et planification',
      titleEn: 'Team & scheduling',
      descFr: 'Grille semaine par personne (même logique que la planification), drag & drop.',
      descEn: 'Per-person week grid (same logic as scheduling), drag & drop.',
      icon: 'fas fa-users-cog',
    },
    {
      tab: 'marketplace',
      titleFr: 'Changements et échanges',
      titleEn: 'Changes & swaps',
      descFr: 'Demandes de shift / switch : à valider par le manager (N+1) ; open shifts et swaps.',
      descEn: 'Shift/switch requests for manager (N+1) approval; open shifts and swaps.',
      icon: 'fas fa-people-arrows',
    },
    {
      tab: 'conflicts',
      titleFr: 'Conflits',
      titleEn: 'Conflicts',
      descFr: 'Chevauchements et repos : détection auto pour proposer des alternatives.',
      descEn: 'Overlaps and rest: auto-detect to suggest alternatives.',
      icon: 'fas fa-exclamation-triangle',
    },
  ];

  return (
    <div className="p-6 space-y-6 text-gray-900">
      <header className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white text-sm">
                <i className="fas fa-calendar-alt" />
              </span>
              {isFr ? 'Planification' : 'Scheduling & workforce'}
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {isFr
                ? 'Pilotage, planification semaine (calendrier + Gantt), équipe, demandes d’échange (validation N+1) et conflits horaires.'
                : 'Command center, weekly schedule (calendar + Gantt), team, swap requests (manager approval) and time conflicts.'}
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2 mt-4 border-t border-slate-100 pt-4" aria-label={isFr ? 'Sections planning' : 'Planning sections'}>
          {visibleNavTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setNavTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold border transition-colors ${
                navTab === t.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <i className={t.icon} />
              {isFr ? t.labelFr : t.labelEn}
            </button>
          ))}
        </nav>
      </header>

      <div className="mt-6 space-y-6">
        {navTab === 'hub' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hubCards.map((c) => (
              <button
                key={c.tab}
                type="button"
                onClick={() => setNavTab(c.tab)}
                className="text-left rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 hover:shadow transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <i className={c.icon} />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{isFr ? c.titleFr : c.titleEn}</h2>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{isFr ? c.descFr : c.descEn}</p>
                  </div>
                </div>
              </button>
            ))}
            <div className="sm:col-span-2 lg:col-span-3">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      {isFr ? 'Pilotage (données réelles)' : 'Command center (real data)'}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      {isFr
                        ? 'KPIs calculés depuis Supabase : créneaux, open shifts, swaps et demandes de congés en attente.'
                        : 'KPIs from Supabase: slots, open shifts, swaps and pending leave requests.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadHub}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 hover:bg-slate-50"
                    disabled={hubLoading}
                  >
                    <i className={`fas fa-sync mr-2 ${hubLoading ? 'animate-spin' : ''}`} />
                    {isFr ? 'Rafraîchir' : 'Refresh'}
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { k: 'slots', labelFr: 'Créneaux semaine', labelEn: 'Week slots', v: hubMetrics?.slotsThisWeek ?? '—', icon: 'fas fa-calendar-check' },
                    { k: 'open', labelFr: 'Open shifts', labelEn: 'Open shifts', v: hubMetrics?.openShifts ?? '—', icon: 'fas fa-bolt' },
                    { k: 'swap', labelFr: 'Swaps en attente', labelEn: 'Pending swaps', v: hubMetrics?.swapPending ?? '—', icon: 'fas fa-people-arrows' },
                    { k: 'leave', labelFr: 'Congés pending', labelEn: 'Pending leave', v: hubMetrics?.leavesPending ?? '—', icon: 'fas fa-umbrella-beach' },
                  ].map((m) => (
                    <div key={m.k} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">{isFr ? m.labelFr : m.labelEn}</span>
                        <i className={`${m.icon} text-slate-400`} />
                      </div>
                      <div className="mt-2 text-xl font-bold text-slate-900">{hubLoading ? '…' : m.v}</div>
                    </div>
                  ))}
                </div>

                {setView && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setView('rh')}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 hover:bg-slate-50"
                    >
                      {isFr ? 'Ressources Humaines' : 'Human resources'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {navTab === 'my_schedule' && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
            <PlanningItineraryFigmaView
              isFr={isFr}
              locale={locale}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              loading={loading}
              calendarMonth={calendarMonth}
              onCalendarPrev={prevCalendarMonth}
              onCalendarNext={nextCalendarMonth}
              selectedYmd={selectedCalendarYmd}
              onSelectYmd={setSelectedCalendarYmd}
              slotsByDay={slotsByDay}
              weekLabel={weekLabel}
              weekDays={weekDays}
              prevWeek={prevWeek}
              nextWeek={nextWeek}
              goToday={goToday}
              timelineUserIds={viewMode === 'gantt' ? ganttUserIdsLimited : timelineUserIds}
              timelineLabels={timelineLabels}
              slots={mergedSlots}
              userId={user?.id}
              isOrgScopePlanner={isOrgScopePlanner}
              onPrint={() => window.print()}
              onNewSlot={openNew}
              onEditSlot={(s) => {
                if (String(s.id).startsWith('meeting-')) return;
                if (isPlanningSlotAutoInjectedNotes(s.notes)) return;
                openEdit(s);
              }}
              onDeleteSlot={(id) => {
                if (String(id).startsWith('meeting-')) return;
                const row = mergedSlots.find((x) => x.id === id);
                if (isPlanningSlotAutoInjectedNotes(row?.notes)) return;
                setDeleteSlotId(id);
              }}
              meetings={meetings}
              onOpenTimeTracking={undefined}
              ganttCapacityHint={
                viewMode === 'gantt' && timelineUserIds.length > ganttUserIdsLimited.length
                  ? isFr
                    ? `Gantt : ${ganttUserIdsLimited.length} personnes sur ${timelineUserIds.length} (limite performance). « Équipe et planification » affiche tout le monde.`
                    : `Gantt: ${ganttUserIdsLimited.length} of ${timelineUserIds.length} people (performance cap). Team & scheduling lists everyone.`
                  : null
              }
            />
          </div>
        )}

        {navTab === 'team_board' && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  {isFr ? 'Équipe et planification' : 'Team & scheduling'}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {isFr
                    ? 'À gauche : tous les profils de l’organisation (recherche). À droite : grille semaine par personne, créneaux chargés pour tout le monde, drag & drop (planning_slots).'
                    : 'Left: full org roster (search). Right: weekly per-person grid, slots for everyone, drag & drop (planning_slots).'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTeamWeekAnchor((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7))}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  <i className="fas fa-chevron-left mr-2" />
                  {isFr ? 'Semaine -1' : 'Prev'}
                </button>
                <button
                  type="button"
                  onClick={() => setTeamWeekAnchor(new Date())}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  {isFr ? 'Cette semaine' : 'This week'}
                </button>
                <button
                  type="button"
                  onClick={() => setTeamWeekAnchor((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7))}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  {isFr ? 'Semaine +1' : 'Next'}
                  <i className="fas fa-chevron-right ml-2" />
                </button>
                <button
                  type="button"
                  onClick={loadTeamBoard}
                  className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                  disabled={teamLoading}
                >
                  <i className={`fas fa-sync mr-2 ${teamLoading ? 'animate-spin' : ''}`} />
                  {isFr ? 'Charger' : 'Load'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
              {/* Left: team roster */}
              <aside className="border-b lg:border-b-0 lg:border-r border-slate-100 p-4 md:p-5 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">{isFr ? 'Équipe' : 'Team'}</h3>
                  <span className="text-xs text-slate-500">
                    {(timelineUserIds.length ? timelineUserIds : user?.id ? [String(user.id)] : []).length} {isFr ? 'membres' : 'members'}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="relative">
                    <i className="fas fa-search absolute left-3 top-3 text-slate-400 text-sm" />
                    <input
                      value={teamFilter}
                      onChange={(e) => setTeamFilter(e.target.value)}
                      placeholder={isFr ? 'Rechercher…' : 'Search…'}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                    />
                  </div>
                </div>

                <p className="mt-2 text-[11px] text-slate-500 leading-snug">
                  {isFr
                    ? 'Liste complète des comptes rattachés à l’organisation (profils Supabase).'
                    : 'Full list of accounts linked to the organization (Supabase profiles).'}
                </p>
                <div className="mt-3 space-y-2 max-h-[520px] overflow-auto pr-1">
                  {(timelineUserIds.length ? timelineUserIds : user?.id ? [String(user.id)] : [])
                    .filter((uid) => {
                      if (!teamFilter.trim()) return true;
                      const label = (timelineLabels[uid] || uid).toLowerCase();
                      return label.includes(teamFilter.trim().toLowerCase());
                    })
                    .map((uid) => (
                      <div key={uid} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">{timelineLabels[uid] || uid.slice(0, 8)}</div>
                            <div className="text-xs text-slate-500 truncate">{uid}</div>
                          </div>
                          <div className="text-xs font-semibold text-slate-700">
                            {teamSlots.filter((s) => String(s.userId) === uid).length}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-4 text-xs text-slate-500 leading-relaxed">
                  {isFr
                    ? 'Astuce : glissez un créneau sur une autre cellule (jour/agent) pour le replanifier.'
                    : 'Tip: drag a slot to another cell (day/user) to reschedule.'}
                </div>
              </aside>

              {/* Center: grid */}
              <section className="overflow-auto">
                <div className="min-w-[980px]">
                  <div className="grid grid-cols-[260px_repeat(7,1fr)] sticky top-0 bg-white z-10 border-b border-slate-100">
                    <div className="px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wide bg-white">
                      {isFr ? 'Employés' : 'Employees'}
                    </div>
                    {teamWeekDays.map((d) => (
                      <div key={d} className="px-3 py-3 text-xs font-bold text-slate-600 uppercase tracking-wide border-l border-slate-100 bg-white">
                        {new Date(d + 'T12:00:00').toLocaleDateString(locale, { weekday: 'short', day: 'numeric' })}
                      </div>
                    ))}
                  </div>

                  {(timelineUserIds.length ? timelineUserIds : user?.id ? [String(user.id)] : [])
                    .filter((uid) => {
                      if (!teamFilter.trim()) return true;
                      const label = (timelineLabels[uid] || uid).toLowerCase();
                      return label.includes(teamFilter.trim().toLowerCase());
                    })
                    .map((uid) => {
                      const userSlots = teamSlots.filter((s) => String(s.userId) === uid);
                      return (
                        <div key={uid} className="grid grid-cols-[260px_repeat(7,1fr)] border-b border-slate-100">
                          <div className="px-4 py-3 bg-slate-50/60">
                            <div className="text-sm font-semibold text-slate-900 truncate">{timelineLabels[uid] || uid.slice(0, 8)}</div>
                            <div className="text-xs text-slate-500 truncate">{isFr ? 'Créneaux' : 'Slots'}: {userSlots.length}</div>
                          </div>
                          {teamWeekDays.map((d) => {
                            const daySlots = userSlots.filter((s) => s.slotDate === d);
                            return (
                              <div
                                key={d}
                                className="border-l border-slate-100 px-2 py-2 min-h-[72px] bg-white"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={async (e) => {
                                  e.preventDefault();
                                  const payload = dragPayloadRef.current;
                                  if (!payload?.slotId) return;
                                  const slot = teamSlots.find((s) => String(s.id) === String(payload.slotId));
                                  if (!slot) return;
                                  if (isSlotAutoSyncedFromTask(slot) || String(slot.id).startsWith('meeting-')) return;
                                  const updated = await DataAdapter.updatePlanningSlot(String(slot.id), { userId: uid, slotDate: d });
                                  if (!updated) return;
                                  setTeamSlots((prev) => prev.map((s) => (String(s.id) === String(updated.id) ? updated : s)));
                                }}
                              >
                                <div className="flex flex-col gap-2">
                                  {daySlots.map((s) => (
                                    <div
                                      key={s.id}
                                      draggable={!isSlotAutoSyncedFromTask(s) && !String(s.id).startsWith('meeting-')}
                                      onDragStart={() => {
                                        if (isSlotAutoSyncedFromTask(s) || String(s.id).startsWith('meeting-')) return;
                                        dragPayloadRef.current = { slotId: String(s.id) };
                                      }}
                                      onClick={() => {
                                        if (isSlotAutoSyncedFromTask(s) || String(s.id).startsWith('meeting-')) return;
                                        openEdit(s);
                                      }}
                                      className={`group rounded-lg border border-slate-200 px-2 py-1.5 shadow-sm ${
                                        isSlotAutoSyncedFromTask(s) || String(s.id).startsWith('meeting-')
                                          ? 'cursor-default border-violet-100 bg-violet-50/60'
                                          : 'cursor-pointer bg-slate-50 hover:bg-slate-100'
                                      }`}
                                      title={s.title || SLOT_TYPE_LABELS[s.slotType]}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                          <div className="text-xs font-semibold text-slate-900 truncate">
                                            <i className={`${SLOT_TYPE_ICONS[s.slotType]} mr-1 text-slate-500`} />
                                            {SLOT_TYPE_LABELS[s.slotType]}
                                          </div>
                                          <div className="text-[11px] text-slate-600 truncate">
                                            {(s.startTime || '').slice(0, 5)}–{(s.endTime || '').slice(0, 5)}{s.title ? ` · ${s.title}` : ''}
                                          </div>
                                        </div>
                                        <i className="fas fa-grip-vertical text-slate-300 group-hover:text-slate-400" />
                                      </div>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setForm((f) => ({
                                        ...f,
                                        slotDate: d,
                                      }));
                                      setModalSlot('new');
                                    }}
                                    className="text-left rounded-lg border border-dashed border-slate-200 hover:border-slate-300 px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                                  >
                                    <i className="fas fa-plus mr-2" />
                                    {isFr ? 'Ajouter' : 'Add'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                </div>
              </section>
            </div>
          </div>
        )}

        {navTab === 'marketplace' && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  {isFr ? 'Changements et échanges' : 'Changes & swaps'}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {isFr
                    ? 'Flux métier : le collaborateur demande un changement de créneau ; le manager / N+1 approuve ou refuse ici (swaps). Open shifts branchés si tables WFM présentes.'
                    : 'Collaborators request schedule changes; manager approves or rejects (swaps). Open shifts if WFM tables exist.'}
                </p>
              </div>
              <button
                type="button"
                onClick={loadMarketplace}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 hover:bg-slate-50"
                disabled={marketLoading}
              >
                <i className={`fas fa-sync mr-2 ${marketLoading ? 'animate-spin' : ''}`} />
                {isFr ? 'Rafraîchir' : 'Refresh'}
              </button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">{isFr ? 'Open shifts' : 'Open shifts'}</h3>
                  <span className="text-xs text-slate-500">{openShifts.length}</span>
                </div>
                <div className="mt-3 space-y-2">
                  {marketLoading ? (
                    <div className="text-sm text-slate-500">{isFr ? 'Chargement…' : 'Loading…'}</div>
                  ) : openShifts.length === 0 ? (
                    <div className="text-sm text-slate-500">{isFr ? 'Aucun open shift.' : 'No open shifts.'}</div>
                  ) : (
                    openShifts.slice(0, 12).map((s) => (
                      <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">{s.role_name || s.role || (isFr ? 'Shift' : 'Shift')}</div>
                            <div className="text-xs text-slate-600 mt-0.5">
                              {String(s.slot_date || '').slice(0, 10)} · {String(s.start_time || '').slice(0, 5)}–{String(s.end_time || '').slice(0, 5)}
                              {s.location ? ` · ${s.location}` : ''}
                            </div>
                            {s.premium_percent ? (
                              <div className="inline-flex mt-2 text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                                +{s.premium_percent}%
                              </div>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                            onClick={async () => {
                              if (!user?.id) return;
                              const taken = await DataAdapter.takeOpenShift(String(s.id), String(user.id));
                              if (taken) void loadMarketplace();
                            }}
                          >
                            {isFr ? 'Prendre' : 'Take'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">{isFr ? 'Demandes d’échange' : 'Swap requests'}</h3>
                  <span className="text-xs text-slate-500">{swapRequests.length}</span>
                </div>
                <div className="mt-3 space-y-2">
                  {marketLoading ? (
                    <div className="text-sm text-slate-500">{isFr ? 'Chargement…' : 'Loading…'}</div>
                  ) : swapRequests.length === 0 ? (
                    <div className="text-sm text-slate-500">{isFr ? 'Aucune demande.' : 'No requests.'}</div>
                  ) : (
                    swapRequests.slice(0, 12).map((r) => (
                      <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {isFr ? 'Échange' : 'Swap'} · {String(r.status || 'pending')}
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5">
                              {String(r.slot_date || '').slice(0, 10)} · {String(r.start_time || '').slice(0, 5)}–{String(r.end_time || '').slice(0, 5)}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {canApproveSwapRequests ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                                  onClick={async () => {
                                    const up = await DataAdapter.updateSwapRequest(String(r.id), { status: 'rejected' });
                                    if (up) void loadMarketplace();
                                  }}
                                >
                                  {isFr ? 'Refuser' : 'Reject'}
                                </button>
                                <button
                                  type="button"
                                  className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                                  onClick={async () => {
                                    const up = await DataAdapter.updateSwapRequest(String(r.id), { status: 'approved' });
                                    if (up) void loadMarketplace();
                                  }}
                                >
                                  {isFr ? 'Approuver' : 'Approve'}
                                </button>
                              </div>
                            ) : (
                              <span className="max-w-[200px] text-right text-[10px] text-slate-500">
                                {isFr
                                  ? 'Validation réservée aux rôles pilotes (manager, admin…).'
                                  : 'Approval is limited to lead roles (manager, admin…).'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {navTab === 'conflicts' && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{isFr ? 'Conflits' : 'Conflicts'}</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {isFr
                    ? 'Le système recoupe créneaux planning et réunions : chevauchements, repos court. Utilisez la grille équipe pour déplacer un créneau et lever le conflit.'
                    : 'System cross-checks planning slots and meetings: overlaps, short rest. Use the team grid to move a slot and resolve.'}
                </p>
              </div>
              <button
                type="button"
                onClick={loadConflicts}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 hover:bg-slate-50"
                disabled={conflictsLoading}
              >
                <i className={`fas fa-sync mr-2 ${conflictsLoading ? 'animate-spin' : ''}`} />
                {isFr ? 'Rafraîchir' : 'Refresh'}
              </button>
            </div>

            <div className="mt-4">
              {conflictsLoading ? (
                <div className="text-sm text-slate-500">{isFr ? 'Chargement…' : 'Loading…'}</div>
              ) : conflicts.length === 0 ? (
                <div className="text-sm text-slate-500">{isFr ? 'Aucun conflit détecté.' : 'No conflicts detected.'}</div>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {conflicts.slice(0, 40).map((c) => (
                    <div key={c.id} className="p-3 bg-white flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                              c.severity === 'high'
                                ? 'bg-red-100 text-red-800'
                                : c.severity === 'medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {c.severity.toUpperCase()}
                          </span>
                          <div className="text-sm font-semibold text-slate-900 truncate">{c.title}</div>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          <span className="block truncate">
                            {timelineLabels[c.userId] || c.userId.slice(0, 8)} · {c.date}
                            {c.details ? ` · ${c.details}` : ''}
                          </span>
                          {c.suggestion ? (
                            <span className="mt-1 block text-[11px] font-medium text-emerald-800">{c.suggestion}</span>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-50 shrink-0"
                        onClick={() => setNavTab('team_board')}
                      >
                        {isFr ? 'Voir' : 'View'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {modalSlot !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b font-semibold">
              {modalSlot === 'new'
                ? isFr
                  ? 'Nouveau créneau'
                  : 'New slot'
                : isFr
                  ? 'Modifier le créneau'
                  : 'Edit slot'}
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{isFr ? 'Date' : 'Date'}</label>
                <input
                  type="date"
                  value={form.slotDate}
                  onChange={(e) => setForm((f) => ({ ...f, slotDate: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{isFr ? 'Type' : 'Type'}</label>
                <select
                  value={form.slotType}
                  onChange={(e) => setForm((f) => ({ ...f, slotType: e.target.value as PlanningSlotType }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                >
                  {(Object.keys(SLOT_TYPE_LABELS_FR) as PlanningSlotType[]).map((k) => (
                    <option key={k} value={k}>
                      {SLOT_TYPE_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{isFr ? 'Début' : 'Start'}</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{isFr ? 'Fin' : 'End'}</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {isFr ? 'Titre (optionnel)' : 'Title (optional)'}
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder={isFr ? 'Ex. Réunion équipe' : 'e.g. Team meeting'}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {isFr ? 'Notes (optionnel)' : 'Notes (optional)'}
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button type="button" onClick={() => setModalSlot(null)} className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                {isFr ? 'Annuler' : 'Cancel'}
              </button>
              <button type="button" onClick={saveSlot} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                {isFr ? 'Enregistrer' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteSlotId && (
        <ConfirmationModal
          title={isFr ? 'Supprimer le créneau' : 'Delete slot'}
          message={isFr ? 'Êtes-vous sûr de vouloir supprimer ce créneau ?' : 'Are you sure you want to delete this slot?'}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteSlotId(null)}
        />
      )}
    </div>
  );
};

export default Planning;
