import React from 'react';
import type { Project } from '../../../types';

export interface EnterpriseProjectsTableProps {
  projects: Project[];
  localize: (en: string, fr: string) => string;
  isFr: boolean;
  isLoading: boolean;
  /** Libellé FR pour statut projet */
  statusUi: (status: string) => { label: string; badge: string; icon: string };
  progressPercent: (project: Project) => number;
  formatBudget: (project: Project) => string;
  managerLabel: (project: Project) => string;
  onOpenRow: (projectId: string) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  canManage: (project: Project) => boolean;
}

export const EnterpriseProjectsTable: React.FC<EnterpriseProjectsTableProps> = ({
  projects,
  localize,
  isFr,
  isLoading,
  statusUi,
  progressPercent,
  formatBudget,
  managerLabel,
  onOpenRow,
  onEdit,
  onDelete,
  canManage,
}) => {
  return (
    <div
      data-testid="projects-enterprise-table"
      className="overflow-hidden rounded-2xl border border-[var(--coya-enterprise-border)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--coya-enterprise-border)] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[var(--coya-enterprise-muted)]">
              <th className="px-4 py-3">{localize('Project', 'Projet')}</th>
              <th className="px-4 py-3">{localize('Programme', 'Programme')}</th>
              <th className="px-4 py-3">{localize('Status', 'Statut')}</th>
              <th className="px-4 py-3">{localize('Budget', 'Budget')}</th>
              <th className="min-w-[140px] px-4 py-3">{localize('Progress', 'Progression')}</th>
              <th className="px-4 py-3">{localize('Project manager', 'Chef de projet')}</th>
              <th className="w-28 px-4 py-3 text-right">{localize('Actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--coya-enterprise-border)] text-[var(--coya-enterprise-text)]">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--coya-enterprise-muted)]">
                  <i className="fas fa-spinner fa-spin mr-2" aria-hidden />
                  {localize('Loading…', 'Chargement…')}
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--coya-enterprise-muted)]">
                  {localize('No projects to display.', 'Aucun projet à afficher.')}
                </td>
              </tr>
            ) : (
              projects.map((project) => {
                const st = statusUi(project.status);
                const pct = Math.min(100, Math.max(0, progressPercent(project)));
                const initials =
                  (managerLabel(project) || '—')
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((s) => s[0]?.toUpperCase())
                    .join('') || '?';
                const openRow = () => onOpenRow(String(project.id));
                return (
                  <tr
                    key={String(project.id)}
                    data-testid="project-item"
                    data-project-id={project.id}
                    tabIndex={0}
                    className="cursor-pointer transition-colors hover:bg-[#F8FAFC] focus-visible:bg-[#F8FAFC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--coya-institutional)]"
                    aria-label={
                      isFr ? `Ouvrir le projet ${project.title}` : `Open project ${project.title}`
                    }
                    onClick={openRow}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openRow();
                      }
                    }}
                  >
                    <td className="max-w-[240px] px-4 py-3">
                      <p className="font-semibold text-[var(--coya-enterprise-text)] line-clamp-2">{project.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--coya-enterprise-muted)] line-clamp-1">
                        {project.description || '—'}
                      </p>
                    </td>
                    <td className="max-w-[180px] px-4 py-3 text-sm text-[var(--coya-enterprise-muted)]">
                      <span className="line-clamp-2">
                        {project.programmeName ||
                          localize('Not linked', 'Non rattaché')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${st.badge}`}
                      >
                        <i className={`fas ${st.icon} text-[10px]`} aria-hidden />
                        {st.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-[var(--coya-enterprise-text)]">
                      {formatBudget(project)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E2E8F0]">
                          <div
                            className="h-full rounded-full bg-[var(--coya-institutional)] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs font-semibold tabular-nums text-[var(--coya-enterprise-text)]">
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--coya-institutional)] to-[var(--coya-institutional-secondary)] text-xs font-bold text-white">
                          {initials}
                        </div>
                        <span className="max-w-[140px] truncate text-sm">{managerLabel(project)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title={localize('Open', 'Ouvrir')}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--coya-enterprise-border)] text-[var(--coya-enterprise-muted)] transition-colors hover:border-[var(--coya-institutional)] hover:text-[var(--coya-institutional)]"
                          onClick={openRow}
                        >
                          <i className="fas fa-arrow-up-right-from-square text-xs" aria-hidden />
                        </button>
                        {canManage(project) && (
                          <>
                            <button
                              type="button"
                              title={localize('Edit', 'Modifier')}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--coya-enterprise-border)] text-slate-600 transition-colors hover:bg-slate-50"
                              onClick={() => onEdit(project)}
                            >
                              <i className="fas fa-pen text-xs" aria-hidden />
                            </button>
                            <button
                              type="button"
                              title={localize('Delete', 'Supprimer')}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-600 transition-colors hover:bg-red-50"
                              onClick={() => onDelete(project)}
                            >
                              <i className="fas fa-trash text-xs" aria-hidden />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="border-t border-[var(--coya-enterprise-border)] px-4 py-2 text-center text-xs text-[var(--coya-enterprise-muted)]">
        {isFr ? `${projects.length} projet(s) sur cette page` : `${projects.length} project(s) on this page`}
      </p>
    </div>
  );
};

export default EnterpriseProjectsTable;
