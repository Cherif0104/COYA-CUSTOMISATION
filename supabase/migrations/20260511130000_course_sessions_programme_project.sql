-- LMS / cohortes : rattachement optionnel au Programme et/ou au Projet (promotion / groupe).
-- Modèle minimal aligné sur la hiérarchie métier :
--   - programme → plusieurs cohortes (sessions avec programme_id, project_id null) ;
--   - projet → plusieurs cohortes (sessions avec project_id ; programme_id optionnel pour filtres rapides).
-- RLS inchangée : contrôle par organization_id (membre authentifié de l’org), comme les autres tables LMS Phase 2.
-- UX : en interface, privilégier les libellés « groupe » / « promotion » pour les utilisateurs peu digitalisés.

begin;

alter table public.course_sessions
  add column if not exists programme_id uuid references public.programmes(id) on delete set null;

alter table public.course_sessions
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists idx_course_sessions_programme on public.course_sessions(programme_id)
  where programme_id is not null;

create index if not exists idx_course_sessions_project on public.course_sessions(project_id)
  where project_id is not null;

comment on column public.course_sessions.programme_id is 'LMS : cohorte rattachée au portefeuille programme (nullable si rattachement uniquement projet ou global org).';

comment on column public.course_sessions.project_id is 'LMS : cohorte rattachée à un projet de delivery (nullable si cohorte niveau programme ou globale).';

commit;
