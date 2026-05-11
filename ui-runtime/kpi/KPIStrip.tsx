import React from 'react';

export type KPIStripItem = {
  id: string;
  label: string;
  value: React.ReactNode;
  unit?: string;
  /** Ex. "+8 %" — badge tendance MAKE FIGMA */
  change?: React.ReactNode;
  /** Icône (ex. lucide) dans carré coloré */
  icon?: React.ReactNode;
  /** Classes Tailwind pour le carré icône, ex. `bg-emerald-500` */
  accentClass?: string;
};

export type KPIStripProps = {
  items: KPIStripItem[];
  /** Plafond UX canon : 5 par défaut */
  max?: number;
  className?: string;
};

/** Rangée de cartes KPI (pattern CRMVentes / MAKE FIGMA). */
export const KPIStrip: React.FC<KPIStripProps> = ({ items, max = 5, className = '' }) => {
  const slice = items.slice(0, Math.min(max, 6));
  const cols =
    slice.length <= 2 ? 'grid-cols-2' : slice.length === 3 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid gap-4 ${cols} ${className}`.trim()}>
      {slice.map((k) => (
        <div
          key={k.id}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-start justify-between">
            {k.icon != null && (
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${k.accentClass ?? 'bg-slate-600'}`}
              >
                {k.icon}
              </div>
            )}
            {k.change != null && (
              <span className="flex items-center gap-0.5 rounded-full bg-green-50 px-2 py-1 text-xs text-green-600">
                {k.change}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900">{k.value}</div>
          <div className="mt-1 text-xs text-gray-400">
            {k.unit != null && k.unit !== '' ? `${k.unit} · ` : null}
            {k.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPIStrip;
