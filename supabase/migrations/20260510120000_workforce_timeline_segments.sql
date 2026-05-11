-- Segments de timeline Workforce (une ligne par événement canonique ou segment matérialisé).
-- Consolidation multi-intervalle côté app / read-model : fusion des chevauchements (voir sessionConsolidationEngine).

begin;

create table if not exists public.workforce_timeline_segments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  worker_id text not null,
  segment_kind text not null,
  operational_context text,
  device_ref jsonb default '{}'::jsonb,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  source_client_event_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint workforce_timeline_segments_org_worker_event_unique
    unique (organization_id, worker_id, source_client_event_id)
);

create index if not exists idx_workforce_timeline_segments_org_worker_started
  on public.workforce_timeline_segments (organization_id, worker_id, started_at desc);

create index if not exists idx_workforce_timeline_segments_org_started
  on public.workforce_timeline_segments (organization_id, started_at desc);

comment on table public.workforce_timeline_segments is 'Segments timeline COYA (Workforce OS) — base pour consolidation multi-device.';

alter table public.workforce_timeline_segments enable row level security;

drop policy if exists workforce_timeline_segments_select_org on public.workforce_timeline_segments;
create policy workforce_timeline_segments_select_org
  on public.workforce_timeline_segments
  for select
  to authenticated
  using (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

drop policy if exists workforce_timeline_segments_insert_own on public.workforce_timeline_segments;
create policy workforce_timeline_segments_insert_own
  on public.workforce_timeline_segments
  for insert
  to authenticated
  with check (
    created_by_user_id = auth.uid()
    and organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

commit;
