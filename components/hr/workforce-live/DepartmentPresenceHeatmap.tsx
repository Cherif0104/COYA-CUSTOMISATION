import React from 'react';
import type { DepartmentPresenceCard } from './types';

export type DepartmentPresenceHeatmapProps = {
  title: string;
  hint?: string;
  departments: DepartmentPresenceCard[];
};

export const DepartmentPresenceHeatmap: React.FC<DepartmentPresenceHeatmapProps> = ({ title, hint, departments }) => (
  <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
    <header className="mb-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </header>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {departments.map((d) => (
        <div
          key={d.id}
          className={`rounded-xl border px-3 py-3 ${
            d.overtimeStress ? 'border-amber-200 bg-amber-50/80' : 'border-slate-100 bg-slate-50/80'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{d.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{d.presentPct}%</p>
          <p className="mt-1 text-xs text-slate-600">
            {d.absentCount} abs. · {d.lateCount} retard(s)
            {d.overtimeStress ? ' · HS' : ''}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, d.presentPct)}%` }} />
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default DepartmentPresenceHeatmap;
