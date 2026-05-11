-- Workforce OS : journal append-only des Activity Events (présence, temps, tâches…)
-- RLS alignée sur domain_events : même organisation que le profil authentifié.

begin;

create table if not exists public.workforce_activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  actor_worker_id text not null,
  verb text not null,
  object_refs jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  client_event_id text not null,
  created_at timestamptz not null default now(),
  constraint workforce_activity_events_org_client_unique unique (organization_id, client_event_id)
);

create index if not exists idx_workforce_activity_events_org_occurred
  on public.workforce_activity_events (organization_id, occurred_at desc);

create index if not exists idx_workforce_activity_events_actor
  on public.workforce_activity_events (organization_id, actor_worker_id, occurred_at desc);

create index if not exists idx_workforce_activity_events_verb
  on public.workforce_activity_events (organization_id, verb);

comment on table public.workforce_activity_events is 'COYA Workforce Intelligence — événements d’activité (corrélation temps / projets / présence).';

alter table public.workforce_activity_events enable row level security;

drop policy if exists workforce_activity_events_select_org on public.workforce_activity_events;
create policy workforce_activity_events_select_org
  on public.workforce_activity_events
  for select
  to authenticated
  using (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

drop policy if exists workforce_activity_events_insert_own on public.workforce_activity_events;
create policy workforce_activity_events_insert_own
  on public.workforce_activity_events
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
