-- =============================================================================
-- Paie : pay_slips (si absent), pay_slip_lines, payroll_rubric_definitions
-- Multi-tenant par organization_id — RLS alignée sur profils de l’org
-- =============================================================================

-- Table mère bulletins (idempotente pour instances où elle existait déjà hors repo)
CREATE TABLE IF NOT EXISTS public.pay_slips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross_amount numeric(18, 2) NOT NULL DEFAULT 0,
  net_amount numeric(18, 2) NOT NULL DEFAULT 0,
  currency_code text NOT NULL DEFAULT 'XOF',
  status text NOT NULL DEFAULT 'draft' CHECK (status = ANY (ARRAY['draft'::text, 'validated'::text, 'paid'::text])),
  notes text,
  project_id uuid,
  programme_id uuid,
  funding_source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pay_slips_period_chk CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS pay_slips_org_period_idx
  ON public.pay_slips (organization_id, period_start DESC, period_end DESC);
CREATE INDEX IF NOT EXISTS pay_slips_profile_idx
  ON public.pay_slips (profile_id);

COMMENT ON COLUMN public.pay_slips.project_id IS 'Analytique optionnelle (projet)';
COMMENT ON COLUMN public.pay_slips.programme_id IS 'Analytique optionnelle (programme)';
COMMENT ON COLUMN public.pay_slips.funding_source IS 'Bailleur / financement (texte libre ou code)';

-- Si pay_slips existait déjà sans colonnes analytiques
ALTER TABLE public.pay_slips ADD COLUMN IF NOT EXISTS project_id uuid;
ALTER TABLE public.pay_slips ADD COLUMN IF NOT EXISTS programme_id uuid;
ALTER TABLE public.pay_slips ADD COLUMN IF NOT EXISTS funding_source text;

-- Lignes de bulletin (rubriques)
CREATE TABLE IF NOT EXISTS public.pay_slip_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_slip_id uuid NOT NULL REFERENCES public.pay_slips (id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  rubrique_code text NOT NULL,
  label text NOT NULL,
  side text NOT NULL DEFAULT 'gain' CHECK (side = ANY (ARRAY['gain'::text, 'deduction'::text, 'info'::text])),
  amount numeric(18, 2) NOT NULL DEFAULT 0,
  order_index int NOT NULL DEFAULT 0,
  metadata jsonb,
  ohada_account_suggestion text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pay_slip_lines_slip_idx ON public.pay_slip_lines (pay_slip_id);
CREATE INDEX IF NOT EXISTS pay_slip_lines_org_idx ON public.pay_slip_lines (organization_id);

-- Catalogue rubriques paramétrable par organisation
CREATE TABLE IF NOT EXISTS public.payroll_rubric_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  code text NOT NULL,
  label_fr text NOT NULL,
  label_en text,
  rubric_type text NOT NULL DEFAULT 'gain' CHECK (rubric_type = ANY (ARRAY['gain'::text, 'cotisation_sal'::text, 'cotisation_pat'::text, 'impot'::text, 'info'::text])),
  rate_percent numeric(10, 4),
  formula text,
  ohada_account_suggestion text,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payroll_rubric_org_code_unique UNIQUE (organization_id, code)
);

CREATE INDEX IF NOT EXISTS payroll_rubric_definitions_org_idx
  ON public.payroll_rubric_definitions (organization_id, active, sort_order);

-- ---------------------------------------------------------------------------
-- RLS pay_slips
-- ---------------------------------------------------------------------------
ALTER TABLE public.pay_slips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pay_slips_select_org" ON public.pay_slips;
CREATE POLICY "pay_slips_select_org"
  ON public.pay_slips FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id IS NOT DISTINCT FROM pay_slips.organization_id
    )
  );

DROP POLICY IF EXISTS "pay_slips_insert_org" ON public.pay_slips;
CREATE POLICY "pay_slips_insert_org"
  ON public.pay_slips FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = pay_slips.organization_id
    )
  );

DROP POLICY IF EXISTS "pay_slips_update_org" ON public.pay_slips;
CREATE POLICY "pay_slips_update_org"
  ON public.pay_slips FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = pay_slips.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = pay_slips.organization_id
    )
  );

DROP POLICY IF EXISTS "pay_slips_delete_org" ON public.pay_slips;
CREATE POLICY "pay_slips_delete_org"
  ON public.pay_slips FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = pay_slips.organization_id
    )
  );

-- ---------------------------------------------------------------------------
-- RLS pay_slip_lines
-- ---------------------------------------------------------------------------
ALTER TABLE public.pay_slip_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pay_slip_lines_select_org" ON public.pay_slip_lines;
CREATE POLICY "pay_slip_lines_select_org"
  ON public.pay_slip_lines FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id IS NOT DISTINCT FROM pay_slip_lines.organization_id
    )
  );

DROP POLICY IF EXISTS "pay_slip_lines_insert_org" ON public.pay_slip_lines;
CREATE POLICY "pay_slip_lines_insert_org"
  ON public.pay_slip_lines FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = pay_slip_lines.organization_id
    )
  );

DROP POLICY IF EXISTS "pay_slip_lines_update_org" ON public.pay_slip_lines;
CREATE POLICY "pay_slip_lines_update_org"
  ON public.pay_slip_lines FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = pay_slip_lines.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = pay_slip_lines.organization_id
    )
  );

DROP POLICY IF EXISTS "pay_slip_lines_delete_org" ON public.pay_slip_lines;
CREATE POLICY "pay_slip_lines_delete_org"
  ON public.pay_slip_lines FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = pay_slip_lines.organization_id
    )
  );

-- ---------------------------------------------------------------------------
-- RLS payroll_rubric_definitions
-- ---------------------------------------------------------------------------
ALTER TABLE public.payroll_rubric_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payroll_rubric_select_org" ON public.payroll_rubric_definitions;
CREATE POLICY "payroll_rubric_select_org"
  ON public.payroll_rubric_definitions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id IS NOT DISTINCT FROM payroll_rubric_definitions.organization_id
    )
  );

DROP POLICY IF EXISTS "payroll_rubric_write_org" ON public.payroll_rubric_definitions;
CREATE POLICY "payroll_rubric_write_org"
  ON public.payroll_rubric_definitions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = payroll_rubric_definitions.organization_id
    )
  );

DROP POLICY IF EXISTS "payroll_rubric_update_org" ON public.payroll_rubric_definitions;
CREATE POLICY "payroll_rubric_update_org"
  ON public.payroll_rubric_definitions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = payroll_rubric_definitions.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = payroll_rubric_definitions.organization_id
    )
  );

DROP POLICY IF EXISTS "payroll_rubric_delete_org" ON public.payroll_rubric_definitions;
CREATE POLICY "payroll_rubric_delete_org"
  ON public.payroll_rubric_definitions FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = payroll_rubric_definitions.organization_id
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pay_slips TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pay_slip_lines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_rubric_definitions TO authenticated;
