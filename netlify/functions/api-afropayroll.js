/**
 * AfroPayroll Pro API
 *
 * GET    /api/afropayroll?action=dashboard
 * GET    /api/afropayroll?action=clients
 * GET    /api/afropayroll?action=list
 * GET    /api/afropayroll?action=load&run_id=<uuid>
 * GET    /api/afropayroll?action=audit&run_id=<uuid>
 * GET    /api/afropayroll?action=roles&run_id=<uuid>
 * GET    /api/afropayroll?action=employee_portal&token=<invite-token>
 * POST   /api/afropayroll { action: "save_client", client: {...} }
 * POST   /api/afropayroll { action: "save_run", run: {..., employees: [...] } }
 * POST   /api/afropayroll { action: "submit_run" | "request_approval" | "request_changes" | "approve_run" | "reject_run" | "finalize_run" | "reopen_run", run_id: <uuid> }
 * POST   /api/afropayroll { action: "generate_payslips" | "generate_statutory_packs" | "record_export" | "record_import", run_id: <uuid> }
 * POST   /api/afropayroll { action: "invite_member", run_id: <uuid>, email: "...", role: "..." }
 * POST   /api/afropayroll { action: "create_employee_portal_invite", run_id: <uuid>, employee_id: <uuid> }
 * POST   /api/afropayroll { action: "employee_confirm_profile", token: "...", profile: {...} }
 * DELETE /api/afropayroll?run_id=<uuid>
 *
 * Auth is verified with the user's Supabase access token or secure session
 * cookie. Writes use the service role key, so this function must enforce
 * payroll access rules before returning or mutating salary-sensitive rows
 * or employee master records.
 */

const crypto = require('crypto');
const { getAllowedOrigin } = require('./utils/cors');
const { getUserFromEvent } = require('./_shared/browser-session-auth');

const SUPABASE_AUTH_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const MAX_ROWS = 500;
const MAX_EMPLOYEES = 1000;
const MAX_PAYLOAD_BYTES = 900000;
const EMPLOYEE_PORTAL_TOKEN_BYTES = 32;
const EMPLOYEE_PORTAL_INVITE_DAYS = 14;
const VIEW_PAYROLL_ROLES = ['owner', 'admin', 'payroll_admin', 'accountant', 'approver'];
const EDIT_PAYROLL_ROLES = ['owner', 'admin', 'payroll_admin', 'accountant'];
const APPROVE_PAYROLL_ROLES = ['owner', 'admin', 'accountant', 'approver'];
const MANAGE_MEMBER_ROLES = ['owner', 'admin', 'payroll_admin'];
const RUN_STATES = ['draft', 'review', 'approved', 'finalized', 'exported', 'reopened', 'archived'];
const LEGACY_RUN_STATE_MAP = {
  submitted: 'review',
  changes_requested: 'review',
  needs_review: 'review',
  ready: 'draft',
  approval_requested: 'review',
  closed: 'finalized',
};
const APPROVAL_STATUS_BY_RUN_STATE = {
  draft: 'not_requested',
  review: 'pending',
  approved: 'approved',
  finalized: 'finalized',
  exported: 'exported',
  reopened: 'reopened',
  archived: 'cancelled',
};
const RUN_STATE_TRANSITIONS = {
  draft: ['review', 'archived'],
  review: ['approved', 'reopened', 'draft'],
  approved: ['finalized', 'reopened', 'review'],
  finalized: ['exported', 'reopened'],
  exported: ['reopened'],
  reopened: ['review', 'draft', 'archived'],
  archived: [],
};
const CLIENT_SELECT = 'id,owner_id,name,client_type,default_country,default_currency,language_lane,billing_email,notes,settings,status,created_at,updated_at';
const COMPANY_SELECT = 'id,client_id,legal_name,trading_name,country_code,currency_code,payroll_settings,status,created_at,updated_at';
const EMPLOYEE_SELECT = 'id,client_id,company_id,employee_code,external_ref,full_name,preferred_name,email,phone,country_code,currency_code,role_title,department,employment_type,pay_schedule,hire_date,termination_date,statutory_ids,bank_meta,pay_setup,status,created_at,updated_at';
const PORTAL_INVITE_SELECT = 'id,client_id,company_id,run_id,employee_id,invited_email,status,expires_at,last_viewed_at,confirmed_at,created_at,updated_at,metadata';

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

function sanitizeEmail(value) {
  var email = sanitizeText(value, 180).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function tokenHash(value) {
  return crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex');
}

function createPortalToken() {
  return crypto.randomBytes(EMPLOYEE_PORTAL_TOKEN_BYTES)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function portalBaseUrl(event) {
  var origin = getAllowedOrigin(event);
  if (origin && origin !== 'null') return origin;
  return 'https://afrotools.com';
}

function employeePortalUrl(event, token) {
  return portalBaseUrl(event).replace(/\/+$/g, '') + '/tools/afropayroll-os/employee.html?token=' + encodeURIComponent(token);
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

function canonicalRunState(value) {
  var status = sanitizeText(value, 32).toLowerCase();
  status = LEGACY_RUN_STATE_MAP[status] || status;
  return RUN_STATES.includes(status) ? status : 'draft';
}

function mapRunStatus(value) {
  return canonicalRunState(value);
}

function mapRunStatusToWorkspace(value) {
  return canonicalRunState(value);
}

function approvalStatusForRunState(runState, requested) {
  var direct = sanitizeText(requested, 32).toLowerCase();
  var allowed = ['not_requested', 'pending', 'review', 'submitted', 'changes_requested', 'approved', 'finalized', 'exported', 'reopened', 'rejected', 'cancelled'];
  if (allowed.includes(direct)) {
    if (direct === 'submitted' || direct === 'review' || direct === 'changes_requested') return 'pending';
    return direct;
  }
  return APPROVAL_STATUS_BY_RUN_STATE[canonicalRunState(runState)] || 'not_requested';
}

function isRunLockedForRows(status) {
  var state = canonicalRunState(status);
  return state === 'approved' || state === 'finalized' || state === 'exported';
}

function canTransitionRun(fromState, toState) {
  var from = canonicalRunState(fromState);
  var to = canonicalRunState(toState);
  return from === to || (RUN_STATE_TRANSITIONS[from] || []).includes(to);
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
      sanitizeText(row.employeeRecordId || row.employeeId, 2) ||
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

function normalizeEmploymentType(value) {
  var type = sanitizeText(value, 32).toLowerCase();
  return ['employee', 'contractor', 'casual', 'intern', 'director', 'other'].includes(type) ? type : 'employee';
}

function normalizeEmployeeStatus(value) {
  var status = sanitizeText(value, 24).toLowerCase();
  return status === 'inactive' || status === 'terminated' || status === 'archived' ? 'inactive' : 'active';
}

function normalizeClientStatus(value) {
  var status = sanitizeText(value, 32).toLowerCase();
  return status === 'archived' || status === 'inactive' ? 'archived' : 'active';
}

function normalizeDefaultPayDay(value) {
  var day = clampInteger(value, 0, 0, 31);
  return day || null;
}

function normalizeClientMeta(input, defaults) {
  var client = safeJson(input, {});
  var fallback = safeJson(defaults, {});
  var country = normalizeCountry(client.country || client.defaultCountry || client.default_country || fallback.defaultCountry, 'NG');
  var currency = normalizeCurrency(client.defaultCurrency || client.default_currency || client.currency || fallback.defaultCurrency);
  var name = sanitizeText(client.name || client.clientName || fallback.clientName || fallback.companyName, 180);
  var companyName = sanitizeText(client.companyName || client.company_name || fallback.companyName || name, 180);
  if (!name) name = companyName || 'AfroPayroll workspace';
  if (!companyName) companyName = name;
  return {
    clientId: sanitizeText(client.clientId || client.cloudClientId || client.id || fallback.clientId || fallback.cloudClientId, 80),
    companyId: sanitizeText(client.companyId || client.cloudCompanyId || fallback.companyId || fallback.cloudCompanyId, 80),
    name: name,
    companyName: companyName,
    country: country,
    payrollContact: sanitizeText(client.payrollContact || client.payroll_contact || fallback.payrollContact, 180),
    reviewerEmail: sanitizeText(client.reviewerEmail || client.reviewer_email || fallback.reviewerEmail, 180),
    defaultCurrency: currency,
    defaultPayDay: normalizeDefaultPayDay(client.defaultPayDay || client.default_pay_day || fallback.defaultPayDay),
    status: normalizeClientStatus(client.status || client.clientStatus || fallback.clientStatus),
  };
}

function clientSettingsFromMeta(meta, existingSettings) {
  var settings = Object.assign({}, safeJson(existingSettings, {}));
  settings.payroll_contact = meta.payrollContact || null;
  settings.reviewer_email = meta.reviewerEmail || null;
  settings.default_pay_day = meta.defaultPayDay || null;
  settings.source = settings.source || 'afropayroll_workspace';
  return settings;
}

function companySettingsFromMeta(meta, existingSettings) {
  var settings = Object.assign({}, safeJson(existingSettings, {}));
  settings.payroll_contact = meta.payrollContact || null;
  settings.reviewer_email = meta.reviewerEmail || null;
  settings.default_pay_day = meta.defaultPayDay || null;
  settings.source = settings.source || 'afropayroll_workspace';
  return settings;
}

function normalizeEmployeeRecord(record, fallbackCountry) {
  var employee = safeJson(record, {});
  var localId = sanitizeText(employee.id || employee.employeeRecordId || employee.localEmployeeId, 120);
  var employeeCode = sanitizeText(employee.employeeId || employee.employeeCode || employee.code, 80);
  var email = sanitizeText(employee.email, 180);
  var name = sanitizeText(employee.name || employee.fullName || employee.full_name, 180);
  if (!employeeCode && localId) employeeCode = localId;
  return {
    localId: localId || employeeCode || email || name,
    cloudEmployeeId: sanitizeText(employee.cloudEmployeeId || employee.cloudId, 80),
    employeeId: employeeCode,
    name: name,
    email: email,
    phone: sanitizeText(employee.phone, 80),
    country: normalizeCountry(employee.country || employee.countryCode, fallbackCountry || 'NG'),
    taxId: sanitizeText(employee.taxId || employee.taxID || employee.tax_id, 120),
    socialSecurityId: sanitizeText(employee.socialSecurityId || employee.pensionSocialSecurityId || employee.pensionId || employee.social_id, 120),
    bankName: sanitizeText(employee.bankName || employee.bank_name, 120),
    bankAccountOrMobile: sanitizeText(employee.bankAccountOrMobile || employee.bankAccount || employee.accountNumber || employee.mobileMoney || employee.account_or_mobile, 160),
    department: sanitizeText(employee.department, 120),
    role: sanitizeText(employee.role || employee.roleTitle || employee.jobTitle, 140),
    startDate: normalizeDate(employee.startDate || employee.hireDate || employee.hire_date),
    employmentType: normalizeEmploymentType(employee.employmentType || employee.type),
    status: normalizeEmployeeStatus(employee.status),
  };
}

function activeEmployees(employees, fallbackCountry) {
  return (Array.isArray(employees) ? employees : []).map(function (employee) {
    return normalizeEmployeeRecord(employee, fallbackCountry);
  }).filter(function (employee) {
    return Boolean(employee.name || employee.employeeId || employee.email || employee.phone);
  }).slice(0, MAX_EMPLOYEES);
}

function normalizeRun(bodyRun, user) {
  var run = safeJson(bodyRun, {});
  var rawClient = safeJson(run.client || run.clientMeta, {});
  var companyName = sanitizeText(run.companyName || rawClient.companyName || rawClient.name, 180) || 'Untitled company';
  var payPeriod = normalizeMonth(run.payPeriod);
  var defaultCountry = normalizeCountry(run.defaultCountry || rawClient.country || rawClient.defaultCountry, 'NG');
  var defaultCurrency = normalizeCurrency(run.defaultCurrency || rawClient.defaultCurrency);
  var clientMeta = normalizeClientMeta(rawClient, Object.assign({}, run, {
    companyName: companyName,
    defaultCountry: defaultCountry,
    defaultCurrency: defaultCurrency,
  }));
  var rows = activeRows(run.rows);
  var employees = activeEmployees(run.employees, defaultCountry);
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
    defaultCurrency: defaultCurrency || clientMeta.defaultCurrency,
    languageLane: normalizeLanguage(run.languageLane),
    runStatus: mapRunStatus(run.runStatus),
    runKey: runKey,
    lastCalculatedAt: sanitizeText(run.lastCalculatedAt, 40),
    brand: safeJson(run.brand || run.branding, {}),
    workflow: safeJson(run.workflow, {}),
    client: clientMeta,
    employees: employees,
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
  var selectedClientId = run && run.client && run.client.clientId;
  if (isUuid(selectedClientId)) {
    var selectedAccess = await getAccessRecord(user, selectedClientId);
    return selectedAccess && selectedAccess.client ? selectedAccess.client : null;
  }

  var meta = normalizeClientMeta(run && run.client, run || {});
  var hasNamedClient = meta.name && meta.name !== 'AfroPayroll workspace';
  if (hasNamedClient) {
    var named = await supabaseRequest('/rest/v1/payroll_clients?' + qs({
      owner_id: 'eq.' + user.id,
      name: 'eq.' + meta.name,
      status: 'eq.active',
      select: CLIENT_SELECT,
      order: 'created_at.asc',
      limit: '1',
    }));
    if (!named.ok) throw new Error('Named client lookup failed: ' + named.text);
    if (Array.isArray(named.data) && named.data[0]) return named.data[0];
  }

  var selectPath = '/rest/v1/payroll_clients?' + qs({
    owner_id: 'eq.' + user.id,
    status: 'eq.active',
    select: CLIENT_SELECT,
    order: 'created_at.asc',
    limit: '1',
  });
  var existing = await supabaseRequest(selectPath);
  if (!existing.ok) throw new Error('Client lookup failed: ' + existing.text);
  if (!hasNamedClient && Array.isArray(existing.data) && existing.data[0]) return existing.data[0];

  var clientName = meta.name || 'AfroPayroll workspace';
  if (!meta.name && user.email) clientName = 'AfroPayroll workspace - ' + user.email;
  var created = await supabaseRequest('/rest/v1/payroll_clients', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: {
      owner_id: user.id,
      name: clientName,
      client_type: 'company',
      default_country: meta.country || run.defaultCountry,
      default_currency: meta.defaultCurrency || run.defaultCurrency || null,
      language_lane: run.languageLane || 'en',
      billing_email: meta.payrollContact || null,
      settings: clientSettingsFromMeta(meta, { created_from: 'afropayroll_workspace' }),
      status: meta.status || 'active',
    },
  });
  if (!created.ok) throw new Error('Client create failed: ' + created.text);
  return Array.isArray(created.data) ? created.data[0] : created.data;
}

async function getAccessRecord(user, clientId) {
  if (!isUuid(clientId)) return null;
  var clientResult = await supabaseRequest('/rest/v1/payroll_clients?' + qs({
    id: 'eq.' + clientId,
    select: CLIENT_SELECT,
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
    select: 'id,client_id,company_id,run_key,title,pay_period_start,pay_period_end,pay_date,default_country,default_currency,language_lane,status,approval_status,source_mode,totals,engine_snapshot,warnings_count,ready_count,review_count,exported_count,branding,approved_by,approved_at,exported_at,created_at,updated_at',
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

async function syncClientRecord(client, run, user) {
  var meta = normalizeClientMeta(run && run.client, run || {});
  var updated = await supabaseRequest('/rest/v1/payroll_clients?id=eq.' + encodeURIComponent(client.id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: {
      name: meta.name || client.name || run.companyName,
      default_country: meta.country || run.defaultCountry || client.default_country || null,
      default_currency: meta.defaultCurrency || run.defaultCurrency || client.default_currency || null,
      language_lane: run.languageLane || client.language_lane || 'en',
      billing_email: meta.payrollContact || client.billing_email || null,
      settings: clientSettingsFromMeta(meta, client.settings),
      status: meta.status || client.status || 'active',
      updated_at: new Date().toISOString(),
    },
  });
  if (!updated.ok) throw new Error('Client metadata save failed: ' + updated.text);
  return Array.isArray(updated.data) ? updated.data[0] : updated.data;
}

async function syncCompanyRecord(company, client, run, user) {
  var meta = normalizeClientMeta(run && run.client, run || {});
  var updated = await supabaseRequest('/rest/v1/payroll_companies?id=eq.' + encodeURIComponent(company.id) + '&client_id=eq.' + encodeURIComponent(client.id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: {
      legal_name: run.companyName || meta.companyName || company.legal_name || client.name,
      country_code: run.defaultCountry || meta.country || company.country_code || client.default_country,
      currency_code: run.defaultCurrency || meta.defaultCurrency || company.currency_code || client.default_currency || null,
      payroll_settings: companySettingsFromMeta(meta, company.payroll_settings),
      status: meta.status || company.status || 'active',
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
  });
  if (!updated.ok) throw new Error('Company metadata save failed: ' + updated.text);
  return Array.isArray(updated.data) ? updated.data[0] : updated.data;
}

async function ensureCompany(client, run, user) {
  var selectedCompanyId = run && run.client && run.client.companyId;
  if (isUuid(selectedCompanyId)) {
    var selected = await supabaseRequest('/rest/v1/payroll_companies?' + qs({
      id: 'eq.' + selectedCompanyId,
      client_id: 'eq.' + client.id,
      select: COMPANY_SELECT,
      limit: '1',
    }));
    if (!selected.ok) throw new Error('Selected company lookup failed: ' + selected.text);
    if (Array.isArray(selected.data) && selected.data[0]) {
      return syncCompanyRecord(selected.data[0], client, run, user);
    }
  }

  var companyResult = await supabaseRequest('/rest/v1/payroll_companies?' + qs({
    client_id: 'eq.' + client.id,
    legal_name: 'eq.' + run.companyName,
    country_code: 'eq.' + run.defaultCountry,
    status: 'eq.active',
    select: COMPANY_SELECT,
    order: 'created_at.asc',
    limit: '1',
  }));
  if (!companyResult.ok) throw new Error('Company lookup failed: ' + companyResult.text);
  if (Array.isArray(companyResult.data) && companyResult.data[0]) {
    return syncCompanyRecord(companyResult.data[0], client, run, user);
  }

  var meta = normalizeClientMeta(run && run.client, run || {});

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
      payroll_settings: companySettingsFromMeta(meta, { source: 'afropayroll_workspace' }),
    },
  });
  if (!created.ok) throw new Error('Company create failed: ' + created.text);
  return Array.isArray(created.data) ? created.data[0] : created.data;
}

function employeeMapKey(value) {
  return sanitizeText(value, 160).toLowerCase();
}

function employeeLookupKeys(employee) {
  var keys = [];
  [employee.localId, employee.employeeId, employee.cloudEmployeeId, employee.email, employee.name && employee.country ? employee.name + '|' + employee.country : ''].forEach(function (value) {
    var key = employeeMapKey(value);
    if (key && !keys.includes(key)) keys.push(key);
  });
  return keys;
}

async function ensureEmployees(client, company, run, user) {
  var employees = activeEmployees(run.employees, run.defaultCountry);
  var map = {};
  if (!employees.length) return map;

  var payload = employees.map(function (employee) {
    var employeeCode = sanitizeText(employee.employeeId || employee.localId, 80);
    return {
      client_id: client.id,
      company_id: company.id,
      employee_code: employeeCode || null,
      external_ref: sanitizeText(employee.localId, 120) || null,
      full_name: employee.name || employeeCode || employee.email || 'Unnamed employee',
      email: employee.email || null,
      phone: employee.phone || null,
      country_code: employee.country || run.defaultCountry,
      currency_code: run.defaultCurrency || company.currency_code || null,
      role_title: employee.role || null,
      department: employee.department || null,
      employment_type: employee.employmentType,
      pay_schedule: 'monthly',
      hire_date: employee.startDate || null,
      statutory_ids: {
        tax_id: employee.taxId || null,
        pension_social_security_id: employee.socialSecurityId || null,
      },
      bank_meta: {
        bank_name: employee.bankName || null,
        account_or_mobile: employee.bankAccountOrMobile || null,
      },
      pay_setup: {
        source: 'afropayroll_workspace',
        local_employee_id: employee.localId || null,
      },
      status: employee.status,
      created_by: user.id,
      updated_by: user.id,
    };
  });

  var result = await supabaseRequest('/rest/v1/payroll_employees?on_conflict=' + encodeURIComponent('company_id,employee_code'), {
    method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
    body: payload,
  });
  if (!result.ok) throw new Error('Employee records save failed: ' + result.text);

  var saved = Array.isArray(result.data) ? result.data : [];
  employees.forEach(function (employee, index) {
    var savedEmployee = saved[index];
    employeeLookupKeys(employee).forEach(function (key) {
      if (savedEmployee && savedEmployee.id) map[key] = savedEmployee;
    });
  });
  return map;
}

function buildRunPayload(client, company, run, user) {
  var summary = run.summary || {};
  var workflow = safeJson(run.workflow, {});
  var runState = canonicalRunState(run.runStatus);
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
    status: runState,
    approval_status: approvalStatusForRunState(runState, workflow.approvalStatus || workflow.approval_state),
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
    exported_count: clampInteger(workflow.exportedCount || workflow.exported_count, 0, 0, 100000),
    branding: safeJson(run.brand, {}),
    created_by: user.id,
    updated_by: user.id,
  };
}

function findLinkedEmployee(row, employeeMap) {
  var keys = [
    row && row.employeeRecordId,
    row && row.employeeId,
    row && row.employeeCode,
    row && row.cloudEmployeeId,
    row && row.name && row.country ? row.name + '|' + normalizeCountry(row.country, '') : '',
  ];
  for (var index = 0; index < keys.length; index += 1) {
    var key = employeeMapKey(keys[index]);
    if (key && employeeMap[key]) return employeeMap[key];
  }
  return null;
}

function buildRowPayload(client, runRecord, run, user, row, index, employeeMap) {
  var calc = safeJson(row.calc, {});
  var packStatus = sanitizeText(calc.status || row.countryPackStatus, 32) || 'unknown';
  var country = normalizeCountry(row.country, run.defaultCountry);
  var currency = normalizeCurrency(calc.currency || row.currency);
  var linkedEmployee = findLinkedEmployee(row, employeeMap || {});
  var localEmployeeId = sanitizeText(row.employeeRecordId || row.employeeId, 120);

  return {
    client_id: client.id,
    run_id: runRecord.id,
    employee_id: linkedEmployee && linkedEmployee.id || null,
    row_position: index,
    employee_name: sanitizeText(row.name, 180) || linkedEmployee && linkedEmployee.full_name || 'Unnamed employee',
    role_title: sanitizeText(row.role, 140) || linkedEmployee && linkedEmployee.role_title || null,
    department: sanitizeText(row.department, 120) || linkedEmployee && linkedEmployee.department || null,
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
      local_employee_id: localEmployeeId || linkedEmployee && linkedEmployee.pay_setup && linkedEmployee.pay_setup.local_employee_id || null,
      employee_code: sanitizeText(row.employeeCode || linkedEmployee && linkedEmployee.employee_code, 80) || null,
      source: 'afropayroll_workspace',
    },
    calculation_snapshot: calc,
    created_by: user.id,
    updated_by: user.id,
  };
}

async function audit(clientId, user, action, entityType, entityId, summary, afterState) {
  var state = Object.assign({}, safeJson(afterState, {}));
  var beforeState = safeJson(state.before_state, null);
  if (beforeState) delete state.before_state;
  var payload = {
    client_id: clientId,
    actor_id: user && user.id || null,
    action: action,
    entity_type: entityType,
    entity_id: entityId || null,
    summary: sanitizeText(summary, 320),
    after_state: state,
    request_meta: { source: 'api-afropayroll' },
  };
  if (beforeState) payload.before_state = beforeState;
  if (entityType === 'payroll_runs' && isUuid(entityId)) payload.run_id = entityId;
  if (state && isUuid(state.run_id)) payload.run_id = state.run_id;
  if (state && isUuid(state.company_id)) payload.company_id = state.company_id;

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
    var status = canonicalRunState(run.status);
    if (status === 'draft' || status === 'reopened') summary.ready_runs += 1;
    if (status === 'review') summary.needs_review_runs += 1;
    if (status === 'review' || approvalStatusForRunState(status, run.approval_status) === 'pending') summary.approval_runs += 1;
    if (status === 'approved' || status === 'finalized') summary.ready_runs += 1;
    if (status === 'exported') summary.exported_runs += 1;
    summary.total_rows += clampInteger(run.row_count, 0, 0, 100000);
    summary.ready_rows += clampInteger(run.ready_count, 0, 0, 100000);
    summary.needs_review_rows += clampInteger(run.needs_review_count, 0, 0, 100000);
    summary.exported_rows += clampInteger(run.exported_count, 0, 0, 100000);
    summary.warning_rows += clampInteger(run.warning_count, 0, 0, 100000);
  });
  return summary;
}

function isOverdueRun(run, today) {
  var status = canonicalRunState(run.status);
  if (!run.pay_date || ['approved', 'finalized', 'exported', 'archived'].includes(status)) return false;
  return String(run.pay_date).slice(0, 10) < today;
}

function clientCountsFromRuns(runs) {
  var today = new Date().toISOString().slice(0, 10);
  var counts = {
    ready: 0,
    needs_review: 0,
    approval_requested: 0,
    approved: 0,
    exported: 0,
    overdue: 0,
    total: 0,
  };
  (Array.isArray(runs) ? runs : []).forEach(function (run) {
    var status = canonicalRunState(run.status);
    counts.total += 1;
    if (status === 'draft' || status === 'reopened') counts.ready += 1;
    if (status === 'review') counts.needs_review += 1;
    if (status === 'review' || approvalStatusForRunState(status, run.approval_status) === 'pending') counts.approval_requested += 1;
    if (status === 'approved') counts.approved += 1;
    if (status === 'finalized') counts.approved += 1;
    if (status === 'exported') counts.exported += 1;
    if (isOverdueRun(run, today)) counts.overdue += 1;
  });
  return counts;
}

async function listAccessibleClientRecords(user) {
  var ownerResult = await supabaseRequest('/rest/v1/payroll_clients?' + qs({
    owner_id: 'eq.' + user.id,
    select: CLIENT_SELECT,
    order: 'updated_at.desc',
    limit: '100',
  }));
  if (!ownerResult.ok) throw new Error('Client dashboard owner lookup failed: ' + ownerResult.text);

  var membershipResult = await supabaseRequest('/rest/v1/payroll_memberships?' + qs({
    user_id: 'eq.' + user.id,
    status: 'eq.active',
    select: 'client_id,role',
    limit: '200',
  }));
  if (!membershipResult.ok) throw new Error('Client dashboard membership lookup failed: ' + membershipResult.text);

  var clientsById = {};
  var rolesById = {};
  (Array.isArray(ownerResult.data) ? ownerResult.data : []).forEach(function (client) {
    if (!client || !client.id) return;
    clientsById[client.id] = client;
    rolesById[client.id] = 'owner';
  });

  var memberIds = [];
  (Array.isArray(membershipResult.data) ? membershipResult.data : []).forEach(function (membership) {
    if (!membership || !membership.client_id || !VIEW_PAYROLL_ROLES.includes(membership.role)) return;
    if (!rolesById[membership.client_id]) rolesById[membership.client_id] = membership.role;
    if (!clientsById[membership.client_id] && !memberIds.includes(membership.client_id)) memberIds.push(membership.client_id);
  });

  if (memberIds.length) {
    var memberClientResult = await supabaseRequest('/rest/v1/payroll_clients?' + qs({
      id: 'in.(' + memberIds.join(',') + ')',
      select: CLIENT_SELECT,
      order: 'updated_at.desc',
      limit: '100',
    }));
    if (!memberClientResult.ok) throw new Error('Client dashboard lookup failed: ' + memberClientResult.text);
    (Array.isArray(memberClientResult.data) ? memberClientResult.data : []).forEach(function (client) {
      if (client && client.id) clientsById[client.id] = client;
    });
  }

  return Object.keys(clientsById).map(function (id) {
    return { client: clientsById[id], role: rolesById[id] || 'viewer' };
  }).sort(function (a, b) {
    return String(b.client.updated_at || b.client.created_at || '').localeCompare(String(a.client.updated_at || a.client.created_at || ''));
  });
}

function workspaceClientFromRecords(client, company, role, runs) {
  var settings = safeJson(client.settings, {});
  var companySettings = safeJson(company && company.payroll_settings, {});
  var defaultPayDay = normalizeDefaultPayDay(settings.default_pay_day || settings.defaultPayDay || companySettings.default_pay_day);
  return {
    id: client.id,
    clientId: client.id,
    companyId: company && company.id || '',
    name: client.name || company && company.legal_name || '',
    companyName: company && company.legal_name || client.name || '',
    role: role || 'viewer',
    status: client.status || 'active',
    country: client.default_country || company && company.country_code || '',
    payrollContact: settings.payroll_contact || settings.payrollContact || client.billing_email || '',
    reviewerEmail: settings.reviewer_email || settings.reviewerEmail || '',
    defaultCurrency: client.default_currency || company && company.currency_code || '',
    defaultPayDay: defaultPayDay || '',
    updatedAt: client.updated_at || client.created_at || '',
    counts: clientCountsFromRuns(runs),
  };
}

async function handleClients(user, params) {
  var accessible = await listAccessibleClientRecords(user);
  var clientIds = accessible.map(function (record) { return record.client.id; }).filter(Boolean);
  if (!clientIds.length) return { clients: [], companies: [], runs: [] };

  var companyResult = await supabaseRequest('/rest/v1/payroll_companies?' + qs({
    client_id: 'in.(' + clientIds.join(',') + ')',
    select: COMPANY_SELECT,
    order: 'updated_at.desc',
    limit: '200',
  }));
  if (!companyResult.ok) throw new Error('Client companies load failed: ' + companyResult.text);

  var limit = clampInteger(params && (params.client_run_limit || params.clientRunLimit), 1000, 1, 1000);
  var runResult = await supabaseRequest('/rest/v1/payroll_run_dashboard?' + qs({
    client_id: 'in.(' + clientIds.join(',') + ')',
    select: 'run_id,client_id,company_id,company_name,title,pay_period_start,pay_period_end,pay_date,status,approval_status,row_count,ready_count,needs_review_count,exported_count,warning_count,currency_codes,pack_statuses,updated_at',
    order: 'updated_at.desc',
    limit: String(limit),
  }));
  if (!runResult.ok) throw new Error('Client run dashboard load failed: ' + runResult.text);

  var companies = Array.isArray(companyResult.data) ? companyResult.data : [];
  var runs = Array.isArray(runResult.data) ? runResult.data : [];
  var companiesByClient = {};
  companies.forEach(function (company) {
    if (company.client_id && !companiesByClient[company.client_id]) companiesByClient[company.client_id] = company;
  });
  var runsByClient = {};
  runs.forEach(function (run) {
    if (!runsByClient[run.client_id]) runsByClient[run.client_id] = [];
    runsByClient[run.client_id].push(run);
  });

  return {
    clients: accessible.map(function (record) {
      return workspaceClientFromRecords(record.client, companiesByClient[record.client.id], record.role, runsByClient[record.client.id] || []);
    }),
    companies: companies,
    runs: runs,
  };
}

async function handleDashboard(user, params) {
  var list = await handleList(user, Object.assign({}, params || {}, { limit: params && params.limit || 100 }));
  var clients = await handleClients(user, Object.assign({}, params || {}, { limit: params && params.limit || 100 }));
  return {
    runs: list.runs,
    dashboard: dashboardFromRuns(list.runs),
    clients: clients.clients,
    companies: clients.companies,
  };
}

async function listRunRows(runId) {
  var rowsResult = await supabaseRequest('/rest/v1/payroll_run_rows?' + qs({
    run_id: 'eq.' + runId,
    select: 'id,employee_id,row_position,employee_name,role_title,department,country_code,currency_code,gross_pay,allowances,overtime_pay,unpaid_days,unpaid_amount,custom_deductions,preview_gross,employee_deductions,employer_cost,net_pay,calculation_mode,country_pack_status,engine_key,warning_level,warning_text,row_status,line_payload,calculation_snapshot,updated_at',
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

function portalSchemaError(result) {
  var text = result && result.text || '';
  return Boolean(result && (result.status === 404 || /payroll_employee_portal_invites/i.test(text)));
}

function portalSchemaHint() {
  return 'Employee portal invite schema is missing. Apply supabase/migrations/036-afropayroll-employee-portal-invites.sql before enabling synced employee links.';
}

async function loadPortalInvite(rawToken) {
  var token = sanitizeText(rawToken, 240);
  if (!token || token.length < 32) {
    return { statusCode: 400, body: { error: 'Invite token is missing or invalid' } };
  }

  var result = await supabaseRequest('/rest/v1/payroll_employee_portal_invites?' + qs({
    token_hash: 'eq.' + tokenHash(token),
    status: 'eq.active',
    select: PORTAL_INVITE_SELECT,
    limit: '1',
  }));
  if (!result.ok) {
    if (portalSchemaError(result)) throw new Error(portalSchemaHint());
    throw new Error('Employee portal invite lookup failed: ' + result.text);
  }

  var invite = Array.isArray(result.data) ? result.data[0] : null;
  if (!invite) return { statusCode: 404, body: { error: 'Invite link not found or revoked' } };

  var expiresAt = invite.expires_at ? new Date(invite.expires_at).getTime() : 0;
  if (!expiresAt || expiresAt < Date.now()) {
    await supabaseRequest('/rest/v1/payroll_employee_portal_invites?id=eq.' + encodeURIComponent(invite.id), {
      method: 'PATCH',
      body: {
        status: 'expired',
        updated_at: new Date().toISOString(),
      },
    });
    return { statusCode: 410, body: { error: 'Invite link has expired' } };
  }

  return { statusCode: 200, invite: invite };
}

function employeeStatutory(employee) {
  var statutory = safeJson(employee && employee.statutory_ids, {});
  return {
    tax_id: sanitizeText(statutory.tax_id || statutory.taxId, 120),
    pension_social_security_id: sanitizeText(statutory.pension_social_security_id || statutory.socialSecurityId || statutory.pensionId || statutory.social_id, 120),
  };
}

function employeeBank(employee) {
  var bank = safeJson(employee && employee.bank_meta, {});
  return {
    bank_name: sanitizeText(bank.bank_name || bank.bankName || bank.provider, 140),
    account_or_mobile: sanitizeText(bank.account_or_mobile || bank.bankAccountOrMobile || bank.accountNumber || bank.mobile_money_number, 160),
  };
}

function portalMissingProfileFields(employee) {
  var statutory = employeeStatutory(employee);
  var bank = employeeBank(employee);
  var missing = [];
  if (!employee || (!sanitizeText(employee.email, 180) && !sanitizeText(employee.phone, 80))) {
    missing.push({
      field: 'delivery_contact',
      label: 'Payslip delivery contact',
      request: 'Add an email address or phone number for payslip delivery.',
    });
  }
  if (!statutory.tax_id) {
    missing.push({
      field: 'tax_id',
      label: 'Tax ID',
      request: 'Add the employee tax ID needed for statutory review.',
    });
  }
  if (!statutory.pension_social_security_id) {
    missing.push({
      field: 'pension_social_security_id',
      label: 'Pension or social security ID',
      request: 'Add the pension or social security identifier used in this country pack.',
    });
  }
  if (!bank.bank_name) {
    missing.push({
      field: 'bank_name',
      label: 'Bank or wallet provider',
      request: 'Add the bank name or mobile money provider.',
    });
  }
  if (!bank.account_or_mobile) {
    missing.push({
      field: 'account_or_mobile',
      label: 'Bank account or mobile money number',
      request: 'Add the payment account or mobile money number.',
    });
  }
  return missing;
}

function portalEmployeeProfile(employee) {
  var statutory = employeeStatutory(employee);
  var bank = employeeBank(employee);
  return {
    employee_code: employee.employee_code || '',
    full_name: employee.full_name || '',
    preferred_name: employee.preferred_name || '',
    email: employee.email || '',
    phone: employee.phone || '',
    country_code: employee.country_code || '',
    currency_code: employee.currency_code || '',
    department: employee.department || '',
    role_title: employee.role_title || '',
    employment_type: employee.employment_type || '',
    hire_date: employee.hire_date || '',
    status: employee.status || '',
    statutory_ids: statutory,
    bank_meta: bank,
    confirmed_at: safeJson(employee.pay_setup, {}).employee_portal_confirmed_at || null,
  };
}

function portalRunRow(row) {
  return {
    row_position: row.row_position,
    employee_name: row.employee_name,
    role_title: row.role_title,
    department: row.department,
    country_code: row.country_code,
    currency_code: row.currency_code,
    gross_pay: toNumber(row.gross_pay),
    allowances: toNumber(row.allowances),
    overtime_pay: toNumber(row.overtime_pay),
    custom_deductions: toNumber(row.custom_deductions),
    employee_deductions: toNumber(row.employee_deductions),
    employer_cost: toNumber(row.employer_cost),
    net_pay: toNumber(row.net_pay),
    calculation_mode: row.calculation_mode,
    country_pack_status: row.country_pack_status,
    warning_level: row.warning_level,
    warning_text: row.warning_text,
    row_status: row.row_status,
    updated_at: row.updated_at,
  };
}

function portalPayslipRecord(payslip) {
  var snapshot = safeJson(payslip.payload_snapshot, {});
  return {
    payslip_no: payslip.payslip_no || '',
    status: payslip.status || '',
    language_lane: payslip.language_lane || 'en',
    template_key: payslip.template_key || 'standard',
    generated_at: payslip.generated_at,
    sent_at: payslip.sent_at,
    has_storage_packet: Boolean(payslip.storage_bucket && payslip.storage_path),
    storage_label: payslip.storage_bucket && payslip.storage_path ? payslip.storage_bucket + '/' + payslip.storage_path : '',
    checksum: payslip.checksum || '',
    payload_snapshot: snapshot,
  };
}

async function loadPortalPayload(invite) {
  var runResult = await supabaseRequest('/rest/v1/payroll_runs?' + qs({
    id: 'eq.' + invite.run_id,
    client_id: 'eq.' + invite.client_id,
    select: 'id,title,pay_period_start,pay_period_end,pay_date,default_country,default_currency,language_lane,status,approval_status,updated_at',
    limit: '1',
  }));
  if (!runResult.ok) throw new Error('Employee portal run load failed: ' + runResult.text);
  var run = Array.isArray(runResult.data) ? runResult.data[0] : null;
  if (!run) return { statusCode: 404, body: { error: 'Payroll run is no longer available' } };

  var companyResult = await supabaseRequest('/rest/v1/payroll_companies?' + qs({
    id: 'eq.' + invite.company_id,
    client_id: 'eq.' + invite.client_id,
    select: 'id,legal_name,trading_name,country_code,currency_code,status',
    limit: '1',
  }));
  if (!companyResult.ok) throw new Error('Employee portal company load failed: ' + companyResult.text);
  var company = Array.isArray(companyResult.data) ? companyResult.data[0] : null;

  var employeeResult = await supabaseRequest('/rest/v1/payroll_employees?' + qs({
    id: 'eq.' + invite.employee_id,
    client_id: 'eq.' + invite.client_id,
    company_id: 'eq.' + invite.company_id,
    select: EMPLOYEE_SELECT,
    limit: '1',
  }));
  if (!employeeResult.ok) throw new Error('Employee portal profile load failed: ' + employeeResult.text);
  var employee = Array.isArray(employeeResult.data) ? employeeResult.data[0] : null;
  if (!employee) return { statusCode: 404, body: { error: 'Employee record is no longer available' } };

  var rowsResult = await supabaseRequest('/rest/v1/payroll_run_rows?' + qs({
    run_id: 'eq.' + invite.run_id,
    employee_id: 'eq.' + invite.employee_id,
    select: 'id,row_position,employee_name,role_title,department,country_code,currency_code,gross_pay,allowances,overtime_pay,custom_deductions,employee_deductions,employer_cost,net_pay,calculation_mode,country_pack_status,warning_level,warning_text,row_status,updated_at',
    order: 'row_position.asc',
    limit: '20',
  }));
  if (!rowsResult.ok) throw new Error('Employee portal row load failed: ' + rowsResult.text);

  var payslipResult = await supabaseRequest('/rest/v1/payroll_payslips?' + qs({
    run_id: 'eq.' + invite.run_id,
    employee_id: 'eq.' + invite.employee_id,
    select: 'id,payslip_no,status,language_lane,template_key,payload_snapshot,storage_bucket,storage_path,checksum,generated_at,sent_at,updated_at',
    order: 'generated_at.desc',
    limit: '24',
  }));
  if (!payslipResult.ok) throw new Error('Employee portal payslip load failed: ' + payslipResult.text);

  return {
    statusCode: 200,
    body: {
      portal: {
        invite_id: invite.id,
        status: invite.status,
        expires_at: invite.expires_at,
        last_viewed_at: invite.last_viewed_at,
        confirmed_at: invite.confirmed_at,
      },
      company: {
        legal_name: company && company.legal_name || '',
        trading_name: company && company.trading_name || '',
        country_code: company && company.country_code || run.default_country || '',
        currency_code: company && company.currency_code || run.default_currency || '',
        status: company && company.status || '',
      },
      run: {
        title: run.title,
        pay_period_start: run.pay_period_start,
        pay_period_end: run.pay_period_end,
        pay_date: run.pay_date,
        country_code: run.default_country,
        currency_code: run.default_currency,
        language_lane: run.language_lane,
        status: run.status,
        approval_status: run.approval_status,
        updated_at: run.updated_at,
      },
      employee: portalEmployeeProfile(employee),
      missing_information: portalMissingProfileFields(employee),
      rows: (Array.isArray(rowsResult.data) ? rowsResult.data : []).map(portalRunRow),
      payslips: (Array.isArray(payslipResult.data) ? payslipResult.data : []).map(portalPayslipRecord),
      guardrail: 'This employee portal shows only the employee and payroll run assigned to this invite link. It does not file taxes or move money.',
    },
  };
}

async function handleEmployeePortal(params) {
  var loaded = await loadPortalInvite(params && params.token);
  if (loaded.statusCode !== 200) return loaded;

  var payload = await loadPortalPayload(loaded.invite);
  if (payload.statusCode === 200) {
    await supabaseRequest('/rest/v1/payroll_employee_portal_invites?id=eq.' + encodeURIComponent(loaded.invite.id), {
      method: 'PATCH',
      body: {
        last_viewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  }
  return payload;
}

async function handleEmployeeProfileConfirm(body) {
  var loaded = await loadPortalInvite(body && body.token);
  if (loaded.statusCode !== 200) return loaded;
  var invite = loaded.invite;
  var currentPayload = await loadPortalPayload(invite);
  if (currentPayload.statusCode !== 200) return currentPayload;

  var employeeResult = await supabaseRequest('/rest/v1/payroll_employees?' + qs({
    id: 'eq.' + invite.employee_id,
    client_id: 'eq.' + invite.client_id,
    select: EMPLOYEE_SELECT,
    limit: '1',
  }));
  if (!employeeResult.ok) throw new Error('Employee confirmation profile load failed: ' + employeeResult.text);
  var employee = Array.isArray(employeeResult.data) ? employeeResult.data[0] : null;
  if (!employee) return { statusCode: 404, body: { error: 'Employee record is no longer available' } };

  var profile = safeJson(body && body.profile, {});
  var emailInput = sanitizeText(profile.email, 180);
  var email = sanitizeEmail(emailInput);
  if (emailInput && !email) return { statusCode: 400, body: { error: 'Valid email is required' } };

  var now = new Date().toISOString();
  var statutory = Object.assign({}, safeJson(employee.statutory_ids, {}));
  var bank = Object.assign({}, safeJson(employee.bank_meta, {}));
  var paySetup = Object.assign({}, safeJson(employee.pay_setup, {}), {
    employee_portal_confirmed_at: now,
    employee_portal_invite_id: invite.id,
  });

  var taxId = sanitizeText(profile.tax_id || profile.taxId, 120);
  var socialId = sanitizeText(profile.pension_social_security_id || profile.socialSecurityId || profile.social_id, 120);
  var bankName = sanitizeText(profile.bank_name || profile.bankName, 140);
  var account = sanitizeText(profile.account_or_mobile || profile.bankAccountOrMobile || profile.mobile_money_number, 160);
  if (taxId) statutory.tax_id = taxId;
  if (socialId) statutory.pension_social_security_id = socialId;
  if (bankName) bank.bank_name = bankName;
  if (account) bank.account_or_mobile = account;

  var updateBody = {
    preferred_name: sanitizeText(profile.preferred_name || profile.preferredName, 160) || employee.preferred_name || null,
    email: email || employee.email || null,
    phone: sanitizeText(profile.phone, 80) || employee.phone || null,
    statutory_ids: statutory,
    bank_meta: bank,
    pay_setup: paySetup,
    updated_at: now,
  };

  var updateResult = await supabaseRequest('/rest/v1/payroll_employees?id=eq.' + encodeURIComponent(invite.employee_id) + '&client_id=eq.' + encodeURIComponent(invite.client_id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: updateBody,
  });
  if (!updateResult.ok) throw new Error('Employee profile confirmation failed: ' + updateResult.text);

  await supabaseRequest('/rest/v1/payroll_employee_portal_invites?id=eq.' + encodeURIComponent(invite.id), {
    method: 'PATCH',
    body: {
      confirmed_at: now,
      metadata: Object.assign({}, safeJson(invite.metadata, {}), {
        confirmed_at: now,
        confirmation_source: 'employee_portal',
      }),
      updated_at: now,
    },
  });
  await audit(invite.client_id, null, 'employee_confirm_profile', 'payroll_employees', invite.employee_id, 'Employee confirmed profile details from portal', {
    run_id: invite.run_id,
    company_id: invite.company_id,
    invite_id: invite.id,
  });

  var refreshedInvite = Object.assign({}, invite, { confirmed_at: now, last_viewed_at: now });
  var refreshed = await loadPortalPayload(refreshedInvite);
  if (refreshed.statusCode === 200) refreshed.body.confirmed = true;
  return refreshed;
}

async function handleCreateEmployeePortalInvite(user, body, event) {
  var runId = normalizeRunId(body);
  var checked = await requireRunAccess(user, runId, EDIT_PAYROLL_ROLES, 'Not allowed to create employee portal links');
  if (checked.statusCode !== 200) return checked;
  var run = checked.accessResult.run;
  var employeeId = sanitizeText(body && (body.employee_id || body.employeeId || body.cloudEmployeeId), 80);
  if (!isUuid(employeeId)) {
    return { statusCode: 400, body: { error: 'A synced employee record is required for portal invites' } };
  }

  var rowResult = await supabaseRequest('/rest/v1/payroll_run_rows?' + qs({
    run_id: 'eq.' + run.id,
    employee_id: 'eq.' + employeeId,
    select: 'id,employee_id,employee_name,row_position,row_status',
    order: 'row_position.asc',
    limit: '1',
  }));
  if (!rowResult.ok) throw new Error('Employee invite row lookup failed: ' + rowResult.text);
  var row = Array.isArray(rowResult.data) ? rowResult.data[0] : null;
  if (!row) {
    return { statusCode: 400, body: { error: 'Employee must be linked to this synced payroll run before creating a portal invite' } };
  }

  var employeeResult = await supabaseRequest('/rest/v1/payroll_employees?' + qs({
    id: 'eq.' + employeeId,
    client_id: 'eq.' + run.client_id,
    company_id: 'eq.' + run.company_id,
    select: EMPLOYEE_SELECT,
    limit: '1',
  }));
  if (!employeeResult.ok) throw new Error('Employee invite profile lookup failed: ' + employeeResult.text);
  var employee = Array.isArray(employeeResult.data) ? employeeResult.data[0] : null;
  if (!employee) return { statusCode: 404, body: { error: 'Employee record not found for this client and company' } };

  var token = createPortalToken();
  var expiresAt = new Date(Date.now() + EMPLOYEE_PORTAL_INVITE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  var created = await supabaseRequest('/rest/v1/payroll_employee_portal_invites', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: {
      client_id: run.client_id,
      company_id: run.company_id,
      run_id: run.id,
      employee_id: employee.id,
      token_hash: tokenHash(token),
      invited_email: sanitizeEmail(body && (body.email || body.invited_email)) || sanitizeEmail(employee.email) || null,
      status: 'active',
      expires_at: expiresAt,
      created_by: user.id,
      metadata: {
        source: 'afropayroll_workspace',
        row_id: row.id,
        run_title: run.title,
      },
    },
  });
  if (!created.ok) {
    if (portalSchemaError(created)) throw new Error(portalSchemaHint());
    throw new Error('Employee portal invite create failed: ' + created.text);
  }
  var invite = Array.isArray(created.data) ? created.data[0] : created.data;
  await audit(run.client_id, user, 'create_employee_portal_invite', 'payroll_employee_portal_invites', invite && invite.id, 'Created employee portal invite link', {
    run_id: run.id,
    company_id: run.company_id,
    employee_id: employee.id,
    row_id: row.id,
    expires_at: expiresAt,
  });
  return {
    statusCode: 200,
    body: {
      invited: true,
      url: employeePortalUrl(event, token),
      expires_at: expiresAt,
      invite: {
        id: invite && invite.id,
        run_id: run.id,
        employee_id: employee.id,
        invited_email: invite && invite.invited_email || null,
        status: invite && invite.status || 'active',
      },
    },
  };
}

function workflowActionLabel(targetState) {
  var labels = {
    review: 'Moved payroll run to review',
    approved: 'Approved payroll run',
    finalized: 'Finalized payroll run',
    exported: 'Marked payroll run exported',
    reopened: 'Reopened payroll run',
  };
  return labels[targetState] || 'Updated payroll run state';
}

function workflowApprovalStatus(targetState) {
  if (targetState === 'review') return 'pending';
  return targetState;
}

async function insertWorkflowComment(run, user, targetState, note) {
  if (!note) return null;
  var result = await supabaseRequest('/rest/v1/payroll_workspace_comments', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: {
      client_id: run.client_id,
      run_id: run.id,
      author_id: user.id,
      visibility: 'team',
      body: workflowActionLabel(targetState) + ': ' + note,
    },
  });
  if (!result.ok) throw new Error('Reviewer comment save failed: ' + result.text);
  return Array.isArray(result.data) ? result.data[0] : result.data;
}

async function writeApprovalRecord(run, user, targetState, note, body, now) {
  var stepLabel = sanitizeText(body && body.step_label || body && body.stepLabel, 120) || 'Payroll review';
  var patchTargets = targetState === 'approved' || targetState === 'review';
  if (patchTargets) {
    var patchResult = await supabaseRequest('/rest/v1/payroll_approvals?' + qs({
      run_id: 'eq.' + run.id,
      status: 'in.(pending,submitted,review,changes_requested)',
    }), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: {
        status: workflowApprovalStatus(targetState),
        assigned_to: user.id,
        note: note || null,
        acted_at: now,
      },
    });
    if (!patchResult.ok) throw new Error('Approval chain update failed: ' + patchResult.text);
    if (Array.isArray(patchResult.data) && patchResult.data.length) return patchResult.data;
  }

  var insertResult = await supabaseRequest('/rest/v1/payroll_approvals', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: {
      client_id: run.client_id,
      run_id: run.id,
      requested_by: targetState === 'review' ? user.id : null,
      assigned_to: targetState === 'review' ? null : user.id,
      step_label: stepLabel,
      status: workflowApprovalStatus(targetState),
      note: note || null,
      acted_at: targetState === 'review' ? null : now,
    },
  });
  if (!insertResult.ok) throw new Error('Approval chain insert failed: ' + insertResult.text);
  return Array.isArray(insertResult.data) ? insertResult.data : [];
}

function buildApprovalSummary(run, approvals, comments) {
  var records = Array.isArray(approvals) ? approvals : [];
  var latest = null;
  records.forEach(function (record) {
    if (!latest || String(record.acted_at || record.updated_at || record.created_at || '') > String(latest.acted_at || latest.updated_at || latest.created_at || '')) {
      latest = record;
    }
  });
  function latestByStatus(status) {
    return records.filter(function (record) { return record.status === status; }).sort(function (a, b) {
      return String(b.acted_at || b.created_at || '').localeCompare(String(a.acted_at || a.created_at || ''));
    })[0] || null;
  }
  var submitted = latestByStatus('review') || latestByStatus('submitted') || latestByStatus('pending');
  var approved = latestByStatus('approved');
  var finalized = latestByStatus('finalized');
  var reopened = latestByStatus('reopened');
  var changeRequest = latestByStatus('changes_requested') || latestByStatus('rejected');
  return {
    state: canonicalRunState(run && run.status),
    approvalStatus: approvalStatusForRunState(run && run.status, run && run.approval_status),
    submittedBy: submitted && (submitted.requested_by || submitted.assigned_to) || '',
    submittedAt: submitted && (submitted.created_at || submitted.acted_at) || '',
    approvedBy: approved && (approved.assigned_to || approved.requested_by) || run && run.approved_by || '',
    approvedAt: approved && (approved.acted_at || approved.updated_at || approved.created_at) || run && run.approved_at || '',
    finalizedBy: finalized && (finalized.assigned_to || finalized.requested_by) || '',
    finalizedAt: finalized && (finalized.acted_at || finalized.updated_at || finalized.created_at) || '',
    reopenedBy: reopened && (reopened.assigned_to || reopened.requested_by) || '',
    reopenedAt: reopened && (reopened.acted_at || reopened.updated_at || reopened.created_at) || '',
    changesRequestedBy: changeRequest && (changeRequest.assigned_to || changeRequest.requested_by) || '',
    changesRequestedAt: changeRequest && (changeRequest.acted_at || changeRequest.updated_at || changeRequest.created_at) || '',
    lastApprovalActor: latest && (latest.assigned_to || latest.requested_by) || '',
    lastApprovalAt: latest && (latest.acted_at || latest.updated_at || latest.created_at) || '',
    lastApprovalNote: latest && latest.note || '',
    approvals: records.slice(-12),
    comments: (Array.isArray(comments) ? comments : []).slice(0, 20),
  };
}

async function loadApprovalSummary(run) {
  if (!run || !run.id) return buildApprovalSummary(run, [], []);
  var approvalsResult = await supabaseRequest('/rest/v1/payroll_approvals?' + qs({
    run_id: 'eq.' + run.id,
    select: 'id,requested_by,assigned_to,step_label,status,note,acted_at,created_at,updated_at',
    order: 'created_at.asc',
    limit: '80',
  }));
  if (!approvalsResult.ok) throw new Error('Approval summary load failed: ' + approvalsResult.text);
  var commentsResult = await supabaseRequest('/rest/v1/payroll_workspace_comments?' + qs({
    run_id: 'eq.' + run.id,
    select: 'id,author_id,visibility,body,created_at,resolved_at',
    order: 'created_at.desc',
    limit: '20',
  }));
  if (!commentsResult.ok) throw new Error('Reviewer comments load failed: ' + commentsResult.text);
  return buildApprovalSummary(run, Array.isArray(approvalsResult.data) ? approvalsResult.data : [], Array.isArray(commentsResult.data) ? commentsResult.data : []);
}

async function handleWorkflowTransition(user, body, targetState, roles, message) {
  var runId = normalizeRunId(body);
  var checked = await requireRunAccess(user, runId, roles, message || 'Not allowed to update this payroll workflow');
  if (checked.statusCode !== 200) return checked;
  var run = checked.accessResult.run;
  var fromState = canonicalRunState(run.status);
  var toState = canonicalRunState(targetState);
  if (!canTransitionRun(fromState, toState)) {
    return {
      statusCode: 409,
      body: {
        error: 'Invalid payroll approval transition',
        from_state: fromState,
        to_state: toState,
      },
    };
  }

  var note = sanitizeText(body && (body.note || body.comment || body.reviewer_comment || body.reviewerComment), 1000);
  if (toState === 'reopened' && !note) {
    return {
      statusCode: 400,
      body: { error: 'Reopen reason is required' },
    };
  }
  var now = new Date().toISOString();
  var approvals = await writeApprovalRecord(run, user, toState, note, body, now);
  var comment = await insertWorkflowComment(run, user, toState, note);
  var runPatch = {
    status: toState,
    approval_status: approvalStatusForRunState(toState),
    updated_by: user.id,
  };
  if (toState === 'approved') {
    runPatch.approved_by = user.id;
    runPatch.approved_at = now;
  }
  if (toState === 'review' || toState === 'reopened') {
    runPatch.approved_by = null;
    runPatch.approved_at = null;
  }
  var updateResult = await supabaseRequest('/rest/v1/payroll_runs?id=eq.' + encodeURIComponent(run.id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: runPatch,
  });
  if (!updateResult.ok) throw new Error('Run workflow state update failed: ' + updateResult.text);
  var updatedRun = Array.isArray(updateResult.data) ? updateResult.data[0] : updateResult.data;
  var approvalSummary = await loadApprovalSummary(updatedRun || Object.assign({}, run, runPatch));
  await audit(run.client_id, user, 'state_change_' + toState, 'payroll_runs', run.id, workflowActionLabel(toState), {
    before_state: {
      status: run.status,
      approval_status: run.approval_status,
    },
    run_id: run.id,
    company_id: run.company_id,
    from_state: fromState,
    to_state: toState,
    note: note,
    actor_email: user.email || '',
  });
  return {
    statusCode: 200,
    body: {
      state: toState,
      approvals: approvals,
      comment: comment,
      run: updatedRun,
      approval_summary: approvalSummary,
    },
  };
}

async function handleApprovalRequest(user, body) {
  return handleWorkflowTransition(user, body, 'review', EDIT_PAYROLL_ROLES, 'Not allowed to submit this payroll run for approval');
}

async function handleApprovalDecision(user, body, decision) {
  return handleWorkflowTransition(user, body, decision === 'approved' ? 'approved' : 'review', APPROVE_PAYROLL_ROLES, 'Not allowed to approve or request changes for this payroll run');
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
      employee_id: row.employee_id || null,
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
  var allowed = [
    'roster_csv',
    'payroll_summary_csv',
    'review_warnings_csv',
    'bank_payment_csv',
    'mobile_money_csv',
    'missing_payment_details_csv',
    'accounting_journal_csv',
    'payment_handoff_note_md',
    'handoff_note_md',
    'compliance_evidence_md',
    'payslip_pdf',
    'payslip_zip',
    'statutory_pack_csv',
    'statutory_pack_pdf',
    'branded_packet_zip',
    'other',
  ];
  if (!allowed.includes(exportType)) exportType = 'other';
  var fromState = canonicalRunState(run.status);
  if (body && body.mark_exported === true && fromState !== 'finalized') {
    return {
      statusCode: 409,
      body: {
        error: 'Only finalized payroll runs can be marked exported',
        from_state: fromState,
      },
    };
  }
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
  var shouldMarkExported = body && body.mark_exported === true && fromState === 'finalized';
  var nextState = shouldMarkExported ? 'exported' : fromState;
  var updateResult = await supabaseRequest('/rest/v1/payroll_runs?id=eq.' + encodeURIComponent(run.id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: {
      status: nextState,
      approval_status: shouldMarkExported ? approvalStatusForRunState('exported') : approvalStatusForRunState(fromState, run.approval_status),
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
  if (shouldMarkExported && fromState !== 'exported') {
    await audit(run.client_id, user, 'state_change_exported', 'payroll_runs', run.id, workflowActionLabel('exported'), {
      before_state: {
        status: run.status,
        approval_status: run.approval_status,
      },
      run_id: run.id,
      company_id: run.company_id,
      from_state: fromState,
      to_state: 'exported',
      export_type: exportType,
      actor_email: user.email || '',
    });
  }
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

  var clientResult = await supabaseRequest('/rest/v1/payroll_clients?' + qs({
    id: 'eq.' + accessResult.run.client_id,
    select: CLIENT_SELECT,
    limit: '1',
  }));
  if (!clientResult.ok) throw new Error('Client load failed: ' + clientResult.text);

  var companyResult = await supabaseRequest('/rest/v1/payroll_companies?' + qs({
    id: 'eq.' + accessResult.run.company_id,
    select: COMPANY_SELECT,
    limit: '1',
  }));
  if (!companyResult.ok) throw new Error('Company load failed: ' + companyResult.text);

  var rowsResult = await supabaseRequest('/rest/v1/payroll_run_rows?' + qs({
    run_id: 'eq.' + accessResult.run.id,
    select: 'id,employee_id,row_position,employee_name,role_title,department,country_code,currency_code,gross_pay,allowances,overtime_pay,unpaid_days,unpaid_amount,custom_deductions,preview_gross,employee_deductions,employer_cost,net_pay,calculation_mode,country_pack_status,engine_key,warning_text,row_status,line_payload,calculation_snapshot,updated_at',
    order: 'row_position.asc',
    limit: String(MAX_ROWS),
  }));
  if (!rowsResult.ok) throw new Error('Run rows load failed: ' + rowsResult.text);

  var employeesResult = await supabaseRequest('/rest/v1/payroll_employees?' + qs({
    company_id: 'eq.' + accessResult.run.company_id,
    select: 'id,employee_code,external_ref,full_name,email,phone,country_code,role_title,department,employment_type,hire_date,statutory_ids,bank_meta,pay_setup,status,updated_at',
    order: 'full_name.asc',
    limit: String(MAX_EMPLOYEES),
  }));
  if (!employeesResult.ok) throw new Error('Employee records load failed: ' + employeesResult.text);

  var client = Array.isArray(clientResult.data) ? clientResult.data[0] : null;
  var company = Array.isArray(companyResult.data) ? companyResult.data[0] : null;
  var rows = Array.isArray(rowsResult.data) ? rowsResult.data : [];
  var employees = Array.isArray(employeesResult.data) ? employeesResult.data : [];
  var approvalSummary = await loadApprovalSummary(accessResult.run);
  return {
    statusCode: 200,
    body: {
      run: accessResult.run,
      client: client,
      company: company,
      rows: rows,
      employees: employees,
      approval_summary: approvalSummary,
      workspaceState: toWorkspaceState(accessResult.run, client, company, rows, employees, approvalSummary),
    },
  };
}

function toWorkspaceEmployee(employee) {
  employee = safeJson(employee, {});
  var statutory = safeJson(employee.statutory_ids, {});
  var bank = safeJson(employee.bank_meta, {});
  var paySetup = safeJson(employee.pay_setup, {});
  return {
    id: sanitizeText(paySetup.local_employee_id || employee.external_ref || employee.id, 120),
    cloudEmployeeId: employee.id || '',
    employeeId: employee.employee_code || '',
    name: employee.full_name || '',
    email: employee.email || '',
    phone: employee.phone || '',
    country: employee.country_code || '',
    taxId: statutory.tax_id || '',
    socialSecurityId: statutory.pension_social_security_id || '',
    bankName: bank.bank_name || '',
    bankAccountOrMobile: bank.account_or_mobile || '',
    department: employee.department || '',
    role: employee.role_title || '',
    startDate: employee.hire_date || '',
    employmentType: employee.employment_type || 'employee',
    status: employee.status === 'inactive' ? 'inactive' : 'active',
  };
}

function toWorkspaceState(run, client, company, rows, employees, approvalSummary) {
  var payPeriod = run.pay_period_start ? String(run.pay_period_start).slice(0, 7) : '';
  var workspaceEmployees = (Array.isArray(employees) ? employees : []).map(toWorkspaceEmployee);
  var clientSettings = safeJson(client && client.settings, {});
  var companySettings = safeJson(company && company.payroll_settings, {});
  var clientMeta = normalizeClientMeta({
    id: run.client_id,
    companyId: run.company_id,
    name: client && client.name || company && company.legal_name || run.title,
    companyName: company && company.legal_name || run.title,
    country: run.default_country || company && company.country_code,
    defaultCurrency: run.default_currency || company && company.currency_code,
    payrollContact: clientSettings.payroll_contact || client && client.billing_email,
    reviewerEmail: clientSettings.reviewer_email,
    defaultPayDay: clientSettings.default_pay_day || companySettings.default_pay_day,
    status: client && client.status,
  }, {});
  return {
    id: run.id,
    cloudRunId: run.id,
    cloudClientId: run.client_id,
    cloudCompanyId: run.company_id,
    client: clientMeta,
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
      approvalStatus: approvalStatusForRunState(run.status, run.approval_status),
      approvalState: canonicalRunState(run.status),
      exportedCount: run.exported_count || 0,
      approvedBy: approvalSummary && approvalSummary.approvedBy || run.approved_by || '',
      approvedAt: approvalSummary && approvalSummary.approvedAt || run.approved_at || '',
      lastApprovalActor: approvalSummary && approvalSummary.lastApprovalActor || '',
      lastApprovalAt: approvalSummary && approvalSummary.lastApprovalAt || '',
      lastApprovalNote: approvalSummary && approvalSummary.lastApprovalNote || '',
      approvalSummary: approvalSummary || buildApprovalSummary(run, [], []),
    },
    employees: workspaceEmployees,
    rows: rows.map(function (row) {
      return {
        id: row.line_payload && row.line_payload.local_row_id || row.id,
        cloudRowId: row.id,
        employeeRecordId: row.line_payload && row.line_payload.local_employee_id || row.employee_id || '',
        cloudEmployeeId: row.employee_id || '',
        name: row.employee_name || '',
        role: row.role_title || row.department || '',
        department: row.department || '',
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

async function handleSaveClient(user, body) {
  if (payloadSizeBytes(body) > MAX_PAYLOAD_BYTES) {
    return { statusCode: 413, body: { error: 'Client payload is too large' } };
  }

  var clientMeta = normalizeClientMeta(body && body.client, {
    companyName: 'AfroPayroll workspace',
    defaultCountry: 'NG',
  });
  if (!clientMeta.name) {
    return { statusCode: 400, body: { error: 'Client name is required' } };
  }

  var client;
  var access;
  if (isUuid(clientMeta.clientId)) {
    access = await getAccessRecord(user, clientMeta.clientId);
    if (!access || !access.client || !EDIT_PAYROLL_ROLES.includes(access.role)) {
      return { statusCode: 403, body: { error: 'Not allowed to edit this payroll client' } };
    }
    client = await syncClientRecord(access.client, {
      companyName: clientMeta.companyName,
      defaultCountry: clientMeta.country,
      defaultCurrency: clientMeta.defaultCurrency,
      languageLane: sanitizeText(body && body.languageLane, 4) || 'en',
      client: clientMeta,
    }, user);
  } else {
    var created = await supabaseRequest('/rest/v1/payroll_clients', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: {
        owner_id: user.id,
        name: clientMeta.name,
        client_type: 'accounting_client',
        default_country: clientMeta.country,
        default_currency: clientMeta.defaultCurrency || null,
        language_lane: normalizeLanguage(body && body.languageLane),
        billing_email: clientMeta.payrollContact || null,
        settings: clientSettingsFromMeta(clientMeta, { created_from: 'afropayroll_workspace' }),
        status: clientMeta.status,
      },
    });
    if (!created.ok) throw new Error('Client create failed: ' + created.text);
    client = Array.isArray(created.data) ? created.data[0] : created.data;
    access = { client: client, role: 'owner' };
  }

  var company = await ensureCompany(client, {
    companyName: clientMeta.companyName || clientMeta.name,
    defaultCountry: clientMeta.country,
    defaultCurrency: clientMeta.defaultCurrency,
    client: Object.assign({}, clientMeta, { clientId: client.id }),
  }, user);

  await audit(client.id, user, 'save_client', 'payroll_clients', client.id, 'Saved AfroPayroll client metadata', {
    client_id: client.id,
    company_id: company && company.id,
    role: access && access.role,
  });

  return {
    statusCode: 200,
    body: {
      ok: true,
      client: workspaceClientFromRecords(client, company, access && access.role || 'owner', []),
      company: company,
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
  if (!client) {
    return { statusCode: 403, body: { error: 'Selected payroll client is not accessible' } };
  }
  var access = await getAccessRecord(user, client.id);
  if (!access || !EDIT_PAYROLL_ROLES.includes(access.role)) {
    return { statusCode: 403, body: { error: 'Not allowed to edit this payroll workspace' } };
  }

  client = await syncClientRecord(client, run, user);
  var company = await ensureCompany(client, run, user);
  var existingRunResult = await supabaseRequest('/rest/v1/payroll_runs?' + qs({
    company_id: 'eq.' + company.id,
    run_key: 'eq.' + run.runKey,
    select: 'id,status,approval_status,approved_by,approved_at,exported_count,created_at,updated_at',
    limit: '1',
  }));
  if (!existingRunResult.ok) throw new Error('Existing run lookup failed: ' + existingRunResult.text);
  var existingRun = Array.isArray(existingRunResult.data) ? existingRunResult.data[0] : null;
  if (existingRun && isRunLockedForRows(existingRun.status)) {
    return {
      statusCode: 409,
      body: {
        error: 'Payroll row editing is locked after approval, finalization, or export. Reopen the synced run before saving row changes.',
        state: canonicalRunState(existingRun.status),
      },
    };
  }
  var employeeMap = await ensureEmployees(client, company, run, user);
  var runPayload = buildRunPayload(client, company, run, user);
  if (existingRun && existingRun.id) {
    runPayload.status = existingRun.status;
    runPayload.approval_status = existingRun.approval_status || approvalStatusForRunState(existingRun.status);
    runPayload.exported_count = clampInteger(existingRun.exported_count, 0, 0, 100000);
  } else if (runPayload.status !== 'draft') {
    runPayload.status = 'draft';
    runPayload.approval_status = 'not_requested';
  }
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
    return buildRowPayload(client, savedRun, run, user, row, index, employeeMap);
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
    employee_count: run.employees.length,
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
        runStatus: mapRunStatusToWorkspace(savedRun.status),
        savedAt: savedRun.updated_at || new Date().toISOString(),
        workflow: Object.assign({}, safeJson(run.workflow, {}), {
          approvalStatus: approvalStatusForRunState(savedRun.status, savedRun.approval_status),
          approvalState: mapRunStatusToWorkspace(savedRun.status),
          exportedCount: clampInteger(savedRun.exported_count, 0, 0, 100000),
        }),
        employees: run.employees.map(function (employee) {
          var savedEmployee = findLinkedEmployee({
            employeeRecordId: employee.localId,
            employeeId: employee.employeeId,
            employeeCode: employee.employeeId,
            cloudEmployeeId: employee.cloudEmployeeId,
            name: employee.name,
            country: employee.country,
          }, employeeMap);
          return Object.assign({}, employee, {
            id: employee.localId,
            cloudEmployeeId: savedEmployee && savedEmployee.id || employee.cloudEmployeeId || '',
            employeeId: employee.employeeId || '',
          });
        }),
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

  var auth = null;
  try {
    var params = event.queryStringParameters || {};

    if (event.httpMethod === 'GET' && params.action === 'employee_portal') {
      var portal = await handleEmployeePortal(params);
      return jsonResponse(portal.statusCode, portal.body);
    }

    var parsedBody = null;
    if (event.httpMethod === 'POST') {
      try {
        parsedBody = JSON.parse(event.body || '{}');
      } catch (error) {
        return jsonResponse(400, { error: 'Invalid JSON' });
      }
      if (sanitizeText(parsedBody.action, 80) === 'employee_confirm_profile') {
        var confirmed = await handleEmployeeProfileConfirm(parsedBody);
        return jsonResponse(confirmed.statusCode, confirmed.body);
      }
    }

    auth = await requireUser(event);
    if (!auth.user) {
      return jsonResponse(401, { error: 'Unauthorized' }, auth.sessionResponse);
    }

    if (event.httpMethod === 'GET') {
      if (params.action === 'dashboard') {
        var dashboard = await handleDashboard(auth.user, params);
        return jsonResponse(200, dashboard, auth.sessionResponse);
      }
      if (params.action === 'clients') {
        var clients = await handleClients(auth.user, params);
        return jsonResponse(200, clients, auth.sessionResponse);
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
      var body = parsedBody || {};
      var action = sanitizeText(body.action, 80) || 'save_run';
      var result;
      if (action === 'save_run') result = await handleSave(auth.user, body);
      else if (action === 'save_client') result = await handleSaveClient(auth.user, body);
      else if (action === 'submit_run') result = await handleWorkflowTransition(auth.user, body, 'review', EDIT_PAYROLL_ROLES, 'Not allowed to submit this payroll run for approval');
      else if (action === 'request_approval') result = await handleApprovalRequest(auth.user, body);
      else if (action === 'request_changes') result = await handleWorkflowTransition(auth.user, body, 'review', APPROVE_PAYROLL_ROLES, 'Not allowed to request changes for this payroll run');
      else if (action === 'approve_run') result = await handleApprovalDecision(auth.user, body, 'approved');
      else if (action === 'reject_run') result = await handleApprovalDecision(auth.user, body, 'rejected');
      else if (action === 'finalize_run') result = await handleWorkflowTransition(auth.user, body, 'finalized', APPROVE_PAYROLL_ROLES, 'Not allowed to finalize this payroll run');
      else if (action === 'reopen_run') result = await handleWorkflowTransition(auth.user, body, 'reopened', APPROVE_PAYROLL_ROLES, 'Not allowed to reopen this payroll run');
      else if (action === 'generate_payslips') result = await handleGeneratePayslips(auth.user, body);
      else if (action === 'generate_statutory_packs') result = await handleGenerateStatutoryPacks(auth.user, body);
      else if (action === 'record_export') result = await handleRecordExport(auth.user, body);
      else if (action === 'record_import') result = await handleImportLog(auth.user, body);
      else if (action === 'invite_member') result = await handleInviteMember(auth.user, body);
      else if (action === 'create_employee_portal_invite') result = await handleCreateEmployeePortalInvite(auth.user, body, event);
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
    }, auth && auth.sessionResponse);
  }
};
