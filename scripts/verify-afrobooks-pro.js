#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const failures = [];
const route = "pro/apps/books/index.html";
const fixture = "scripts/afrobooks-qa-fixture.js";
const qaDoc = "docs/AFROBOOKS-QA.md";
const brief = "docs/AFROBOOKS-FINANCE-OS-BRIEF.md";
const schemaDoc = "docs/AFROBOOKS-SUPABASE-SCHEMA.md";
const migration = "supabase/migrations/next-afrobooks-finance-schema.sql";
const syncHelper = "assets/js/lib/afrobooks-sync.js";
const localKey = "afrobooks_finance_os_demo_v1";
const payrollKeys = ["afropayroll_pro_saved_runs", "afropayroll_pro_workspace_preview"];
const booksTables = [
  "books_clients",
  "books_entities",
  "books_team_members",
  "books_accounts",
  "books_contacts",
  "books_invoices",
  "books_invoice_lines",
  "books_payments",
  "books_expenses",
  "books_expense_documents",
  "books_journals",
  "books_journal_lines",
  "books_payroll_journal_imports",
  "books_seller_daily_close_imports",
  "books_tax_reports",
  "books_close_packs",
  "books_accountant_packets",
  "books_currency_rates",
  "books_exports",
  "books_audit_events",
];

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

[route, fixture, qaDoc, brief, schemaDoc, migration, syncHelper].forEach(assertFile);

if (!failures.length) {
  const html = read(route);
  const fixtureJs = read(fixture);
  const qa = read(qaDoc);
  const briefText = read(brief);
  const schemaText = read(schemaDoc);
  const migrationSql = read(migration);
  const syncJs = read(syncHelper);
  const visibleText = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const visibleLower = visibleText.toLowerCase();

  if (!/<meta\s+name=["']pro-required["']\s+content=["']afrotools-pro["']/i.test(html)) {
    addFailure("AfroBooks route is missing the Pro gate meta tag");
  }
  if (!/\/assets\/js\/pro-gate\.js/.test(html)) {
    addFailure("AfroBooks route does not load pro-gate.js");
  }
  if (!/\/assets\/js\/lib\/afrobooks-sync\.js/.test(html)) {
    addFailure("AfroBooks route does not load afrobooks-sync.js");
  }
  if (!html.includes(localKey)) addFailure(`AfroBooks route missing ${localKey}`);
  payrollKeys.forEach((key) => {
    if (!html.includes(key)) addFailure(`AfroBooks route missing payroll signal ${key}`);
  });
  if (/service[_-]?role|SUPABASE_AUTH_SERVICE_KEY|SUPABASE_SERVICE_KEY/i.test(html + syncJs)) {
    addFailure("AfroBooks browser code must not reference service-role keys");
  }

  [
    "supabase actions",
    "schema",
    "localstorage",
    "debug",
    "demo state",
  ].forEach((term) => {
    if (visibleLower.includes(term)) addFailure(`AfroBooks visible UI includes disallowed wording: ${term}`);
  });

  [
    "Saved on this device",
    "accountant packet",
    "does not connect to banks",
    "file tax returns",
    "remit tax",
    "Save to account",
    "Pull from account",
    "Create account workspace",
    "Choose saved business",
    "Last saved",
    "Review before replacing",
  ].forEach((phrase) => {
    if (!visibleLower.includes(phrase.toLowerCase())) {
      addFailure(`AfroBooks route missing honest copy: ${phrase}`);
    }
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
    "backupBeforeAccountPull",
  ].forEach((method) => {
    if (!syncJs.includes(method) && !html.includes(method)) {
      addFailure(`AfroBooks account bridge missing ${method}`);
    }
  });

  [
    "AFROBOOKS_QA_CONFIRM",
    "AFROBOOKS_QA_EMAIL",
    "AFROBOOKS_QA_ACCESS_TOKEN",
    "AFROBOOKS_QA_TAG",
    "--cleanup",
    "dry-run",
  ].forEach((token) => {
    if (!fixtureJs.includes(token)) addFailure(`AfroBooks fixture missing guard or mode: ${token}`);
    if (!qa.includes(token)) addFailure(`AfroBooks QA doc missing command guard or mode: ${token}`);
  });

  [
    "Save to account",
    "Saved on this device",
    "Accountant packet",
    "Draft report",
    "Review needed",
  ].forEach((phrase) => {
    if (!fixtureJs.includes(phrase) && !qa.includes(phrase) && !briefText.includes(phrase)) {
      addFailure(`AfroBooks baseline missing required wording: ${phrase}`);
    }
  });

  [
    "bank sync",
    "live accounting integration",
    "tax filing",
    "tax remittance",
    "verified bank balance",
  ].forEach((claim) => {
    const qaLower = qa.toLowerCase();
    const briefLower = briefText.toLowerCase();
    const schemaLower = schemaText.toLowerCase();
    if (!qaLower.includes(claim) && !briefLower.includes(claim) && !schemaLower.includes(claim)) {
      addFailure(`AfroBooks docs missing must-not-claim item: ${claim}`);
    }
  });

  booksTables.forEach((table) => {
    if (!migrationSql.includes(`public.${table}`)) addFailure(`AfroBooks migration missing ${table}`);
    if (!schemaText.includes(table)) addFailure(`AfroBooks schema doc missing ${table}`);
    if (!briefText.includes(table)) addFailure(`AfroBooks brief missing ${table}`);
    if (!syncJs.includes(table) && !["books_team_members", "books_expense_documents", "books_seller_daily_close_imports", "books_currency_rates", "books_audit_events"].includes(table)) {
      addFailure(`AfroBooks account bridge missing sync mapping for ${table}`);
    }
  });

  [
    "private.books_can_access",
    "private.books_can_edit",
    "private.books_can_review",
    "private.books_can_manage",
  ].forEach((helper) => {
    if (!migrationSql.includes(helper)) addFailure(`AfroBooks migration missing RLS helper ${helper}`);
    if (!schemaText.includes(helper)) addFailure(`AfroBooks schema doc missing RLS helper ${helper}`);
  });

  booksTables.forEach((table) => {
    if (!migrationSql.includes(`alter table public.${table} enable row level security`) &&
        !(migrationSql.includes("alter table public.%I enable row level security") && migrationSql.includes(`'${table}'`))) {
      addFailure(`AfroBooks migration does not enable RLS for ${table}`);
    }
  });

  [
    "tax filing",
    "tax remittance",
    "verified bank balances",
    "bank sync",
    "accounting API posting",
    "No storage bucket is created",
    "Save to account",
    "Review before replacing",
    "not automatic sync",
  ].forEach((phrase) => {
    if (!schemaText.toLowerCase().includes(phrase.toLowerCase())) {
      addFailure(`AfroBooks schema doc missing boundary phrase: ${phrase}`);
    }
  });
}

if (failures.length) {
  console.error("AfroBooks Pro verification failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("AfroBooks Pro verification passed");
console.log("- route: /pro/apps/books/");
console.log(`- device save key: ${localKey}`);
console.log(`- payroll signals: ${payrollKeys.length}`);
console.log(`- books tables: ${booksTables.length}`);
