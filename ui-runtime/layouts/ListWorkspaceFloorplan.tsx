import React, { PropsWithChildren } from 'react';
import { WorkspaceShell } from '../workspace/WorkspaceShell';
import { WorkspaceHeader } from '../workspace/WorkspaceHeader';

export type ListWorkspaceFloorplanProps = PropsWithChildren<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  /** Filtres / chips sous le header */
  filters?: React.ReactNode;
  /** Rangée KPI (optionnelle) */
  kpi?: React.ReactNode;
  className?: string;
}>;

/**
 * Floorplan « liste » : header → filtres → KPI → contenu (table) → inspector optionnel via children layout parent.
 * Aligné SAP Fiori List Report / MAKE FIGMA list workspaces.
 */
export const ListWorkspaceFloorplan: React.FC<ListWorkspaceFloorplanProps> = ({
  title,
  subtitle,
  headerActions,
  filters,
  kpi,
  className = '',
  children,
}) => (
  <WorkspaceShell className={className}>
    <WorkspaceHeader title={title} subtitle={subtitle} actions={headerActions} />
    {filters}
    {kpi}
    {children}
  </WorkspaceShell>
);

export default ListWorkspaceFloorplan;
