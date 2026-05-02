-- AfroPayroll Pro foreign-key index completion.
-- Adds direct indexes for FK columns that are not already covered by the
-- launch schema's workflow-oriented composite indexes.

create index if not exists idx_payroll_approvals_client_id
  on public.payroll_approvals (client_id);
create index if not exists idx_payroll_approvals_requested_by
  on public.payroll_approvals (requested_by);

create index if not exists idx_payroll_audit_events_actor_id
  on public.payroll_audit_events (actor_id);
create index if not exists idx_payroll_audit_events_company_id
  on public.payroll_audit_events (company_id);
create index if not exists idx_payroll_audit_events_employee_id
  on public.payroll_audit_events (employee_id);
create index if not exists idx_payroll_audit_events_run_id
  on public.payroll_audit_events (run_id);

create index if not exists idx_payroll_companies_created_by
  on public.payroll_companies (created_by);
create index if not exists idx_payroll_companies_updated_by
  on public.payroll_companies (updated_by);

create index if not exists idx_payroll_employees_created_by
  on public.payroll_employees (created_by);
create index if not exists idx_payroll_employees_updated_by
  on public.payroll_employees (updated_by);

create index if not exists idx_payroll_exports_client_id
  on public.payroll_exports (client_id);
create index if not exists idx_payroll_exports_exported_by
  on public.payroll_exports (exported_by);

create index if not exists idx_payroll_import_batches_company_id
  on public.payroll_import_batches (company_id);
create index if not exists idx_payroll_import_batches_run_id
  on public.payroll_import_batches (run_id);
create index if not exists idx_payroll_import_batches_uploaded_by
  on public.payroll_import_batches (uploaded_by);

create index if not exists idx_payroll_memberships_invited_by
  on public.payroll_memberships (invited_by);

create index if not exists idx_payroll_payslips_client_id
  on public.payroll_payslips (client_id);
create index if not exists idx_payroll_payslips_generated_by
  on public.payroll_payslips (generated_by);
create index if not exists idx_payroll_payslips_row_id
  on public.payroll_payslips (row_id);

create index if not exists idx_payroll_run_rows_created_by
  on public.payroll_run_rows (created_by);
create index if not exists idx_payroll_run_rows_updated_by
  on public.payroll_run_rows (updated_by);

create index if not exists idx_payroll_runs_approved_by
  on public.payroll_runs (approved_by);
create index if not exists idx_payroll_runs_created_by
  on public.payroll_runs (created_by);
create index if not exists idx_payroll_runs_updated_by
  on public.payroll_runs (updated_by);

create index if not exists idx_payroll_statutory_packs_client_id
  on public.payroll_statutory_packs (client_id);
create index if not exists idx_payroll_statutory_packs_prepared_by
  on public.payroll_statutory_packs (prepared_by);
create index if not exists idx_payroll_statutory_packs_reviewed_by
  on public.payroll_statutory_packs (reviewed_by);

create index if not exists idx_payroll_workspace_comments_author_id
  on public.payroll_workspace_comments (author_id);
create index if not exists idx_payroll_workspace_comments_client_id
  on public.payroll_workspace_comments (client_id);
create index if not exists idx_payroll_workspace_comments_resolved_by
  on public.payroll_workspace_comments (resolved_by);
