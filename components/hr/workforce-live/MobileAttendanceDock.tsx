import React from 'react';
import { useLocalization } from '../../../contexts/LocalizationContext';
import { Language } from '../../../types';

/**
 * Barre de pointage fixe en bas — complète le dock header (`md+`).
 * `safe-area-inset-bottom` pour encoche / home indicator.
 */
export const MobileAttendanceDock: React.FC = () => {
  const { language } = useLocalization();
  const fr = language === Language.FR;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white/95 shadow-[0_-4px_24px_rgba(7,16,24,0.08)] backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
      role="region"
      aria-label={fr ? 'Pointage rapide' : 'Quick attendance'}
    >
      <div className="flex items-center gap-2 px-3 pt-2">
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {fr ? 'Pointage' : 'Clock'}
        </span>
        <span className="text-xs text-slate-700">
          {fr ? 'Changer le statut via la superposition ou le widget compte à rebours.' : 'Change status via overlay or countdown widget.'}
        </span>
      </div>
    </div>
  );
};

export default MobileAttendanceDock;
