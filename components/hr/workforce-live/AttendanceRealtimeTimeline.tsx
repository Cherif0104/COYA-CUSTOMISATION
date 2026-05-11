import React from 'react';
import type { WorkforceLiveTimelineEntry } from './types';

export type AttendanceRealtimeTimelineProps = {
  title: string;
  hint?: string;
  entries: WorkforceLiveTimelineEntry[];
  emptyLabel: string;
};

export const AttendanceRealtimeTimeline: React.FC<AttendanceRealtimeTimelineProps> = ({
  title,
  hint,
  entries,
  emptyLabel,
}) => (
  <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
    <header className="mb-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </header>
    <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
      {entries.length === 0 ? (
        <li className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-6 text-center text-xs text-slate-500">{emptyLabel}</li>
      ) : (
        entries.map((e) => (
          <li
            key={e.id}
            className={`flex gap-3 rounded-lg border px-3 py-2 text-sm ${
              e.severity === 'danger'
                ? 'border-red-100 bg-red-50/60 text-red-900'
                : e.severity === 'warning'
                  ? 'border-amber-100 bg-amber-50/60 text-amber-950'
                  : 'border-slate-100 bg-slate-50/80 text-slate-800'
            }`}
          >
            <span className="shrink-0 font-mono text-xs text-slate-400">{e.at}</span>
            <span className="min-w-0 leading-snug">{e.message}</span>
          </li>
        ))
      )}
    </ul>
  </section>
);

export default AttendanceRealtimeTimeline;
