-- PREPARED ONLY; NOT RUN. Separate Root GO and local database required.
\set ON_ERROR_STOP on
\ir afrokitchen-publication-fixture.sql
create temporary table publication_test_baseline(kind text primary key,payload jsonb);
insert into publication_test_baseline values('policies',
 (select jsonb_agg(case when cmd='SELECT' then to_jsonb(p)-'qual' else to_jsonb(p) end order by tablename,policyname)
 from pg_policies p where schemaname='public' and tablename in ('recipes','recipe_ingredients','recipe_steps','recipe_media')));
insert into publication_test_baseline values('grants',
 (select jsonb_agg(to_jsonb(g) order by table_name,grantee,privilege_type) from information_schema.table_privileges g
 where table_schema='public' and table_name in ('recipes','recipe_ingredients','recipe_steps','recipe_media')));
insert into publication_test_baseline values('rows',jsonb_build_object(
 'recipes',(select jsonb_agg(to_jsonb(r) order by id) from public.recipes r),
 'ingredients',(select jsonb_agg(to_jsonb(r) order by id) from public.recipe_ingredients r),
 'steps',(select jsonb_agg(to_jsonb(r) order by id) from public.recipe_steps r),
 'media',(select jsonb_agg(to_jsonb(r) order by id) from public.recipe_media r)));
set role anon;
do $$ begin
 if(select count(*) from public.recipes)<>5 then raise exception 'Permissive synthetic prestate not reproduced'; end if;
end $$;
reset role;
\ir ../../supabase/migrations/20261016132034_afrokitchen_publication_read_boundary.sql
set role anon;
do $$ begin
 if(select count(*) from public.recipes)<>1
 or(select count(*) from public.recipe_ingredients)<>1
 or(select count(*) from public.recipe_steps)<>1
 or(select count(*) from public.recipe_media)<>1 then raise exception 'Public parent or child eligibility mismatch'; end if;
 if exists(select 1 from public.recipes where id<>'00000000-0000-4000-8000-000000000001') then raise exception 'Non-public synthetic parent visible'; end if;
 if(select count(*) from public.recipe_steps s join public.recipes r on r.id=s.recipe_id)<>1 then raise exception 'Parent join failed or recursed'; end if;
 begin
  insert into public.recipes values('00000000-0000-4000-8000-000000000099',true,true,'Claimed author','synthetic untrusted write');
  raise exception 'Untrusted write unexpectedly succeeded';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set role authenticated;
do $$ begin
 if(select count(*) from public.recipes)<>1
 or(select count(*) from public.recipe_ingredients)<>1
 or(select count(*) from public.recipe_steps)<>1
 or(select count(*) from public.recipe_media)<>1 then raise exception 'Public parent or child eligibility mismatch'; end if;
 if exists(select 1 from public.recipes where id<>'00000000-0000-4000-8000-000000000001') then raise exception 'Non-public synthetic parent visible'; end if;
 if(select count(*) from public.recipe_steps s join public.recipes r on r.id=s.recipe_id)<>1 then raise exception 'Parent join failed or recursed'; end if;
 begin
  insert into public.recipes values('00000000-0000-4000-8000-000000000099',true,true,'Claimed author','synthetic untrusted write');
  raise exception 'Untrusted write unexpectedly succeeded';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set role service_role;
do $$ begin
 if(select count(*) from public.recipes)<>5 then raise exception 'Service read changed'; end if;
 insert into public.recipes values('00000000-0000-4000-8000-000000000007',false,false,'Synthetic service','synthetic draft');
 insert into public.recipe_ingredients values('00000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000007','synthetic ingredient');
 insert into public.recipe_steps values('00000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000007','synthetic step');
 insert into public.recipe_media values('00000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000007','source','synthetic media');
 update public.recipes set content='synthetic revised' where id='00000000-0000-4000-8000-000000000007';
 if not found then raise exception 'Service update failed'; end if;
 delete from public.recipes where id='00000000-0000-4000-8000-000000000007';
 if exists(select 1 from public.recipe_media where id='00000000-0000-4000-8000-000000000007') then raise exception 'FK cascade changed'; end if;
end $$;
reset role;
do $$ declare current_policies jsonb; current_grants jsonb; current_rows jsonb; begin
 select jsonb_agg(case when cmd='SELECT' then to_jsonb(p)-'qual' else to_jsonb(p) end order by tablename,policyname)
 into current_policies from pg_policies p where schemaname='public' and tablename in ('recipes','recipe_ingredients','recipe_steps','recipe_media');
 select jsonb_agg(to_jsonb(g) order by table_name,grantee,privilege_type) into current_grants
 from information_schema.table_privileges g where table_schema='public' and table_name in ('recipes','recipe_ingredients','recipe_steps','recipe_media');
 current_rows:=jsonb_build_object(
 'recipes',(select jsonb_agg(to_jsonb(r) order by id) from public.recipes r),
 'ingredients',(select jsonb_agg(to_jsonb(r) order by id) from public.recipe_ingredients r),
 'steps',(select jsonb_agg(to_jsonb(r) order by id) from public.recipe_steps r),
 'media',(select jsonb_agg(to_jsonb(r) order by id) from public.recipe_media r));
 if current_policies is distinct from(select payload from publication_test_baseline where kind='policies')
 or current_grants is distinct from(select payload from publication_test_baseline where kind='grants')
 or current_rows is distinct from(select payload from publication_test_baseline where kind='rows') then
 raise exception 'Metadata outside four SELECT predicates, grants or rows changed'; end if;
 if(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'
 and c.relname in ('recipes','recipe_ingredients','recipe_steps','recipe_media') and c.relrowsecurity
 and not c.relforcerowsecurity and pg_get_userbyid(c.relowner)='postgres')<>4 then raise exception 'Owner/RLS changed'; end if;
end $$;
select 'PASS synthetic publication policy checks' as result;
