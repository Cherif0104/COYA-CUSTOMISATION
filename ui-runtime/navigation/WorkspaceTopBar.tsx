import React from 'react';

export type WorkspaceTopBarProps = {
  /** Zone gauche : souvent `WorkspaceBackButton` */
  leading?: React.ReactNode;
  /** Fil d’Ariane */
  breadcrumbs?: React.ReactNode;
  /** Actions globales (droite) */
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Barre supérieure workspace (retour + fil d’Ariane + actions).
 * À placer en `sticky top-0 z-20` dans le flux de la page pour rester visible au scroll du `main` parent.
 */
export const WorkspaceTopBar: React.FC<WorkspaceTopBarProps> = ({
  leading,
  breadcrumbs,
  actions,
  className = '',
}) => (
  <div
    className={`sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur-sm lg:px-6 ${className}`.trim()}
  >
    {leading}
    {breadcrumbs != null && <div className="min-w-0 flex-1">{breadcrumbs}</div>}
    {actions != null && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>}
  </div>
);

export default WorkspaceTopBar;
