import React, { PropsWithChildren } from 'react';

export type WorkspaceRouteShellProps = PropsWithChildren<{
  /** Barre navigationnelle (sticky gérée par le parent ou via classe). */
  top?: React.ReactNode;
  className?: string;
  /** Désactive la traduction automatique du navigateur sur ce sous-arbre (réduit les cas DOM/React). */
  langProtect?: boolean;
}>;

/**
 * Enveloppe page object workspace : top optionnel + corps (scroll = conteneur parent, ex. `main` de l’app).
 * Évite double scroll : pas de `overflow-y-auto` interne par défaut.
 */
export const WorkspaceRouteShell: React.FC<WorkspaceRouteShellProps> = ({
  top,
  className = '',
  langProtect,
  children,
}) => (
  <div translate={langProtect ? 'no' : undefined} className={`flex min-h-0 flex-col ${className}`.trim()}>
    {top}
    <div className="flex min-h-0 flex-1 flex-col">{children}</div>
  </div>
);

export default WorkspaceRouteShell;
