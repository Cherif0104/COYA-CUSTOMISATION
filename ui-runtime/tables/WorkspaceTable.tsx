import React, { PropsWithChildren } from 'react';

export type WorkspaceTableProps = PropsWithChildren<{
  className?: string;
}>;

/** Table workspace lisible : scroll horizontal + style cohérent Figma. */
export const WorkspaceTable: React.FC<WorkspaceTableProps> = ({ className = '', children }) => (
  <div className={`overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`.trim()}>
    <table className="min-w-full divide-y divide-gray-100 text-left text-sm">{children}</table>
  </div>
);

export default WorkspaceTable;
