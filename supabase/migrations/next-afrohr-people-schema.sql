-- AfroHR People OS account-backed schema.
-- Target instance: AUTH project.
--
-- This migration creates the durable Supabase foundation for AfroHR:
-- clients, organizations, team roles, employees, contacts, Payroll readiness
-- profiles, contracts, letters, Leave, attendance, Onboarding, document
-- metadata, missing-detail requests, Payroll handoff drafts, People reports,
-- audit events, RLS helpers, policies, indexes, and audit triggers.
--
-- It deliberately does not create file storage buckets, e-signatures,
-- labor-law compliance guarantees, statutory HR filing, employee consent
-- proof, or automatic Payroll writeback. Payroll relationships are references
-- only and must remain explicit product/API actions.

create extension if not exists pgcrypto;

create schema if not exists private;

grant usage on schema private to authenticated;
grant usage on schema private to service_role;

create or replace function public.hr_set_updated_at()
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

create or replace function public.hr_prevent_client_owner_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.owner_id is distinct from new.owner_id and (select auth.role()) <> 'service_role' then
    raise exception 'hr client owner_id cannot be changed directly';
  end if;

  return new;
end;
$$;

create table if not exists public.hr_clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  client_type text not null default 'small_employer'
    check (client_type in ('small_employer', 'school', 'clinic', 'ngo', 'freelancer_team', 'agency', 'accountant_client', 'other')),
  default_country text,
  default_currency text not null default 'NGN',
  billing_email text,
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_team_members (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.hr_clients(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,
  display_name text,
  role text not null
    check (role in ('owner', 'admin', 'hr_admin', 'payroll_admin', 'accountant', 'reviewer', 'viewer')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'disabled')),
  permissions_override jsonb not null default '{}'::jsonb,
  invited_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hr_team_member_user_or_email
    check (user_id is not null or invited_email is not null)
);

create unique index if not exists uq_hr_team_members_client_user
  on public.hr_team_members (client_id, user_id)
  where user_id is not null;

create unique index if not exists uq_hr_team_members_client_email
  on public.hr_team_members (client_id, lower(invited_email))
  where invited_email is not null;

create table if not exists public.hr_organizations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.hr_clients(id) on delete cascade,
  name text not null,
  organization_type text not null default 'small_employer'
    check (organization_type in ('small_employer', 'school', 'clinic', 'ngo', 'freelancer_team', 'agency', 'accountant_client', 'other')),
  country_code text not null,
  currency_code text not null default 'NGN',
  hr_contact_email text,
  payroll_contact_email text,
  leave_year_start date,
  default_work_week text not null default 'mon_fri'
    check (default_work_week in ('mon_fri', 'mon_sat', 'shift_roster', 'field_schedule', 'custom')),
  review_month date,
  payroll_handoff_preference text not null default 'review_only'
    check (payroll_handoff_preference in ('review_only', 'csv_draft', 'open_payroll_manually', 'accountant_review')),
  address jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, client_id)
);

create table if not exists public.hr_employees (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.hr_clients(id) on delete cascade,
  organization_id uuid not null,
  employee_code text,
  external_ref text,
  full_name text not null,
  preferred_name text,
  work_email text,
  phone text,
  country_code text,
  department text,
  role_title text,
  manager_name text,
  employment_type text not null default 'employee'
    check (employment_type in ('employee', 'contractor', 'casual', 'intern', 'director', 'volunteer', 'freelancer', 'consultant', 'other')),
  start_date date,
  end_date date,
  status text not null default 'onboarding'
    check (status in ('draft', 'onboarding', 'active', 'on_leave', 'inactive', 'terminated', 'archived')),
  review_status text not null default 'Review needed'
    check (review_status in ('Ready', 'Review needed', 'Archived')),
  profile jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, client_id),
  unique (organization_id, employee_code),
  foreign key (organization_id, client_id)
    references public.hr_organizations(id, client_id) on delete cascade
);

create table if not exists public.hr_employee_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.hr_clients(id) on delete cascade,
  organization_id uuid not null,
  employee_id uuid not null,
  contact_type text not null default 'emergency'
    check (contact_type in ('emergency', 'personal', 'next_of_kin', 'work', 'other')),
  name text not null,
  relationship text,
  email text,
  phone text,
  address jsonb not null default '{}'::jsonb,
  is_primary boolean not null default false,
  review_status text not null default 'Review needed'
    check (review_status in ('Ready', 'Review needed', 'Archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, client_id)
    references public.hr_organizations(id, client_id) on delete cascade,
  foreign key (employee_id, client_id)
    references public.hr_employees(id, client_id) on delete cascade
);

create table if not exists public.hr_employee_payroll_profiles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.hr_clients(id) on delete cascade,
  organization_id uuid not null,
  employee_id uuid not null,
  payroll_employee_id uuid references public.payroll_employees(id) on delete set null,
  payroll_reference_label text,
  payroll_link_status text not null default 'unlinked'
    check (payroll_link_status in ('unlinked', 'reference_only', 'handoff_draft', 'reviewed', 'archived')),
  tax_id_status text not null default 'Review needed'
    check (tax_id_status in ('Ready', 'Review needed', 'Missing', 'Not required', 'Archived')),
  social_security_status text not null default 'Review needed'
    check (social_security_status in ('Ready', 'Review needed', 'Missing', 'Not required', 'Archived')),
  payment_route_status text not null default 'Review needed'
    check (payment_route_status in ('Ready', 'Review needed', 'Missing', 'Not required', 'Archived')),
  payroll_readiness_score integer not null default 0
    check (payroll_readiness_score between 0 and 100),
  readiness_notes text,
  payroll_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id),
  foreign key (organization_id, client_id)
    references public.hr_organizations(id, client_id) on delete cascade,
  foreign key (employee_id, client_id)
    references public.hr_employees(id, client_id) on delete cascade
);

create table if not exists public.hr_contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.hr_clients(id) on delete cascade,
  organization_id uuid not null,
  employee_id uuid,
  contract_type text not null default 'employment'
    check (contract_type in ('employment', 'contractor', 'internship', 'volunteer', 'consultant', 'other')),
  title text not null,
  effective_from date,
  effective_to date,
  status text not null default 'draft'
    check (status in ('draft', 'Review needed', 'Ready', 'sent', 'accepted', 'void', 'archived')),
  review_note text,
  storage_bucket text,
  storage_path text,
  checksum text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, client_id)
    references public.hr_organizations(id, client_id) on delete cascade,
  foreign key (employee_id, client_id)
    references public.hr_employees(id, client_id) on delete cascade
);

create table if not exists public.hr_letters (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.hr_clients(id) on delete cascade,
  organization_id uuid not null,
  employee_id uuid,
  letter_type text not null default 'appointment'
    check (letter_type in ('appointment', 'confirmation', 'role_change', 'leave', 'warning', 'exit', 'other')),
  title text not null,
  body_snapshot text,
  status text not null default 'draft'
    check (status in ('draft', 'Review needed', 'Ready', 'sent', 'accepted', 'void', 'archived')),
  review_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, client_id)
    references public.hr_organizations(id, client_id) on delete cascade,
  foreign key (employee_id, client_id)
    references public.hr_employees(id, client_id) on delete cascade
);

create table if not exists public.hr_leave_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.hr_clients(id) on delete cascade,
  organization_id uuid not null,
  employee_id uuid not null,
  leave_type text not null default 'annual'
    check (leave_type in ('annual', 'sick', 'family', 'maternity', 'paternity', 'unpaid', 'field_day', 'other')),
  start_date date not null,
  end_date date not null,
  day_count numeric(8, 2) not null default 1 check (day_count >= 0),
  status text not null default 'Review needed'
    check (status in ('draft', 'requested', 'Review needed', 'approved', 'rejected', 'cancelled', 'taken', 'archived')),
  review_note text,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, client_id)
    references public.hr_organizations(id, client_id) on delete cascade,
  foreign key (employee_id, client_id)
    references public.hr_employees(id, client_id) on delete cascade,
  constraint hr_leave_valid_dates check (end_date >= start_date)
);

create table if not exists public.hr_attendance_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.hr_clients(id) on delete cascade,
  organization_id uuid not null,
  employee_id uuid not null,
  event_date date not null default current_date,
  event_type text not null default 'present'
    check (event_type in ('present', 'absent', 'late', 'field_visit', 'remote_work', 'shift_change', 'other')),
  status text not null default 'Review needed'
    check (status in ('draft', 'Review needed', 'confirmed', 'disputed', 'archived')),
  event_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, client_id)
    references public.hr_organizations(id, client_id) on delete cascade,
  foreign key (employee_id, client_id)
    references public.hr_employees(id, client_id) on delete cascade
);

create table if not exists public.hr_onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.hr_clients(id) on delete cascade,
  organization_id uuid not null,
  employee_id uuid,
  lane text not null default 'Onboarding',
  title text not null,
  due_date date,
  status text not null default 'Review needed'
    check (status in ('open', 'Review needed', 'complete', 'blocked', 'archived')),
  task_note text,
  completed_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, client_id)
    references public.hr_organizations(id, client_id) on delete cascade,
  foreign key (employee_id, client_id)
    references public.hr_employees(id, client_id) on delete cascade
);

create table if not exists public.hr_document_vault_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.hr_clients(id) on delete cascade,
  organization_id uuid not null,
  employee_id uuid,
  document_type text not null default 'metadata'
    check (document_type in ('identity', 'contract', 'letter', 'payroll_details', 'emergency_contact', 'policy', 'metadata', 'other')),
  title text not null,
  document_status text not null default 'Review needed'
    check (document_status in ('requested', 'Review needed', 'received', 'verified', 'expired', 'archived')),
  file_name text,
  file_type text,
  storage_bucket text,
  storage_path text,
  checksum text,
  document_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, client_id)
    references public.hr_organizations(id, client_id) on delete cascade,
  foreign key (employee_id, client_id)
    references public.hr_employees(id, client_id) on delete cascade
);

create table if not exists public.hr_missing_detail_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.hr_clients(id) on delete cascade,
  organization_id uuid not null,
  employee_id uuid,
  requested_fields text[] not null default '{}'::text[],
  request_status text not null default 'Review needed'
    check (request_status in ('draft', 'requested', 'Review needed', 'sent', 'resolved', 'cancelled', 'archived')),
  request_note text,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, client_id)
    references public.hr_organizations(id, client_id) on delete cascade,
  foreign key (employee_id, client_id)
    references public.hr_employees(id, client_id) on delete cascade
);

create table if not exists public.hr_payroll_handoffs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.hr_clients(id) on delete cascade,
  organization_id uuid not null,
  payroll_run_id uuid references public.payroll_runs(id) on delete set null,
  title text not null,
  period_label text,
  period_start date,
  period_end date,
  status text not null default 'Payroll handoff draft'
    check (status in ('draft', 'Review needed', 'Payroll handoff draft', 'Ready', 'exported', 'accepted', 'cancelled', 'archived')),
  employee_count integer not null default 0 check (employee_count >= 0),
  review_needed_count integer not null default 0 check (review_needed_count >= 0),
  handoff_note text,
  readiness_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, client_id)
    references public.hr_organizations(id, client_id) on delete cascade
);

create table if not exists public.hr_people_reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.hr_clients(id) on delete cascade,
  organization_id uuid not null,
  report_type text not null default 'people_packet'
    check (report_type in ('people_packet', 'setup_completion', 'payroll_readiness', 'leave_summary', 'document_checklist', 'onboarding', 'custom')),
  title text not null,
  period_start date,
  period_end date,
  status text not null default 'Review needed'
    check (status in ('draft', 'Review needed', 'Ready', 'exported', 'archived')),
  report_snapshot jsonb not null default '{}'::jsonb,
  generated_by uuid references auth.users(id) on delete set null,
  generated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, client_id)
    references public.hr_organizations(id, client_id) on delete cascade
);

create table if not exists public.hr_audit_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  organization_id uuid,
  employee_id uuid,
  actor_id uuid references auth.users(id) on delete set null default auth.uid(),
  actor_email text,
  event_type text not null,
  table_name text,
  record_id uuid,
  action text not null default 'record_change'
    check (action in ('insert', 'update', 'delete', 'record_change', 'export', 'review', 'handoff')),
  event_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.hr_document_vault_items is
  'AfroHR document metadata and optional storage references only. This table does not create a file upload flow or storage bucket.';
comment on table public.hr_employee_payroll_profiles is
  'AfroHR Payroll readiness references. Optional payroll_employee_id is a reference to Payroll records, not automatic sync or writeback.';
comment on table public.hr_payroll_handoffs is
  'Payroll handoff drafts for review. Handoffs do not change Payroll records automatically.';
comment on table public.hr_audit_events is
  'Append-only AfroHR audit trail for tenant-scoped People OS mutations and exports.';

create or replace function private.hr_user_role(target_client_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1
      from public.hr_clients clients
      where clients.id = target_client_id
        and clients.owner_id = (select auth.uid())
    ) then 'owner'
    else (
      select members.role
      from public.hr_team_members members
      where members.client_id = target_client_id
        and members.user_id = (select auth.uid())
        and members.status = 'active'
      order by case members.role
        when 'owner' then 1
        when 'admin' then 2
        when 'hr_admin' then 3
        when 'payroll_admin' then 4
        when 'accountant' then 5
        when 'reviewer' then 6
        when 'viewer' then 7
        else 99
      end
      limit 1
    )
  end;
$$;

create or replace function private.hr_can_access(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.hr_user_role(target_client_id) is not null;
$$;

create or replace function private.hr_can_edit_people(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.hr_user_role(target_client_id), '') in ('owner', 'admin', 'hr_admin');
$$;

create or replace function private.hr_can_review(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.hr_user_role(target_client_id), '') in ('owner', 'admin', 'hr_admin', 'payroll_admin', 'accountant', 'reviewer');
$$;

create or replace function private.hr_can_manage(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.hr_user_role(target_client_id), '') in ('owner', 'admin');
$$;

grant execute on function private.hr_user_role(uuid) to authenticated;
grant execute on function private.hr_can_access(uuid) to authenticated;
grant execute on function private.hr_can_edit_people(uuid) to authenticated;
grant execute on function private.hr_can_review(uuid) to authenticated;
grant execute on function private.hr_can_manage(uuid) to authenticated;

create or replace function public.hr_audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
  target_client_id uuid;
  target_organization_id uuid;
  target_employee_id uuid;
  target_record_id uuid;
begin
  if tg_table_name = 'hr_audit_events' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  payload = case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  target_client_id = coalesce(
    nullif(payload ->> 'client_id', '')::uuid,
    case when tg_table_name = 'hr_clients' then nullif(payload ->> 'id', '')::uuid else null end
  );
  target_organization_id = nullif(payload ->> 'organization_id', '')::uuid;
  target_employee_id = case
    when tg_table_name = 'hr_employees' then nullif(payload ->> 'id', '')::uuid
    else nullif(payload ->> 'employee_id', '')::uuid
  end;
  target_record_id = nullif(payload ->> 'id', '')::uuid;

  if target_client_id is not null then
    insert into public.hr_audit_events (
      client_id,
      organization_id,
      employee_id,
      actor_id,
      event_type,
      table_name,
      record_id,
      action,
      event_note,
      metadata
    )
    values (
      target_client_id,
      target_organization_id,
      target_employee_id,
      (select auth.uid()),
      'record_' || lower(tg_op),
      tg_table_name,
      target_record_id,
      lower(tg_op),
      'AfroHR record changed',
      jsonb_build_object('source', 'database_trigger')
    );
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'hr_clients',
    'hr_team_members',
    'hr_organizations',
    'hr_employees',
    'hr_employee_contacts',
    'hr_employee_payroll_profiles',
    'hr_contracts',
    'hr_letters',
    'hr_leave_requests',
    'hr_attendance_events',
    'hr_onboarding_tasks',
    'hr_document_vault_items',
    'hr_missing_detail_requests',
    'hr_payroll_handoffs',
    'hr_people_reports',
    'hr_audit_events'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end;
$$;

drop policy if exists "HR owners can create clients" on public.hr_clients;
create policy "HR owners can create clients"
on public.hr_clients
for insert
to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists "HR users can read accessible clients" on public.hr_clients;
create policy "HR users can read accessible clients"
on public.hr_clients
for select
to authenticated
using ((select private.hr_can_access(id)));

drop policy if exists "HR managers can update clients" on public.hr_clients;
create policy "HR managers can update clients"
on public.hr_clients
for update
to authenticated
using ((select private.hr_can_manage(id)))
with check ((select private.hr_can_manage(id)));

drop policy if exists "HR managers can delete clients" on public.hr_clients;
create policy "HR managers can delete clients"
on public.hr_clients
for delete
to authenticated
using ((select private.hr_can_manage(id)));

drop policy if exists "HR users can read team members" on public.hr_team_members;
create policy "HR users can read team members"
on public.hr_team_members
for select
to authenticated
using ((select private.hr_can_access(client_id)));

drop policy if exists "HR managers can insert team members" on public.hr_team_members;
create policy "HR managers can insert team members"
on public.hr_team_members
for insert
to authenticated
with check ((select private.hr_can_manage(client_id)));

drop policy if exists "HR managers can update team members" on public.hr_team_members;
create policy "HR managers can update team members"
on public.hr_team_members
for update
to authenticated
using ((select private.hr_can_manage(client_id)))
with check ((select private.hr_can_manage(client_id)));

drop policy if exists "HR managers can delete team members" on public.hr_team_members;
create policy "HR managers can delete team members"
on public.hr_team_members
for delete
to authenticated
using ((select private.hr_can_manage(client_id)));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'hr_organizations',
    'hr_employees',
    'hr_employee_contacts',
    'hr_onboarding_tasks',
    'hr_document_vault_items'
  ] loop
    execute format('drop policy if exists "HR users can read %s" on public.%I', table_name, table_name);
    execute format('create policy "HR users can read %s" on public.%I for select to authenticated using ((select private.hr_can_access(client_id)))', table_name, table_name);
    execute format('drop policy if exists "HR people editors can insert %s" on public.%I', table_name, table_name);
    execute format('create policy "HR people editors can insert %s" on public.%I for insert to authenticated with check ((select private.hr_can_edit_people(client_id)))', table_name, table_name);
    execute format('drop policy if exists "HR people editors can update %s" on public.%I', table_name, table_name);
    execute format('create policy "HR people editors can update %s" on public.%I for update to authenticated using ((select private.hr_can_edit_people(client_id))) with check ((select private.hr_can_edit_people(client_id)))', table_name, table_name);
    execute format('drop policy if exists "HR managers can delete %s" on public.%I', table_name, table_name);
    execute format('create policy "HR managers can delete %s" on public.%I for delete to authenticated using ((select private.hr_can_manage(client_id)))', table_name, table_name);
  end loop;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'hr_employee_payroll_profiles',
    'hr_contracts',
    'hr_letters',
    'hr_leave_requests',
    'hr_attendance_events',
    'hr_missing_detail_requests',
    'hr_payroll_handoffs',
    'hr_people_reports'
  ] loop
    execute format('drop policy if exists "HR reviewers can read %s" on public.%I', table_name, table_name);
    execute format('create policy "HR reviewers can read %s" on public.%I for select to authenticated using ((select private.hr_can_access(client_id)))', table_name, table_name);
    execute format('drop policy if exists "HR reviewers can insert %s" on public.%I', table_name, table_name);
    execute format('create policy "HR reviewers can insert %s" on public.%I for insert to authenticated with check ((select private.hr_can_edit_people(client_id)) or (select private.hr_can_review(client_id)))', table_name, table_name);
    execute format('drop policy if exists "HR reviewers can update %s" on public.%I', table_name, table_name);
    execute format('create policy "HR reviewers can update %s" on public.%I for update to authenticated using ((select private.hr_can_edit_people(client_id)) or (select private.hr_can_review(client_id))) with check ((select private.hr_can_edit_people(client_id)) or (select private.hr_can_review(client_id)))', table_name, table_name);
    execute format('drop policy if exists "HR managers can delete %s" on public.%I', table_name, table_name);
    execute format('create policy "HR managers can delete %s" on public.%I for delete to authenticated using ((select private.hr_can_manage(client_id)))', table_name, table_name);
  end loop;
end;
$$;

drop policy if exists "HR reviewers can read audit events" on public.hr_audit_events;
create policy "HR reviewers can read audit events"
on public.hr_audit_events
for select
to authenticated
using ((select private.hr_can_review(client_id)));

drop policy if exists "HR users can insert audit events" on public.hr_audit_events;
create policy "HR users can insert audit events"
on public.hr_audit_events
for insert
to authenticated
with check ((select private.hr_can_access(client_id)));

create index if not exists idx_hr_clients_owner_status
  on public.hr_clients (owner_id, status);
create index if not exists idx_hr_team_members_client_role
  on public.hr_team_members (client_id, role, status);
create index if not exists idx_hr_organizations_client_status
  on public.hr_organizations (client_id, status);
create index if not exists idx_hr_organizations_country
  on public.hr_organizations (country_code);
create index if not exists idx_hr_employees_org_status
  on public.hr_employees (organization_id, status);
create index if not exists idx_hr_employees_client_status
  on public.hr_employees (client_id, status);
create index if not exists idx_hr_employees_employee_code
  on public.hr_employees (organization_id, employee_code);
create index if not exists idx_hr_employee_contacts_employee
  on public.hr_employee_contacts (employee_id, contact_type);
create index if not exists idx_hr_employee_payroll_profiles_employee
  on public.hr_employee_payroll_profiles (employee_id, payroll_link_status);
create index if not exists idx_hr_employee_payroll_profiles_payroll_ref
  on public.hr_employee_payroll_profiles (payroll_employee_id)
  where payroll_employee_id is not null;
create index if not exists idx_hr_contracts_employee_status
  on public.hr_contracts (employee_id, status);
create index if not exists idx_hr_letters_employee_status
  on public.hr_letters (employee_id, status);
create index if not exists idx_hr_leave_requests_org_period_status
  on public.hr_leave_requests (organization_id, start_date, end_date, status);
create index if not exists idx_hr_leave_requests_employee_status
  on public.hr_leave_requests (employee_id, status);
create index if not exists idx_hr_attendance_events_employee_date
  on public.hr_attendance_events (employee_id, event_date);
create index if not exists idx_hr_onboarding_tasks_employee_status
  on public.hr_onboarding_tasks (employee_id, status);
create index if not exists idx_hr_document_vault_items_employee_status
  on public.hr_document_vault_items (employee_id, document_status);
create index if not exists idx_hr_missing_detail_requests_employee_status
  on public.hr_missing_detail_requests (employee_id, request_status);
create index if not exists idx_hr_payroll_handoffs_org_period_status
  on public.hr_payroll_handoffs (organization_id, period_start, status);
create index if not exists idx_hr_people_reports_org_period_status
  on public.hr_people_reports (organization_id, period_start, period_end, status);
create index if not exists idx_hr_audit_events_client_created
  on public.hr_audit_events (client_id, created_at desc);
create index if not exists idx_hr_audit_events_record
  on public.hr_audit_events (table_name, record_id);
create index if not exists idx_hr_audit_events_employee
  on public.hr_audit_events (employee_id, created_at desc)
  where employee_id is not null;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'hr_clients',
    'hr_team_members',
    'hr_organizations',
    'hr_employees',
    'hr_employee_contacts',
    'hr_employee_payroll_profiles',
    'hr_contracts',
    'hr_letters',
    'hr_leave_requests',
    'hr_attendance_events',
    'hr_onboarding_tasks',
    'hr_document_vault_items',
    'hr_missing_detail_requests',
    'hr_payroll_handoffs',
    'hr_people_reports'
  ] loop
    execute format('drop trigger if exists set_hr_updated_at on public.%I', table_name);
    execute format('create trigger set_hr_updated_at before update on public.%I for each row execute function public.hr_set_updated_at()', table_name);
    execute format('drop trigger if exists audit_hr_row_change on public.%I', table_name);
    execute format('create trigger audit_hr_row_change after insert or update or delete on public.%I for each row execute function public.hr_audit_row_change()', table_name);
  end loop;
end;
$$;

drop trigger if exists prevent_hr_client_owner_change on public.hr_clients;
create trigger prevent_hr_client_owner_change
before update on public.hr_clients
for each row
execute function public.hr_prevent_client_owner_change();
