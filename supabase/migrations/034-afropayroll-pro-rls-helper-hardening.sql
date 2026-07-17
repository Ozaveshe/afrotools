-- AfroPayroll Pro RLS helper hardening
-- Moves helper functions used by payroll policies out of the exposed public
-- schema so they are not callable as public RPC endpoints.

create schema if not exists private;

grant usage on schema private to authenticated;
grant usage on schema private to service_role;

create or replace function private.payroll_user_role(target_client_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
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

create or replace function private.payroll_can_access(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.payroll_user_role(target_client_id) is not null;
$$;

create or replace function private.payroll_can_manage_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.payroll_user_role(target_client_id), '') in ('owner', 'admin');
$$;

create or replace function private.payroll_can_edit_payroll(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.payroll_user_role(target_client_id), '') in ('owner', 'admin', 'payroll_admin', 'accountant');
$$;

create or replace function private.payroll_can_approve(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.payroll_user_role(target_client_id), '') in ('owner', 'admin', 'accountant', 'approver');
$$;

create or replace function private.payroll_can_view_payroll(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.payroll_user_role(target_client_id), '') in ('owner', 'admin', 'payroll_admin', 'accountant', 'approver');
$$;

grant execute on function private.payroll_user_role(uuid) to authenticated;
grant execute on function private.payroll_can_access(uuid) to authenticated;
grant execute on function private.payroll_can_manage_client(uuid) to authenticated;
grant execute on function private.payroll_can_edit_payroll(uuid) to authenticated;
grant execute on function private.payroll_can_approve(uuid) to authenticated;
grant execute on function private.payroll_can_view_payroll(uuid) to authenticated;

drop policy if exists "Users can read accessible payroll clients" on public.payroll_clients;
create policy "Users can read accessible payroll clients"
on public.payroll_clients
for select
to authenticated
using ((select private.payroll_can_access(id)));

drop policy if exists "Managers can update payroll clients" on public.payroll_clients;
create policy "Managers can update payroll clients"
on public.payroll_clients
for update
to authenticated
using ((select private.payroll_can_manage_client(id)))
with check ((select private.payroll_can_manage_client(id)));

drop policy if exists "Users can read payroll memberships" on public.payroll_memberships;
create policy "Users can read payroll memberships"
on public.payroll_memberships
for select
to authenticated
using ((select private.payroll_can_access(client_id)));

drop policy if exists "Managers can insert payroll memberships" on public.payroll_memberships;
create policy "Managers can insert payroll memberships"
on public.payroll_memberships
for insert
to authenticated
with check ((select private.payroll_can_manage_client(client_id)));

drop policy if exists "Managers can update payroll memberships" on public.payroll_memberships;
create policy "Managers can update payroll memberships"
on public.payroll_memberships
for update
to authenticated
using ((select private.payroll_can_manage_client(client_id)))
with check ((select private.payroll_can_manage_client(client_id)));

drop policy if exists "Managers can delete payroll memberships" on public.payroll_memberships;
create policy "Managers can delete payroll memberships"
on public.payroll_memberships
for delete
to authenticated
using ((select private.payroll_can_manage_client(client_id)));

drop policy if exists "Users can read payroll companies" on public.payroll_companies;
create policy "Users can read payroll companies"
on public.payroll_companies
for select
to authenticated
using ((select private.payroll_can_access(client_id)));

drop policy if exists "Payroll editors can insert companies" on public.payroll_companies;
create policy "Payroll editors can insert companies"
on public.payroll_companies
for insert
to authenticated
with check ((select private.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can update companies" on public.payroll_companies;
create policy "Payroll editors can update companies"
on public.payroll_companies
for update
to authenticated
using ((select private.payroll_can_edit_payroll(client_id)))
with check ((select private.payroll_can_edit_payroll(client_id)));

drop policy if exists "Managers can delete companies" on public.payroll_companies;
create policy "Managers can delete companies"
on public.payroll_companies
for delete
to authenticated
using ((select private.payroll_can_manage_client(client_id)));

drop policy if exists "Payroll viewers can read employees" on public.payroll_employees;
create policy "Payroll viewers can read employees"
on public.payroll_employees
for select
to authenticated
using ((select private.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll editors can insert employees" on public.payroll_employees;
create policy "Payroll editors can insert employees"
on public.payroll_employees
for insert
to authenticated
with check ((select private.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can update employees" on public.payroll_employees;
create policy "Payroll editors can update employees"
on public.payroll_employees
for update
to authenticated
using ((select private.payroll_can_edit_payroll(client_id)))
with check ((select private.payroll_can_edit_payroll(client_id)));

drop policy if exists "Managers can delete employees" on public.payroll_employees;
create policy "Managers can delete employees"
on public.payroll_employees
for delete
to authenticated
using ((select private.payroll_can_manage_client(client_id)));

drop policy if exists "Payroll viewers can read runs" on public.payroll_runs;
create policy "Payroll viewers can read runs"
on public.payroll_runs
for select
to authenticated
using ((select private.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll editors can insert runs" on public.payroll_runs;
create policy "Payroll editors can insert runs"
on public.payroll_runs
for insert
to authenticated
with check ((select private.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can update runs" on public.payroll_runs;
create policy "Payroll editors can update runs"
on public.payroll_runs
for update
to authenticated
using ((select private.payroll_can_edit_payroll(client_id)) or (select private.payroll_can_approve(client_id)))
with check ((select private.payroll_can_edit_payroll(client_id)) or (select private.payroll_can_approve(client_id)));

drop policy if exists "Managers can delete runs" on public.payroll_runs;
create policy "Managers can delete runs"
on public.payroll_runs
for delete
to authenticated
using ((select private.payroll_can_manage_client(client_id)));

drop policy if exists "Payroll viewers can read run rows" on public.payroll_run_rows;
create policy "Payroll viewers can read run rows"
on public.payroll_run_rows
for select
to authenticated
using ((select private.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll editors can insert run rows" on public.payroll_run_rows;
create policy "Payroll editors can insert run rows"
on public.payroll_run_rows
for insert
to authenticated
with check ((select private.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can update run rows" on public.payroll_run_rows;
create policy "Payroll editors can update run rows"
on public.payroll_run_rows
for update
to authenticated
using ((select private.payroll_can_edit_payroll(client_id)))
with check ((select private.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can delete run rows" on public.payroll_run_rows;
create policy "Payroll editors can delete run rows"
on public.payroll_run_rows
for delete
to authenticated
using ((select private.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll viewers can read payslips" on public.payroll_payslips;
create policy "Payroll viewers can read payslips"
on public.payroll_payslips
for select
to authenticated
using ((select private.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll editors can insert payslips" on public.payroll_payslips;
create policy "Payroll editors can insert payslips"
on public.payroll_payslips
for insert
to authenticated
with check ((select private.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can update payslips" on public.payroll_payslips;
create policy "Payroll editors can update payslips"
on public.payroll_payslips
for update
to authenticated
using ((select private.payroll_can_edit_payroll(client_id)))
with check ((select private.payroll_can_edit_payroll(client_id)));

drop policy if exists "Managers can delete payslips" on public.payroll_payslips;
create policy "Managers can delete payslips"
on public.payroll_payslips
for delete
to authenticated
using ((select private.payroll_can_manage_client(client_id)));

drop policy if exists "Payroll viewers can read approvals" on public.payroll_approvals;
create policy "Payroll viewers can read approvals"
on public.payroll_approvals
for select
to authenticated
using ((select private.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll editors can request approvals" on public.payroll_approvals;
create policy "Payroll editors can request approvals"
on public.payroll_approvals
for insert
to authenticated
with check ((select private.payroll_can_edit_payroll(client_id)));

drop policy if exists "Approvers can update approvals" on public.payroll_approvals;
create policy "Approvers can update approvals"
on public.payroll_approvals
for update
to authenticated
using ((select private.payroll_can_approve(client_id)))
with check ((select private.payroll_can_approve(client_id)));

drop policy if exists "Managers can delete approvals" on public.payroll_approvals;
create policy "Managers can delete approvals"
on public.payroll_approvals
for delete
to authenticated
using ((select private.payroll_can_manage_client(client_id)));

drop policy if exists "Payroll viewers can read comments" on public.payroll_workspace_comments;
create policy "Payroll viewers can read comments"
on public.payroll_workspace_comments
for select
to authenticated
using ((select private.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll viewers can insert comments" on public.payroll_workspace_comments;
create policy "Payroll viewers can insert comments"
on public.payroll_workspace_comments
for insert
to authenticated
with check ((select private.payroll_can_view_payroll(client_id)));

drop policy if exists "Comment authors and editors can update comments" on public.payroll_workspace_comments;
create policy "Comment authors and editors can update comments"
on public.payroll_workspace_comments
for update
to authenticated
using (
  author_id = (select auth.uid())
  or (select private.payroll_can_edit_payroll(client_id))
)
with check ((select private.payroll_can_view_payroll(client_id)));

drop policy if exists "Managers can delete comments" on public.payroll_workspace_comments;
create policy "Managers can delete comments"
on public.payroll_workspace_comments
for delete
to authenticated
using (
  author_id = (select auth.uid())
  or (select private.payroll_can_manage_client(client_id))
);

drop policy if exists "Payroll viewers can read imports" on public.payroll_import_batches;
create policy "Payroll viewers can read imports"
on public.payroll_import_batches
for select
to authenticated
using ((select private.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll editors can insert imports" on public.payroll_import_batches;
create policy "Payroll editors can insert imports"
on public.payroll_import_batches
for insert
to authenticated
with check ((select private.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can update imports" on public.payroll_import_batches;
create policy "Payroll editors can update imports"
on public.payroll_import_batches
for update
to authenticated
using ((select private.payroll_can_edit_payroll(client_id)))
with check ((select private.payroll_can_edit_payroll(client_id)));

drop policy if exists "Managers can delete imports" on public.payroll_import_batches;
create policy "Managers can delete imports"
on public.payroll_import_batches
for delete
to authenticated
using ((select private.payroll_can_manage_client(client_id)));

drop policy if exists "Payroll viewers can read exports" on public.payroll_exports;
create policy "Payroll viewers can read exports"
on public.payroll_exports
for select
to authenticated
using ((select private.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll editors can insert exports" on public.payroll_exports;
create policy "Payroll editors can insert exports"
on public.payroll_exports
for insert
to authenticated
with check ((select private.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can update exports" on public.payroll_exports;
create policy "Payroll editors can update exports"
on public.payroll_exports
for update
to authenticated
using ((select private.payroll_can_edit_payroll(client_id)))
with check ((select private.payroll_can_edit_payroll(client_id)));

drop policy if exists "Managers can delete exports" on public.payroll_exports;
create policy "Managers can delete exports"
on public.payroll_exports
for delete
to authenticated
using ((select private.payroll_can_manage_client(client_id)));

drop policy if exists "Payroll viewers can read statutory packs" on public.payroll_statutory_packs;
create policy "Payroll viewers can read statutory packs"
on public.payroll_statutory_packs
for select
to authenticated
using ((select private.payroll_can_view_payroll(client_id)));

drop policy if exists "Payroll editors can insert statutory packs" on public.payroll_statutory_packs;
create policy "Payroll editors can insert statutory packs"
on public.payroll_statutory_packs
for insert
to authenticated
with check ((select private.payroll_can_edit_payroll(client_id)));

drop policy if exists "Payroll editors can update statutory packs" on public.payroll_statutory_packs;
create policy "Payroll editors can update statutory packs"
on public.payroll_statutory_packs
for update
to authenticated
using ((select private.payroll_can_edit_payroll(client_id)) or (select private.payroll_can_approve(client_id)))
with check ((select private.payroll_can_edit_payroll(client_id)) or (select private.payroll_can_approve(client_id)));

drop policy if exists "Managers can delete statutory packs" on public.payroll_statutory_packs;
create policy "Managers can delete statutory packs"
on public.payroll_statutory_packs
for delete
to authenticated
using ((select private.payroll_can_manage_client(client_id)));

drop policy if exists "Payroll viewers can read audit events" on public.payroll_audit_events;
create policy "Payroll viewers can read audit events"
on public.payroll_audit_events
for select
to authenticated
using ((select private.payroll_can_view_payroll(client_id)));

drop policy if exists "Users can insert own audit events" on public.payroll_audit_events;
create policy "Users can insert own audit events"
on public.payroll_audit_events
for insert
to authenticated
with check (
  (actor_id is null or actor_id = (select auth.uid()))
  and (select private.payroll_can_access(client_id))
);

drop function if exists public.payroll_can_access(uuid);
drop function if exists public.payroll_can_approve(uuid);
drop function if exists public.payroll_can_edit_payroll(uuid);
drop function if exists public.payroll_can_manage_client(uuid);
drop function if exists public.payroll_can_view_payroll(uuid);
drop function if exists public.payroll_user_role(uuid);
