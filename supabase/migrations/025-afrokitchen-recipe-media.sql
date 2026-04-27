-- AfroKitchen recipe image gallery support.
-- Stores optional hero/gallery/step image metadata without overloading recipes.image_url.

create table if not exists public.recipe_media (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  sort_order integer not null default 0,
  role text not null default 'gallery',
  image_url text not null,
  alt_text text,
  caption text,
  credit_text text,
  credit_url text,
  source_type text not null default 'generated',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint recipe_media_role_check
    check (role = any (array['hero'::text, 'gallery'::text, 'step'::text, 'source'::text]))
);

create index if not exists recipe_media_recipe_sort_idx
  on public.recipe_media (recipe_id, sort_order, id);

create index if not exists recipe_media_role_idx
  on public.recipe_media (role);

alter table public.recipe_media enable row level security;

drop policy if exists "Public read recipe media" on public.recipe_media;
create policy "Public read recipe media"
  on public.recipe_media
  for select
  to public
  using (true);

drop policy if exists "Service manage recipe media" on public.recipe_media;
create policy "Service manage recipe media"
  on public.recipe_media
  for all
  to service_role
  using (true)
  with check (true);
