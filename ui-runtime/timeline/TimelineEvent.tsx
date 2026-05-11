import React, { PropsWithChildren } from 'react';
import { TimelineViewItem } from './TimelineView';

/** Un événement dans la timeline (réutilise l’indentation `TimelineViewItem`). */
export const TimelineEvent: React.FC<PropsWithChildren<{ nested?: boolean }>> = ({
  nested,
  children,
}) => <TimelineViewItem nested={nested}>{children}</TimelineViewItem>;

export default TimelineEvent;
