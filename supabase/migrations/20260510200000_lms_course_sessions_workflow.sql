-- LMS Phase 2 : workflow éditorial sur `courses` + sessions (cohortes) + inscriptions par session.
-- RLS : même schéma que les autres tables métier — `organization_id` aligné sur `profiles.organization_id`.
-- Après déploiement : `supabase db push` ou appliquer manuellement sur l’instance cible.

begin;

-- ---------------------------------------------------------------------------
-- Workflow de validation (distinct du statut catalogue draft/published)
-- ---------------------------------------------------------------------------
alter table public.courses
  add column if not exists publish_workflow_status text not null default 'none';

alter table public.courses
  add column if not exists submitted_for_review_at timestamptz;

alter table public.courses
  add column if not exists reviewed_at timestamptz;

alter table public.courses
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

comment on column public.courses.publish_workflow_status is 'LMS : none | in_review | approved | changes_requested — avant publication catalogue.';
comment on column public.courses.submitted_for_review_at is 'LMS : date de soumission pour relecture.';
comment on column public.courses.reviewed_at is 'LMS : date de décision relecteur.';
comment on column public.courses.reviewed_by is 'LMS : auth.users id du relecteur.';

-- ---------------------------------------------------------------------------
-- Sessions / cohortes rattachées à un cours
-- ---------------------------------------------------------------------------
create table if not exists public.course_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null default '',
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_course_sessions_org on public.course_sessions(organization_id);
create index if not exists idx_course_sessions_course on public.course_sessions(course_id);

comment on table public.course_sessions is 'LMS : occurrence planifiée d’un cours (cohorte / session).';

-- ---------------------------------------------------------------------------
-- Inscriptions par session (aperçu liste — distinct de course_enrollments cours)
-- ---------------------------------------------------------------------------
create table if not exists public.course_session_enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_session_id uuid not null references public.course_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'enrolled',
  created_at timestamptz not null default now(),
  constraint course_session_enrollments_session_user unique (course_session_id, user_id)
);

create index if not exists idx_course_session_enrollments_org on public.course_session_enrollments(organization_id);
create index if not exists idx_course_session_enrollments_session on public.course_session_enrollments(course_session_id);

comment on table public.course_session_enrollments is 'LMS : participant inscrit à une session précise.';

-- ---------------------------------------------------------------------------
-- RLS course_sessions
-- ---------------------------------------------------------------------------
alter table public.course_sessions enable row level security;

drop policy if exists course_sessions_select_org on public.course_sessions;
create policy course_sessions_select_org
  on public.course_sessions for select to authenticated
  using (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

drop policy if exists course_sessions_insert_org on public.course_sessions;
create policy course_sessions_insert_org
  on public.course_sessions for insert to authenticated
  with check (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

drop policy if exists course_sessions_update_org on public.course_sessions;
create policy course_sessions_update_org
  on public.course_sessions for update to authenticated
  using (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  )
  with check (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

drop policy if exists course_sessions_delete_org on public.course_sessions;
create policy course_sessions_delete_org
  on public.course_sessions for delete to authenticated
  using (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

-- ---------------------------------------------------------------------------
-- RLS course_session_enrollments
-- ---------------------------------------------------------------------------
alter table public.course_session_enrollments enable row level security;

drop policy if exists course_session_enrollments_select_org on public.course_session_enrollments;
create policy course_session_enrollments_select_org
  on public.course_session_enrollments for select to authenticated
  using (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

drop policy if exists course_session_enrollments_insert_org on public.course_session_enrollments;
create policy course_session_enrollments_insert_org
  on public.course_session_enrollments for insert to authenticated
  with check (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

drop policy if exists course_session_enrollments_update_org on public.course_session_enrollments;
create policy course_session_enrollments_update_org
  on public.course_session_enrollments for update to authenticated
  using (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  )
  with check (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

drop policy if exists course_session_enrollments_delete_org on public.course_session_enrollments;
create policy course_session_enrollments_delete_org
  on public.course_session_enrollments for delete to authenticated
  using (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

commit;
