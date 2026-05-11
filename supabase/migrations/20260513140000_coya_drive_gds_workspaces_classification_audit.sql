-- COYA Drive — GDS : espaces documentaires, classification, ACL granulaire (UX),
-- demandes d’accès enrichies, favoris, audit léger, harmonisation notifications.

begin;

-- ---------------------------------------------------------------------------
-- Types / colonnes classification sur drive_items
-- ---------------------------------------------------------------------------
alter table public.drive_items
  add column if not exists workspace_id uuid;

alter table public.drive_items
  add column if not exists confidentiality_level smallint not null default 1;

alter table public.drive_items
  drop constraint if exists drive_items_confidentiality_level_check;

alter table public.drive_items
  add constraint drive_items_confidentiality_level_check
  check (confidentiality_level between 1 and 5);

alter table public.drive_items
  add column if not exists document_status text not null default 'draft';

alter table public.drive_items
  drop constraint if exists drive_items_document_status_check;

alter table public.drive_items
  add constraint drive_items_document_status_check
  check (
    document_status in (
      'draft',
      'in_review',
      'pending_validation',
      'approved',
      'archived',
      'scheduled_destruction'
    )
  );

alter table public.drive_items
  add column if not exists expires_at timestamptz;

alter table public.drive_items
  add column if not exists category text;

alter table public.drive_items
  add column if not exists tags text[] not null default '{}'::text[];

alter table public.drive_items
  add column if not exists linked_programme_id uuid;

alter table public.drive_items
  add column if not exists linked_project_id uuid;

create index if not exists idx_drive_items_workspace on public.drive_items(organization_id, workspace_id)
  where trashed_at is null;

create index if not exists idx_drive_items_doc_status on public.drive_items(organization_id, document_status)
  where trashed_at is null;

-- FK optionnelles programme / projet (schéma COYA)
do $$
begin
  if to_regclass('public.programmes') is not null then
    alter table public.drive_items
      drop constraint if exists drive_items_linked_programme_id_fkey;
    alter table public.drive_items
      add constraint drive_items_linked_programme_id_fkey
      foreign key (linked_programme_id) references public.programmes(id) on delete set null;
  end if;
exception when undefined_table then null;
end $$;

do $$
begin
  if to_regclass('public.projects') is not null then
    alter table public.drive_items
      drop constraint if exists drive_items_linked_project_id_fkey;
    alter table public.drive_items
      add constraint drive_items_linked_project_id_fkey
      foreign key (linked_project_id) references public.projects(id) on delete set null;
  end if;
exception when undefined_table then null;
end $$;

-- ---------------------------------------------------------------------------
-- Espaces documentaires
-- ---------------------------------------------------------------------------
create table if not exists public.drive_workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slug text not null,
  name text not null,
  workspace_type text not null default 'custom'
    check (workspace_type in ('department', 'program', 'project', 'custom')),
  department_id uuid,
  programme_id uuid,
  project_id uuid,
  root_folder_id uuid references public.drive_items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create index if not exists idx_drive_workspaces_org on public.drive_workspaces(organization_id);

do $$
begin
  if to_regclass('public.departments') is not null then
    alter table public.drive_workspaces
      drop constraint if exists drive_workspaces_department_id_fkey;
    alter table public.drive_workspaces
      add constraint drive_workspaces_department_id_fkey
      foreign key (department_id) references public.departments(id) on delete set null;
  end if;
exception when undefined_table then null;
end $$;

do $$
begin
  if to_regclass('public.programmes') is not null then
    alter table public.drive_workspaces
      drop constraint if exists drive_workspaces_programme_id_fkey;
    alter table public.drive_workspaces
      add constraint drive_workspaces_programme_id_fkey
      foreign key (programme_id) references public.programmes(id) on delete set null;
  end if;
exception when undefined_table then null;
end $$;

do $$
begin
  if to_regclass('public.projects') is not null then
    alter table public.drive_workspaces
      drop constraint if exists drive_workspaces_project_id_fkey;
    alter table public.drive_workspaces
      add constraint drive_workspaces_project_id_fkey
      foreign key (project_id) references public.projects(id) on delete set null;
  end if;
exception when undefined_table then null;
end $$;

do $$
begin
  if to_regprocedure('public.set_updated_at()') is not null then
    drop trigger if exists drive_workspaces_set_updated_at on public.drive_workspaces;
    create trigger drive_workspaces_set_updated_at
      before update on public.drive_workspaces
      for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.drive_items
  drop constraint if exists drive_items_workspace_id_fkey;

alter table public.drive_items
  add constraint drive_items_workspace_id_fkey
  foreign key (workspace_id) references public.drive_workspaces(id) on delete set null;

-- Cohérence organisation / workspace (trigger : CHECK sous-requête interdit)
create or replace function public.drive_items_enforce_workspace_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.workspace_id is not null then
    if not exists (
      select 1 from public.drive_workspaces w
      where w.id = new.workspace_id and w.organization_id = new.organization_id
    ) then
      raise exception 'drive_items: workspace_id ne correspond pas à organization_id';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists drive_items_enforce_workspace_org_trg on public.drive_items;
create trigger drive_items_enforce_workspace_org_trg
  before insert or update of workspace_id, organization_id on public.drive_items
  for each row execute function public.drive_items_enforce_workspace_org();

-- ---------------------------------------------------------------------------
-- Favoris
-- ---------------------------------------------------------------------------
create table if not exists public.drive_item_favorites (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  drive_item_id uuid not null references public.drive_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, drive_item_id)
);

create index if not exists idx_drive_item_favorites_item on public.drive_item_favorites(drive_item_id);

-- ---------------------------------------------------------------------------
-- ACL : indicateurs (conservés alignés sur viewer/editor pour le backend)
-- ---------------------------------------------------------------------------
alter table public.drive_item_acl
  add column if not exists can_view boolean not null default true;

alter table public.drive_item_acl
  add column if not exists can_edit boolean not null default false;

alter table public.drive_item_acl
  add column if not exists can_download boolean not null default true;

alter table public.drive_item_acl
  add column if not exists can_share boolean not null default false;

alter table public.drive_item_acl
  add column if not exists can_delete boolean not null default false;

update public.drive_item_acl a
set
  can_view = true,
  can_edit = (a.permission = 'editor'),
  can_download = true,
  can_share = (a.permission = 'editor'),
  can_delete = false
where true;

-- Fonctions vue / édition dossier : tenir compte des drapeaux ACL
create or replace function public.drive_folder_can_view(p_folder_id uuid, p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when p_folder_id is null or p_profile_id is null then false
    when not exists (
      select 1 from public.drive_items f
      join public.profiles pr on pr.id = p_profile_id
      where f.id = p_folder_id and f.item_type = 'folder' and f.organization_id = pr.organization_id
    ) then false
    when public.drive_is_org_admin_profile(p_profile_id) then true
    when exists (select 1 from public.drive_items f2 where f2.id = p_folder_id and f2.owner_profile_id = p_profile_id) then true
    when exists (
      select 1 from public.drive_items f3
      where f3.id = p_folder_id and f3.item_type = 'folder' and f3.visibility = 'org_public'
    ) then true
    when exists (
      select 1 from public.drive_item_acl a
      where a.drive_item_id = p_folder_id and a.profile_id = p_profile_id and coalesce(a.can_view, true)
    ) then true
    else false
  end;
$$;

create or replace function public.drive_folder_can_edit(p_folder_id uuid, p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when p_folder_id is null or p_profile_id is null then false
    when not exists (
      select 1 from public.drive_items f
      join public.profiles pr on pr.id = p_profile_id
      where f.id = p_folder_id and f.item_type = 'folder' and f.organization_id = pr.organization_id
    ) then false
    when public.drive_is_org_admin_profile(p_profile_id) then true
    when exists (select 1 from public.drive_items f2 where f2.id = p_folder_id and f2.owner_profile_id = p_profile_id) then true
    when exists (
      select 1 from public.drive_item_acl a
      where a.drive_item_id = p_folder_id and a.profile_id = p_profile_id and coalesce(a.can_edit, false)
    ) then true
    else false
  end;
$$;

grant execute on function public.drive_folder_can_view(uuid, uuid) to authenticated;
grant execute on function public.drive_folder_can_edit(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Demandes d’accès : champs GDS
-- ---------------------------------------------------------------------------
alter table public.drive_access_requests add column if not exists request_reason text;

alter table public.drive_access_requests add column if not exists requested_duration_days integer;

alter table public.drive_access_requests add column if not exists urgency text not null default 'normal';

alter table public.drive_access_requests
  drop constraint if exists drive_access_requests_urgency_check;

alter table public.drive_access_requests
  add constraint drive_access_requests_urgency_check
  check (urgency in ('low', 'normal', 'high'));

alter table public.drive_access_requests add column if not exists justification text;

alter table public.drive_access_requests add column if not exists reviewed_decision text;

alter table public.drive_access_requests
  drop constraint if exists drive_access_requests_reviewed_decision_check;

alter table public.drive_access_requests
  add constraint drive_access_requests_reviewed_decision_check
  check (
    reviewed_decision is null
    or reviewed_decision in ('approve', 'reject', 'temporary')
  );

alter table public.drive_access_requests add column if not exists grant_expires_at timestamptz;

create or replace function public.drive_access_requests_lock_payload_on_review()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'pending' and new.status in ('approved', 'rejected') then
    if new.organization_id is distinct from old.organization_id
       or new.drive_item_id is distinct from old.drive_item_id
       or new.requester_profile_id is distinct from old.requester_profile_id
       or new.permission_requested is distinct from old.permission_requested
       or new.message is distinct from old.message
       or new.request_reason is distinct from old.request_reason
       or new.justification is distinct from old.justification
       or new.urgency is distinct from old.urgency
       or new.requested_duration_days is distinct from old.requested_duration_days
    then
      raise exception 'drive_access_requests: modification du contenu interdite';
    end if;
  end if;
  return new;
end;
$$;

-- Notification module cohérent avec la clé UI coya_drive
create or replace function public.drive_notify_access(
  p_target_profile_id uuid,
  p_type text,
  p_action text,
  p_title text,
  p_message text,
  p_entity_id uuid,
  p_metadata jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if p_target_profile_id is null then
    return;
  end if;
  insert into public.notifications(
    user_id, message, type, module, action, title,
    entity_type, entity_id, entity_title, created_by, created_by_name, metadata, read, created_at
  )
  values (
    p_target_profile_id,
    coalesce(p_message, ''),
    coalesce(p_type, 'info'),
    'coya_drive',
    coalesce(p_action, 'updated'),
    coalesce(p_title, 'COYA Drive'),
    'drive_access_request',
    p_entity_id,
    null,
    public.drive_current_profile_id(),
    null,
    p_metadata,
    false,
    now()
  );
exception when undefined_table then
  null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Audit léger Drive
-- ---------------------------------------------------------------------------
create table if not exists public.drive_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  drive_item_id uuid references public.drive_items(id) on delete set null,
  actor_profile_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_drive_audit_org_created on public.drive_audit_events(organization_id, created_at desc);

alter table public.drive_audit_events enable row level security;

drop policy if exists drive_audit_events_select on public.drive_audit_events;
create policy drive_audit_events_select on public.drive_audit_events
  for select using (
    organization_id in (select p.organization_id from public.profiles p where p.user_id = auth.uid())
    and (
      actor_profile_id = public.drive_current_profile_id()
      or public.drive_is_org_admin_profile(public.drive_current_profile_id())
    )
  );

drop policy if exists drive_audit_events_insert on public.drive_audit_events;
create policy drive_audit_events_insert on public.drive_audit_events
  for insert with check (
    actor_profile_id = public.drive_current_profile_id()
    and organization_id in (select p.organization_id from public.profiles p where p.id = public.drive_current_profile_id())
  );

grant select, insert on table public.drive_audit_events to authenticated;
grant all on table public.drive_audit_events to service_role;

-- ---------------------------------------------------------------------------
-- RLS drive_workspaces
-- ---------------------------------------------------------------------------
alter table public.drive_workspaces enable row level security;

drop policy if exists drive_workspaces_select on public.drive_workspaces;
create policy drive_workspaces_select on public.drive_workspaces
  for select using (
    organization_id in (select p.organization_id from public.profiles p where p.user_id = auth.uid())
  );

drop policy if exists drive_workspaces_insert on public.drive_workspaces;
create policy drive_workspaces_insert on public.drive_workspaces
  for insert with check (
    public.drive_is_org_admin_profile(public.drive_current_profile_id())
    and organization_id in (select p.organization_id from public.profiles p where p.id = public.drive_current_profile_id())
  );

drop policy if exists drive_workspaces_update on public.drive_workspaces;
create policy drive_workspaces_update on public.drive_workspaces
  for update using (
    public.drive_is_org_admin_profile(public.drive_current_profile_id())
    and organization_id in (select p.organization_id from public.profiles p where p.id = public.drive_current_profile_id())
  );

drop policy if exists drive_workspaces_delete on public.drive_workspaces;
create policy drive_workspaces_delete on public.drive_workspaces
  for delete using (
    public.drive_is_org_admin_profile(public.drive_current_profile_id())
    and organization_id in (select p.organization_id from public.profiles p where p.id = public.drive_current_profile_id())
  );

grant select on table public.drive_workspaces to authenticated;
grant insert, update, delete on table public.drive_workspaces to authenticated;

-- ---------------------------------------------------------------------------
-- RLS favoris
-- ---------------------------------------------------------------------------
alter table public.drive_item_favorites enable row level security;

drop policy if exists drive_item_favorites_select on public.drive_item_favorites;
create policy drive_item_favorites_select on public.drive_item_favorites
  for select using (profile_id = public.drive_current_profile_id());

drop policy if exists drive_item_favorites_insert on public.drive_item_favorites;
create policy drive_item_favorites_insert on public.drive_item_favorites
  for insert with check (profile_id = public.drive_current_profile_id());

drop policy if exists drive_item_favorites_delete on public.drive_item_favorites;
create policy drive_item_favorites_delete on public.drive_item_favorites
  for delete using (profile_id = public.drive_current_profile_id());

grant select, insert, delete on table public.drive_item_favorites to authenticated;
grant all on table public.drive_item_favorites to service_role;

grant all on table public.drive_workspaces to service_role;

notify pgrst, 'reload schema';

commit;
