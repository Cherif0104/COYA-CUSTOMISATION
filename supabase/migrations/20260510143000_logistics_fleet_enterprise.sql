-- =============================================================================
-- COYA — Logistique & parc auto (phase 1 entreprise)
-- Trace N+1 / flotte, catalogue véhicule (sous-ensemble + extensible), cycle de vie,
-- remises/retours, actifs sensibles (rétention / destruction), audit métier.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Catalogue véhicule (données de référence globales, lecture pour tous les auth)
-- Phase 2 : import JSON/API externe — ici tables relationnelles + graines minimales.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.vehicle_catalog_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vehicle_catalog_brands_name_unique UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.vehicle_catalog_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.vehicle_catalog_brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  year_from int,
  year_to int,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vehicle_catalog_models_brand_name_unique UNIQUE (brand_id, name)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_catalog_models_brand ON public.vehicle_catalog_models(brand_id);

ALTER TABLE public.vehicle_catalog_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_catalog_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicle_catalog_brands_select_auth" ON public.vehicle_catalog_brands;
CREATE POLICY "vehicle_catalog_brands_select_auth"
  ON public.vehicle_catalog_brands FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "vehicle_catalog_models_select_auth" ON public.vehicle_catalog_models;
CREATE POLICY "vehicle_catalog_models_select_auth"
  ON public.vehicle_catalog_models FOR SELECT TO authenticated USING (true);

-- Graines (sous-ensemble) — compléter en phase 2 (import script / dataset externe)
INSERT INTO public.vehicle_catalog_brands (name, sort_order) VALUES
  ('Peugeot', 10),
  ('Renault', 20),
  ('Toyota', 30),
  ('Mercedes-Benz', 40)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_catalog_models (brand_id, name, year_from, year_to)
SELECT b.id, m.name, m.yf, m.yt
FROM public.vehicle_catalog_brands b
JOIN (VALUES
  ('Peugeot', '208', 2019, NULL::int),
  ('Peugeot', '3008', 2016, NULL::int),
  ('Renault', 'Clio', 2019, NULL::int),
  ('Renault', 'Kangoo', 2020, NULL::int),
  ('Toyota', 'Hilux', 2015, NULL::int),
  ('Mercedes-Benz', 'Sprinter', 2018, NULL::int)
) AS m(brand_name, name, yf, yt) ON b.name = m.brand_name
ON CONFLICT (brand_id, name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Audit métier logistique / flotte (qui, quoi, quand — détail dans details jsonb)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.logistics_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subject_type text NOT NULL,
  subject_id uuid NOT NULL,
  actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logistics_audit_org_created ON public.logistics_audit_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logistics_audit_subject ON public.logistics_audit_events(subject_type, subject_id);

ALTER TABLE public.logistics_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logistics_audit_select_org" ON public.logistics_audit_events;
CREATE POLICY "logistics_audit_select_org"
  ON public.logistics_audit_events FOR SELECT TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "logistics_audit_insert_self" ON public.logistics_audit_events;
CREATE POLICY "logistics_audit_insert_self"
  ON public.logistics_audit_events FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    AND actor_profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Équipements : référence, stock, maintenance prévisionnelle, actifs sensibles
-- ---------------------------------------------------------------------------

ALTER TABLE public.equipments
  ADD COLUMN IF NOT EXISTS asset_reference text,
  ADD COLUMN IF NOT EXISTS quantity_on_hand int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS reorder_threshold int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS maintenance_next_due date,
  ADD COLUMN IF NOT EXISTS maintenance_estimated_cost_cents bigint,
  ADD COLUMN IF NOT EXISTS sensitive_asset boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sensitive_retention_end date,
  ADD COLUMN IF NOT EXISTS sensitive_disposal_status text NOT NULL DEFAULT 'none'
    CHECK (sensitive_disposal_status IN ('none', 'retention', 'cleared', 'destroyed'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_equipments_org_asset_reference
  ON public.equipments(organization_id, asset_reference)
  WHERE asset_reference IS NOT NULL AND length(trim(asset_reference)) > 0;

COMMENT ON COLUMN public.equipments.sensitive_disposal_status IS
  'none: standard; retention: attente fin rétention disque; cleared: données effacées; destroyed: destruction matérielle constatée';

-- ---------------------------------------------------------------------------
-- Véhicules : lien catalogue, cycle de vie, kilométrage courant
-- ---------------------------------------------------------------------------

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS vehicle_catalog_model_id uuid REFERENCES public.vehicle_catalog_models(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS acquisition_kind text CHECK (acquisition_kind IS NULL OR acquisition_kind IN ('new', 'used')),
  ADD COLUMN IF NOT EXISTS odometer_acquisition int,
  ADD COLUMN IF NOT EXISTS current_odometer int,
  ADD COLUMN IF NOT EXISTS purchase_price_cents bigint,
  ADD COLUMN IF NOT EXISTS in_service_from date,
  ADD COLUMN IF NOT EXISTS useful_life_months int,
  ADD COLUMN IF NOT EXISTS depreciation_method text,
  ADD COLUMN IF NOT EXISTS accumulated_depreciation_cents bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retired_at timestamptz,
  ADD COLUMN IF NOT EXISTS replacement_notes text;

COMMENT ON COLUMN public.vehicles.retired_at IS 'Fin de vie parc : véhicule retiré du service actif';

-- ---------------------------------------------------------------------------
-- Demandes véhicule : mission, liens programme/projet/tâche, N+1 puis flotte
-- ---------------------------------------------------------------------------

ALTER TABLE public.vehicle_requests
  ADD COLUMN IF NOT EXISTS programme_id uuid REFERENCES public.programmes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mission_justification text,
  ADD COLUMN IF NOT EXISTS designated_approver_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.vehicle_requests.designated_approver_profile_id IS
  'Si renseigné, remplace le manager RH (employees.manager_id) pour l''étape N+1';

-- Étendre les statuts : pending_n1 → pending_fleet → validated → allocated → returned
DO $$
DECLARE
  cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  WHERE con.conrelid = 'public.vehicle_requests'::regclass
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%status%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.vehicle_requests DROP CONSTRAINT %I', cname);
  END IF;
END $$;

-- Anciennes lignes « requested » : elles avaient sauté l’étape N+1 → considérées en attente flotte
UPDATE public.vehicle_requests SET status = 'pending_fleet' WHERE status = 'requested';

ALTER TABLE public.vehicle_requests
  ADD CONSTRAINT vehicle_requests_status_check CHECK (
    status IN ('pending_n1', 'pending_fleet', 'validated', 'allocated', 'returned', 'rejected')
  );

CREATE INDEX IF NOT EXISTS idx_vehicle_requests_status ON public.vehicle_requests(organization_id, status);

-- ---------------------------------------------------------------------------
-- Remise / retour véhicule (constat km, carburant, état, maintenance)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.vehicle_handover_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_request_id uuid NOT NULL REFERENCES public.vehicle_requests(id) ON DELETE CASCADE,
  phase text NOT NULL CHECK (phase IN ('checkout', 'checkin')),
  odometer int,
  fuel_level_percent smallint CHECK (fuel_level_percent IS NULL OR (fuel_level_percent >= 0 AND fuel_level_percent <= 100)),
  condition_notes text,
  maintenance_flag boolean NOT NULL DEFAULT false,
  recorded_by_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vehicle_handover_request_phase_unique UNIQUE (vehicle_request_id, phase)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_handover_org ON public.vehicle_handover_reports(organization_id);

ALTER TABLE public.vehicle_handover_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicle_handover_select_org" ON public.vehicle_handover_reports;
CREATE POLICY "vehicle_handover_select_org"
  ON public.vehicle_handover_reports FOR SELECT TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "vehicle_handover_insert_org" ON public.vehicle_handover_reports;
CREATE POLICY "vehicle_handover_insert_org"
  ON public.vehicle_handover_reports FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    AND recorded_by_profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "vehicle_handover_update_recorder" ON public.vehicle_handover_reports;
CREATE POLICY "vehicle_handover_update_recorder"
  ON public.vehicle_handover_reports FOR UPDATE TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    AND recorded_by_profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    AND recorded_by_profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- RLS vehicle_requests : N+1 (manager désigné ou RH) vs rôles flotte / managers
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Managers can update vehicle_requests" ON public.vehicle_requests;

DROP POLICY IF EXISTS "vehicle_requests_update_n1" ON public.vehicle_requests;
CREATE POLICY "vehicle_requests_update_n1"
  ON public.vehicle_requests FOR UPDATE TO authenticated
  USING (
    status = 'pending_n1'
    AND organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    AND COALESCE(
      designated_approver_profile_id,
      (
        SELECT e.manager_id
        FROM public.employees e
        WHERE e.organization_id = vehicle_requests.organization_id
          AND e.profile_id = vehicle_requests.requester_id
        LIMIT 1
      )
    ) = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    AND status IN ('pending_fleet', 'rejected')
  );

DROP POLICY IF EXISTS "vehicle_requests_update_fleet_roles" ON public.vehicle_requests;
CREATE POLICY "vehicle_requests_update_fleet_roles"
  ON public.vehicle_requests FOR UPDATE TO authenticated
  USING (
    status IN ('pending_fleet', 'validated', 'allocated')
    AND organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('super_administrator', 'administrator', 'manager')
    )
  )
  WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
  );
