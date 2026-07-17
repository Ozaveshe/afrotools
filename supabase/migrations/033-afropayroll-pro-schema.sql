-- AfroPayroll Pro account-backed workspace schema
-- Target instance: AUTH - zpclagtgczsygrgztlts.supabase.co
--
-- This migration creates the SaaS-grade payroll workspace foundation:
-- clients, companies, team roles, employees, payroll runs, run rows,
-- payslips, approvals, imports, exports, statutory packs, comments,
-- role permissions, country-pack versions, audit events, RLS, indexes,
-- and a dashboard view.
--
-- It does not perform statutory filing, salary disbursement, or payment
-- rail actions. Those must stay explicit product/API layers.

create extension if not exists pgcrypto;

create or replace function public.payroll_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.payroll_prevent_client_owner_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.owner_id is distinct from new.owner_id and (select auth.role()) <> 'service_role' then
    raise exception 'payroll client owner_id cannot be changed directly';
  end if;

  return new;
end;
$$;

create table if not exists public.payroll_clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  client_type text not null default 'company'
    check (client_type in ('company', 'accounting_client', 'ngo', 'school', 'clinic', 'startup', 'other')),
  default_country text,
  default_currency text,
  language_lane text not null default 'en' check (language_lane in ('en', 'fr', 'sw')),
  billing_email text,
  notes text,
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_memberships (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.payroll_clients(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,
  invited_by uuid references auth.users(id) on delete set null,
  role text not null
    check (role in ('owner', 'admin', 'payroll_admin', 'accountant', 'approver', 'viewer')),
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  permissions_override jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payroll_membership_user_or_email
    check (user_id is not null or invited_email is not null)
);

create table if not exists public.payroll_role_permissions (
  role text primary key
    check (role in ('owner', 'admin', 'payroll_admin', 'accountant', 'approver', 'viewer')),
  description text not null,
  permissions text[] not null default '{}'::text[],
  can_view_salary_data boolean not null default false,
  can_edit_salary_data boolean not null default false,
  can_approve_runs boolean not null default false,
  can_manage_members boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_companies (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.payroll_clients(id) on delete cascade,
  legal_name text not null,
  trading_name text,
  country_code text not null,
  currency_code text,
  registration_number text,
  tax_id text,
  address jsonb not null default '{}'::jsonb,
  payroll_settings jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_employees (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.payroll_clients(id) on delete cascade,
  company_id uuid not null references public.payroll_companies(id) on delete cascade,
  employee_code text,
  external_ref text,
  full_name text not null,
  preferred_name text,
  email text,
  phone text,
  country_code text not null,
  currency_code text,
  role_title text,
  department text,
  employment_type text not null default 'employee'
    check (employment_type in ('employee', 'contractor', 'casual', 'intern', 'director', 'other')),
  pay_schedule text not null default 'monthly'
    check (pay_schedule in ('monthly', 'semi_monthly', 'biweekly', 'weekly', 'daily', 'other')),
  hire_date date,
  termination_date date,
  statutory_ids jsonb not null default '{}'::jsonb,
  bank_meta jsonb not null default '{}'::jsonb,
  pay_setup jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'inactive', 'terminated', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, employee_code)
);

create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.payroll_clients(id) on delete cascade,
  company_id uuid not null references public.payroll_companies(id) on delete cascade,
  run_key text,
  title text not null,
  pay_period_start date,
  pay_period_end date,
  pay_date date,
  default_country text,
  default_currency text,
  language_lane text not null default 'en' check (language_lane in ('en', 'fr', 'sw')),
  status text not null default 'draft'
    check (status in ('draft', 'needs_review', 'ready', 'approval_requested', 'approved', 'exported', 'closed', 'archived')),
  approval_status text not null default 'not_requested'
    check (approval_status in ('not_requested', 'pending', 'approved', 'rejected', 'cancelled')),
  source_mode text not null default 'manual'
    check (source_mode in ('manual', 'csv_import', 'excel_import', 'workspace_sync', 'api')),
  totals jsonb not null default '{}'::jsonb,
  engine_snapshot jsonb not null default '{}'::jsonb,
  warnings_count integer not null default 0 check (warnings_count >= 0),
  ready_count integer not null default 0 check (ready_count >= 0),
  review_count integer not null default 0 check (review_count >= 0),
  exported_count integer not null default 0 check (exported_count >= 0),
  branding jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  exported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, run_key)
);

create table if not exists public.payroll_run_rows (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.payroll_clients(id) on delete cascade,
  run_id uuid not null references public.payroll_runs(id) on delete cascade,
  employee_id uuid references public.payroll_employees(id) on delete set null,
  row_position integer not null default 0 check (row_position >= 0),
  employee_name text not null,
  role_title text,
  department text,
  country_code text not null,
  currency_code text,
  gross_pay numeric(14, 2) not null default 0 check (gross_pay >= 0),
  allowances numeric(14, 2) not null default 0 check (allowances >= 0),
  overtime_pay numeric(14, 2) not null default 0 check (overtime_pay >= 0),
  unpaid_days numeric(8, 2) not null default 0 check (unpaid_days >= 0),
  unpaid_amount numeric(14, 2) not null default 0 check (unpaid_amount >= 0),
  custom_deductions numeric(14, 2) not null default 0 check (custom_deductions >= 0),
  preview_gross numeric(14, 2) not null default 0 check (preview_gross >= 0),
  employee_deductions numeric(14, 2) not null default 0 check (employee_deductions >= 0),
  employer_cost numeric(14, 2) not null default 0 check (employer_cost >= 0),
  net_pay numeric(14, 2) not null default 0 check (net_pay >= 0),
  calculation_mode text not null default 'manual'
    check (calculation_mode in ('engine', 'estimate', 'manual', 'error')),
  country_pack_status text not null default 'unknown'
    check (country_pack_status in ('full_pack', 'estimate_mode', 'next_pack', 'unknown')),
  engine_key text,
  warning_level text not null default 'none' check (warning_level in ('none', 'info', 'warning', 'critical')),
  warning_text text,
  row_status text not null default 'needs_review'
    check (row_status in ('ready', 'needs_review', 'excluded', 'approved', 'exported')),
  line_payload jsonb not null default '{}'::jsonb,
  calculation_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_payslips (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.payroll_clients(id) on delete cascade,
  run_id uuid not null references public.payroll_runs(id) on delete cascade,
  row_id uuid not null references public.payroll_run_rows(id) on delete cascade,
  employee_id uuid references public.payroll_employees(id) on delete set null,
  payslip_no text,
  status text not null default 'draft'
    check (status in ('draft', 'generated', 'sent', 'void')),
  language_lane text not null default 'en' check (language_lane in ('en', 'fr', 'sw')),
  template_key text not null default 'standard',
  brand_snapshot jsonb not null default '{}'::jsonb,
  payload_snapshot jsonb not null default '{}'::jsonb,
  storage_bucket text,
  storage_path text,
  checksum text,
  generated_by uuid references auth.users(id) on delete set null,
  generated_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, row_id)
);

create table if not exists public.payroll_approvals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.payroll_clients(id) on delete cascade,
  run_id uuid not null references public.payroll_runs(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  step_label text not null default 'Payroll review',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  note text,
  acted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_workspace_comments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.payroll_clients(id) on delete cascade,
  run_id uuid references public.payroll_runs(id) on delete cascade,
  row_id uuid references public.payroll_run_rows(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  visibility text not null default 'team' check (visibility in ('team', 'client', 'internal')),
  body text not null,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_import_batches (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.payroll_clients(id) on delete cascade,
  company_id uuid references public.payroll_companies(id) on delete cascade,
  run_id uuid references public.payroll_runs(id) on delete cascade,
  import_type text not null
    check (import_type in ('roster_csv', 'roster_excel', 'payroll_run_csv', 'payroll_run_excel', 'statutory_rates', 'other')),
  source_filename text,
  source_mime text,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'mapped', 'validated', 'imported', 'failed', 'cancelled')),
  row_count integer not null default 0 check (row_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  warning_count integer not null default 0 check (warning_count >= 0),
  mapping jsonb not null default '{}'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  uploaded_by uuid references auth.users(id) on delete set null,
  imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_exports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.payroll_clients(id) on delete cascade,
  run_id uuid references public.payroll_runs(id) on delete cascade,
  export_type text not null
    check (export_type in (
      'roster_csv',
      'payroll_summary_csv',
      'review_warnings_csv',
      'handoff_note_md',
      'payslip_pdf',
      'payslip_zip',
      'statutory_pack_csv',
      'statutory_pack_pdf',
      'branded_packet_zip',
      'other'
    )),
  file_name text,
  storage_bucket text,
  storage_path text,
  checksum text,
  row_count integer not null default 0 check (row_count >= 0),
  status text not null default 'created' check (status in ('created', 'downloaded', 'sent', 'void')),
  language_lane text not null default 'en' check (language_lane in ('en', 'fr', 'sw')),
  brand_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  exported_by uuid references auth.users(id) on delete set null,
  exported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_statutory_packs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.payroll_clients(id) on delete cascade,
  run_id uuid not null references public.payroll_runs(id) on delete cascade,
  country_code text not null,
  currency_code text,
  pack_version text,
  period_start date,
  period_end date,
  due_date date,
  status text not null default 'draft'
    check (status in ('draft', 'ready', 'needs_review', 'exported', 'archived')),
  figures jsonb not null default '{}'::jsonb,
  source_links jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  prepared_by uuid references auth.users(id) on delete set null,
  prepared_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, country_code, pack_version)
);

create table if not exists public.payroll_country_pack_versions (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  version text not null,
  status text not null default 'estimate_mode'
    check (status in ('full_pack', 'estimate_mode', 'next_pack')),
  currency_code text,
  language_lanes text[] not null default array['en']::text[],
  supported_deductions text[] not null default '{}'::text[],
  effective_from date,
  effective_to date,
  verified_at date,
  next_review_at date,
  confidence numeric(4, 3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  engine_key text,
  source_links jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_code, version)
);

create table if not exists public.payroll_audit_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.payroll_clients(id) on delete cascade,
  company_id uuid references public.payroll_companies(id) on delete set null,
  run_id uuid references public.payroll_runs(id) on delete set null,
  employee_id uuid references public.payroll_employees(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  request_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_payroll_memberships_client_user_unique
  on public.payroll_memberships (client_id, user_id)
  where user_id is not null;

create unique index if not exists idx_payroll_memberships_client_email_unique
  on public.payroll_memberships (client_id, lower(invited_email))
  where invited_email is not null;

create unique index if not exists idx_payroll_country_pack_current_unique
  on public.payroll_country_pack_versions (country_code)
  where is_current = true;

create index if not exists idx_payroll_clients_owner_updated
  on public.payroll_clients (owner_id, updated_at desc);
create index if not exists idx_payroll_memberships_user_client
  on public.payroll_memberships (user_id, client_id)
  where status = 'active';
create index if not exists idx_payroll_memberships_client_role
  on public.payroll_memberships (client_id, role)
  where status = 'active';
create index if not exists idx_payroll_companies_client_country
  on public.payroll_companies (client_id, country_code)
  where status = 'active';
create index if not exists idx_payroll_employees_client_company_status
  on public.payroll_employees (client_id, company_id, status);
create index if not exists idx_payroll_employees_company_name
  on public.payroll_employees (company_id, full_name);
create index if not exists idx_payroll_runs_client_updated
  on public.payroll_runs (client_id, updated_at desc);
create index if not exists idx_payroll_runs_company_period
  on public.payroll_runs (company_id, pay_period_end desc, pay_date desc);
create index if not exists idx_payroll_runs_status
  on public.payroll_runs (client_id, status);
create index if not exists idx_payroll_run_rows_run_position
  on public.payroll_run_rows (run_id, row_position);
create index if not exists idx_payroll_run_rows_client_status
  on public.payroll_run_rows (client_id, row_status);
create index if not exists idx_payroll_run_rows_employee
  on public.payroll_run_rows (employee_id);
create index if not exists idx_payroll_payslips_run_status
  on public.payroll_payslips (run_id, status);
create index if not exists idx_payroll_payslips_employee
  on public.payroll_payslips (employee_id);
create index if not exists idx_payroll_approvals_run_status
  on public.payroll_approvals (run_id, status);
create index if not exists idx_payroll_approvals_assigned
  on public.payroll_approvals (assigned_to, status);
create index if not exists idx_payroll_workspace_comments_run
  on public.payroll_workspace_comments (run_id, created_at desc);
create index if not exists idx_payroll_workspace_comments_row
  on public.payroll_workspace_comments (row_id, created_at desc);
create index if not exists idx_payroll_import_batches_client_created
  on public.payroll_import_batches (client_id, created_at desc);
create index if not exists idx_payroll_exports_run_type
  on public.payroll_exports (run_id, export_type, exported_at desc);
create index if not exists idx_payroll_statutory_packs_run_country
  on public.payroll_statutory_packs (run_id, country_code);
create index if not exists idx_payroll_country_pack_versions_status
  on public.payroll_country_pack_versions (status, country_code);
create index if not exists idx_payroll_audit_events_client_created
  on public.payroll_audit_events (client_id, created_at desc);
create index if not exists idx_payroll_audit_events_entity
  on public.payroll_audit_events (entity_type, entity_id);

drop trigger if exists payroll_clients_set_updated_at on public.payroll_clients;
create trigger payroll_clients_set_updated_at
before update on public.payroll_clients
for each row execute function public.payroll_set_updated_at();

drop trigger if exists payroll_clients_prevent_owner_change on public.payroll_clients;
create trigger payroll_clients_prevent_owner_change
before update on public.payroll_clients
for each row execute function public.payroll_prevent_client_owner_change();

drop trigger if exists payroll_memberships_set_updated_at on public.payroll_memberships;
create trigger payroll_memberships_set_updated_at
before update on public.payroll_memberships
for each row execute function public.payroll_set_updated_at();

drop trigger if exists payroll_role_permissions_set_updated_at on public.payroll_role_permissions;
create trigger payroll_role_permissions_set_updated_at
before update on public.payroll_role_permissions
for each row execute function public.payroll_set_updated_at();

drop trigger if exists payroll_companies_set_updated_at on public.payroll_companies;
create trigger payroll_companies_set_updated_at
before update on public.payroll_companies
for each row execute function public.payroll_set_updated_at();

drop trigger if exists payroll_employees_set_updated_at on public.payroll_employees;
create trigger payroll_employees_set_updated_at
before update on public.payroll_employees
for each row execute function public.payroll_set_updated_at();

drop trigger if exists payroll_runs_set_updated_at on public.payroll_runs;
create trigger payroll_runs_set_updated_at
before update on public.payroll_runs
for each row execute function public.payroll_set_updated_at();

drop trigger if exists payroll_run_rows_set_updated_at on public.payroll_run_rows;
create trigger payroll_run_rows_set_updated_at
before update on public.payroll_run_rows
for each row execute function public.payroll_set_updated_at();

drop trigger if exists payroll_payslips_set_updated_at on public.payroll_payslips;
create trigger payroll_payslips_set_updated_at
before update on public.payroll_payslips
for each row execute function public.payroll_set_updated_at();

drop trigger if exists payroll_approvals_set_updated_at on public.payroll_approvals;
create trigger payroll_approvals_set_updated_at
before update on public.payroll_approvals
for each row execute function public.payroll_set_updated_at();

drop trigger if exists payroll_workspace_comments_set_updated_at on public.payroll_workspace_comments;
create trigger payroll_workspace_comments_set_updated_at
before update on public.payroll_workspace_comments
for each row execute function public.payroll_set_updated_at();

drop trigger if exists payroll_import_batches_set_updated_at on public.payroll_import_batches;
create trigger payroll_import_batches_set_updated_at
before update on public.payroll_import_batches
for each row execute function public.payroll_set_updated_at();

drop trigger if exists payroll_exports_set_updated_at on public.payroll_exports;
create trigger payroll_exports_set_updated_at
before update on public.payroll_exports
for each row execute function public.payroll_set_updated_at();

drop trigger if exists payroll_statutory_packs_set_updated_at on public.payroll_statutory_packs;
create trigger payroll_statutory_packs_set_updated_at
before update on public.payroll_statutory_packs
for each row execute function public.payroll_set_updated_at();

drop trigger if exists payroll_country_pack_versions_set_updated_at on public.payroll_country_pack_versions;
create trigger payroll_country_pack_versions_set_updated_at
before update on public.payroll_country_pack_versions
for each row execute function public.payroll_set_updated_at();

create or replace function public.payroll_user_role(target_client_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1
      from public.payroll_clients clients
      where clients.id = target_client_id
        and clients.owner_id = (select auth.uid())
    ) then 'owner'
    else (
      select memberships.role
      from public.payroll_memberships memberships
      where memberships.client_id = target_client_id
        and memberships.user_id = (select auth.uid())
        and memberships.status = 'active'
      order by case memberships.role
        when 'owner' then 1
        when 'admin' then 2
        when 'payroll_admin' then 3
        when 'accountant' then 4
        when 'approver' then 5
        when 'viewer' then 6
        else 99
      end
      limit 1
    )
  end;
$$;

create or replace function public.payroll_can_access(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.payroll_user_role(target_client_id) is not null;
$$;

create or replace function public.payroll_can_manage_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.payroll_user_role(target_client_id), '') in ('owner', 'admin');
$$;

create or replace function public.payroll_can_edit_payroll(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.payroll_user_role(target_client_id), '') in ('owner', 'admin', 'payroll_admin', 'accountant');
$$;

create or replace function public.payroll_can_approve(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.payroll_user_role(target_client_id), '') in ('owner', 'admin', 'accountant', 'approver');
$$;

create or replace function public.payroll_can_view_payroll(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.payroll_user_role(target_client_id), '') in ('owner', 'admin', 'payroll_admin', 'accountant', 'approver');
$$;

alter table public.payroll_clients enable row level security;
alter table public.payroll_memberships enable row level security;
alter table public.payroll_role_permissions enable row level security;
alter table public.payroll_companies enable row level security;
alter table public.payroll_employees enable row level security;
alter table public.payroll_runs enable row level security;
alter table public.payroll_run_rows enable row level security;
alter table public.payroll_payslips enable row level security;
alter table public.payroll_approvals enable row level security;
alter table public.payroll_workspace_comments enable row level security;
alter table public.payroll_import_batches enable row level security;
alter table public.payroll_exports enable row level security;
alter table public.payroll_statutory_packs enable row level security;
alter table public.payroll_country_pack_versions enable row level security;
alter table public.payroll_audit_events enable row level security;

insert into public.payroll_role_permissions (
  role,
  description,
  permissions,
  can_view_salary_data,
  can_edit_salary_data,
  can_approve_runs,
  can_manage_members
)
values
  ('owner', 'Owns the AfroPayroll Pro workspace and billing relationship.',
    array['manage_client', 'manage_members', 'view_salary_data', 'edit_salary_data', 'approve_runs', 'export_packets', 'view_audit'],
    true, true, true, true),
  ('admin', 'Manages workspace settings, members, payroll data, and approvals.',
    array['manage_client', 'manage_members', 'view_salary_data', 'edit_salary_data', 'approve_runs', 'export_packets', 'view_audit'],
    true, true, true, true),
  ('payroll_admin', 'Runs payroll and prepares outputs without managing billing or ownership.',
    array['view_salary_data', 'edit_salary_data', 'export_packets', 'view_audit'],
    true, true, false, false),
  ('accountant', 'Prepares and reviews payroll for client handoff.',
    array['view_salary_data', 'edit_salary_data', 'approve_runs', 'export_packets', 'view_audit'],
    true, true, true, false),
  ('approver', 'Reviews payroll runs and records approval decisions.',
    array['view_salary_data', 'approve_runs', 'view_audit'],
    true, false, true, false),
  ('viewer', 'Views workspace metadata without salary-sensitive payroll rows.',
    array['view_client_metadata'],
    false, false, false, false)
on conflict (role) do update
set description = excluded.description,
    permissions = excluded.permissions,
    can_view_salary_data = excluded.can_view_salary_data,
    can_edit_salary_data = excluded.can_edit_salary_data,
    can_approve_runs = excluded.can_approve_runs,
    can_manage_members = excluded.can_manage_members,
    updated_at = now();

drop policy if exists "Anyone can read payroll role permissions" on public.payroll_role_permissions;
create policy "Anyone can read payroll role permissions"
on public.payroll_role_permissions
for select
using (true);

drop policy if exists "Service role manages payroll role permissions" on public.payroll_role_permissions;
create policy "Service role manages payroll role permissions"
on public.payroll_role_permissions
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

drop policy if exists "Users can read accessible payroll clients" on public.payroll_clients;
create policy "Users can read accessible payroll clients"
on public.payroll_clients
for select
to authenticated
using ((select public.payroll_can_access(id)));

drop policy if exists "Users can create owned payroll clients" on public.payroll_clients;
create policy "Users can create owned payroll clients"
on public.payroll_clients
for insert
to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists "Managers can update payroll clients" on public.payroll_clients;
create policy "Managers can update payroll clients"
on public.payroll_clients
for update
to authenticated
using ((select public.payroll_can_manage_client(id)))
with check ((select public.payroll_can_manage_client(id)));

drop policy if exists "Owners can delete payroll clients" on public.payroll_clients;
create policy "Owners can delete payroll clients"
on public.payroll_clients
for delete
to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists "Users can read payroll memberships" on public.payroll_memberships;
create policy "Users can read payroll memberships"
on public.payroll_memberships
for select
to authenticated
using ((select public.payroll_can_access(client_id)));

drop policy if exists "Managers can insert payroll memberships" on public.payroll_memberships;
create policy "Managers can insert payroll memberships"
on public.payroll_memberships
for insert
to authenticated
with check ((select public.payroll_can_manage_client(client_id)));

drop policy if exists "Managers can update payroll memberships" on public.payroll_memberships;
create policy "Managers can update payroll memberships"
on public.payroll_memberships
for update
to authenticated
using ((select public.payroll_can_manage_client(client_id)))
with check ((select public.payroll_can_manage_client(client_id)));

drop policy if exists "Managers can delete payroll memberships" on public.payroll_memberships;
create policy "Managers can delete payroll memberships"
on public.payroll_memberships
for delete
to authenticated
using ((select public.payroll_can_manage_client(client_id)));

drop policy if exists "Users can read payroll companies" on public.payroll_companies;
create policy "Users can read payroll companies"
on public.payroll_companies
for select
to authenticated
using ((select public.payroll_can_access(client_id)));

drop policy if exists "Payroll editors can insert companies" on public.payroll_companies;
create policy "Payroll editors can insert companies"
on public.payroll_companies
for insert
to authenticated
with check ((select public.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can update companies" on public.payroll_companies;
create policy "Payroll editors can update companies"
on public.payroll_companies
for update
to authenticated
using ((select public.payroll_can_edit_payroll(client_id)))
with check ((select public.payroll_can_edit_payroll(client_id)));

drop policy if exists "Managers can delete companies" on public.payroll_companies;
create policy "Managers can delete companies"
on public.payroll_companies
for delete
to authenticated
using ((select public.payroll_can_manage_client(client_id)));

drop policy if exists "Payroll viewers can read employees" on public.payroll_employees;
create policy "Payroll viewers can read employees"
on public.payroll_employees
for select
to authenticated
using ((select public.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll editors can insert employees" on public.payroll_employees;
create policy "Payroll editors can insert employees"
on public.payroll_employees
for insert
to authenticated
with check ((select public.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can update employees" on public.payroll_employees;
create policy "Payroll editors can update employees"
on public.payroll_employees
for update
to authenticated
using ((select public.payroll_can_edit_payroll(client_id)))
with check ((select public.payroll_can_edit_payroll(client_id)));

drop policy if exists "Managers can delete employees" on public.payroll_employees;
create policy "Managers can delete employees"
on public.payroll_employees
for delete
to authenticated
using ((select public.payroll_can_manage_client(client_id)));

drop policy if exists "Payroll viewers can read runs" on public.payroll_runs;
create policy "Payroll viewers can read runs"
on public.payroll_runs
for select
to authenticated
using ((select public.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll editors can insert runs" on public.payroll_runs;
create policy "Payroll editors can insert runs"
on public.payroll_runs
for insert
to authenticated
with check ((select public.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can update runs" on public.payroll_runs;
create policy "Payroll editors can update runs"
on public.payroll_runs
for update
to authenticated
using ((select public.payroll_can_edit_payroll(client_id)) or (select public.payroll_can_approve(client_id)))
with check ((select public.payroll_can_edit_payroll(client_id)) or (select public.payroll_can_approve(client_id)));

drop policy if exists "Managers can delete runs" on public.payroll_runs;
create policy "Managers can delete runs"
on public.payroll_runs
for delete
to authenticated
using ((select public.payroll_can_manage_client(client_id)));

drop policy if exists "Payroll viewers can read run rows" on public.payroll_run_rows;
create policy "Payroll viewers can read run rows"
on public.payroll_run_rows
for select
to authenticated
using ((select public.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll editors can insert run rows" on public.payroll_run_rows;
create policy "Payroll editors can insert run rows"
on public.payroll_run_rows
for insert
to authenticated
with check ((select public.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can update run rows" on public.payroll_run_rows;
create policy "Payroll editors can update run rows"
on public.payroll_run_rows
for update
to authenticated
using ((select public.payroll_can_edit_payroll(client_id)))
with check ((select public.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can delete run rows" on public.payroll_run_rows;
create policy "Payroll editors can delete run rows"
on public.payroll_run_rows
for delete
to authenticated
using ((select public.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll viewers can read payslips" on public.payroll_payslips;
create policy "Payroll viewers can read payslips"
on public.payroll_payslips
for select
to authenticated
using ((select public.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll editors can insert payslips" on public.payroll_payslips;
create policy "Payroll editors can insert payslips"
on public.payroll_payslips
for insert
to authenticated
with check ((select public.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can update payslips" on public.payroll_payslips;
create policy "Payroll editors can update payslips"
on public.payroll_payslips
for update
to authenticated
using ((select public.payroll_can_edit_payroll(client_id)))
with check ((select public.payroll_can_edit_payroll(client_id)));

drop policy if exists "Managers can delete payslips" on public.payroll_payslips;
create policy "Managers can delete payslips"
on public.payroll_payslips
for delete
to authenticated
using ((select public.payroll_can_manage_client(client_id)));

drop policy if exists "Payroll viewers can read approvals" on public.payroll_approvals;
create policy "Payroll viewers can read approvals"
on public.payroll_approvals
for select
to authenticated
using ((select public.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll editors can request approvals" on public.payroll_approvals;
create policy "Payroll editors can request approvals"
on public.payroll_approvals
for insert
to authenticated
with check ((select public.payroll_can_edit_payroll(client_id)));

drop policy if exists "Approvers can update approvals" on public.payroll_approvals;
create policy "Approvers can update approvals"
on public.payroll_approvals
for update
to authenticated
using ((select public.payroll_can_approve(client_id)))
with check ((select public.payroll_can_approve(client_id)));

drop policy if exists "Managers can delete approvals" on public.payroll_approvals;
create policy "Managers can delete approvals"
on public.payroll_approvals
for delete
to authenticated
using ((select public.payroll_can_manage_client(client_id)));

drop policy if exists "Payroll viewers can read comments" on public.payroll_workspace_comments;
create policy "Payroll viewers can read comments"
on public.payroll_workspace_comments
for select
to authenticated
using ((select public.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll viewers can insert comments" on public.payroll_workspace_comments;
create policy "Payroll viewers can insert comments"
on public.payroll_workspace_comments
for insert
to authenticated
with check ((select public.payroll_can_view_payroll(client_id)));

drop policy if exists "Comment authors and editors can update comments" on public.payroll_workspace_comments;
create policy "Comment authors and editors can update comments"
on public.payroll_workspace_comments
for update
to authenticated
using (
  author_id = (select auth.uid())
  or (select public.payroll_can_edit_payroll(client_id))
)
with check ((select public.payroll_can_view_payroll(client_id)));

drop policy if exists "Managers can delete comments" on public.payroll_workspace_comments;
create policy "Managers can delete comments"
on public.payroll_workspace_comments
for delete
to authenticated
using (
  author_id = (select auth.uid())
  or (select public.payroll_can_manage_client(client_id))
);

drop policy if exists "Payroll viewers can read imports" on public.payroll_import_batches;
create policy "Payroll viewers can read imports"
on public.payroll_import_batches
for select
to authenticated
using ((select public.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll editors can insert imports" on public.payroll_import_batches;
create policy "Payroll editors can insert imports"
on public.payroll_import_batches
for insert
to authenticated
with check ((select public.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can update imports" on public.payroll_import_batches;
create policy "Payroll editors can update imports"
on public.payroll_import_batches
for update
to authenticated
using ((select public.payroll_can_edit_payroll(client_id)))
with check ((select public.payroll_can_edit_payroll(client_id)));

drop policy if exists "Managers can delete imports" on public.payroll_import_batches;
create policy "Managers can delete imports"
on public.payroll_import_batches
for delete
to authenticated
using ((select public.payroll_can_manage_client(client_id)));

drop policy if exists "Payroll viewers can read exports" on public.payroll_exports;
create policy "Payroll viewers can read exports"
on public.payroll_exports
for select
to authenticated
using ((select public.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll editors can insert exports" on public.payroll_exports;
create policy "Payroll editors can insert exports"
on public.payroll_exports
for insert
to authenticated
with check ((select public.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can update exports" on public.payroll_exports;
create policy "Payroll editors can update exports"
on public.payroll_exports
for update
to authenticated
using ((select public.payroll_can_edit_payroll(client_id)))
with check ((select public.payroll_can_edit_payroll(client_id)));

drop policy if exists "Managers can delete exports" on public.payroll_exports;
create policy "Managers can delete exports"
on public.payroll_exports
for delete
to authenticated
using ((select public.payroll_can_manage_client(client_id)));

drop policy if exists "Payroll viewers can read statutory packs" on public.payroll_statutory_packs;
create policy "Payroll viewers can read statutory packs"
on public.payroll_statutory_packs
for select
to authenticated
using ((select public.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll editors can insert statutory packs" on public.payroll_statutory_packs;
create policy "Payroll editors can insert statutory packs"
on public.payroll_statutory_packs
for insert
to authenticated
with check ((select public.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can update statutory packs" on public.payroll_statutory_packs;
create policy "Payroll editors can update statutory packs"
on public.payroll_statutory_packs
for update
to authenticated
using ((select public.payroll_can_edit_payroll(client_id)) or (select public.payroll_can_approve(client_id)))
with check ((select public.payroll_can_edit_payroll(client_id)) or (select public.payroll_can_approve(client_id)));

drop policy if exists "Managers can delete statutory packs" on public.payroll_statutory_packs;
create policy "Managers can delete statutory packs"
on public.payroll_statutory_packs
for delete
to authenticated
using ((select public.payroll_can_manage_client(client_id)));

drop policy if exists "Anyone can read country pack versions" on public.payroll_country_pack_versions;
create policy "Anyone can read country pack versions"
on public.payroll_country_pack_versions
for select
using (true);

drop policy if exists "Payroll viewers can read audit events" on public.payroll_audit_events;
create policy "Payroll viewers can read audit events"
on public.payroll_audit_events
for select
to authenticated
using ((select public.payroll_can_view_payroll(client_id)));

drop policy if exists "Users can insert own audit events" on public.payroll_audit_events;
create policy "Users can insert own audit events"
on public.payroll_audit_events
for insert
to authenticated
with check (
  (actor_id is null or actor_id = (select auth.uid()))
  and (select public.payroll_can_access(client_id))
);

drop policy if exists "Service role manages payroll clients" on public.payroll_clients;
create policy "Service role manages payroll clients"
on public.payroll_clients
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

drop policy if exists "Service role manages payroll memberships" on public.payroll_memberships;
create policy "Service role manages payroll memberships"
on public.payroll_memberships
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

drop policy if exists "Service role manages payroll companies" on public.payroll_companies;
create policy "Service role manages payroll companies"
on public.payroll_companies
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

drop policy if exists "Service role manages payroll employees" on public.payroll_employees;
create policy "Service role manages payroll employees"
on public.payroll_employees
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

drop policy if exists "Service role manages payroll runs" on public.payroll_runs;
create policy "Service role manages payroll runs"
on public.payroll_runs
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

drop policy if exists "Service role manages payroll run rows" on public.payroll_run_rows;
create policy "Service role manages payroll run rows"
on public.payroll_run_rows
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

drop policy if exists "Service role manages payroll payslips" on public.payroll_payslips;
create policy "Service role manages payroll payslips"
on public.payroll_payslips
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

drop policy if exists "Service role manages payroll approvals" on public.payroll_approvals;
create policy "Service role manages payroll approvals"
on public.payroll_approvals
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

drop policy if exists "Service role manages payroll comments" on public.payroll_workspace_comments;
create policy "Service role manages payroll comments"
on public.payroll_workspace_comments
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

drop policy if exists "Service role manages payroll imports" on public.payroll_import_batches;
create policy "Service role manages payroll imports"
on public.payroll_import_batches
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

drop policy if exists "Service role manages payroll exports" on public.payroll_exports;
create policy "Service role manages payroll exports"
on public.payroll_exports
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

drop policy if exists "Service role manages payroll statutory packs" on public.payroll_statutory_packs;
create policy "Service role manages payroll statutory packs"
on public.payroll_statutory_packs
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

drop policy if exists "Service role manages payroll country packs" on public.payroll_country_pack_versions;
create policy "Service role manages payroll country packs"
on public.payroll_country_pack_versions
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

drop policy if exists "Service role manages payroll audit events" on public.payroll_audit_events;
create policy "Service role manages payroll audit events"
on public.payroll_audit_events
for all
to service_role
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

create or replace view public.payroll_run_dashboard
with (security_invoker = true)
as
select
  runs.id as run_id,
  runs.client_id,
  runs.company_id,
  companies.legal_name as company_name,
  runs.title,
  runs.pay_period_start,
  runs.pay_period_end,
  runs.pay_date,
  runs.status,
  runs.approval_status,
  count(rows.id)::integer as row_count,
  count(rows.id) filter (where rows.row_status = 'ready')::integer as ready_count,
  count(rows.id) filter (where rows.row_status = 'needs_review')::integer as needs_review_count,
  count(rows.id) filter (where rows.row_status = 'exported')::integer as exported_count,
  count(rows.id) filter (where rows.warning_level in ('warning', 'critical'))::integer as warning_count,
  array_remove(array_agg(distinct rows.currency_code), null) as currency_codes,
  array_remove(array_agg(distinct rows.country_pack_status), null) as pack_statuses,
  runs.updated_at
from public.payroll_runs runs
join public.payroll_companies companies on companies.id = runs.company_id
left join public.payroll_run_rows rows on rows.run_id = runs.id
group by
  runs.id,
  runs.client_id,
  runs.company_id,
  companies.legal_name,
  runs.title,
  runs.pay_period_start,
  runs.pay_period_end,
  runs.pay_date,
  runs.status,
  runs.approval_status,
  runs.updated_at;

comment on table public.payroll_clients is
  'AfroPayroll Pro tenant/client workspaces. Salary data lives in related RLS-protected payroll tables.';
comment on table public.payroll_runs is
  'Payroll run headers, status, totals snapshots, approval/export state, and branding metadata.';
comment on table public.payroll_run_rows is
  'Sensitive per-worker payroll lines for a payroll run. Access excludes viewer role by RLS.';
comment on table public.payroll_payslips is
  'Payslip generation metadata and snapshots derived from payroll run rows.';
comment on table public.payroll_statutory_packs is
  'Draft statutory report pack metadata. This table does not submit official filings.';
comment on table public.payroll_audit_events is
  'Append-only audit trail for AfroPayroll Pro workspace actions.';
