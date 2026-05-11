-- COYA Drive : demandes d'accès (pending / approved / rejected), limite bucket 100 MiB, métadonnées pour lien de demande.
-- Limite fichier : 100 × 1024 × 1024 octets (interprétation standard « 100 Mo » = mébioctets).

begin;

-- ---------------------------------------------------------------------------
-- Bucket : 100 MiB (était 50 MiB dans la migration initiale drive-files)
-- ---------------------------------------------------------------------------
update storage.buckets
set file_size_limit = 104857600
where id = 'drive-files';

insert into storage.buckets (id, name, public, file_size_limit)
select 'drive-files', 'drive-files', true, 104857600
where not exists (select 1 from storage.buckets where id = 'drive-files');

-- ---------------------------------------------------------------------------
-- Table demandes d'accès
-- ---------------------------------------------------------------------------
create table if not exists public.drive_access_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  drive_item_id uuid not null references public.drive_items(id) on delete cascade,
  requester_profile_id uuid not null references public.profiles(id) on delete cascade,
  permission_requested text not null default 'viewer' check (permission_requested in ('viewer', 'editor')),
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by_profile_id uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_drive_access_requests_org_status on public.drive_access_requests(organization_id, status);
create index if not exists idx_drive_access_requests_requester on public.drive_access_requests(requester_profile_id, created_at desc);

create unique index if not exists idx_drive_access_requests_one_pending
  on public.drive_access_requests(drive_item_id, requester_profile_id)
  where status = 'pending';

do $$
begin
  if to_regprocedure('public.set_updated_at()') is not null then
    drop trigger if exists drive_access_requests_set_updated_at on public.drive_access_requests;
    create trigger drive_access_requests_set_updated_at
      before update on public.drive_access_requests
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC : métadonnées minimales pour formulaire « demander l'accès » (même org, non corbeille)
-- ---------------------------------------------------------------------------
create or replace function public.drive_item_meta_for_access_request(p_item_id uuid)
returns table (
  id uuid,
  name text,
  item_type text,
  organization_id uuid
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select di.id, di.name, di.item_type, di.organization_id
  from public.drive_items di
  join public.profiles pr on pr.user_id = auth.uid()
  where di.id = p_item_id
    and di.organization_id = pr.organization_id
    and di.trashed_at is null;
$$;

grant execute on function public.drive_item_meta_for_access_request(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------
create or replace function public.drive_access_request_can_review(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.drive_access_requests r
    where r.id = p_request_id
      and public.drive_folder_can_edit(
        public.drive_item_acl_folder_id(r.drive_item_id),
        public.drive_current_profile_id()
      )
  );
$$;

grant execute on function public.drive_access_request_can_review(uuid) to authenticated;

create or replace function public.drive_access_request_select_allowed(p_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.drive_access_requests r
    join public.profiles pr on pr.id = public.drive_current_profile_id()
    where r.id = p_request_id
      and r.organization_id = pr.organization_id
      and (
        r.requester_profile_id = pr.id
        or public.drive_access_request_can_review(r.id)
        or public.drive_is_org_admin_profile(pr.id)
      )
  );
$$;

grant execute on function public.drive_access_request_select_allowed(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Notifications (pattern DAF)
-- ---------------------------------------------------------------------------
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
    'knowledge',
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

grant execute on function public.drive_notify_access(uuid, text, text, text, text, uuid, jsonb) to authenticated;

-- Revue : reviewed_at / reviewed_by
create or replace function public.drive_access_requests_before_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.status in ('approved', 'rejected') and old.status = 'pending' then
    new.reviewed_at := coalesce(new.reviewed_at, now());
    new.reviewed_by_profile_id := coalesce(new.reviewed_by_profile_id, public.drive_current_profile_id());
  end if;
  return new;
end;
$$;

drop trigger if exists drive_access_requests_before_review on public.drive_access_requests;
create trigger drive_access_requests_before_review
  before update on public.drive_access_requests
  for each row execute function public.drive_access_requests_before_review();

-- Appliquer ACL + notifier après décision
create or replace function public.drive_access_requests_after_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_folder uuid;
  v_item_name text;
begin
  if tg_op <> 'UPDATE' or old.status <> 'pending' then
    return new;
  end if;

  if new.status = 'approved' then
    v_folder := public.drive_item_acl_folder_id(new.drive_item_id);
    insert into public.drive_item_acl (drive_item_id, profile_id, permission)
    values (v_folder, new.requester_profile_id, new.permission_requested)
    on conflict (drive_item_id, profile_id) do update set permission = excluded.permission;

    select di.name into v_item_name from public.drive_items di where di.id = new.drive_item_id limit 1;
    perform public.drive_notify_access(
      new.requester_profile_id,
      'success',
      'approved',
      'COYA Drive — accès approuvé',
      format('Vous disposez maintenant d''un accès (%s) sur « %s ».', new.permission_requested, coalesce(v_item_name, 'élément')),
      new.id,
      jsonb_build_object('driveItemId', new.drive_item_id, 'requestId', new.id)
    );
  elsif new.status = 'rejected' then
    select di.name into v_item_name from public.drive_items di where di.id = new.drive_item_id limit 1;
    perform public.drive_notify_access(
      new.requester_profile_id,
      'warning',
      'rejected',
      'COYA Drive — accès refusé',
      format('Votre demande d''accès pour « %s » a été refusée.', coalesce(v_item_name, 'élément')),
      new.id,
      jsonb_build_object('driveItemId', new.drive_item_id, 'requestId', new.id)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists drive_access_requests_after_decision on public.drive_access_requests;
create trigger drive_access_requests_after_decision
  after update on public.drive_access_requests
  for each row execute function public.drive_access_requests_after_decision();

-- Notifier le propriétaire du dossier cible à la création d’une demande
create or replace function public.drive_access_requests_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_folder uuid;
  v_owner uuid;
  v_req_name text;
begin
  v_folder := public.drive_item_acl_folder_id(new.drive_item_id);
  select f.owner_profile_id into v_owner from public.drive_items f where f.id = v_folder and f.item_type = 'folder' limit 1;
  select coalesce(p.full_name, p.email, 'Un collègue') into v_req_name
  from public.profiles p where p.id = new.requester_profile_id limit 1;

  if v_owner is not null and v_owner <> new.requester_profile_id then
    perform public.drive_notify_access(
      v_owner,
      'info',
      'submitted',
      'COYA Drive — demande d''accès',
      format('%s demande un accès %s sur un élément de votre espace.', v_req_name, new.permission_requested),
      new.id,
      jsonb_build_object('driveItemId', new.drive_item_id, 'requestId', new.id)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists drive_access_requests_after_insert on public.drive_access_requests;
create trigger drive_access_requests_after_insert
  after insert on public.drive_access_requests
  for each row execute function public.drive_access_requests_after_insert();

-- ---------------------------------------------------------------------------
-- RLS drive_access_requests
-- ---------------------------------------------------------------------------
alter table public.drive_access_requests enable row level security;

drop policy if exists drive_access_requests_select on public.drive_access_requests;
create policy drive_access_requests_select on public.drive_access_requests
  for select using (public.drive_access_request_select_allowed(id));

drop policy if exists drive_access_requests_insert on public.drive_access_requests;
create policy drive_access_requests_insert on public.drive_access_requests
  for insert with check (
    requester_profile_id = public.drive_current_profile_id()
    and public.drive_item_user_belongs_to_org(organization_id)
    and exists (
      select 1 from public.drive_items di
      where di.id = drive_item_id and di.organization_id = organization_id and di.trashed_at is null
    )
    and not public.drive_folder_can_view(
      public.drive_item_acl_folder_id(drive_item_id),
      public.drive_current_profile_id()
    )
  );

drop policy if exists drive_access_requests_update on public.drive_access_requests;
create policy drive_access_requests_update on public.drive_access_requests
  for update
  using (
    status = 'pending'
    and public.drive_access_request_can_review(id)
  )
  with check (
    status in ('approved', 'rejected')
  );

-- Empêche la modification du corps de la demande lors du passage à approved/rejected
create or replace function public.drive_access_requests_lock_payload_on_review()
returns trigger
language plpgsql
as $$
begin
  if new.organization_id is distinct from old.organization_id
     or new.drive_item_id is distinct from old.drive_item_id
     or new.requester_profile_id is distinct from old.requester_profile_id
     or new.permission_requested is distinct from old.permission_requested
     or new.message is distinct from old.message
  then
    raise exception 'drive_access_requests: modification du contenu interdite';
  end if;
  return new;
end;
$$;

drop trigger if exists drive_access_requests_lock_payload on public.drive_access_requests;
create trigger drive_access_requests_lock_payload
  before update on public.drive_access_requests
  for each row
  when (old.status = 'pending' and new.status in ('approved', 'rejected'))
  execute function public.drive_access_requests_lock_payload_on_review();

grant select, insert, update on table public.drive_access_requests to authenticated;
grant all on table public.drive_access_requests to service_role;

notify pgrst, 'reload schema';

commit;
