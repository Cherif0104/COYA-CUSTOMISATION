import React from 'react';
import { Button } from '../../ui/Button';
import { APEX_SHELL_CARD } from '../apexConstants';
import { APEX_TRACK_TEMPLATES } from '../../../constants/apexTrackTemplates';
import { NAV_SESSION_APEX_SECTION } from '../../../contexts/AppNavigationContext';

export type ApexTracksSectionProps = {
  isFr: boolean;
  setView: (view: string) => void;
};

export const ApexTracksSection: React.FC<ApexTracksSectionProps> = ({ isFr, setView }) => {
  return (
    <div className="space-y-6">
      <div className={`${APEX_SHELL_CARD} p-5`}>
        <h3 className="text-sm font-semibold text-slate-900">
          {isFr ? 'Parcours dynamiques & durées' : 'Dynamic tracks & durations'}
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          {isFr
            ? 'Types : fixe, flexible, auto-paced, live. Déblocage intelligent (ex. session 2 si session 1 terminée + quiz validé). Expiration, suspension, prolongation.'
            : 'Fixed, flexible, self-paced, live. Smart gating. Expiry, suspend, extend.'}
        </p>
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-950">
          <p className="font-semibold">{isFr ? 'Exemple de règle' : 'Rule example'}</p>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px]">
            {isFr
              ? 'Session 2 débloquée uniquement si :\n- Session 1 terminée\n- Quiz validé (≥ 80 %)\n- Présence session 1 > 90 %'
              : 'Session 2 unlocked only if:\n- Session 1 completed\n- Quiz passed (≥ 80%)\n- Attendance S1 > 90%'}
          </pre>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {['fixe', 'flexible', 'auto-paced', 'live'].map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {APEX_TRACK_TEMPLATES.map((tpl) => (
          <div key={tpl.id} className={`${APEX_SHELL_CARD} p-6`}>
            <p className="text-xs font-semibold uppercase text-slate-500">Preset</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{tpl.name}</h3>
            <p className="mt-1 text-[11px] text-slate-500">
              {tpl.durationMonths} {isFr ? 'mois' : 'months'} · {tpl.audience}
            </p>
            <p className="mt-2 text-sm text-slate-600">{tpl.description}</p>
            <ul className="mt-3 space-y-1 text-xs text-slate-600">
              {tpl.modules.map((m) => (
                <li key={m.id}>
                  <span className="font-medium text-slate-800">{m.title}</span>
                  <span className="ml-1 text-slate-500">
                    · {m.weeks} {isFr ? 'sem.' : 'w.'}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  try {
                    sessionStorage.setItem(NAV_SESSION_APEX_SECTION, 'cohorts');
                    sessionStorage.setItem('coya_nav_apex_track_template_current', tpl.id);
                  } catch {
                    /* ignore */
                  }
                  setView('apex');
                }}
              >
                {isFr ? 'Appliquer ce parcours' : 'Apply this track'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
