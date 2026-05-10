#!/usr/bin/env node
"use strict";

/**
 * Safe AfroSeller QA fixture harness.
 *
 * Default mode is dry-run. Live writes require:
 * - --live
 * - AFROSELLER_QA_CONFIRM=1
 * - AFROSELLER_QA_ACCESS_TOKEN
 * - SUPABASE_AUTH_ANON_KEY or SUPABASE_ANON_KEY
 * - AFROSELLER_QA_USER_ID
 * - AFROSELLER_QA_BUSINESS_NAME with a clear QA/test label
 * - AFROSELLER_QA_TAG or --tag
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LOCAL_KEY = "afroseller_social_commerce_os_v1";
const CLOUD_KEY = "afroseller_social_commerce_os_cloud_v1";
const FIXTURE_SOURCE = "afroseller-qa-fixture";
const SELLER_TABLES = [
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
const CLEANUP_TABLES = [
  "seller_audit_events",
  "seller_deliveries",
  "seller_payments",
  "seller_stock_movements",
  "seller_order_items",
  "seller_exports",
  "seller_message_templates",
  "seller_customer_labels",
  "seller_orders",
  "seller_product_variants",
  "seller_products",
  "seller_customers",
  "seller_team_members",
  "seller_businesses",
];

function parseArgs(argv) {
  const args = { mode: "create" };
  argv.slice(2).forEach((arg) => {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--live") args.live = true;
    else if (arg === "--cleanup") args.mode = "cleanup";
    else if (arg === "--baseline") args.mode = "baseline";
    else if (arg === "--schema") args.mode = "schema";
    else if (arg.startsWith("--mode=")) args.mode = arg.slice("--mode=".length);
    else if (arg.startsWith("--tag=")) args.tag = arg.slice("--tag=".length);
  });
  return args;
}

const args = parseArgs(process.argv);
const mode = ["create", "cleanup", "baseline", "schema"].includes(args.mode) ? args.mode : "create";
const explicitTag = args.tag || process.env.AFROSELLER_QA_TAG || "";
const fixtureTag = sanitizeTag(explicitTag || createTag());
const confirmLive = process.env.AFROSELLER_QA_CONFIRM === "1";
const dryRun = args.dryRun === true || args.live !== true || !confirmLive;
const supabaseUrl = (process.env.SUPABASE_AUTH_URL || process.env.SUPABASE_URL || "https://zpclagtgczsygrgztlts.supabase.co").replace(/\/+$/g, "");
const anonKey = process.env.SUPABASE_AUTH_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";
const accessToken = process.env.AFROSELLER_QA_ACCESS_TOKEN || "";
const qaUserId = process.env.AFROSELLER_QA_USER_ID || "";
const qaBusinessName = process.env.AFROSELLER_QA_BUSINESS_NAME || "";

function sanitizeTag(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function createTag() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `qa_seller_${stamp}_${crypto.randomBytes(3).toString("hex")}`;
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function logStep(name, status, detail) {
  const suffix = detail ? ` - ${detail}` : "";
  console.log(`${status.padEnd(8)} ${name}${suffix}`);
}

function fail(message) {
  throw new Error(message);
}

function assertTagForCleanup() {
  if (!explicitTag || !fixtureTag) {
    fail("Cleanup refused. Set AFROSELLER_QA_TAG or pass --tag with the exact QA fixture tag.");
  }
}

function assertLiveAllowed() {
  if (dryRun) return;
  if (!fixtureTag || !explicitTag) {
    fail("Live writes refused. Set AFROSELLER_QA_TAG or pass --tag so cleanup can target the fixture.");
  }
  if (!anonKey) fail("Live writes refused. Set SUPABASE_AUTH_ANON_KEY, SUPABASE_ANON_KEY, or SUPABASE_PUBLISHABLE_KEY.");
  if (!accessToken) fail("Live writes refused. Set AFROSELLER_QA_ACCESS_TOKEN for a signed-in QA user.");
  if (!qaUserId) fail("Live writes refused. Set AFROSELLER_QA_USER_ID for a clearly safe QA user.");
  if (!qaBusinessName) fail("Live writes refused. Set AFROSELLER_QA_BUSINESS_NAME for a clearly safe QA business.");
  if (!/(qa|test|fixture|sandbox)/i.test(qaBusinessName)) {
    fail("Live writes refused. AFROSELLER_QA_BUSINESS_NAME must clearly include QA, test, fixture, or sandbox.");
  }
}

function localContractCheck() {
  const sellerHtml = read("pro/apps/seller/index.html");
  const sync = read("assets/js/lib/afroseller-sync.js");
  const schemaDoc = read("docs/AFROSELLER-SUPABASE-SCHEMA.md");
  const migration = read("supabase/migrations/047-afroseller-social-commerce-schema.sql");
  const missing = [];

  if (!sellerHtml.includes(LOCAL_KEY)) missing.push(`pro/apps/seller/index.html missing ${LOCAL_KEY}`);
  if (!sellerHtml.includes("/assets/js/lib/afroseller-sync.js")) missing.push("Seller route does not load afroseller-sync.js");
  if (!sync.includes(LOCAL_KEY)) missing.push(`afroseller-sync.js missing ${LOCAL_KEY}`);
  if (!sync.includes(CLOUD_KEY)) missing.push(`afroseller-sync.js missing ${CLOUD_KEY}`);
  if (!sync.includes("AfroAuth") || !sync.includes("getSupabase")) missing.push("afroseller-sync.js is not using the browser account client");
  if (/service[_-]?role|SUPABASE_AUTH_SERVICE_KEY|SUPABASE_SERVICE_KEY/i.test(sync)) {
    missing.push("afroseller-sync.js appears to reference a service-role key");
  }

  SELLER_TABLES.forEach((table) => {
    if (!schemaDoc.includes(table)) missing.push(`schema doc missing ${table}`);
    if (!migration.includes(table)) missing.push(`migration missing ${table}`);
  });

  if (missing.length) {
    fail(`Local contract check failed:\n- ${missing.join("\n- ")}`);
  }
  logStep("local contract", "PASS", "Seller app, sync bridge, schema doc, and migration reference expected keys and tables");
}

function meta(extra) {
  return Object.assign({
    fixture_tag: fixtureTag,
    qa_fixture: true,
    source: FIXTURE_SOURCE,
  }, extra || {});
}

function buildFixture() {
  const businessName = qaBusinessName || `[QA Fixture] AfroSeller Sandbox ${fixtureTag}`;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);

  const products = [
    {
      localId: "qa-product-basket",
      row: {
        sku: `QA-${fixtureTag}-BASKET`,
        name: "QA Fixture Basket",
        category: "QA Catalog",
        supplier: "QA Supplier Only",
        stock_location: "QA Shelf A",
        photo_url: "",
        cost_price: 1200,
        selling_price: 2000,
        stock_on_hand: 18,
        reorder_level: 5,
        status: "ready",
        metadata: meta({ local_id: "qa-product-basket" }),
      },
    },
    {
      localId: "qa-product-wrap",
      row: {
        sku: `QA-${fixtureTag}-WRAP`,
        name: "QA Fixture Wrap",
        category: "QA Catalog",
        supplier: "QA Supplier Only",
        stock_location: "QA Shelf B",
        photo_url: "",
        cost_price: 900,
        selling_price: 1500,
        stock_on_hand: 3,
        reorder_level: 4,
        status: "low stock",
        metadata: meta({ local_id: "qa-product-wrap" }),
      },
    },
  ];

  const variants = [
    {
      productLocalId: "qa-product-basket",
      localId: "qa-variant-basket-small",
      row: {
        sku: `QA-${fixtureTag}-BASKET-S`,
        variant_name: "QA Small",
        size_label: "S",
        color_label: "QA Neutral",
        barcode: "",
        supplier: "QA Supplier Only",
        stock_location: "QA Shelf A",
        photo_url: "",
        cost_price: 1200,
        selling_price: 2000,
        stock_on_hand: 10,
        reorder_level: 3,
        status: "ready",
        metadata: meta({ local_id: "qa-variant-basket-small" }),
      },
    },
    {
      productLocalId: "qa-product-wrap",
      localId: "qa-variant-wrap-blue",
      row: {
        sku: `QA-${fixtureTag}-WRAP-BLUE`,
        variant_name: "QA Blue",
        size_label: "",
        color_label: "QA Blue",
        barcode: "",
        supplier: "QA Supplier Only",
        stock_location: "QA Shelf B",
        photo_url: "",
        cost_price: 900,
        selling_price: 1500,
        stock_on_hand: 3,
        reorder_level: 4,
        status: "low stock",
        metadata: meta({ local_id: "qa-variant-wrap-blue" }),
      },
    },
  ];

  const customers = [
    {
      localId: "qa-customer-alpha",
      row: {
        name: "QA Customer Alpha",
        phone_whatsapp: "QA-CONTACT-ALPHA",
        email: `qa.seller.alpha+${fixtureTag}@example.com`,
        default_address: "QA delivery address only",
        last_order_note: "QA repeat buyer note",
        total_balance: 400,
        follow_status: "Send payment reminder",
        status: "active",
        metadata: meta({ local_id: "qa-customer-alpha" }),
      },
      labels: ["Repeat buyer", "Owes balance"],
    },
    {
      localId: "qa-customer-beta",
      row: {
        name: "QA Customer Beta",
        phone_whatsapp: "QA-CONTACT-BETA",
        email: `qa.seller.beta+${fixtureTag}@example.com`,
        default_address: "QA pickup address only",
        last_order_note: "QA delivery check note",
        total_balance: 0,
        follow_status: "Ready for repeat order",
        status: "active",
        metadata: meta({ local_id: "qa-customer-beta" }),
      },
      labels: ["VIP"],
    },
  ];

  const orders = [
    {
      localId: "qa-order-alpha",
      customerLocalId: "qa-customer-alpha",
      productLocalId: "qa-product-basket",
      variantLocalId: "qa-variant-basket-small",
      row: {
        order_no: `QA-${fixtureTag}-ORDER-001`,
        order_date: today,
        channel: "WhatsApp",
        subtotal_amount: 4000,
        delivery_fee: 600,
        discount_amount: 0,
        total_amount: 4600,
        amount_paid: 4200,
        balance_due: 400,
        latest_payment_method: "bank transfer",
        payment_status: "partial",
        order_status: "confirmed",
        delivery_status: "Ready for dispatch",
        notes: "QA order note only",
        metadata: meta({ local_id: "qa-order-alpha" }),
      },
      item: {
        product_name_snapshot: "QA Fixture Basket",
        sku_snapshot: `QA-${fixtureTag}-BASKET-S`,
        variant_snapshot: "QA Small",
        quantity: 2,
        unit_cost: 1200,
        unit_price: 2000,
        line_total: 4000,
        metadata: meta({ local_id: "qa-order-alpha-item" }),
      },
      payment: {
        payment_method: "bank transfer",
        amount: 4200,
        payment_status: "recorded",
        proof_note: "QA payment note only. Not a bank receipt.",
        reference_note: "QA-REFERENCE-NOT-A-PAYMENT",
        is_manual_record: true,
        received_at: `${today}T12:00:00.000Z`,
        metadata: meta({ local_order_id: "qa-order-alpha" }),
      },
      delivery: {
        customer_address: "QA delivery address only",
        delivery_fee: 600,
        rider_contact: "QA-RIDER-CONTACT",
        dispatch_note: "QA dispatch note only",
        proof_of_delivery_note: "",
        delivery_status: "Ready for dispatch",
        dispatched_at: null,
        delivered_at: null,
        metadata: meta({ local_order_id: "qa-order-alpha" }),
      },
    },
    {
      localId: "qa-order-beta",
      customerLocalId: "qa-customer-beta",
      productLocalId: "qa-product-wrap",
      variantLocalId: "qa-variant-wrap-blue",
      row: {
        order_no: `QA-${fixtureTag}-ORDER-002`,
        order_date: yesterday,
        channel: "Instagram",
        subtotal_amount: 1500,
        delivery_fee: 0,
        discount_amount: 0,
        total_amount: 1500,
        amount_paid: 1500,
        balance_due: 0,
        latest_payment_method: "cash",
        payment_status: "paid",
        order_status: "delivered",
        delivery_status: "Delivered",
        notes: "QA delivered order note only",
        metadata: meta({ local_id: "qa-order-beta" }),
      },
      item: {
        product_name_snapshot: "QA Fixture Wrap",
        sku_snapshot: `QA-${fixtureTag}-WRAP-BLUE`,
        variant_snapshot: "QA Blue",
        quantity: 1,
        unit_cost: 900,
        unit_price: 1500,
        line_total: 1500,
        metadata: meta({ local_id: "qa-order-beta-item" }),
      },
      payment: {
        payment_method: "cash",
        amount: 1500,
        payment_status: "recorded",
        proof_note: "QA cash note only. Not a receipt.",
        reference_note: "QA-CASH-NOT-A-REFERENCE",
        is_manual_record: true,
        received_at: `${yesterday}T12:00:00.000Z`,
        metadata: meta({ local_order_id: "qa-order-beta" }),
      },
      delivery: {
        customer_address: "QA pickup address only",
        delivery_fee: 0,
        rider_contact: "QA-RIDER-CONTACT",
        dispatch_note: "QA completed dispatch note",
        proof_of_delivery_note: "QA proof note only",
        delivery_status: "Delivered",
        dispatched_at: `${yesterday}T13:00:00.000Z`,
        delivered_at: `${yesterday}T15:00:00.000Z`,
        metadata: meta({ local_order_id: "qa-order-beta" }),
      },
    },
  ];

  return {
    tag: fixtureTag,
    business: {
      owner_id: qaUserId || "00000000-0000-0000-0000-000000000000",
      name: businessName,
      country: "NG",
      currency_code: "NGN",
      language_lane: "English",
      seller_channel: "WhatsApp",
      phone_whatsapp: "QA-BUSINESS-CONTACT",
      settings: meta({ localStorageKey: LOCAL_KEY, cloudStorageKey: CLOUD_KEY }),
      status: "active",
    },
    teamMember: {
      user_id: null,
      invited_email: `qa.seller.staff+${fixtureTag}@example.com`,
      display_name: "QA Fixture Staff",
      role: "staff",
      status: "invited",
      permissions_override: meta({ fixture_role: "staff" }),
      invited_by: qaUserId || null,
    },
    products,
    variants,
    stockMovements: [
      {
        productLocalId: "qa-product-basket",
        variantLocalId: "qa-variant-basket-small",
        row: {
          movement_type: "restock",
          quantity_delta: 18,
          stock_after: 18,
          reason_note: "QA opening stock only",
          source_type: "manual",
          source_id: null,
          occurred_at: `${today}T09:00:00.000Z`,
          metadata: meta({ local_id: "qa-stock-restock-basket" }),
        },
      },
      {
        productLocalId: "qa-product-wrap",
        variantLocalId: "qa-variant-wrap-blue",
        row: {
          movement_type: "adjustment",
          quantity_delta: 3,
          stock_after: 3,
          reason_note: "QA low stock baseline only",
          source_type: "manual",
          source_id: null,
          occurred_at: `${today}T09:30:00.000Z`,
          metadata: meta({ local_id: "qa-stock-adjust-wrap" }),
        },
      },
    ],
    customers,
    orders,
    messageTemplates: [
      {
        template_type: "confirmation",
        title: "QA Order Confirmation",
        body: "Hello QA Customer, your sample order is confirmed for fixture testing only.",
        channel: "whatsapp_manual",
        last_wa_link_preview: "https://wa.me/?text=QA%20fixture%20message",
        language_lane: "English",
        is_default: true,
        metadata: meta({ local_id: "qa-template-confirmation" }),
      },
      {
        template_type: "payment",
        title: "QA Payment Reminder",
        body: "Hello QA Customer, this is a fixture payment reminder for testing only.",
        channel: "whatsapp_manual",
        last_wa_link_preview: "https://wa.me/?text=QA%20fixture%20payment",
        language_lane: "English",
        is_default: false,
        metadata: meta({ local_id: "qa-template-payment" }),
      },
    ],
    exports: [
      {
        export_type: "product_catalog",
        format: "csv",
        file_name: `qa-afroseller-products-${fixtureTag}.csv`,
        row_count: 2,
        filters: meta({ export_scope: "products" }),
        payload_summary: meta({ products: 2, variants: 2 }),
        is_local_download: true,
      },
      {
        export_type: "daily_close",
        format: "markdown",
        file_name: `qa-afroseller-daily-close-${fixtureTag}.md`,
        row_count: 2,
        filters: meta({ export_scope: "daily_close" }),
        payload_summary: meta({ orders: 2, payments: 2, deliveries: 2 }),
        is_local_download: true,
      },
    ],
    expectedAuditEvents: [
      { event_type: "create", entity_table: "seller_businesses", action_summary: "Fixture business created by trigger" },
      { event_type: "payment_change", entity_table: "seller_payments", action_summary: "Fixture payment records should be audited by trigger" },
      { event_type: "export", entity_table: "seller_exports", action_summary: "Fixture exports should be audited by trigger" },
    ],
  };
}

function printTruthBaseline() {
  console.log("\nProduct truth baseline");
  console.log("- Local: Seller runs from browser storage under afroseller_social_commerce_os_v1, with local shop setup, catalog preview settings, stock, customers, orders, manual payment notes, delivery notes, WhatsApp copy text, daily close drafts, close history, and CSV/Markdown/HTML exports.");
  console.log("- Saved to account: signed-in Pro users can import one Seller workspace to account-backed tables for business, products, variants, customers, labels, orders, order items, payments, deliveries, and stock movements. Cloud metadata is kept under afroseller_social_commerce_os_cloud_v1.");
  console.log("- Fixture-only account records: this QA harness can add message template rows, export records, and trigger-backed audit rows for a tagged QA business.");
  console.log("- Not implemented: automatic two-way sync, conflict resolution, background sync, storage bucket upload, payment collection or verification, WhatsApp Business API sending, storefront publishing, delivery booking, account export/history sync for catalog preview or daily close drafts, and generated type bindings committed for this app.");
  console.log("- Must not be claimed: real payment provider receipts, live storefront orders, delivery-provider tracking, automatic cloud backup, service-role browser access, or account save success without a signed-in user and verified rows.");
}

function printPlan(fixture) {
  console.log(`\nAfroSeller QA fixture tag: ${fixture.tag}`);
  console.log(`Mode: ${mode}`);
  console.log(`Writes: ${dryRun ? "dry-run only" : "live RLS smoke"}`);
  console.log("\nPlanned rows");
  console.log(`- seller_businesses: 1 (${fixture.business.name})`);
  console.log("- seller_team_members: 1 invited fake staff row, plus owner row from live trigger");
  console.log(`- seller_products: ${fixture.products.length}`);
  console.log(`- seller_product_variants: ${fixture.variants.length}`);
  console.log(`- seller_stock_movements: ${fixture.stockMovements.length}`);
  console.log(`- seller_customers: ${fixture.customers.length}`);
  console.log(`- seller_customer_labels: ${fixture.customers.reduce((count, customer) => count + customer.labels.length, 0)}`);
  console.log(`- seller_orders: ${fixture.orders.length}`);
  console.log(`- seller_order_items: ${fixture.orders.length}`);
  console.log(`- seller_payments: ${fixture.orders.length}`);
  console.log(`- seller_deliveries: ${fixture.orders.length}`);
  console.log(`- seller_message_templates: ${fixture.messageTemplates.length}`);
  console.log(`- seller_exports: ${fixture.exports.length}`);
  console.log("- seller_audit_events: trigger-generated in live mode, represented as expected events in dry-run");
}

function qp(params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  });
  return search.toString();
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
  if (!data || data.id !== qaUserId) {
    fail("Live writes refused. AFROSELLER_QA_USER_ID does not match AFROSELLER_QA_ACCESS_TOKEN.");
  }
  logStep("qa user", "PASS", `access token belongs to ${qaUserId}`);
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

function withBusiness(rows, businessId) {
  return rows.map((row) => Object.assign({ business_id: businessId }, row));
}

async function createLiveFixture(fixture) {
  assertLiveAllowed();
  await authUser();

  const existing = await findTaggedBusinesses(fixture.tag);
  if (existing.length) {
    fail(`Live create refused. Fixture tag already exists on ${existing.length} seller business row(s). Run cleanup first or use a new tag.`);
  }

  const businessRows = await restRequest("POST", "seller_businesses", "select=*", fixture.business);
  const business = businessRows[0];
  if (!business || !business.id) fail("seller_businesses insert did not return a business id.");
  logStep("seller_businesses", "PASS", business.id);

  const team = Object.assign({ business_id: business.id }, fixture.teamMember);
  await restRequest("POST", "seller_team_members", "select=id", team);
  logStep("seller_team_members", "PASS", "inserted invited fake staff row");

  const productRows = await restRequest("POST", "seller_products", "select=*", withBusiness(fixture.products.map((item) => item.row), business.id));
  const productIds = mapByLocalId(productRows);
  logStep("seller_products", "PASS", `${productRows.length} rows`);

  const variantPayload = fixture.variants.map((item) => Object.assign(
    { business_id: business.id, product_id: productIds[item.productLocalId] },
    item.row
  ));
  const variantRows = await restRequest("POST", "seller_product_variants", "select=*", variantPayload);
  const variantIds = mapByLocalId(variantRows);
  logStep("seller_product_variants", "PASS", `${variantRows.length} rows`);

  const customerRows = await restRequest("POST", "seller_customers", "select=*", withBusiness(fixture.customers.map((item) => item.row), business.id));
  const customerIds = mapByLocalId(customerRows);
  logStep("seller_customers", "PASS", `${customerRows.length} rows`);

  const labelPayload = [];
  fixture.customers.forEach((customer) => {
    customer.labels.forEach((label) => {
      labelPayload.push({
        business_id: business.id,
        customer_id: customerIds[customer.localId],
        label,
        note: "QA fixture label only",
      });
    });
  });
  const labelRows = await restRequest("POST", "seller_customer_labels", "select=id", labelPayload);
  logStep("seller_customer_labels", "PASS", `${labelRows.length} rows`);

  const orderPayload = fixture.orders.map((item) => Object.assign(
    { business_id: business.id, customer_id: customerIds[item.customerLocalId] },
    item.row
  ));
  const orderRows = await restRequest("POST", "seller_orders", "select=*", orderPayload);
  const orderIds = mapByLocalId(orderRows);
  logStep("seller_orders", "PASS", `${orderRows.length} rows`);

  const itemPayload = fixture.orders.map((order) => Object.assign(
    {
      business_id: business.id,
      order_id: orderIds[order.localId],
      product_id: productIds[order.productLocalId],
      variant_id: variantIds[order.variantLocalId],
    },
    order.item
  ));
  const orderItemRows = await restRequest("POST", "seller_order_items", "select=id", itemPayload);
  logStep("seller_order_items", "PASS", `${orderItemRows.length} rows`);

  const paymentPayload = fixture.orders.map((order) => Object.assign(
    {
      business_id: business.id,
      order_id: orderIds[order.localId],
      customer_id: customerIds[order.customerLocalId],
    },
    order.payment
  ));
  const paymentRows = await restRequest("POST", "seller_payments", "select=id", paymentPayload);
  logStep("seller_payments", "PASS", `${paymentRows.length} rows`);

  const deliveryPayload = fixture.orders.map((order) => Object.assign(
    {
      business_id: business.id,
      order_id: orderIds[order.localId],
      customer_id: customerIds[order.customerLocalId],
    },
    order.delivery
  ));
  const deliveryRows = await restRequest("POST", "seller_deliveries", "select=id", deliveryPayload);
  logStep("seller_deliveries", "PASS", `${deliveryRows.length} rows`);

  const movementPayload = fixture.stockMovements.map((item) => Object.assign(
    {
      business_id: business.id,
      product_id: productIds[item.productLocalId],
      variant_id: variantIds[item.variantLocalId],
    },
    item.row
  ));
  const movementRows = await restRequest("POST", "seller_stock_movements", "select=id", movementPayload);
  logStep("seller_stock_movements", "PASS", `${movementRows.length} rows`);

  const templateRows = await restRequest("POST", "seller_message_templates", "select=id", withBusiness(fixture.messageTemplates, business.id));
  logStep("seller_message_templates", "PASS", `${templateRows.length} rows`);

  const exportRows = await restRequest("POST", "seller_exports", "select=id", fixture.exports.map((row) => Object.assign({
    business_id: business.id,
    exported_by: qaUserId,
  }, row)));
  logStep("seller_exports", "PASS", `${exportRows.length} rows`);

  const auditRows = await restRequest("GET", "seller_audit_events", qp({
    select: "id,event_type,entity_table,action_summary,occurred_at",
    business_id: `eq.${business.id}`,
    order: "occurred_at.desc",
  }));
  logStep("seller_audit_events", "PASS", `${auditRows.length} trigger-generated rows readable by QA user`);

  return {
    tag: fixture.tag,
    businessId: business.id,
    counts: {
      products: productRows.length,
      variants: variantRows.length,
      customers: customerRows.length,
      labels: labelRows.length,
      orders: orderRows.length,
      orderItems: orderItemRows.length,
      payments: paymentRows.length,
      deliveries: deliveryRows.length,
      stockMovements: movementRows.length,
      templates: templateRows.length,
      exports: exportRows.length,
      auditEvents: auditRows.length,
    },
  };
}

function mapByLocalId(rows) {
  const map = {};
  rows.forEach((row) => {
    if (row && row.metadata && row.metadata.local_id) map[row.metadata.local_id] = row.id;
  });
  return map;
}

async function findTaggedBusinesses(tag) {
  if (dryRun) return [];
  return restRequest("GET", "seller_businesses", qp({
    select: "id,name,owner_id,settings",
    "settings->>fixture_tag": `eq.${tag}`,
  }));
}

async function cleanupLiveFixture(tag) {
  assertTagForCleanup();
  assertLiveAllowed();
  await authUser();
  const businesses = await findTaggedBusinesses(tag);
  if (!businesses.length) {
    logStep("cleanup lookup", "PASS", `no seller business rows found for ${tag}`);
    return { tag, deleted: {} };
  }

  const businessIds = businesses.map((business) => business.id);
  const inFilter = `in.(${businessIds.join(",")})`;
  const deleted = {};

  for (const table of CLEANUP_TABLES) {
    const filterKey = table === "seller_businesses" ? "id" : "business_id";
    const rows = await restRequest("DELETE", table, qp({
      select: "id",
      [filterKey]: inFilter,
    }));
    deleted[table] = rows.length;
    logStep(table, "DELETE", `${rows.length} row(s) from tagged QA business`);
  }

  return { tag, businessIds, deleted };
}

async function dryRunCleanup(tag) {
  assertTagForCleanup();
  console.log(`\nDry-run cleanup for fixture tag: ${tag}`);
  CLEANUP_TABLES.forEach((table) => {
    const scope = table === "seller_businesses" ? "settings.fixture_tag" : "business_id from tagged seller_businesses";
    logStep(table, "DRY-RUN", `would delete rows scoped by ${scope}`);
  });
}

async function main() {
  const fixture = buildFixture();
  localContractCheck();
  printPlan(fixture);
  printTruthBaseline();

  if (mode === "schema" || mode === "baseline") return;

  if (args.live && !confirmLive) {
    logStep("live guard", "REFUSE", "AFROSELLER_QA_CONFIRM=1 is not set, so no writes will run");
  }

  if (mode === "cleanup") {
    if (dryRun) {
      await dryRunCleanup(fixture.tag);
      return;
    }
    const result = await cleanupLiveFixture(fixture.tag);
    console.log(`\nCleanup complete for ${result.tag}`);
    return;
  }

  if (dryRun) {
    logStep("fixture create", "DRY-RUN", "no rows inserted");
    console.log(`\nUse this tag for a live run and cleanup: ${fixture.tag}`);
    return;
  }

  const result = await createLiveFixture(fixture);
  console.log("\nLive fixture created");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(`AfroSeller QA fixture failed: ${error.message}`);
  process.exit(1);
});
