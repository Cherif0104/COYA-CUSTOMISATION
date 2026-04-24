-- Date / heure de prochaine relance ou rappel (CRM échanges)
ALTER TABLE public.contact_interactions
  ADD COLUMN IF NOT EXISTS follow_up_at timestamptz;

COMMENT ON COLUMN public.contact_interactions.follow_up_at IS 'Prochaine échéance de relance ou rappel (optionnel)';

CREATE INDEX IF NOT EXISTS contact_interactions_follow_up_idx
  ON public.contact_interactions (organization_id, follow_up_at)
  WHERE follow_up_at IS NOT NULL;
