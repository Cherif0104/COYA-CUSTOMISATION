import React, { useMemo } from 'react';
import { useWorkforceDayTimeline } from '../../hooks/useWorkforceDayTimeline';
import { Language } from '../../types';
import { useLocalization } from '../../contexts/LocalizationContext';
import { totalDurationMs } from '../../services/workforce';

function formatDurationMs(ms: number, fr: boolean): string {
  if (ms <= 0) return fr ? '0 min' : '0 min';
  const m = Math.round(ms / 60000);
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest} ${fr ? 'min' : 'min'}`;
  return `${h}h${rest > 0 ? String(rest).padStart(2, '0') : ''}`;
}

const WorkforceDayTimelineCard: React.FC = () => {
  const { language } = useLocalization();
  const fr = language === Language.FR;
  const { segments, loading, error, totalConsolidatedMs, consolidatedByKind, refresh, isDemoMode } =
    useWorkforceDayTimeline();

  const byKindSummary = useMemo(() => {
    const rows: { kind: string; ms: number }[] = [];
    consolidatedByKind.forEach((intervals, kind) => {
      rows.push({ kind, ms: totalDurationMs(intervals) });
    });
    return rows.sort((a, b) => b.ms - a.ms);
  }, [consolidatedByKind]);

  return (
    <section
      className="mb-6 rounded-2xl border border-coya-border/80 bg-coya-card p-5 shadow-sm"
      aria-label={fr ? 'Activité Workforce (jour)' : 'Workforce activity (day)'}
    >
      {isDemoMode && (
        <p className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-[11px] text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100">
          {fr
            ? 'Mode démo : données timeline simulées (aucune clé Supabase). Branchez le projet pour enregistrer de vrais segments.'
            : 'Demo mode: simulated timeline (no Supabase). Connect the project to persist real segments.'}
        </p>
      )}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-coya-text">
          <i className="fas fa-stream mr-2 text-coya-primary" aria-hidden />
          {fr ? 'Chronologie activité (aujourd’hui)' : 'Activity timeline (today)'}
        </h3>
        <button
          type="button"
          onClick={() => void refresh()}
          className="text-xs font-medium text-coya-primary hover:underline"
        >
          {fr ? 'Actualiser' : 'Refresh'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {loading && <p className="text-xs text-coya-text-muted">{fr ? 'Chargement…' : 'Loading…'}</p>}
      {!loading && !error && segments.length === 0 && (
        <div className="space-y-1 text-xs text-coya-text-muted">
          <p>
            {fr
              ? 'Aucun segment enregistré pour aujourd’hui (présence, temps ou tâches). Les données apparaissent après les premières actions.'
              : 'No segments recorded for today yet. Data appears after presence, time or task actions.'}
          </p>
          {import.meta.env.DEV && !isDemoMode && (
            <p className="text-[10px] leading-snug opacity-90">
              {fr
                ? 'Astuce dev : exécute scripts/seed-workforce-demo.sql (SQL Editor) avec ton organization_id et auth user id pour préremplir la timeline.'
                : 'Dev tip: run scripts/seed-workforce-demo.sql in the SQL Editor with your organization_id and auth user id to prefill the timeline.'}
            </p>
          )}
        </div>
      )}
      {!loading && segments.length > 0 && (
        <div className="space-y-3">
          <div className="rounded-xl bg-coya-bg/60 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-coya-text-muted">
              {fr ? 'Temps consolidé (anti-chevauchement)' : 'Consolidated time (overlap merge)'}
            </p>
            <p className="text-lg font-semibold tabular-nums text-coya-text">{formatDurationMs(totalConsolidatedMs, fr)}</p>
          </div>
          {byKindSummary.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-coya-text-muted">
                {fr ? 'Par type de segment' : 'By segment type'}
              </p>
              <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
                {byKindSummary.map(row => (
                  <li key={row.kind} className="flex justify-between gap-2 rounded-lg bg-white/80 px-2 py-1 dark:bg-gray-900/40">
                    <span className="truncate font-mono text-coya-text-muted">{row.kind}</span>
                    <span className="shrink-0 tabular-nums text-coya-text">{formatDurationMs(row.ms, fr)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[10px] leading-relaxed text-coya-text-muted">
            {fr
              ? 'Les durées « par type » fusionnent les chevauchements au sein de chaque type. Le total consolidé fusionne tous les types (vue charge brute).'
              : 'Per-type durations merge overlaps within each kind. The consolidated total merges all types (raw load view).'}
          </p>
        </div>
      )}
    </section>
  );
};

export default WorkforceDayTimelineCard;
