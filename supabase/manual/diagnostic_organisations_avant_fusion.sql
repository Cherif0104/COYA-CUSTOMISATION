-- À exécuter dans Supabase → SQL Editor (lecture seule).
-- Affiche le score par organisation : celle qui sera « keeper » en général = première ligne après tri.

SELECT
  o.id,
  o.name,
  o.slug,
  (SELECT count(*)::bigint FROM public.profiles p WHERE p.organization_id = o.id) AS nb_profils,
  (SELECT count(*)::bigint FROM public.projects pr WHERE pr.organization_id = o.id) AS nb_projets,
  CASE WHEN to_regclass('public.departments') IS NOT NULL
    THEN (SELECT count(*)::bigint FROM public.departments d WHERE d.organization_id = o.id)
    ELSE 0::bigint
  END AS nb_departements,
  (SELECT count(*)::bigint FROM public.profiles p WHERE p.organization_id = o.id) * 10
    + (SELECT count(*)::bigint FROM public.projects pr WHERE pr.organization_id = o.id) * 5
    + CASE WHEN to_regclass('public.departments') IS NOT NULL
      THEN (SELECT count(*)::bigint FROM public.departments d WHERE d.organization_id = o.id) * 3
      ELSE 0::bigint
    END AS score_fusion,
  CASE
    WHEN lower(coalesce(o.name, '')) LIKE '%senegel%' OR lower(coalesce(o.slug, '')) LIKE '%senegel%' THEN true
    ELSE false
  END AS nom_senegel
FROM public.organizations o
ORDER BY score_fusion DESC, nom_senegel DESC, o.created_at ASC NULLS LAST;
