import React from 'react';

export type EnterpriseFinanceKpiItem = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  variant?: 'default' | 'positive' | 'warning' | 'danger';
};

const variantClass: Record<NonNullable<EnterpriseFinanceKpiItem['variant']>, string> = {
  default: 'text-[var(--coya-enterprise-text)]',
  positive: 'text-emerald-800',
  warning: 'text-amber-900',
  danger: 'text-red-800',
};

export interface EnterpriseFinanceKpiStripProps {
  title?: string;
  items: EnterpriseFinanceKpiItem[];
  className?: string;
  /** Pour tests e2e / repères DOM (ex. `enterprise-finance-kpi-strip`). */
  dataTestId?: string;
}

/** Bandeau 4 cartes analytiques — budget institutionnel (projets / programmes). */
export const EnterpriseFinanceKpiStrip: React.FC<EnterpriseFinanceKpiStripProps> = ({
  title,
  items,
  className = '',
  dataTestId = 'enterprise-finance-kpi-strip',
}) => (
  <div
    data-testid={dataTestId}
    className={`rounded-2xl border border-[var(--coya-enterprise-border)] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] ${className}`.trim()}
  >
    {title ? (
      <h4 className="mb-3 text-sm font-semibold text-[var(--coya-enterprise-text)]">{title}</h4>
    ) : null}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.id}
          className="rounded-xl border border-[var(--coya-enterprise-border)] bg-[#F8FAFC]/80 px-4 py-3"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--coya-enterprise-muted)]">{it.label}</p>
          <p className={`mt-1 text-lg font-bold tabular-nums leading-tight ${variantClass[it.variant ?? 'default']}`}>
            {it.value}
          </p>
          {it.hint ? <p className="mt-0.5 text-xs text-[var(--coya-enterprise-muted)]">{it.hint}</p> : null}
        </div>
      ))}
    </div>
  </div>
);

export default EnterpriseFinanceKpiStrip;
