-- APEX : accès temporaires apprenants + gabarits certificats
-- Tables optionnelles, protégées par RLS `organization_id` alignée sur `profiles.organization_id`.

begin;

-- ---------------------------------------------------------------------------
-- Accès temporaires APEX (invitation par e-mail / lien magique)
-- ---------------------------------------------------------------------------
create table if not exists public.apex_temporary_access (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  session_id uuid references public.course_sessions(id) on delete cascade,
  email text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_apex_temporary_access_org
  on public.apex_temporary_access(organization_id);

create index if not exists idx_apex_temporary_access_course
  on public.apex_temporary_access(course_id);

create index if not exists idx_apex_temporary_access_session
  on public.apex_temporary_access(session_id);

create index if not exists idx_apex_temporary_access_token_hash
  on public.apex_temporary_access(token_hash);

comment on table public.apex_temporary_access is
  'APEX : liens magiques temporaires pour accès apprenant à un cours / une cohorte (token hashé, fenêtre de validité).';

alter table public.apex_temporary_access enable row level security;

drop policy if exists apex_temporary_access_select_org on public.apex_temporary_access;
create policy apex_temporary_access_select_org
  on public.apex_temporary_access for select to authenticated
  using (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

drop policy if exists apex_temporary_access_insert_org on public.apex_temporary_access;
create policy apex_temporary_access_insert_org
  on public.apex_temporary_access for insert to authenticated
  with check (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

drop policy if exists apex_temporary_access_update_org on public.apex_temporary_access;
create policy apex_temporary_access_update_org
  on public.apex_temporary_access for update to authenticated
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

drop policy if exists apex_temporary_access_delete_org on public.apex_temporary_access;
create policy apex_temporary_access_delete_org
  on public.apex_temporary_access for delete to authenticated
  using (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

-- ---------------------------------------------------------------------------
-- Gabarits certificats APEX + enrichissement learning_certificates
-- ---------------------------------------------------------------------------
create table if not exists public.apex_certificate_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  body jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_apex_certificate_templates_org
  on public.apex_certificate_templates(organization_id);

comment on table public.apex_certificate_templates is
  'APEX : gabarits JSON de certificats / attestations (titre, mentions légales, critères).';

alter table public.apex_certificate_templates enable row level security;

drop policy if exists apex_certificate_templates_select_org on public.apex_certificate_templates;
create policy apex_certificate_templates_select_org
  on public.apex_certificate_templates for select to authenticated
  using (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

drop policy if exists apex_certificate_templates_insert_org on public.apex_certificate_templates;
create policy apex_certificate_templates_insert_org
  on public.apex_certificate_templates for insert to authenticated
  with check (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

drop policy if exists apex_certificate_templates_update_org on public.apex_certificate_templates;
create policy apex_certificate_templates_update_org
  on public.apex_certificate_templates for update to authenticated
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

drop policy if exists apex_certificate_templates_delete_org on public.apex_certificate_templates;
create policy apex_certificate_templates_delete_org
  on public.apex_certificate_templates for delete to authenticated
  using (
    organization_id in (
      select organization_id from public.profiles
      where user_id = auth.uid() and organization_id is not null
    )
  );

-- Enrichissement `learning_certificates` : lien gabarit + métadonnées libre.
alter table public.learning_certificates
  add column if not exists template_id uuid references public.apex_certificate_templates(id) on delete set null;

alter table public.learning_certificates
  add column if not exists metadata jsonb not null default '{}'::jsonb;

comment on column public.learning_certificates.template_id is
  'Gabarit APEX utilisé pour générer ce certificat (apex_certificate_templates.id).';

comment on column public.learning_certificates.metadata is
  'Métadonnées libres (critères, score, hash du PDF, etc.).';

commit;

