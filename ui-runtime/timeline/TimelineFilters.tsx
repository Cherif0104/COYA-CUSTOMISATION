import React, { PropsWithChildren } from 'react';

/** Filtres / rafraîchissement pour une timeline runtime. */
export const TimelineFilters: React.FC<
  PropsWithChildren<{ className?: string }>
> = ({ className = '', children }) => (
  <div className={`mb-3 flex flex-wrap items-center justify-between gap-2 ${className}`.trim()}>{children}</div>
);

export default TimelineFilters;
