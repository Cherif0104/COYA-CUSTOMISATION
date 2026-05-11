/**
 * Fusion d’intervalles temporels pour éviter le double comptage (multi-device, segments qui se chevauchent).
 * @see docs/workforce-os/BEHAVIORAL-TIMELINE-SESSION-MODEL.md
 */

export type TimeIntervalMs = {
  startMs: number;
  endMs: number;
  /** libre : kind, device, etc. */
  meta?: Record<string, string | number | boolean | null>;
};

/** Trie et fusionne les chevauchements (bornes inclusives côté fin). */
export function mergeOverlappingIntervals(intervals: TimeIntervalMs[]): TimeIntervalMs[] {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a.startMs - b.startMs);
  const out: TimeIntervalMs[] = [];
  let cur = { ...sorted[0], meta: sorted[0].meta ? { ...sorted[0].meta } : undefined };

  for (let i = 1; i < sorted.length; i++) {
    const n = sorted[i];
    if (n.startMs <= cur.endMs) {
      cur.endMs = Math.max(cur.endMs, n.endMs);
    } else {
      out.push(cur);
      cur = { ...n, meta: n.meta ? { ...n.meta } : undefined };
    }
  }
  out.push(cur);
  return out;
}

/** Convertit des segments DB (ISO) en intervalles ms puis fusionne. */
export function consolidateIsoSegments(
  rows: { started_at: string; ended_at: string; segment_kind?: string }[],
): TimeIntervalMs[] {
  const intervals = rows
    .map(r => {
      const a = Date.parse(r.started_at);
      const b = Date.parse(r.ended_at);
      if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
      return {
        startMs: a,
        endMs: Math.max(a, b),
        meta: r.segment_kind ? { segment_kind: r.segment_kind } : undefined,
      } as TimeIntervalMs;
    })
    .filter((x): x is TimeIntervalMs => x != null);

  return mergeOverlappingIntervals(intervals);
}

/** Durée totale (ms) des intervalles fusionnés. */
export function totalDurationMs(intervals: TimeIntervalMs[]): number {
  return intervals.reduce((acc, i) => acc + Math.max(0, i.endMs - i.startMs), 0);
}

/** Fusion par type de segment (évite de mélanger pause et productif dans un seul merge). */
export function consolidateBySegmentKind(
  rows: { started_at: string; ended_at: string; segment_kind: string }[],
): Map<string, TimeIntervalMs[]> {
  const byKind = new Map<string, { started_at: string; ended_at: string; segment_kind: string }[]>();
  for (const r of rows) {
    const k = r.segment_kind || 'unknown';
    if (!byKind.has(k)) byKind.set(k, []);
    byKind.get(k)!.push(r);
  }
  const out = new Map<string, TimeIntervalMs[]>();
  for (const [k, list] of byKind) {
    out.set(k, consolidateIsoSegments(list));
  }
  return out;
}
