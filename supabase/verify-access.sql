-- Run as database administrator. All fixtures are rolled back.
begin;
insert into auth.users(id,email) values
 ('a2310101-0000-4000-8000-000000000001','simids-rls-test@example.invalid');
insert into public.simids_user_access(user_id,role,display_name,village,active)
 values ('a2310101-0000-4000-8000-000000000001','kader','RLS test','__TEST_VILLAGE__',true);
insert into public.simids_children(id,name,sex,village) values
 ('a2310101-0000-4000-8000-000000000002','RLS test child','L','__TEST_VILLAGE__');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a2310101-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.simids_children) <> 1 then raise exception 'Village isolation failed'; end if;
 if simids_private.simids_can_access_village(null) then raise exception 'Null scope allowed'; end if;
 if has_function_privilege('authenticated','public.simids_import_compact_batch(uuid,jsonb)','EXECUTE') then raise exception 'Importer publicly executable'; end if;
 if has_table_privilege('anon','public.simids_children','SELECT') then raise exception 'Anonymous read allowed'; end if;
end $$;
insert into public.simids_immunizations(id,child_id,vaccine_code,immunization_date,validated,source_import)
 values ('a2310101-0000-4000-8000-000000000003','a2310101-0000-4000-8000-000000000002','BCG','2026-09-16',true,true);
do $$ begin
 if exists(select 1 from public.simids_immunizations where id='a2310101-0000-4000-8000-000000000003' and (validated or source_import)) then raise exception 'Kader forged validation/import'; end if;
 begin
   insert into public.simids_children(name,sex,village) values ('RLS blocked','P','OTHER_VILLAGE');
   raise exception 'Cross-village insert allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claims','{"sub":"a2310101-0000-4000-8000-000000000099","role":"authenticated"}',true);
do $$ begin
 if exists(select 1 from public.simids_children) then raise exception 'Unassigned user read allowed'; end if;
end $$;
rollback;
