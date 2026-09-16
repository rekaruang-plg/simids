-- Already applied to the connected Supabase project.
-- Do not run repeatedly on the same project unless intentionally replacing the function.
-- The function loads only one village by default; admin/puskesmas may explicitly request all.

create or replace function public.simids_load_scope(p_village text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_assigned text;
  v_scope text;
  v_result jsonb;
begin
  if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select role, village into v_role, v_assigned
  from public.simids_user_access
  where user_id=v_uid and active;
  if v_role is null then raise exception 'SiMIDS access not assigned' using errcode='42501'; end if;

  if v_role in ('admin','puskesmas') then
    v_scope := nullif(btrim(p_village),'');
  else
    if nullif(btrim(v_assigned),'') is null then raise exception 'Village assignment required' using errcode='42501'; end if;
    if p_village is not null and upper(btrim(p_village)) <> upper(btrim(v_assigned)) then
      raise exception 'Village access denied' using errcode='42501';
    end if;
    v_scope := v_assigned;
  end if;

  with kids as materialized (
    select c.* from public.simids_children c
    where v_scope is null or upper(btrim(c.village))=upper(btrim(v_scope))
  )
  select jsonb_build_object(
    'children', coalesce((select jsonb_agg(jsonb_build_object(
      'id',c.id,'name',c.name,'dob',c.dob,'sex',c.sex,'village',c.village,
      'hamlet',c.hamlet,'posyandu',c.posyandu,'nik',c.nik,'parent_name',c.parent_name,
      'phone',c.phone,'address',c.address,'province',c.province,'district',c.district,
      'subdistrict',c.subdistrict,'puskesmas',c.puskesmas,'registered_at',c.registered_at,
      'updated_at',c.updated_at
    ) order by lower(c.name),c.id) from kids c),'[]'::jsonb),
    'events', coalesce((select jsonb_agg(jsonb_build_object(
      'id',i.id,'child_id',i.child_id,'vaccine_code',i.vaccine_code,
      'immunization_date',i.immunization_date,'input_date',i.input_date,
      'service_place',i.service_place,'next_due_date',i.next_due_date,
      'batch_number',i.batch_number,'notes',i.notes,'validated',i.validated,
      'provider',i.provider,'updated_at',i.updated_at,'created_at',i.created_at,
      'source_import',i.source_import
    ) order by i.immunization_date nulls last,i.id)
      from public.simids_immunizations i join kids c on c.id=i.child_id),'[]'::jsonb),
    'idls', coalesce((select jsonb_agg(jsonb_build_object(
      'child_id',d.child_id,'idl_date',d.idl_date,'input_date',d.input_date,
      'service_place',d.service_place,'forming_puskesmas',d.forming_puskesmas,'status',d.status
    ) order by d.child_id) from public.simids_idl d join kids c on c.id=d.child_id),'[]'::jsonb),
    'followups', coalesce((select jsonb_agg(jsonb_build_object(
      'id',f.id,'child_id',f.child_id,'followup_date',f.followup_date,'outcome',f.outcome,'notes',f.notes
    ) order by f.followup_date desc nulls last,f.id) from public.simids_followups f join kids c on c.id=f.child_id),'[]'::jsonb),
    'education', coalesce((select jsonb_agg(jsonb_build_object(
      'id',e.id,'activity_date',e.activity_date,'activity_type',e.activity_type,'village',e.village,
      'hamlet',e.hamlet,'participants',e.participants,'topic',e.topic,'notes',e.notes
    ) order by e.activity_date desc nulls last,e.id)
      from public.simids_education e where v_scope is null or upper(btrim(e.village))=upper(btrim(v_scope))),'[]'::jsonb),
    'assessments', coalesce((select jsonb_agg(jsonb_build_object(
      'id',a.id,'respondent_name',a.respondent_name,'respondent_type',a.respondent_type,'village',a.village,
      'assessment_date',a.assessment_date,'pre_score',a.pre_score,'post_score',a.post_score
    ) order by a.assessment_date desc nulls last,a.id)
      from public.simids_assessments a where v_scope is null or upper(btrim(a.village))=upper(btrim(v_scope))),'[]'::jsonb),
    'targets', coalesce((select jsonb_agg(jsonb_build_object(
      'village',t.village,'pusdatin_birth_male',t.pusdatin_birth_male,'pusdatin_birth_female',t.pusdatin_birth_female,
      'pusdatin_surviving_male',t.pusdatin_surviving_male,'pusdatin_surviving_female',t.pusdatin_surviving_female,
      'local_birth_male',t.local_birth_male,'local_birth_female',t.local_birth_female,
      'local_surviving_male',t.local_surviving_male,'local_surviving_female',t.local_surviving_female,'verified',t.verified
    ) order by t.village) from public.simids_targets t),'[]'::jsonb),
    'villages', coalesce((select jsonb_agg(village order by village) from (
      select distinct c.village from public.simids_children c
      where c.village is not null and btrim(c.village)<>'' and
        (v_role in ('admin','puskesmas') or upper(btrim(c.village))=upper(btrim(v_assigned)))
    ) q),'[]'::jsonb),
    'scope', coalesce(v_scope,'all')
  ) into v_result;
  return v_result;
end;
$$;

revoke all on function public.simids_load_scope(text) from public, anon;
grant execute on function public.simids_load_scope(text) to authenticated, service_role;
