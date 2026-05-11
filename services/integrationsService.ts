import { supabase } from './supabaseService';

export type ExternalIntegrationProvider = 'atlassian' | 'monday' | 'google_drive' | 'odoo_sync' | 'other';
export type ExternalIntegrationStatus = 'inactive' | 'active' | 'error';

export type ExternalIntegration = {
  id: string;
  organizationId: string;
  provider: ExternalIntegrationProvider;
  status: ExternalIntegrationStatus;
  displayName: string | null;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

function mapRow(row: any): ExternalIntegration {
  return {
    id: row.id,
    organizationId: row.organization_id,
    provider: row.provider,
    status: row.status,
    displayName: row.display_name ?? null,
    config: row.config ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listIntegrations(organizationId: string): Promise<ExternalIntegration[]> {
  const { data, error } = await supabase
    .from('coya_external_integrations')
    .select('*')
    .eq('organization_id', organizationId)
    .order('provider', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function upsertIntegration(input: {
  organizationId: string;
  provider: ExternalIntegrationProvider;
  status?: ExternalIntegrationStatus;
  displayName?: string | null;
  config?: Record<string, unknown>;
}): Promise<ExternalIntegration> {
  const payload: any = {
    organization_id: input.organizationId,
    provider: input.provider,
    status: input.status ?? 'inactive',
    display_name: input.displayName ?? null,
    config: input.config ?? {},
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('coya_external_integrations')
    .upsert(payload, { onConflict: 'organization_id,provider' })
    .select('*')
    .single();
  if (error) throw error;
  return mapRow(data);
}

