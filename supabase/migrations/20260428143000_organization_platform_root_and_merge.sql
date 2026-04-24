-- =============================================================================
-- Organisation plateforme (mère) + fusion des tenants existants sans perte
-- de données métier (réattribution organization_id puis suppression des orgs
-- sources vides).
--
-- 1) Colonne is_platform_root : l’org mère plateforme (non supprimable côté app).
-- 2) Si plusieurs lignes dans public.organizations :
--      choix du « keeper » = score max (profils×10 + projets×5 + départements×3
--      si la table existe), puis en cas d’égalité priorité à l’UUID préféré
--      s’il existe, sinon created_at le plus ancien.
--      Réattribution dynamique de toutes les colonnes organization_id (hors
--      organizations), puis suppression des autres lignes organizations.
-- 3) Une seule org restante : is_platform_root = true pour cette ligne.
--
-- Après exécution : alignez VITE_PRIMARY_ORGANIZATION_ID sur l’UUID conservé
-- (le keeper). Ne mettez VITE_SINGLE_ORGANIZATION_MODE que si vous voulez
-- masquer temporairement les tenants dans l’UI (déconseillé si vous créez
-- des organisations hébergées).
-- =============================================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_platform_root boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.organizations.is_platform_root IS
  'true = organisation mère plateforme (données COYA / super admin). Les autres sont des tenants hébergés.';

DO $$
DECLARE
  keeper uuid;
  preferred uuid := '550e8400-e29b-41d4-a716-446655440000'::uuid;
  org_count int;
  r record;
  n int;
  has_projects boolean;
  has_profiles boolean;
  has_departments boolean;
BEGIN
  IF to_regclass('public.organizations') IS NULL THEN
    RAISE NOTICE 'Table organizations absente — migration ignorée.';
    RETURN;
  END IF;

  SELECT count(*)::int INTO org_count FROM public.organizations;

  IF org_count = 0 THEN
    RAISE NOTICE 'Aucune organisation — rien à faire.';
    RETURN;
  END IF;

  IF org_count = 1 THEN
    UPDATE public.organizations SET is_platform_root = true;
    RAISE NOTICE 'Une seule organisation — marquée is_platform_root = true.';
    RETURN;
  END IF;

  has_projects := to_regclass('public.projects') IS NOT NULL;
  has_profiles := to_regclass('public.profiles') IS NOT NULL;
  has_departments := to_regclass('public.departments') IS NOT NULL;

  IF has_profiles AND has_projects AND has_departments THEN
    SELECT o.id INTO keeper
    FROM public.organizations o
    ORDER BY
      (SELECT count(*)::bigint FROM public.profiles p WHERE p.organization_id = o.id) * 10
      + (SELECT count(*)::bigint FROM public.projects pr WHERE pr.organization_id = o.id) * 5
      + (SELECT count(*)::bigint FROM public.departments d WHERE d.organization_id = o.id) * 3 DESC,
      CASE WHEN o.id = preferred THEN 0 ELSE 1 END,
      o.created_at ASC NULLS LAST
    LIMIT 1;
  ELSIF has_profiles AND has_projects THEN
    SELECT o.id INTO keeper
    FROM public.organizations o
    ORDER BY
      (SELECT count(*)::bigint FROM public.profiles p WHERE p.organization_id = o.id) * 10
      + (SELECT count(*)::bigint FROM public.projects pr WHERE pr.organization_id = o.id) * 5 DESC,
      CASE WHEN o.id = preferred THEN 0 ELSE 1 END,
      o.created_at ASC NULLS LAST
    LIMIT 1;
  ELSIF has_profiles THEN
    SELECT o.id INTO keeper
    FROM public.organizations o
    ORDER BY
      (SELECT count(*)::bigint FROM public.profiles p WHERE p.organization_id = o.id) * 10 DESC,
      CASE WHEN o.id = preferred THEN 0 ELSE 1 END,
      o.created_at ASC NULLS LAST
    LIMIT 1;
  ELSE
    SELECT o.id INTO keeper
    FROM public.organizations o
    ORDER BY
      CASE WHEN o.id = preferred THEN 0 ELSE 1 END,
      o.created_at ASC NULLS LAST
    LIMIT 1;
  END IF;

  IF keeper IS NULL THEN
    RAISE EXCEPTION 'Impossible de déterminer l’organisation conservée.';
  END IF;

  RAISE NOTICE 'Organisation conservée (keeper) = %', keeper;

  UPDATE public.organizations SET is_platform_root = false;

  FOR r IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'organization_id'
      AND t.table_type = 'BASE TABLE'
      AND c.table_name <> 'organizations'
  LOOP
    EXECUTE format(
      'UPDATE public.%I SET organization_id = $1 WHERE organization_id IS DISTINCT FROM $1',
      r.table_name
    ) USING keeper;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n > 0 THEN
      RAISE NOTICE 'Table % : % lignes réattribuées vers le keeper', r.table_name, n;
    END IF;
  END LOOP;

  DELETE FROM public.organizations WHERE id IS DISTINCT FROM keeper;

  UPDATE public.organizations SET is_platform_root = true WHERE id = keeper;

  RAISE NOTICE 'Fusion terminée — une organisation plateforme + données conservées.';
END $$;
