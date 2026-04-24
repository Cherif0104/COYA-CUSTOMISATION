-- =============================================================================
-- CRM : étendre contacts.status pour le cycle COYA (injoignable, rappel, etc.)
-- À appliquer sur le projet Supabase si l’erreur 23514 contacts_status_check apparaît.
-- =============================================================================

ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_status_check;

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_status_check CHECK (
    status IS NULL
    OR lower(btrim(status::text)) IN (
      'lead',
      'contacted',
      'unreachable',
      'callback_expected',
      'prospect',
      'customer'
    )
  );

COMMENT ON CONSTRAINT contacts_status_check ON public.contacts IS
  'Cycle CRM COYA : lead → contacted → unreachable | callback_expected → prospect → customer';
