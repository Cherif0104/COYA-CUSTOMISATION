begin;

-- Dimensions analytiques transverses sur les lignes d'écriture
-- - Rattachements optionnels vers projets / programmes / activités / demandes véhicule
-- - Métadonnées libres JSONB pour idempotence et rapprochements métier

alter table public.journal_entry_lines
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists programme_id uuid references public.programmes(id) on delete set null,
  add column if not exists activity_id uuid references public.project_activities(id) on delete set null,
  add column if not exists vehicle_request_id uuid references public.vehicle_requests(id) on delete set null,
  add column if not exists metadata jsonb;

create index if not exists idx_journal_entry_lines_project
  on public.journal_entry_lines(project_id);

create index if not exists idx_journal_entry_lines_programme
  on public.journal_entry_lines(programme_id);

create index if not exists idx_journal_entry_lines_activity
  on public.journal_entry_lines(activity_id);

create index if not exists idx_journal_entry_lines_vehicle_request
  on public.journal_entry_lines(vehicle_request_id);

-- Index GIN générique pour recherches sur métadonnées (ex. metadata->>'invoice_id')
create index if not exists idx_journal_entry_lines_metadata
  on public.journal_entry_lines
  using gin (metadata);

commit;

