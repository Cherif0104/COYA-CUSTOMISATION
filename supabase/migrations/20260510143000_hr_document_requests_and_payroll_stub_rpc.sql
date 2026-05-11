-- Demandes de documents RH (salarié / gestion) + RPC stub clôture paie (extension serveur)
create table if not exists public.hr_document_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  request_type text not null,
  status text not null default 'submitted',
  payload jsonb not null default '{}'::jsonb,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hr_document_requests_type_chk check (request_type in (
    'payslip', 'salary_certificate', 'work_certificate', 'contract', 'mission_order', 'leave_certificate'
  )),
  constraint hr_document_requests_status_chk check (status in (
    'submitted', 'in_progress', 'ready', 'rejected', 'cancelled'
  ))
);

create index if not exists idx_hr_document_requests_org_profile
  on public.hr_document_requests (organization_id, profile_id, created_at desc);

drop trigger if exists trg_hr_document_requests_updated on public.hr_document_requests;
create or replace function public.set_hr_document_requests_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger trg_hr_document_requests_updated
  before update on public.hr_document_requests
  for each row execute function public.set_hr_document_requests_updated_at();

alter table public.hr_document_requests enable row level security;

drop policy if exists "hr_document_requests_select" on public.hr_document_requests;
create policy "hr_document_requests_select" on public.hr_document_requests
for select to authenticated
using (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
  and (
    profile_id = (select id from public.profiles where user_id = auth.uid() limit 1)
    or exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.organization_id = hr_document_requests.organization_id
        and p.role in ('super_administrator', 'administrator', 'manager')
    )
  )
);

drop policy if exists "hr_document_requests_insert" on public.hr_document_requests;
create policy "hr_document_requests_insert" on public.hr_document_requests
for insert to authenticated
with check (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
  and exists (select 1 from public.profiles tgt where tgt.id = profile_id and tgt.organization_id = hr_document_requests.organization_id)
  and (
    profile_id = (select id from public.profiles where user_id = auth.uid() limit 1)
    or exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.organization_id = hr_document_requests.organization_id
        and p.role in ('super_administrator', 'administrator', 'manager')
    )
  )
);

drop policy if exists "hr_document_requests_update_manage" on public.hr_document_requests;
create policy "hr_document_requests_update_manage" on public.hr_document_requests
for update to authenticated
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
);

create or replace function public.rh_payroll_close_period_stub(p_period_start date, p_period_end date)
returns jsonb
language sql
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'ok', true,
    'message_fr', 'Point d''extension serveur : la génération des bulletins brouillon est exécutée côté application (payrollService.bulkGenerateDraftPaySlipsForPeriod). Planifier un appel HTTP vers cette logique ou une Edge Function après consolidation des temps.',
    'message_en', 'Server stub: draft pay slip generation runs in the app (payrollService.bulkGenerateDraftPaySlipsForPeriod). Schedule HTTP/Edge after time consolidation.',
    'period_start', p_period_start,
    'period_end', p_period_end
  );
$$;

grant execute on function public.rh_payroll_close_period_stub(date, date) to authenticated;
