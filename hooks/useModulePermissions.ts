import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContextSupabase';
import { DataService } from '../services/dataService';
import { DepartmentService } from '../services/departmentService';
import { ModuleName, Role } from '../types';
import { getDefaultPermissionsForRole, PermissionState } from '../utils/modulePermissionDefaults';
import {
  applyDepartmentScopeToPermissions,
  buildExplicitReadDenyFromRows,
} from '../utils/departmentPermissionPolicy';

type ModulePermissions = Record<ModuleName, PermissionState>;

export const useModulePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<ModulePermissions>({});
  const [loading, setLoading] = useState(true);

  const loadPermissions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const role = (user.role || 'student') as Role;
      const isSuperAdmin = role === 'super_administrator';
      let effective = getDefaultPermissionsForRole(role);

      /**
       * IMPORTANT (départements & permissions) :
       * - `user_module_permissions.user_id` et `user_departments.user_id` utilisent l'ID auth (`profiles.user_id`).
       * - `profileId` (UUID `profiles.id`) est canon pour les workspaces RH, mais ne doit pas être utilisé ici.
       */
      const authUserId = String(user.id);
      let permissionRows: unknown[] = [];
      if (!isSuperAdmin) {
        const { data, error } = await DataService.getUserModulePermissions(authUserId);
        permissionRows = !error && Array.isArray(data) ? data : [];
        if (permissionRows.length > 0) {
          permissionRows.forEach((row: any) => {
            const raw = String(row.module_name ?? '');
            const moduleName = (raw === 'knowledge_base' ? 'coya_drive' : raw) as ModuleName;
            effective[moduleName] = {
              canRead: !!row.can_read,
              canWrite: !!row.can_write,
              canDelete: !!row.can_delete,
              canApprove: !!row.can_approve,
            };
          });
        }
      }

      const allowedSlugs = await DepartmentService.getAllowedModuleSlugsForUser(authUserId);

      if (!isSuperAdmin) {
        const explicitReadDeny = buildExplicitReadDenyFromRows(permissionRows);
        applyDepartmentScopeToPermissions(effective, allowedSlugs, role, explicitReadDeny);
      }

      const normalizedPermissions = Object.entries(effective).reduce((acc, [moduleName, perms]) => {
        const canRead = !!perms.canRead;
        acc[moduleName as ModuleName] = {
          canRead,
          canWrite: canRead ? perms.canWrite : false,
          canDelete: canRead ? perms.canDelete : false,
          canApprove: canRead ? perms.canApprove : false,
        };
        return acc;
      }, {} as Record<ModuleName, PermissionState>);

      setPermissions(normalizedPermissions);
    } catch (e) {
      console.error('❌ useModulePermissions - Error loading permissions:', e);
      const fallback = getDefaultPermissionsForRole(user.role as Role);
      const normalizedFallback = Object.entries(fallback).reduce((acc, [moduleName, perms]) => {
        const canRead = !!perms.canRead;
        acc[moduleName as ModuleName] = {
          canRead,
          canWrite: canRead ? perms.canWrite : false,
          canDelete: canRead ? perms.canDelete : false,
          canApprove: canRead ? perms.canApprove : false,
        };
        return acc;
      }, {} as Record<ModuleName, PermissionState>);
      setPermissions(normalizedFallback);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPermissions();

    window.addEventListener('permissions-reload', loadPermissions);

    return () => {
      window.removeEventListener('permissions-reload', loadPermissions);
    };
  }, [loadPermissions]);

  const hasPermission = (
    module: ModuleName,
    action: 'read' | 'write' | 'delete' | 'approve'
  ): boolean => {
    if (!user) return false;

    const modulePermissions = permissions[module];
    if (!modulePermissions) return false;

    if (action === 'read') return !!modulePermissions.canRead;
    if (action === 'write') return !!modulePermissions.canWrite;
    if (action === 'delete') return !!modulePermissions.canDelete;
    if (action === 'approve') return !!modulePermissions.canApprove;
    return false;
  };

  const canAccessModule = (module: ModuleName): boolean => {
    return hasPermission(module, 'read');
  };

  return {
    permissions,
    loading,
    hasPermission,
    canAccessModule,
  };
};
