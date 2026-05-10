-- Planning hebdomadaire salarié (jour 1–7) avec surcharges horaires.
-- TODO (discipline/notifications): prévoir tables hr_discipline_cases + hr_notification_acknowledgements liées à notifications.id
begin;

create table if not exists public.employee_work_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  iso_weekday int not null check (iso_weekday between 1 and 7),
  expected_start_time time,
  expected_end_time time,
  lunch_start_time time,
  lunch_end_time time,
  afternoon_start_time time,
  active boolean not null default true,
  effective_from date,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ancienne intention : le profil doit appartenir à la même organisation que la ligne.
-- Postgres interdit les sous-requêtes dans CHECK : enforcement via trigger.
alter table public.employee_work_schedules
  drop constraint if exists employee_work_schedules_profile_org_fk;

create or replace function public.enforce_employee_work_schedules_profile_organization()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = new.profile_id
      and p.organization_id = new.organization_id
  ) then
    raise exception 'employee_work_schedules: profile_id doit appartenir à organization_id';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_employee_work_schedules_profile_org on public.employee_work_schedules;
create trigger trg_employee_work_schedules_profile_org
before insert or update on public.employee_work_schedules
for each row execute function public.enforce_employee_work_schedules_profile_organization();

create index if not exists idx_employee_work_schedules_org_day on public.employee_work_schedules(organization_id, iso_weekday);
create index if not exists idx_employee_work_schedules_profile_day on public.employee_work_schedules(profile_id, iso_weekday);

alter table public.employee_work_schedules enable row level security;

drop policy if exists employee_work_schedules_read_org on public.employee_work_schedules;
create policy employee_work_schedules_read_org on public.employee_work_schedules
for select to authenticated
using (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
);

drop policy if exists employee_work_schedules_insert_manage on public.employee_work_schedules;
create policy employee_work_schedules_insert_manage on public.employee_work_schedules
for insert to authenticated
with check (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and coalesce(p.role, '') in (
        'super_admin',
        'admin',
        'manager',
        'super_administrator',
        'administrator'
      )
  )
);

drop policy if exists employee_work_schedules_update_manage on public.employee_work_schedules;
create policy employee_work_schedules_update_manage on public.employee_work_schedules
for update to authenticated
using (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and coalesce(p.role, '') in (
        'super_admin',
        'admin',
        'manager',
        'super_administrator',
        'administrator'
      )
  )
)
with check (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
);

drop policy if exists employee_work_schedules_delete_manage on public.employee_work_schedules;
create policy employee_work_schedules_delete_manage on public.employee_work_schedules
for delete to authenticated
using (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and coalesce(p.role, '') in (
        'super_admin',
        'admin',
        'manager',
        'super_administrator',
        'administrator'
      )
  )
);

drop trigger if exists trg_employee_work_schedules_updated_at on public.employee_work_schedules;
create trigger trg_employee_work_schedules_updated_at
before update on public.employee_work_schedules
for each row execute function public.set_updated_at();

commit;
