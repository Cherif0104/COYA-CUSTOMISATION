-- PHASE 1 — Foundation Architecture
-- Project: COYA / Project & Program OS
-- Target: Supabase Postgres (public schema) — DRAFT, to be converted to migrations.
--
-- Notes:
-- - This file is intentionally additive and uses IF NOT EXISTS.
-- - Keep RLS enabled on all new tables.
-- - Avoid SECURITY DEFINER functions in exposed schemas.

begin;

-- ---------------------------------------------------------------------------
-- 0) Extensions (verify availability per project)
-- ---------------------------------------------------------------------------
-- create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- 1) Territorial Engine — hierarchical territories (tree)
-- ---------------------------------------------------------------------------
create table if not exists public.territories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),

  -- Hierarchy
  parent_id uuid null references public.territories(id) on delete set null,
  level text not null,                 -- country|region|department|commune|village|zone|hub
  name text not null,
  code text null,

  -- Geo (optional)
  geo jsonb not null default '{}'::jsonb,      -- {lat,lng,bounds,polygon,...}

  -- Audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references auth.users(id),
  updated_by uuid null references auth.users(id),
  archived_at timestamptz null,
  archived_by uuid null references auth.users(id),
  deleted_at timestamptz null,
  deleted_by uuid null references auth.users(id)
);

create index if not exists territories_org_idx on public.territories (organization_id);
create index if not exists territories_parent_idx on public.territories (parent_id);
create index if not exists territories_level_idx on public.territories (organization_id, level);

alter table public.territories enable row level security;

-- ---------------------------------------------------------------------------
-- 2) Device / Dispositif
-- ---------------------------------------------------------------------------
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),

  territory_id uuid null references public.territories(id) on delete set null,
  name text not null,
  device_type text not null, -- hub|centre|antenne|incubateur|pole|comite|other
  status text not null default 'active',

  address text null,
  geo jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references auth.users(id),
  updated_by uuid null references auth.users(id),
  archived_at timestamptz null,
  archived_by uuid null references auth.users(id),
  deleted_at timestamptz null,
  deleted_by uuid null references auth.users(id)
);

create index if not exists devices_org_idx on public.devices (organization_id);
create index if not exists devices_territory_idx on public.devices (territory_id);

alter table public.devices enable row level security;

-- ---------------------------------------------------------------------------
-- 3) Activities (Operational unit above missions)
-- ---------------------------------------------------------------------------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),

  programme_id uuid null references public.programmes(id) on delete set null,
  project_id uuid null references public.projects(id) on delete set null,

  territory_id uuid null references public.territories(id) on delete set null,
  device_id uuid null references public.devices(id) on delete set null,

  title text not null,
  activity_type text not null,      -- formation|atelier|coaching|sensibilisation|reunion|evaluation|other
  status text not null default 'draft',

  start_at timestamptz null,
  end_at timestamptz null,

  owner_profile_id uuid null references public.profiles(id),
  coordinator_profile_id uuid null references public.profiles(id),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references auth.users(id),
  updated_by uuid null references auth.users(id),
  archived_at timestamptz null,
  archived_by uuid null references auth.users(id),
  deleted_at timestamptz null,
  deleted_by uuid null references auth.users(id)
);

create index if not exists activities_org_idx on public.activities (organization_id);
create index if not exists activities_programme_idx on public.activities (programme_id);
create index if not exists activities_project_idx on public.activities (project_id);
create index if not exists activities_territory_idx on public.activities (territory_id);
create index if not exists activities_status_idx on public.activities (organization_id, status);

alter table public.activities enable row level security;

-- ---------------------------------------------------------------------------
-- 4) Missions (field execution unit)
-- ---------------------------------------------------------------------------
create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),

  activity_id uuid not null references public.activities(id) on delete cascade,

  title text not null,
  status text not null default 'draft',   -- draft|validated|deployed|in_progress|completed|reported|archived

  departure_at timestamptz null,
  return_at timestamptz null,
  territory_id uuid null references public.territories(id) on delete set null,
  device_id uuid null references public.devices(id) on delete set null,

  mission_order_number text null,
  logistics jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references auth.users(id),
  updated_by uuid null references auth.users(id),
  archived_at timestamptz null,
  archived_by uuid null references auth.users(id),
  deleted_at timestamptz null,
  deleted_by uuid null references auth.users(id)
);

create index if not exists missions_org_idx on public.missions (organization_id);
create index if not exists missions_activity_idx on public.missions (activity_id);
create index if not exists missions_status_idx on public.missions (organization_id, status);

alter table public.missions enable row level security;

create table if not exists public.mission_team_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  mission_id uuid not null references public.missions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  role text not null default 'member', -- leader|member|driver|me|finance|other
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id)
);

create unique index if not exists mission_team_unique on public.mission_team_members (mission_id, profile_id);
create index if not exists mission_team_org_idx on public.mission_team_members (organization_id);
alter table public.mission_team_members enable row level security;

-- ---------------------------------------------------------------------------
-- 5) Incidents
-- ---------------------------------------------------------------------------
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),

  programme_id uuid null references public.programmes(id) on delete set null,
  project_id uuid null references public.projects(id) on delete set null,
  activity_id uuid null references public.activities(id) on delete set null,
  mission_id uuid null references public.missions(id) on delete set null,

  severity text not null default 'medium',       -- low|medium|high|critical
  status text not null default 'open',           -- open|triaged|in_progress|resolved|closed
  category text not null default 'other',

  title text not null,
  description text null,

  assigned_to_profile_id uuid null references public.profiles(id),
  resolved_at timestamptz null,
  resolution_notes text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references auth.users(id),
  updated_by uuid null references auth.users(id),
  archived_at timestamptz null,
  archived_by uuid null references auth.users(id),
  deleted_at timestamptz null,
  deleted_by uuid null references auth.users(id)
);

create index if not exists incidents_org_idx on public.incidents (organization_id);
create index if not exists incidents_status_idx on public.incidents (organization_id, status);
create index if not exists incidents_mission_idx on public.incidents (mission_id);
alter table public.incidents enable row level security;

-- ---------------------------------------------------------------------------
-- 6) M&E Engine (minimal): indicators + targets + measurements + evidence
-- ---------------------------------------------------------------------------
create table if not exists public.indicators (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),

  programme_id uuid null references public.programmes(id) on delete set null,
  project_id uuid null references public.projects(id) on delete set null,

  code text null,
  name text not null,
  description text null,
  unit text null,
  frequency text not null default 'monthly',   -- daily|weekly|monthly|quarterly|annual|adhoc
  formula jsonb not null default '{}'::jsonb,  -- phase-4: formula engine contract

  status text not null default 'active',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references auth.users(id),
  updated_by uuid null references auth.users(id),
  archived_at timestamptz null,
  archived_by uuid null references auth.users(id),
  deleted_at timestamptz null,
  deleted_by uuid null references auth.users(id)
);

create index if not exists indicators_org_idx on public.indicators (organization_id);
create index if not exists indicators_programme_idx on public.indicators (programme_id);
create index if not exists indicators_project_idx on public.indicators (project_id);
alter table public.indicators enable row level security;

create table if not exists public.indicator_targets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  indicator_id uuid not null references public.indicators(id) on delete cascade,

  period_start date null,
  period_end date null,
  territory_id uuid null references public.territories(id) on delete set null,
  cohort_id uuid null, -- phase-4

  baseline numeric null,
  target numeric not null,

  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id)
);

create index if not exists indicator_targets_org_idx on public.indicator_targets (organization_id);
create index if not exists indicator_targets_indicator_idx on public.indicator_targets (indicator_id);
alter table public.indicator_targets enable row level security;

create table if not exists public.indicator_measurements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  indicator_id uuid not null references public.indicators(id) on delete cascade,

  measured_at timestamptz not null default now(),
  territory_id uuid null references public.territories(id) on delete set null,
  cohort_id uuid null, -- phase-4

  value numeric not null,
  notes text null,

  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id)
);

create index if not exists indicator_measurements_org_idx on public.indicator_measurements (organization_id);
create index if not exists indicator_measurements_indicator_idx on public.indicator_measurements (indicator_id);
alter table public.indicator_measurements enable row level security;

create table if not exists public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),

  -- Links (keep flexible)
  programme_id uuid null references public.programmes(id) on delete set null,
  project_id uuid null references public.projects(id) on delete set null,
  activity_id uuid null references public.activities(id) on delete set null,
  mission_id uuid null references public.missions(id) on delete set null,
  indicator_measurement_id uuid null references public.indicator_measurements(id) on delete set null,

  evidence_type text not null,   -- document|photo|attendance|signature|geo|other
  payload jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id),
  archived_at timestamptz null,
  archived_by uuid null references auth.users(id),
  deleted_at timestamptz null,
  deleted_by uuid null references auth.users(id)
);

create index if not exists evidence_org_idx on public.evidence_items (organization_id);
create index if not exists evidence_mission_idx on public.evidence_items (mission_id);
alter table public.evidence_items enable row level security;

-- ---------------------------------------------------------------------------
-- 7) Workflow + Outbox (foundation)
-- ---------------------------------------------------------------------------
create table if not exists public.workflow_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  domain text not null,           -- programme|project|activity|mission|expense|incident|report
  name text not null,
  version integer not null default 1,
  definition jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id)
);

create unique index if not exists workflow_definitions_unique on public.workflow_definitions (organization_id, domain, name, version);
alter table public.workflow_definitions enable row level security;

create table if not exists public.workflow_instances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  workflow_definition_id uuid not null references public.workflow_definitions(id) on delete restrict,
  entity_type text not null,
  entity_id uuid not null,
  current_state text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workflow_instances_entity_idx on public.workflow_instances (organization_id, entity_type, entity_id);
alter table public.workflow_instances enable row level security;

create table if not exists public.workflow_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  workflow_instance_id uuid not null references public.workflow_instances(id) on delete cascade,
  event_id uuid not null,                 -- idempotence key
  event_type text not null,               -- transition|comment|override|system
  from_state text null,
  to_state text null,
  actor_profile_id uuid null references public.profiles(id),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists workflow_events_event_id_unique on public.workflow_events (organization_id, event_id);
alter table public.workflow_events enable row level security;

create table if not exists public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  event_id uuid not null,           -- idempotence key
  event_type text not null,
  aggregate_type text not null,
  aggregate_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  published_at timestamptz null,
  publish_attempts integer not null default 0,
  last_error text null
);

create unique index if not exists outbox_event_id_unique on public.outbox_events (organization_id, event_id);
create index if not exists outbox_pending_idx on public.outbox_events (published_at) where published_at is null;
alter table public.outbox_events enable row level security;

commit;

