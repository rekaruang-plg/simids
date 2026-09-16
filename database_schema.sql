-- SiMIDS production schema snapshot. No personal records or secrets.
-- Existing project already configured; do not re-run over production.
create schema if not exists simids_private;
revoke all on schema simids_private from public,anon;
grant usage on schema simids_private to authenticated,service_role;

create table public.simids_assessments (
  id uuid default gen_random_uuid() not null,
  respondent_name text not null,
  respondent_type text not null,
  village text,
  assessment_date date default CURRENT_DATE not null,
  pre_score numeric,
  post_score numeric,
  created_by uuid,
  created_at timestamp with time zone default now() not null
);

create table public.simids_audit (
  id bigint not null,
  user_id uuid,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb,
  created_at timestamp with time zone default now() not null
);

create table public.simids_children (
  id uuid default gen_random_uuid() not null,
  source_batch_id uuid,
  source_row integer,
  nik text,
  name text not null,
  dob date,
  sex text,
  parent_name text,
  province text,
  district text,
  subdistrict text,
  village text,
  puskesmas text,
  hamlet text,
  posyandu text,
  phone text,
  address text,
  registered_at date,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.simids_config (
  key text not null,
  value jsonb not null,
  updated_at timestamp with time zone default now() not null
);

create table public.simids_education (
  id uuid default gen_random_uuid() not null,
  activity_date date default CURRENT_DATE not null,
  activity_type text not null,
  village text,
  hamlet text,
  participants integer,
  topic text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone default now() not null
);

create table public.simids_followups (
  id uuid default gen_random_uuid() not null,
  child_id uuid not null,
  followup_date date default CURRENT_DATE not null,
  reason text,
  outcome text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone default now() not null
);

create table public.simids_idl (
  child_id uuid not null,
  idl_date date,
  input_date date,
  service_place text,
  forming_puskesmas text,
  status text,
  source_import boolean default false not null,
  updated_at timestamp with time zone default now() not null
);

create table public.simids_immunizations (
  id uuid default gen_random_uuid() not null,
  child_id uuid not null,
  vaccine_code text not null,
  immunization_date date not null,
  input_date date,
  service_place text,
  provider text,
  batch_number text,
  next_due_date date,
  notes text,
  validated boolean default true not null,
  source_import boolean default false not null,
  source_group text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid,
  validated_by uuid,
  validated_at timestamp with time zone
);

create table public.simids_import_batches (
  id uuid default gen_random_uuid() not null,
  source_name text not null,
  imported_at timestamp with time zone default now() not null,
  row_count integer default 0 not null,
  notes text
);

create table public.simids_import_payload_chunks (
  batch_id uuid not null,
  seq integer not null,
  data text not null
);

create table public.simids_import_rows (
  batch_id uuid not null,
  source_row integer not null,
  payload jsonb not null
);

create table public.simids_targets (
  village text not null,
  pusdatin_birth_male integer default 0 not null,
  pusdatin_birth_female integer default 0 not null,
  pusdatin_surviving_male integer default 0 not null,
  pusdatin_surviving_female integer default 0 not null,
  local_birth_male integer default 0 not null,
  local_birth_female integer default 0 not null,
  local_surviving_male integer default 0 not null,
  local_surviving_female integer default 0 not null,
  updated_at timestamp with time zone default now() not null,
  verified boolean default false not null
);

create table public.simids_user_access (
  user_id uuid not null,
  role text not null,
  display_name text,
  village text,
  active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
alter table public.simids_import_batches add constraint simids_import_batches_pkey PRIMARY KEY (id);
alter table public.simids_import_rows add constraint simids_import_rows_pkey PRIMARY KEY (batch_id, source_row);
alter table public.simids_children add constraint simids_children_sex_check CHECK (((sex = ANY (ARRAY['L'::text, 'P'::text])) OR (sex IS NULL)));
alter table public.simids_children add constraint simids_children_pkey PRIMARY KEY (id);
alter table public.simids_immunizations add constraint simids_immunizations_pkey PRIMARY KEY (id);
alter table public.simids_idl add constraint simids_idl_pkey PRIMARY KEY (child_id);
alter table public.simids_followups add constraint simids_followups_pkey PRIMARY KEY (id);
alter table public.simids_assessments add constraint simids_assessments_pkey PRIMARY KEY (id);
alter table public.simids_education add constraint simids_education_pkey PRIMARY KEY (id);
alter table public.simids_targets add constraint simids_targets_pkey PRIMARY KEY (village);
alter table public.simids_user_access add constraint simids_user_access_role_check CHECK ((role = ANY (ARRAY['kader'::text, 'bidan'::text, 'puskesmas'::text, 'admin'::text])));
alter table public.simids_user_access add constraint simids_user_access_pkey PRIMARY KEY (user_id);
alter table public.simids_config add constraint simids_config_pkey PRIMARY KEY (key);
alter table public.simids_audit add constraint simids_audit_pkey PRIMARY KEY (id);
alter table public.simids_import_payload_chunks add constraint simids_import_payload_chunks_pkey PRIMARY KEY (batch_id, seq);
alter table public.simids_import_rows add constraint simids_import_rows_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES simids_import_batches(id) ON DELETE CASCADE;
alter table public.simids_children add constraint simids_children_source_batch_id_fkey FOREIGN KEY (source_batch_id) REFERENCES simids_import_batches(id) ON DELETE SET NULL;
alter table public.simids_immunizations add constraint simids_immunizations_child_id_fkey FOREIGN KEY (child_id) REFERENCES simids_children(id) ON DELETE CASCADE;
alter table public.simids_idl add constraint simids_idl_child_id_fkey FOREIGN KEY (child_id) REFERENCES simids_children(id) ON DELETE CASCADE;
alter table public.simids_followups add constraint simids_followups_child_id_fkey FOREIGN KEY (child_id) REFERENCES simids_children(id) ON DELETE CASCADE;
alter table public.simids_followups add constraint simids_followups_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public.simids_assessments add constraint simids_assessments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public.simids_education add constraint simids_education_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public.simids_user_access add constraint simids_user_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.simids_audit add constraint simids_audit_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.simids_import_payload_chunks add constraint simids_import_payload_chunks_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES simids_import_batches(id) ON DELETE CASCADE;
alter table public.simids_immunizations add constraint simids_immunizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.simids_immunizations add constraint simids_immunizations_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX simids_immunizations_validated_by_idx ON public.simids_immunizations USING btree (validated_by);
CREATE INDEX simids_immunizations_date_idx ON public.simids_immunizations USING btree (immunization_date);
CREATE INDEX simids_immunizations_child_idx ON public.simids_immunizations USING btree (child_id);
CREATE INDEX simids_assessments_created_by_idx ON public.simids_assessments USING btree (created_by);
CREATE INDEX simids_followups_created_by_idx ON public.simids_followups USING btree (created_by);
CREATE INDEX simids_children_name_idx ON public.simids_children USING btree (lower(name));
CREATE UNIQUE INDEX simids_children_nik_uidx ON public.simids_children USING btree (nik) WHERE ((nik IS NOT NULL) AND (btrim(nik) <> ''::text));
CREATE INDEX simids_audit_user_id_idx ON public.simids_audit USING btree (user_id);
CREATE INDEX simids_immunizations_child_vaccine_idx ON public.simids_immunizations USING btree (child_id, vaccine_code);
CREATE UNIQUE INDEX simids_children_nik_uq ON public.simids_children USING btree (nik) WHERE ((nik IS NOT NULL) AND (nik <> ''::text));
CREATE INDEX simids_children_source_batch_idx ON public.simids_children USING btree (source_batch_id);
CREATE INDEX simids_education_created_by_idx ON public.simids_education USING btree (created_by);
CREATE INDEX simids_immunizations_created_by_idx ON public.simids_immunizations USING btree (created_by);
CREATE INDEX simids_followups_child_idx ON public.simids_followups USING btree (child_id);
CREATE UNIQUE INDEX simids_immunizations_unique_event ON public.simids_immunizations USING btree (child_id, vaccine_code, immunization_date);
CREATE UNIQUE INDEX simids_children_source_row_unique ON public.simids_children USING btree (source_batch_id, source_row);
CREATE INDEX simids_immunizations_vaccine_idx ON public.simids_immunizations USING btree (vaccine_code);
CREATE INDEX simids_children_village_idx ON public.simids_children USING btree (village);
CREATE OR REPLACE FUNCTION simids_private.simids_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select role from public.simids_user_access where auth.uid() is not null and user_id=auth.uid() and active;
$function$
;
revoke all on function simids_private.simids_role() from public,anon,authenticated;
grant execute on function simids_private.simids_role() to service_role,authenticated;
CREATE OR REPLACE FUNCTION simids_private.simids_has_access()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select auth.uid() is not null and exists(select 1 from public.simids_user_access where user_id=auth.uid() and active);
$function$
;
revoke all on function simids_private.simids_has_access() from public,anon,authenticated;
grant execute on function simids_private.simids_has_access() to service_role,authenticated;
CREATE OR REPLACE FUNCTION simids_private.simids_user_village()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select village from public.simids_user_access where auth.uid() is not null and user_id=auth.uid() and active;
$function$
;
revoke all on function simids_private.simids_user_village() from public,anon,authenticated;
grant execute on function simids_private.simids_user_village() to service_role,authenticated;
CREATE OR REPLACE FUNCTION simids_private.simids_can_access_village(p_village text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select simids_private.simids_has_access() and (
   simids_private.simids_role() in ('admin','puskesmas') or
   (nullif(btrim(simids_private.simids_user_village()),'') is not null and
    upper(btrim(p_village))=upper(btrim(simids_private.simids_user_village())))
 );
$function$
;
revoke all on function simids_private.simids_can_access_village(p_village text) from public,anon,authenticated;
grant execute on function simids_private.simids_can_access_village(p_village text) to service_role,authenticated;
CREATE OR REPLACE FUNCTION simids_private.simids_child_accessible(p_child_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select exists(select 1 from public.simids_children where id=p_child_id);
$function$
;
revoke all on function simids_private.simids_child_accessible(p_child_id uuid) from public,anon,authenticated;
grant execute on function simids_private.simids_child_accessible(p_child_id uuid) to service_role,authenticated;
CREATE OR REPLACE FUNCTION public.simids_import_compact_batch(p_batch uuid, p_rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  x jsonb;
  e jsonb;
  cid uuid;
  c_count int := 0;
  e_count int := 0;
  i_count int := 0;
begin
  for x in select value from jsonb_array_elements(p_rows)
  loop
    insert into public.simids_children(
      source_batch_id,source_row,nik,name,dob,sex,parent_name,province,district,subdistrict,village,puskesmas,posyandu
    ) values (
      p_batch,(x->>'r')::int,nullif(x->>'nk',''),coalesce(nullif(x->>'n',''),'(tanpa nama)'),nullif(x->>'d','')::date,
      nullif(x->>'sx',''),nullif(x->>'p',''),nullif(x->>'pr',''),nullif(x->>'di',''),nullif(x->>'sd',''),nullif(x->>'v',''),nullif(x->>'pk',''),nullif(x->>'po','')
    ) returning id into cid;
    c_count := c_count + 1;

    insert into public.simids_import_rows(batch_id,source_row,payload)
    values (p_batch,(x->>'r')::int,x);

    for e in select value from jsonb_array_elements(coalesce(x->'e','[]'::jsonb))
    loop
      insert into public.simids_immunizations(
        child_id,vaccine_code,immunization_date,input_date,service_place,provider,validated,source_import,source_group
      ) values (
        cid,e->>0,(e->>1)::date,nullif(e->>2,'')::date,nullif(e->>3,''),'Import Kohort',true,true,e->>0
      );
      e_count := e_count + 1;
    end loop;

    if x->'i' is not null and jsonb_typeof(x->'i')='array' then
      insert into public.simids_idl(child_id,idl_date,input_date,service_place,forming_puskesmas,status,source_import)
      values (
        cid,nullif(x->'i'->>0,'')::date,nullif(x->'i'->>1,'')::date,nullif(x->'i'->>2,''),nullif(x->'i'->>3,''),nullif(x->'i'->>4,''),true
      );
      i_count := i_count + 1;
    end if;
  end loop;
  return jsonb_build_object('children',c_count,'events',e_count,'idl',i_count);
end $function$
;
revoke all on function public.simids_import_compact_batch(p_batch uuid, p_rows jsonb) from public,anon,authenticated;
grant execute on function public.simids_import_compact_batch(p_batch uuid, p_rows jsonb) to service_role;
CREATE OR REPLACE FUNCTION public.simids_set_immunization_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare r text;
begin
  if auth.uid() is not null then
    r := simids_private.simids_role();
    if tg_op = 'INSERT' then
      new.created_by := auth.uid();
      new.source_import := false;
      new.source_group := null;
      new.validated := coalesce(new.validated,false) and r in ('bidan','puskesmas','admin');
      new.validated_by := case when new.validated then auth.uid() else null end;
      new.validated_at := case when new.validated then now() else null end;
    else
      new.created_by := old.created_by;
      new.source_import := old.source_import;
      new.source_group := old.source_group;
      if r = 'kader' then
        if old.validated then raise exception 'Entri tervalidasi hanya dapat diubah bidan atau admin'; end if;
        new.validated := false;
        new.validated_by := null;
        new.validated_at := null;
      elsif r in ('bidan','puskesmas','admin') then
        new.validated_by := case when new.validated then auth.uid() else null end;
        new.validated_at := case when new.validated then now() else null end;
      else
        raise exception 'Akses SiMIDS belum diberikan';
      end if;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$function$
;
revoke all on function public.simids_set_immunization_metadata() from public,anon,authenticated;
grant execute on function public.simids_set_immunization_metadata() to service_role;
CREATE OR REPLACE FUNCTION public.simids_touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin new.updated_at := now(); return new; end $function$
;
revoke all on function public.simids_touch_updated_at() from public,anon,authenticated;
grant execute on function public.simids_touch_updated_at() to service_role;
alter table public.simids_assessments enable row level security;
revoke all on public.simids_assessments from anon,authenticated;
alter table public.simids_audit enable row level security;
revoke all on public.simids_audit from anon,authenticated;
alter table public.simids_children enable row level security;
revoke all on public.simids_children from anon,authenticated;
alter table public.simids_config enable row level security;
revoke all on public.simids_config from anon,authenticated;
alter table public.simids_education enable row level security;
revoke all on public.simids_education from anon,authenticated;
alter table public.simids_followups enable row level security;
revoke all on public.simids_followups from anon,authenticated;
alter table public.simids_idl enable row level security;
revoke all on public.simids_idl from anon,authenticated;
alter table public.simids_immunizations enable row level security;
revoke all on public.simids_immunizations from anon,authenticated;
alter table public.simids_import_batches enable row level security;
revoke all on public.simids_import_batches from anon,authenticated;
alter table public.simids_import_payload_chunks enable row level security;
revoke all on public.simids_import_payload_chunks from anon,authenticated;
alter table public.simids_import_rows enable row level security;
revoke all on public.simids_import_rows from anon,authenticated;
alter table public.simids_targets enable row level security;
revoke all on public.simids_targets from anon,authenticated;
alter table public.simids_user_access enable row level security;
revoke all on public.simids_user_access from anon,authenticated;
create policy "simids_idl_select" on public.simids_idl as PERMISSIVE for SELECT to authenticated using ((simids_private.simids_has_access() AND simids_private.simids_child_accessible(child_id))) ;
create policy "simids_user_access_delete" on public.simids_user_access as PERMISSIVE for DELETE to authenticated using ((simids_private.simids_role() = 'admin'::text)) ;
create policy "simids_children_select" on public.simids_children as PERMISSIVE for SELECT to authenticated using ((simids_private.simids_has_access() AND simids_private.simids_can_access_village(village))) ;
create policy "simids_children_insert" on public.simids_children as PERMISSIVE for INSERT to authenticated  with check ((simids_private.simids_has_access() AND (simids_private.simids_role() = ANY (ARRAY['kader'::text, 'bidan'::text, 'puskesmas'::text, 'admin'::text])) AND simids_private.simids_can_access_village(village)));
create policy "simids_children_update" on public.simids_children as PERMISSIVE for UPDATE to authenticated using ((simids_private.simids_has_access() AND simids_private.simids_can_access_village(village))) with check ((simids_private.simids_has_access() AND simids_private.simids_can_access_village(village)));
create policy "simids_children_delete" on public.simids_children as PERMISSIVE for DELETE to authenticated using ((simids_private.simids_role() = ANY (ARRAY['puskesmas'::text, 'admin'::text]))) ;
create policy "simids_immunizations_select" on public.simids_immunizations as PERMISSIVE for SELECT to authenticated using ((simids_private.simids_has_access() AND simids_private.simids_child_accessible(child_id))) ;
create policy "simids_immunizations_insert" on public.simids_immunizations as PERMISSIVE for INSERT to authenticated  with check ((simids_private.simids_has_access() AND simids_private.simids_child_accessible(child_id)));
create policy "simids_immunizations_update" on public.simids_immunizations as PERMISSIVE for UPDATE to authenticated using ((simids_private.simids_has_access() AND simids_private.simids_child_accessible(child_id))) with check ((simids_private.simids_has_access() AND simids_private.simids_child_accessible(child_id)));
create policy "simids_immunizations_delete" on public.simids_immunizations as PERMISSIVE for DELETE to authenticated using ((simids_private.simids_role() = ANY (ARRAY['puskesmas'::text, 'admin'::text]))) ;
create policy "simids_user_access_select" on public.simids_user_access as PERMISSIVE for SELECT to authenticated using (((user_id = ( SELECT auth.uid() AS uid)) OR (simids_private.simids_role() = ANY (ARRAY['puskesmas'::text, 'admin'::text])))) ;
create policy "simids_user_access_insert" on public.simids_user_access as PERMISSIVE for INSERT to authenticated  with check ((simids_private.simids_role() = 'admin'::text));
create policy "simids_user_access_update" on public.simids_user_access as PERMISSIVE for UPDATE to authenticated using ((simids_private.simids_role() = 'admin'::text)) with check ((simids_private.simids_role() = 'admin'::text));
create policy "simids_idl_insert" on public.simids_idl as PERMISSIVE for INSERT to authenticated  with check (((simids_private.simids_role() = ANY (ARRAY['bidan'::text, 'puskesmas'::text, 'admin'::text])) AND simids_private.simids_child_accessible(child_id)));
create policy "simids_idl_update" on public.simids_idl as PERMISSIVE for UPDATE to authenticated using (((simids_private.simids_role() = ANY (ARRAY['bidan'::text, 'puskesmas'::text, 'admin'::text])) AND simids_private.simids_child_accessible(child_id))) with check (((simids_private.simids_role() = ANY (ARRAY['bidan'::text, 'puskesmas'::text, 'admin'::text])) AND simids_private.simids_child_accessible(child_id)));
create policy "simids_idl_delete" on public.simids_idl as PERMISSIVE for DELETE to authenticated using ((simids_private.simids_role() = ANY (ARRAY['puskesmas'::text, 'admin'::text]))) ;
create policy "simids_followups_select" on public.simids_followups as PERMISSIVE for SELECT to authenticated using ((simids_private.simids_has_access() AND simids_private.simids_child_accessible(child_id))) ;
create policy "simids_followups_insert" on public.simids_followups as PERMISSIVE for INSERT to authenticated  with check ((simids_private.simids_has_access() AND simids_private.simids_child_accessible(child_id)));
create policy "simids_followups_update" on public.simids_followups as PERMISSIVE for UPDATE to authenticated using ((simids_private.simids_has_access() AND simids_private.simids_child_accessible(child_id))) with check ((simids_private.simids_has_access() AND simids_private.simids_child_accessible(child_id)));
create policy "simids_followups_delete" on public.simids_followups as PERMISSIVE for DELETE to authenticated using ((simids_private.simids_role() = ANY (ARRAY['puskesmas'::text, 'admin'::text]))) ;
create policy "simids_assessments_select" on public.simids_assessments as PERMISSIVE for SELECT to authenticated using ((simids_private.simids_has_access() AND simids_private.simids_can_access_village(village))) ;
create policy "simids_assessments_insert" on public.simids_assessments as PERMISSIVE for INSERT to authenticated  with check ((simids_private.simids_has_access() AND simids_private.simids_can_access_village(village)));
create policy "simids_assessments_update" on public.simids_assessments as PERMISSIVE for UPDATE to authenticated using ((simids_private.simids_has_access() AND simids_private.simids_can_access_village(village))) with check ((simids_private.simids_has_access() AND simids_private.simids_can_access_village(village)));
create policy "simids_assessments_delete" on public.simids_assessments as PERMISSIVE for DELETE to authenticated using ((simids_private.simids_role() = ANY (ARRAY['puskesmas'::text, 'admin'::text]))) ;
create policy "simids_education_select" on public.simids_education as PERMISSIVE for SELECT to authenticated using ((simids_private.simids_has_access() AND simids_private.simids_can_access_village(village))) ;
create policy "simids_education_insert" on public.simids_education as PERMISSIVE for INSERT to authenticated  with check ((simids_private.simids_has_access() AND simids_private.simids_can_access_village(village)));
create policy "simids_education_update" on public.simids_education as PERMISSIVE for UPDATE to authenticated using ((simids_private.simids_has_access() AND simids_private.simids_can_access_village(village))) with check ((simids_private.simids_has_access() AND simids_private.simids_can_access_village(village)));
create policy "simids_education_delete" on public.simids_education as PERMISSIVE for DELETE to authenticated using ((simids_private.simids_role() = ANY (ARRAY['puskesmas'::text, 'admin'::text]))) ;
create policy "simids_targets_select" on public.simids_targets as PERMISSIVE for SELECT to authenticated using (simids_private.simids_has_access()) ;
create policy "simids_targets_insert" on public.simids_targets as PERMISSIVE for INSERT to authenticated  with check ((simids_private.simids_role() = ANY (ARRAY['puskesmas'::text, 'admin'::text])));
create policy "simids_targets_update" on public.simids_targets as PERMISSIVE for UPDATE to authenticated using ((simids_private.simids_role() = ANY (ARRAY['puskesmas'::text, 'admin'::text]))) with check ((simids_private.simids_role() = ANY (ARRAY['puskesmas'::text, 'admin'::text])));
create policy "simids_targets_delete" on public.simids_targets as PERMISSIVE for DELETE to authenticated using ((simids_private.simids_role() = 'admin'::text)) ;
create policy "simids_config_select" on public.simids_config as PERMISSIVE for SELECT to authenticated using (simids_private.simids_has_access()) ;
create policy "simids_config_insert" on public.simids_config as PERMISSIVE for INSERT to authenticated  with check ((simids_private.simids_role() = 'admin'::text));
create policy "simids_config_update" on public.simids_config as PERMISSIVE for UPDATE to authenticated using ((simids_private.simids_role() = ANY (ARRAY['puskesmas'::text, 'admin'::text]))) with check ((simids_private.simids_role() = ANY (ARRAY['puskesmas'::text, 'admin'::text])));
create policy "simids_config_delete" on public.simids_config as PERMISSIVE for DELETE to authenticated using ((simids_private.simids_role() = 'admin'::text)) ;
create policy "simids_audit_select" on public.simids_audit as PERMISSIVE for SELECT to authenticated using ((simids_private.simids_role() = ANY (ARRAY['puskesmas'::text, 'admin'::text]))) ;
CREATE TRIGGER simids_immunization_metadata BEFORE INSERT OR UPDATE ON public.simids_immunizations FOR EACH ROW EXECUTE FUNCTION simids_set_immunization_metadata();
CREATE TRIGGER simids_children_touch BEFORE UPDATE ON public.simids_children FOR EACH ROW EXECUTE FUNCTION simids_touch_updated_at();
CREATE TRIGGER simids_user_access_touch BEFORE UPDATE ON public.simids_user_access FOR EACH ROW EXECUTE FUNCTION simids_touch_updated_at();
grant INSERT on public.simids_import_batches to service_role;
grant SELECT on public.simids_import_batches to service_role;
grant UPDATE on public.simids_import_batches to service_role;
grant DELETE on public.simids_import_batches to service_role;
grant TRUNCATE on public.simids_import_batches to service_role;
grant REFERENCES on public.simids_import_batches to service_role;
grant TRIGGER on public.simids_import_batches to service_role;
grant INSERT on public.simids_import_rows to service_role;
grant SELECT on public.simids_import_rows to service_role;
grant UPDATE on public.simids_import_rows to service_role;
grant DELETE on public.simids_import_rows to service_role;
grant TRUNCATE on public.simids_import_rows to service_role;
grant REFERENCES on public.simids_import_rows to service_role;
grant TRIGGER on public.simids_import_rows to service_role;
grant INSERT on public.simids_import_payload_chunks to service_role;
grant SELECT on public.simids_import_payload_chunks to service_role;
grant UPDATE on public.simids_import_payload_chunks to service_role;
grant DELETE on public.simids_import_payload_chunks to service_role;
grant TRUNCATE on public.simids_import_payload_chunks to service_role;
grant REFERENCES on public.simids_import_payload_chunks to service_role;
grant TRIGGER on public.simids_import_payload_chunks to service_role;
grant INSERT on public.simids_targets to authenticated;
grant SELECT on public.simids_targets to authenticated;
grant UPDATE on public.simids_targets to authenticated;
grant DELETE on public.simids_targets to authenticated;
grant TRUNCATE on public.simids_targets to authenticated;
grant REFERENCES on public.simids_targets to authenticated;
grant TRIGGER on public.simids_targets to authenticated;
grant INSERT on public.simids_targets to service_role;
grant SELECT on public.simids_targets to service_role;
grant UPDATE on public.simids_targets to service_role;
grant DELETE on public.simids_targets to service_role;
grant TRUNCATE on public.simids_targets to service_role;
grant REFERENCES on public.simids_targets to service_role;
grant TRIGGER on public.simids_targets to service_role;
grant INSERT on public.simids_user_access to authenticated;
grant SELECT on public.simids_user_access to authenticated;
grant UPDATE on public.simids_user_access to authenticated;
grant DELETE on public.simids_user_access to authenticated;
grant TRUNCATE on public.simids_user_access to authenticated;
grant REFERENCES on public.simids_user_access to authenticated;
grant TRIGGER on public.simids_user_access to authenticated;
grant INSERT on public.simids_user_access to service_role;
grant SELECT on public.simids_user_access to service_role;
grant UPDATE on public.simids_user_access to service_role;
grant DELETE on public.simids_user_access to service_role;
grant TRUNCATE on public.simids_user_access to service_role;
grant REFERENCES on public.simids_user_access to service_role;
grant TRIGGER on public.simids_user_access to service_role;
grant INSERT on public.simids_config to authenticated;
grant SELECT on public.simids_config to authenticated;
grant UPDATE on public.simids_config to authenticated;
grant DELETE on public.simids_config to authenticated;
grant TRUNCATE on public.simids_config to authenticated;
grant REFERENCES on public.simids_config to authenticated;
grant TRIGGER on public.simids_config to authenticated;
grant INSERT on public.simids_config to service_role;
grant SELECT on public.simids_config to service_role;
grant UPDATE on public.simids_config to service_role;
grant DELETE on public.simids_config to service_role;
grant TRUNCATE on public.simids_config to service_role;
grant REFERENCES on public.simids_config to service_role;
grant TRIGGER on public.simids_config to service_role;
grant INSERT on public.simids_audit to authenticated;
grant SELECT on public.simids_audit to authenticated;
grant UPDATE on public.simids_audit to authenticated;
grant DELETE on public.simids_audit to authenticated;
grant TRUNCATE on public.simids_audit to authenticated;
grant REFERENCES on public.simids_audit to authenticated;
grant TRIGGER on public.simids_audit to authenticated;
grant INSERT on public.simids_audit to service_role;
grant SELECT on public.simids_audit to service_role;
grant UPDATE on public.simids_audit to service_role;
grant DELETE on public.simids_audit to service_role;
grant TRUNCATE on public.simids_audit to service_role;
grant REFERENCES on public.simids_audit to service_role;
grant TRIGGER on public.simids_audit to service_role;
grant INSERT on public.simids_children to authenticated;
grant SELECT on public.simids_children to authenticated;
grant UPDATE on public.simids_children to authenticated;
grant DELETE on public.simids_children to authenticated;
grant TRUNCATE on public.simids_children to authenticated;
grant REFERENCES on public.simids_children to authenticated;
grant TRIGGER on public.simids_children to authenticated;
grant INSERT on public.simids_children to service_role;
grant SELECT on public.simids_children to service_role;
grant UPDATE on public.simids_children to service_role;
grant DELETE on public.simids_children to service_role;
grant TRUNCATE on public.simids_children to service_role;
grant REFERENCES on public.simids_children to service_role;
grant TRIGGER on public.simids_children to service_role;
grant INSERT on public.simids_immunizations to authenticated;
grant SELECT on public.simids_immunizations to authenticated;
grant UPDATE on public.simids_immunizations to authenticated;
grant DELETE on public.simids_immunizations to authenticated;
grant TRUNCATE on public.simids_immunizations to authenticated;
grant REFERENCES on public.simids_immunizations to authenticated;
grant TRIGGER on public.simids_immunizations to authenticated;
grant INSERT on public.simids_immunizations to service_role;
grant SELECT on public.simids_immunizations to service_role;
grant UPDATE on public.simids_immunizations to service_role;
grant DELETE on public.simids_immunizations to service_role;
grant TRUNCATE on public.simids_immunizations to service_role;
grant REFERENCES on public.simids_immunizations to service_role;
grant TRIGGER on public.simids_immunizations to service_role;
grant INSERT on public.simids_idl to authenticated;
grant SELECT on public.simids_idl to authenticated;
grant UPDATE on public.simids_idl to authenticated;
grant DELETE on public.simids_idl to authenticated;
grant TRUNCATE on public.simids_idl to authenticated;
grant REFERENCES on public.simids_idl to authenticated;
grant TRIGGER on public.simids_idl to authenticated;
grant INSERT on public.simids_idl to service_role;
grant SELECT on public.simids_idl to service_role;
grant UPDATE on public.simids_idl to service_role;
grant DELETE on public.simids_idl to service_role;
grant TRUNCATE on public.simids_idl to service_role;
grant REFERENCES on public.simids_idl to service_role;
grant TRIGGER on public.simids_idl to service_role;
grant INSERT on public.simids_followups to authenticated;
grant SELECT on public.simids_followups to authenticated;
grant UPDATE on public.simids_followups to authenticated;
grant DELETE on public.simids_followups to authenticated;
grant TRUNCATE on public.simids_followups to authenticated;
grant REFERENCES on public.simids_followups to authenticated;
grant TRIGGER on public.simids_followups to authenticated;
grant INSERT on public.simids_followups to service_role;
grant SELECT on public.simids_followups to service_role;
grant UPDATE on public.simids_followups to service_role;
grant DELETE on public.simids_followups to service_role;
grant TRUNCATE on public.simids_followups to service_role;
grant REFERENCES on public.simids_followups to service_role;
grant TRIGGER on public.simids_followups to service_role;
grant INSERT on public.simids_assessments to authenticated;
grant SELECT on public.simids_assessments to authenticated;
grant UPDATE on public.simids_assessments to authenticated;
grant DELETE on public.simids_assessments to authenticated;
grant TRUNCATE on public.simids_assessments to authenticated;
grant REFERENCES on public.simids_assessments to authenticated;
grant TRIGGER on public.simids_assessments to authenticated;
grant INSERT on public.simids_assessments to service_role;
grant SELECT on public.simids_assessments to service_role;
grant UPDATE on public.simids_assessments to service_role;
grant DELETE on public.simids_assessments to service_role;
grant TRUNCATE on public.simids_assessments to service_role;
grant REFERENCES on public.simids_assessments to service_role;
grant TRIGGER on public.simids_assessments to service_role;
grant INSERT on public.simids_education to authenticated;
grant SELECT on public.simids_education to authenticated;
grant UPDATE on public.simids_education to authenticated;
grant DELETE on public.simids_education to authenticated;
grant TRUNCATE on public.simids_education to authenticated;
grant REFERENCES on public.simids_education to authenticated;
grant TRIGGER on public.simids_education to authenticated;
grant INSERT on public.simids_education to service_role;
grant SELECT on public.simids_education to service_role;
grant UPDATE on public.simids_education to service_role;
grant DELETE on public.simids_education to service_role;
grant TRUNCATE on public.simids_education to service_role;
grant REFERENCES on public.simids_education to service_role;
grant TRIGGER on public.simids_education to service_role;
