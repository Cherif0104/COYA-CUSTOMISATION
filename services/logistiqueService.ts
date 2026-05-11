import { supabase } from './supabaseService';
import OrganizationService from './organizationService';

export type SensitiveDisposalStatus = 'none' | 'retention' | 'cleared' | 'destroyed';

export interface Equipment {
  id: string;
  organizationId: string;
  equipmentCategoryId?: string;
  name: string;
  brand?: string;
  model?: string;
  location?: string;
  responsibleId?: string;
  imageUrl?: string;
  isActive: boolean;
  assetReference?: string;
  quantityOnHand: number;
  reorderThreshold: number;
  maintenanceNextDue?: string;
  maintenanceEstimatedCostCents?: number;
  sensitiveAsset: boolean;
  sensitiveRetentionEnd?: string;
  sensitiveDisposalStatus: SensitiveDisposalStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface EquipmentCategory {
  id: string;
  organizationId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface EquipmentRequest {
  id: string;
  organizationId: string;
  equipmentId: string;
  requesterId: string;
  status: 'requested' | 'validated' | 'allocated' | 'returned' | 'rejected';
  requestedAt?: string;
  validatedAt?: string;
  allocatedAt?: string;
  returnAt?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

function mapEquipment(row: any): Equipment {
  return {
    id: row.id,
    organizationId: row.organization_id,
    equipmentCategoryId: row.equipment_category_id ?? undefined,
    name: row.name,
    brand: row.brand ?? undefined,
    model: row.model ?? undefined,
    location: row.location ?? undefined,
    responsibleId: row.responsible_id ?? undefined,
    imageUrl: row.image_url ?? undefined,
    isActive: row.is_active !== false,
    assetReference: row.asset_reference ?? undefined,
    quantityOnHand: row.quantity_on_hand != null ? Number(row.quantity_on_hand) : 1,
    reorderThreshold: row.reorder_threshold != null ? Number(row.reorder_threshold) : 0,
    maintenanceNextDue: row.maintenance_next_due ?? undefined,
    maintenanceEstimatedCostCents:
      row.maintenance_estimated_cost_cents != null ? Number(row.maintenance_estimated_cost_cents) : undefined,
    sensitiveAsset: !!row.sensitive_asset,
    sensitiveRetentionEnd: row.sensitive_retention_end ?? undefined,
    sensitiveDisposalStatus: (row.sensitive_disposal_status as SensitiveDisposalStatus) || 'none',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCategory(row: any): EquipmentCategory {
  return {
    id: row.id,
    organizationId: row.organization_id ?? null,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    icon: row.icon ?? null,
    sortOrder: Number(row.sort_order ?? 0),
    isActive: row.is_active !== false,
  };
}

export async function listEquipmentCategories(organizationId?: string | null): Promise<EquipmentCategory[]> {
  try {
    const orgId = organizationId || (await OrganizationService.getCurrentUserOrganizationId());
    const query = supabase
      .from('logistics_equipment_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .order('name');
    if (orgId) query.or(`organization_id.is.null,organization_id.eq.${orgId}`);
    else query.is('organization_id', null);
    const { data, error } = await query;
    if (error) return [];
    return (data || []).map(mapCategory);
  } catch {
    return [];
  }
}

function mapRequest(row: any): EquipmentRequest {
  return {
    id: row.id,
    organizationId: row.organization_id,
    equipmentId: row.equipment_id,
    requesterId: row.requester_id,
    status: row.status ?? 'requested',
    requestedAt: row.requested_at,
    validatedAt: row.validated_at,
    allocatedAt: row.allocated_at,
    returnAt: row.return_at,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listEquipments(organizationId?: string | null): Promise<Equipment[]> {
  try {
    const orgId = organizationId || (await OrganizationService.getCurrentUserOrganizationId());
    if (!orgId) return [];
    const { data, error } = await supabase
      .from('equipments')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('name');
    if (error) return [];
    return (data || []).map(mapEquipment);
  } catch {
    return [];
  }
}

export async function createEquipment(params: {
  name: string;
  equipmentCategoryId?: string;
  brand?: string;
  model?: string;
  location?: string;
  responsibleId?: string;
  assetReference?: string;
  quantityOnHand?: number;
  reorderThreshold?: number;
  maintenanceNextDue?: string;
  maintenanceEstimatedCostCents?: number;
  sensitiveAsset?: boolean;
  sensitiveRetentionEnd?: string;
  sensitiveDisposalStatus?: SensitiveDisposalStatus;
}): Promise<Equipment | null> {
  try {
    const orgId = await OrganizationService.getCurrentUserOrganizationId();
    if (!orgId) return null;
    const { data, error } = await supabase
      .from('equipments')
      .insert({
        organization_id: orgId,
        name: params.name.trim(),
        equipment_category_id: params.equipmentCategoryId || null,
        brand: params.brand?.trim() || null,
        model: params.model?.trim() || null,
        location: params.location?.trim() || null,
        responsible_id: params.responsibleId || null,
        asset_reference: params.assetReference?.trim() || null,
        quantity_on_hand: params.quantityOnHand ?? 1,
        reorder_threshold: params.reorderThreshold ?? 0,
        maintenance_next_due: params.maintenanceNextDue || null,
        maintenance_estimated_cost_cents: params.maintenanceEstimatedCostCents ?? null,
        sensitive_asset: params.sensitiveAsset ?? false,
        sensitive_retention_end: params.sensitiveRetentionEnd || null,
        sensitive_disposal_status: params.sensitiveDisposalStatus ?? 'none',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return mapEquipment(data);
  } catch (e) {
    console.error('logistiqueService.createEquipment:', e);
    return null;
  }
}

export async function updateEquipment(
  id: string,
  params: Partial<
    Pick<
      Equipment,
      | 'name'
      | 'equipmentCategoryId'
      | 'brand'
      | 'model'
      | 'location'
      | 'responsibleId'
      | 'assetReference'
      | 'quantityOnHand'
      | 'reorderThreshold'
      | 'maintenanceNextDue'
      | 'maintenanceEstimatedCostCents'
      | 'sensitiveAsset'
      | 'sensitiveRetentionEnd'
      | 'sensitiveDisposalStatus'
    >
  >,
): Promise<boolean> {
  try {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (params.name !== undefined) row.name = params.name.trim();
    if (params.equipmentCategoryId !== undefined) row.equipment_category_id = params.equipmentCategoryId || null;
    if (params.brand !== undefined) row.brand = params.brand?.trim() || null;
    if (params.model !== undefined) row.model = params.model?.trim() || null;
    if (params.location !== undefined) row.location = params.location?.trim() || null;
    if (params.responsibleId !== undefined) row.responsible_id = params.responsibleId || null;
    if (params.assetReference !== undefined) row.asset_reference = params.assetReference?.trim() || null;
    if (params.quantityOnHand !== undefined) row.quantity_on_hand = params.quantityOnHand;
    if (params.reorderThreshold !== undefined) row.reorder_threshold = params.reorderThreshold;
    if (params.maintenanceNextDue !== undefined) row.maintenance_next_due = params.maintenanceNextDue || null;
    if (params.maintenanceEstimatedCostCents !== undefined)
      row.maintenance_estimated_cost_cents = params.maintenanceEstimatedCostCents ?? null;
    if (params.sensitiveAsset !== undefined) row.sensitive_asset = params.sensitiveAsset;
    if (params.sensitiveRetentionEnd !== undefined) row.sensitive_retention_end = params.sensitiveRetentionEnd || null;
    if (params.sensitiveDisposalStatus !== undefined) row.sensitive_disposal_status = params.sensitiveDisposalStatus;
    const { error } = await supabase.from('equipments').update(row).eq('id', id);
    return !error;
  } catch (e) {
    console.error('logistiqueService.updateEquipment:', e);
    return false;
  }
}

/** Soft delete: hides from default list (is_active = false). */
export async function archiveEquipment(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('equipments')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    return !error;
  } catch (e) {
    console.error('logistiqueService.archiveEquipment:', e);
    return false;
  }
}

export async function listEquipmentRequests(organizationId?: string | null): Promise<EquipmentRequest[]> {
  try {
    const orgId = organizationId || (await OrganizationService.getCurrentUserOrganizationId());
    if (!orgId) return [];
    const { data, error } = await supabase
      .from('equipment_requests')
      .select('*')
      .eq('organization_id', orgId)
      .order('requested_at', { ascending: false });
    if (error) return [];
    return (data || []).map(mapRequest);
  } catch {
    return [];
  }
}

export async function createEquipmentRequest(params: {
  equipmentId: string;
  notes?: string;
}): Promise<EquipmentRequest | null> {
  try {
    const orgId = await OrganizationService.getCurrentUserOrganizationId();
    if (!orgId) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
    if (!profile) return null;
    const { data, error } = await supabase
      .from('equipment_requests')
      .insert({
        organization_id: orgId,
        equipment_id: params.equipmentId,
        requester_id: profile.id,
        status: 'requested',
        notes: params.notes || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return mapRequest(data);
  } catch (e) {
    console.error('logistiqueService.createEquipmentRequest:', e);
    return null;
  }
}

export async function updateEquipmentRequestStatus(
  id: string,
  status: 'validated' | 'allocated' | 'returned' | 'rejected'
): Promise<boolean> {
  try {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === 'validated') updates.validated_at = new Date().toISOString();
    if (status === 'allocated') updates.allocated_at = new Date().toISOString();
    if (status === 'returned') updates.return_at = new Date().toISOString();
    const { error } = await supabase.from('equipment_requests').update(updates).eq('id', id);
    return !error;
  } catch {
    return false;
  }
}
