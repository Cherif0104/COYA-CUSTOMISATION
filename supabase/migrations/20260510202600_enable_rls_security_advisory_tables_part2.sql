-- Suite RLS advisors : currency / accounting / notifications_archive (helpers créés dans 20260510202500).

begin;

alter table public.currency_exchange_rates enable row level security;

drop policy if exists currency_exchange_rates_select_authenticated on public.currency_exchange_rates;
create policy currency_exchange_rates_select_authenticated on public.currency_exchange_rates for select to authenticated using (true);

drop policy if exists currency_exchange_rates_mutate_service on public.currency_exchange_rates;
create policy currency_exchange_rates_mutate_service on public.currency_exchange_rates for all to service_role using (true) with check (true);

drop policy if exists currency_exchange_rates_write_admin on public.currency_exchange_rates;
create policy currency_exchange_rates_write_admin on public.currency_exchange_rates for insert to authenticated with check (public.coya_auth_has_management_role());

drop policy if exists currency_exchange_rates_update_admin on public.currency_exchange_rates;
create policy currency_exchange_rates_update_admin on public.currency_exchange_rates for update to authenticated using (public.coya_auth_has_management_role()) with check (public.coya_auth_has_management_role());

drop policy if exists currency_exchange_rates_delete_admin on public.currency_exchange_rates;
create policy currency_exchange_rates_delete_admin on public.currency_exchange_rates for delete to authenticated using (public.coya_auth_has_management_role());

alter table public.accounting_matching_groups enable row level security;

drop policy if exists accounting_matching_groups_org on public.accounting_matching_groups;
create policy accounting_matching_groups_org on public.accounting_matching_groups for all to authenticated using (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
) with check (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
);

drop policy if exists accounting_matching_groups_service on public.accounting_matching_groups;
create policy accounting_matching_groups_service on public.accounting_matching_groups for all to service_role using (true) with check (true);

alter table public.accounting_matching_lines enable row level security;

drop policy if exists accounting_matching_lines_org on public.accounting_matching_lines;
create policy accounting_matching_lines_org on public.accounting_matching_lines for all to authenticated using (
  exists (
    select 1 from public.accounting_matching_groups g
    where g.id = accounting_matching_lines.matching_group_id
      and g.organization_id in (
        select organization_id from public.profiles where user_id = auth.uid()
      )
  )
) with check (
  exists (
    select 1 from public.accounting_matching_groups g
    where g.id = accounting_matching_lines.matching_group_id
      and g.organization_id in (
        select organization_id from public.profiles where user_id = auth.uid()
      )
  )
);

drop policy if exists accounting_matching_lines_service on public.accounting_matching_lines;
create policy accounting_matching_lines_service on public.accounting_matching_lines for all to service_role using (true) with check (true);

alter table public.accounting_reconciliations enable row level security;

drop policy if exists accounting_reconciliations_org on public.accounting_reconciliations;
create policy accounting_reconciliations_org on public.accounting_reconciliations for all to authenticated using (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
) with check (
  organization_id in (select organization_id from public.profiles where user_id = auth.uid())
);

drop policy if exists accounting_reconciliations_service on public.accounting_reconciliations;
create policy accounting_reconciliations_service on public.accounting_reconciliations for all to service_role using (true) with check (true);

alter table public.notifications_archive enable row level security;

drop policy if exists notifications_archive_owner on public.notifications_archive;
create policy notifications_archive_owner on public.notifications_archive for all to authenticated using (user_id = auth.uid()) with check (
  user_id = auth.uid()
);

drop policy if exists notifications_archive_service on public.notifications_archive;
create policy notifications_archive_service on public.notifications_archive for all to service_role using (true) with check (true);

commit;
