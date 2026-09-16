-- Applied to the existing SiMIDS tables; unrelated applications are unchanged.
create or replace function public.simids_can_access_village(p_village text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.simids_has_access() and (
    public.simids_role() in ('admin','puskesmas') or
    (nullif(btrim(public.simids_user_village()),'') is not null and
     upper(btrim(p_village)) = upper(btrim(public.simids_user_village())))
  );
$$;
revoke all on function public.simids_can_access_village(text) from public, anon;
grant execute on function public.simids_can_access_village(text) to authenticated, service_role;

-- The importer is administrative only and obeys caller privileges.
alter function public.simids_import_compact_batch(uuid,jsonb) security invoker;
revoke all on function public.simids_import_compact_batch(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.simids_import_compact_batch(uuid,jsonb) to service_role;
alter function public.simids_touch_updated_at() set search_path = '';
revoke all on function public.simids_touch_updated_at() from public, anon, authenticated;

create unique index if not exists simids_children_source_row_unique
  on public.simids_children(source_batch_id,source_row);

-- Browser clients cannot impersonate a source import or approve their own entries.
create or replace function public.simids_set_immunization_metadata()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare r text;
begin
  if auth.uid() is not null then
    r := public.simids_role();
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
