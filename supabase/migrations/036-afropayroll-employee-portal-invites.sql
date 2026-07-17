-- AfroPayroll employee self-service portal invite tokens
--
-- The employee portal is accessed through API-validated signed links. Raw
-- tokens are never stored; the Netlify function stores and looks up SHA-256
-- token hashes, then returns only the invited employee's own run rows and
-- payslip records.

create table if not exists public.payroll_employee_portal_invites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.payroll_clients(id) on delete cascade,
  company_id uuid not null references public.payroll_companies(id) on delete cascade,
  run_id uuid not null references public.payroll_runs(id) on delete cascade,
  employee_id uuid not null references public.payroll_employees(id) on delete cascade,
  token_hash text not null unique,
  invited_email text,
  status text not null default 'active'
    check (status in ('active', 'revoked', 'expired', 'used')),
  expires_at timestamptz not null default (now() + interval '14 days'),
  last_viewed_at timestamptz,
  confirmed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists payroll_employee_portal_invites_client_idx
  on public.payroll_employee_portal_invites (client_id, status, expires_at desc);

create index if not exists payroll_employee_portal_invites_run_employee_idx
  on public.payroll_employee_portal_invites (run_id, employee_id, created_at desc);

create index if not exists payroll_employee_portal_invites_token_status_idx
  on public.payroll_employee_portal_invites (token_hash, status, expires_at);

drop trigger if exists payroll_employee_portal_invites_updated_at on public.payroll_employee_portal_invites;
create trigger payroll_employee_portal_invites_updated_at
before update on public.payroll_employee_portal_invites
for each row execute function public.payroll_set_updated_at();

alter table public.payroll_employee_portal_invites enable row level security;

drop policy if exists "Payroll viewers can read employee portal invites" on public.payroll_employee_portal_invites;
create policy "Payroll viewers can read employee portal invites"
on public.payroll_employee_portal_invites
for select
to authenticated
using ((select private.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll editors can create employee portal invites" on public.payroll_employee_portal_invites;
create policy "Payroll editors can create employee portal invites"
on public.payroll_employee_portal_invites
for insert
to authenticated
with check ((select private.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can update employee portal invites" on public.payroll_employee_portal_invites;
create policy "Payroll editors can update employee portal invites"
on public.payroll_employee_portal_invites
for update
to authenticated
using ((select private.payroll_can_edit_payroll(client_id)))
with check ((select private.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll managers can delete employee portal invites" on public.payroll_employee_portal_invites;
create policy "Payroll managers can delete employee portal invites"
on public.payroll_employee_portal_invites
for delete
to authenticated
using ((select private.payroll_can_manage_client(client_id)));
