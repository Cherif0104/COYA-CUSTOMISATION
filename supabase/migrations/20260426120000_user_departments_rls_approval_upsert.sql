-- =============================================================================
-- RLS user_departments : approbation comptes + upsert (INSERT + UPDATE)
-- - Super admin peut assigner dans l’org du département (même si son profil est ailleurs)
-- - Admin org : même organisation que le département
-- - L’utilisateur cible (user_id) doit avoir profiles.organization_id = org du département
-- =============================================================================

ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_departments_insert_admin" ON public.user_departments;
DROP POLICY IF EXISTS "user_departments_insert_org_admin" ON public.user_departments;

CREATE POLICY "user_departments_insert_org_admin"
  ON public.user_departments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.departments d
      INNER JOIN public.profiles target ON target.user_id = user_id
      INNER JOIN public.profiles actor ON actor.user_id = auth.uid()
      WHERE d.id = department_id
        AND target.organization_id IS NOT DISTINCT FROM d.organization_id
        AND (actor.role)::text IN ('super_administrator', 'administrator')
        AND (
          (actor.role)::text = 'super_administrator'
          OR actor.organization_id IS NOT DISTINCT FROM d.organization_id
        )
    )
  );

DROP POLICY IF EXISTS "user_departments_update_org_admin" ON public.user_departments;

CREATE POLICY "user_departments_update_org_admin"
  ON public.user_departments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.departments d
      INNER JOIN public.profiles target ON target.user_id = user_id
      INNER JOIN public.profiles actor ON actor.user_id = auth.uid()
      WHERE d.id = department_id
        AND target.organization_id IS NOT DISTINCT FROM d.organization_id
        AND (actor.role)::text IN ('super_administrator', 'administrator')
        AND (
          (actor.role)::text = 'super_administrator'
          OR actor.organization_id IS NOT DISTINCT FROM d.organization_id
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.departments d
      INNER JOIN public.profiles target ON target.user_id = user_id
      INNER JOIN public.profiles actor ON actor.user_id = auth.uid()
      WHERE d.id = department_id
        AND target.organization_id IS NOT DISTINCT FROM d.organization_id
        AND (actor.role)::text IN ('super_administrator', 'administrator')
        AND (
          (actor.role)::text = 'super_administrator'
          OR actor.organization_id IS NOT DISTINCT FROM d.organization_id
        )
    )
  );
