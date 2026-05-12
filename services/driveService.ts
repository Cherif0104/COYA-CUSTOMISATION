import { supabase } from './supabaseService';
import { handleOptionalTableError, isTableUnavailable } from './optionalTableGuard';
import {
  absorbDriveItemsMissingColumnError,
  driveItemsHasCategoryColumn,
  driveItemsHasDocumentStatusColumn,
  driveItemsHasWorkspaceIdColumn,
  getDriveGdsSchemaFlags,
  isMissingColumnError,
  pruneDriveInsertRowForKnownSchema,
  stripDriveInsertRowFromError,
} from './driveSchemaRuntime';

export { getDriveGdsSchemaFlags };

export type DriveItemType = 'folder' | 'file' | 'doc';

export type DriveDocumentStatus =
  | 'draft'
  | 'in_review'
  | 'pending_validation'
  | 'approved'
  | 'archived'
  | 'scheduled_destruction';

export type DriveItem = {
  id: string;
  organization_id: string;
  parent_id: string | null;
  workspace_id?: string | null;
  item_type: DriveItemType;
  name: string;
  description?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  storage_bucket?: string | null;
  storage_path?: string | null;
  owner_profile_id?: string | null;
  created_by_id?: string | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
  trashed_at?: string | null;
  visibility?: 'private' | 'org_public';
  confidentiality_level?: number | null;
  document_status?: DriveDocumentStatus | string | null;
  expires_at?: string | null;
  category?: string | null;
  tags?: string[] | null;
  linked_programme_id?: string | null;
  linked_project_id?: string | null;
};

export type DriveWorkspace = {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  workspace_type: 'department' | 'program' | 'project' | 'custom';
  department_id?: string | null;
  programme_id?: string | null;
  project_id?: string | null;
  root_folder_id?: string | null;
  created_at: string;
  updated_at: string;
};

const DRIVE_BUCKET = 'drive-files';
const DRIVE_TABLE = 'drive_items';
const DRIVE_ACCESS_TABLE = 'drive_access_requests';
const DRIVE_WORKSPACES_TABLE = 'drive_workspaces';
const DRIVE_FAVORITES_TABLE = 'drive_item_favorites';
const DRIVE_AUDIT_TABLE = 'drive_audit_events';

/** Limite alignée Supabase bucket `drive-files` : 100 MiB (100 × 1024² octets). */
export const DRIVE_MAX_FILE_BYTES = 100 * 1024 * 1024;

export type DriveAccessRequestStatus = 'pending' | 'approved' | 'rejected';

export type DriveAccessRequestRow = {
  id: string;
  organization_id: string;
  drive_item_id: string;
  requester_profile_id: string;
  permission_requested: 'viewer' | 'editor';
  message: string | null;
  request_reason?: string | null;
  requested_duration_days?: number | null;
  urgency?: 'low' | 'normal' | 'high' | null;
  justification?: string | null;
  reviewed_decision?: 'approve' | 'reject' | 'temporary' | null;
  grant_expires_at?: string | null;
  status: DriveAccessRequestStatus;
  reviewed_by_profile_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DriveAclRow = {
  profile_id: string;
  permission: string;
  can_view?: boolean;
  can_edit?: boolean;
  can_download?: boolean;
  can_share?: boolean;
  can_delete?: boolean;
};

export class DriveService {
  /** Garantit un access_token sur le client REST (évite 403 RLS si la session n'est pas encore propagée). */
  private static async requireRestSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { error };
    if (!data.session?.access_token) {
      return { error: new Error('Session indisponible ou expirée. Reconnectez-vous pour utiliser COYA Drive.') };
    }
    return { error: null as null };
  }

  static async getProfileContext() {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) return { data: null as any, error: new Error('Non authentifié') };

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, organization_id, role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !profile?.organization_id) {
      return { data: null, error: error ?? new Error('Profil/organisation introuvable') };
    }

    return { data: { user: userRes.user, profile }, error: null };
  }

  static async listWorkspaces() {
    if (isTableUnavailable(DRIVE_WORKSPACES_TABLE)) return { data: [] as DriveWorkspace[], error: null };
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: [] as DriveWorkspace[], error: ctx.error };
    const { profile } = ctx.data;
    const { data, error } = await supabase
      .from('drive_workspaces')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('name', { ascending: true });
    if (error && handleOptionalTableError(error, DRIVE_WORKSPACES_TABLE, 'DriveService.listWorkspaces')) {
      return { data: [] as DriveWorkspace[], error: null };
    }
    return { data: (data as DriveWorkspace[]) ?? [], error };
  }

  /**
   * @param workspaceScope `personal` = uniquement hors espace documentaire (`workspace_id` NULL).
   *                       Sinon UUID d’un `drive_workspaces.id` pour filtrer cet espace.
   */
  static async list(parentId: string | null, workspaceScope: 'personal' | string = 'personal') {
    if (isTableUnavailable(DRIVE_TABLE)) return { data: [] as DriveItem[], error: null };
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: [] as DriveItem[], error: ctx.error };
    const { profile } = ctx.data;

    if (!driveItemsHasWorkspaceIdColumn && workspaceScope !== 'personal') {
      return { data: [] as DriveItem[], error: null };
    }

    const build = (withWorkspaceFilter: boolean) => {
      let query = supabase
        .from('drive_items')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .is('trashed_at', null)
        .order('item_type', { ascending: true })
        .order('name', { ascending: true });
      if (withWorkspaceFilter && driveItemsHasWorkspaceIdColumn) {
        if (workspaceScope === 'personal') query = query.is('workspace_id', null);
        else query = query.eq('workspace_id', workspaceScope);
      }
      return parentId === null ? query.is('parent_id', null) : query.eq('parent_id', parentId);
    };

    let { data, error } = await build(true);
    if (error && isMissingColumnError(error, 'workspace_id')) {
      absorbDriveItemsMissingColumnError(error, 'DriveService.list');
      ({ data, error } = await build(false));
    }

    if (error && handleOptionalTableError(error, DRIVE_TABLE, 'DriveService.list')) {
      return { data: [] as DriveItem[], error: null };
    }
    return { data: (data as DriveItem[]) ?? [], error };
  }

  /** Dossiers où vous avez une entrée ACL sans être propriétaire (vue « Partagés »). */
  static async listSharedFolderRoots(limit = 80) {
    if (isTableUnavailable(DRIVE_TABLE)) return { data: [] as DriveItem[], error: null };
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: [] as DriveItem[], error: ctx.error };
    const { profile } = ctx.data;

    const { data: aclRows, error: aclErr } = await supabase
      .from('drive_item_acl')
      .select('drive_item_id')
      .eq('profile_id', profile.id);
    if (aclErr) return { data: [] as DriveItem[], error: aclErr };
    const folderIds = [...new Set((aclRows ?? []).map((r: { drive_item_id: string }) => r.drive_item_id))];
    if (!folderIds.length) return { data: [] as DriveItem[], error: null };

    const { data, error } = await supabase
      .from('drive_items')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .eq('item_type', 'folder')
      .is('trashed_at', null)
      .in('id', folderIds)
      .neq('owner_profile_id', profile.id)
      .order('name', { ascending: true })
      .limit(limit);

    if (error && handleOptionalTableError(error, DRIVE_TABLE, 'DriveService.listSharedFolderRoots')) {
      return { data: [] as DriveItem[], error: null };
    }
    return { data: (data as DriveItem[]) ?? [], error };
  }

  static async listFavoriteItemIds() {
    if (isTableUnavailable(DRIVE_FAVORITES_TABLE)) return { data: new Set<string>(), error: null };
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: new Set<string>(), error: ctx.error };
    const { profile } = ctx.data;
    const { data, error } = await supabase.from('drive_item_favorites').select('drive_item_id').eq('profile_id', profile.id);
    if (error && handleOptionalTableError(error, DRIVE_FAVORITES_TABLE, 'DriveService.listFavoriteItemIds')) {
      return { data: new Set<string>(), error: null };
    }
    const s = new Set<string>();
    for (const r of (data as { drive_item_id: string }[]) ?? []) s.add(r.drive_item_id);
    return { data: s, error: null };
  }

  static async listFavoriteItems(limit = 120) {
    if (isTableUnavailable(DRIVE_FAVORITES_TABLE)) return { data: [] as DriveItem[], error: null };
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: [] as DriveItem[], error: ctx.error };
    const { profile } = ctx.data;

    const { data: favs, error: fe } = await supabase
      .from('drive_item_favorites')
      .select('drive_item_id')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (fe && handleOptionalTableError(fe, DRIVE_FAVORITES_TABLE, 'DriveService.listFavoriteItems')) {
      return { data: [] as DriveItem[], error: null };
    }
    const ids = [...new Set((favs ?? []).map((r: { drive_item_id: string }) => r.drive_item_id))];
    if (!ids.length) return { data: [] as DriveItem[], error: null };

    const { data, error } = await supabase
      .from('drive_items')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .is('trashed_at', null)
      .in('id', ids);

    if (error && handleOptionalTableError(error, DRIVE_TABLE, 'DriveService.listFavoriteItems')) {
      return { data: [] as DriveItem[], error: null };
    }
    const byId = new Map((data as DriveItem[]).map((i) => [i.id, i]));
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as DriveItem[];
    return { data: ordered, error };
  }

  static async isFavorite(itemId: string) {
    if (isTableUnavailable(DRIVE_FAVORITES_TABLE)) return { data: false, error: null };
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: false, error: ctx.error };
    const { profile } = ctx.data;
    const { data, error } = await supabase
      .from('drive_item_favorites')
      .select('drive_item_id')
      .eq('profile_id', profile.id)
      .eq('drive_item_id', itemId)
      .maybeSingle();
    if (error && handleOptionalTableError(error, DRIVE_FAVORITES_TABLE, 'DriveService.isFavorite')) {
      return { data: false, error: null };
    }
    return { data: !!data, error: null };
  }

  static async setFavorite(itemId: string, on: boolean) {
    if (isTableUnavailable(DRIVE_FAVORITES_TABLE)) return { error: new Error('Favoris : migration non appliquée.') };
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { error: ctx.error };
    const { profile } = ctx.data;
    if (on) {
      const { error } = await supabase.from('drive_item_favorites').upsert(
        { profile_id: profile.id, drive_item_id: itemId },
        { onConflict: 'profile_id,drive_item_id' },
      );
      return { error };
    }
    const { error } = await supabase.from('drive_item_favorites').delete().eq('profile_id', profile.id).eq('drive_item_id', itemId);
    return { error };
  }

  static async countChildItems(folderIds: string[]) {
    const uniq = [...new Set(folderIds.filter(Boolean))];
    if (!uniq.length) return { data: {} as Record<string, number>, error: null as null };
    if (isTableUnavailable(DRIVE_TABLE)) return { data: {}, error: null };
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: {}, error: ctx.error };
    const { profile } = ctx.data;

    const { data, error } = await supabase
      .from('drive_items')
      .select('parent_id')
      .eq('organization_id', profile.organization_id)
      .is('trashed_at', null)
      .in('parent_id', uniq);

    if (error && handleOptionalTableError(error, DRIVE_TABLE, 'DriveService.countChildItems')) {
      return { data: {}, error: null };
    }
    const counts: Record<string, number> = {};
    for (const id of uniq) counts[id] = 0;
    for (const row of (data as { parent_id: string }[]) ?? []) {
      if (row.parent_id && counts[row.parent_id] !== undefined) counts[row.parent_id] += 1;
    }
    return { data: counts, error: null };
  }

  static async countAclEntriesForFolders(folderIds: string[]) {
    const uniq = [...new Set(folderIds.filter(Boolean))];
    if (!uniq.length) return { data: {} as Record<string, number>, error: null as null };
    const { data, error } = await supabase.from('drive_item_acl').select('drive_item_id').in('drive_item_id', uniq);
    if (error) return { data: {}, error };
    const counts: Record<string, number> = {};
    for (const id of uniq) counts[id] = 0;
    for (const row of (data as { drive_item_id: string }[]) ?? []) {
      counts[row.drive_item_id] = (counts[row.drive_item_id] ?? 0) + 1;
    }
    return { data: counts, error: null };
  }

  static async countPendingAccessBadges() {
    const mine = await DriveService.listMyAccessRequests(80);
    const inbox = await DriveService.listPendingAccessRequestsToReview(80);
    const myPending = mine.data?.filter((r) => r.status === 'pending').length ?? 0;
    const inboxPending = inbox.data?.filter((r) => r.status === 'pending').length ?? 0;
    return { myPending, inboxPending, error: mine.error ?? inbox.error };
  }

  static async logAudit(action: string, driveItemId: string | null, meta?: Record<string, unknown>) {
    if (isTableUnavailable(DRIVE_AUDIT_TABLE)) return { error: null as null };
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { error: ctx.error };
    const { profile } = ctx.data;
    const { error } = await supabase.from('drive_audit_events').insert({
      organization_id: profile.organization_id,
      drive_item_id: driveItemId,
      actor_profile_id: profile.id,
      action,
      meta: meta ?? {},
    });
    if (error && handleOptionalTableError(error, DRIVE_AUDIT_TABLE, 'DriveService.logAudit')) {
      return { error: null };
    }
    return { error };
  }

  static async listTrashed() {
    if (isTableUnavailable(DRIVE_TABLE)) return { data: [] as DriveItem[], error: null };
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: [] as DriveItem[], error: ctx.error };
    const { profile } = ctx.data;

    const { data, error } = await supabase
      .from('drive_items')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .not('trashed_at', 'is', null)
      .order('trashed_at', { ascending: false })
      .order('name', { ascending: true });

    if (error && handleOptionalTableError(error, DRIVE_TABLE, 'DriveService.listTrashed')) {
      return { data: [] as DriveItem[], error: null };
    }
    return { data: (data as DriveItem[]) ?? [], error };
  }

  static async listRecent(limit = 30) {
    if (isTableUnavailable(DRIVE_TABLE)) return { data: [] as DriveItem[], error: null };
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: [] as DriveItem[], error: ctx.error };
    const { profile } = ctx.data;

    const { data, error } = await supabase
      .from('drive_items')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .is('trashed_at', null)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error && handleOptionalTableError(error, DRIVE_TABLE, 'DriveService.listRecent')) {
      return { data: [] as DriveItem[], error: null };
    }
    return { data: (data as DriveItem[]) ?? [], error };
  }

  static async search(query: string, limit = 60) {
    if (isTableUnavailable(DRIVE_TABLE)) return { data: [] as DriveItem[], error: null };
    const q = query.trim();
    if (!q) return { data: [] as DriveItem[], error: null };

    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: [] as DriveItem[], error: ctx.error };
    const { profile } = ctx.data;

    const safe = q
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_')
      .replace(/,/g, ' ')
      .slice(0, 120);
    const pattern = `%${safe}%`;
    const orWithCategory = `name.ilike.${pattern},description.ilike.${pattern},mime_type.ilike.${pattern},category.ilike.${pattern}`;
    const orBasic = `name.ilike.${pattern},description.ilike.${pattern},mime_type.ilike.${pattern}`;

    let { data, error } = await supabase
      .from('drive_items')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .is('trashed_at', null)
      .or(driveItemsHasCategoryColumn ? orWithCategory : orBasic)
      .order('item_type', { ascending: true })
      .order('name', { ascending: true })
      .limit(limit);

    if (error && isMissingColumnError(error, 'category')) {
      absorbDriveItemsMissingColumnError(error, 'DriveService.search');
      ({ data, error } = await supabase
        .from('drive_items')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .is('trashed_at', null)
        .or(orBasic)
        .order('item_type', { ascending: true })
        .order('name', { ascending: true })
        .limit(limit));
    }

    if (error && handleOptionalTableError(error, DRIVE_TABLE, 'DriveService.search')) {
      return { data: [] as DriveItem[], error: null };
    }
    return { data: (data as DriveItem[]) ?? [], error };
  }

  /**
   * Fichiers (hors dossiers) filtrés par étape du cycle de vie — vues « Gouvernance » du GDS.
   * Portée : organisation courante (RLS). Les lignes sans `document_status` n’apparaissent pas dans ces vues filtrées.
   */
  static async listGovernanceDocuments(filter: 'approved' | 'pending' | 'archived', limit = 150) {
    if (isTableUnavailable(DRIVE_TABLE)) return { data: [] as DriveItem[], error: null };
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: [] as DriveItem[], error: ctx.error };
    const { profile } = ctx.data;

    if (!driveItemsHasDocumentStatusColumn) {
      return { data: [] as DriveItem[], error: null };
    }

    let q = supabase
      .from('drive_items')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .neq('item_type', 'folder')
      .is('trashed_at', null);

    if (filter === 'approved') {
      q = q.eq('document_status', 'approved');
    } else if (filter === 'pending') {
      q = q.in('document_status', ['draft', 'in_review', 'pending_validation']);
    } else {
      q = q.eq('document_status', 'archived');
    }

    let { data, error } = await q.order('updated_at', { ascending: false }).limit(Math.min(Math.max(limit, 1), 300));

    if (error && isMissingColumnError(error, 'document_status')) {
      absorbDriveItemsMissingColumnError(error, 'DriveService.listGovernanceDocuments');
      return { data: [] as DriveItem[], error: null };
    }

    if (error && handleOptionalTableError(error, DRIVE_TABLE, 'DriveService.listGovernanceDocuments')) {
      return { data: [] as DriveItem[], error: null };
    }
    return { data: (data as DriveItem[]) ?? [], error };
  }

  static async listAllFolders(workspaceScope: 'personal' | string = 'personal') {
    if (isTableUnavailable(DRIVE_TABLE)) return { data: [] as DriveItem[], error: null };
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: [] as DriveItem[], error: ctx.error };
    const { profile } = ctx.data;

    if (!driveItemsHasWorkspaceIdColumn && workspaceScope !== 'personal') {
      return { data: [] as DriveItem[], error: null };
    }

    const build = (withWorkspaceFilter: boolean) => {
      let q = supabase
        .from('drive_items')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('item_type', 'folder')
        .is('trashed_at', null)
        .order('name', { ascending: true });
      if (withWorkspaceFilter && driveItemsHasWorkspaceIdColumn) {
        if (workspaceScope === 'personal') q = q.is('workspace_id', null);
        else q = q.eq('workspace_id', workspaceScope);
      }
      return q;
    };

    let { data, error } = await build(true);
    if (error && isMissingColumnError(error, 'workspace_id')) {
      absorbDriveItemsMissingColumnError(error, 'DriveService.listAllFolders');
      ({ data, error } = await build(false));
    }

    if (error && handleOptionalTableError(error, DRIVE_TABLE, 'DriveService.listAllFolders')) {
      return { data: [] as DriveItem[], error: null };
    }
    return { data: (data as DriveItem[]) ?? [], error };
  }

  static async getBreadcrumbs(parentId: string | null) {
    if (isTableUnavailable(DRIVE_TABLE)) return { data: [] as DriveItem[], error: null };
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: [] as DriveItem[], error: ctx.error };
    const { profile } = ctx.data;

    const crumbs: DriveItem[] = [];
    let current = parentId;
    const guard = new Set<string>();

    while (current) {
      if (guard.has(current)) break;
      guard.add(current);

      const { data, error } = await supabase
        .from('drive_items')
        .select('*')
        .eq('id', current)
        .eq('organization_id', profile.organization_id)
        .single();

      if (error) {
        if (handleOptionalTableError(error, DRIVE_TABLE, 'DriveService.getBreadcrumbs')) break;
        break;
      }
      if (!data) break;
      const item = data as DriveItem;
      crumbs.push(item);
      current = item.parent_id;
    }

    crumbs.reverse();
    return { data: crumbs, error: null };
  }

  private static aclFlagsForPermission(permission: 'viewer' | 'editor') {
    if (permission === 'editor') {
      return {
        can_view: true,
        can_edit: true,
        can_download: true,
        can_share: true,
        can_delete: false,
      };
    }
    return {
      can_view: true,
      can_edit: false,
      can_download: true,
      can_share: false,
      can_delete: false,
    };
  }

  static async createFolder(params: {
    parentId: string | null;
    name: string;
    description?: string;
    workspaceId?: string | null;
  }) {
    if (isTableUnavailable(DRIVE_TABLE)) {
      return { data: null as DriveItem | null, error: new Error('Table drive_items absente : appliquez la migration Supabase (COYA Drive).') };
    }
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: null as DriveItem | null, error: ctx.error };
    const sessErr = await DriveService.requireRestSession();
    if (sessErr.error) return { data: null as DriveItem | null, error: sessErr.error };
    const { user, profile } = ctx.data;

    let workspaceId: string | null = params.workspaceId ?? null;
    if (workspaceId === undefined || workspaceId === null) {
      if (params.parentId) {
        const parent = await DriveService.getItem(params.parentId);
        if (!parent.error && parent.data) workspaceId = parent.data.workspace_id ?? null;
      }
    }

    const id = globalThis.crypto?.randomUUID?.();
    if (!id) return { data: null as DriveItem | null, error: new Error('Impossible de générer un identifiant pour le dossier.') };

    const row: Record<string, unknown> = {
      id,
      organization_id: profile.organization_id,
      parent_id: params.parentId,
      item_type: 'folder',
      name: params.name,
      description: params.description ?? null,
      visibility: 'private',
      owner_profile_id: profile.id,
      created_by_id: profile.id,
      created_by_name: profile.full_name ?? user.email ?? 'Utilisateur',
    };
    if (driveItemsHasWorkspaceIdColumn) row.workspace_id = workspaceId;
    pruneDriveInsertRowForKnownSchema(row);

    let insertErr = (await supabase.from('drive_items').insert(row as never)).error;
    for (let attempt = 0; attempt < 6 && insertErr; attempt++) {
      absorbDriveItemsMissingColumnError(insertErr, 'DriveService.createFolder');
      pruneDriveInsertRowForKnownSchema(row);
      stripDriveInsertRowFromError(row, insertErr);
      insertErr = (await supabase.from('drive_items').insert(row as never)).error;
    }
    if (insertErr) return { data: null as DriveItem | null, error: insertErr };

    const { data, error: readError } = await supabase.from('drive_items').select('*').eq('id', id).maybeSingle();
    if (readError) return { data: null as DriveItem | null, error: readError };
    void DriveService.logAudit('folder_create', id, { name: params.name });
    return { data: (data as DriveItem) ?? null, error: null };
  }

  static async setFolderVisibility(folderId: string, visibility: 'private' | 'org_public') {
    if (isTableUnavailable(DRIVE_TABLE)) return { data: null as DriveItem | null, error: null };
    const { data, error } = await supabase
      .from('drive_items')
      .update({ visibility })
      .eq('id', folderId)
      .eq('item_type', 'folder')
      .select('*')
      .single();
    if (error && handleOptionalTableError(error, DRIVE_TABLE, 'DriveService.setFolderVisibility')) {
      return { data: null as DriveItem | null, error: null };
    }
    void DriveService.logAudit('folder_visibility', folderId, { visibility });
    return { data: (data as DriveItem) ?? null, error };
  }

  static validateUploadSize(file: File): { ok: true } | { ok: false; error: Error } {
    if (file.size > DRIVE_MAX_FILE_BYTES) {
      return {
        ok: false,
        error: new Error(
          `Fichier trop volumineux (max ${Math.round(DRIVE_MAX_FILE_BYTES / (1024 * 1024))} Mo).`,
        ),
      };
    }
    return { ok: true };
  }

  static async uploadFile(params: { parentId: string | null; file: File }) {
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: null as DriveItem | null, error: ctx.error };
    const sessErr = await DriveService.requireRestSession();
    if (sessErr.error) return { data: null as DriveItem | null, error: sessErr.error };
    const { user, profile } = ctx.data;

    const sizeCheck = DriveService.validateUploadSize(params.file);
    if (!sizeCheck.ok) {
      const uploadSizeError = (sizeCheck as { ok: false; error: Error }).error;
      return { data: null as DriveItem | null, error: uploadSizeError };
    }

    let workspaceId: string | null = null;
    if (params.parentId) {
      const parent = await DriveService.getItem(params.parentId);
      if (!parent.error && parent.data) workspaceId = parent.data.workspace_id ?? null;
    }

    const orgPrefix = String(profile.organization_id);
    const safeName = params.file.name.replace(/[^\w.\-()\s]/g, '_');
    const path = `${orgPrefix}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage.from(DRIVE_BUCKET).upload(path, params.file, { upsert: false });
    if (uploadError) return { data: null, error: uploadError };

    const { data: publicUrl } = supabase.storage.from(DRIVE_BUCKET).getPublicUrl(path);

    const id = globalThis.crypto?.randomUUID?.();
    if (!id) return { data: null, error: new Error('Impossible de générer un identifiant pour le fichier.') };

    const row: Record<string, unknown> = {
      id,
      organization_id: profile.organization_id,
      parent_id: params.parentId,
      item_type: 'file',
      name: params.file.name,
      mime_type: params.file.type || null,
      size_bytes: params.file.size,
      storage_bucket: DRIVE_BUCKET,
      storage_path: path,
      description: publicUrl?.publicUrl ?? null,
      created_by_id: profile.id,
      created_by_name: profile.full_name ?? user.email ?? 'Utilisateur',
      document_status: 'draft',
      confidentiality_level: 1,
    };
    if (driveItemsHasWorkspaceIdColumn) row.workspace_id = workspaceId;
    pruneDriveInsertRowForKnownSchema(row);

    let insertErr = (await supabase.from('drive_items').insert(row as never)).error;
    for (let attempt = 0; attempt < 6 && insertErr; attempt++) {
      absorbDriveItemsMissingColumnError(insertErr, 'DriveService.uploadFile');
      pruneDriveInsertRowForKnownSchema(row);
      stripDriveInsertRowFromError(row, insertErr);
      insertErr = (await supabase.from('drive_items').insert(row as never)).error;
    }

    if (insertErr && handleOptionalTableError(insertErr, DRIVE_TABLE, 'DriveService.uploadFile')) {
      return { data: null, error: new Error('Table drive_items absente : appliquez la migration Supabase (COYA Drive).') };
    }
    if (insertErr) return { data: null, error: insertErr };

    const { data, error: readError } = await supabase.from('drive_items').select('*').eq('id', id).maybeSingle();
    if (readError) return { data: null, error: readError };
    void DriveService.logAudit('file_upload', id, { name: params.file.name, size: params.file.size });
    return { data: (data as DriveItem) ?? null, error: null };
  }

  static async trashItem(itemId: string) {
    if (isTableUnavailable(DRIVE_TABLE)) return { data: null as DriveItem | null, error: null };
    const { data, error } = await supabase
      .from('drive_items')
      .update({ trashed_at: new Date().toISOString() })
      .eq('id', itemId)
      .select('*')
      .single();
    if (error && handleOptionalTableError(error, DRIVE_TABLE, 'DriveService.trashItem')) {
      return { data: null, error: null };
    }
    void DriveService.logAudit('item_trash', itemId, {});
    return { data: (data as DriveItem) ?? null, error };
  }

  static async restoreItem(itemId: string) {
    if (isTableUnavailable(DRIVE_TABLE)) return { data: null as DriveItem | null, error: null };
    const { data, error } = await supabase
      .from('drive_items')
      .update({ trashed_at: null })
      .eq('id', itemId)
      .select('*')
      .single();
    if (error && handleOptionalTableError(error, DRIVE_TABLE, 'DriveService.restoreItem')) {
      return { data: null, error: null };
    }
    void DriveService.logAudit('item_restore', itemId, {});
    return { data: (data as DriveItem) ?? null, error };
  }

  static async renameItem(itemId: string, name: string) {
    if (isTableUnavailable(DRIVE_TABLE)) return { data: null as DriveItem | null, error: null };
    const { data, error } = await supabase
      .from('drive_items')
      .update({ name })
      .eq('id', itemId)
      .select('*')
      .single();
    if (error && handleOptionalTableError(error, DRIVE_TABLE, 'DriveService.renameItem')) {
      return { data: null, error: null };
    }
    void DriveService.logAudit('item_rename', itemId, { name });
    return { data: (data as DriveItem) ?? null, error };
  }

  static async moveItem(itemId: string, parentId: string | null) {
    if (isTableUnavailable(DRIVE_TABLE)) return { data: null as DriveItem | null, error: null };
    let workspaceId: string | null | undefined = undefined;
    if (parentId) {
      const parent = await DriveService.getItem(parentId);
      if (!parent.error && parent.data) workspaceId = parent.data.workspace_id ?? null;
    } else {
      workspaceId = null;
    }
    const patch: Record<string, unknown> = { parent_id: parentId };
    if (driveItemsHasWorkspaceIdColumn && workspaceId !== undefined) patch.workspace_id = workspaceId;

    const { data, error } = await supabase.from('drive_items').update(patch).eq('id', itemId).select('*').single();
    if (error && handleOptionalTableError(error, DRIVE_TABLE, 'DriveService.moveItem')) {
      return { data: null, error: null };
    }
    void DriveService.logAudit('item_move', itemId, { parentId });
    return { data: (data as DriveItem) ?? null, error };
  }

  static async getItem(itemId: string) {
    if (isTableUnavailable(DRIVE_TABLE)) return { data: null as DriveItem | null, error: null };
    const { data, error } = await supabase.from('drive_items').select('*').eq('id', itemId).maybeSingle();
    if (error && handleOptionalTableError(error, DRIVE_TABLE, 'DriveService.getItem')) {
      return { data: null as DriveItem | null, error: null };
    }
    return { data: (data as DriveItem) ?? null, error };
  }

  static async getItemNamesByIds(ids: string[]) {
    const uniq = [...new Set(ids.filter(Boolean))];
    if (!uniq.length) return { data: {} as Record<string, string>, error: null as null };
    if (isTableUnavailable(DRIVE_TABLE)) return { data: {}, error: null };
    const { data, error } = await supabase.from('drive_items').select('id,name').in('id', uniq);
    if (error && handleOptionalTableError(error, DRIVE_TABLE, 'DriveService.getItemNamesByIds')) {
      return { data: {}, error: null };
    }
    const map: Record<string, string> = {};
    for (const row of (data as { id: string; name: string }[]) ?? []) map[row.id] = row.name;
    return { data: map, error: null };
  }

  static async resolveOwnerLabel(item: DriveItem, profileMap: Map<string, string>) {
    if (item.item_type === 'folder' && item.owner_profile_id) {
      const n = profileMap.get(item.owner_profile_id);
      if (n) return n;
    }
    return item.created_by_name ?? '—';
  }

  static async loadProfileNames(ids: string[]) {
    const uniq = [...new Set(ids.filter(Boolean))];
    if (!uniq.length) return { data: new Map<string, string>(), error: null as null };
    const { data, error } = await supabase.from('profiles').select('id,full_name,email').in('id', uniq);
    if (error) return { data: new Map<string, string>(), error };
    const m = new Map<string, string>();
    for (const p of (data as { id: string; full_name: string | null; email: string }[]) ?? []) {
      m.set(p.id, (p.full_name || p.email || p.id).slice(0, 80));
    }
    return { data: m, error: null };
  }

  static async copyItem(itemId: string, targetParentId: string | null) {
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: null as DriveItem | null, error: ctx.error };
    const sessErr = await DriveService.requireRestSession();
    if (sessErr.error) return { data: null as DriveItem | null, error: sessErr.error };
    const { user, profile } = ctx.data;

    const { data: src, error: srcErr } = await DriveService.getItem(itemId);
    if (srcErr) return { data: null as DriveItem | null, error: srcErr };
    if (!src) return { data: null as DriveItem | null, error: new Error('Élément introuvable') };

    if (src.item_type === 'folder') {
      const res = await DriveService.copyFolderRecursive(src, targetParentId, {
        userEmail: user.email ?? null,
        requesterName: profile.full_name ?? user.email ?? 'Utilisateur',
        ownerProfileId: profile.id,
      });
      return res;
    }

    const res = await DriveService.copyFileLike(src, targetParentId, {
      orgId: String(profile.organization_id),
      createdById: profile.id,
      createdByName: profile.full_name ?? user.email ?? 'Utilisateur',
    });
    return res;
  }

  private static async copyFileLike(
    src: DriveItem,
    targetParentId: string | null,
    meta: { orgId: string; createdById: string; createdByName: string },
  ) {
    if (!src.storage_bucket || !src.storage_path) {
      return { data: null as DriveItem | null, error: new Error('Ce fichier n’a pas de stockage associé') };
    }
    const id = globalThis.crypto?.randomUUID?.();
    if (!id) return { data: null as DriveItem | null, error: new Error('Impossible de générer un identifiant.') };

    const safeName = (src.name || 'copie').replace(/[^\w.\-()\s]/g, '_');
    const newPath = `${meta.orgId}/${Date.now()}_${safeName}`;

    const { error: copyErr } = await supabase.storage.from(src.storage_bucket).copy(src.storage_path, newPath);
    if (copyErr) return { data: null as DriveItem | null, error: copyErr };

    const { data: publicUrl } = supabase.storage.from(src.storage_bucket).getPublicUrl(newPath);

    let workspaceId: string | null = null;
    if (targetParentId) {
      const parent = await DriveService.getItem(targetParentId);
      if (!parent.error && parent.data) workspaceId = parent.data.workspace_id ?? null;
    }

    const insRow: Record<string, unknown> = {
      id,
      organization_id: src.organization_id,
      parent_id: targetParentId,
      item_type: src.item_type,
      name: DriveService.withCopySuffix(src.name),
      mime_type: src.mime_type ?? null,
      size_bytes: src.size_bytes ?? null,
      storage_bucket: src.storage_bucket,
      storage_path: newPath,
      description: publicUrl?.publicUrl ?? null,
      created_by_id: meta.createdById,
      created_by_name: meta.createdByName,
      confidentiality_level: src.confidentiality_level ?? 1,
      document_status: src.document_status ?? 'draft',
      category: src.category ?? null,
      tags: src.tags ?? [],
      linked_programme_id: src.linked_programme_id ?? null,
      linked_project_id: src.linked_project_id ?? null,
    };
    if (driveItemsHasWorkspaceIdColumn) insRow.workspace_id = workspaceId;
    pruneDriveInsertRowForKnownSchema(insRow);

    let insErr = (await supabase.from('drive_items').insert(insRow as never)).error;
    for (let attempt = 0; attempt < 6 && insErr; attempt++) {
      absorbDriveItemsMissingColumnError(insErr, 'DriveService.copyFileLike');
      pruneDriveInsertRowForKnownSchema(insRow);
      stripDriveInsertRowFromError(insRow, insErr);
      insErr = (await supabase.from('drive_items').insert(insRow as never)).error;
    }
    if (insErr) return { data: null as DriveItem | null, error: insErr };

    const { data, error: readError } = await supabase.from('drive_items').select('*').eq('id', id).maybeSingle();
    if (readError) return { data: null as DriveItem | null, error: readError };
    void DriveService.logAudit('file_copy', id, { from: src.id });
    return { data: (data as DriveItem) ?? null, error: null };
  }

  private static async copyFolderRecursive(
    srcFolder: DriveItem,
    targetParentId: string | null,
    meta: { userEmail: string | null; requesterName: string; ownerProfileId: string },
  ) {
    if (srcFolder.item_type !== 'folder') {
      return { data: null as DriveItem | null, error: new Error('copyFolderRecursive: source invalide') };
    }

    let ws = srcFolder.workspace_id ?? null;
    if (targetParentId) {
      const parent = await DriveService.getItem(targetParentId);
      if (!parent.error && parent.data) ws = parent.data.workspace_id ?? null;
    } else {
      ws = null;
    }

    const created = await DriveService.createFolder({
      parentId: targetParentId,
      name: DriveService.withCopySuffix(srcFolder.name),
      description: srcFolder.description ?? undefined,
      workspaceId: ws,
    });
    if (created.error || !created.data) return { data: null as DriveItem | null, error: created.error ?? new Error('Création dossier échouée') };

    const wsScope =
      !driveItemsHasWorkspaceIdColumn ? 'personal' : srcFolder.workspace_id ? srcFolder.workspace_id : 'personal';
    const children = await DriveService.list(srcFolder.id, wsScope);
    if (children.error) return { data: created.data, error: children.error };

    for (const child of children.data) {
      if (child.item_type === 'folder') {
        const r = await DriveService.copyFolderRecursive(child, created.data.id, meta);
        if (r.error) return { data: created.data, error: r.error };
      } else {
        const r = await DriveService.copyFileLike(child, created.data.id, {
          orgId: String(created.data.organization_id),
          createdById: meta.ownerProfileId,
          createdByName: meta.requesterName,
        });
        if (r.error) return { data: created.data, error: r.error };
      }
    }

    return { data: created.data, error: null };
  }

  private static withCopySuffix(name: string) {
    const n = (name || '').trim();
    if (!n) return 'Copie';
    if (/\(copie\)$/i.test(n)) return n;
    return `${n} (copie)`;
  }

  static async deletePermanently(item: DriveItem) {
    if (isTableUnavailable(DRIVE_TABLE)) return { data: null as any, error: null };
    if (item.storage_bucket && item.storage_path) {
      const { error: storageError } = await supabase.storage.from(item.storage_bucket).remove([item.storage_path]);
      if (storageError) return { data: null as any, error: storageError };
    }
    const { data, error } = await supabase.from('drive_items').delete().eq('id', item.id).select('*').single();
    if (error && handleOptionalTableError(error, DRIVE_TABLE, 'DriveService.deletePermanently')) {
      return { data: null, error: null };
    }
    void DriveService.logAudit('item_delete_permanent', item.id, { name: item.name });
    return { data, error };
  }

  static async listOrganizationProfiles() {
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: [] as { id: string; full_name: string | null; email: string }[], error: ctx.error };
    const { profile } = ctx.data;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('organization_id', profile.organization_id)
      .order('full_name', { ascending: true });
    if (error) return { data: [], error };
    return { data: (data as { id: string; full_name: string | null; email: string }[]) ?? [], error: null };
  }

  static async listFolderAcl(folderId: string) {
    const { data, error } = await supabase
      .from('drive_item_acl')
      .select('profile_id, permission, can_view, can_edit, can_download, can_share, can_delete')
      .eq('drive_item_id', folderId);
    return { data: (data as DriveAclRow[]) ?? [], error };
  }

  static async addFolderAcl(folderId: string, profileId: string, permission: 'viewer' | 'editor') {
    const flags = DriveService.aclFlagsForPermission(permission);
    const { error } = await supabase.from('drive_item_acl').upsert(
      { drive_item_id: folderId, profile_id: profileId, permission, ...flags },
      { onConflict: 'drive_item_id,profile_id' },
    );
    void DriveService.logAudit('acl_upsert', folderId, { profileId, permission });
    return { error };
  }

  static async removeFolderAcl(folderId: string, profileId: string) {
    const { error } = await supabase.from('drive_item_acl').delete().eq('drive_item_id', folderId).eq('profile_id', profileId);
    void DriveService.logAudit('acl_remove', folderId, { profileId });
    return { error };
  }

  static aclCapabilityLabels(row: DriveAclRow): string {
    const parts: string[] = [];
    if (row.can_view !== false) parts.push('Lecture');
    if (row.can_edit) parts.push('Modification');
    if (row.can_download !== false) parts.push('Téléchargement');
    if (row.can_share) parts.push('Partage');
    if (row.can_delete) parts.push('Suppression');
    return parts.length ? parts.join(' · ') : row.permission;
  }

  static async getMyFolderCapability(
    folderId: string,
  ): Promise<{ level: 'owner' | 'editor' | 'viewer' | 'admin' | 'none'; error?: Error }> {
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { level: 'none', error: ctx.error ?? undefined };
    const { profile } = ctx.data;
    if (profile.role === 'super_administrator' || profile.role === 'administrator') return { level: 'admin' };
    const { data: folder, error } = await supabase
      .from('drive_items')
      .select('owner_profile_id')
      .eq('id', folderId)
      .eq('item_type', 'folder')
      .maybeSingle();
    if (error || !folder) return { level: 'none' };
    if (folder.owner_profile_id === profile.id) return { level: 'owner' };
    const { data: acl } = await supabase
      .from('drive_item_acl')
      .select('permission, can_edit, can_view')
      .eq('drive_item_id', folderId)
      .eq('profile_id', profile.id)
      .maybeSingle();
    if (acl?.can_edit || acl?.permission === 'editor') return { level: 'editor' };
    if (acl && (acl.permission === 'viewer' || acl.can_view !== false)) return { level: 'viewer' };
    return { level: 'none' };
  }

  static async getDownloadUrl(item: DriveItem, expiresInSeconds = 60 * 10) {
    if (!item.storage_bucket || !item.storage_path) return { data: null as string | null, error: new Error('Item sans fichier') };
    // Bucket public `drive-files` : URL publique directe (évite erreurs / latence sur signed URL).
    if (item.storage_bucket === DRIVE_BUCKET) {
      const { data } = supabase.storage.from(item.storage_bucket).getPublicUrl(item.storage_path);
      if (data?.publicUrl) return { data: data.publicUrl, error: null };
    }
    const { data, error } = await supabase.storage.from(item.storage_bucket).createSignedUrl(item.storage_path, expiresInSeconds);
    return { data: data?.signedUrl ?? null, error };
  }

  /** Métadonnées pour lien « demander l’accès » (élément même org, hors corbeille). */
  static async getItemMetaForAccessRequest(itemId: string) {
    const { data, error } = await supabase.rpc('drive_item_meta_for_access_request', { p_item_id: itemId });
    if (error) return { data: null as { id: string; name: string; item_type: string; organization_id: string } | null, error };
    const row = Array.isArray(data) ? data[0] : data;
    return {
      data: (row as { id: string; name: string; item_type: string; organization_id: string }) ?? null,
      error: null as null,
    };
  }

  static async createAccessRequest(params: {
    driveItemId: string;
    permission: 'viewer' | 'editor';
    message?: string | null;
    requestReason?: string | null;
    requestedDurationDays?: number | null;
    urgency?: 'low' | 'normal' | 'high';
    justification?: string | null;
  }) {
    if (isTableUnavailable(DRIVE_ACCESS_TABLE)) {
      return { data: null as DriveAccessRequestRow | null, error: new Error('Demandes d’accès : migration Supabase non appliquée.') };
    }
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: null as DriveAccessRequestRow | null, error: ctx.error };
    const sessErr = await DriveService.requireRestSession();
    if (sessErr.error) return { data: null as DriveAccessRequestRow | null, error: sessErr.error };
    const { profile } = ctx.data;

    const meta = await DriveService.getItemMetaForAccessRequest(params.driveItemId);
    if (meta.error) return { data: null, error: meta.error };
    if (!meta.data) return { data: null, error: new Error('Élément introuvable ou déjà accessible.') };

    const { data, error } = await supabase
      .from('drive_access_requests')
      .insert({
        organization_id: profile.organization_id,
        drive_item_id: params.driveItemId,
        requester_profile_id: profile.id,
        permission_requested: params.permission,
        message: params.message ?? null,
        request_reason: params.requestReason ?? null,
        requested_duration_days: params.requestedDurationDays ?? null,
        urgency: params.urgency ?? 'normal',
        justification: params.justification ?? null,
        status: 'pending',
      })
      .select('*')
      .maybeSingle();

    if (error && handleOptionalTableError(error, DRIVE_ACCESS_TABLE, 'DriveService.createAccessRequest')) {
      return { data: null as DriveAccessRequestRow | null, error: null };
    }
    void DriveService.logAudit('access_request_create', params.driveItemId, { requestId: data?.id });
    return { data: data as DriveAccessRequestRow | null, error };
  }

  static async listMyAccessRequests(limit = 40) {
    if (isTableUnavailable(DRIVE_ACCESS_TABLE)) return { data: [] as DriveAccessRequestRow[], error: null };
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: [] as DriveAccessRequestRow[], error: ctx.error };
    const { profile } = ctx.data;
    const { data, error } = await supabase
      .from('drive_access_requests')
      .select('*')
      .eq('requester_profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error && handleOptionalTableError(error, DRIVE_ACCESS_TABLE, 'DriveService.listMyAccessRequests')) {
      return { data: [] as DriveAccessRequestRow[], error: null };
    }
    return { data: (data as DriveAccessRequestRow[]) ?? [], error };
  }

  /** Demandes en attente dont vous êtes valideur (propriétaire / éditeur du dossier), hors vos propres demandes. */
  static async listPendingAccessRequestsToReview(limit = 60) {
    if (isTableUnavailable(DRIVE_ACCESS_TABLE)) return { data: [] as DriveAccessRequestRow[], error: null };
    const ctx = await DriveService.getProfileContext();
    if (ctx.error || !ctx.data) return { data: [] as DriveAccessRequestRow[], error: ctx.error };
    const { profile } = ctx.data;
    const { data, error } = await supabase
      .from('drive_access_requests')
      .select('*')
      .eq('status', 'pending')
      .neq('requester_profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error && handleOptionalTableError(error, DRIVE_ACCESS_TABLE, 'DriveService.listPendingAccessRequestsToReview')) {
      return { data: [] as DriveAccessRequestRow[], error: null };
    }
    return { data: (data as DriveAccessRequestRow[]) ?? [], error };
  }

  static async reviewAccessRequest(
    requestId: string,
    decision: 'approved' | 'rejected',
    opts?: { reviewedDecision?: 'approve' | 'reject' | 'temporary'; grantExpiresAt?: string | null },
  ) {
    if (isTableUnavailable(DRIVE_ACCESS_TABLE)) {
      return { data: null as DriveAccessRequestRow | null, error: new Error('Migration Supabase non appliquée.') };
    }
    const sessErr = await DriveService.requireRestSession();
    if (sessErr.error) return { data: null as DriveAccessRequestRow | null, error: sessErr.error };

    const reviewedDecision =
      opts?.reviewedDecision ?? (decision === 'rejected' ? 'reject' : 'approve');

    const patch: Record<string, unknown> = {
      status: decision,
      reviewed_decision: reviewedDecision,
    };
    if (opts?.grantExpiresAt !== undefined) patch.grant_expires_at = opts.grantExpiresAt;
    if (reviewedDecision === 'temporary' && decision === 'approved' && !patch.grant_expires_at) {
      // TODO(GDS): calculer grant_expires_at côté serveur à partir de requested_duration_days si absent.
      patch.grant_expires_at = null;
    }

    const { data, error } = await supabase
      .from('drive_access_requests')
      .update(patch)
      .eq('id', requestId)
      .eq('status', 'pending')
      .select('*')
      .maybeSingle();
    if (error && handleOptionalTableError(error, DRIVE_ACCESS_TABLE, 'DriveService.reviewAccessRequest')) {
      return { data: null as DriveAccessRequestRow | null, error: null };
    }
    void DriveService.logAudit('access_request_review', data?.drive_item_id ?? null, {
      requestId,
      decision,
      reviewedDecision,
    });
    return { data: data as DriveAccessRequestRow | null, error };
  }
}
