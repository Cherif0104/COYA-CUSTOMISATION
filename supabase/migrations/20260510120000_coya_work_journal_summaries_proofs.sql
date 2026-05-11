-- Journal du jour RH : agrégats quotidiens + preuves d'activité (services/workJournalService.ts)
begin;

create table if not exists public.coya_work_day_summaries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  work_date date not null,
  minutes_project_work int not null default 0,
  minutes_planning int not null default 0,
  minutes_attendance_span int not null default 0,
  presence_status text not null default 'unknown',
  journey_completed boolean not null default false,
  summary_meta jsonb not null default '{}'::jsonb,
  last_computed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, profile_id, work_date)
);

create index if not exists idx_coya_work_day_summaries_org_date
  on public.coya_work_day_summaries (organization_id, work_date desc);
create index if not exists idx_coya_work_day_summaries_profile_date
  on public.coya_work_day_summaries (profile_id, work_date desc);

create table if not exists public.coya_work_proofs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  work_date date not null,
  proof_type text not null check (proof_type in ('external_url', 'storage_file')),
  external_url text null,
  storage_object_path text null,
  related_time_entry_id uuid null,
  caption text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_coya_work_proofs_org_profile_date
  on public.coya_work_proofs (organization_id, profile_id, work_date desc);

alter table public.coya_work_day_summaries enable row level security;
alter table public.coya_work_proofs enable row level security;

-- Résumés : lecture pour tout utilisateur de l'organisation ; écriture réservée aux rôles de gestion (job batch / RH)
drop policy if exists "coya_work_day_summaries_select_org" on public.coya_work_day_summaries;
create policy "coya_work_day_summaries_select_org" on public.coya_work_day_summaries
for select to authenticated
using (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
);

drop policy if exists "coya_work_day_summaries_write_manage" on public.coya_work_day_summaries;
create policy "coya_work_day_summaries_write_manage" on public.coya_work_day_summaries
for all to authenticated
using (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('super_administrator', 'administrator', 'manager')
  )
)
with check (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('super_administrator', 'administrator', 'manager')
  )
);

-- Preuves : lecture org ; création par le titulaire du profil ou un manager de la même org
drop policy if exists "coya_work_proofs_select_org" on public.coya_work_proofs;
create policy "coya_work_proofs_select_org" on public.coya_work_proofs
for select to authenticated
using (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
);

drop policy if exists "coya_work_proofs_insert_self_or_manage" on public.coya_work_proofs;
create policy "coya_work_proofs_insert_self_or_manage" on public.coya_work_proofs
for insert to authenticated
with check (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
  and (
    profile_id = (select id from public.profiles where user_id = auth.uid() limit 1)
    or exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('super_administrator', 'administrator', 'manager')
    )
  )
);

drop policy if exists "coya_work_proofs_delete_manage" on public.coya_work_proofs;
create policy "coya_work_proofs_delete_manage" on public.coya_work_proofs
for delete to authenticated
using (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('super_administrator', 'administrator', 'manager')
  )
);

commit;
