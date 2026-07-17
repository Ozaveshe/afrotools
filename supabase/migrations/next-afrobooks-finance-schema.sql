-- AfroBooks Finance OS account-backed schema.
-- Target instance: AUTH project.
--
-- This migration creates the durable Supabase foundation for AfroBooks:
-- clients, entities, team roles, accounts, contacts, invoices, payments,
-- expenses, journals, payroll imports, Seller daily close imports, reports,
-- close packs, Accountant packets, currency rates, exports, audit events,
-- RLS helpers, indexes, and audit triggers.
--
-- It deliberately does not create bank sync, accounting API posting, tax
-- filing/remittance, verified bank balances, or receipt/document storage
-- buckets. Bank/cash balances are user-entered or imported review records.

create extension if not exists pgcrypto;

create schema if not exists private;

grant usage on schema private to authenticated;
grant usage on schema private to service_role;

create or replace function public.books_set_updated_at()
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

create table if not exists public.books_clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  client_type text not null default 'business'
    check (client_type in ('business', 'school', 'clinic', 'ngo', 'freelancer', 'trader', 'importer', 'accounting_client', 'other')),
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

create table if not exists public.books_team_members (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,
  display_name text,
  role text not null
    check (role in ('owner', 'admin', 'bookkeeper', 'accountant', 'reviewer', 'viewer')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'disabled')),
  permissions_override jsonb not null default '{}'::jsonb,
  invited_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint books_team_member_user_or_email
    check (user_id is not null or invited_email is not null)
);

create unique index if not exists uq_books_team_members_client_user
  on public.books_team_members (client_id, user_id)
  where user_id is not null;

create unique index if not exists uq_books_team_members_client_email
  on public.books_team_members (client_id, lower(invited_email))
  where invited_email is not null;

create table if not exists public.books_entities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  legal_name text not null,
  trading_name text,
  entity_type text not null default 'business'
    check (entity_type in ('business', 'school', 'clinic', 'ngo', 'freelancer', 'trader', 'importer', 'project', 'other')),
  country_code text,
  currency_code text not null default 'NGN',
  reporting_month date,
  owner_email text,
  accountant_email text,
  payment_rails text[] not null default array['mobile money', 'bank transfer', 'cash']::text[],
  tax_review_mode text not null default 'track-review'
    check (tax_review_mode in ('track-review', 'vat-review', 'no-tax-label')),
  accounting_basis text not null default 'simple'
    check (accounting_basis in ('cash', 'accrual', 'simple')),
  review_status text not null default 'Review needed'
    check (review_status in ('Ready', 'Review needed', 'Archived')),
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  entity_id uuid not null references public.books_entities(id) on delete cascade,
  account_code text not null,
  account_name text not null,
  account_type text not null
    check (account_type in ('asset', 'liability', 'equity', 'income', 'expense')),
  normal_balance text not null default 'debit'
    check (normal_balance in ('debit', 'credit')),
  currency_code text not null default 'NGN',
  current_balance numeric(14, 2) not null default 0,
  balance_source text not null default 'user_entered'
    check (balance_source in ('user_entered', 'manual_import', 'review_adjustment')),
  review_status text not null default 'Review needed'
    check (review_status in ('Ready', 'Review needed', 'Archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_id, account_code)
);

create table if not exists public.books_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  entity_id uuid not null references public.books_entities(id) on delete cascade,
  contact_type text not null
    check (contact_type in ('customer', 'vendor', 'customer_vendor', 'accountant', 'team', 'other')),
  name text not null,
  email text,
  phone text,
  payment_terms text,
  default_payment_rail text
    check (default_payment_rail is null or default_payment_rail in ('mobile money', 'bank transfer', 'cash', 'card', 'supplier credit', 'other')),
  address jsonb not null default '{}'::jsonb,
  tax_label text,
  review_status text not null default 'Review needed'
    check (review_status in ('Ready', 'Review needed', 'Archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books_invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  entity_id uuid not null references public.books_entities(id) on delete cascade,
  contact_id uuid references public.books_contacts(id) on delete set null,
  invoice_no text not null,
  issue_date date not null default current_date,
  due_date date,
  currency_code text not null default 'NGN',
  subtotal_amount numeric(14, 2) not null default 0 check (subtotal_amount >= 0),
  discount_amount numeric(14, 2) not null default 0 check (discount_amount >= 0),
  tax_amount numeric(14, 2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
  amount_paid numeric(14, 2) not null default 0 check (amount_paid >= 0),
  balance_due numeric(14, 2) not null default 0 check (balance_due >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'partial', 'paid', 'overdue', 'void', 'archived')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'partial', 'paid', 'void', 'refunded')),
  payment_rail text
    check (payment_rail is null or payment_rail in ('mobile money', 'bank transfer', 'cash', 'card', 'supplier credit', 'other')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_id, invoice_no)
);

create table if not exists public.books_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  invoice_id uuid not null references public.books_invoices(id) on delete cascade,
  line_no integer not null default 1 check (line_no > 0),
  description text not null,
  quantity numeric(14, 2) not null default 1 check (quantity > 0),
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  discount_amount numeric(14, 2) not null default 0 check (discount_amount >= 0),
  tax_rate numeric(8, 4) not null default 0 check (tax_rate >= 0),
  tax_amount numeric(14, 2) not null default 0 check (tax_amount >= 0),
  line_total numeric(14, 2) not null default 0 check (line_total >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invoice_id, line_no)
);

create table if not exists public.books_payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  entity_id uuid not null references public.books_entities(id) on delete cascade,
  contact_id uuid references public.books_contacts(id) on delete set null,
  invoice_id uuid references public.books_invoices(id) on delete set null,
  payment_date date not null default current_date,
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  currency_code text not null default 'NGN',
  payment_rail text not null default 'cash'
    check (payment_rail in ('mobile money', 'bank transfer', 'cash', 'card', 'supplier credit', 'other')),
  payment_status text not null default 'recorded'
    check (payment_status in ('pending', 'recorded', 'matched', 'void', 'refunded')),
  verification_status text not null default 'Review needed'
    check (verification_status in ('Ready', 'Review needed', 'Disputed')),
  is_user_entered boolean not null default true,
  reference_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books_expenses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  entity_id uuid not null references public.books_entities(id) on delete cascade,
  contact_id uuid references public.books_contacts(id) on delete set null,
  expense_date date not null default current_date,
  vendor_name text,
  category text not null default 'operating expense',
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  currency_code text not null default 'NGN',
  payment_rail text not null default 'cash'
    check (payment_rail in ('mobile money', 'bank transfer', 'cash', 'card', 'supplier credit', 'other')),
  expense_status text not null default 'Review needed'
    check (expense_status in ('Draft', 'Review needed', 'Ready', 'Reimbursed', 'Archived')),
  receipt_status text not null default 'Review needed'
    check (receipt_status in ('No receipt', 'Review needed', 'Attached note', 'Ready')),
  tax_category text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books_expense_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  expense_id uuid not null references public.books_expenses(id) on delete cascade,
  file_name text,
  file_type text,
  document_note text,
  document_status text not null default 'Review needed'
    check (document_status in ('Review needed', 'Ready', 'Rejected')),
  storage_bucket text,
  storage_path text,
  checksum text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books_journals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  entity_id uuid not null references public.books_entities(id) on delete cascade,
  journal_no text not null,
  journal_date date not null default current_date,
  source_area text not null default 'manual'
    check (source_area in ('manual', 'invoice', 'payment', 'expense', 'AfroPayroll', 'AfroSeller', 'import')),
  title text not null,
  status text not null default 'Draft report'
    check (status in ('Draft report', 'Review needed', 'Ready', 'Posted for review', 'Archived')),
  total_debit numeric(14, 2) not null default 0 check (total_debit >= 0),
  total_credit numeric(14, 2) not null default 0 check (total_credit >= 0),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_id, journal_no)
);

create table if not exists public.books_journal_lines (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  journal_id uuid not null references public.books_journals(id) on delete cascade,
  account_id uuid references public.books_accounts(id) on delete set null,
  line_no integer not null default 1 check (line_no > 0),
  account_code text,
  description text not null,
  debit_amount numeric(14, 2) not null default 0 check (debit_amount >= 0),
  credit_amount numeric(14, 2) not null default 0 check (credit_amount >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint books_journal_line_has_amount
    check (debit_amount > 0 or credit_amount > 0),
  unique (journal_id, line_no)
);

create table if not exists public.books_payroll_journal_imports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  entity_id uuid not null references public.books_entities(id) on delete cascade,
  journal_id uuid references public.books_journals(id) on delete set null,
  payroll_client_id uuid,
  payroll_company_id uuid,
  payroll_run_id uuid,
  source_label text not null default 'AfroPayroll saved run',
  period_label text,
  employee_count integer not null default 0 check (employee_count >= 0),
  gross_pay numeric(14, 2) not null default 0 check (gross_pay >= 0),
  employer_cost numeric(14, 2) not null default 0 check (employer_cost >= 0),
  net_pay numeric(14, 2) not null default 0 check (net_pay >= 0),
  status text not null default 'Review needed'
    check (status in ('Draft report', 'Review needed', 'Ready', 'Archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books_seller_daily_close_imports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  entity_id uuid not null references public.books_entities(id) on delete cascade,
  journal_id uuid references public.books_journals(id) on delete set null,
  seller_business_id uuid,
  close_date date not null default current_date,
  sales_today numeric(14, 2) not null default 0 check (sales_today >= 0),
  payments_recorded numeric(14, 2) not null default 0 check (payments_recorded >= 0),
  unpaid_balances numeric(14, 2) not null default 0 check (unpaid_balances >= 0),
  cash_difference numeric(14, 2) not null default 0,
  status text not null default 'Review needed'
    check (status in ('Draft report', 'Review needed', 'Ready', 'Archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books_tax_reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  entity_id uuid not null references public.books_entities(id) on delete cascade,
  report_type text not null
    check (report_type in ('VAT summary', 'sales tax review', 'withholding review', 'income tax review', 'payroll tax review', 'custom')),
  period_label text not null,
  status text not null default 'Draft report'
    check (status in ('Draft report', 'Review needed', 'Ready', 'Archived')),
  review_note text,
  totals jsonb not null default '{}'::jsonb,
  filing_status text not null default 'not_filed_by_afrobooks'
    check (filing_status in ('not_filed_by_afrobooks', 'external_review', 'external_filed_by_user')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books_close_packs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  entity_id uuid not null references public.books_entities(id) on delete cascade,
  period_label text not null,
  status text not null default 'Review needed'
    check (status in ('Draft', 'Review needed', 'Ready', 'Closed', 'Archived')),
  packet_title text not null,
  checklist jsonb not null default '{}'::jsonb,
  review_notes text,
  closed_by uuid references auth.users(id) on delete set null,
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_id, period_label)
);

create table if not exists public.books_accountant_packets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  entity_id uuid not null references public.books_entities(id) on delete cascade,
  close_pack_id uuid references public.books_close_packs(id) on delete set null,
  packet_title text not null,
  status text not null default 'Draft report'
    check (status in ('Draft report', 'Review needed', 'Ready', 'Sent externally', 'Archived')),
  delivery_note text,
  recipient_email text,
  payload_summary jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  exported_by uuid references auth.users(id) on delete set null,
  exported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books_currency_rates (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  entity_id uuid not null references public.books_entities(id) on delete cascade,
  base_currency text not null,
  quote_currency text not null,
  rate numeric(18, 8) not null check (rate > 0),
  rate_date date not null default current_date,
  source_note text not null default 'Manual review rate',
  source_type text not null default 'manual'
    check (source_type in ('manual', 'imported', 'review_adjustment')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_id, base_currency, quote_currency, rate_date)
);

create table if not exists public.books_exports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  entity_id uuid not null references public.books_entities(id) on delete cascade,
  close_pack_id uuid references public.books_close_packs(id) on delete set null,
  export_type text not null
    check (export_type in ('invoice_csv', 'expense_csv', 'cashflow_csv', 'journal_csv', 'tax_review_report', 'accountant_packet', 'close_pack', 'audit_log')),
  format text not null default 'csv'
    check (format in ('csv', 'json', 'pdf', 'markdown', 'xlsx')),
  file_name text,
  row_count integer not null default 0 check (row_count >= 0),
  filters jsonb not null default '{}'::jsonb,
  payload_summary jsonb not null default '{}'::jsonb,
  is_local_download boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  exported_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books_audit_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.books_clients(id) on delete cascade,
  entity_id uuid references public.books_entities(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null
    check (event_type in ('create', 'update', 'delete', 'import', 'export', 'review_change', 'status_change', 'close_month')),
  entity_table text not null,
  entity_id_ref uuid,
  action_summary text,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create or replace function private.books_user_role(target_client_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1
      from public.books_clients clients
      where clients.id = target_client_id
        and clients.owner_id = (select auth.uid())
    ) then 'owner'
    else (
      select members.role
      from public.books_team_members members
      where members.client_id = target_client_id
        and members.user_id = (select auth.uid())
        and members.status = 'active'
      order by case members.role
        when 'owner' then 1
        when 'admin' then 2
        when 'bookkeeper' then 3
        when 'accountant' then 4
        when 'reviewer' then 5
        when 'viewer' then 6
        else 99
      end
      limit 1
    )
  end;
$$;

create or replace function private.books_can_access(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.books_user_role(target_client_id) is not null;
$$;

create or replace function private.books_can_edit(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.books_user_role(target_client_id), '') in ('owner', 'admin', 'bookkeeper', 'accountant');
$$;

create or replace function private.books_can_review(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.books_user_role(target_client_id), '') in ('owner', 'admin', 'accountant', 'reviewer');
$$;

create or replace function private.books_can_manage(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.books_user_role(target_client_id), '') in ('owner', 'admin');
$$;

grant execute on function private.books_user_role(uuid) to authenticated;
grant execute on function private.books_can_access(uuid) to authenticated;
grant execute on function private.books_can_edit(uuid) to authenticated;
grant execute on function private.books_can_review(uuid) to authenticated;
grant execute on function private.books_can_manage(uuid) to authenticated;

create or replace function public.books_create_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.books_team_members (
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

drop trigger if exists trg_books_client_owner_membership on public.books_clients;
create trigger trg_books_client_owner_membership
after insert on public.books_clients
for each row execute function public.books_create_owner_membership();

create or replace function public.books_validate_client_links()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  expected_client_id uuid;
begin
  if tg_table_name = 'books_accounts' then
    select entity.client_id into expected_client_id
    from public.books_entities entity
    where entity.id = new.entity_id;
    if expected_client_id is distinct from new.client_id then
      raise exception 'books_accounts client_id must match entity client_id';
    end if;
  elsif tg_table_name = 'books_contacts' then
    select entity.client_id into expected_client_id
    from public.books_entities entity
    where entity.id = new.entity_id;
    if expected_client_id is distinct from new.client_id then
      raise exception 'books_contacts client_id must match entity client_id';
    end if;
  elsif tg_table_name = 'books_invoices' then
    select entity.client_id into expected_client_id
    from public.books_entities entity
    where entity.id = new.entity_id;
    if expected_client_id is distinct from new.client_id then
      raise exception 'books_invoices client_id must match entity client_id';
    end if;
    if new.contact_id is not null and not exists (
      select 1 from public.books_contacts contact
      where contact.id = new.contact_id
        and contact.client_id = new.client_id
        and contact.entity_id = new.entity_id
    ) then
      raise exception 'books_invoices contact must belong to the same client and entity';
    end if;
  elsif tg_table_name = 'books_invoice_lines' then
    select invoice.client_id into expected_client_id
    from public.books_invoices invoice
    where invoice.id = new.invoice_id;
    if expected_client_id is distinct from new.client_id then
      raise exception 'books_invoice_lines client_id must match invoice client_id';
    end if;
  elsif tg_table_name = 'books_payments' then
    select entity.client_id into expected_client_id
    from public.books_entities entity
    where entity.id = new.entity_id;
    if expected_client_id is distinct from new.client_id then
      raise exception 'books_payments client_id must match entity client_id';
    end if;
    if new.invoice_id is not null and not exists (
      select 1 from public.books_invoices invoice
      where invoice.id = new.invoice_id
        and invoice.client_id = new.client_id
        and invoice.entity_id = new.entity_id
    ) then
      raise exception 'books_payments invoice must belong to the same client and entity';
    end if;
  elsif tg_table_name = 'books_expenses' then
    select entity.client_id into expected_client_id
    from public.books_entities entity
    where entity.id = new.entity_id;
    if expected_client_id is distinct from new.client_id then
      raise exception 'books_expenses client_id must match entity client_id';
    end if;
  elsif tg_table_name = 'books_expense_documents' then
    select expense.client_id into expected_client_id
    from public.books_expenses expense
    where expense.id = new.expense_id;
    if expected_client_id is distinct from new.client_id then
      raise exception 'books_expense_documents client_id must match expense client_id';
    end if;
  elsif tg_table_name = 'books_journals' then
    select entity.client_id into expected_client_id
    from public.books_entities entity
    where entity.id = new.entity_id;
    if expected_client_id is distinct from new.client_id then
      raise exception 'books_journals client_id must match entity client_id';
    end if;
  elsif tg_table_name = 'books_journal_lines' then
    select journal.client_id into expected_client_id
    from public.books_journals journal
    where journal.id = new.journal_id;
    if expected_client_id is distinct from new.client_id then
      raise exception 'books_journal_lines client_id must match journal client_id';
    end if;
    if new.account_id is not null and not exists (
      select 1 from public.books_accounts account
      where account.id = new.account_id
        and account.client_id = new.client_id
    ) then
      raise exception 'books_journal_lines account must belong to the same client';
    end if;
  elsif tg_table_name in (
    'books_payroll_journal_imports',
    'books_seller_daily_close_imports',
    'books_tax_reports',
    'books_close_packs',
    'books_accountant_packets',
    'books_currency_rates',
    'books_exports'
  ) then
    select entity.client_id into expected_client_id
    from public.books_entities entity
    where entity.id = new.entity_id;
    if expected_client_id is distinct from new.client_id then
      raise exception '% client_id must match entity client_id', tg_table_name;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.books_audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_client_id uuid;
  target_entity_id uuid;
  target_entity_ref uuid;
  action_summary text;
begin
  if tg_op = 'DELETE' then
    if tg_table_name = 'books_clients' then
      target_client_id := old.id;
    else
      target_client_id := old.client_id;
    end if;
    if to_jsonb(old) ? 'entity_id' then
      target_entity_id := (to_jsonb(old)->>'entity_id')::uuid;
    end if;
    target_entity_ref := old.id;
  else
    if tg_table_name = 'books_clients' then
      target_client_id := new.id;
    else
      target_client_id := new.client_id;
    end if;
    if to_jsonb(new) ? 'entity_id' then
      target_entity_id := (to_jsonb(new)->>'entity_id')::uuid;
    end if;
    target_entity_ref := new.id;
  end if;

  if tg_table_name = 'books_audit_events' or target_client_id is null then
    return coalesce(new, old);
  end if;

  action_summary := tg_table_name || ' ' || lower(tg_op);

  insert into public.books_audit_events (
    client_id,
    entity_id,
    actor_id,
    event_type,
    entity_table,
    entity_id_ref,
    action_summary,
    old_data,
    new_data
  )
  values (
    target_client_id,
    target_entity_id,
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
    'books_clients',
    'books_team_members',
    'books_entities',
    'books_accounts',
    'books_contacts',
    'books_invoices',
    'books_invoice_lines',
    'books_payments',
    'books_expenses',
    'books_expense_documents',
    'books_journals',
    'books_journal_lines',
    'books_payroll_journal_imports',
    'books_seller_daily_close_imports',
    'books_tax_reports',
    'books_close_packs',
    'books_accountant_packets',
    'books_currency_rates',
    'books_exports'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop trigger if exists trg_%I_set_updated_at on public.%I', table_name, table_name);
    execute format('create trigger trg_%I_set_updated_at before update on public.%I for each row execute function public.books_set_updated_at()', table_name, table_name);
  end loop;

  execute 'alter table public.books_audit_events enable row level security';

  foreach table_name in array array[
    'books_accounts',
    'books_contacts',
    'books_invoices',
    'books_invoice_lines',
    'books_payments',
    'books_expenses',
    'books_expense_documents',
    'books_journals',
    'books_journal_lines',
    'books_payroll_journal_imports',
    'books_seller_daily_close_imports',
    'books_tax_reports',
    'books_close_packs',
    'books_accountant_packets',
    'books_currency_rates',
    'books_exports'
  ] loop
    execute format('drop trigger if exists trg_%I_validate_client_links on public.%I', table_name, table_name);
    execute format('create trigger trg_%I_validate_client_links before insert or update on public.%I for each row execute function public.books_validate_client_links()', table_name, table_name);
  end loop;

  foreach table_name in array array[
    'books_clients',
    'books_team_members',
    'books_entities',
    'books_accounts',
    'books_contacts',
    'books_invoices',
    'books_invoice_lines',
    'books_payments',
    'books_expenses',
    'books_expense_documents',
    'books_journals',
    'books_journal_lines',
    'books_payroll_journal_imports',
    'books_seller_daily_close_imports',
    'books_tax_reports',
    'books_close_packs',
    'books_accountant_packets',
    'books_currency_rates',
    'books_exports'
  ] loop
    execute format('drop trigger if exists trg_%I_audit on public.%I', table_name, table_name);
    execute format('create trigger trg_%I_audit after insert or update or delete on public.%I for each row execute function public.books_audit_row_change()', table_name, table_name);
  end loop;
end;
$$;

create policy "Users can create owned books clients"
on public.books_clients
for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "Users can read accessible books clients"
on public.books_clients
for select
to authenticated
using ((select private.books_can_access(id)));

create policy "Managers can update books clients"
on public.books_clients
for update
to authenticated
using ((select private.books_can_manage(id)))
with check ((select private.books_can_manage(id)));

create policy "Owners can delete books clients"
on public.books_clients
for delete
to authenticated
using (owner_id = (select auth.uid()));

create policy "Users can read books team members"
on public.books_team_members
for select
to authenticated
using ((select private.books_can_access(client_id)));

create policy "Managers can insert books team members"
on public.books_team_members
for insert
to authenticated
with check ((select private.books_can_manage(client_id)));

create policy "Managers can update books team members"
on public.books_team_members
for update
to authenticated
using ((select private.books_can_manage(client_id)))
with check ((select private.books_can_manage(client_id)));

create policy "Managers can delete books team members"
on public.books_team_members
for delete
to authenticated
using ((select private.books_can_manage(client_id)));

create policy "Users can read books audit events"
on public.books_audit_events
for select
to authenticated
using ((select private.books_can_access(client_id)));

create policy "Users can insert own books audit events"
on public.books_audit_events
for insert
to authenticated
with check (
  actor_id = (select auth.uid())
  and (select private.books_can_access(client_id))
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'books_entities',
    'books_accounts',
    'books_contacts',
    'books_invoices',
    'books_invoice_lines',
    'books_payments',
    'books_expenses',
    'books_expense_documents',
    'books_journals',
    'books_journal_lines',
    'books_payroll_journal_imports',
    'books_seller_daily_close_imports',
    'books_currency_rates'
  ] loop
    execute format('create policy "Users can read %s" on public.%I for select to authenticated using ((select private.books_can_access(client_id)))', table_name, table_name);
    execute format('create policy "Editors can insert %s" on public.%I for insert to authenticated with check ((select private.books_can_edit(client_id)))', table_name, table_name);
    execute format('create policy "Editors can update %s" on public.%I for update to authenticated using ((select private.books_can_edit(client_id)) or (select private.books_can_review(client_id))) with check ((select private.books_can_edit(client_id)) or (select private.books_can_review(client_id)))', table_name, table_name);
    execute format('create policy "Managers can delete %s" on public.%I for delete to authenticated using ((select private.books_can_manage(client_id)))', table_name, table_name);
  end loop;

  foreach table_name in array array[
    'books_tax_reports',
    'books_close_packs',
    'books_accountant_packets',
    'books_exports'
  ] loop
    execute format('create policy "Users can read %s" on public.%I for select to authenticated using ((select private.books_can_access(client_id)))', table_name, table_name);
    execute format('create policy "Editors can insert %s" on public.%I for insert to authenticated with check ((select private.books_can_edit(client_id)) or (select private.books_can_review(client_id)))', table_name, table_name);
    execute format('create policy "Reviewers can update %s" on public.%I for update to authenticated using ((select private.books_can_edit(client_id)) or (select private.books_can_review(client_id))) with check ((select private.books_can_edit(client_id)) or (select private.books_can_review(client_id)))', table_name, table_name);
    execute format('create policy "Managers can delete %s" on public.%I for delete to authenticated using ((select private.books_can_manage(client_id)))', table_name, table_name);
  end loop;
end;
$$;

create index if not exists idx_books_clients_owner_updated
  on public.books_clients (owner_id, updated_at desc);
create index if not exists idx_books_team_members_client_role
  on public.books_team_members (client_id, role, status);
create index if not exists idx_books_team_members_user
  on public.books_team_members (user_id, status)
  where user_id is not null;
create index if not exists idx_books_entities_client_status
  on public.books_entities (client_id, status, updated_at desc);
create index if not exists idx_books_accounts_entity_type
  on public.books_accounts (entity_id, account_type, account_code);
create index if not exists idx_books_contacts_entity_type
  on public.books_contacts (entity_id, contact_type, updated_at desc);
create index if not exists idx_books_invoices_entity_status_due
  on public.books_invoices (entity_id, status, due_date);
create index if not exists idx_books_invoices_client_updated
  on public.books_invoices (client_id, updated_at desc);
create index if not exists idx_books_invoice_lines_invoice
  on public.books_invoice_lines (invoice_id, line_no);
create index if not exists idx_books_payments_entity_date
  on public.books_payments (entity_id, payment_date desc);
create index if not exists idx_books_payments_invoice
  on public.books_payments (invoice_id)
  where invoice_id is not null;
create index if not exists idx_books_expenses_entity_date
  on public.books_expenses (entity_id, expense_date desc);
create index if not exists idx_books_expenses_status
  on public.books_expenses (client_id, expense_status, receipt_status);
create index if not exists idx_books_expense_documents_expense
  on public.books_expense_documents (expense_id);
create index if not exists idx_books_journals_entity_date
  on public.books_journals (entity_id, journal_date desc);
create index if not exists idx_books_journal_lines_journal
  on public.books_journal_lines (journal_id, line_no);
create index if not exists idx_books_payroll_imports_entity
  on public.books_payroll_journal_imports (entity_id, created_at desc);
create index if not exists idx_books_seller_daily_close_imports_entity
  on public.books_seller_daily_close_imports (entity_id, close_date desc);
create index if not exists idx_books_tax_reports_entity_period
  on public.books_tax_reports (entity_id, report_type, period_label);
create index if not exists idx_books_close_packs_entity_period
  on public.books_close_packs (entity_id, period_label);
create index if not exists idx_books_accountant_packets_entity
  on public.books_accountant_packets (entity_id, created_at desc);
create index if not exists idx_books_currency_rates_entity_date
  on public.books_currency_rates (entity_id, base_currency, quote_currency, rate_date desc);
create index if not exists idx_books_exports_entity_type
  on public.books_exports (entity_id, export_type, created_at desc);
create index if not exists idx_books_audit_events_client
  on public.books_audit_events (client_id, occurred_at desc);
create index if not exists idx_books_audit_events_entity
  on public.books_audit_events (entity_table, entity_id_ref);
create index if not exists idx_books_audit_events_actor
  on public.books_audit_events (actor_id, occurred_at desc);

comment on table public.books_clients is
  'AfroBooks client/workspace tenancy root. Finance records are scoped through this table.';
comment on table public.books_team_members is
  'AfroBooks workspace membership and role assignment.';
comment on table public.books_entities is
  'Business, school, clinic, NGO, freelancer, trader, importer, or project finance file.';
comment on table public.books_accounts is
  'Chart of accounts and user-entered/imported balance review records. Not verified bank feeds.';
comment on table public.books_tax_reports is
  'Draft tax review/preparation metadata only. This table is not filing or remittance proof.';
comment on table public.books_expense_documents is
  'Receipt/document metadata only for this phase. No storage bucket is created by this migration.';
comment on table public.books_audit_events is
  'Append-only audit trail for AfroBooks finance workspace actions.';
