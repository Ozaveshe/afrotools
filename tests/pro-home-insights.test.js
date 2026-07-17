const assert = require("assert");

const insights = require("../assets/js/lib/pro-home-insights.js");

function createStorage(seed) {
  const values = new Map(Object.entries(seed || {}));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

const NOW = "2026-07-13T09:00:00Z";

function testHumaneStatus() {
  assert.deepEqual(insights.humaneStatus("active", ""), { label: "Ready", tone: "ready" });
  assert.equal(insights.humaneStatus("shell", "Local preview only").label, "Early preview");
  assert.equal(insights.humaneStatus("limited preview", "").label, "Limited preview");
  assert.equal(insights.humaneStatus("planned", "").label, "Coming soon");
  assert.equal(insights.humaneStatus("blocked", "").label, "Not available yet");
  assert.equal(insights.humaneStatus("", "Live workspace").label, "Ready");
  assert.equal(insights.humaneStatus("", "Review packet only").label, "Early preview");
  assert.equal(insights.humaneStatus("", "Something unknown").label, "Early preview");
}

function testHumaneReason() {
  assert.equal(insights.humaneReason("profile-pro"), "Account profile");
  assert.equal(insights.humaneReason("signed-out"), "Not signed in");
  assert.equal(insights.humaneReason("local-pro-fallback"), "This device");
  assert.equal(insights.humaneReason("mystery"), "Account check");
}

function testSellerCards() {
  const cards = insights.buildTodayCards({
    seller: {
      business: { currency: "NGN" },
      orders: [
        { orderAmount: 10000, amountPaid: 6000 },
        { orderAmount: 3500, amountPaid: 4200 },
        { orderAmount: 9000, amountPaid: 0 }
      ],
      products: [
        { name: "Body oil", stock: 4, reorderLevel: 5, status: "low stock" },
        { name: "Charger", stock: 0, reorderLevel: 3, status: "out of stock" },
        { name: "Bonnet", stock: 18, reorderLevel: 6, status: "ready" }
      ]
    }
  }, { now: NOW });

  const unpaid = cards.find((card) => card.id === "seller-unpaid");
  assert.ok(unpaid, "unpaid card expected");
  assert.ok(unpaid.value.indexOf("13,000") >= 0, "unpaid total should be 13,000, got " + unpaid.value);
  assert.ok(unpaid.meta.indexOf("2 orders") >= 0);

  const stock = cards.find((card) => card.id === "seller-stock");
  assert.ok(stock, "stock card expected");
  assert.equal(stock.value, "2");
}

function testBooksCards() {
  const cards = insights.buildTodayCards({
    books: {
      setup: { currency: "KES" },
      invoices: [
        { status: "sent", amountDue: 4000 },
        { status: "paid", amountDue: 9999 },
        { status: "draft", total: 1500 }
      ],
      expenses: []
    }
  }, { now: NOW });
  const invoicesCard = cards.find((card) => card.id === "books-invoices");
  assert.ok(invoicesCard, "invoices card expected");
  assert.ok(invoicesCard.value.indexOf("5,500") >= 0, "open total should be 5,500, got " + invoicesCard.value);
  assert.ok(invoicesCard.meta.indexOf("2 open invoices") >= 0);
}

function testEventsCards() {
  const cards = insights.buildTodayCards({
    events: {
      event: { name: "Amina & Kojo Wedding", date: "2026-07-20", currency: "GHS" },
      guests: [
        { rsvp: "yes" },
        { rsvp: "pending" },
        { rsvp: "maybe" }
      ],
      vendors: [
        { quote: 22000, paid: 12000 },
        { quote: 9000, paid: 9000 }
      ]
    }
  }, { now: NOW });

  const countdown = cards.find((card) => card.id === "events-countdown");
  assert.ok(countdown, "countdown card expected");
  assert.equal(countdown.value, "7 days to go");
  assert.ok(countdown.meta.indexOf("2 guests") >= 0);
  assert.equal(countdown.tone, "warn");

  const vendors = cards.find((card) => card.id === "events-vendors");
  assert.ok(vendors, "vendor card expected");
  assert.ok(vendors.value.indexOf("10,000") >= 0, "vendor due should be 10,000, got " + vendors.value);
}

function testTaxCards() {
  const cards = insights.buildTodayCards({
    tax: {
      obligations: [
        { dueDate: "2026-07-25", status: "open" },
        { dueDate: "2026-09-25", status: "open" },
        { dueDate: "2026-07-15", status: "filed" }
      ]
    }
  }, { now: NOW });
  const tax = cards.find((card) => card.id === "tax-deadlines");
  assert.ok(tax, "tax card expected");
  assert.equal(tax.value, "1");
}

function testPayrollCards() {
  const cards = insights.buildTodayCards({
    payrollRuns: [
      { rows: [{ status: "needs review" }, { status: "ok" }] },
      { rows: [{ warning: "Missing PIN" }] }
    ]
  }, { now: NOW });
  const payroll = cards.find((card) => card.id === "payroll-runs");
  assert.ok(payroll, "payroll card expected");
  assert.equal(payroll.value, "2 runs");
  assert.ok(payroll.meta.indexOf("2 rows") >= 0);
  assert.equal(payroll.tone, "warn");
}

function testCardOrdering() {
  const cards = insights.buildTodayCards({
    payrollRuns: [{ rows: [] }],
    seller: {
      business: { currency: "NGN" },
      orders: [{ orderAmount: 5000, amountPaid: 0 }],
      products: []
    }
  }, { now: NOW });
  assert.ok(cards.length >= 2);
  assert.equal(cards[0].tone, "warn", "warn cards sort first");
}

function testEmptyStores() {
  assert.deepEqual(insights.buildTodayCards({}, { now: NOW }), []);
  assert.deepEqual(insights.buildTodayCards({ seller: null, books: {} }, { now: NOW }), []);
}

function testBusinessType() {
  const storage = createStorage();
  assert.equal(insights.getBusinessType(storage), "");
  assert.equal(insights.setBusinessType(storage, "not-a-type"), false);
  assert.equal(insights.setBusinessType(storage, "seller"), true);
  assert.equal(insights.getBusinessType(storage), "seller");
}

function testOrderAppsForBusiness() {
  const apps = [
    { id: "payroll" },
    { id: "books" },
    { id: "tax-compliance" },
    { id: "seller" },
    { id: "creator-studio" }
  ];
  const ordered = insights.orderAppsForBusiness(apps, "seller");
  assert.deepEqual(
    ordered.map((app) => app.id),
    ["seller", "books", "payroll", "tax-compliance", "creator-studio"]
  );
  const unchanged = insights.orderAppsForBusiness(apps, "");
  assert.deepEqual(unchanged.map((app) => app.id), apps.map((app) => app.id));
}

function testReadStoresIsSafe() {
  const storage = createStorage({
    [insights.STORE_KEYS.seller]: "{not valid json",
    [insights.STORE_KEYS.books]: JSON.stringify({ invoices: [] })
  });
  const stores = insights.readStores(storage);
  assert.equal(stores.seller, null);
  assert.deepEqual(stores.books, { invoices: [] });
  assert.deepEqual(insights.readStores(null).seller, null);
}

const tests = [
  testHumaneStatus,
  testHumaneReason,
  testSellerCards,
  testBooksCards,
  testEventsCards,
  testTaxCards,
  testPayrollCards,
  testCardOrdering,
  testEmptyStores,
  testBusinessType,
  testOrderAppsForBusiness,
  testReadStoresIsSafe
];

let failures = 0;
tests.forEach((test) => {
  try {
    test();
    console.log("ok - " + test.name);
  } catch (error) {
    failures += 1;
    console.error("not ok - " + test.name);
    console.error(error && error.message ? error.message : error);
  }
});

if (failures) {
  console.error(failures + " pro-home-insights test(s) failed");
  process.exit(1);
}
console.log("pro-home-insights tests passed");
