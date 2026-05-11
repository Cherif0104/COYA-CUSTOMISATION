import React, { useEffect, useState } from 'react';
import { usePresence } from '../../../contexts/PresenceContext';
import { presenceStatusLabel } from './presenceStatusPresentation';

function formatElapsed(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}

export type PresenceSessionChronoProps = {
  fr: boolean;
  /** `compact` = header ; `prominent` = tablette. */
  variant?: 'compact' | 'prominent';
  className?: string;
};

/**
 * Temps écoulé depuis le début de la session de présence (1 s).
 * Aligné sur `currentSession.startedAt` — le segment statut fin peut être affiné plus tard (événements).
 */
export const PresenceSessionChrono: React.FC<PresenceSessionChronoProps> = ({
  fr,
  variant = 'compact',
  className = '',
}) => {
  const { currentSession, loading } = usePresence();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!currentSession?.startedAt || currentSession.status === 'absent') return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [currentSession?.id, currentSession?.startedAt, currentSession?.status]);

  if (loading) {
    return (
      <div className={`animate-pulse rounded-lg bg-slate-200/80 ${variant === 'prominent' ? 'h-14' : 'h-8'} min-w-[7rem] ${className}`.trim()} />
    );
  }

  if (!currentSession || currentSession.status === 'absent') {
    return (
      <div
        className={`flex flex-col justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-slate-500 ${
          variant === 'prominent' ? 'min-h-[3.25rem]' : 'min-h-8'
        } ${className}`.trim()}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide">{fr ? 'Session' : 'Session'}</span>
        <span className={`font-mono ${variant === 'prominent' ? 'text-lg' : 'text-xs'}`}>{fr ? '—' : '—'}</span>
      </div>
    );
  }

  const startMs = new Date(currentSession.startedAt).getTime();
  const elapsedSec = Math.floor((now - startMs) / 1000);
  const label = presenceStatusLabel(currentSession.status, fr);

  if (variant === 'prominent') {
    return (
      <div
        className={`flex min-w-0 flex-1 flex-col justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm sm:flex-row sm:items-center sm:gap-4 ${className}`.trim()}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{fr ? 'Statut' : 'Status'}</p>
          <p className="truncate text-sm font-semibold text-slate-900">{label}</p>
        </div>
        <div className="mt-1 sm:mt-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {fr ? 'Temps écoulé (session)' : 'Elapsed (session)'}
          </p>
          <p className="font-mono text-2xl font-bold tabular-nums tracking-tight text-emerald-800">{formatElapsed(elapsedSec)}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center ${className}`.trim()}
      title={fr ? 'Temps depuis le pointage courant' : 'Time since current clock-in'}
    >
      <span className="text-[9px] font-semibold uppercase leading-none text-slate-500">{label}</span>
      <span className="font-mono text-xs font-semibold tabular-nums text-slate-900">{formatElapsed(elapsedSec)}</span>
    </div>
  );
};

export default PresenceSessionChrono;
