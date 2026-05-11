import React from 'react';
import { cn } from './cn';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, right, className }: SectionHeaderProps) {
  return (
    <div className={cn('coya-page-header', className)}>
      <div className="min-w-0">
        <h1 className="coya-page-title">{title}</h1>
        {subtitle ? <p className="coya-page-subtitle">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

