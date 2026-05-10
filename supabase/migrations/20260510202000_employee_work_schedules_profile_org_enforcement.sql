-- Complément idempotent : enforcement profile ↔ organisation (CHECK avec sous-requête interdit en Postgres).
-- Les environnements ayant déjà appliqué 20260510190000 sans ce bloc récupèrent la contrainte métier via trigger.

begin;

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

commit;
