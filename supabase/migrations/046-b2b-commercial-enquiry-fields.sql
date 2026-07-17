-- B2B commercial enquiry fields for the 50K plan.
-- Target instance: AUTH/marketing project that already stores data_buyer_leads.
-- This migration is replayable and is not applied by repo edits alone.

alter table if exists public.data_buyer_leads
  add column if not exists website text,
  add column if not exists country text,
  add column if not exists prospect_type text,
  add column if not exists requested_offer text,
  add column if not exists relevant_tool text,
  add column if not exists message text,
  add column if not exists source_path text,
  add column if not exists source_route text,
  add column if not exists cta_type text,
  add column if not exists prospect_segment text,
  add column if not exists page_url text,
  add column if not exists referrer_url text,
  add column if not exists user_agent text,
  add column if not exists ip_hash text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_data_buyer_leads_requested_offer
on public.data_buyer_leads (requested_offer, created_at desc);

create index if not exists idx_data_buyer_leads_prospect_type
on public.data_buyer_leads (prospect_type, created_at desc);

create index if not exists idx_data_buyer_leads_metadata
on public.data_buyer_leads using gin (metadata);

-- Keep public writes behind Netlify functions. Existing logged-in inserts can
-- still create their own rows, but anonymous browser inserts are removed.
alter table if exists public.data_buyer_leads enable row level security;

drop policy if exists "Users can create buyer leads" on public.data_buyer_leads;
drop policy if exists "Users can read own buyer leads" on public.data_buyer_leads;
drop policy if exists "Service role manages data buyer leads" on public.data_buyer_leads;
drop policy if exists "Authenticated users create own buyer leads" on public.data_buyer_leads;
drop policy if exists "Authenticated users read own buyer leads" on public.data_buyer_leads;

create policy "Service role manages data buyer leads"
on public.data_buyer_leads
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

create policy "Authenticated users create own buyer leads"
on public.data_buyer_leads
for insert
to authenticated
with check (consent = true and submitted_by is not null and (select auth.uid()) = submitted_by);

create policy "Authenticated users read own buyer leads"
on public.data_buyer_leads
for select
to authenticated
using (submitted_by is not distinct from (select auth.uid()));
