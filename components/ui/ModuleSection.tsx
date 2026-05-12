import React, { useEffect, useState } from 'react';
import { cn } from './cn';
import { fleetDesignTokens } from '../modules/logisticsFleet/fleetDesignTokens';

export interface ModuleSectionProps {
  id?: string;
  title: string;
  iconClass?: string;
  children: React.ReactNode;
  className?: string;
  /**
   * Sous `md` : section repliable (fermée par défaut).
   * À partir de `md` : carte toujours ouverte.
   */
  collapseOnMobile?: boolean;
  /** Sous `md`, ouvrir par défaut (ex. section principale) */
  mobileDefaultOpen?: boolean;
}

function useMdUp(): boolean {
  const [mdUp, setMdUp] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true,
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const on = () => setMdUp(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return mdUp;
}

const shell = cn(
  fleetDesignTokens.cardRadius,
  'border bg-white overflow-hidden',
  fleetDesignTokens.border,
  fleetDesignTokens.cardShadow,
);

/**
 * Bloc titre + contenu pour fiches détail (réutilisable hors flotte).
 */
export const ModuleSection: React.FC<ModuleSectionProps> = ({
  id,
  title,
  iconClass,
  children,
  className,
  collapseOnMobile,
  mobileDefaultOpen = false,
}) => {
  const mdUp = useMdUp();

  const header = (
    <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2 font-semibold text-slate-800">
        {iconClass ? <i className={cn(iconClass, 'text-emerald-600 shrink-0')} aria-hidden /> : null}
        <span className="truncate">{title}</span>
      </div>
      {collapseOnMobile && !mdUp ? (
        <i className="fas fa-chevron-down text-slate-400 text-xs transition-transform group-open:rotate-180 md:hidden" />
      ) : null}
    </div>
  );

  const body = <div className="px-4 py-3 text-sm text-slate-700">{children}</div>;

  if (collapseOnMobile && !mdUp) {
    return (
      <details
        id={id}
        className={cn(shell, 'group', className)}
        open={mobileDefaultOpen}
      >
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">{header}</summary>
        {body}
      </details>
    );
  }

  return (
    <section id={id} className={cn(shell, className)}>
      {header}
      {body}
    </section>
  );
};
