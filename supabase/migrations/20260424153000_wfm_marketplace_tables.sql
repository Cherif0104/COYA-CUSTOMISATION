-- =============================================================================
-- WFM Marketplace : open shifts + swap requests
-- Aligné avec coya-pro/services/dataService.ts (wfm_open_shifts, wfm_swap_requests)
-- =============================================================================

-- updated_at (réutilisable si déjà présent : CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.wfm_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- wfm_open_shifts
-- assigned_user_id / created_by_id = auth.users.id (cohérent avec planning_slots.user_id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wfm_open_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  slot_date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  role_name text,
  location text,
  premium_percent integer,
  status text NOT NULL DEFAULT 'open',
  assigned_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_by_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wfm_open_shifts_status_check CHECK (status = ANY (ARRAY['open'::text, 'taken'::text, 'cancelled'::text])),
  CONSTRAINT wfm_open_shifts_premium_check CHECK (
    premium_percent IS NULL OR premium_percent >= 0 AND premium_percent <= 500
  )
);

CREATE INDEX IF NOT EXISTS wfm_open_shifts_org_date_idx
  ON public.wfm_open_shifts (organization_id, slot_date);

CREATE INDEX IF NOT EXISTS wfm_open_shifts_org_status_idx
  ON public.wfm_open_shifts (organization_id, status);

DROP TRIGGER IF EXISTS trg_wfm_open_shifts_updated_at ON public.wfm_open_shifts;
CREATE TRIGGER trg_wfm_open_shifts_updated_at
  BEFORE UPDATE ON public.wfm_open_shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.wfm_touch_updated_at();

ALTER TABLE public.wfm_open_shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wfm_open_shifts_select" ON public.wfm_open_shifts;
CREATE POLICY "wfm_open_shifts_select"
  ON public.wfm_open_shifts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id IS NOT NULL
        AND p.organization_id = wfm_open_shifts.organization_id
    )
  );

DROP POLICY IF EXISTS "wfm_open_shifts_insert" ON public.wfm_open_shifts;
CREATE POLICY "wfm_open_shifts_insert"
  ON public.wfm_open_shifts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id IS NOT NULL
        AND p.organization_id = wfm_open_shifts.organization_id
    )
  );

DROP POLICY IF EXISTS "wfm_open_shifts_update" ON public.wfm_open_shifts;
CREATE POLICY "wfm_open_shifts_update"
  ON public.wfm_open_shifts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id IS NOT NULL
        AND p.organization_id = wfm_open_shifts.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id IS NOT NULL
        AND p.organization_id = wfm_open_shifts.organization_id
    )
  );

DROP POLICY IF EXISTS "wfm_open_shifts_delete" ON public.wfm_open_shifts;
CREATE POLICY "wfm_open_shifts_delete"
  ON public.wfm_open_shifts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id IS NOT NULL
        AND p.organization_id = wfm_open_shifts.organization_id
    )
  );

-- ---------------------------------------------------------------------------
-- wfm_swap_requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wfm_swap_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  slot_date date,
  start_time time without time zone,
  end_time time without time zone,
  planning_slot_id uuid REFERENCES public.planning_slots (id) ON DELETE SET NULL,
  requester_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wfm_swap_requests_status_check CHECK (
    status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text])
  )
);

CREATE INDEX IF NOT EXISTS wfm_swap_requests_org_created_idx
  ON public.wfm_swap_requests (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS wfm_swap_requests_org_status_idx
  ON public.wfm_swap_requests (organization_id, status);

DROP TRIGGER IF EXISTS trg_wfm_swap_requests_updated_at ON public.wfm_swap_requests;
CREATE TRIGGER trg_wfm_swap_requests_updated_at
  BEFORE UPDATE ON public.wfm_swap_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.wfm_touch_updated_at();

ALTER TABLE public.wfm_swap_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wfm_swap_requests_select" ON public.wfm_swap_requests;
CREATE POLICY "wfm_swap_requests_select"
  ON public.wfm_swap_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id IS NOT NULL
        AND p.organization_id = wfm_swap_requests.organization_id
    )
  );

DROP POLICY IF EXISTS "wfm_swap_requests_insert" ON public.wfm_swap_requests;
CREATE POLICY "wfm_swap_requests_insert"
  ON public.wfm_swap_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id IS NOT NULL
        AND p.organization_id = wfm_swap_requests.organization_id
    )
    AND requester_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "wfm_swap_requests_update" ON public.wfm_swap_requests;
CREATE POLICY "wfm_swap_requests_update"
  ON public.wfm_swap_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id IS NOT NULL
        AND p.organization_id = wfm_swap_requests.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id IS NOT NULL
        AND p.organization_id = wfm_swap_requests.organization_id
    )
  );

DROP POLICY IF EXISTS "wfm_swap_requests_delete" ON public.wfm_swap_requests;
CREATE POLICY "wfm_swap_requests_delete"
  ON public.wfm_swap_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = wfm_swap_requests.organization_id
        AND (
          wfm_swap_requests.requester_user_id = auth.uid()
          OR (p.role)::text = ANY (
            ARRAY['manager'::text, 'administrator'::text, 'super_administrator'::text]
          )
        )
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wfm_open_shifts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wfm_swap_requests TO authenticated;

-- ---------------------------------------------------------------------------
-- Données de démo (open shifts uniquement ; pas d’auth.uid() en migration)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.organizations LIMIT 20
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.wfm_open_shifts s WHERE s.organization_id = r.id LIMIT 1
    ) THEN
      INSERT INTO public.wfm_open_shifts (
        organization_id, slot_date, start_time, end_time, role_name, location, premium_percent, status
      )
      VALUES
        (r.id, (CURRENT_DATE + 1), '08:00'::time, '16:00'::time, 'Caissier / accueil', 'Siège', 15, 'open'),
        (r.id, (CURRENT_DATE + 3), '14:00'::time, '22:00'::time, 'Logistique soir', 'Entrepôt', NULL, 'open');
    END IF;
  END LOOP;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'organizations ou table manquante — seed ignoré';
  WHEN others THEN
    RAISE NOTICE 'seed wfm_open_shifts ignoré: %', SQLERRM;
END;
$$;

COMMENT ON TABLE public.wfm_open_shifts IS 'Shifts ouverts (marketplace WFM) — multi-tenant par organization_id';
COMMENT ON TABLE public.wfm_swap_requests IS 'Demandes d’échange / swap entre utilisateurs — multi-tenant';
