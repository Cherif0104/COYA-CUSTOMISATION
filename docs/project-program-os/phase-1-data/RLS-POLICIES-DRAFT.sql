-- PHASE 1 — RLS Policies (DRAFT)
-- Project: COYA / Project & Program OS
--
-- Principle:
-- - All access is tenant-scoped by organization_id (profiles.organization_id).
-- - Do NOT apply blindly in prod: some existing tables currently have RLS disabled.
-- - UPDATE requires SELECT policy in Postgres RLS (important for debugging).

begin;

-- Helper predicate (inline): current user's org
-- NOTE: profiles.user_id is used (not profiles.id).
-- This is written as a SQL snippet to reuse in policies:
--   organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)

-- ---------------------------------------------------------------------------
-- Territories
-- ---------------------------------------------------------------------------
drop policy if exists territories_select on public.territories;
create policy territories_select
on public.territories for select
to authenticated
using (
  deleted_at is null
  and organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists territories_insert on public.territories;
create policy territories_insert
on public.territories for insert
to authenticated
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists territories_update on public.territories;
create policy territories_update
on public.territories for update
to authenticated
using (
  deleted_at is null
  and organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
)
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists territories_delete on public.territories;
create policy territories_delete
on public.territories for delete
to authenticated
using (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

-- ---------------------------------------------------------------------------
-- Devices
-- ---------------------------------------------------------------------------
drop policy if exists devices_select on public.devices;
create policy devices_select
on public.devices for select
to authenticated
using (
  deleted_at is null
  and organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists devices_insert on public.devices;
create policy devices_insert
on public.devices for insert
to authenticated
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists devices_update on public.devices;
create policy devices_update
on public.devices for update
to authenticated
using (
  deleted_at is null
  and organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
)
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists devices_delete on public.devices;
create policy devices_delete
on public.devices for delete
to authenticated
using (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

-- ---------------------------------------------------------------------------
-- Activities
-- ---------------------------------------------------------------------------
drop policy if exists activities_select on public.activities;
create policy activities_select
on public.activities for select
to authenticated
using (
  deleted_at is null
  and organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists activities_insert on public.activities;
create policy activities_insert
on public.activities for insert
to authenticated
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists activities_update on public.activities;
create policy activities_update
on public.activities for update
to authenticated
using (
  deleted_at is null
  and organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
)
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists activities_delete on public.activities;
create policy activities_delete
on public.activities for delete
to authenticated
using (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

-- ---------------------------------------------------------------------------
-- Missions + team
-- ---------------------------------------------------------------------------
drop policy if exists missions_select on public.missions;
create policy missions_select
on public.missions for select
to authenticated
using (
  deleted_at is null
  and organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists missions_insert on public.missions;
create policy missions_insert
on public.missions for insert
to authenticated
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists missions_update on public.missions;
create policy missions_update
on public.missions for update
to authenticated
using (
  deleted_at is null
  and organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
)
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists missions_delete on public.missions;
create policy missions_delete
on public.missions for delete
to authenticated
using (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists mission_team_select on public.mission_team_members;
create policy mission_team_select
on public.mission_team_members for select
to authenticated
using (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists mission_team_insert on public.mission_team_members;
create policy mission_team_insert
on public.mission_team_members for insert
to authenticated
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists mission_team_delete on public.mission_team_members;
create policy mission_team_delete
on public.mission_team_members for delete
to authenticated
using (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

-- ---------------------------------------------------------------------------
-- Incidents
-- ---------------------------------------------------------------------------
drop policy if exists incidents_select on public.incidents;
create policy incidents_select
on public.incidents for select
to authenticated
using (
  deleted_at is null
  and organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists incidents_insert on public.incidents;
create policy incidents_insert
on public.incidents for insert
to authenticated
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists incidents_update on public.incidents;
create policy incidents_update
on public.incidents for update
to authenticated
using (
  deleted_at is null
  and organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
)
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

-- ---------------------------------------------------------------------------
-- M&E (indicators, targets, measurements, evidence)
-- ---------------------------------------------------------------------------
drop policy if exists indicators_select on public.indicators;
create policy indicators_select
on public.indicators for select
to authenticated
using (
  deleted_at is null
  and organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists indicators_write on public.indicators;
create policy indicators_write
on public.indicators for all
to authenticated
using (
  deleted_at is null
  and organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
)
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists indicator_targets_access on public.indicator_targets;
create policy indicator_targets_access
on public.indicator_targets for all
to authenticated
using (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
)
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists indicator_measurements_access on public.indicator_measurements;
create policy indicator_measurements_access
on public.indicator_measurements for all
to authenticated
using (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
)
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists evidence_access on public.evidence_items;
create policy evidence_access
on public.evidence_items for all
to authenticated
using (
  deleted_at is null
  and organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
)
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

-- ---------------------------------------------------------------------------
-- Workflow + Outbox
-- ---------------------------------------------------------------------------
drop policy if exists workflow_definitions_access on public.workflow_definitions;
create policy workflow_definitions_access
on public.workflow_definitions for all
to authenticated
using (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
)
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists workflow_instances_access on public.workflow_instances;
create policy workflow_instances_access
on public.workflow_instances for all
to authenticated
using (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
)
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists workflow_events_access on public.workflow_events;
create policy workflow_events_access
on public.workflow_events for all
to authenticated
using (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
)
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

drop policy if exists outbox_events_access on public.outbox_events;
create policy outbox_events_access
on public.outbox_events for all
to authenticated
using (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
)
with check (
  organization_id = (select p.organization_id from public.profiles p where p.user_id = auth.uid() limit 1)
);

commit;

