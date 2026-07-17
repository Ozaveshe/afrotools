#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const architecture = require(path.join(root, "assets/js/lib/afropayroll-pro-architecture.js"));

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function fail(message) {
  console.error("FAIL " + message);
  process.exitCode = 1;
}

function pass(message) {
  console.log("PASS " + message);
}

const payload = architecture.payload;
const apiFile = read("netlify/functions/api-afropayroll.js");
const packageJson = JSON.parse(read("package.json"));
const redirects = read("_redirects");
const migration = fs.readdirSync(path.join(root, "supabase/migrations"))
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => read(path.join("supabase/migrations", file)))
  .join("\n");
const workspace = read("tools/afropayroll-os/workspace.html");
const dashboard = read("pro/apps/payroll/index.html");
const support = read("tools/afropayroll-os/support.html");
const employee = read("tools/afropayroll-os/employee.html");
const qaFixture = read("scripts/afropayroll-pro-qa-fixture.js");
const browserRegression = read("tests/e2e/afropayroll-pro.spec.js");
const countryData = require(path.join(root, "data/hr/afropayroll-country-packs.js"));
globalThis.AFROPAYROLL_COUNTRY_PACKS = countryData;
const countryPacks = require(path.join(root, "assets/js/lib/afropayroll-country-packs.js"));
const importMapper = require(path.join(root, "assets/js/lib/afropayroll-import-mapper.js"));
const languagePacks = require(path.join(root, "assets/js/lib/afropayroll-language-packs.js"));
const languageApi = globalThis.AfroTools && globalThis.AfroTools.afropayrollLanguagePacks;

function fileExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function hasProGate(html) {
  return /<meta\s+name=["']pro-required["']/i.test(html) && /\/assets\/js\/pro-gate\.js/.test(html);
}

function hasCleanRouteRedirect(htmlFile, cleanRoute) {
  const escapedFile = htmlFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedRoute = cleanRoute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escapedFile + "\\s+" + escapedRoute + "\\s+301").test(redirects);
}

if (!payload || payload.product !== "AfroPayroll Pro") fail("architecture payload missing product");
else pass("architecture payload loaded");

if (!workspace.includes("/assets/js/lib/afropayroll-pro-architecture.js")) {
  fail("workspace does not load architecture helper");
} else {
  pass("workspace loads architecture helper");
}

[
  "pro/apps/payroll/index.html",
  "tools/afropayroll-os/workspace.html",
  "tools/afropayroll-os/employee.html",
  "tools/afropayroll-os/support.html",
  "data/hr/afropayroll-country-packs.js",
  "assets/js/lib/afropayroll-country-packs.js",
  "assets/js/lib/afropayroll-language-packs.js",
  "assets/js/lib/afropayroll-import-mapper.js",
  "assets/js/lib/afropayroll-pro-architecture.js",
  "scripts/afropayroll-pro-qa-fixture.js",
  "tests/e2e/afropayroll-pro.spec.js",
].forEach((file) => {
  if (!fileExists(file)) fail("required AfroPayroll file missing: " + file);
});
pass("required AfroPayroll source files exist");

[
  ["payroll dashboard", dashboard],
  ["workspace", workspace],
  ["support console", support],
].forEach(([label, html]) => {
  if (!hasProGate(html)) fail(label + " is missing Pro gate metadata/script");
});
if (!/employee_portal/.test(employee) || !/inviteToken/.test(employee) || !/secure invite link/i.test(employee)) {
  fail("employee portal route is missing token-gated copy or API wiring");
}
if (!hasCleanRouteRedirect("/tools/afropayroll-os/employee.html", "/tools/afropayroll-os/employee")) {
  fail("employee portal clean route redirect missing");
}
if (!hasCleanRouteRedirect("/tools/afropayroll-os/support.html", "/tools/afropayroll-os/support")) {
  fail("support console clean route redirect missing");
}
pass("route gates and clean route redirects checked");

[
  "Setup",
  "Employee Master",
  "Import payroll",
  "Close Room",
  "Start from previous run",
  "Statutory review",
  "Payment handoff",
  "Accounting journal",
].forEach((label) => {
  const haystack = workspace + "\n" + dashboard;
  if (!haystack.toLowerCase().includes(label.toLowerCase())) fail("required payroll section/capability missing: " + label);
});
pass("required payroll workspace sections checked");

[
  "Supabase actions",
  "account-backed",
  "cloud run action",
  "local work",
  "token route",
  "draft only",
  "certified compliance",
  "salary disbursement completed",
  "bank integration",
  "mobile-money integration",
].forEach((phrase) => {
  [dashboard, workspace, support, employee].forEach((html, index) => {
    if (html.toLowerCase().includes(phrase.toLowerCase())) {
      fail("front-facing internal/overclaim wording found: " + phrase + " in target page " + index);
    }
  });
});
pass("front-facing wording leakage scan completed");

payload.roles.forEach((role) => {
  const needle = "'" + role.role + "'";
  if (!migration.includes(needle)) fail("role missing from migration: " + role.role);
});
pass("role names checked against migration");

Object.entries(payload.roleGroups).forEach(([group, roles]) => {
  if (!roles.length) fail("role group is empty: " + group);
  roles.forEach((role) => {
    if (!payload.roles.some((item) => item.role === role)) fail("role group references unknown role: " + group + " -> " + role);
  });
});
pass("role groups reference known roles");

payload.entities.forEach((entity) => {
  if (!migration.includes("public." + entity.table)) fail("entity table missing from migration: " + entity.table);
});
pass("entity tables checked against migration");

payload.apiActions.forEach((action) => {
  if (action.action === "delete") return;
  if (!apiFile.includes(action.action)) fail("API action missing from function: " + action.action);
});
pass("API actions checked against function");

[
  "dashboard",
  "clients",
  "load",
  "list_employees",
  "audit",
  "close_room",
  "roles",
  "employee_portal",
  "save_client",
  "save_run",
  "save_employee",
  "record_employee_event",
  "clone_run",
  "acknowledge_variance",
  "submit_run",
  "request_approval",
  "request_changes",
  "approve_run",
  "reject_run",
  "finalize_run",
  "reopen_run",
  "add_comment",
  "generate_payslips",
  "generate_statutory_packs",
  "record_export",
  "record_import",
  "invite_member",
  "create_employee_portal_invite",
  "employee_confirm_profile",
].forEach((action) => {
  if (!apiFile.includes(action)) fail("required current API action missing from function: " + action);
});
pass("current AfroPayroll API action set checked");

Object.keys(payload.workflowStates).forEach((status) => {
  if (!migration.includes("'" + status + "'")) fail("workflow status missing from migration: " + status);
});
pass("workflow states checked against migration");

const approvalRoles = payload.roleGroups.approvePayroll.join("', '");
if (!apiFile.includes("const APPROVE_PAYROLL_ROLES = ['" + approvalRoles + "'];")) {
  fail("approval role group is not aligned with API constant");
} else {
  pass("approval role group aligned with API constant");
}

const knownRoles = payload.roles.map((role) => role.role);
function apiRoleConstant(name) {
  const match = apiFile.match(new RegExp("const\\s+" + name + "\\s+=\\s+\\[([^\\]]*)\\]"));
  if (!match) fail("API role constant missing: " + name);
  return match ? match[1].split(",").map((part) => part.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean) : [];
}

const apiRoleGroups = {
  viewPayroll: apiRoleConstant("VIEW_PAYROLL_ROLES"),
  editPayroll: apiRoleConstant("EDIT_PAYROLL_ROLES"),
  approvePayroll: apiRoleConstant("APPROVE_PAYROLL_ROLES"),
  manageMembers: apiRoleConstant("MANAGE_MEMBER_ROLES"),
};

Object.entries(apiRoleGroups).forEach(([group, roles]) => {
  roles.forEach((role) => {
    if (!knownRoles.includes(role)) fail("API role group references unknown role: " + group + " -> " + role);
  });
  const expected = (payload.roleGroups[group] || []).join(",");
  if (roles.join(",") !== expected) fail("API role group does not match architecture helper: " + group);
});
if (apiRoleGroups.viewPayroll.includes("viewer")) fail("viewer must not be treated as salary-data viewer in API");
if (apiRoleGroups.editPayroll.includes("viewer")) fail("viewer must not be treated as payroll editor");
if (apiRoleGroups.editPayroll.includes("approver")) fail("approver must not be treated as payroll row editor");
if (apiRoleGroups.manageMembers.includes("payroll_admin")) fail("payroll_admin must not manage members");
if (!apiRoleGroups.approvePayroll.includes("approver")) fail("approver role must be able to approve/finalize/reopen");
if (!/params\.action === 'employee_portal'/.test(apiFile) || !/handleEmployeePortal\(params\)/.test(apiFile)) {
  fail("employee portal token path must stay outside regular workspace RBAC");
}
pass("API role boundary invariants checked");

const coverage = architecture.buildCoverage();
if (!coverage.length) fail("coverage matrix is empty");
else pass("coverage matrix generated: " + coverage.length + " layers");

["NG", "KE", "GH", "ZA"].forEach((code) => {
  const pack = countryPacks.get(code);
  const items = countryPacks.statutoryItems(code);
  const sources = countryPacks.sourceList(code, true);
  const calendar = countryPacks.statutoryCalendar(code);
  if (!pack || pack.status !== "full_pack") fail("launch country is not full_pack: " + code);
  if (!pack || !pack.effectiveFrom || !pack.lastVerified || !pack.nextReview) fail("launch country missing review dates: " + code);
  if (!calendar || !calendar.reviewedDate || !calendar.confidence) fail("launch country missing statutory calendar metadata: " + code);
  if (!items.length || items.some((item) => !item.reportLabel || !item.label || !(item.sourceUrls || []).length)) {
    fail("launch country statutory items incomplete: " + code);
  }
  if (!sources.length) fail("launch country source links missing: " + code);
});
pass("launch country statutory metadata checked");

countryPacks.list().forEach((pack) => {
  const code = pack && pack.code || "unknown";
  const status = pack && (pack.status || pack.support_level);
  if (!pack.nextReview) fail("country pack missing nextReview: " + code);
  if (!pack.maintenance || !Array.isArray(pack.maintenance.reviewerChecklist)) {
    fail("country pack missing maintenance reviewer checklist: " + code);
  }
  if (status === "full_pack") {
    if (!countryPacks.sourceList(code, true).length) fail("full_pack missing official source links: " + code);
    if (!countryPacks.statutoryItems(code).length) fail("full_pack missing statutory items: " + code);
    const calendar = countryPacks.statutoryCalendar(code);
    if (!calendar || !calendar.reviewedDate || !calendar.confidence) {
      fail("full_pack missing calendar metadata: " + code);
    }
  }
});
if (typeof countryPacks.reviewWorkflowState !== "function" || typeof countryPacks.buildHealthReport !== "function") {
  fail("country pack helper missing review workflow helpers");
}
const packHealth = countryPacks.buildHealthReport({ today: "2026-05-09" });
["reviewDueSoon", "reviewOverdue", "sourceChanged", "engineSyncNeeded", "nextPackCandidates"].forEach((key) => {
  if (!Object.prototype.hasOwnProperty.call(packHealth.summary || {}, key)) fail("country pack health summary missing: " + key);
});
[
  "Launch country health",
  "Estimate country queue",
  "Next-pack queue",
  "Overdue source reviews",
  "Engine availability",
  "Statutory calendar coverage",
  "Reviewer Checklist",
  "Review CSV",
  "Next review queue CSV",
].forEach((marker) => {
  if (!support.includes(marker)) fail("support console missing country-pack review workflow marker: " + marker);
});
pass("country-pack maintenance workflow checked");

if (!importMapper || !Array.isArray(importMapper.templateOrder) || importMapper.templateOrder.length < 4) {
  fail("import mapper helper did not load expected templates");
} else {
  ["employee_master", "payroll_rows", "payment_details", "statutory_ids"].forEach((template) => {
    if (!importMapper.getTemplate(template)) fail("import mapper missing template: " + template);
  });
  pass("import mapper helper loaded and templates checked");
}

if (!languagePacks || !languageApi || typeof languageApi.coverage !== "function") {
  fail("language pack coverage helper missing");
} else {
  const languageCoverage = languageApi.coverage();
  const missingLabels = Object.entries(languageCoverage.missing || {})
    .flatMap(([lang, keys]) => keys.map((key) => lang + ":" + key));
  if (missingLabels.length) {
    fail("language pack missing EN/FR/SW labels: " + missingLabels.slice(0, 20).join(", "));
  }
  if ((languageCoverage.internalLeaks || []).length) {
    fail("language pack internal wording leakage: " + languageCoverage.internalLeaks.slice(0, 5).map((leak) => leak.lang + ":" + leak.key).join(", "));
  }
  [
    "setup.statusReady",
    "setup.checkPaymentMissing",
    "pro.closeRoomTitle",
    "pro.varianceTitle",
    "pro.importMapperTitle",
    "pro.employeeReadyBadge",
    "pro.complianceTitle",
    "pro.recordExport",
    "cloud.save",
    "employeePortal.safeInvalid",
    "support.healthReady",
  ].forEach((key) => {
    languagePacks.languages.forEach((lang) => {
      if (!languagePacks.packs[lang] || !languagePacks.packs[lang].labels[key]) {
        fail("language pack missing required payroll key: " + lang + ":" + key);
      }
    });
  });
  pass("language pack EN/FR/SW coverage and wording guards checked");
}

const packFiles = [
  "data/hr/afropayroll-country-packs.js",
  "assets/js/lib/afropayroll-country-packs.js",
];
const discoveredPackFiles = [];
function walk(dir) {
  fs.readdirSync(path.join(root, dir), { withFileTypes: true }).forEach((entry) => {
    const relPath = path.join(dir, entry.name).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      if (!["node_modules", ".git", "dist"].includes(entry.name)) walk(relPath);
      return;
    }
    if (/afropayroll.*country.*packs|country-packs.*afropayroll/i.test(relPath)) discoveredPackFiles.push(relPath);
  });
}
["data", "assets"].forEach(walk);
discoveredPackFiles.forEach((file) => {
  if (!packFiles.includes(file)) fail("duplicate AfroPayroll country-pack file found: " + file);
});
pass("duplicate country-pack file scan completed");

[
  "SUPABASE_SERVICE_KEY",
  "SUPABASE_AUTH_SERVICE_KEY",
  "service_role",
  "service-role",
].forEach((secretNeedle) => {
  [
    ["payroll dashboard", dashboard],
    ["workspace", workspace],
    ["employee portal", employee],
    ["support console", support],
  ].forEach(([label, html]) => {
    if (html.includes(secretNeedle)) fail(label + " references service-role secret marker: " + secretNeedle);
  });
});
pass("browser service-role secret scan completed");

if (!packageJson.scripts || !/verify-afropayroll-pro-architecture/.test(packageJson.scripts["pro:verify"] || "")) {
  fail("package pro:verify does not include AfroPayroll verifier");
} else {
  pass("package pro:verify includes AfroPayroll verifier");
}

if (!packageJson.scripts || !/afropayroll-pro-qa-fixture/.test(packageJson.scripts["afropayroll:qa"] || "")) {
  fail("package afropayroll:qa does not run the QA fixture harness");
}
if (!packageJson.scripts || !/tests\/e2e\/afropayroll-pro\.spec\.js/.test(packageJson.scripts["test:afropayroll-pro"] || "")) {
  fail("package test:afropayroll-pro does not run the browser regression pack");
}
[
  "AFROPAYROLL_QA_CONFIRM",
  "AFROPAYROLL_QA_USER_ID",
  "AFROPAYROLL_QA_EMAIL",
  "AFROPAYROLL_QA_BATCH_ID",
  "dry-run",
  "create_employee_portal_invite",
  "payroll_employee_portal_invites",
].forEach((needle) => {
  if (!qaFixture.includes(needle)) fail("QA fixture harness missing safety or workflow marker: " + needle);
});
pass("QA fixture harness guardrails checked");

[
  "/pro/apps/payroll/",
  "/tools/afropayroll-os/workspace.html",
  "/tools/afropayroll-os/employee.html",
  "/tools/afropayroll-os/support.html",
  "**/api/afropayroll**",
  "Save run to account",
  "Saved payroll runs",
  "Employee records",
  "Payment file draft",
  "Accounting journal",
  "Secure invite link",
  "Supabase actions",
  "account-backed",
  "token route",
  "service[- ]role",
].forEach((needle) => {
  if (!browserRegression.includes(needle)) fail("browser regression pack missing guard: " + needle);
});
pass("browser regression pack route, copy, API mock, and wording guards checked");

if (process.exitCode) process.exit(process.exitCode);
