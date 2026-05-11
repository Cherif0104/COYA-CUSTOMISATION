import React, { PropsWithChildren } from 'react';

/** Groupe visuel de la timeline (ex. par correlation_id). */
export const TimelineGroup: React.FC<
  PropsWithChildren<{ title?: React.ReactNode; className?: string }>
> = ({ title, className = '', children }) => (
  <li className={`rounded-lg border border-slate-100 bg-slate-50/80 p-3 ${className}`.trim()}>
    {title != null && (
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{title}</p>
    )}
    <ul className="space-y-2">{children}</ul>
  </li>
);

export default TimelineGroup;
