import React, { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

export type EnterpriseDonutSegment = {
  name: string;
  value: number;
  color: string;
};

export interface EnterpriseDonutRingProps {
  segments: EnterpriseDonutSegment[];
  /** Grand titre centre ex. « 68% » */
  centerPrimary: string;
  /** Libellé au-dessus de l’anneau (ex. « Progression globale ») */
  heading?: string;
  className?: string;
}

/**
 * Anneau type dashboard institutionnel (Recharts) — légende sous le graphique.
 */
export const EnterpriseDonutRing: React.FC<EnterpriseDonutRingProps> = ({
  segments,
  centerPrimary,
  heading,
  className = '',
}) => {
  const data = useMemo(() => {
    const raw = segments.filter((s) => s.value > 0);
    const sum = raw.reduce((a, s) => a + s.value, 0);
    if (sum <= 0) return [{ name: '—', value: 1, color: '#E2E8F0' }];
    if (Math.abs(sum - 100) > 0.5 && sum > 0) {
      return raw.map((s) => ({ ...s, value: (s.value / sum) * 100 }));
    }
    return raw;
  }, [segments]);

  return (
    <div className={`rounded-2xl border border-[var(--coya-enterprise-border)] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] ${className}`.trim()}>
      {heading ? (
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-[var(--coya-enterprise-muted)]">{heading}</p>
      ) : null}
      <div className={`relative mx-auto h-[200px] w-full max-w-[240px] ${heading ? 'mt-2' : ''}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="88%"
              dataKey="value"
              strokeWidth={2}
              stroke="#fff"
              paddingAngle={2}
            >
              {data.map((entry, i) => (
                <Cell key={`${entry.name}-${i}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-2">
          <span className="text-2xl font-bold tabular-nums text-[var(--coya-enterprise-text)]">{centerPrimary}</span>
        </div>
      </div>
      <ul className="mt-3 space-y-2 border-t border-[var(--coya-enterprise-border)] pt-3">
        {segments.filter((s) => s.value > 0).map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 text-[var(--coya-enterprise-muted)]">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
              {s.name}
            </span>
            <span className="font-semibold tabular-nums text-[var(--coya-enterprise-text)]">{Math.round(s.value)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EnterpriseDonutRing;
