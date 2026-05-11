import { supabase, isSupabaseConfigured } from '../supabaseService';
import { handleOptionalTableError, isTableUnavailable } from '../optionalTableGuard';

const TABLE = 'domain_events';

/** Ligne `domain_events` telle que renvoyée par PostgREST (snake_case). */
export type DomainEventRow = {
  id: string;
  organization_id: string;
  client_event_id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  occurred_at: string;
  actor_id: string | null;
  schema_version: number;
  correlation_id: string | null;
  causation_id: string | null;
  source: string;
  created_at: string;
};

export type ListDomainEventsForProjectParams = {
  organizationId: string;
  projectId: string;
  limit?: number;
};

/**
 * Événements métier liés à un projet : agrégat `project` + tâches dont le payload référence ce projet.
 * Utilisable pour timeline / onglet Historique (projection lecture).
 */
export async function listDomainEventsForProject(
  params: ListDomainEventsForProjectParams,
): Promise<{ data: DomainEventRow[]; error: Error | null }> {
  const limit = Math.min(Math.max(params.limit ?? 100, 1), 500);
  if (!isSupabaseConfigured || isTableUnavailable(TABLE)) {
    return { data: [], error: null };
  }
  const pid = String(params.projectId);
  const oid = String(params.organizationId);

  const base = () =>
    supabase.from(TABLE).select('*').eq('organization_id', oid).order('occurred_at', { ascending: false }).limit(limit);

  const [byProjectAgg, byTaskPayload] = await Promise.all([
    base().eq('aggregate_type', 'project').eq('aggregate_id', pid),
    base().eq('event_type', 'Task.StatusChanged').filter('payload->>projectId', 'eq', pid),
  ]);

  const err = byProjectAgg.error || byTaskPayload.error;
  if (err) {
    if (handleOptionalTableError(err, TABLE, 'listDomainEventsForProject')) {
      return { data: [], error: null };
    }
    return { data: [], error: new Error(err.message) };
  }

  const map = new Map<string, DomainEventRow>();
  for (const row of [...(byProjectAgg.data || []), ...(byTaskPayload.data || [])] as DomainEventRow[]) {
    map.set(row.client_event_id, row);
  }
  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  );
  return { data: merged.slice(0, limit), error: null };
}

export type ListDomainEventsByCorrelationParams = {
  organizationId: string;
  correlationId: string;
  limit?: number;
};

/** Chaîne complète liée à une corrélation (debug / support / timeline groupée). */
export async function listDomainEventsByCorrelation(
  params: ListDomainEventsByCorrelationParams,
): Promise<{ data: DomainEventRow[]; error: Error | null }> {
  const limit = Math.min(Math.max(params.limit ?? 200, 1), 500);
  if (!isSupabaseConfigured || isTableUnavailable(TABLE)) {
    return { data: [], error: null };
  }
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('organization_id', params.organizationId)
    .eq('correlation_id', params.correlationId)
    .order('occurred_at', { ascending: true })
    .limit(limit);

  if (error) {
    if (handleOptionalTableError(error, TABLE, 'listDomainEventsByCorrelation')) {
      return { data: [], error: null };
    }
    return { data: [], error: new Error(error.message) };
  }
  return { data: (data || []) as DomainEventRow[], error: null };
}
