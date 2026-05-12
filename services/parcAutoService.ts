import { supabase } from './supabaseService';
import OrganizationService from './organizationService';
import {
  mergeCatalogBrandsWithFallback,
  listLocalCatalogModelsForBrand,
  parseLocalBrandId,
} from './vehicleCatalogLocal';
import {
  deleteVehicleRequestPlanningSlots,
  syncVehicleRequestPlanningSlot,
} from './planning/vehicleRequestPlanningSync';

export {
  isLocalCatalogBrandId,
  isLocalCatalogModelId,
  parseLocalBrandId,
  parseLocalCatalogModelMeta,
} from './vehicleCatalogLocal';

export type VehicleRequestStatus =
  | 'pending_n1'
  | 'pending_fleet'
  | 'validated'
  | 'allocated'
  | 'returned'
  | 'rejected';

export type TransportMode = 'internal' | 'partner';

export type VehiclePaymentStatus = 'not_invoiced' | 'pending_payment' | 'paid' | 'settled';

export type VehiclePhotoSlot =
  | 'avant'
  | 'arriere'
  | 'interieur'
  | 'cockpit'
  | 'bagages'
  | 'extra_1'
  | 'extra_2'
  | 'extra_3'
  | 'extra_4'
  | 'extra_5';

export const FLEET_STORAGE_BUCKET = 'fleet-files';

export const VEHICLE_PHOTO_SLOT_ORDER: VehiclePhotoSlot[] = [
  'avant',
  'arriere',
  'interieur',
  'cockpit',
  'bagages',
  'extra_1',
  'extra_2',
  'extra_3',
  'extra_4',
  'extra_5',
];

export interface VehicleCatalogBrand {
  id: string;
  name: string;
  sortOrder: number;
}

export interface VehicleCatalogModel {
  id: string;
  brandId: string;
  name: string;
  yearFrom: number | null;
  yearTo: number | null;
}

export interface Vehicle {
  id: string;
  organizationId: string;
  name: string;
  brand?: string;
  model?: string;
  plateNumber?: string;
  location?: string;
  responsibleId?: string;
  vehicleCatalogModelId?: string;
  acquisitionKind?: 'new' | 'used';
  odometerAcquisition?: number;
  currentOdometer?: number;
  purchasePriceCents?: number;
  inServiceFrom?: string;
  usefulLifeMonths?: number;
  depreciationMethod?: string;
  accumulatedDepreciationCents?: number;
  retiredAt?: string;
  replacementNotes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleRequest {
  id: string;
  organizationId: string;
  vehicleId?: string | null;
  requesterId: string;
  status: VehicleRequestStatus;
  transportMode: TransportMode;
  partnerVehicleId?: string | null;
  programmeId?: string;
  projectId?: string;
  taskId?: string;
  missionJustification?: string;
  designatedApproverProfileId?: string;
  requestedAt?: string;
  validatedAt?: string;
  allocatedAt?: string;
  returnAt?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  routeOrigin?: string;
  routeDestination?: string;
  routeWaypoints?: unknown[];
  missionOrderStoragePath?: string;
  startAt?: string;
  endAt?: string;
  quotedPriceCents?: number;
  priceBreakdown?: Record<string, unknown>;
  paymentStatus: VehiclePaymentStatus;
  invoiceStoragePath?: string;
  invoiceNumber?: string;
  invoiceMetadata?: Record<string, unknown>;
  n1ValidatedByProfileId?: string;
  n1ValidatedAt?: string;
  fleetValidatedByProfileId?: string;
  fleetValidatedAt?: string;
  allocatedByProfileId?: string;
  rejectedByProfileId?: string;
  rejectedAt?: string;
  releasedAt?: string;
  /** Noms résolus côté client (jointures optionnelles) */
  programmeName?: string;
  projectTitle?: string;
  taskTitle?: string;
  partnerVehicleLabel?: string;
  partnerCompanyName?: string;
}

export interface TransportPartnerCompany {
  id: string;
  organizationId: string;
  name: string;
  contactEmail?: string | null;
  phone?: string | null;
  notes?: string | null;
  active: boolean;
}

export interface TransportPartnerVehicle {
  id: string;
  organizationId: string;
  partnerCompanyId: string;
  label: string;
  plateNumber?: string | null;
  seats?: number | null;
  notes?: string | null;
  active: boolean;
}

export interface VehiclePhotoRow {
  id: string;
  vehicleId: string;
  slot: VehiclePhotoSlot;
  storagePath: string;
  uploadedAt: string;
}

export interface VehicleRequestTransition {
  id: string;
  vehicleRequestId: string;
  fromStatus: string | null;
  toStatus: string;
  actorProfileId?: string | null;
  createdAt: string;
  meta: Record<string, unknown>;
}

export interface VehicleHandoverReport {
  id: string;
  vehicleRequestId: string;
  phase: 'checkout' | 'checkin';
  odometer: number | null;
  fuelLevelPercent: number | null;
  conditionNotes: string | null;
  maintenanceFlag: boolean;
  recordedByProfileId: string;
  recordedAt: string;
}

export interface LogisticsAuditEvent {
  id: string;
  organizationId: string;
  subjectType: string;
  subjectId: string;
  actorProfileId: string | null;
  eventType: string;
  details: Record<string, unknown>;
  createdAt: string;
}

/** Paramètre d’URL pour ouvrir une fiche demande depuis Parc Auto (`?vehicleRequest=<uuid>`). */
export const VEHICLE_REQUEST_URL_PARAM = 'vehicleRequest';

export interface VehicleRequestDetailBundle {
  request: VehicleRequest;
  transitions: VehicleRequestTransition[];
  handovers: VehicleHandoverReport[];
  auditEvents: LogisticsAuditEvent[];
  vehicle: Vehicle | null;
  partnerVehicle: TransportPartnerVehicle | null;
  partnerCompany: TransportPartnerCompany | null;
  photos: VehiclePhotoRow[];
  /** Profils indexés par id (demandeur, acteurs workflow, audit, etc.) */
  profilesById: Map<string, ProfileOption>;
}

export interface OrgProjectRow {
  id: string;
  title: string;
  programmeId: string | null;
}

export interface TaskRow {
  id: string;
  title: string;
}

export interface ProfileOption {
  id: string;
  fullName: string | null;
  email: string | null;
}

export interface HandoverPayload {
  odometer: number | null;
  fuelLevelPercent: number | null;
  conditionNotes: string | null;
  maintenanceFlag: boolean;
}

function mapVehicle(row: Record<string, unknown>): Vehicle {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    name: row.name as string,
    brand: (row.brand as string) ?? undefined,
    model: (row.model as string) ?? undefined,
    plateNumber: (row.plate_number as string) ?? undefined,
    location: (row.location as string) ?? undefined,
    responsibleId: (row.responsible_id as string) ?? undefined,
    vehicleCatalogModelId: (row.vehicle_catalog_model_id as string) ?? undefined,
    acquisitionKind: (row.acquisition_kind as 'new' | 'used') ?? undefined,
    odometerAcquisition: row.odometer_acquisition != null ? Number(row.odometer_acquisition) : undefined,
    currentOdometer: row.current_odometer != null ? Number(row.current_odometer) : undefined,
    purchasePriceCents: row.purchase_price_cents != null ? Number(row.purchase_price_cents) : undefined,
    inServiceFrom: (row.in_service_from as string) ?? undefined,
    usefulLifeMonths: row.useful_life_months != null ? Number(row.useful_life_months) : undefined,
    depreciationMethod: (row.depreciation_method as string) ?? undefined,
    accumulatedDepreciationCents:
      row.accumulated_depreciation_cents != null ? Number(row.accumulated_depreciation_cents) : 0,
    retiredAt: (row.retired_at as string) ?? undefined,
    replacementNotes: (row.replacement_notes as string) ?? undefined,
    isActive: row.is_active !== false,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

function mapRequest(row: Record<string, unknown>): VehicleRequest {
  const pm = (row.transport_mode as TransportMode | undefined) ?? 'internal';
  const pay = (row.payment_status as VehiclePaymentStatus | undefined) ?? 'not_invoiced';
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    vehicleId: row.vehicle_id != null ? (row.vehicle_id as string) : null,
    requesterId: row.requester_id as string,
    status: (row.status as VehicleRequestStatus) ?? 'pending_fleet',
    transportMode: pm,
    partnerVehicleId: row.partner_vehicle_id != null ? (row.partner_vehicle_id as string) : null,
    programmeId: (row.programme_id as string) ?? undefined,
    projectId: (row.project_id as string) ?? undefined,
    taskId: (row.task_id as string) ?? undefined,
    missionJustification: (row.mission_justification as string) ?? undefined,
    designatedApproverProfileId: (row.designated_approver_profile_id as string) ?? undefined,
    requestedAt: row.requested_at as string | undefined,
    validatedAt: row.validated_at as string | undefined,
    allocatedAt: row.allocated_at as string | undefined,
    returnAt: row.return_at as string | undefined,
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
    routeOrigin: (row.route_origin as string) ?? undefined,
    routeDestination: (row.route_destination as string) ?? undefined,
    routeWaypoints: Array.isArray(row.route_waypoints) ? (row.route_waypoints as unknown[]) : undefined,
    missionOrderStoragePath: (row.mission_order_storage_path as string) ?? undefined,
    startAt: row.start_at as string | undefined,
    endAt: row.end_at as string | undefined,
    quotedPriceCents: row.quoted_price_cents != null ? Number(row.quoted_price_cents) : undefined,
    priceBreakdown:
      row.price_breakdown && typeof row.price_breakdown === 'object'
        ? (row.price_breakdown as Record<string, unknown>)
        : undefined,
    paymentStatus: pay,
    invoiceStoragePath: (row.invoice_storage_path as string) ?? undefined,
    invoiceNumber: (row.invoice_number as string) ?? undefined,
    invoiceMetadata:
      row.invoice_metadata && typeof row.invoice_metadata === 'object'
        ? (row.invoice_metadata as Record<string, unknown>)
        : undefined,
    n1ValidatedByProfileId: (row.n1_validated_by_profile_id as string) ?? undefined,
    n1ValidatedAt: row.n1_validated_at as string | undefined,
    fleetValidatedByProfileId: (row.fleet_validated_by_profile_id as string) ?? undefined,
    fleetValidatedAt: row.fleet_validated_at as string | undefined,
    allocatedByProfileId: (row.allocated_by_profile_id as string) ?? undefined,
    rejectedByProfileId: (row.rejected_by_profile_id as string) ?? undefined,
    rejectedAt: row.rejected_at as string | undefined,
    releasedAt: row.released_at as string | undefined,
  };
}

/** Années déduites des plages year_from / year_to du catalogue pour une marque. */
export function distinctYearsFromCatalogModels(
  models: VehicleCatalogModel[],
  maxYear = new Date().getFullYear() + 1,
): number[] {
  const ys = new Set<number>();
  for (const m of models) {
    const from = m.yearFrom ?? 1985;
    const to = m.yearTo ?? maxYear;
    const hi = Math.min(to, maxYear);
    for (let y = from; y <= hi; y++) ys.add(y);
  }
  return [...ys].sort((a, b) => b - a);
}

export function filterCatalogModelsByYear(models: VehicleCatalogModel[], year: number | null): VehicleCatalogModel[] {
  if (year == null) return models;
  return models.filter((m) => {
    const from = m.yearFrom ?? 1900;
    const to = m.yearTo ?? 2100;
    return year >= from && year <= to;
  });
}

function planningTitleForRequest(req: VehicleRequest): string {
  if (req.routeOrigin || req.routeDestination) {
    return `Transport : ${req.routeOrigin ?? '…'} → ${req.routeDestination ?? '…'}`;
  }
  return req.transportMode === 'partner'
    ? 'Transport prestataire (parc auto)'
    : 'Véhicule interne (parc auto)';
}

async function applyVehicleRequestPlanningSync(req: VehicleRequest): Promise<void> {
  if (req.status === 'rejected' || req.status === 'returned') {
    await deleteVehicleRequestPlanningSlots(req.id);
    return;
  }
  await syncVehicleRequestPlanningSlot({
    requestId: req.id,
    requesterProfileId: req.requesterId,
    startAtIso: req.startAt,
    endAtIso: req.endAt,
    title: planningTitleForRequest(req),
  });
}

async function appendLogisticsAudit(params: {
  organizationId: string;
  subjectType: string;
  subjectId: string;
  eventType: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
    if (!profile) return;
    await supabase.from('logistics_audit_events').insert({
      organization_id: params.organizationId,
      subject_type: params.subjectType,
      subject_id: params.subjectId,
      actor_profile_id: profile.id,
      event_type: params.eventType,
      details: params.details ?? {},
    });
  } catch (e) {
    console.warn('parcAutoService.appendLogisticsAudit:', e);
  }
}

export async function listVehicleCatalogBrands(): Promise<VehicleCatalogBrand[]> {
  try {
    const { data, error } = await supabase
      .from('vehicle_catalog_brands')
      .select('id,name,sort_order')
      .order('sort_order', { ascending: true });
    const remote: VehicleCatalogBrand[] =
      error || !data
        ? []
        : data.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            name: r.name as string,
            sortOrder: Number(r.sort_order ?? 0),
          }));
    return mergeCatalogBrandsWithFallback(remote);
  } catch {
    return mergeCatalogBrandsWithFallback([]);
  }
}

export async function listVehicleCatalogModels(brandId: string): Promise<VehicleCatalogModel[]> {
  if (parseLocalBrandId(brandId)) {
    try {
      const rows = await listLocalCatalogModelsForBrand(brandId);
      return rows.map((r) => ({
        id: r.id,
        brandId: r.brandId,
        name: r.name,
        yearFrom: r.yearFrom,
        yearTo: r.yearTo,
      }));
    } catch {
      return [];
    }
  }
  try {
    const { data, error } = await supabase
      .from('vehicle_catalog_models')
      .select('id,brand_id,name,year_from,year_to')
      .eq('brand_id', brandId)
      .order('name');
    if (error || !data) return [];
    return data.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      brandId: r.brand_id as string,
      name: r.name as string,
      yearFrom: r.year_from != null ? Number(r.year_from) : null,
      yearTo: r.year_to != null ? Number(r.year_to) : null,
    }));
  } catch {
    return [];
  }
}

export async function createVehicleCatalogBrand(name: string, sortOrder = 0): Promise<VehicleCatalogBrand | null> {
  try {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const { data, error } = await supabase
      .from('vehicle_catalog_brands')
      .insert({ name: trimmed, sort_order: sortOrder })
      .select('id,name,sort_order')
      .single();
    if (error || !data) return null;
    const r = data as Record<string, unknown>;
    return {
      id: r.id as string,
      name: r.name as string,
      sortOrder: Number(r.sort_order ?? 0),
    };
  } catch (e) {
    console.error('parcAutoService.createVehicleCatalogBrand:', e);
    return null;
  }
}

export async function createVehicleCatalogModel(params: {
  brandId: string;
  name: string;
  yearFrom?: number | null;
  yearTo?: number | null;
}): Promise<VehicleCatalogModel | null> {
  try {
    const nm = params.name.trim();
    if (!nm) return null;
    const { data, error } = await supabase
      .from('vehicle_catalog_models')
      .insert({
        brand_id: params.brandId,
        name: nm,
        year_from: params.yearFrom ?? null,
        year_to: params.yearTo ?? null,
      })
      .select('id,brand_id,name,year_from,year_to')
      .single();
    if (error || !data) return null;
    const r = data as Record<string, unknown>;
    return {
      id: r.id as string,
      brandId: r.brand_id as string,
      name: r.name as string,
      yearFrom: r.year_from != null ? Number(r.year_from) : null,
      yearTo: r.year_to != null ? Number(r.year_to) : null,
    };
  } catch (e) {
    console.error('parcAutoService.createVehicleCatalogModel:', e);
    return null;
  }
}

export async function listOrgProjects(organizationId: string): Promise<OrgProjectRow[]> {
  try {
    type Row = { id: unknown; title?: unknown; programme_id?: unknown; name?: unknown };
    const mapRows = (rows: Row[]): OrgProjectRow[] =>
      rows.map((r) => ({
        id: String(r.id),
        title: (r.title != null ? String(r.title) : r.name != null ? String(r.name) : '') || '—',
        programmeId: (r.programme_id as string | null | undefined) ?? null,
      }));

    const attempts = [
      () =>
        supabase
          .from('projects')
          .select('id,title,programme_id')
          .eq('organization_id', organizationId)
          .order('title'),
      () =>
        supabase.from('projects').select('id,title').eq('organization_id', organizationId).order('title'),
      () =>
        supabase.from('projects').select('id,name,programme_id').eq('organization_id', organizationId).order('name'),
      () => supabase.from('projects').select('id,name').eq('organization_id', organizationId).order('name'),
      () =>
        supabase.from('projects').select('id,title,programme_id').eq('org_id', organizationId).order('title'),
      () => supabase.from('projects').select('id,title').eq('org_id', organizationId).order('title'),
      () =>
        supabase.from('projects').select('id,title,programme_id').eq('organization_id', organizationId),
      () => supabase.from('projects').select('id,title').eq('organization_id', organizationId),
      () =>
        supabase.from('projects').select('id,title,programme_id').eq('org_id', organizationId),
      () => supabase.from('projects').select('id,title').eq('org_id', organizationId),
    ];

    for (const build of attempts) {
      const { data, error } = await build();
      if (!error && data) return mapRows(data as Row[]);
    }
    return [];
  } catch {
    return [];
  }
}

export async function listProjectTasks(organizationId: string, projectId: string): Promise<TaskRow[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('id,title')
      .eq('organization_id', organizationId)
      .eq('project_id', projectId)
      .order('title');
    if (error || !data) return [];
    return data.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      title: (r.title as string) || '—',
    }));
  } catch {
    return [];
  }
}

/** Pour chaque salarié (profile_id), le manager N+1 (profiles.id) ou null. */
export async function getRequesterManagerMap(organizationId: string): Promise<Map<string, string | null>> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('profile_id,manager_id')
      .eq('organization_id', organizationId);
    if (error || !data) return new Map();
    return new Map(
      (data as { profile_id: string; manager_id: string | null }[]).map((r) => [r.profile_id, r.manager_id]),
    );
  } catch {
    return new Map();
  }
}

export async function listApproverProfileOptions(organizationId: string): Promise<ProfileOption[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,full_name,email')
      .eq('organization_id', organizationId)
      .order('full_name', { ascending: true })
      .limit(200);
    if (error || !data) return [];
    return data.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      fullName: (r.full_name as string) ?? null,
      email: (r.email as string) ?? null,
    }));
  } catch {
    return [];
  }
}

export async function listVehicles(organizationId?: string | null): Promise<Vehicle[]> {
  try {
    const orgId = organizationId || (await OrganizationService.getCurrentUserOrganizationId());
    if (!orgId) return [];
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('name');
    if (error) return [];
    return (data || []).map((row) => mapVehicle(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function createVehicle(params: {
  name: string;
  brand?: string;
  model?: string;
  plateNumber?: string;
  location?: string;
  vehicleCatalogModelId?: string;
  acquisitionKind?: 'new' | 'used';
  odometerAcquisition?: number;
  currentOdometer?: number;
  purchasePriceCents?: number;
  inServiceFrom?: string;
  usefulLifeMonths?: number;
  depreciationMethod?: string;
}): Promise<Vehicle | null> {
  try {
    const orgId = await OrganizationService.getCurrentUserOrganizationId();
    if (!orgId) return null;
    const row: Record<string, unknown> = {
      organization_id: orgId,
      name: params.name.trim(),
      brand: params.brand?.trim() || null,
      model: params.model?.trim() || null,
      plate_number: params.plateNumber?.trim() || null,
      location: params.location?.trim() || null,
      updated_at: new Date().toISOString(),
    };
    if (params.vehicleCatalogModelId) row.vehicle_catalog_model_id = params.vehicleCatalogModelId;
    if (params.acquisitionKind) row.acquisition_kind = params.acquisitionKind;
    if (params.odometerAcquisition != null) row.odometer_acquisition = params.odometerAcquisition;
    if (params.currentOdometer != null) row.current_odometer = params.currentOdometer;
    if (params.purchasePriceCents != null) row.purchase_price_cents = params.purchasePriceCents;
    if (params.inServiceFrom) row.in_service_from = params.inServiceFrom;
    if (params.usefulLifeMonths != null) row.useful_life_months = params.usefulLifeMonths;
    if (params.depreciationMethod) row.depreciation_method = params.depreciationMethod.trim();

    const { data, error } = await supabase.from('vehicles').insert(row).select().single();
    if (error) throw error;
    return mapVehicle(data as Record<string, unknown>);
  } catch (e) {
    console.error('parcAutoService.createVehicle:', e);
    return null;
  }
}

export async function listVehicleRequests(organizationId?: string | null): Promise<VehicleRequest[]> {
  try {
    const orgId = organizationId || (await OrganizationService.getCurrentUserOrganizationId());
    if (!orgId) return [];
    const { data, error } = await supabase
      .from('vehicle_requests')
      .select('*')
      .eq('organization_id', orgId)
      .order('requested_at', { ascending: false });
    if (error || !data) return [];
    const rows = data as Record<string, unknown>[];
    const programmeIds = [...new Set(rows.map((r) => r.programme_id).filter(Boolean))] as string[];
    const projectIds = [...new Set(rows.map((r) => r.project_id).filter(Boolean))] as string[];
    const taskIds = [...new Set(rows.map((r) => r.task_id).filter(Boolean))] as string[];

    const [programmesRes, projectsRes, tasksRes] = await Promise.all([
      programmeIds.length
        ? supabase.from('programmes').select('id,name').in('id', programmeIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      projectIds.length
        ? supabase.from('projects').select('id,title').in('id', projectIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      taskIds.length
        ? supabase.from('tasks').select('id,title').in('id', taskIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    ]);

    const progMap = new Map((programmesRes.data || []).map((p: { id: string; name: string }) => [p.id, p.name]));
    const projMap = new Map((projectsRes.data || []).map((p: { id: string; title: string }) => [p.id, p.title]));
    const taskMap = new Map((tasksRes.data || []).map((t: { id: string; title: string }) => [t.id, t.title]));

    const pvIds = [...new Set(rows.map((r) => r.partner_vehicle_id).filter(Boolean))] as string[];
    let pvLabel = new Map<string, string>();
    let pvCompany = new Map<string, string>();
    let pcName = new Map<string, string>();
    if (pvIds.length) {
      const { data: pvs } = await supabase
        .from('transport_partner_vehicles')
        .select('id,label,partner_company_id')
        .in('id', pvIds);
      for (const pv of pvs || []) {
        const row = pv as { id: string; label: string; partner_company_id: string };
        pvLabel.set(row.id, row.label);
        pvCompany.set(row.id, row.partner_company_id);
      }
      const pcIds = [...new Set([...pvCompany.values()].filter(Boolean))];
      if (pcIds.length) {
        const { data: pcs } = await supabase.from('transport_partner_companies').select('id,name').in('id', pcIds);
        for (const pc of pcs || []) {
          const row = pc as { id: string; name: string };
          pcName.set(row.id, row.name);
        }
      }
    }

    return rows.map((r) => {
      const base = mapRequest(r);
      if (base.programmeId) base.programmeName = progMap.get(base.programmeId);
      if (base.projectId) base.projectTitle = projMap.get(base.projectId);
      if (base.taskId) base.taskTitle = taskMap.get(base.taskId);
      if (base.partnerVehicleId) {
        base.partnerVehicleLabel = pvLabel.get(base.partnerVehicleId);
        const cid = pvCompany.get(base.partnerVehicleId);
        if (cid) base.partnerCompanyName = pcName.get(cid);
      }
      return base;
    });
  } catch {
    return [];
  }
}

export async function createVehicleRequest(params: {
  transportMode?: TransportMode;
  vehicleId?: string | null;
  partnerVehicleId?: string | null;
  notes?: string;
  programmeId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  missionJustification: string;
  designatedApproverProfileId?: string | null;
  routeOrigin?: string | null;
  routeDestination?: string | null;
  routeWaypoints?: unknown[] | null;
  missionOrderStoragePath?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  quotedPriceCents?: number | null;
  priceBreakdown?: Record<string, unknown> | null;
  paymentStatus?: VehiclePaymentStatus;
}): Promise<VehicleRequest | null> {
  try {
    const orgId = await OrganizationService.getCurrentUserOrganizationId();
    if (!orgId) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
    if (!profile) return null;

    const mode: TransportMode = params.transportMode ?? 'internal';
    const row: Record<string, unknown> = {
      organization_id: orgId,
      requester_id: profile.id,
      status: 'pending_n1',
      transport_mode: mode,
      notes: params.notes || null,
      programme_id: params.programmeId || null,
      project_id: params.projectId || null,
      task_id: params.taskId || null,
      mission_justification: params.missionJustification.trim(),
      designated_approver_profile_id: params.designatedApproverProfileId || null,
      updated_at: new Date().toISOString(),
      route_origin: params.routeOrigin?.trim() || null,
      route_destination: params.routeDestination?.trim() || null,
      route_waypoints: params.routeWaypoints ?? [],
      mission_order_storage_path: params.missionOrderStoragePath || null,
      start_at: params.startAt || null,
      end_at: params.endAt || null,
      quoted_price_cents: params.quotedPriceCents ?? null,
      price_breakdown: params.priceBreakdown ?? {},
      payment_status: params.paymentStatus ?? 'not_invoiced',
    };

    if (mode === 'internal') {
      row.vehicle_id = params.vehicleId ?? null;
      row.partner_vehicle_id = null;
    } else {
      row.vehicle_id = null;
      row.partner_vehicle_id = params.partnerVehicleId ?? null;
    }

    const { data, error } = await supabase.from('vehicle_requests').insert(row).select().single();
    if (error) throw error;
    const mapped = mapRequest(data as Record<string, unknown>);
    await appendLogisticsAudit({
      organizationId: orgId,
      subjectType: 'vehicle_request',
      subjectId: mapped.id,
      eventType: 'created',
      details: {
        status: mapped.status,
        transport_mode: mode,
        vehicle_id: mapped.vehicleId,
        partner_vehicle_id: mapped.partnerVehicleId,
      },
    });
    await applyVehicleRequestPlanningSync(mapped);
    return mapped;
  } catch (e) {
    console.error('parcAutoService.createVehicleRequest:', e);
    return null;
  }
}

export async function updateVehicleRequestStatus(
  id: string,
  status: VehicleRequestStatus,
  organizationIdHint?: string,
): Promise<boolean> {
  try {
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'validated') updates.validated_at = new Date().toISOString();
    if (status === 'allocated') updates.allocated_at = new Date().toISOString();
    if (status === 'returned') updates.return_at = new Date().toISOString();

    const { data: before } = await supabase.from('vehicle_requests').select('organization_id,status').eq('id', id).maybeSingle();

    const { error } = await supabase.from('vehicle_requests').update(updates).eq('id', id);
    if (error) {
      console.error('parcAutoService.updateVehicleRequestStatus:', error);
      return false;
    }
    const orgId =
      organizationIdHint ||
      ((before as { organization_id?: string } | null)?.organization_id ?? null);
    if (orgId) {
      await appendLogisticsAudit({
        organizationId: orgId,
        subjectType: 'vehicle_request',
        subjectId: id,
        eventType: 'status_change',
        details: {
          from: (before as { status?: string } | null)?.status,
          to: status,
        },
      });
    }

    const { data: afterRow } = await supabase.from('vehicle_requests').select('*').eq('id', id).maybeSingle();
    if (afterRow) {
      await applyVehicleRequestPlanningSync(mapRequest(afterRow as Record<string, unknown>));
    }

    return true;
  } catch (e) {
    console.error('parcAutoService.updateVehicleRequestStatus:', e);
    return false;
  }
}

export async function saveVehicleHandover(params: {
  vehicleRequestId: string;
  organizationId: string;
  phase: 'checkout' | 'checkin';
  payload: HandoverPayload;
}): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
    if (!profile) return false;

    const row = {
      organization_id: params.organizationId,
      vehicle_request_id: params.vehicleRequestId,
      phase: params.phase,
      odometer: params.payload.odometer,
      fuel_level_percent: params.payload.fuelLevelPercent,
      condition_notes: params.payload.conditionNotes,
      maintenance_flag: params.payload.maintenanceFlag,
      recorded_by_profile_id: profile.id,
      recorded_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('vehicle_handover_reports').upsert(row, {
      onConflict: 'vehicle_request_id,phase',
    });
    if (error) {
      console.error('parcAutoService.saveVehicleHandover:', error);
      return false;
    }
    await appendLogisticsAudit({
      organizationId: params.organizationId,
      subjectType: 'vehicle_handover',
      subjectId: params.vehicleRequestId,
      eventType: `handover_${params.phase}`,
      details: params.payload as unknown as Record<string, unknown>,
    });
    return true;
  } catch (e) {
    console.error('parcAutoService.saveVehicleHandover:', e);
    return false;
  }
}

export async function listTransportPartnerCompanies(organizationId?: string | null): Promise<TransportPartnerCompany[]> {
  try {
    const orgId = organizationId || (await OrganizationService.getCurrentUserOrganizationId());
    if (!orgId) return [];
    const { data, error } = await supabase
      .from('transport_partner_companies')
      .select('*')
      .eq('organization_id', orgId)
      .order('name');
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      organizationId: r.organization_id as string,
      name: r.name as string,
      contactEmail: (r.contact_email as string) ?? null,
      phone: (r.phone as string) ?? null,
      notes: (r.notes as string) ?? null,
      active: r.active !== false,
    }));
  } catch {
    return [];
  }
}

export async function createTransportPartnerCompany(params: {
  name: string;
  contactEmail?: string;
  phone?: string;
  notes?: string;
}): Promise<TransportPartnerCompany | null> {
  try {
    const orgId = await OrganizationService.getCurrentUserOrganizationId();
    if (!orgId) return null;
    const { data, error } = await supabase
      .from('transport_partner_companies')
      .insert({
        organization_id: orgId,
        name: params.name.trim(),
        contact_email: params.contactEmail?.trim() || null,
        phone: params.phone?.trim() || null,
        notes: params.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error || !data) return null;
    const r = data as Record<string, unknown>;
    return {
      id: r.id as string,
      organizationId: r.organization_id as string,
      name: r.name as string,
      contactEmail: (r.contact_email as string) ?? null,
      phone: (r.phone as string) ?? null,
      notes: (r.notes as string) ?? null,
      active: r.active !== false,
    };
  } catch (e) {
    console.error('parcAutoService.createTransportPartnerCompany:', e);
    return null;
  }
}

export async function listTransportPartnerVehicles(
  organizationId?: string | null,
  partnerCompanyId?: string | null,
): Promise<TransportPartnerVehicle[]> {
  try {
    const orgId = organizationId || (await OrganizationService.getCurrentUserOrganizationId());
    if (!orgId) return [];
    let q = supabase
      .from('transport_partner_vehicles')
      .select('*')
      .eq('organization_id', orgId)
      .eq('active', true)
      .order('label');
    if (partnerCompanyId) q = q.eq('partner_company_id', partnerCompanyId);
    const { data, error } = await q;
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      organizationId: r.organization_id as string,
      partnerCompanyId: r.partner_company_id as string,
      label: r.label as string,
      plateNumber: (r.plate_number as string) ?? null,
      seats: r.seats != null ? Number(r.seats) : null,
      notes: (r.notes as string) ?? null,
      active: r.active !== false,
    }));
  } catch {
    return [];
  }
}

export async function createTransportPartnerVehicle(params: {
  partnerCompanyId: string;
  label: string;
  plateNumber?: string;
  seats?: number;
  notes?: string;
}): Promise<TransportPartnerVehicle | null> {
  try {
    const orgId = await OrganizationService.getCurrentUserOrganizationId();
    if (!orgId) return null;
    const { data, error } = await supabase
      .from('transport_partner_vehicles')
      .insert({
        organization_id: orgId,
        partner_company_id: params.partnerCompanyId,
        label: params.label.trim(),
        plate_number: params.plateNumber?.trim() || null,
        seats: params.seats ?? null,
        notes: params.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error || !data) return null;
    const r = data as Record<string, unknown>;
    return {
      id: r.id as string,
      organizationId: r.organization_id as string,
      partnerCompanyId: r.partner_company_id as string,
      label: r.label as string,
      plateNumber: (r.plate_number as string) ?? null,
      seats: r.seats != null ? Number(r.seats) : null,
      notes: (r.notes as string) ?? null,
      active: r.active !== false,
    };
  } catch (e) {
    console.error('parcAutoService.createTransportPartnerVehicle:', e);
    return null;
  }
}

export async function uploadFleetPrivateObject(params: {
  organizationId: string;
  relativePath: string;
  file: Blob;
  contentType?: string;
}): Promise<string | null> {
  try {
    const path = `${params.organizationId}/${params.relativePath.replace(/^\/+/, '')}`;
    const { error } = await supabase.storage.from(FLEET_STORAGE_BUCKET).upload(path, params.file, {
      cacheControl: '3600',
      upsert: true,
      contentType: params.contentType,
    });
    if (error) {
      console.error('parcAutoService.uploadFleetPrivateObject:', error);
      return null;
    }
    return path;
  } catch (e) {
    console.error('parcAutoService.uploadFleetPrivateObject:', e);
    return null;
  }
}

export async function listVehiclePhotos(vehicleId: string): Promise<VehiclePhotoRow[]> {
  try {
    const { data, error } = await supabase
      .from('vehicle_photos')
      .select('id,vehicle_id,slot,storage_path,uploaded_at')
      .eq('vehicle_id', vehicleId)
      .order('slot');
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      vehicleId: r.vehicle_id as string,
      slot: r.slot as VehiclePhotoSlot,
      storagePath: r.storage_path as string,
      uploadedAt: r.uploaded_at as string,
    }));
  } catch {
    return [];
  }
}

export async function upsertVehiclePhoto(params: {
  organizationId: string;
  vehicleId: string;
  slot: VehiclePhotoSlot;
  file: Blob;
  contentType?: string;
}): Promise<VehiclePhotoRow | null> {
  try {
    const ext =
      params.contentType?.includes('png') ? 'png' : params.contentType?.includes('webp') ? 'webp' : 'jpg';
    const rnd =
      typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const rel = `vehicles/${params.vehicleId}/${params.slot}-${rnd}.${ext}`;
    const storagePath = await uploadFleetPrivateObject({
      organizationId: params.organizationId,
      relativePath: rel,
      file: params.file,
      contentType: params.contentType,
    });
    if (!storagePath) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
    if (!profile) return null;

    const { data, error } = await supabase
      .from('vehicle_photos')
      .upsert(
        {
          organization_id: params.organizationId,
          vehicle_id: params.vehicleId,
          slot: params.slot,
          storage_path: storagePath,
          uploaded_by_profile_id: profile.id,
          uploaded_at: new Date().toISOString(),
        },
        { onConflict: 'vehicle_id,slot' },
      )
      .select('id,vehicle_id,slot,storage_path,uploaded_at')
      .single();

    if (error || !data) {
      console.error('parcAutoService.upsertVehiclePhoto:', error);
      return null;
    }
    const r = data as Record<string, unknown>;
    return {
      id: r.id as string,
      vehicleId: r.vehicle_id as string,
      slot: r.slot as VehiclePhotoSlot,
      storagePath: r.storage_path as string,
      uploadedAt: r.uploaded_at as string,
    };
  } catch (e) {
    console.error('parcAutoService.upsertVehiclePhoto:', e);
    return null;
  }
}

export async function deleteVehiclePhoto(photoId: string): Promise<boolean> {
  try {
    const { data: row } = await supabase.from('vehicle_photos').select('storage_path').eq('id', photoId).maybeSingle();
    const path = (row as { storage_path?: string } | null)?.storage_path;
    const { error } = await supabase.from('vehicle_photos').delete().eq('id', photoId);
    if (error) return false;
    if (path) await supabase.storage.from(FLEET_STORAGE_BUCKET).remove([path]);
    return true;
  } catch {
    return false;
  }
}

export async function createSignedFleetUrl(storagePath: string, expiresIn = 3600): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from(FLEET_STORAGE_BUCKET).createSignedUrl(storagePath, expiresIn);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

export async function listVehicleRequestTransitions(requestId: string): Promise<VehicleRequestTransition[]> {
  try {
    const { data, error } = await supabase
      .from('vehicle_request_status_transitions')
      .select('id,vehicle_request_id,from_status,to_status,actor_profile_id,meta,created_at')
      .eq('vehicle_request_id', requestId)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      vehicleRequestId: r.vehicle_request_id as string,
      fromStatus: (r.from_status as string) ?? null,
      toStatus: r.to_status as string,
      actorProfileId: (r.actor_profile_id as string) ?? null,
      meta: (r.meta as Record<string, unknown>) ?? {},
      createdAt: r.created_at as string,
    }));
  } catch {
    return [];
  }
}

export async function patchVehicleRequestFleetFields(
  id: string,
  patch: Partial<{
    quotedPriceCents: number | null;
    priceBreakdown: Record<string, unknown>;
    paymentStatus: VehiclePaymentStatus;
    invoiceStoragePath: string | null;
    invoiceNumber: string | null;
    invoiceMetadata: Record<string, unknown>;
    missionOrderStoragePath: string | null;
    startAt: string | null;
    endAt: string | null;
    routeOrigin: string | null;
    routeDestination: string | null;
  }>,
): Promise<boolean> {
  try {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.quotedPriceCents !== undefined) row.quoted_price_cents = patch.quotedPriceCents;
    if (patch.priceBreakdown !== undefined) row.price_breakdown = patch.priceBreakdown;
    if (patch.paymentStatus !== undefined) row.payment_status = patch.paymentStatus;
    if (patch.invoiceStoragePath !== undefined) row.invoice_storage_path = patch.invoiceStoragePath;
    if (patch.invoiceNumber !== undefined) row.invoice_number = patch.invoiceNumber;
    if (patch.invoiceMetadata !== undefined) row.invoice_metadata = patch.invoiceMetadata;
    if (patch.missionOrderStoragePath !== undefined) row.mission_order_storage_path = patch.missionOrderStoragePath;
    if (patch.startAt !== undefined) row.start_at = patch.startAt;
    if (patch.endAt !== undefined) row.end_at = patch.endAt;
    if (patch.routeOrigin !== undefined) row.route_origin = patch.routeOrigin;
    if (patch.routeDestination !== undefined) row.route_destination = patch.routeDestination;

    const { error } = await supabase.from('vehicle_requests').update(row).eq('id', id);
    if (error) {
      console.error('parcAutoService.patchVehicleRequestFleetFields:', error);
      return false;
    }
    const { data: afterRow } = await supabase.from('vehicle_requests').select('*').eq('id', id).maybeSingle();
    if (afterRow) await applyVehicleRequestPlanningSync(mapRequest(afterRow as Record<string, unknown>));
    return true;
  } catch (e) {
    console.error('parcAutoService.patchVehicleRequestFleetFields:', e);
    return false;
  }
}

export async function listVehicleHandoverReports(requestId: string): Promise<VehicleHandoverReport[]> {
  try {
    const { data, error } = await supabase
      .from('vehicle_handover_reports')
      .select('*')
      .eq('vehicle_request_id', requestId)
      .order('recorded_at', { ascending: true });
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      vehicleRequestId: r.vehicle_request_id as string,
      phase: r.phase as 'checkout' | 'checkin',
      odometer: r.odometer != null ? Number(r.odometer) : null,
      fuelLevelPercent: r.fuel_level_percent != null ? Number(r.fuel_level_percent) : null,
      conditionNotes: (r.condition_notes as string) ?? null,
      maintenanceFlag: r.maintenance_flag === true,
      recordedByProfileId: r.recorded_by_profile_id as string,
      recordedAt: r.recorded_at as string,
    }));
  } catch {
    return [];
  }
}

async function listLogisticsAuditForRequest(organizationId: string, requestId: string): Promise<LogisticsAuditEvent[]> {
  try {
    const [a, b] = await Promise.all([
      supabase
        .from('logistics_audit_events')
        .select('id,organization_id,subject_type,subject_id,actor_profile_id,event_type,details,created_at')
        .eq('organization_id', organizationId)
        .eq('subject_type', 'vehicle_request')
        .eq('subject_id', requestId)
        .order('created_at', { ascending: true }),
      supabase
        .from('logistics_audit_events')
        .select('id,organization_id,subject_type,subject_id,actor_profile_id,event_type,details,created_at')
        .eq('organization_id', organizationId)
        .eq('subject_type', 'vehicle_handover')
        .eq('subject_id', requestId)
        .order('created_at', { ascending: true }),
    ]);
    const rows = [...(a.data || []), ...(b.data || [])] as Record<string, unknown>[];
    rows.sort((x, y) => String(x.created_at).localeCompare(String(y.created_at)));
    return rows.map((r) => ({
      id: r.id as string,
      organizationId: r.organization_id as string,
      subjectType: r.subject_type as string,
      subjectId: r.subject_id as string,
      actorProfileId: (r.actor_profile_id as string) ?? null,
      eventType: r.event_type as string,
      details: (r.details as Record<string, unknown>) ?? {},
      createdAt: r.created_at as string,
    }));
  } catch {
    return [];
  }
}

async function fetchProfilesByIds(ids: string[]): Promise<Map<string, ProfileOption>> {
  const uniq = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, ProfileOption>();
  if (!uniq.length) return map;
  try {
    const { data, error } = await supabase.from('profiles').select('id,full_name,email').in('id', uniq);
    if (error || !data) return map;
    for (const r of data as Record<string, unknown>[]) {
      map.set(r.id as string, {
        id: r.id as string,
        fullName: (r.full_name as string) ?? null,
        email: (r.email as string) ?? null,
      });
    }
  } catch {
    /* ignore */
  }
  return map;
}

/**
 * Charge une demande véhicule et les données liées (transitions, constats, audit, véhicule, photos, partenaire).
 */
export async function fetchVehicleRequestDetailBundle(requestId: string): Promise<VehicleRequestDetailBundle | null> {
  try {
    const { data: row, error } = await supabase.from('vehicle_requests').select('*').eq('id', requestId).maybeSingle();
    if (error || !row) return null;
    const base = mapRequest(row as Record<string, unknown>);
    const orgId = base.organizationId;

    const [transitions, handovers, auditEvents, vehicleRes, pvRes] = await Promise.all([
      listVehicleRequestTransitions(requestId),
      listVehicleHandoverReports(requestId),
      listLogisticsAuditForRequest(orgId, requestId),
      base.vehicleId
        ? supabase.from('vehicles').select('*').eq('id', base.vehicleId).maybeSingle()
        : Promise.resolve({ data: null as Record<string, unknown> | null }),
      base.partnerVehicleId
        ? supabase.from('transport_partner_vehicles').select('*').eq('id', base.partnerVehicleId).maybeSingle()
        : Promise.resolve({ data: null as Record<string, unknown> | null }),
    ]);

    let vehicle: Vehicle | null = null;
    if (vehicleRes.data) vehicle = mapVehicle(vehicleRes.data as Record<string, unknown>);

    let partnerVehicle: TransportPartnerVehicle | null = null;
    let partnerCompany: TransportPartnerCompany | null = null;
    if (pvRes.data) {
      const pvr = pvRes.data as Record<string, unknown>;
      partnerVehicle = {
        id: pvr.id as string,
        organizationId: pvr.organization_id as string,
        partnerCompanyId: pvr.partner_company_id as string,
        label: pvr.label as string,
        plateNumber: (pvr.plate_number as string) ?? null,
        seats: pvr.seats != null ? Number(pvr.seats) : null,
        notes: (pvr.notes as string) ?? null,
        active: pvr.active !== false,
      };
      const { data: pc } = await supabase
        .from('transport_partner_companies')
        .select('*')
        .eq('id', partnerVehicle.partnerCompanyId)
        .maybeSingle();
      if (pc) {
        const pcr = pc as Record<string, unknown>;
        partnerCompany = {
          id: pcr.id as string,
          organizationId: pcr.organization_id as string,
          name: pcr.name as string,
          contactEmail: (pcr.contact_email as string) ?? null,
          phone: (pcr.phone as string) ?? null,
          notes: (pcr.notes as string) ?? null,
          active: pcr.active !== false,
        };
      }
    }

    const programmeIds = base.programmeId ? [base.programmeId] : [];
    const projectIds = base.projectId ? [base.projectId] : [];
    const taskIds = base.taskId ? [base.taskId] : [];

    const [programmesRes, projectsRes, tasksRes] = await Promise.all([
      programmeIds.length
        ? supabase.from('programmes').select('id,name').in('id', programmeIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      projectIds.length
        ? supabase.from('projects').select('id,title').in('id', projectIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      taskIds.length
        ? supabase.from('tasks').select('id,title').in('id', taskIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    ]);

    const progMap = new Map((programmesRes.data || []).map((p: { id: string; name: string }) => [p.id, p.name]));
    const projMap = new Map((projectsRes.data || []).map((p: { id: string; title: string }) => [p.id, p.title]));
    const taskMap = new Map((tasksRes.data || []).map((t: { id: string; title: string }) => [t.id, t.title]));

    if (base.programmeId) base.programmeName = progMap.get(base.programmeId);
    if (base.projectId) base.projectTitle = projMap.get(base.projectId);
    if (base.taskId) base.taskTitle = taskMap.get(base.taskId);
    if (base.partnerVehicleId && partnerVehicle) {
      base.partnerVehicleLabel = partnerVehicle.label;
      if (partnerCompany) base.partnerCompanyName = partnerCompany.name;
    }

    const photos = base.vehicleId ? await listVehiclePhotos(base.vehicleId) : [];

    const profileIds: string[] = [
      base.requesterId,
      base.designatedApproverProfileId,
      base.n1ValidatedByProfileId,
      base.fleetValidatedByProfileId,
      base.allocatedByProfileId,
      base.rejectedByProfileId,
      ...transitions.map((t) => t.actorProfileId).filter(Boolean) as string[],
      ...handovers.map((h) => h.recordedByProfileId),
      ...auditEvents.map((e) => e.actorProfileId).filter(Boolean) as string[],
    ];
    const profilesById = await fetchProfilesByIds(profileIds);

    return {
      request: base,
      transitions,
      handovers,
      auditEvents,
      vehicle,
      partnerVehicle,
      partnerCompany,
      photos,
      profilesById,
    };
  } catch (e) {
    console.error('parcAutoService.fetchVehicleRequestDetailBundle:', e);
    return null;
  }
}
