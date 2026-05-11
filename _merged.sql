-- =============================================================================
-- COYA — Parc auto phase 2 : catalogue extensible (RLS insert), photos véhicules,
-- prestataires / véhicules externes, demandes transport enrichies (itinéraire,
-- pièces jointes mission/facture, tarification, planning), traçabilité statuts.
-- =============================================================================
-- Manuel Storage : bucket fleet-files créé ici ; ajuster file_size_limit si besoin.
-- Seed massif marques/modèles : voir data/README.txt et scripts/seed-vehicle-catalog.mjs
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Catalogue : permettre plusieurs lignes même nom de modèle si années différentes
-- ---------------------------------------------------------------------------
alter table public.vehicle_catalog_models
  drop constraint if exists vehicle_catalog_models_brand_name_unique;

create unique index if not exists vehicle_catalog_models_brand_name_years_uidx
  on public.vehicle_catalog_models (
    brand_id,
    name,
    coalesce(year_from, -32768),
    coalesce(year_to, 32767)
  );

-- ---------------------------------------------------------------------------
-- RLS catalogue : insertion / mise à jour réservées aux rôles gestion parc (managers)
-- ---------------------------------------------------------------------------
drop policy if exists vehicle_catalog_brands_insert_fleet on public.vehicle_catalog_brands;
create policy vehicle_catalog_brands_insert_fleet
  on public.vehicle_catalog_brands for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and coalesce(p.role, '') in ('super_administrator', 'administrator', 'manager')
    )
  );

drop policy if exists vehicle_catalog_brands_update_fleet on public.vehicle_catalog_brands;
create policy vehicle_catalog_brands_update_fleet
  on public.vehicle_catalog_brands for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and coalesce(p.role, '') in ('super_administrator', 'administrator', 'manager')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and coalesce(p.role, '') in ('super_administrator', 'administrator', 'manager')
    )
  );

drop policy if exists vehicle_catalog_models_insert_fleet on public.vehicle_catalog_models;
create policy vehicle_catalog_models_insert_fleet
  on public.vehicle_catalog_models for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and coalesce(p.role, '') in ('super_administrator', 'administrator', 'manager')
    )
  );

drop policy if exists vehicle_catalog_models_update_fleet on public.vehicle_catalog_models;
create policy vehicle_catalog_models_update_fleet
  on public.vehicle_catalog_models for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and coalesce(p.role, '') in ('super_administrator', 'administrator', 'manager')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and coalesce(p.role, '') in ('super_administrator', 'administrator', 'manager')
    )
  );

create index if not exists idx_vehicle_catalog_brands_name_lower on public.vehicle_catalog_brands (lower(name));

-- ---------------------------------------------------------------------------
-- Photos véhicules (slots prédéfinis + extras)
-- ---------------------------------------------------------------------------
create table if not exists public.vehicle_photos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  slot text not null check (
    slot in (
      'avant',
      'arriere',
      'interieur',
      'cockpit',
      'bagages',
      'extra_1',
      'extra_2',
      'extra_3',
      'extra_4',
      'extra_5'
    )
  ),
  storage_path text not null,
  uploaded_at timestamptz not null default now(),
  uploaded_by_profile_id uuid references public.profiles(id) on delete set null,
  constraint vehicle_photos_vehicle_slot_unique unique (vehicle_id, slot)
);

create index if not exists idx_vehicle_photos_org_vehicle on public.vehicle_photos(organization_id, vehicle_id);

alter table public.vehicle_photos enable row level security;

drop policy if exists vehicle_photos_select_org on public.vehicle_photos;
create policy vehicle_photos_select_org
  on public.vehicle_photos for select to authenticated
  using (
    organization_id = (select organization_id from public.profiles where user_id = auth.uid())
  );

drop policy if exists vehicle_photos_write_fleet on public.vehicle_photos;
create policy vehicle_photos_write_fleet
  on public.vehicle_photos for all to authenticated
  using (
    organization_id = (select organization_id from public.profiles where user_id = auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and coalesce(p.role, '') in ('super_administrator', 'administrator', 'manager')
    )
  )
  with check (
    organization_id = (select organization_id from public.profiles where user_id = auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and coalesce(p.role, '') in ('super_administrator', 'administrator', 'manager')
    )
  );

-- ---------------------------------------------------------------------------
-- Prestataires transport & véhicules catalogués chez le partenaire
-- ---------------------------------------------------------------------------
create table if not exists public.transport_partner_companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_email text,
  phone text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transport_partners_org on public.transport_partner_companies(organization_id);

alter table public.transport_partner_companies enable row level security;

drop policy if exists transport_partners_select_org on public.transport_partner_companies;
create policy transport_partners_select_org
  on public.transport_partner_companies for select to authenticated
  using (
    organization_id = (select organization_id from public.profiles where user_id = auth.uid())
  );

drop policy if exists transport_partners_write_fleet on public.transport_partner_companies;
create policy transport_partners_write_fleet
  on public.transport_partner_companies for all to authenticated
  using (
    organization_id = (select organization_id from public.profiles where user_id = auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and coalesce(p.role, '') in ('super_administrator', 'administrator', 'manager')
    )
  )
  with check (
    organization_id = (select organization_id from public.profiles where user_id = auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and coalesce(p.role, '') in ('super_administrator', 'administrator', 'manager')
    )
  );

create table if not exists public.transport_partner_vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  partner_company_id uuid not null references public.transport_partner_companies(id) on delete cascade,
  label text not null,
  plate_number text,
  seats smallint,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_partner_vehicles_org on public.transport_partner_vehicles(organization_id);
create index if not exists idx_partner_vehicles_partner on public.transport_partner_vehicles(partner_company_id);

alter table public.transport_partner_vehicles enable row level security;

drop policy if exists partner_vehicles_select_org on public.transport_partner_vehicles;
create policy partner_vehicles_select_org
  on public.transport_partner_vehicles for select to authenticated
  using (
    organization_id = (select organization_id from public.profiles where user_id = auth.uid())
  );

drop policy if exists partner_vehicles_write_fleet on public.transport_partner_vehicles;
create policy partner_vehicles_write_fleet
  on public.transport_partner_vehicles for all to authenticated
  using (
    organization_id = (select organization_id from public.profiles where user_id = auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and coalesce(p.role, '') in ('super_administrator', 'administrator', 'manager')
    )
  )
  with check (
    organization_id = (select organization_id from public.profiles where user_id = auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and coalesce(p.role, '') in ('super_administrator', 'administrator', 'manager')
    )
  );

-- ---------------------------------------------------------------------------
-- Demandes transport : mode interne / prestataire, planning, tarifs, pièces jointes
-- ---------------------------------------------------------------------------
alter table public.vehicle_requests
  alter column vehicle_id drop not null;

alter table public.vehicle_requests
  add column if not exists transport_mode text not null default 'internal'
    check (transport_mode in ('internal', 'partner')),
  add column if not exists partner_vehicle_id uuid references public.transport_partner_vehicles(id) on delete set null,
  add column if not exists route_origin text,
  add column if not exists route_destination text,
  add column if not exists route_waypoints jsonb not null default '[]'::jsonb,
  add column if not exists mission_order_storage_path text,
  add column if not exists start_at timestamptz,
  add column if not exists end_at timestamptz,
  add column if not exists quoted_price_cents bigint,
  add column if not exists price_breakdown jsonb not null default '{}'::jsonb,
  add column if not exists payment_status text not null default 'not_invoiced'
    check (payment_status in ('not_invoiced', 'pending_payment', 'paid', 'settled')),
  add column if not exists invoice_storage_path text,
  add column if not exists invoice_number text,
  add column if not exists invoice_metadata jsonb not null default '{}'::jsonb,
  add column if not exists n1_validated_by_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists n1_validated_at timestamptz,
  add column if not exists fleet_validated_by_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists fleet_validated_at timestamptz,
  add column if not exists allocated_by_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists rejected_by_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists rejected_at timestamptz,
  add column if not exists released_at timestamptz;

alter table public.vehicle_requests drop constraint if exists vehicle_requests_transport_xor_check;
alter table public.vehicle_requests
  add constraint vehicle_requests_transport_xor_check check (
    (transport_mode = 'internal' and vehicle_id is not null and partner_vehicle_id is null)
    or (transport_mode = 'partner' and partner_vehicle_id is not null and vehicle_id is null)
  );

alter table public.vehicle_requests drop constraint if exists vehicle_requests_invoice_when_paid_check;
alter table public.vehicle_requests
  add constraint vehicle_requests_invoice_when_paid_check check (
    payment_status not in ('paid', 'settled')
    or (
      invoice_storage_path is not null
      and length(trim(invoice_storage_path)) > 0
    )
  );

create index if not exists idx_vehicle_requests_transport_mode on public.vehicle_requests(organization_id, transport_mode);
create index if not exists idx_vehicle_requests_start_at on public.vehicle_requests(organization_id, start_at);

-- ---------------------------------------------------------------------------
-- Historique des transitions de statut (audit métier détaillé)
-- ---------------------------------------------------------------------------
create table if not exists public.vehicle_request_status_transitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vehicle_request_id uuid not null references public.vehicle_requests(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_vreq_transitions_req on public.vehicle_request_status_transitions(vehicle_request_id, created_at desc);

alter table public.vehicle_request_status_transitions enable row level security;

drop policy if exists vreq_transitions_select_org on public.vehicle_request_status_transitions;
create policy vreq_transitions_select_org
  on public.vehicle_request_status_transitions for select to authenticated
  using (
    organization_id = (select organization_id from public.profiles where user_id = auth.uid())
  );

drop policy if exists vreq_transitions_insert_system on public.vehicle_request_status_transitions;
create policy vreq_transitions_insert_system
  on public.vehicle_request_status_transitions for insert to authenticated
  with check (
    organization_id = (select organization_id from public.profiles where user_id = auth.uid())
    and actor_profile_id = (select id from public.profiles where user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Triggers : audit colonnes + journal transitions (après coup pour voir NEW complet)
-- ---------------------------------------------------------------------------
create or replace function public.vehicle_requests_transition_audit_before()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
begin
  if tg_op <> 'update' then
    return new;
  end if;
  select id into actor from public.profiles where user_id = auth.uid() limit 1;
  if old.status is distinct from new.status then
    if new.status = 'pending_fleet' and old.status = 'pending_n1' then
      new.n1_validated_by_profile_id := coalesce(actor, new.n1_validated_by_profile_id);
      new.n1_validated_at := coalesce(new.n1_validated_at, now());
    elsif new.status = 'validated' and old.status = 'pending_fleet' then
      new.fleet_validated_by_profile_id := coalesce(actor, new.fleet_validated_by_profile_id);
      new.fleet_validated_at := coalesce(new.fleet_validated_at, now());
    elsif new.status = 'allocated' and old.status = 'validated' then
      new.allocated_by_profile_id := coalesce(actor, new.allocated_by_profile_id);
      new.released_at := coalesce(new.released_at, now());
      new.allocated_at := coalesce(new.allocated_at, now());
    elsif new.status = 'returned' then
      new.return_at := coalesce(new.return_at, now());
    elsif new.status = 'rejected' then
      new.rejected_by_profile_id := coalesce(actor, new.rejected_by_profile_id);
      new.rejected_at := coalesce(new.rejected_at, now());
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_vehicle_requests_transition_audit_before on public.vehicle_requests;
create trigger trg_vehicle_requests_transition_audit_before
  before update on public.vehicle_requests
  for each row
  execute procedure public.vehicle_requests_transition_audit_before();

create or replace function public.vehicle_requests_log_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
begin
  if tg_op = 'update' and old.status is distinct from new.status then
    select id into actor from public.profiles where user_id = auth.uid() limit 1;
    insert into public.vehicle_request_status_transitions (
      organization_id,
      vehicle_request_id,
      from_status,
      to_status,
      actor_profile_id,
      meta
    ) values (
      new.organization_id,
      new.id,
      old.status,
      new.status,
      actor,
      '{}'::jsonb
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_vehicle_requests_log_status_transition on public.vehicle_requests;
create trigger trg_vehicle_requests_log_status_transition
  after update on public.vehicle_requests
  for each row
  execute procedure public.vehicle_requests_log_status_transition();

revoke all on function public.vehicle_requests_transition_audit_before() from public;
grant execute on function public.vehicle_requests_transition_audit_before() to authenticated;
revoke all on function public.vehicle_requests_log_status_transition() from public;
grant execute on function public.vehicle_requests_log_status_transition() to authenticated;

-- ---------------------------------------------------------------------------
-- Bucket Storage parc / transport (préfixe organization_id)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values (
  'fleet-files',
  'fleet-files',
  false,
  52428800
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists fleet_files_select_authenticated on storage.objects;
create policy fleet_files_select_authenticated
on storage.objects for select
to authenticated
using (bucket_id = 'fleet-files');

drop policy if exists fleet_files_insert_own_org on storage.objects;
create policy fleet_files_insert_own_org
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'fleet-files'
  and exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and split_part(name, '/', 1) = p.organization_id::text
  )
);

drop policy if exists fleet_files_update_own_org on storage.objects;
create policy fleet_files_update_own_org
on storage.objects for update
to authenticated
using (
  bucket_id = 'fleet-files'
  and exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and split_part(name, '/', 1) = p.organization_id::text
  )
);

drop policy if exists fleet_files_delete_own_org on storage.objects;
create policy fleet_files_delete_own_org
on storage.objects for delete
to authenticated
using (
  bucket_id = 'fleet-files'
  and exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and split_part(name, '/', 1) = p.organization_id::text
  )
);

-- Flotte : permettre encore les MAJ après retour (facture / paiement).
drop policy if exists "vehicle_requests_update_fleet_roles" on public.vehicle_requests;
create policy "vehicle_requests_update_fleet_roles"
  on public.vehicle_requests for update to authenticated
  using (
    status in ('pending_fleet', 'validated', 'allocated', 'returned')
    and organization_id = (select organization_id from public.profiles where user_id = auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('super_administrator', 'administrator', 'manager')
    )
  )
  with check (
    organization_id = (select organization_id from public.profiles where user_id = auth.uid())
  );

commit;
