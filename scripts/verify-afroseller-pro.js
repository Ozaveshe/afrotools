#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const failures = [];
const localKey = "afroseller_social_commerce_os_v1";
const cloudKey = "afroseller_social_commerce_os_cloud_v1";
const sellerTables = [
  "seller_businesses",
  "seller_team_members",
  "seller_products",
  "seller_product_variants",
  "seller_stock_movements",
  "seller_customers",
  "seller_customer_labels",
  "seller_orders",
  "seller_order_items",
  "seller_payments",
  "seller_deliveries",
  "seller_message_templates",
  "seller_exports",
  "seller_audit_events",
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

[
  "pro/apps/seller/index.html",
  "assets/js/lib/afroseller-sync.js",
  "docs/AFROSELLER-SUPABASE-SCHEMA.md",
  "docs/AFROSELLER-QA.md",
  "supabase/migrations/047-afroseller-social-commerce-schema.sql",
  "scripts/afroseller-qa-fixture.js",
].forEach(assertFile);

if (!failures.length) {
  const html = read("pro/apps/seller/index.html");
  const sync = read("assets/js/lib/afroseller-sync.js");
  const schemaDoc = read("docs/AFROSELLER-SUPABASE-SCHEMA.md");
  const qaDoc = read("docs/AFROSELLER-QA.md");
  const migration = read("supabase/migrations/047-afroseller-social-commerce-schema.sql");
  const fixture = read("scripts/afroseller-qa-fixture.js");

  if (!/<meta\s+name=["']pro-required["']\s+content=["']afrotools-pro["']/i.test(html)) {
    addFailure("Seller route is missing the Pro gate meta tag");
  }
  if (!/\/assets\/js\/pro-gate\.js/.test(html)) {
    addFailure("Seller route does not load pro-gate.js");
  }
  if (!html.includes("/assets/js/lib/afroseller-sync.js")) {
    addFailure("Seller route does not load afroseller-sync.js");
  }
  if (!html.includes(localKey)) addFailure(`Seller route missing ${localKey}`);
  if (!sync.includes(localKey)) addFailure(`afroseller-sync.js missing ${localKey}`);
  if (!sync.includes(cloudKey)) addFailure(`afroseller-sync.js missing ${cloudKey}`);
  if (!sync.includes("AfroAuth") || !sync.includes("getSupabase")) {
    addFailure("afroseller-sync.js must use the existing signed-in browser account client");
  }
  if (/service[_-]?role|SUPABASE_AUTH_SERVICE_KEY|SUPABASE_SERVICE_KEY/i.test(sync)) {
    addFailure("afroseller-sync.js must not reference service-role keys");
  }

  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
  [
    "supabase",
    "supabase actions",
    "schema",
    "sync helper",
    "localstorage",
    "internal",
    "shell",
    "debug",
    "local only",
    "local-only app",
  ].forEach((term) => {
    if (bodyText.includes(term)) addFailure(`Seller visible UI includes disallowed wording: ${term}`);
  });

  sellerTables.forEach((table) => {
    if (!schemaDoc.includes(table)) addFailure(`schema doc missing ${table}`);
    if (!qaDoc.includes(table)) addFailure(`QA doc missing ${table}`);
    if (!migration.includes(table)) addFailure(`migration missing ${table}`);
    if (!fixture.includes(table)) addFailure(`QA fixture missing ${table}`);
  });

  [
    "AFROSELLER_QA_CONFIRM",
    "AFROSELLER_QA_USER_ID",
    "AFROSELLER_QA_ACCESS_TOKEN",
    "AFROSELLER_QA_TAG",
  ].forEach((token) => {
    if (!fixture.includes(token)) addFailure(`QA fixture missing guard ${token}`);
    if (!qaDoc.includes(token)) addFailure(`QA doc missing command guard ${token}`);
  });

  if (!fixture.includes("--cleanup")) addFailure("QA fixture missing cleanup mode");
  if (!fixture.includes("dry-run")) addFailure("QA fixture must document dry-run behavior in code output");
}

if (failures.length) {
  console.error("AfroSeller Pro verification failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("AfroSeller Pro verification passed");
console.log("- route: /pro/apps/seller/");
console.log(`- local key: ${localKey}`);
console.log(`- cloud key: ${cloudKey}`);
console.log(`- seller tables: ${sellerTables.length}`);
