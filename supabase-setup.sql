-- ============================================
-- AfroTools Supabase Database Setup
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Profiles table (stores user info from Google/email signup)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  country text,
  avatar_url text,
  tier text default 'free',
  created_at timestamptz default now()
);

-- Row Level Security: users can only see/edit their own profile
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. Auto-create profile when a new user signs up (Google or email)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: fires after every new signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Favorites table
create table if not exists public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  tool_id text not null,
  created_at timestamptz default now(),
  unique(user_id, tool_id)
);

alter table public.favorites enable row level security;

create policy "Users can manage own favorites"
  on public.favorites for all
  using (auth.uid() = user_id);

-- 4. Saved calculations table
create table if not exists public.saved_calculations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  tool_id text not null,
  data jsonb not null,
  created_at timestamptz default now()
);

alter table public.saved_calculations enable row level security;

create policy "Users can manage own calculations"
  on public.saved_calculations for all
  using (auth.uid() = user_id);

-- Done! You can verify by checking Tables in the Supabase dashboard.
