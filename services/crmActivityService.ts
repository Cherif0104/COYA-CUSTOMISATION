import { supabase } from './supabaseService';
import OrganizationService from './organizationService';

export type CrmInteractionChannel =
  | 'note'
  | 'email'
  | 'phone'
  | 'whatsapp'
  | 'meeting'
  | 'studio_quote'
  | 'studio_invoice'
  | 'system';

export interface CrmInteraction {
  id: string;
  organizationId: string;
  contactId?: string | null;
  channel: CrmInteractionChannel;
  summary: string;
  details?: Record<string, unknown>;
  createdBy?: string | null;
  createdAt: string;
}

function mapInteraction(row: any): CrmInteraction {
  return {
    id: row.id,
    organizationId: row.organization_id,
    contactId: row.contact_id ?? null,
    channel: row.channel ?? 'note',
    summary: row.summary,
    details: row.details ?? {},
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
  };
}

export async function listCrmInteractions(params: {
  organizationId?: string | null;
  contactId?: string | null;
  limit?: number;
} = {}): Promise<CrmInteraction[]> {
  try {
    const orgId = params.organizationId || (await OrganizationService.getCurrentUserOrganizationId());
    if (!orgId) return [];
    let query = supabase
      .from('crm_interactions')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(params.limit ?? 50);
    if (params.contactId) query = query.eq('contact_id', params.contactId);
    const { data, error } = await query;
    if (error) return [];
    return (data || []).map(mapInteraction);
  } catch {
    return [];
  }
}

export async function createCrmInteraction(params: {
  contactId?: string | null;
  channel?: CrmInteractionChannel;
  summary: string;
  details?: Record<string, unknown>;
}): Promise<CrmInteraction | null> {
  try {
    const orgId = await OrganizationService.getCurrentUserOrganizationId();
    if (!orgId || !params.summary.trim()) return null;
    const { data: auth } = await supabase.auth.getUser();
    const { data: profile } = auth.user
      ? await supabase.from('profiles').select('id').eq('user_id', auth.user.id).maybeSingle()
      : { data: null };
    const { data, error } = await supabase
      .from('crm_interactions')
      .insert({
        organization_id: orgId,
        contact_id: params.contactId || null,
        channel: params.channel || 'note',
        summary: params.summary.trim(),
        details: params.details || {},
        created_by: auth.user?.id ?? null,
        created_by_profile_id: profile?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return mapInteraction(data);
  } catch (e) {
    console.warn('crmActivityService.createCrmInteraction:', e);
    return null;
  }
}

export async function logStudioCrmActivity(params: {
  contactId?: string | null;
  kind: 'quote' | 'invoice';
  summary: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await createCrmInteraction({
    contactId: params.contactId,
    channel: params.kind === 'quote' ? 'studio_quote' : 'studio_invoice',
    summary: params.summary,
    details: params.payload || {},
  });
}
