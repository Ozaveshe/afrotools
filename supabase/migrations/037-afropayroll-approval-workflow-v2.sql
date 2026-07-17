-- AfroPayroll Approval Workflow V2 And Run Lifecycle
--
-- Adds the review-chain lifecycle states used by the workspace/API while keeping legacy
-- states accepted so existing synced runs can be loaded and migrated by the
-- application layer without breaking current data.

alter table public.payroll_runs
  drop constraint if exists payroll_runs_status_check;

alter table public.payroll_runs
  add constraint payroll_runs_status_check
  check (status in (
    'draft',
    'review',
    'approved',
    'finalized',
    'exported',
    'reopened',
    'archived',
    -- Legacy statuses retained for existing rows and older API clients.
    'submitted',
    'changes_requested',
    'needs_review',
    'ready',
    'approval_requested',
    'closed'
  ));

alter table public.payroll_runs
  drop constraint if exists payroll_runs_approval_status_check;

alter table public.payroll_runs
  add constraint payroll_runs_approval_status_check
  check (approval_status in (
    'not_requested',
    'pending',
    'review',
    'submitted',
    'changes_requested',
    'approved',
    'finalized',
    'exported',
    'reopened',
    'rejected',
    'cancelled'
  ));

alter table public.payroll_approvals
  drop constraint if exists payroll_approvals_status_check;

alter table public.payroll_approvals
  add constraint payroll_approvals_status_check
  check (status in (
    'pending',
    'review',
    'submitted',
    'changes_requested',
    'approved',
    'finalized',
    'reopened',
    'rejected',
    'cancelled'
  ));

comment on table public.payroll_approvals is
  'Approval chain events for AfroPayroll runs, including review, approval, finalization, export, and reopening notes.';
