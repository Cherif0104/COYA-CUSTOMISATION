import React, { PropsWithChildren } from 'react';

export type InspectorPanelProps = PropsWithChildren<{
  title?: React.ReactNode;
  /** Largeur panneau latéral desktop */
  widthClass?: string;
  className?: string;
}>;

/** Zone inspecteur / contexte (MAKE FIGMA : panneau latéral ou colonne droite). */
export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  title,
  widthClass = 'lg:w-80',
  className = '',
  children,
}) => (
  <aside
    className={`shrink-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ${widthClass} ${className}`.trim()}
  >
    {title != null && (
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
    )}
    <div className="text-sm text-gray-800">{children}</div>
  </aside>
);

export default InspectorPanel;
