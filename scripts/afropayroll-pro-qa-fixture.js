#!/usr/bin/env node
/**
 * Safe AfroPayroll Pro QA fixture harness.
 *
 * Default mode is dry-run. Live writes require:
 * - AFROPAYROLL_QA_CONFIRM=1
 * - AFROPAYROLL_QA_ACCESS_TOKEN for API workflow stages
 * - AFROPAYROLL_QA_USER_ID or AFROPAYROLL_QA_EMAIL
 *
 * Cleanup additionally requires:
 * - AFROPAYROLL_QA_BATCH_ID
 * - SUPABASE_AUTH_SERVICE_KEY or SUPABASE_SERVICE_KEY
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const API_ACTIONS = [
  'dashboard',
  'clients',
  'load',
  'list_employees',
  'audit',
  'close_room',
  'save_client',
  'save_employee',
  'save_run',
  'request_approval',
  'approve_run',
  'finalize_run',
  'generate_payslips',
  'generate_statutory_packs',
  'record_export',
  'create_employee_portal_invite',
];
const REQUIRED_TABLES = [
  'payroll_clients',
  'payroll_companies',
  'payroll_employees',
  'payroll_runs',
  'payroll_run_rows',
  'payroll_approvals',
  'payroll_workspace_comments',
  'payroll_payslips',
  'payroll_statutory_packs',
  'payroll_exports',
  'payroll_audit_events',
  'payroll_employee_portal_invites',
];

function parseArgs(argv) {
  const args = { mode: 'cycle' };
  argv.slice(2).forEach((arg) => {
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--live') args.live = true;
    else if (arg.startsWith('--mode=')) args.mode = arg.slice('--mode='.length);
    else if (arg.startsWith('--batch=')) args.batchId = arg.slice('--batch='.length);
    else if (arg === '--cleanup') args.mode = 'cleanup';
    else if (arg === '--schema') args.mode = 'schema';
  });
  return args;
}

const args = parseArgs(process.argv);
const confirmLive = process.env.AFROPAYROLL_QA_CONFIRM === '1';
const dryRun = args.dryRun === true || !confirmLive || args.live !== true;
const baseUrl = (process.env.AFROPAYROLL_QA_BASE_URL || 'https://afrotools.com').replace(/\/+$/g, '');
const supabaseUrl = (process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co').replace(/\/+$/g, '');
const serviceKey = process.env.SUPABASE_AUTH_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const accessToken = process.env.AFROPAYROLL_QA_ACCESS_TOKEN || '';
const qaUserId = process.env.AFROPAYROLL_QA_USER_ID || '';
const qaEmail = process.env.AFROPAYROLL_QA_EMAIL || '';
const batchId = sanitizeBatchId(args.batchId || process.env.AFROPAYROLL_QA_BATCH_ID || createBatchId());
const mode = ['schema', 'create', 'cleanup', 'cycle'].includes(args.mode) ? args.mode : 'cycle';

function sanitizeBatchId(value) {
  return String(value || '').trim().replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
}

function createBatchId() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `qa_${stamp}_${crypto.randomBytes(3).toString('hex')}`;
}

function assertSafeIdentity() {
  if (!qaUserId && !qaEmail) {
    throw new Error('Set AFROPAYROLL_QA_USER_ID or AFROPAYROLL_QA_EMAIL for a clearly safe QA/test identity.');
  }
  if (qaEmail && !/(^qa[._-]|[._-]qa[._-]|test|fixture|sandbox|example\.com)/i.test(qaEmail)) {
    throw new Error('AFROPAYROLL_QA_EMAIL must clearly look like a QA/test identity.');
  }
}

function logStep(name, status, detail) {
  const suffix = detail ? ` - ${detail}` : '';
  console.log(`${status.padEnd(8)} ${name}${suffix}`);
}

function localApiContractCheck() {
  const apiPath = path.join(ROOT, 'netlify', 'functions', 'api-afropayroll.js');
  const api = fs.readFileSync(apiPath, 'utf8');
  const missingActions = API_ACTIONS.filter((action) => !api.includes(action));
  const missingTables = REQUIRED_TABLES.filter((table) => !api.includes(table));
  if (missingActions.length || missingTables.length) {
    throw new Error(`Local API contract check failed. Missing actions: ${missingActions.join(', ') || 'none'}; missing tables: ${missingTables.join(', ') || 'none'}`);
  }
  logStep('schema presence', 'PASS', 'local API references required Payroll Pro actions and tables');
}

async function apiRequest(method, action, body, query) {
  if (dryRun) {
    logStep(`${method} ${action}`, 'DRY-RUN', 'would call /api/afropayroll');
    return { ok: true, dryRun: true, action, body: body || {}, query: query || {} };
  }
  if (!accessToken) throw new Error('Set AFROPAYROLL_QA_ACCESS_TOKEN before live API fixture writes.');
  const url = new URL(`${baseUrl}/api/afropayroll`);
  if (action && method === 'GET') url.searchParams.set('action', action);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: method === 'GET' ? undefined : JSON.stringify(Object.assign({ action }, body || {})),
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = text;
  }
  if (!response.ok) {
    throw new Error(`${method} ${action} failed with ${response.status}: ${text}`);
  }
  logStep(`${method} ${action}`, 'PASS', `HTTP ${response.status}`);
  return data;
}

async function restRequest(method, table, query, body) {
  if (dryRun && (method !== 'GET' || !serviceKey)) {
    logStep(`${method} ${table}`, 'DRY-RUN', query || 'would query tagged rows');
    return [];
  }
  if (!serviceKey) throw new Error('Cleanup requires SUPABASE_AUTH_SERVICE_KEY or SUPABASE_SERVICE_KEY.');
  const url = `${supabaseUrl}/rest/v1/${table}${query ? `?${query}` : ''}`;
  const response = await fetch(url, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: method === 'DELETE' ? 'return=representation' : 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = [];
  try {
    data = text ? JSON.parse(text) : [];
  } catch (error) {
    data = text;
  }
  if (!response.ok) throw new Error(`${method} ${table} failed with ${response.status}: ${text}`);
  return Array.isArray(data) ? data : data ? [data] : [];
}

function q(params) {
  return Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
}

function fixtureTag() {
  return `[AFROPAYROLL_QA:${batchId}]`;
}

function buildFixture() {
  const tag = fixtureTag();
  const companyName = `${tag} Payroll Sandbox Ltd`;
  const employees = [
    {
      id: `${batchId}-emp-001`,
      employeeId: `${batchId}-E001`,
      name: 'QA Employee One',
      preferredName: 'QA One',
      email: `qa.payroll.one+${batchId}@example.com`,
      phone: '+10000000001',
      country: 'NG',
      currency: 'NGN',
      department: 'QA Operations',
      role: 'Payroll Fixture Analyst',
      employmentType: 'employee',
      paySchedule: 'monthly',
      startDate: '2026-01-01',
      taxId: `QA-TAX-${batchId}-001`,
      socialSecurityId: `QA-PEN-${batchId}-001`,
      bankName: 'QA Test Bank',
      bankAccountOrMobile: `QA-ROUTE-${batchId}-001`,
      payslipEmail: `qa.payroll.one+${batchId}@example.com`,
      status: 'active',
    },
    {
      id: `${batchId}-emp-002`,
      employeeId: `${batchId}-E002`,
      name: 'QA Employee Two',
      preferredName: 'QA Two',
      email: `qa.payroll.two+${batchId}@example.com`,
      phone: '+10000000002',
      country: 'KE',
      currency: 'KES',
      department: 'QA Finance',
      role: 'Payroll Fixture Reviewer',
      employmentType: 'employee',
      paySchedule: 'monthly',
      startDate: '2026-01-01',
      taxId: `QA-TAX-${batchId}-002`,
      socialSecurityId: `QA-NSSF-${batchId}-002`,
      bankName: 'QA Test Bank',
      bankAccountOrMobile: `QA-ROUTE-${batchId}-002`,
      payslipEmail: `qa.payroll.two+${batchId}@example.com`,
      status: 'active',
    },
  ];
  const rows = employees.map((employee, index) => {
    const gross = index === 0 ? 150000 : 120000;
    const allowances = index === 0 ? 10000 : 8000;
    const employeeDeductions = index === 0 ? 12000 : 9000;
    const customDeductions = index === 0 ? 2500 : 1500;
    const previewGross = gross + allowances;
    const netPay = previewGross - employeeDeductions - customDeductions;
    return {
      id: `${batchId}-row-${index + 1}`,
      employeeRecordId: employee.id,
      employeeId: employee.employeeId,
      employeeCode: employee.employeeId,
      name: employee.name,
      role: employee.role,
      department: employee.department,
      country: employee.country,
      currency: employee.currency,
      gross,
      allowances,
      overtime: 0,
      unpaidDays: 0,
      unpaidAmount: 0,
      customDeductions,
      calc: {
        status: 'full_pack',
        currency: employee.currency,
        previewGross,
        employeeDeductions,
        employerCost: Math.round(previewGross * 1.08 * 100) / 100,
        netPay,
        warning: '',
        hasEngine: true,
      },
    };
  });
  return {
    tag,
    client: {
      name: `${tag} Payroll QA Client`,
      companyName,
      country: 'NG',
      defaultCountry: 'NG',
      defaultCurrency: 'NGN',
      payrollContact: `qa.payroll.contact+${batchId}@example.com`,
      reviewerEmail: qaEmail || `qa.payroll.reviewer+${batchId}@example.com`,
      defaultPayDay: 25,
      payFrequency: 'monthly',
      defaultDepartment: 'QA Operations',
      workingDaysPerMonth: 22,
      employerContributionAssumption: 'country_pack',
      setupSavedAt: new Date().toISOString(),
      setupSavedMode: 'account',
      status: 'active',
    },
    run: {
      companyName,
      payPeriod: '2026-05',
      payDate: '2026-05-25',
      defaultCountry: 'NG',
      defaultCurrency: 'NGN',
      languageLane: 'en',
      runStatus: 'draft',
      runKey: `${batchId}-payroll-run`,
      lastCalculatedAt: new Date().toISOString(),
      brand: { accent: '#1d4ed8', qa_batch_id: batchId },
      workflow: { approvalStatus: 'not_requested', approvalState: 'draft', exportedCount: 0 },
      employees,
      rows,
      summary: {
        reviewRows: 0,
        totals: {
          gross: rows.reduce((sum, row) => sum + row.gross, 0),
          netPay: rows.reduce((sum, row) => sum + row.calc.netPay, 0),
          qa_batch_id: batchId,
        },
      },
    },
  };
}

function pickClientId(response) {
  return response && (
    response.client && (response.client.cloudClientId || response.client.clientId || response.client.id) ||
    response.company && response.company.client_id ||
    response.client_id
  );
}

function pickCompanyId(response) {
  return response && (
    response.client && (response.client.cloudCompanyId || response.client.companyId) ||
    response.company && response.company.id ||
    response.company_id
  );
}

async function runCreateStages() {
  if (dryRun && !qaUserId && !qaEmail) {
    logStep('safe QA identity', 'WARN', 'set AFROPAYROLL_QA_USER_ID or AFROPAYROLL_QA_EMAIL before live mode');
  } else {
    assertSafeIdentity();
  }
  const fixture = buildFixture();
  localApiContractCheck();
  logStep('fixture tag', dryRun ? 'DRY-RUN' : 'LIVE', fixture.tag);

  const clientResponse = await apiRequest('POST', 'save_client', {
    client: fixture.client,
    languageLane: 'en',
  });
  const clientId = dryRun ? 'dry-run-client-id' : pickClientId(clientResponse);
  const companyId = dryRun ? 'dry-run-company-id' : pickCompanyId(clientResponse);
  if (!clientId || !companyId) throw new Error('save_client did not return client and company ids.');

  const savedEmployees = [];
  for (const employee of fixture.run.employees) {
    const result = await apiRequest('POST', 'save_employee', {
      client_id: clientId,
      company_id: companyId,
      employee,
      event_type: 'employee_create',
    });
    const saved = result && result.employee;
    savedEmployees.push(saved || { id: employee.id, cloudEmployeeId: `dry-run-${employee.id}` });
  }

  const runPayload = Object.assign({}, fixture.run, {
    client: Object.assign({}, fixture.client, { clientId, companyId }),
    employees: fixture.run.employees.map((employee, index) => Object.assign({}, employee, {
      cloudEmployeeId: savedEmployees[index] && (savedEmployees[index].cloudEmployeeId || savedEmployees[index].id) || '',
    })),
  });
  const runResponse = await apiRequest('POST', 'save_run', { run: runPayload });
  const runId = dryRun ? 'dry-run-run-id' : runResponse && runResponse.run && runResponse.run.id;
  if (!runId) throw new Error('save_run did not return run id.');

  await apiRequest('GET', 'load', null, { run_id: runId });
  await apiRequest('POST', 'add_comment', { run_id: runId, comment: `${fixture.tag} QA reviewer comment. No real payroll data.` });
  await apiRequest('POST', 'request_approval', { run_id: runId, note: `${fixture.tag} QA request review.` });
  await apiRequest('POST', 'approve_run', { run_id: runId, note: `${fixture.tag} QA approval note.` });
  await apiRequest('POST', 'finalize_run', { run_id: runId, note: `${fixture.tag} QA finalization note.` });
  await apiRequest('POST', 'generate_payslips', { run_id: runId, brand: { qa_batch_id: batchId } });
  await apiRequest('POST', 'generate_statutory_packs', {
    run_id: runId,
    pack_version: `${batchId}-review-pack`,
    packs: [
      {
        country_code: 'NG',
        country_name: 'Nigeria',
        readiness: [{ level: 'ok', message: `${fixture.tag} QA readiness only.` }],
        source_links: [{ label: 'QA fixture source placeholder', url: 'https://example.com/afropayroll-qa' }],
      },
      {
        country_code: 'KE',
        country_name: 'Kenya',
        readiness: [{ level: 'ok', message: `${fixture.tag} QA readiness only.` }],
        source_links: [{ label: 'QA fixture source placeholder', url: 'https://example.com/afropayroll-qa' }],
      },
    ],
  });
  await apiRequest('POST', 'record_export', {
    run_id: runId,
    export_type: 'country_currency_payment_csv',
    file_name: `afropayroll-${batchId}-payment-handoff.csv`,
    row_count: fixture.run.rows.length,
    mark_exported: false,
    metadata: { qa_batch_id: batchId, fixture: true, no_funds_moved: true },
  });
  await apiRequest('POST', 'record_export', {
    run_id: runId,
    export_type: 'accounting_journal_csv',
    file_name: `afropayroll-${batchId}-accounting-journal.csv`,
    row_count: fixture.run.rows.length * 4,
    mark_exported: true,
    metadata: { qa_batch_id: batchId, fixture: true, no_accounting_post: true },
  });
  const employeeForInvite = dryRun ? 'dry-run-employee-id' : savedEmployees[0] && (savedEmployees[0].cloudEmployeeId || savedEmployees[0].id);
  if (employeeForInvite) {
    await apiRequest('POST', 'create_employee_portal_invite', {
      run_id: runId,
      employee_id: employeeForInvite,
      email: `qa.payroll.portal+${batchId}@example.com`,
    });
  } else {
    logStep('create employee portal invite', 'SKIP', 'no synced employee id returned');
  }
  await apiRequest('GET', 'audit', null, { run_id: runId });
  logStep('fixture complete', dryRun ? 'DRY-RUN' : 'PASS', `qa_batch_id=${batchId}`);
  return { batchId, clientId, companyId, runId };
}

async function selectTaggedIds() {
  if (!batchId) throw new Error('Cleanup refuses to run without AFROPAYROLL_QA_BATCH_ID or --batch.');
  const clientNameFilter = `name=like.*${encodeURIComponent(`[AFROPAYROLL_QA:${batchId}]`)}*`;
  const runKeyFilter = `run_key=eq.${encodeURIComponent(`${batchId}-payroll-run`)}`;
  const employeeFilter = `external_ref=like.${encodeURIComponent(`${batchId}-%`)}`;
  const clients = await restRequest('GET', 'payroll_clients', `${clientNameFilter}&select=id,name`, null);
  const runs = await restRequest('GET', 'payroll_runs', `${runKeyFilter}&select=id,client_id,company_id,run_key,title`, null);
  const employees = await restRequest('GET', 'payroll_employees', `${employeeFilter}&select=id,client_id,company_id,external_ref,employee_code`, null);
  const clientIds = unique(clients.map((row) => row.id).concat(runs.map((row) => row.client_id), employees.map((row) => row.client_id)).filter(Boolean));
  const companyIds = unique(runs.map((row) => row.company_id).concat(employees.map((row) => row.company_id)).filter(Boolean));
  const runIds = unique(runs.map((row) => row.id).filter(Boolean));
  return { clients, runs, employees, clientIds, companyIds, runIds };
}

function unique(values) {
  return Array.from(new Set(values));
}

function inFilter(ids) {
  return `in.(${ids.map(encodeURIComponent).join(',')})`;
}

async function deleteWhere(table, filter, label) {
  if (!filter) {
    logStep(label || table, 'SKIP', 'no tagged ids found');
    return [];
  }
  if (dryRun) {
    const rows = await restRequest('GET', table, `${filter}&select=id`, null);
    logStep(label || table, 'DRY-RUN', `would delete ${rows.length} row(s)`);
    return rows;
  }
  const rows = await restRequest('DELETE', table, filter, null);
  logStep(label || table, 'PASS', `deleted ${rows.length} row(s)`);
  return rows;
}

async function runCleanup() {
  if (!args.batchId && !process.env.AFROPAYROLL_QA_BATCH_ID && mode === 'cleanup') {
    throw new Error('Cleanup refuses to run without AFROPAYROLL_QA_BATCH_ID or --batch.');
  }
  const tagged = await selectTaggedIds();
  const runFilter = tagged.runIds.length ? `run_id=${inFilter(tagged.runIds)}` : '';
  const clientFilter = tagged.clientIds.length ? `client_id=${inFilter(tagged.clientIds)}` : '';
  const companyFilter = tagged.companyIds.length ? `company_id=${inFilter(tagged.companyIds)}` : '';
  const employeeIdFilter = tagged.employees.length ? `employee_id=${inFilter(tagged.employees.map((row) => row.id))}` : '';

  logStep('cleanup batch', dryRun ? 'DRY-RUN' : 'LIVE', batchId);
  await deleteWhere('payroll_employee_portal_invites', runFilter || employeeIdFilter, 'portal invites');
  await deleteWhere('payroll_exports', `metadata->>qa_batch_id=eq.${encodeURIComponent(batchId)}`, 'tagged exports');
  await deleteWhere('payroll_statutory_packs', runFilter, 'statutory packs');
  await deleteWhere('payroll_payslips', runFilter, 'payslips');
  await deleteWhere('payroll_workspace_comments', runFilter, 'workspace comments');
  await deleteWhere('payroll_approvals', runFilter, 'approvals');
  await deleteWhere('payroll_run_rows', runFilter, 'run rows');
  await deleteWhere('payroll_runs', tagged.runIds.length ? `id=${inFilter(tagged.runIds)}` : '', 'runs');
  await deleteWhere('payroll_audit_events', clientFilter, 'audit events');
  await deleteWhere('payroll_employees', tagged.employees.length ? `id=${inFilter(tagged.employees.map((row) => row.id))}` : '', 'employees');
  await deleteWhere('payroll_companies', companyFilter, 'companies');
  await deleteWhere('payroll_clients', tagged.clientIds.length ? `id=${inFilter(tagged.clientIds)}` : '', 'clients');
  logStep('cleanup complete', dryRun ? 'DRY-RUN' : 'PASS', `qa_batch_id=${batchId}`);
}

async function main() {
  console.log(`AfroPayroll Pro QA fixture harness`);
  console.log(`mode=${mode} dry_run=${dryRun ? 'yes' : 'no'} base_url=${baseUrl} qa_batch_id=${batchId}`);
  if (!dryRun) assertSafeIdentity();
  if (mode === 'schema') {
    localApiContractCheck();
    return;
  }
  if (mode === 'cleanup') {
    await runCleanup();
    return;
  }
  await runCreateStages();
  if (mode === 'cycle') {
    await runCleanup();
  }
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
});
