import { supabase, isSupabaseConfigured } from '../supabaseService';
import type { DomainEventEnvelope } from './envelope';
import { handleOptionalTableError, isTableUnavailable } from '../optionalTableGuard';
import type { TaskStatusChangedPayload } from './events/projectDomainEvents';

const TABLE = 'domain_events';

function aggregateFromEnvelope(event: DomainEventEnvelope): { aggregateType: string; aggregateId: string } | null {
  if (event.type === 'Task.StatusChanged') {
    const p = event.payload as TaskStatusChangedPayload;
    if (!p?.taskId) return null;
    return { aggregateType: 'task', aggregateId: String(p.taskId) };
  }
  if (event.type === 'Project.HealthRecalculated') {
    const p = event.payload as { projectId?: string };
    if (!p?.projectId) return null;
    return { aggregateType: 'project', aggregateId: String(p.projectId) };
  }
  return { aggregateType: 'unknown', aggregateId: event.eventId };
}

function parseCorrelationUuid(value: string | null | undefined): string | null {
  if (!value) return null;
  const re =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return re.test(value) ? value : null;
}

/**
 * Persiste un événement dans Supabase (append-only). Idempotence : ON CONFLICT DO NOTHING sur (org, client_event_id).
 * Sans effet si Supabase non configuré, table absente, ou organization_id manquant.
 */
export async function persistDomainEventEnvelope(event: DomainEventEnvelope): Promise<boolean> {
  if (!isSupabaseConfigured || isTableUnavailable(TABLE)) return false;
  const orgId = event.organizationId;
  if (!orgId) return false;

  const agg = aggregateFromEnvelope(event);
  if (!agg) return false;

  const row = {
    organization_id: orgId,
    client_event_id: event.eventId,
    aggregate_type: agg.aggregateType,
    aggregate_id: agg.aggregateId,
    event_type: event.type,
    payload: event.payload as object,
    occurred_at: event.occurredAt,
    actor_id: event.actorId ?? null,
    schema_version: event.schemaVersion,
    correlation_id: parseCorrelationUuid(event.correlationId ?? undefined),
    causation_id: event.causationId ?? null,
    source: event.source,
  };

  const { error } = await supabase.from(TABLE).insert(row);
  if (error) {
    if (error.code === '23505') {
      return true;
    }
    if (handleOptionalTableError(error, TABLE, 'persistDomainEventEnvelope')) {
      return false;
    }
    console.warn('[domain_events] insert error', error.message);
    return false;
  }
  return true;
}

/** Fire-and-forget : ne bloque pas le bus métier. */
export function persistDomainEventFireAndForget(event: DomainEventEnvelope): void {
  void persistDomainEventEnvelope(event).catch((e) => {
    console.warn('[domain_events] persist async error', e);
  });
}
