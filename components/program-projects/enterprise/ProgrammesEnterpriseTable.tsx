import React, { useMemo } from 'react';
import type { Programme, Project } from '../../../types';

export function portfolioProgressPercent(programmeId: string, projects: Project[]): number {
  const ps = projects.filter((x) => String(x.programmeId) === String(programmeId));
  if (ps.length === 0) return 0;
  const scores = ps.map((p) => {
    const tasks = p.tasks || [];
    if (tasks.length === 0) {
      if (p.status === 'Completed') return 100;
      if (p.status === 'In Progress') return 40;
      return 10;
    }
    const done = tasks.filter((t) => t.status === 'Completed').length;
    return Math.round((done / tasks.length) * 100);
  });
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export interface ProgrammeBudgetLineLite {
  programmeId: string;
  plannedAmount: number;
  currency?: string;
}

export interface ProgrammesEnterpriseTableProps {
  programmes: Programme[];
  budgetLines: ProgrammeBudgetLineLite[];
  projects: Project[];
  loading: boolean;
  isFr: boolean;
  onSelect: (p: Programme) => void;
  onEdit: (p: Programme) => void;
  onDelete: (p: Programme) => void;
  isAuditorReadOnly: boolean;
}

export const ProgrammesEnterpriseTable: React.FC<ProgrammesEnterpriseTableProps> = ({
  programmes,
  budgetLines,
  projects,
  loading,
  isFr,
  onSelect,
  onEdit,
  onDelete,
  isAuditorReadOnly,
}) => {
  const budgetByProgramme = useMemo(() => {
    const m = new Map<string, { sum: number; cur: string }>();
    for (const l of budgetLines) {
      const id = String(l.programmeId);
      const prev = m.get(id) || { sum: 0, cur: l.currency || 'XOF' };
      prev.sum += Number(l.plannedAmount || 0);
      prev.cur = l.currency || prev.cur;
      m.set(id, prev);
    }
    return m;
  }, [budgetLines]);

  const fmtMoney = (amount: number, cur: string) =>
    new Intl.NumberFormat(isFr ? 'fr-FR' : 'en-US', { maximumFractionDigits: 0 }).format(amount) + ` ${cur}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--coya-enterprise-border)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--coya-enterprise-border)] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[var(--coya-enterprise-muted)]">
              <th className="px-4 py-3">{isFr ? 'Programme' : 'Programme'}</th>
              <th className="px-4 py-3">{isFr ? 'Description' : 'Description'}</th>
              <th className="px-4 py-3">{isFr ? 'Projets' : 'Projects'}</th>
              <th className="px-4 py-3">{isFr ? 'Statut' : 'Status'}</th>
              <th className="px-4 py-3">{isFr ? 'Budget' : 'Budget'}</th>
              <th className="min-w-[140px] px-4 py-3">{isFr ? 'Progression' : 'Progress'}</th>
              <th className="w-28 px-4 py-3 text-right">{isFr ? 'Actions' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--coya-enterprise-border)]">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--coya-enterprise-muted)]">
                  {isFr ? 'Chargement…' : 'Loading…'}
                </td>
              </tr>
            ) : programmes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--coya-enterprise-muted)]">
                  {isFr ? 'Aucun programme' : 'No programmes'}
                </td>
              </tr>
            ) : (
              programmes.map((p) => {
                const projN = projects.filter((x) => String(x.programmeId) === String(p.id)).length;
                const pct = portfolioProgressPercent(p.id, projects);
                const bud = budgetByProgramme.get(String(p.id));
                const budgetLabel =
                  bud && bud.sum > 0 ? fmtMoney(bud.sum, bud.cur) : '—';
                const active = p.allowProjects !== false;
                return (
                  <tr
                    key={p.id}
                    className="cursor-pointer transition-colors hover:bg-[#F8FAFC]"
                    onClick={() => onSelect(p)}
                  >
                    <td className="px-4 py-3 font-semibold text-[var(--coya-enterprise-text)]">{p.name}</td>
                    <td className="max-w-xs px-4 py-3 text-[var(--coya-enterprise-muted)]">
                      <span className="line-clamp-2">{p.description || '—'}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[var(--coya-enterprise-text)]">{projN}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          active
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                            : 'border border-slate-200 bg-slate-100 text-slate-700'
                        }`}
                      >
                        {active ? (isFr ? 'Actif' : 'Active') : isFr ? 'Archive' : 'Archived'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums">{budgetLabel}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-[#E2E8F0]">
                          <div
                            className="h-full rounded-full bg-[var(--coya-institutional)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs font-semibold tabular-nums">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {!isAuditorReadOnly && (
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="rounded-xl border border-[var(--coya-enterprise-border)] px-3 py-1.5 text-xs font-medium text-[var(--coya-institutional)] hover:bg-emerald-50"
                            onClick={() => onEdit(p)}
                          >
                            {isFr ? 'Modifier' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            className="rounded-xl border border-red-100 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                            onClick={() => onDelete(p)}
                          >
                            {isFr ? 'Suppr.' : 'Del.'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProgrammesEnterpriseTable;
