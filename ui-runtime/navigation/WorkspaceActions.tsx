import React, { PropsWithChildren } from 'react';

/** Zone actions globales (CTA secondaires, menus) — alignée à droite de la top bar. */
export const WorkspaceActions: React.FC<PropsWithChildren<{ className?: string }>> = ({
  children,
  className = '',
}) => (
  <div className={`flex shrink-0 flex-wrap items-center justify-end gap-2 ${className}`.trim()}>{children}</div>
);

export default WorkspaceActions;
