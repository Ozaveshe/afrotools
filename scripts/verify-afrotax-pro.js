#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const failures = [];
const route = "pro/apps/tax-compliance/index.html";
const fixture = "scripts/afrotax-qa-fixture.js";
const syncHelper = "assets/js/lib/afrotax-sync.js";
const qaDoc = "docs/AFROTAX-QA.md";
const brief = "docs/AFROTAX-COMPLIANCE-OS-BRIEF.md";
const schemaDoc = "docs/AFROTAX-SUPABASE-SCHEMA.md";
const migration = "supabase/migrations/next-afrotax-compliance-schema.sql";
const deviceKey = "afrotax_compliance_os_demo_v1";
const payrollKeys = ["afropayroll_pro_saved_runs", "afropayroll_pro_workspace_preview"];
const taxTables = [
  "tax_clients",
  "tax_company_profiles",
  "tax_team_members",
  "tax_country_packs",
  "tax_obligations",
  "tax_deadlines",
  "tax_workflow_items",
  "tax_evidence_packs",
  "tax_evidence_documents",
  "tax_source_reviews",
  "tax_review_checklists",
  "tax_review_comments",
  "tax_export_packets",
  "tax_cross_app_imports",
  "tax_audit_events",
];
const syncTables = taxTables.filter((table) => table !== "tax_team_members");

function rel(file) {
  return path.join(root, file);
}

function read(file) {
  return fs.readFileSync(rel(file), "utf8");
}

function addFailure(message) {
  failures.push(message);
}

function assertFile(file) {
  if (!fs.existsSync(rel(file))) addFailure(`missing ${file}`);
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

[route, fixture, syncHelper, qaDoc, brief, schemaDoc, migration].forEach(assertFile);

if (!failures.length) {
  const html = read(route);
  const fixtureJs = read(fixture);
  const syncJs = read(syncHelper);
  const qa = read(qaDoc);
  const briefText = read(brief);
  const schemaText = read(schemaDoc);
  const migrationSql = read(migration);
  const visibleLower = visibleText(html).toLowerCase();
  const docsLower = `${qa}\n${briefText}\n${schemaText}`.toLowerCase();

  if (!/<meta\s+name=["']pro-required["']\s+content=["']afrotools-pro["']/i.test(html)) {
    addFailure("AfroTax route is missing the Pro gate meta tag");
  }
  if (!/\/assets\/js\/pro-gate\.js/.test(html)) {
    addFailure("AfroTax route does not load pro-gate.js");
  }
  if (!/\/assets\/js\/lib\/afrotax-sync\.js/.test(html)) {
    addFailure("AfroTax route does not load afrotax-sync.js");
  }
  if (!html.includes(deviceKey)) addFailure(`AfroTax route missing ${deviceKey}`);
  payrollKeys.forEach((key) => {
    if (!html.includes(key)) addFailure(`AfroTax route missing Payroll source signal ${key}`);
    if (!fixtureJs.includes(key) || !briefText.includes(key)) {
      addFailure(`AfroTax baseline missing Payroll source signal ${key}`);
    }
  });
  if (/service[_-]?role|SUPABASE_AUTH_SERVICE_KEY|SUPABASE_SERVICE_KEY/i.test(html + syncJs)) {
    addFailure("AfroTax browser code must not reference a privileged server key");
  }

  [
    { label: "shell", pattern: /\bshell\b/i },
    { label: "localStorage", pattern: /\blocalstorage\b/i },
    { label: "schema", pattern: /\bschema\b/i },
    { label: "debug", pattern: /\bdebug\b/i },
    { label: "Supabase actions", pattern: /\bsupabase actions\b/i },
    { label: "service role", pattern: /\bservice role\b/i },
  ].forEach((term) => {
    if (term.pattern.test(visibleLower)) addFailure(`AfroTax visible UI includes disallowed wording: ${term.label}`);
  });

  [
    "Tax calendar",
    "Evidence pack",
    "Review checklist",
    "Source review",
    "Accountant handoff",
    "Deadline reminder",
    "Review needed",
    "Source checked on",
    "Evidence pack Markdown",
    "Evidence item CSV",
    "Source review CSV",
    "Import review data",
    "Evidence draft",
    "Accountant review",
    "Cross-app import summary CSV",
    "Evidence source note Markdown",
    "Accountant packet Markdown",
    "Obligations CSV",
    "Deadlines CSV",
    "Evidence CSV",
    "Source reviews CSV",
    "Unresolved warnings CSV",
    "Handoff note",
    "Save to account",
    "Pull from account",
    "Create account workspace",
    "Choose saved client/company",
    "Download backup",
    "Last saved",
    "Review before replacing",
  ].forEach((phrase) => {
    const lower = phrase.toLowerCase();
    if (!visibleLower.includes(lower) && !docsLower.includes(lower)) {
      addFailure(`AfroTax baseline missing customer-facing term: ${phrase}`);
    }
  });

  [
    "does not file returns",
    "does not remit tax",
    "does not move salary funds",
    "does not provide official compliance confirmation",
    "must be verified before production use",
  ].forEach((phrase) => {
    const lower = phrase.toLowerCase();
    if (!visibleLower.includes(lower) && !docsLower.includes(lower)) {
      addFailure(`AfroTax baseline missing honest limitation: ${phrase}`);
    }
  });

  [
    "AFROTAX_QA_CONFIRM",
    "AFROTAX_QA_EMAIL",
    "AFROTAX_QA_ACCESS_TOKEN",
    "AFROTAX_QA_TAG",
    "--cleanup",
    "dry-run",
  ].forEach((token) => {
    if (!fixtureJs.includes(token)) addFailure(`AfroTax fixture missing guard or mode: ${token}`);
    if (!qa.includes(token)) addFailure(`AfroTax QA doc missing command guard or mode: ${token}`);
  });

  taxTables.forEach((table) => {
    if (!migrationSql.includes(`public.${table}`)) addFailure(`AfroTax migration missing ${table}`);
    if (!schemaText.includes(table)) addFailure(`AfroTax schema doc missing ${table}`);
    if (!briefText.includes(table)) addFailure(`AfroTax brief missing ${table}`);
    if (!migrationSql.includes(`alter table public.${table} enable row level security`) &&
        !(migrationSql.includes("alter table public.%I enable row level security") && migrationSql.includes(`'${table}'`))) {
      addFailure(`AfroTax migration does not enable RLS for ${table}`);
    }
  });

  syncTables.forEach((table) => {
    if (!syncJs.includes(table)) addFailure(`AfroTax sync helper missing account mapping for ${table}`);
  });

  [
    "isCloudAvailable",
    "loadWorkspaces",
    "createWorkspaceFromLocalSnapshot",
    "saveLocalSnapshot",
    "loadWorkspaceSnapshot",
    "recordExport",
    "recordAuditEvent",
    "compareSnapshots",
    "snapshotCounts",
    "friendlyError",
  ].forEach((method) => {
    if (!syncJs.includes(method) && !html.includes(method)) {
      addFailure(`AfroTax account bridge missing ${method}`);
    }
  });

  [
    "device newer",
    "account newer",
    "deadline count mismatch",
    "evidence count mismatch",
    "Review before replacing",
    "Backup before Pull from account",
  ].forEach((phrase) => {
    if (!syncJs.includes(phrase) && !html.includes(phrase)) {
      addFailure(`AfroTax account bridge missing conflict or backup phrase: ${phrase}`);
    }
  });

  [
    "business-levy",
    "data-calendar-view=\"this-month\"",
    "data-calendar-view=\"next-30\"",
    "data-calendar-view=\"overdue\"",
    "data-calendar-view=\"country\"",
    "data-calendar-view=\"obligation\"",
    "data-deadline-action",
    "Mark collecting data",
    "Mark ready for accountant",
    "Mark exported",
    "Reopen for review",
    "Deadline calendar CSV",
    "Overdue items CSV",
    "Obligation summary Markdown",
    "No official source linked",
    "source checked on",
    "data-evidence-item-check",
    "Evidence pack Markdown",
    "Evidence item CSV",
    "Source review CSV",
    "Stale source review",
    "Missing reviewer",
    "Unresolved warning",
    "Source review is not legal advice or official confirmation",
    "data-import-source",
    "Payroll evidence",
    "Books evidence",
    "Seller evidence via Books",
    "source not closed/finalized",
    "currency mismatch",
    "duplicate import",
    "source has warnings",
    "Cross-app import summary CSV",
    "Evidence source note Markdown",
    "Prepare packet preview",
    "Accountant packet Markdown",
    "Obligations CSV",
    "Deadlines CSV",
    "Evidence CSV",
    "Source reviews CSV",
    "Unresolved warnings CSV",
    "Readiness guard",
  ].forEach((phrase) => {
    if (!html.includes(phrase) && !syncJs.includes(phrase) && !docsLower.includes(phrase.toLowerCase())) {
      addFailure(`AfroTax calendar workflow missing: ${phrase}`);
    }
  });

  [
    "private.tax_can_access",
    "private.tax_can_edit",
    "private.tax_can_review",
    "private.tax_can_manage",
  ].forEach((helper) => {
    if (!migrationSql.includes(helper)) addFailure(`AfroTax migration missing RLS helper ${helper}`);
    if (!schemaText.includes(helper)) addFailure(`AfroTax schema doc missing RLS helper ${helper}`);
  });

  [
    "obligation_type in ('paye', 'vat', 'income_tax', 'social_security', 'withholding', 'annual_return', 'other')",
    "status in ('draft', 'scheduled', 'needs_review', 'ready_for_accountant', 'completed', 'overdue', 'deferred', 'archived')",
    "status in ('not_started', 'collecting', 'needs_review', 'ready_for_accountant', 'exported', 'archived')",
    "status in ('open', 'in_progress', 'needs_review', 'done', 'waived')",
    "export_type in ('accountant_handoff', 'evidence_summary', 'review_checklist', 'source_review', 'tax_calendar', 'audit_trail')",
    "status in ('not_started', 'current', 'review_due', 'expired', 'blocked', 'replaced')",
  ].forEach((constraint) => {
    if (!migrationSql.includes(constraint)) addFailure(`AfroTax migration missing constraint: ${constraint}`);
  });

  [
    "No filed returns",
    "No paid tax",
    "No official compliance confirmation",
    "No government portal submission",
    "No tax remittance",
    "No salary fund movement",
    "No browser use of service-role credentials",
  ].forEach((phrase) => {
    if (!docsLower.includes(phrase.toLowerCase())) {
      addFailure(`AfroTax schema doc missing limitation phrase: ${phrase}`);
    }
  });

  const dollarQuoteCount = (migrationSql.match(/\$\$/g) || []).length;
  if (dollarQuoteCount % 2 !== 0) {
    addFailure("AfroTax migration has unbalanced $$ blocks");
  }
}

if (failures.length) {
  console.error("AfroTax Pro verification failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("AfroTax Pro verification passed");
console.log("- route: /pro/apps/tax-compliance/");
console.log(`- device save key: ${deviceKey}`);
console.log(`- Payroll source signals: ${payrollKeys.length}`);
console.log(`- planned account records: ${taxTables.length}`);
