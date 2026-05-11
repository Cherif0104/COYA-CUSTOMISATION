import React, { PropsWithChildren } from 'react';
import { WorkspaceShell } from '../workspace/WorkspaceShell';
import { WorkspaceHeader } from '../workspace/WorkspaceHeader';

export type WorklistFloorplanProps = PropsWithChildren<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  /** Résumé minimal optionnel (badges, compteurs) */
  summary?: React.ReactNode;
  className?: string;
}>;

/**
 * Floorplan « worklist » : liste de tâches / files — header serré + résumé + liste dense.
 */
export const WorklistFloorplan: React.FC<WorklistFloorplanProps> = ({
  title,
  subtitle,
  headerActions,
  summary,
  className = '',
  children,
}) => (
  <WorkspaceShell className={className}>
    <WorkspaceHeader title={title} subtitle={subtitle} actions={headerActions} />
    {summary}
    {children}
  </WorkspaceShell>
);

export default WorklistFloorplan;
