-- =============================================================================
-- COYA — Seed démo Workforce OS (tables workforce_activity_events +
--        workforce_timeline_segments)
--
-- Prérequis : migrations appliquées (voir scripts/apply-workforce-migrations-remote.sql).
-- Contexte   : exécuter dans Supabase → SQL Editor avec un rôle qui bypass RLS
--              (postgres / Dashboard) OU service_role via API.
--
-- Repérer rapidement org + utilisateur (copier-coller les UUID dans le bloc DO) :
--   select o.id as org_id, p.user_id
--   from public.profiles p
--   join public.organizations o on o.id = p.organization_id
--   where p.organization_id is not null
--   limit 3;
--
-- 1. Remplace ORG_ID et USER_ID par des UUID valides de ton instance :
--    - ORG_ID  : une ligne existante dans public.organizations
--    - USER_ID : auth.users.id du compte qui ouvre l’app (les segments sont
--                listés avec created_by_user_id = cet utilisateur)
--
-- 2. Optionnel : DAY_UTC = date calendaire (UTC) pour laquelle insérer les
--    plages (par défaut : jour courant UTC).
-- =============================================================================

DO $$
DECLARE
  v_org  uuid := '00000000-0000-0000-0000-000000000001';  -- <<< À REMPLACER
  v_uid  uuid := '00000000-0000-0000-0000-000000000002';  -- <<< À REMPLACER
  v_day  date := (timezone('utc', now()))::date;          -- ou fixe : '2026-05-10'::date
  v_worker text := '';  -- rempli = v_uid::text
  t0 timestamptz;
  t1 timestamptz;
BEGIN
  IF v_org = '00000000-0000-0000-0000-000000000001'::uuid
     OR v_uid = '00000000-0000-0000-0000-000000000002'::uuid THEN
    RAISE EXCEPTION 'Remplace v_org et v_uid en tête du bloc DO par tes UUID réels (organizations + auth.users).';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = v_org) THEN
    RAISE EXCEPTION 'organization_id introuvable: %', v_org;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_uid) THEN
    RAISE EXCEPTION 'auth user introuvable: %', v_uid;
  END IF;

  v_worker := v_uid::text;
  t0 := (v_day::timestamp AT TIME ZONE 'UTC');
  t1 := t0 + interval '23 hours 59 minutes 59.999 seconds';

  -- --- Activity events (append-only, idempotents) ---
  INSERT INTO public.workforce_activity_events (
    organization_id, created_by_user_id, actor_worker_id, verb, object_refs, payload,
    occurred_at, client_event_id
  ) VALUES
    (v_org, v_uid, v_worker, 'presence_session_opened', '[]'::jsonb, '{"seed":true}'::jsonb,
     t0 + interval '30 minutes', 'seed-coya-wf-presence-open'),
    (v_org, v_uid, v_worker, 'time_entry_started', '[{"type":"project","id":"demo-project"}]'::jsonb, '{"seed":true}'::jsonb,
     t0 + interval '1 hour', 'seed-coya-wf-time-start'),
    (v_org, v_uid, v_worker, 'imputation_recorded', '[{"type":"project","id":"demo-project"}]'::jsonb, '{"seed":true,"hours":1.5}'::jsonb,
     t0 + interval '2 hours', 'seed-coya-wf-imputation'),
    (v_org, v_uid, v_worker, 'break_start', '[]'::jsonb, '{"seed":true}'::jsonb,
     t0 + interval '3 hours 30 minutes', 'seed-coya-wf-break-start'),
    (v_org, v_uid, v_worker, 'break_end', '[]'::jsonb, '{"seed":true}'::jsonb,
     t0 + interval '3 hours 45 minutes', 'seed-coya-wf-break-end'),
    (v_org, v_uid, v_worker, 'task_completed', '[{"type":"task","id":"demo-task-1"}]'::jsonb, '{"seed":true}'::jsonb,
     t0 + interval '5 hours', 'seed-coya-wf-task-done'),
    (v_org, v_uid, v_worker, 'timesheet_submitted', '[]'::jsonb, '{"seed":true}'::jsonb,
     t0 + interval '6 hours', 'seed-coya-wf-ts-submit'),
    (v_org, v_uid, v_worker, 'presence_session_closed', '[]'::jsonb, '{"seed":true}'::jsonb,
     t0 + interval '8 hours', 'seed-coya-wf-presence-close')
  ON CONFLICT (organization_id, client_event_id) DO NOTHING;

  -- --- Timeline segments (visibles sur le Dashboard pour ce USER_ID / jour UTC) ---
  INSERT INTO public.workforce_timeline_segments (
    organization_id, created_by_user_id, worker_id, segment_kind, operational_context,
    device_ref, started_at, ended_at, source_client_event_id, payload
  ) VALUES
    (v_org, v_uid, v_worker, 'system_connected', 'remote', '{}'::jsonb,
     t0 + interval '30 minutes', t0 + interval '45 minutes', 'seed-seg-connected', '{"seed":true}'::jsonb),
    (v_org, v_uid, v_worker, 'productive_output', 'remote', '{}'::jsonb,
     t0 + interval '1 hour', t0 + interval '2 hours 30 minutes', 'seed-seg-productive', '{"seed":true,"label":"Bloc focus"}'::jsonb),
    (v_org, v_uid, v_worker, 'declared_break', null, '{}'::jsonb,
     t0 + interval '3 hours 30 minutes', t0 + interval '3 hours 45 minutes', 'seed-seg-break', '{"seed":true}'::jsonb),
    (v_org, v_uid, v_worker, 'business_activity', 'office', '{}'::jsonb,
     t0 + interval '4 hours', t0 + interval '5 hours', 'seed-seg-admin', '{"seed":true}'::jsonb),
    (v_org, v_uid, v_worker, 'productive_output', 'remote', '{}'::jsonb,
     t0 + interval '5 hours', t0 + interval '6 hours 30 minutes', 'seed-seg-overlap-demo', '{"seed":true}'::jsonb),
    (v_org, v_uid, v_worker, 'business_activity', 'hybrid', '{}'::jsonb,
     t0 + interval '6 hours', t0 + interval '7 hours', 'seed-seg-overlap-demo-2', '{"seed":true,"note":"Chevauche segment précédent"}'::jsonb)
  ON CONFLICT (organization_id, worker_id, source_client_event_id) DO NOTHING;

  RAISE NOTICE 'Seed Workforce terminé (org=%, user=%, jour UTC=%).', v_org, v_uid, v_day;
END $$;
