#!/usr/bin/env node
"use strict";

/**
 * Safe AfroHR People OS QA fixture harness.
 *
 * Default mode is dry-run. Live writes require:
 * - --live
 * - AFROHR_QA_CONFIRM=1
 * - AFROHR_QA_TAG or --tag
 * - AFROHR_QA_ACCESS_TOKEN for the signed-in QA user
 * - AFROHR_QA_EMAIL or AFROHR_QA_USER_ID for a clearly safe QA identity
 * - SUPABASE_AUTH_ANON_KEY, SUPABASE_ANON_KEY, or SUPABASE_PUBLISHABLE_KEY
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROUTE = "pro/apps/hr/index.html";
const STORAGE_KEY = "afrohr_people_os_demo_v1";
const PAYROLL_EMPLOYEE_KEY = "afropayroll_pro_employee_master";
const FIXTURE_SOURCE = "afrohr-qa-fixture";

const PEOPLE_TABLES = [
  "hr_clients",
  "hr_organizations",
  "hr_employees",
  "hr_employee_contacts",
  "hr_employee_payroll_profiles",
  "hr_contracts",
  "hr_letters",
  "hr_onboarding_tasks",
  "hr_leave_requests",
  "hr_attendance_events",
  "hr_document_vault_items",
  "hr_missing_detail_requests",
  "hr_payroll_handoffs",
  "hr_people_reports",
  "hr_audit_events",
];

const CLEANUP_TABLES = PEOPLE_TABLES.slice().reverse();

function parseArgs(argv) {
  const args = { mode: "create" };
  argv.slice(2).forEach((arg) => {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--live") args.live = true;
    else if (arg === "--cleanup") args.mode = "cleanup";
    else if (arg === "--baseline") args.mode = "baseline";
    else if (arg === "--tables") args.mode = "tables";
    else if (arg.startsWith("--mode=")) args.mode = arg.slice("--mode=".length);
    else if (arg.startsWith("--tag=")) args.tag = arg.slice("--tag=".length);
  });
  return args;
}

const args = parseArgs(process.argv);
const mode = ["create", "cleanup", "baseline", "tables"].includes(args.mode) ? args.mode : "create";
const explicitTag = args.tag || process.env.AFROHR_QA_TAG || "";
const fixtureTag = sanitizeTag(explicitTag || createTag());
const confirmLive = process.env.AFROHR_QA_CONFIRM === "1";
const dryRun = args.dryRun === true || args.live !== true || !confirmLive;
const supabaseUrl = (process.env.SUPABASE_AUTH_URL || process.env.SUPABASE_URL || "https://zpclagtgczsygrgztlts.supabase.co").replace(/\/+$/g, "");
const anonKey = process.env.SUPABASE_AUTH_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";
const accessToken = process.env.AFROHR_QA_ACCESS_TOKEN || "";
const qaUserId = process.env.AFROHR_QA_USER_ID || "";
const qaEmail = process.env.AFROHR_QA_EMAIL || "";

function sanitizeTag(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function createTag() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `qa_hr_${stamp}_${crypto.randomBytes(3).toString("hex")}`;
}

function rel(file) {
  return path.join(ROOT, file);
}

function read(file) {
  return fs.readFileSync(rel(file), "utf8");
}

function logStep(name, status, detail) {
  const suffix = detail ? ` - ${detail}` : "";
  console.log(`${status.padEnd(8)} ${name}${suffix}`);
}

function fail(message) {
  throw new Error(message);
}

function isSafeQaEmail(email) {
  return /(^qa[._+-]|[._+-]qa[._+-]|test|fixture|sandbox|example\.com)/i.test(String(email || ""));
}

function assertTagForCleanup() {
  if (!explicitTag || !fixtureTag) {
    fail("Cleanup refused. Set AFROHR_QA_TAG or pass --tag with the exact QA fixture tag.");
  }
}

function assertLiveAllowed() {
  if (dryRun) return;
  if (!explicitTag || !fixtureTag) {
    fail("Live writes refused. Set AFROHR_QA_TAG or pass --tag so cleanup can target only this fixture.");
  }
  if (!anonKey) {
    fail("Live writes refused. Set SUPABASE_AUTH_ANON_KEY, SUPABASE_ANON_KEY, or SUPABASE_PUBLISHABLE_KEY.");
  }
  if (!accessToken) {
    fail("Live writes refused. Set AFROHR_QA_ACCESS_TOKEN for a signed-in QA user.");
  }
  if (!qaUserId && !qaEmail) {
    fail("Live writes refused. Set AFROHR_QA_EMAIL or AFROHR_QA_USER_ID for a safe QA user.");
  }
  if (qaEmail && !isSafeQaEmail(qaEmail)) {
    fail("Live writes refused. AFROHR_QA_EMAIL must clearly be QA, test, fixture, sandbox, or example.com.");
  }
}

function localContractCheck() {
  const html = read(ROUTE);
  const missing = [];

  if (!/<meta\s+name=["']pro-required["']\s+content=["']afrotools-pro["']/i.test(html)) {
    missing.push("AfroHR route is missing the Pro gate meta tag");
  }
  if (!/\/assets\/js\/pro-gate\.js/.test(html)) {
    missing.push("AfroHR route does not load pro-gate.js");
  }
  if (!html.includes(STORAGE_KEY)) {
    missing.push(`AfroHR route missing device save key ${STORAGE_KEY}`);
  }
  if (!html.includes(PAYROLL_EMPLOYEE_KEY)) {
    missing.push(`AfroHR route missing Payroll read key ${PAYROLL_EMPLOYEE_KEY}`);
  }
  if (/service[_-]?role|SUPABASE_AUTH_SERVICE_KEY|SUPABASE_SERVICE_KEY/i.test(html)) {
    missing.push("AfroHR browser route appears to reference a service-role key");
  }
  if (/localStorage\.(setItem|removeItem)\(\s*PAYROLL_EMPLOYEE_KEY/i.test(html) ||
      /localStorage\.(setItem|removeItem)\(\s*["']afropayroll_pro_employee_master["']/i.test(html)) {
    missing.push("AfroHR route writes the Payroll employee key instead of keeping it read-only");
  }

  if (missing.length) {
    fail(`Local contract check failed:\n- ${missing.join("\n- ")}`);
  }
  logStep("local contract", "PASS", "route, Pro gate, device save key, and Payroll read boundary are present");
}

function meta(extra) {
  return Object.assign({
    fixture_tag: fixtureTag,
    qa_fixture: true,
    source: FIXTURE_SOURCE,
  }, extra || {});
}

function buildFixture() {
  const today = "2026-05-10";
  const nextWeek = "2026-05-17";
  const clientLocalId = "qa-hr-client";
  const organizationLocalId = "qa-hr-organization";
  const employees = [
    {
      localId: "qa-hr-employee-001",
      row: {
        full_name: "QA Employee Amina Okafor",
        preferred_name: "Amina",
        employee_code: `HR-${fixtureTag}-001`,
        work_email: `qa.hr.amina+${fixtureTag}@example.com`,
        phone: "+10000002001",
        country_code: "NG",
        department: "Operations",
        role_title: "Operations coordinator",
        employment_type: "employee",
        start_date: "2026-05-01",
        status: "active",
        review_status: "Review needed",
        profile: meta({ local_id: "qa-hr-employee-001" }),
      },
    },
    {
      localId: "qa-hr-employee-002",
      row: {
        full_name: "QA Employee Brian Otieno",
        preferred_name: "Brian",
        employee_code: `HR-${fixtureTag}-002`,
        work_email: `qa.hr.brian+${fixtureTag}@example.com`,
        phone: "+10000002002",
        country_code: "KE",
        department: "Finance",
        role_title: "Payroll assistant",
        employment_type: "employee",
        start_date: "2026-05-03",
        status: "onboarding",
        review_status: "Review needed",
        profile: meta({ local_id: "qa-hr-employee-002" }),
      },
    },
    {
      localId: "qa-hr-employee-003",
      row: {
        full_name: "QA Employee Nandi Mensah",
        preferred_name: "Nandi",
        employee_code: `HR-${fixtureTag}-003`,
        work_email: `qa.hr.nandi+${fixtureTag}@example.com`,
        phone: "+10000002003",
        country_code: "GH",
        department: "Field team",
        role_title: "Program officer",
        employment_type: "contractor",
        start_date: "2026-05-05",
        status: "onboarding",
        review_status: "Review needed",
        profile: meta({ local_id: "qa-hr-employee-003" }),
      },
    },
  ];

  return {
    tag: fixtureTag,
    client: {
      localId: clientLocalId,
      row: {
        name: `[QA Fixture] AfroHR Client ${fixtureTag}`,
        client_type: "clinic",
        default_country: "NG",
        default_currency: "NGN",
        billing_email: qaEmail || `qa.hr.owner+${fixtureTag}@example.com`,
        status: "active",
        settings: meta({ local_id: clientLocalId, label: "Safe QA People workspace" }),
      },
    },
    organization: {
      localId: organizationLocalId,
      row: {
        name: `[QA Fixture] People OS Clinic ${fixtureTag}`,
        organization_type: "clinic",
        country_code: "NG",
        currency_code: "NGN",
        hr_contact_email: qaEmail || `qa.hr.owner+${fixtureTag}@example.com`,
        payroll_contact_email: qaEmail || `qa.hr.payroll+${fixtureTag}@example.com`,
        leave_year_start: "2026-01-01",
        default_work_week: "mon_fri",
        review_month: "2026-05-01",
        payroll_handoff_preference: "review_only",
        status: "active",
        settings: meta({ local_id: organizationLocalId, label: "Saved on this device first" }),
      },
    },
    employees,
    contacts: employees.map((employee, index) => ({
      localId: `qa-hr-contact-00${index + 1}`,
      employeeLocalId: employee.localId,
      row: {
        contact_type: "emergency",
        name: `QA Emergency Contact ${index + 1}`,
        relationship: index === 0 ? "Sibling" : index === 1 ? "Parent" : "Colleague",
        phone: `+1000000300${index + 1}`,
        email: `qa.hr.contact${index + 1}+${fixtureTag}@example.com`,
        review_status: "Review needed",
        metadata: meta({ local_id: `qa-hr-contact-00${index + 1}` }),
      },
    })),
    payrollProfiles: [
      {
        localId: "qa-hr-payroll-profile-001",
      employeeLocalId: "qa-hr-employee-001",
      row: {
          tax_id_status: "Review needed",
          social_security_status: "Review needed",
          payment_route_status: "Review needed",
          payroll_readiness_score: 72,
          payroll_link_status: "unlinked",
          payroll_reference_label: "Payroll read-only record",
          readiness_notes: "Review needed",
          payroll_snapshot: { payroll_read_key: PAYROLL_EMPLOYEE_KEY },
          metadata: meta({ local_id: "qa-hr-payroll-profile-001", payroll_read_key: PAYROLL_EMPLOYEE_KEY }),
        },
      },
      {
        localId: "qa-hr-payroll-profile-002",
      employeeLocalId: "qa-hr-employee-002",
      row: {
          tax_id_status: "Missing",
          social_security_status: "Review needed",
          payment_route_status: "Missing",
          payroll_readiness_score: 48,
          payroll_link_status: "unlinked",
          payroll_reference_label: "Payroll handoff draft",
          readiness_notes: "Review needed",
          payroll_snapshot: { payroll_read_key: PAYROLL_EMPLOYEE_KEY },
          metadata: meta({ local_id: "qa-hr-payroll-profile-002", payroll_read_key: PAYROLL_EMPLOYEE_KEY }),
        },
      },
      {
        localId: "qa-hr-payroll-profile-003",
      employeeLocalId: "qa-hr-employee-003",
      row: {
          tax_id_status: "Review needed",
          social_security_status: "Not required",
          payment_route_status: "Review needed",
          payroll_readiness_score: 64,
          payroll_link_status: "unlinked",
          payroll_reference_label: "Payroll handoff draft",
          readiness_notes: "Review needed",
          payroll_snapshot: { payroll_read_key: PAYROLL_EMPLOYEE_KEY },
          metadata: meta({ local_id: "qa-hr-payroll-profile-003", payroll_read_key: PAYROLL_EMPLOYEE_KEY }),
        },
      },
    ],
    contracts: [
      {
        localId: "qa-hr-contract-001",
        employeeLocalId: "qa-hr-employee-001",
        row: {
          contract_type: "employment",
          title: "Employment contract metadata",
          effective_from: "2026-05-01",
          status: "Review needed",
          review_note: "Metadata record only. No e-signature or legal certification is included.",
          metadata: meta({ local_id: "qa-hr-contract-001" }),
        },
      },
    ],
    onboardingTasks: [
      task("qa-hr-task-identity", "qa-hr-employee-001", "Employee records", "Identity and contact captured", "Review needed"),
      task("qa-hr-task-contract", "qa-hr-employee-001", "Documents", "Appointment letter prepared", "Review needed"),
      task("qa-hr-task-policy", "qa-hr-employee-002", "Onboarding", "Policy acknowledgement requested", "Review needed"),
      task("qa-hr-task-payroll", "qa-hr-employee-002", "Payroll readiness", "Payroll details requested", "Review needed"),
      task("qa-hr-task-equipment", "qa-hr-employee-003", "Onboarding", "Work tools assigned", "Review needed"),
      task("qa-hr-task-manager", "qa-hr-employee-003", "People reports", "Manager check-in scheduled", "Review needed"),
    ],
    leaveRequests: [
      {
        localId: "qa-hr-leave-001",
        employeeLocalId: "qa-hr-employee-001",
        row: {
          leave_type: "annual",
          start_date: nextWeek,
          end_date: "2026-05-19",
          day_count: 3,
          status: "Review needed",
          review_note: "QA leave request for People OS review.",
          metadata: meta({ local_id: "qa-hr-leave-001" }),
        },
      },
      {
        localId: "qa-hr-leave-002",
        employeeLocalId: "qa-hr-employee-003",
        row: {
          leave_type: "field_day",
          start_date: "2026-05-22",
          end_date: "2026-05-22",
          day_count: 1,
          status: "Review needed",
          review_note: "QA attendance-linked leave item.",
          metadata: meta({ local_id: "qa-hr-leave-002" }),
        },
      },
    ],
    attendanceEvents: [
      event("qa-hr-attendance-001", "qa-hr-employee-001", today, "present", "Signed in for morning shift"),
      event("qa-hr-attendance-002", "qa-hr-employee-002", today, "late", "Manager review needed"),
      event("qa-hr-attendance-003", "qa-hr-employee-003", today, "field_visit", "Program visit recorded"),
    ],
    letterDrafts: [
      {
        localId: "qa-hr-letter-001",
        employeeLocalId: "qa-hr-employee-001",
        row: {
          title: "Employment letter draft",
          letter_type: "appointment",
          status: "Review needed",
          body_snapshot: "Prepared for human HR review before sending.",
          review_note: "Draft only. Review needed before use.",
          metadata: meta({ local_id: "qa-hr-letter-001" }),
        },
      },
      {
        localId: "qa-hr-letter-002",
        employeeLocalId: "qa-hr-employee-003",
        row: {
          title: "Contractor engagement draft",
          letter_type: "other",
          status: "Review needed",
          body_snapshot: "Draft terms only. Review needed before use.",
          review_note: "Draft only. Review needed before use.",
          metadata: meta({ local_id: "qa-hr-letter-002" }),
        },
      },
    ],
    documents: [
      documentItem("qa-hr-doc-id", "qa-hr-employee-001", "identity", "Identity document metadata", "Review needed"),
      documentItem("qa-hr-doc-contract", "qa-hr-employee-001", "contract", "Contract metadata", "Review needed"),
      documentItem("qa-hr-doc-payroll", "qa-hr-employee-002", "payroll_details", "Payroll details metadata", "Review needed"),
      documentItem("qa-hr-doc-emergency", "qa-hr-employee-003", "emergency_contact", "Emergency contact metadata", "Review needed"),
    ],
    missingDetailRequests: [
      {
        localId: "qa-hr-missing-001",
        employeeLocalId: "qa-hr-employee-002",
        row: {
          requested_fields: ["tax ID", "payment route", "emergency contact"],
          request_status: "Review needed",
          request_note: "QA missing-detail request. No message was sent.",
          metadata: meta({ local_id: "qa-hr-missing-001" }),
        },
      },
      {
        localId: "qa-hr-missing-002",
        employeeLocalId: "qa-hr-employee-003",
        row: {
          requested_fields: ["contract review", "payroll status"],
          request_status: "Review needed",
          request_note: "QA review request for People OS.",
          metadata: meta({ local_id: "qa-hr-missing-002" }),
        },
      },
    ],
    payrollHandoffs: [
      {
        localId: "qa-hr-handoff-001",
        organizationLocalId,
        row: {
          title: "May 2026 Payroll handoff draft",
          period_label: "May 2026",
          status: "Payroll handoff draft",
          employee_count: employees.length,
          review_needed_count: 3,
          handoff_note: "QA handoff for review. This does not change Payroll records.",
          metadata: meta({ local_id: "qa-hr-handoff-001", payroll_read_key: PAYROLL_EMPLOYEE_KEY }),
        },
      },
    ],
    peopleReports: [
      {
        localId: "qa-hr-report-001",
        organizationLocalId,
        row: {
          report_type: "people_packet",
          title: "QA People summary",
          period_start: "2026-05-01",
          status: "Review needed",
          report_snapshot: {
            source: FIXTURE_SOURCE,
            employee_count: employees.length,
            note: "Prepared for review. No file storage, e-signature, or Payroll writeback is included.",
          },
          generated_at: `${today}T00:00:00.000Z`,
          metadata: meta({ local_id: "qa-hr-report-001" }),
        },
      },
    ],
    auditEvents: [
      audit("qa-hr-audit-baseline", organizationLocalId, "baseline_created", "QA People OS baseline planned."),
      audit("qa-hr-audit-request", organizationLocalId, "missing_detail_request", "QA missing-detail request planned."),
      audit("qa-hr-audit-handoff", organizationLocalId, "payroll_handoff_draft", "QA Payroll handoff draft planned."),
    ],
  };
}

function task(localId, employeeLocalId, lane, title, status) {
  return {
    localId,
    employeeLocalId,
    row: {
      lane,
      title,
      status,
      due_date: "2026-05-20",
      task_note: "QA onboarding task for People OS review.",
      metadata: meta({ local_id: localId }),
    },
  };
}

function event(localId, employeeLocalId, eventDate, eventType, note) {
  return {
    localId,
    employeeLocalId,
    row: {
      event_date: eventDate,
      event_type: eventType,
      event_note: note,
      status: "Review needed",
      metadata: meta({ local_id: localId }),
    },
  };
}

function documentItem(localId, employeeLocalId, documentType, title, status) {
  return {
    localId,
    employeeLocalId,
    row: {
      title,
      document_type: documentType,
      document_status: status,
      document_note: "Metadata record only. No file upload is included in this fixture.",
      metadata: meta({ local_id: localId }),
    },
  };
}

function audit(localId, organizationLocalId, eventType, eventNote) {
  return {
    localId,
    organizationLocalId,
    row: {
      event_type: eventType,
      event_note: eventNote,
      actor_email: qaEmail || `qa.hr.audit+${fixtureTag}@example.com`,
      metadata: meta({ local_id: localId }),
    },
  };
}

function countPlan(fixture) {
  return {
    hr_clients: 1,
    hr_organizations: 1,
    hr_employees: fixture.employees.length,
    hr_employee_contacts: fixture.contacts.length,
    hr_employee_payroll_profiles: fixture.payrollProfiles.length,
    hr_contracts: fixture.contracts.length,
    hr_letters: fixture.letterDrafts.length,
    hr_onboarding_tasks: fixture.onboardingTasks.length,
    hr_leave_requests: fixture.leaveRequests.length,
    hr_attendance_events: fixture.attendanceEvents.length,
    hr_document_vault_items: fixture.documents.length,
    hr_missing_detail_requests: fixture.missingDetailRequests.length,
    hr_payroll_handoffs: fixture.payrollHandoffs.length,
    hr_people_reports: fixture.peopleReports.length,
    hr_audit_events: fixture.auditEvents.length,
  };
}

function printPlan(fixture) {
  console.log(`\nAfroHR QA fixture tag: ${fixture.tag}`);
  console.log(`Mode: ${dryRun ? "dry-run" : "live"}`);
  console.log("\nPlanned People records:");
  Object.entries(countPlan(fixture)).forEach(([table, count]) => {
    logStep(table, dryRun ? "PLAN" : "READY", `${count} row(s)`);
  });
}

function printTruthBaseline() {
  console.log("\nProduct truth baseline:");
  console.log("- Works now: /pro/apps/hr/ exists, is Pro-gated, saves People OS sample work on this device, and reads Payroll employee records when present.");
  console.log(`- Device save key: ${STORAGE_KEY}.`);
  console.log(`- Payroll read key: ${PAYROLL_EMPLOYEE_KEY}. AfroHR must treat it as read-only until a user-approved Payroll handoff is built.`);
  console.log("- Save to account: browser bridge exists, but do not claim cloud HR storage or shared team records until account records are applied and safe QA proves create and cleanup.");
  console.log("- Payroll handoff draft: can be prepared for review, but no automatic Payroll sync is built.");
  console.log("- Not built: labor-law certification, contract certification, statutory HR filing, employee consent proof, document upload, and automatic Payroll sync.");
  console.log("- Customer wording to preserve: Saved on this device, Save to account, Payroll handoff draft, Review needed.");
}

async function authUser() {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = text;
  }
  if (!response.ok) fail(`QA user check failed with ${response.status}: ${text}`);
  if (qaUserId && data && data.id !== qaUserId) {
    fail("Live writes refused. AFROHR_QA_USER_ID does not match AFROHR_QA_ACCESS_TOKEN.");
  }
  if (data && data.email && qaEmail && data.email.toLowerCase() !== qaEmail.toLowerCase()) {
    fail("Live writes refused. AFROHR_QA_EMAIL does not match AFROHR_QA_ACCESS_TOKEN.");
  }
  const safeEmail = data && data.email || qaEmail;
  if (!safeEmail || !isSafeQaEmail(safeEmail)) {
    fail("Live writes refused. Signed-in email must clearly be QA, test, fixture, sandbox, or example.com.");
  }
  logStep("qa user", "PASS", safeEmail);
  return data;
}

async function restRequest(method, table, query, body) {
  const url = `${supabaseUrl}/rest/v1/${table}${query ? `?${query}` : ""}`;
  const response = await fetch(url, {
    method,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
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
  if (!response.ok) fail(`${method} ${table} failed with ${response.status}: ${text}`);
  return Array.isArray(data) ? data : data ? [data] : [];
}

async function tableAvailable(table) {
  const url = `${supabaseUrl}/rest/v1/${table}?select=id&limit=1`;
  const response = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (response.ok) return true;
  const text = await response.text();
  if (/Could not find|PGRST205|PGRST204|relation .* does not exist|404/i.test(text) || response.status === 404) {
    return false;
  }
  fail(`Could not inspect ${table}: ${response.status} ${text}`);
}

async function availableTables() {
  const result = {};
  for (const table of PEOPLE_TABLES) {
    result[table] = await tableAvailable(table);
  }
  return result;
}

function qp(params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  });
  return search.toString();
}

function fixtureTagColumn(table) {
  if (table === "hr_clients" || table === "hr_organizations") return "settings->>fixture_tag";
  if (table === "hr_employees") return "profile->>fixture_tag";
  return "metadata->>fixture_tag";
}

function mapByLocalId(rows) {
  const map = {};
  rows.forEach((row) => {
    const source = row && (row.metadata || row.profile || row.settings);
    if (row && source && source.local_id) map[source.local_id] = row.id;
  });
  return map;
}

function withScope(row, clientId, organizationId, employeeId) {
  const scoped = Object.assign({}, row, {
    client_id: clientId,
    organization_id: organizationId,
  });
  if (employeeId !== undefined) scoped.employee_id = employeeId || null;
  return scoped;
}

async function insertRows(table, rows, select) {
  if (!rows.length) return [];
  const result = await restRequest("POST", table, qp({ select: select || "*" }), rows);
  logStep(table, "PASS", `${result.length} row(s)`);
  return result;
}

async function createLiveFixture(fixture) {
  assertLiveAllowed();
  const user = await authUser();

  const tableMap = await availableTables();
  const missing = PEOPLE_TABLES.filter((table) => !tableMap[table]);
  if (missing.length) {
    logStep("People account records", "PLAN", `${missing.length} table(s) not available, no rows inserted`);
    missing.forEach((table) => logStep(table, "MISSING", "planned only"));
    return { plannedOnly: true, tag: fixture.tag, missing };
  }

  const existing = await restRequest("GET", "hr_clients", qp({
    select: "id,name,metadata",
    "settings->>fixture_tag": `eq.${fixture.tag}`,
  }));
  if (existing.length) {
    fail(`Live create refused. Fixture tag already exists on ${existing.length} client row(s). Run cleanup first or use a new tag.`);
  }

  const clientRows = await insertRows("hr_clients", [
    Object.assign({}, fixture.client.row, { owner_id: user.id }),
  ]);
  const clientId = clientRows[0] && clientRows[0].id;
  if (!clientId) fail("hr_clients did not return an id.");

  const orgRows = await insertRows("hr_organizations", [
    Object.assign({}, fixture.organization.row, { client_id: clientId }),
  ]);
  const organizationId = orgRows[0] && orgRows[0].id;
  if (!organizationId) fail("hr_organizations did not return an id.");

  const employeeRows = await insertRows("hr_employees", fixture.employees.map((item) => withScope(item.row, clientId, organizationId)));
  const employeeIds = mapByLocalId(employeeRows);

  await insertRows("hr_employee_contacts", fixture.contacts.map((item) => withScope(item.row, clientId, organizationId, employeeIds[item.employeeLocalId])));
  await insertRows("hr_employee_payroll_profiles", fixture.payrollProfiles.map((item) => withScope(item.row, clientId, organizationId, employeeIds[item.employeeLocalId])));
  await insertRows("hr_contracts", fixture.contracts.map((item) => withScope(item.row, clientId, organizationId, employeeIds[item.employeeLocalId])));
  await insertRows("hr_letters", fixture.letterDrafts.map((item) => withScope(item.row, clientId, organizationId, employeeIds[item.employeeLocalId])));
  await insertRows("hr_onboarding_tasks", fixture.onboardingTasks.map((item) => withScope(item.row, clientId, organizationId, employeeIds[item.employeeLocalId])));
  await insertRows("hr_leave_requests", fixture.leaveRequests.map((item) => withScope(item.row, clientId, organizationId, employeeIds[item.employeeLocalId])));
  await insertRows("hr_attendance_events", fixture.attendanceEvents.map((item) => withScope(item.row, clientId, organizationId, employeeIds[item.employeeLocalId])));
  await insertRows("hr_document_vault_items", fixture.documents.map((item) => withScope(item.row, clientId, organizationId, employeeIds[item.employeeLocalId])));
  await insertRows("hr_missing_detail_requests", fixture.missingDetailRequests.map((item) => withScope(item.row, clientId, organizationId, employeeIds[item.employeeLocalId])));
  await insertRows("hr_payroll_handoffs", fixture.payrollHandoffs.map((item) => withScope(item.row, clientId, organizationId)));
  await insertRows("hr_people_reports", fixture.peopleReports.map((item) => withScope(item.row, clientId, organizationId)));
  await insertRows("hr_audit_events", fixture.auditEvents.map((item) => withScope(item.row, clientId, organizationId)));

  return { plannedOnly: false, tag: fixture.tag, counts: countPlan(fixture) };
}

async function cleanupLiveFixture(tag) {
  assertTagForCleanup();
  assertLiveAllowed();
  await authUser();

  const tableMap = await availableTables();
  const missing = PEOPLE_TABLES.filter((table) => !tableMap[table]);
  if (missing.length === PEOPLE_TABLES.length) {
    logStep("cleanup lookup", "PLAN", "People account records are not available, so no rows can be deleted");
    return { tag, deleted: {}, missing };
  }

  const deleted = {};
  for (const table of CLEANUP_TABLES.filter((item) => tableMap[item])) {
    const rows = await restRequest("DELETE", table, qp(Object.assign({
      select: "id",
    }, {
      [fixtureTagColumn(table)]: `eq.${tag}`,
    })));
    deleted[table] = rows.length;
    logStep(table, "DELETE", `${rows.length} tagged row(s)`);
  }
  return { tag, deleted, missing };
}

async function dryRunCleanup(tag) {
  assertTagForCleanup();
  console.log(`\nDry-run cleanup for fixture tag: ${tag}`);
  CLEANUP_TABLES.forEach((table) => {
    logStep(table, "DRY-RUN", `would delete rows where ${fixtureTagColumn(table)} matches the tag`);
  });
}

async function main() {
  const fixture = buildFixture();
  console.log("AfroHR People OS QA fixture");
  localContractCheck();
  printPlan(fixture);
  printTruthBaseline();

  if (mode === "baseline" || mode === "tables") return;

  if (args.live && !confirmLive) {
    logStep("live guard", "REFUSE", "AFROHR_QA_CONFIRM=1 is not set, so no writes will run");
  }

  if (mode === "cleanup") {
    if (dryRun) {
      await dryRunCleanup(fixture.tag);
      return;
    }
    const result = await cleanupLiveFixture(fixture.tag);
    console.log("\nCleanup complete");
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (dryRun) {
    logStep("fixture create", "DRY-RUN", "no rows inserted");
    console.log(`\nUse this tag for a live run and cleanup: ${fixture.tag}`);
    return;
  }

  const result = await createLiveFixture(fixture);
  console.log(result.plannedOnly ? "\nLive fixture stayed in planned-only mode" : "\nLive fixture created");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(`AfroHR QA fixture failed: ${error.message}`);
  process.exit(1);
});
