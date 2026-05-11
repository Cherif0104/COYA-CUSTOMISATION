import React, { PropsWithChildren } from 'react';

/** Slot inspecteur lié à une sélection timeline (à placer dans `InspectorPanel` parent). */
export const TimelineInspector: React.FC<PropsWithChildren<{ className?: string }>> = ({
  className = '',
  children,
}) => <div className={`text-sm text-slate-700 ${className}`.trim()}>{children}</div>;

export default TimelineInspector;
