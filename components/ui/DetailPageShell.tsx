import React from 'react';
import { cn } from './cn';

export type DetailPageShellTone = 'enterprise' | 'crm' | 'none';

const toneClass: Record<DetailPageShellTone, string> = {
  enterprise: fleetToneEnterprise(),
  crm: 'min-h-full bg-gradient-to-b from-slate-100/90 to-[#f0f2f6] text-slate-900',
  none: '',
};

function fleetToneEnterprise(): string {
  return 'min-h-full bg-[var(--coya-enterprise-bg,#F8FAFC)] text-[var(--coya-enterprise-text,#0f172a)]';
}

export interface DetailPageShellProps {
  children: React.ReactNode;
  /** Arrière-plan / typo de base */
  tone?: DetailPageShellTone;
  className?: string;
  /** Conteneur interne (padding, etc.) */
  innerClassName?: string;
  /** Largeur max du conteneur interne */
  maxWidthClass?: string;
}

/**
 * Enveloppe légère pour fiches détail multi-modules (cohérence padding / fond).
 */
export const DetailPageShell: React.FC<DetailPageShellProps> = ({
  children,
  tone = 'enterprise',
  className,
  innerClassName,
  maxWidthClass = 'max-w-[1400px]',
}) => {
  return (
    <div className={cn(toneClass[tone], className)}>
      <div className={cn('mx-auto w-full', maxWidthClass, innerClassName)}>{children}</div>
    </div>
  );
};
