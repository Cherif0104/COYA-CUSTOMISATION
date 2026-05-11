-- Règles journée (matin / pause / après-midi / fin) + anomalies RH pilotables par les managers.
begin;

alter table public.hr_attendance_policies
  add column if not exists expected_work_end_time time not null default '17:00:00',
  add column if not exists morning_segment_end_time time not null default '12:00:00',
  add column if not exists lunch_start_time time not null default '13:00:00',
  add column if not exists lunch_end_time time not null default '14:00:00',
  add column if not exists afternoon_presence_deadline_time time not null default '14:00:00';

comment on column public.hr_attendance_policies.morning_segment_end_time is 'Au-delà de cette heure locale sans présence dans la plage matin → absence matin.';
comment on column public.hr_attendance_policies.afternoon_presence_deadline_time is 'Heure locale limite pour être « présent » l’après-midi (après pause déjeuner).';
comment on column public.hr_attendance_policies.expected_work_end_time is 'Fin de journée attendue (départ anticipé si déconnexion avant, hors tolérance manager).';

create table if not exists public.hr_workforce_anomalies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  work_date date not null,
  anomaly_kind text not null check (anomaly_kind in (
    'late_connect',
    'absence_morning',
    'absence_afternoon',
    'early_departure'
  )),
  minutes_value int not null default 0,
  manager_decision text not null default 'pending' check (manager_decision in (
    'pending',
    'authorized',
    'unauthorized',
    'verified'
  )),
  counts_toward_absence boolean not null default true,
  notes text null,
  decided_by_user_id uuid null references auth.users(id) on delete set null,
  decided_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, profile_id, work_date, anomaly_kind)
);

create index if not exists idx_hr_workforce_anomalies_org_date
  on public.hr_workforce_anomalies (organization_id, work_date desc);
create index if not exists idx_hr_workforce_anomalies_profile
  on public.hr_workforce_anomalies (profile_id, work_date desc);

alter table public.hr_workforce_anomalies enable row level security;

drop policy if exists hr_workforce_anomalies_read_org on public.hr_workforce_anomalies;
create policy hr_workforce_anomalies_read_org on public.hr_workforce_anomalies
for select to authenticated
using (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
);

drop policy if exists hr_workforce_anomalies_insert_manage on public.hr_workforce_anomalies;
create policy hr_workforce_anomalies_insert_manage on public.hr_workforce_anomalies
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

drop policy if exists hr_workforce_anomalies_update_manage on public.hr_workforce_anomalies;
create policy hr_workforce_anomalies_update_manage on public.hr_workforce_anomalies
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

drop policy if exists hr_workforce_anomalies_delete_manage on public.hr_workforce_anomalies;
create policy hr_workforce_anomalies_delete_manage on public.hr_workforce_anomalies
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

commit;
