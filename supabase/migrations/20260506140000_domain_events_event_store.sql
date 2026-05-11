-- Event store append-only : événements métier domaine (Executable Canon)
-- Audit, timeline, replay futur, analytics. RLS par organisation.

begin;

create table if not exists public.domain_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_event_id text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  actor_id text null,
  schema_version int not null default 1,
  correlation_id uuid null,
  causation_id text null,
  source text not null default 'runtime',
  created_at timestamptz not null default now(),
  constraint domain_events_client_event_unique unique (organization_id, client_event_id)
);

create index if not exists idx_domain_events_org_occurred
  on public.domain_events (organization_id, occurred_at desc);

create index if not exists idx_domain_events_aggregate
  on public.domain_events (organization_id, aggregate_type, aggregate_id);

create index if not exists idx_domain_events_event_type
  on public.domain_events (organization_id, event_type);

create index if not exists idx_domain_events_correlation
  on public.domain_events (organization_id, correlation_id)
  where correlation_id is not null;

comment on table public.domain_events is 'Journal append-only des événements métier COYA (domain-driven runtime).';

alter table public.domain_events enable row level security;

drop policy if exists domain_events_select_org on public.domain_events;
create policy domain_events_select_org
  on public.domain_events
  for select
  to authenticated
  using (
    organization_id in (
      select organization_id from public.profiles where user_id = auth.uid() and organization_id is not null
    )
  );

drop policy if exists domain_events_insert_org on public.domain_events;
create policy domain_events_insert_org
  on public.domain_events
  for insert
  to authenticated
  with check (
    organization_id in (
      select organization_id from public.profiles where user_id = auth.uid() and organization_id is not null
    )
  );

-- Append-only : pas de mise à jour / suppression via rôle client (service_role bypass RLS pour admin/outils).

commit;
