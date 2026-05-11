-- Programme Cockpit CQRS (P0) — read model snapshot + checkpoints
-- Contrat: programme_cockpit.v1 (model_version=1)

begin;

create table if not exists public.programme_cockpit_read_models (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  programme_id uuid not null references public.programmes(id) on delete cascade,
  schema_id text not null default 'programme_cockpit.v1',
  model_version int not null default 1,
  generated_at timestamptz not null default now(),
  watermark_event_occurred_at timestamptz null,
  watermark_source_updated_at timestamptz null,
  model jsonb not null default '{}'::jsonb,
  primary key (organization_id, programme_id)
);

comment on table public.programme_cockpit_read_models is 'Read-model CQRS (snapshot) du cockpit Programme (Programme & Projets).';

create index if not exists idx_programme_cockpit_generated_at
  on public.programme_cockpit_read_models (organization_id, generated_at desc);

alter table public.programme_cockpit_read_models enable row level security;

-- Lecture: membres de l'organisation (aligné RLS profiles.organization_id)
drop policy if exists programme_cockpit_select_org on public.programme_cockpit_read_models;
create policy programme_cockpit_select_org
  on public.programme_cockpit_read_models
  for select
  to authenticated
  using (
    organization_id in (
      select p.organization_id
      from public.profiles p
      where p.user_id = auth.uid()
        and p.organization_id is not null
    )
  );

-- Écriture: pas d'accès client (Edge Function/service_role uniquement).
-- NB: service_role bypass RLS, donc pas de policy INSERT/UPDATE.

-- Checkpoints projections (watermarks). P0: rebuild batch, P1: incrémental.
create table if not exists public.projection_checkpoints (
  projection_name text not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  programme_id uuid null references public.programmes(id) on delete cascade,
  last_built_at timestamptz not null default now(),
  last_event_occurred_at timestamptz null,
  watermark_position text null,
  metadata jsonb not null default '{}'::jsonb,
  primary key (projection_name, organization_id, programme_id)
);

comment on table public.projection_checkpoints is 'Watermarks / checkpoints de projections CQRS (Programme Cockpit, etc.).';

alter table public.projection_checkpoints enable row level security;

drop policy if exists projection_checkpoints_select_org on public.projection_checkpoints;
create policy projection_checkpoints_select_org
  on public.projection_checkpoints
  for select
  to authenticated
  using (
    organization_id in (
      select p.organization_id
      from public.profiles p
      where p.user_id = auth.uid()
        and p.organization_id is not null
    )
  );

commit;

