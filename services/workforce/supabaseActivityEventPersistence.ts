import type { ActivityEvent } from './types/workforceEvents';
import type { ActivityEventPersistence } from './activityEventEngine';
import { supabase } from '../supabaseService';
import { handleOptionalTableError, isTableUnavailable } from '../optionalTableGuard';
import { getCurrentUserOrgContext } from './supabaseWorkforceContext';

/**
 * Persistance append-only vers `public.workforce_activity_events`.
 * Résout `organization_id` depuis le profil de l’utilisateur authentifié.
 */
export class SupabaseActivityEventPersistence implements ActivityEventPersistence {
  append(event: ActivityEvent): void | Promise<void> {
    if (isTableUnavailable('workforce_activity_events')) return;
    return this.appendAsync(event);
  }

  private async appendAsync(event: ActivityEvent): Promise<void> {
    try {
      const ctx = await getCurrentUserOrgContext();
      if (!ctx) return;

      const row = {
        organization_id: ctx.organizationId,
        created_by_user_id: ctx.userId,
        actor_worker_id: event.actor_worker_id,
        verb: event.verb,
        object_refs: event.object_refs,
        payload: {
          ...(event.payload ?? {}),
          ...(event.integrity ? { _integrity: event.integrity } : {}),
        },
        occurred_at: event.occurred_at,
        client_event_id: event.event_id,
      };

      const { error } = await supabase.from('workforce_activity_events').insert(row);
      if (error) {
        if (handleOptionalTableError(error, 'workforce_activity_events', 'SupabaseActivityEventPersistence.append')) {
          return;
        }
        if (error.code === '23505') {
          return;
        }
        console.warn('[SupabaseActivityEventPersistence]', error.message);
      }
    } catch (e) {
      if (handleOptionalTableError(e, 'workforce_activity_events', 'SupabaseActivityEventPersistence.append.catch')) {
        return;
      }
      console.warn('[SupabaseActivityEventPersistence]', e);
    }
  }
}
