#!/usr/bin/env node
/**
 * Optional AfroPayroll role-boundary smoke.
 *
 * Defaults to local/dry-run checks. Live mode is read/negative-write only and
 * must be pointed at QA fixture data, never customer payroll data.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const baseUrl = (process.env.AFROPAYROLL_QA_BASE_URL || 'https://afrotools.com').replace(/\/+$/g, '');
const runId = process.env.AFROPAYROLL_QA_RUN_ID || '';
const live = process.env.AFROPAYROLL_ROLE_SMOKE_LIVE === '1';

const expected = {
  owner: {
    dashboard: true,
    salaryRows: true,
    editEmployees: true,
    editRunRows: true,
    requestApproval: true,
    approveFinalize: true,
    reopen: true,
    generatePayslips: true,
    generateStatutoryPacks: true,
    recordExports: true,
    inviteMembers: true,
    viewAudit: true,
  },
  admin: {
    dashboard: true,
    salaryRows: true,
    editEmployees: true,
    editRunRows: true,
    requestApproval: true,
    approveFinalize: true,
    reopen: true,
    generatePayslips: true,
    generateStatutoryPacks: true,
    recordExports: true,
    inviteMembers: true,
    viewAudit: true,
  },
  payroll_admin: {
    dashboard: true,
    salaryRows: true,
    editEmployees: true,
    editRunRows: true,
    requestApproval: true,
    approveFinalize: false,
    reopen: false,
    generatePayslips: true,
    generateStatutoryPacks: true,
    recordExports: true,
    inviteMembers: false,
    viewAudit: true,
  },
  accountant: {
    dashboard: true,
    salaryRows: true,
    editEmployees: true,
    editRunRows: true,
    requestApproval: true,
    approveFinalize: true,
    reopen: true,
    generatePayslips: true,
    generateStatutoryPacks: true,
    recordExports: true,
    inviteMembers: false,
    viewAudit: true,
  },
  approver: {
    dashboard: true,
    salaryRows: true,
    editEmployees: false,
    editRunRows: false,
    requestApproval: false,
    approveFinalize: true,
    reopen: true,
    generatePayslips: false,
    generateStatutoryPacks: false,
    recordExports: false,
    inviteMembers: false,
    viewAudit: true,
  },
  viewer: {
    dashboard: false,
    salaryRows: false,
    editEmployees: false,
    editRunRows: false,
    requestApproval: false,
    approveFinalize: false,
    reopen: false,
    generatePayslips: false,
    generateStatutoryPacks: false,
    recordExports: false,
    inviteMembers: false,
    viewAudit: false,
  },
};

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function roleConstant(api, name) {
  const match = api.match(new RegExp(`const\\s+${name}\\s+=\\s+\\[([^\\]]*)\\]`));
  if (!match) throw new Error(`Missing API role constant ${name}`);
  return match[1].split(',').map((part) => part.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
}

function assertLocalMatrix() {
  const api = read('netlify/functions/api-afropayroll.js');
  const groups = {
    viewPayroll: roleConstant(api, 'VIEW_PAYROLL_ROLES'),
    editPayroll: roleConstant(api, 'EDIT_PAYROLL_ROLES'),
    approvePayroll: roleConstant(api, 'APPROVE_PAYROLL_ROLES'),
    manageMembers: roleConstant(api, 'MANAGE_MEMBER_ROLES'),
  };
  const checks = [
    ['viewer excluded from salary viewing', !groups.viewPayroll.includes('viewer')],
    ['viewer excluded from editing', !groups.editPayroll.includes('viewer')],
    ['approver excluded from editing', !groups.editPayroll.includes('approver')],
    ['payroll_admin excluded from member management', !groups.manageMembers.includes('payroll_admin')],
    ['approver included in approval group', groups.approvePayroll.includes('approver')],
    ['employee portal token path present', /params\.action === 'employee_portal'/.test(api) && /handleEmployeePortal\(params\)/.test(api)],
  ];
  checks.forEach(([label, ok]) => {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
    if (!ok) process.exitCode = 1;
  });
  return groups;
}

async function requestAs(role, token, method, action, body, query) {
  const url = new URL(`${baseUrl}/api/afropayroll`);
  if (method === 'GET') url.searchParams.set('action', action);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: method === 'GET' ? undefined : JSON.stringify(Object.assign({ action }, body || {})),
  });
  const text = await response.text();
  console.log(`${response.status < 400 ? 'PASS' : 'OBSERVE'} ${role} ${method} ${action} -> ${response.status}`);
  return { status: response.status, text };
}

async function liveSmoke() {
  if (!live) {
    console.log('DRY-RUN live smoke skipped. Set AFROPAYROLL_ROLE_SMOKE_LIVE=1 with QA tokens to run read/negative-write checks.');
    return;
  }
  if (!runId) throw new Error('Set AFROPAYROLL_QA_RUN_ID for live role smoke.');
  const tokens = {
    viewer: process.env.AFROPAYROLL_QA_TOKEN_VIEWER || '',
    approver: process.env.AFROPAYROLL_QA_TOKEN_APPROVER || '',
    payroll_admin: process.env.AFROPAYROLL_QA_TOKEN_PAYROLL_ADMIN || '',
  };
  if (!tokens.viewer && !tokens.approver && !tokens.payroll_admin) {
    throw new Error('Set at least one AFROPAYROLL_QA_TOKEN_VIEWER, AFROPAYROLL_QA_TOKEN_APPROVER, or AFROPAYROLL_QA_TOKEN_PAYROLL_ADMIN token.');
  }
  if (tokens.viewer) {
    await requestAs('viewer', tokens.viewer, 'GET', 'load', null, { run_id: runId });
    await requestAs('viewer', tokens.viewer, 'GET', 'audit', null, { run_id: runId });
  }
  if (tokens.approver) {
    await requestAs('approver', tokens.approver, 'POST', 'save_employee', {
      client_id: '00000000-0000-4000-8000-000000000000',
      company_id: '00000000-0000-4000-8000-000000000000',
      employee: { employeeId: 'ROLE-SMOKE-NO-WRITE', name: 'Role Smoke No Write' },
    });
  }
  if (tokens.payroll_admin) {
    await requestAs('payroll_admin', tokens.payroll_admin, 'POST', 'invite_member', {
      run_id: runId,
      email: 'qa-role-boundary@example.com',
      role: 'viewer',
    });
  }
}

async function main() {
  const groups = assertLocalMatrix();
  console.log('ROLE_MATRIX ' + JSON.stringify({ expected, apiGroups: groups }, null, 2));
  await liveSmoke();
  if (process.exitCode) process.exit(process.exitCode);
}

main().catch((error) => {
  console.error('FAIL ' + error.message);
  process.exit(1);
});
