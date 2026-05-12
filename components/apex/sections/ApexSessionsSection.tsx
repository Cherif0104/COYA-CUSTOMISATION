import React, { useMemo } from 'react';
import { Button } from '../../ui/Button';
import { APEX_SHELL_CARD } from '../apexConstants';
import type { ApexCohortRow } from '../types/apexHub';

export type ApexSessionsSectionProps = {
  isFr: boolean;
  cohortRows: ApexCohortRow[];
  cohortsLoading: boolean;
  totalSessionEnrollments: number;
  setView: (view: string) => void;
};

const VC = ['Zoom', 'Google Meet', 'Microsoft Teams', 'Jitsi'];

export const ApexSessionsSection: React.FC<ApexSessionsSectionProps> = ({
  isFr,
  cohortRows,
  cohortsLoading,
  totalSessionEnrollments,
  setView,
}) => {
  const upcoming = useMemo(
    () =>
      cohortRows.filter((row) => {
        if (!row.startsAt) return false;
        return new Date(row.startsAt) >= new Date();
      }).length,
    [cohortRows],
  );

  const weekDays = isFr ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const nextSessions = useMemo(
    () =>
      cohortRows
        .filter((r) => r.startsAt)
        .sort((a, b) => new Date(a.startsAt || 0).getTime() - new Date(b.startsAt || 0).getTime())
        .slice(0, 5),
    [cohortRows],
  );

  const openPlanning = () => {
    try {
      sessionStorage.setItem('coya_nav_planning_focus', 'apex-sessions');
    } catch {
      /* ignore */
    }
    setView('planning');
  };

  return (
    <div className="space-y-4">
      <div className={`${APEX_SHELL_CARD} space-y-4 p-6`}>
        <p className="text-sm text-slate-700">
          {isFr
            ? 'Pilotage lives, ateliers, examens, coaching — calendrier intelligent, réservations, notifications (email, push, WhatsApp).'
            : 'Lives, workshops, exams, coaching — smart calendar, bookings, notifications.'}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs">
            <p className="font-semibold text-slate-700">{isFr ? 'Sessions totales' : 'Total sessions'}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {cohortsLoading ? '…' : cohortRows.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs">
            <p className="font-semibold text-slate-700">{isFr ? 'Inscriptions sessions' : 'Session enrollments'}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {cohortsLoading ? '…' : totalSessionEnrollments}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs">
            <p className="font-semibold text-slate-700">{isFr ? 'À venir' : 'Upcoming'}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{cohortsLoading ? '…' : upcoming}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-700">{isFr ? 'Mini-calendrier (semaine)' : 'Week mini-calendar'}</p>
          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px]">
            {weekDays.map((d) => (
              <div key={d} className="rounded-lg border border-slate-100 bg-white py-2 font-medium text-slate-600">
                {d}
              </div>
            ))}
            {weekDays.map((d, i) => (
              <div
                key={`c-${d}`}
                className={`min-h-[52px] rounded-lg border p-1 text-left text-[9px] leading-tight ${
                  i === 2 ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100 bg-slate-50'
                }`}
              >
                {cohortRows[i] ? (
                  <span className="line-clamp-3 text-slate-700">{cohortRows[i].sessionTitle}</span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-700">{isFr ? 'Prochaines sessions' : 'Upcoming sessions'}</p>
          <div className="mt-2 space-y-2 text-xs">
            {nextSessions.length === 0 ? (
              <p className="text-slate-500">{isFr ? 'Aucune session planifiée.' : 'No planned sessions.'}</p>
            ) : (
              nextSessions.map((s) => {
                const date = s.startsAt ? new Date(s.startsAt).toLocaleString() : '—';
                return (
                  <div key={s.sessionId} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{s.sessionTitle}</p>
                      <p className="text-[11px] text-slate-500">
                        {s.courseTitle} · {date}
                      </p>
                    </div>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      {s.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-700">{isFr ? 'Visioconférence' : 'Videoconference'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {VC.map((v) => (
              <span key={v} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600">
                {v}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-700">{isFr ? 'Canaux notification' : 'Notification channels'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {['Email', 'Push', 'WhatsApp', 'SMS'].map((c) => (
              <span key={c} className="rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white">
                {c}
              </span>
            ))}
          </div>
        </div>

        <Button type="button" variant="secondary" onClick={openPlanning}>
          {isFr ? 'Ouvrir la planification globale' : 'Open global planning'}
        </Button>
      </div>
    </div>
  );
};
