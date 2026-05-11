-- =============================================================================
-- COYA — Studio, CRM interactions, taxonomie équipements logistique.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Logistique : référentiel structuré des catégories d'équipements.
-- ---------------------------------------------------------------------------
create table if not exists public.logistics_equipment_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  icon text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint logistics_equipment_categories_scope_slug_unique unique (organization_id, slug)
);

alter table public.equipments
  add column if not exists equipment_category_id uuid references public.logistics_equipment_categories(id) on delete set null;

create index if not exists idx_equipments_category on public.equipments(organization_id, equipment_category_id);

insert into public.logistics_equipment_categories (organization_id, name, slug, description, icon, sort_order)
values
  (null, 'Informatique', 'informatique', 'Ordinateurs, écrans, accessoires et périphériques.', 'fas fa-laptop', 10),
  (null, 'Bureau', 'bureau', 'Mobilier, fournitures et équipements de bureau.', 'fas fa-briefcase', 20),
  (null, 'Audiovisuel', 'audiovisuel', 'Caméras, micros, lumières, régie et captation.', 'fas fa-video', 30),
  (null, 'Énergie', 'energie', 'Groupes, onduleurs, batteries et multiprises.', 'fas fa-bolt', 40),
  (null, 'Terrain', 'terrain', 'Kits terrain, EPI, tablettes et matériel de mission.', 'fas fa-map-marked-alt', 50),
  (null, 'Stock consommable', 'stock-consommable', 'Articles consommables suivis par seuil.', 'fas fa-box-open', 60)
on conflict (organization_id, slug) do nothing;

alter table public.logistics_equipment_categories enable row level security;

drop policy if exists logistics_equipment_categories_select on public.logistics_equipment_categories;
create policy logistics_equipment_categories_select
  on public.logistics_equipment_categories for select to authenticated
  using (
    organization_id is null
    or organization_id = (select organization_id from public.profiles where user_id = auth.uid())
  );

drop policy if exists logistics_equipment_categories_write on public.logistics_equipment_categories;
create policy logistics_equipment_categories_write
  on public.logistics_equipment_categories for all to authenticated
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
-- CRM : journal d'interactions + statut workflow exploitable par automatisation.
-- ---------------------------------------------------------------------------
alter table public.contacts
  add column if not exists workflow_status text not null default 'new',
  add column if not exists workflow_updated_at timestamptz;

create index if not exists idx_contacts_workflow_status
  on public.contacts(organization_id, workflow_status);

create table if not exists public.crm_interactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  channel text not null default 'note'
    check (channel in ('note', 'email', 'phone', 'whatsapp', 'meeting', 'studio_quote', 'studio_invoice', 'system')),
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_interactions_contact_created
  on public.crm_interactions(contact_id, created_at desc);
create index if not exists idx_crm_interactions_org_created
  on public.crm_interactions(organization_id, created_at desc);

alter table public.crm_interactions enable row level security;

drop policy if exists crm_interactions_select_org on public.crm_interactions;
create policy crm_interactions_select_org
  on public.crm_interactions for select to authenticated
  using (organization_id = (select organization_id from public.profiles where user_id = auth.uid()));

drop policy if exists crm_interactions_insert_org on public.crm_interactions;
create policy crm_interactions_insert_org
  on public.crm_interactions for insert to authenticated
  with check (
    organization_id = (select organization_id from public.profiles where user_id = auth.uid())
    and (created_by is null or created_by = auth.uid())
  );

drop policy if exists crm_interactions_update_author_or_manager on public.crm_interactions;
create policy crm_interactions_update_author_or_manager
  on public.crm_interactions for update to authenticated
  using (
    organization_id = (select organization_id from public.profiles where user_id = auth.uid())
    and (
      created_by = auth.uid()
      or exists (
        select 1 from public.profiles p
        where p.user_id = auth.uid()
          and coalesce(p.role, '') in ('super_administrator', 'administrator', 'manager')
      )
    )
  )
  with check (organization_id = (select organization_id from public.profiles where user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Studio : sites, assets, équipe, investissements, prix, demandes, documents.
-- ---------------------------------------------------------------------------
create table if not exists public.studio_sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text,
  address text,
  city text,
  country text,
  status text not null default 'active' check (status in ('active', 'maintenance', 'closed')),
  responsible_profile_id uuid references public.profiles(id) on delete set null,
  default_useful_life_years numeric(8,2) not null default 5,
  default_salvage_value_cents bigint not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint studio_sites_org_code_unique unique (organization_id, code)
);

create table if not exists public.studio_responsible_persons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  email text,
  phone text,
  role text not null default 'responsable',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  studio_site_id uuid references public.studio_sites(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  role text not null,
  starts_at date not null default current_date,
  ends_at date,
  hourly_rate_cents bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  studio_site_id uuid references public.studio_sites(id) on delete set null,
  name text not null,
  category text not null default 'equipment',
  brand text,
  model text,
  serial_number text,
  asset_reference text,
  acquisition_date date not null default current_date,
  purchase_cost_cents bigint not null default 0,
  salvage_value_cents bigint not null default 0,
  useful_life_years numeric(8,2) not null default 5,
  status text not null default 'active' check (status in ('active', 'maintenance', 'retired', 'lost')),
  custodian_profile_id uuid references public.profiles(id) on delete set null,
  contract_storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint studio_assets_org_ref_unique unique (organization_id, asset_reference)
);

create table if not exists public.studio_investment_ledger (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  studio_asset_id uuid references public.studio_assets(id) on delete set null,
  entry_date date not null default current_date,
  entry_type text not null default 'purchase' check (entry_type in ('purchase', 'upgrade', 'maintenance', 'repair', 'grant', 'disposal')),
  amount_cents bigint not null default 0,
  currency text not null default 'XOF',
  vendor_name text,
  invoice_storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_pricing_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  studio_site_id uuid references public.studio_sites(id) on delete cascade,
  studio_asset_id uuid references public.studio_assets(id) on delete set null,
  name text not null,
  unit text not null default 'hour' check (unit in ('hour', 'day', 'session', 'project')),
  base_price_cents bigint not null default 0,
  currency text not null default 'XOF',
  min_quantity numeric(12,2) not null default 1,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_bookings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  studio_site_id uuid references public.studio_sites(id) on delete set null,
  requester_contact_id uuid references public.contacts(id) on delete set null,
  requester_profile_id uuid references public.profiles(id) on delete set null,
  status text not null default 'requested' check (status in ('requested', 'quoted', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  purpose text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_quotes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  studio_booking_id uuid references public.studio_bookings(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  quote_number text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  total_cents bigint not null default 0,
  currency text not null default 'XOF',
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint studio_quotes_org_number_unique unique (organization_id, quote_number)
);

create table if not exists public.studio_contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  studio_quote_id uuid references public.studio_quotes(id) on delete set null,
  studio_booking_id uuid references public.studio_bookings(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  contract_number text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'signed', 'active', 'closed', 'cancelled')),
  signed_at timestamptz,
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint studio_contracts_org_number_unique unique (organization_id, contract_number)
);

create table if not exists public.studio_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  studio_contract_id uuid references public.studio_contracts(id) on delete set null,
  studio_quote_id uuid references public.studio_quotes(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  invoice_number text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'partially_paid', 'paid', 'cancelled', 'overdue')),
  total_cents bigint not null default 0,
  currency text not null default 'XOF',
  issued_at date,
  due_at date,
  paid_at timestamptz,
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint studio_invoices_org_number_unique unique (organization_id, invoice_number)
);

create table if not exists public.studio_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subject_type text not null,
  subject_id uuid,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace view public.studio_asset_depreciation_projection
with (security_invoker = true) as
select
  a.id as studio_asset_id,
  a.organization_id,
  a.studio_site_id,
  a.name,
  a.acquisition_date,
  a.purchase_cost_cents,
  a.salvage_value_cents,
  a.useful_life_years,
  greatest(a.purchase_cost_cents - a.salvage_value_cents, 0)::bigint as depreciable_amount_cents,
  greatest(round((a.purchase_cost_cents - a.salvage_value_cents)::numeric / nullif(a.useful_life_years, 0)), 0)::bigint as annual_depreciation_cents,
  greatest(round((a.purchase_cost_cents - a.salvage_value_cents)::numeric / nullif(a.useful_life_years * 12, 0)), 0)::bigint as monthly_depreciation_cents,
  greatest(
    0,
    (date_part('year', age(current_date, a.acquisition_date))::int * 12)
      + date_part('month', age(current_date, a.acquisition_date))::int
  ) as elapsed_months,
  least(
    greatest(a.purchase_cost_cents - a.salvage_value_cents, 0),
    greatest(
      0,
      (date_part('year', age(current_date, a.acquisition_date))::int * 12)
        + date_part('month', age(current_date, a.acquisition_date))::int
    ) * greatest(round((a.purchase_cost_cents - a.salvage_value_cents)::numeric / nullif(a.useful_life_years * 12, 0)), 0)
  )::bigint as accumulated_depreciation_cents,
  greatest(
    a.purchase_cost_cents - least(
      greatest(a.purchase_cost_cents - a.salvage_value_cents, 0),
      greatest(
        0,
        (date_part('year', age(current_date, a.acquisition_date))::int * 12)
          + date_part('month', age(current_date, a.acquisition_date))::int
      ) * greatest(round((a.purchase_cost_cents - a.salvage_value_cents)::numeric / nullif(a.useful_life_years * 12, 0)), 0)
    ),
    a.salvage_value_cents
  )::bigint as net_book_value_cents
from public.studio_assets a;

create index if not exists idx_studio_sites_org on public.studio_sites(organization_id);
create index if not exists idx_studio_assets_org_site on public.studio_assets(organization_id, studio_site_id);
create index if not exists idx_studio_ledger_org_asset on public.studio_investment_ledger(organization_id, studio_asset_id);
create index if not exists idx_studio_pricing_org_site on public.studio_pricing_rules(organization_id, studio_site_id);
create index if not exists idx_studio_bookings_org_status on public.studio_bookings(organization_id, status);
create index if not exists idx_studio_quotes_org_status on public.studio_quotes(organization_id, status);
create index if not exists idx_studio_contracts_org_status on public.studio_contracts(organization_id, status);
create index if not exists idx_studio_invoices_org_status on public.studio_invoices(organization_id, status);
create index if not exists idx_studio_audit_org_created on public.studio_audit_events(organization_id, created_at desc);

do $$
declare
  t text;
  tables text[] := array[
    'studio_sites',
    'studio_responsible_persons',
    'studio_staff_assignments',
    'studio_assets',
    'studio_investment_ledger',
    'studio_pricing_rules',
    'studio_bookings',
    'studio_quotes',
    'studio_contracts',
    'studio_invoices',
    'studio_audit_events'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select_org', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (organization_id = (select organization_id from public.profiles where user_id = auth.uid()))',
      t || '_select_org',
      t
    );
    execute format('drop policy if exists %I on public.%I', t || '_write_managers', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (
        organization_id = (select organization_id from public.profiles where user_id = auth.uid())
        and exists (
          select 1 from public.profiles p
          where p.user_id = auth.uid()
            and coalesce(p.role, '''') in (''super_administrator'', ''administrator'', ''manager'', ''producer'')
        )
      ) with check (
        organization_id = (select organization_id from public.profiles where user_id = auth.uid())
        and exists (
          select 1 from public.profiles p
          where p.user_id = auth.uid()
            and coalesce(p.role, '''') in (''super_administrator'', ''administrator'', ''manager'', ''producer'')
        )
      )',
      t || '_write_managers',
      t
    );
  end loop;
end $$;

grant select on public.studio_asset_depreciation_projection to authenticated;

commit;
