import { supabase } from './supabaseService';

export const HR_DOCUMENT_REQUEST_TYPES = [
  'payslip',
  'salary_certificate',
  'work_certificate',
  'contract',
  'mission_order',
  'leave_certificate',
] as const;

export type HrDocumentRequestType = (typeof HR_DOCUMENT_REQUEST_TYPES)[number];

export type HrDocumentRequestStatus =
  | 'submitted'
  | 'in_progress'
  | 'ready'
  | 'rejected'
  | 'cancelled';

export type HrDocumentRequestRow = {
  id: string;
  organizationId: string;
  profileId: string;
  requestType: HrDocumentRequestType;
  status: HrDocumentRequestStatus;
  payload: Record<string, unknown>;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapRow(row: any): HrDocumentRequestRow {
  return {
    id: row.id,
    organizationId: row.organization_id,
    profileId: row.profile_id,
    requestType: row.request_type,
    status: row.status,
    payload: (row.payload as Record<string, unknown>) || {},
    notes: row.notes ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listHrDocumentRequests(params: {
  organizationId: string;
  profileId?: string;
}): Promise<HrDocumentRequestRow[]> {
  let q = supabase
    .from('hr_document_requests')
    .select('*')
    .eq('organization_id', params.organizationId)
    .order('created_at', { ascending: false });
  if (params.profileId) q = q.eq('profile_id', params.profileId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function createHrDocumentRequest(input: {
  organizationId: string;
  profileId: string;
  requestType: HrDocumentRequestType;
  payload?: Record<string, unknown>;
  notes?: string | null;
}): Promise<HrDocumentRequestRow> {
  const { data, error } = await supabase
    .from('hr_document_requests')
    .insert({
      organization_id: input.organizationId,
      profile_id: input.profileId,
      request_type: input.requestType,
      status: 'submitted',
      payload: input.payload ?? {},
      notes: input.notes ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function updateHrDocumentRequestStatus(
  id: string,
  status: HrDocumentRequestStatus,
  notes?: string | null,
): Promise<HrDocumentRequestRow> {
  const patch: Record<string, unknown> = { status };
  if (notes !== undefined) patch.notes = notes;
  const { data, error } = await supabase.from('hr_document_requests').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return mapRow(data);
}
