import React from 'react';
import { Button } from '../../ui/Button';
import { APEX_SHELL_CARD } from '../apexConstants';
import type { ApexCohortRow } from '../types/apexHub';
import type { ModuleName } from '../../../types';
import { projectsHomeView } from '../../../utils/programmesProjectsNav';

export type ApexCohortsSectionProps = {
  isFr: boolean;
  cohortRows: ApexCohortRow[];
  cohortsLoading: boolean;
  cohortsError: string | null;
  canAccessModule: (m: ModuleName) => boolean;
  setView: (view: string) => void;
  openCrmCollecteForCourse: (courseId: string) => void;
  firstCourseId: string;
};

export const ApexCohortsSection: React.FC<ApexCohortsSectionProps> = ({
  isFr,
  cohortRows,
  cohortsLoading,
  cohortsError,
  canAccessModule,
  setView,
  openCrmCollecteForCourse,
  firstCourseId,
}) => {
  return (
    <div className="space-y-4">
      <div className={`${APEX_SHELL_CARD} p-5`}>
        <h3 className="text-sm font-semibold text-slate-900">
          {isFr ? 'Architecture cohorte' : 'Cohort architecture'}
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          {isFr
            ? 'Une cohorte peut être liée à : programme, projet, activité, partenaire, région, bailleur. Gestion participants : ajout, import, collecte, CRM, formulaires publics.'
            : 'A cohort may link to: program, project, activity, partner, region, funder. Participants: add, import, collect, CRM, public forms.'}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: 'p', label: isFr ? 'Programme' : 'Program', mod: 'programme' as const },
            {
              k: 'j',
              label: isFr ? 'Projet' : 'Project',
              mod: 'projects' as const,
              resolveView: () => projectsHomeView(canAccessModule),
            },
            { k: 'c', label: 'CRM', mod: 'crm_sales' as const },
            { k: 'col', label: isFr ? 'Collecte' : 'Collect', mod: 'collecte' as const },
          ].map((x) => (
            <div key={x.k} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
              <p className="font-semibold text-slate-800">{x.label}</p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-2"
                disabled={!canAccessModule(x.mod)}
                onClick={() => setView('resolveView' in x ? x.resolveView() : x.mod)}
              >
                {isFr ? 'Ouvrir' : 'Open'}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className={`${APEX_SHELL_CARD} space-y-4 p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-700">
              {isFr
                ? 'Cohortes et sessions (`course_sessions`, `course_session_enrollments`). Accès : dates début/fin, expiration auto.'
                : 'Cohorts and sessions from LMS tables. Access: start/end, auto expiry.'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {isFr
                ? 'Sous-groupes, salles, équipes — extensions métier sur la même base.'
                : 'Subgroups, rooms, teams — business extensions on same base.'}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            {cohortsLoading ? (isFr ? 'Chargement…' : 'Loading…') : `${cohortRows.length} sessions`}
          </div>
        </div>
        {cohortsError && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{cohortsError}</p>
        )}
        {!cohortsLoading && cohortRows.length === 0 ? (
          <p className="text-sm text-slate-500">
            {isFr ? 'Aucune cohorte pour les cours actuels.' : 'No cohorts for current courses.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">{isFr ? 'Cours' : 'Course'}</th>
                  <th className="px-3 py-2">{isFr ? 'Cohorte / session' : 'Cohort / session'}</th>
                  <th className="px-3 py-2">{isFr ? 'Période' : 'Period'}</th>
                  <th className="px-3 py-2">{isFr ? 'Statut' : 'Status'}</th>
                  <th className="px-3 py-2">{isFr ? 'Inscrits' : 'Enrolled'}</th>
                  <th className="px-3 py-2">{isFr ? 'Actions' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {cohortRows.map((row) => {
                  const starts = row.startsAt ? new Date(row.startsAt) : null;
                  const ends = row.endsAt ? new Date(row.endsAt) : null;
                  const period =
                    starts || ends
                      ? `${starts ? starts.toLocaleDateString() : '—'} → ${ends ? ends.toLocaleDateString() : '—'}`
                      : '—';
                  return (
                    <tr key={row.sessionId} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-2 text-slate-900">{row.courseTitle}</td>
                      <td className="px-3 py-2">{row.sessionTitle}</td>
                      <td className="px-3 py-2">{period}</td>
                      <td className="px-3 py-2">{row.status}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.enrollmentCount}</td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={!canAccessModule('crm_sales')}
                          onClick={() => openCrmCollecteForCourse(row.courseId)}
                        >
                          CRM→{isFr ? 'Collecte' : 'Collect'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" disabled={!canAccessModule('collecte')} onClick={() => setView('collecte')}>
            {isFr ? 'Import / formulaires (Collecte)' : 'Import / forms (Collect)'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!canAccessModule('crm_sales')}
            onClick={() => openCrmCollecteForCourse(firstCourseId)}
          >
            {isFr ? 'Preset CRM → Collecte' : 'CRM → Collect preset'}
          </Button>
        </div>
      </div>
    </div>
  );
};
