import { supabase } from './supabaseService';

export type WorkDaySummary = {
  id: string;
  organizationId: string;
  profileId: string;
  workDate: string; // YYYY-MM-DD
  minutesProjectWork: number;
  minutesPlanning: number;
  minutesAttendanceSpan: number;
  presenceStatus: string;
  journeyCompleted: boolean;
  summaryMeta: any;
  lastComputedAt: string;
};

export type WorkProof = {
  id: string;
  organizationId: string;
  profileId: string;
  workDate: string; // YYYY-MM-DD
  proofType: 'external_url' | 'storage_file';
  externalUrl?: string | null;
  storageObjectPath?: string | null;
  relatedTimeEntryId?: string | null;
  caption?: string | null;
  createdAt: string;
};

function mapSummaryRow(row: any): WorkDaySummary {
  return {
    id: row.id,
    organizationId: row.organization_id,
    profileId: row.profile_id,
    workDate: row.work_date,
    minutesProjectWork: row.minutes_project_work ?? 0,
    minutesPlanning: row.minutes_planning ?? 0,
    minutesAttendanceSpan: row.minutes_attendance_span ?? 0,
    presenceStatus: row.presence_status ?? 'unknown',
    journeyCompleted: row.journey_completed === true,
    summaryMeta: row.summary_meta ?? {},
    lastComputedAt: row.last_computed_at,
  };
}

function mapProofRow(row: any): WorkProof {
  return {
    id: row.id,
    organizationId: row.organization_id,
    profileId: row.profile_id,
    workDate: row.work_date,
    proofType: row.proof_type,
    externalUrl: row.external_url ?? null,
    storageObjectPath: row.storage_object_path ?? null,
    relatedTimeEntryId: row.related_time_entry_id ?? null,
    caption: row.caption ?? null,
    createdAt: row.created_at,
  };
}

export async function listWorkDaySummaries(params: {
  organizationId?: string;
  profileId?: string;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}): Promise<WorkDaySummary[]> {
  let q = supabase
    .from('coya_work_day_summaries')
    .select('*')
    .order('work_date', { ascending: false });
  if (params.organizationId) q = q.eq('organization_id', params.organizationId);
  if (params.profileId) q = q.eq('profile_id', params.profileId);
  if (params.from) q = q.gte('work_date', params.from);
  if (params.to) q = q.lte('work_date', params.to);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapSummaryRow);
}

export async function listWorkProofs(params: {
  organizationId?: string;
  profileId?: string;
  workDate?: string; // YYYY-MM-DD
}): Promise<WorkProof[]> {
  let q = supabase
    .from('coya_work_proofs')
    .select('*')
    .order('created_at', { ascending: false });
  if (params.organizationId) q = q.eq('organization_id', params.organizationId);
  if (params.profileId) q = q.eq('profile_id', params.profileId);
  if (params.workDate) q = q.eq('work_date', params.workDate);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapProofRow);
}

export async function addWorkProof(input: {
  organizationId: string;
  profileId: string;
  workDate: string;
  proofType: 'external_url' | 'storage_file';
  externalUrl?: string;
  storageObjectPath?: string;
  caption?: string;
  relatedTimeEntryId?: string | null;
}): Promise<WorkProof> {
  const payload: any = {
    organization_id: input.organizationId,
    profile_id: input.profileId,
    work_date: input.workDate,
    proof_type: input.proofType,
    external_url: input.proofType === 'external_url' ? input.externalUrl ?? null : null,
    storage_object_path: input.proofType === 'storage_file' ? input.storageObjectPath ?? null : null,
    caption: input.caption ?? null,
    related_time_entry_id: input.relatedTimeEntryId ?? null,
  };
  const { data, error } = await supabase.from('coya_work_proofs').insert(payload).select('*').single();
  if (error) throw error;
  return mapProofRow(data);
}

