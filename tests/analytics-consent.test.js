"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const lazySource = fs.readFileSync(path.join(ROOT, "assets", "js", "lazy-analytics.js"), "utf8");
const managerSource = fs.readFileSync(path.join(ROOT, "assets", "js", "components", "analytics-consent-v2.js"), "utf8");

function createSandbox(initialConsent) {
  let consent = initialConsent;
  const inserted = [];
  const listeners = {};
  const clarityCalls = [];
  const document = {
    referrer: "https://search.example/results?q=private-value#secret",
    head: {
      appendChild(node) {
        inserted.push(node);
      }
    },
    createElement(tagName) {
      return { tagName: tagName.toUpperCase(), async: false, src: "" };
    },
    querySelector() {
      return null;
    }
  };
  const window = {
    location: {
      origin: "https://afrotools.com",
      pathname: "/tools/salary-calculator/",
      search: "?email=private@example.com",
      hash: "#result"
    },
    localStorage: {
      getItem(key) {
        return key === "afrotools_cookie_consent" ? consent : null;
      }
    },
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    setTimeout(handler) {
      handler();
      return 1;
    },
    clarity() {
      clarityCalls.push(Array.from(arguments));
    }
  };
  return {
    sandbox: { window, document, URL, Date, console },
    window,
    inserted,
    listeners,
    clarityCalls,
    setConsent(value) {
      consent = value;
    }
  };
}

function commands(context) {
  return context.window.dataLayer.map((entry) => Array.from(entry));
}

function run(initialConsent) {
  const context = createSandbox(initialConsent);
  vm.runInNewContext(lazySource, context.sandbox, { filename: "lazy-analytics.js" });
  return context;
}

function commandRows(context, name, detail) {
  return commands(context).filter((row) => row[0] === name && (detail === undefined || row[1] === detail));
}

const fresh = run(null);
const freshCommands = commands(fresh);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(freshCommands[0].slice(0, 3))),
  ["consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500
  }],
  "fresh visitors must start with denied Consent Mode before configuration"
);
assert.strictEqual(commandRows(fresh, "config", "G-D859CGF391").length, 1, "GA4 is configured exactly once");
const freshConfig = commandRows(fresh, "config", "G-D859CGF391")[0][2];
assert.strictEqual(freshConfig.page_location, "https://afrotools.com/tools/salary-calculator/", "page URL excludes query and fragment");
assert.strictEqual(freshConfig.page_referrer, "https://search.example/", "referrer is reduced to its origin");
assert.strictEqual(freshConfig.allow_google_signals, false, "Google Signals stays disabled");
assert.strictEqual(freshConfig.allow_ad_personalization_signals, false, "ad personalization stays disabled");
assert.ok(
  fresh.inserted.some((node) => node.src === "https://www.googletagmanager.com/gtag/js?id=G-D859CGF391"),
  "fresh denied visitors still load the Google tag"
);
assert.ok(
  fresh.inserted.some((node) => node.src === "/assets/js/components/analytics-consent-v2.js"),
  "the explicit accept/reject consent manager is loaded"
);

fresh.listeners["afrotools:cookie-consent"]({ detail: { status: "accepted" } });
const acceptedUpdates = commandRows(fresh, "consent", "update");
assert.strictEqual(acceptedUpdates.at(-1)[2].analytics_storage, "granted", "accept grants analytics storage");
assert.strictEqual(acceptedUpdates.at(-1)[2].ad_storage, "denied", "accept never grants advertising storage");
assert.strictEqual(commandRows(fresh, "config", "G-D859CGF391").length, 1, "accept does not create a duplicate page view configuration");
assert.ok(
  fresh.clarityCalls.some((call) => call[0] === "consentv2" && call[1].analytics_Storage === "granted" && call[1].ad_Storage === "denied"),
  "accepted consent is passed to an existing Clarity queue without granting ad storage"
);

fresh.listeners["afrotools:cookie-consent"]({ detail: { status: "declined" } });
const declinedUpdates = commandRows(fresh, "consent", "update");
assert.strictEqual(declinedUpdates.at(-1)[2].analytics_storage, "denied", "reject returns analytics storage to denied");
assert.strictEqual(fresh.window["ga-disable-G-D859CGF391"], false, "legacy global disable cannot suppress denied-consent pings");
assert.ok(fresh.clarityCalls.some((call) => call[0] === "consent" && call[1] === false), "revocation clears Clarity consent");

fresh.window.gtag("event", "search_query", { query: "private@example.com", results_count: 2 });
fresh.window.gtag("event", "tool_error", { error_message: "Account private@example.com failed", error_type: "validation" });
fresh.window.gtag("event", "referral_source", { utm_source: "private@example.com", utm_campaign: "customer-name" });
fresh.window.gtag("event", "unsafe", { email: "private@example.com", phone: "+123", tool_name: "safe-tool" });
const emittedEvents = commandRows(fresh, "event");
const serializedEvents = JSON.stringify(emittedEvents);
assert.ok(!serializedEvents.includes("private@example.com"), "raw search, campaign, and email values are removed at the GA boundary");
assert.ok(!serializedEvents.includes("customer-name"), "raw campaign values are removed at the GA boundary");
assert.strictEqual(emittedEvents[0][2].query_length, 19, "search measurement retains only query length");
assert.ok(!("query" in emittedEvents[0][2]), "raw search query is not emitted");
assert.ok("error_message_length" in emittedEvents[1][2] && !("error_message" in emittedEvents[1][2]), "error text is reduced to length");
assert.strictEqual(emittedEvents[2][2].has_campaign_parameters, true, "campaign presence is retained without raw query parameters");
assert.deepStrictEqual(JSON.parse(JSON.stringify(emittedEvents[3][2])), { tool_name: "safe-tool" }, "direct PII fields are dropped");

const returningAccepted = run("accepted");
assert.strictEqual(commandRows(returningAccepted, "consent", "default")[0][2].analytics_storage, "granted", "stored acceptance is applied before config");
assert.ok(!("wait_for_update" in commandRows(returningAccepted, "consent", "default")[0][2]), "stored choice does not create an unnecessary wait");

const returningDeclined = run("declined");
assert.strictEqual(commandRows(returningDeclined, "consent", "default")[0][2].analytics_storage, "denied", "stored rejection remains denied");
assert.ok(returningDeclined.inserted.some((node) => /googletagmanager/.test(node.src)), "stored rejection still loads the tag for consent modeling");

assert.ok(managerSource.includes("Accept analytics") && managerSource.includes("Reject analytics"), "consent UI has explicit accept and reject actions");
assert.ok(managerSource.includes("data-afro-cookie-consent-open"), "consent choices can be reopened from a visible control");
assert.ok(!lazySource.includes("G-8W6LCTFSK2"), "SalaryPadi measurement id is not present in AfroTools analytics");
assert.strictEqual((lazySource.match(/G-D859CGF391/g) || []).length, 1, "AfroTools uses one measurement id constant");

const requiredRoutes = [
  "fr/index.html",
  "fr/blog/index.html",
  "fr/terms-of-use/index.html",
  "sw/faragha/index.html",
  "sw/kenya/kikokotoo-kodi-mshahara/index.html",
  "sw/masharti/index.html"
];
requiredRoutes.forEach((route) => {
  const html = fs.readFileSync(path.join(ROOT, route), "utf8");
  assert.strictEqual((html.match(/\/assets\/js\/lazy-analytics\.js/g) || []).length, 1, `${route} must contain exactly one analytics loader`);
});

const cookiePolicy = fs.readFileSync(path.join(ROOT, "cookies", "index.html"), "utf8");
const privacyPolicy = fs.readFileSync(path.join(ROOT, "privacy", "index.html"), "utf8");
assert.ok(cookiePolicy.includes("data-afro-cookie-consent-open"), "cookie policy exposes a consent management control");
assert.ok(cookiePolicy.includes("cookieless") && privacyPolicy.includes("cookieless"), "policies disclose denied-consent measurement");

console.log("analytics-consent.test.js passed");
