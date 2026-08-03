"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const lazySource = fs.readFileSync(path.join(ROOT, "assets", "js", "lazy-analytics.js"), "utf8");
const managerSource = fs.readFileSync(path.join(ROOT, "assets", "js", "components", "analytics-consent-v2.js"), "utf8");
const authSource = fs.readFileSync(path.join(ROOT, "auth", "index.html"), "utf8");
const dashboardSource = fs.readFileSync(path.join(ROOT, "dashboard", "index.html"), "utf8");

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
  return (context.window.dataLayer || []).map((entry) => Array.from(entry));
}

function assertNativeGtagCommands(context, message) {
  assert.ok(
    context.window.dataLayer.every((entry) => !Array.isArray(entry) && Object.prototype.toString.call(entry) === "[object Arguments]"),
    message
  );
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
assertNativeGtagCommands(fresh, "GA commands use native Arguments records required by the live Google tag");
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
  "fresh visitors start with denied Consent Mode before GA configuration"
);
assert.strictEqual(commandRows(fresh, "config", "G-D859CGF391").length, 1, "GA4 is configured exactly once before a choice");
const initialConfig = commandRows(fresh, "config", "G-D859CGF391")[0][2];
assert.strictEqual(initialConfig.page_location, "https://afrotools.com/tools/salary-calculator/", "page URL excludes query and fragment");
assert.strictEqual(initialConfig.page_referrer, "https://search.example/", "referrer is reduced to its origin");
assert.ok(
  fresh.inserted.some((node) => node.src === "https://www.googletagmanager.com/gtag/js?id=G-D859CGF391"),
  "fresh denied visitors load the Google tag for cookieless measurement"
);
assert.ok(
  fresh.inserted.some((node) => node.src === "/assets/js/components/analytics-consent-v2.js"),
  "the explicit accept/reject consent manager is loaded"
);

fresh.setConsent("accepted");
fresh.listeners["afrotools:cookie-consent"]({ detail: { status: "accepted" } });
assert.strictEqual(commandRows(fresh, "config", "G-D859CGF391").length, 1, "accept does not duplicate GA4 configuration");
const freshConfig = commandRows(fresh, "config", "G-D859CGF391")[0][2];
assert.strictEqual(freshConfig.page_location, "https://afrotools.com/tools/salary-calculator/", "page URL excludes query and fragment");
assert.strictEqual(freshConfig.page_referrer, "https://search.example/", "referrer is reduced to its origin");
assert.strictEqual(freshConfig.allow_google_signals, false, "Google Signals stays disabled");
assert.strictEqual(freshConfig.allow_ad_personalization_signals, false, "ad personalization stays disabled");
assert.ok(
  fresh.inserted.some((node) => node.src === "https://www.googletagmanager.com/gtag/js?id=G-D859CGF391"),
  "accept loads the Google tag"
);

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
assert.strictEqual(fresh.window["ga-disable-G-D859CGF391"], false, "legacy global disable cannot suppress denied-state pings");
assert.ok(fresh.clarityCalls.some((call) => call[0] === "consent" && call[1] === false), "revocation clears Clarity consent");

fresh.window.gtag("event", "search_query", { query: "private@example.com", results_count: 2 });
fresh.window.gtag("event", "tool_error", { error_message: "Account private@example.com failed", error_type: "validation" });
fresh.window.gtag("event", "referral_source", { utm_source: "private@example.com", utm_campaign: "customer-name" });
fresh.window.gtag("event", "unsafe", { email: "private@example.com", phone: "+123", tool_name: "safe-tool" });
assertNativeGtagCommands(fresh, "sanitized event commands preserve the native gtag Arguments contract");
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
assert.ok(returningAccepted.inserted.some((node) => /googletagmanager/.test(node.src)), "stored acceptance loads the tag");

const returningDeclined = run("declined");
assert.strictEqual(commandRows(returningDeclined, "consent", "default")[0][2].analytics_storage, "denied", "stored rejection remains denied");
assert.ok(returningDeclined.inserted.some((node) => /googletagmanager/.test(node.src)), "stored rejection still loads the tag for consent modeling");

assert.ok(managerSource.includes("Accept analytics") && managerSource.includes("Reject analytics"), "consent UI has explicit accept and reject actions");
assert.ok(managerSource.includes("cookieless measurement"), "consent UI accurately discloses denied-state measurement");
assert.ok(managerSource.includes("data-afro-cookie-consent-open"), "consent choices can be reopened from a visible control");
assert.ok(managerSource.includes("if (!document.body)") && managerSource.includes("DOMContentLoaded"), "early consent bootstrap waits safely for the document body");
assert.ok(!lazySource.includes("G-8W6LCTFSK2"), "SalaryPadi measurement id is not present in AfroTools analytics");
assert.strictEqual((lazySource.match(/G-D859CGF391/g) || []).length, 1, "AfroTools uses one measurement id constant");
assert.ok(authSource.includes("window.gtag('event', 'login'"), "successful password sign-in emits the GA4 standard login event");
assert.ok(authSource.includes("method: method") && !authSource.includes("email: email"), "login analytics retain method without account PII");
assert.ok(dashboardSource.includes("queueDashboardAnalyticsEvent('login', { method:"), "OAuth callback emits the same metadata-only login event");
assert.ok(!dashboardSource.includes("dataLayer.push(['event', 'dashboard_auth_state'"), "dashboard analytics never queue invalid plain arrays");

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

// Campaign attribution. Standard campaign parameters must survive on
// page_location so GA4 can attribute traffic to its source; every other query
// parameter, and any campaign value that looks like personal data, is still
// discarded before it reaches Google.
function pageLocationFor(search) {
  const context = createSandbox("accepted");
  context.window.location.search = search;
  vm.runInNewContext(lazySource, context.sandbox, { filename: "lazy-analytics.js" });
  return commandRows(context, "config", "G-D859CGF391")[0][2].page_location;
}

assert.strictEqual(
  pageLocationFor("?utm_source=newsletter&utm_medium=email&utm_campaign=july"),
  "https://afrotools.com/tools/salary-calculator/?utm_source=newsletter&utm_medium=email&utm_campaign=july",
  "standard campaign parameters reach GA4 so traffic can be attributed"
);
assert.strictEqual(
  pageLocationFor("?gclid=ABC123"),
  "https://afrotools.com/tools/salary-calculator/?gclid=ABC123",
  "ad click identifiers reach GA4"
);
assert.strictEqual(
  pageLocationFor("?q=salary&sessionid=abc123&utm_source=bing"),
  "https://afrotools.com/tools/salary-calculator/?utm_source=bing",
  "non-campaign query parameters are still discarded"
);
assert.strictEqual(
  pageLocationFor("?utm_source=private@example.com"),
  "https://afrotools.com/tools/salary-calculator/",
  "campaign values that look like an e-mail address are dropped"
);
assert.strictEqual(
  pageLocationFor("?email=private@example.com"),
  "https://afrotools.com/tools/salary-calculator/",
  "personal data in the query string never reaches GA4"
);

console.log("analytics-consent.test.js passed");
