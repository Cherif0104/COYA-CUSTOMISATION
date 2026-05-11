import React from 'react';
import * as hrAnalyticsService from '../../../services/hrAnalyticsService';
import { presenceStatusBadgeClass, presenceStatusLabel } from './presenceStatusPresentation';
import type { PresenceLiveGridRow } from './types';

export type PresenceLiveGridProps = {
  title: string;
  hint?: string;
  rows: PresenceLiveGridRow[];
  fr: boolean;
  emptyLabel: string;
  onRowAnalysis?: (profileId: string) => void;
  analysisLabel: string;
};

export const PresenceLiveGrid: React.FC<PresenceLiveGridProps> = ({
  title,
  hint,
  rows,
  fr,
  emptyLabel,
  onRowAnalysis,
  analysisLabel,
}) => (
  <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
    <header className="mb-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </header>
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {rows.length === 0 ? (
        <div className="col-span-full rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-8 text-center text-xs text-slate-500">{emptyLabel}</div>
      ) : (
        rows.map((row) => (
          <div key={row.profileId} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 shadow-sm">
            <p className="truncate text-sm font-semibold text-slate-900">{row.displayName}</p>
            <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full ${presenceStatusBadgeClass(row.currentStatus)}`}>
              {presenceStatusLabel(row.currentStatus, fr)}
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-lg font-semibold ${
                  row.dayRate >= 90 ? 'text-emerald-700' : row.dayRate >= 70 ? 'text-amber-700' : 'text-red-700'
                }`}
              >
                {row.dayRate.toFixed(0)}%
              </span>
              <span className="text-xs text-slate-500">{fr ? "aujourd'hui" : 'today'}</span>
            </div>
            <p className="mt-1 font-mono text-xs text-slate-600">
              {hrAnalyticsService.formatWorkedSecondsClockCompact(row.todayWorkedSeconds, fr)}
              <span className="text-slate-400">
                {' '}
                / {hrAnalyticsService.formatWorkedSecondsClockCompact(row.dailyTargetSeconds, fr)}
              </span>
            </p>
            {onRowAnalysis ? (
              <button
                type="button"
                onClick={() => onRowAnalysis(row.profileId)}
                className="mt-2 text-xs font-medium text-emerald-700 hover:underline"
              >
                {analysisLabel}
              </button>
            ) : null}
          </div>
        ))
      )}
    </div>
  </section>
);

export default PresenceLiveGrid;
