import React, { PropsWithChildren } from 'react';

/** Liste de chaînes / corrélations (conteneur sémantique). */
export const TimelineChain: React.FC<PropsWithChildren<{ className?: string }>> = ({
  className = '',
  children,
}) => <ul className={`space-y-6 ${className}`.trim()}>{children}</ul>;

export default TimelineChain;
