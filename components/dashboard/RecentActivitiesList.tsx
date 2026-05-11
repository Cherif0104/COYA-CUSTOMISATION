import React from 'react';
import { useLocalization } from '../../contexts/LocalizationContext';

export interface RecentActivityItem {
  id: string;
  icon: string;
  iconColorClass?: string;
  label: string;
  time: string;
  amount?: string;
  status?: 'completed' | 'pending' | 'in_progress';
  statusLabel?: string;
}

export interface RecentActivitiesListProps {
  title: string;
  /** Sous-titre type make figma (« Dernières actions sur la plateforme »). */
  subtitle?: string;
  items: RecentActivityItem[];
  period: 'today' | 'weekly' | 'monthly';
  onPeriodChange?: (period: 'today' | 'weekly' | 'monthly') => void;
  setView?: (view: string) => void;
  emptyMessage?: string;
}

const statusStyles: Record<string, string> = {
  completed: 'bg-coya-emeraude/20 text-coya-emeraude',
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
};

const RecentActivitiesList: React.FC<RecentActivitiesListProps> = ({
  title,
  subtitle,
  items,
  period,
  onPeriodChange,
  setView,
  emptyMessage,
}) => {
  const { t } = useLocalization();
  const displayEmptyMessage = emptyMessage ?? t('no_recent_activity');
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p> : null}
        </div>
        {onPeriodChange && (
          <div className="flex overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={() => onPeriodChange('today')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                period === 'today'
                  ? 'bg-[var(--coya-institutional)] text-white'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('today')}
            </button>
            <button
              type="button"
              onClick={() => onPeriodChange('weekly')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                period === 'weekly'
                  ? 'bg-[var(--coya-institutional)] text-white'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('dashboard_week')}
            </button>
            <button
              type="button"
              onClick={() => onPeriodChange('monthly')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                period === 'monthly'
                  ? 'bg-[var(--coya-institutional)] text-white'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('dashboard_month')}
            </button>
          </div>
        )}
      </div>
      <ul className="space-y-3">
        {items.length === 0 ? (
          <li className="text-sm text-coya-text-muted py-4 text-center">{displayEmptyMessage}</li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 border-b border-gray-100 py-2 last:border-0"
            >
              <div
                className={`rounded-full p-2 shrink-0 ${
                  item.iconColorClass ? item.iconColorClass : 'text-coya-primary bg-coya-primary/10'
                }`}
              >
                <i className={`${item.icon} text-sm`} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-coya-text truncate">{item.label}</p>
                <p className="text-xs text-coya-text-muted">{item.time}</p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {item.amount && (
                  <span className="text-sm font-semibold text-coya-text">{item.amount}</span>
                )}
                {item.statusLabel && item.status && (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      statusStyles[item.status] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item.statusLabel}
                  </span>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
      {setView && items.length > 0 && (
        <button
          type="button"
          onClick={() => setView('planning')}
          className="mt-4 text-sm font-semibold text-[var(--coya-institutional)] hover:opacity-90"
        >
          {t('view_all')} →
        </button>
      )}
    </div>
  );
};

export default RecentActivitiesList;
