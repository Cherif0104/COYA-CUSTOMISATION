-- =============================================================================
-- CRM : journal structuré des échanges (codification rapide + historique)
-- Champs : action_type, motif, statut au moment T, optionnel nouveau statut, détail
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.contact_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts (id) ON DELETE CASCADE,
  action_type text NOT NULL,
  motif text,
  status_snapshot text,
  status_updated_to text,
  detail text,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_interactions_action_check CHECK (
    action_type = ANY (
      ARRAY[
        'follow_up'::text,
        'reminder'::text,
        'email_sent'::text,
        'phone_call'::text,
        'meeting'::text,
        'whatsapp'::text,
        'visit'::text,
        'other'::text
      ]
    )
  )
);

CREATE INDEX IF NOT EXISTS contact_interactions_contact_created_idx
  ON public.contact_interactions (contact_id, created_at DESC);

CREATE INDEX IF NOT EXISTS contact_interactions_org_created_idx
  ON public.contact_interactions (organization_id, created_at DESC);

ALTER TABLE public.contact_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_interactions_select" ON public.contact_interactions;
CREATE POLICY "contact_interactions_select"
  ON public.contact_interactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id IS NOT NULL
        AND p.organization_id = contact_interactions.organization_id
    )
  );

DROP POLICY IF EXISTS "contact_interactions_insert" ON public.contact_interactions;
CREATE POLICY "contact_interactions_insert"
  ON public.contact_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id IS NOT NULL
        AND p.organization_id = contact_interactions.organization_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.contacts c
      WHERE c.id = contact_interactions.contact_id
        AND c.organization_id = contact_interactions.organization_id
    )
  );

GRANT SELECT, INSERT ON public.contact_interactions TO authenticated;

COMMENT ON TABLE public.contact_interactions IS
  'Historique CRM des actions sur un contact (relance, rappel, mail, etc.) — multi-tenant';
COMMENT ON COLUMN public.contact_interactions.action_type IS
  'follow_up | reminder | email_sent | phone_call | meeting | whatsapp | visit | other';
COMMENT ON COLUMN public.contact_interactions.motif IS 'Motif / thème de l''échange (libre ou codifié côté UI)';
COMMENT ON COLUMN public.contact_interactions.status_snapshot IS 'Valeur contacts.status au moment de l''enregistrement (snake_case)';
COMMENT ON COLUMN public.contact_interactions.status_updated_to IS 'Si renseigné, nouveau contacts.status appliqué avec cette ligne';
