import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listDomainEventsForProject,
  type DomainEventRow,
  formatProjectDomainEventViewModel,
} from '../../services/domain';
import { TimelineChain, TimelineGroup, TimelineEvent } from '../../ui-runtime';

type Lang = 'fr' | 'en';

export type ProjectDomainEventTimelineProps = {
  organizationId: string | null | undefined;
  projectId: string;
  language: Lang;
};

function formatTime(iso: string, lang: Lang): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export const ProjectDomainEventTimeline: React.FC<ProjectDomainEventTimelineProps> = ({
  organizationId,
  projectId,
  language,
}) => {
  const [rows, setRows] = useState<DomainEventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) {
      setRows([]);
      return;
    }
    setLoading(true);
    setErr(null);
    const { data, error } = await listDomainEventsForProject({
      organizationId,
      projectId: String(projectId),
      limit: 120,
    });
    setLoading(false);
    if (error) {
      setErr(error.message);
      setRows([]);
      return;
    }
    setRows(data);
  }, [organizationId, projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(() => {
    const map = new Map<string, DomainEventRow[]>();
    for (const r of rows) {
      const key = r.correlation_id || `__single_${r.client_event_id}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
    }
    const entries = Array.from(map.entries()).sort(([, a], [, b]) => {
      const ta = new Date(a[a.length - 1]?.occurred_at || 0).getTime();
      const tb = new Date(b[b.length - 1]?.occurred_at || 0).getTime();
      return tb - ta;
    });
    return entries;
  }, [rows]);

  if (!organizationId) {
    return (
      <p className="text-sm text-slate-500">
        {language === 'fr'
          ? 'Timeline métier indisponible : organisation non associée au profil.'
          : 'Domain timeline unavailable: no organization on profile.'}
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-900">
          {language === 'fr' ? 'Chaîne métier (événements)' : 'Business event chain'}
        </h4>
        <button
          type="button"
          onClick={() => void load()}
          className="text-xs font-medium text-emerald-700 hover:underline"
        >
          {language === 'fr' ? 'Actualiser' : 'Refresh'}
        </button>
      </div>
      {loading && <p className="text-xs text-slate-500">{language === 'fr' ? 'Chargement…' : 'Loading…'}</p>}
      {err && <p className="text-xs text-amber-700">{err}</p>}
      {!loading && !err && groups.length === 0 && (
        <p className="text-sm text-slate-500">
          {language === 'fr'
            ? 'Aucun événement métier enregistré pour ce projet (ou table pas encore migrée).'
            : 'No domain events for this project yet (or migration pending).'}
        </p>
      )}
      <TimelineChain>
        {groups.map(([corrKey, events]) => (
          <TimelineGroup
            key={corrKey}
            title={
              <>
                {language === 'fr' ? 'Workflow' : 'Workflow'}
                {corrKey.startsWith('__single') ? '' : ` · ${String(corrKey).slice(0, 8)}…`}
              </>
            }
          >
            {events.map((row) => {
              const vm = formatProjectDomainEventViewModel(row, language);
              return (
                <TimelineEvent key={row.client_event_id} nested={vm.isFollowUp}>
                  {vm.isFollowUp && (
                    <span className="mr-1 font-mono text-xs text-emerald-600" aria-hidden>
                      ↳
                    </span>
                  )}
                  <span className="text-slate-900">{vm.primary}</span>
                  {vm.secondary && <p className="mt-0.5 text-xs text-slate-500">{vm.secondary}</p>}
                  <p className="mt-1 text-[10px] text-slate-400">{formatTime(row.occurred_at, language)}</p>
                </TimelineEvent>
              );
            })}
          </TimelineGroup>
        ))}
      </TimelineChain>
    </div>
  );
};

export default ProjectDomainEventTimeline;
