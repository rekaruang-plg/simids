-- Keep privileged membership lookups outside the exposed API schema.
create schema if not exists simids_private;
revoke all on schema simids_private from public, anon;
grant usage on schema simids_private to authenticated, service_role;
alter function public.simids_has_access() set schema simids_private;
alter function public.simids_role() set schema simids_private;
alter function public.simids_user_village() set schema simids_private;
alter function public.simids_can_access_village(text) set schema simids_private;
alter function public.simids_child_accessible(uuid) set schema simids_private;
create or replace function simids_private.simids_has_access()
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.simids_user_access where user_id=auth.uid() and active);
$$;
create or replace function simids_private.simids_role()
returns text language sql stable security definer set search_path='' as $$
 select role from public.simids_user_access where auth.uid() is not null and user_id=auth.uid() and active;
$$;
create or replace function simids_private.simids_user_village()
returns text language sql stable security definer set search_path='' as $$
 select village from public.simids_user_access where auth.uid() is not null and user_id=auth.uid() and active;
$$;
create or replace function simids_private.simids_can_access_village(p_village text)
returns boolean language sql stable security invoker set search_path='' as $$
 select simids_private.simids_has_access() and (
   simids_private.simids_role() in ('admin','puskesmas') or
   (nullif(btrim(simids_private.simids_user_village()),'') is not null and
    upper(btrim(p_village))=upper(btrim(simids_private.simids_user_village())))
 );
$$;
create or replace function simids_private.simids_child_accessible(p_child_id uuid)
returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.simids_children where id=p_child_id);
$$;
revoke all on all functions in schema simids_private from public, anon;
grant execute on all functions in schema simids_private to authenticated, service_role;
alter table public.simids_targets add column if not exists verified boolean not null default false;

create or replace function public.simids_set_immunization_metadata()
returns trigger language plpgsql security invoker set search_path = '' as $$
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
$$;
revoke all on function public.simids_set_immunization_metadata() from public, anon, authenticated;
