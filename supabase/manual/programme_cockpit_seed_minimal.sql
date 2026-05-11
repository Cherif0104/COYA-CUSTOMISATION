-- Dataset minimal pour stresser le cockpit Programme (P0)
-- ⚠️ À exécuter en environnement DEV/STAGING uniquement.
-- Pré-requis: organizations, profiles, programmes, programme_budget_lines, budget_cascade_lines,
--             programme_actions, programme_action_assignees, project_activities, expense_requests.

begin;

-- 1) Récupérer une org existante (la première)
do $$
declare
  v_org uuid;
  v_prog uuid;
  v_profile uuid;
begin
  select id into v_org from public.organizations order by created_at asc limit 1;
  if v_org is null then
    raise exception 'seed: no organization found';
  end if;

  -- 2) Créer un programme de test
  insert into public.programmes (organization_id, name, start_date, end_date)
  values (v_org, 'Programme Seed Cockpit P0', now()::date - 30, now()::date + 60)
  returning id into v_prog;

  -- 3) Budget: surconsommation (variance > 15%)
  insert into public.programme_budget_lines (organization_id, programme_id, label, planned_amount, spent_amount, currency)
  values
    (v_org, v_prog, 'Ligne A', 1000000, 1300000, 'XOF'),
    (v_org, v_prog, 'Ligne B', 500000,  800000,  'XOF');

  -- 4) Budget cascade: une ligne soumise (pending approval)
  insert into public.budget_cascade_lines (
    organization_id, programme_id, scope_level, label, planned_amount, actual_amount, currency, workflow_status
  ) values
    (v_org, v_prog, 'programme', 'Cascade programme', 800000, 100000, 'XOF', 'submitted');

  -- 5) Expense request pending (si table existe)
  begin
    insert into public.expense_requests (organization_id, programme_id, title, status)
    values (v_org, v_prog, 'Dépense pending seed', 'pending');
  exception
    when undefined_table then
      -- ignore (module non installé)
      null;
  end;

  -- 6) Actions: overdue + missing proof
  select id into v_profile from public.profiles where organization_id = v_org order by created_at asc limit 1;
  if v_profile is null then
    raise exception 'seed: no profile found for organization';
  end if;

  insert into public.programme_actions (
    organization_id, programme_id, title, status, due_date, period_end, executor_profile_id
  ) values
    (v_org, v_prog, 'Action en retard (sans preuve)', 'assigned', now()::date - 7, now()::date - 7, v_profile),
    (v_org, v_prog, 'Action bientôt due', 'validated', now()::date + 2, now()::date + 2, v_profile);

  -- 7) Activités terrain: MEL anomalies
  insert into public.project_activities (
    organization_id, programme_id, project_id, title, status, mel_target_value, mel_result_value, mel_unit
  ) values
    (v_org, v_prog, gen_random_uuid(), 'Activité terminée sans résultat', 'completed', 100, null, 'benef'),
    (v_org, v_prog, gen_random_uuid(), 'Activité en cours sans cible', 'in_progress', null, 10, 'benef');
end $$;

commit;

