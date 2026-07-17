#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const failures = [];
const warnings = [];

const route = "pro/apps/hr/index.html";
const fixture = "scripts/afrohr-qa-fixture.js";
const qaDoc = "docs/AFROHR-QA.md";
const brief = "docs/AFROHR-PEOPLE-OS-BRIEF.md";
const schemaDoc = "docs/AFROHR-SUPABASE-SCHEMA.md";
const migration = "supabase/migrations/next-afrohr-people-schema.sql";
const syncHelper = "assets/js/lib/afrohr-sync.js";
const localKey = "afrohr_people_os_demo_v1";
const payrollReadKey = "afropayroll_pro_employee_master";
const internalTerms = [
  "shell",
  "localStorage",
  "schema",
  "debug",
  "account-backed",
  "Supabase actions",
];

function rel(file) {
  return path.join(root, file);
}

function read(file) {
  return fs.readFileSync(rel(file), "utf8");
}

function exists(file) {
  return fs.existsSync(rel(file));
}

function addFailure(message) {
  failures.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function stripStaticText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scanInternalTerms(label, text, collector) {
  internalTerms.forEach((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = /^[a-z]+$/i.test(term)
      ? new RegExp(`\\b${escaped}\\b`, "i")
      : new RegExp(escaped, "i");
    if (pattern.test(text)) collector(`${label} includes internal wording: ${term}`);
  });
}

[route, fixture, qaDoc, brief, schemaDoc, migration, syncHelper].forEach((file) => {
  if (!exists(file)) addFailure(`missing ${file}`);
});

if (!failures.length) {
  const html = read(route);
  const fixtureJs = read(fixture);
  const qa = read(qaDoc);
  const briefText = read(brief);
  const schemaText = read(schemaDoc);
  const migrationSql = read(migration);
  const syncJs = read(syncHelper);
  const docsText = `${qa}\n${briefText}`;
  const accountDocsText = `${briefText}\n${schemaText}`;
  const staticRouteText = stripStaticText(html);
  const allBaselineText = `${html}\n${fixtureJs}\n${docsText}\n${schemaText}\n${syncJs}`;

  if (!/<meta\s+name=["']pro-required["']\s+content=["']afrotools-pro["']/i.test(html)) {
    addFailure("AfroHR route is missing the Pro gate meta tag");
  }
  if (!/\/assets\/js\/pro-gate\.js/.test(html)) {
    addFailure("AfroHR route does not load pro-gate.js");
  }
  if (!/\/assets\/js\/lib\/afrohr-sync\.js/.test(html)) {
    addFailure("AfroHR route does not load afrohr-sync.js");
  }
  if (!html.includes(localKey)) {
    addFailure(`AfroHR route missing device save key ${localKey}`);
  }
  if (!html.includes(payrollReadKey)) {
    addFailure(`AfroHR route missing Payroll read key ${payrollReadKey}`);
  }
  if (/service[_-]?role|SUPABASE_AUTH_SERVICE_KEY|SUPABASE_SERVICE_KEY/i.test(html + syncJs)) {
    addFailure("AfroHR browser route must not reference service-role keys");
  }
  if (/localStorage\.(setItem|removeItem)\(\s*PAYROLL_EMPLOYEE_KEY/i.test(html) ||
      /localStorage\.(setItem|removeItem)\(\s*["']afropayroll_pro_employee_master["']/i.test(html)) {
    addFailure("AfroHR route writes the Payroll employee key instead of keeping it read-only");
  }

  // Technical docs can name implementation details while the customer route must stay clean.
  scanInternalTerms("AfroHR current route static copy", staticRouteText, addWarning);
  if (/local HR shell|account-backed API|localStorage/i.test(staticRouteText)) {
    addWarning("AfroHR current route still has visible or generated copy that should be cleaned in the route pass");
  }

  const dollarBlocks = migrationSql.match(/\$\$/g) || [];
  if (dollarBlocks.length % 2 !== 0) {
    addFailure("AfroHR migration has unbalanced $$ blocks");
  }

  [
    "AFROHR_QA_CONFIRM",
    "AFROHR_QA_EMAIL",
    "AFROHR_QA_ACCESS_TOKEN",
    "AFROHR_QA_TAG",
    "--cleanup",
    "dry-run",
  ].forEach((token) => {
    if (!fixtureJs.includes(token)) addFailure(`AfroHR fixture missing guard or mode: ${token}`);
    if (!qa.includes(token)) addFailure(`AfroHR QA doc missing command guard or mode: ${token}`);
  });

  [
    "Saved on this device",
    "Save to account",
    "Pull from account",
    "Create account organization",
    "Choose saved organization",
    "Download backup",
    "Last saved",
    "Review before replacing",
    "Payroll handoff draft",
    "Review needed",
    "Employee records",
    "Onboarding",
    "Leave",
    "Documents",
    "Payroll readiness",
    "People reports",
  ].forEach((phrase) => {
    if (!allBaselineText.toLowerCase().includes(phrase.toLowerCase())) {
      addFailure(`AfroHR baseline missing required wording: ${phrase}`);
    }
  });

  [
    "isCloudAvailable",
    "loadOrganizations",
    "createOrganizationFromLocalSnapshot",
    "saveLocalSnapshot",
    "loadOrganizationSnapshot",
    "recordAuditEvent",
    "compareSnapshots",
    "snapshotCounts",
    "friendlyError",
  ].forEach((method) => {
    if (!syncJs.includes(method) && !html.includes(method)) {
      addFailure(`AfroHR account bridge missing ${method}`);
    }
  });

  [
    "cloud HR storage",
    "labor-law compliance",
    "contract certification",
    "statutory HR filing",
    "employee consent proof",
    "automatic Payroll sync",
  ].forEach((claim) => {
    if (!docsText.toLowerCase().includes(claim.toLowerCase())) {
      addFailure(`AfroHR docs missing must-not-claim item: ${claim}`);
    }
  });

  [
    "hr_clients",
    "hr_organizations",
    "hr_team_members",
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
  ].forEach((table) => {
    if (!migrationSql.includes(`public.${table}`)) addFailure(`AfroHR migration missing account table ${table}`);
    if (!accountDocsText.includes(table)) addFailure(`AfroHR account docs missing table ${table}`);
  });

  [
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
  ].forEach((table) => {
    if (!fixtureJs.includes(table)) addFailure(`AfroHR fixture missing QA fixture record set ${table}`);
    if (!docsText.includes(table)) addFailure(`AfroHR QA docs missing fixture record set ${table}`);
  });

  [
    "private.hr_can_access",
    "private.hr_can_edit_people",
    "private.hr_can_review",
    "private.hr_can_manage",
    "enable row level security",
    "force row level security",
    "payroll_employee_id uuid references public.payroll_employees",
    "payroll_run_id uuid references public.payroll_runs",
  ].forEach((token) => {
    if (!migrationSql.includes(token)) addFailure(`AfroHR migration missing required schema guard: ${token}`);
  });

  if (!/read-only/i.test(accountDocsText) || !accountDocsText.includes(payrollReadKey)) {
    addFailure("AfroHR docs must describe the Payroll read key as read-only");
  }
  if (/automatic Payroll sync/i.test(accountDocsText) && !/must not claim|does not mean|no automatic Payroll sync|do not claim/i.test(accountDocsText)) {
    addFailure("AfroHR account docs mention automatic Payroll sync without a limitation context");
  }
  if (/service[_-]?role|SUPABASE_AUTH_SERVICE_KEY|SUPABASE_SERVICE_KEY/i.test(html + syncJs)) {
    addFailure("AfroHR browser route must not reference service-role keys");
  }
  if (/Save to account is not active for AfroHR yet/i.test(staticRouteText)) {
    addFailure("AfroHR visible copy still says Save to account is not active");
  }
}

if (failures.length) {
  console.error("AfroHR Pro verification failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("AfroHR Pro verification passed");
console.log("- route: /pro/apps/hr/");
console.log(`- device save key: ${localKey}`);
console.log(`- Payroll read key: ${payrollReadKey}`);
console.log("- live fixture writes require AFROHR_QA_CONFIRM=1, a safe QA user, and a fixture tag");

if (warnings.length) {
  console.warn("AfroHR Pro verification warnings:");
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}
