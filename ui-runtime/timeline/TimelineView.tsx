import React, { PropsWithChildren } from 'react';

export type TimelineViewProps = PropsWithChildren<{
  title?: React.ReactNode;
  className?: string;
}>;

/** Conteneur timeline (listes groupées — contenu laissé aux slots métier). */
export const TimelineView: React.FC<TimelineViewProps> = ({ title, className = '', children }) => (
  <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`.trim()}>
    {title != null && <h4 className="mb-3 text-sm font-semibold text-slate-900">{title}</h4>}
    <ul className="space-y-2">{children}</ul>
  </div>
);

export type TimelineViewItemProps = PropsWithChildren<{
  /** Indentation visuelle (ex. effet causalité) */
  nested?: boolean;
}>;

export const TimelineViewItem: React.FC<TimelineViewItemProps> = ({ nested, children }) => (
  <li
    className={`rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm ${
      nested ? 'ml-4 border-l-2 border-l-emerald-400' : ''
    }`.trim()}
  >
    {children}
  </li>
);

export default TimelineView;
