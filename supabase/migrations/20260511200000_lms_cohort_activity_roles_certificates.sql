-- LMS : chaîne Programme → Projet → Activité (programme_actions) → Cohorte (course_sessions).
-- Rôles par inscription cohorte (cohort_role). Certification MVP : flags cours + table learning_certificates.
-- RLS : organization_id + profiles, aligné sur les autres tables LMS.

begin;

-- ---------------------------------------------------------------------------
-- Cohortes : lien optionnel vers une action de programme (activité métier)
-- ---------------------------------------------------------------------------
alter table public.course_sessions
  add column if not exists programme_action_id uuid references public.programme_actions(id) on delete set null;

create index if not exists idx_course_sessions_programme_action
  on public.course_sessions(programme_action_id)
  where programme_action_id is not null;

comment on column public.course_sessions.programme_action_id is 'LMS : activité programme (programme_actions) à laquelle cette cohorte est rattachée.';

-- ---------------------------------------------------------------------------
-- Inscriptions cohorte : rôle fonctionnel (distinct du rôle plateforme profiles.role)
-- ---------------------------------------------------------------------------
alter table public.course_session_enrollments
  add column if not exists cohort_role text not null default 'learner';

alter table public.course_session_enrollments
  drop constraint if exists course_session_enrollments_cohort_role_check;

alter table public.course_session_enrollments
  add constraint course_session_enrollments_cohort_role_check
  check (cohort_role in ('learner', 'coach', 'mentor', 'trainer', 'facilitator'));

comment on column public.course_session_enrollments.cohort_role is 'Rôle dans la cohorte : learner (apprenant), coach, mentor, trainer, facilitator.';

-- ---------------------------------------------------------------------------
-- Cours : certification MVP (UI + logique métier complète ultérieure)
-- ---------------------------------------------------------------------------
alter table public.courses
  add column if not exists certification_enabled boolean not null default false;

alter table public.courses
  add column if not exists certification_label text;

comment on column public.courses.certification_enabled is 'LMS : le parcours peut délivrer une attestation / certificat (workflow à brancher).';

comment on column public.courses.certification_label is 'Libellé court affiché côté apprenant (ex. Attestation de participation).';

-- ---------------------------------------------------------------------------
-- Certificats / attestations (stub — émission PDF & signatures hors périmètre)
-- ---------------------------------------------------------------------------
create table if not exists public.learning_certificates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_session_id uuid references public.course_sessions(id) on delete set null,
  status text not null default 'draft',
  certificate_number text,
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_certificates_status_check
    check (status in ('draft', 'issued', 'revoked'))
);

create index if not exists idx_learning_certificates_org on public.learning_certificates(organization_id);
create index if not exists idx_learning_certificates_course on public.learning_certificates(course_id);
create index if not exists idx_learning_certificates_user on public.learning_certificates(user_id);

comment on table public.learning_certificates is 'LMS / ONG : attestations ou certificats — schéma minimal ; émission et exports à brancher.';

alter table public.learning_certificates enable row level security;

drop policy if exists learning_certificates_select_org on public.learning_certificates;
create policy learning_certificates_select_org
  on public.learning_certificates for select to authenticated
  using (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

drop policy if exists learning_certificates_insert_org on public.learning_certificates;
create policy learning_certificates_insert_org
  on public.learning_certificates for insert to authenticated
  with check (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

drop policy if exists learning_certificates_update_org on public.learning_certificates;
create policy learning_certificates_update_org
  on public.learning_certificates for update to authenticated
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

drop policy if exists learning_certificates_delete_org on public.learning_certificates;
create policy learning_certificates_delete_org
  on public.learning_certificates for delete to authenticated
  using (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

commit;
