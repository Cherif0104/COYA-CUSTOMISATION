import React, { PropsWithChildren } from 'react';

export type WorkspaceFiltersProps = PropsWithChildren<{
  className?: string;
}>;

/** Barre filtres / chips (MAKE FIGMA — rangée sous header ou au-dessus du focus). */
export const WorkspaceFilters: React.FC<WorkspaceFiltersProps> = ({ className = '', children }) => (
  <div
    className={`flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/80 p-3 ${className}`.trim()}
  >
    {children}
  </div>
);

export default WorkspaceFilters;
