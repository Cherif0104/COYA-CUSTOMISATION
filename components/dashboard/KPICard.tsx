import React from 'react';

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface KPICardProps {
  label: string;
  value: string | number;
  trendLabel?: string;
  trendDirection?: TrendDirection;
  /** Fond plein pastille icône (ex. `bg-violet-600`) — aligné `make figma/.../Dashboard.tsx` */
  iconTrayClassName: string;
  icon: string;
  onAction?: () => void;
  actionLabel?: string;
}

/**
 * Carte KPI alignée maquette Figma : fond blanc, bordure gray-100,
 * icône blanche sur carré `rounded-xl` coloré, badge tendance optionnel.
 */
const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  trendLabel,
  trendDirection = 'neutral',
  iconTrayClassName,
  icon,
  onAction,
  actionLabel,
}) => {
  const showTrendBadge = trendDirection === 'up' || trendDirection === 'down';
  const trendBadgeClass =
    trendDirection === 'up'
      ? 'bg-green-50 text-green-600'
      : trendDirection === 'down'
        ? 'bg-red-50 text-red-500'
        : '';

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${iconTrayClassName}`}
        >
          <i className={`${icon} text-base text-white`} aria-hidden />
        </div>
        {showTrendBadge && trendLabel != null && trendLabel !== '' && (
          <span
            className={`inline-flex max-w-[55%] items-center gap-0.5 truncate rounded-full px-2 py-1 text-xs font-medium ${trendBadgeClass}`}
          >
            <span aria-hidden>{trendDirection === 'up' ? '↗' : '↘'}</span>
            <span className="truncate">{trendLabel}</span>
          </span>
        )}
      </div>
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-bold leading-none tracking-tight text-gray-900 md:text-[1.75rem]">{value}</p>
      {!showTrendBadge && trendLabel != null && trendLabel !== '' && (
        <p className="mt-1 text-xs text-gray-400">{trendLabel}</p>
      )}
      {onAction && actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 text-xs font-semibold text-[var(--coya-institutional)] transition-opacity hover:opacity-90"
        >
          {actionLabel} →
        </button>
      )}
    </div>
  );
};

export default KPICard;
