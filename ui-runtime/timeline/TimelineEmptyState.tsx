import React from 'react';

export type TimelineEmptyStateProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
};

export const TimelineEmptyState: React.FC<TimelineEmptyStateProps> = ({
  title,
  description,
  className = '',
}) => (
  <div className={`rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center ${className}`.trim()}>
    <p className="text-sm font-medium text-slate-700">{title}</p>
    {description != null && <p className="mt-1 text-xs text-slate-500">{description}</p>}
  </div>
);

export default TimelineEmptyState;
