import React, { PropsWithChildren } from 'react';

export type ActivityFeedProps = PropsWithChildren<{
  title?: React.ReactNode;
  className?: string;
}>;

/** Fil d’activité compact (carte MAKE FIGMA). */
export const ActivityFeed: React.FC<ActivityFeedProps> = ({ title, className = '', children }) => (
  <div className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`.trim()}>
    {title != null && <h3 className="mb-4 text-base font-semibold text-gray-900">{title}</h3>}
    <div className="space-y-3">{children}</div>
  </div>
);

export default ActivityFeed;
