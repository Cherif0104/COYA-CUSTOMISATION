import React, { PropsWithChildren } from 'react';

export type WorkspaceHeaderProps = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** CTA principal + actions secondaires (MAKE FIGMA : primaire institutionnel `--coya-institutional`) */
  actions?: React.ReactNode;
  className?: string;
};

/** Bandeau titre + sous-titre + zone actions (responsive). */
export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  title,
  subtitle,
  actions,
  className = '',
}) => (
  <div
    className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}
  >
    <div className="min-w-0">
      {title != null && title !== '' && (
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">{title}</h2>
      )}
      {subtitle != null && subtitle !== '' && (
        <div className="mt-1 text-sm text-gray-500">{subtitle}</div>
      )}
    </div>
    {actions != null && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export default WorkspaceHeader;
