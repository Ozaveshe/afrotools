#!/usr/bin/env node
"use strict";

/**
 * Safe AfroTax Compliance OS QA fixture harness.
 *
 * Default mode is dry-run. Live writes require:
 * - --live
 * - AFROTAX_QA_CONFIRM=1
 * - AFROTAX_QA_TAG or --tag
 * - AFROTAX_QA_EMAIL with a clear QA/test/sandbox identity
 * - AFROTAX_QA_ACCESS_TOKEN for the signed-in QA user
 * - SUPABASE_AUTH_ANON_KEY, SUPABASE_ANON_KEY, or SUPABASE_PUBLISHABLE_KEY
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROUTE = "pro/apps/tax-compliance/index.html";
const BRIEF = "docs/AFROTAX-COMPLIANCE-OS-BRIEF.md";
const QA_DOC = "docs/AFROTAX-QA.md";
const DEVICE_KEY = "afrotax_compliance_os_demo_v1";
const PAYROLL_KEYS = ["afropayroll_pro_saved_runs", "afropayroll_pro_workspace_preview"];
const FIXTURE_SOURCE = "afrotax-qa-fixture";

const ACCOUNT_TABLES = [
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
const explicitTag = args.tag || process.env.AFROTAX_QA_TAG || "";
const fixtureTag = sanitizeTag(explicitTag || createTag());
const confirmLive = process.env.AFROTAX_QA_CONFIRM === "1";
const dryRun = args.dryRun === true || args.live !== true || !confirmLive;
const supabaseUrl = (process.env.SUPABASE_AUTH_URL || process.env.SUPABASE_URL || "https://zpclagtgczsygrgztlts.supabase.co").replace(/\/+$/g, "");
const anonKey = process.env.SUPABASE_AUTH_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";
const accessToken = process.env.AFROTAX_QA_ACCESS_TOKEN || "";
const qaUserId = process.env.AFROTAX_QA_USER_ID || "";
const qaEmail = process.env.AFROTAX_QA_EMAIL || "";

function sanitizeTag(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function createTag() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `qa_tax_${stamp}_${crypto.randomBytes(3).toString("hex")}`;
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
    fail("Cleanup refused. Set AFROTAX_QA_TAG or pass --tag with the exact QA fixture tag.");
  }
}

function assertLiveAllowed() {
  if (dryRun) return;
  if (!explicitTag || !fixtureTag) {
    fail("Live writes refused. Set AFROTAX_QA_TAG or pass --tag so cleanup can target only this fixture.");
  }
  if (!anonKey) {
    fail("Live writes refused. Set SUPABASE_AUTH_ANON_KEY, SUPABASE_ANON_KEY, or SUPABASE_PUBLISHABLE_KEY.");
  }
  if (!accessToken) {
    fail("Live writes refused. Set AFROTAX_QA_ACCESS_TOKEN for a signed-in QA user.");
  }
  if (!qaEmail || !isSafeQaEmail(qaEmail)) {
    fail("Live writes refused. Set AFROTAX_QA_EMAIL to a clear QA, test, fixture, sandbox, or example.com email.");
  }
}

function localContractCheck() {
  const html = read(ROUTE);
  const brief = read(BRIEF);
  const qa = fs.existsSync(rel(QA_DOC)) ? read(QA_DOC) : "";
  const missing = [];

  if (!/<meta\s+name=["']pro-required["']\s+content=["']afrotools-pro["']/i.test(html)) {
    missing.push("AfroTax route is missing the Pro gate meta tag");
  }
  if (!/\/assets\/js\/pro-gate\.js/.test(html)) {
    missing.push("AfroTax route does not load pro-gate.js");
  }
  if (!html.includes(DEVICE_KEY)) missing.push(`AfroTax route missing device save key ${DEVICE_KEY}`);
  PAYROLL_KEYS.forEach((key) => {
    if (!html.includes(key)) missing.push(`AfroTax route missing Payroll source signal ${key}`);
    if (!brief.includes(key)) missing.push(`AfroTax brief missing Payroll source signal ${key}`);
  });
  if (/service[_-]?role|SUPABASE_AUTH_SERVICE_KEY|SUPABASE_SERVICE_KEY/i.test(html)) {
    missing.push("AfroTax browser route appears to reference a privileged server key");
  }
  [
    "Tax calendar",
    "Evidence pack",
    "Review checklist",
    "Source review",
    "Accountant handoff",
  ].forEach((phrase) => {
    if (!brief.toLowerCase().includes(phrase.toLowerCase()) && !qa.toLowerCase().includes(phrase.toLowerCase())) {
      missing.push(`AfroTax docs missing customer-facing term: ${phrase}`);
    }
  });
  [
    "does not file returns",
    "does not remit tax",
    "does not move salary funds",
    "does not provide official compliance confirmation",
    "must be verified before production use",
  ].forEach((phrase) => {
    const haystack = `${html}\n${brief}\n${qa}`.toLowerCase();
    if (!haystack.includes(phrase.toLowerCase())) {
      missing.push(`AfroTax docs or route missing limitation: ${phrase}`);
    }
  });

  if (missing.length) {
    fail(`Local contract check failed:\n- ${missing.join("\n- ")}`);
  }
  logStep("local contract", "PASS", "route, Pro gate, source signals, and product limits are present");
}

function meta(extra) {
  return Object.assign({
    fixture_tag: fixtureTag,
    qa_fixture: true,
    source: FIXTURE_SOURCE,
  }, extra || {});
}

function countryLanes() {
  return [
    {
      localId: "qa-tax-country-ng",
      code: "NG",
      name: "Nigeria",
      authority: "FIRS and state tax authorities",
      currency: "NGN",
      sourceUrl: "https://www.firs.gov.ng/",
      reviewStatus: "review_due",
      nextReview: "2026-05-20",
      obligations: [
        { localId: "qa-tax-ng-paye", name: "PAYE monthly review", type: "paye", dueDate: "2026-05-21", rateNote: "Use current authority source before production use." },
        { localId: "qa-tax-ng-vat", name: "VAT return review", type: "vat", dueDate: "2026-05-25", rateNote: "Sample rate note only." },
      ],
    },
    {
      localId: "qa-tax-country-ke",
      code: "KE",
      name: "Kenya",
      authority: "Kenya Revenue Authority",
      currency: "KES",
      sourceUrl: "https://www.kra.go.ke/",
      reviewStatus: "current",
      nextReview: "2026-05-24",
      obligations: [
        { localId: "qa-tax-ke-paye", name: "PAYE monthly review", type: "paye", dueDate: "2026-05-09", rateNote: "Past sample deadline. Verify before use." },
        { localId: "qa-tax-ke-vat", name: "VAT return review", type: "vat", dueDate: "2026-05-20", rateNote: "Sample rate note only." },
      ],
    },
    {
      localId: "qa-tax-country-za",
      code: "ZA",
      name: "South Africa",
      authority: "SARS",
      currency: "ZAR",
      sourceUrl: "https://www.sars.gov.za/",
      reviewStatus: "review_due",
      nextReview: "2026-05-18",
      obligations: [
        { localId: "qa-tax-za-paye", name: "PAYE employer review", type: "paye", dueDate: "2026-06-07", rateNote: "Sample rate note only." },
        { localId: "qa-tax-za-uif", name: "UIF evidence review", type: "social_security", dueDate: "2026-06-07", rateNote: "Contribution details must be verified." },
      ],
    },
    {
      localId: "qa-tax-country-sn",
      code: "SN",
      name: "Senegal",
      authority: "DGID",
      currency: "XOF",
      sourceUrl: "https://www.dgid.sn/",
      reviewStatus: "review_due",
      nextReview: "2026-05-22",
      obligations: [
        { localId: "qa-tax-sn-paye", name: "Payroll tax review", type: "paye", dueDate: "2026-05-15", rateNote: "French source review required." },
        { localId: "qa-tax-sn-vat", name: "VAT evidence review", type: "vat", dueDate: "2026-05-30", rateNote: "Sample rate note only." },
      ],
    },
  ];
}

function buildFixture() {
  const clientLocalId = "qa-tax-client";
  const companyLocalId = "qa-tax-company";
  const lanes = countryLanes();
  const checklistLocalIds = [
    "qa-tax-check-source",
    "qa-tax-check-payroll",
    "qa-tax-check-books",
    "qa-tax-check-evidence",
    "qa-tax-check-accountant",
  ];

  return {
    tag: fixtureTag,
    clients: [
      {
        localId: clientLocalId,
        row: {
          owner_id: qaUserId || null,
          name: `[QA Fixture] AfroTax Client ${fixtureTag}`,
          client_type: "company",
          default_country: "NG",
          default_currency: "NGN",
          default_tax_period: "May 2026",
          source_review_preference: "review-before-use",
          primary_contact_name: "QA Tax Contact",
          primary_contact_email: qaEmail || `qa.tax+${fixtureTag}@example.com`,
          status: "active",
          settings: { qa_fixture: true, source: FIXTURE_SOURCE },
          metadata: meta({ local_id: clientLocalId, customer_label: "Safe QA client" }),
        },
      },
    ],
    companies: [
      {
        localId: companyLocalId,
        clientLocalId,
        row: {
          legal_name: `[QA Fixture] Lagos Multi-Market Studio ${fixtureTag}`,
          trading_name: "Lagos Multi-Market Studio QA",
          business_type: "multi_country_operator",
          country_code: "NG",
          default_currency: "NGN",
          tax_period: "May 2026",
          tax_contact_name: "QA Tax Contact",
          tax_contact_email: qaEmail || `qa.tax+${fixtureTag}@example.com`,
          registration_number_note: "Fake QA company only.",
          tax_id_review_note: "Tax identifier review needed before production use.",
          status: "active",
          metadata: meta({ local_id: companyLocalId }),
        },
      },
    ],
    teamMembers: [
      {
        localId: "qa-tax-reviewer",
        clientLocalId,
        row: {
          invited_email: qaEmail || `qa.tax.reviewer+${fixtureTag}@example.com`,
          display_name: "QA Reviewer",
          role: "reviewer",
          status: "invited",
          metadata: meta({ local_id: "qa-tax-reviewer" }),
        },
      },
    ],
    countryPacks: lanes.map((lane) => ({
      localId: lane.localId,
      clientLocalId,
      companyLocalId,
      row: {
        country_code: lane.code,
        country_name: lane.name,
        currency_code: lane.currency,
        authority_name: lane.authority,
        source_url: lane.sourceUrl,
        source_label: lane.authority,
        support_status: "needs_source_review",
        source_review_status: lane.reviewStatus,
        last_reviewed_on: lane.reviewStatus === "current" ? "2026-05-10" : null,
        next_review_date: lane.nextReview,
        metadata: meta({ local_id: lane.localId }),
      },
    })),
    obligations: lanes.flatMap((lane) => lane.obligations.map((obligation) => ({
      localId: obligation.localId,
      clientLocalId,
      companyLocalId,
      countryLocalId: lane.localId,
      row: {
        obligation_name: obligation.name,
        obligation_type: obligation.type,
        period_label: "May 2026",
        currency_code: lane.currency,
        status: "needs_review",
        rate_note: obligation.rateNote,
        review_note: "QA obligation for accountant review only.",
        metadata: meta({ local_id: obligation.localId, country_code: lane.code }),
      },
    }))),
    deadlines: lanes.flatMap((lane) => lane.obligations.map((obligation) => ({
      localId: `${obligation.localId}-deadline`,
      clientLocalId,
      countryLocalId: lane.localId,
      obligationLocalId: obligation.localId,
      row: {
        deadline_type: obligation.type,
        title: `${obligation.name} deadline reminder`,
        period_label: "May 2026",
        due_date: obligation.dueDate,
        verification_status: lane.reviewStatus === "current" ? "source_reviewed" : "needs_source_review",
        status: obligation.dueDate < "2026-05-10" ? "overdue" : "needs_review",
        notes: "Source date, rate, and deadline must be verified before production use.",
        metadata: meta({ local_id: `${obligation.localId}-deadline`, country_code: lane.code }),
      },
    }))),
    workflowItems: [
      {
        localId: "qa-tax-workflow-setup",
        clientLocalId,
        companyLocalId,
        row: {
          title: "Set up client profile",
          workflow_stage: "setup",
          status: "done",
          due_date: "2026-05-10",
          sort_order: 10,
          metadata: meta({ local_id: "qa-tax-workflow-setup" }),
        },
      },
      {
        localId: "qa-tax-workflow-calendar",
        clientLocalId,
        companyLocalId,
        countryLocalId: "qa-tax-country-ng",
        obligationLocalId: "qa-tax-ng-paye",
        row: {
          title: "Review deadline calendar",
          workflow_stage: "calendar",
          status: "needs_review",
          due_date: "2026-05-14",
          sort_order: 20,
          metadata: meta({ local_id: "qa-tax-workflow-calendar" }),
        },
      },
      {
        localId: "qa-tax-workflow-evidence",
        clientLocalId,
        companyLocalId,
        countryLocalId: "qa-tax-country-ng",
        obligationLocalId: "qa-tax-ng-paye",
        row: {
          title: "Gather evidence draft",
          workflow_stage: "evidence",
          status: "in_progress",
          due_date: "2026-05-16",
          sort_order: 30,
          metadata: meta({ local_id: "qa-tax-workflow-evidence" }),
        },
      },
      {
        localId: "qa-tax-workflow-source",
        clientLocalId,
        companyLocalId,
        countryLocalId: "qa-tax-country-ke",
        obligationLocalId: "qa-tax-ke-vat",
        row: {
          title: "Review source dates",
          workflow_stage: "source_review",
          status: "needs_review",
          due_date: "2026-05-17",
          sort_order: 40,
          metadata: meta({ local_id: "qa-tax-workflow-source" }),
        },
      },
      {
        localId: "qa-tax-workflow-checklist",
        clientLocalId,
        companyLocalId,
        countryLocalId: "qa-tax-country-za",
        obligationLocalId: "qa-tax-za-paye",
        row: {
          title: "Complete review checklist",
          workflow_stage: "checklist",
          status: "needs_review",
          due_date: "2026-05-18",
          sort_order: 50,
          metadata: meta({ local_id: "qa-tax-workflow-checklist" }),
        },
      },
      {
        localId: "qa-tax-workflow-handoff",
        clientLocalId,
        companyLocalId,
        countryLocalId: "qa-tax-country-sn",
        obligationLocalId: "qa-tax-sn-vat",
        row: {
          title: "Prepare accountant packet",
          workflow_stage: "accountant_handoff",
          status: "ready_for_accountant",
          due_date: "2026-05-19",
          sort_order: 60,
          metadata: meta({ local_id: "qa-tax-workflow-handoff" }),
        },
      },
    ],
    evidencePacks: lanes.map((lane) => ({
      localId: `qa-tax-evidence-${lane.code.toLowerCase()}`,
      clientLocalId,
      companyLocalId,
      countryLocalId: lane.localId,
      obligationLocalId: lane.obligations[0].localId,
      row: {
        title: `${lane.name} May 2026 Evidence pack`,
        period_label: "May 2026",
        status: "needs_review",
        source_summary: "Payroll source signal, draft finance close note, and authority source review placeholder.",
        metadata: meta({ local_id: `qa-tax-evidence-${lane.code.toLowerCase()}`, country_code: lane.code }),
      },
    })),
    evidenceDocuments: lanes.map((lane) => ({
      localId: `qa-tax-document-${lane.code.toLowerCase()}`,
      clientLocalId,
      evidenceLocalId: `qa-tax-evidence-${lane.code.toLowerCase()}`,
      row: {
        document_title: `${lane.name} May 2026 evidence source note`,
        document_type: "source_note",
        source_label: lane.code === "NG" || lane.code === "ZA" ? "Payroll" : "Books",
        status: "needs_review",
        review_note: "Document metadata only. No file upload is claimed by this fixture.",
        metadata: meta({ local_id: `qa-tax-document-${lane.code.toLowerCase()}`, country_code: lane.code }),
      },
    })),
    sourceReviews: lanes.map((lane) => ({
      localId: `qa-tax-source-${lane.code.toLowerCase()}`,
      clientLocalId,
      countryLocalId: lane.localId,
      obligationLocalId: lane.obligations[0].localId,
      row: {
        source_label: lane.authority,
        source_url: lane.sourceUrl,
        review_date: "2026-05-10",
        next_review_date: lane.nextReview,
        status: lane.reviewStatus,
        notes: "Sample source review. Confirm dates and rates before production use.",
        metadata: meta({ local_id: `qa-tax-source-${lane.code.toLowerCase()}`, country_code: lane.code }),
      },
    })),
    checklistItems: [
      {
        localId: checklistLocalIds[0],
        clientLocalId,
        countryLocalId: "qa-tax-country-ng",
        row: {
          item_title: "Source review completed",
          item_group: "Source review",
          status: "open",
          reviewer_role: "accountant",
          metadata: meta({ local_id: checklistLocalIds[0] }),
        },
      },
      {
        localId: checklistLocalIds[1],
        clientLocalId,
        countryLocalId: "qa-tax-country-ng",
        evidenceLocalId: "qa-tax-evidence-ng",
        obligationLocalId: "qa-tax-ng-paye",
        row: {
          item_title: "Payroll totals attached",
          item_group: "Evidence pack",
          status: "needs_review",
          reviewer_role: "payroll admin",
          metadata: meta({ local_id: checklistLocalIds[1], source_key: PAYROLL_KEYS[1] }),
        },
      },
      {
        localId: checklistLocalIds[2],
        clientLocalId,
        countryLocalId: "qa-tax-country-ke",
        evidenceLocalId: "qa-tax-evidence-ke",
        obligationLocalId: "qa-tax-ke-vat",
        row: {
          item_title: "Close pack draft attached",
          item_group: "Evidence pack",
          status: "open",
          reviewer_role: "bookkeeper",
          metadata: meta({ local_id: checklistLocalIds[2], source_key: "afrobooks_finance_os_demo_v1" }),
        },
      },
      {
        localId: checklistLocalIds[3],
        clientLocalId,
        countryLocalId: "qa-tax-country-za",
        evidenceLocalId: "qa-tax-evidence-za",
        obligationLocalId: "qa-tax-za-paye",
        row: {
          item_title: "Evidence pack reviewed",
          item_group: "Review checklist",
          status: "open",
          reviewer_role: "accountant",
          metadata: meta({ local_id: checklistLocalIds[3] }),
        },
      },
      {
        localId: checklistLocalIds[4],
        clientLocalId,
        countryLocalId: "qa-tax-country-sn",
        evidenceLocalId: "qa-tax-evidence-sn",
        obligationLocalId: "qa-tax-sn-vat",
        row: {
          item_title: "Accountant handoff prepared",
          item_group: "Accountant handoff",
          status: "open",
          reviewer_role: "owner",
          metadata: meta({ local_id: checklistLocalIds[4] }),
        },
      },
    ],
    reviewComments: [
      {
        localId: "qa-tax-comment-source",
        clientLocalId,
        evidenceLocalId: "qa-tax-evidence-ng",
        checklistLocalId: checklistLocalIds[0],
        countryLocalId: "qa-tax-country-ng",
        row: {
          comment_text: "Confirm authority source date before using this packet outside QA.",
          comment_status: "open",
          author_email: qaEmail || `qa.tax+${fixtureTag}@example.com`,
          metadata: meta({ local_id: "qa-tax-comment-source" }),
        },
      },
      {
        localId: "qa-tax-comment-payroll",
        clientLocalId,
        evidenceLocalId: "qa-tax-evidence-za",
        checklistLocalId: checklistLocalIds[3],
        countryLocalId: "qa-tax-country-za",
        row: {
          comment_text: "Payroll journal can be imported through Books review data when present; confirm period and warnings before relying on it.",
          comment_status: "open",
          author_email: qaEmail || `qa.tax+${fixtureTag}@example.com`,
          metadata: meta({ local_id: "qa-tax-comment-payroll" }),
        },
      },
    ],
    exportPackets: [
      {
        localId: "qa-tax-export-accountant",
        clientLocalId,
        companyLocalId,
        evidenceLocalId: "qa-tax-evidence-ng",
        countryLocalId: "qa-tax-country-ng",
        row: {
          title: "May 2026 Accountant handoff packet",
          export_type: "accountant_handoff",
          period_label: "May 2026",
          status: "draft",
          delivery_note: "Accountant handoff only. AfroTax does not file returns, remit tax, move salary funds, or provide official compliance confirmation.",
          file_manifest: [],
          metadata: meta({ local_id: "qa-tax-export-accountant" }),
        },
      },
      {
        localId: "qa-tax-export-review",
        clientLocalId,
        companyLocalId,
        evidenceLocalId: "qa-tax-evidence-ke",
        countryLocalId: "qa-tax-country-ke",
        row: {
          title: "May 2026 Source review packet",
          export_type: "source_review",
          period_label: "May 2026",
          status: "draft",
          delivery_note: "Source dates, rates, and sample deadlines must be verified before production use.",
          file_manifest: [],
          metadata: meta({ local_id: "qa-tax-export-review" }),
        },
      },
    ],
    crossAppImports: [
      {
        localId: "qa-tax-import-payroll",
        clientLocalId,
        companyLocalId,
        row: {
          source_app: "afropayroll",
          source_key: "afropayroll_pro_saved_runs",
          source_record_id: "qa-payroll-may-2026",
          import_type: "payroll_summary",
          period_label: "May 2026",
          status: "needs_review",
          warnings: ["Payroll review data does not prove filing, salary payment, or tax remittance."],
          payload: { row_count: 2, currency: "NGN" },
          metadata: meta({ local_id: "qa-tax-import-payroll" }),
        },
      },
      {
        localId: "qa-tax-import-books-close",
        clientLocalId,
        companyLocalId,
        row: {
          source_app: "afrobooks",
          source_key: "afrobooks_finance_os_demo_v1",
          source_record_id: "qa-books-close-may-2026",
          import_type: "books_close_pack",
          period_label: "May 2026",
          status: "needs_review",
          warnings: ["Books review data is not audited or payment-verified."],
          payload: { row_count: 3, currency: "NGN" },
          metadata: meta({ local_id: "qa-tax-import-books-close" }),
        },
      },
      {
        localId: "qa-tax-import-books-journal",
        clientLocalId,
        companyLocalId,
        row: {
          source_app: "afrobooks",
          source_key: "afrobooks_finance_os_demo_v1",
          source_record_id: "qa-payroll-journal-may-2026",
          import_type: "payroll_journal",
          period_label: "May 2026",
          status: "draft",
          warnings: ["Confirm period, currency, and source warnings before accountant review."],
          payload: { row_count: 1, currency: "NGN" },
          metadata: meta({ local_id: "qa-tax-import-books-journal" }),
        },
      },
      {
        localId: "qa-tax-import-seller",
        clientLocalId,
        companyLocalId,
        row: {
          source_app: "afroseller",
          source_key: "afrobooks_finance_os_demo_v1",
          source_record_id: "qa-seller-close-through-books",
          import_type: "seller_daily_close",
          period_label: "May 2026",
          status: "needs_review",
          warnings: ["Seller evidence reaches AfroTax through Books review imports only."],
          payload: { row_count: 1, currency: "NGN" },
          metadata: meta({ local_id: "qa-tax-import-seller" }),
        },
      },
    ],
    auditEvents: [
      {
        localId: "qa-tax-audit-start",
        clientLocalId,
        row: {
          event_type: "tax_calendar_created",
          entity_table: "tax_deadlines",
          event_note: "QA fixture planned Tax calendar records.",
          metadata: meta({ local_id: "qa-tax-audit-start", actor_email: qaEmail || `qa.tax+${fixtureTag}@example.com` }),
        },
      },
      {
        localId: "qa-tax-audit-source",
        clientLocalId,
        row: {
          event_type: "source_review_added",
          entity_table: "tax_source_reviews",
          event_note: "QA fixture planned Source review records.",
          metadata: meta({ local_id: "qa-tax-audit-source", actor_email: qaEmail || `qa.tax+${fixtureTag}@example.com` }),
        },
      },
      {
        localId: "qa-tax-audit-export",
        clientLocalId,
        row: {
          event_type: "accountant_handoff_export",
          entity_table: "tax_export_packets",
          event_note: "QA fixture planned Accountant handoff packet.",
          metadata: meta({ local_id: "qa-tax-audit-export", actor_email: qaEmail || `qa.tax+${fixtureTag}@example.com` }),
        },
      },
    ],
  };
}

function countPlan(fixture) {
  return {
    tax_clients: fixture.clients.length,
    tax_company_profiles: fixture.companies.length,
    tax_team_members: fixture.teamMembers.length,
    tax_country_packs: fixture.countryPacks.length,
    tax_obligations: fixture.obligations.length,
    tax_deadlines: fixture.deadlines.length,
    tax_workflow_items: fixture.workflowItems.length,
    tax_evidence_packs: fixture.evidencePacks.length,
    tax_evidence_documents: fixture.evidenceDocuments.length,
    tax_source_reviews: fixture.sourceReviews.length,
    tax_review_checklists: fixture.checklistItems.length,
    tax_review_comments: fixture.reviewComments.length,
    tax_export_packets: fixture.exportPackets.length,
    tax_cross_app_imports: fixture.crossAppImports.length,
    tax_audit_events: fixture.auditEvents.length,
  };
}

function printPlan(fixture) {
  console.log(`\nAfroTax QA fixture tag: ${fixture.tag}`);
  console.log(`Mode: ${dryRun ? "dry-run" : "live"}`);
  console.log("\nPlanned account records:");
  Object.entries(countPlan(fixture)).forEach(([table, count]) => {
    logStep(table, dryRun ? "PLAN" : "READY", `${count} row(s)`);
  });
}

function printTruthBaseline() {
  console.log("\nProduct truth baseline:");
  console.log("- Works on this device: /pro/apps/tax-compliance/ exists, is Pro-gated, saves workspace progress with the AfroTax device key, and shows Tax calendar, country lanes, Evidence pack, Source review, Review checklist, and Accountant handoff areas.");
  console.log(`- Reads from Payroll today: ${PAYROLL_KEYS.join(", ")} as source signals only.`);
  console.log("- Reads from Books today: afrobooks_finance_os_demo_v1 as manual import review data for close packs, VAT or sales review, expense categories, payroll journals, Accountant packets, and Seller evidence through Books when present.");
  console.log("- Not built: account-backed AfroTax records, verified live deadline/rate refresh, filing, tax remittance, salary fund movement, official compliance confirmation, and automatic accountant collaboration.");
  console.log("- Must not be claimed: filed returns, remitted tax, moved salary funds, official compliance confirmation, verified current rates, or production-ready source dates without a fresh review.");
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
    fail("Live writes refused. AFROTAX_QA_USER_ID does not match AFROTAX_QA_ACCESS_TOKEN.");
  }
  if (data && data.email && qaEmail && data.email.toLowerCase() !== qaEmail.toLowerCase()) {
    fail("Live writes refused. AFROTAX_QA_EMAIL does not match AFROTAX_QA_ACCESS_TOKEN.");
  }
  const safeEmail = data && data.email || qaEmail;
  if (!safeEmail || !isSafeQaEmail(safeEmail)) {
    fail("Live writes refused. Signed-in email must clearly be QA, test, fixture, sandbox, or example.com.");
  }
  logStep("qa user", "PASS", safeEmail);
  return data || { id: qaUserId || null, email: safeEmail };
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
    const source = row && row.metadata;
    if (row && source && source.local_id) map[source.local_id] = row.id;
  });
  return map;
}

function withId(row, key, value) {
  return Object.assign({}, row, { [key]: value || null });
}

function withClientCompany(row, clientId, companyId) {
  return Object.assign({}, row, {
    client_id: clientId || null,
    company_profile_id: companyId || null,
  });
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
  const missing = ACCOUNT_TABLES.filter((table) => !tableMap[table]);
  if (missing.length) {
    logStep("account records", "PLAN", `${missing.length} AfroTax table(s) not available, no rows inserted`);
    missing.forEach((table) => logStep(table, "MISSING", "planned only"));
    return { plannedOnly: true, tag: fixture.tag, missing };
  }

  const existing = await restRequest("GET", "tax_clients", qp({
    select: "id,name,metadata",
    "metadata->>fixture_tag": `eq.${fixture.tag}`,
  }));
  if (existing.length) {
    fail(`Live create refused. Fixture tag already exists on ${existing.length} client row(s). Run cleanup first or use a new tag.`);
  }

  const clientRows = await insertRows("tax_clients", fixture.clients.map((item) => Object.assign({}, item.row, { owner_id: user.id || qaUserId || null })));
  const clientIds = mapByLocalId(clientRows);

  const companyRows = await insertRows("tax_company_profiles", fixture.companies.map((item) => withId(item.row, "client_id", clientIds[item.clientLocalId])));
  const companyIds = mapByLocalId(companyRows);

  await insertRows("tax_team_members", fixture.teamMembers.map((item) => withId(item.row, "client_id", clientIds[item.clientLocalId])));

  const countryRows = await insertRows("tax_country_packs", fixture.countryPacks.map((item) => withClientCompany(
    item.row,
    clientIds[item.clientLocalId],
    companyIds[item.companyLocalId]
  )));
  const countryIds = mapByLocalId(countryRows);

  const obligationRows = await insertRows("tax_obligations", fixture.obligations.map((item) => Object.assign(
    withClientCompany(item.row, clientIds[item.clientLocalId], companyIds[item.companyLocalId]),
    { country_pack_id: countryIds[item.countryLocalId] || null }
  )));
  const obligationIds = mapByLocalId(obligationRows);

  await insertRows("tax_deadlines", fixture.deadlines.map((item) => Object.assign(
    withId(item.row, "country_pack_id", countryIds[item.countryLocalId]),
    {
      client_id: clientIds[item.clientLocalId],
      obligation_id: obligationIds[item.obligationLocalId] || null,
    }
  )));

  await insertRows("tax_workflow_items", fixture.workflowItems.map((item) => Object.assign(
    withClientCompany(item.row, clientIds[item.clientLocalId], companyIds[item.companyLocalId]),
    {
      country_pack_id: countryIds[item.countryLocalId] || null,
      obligation_id: obligationIds[item.obligationLocalId] || null,
    }
  )));

  const evidenceRows = await insertRows("tax_evidence_packs", fixture.evidencePacks.map((item) => Object.assign(
    withClientCompany(item.row, clientIds[item.clientLocalId], companyIds[item.companyLocalId]),
    {
      country_pack_id: countryIds[item.countryLocalId] || null,
      obligation_id: obligationIds[item.obligationLocalId] || null,
    }
  )));
  const evidenceIds = mapByLocalId(evidenceRows);

  await insertRows("tax_evidence_documents", fixture.evidenceDocuments.map((item) => Object.assign(
    withId(item.row, "evidence_pack_id", evidenceIds[item.evidenceLocalId]),
    { client_id: clientIds[item.clientLocalId] }
  )));

  await insertRows("tax_source_reviews", fixture.sourceReviews.map((item) => Object.assign(
    withId(item.row, "country_pack_id", countryIds[item.countryLocalId]),
    {
      client_id: clientIds[item.clientLocalId],
      obligation_id: obligationIds[item.obligationLocalId] || null,
    }
  )));

  const checklistRows = await insertRows("tax_review_checklists", fixture.checklistItems.map((item) => Object.assign(
    withId(item.row, "country_pack_id", countryIds[item.countryLocalId]),
    {
      client_id: clientIds[item.clientLocalId],
      evidence_pack_id: evidenceIds[item.evidenceLocalId] || null,
      obligation_id: obligationIds[item.obligationLocalId] || null,
    }
  )));
  const checklistIds = mapByLocalId(checklistRows);

  await insertRows("tax_review_comments", fixture.reviewComments.map((item) => Object.assign(
    withId(item.row, "evidence_pack_id", evidenceIds[item.evidenceLocalId]),
    {
      client_id: clientIds[item.clientLocalId],
      checklist_item_id: checklistIds[item.checklistLocalId] || null,
      country_pack_id: countryIds[item.countryLocalId] || null,
    }
  )));

  await insertRows("tax_export_packets", fixture.exportPackets.map((item) => Object.assign(
    withClientCompany(item.row, clientIds[item.clientLocalId], companyIds[item.companyLocalId]),
    {
      country_pack_id: countryIds[item.countryLocalId] || null,
      evidence_pack_id: evidenceIds[item.evidenceLocalId] || null,
    }
  )));

  await insertRows("tax_cross_app_imports", fixture.crossAppImports.map((item) => withClientCompany(
    item.row,
    clientIds[item.clientLocalId],
    companyIds[item.companyLocalId]
  )));

  await insertRows("tax_audit_events", fixture.auditEvents.map((item) => Object.assign({}, item.row, {
    client_id: clientIds[item.clientLocalId],
    actor_id: user.id || qaUserId || null,
  })));

  return { plannedOnly: false, tag: fixture.tag, counts: countPlan(fixture) };
}

async function cleanupLiveFixture(tag) {
  assertTagForCleanup();
  assertLiveAllowed();
  await authUser();

  const tableMap = await availableTables();
  const missing = ACCOUNT_TABLES.filter((table) => !tableMap[table]);
  if (missing.length === ACCOUNT_TABLES.length) {
    logStep("cleanup lookup", "PLAN", "AfroTax account records are not available, so no rows can be deleted");
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
  console.log("AfroTax Compliance OS QA fixture");
  localContractCheck();
  printPlan(fixture);
  printTruthBaseline();

  if (mode === "baseline" || mode === "tables") return;

  if (args.live && !confirmLive) {
    logStep("live guard", "REFUSE", "AFROTAX_QA_CONFIRM=1 is not set, so no writes will run");
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
  console.error(`AfroTax QA fixture failed: ${error.message}`);
  process.exit(1);
});
