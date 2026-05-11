# Permissions — Core

## Principes

- **Séparation** : permission « accéder au module » vs « action sur agrégat ».
- **Scope** : `global` (super admin), `organization`, `project`, `department` selon politique COYA.

## Matrice (brouillon)

| Capacité | Description | Scope |
|----------|-------------|-------|
| `org:admin` | Administration organisation | org |
| `org:members:read` | Liste membres | org |
| `org:members:invite` | Inviter utilisateur | org |
| `security:roles:write` | Modifier rôles | org |
| `audit:read` | Consulter audit | org |

## Alignement RLS

- Chaque ligne doit correspondre à une **policy** documentée (nom + table).

## Références

- `utils/modulePermissionDefaults.ts`, `hooks/useModulePermissions.ts`, politiques Supabase.
