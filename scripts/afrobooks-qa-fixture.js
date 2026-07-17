#!/usr/bin/env node
"use strict";

/**
 * Safe AfroBooks QA fixture harness.
 *
 * Default mode is dry-run. Live writes require:
 * - --live
 * - AFROBOOKS_QA_CONFIRM=1
 * - AFROBOOKS_QA_TAG or --tag
 * - AFROBOOKS_QA_EMAIL with a clear QA/test/sandbox identity
 * - AFROBOOKS_QA_ACCESS_TOKEN for the signed-in QA user
 * - SUPABASE_AUTH_ANON_KEY, SUPABASE_ANON_KEY, or SUPABASE_PUBLISHABLE_KEY
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const STORAGE_KEY = "afrobooks_finance_os_demo_v1";
const PAYROLL_SAVES_KEY = "afropayroll_pro_saved_runs";
const PAYROLL_DRAFT_KEY = "afropayroll_pro_workspace_preview";
const SELLER_KEY = "afroseller_social_commerce_os_v1";
const FIXTURE_SOURCE = "afrobooks-qa-fixture";

const ACCOUNT_TABLES = [
  "books_clients",
  "books_entities",
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
  "books_audit_events",
];

const CLEANUP_TABLES = ACCOUNT_TABLES.slice().reverse();

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
const explicitTag = args.tag || process.env.AFROBOOKS_QA_TAG || "";
const fixtureTag = sanitizeTag(explicitTag || createTag());
const confirmLive = process.env.AFROBOOKS_QA_CONFIRM === "1";
const dryRun = args.dryRun === true || args.live !== true || !confirmLive;
const supabaseUrl = (process.env.SUPABASE_AUTH_URL || process.env.SUPABASE_URL || "https://zpclagtgczsygrgztlts.supabase.co").replace(/\/+$/g, "");
const anonKey = process.env.SUPABASE_AUTH_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";
const accessToken = process.env.AFROBOOKS_QA_ACCESS_TOKEN || "";
const qaUserId = process.env.AFROBOOKS_QA_USER_ID || "";
const qaEmail = process.env.AFROBOOKS_QA_EMAIL || "";

function sanitizeTag(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function createTag() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `qa_books_${stamp}_${crypto.randomBytes(3).toString("hex")}`;
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
    fail("Cleanup refused. Set AFROBOOKS_QA_TAG or pass --tag with the exact QA fixture tag.");
  }
}

function assertLiveAllowed() {
  if (dryRun) return;
  if (!fixtureTag || !explicitTag) {
    fail("Live writes refused. Set AFROBOOKS_QA_TAG or pass --tag so cleanup can target the fixture.");
  }
  if (!anonKey) fail("Live writes refused. Set SUPABASE_AUTH_ANON_KEY, SUPABASE_ANON_KEY, or SUPABASE_PUBLISHABLE_KEY.");
  if (!accessToken) fail("Live writes refused. Set AFROBOOKS_QA_ACCESS_TOKEN for a signed-in QA user.");
  if (!qaEmail || !isSafeQaEmail(qaEmail)) {
    fail("Live writes refused. Set AFROBOOKS_QA_EMAIL to a clear QA/test/fixture/sandbox email.");
  }
}

function localContractCheck() {
  const html = read("pro/apps/books/index.html");
  const brief = read("docs/AFROBOOKS-FINANCE-OS-BRIEF.md");
  const missing = [];

  if (!/<meta\s+name=["']pro-required["']\s+content=["']afrotools-pro["']/i.test(html)) {
    missing.push("AfroBooks route is missing the Pro gate meta tag");
  }
  if (!/\/assets\/js\/pro-gate\.js/.test(html)) {
    missing.push("AfroBooks route does not load pro-gate.js");
  }
  [STORAGE_KEY, PAYROLL_SAVES_KEY, PAYROLL_DRAFT_KEY].forEach((key) => {
    if (!html.includes(key)) missing.push(`AfroBooks route missing device save signal ${key}`);
    if (!brief.includes(key)) missing.push(`AfroBooks brief missing device save signal ${key}`);
  });
  [
    "does not sync bank feeds",
    "does not post to accounting systems",
    "does not file tax returns or remit tax",
  ].forEach((phrase) => {
    if (!brief.toLowerCase().includes(phrase)) missing.push(`AfroBooks brief missing limitation: ${phrase}`);
  });
  if (/service[_-]?role|SUPABASE_AUTH_SERVICE_KEY|SUPABASE_SERVICE_KEY/i.test(html)) {
    missing.push("AfroBooks route appears to reference a service-role key");
  }

  if (missing.length) {
    fail(`Local contract check failed:\n- ${missing.join("\n- ")}`);
  }
  logStep("local contract", "PASS", "route, Pro gate, device signals, and product limits are present");
}

function meta(extra) {
  return Object.assign({
    fixture_tag: fixtureTag,
    qa_fixture: true,
    source: FIXTURE_SOURCE,
  }, extra || {});
}

function sellerRouteHasDeviceSaveKey() {
  try {
    return read("pro/apps/seller/index.html").includes(SELLER_KEY);
  } catch (error) {
    return false;
  }
}

function buildFixture() {
  const today = "2026-05-10";
  const dueDate = "2026-05-25";
  const sellerCloseAvailable = sellerRouteHasDeviceSaveKey();
  const clientLocalId = "qa-books-client";
  const entityLocalId = "qa-books-entity";
  const invoiceLocalId = "qa-books-invoice-001";
  const customerLocalId = "qa-books-customer-001";
  const vendorLocalId = "qa-books-vendor-001";
  const payrollJournalLocalId = "qa-books-payroll-journal-001";
  const sellerJournalLocalId = "qa-books-seller-close-journal-001";
  const closePackLocalId = "qa-books-close-pack-001";
  const accountantPacketLocalId = "qa-books-accountant-packet-001";

  return {
    tag: fixtureTag,
    sellerCloseAvailable,
    clients: [
      {
        localId: clientLocalId,
        row: {
          owner_id: qaUserId || null,
          display_name: `[QA Fixture] AfroBooks Client ${fixtureTag}`,
          status: "active",
          metadata: meta({ local_id: clientLocalId, customer_label: "Save to account test client" }),
        },
      },
    ],
    entities: [
      {
        localId: entityLocalId,
        clientLocalId,
        row: {
          legal_name: `[QA Fixture] Lagos Market Studio ${fixtureTag}`,
          trading_name: "Lagos Market Studio QA",
          entity_type: "sme",
          country: "NG",
          base_currency: "NGN",
          review_status: "Review needed",
          metadata: meta({ local_id: entityLocalId }),
        },
      },
    ],
    contacts: [
      {
        localId: customerLocalId,
        entityLocalId,
        row: {
          name: "QA Customer Amina Trading",
          contact_type: "customer",
          email: `qa.books.customer+${fixtureTag}@example.com`,
          phone: "+10000000010",
          payment_terms: "14 days",
          metadata: meta({ local_id: customerLocalId }),
        },
      },
      {
        localId: vendorLocalId,
        entityLocalId,
        row: {
          name: "QA Vendor Market Supplies",
          contact_type: "vendor",
          email: `qa.books.vendor+${fixtureTag}@example.com`,
          phone: "+10000000011",
          payment_terms: "cash or supplier credit",
          metadata: meta({ local_id: vendorLocalId }),
        },
      },
    ],
    accounts: [
      { localId: "qa-books-account-cash", entityLocalId, row: { account_code: "1000", account_name: "Cash and mobile money", account_type: "asset", currency_code: "NGN", metadata: meta({ local_id: "qa-books-account-cash" }) } },
      { localId: "qa-books-account-revenue", entityLocalId, row: { account_code: "4000", account_name: "Sales revenue", account_type: "income", currency_code: "NGN", metadata: meta({ local_id: "qa-books-account-revenue" }) } },
      { localId: "qa-books-account-expense", entityLocalId, row: { account_code: "5000", account_name: "Operating expenses", account_type: "expense", currency_code: "NGN", metadata: meta({ local_id: "qa-books-account-expense" }) } },
      { localId: "qa-books-account-payroll", entityLocalId, row: { account_code: "5100", account_name: "Payroll cost", account_type: "expense", currency_code: "NGN", metadata: meta({ local_id: "qa-books-account-payroll" }) } },
    ],
    invoices: [
      {
        localId: invoiceLocalId,
        entityLocalId,
        contactLocalId: customerLocalId,
        row: {
          invoice_no: `QA-BK-${fixtureTag}-001`,
          issue_date: today,
          due_date: dueDate,
          currency_code: "NGN",
          subtotal_amount: 275000,
          tax_amount: 20625,
          total_amount: 295625,
          balance_due: 175625,
          status: "Review needed",
          payment_rail: "bank transfer",
          metadata: meta({ local_id: invoiceLocalId }),
        },
      },
    ],
    invoiceLines: [
      {
        localId: "qa-books-line-001",
        invoiceLocalId,
        row: {
          description: "Market launch advisory",
          quantity: 1,
          unit_price: 175000,
          tax_rate: 7.5,
          line_total: 188125,
          metadata: meta({ local_id: "qa-books-line-001" }),
        },
      },
      {
        localId: "qa-books-line-002",
        invoiceLocalId,
        row: {
          description: "Sales record cleanup",
          quantity: 2,
          unit_price: 50000,
          tax_rate: 7.5,
          line_total: 107500,
          metadata: meta({ local_id: "qa-books-line-002" }),
        },
      },
    ],
    payments: [
      {
        localId: "qa-books-payment-001",
        entityLocalId,
        contactLocalId: customerLocalId,
        invoiceLocalId,
        row: {
          payment_date: today,
          amount: 120000,
          currency_code: "NGN",
          payment_rail: "mobile money",
          reference_note: "QA manual payment record only",
          verification_status: "Review needed",
          metadata: meta({ local_id: "qa-books-payment-001" }),
        },
      },
    ],
    expenses: [
      {
        localId: "qa-books-expense-001",
        entityLocalId,
        contactLocalId: vendorLocalId,
        row: {
          expense_date: today,
          vendor_name: "QA Vendor Market Supplies",
          category: "operating expense",
          amount: 64000,
          currency_code: "NGN",
          payment_rail: "cash",
          receipt_status: "Review needed",
          review_status: "Review needed",
          metadata: meta({ local_id: "qa-books-expense-001" }),
        },
      },
    ],
    expenseDocuments: [
      {
        localId: "qa-books-expense-doc-001",
        expenseLocalId: "qa-books-expense-001",
        row: {
          file_name: `qa-books-expense-${fixtureTag}.txt`,
          file_type: "text/plain",
          document_note: "QA receipt note only. No file upload in this fixture.",
          metadata: meta({ local_id: "qa-books-expense-doc-001" }),
        },
      },
    ],
    journals: [
      {
        localId: payrollJournalLocalId,
        entityLocalId,
        row: {
          journal_no: `QA-PAY-JRN-${fixtureTag}`,
          journal_date: today,
          source_area: "AfroPayroll",
          title: "Payroll journal import",
          status: "Draft report",
          total_debit: 245000,
          total_credit: 245000,
          metadata: meta({ local_id: payrollJournalLocalId, source_key: PAYROLL_SAVES_KEY }),
        },
      },
    ].concat(sellerCloseAvailable ? [
      {
        localId: sellerJournalLocalId,
        entityLocalId,
        row: {
          journal_no: `QA-SELLER-CLOSE-${fixtureTag}`,
          journal_date: today,
          source_area: "AfroSeller",
          title: "Seller daily close journal",
          status: "Draft report",
          total_debit: 180000,
          total_credit: 180000,
          metadata: meta({ local_id: sellerJournalLocalId, source_key: SELLER_KEY }),
        },
      },
    ] : []),
    journalLines: [
      { journalLocalId: payrollJournalLocalId, localId: "qa-payroll-debit", row: { line_no: 1, account_code: "5100", description: "Payroll cost from saved payroll signal", debit_amount: 245000, credit_amount: 0, metadata: meta({ local_id: "qa-payroll-debit" }) } },
      { journalLocalId: payrollJournalLocalId, localId: "qa-payroll-credit", row: { line_no: 2, account_code: "1000", description: "Payroll payment handoff", debit_amount: 0, credit_amount: 245000, metadata: meta({ local_id: "qa-payroll-credit" }) } },
    ].concat(sellerCloseAvailable ? [
      { journalLocalId: sellerJournalLocalId, localId: "qa-seller-close-debit", row: { line_no: 1, account_code: "1000", description: "Seller daily close cash and mobile money", debit_amount: 180000, credit_amount: 0, metadata: meta({ local_id: "qa-seller-close-debit" }) } },
      { journalLocalId: sellerJournalLocalId, localId: "qa-seller-close-credit", row: { line_no: 2, account_code: "4000", description: "Seller daily close sales", debit_amount: 0, credit_amount: 180000, metadata: meta({ local_id: "qa-seller-close-credit" }) } },
    ] : []),
    payrollImports: [
      {
        localId: "qa-books-payroll-import-001",
        entityLocalId,
        journalLocalId: payrollJournalLocalId,
        row: {
          source_label: "AfroPayroll saved run",
          period_label: "May 2026",
          employee_count: 2,
          gross_pay: 245000,
          status: "Review needed",
          metadata: meta({ local_id: "qa-books-payroll-import-001", source_key: PAYROLL_DRAFT_KEY }),
        },
      },
    ],
    sellerDailyCloseImports: sellerCloseAvailable ? [
      {
        localId: "qa-books-seller-close-import-001",
        entityLocalId,
        journalLocalId: sellerJournalLocalId,
        row: {
          close_date: today,
          sales_today: 180000,
          payments_recorded: 145000,
          unpaid_balances: 35000,
          cash_difference: 0,
          status: "Review needed",
          metadata: meta({ local_id: "qa-books-seller-close-import-001", source_key: SELLER_KEY }),
        },
      },
    ] : [],
    taxReports: [
      {
        localId: "qa-books-tax-report-001",
        entityLocalId,
        row: {
          report_type: "VAT summary",
          period_label: "May 2026",
          status: "Draft report",
          review_note: "Draft report for accountant review. This fixture does not file or remit tax.",
          metadata: meta({ local_id: "qa-books-tax-report-001" }),
        },
      },
    ],
    closePacks: [
      {
        localId: closePackLocalId,
        entityLocalId,
        row: {
          period_label: "May 2026",
          status: "Review needed",
          packet_title: "May 2026 close pack",
          checklist: {
            invoices: "Review needed",
            expenses: "Review needed",
            payroll: "Draft report",
            seller_daily_close: sellerCloseAvailable ? "Draft report" : "Not included",
          },
          metadata: meta({ local_id: closePackLocalId }),
        },
      },
    ],
    accountantPackets: [
      {
        localId: accountantPacketLocalId,
        entityLocalId,
        closePackLocalId,
        row: {
          packet_title: "May 2026 Accountant packet",
          status: "Draft report",
          delivery_note: "Accountant packet prepared for review.",
          metadata: meta({ local_id: accountantPacketLocalId }),
        },
      },
    ],
    currencyRates: [
      {
        localId: "qa-books-currency-ngn",
        entityLocalId,
        row: {
          base_currency: "NGN",
          quote_currency: "USD",
          rate: 0.00066,
          rate_date: today,
          source_note: "Manual QA view only",
          metadata: meta({ local_id: "qa-books-currency-ngn" }),
        },
      },
    ],
    auditEvents: [
      {
        localId: "qa-books-audit-import",
        entityLocalId,
        row: {
          event_type: "import_review",
          event_note: "QA fixture planned CSV/import/export review record.",
          actor_email: qaEmail || `qa.books+${fixtureTag}@example.com`,
          metadata: meta({ local_id: "qa-books-audit-import" }),
        },
      },
      {
        localId: "qa-books-audit-export",
        entityLocalId,
        row: {
          event_type: "accountant_packet_export",
          event_note: "QA fixture planned Accountant packet export record.",
          actor_email: qaEmail || `qa.books+${fixtureTag}@example.com`,
          metadata: meta({ local_id: "qa-books-audit-export" }),
        },
      },
    ],
  };
}

function countPlan(fixture) {
  return {
    books_clients: fixture.clients.length,
    books_entities: fixture.entities.length,
    books_accounts: fixture.accounts.length,
    books_contacts: fixture.contacts.length,
    books_invoices: fixture.invoices.length,
    books_invoice_lines: fixture.invoiceLines.length,
    books_payments: fixture.payments.length,
    books_expenses: fixture.expenses.length,
    books_expense_documents: fixture.expenseDocuments.length,
    books_journals: fixture.journals.length,
    books_journal_lines: fixture.journalLines.length,
    books_payroll_journal_imports: fixture.payrollImports.length,
    books_seller_daily_close_imports: fixture.sellerDailyCloseImports.length,
    books_tax_reports: fixture.taxReports.length,
    books_close_packs: fixture.closePacks.length,
    books_accountant_packets: fixture.accountantPackets.length,
    books_currency_rates: fixture.currencyRates.length,
    books_audit_events: fixture.auditEvents.length,
  };
}

function printPlan(fixture) {
  console.log(`\nAfroBooks QA fixture tag: ${fixture.tag}`);
  console.log(`Mode: ${dryRun ? "dry-run" : "live"}`);
  console.log("\nPlanned account records:");
  Object.entries(countPlan(fixture)).forEach(([table, count]) => {
    logStep(table, dryRun ? "PLAN" : "READY", `${count} row(s)`);
  });
  logStep("Seller daily close journal", fixture.sellerCloseAvailable ? "PLAN" : "SKIP", fixture.sellerCloseAvailable ? "seller device save key found" : "seller device save key not found");
}

function printTruthBaseline() {
  console.log("\nProduct truth baseline:");
  console.log("- Works on this device: cashflow snapshot, invoice batch, expense entry, CSV expense import, payroll journal from saved payroll signals, Draft report labels, receivables/payables, currency view, close pack, Accountant packet manifest, and local export behavior.");
  console.log("- Save to account: controls are present, but live success is not claimed until the AfroBooks account record set exists and signed-in QA rows are tested.");
  console.log("- Not implemented: bank sync, live accounting integration, tax filing, tax remittance, verified bank balance, automatic payment settlement, and account-backed close history.");
  console.log("- Must not be claimed: bank-connected balances, submitted tax returns, remitted tax, verified settlement, or live accounting system posting.");
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
    fail("Live writes refused. AFROBOOKS_QA_USER_ID does not match AFROBOOKS_QA_ACCESS_TOKEN.");
  }
  if (data && data.email && qaEmail && data.email.toLowerCase() !== qaEmail.toLowerCase()) {
    fail("Live writes refused. AFROBOOKS_QA_EMAIL does not match AFROBOOKS_QA_ACCESS_TOKEN.");
  }
  if (data && data.email && !isSafeQaEmail(data.email)) {
    fail("Live writes refused. Signed-in email must clearly be QA/test/fixture/sandbox.");
  }
  logStep("qa user", "PASS", data && data.email ? data.email : "signed-in QA user");
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
  for (const table of ACCOUNT_TABLES) {
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

function mapByLocalId(rows) {
  const map = {};
  rows.forEach((row) => {
    if (row && row.metadata && row.metadata.local_id) map[row.metadata.local_id] = row.id;
  });
  return map;
}

function withId(row, key, value) {
  return Object.assign({}, row, { [key]: value || null });
}

async function insertRows(table, rows, select) {
  if (!rows.length) return [];
  const result = await restRequest("POST", table, qp({ select: select || "*" }), rows);
  logStep(table, "PASS", `${result.length} row(s)`);
  return result;
}

async function createLiveFixture(fixture) {
  assertLiveAllowed();
  await authUser();

  const tableMap = await availableTables();
  const missing = ACCOUNT_TABLES.filter((table) => !tableMap[table]);
  if (missing.length) {
    logStep("account record set", "PLAN", `${missing.length} books table(s) not available, no rows inserted`);
    missing.forEach((table) => logStep(table, "MISSING", "planned only"));
    return { plannedOnly: true, tag: fixture.tag, missing };
  }

  const existing = await restRequest("GET", "books_clients", qp({
    select: "id,display_name,metadata",
    "metadata->>fixture_tag": `eq.${fixture.tag}`,
  }));
  if (existing.length) {
    fail(`Live create refused. Fixture tag already exists on ${existing.length} client row(s). Run cleanup first or use a new tag.`);
  }

  const clientRows = await insertRows("books_clients", fixture.clients.map((item) => item.row));
  const clientIds = mapByLocalId(clientRows);

  const entityRows = await insertRows("books_entities", fixture.entities.map((item) => withId(item.row, "client_id", clientIds[item.clientLocalId])));
  const entityIds = mapByLocalId(entityRows);

  await insertRows("books_accounts", fixture.accounts.map((item) => withId(item.row, "entity_id", entityIds[item.entityLocalId])));
  const contactRows = await insertRows("books_contacts", fixture.contacts.map((item) => withId(item.row, "entity_id", entityIds[item.entityLocalId])));
  const contactIds = mapByLocalId(contactRows);

  const invoiceRows = await insertRows("books_invoices", fixture.invoices.map((item) => Object.assign(
    withId(item.row, "entity_id", entityIds[item.entityLocalId]),
    { contact_id: contactIds[item.contactLocalId] || null }
  )));
  const invoiceIds = mapByLocalId(invoiceRows);

  await insertRows("books_invoice_lines", fixture.invoiceLines.map((item) => withId(item.row, "invoice_id", invoiceIds[item.invoiceLocalId])));
  await insertRows("books_payments", fixture.payments.map((item) => Object.assign(
    withId(item.row, "entity_id", entityIds[item.entityLocalId]),
    { contact_id: contactIds[item.contactLocalId] || null, invoice_id: invoiceIds[item.invoiceLocalId] || null }
  )));

  const expenseRows = await insertRows("books_expenses", fixture.expenses.map((item) => Object.assign(
    withId(item.row, "entity_id", entityIds[item.entityLocalId]),
    { contact_id: contactIds[item.contactLocalId] || null }
  )));
  const expenseIds = mapByLocalId(expenseRows);

  await insertRows("books_expense_documents", fixture.expenseDocuments.map((item) => withId(item.row, "expense_id", expenseIds[item.expenseLocalId])));

  const journalRows = await insertRows("books_journals", fixture.journals.map((item) => withId(item.row, "entity_id", entityIds[item.entityLocalId])));
  const journalIds = mapByLocalId(journalRows);

  await insertRows("books_journal_lines", fixture.journalLines.map((item) => withId(item.row, "journal_id", journalIds[item.journalLocalId])));
  await insertRows("books_payroll_journal_imports", fixture.payrollImports.map((item) => Object.assign(
    withId(item.row, "entity_id", entityIds[item.entityLocalId]),
    { journal_id: journalIds[item.journalLocalId] || null }
  )));
  await insertRows("books_seller_daily_close_imports", fixture.sellerDailyCloseImports.map((item) => Object.assign(
    withId(item.row, "entity_id", entityIds[item.entityLocalId]),
    { journal_id: journalIds[item.journalLocalId] || null }
  )));
  await insertRows("books_tax_reports", fixture.taxReports.map((item) => withId(item.row, "entity_id", entityIds[item.entityLocalId])));

  const closePackRows = await insertRows("books_close_packs", fixture.closePacks.map((item) => withId(item.row, "entity_id", entityIds[item.entityLocalId])));
  const closePackIds = mapByLocalId(closePackRows);

  await insertRows("books_accountant_packets", fixture.accountantPackets.map((item) => Object.assign(
    withId(item.row, "entity_id", entityIds[item.entityLocalId]),
    { close_pack_id: closePackIds[item.closePackLocalId] || null }
  )));
  await insertRows("books_currency_rates", fixture.currencyRates.map((item) => withId(item.row, "entity_id", entityIds[item.entityLocalId])));
  await insertRows("books_audit_events", fixture.auditEvents.map((item) => withId(item.row, "entity_id", entityIds[item.entityLocalId])));

  return { plannedOnly: false, tag: fixture.tag, counts: countPlan(fixture) };
}

async function cleanupLiveFixture(tag) {
  assertTagForCleanup();
  assertLiveAllowed();
  await authUser();

  const tableMap = await availableTables();
  const missing = ACCOUNT_TABLES.filter((table) => !tableMap[table]);
  if (missing.length === ACCOUNT_TABLES.length) {
    logStep("cleanup lookup", "PLAN", "AfroBooks account records are not available, so no rows can be deleted");
    return { tag, deleted: {}, missing };
  }

  const deleted = {};
  for (const table of CLEANUP_TABLES.filter((item) => tableMap[item])) {
    const rows = await restRequest("DELETE", table, qp({
      select: "id,metadata",
      "metadata->>fixture_tag": `eq.${tag}`,
    }));
    deleted[table] = rows.length;
    logStep(table, "DELETE", `${rows.length} tagged row(s)`);
  }
  return { tag, deleted, missing };
}

async function dryRunCleanup(tag) {
  assertTagForCleanup();
  console.log(`\nDry-run cleanup for fixture tag: ${tag}`);
  CLEANUP_TABLES.forEach((table) => {
    logStep(table, "DRY-RUN", "would delete rows where metadata.fixture_tag matches the tag");
  });
}

async function main() {
  const fixture = buildFixture();
  localContractCheck();
  printPlan(fixture);
  printTruthBaseline();

  if (mode === "baseline" || mode === "tables") return;

  if (args.live && !confirmLive) {
    logStep("live guard", "REFUSE", "AFROBOOKS_QA_CONFIRM=1 is not set, so no writes will run");
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
  console.error(`AfroBooks QA fixture failed: ${error.message}`);
  process.exit(1);
});
