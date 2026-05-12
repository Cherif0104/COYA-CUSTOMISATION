begin;

-- Configuration JSON optionnelle pour le pont factures → comptabilité.
-- Exemple de structure :
-- {
--   "invoiceReceivableAccountId": "<uuid>",
--   "invoiceRevenueAccountId": "<uuid>",
--   "invoiceJournalId": "<uuid>"
-- }

alter table public.organization_accounting_settings
  add column if not exists bridge_config jsonb;

commit;

