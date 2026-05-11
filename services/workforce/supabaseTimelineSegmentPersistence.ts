import type { ActivityEvent } from './types/workforceEvents';
import type { ActivityEventPersistence } from './activityEventEngine';
import { supabase } from '../supabaseService';
import { handleOptionalTableError, isTableUnavailable } from '../optionalTableGuard';
import { getCurrentUserOrgContext } from './supabaseWorkforceContext';
import { segmentKindFromActivityVerb } from './activityEventToTimelineMapping';

/**
 * Dérive un segment timeline depuis chaque ActivityEvent (idempotence via source_client_event_id).
 */
export class SupabaseTimelineSegmentPersistence implements ActivityEventPersistence {
  append(event: ActivityEvent): void | Promise<void> {
    if (isTableUnavailable('workforce_timeline_segments')) return;
    return this.appendAsync(event);
  }

  private async appendAsync(event: ActivityEvent): Promise<void> {
    try {
      const ctx = await getCurrentUserOrgContext();
      if (!ctx) return;

      const startedAt = event.occurred_at;
      const t = Date.parse(startedAt);
      const durationSec =
        typeof event.payload?.duration_seconds === 'number' && event.payload.duration_seconds > 0
          ? event.payload.duration_seconds
          : 0;
      const endedAt =
        durationSec > 0
          ? new Date(t + durationSec * 1000).toISOString()
          : startedAt;

      const row = {
        organization_id: ctx.organizationId,
        created_by_user_id: ctx.userId,
        worker_id: event.actor_worker_id,
        segment_kind: segmentKindFromActivityVerb(event.verb),
        operational_context: null as string | null,
        device_ref: (event.integrity?.device_id
          ? { device_id: event.integrity.device_id }
          : {}) as Record<string, unknown>,
        started_at: startedAt,
        ended_at: endedAt,
        source_client_event_id: event.event_id,
        payload: {
          verb: event.verb,
          object_refs: event.object_refs,
          ...(event.payload ?? {}),
        },
      };

      const { error } = await supabase.from('workforce_timeline_segments').insert(row);
      if (error) {
        if (handleOptionalTableError(error, 'workforce_timeline_segments', 'SupabaseTimelineSegmentPersistence.append')) {
          return;
        }
        if (error.code === '23505') return;
        console.warn('[SupabaseTimelineSegmentPersistence]', error.message);
      }
    } catch (e) {
      if (handleOptionalTableError(e, 'workforce_timeline_segments', 'SupabaseTimelineSegmentPersistence.append.catch')) {
        return;
      }
      console.warn('[SupabaseTimelineSegmentPersistence]', e);
    }
  }
}
