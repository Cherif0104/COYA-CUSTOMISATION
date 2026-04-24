-- =============================================================================
-- Consolidation mono-organisation (COYA / Alentum) — version historique.
-- Préférez plutôt `20260428143000_organization_platform_root_and_merge.sql` :
-- même fusion dynamique + choix du « keeper » par volumétrie (profils, projets,
-- départements) + colonne `is_platform_root`.
--
-- Réattribue toutes les lignes `organization_id` vers l’organisation conservée,
-- puis supprime les autres lignes de `public.organizations`.
--
-- Règle de choix du « keeper » :
--   1) UUID explicite ci-dessous s’il existe dans `organizations`
--   2) sinon l’organisation avec le plus de profils liés
--   3) sinon la plus ancienne (`created_at` ASC)
--
-- Après exécution : alignez `VITE_PRIMARY_ORGANIZATION_ID` (ou valeur par défaut
-- dans le front) sur l’UUID conservé, et activez `VITE_SINGLE_ORGANIZATION_MODE=true`.
-- =============================================================================

DO $$
DECLARE
  keeper uuid;
  preferred uuid := '550e8400-e29b-41d4-a716-446655440000'::uuid;
  r record;
  n int;
BEGIN
  IF to_regclass('public.organizations') IS NULL THEN
    RAISE NOTICE 'Table organizations absente — migration ignorée.';
    RETURN;
  END IF;

  SELECT id INTO keeper FROM public.organizations WHERE id = preferred LIMIT 1;

  IF keeper IS NULL THEN
    SELECT o.id INTO keeper
    FROM public.organizations o
    LEFT JOIN public.profiles p ON p.organization_id = o.id
    GROUP BY o.id
    ORDER BY COUNT(p.id) DESC NULLS LAST, o.created_at ASC NULLS FIRST
    LIMIT 1;
  END IF;

  IF keeper IS NULL THEN
    RAISE EXCEPTION 'Aucune organisation trouvée — rien à consolider.';
  END IF;

  RAISE NOTICE 'Organisation conservée (keeper) = %', keeper;

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
      RAISE NOTICE 'Table % : % lignes réattribuées au tenant unique', r.table_name, n;
    END IF;
  END LOOP;

  DELETE FROM public.organizations WHERE id IS DISTINCT FROM keeper;

  RAISE NOTICE 'Consolidation terminée — une seule ligne reste dans public.organizations.';
END $$;
