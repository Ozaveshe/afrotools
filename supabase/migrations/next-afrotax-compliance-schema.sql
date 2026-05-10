-- AfroTax Compliance OS account-backed preparation and review schema.
-- Target instance: AUTH project.
--
-- This migration creates the durable Supabase foundation for AfroTax:
-- clients, company profiles, team roles, country packs, obligations,
-- deadlines, workflow items, evidence packs, evidence document metadata,
-- source reviews, review checklists, comments, accountant handoff exports,
-- cross-app imports, audit events, RLS helpers, indexes, and audit triggers.
--
-- It deliberately does not create filing, remittance, salary-fund movement,
-- certified compliance, government portal submission, or tax-payment proof.
-- Tables store preparation and review work only.

create extension if not exists pgcrypto;

create schema if not exists private;

grant usage on schema private to authenticated;
grant usage on schema private to service_role;

create or replace function public.tax_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  new.updated_by = coalesce((select auth.uid()), new.updated_by);
  return new;
end;
$$;

create table if not exists public.tax_clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  client_type text not null default 'company'
    check (client_type in ('company', 'accountant_client', 'ngo', 'school', 'clinic', 'seller', 'multi_country_operator', 'other')),
  default_country text,
  default_currency text not null default 'NGN',
  default_tax_period text,
  source_review_preference text not null default 'review-before-use'
    check (source_review_preference in ('review-before-use', 'monthly-review', 'quarterly-review', 'accountant-review', 'manual-only')),
  primary_contact_name text,
  primary_contact_email text,
  settings jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_team_members (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.tax_clients(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,
  display_name text,
  role text not null
    check (role in ('owner', 'admin', 'tax_admin', 'accountant', 'reviewer', 'viewer')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'disabled')),
  permissions_override jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  invited_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tax_team_member_user_or_email
    check (user_id is not null or invited_email is not null)
);

create unique index if not exists uq_tax_team_members_client_user
  on public.tax_team_members (client_id, user_id)
  where user_id is not null;

create unique index if not exists uq_tax_team_members_client_email
  on public.tax_team_members (client_id, lower(invited_email))
  where invited_email is not null;

create table if not exists public.tax_company_profiles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.tax_clients(id) on delete cascade,
  legal_name text not null,
  trading_name text,
  business_type text not null default 'company'
    check (business_type in ('company', 'accountant_client', 'ngo', 'school', 'clinic', 'seller', 'multi_country_operator', 'sole_trader', 'other')),
  country_code text not null,
  default_currency text not null default 'NGN',
  tax_period text,
  tax_contact_name text,
  tax_contact_email text,
  tax_contact_phone text,
  registration_number_note text,
  tax_id_review_note text,
  address jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_country_packs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.tax_clients(id) on delete cascade,
  company_profile_id uuid references public.tax_company_profiles(id) on delete cascade,
  country_code text not null,
  country_name text not null,
  currency_code text not null,
  authority_name text,
  source_url text,
  source_label text,
  language_codes text[] not null default array['en']::text[],
  support_status text not null default 'starter'
    check (support_status in ('starter', 'reviewed', 'needs_source_review', 'paused', 'archived')),
  source_review_status text not null default 'review_due'
    check (source_review_status in ('not_started', 'current', 'review_due', 'expired', 'blocked', 'replaced')),
  review_cadence text not null default 'quarterly'
    check (review_cadence in ('monthly', 'quarterly', 'annual', 'manual')),
  last_reviewed_on date,
  next_review_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_obligations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.tax_clients(id) on delete cascade,
  company_profile_id uuid references public.tax_company_profiles(id) on delete cascade,
  country_pack_id uuid references public.tax_country_packs(id) on delete set null,
  obligation_type text not null
    check (obligation_type in ('paye', 'vat', 'income_tax', 'social_security', 'withholding', 'annual_return', 'other')),
  obligation_name text not null,
  period_label text,
  currency_code text,
  amount_estimate numeric(14, 2) check (amount_estimate is null or amount_estimate >= 0),
  source_review_required boolean not null default true,
  rate_note text,
  review_note text,
  status text not null default 'draft'
    check (status in ('draft', 'tracking', 'needs_review', 'ready_for_accountant', 'paused', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_deadlines (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.tax_clients(id) on delete cascade,
  country_pack_id uuid references public.tax_country_packs(id) on delete set null,
  obligation_id uuid references public.tax_obligations(id) on delete cascade,
  deadline_type text not null default 'tax_calendar',
  title text not null,
  period_label text,
  due_date date not null,
  reminder_at timestamptz,
  verification_status text not null default 'needs_source_review'
    check (verification_status in ('needs_source_review', 'source_reviewed', 'accountant_reviewed', 'manual_entry')),
  status text not null default 'scheduled'
    check (status in ('draft', 'scheduled', 'needs_review', 'ready_for_accountant', 'completed', 'overdue', 'deferred', 'archived')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_workflow_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.tax_clients(id) on delete cascade,
  company_profile_id uuid references public.tax_company_profiles(id) on delete cascade,
  country_pack_id uuid references public.tax_country_packs(id) on delete set null,
  obligation_id uuid references public.tax_obligations(id) on delete cascade,
  title text not null,
  workflow_stage text not null default 'setup'
    check (workflow_stage in ('setup', 'calendar', 'evidence', 'source_review', 'checklist', 'accountant_handoff')),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'blocked', 'needs_review', 'ready_for_accountant', 'done', 'archived')),
  owner_member_id uuid references public.tax_team_members(id) on delete set null,
  due_date date,
  sort_order integer not null default 0 check (sort_order >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_evidence_packs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.tax_clients(id) on delete cascade,
  company_profile_id uuid references public.tax_company_profiles(id) on delete cascade,
  country_pack_id uuid references public.tax_country_packs(id) on delete set null,
  obligation_id uuid references public.tax_obligations(id) on delete set null,
  title text not null,
  period_label text,
  source_summary text,
  reviewer_member_id uuid references public.tax_team_members(id) on delete set null,
  status text not null default 'not_started'
    check (status in ('not_started', 'collecting', 'needs_review', 'ready_for_accountant', 'exported', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_evidence_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.tax_clients(id) on delete cascade,
  evidence_pack_id uuid not null references public.tax_evidence_packs(id) on delete cascade,
  document_title text not null,
  document_type text not null default 'supporting_record',
  source_label text,
  storage_bucket text,
  storage_path text,
  checksum text,
  review_note text,
  status text not null default 'needs_review'
    check (status in ('requested', 'received', 'needs_review', 'accepted_for_review', 'replaced', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_source_reviews (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.tax_clients(id) on delete cascade,
  country_pack_id uuid references public.tax_country_packs(id) on delete cascade,
  obligation_id uuid references public.tax_obligations(id) on delete set null,
  source_label text not null,
  source_url text,
  review_date date,
  next_review_date date,
  reviewer_member_id uuid references public.tax_team_members(id) on delete set null,
  notes text,
  status text not null default 'review_due'
    check (status in ('not_started', 'current', 'review_due', 'expired', 'blocked', 'replaced')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_review_checklists (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.tax_clients(id) on delete cascade,
  evidence_pack_id uuid references public.tax_evidence_packs(id) on delete cascade,
  country_pack_id uuid references public.tax_country_packs(id) on delete set null,
  obligation_id uuid references public.tax_obligations(id) on delete set null,
  item_title text not null,
  item_group text not null default 'Review checklist',
  reviewer_role text not null default 'reviewer',
  completed_by_member_id uuid references public.tax_team_members(id) on delete set null,
  completed_at timestamptz,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'needs_review', 'done', 'waived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_review_comments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.tax_clients(id) on delete cascade,
  evidence_pack_id uuid references public.tax_evidence_packs(id) on delete cascade,
  checklist_item_id uuid references public.tax_review_checklists(id) on delete cascade,
  country_pack_id uuid references public.tax_country_packs(id) on delete set null,
  author_member_id uuid references public.tax_team_members(id) on delete set null,
  author_email text,
  comment_text text not null,
  comment_status text not null default 'open'
    check (comment_status in ('open', 'resolved', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_export_packets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.tax_clients(id) on delete cascade,
  company_profile_id uuid references public.tax_company_profiles(id) on delete cascade,
  country_pack_id uuid references public.tax_country_packs(id) on delete set null,
  evidence_pack_id uuid references public.tax_evidence_packs(id) on delete set null,
  title text not null,
  export_type text not null default 'accountant_handoff'
    check (export_type in ('accountant_handoff', 'evidence_summary', 'review_checklist', 'source_review', 'tax_calendar', 'audit_trail')),
  period_label text,
  status text not null default 'draft'
    check (status in ('draft', 'ready', 'exported', 'revoked', 'archived')),
  delivery_note text,
  file_manifest jsonb not null default '[]'::jsonb,
  generated_by_member_id uuid references public.tax_team_members(id) on delete set null,
  exported_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_cross_app_imports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.tax_clients(id) on delete cascade,
  company_profile_id uuid references public.tax_company_profiles(id) on delete cascade,
  source_app text not null
    check (source_app in ('afropayroll', 'afrobooks', 'afroseller', 'manual')),
  source_key text,
  source_record_id text,
  import_type text not null
    check (import_type in ('payroll_summary', 'books_close_pack', 'tax_review_report', 'payroll_journal', 'seller_daily_close', 'manual_note')),
  period_label text,
  status text not null default 'needs_review'
    check (status in ('draft', 'imported', 'needs_review', 'rejected', 'archived')),
  imported_at timestamptz not null default now(),
  warnings jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_audit_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.tax_clients(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  actor_member_id uuid references public.tax_team_members(id) on delete set null,
  event_type text not null,
  entity_table text not null,
  entity_id_ref uuid,
  event_note text,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create or replace function private.tax_user_role(target_client_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1
      from public.tax_clients clients
      where clients.id = target_client_id
        and clients.owner_id = (select auth.uid())
    ) then 'owner'
    else (
      select members.role
      from public.tax_team_members members
      where members.client_id = target_client_id
        and members.user_id = (select auth.uid())
        and members.status = 'active'
      order by case members.role
        when 'owner' then 1
        when 'admin' then 2
        when 'tax_admin' then 3
        when 'accountant' then 4
        when 'reviewer' then 5
        when 'viewer' then 6
        else 99
      end
      limit 1
    )
  end;
$$;

create or replace function private.tax_can_access(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.tax_user_role(target_client_id) is not null;
$$;

create or replace function private.tax_can_edit(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.tax_user_role(target_client_id), '') in ('owner', 'admin', 'tax_admin', 'accountant');
$$;

create or replace function private.tax_can_review(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.tax_user_role(target_client_id), '') in ('owner', 'admin', 'tax_admin', 'accountant', 'reviewer');
$$;

create or replace function private.tax_can_manage(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.tax_user_role(target_client_id), '') in ('owner', 'admin');
$$;

grant execute on function private.tax_user_role(uuid) to authenticated;
grant execute on function private.tax_can_access(uuid) to authenticated;
grant execute on function private.tax_can_edit(uuid) to authenticated;
grant execute on function private.tax_can_review(uuid) to authenticated;
grant execute on function private.tax_can_manage(uuid) to authenticated;

create or replace function public.tax_create_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tax_team_members (
    client_id,
    user_id,
    display_name,
    role,
    status,
    invited_by,
    created_by,
    updated_by
  )
  values (
    new.id,
    new.owner_id,
    'Owner',
    'owner',
    'active',
    new.owner_id,
    new.owner_id,
    new.owner_id
  )
  on conflict (client_id, user_id) where user_id is not null
  do update set
    role = 'owner',
    status = 'active',
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_tax_client_owner_membership on public.tax_clients;
create trigger trg_tax_client_owner_membership
after insert on public.tax_clients
for each row execute function public.tax_create_owner_membership();

create or replace function public.tax_validate_client_links()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  row_data jsonb;
begin
  row_data := to_jsonb(new);

  if row_data ? 'company_profile_id' and row_data->>'company_profile_id' is not null and not exists (
    select 1
    from public.tax_company_profiles company
    where company.id = (row_data->>'company_profile_id')::uuid
      and company.client_id = new.client_id
  ) then
    raise exception '% company profile must belong to the same client', tg_table_name;
  end if;

  if row_data ? 'country_pack_id' and row_data->>'country_pack_id' is not null and not exists (
    select 1
    from public.tax_country_packs country_pack
    where country_pack.id = (row_data->>'country_pack_id')::uuid
      and country_pack.client_id = new.client_id
  ) then
    raise exception '% country pack must belong to the same client', tg_table_name;
  end if;

  if row_data ? 'obligation_id' and row_data->>'obligation_id' is not null and not exists (
    select 1
    from public.tax_obligations obligation
    where obligation.id = (row_data->>'obligation_id')::uuid
      and obligation.client_id = new.client_id
  ) then
    raise exception '% obligation must belong to the same client', tg_table_name;
  end if;

  if row_data ? 'evidence_pack_id' and row_data->>'evidence_pack_id' is not null and not exists (
    select 1
    from public.tax_evidence_packs evidence_pack
    where evidence_pack.id = (row_data->>'evidence_pack_id')::uuid
      and evidence_pack.client_id = new.client_id
  ) then
    raise exception '% evidence pack must belong to the same client', tg_table_name;
  end if;

  if row_data ? 'checklist_item_id' and row_data->>'checklist_item_id' is not null and not exists (
    select 1
    from public.tax_review_checklists checklist
    where checklist.id = (row_data->>'checklist_item_id')::uuid
      and checklist.client_id = new.client_id
  ) then
    raise exception '% checklist item must belong to the same client', tg_table_name;
  end if;

  if row_data ? 'owner_member_id' and row_data->>'owner_member_id' is not null and not exists (
    select 1
    from public.tax_team_members member
    where member.id = (row_data->>'owner_member_id')::uuid
      and member.client_id = new.client_id
  ) then
    raise exception '% owner member must belong to the same client', tg_table_name;
  end if;

  if row_data ? 'reviewer_member_id' and row_data->>'reviewer_member_id' is not null and not exists (
    select 1
    from public.tax_team_members member
    where member.id = (row_data->>'reviewer_member_id')::uuid
      and member.client_id = new.client_id
  ) then
    raise exception '% reviewer member must belong to the same client', tg_table_name;
  end if;

  if row_data ? 'generated_by_member_id' and row_data->>'generated_by_member_id' is not null and not exists (
    select 1
    from public.tax_team_members member
    where member.id = (row_data->>'generated_by_member_id')::uuid
      and member.client_id = new.client_id
  ) then
    raise exception '% generated-by member must belong to the same client', tg_table_name;
  end if;

  if row_data ? 'completed_by_member_id' and row_data->>'completed_by_member_id' is not null and not exists (
    select 1
    from public.tax_team_members member
    where member.id = (row_data->>'completed_by_member_id')::uuid
      and member.client_id = new.client_id
  ) then
    raise exception '% completed-by member must belong to the same client', tg_table_name;
  end if;

  if row_data ? 'author_member_id' and row_data->>'author_member_id' is not null and not exists (
    select 1
    from public.tax_team_members member
    where member.id = (row_data->>'author_member_id')::uuid
      and member.client_id = new.client_id
  ) then
    raise exception '% author member must belong to the same client', tg_table_name;
  end if;

  return new;
end;
$$;

create or replace function public.tax_audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_client_id uuid;
  target_entity_ref uuid;
  action_summary text;
begin
  if tg_op = 'DELETE' then
    if tg_table_name = 'tax_clients' then
      target_client_id := old.id;
    else
      target_client_id := old.client_id;
    end if;
    target_entity_ref := old.id;
  else
    if tg_table_name = 'tax_clients' then
      target_client_id := new.id;
    else
      target_client_id := new.client_id;
    end if;
    target_entity_ref := new.id;
  end if;

  if tg_table_name = 'tax_audit_events' or target_client_id is null then
    return coalesce(new, old);
  end if;

  action_summary := tg_table_name || ' ' || lower(tg_op);

  insert into public.tax_audit_events (
    client_id,
    actor_id,
    event_type,
    entity_table,
    entity_id_ref,
    event_note,
    old_data,
    new_data
  )
  values (
    target_client_id,
    (select auth.uid()),
    lower(tg_op),
    tg_table_name,
    target_entity_ref,
    action_summary,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'tax_clients',
    'tax_team_members',
    'tax_company_profiles',
    'tax_country_packs',
    'tax_obligations',
    'tax_deadlines',
    'tax_workflow_items',
    'tax_evidence_packs',
    'tax_evidence_documents',
    'tax_source_reviews',
    'tax_review_checklists',
    'tax_review_comments',
    'tax_export_packets',
    'tax_cross_app_imports'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop trigger if exists trg_%I_set_updated_at on public.%I', table_name, table_name);
    execute format('create trigger trg_%I_set_updated_at before update on public.%I for each row execute function public.tax_set_updated_at()', table_name, table_name);
    execute format('drop trigger if exists trg_%I_audit on public.%I', table_name, table_name);
    execute format('create trigger trg_%I_audit after insert or update or delete on public.%I for each row execute function public.tax_audit_row_change()', table_name, table_name);
  end loop;

  execute 'alter table public.tax_audit_events enable row level security';

  foreach table_name in array array[
    'tax_country_packs',
    'tax_obligations',
    'tax_deadlines',
    'tax_workflow_items',
    'tax_evidence_packs',
    'tax_evidence_documents',
    'tax_source_reviews',
    'tax_review_checklists',
    'tax_review_comments',
    'tax_export_packets',
    'tax_cross_app_imports'
  ] loop
    execute format('drop trigger if exists trg_%I_validate_client_links on public.%I', table_name, table_name);
    execute format('create trigger trg_%I_validate_client_links before insert or update on public.%I for each row execute function public.tax_validate_client_links()', table_name, table_name);
  end loop;
end;
$$;

create policy "Users can create owned tax clients"
on public.tax_clients
for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "Users can read accessible tax clients"
on public.tax_clients
for select
to authenticated
using ((select private.tax_can_access(id)));

create policy "Managers can update tax clients"
on public.tax_clients
for update
to authenticated
using ((select private.tax_can_manage(id)))
with check ((select private.tax_can_manage(id)));

create policy "Owners can delete tax clients"
on public.tax_clients
for delete
to authenticated
using (owner_id = (select auth.uid()));

create policy "Users can read tax team members"
on public.tax_team_members
for select
to authenticated
using ((select private.tax_can_access(client_id)));

create policy "Managers can insert tax team members"
on public.tax_team_members
for insert
to authenticated
with check ((select private.tax_can_manage(client_id)));

create policy "Managers can update tax team members"
on public.tax_team_members
for update
to authenticated
using ((select private.tax_can_manage(client_id)))
with check ((select private.tax_can_manage(client_id)));

create policy "Managers can delete tax team members"
on public.tax_team_members
for delete
to authenticated
using ((select private.tax_can_manage(client_id)));

create policy "Users can read tax audit events"
on public.tax_audit_events
for select
to authenticated
using ((select private.tax_can_access(client_id)));

create policy "Users can insert own tax audit events"
on public.tax_audit_events
for insert
to authenticated
with check (
  actor_id = (select auth.uid())
  and (select private.tax_can_access(client_id))
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'tax_company_profiles',
    'tax_country_packs',
    'tax_obligations',
    'tax_deadlines',
    'tax_workflow_items',
    'tax_evidence_packs',
    'tax_evidence_documents',
    'tax_cross_app_imports'
  ] loop
    execute format('create policy "Users can read %s" on public.%I for select to authenticated using ((select private.tax_can_access(client_id)))', table_name, table_name);
    execute format('create policy "Editors can insert %s" on public.%I for insert to authenticated with check ((select private.tax_can_edit(client_id)))', table_name, table_name);
    execute format('create policy "Editors can update %s" on public.%I for update to authenticated using ((select private.tax_can_edit(client_id)) or (select private.tax_can_review(client_id))) with check ((select private.tax_can_edit(client_id)) or (select private.tax_can_review(client_id)))', table_name, table_name);
    execute format('create policy "Managers can delete %s" on public.%I for delete to authenticated using ((select private.tax_can_manage(client_id)))', table_name, table_name);
  end loop;

  foreach table_name in array array[
    'tax_source_reviews',
    'tax_review_checklists',
    'tax_review_comments',
    'tax_export_packets'
  ] loop
    execute format('create policy "Users can read %s" on public.%I for select to authenticated using ((select private.tax_can_access(client_id)))', table_name, table_name);
    execute format('create policy "Reviewers can insert %s" on public.%I for insert to authenticated with check ((select private.tax_can_edit(client_id)) or (select private.tax_can_review(client_id)))', table_name, table_name);
    execute format('create policy "Reviewers can update %s" on public.%I for update to authenticated using ((select private.tax_can_edit(client_id)) or (select private.tax_can_review(client_id))) with check ((select private.tax_can_edit(client_id)) or (select private.tax_can_review(client_id)))', table_name, table_name);
    execute format('create policy "Managers can delete %s" on public.%I for delete to authenticated using ((select private.tax_can_manage(client_id)))', table_name, table_name);
  end loop;
end;
$$;

create index if not exists idx_tax_clients_owner_updated
  on public.tax_clients (owner_id, updated_at desc);
create index if not exists idx_tax_clients_status
  on public.tax_clients (status, updated_at desc);
create index if not exists idx_tax_team_members_client_role
  on public.tax_team_members (client_id, role, status);
create index if not exists idx_tax_team_members_user
  on public.tax_team_members (user_id, status)
  where user_id is not null;
create index if not exists idx_tax_company_profiles_client_country
  on public.tax_company_profiles (client_id, country_code, status);
create index if not exists idx_tax_country_packs_client_country
  on public.tax_country_packs (client_id, country_code, support_status);
create index if not exists idx_tax_country_packs_review
  on public.tax_country_packs (client_id, source_review_status, next_review_date);
create index if not exists idx_tax_obligations_client_status_period
  on public.tax_obligations (client_id, status, period_label);
create index if not exists idx_tax_obligations_country_type
  on public.tax_obligations (country_pack_id, obligation_type, status)
  where country_pack_id is not null;
create index if not exists idx_tax_deadlines_client_due_status
  on public.tax_deadlines (client_id, due_date, status);
create index if not exists idx_tax_deadlines_country_period
  on public.tax_deadlines (country_pack_id, period_label, due_date)
  where country_pack_id is not null;
create index if not exists idx_tax_deadlines_obligation
  on public.tax_deadlines (obligation_id, due_date)
  where obligation_id is not null;
create index if not exists idx_tax_workflow_items_client_status
  on public.tax_workflow_items (client_id, status, due_date);
create index if not exists idx_tax_workflow_items_obligation
  on public.tax_workflow_items (obligation_id, workflow_stage, sort_order)
  where obligation_id is not null;
create index if not exists idx_tax_evidence_packs_client_period_status
  on public.tax_evidence_packs (client_id, period_label, status);
create index if not exists idx_tax_evidence_packs_obligation
  on public.tax_evidence_packs (obligation_id, status)
  where obligation_id is not null;
create index if not exists idx_tax_evidence_documents_pack_status
  on public.tax_evidence_documents (evidence_pack_id, status);
create index if not exists idx_tax_source_reviews_client_status
  on public.tax_source_reviews (client_id, status, next_review_date);
create index if not exists idx_tax_source_reviews_country
  on public.tax_source_reviews (country_pack_id, status, next_review_date)
  where country_pack_id is not null;
create index if not exists idx_tax_review_checklists_pack_status
  on public.tax_review_checklists (evidence_pack_id, status)
  where evidence_pack_id is not null;
create index if not exists idx_tax_review_checklists_client_status
  on public.tax_review_checklists (client_id, status, updated_at desc);
create index if not exists idx_tax_review_comments_pack_created
  on public.tax_review_comments (evidence_pack_id, created_at desc)
  where evidence_pack_id is not null;
create index if not exists idx_tax_export_packets_client_type_period
  on public.tax_export_packets (client_id, export_type, period_label);
create index if not exists idx_tax_export_packets_status
  on public.tax_export_packets (client_id, status, updated_at desc);
create index if not exists idx_tax_cross_app_imports_client_source
  on public.tax_cross_app_imports (client_id, source_app, import_type, period_label);
create index if not exists idx_tax_cross_app_imports_status
  on public.tax_cross_app_imports (client_id, status, imported_at desc);
create index if not exists idx_tax_audit_events_client
  on public.tax_audit_events (client_id, occurred_at desc);
create index if not exists idx_tax_audit_events_entity
  on public.tax_audit_events (entity_table, entity_id_ref);
create index if not exists idx_tax_audit_events_actor
  on public.tax_audit_events (actor_id, occurred_at desc);

comment on table public.tax_clients is
  'AfroTax client/workspace tenancy root for tax preparation and review work only.';
comment on table public.tax_team_members is
  'AfroTax workspace membership and role assignment.';
comment on table public.tax_company_profiles is
  'Company, accountant client, NGO, school, clinic, seller, or multi-country operator profile.';
comment on table public.tax_country_packs is
  'Country lane metadata and source review cadence. Dates and rates still require production verification.';
comment on table public.tax_obligations is
  'Tracked obligations for review workflow only. This is not filing proof.';
comment on table public.tax_deadlines is
  'Tax calendar deadlines for preparation and review. This is not submission proof.';
comment on table public.tax_evidence_packs is
  'Evidence pack grouping for accountant review.';
comment on table public.tax_evidence_documents is
  'Evidence document metadata only. No storage bucket is created by this migration.';
comment on table public.tax_source_reviews is
  'Source review records for dates, rates, and authority references before production use.';
comment on table public.tax_review_checklists is
  'Review checklist items for tax preparation and accountant handoff.';
comment on table public.tax_export_packets is
  'Accountant handoff packet metadata. This is not filed-return, remitted-tax, or certified-compliance proof.';
comment on table public.tax_cross_app_imports is
  'Review imports from AfroPayroll, AfroBooks, AfroSeller via AfroBooks, or manual notes.';
comment on table public.tax_audit_events is
  'Append-only audit trail for AfroTax preparation, review, import, export, and status changes.';
