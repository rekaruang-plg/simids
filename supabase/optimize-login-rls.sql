-- Applied to the connected SiMIDS Supabase project on 2026-09-16.
-- Replaces the per-immunization nested RLS lookup with one explicit assignment check.
create or replace function simids_private.simids_child_accessible(p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists (
    select 1
    from public.simids_user_access ua
    where ua.user_id = auth.uid()
      and ua.active
      and (
        ua.role in ('admin','puskesmas')
        or (
          nullif(btrim(ua.village),'') is not null
          and exists (
            select 1
            from public.simids_children c
            where c.id = p_child_id
              and upper(btrim(c.village)) = upper(btrim(ua.village))
          )
        )
      )
  );
$$;
