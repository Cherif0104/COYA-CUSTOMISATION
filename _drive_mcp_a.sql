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
commit;
