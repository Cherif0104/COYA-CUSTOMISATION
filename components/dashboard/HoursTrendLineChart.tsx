import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useLocalization } from '../../contexts/LocalizationContext';

export interface TimeSeriesPoint {
  period: string;
  value: number;
  value2?: number;
}

export interface HoursTrendLineChartProps {
  data: TimeSeriesPoint[];
  title: string;
  description?: string;
  period: 'weekly' | 'monthly';
  onPeriodChange?: (period: 'weekly' | 'monthly') => void;
  lineColor?: string;
  setView?: (view: string) => void;
}

const HoursTrendLineChart: React.FC<HoursTrendLineChartProps> = ({
  data,
  title,
  description,
  period,
  onPeriodChange,
  lineColor = 'var(--coya-primary)',
  setView,
}) => {
  const { t } = useLocalization();
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {description ? <p className="mt-0.5 text-xs text-gray-400">{description}</p> : null}
        </div>
        {onPeriodChange && (
          <div className="flex overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
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
      <div className="h-64">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-coya-text-muted text-sm">
            {t('dashboard_no_data_period')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--coya-border)" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12, fill: 'var(--coya-text-muted)' }}
                stroke="var(--coya-border)"
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--coya-text-muted)' }}
                stroke="var(--coya-border)"
                tickFormatter={(v) => `${v}h`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--coya-card-bg)',
                  border: '1px solid var(--coya-border)',
                  borderRadius: 'var(--coya-radius)',
                }}
                formatter={(value: number) => [`${value.toFixed(1)} h`, t('dashboard_hours')]}
                labelFormatter={(label) => label}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2}
                dot={{ fill: lineColor, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      {setView && (
        <button
          type="button"
          onClick={() => setView('planning')}
          className="mt-3 text-sm font-semibold text-[var(--coya-institutional)] hover:opacity-90"
        >
          {t('view_time_logs')} →
        </button>
      )}
    </div>
  );
};

export default HoursTrendLineChart;
