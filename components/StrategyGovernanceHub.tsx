import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { useModulePermissions } from '../hooks/useModulePermissions';
import { Language, Objective, Project } from '../types';
import Goals from './Goals';
import { SectionHeader } from './ui/SectionHeader';
import { rebuildProgrammeCockpit } from '../services/programmeCockpitService';
import {
  fetchProgrammeCockpitSnapshots,
  fetchRecentDomainEvents,
  type DomainEventListRow,
  type ProgrammeCockpitSnapshotRow,
} from '../services/strategyGovernanceService';

export type StrategyTab = 'okrs' | 'cockpit' | 'events';

export interface StrategyGovernanceHubProps {
  projects: Project[];
  objectives: Objective[];
  setObjectives: (objectives: Objective[]) => void;
  onAddObjective: (objective: Omit<Objective, 'id'>) => Promise<void>;
  onUpdateObjective: (objective: Objective) => Promise<void>;
  onDeleteObjective: (objectiveId: string) => Promise<void>;
  isLoading?: boolean;
  loadingOperation?: string | null;
  isDataLoaded?: boolean;
}

const StrategyGovernanceHub: React.FC<StrategyGovernanceHubProps> = ({
  projects,
  objectives,
  setObjectives,
  onAddObjective,
  onUpdateObjective,
  onDeleteObjective,
  isLoading,
  loadingOperation,
  isDataLoaded,
}) => {
  const { t, language } = useLocalization();
  const { user } = useAuth();
  const { hasPermission } = useModulePermissions();
  const localize = (en: string, fr: string) => (language === Language.FR ? fr : en);

  const canRebuildProgrammeCockpit = hasPermission('programme', 'write');

  const [tab, setTab] = useState<StrategyTab>('okrs');
  const [cockpitLoading, setCockpitLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [cockpitRows, setCockpitRows] = useState<ProgrammeCockpitSnapshotRow[]>([]);
  const [programmeNames, setProgrammeNames] = useState<Record<string, string>>({});
  const [cockpitError, setCockpitError] = useState<string | null>(null);
  const [rebuildingProgrammeId, setRebuildingProgrammeId] = useState<string | null>(null);
  const [rebuildError, setRebuildError] = useState<string | null>(null);
  const [events, setEvents] = useState<DomainEventListRow[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const orgId = user?.organizationId ?? null;

  const programmesSorted = useMemo(
    () =>
      Object.entries(programmeNames)
        .map(([id, name]) => ({ id, name: name || id }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [programmeNames],
  );

  const loadCockpit = useCallback(async () => {
    setCockpitLoading(true);
    setCockpitError(null);
    try {
      const res = await fetchProgrammeCockpitSnapshots(orgId);
      if (res.error) setCockpitError(res.error);
      setCockpitRows(res.rows);
      setProgrammeNames(res.programmeNames);
    } finally {
      setCockpitLoading(false);
    }
  }, [orgId]);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const res = await fetchRecentDomainEvents(orgId, 100);
      if (res.error) setEventsError(res.error);
      setEvents(res.events);
    } finally {
      setEventsLoading(false);
    }
  }, [orgId]);

  const handleRebuildCockpit = useCallback(
    async (programmeId: string) => {
      setRebuildError(null);
      setRebuildingProgrammeId(programmeId);
      try {
        await rebuildProgrammeCockpit(programmeId);
        await loadCockpit();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setRebuildError(`${t('strategy_hub_rebuild_error')} ${msg}`);
      } finally {
        setRebuildingProgrammeId(null);
      }
    },
    [loadCockpit, t],
  );

  useEffect(() => {
    if (tab === 'cockpit') void loadCockpit();
  }, [tab, loadCockpit]);

  useEffect(() => {
    if (tab === 'events') void loadEvents();
  }, [tab, loadEvents]);

  const tabClass = (active: boolean) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
      active ? 'bg-[#0d1b2a] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
    }`;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 md:px-6">
      <SectionHeader
        title={t('strategy_hub_title')}
        subtitle={t('strategy_hub_subtitle')}
        right={
          (tab === 'cockpit' || tab === 'events') && (
            <button
              type="button"
              onClick={() => {
                if (tab === 'cockpit') void loadCockpit();
                else void loadEvents();
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
            >
              {t('strategy_hub_refresh')}
            </button>
          )
        }
      />

      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        <button type="button" className={tabClass(tab === 'okrs')} onClick={() => setTab('okrs')}>
          {t('strategy_hub_tab_okrs')}
        </button>
        <button type="button" className={tabClass(tab === 'cockpit')} onClick={() => setTab('cockpit')}>
          {t('strategy_hub_tab_cockpit')}
        </button>
        <button type="button" className={tabClass(tab === 'events')} onClick={() => setTab('events')}>
          {t('strategy_hub_tab_events')}
        </button>
      </div>

      <div className="mt-6">
        {tab === 'okrs' && (
          <Goals
            projects={projects}
            objectives={objectives}
            setObjectives={setObjectives}
            onAddObjective={onAddObjective}
            onUpdateObjective={onUpdateObjective}
            onDeleteObjective={onDeleteObjective}
            isLoading={isLoading}
            loadingOperation={loadingOperation}
            isDataLoaded={isDataLoaded}
          />
        )}

        {tab === 'cockpit' && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {rebuildError ? (
              <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">{rebuildError}</div>
            ) : null}
            {cockpitLoading ? (
              <p className="p-6 text-sm text-slate-600">{localize('Loading…', 'Chargement…')}</p>
            ) : cockpitError ? (
              <p className="p-6 text-sm text-red-600">{cockpitError}</p>
            ) : cockpitRows.length === 0 && programmesSorted.length === 0 ? (
              <p className="p-6 text-sm text-slate-600">{t('strategy_hub_cockpit_empty')}</p>
            ) : cockpitRows.length === 0 && programmesSorted.length > 0 ? (
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-700">{t('strategy_hub_cockpit_no_snapshots')}</p>
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {programmesSorted.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <span className="font-medium text-slate-900">{p.name}</span>
                      {canRebuildProgrammeCockpit ? (
                        <button
                          type="button"
                          disabled={rebuildingProgrammeId !== null}
                          onClick={() => void handleRebuildCockpit(p.id)}
                          className="rounded-lg bg-[#0d1b2a] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1a3a5c] disabled:opacity-50"
                        >
                          {rebuildingProgrammeId === p.id ? t('strategy_hub_rebuilding') : t('strategy_hub_rebuild_cockpit')}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {localize('Write access to Programme module required.', 'Écriture sur le module Programme requise.')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">{t('strategy_hub_programme_col')}</th>
                      <th className="px-4 py-3">{t('strategy_hub_status_col')}</th>
                      <th className="px-4 py-3">{t('strategy_hub_generated_col')}</th>
                      <th className="px-4 py-3">{t('strategy_hub_budget_col')}</th>
                      <th className="px-4 py-3">{t('strategy_hub_risk_col')}</th>
                      <th className="px-4 py-3">{t('strategy_hub_alerts_col')}</th>
                      {canRebuildProgrammeCockpit ? (
                        <th className="px-4 py-3 text-right">{t('strategy_hub_actions_col')}</th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cockpitRows.map((row) => {
                      const m = row.model;
                      const name = programmeNames[row.programme_id] || row.programme_id.slice(0, 8) + '…';
                      const variancePct =
                        m?.budget?.variancePercent != null ? `${m.budget.variancePercent >= 0 ? '+' : ''}${m.budget.variancePercent.toFixed(0)}%` : '—';
                      const risk = m?.riskProxy?.level ?? '—';
                      const alerts = Array.isArray(m?.alerts) ? m.alerts.length : 0;
                      return (
                        <tr key={row.programme_id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-medium text-slate-900">{name}</td>
                          <td className="px-4 py-3 text-slate-700">{row.projection_status ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {row.generated_at ? new Date(row.generated_at).toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{variancePct}</td>
                          <td className="px-4 py-3 capitalize text-slate-700">{risk}</td>
                          <td className="px-4 py-3 text-slate-700">{alerts}</td>
                          {canRebuildProgrammeCockpit ? (
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                disabled={rebuildingProgrammeId !== null}
                                onClick={() => void handleRebuildCockpit(row.programme_id)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                              >
                                {rebuildingProgrammeId === row.programme_id
                                  ? t('strategy_hub_rebuilding')
                                  : t('strategy_hub_rebuild_cockpit')}
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'events' && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {eventsLoading ? (
              <p className="p-6 text-sm text-slate-600">{localize('Loading…', 'Chargement…')}</p>
            ) : eventsError ? (
              <p className="p-6 text-sm text-red-600">{eventsError}</p>
            ) : events.length === 0 ? (
              <p className="p-6 text-sm text-slate-600">{t('strategy_hub_events_empty')}</p>
            ) : (
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 z-10">
                    <tr>
                      <th className="px-4 py-3">{t('strategy_hub_generated_col')}</th>
                      <th className="px-4 py-3">{t('strategy_hub_event_type')}</th>
                      <th className="px-4 py-3">{t('strategy_hub_aggregate')}</th>
                      <th className="px-4 py-3">ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {events.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                          {new Date(e.occurred_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-slate-800">{e.event_type}</td>
                        <td className="px-4 py-2 text-slate-700">
                          {e.aggregate_type}:{e.aggregate_id}
                        </td>
                        <td className="px-4 py-2 font-mono text-[11px] text-slate-500">{e.id.slice(0, 8)}…</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyGovernanceHub;
