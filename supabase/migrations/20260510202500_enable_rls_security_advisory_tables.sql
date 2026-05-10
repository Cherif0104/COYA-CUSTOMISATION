-- Activation RLS sur les tables signalées par les advisors (permissif, scoped organisation ou référentiel).
-- Helpers réutilisés par part2. audit_logs : pas de colonne organization_id exploitable sans ambiguïté — RLS non activée.

begin;

create or replace function public.coya_auth_has_management_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and coalesce(p.role, '') in (
        'super_admin', 'admin', 'manager', 'super_administrator', 'administrator'
      )
  );
$$;

create or replace function public.coya_auth_has_super_admin_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and coalesce(p.role, '') in ('super_admin', 'super_administrator')
  );
$$;

revoke all on function public.coya_auth_has_management_role() from public;
grant execute on function public.coya_auth_has_management_role() to authenticated, service_role;

revoke all on function public.coya_auth_has_super_admin_role() from public;
grant execute on function public.coya_auth_has_super_admin_role() to authenticated, service_role;

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

drop policy if exists roles_select_authenticated on public.roles;
create policy roles_select_authenticated on public.roles for select to authenticated using (true);

drop policy if exists roles_mutate_admin_or_service on public.roles;
create policy roles_mutate_admin_or_service on public.roles for all to service_role using (true) with check (true);

drop policy if exists roles_insert_authenticated_admin on public.roles;
create policy roles_insert_authenticated_admin on public.roles for insert to authenticated with check (public.coya_auth_has_management_role());

drop policy if exists roles_update_authenticated_admin on public.roles;
create policy roles_update_authenticated_admin on public.roles for update to authenticated using (public.coya_auth_has_management_role()) with check (public.coya_auth_has_management_role());

drop policy if exists roles_delete_authenticated_admin on public.roles;
create policy roles_delete_authenticated_admin on public.roles for delete to authenticated using (public.coya_auth_has_management_role());

drop policy if exists permissions_select_authenticated on public.permissions;
create policy permissions_select_authenticated on public.permissions for select to authenticated using (true);

drop policy if exists permissions_mutate_admin_or_service on public.permissions;
create policy permissions_mutate_admin_or_service on public.permissions for all to service_role using (true) with check (true);

drop policy if exists permissions_insert_authenticated_admin on public.permissions;
create policy permissions_insert_authenticated_admin on public.permissions for insert to authenticated with check (public.coya_auth_has_management_role());

drop policy if exists permissions_update_authenticated_admin on public.permissions;
create policy permissions_update_authenticated_admin on public.permissions for update to authenticated using (public.coya_auth_has_management_role()) with check (public.coya_auth_has_management_role());

drop policy if exists permissions_delete_authenticated_admin on public.permissions;
create policy permissions_delete_authenticated_admin on public.permissions for delete to authenticated using (public.coya_auth_has_management_role());

drop policy if exists role_permissions_select_authenticated on public.role_permissions;
create policy role_permissions_select_authenticated on public.role_permissions for select to authenticated using (true);

drop policy if exists role_permissions_mutate_admin_or_service on public.role_permissions;
create policy role_permissions_mutate_admin_or_service on public.role_permissions for all to service_role using (true) with check (true);

drop policy if exists role_permissions_insert_authenticated_admin on public.role_permissions;
create policy role_permissions_insert_authenticated_admin on public.role_permissions for insert to authenticated with check (public.coya_auth_has_management_role());

drop policy if exists role_permissions_update_authenticated_admin on public.role_permissions;
create policy role_permissions_update_authenticated_admin on public.role_permissions for update to authenticated using (public.coya_auth_has_management_role()) with check (public.coya_auth_has_management_role());

drop policy if exists role_permissions_delete_authenticated_admin on public.role_permissions;
create policy role_permissions_delete_authenticated_admin on public.role_permissions for delete to authenticated using (public.coya_auth_has_management_role());

alter table public.organizations enable row level security;

drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member on public.organizations for select to authenticated using (
  id in (select organization_id from public.profiles where user_id = auth.uid())
);

drop policy if exists organizations_mutate_service on public.organizations;
create policy organizations_mutate_service on public.organizations for all to service_role using (true) with check (true);

drop policy if exists organizations_insert_super on public.organizations;
create policy organizations_insert_super on public.organizations for insert to authenticated with check (public.coya_auth_has_super_admin_role());

drop policy if exists organizations_update_managed on public.organizations;
create policy organizations_update_managed on public.organizations for update to authenticated using (
  id in (select organization_id from public.profiles where user_id = auth.uid())
  and public.coya_auth_has_management_role()
) with check (
  id in (select organization_id from public.profiles where user_id = auth.uid())
  and public.coya_auth_has_management_role()
);

drop policy if exists organizations_delete_super on public.organizations;
create policy organizations_delete_super on public.organizations for delete to authenticated using (public.coya_auth_has_super_admin_role());

alter table public.role_approval_logs enable row level security;

drop policy if exists role_approval_logs_org_scope on public.role_approval_logs;
create policy role_approval_logs_org_scope on public.role_approval_logs for all to authenticated using (
  exists (
    select 1 from public.profiles subj
    where subj.id = role_approval_logs.profile_id
      and subj.organization_id in (
        select organization_id from public.profiles where user_id = auth.uid()
      )
  )
) with check (
  exists (
    select 1 from public.profiles subj
    where subj.id = role_approval_logs.profile_id
      and subj.organization_id in (
        select organization_id from public.profiles where user_id = auth.uid()
      )
  )
);

drop policy if exists role_approval_logs_service on public.role_approval_logs;
create policy role_approval_logs_service on public.role_approval_logs for all to service_role using (true) with check (true);

commit;

-- Suite : 20260510202600_enable_rls_security_advisory_tables_part2.sql
-- TODO: define RLS policy for public.audit_logs — RLS laissée désactivée volontairement.
