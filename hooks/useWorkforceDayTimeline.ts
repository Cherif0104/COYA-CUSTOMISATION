import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildWorkforceDemoTimelineSegments } from '../constants/workforceDemoSegments';
import DataAdapter from '../services/dataAdapter';
import { isSupabaseConfigured } from '../services/supabaseService';
import type { WorkforceTimelineSegmentRow } from '../types';
import {
  consolidateBySegmentKind,
  consolidateIsoSegments,
  totalDurationMs,
  type TimeIntervalMs,
} from '../services/workforce';

function formatDayKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useWorkforceDayTimeline(day?: Date) {
  const target = day ?? new Date();
  const dayKey = formatDayKeyLocal(target);

  const [segments, setSegments] = useState<WorkforceTimelineSegmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setSegments(buildWorkforceDemoTimelineSegments(dayKey));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await DataAdapter.listMyWorkforceTimelineSegmentsForDay(dayKey);
      setSegments(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setSegments([]);
    } finally {
      setLoading(false);
    }
  }, [dayKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const consolidatedGlobal: TimeIntervalMs[] = useMemo(() => {
    return consolidateIsoSegments(
      segments.map(s => ({
        started_at: s.startedAt,
        ended_at: s.endedAt,
        segment_kind: s.segmentKind,
      })),
    );
  }, [segments]);

  const consolidatedByKind = useMemo(
    () =>
      consolidateBySegmentKind(
        segments.map(s => ({
          started_at: s.startedAt,
          ended_at: s.endedAt,
          segment_kind: s.segmentKind,
        })),
      ),
    [segments],
  );

  const totalConsolidatedMs = useMemo(() => totalDurationMs(consolidatedGlobal), [consolidatedGlobal]);

  const isDemoMode = !isSupabaseConfigured;

  return {
    segments,
    loading,
    error,
    refresh: load,
    consolidatedGlobal,
    consolidatedByKind,
    totalConsolidatedMs,
    dayKey,
    isDemoMode,
  };
}
