-- Programme Cockpit CQRS (P0+) — projection run id + status
-- Purpose: tracing, debugging, replay comparison, orchestration readiness

begin;

alter table public.programme_cockpit_read_models
  add column if not exists projection_run_id uuid,
  add column if not exists projection_status text not null default 'ready',
  add column if not exists projection_error jsonb not null default '{}'::jsonb;

create index if not exists idx_programme_cockpit_status
  on public.programme_cockpit_read_models (organization_id, projection_status);

commit;

