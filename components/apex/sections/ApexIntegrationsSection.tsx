import React, { useEffect, useState } from 'react';
import type { ModuleName } from '../../../types';
import { Button } from '../../ui/Button';
import { APEX_SHELL_CARD } from '../apexConstants';
import { projectsHomeView } from '../../../utils/programmesProjectsNav';

export type ApexIntegrationsSectionProps = {
  isFr: boolean;
  canAccessModule: (m: ModuleName) => boolean;
  setView: (view: string) => void;
  openCrmCollecteForCourse: (courseId: string) => void;
  firstCourseId: string;
};

export const ApexIntegrationsSection: React.FC<ApexIntegrationsSectionProps> = ({
  isFr,
  canAccessModule,
  setView,
  openCrmCollecteForCourse,
  firstCourseId,
}) => {
  type ToggleKey = 'syncCalendar' | 'notifyWhatsApp' | 'autoCertificates';
  const STORAGE_KEY = 'apex_integrations_prefs';
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    syncCalendar: true,
    notifyWhatsApp: false,
    autoCertificates: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setToggles((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toggles));
    } catch {
      /* ignore */
    }
  }, [toggles]);

  const toggle = (k: ToggleKey) => setToggles((prev) => ({ ...prev, [k]: !prev[k] }));

  const internal = [
    { k: 'crm', label: 'CRM', desc: isFr ? 'Prospects, participants, progression.' : 'Prospects, participants, progress.', mod: 'crm_sales' as const },
    { k: 'prog', label: isFr ? 'Programmes' : 'Programs', desc: isFr ? 'Cohortes, activités, impacts.' : 'Cohorts, activities, impact.', mod: 'programme' as const },
    { k: 'rh', label: 'RH', desc: isFr ? 'Formateurs, équipes.' : 'Trainers, teams.', mod: 'rh' as const },
    { k: 'ged', label: 'GED / Drive', desc: isFr ? 'Documents, ressources, médias.' : 'Docs, resources, media.', mod: 'coya_drive' as const },
    { k: 'col', label: isFr ? 'Collecte' : 'Collect', desc: isFr ? 'Hub collecte & onboarding.' : 'Collect & onboarding hub.', mod: 'collecte' as const },
  ];

  const external = [
    { k: 'wa', label: 'WhatsApp / SMS / Email' },
    { k: 'vc', label: 'Zoom · Meet · Teams · Jitsi' },
    { k: 'cl', label: 'Drive · Dropbox · OneDrive' },
    { k: 'st', label: 'Vimeo · YouTube · Bunny Stream' },
  ];

  return (
    <div className="space-y-6">
      <div className={`${APEX_SHELL_CARD} p-5`}>
        <h3 className="text-sm font-semibold text-slate-900">APEX {isFr ? 'comme hub interconnecté' : 'as interconnected hub'}</h3>
        <p className="mt-1 text-xs text-slate-600">
          {isFr
            ? 'Intégrations internes (modules COYA) et externes (comms, visio, cloud, streaming). Multi-tenant : permissions par organisation.'
            : 'Internal (COYA modules) and external (comms, video, cloud, streaming). Multi-tenant via org permissions.'}
        </p>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {isFr ? 'Intégrations internes' : 'Internal integrations'}
        </h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {internal.map((x) => (
            <div key={x.k} className={`${APEX_SHELL_CARD} flex flex-col p-4`}>
              <p className="font-semibold text-slate-900">{x.label}</p>
              <p className="mt-1 flex-1 text-xs text-slate-600">{x.desc}</p>
              <Button
                type="button"
                className="mt-3"
                size="sm"
                variant="secondary"
                disabled={!canAccessModule(x.mod)}
                onClick={() => setView(x.mod === 'crm_sales' ? 'crm_sales' : x.mod)}
              >
                {isFr ? 'Ouvrir' : 'Open'}
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={!canAccessModule('crm_sales')} onClick={() => openCrmCollecteForCourse(firstCourseId)}>
            CRM → {isFr ? 'Collecte' : 'Collect'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!canAccessModule('projects')}
            onClick={() => setView(projectsHomeView(canAccessModule))}
          >
            {isFr ? 'Projets' : 'Projects'}
          </Button>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {isFr ? 'Intégrations externes (roadmap)' : 'External integrations (roadmap)'}
        </h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {external.map((e) => (
            <div key={e.k} className={`${APEX_SHELL_CARD} px-4 py-3 text-sm text-slate-700`}>
              {e.label}
            </div>
          ))}
        </div>
      </div>

      <div className={`${APEX_SHELL_CARD} space-y-3 p-4 text-xs text-slate-600`}>
        <p className="font-medium text-slate-800">{isFr ? 'Automatisations (localStorage)' : 'Automations (localStorage)'}</p>
        <div className="flex flex-col gap-2">
          {[
            {
              key: 'syncCalendar' as ToggleKey,
              label: isFr ? 'Sync calendrier (planning → APEX)' : 'Sync calendar (planning → APEX)',
              desc: isFr ? 'Active un push local vers les sessions APEX.' : 'Local toggle to push planning into APEX sessions.',
            },
            {
              key: 'notifyWhatsApp' as ToggleKey,
              label: 'WhatsApp / SMS',
              desc: isFr ? 'Notifications WhatsApp/SMS quand une session change.' : 'WhatsApp/SMS notifications on session changes.',
            },
            {
              key: 'autoCertificates' as ToggleKey,
              label: isFr ? 'Certificats auto' : 'Auto certificates',
              desc: isFr ? 'Émission auto si progression + examen OK.' : 'Auto-issue when progress + exam pass.',
            },
          ].map((t) => (
            <label
              key={t.key}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <div className="mr-2 min-w-0">
                <p className="font-semibold text-slate-800">{t.label}</p>
                <p className="text-[11px] text-slate-500">{t.desc}</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 accent-emerald-600"
                checked={toggles[t.key]}
                onChange={() => toggle(t.key)}
              />
            </label>
          ))}
        </div>
        <p className="pt-2 text-[11px] text-slate-500">
          {isFr
            ? 'Préférences stockées côté navigateur (non synchronisées org).'
            : 'Preferences stored locally in browser (not org-synced).'}
        </p>
      </div>
    </div>
  );
};
