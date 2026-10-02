-- Isolated PostgreSQL fixture. No production users, emails or records.
create role anon;
create role authenticated;
create role service_role bypassrls;
create schema auth;
create schema private;
grant usage on schema public, auth, private to anon, authenticated, service_role;
create function auth.role() returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'role'
$$;
create function auth.uid() returns uuid language sql stable as $$
  select (coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'sub')::uuid
$$;
create table public.profiles (
  id uuid primary key,
  name text,
  country text,
  onboarding_completed boolean default false,
  tier text default 'free',
  subscription_tier text default 'free',
  subscription_expires_at timestamptz,
  paystack_customer_id text,
  paystack_subscription_code text,
  role text default 'user'
);
alter table public.profiles enable row level security;
grant select, insert, update, delete on public.profiles to anon, authenticated, service_role;
create policy "Users can view own profile" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "Users can insert own profile" on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "Users can update own profile" on public.profiles for update to authenticated
  using ((select auth.uid()) = id);
insert into public.profiles (id, name) values
  ('00000000-0000-4000-8000-000000000001', 'Synthetic One'),
  ('00000000-0000-4000-8000-000000000002', 'Synthetic Two');
