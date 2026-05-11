import type { EmployeeWorkSchedule, HrAttendancePolicy, PresenceSession } from '../types';
import { presenceStatusCountsTowardDuration, toLocalDateIso } from './hrAnalyticsService';

export type WorkforceDaySegmentStatus = 'ok' | 'late' | 'absent';

export type WorkforceLocalDayInterpretation = {
  dateIso: string;
  /** Lun–Ven : règles matin / après-midi appliquées. */
  isWorkingWeekday: boolean;
  expectedWorkStartMinutes: number;
  morningEndMinutes: number;
  lunchStartMinutes: number;
  lunchEndMinutes: number;
  afternoonDeadlineMinutes: number;
  expectedWorkEndMinutes: number;
  firstMorningConnectMs: number | null;
  delayMinutes: number;
  morningStatus: WorkforceDaySegmentStatus;
  afternoonStatus: WorkforceDaySegmentStatus;
  earlyDepartureMinutes: number;
  summaryCodes: Array<'late_connect' | 'absence_morning' | 'absence_afternoon' | 'early_departure'>;
};

function minutesFromTimeString(hhmmss: string): number {
  const [h, m] = hhmmss.split(':').map((x) => Number(x || 0));
  return h * 60 + m;
}

function isoWeekdayMon1Sun7(d: Date): number {
  const day = d.getDay();
  return day === 0 ? 7 : day;
}

function isScheduleEffectiveForDate(s: EmployeeWorkSchedule, dateIso: string): boolean {
  if (s.effectiveFrom && s.effectiveFrom > dateIso) return false;
  if (s.effectiveTo && s.effectiveTo < dateIso) return false;
  return true;
}

function localDayStartMs(dateIso: string): number | null {
  const p = dateIso.split('-').map((x) => Number(x));
  if (p.length !== 3 || !p[0] || !p[1] || !p[2]) return null;
  return new Date(p[0], p[1] - 1, p[2], 0, 0, 0, 0).getTime();
}

function atLocalMinutes(dayStartMs: number, minutesFromMidnight: number): number {
  const d = new Date(dayStartMs);
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0).getTime();
}

function mergeIntervalsMs(intervals: Array<{ a: number; b: number }>): Array<{ a: number; b: number }> {
  const iv = intervals
    .filter(({ a, b }) => Number.isFinite(a) && Number.isFinite(b) && b > a)
    .sort((x, y) => x.a - y.a || x.b - y.b);
  const out: Array<{ a: number; b: number }> = [];
  for (const cur of iv) {
    if (!out.length || cur.a > out[out.length - 1].b) {
      out.push({ a: cur.a, b: cur.b });
    } else {
      out[out.length - 1].b = Math.max(out[out.length - 1].b, cur.b);
    }
  }
  return out;
}

function intersectLengthMs(a: number, b: number, x: number, y: number): number {
  const lo = Math.max(a, x);
  const hi = Math.min(b, y);
  return hi > lo ? hi - lo : 0;
}

/**
 * Interprète une journée locale (politique `time` = heure locale).
 * Départ anticipé : uniquement si journée passée ou après l’heure de fin attendue (sinon provisoire → 0).
 */
export function interpretWorkforceLocalDay(params: {
  dateIso: string;
  authUserId: string;
  sessions: PresenceSession[];
  policy: HrAttendancePolicy | null;
  schedules?: EmployeeWorkSchedule[];
  nowMs?: number;
}): WorkforceLocalDayInterpretation {
  const nowMs = params.nowMs ?? Date.now();
  const dayStart = localDayStartMs(params.dateIso);
  const cal = dayStart ? new Date(dayStart) : null;
  const isoWeekday = cal ? isoWeekdayMon1Sun7(cal) : null;

  const scheduleForDay =
    isoWeekday != null && params.schedules
      ? params.schedules.find((s) => s.isoWeekday === isoWeekday && isScheduleEffectiveForDate(s, params.dateIso))
      : null;

  const p = params.policy;
  const expectedWorkStartMinutes = minutesFromTimeString(
    scheduleForDay?.expectedStartTime || p?.expectedWorkStartTime || '09:00:00',
  );
  const morningEndMinutes = minutesFromTimeString(
    scheduleForDay?.lunchStartTime || p?.morningSegmentEndTime || '12:00:00',
  );
  const lunchStartMinutes = minutesFromTimeString(
    scheduleForDay?.lunchStartTime || p?.lunchStartTime || '13:00:00',
  );
  const lunchEndMinutes = minutesFromTimeString(scheduleForDay?.lunchEndTime || p?.lunchEndTime || '14:00:00');
  const afternoonDeadlineMinutes = minutesFromTimeString(
    scheduleForDay?.afternoonStartTime || p?.afternoonPresenceDeadlineTime || '14:00:00',
  );
  const expectedWorkEndMinutes = minutesFromTimeString(
    scheduleForDay?.expectedEndTime || p?.expectedWorkEndTime || '17:00:00',
  );
  const isWorkingWeekdayBase =
    scheduleForDay ? scheduleForDay.active !== false : isoWeekday != null ? isoWeekday <= 5 : false;

  const summaryCodes: WorkforceLocalDayInterpretation['summaryCodes'] = [];

  const base = (): WorkforceLocalDayInterpretation => ({
    dateIso: params.dateIso,
    isWorkingWeekday: isWorkingWeekdayBase,
    expectedWorkStartMinutes,
    morningEndMinutes,
    lunchStartMinutes,
    lunchEndMinutes,
    afternoonDeadlineMinutes,
    expectedWorkEndMinutes,
    firstMorningConnectMs: null,
    delayMinutes: 0,
    morningStatus: 'absent',
    afternoonStatus: 'absent',
    earlyDepartureMinutes: 0,
    summaryCodes: [],
  });

  if (!dayStart) {
    const o = base();
    return o;
  }

  const isWorkingWeekday = isWorkingWeekdayBase;
  const calSafe = cal || new Date(dayStart);

  const morningStartMs = atLocalMinutes(dayStart, expectedWorkStartMinutes);
  const morningEndMs = atLocalMinutes(dayStart, morningEndMinutes);
  const afternoonStartMs = atLocalMinutes(dayStart, afternoonDeadlineMinutes);
  const expectedEndWall = atLocalMinutes(dayStart, expectedWorkEndMinutes);
  const dayEndMs = new Date(calSafe.getFullYear(), calSafe.getMonth(), calSafe.getDate(), 23, 59, 59, 999).getTime();

  const clips: Array<{ a: number; b: number }> = [];
  for (const s of params.sessions) {
    if (String(s.userId) !== String(params.authUserId)) continue;
    if (!presenceStatusCountsTowardDuration(s.status)) continue;
    const a = new Date(s.startedAt).getTime();
    const b = s.endedAt ? new Date(s.endedAt).getTime() : nowMs;
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) continue;
    const o0 = Math.max(a, dayStart);
    const o1 = Math.min(b, dayEndMs + 1);
    if (o1 > o0) clips.push({ a: o0, b: o1 });
  }

  const merged = mergeIntervalsMs(clips);

  if (!isWorkingWeekday) {
    return {
      ...base(),
      isWorkingWeekday: false,
      firstMorningConnectMs: merged.length ? merged[0].a : null,
      morningStatus: 'ok',
      afternoonStatus: 'ok',
      summaryCodes: [],
    };
  }

  let firstMorningConnectMs: number | null = null;
  for (const seg of merged) {
    if (intersectLengthMs(seg.a, seg.b, morningStartMs, morningEndMs) > 0) {
      const enter = Math.max(seg.a, morningStartMs);
      if (firstMorningConnectMs == null || enter < firstMorningConnectMs) {
        firstMorningConnectMs = enter;
      }
    }
  }

  const morningPresenceMs = merged.reduce(
    (acc, seg) => acc + intersectLengthMs(seg.a, seg.b, morningStartMs, morningEndMs),
    0,
  );
  const morningPresent = morningPresenceMs >= 60_000;
  let delayMinutes = 0;
  let morningStatus: WorkforceDaySegmentStatus = 'absent';
  if (morningPresent && firstMorningConnectMs != null) {
    delayMinutes = Math.max(0, Math.floor((firstMorningConnectMs - morningStartMs) / 60_000));
    morningStatus = delayMinutes > 0 ? 'late' : 'ok';
  } else if (!morningPresent) {
    morningStatus = 'absent';
    summaryCodes.push('absence_morning');
  }
  if (morningStatus === 'late') summaryCodes.push('late_connect');

  const afternoonPresenceMs = merged.reduce(
    (acc, seg) => acc + intersectLengthMs(seg.a, seg.b, afternoonStartMs, expectedEndWall),
    0,
  );
  const afternoonPresent = afternoonPresenceMs >= 60_000;
  const afternoonStatus: WorkforceDaySegmentStatus = afternoonPresent ? 'ok' : 'absent';
  if (!afternoonPresent) summaryCodes.push('absence_afternoon');

  const todayIso = toLocalDateIso(new Date(nowMs));
  const canFinalizeEarlyLeave = params.dateIso < todayIso || nowMs >= expectedEndWall;

  let earlyDepartureMinutes = 0;
  const hadWorkTouch = morningPresent || afternoonPresent;
  const lastEndMsGlobal = merged.length ? Math.max(...merged.map((s) => s.b)) : null;
  if (canFinalizeEarlyLeave && hadWorkTouch && lastEndMsGlobal != null && lastEndMsGlobal < expectedEndWall) {
    earlyDepartureMinutes = Math.max(0, Math.floor((expectedEndWall - lastEndMsGlobal) / 60_000));
    if (earlyDepartureMinutes > 0) summaryCodes.push('early_departure');
  }

  return {
    dateIso: params.dateIso,
    isWorkingWeekday,
    expectedWorkStartMinutes,
    morningEndMinutes,
    lunchStartMinutes,
    lunchEndMinutes,
    afternoonDeadlineMinutes,
    expectedWorkEndMinutes,
    firstMorningConnectMs,
    delayMinutes,
    morningStatus,
    afternoonStatus,
    earlyDepartureMinutes,
    summaryCodes: [...new Set(summaryCodes)],
  };
}

export function interpretWorkforceLocalDayRange(params: {
  startDateIso: string;
  endDateIso: string;
  authUserId: string;
  sessions: PresenceSession[];
  policy: HrAttendancePolicy | null;
  schedules?: EmployeeWorkSchedule[];
  nowMs?: number;
}): WorkforceLocalDayInterpretation[] {
  const out: WorkforceLocalDayInterpretation[] = [];
  const start = localDayStartMs(params.startDateIso);
  const end = localDayStartMs(params.endDateIso);
  if (start == null || end == null || end < start) return out;
  for (let t = start; t <= end; t += 86400000) {
    const dateIso = toLocalDateIso(new Date(t));
    out.push(
      interpretWorkforceLocalDay({
        dateIso,
        authUserId: params.authUserId,
        sessions: params.sessions,
        policy: params.policy,
        schedules: params.schedules,
        nowMs: params.nowMs,
      }),
    );
  }
  return out;
}
