/**
 * COYA UI Runtime — primitives & floorplans alignés MAKE FIGMA.
 * @see docs/enterprise-canon/FIGMA-UI-SOURCE-OF-TRUTH.md
 */

export { WorkspaceShell } from './workspace/WorkspaceShell';
export { WorkspaceHeader } from './workspace/WorkspaceHeader';
export type { WorkspaceHeaderProps } from './workspace/WorkspaceHeader';
export { WorkspaceSection } from './workspace/WorkspaceSection';
export type { WorkspaceSectionProps } from './workspace/WorkspaceSection';

export { KPIStrip } from './kpi/KPIStrip';
export type { KPIStripItem, KPIStripProps } from './kpi/KPIStrip';

export { PillTabs } from './tabs/PillTabs';
export type { PillTabItem, PillTabsProps } from './tabs/PillTabs';

export { InspectorPanel } from './inspector/InspectorPanel';
export type { InspectorPanelProps } from './inspector/InspectorPanel';

export { TimelineView, TimelineViewItem } from './timeline/TimelineView';
export type { TimelineViewProps, TimelineViewItemProps } from './timeline/TimelineView';
export { TimelineGroup } from './timeline/TimelineGroup';
export { TimelineEvent } from './timeline/TimelineEvent';
export { TimelineChain } from './timeline/TimelineChain';
export { TimelineFilters } from './timeline/TimelineFilters';
export { TimelineInspector } from './timeline/TimelineInspector';
export { TimelineEmptyState } from './timeline/TimelineEmptyState';
export type { TimelineEmptyStateProps } from './timeline/TimelineEmptyState';

export { ActivityFeed } from './activity/ActivityFeed';
export type { ActivityFeedProps } from './activity/ActivityFeed';

export { WorkspaceTable } from './tables/WorkspaceTable';
export type { WorkspaceTableProps } from './tables/WorkspaceTable';

export { WorkspaceFilters } from './filters/WorkspaceFilters';
export type { WorkspaceFiltersProps } from './filters/WorkspaceFilters';

export { CommandBar, PrimaryWorkspaceButton } from './command/CommandBar';

export { ListWorkspaceFloorplan } from './layouts/ListWorkspaceFloorplan';
export type { ListWorkspaceFloorplanProps } from './layouts/ListWorkspaceFloorplan';

export { ObjectWorkspaceFloorplan } from './layouts/ObjectWorkspaceFloorplan';
export type { ObjectWorkspaceFloorplanProps } from './layouts/ObjectWorkspaceFloorplan';

export { AnalyticsWorkspaceFloorplan } from './layouts/AnalyticsWorkspaceFloorplan';
export type { AnalyticsWorkspaceFloorplanProps } from './layouts/AnalyticsWorkspaceFloorplan';

export { WorklistFloorplan } from './layouts/WorklistFloorplan';
export type { WorklistFloorplanProps } from './layouts/WorklistFloorplan';

export { WorkspaceBackButton } from './navigation/WorkspaceBackButton';
export type { WorkspaceBackButtonProps } from './navigation/WorkspaceBackButton';
export { WorkspaceBreadcrumbs } from './navigation/WorkspaceBreadcrumbs';
export type { WorkspaceBreadcrumbItem, WorkspaceBreadcrumbsProps } from './navigation/WorkspaceBreadcrumbs';
export { WorkspaceActions } from './navigation/WorkspaceActions';
export { WorkspaceTopBar } from './navigation/WorkspaceTopBar';
export type { WorkspaceTopBarProps } from './navigation/WorkspaceTopBar';
export { WorkspaceRouteShell } from './navigation/WorkspaceRouteShell';
export type { WorkspaceRouteShellProps } from './navigation/WorkspaceRouteShell';
