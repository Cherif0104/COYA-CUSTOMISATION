import { supabase } from './supabaseService';
import type { ProgrammeCockpitReadModel } from './programmeCockpitContract';

export type ProgrammeCockpitRow = {
  organization_id: string;
  programme_id: string;
  schema_id: string;
  model_version: number;
  projection_run_id?: string | null;
  projection_status?: 'building' | 'ready' | 'failed' | 'stale' | string;
  projection_error?: unknown;
  generated_at: string;
  watermark_event_occurred_at: string | null;
  watermark_source_updated_at: string | null;
  model: ProgrammeCockpitReadModel;
};

export async function getProgrammeCockpitReadModel(programmeId: string): Promise<ProgrammeCockpitReadModel | null> {
  const { data, error } = await supabase
    .from('programme_cockpit_read_models')
    .select('model')
    .eq('programme_id', programmeId)
    .maybeSingle();

  if (error) throw error;
  return (data?.model as ProgrammeCockpitReadModel) ?? null;
}

export async function rebuildProgrammeCockpit(programmeId: string): Promise<void> {
  // nécessite session JWT; l'Edge Function vérifie l'accès org.
  const { error } = await supabase.functions.invoke('programme-cockpit-rebuild', {
    body: { programme_id: programmeId },
  });
  if (error) throw error;
}

export async function getOrRebuildProgrammeCockpit(programmeId: string, opts?: { rebuildIfMissing?: boolean }) {
  const model = await getProgrammeCockpitReadModel(programmeId);
  if (model || opts?.rebuildIfMissing === false) return model;

  await rebuildProgrammeCockpit(programmeId);
  return await getProgrammeCockpitReadModel(programmeId);
}

export async function getProgrammeCockpitRow(programmeId: string): Promise<ProgrammeCockpitRow | null> {
  const { data, error } = await supabase
    .from('programme_cockpit_read_models')
    .select(
      'organization_id, programme_id, schema_id, model_version, projection_run_id, projection_status, projection_error, generated_at, watermark_event_occurred_at, watermark_source_updated_at, model',
    )
    .eq('programme_id', programmeId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProgrammeCockpitRow) ?? null;
}

