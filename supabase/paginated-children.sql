-- Applied to production Supabase on 2026-09-16.
-- Do not re-run on the same project unless intentionally replacing the function.
create or replace function public.simids_children_page(
  p_village text default null,
  p_search text default null,
  p_page integer default 1,
  p_page_size integer default 50
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_user_village text;
  v_scope text;
  v_page integer := greatest(coalesce(p_page,1),1);
  v_page_size integer := least(greatest(coalesce(p_page_size,50),1),100);
  v_offset integer;
  v_search text := nullif(btrim(coalesce(p_search,'')),'');
  v_total bigint;
  v_rows jsonb;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode='42501';
  end if;

  select role, village into v_role, v_user_village
  from public.simids_user_access
  where user_id=v_uid and active=true;

  if v_role is null then
    raise exception 'SiMIDS access required' using errcode='42501';
  end if;

  if v_role in ('admin','puskesmas') then
    v_scope := nullif(btrim(coalesce(p_village,'')),'');
    if lower(coalesce(v_scope,''))='all' then v_scope := null; end if;
  else
    v_scope := nullif(btrim(coalesce(v_user_village,'')),'');
    if v_scope is null then
      raise exception 'village assignment required' using errcode='42501';
    end if;
  end if;

  v_offset := (v_page-1)*v_page_size;

  select count(*) into v_total
  from public.simids_children c
  where (v_scope is null or lower(c.village)=lower(v_scope))
    and (
      v_search is null or
      c.name ilike '%'||v_search||'%' or
      coalesce(c.nik,'') ilike '%'||v_search||'%' or
      coalesce(c.parent_name,'') ilike '%'||v_search||'%' or
      coalesce(c.hamlet,'') ilike '%'||v_search||'%' or
      coalesce(c.posyandu,'') ilike '%'||v_search||'%' or
      coalesce(c.village,'') ilike '%'||v_search||'%'
    );

  select coalesce(jsonb_agg(to_jsonb(x) order by x.name, x.id),'[]'::jsonb) into v_rows
  from (
    select
      c.id,c.name,c.dob,c.sex,c.village,c.hamlet,c.posyandu,c.nik,c.parent_name,
      c.phone,c.address,c.province,c.district,c.subdistrict,c.puskesmas,c.registered_at,
      coalesce(s.immunization_count,0)::integer as immunization_count,
      s.last_vaccine,
      s.last_immunization_date
    from public.simids_children c
    left join lateral (
      select
        count(*) as immunization_count,
        (array_agg(i.vaccine_code order by i.immunization_date desc nulls last, i.created_at desc))[1] as last_vaccine,
        max(i.immunization_date) as last_immunization_date
      from public.simids_immunizations i
      where i.child_id=c.id
    ) s on true
    where (v_scope is null or lower(c.village)=lower(v_scope))
      and (
        v_search is null or
        c.name ilike '%'||v_search||'%' or
        coalesce(c.nik,'') ilike '%'||v_search||'%' or
        coalesce(c.parent_name,'') ilike '%'||v_search||'%' or
        coalesce(c.hamlet,'') ilike '%'||v_search||'%' or
        coalesce(c.posyandu,'') ilike '%'||v_search||'%' or
        coalesce(c.village,'') ilike '%'||v_search||'%'
      )
    order by c.name, c.id
    offset v_offset
    limit v_page_size
  ) x;

  return jsonb_build_object(
    'children',v_rows,
    'total',v_total,
    'page',v_page,
    'page_size',v_page_size,
    'pages',greatest(1,ceil(v_total::numeric/v_page_size)::integer),
    'scope',coalesce(v_scope,'all')
  );
end;
$$;

revoke all on function public.simids_children_page(text,text,integer,integer) from public;
grant execute on function public.simids_children_page(text,text,integer,integer) to authenticated;
