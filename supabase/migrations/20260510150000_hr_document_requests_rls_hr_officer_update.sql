-- Étendre la mise à jour des demandes documents aux rôles RH (alignement UI EmployeeWorkspaceShell)
drop policy if exists "hr_document_requests_update_manage" on public.hr_document_requests;
create policy "hr_document_requests_update_manage" on public.hr_document_requests
for update to authenticated
using (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role in (
        'super_administrator',
        'administrator',
        'manager',
        'hr_officer',
        'hr_business_partner'
      )
  )
)
with check (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
);
