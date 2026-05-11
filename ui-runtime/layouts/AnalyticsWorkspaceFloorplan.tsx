import React, { PropsWithChildren } from 'react';
import { WorkspaceShell } from '../workspace/WorkspaceShell';
import { WorkspaceHeader } from '../workspace/WorkspaceHeader';

export type AnalyticsWorkspaceFloorplanProps = PropsWithChildren<
  {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    headerActions?: React.ReactNode;
    filters?: React.ReactNode;
    kpi?: React.ReactNode;
    className?: string;
  } & Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'title'>
>;

/**
 * Floorplan analytique : filtres + KPI + graphiques / insights dans `children`.
 */
export const AnalyticsWorkspaceFloorplan: React.FC<AnalyticsWorkspaceFloorplanProps> = ({
  title,
  subtitle,
  headerActions,
  filters,
  kpi,
  className = '',
  children,
  ...shellProps
}) => (
  <WorkspaceShell className={className} {...shellProps}>
    <WorkspaceHeader title={title} subtitle={subtitle} actions={headerActions} />
    {filters}
    {kpi}
    {children}
  </WorkspaceShell>
);

export default AnalyticsWorkspaceFloorplan;
