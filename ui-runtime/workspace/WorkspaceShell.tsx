import React, { PropsWithChildren } from 'react';

export type WorkspaceShellProps = PropsWithChildren<
  Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>
>;

/** Conteneur racine aligné MAKE FIGMA : `p-6 space-y-6` sur fond workspace. */
export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  children,
  className = '',
  ...rest
}) => (
  <div className={`p-6 space-y-6 ${className}`.trim()} {...rest}>
    {children}
  </div>
);

export default WorkspaceShell;
