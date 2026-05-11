import React from 'react';
import type { WorkforceAlert } from './types';

export type WorkforceAlertPanelProps = {
  title: string;
  alerts: WorkforceAlert[];
  emptyLabel: string;
};

export const WorkforceAlertPanel: React.FC<WorkforceAlertPanelProps> = ({ title, alerts, emptyLabel }) => (
  <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    <ul className="mt-3 space-y-2">
      {alerts.length === 0 ? (
        <li className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-4 text-center text-xs text-slate-500">{emptyLabel}</li>
      ) : (
        alerts.map((a) => (
          <li
            key={a.id}
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
              a.severity === 'danger'
                ? 'border-red-200 bg-red-50 text-red-900'
                : a.severity === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-950'
                  : 'border-slate-200 bg-slate-50 text-slate-800'
            }`}
          >
            <span className="shrink-0 font-semibold" aria-hidden>
              {a.severity === 'danger' ? '⚠' : a.severity === 'warning' ? '⚠' : '●'}
            </span>
            <span>{a.label}</span>
          </li>
        ))
      )}
    </ul>
  </section>
);

export default WorkforceAlertPanel;
