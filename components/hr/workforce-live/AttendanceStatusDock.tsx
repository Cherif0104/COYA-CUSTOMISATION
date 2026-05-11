import React from 'react';
import { useLocalization } from '../../../contexts/LocalizationContext';
import { Language } from '../../../types';
import { PresenceSessionChrono } from './PresenceSessionChrono';

/**
 * Dock pointage global — visible hors module RH (header).
 * Les actions pilotent `PresenceContext` (même runtime que Time tracking / RH).
 */
export const AttendanceStatusDock: React.FC = () => {
  const { language } = useLocalization();
  const fr = language === Language.FR;
  return (
    <div
      className="hidden min-w-0 max-w-[100vw] items-center gap-2 lg:flex lg:max-w-none"
      aria-label={fr ? 'Pointage rapide' : 'Quick attendance'}
    >
      <PresenceSessionChrono fr={fr} variant="compact" className="hidden shrink-0 xl:flex" />
      <span className="hidden shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400 2xl:inline">
        {fr ? 'Statut via widget accueil' : 'Status via welcome widget'}
      </span>
    </div>
  );
};

export default AttendanceStatusDock;
