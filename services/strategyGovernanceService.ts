import { supabase, isSupabaseConfigured } from './supabaseService';
import { handleOptionalTableError } from './optionalTableGuard';
import type { ProgrammeCockpitReadModel } from './programmeCockpitContract';

export type ProgrammeCockpitSnapshotRow = {
  programme_id: string;
  generated_at: string;
  projection_status: string | null;
  model: ProgrammeCockpitReadModel;
};

export type DomainEventListRow = {
  id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  occurred_at: string;
  payload: Record<string, unknown>;
};

/**
 * Snapshots cockpit programme pour l’organisation (lecture seule, RLS).
 */
export async function fetchProgrammeCockpitSnapshots(
  organizationId: string | null | undefined,
): Promise<{ rows: ProgrammeCockpitSnapshotRow[]; programmeNames: Record<string, string>; error?: string }> {
  if (!isSupabaseConfigured || !organizationId) {
    return { rows: [], programmeNames: {} };
  }

  const { data: cockpitRows, error: cockpitErr } = await supabase
    .from('programme_cockpit_read_models')
    .select('programme_id, generated_at, projection_status, model')
    .eq('organization_id', organizationId)
    .order('generated_at', { ascending: false });

  if (cockpitErr) {
    if (handleOptionalTableError(cockpitErr, 'programme_cockpit_read_models', 'fetchProgrammeCockpitSnapshots')) {
      return { rows: [], programmeNames: {} };
    }
    return { rows: [], programmeNames: {}, error: cockpitErr.message };
  }

  const rows = (cockpitRows ?? []).map((r) => ({
    programme_id: String(r.programme_id),
    generated_at: String(r.generated_at),
    projection_status: r.projection_status != null ? String(r.projection_status) : null,
    model: r.model as ProgrammeCockpitReadModel,
  }));

  const { data: progRows, error: progErr } = await supabase
    .from('programmes')
    .select('id, name')
    .eq('organization_id', organizationId);

  if (progErr && !handleOptionalTableError(progErr, 'programmes', 'fetchProgrammeCockpitSnapshots')) {
    return { rows, programmeNames: {}, error: progErr.message };
  }

  const programmeNames: Record<string, string> = {};
  for (const p of progRows ?? []) {
    programmeNames[String((p as { id: string }).id)] = String((p as { name: string }).name ?? '');
  }

  return { rows, programmeNames };
}

/**
 * Derniers événements domaine append-only (journal Strategy OS).
 */
export async function fetchRecentDomainEvents(
  organizationId: string | null | undefined,
  limit = 80,
): Promise<{ events: DomainEventListRow[]; error?: string }> {
  if (!isSupabaseConfigured || !organizationId) {
    return { events: [] };
  }

  const { data, error } = await supabase
    .from('domain_events')
    .select('id, event_type, aggregate_type, aggregate_id, occurred_at, payload')
    .eq('organization_id', organizationId)
    .order('occurred_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));

  if (error) {
    if (handleOptionalTableError(error, 'domain_events', 'fetchRecentDomainEvents')) {
      return { events: [] };
    }
    return { events: [], error: error.message };
  }

  const events = (data ?? []).map((e) => ({
    id: String((e as { id: string }).id),
    event_type: String((e as { event_type: string }).event_type),
    aggregate_type: String((e as { aggregate_type: string }).aggregate_type),
    aggregate_id: String((e as { aggregate_id: string }).aggregate_id),
    occurred_at: String((e as { occurred_at: string }).occurred_at),
    payload: ((e as { payload?: Record<string, unknown> }).payload ?? {}) as Record<string, unknown>,
  }));

  return { events };
}
