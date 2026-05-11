import React, { PropsWithChildren } from 'react';
import { WorkspaceShell } from '../workspace/WorkspaceShell';
import { WorkspaceHeader } from '../workspace/WorkspaceHeader';

const FloorplanBody: React.FC<
  PropsWithChildren<{
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    headerActions?: React.ReactNode;
    /** Si défini, remplace l’en-tête titre/sous-titre (pattern hero MAKE FIGMA). */
    hero?: React.ReactNode;
    kpi?: React.ReactNode;
    tabs?: React.ReactNode;
    className?: string;
  }>
> = ({ title, subtitle, headerActions, hero, kpi, tabs, className = '', children }) => (
  <div className={`flex min-h-0 flex-col gap-6 ${className}`.trim()}>
    {hero != null ? (
      hero
    ) : (
      <WorkspaceHeader title={title} subtitle={subtitle} actions={headerActions} />
    )}
    {kpi}
    {tabs}
    {children}
  </div>
);

export type ObjectWorkspaceFloorplanProps = PropsWithChildren<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  /** Hero dense (identité + progression + CTA) — prioritaire sur `title` / `subtitle`. */
  hero?: React.ReactNode;
  kpi?: React.ReactNode;
  /** Onglets contextuelles (composant `PillTabs` ou équivalent) */
  tabs?: React.ReactNode;
  /** Zone principale + inspecteur : passer une grille en children */
  className?: string;
  /**
   * Si `false`, pas de `WorkspaceShell` (padding page) — pour modale plein écran / conteneur flex parent.
   */
  useWorkspaceShell?: boolean;
}>;

/**
 * Floorplan « objet » (détail projet, fiche…) : header → KPI → tabs → focus (+ inspector géré par le parent dans `children`).
 * Aligné SAP Fiori Object Page / contrat workspace COYA.
 */
export const ObjectWorkspaceFloorplan: React.FC<ObjectWorkspaceFloorplanProps> = ({
  title,
  subtitle,
  headerActions,
  hero,
  kpi,
  tabs,
  className = '',
  useWorkspaceShell = true,
  children,
}) =>
  useWorkspaceShell ? (
    <WorkspaceShell className={className}>
      {hero != null ? (
        hero
      ) : (
        <WorkspaceHeader title={title} subtitle={subtitle} actions={headerActions} />
      )}
      {kpi}
      {tabs}
      {children}
    </WorkspaceShell>
  ) : (
    <FloorplanBody
      title={title}
      subtitle={subtitle}
      headerActions={headerActions}
      hero={hero}
      kpi={kpi}
      tabs={tabs}
      className={className}
    >
      {children}
    </FloorplanBody>
  );

export default ObjectWorkspaceFloorplan;
