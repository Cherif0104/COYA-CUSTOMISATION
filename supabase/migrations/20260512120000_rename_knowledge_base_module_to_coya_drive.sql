-- Renommage module UI / permissions : knowledge_base → coya_drive (COYA Drive / GED).

begin;

do $$
begin
  if to_regclass('public.user_module_permissions') is not null then
    update public.user_module_permissions
    set module_name = 'coya_drive'
    where module_name = 'knowledge_base';
  end if;
end $$;

do $$
begin
  if to_regclass('public.departments') is not null then
    update public.departments d
    set module_slugs = (
      select coalesce(
        jsonb_agg(
          case when x = 'knowledge_base' then to_jsonb('coya_drive'::text) else to_jsonb(x) end
        ),
        '[]'::jsonb
      )
      from jsonb_array_elements_text(d.module_slugs) as t(x)
    )
    where exists (
      select 1 from jsonb_array_elements_text(d.module_slugs) as t(x) where x = 'knowledge_base'
    );
  end if;
end $$;

do $$
begin
  if to_regclass('public.module_labels') is not null then
    update public.module_labels
    set module_key = 'coya_drive'
    where module_key = 'knowledge_base';
  end if;
end $$;

notify pgrst, 'reload schema';

commit;
