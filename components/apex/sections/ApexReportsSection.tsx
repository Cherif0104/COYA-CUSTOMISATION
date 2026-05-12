import React from 'react';
import { Button } from '../../ui/Button';
import { APEX_SHELL_CARD } from '../apexConstants';
import type { ApexReportMetrics } from '../types/apexHub';

export type ApexReportsSectionProps = {
  isFr: boolean;
  reportMetrics: ApexReportMetrics;
  cohortsLoading: boolean;
};

export const ApexReportsSection: React.FC<ApexReportsSectionProps> = ({
  isFr,
  reportMetrics,
  cohortsLoading,
}) => {
  const bar = (value: number, max: number) => Math.min(100, Math.round((value / Math.max(max, 1)) * 100));

  return (
    <div className="space-y-4">
      <div className={`${APEX_SHELL_CARD} p-5`}>
        <h3 className="text-sm font-semibold text-slate-900">
          {isFr ? 'Analytics, impact, reporting' : 'Analytics, impact, reporting'}
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          {isFr
            ? 'KPI formation (complétion, engagement, abandon), impact (insertion, progression, transformation), coaching (RDV, feedback, évolution). Exports : PDF, Excel, Power BI, API. Dashboards : programme, projet, organisation, bailleur.'
            : 'Training KPIs, impact, coaching. Exports: PDF, Excel, Power BI, API. Dashboards: program, project, org, funder.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled title={isFr ? 'Branchement export' : 'Export wiring'}>
            PDF
          </Button>
          <Button type="button" variant="secondary" disabled>
            Excel
          </Button>
          <Button type="button" variant="secondary" disabled>
            Power BI
          </Button>
          <Button type="button" variant="secondary" disabled>
            API
          </Button>
        </div>
      </div>

      <div className={`${APEX_SHELL_CARD} space-y-4 p-6`}>
        <p className="text-sm text-slate-700">
          {isFr
            ? 'Synthèse calculée depuis les tables LMS réelles (pas de valeurs factices).'
            : 'Summary from real LMS tables (no fake values).'}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs">
            <p className="font-semibold text-slate-700">{isFr ? 'Cours publiés' : 'Published courses'}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{reportMetrics.publishedCount}</p>
            <div className="mt-2 h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{ width: `${bar(reportMetrics.publishedCount, 25)}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs">
            <p className="font-semibold text-slate-700">{isFr ? 'Cohortes (sessions)' : 'Cohorts (sessions)'}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {cohortsLoading ? '…' : reportMetrics.sessionsCount}
            </p>
            <div className="mt-2 h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-sky-500"
                style={{ width: `${bar(reportMetrics.sessionsCount, 50)}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs">
            <p className="font-semibold text-slate-700">{isFr ? 'Inscriptions sessions' : 'Session enrollments'}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {cohortsLoading ? '…' : reportMetrics.totalSessionEnrollments}
            </p>
            <div className="mt-2 h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-indigo-500"
                style={{ width: `${bar(reportMetrics.totalSessionEnrollments, 500)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs">
            <p className="font-semibold text-slate-700">{isFr ? 'Cours avec ≥ 1 cohorte' : 'Courses with ≥1 cohort'}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{reportMetrics.coveragePct.toFixed(0)}%</p>
            <div className="mt-2 h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-amber-500"
                style={{ width: `${Math.min(100, reportMetrics.coveragePct)}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs">
            <p className="font-semibold text-slate-700">{isFr ? 'Inscriptions moy. / cohorte' : 'Avg enroll / cohort'}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 tabular-nums">
              {cohortsLoading ? '…' : reportMetrics.avgSessionEnrollments.toFixed(1)}
            </p>
            <div className="mt-2 h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-rose-500"
                style={{ width: `${bar(reportMetrics.avgSessionEnrollments, 50)}%` }}
              />
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          {isFr
            ? 'Agrégats : `course_sessions`, `course_session_enrollments`, `studentsCount`.'
            : 'From `course_sessions`, `course_session_enrollments`, `studentsCount`.'}
        </p>
      </div>
    </div>
  );
};
