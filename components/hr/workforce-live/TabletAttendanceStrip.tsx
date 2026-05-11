import React from 'react';
import { useLocalization } from '../../../contexts/LocalizationContext';
import { Language } from '../../../types';
import { PresenceSessionChrono } from './PresenceSessionChrono';

/**
 * Bandeau pointage **tablette** (md–lg) : chronomètre lisible + actions avec libellés.
 * Complète le dock **mobile** (&lt;md) et le dock **header** (lg+).
 */
export const TabletAttendanceStrip: React.FC = () => {
  const { language } = useLocalization();
  const fr = language === Language.FR;

  return (
    <div
      className="hidden border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 py-3 shadow-sm md:block lg:hidden"
      role="region"
      aria-label={fr ? 'Pointage et temps de session' : 'Clocking and session time'}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PresenceSessionChrono fr={fr} variant="prominent" className="sm:max-w-[55%]" />
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {fr ? 'Statut via onboarding + widget' : 'Status via onboarding + widget'}
          </p>
          <p className="text-sm text-slate-700">
            {fr
              ? 'Utilisez la superposition de statut ou le widget compte à rebours du tableau de bord pour changer de statut.'
              : 'Use the status overlay or the dashboard countdown widget to change status.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TabletAttendanceStrip;
