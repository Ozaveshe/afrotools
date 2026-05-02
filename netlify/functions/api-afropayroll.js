/**
 * AfroPayroll Pro API
 *
 * GET    /api/afropayroll?action=dashboard
 * GET    /api/afropayroll?action=list
 * GET    /api/afropayroll?action=load&run_id=<uuid>
 * GET    /api/afropayroll?action=audit&run_id=<uuid>
 * GET    /api/afropayroll?action=roles&run_id=<uuid>
 * POST   /api/afropayroll { action: "save_run", run: {...} }
 * POST   /api/afropayroll { action: "request_approval" | "approve_run" | "reject_run", run_id: <uuid> }
 * POST   /api/afropayroll { action: "generate_payslips" | "generate_statutory_packs" | "record_export" | "record_import", run_id: <uuid> }
 * POST   /api/afropayroll { action: "invite_member", run_id: <uuid>, email: "...", role: "..." }
 * DELETE /api/afropayroll?run_id=<uuid>
 *
 * Auth is verified with the user's Supabase access token or secure session
 * cookie. Writes use the service role key, so this function must enforce
 * payroll access rules before returning or mutating salary-sensitive rows.
 */

const { getAllowedOrigin } = require('./utils/cors');
const { getUserFromEvent } = require('./_shared/browser-session-auth');

const SUPABASE_AUTH_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const MAX_ROWS = 500;
const MAX_PAYLOAD_BYTES = 900000;
const VIEW_PAYROLL_ROLES = ['owner', 'admin', 'payroll_admin', 'accountant', 'approver'];
const EDIT_PAYROLL_ROLES = ['owner', 'admin', 'payroll_admin', 'accountant'];
const APPROVE_PAYROLL_ROLES = ['owner', 'admin', 'accountant', 'approver'];
const MANAGE_MEMBER_ROLES = ['owner', 'admin', 'payroll_admin'];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Content-Type': 'application/json',
  Vary: 'Origin',
};

function jsonResponse(statusCode, body, responseMeta) {
  var meta = responseMeta || {};
  var response = {
    statusCode: statusCode,
    headers: Object.assign({}, CORS_HEADERS, meta.headers || {}),
    body: JSON.stringify(body),
  };

  if (meta.multiValueHeaders && Object.keys(meta.multiValueHeaders).length) {
    response.multiValueHeaders = meta.multiValueHeaders;
  }

  return response;
}

function serviceHeaders(extra) {
  var serviceKey = process.env.SUPABASE_AUTH_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return null;
  return Object.assign({
    apikey: serviceKey,
    Authorization: 'Bearer ' + serviceKey,
    'Content-Type': 'application/json',
  }, extra || {});
}

async function supabaseRequest(path, options) {
  var headers = serviceHeaders(options && options.headers);
  if (!headers) {
    return { ok: false, status: 500, data: null, text: 'Missing Supabase service key' };
  }

  var response = await fetch(SUPABASE_AUTH_URL + path, {
    method: options && options.method || 'GET',
    headers: headers,
    body: options && options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  var text = await response.text();
  var data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = text || null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data: data,
    text: text,
  };
}

function qs(params) {
  return Object.keys(params).map(function (key) {
    return key + '=' + encodeURIComponent(params[key]);
  }).join('&');
}

function sanitizeText(value, maxLength) {
  if (value === null || value === undefined) return '';
  var text = String(value).trim();
  if (!text) return '';
  return text.slice(0, maxLength);
}

function toNumber(value) {
  var number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function money(value) {
  return Math.round(Math.max(0, toNumber(value)) * 100) / 100;
}

function clampInteger(value, fallback, min, max) {
  var number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function safeJson(value, fallback) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  return fallback;
}

function slugify(value) {
  var slug = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'run';
}

function normalizeCountry(value, fallback) {
  var country = sanitizeText(value, 8).toUpperCase();
  return country || fallback || 'NG';
}

function normalizeCurrency(value) {
  return sanitizeText(value, 8).toUpperCase();
}

function normalizeLanguage(value) {
  var lang = sanitizeText(value, 4).toLowerCase();
  return ['en', 'fr', 'sw'].includes(lang) ? lang : 'en';
}

function normalizeMonth(value) {
  var text = sanitizeText(value, 10);
  return /^\d{4}-\d{2}$/.test(text) ? text : '';
}

function normalizeDate(value) {
  var text = sanitizeText(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function periodStart(month) {
  return month ? month + '-01' : null;
}

function periodEnd(month) {
  if (!month) return null;
  var parts = month.split('-');
  var year = Number(parts[0]);
  var zeroBasedMonth = Number(parts[1]);
  if (!year || !zeroBasedMonth) return null;
  var date = new Date(Date.UTC(year, zeroBasedMonth, 0));
  return date.toISOString().slice(0, 10);
}

function mapRunStatus(value) {
  var status = sanitizeText(value, 32);
  if (status === 'review') return 'needs_review';
  if (status === 'ready') return 'ready';
  if (['draft', 'needs_review', 'approval_requested', 'approved', 'exported', 'closed', 'archived'].includes(status)) {
    return status;
  }
  return 'draft';
}

function mapRunStatusToWorkspace(value) {
  if (value === 'needs_review' || value === 'approval_requested') return 'review';
  if (value === 'ready' || value === 'approved' || value === 'exported' || value === 'closed') return 'ready';
  return 'draft';
}

function rowStatusFromCalc(calc) {
  var status = sanitizeText(calc && calc.status, 32);
  if (status === 'full_pack' && calc && calc.hasEngine) return 'ready';
  return 'needs_review';
}

function warningLevel(calc) {
  var status = sanitizeText(calc && calc.status, 32);
  if (status === 'next_pack' || status === 'needs_verification') return 'critical';
  if (status === 'estimate_mode' || (status === 'full_pack' && !(calc && calc.hasEngine))) return 'warning';
  return calc && calc.warning ? 'info' : 'none';
}

function calculationMode(calc) {
  if (calc && calc.hasEngine) return 'engine';
  if (calc && calc.status === 'estimate_mode') return 'estimate';
  if (calc && (calc.status === 'next_pack' || calc.status === 'needs_verification')) return 'manual';
  return 'manual';
}

function payloadSizeBytes(payload) {
  try {
    return Buffer.byteLength(JSON.stringify(payload), 'utf8');
  } catch (error) {
    return Infinity;
  }
}

function activeRows(rows) {
  return (Array.isArray(rows) ? rows : []).filter(function (row) {
    if (!row) return false;
    return Boolean(
      sanitizeText(row.name, 2) ||
      sanitizeText(row.role || row.department, 2) ||
      toNumber(row.gross) ||
      toNumber(row.allowances) ||
      toNumber(row.overtime) ||
      toNumber(row.unpaidDays) ||
      toNumber(row.unpaidAmount) ||
      toNumber(row.customDeductions)
    );
  }).slice(0, MAX_ROWS);
}

function normalizeRun(bodyRun, user) {
  var run = safeJson(bodyRun, {});
  var companyName = sanitizeText(run.companyName, 180) || 'Untitled company';
  var payPeriod = normalizeMonth(run.payPeriod);
  var defaultCountry = normalizeCountry(run.defaultCountry, 'NG');
  var rows = activeRows(run.rows);
  var rowCount = rows.length;
  var summary = safeJson(run.summary, {});
  var runKey = sanitizeText(run.runKey, 140) || [
    slugify(companyName),
    payPeriod || 'period',
    slugify(user.id).slice(0, 12)
  ].join('-');

  return {
    companyName: companyName,
    payPeriod: payPeriod,
    payDate: normalizeDate(run.payDate),
    defaultCountry: defaultCountry,
    defaultCurrency: normalizeCurrency(run.defaultCurrency),
    languageLane: normalizeLanguage(run.languageLane),
    runStatus: mapRunStatus(run.runStatus),
    runKey: runKey,
    lastCalculatedAt: sanitizeText(run.lastCalculatedAt, 40),
    brand: safeJson(run.brand || run.branding, {}),
    workflow: safeJson(run.workflow, {}),
    rows: rows,
    rowCount: rowCount,
    summary: summary,
  };
}

async function requireUser(event) {
  var authResult = await getUserFromEvent(event);
  return {
    user: authResult && authResult.user ? authResult.user : null,
    sessionResponse: authResult && authResult.sessionResponse ? authResult.sessionResponse : null,
  };
}

async function getOwnedClient(user, run) {
  var selectPath = '/rest/v1/payroll_clients?' + qs({
    owner_id: 'eq.' + user.id,
    status: 'eq.active',
    select: 'id,name,default_country,default_currency,language_lane,created_at',
    order: 'created_at.asc',
    limit: '1',
  });
  var existing = await supabaseRequest(selectPath);
  if (!existing.ok) throw new Error('Client lookup failed: ' + existing.text);
  if (Array.isArray(existing.data) && existing.data[0]) return existing.data[0];

  var clientName = 'AfroPayroll workspace';
  if (user.email) clientName = 'AfroPayroll workspace - ' + user.email;
  var created = await supabaseRequest('/rest/v1/payroll_clients', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: {
      owner_id: user.id,
      name: clientName,
      client_type: 'company',
      default_country: run.defaultCountry,
      default_currency: run.defaultCurrency || null,
      language_lane: run.languageLane,
      settings: { created_from: 'afropayroll_workspace' },
    },
  });
  if (!created.ok) throw new Error('Client create failed: ' + created.text);
  return Array.isArray(created.data) ? created.data[0] : created.data;
}

async function getAccessRecord(user, clientId) {
  var clientResult = await supabaseRequest('/rest/v1/payroll_clients?' + qs({
    id: 'eq.' + clientId,
    select: 'id,owner_id,name',
    limit: '1',
  }));
  if (!clientResult.ok) throw new Error('Client access lookup failed: ' + clientResult.text);
  var client = Array.isArray(clientResult.data) ? clientResult.data[0] : null;
  if (client && client.owner_id === user.id) {
    return { client: client, role: 'owner' };
  }

  var membershipResult = await supabaseRequest('/rest/v1/payroll_memberships?' + qs({
    client_id: 'eq.' + clientId,
    user_id: 'eq.' + user.id,
    status: 'eq.active',
    select: 'role,client_id',
    order: 'created_at.asc',
    limit: '1',
  }));
  if (!membershipResult.ok) throw new Error('Membership lookup failed: ' + membershipResult.text);
  var membership = Array.isArray(membershipResult.data) ? membershipResult.data[0] : null;
  return membership ? { client: client, role: membership.role } : null;
}

async function listAccessibleClientIds(user) {
  var ownerResult = await supabaseRequest('/rest/v1/payroll_clients?' + qs({
    owner_id: 'eq.' + user.id,
    select: 'id',
  }));
  if (!ownerResult.ok) throw new Error('Client list failed: ' + ownerResult.text);

  var membershipResult = await supabaseRequest('/rest/v1/payroll_memberships?' + qs({
    user_id: 'eq.' + user.id,
    status: 'eq.active',
    select: 'client_id,role',
  }));
  if (!membershipResult.ok) throw new Error('Membership list failed: ' + membershipResult.text);

  var ids = new Set();
  (Array.isArray(ownerResult.data) ? ownerResult.data : []).forEach(function (row) {
    if (row.id) ids.add(row.id);
  });
  (Array.isArray(membershipResult.data) ? membershipResult.data : []).forEach(function (row) {
    if (row.client_id && VIEW_PAYROLL_ROLES.includes(row.role)) ids.add(row.client_id);
  });
  return Array.from(ids);
}

async function getRunWithAccess(user, runId, allowedRoles) {
  if (!isUuid(runId)) return null;
  var runResult = await supabaseRequest('/rest/v1/payroll_runs?' + qs({
    id: 'eq.' + runId,
    select: 'id,client_id,company_id,run_key,title,pay_period_start,pay_period_end,pay_date,default_country,default_currency,language_lane,status,approval_status,source_mode,totals,engine_snapshot,warnings_count,ready_count,review_count,exported_count,branding,created_at,updated_at',
    limit: '1',
  }));
  if (!runResult.ok) throw new Error('Run lookup failed: ' + runResult.text);
  var run = Array.isArray(runResult.data) ? runResult.data[0] : null;
  if (!run) return null;

  var access = await getAccessRecord(user, run.client_id);
  if (!access || !allowedRoles.includes(access.role)) {
    return { denied: true, run: run, access: access };
  }
  return { denied: false, run: run, access: access };
}

async function ensureCompany(client, run, user) {
  var companyResult = await supabaseRequest('/rest/v1/payroll_companies?' + qs({
    client_id: 'eq.' + client.id,
    legal_name: 'eq.' + run.companyName,
    country_code: 'eq.' + run.defaultCountry,
    status: 'eq.active',
    select: 'id,legal_name,country_code,currency_code',
    order: 'created_at.asc',
    limit: '1',
  }));
  if (!companyResult.ok) throw new Error('Company lookup failed: ' + companyResult.text);
  if (Array.isArray(companyResult.data) && companyResult.data[0]) return companyResult.data[0];

  var created = await supabaseRequest('/rest/v1/payroll_companies', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: {
      client_id: client.id,
      legal_name: run.companyName,
      country_code: run.defaultCountry,
      currency_code: run.defaultCurrency || null,
      status: 'active',
      created_by: user.id,
      updated_by: user.id,
      payroll_settings: { source: 'afropayroll_workspace' },
    },
  });
  if (!created.ok) throw new Error('Company create failed: ' + created.text);
  return Array.isArray(created.data) ? created.data[0] : created.data;
}

function buildRunPayload(client, company, run, user) {
  var summary = run.summary || {};
  return {
    client_id: client.id,
    company_id: company.id,
    run_key: run.runKey,
    title: (run.companyName || 'Payroll run') + (run.payPeriod ? ' - ' + run.payPeriod : ''),
    pay_period_start: periodStart(run.payPeriod),
    pay_period_end: periodEnd(run.payPeriod),
    pay_date: run.payDate,
    default_country: run.defaultCountry,
    default_currency: run.defaultCurrency || company.currency_code || null,
    language_lane: run.languageLane,
    status: run.runStatus,
    approval_status: 'not_requested',
    source_mode: 'workspace_sync',
    totals: safeJson(summary.totals, {}),
    engine_snapshot: {
      source: 'browser_preview',
      last_calculated_at: run.lastCalculatedAt || null,
      row_count: run.rowCount,
    },
    warnings_count: clampInteger(summary.reviewRows, 0, 0, MAX_ROWS),
    ready_count: Math.max(0, run.rowCount - clampInteger(summary.reviewRows, 0, 0, MAX_ROWS)),
    review_count: clampInteger(summary.reviewRows, 0, 0, MAX_ROWS),
    exported_count: 0,
    branding: safeJson(run.brand, {}),
    created_by: user.id,
    updated_by: user.id,
  };
}

function buildRowPayload(client, runRecord, run, user, row, index) {
  var calc = safeJson(row.calc, {});
  var packStatus = sanitizeText(calc.status || row.countryPackStatus, 32) || 'unknown';
  var country = normalizeCountry(row.country, run.defaultCountry);
  var currency = normalizeCurrency(calc.currency || row.currency);

  return {
    client_id: client.id,
    run_id: runRecord.id,
    employee_id: null,
    row_position: index,
    employee_name: sanitizeText(row.name, 180) || 'Unnamed employee',
    role_title: sanitizeText(row.role, 140) || null,
    department: sanitizeText(row.department, 120) || null,
    country_code: country,
    currency_code: currency || null,
    gross_pay: money(row.gross),
    allowances: money(row.allowances),
    overtime_pay: money(row.overtime),
    unpaid_days: Math.round(Math.max(0, toNumber(row.unpaidDays)) * 100) / 100,
    unpaid_amount: money(row.unpaidAmount || calc.unpaid),
    custom_deductions: money(row.customDeductions),
    preview_gross: money(calc.previewGross),
    employee_deductions: money(calc.employeeDeductions),
    employer_cost: money(calc.employerCost || calc.previewGross),
    net_pay: money(calc.netPay),
    calculation_mode: calculationMode(calc),
    country_pack_status: ['full_pack', 'estimate_mode', 'next_pack', 'unknown'].includes(packStatus) ? packStatus : 'unknown',
    engine_key: calc.hasEngine ? country + '_browser_preview' : null,
    warning_level: warningLevel(calc),
    warning_text: sanitizeText(calc.warning, 1200) || null,
    row_status: rowStatusFromCalc(calc),
    line_payload: {
      local_row_id: sanitizeText(row.id, 120),
      source: 'afropayroll_workspace',
    },
    calculation_snapshot: calc,
    created_by: user.id,
    updated_by: user.id,
  };
}

async function audit(clientId, user, action, entityType, entityId, summary, afterState) {
  var payload = {
    client_id: clientId,
    actor_id: user.id,
    action: action,
    entity_type: entityType,
    entity_id: entityId || null,
    summary: sanitizeText(summary, 320),
    after_state: afterState || {},
    request_meta: { source: 'api-afropayroll' },
  };
  if (entityType === 'payroll_runs' && isUuid(entityId)) payload.run_id = entityId;
  if (afterState && isUuid(afterState.run_id)) payload.run_id = afterState.run_id;
  if (afterState && isUuid(afterState.company_id)) payload.company_id = afterState.company_id;

  await supabaseRequest('/rest/v1/payroll_audit_events', {
    method: 'POST',
    body: payload,
  });
}

async function handleList(user, params) {
  var clientIds = await listAccessibleClientIds(user);
  if (!clientIds.length) return { runs: [] };

  var limit = clampInteger(params.limit, 30, 1, 100);
  var path = '/rest/v1/payroll_run_dashboard?' + qs({
    client_id: 'in.(' + clientIds.join(',') + ')',
    select: 'run_id,client_id,company_id,company_name,title,pay_period_start,pay_period_end,pay_date,status,approval_status,row_count,ready_count,needs_review_count,exported_count,warning_count,currency_codes,pack_statuses,updated_at',
    order: 'updated_at.desc',
    limit: String(limit),
  });
  var result = await supabaseRequest(path);
  if (!result.ok) throw new Error('Run list failed: ' + result.text);
  return { runs: Array.isArray(result.data) ? result.data : [] };
}

function dashboardFromRuns(runs) {
  var summary = {
    run_count: runs.length,
    ready_runs: 0,
    needs_review_runs: 0,
    approval_runs: 0,
    exported_runs: 0,
    total_rows: 0,
    ready_rows: 0,
    needs_review_rows: 0,
    exported_rows: 0,
    warning_rows: 0,
  };
  runs.forEach(function (run) {
    var status = sanitizeText(run.status, 32);
    if (status === 'ready' || status === 'approved') summary.ready_runs += 1;
    if (status === 'needs_review') summary.needs_review_runs += 1;
    if (status === 'approval_requested' || run.approval_status === 'pending') summary.approval_runs += 1;
    if (status === 'exported' || status === 'closed') summary.exported_runs += 1;
    summary.total_rows += clampInteger(run.row_count, 0, 0, 100000);
    summary.ready_rows += clampInteger(run.ready_count, 0, 0, 100000);
    summary.needs_review_rows += clampInteger(run.needs_review_count, 0, 0, 100000);
    summary.exported_rows += clampInteger(run.exported_count, 0, 0, 100000);
    summary.warning_rows += clampInteger(run.warning_count, 0, 0, 100000);
  });
  return summary;
}

async function handleDashboard(user, params) {
  var list = await handleList(user, Object.assign({}, params || {}, { limit: params && params.limit || 100 }));
  return {
    runs: list.runs,
    dashboard: dashboardFromRuns(list.runs),
  };
}

async function listRunRows(runId) {
  var rowsResult = await supabaseRequest('/rest/v1/payroll_run_rows?' + qs({
    run_id: 'eq.' + runId,
    select: 'id,row_position,employee_name,role_title,department,country_code,currency_code,gross_pay,allowances,overtime_pay,unpaid_days,unpaid_amount,custom_deductions,preview_gross,employee_deductions,employer_cost,net_pay,calculation_mode,country_pack_status,engine_key,warning_level,warning_text,row_status,line_payload,calculation_snapshot,updated_at',
    order: 'row_position.asc',
    limit: String(MAX_ROWS),
  }));
  if (!rowsResult.ok) throw new Error('Run rows load failed: ' + rowsResult.text);
  return Array.isArray(rowsResult.data) ? rowsResult.data : [];
}

function normalizeRunId(body) {
  return sanitizeText(body && (body.run_id || body.runId || body.cloudRunId), 80);
}

function periodLabel(run) {
  if (run && run.pay_period_start) return String(run.pay_period_start).slice(0, 7);
  if (run && run.pay_period_end) return String(run.pay_period_end).slice(0, 7);
  return new Date().toISOString().slice(0, 7);
}

async function requireRunAccess(user, runId, roles, message) {
  var accessResult = await getRunWithAccess(user, runId, roles);
  if (!accessResult) return { statusCode: 404, body: { error: 'Run not found' } };
  if (accessResult.denied) return { statusCode: 403, body: { error: message || 'Not allowed for this payroll run' } };
  return { statusCode: 200, accessResult: accessResult };
}

async function handleAudit(user, runId) {
  var checked = await requireRunAccess(user, runId, VIEW_PAYROLL_ROLES, 'Not allowed to view this payroll audit trail');
  if (checked.statusCode !== 200) return checked;
  var run = checked.accessResult.run;
  var result = await supabaseRequest('/rest/v1/payroll_audit_events?' + qs({
    client_id: 'eq.' + run.client_id,
    select: 'id,action,entity_type,entity_id,run_id,summary,after_state,created_at',
    order: 'created_at.desc',
    limit: '80',
  }));
  if (!result.ok) throw new Error('Audit load failed: ' + result.text);
  var events = (Array.isArray(result.data) ? result.data : []).filter(function (event) {
    return event.run_id === run.id || event.entity_id === run.id || (event.after_state && event.after_state.run_id === run.id);
  }).slice(0, 30);
  return { statusCode: 200, body: { events: events } };
}

async function handleRoles(user, runId) {
  var clientId = '';
  var currentRole = 'owner';
  if (runId) {
    var checked = await requireRunAccess(user, runId, VIEW_PAYROLL_ROLES, 'Not allowed to view workspace roles');
    if (checked.statusCode !== 200) return checked;
    clientId = checked.accessResult.run.client_id;
    currentRole = checked.accessResult.access && checked.accessResult.access.role || currentRole;
  } else {
    var client = await getOwnedClient(user, { defaultCountry: 'NG', defaultCurrency: null, languageLane: 'en' });
    clientId = client.id;
  }

  var permissionsResult = await supabaseRequest('/rest/v1/payroll_role_permissions?' + qs({
    select: 'role,description,permissions,can_view_salary_data,can_edit_salary_data,can_approve_runs,can_manage_members',
    order: 'role.asc',
  }));
  if (!permissionsResult.ok) throw new Error('Role permissions load failed: ' + permissionsResult.text);

  var membersResult = await supabaseRequest('/rest/v1/payroll_memberships?' + qs({
    client_id: 'eq.' + clientId,
    select: 'id,user_id,invited_email,role,status,created_at,updated_at',
    order: 'created_at.asc',
    limit: '100',
  }));
  if (!membersResult.ok) throw new Error('Members load failed: ' + membersResult.text);
  return {
    statusCode: 200,
    body: {
      client_id: clientId,
      current_role: currentRole,
      role_permissions: Array.isArray(permissionsResult.data) ? permissionsResult.data : [],
      members: Array.isArray(membersResult.data) ? membersResult.data : [],
    },
  };
}

async function handleInviteMember(user, body) {
  var runId = normalizeRunId(body);
  var clientId = sanitizeText(body && (body.client_id || body.clientId), 80);
  var access = null;
  if (runId) {
    var checked = await requireRunAccess(user, runId, MANAGE_MEMBER_ROLES, 'Not allowed to invite payroll members');
    if (checked.statusCode !== 200) return checked;
    clientId = checked.accessResult.run.client_id;
    access = checked.accessResult.access;
  } else {
    var client = await getOwnedClient(user, { defaultCountry: 'NG', defaultCurrency: null, languageLane: 'en' });
    clientId = client.id;
    access = await getAccessRecord(user, clientId);
    if (!access || !MANAGE_MEMBER_ROLES.includes(access.role)) {
      return { statusCode: 403, body: { error: 'Not allowed to invite payroll members' } };
    }
  }
  var email = sanitizeText(body && body.email, 180).toLowerCase();
  var role = sanitizeText(body && body.role, 32);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: { error: 'Valid invited email is required' } };
  }
  if (!['admin', 'payroll_admin', 'accountant', 'approver', 'viewer'].includes(role)) {
    return { statusCode: 400, body: { error: 'Unsupported payroll role' } };
  }

  var created = await supabaseRequest('/rest/v1/payroll_memberships', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: {
      client_id: clientId,
      invited_email: email,
      invited_by: user.id,
      role: role,
      status: 'invited',
      permissions_override: {},
    },
  });
  if (!created.ok) throw new Error('Member invite failed: ' + created.text);
  var member = Array.isArray(created.data) ? created.data[0] : created.data;
  await audit(clientId, user, 'invite_member', 'payroll_memberships', member && member.id, 'Invited payroll workspace member', {
    invited_email: email,
    role: role,
    access_role: access && access.role,
  });
  return { statusCode: 200, body: { invited: true, member: member } };
}

async function handleApprovalRequest(user, body) {
  var runId = normalizeRunId(body);
  var checked = await requireRunAccess(user, runId, EDIT_PAYROLL_ROLES, 'Not allowed to request payroll approval');
  if (checked.statusCode !== 200) return checked;
  var run = checked.accessResult.run;
  var note = sanitizeText(body && body.note, 1000);
  var approvalResult = await supabaseRequest('/rest/v1/payroll_approvals', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: {
      client_id: run.client_id,
      run_id: run.id,
      requested_by: user.id,
      step_label: sanitizeText(body && body.step_label, 120) || 'Payroll review',
      status: 'pending',
      note: note || null,
    },
  });
  if (!approvalResult.ok) throw new Error('Approval request failed: ' + approvalResult.text);

  var updateResult = await supabaseRequest('/rest/v1/payroll_runs?id=eq.' + encodeURIComponent(run.id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: {
      status: 'approval_requested',
      approval_status: 'pending',
      updated_by: user.id,
    },
  });
  if (!updateResult.ok) throw new Error('Run approval status update failed: ' + updateResult.text);
  await audit(run.client_id, user, 'request_approval', 'payroll_runs', run.id, 'Requested payroll run approval', {
    run_id: run.id,
    note: note,
  });
  return {
    statusCode: 200,
    body: {
      approval: Array.isArray(approvalResult.data) ? approvalResult.data[0] : approvalResult.data,
      run: Array.isArray(updateResult.data) ? updateResult.data[0] : updateResult.data,
    },
  };
}

async function handleApprovalDecision(user, body, decision) {
  var runId = normalizeRunId(body);
  var checked = await requireRunAccess(user, runId, APPROVE_PAYROLL_ROLES, 'Not allowed to approve this payroll run');
  if (checked.statusCode !== 200) return checked;
  var run = checked.accessResult.run;
  var note = sanitizeText(body && body.note, 1000);
  var status = decision === 'approved' ? 'approved' : 'rejected';
  var runStatus = decision === 'approved' ? 'approved' : 'needs_review';

  var approvalResult = await supabaseRequest('/rest/v1/payroll_approvals?run_id=eq.' + encodeURIComponent(run.id) + '&status=eq.pending', {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: {
      status: status,
      assigned_to: user.id,
      note: note || null,
      acted_at: new Date().toISOString(),
    },
  });
  if (!approvalResult.ok) throw new Error('Approval decision failed: ' + approvalResult.text);

  var updateResult = await supabaseRequest('/rest/v1/payroll_runs?id=eq.' + encodeURIComponent(run.id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: {
      status: runStatus,
      approval_status: status,
      approved_by: decision === 'approved' ? user.id : null,
      approved_at: decision === 'approved' ? new Date().toISOString() : null,
      updated_by: user.id,
    },
  });
  if (!updateResult.ok) throw new Error('Run approval decision update failed: ' + updateResult.text);
  await audit(run.client_id, user, decision === 'approved' ? 'approve_run' : 'reject_run', 'payroll_runs', run.id, 'Recorded payroll approval decision', {
    run_id: run.id,
    decision: decision,
    note: note,
  });
  return {
    statusCode: 200,
    body: {
      decision: decision,
      approvals: Array.isArray(approvalResult.data) ? approvalResult.data : [],
      run: Array.isArray(updateResult.data) ? updateResult.data[0] : updateResult.data,
    },
  };
}

async function handleGeneratePayslips(user, body) {
  var runId = normalizeRunId(body);
  var checked = await requireRunAccess(user, runId, EDIT_PAYROLL_ROLES, 'Not allowed to generate payslips');
  if (checked.statusCode !== 200) return checked;
  var run = checked.accessResult.run;
  var rows = await listRunRows(run.id);
  if (!rows.length) return { statusCode: 400, body: { error: 'Run has no payroll rows' } };
  var brand = safeJson(body && body.brand, {});
  var period = periodLabel(run).replace(/[^0-9]/g, '') || 'period';
  var payload = rows.map(function (row, index) {
    return {
      client_id: run.client_id,
      run_id: run.id,
      row_id: row.id,
      employee_id: null,
      payslip_no: 'AP-' + period + '-' + String(index + 1).padStart(4, '0'),
      status: 'generated',
      language_lane: run.language_lane || 'en',
      template_key: sanitizeText(body && body.template_key, 80) || 'standard',
      brand_snapshot: brand,
      payload_snapshot: {
        run: {
          id: run.id,
          title: run.title,
          pay_period_start: run.pay_period_start,
          pay_period_end: run.pay_period_end,
          pay_date: run.pay_date,
        },
        row: row,
      },
      generated_by: user.id,
      generated_at: new Date().toISOString(),
    };
  });
  var result = await supabaseRequest('/rest/v1/payroll_payslips?on_conflict=' + encodeURIComponent('run_id,row_id'), {
    method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
    body: payload,
  });
  if (!result.ok) throw new Error('Payslip generation failed: ' + result.text);
  await audit(run.client_id, user, 'generate_payslips', 'payroll_runs', run.id, 'Generated payslip records for payroll run', {
    run_id: run.id,
    row_count: rows.length,
  });
  return { statusCode: 200, body: { payslips: Array.isArray(result.data) ? result.data : [], row_count: rows.length } };
}

function summarizeRowsByCountry(run, rows) {
  var countries = {};
  rows.forEach(function (row) {
    var country = normalizeCountry(row.country_code, run.default_country || 'NG');
    var currency = normalizeCurrency(row.currency_code);
    if (!countries[country]) {
      countries[country] = {
        country_code: country,
        currency_code: currency,
        row_count: 0,
        gross_pay: 0,
        preview_gross: 0,
        employee_deductions: 0,
        employer_cost: 0,
        net_pay: 0,
        custom_deductions: 0,
        warning_count: 0,
        pack_statuses: {},
      };
    }
    var bucket = countries[country];
    bucket.currency_code = bucket.currency_code || currency;
    bucket.row_count += 1;
    bucket.gross_pay += toNumber(row.gross_pay);
    bucket.preview_gross += toNumber(row.preview_gross);
    bucket.employee_deductions += toNumber(row.employee_deductions);
    bucket.employer_cost += toNumber(row.employer_cost);
    bucket.net_pay += toNumber(row.net_pay);
    bucket.custom_deductions += toNumber(row.custom_deductions);
    if (row.warning_level === 'warning' || row.warning_level === 'critical') bucket.warning_count += 1;
    bucket.pack_statuses[row.country_pack_status || 'unknown'] = true;
  });
  return countries;
}

async function handleGenerateStatutoryPacks(user, body) {
  var runId = normalizeRunId(body);
  var checked = await requireRunAccess(user, runId, EDIT_PAYROLL_ROLES, 'Not allowed to generate statutory packs');
  if (checked.statusCode !== 200) return checked;
  var run = checked.accessResult.run;
  var rows = await listRunRows(run.id);
  if (!rows.length) return { statusCode: 400, body: { error: 'Run has no payroll rows' } };
  var byCountry = summarizeRowsByCountry(run, rows);
  var packVersion = sanitizeText(body && body.pack_version, 80) || 'workspace-' + periodLabel(run);
  var payload = Object.keys(byCountry).sort().map(function (country) {
    var figures = byCountry[country];
    var warnings = figures.warning_count ? [{ level: 'warning', message: 'Rows in this country still need review before statutory use.' }] : [];
    return {
      client_id: run.client_id,
      run_id: run.id,
      country_code: country,
      currency_code: figures.currency_code || null,
      pack_version: packVersion,
      period_start: run.pay_period_start,
      period_end: run.pay_period_end,
      due_date: null,
      status: figures.warning_count ? 'needs_review' : 'ready',
      figures: figures,
      source_links: Array.isArray(body && body.source_links) ? body.source_links : [],
      warnings: warnings,
      prepared_by: user.id,
      prepared_at: new Date().toISOString(),
    };
  });
  var result = await supabaseRequest('/rest/v1/payroll_statutory_packs?on_conflict=' + encodeURIComponent('run_id,country_code,pack_version'), {
    method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
    body: payload,
  });
  if (!result.ok) throw new Error('Statutory pack generation failed: ' + result.text);
  await audit(run.client_id, user, 'generate_statutory_packs', 'payroll_runs', run.id, 'Generated country statutory pack drafts', {
    run_id: run.id,
    country_count: payload.length,
  });
  return { statusCode: 200, body: { packs: Array.isArray(result.data) ? result.data : [], country_count: payload.length } };
}

async function handleRecordExport(user, body) {
  var runId = normalizeRunId(body);
  var checked = await requireRunAccess(user, runId, EDIT_PAYROLL_ROLES, 'Not allowed to record payroll export');
  if (checked.statusCode !== 200) return checked;
  var run = checked.accessResult.run;
  var exportType = sanitizeText(body && body.export_type || body && body.exportType, 80);
  var allowed = ['roster_csv', 'payroll_summary_csv', 'review_warnings_csv', 'handoff_note_md', 'payslip_pdf', 'payslip_zip', 'statutory_pack_csv', 'statutory_pack_pdf', 'branded_packet_zip', 'other'];
  if (!allowed.includes(exportType)) exportType = 'other';
  var exportResult = await supabaseRequest('/rest/v1/payroll_exports', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: {
      client_id: run.client_id,
      run_id: run.id,
      export_type: exportType,
      file_name: sanitizeText(body && body.file_name || body && body.fileName, 240) || null,
      row_count: clampInteger(body && body.row_count || body && body.rowCount, 0, 0, MAX_ROWS),
      status: 'downloaded',
      language_lane: run.language_lane || 'en',
      brand_snapshot: safeJson(body && body.brand, {}),
      metadata: safeJson(body && body.metadata, {}),
      exported_by: user.id,
      exported_at: new Date().toISOString(),
    },
  });
  if (!exportResult.ok) throw new Error('Export record failed: ' + exportResult.text);
  var updateResult = await supabaseRequest('/rest/v1/payroll_runs?id=eq.' + encodeURIComponent(run.id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: {
      status: body && body.mark_exported === false ? run.status : 'exported',
      exported_count: clampInteger(run.exported_count, 0, 0, 100000) + 1,
      exported_at: new Date().toISOString(),
      updated_by: user.id,
    },
  });
  if (!updateResult.ok) throw new Error('Run export status update failed: ' + updateResult.text);
  await audit(run.client_id, user, 'record_export', 'payroll_runs', run.id, 'Recorded payroll export', {
    run_id: run.id,
    export_type: exportType,
  });
  return {
    statusCode: 200,
    body: {
      export: Array.isArray(exportResult.data) ? exportResult.data[0] : exportResult.data,
      run: Array.isArray(updateResult.data) ? updateResult.data[0] : updateResult.data,
    },
  };
}

async function handleImportLog(user, body) {
  var runId = normalizeRunId(body);
  var checked = await requireRunAccess(user, runId, EDIT_PAYROLL_ROLES, 'Not allowed to record payroll import');
  if (checked.statusCode !== 200) return checked;
  var run = checked.accessResult.run;
  var importType = sanitizeText(body && body.import_type || body && body.importType, 80);
  if (!['roster_csv', 'roster_excel', 'payroll_run_csv', 'payroll_run_excel', 'statutory_rates', 'other'].includes(importType)) importType = 'other';
  var result = await supabaseRequest('/rest/v1/payroll_import_batches', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: {
      client_id: run.client_id,
      company_id: run.company_id,
      run_id: run.id,
      import_type: importType,
      source_filename: sanitizeText(body && body.source_filename || body && body.sourceFilename, 240) || null,
      source_mime: sanitizeText(body && body.source_mime || body && body.sourceMime, 120) || null,
      status: 'imported',
      row_count: clampInteger(body && body.row_count || body && body.rowCount, 0, 0, MAX_ROWS),
      error_count: clampInteger(body && body.error_count || body && body.errorCount, 0, 0, MAX_ROWS),
      warning_count: clampInteger(body && body.warning_count || body && body.warningCount, 0, 0, MAX_ROWS),
      mapping: safeJson(body && body.mapping, {}),
      errors: Array.isArray(body && body.errors) ? body.errors.slice(0, 50) : [],
      uploaded_by: user.id,
      imported_at: new Date().toISOString(),
    },
  });
  if (!result.ok) throw new Error('Import log failed: ' + result.text);
  await audit(run.client_id, user, 'record_import', 'payroll_runs', run.id, 'Recorded payroll import batch', {
    run_id: run.id,
    row_count: clampInteger(body && body.row_count || body && body.rowCount, 0, 0, MAX_ROWS),
  });
  return { statusCode: 200, body: { import_batch: Array.isArray(result.data) ? result.data[0] : result.data } };
}

async function handleLoad(user, runId) {
  var accessResult = await getRunWithAccess(user, runId, VIEW_PAYROLL_ROLES);
  if (!accessResult) return { statusCode: 404, body: { error: 'Run not found' } };
  if (accessResult.denied) return { statusCode: 403, body: { error: 'Not allowed to view this payroll run' } };

  var companyResult = await supabaseRequest('/rest/v1/payroll_companies?' + qs({
    id: 'eq.' + accessResult.run.company_id,
    select: 'id,legal_name,country_code,currency_code',
    limit: '1',
  }));
  if (!companyResult.ok) throw new Error('Company load failed: ' + companyResult.text);

  var rowsResult = await supabaseRequest('/rest/v1/payroll_run_rows?' + qs({
    run_id: 'eq.' + accessResult.run.id,
    select: 'id,row_position,employee_name,role_title,department,country_code,currency_code,gross_pay,allowances,overtime_pay,unpaid_days,unpaid_amount,custom_deductions,preview_gross,employee_deductions,employer_cost,net_pay,calculation_mode,country_pack_status,engine_key,warning_text,row_status,line_payload,calculation_snapshot,updated_at',
    order: 'row_position.asc',
    limit: String(MAX_ROWS),
  }));
  if (!rowsResult.ok) throw new Error('Run rows load failed: ' + rowsResult.text);

  var company = Array.isArray(companyResult.data) ? companyResult.data[0] : null;
  return {
    statusCode: 200,
    body: {
      run: accessResult.run,
      company: company,
      rows: Array.isArray(rowsResult.data) ? rowsResult.data : [],
      workspaceState: toWorkspaceState(accessResult.run, company, Array.isArray(rowsResult.data) ? rowsResult.data : []),
    },
  };
}

function toWorkspaceState(run, company, rows) {
  var payPeriod = run.pay_period_start ? String(run.pay_period_start).slice(0, 7) : '';
  return {
    id: run.id,
    cloudRunId: run.id,
    cloudClientId: run.client_id,
    cloudCompanyId: run.company_id,
    savedAt: run.updated_at || run.created_at || '',
    companyName: company && company.legal_name || run.title || '',
    payPeriod: payPeriod,
    payDate: run.pay_date || '',
    defaultCountry: run.default_country || company && company.country_code || '',
    defaultCurrency: run.default_currency || company && company.currency_code || '',
    languageLane: run.language_lane || 'en',
    runStatus: mapRunStatusToWorkspace(run.status),
    lastCalculatedAt: run.engine_snapshot && run.engine_snapshot.last_calculated_at || '',
    brand: safeJson(run.branding, {}),
    workflow: {
      approvalStatus: run.approval_status || 'not_requested',
      exportedCount: run.exported_count || 0,
    },
    rows: rows.map(function (row) {
      return {
        id: row.line_payload && row.line_payload.local_row_id || row.id,
        cloudRowId: row.id,
        name: row.employee_name || '',
        role: row.role_title || row.department || '',
        country: row.country_code || '',
        gross: toNumber(row.gross_pay),
        allowances: toNumber(row.allowances),
        overtime: toNumber(row.overtime_pay),
        unpaidDays: toNumber(row.unpaid_days),
        unpaidAmount: toNumber(row.unpaid_amount),
        customDeductions: toNumber(row.custom_deductions),
      };
    }),
    summary: {
      totals: run.totals || {},
      reviewRows: run.review_count || 0,
      fullRows: run.ready_count || 0,
      estimateRows: run.warnings_count || 0,
    },
  };
}

async function handleSave(user, body) {
  if (payloadSizeBytes(body) > MAX_PAYLOAD_BYTES) {
    return { statusCode: 413, body: { error: 'Payroll run payload is too large' } };
  }

  var run = normalizeRun(body.run, user);
  if (!run.rows.length) {
    return { statusCode: 400, body: { error: 'Add at least one active payroll row before syncing' } };
  }

  var client = await getOwnedClient(user, run);
  var access = await getAccessRecord(user, client.id);
  if (!access || !EDIT_PAYROLL_ROLES.includes(access.role)) {
    return { statusCode: 403, body: { error: 'Not allowed to edit this payroll workspace' } };
  }

  var company = await ensureCompany(client, run, user);
  var runPayload = buildRunPayload(client, company, run, user);
  var runResult = await supabaseRequest('/rest/v1/payroll_runs?on_conflict=' + encodeURIComponent('company_id,run_key'), {
    method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
    body: runPayload,
  });
  if (!runResult.ok) throw new Error('Run save failed: ' + runResult.text);

  var savedRun = Array.isArray(runResult.data) ? runResult.data[0] : runResult.data;
  if (!savedRun || !savedRun.id) throw new Error('Run save did not return an id');

  var deleteRows = await supabaseRequest('/rest/v1/payroll_run_rows?run_id=eq.' + encodeURIComponent(savedRun.id), {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
  if (!deleteRows.ok) throw new Error('Existing run rows cleanup failed: ' + deleteRows.text);

  var rowPayload = run.rows.map(function (row, index) {
    return buildRowPayload(client, savedRun, run, user, row, index);
  });
  if (rowPayload.length) {
    var rowsResult = await supabaseRequest('/rest/v1/payroll_run_rows', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: rowPayload,
    });
    if (!rowsResult.ok) throw new Error('Run rows save failed: ' + rowsResult.text);
  }

  await audit(client.id, user, 'save_run', 'payroll_runs', savedRun.id, 'Saved payroll run from AfroPayroll workspace', {
    run_key: run.runKey,
    company: run.companyName,
    period: run.payPeriod,
    row_count: run.rowCount,
  });

  return {
    statusCode: 200,
    body: {
      ok: true,
      run: savedRun,
      client: client,
      company: company,
      workspaceState: Object.assign({}, run, {
        id: savedRun.id,
        cloudRunId: savedRun.id,
        cloudClientId: client.id,
        cloudCompanyId: company.id,
        savedAt: savedRun.updated_at || new Date().toISOString(),
      }),
    },
  };
}

async function handleDelete(user, runId) {
  var accessResult = await getRunWithAccess(user, runId, EDIT_PAYROLL_ROLES);
  if (!accessResult) return { statusCode: 404, body: { error: 'Run not found' } };
  if (accessResult.denied) return { statusCode: 403, body: { error: 'Not allowed to delete this payroll run' } };

  var deleteResult = await supabaseRequest('/rest/v1/payroll_runs?id=eq.' + encodeURIComponent(runId), {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' },
  });
  if (!deleteResult.ok) throw new Error('Run delete failed: ' + deleteResult.text);

  await audit(accessResult.run.client_id, user, 'delete_run', 'payroll_runs', runId, 'Deleted payroll run from AfroPayroll workspace', {
    run_id: runId,
  });

  return {
    statusCode: 200,
    body: {
      deleted: true,
      run: Array.isArray(deleteResult.data) ? deleteResult.data[0] : deleteResult.data,
    },
  };
}

exports.handler = async function (event) {
  CORS_HEADERS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  var auth = await requireUser(event);
  if (!auth.user) {
    return jsonResponse(401, { error: 'Unauthorized' }, auth.sessionResponse);
  }

  try {
    var params = event.queryStringParameters || {};

    if (event.httpMethod === 'GET') {
      if (params.action === 'dashboard') {
        var dashboard = await handleDashboard(auth.user, params);
        return jsonResponse(200, dashboard, auth.sessionResponse);
      }
      if (params.action === 'audit') {
        var auditTrail = await handleAudit(auth.user, params.run_id);
        return jsonResponse(auditTrail.statusCode, auditTrail.body, auth.sessionResponse);
      }
      if (params.action === 'roles') {
        var roles = await handleRoles(auth.user, params.run_id);
        return jsonResponse(roles.statusCode, roles.body, auth.sessionResponse);
      }
      if (params.action === 'load' || params.run_id) {
        var loaded = await handleLoad(auth.user, params.run_id);
        return jsonResponse(loaded.statusCode, loaded.body, auth.sessionResponse);
      }
      var list = await handleList(auth.user, params);
      return jsonResponse(200, list, auth.sessionResponse);
    }

    if (event.httpMethod === 'POST') {
      var body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch (error) {
        return jsonResponse(400, { error: 'Invalid JSON' }, auth.sessionResponse);
      }
      var action = sanitizeText(body.action, 80) || 'save_run';
      var result;
      if (action === 'save_run') result = await handleSave(auth.user, body);
      else if (action === 'request_approval') result = await handleApprovalRequest(auth.user, body);
      else if (action === 'approve_run') result = await handleApprovalDecision(auth.user, body, 'approved');
      else if (action === 'reject_run') result = await handleApprovalDecision(auth.user, body, 'rejected');
      else if (action === 'generate_payslips') result = await handleGeneratePayslips(auth.user, body);
      else if (action === 'generate_statutory_packs') result = await handleGenerateStatutoryPacks(auth.user, body);
      else if (action === 'record_export') result = await handleRecordExport(auth.user, body);
      else if (action === 'record_import') result = await handleImportLog(auth.user, body);
      else if (action === 'invite_member') result = await handleInviteMember(auth.user, body);
      else result = { statusCode: 400, body: { error: 'Unsupported AfroPayroll action' } };
      return jsonResponse(result.statusCode, result.body, auth.sessionResponse);
    }

    if (event.httpMethod === 'DELETE') {
      var deleted = await handleDelete(auth.user, params.run_id || params.id);
      return jsonResponse(deleted.statusCode, deleted.body, auth.sessionResponse);
    }

    return jsonResponse(405, { error: 'Method not allowed' }, auth.sessionResponse);
  } catch (error) {
    return jsonResponse(500, {
      error: 'AfroPayroll API failed',
      detail: error && error.message ? error.message : String(error),
    }, auth.sessionResponse);
  }
};
