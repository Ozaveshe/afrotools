-- Later corrective child of publication-guard package nine. No data changes.
-- Source metadata: 05b420de51490a59bf3a81873cb916532724246135d563afa088c5214b03831f.
-- Execution requires a separate Root GO and verified AfroTools project ref
-- zpclagtgczsygrgztlts. This database script cannot independently prove a
-- Supabase project URL. Never replay the older afrokitchen bootstrap schema.
-- One-shot guarded migration: an already changed or otherwise drifted prestate
-- fails rather than replacing unknown policies or altering operator privileges.
begin;
lock table public.recipes, public.recipe_ingredients, public.recipe_steps, public.recipe_media
  in share row exclusive mode;
do $boundary$
declare
  expected jsonb := $policies$[
  {
    "cmd": "SELECT",
    "qual": "true",
    "roles": [
      "public"
    ],
    "tablename": "recipe_ingredients",
    "permissive": "PERMISSIVE",
    "policyname": "Public read recipe ingredients",
    "schemaname": "public",
    "with_check": null
  },
  {
    "cmd": "ALL",
    "qual": "true",
    "roles": [
      "service_role"
    ],
    "tablename": "recipe_ingredients",
    "permissive": "PERMISSIVE",
    "policyname": "Service manage ingredients",
    "schemaname": "public",
    "with_check": "true"
  },
  {
    "cmd": "SELECT",
    "qual": "true",
    "roles": [
      "public"
    ],
    "tablename": "recipe_media",
    "permissive": "PERMISSIVE",
    "policyname": "Public read recipe media",
    "schemaname": "public",
    "with_check": null
  },
  {
    "cmd": "ALL",
    "qual": "true",
    "roles": [
      "service_role"
    ],
    "tablename": "recipe_media",
    "permissive": "PERMISSIVE",
    "policyname": "Service manage recipe media",
    "schemaname": "public",
    "with_check": "true"
  },
  {
    "cmd": "SELECT",
    "qual": "true",
    "roles": [
      "public"
    ],
    "tablename": "recipe_steps",
    "permissive": "PERMISSIVE",
    "policyname": "Public read recipe steps",
    "schemaname": "public",
    "with_check": null
  },
  {
    "cmd": "ALL",
    "qual": "true",
    "roles": [
      "service_role"
    ],
    "tablename": "recipe_steps",
    "permissive": "PERMISSIVE",
    "policyname": "Service manage steps",
    "schemaname": "public",
    "with_check": "true"
  },
  {
    "cmd": "SELECT",
    "qual": "true",
    "roles": [
      "public"
    ],
    "tablename": "recipes",
    "permissive": "PERMISSIVE",
    "policyname": "Public read recipes",
    "schemaname": "public",
    "with_check": null
  },
  {
    "cmd": "ALL",
    "qual": "true",
    "roles": [
      "service_role"
    ],
    "tablename": "recipes",
    "permissive": "PERMISSIVE",
    "policyname": "Service manage recipes",
    "schemaname": "public",
    "with_check": "true"
  }
]$policies$::jsonb;
  before_policies jsonb;
  after_policies jsonb;
  before_relations jsonb;
  after_relations jsonb;
  relation jsonb;
  policy jsonb;
  before_other jsonb;
  after_other jsonb;
  child text;
begin
  select coalesce(jsonb_agg(to_jsonb(p) order by tablename, policyname), '[]'::jsonb)
    from pg_policies p
    where schemaname = 'public'
      and tablename in ('recipes', 'recipe_ingredients', 'recipe_steps', 'recipe_media') into before_policies;
  if before_policies is distinct from expected then
    raise exception 'AfroKitchen publication policy prestate differs; no policy was changed';
  end if;
  select jsonb_agg(jsonb_build_object('table', c.relname, 'owner', pg_get_userbyid(c.relowner),
      'enabled', c.relrowsecurity, 'forced', c.relforcerowsecurity) order by c.relname)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('recipes', 'recipe_ingredients', 'recipe_steps', 'recipe_media') into before_relations;
  if jsonb_array_length(before_relations) <> 4 then
    raise exception 'AfroKitchen publication relations are incomplete';
  end if;
  for relation in select value from jsonb_array_elements(before_relations) loop
    if relation->>'owner' <> 'postgres' or relation->>'enabled' <> 'true' or relation->>'forced' <> 'false' then
      raise exception 'AfroKitchen relation ownership or RLS prestate differs';
    end if;
  end loop;
  if (select count(*) from information_schema.columns
      where table_schema = 'public' and table_name = 'recipes'
        and column_name in ('is_published', 'is_verified') and udt_name = 'bool') <> 2
    or not exists (select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'recipes' and column_name = 'id' and udt_name = 'uuid') then
    raise exception 'AfroKitchen parent eligibility columns differ';
  end if;
  foreach child in array array['recipe_ingredients', 'recipe_steps', 'recipe_media'] loop
    if not exists (select 1 from information_schema.columns
      where table_schema = 'public' and table_name = child and column_name = 'recipe_id' and udt_name = 'uuid') then
      raise exception 'AfroKitchen child identity column differs';
    end if;
  end loop;

  alter policy "Public read recipes" on public.recipes
    using (is_published is true and is_verified is true);
  alter policy "Public read recipe ingredients" on public.recipe_ingredients
    using (exists (select 1 from public.recipes r where r.id = recipe_ingredients.recipe_id
      and r.is_published is true and r.is_verified is true));
  alter policy "Public read recipe steps" on public.recipe_steps
    using (exists (select 1 from public.recipes r where r.id = recipe_steps.recipe_id
      and r.is_published is true and r.is_verified is true));
  alter policy "Public read recipe media" on public.recipe_media
    using (exists (select 1 from public.recipes r where r.id = recipe_media.recipe_id
      and r.is_published is true and r.is_verified is true));

  select coalesce(jsonb_agg(to_jsonb(p) order by tablename, policyname), '[]'::jsonb)
    from pg_policies p
    where schemaname = 'public'
      and tablename in ('recipes', 'recipe_ingredients', 'recipe_steps', 'recipe_media') into after_policies;
  select jsonb_agg(jsonb_build_object('table', c.relname, 'owner', pg_get_userbyid(c.relowner),
      'enabled', c.relrowsecurity, 'forced', c.relforcerowsecurity) order by c.relname)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('recipes', 'recipe_ingredients', 'recipe_steps', 'recipe_media') into after_relations;
  select jsonb_agg(case when value->>'cmd' = 'SELECT' then value - 'qual' else value end
      order by value->>'tablename', value->>'policyname')
    into before_other from jsonb_array_elements(before_policies);
  select jsonb_agg(case when value->>'cmd' = 'SELECT' then value - 'qual' else value end
      order by value->>'tablename', value->>'policyname')
    into after_other from jsonb_array_elements(after_policies);
  if before_other is distinct from after_other or before_relations is distinct from after_relations then
    raise exception 'AfroKitchen metadata outside four SELECT predicates changed';
  end if;
  if (select count(*) from jsonb_array_elements(after_policies)
      where value->>'cmd' = 'SELECT' and value->>'qual' is distinct from 'true') <> 4 then
    raise exception 'AfroKitchen four SELECT predicates were not changed';
  end if;
end
$boundary$;
commit;
