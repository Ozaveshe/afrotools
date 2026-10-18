-- PREPARED ONLY: separate Root GO required before any SQL execution.
-- Minimal synthetic policy fixture, never a copy of live recipe/user content.
-- Exact policy/owner/RLS metadata: 05b420de51490a59bf3a81873cb916532724246135d563afa088c5214b03831f.
-- Role flags and grants below are synthetic test permissions, not observed live ACLs.
\set ON_ERROR_STOP on
do $$ begin
 if current_database() not like 'afrotools_kitchen_publication_test_%' or current_user <> 'postgres' then
   raise exception 'A dedicated local synthetic test database owned by postgres is required';
 end if;
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
 if exists(select 1 from pg_roles where rolname in ('anon','authenticated') and (rolsuper or rolbypassrls)) then
   raise exception 'Public synthetic roles must not bypass RLS'; end if;
 if not exists(select 1 from pg_roles where rolname='service_role' and rolbypassrls) then
   raise exception 'Synthetic service role must model RLS bypass'; end if;
end $$;
create table public.recipes(id uuid primary key, is_published boolean not null,
 is_verified boolean, author text, content text not null);
create table public.recipe_ingredients(id uuid primary key,
 recipe_id uuid references public.recipes(id) on delete cascade, content text not null);
create table public.recipe_steps(id uuid primary key,
 recipe_id uuid references public.recipes(id) on delete cascade, content text not null);
create table public.recipe_media(id uuid primary key,
 recipe_id uuid not null references public.recipes(id) on delete cascade,
 role text not null default 'gallery' check(role in ('hero','gallery','step','source')), content text not null);
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_steps enable row level security;
alter table public.recipe_media enable row level security;
create policy "Public read recipe ingredients" on public.recipe_ingredients for select to public using (true);
create policy "Service manage ingredients" on public.recipe_ingredients for all to service_role using (true) with check (true);
create policy "Public read recipe media" on public.recipe_media for select to public using (true);
create policy "Service manage recipe media" on public.recipe_media for all to service_role using (true) with check (true);
create policy "Public read recipe steps" on public.recipe_steps for select to public using (true);
create policy "Service manage steps" on public.recipe_steps for all to service_role using (true) with check (true);
create policy "Public read recipes" on public.recipes for select to public using (true);
create policy "Service manage recipes" on public.recipes for all to service_role using (true) with check (true);
grant usage on schema public to anon, authenticated, service_role;
grant select on public.recipes,public.recipe_ingredients,public.recipe_steps,public.recipe_media to anon,authenticated;
grant all on public.recipes,public.recipe_ingredients,public.recipe_steps,public.recipe_media to service_role;
insert into public.recipes values
 ('00000000-0000-4000-8000-000000000001',true,true,'Synthetic author','synthetic public verified'),
 ('00000000-0000-4000-8000-000000000002',true,false,'Synthetic author','synthetic public unverified'),
 ('00000000-0000-4000-8000-000000000003',false,true,'Synthetic author','synthetic draft verified'),
 ('00000000-0000-4000-8000-000000000004',false,false,'Synthetic author','synthetic draft unverified'),
 ('00000000-0000-4000-8000-000000000005',true,null,'Synthetic author','synthetic unknown verification');
insert into public.recipe_ingredients select id,id,'synthetic ingredient' from public.recipes;
insert into public.recipe_steps select id,id,'synthetic method' from public.recipes;
insert into public.recipe_media select id,id,'gallery','synthetic caption' from public.recipes;
insert into public.recipe_ingredients values('00000000-0000-4000-8000-000000000006',null,'synthetic unattached');
insert into public.recipe_steps values('00000000-0000-4000-8000-000000000006',null,'synthetic unattached');
