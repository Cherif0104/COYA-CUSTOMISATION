import React from 'react';

export type PerformanceLevel = 'excellent' | 'good' | 'medium' | 'insufficient';

export interface PerformanceCabaneItem {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  level: PerformanceLevel;
  icon: string;
  onAction?: () => void;
  actionLabel?: string;
}

export interface PerformanceCabanesProps {
  title: string;
  items: PerformanceCabaneItem[];
  globalScoreLabel?: string;
  /** Marge / classes sur le conteneur racine (ex. `mb-8`). */
  className?: string;
}

/** Aligné Dashboard : cartes blanches type `KPICard` + accent niveau sur halo icône et trait gauche. */
const levelVisuals: Record<
  PerformanceLevel,
  { iconBg: string; iconColor: string; accentBorder: string }
> = {
  excellent: {
    iconBg: 'bg-coya-emeraude/10',
    iconColor: 'text-coya-emeraude',
    accentBorder: 'border-l-[3px] border-l-coya-emeraude',
  },
  good: {
    iconBg: 'bg-coya-institutional/10',
    iconColor: 'text-coya-institutional',
    accentBorder: 'border-l-[3px] border-l-coya-institutional',
  },
  medium: {
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-800',
    accentBorder: 'border-l-[3px] border-l-amber-400',
  },
  insufficient: {
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    accentBorder: 'border-l-[3px] border-l-red-400',
  },
};

const PerformanceCabanes: React.FC<PerformanceCabanesProps> = ({
  title,
  items,
  globalScoreLabel,
  className = 'mb-8',
}) => {
  return (
    <section className={className}>
      <div className="rounded-coya border border-coya-border/50 bg-coya-card p-6 shadow-coya">
        <header className="mb-5 border-b border-coya-border/60 pb-4">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h2>
          {globalScoreLabel ? (
            <p className="mt-1.5 text-sm leading-relaxed text-coya-text-muted">{globalScoreLabel}</p>
          ) : null}
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const lv = levelVisuals[item.level];
            return (
              <div
                key={item.id}
                className={`rounded-coya border border-gray-100 bg-white p-5 shadow-sm ${lv.accentBorder}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-coya-text-muted">{item.title}</p>
                    <p className="mt-1 truncate text-2xl font-bold tabular-nums text-coya-text md:text-3xl">
                      {item.value}
                    </p>
                    {item.subtitle ? (
                      <p className="mt-1 text-xs leading-snug text-coya-text-muted">{item.subtitle}</p>
                    ) : null}
                    {item.onAction && item.actionLabel ? (
                      <button
                        type="button"
                        onClick={item.onAction}
                        className="mt-3 text-xs font-semibold text-coya-institutional transition-colors hover:text-coya-institutional-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-coya-institutional/30 focus-visible:ring-offset-2 rounded-sm"
                      >
                        {item.actionLabel} →
                      </button>
                    ) : null}
                  </div>
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${lv.iconBg}`}
                  >
                    <i className={`${item.icon} ${lv.iconColor} text-lg`} aria-hidden />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PerformanceCabanes;
